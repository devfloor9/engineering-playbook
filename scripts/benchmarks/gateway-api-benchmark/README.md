# Gateway endpoint benchmark kit

This kit checks explicit endpoint contracts and records bounded HTTP load runs. The supplied runnable cases use a Python echo backend and **must remain `local-fixture` evidence**. They measure neither a Gateway API implementation nor controller conformance. No EKS or live controller measurements are included in the supplied fixture evidence. Upstream conformance report analysis, maintained separately in this folder, is a different evidence class.

| File | Interface |
| --- | --- |
| `fixture.py` | Python stdlib GET backend; backend ID, path, query and lowercase request headers in JSON |
| `probe.py` | `--config FILE --output NEW_FILE`; explicit request/expectation cases; raw observations retained |
| `load.js` | k6 2.2.0; `BENCHMARK_CONFIG` and `BENCHMARK_OUTPUT` environment arguments |
| `results.py` | Raw result filenames; validated per-run JSON summary on stdout; errors on stderr, exit 1 |
| `test_harness.py` | Offline `unittest`; synthetic summaries are test inputs, never benchmark evidence |
| `run-local.py` | Local runner for labeled containers, resource limits and external result directories |
| `cases.fixture.json` | Three echo/failure/delay cases and a 5 requests/s, 5-second load configuration |
| `cases.routes.example.json` | Inactive route contract template; `unmeasured` scope and placeholders prevent execution |

No dependencies are installed. No installer, Kubernetes manifests, cluster operations or cloud provisioner are included. Upstream analysis in `analyze-conformance.cjs` and `results/upstream/` is separate from the runtime scripts.

## Prepare a local run

From the repository root, with the pinned images available in a local arm64 Docker engine:

```sh
python3 scripts/benchmarks/gateway-api-benchmark/run-local.py \
  --output /tmp/gateway-fixture-new-run
```

The output directory must not already exist and must be outside the repository. The runner checks three nominal loads, three probes, and four deliberate failure cases; it retains evidence and removes only resources with its unique label. [Recorded fixture results](results/local-20260919/README.md) describe the published run.

Use an isolated internal Docker network, no host ports, scripts mounted read-only at `/kit`, and a new writable results directory mounted at `/results`. `run-local.py` manages labeled local containers and resource limits. Locked arm64 runtime images:

- k6 2.2.0: `grafana/k6@sha256:9bd01d6941fca969cb61bb57d2da5ee9b385fe2aa8881df3798c196564d6ace6`
- Python 3.13.15: `python@sha256:9d2e5553305c7c7b0097999bb17187c69b921ccd6bc9d40e4bb5ebe652c00285`

Record the actual image/version output and complete SUT configuration separately. `sut_config_sha256` is a checksum of that configuration, not an invented configuration name. Include proxy configuration too if a proxy is present. A source revision plus the emitted digest of `fixture.py`, `probe.py`, `load.js` and `results.py` records both the repository baseline and the runtime scripts actually read.

From the repository root, prepare a **new external** run directory; adjust the environment description if the actual environment differs:

```sh
export KIT="$PWD/scripts/benchmarks/gateway-api-benchmark"
export RUN_DIR="$(mktemp -d /tmp/gateway-benchmark.XXXXXX)"
export SOURCE_REVISION="$(git rev-parse HEAD)"

cat > "$RUN_DIR/sut-config.txt" <<'EOF'
backend image: python@sha256:9d2e5553305c7c7b0097999bb17187c69b921ccd6bc9d40e4bb5ebe652c00285
backend command: python3 /kit/fixture.py --bind 0.0.0.0 --port 8080 --backend-id fixture-a
backend limits: 1 CPU, 256 MiB
network: isolated internal Docker network; hostname fixture; no published ports
proxy/controller: none
EOF

python3 - <<'PY'
import hashlib, json, os
from pathlib import Path
kit, run = Path(os.environ["KIT"]), Path(os.environ["RUN_DIR"])
config = json.loads((kit / "cases.fixture.json").read_text())
config["provenance"].update(
    run_id=run.name + "-load-1",
    implementation_version="Python 3.13.15",
    source_revision=os.environ["SOURCE_REVISION"],
    sut_config_sha256=hashlib.sha256((run / "sut-config.txt").read_bytes()).hexdigest(),
)
with (run / "run.json").open("x") as out:
    json.dump(config, out, indent=2)
config["provenance"]["run_id"] = run.name + "-probe-1"
config["provenance"]["generator_version"] = "Python 3.13.15 http.client"
with (run / "probe-run.json").open("x") as out:
    json.dump(config, out, indent=2)
PY
```

The template records Docker Desktop arm64 with 8,217,317,376 bytes RAM (approximately 7.653 GiB), shared with three existing containers, backend 1 CPU/256 MiB and generator 1 CPU/512 MiB. Replace these values with the actual environment for another run. This is declared context, not measured resource utilization or isolation. Archive the runner configuration with results. The kit cannot independently attest that declarations or container limits are truthful.

