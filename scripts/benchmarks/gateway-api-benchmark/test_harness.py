"""Small offline regression suite. Synthetic metrics below are never evidence."""

from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import http.client
import io
import json
from pathlib import Path
import platform
import shutil
import subprocess
import threading
import time
import unittest
from unittest.mock import patch, MagicMock

import fixture
import probe
import results

HERE = Path(__file__).parent


def config():
    value = results.strict_json((HERE / "cases.fixture.json").read_text())
    value["provenance"].update(run_id="unit-test-only", source_revision="a" * 40, sut_config_sha256="b" * 64)
    return value


def probe_config():
    value = config()
    value["provenance"]["generator_version"] = f"Python {platform.python_version()} http.client"
    return value


def attach_config(record, value):
    text = json.dumps(value)
    record.update(config_text=text, config_sha256=hashlib.sha256(text.encode()).hexdigest())
    if record.get("raw", {}).get("setup_data"):
        record["raw"]["setup_data"]["validated_config_sha256"] = record["config_sha256"]


def synthetic_run():
    c = config()
    n, elapsed, epoch = 25, 5005, 1789776000000

    def trend(low, high):
        return {"type": "trend", "contains": "time", "values": {
            "min": low, "med": (low + high) / 2, "p(90)": high, "p(95)": high, "p(99)": high,
            "max": high, "avg": (low + high) / 2, "count": n,
        }}

    def counter(count):
        return {"type": "counter", "contains": "default", "values": {"count": count, "rate": count / (elapsed / 1000)}}

    def rate(count, passed):
        return {"type": "rate", "contains": "default", "values": {
            "passes": passed, "fails": count - passed, "rate": passed / count,
        }, "thresholds": {"rate==1" if passed else "rate==0": {"ok": True}}}

    metrics = {
        "http_reqs": counter(n), "iterations": counter(n), "dropped_iterations": counter(0),
        "http_req_failed": rate(n, 0), "checks": rate(4 * n, 4 * n),
        "http_req_duration": trend(1, 5), "bench_start_ms": trend(0, 4800),
        "bench_scenario_unix_ms": trend(epoch, epoch),
        "bench_finish_unix_ms": trend(epoch + 1, epoch + 4805),
        **{name: rate(n, n) for name in results.CONTRACT_METRICS},
    }
    metrics["http_reqs"]["thresholds"] = {"count>0": {"ok": True}}
    record = results.envelope("gateway-api-k6", json.dumps(c), c["provenance"]["generator_version"], HERE / "load.js")
    record.update(summary_format="k6-2.2-legacy", units={"latency": "ms", "time": "ms", "rate": "requests/s"},
                  finished_at=datetime.fromtimestamp((epoch + elapsed) / 1000, timezone.utc).isoformat())
    record["raw"] = {
        "metrics": metrics, "state": {"testRunDurationMs": elapsed},
        "options": {"summaryTimeUnit": "ms", "summaryTrendStats": results.TREND_STATS},
        "setup_data": {"validated_config_sha256": record["config_sha256"], "effective_options": {
            "scenarios": {"benchmark": {"executor": "constant-arrival-rate", "rate": 5, "duration": "5s",
                                       "timeUnit": "1s", "preAllocatedVUs": 2, "maxVUs": 2, "gracefulStop": "2s"}},
            "maxRedirects": 0, "insecureSkipTLSVerify": False, "noConnectionReuse": False,
            "noVUConnectionReuse": False, "discardResponseBodies": False,
            "thresholds": {"dropped_iterations": ["count==0"]},
        }},
    }
    return record


class FixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = fixture.make_server(port=0)
        cls.thread = threading.Thread(target=lambda: cls.server.serve_forever(poll_interval=0.02), daemon=True)
        cls.thread.start()
        cls.target = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=1)

    def test_echo_is_deterministic_and_preserves_request(self):
        case = config()["probe"]["cases"][0]
        a = probe.request(self.target, case, 1000)
        b = probe.request(self.target, case, 1000)
        self.assertEqual(a, b)
        self.assertEqual(probe.evaluate(case, [a])["outcome"], "pass")
        self.assertNotIn("Date", a["headers"])

    def test_controlled_failure_and_delay(self):
        cases = config()["probe"]["cases"]
        for case in cases[1:]:
            start = time.monotonic()
            observation = probe.request(self.target, case, 1000)
            elapsed = time.monotonic() - start
            self.assertEqual(probe.evaluate(case, [observation])["outcome"], "pass")
            if case["feature"] == "controlled-delay":
                self.assertGreaterEqual(elapsed, 0.019)

    def test_complete_probe_run_validates_without_writing_results(self):
        c = probe_config()
        c["provenance"]["target"] = self.target
        record = probe.run(json.dumps(c))
        summary = results.summarize([record])
        self.assertTrue(summary["valid"])
        self.assertEqual(len(summary["runs"][0]["cases"]), 3)
        self.assertFalse(summary["gateway_api_conformance"])
        self.assertEqual(summary["runs"][0]["actual_generator"], c["provenance"]["generator_version"])

    def test_invalid_controls_fail_bounded(self):
        for headers in ({"X-Fixture-Delay-Ms": "2001"}, {"X-Fixture-Delay-Ms": "-1"},
                        {"X-Fixture-Status": "204"}, {"X-Fixture-Status": "NaN"}):
            with self.subTest(headers=headers):
                value = probe.request(self.target, {"request": {"path": "/", "headers": headers}}, 1000)
                self.assertEqual(value["status"], 400)
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=1)
        connection.putrequest("GET", "/")
        connection.putheader("X-Fixture-Delay-Ms", "0")
        connection.putheader("X-Fixture-Delay-Ms", "1")
        connection.endheaders()
        self.assertEqual(connection.getresponse().status, 400)
        connection.close()

    def test_wrong_expected_status_path_header_backend_protocol_fail(self):
        case = config()["probe"]["cases"][0]
        observed = probe.request(self.target, case, 1000)
        for field, wrong in (("status", 404), ("protocol", "HTTP/2.0"),
                             ("json", {"path": "/wrong"}), ("json", {"backend_id": "other"}),
                             ("json", {"headers": {"x-probe": "missing"}})):
            with self.subTest(field=field, wrong=wrong):
                changed = deepcopy(case)
                changed["expected"][field] = wrong
                self.assertEqual(probe.evaluate(changed, [observed])["outcome"], "fail")

    def test_probe_does_not_follow_redirects_or_retry(self):
        connection = MagicMock()
        response = connection.getresponse.return_value
        response.status, response.version = 302, 11
        response.length = 0
        response.read.return_value = b"redirect"
        response.getheaders.return_value = [("Location", "http://external.invalid")]
        with patch("probe.http.client.HTTPConnection", return_value=connection):
            result = probe.request(self.target, {"request": {"path": "/"}}, 100)
        self.assertEqual(result["status"], 302)
        self.assertEqual(connection.request.call_count, 1)


