"""Run actual KO/EN release-document modules using only stdlib/offline doubles.

Run from repository root. Copy this file alone into scripts/tests/document-examples/.
No snippet, baseline, audit cache, SDK, CRD model or network dependency is permitted.
Missing/ambiguous named fences fail; there is no snapshot fallback or skip.
"""
import ast
import builtins
import contextlib
import copy
from datetime import datetime, timezone
from decimal import Decimal
from functools import lru_cache
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import tarfile
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

ROOT = Path.cwd()
DOCUMENTS = {
    "evaluation": "agentic-ai-platform/reference-architecture/model-lifecycle/continuous-training/evaluation-rollout.md",
    "sagemaker": "agentic-ai-platform/reference-architecture/integrations/sagemaker-eks-integration.md",
}
PREFIXES = {"ko": "docs", "en": "i18n/en/docusaurus-plugin-content-docs/current"}
MODULES = {
    "eval_gate.py": "evaluation",
    "roi_analysis.py": "evaluation",
    "eks_model_loader.py": "sagemaker",
    "model_artifact.py": "sagemaker",
    "drift_detection_handler.py": "sagemaker",
    "cost_monitoring.py": "sagemaker",
    "multi_region_deployment.py": "sagemaker",
    "monitor_canary.py": "evaluation",
}
NOW = datetime(2026, 9, 19, tzinfo=timezone.utc)
ARN = "arn:aws:sagemaker:us-west-2:123456789012:model-package/reviewed/1"
ALARM = "arn:aws:cloudwatch:us-west-2:123456789012:alarm:DataQualityViolation"
TOPIC = "arn:aws:sns:us-west-2:123456789012:quality"
RELEASE = {
    "source_uri": "s3://fixture-models/release/model.tar.gz",
    "artifact_sha256": "a" * 64,
    "artifact_version_id": "source-version",
    "artifact_format": "hf-causal-lm-tar-v1",
}
TARGET = {"region": "ap-northeast-2", "bucket": "fixture-replica",
          "key": "release/model.tar.gz", "version_id": "replica-version"}


@lru_cache(maxsize=4)
def document(locale, kind):
    relative = Path(PREFIXES[locale]) / DOCUMENTS[kind]
    filename = ROOT / relative
    if not filename.is_file():
        raise AssertionError(f"Run from integration/repository cwd; missing {relative}")
    text = filename.read_text(encoding="utf-8")
    blocks, opened = [], None
    lines = text.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if opened is None:
            match = re.match(r"^(`{3,}|~{3,})([^\n]*)\r?\n?$", line)
            if match:
                opened = (match[1], match[2].strip(), index)
        elif re.fullmatch(re.escape(opened[0][0]) + "{" + str(len(opened[0])) + r",}\s*", line):
            fence, info, start = opened
            blocks.append({"info": info, "body": "".join(lines[start + 1:index]),
                           "start": start + 2, "end": index, "heading_start": start})
            opened = None
    if opened is not None:
        raise AssertionError(f"{relative}: unclosed fence at line {opened[2] + 1}")
    return relative, text, blocks


def extract(locale, name):
    relative, text, blocks = document(locale, MODULES[name])
    marker = re.compile(r"^#\s*" + re.escape(name) + r"(?=\s|$)", re.M)
    title = re.compile(r"\btitle=[\"']" + re.escape(name) + r"[\"']")
    found = [b for b in blocks if b["info"].split(maxsplit=1)[0:1] == ["python"]
             and (marker.search(b["body"]) or title.search(b["info"]))]
    if len(found) != 1:
        raise AssertionError(f"{relative}: expected exactly one named {name} Python fence; found {len(found)}. "
                             f"Keep '# {name}' or title=\"{name}\" on the corrected module.")
    block = found[0]
    ast.parse(block["body"], filename=f"{relative}:{block['start']}")
    return relative, text, block


def canary_rule_expression(locale, kind, name):
    """Read only the named rule's expression; this is not a general YAML parser."""
    relative, _, blocks = document(locale, "evaluation")
    candidates = [block for block in blocks if block["info"] == "yaml"
                  and "# Custom exporter metrics;" in block["body"]]
    if len(candidates) != 1:
        raise AssertionError(f"{relative}: expected one custom canary rule fence")
    lines = candidates[0]["body"].splitlines()
    entries = [(i, match) for i, line in enumerate(lines)
               if (match := re.fullmatch(r"(\s*)-\s+(record|alert):\s*(\S+)\s*", line))]
    found = []
    for offset, (index, match) in enumerate(entries):
        if (match[2], match[3]) != (kind, name):
            continue
        end = entries[offset + 1][0] if offset + 1 < len(entries) else len(lines)
        for pos in range(index + 1, end):
            expression = re.fullmatch(r"(\s*)expr:\s*(.*?)\s*", lines[pos])
            if expression:
                value = expression[2]
                if value in ("|", ">", "|-", ">-"):
                    continuations = []
                    for line in lines[pos + 1:end]:
                        if line.strip() and len(line) - len(line.lstrip()) <= len(expression[1]):
                            break
                        continuations.append(line.strip())
                    value = " ".join(continuations)
                found.append(value)
    if len(found) != 1:
        raise AssertionError(f"{relative}: expected one {kind} expression for {name}; found {len(found)}")
    return found[0]


def canary_error_policy(locale):
    """Recognize the documented alert grammar and expose its numeric parameters.

    This static contract rejects unrecognized expressions. It is not a PromQL engine;
    promtool fixtures independently cover evaluation, label matching and alert timing.
    """
    expression = re.sub(r"\s+", "", canary_rule_expression(locale, "alert", "CanaryErrorRateHigh"))
    number = r"(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?"
    canary = re.escape('canary:error_fraction{track="canary"}')
    stable = re.escape('canary:error_fraction{track="stable"}')
    grammar = (rf"\({canary}>ignoring\(track\)clamp_min\(({number})\*{stable},({number})\)\)"
               rf"or\({canary}>({number})\)")
    match = re.fullmatch(grammar, expression)
    if not match:
        raise AssertionError("Alert must retain relative comparison with a clamp_min floor and an absolute ceiling")
    return tuple(float(value) for value in match.groups())


class FakeClientError(Exception):
    def __init__(self, response, operation="PutItem"):
        super().__init__(response["Error"]["Code"])
        self.response, self.operation_name = response, operation


class FakeApiException(Exception):
    def __init__(self, status=None):
        super().__init__(str(status))
        self.status = status


class Clock:
    def __init__(self):
        self.elapsed = 0

    def monotonic(self):
        self.elapsed += 1
        if self.elapsed > 10_000:
            raise AssertionError("Unbounded fixture loop")
        return self.elapsed

    def sleep(self, seconds):
        self.elapsed += seconds


class FrozenDateTime(datetime):
    @classmethod
    def now(cls, tz=None):
        return NOW.astimezone(tz) if tz else NOW.replace(tzinfo=None)


