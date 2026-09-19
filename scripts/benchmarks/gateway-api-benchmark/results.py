#!/usr/bin/env python3
"""Validate raw runs, then report per-run values without producing a ranking."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

SCHEMA = 1
SCOPES = {"local-fixture", "implementation-measurement"}
PROTOCOLS = {"HTTP/1.1", "HTTP/2.0"}
CONTRACT_METRICS = ("bench_status_ok", "bench_body_ok", "bench_backend_ok", "bench_protocol_ok")
TREND_STATS = ["min", "med", "p(90)", "p(95)", "p(99)", "max", "avg", "count"]
CLOCK_RESOLUTION_MS = 2


def require(condition, message):
    if not condition:
        raise ValueError(message)


def strict_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, f"duplicate JSON key: {key}")
            result[key] = value
        return result

    def invalid(value):
        raise ValueError(f"non-finite JSON value: {value}")

    return json.loads(text, object_pairs_hook=pairs, parse_constant=invalid)


def number(value, label, minimum=0, integer=False):
    require(type(value) in (int, float) and math.isfinite(value) and value >= minimum,
            f"{label}: invalid number")
    if integer:
        require(value == int(value), f"{label}: expected integer")
    return value


def origin(value):
    require(isinstance(value, str), "target must be an HTTP(S) origin")
    parsed = urlsplit(value)
    require(parsed.scheme in ("http", "https") and parsed.hostname and
            parsed.path in ("", "/") and not parsed.query and not parsed.fragment and
            not parsed.username and not parsed.password, "target must be an HTTP(S) origin without credentials")
    require(parsed.port is None or parsed.port > 0, "target port must be in [1, 65535]")
    return parsed


def provenance(config):
    require(config.get("schema_version") == SCHEMA, "unsupported configuration schema")
    p = config.get("provenance", {})
    for name in ("run_id", "target", "implementation", "implementation_version", "evidence_scope",
                 "environment_id", "environment_notes", "generator_version", "source_revision",
                 "sut_config_sha256"):
        value = p.get(name)
        require(isinstance(value, str) and value.strip() and
                not re.search(r"REPLACE|UNMEASURED|TODO|<[^>]+>", value, re.I),
                f"missing/placeholder provenance: {name}")
    require(p["evidence_scope"] in SCOPES, "unmeasured/unknown scope is not runnable evidence")
    require(re.fullmatch(r"(?:[0-9a-f]{40}|[0-9a-f]{64})", p["source_revision"]), "source_revision must be a Git hash")
    require(re.fullmatch(r"[0-9a-f]{64}", p["sut_config_sha256"]), "sut_config_sha256 must be SHA-256")
    origin(p["target"])
    return p


def load_contract(config):
    p = provenance(config)
    c = config.get("load", {})
    local = p["evidence_scope"] == "local-fixture"
    limits = {"rate": (1, 20 if local else 10000), "duration_seconds": (1, 30 if local else 3600),
              "preallocated_vus": (1, 4 if local else 1000), "max_vus": (1, 4 if local else 1000),
              "timeout_ms": (1, 2000 if local else 60000), "grace_seconds": (1, 5 if local else 120)}
    for key, (low, high) in limits.items():
        require(low <= number(c.get(key), key, low, True) <= high, f"{key} exceeds scope cap {high}")
    require(c["preallocated_vus"] <= c["max_vus"], "preallocated_vus exceeds max_vus")
    require(c["timeout_ms"] <= c["grace_seconds"] * 1000, "timeout must fit within graceful stop")
    request_contract(c)
    e = c.get("expected", {})
    number(e.get("status"), "expected.status", 200, True)
    require(e["status"] <= 599 and e["status"] not in (204, 205, 304), "expected status must permit a body")
    require(isinstance(e.get("body_contains"), str) and e["body_contains"], "expected body must be nonempty")
    require(isinstance(e.get("backend_ids"), list) and e["backend_ids"] and
            all(isinstance(v, str) and v for v in e["backend_ids"]) and
            len(set(e["backend_ids"])) == len(e["backend_ids"]), "expected backend IDs must be distinct strings")
    require(e.get("protocol") in PROTOCOLS, "expected protocol must be explicit")
    require(not (origin(p["target"]).scheme == "http" and e["protocol"] == "HTTP/2.0"),
            "k6 HTTP/2 requires HTTPS; h2c is not supported by this kit")
    return c


def request_contract(request):
    path = request.get("path")
    require(isinstance(path, str) and path.startswith("/") and not path.startswith("//") and
            "#" not in path and not re.search(r"[\x00-\x20\x7f]", path), "request path must be encoded, origin-relative, without fragment")
    headers = request.get("headers", {})
    require(isinstance(headers, dict), "headers must be an object")
    seen = set()
    for key, value in headers.items():
        require(isinstance(key, str) and re.fullmatch(r"[!#$%&'*+.^_`|~0-9A-Za-z-]+", key),
                "invalid header name")
        require(key.lower() not in seen, "duplicate case-insensitive header")
        seen.add(key.lower())
        require(isinstance(value, str) and not re.search(r"[\r\n\x00]", value), "invalid header value")
        require(key.lower() not in ("content-length", "transfer-encoding"), "GET framing headers are not supported")


def envelope(kind, config_text, generator, source):
    directory = Path(source).parent
    code = "".join(name + "\0" + (directory / name).read_text() + "\0"
                   for name in ("fixture.py", "probe.py", "load.js", "results.py"))
    return {
        "schema_version": SCHEMA, "kind": kind, "config_text": config_text,
        "config_sha256": hashlib.sha256(config_text.encode()).hexdigest(),
        "harness_sha256": hashlib.sha256(code.encode()).hexdigest(),
        "generator": generator, "finished_at": datetime.now(timezone.utc).isoformat(),
        "gateway_api_conformance": False,
    }


def metric(raw, name, kind, contains="default"):
    m = raw.get("metrics", {}).get(name)
    require(isinstance(m, dict) and m.get("type") == kind and m.get("contains") == contains,
            f"missing/wrong metric type: {name}")
    values = m.get("values")
    require(isinstance(values, dict), f"missing metric values: {name}")
    return values


def counter(raw, name, optional=False):
    if optional and name not in raw.get("metrics", {}):
        return 0
    return number(metric(raw, name, "counter").get("count"), name, integer=True)


def rate(raw, name, total, passes):
    values = metric(raw, name, "rate")
    require(values.get("passes") == passes and values.get("fails") == total - passes,
            f"{name}: wrong sample count or failed response contract")
    require(math.isclose(number(values.get("rate"), name), passes / total, abs_tol=1e-9),
            f"{name}: inconsistent rate")


def trend(raw, name, total):
    values = metric(raw, name, "trend", "time")
    for key in TREND_STATS:
        number(values.get(key), f"{name}.{key}", integer=key == "count")
    require(values["count"] == total, f"{name}: incomplete samples")
    ordered = [values[key] for key in ("min", "med", "p(90)", "p(95)", "p(99)", "max")]
    require(ordered == sorted(ordered) and values["min"] <= values["avg"] <= values["max"],
            f"{name}: inconsistent percentiles")
    return values


def duration(value):
    require(isinstance(value, str), "effective duration must have an explicit unit")
    tokens = re.findall(r"([0-9]+(?:\.[0-9]+)?)(ms|s|m|h)", value)
    require(tokens and "".join(amount + unit for amount, unit in tokens) == value, "invalid effective duration")
    return sum(float(amount) * {"ms": 1, "s": 1000, "m": 60000, "h": 3600000}[unit] for amount, unit in tokens)


def validate_k6(record, config):
    c = load_contract(config)
    raw = record.get("raw", {})
    require(record.get("summary_format") == "k6-2.2-legacy", "unsupported summary format")
    setup_data = raw.get("setup_data") or {}
    require(setup_data.get("validated_config_sha256") == record["config_sha256"],
            "missing/mismatched validated setup configuration")
    effective = setup_data.get("effective_options", {})
    require(set(effective.get("scenarios", {})) == {"benchmark"}, "missing/overridden effective scenario")
    scenario_options = effective["scenarios"]["benchmark"]
    for key, expected in (("executor", "constant-arrival-rate"), ("rate", c["rate"]),
                          ("preAllocatedVUs", c["preallocated_vus"]), ("maxVUs", c["max_vus"])):
        require(scenario_options.get(key) == expected, f"effective {key} differs from recorded configuration")
    for key, milliseconds in (("duration", c["duration_seconds"] * 1000), ("timeUnit", 1000),
                              ("gracefulStop", c["grace_seconds"] * 1000)):
        require(duration(scenario_options.get(key)) == milliseconds, f"effective {key} differs from recorded configuration")
    start_time = scenario_options.get("startTime")
    require(duration("0s" if start_time is None else start_time) == 0, "unexpected delayed scenario")
    for key, expected in (("maxRedirects", 0), ("insecureSkipTLSVerify", False), ("noConnectionReuse", False),
                          ("noVUConnectionReuse", False), ("discardResponseBodies", False)):
        require(key in effective and effective[key] == expected, f"effective {key} differs from contract")
    require(effective.get("executionSegment") in (None, "0:1"), "distributed execution is unsupported")
    require(record.get("units") == {"latency": "ms", "time": "ms", "rate": "requests/s"},
            "missing/inconsistent units")
    require(raw.get("options", {}).get("summaryTimeUnit") == "ms", "raw time unit must be ms")
    require(raw.get("options", {}).get("summaryTrendStats") == TREND_STATS, "unexpected trend statistics")
    n = counter(raw, "http_reqs")
    require(n > 0, "run made no requests")
    require(counter(raw, "iterations") == n, "interrupted iterations, extra requests or redirects")
    require(counter(raw, "dropped_iterations", optional=True) == 0, "dropped arrivals invalidate the run")
    planned = c["rate"] * c["duration_seconds"]
    difference = n - planned
    # Tolerance is a disclosed acceptance policy, not proof of a timer race.
    require(difference == 0 or (abs(difference) == 1 and planned >= 20 and
                               0.95 <= n / planned <= 1.05),
            "arrival count mismatch: boundary tolerance needs >=20 planned arrivals and 95–105% delivery")
    for name in CONTRACT_METRICS:
        rate(raw, name, n, n)
    rate(raw, "checks", 4 * n, 4 * n)
    rate(raw, "http_req_failed", n, 0)
    latency = trend(raw, "http_req_duration", n)
    starts = trend(raw, "bench_start_ms", n)
    scenario = trend(raw, "bench_scenario_unix_ms", n)
    finishes = trend(raw, "bench_finish_unix_ms", n)
    require(scenario["min"] == scenario["max"], "multiple scenarios or start epochs")
    duration_ms = number(raw.get("state", {}).get("testRunDurationMs"), "testRunDurationMs", 1)
    planned_ms = c["duration_seconds"] * 1000
    require(planned_ms - 100 <= duration_ms <= planned_ms + c["grace_seconds"] * 1000 + 1000,
            "actual duration inconsistent with schedule/grace; possible unit error")
    period = 1000 / c["rate"]
    require(starts["min"] <= period + 250 and starts["max"] <= planned_ms + 100 and
            starts["max"] >= max(0, planned_ms - 2 * period - 250),
            "request starts do not cover the declared arrival window")
    require(scenario["min"] >= 1577836800000 and finishes["min"] >= scenario["min"] and
            finishes["max"] <= scenario["min"] + duration_ms + 1000, "inconsistent Unix-ms timestamps")
    # Each completion follows its own start and contains http_req_duration.
    # Sorting preserves that lower bound even without paired point samples.
    for key in ("min", "med", "p(90)", "p(95)", "p(99)", "max"):
        require(finishes[key] + CLOCK_RESOLUTION_MS >= scenario["min"] + starts[key] + latency["min"],
                f"finish {key} precedes starts/minimum request latency")
    require(finishes["avg"] + CLOCK_RESOLUTION_MS >= scenario["min"] + starts["avg"] + latency["avg"],
            "mean completion precedes mean start plus request latency")
    require(finishes["max"] + CLOCK_RESOLUTION_MS >= scenario["min"] + starts["min"] + latency["max"],
            "maximum request latency exceeds the observed start/finish window")
    finished = datetime.fromisoformat(record["finished_at"].replace("Z", "+00:00"))
    require(finished.tzinfo is not None and
            0 <= finished.timestamp() * 1000 - finishes["max"] <= 10000, "finish time inconsistent with samples")
    require(latency["max"] <= c["timeout_ms"] + 250, "latency inconsistent with timeout or millisecond unit")
    observed_rate = number(metric(raw, "http_reqs", "counter").get("rate"), "http_reqs.rate")
    require(math.isclose(observed_rate, n / (duration_ms / 1000), rel_tol=0.005, abs_tol=0.001),
            "request rate must use actual elapsed seconds, not milliseconds or scheduled duration")
    for name, value in raw.get("metrics", {}).items():
        for expression, threshold in value.get("thresholds", {}).items():
            require(threshold.get("ok") is True, f"failed threshold: {name} {expression}")
    for name, expression in (("http_reqs", "count>0"), ("http_req_failed", "rate==0"),
                             ("checks", "rate==1"), *((name, "rate==1") for name in CONTRACT_METRICS)):
        require(raw["metrics"][name].get("thresholds", {}).get(expression, {}).get("ok") is True,
                f"missing enforced threshold: {name} {expression}")
    require(effective.get("thresholds", {}).get("dropped_iterations") == ["count==0"],
            "missing dropped-arrival threshold")
    return {"requests": n, "planned_arrivals": planned, "arrival_boundary_difference": difference,
            "arrival_classification": "exact" if difference == 0 else "boundary-tolerated",
            "arrival_delivery_fraction": n / planned,
            "timestamp_resolution_tolerance_ms": CLOCK_RESOLUTION_MS,
            "actual_duration_ms": duration_ms, "achieved_requests_per_second": observed_rate,
            "http_req_duration_ms": latency,
            "note": "Per-run request duration excludes initial DNS/connection setup; no percentile averaging."}


def validate(record):
    require(record.get("schema_version") == SCHEMA, "unsupported result schema")
    text = record.get("config_text")
    require(isinstance(text, str) and hashlib.sha256(text.encode()).hexdigest() == record.get("config_sha256"),
            "missing/mismatched configuration digest")
    config = strict_json(text)
    p = provenance(config)
    require(re.fullmatch(r"[0-9a-f]{64}", record.get("harness_sha256", "")), "missing harness digest")
    require(isinstance(record.get("generator"), str) and record["generator"], "missing generator provenance")
    require(record["generator"] == p["generator_version"], "generator provenance mismatch")
    finished = datetime.fromisoformat(record.get("finished_at", "").replace("Z", "+00:00"))
    require(finished.tzinfo is not None, "finished_at must include a timezone")
    require(record.get("gateway_api_conformance") is False, "these cases cannot claim Gateway API conformance")
    require(record.get("kind") in ("gateway-api-k6", "gateway-api-probe"), "unknown result kind")
    if record["kind"] == "gateway-api-k6":
        values = validate_k6(record, config)
    else:
        # Recompute all assertions and intervals from retained observations.
        from probe import evaluate, validate_cases
        cases = validate_cases(config)
        reports = record.get("cases", [])
        require(len(reports) == len(cases), "missing probe cases")
        values = {"cases": []}
        for case, report in zip(cases, reports):
            require(report.get("name") == case["name"] and len(report.get("observations", [])) == case.get("samples", 1),
                    "missing or reordered probe observations")
            recomputed = evaluate(case, report["observations"])
            require(recomputed == report.get("evaluation"), "probe evaluation differs from raw observations")
            require(recomputed["outcome"] == "pass", f"{case['name']}: {recomputed['outcome']}")
            values["cases"].append({"name": case["name"], **recomputed})
    return {"provenance": p, "actual_generator": record["generator"], "kind": record["kind"], **values}, config


def summarize(records):
    require(records, "no result files")
    output, fingerprints, run_ids = [], set(), set()
    for record in records:
        run, config = validate(record)
        p = run["provenance"]
        require(p["run_id"] not in run_ids, "duplicate run_id")
        run_ids.add(p["run_id"])
        fingerprints.add(json.dumps({
            "kind": run["kind"], "provenance": {key: value for key, value in p.items() if key != "run_id"},
            "harness": record["harness_sha256"], "generator": record["generator"],
            "load": config.get("load") if run["kind"] == "gateway-api-k6" else None,
            "probe": config.get("probe") if run["kind"] == "gateway-api-probe" else None,
        }, sort_keys=True))
        output.append(run)
    require(len(fingerprints) == 1, "refusing mixed protocols/scopes/implementations/configurations/environments")
    return {"valid": True, "ranking": None, "gateway_api_conformance": False, "runs": output,
            "interpretation": "Local fixture evidence validates only this harness/fixture contract. "
                              "No implementation speed ranking or averaged percentiles is produced."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", type=Path, help="raw JSON files; output is JSON on stdout")
    args = parser.parse_args()
    try:
        result = summarize([strict_json(file.read_text()) for file in args.files])
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as error:
        print(json.dumps({"valid": False, "error": str(error), "ranking": None}), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
