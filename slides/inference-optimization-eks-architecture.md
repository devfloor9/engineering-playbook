# Inference & 모델 성능 최적화를 위한 EKS 아키텍처

---

## 발표 개요

**발표자**: YoungJoon Jeong, Sr. Specialist Solutions Architect, Containers — AWS

**핵심 메시지**: EKS 위에서 LLM Inference 성능을 극대화하는 실전 아키텍처 패턴

**기반 경험**: 통신사 Agentic AI 플랫폼 구축 + GLM-5(744B) / Kimi K2.5(1T) 대형 MoE 모델 배포

---

## 왜 Inference 최적화인가?

- 프로덕션 LLM 서비스에서 **Inference 비용 = 전체 AI 운영 비용의 80-90%** (a16z, NVIDIA GTC, SemiAnalysis)
- GPU 시간이 곧 돈: **p5.48xlarge(H100×8) = $98/hr On-Demand**
- 월 2대 운영 시 약 **$141,580/월**
- Spot 활용 시 **$13-15/hr** (85% 절감 가능)

> 핵심: 같은 GPU에서 더 많은 요청을 처리하고, 필요 없을 때 GPU를 반납하는 것

---

## 핵심 성능 지표 (KPI)

| 지표 | 설명 | 목표 |
|------|------|------|
| **TTFT** | 첫 토큰 생성까지의 시간 | < 2초 (대화형) |
| **TPS** | 초당 토큰 생성 속도 | 모델별 상이 |
| **GPU Utilization** | GPU 연산 활용률 | > 70% |
| **KV Cache Hit Rate** | KV 캐시 재사용 비율 | > 60% |
| **P99 Latency** | 99 퍼센타일 응답 시간 | SLO 기준 |

---

## Agenda

1. EKS GPU 인프라 전략
2. vLLM 모델 서빙 엔진
3. KV Cache-Aware Routing
4. Disaggregated Serving
5. LWS 멀티노드 대형 모델
6. GPU 리소스 관리 & 오토스케일링
7. Bifrost → Bedrock Fallback
8. Hybrid Node 온프레미스 통합
9. 이미지/모델 다운로드 대응
10. 실전 교훈 & 권장 아키텍처

---

## 1. EKS GPU 인프라 전략

---

### 3가지 배포 모델 비교

| 기준 | EKS Auto Mode | Karpenter + GPU Operator | MNG + Cluster Autoscaler |
|------|:---:|:---:|:---:|
| GPU 드라이버 관리 | AWS 자동 | AMI 사전 설치 | AMI 사전 설치 |
| MIG / Time-Slicing | ❌ | ✅ | ✅ |
| DRA 호환 | ❌ | ❌ | ✅ 유일한 선택지 |
| DCGM 모니터링 | GPU Operator 설치 시 | 완전 지원 | 완전 지원 |
| 운영 복잡도 | 낮음 | 중간 | 중간 |
| 적합 모델 크기 | 70B+ | 7B~700B+ | DRA 필요 시 |

---

### 선택 가이드

- **빠른 시작 / PoC** → Auto Mode
  - GPU 드라이버, Device Plugin 자동 관리
- **프로덕션 (세밀 GPU 제어)** → Karpenter + GPU Operator
  - MIG, Custom AMI, Spot 완전 지원
- **DRA 필요 시** → MNG + Cluster Autoscaler
  - Karpenter/Auto Mode에서 DRA Pod를 skip하는 아키텍처적 한계

---

### GPU 인스턴스 선택

| 인스턴스 | GPU | GPU VRAM | 적합 모델 | 비용/hr |
|---------|-----|---------|----------|--------|
| g5.xlarge~48xlarge | A10G | 24~192GB | ≤7B | $1~$16 |
| g6e.xlarge~48xlarge | L40S | 48~384GB | 13B~70B | 비용 효율 |
| p4d.24xlarge | A100 40GB × 8 | 320GB | 13B~70B | $32.77 |
| **p5.48xlarge** | **H100 80GB × 8** | **640GB** | **70B~700B+** | **$98.32** |
| p5e.48xlarge | H200 141GB × 8 | 1,128GB | 100B+ | 최대 메모리 |

---

### Auto Mode + GPU Operator 하이브리드

Auto Mode에서도 GPU Operator 설치 가능!

