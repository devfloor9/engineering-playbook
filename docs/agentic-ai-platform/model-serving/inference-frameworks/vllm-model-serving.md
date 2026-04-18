---
title: "vLLM 모델 서빙"
sidebar_label: "vLLM 모델 서빙"
description: "vLLM의 PagedAttention, 병렬화 전략, Multi-LoRA, 하드웨어 지원 아키텍처"
tags: [vllm, paged-attention, tensor-parallel, pipeline-parallel, multi-lora, serving, 'scope:tech']
sidebar_position: 3
last_update:
  date: 2026-04-18
  author: YoungJoon Jeong
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

# vLLM 모델 서빙

## 개요

vLLM은 PagedAttention 알고리즘을 통해 KV 캐시 메모리 낭비를 60-80% 줄이고, 연속 배칭(Continuous Batching)으로 기존 대비 2-24배의 처리량 향상을 제공하는 고성능 LLM 추론 엔진이다. Meta, Mistral AI, Cohere, IBM 등 주요 기업들이 프로덕션 환경에서 활용하고 있으며, OpenAI 호환 API를 제공하여 기존 애플리케이션의 마이그레이션이 용이하다.

> **📌 현재 버전**: vLLM v0.18+ / v0.19.x (2026-04 기준)

### 왜 vLLM이 표준이 되었나

전통적인 LLM 서빙 엔진은 KV 캐시 메모리를 정적으로 할당하여 60-80%의 메모리 낭비가 발생했다. 정적 배칭 방식은 고정된 수의 요청이 모일 때까지 대기하여 GPU 유휴 시간이 길었다. vLLM은 이 두 가지 근본적인 병목을 제거하여 동일한 하드웨어에서 최대 24배 높은 처리량을 제공한다.

vLLM의 핵심 혁신:
- **PagedAttention**: 운영체제의 가상 메모리 관리에서 영감을 받아 KV 캐시를 비연속적 블록으로 관리
- **Continuous Batching**: 배치 경계를 제거하고 반복(iteration) 수준에서 동적으로 요청 추가/제거
- **OpenAI API 호환**: 기존 애플리케이션 코드 변경 없이 마이그레이션 가능

## 핵심 아키텍처

### PagedAttention과 KV 캐시 관리

Transformer 아키텍처의 자기회귀적 특성으로 인해 각 요청은 이전 토큰들의 키-값 쌍을 저장해야 한다. 이 KV 캐시는 입력 시퀀스 길이와 동시 사용자 수에 비례하여 선형적으로 증가하며, 전통적인 방식에서는 최대 길이에 맞춰 메모리를 사전 할당하여 실제 사용량과 무관하게 공간을 낭비한다.

vLLM의 PagedAttention은 KV 캐시를 고정 크기 블록으로 나누어 비연속적으로 저장한다. 요청이 짧으면 적은 블록만 할당하고, 길어지면 필요할 때 추가 블록을 할당한다. 블록 테이블을 통해 논리적 순서를 유지하며, 메모리 단편화가 사라진다.

**메모리 효율성 개선**:
- 기존 방식: 최대 시퀀스 길이 × 배치 크기만큼 사전 할당 → 60-80% 낭비
- PagedAttention: 실제 사용량만큼만 동적 할당 → 낭비 제거

### Continuous Batching

정적 배칭은 고정된 수의 요청이 모일 때까지 대기한 후 처리한다. 요청이 불규칙하게 도착하면 GPU가 부분적으로만 활용되어 처리량이 저하된다. 또한 배치 내에서 먼저 완료된 요청도 전체 배치가 끝날 때까지 대기해야 한다.

vLLM의 연속 배칭은 배치 경계를 완전히 제거한다:
- 스케줄러가 반복(iteration) 수준에서 동작
- 완료된 요청은 즉시 제거하고 새로운 요청을 동적으로 추가
- GPU가 항상 최대 용량으로 작동
- 평균 지연 시간과 처리량 모두 개선

### Speculative Decoding

추측적 디코딩은 작은 드래프트 모델이 토큰을 예측하고, 메인 모델이 병렬로 검증하여 2-3배 속도 향상을 제공한다. 예측 가능한 출력(코드 생성, 정형화된 응답)에서 특히 효과적이다.

```python
from vllm import LLM

llm = LLM(
    model="large-model",
    speculative_model="small-draft-model",
    num_speculative_tokens=5
)
```

### V1 엔진 아키텍처

