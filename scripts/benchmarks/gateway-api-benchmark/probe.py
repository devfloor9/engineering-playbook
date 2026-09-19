#!/usr/bin/env python3
"""Run explicit endpoint contracts, not controller conformance tests."""

import argparse
from collections import Counter
import http.client
import json
import math
from pathlib import Path
import platform
import re
from statistics import NormalDist
import sys
import time

from results import envelope, number, origin, provenance, request_contract, require, strict_json

FEATURES = {"echo", "controlled-failure", "controlled-delay", "path-match", "hostname-match",
            "header-match", "prefix-boundary", "rewrite", "header-mutation", "weighted-backends"}


def validate_cases(config):
    p = provenance(config)
    require(re.fullmatch(r"Python \d+\.\d+\.\d+ http\.client", p["generator_version"]),
            "probe provenance.generator_version must identify Python X.Y.Z http.client")
    settings = config.get("probe", {})
    interval = number(settings.get("interval_ms"), "probe.interval_ms", 50, True)
    require(interval <= 10000, "probe interval exceeds 10 seconds")
    number(settings.get("timeout_ms"), "probe.timeout_ms", 1, True)
    require(settings["timeout_ms"] <= 5000, "probe timeout exceeds 5 seconds")
    cases = settings.get("cases")
    require(isinstance(cases, list) and cases, "explicit probe cases are required")
    names, total = set(), 0
    for case in cases:
        require(isinstance(case.get("name"), str) and case["name"] and case["name"] not in names,
                "case names must be unique and nonempty")
        names.add(case["name"])
        require(case.get("feature") in FEATURES, "unknown case feature")
        require(case.get("polarity") in ("positive", "negative", "observation"), "explicit polarity required")
        request_contract(case.get("request", {}))
        expected = case.get("expected", {})
        number(expected.get("status"), "expected.status", 200, True)
        require(expected["status"] <= 599, "invalid expected status")
        require(expected.get("protocol") in ("HTTP/1.0", "HTTP/1.1", "HTTP/2.0"), "expected protocol required")
        # http.client intentionally speaks HTTP/1.1 only. Do not mislabel this as an h2 probe.
        require(expected["protocol"] != "HTTP/2.0", "Python feature probes do not support HTTP/2; use a separate client")
        allowed = {"status", "protocol", "body_contains", "json", "absent_json_paths",
                   "response_headers", "absent_response_headers"}
        require(set(expected) <= allowed, "unknown expected field (possible silently ignored assertion)")
        if "body_contains" in expected:
            require(isinstance(expected["body_contains"], str) and expected["body_contains"], "empty body assertion")
        require(isinstance(expected.get("json", {}), dict), "expected.json must be a subset object")
        for path in expected.get("absent_json_paths", []):
            require(isinstance(path, list) and path and all(isinstance(key, str) for key in path),
                    "absent_json_paths must contain key arrays")
        require(isinstance(expected.get("response_headers", {}), dict), "response_headers must be an object")
        for key, value in expected.get("response_headers", {}).items():
            require(isinstance(key, str) and isinstance(value, str), "response header assertions must be strings")
        require(all(isinstance(key, str) for key in expected.get("absent_response_headers", [])),
                "absent response headers must be strings")
        samples = number(case.get("samples", 1), "samples", 1, True)
        require(samples <= 500, "case exceeds 500 requests")
        total += samples
        require(case["feature"] != "weighted-backends" or "distribution" in case,
                "weighted-backends requires an explicit distribution contract")
        if "distribution" in case:
            require(case["feature"] == "weighted-backends", "distribution requires a weighted-backends case")
            d = case["distribution"]
            weights = d.get("weights", {})
            require(isinstance(weights, dict) and len(weights) >= 2, "at least two backend weights required")
            for name, weight in weights.items():
                require(isinstance(name, str) and name, "invalid weighted backend ID")
                number(weight, "weight")
            require(sum(weights.values()) > 0, "weights cannot all be zero")
            require(0.9 <= number(d.get("confidence", 0.95), "confidence") < 1, "confidence must be [0.9, 1)")
            number(d.get("min_samples", 100), "min_samples", 30, True)
    require(total <= (500 if p["evidence_scope"] == "local-fixture" else 5000), "probe request budget exceeded")
    return cases


def subset(actual, expected, path="body"):
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return [f"{path}: expected object"]
        return [error for key, value in expected.items()
                for error in (subset(actual[key], value, f"{path}.{key}") if key in actual else [f"{path}.{key}: missing"])]
    return [] if type(actual) is type(expected) and actual == expected else [f"{path}: unexpected value"]


def present(body, path):
    for key in path:
        if not isinstance(body, dict) or key not in body:
            return False
        body = body[key]
    return True


