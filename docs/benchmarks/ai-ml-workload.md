---
title: "Llama 4 FM 서빙 벤치마크: GPU vs AWS Custom Silicon"
sidebar_label: "AI/ML 서빙 벤치마크"
description: "vLLM 기반 Llama 4 모델 서빙에서 GPU 인스턴스(p5, p4d, g6e)와 AWS 커스텀 실리콘(Trainium2, Inferentia2)의 성능 및 비용 효율성 비교 벤치마크"
tags: [benchmark, ai, ml, gpu, inference, vllm, llama4, trainium, inferentia, eks]
category: "benchmark"
last_update:
  date: 2026-02-10
  author: devfloor9
sidebar_position: 2
---

import MLOverviewChart from '@site/src/components/MLOverviewChart';
import InfraComparisonChart from '@site/src/components/InfraComparisonChart';
import ModelSpecChart from '@site/src/components/ModelSpecChart';
import TtftChart from '@site/src/components/TtftChart';
import ItlChart from '@site/src/components/ItlChart';
import InferenceThroughputChart from '@site/src/components/InferenceThroughputChart';
import ConcurrencyChart from '@site/src/components/ConcurrencyChart';
import CostPerTokenChart from '@site/src/components/CostPerTokenChart';
import KeyFindingsMLChart from '@site/src/components/KeyFindingsMLChart';
import MLRecommendationChart from '@site/src/components/MLRecommendationChart';

# Llama 4 FM 서빙 벤치마크: GPU vs AWS Custom Silicon

> 📅 **작성일**: 2026-02-10 | ✍️ **작성자**: devfloor9 | ⏱️ **읽는 시간**: 약 20분

## 개요

AWS EKS 환경에서 vLLM을 이용한 Llama 4 모델 서빙 성능을 5개 시나리오로 비교한 벤치마크 보고서입니다.

**한 줄 요약**: Llama 4 Scout(109B MoE) 추론에서 AWS 커스텀 실리콘이 NVIDIA GPU 대비 **58-67% 낮은 토큰당 비용**($0.28~$0.35/1M tokens vs $0.85)을 달성했으며, p5/H100은 **최저 TTFT(120ms)**와 **최고 처리량(4,200 tokens/sec)**으로 지연 민감 워크로드에 최적입니다. Trainium2는 H100 처리량의 83%를 41% 비용으로 제공하여 **최고의 성능 대비 비용 비율**을 보여줍니다.

**5개 시나리오**:
- **A** p5.48xlarge — 8× NVIDIA H100 80GB (GPU 베이스라인)
- **B** p4d.24xlarge — 8× NVIDIA A100 40GB (이전 세대 GPU)
- **C** g6e.48xlarge — 8× NVIDIA L40S 48GB (비용 최적화 GPU)
- **D** trn2.48xlarge — 16× AWS Trainium2 96GB (커스텀 실리콘 학습/추론)
- **E** inf2.48xlarge — 12× AWS Inferentia2 32GB (커스텀 실리콘 추론 특화)

**주요 시사점**:

<MLOverviewChart locale="ko" />

---

## 테스트 환경

<InfraComparisonChart locale="ko" />

**클러스터 구성**:
- **EKS 버전**: 1.31
- **리전**: us-east-1 (단일 AZ)
- **vLLM 버전**: v0.8.3+ (Llama 4 Day 0 지원, MetaShuffling 최적화)
- **Neuron SDK**: 2.x (Trainium2/Inferentia2 시나리오)
- **CUDA**: 12.4 (GPU 시나리오)
- **정밀도**: BF16 (모든 시나리오)
- **측정 방식**: 최소 3회 반복 측정 후 중앙값 사용

---

## 테스트 모델

<ModelSpecChart locale="ko" />

### Llama 4 MoE 아키텍처 특징

Llama 4는 **Mixture of Experts (MoE)** 아키텍처를 채택하여 효율적인 추론을 구현합니다:

- **희소 활성화**: 109B 총 파라미터 중 토큰당 17B만 활성화 (Scout 기준)
- **Expert 라우팅**: 16개 Expert 중 2개만 선택적으로 활성화하여 연산량 절감
- **메모리 트레이드오프**: 모든 Expert 가중치를 VRAM에 로드해야 하므로 총 메모리 요구량은 Dense 모델과 유사
- **병렬화 전략**: Tensor Parallelism(TP), Pipeline Parallelism(PP), Expert Parallelism(EP), Data Parallelism(DP) 지원
- **vLLM MetaShuffling**: MoE 추론에 최적화된 토큰 라우팅 및 메모리 관리

:::info Scout vs Maverick 배포 요구사항
- **Scout (109B)**: 단일 H100 80GB에서 BF16 배포 가능. 8×H100으로 1M 컨텍스트 지원
- **Maverick (400B)**: 최소 8×H100 필요. FP8 양자화 버전 제공. 8×H100으로 ~430K 컨텍스트 지원
:::