- Device Plugin만 노드 레이블로 비활성화
- DCGM Exporter, NFD, GFD 정상 동작
- KAI Scheduler 등 ClusterPolicy 의존 프로젝트 사용 가능

```bash
helm install gpu-operator nvidia/gpu-operator \
  --set driver.enabled=false \
  --set toolkit.enabled=false
# NodePool 레이블: nvidia.com/gpu.deploy.device-plugin: "false"
```

> ⚠️ `devicePlugin.enabled=true`로 설치하면 Auto Mode 내장 Device Plugin과 충돌 → `allocatable=0`

---

## 2. vLLM 모델 서빙 엔진

---

### vLLM 핵심 기술

| 기술 | 성능 영향 |
|------|---------|
| **PagedAttention** | KV Cache 메모리 **60-80% 절감** |
| **Continuous Batching** | 처리량 **2-24x 향상** |
| **FP8 KV Cache** | 메모리 **2배 절감** |
| **Prefix Caching** | 반복 프롬프트 **400%+ 향상** |
| **Speculative Decoding** | 속도 **2-3x 향상** |
| **Chunked Prefill** | TTFT/처리량 균형 개선 |

> 현재 버전: vLLM v0.6.3 / v0.7.x

---

### GPU 메모리 계산

```
필요 GPU 메모리 = 모델 가중치 + 활성화 + KV 캐시 × 배치 크기
```

| 정밀도 | 바이트/파라미터 | 70B 모델 | 32B 모델 |
|--------|-------------|---------|---------|
| BF16/FP16 | 2 | 140GB | 64GB |
| INT8 | 1 | 70GB | 32GB |
| FP8 | 1 | 70GB | 32GB |
| INT4 | 0.5 | 35GB | 16GB |

> 70B BF16 = 140GB → 단일 GPU 불가 → TP=4 (4× H100 80GB)

---

### 병렬화 전략 선택

| 전략 | 적용 시점 | 예시 |
|------|---------|------|
| **없음** | 단일 GPU 적재 가능 | Qwen3-32B FP8 (65GB) |
| **텐서 병렬 (TP)** | 단일 노드, 멀티 GPU | Llama-70B BF16 → TP=4 |
| **TP + 파이프라인 병렬 (PP)** | 멀티노드 | GLM-5 744B → PP=2, TP=8 |
| **전문가 병렬 (EP)** | MoE 모델 | Kimi K2.5 1T MoE → TP=8 |

---

### 모델별 GPU 구성 예시

| 모델 | 파라미터 | 정밀도 | GPU 구성 |
|------|---------|--------|---------|
| Qwen3-32B | 32B | FP8 | 1× H100 |
| Llama-3.3-70B | 70B | BF16 | 4× H100 (TP=4) |
| Kimi K2.5 | 1T MoE (32B active) | INT4 | 8× H100 (TP=8) |
| GLM-5 | 744B MoE (40B active) | FP8 | 16× H100 (PP=2, TP=8) |

---

### 핵심 성능 파라미터

```bash
vllm serve Qwen/Qwen3-32B-FP8 \
  --gpu-memory-utilization=0.95 \   # VRAM 비율 (기본 0.9)
  --max-model-len=32768 \           # 최대 시퀀스 길이
  --enable-prefix-caching \         # 프리픽스 KV 캐시 재사용
  --kv-cache-dtype=fp8 \            # FP8 KV 캐시
  --enable-auto-tool-choice         # Tool calling 지원
```

---

### 양자화 전략

| 양자화 | 메모리 절감 | 품질 손실 | 권장 시나리오 |
|--------|----------|---------|------------|
| **FP8** | 50% | 최소 | 프로덕션 기본 |
| **AWQ** | 75% | 낮음 | 비용 최적화 |
| **GPTQ** | 75% | 낮음 | 오프라인 양자화 |
| **GGUF** | 50-75% | 낮음~중간 | 다양한 정밀도 |

> FP8이 품질-효율성 최적 균형점

---

## 3. KV Cache-Aware Routing

---

### 문제: Round-Robin의 한계

기존 vLLM 배포 = 단순 Round-Robin 로드 밸런싱

- 동일 시스템 프롬프트 → 매번 다른 Pod로 분산
- 각 Pod에서 동일한 프리필 연산 반복 수행
- **GPU 연산 낭비 + TTFT 증가**

---

### 해결: KV Cache 상태 인식 라우팅

