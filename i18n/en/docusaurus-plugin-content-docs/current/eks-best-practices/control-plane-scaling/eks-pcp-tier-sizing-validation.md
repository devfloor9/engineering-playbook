---
title: EKS PCP Tier Sizing & Performance Validation Guide
description: Detailed parameters by PCP tier, APF seat calculation formulas, large-scale cluster sizing examples, ClusterLoader2 performance validation methodology, customer case studies
created: "2026-04-07"
last_update:
  date: "2026-06-26"
  author: devfloor9
reading_time: 47
tags:
  - eks
  - pcp
  - sizing
  - performance
  - apf
  - clusterloader2
  - etcd
sidebar_label: PCP Tier Sizing
sidebar_position: 2
---

> **Purpose**: Select PCP candidates from versioned public capacity values, then validate them with workload measurements. This guide separates documented configuration, planning assumptions, illustrative arithmetic, and reported benchmarks.

:::tip Related Documentation
For architecture and CRD design context, see [EKS Control Plane & CRD at Scale](./eks-control-plane-crd-scaling).
:::

## In this post {#in-this-post}

1. Versioned tier specifications and a reproducible sizing method.
2. Public benchmark evidence and its applicability limits.
3. Measurement, throttling diagnosis, and controlled validation.

**Evidence review date: 2026-09-18.** The tier reference is the [EKS Provisioned Control Plane user guide][pcp], as reviewed on that date. AWS updates this page; recheck the version-specific table before an operational decision. Calculations below are examples, not measurements of an EKS cluster.

## 1. PCP specifications and sizing evidence {#1-pcp-tier-specifications-and-practical-object-limits}

<a id="kubernetes-upstream-and-eks-official-test-limits"></a>
<a id="confirmed-customer-cases"></a>
<a id="important-notes-on-cluster-scale"></a>
<a id="key-bottlenecks-in-single-cluster-scaling"></a>

### 1.1 What cluster scale can establish {#11-large-scale-single-cluster-benchmarks}

Node and Pod counts describe a workload; they do not determine its API request mix, seat occupancy, database usage, or recovery performance. The public AWS benchmark in section 2.2 supplies a specific workload reference, not a node-count-to-tier rule.

No customer evidence is used here. A benchmark claim requires a public source and enough workload, configuration, and measurement context to judge its relevance. A hypothetical 10,000-node / 1,000,000-Pod example does not establish that this workload is supported or validated. Kubernetes scalability SLOs also have [configuration, extensibility, and load prerequisites][slos]; they are not unconditional guarantees for every distribution or workload.

### 1.2 Versioned public tier specifications {#12-official-tier-specifications}

The following values come from the **2026-09-18 review of the AWS user guide**, including its distinction between EKS v1.30–v1.33 and v1.34 and later. The guide defines tier attributes as underlying configuration; achieved throughput depends on workload behavior. In particular, its scheduling attribute does not guarantee Pod readiness at that rate. [Source: tier specifications and capacity versus performance][pcp].

| Tier | API seats: EKS v1.30–v1.33 | API seats: EKS v1.34+ | Scheduling attribute (pods/s) | Database size (GB, AWS notation) |
|---|---:|---:|---:|---:|
| XL | 1,700 | 2,000 | 167 | 16 |
| 2XL | 3,400 | 4,000 | 283 | 16 |
| 4XL | 6,800 | 8,000 | 400 | 16 |
| 8XL | 13,600 | 16,000 | 400 | 16 |

Standard mode automatically scales and has an 8 GB database limit. This specification does **not** give Standard a fixed seat or scheduling threshold. Provisioned mode remains on the selected tier; it does not automatically move between tiers. Do not extrapolate this table to unlisted version bands. The AWS guide also documents `DescribeClusterVersions` as a way to retrieve version-specific tier attributes. [Source][pcp].

### 1.3 Published configuration versus inferred internals {#13-detailed-control-plane-parameters-by-tier}

Use the tier attributes above without reverse-engineering an API server count or per-server flags. This guide does not assign undocumented `max-requests-inflight`, controller QPS, compaction intervals, or event-storage topology to tiers.

