"""Offline smoke checks: real collections metrics, mocked HTTP, blocked sockets."""

import copy
import inspect
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stderr
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

os.environ["RAGAS_DO_NOT_TRACK"] = "true"
# Block both name resolution and connections, including during third-party imports.
patch("socket.getaddrinfo", side_effect=AssertionError("Network is disabled.")).start()
patch("socket.socket.connect", side_effect=AssertionError("Network is disabled.")).start()
patch("socket.socket.connect_ex", side_effect=AssertionError("Network is disabled.")).start()

import httpx
from openai import AsyncOpenAI

import ragas_eval as example


class StubMetric:
    def __init__(self, value=0.9):
        self.value = value
        self.calls = 0

    async def ascore(self, **kwargs):
        self.calls += 1
        if isinstance(self.value, Exception):
            raise self.value
        return SimpleNamespace(value=self.value)


def stub_metrics():
    return {name: StubMetric() for name in example.QUALITY_GATES}


class SmokeTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.samples = example.collect_samples(example.CASES, example.demo_pipeline)

    async def test_real_metrics_and_provider_configuration_with_mock_http(self):
        requests = []
        statement = "The release guide is in the engineering handbook."
        responses = {
            "StatementGeneratorOutput": {"statements": [statement]},
            "NLIStatementOutput": {
                "statements": [{"statement": statement, "reason": "Fixture", "verdict": 1}]
            },
            "AnswerRelevanceOutput": {"question": "Where is the release guide?", "noncommittal": 0},
            "ContextPrecisionOutput": {"reason": "Fixture", "verdict": 1},
            "ContextRecallOutput": {
                "classifications": [{"statement": statement, "reason": "Fixture", "attributed": 1}]
            },
            "ClassificationWithReason": {
                "TP": [{"statement": statement, "reason": "Fixture"}], "FP": [], "FN": [],
            },
        }

        def transport(request):
            payload = json.loads(request.content)
            requests.append(request.url.path)
            if request.url.path == "/v1/embeddings":
                self.assertEqual(payload["model"], example.EMBEDDING_MODEL)
                inputs = payload["input"]
                count = 1 if isinstance(inputs, str) else len(inputs)
                return httpx.Response(200, json={
                    "object": "list", "model": example.EMBEDDING_MODEL,
                    "data": [
                        {"object": "embedding", "index": index, "embedding": [1.0, 0.0]}
                        for index in range(count)
                    ],
                    "usage": {"prompt_tokens": 1, "total_tokens": 1},
                })
            self.assertEqual(request.url.path, "/v1/chat/completions")
            self.assertEqual(payload["model"], example.LLM_MODEL)
            self.assertEqual(payload["temperature"], 0)
            prompt = json.dumps(payload["messages"])
            names = [name for name in responses if name in prompt]
            self.assertEqual(len(names), 1, "Expected one structured response schema.")
            return httpx.Response(200, json={
                "id": "offline-completion", "object": "chat.completion", "created": 0,
                "model": example.LLM_MODEL,
                "choices": [{
                    "index": 0, "finish_reason": "stop",
                    "message": {"role": "assistant", "content": json.dumps(responses[names[0]])},
                }],
                "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
            })

        async with AsyncOpenAI(
            api_key="offline-placeholder", base_url=example.BASE_URL, max_retries=0,
            http_client=httpx.AsyncClient(
                transport=httpx.MockTransport(transport), trust_env=False
            ),
        ) as client:
            metrics = example.make_metrics(client, comprehensive=True)
            for name, metric in metrics.items():
                self.assertTrue(type(metric).__module__.startswith("ragas.metrics.collections."))
                inspect.signature(metric.ascore).bind(**{
                    field: self.samples[0][field] for field in example.METRIC_INPUTS[name]
                })
            report = await example.score_samples(self.samples, metrics)
        self.assertEqual(example.quality_failures(report), [], report["rows"])
        self.assertEqual(set(report["metrics"]), set(example.METRIC_INPUTS))
        self.assertIn("/v1/embeddings", requests)
        self.assertIn("/v1/chat/completions", requests)

    async def test_nonfinite_missing_and_provider_failures_fail_closed(self):
        for value in (float("nan"), float("inf"), -float("inf"), None, True, "0.9", RuntimeError("fixture")):
            with self.subTest(value=value):
                metrics = stub_metrics()
                metrics["answer_relevancy"] = StubMetric(value)
                cache = {}
                report = await example.score_samples(self.samples, metrics, cache)
                self.assertIsNone(report["metrics"]["answer_relevancy"])
                self.assertEqual(report["failed_samples"], len(self.samples))
                self.assertTrue(example.quality_failures(report))
                self.assertEqual(cache, {})
                with tempfile.TemporaryDirectory() as directory:
                    path = Path(directory) / "report.json"
                    example.save_json(path, report)
                    self.assertEqual(json.loads(path.read_text()), report)

    async def test_failure_is_not_hidden_by_successful_sample(self):
        class MixedMetric:
            async def ascore(self, user_input, response):
                value = 0.9 if user_input == example.CASES[0]["user_input"] else float("nan")
                return SimpleNamespace(value=value)

        metrics = stub_metrics()
        metrics["answer_relevancy"] = MixedMetric()
        report = await example.score_samples(self.samples, metrics)
        self.assertIsNone(report["metrics"]["answer_relevancy"])
        self.assertEqual(report["failed_samples"], 1)
        self.assertTrue(example.quality_failures(report))

    async def test_gate_rejects_empty_incomplete_and_inconsistent_reports(self):
        report = await example.score_samples(self.samples, stub_metrics())
        self.assertEqual(example.quality_failures(report), [])
        variants = [{}, {**report, "rows": []}, {**report, "rows": report["rows"][:1]}]
        for value in (None, float("nan"), 0.1):
            changed = copy.deepcopy(report)
            changed["metrics"]["faithfulness"] = value
            variants.append(changed)
        missing = copy.deepcopy(report)
        del missing["rows"][0]["scores"]["faithfulness"]
        variants.append(missing)
        for variant in variants:
            self.assertTrue(example.quality_failures(variant))
        metrics = stub_metrics()
        metrics["faithfulness"] = StubMetric(0.79)
        low = await example.score_samples(self.samples, metrics)
        self.assertTrue(example.quality_failures(low))

    async def test_cache_preserves_order_and_invalidates_changed_inputs(self):
        metrics, cache = stub_metrics(), {}
        await example.score_samples(self.samples[:1], metrics, cache)
        reordered = [self.samples[1], self.samples[0], self.samples[1]]
        report = await example.score_samples(reordered, metrics, cache)
        self.assertEqual([row["sample"] for row in report["rows"]], reordered)
        self.assertEqual([row["cached"] for row in report["rows"]], [False, True, True])
        self.assertEqual(metrics["faithfulness"].calls, 2)
        for field in ("reference", "response", "user_input", "retrieved_contexts"):
            changed = copy.deepcopy(self.samples[:1])
            changed[0][field] = ["Changed context"] if field == "retrieved_contexts" else "Changed text"
            report = await example.score_samples(changed, metrics, cache)
            self.assertFalse(report["rows"][0]["cached"])
        report = await example.score_samples(self.samples[:1], metrics, cache, revision="v2")
        self.assertFalse(report["rows"][0]["cached"])
        metrics["answer_correctness"] = StubMetric()
        report = await example.score_samples(self.samples[:1], metrics, cache)
        self.assertFalse(report["rows"][0]["cached"])
        config = example.evaluator_config(metrics)
        changed_config = {**config, "embeddings": "different-model"}
        self.assertNotEqual(
            example.cache_key(self.samples[0], config),
            example.cache_key(self.samples[0], changed_config),
        )

    async def test_invalid_cached_scores_are_recomputed(self):
        metrics = stub_metrics()
        key = example.cache_key(self.samples[0], example.evaluator_config(metrics))
        cache = {key: {name: float("nan") for name in metrics}}
        report = await example.score_samples(self.samples[:1], metrics, cache)
        self.assertFalse(report["rows"][0]["cached"])
        self.assertEqual(example.quality_failures(report), [])
        cache[key] = {name: float("nan") for name in metrics}
        metrics["faithfulness"] = StubMetric(RuntimeError("fixture"))
        report = await example.score_samples(self.samples[:1], metrics, cache)
        self.assertTrue(example.quality_failures(report))
        self.assertNotIn(key, cache)

    async def test_cli_run_saves_failure_report_before_returning_nonzero(self):
        metrics = stub_metrics()
        metrics["faithfulness"] = StubMetric(float("nan"))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            args = SimpleNamespace(
                samples=root / "samples.json", cache=root / "cache.json",
                output=root / "results" / "report.json",
                comprehensive=False, revision="default-prompts-v1",
            )
            example.save_json(args.samples, self.samples)
            with patch.dict(os.environ, {"OPENAI_API_KEY": "offline-placeholder"}):
                with patch.object(example, "make_metrics", return_value=metrics):
                    self.assertEqual(await example.run(args), 1)
            report = json.loads(args.output.read_text())
            self.assertIsNone(report["metrics"]["faithfulness"])
            self.assertEqual(report["sample_count"], len(self.samples))
            self.assertEqual(json.loads(args.cache.read_text()), {})

    async def test_invalid_samples_are_rejected_before_scoring(self):
        metrics = stub_metrics()
        for samples in ([], [{}], [{**self.samples[0], "retrieved_contexts": "text"}]):
            with self.assertRaises(ValueError):
                await example.score_samples(samples, metrics)
        self.assertEqual(metrics["faithfulness"].calls, 0)
        seen = []

        def adapter(question):
            seen.append(question)
            return example.demo_pipeline(question)

        self.assertEqual(example.collect_samples(example.CASES, adapter), self.samples)
        self.assertEqual(seen, [case["user_input"] for case in example.CASES])

    def test_cli_requires_explicit_live_flag_and_credentials(self):
        for argv in (["ragas_eval.py"], ["ragas_eval.py", "--live"]):
            with patch("sys.argv", argv), patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
                with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as error:
                    example.main()
            self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