```
Client → Inference Gateway → Prefix Hash → Cache 조회
  ├─ Cache Hit → 해당 Pod 직접 라우팅 (TTFT ↓↓)
  └─ Cache Miss → LB 폴백 (일반 응답)
```

**효과:**

| 시나리오 | TTFT 개선 | GPU 절감 | 처리량 |
|---------|----------|---------|--------|
| 동일 시스템 프롬프트 | 50-80% ↓ | 프리필 스킵 | 400%+ |
| RAG 반복 컨텍스트 | 30-60% ↓ | 부분 재사용 | 200%+ |
| 완전 랜덤 요청 | 변화 없음 | 없음 | LB 폴백 |

---

### llm-d vs NVIDIA Dynamo

| 항목 | llm-d v0.5+ | NVIDIA Dynamo v1.0 |
|------|------------|-------------------|
| 주도 | Red Hat (Apache 2.0) | NVIDIA (Apache 2.0) |
| KV Cache 인덱싱 | Prefix-aware | Flash Indexer (radix tree) |
| KV Cache 전송 | NIXL | NIXL (NVLink/RDMA) |
| 라우팅 | Gateway API + Envoy | Dynamo Router + EPP |
| 오토스케일링 | HPA/KEDA | Planner (SLO 기반) |
| KV Cache 계층화 | 메모리만 | GPU→CPU→SSD 3-tier |
| 복잡도 | 낮음 | 높음 |
| 벤치마크 | 경량, K8s 네이티브 | **7x 성능** |

---

### 선택 기준

- **소규모~중규모 (GPU ≤16)** → llm-d
  - 빠른 도입, K8s Gateway API 네이티브
- **대규모 (GPU 16+)** → Dynamo
  - Flash Indexer, SLO 기반 오토스케일링
- **긴 컨텍스트 (128K+)** → Dynamo
  - 3-tier KV Cache (GPU→CPU→SSD)

> 점진적 전환: llm-d로 시작 → 규모 확장 시 Dynamo (둘 다 NIXL 사용)

---

## 4. Disaggregated Serving

---

### Prefill vs Decode: 근본적으로 다른 연산

| 단계 | 특성 | 병목 | GPU 요구 |
|------|------|------|---------|
| **Prefill** | 입력 프롬프트 전체 처리 | **Compute-bound** | 높은 연산 (TP=4) |
| **Decode** | 토큰 하나씩 순차 생성 | **Memory-bound** | 높은 메모리 대역폭 (TP=2) |

동일 Pod에서 처리 시 → Prefill이 Decode latency 악화

**분리하면** → 각 단계 독립 스케일링, GPU 활용률 극대화

---

### 분리 아키텍처

```
Client → Gateway
  ├─ Prefill Workers (TP=4, GPU×4) — compute-heavy
  │    └─ NIXL KV 전송 ──→
  └─ Decode Workers (TP=2, GPU×2) — memory-heavy
```

- Prefill: p5 1대에 Pod 2개 (각 GPU 4개)
- Decode: p5 1대에 Pod 4개 (각 GPU 2개)
- **NIXL**: llm-d, Dynamo 등 공통 KV Cache 전송 엔진 (NVLink/RDMA)

> Auto Mode: 인스턴스(노드) 단위 역할 분리 (NodePool + Taint)

---

## 5. LWS 멀티노드 대형 모델

---

### LeaderWorkerSet (LWS)

700B+ 대형 MoE → 단일 노드(8 GPU)에 적재 불가 → **멀티노드 필수**

**LWS** = K8s 네이티브 멀티노드 워크로드 패턴

```
LWS (replicas=1, size=2)
  Leader Pod (p5.48xlarge, H100×8, TP=8)
    ──NCCL/EFA──→
  Worker Pod (p5.48xlarge, H100×8, TP=8)
```

> Ray 없이 Pipeline Parallelism 구현

---

### LWS vs Ray

| 항목 | LWS + vLLM | Ray + vLLM |
|------|-----------|-----------|
| 의존성 | LWS CRD만 설치 | Ray Cluster (head + worker) |
| 복잡도 | **낮음** | 높음 |
| Pod 관리 | K8s StatefulSet 기반 | Ray 자체 스케줄러 |
| 장애 복구 | RecreateGroupOnPodRestart | Ray 재연결 |
| EKS Auto Mode | ✅ | ✅ |