When APF is enabled, upstream Kubernetes combines the two inflight limits into a concurrency budget per API server and divides it among priority levels. It can adjust each level's effective limit through configured lending and borrowing. The published tier capacity and one API server's APF limit are different observation scopes. [Source: APF priority levels][apf].

<a id="api-request-concurrency-seats"></a>
<a id="why-1700-seats-isnt-as-small-as-it-sounds"></a>
<a id="pod-scheduling-rate-podssec"></a>
<a id="cluster-db-size-etcd"></a>

### 1.4 Units and measurement scope {#14-what-each-metric-actually-means}

| Quantity | Meaning | Sizing consequence |
|---|---|---|
| Seats | Weighted API execution concurrency; a request may occupy multiple seats | Request count or requests/s alone is insufficient |
| Seat-seconds | Seats multiplied by their occupancy duration | A rate multiplied by mean seat-seconds estimates average occupancy, not a burst peak |
| Scheduling pods/s | Successful scheduling throughput, distinct from attempts and application readiness | Measure successful outcomes and end-to-end recovery separately |
| Database bytes | Distinguish allocated storage from in-use data | Use the documented quota-related metric and a quota in matching units |

APF weights large LIST operations and accounts for watch initialization and write-triggered watch work. Do not assume that every LIST uses 10 seats or that every write has a fixed extra cost; inspect the applicable version and measure the request mix. [Source][apf].

The current AWS [CloudWatch metric definitions][cw] distinguish allocated `etcd_mvcc_db_total_size_in_bytes` (also known as `apiserver_storage_size_bytes`) from quota-related `etcd_mvcc_db_total_size_in_use_in_bytes`. JSON payload length is not either database metric. All payload arithmetic below uses decimal units: 1 kB = 1,000 bytes, 1 GB = 1,000,000,000 bytes. For operational comparisons, retain bytes and verify the actual quota representation; do not silently substitute GiB (1,073,741,824 bytes) for GB.

<a id="terminology-two-different-layers"></a>
<a id="core-difference-concurrent-request-count-vs-concurrent-seat-count"></a>
<a id="concrete-scenario-example-4xl-cluster"></a>
<a id="apf-prioritylevel-distribution-example-4xl-basis"></a>

### 1.5 Diagnose APF saturation at the affected priority level {#15-api-request-concurrency-vs-inflight-seats--concept-deep-dive-with-examples}

APF classifies a request with a FlowSchema and enforces the selected priority level's limit on the serving API server. A level configured to reject excess requests can return 429 immediately; a queuing level can reject because its queue is full or its waiting deadline expires. Spare seats elsewhere do not by themselves establish that this request can borrow them. [Source][apf].

**Illustration, not an EKS default:** suppose one server has a budget of 1,000 seats. Level A has a current limit of 100, uses 100, rejects excess requests, and cannot borrow more under this example's configuration. Other levels have 900 seats available and use 100. Overall use is `(100 + 100) / 1,000 = 20%`, yet the next request in A can receive 429. Increasing the PCP tier is not the conclusion of this observation alone.

For a 429 incident, correlate the response time and API origin with resource/subresource, verb, client, FlowSchema, priority level, rejection reason, queue wait, and request latency. A client-side rate limiter can delay a request before it reaches the server; that delay is not itself a server HTTP 429. A nonzero cumulative rejection counter can reflect an old event; inspect its increase over the incident window. [Source: APF metrics and debugging][apf].

### 1.6 Worked example: a hypothetical 10,000-node workload {#16-large-scale-cluster-scenario-10000-nodes--100-pods-environment-pcp-sizing}

#### Assumptions {#assumptions}

Assume 10,000 nodes with 100 Pods each, giving `10,000 × 100 = 1,000,000 Pods`. This is arithmetic input only. The payload sizes, request timings, affected Pod count, and time budgets below are invented for the example. No live or customer measurement is represented.

#### Step 1: Keep payload bookkeeping separate from database sizing {#step-1-etcd-db-size-estimation}

| Assumed payload group | Count | Assumed bytes each | Payload subtotal (bytes) |
|---|---:|---:|---:|
| Pods | 1,000,000 | 1,500 | 1,500,000,000 |
| Custom resources (CRs) | 1,000,000 | 1,000 | 1,000,000,000 |
| Nodes | 10,000 | 5,000 | 50,000,000 |
| Other payloads, assumed aggregate | 1 | 150,000,000 | 150,000,000 |
| Total | | | 2,700,000,000 |

