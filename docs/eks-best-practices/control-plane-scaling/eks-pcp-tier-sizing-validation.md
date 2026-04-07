---
title: "EKS PCP 티어 사이징 & 성능 검증 가이드"
sidebar_label: "PCP Tier Sizing"
description: "PCP 티어별 상세 파라미터, APF seat 산정 공식, 대규모 클러스터 사이징 예시, ClusterLoader2 성능 검증 방법론, 고객 사례"
tags: [eks, pcp, sizing, performance, apf, clusterloader2, etcd]
sidebar_position: 2
last_update:
  date: 2026-04-07
  author: devfloor9
---


> **목적**: 이 가이드는 EKS Provisioned Control Plane (PCP) 티어별 상세 사양, 컨트롤 플레인 아키텍처 개선 효과, 성능 검증 방법론을 제공합니다.

:::tip 관련 문서
Control Plane 아키텍처 개요, CRD 영향 분석, 모니터링 설정, CRD 설계 베스트 프랙티스는 **[EKS Control Plane & CRD at Scale 종합 가이드](./eks-control-plane-crd-scaling)**를 참조하세요.
:::

---

## 이 문서에서 다루는 내용

대규모 Kubernetes 워크로드를 Amazon EKS에서 운영하는 조직은 핵심 질문에 직면합니다: 오버 프로비저닝 없이 컨트롤 플레인이 피크 부하를 처리할 수 있도록 어떻게 보장하는가? 이 기술 심화 가이드는 세 가지 핵심 영역을 다룹니다:

1. **PCP 티어 스팩 및 Practical 오브젝트 한도** — API request concurrency (seats), pod scheduling rates, and etcd database sizing with real-world examples
2. **EKS 컨트롤 플레인 아키텍처 개선** — AWS 엔지니어링 개선이 deliver consistent performance and higher availability
3. **성능 검증 방법론** — ClusterLoader2를 활용한 and comprehensive metrics to verify control plane capacity

10,000노드 클러스터를 계획하거나 API throttling을 트러블슈팅하는 경우, 이 가이드는 EKS 컨트롤 플레인을 적정 규모로 설정하기 위한 기술적 세부사항과 측정 전략을 제공합니다.

---

## 1. PCP 티어 스팩 기준 및 Practical 오브젝트 수량

> **핵심 요약:** API Request Concurrency (Seats) represents "concurrent seat capacity," not "concurrent request count." A single LIST request can consume up to 10 seats depending on the number of objects returned. Customer-facing concurrency numbers (e.g., 4XL = 6,800 seats) apply cluster-wide. For a 10,000-node / 1,000,000-pod environment, you need ~8.2 GB etcd DB capacity at peak, ~1,155 seats, and ~370 pods/sec for AZ failure recovery — making **4XL the recommended tier**. Kubernetes upstream officially supports up to 5,000 nodes / 150,000 pods, though AWS has benchmarked both 5K and 10K node configurations. **Measure actual APF seat usage** via `apiserver_flowcontrol_current_executing_seats` in CloudWatch (free) over a 1-week period to determine the appropriate tier.

### 1.1 대형 고객 단일 클러스터 규모 벤치마크

다음 참고 데이터는 공개 문서 및 대형 단일 클러스터 배포에 대한 AWS 벤치마크를 기반으로 합니다.

#### Kubernetes Upstream 및 EKS 공식 테스트 한도

| 벤치마크 | 노드 | 총 Pod 수 | 총 K8s 오브젝트 | 비고 |
|-----------|------:|----------:|-----------------:|-------|
| **K8s SIG-Scalability Official Limit** | 5,000 | 150,000 | ~300,000 | Upstream SLI/SLO 보장 범위 |
| **EKS 5K Node Benchmark** | 5,000 | ~150,000 | ~300,000 | AWS 검증 완료 |
| **EKS 10K Node Benchmark** | 10,000 | ~500,000+ | ~760,000 | PCP 4XL, API P99 < 1s achieved |

> **참고:** While Kubernetes upstream's official SLI/SLO guarantee covers 5,000 nodes / 150,000 pods, this represents a **conservative baseline applicable to all Kubernetes distributions**. EKS PCP is designed to support beyond this threshold into 10K+ node environments.

#### 확인된 고객 사례

| 사례 | 오브젝트 수 | 티어 | 결과 |
|------|-------------|------|--------|
| **Company S** (Cloud/SaaS, cert-manager) | ~200K CRDs + ~400K related = ~600K | PCP recommended | 안정 운영 |
| **Company C** (Networking/Security, accessrulegroups) | ~12,500 CRDs (~300 KB each) | - | LIST 타임아웃 이슈 |
| **Kyverno admissionreports leak** (open-source controller) | 1,565,106 CRDs | Standard | etcd DB 8GB 초과 → 장애 |