def distribution(counts, specification):
    weights = specification["weights"]
    n = sum(counts.values())
    unexpected = set(counts) - set(weights)
    if unexpected or any(counts.get(key, 0) and weight == 0 for key, weight in weights.items()):
        return {"outcome": "fail", "reason": "unexpected or zero-weight backend observed", "counts": dict(counts)}
    confidence = specification.get("confidence", 0.95)
    # Bonferroni-adjusted Wilson intervals for the marginals of a multinomial.
    # These are compatibility intervals, not proof of a controller's weights.
    z = NormalDist().inv_cdf(1 - (1 - confidence) / (2 * len(weights)))
    intervals, compatible = {}, True
    enough = n >= specification.get("min_samples", 100)
    for key, weight in weights.items():
        probability = weight / sum(weights.values())
        enough = enough and (probability in (0, 1) or n * min(probability, 1 - probability) >= 5)
        if n == 0:
            low, high = 0.0, 1.0
        else:
            observed = counts.get(key, 0) / n
            center = (observed + z * z / (2 * n)) / (1 + z * z / n)
            half = z * math.sqrt(observed * (1 - observed) / n + z * z / (4 * n * n)) / (1 + z * z / n)
            low, high = max(0.0, center - half), min(1.0, center + half)
        intervals[key] = {"observed": counts.get(key, 0), "expected_fraction": probability, "low": low, "high": high}
        compatible = compatible and low - 1e-12 <= probability <= high + 1e-12
    return {"outcome": "inconclusive" if not enough else ("pass" if compatible else "fail"),
            "samples": n, "confidence_family": confidence, "method": "Bonferroni-adjusted Wilson",
            "intervals": intervals, "assumption": "independent backend selections; affinity may invalidate this assumption"}


def evaluate(case, observations):
    errors, counts = [], Counter()
    e = case["expected"]
    for index, observation in enumerate(observations):
        prefix = f"sample {index + 1}"
        if observation.get("error"):
            errors.append(f"{prefix}: {observation['error']}")
            continue
        for field in ("status", "protocol"):
            if observation.get(field) != e[field]:
                errors.append(f"{prefix}: unexpected {field}")
        body = observation.get("body", "")
        if "body_contains" in e and e["body_contains"] not in body:
            errors.append(f"{prefix}: body substring missing")
        parsed = None
        if "json" in e or "absent_json_paths" in e or "distribution" in case:
            try:
                parsed = strict_json(body)
            except (ValueError, TypeError):
                errors.append(f"{prefix}: invalid JSON body")
            else:
                errors.extend(f"{prefix}: {error}" for error in subset(parsed, e.get("json", {})))
                for path in e.get("absent_json_paths", []):
                    if present(parsed, path):
                        errors.append(f"{prefix}: unexpected JSON key path {path}")
        headers = {key.lower(): value for key, value in observation.get("headers", {}).items()}
        for key, value in e.get("response_headers", {}).items():
            if headers.get(key.lower()) != value:
                errors.append(f"{prefix}: response header {key} mismatch")
        for key in e.get("absent_response_headers", []):
            if key.lower() in headers:
                errors.append(f"{prefix}: response header {key} present")
        if "distribution" in case:
            backend = parsed.get("backend_id") if isinstance(parsed, dict) else None
            if not isinstance(backend, str):
                errors.append(f"{prefix}: backend_id missing")
            else:
                counts[backend] += 1
    result = {"outcome": "fail" if errors else "pass", "errors": errors}
    if "distribution" in case:
        result["distribution"] = distribution(counts, case["distribution"])
        if not errors:
            result["outcome"] = result["distribution"]["outcome"]
    return result


def request(target, case, timeout_ms):
    parsed = origin(target)
    connection_type = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
    connection = connection_type(parsed.hostname, parsed.port, timeout=timeout_ms / 1000)
    try:
        headers = {**case["request"].get("headers", {})}
        # One new client connection per probe sample. No redirects or retries.
        headers = {k: v for k, v in headers.items() if k.lower() != "connection"}
        headers["Connection"] = "close"
        connection.request("GET", case["request"]["path"], headers=headers)
        response = connection.getresponse()
        raw = response.read(1048577)
        require(len(raw) <= 1048576, "probe response exceeds 1 MiB")
        # Bounded read(amount) may return early EOF without IncompleteRead.
        # For a Content-Length body, any remaining declared bytes invalidate it.
        require(response.length in (None, 0), "incomplete Content-Length response")
        return {"status": response.status, "protocol": {10: "HTTP/1.0", 11: "HTTP/1.1"}.get(response.version, str(response.version)),
                "headers": dict(response.getheaders()), "body": raw.decode("utf-8", errors="strict")}
    except (OSError, http.client.HTTPException, ValueError, UnicodeError) as error:
        return {"error": f"{type(error).__name__}: {error}"}
    finally:
        connection.close()


def run(config_text):
    config = strict_json(config_text)
    cases = validate_cases(config)
    actual_generator = f"Python {platform.python_version()} http.client"
    require(config["provenance"]["generator_version"] == actual_generator,
            f"probe generator provenance mismatch: actual {actual_generator}")
    settings, reports = config["probe"], []
    next_start = time.monotonic()
    for case in cases:
        observations = []
        for _ in range(case.get("samples", 1)):
            time.sleep(max(0, next_start - time.monotonic()))
            observations.append(request(config["provenance"]["target"], case, settings["timeout_ms"]))
            next_start = time.monotonic() + settings["interval_ms"] / 1000
        reports.append({"name": case["name"], "observations": observations, "evaluation": evaluate(case, observations)})
    result = envelope("gateway-api-probe", config_text, actual_generator, __file__)
    result["cases"] = reports
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path, help="new file, never overwrites existing evidence")
    args = parser.parse_args()
    try:
        require(not args.output.exists(), "output already exists; choose a new run path")
        result = run(args.config.read_text())
        with args.output.open("x") as output:
            json.dump(result, output, indent=2, allow_nan=False)
        outcomes = [case["evaluation"]["outcome"] for case in result["cases"]]
        print(json.dumps({"output": str(args.output), "outcomes": outcomes, "gateway_api_conformance": False}))
        return 1 if "fail" in outcomes else (2 if "inconclusive" in outcomes else 0)
    except (ValueError, KeyError, TypeError, AttributeError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