Probe configuration must declare the actual `Python X.Y.Z http.client` generator, including the patch version; the pinned image uses `Python 3.13.15 http.client`. Load configuration retains `k6 v2.2.0`. A probe refuses a different declared version before any request. Validation requires raw/configured versions to match and retains `actual_generator` in every validated run. Do not copy the load generator attribution unchanged into a probe run.

## Commands inside the prepared containers

Run the backend in its own container with network alias `fixture`:

```sh
python3 /kit/fixture.py --bind 0.0.0.0 --port 8080 --backend-id fixture-a
```

Run probes from a Python container on that same internal network:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 /kit/probe.py \
  --config /results/probe-run.json --output /results/probe.json
PYTHONDONTWRITEBYTECODE=1 python3 /kit/results.py /results/probe.json
```

From the k6 container, use a fresh output filename. Keep the exit code: a raw file can be written even when thresholds fail.

```sh
k6 run --new-machine-readable-summary=false --summary-mode=full \
  -e BENCHMARK_CONFIG=/results/run.json \
  -e BENCHMARK_OUTPUT=/results/k6.json \
  /kit/load.js
```

Alternative with an optional per-point JSON stream (run only one variant per run ID):

```sh
k6 run --new-machine-readable-summary=false --summary-mode=full \
  --out json=/results/points.json \
  -e BENCHMARK_CONFIG=/results/run.json \
  -e BENCHMARK_OUTPUT=/results/k6-with-points.json \
  /kit/load.js
```

Validate in the Python container; summary output also belongs in the writable results mount:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 /kit/results.py /results/k6.json \
  > /results/validated-summary.json
```

`handleSummary` stores the complete **legacy k6 2.2** summary inside a provenance envelope. Explicit `--new-machine-readable-summary=false` selects the `metrics/options/state/setup_data` shape. `--summary-mode=full` keeps summary generation enabled; do not use `disabled`. The validator intentionally rejects another format. No remote JavaScript imports are used. Optional JSON points can be large; they are separate raw evidence and are not consumed by this validator.

## Contracts and bounds

- Backend controls: `X-Fixture-Status` chooses 200–599 except bodyless 204/205/304; `X-Fixture-Delay-Ms` chooses 0–2000 ms. Invalid or duplicate controls return 400. Defaults can also be set with `--status` and `--delay-ms`. Delay is a requested minimum, not a latency guarantee. Responses have no clock-dependent Date header or random ID.
- Each probe declares `name`, `feature`, `polarity`, `request`, and `expected`. Expected fields support exact status/protocol, a body substring, recursive JSON subset, absent JSON key paths, response-header values and absent response headers. Request headers can set `Host`. This changes HTTP routing input, **not TLS SNI**. HTTPS still verifies the target hostname's certificate.
- The route template covers positive/negative exact paths, hostnames and header values; a missing header; `/prefix`, `/prefix/child`, and the negative boundary `/prefix-other`; a prefix rewrite retaining query; request/response header mutation; and an 80:20 backend contract. It assumes a dedicated listener with no catch-all route and an explicitly configured 404 for unmatched requests. Adapt these expectations to the actual deployment before use. It configures nothing and is not an upstream conformance suite.
- Probes use one new HTTP/1.1 connection per sample, no redirect following or retries, a 1 MiB response cap and a configured timeout. An early EOF with unsatisfied Content-Length or incomplete chunk framing fails, even if the body prefix is valid JSON. Local cases have at most 500 requests total and at least 50 ms between completed requests. This client does not negotiate HTTP/2; an HTTP/2 probe expectation is rejected.
- Weighted cases report Bonferroni-adjusted Wilson intervals at the requested family confidence. Small samples or fewer than five expected observations in a nontrivial marginal are **inconclusive**, not a weight failure. Default minimum is 100; the template uses 200 requests. An unexpected or zero-weight backend always fails. A pass means compatibility with the configured fractions under independent selections, not proof of the scheduler; affinity or correlated selections undermine that assumption.
- Probe exit codes: 0 = all cases pass, 1 = failure/invalid input, 2 = inconclusive. `results.py` refuses to label an inconclusive probe set valid. It recomputes assertions and intervals from the retained observations.
- Local k6 caps: 20 arrivals/s, 30 seconds, four VUs, 2000 ms timeout and five seconds graceful stop. Defaults are 5/s for five seconds with two VUs. Rate is **per second**, not concurrency. The runtime is single process, one constant-arrival-rate scenario, one GET per iteration, connection reuse enabled, redirects zero, TLS verification on and response bodies retained.
- k6 checks exact expected status, nonempty expected body substring, membership in the expected backend ID set, and exact observed `Response.proto`. All response-contract checks and HTTP error rates must be perfect; dropped arrivals must be zero. HTTPS can negotiate HTTP/2; a mismatch fails. This kit does not force HTTP/1.1 on an HTTPS server or support h2c. Separate protocol runs cannot be combined.
- Setup rejects effective scenario/rate/VU/duration/redirect/TLS/threshold overrides. Every iteration requires setup's validated configuration digest before recording samples or sending traffic, and each VU independently checks effective options on its first iteration. `--no-setup` aborts with zero requests, including when combined with a VU shortcut. Increasing local caps requires changing the kit, not a hidden CLI override. No `sleep` is placed inside arrival-rate iterations.