The payload sum is **2.7 decimal GB**, not a forecast of etcd usage. It omits storage encoding, keys, retained versions, and storage allocation effects. etcd retains versions until compaction; this does not justify a universal 1.5×–5× multiplier, a fixed EKS compaction period, or a 0.1 kB “changed fields only” revision size. [Source: etcd data model][etcd-model].

Replace that extrapolation with a measurement: load representative objects in an approved test environment, record in-use and allocated database bytes before/after loading, replay the update/delete pattern, and capture peak usage and recovery over repeated cycles. Until those measurements exist, **database suitability remains unknown**.

#### Step 2: Estimate average seat occupancy, then measure peaks {#step-2-api-concurrency-seats-requirement-estimation}

For request class `i`, define `w_i` as the mean integral of occupied seats over execution time, in seat-seconds/request. The planning model is `mean seats = Σ(requests/s_i × w_i)`. Queue waiting is not execution-seat occupancy; end-to-end latency is therefore not a direct substitute for `w_i`.

| Assumed request class | Requests/s | Seats during execution | Execution seconds/request | Mean seats |
|---|---:|---:|---:|---:|
| Simple requests | 1,000 | 1 | 0.05 | 50 |
| LIST requests | 2 | 5 | 0.20 | 2 |
| Total | | | | 52 |

For example, `2 × (5 × 0.20) = 2 seats`. These fixed weights and durations are assumptions, not typical EKS timings or a Kubernetes LIST estimator formula. The result **52 is a mean**, not a peak or a tier recommendation. Use sampled execution seats, queue demand, rejections, and latency during representative bursts. When requests are already being throttled, observed executing seats alone understate offered demand.

#### Step 3: Budget scheduling time explicitly {#step-3-scheduling-throughput-requirement-estimation}

Assume exactly **3,333 affected nodes × 100 Pods = 333,300 Pods** need placement. This is approximately one third of the example cluster, not an exact division of 10,000 nodes. Use `required rate = affected Pods / scheduling budget in seconds`.

| Assumed recovery objective | Time reserved for other work | Scheduling budget (s) | Required rate (pods/s) | Scheduling-only candidate at 100% of attribute | Scheduling-only candidate at 80% |
|---|---:|---:|---:|---|---|
| 15 min | 0 s | 900 | 370.333… | 4XL or 8XL | None in table |
| 30 min | 0 s | 1,800 | 185.166… | 2XL, 4XL or 8XL | 2XL, 4XL or 8XL |
| 15 min | 180 s | 720 | 462.916… | None in table | None in table |

The zero-reserve rows are deliberately optimistic. Failure detection, eviction/replacement, node provisioning, networking, volumes, image pulls, and readiness consume end-to-end recovery time. Scheduling capacity does not guarantee a recovery deadline. At the example 80% target, 4XL and 8XL both have `400 × 0.8 = 320 pods/s`; scheduling 333,300 Pods would take `333,300 / 320 = 1,041.5625 s`, about **17.36 minutes**, before any additional recovery stages.

#### Step 4: Record the unresolved dimensions {#step-4-comprehensive-pcp-tier-sizing-result}

The 30-minute scheduling-only case can enter testing at 2XL or higher. The 15-minute case has no listed candidate under the example 80% policy. Neither conclusion selects a production tier: peak seat demand, per-priority-level behavior, database use, schedulability, and application recovery remain unmeasured. A higher tier cannot improve the published scheduling attribute beyond 400 pods/s within this table.

<a id="theoretical-maximum-based-on-etcd-db-size-pcp-16gb-basis"></a>
<a id="actual-benchmarks-and-customer-cases"></a>
<a id="recommended-workload-scale-guide-by-tier"></a>
<a id="specific-impact-of-crds-on-control-plane"></a>

### 1.7 Measure object growth instead of declaring an object limit {#17-production-environment-practical-object-quantities}

A CRD defines a resource type; its custom resource instances (CRs) occupy separate objects. Inventory both, along with built-in resources, controllers, admission webhooks, object-size distributions, update rates, LIST scope/frequency, and watch consumers. Use this inventory to reproduce the workload and explain measured database and API behavior. [Source: control plane scaling guidance][scale].