#### 클러스터 규모에 대한 중요 참고사항

일부 대형 고객은 "단일 클러스터에서 수만 개의 노드를 운영"한다고 주장합니다. 그러나 **실제 컨트롤 플레인 부하는 노드/Pod 수만으로 결정되지 않습니다**. Two 10,000-node clusters can require completely different PCP tiers depending on workload patterns.

**정확한 티어 사이징은 주장된 규모가 아닌 실제 APF seat 사용량 측정이 필요합니다.** Refer to section 1.9 "APF Seat Usage Monitoring Guide" to measure your cluster's actual concurrency consumption.

> **참고:** Most large customers operate **multiple clusters** segmented by workload, region, and environment, rather than scaling a single cluster indefinitely.

> **참고:** AWS has benchmarked PCP performance in both 5K and 10K node environments.

#### 단일 클러스터 스케일링의 주요 병목

| 규모 | 주요 병목 | 설명 |
|-------|-------------------|-------------|
| **~1,000 nodes** | 일반적으로 없음 | 대부분의 워크로드에 Standard 티어 충분 |
| **~3,000 nodes** | etcd DB size, API Concurrency | CRD가 많으면 XL+ 필요 |
| **~5,000 nodes** | Scheduler throughput, LIST latency | K8s upstream 공식 한도에 근접, 2XL+ recommended |
| **~10,000 nodes** | 모든 컴포넌트 포화 가능 | 4XL required, consider AZ failure recovery time |
| **~15,000+ nodes** | etcd 16GB limit, API Server horizontal scaling limits | 8XL or 클러스터 분리 검토 |

### 1.2 티어별 공식 사양

Amazon EKS Provisioned Control Plane은 고객이 직접 컨트롤 플레인 스케일링 티어를 선택하여 **용량을 사전 프로비저닝**할 수 있게 합니다. While Standard mode auto-scales based on workload, PCP guarantees the minimum performance floor of the selected tier.

| 티어 | API Request Concurrency (seats) | Pod Scheduling Rate (pods/sec) | Cluster DB Size | SLA | 가격 ($/hr) |
|------|-------------------------------:|-------------------------------:|----------------:|----:|-------------:|
| **Standard** | Auto-scaling | Auto-scaling | 8 GB | 99.95% | $0.10 |
| **XL** | 1,700 | 167 | 16 GB | 99.99% | $1.65 |
| **2XL** | 3,400 | 283 | 16 GB | 99.99% | $3.40 |
| **4XL** | 6,800 | 400 | 16 GB | 99.99% | $6.90 |
| **8XL** | 13,600 | 400 | 16 GB | 99.99% | $14.00 |

