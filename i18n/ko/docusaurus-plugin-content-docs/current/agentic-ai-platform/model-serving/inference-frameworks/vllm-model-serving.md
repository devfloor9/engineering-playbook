---
title: vLLM 모델 서빙
description: vLLM의 PagedAttention, 병렬화 전략, Multi-LoRA, 하드웨어 지원 아키텍처
created: "2026-02-05"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 22
tags:
  - vllm
  - paged-attention
  - tensor-parallel
  - pipeline-parallel
  - multi-lora
  - serving
  - inference
  - gpu
  - optimization
  - scope:tech
sidebar_label: vLLM 모델 서빙
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

## 개요

vLLM은 PagedAttention 알고리즘으로 KV cache의 과다 예약(over-reservation)을 줄이는 고성능 LLM 추론 엔진입니다. vLLM 저자들은 기존 서빙 시스템에서 메모리의 60-80%가 과다 예약·단편화로 낭비된다고 측정했으며, 연속 배칭(Continuous Batching)은 2023년 6월 vLLM 벤치마크에서 HuggingFace Transformers·TGI 기준 대비 2-24배의 처리량 향상을 보고했습니다(정확한 배수는 모델·하드웨어·워크로드에 따라 다릅니다). Meta, Mistral AI, Cohere, IBM 등 주요 기업들이 프로덕션 환경에서 활용하고 있으며, OpenAI 호환 API를 제공하여 기존 애플리케이션의 마이그레이션이 용이합니다.

> **현재 버전**: vLLM v0.24+ / v0.25.x (2026-07 기준)

### 왜 vLLM이 표준이 되었나

요청마다 최대 길이의 KV cache 공간을 미리 잡아 두면 짧게 끝나는 요청의 메모리가 남습니다. 배치를 고정하면 먼저 끝난 요청이 생겨도 남은 요청의 처리가 끝날 때까지 빈 처리 자리를 활용하기 어렵습니다. vLLM은 필요한 KV 블록을 추가로 할당하고, 생성 반복마다 완료된 요청을 빼고 새 요청을 넣는 방식으로 이 낭비를 줄입니다.

vLLM의 핵심 혁신:
- **PagedAttention**: 운영체제의 가상 메모리 관리에서 영감을 받아 KV cache를 비연속적 블록으로 관리
- **Continuous Batching**: 배치 경계를 제거하고 반복(iteration) 수준에서 동적으로 요청 추가/제거
- **OpenAI API 호환**: 기존 애플리케이션 코드 변경 없이 마이그레이션 가능

## 핵심 아키텍처

### PagedAttention과 KV cache 관리

Transformer 언어 모델은 출력 토큰을 하나씩 생성합니다. 매번 이전 토큰의 attention 데이터를 다시 계산하지 않도록, 서빙 엔진은 해당 토큰의 key와 value 텐서를 **KV cache**에 저장합니다. 캐시 메모리는 시퀀스 길이와 동시 요청 수에 비례해 늘어납니다. 요청마다 최대 시퀀스 길이에 맞춰 메모리를 미리 할당하면, 실제로 사용하지 않는 공간이 남을 수 있습니다.

vLLM의 PagedAttention은 KV cache를 고정 크기 블록으로 나누어 비연속적으로 저장합니다. 요청이 짧으면 적은 블록만 할당하고, 길어지면 필요할 때 추가 블록을 할당합니다. 블록 테이블로 논리적 순서를 유지하여 연속 할당 방식의 외부 단편화와 과다 예약을 제거합니다. 다만 각 시퀀스의 마지막 부분 블록에는 내부 낭비가 남으며, vLLM 저자들은 이 잔여 낭비를 4% 미만으로 측정했습니다.

**메모리 효율성 개선**:
- 기존 방식: 최대 시퀀스 길이 × 배치 크기만큼 사전 할당 → 과다 예약·단편화로 메모리의 60-80% 낭비(2023년 6월 vLLM이 기존 서빙 시스템을 측정한 값)
- PagedAttention: 필요할 때 블록을 할당 → 과다 예약·외부 단편화 제거, 마지막 블록의 잔여 낭비는 4% 미만으로 측정됨

### Continuous Batching

정적 배칭은 고정된 수의 요청이 모일 때까지 대기한 후 처리합니다. 요청이 불규칙하게 도착하면 GPU가 부분적으로만 활용되어 처리량이 저하됩니다. 또한 배치 내에서 먼저 완료된 요청도 전체 배치가 끝날 때까지 대기해야 합니다.