Dividing 16 GB by a supposed average object size does not produce a supported object count. Record actual database growth, API latency, and controller backlog as the population and churn increase. Do not translate the public benchmark's resource counts into a practical ceiling for a different CRD workload.

<a id="pcp-tier-sizing-formula-summary"></a>

### 1.8 One candidate-selection model and consistent boundaries {#18-tier-selection-decision-tree}

**Planning policy, not an AWS requirement:** choose a utilization target `u = 0.8`, leaving 20% of each published attribute unused. A candidate must satisfy **all** of:

```text
peak execution seats <= u × version-specific tier seats
required scheduling pods/s <= u × tier scheduling attribute
peak in-use database bytes / applicable quota bytes <= u
```

This is a screening model. It assumes representative measurements, complete collection, and offered demand not hidden by throttling. Passing it still requires the workload validation in section 3. A different headroom policy changes the candidate set; record the policy before calculating.

| Tier | Seat budget: v1.30–v1.33 at 80% | Seat budget: v1.34+ at 80% | Scheduling budget at 80% (pods/s) |
|---|---:|---:|---:|
| XL | 1,360 | 1,600 | 133.6 |
| 2XL | 2,720 | 3,200 | 226.4 |
| 4XL | 5,440 | 6,400 | 320 |
| 8XL | 10,880 | 12,800 | 320 |

All four tiers share the 16 GB database attribute; moving from XL to 8XL does not enlarge it. The model's database fraction is at most 0.8 for every candidate. Arithmetic `16 × 0.8 = 12.8` retains the specification's GB notation, but operator checks must compare measured bytes against the applicable quota bytes. Standard is assessed separately by measurement; no fixed Standard throughput is invented.

For an independent **scheduling-only boundary check with `u = 1`**, the smallest listed candidate is:

| Required rate R (pods/s) | Smallest listed candidate |
|---|---|
| 0 ≤ R ≤ 167 | XL |
| 167 < R ≤ 283 | 2XL |
| 283 < R ≤ 400 | 4XL |
| R > 400 | None in table |

At exactly 167, 283, and 400, the table returns XL, 2XL, and 4XL respectively. At 80%, those boundaries become 133.6, 226.4, and 320. Apply the seat and database checks as well; equality is allowed by this mathematical policy, not evidence that operating at a service limit is advisable. 8XL can be selected for its additional seats, not for a larger scheduling or database attribute.

<a id="method-1-cloudwatch-vended-metrics-free-simplest"></a>
<a id="method-2-prometheus-direct-scraping-detailed-analysis"></a>
<a id="method-3-kubectl-one-liner--check-right-now"></a>
<a id="measurement-result-interpretation-guide"></a>
<a id="customer-measurement-request-template"></a>

### 1.9 Collect evidence before applying the model {#19-apf-seat-actual-usage-monitoring-guide--determine-tier-by-measurement-not-claims}

Collect baseline, deployment peaks, update churn, and recovery-test windows with the same metric definitions. A week including a business peak is one possible observation plan, not a sufficiency guarantee; rare incidents require separate representative tests. Section 3.6 gives the collection paths and statistics.

CloudWatch publishes these basic EKS metrics at one-minute frequency. For execution seats use the documented **Sum** statistic for each one-minute period, then examine the maximum of those period values over the observation window. Do not sum seats across time. One-minute samples can miss short bursts. [Source][cw].

For Prometheus, establish that each API server is represented exactly once before aggregating. Preserve the instance, priority level, and FlowSchema dimensions during diagnosis. A single `kubectl get --raw /metrics` response describes the responding API server; it does not prove a cluster-wide total or peak. Missing metrics, duplicate scrapes, target churn, or a saturated source cluster make a tier decision inconclusive. [Sources: raw metrics][raw], [APF metrics][apf].

## 2. Public capability and benchmark evidence {#2-eks-control-plane-architecture-improvements}

### 2.1 What Provisioned mode changes {#21-overview}