vLLM v0.19.x 버전은 V1 엔진을 도입하여 다음 기능을 개선했다:
- **Chunked Prefill**: 프리필(계산 집약적)과 디코드(메모리 집약적)를 동일 배치에서 혼합 처리
- **FP8 KV Cache**: KV 캐시 메모리를 2배 절감하여 더 긴 컨텍스트 지원
- **Improved Prefix Caching**: 공통 프리픽스 재사용으로 400%+ 처리량 향상

## GPU 메모리 요구사항

모델 배포 전 필요한 GPU 메모리를 정확히 계산해야 한다. 메모리 사용량은 다음 구성요소로 나뉜다:

```
필요 GPU 메모리 = 모델 가중치 + 비torch 메모리 + PyTorch 활성화 피크 메모리 + (배치당 KV 캐시 메모리 × 배치 크기)
```

### 모델 가중치 메모리

파라미터 수와 정밀도에 따라 결정된다.

<SpecificationTable
  headers={['정밀도', '파라미터당 바이트', '70B 모델 메모리']}
  rows={[
    { id: '1', cells: ['FP32', '4', '280GB'] },
    { id: '2', cells: ['FP16/BF16', '2', '140GB'] },
    { id: '3', cells: ['INT8', '1', '70GB'] },
    { id: '4', cells: ['INT4', '0.5', '35GB'] }
  ]}
/>

**예시 계산**:
- Llama-3.3-70B (FP16): 70B × 2 bytes = 140GB (가중치만)
- KV 캐시 (배치 크기 256, 시퀀스 길이 8192): 약 40GB
- 활성화 및 기타 오버헤드: 약 20GB
- **총합**: 약 200GB → 단일 H100 80GB로 불가능, TP=4 필요 (GPU당 50GB)

70B 파라미터 모델을 INT4 양자화하면 35GB로 줄어들어 단일 A100 80GB나 H100에서 KV 캐시 여유 공간과 함께 배포 가능하다.

## 병렬화 전략

대규모 모델은 단일 GPU에 맞지 않거나, 처리량을 높이기 위해 여러 GPU를 활용해야 한다. vLLM은 네 가지 병렬화 전략을 지원한다.

### 텐서 병렬화 (Tensor Parallelism, TP)

각 모델 레이어 내에서 파라미터를 여러 GPU에 분산한다. 단일 노드 내에서 대규모 모델을 배포할 때 가장 일반적인 전략이다.

**적용 시점**:
- 모델이 단일 GPU에 맞지 않을 때
- GPU당 메모리 압력을 줄여 KV 캐시 공간을 확보하려 할 때

```python
from vllm import LLM

# 4개 GPU에 모델 분산
llm = LLM(
    model="meta-llama/Llama-3.3-70B-Instruct",
    tensor_parallel_size=4
)
```

**제약사항**: `tensor_parallel_size`는 모델의 어텐션 헤드 수의 약수여야 한다. 예를 들어 70B 모델이 64개 어텐션 헤드를 가지면 TP=2, 4, 8, 16 등이 가능하다.

### 파이프라인 병렬화 (Pipeline Parallelism, PP)

모델 레이어를 여러 GPU에 순차적으로 분산한다. 토큰이 파이프라인을 통해 순차적으로 흐른다.

**적용 시점**:
- 텐서 병렬화를 최대로 활용했지만 추가 GPU가 필요할 때
- 다중 노드 배포가 필요할 때

```bash
# 4개 GPU를 텐서 병렬로, 2개 노드를 파이프라인 병렬로
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### 병렬화 전략 조합 매트릭스

<ComparisonTable
  headers={['시나리오', '모델 크기', 'GPU 구성', '병렬화 전략', 'TP × PP']}
  rows={[
    { id: '1', cells: ['소형 모델', '7B-13B', '1×H100 80GB', 'None', '1 × 1'], recommended: true },
    { id: '2', cells: ['중형 모델', '32B-70B', '4×H100 80GB (단일 노드)', 'TP=4', '4 × 1'], recommended: true },
    { id: '3', cells: ['대형 모델', '175B-405B', '8×H100 (2 노드)', 'TP=4, PP=2', '4 × 2'] },
    { id: '4', cells: ['초대형 모델', '744B MoE', '16×H100 (2 노드)', 'TP=8, PP=2', '8 × 2'] }
  ]}
/>

### PP 멀티노드 제약 (V1 엔진, 2026.04)

vLLM V1 엔진의 multiproc_executor는 NCCL TCPStore를 통해 멀티노드 동기화를 수행하는데, 대형 모델(744B 급) 로딩 시간이 `VLLM_ENGINE_READY_TIMEOUT_S` (기본 600초)를 초과하면 교착 상태가 발생할 수 있다.

**증상**: Leader Pod가 Worker 응답 대기 중 timeout → Worker에서 `TCPStore Broken pipe` 에러 → 순환 재시작

**해결 방안**:
1. **SGLang 사용** (권장): 멀티노드 PP를 안정적으로 지원
2. **Ray 기반 vLLM**: Ray Cluster 구성 (운영 복잡도 증가)
3. **단일 노드 배포**: H200 (141GB × 8) 또는 B200 (192GB × 8) 사용하여 PP 제거

상세 내용은 [커스텀 모델 배포 가이드](../../reference-architecture/custom-model-deployment.md#vllm-pp-멀티노드-제약)를 참조하세요.

### 데이터 병렬화 (Data Parallelism, DP)

전체 모델 복제본을 여러 서버에 복제하여 독립적인 요청을 처리한다. Kubernetes의 HPA(Horizontal Pod Autoscaler)와 결합하여 탄력적으로 확장할 수 있다.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: vllm_num_requests_waiting
      target:
        type: AverageValue
        averageValue: "10"
```