---

### GLM-5 744B 배포 (PP=2, TP=8)

```yaml
apiVersion: leaderworkerset.x-k8s.io/v1
kind: LeaderWorkerSet
metadata:
  name: vllm-glm5-fp8
spec:
  replicas: 1
  leaderWorkerTemplate:
    size: 2  # leader + worker = 16 GPUs
    restartPolicy: RecreateGroupOnPodRestart
    leaderTemplate:
      spec:
        containers:
          - name: vllm
            image: vllm/vllm-openai:v0.18.1
            args:
              - "zai-org/GLM-5-FP8"
              - "--tensor-parallel-size=8"
              - "--pipeline-parallel-size=2"
              - "--gpu-memory-utilization=0.92"
```

---

### NCCL / EFA 최적화

p5.48xlarge = **3,200 Gbps EFA** (Elastic Fabric Adapter)

```yaml
env:
  - name: FI_PROVIDER
    value: "efa"
  - name: FI_EFA_USE_DEVICE_RDMA
    value: "1"
  - name: NCCL_ALGO
    value: "Ring"       # 멀티노드 PP에 적합
  - name: NCCL_PROTO
    value: "Simple"     # EFA에서 안정적
```

> 장애 복구: `RecreateGroupOnPodRestart` → Pod 하나 실패 시 전체 그룹 재생성 (NCCL 동기화 보장)

---

## 6. GPU 리소스 관리

---

### 2-Tier 스케일링 아키텍처

```
메트릭 소스 (DCGM + vLLM Metrics)
  → 1단계: KEDA (Pod 스케일링) — GPU 메트릭 기반
    → 2단계: Karpenter (노드 스케일링) — GPU 부족 시 자동 프로비저닝
```

---

### KEDA 핵심 스케일링 시그널

| 시그널 | 메트릭 | 임계값 |
|--------|--------|-------|
| **KV Cache 포화** | `vllm_gpu_cache_usage_perc` | > 80% |
| **대기 요청** | `vllm_num_requests_waiting` | > 10 |
| **TTFT SLO 위반** | `vllm_time_to_first_token_seconds` P95 | > 2초 |

---

### DRA: 현실과 제약

**Dynamic Resource Allocation** (K8s 1.32+ v1beta1, 1.34+ GA)

- GPU 파티셔닝, 토폴로지 인식 스케줄링 제공
- **그러나 Karpenter/Auto Mode와 호환 불가**
  - 이유: ResourceSlice는 노드 생성 후 발행 (닭과 달걀 문제)
  - DRA Pod는 Karpenter에서 skip됨
- **DRA 사용 시**: MNG + Cluster Autoscaler 필수

---

### 비용 최적화: ~85% 절감 가능

| 전략 | 절감 | 방법 |
|------|------|------|
| **Spot 인스턴스** | 60-90% | p5 Spot $13-15/hr (us-east-2) |
| **Consolidation** | 20-30% | 유휴 노드 30초 후 정리 |
| **Right-sizing** | 15-25% | 모델 크기별 인스턴스 자동 선택 |
| **시간대별 스케줄링** | 30-40% | 비업무 시간 50%+ 축소 |

> 모든 전략 조합 시 **총 ~85% 비용 절감**

---

## 7. Bifrost → Bedrock Fallback

---

### Cascade Routing 아키텍처

Self-hosted 모델 과부하/장애 시 → **Bedrock 자동 폴백**

```
Client → Bifrost Gateway
  ├─ 1차: Self-hosted (EKS vLLM/llm-d) — 최저 비용
  ├─ 2차: Self-hosted 대안 모델
  └─ 3차: Amazon Bedrock (Claude Sonnet) — 폴백
```

**폴백 조건**: HTTP 500/502/503/504, 레이턴시 > 30초, 에러율 > 10%

---

### Bifrost 설정 예시

```yaml
routing:
  strategy: cascade
  cascadeOrder:
    - self-hosted-qwen3       # 1차: EKS (비용 최적)
    - self-hosted-glm5        # 2차: EKS 대안
    - bedrock-claude-sonnet   # 3차: Bedrock (폴백)
  fallbackConditions:
    - statusCode: [500, 502, 503, 504]
    - latencyMs: "> 30000"
    - errorRate: "> 0.1"
```

---

### Cascade의 가치