Standard mode scales control plane capacity automatically. Provisioned mode preallocates a selected tier and remains pinned to it until changed. The sizing benefit is capacity available ahead of demand; it is not an unconditional request-latency or Pod-recovery guarantee. [Source][pcp].

### 2.2 A public benchmark with context {#22-performance-improvement-benefits-for-customers}

The [AWS launch post, published 2025-11-27][launch], reports the following **test scenario**:

| Resource | Standard test | 4XL test |
|---|---:|---:|
| Nodes | 5,000 | 40,000 |
| Pods | 80,000 | 640,000 |
| Deployments | 500 | 40,000 |
| Jobs | 500 | 40,000 |

AWS used ClusterLoader2, multiple subnets/CIDRs, Karpenter static node pools across Availability Zones, VPC CNI prefix delegation and warm prefixes, ECR images, and SOCI-optimized containerd. Workloads included stateless services, jobs, and DaemonSets, with sustained and burst phases. The post explicitly treats results as workload-dependent indicators. [Source][launch].

This is AWS-reported evidence, not a test reproduced for this guide. The resource rows are not an exhaustive count of stored Kubernetes objects. The post does not provide a complete pinned reproduction bundle or raw time series here; do not infer universal P99 latency, a sustained 350 pods/s result, or million-Pod support from its plots. Its launch-era tier table also does not replace the newer version-specific user guide.

### 2.3 Capability and availability boundaries {#23-features-available-only-on-xl-tiers}

The user guide documents an 8 GB database for Standard and 16 GB for each listed PCP tier, plus different availability SLA terms. An endpoint availability SLA is separate from API latency, object capacity, and recovery objectives. Refer to the [EKS SLA][sla] for the commitment and conditions, and the [pricing page][pricing] for charges instead of deriving prices from metrics. [Source][pcp].

Do not infer that API server horizontal scaling is exclusive to PCP, or publish an event-sharding guarantee or tier-specific server topology without a public specification. Returning to Standard requires database size **below 8 GB** according to the user guide; include that restriction in any later rollback plan. [Source][pcp].

## 3. Workload performance validation {#3-eks-control-plane-performance-validation-methodology}

<a id="installation-and-build"></a>
<a id="execution-method"></a>
<a id="key-override-parameters"></a>

### 3.1 ClusterLoader2 and reproducibility {#31-testing-tool-clusterloader2-cl2}

[ClusterLoader2 (CL2)][cl2] is Kubernetes' YAML-driven scalability test framework and was used in the public AWS benchmark. Its README describes measurements, overrides, and required flags. Choose a revision compatible with the test cluster and record the exact Git SHA, build environment, configuration, overrides, images, and collection setup. The linked README is pinned for reference; it is not a claim that this revision was built or tested against current EKS.

Use a test configuration that models the target resource mix and churn. A generic load test does not establish CRD or recovery behavior. Check the selected revision's provider options rather than assuming `--provider=eks` is supported. Verify that required measurements actually execute: CL2 documents that API responsiveness measurements can be skipped when Prometheus is unavailable. [Source][cl2].

### 3.2 Test scenarios {#32-test-scenario-types}

| Scenario | Input to control | Evidence to record |
|---|---|---|
| Baseline | Steady object inventory and request mix | Seats, database bytes, latency, successful scheduling |
| Deployment burst | Finite Pod count and arrival rate | Offered/completed operations, queue wait, rejections |
| CR churn | Object sizes, updates/deletes per second, duration | In-use/allocated database peaks, LIST latency |
| Controller reconnect | Number of reconnecting watch clients | Relist volume, seat demand, controller recovery |
| Recovery | Affected Pod count, ready spare capacity, stage budgets | Scheduling and application-ready completion times |

These are proposed tests, not measured outcomes.

### 3.3 Five validation phases {#33-5-phase-load-testing-strategy}

1. **Baseline:** verify metric coverage and record the initial inventory and latency.
2. **Ramp:** increase bounded offered load; record actual completion rate and the onset of queueing, rejections, or SLO violations.
3. **Sustained peak:** hold the planned demand long enough to include the relevant churn and storage cycles. A 30-minute window is an example, not a universal requirement.
4. **Burst:** exercise the defined deployment/reconnect pattern and measure how long queues and application recovery take.
5. **Recovery:** stop generated load, remove only test-owned resources, and verify database, backlog, and latency return to the expected range.