### 전문가 병렬화 (Expert Parallelism, EP)

MoE(Mixture-of-Experts) 모델을 위한 특수 전략이다. 토큰이 관련 "전문가"에만 라우팅되어 불필요한 계산을 줄인다.

```bash
vllm serve model-name --enable-expert-parallel
```

상세 내용은 [MoE 모델 서빙](./moe-model-serving.md)을 참조하세요.

## 지원 하드웨어

vLLM v0.19.x 버전은 다양한 하드웨어 가속기를 지원한다:

<ComparisonTable
  headers={['하드웨어', '지원 수준', '주요 용도', 'AWS 인스턴스 타입']}
  rows={[
    { id: '1', cells: ['NVIDIA H100 (80GB)', '완전 지원', '프로덕션 추론', 'p5.48xlarge (H100×8)'], recommended: true },
    { id: '2', cells: ['NVIDIA H200 (141GB)', '완전 지원', '대형 모델 추론', 'p5en.48xlarge (H200×8)'] },
    { id: '3', cells: ['NVIDIA B200 (192GB)', '완전 지원', '초대형 모델 추론', 'p6-b200.48xlarge (B200×8)'] },
    { id: '4', cells: ['NVIDIA L4 (24GB)', '완전 지원', '비용 효율적 추론', 'g6e.xlarge~12xlarge (L4×1~8)'] },
    { id: '5', cells: ['AWS Trainium2', '지원', 'AWS 네이티브 가속', 'trn2.48xlarge (Trn2×16)'] },
    { id: '6', cells: ['AMD MI300X', '지원', '대안 GPU 인프라', '-'] }
  ]}
/>

**AWS EKS 권장 구성**:
- **프로덕션**: p5.48xlarge (H100 × 8, 640GB HBM3) → TP=8로 175B 모델 배포 가능
- **대형 모델**: p5en.48xlarge (H200 × 8, 1,128GB HBM3e) → TP=8로 405B 모델 배포 가능
- **비용 최적화**: g6e 인스턴스 (L4) → 7B~13B 모델, Spot 인스턴스 활용

## Multi-LoRA 서빙

vLLM은 단일 기본 모델에서 여러 LoRA 어댑터를 동시에 서빙할 수 있다. 하나의 GPU 세트에서 도메인별 특화 모델을 효율적으로 운영할 수 있어 GPU 리소스를 크게 절약한다.

### 아키텍처 개념

**기본 모델 + 어댑터 핫스왑**:
- Base Model (70B)은 GPU 메모리에 항상 로드
- LoRA 어댑터(수백 MB~수 GB)는 요청마다 동적으로 로드/언로드
- 어댑터 전환 오버헤드: 수십~수백 ms (모델 전체 재로딩보다 100배 빠름)

**메모리 효율성**:
- 기존 방식: 도메인별 전체 모델 × N개 배포 = 140GB × 5 = 700GB
- Multi-LoRA: Base Model (140GB) + 어댑터 캐시 (10GB) = 150GB

### 주요 설정 옵션

<SpecificationTable
  headers={['옵션', '설명', '기본값']}
  rows={[
    { id: '1', cells: ['--enable-lora', 'Multi-LoRA 서빙 활성화', 'False'] },
    { id: '2', cells: ['--lora-modules', '사전 로드할 LoRA 모듈 (name=path)', 'None'] },
    { id: '3', cells: ['--max-loras', '동시 로드 가능한 최대 LoRA 수', '1'] },
    { id: '4', cells: ['--max-lora-rank', '지원할 최대 LoRA rank', '16'] },
    { id: '5', cells: ['--lora-extra-vocab-size', 'LoRA 어댑터 추가 어휘 크기', '256'] }
  ]}
