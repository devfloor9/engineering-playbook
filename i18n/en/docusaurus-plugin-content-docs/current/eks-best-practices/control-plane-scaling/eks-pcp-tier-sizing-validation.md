---
title: "EKS PCP Tier Sizing & Performance Validation Guide"
sidebar_label: "PCP Tier Sizing"
description: "Detailed parameters by PCP tier, APF seat calculation formulas, large-scale cluster sizing examples, ClusterLoader2 performance validation methodology, customer case studies"
tags: [eks, pcp, sizing, performance, apf, clusterloader2, etcd]
sidebar_position: 2
last_update:
  date: 2026-04-07
  author: devfloor9
---


> **Purpose**: This guide provides detailed specifications for EKS Provisioned Control Plane (PCP) tiers, explains control plane architecture improvements, and outlines performance validation methodologies.

:::tip Related Documentation
For Control Plane architecture overview, CRD impact analysis, monitoring setup, and CRD design best practices, see **[EKS Control Plane & CRD at Scale Comprehensive Guide](./eks-control-plane-crd-scaling)**.
:::

---

## In this post

Organizations running large-scale Kubernetes workloads on Amazon EKS face a critical question: how do you ensure your control plane can handle peak load without over-provisioning? This technical deep dive explores three key areas:

1. **PCP tier specifications and practical object limits** — Understanding API request concurrency (seats), pod scheduling rates, and etcd database sizing with real-world examples
2. **EKS control plane architecture improvements** — How AWS engineering enhancements deliver consistent performance and higher availability
3. **Performance validation methodology** — Using ClusterLoader2 and comprehensive metrics to verify control plane capacity

Whether you're planning a 10,000-node cluster or troubleshooting API throttling, this guide provides the technical details and measurement strategies you need to right-size your EKS control plane.

---

## 1. PCP Tier Specifications and Practical Object Limits

> **Key takeaway:** API Request Concurrency (Seats) represents "concurrent seat capacity," not "concurrent request count." A single LIST request can consume up to 10 seats depending on the number of objects returned. Customer-facing concurrency numbers (e.g., 4XL = 6,800 seats) apply cluster-wide. For a 10,000-node / 1,000,000-pod environment, you need ~8.2 GB etcd DB capacity at peak, ~1,155 seats, and ~370 pods/sec for AZ failure recovery — making **4XL the recommended tier**. Kubernetes upstream officially supports up to 5,000 nodes / 150,000 pods, though AWS has benchmarked both 5K and 10K node configurations. **Measure actual APF seat usage** via `apiserver_flowcontrol_current_executing_seats` in CloudWatch (free) over a 1-week period to determine the appropriate tier.

### 1.1 Large-Scale Single Cluster Benchmarks

The following reference data is based on public documentation and AWS benchmarks for large single-cluster deployments.

#### Kubernetes Upstream and EKS Official Test Limits

| Benchmark | Nodes | Total Pods | Total K8s Objects | Notes |
|-----------|------:|----------:|-----------------:|-------|
| **K8s SIG-Scalability Official Limit** | 5,000 | 150,000 | ~300,000 | Upstream SLI/SLO guarantee scope |
| **EKS 5K Node Benchmark** | 5,000 | ~150,000 | ~300,000 | AWS validated |
| **EKS 10K Node Benchmark** | 10,000 | ~500,000+ | ~760,000 | PCP 4XL, API P99 < 1s achieved |

> **Note:** While Kubernetes upstream's official SLI/SLO guarantee covers 5,000 nodes / 150,000 pods, this represents a **conservative baseline applicable to all Kubernetes distributions**. EKS PCP is designed to support beyond this threshold into 10K+ node environments.

#### Confirmed Customer Cases

| Case | Object Count | Tier | Result |
|------|-------------|------|--------|
| **Company S** (Cloud/SaaS, cert-manager) | ~200K CRDs + ~400K related = ~600K | PCP recommended | Stable operations |
| **Company C** (Networking/Security, accessrulegroups) | ~12,500 CRDs (~300 KB each) | - | LIST timeout issues |
| **Kyverno admissionreports leak** (open-source controller) | 1,565,106 CRDs | Standard | etcd DB exceeded 8GB → failure |

#### Important Notes on Cluster Scale

Some large customers claim to operate "tens of thousands of nodes in a single cluster." However, **actual control plane load is not determined solely by node/pod count**. Two 10,000-node clusters can require completely different PCP tiers depending on workload patterns.

**Accurate tier sizing requires measuring actual APF seat usage, not claimed scale.** Refer to section 1.9 "APF Seat Usage Monitoring Guide" to measure your cluster's actual concurrency consumption.

> **Note:** Most large customers operate **multiple clusters** segmented by workload, region, and environment, rather than scaling a single cluster indefinitely.

> **Note:** AWS has benchmarked PCP performance in both 5K and 10K node environments.

#### Key Bottlenecks in Single Cluster Scaling

| Scale | Primary Bottleneck | Description |
|-------|-------------------|-------------|
| **~1,000 nodes** | Generally none | Standard tier sufficient for most workloads |
| **~3,000 nodes** | etcd DB size, API Concurrency | XL+ required if CRD-heavy |
| **~5,000 nodes** | Scheduler throughput, LIST latency | Approaching K8s upstream official limit, 2XL+ recommended |
| **~10,000 nodes** | All components can saturate | 4XL required, consider AZ failure recovery time |
| **~15,000+ nodes** | etcd 16GB limit, API Server horizontal scaling limits | 8XL or consider cluster splitting |

### 1.2 Official Tier Specifications

Amazon EKS Provisioned Control Plane allows customers to directly select a control plane scaling tier, **pre-provisioning capacity**. While Standard mode auto-scales based on workload, PCP guarantees the minimum performance floor of the selected tier.

| Tier | API Request Concurrency (seats) | Pod Scheduling Rate (pods/sec) | Cluster DB Size | SLA | Price ($/hr) |
|------|-------------------------------:|-------------------------------:|----------------:|----:|-------------:|
| **Standard** | Auto-scaling | Auto-scaling | 8 GB | 99.95% | $0.10 |
| **XL** | 1,700 | 167 | 16 GB | 99.99% | $1.65 |
| **2XL** | 3,400 | 283 | 16 GB | 99.99% | $3.40 |
| **4XL** | 6,800 | 400 | 16 GB | 99.99% | $6.90 |
| **8XL** | 13,600 | 400 | 16 GB | 99.99% | $14.00 |