Repeat identical scenarios when comparing candidate tiers. A single successful run does not characterize variation or failure recovery.

### 3.4 Requirements for a bounded test harness {#34-simple-script-based-testing-without-cl2}

If CL2 is not used, the harness still needs a finite operation count, explicit rate and concurrency bounds, duration, timeout, bounded retries, and completion/error accounting. Avoid unbounded LIST loops or thousands of background `kubectl` processes: they confound client load with control plane capacity. AWS also recommends avoiding repeated inefficient kubectl calls. [Source][scale].

Before an operator runs a test, record the AWS account/profile/region, cluster/context, dedicated namespace, resource ownership, maximum worker capacity, budget, stop conditions, and cleanup/recovery steps. Stop on predefined application or control plane SLO breaches. Restore the previous tier only after its capacity and the Standard database exit restriction have been checked. This guide's review executes no live tests or tier changes.

### 3.5 Distinguish upstream SLOs from test acceptance criteria {#35-official-kubernetes-slislo-standards-validation-success-criteria}

The [pinned Kubernetes SLO framework][slos] includes the following objectives under its configuration and workload prerequisites:

| Upstream scope | Objective |
|---|---|
| Single-object mutating calls and resource-scoped non-streaming reads | P99 ≤ 1 s |
| Namespace/cluster-scoped non-streaming reads | P99 ≤ 30 s |
| Startup of schedulable stateless Pods, excluding image pull and init-container time | P99 ≤ 5 s |

The API objectives exclude virtual/aggregated resources and CRDs as stated by that framework. Its SLI windows and per-cluster-day evaluation also matter; one five-minute P99 is not the entire SLO evaluation. The Pod startup objective is **not** a blanket scheduler P99 ≤ 5 s guarantee. Define separate acceptance criteria for CRs, admission webhooks, error rate, scheduling throughput, and application-ready recovery, including allowed error budgets, observation windows, and repeated runs.

<a id="cloudwatch-vended-metrics-free-automatic"></a>
<a id="prometheus-scraping-endpoints-k8s-128"></a>

### 3.6 Collection paths and valid statistics {#36-key-monitoring-metrics--availability-by-collection-path}

[CloudWatch basic EKS metrics][cw] are published in `AWS/EKS` for Kubernetes v1.28+ at one-minute frequency. The table uses the documented statistics. Additional collection, storage, logs, and alarms have their own configuration and cost considerations.

| CloudWatch metric | Statistic | Interpretation |
|---|---|---|
| `apiserver_flowcontrol_current_executing_seats` | Sum | Execution seats for the period; inspect peaks of period values |
| `apiserver_request_total_429` | Sum | Server 429 count during the period; not a root cause |
| `apiserver_request_total_5XX` | Sum | Server 5xx count; case-sensitive metric name |
| `scheduler_schedule_attempts_SCHEDULED` | Sum | Successful scheduling attempts; divide a one-minute count by 60 for pods/s |
| `scheduler_schedule_attempts_UNSCHEDULABLE` | Sum | Attempts blocked by placement constraints; not a PCP upgrade trigger |
| `apiserver_request_duration_seconds_LIST_P99` | Average | Already-computed LIST P99; do not take another percentile of it |
| `etcd_mvcc_db_total_size_in_use_in_bytes` | Maximum | In-use database size used for the EKS quota assessment |
| `etcd_mvcc_db_total_size_in_bytes` | Maximum | Allocated size; do not sum replicated database copies |

[AWS documents these raw endpoints][raw]:

```bash
# Read-only snapshots; use the intended kubeconfig context.
kubectl get --raw /metrics
kubectl get --raw /apis/metrics.eks.amazonaws.com/v1/ksh/container/metrics
kubectl get --raw /apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics
```

These commands are examples and were not executed for this review. Verify authorization and actual metric availability. The PCP guide describes a rollout of the in-use etcd metric for Prometheus; check what your cluster exposes. `apiserver_storage_size_bytes` reports allocated size and must not silently substitute for in-use bytes in the quota calculation. Do not assume an undocumented raw etcd endpoint exists. [Sources][pcp] [cw].