/>

**기본 사용 예제**:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules customer-support=./lora-cs finance=./lora-fin \
  --max-loras 4 \
  --max-lora-rank 64
```

:::info 상세 가이드
Multi-LoRA 핫스왑 배포, 고객별 어댑터 라우팅, A/B 테스트, S3 동적 로딩 등 상세 구현은 [커스텀 모델 파이프라인 가이드](../../reference-architecture/custom-model-pipeline.md#multi-lora-핫스왑-배포)를 참조하세요.
:::

## 성능 최적화

### 양자화 (Quantization)

모델 품질과 메모리 효율성의 균형을 맞춘다.

<ComparisonTable
  headers={['양자화 방식', '메모리 절감', '품질 손실', '추론 속도', '권장 용도']}
  rows={[
    { id: '1', cells: ['FP8', '50%', '최소 (1% 미만)', '빠름 (H100 최적화)', '프로덕션 추론'], recommended: true },
    { id: '2', cells: ['AWQ', '75%', '낮음 (1-3%)', '매우 빠름', '고처리량 서비스'] },
    { id: '3', cells: ['GPTQ', '75%', '낮음 (1-3%)', '빠름', 'GPU 메모리 제약 환경'] },
    { id: '4', cells: ['GGUF', '50-75%', '낮음-중간', '빠름', 'CPU/edge 배포'] }
  ]}
/>

**사용 예제**:

```bash
# FP8 양자화 (권장)
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ 양자화
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GGUF 양자화 (vLLM v0.6+)
vllm serve --model TheBloke/Llama-2-70B-GGUF \
  --quantization gguf \
  --gguf-file llama-2-70b.Q4_K_M.gguf
```

FP8은 품질 저하가 거의 없으면서 메모리를 절반으로 줄인다. INT4(AWQ, GPTQ)는 복잡한 추론 작업에서 품질 저하가 발생할 수 있으므로 워크로드별 프로파일링이 필요하다.

### Prefix Caching

표준화된 시스템 프롬프트나 반복되는 컨텍스트에서 400% 이상의 활용률 향상을 제공한다.

```bash
vllm serve model-name --enable-prefix-caching
```

**작동 원리**:
- 시스템 프롬프트의 KV 캐시가 한 번 계산되어 공유
- 동일한 프리픽스를 가진 요청들은 중복 계산을 피함
- 적중률은 애플리케이션에 따라 다름 (RAG 시스템에서 특히 효과적)

**적용 시나리오**:
- RAG 시스템 (공통 컨텍스트 재사용)
- 고정된 시스템 프롬프트 사용
- Few-shot learning (동일한 예제 반복 사용)

### Chunked Prefill

프리필(계산 집약적)과 디코드(메모리 집약적) 작업을 동일 배치에서 혼합하여 처리량과 지연 시간 모두 개선한다. vLLM V1에서 기본 활성화되어 있다.

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # 튜닝 가능
)
```

`max_num_batched_tokens`를 조정하여 TTFT(Time To First Token)와 처리량의 균형을 맞춘다:
- 값이 크면 → 처리량 증가, TTFT 증가
- 값이 작으면 → TTFT 감소, 처리량 감소

### CUDA Graph

반복적인 연산 패턴을 그래프로 캡처하여 GPU 커널 실행 오버헤드를 줄인다. vLLM V1에서 기본 활성화되어 있다.

```bash
vllm serve model-name --enforce-eager  # CUDA Graph 비활성화 (디버깅용)
```

CUDA Graph는 대부분의 경우 10-20% 성능 향상을 제공하지만, 동적인 시퀀스 길이 패턴에서는 오버헤드가 발생할 수 있다.

### DeepGEMM (FP8)

NVIDIA H100 GPU에서 FP8 연산을 가속화하는 커스텀 GEMM 커널이다.

```bash
VLLM_USE_DEEP_GEMM=1 vllm serve model-name --kv-cache-dtype=fp8
```

H100에서 FP8 모델 사용 시 20-30% 추가 성능 향상을 제공한다.

### 최적화 옵션 비교

