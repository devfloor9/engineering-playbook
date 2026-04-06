---
title: "NVIDIA Dynamo 추론 벤치마크"
sidebar_label: "Report 5. Dynamo 추론 [신규]"
sidebar_position: 5
description: "NVIDIA Dynamo 기반 Aggregated/Disaggregated LLM 서빙 성능 비교 벤치마크 — EKS 환경 AIPerf 4가지 모드 실행"
tags: [benchmark, nvidia, dynamo, vllm, inference, gpu, disaggregated-serving, eks, kv-cache, nixl]
category: "benchmark"
last_update:
  date: 2026-03-20
  author: devfloor9
---

# Report 5. NVIDIA Dynamo 추론 벤치마크

> 📅 **작성일**: 2026-03-20 | **상태**: 신규

## 개요

NVIDIA Dynamo 기반 LLM 서빙에서 **Aggregated** 모드와 **Disaggregated** 모드의 성능을 비교하는 벤치마크입니다. EKS 환경에서 AIPerf 벤치마크 도구의 4가지 측정 모드를 실행하여, Disaggregated Serving의 KV Router + NIXL Transfer가 실제 워크로드에서 어떤 성능 차이를 만드는지 정량적으로 검증합니다.

:::info 배포 가이드
이 벤치마크의 EKS 배포는 [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack)를 참조하세요.
:::

## 테스트 환경

### EKS 클러스터 사양

| 항목 | 구성 |
|------|------|
| **EKS 버전** | v1.32 (Auto Mode) |
| **GPU 노드 (Prefill)** | p4d.24xlarge × 2 (A100 80GB × 8/노드) |
| **GPU 노드 (Decode)** | g6e.12xlarge × 4 (L40S 48GB × 4/노드) |
| **스토리지** | EFS (모델 저장소), gp3 (etcd/Prometheus) |
| **네트워크** | VPC CNI, EFA 활성화 (p4d 노드) |

### 소프트웨어 스택

| 컴포넌트 | 버전 |
|----------|------|
| **NVIDIA Dynamo** | v0.9.1 |
| **vLLM Runtime** | v0.7.x |
| **GPU Operator** | v24.9.0 |
| **AIPerf** | v0.9.1 |
| **Prometheus + Grafana** | kube-prometheus-stack 65.x |

### 테스트 모델

| 모델 | 파라미터 | 활성 파라미터 | 정밀도 | 아키텍처 |
|------|---------|-------------|--------|---------|
| **Qwen3-30B-A3B-FP8** | 30B | 3B | FP8 | MoE |

MoE (Mixture-of-Experts) 모델을 선택한 이유:
- Disaggregated Serving에서 Expert 라우팅과 KV 캐시 전략의 효과를 명확히 비교 가능
- FP8 양자화로 GPU 메모리 효율 극대화
- 활성 파라미터(3B)가 작아 Decode 워커에 L40S 급 GPU 활용 가능

---

## 아키텍처 비교

### Aggregated Serving

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

단일 워커가 Prefill과 Decode를 모두 처리합니다. 구현이 단순하지만 GPU 활용률이 비균등합니다.

### Disaggregated Serving

```
Client → KV Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ NIXL Transfer
              → Decode Worker (L40S × 2, TP=2)
                  └── KV Cache Offload: GPU → CPU → SSD
```

Prefill과 Decode를 분리하여 각 단계에 최적화된 GPU를 할당합니다:

- **KV Router**: 캐시 인식 라우팅으로 KV 히트율 극대화
- **NIXL Transfer**: GPU-to-GPU 직접 전송으로 KV 캐시 이동 지연 최소화
- **KV Cache Offloading**: GPU → CPU → SSD 3-tier 캐시로 메모리 한계 극복

---

## 벤치마크 모드

AIPerf 벤치마크 도구는 4가지 측정 모드를 제공합니다:

### 1. Concurrency Sweep

동시 요청 수를 단계적으로 증가시키며 TTFT, TPS, Throughput을 측정합니다.

| 파라미터 | 값 |
|---------|---|
| 동시성 | 1, 2, 4, 8, 16, 32, 64 |
| ISL (Input Seq Len) | 1024 |
| OSL (Output Seq Len) | 512 |
| Duration | 120s/단계 |

**측정 지표**: TTFT p50/p99, ITL p50/p99, Throughput (tokens/s), Request Latency

### 2. Multi-turn Conversation

멀티턴 대화 시나리오에서 KV 캐시 재사용 효과를 측정합니다.

| 파라미터 | 값 |
|---------|---|
| 대화 턴 수 | 5 |
| 동시 대화 | 8 |
| ISL/OSL | 512/256 |
| Duration | 300s |

**측정 지표**: 턴별 TTFT 변화, 캐시 히트율, 전체 대화 응답 시간

### 3. Sequence Distribution

다양한 시퀀스 길이 분포에서 성능 안정성을 측정합니다.

| 파라미터 | 값 |
|---------|---|
| 분포 유형 | Uniform, Zipf, Lognormal |
| ISL 범위 | 128–4096 |
| OSL 범위 | 64–2048 |
| 동시성 | 16 |