vLLM의 연속 배칭은 생성 반복(iteration)마다 배치에 참여할 요청을 갱신합니다.

- 완료된 요청을 배치에서 제거합니다.
- 처리 여유가 생기면 대기 중인 새 요청을 추가합니다.
- 이 방식은 고정 배치에서 생기는 유휴 시간을 줄이지만, GPU 사용률은 요청 도착 빈도와 메모리·연산 한계에 따라 달라집니다.
- 지연 시간과 처리량의 변화는 같은 부하 조건에서 각각 측정합니다.

### Speculative Decoding

추측적 디코딩은 작은 드래프트 모델이 토큰을 예측하고, 메인 모델이 병렬로 검증하여 2-3배 속도 향상을 제공합니다. 예측 가능한 출력(코드 생성, 정형화된 응답)에서 특히 효과적입니다.

```python
from vllm import LLM

# vLLM v0.9+ 권장 API (speculative_config)
llm = LLM(
    model="large-model",
    speculative_config={
        "method": "draft_model",
        "model": "small-draft-model",
        "num_speculative_tokens": 5
    }
)
```

### V1 엔진 아키텍처

vLLM V1 엔진은 2025-01-27 알파로 처음 공개되었고(초기에는 `VLLM_USE_V1=1`로 선택 활성화), 이후 기본 엔진이 되었습니다. 이 문서가 다루는 v0.19.x~v0.25.x 계열에서는 기본값입니다. 주요 기능은 다음과 같습니다:
- **Chunked Prefill**: 프리필(계산 집약적)과 디코드(메모리 집약적)를 동일 배치에서 혼합 처리
- **FP8 KV cache**: KV cache를 FP16(요소당 2바이트) 대신 FP8(1바이트)로 저장하여 KV cache 메모리를 약 절반으로 줄이고 더 긴 컨텍스트 지원
- **Improved Prefix Caching**: 요청 간 공통 프리픽스의 KV cache를 재사용하며, V1에서 거의 오버헤드 없이 기본 활성화됨. 처리량 향상 폭은 프리픽스 적중률에 따라 달라지며 고정값이 아닙니다.

## GPU 메모리 요구사항

모델 배포 전 필요한 GPU 메모리를 정확히 계산해야 합니다. 메모리 사용량은 다음 구성요소로 나뉩니다:

```
필요 GPU 메모리 = 모델 가중치 + 비torch 메모리 + PyTorch 활성화 피크 메모리 + (배치당 KV cache 메모리 × 배치 크기)
```

### 모델 가중치 메모리

파라미터 수와 정밀도에 따라 결정됩니다.

<SpecificationTable
  headers={['정밀도', '파라미터당 바이트', '70B 모델 메모리']}
  rows={[
    { id: '1', cells: ['FP32', '4', '280GB'] },
    { id: '2', cells: ['FP16/BF16', '2', '140GB'] },
    { id: '3', cells: ['INT8', '1', '70GB'] },
    { id: '4', cells: ['INT4', '0.5', '35GB'] }
  ]}
/>

**예시 계산** (Llama-3.3-70B, FP16 가중치 및 FP16 KV cache):

가중치: 70B × 2 bytes = 140GB.

토큰당 KV cache는 모델의 어텐션 차원으로 결정됩니다. Llama-3.3-70B은 Meta `llama-models` 정의 기준으로 Llama-3/3.1-70B과 동일하게 `n_layers = 80`, `n_kv_heads = 8`(그룹 쿼리 어텐션), `head_dim = dim / n_heads = 8192 / 64 = 128`입니다:

```
토큰당 KV 바이트 = 2(key+value) × n_layers × n_kv_heads × head_dim × 요소당 바이트
                = 2 × 80 × 8 × 128 × 2(FP16)
                = 327,680 bytes ≈ 320 KiB/token
```

배치 크기 256, 시퀀스 길이 8192이면 KV cache는 최대 256 × 8192 = 2,097,152 토큰을 담습니다:

```
KV cache = 2,097,152 토큰 × 320 KiB ≈ 640 GiB   (약 40GB가 아님)
```