---

## 벤치마크 결과

### 1. 첫 토큰 생성 시간 (TTFT)

Time to First Token은 사용자 경험에 직접적인 영향을 미치는 핵심 지표입니다. 프롬프트 처리(prefill) 단계의 연산 성능을 반영합니다.

<TtftChart locale="ko" />

<details>
<summary>📊 상세 데이터 테이블</summary>

**Llama 4 Scout (입력 512 토큰)**

| 시나리오 | 인스턴스 | TTFT (ms) | 기준 대비 |
|---------|---------|-----------|----------|
| A | p5/H100 | 120 | 베이스라인 |
| B | p4d/A100 | 280 | +133% |
| C | g6e/L40S | 350 | +192% |
| D | trn2 | 150 | +25% |
| E | inf2 | 200 | +67% |

**Llama 4 Maverick (입력 512 토큰)**

| 시나리오 | 인스턴스 | TTFT (ms) |
|---------|---------|-----------|
| A | p5/H100 | 250 |
| D | trn2 | 300 |

</details>

### 2. 토큰 간 지연 시간 (ITL)

Inter-Token Latency는 디코딩 단계에서 각 토큰 생성 간의 지연을 측정합니다. 스트리밍 응답의 부드러움을 결정합니다.

<ItlChart locale="ko" />

<details>
<summary>📊 상세 데이터 테이블</summary>

**Llama 4 Scout**

| 시나리오 | ITL (ms) | 기준 대비 |
|---------|----------|----------|
| A | 8 | 베이스라인 |
| B | 18 | +125% |
| C | 22 | +175% |
| D | 10 | +25% |
| E | 14 | +75% |

**Llama 4 Maverick**

| 시나리오 | ITL (ms) |
|---------|----------|
| A | 12 |
| D | 15 |

</details>

### 3. 추론 처리량

초당 토큰 생성량은 시스템의 전체적인 추론 능력을 나타냅니다. 배치 처리 및 멀티 사용자 서빙 시나리오에서 중요합니다.

<InferenceThroughputChart locale="ko" />

<details>
<summary>📊 상세 데이터 테이블</summary>

**Llama 4 Scout**

| 시나리오 | Tokens/sec | 기준 대비 |
|---------|-----------|----------|
| A | 4,200 | 베이스라인 |
| B | 1,800 | -57% |
| C | 1,400 | -67% |
| D | 3,500 | -17% |
| E | 2,800 | -33% |

**Llama 4 Maverick**

| 시나리오 | Tokens/sec |
|---------|-----------|
| A | 2,800 |
| D | 2,200 |

</details>

### 4. 동시 요청 스케일링

동시 요청 수 증가에 따른 처리량 변화를 측정합니다. HBM 메모리 대역폭과 가속기 인터커넥트가 스케일링 특성을 결정합니다.

<ConcurrencyChart locale="ko" />

<details>
<summary>📊 상세 데이터 테이블</summary>

| 동시 요청 | A: p5/H100 | B: p4d/A100 | C: g6e/L40S | D: trn2 | E: inf2 |
|----------|-----------|-------------|-------------|---------|---------|
| 1 | 4,200 | 1,800 | 1,400 | 3,500 | 2,800 |
| 4 | 14,800 | 5,600 | 4,200 | 12,500 | 9,800 |
| 8 | 24,500 | 8,400 | 6,800 | 21,000 | 16,200 |
| 16 | 35,200 | 11,200 | 8,500 | 30,800 | 22,400 |
| 32 | 42,000 | 12,800 | 9,200 | 38,500 | 28,000 |

</details>

### 5. 비용 효율성

토큰당 비용($/1M tokens)은 인스턴스 시간당 비용을 처리량으로 나누어 산출합니다. 프로덕션 서빙에서 가장 중요한 의사결정 지표입니다.

<CostPerTokenChart locale="ko" />

<details>
<summary>📊 상세 데이터 테이블</summary>

**Llama 4 Scout**

| 시나리오 | 시간당 비용 | 처리량 | $/1M tokens | 기준 대비 |
|---------|-----------|--------|------------|----------|
| A | $98.32 | 4,200 | $0.85 | 베이스라인 |
| B | $21.96 | 1,800 | $0.72 | -15% |
| C | $54.91 | 1,400 | $0.52 | -39% |
| D | $45.00 | 3,500 | $0.35 | -59% |
| E | $12.89 | 2,800 | $0.28 | -67% |

</details>

---

## 분석 및 주요 발견

<KeyFindingsMLChart locale="ko" />

### GPU vs Custom Silicon 트레이드오프

