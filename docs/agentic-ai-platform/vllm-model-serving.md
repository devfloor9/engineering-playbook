---
title: "vLLM 기반 FM 배포 및 성능 최적화"
sidebar_label: "5. vLLM 모델 서빙"
description: "vLLM을 활용한 Foundation Model 배포, Kubernetes 통합, 성능 최적화 전략"
category: "genai-aiml"
sidebar_position: 6
last_update:
  date: 2025-02-09
  author: devfloor9
tags: [vllm, model-serving, gpu, inference, optimization, foundation-model, eks]
---

# vLLM 기반 Foundation Model 배포 및 성능 최적화

vLLM은 PagedAttention 알고리즘을 통해 KV 캐시 메모리 낭비를 60-80% 줄이고, 연속 배칭(Continuous Batching)으로 기존 대비 2-24배의 처리량 향상을 제공하는 고성능 LLM 추론 엔진이다. Meta, Mistral AI, Cohere, IBM 등 주요 기업들이 프로덕션 환경에서 활용하고 있으며, OpenAI 호환 API를 제공하여 기존 애플리케이션의 마이그레이션이 용이하다.

> **📌 현재 버전**: vLLM v0.15.1 (2025-02-04 릴리즈). 본 문서의 코드 예시는 v0.15.x 기준입니다.

본 문서에서는 Amazon EKS 환경에서 vLLM을 배포하고 운영하기 위한 실무 가이드를 제공한다. GPU 메모리 계산, 병렬화 전략 선택, Kubernetes 배포 패턴, 그리고 프로덕션 환경에서의 성능 튜닝 방법을 다룬다.

## 핵심 아키텍처 이해

### PagedAttention과 메모리 효율성

전통적인 LLM 서빙에서 가장 큰 병목은 KV 캐시 메모리 관리다. Transformer 아키텍처의 자기회귀적 특성으로 인해 각 요청은 이전 토큰들의 키-값 쌍을 저장해야 하며, 이 KV 캐시는 입력 시퀀스 길이와 동시 사용자 수에 비례하여 선형적으로 증가한다.

vLLM의 PagedAttention은 운영체제의 가상 메모리 관리에서 영감을 받아 KV 캐시를 비연속적인 블록으로 저장한다. 이를 통해 메모리 단편화를 제거하고, 동적으로 메모리를 할당하여 GPU 활용률을 극대화한다. 기존 방식에서 발생하던 60-80%의 메모리 낭비가 사라지며, 동일한 하드웨어에서 더 많은 동시 요청을 처리할 수 있다.

### 연속 배칭(Continuous Batching)

정적 배칭은 고정된 수의 요청이 모일 때까지 대기한 후 처리한다. 배치 크기가 32라면, 31번째 요청은 32번째 요청이 도착할 때까지 기다려야 한다. 요청이 불규칙하게 도착하면 GPU가 부분적으로만 활용되어 처리량이 저하된다.

vLLM의 연속 배칭은 배치 경계를 완전히 제거한다. 스케줄러가 반복(iteration) 수준에서 동작하여, 완료된 요청은 즉시 제거하고 새로운 요청을 동적으로 추가한다. 이를 통해 GPU가 항상 최대 용량으로 작동하며, 평균 지연 시간과 처리량 모두 개선된다.

## GPU 메모리 요구사항 계산

모델 배포 전 필요한 GPU 메모리를 정확히 계산해야 한다. 메모리 사용량은 모델 가중치, 활성화, KV 캐시의 세 가지 주요 구성요소로 나뉜다.

```
필요 GPU 메모리 = 모델 가중치 + 비torch 메모리 + PyTorch 활성화 피크 메모리 + (배치당 KV 캐시 메모리 × 배치 크기)
```

모델 가중치 메모리는 파라미터 수와 정밀도에 따라 결정된다.

| 정밀도 | 파라미터당 바이트 | 70B 모델 메모리 |
|--------|------------------|-----------------|
| FP32 | 4 | 280GB |
| FP16/BF16 | 2 | 140GB |
| INT8 | 1 | 70GB |
| INT4 | 0.5 | 35GB |

70B 파라미터 모델을 FP16으로 배포하려면 가중치만 140GB가 필요하다. 단일 GPU로는 불가능하며, 다중 GPU 텐서 병렬화가 필수다. 동일 모델을 INT4 양자화하면 35GB로 줄어들어 단일 A100 80GB나 H100에서 KV 캐시 여유 공간과 함께 배포 가능하다.

## 병렬화 전략

### 텐서 병렬화(Tensor Parallelism)

텐서 병렬화는 각 모델 레이어 내에서 파라미터를 여러 GPU에 분산한다. 단일 노드 내에서 대규모 모델을 배포할 때 가장 일반적인 전략이다.

적용 시점:

- 모델이 단일 GPU에 맞지 않을 때
- GPU당 메모리 압력을 줄여 KV 캐시 공간을 확보하고 처리량을 높이려 할 때