**측정 지표**: 분포별 TTFT/TPS 편차, 긴 시퀀스 처리 안정성

### 4. Prefix Cache

동일 Prefix 히트 비율 변화에 따른 TTFT 개선 효과를 측정합니다.

| 파라미터 | 값 |
|---------|---|
| Prefix 히트 비율 | 0%, 25%, 50%, 75%, 100% |
| ISL/OSL | 2048/512 |
| 동시성 | 16 |

**측정 지표**: 히트 비율별 TTFT 감소, 캐시 메모리 사용량, Eviction Rate

---

## 벤치마크 결과

:::note 데이터 수집 예정
벤치마크 실행 후 결과 데이터를 업데이트할 예정입니다.
:::

### 예상 결과 구조

#### Concurrency Sweep 결과

| 동시성 | Aggregated TTFT p50 | Disagg TTFT p50 | Aggregated TPS | Disagg TPS |
|--------|--------------------:|----------------:|---------------:|-----------:|
| 1 | - | - | - | - |
| 4 | - | - | - | - |
| 16 | - | - | - | - |
| 32 | - | - | - | - |
| 64 | - | - | - | - |

#### Prefix Cache 효과

| 히트 비율 | Aggregated TTFT | Disagg TTFT | 개선율 |
|-----------|----------------:|------------:|-------:|
| 0% | - | - | - |
| 50% | - | - | - |
| 100% | - | - | - |

#### 비용 효율성

| 구성 | GPU 비용 ($/hr) | Throughput (tok/s) | $/1M tokens |
|------|---------------:|------------------:|-----------:|
| Aggregated (p4d × 2) | - | - | - |
| Disaggregated (p4d × 2 + g6e × 4) | - | - | - |

### Grafana 대시보드

벤치마크 결과는 Grafana 대시보드에서 시각화됩니다:

- **Pareto Dashboard**: TTFT vs Throughput Pareto 분석
- **DCGM Metrics**: GPU 활용률, 메모리, 온도, 전력
- **Dynamo Platform**: 워커 상태, 요청률, KV 캐시 히트율
- **KV Block Manager**: 블록 할당, Eviction, Offload 현황

대시보드 구성은 [Agent 모니터링 가이드](/docs/agentic-ai-platform/operations-mlops/agent-monitoring)를 참조하세요.

---

## 배포 가이드

### 사전 요구사항

- EKS v1.32+ (Auto Mode 권장)
- GPU 노드 그룹: p4d.24xlarge (Prefill), g6e.12xlarge (Decode)
- EFS CSI Driver, AWS Load Balancer Controller
- Helm v3.14+

### 설치 순서

1. 기본 리소스: 네임스페이스, StorageClass, HF Token Secret
2. GPU Operator: NVIDIA 드라이버 및 디바이스 플러그인
3. 모니터링: Prometheus + Grafana + Pushgateway
4. Dynamo Platform: CRDs + Operator + etcd + NATS
5. 모델 다운로드: EFS에 모델 가중치 저장
6. 서빙 배포: Aggregated 또는 Disaggregated 모드 선택
7. 벤치마크 실행: 4가지 모드 순차 실행

상세 배포 가이드는 [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack)를 참조하세요.

---

## 핵심 검증 포인트

이 벤치마크를 통해 검증하려는 핵심 질문:

1. **Disaggregated Serving이 Aggregated 대비 TTFT를 얼마나 개선하는가?**
   - 특히 높은 동시성(32+)에서의 차이

2. **KV Cache Offloading(GPU→CPU→SSD)이 실질적 비용 절감을 제공하는가?**
   - L40S (48GB)로 Decode 워커를 운영할 때의 비용 대비 성능

3. **Prefix Cache 히트율에 따른 TTFT 개선이 선형적인가?**
   - 멀티턴 대화에서 캐시 재사용의 실제 효과

4. **NIXL Transfer 오버헤드가 Disaggregation 이점을 상쇄하지 않는가?**
   - 짧은 시퀀스에서도 Disaggregated가 유리한지

---

## 권장사항

:::note 벤치마크 완료 후 업데이트 예정
실제 측정 결과를 기반으로 권장사항을 작성할 예정입니다.
:::

### 예상 권장 시나리오

| 시나리오 | 권장 모드 | 근거 |
|---------|----------|------|
| 단일 모델, 낮은 동시성 (&lt;8) | Aggregated | 구현 단순성, 오버헤드 최소 |
| 멀티턴 대화, 높은 캐시 히트율 | Disaggregated | KV Router + Prefix Cache 효과 극대화 |
| 높은 동시성 (32+), SLA 엄격 | Disaggregated | Prefill/Decode 분리로 TTFT 안정화 |
| 비용 최적화 우선 | Disaggregated | 저비용 GPU (L40S)를 Decode에 활용 |

## 참고 자료

- [NVIDIA Dynamo Documentation](https://docs.nvidia.com/dynamo/)
- [vLLM Project](https://docs.vllm.ai/)
- [AIPerf Benchmark Tool](https://github.com/NVIDIA/dynamo)
- [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack)
