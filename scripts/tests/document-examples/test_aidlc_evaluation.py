"""Test exact repository examples with stdlib helpers and inert API/judge doubles."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import ast
import copy
import io
import json
import math
import re
import types
import unittest

PREFIXES = ("docs", "i18n/en/docusaurus-plugin-content-docs/current")
RELATIVE_DOCS = tuple(
    f"{prefix}/aidlc/{suffix}"
    for prefix in PREFIXES
    for suffix in ("enterprise/agent-versioning/governance-automation.md",
                   "toolchain/evaluation-framework.md")
)


def repository_root():
    # Works from repo cwd before installation and from __file__ ancestors in CI.
    for seed in (Path.cwd(), Path(__file__).resolve().parent):
        for candidate in (seed, *seed.parents):
            if ((candidate / "package.json").is_file()
                    and all((candidate / name).is_file() for name in RELATIVE_DOCS)):
                return candidate
    raise AssertionError("Repository root with all four AI-DLC documents was not found")


def code_blocks(path, language="python"):
    return re.findall(r"^```" + language + r"\n(.*?)^```\s*$", path.read_text(), re.M | re.S)

def load_example(path, marker, injected=None):
    matches = [b for b in code_blocks(path) if b.startswith(marker)]
    if len(matches) != 1:
        raise AssertionError((path, marker, len(matches)))
    tree = ast.parse(matches[0])
    # DeepEval imports are removed only for the worker; metric classes are mocks.
    if injected:
        tree.body = [n for n in tree.body if not isinstance(n, ast.ImportFrom)
                     or not (n.module or "").startswith("deepeval")]
    scope = dict(injected or {})
    exec(compile(tree, str(path), "exec"), scope)
    return scope

def specimen():
    trace = {"input": "Question", "output": "Answer", "retrieved_docs": ["A", "B"],
             "reference": "Reference"}
    spec = {key: "revision-1" for key in (
        "dataset_revision", "pipeline_revision", "prompt_version", "model_revision",
        "retriever_revision", "judge_revision", "rubric_revision",
        "evaluator_revision", "transformation_revision")}
    spec.update(judge_configuration={"provider": "mock", "model": "mock-judge",
                                      "parameters": {"temperature": 0}},
                metric_versions={"faithfulness": "mock-v1", "answer_relevancy": "mock-v1"},
                metric_configuration={"faithfulness": {"threshold": 0.85},
                                      "answer_relevancy": {"threshold": 0.80}})
    return trace, spec

class MemoryRunStore:
    """Inert durable-state model, not a database or exactly-once implementation."""
    def __init__(self, calls):
        self.calls = calls
        self.records, self.events, self.receipts = {}, {}, {}
        self.acknowledged = set()
        self.crash_after_store = False
        self.crash_after_send = False
        self.before_insert = None

    @staticmethod
    def identity(record):
        return json.dumps({k: v for k, v in record.items() if k != "scores"},
                          sort_keys=True, separators=(",", ":"), allow_nan=False)

    def load_result(self, *, tenant_id, trace_id, run_id):
        self.calls.append(("load", tenant_id, trace_id, run_id))
        return copy.deepcopy(self.records.get((tenant_id, run_id)))

    def store_result(self, record):
        self.calls.append(("store", copy.deepcopy(record)))
        key = (record["tenant_id"], record["evaluation_run_id"])
        if self.before_insert:
            self.before_insert(copy.deepcopy(record))
            self.before_insert = None
        existing = self.records.get(key)
        if existing is None:
            self.records[key] = copy.deepcopy(record)
        elif self.identity(existing) != self.identity(record):
            raise ValueError("Same run ID has a different input identity")
        if self.crash_after_store:
            self.crash_after_store = False
            raise RuntimeError("Crash after durable store before outbox")
        # A competing result may have different stochastic scores.
        return copy.deepcopy(self.records[key])

    def resume_outbox(self, record):
        self.calls.append(("resume_outbox", copy.deepcopy(record)))
        key = (record["tenant_id"], record["evaluation_run_id"])
        if self.records[key] != record:
            raise ValueError("Delivery must use the canonical stored record")
        if record["scores"]["faithfulness"] >= 0.85:
            return
        for kind in ("review", "alert"):
            event_id = (*key, kind)
            if event_id in self.events and self.events[event_id] != record:
                raise ValueError("Idempotency key reused with a different event payload")
            self.events.setdefault(event_id, copy.deepcopy(record))
        for kind in ("review", "alert"):
            event_id = (*key, kind)
            if event_id in self.acknowledged:
                continue
            # The mock recipient deduplicates an event resent after send/before ACK.
            if event_id not in self.receipts:
                self.receipts[event_id] = copy.deepcopy(self.events[event_id])
                self.calls.append((kind, copy.deepcopy(self.events[event_id])))
            if self.crash_after_send:
                self.crash_after_send = False
                raise RuntimeError("Crash after recipient accepted before outbox ACK")
            self.acknowledged.add(event_id)


class EnglishEvaluationTests(unittest.TestCase):
    locale = "en"

    def setUp(self):
        prefix = "docs" if self.locale == "ko" else "i18n/en/docusaurus-plugin-content-docs/current"
        source_root = repository_root()
        self.gov = source_root / prefix / "aidlc/enterprise/agent-versioning/governance-automation.md"
        self.evaluation = source_root / prefix / "aidlc/toolchain/evaluation-framework.md"
        self.cache = load_example(self.evaluation, "# cache-key.py")["evaluation_cache_key"]
        self.compare = load_example(self.gov, "# paired-exact-match.py")["compare_exact_match"]
        self.rollback = load_example(self.gov, "# rollback-controller.py")["rollback_prompt"]
        self.trace, self.spec = specimen()

    def key(self, trace=None, spec=None, tenant="t1"):
        return self.cache(tenant_id=tenant, trace=self.trace if trace is None else trace,
                          spec=self.spec if spec is None else spec)

    def test_paired_statistics_known_discordant_cases(self):
        base = {str(i): 0 for i in range(6)}
        new = {str(i): 1 for i in range(6)}
        result = self.compare(base, new)
        self.assertEqual(result["paired_p_value"], 0.03125)
        self.assertEqual(result["delta_percentage_points"], 100)
        self.assertNotIn("pass", result)
        reverse = self.compare(new, base)
        self.assertEqual(reverse["paired_p_value"], 0.03125)
        self.assertEqual(reverse["delta_percentage_points"], -100)
        self.assertEqual(self.compare(new, new)["paired_p_value"], 1)

    def test_paired_statistics_reject_invalid_and_different_cases(self):
        for a, b in [({}, {}), ([], []), ({"a": 1}, {"b": 1}),
                     ({"a": True}, {"a": 1}), ({"a": "1"}, {"a": 1}),
                     ({"a": math.nan}, {"a": 1}), ({"a": math.inf}, {"a": 1}),
                     ({"a": 0.5}, {"a": 1}), ({1: 1}, {1: 1})]:
            with self.subTest(a=a, b=b), self.assertRaises(ValueError):
                self.compare(a, b)

    def test_cache_canonical_objects_but_ordered_contexts(self):
        reordered = dict(reversed(list(self.spec.items())))
        self.assertEqual(self.key(), self.key(spec=reordered))
        trace = copy.deepcopy(self.trace)
        trace["retrieved_docs"].reverse()
        self.assertNotEqual(self.key(), self.key(trace=trace))
        self.assertNotEqual(self.key(), self.key(tenant="t2"))

    def test_every_score_determining_revision_changes_key(self):
        base = self.key()
        for field in self.spec:
            changed = copy.deepcopy(self.spec)
            if isinstance(changed[field], str):
                changed[field] = "revision-2"
            elif field == "judge_configuration":
                changed[field]["parameters"]["temperature"] = 0.2
            elif field == "metric_versions":
                changed[field]["faithfulness"] = "mock-v2"
            else:
                changed[field]["faithfulness"]["threshold"] = 0.9
            with self.subTest(field=field):
                self.assertNotEqual(base, self.key(spec=changed))
        for field in self.trace:
            changed = copy.deepcopy(self.trace)
            changed[field] = ["C"] if field == "retrieved_docs" else "Changed"
            with self.subTest(field=field):
                self.assertNotEqual(base, self.key(trace=changed))

    def test_cache_rejects_missing_and_nonfinite_inputs(self):
        for field in self.spec:
            changed = copy.deepcopy(self.spec)
            del changed[field]
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.key(spec=changed)
        for bad in [math.nan, math.inf, -math.inf, object(), {1: "value"}]:
            changed = copy.deepcopy(self.spec)
            changed["judge_configuration"]["parameters"]["bad"] = bad
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                self.key(spec=changed)
        for value in [None, True, "A", [1]]:
            trace = copy.deepcopy(self.trace)
            trace["retrieved_docs"] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.key(trace=trace)
        for version in ["", None, True]:
            changed = copy.deepcopy(self.spec)
            changed["metric_versions"]["faithfulness"] = version
            with self.subTest(version=version), self.assertRaises(ValueError):
                self.key(spec=changed)

    def worker(self, *, faithfulness=0.9, relevancy=0.9, fail_metric=False):
        calls = []
        class Case:
            def __init__(self, **kwargs):
                calls.append(("case", kwargs))
        def metric_class(name, score):
            class Metric:
                def __init__(self, **kwargs):
                    calls.append(("construct", name, kwargs))
                    self.score = score
                def measure(self, case):
                    calls.append(("measure", name))
                    if fail_metric:
                        raise RuntimeError("mock evaluation failure")
            return Metric
        scope = load_example(self.evaluation, "# sampling-worker.py", {
            "FaithfulnessMetric": metric_class("faithfulness", faithfulness),
            "AnswerRelevancyMetric": metric_class("answer_relevancy", relevancy),
            "LLMTestCase": Case, "evaluation_cache_key": self.cache})
        return scope, calls

    def worker_args(self, calls, store=None):
        store = store or MemoryRunStore(calls)
        store.calls = calls
        prepared_trace = copy.deepcopy(self.trace)
        prepared_trace["input"] = "REDACTED"
        def authorize(tenant, trace):
            calls.append(("authorize", tenant, trace)); return True
        def authorize_run(tenant, trace, run):
            calls.append(("authorize_run", tenant, trace, run)); return True
        def fetch(tenant, trace):
            calls.append(("fetch", tenant, trace))
            return {"tenant_id": tenant, "trace_id": trace, "input": "PRIVATE"}
        def prepare(raw, *, tenant_id, spec):
            calls.append(("prepare",))
            return {"approved": True, "tenant_id": tenant_id, "trace_id": "trace-1",
                    "transformation_revision": spec["transformation_revision"],
                    "trace": prepared_trace}
        def resolve(**kwargs):
            calls.append(("resolve",)); return "mock-only"
        return dict(tenant_id="t1", run_id="run-1", spec=copy.deepcopy(self.spec),
                    sampling={"selected": True, "inclusion_probability": 0.05, "stratum": "ordinary"},
                    authorize_trace=authorize, authorize_run=authorize_run,
                    fetch_trace=fetch, prepare_for_judge=prepare, resolve_judge=resolve,
                    load_result=store.load_result, store_result=store.store_result,
                    resume_outbox=store.resume_outbox)

    def test_worker_transformation_precedes_mock_judge_and_stores_run_identity(self):
        scope, calls = self.worker()
        args = self.worker_args(calls)
        result = scope["evaluate_trace"]("trace-1", **args)
        names = [x[0] for x in calls]
        self.assertLess(names.index("prepare"), names.index("resolve"))
        self.assertLess(names.index("prepare"), names.index("measure"))
        self.assertEqual(next(x[1]["input"] for x in calls if x[0] == "case"), "REDACTED")
        self.assertEqual(result["evaluation_run_id"], "run-1")
        self.assertEqual(result["tenant_id"], "t1")
        self.assertEqual(result["sampling"]["inclusion_probability"], 0.05)
        self.assertEqual(len(result["cache_key"]), 64)
        self.assertNotIn("review", names)

    def test_denial_and_invalid_payload_never_reach_mock_judge(self):
        for kind in ["denied", "cross_tenant", "unapproved", "bad_transform", "bad_spec", "bad_sampling"]:
            scope, calls = self.worker()
            args = self.worker_args(calls)
            if kind == "denied":
                args["authorize_trace"] = lambda *a: False
            elif kind == "cross_tenant":
                args["fetch_trace"] = lambda *a: {"tenant_id": "t2", "trace_id": "trace-1"}
            elif kind == "unapproved":
                args["prepare_for_judge"] = lambda *a, **kw: {"approved": False}
            elif kind == "bad_transform":
                args["spec"]["transformation_revision"] = ""
            elif kind == "bad_spec":
                args["spec"]["metric_configuration"]["faithfulness"]["threshold"] = 0.75
            else:
                args["sampling"]["inclusion_probability"] = math.nan
            with self.subTest(kind=kind), self.assertRaises((PermissionError, ValueError)):
                scope["evaluate_trace"]("trace-1", **args)
            self.assertFalse(any(c[0] in ("construct", "measure", "store") for c in calls))

    def test_original_finite_score_validation_remains_fail_closed(self):
        for value in [True, None, "0.9", math.nan, math.inf, -math.inf, -0.01, 1.01]:
            scope, calls = self.worker(relevancy=value)
            with self.subTest(value=value), self.assertRaises(ValueError):
                scope["evaluate_trace"]("trace-1", **self.worker_args(calls))
            self.assertFalse(any(c[0] in ("store", "review", "alert") for c in calls))

    def test_evaluator_error_is_not_a_low_score_or_success(self):
        scope, calls = self.worker(fail_metric=True)
        with self.assertRaises(RuntimeError):
            scope["evaluate_trace"]("trace-1", **self.worker_args(calls))
        self.assertFalse(any(c[0] in ("store", "review", "alert") for c in calls))

    def test_low_score_requests_label_review_instead_of_promotion(self):
        scope, calls = self.worker(faithfulness=0.84)
        result = scope["evaluate_trace"]("trace-1", **self.worker_args(calls))
        self.assertEqual(result["scores"]["faithfulness"], 0.84)
        self.assertEqual([x[0] for x in calls][-4:], ["store", "resume_outbox", "review", "alert"])
        self.assertNotIn("reference_answer", result)

    def test_sampler_records_union_probability_and_boundary(self):
        scope, calls = self.worker()
        ordinary = types.SimpleNamespace(error=False, user_rating=None, estimated_cost_usd=0.1)
        sample = scope["sampling_decision"]
        self.assertTrue(sample(ordinary, draw=lambda: 0.049)["selected"])
        self.assertFalse(sample(ordinary, draw=lambda: 0.05)["selected"])
        priority = types.SimpleNamespace(error=True, user_rating=1, estimated_cost_usd=1)
        result = sample(priority, draw=lambda: self.fail("Priority union should not need randomness"))
        self.assertEqual(result, {"selected": True, "inclusion_probability": 1.0,
                                  "stratum": "priority_union"})
        for bad in [math.nan, math.inf, -0.01, 1, True]:
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                sample(ordinary, draw=lambda: bad)

    def rollback_fixture(self):
        calls = []
        class Attempt:
            completed_result = None
            project = "p1"
            prompt_name = "financial-analysis"
            expected_version = 6
            target_version = 3  # Deliberately not current minus one.
            approval_record_ref = "approved-record-1"
            def __enter__(self): calls.append(("lock",)); return self
            def __exit__(self, *a): calls.append(("unlock",))
            def record(self, value): calls.append(("record", value)); return value
            def record_intent(self): calls.append(("intent",))
            def mark_uncertain(self): calls.append(("uncertain",))
        attempt = Attempt()
        class Control:
            def claim(self, alert): calls.append(("authorize",)); return attempt
        class Client:
            current = 6
            fail_update = False
            def get_prompt(self, name, **kw):
                calls.append(("get", name, kw))
                return types.SimpleNamespace(version=kw.get("version", self.current))
            def update_prompt(self, **kw):
                calls.append(("update", kw))
                if self.fail_update: raise TimeoutError("mock timeout")
                self.current = kw["version"]
        alert = {"status": "firing", "labels": {"project": "p1",
                 "prompt_name": "financial-analysis", "prompt_version": "6"}}
        return alert, Client(), Control(), attempt, calls

    def test_rollback_uses_approved_target_and_reports_only_registry_verification(self):
        alert, client, control, attempt, calls = self.rollback_fixture()
        result = self.rollback(alert, client=client, control=control)
        self.assertEqual(result, {"status": "registry_label_verified",
                                 "version": 3, "traffic_recovery": "pending"})
        update = next(c[1] for c in calls if c[0] == "update")
        self.assertEqual(update, {"name": "financial-analysis", "version": 3,
                                  "new_labels": ["production"]})
        self.assertLess([c[0] for c in calls].index("intent"),
                        [c[0] for c in calls].index("update"))
        self.assertTrue(all(c[2]["cache_ttl_seconds"] == 0 for c in calls if c[0] == "get"))

    def test_rollback_resolved_stale_duplicate_or_unauthorized_does_not_write(self):
        for kind in ["resolved", "stale", "duplicate", "unauthorized", "wrong_target", "wrong_project"]:
            alert, client, control, attempt, calls = self.rollback_fixture()
            if kind == "resolved": alert["status"] = "resolved"
            elif kind == "stale": client.current = 8
            elif kind == "duplicate": attempt.completed_result = {"status": "previous_result"}
            elif kind == "wrong_target": attempt.target_version = True
            elif kind == "wrong_project": attempt.project = "p2"
            else:
                def denied(alert): raise PermissionError("mock denied")
                control.claim = denied
            if kind in ["unauthorized", "wrong_target", "wrong_project"]:
                with self.subTest(kind=kind), self.assertRaises((ValueError, PermissionError)):
                    self.rollback(alert, client=client, control=control)
            else:
                self.rollback(alert, client=client, control=control)
            self.assertFalse(any(c[0] == "update" for c in calls))

    def test_rollback_timeout_requires_reconciliation(self):
        alert, client, control, attempt, calls = self.rollback_fixture()
        client.fail_update = True
        with self.assertRaises(TimeoutError):
            self.rollback(alert, client=client, control=control)
        self.assertIn(("uncertain",), calls)
        self.assertFalse(any(c[0] == "record" for c in calls))

    def assert_no_judge_or_delivery(self, calls):
        self.assertFalse(any(c[0] in (
            "resolve", "case", "construct", "measure", "store",
            "resume_outbox", "review", "alert") for c in calls), calls)

    def completed_run(self, faithfulness=0.84):
        scope, calls = self.worker(faithfulness=faithfulness)
        store = MemoryRunStore(calls)
        record = scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
        return store, record

    def test_recovery_crash_after_store_reuses_scores_without_any_judge_work(self):
        scope, calls = self.worker(faithfulness=0.84)
        store = MemoryRunStore(calls)
        store.crash_after_store = True
        with self.assertRaisesRegex(RuntimeError, "after durable store"):
            scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
        self.assertEqual(store.events, {})
        retry, retry_calls = self.worker(faithfulness=0.83, fail_metric=True)
        result = retry["evaluate_trace"]("trace-1", **self.worker_args(retry_calls, store))
        self.assertEqual(result["scores"]["faithfulness"], 0.84)
        self.assertFalse(any(c[0] in ("resolve", "case", "construct", "measure", "store")
                             for c in retry_calls))
        self.assertEqual(len(store.receipts), 2)
        self.assertTrue(all(r["scores"]["faithfulness"] == 0.84
                            for r in store.receipts.values()))

    def test_recovery_crash_after_send_resumes_same_idempotent_outbox_events(self):
        scope, calls = self.worker(faithfulness=0.84)
        store = MemoryRunStore(calls)
        store.crash_after_send = True
        with self.assertRaisesRegex(RuntimeError, "before outbox ACK"):
            scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
        self.assertEqual(len(store.events), 2)
        self.assertEqual(len(store.receipts), 1)
        self.assertEqual(len(store.acknowledged), 0)
        retry, retry_calls = self.worker(faithfulness=0.83, fail_metric=True)
        result = retry["evaluate_trace"]("trace-1", **self.worker_args(retry_calls, store))
        self.assertEqual(result["scores"]["faithfulness"], 0.84)
        self.assertEqual(len(store.events), 2)
        self.assertEqual(len(store.receipts), 2)
        self.assertEqual(len(store.acknowledged), 2)
        self.assertNotIn("review", [c[0] for c in retry_calls])
        self.assertNotIn("measure", [c[0] for c in retry_calls])

    def test_completed_retry_requires_trace_and_run_authorization(self):
        for denied in ("authorize_trace", "authorize_run"):
            store, _ = self.completed_run()
            scope, calls = self.worker(fail_metric=True)
            args = self.worker_args(calls, store)
            args[denied] = lambda *args: False
            with self.subTest(denied=denied), self.assertRaises(PermissionError):
                scope["evaluate_trace"]("trace-1", **args)
            self.assertNotIn("load", [c[0] for c in calls])
            self.assert_no_judge_or_delivery(calls)

    def test_completed_run_rejects_every_mismatched_identity_before_judge(self):
        for field in ("tenant_id", "trace_id", "evaluation_run_id", "cache_key",
                      "spec", "sampling", "schema_version"):
            store, record = self.completed_run()
            changed = copy.deepcopy(record)
            if field == "spec":
                changed[field]["prompt_version"] = "different"
            elif field == "sampling":
                changed[field] = {"selected": True, "stratum": "priority_union",
                                  "inclusion_probability": 1.0}
            elif field == "schema_version":
                changed[field] = True
            else:
                changed[field] = "different"
            store.records[("t1", "run-1")] = changed
            scope, calls = self.worker(fail_metric=True)
            with self.subTest(field=field), self.assertRaises(ValueError):
                scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
            self.assert_no_judge_or_delivery(calls)

    def test_same_run_changed_payload_spec_or_sampling_requires_new_run_id(self):
        for change in ("payload", "spec", "sampling"):
            store, _ = self.completed_run()
            original_trace = copy.deepcopy(self.trace)
            if change == "payload":
                self.trace["output"] = "Changed answer"
            scope, calls = self.worker(fail_metric=True)
            args = self.worker_args(calls, store)
            if change == "spec":
                args["spec"]["judge_revision"] = "new-judge"
            elif change == "sampling":
                args["sampling"] = {"selected": True, "stratum": "priority_union",
                                    "inclusion_probability": 1.0}
            try:
                with self.subTest(change=change), self.assertRaises(ValueError):
                    scope["evaluate_trace"]("trace-1", **args)
                self.assert_no_judge_or_delivery(calls)
            finally:
                self.trace = original_trace

    def test_stored_scores_must_be_complete_finite_and_in_range(self):
        for invalid in (True, None, "0.84", math.nan, math.inf, -math.inf, -0.01, 1.01):
            for metric in ("faithfulness", "answer_relevancy"):
                store, _ = self.completed_run()
                store.records[("t1", "run-1")]["scores"][metric] = invalid
                scope, calls = self.worker(fail_metric=True)
                with self.subTest(metric=metric, invalid=invalid), self.assertRaises(ValueError):
                    scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
                self.assert_no_judge_or_delivery(calls)
        for scores in ({}, {"faithfulness": 0.84},
                       {"faithfulness": 0.84, "answer_relevancy": 0.9, "extra": 1}):
            store, _ = self.completed_run()
            store.records[("t1", "run-1")]["scores"] = scores
            scope, calls = self.worker(fail_metric=True)
            with self.subTest(scores=scores), self.assertRaises(ValueError):
                scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
            self.assert_no_judge_or_delivery(calls)

    def test_lookup_errors_and_malformed_records_are_not_cache_misses(self):
        for malformed in (False, [], {}, {"scores": {}}):
            scope, calls = self.worker(fail_metric=True)
            args = self.worker_args(calls)
            args["load_result"] = lambda **kwargs: malformed
            with self.subTest(malformed=malformed), self.assertRaises(ValueError):
                scope["evaluate_trace"]("trace-1", **args)
            self.assert_no_judge_or_delivery(calls)
        scope, calls = self.worker(fail_metric=True)
        args = self.worker_args(calls)
        def unavailable(**kwargs):
            raise OSError("Mock result store unavailable")
        args["load_result"] = unavailable
        with self.assertRaises(OSError):
            scope["evaluate_trace"]("trace-1", **args)
        self.assert_no_judge_or_delivery(calls)

    def test_concurrent_insert_returns_winner_and_delivers_only_winner_scores(self):
        for winner_score, loser_score in ((0.91, 0.84), (0.84, 0.91)):
            scope, calls = self.worker(faithfulness=loser_score)
            store = MemoryRunStore(calls)
            def race(candidate):
                winner = copy.deepcopy(candidate)
                winner["scores"]["faithfulness"] = winner_score
                store.records[("t1", "run-1")] = winner
            store.before_insert = race
            result = scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
            with self.subTest(winner=winner_score):
                self.assertEqual(result["scores"]["faithfulness"], winner_score)
                self.assertEqual(store.records[("t1", "run-1")], result)
                self.assertEqual(len(store.receipts), 2 if winner_score < 0.85 else 0)
                self.assertTrue(all(r["scores"]["faithfulness"] == winner_score
                                    for r in store.receipts.values()))

    def test_concurrent_same_id_different_payload_fails_without_delivery(self):
        scope, calls = self.worker()
        store = MemoryRunStore(calls)
        def race(candidate):
            candidate["cache_key"] = "different-payload"
            store.records[("t1", "run-1")] = candidate
        store.before_insert = race
        with self.assertRaisesRegex(ValueError, "different input identity"):
            scope["evaluate_trace"]("trace-1", **self.worker_args(calls, store))
        self.assertFalse(any(c[0] in ("resume_outbox", "review", "alert") for c in calls))

    def test_caller_validates_insert_winner_before_outbox_delivery(self):
        for change in ("tenant", "cache_key", "spec", "sampling", "invalid_score", "missing"):
            scope, calls = self.worker()
            args = self.worker_args(calls)
            def faulty_store(candidate):
                if change == "missing":
                    return None
                if change == "tenant":
                    candidate["tenant_id"] = "t2"
                elif change == "cache_key":
                    candidate["cache_key"] = "different-payload"
                elif change == "spec":
                    candidate["spec"]["prompt_version"] = "different"
                elif change == "sampling":
                    candidate["sampling"]["inclusion_probability"] = 1.0
                else:
                    candidate["scores"]["faithfulness"] = math.nan
                return candidate
            args["store_result"] = faulty_store
            with self.subTest(change=change), self.assertRaises(ValueError):
                scope["evaluate_trace"]("trace-1", **args)
            self.assertFalse(any(c[0] in ("resume_outbox", "review", "alert") for c in calls))

    def test_completed_run_still_requires_current_transformation_approval(self):
        store, _ = self.completed_run()
        scope, calls = self.worker(fail_metric=True)
        args = self.worker_args(calls, store)
        args["prepare_for_judge"] = lambda *args, **kwargs: {"approved": False}
        with self.assertRaises(PermissionError):
            scope["evaluate_trace"]("trace-1", **args)
        self.assertNotIn("load", [c[0] for c in calls])
        self.assert_no_judge_or_delivery(calls)

    def test_outbox_hook_cannot_mutate_returned_or_stored_canonical_record(self):
        store, original = self.completed_run()
        scope, calls = self.worker(fail_metric=True)
        args = self.worker_args(calls, store)
        def mutate_delivery_copy(record):
            record["scores"]["faithfulness"] = 0.1
            record["spec"]["prompt_version"] = "mutated"
        args["resume_outbox"] = mutate_delivery_copy
        result = scope["evaluate_trace"]("trace-1", **args)
        self.assertEqual(result, original)
        self.assertEqual(store.records[("t1", "run-1")], original)

class KoreanEvaluationTests(EnglishEvaluationTests):
    locale = "ko"

if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    captured = io.StringIO()
    result = unittest.TextTestRunner(stream=captured, verbosity=0).run(suite)
    summary = {
        "tests_run": result.testsRun, "failures": len(result.failures),
        "errors": len(result.errors), "success": result.wasSuccessful(),
        "scope": "Exact repository examples; stdlib helpers and mock-only APIs/judges",
    }
    if not result.wasSuccessful():
        summary["details"] = [{"test": str(test), "failure": failure}
                              for test, failure in result.failures + result.errors]
    print(json.dumps(summary))
    raise SystemExit(not result.wasSuccessful())