### 3.7 Evidence checklist {#37-load-testing-checklist-10-items}

Before recording a tier as validated, retain:

1. Kubernetes/platform version, tier, region, and test timestamp.
2. Tool SHA, configs, overrides, image digests, and test duration.
3. Object inventory, size distribution, request mix, and offered load.
4. Metric names, units, labels, statistics, and collection intervals.
5. API-server coverage, duplicate-series checks, and missing-data windows.
6. Per-instance/per-priority-level execution seats, current limits, queue wait, and rejection reasons.
7. API latency and server error counts by operation/resource.
8. In-use and allocated database bytes through growth/churn/recovery.
9. Successful scheduling, unschedulable reasons, and application-ready timing.
10. Acceptance criteria, repeated-run results, stop events, and cleanup outcome.

Keep credentials, raw customer logs, identifiers, and private workload data out of public evidence. Publish only approved, sanitized results with the limitations needed to interpret them.

### 3.8 PromQL for the diagnostic questions {#38-useful-promql-queries}

These examples assume a **single cluster**, an `apiserver` job that scrapes each server once, and a `ksh` job that collects scheduler metrics without duplication. Adapt selectors and retain a cluster label when querying multiple clusters. Missing series mean unknown coverage, not zero use. APF names/labels were checked against [Kubernetes v1.34.0 metric definitions][apf-metrics]; `current_limit_seats` is alpha in that version and may be unavailable.

```promql
# Occupancy/current limit by API server and non-exempt priority level.
sum by (instance, priority_level) (
  apiserver_flowcontrol_current_executing_seats{job="apiserver",priority_level!="exempt"}
)
/
sum by (instance, priority_level) (
  apiserver_flowcontrol_current_limit_seats{job="apiserver",priority_level!="exempt"}
)
```

Use the current limit when exposed because lending/borrowing can change it. If only `apiserver_flowcontrol_nominal_limit_seats` exists, compare with that metric but label the result **nominal utilization**; exceeding 100% can reflect borrowing. Inspect zero limits separately rather than interpreting division by zero as a utilization value. [Source][apf].

```promql
# Incident rejection rate: preserve the affected flow and reason.
sum by (instance, priority_level, flow_schema, reason) (
  rate(apiserver_flowcontrol_rejected_requests_total{job="apiserver"}[5m])
)

# Current queued requests: a brief queue is not proof of insufficient tier capacity.
sum by (instance, priority_level, flow_schema) (
  apiserver_flowcontrol_current_inqueue_requests{job="apiserver"}
)

# P99 queue wait by API server and priority level for dispatched requests.
histogram_quantile(0.99,
  sum by (le, instance, priority_level) (
    rate(apiserver_flowcontrol_request_wait_duration_seconds_bucket{
      job="apiserver",execute="true"
    }[5m])
  )
)
```

```promql
# Successful scheduling rate; total attempts also include failures.
sum(rate(scheduler_schedule_attempts_total{job="ksh",result="scheduled"}[5m]))
```

The scheduler counter's `result` dimension distinguishes successes from unschedulable/error attempts. Compare this rate with actual placement and readiness timestamps; it measures neither image pulls nor application readiness. [Source: Kubernetes v1.34.0 scheduler metrics][scheduler-metrics].

### 3.9 Correlate audit evidence {#39-useful-cloudwatch-logs-insights-queries}

When audit logging is already available, correlate completed requests from the incident window by verb, resource/subresource, API group, response code, and client. Match APF metrics to the same window. Preserve full timestamps when calculating durations across minute/day boundaries and avoid counting multiple audit stages as separate requests.

Requests to `customresourcedefinitions` concern definitions; custom resource instance traffic uses the custom API group/resource. A query matching only the definition endpoint cannot characterize CR traffic. Inspect sanitized aggregate results without publishing raw request bodies or private identities. [Source: control plane monitoring guidance][monitoring].

### 3.10 Interpret bottlenecks before increasing capacity {#310-api-vs-etcd-bottleneck-identification}