> **Note:** Standard tier auto-scales based on workload. XL+ tiers guarantee the minimum performance floor for that tier, with auto-scaling available beyond the baseline as needed. For current pricing, see the [AWS EKS pricing page](https://aws.amazon.com/eks/pricing/).

### 1.3 Detailed Control Plane Parameters by Tier

Performance differences across tiers are determined by core parameters in kube-apiserver, kube-scheduler, and kube-controller-manager.

| Parameter | XL | 2XL | 4XL | 8XL |
|-----------|---:|----:|----:|----:|
| **API Server max-requests-inflight** | 567 | 1,134 | 1,511 | 1,511 |
| **API Server max-mutating-requests-inflight** | 283 | 566 | 756 | 756 |
| **Total APF Seats (inflight sum)** | **850** | **1,700** | **2,267** | **2,267** |
| **Scheduler kube-api-qps** | 167 | 283 | 400 | 400 |
| **Scheduler kube-api-burst** | 167 | 283 | 400 | 400 |
| **KCM kube-api-qps** | 180 | 340 | 500 | 500 |
| **KCM kube-api-burst** | 180 | 340 | 500 | 500 |
| **KCM concurrent-gc-syncs** | 35 | 50 | 50 | 50 |
| **KCM concurrent-hpa-syncs** | 29 | 50 | 50 | 50 |
| **KCM concurrent-job-syncs** | 180 | 340 | 500 | 500 |

> **Note:** Standard tier automatically adjusts control plane parameters based on workload.

### 1.4 What Each Metric Actually Means

#### API Request Concurrency (Seats)

"API Request Concurrency = 1,700 seats" does **not** mean the system can handle 1,700 simultaneous simple requests.

- **Seat** is the concurrency unit in APF (API Priority and Fairness). `max-requests-inflight` + `max-mutating-requests-inflight` sum to the API Server's **Total Concurrency Limit**, which is proportionally distributed across PriorityLevelConfigurations.
- **Simple requests** (GET/POST/PUT/DELETE): 1 seat consumed
- **Large LIST requests**: Consume **multiple seats** proportional to the number of objects returned (up to 10 seats via Work Estimator)
- **WATCH requests**: Consume 1 seat during initial notification burst, then released
- **WRITE requests**: Continue occupying additional seat time for WATCH notification processing even after write completion

> **Note:** AWS official spec API Request Concurrency is cluster-wide. EKS control planes run multiple API Servers for high availability, and the sum of APF seats across all servers equals the cluster-wide Concurrency.

**Behavior when exceeded**:
1. Total concurrency limit exceeded → requests **wait in APF queue**
2. Queue full → rejected with **HTTP 429 (Too Many Requests)**
3. Monitor via `apiserver_flowcontrol_rejected_requests_total` metric

#### Why 1,700 Seats Isn't as Small as It Sounds

Seats are **weighted concurrency**, not a simple connection count. The key factor is **occupation duration** — seats are returned immediately when a request completes.

| Request Type | Seat Cost | Typical Duration | Throughput per Seat per Second |
|-------------|:---------:|:----------------:|:-----------------------------:|
| Simple GET | 1 | ~5ms | ~200 req/s |
| LIST (< 500 objects) | 1 | ~100ms | ~10 req/s |
| LIST (5,000 objects) | 10 | ~3s | ~0.3 req/s |
| CREATE/UPDATE | 1 | ~60ms (write + WATCH propagation) | ~16 req/s |

**Streaming analogy**: Think of seats as **bandwidth**, not connections. A 4K stream consumes 25 Mbps while SD uses 3 Mbps — "1 Gbps bandwidth" doesn't mean 1,000 concurrent users if they're all streaming 4K. Similarly, `kubectl get pods -A` (LIST all) is "4K streaming" (10 seats), while `kubectl get pod my-pod` is "SD streaming" (1 seat).

**Real-world production example (~200 nodes, XL tier = 1,700 seats)**:

```
Steady-state load:
  kubelet heartbeats (200 nodes × 10s interval)     → ~20 seats
  20 controllers in reconcile loops                   → ~50 seats
  Prometheus scraping                                 → ~5 seats
  General kubectl usage                               → ~10 seats
  ─────────────────────────────────────────────────────────────
  Total: ~85 seats (5% of 1,700)

Peak burst scenario (simultaneous):
  500 Deployment rollouts                             → +500 seats
  Monitoring dashboards running large LISTs           → +30 seats
  HPA simultaneous scaling                            → +100 seats
  AZ failure → pod rescheduling burst                 → +300 seats
  ─────────────────────────────────────────────────────────────
  Total: ~1,015 seats (60% of 1,700)
```

**Tier selection is driven by peak bursts, not steady-state.** 1,700 seats (XL) becomes insufficient when:
- **500+ nodes** with AZ failure triggering 1/3 pod rescheduling
- **10+ large CRD controllers** reconciling simultaneously
- **CI/CD pipelines** deploying hundreds of Deployments at once

In these cases, upgrade to 2XL (3,400 seats) or 4XL (6,800 seats).

#### Pod Scheduling Rate (pods/sec)

- Represents **the number of pods the Scheduler can bind per second**.
- Determined by `kube-api-qps` and `kube-api-burst` parameters that control how fast the Scheduler can make API Server requests.
- At 4XL+, Scheduler QPS plateaus at 400, but bottlenecks are mitigated by increased API Server count (3+).
- Actual throughput can be verified via `scheduler_schedule_attempts_total` metric.

#### Cluster DB Size (etcd)

- The upper limit of **logical data size** storable in etcd.
- Standard: 8 GB
- XL+: 16 GB
- Due to etcd's MVCC characteristics, **frequent updates cause revision accumulation, making actual DB size 2-5x the data size**.
- Compaction runs every 5 minutes to delete old revisions, but extremely high update frequencies can fill the DB between compaction cycles.
- **When quota exceeded, all writes are rejected** → cluster effectively down

### 1.5 API Request Concurrency vs Inflight Seats — Concept Deep Dive with Examples

#### Terminology: Two Different Layers

"API Request Concurrency" and "Inflight Seats" are often used interchangeably, but they represent **different layers**.

```
┌─────────────────────────────────────────────────────────────────┐
│                   AWS Official Spec                              │
│         "API Request Concurrency = 6,800 seats" (4XL)            │
│                                                                   │
│   = Total "seat capacity" for concurrent requests cluster-wide   │
│   = Individual API Server APF seats sum × API Server count       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  API Server #1  │ │  API Server #2  │ │  API Server #N  │
│                 │ │                 │ │                 │
│  APF Seats      │ │  APF Seats      │ │  APF Seats      │
└────────────────┘ └────────────────┘ └────────────────┘

Cluster Total Concurrency = Individual Server APF Seats × API Server Count
```

| Concept | Scope | Description |
|---------|-------|-------------|
| **max-requests-inflight** | Individual API Server | Maximum concurrent non-mutating (read-only) requests |
| **max-mutating-requests-inflight** | Individual API Server | Maximum concurrent mutating requests |
| **Individual Server APF Total Seats** | Individual API Server | Sum of the above two values. Proportionally distributed to APF PriorityLevels |
| **API Request Concurrency** | Cluster-wide | Individual Server APF Seats × API Server Count. **Value published in AWS official specs** |

#### Core Difference: "Concurrent Request Count" vs "Concurrent Seat Count"

**Seat (capacity)** does not equal 1 request = 1 seat. Seats consumed vary by request type:

| Request Type | Seat Consumption | Occupation Duration | Description |
|-------------|:----------------:|---------------------|-------------|
| **Simple GET** (e.g., `kubectl get pod my-pod`) | **1** | Until response complete | Single object retrieval |
| **Simple CREATE/UPDATE/DELETE** | **1** | Write complete + WATCH notification propagation time | Mutating requests occupy additional time post-write |
| **Small LIST** (< 500 objects returned) | **1** | Until response complete | Work Estimator calculates as 1 seat |
| **Large LIST** (1,000 objects returned) | **~2** | Until response complete | Increases proportional to object count |
| **Large LIST** (5,000 objects returned) | **~10** | Until response complete | Work Estimator maximum |
| **WATCH** | **1 initially** → **0** | Released after initial burst | Long-lived connection but seat released |

#### Concrete Scenario Example (4XL Cluster)

**Scenario**: 4XL cluster (total 6,800 seats) with the following simultaneous requests

```
┌─ Concurrent Requests ───────────────────────────────────────────┐
│                                                                  │
│  [1] kubectl get pods -A (all namespaces LIST, 50,000 pods)     │
│      → Work Estimator: 10 seats × 3s response time = 10 seats   │
│                                                                  │
│  [2] 20 controllers each running reconciliation loop            │
│      → Each controller averages 5 GET + 2 UPDATE concurrent     │
│      → 20 × 7 = 140 seats                                       │
│                                                                  │
│  [3] CI/CD pipeline deploying 500 Deployments simultaneously    │
│      → Each CREATE 1 seat + WATCH notification additional time  │
│      → Peak ~500 seats                                          │
│                                                                  │
│  [4] Prometheus scraping /metrics endpoints                     │
│      → Multiple API Servers × 1 seat = few seats               │
│                                                                  │
│  [5] Other system components (kubelet heartbeat, node status)   │
│      → 10,000 nodes × kubelet avg 0.1 concurrent = ~1,000 seats│
│                                                                  │
│  Total: 10 + 140 + 500 + few + 1,000 = ~1,653 seats (of 6,800) │
│  → Headroom: ~75% ✅                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Same scenario on XL cluster?**:
- XL total seats = 1,700
- Same load 1,653 seats → ~97% utilization — **approaching limit**
- **In 10,000-node environments, kubelet heartbeat, node status updates occur continuously**
- During peak LIST request bursts, seat consumption spikes, causing 429 errors
- **Actually 4XL+ is recommended**

#### APF PriorityLevel Distribution Example (4XL Basis)

Cluster-wide APF Seats are proportionally distributed to PriorityLevelConfigurations on each API Server. Below is an individual API Server example:

```
Individual API Server APF Seat Distribution Example
│
├─ system (highest priority)    ─── ~5%  = ~113 seats   ← kube-system core components
├─ leader-election              ─── ~5%  = ~113 seats   ← Leader election requests
├─ node-high                    ─── ~10% = ~227 seats   ← kubelet core requests
├─ workload-high                ─── ~10% = ~227 seats   ← Critical workloads
├─ workload-low                 ─── ~15% = ~340 seats   ← General workloads
├─ global-default               ─── ~15% = ~340 seats   ← Unclassified requests
├─ catch-all                    ─── ~5%  = ~113 seats   ← Lowest priority
└─ exempt                       ─── Unlimited            ← system:masters, etc.
```

> **Key point**: Even with sufficient total seats, **if a specific PriorityLevel saturates**, only requests in that group get rejected with 429. For example, if the 340 seats allocated to `workload-low` saturate, regular user kubectl requests may be rejected.

### 1.6 Large-Scale Cluster Scenario: 10,000 Nodes × 100 Pods Environment PCP Sizing

#### Assumptions

```
Cluster Scale:
  - Worker Nodes: 10,000
  - Pods per Node: 100
  - Total Pods: 1,000,000 (1 million)

CRD Usage Scenario:
  - CRD Type A (network policy): 1 per node = 10,000 × ~2 KB = ~20 MB
  - CRD Type B (service mesh sidecar config): 1 per pod = 1,000,000 × ~1 KB = ~1 GB
  - CRD Type C (certificate management): 1 per service = 5,000 × ~3 KB = ~15 MB
  - CRD Type D (monitoring rules): 1 per namespace = 200 × ~5 KB = ~1 MB
```

#### Step 1: etcd DB Size Estimation

```
[K8s Built-in Objects]
  Pod:                  1,000,000 × ~1.5 KB   = ~1.5 GB
  Node:                    10,000 × ~5 KB     = ~50 MB
  Service:                  5,000 × ~1 KB     = ~5 MB
  Endpoint/EndpointSlice:  15,000 × ~2 KB     = ~30 MB
  ConfigMap:               10,000 × ~1 KB     = ~10 MB
  Secret:                  20,000 × ~1 KB     = ~20 MB
  Deployment/ReplicaSet:   10,000 × ~2 KB     = ~20 MB
  Namespace:                  200 × ~0.5 KB   = ~0.1 MB
  ServiceAccount:          10,000 × ~0.5 KB   = ~5 MB
  Event:                   50,000 × ~1 KB     = ~50 MB  ← Separate partition on XL+
  ──────────────────────────────────────────────────────
  Subtotal:                                     ~1.69 GB

[CRD Objects]
  Type A (network policy):      10,000 × 2 KB   = ~20 MB
  Type B (sidecar config):   1,000,000 × 1 KB   = ~1.0 GB
  Type C (certificates):         5,000 × 3 KB   = ~15 MB
  Type D (monitoring rules):       200 × 5 KB   = ~1 MB
  ──────────────────────────────────────────────────────
  Subtotal:                                     ~1.04 GB

[MVCC Revision Overhead]
  Pod status updates: Every 30s × 1,000,000 pods → ~33,333 updates/sec
  CRD Type B updates: Every 60s → ~16,667 updates/sec
  Compaction cycle: 5 minutes = 300 seconds
  
  Accumulated revisions in 5 min = (33,333 + 16,667) × 300 = ~15,000,000 revisions
  Additional size per revision ≈ avg ~0.1 KB (changed fields only)
  → MVCC overhead: ~15,000,000 × 0.1 KB = ~1.5 GB (at peak)
  
  ※ Immediately after compaction, this overhead approaches zero
  ※ In reality, compaction and updates proceed simultaneously, so
     steady-state MVCC overhead ≈ 1-2x data size estimated

[Total etcd DB Size Estimate]
  ─────────────────────────────────────────────────────────
  Built-in objects:                           ~1.69 GB
  CRD objects:                                ~1.04 GB
  MVCC Revision overhead (steady-state):     ~2.73 GB (1x multiplier applied)
  ─────────────────────────────────────────────────────────
  Total:                                      ~5.46 GB
  Peak (pre-compaction):                      ~8.19 GB (1.5x multiplier applied)
  ─────────────────────────────────────────────────────────
```

> **Verdict**: At ~8.2 GB peak, Standard's 8 GB limit is exceeded. **XL+ (16 GB) is required** and provides safe margin.

#### Step 2: API Concurrency (Seats) Requirement Estimation

```
[Continuous API Load — Ongoing Requests]

  kubelet heartbeat (NodeStatus):
    10,000 nodes × (1 UPDATE / 10s) = 1,000 req/sec
    Concurrent processing (avg 50ms response time):
    1,000 × 0.05 = ~50 seats (1 seat each)

  kubelet Pod status updates:
    Only changed pods → avg ~500 UPDATE/sec
    Concurrent: 500 × 0.05 = ~25 seats

  kube-controller-manager:
    GC, HPA, Job, etc. multiple controllers → avg ~100 concurrent seats

  kube-scheduler:
    New/reschedule pods → avg ~50 concurrent seats

  CRD controllers (4 types):
    Each controller's reconciliation loop → avg ~200 concurrent seats

  Other systems (DNS, CNI, monitoring, etc.):
    → ~100 concurrent seats

  ──────────────────────────────────────────
  Baseline Seats Consumption:         ~525 seats
  ──────────────────────────────────────────

[Peak Additional Load]

  Large rolling update (100 Deployments simultaneously):
    → +500 seats (CREATE/UPDATE surge)

  Full Pod LIST (monitoring dashboard, kubectl):
    → LIST 1,000,000 pods = ~10 seats × 3 concurrent = +30 seats
    → Response time lengthens, increasing seat occupation time

  HPA scaling events:
    → +100 seats

  ──────────────────────────────────────────
  Peak Total Seats Consumption:      ~1,155 seats
  ──────────────────────────────────────────
```

#### Step 3: Scheduling Throughput Requirement Estimation

```
[Normal Operations]
  Daily avg deployments: ~200
  Avg pods per deployment: ~50
  Daily scheduling total: 200 × 50 = 10,000 pods/day
  Per-second avg: ~0.12 pods/sec → All tiers sufficient

[Peak Scenario — Large Rollout]
  10 simultaneous Deployments × 100 replicas = 1,000 pods in 5 minutes
  Required throughput: 1,000 / 300s = ~3.3 pods/sec → All tiers sufficient

[Extreme Scenario — Node Failure Mass Rescheduling]
  AZ failure, 3,333 nodes (1/3) with 333,300 pods need rescheduling
  Target recovery time 15 minutes: 333,300 / 900s = ~370 pods/sec
  → 4XL (400 pods/sec) or higher required
```

#### Step 4: Comprehensive PCP Tier Sizing Result

```
┌───────────────────────────────────────────────────────────────────┐
│           10K Nodes × 100 Pods Environment Comprehensive Sizing    │
├──────────────────┬──────────┬──────────┬────────────┬────────────┤
│ Evaluation Item   │ Required │ Tier     │ Standard   │ Verdict    │
├──────────────────┼──────────┼──────────┼────────────┼────────────┤
│ etcd DB Size     │ ~8.2 GB  │ XL+      │ 8GB limit  │ ❌ Exceeded│
│ (at peak)        │ (peak)   │ (16GB)   │ No margin  │            │
├──────────────────┼──────────┼──────────┼────────────┼────────────┤
│ API Concurrency  │ ~1,155   │ XL       │ Auto-scale │ Near floor │
│ (peak seats)     │ seats    │ (1,700)  │            │            │
├──────────────────┼──────────┼──────────┼────────────┼────────────┤
│ Pod Scheduling   │ ~370     │ 4XL      │ Auto-scale │ ❌ Insufficient │
│ (AZ failure)     │ pods/sec │ (400)    │            │            │
├──────────────────┼──────────┼──────────┼────────────┼────────────┤
│ SLA requirement  │ 99.99%   │ XL+      │ 99.95%     │ Not met    │
├──────────────────┴──────────┴──────────┴────────────┴────────────┤
│                                                                   │
│  ✅ Final Recommendation: 4XL                                     │
│                                                                   │
│  Rationale:                                                       │
│  1. etcd 16GB provides sufficient margin at peak (8.2/16 = 51%)  │
│  2. API Concurrency 6,800 seats adequate for peak (1,155/6,800=17%)│
│  3. AZ failure requires 370 pods/sec recovery → 4XL's 400 needed │
│  4. Multiple API Servers via horizontal scaling → distributes    │
│     large LIST load                                               │
│  5. 99.99% SLA guarantee                                         │
│                                                                   │
│  ⚠️ If AZ failure recovery time can be relaxed to 30 minutes:    │
│     333,300 / 1,800s = ~185 pods/sec → 2XL (283 pods/sec) viable│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

#### PCP Tier Sizing Formula Summary

```
[Formula 1: etcd DB Size]
  Required etcd size = (Built-in object total + CRD object total) × MVCC multiplier
  
  MVCC multiplier:
    - Low update frequency (< hundreds/min):     1.5x
    - Medium update frequency (thousands/min):   2.0x
    - High update frequency (thousands/sec):     3.0x ~ 5.0x

  Standard suitable: Required < 6.4 GB (8 GB limit, 20% safety margin)
  XL+ suitable:     Required < 12.8 GB (16 GB limit, 20% safety margin)

[Formula 2: API Concurrency (Seats)]
  Peak Seats = Σ(per-component req/sec × avg response time) + LIST additional seats
  
  Individual request seats = 1 (simple GET/POST/PUT/DELETE)
  LIST request seats = min(ceil(expected returned objects / 500), 10)
  WRITE additional seats = seat × (1 + watch_notification_factor)

  Required tier:
    Peak Seats < 1,700  → Standard or XL
    Peak Seats < 3,400  → 2XL
    Peak Seats < 6,800  → 4XL
    Peak Seats < 13,600 → 8XL

[Formula 3: Scheduling Throughput]
  Required Scheduling Rate = Concurrent reschedule pod count / target recovery time(sec)
  
  Required tier:
    Rate < 100  → Standard
    Rate < 283  → XL
    Rate < 400  → 2XL / 4XL / 8XL (same)

[Final Tier = max(Formula1 result, Formula2 result, Formula3 result)]
```

### 1.7 Production Environment Practical Object Quantities

#### Theoretical Maximum Based on etcd DB Size (PCP 16GB Basis)

| Object Type | Typical Size | Theoretical Maximum Count | Practical Recommended Limit (50% safety margin) |
|------------|-------------|:------------------------:|:----------------------------------------------:|
| Small CRD (< 1 KB) | ~0.5 - 1 KB | Millions ~ 16M+ | ~8M |
| Typical CRD (1 ~ 5 KB) | ~2 - 3 KB | 3M ~ 8M | ~1.5M ~ 4M |
| Medium CRD (5 ~ 10 KB) | ~5 - 10 KB | 1.5M ~ 3M | ~750K ~ 1.5M |
| Large CRD (100 KB+) | ~100 - 300 KB | 50K ~ 160K | ~25K ~ 80K |
| etcd single object maximum | **1.5 MiB** (hard limit) | - | - |

> **Why 50% safety margin on practical limits**: Must account for MVCC revision accumulation, update frequency, and space occupied by existing K8s built-in objects (Pod, ConfigMap, Secret, etc.).

#### Actual Benchmarks and Customer Cases

| Case | Object Count | Tier | Result |
|------|-------------|------|--------|
| **AWS PCP Official Benchmark** | ~760,000 K8s objects | 4XL | API P99 < 1s, Scheduler ~350 pods/sec maintained |
| **Company S** (Cloud/SaaS, cert-manager) | ~200K CRDs + ~400K related = ~600K | PCP recommended | Stable operations |
| **Company C** (Networking/Security, accessrulegroups) | ~12,500 CRDs | - | ~300 KB each → LIST timeout (size issue) |
| **Kyverno admissionreports leak** (open-source controller) | 1,565,106 | Standard | etcd DB exceeded → failure |

#### Recommended Workload Scale Guide by Tier

| Tier | Total K8s Objects | CRD Avg Size | API Concurrency Demand | Suitable Use Cases | Monthly Cost Reference |
|------|:-----------------:|:------------:|:----------------------:|--------------------|-----------------------:|
| **Standard** | < 100K | < 10 KB | Low | Small/medium clusters, dev/staging | ~$73 |
| **XL** | 100K ~ 300K | < 10 KB | Medium | Medium production, typical CRD usage | ~$1,277 |
| **2XL** | 300K ~ 500K | < 10 KB | High | Large production, multiple controllers | ~$2,555 |
| **4XL** | 500K ~ 760K+ | < 50 KB | Very High | Ultra-large scale, heavy CRD workloads | ~$5,110 |

#### Specific Impact of CRDs on Control Plane

CRD operations have unique performance characteristics distinct from built-in resources:

| Impact Area | Description | Risk Level |
|------------|-------------|:----------:|
| **DB Size Growth** | CRD objects directly occupy etcd storage | High |
| **Watch Stream Load** | CRD controllers create Watch streams increasing etcd gRPC load | High |
| **Request Size** | Individual CRD objects can exceed 1.5MB etcd request limit | Medium |
| **List Call Cost** | CRDs use JSON encoding (not protobuf) → LIST/WATCH performance significantly degraded vs built-in resources | High |

### 1.8 Tier Selection Decision Tree

```
Calculate Total CRD Object Capacity
│
├─ Total objects × avg size < 5 GB
│   ├─ Low update frequency (< hundreds/min) → Standard
│   └─ High update frequency (thousands/min+) → XL (revision accumulation buffer)
│
├─ Total objects × avg size = 5 ~ 10 GB
│   ├─ API concurrency < 1,700 seats → XL
│   └─ API concurrency > 1,700 seats → 2XL
│
├─ Total objects × avg size = 8 ~ 16 GB
│   ├─ API concurrency < 3,400 seats → 2XL
│   └─ API concurrency > 3,400 seats → 4XL
│
└─ Total objects × avg size > 16 GB (exceeds XL+ etcd limit)
    └─ Not viable as single cluster → Consider cluster splitting
```

**PCP Core Design Principles**:
1. Tier determined by K8s metrics that drive billing (inflight requests, scheduler QPS, etcd DB size)
2. Availability prioritized over cost
3. Standard tier guarantees minimum Kubernetes upstream defaults or higher

### 1.9 APF Seat Actual Usage Monitoring Guide — Determine Tier by "Measurement," Not "Claims"

Cluster scale (node count, pod count) alone cannot accurately determine required PCP tier. **Even with identical 10,000 nodes, actual seat consumption can differ by 10x+ depending on workload patterns.** Therefore, **measure your cluster's actual APF seat usage** before determining tier.

#### Method 1: CloudWatch Vended Metrics (Free, Simplest)

For K8s 1.28+ clusters, available in CloudWatch `AWS/EKS` namespace without additional setup.

**Key Metric**: `apiserver_flowcontrol_current_executing_seats`

```
CloudWatch Console Path:
  CloudWatch → Metrics → AWS/EKS → ClusterName
  → apiserver_flowcontrol_current_executing_seats

Recommended Settings:
  - Statistic: Maximum (use Max, not Average, to capture peaks)
  - Period: 1 minute
  - Observation period: Minimum 1 week (including business peaks)
```

**CloudWatch Alarm Setup Example**:
```
Alarm Condition: apiserver_flowcontrol_current_executing_seats
  Maximum > (80% of current tier limit) for 5 datapoints within 5 minutes

Example (XL tier):
  Maximum > 1,360 (= 1,700 × 80%) → Alert to consider 2XL upgrade
```

#### Method 2: Prometheus Direct Scraping (Detailed Analysis)

Verify per-PriorityLevel seat distribution and consumption to **analyze which workloads consume most seats**.

```bash
# Direct API Server metrics query
kubectl get --raw=/metrics | grep apiserver_flowcontrol

# Or use PromQL if Prometheus is deployed
```

**4 Core PromQL Queries**:

```promql
# ① Current total seats in use (cluster-wide, most important)
sum(apiserver_flowcontrol_current_executing_seats{})

# ② Usage vs limit by PriorityLevel — identify saturation
# (usage)
sum by (priority_level)(apiserver_flowcontrol_current_executing_seats{})
# (limit)
sum by (priority_level)(apiserver_flowcontrol_nominal_limit_seats{})
# (utilization %)
sum by (priority_level)(apiserver_flowcontrol_current_executing_seats{})
/ sum by (priority_level)(apiserver_flowcontrol_nominal_limit_seats{})
* 100

# ③ Requests waiting in APF queue (> 0 indicates capacity shortage)
sum by (priority_level)(apiserver_flowcontrol_current_inqueue_requests{})

# ④ Requests rejected by APF (429 occurrences — should be 0)
sum(rate(apiserver_flowcontrol_rejected_requests_total{}[5m]))
```

#### Method 3: kubectl One-liner — Check Right Now

Even without Prometheus, you can check directly from the API Server metrics endpoint.

```bash
# Check current total seats in use
kubectl get --raw=/metrics | grep 'apiserver_flowcontrol_current_executing_seats{' \
  | awk '{sum+=$2} END {print "Current seats in use:", sum}'

# Seat usage by PriorityLevel
kubectl get --raw=/metrics | grep 'apiserver_flowcontrol_current_executing_seats{' \
  | sort -t' ' -k2 -rn | head -10

# Allocated limit by PriorityLevel
kubectl get --raw=/metrics | grep 'apiserver_flowcontrol_nominal_limit_seats{' \
  | sort -t' ' -k2 -rn

# Check rejected requests (if not 0, immediate action needed)
kubectl get --raw=/metrics | grep 'apiserver_flowcontrol_rejected_requests_total{' \
  | awk '{sum+=$2} END {print "Total rejected requests:", sum}'

# Check etcd DB size
kubectl get --raw=/metrics | grep 'apiserver_storage_size_bytes{' \
  | awk '{sum+=$2} END {printf "etcd DB size: %.2f GB\n", sum/1024/1024/1024}'
```

#### Measurement Result Interpretation Guide

```
Measured Peak Seat Usage
│
├─ Peak < 1,000 seats
│   └─ Standard or XL sufficient
│       (However, if even 1 instance of 429 error, XL+ needed)
│
├─ Peak 1,000 ~ 1,400 seats
│   └─ XL recommended (1,700 seats, ~18-41% headroom)
│
├─ Peak 1,400 ~ 2,700 seats
│   └─ 2XL recommended (3,400 seats, ~21-59% headroom)
│
├─ Peak 2,700 ~ 5,400 seats
│   └─ 4XL recommended (6,800 seats, ~21-60% headroom)
│
└─ Peak > 5,400 seats
    └─ 8XL (13,600 seats) or consider cluster splitting
    
⚠️ Important: Maintain minimum 20% safety margin.
   When peak reaches 80% of limit, evaluate higher tier.
   Reason: Need buffer for unexpected bursts (mass retry after
   deploy failure, runaway controller infinite LIST, etc.).
```

#### Customer Measurement Request Template

Share the following with customers to collect 1 week of data for appropriate tier determination:

```
[Request]
Please collect the following 3 metrics from your current cluster over 1 week (including business peaks).

1. APF Seat Peak Usage:
   CloudWatch → AWS/EKS → apiserver_flowcontrol_current_executing_seats
   → Maximum value (1-minute interval), max over 1 week

2. 429 Error Occurrences:
   CloudWatch → AWS/EKS → apiserver_request_total_429
   → Sum value, whether any non-zero timepoints exist

3. etcd DB Size:
   CloudWatch → AWS/EKS → apiserver_storage_size_bytes
   → Maximum value, max over 1 week

[Additional Helpful Information]
- Total node count, total pod count
- CRD types and counts (kubectl get crd results)
- Total CRD objects by resource type
- Daily deployment frequency and scale
```

---

## 2. EKS Control Plane Architecture Improvements

> **Key takeaway:** EKS has continuously improved etcd architecture to achieve **consistent latency, enhanced availability, etcd DB 16GB expansion (XL+), Event Sharding, and API Server horizontal scaling**. Monitor etcd DB size using the `apiserver_storage_size_bytes` metric.

### 2.1 Overview

AWS continuously enhances the EKS control plane etcd architecture, delivering higher performance and availability. These improvements provide direct benefits to customers across all PCP tiers.

### 2.2 Performance Improvement Benefits for Customers

| Area | Improvement | Detailed Description |
|------|------------|----------------------|
| **Predictable Performance** | Consistent etcd latency | Architecture improvements reduce etcd write latency variance, providing stable API response times |
| **Enhanced Data Durability** | Stronger data consistency | Data inconsistency potential significantly reduced |
| **Improved Availability** | Infrastructure optimization | Reduced failure points improve overall availability |
| **etcd DB Size Expansion** | 16 GB etcd DB (XL+) | 2x expansion vs Standard's 8 GB, accommodating large-scale CRD workloads |
| **etcd Event Sharding** | Event objects isolated to separate partition | On XL+ tiers, events don't impact main etcd |
| **API Server Horizontal Scaling** | Multiple API Server operations | Higher tiers enable API Server horizontal scaling for load distribution |

### 2.3 Features Available Only on XL+ Tiers

| Feature | Standard | XL+ |
|---------|:--------:|:---:|
| API Server Horizontal Scaling | Basic configuration | Scalable |
| etcd DB Size | 8 GB | 16 GB |
| etcd Event Sharding | Not supported | Supported (events in separate partition) |
| SLA | 99.95% | 99.99% |

---

## 3. EKS Control Plane Performance Validation Methodology

> **Key takeaway:** **ClusterLoader2 (CL2)** is the standard load testing tool used by both AWS and the Kubernetes community, including in AWS PCP official benchmarks. Testing follows a **5-phase strategy** (Baseline → Ramp-up → Sustained Peak → Burst → Recovery), but requires at minimum **deploying Prometheus to collect detailed APF metrics and etcd metrics** for accurate bottleneck analysis. **Success criteria** follows official Kubernetes SLI/SLO: API Mutating P99 ≤ 1s, Cluster LIST P99 ≤ 30s, Pod Scheduling P99 ≤ 5s. **CloudWatch free metrics cover**: 429 errors, API P99 latency, etcd DB size, APF seat usage, scheduling attempts. **Prometheus required for**: etcd latency, APF queue depth, KCM workqueue depth, per-PriorityLevel saturation analysis.

### 3.1 Testing Tool: ClusterLoader2 (CL2)

Both AWS and the Kubernetes community use **ClusterLoader2** as the standard load testing tool. AWS PCP launch blog benchmarks were performed with this tool.

#### Installation and Build

```bash
git clone https://github.com/kubernetes/perf-tests.git \
  "/Users/$USER/go/src/k8s.io/perf-tests"
cd "/Users/$USER/go/src/k8s.io/perf-tests/clusterloader2"
GOPROXY=direct go build -o /tmp/clusterloader ./cmd/
```

#### Execution Method

```bash
# Create override file
cat > /tmp/overrides.yaml <<EOL
NODES_PER_NAMESPACE: 50
PODS_PER_NODE: 30
CL2_LOAD_TEST_THROUGHPUT: 80
BIG_GROUP_SIZE: 25
MEDIUM_GROUP_SIZE: 10
SMALL_GROUP_SIZE: 5
SMALL_STATEFUL_SETS_PER_NAMESPACE: 0
MEDIUM_STATEFUL_SETS_PER_NAMESPACE: 0
CL2_ENABLE_PVS: false
PROMETHEUS_SCRAPE_KUBE_PROXY: false
ENABLE_SYSTEM_POD_METRICS: false
EOL

# Run test
/tmp/clusterloader \
    --kubeconfig ~/.kube/config \
    --testconfig testing/load/config.yaml \
    --testoverrides /tmp/overrides.yaml \
    --nodes <NODE_COUNT> \
    --provider "eks" \
    --report-dir ./results \
    --alsologtostderr
```

#### Key Override Parameters

| Parameter | Description | Small Test | Large Test |
|-----------|-------------|:----------:|:----------:|
| `NODES_PER_NAMESPACE` | Nodes per namespace | 10 | 50 |
| `PODS_PER_NODE` | Pods per node | 10 | 30 |
| `CL2_LOAD_TEST_THROUGHPUT` | Client-side requests per second | 50 | 1200 |
| `BIG_GROUP_SIZE` | Large Deployment size | 25 | 25 |
| `MEDIUM_GROUP_SIZE` | Medium Deployment size | 10 | 10 |
| `SMALL_GROUP_SIZE` | Small Deployment size | 5 | 5 |
| `CL2_SCHEDULER_THROUGHPUT_THRESHOLD` | Scheduler throughput threshold | 20 | 100 |

### 3.2 Test Scenario Types

| Test Type | Purpose | CL2 Config |
|-----------|---------|------------|
| **Load Test** | Measure service behavior at expected peak load | `testing/load/config.yaml` |
| **Density Test** | Verify stability at specific node/pod density | `testing/density/config.yaml` |
| **Scheduler Throughput** | Measure pod scheduling throughput limits | CL2 + scheduler throughput override |
| **API Request Benchmark** | Measure latency/throughput per API verb | `testing/request-benchmark` |
| **Stress Test** | Apply load exceeding normal operating range, observe recovery | CL2 + gradual load increase |

### 3.3 5-Phase Load Testing Strategy

```
Phase 1: Baseline Measurement
├── Collect key metrics under current workload
├── Analyze API request patterns (by verb, by resource)
└── Record etcd DB size and object counts

Phase 2: Ramp-up
├── Gradually increase pods/deployments with CL2
├── Monitor SLI/SLO thresholds at each step
└── Record when 429 errors or P99 > SLO occurs

Phase 3: Sustained Peak
├── Maintain target load for 30+ minutes
├── Verify stability (no metric fluctuation)
└── Observe control plane auto-scaling (Standard)

Phase 4: Burst Testing
├── Simulate sudden load spikes
├── For PCP, verify immediate response capability
└── For Standard, measure auto-scaling reaction time

Phase 5: Recovery Testing
├── Measure metric normalization time after load removal
└── Verify residual queue depth, latency, etc.
```

### 3.4 Simple Script-Based Testing (Without CL2)

```bash
# 1. Mass Deployment creation for API load test
for i in $(seq 1 500); do
  kubectl create deployment test-$i --image=nginx --replicas=10 &
done
wait

# 2. Mass ConfigMap creation for etcd write load
for i in $(seq 1 10000); do
  kubectl create configmap test-cm-$i --from-literal=key=value &
done

# 3. Mass LIST calls for read load
while true; do kubectl get pods --all-namespaces > /dev/null; done
```

### 3.5 Official Kubernetes SLI/SLO Standards (Validation Success Criteria)

| SLI | SLO | Metric |
|-----|-----|--------|
| API Call Latency (Mutating, resource-scope) | P99 ≤ 1s | `apiserver_request_sli_duration_seconds` |
| API Call Latency (Read-only, resource-scope) | P99 ≤ 1s | `apiserver_request_sli_duration_seconds` |
| API Call Latency (Namespace-scope LIST) | P99 ≤ 30s | `apiserver_request_sli_duration_seconds` |
| API Call Latency (Cluster-scope LIST) | P99 ≤ 30s | `apiserver_request_sli_duration_seconds` |
| Pod Startup Latency | P99 ≤ 5s (excluding image pull/init) | `kubelet_pod_start_sli_duration_seconds` |
| Pod Scheduling Latency | P99 ≤ 5s | `scheduler_pod_scheduling_sli_duration_seconds` |

### 3.6 Key Monitoring Metrics — Availability by Collection Path

EKS provides 4 dimensions of Control Plane observability:

| # | Channel | Cost | Setup | Data Provided | PCP Support |
|---|---------|------|-------|---------------|-------------|
| 1 | CloudWatch Vended Metrics | Free | Automatic (v1.28+) | Core K8s metrics (time series) | Includes tier usage metrics |
| 2 | Prometheus Endpoint | Free (scraping) | Manual configuration | KCM/KSH/etcd detailed metrics | Scalable |
| 3 | Control Plane Logging | CloudWatch standard rates | Manual activation | Logs (API/Audit/Auth/CM/Sched) | — |
| 4 | Cluster Insights | Free | Automatic | Cluster health/upgrade recommendations | PCP tier recommendations (future) |
| 5 | EKS Console Dashboard | Free | Automatic | Visualized metrics + log queries | Tier information displayed |

#### CloudWatch Vended Metrics (Free, Automatic)

Automatically published to `AWS/EKS` namespace for K8s 1.28+.

| Component | Metric | Description | Priority |
|-----------|--------|-------------|:--------:|
| API Server | `apiserver_request_total` | Total API requests | Critical |
| API Server | `apiserver_request_total_4xx` | 4xx error requests | Critical |
| API Server | `apiserver_request_total_5xx` | 5xx error requests | Critical |
| API Server | `apiserver_request_total_429` | 429 Throttling requests | Critical |
| API Server | `apiserver_request_duration_seconds` | API request latency | Recommended |
| API Server | `apiserver_storage_size_bytes` | etcd storage size | Critical |
| API Server | `apiserver_flowcontrol_current_executing_seats` | Current APF seats in use (PCP core) | Critical |
| Scheduler | `scheduler_schedule_attempts_total` | Total scheduling attempts | Recommended |
| Scheduler | `scheduler_schedule_attempts_SCHEDULED` | Successful schedules | Critical |
| Scheduler | `scheduler_schedule_attempts_UNSCHEDULABLE` | Unschedulable count | Recommended |

#### Prometheus Scraping Endpoints (K8s 1.28+)

```bash
# API Server metrics (existing)
kubectl get --raw=/metrics

# Kube-Controller-Manager metrics
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics

# Kube-Scheduler metrics
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/ksh/container/metrics

# etcd metrics (support varies by cluster version)
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/etcd/container/metrics
```

> **Note:** Using Amazon Managed Prometheus (AMP) Agentless Collector (Poseidon) enables automatic collection of Control Plane metrics to AMP workspace without installing Prometheus in-cluster.

### 3.7 Load Testing Checklist (10 Items)

| # | Verification Item | Metric/Method | CW Free |
|---|------------------|---------------|:-------:|
| 1 | Are API requests rejected with 429? | `apiserver_request_total_429` (CW) or `apiserver_flowcontrol_rejected_requests_total` (Prometheus) | O |
| 2 | Is API P99 latency within 1 second? | `apiserver_request_duration_seconds_*_P99` (CW) or `apiserver_request_sli_duration_seconds` (Prometheus) | O |
| 3 | Is etcd the bottleneck? | Compare `etcd_request_duration_seconds` vs `apiserver_request_duration_seconds` | X (Prometheus needed) |
| 4 | Is APF queue full? | `apiserver_flowcontrol_current_inqueue_requests` | X (Prometheus needed) |
| 5 | Which APF priority group is saturated? | Compare `apiserver_flowcontrol_nominal_limit_seats` vs actual usage | X (Prometheus needed) |
| 6 | Is pod scheduling delayed? | `scheduler_pending_pods` (CW), `scheduler_pod_scheduling_sli_duration_seconds` (Prometheus) | Partial |
| 7 | Is etcd DB size approaching limit? (Standard 8GB, XL+ 16GB) | `apiserver_storage_size_bytes` | O |
| 8 | Is there asymmetric traffic? | Individual API server inflight request count (**check max, not avg**) | O |
| 9 | Is a specific client making excessive LISTs? | Analyze LIST frequency/latency by userAgent in Audit logs | CW Logs |
| 10 | Are KCM controller queues backing up? | `workqueue_depth` | X (Prometheus needed) |

> **Recommendation:** During load testing, **strongly recommend deploying at minimum Prometheus to collect detailed APF metrics and etcd metrics**.

### 3.8 Useful PromQL Queries

```promql
# API request latency heatmap (most important)
max(increase(apiserver_request_duration_seconds_bucket{
  subresource!="status",subresource!="token",subresource!="scale",
  subresource!="/healthz",subresource!="binding",subresource!="proxy",
  verb!="WATCH"
}[$__rate_interval])) by (le)

# APF seat utilization (PCP tier monitoring)
max without(instance)(apiserver_flowcontrol_nominal_limit_seats{})

# 429 error rate
sum(rate(apiserver_request_total{code="429"}[5m]))
/ sum(rate(apiserver_request_total[5m]))

# 5xx error rate
sum(rate(apiserver_request_total{code=~"5.."}[5m]))
/ sum(rate(apiserver_request_total[5m]))
```

### 3.9 Useful CloudWatch Logs Insights Queries

```sql
-- Find slowest API calls
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter ispresent(requestURI)
| filter verb = "list"
| parse requestReceivedTimestamp /\d+-\d+-(?<StartDay>\d+)T(?<StartHour>\d+):(?<StartMinute>\d+):(?<StartSec>\d+).(?<StartMsec>\d+)Z/
| parse stageTimestamp /\d+-\d+-(?<EndDay>\d+)T(?<EndHour>\d+):(?<EndMinute>\d+):(?<EndSec>\d+).(?<EndMsec>\d+)Z/
| fields (StartHour*3600+StartMinute*60+StartSec+StartMsec/1000000) as StartTime,
         (EndHour*3600+EndMinute*60+EndSec+EndMsec/1000000) as EndTime,
         (EndTime-StartTime) as DeltaTime
| stats avg(DeltaTime) as AvgLatency, count(*) as Count by requestURI, userAgent
| filter Count >= 50
| sort AvgLatency desc

-- Analyze CRD API call patterns
fields @timestamp, userAgent, verb, requestURI
| filter requestURI like /customresourcedefinitions/
| stats count(*) by verb, userAgent
| sort count(*) desc
| limit 20

-- API QPS from KCM by controller
fields @timestamp, userAgent, @message
| filter @logStream like "kube-apiserver-audit"
| filter user.username like "system:serviceaccount:kube-system:"
| filter verb not like "WATCH"
| stats count(*) as calls by user.username, bin(1m)
| sort calls desc
```

### 3.10 API vs etcd Bottleneck Identification

```
API latency high?
│
├─ etcd_request_duration_seconds also high?
│   └─ YES → etcd is bottleneck (etcd overload, disk I/O, etc.)
│
├─ etcd normal but API slow?
│   ├─ Webhook latency high? → Admission Webhook is bottleneck
│   ├─ APF queue wait high? → API Server concurrency insufficient → Consider tier upgrade
│   └─ Only LIST requests slow? → Optimize large LISTs (server-side filtering, pagination)
│
└─ Both normal but 429 occurring?
    └─ Review APF configuration (specific priority group saturation)
```

### 3.11 PCP Tier Upgrade Decision Criteria Summary

| Current Tier | Key Monitoring Metrics | Upgrade Condition | Action |
|-------------|------------------------|-------------------|--------|
| Standard | `apiserver_request_total_429` | > 0 sustained | Consider XL+ upgrade |
| XL | `apiserver_flowcontrol_current_executing_seats` | > 80% of limit (~1,360) | Consider 2XL upgrade |
| 2XL | `apiserver_flowcontrol_current_executing_seats` | > 80% of limit (~2,720) | Consider 4XL upgrade |
| XL+ | `apiserver_storage_size_bytes` | > 12.8GB (16GB limit) | Storage optimization needed |
| All tiers | `scheduler_schedule_attempts_UNSCHEDULABLE` | > 0 sustained | Check node resource shortage |

---

## Related Resources

### AWS Official Documentation
- [EKS Provisioned Control Plane](https://docs.aws.amazon.com/eks/latest/userguide/eks-provisioned-control-plane.html)
- [Control Plane Monitoring Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/control_plane_monitoring.html)
- [Kubernetes Control Plane Scaling](https://docs.aws.amazon.com/eks/latest/best-practices/scale-control-plane.html)
- [Monitor cluster data with Amazon CloudWatch](https://docs.aws.amazon.com/eks/latest/userguide/cloudwatch.html)
- [Fetch control plane raw metrics in Prometheus format](https://docs.aws.amazon.com/eks/latest/userguide/view-raw-metrics.html)

### AWS Blogs
- [Amazon EKS introduces Provisioned Control Plane](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/)
- [Amazon EKS enhances Kubernetes control plane observability](https://aws.amazon.com/blogs/containers/amazon-eks-enhances-kubernetes-control-plane-observability/)

### Kubernetes Upstream
- [API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [Kubernetes SLOs](https://github.com/kubernetes/community/blob/master/sig-scalability/slos/slos.md)
- [ClusterLoader2](https://github.com/kubernetes/perf-tests/tree/master/clusterloader2)