class ProbeTests(unittest.TestCase):
    def test_incomplete_bodies_fail_without_losing_size_bound(self):
        case = probe_config()["probe"]["cases"][0]
        body = json.dumps(case["expected"]["json"]).encode()
        wire_cases = (
            ("complete-length", b"Content-Length: " + str(len(body)).encode(), body, "pass"),
            ("early-eof-length", b"Content-Length: " + str(len(body) + 100).encode(), body, "fail"),
            ("close-delimited", b"Connection: close", body, "pass"),
            ("complete-chunked", b"Transfer-Encoding: chunked",
             f"{len(body):x}\r\n".encode() + body + b"\r\n0\r\n\r\n", "pass"),
            ("incomplete-chunked", b"Transfer-Encoding: chunked",
             f"{len(body):x}\r\n".encode() + body + b"\r\n", "fail"),
            ("over-size-cap", b"Content-Length: 1048577", b"x" * 1048577, "fail"),
        )
        for name, header, payload, expected in wire_cases:
            with self.subTest(name=name):
                sock = MagicMock()
                sock.makefile.return_value = io.BytesIO(b"HTTP/1.1 200 OK\r\n" + header + b"\r\n\r\n" + payload)
                response = http.client.HTTPResponse(sock)
                response.begin()
                connection = MagicMock()
                connection.getresponse.return_value = response
                connection.close.side_effect = response.close
                with patch("probe.http.client.HTTPConnection", return_value=connection):
                    observation = probe.request("http://fixture:8080", case, 1000)
                self.assertEqual(probe.evaluate(case, [observation])["outcome"], expected)
                if expected == "fail":
                    self.assertIn("error", observation)

    def test_tiny_weighted_sample_is_inconclusive_not_failure(self):
        spec = {"weights": {"a": 80, "b": 20}, "min_samples": 100}
        self.assertEqual(probe.distribution(Counter(a=3), spec)["outcome"], "inconclusive")
        self.assertEqual(probe.distribution(Counter(a=160, b=40), spec)["outcome"], "pass")
        self.assertEqual(probe.distribution(Counter(a=199, b=1), spec)["outcome"], "fail")
        self.assertEqual(probe.distribution(Counter(a=1, alien=1), spec)["outcome"], "fail")
        self.assertEqual(probe.distribution(Counter(a=199, b=1), {"weights": {"a": 1, "b": 0}})["outcome"], "fail")

    def test_header_rewrite_removal_and_response_mutation(self):
        case = {"expected": {"status": 200, "protocol": "HTTP/1.1", "json": {"path": "/new", "headers": {"x-set": "new"}},
                            "absent_json_paths": [["headers", "x-remove"]], "response_headers": {"X-Added": "yes"},
                            "absent_response_headers": ["x-removed"]}}
        observation = {"status": 200, "protocol": "HTTP/1.1", "headers": {"x-added": "yes"},
                       "body": '{"path":"/new","headers":{"x-set":"new"}}'}
        self.assertEqual(probe.evaluate(case, [observation])["outcome"], "pass")
        observation["body"] = '{"path":"/old","headers":{"x-set":"old","x-remove":"bad"}}'
        self.assertEqual(probe.evaluate(case, [observation])["outcome"], "fail")

    def test_cases_cannot_silently_ignore_typo_or_h2(self):
        for key, value in (("statuz", 200), ("protocol", "HTTP/2.0")):
            c = probe_config()
            c["probe"]["cases"][0]["expected"][key] = value
            with self.assertRaises(ValueError):
                probe.validate_cases(c)
        c = results.strict_json((HERE / "cases.routes.example.json").read_text())
        with self.assertRaises(ValueError):
            probe.validate_cases(c)

    def test_retained_observations_are_recomputed(self):
        c = probe_config()
        c["probe"]["cases"] = [c["probe"]["cases"][0]]
        case = c["probe"]["cases"][0]
        observation = {"status": 200, "protocol": "HTTP/1.1", "body": json.dumps(case["expected"]["json"]), "headers": {}}
        r = results.envelope("gateway-api-probe", json.dumps(c), c["provenance"]["generator_version"], HERE / "probe.py")
        r["cases"] = [{"name": case["name"], "observations": [observation], "evaluation": probe.evaluate(case, [observation])}]
        self.assertTrue(results.summarize([r])["valid"])
        observation["status"] = 503
        with self.assertRaisesRegex(ValueError, "differs"):
            results.validate(r)

    def test_probe_generator_mismatch_fails_before_any_request(self):
        for declared in ("k6 v2.2.0", "Python 0.0.0 http.client"):
            c = probe_config()
            c["provenance"]["generator_version"] = declared
            with patch("probe.request") as request, self.subTest(declared=declared), self.assertRaises(ValueError):
                probe.run(json.dumps(c))
            request.assert_not_called()
        c = probe_config()
        c["probe"]["cases"] = [c["probe"]["cases"][0]]
        case = c["probe"]["cases"][0]
        with patch("probe.request", return_value={
            "status": 200, "protocol": "HTTP/1.1", "headers": {}, "body": json.dumps(case["expected"]["json"])
        }):
            record = probe.run(json.dumps(c))
        self.assertEqual(results.validate(record)[0]["actual_generator"], record["generator"])
        record["generator"] = "Python 0.0.0 http.client"
        with self.assertRaisesRegex(ValueError, "generator provenance mismatch"):
            results.validate(record)