```python
from vllm import LLM

# 4개 GPU에 모델 분산
llm = LLM(model="meta-llama/Llama-3.3-70B-Instruct", tensor_parallel_size=4)
```

텐서 병렬화의 제약사항은 어텐션 헤드 수다. tensor_parallel_size는 모델의 어텐션 헤드 수의 약수여야 한다.

### 파이프라인 병렬화(Pipeline Parallelism)

파이프라인 병렬화는 모델 레이어를 여러 GPU에 순차적으로 분산한다. 토큰이 파이프라인을 통해 순차적으로 흐른다.

적용 시점:

- 텐서 병렬화를 최대로 활용했지만 추가 GPU가 필요할 때
- 다중 노드 배포가 필요할 때

```bash
# 4개 GPU를 텐서 병렬로, 2개 노드를 파이프라인 병렬로
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### 데이터 병렬화(Data Parallelism)

데이터 병렬화는 전체 모델 복제본을 여러 서버에 복제하여 독립적인 요청을 처리한다. Kubernetes의 HPA(Horizontal Pod Autoscaler)와 결합하여 탄력적으로 확장할 수 있다.

### 전문가 병렬화(Expert Parallelism)

MoE(Mixture-of-Experts) 모델을 위한 특수 전략이다. 토큰이 관련 "전문가"에만 라우팅되어 불필요한 계산을 줄인다. `--enable-expert-parallel` 플래그로 활성화한다.

## 지원 하드웨어 확장

vLLM v0.15.x는 다양한 하드웨어 가속기를 지원합니다:

| 하드웨어 | 지원 수준 | 주요 용도 |
|----------|----------|----------|
| NVIDIA GPU (A100, H100, H200) | 완전 지원 | 프로덕션 추론 |
| AMD GPU (MI300X) | 지원 | 대안 GPU 인프라 |
| Intel GPU (Gaudi 2/3) | 지원 | 비용 효율적 추론 |
| Google TPU | 지원 | GCP 환경 |
| AWS Trainium/Inferentia | 지원 | AWS 네이티브 가속 |

AWS EKS 환경에서는 NVIDIA GPU가 기본 선택이며, 비용 최적화를 위해 AWS Trainium2 인스턴스(`trn2.48xlarge`)도 고려할 수 있습니다.

## Kubernetes 배포

### 기본 배포 구성

다음은 AWS EKS에서 vLLM을 배포하는 기본 구성이다. [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit)의 패턴을 참고했다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-32b-fp8
  namespace: vllm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qwen3-32b-fp8
  template:
    metadata:
      labels:
        app: qwen3-32b-fp8
    spec:
      nodeSelector:
        karpenter.sh/instance-family: g6e
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.15.1
          command: ["vllm", "serve"]
          args:
            - Qwen/Qwen3-32B-FP8
            - --served-model-name=qwen3-32b-fp8
            - --trust-remote-code
            - --gpu-memory-utilization=0.95
            - --max-model-len=32768
            - --enable-auto-tool-choice
            - --tool-call-parser=hermes
          env:
            - name: HUGGING_FACE_HUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-token
                  key: token
          ports:
            - name: http
              containerPort: 8000
          resources:
            requests:
              cpu: 3
              memory: 24Gi
              nvidia.com/gpu: 1
            limits:
              nvidia.com/gpu: 1
          volumeMounts:
            - name: huggingface-cache
              mountPath: /root/.cache/huggingface
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: huggingface-cache
          persistentVolumeClaim:
            claimName: huggingface-cache
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: "16Gi"
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
---
apiVersion: v1
kind: Service
metadata:
  name: qwen3-32b-fp8
  namespace: vllm
spec:
  selector:
    app: qwen3-32b-fp8
  ports:
    - name: http
      port: 8000
```

### 핵심 구성 파라미터

**gpu-memory-utilization**: KV 캐시에 사전 할당할 GPU VRAM 비율. 기본값 0.9, 최적 성능을 위해 0.95까지 설정 가능. OOM 없이 최대값을 찾아야 한다.

**max-model-len**: 지원할 최대 시퀀스 길이. KV 캐시 크기에 직접 영향을 미친다. 실제 워크로드에 맞게 조정한다.

**max-num-seqs**: 동시 처리할 최대 시퀀스 수. 기본값 256-1024. 메모리와 처리량의 트레이드오프.

**tensor-parallel-size**: 텐서 병렬화에 사용할 GPU 수.

### 다중 GPU 텐서 병렬 배포