class FakeDynamoTable:
    """Emulates conditional creation; dropping the condition permits overwrites."""
    def __init__(self, error_code=None):
        self.items, self.calls = {}, []
        self.error_code = error_code

    def put_item(self, Item, ConditionExpression=None):
        self.calls.append((copy.deepcopy(Item), ConditionExpression))
        if self.error_code:
            raise FakeClientError({"Error": {"Code": self.error_code}})
        key = Item["request_id"]
        if ConditionExpression == "attribute_not_exists(request_id)" and key in self.items:
            raise FakeClientError({"Error": {"Code": "ConditionalCheckFailedException"}})
        if ConditionExpression not in (None, "attribute_not_exists(request_id)"):
            raise AssertionError(f"Unsupported fixture condition: {ConditionExpression}")
        self.items[key] = copy.deepcopy(Item)
        return {}


class OfflineRuntime:
    """Doubles are local to one module; no SDK import or global sys.modules rewrite."""
    SAFE_IMPORTS = {"argparse", "json", "math", "pathlib", "statistics", "hashlib",
                    "tarfile", "tempfile", "re", "urllib.parse", "decimal"}

    def __init__(self, table=None):
        self.table = table if table is not None else FakeDynamoTable()
        self.clock = Clock()
        self.client_calls = []
        self.environment = {"ALLOWED_TOPIC_ARN": TOPIC, "ALLOWED_ALARM_ARN": ALARM,
                            "APPROVAL_REQUEST_TABLE": "fixture-approval-requests"}

    def resource(self, name):
        if name != "dynamodb":
            raise AssertionError(f"Unexpected AWS resource request: {name}")
        def table(table_name):
            if table_name != self.environment["APPROVAL_REQUEST_TABLE"]:
                raise AssertionError("Wrong approval-request table")
            return self.table
        return SimpleNamespace(Table=table)

    def client(self, *args, **kwargs):
        self.client_calls.append((args, kwargs))
        raise AssertionError("Cloud/model client call attempted; only explicit local fakes are allowed")

    def import_module(self, name, globals=None, locals=None, fromlist=(), level=0):
        if level:
            raise AssertionError("Relative imports are not part of this fence contract")
        if name == "boto3":
            return SimpleNamespace(resource=self.resource, client=self.client)
        if name == "botocore.exceptions":
            return SimpleNamespace(ClientError=FakeClientError)
        if name == "kubernetes.client.exceptions":
            return SimpleNamespace(ApiException=FakeApiException)
        if name == "time":
            return SimpleNamespace(monotonic=self.clock.monotonic, sleep=self.clock.sleep)
        if name == "datetime":
            return SimpleNamespace(datetime=FrozenDateTime, timezone=timezone)
        if name == "os":
            return SimpleNamespace(environ=self.environment)
        if name not in self.SAFE_IMPORTS:
            raise AssertionError(f"Blocked non-fixture import: {name}")
        return builtins.__import__(name, globals, locals, fromlist, level)

    def execute(self, locale, name, *, main=False, argv=None):
        relative, text, block = extract(locale, name)
        namespace = {"__name__": "__main__" if main else "document_example",
                     "__file__": f"{relative}:{block['start']}",
                     "__builtins__": {**vars(builtins), "__import__": self.import_module}}
        output = io.StringIO()
        status = 0
        with contextlib.redirect_stdout(output), patch.object(sys, "argv", argv or [name]):
            try:
                # Execute the whole actual module; do not trim top-level work or rewrite its AST.
                exec(compile(block["body"], namespace["__file__"], "exec"), namespace)
            except SystemExit as exc:
                if not main:
                    raise AssertionError("Document module exited while importing") from exc
                status = exc.code
        return namespace, output.getvalue(), status


OBSERVATION_METRICS = (
    "last_request_observation_timestamp_seconds",
    "last_evaluation_observation_timestamp_seconds",
)


def canary_payload():
    rows = []
    for track in ("stable", "canary"):
        for name, value in {
            "quality": 0.9, "p99_seconds": 1,
            "error_fraction": 0 if track == "stable" else 0.0005,
            "requests": 200, "evaluations": 30,
            OBSERVATION_METRICS[0]: 990,
            OBSERVATION_METRICS[1]: 980,
            "collection_complete": 1,
        }.items():
            rows.append({"metric": {"__name__": "canary:" + name, "namespace": "model-serving",
                                    "rollout": "glm5", "track": track}, "value": [1000, str(value)]})
    return {"status": "success", "data": {"resultType": "vector", "result": rows}}


def canary_row(payload, track, metric):
    return next(row for row in payload["data"]["result"]
                if row["metric"]["track"] == track and row["metric"]["__name__"] == "canary:" + metric)


class MonitorRuntime(OfflineRuntime):
    """Fake query transport refreshes envelope time but never observation values."""
    def __init__(self, payload=None):
        super().__init__()
        self.payload = canary_payload() if payload is None else copy.deepcopy(payload)
        self.queries = []

    def now(self):
        return 1000 + self.clock.elapsed

    def urlopen(self, url, *, timeout):
        parsed = urlsplit(url)
        if (parsed.scheme, parsed.netloc, parsed.path) != ("http", "monitor.invalid", "/api/v1/query"):
            raise AssertionError("The monitor must use only the explicit local query fake")
        if timeout != 10:
            raise AssertionError("Keep the bounded query timeout")
        self.queries.append((url, self.now()))
        payload = copy.deepcopy(self.payload)
        for row in payload.get("data", {}).get("result", []):
            row["value"][0] = self.now()
        return io.BytesIO(json.dumps(payload).encode())

    def import_module(self, name, globals=None, locals=None, fromlist=(), level=0):
        if name == "urllib.request":
            return SimpleNamespace(urlopen=self.urlopen)
        if name == "time":
            return SimpleNamespace(monotonic=self.clock.monotonic, sleep=self.clock.sleep, time=self.now)
        return super().import_module(name, globals, locals, fromlist, level)


def eval_run():
    return {"schema_version": 1, "dataset_sha256": "a" * 64,
            "evaluation_protocol_sha256": "b" * 64, "judge_revision": "judge-pinned",
            "embedding_revision": "embedding-pinned", "ragas_version": "0.2.15",
            "model_revision": "baseline-pinned", "samples": [
                {"id": str(i), "completed": True, "faithfulness": 0.9,
                 "answer_relevancy": 0.9, "latency_ms": 100} for i in range(500)]}


class FakeRegistry:
    def __init__(self, events, status="Approved"):
        self.events = events
        self.meta = SimpleNamespace(region_name="us-west-2")
        self.package = {"ModelPackageArn": ARN, "ModelPackageStatus": "Completed",
                        "ModelApprovalStatus": status,
                        "InferenceSpecification": {"Containers": [{"ModelDataUrl": RELEASE["source_uri"]}]},
                        "CustomerMetadataProperties": {k: v for k, v in RELEASE.items() if k != "source_uri"}}

    def describe_model_package(self, **kwargs):
        if kwargs != {"ModelPackageName": ARN}:
            raise AssertionError("Must inspect the exact release package ARN")
        self.events.append("registry.describe")
        return copy.deepcopy(self.package)