class ResultTests(unittest.TestCase):
    def test_null_start_time_from_k6_means_zero_without_accepting_invalid_durations(self):
        # k6 2.2 local-run-03 serialized an unset startTime as explicit null.
        for value in (None, "0s", "0ms"):
            with self.subTest(value=value):
                record = synthetic_run()
                record["raw"]["setup_data"]["effective_options"]["scenarios"]["benchmark"]["startTime"] = value
                self.assertEqual(results.validate(record)[0]["arrival_classification"], "exact")
        for value in ("1ms", "1s", 0, False, ""):
            with self.subTest(value=value):
                record = synthetic_run()
                record["raw"]["setup_data"]["effective_options"]["scenarios"]["benchmark"]["startTime"] = value
                with self.assertRaises(ValueError):
                    results.validate(record)

    def test_valid_run_keeps_per_run_percentiles_and_has_no_ranking(self):
        first, second = synthetic_run(), synthetic_run()
        c = config()
        c["provenance"]["run_id"] = "unit-test-only-2"
        attach_config(second, c)
        for key in ("min", "med", "p(90)", "p(95)", "p(99)", "max", "avg"):
            second["raw"]["metrics"]["http_req_duration"]["values"][key] *= 2
            second["raw"]["metrics"]["bench_finish_unix_ms"]["values"][key] += 5
        summary = results.summarize([first, second])
        self.assertIsNone(summary["ranking"])
        self.assertEqual([run["http_req_duration_ms"]["p(95)"] for run in summary["runs"]], [5, 10])

    def test_missing_provenance_and_local_caps_are_rejected(self):
        for key in config()["provenance"]:
            if key in ("generator_image", "backend_image"):
                continue
            c = config()
            del c["provenance"][key]
            with self.subTest(key=key), self.assertRaises(ValueError):
                results.load_contract(c)
        for key, value in (("rate", 21), ("rate", 0), ("duration_seconds", 31), ("max_vus", 5),
                           ("timeout_ms", 2001), ("grace_seconds", 0), ("rate", True)):
            c = config()
            c["load"][key] = value
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                results.load_contract(c)

    def test_bad_raw_results_fail_closed(self):
        mutations = [
            lambda r: r["raw"]["metrics"]["http_reqs"]["values"].update(count=0),
            lambda r: r["raw"]["metrics"]["http_reqs"]["values"].update(count=10),
            lambda r: r["raw"]["metrics"]["dropped_iterations"]["values"].update(count=1),
            lambda r: r["raw"]["metrics"]["iterations"]["values"].update(count=24),
            lambda r: r["raw"]["metrics"]["http_reqs"]["values"].update(rate=5000),
            lambda r: r["raw"]["state"].update(testRunDurationMs=5.005),
            lambda r: r["raw"]["state"].update(testRunDurationMs=900000),
            lambda r: r["raw"]["options"].update(summaryTimeUnit="s"),
            lambda r: r["units"].update(latency="s"),
            lambda r: r["raw"]["metrics"]["http_req_duration"]["values"].update(**{"p(95)": 5001}),
            lambda r: r["raw"]["metrics"]["bench_start_ms"]["values"].update(count=24),
            lambda r: r.update(finished_at="2020-01-01T00:00:00Z"),
            lambda r: r.update(summary_format="new-format"),
            lambda r: r["raw"].pop("setup_data"),
            lambda r: r["raw"].update(setup_data=None),
            lambda r: r["raw"]["setup_data"].update(validated_config_sha256="0" * 64),
            lambda r: r["raw"]["setup_data"]["effective_options"]["scenarios"]["benchmark"].update(rate=20),
            lambda r: r["raw"]["metrics"]["checks"]["thresholds"]["rate==1"].update(ok=False),
            lambda r: r["raw"]["metrics"]["checks"].pop("thresholds"),
            lambda r: r["raw"]["setup_data"]["effective_options"]["thresholds"].pop("dropped_iterations"),
        ]
        for index, mutation in enumerate(mutations):
            with self.subTest(index=index):
                r = synthetic_run()
                mutation(r)
                with self.assertRaises(ValueError):
                    results.validate(r)
        for metric in results.CONTRACT_METRICS:
            r = synthetic_run()
            r["raw"]["metrics"][metric]["values"].update(passes=24, fails=1, rate=0.96)
            with self.subTest(metric=metric), self.assertRaises(ValueError):
                results.validate(r)

    def test_impossible_cross_series_timestamps_fail(self):
        r = synthetic_run()
        values = r["raw"]["metrics"]["bench_finish_unix_ms"]["values"]
        epoch = r["raw"]["metrics"]["bench_scenario_unix_ms"]["values"]["min"]
        for key in results.TREND_STATS:
            if key != "count":
                values[key] = epoch + 2
        with self.assertRaisesRegex(ValueError, "precedes"):
            results.validate(r)
        r = synthetic_run()
        r["raw"]["metrics"]["bench_start_ms"]["values"]["min"] = 100
        with self.assertRaisesRegex(ValueError, "precedes"):
            results.validate(r)
        r = synthetic_run()
        r["raw"]["metrics"]["bench_finish_unix_ms"]["values"]["avg"] = epoch + 1000
        with self.assertRaisesRegex(ValueError, "mean completion"):
            results.validate(r)

    def test_arrival_tolerance_requires_adequate_relative_delivery_and_labels_it(self):
        # Keep all counters/rates/trend counts internally consistent when
        # changing the number of synthetic requests.
        def request_count(record, n):
            raw = record["raw"]
            elapsed = raw["state"]["testRunDurationMs"] / 1000
            for name in ("http_reqs", "iterations"):
                raw["metrics"][name]["values"].update(count=n, rate=n / elapsed)
            for name, metric in raw["metrics"].items():
                if metric["type"] == "trend":
                    metric["values"]["count"] = n
                elif metric["type"] == "rate":
                    total = 4 * n if name == "checks" else n
                    passed = 0 if name == "http_req_failed" else total
                    metric["values"].update(passes=passed, fails=total - passed, rate=passed / total)

        for n, classification in ((25, "exact"), (24, "boundary-tolerated"), (26, "boundary-tolerated")):
            r = synthetic_run()
            request_count(r, n)
            validated, _ = results.validate(r)
            self.assertEqual(validated["arrival_classification"], classification)
            self.assertEqual(validated["arrival_delivery_fraction"], n / 25)
        r = synthetic_run()
        request_count(r, 23)
        with self.assertRaisesRegex(ValueError, "arrival count mismatch"):
            results.validate(r)
        r = synthetic_run()
        c = config()
        c["load"].update(rate=2, duration_seconds=1)
        attach_config(r, c)
        r["raw"]["setup_data"]["effective_options"]["scenarios"]["benchmark"].update(rate=2, duration="1s")
        request_count(r, 1)
        with self.assertRaisesRegex(ValueError, "arrival count mismatch"):
            results.validate(r)

    def test_mixed_scope_configuration_protocol_and_duplicate_runs_fail(self):
        for key, value in (("evidence_scope", "implementation-measurement"), ("implementation", "other-fixture"),
                           ("sut_config_sha256", "c" * 64), ("environment_id", "other-host")):
            a, b = synthetic_run(), synthetic_run()
            c = config()
            c["provenance"].update(run_id="second-unit-test")
            c["provenance"][key] = value
            attach_config(b, c)
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "mixed"):
                results.summarize([a, b])
        with self.assertRaisesRegex(ValueError, "duplicate run_id"):
            results.summarize([synthetic_run(), synthetic_run()])
        c = config()
        c["provenance"]["evidence_scope"] = "unmeasured"
        with self.assertRaises(ValueError):
            results.load_contract(c)
        c = config()
        c["load"]["expected"]["protocol"] = "HTTP/2.0"
        with self.assertRaisesRegex(ValueError, "h2c"):
            results.load_contract(c)
        a, b = synthetic_run(), synthetic_run()
        for record, protocol in ((a, "HTTP/1.1"), (b, "HTTP/2.0")):
            c = config()
            c["provenance"].update(run_id=f"protocol-{protocol}", target="https://fixture.example")
            c["load"]["expected"]["protocol"] = protocol
            attach_config(record, c)
        with self.assertRaisesRegex(ValueError, "mixed"):
            results.summarize([a, b])

    def test_strict_json_rejects_duplicates_nonfinite_and_missing_files(self):
        for text in ('{"rate":1,"rate":2}', '{"latency":NaN}', '{"latency":Infinity}'):
            with self.assertRaises(ValueError):
                results.strict_json(text)
        with self.assertRaises(ValueError):
            results.summarize([])