| 관점 | Self-hosted 단독 | Cascade + Bedrock |
|------|----------------|-------------------|
| 가용성 | GPU 장애 = 서비스 중단 | **Bedrock 폴백 = 무중단** |
| 비용 | 피크 기준 GPU 확보 | 기본만 GPU, 초과분 Bedrock |
| Cold Start | Spot 중단 시 수 분 | **Bedrock 즉시 응답** |
| 용량 계획 | 복잡 | 단순 (Bedrock = 무제한) |

> 피크 20%를 Bedrock으로 오프로드 → GPU 인프라 비용 30-40% 추가 절감

---

## 8. Hybrid Node: 온프레미스 GPU 통합

---

### 개요

**EKS Hybrid Node** = 온프레미스 GPU 서버를 EKS 클러스터에 등록 (2024.11 GA)

```
On-Premises                         AWS Cloud
┌─────────────────┐                ┌──────────────────┐
│ DGX A100 ×8     │──VPN/DX──────│ EKS Control Plane │
│ GPU Server ×4   │               │ Cloud GPU Nodes   │
└─────────────────┘                └──────────────────┘
```

- 이미 보유한 GPU 자산 활용 (Capex 이미 지출)
- AWS 관리 GPU 스택 없음 → **GPU Operator 필수**
- VPN 또는 Direct Connect 필요

---

### 3-Tier Cascade: On-Prem → Cloud → Bedrock

| Tier | 인프라 | 비용 구조 | 역할 |
|------|--------|---------|------|
| **1** | On-Prem (DGX) | 고정 비용 (이미 보유) | 기본 트래픽 (항상 활성) |
| **2** | Cloud GPU (Spot/OD) | 변동 비용 (시간당) | 피크 트래픽 버스트 |
| **3** | Amazon Bedrock | 종량제 (토큰당) | 장애/과부하 폴백 |

> 비용 효율성 + 가용성 동시 극대화

---

### Pod 배치 전략

```yaml
# On-Prem: 기본 추론
nodeSelector:
  node.kubernetes.io/instance-type: hybrid

# Cloud: 버스트 트래픽
nodeSelector:
  karpenter.sh/nodepool: gpu-inference

# Bifrost Cascade가 요청을 자동 라우팅
```

> ⚠️ On-Prem↔Cloud 간 PP는 레이턴시로 비권장, Gateway 레벨 Cascade로 연결

---

## 9. 이미지/모델 다운로드 대응

---

### 문제 유형

| 문제 | 증상 | 대응 |
|------|------|------|
| HF Hub 타임아웃 | CrashLoopBackOff | `HF_HUB_ENABLE_HF_TRANSFER=1` (3-5x 가속) |
| 대형 파일 부분 다운로드 | corruption 에러 | 체크섬 검증 + 재다운로드 |
| 컨테이너 이미지 Pull 느림 | ImagePullBackOff | **SOCI** lazy-loading (70-80% 단축) |
| 멀티노드 동시 다운로드 | 대역폭 경합 | S3 사전 캐싱 + init container |
| EFS 느린 다운로드 | 로딩 30분+ | **NVMe emptyDir** 전환 |

---

### 권장: S3 사전 캐싱 + Init Container

```yaml
initContainers:
  - name: model-downloader
    image: amazon/aws-cli:latest
    command: ["/bin/sh", "-c"]
    args:
      - |
        if [ -f /models/config.json ]; then
          echo "Cached, skip"
          exit 0
        fi
        aws s3 sync s3://model-cache/qwen3-32b-fp8/ /models/
    volumeMounts:
      - name: model-cache
        mountPath: /models  # NVMe emptyDir
```

---

### 다운로드 성능 비교 (744GB 모델)

| 방법 | 소요 시간 | 안정성 | 비용 |
|------|---------|--------|------|
| HF Hub 직접 | 20-40분 | ⚠️ 타임아웃 빈번 | 무료 |
| HF + hf_transfer | 10-15분 | ✅ 양호 | 무료 |
| **S3 사전 캐싱** | **5-10분** | **✅ 매우 안정** | S3 비용 |
| NVMe 로컬 (재기동) | **< 1분** | ✅ 최고 | 무료 |

> SOCI 인덱스: 컨테이너 이미지(10-20GB) lazy-loading → 시작 시간 70-80% 단축

---

## 실전 교훈

---