<ComparisonTable
  headers={['최적화 기법', '처리량 향상', 'TTFT 개선', 'GPU 메모리 절감', '적용 난이도']}
  rows={[
    { id: '1', cells: ['Prefix Caching', '+400%', '○', '○', '낮음 (플래그 1개)'], recommended: true },
    { id: '2', cells: ['FP8 양자화', '+50%', '○', '50%', '낮음 (모델 선택)'], recommended: true },
    { id: '3', cells: ['Chunked Prefill', '+30%', '+20%', '-', '낮음 (기본 활성화)'] },
    { id: '4', cells: ['Speculative Decoding', '+200%', '+100%', '-', '중간 (드래프트 모델)'] },
    { id: '5', cells: ['CUDA Graph', '+15%', '○', '-', '낮음 (기본 활성화)'] },
    { id: '6', cells: ['DeepGEMM', '+25%', '-', '-', '낮음 (H100 전용)'] }
  ]}
/>

## 모니터링 메트릭

vLLM은 Prometheus 형식의 다양한 메트릭을 노출한다.

### 주요 메트릭

<SpecificationTable
  headers={['메트릭', '설명', '임계값 예시']}
  rows={[
    { id: '1', cells: ['vllm:num_requests_running', '현재 처리 중인 요청 수', '< max_num_seqs'] },
    { id: '2', cells: ['vllm:num_requests_waiting', '대기 중인 요청 수', '< 50 (과부하 방지)'] },
    { id: '3', cells: ['vllm:gpu_cache_usage_perc', 'GPU KV 캐시 사용률', '70-90% (최적)'] },
    { id: '4', cells: ['vllm:num_preemptions_total', '선점된 요청 수', '< 10/min (낮을수록 좋음)'] },
    { id: '5', cells: ['vllm:avg_prompt_throughput_toks_per_s', '프롬프트 처리량 (tokens/sec)', '목표값 대비 측정'] },
    { id: '6', cells: ['vllm:avg_generation_throughput_toks_per_s', '생성 처리량 (tokens/sec)', '목표값 대비 측정'] },
    { id: '7', cells: ['vllm:time_to_first_token_seconds', '첫 토큰까지 시간 (TTFT)', '< 1초 (대화형 서비스)'] },
    { id: '8', cells: ['vllm:time_per_output_token_seconds', '출력 토큰당 시간 (TPOT)', '< 0.1초 (실시간 스트리밍)'] },
    { id: '9', cells: ['vllm:e2e_request_latency_seconds', '엔드투엔드 요청 지연 시간', '목표 SLA 대비 측정'] }
  ]}
/>

### 선점(Preemption) 처리

KV 캐시 공간이 부족하면 vLLM이 요청을 선점하여 공간을 확보한다. 다음 경고가 자주 발생하면 조치가 필요하다:

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

**대응 방안**:
1. `gpu_memory_utilization` 증가 (0.9 → 0.95)
2. `max_num_seqs` 또는 `max_num_batched_tokens` 감소
3. `tensor_parallel_size` 증가로 GPU당 메모리 확보
4. `max_model_len` 감소 (실제 워크로드에 맞게)

:::info 상세 가이드
Prometheus + Grafana 기반 모니터링 스택 구성, 알람 임계값 설정, 대시보드 템플릿은 [모니터링 스택 구성 가이드](../../reference-architecture/monitoring-observability-setup.md)를 참조하세요.
:::

## 관련 문서

### 실전 배포
- **[커스텀 모델 배포](../../reference-architecture/custom-model-deployment.md)**: Kubernetes 배포 YAML, LWS 멀티노드, S3 모델 캐시, vLLM PP 멀티노드 제약 상세, 코딩 특화 모델 배포 가이드
- **[커스텀 모델 파이프라인](../../reference-architecture/custom-model-pipeline.md)**: Multi-LoRA 핫스왑, 고객별 어댑터 라우팅, A/B 테스트, S3 동적 로딩
- **[모니터링 스택 구성](../../reference-architecture/monitoring-observability-setup.md)**: Prometheus + Grafana 설정, 알람 임계값, 대시보드 템플릿

### 관련 기술
- **[llm-d EKS Auto Mode](./llm-d-eks-automode.md)**: vLLM + llm-d 연동 통한 Disaggregated Serving
- **[MoE 모델 서빙](./moe-model-serving.md)**: Expert Parallelism, GLM-5/Kimi K2.5 배포 전략
- **[GPU 리소스 관리](../gpu-infrastructure/gpu-resource-management.md)**: Karpenter, KEDA, GPU Operator 구성

### 참고 자료
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Bifrost, vLLM, Langfuse, Milvus 등 GenAI 컴포넌트 배포 자동화
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): llm-d, Karpenter, RAG 워크플로우 포함 종합 아키텍처
- [vLLM 공식 문서](https://docs.vllm.ai): 최적화 및 튜닝 가이드
- [vLLM Kubernetes 배포 가이드](https://docs.vllm.ai/en/stable/deployment/k8s.html)