> **참고:** Standard tier auto-scales based on workload. XL+ tiers guarantee the minimum performance floor for that tier, with auto-scaling available beyond the baseline as needed. For current pricing, see the [AWS EKS pricing page](https://aws.amazon.com/eks/pricing/).

### 1.3 티어별 K8s 컨트롤 플레인 파라미터 상세

티어 간 성능 차이는 kube-apiserver, kube-scheduler, kube-controller-manager의 핵심 파라미터에 의해 결정됩니다.

| 파라미터 | XL | 2XL | 4XL | 8XL |
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

> **참고:** Standard tier automatically adjusts control plane parameters based on workload.

### 1.4 각 메트릭의 실제 의미

#### API Request Concurrency (Seats)

"API Request Concurrency = 1,700 seats"는 시스템이 1,700개의 동시 단순 요청을 처리할 수 있다는 의미가 **아닙니다**.

- **Seat** is the concurrency unit in APF (API Priority and Fairness). `max-requests-inflight` + `max-mutating-requests-inflight` sum to the API Server's **Total Concurrency Limit**, which is proportionally distributed across PriorityLevelConfigurations.
- **Simple requests** (GET/POST/PUT/DELETE): 1 seat consumed
- **Large LIST requests**: Consume **multiple seats** proportional to the number of objects returned (up to 10 seats via Work Estimator)
- **WATCH requests**: Consume 1 seat during initial notification burst, then released
- **WRITE requests**: Continue occupying additional seat time for WATCH notification processing even after write completion

> **참고:** AWS official spec API Request Concurrency is cluster-wide. EKS control planes run multiple API Servers for high availability, and the sum of APF seats across all servers equals the cluster-wide Concurrency.

**한도 초과 시 동작:**
1. 총 동시성 한도 초과 → 요청이 **APF 큐에서 대기**
2. 큐 가득 참 → **HTTP 429 (Too Many Requests)**로 거부
3. 모니터링: `apiserver_flowcontrol_rejected_requests_total` metric

#### 1,700 Seat이 작아 보이지 않는 이유

Seat은 단순 연결 수가 아닌 **가중 동시성(weighted concurrency)**입니다. 핵심 요소는 **점유 시간(occupation duration)** — seats are returned immediately when a request completes.

| 요청 타입 | Seat 비용 | 일반적 점유 시간 | Seat당 초당 처리량 |
|-------------|:---------:|:----------------:|:-----------------------------:|
| Simple GET | 1 | ~5ms | ~200 req/s |
| LIST (< 500 objects) | 1 | ~100ms | ~10 req/s |
| LIST (5,000 objects) | 10 | ~3s | ~0.3 req/s |
| CREATE/UPDATE | 1 | ~60ms (write + WATCH propagation) | ~16 req/s |

**스트리밍 비유**: Seat을 연결 수가 아닌 **대역폭**으로 생각하세요. A 4K stream consumes 25 Mbps while SD uses 3 Mbps — "1 Gbps bandwidth" doesn't mean 1,000 concurrent users if they're all streaming 4K. Similarly, `kubectl get pods -A` (LIST all) is "4K streaming" (10 seats), while `kubectl get pod my-pod` is "SD streaming" (1 seat).

**실제 프로덕션 예시 (~200 nodes, XL tier = 1,700 seats)**:

```
상시 부하:
  kubelet heartbeats (200 nodes × 10s interval)     → ~20 seats
  20 controllers in reconcile loops                   → ~50 seats
  Prometheus scraping                                 → ~5 seats
  General kubectl usage                               → ~10 seats
  ─────────────────────────────────────────────────────────────
  Total: ~85 seats (5% of 1,700)

피크 버스트 시나리오 (동시 발생):
  500 Deployment rollouts                             → +500 seats
  Monitoring dashboards running large LISTs           → +30 seats
  HPA simultaneous scaling                            → +100 seats
  AZ failure → pod rescheduling burst                 → +300 seats
  ─────────────────────────────────────────────────────────────
  Total: ~1,015 seats (60% of 1,700)
```

**티어 선택은 상시 부하가 아닌 피크 버스트에 의해 결정됩니다.** 1,700 seats (XL) becomes insufficient when:
- **500+ nodes** with AZ failure triggering 1/3 pod rescheduling
- **10+ large CRD controllers** reconciling simultaneously
- **CI/CD pipelines** deploying hundreds of Deployments at once

이런 경우 2XL (3,400 seats) 또는 4XL (6,800 seats)로 업그레이드가 필요합니다.

#### Pod Scheduling Rate (pods/sec)

- **Scheduler가 초당 바인딩할 수 있는 Pod 수**를 나타냅니다.
- Determined by `kube-api-qps` and `kube-api-burst` parameters that control how fast the Scheduler can make API Server requests.
- At 4XL+, Scheduler QPS plateaus at 400, but bottlenecks are mitigated by increased API Server count (3+).
- Actual throughput can be verified via `scheduler_schedule_attempts_total` metric.

#### Cluster DB Size (etcd)

- etcd에 저장 가능한 **논리적 데이터 크기**의 상한입니다.
- Standard: 8 GB
- XL+: 16 GB
- etcd의 MVCC 특성으로 인해 **빈번한 업데이트는 리비전 누적을 유발하여 실제 DB 크기가 데이터 크기의 2~5배**가 됩니다.
- Compaction이 5분마다 실행되어 오래된 리비전을 삭제하지만, 극도로 높은 업데이트 빈도에서는 compaction 사이클 사이에 DB가 가득 찰 수 있습니다.
- **quota 초과 시 모든 쓰기가 거부됨** → 클러스터 사실상 다운

### 1.5 API Request Concurrency vs Inflight Seats — 개념 심화 및 예시

#### 용어 정리: 두 가지 다른 레이어

"API Request Concurrency"와 "Inflight Seats"는 종종 혼용되지만, **다른 레이어**를 나타냅니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                   AWS Official Spec                              │
│         "API Request Concurrency = 6,800 seats" (4XL)            │
│                                                                   │
│   = Total "seat capacity" for concurrent requests cluster-wide   │
│   = 개별 API Server APF seats sum × API Server count       │
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

| 개념 | 범위 | 설명 |
|---------|-------|-------------|
| **max-requests-inflight** | 개별 API Server | 최대 동시 비변경(읽기 전용) 요청 수 |
| **max-mutating-requests-inflight** | 개별 API Server | 최대 동시 변경 요청 수 |
| **Individual Server APF Total Seats** | 개별 API Server | 위 두 값의 합. APF PriorityLevel에 비례 배분 |
| **API Request Concurrency** | Cluster-wide | 개별 Server APF Seats × API Server 수. **AWS 공식 스팩에 게시된 값** |

#### 핵심 차이: "동시 요청 수" vs "동시 Seat 수"

**Seat (용량)**은 1 요청 = 1 seat이 아닙니다. 요청 타입에 따라 소비되는 seat이 다릅니다:

| 요청 타입 | Seat 소비 | 점유 시간 | 설명 |
|-------------|:----------------:|---------------------|-------------|
| **Simple GET** (e.g., `kubectl get pod my-pod`) | **1** | 응답 완료까지 | 단일 오브젝트 조회 |
| **Simple CREATE/UPDATE/DELETE** | **1** | 쓰기 완료 + WATCH 알림 전파 시간 | 쓰기 요청은 쓰기 후 추가 시간 점유 |
| **Small LIST** (< 500 objects returned) | **1** | 응답 완료까지 | Work Estimator가 1 seat으로 계산 |
| **Large LIST** (1,000 objects returned) | **~2** | 응답 완료까지 | 오브젝트 수에 비례하여 증가 |
| **Large LIST** (5,000 objects returned) | **~10** | 응답 완료까지 | Work Estimator 최대값 |
| **WATCH** | **1 initially** → **0** | 초기 burst 후 해제 | 장기 연결이지만 seat 해제됨 |

#### 구체적 시나리오 예시 (4XL 클러스터)

**시나리오**: 4XL 클러스터 (총 6,800 seats)에서 다음 요청이 동시에 발생

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

#### APF PriorityLevel 분배 예시 (4XL Basis)

Cluster-wide APF Seats are proportionally distributed to PriorityLevelConfigurations on each API Server. Below is an individual API Server example:

```
개별 API Server APF Seat Distribution Example
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

#### Step 1: etcd DB 크기 산정

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

#### PCP 티어 산정 공식 요약

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

| 사례 | 오브젝트 수 | 티어 | 결과 |
|------|-------------|------|--------|
| **AWS PCP Official Benchmark** | ~760,000 K8s objects | 4XL | API P99 < 1s, Scheduler ~350 pods/sec maintained |
| **Company S** (Cloud/SaaS, cert-manager) | ~200K CRDs + ~400K related = ~600K | PCP recommended | 안정 운영 |
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

### 1.8 티어 선택 의사결정 트리

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
    └─ 8XL (13,600 seats) or 클러스터 분리 검토
    
⚠️ Important: Maintain minimum 20% safety margin.
   When peak reaches 80% of limit, evaluate higher tier.
   Reason: Need buffer for unexpected bursts (mass retry after
   deploy failure, runaway controller infinite LIST, etc.).
```

#### 고객 측정 요청 템플릿

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

## 2. EKS 컨트롤 플레인 아키텍처 개선 효과

> **핵심 요약:** EKS has continuously improved etcd architecture to achieve **consistent latency, enhanced availability, etcd DB 16GB expansion (XL+), Event Sharding, and API Server horizontal scaling**. Monitor etcd DB size using the `apiserver_storage_size_bytes` metric.

### 2.1 개요

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

### 2.3 XL 이상 티어에서만 사용 가능한 기능

| Feature | Standard | XL+ |
|---------|:--------:|:---:|
| API Server Horizontal Scaling | Basic configuration | Scalable |
| etcd DB Size | 8 GB | 16 GB |
| etcd Event Sharding | Not supported | Supported (events in separate partition) |
| SLA | 99.95% | 99.99% |

---

## 3. EKS 컨트롤 플레인 성능 검증 방법론

> **핵심 요약:** **ClusterLoader2 (CL2)** is the standard load testing tool used by both AWS and the Kubernetes community, including in AWS PCP official benchmarks. Testing follows a **5-phase strategy** (Baseline → Ramp-up → Sustained Peak → Burst → Recovery), but requires at minimum **deploying Prometheus to collect detailed APF metrics and etcd metrics** for accurate bottleneck analysis. **Success criteria** follows official Kubernetes SLI/SLO: API Mutating P99 ≤ 1s, Cluster LIST P99 ≤ 30s, Pod Scheduling P99 ≤ 5s. **CloudWatch free metrics cover**: 429 errors, API P99 latency, etcd DB size, APF seat usage, scheduling attempts. **Prometheus required for**: etcd latency, APF queue depth, KCM workqueue depth, per-PriorityLevel saturation analysis.

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

### 3.2 테스트 시나리오 유형

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

### 3.4 간단한 스크립트 기반 테스트 (Without CL2)

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

### 3.6 주요 모니터링 메트릭 — 수집 경로별 가용성 by Collection Path

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

> **참고:** Using Amazon Managed Prometheus (AMP) Agentless Collector (Poseidon) enables automatic collection of Control Plane metrics to AMP workspace without installing Prometheus in-cluster.

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

### 3.8 유용한 PromQL 쿼리

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

### 3.9 유용한 CloudWatch Logs Insights 쿼리

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

### 3.11 PCP 티어별 업그레이드 판단 기준 요약

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
