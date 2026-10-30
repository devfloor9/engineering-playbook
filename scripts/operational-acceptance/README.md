# Live evidence handoff

Issues [#4](https://github.com/devfloor9/engineering-playbook/issues/4),
[#5](https://github.com/devfloor9/engineering-playbook/issues/5),
[#7](https://github.com/devfloor9/engineering-playbook/issues/7), and
[#80](https://github.com/devfloor9/engineering-playbook/issues/80) require actual
deployment evidence. Their documentation corrections and local fixture checks
already exist. Neither those checks nor this validator establish live acceptance.

`check-evidence.py` reads local files only. It creates no files, contacts no
endpoint, sends no requests, changes no cloud resources, and closes no issues.
It uses Python's standard library. Existing benchmark commands, raw results,
routes, anchors, and verification notices are unchanged.

## Prepare an approved target

1. Select a dedicated target and its private account/profile, Region,
   cluster/namespace, software versions, configuration hashes, and capacity.
2. Obtain operator approval of the test scope, allowed traffic, failure cases,
   rollback owner, billable-resource limits, and cleanup.
3. Register the request fixture, minimum samples, repetitions, observation
   windows, expected outcomes, acceptance gates, and rollback procedure before
   execution. Keep secrets and full infrastructure identities in approved storage.
4. Set a total budget, a lower stop threshold, and a positive cleanup reserve.
   A polling threshold does not guarantee an exact final cloud bill.
5. Export the blank package for the relevant issue to an approved evidence folder.
   The command prints JSON to stdout; every null field must be filled with
   actual evidence. No synthetic completed bundle is provided.

```sh
python3 scripts/operational-acceptance/check-evidence.py --template 80
python3 scripts/operational-acceptance/check-evidence.py --template 5
python3 scripts/operational-acceptance/check-evidence.py --template 7
python3 scripts/operational-acceptance/check-evidence.py --template 4
```

Record private identifiers in the hashed deployment manifest. `target_alias`
is a deidentified display name, not a substitute for that full manifest.
Every package needs a non-placeholder `campaign_id` identifying the approved
acceptance campaign. The umbrella and its #5/#7 packages must share that ID.
Approval and protocol manifests are local, nonempty files accompanied by their
SHA-256 digests. Artifact paths must remain inside the evidence folder, including
after resolving symbolic links. Keep credentials outside this folder.

Run the preflight check with the actual local package path:

```sh
python3 scripts/operational-acceptance/check-evidence.py \
  /approved/evidence/issue-80.json --mode preflight
```

`ready_for_test_review` means that the declared prerequisites and hashed files
are complete. An operator must still verify the target, permission, available
capacity, bounds, and safe execution procedure. This command performs none of
those live checks. All cases must remain `not_run` in preflight.

## Collect actual results

| Issue | Required evidence |
| --- | --- |
| 80 | Deployment/traffic paths, feature probes, repeated HTTP, TLS, scale, recovery, gRPC/SSE, utilization and complete cost |
| 5 | Real trace/label/count/cost reconciliation, preregistered canaries, rollback, 429/503/deadline failures, cache isolation and tool deduplication |
| 7 | Pinned supported stack, readiness/drain timeline, request outcomes, KV behavior, warm/cold distributions and failed-checkpoint handling |
| 4 | Hybrid ADR/identity/state/migration approval, real KFS adapters/quality/authorization/deletion, plus complete #5 and #7 packages |

Each case requires an observed outcome, expected outcome, actual samples and
repetitions at least as large as the registered minimum, and hashed raw evidence.
The template's case identifiers enumerate each issue's remaining checklist.
`unsupported` is allowed only for optional checkpoint/connector capabilities
in #7 and optional gRPC/SSE capabilities in #80. It requires recorded
limitations and raw support evidence, and remains subject to the operator's
accepted scope. Required readiness, drain, HTTP, TLS, recovery and cost cases
cannot be skipped. Required Gateway feature probes cannot be skipped as a group;
record the support/skip reasons for individual Extended/custom features in their
raw report. Unsupported is never evidence that an untested feature works.
Its sample/repetition counts must be null or positive integers. Every limitation
and approver role must contain actual text rather than TODO/TBD placeholders.

Record a completed UTC execution window, complete cost accounting, and dated
operator/domain-owner review backed by an approval file. For #4, `dependencies`
must contain `"5"` and `"7"` artifact references to complete packages. Each
reference also binds the child's `target_alias`, `deployment_manifest_sha256`,
and `protocol_manifest_sha256`. Their hashes, campaign, target/configuration
bindings and case requirements are checked recursively. Child acceptance must
precede or match the umbrella's acceptance date. The systems may intentionally
use different clusters or Regions; those differences remain in their manifests.
A previous issue number or an asserted `closed` status alone is insufficient.

```sh
python3 scripts/operational-acceptance/check-evidence.py \
  /approved/evidence/issue-80.json --mode evidence
```

`complete_for_operator_review` establishes local package completeness and file
integrity only. It does not authenticate approvals, attest truthful measurements,
determine technical correctness, approve publication, or close GitHub issues.
An operator must reconcile evidence to the actual environment and confirm the
demonstrated scope. Retain pending/experimental banners until that acceptance.
Publish only approved, deidentified summaries in both language versions.

## Offline validation

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/operational-acceptance -p test_evidence.py -v
```

Tests use temporary files and fabricated inputs solely to test rejection gates.
They make no cloud or model calls. No test input is a benchmark measurement.