- **총합(최대 점유 기준)**: 약 140GB 가중치 + 약 640GiB KV + 활성화/오버헤드. 단일 H100 80GB로는 불가능합니다.
- TP=4로 가중치와 KV cache를 4개 GPU에 분할해도, 256×8192 최대 점유에서는 KV cache만 랭크당 약 160GiB로 80GB GPU를 크게 초과합니다. 따라서 이 배치×시퀀스 지점에 도달하려면 더 많은 GPU(더 높은 TP·추가 노드), KV cache 양자화(FP8로 토큰당 320 KiB→160 KiB), 또는 더 작은 `max_num_seqs`/`max_model_len`이 필요합니다. 실제로 vLLM은 `gpu_memory_utilization`과 가중치 적재 후 남은 HBM으로 사용 가능한 KV cache 크기를 정하므로, 실제 서비스 가능한 배치×시퀀스는 고정된 256×8192가 아니라 그 예산에 맞는 값입니다.

70B 파라미터 모델을 INT4 양자화하면 가중치가 35GB로 줄어듭니다. KV cache는 가중치와 별도로 산정되므로, 단일 A100 80GB나 H100에서 배포 가능한 배치×시퀀스는 가중치 35GB를 제외한 잔여 HBM에 따라 달라집니다.

## 병렬화 전략

대규모 모델은 단일 GPU에 맞지 않거나, 처리량을 높이기 위해 여러 GPU를 활용해야 합니다. vLLM은 네 가지 병렬화 전략을 지원합니다.

### 텐서 병렬화 (Tensor Parallelism, TP)

각 모델 레이어 내에서 파라미터를 여러 GPU에 분산합니다. 단일 노드 내에서 대규모 모델을 배포할 때 가장 일반적인 전략입니다.

**적용 시점**:
- 모델이 단일 GPU에 맞지 않을 때
- GPU당 메모리 압력을 줄여 KV cache 공간을 확보하려 할 때

```python
from vllm import LLM

# 4개 GPU에 모델 분산
llm = LLM(
    model="meta-llama/Llama-3.3-70B-Instruct",
    tensor_parallel_size=4
)
```

**제약사항**: `tensor_parallel_size`는 모델의 어텐션 헤드 수의 약수여야 합니다. 예를 들어 70B 모델이 64개 어텐션 헤드를 가지면 TP=2, 4, 8, 16 등이 가능합니다.

### 파이프라인 병렬화 (Pipeline Parallelism, PP)

모델 레이어를 여러 GPU에 순차적으로 분산합니다. 토큰이 파이프라인을 통해 순차적으로 흐릅니다.

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

GPU 개수 열은 검증된 메모리 적합성이 아니라 병렬화 *토폴로지*를 나타냅니다. 모델이 실제로 올라가는지는 체크포인트 정밀도에 달려 있으며, 총 HBM이 가중치 + KV cache + 활성화 오버헤드를 초과해야 합니다. 예를 들어 Llama-3.1-405B를 BF16로 올리면 405B × 2 bytes ≈ 810GB로, KV cache 이전에 이미 8×H100(640GB)을 초과하므로 FP8/INT 양자화 체크포인트나 더 많은 GPU가 필요합니다. 744B 파라미터 MoE를 BF16로 올리면 ≈ 1,488GB로 16×H100(1,280GB)을 초과합니다. MoE는 토큰당 일부 전문가만 활성화되지만 전체 가중치는 상주해야 하므로, 마찬가지로 양자화 체크포인트나 추가 장치가 필요합니다. 각 행은 배포 전에 실제 체크포인트 dtype과 랭크당 예산으로 다시 산정해야 합니다.

### PP 멀티노드 제약 (V1 엔진, 2026-04) {#pp-멀티노드-제약-v1-엔진-202604}

vLLM V1 엔진의 `multiproc_executor`는 NCCL TCPStore로 멀티노드 동기화를 수행한다. `VLLM_ENGINE_READY_TIMEOUT_S` 환경 변수(기본 600초, v0.25.0 `envs.py`에서 확인)는 엔진이 준비 상태가 될 때까지 기다리는 시간을 제한한다. 내부에서 관찰된 사례에서 대형 모델(744B 급) 로딩 시간이 이 타임아웃을 초과했다. 다음은 재현을 통한 원인 분석이 아니라 단일 관찰 사례이므로, **기동 준비 타임아웃**(600초 안에 로딩이 끝나지 않음)과 실제 런타임 **교착(deadlock)**을 구분해야 한다. 확보된 근거는 타임아웃 값만 확인할 뿐 원인을 분리하거나 일반적 교착을 입증하지 못한다.