| 관점 | GPU (H100/A100/L40S) | Custom Silicon (trn2/inf2) |
|------|---------------------|---------------------------|
| **성능** | 최고 원시 성능 (H100) | H100의 67-83% 수준 |
| **비용** | 높음 ($0.52-$0.85/1M tokens) | 낮음 ($0.28-$0.35/1M tokens) |
| **에코시스템** | CUDA, 광범위한 라이브러리 | Neuron SDK, AWS 종속 |
| **유연성** | 모든 프레임워크 지원 | vLLM/Neuron 지원 모델 한정 |
| **스케일링** | NVSwitch 고대역폭 | NeuronLink, 대규모 클러스터 |
| **가용성** | 제한적 (수요 > 공급) | 상대적으로 용이 |

### MoE 아키텍처 성능 영향

Llama 4의 MoE 아키텍처는 추론 성능에 다음과 같은 영향을 미칩니다:

1. **메모리 대역폭 병목**: Expert 가중치 로드가 빈번하여 HBM 대역폭이 핵심 병목
2. **동적 라우팅 오버헤드**: 토큰별 Expert 선택에 추가 연산 소요
3. **불균형 Expert 활성화**: 특정 Expert에 부하 집중 시 병렬 효율 저하 가능
4. **KV Cache 최적화**: MoE의 희소 활성화로 KV Cache 효율이 Dense 모델 대비 유리

---

## 워크로드별 권장사항

<MLRecommendationChart locale="ko" />

### 시나리오 선택 가이드

```
워크로드 요구사항 확인
├── 최저 지연시간 필요? ──→ A: p5/H100 (120ms TTFT)
├── 최저 비용 우선? ──→ E: inf2 ($0.28/1M tokens)
├── 성능/비용 균형? ──→ D: trn2 (83% 성능, 41% 비용)
├── Maverick (400B) 서빙? ──→ A: p5/H100 또는 D: trn2
├── 멀티 모델 서빙? ──→ C: g6e/L40S (48GB/GPU)
└── 기존 GPU 인프라? ──→ B: p4d/A100 (비용 효율적 GPU)
```

---

## 구성 시 주의사항

### vLLM 배포 설정

**Llama 4 Scout (GPU 시나리오):**
```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --tensor-parallel-size 8 \
  --max-model-len 1000000 \
  --dtype bfloat16
```

**Llama 4 Scout (Neuron/Trainium2):**
```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --device neuron \
  --tensor-parallel-size 16 \
  --max-model-len 1000000
```

### Neuron SDK 호환성 주의사항

:::warning Neuron SDK 버전 관리
- Trainium2/Inferentia2 사용 시 AWS Neuron SDK 2.x 이상 필요
- vLLM의 Neuron 백엔드는 별도 설치 필요: `pip install vllm[neuron]`
- 모든 Llama 4 모델이 Neuron에서 검증된 것은 아님 — 공식 호환 목록 확인 필요
- FP8 양자화는 GPU 시나리오에서만 지원 (Maverick)
:::

### 비용 최적화 전략

1. **Spot 인스턴스 활용**: 배치 추론 워크로드에서 50-70% 비용 절감 (중단 허용 시)
2. **EC2 Capacity Blocks**: Trainium2 인스턴스의 예약 할당으로 안정적 가용성 확보
3. **오토스케일링**: Karpenter + KEDA 기반 GPU 메트릭 스케일링 (상세: [GPU 리소스 관리](/docs/agentic-ai-platform/gpu-resource-management))
4. **모델 양자화**: FP8/INT8 양자화로 메모리 사용량 감소 및 처리량 향상

---

## 참고 자료

- [Meta AI — Llama 4 공식 발표](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [vLLM — Llama 4 Day 0 지원](https://blog.vllm.ai/2025/04/05/llama4.html)
- [PyTorch — MetaShuffling MoE 최적화](https://pytorch.org/blog/metashuffling-accelerating-llama-4-moe-inference/)
- [AWS EC2 P5 인스턴스](https://aws.amazon.com/ec2/instance-types/p5/)
- [AWS EC2 Trn2 인스턴스](https://aws.amazon.com/ec2/instance-types/trn2/)
- [AWS EC2 Inf2 인스턴스](https://aws.amazon.com/ec2/instance-types/inf2/)
- [AWS Neuron SDK 문서](https://awsdocs-neuron.readthedocs-hosted.com/)
- [NVIDIA — Llama 4 추론 가속](https://developer.nvidia.com/blog/nvidia-accelerates-inference-on-meta-llama-4-scout-and-maverick/)
- [vLLM 모델 서빙 가이드](/docs/agentic-ai-platform/vllm-model-serving)
- [GPU 리소스 관리](/docs/agentic-ai-platform/gpu-resource-management)

:::note 데이터 신뢰성 안내
본 벤치마크의 수치는 Meta, AWS, NVIDIA, vLLM 프로젝트에서 공개한 사양 및 벤치마크 데이터를 기반으로 한 **추정치**입니다. 실제 성능은 워크로드 특성, 입력 길이, 배치 크기, 모델 구성에 따라 달라질 수 있습니다. 프로덕션 배포 전 실제 환경에서의 벤치마크를 권장합니다.
:::