| Observation | Next investigation | Capacity implication |
|---|---|---|
| One priority level/instance queues or rejects while others have room | FlowSchema assignment, current/nominal limits, lending/borrowing, client bursts, traffic imbalance | Diagnose allocation/request pattern first |
| Broad sustained seat pressure with queue wait, rejections, and unmet latency objectives | Validate offered demand, reduce avoidable LIST/retry churn, repeat equivalent tests | A higher seat tier is a candidate if residual capacity demand is demonstrated |
| Slow API operations correlated with slow storage or admission calls | Storage metrics, operation/resource mix, webhook latency and controller backlog | Correlation identifies a path to investigate; a larger tier is not a proven fix |
| Unschedulable Pods without comparable API pressure | Node readiness/resources, affinity/taints, volume and network constraints | A tier change alone does not establish schedulability |
| Database fraction exceeds the planning budget | Growth/churn, object retention, measured in-use bytes | All listed PCP tiers have the same database attribute |

These are diagnostic decisions based on [APF behavior][apf] and [EKS scaling guidance][scale], not automatic upgrade rules.

### 3.11 Tier decision record {#311-pcp-tier-upgrade-decision-criteria-summary}

Record the version-specific source, headroom policy, candidate set, limiting dimension, and measured acceptance results together. **429 triggers investigation, not an automatic upgrade.** A passed mathematical screen is a candidate for testing; a failed or incomplete measurement is not a validated sizing result.

When no listed tier passes, explicitly report “no candidate under these assumptions.” Revisit workload behavior, recovery budget, or cluster partitioning instead of promoting to 8XL when its scheduling/database attributes are unchanged. If Standard meets the measured objectives, this guide supplies no numeric rule requiring PCP.

## Related resources {#related-resources}

### AWS documentation {#aws-official-documentation}

- [EKS Provisioned Control Plane][pcp] — versioned tier table and capacity/performance distinction; reviewed 2026-09-18.
- [EKS CloudWatch metrics][cw] — metric names, statistics, and database semantics; reviewed 2026-09-18.
- [Raw control plane metrics][raw], [control plane scaling][scale], and [monitoring guidance][monitoring].
- [EKS SLA][sla] and [EKS pricing][pricing] — consult applicable terms before an operational decision.

### AWS public benchmark {#aws-blogs}

- [Amazon EKS introduces Provisioned Control Plane][launch] — published 2025-11-27; workload-specific reported results.

### Upstream references {#kubernetes-upstream}

- [API Priority and Fairness][apf] and [etcd v3.6 data model][etcd-model].
- [APF metric source, Kubernetes v1.34.0][apf-metrics] and [scheduler metric source, Kubernetes v1.34.0][scheduler-metrics].
- [Kubernetes SLO framework, revision 14459aa5f98a5258f5dbd97b29897ea1231bc84e][slos].
- [ClusterLoader2 README, revision 104d820e9f1ac2e796390d95c5113bf673770ce1][cl2].

[pcp]: https://docs.aws.amazon.com/eks/latest/userguide/eks-provisioned-control-plane.html
[cw]: https://docs.aws.amazon.com/eks/latest/userguide/cloudwatch.html
[raw]: https://docs.aws.amazon.com/eks/latest/userguide/view-raw-metrics.html
[scale]: https://docs.aws.amazon.com/eks/latest/best-practices/scale-control-plane.html
[monitoring]: https://docs.aws.amazon.com/eks/latest/best-practices/control_plane_monitoring.html
[launch]: https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/
[sla]: https://aws.amazon.com/eks/sla/
[pricing]: https://aws.amazon.com/eks/pricing/
[apf]: https://kubernetes.io/docs/concepts/cluster-administration/flow-control/
[etcd-model]: https://etcd.io/docs/v3.6/learning/data_model/
[apf-metrics]: https://github.com/kubernetes/kubernetes/blob/v1.34.0/staging/src/k8s.io/apiserver/pkg/util/flowcontrol/metrics/metrics.go
[scheduler-metrics]: https://github.com/kubernetes/kubernetes/blob/v1.34.0/pkg/scheduler/metrics/metrics.go
[slos]: https://github.com/kubernetes/community/blob/14459aa5f98a5258f5dbd97b29897ea1231bc84e/sig-scalability/slos/slos.md
[cl2]: https://github.com/kubernetes/perf-tests/blob/104d820e9f1ac2e796390d95c5113bf673770ce1/clusterloader2/README.md