**관찰된 증상**: Leader Pod가 Worker 응답을 대기하다 timeout → Worker에서 `TCPStore Broken pipe` 에러 → 순환 재시작.

**완화 방안**(각자의 버전·워크로드로 검증할 것. 어느 것도 범용 해결책으로 검증되지 않았다):
1. **`VLLM_ENGINE_READY_TIMEOUT_S` 상향**: 매우 큰 체크포인트의 느린 로딩이 기동 중 중단되지 않도록 한다.
2. **Ray 기반 vLLM**: Ray Cluster 구성(운영 복잡도 증가).
3. **단일 노드 배포**: H200 (141GB × 8) 또는 B200 (p6-b200.48xlarge, 180GB × 8)으로 멀티노드 PP 필요성을 제거한다.
4. **대안 엔진**: SGLang은 멀티노드 PP를 지원한다고 알려져 있으나, 의존하기 전에 자신의 모델·토폴로지에서 안정성을 검증해야 한다.

상세 내용은 [커스텀 모델 배포 가이드](../../reference-architecture/model-lifecycle/custom-model-deployment.md#pp-멀티노드-교착-문제-lessons-learned)를 참조하세요.

### 데이터 병렬화 (Data Parallelism, DP)

전체 모델 복제본을 여러 서버에 복제하여 독립적인 요청을 처리합니다. Kubernetes의 HPA(Horizontal Pod Autoscaler)와 결합하여 탄력적으로 확장할 수 있습니다.

아래의 `Pods` 메트릭(`vllm_num_requests_waiting`)은 내장 리소스 메트릭이 아니라 **커스텀 Pod 단위 메트릭**입니다. vLLM은 `/metrics` 엔드포인트에 Prometheus 텍스트 형식으로 `vllm:num_requests_waiting`을 노출하지만, HPA는 커스텀 메트릭을 `custom.metrics.k8s.io` API를 통해서만 읽습니다. 따라서 다음 YAML에는 선행 조건이 있습니다:

- Prometheus 등 메트릭 파이프라인이 vLLM `/metrics` 엔드포인트를 스크랩한다.
- 커스텀 메트릭 어댑터(예: [prometheus-adapter](https://github.com/kubernetes-sigs/prometheus-adapter))를 설치·구성하여 `vllm_num_requests_waiting`을 `custom.metrics.k8s.io`를 통해 Pod 단위 메트릭으로 노출하고 `vllm-deployment` Pod에 매핑한다.
- 어댑터와 매핑이 없으면 HPA가 메트릭을 읽지 못해 확장되지 않는다.

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
  - type: Pods          # custom.metrics.k8s.io 어댑터가 이 메트릭을 노출해야 함
    pods:
      metric:
        name: vllm_num_requests_waiting
      target:
        type: AverageValue
        averageValue: "10"
```

### 전문가 병렬화 (Expert Parallelism, EP)

MoE(Mixture-of-Experts) 모델을 위한 특수 전략입니다. 토큰이 관련 "전문가"에만 라우팅되어 불필요한 계산을 줄입니다.

```bash
vllm serve model-name --enable-expert-parallel
```

상세 내용은 [MoE 모델 서빙](./moe-model-serving.md)을 참조하세요.

## 지원 하드웨어

vLLM v0.22+ 버전은 다양한 하드웨어 가속기를 지원합니다:

<ComparisonTable
  headers={['하드웨어', '지원 수준', '주요 용도', 'AWS 인스턴스 타입']}
  rows={[
    { id: '1', cells: ['NVIDIA H100 (80GB)', '완전 지원', '프로덕션 추론', 'p5.48xlarge (H100×8)'], recommended: true },
    { id: '2', cells: ['NVIDIA H200 (141GB)', '완전 지원', '대형 모델 추론', 'p5en.48xlarge (H200×8)'] },
    { id: '3', cells: ['NVIDIA B200 (180GB)', '완전 지원', '초대형 모델 추론', 'p6-b200.48xlarge (B200×8)'] },
    { id: '4', cells: ['NVIDIA L40S (48GB)', '완전 지원', '비용 효율적 추론', 'g6e.xlarge~48xlarge (L40S×1~8)'] },
    { id: '5', cells: ['AWS Trainium2', 'vLLM-Neuron 플러그인 경유 지원', 'AWS 네이티브 가속', 'trn2.48xlarge (Trn2×16)'] },
    { id: '6', cells: ['AMD MI300X', '지원', '대안 GPU 인프라', '-'] }
  ]}
/>

**AWS EKS 권장 구성**:
- **프로덕션**: p5.48xlarge (H100 × 8, 640GB HBM3) → TP=8로 175B 모델 배포 가능
- **대형 모델**: p5en.48xlarge (H200 × 8, 1,128GB HBM3e) → TP=8로 405B 모델 배포 가능
- **비용 최적화**: g6e 인스턴스 (NVIDIA L40S, GPU당 48GB) → 7B~13B 모델, Spot 인스턴스 활용

## Multi-LoRA 서빙

vLLM은 단일 기본 모델에서 여러 LoRA 어댑터를 동시에 서빙할 수 있습니다. 하나의 GPU 세트에서 도메인별 특화 모델을 효율적으로 운영할 수 있어 GPU 리소스를 절약합니다.

### 아키텍처 개념

**기본 모델 + 어댑터 핫스왑**:
- Base Model (70B)은 GPU 메모리에 상주합니다.
- LoRA 어댑터(수백 MB~수 GB)는 요청마다 활성화됩니다. `--lora-modules`로 사전 로드했거나 CPU 어댑터 캐시에 이미 있는 어댑터는 재로딩 없이 재사용되며, 아직 등록되지 않은 어댑터만 동적으로 가져와 로드하는 더 느린 경로를 거칩니다.
- 이미 상주한 어댑터 간 전환은 기본 모델 전체 재로딩을 피합니다. 실제 전환 지연은 어댑터 크기·rank·한 배치에 함께 올라가는 어댑터 수·캐시 상주 여부에 따라 달라지므로, 특정 속도 수치는 고정 배수가 아니라 워크로드에 따른 값으로 보아야 합니다.

**메모리 효율성**:
- 기존 방식: 도메인별 전체 모델 × N개 배포 = 140GB × 5 = 700GB
- Multi-LoRA: Base Model (140GB) + 어댑터 캐시 (10GB) = 150GB

### 주요 설정 옵션

<SpecificationTable
  headers={['옵션', '설명', '기본값']}
  rows={[
    { id: '1', cells: ['--enable-lora', 'Multi-LoRA 서빙 활성화', 'False'] },
    { id: '2', cells: ['--lora-modules', '사전 로드할 LoRA 모듈 (name=path)', 'None'] },
    { id: '3', cells: ['--max-loras', '한 배치에 들어갈 수 있는 서로 다른 LoRA의 최대 수(전체 등록 수가 아님)', '1'] },
    { id: '4', cells: ['--max-cpu-loras', 'CPU 메모리에 저장할 LoRA 최대 수(--max-loras 이상, 미지정 시 --max-loras와 동일)', 'None'] },
    { id: '5', cells: ['--max-lora-rank', '지원할 최대 LoRA rank', '16'] }
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
Multi-LoRA 핫스왑 배포, 고객별 어댑터 라우팅, A/B 테스트, S3 동적 로딩 등 상세 구현은 [커스텀 모델 파이프라인 가이드](../../reference-architecture/model-lifecycle/custom-model-pipeline.md#multi-lora-핫스왑-배포)를 참조하세요.
:::

## 성능 최적화

### 양자화 (Quantization)

모델 품질과 메모리 효율성의 균형을 맞춘다.

<ComparisonTable
  headers={['양자화 방식', '가중치 저장 폭', 'FP16 대비 가중치 메모리', '체크포인트/백엔드 지원', '주요 용도']}
  rows={[
    { id: '1', cells: ['FP8 (W8A8)', '8비트', '약 50% 감소', 'Hopper/Blackwell(및 기타 FP8 지원 백엔드)', '프로덕션 추론'], recommended: true },
    { id: '2', cells: ['AWQ (INT4)', '4비트', '약 75% 감소', 'GPU; 사전 양자화된 AWQ 체크포인트', '고처리량 서비스'] },
    { id: '3', cells: ['GPTQ (INT4)', '4비트', '약 75% 감소', 'GPU; 사전 양자화된 GPTQ 체크포인트', 'GPU 메모리 제약 환경'] },
    { id: '4', cells: ['GGUF', '2~8비트(GGUF 타입별)', '타입별 상이', '내장 지원이나 매우 실험적; 단일 파일 GGUF', '이식성 / 저메모리 풋프린트'] }
  ]}
/>

**사용 예제**:

```bash
# FP8 양자화 (권장)
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ 양자화
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GGUF 양자화 (내장 지원이나 매우 실험적, 단일 파일 GGUF만 지원)
# repo_id:quant_type 형식으로 HuggingFace에서 직접 로드하고,
# GGUF 토크나이저 변환이 느리므로 --tokenizer는 기본 모델을 가리킨다.
vllm serve unsloth/Qwen3-0.6B-GGUF:Q4_K_M --tokenizer Qwen/Qwen3-0.6B

# 또는 로컬 단일 .gguf 파일 사용:
#   vllm serve ./Qwen3-0.6B-Q4_K_M.gguf --tokenizer Qwen/Qwen3-0.6B
```

표의 "FP16 대비 가중치 메모리" 열은 저장 폭에서 결정되는 값으로 모델 **가중치**에만 적용되며, KV cache와 활성화는 별도로 산정됩니다. 품질 손실과 추론 속도는 모델·양자화 방식·보정 데이터·작업에 따라 달라지는 값이므로 고정 비율로 가정하지 말고 워크로드별로 측정해야 합니다. FP8은 가중치 저장을 약 절반으로 줄입니다. INT4(AWQ, GPTQ)는 복잡한 추론 작업에서 품질이 저하될 수 있고 GGUF는 실험적이므로, 고정 수치를 가정하지 말고 품질과 속도를 워크로드별로 프로파일링해야 합니다.

### Prefix Caching

표준화된 시스템 프롬프트나 반복되는 컨텍스트에서 400% 이상의 활용률 향상을 제공합니다(vLLM 벤치마크 기준, 워크로드별 상이).

```bash
vllm serve model-name --enable-prefix-caching
```

**작동 원리**:
- 시스템 프롬프트의 KV cache가 한 번 계산되어 공유
- 동일한 프리픽스를 가진 요청들은 중복 계산을 피함
- 적중률은 애플리케이션에 따라 다름 (RAG 시스템에서 특히 효과적)

**적용 시나리오**:
- RAG 시스템 (공통 컨텍스트 재사용)
- 고정된 시스템 프롬프트 사용
- Few-shot learning (동일한 예제 반복 사용)

### Chunked Prefill

프리필(계산 집약적)과 디코드(메모리 집약적) 작업을 동일 배치에서 혼합하여 처리량과 지연 시간을 함께 개선합니다. vLLM V1에서 기본 활성화되어 있습니다.

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # 튜닝 가능
)
```

`max_num_batched_tokens`를 조정하여 토큰 간 지연(ITL), 첫 토큰까지 시간(TTFT), 처리량을 절충합니다. 셋은 서로 다른 지표이므로 같은 부하 조건에서 각각 측정합니다:
- **값이 작으면**(예: 2048) → ITL 개선. 우선 처리되는 디코드 단계를 느리게 만드는 프리필 토큰이 줄어들기 때문입니다.
- **값이 크면** → TTFT와 처리량 개선. 한 배치에서 더 많은 프리필 토큰을 처리하기 때문입니다(처리량 목적이면 vLLM은 특히 큰 GPU의 소형 모델에서 `> 8192`를 권장합니다).

### CUDA Graph

반복적인 연산 패턴을 그래프로 캡처하여 GPU 커널 실행 오버헤드를 줄인다. vLLM V1에서 기본 활성화되어 있다.

```bash
vllm serve model-name --enforce-eager  # CUDA Graph 비활성화 (디버깅용)
```

CUDA Graph는 대부분의 경우 10-20% 성능 향상을 제공하지만, 동적인 시퀀스 길이 패턴에서는 오버헤드가 발생할 수 있다.

### DeepGEMM (FP8)

NVIDIA Hopper/Blackwell GPU(SM90/SM100)에서 **FP8 block-quantized 가중치**의 행렬 곱을 가속화하는 커스텀 GEMM 커널입니다. `VLLM_USE_DEEP_GEMM`로 제어되며 현재 버전(v0.10.2+)에서 기본값이 `True`(활성화)입니다. 모델 가중치가 block-FP8 GEMM을 사용하고 DeepGEMM 백엔드가 가용할 때에만 동작하며, `--kv-cache-dtype=fp8` 플래그는 KV cache 정밀도를 설정할 뿐 그 자체로 가중치 GEMM이 DeepGEMM을 쓰게 만들지 않습니다.

```bash
# 기본 활성화됨 (v0.10.2+); Hopper/Blackwell에서 FP8 block-quantized 가중치에 적용
vllm serve model-name

# 비활성화가 필요한 경우 (워크로드에 따라 오히려 유리할 수 있음)
VLLM_USE_DEEP_GEMM=0 vllm serve model-name
# MoE 전용: VLLM_MOE_USE_DEEP_GEMM=0
```

향상 폭은 워크로드에 따라 다르고 고정 수치가 아닙니다. 일부 Blackwell 모델 유형에서는 E8M0 스케일 제약으로 DeepGEMM이 자동 비활성화되며, 일부 MoE 워크로드에서는 `VLLM_USE_DEEP_GEMM=0` 또는 `VLLM_MOE_USE_DEEP_GEMM=0`으로 끄는 것이 더 빠를 수 있습니다.

### 최적화 옵션 비교

<ComparisonTable
  headers={['최적화 기법', '주요 이점', '메커니즘 / 조건', '적용 난이도']}
  rows={[
    { id: '1', cells: ['Prefix Caching', '적중 시 처리량·TTFT', '공통 프리픽스 KV cache 재사용. 프리픽스 적중률이 높을수록 이점 증가(V1에서 0% 적중 시에도 거의 오버헤드 없음)', '낮음 (플래그 1개)'], recommended: true },
    { id: '2', cells: ['FP8 양자화', '가중치 메모리·처리량', '가중치 저장을 절반으로. 속도 향상은 모델과 FP8 지원 하드웨어에 따라 다름', '낮음 (모델/체크포인트 선택)'], recommended: true },
    { id: '3', cells: ['Chunked Prefill', 'ITL / TTFT 균형', '프리필과 디코드를 한 배치에 혼합. max_num_batched_tokens로 튜닝', '낮음 (기본 활성화)'] },
    { id: '4', cells: ['Speculative Decoding', '예측 가능한 출력에서 지연 감소', '드래프트 모델이 토큰을 제안하고 타깃이 검증. 이점은 드래프트 수용률에 따라 다름', '중간 (드래프트 모델)'] },
    { id: '5', cells: ['CUDA Graph', '커널 실행 오버헤드 감소', '반복 커널을 캡처. 동적 shape에서는 오버헤드가 생길 수 있음', '낮음 (기본 활성화)'] },
    { id: '6', cells: ['DeepGEMM', 'FP8 가중치 GEMM 가속', 'Hopper/Blackwell에서 block-FP8 가중치 커널. 워크로드에 따라 다름', '낮음 (지원 GPU에서 기본 활성화)'] }
  ]}
/>

이점 열은 각 기법이 어떤 조건에서 어느 방향으로 도움이 되는지를 나타냅니다. 공개된 vLLM 자료가 단일 벤치마크 수치가 아니라 메커니즘을 설명하므로, 이 가이드는 각 행에 고정 비율을 붙이지 않습니다. 실제 향상 폭은 자신의 모델·하드웨어·워크로드에서 측정해야 합니다.

## Reasoning·Tool-call 파서

추론 모델을 서빙할 때 vLLM은 `--reasoning-parser`로 모델 출력의 추론 구간을 `reasoning` 필드로, 나머지를 `content`로 분리합니다. 도구 호출은 `--enable-auto-tool-choice`와 `--tool-call-parser`로 활성화하며, 함수 호출은 `content`에서만 파싱됩니다. 두 파서는 모델 계열과 chat template에 맞춰 함께 지정합니다. tool-call parser만 지정하면 추론 경계가 사라져 추론이 `content`에 합쳐지는 사례가 있습니다.

추론 필드 이름은 `reasoning_content`에서 `reasoning`으로 바뀌었습니다. 예전 이름을 읽는 클라이언트는 오류 없이 빈 값을 받으므로 엔진 업그레이드 시 클라이언트도 함께 확인합니다. 모델별 파서 이름, 스트리밍·stop 조합에서 생기는 누출, structured output과 추론 구간의 상호작용, 출력 검증 계층 설계는 [추론·도구 호출 출력 무결성](./reasoning-tool-output-parsing.md)에서 설명합니다.

## 모니터링 메트릭

vLLM은 Prometheus 형식의 다양한 메트릭을 노출합니다.

### 주요 메트릭

<SpecificationTable
  headers={['메트릭', '설명', '임계값 예시']}
  rows={[
    { id: '1', cells: ['vllm:num_requests_running', '현재 처리 중인 요청 수', '< max_num_seqs'] },
    { id: '2', cells: ['vllm:num_requests_waiting', '대기 중인 요청 수', '< 50 (과부하 방지)'] },
    { id: '3', cells: ['vllm:kv_cache_usage_perc', 'KV cache 사용률 (v0.9.2+)', '70-90% (최적)'] },
    { id: '4', cells: ['vllm:num_preemptions_total', '선점된 요청 수', '< 10/min (낮을수록 좋음)'] },
    { id: '5', cells: ['vllm:prompt_tokens_total', '누적 프롬프트 토큰 수 (counter)', 'rate() 함수로 처리량 계산'] },
    { id: '6', cells: ['vllm:generation_tokens_total', '누적 생성 토큰 수 (counter)', 'rate() 함수로 처리량 계산'] },
    { id: '7', cells: ['vllm:time_to_first_token_seconds', '첫 토큰까지 시간 (TTFT)', '< 1초 (대화형 서비스)'] },
    { id: '8', cells: ['vllm:inter_token_latency_seconds', '토큰 간 지연 시간 (V1 엔진)', '< 0.1초 (실시간 스트리밍)'] },
    { id: '9', cells: ['vllm:e2e_request_latency_seconds', '엔드투엔드 요청 지연 시간', '목표 SLA 대비 측정'] }
  ]}
/>

### 선점(Preemption) 처리

KV cache 공간이 부족하면 vLLM이 요청을 선점하여 공간을 확보합니다. 다음 경고가 자주 발생하면 조치가 필요합니다:

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

**대응 방안**:
1. `gpu_memory_utilization` 증가 (0.9 → 0.95)
2. `max_num_seqs` 또는 `max_num_batched_tokens` 감소
3. `tensor_parallel_size` 증가로 GPU당 메모리 확보
4. `max_model_len` 감소 (실제 워크로드에 맞게)

:::info 상세 가이드
Prometheus + Grafana 기반 모니터링 스택 구성, 알람 임계값 설정, 대시보드 템플릿은 [모니터링 스택 구성 가이드](../../reference-architecture/integrations/monitoring-observability-setup.md)를 참조하세요.
:::

## 관련 문서

### 실전 배포
- **[커스텀 모델 배포](../../reference-architecture/model-lifecycle/custom-model-deployment.md)**: Kubernetes 배포 YAML, LWS 멀티노드, S3 모델 캐시, vLLM PP 멀티노드 제약 상세, 코딩 특화 모델 배포 가이드
- **[커스텀 모델 파이프라인](../../reference-architecture/model-lifecycle/custom-model-pipeline.md)**: Multi-LoRA 핫스왑, 고객별 어댑터 라우팅, A/B 테스트, S3 동적 로딩
- **[모니터링 스택 구성](../../reference-architecture/integrations/monitoring-observability-setup.md)**: Prometheus + Grafana 설정, 알람 임계값, 대시보드 템플릿

### 관련 기술
- **[llm-d EKS Auto Mode](./llm-d-eks-automode.md)**: vLLM + llm-d 연동 통한 Disaggregated Serving
- **[추론·도구 호출 출력 무결성](./reasoning-tool-output-parsing.md)**: reasoning·tool-call 파서 조합, 스트리밍 누출, 출력 검증 계층
- **[MoE 모델 서빙](./moe-model-serving.md)**: Expert Parallelism, GLM-5/Kimi K2.5 배포 전략
- **[GPU 리소스 관리](../gpu-infrastructure/gpu-resource-management.md)**: Karpenter, KEDA, GPU Operator 구성

### 참고 자료
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Bifrost, vLLM, Langfuse, Milvus 등 GenAI 컴포넌트 배포 자동화
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): llm-d, Karpenter, RAG 워크플로우 포함 종합 아키텍처
- [vLLM 공식 문서](https://docs.vllm.ai): 최적화 및 튜닝 가이드
- [vLLM Kubernetes 배포 가이드](https://docs.vllm.ai/en/stable/deployment/k8s.html)
