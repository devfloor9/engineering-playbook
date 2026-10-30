#!/usr/bin/env python3
"""Check local evidence completeness; never deploy, run traffic, or close issues."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import sys

REQUIREMENTS = {
    4: (
        "hybrid-placement-adr", "hybrid-endpoint-network-contracts",
        "hybrid-iam-sts-oauth-positive-negative", "hybrid-cross-tenant-session-isolation",
        "hybrid-state-replay-deletion-dedup-tracing", "hybrid-migration-recovery-approval",
        "kfs-domain-ontology-temporal-approval", "kfs-real-adapter-ordering-crash-visibility",
        "kfs-publication-generation-reconciliation", "kfs-freshness-retention-history-approval",
        "kfs-matched-quality-latency-cost", "kfs-derived-authorization-deletion",
        "issue-5-operator-acceptance", "issue-7-operator-acceptance",
    ),
    5: (
        "trace-export-pagination-final-attempt-dedup",
        "trace-independent-labels-sql-python-reconciliation",
        "trace-metric-units-nonfinite-cost-coverage",
        "canary-preregistered-cohorts-counts-windows-gates",
        "canary-observed-shares-ttft-stream-duration",
        "rollback-propagation-active-stream-recovery", "fallback-429-retry-after",
        "fallback-503-connection-failure", "fallback-deadline-both-failed-no-alternate",
        "cache-authorization-tenants-expiry-model-prompt",
        "authorization-partial-stream-tool-dedup", "alternate-capacity-quality-data-policy",
    ),
    7: (
        "stack-gpu-topology-model-runtime-hashes",
        "stack-memory-ipc-rdma-checkpoint-restore-support",
        "node-ownership-scope-retention-rollback-approval",
        "preregistered-fixture-load-repetitions-degradation",
        "replacement-readiness-warmup-routing-capacity", "no-replacement-correlated-capacity-loss",
        "utc-notice-deadline-admission-endpoint-stream-readiness",
        "request-outcomes-dedup-deadline-reconciliation", "kv-transfer-restore-recompute-evidence",
        "restoration-integrity-rank-health-cold-fallback", "matched-ready-cold-connector-comparison",
        "warm-cold-ttft-errors-readiness-usage-cost", "failed-checkpoint-partial-stream-tool-dedup",
    ),
    80: (
        "deployment-traffic-path-resource-conditions", "standard-extended-custom-feature-contracts",
        "http-open-arrival-repeated-baseline", "tls-protocol-certificate-validation",
        "route-scale", "failure-recovery", "grpc-streaming", "sse-streaming",
        "resource-utilization-cost-reconciliation",
    ),
}
UNSUPPORTED_CASES = {
    7: {"stack-memory-ipc-rdma-checkpoint-restore-support",
        "restoration-integrity-rank-health-cold-fallback", "matched-ready-cold-connector-comparison",
        "failed-checkpoint-partial-stream-tool-dedup"},
    80: {"grpc-streaming", "sse-streaming"},
}
SCOPES = {"operator-deployment", "implementation-measurement"}
HEX = re.compile(r"[0-9a-f]{64}")
PLACEHOLDER = re.compile(r"\b(?:TODO|TBD|REPLACE|UNMEASURED|not_run)\b|<[^>]+>", re.I)


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
        raise ValueError(f"nonfinite JSON value: {value}")

    return json.loads(text, object_pairs_hook=pairs, parse_constant=invalid)


def text(value, label):
    require(isinstance(value, str) and value.strip() and not PLACEHOLDER.search(value),
            f"{label}: missing or placeholder")
    return value


def utc(value, label):
    text(value, label)
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{label}: invalid UTC timestamp") from error
    require(result.tzinfo is not None and result.utcoffset().total_seconds() == 0,
            f"{label}: explicit UTC timezone required")
    return result


def positive(value, label, integer=False):
    require(type(value) in (int, float) and math.isfinite(value) and value > 0,
            f"{label}: positive finite number required")
    require(not integer or type(value) is int, f"{label}: integer required")
    return value


def artifact(value, root, label):
    require(isinstance(value, dict), f"{label}: artifact object required")
    filename = text(value.get("path"), f"{label}.path")
    digest = value.get("sha256")
    require(isinstance(digest, str) and HEX.fullmatch(digest), f"{label}: SHA-256 required")
    relative = Path(filename)
    require(not relative.is_absolute() and ".." not in relative.parts,
            f"{label}: path must remain within the evidence directory")
    path = (root / relative).resolve()
    require(path.is_relative_to(root.resolve()) and path.is_file(),
            f"{label}: artifact missing or outside evidence directory")
    require(0 < path.stat().st_size <= 64 * 1024 * 1024,
            f"{label}: artifact must contain 1 byte to 64 MiB")
    observed = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            observed.update(block)
    require(observed.hexdigest() == digest, f"{label}: artifact digest mismatch")
    return digest


def template(issue):
    require(issue in REQUIREMENTS, "unsupported issue")
    return {
        "schema_version": 1, "issue": issue,
        "evidence_scope": "implementation-measurement" if issue == 80 else "operator-deployment",
        "environment": {"target_alias": None, "region": None, "namespace": None,
                        "deployment_manifest": {"path": None, "sha256": None}},
        "authorization": {"operator_role": None, "approved_at": None,
                          "approval": {"path": None, "sha256": None}, "budget_currency": "USD",
                          "budget_limit": None, "stop_threshold": None, "cleanup_reserve": None,
                          "rollback_owner_role": None},
        "protocol": {"registered_at": None, "manifest": {"path": None, "sha256": None},
                     "minimum_samples": None, "repetitions": None},
        "execution": {"started_at": None, "finished_at": None},
        "cases": [{"id": name, "status": "not_run", "samples": None, "repetitions": None,
                   "expected": None, "observed": None, "raw": {"path": None, "sha256": None},
                   "limitations": []} for name in REQUIREMENTS[issue]],
        "cost": {"complete": False, "report": {"path": None, "sha256": None}},
        "operator_review": {"accepted_at": None, "approver_roles": [],
                            "approval": {"path": None, "sha256": None}},
        "dependencies": {},
    }


def validate(bundle, root, mode="evidence", now=None, seen=None):
    require(mode in ("preflight", "evidence"), "unsupported validation mode")
    require(isinstance(bundle, dict), "evidence bundle must be an object")
    require(type(bundle.get("schema_version")) is int and bundle["schema_version"] == 1,
            "unsupported schema_version")
    issue = bundle.get("issue")
    require(type(issue) is int and issue in REQUIREMENTS, "unsupported issue")
    require(bundle.get("evidence_scope") in SCOPES,
            "fixture/upstream/unmeasured evidence cannot close live gaps")
    require((issue == 80) == (bundle["evidence_scope"] == "implementation-measurement"),
            "evidence scope differs from issue")
    now = now or datetime.now(timezone.utc)
    env = bundle.get("environment", {})
    for key in ("target_alias", "region", "namespace"):
        text(env.get(key), f"environment.{key}")
    artifact(env.get("deployment_manifest"), root, "environment.deployment_manifest")
    authorization = bundle.get("authorization", {})
    for key in ("operator_role", "rollback_owner_role", "budget_currency"):
        text(authorization.get(key), f"authorization.{key}")
    approved = utc(authorization.get("approved_at"), "authorization.approved_at")
    require(approved <= now, "authorization approval is in the future")
    artifact(authorization.get("approval"), root, "authorization.approval")
    limit = positive(authorization.get("budget_limit"), "authorization.budget_limit")
    threshold = positive(authorization.get("stop_threshold"), "authorization.stop_threshold")
    reserve = positive(authorization.get("cleanup_reserve"), "authorization.cleanup_reserve")
    require(threshold + reserve <= limit, "stop threshold and cleanup reserve exceed budget")
    protocol = bundle.get("protocol", {})
    registered = utc(protocol.get("registered_at"), "protocol.registered_at")
    require(registered <= now, "protocol registration is in the future")
    artifact(protocol.get("manifest"), root, "protocol.manifest")
    minimum = positive(protocol.get("minimum_samples"), "protocol.minimum_samples", True)
    repetitions = positive(protocol.get("repetitions"), "protocol.repetitions", True)
    cases = bundle.get("cases")
    require(isinstance(cases, list) and all(isinstance(case, dict) for case in cases),
            "cases must be an array of objects")
    ids = [case.get("id") for case in cases]
    require(len(ids) == len(set(map(str, ids))) and set(map(str, ids)) == set(REQUIREMENTS[issue]),
            "all issue cases must appear exactly once")
    if mode == "preflight":
        require(all(case.get("status") == "not_run" for case in cases),
                "preflight must not present case outcomes as measurements")
        return {"issue": issue, "status": "ready_for_test_review", "cases": len(cases),
                "executes_requests": False, "closes_issue": False}
    execution = bundle.get("execution", {})
    started = utc(execution.get("started_at"), "execution.started_at")
    finished = utc(execution.get("finished_at"), "execution.finished_at")
    require(max(approved, registered) <= started <= finished <= now,
            "authorization/protocol must precede a completed UTC execution window")
    for case in cases:
        label = f"cases.{case['id']}"
        require(case.get("status") in ("pass", "unsupported"), f"{label}: no accepted observed outcome")
        text(case.get("expected"), f"{label}.expected")
        text(case.get("observed"), f"{label}.observed")
        artifact(case.get("raw"), root, f"{label}.raw")
        limitations = case.get("limitations")
        require(isinstance(limitations, list) and all(isinstance(v, str) and v.strip() for v in limitations),
                f"{label}: limitations array required")
        if case["status"] == "unsupported":
            require(case["id"] in UNSUPPORTED_CASES.get(issue, set()) and limitations,
                    f"{label}: required case cannot be skipped; optional support requires limitations")
        else:
            require(positive(case.get("samples"), f"{label}.samples", True) >= minimum,
                    f"{label}: fewer samples than preregistered minimum")
            require(positive(case.get("repetitions"), f"{label}.repetitions", True) >= repetitions,
                    f"{label}: fewer repetitions than preregistered minimum")
    cost = bundle.get("cost", {})
    require(cost.get("complete") is True, "cost: incomplete infrastructure/retry/idle/cleanup accounting")
    artifact(cost.get("report"), root, "cost.report")
    review = bundle.get("operator_review", {})
    reviewed = utc(review.get("accepted_at"), "operator_review.accepted_at")
    require(finished <= reviewed <= now, "operator review must follow execution and precede now")
    roles = review.get("approver_roles")
    require(isinstance(roles, list) and roles and all(isinstance(role, str) and role.strip() for role in roles),
            "operator_review: dated approver roles required")
    artifact(review.get("approval"), root, "operator_review.approval")
    dependencies = bundle.get("dependencies", {})
    require(isinstance(dependencies, dict), "dependencies must be an object")
    if issue == 4:
        require(set(dependencies) == {"5", "7"}, "issue 4 requires evidence bundles for issues 5 and 7")
        seen = set() if seen is None else seen
        for number in (5, 7):
            reference = dependencies[str(number)]
            artifact(reference, root, f"dependencies.{number}")
            path = (root / reference["path"]).resolve()
            require(path not in seen, "cyclic evidence dependency")
            child = strict_json(path.read_text())
            require(child.get("issue") == number, "dependency names the wrong issue")
            validate(child, path.parent, now=now, seen=seen | {path})
    else:
        require(not dependencies, "only issue 4 has issue dependencies")
    return {"issue": issue, "status": "complete_for_operator_review", "cases": len(cases),
            "authenticity_attested": False, "executes_requests": False, "closes_issue": False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", nargs="?", type=Path)
    parser.add_argument("--template", type=int, choices=REQUIREMENTS)
    parser.add_argument("--mode", choices=("preflight", "evidence"), default="evidence")
    args = parser.parse_args(argv)
    try:
        require(bool(args.bundle) != (args.template is not None), "choose one evidence file or --template")
        if args.template is not None:
            result = template(args.template)
        else:
            result = validate(strict_json(args.bundle.read_text()), args.bundle.parent, args.mode)
        print(json.dumps(result, indent=2, allow_nan=False))
        return 0
    except (ValueError, OSError, TypeError, KeyError, AttributeError) as error:
        print(f"evidence rejected: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