70B 이상 대규모 모델은 다중 GPU 구성이 필수다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llama-70b-instruct
  namespace: vllm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: llama-70b-instruct
  template:
    metadata:
      labels:
        app: llama-70b-instruct
    spec:
      nodeSelector:
        karpenter.sh/instance-family: p5
      hostNetwork: true
      hostIPC: true
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.15.1
          command: ["vllm", "serve"]
          args:
            - meta-llama/Llama-3.3-70B-Instruct
            - --tensor-parallel-size=4
            - --gpu-memory-utilization=0.90
            - --max-model-len=8192
          env:
            - name: HUGGING_FACE_HUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-token
                  key: token
            - name: NCCL_DEBUG
              value: "INFO"
          resources:
            requests:
              nvidia.com/gpu: 4
            limits:
              nvidia.com/gpu: 4
          volumeMounts:
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: "32Gi"
```

**중요**: 텐서 병렬 추론을 위해 `hostIPC: true`와 충분한 공유 메모리(`/dev/shm`)가 필요하다.

## 성능 최적화 전략

### 양자화(Quantization)

모델 품질과 메모리 효율성의 균형을 맞춘다.

```bash
# FP8 양자화 모델 사용
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ 양자화
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GPTQ 양자화
vllm serve TheBloke/Llama-2-70B-GPTQ --quantization gptq
```

FP8은 품질 저하가 거의 없으면서 메모리를 절반으로 줄인다. INT4(AWQ, GPTQ)는 복잡한 추론 작업에서 품질 저하가 발생할 수 있으므로 워크로드별 프로파일링이 필요하다.

### Multi-LoRA 서빙

vLLM은 단일 기본 모델에서 여러 LoRA 어댑터를 동시에 서빙할 수 있습니다:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules customer-support=./lora-cs finance=./lora-fin \
  --max-loras 4
```

이를 통해 하나의 GPU 세트에서 도메인별 특화 모델을 효율적으로 운영할 수 있어 GPU 리소스를 크게 절약합니다.

### 프리픽스 캐싱(Prefix Caching)

표준화된 시스템 프롬프트나 반복되는 컨텍스트에서 400% 이상의 활용률 향상을 제공한다.

```bash
vllm serve model-name --enable-prefix-caching
```

시스템 프롬프트의 KV 캐시가 한 번 계산되어 공유되므로, 동일한 프리픽스를 가진 요청들은 중복 계산을 피할 수 있다. 적중률은 애플리케이션에 따라 다르다.

### 추측적 디코딩(Speculative Decoding)

예측 가능한 출력에서 2-3배 속도 향상을 제공한다. 작은 드래프트 모델이 토큰을 예측하고, 메인 모델이 검증한다.

```bash
vllm serve large-model \
  --speculative-model small-draft-model \
  --num-speculative-tokens 5
```

가변적인 프롬프트에서는 캐시 유지 오버헤드가 이점을 초과할 수 있다.

### Chunked Prefill

프리필(계산 집약적)과 디코드(메모리 집약적) 작업을 동일 배치에서 혼합하여 처리량과 지연 시간 모두 개선한다. vLLM V1에서 기본 활성화되어 있다.

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # 튜닝 가능
)
```

max_num_batched_tokens를 조정하여 TTFT(Time To First Token)와 처리량의 균형을 맞춘다.

## 모니터링 및 관찰성

### Prometheus 메트릭

vLLM은 다양한 Prometheus 메트릭을 노출한다.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vllm-monitor
  namespace: vllm
spec:
  selector:
    matchLabels:
      app: vllm
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

주요 모니터링 지표:

- `vllm:num_requests_running`: 현재 처리 중인 요청 수
- `vllm:num_requests_waiting`: 대기 중인 요청 수
- `vllm:gpu_cache_usage_perc`: GPU KV 캐시 사용률
- `vllm:num_preemptions_total`: 선점된 요청 수 (높으면 메모리 부족)

### 선점(Preemption) 처리

KV 캐시 공간이 부족하면 vLLM이 요청을 선점하여 공간을 확보한다. 다음 경고가 자주 발생하면 조치가 필요하다.

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

대응 방안:

- `gpu_memory_utilization` 증가
- `max_num_seqs` 또는 `max_num_batched_tokens` 감소
- `tensor_parallel_size` 증가로 GPU당 메모리 확보
- `max_model_len` 감소

## 프로덕션 배포 체크리스트

배포 전 확인사항:

1. GPU 메모리 요구사항을 계산하고 적절한 인스턴스 타입 선택
2. 양자화 전략 결정 및 품질-효율성 트레이드오프 검증
3. 워크로드에 맞는 max_model_len 설정
4. 텐서 병렬화 필요 여부 및 GPU 수 결정
5. 공유 메모리(/dev/shm) 충분히 할당
6. Prometheus 메트릭 수집 및 대시보드 구성
7. HPA 설정으로 탄력적 확장 구성
8. PVC를 통한 모델 캐시 영속화

## 참고 자료

- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): LiteLLM, vLLM, Langfuse, Milvus 등 GenAI 컴포넌트 배포 자동화
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): llm-d, Karpenter, RAG 워크플로우 포함 종합 아키텍처
- [vLLM 공식 문서](https://docs.vllm.ai): 최적화 및 튜닝 가이드
- [vLLM Kubernetes 배포 가이드](https://docs.vllm.ai/en/stable/deployment/k8s.html)