class FakeKube:
    def __init__(self, events, *, available=True):
        self.events, self.available, self.writes = events, available, []

    def read_namespaced_service(self, *args, **kwargs):
        self.events.append("service.read")
        raise FakeApiException(404)

    def create_namespaced_service(self, **kwargs):
        self.events.append("service.write")
        self.writes.append(copy.deepcopy(kwargs["body"]))

    def patch_namespaced_service(self, **kwargs):
        raise AssertionError("Candidate release must never patch an existing Service")

    def read_namespaced_deployment(self, *args, **kwargs):
        self.events.append("deployment.read")
        if not any(obj["kind"] == "Deployment" for obj in self.writes):
            raise FakeApiException(404)
        return SimpleNamespace(metadata=SimpleNamespace(generation=7), status=SimpleNamespace(
            observed_generation=7, updated_replicas=2, available_replicas=2 if self.available else 0, replicas=2))

    def create_namespaced_deployment(self, **kwargs):
        self.events.append("deployment.write")
        self.writes.append(copy.deepcopy(kwargs["body"]))

    def patch_namespaced_deployment(self, **kwargs):
        raise AssertionError("Candidate release must never patch an existing Deployment")


def deploy(module, registry, kube, verifier=lambda *_: True, *, core=None, name=None):
    name = module["release_resource_name"](ARN, RELEASE["artifact_sha256"]) if name is None else name
    return module["deploy_approved"](registry, kube, kube if core is None else core, package_arn=ARN,
        release=copy.deepcopy(RELEASE), target=copy.deepcopy(TARGET), name=name,
        namespace="vllm-inference", loader_image="fixture-loader@sha256:" + "c" * 64,
        verify_endpoint=verifier, timeout=20)


class CandidateApi:
    """Local create-only API; successful writes and failed attempts stay distinct."""
    def __init__(self, kind, events, *, existing=None, read_error=None, create_error=None):
        self.kind, self.events, self.existing = kind, events, existing
        self.read_error, self.create_error = read_error, create_error
        self.writes, self.attempts = [], []

    def read(self, *args, **kwargs):
        self.events.append(f"{self.kind}.read")
        if self.read_error:
            raise FakeApiException(self.read_error)
        if self.existing is None:
            raise FakeApiException(404)
        return copy.deepcopy(self.existing)

    def create(self, **kwargs):
        self.events.append(f"{self.kind}.create")
        self.attempts.append(copy.deepcopy(kwargs))
        if self.create_error:
            raise FakeApiException(self.create_error)
        self.writes.append(copy.deepcopy(kwargs))

    def forbidden(self, *args, **kwargs):
        raise AssertionError("No patch/delete fallback or implicit cleanup is permitted")

    read_namespaced_deployment = read_namespaced_service = read
    create_namespaced_deployment = create_namespaced_service = create
    patch_namespaced_deployment = patch_namespaced_service = forbidden
    delete_namespaced_deployment = delete_namespaced_service = forbidden


def candidate_resources(module):
    return module["manifests"](
        module["release_resource_name"](ARN, RELEASE["artifact_sha256"]),
        "vllm-inference", ARN, copy.deepcopy(RELEASE), copy.deepcopy(TARGET),
        "fixture-loader@sha256:" + "c" * 64)


def create_candidate(module, apps, core, deployment=None, service=None):
    generated_deployment, generated_service = candidate_resources(module)
    return module["create_candidate_resources"](apps, core,
        generated_deployment if deployment is None else deployment,
        generated_service if service is None else service,
        package_arn=ARN, artifact_sha256=RELEASE["artifact_sha256"],
        api_exception_type=FakeApiException)


def model_tar(extra=None, omit=()):
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as archive:
        for name, body in (("config.json", b'{"model_type":"fixture"}'),
                           ("tokenizer_config.json", b"{}"), ("tokenizer.json", b"{}"),
                           ("model.safetensors", b"offline fake weights, never loaded")):
            if name not in omit:
                member = tarfile.TarInfo(name)
                member.size = len(body)
                archive.addfile(member, io.BytesIO(body))
        if extra:
            extra(archive)
    return output.getvalue()


def alarm_event(state="ALARM", stamp="2026-09-19T00:00:00Z"):
    return {"Records": [{"EventSource": "aws:sns", "Sns": {"TopicArn": TOPIC,
        "Message": json.dumps({"AlarmArn": ALARM, "AWSAccountId": "123456789012",
                               "NewStateValue": state, "StateChangeTime": stamp})}}]}


class FakeCostExplorer:
    def __init__(self, *, unit="USD", amount="1.25", repeat_token=False, fail_page=None):
        self.calls = []
        self.unit, self.amount, self.repeat_token, self.fail_page = unit, amount, repeat_token, fail_page

    def get_cost_and_usage(self, **kwargs):
        self.calls.append(copy.deepcopy(kwargs))
        number = len(self.calls)
        if number > 4:
            raise AssertionError("Pagination did not terminate")
        if number == self.fail_page:
            raise RuntimeError("fixture billing read failed")
        token = "page-two" if number == 1 or self.repeat_token else ""
        return {"NextPageToken": token, "ResultsByTime": [{
            "TimePeriod": {"Start": "2026-09-01", "End": "2026-09-02"},
            "Estimated": number == 2, "Groups": [{"Keys": ["reviewed-training-usage"],
                "Metrics": {"UnblendedCost": {"Amount": self.amount, "Unit": self.unit}}}]}]}


def cost_query(module, ce, **kwargs):
    return module["scoped_costs"](ce, start="2026-09-01", end="2026-09-02",
                                  service="Amazon SageMaker", **kwargs)


class NamedFenceTests(unittest.TestCase):
    def test_named_fences_exist_and_locale_code_matches(self):
        for name in MODULES:
            with self.subTest(module=name):
                bodies = []
                for locale in PREFIXES:
                    with self.subTest(locale=locale, module=name):
                        relative, text, block = extract(locale, name)
                        print("EXTRACTION " + json.dumps({"locale": locale, "document": str(relative),
                            "module": name, "lines": [block["start"], block["end"]],
                            "source_sha256": hashlib.sha256(text.encode()).hexdigest(),
                            "code_sha256": hashlib.sha256(block["body"].encode()).hexdigest()}))
                        bodies.append(ast.dump(ast.parse(block["body"])))
                self.assertEqual(len(bodies), 2, f"Both locales required: {name}")
                self.assertEqual(bodies[0], bodies[1], f"Semantic KO/EN drift: {name}")