### EKS Auto Mode GPU 제약

| 제약 | 상세 |
|------|------|
| **p6-b200 미지원** | NodePool dry-run 통과하지만 실제 `NoCompatibleInstanceTypes` |
| **서울/도쿄 p5 부족** | InsufficientCapacity → **us-east-2 Spot $13-15/hr** |
| **GPU Operator 충돌** | `devicePlugin=true` → `allocatable=0` (반드시 false) |
| **EC2 직접 종료 불가** | resource-based policy → NodePool 삭제로 간접 정리 |

---

### 서빙 프레임워크 호환성

| 모델 | vLLM | SGLang | 비고 |
|------|:---:|:---:|------|
| Qwen3-32B | ✅ | ✅ | Apache 2.0, llm-d 기본 |
| Kimi K2.5 (1T) | ✅ | ✅ | INT4, `gpu_util=0.85` |
| **GLM-5 (744B)** | **❌** | **✅** | vLLM 미지원 → SGLang 필수 |
| DeepSeek V3.2 | ✅ | ✅ | MoE 671B |

> GLM-5: `lmsysorg/sglang:glm5-hopper` 이미지 사용

---

### GPU 쿼터 함정

| 쿼터 | 인스턴스 | 기본값 | 함정 |
|------|---------|--------|------|
| P instances | p4d, p5, p5en | 384 | p5 2대 가능 |
| **G and VT** | g5, g6, g6e | **64** | g6e.48xlarge **1대도 불가** |

> NodePool에 `[g, p]` 함께 설정 → Karpenter가 G 타입 먼저 시도 → G 쿼터에 걸림

---

## 모델 규모별 권장 아키텍처

---

### 3-Tier 구성

| Tier | 모델 규모 | 인프라 | 서빙 | 라우팅 |
|------|---------|--------|------|--------|
| **1** | ≤32B | Auto Mode | vLLM 단일 GPU | Round-Robin |
| **2** | 70B~200B | Karpenter + GPU Op | vLLM TP=4~8 | llm-d KV Cache |
| **3** | 700B+ MoE | Karpenter + LWS | vLLM/SGLang PP+TP | Disaggregated + NIXL |

**공통**: Bifrost Cascade → Bedrock 폴백

---

### 하이브리드 전체 아키텍처

```
Client → Bifrost Gateway (Cascade Routing)
  ├─ 1차: On-Prem Hybrid Node (DGX, 고정비)
  ├─ 2차: Cloud EKS GPU
  │   ├─ Auto Mode (Tier 1: 소형 모델)
  │   ├─ Karpenter + llm-d (Tier 2: 중형 모델)
  │   └─ LWS Multi-Node (Tier 3: 대형 MoE)
  └─ 3차: Amazon Bedrock (종량제 폴백)
```

---

### 마이그레이션 경로

| Phase | 구성 | 적합 단계 |
|-------|------|---------|
| **1** | Auto Mode + vLLM + Bedrock 폴백 | PoC, 개발 |
| **1.5** | + GPU Operator + llm-d | 모니터링, KV Cache |
| **2** | + Karpenter + LWS 멀티노드 | 프로덕션, MIG |
| **3** | + Dynamo + Hybrid Node | 온프레미스, 대규모 |
| **4** | 전체 통합: On-Prem→Cloud→Bedrock | 엔터프라이즈 |

---

## Key Takeaways

1. **vLLM + KV Cache-Aware Routing** = TTFT 50-80% 감소, 처리량 400%+ 향상
2. **Disaggregated Serving** = Prefill/Decode 분리로 GPU 활용률 극대화
3. **LWS** = Ray 없이 K8s 네이티브 멀티노드 (700B+ MoE 배포)
4. **Bifrost → Bedrock Cascade** = GPU 장애 시 무중단, 피크 오프로드로 비용 절감
5. **Hybrid Node** = 온프레미스 DGX + Cloud GPU + Bedrock 3-Tier
6. **S3 캐싱 + SOCI** = 모델/이미지 다운로드 안정성 확보
7. **비용 최적화 스택** = Spot + Consolidation + Right-sizing = **~85% 절감**

---

## Q&A

**YoungJoon Jeong**
Senior Specialist Solutions Architect, Containers — AWS

- GitHub: github.com/devfloor9
- Engineering Playbook: devfloor9.github.io/engineering-playbook
