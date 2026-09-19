# Local fixture validation — 2026-09-19

These records validate the HTTP benchmark kit against a Python echo fixture. **No Kubernetes controller, Gateway API resource, proxy implementation, or AWS service was tested.** Timings in the raw summaries are fixture smoke observations and cannot establish Gateway throughput, latency, or efficiency.

The run used k6 2.2.0 and Python 3.13.15 on an arm64 Docker engine, with an internal network and no published ports. The Docker VM had 10 CPUs and 8,217,317,376 bytes RAM, shared with three existing containers. The fixture limit was 1 CPU/256 MiB; each generator was limited to 1 CPU/512 MiB. Limits are configuration, not measured utilization.

| Check | Observed result |
| --- | --- |
| Echo, controlled status, controlled delay | Three probes passed |
| Three HTTP/1.1 load runs, each 5 arrivals/s for 5 seconds | 26, 26, and 25 requests; no dropped arrivals or response-contract failures |
| Incorrect expected body | 26 body-check failures; k6 exit 99, validator exit 1 |
| Insufficient generator capacity with delayed fixture | Four requests and 37 dropped arrivals; k6 exit 99, validator exit 1 |
| Redirect-option override | Rejected before requests; k6 exit 107 |
| Skipped setup with VU override | Rejected before requests; k6 exit 108 |
| Cleanup | Owned resources removed; three pre-existing containers remained running |

The first two nominal runs are explicitly `boundary-tolerated`: 26 observed versus 25 planned arrivals, or 104% delivery. The third is `exact`. The acceptance policy allows ±1 only for at least 20 planned arrivals and 95–105% delivery. This is a disclosed policy, not proof that the discrepancy was exclusively a timer race. Nothing here produces a ranking.

## Evidence files

- `*.raw.json`: unchanged probe/k6 envelopes, embedded configuration text, configuration and harness hashes, and retained observations or complete legacy summaries.
- `*.stderr.txt`: actual k6 diagnostics for each load run.
- `loads-validated.stdout.txt` and `probe-validated.stdout.txt`: derived validator output; per-run percentiles remain separate.
- `execution-report.json`: derived runner outcomes, exit codes, resources, and cleanup status. Unrelated container IDs were omitted for publication.
- `sut-config.json`: fixture and resource configuration whose checksum is embedded in the runs.
- `*-version.stdout.txt`: actual runtime version output.
- `SHA256.json`: integrity manifest for the evidence files, excluding this explanatory README.

The recorded source revision is the repository baseline before these new scripts were committed. The runtime `harness_sha256` identifies the four files actually executed:

```text
5d15435859798de45f5b803a70ec3620eb3ed52b51b60f769541f52e1a60b161
```

Use `npm run test:gateway-benchmark` from the repository root to revalidate the frozen evidence and regression cases. It does not rerun Docker or contact the original fixture.