class ModelReleaseCases:
    def modules(self, name):
        # Each locale has its own TestCase so a failing KO case never hides EN.
        return [(self.locale, OfflineRuntime().execute(self.locale, name)[0])]

    def test_eval_positive_and_precise_regression_boundaries(self):
        for _, module in self.modules("eval_gate.py"):
            baseline = eval_run()
            candidate = copy.deepcopy(baseline)
            candidate["model_revision"] = "candidate-pinned"
            for row in candidate["samples"]:
                row.update(faithfulness=0.87, latency_ms=110)
            self.assertTrue(module["check_eval_gate"](candidate, baseline)["passed"])
            for row in candidate["samples"]:
                row["faithfulness"] = 0.869
            self.assertFalse(module["check_eval_gate"](candidate, baseline)["passed"])
            for row in candidate["samples"]:
                row.update(faithfulness=0.87, latency_ms=111)
            self.assertFalse(module["check_eval_gate"](candidate, baseline)["passed"])
            for row in candidate["samples"]:
                row.update(faithfulness=0.84, latency_ms=100)
            self.assertFalse(module["check_eval_gate"](candidate, baseline)["passed"])

    def test_eval_rejects_nonfinite_missing_and_wrong_type_values(self):
        for _, module in self.modules("eval_gate.py"):
            for field in ("faithfulness", "answer_relevancy", "latency_ms"):
                for value in (float("nan"), float("inf"), -float("inf"), 10 ** 1000, None, True, "0.9"):
                    with self.subTest(field=field, invalid="oversized-int" if type(value) is int else repr(value)):
                        candidate = eval_run()
                        candidate["samples"][0][field] = value
                        with self.assertRaises(ValueError):
                            module["check_eval_gate"](candidate, eval_run())
                candidate = eval_run()
                del candidate["samples"][0][field]
                with self.assertRaises((ValueError, KeyError)):
                    module["check_eval_gate"](candidate, eval_run())

    def test_eval_rejects_incomplete_duplicate_small_and_different_populations(self):
        for _, module in self.modules("eval_gate.py"):
            for mode in ("empty", "small", "duplicate", "incomplete", "different"):
                with self.subTest(mode=mode):
                    candidate = eval_run()
                    if mode == "empty": candidate["samples"] = []
                    elif mode == "small": candidate["samples"].pop()
                    elif mode == "duplicate": candidate["samples"][0]["id"] = "1"
                    elif mode == "incomplete": candidate["samples"][0]["completed"] = False
                    else: candidate["samples"][0]["id"] = "other"
                    with self.assertRaises(ValueError):
                        module["check_eval_gate"](candidate, eval_run())

    def test_eval_baseline_and_protocol_are_validated_too(self):
        for _, module in self.modules("eval_gate.py"):
            for mode in ("zero_latency", "baseline_nan", "judge", "dataset", "protocol", "schema"):
                with self.subTest(mode=mode):
                    baseline = eval_run()
                    if mode == "zero_latency": baseline["samples"][0]["latency_ms"] = 0
                    elif mode == "baseline_nan": baseline["samples"][0]["faithfulness"] = float("nan")
                    elif mode == "judge": baseline["judge_revision"] = "different"
                    elif mode == "dataset": baseline["dataset_sha256"] = "c" * 64
                    elif mode == "protocol": baseline["evaluation_protocol_sha256"] = "c" * 64
                    else: baseline["schema_version"] = 999
                    with self.assertRaises(ValueError):
                        module["check_eval_gate"](eval_run(), baseline)

    def test_eval_p99_retains_the_tail(self):
        for _, module in self.modules("eval_gate.py"):
            run = eval_run()
            for row in run["samples"][-6:]: row["latency_ms"] = 200
            self.assertEqual(module["summarize"](run)[1]["p99_latency_ms"], 200)

    def test_eval_cli_failure_and_success_exit_codes_match_json(self):
        for locale in (self.locale,):
            with self.subTest(locale=locale), tempfile.TemporaryDirectory() as tmp:
                baseline, candidate = Path(tmp) / "baseline.json", Path(tmp) / "candidate.json"
                baseline.write_text(json.dumps(eval_run()))
                for name, payload, expected in (
                    ("valid", json.dumps(eval_run()), 0),
                    ("NaN", '{"samples": NaN}', 1),
                    ("Infinity", '{"samples": Infinity}', 1),
                    ("wrong-top-level", '[]', 1),
                    ("duplicate-key", '{"schema_version":1,"schema_version":1}', 1),
                    ("empty", '{}', 1),
                    ("regression", json.dumps({**eval_run(), "samples": [
                        {**row, "faithfulness": 0.2} for row in eval_run()["samples"]]}), 1),
                ):
                    with self.subTest(input=name):
                        candidate.write_text(payload)
                        _, output, status = OfflineRuntime().execute(locale, "eval_gate.py", main=True,
                            argv=["eval_gate.py", str(candidate), str(baseline)])
                        def nonfinite(value):
                            raise AssertionError(f"CLI emitted non-standard JSON number: {value}")
                        report = json.loads(output, parse_constant=nonfinite)
                        self.assertEqual(status, expected)
                        self.assertIs(report["passed"], expected == 0)

    def test_canary_complete_fresh_snapshot_and_low_error_floor_pass(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        result = module["parse_vector"](canary_payload(), now=1000)
        self.assertEqual(len(result), 16)
        for track in ("stable", "canary"):
            self.assertEqual(result[track, "collection_complete"], 1)
            self.assertEqual(result[track, OBSERVATION_METRICS[0]], 990)
            self.assertEqual(result[track, OBSERVATION_METRICS[1]], 980)
        self.assertEqual(result["stable", "error_fraction"], 0)
        self.assertEqual(result["canary", "error_fraction"], 0.0005)

    def test_canary_old_observation_values_fail_despite_current_query_times(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for track in ("stable", "canary"):
            for metric in OBSERVATION_METRICS:
                with self.subTest(track=track, metric=metric):
                    data = canary_payload()
                    canary_row(data, track, metric)["value"] = [1000, "820"]
                    self.assertTrue(all(row["value"][0] == 1000 for row in data["data"]["result"]))
                    with self.assertRaises(ValueError):
                        module["parse_vector"](data, now=1000)

    def test_canary_observation_boundary_future_and_nonfinite_values(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        data = canary_payload()
        for track in ("stable", "canary"):
            for metric in OBSERVATION_METRICS:
                canary_row(data, track, metric)["value"][1] = "910"
        self.assertEqual(len(module["parse_vector"](data, now=1000)), 16)
        for track in ("stable", "canary"):
            for metric in OBSERVATION_METRICS:
                for value in ("909.999", "1000.001", "NaN", "Infinity", "-Infinity", True):
                    with self.subTest(track=track, metric=metric, value=value):
                        data = canary_payload()
                        canary_row(data, track, metric)["value"][1] = value
                        with self.assertRaises(ValueError):
                            module["parse_vector"](data, now=1000)

    def test_canary_every_required_series_and_scope_must_be_present_once(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for index in range(16):
            with self.subTest(missing_index=index):
                data = canary_payload()
                data["data"]["result"].pop(index)
                with self.assertRaises(ValueError):
                    module["parse_vector"](data, now=1000)
        for mode in ("empty", "duplicate", "namespace", "rollout", "track", "__name__"):
            with self.subTest(mode=mode):
                data = canary_payload()
                if mode == "empty":
                    data["data"]["result"] = []
                elif mode == "duplicate":
                    data["data"]["result"].append(copy.deepcopy(data["data"]["result"][0]))
                else:
                    data["data"]["result"][0]["metric"][mode] = "unexpected"
                with self.assertRaises(ValueError):
                    module["parse_vector"](data, now=1000)

    def test_canary_incomplete_inventory_cannot_hide_behind_fresh_remaining_producers(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for track in ("stable", "canary"):
            for completeness in ("0", "0.5", "2", "-1", "NaN", "Infinity", True):
                with self.subTest(track=track, completeness=completeness):
                    data = canary_payload()
                    for metric in OBSERVATION_METRICS:
                        canary_row(data, track, metric)["value"][1] = "1000"
                    canary_row(data, track, "collection_complete")["value"][1] = completeness
                    with self.assertRaises(ValueError):
                        module["parse_vector"](data, now=1000)

    def test_canary_query_timestamp_is_only_an_additional_sanity_check(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for stamp in (800, 1000.001, float("nan"), float("inf"), True, "1000"):
            with self.subTest(stamp=stamp):
                data = canary_payload()
                data["data"]["result"][0]["value"][0] = stamp
                with self.assertRaises(ValueError):
                    module["parse_vector"](data, now=1000)
        for now in (float("nan"), float("inf"), True, None):
            with self.subTest(now=now), self.assertRaises(ValueError):
                module["parse_vector"](canary_payload(), now=now)
        for field, value in (("status", "error"), ("warnings", ["partial data"]), ("infos", ["omitted samples"])):
            with self.subTest(field=field):
                data = canary_payload()
                data[field] = value
                with self.assertRaises(ValueError):
                    module["parse_vector"](data, now=1000)

    def test_canary_existing_quality_latency_and_population_gates_remain(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for track, metric, value in (
            ("canary", "quality", ".86"), ("canary", "p99_seconds", "1.11"),
            ("canary", "requests", "99"), ("stable", "requests", "99"),
            ("canary", "evaluations", "19"), ("stable", "evaluations", "19"),
            ("canary", "quality", "NaN"), ("stable", "p99_seconds", "0"),
        ):
            with self.subTest(track=track, metric=metric, value=value):
                data = canary_payload()
                canary_row(data, track, metric)["value"][1] = value
                with self.assertRaises(ValueError):
                    module["parse_vector"](data, now=1000)

    def test_canary_quality_and_latency_roundoff_boundaries(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        for metric, value, allowed in (
            ("quality", 0.87, True),
            ("quality", 0.87 - 5e-13, True),
            ("quality", 0.87 - 2e-12, False),
            ("p99_seconds", 1.10, True),
            ("p99_seconds", 1.10 + 5e-13, True),
            ("p99_seconds", 1.10 + 2e-12, False),
        ):
            with self.subTest(metric=metric, value=value, allowed=allowed):
                data = canary_payload()
                canary_row(data, "canary", metric)["value"][1] = str(value)
                if allowed:
                    self.assertEqual(len(module["parse_vector"](data, now=1000)), 16)
                else:
                    with self.assertRaises(ValueError):
                        module["parse_vector"](data, now=1000)

    def test_canary_alert_floor_relative_limit_and_ceiling_match_promotion(self):
        module = MonitorRuntime().execute(self.locale, "monitor_canary.py")[0]
        multiplier, floor, ceiling = canary_error_policy(self.locale)
        for stable, canary, allowed in (
            (0, 0.0005, True), (0, 0.001, True), (0, 0.00101, False),
            (0.003, 0.006, True), (0.003, 0.00601, False),
            (0.02, 0.01, True), (0.02, 0.01001, False),
        ):
            with self.subTest(stable=stable, canary=canary, allowed=allowed):
                # Check the numeric condition only. Alert pending duration is not simulated.
                alert_condition = canary > max(multiplier * stable, floor) or canary > ceiling
                self.assertEqual(alert_condition, not allowed)
                data = canary_payload()
                canary_row(data, "stable", "error_fraction")["value"][1] = str(stable)
                canary_row(data, "canary", "error_fraction")["value"][1] = str(canary)
                if allowed:
                    self.assertEqual(len(module["parse_vector"](data, now=1000)), 16)
                else:
                    with self.assertRaises(ValueError):
                        module["parse_vector"](data, now=1000)

    def test_canary_freshness_recording_rules_preserve_observation_values(self):
        for metric in (*OBSERVATION_METRICS, "collection_complete"):
            with self.subTest(metric=metric):
                expression = canary_rule_expression(self.locale, "record", "canary:" + metric)
                self.assertEqual(expression.strip(), "model_" + metric,
                                 "Do not replace observation values with rule/query timestamps or hide producers")

    def test_canary_repolling_current_query_times_cannot_renew_old_observations(self):
        runtime = MonitorRuntime()
        module = runtime.execute(self.locale, "monitor_canary.py")[0]
        with self.assertRaises(ValueError):
            module["monitor"]("http://monitor.invalid", 120)
        self.assertGreater(len(runtime.queries), 1, "Fresh initial observations should pass before they expire")
        self.assertLess(len(runtime.queries), 10, "Failure must remain bounded without real waiting")
        self.assertGreater(runtime.queries[-1][1] - 980, 90)
        for url, _ in runtime.queries:
            query = parse_qs(urlsplit(url).query)["query"][0]
            for required in (*OBSERVATION_METRICS, "collection_complete"):
                self.assertIn(required, query)

    def test_canary_monitor_blocks_missing_incomplete_and_future_snapshots_immediately(self):
        for mode in ("missing", "incomplete", "future"):
            with self.subTest(mode=mode):
                data = canary_payload()
                if mode == "missing":
                    data["data"]["result"].pop()
                elif mode == "incomplete":
                    canary_row(data, "canary", "collection_complete")["value"][1] = "0"
                else:
                    canary_row(data, "canary", OBSERVATION_METRICS[0])["value"][1] = "1120"
                runtime = MonitorRuntime(data)
                module = runtime.execute(self.locale, "monitor_canary.py")[0]
                with self.assertRaises(ValueError):
                    module["monitor"]("http://monitor.invalid", 1)
                self.assertEqual(len(runtime.queries), 1)

    def test_unapproved_or_incomplete_release_never_writes_kubernetes(self):
        for _, module in self.modules("eks_model_loader.py"):
            for state in ("PendingManualApproval", "Rejected", None, ""):
                with self.subTest(approval=state):
                    events = []
                    registry, kube = FakeRegistry(events, state), FakeKube(events)
                    with self.assertRaises(ValueError): deploy(module, registry, kube)
                    self.assertEqual(events, ["registry.describe"])
                    self.assertEqual(kube.writes, [])
            events = []
            registry, kube = FakeRegistry(events), FakeKube(events)
            registry.package["ModelPackageStatus"] = "InProgress"
            with self.assertRaises(ValueError): deploy(module, registry, kube)
            self.assertEqual(kube.writes, [])

    def test_package_artifact_and_registry_region_must_match(self):
        for _, module in self.modules("eks_model_loader.py"):
            for mode in ("region", "arn", "url", "digest", "version", "format"):
                with self.subTest(mode=mode):
                    events = []
                    registry, kube = FakeRegistry(events), FakeKube(events)
                    if mode == "region": registry.meta.region_name = "eu-west-1"
                    elif mode == "arn": registry.package["ModelPackageArn"] = ARN + "2"
                    elif mode == "url": registry.package["InferenceSpecification"]["Containers"][0]["ModelDataUrl"] = "s3://wrong/model"
                    else:
                        key = {"digest": "artifact_sha256", "version": "artifact_version_id", "format": "artifact_format"}[mode]
                        registry.package["CustomerMetadataProperties"][key] = "wrong"
                    with self.assertRaises(ValueError): deploy(module, registry, kube)
                    self.assertEqual(kube.writes, [])

    def test_approved_release_checks_registry_before_write_and_identity_before_ready(self):
        for _, module in self.modules("eks_model_loader.py"):
            events = []
            registry, kube = FakeRegistry(events), FakeKube(events)
            expected_name = module["release_resource_name"](ARN, RELEASE["artifact_sha256"])
            def verify(endpoint, name, digest):
                events.append("endpoint.verify")
                self.assertEqual(digest, RELEASE["artifact_sha256"])
                self.assertEqual(name, expected_name)
                self.assertEqual(endpoint, f"http://{expected_name}.vllm-inference.svc.cluster.local:8000")
                return True
            result = deploy(module, registry, kube, verify)
            self.assertEqual(events[0], "registry.describe")
            self.assertEqual(events[-1], "endpoint.verify")
            self.assertEqual(result["status"], "ready")
            by_kind = {item["kind"]: item for item in kube.writes}
            self.assertEqual(set(by_kind), {"Deployment", "Service"})
            self.assertEqual(by_kind["Service"]["spec"]["selector"], by_kind["Deployment"]["spec"]["selector"]["matchLabels"])
            server = by_kind["Deployment"]["spec"]["template"]["spec"]["containers"][0]
            self.assertEqual(server["args"][:2], ["--model", "/model"])
            self.assertEqual(server["args"][server["args"].index("--served-model-name") + 1], expected_name)
            events = []
            with self.assertRaises(ValueError):
                deploy(module, FakeRegistry(events), FakeKube(events), lambda *_: False)

    def test_release_identity_changes_with_package_and_digest(self):
        for _, module in self.modules("eks_model_loader.py"):
            make_name = module["release_resource_name"]
            name = make_name(ARN, RELEASE["artifact_sha256"])
            self.assertEqual(name, make_name(ARN, RELEASE["artifact_sha256"]))
            self.assertNotEqual(name, make_name(ARN[:-1] + "2", RELEASE["artifact_sha256"]))
            self.assertNotEqual(name, make_name(ARN, "b" * 64))
            self.assertLessEqual(len(name), 63)
            self.assertRegex(name, r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")
            for package, digest in ((ARN.rsplit("/", 1)[0], "a" * 64),
                                    (ARN[:-1] + "0", "a" * 64), (ARN, "not-a-digest")):
                with self.subTest(package=package, digest=digest), self.assertRaises(ValueError):
                    make_name(package, digest)

    def test_existing_deployment_blocks_all_candidate_writes(self):
        for _, module in self.modules("eks_model_loader.py"):
            for identity in ("mismatched", "same-release"):
                with self.subTest(identity=identity):
                    events = []
                    existing = candidate_resources(module)[0]
                    if identity == "mismatched":
                        existing["spec"]["template"]["metadata"]["annotations"]["artifact-sha256"] = "b" * 64
                    original = copy.deepcopy(existing)
                    apps = CandidateApi("deployment", events, existing=existing)
                    core = CandidateApi("service", events)
                    with self.assertRaises(ValueError):
                        deploy(module, FakeRegistry(events), apps, core=core)
                    self.assertEqual(apps.attempts + core.attempts, [])
                    self.assertEqual(apps.existing, original)

    def test_existing_service_blocks_deployment_creation(self):
        for _, module in self.modules("eks_model_loader.py"):
            events = []
            apps = CandidateApi("deployment", events)
            stable = {"spec": {"selector": {"app": "previous-stable"}}}
            core = CandidateApi("service", events, existing=stable)
            with self.assertRaises(ValueError):
                deploy(module, FakeRegistry(events), apps, core=core)
            self.assertEqual(apps.attempts + core.attempts, [])
            self.assertEqual(core.existing, stable)

    def test_shared_stable_name_is_rejected_before_kubernetes_access(self):
        for _, module in self.modules("eks_model_loader.py"):
            events = []
            apps, core = CandidateApi("deployment", events), CandidateApi("service", events)
            with self.assertRaises(ValueError):
                deploy(module, FakeRegistry(events), apps, core=core, name="vllm-approved-model")
            self.assertEqual(events, ["registry.describe"])
            self.assertEqual(apps.attempts + core.attempts, [])

    def test_wrong_candidate_annotation_selector_or_namespace_is_rejected(self):
        for _, module in self.modules("eks_model_loader.py"):
            for mode in ("digest", "package", "deployment-selector", "pod-label", "service-selector", "namespace"):
                with self.subTest(mode=mode):
                    deployment, service = candidate_resources(module)
                    template = deployment["spec"]["template"]["metadata"]
                    if mode == "digest": template["annotations"]["artifact-sha256"] = "b" * 64
                    elif mode == "package": template["annotations"]["model-package-arn"] = ARN[:-1] + "2"
                    elif mode == "deployment-selector": deployment["spec"]["selector"]["matchLabels"]["app"] = "stable"
                    elif mode == "pod-label": template["labels"] = {"app": "stable"}
                    elif mode == "service-selector": service["spec"]["selector"] = {"app": "stable"}
                    else: service["metadata"]["namespace"] = "other"
                    events = []
                    apps, core = CandidateApi("deployment", events), CandidateApi("service", events)
                    with self.assertRaises(ValueError):
                        create_candidate(module, apps, core, deployment, service)
                    self.assertEqual(events, [], "Identity validation must precede API access")
                    self.assertEqual(apps.attempts + core.attempts, [])

    def test_preflight_permission_failure_has_no_candidate_writes(self):
        for _, module in self.modules("eks_model_loader.py"):
            for failed_kind in ("deployment", "service"):
                with self.subTest(failed_kind=failed_kind):
                    events = []
                    apps = CandidateApi("deployment", events, read_error=403 if failed_kind == "deployment" else None)
                    core = CandidateApi("service", events, read_error=403 if failed_kind == "service" else None)
                    with self.assertRaises(FakeApiException) as caught:
                        deploy(module, FakeRegistry(events), apps, core=core)
                    self.assertEqual(caught.exception.status, 403)
                    self.assertEqual(apps.attempts + core.attempts, [])

    def test_create_race_has_no_patch_or_cleanup_fallback(self):
        for _, module in self.modules("eks_model_loader.py"):
            for failed_kind in ("deployment", "service"):
                with self.subTest(failed_kind=failed_kind):
                    events = []
                    apps = CandidateApi("deployment", events, create_error=409 if failed_kind == "deployment" else None)
                    core = CandidateApi("service", events, create_error=409 if failed_kind == "service" else None)
                    with self.assertRaises(FakeApiException) as caught:
                        deploy(module, FakeRegistry(events), apps, core=core)
                    self.assertEqual(caught.exception.status, 409)
                    self.assertEqual(len(apps.writes), 0 if failed_kind == "deployment" else 1)
                    self.assertEqual(core.writes, [])
                    # A failed Service create may leave only the candidate Deployment.
                    for request in apps.writes:
                        self.assertEqual(request["body"]["metadata"]["name"],
                                         module["release_resource_name"](ARN, RELEASE["artifact_sha256"]))

    def test_absent_candidate_resources_are_preflighted_then_created_once(self):
        for _, module in self.modules("eks_model_loader.py"):
            events = []
            apps, core = CandidateApi("deployment", events), CandidateApi("service", events)
            name = create_candidate(module, apps, core)
            self.assertEqual(name, module["release_resource_name"](ARN, RELEASE["artifact_sha256"]))
            self.assertEqual(events, ["deployment.read", "service.read", "deployment.create", "service.create"])
            self.assertEqual((len(apps.writes), len(core.writes)), (1, 1))
            for request in apps.writes + core.writes:
                self.assertEqual(request["namespace"], "vllm-inference")
                self.assertEqual(request["body"]["metadata"]["name"], name)

    def test_multi_region_wrapper_passes_derived_identity_to_actual_loader(self):
        loader = OfflineRuntime().execute(self.locale, "eks_model_loader.py")[0]
        expected_name = loader["release_resource_name"](ARN, RELEASE["artifact_sha256"])
        registry = FakeRegistry([])
        contexts, verified = [], []
        clusters = {"reviewed-context-a": FakeKube([]), "reviewed-context-b": FakeKube([])}
        targets = {
            "ap-northeast-2": {**TARGET, "kube_context": "reviewed-context-a"},
            "eu-west-1": {**TARGET, "region": "eu-west-1", "kube_context": "reviewed-context-b",
                          "bucket": "fixture-eu-replica", "version_id": "replica-eu-version"},
        }

        @contextlib.contextmanager
        def selected_context(*, context):
            contexts.append(context)
            yield clusters[context]

        class RegionalRuntime(OfflineRuntime):
            def client(self, name, **kwargs):
                self.client_calls.append((name, kwargs))
                if name != "sagemaker" or kwargs != {"region_name": "us-west-2"}:
                    raise AssertionError("Only the local registry fake may be requested")
                return registry

            def import_module(self, name, globals=None, locals=None, fromlist=(), level=0):
                if name == "eks_model_loader":
                    return SimpleNamespace(deploy_approved=loader["deploy_approved"],
                                           release_resource_name=loader["release_resource_name"])
                if name == "kubernetes":
                    return SimpleNamespace(
                        client=SimpleNamespace(AppsV1Api=lambda api: api, CoreV1Api=lambda api: api),
                        config=SimpleNamespace(new_client_from_config=selected_context))
                return super().import_module(name, globals, locals, fromlist, level)

        def verify(endpoint, name, digest):
            self.assertEqual(name, expected_name)
            self.assertEqual(digest, RELEASE["artifact_sha256"])
            self.assertEqual(endpoint, f"http://{expected_name}.vllm-inference.svc.cluster.local:8000")
            verified.append((endpoint, name, digest))
            return True

        runtime = RegionalRuntime()
        regional = runtime.execute(self.locale, "multi_region_deployment.py")[0]
        result = regional["deploy_regions"](ARN, copy.deepcopy(RELEASE), targets,
                    "fixture-loader@sha256:" + "c" * 64, {region: verify for region in targets})
        self.assertEqual(set(result), set(targets))
        self.assertEqual(contexts, ["reviewed-context-a", "reviewed-context-b"])
        self.assertEqual(len(verified), 2)
        self.assertEqual(runtime.client_calls, [("sagemaker", {"region_name": "us-west-2"})])
        for kube in clusters.values():
            self.assertEqual(len(kube.writes), 2)
            for resource in kube.writes:
                self.assertEqual(resource["metadata"]["name"], expected_name)

    def test_otel_fragment_keeps_served_name_bound_to_pod_app_label(self):
        _, _, blocks = document(self.locale, "sagemaker")
        fragments = [block["body"] for block in blocks
                     if block["info"] == "yaml" and "# Pod-spec fragment:" in block["body"]]
        self.assertEqual(len(fragments), 1, "Expected one explicit OTEL Pod-spec fragment")
        server = re.search(r"(?ms)^- name: vllm-server\s*\n(.*?)(?=^- name:|\Z)", fragments[0])
        self.assertIsNotNone(server)
        body = server[0]
        self.assertRegex(body, r"--served-model-name\s*,\s*['\"]?\$\(RELEASE_NAME\)['\"]?\s*,")
        lines = body.splitlines()
        declarations = [i for i, line in enumerate(lines)
                        if re.fullmatch(r"\s*-\s*name:\s*RELEASE_NAME\s*", line)]
        self.assertEqual(len(declarations), 1)
        index = declarations[0]
        indent = len(lines[index]) - len(lines[index].lstrip())
        value_lines = []
        for line in lines[index + 1:]:
            if line.strip() and len(line) - len(line.lstrip()) <= indent:
                break
            value_lines.append(line)
        value = "\n".join(value_lines)
        # This is a narrow visible-wiring assertion, not a general YAML parser.
        self.assertRegex(value, r"\bvalueFrom\s*:")
        self.assertRegex(value, r"\bfieldRef\s*:")
        self.assertRegex(value, r"""fieldPath\s*:\s*["']metadata\.labels\['app'\]["']""")
        self.assertNotRegex(value, r"\bvalue\s*:", "RELEASE_NAME must not be a fixed literal")

    def test_unready_deployment_never_reports_verified_ready(self):
        for _, module in self.modules("eks_model_loader.py"):
            events = []
            verified = []
            with self.assertRaises(TimeoutError):
                deploy(module, FakeRegistry(events), FakeKube(events, available=False),
                       lambda *args: verified.append(args) or True)
            self.assertEqual(verified, [], "Endpoint verification follows rollout readiness")

    def test_artifact_checksum_and_required_files(self):
        for _, module in self.modules("model_artifact.py"):
            with tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                archive, target = root / "model.tar.gz", root / "model"
                target.mkdir()
                data = model_tar()
                archive.write_bytes(data)
                with self.assertRaises(ValueError):
                    module["extract_model"](archive, target, "0" * 64)
                self.assertEqual(list(target.iterdir()), [])
                digest = hashlib.sha256(data).hexdigest()
                module["extract_model"](archive, target, digest)
                self.assertEqual((target / "artifact.sha256").read_text().strip(), digest)
                with self.assertRaises(ValueError): module["extract_model"](archive, target, digest)
            for omitted in (("config.json",), ("model.safetensors",), ("tokenizer.json",)):
                with self.subTest(omitted=omitted), tempfile.TemporaryDirectory() as tmp:
                    root = Path(tmp); target = root / "model"; target.mkdir()
                    data = model_tar(omit=omitted); archive = root / "model.tar.gz"; archive.write_bytes(data)
                    with self.assertRaises(ValueError):
                        module["extract_model"](archive, target, hashlib.sha256(data).hexdigest())

    def test_unsafe_archives_fail_before_writing_any_member(self):
        for _, module in self.modules("model_artifact.py"):
            for mode in ("parent", "absolute", "symlink", "hardlink", "duplicate", "special", "oversize"):
                with self.subTest(mode=mode), tempfile.TemporaryDirectory() as tmp:
                    root = Path(tmp); target = root / "model"; target.mkdir()
                    outside = root / "outside"; outside.write_text("untouched")
                    def extra(archive):
                        name = {"parent": "../outside", "absolute": str(outside), "duplicate": "./config.json"}.get(mode, "bad")
                        member = tarfile.TarInfo(name)
                        if mode in ("symlink", "hardlink"):
                            member.type = tarfile.SYMTYPE if mode == "symlink" else tarfile.LNKTYPE
                            member.linkname = str(outside)
                        elif mode == "special": member.type = tarfile.FIFOTYPE
                        archive.addfile(member)
                    data = model_tar(extra); archive = root / "model.tar.gz"; archive.write_bytes(data)
                    with self.assertRaises(ValueError):
                        module["extract_model"](archive, target, hashlib.sha256(data).hexdigest(),
                                                max_bytes=1 if mode == "oversize" else 1024 * 1024)
                    self.assertEqual(list(target.iterdir()), [], "Validation must precede extraction")
                    self.assertEqual(outside.read_text(), "untouched")

    def test_download_rejects_truncation_wrong_version_and_excess_size(self):
        for _, module in self.modules("model_artifact.py"):
            for mode in ("valid", "truncated", "version", "too-large"):
                with self.subTest(mode=mode), tempfile.TemporaryDirectory() as tmp:
                    data = model_tar(); body = io.BytesIO(data); requests = []
                    response = {"Body": body, "ContentLength": len(data), "VersionId": "pinned-version"}
                    if mode == "truncated": response["ContentLength"] += 1
                    if mode == "version": response["VersionId"] = "different"
                    if mode == "too-large": response["ContentLength"] = 2 * 1024 * 1024
                    def get_object(**kwargs):
                        requests.append(kwargs)
                        return response
                    arguments = (SimpleNamespace(get_object=get_object), "bucket", "key", "pinned-version",
                                 hashlib.sha256(data).hexdigest(), tmp)
                    if mode == "valid": module["download_and_extract"](*arguments, max_bytes=1024 * 1024)
                    else:
                        with self.assertRaises(ValueError):
                            module["download_and_extract"](*arguments, max_bytes=1024 * 1024)
                        self.assertEqual(list(Path(tmp).iterdir()), [])
                    self.assertTrue(body.closed)
                    self.assertEqual(requests, [{"Bucket": "bucket", "Key": "key", "VersionId": "pinned-version"}])

    def test_alarm_delivery_is_deduplicated_without_starting_training(self):
        for locale in (self.locale,):
            with self.subTest(locale=locale):
                runtime = OfflineRuntime()
                module = runtime.execute(locale, "drift_detection_handler.py")[0]
                first = module["lambda_handler"](alarm_event(), None)
                second = module["lambda_handler"](alarm_event(stamp="2026-09-19T09:00:00+09:00"), None)
                self.assertEqual(first["status"], "pending_approval")
                self.assertEqual(second["status"], "duplicate")
                self.assertEqual(len(runtime.table.items), 1)
                self.assertEqual(next(iter(runtime.table.items.values()))["status"], "PendingApproval")
                self.assertEqual(runtime.client_calls, [])
                module["lambda_handler"](alarm_event("OK"), None)
                self.assertEqual(len(runtime.table.calls), 2, "OK transition must not write a request")
                distinct = module["lambda_handler"](alarm_event(stamp="2026-09-18T23:59:30Z"), None)
                self.assertEqual(distinct["status"], "pending_approval")
                self.assertEqual(len(runtime.table.items), 2, "A different valid transition is not a duplicate")

    def test_alarm_rejects_wrong_source_account_alarm_and_time(self):
        for _, module in self.modules("drift_detection_handler.py"):
            for mode in ("source", "topic", "account", "alarm", "stale", "future", "naive"):
                with self.subTest(mode=mode):
                    event = alarm_event()
                    record = event["Records"][0]
                    message = json.loads(record["Sns"]["Message"])
                    if mode == "source": record["EventSource"] = "other"
                    elif mode == "topic": record["Sns"]["TopicArn"] = TOPIC + "-other"
                    elif mode == "account": message["AWSAccountId"] = "999999999999"
                    elif mode == "alarm": message["AlarmArn"] = ALARM + "-other"
                    else: message["StateChangeTime"] = {"stale": "2026-09-18T00:00:00Z", "future": "2026-09-20T00:00:00Z", "naive": "2026-09-19T00:00:00"}[mode]
                    record["Sns"]["Message"] = json.dumps(message)
                    with self.assertRaises(ValueError):
                        module["approval_request"](event, topic_arn=TOPIC, alarm_arn=ALARM, now=NOW)

    def test_alarm_persistence_errors_are_not_false_success(self):
        for locale in (self.locale,):
            with self.subTest(locale=locale):
                runtime = OfflineRuntime(FakeDynamoTable(error_code="AccessDeniedException"))
                module = runtime.execute(locale, "drift_detection_handler.py")[0]
                with self.assertRaises(FakeClientError): module["lambda_handler"](alarm_event(), None)
                self.assertEqual(runtime.client_calls, [])

    def test_roi_arithmetic_and_displayed_output_agree(self):
        for locale in (self.locale,):
            with self.subTest(locale=locale):
                module, output, _ = OfflineRuntime().execute(locale, "roi_analysis.py")
                expected_retained = module["active_users"] * module["monthly_churn_rate"] * module["relative_churn_reduction"]
                expected_revenue = expected_retained * module["monthly_revenue_per_user"]
                expected_cost = module["training_cost_per_iteration"] * module["iterations_per_month"]
                self.assertGreater(expected_cost, 0)
                self.assertAlmostEqual(module["monthly_training_cost"], expected_cost)
                self.assertAlmostEqual(module["retained_users"], expected_retained)
                self.assertAlmostEqual(module["first_month_revenue_preserved"], expected_revenue)
                self.assertAlmostEqual(module["net_first_month"], expected_revenue - expected_cost)
                self.assertAlmostEqual(module["roi"], (expected_revenue / expected_cost - 1) * 100)
                _, _, source_block = extract(locale, "roi_analysis.py")
                _, _, blocks = document(locale, "evaluation")
                outputs = [b for b in blocks if b["start"] > source_block["end"] and b["info"] in ("", "text")]
                self.assertTrue(outputs, "Expected displayed output fence immediately after ROI example")
                self.assertEqual(output.strip(), outputs[0]["body"].strip())

    def test_cost_pagination_preserves_filter_estimates_and_currency(self):
        for _, module in self.modules("cost_monitoring.py"):
            ce = FakeCostExplorer()
            result = cost_query(module, ce, usage_types=["reviewed-training-usage"])
            self.assertEqual(len(ce.calls), 2)
            first, second = copy.deepcopy(ce.calls)
            self.assertNotIn("NextPageToken", first)
            self.assertEqual(second.pop("NextPageToken"), "page-two")
            self.assertEqual(first, second, "Page token must be the only request change")
            self.assertEqual(result["scope"]["And"][1]["Dimensions"],
                             {"Key": "USAGE_TYPE", "Values": ["reviewed-training-usage"]})
            self.assertEqual(result["end_exclusive"], "2026-09-02")
            self.assertEqual(len(result["rows"]), 2)
            self.assertEqual([row["estimated"] for row in result["rows"]], [False, True])
            self.assertEqual(sum(Decimal(row["amount_usd"]) for row in result["rows"]), Decimal("2.50"))
            ce = FakeCostExplorer()
            tagged = cost_query(module, ce, tag={"key": "Workload", "value": "eks-model-serving"})
            self.assertEqual(tagged["scope"]["And"][1]["Tags"],
                             {"Key": "Workload", "Values": ["eks-model-serving"]})

    def test_cost_rejects_bad_units_nonfinite_repeated_tokens_and_partial_success(self):
        for _, module in self.modules("cost_monitoring.py"):
            for settings in ({"unit": "EUR"}, {"amount": "NaN"}, {"amount": "Infinity"}, {"repeat_token": True}):
                with self.subTest(settings=settings), self.assertRaises(ValueError):
                    cost_query(module, FakeCostExplorer(**settings), usage_types=["reviewed-training-usage"])
            ce = FakeCostExplorer()
            with self.assertRaises(ValueError): cost_query(module, ce, usage_types=[])
            self.assertEqual(ce.calls, [])
            with self.assertRaises(RuntimeError):
                cost_query(module, FakeCostExplorer(fail_page=2), usage_types=["reviewed-training-usage"])


class KoreanModelReleaseTests(ModelReleaseCases, unittest.TestCase):
    locale = "ko"


class EnglishModelReleaseTests(ModelReleaseCases, unittest.TestCase):
    locale = "en"


if __name__ == "__main__":
    unittest.main(verbosity=2)