@unittest.skipUnless(shutil.which("node"), "optional JS isolation check needs existing Node; real k6 checks belong to the runner")
class K6GuardTests(unittest.TestCase):
    def test_default_requires_setup_before_network_even_when_exported_options_change(self):
        # Only k6 imports are stubbed; execute the actual load.js setup/default.
        script = r"""
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const kit=process.argv[1], config=JSON.parse(process.argv[2]);
const code=fs.readFileSync(path.join(kit,'load.js'),'utf8').replace(/^import .+;$/gm,'')
  .replace('export default function (setupData)','function iteration(setupData)').replace(/^export /gm,'')
  +'\nglobalThis.api={options,setup,iteration};';
function load() {
  let requests=0, samples=0, aborts=0;
  const execution={test:{abort(){aborts++;}},scenario:{startTime:Date.now()}};
  class Metric {add(){samples++;}}
  const context=vm.createContext({
    __ENV:{BENCHMARK_CONFIG:'run.json',BENCHMARK_OUTPUT:'raw.json'},
    open:name=>name==='run.json'?JSON.stringify(config):fs.readFileSync(path.join(kit,path.basename(name)),'utf8'),
    crypto:{sha256:value=>crypto.createHash('sha256').update(value).digest('hex')},
    http:{setResponseCallback(){},expectedStatuses(){},get(){requests++;return {status:200,proto:'HTTP/1.1',body:'{"fixture":true}',json(){return 'fixture-a';}};}},
    exec:execution, Rate:Metric,Trend:Metric,check(){},
  });
  vm.runInContext(code,context);
  execution.test.options=JSON.parse(JSON.stringify(context.api.options));
  return {api:context.api,execution,counts:()=>({requests,samples,aborts})};
}
for (const data of [undefined,null,{}, {validated_config_sha256:'wrong'}]) {
  const run=load();
  run.execution.test.options.scenarios={default:{executor:'shared-iterations',vus:5}};
  run.api.iteration(data);
  assert.deepEqual(run.counts(),{requests:0,samples:0,aborts:1});
}
const rewritten=load();
delete rewritten.api.options.scenarios.benchmark;
rewritten.api.options.maxRedirects=1;rewritten.api.options.thresholds={};
const data=rewritten.api.setup();
rewritten.api.iteration(data);
assert.equal(rewritten.counts().requests,1);
const override=load(), passed=override.api.setup();
override.execution.test.options.scenarios.benchmark.rate=20;
assert.throws(()=>override.api.iteration(passed),/differs/);
assert.equal(override.counts().requests,0);
"""
        result = subprocess.run([shutil.which("node"), "-e", script, str(HERE), json.dumps(config())],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)


class RecordedEvidenceTests(unittest.TestCase):
    def test_pinned_actual_runs_and_failure_cases(self):
        directory = HERE / "results/local-20260919"
        manifest = results.strict_json((directory / "SHA256.json").read_text())
        for name, digest in manifest["files"].items():
            self.assertEqual(Path(name).name, name)
            self.assertEqual(hashlib.sha256((directory / name).read_bytes()).hexdigest(), digest)
        valid = results.summarize([
            results.strict_json((directory / f"load-{number}.raw.json").read_text())
            for number in range(1, 4)
        ])
        self.assertEqual([run["requests"] for run in valid["runs"]], [26, 26, 25])
        self.assertEqual([run["arrival_classification"] for run in valid["runs"]],
                         ["boundary-tolerated", "boundary-tolerated", "exact"])
        self.assertIsNone(valid["ranking"])
        self.assertFalse(valid["gateway_api_conformance"])
        results.validate(results.strict_json((directory / "probe.raw.json").read_text()))
        for name in ("wrong-body", "dropped-arrivals", "override", "no-setup"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                results.validate(results.strict_json((directory / (name + ".raw.json")).read_text()))


if __name__ == "__main__":
    unittest.main()