## Interpreting and validating results

The validator rejects missing provenance or validated setup data, missing response checks, no requests, unfinished iterations, dropped arrivals, inconsistent rates/units/timestamps/duration, bad percentiles, failed thresholds, unknown summary formats and mismatched configuration digests. Exact arrival delivery is classified `exact`. A ±1 difference is accepted only with **at least 20 planned arrivals and 95–105% delivery**, and is explicitly classified `boundary-tolerated` with its delivery fraction and count difference. This is an acceptance policy, not proof that a timer race caused the difference or that the exact workload completed. Smaller workloads require exact counts. A nonzero `dropped_iterations` value always fails.

The validator checks first/last request starts against the scheduled window and checks completion ranges/mean against start ranges/mean and request latency, allowing at most 2 ms for timestamp resolution. These are necessary aggregate consistency checks, not per-request pairing or clock synchronization evidence. k6 can omit a never-emitted dropped metric; its effective zero-drop threshold is still required.

Repeated runs may be summarized together only when scope, implementation/version, target, environment, SUT configuration, generator, harness revision/digest and workload/protocol configuration agree. Run IDs must be distinct. Probe and load evidence cannot be merged into one population. Different implementations intentionally need separate summaries.

Per-run `http_req_duration` min/median/p90/p95/p99/max/mean/count are retained in milliseconds. Percentiles are never averaged. `http_req_duration` excludes initial DNS and connection setup; achieved request rate uses actual elapsed seconds including graceful completion, not just scheduled duration. Five-second fixture percentiles are smoke-test observations, not a defensible performance comparison. The kit emits `ranking: null` for every scope.

The runtime scripts do not sample CPU utilization, RSS, network counters, controller status, route acceptance, software build attestations or infrastructure costs. A real implementation experiment needs separately reviewed configuration, resource/utilization evidence, warm-up/repetition methodology and operator authorization. Keep upstream conformance reports separate from endpoint probes and performance observations.

## Offline tests

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/benchmarks/gateway-api-benchmark -p test_harness.py -v
```

This uses a short-lived loopback HTTP server, in-memory HTTP responses and synthetic summaries; no Docker or cloud is contacted. Tests include truncated bodies, actual generator attribution, impossible start/finish ranges and small-workload underdelivery. If Node is already available, an additional test executes `load.js` with mocked k6 imports to check exported-option rewrites and the pre-traffic setup gate. Without Node that one test is skipped; actual k6 integration remains a separate runner check.

## Pinned upstream evidence

`results/upstream/sources.json` records exact report URLs, snapshot commit, source hashes, API cohort, and release provenance. The neighboring YAML files are unchanged upstream reports. `analysis.json` is derived output, not a locally executed conformance result. Missing declarations remain unknown, partial results retain skipped tests, and all performance fields remain null.

```sh
node scripts/benchmarks/gateway-api-benchmark/analyze-conformance.cjs --check
npm run test:gateway-benchmark
```

The npm command checks source attribution/cohort integrity, Python/JavaScript regressions, and the retained local evidence. It uses the repository's existing Node dependencies and Python standard library. Regenerate `analysis.json` by omitting `--check` only after reviewing any source-manifest change.

## Primary interface references

- [k6 2.2 runtime flags](https://github.com/grafana/k6/blob/v2.2.0/internal/cmd/runtime_options.go): explicit legacy machine-readable compatibility flag.
- [k6 2.2 legacy summary serialization](https://github.com/grafana/k6/blob/v2.2.0/internal/js/summary.go): raw metrics, rate counts, millisecond elapsed time and `setup_data`.
- [k6 2.2 execution options](https://github.com/grafana/k6/blob/v2.2.0/internal/js/modules/k6/execution/execution.go): consolidated options used by the setup guard.
- [k6 constant-arrival-rate](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-arrival-rate/), [custom summary](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/), and [Response](https://grafana.com/docs/k6/latest/javascript-api/k6-http/response/).
- [Gateway API v1.4.0 HTTPRoute type definitions](https://github.com/kubernetes-sigs/gateway-api/blob/v1.4.0/apis/v1/httproute_types.go): path-segment prefix semantics and prefix rewrite rules used to construct the optional endpoint contract. This reference does not establish a tested controller's support or conformance.
