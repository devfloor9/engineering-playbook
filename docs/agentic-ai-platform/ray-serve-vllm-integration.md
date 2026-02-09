---
title: "Ray Serve와 vLLM 통합 아키텍처"
sidebar_label: "Ray Serve + vLLM"
description: "Ray Serve 기반 분산 추론 아키텍처와 vLLM 통합 전략, 자동 스케일링, 프로덕션 배포 패턴"
sidebar_position: 6
date: 2025-02-09
---

# Ray Serve와 vLLM 통합 아키텍처

> **📌 기준 버전**: Ray 2.44.0+, vLLM v0.15.1, KubeRay Operator 1.2+

대규모 LLM 서빙 환경에서 단일 vLLM 인스턴스만으로는 엔터프라이즈급 요구사항을 충족하기 어렵다. 다중 모델 관리, 동적 스케일링, 복잡한 전처리/후처리 파이프라인, 그리고 장애 복구가 필요한 프로덕션 환경에서는 분산 서빙 프레임워크가 필수다. Ray Serve는 이러한 요구사항을 해결하는 분산 모델 서빙 라이브러리로, vLLM과 결합하면 각각의 강점을 극대화할 수 있다.

본 문서에서는 Ray Serve의 핵심 아키텍처를 이해하고, vLLM과의 통합이 필요한 시나리오를 식별하며, Amazon EKS 환경에서의 실무 배포 패턴을 다룬다.

## Ray Serve 핵심 아키텍처

### 분산 서빙의 필요성

단일 vLLM 인스턴스 배포는 다음 상황에서 한계에 직면한다.

첫째, 다중 모델 서빙이다. 서로 다른 크기와 특성의 모델들을 동시에 서비스해야 하는 경우, 각 모델에 대한 개별 엔드포인트 관리, 버전 관리, 트래픽 라우팅이 복잡해진다.

둘째, 복합 추론 파이프라인이다. 단순 텍스트 생성을 넘어 임베딩 생성, 리랭킹, RAG 파이프라인, 멀티모달 처리 등 여러 모델과 전처리/후처리 로직이 연결된 워크플로우가 필요하다.

셋째, 세밀한 자동 스케일링이다. Kubernetes HPA는 Pod 수준에서만 작동하지만, GPU 활용률, 요청 큐 길이, 배치 크기 등 추론 특화 메트릭 기반의 스케일링이 필요하다.

넷째, 장애 격리와 복구다. 특정 모델의 장애가 전체 서비스에 영향을 미치지 않도록 격리하고, 자동으로 복구하는 메커니즘이 필요하다.

### Ray Serve 구성요소

Ray Serve는 Ray 분산 컴퓨팅 프레임워크 위에 구축된 모델 서빙 라이브러리다.

**Deployment**: 스케일링 가능한 서비스 단위. 각 Deployment는 독립적인 복제본(replica)을 가지며, 자체적인 자동 스케일링 정책을 설정할 수 있다.

**Replica**: Deployment의 실제 인스턴스. 요청을 처리하는 워커로, 수평 확장의 기본 단위다.

**Ingress Deployment**: HTTP 요청을 받아 적절한 Deployment로 라우팅하는 진입점. 복잡한 요청 파이프라인을 오케스트레이션한다.

**ServeHandle**: Deployment 간 내부 통신을 위한 인터페이스. 비동기 호출과 배치 처리를 지원한다.

```python
from ray import serve
from ray.serve.handle import DeploymentHandle

@serve.deployment(num_replicas=2, ray_actor_options={"num_gpus": 1})
class VLLMDeployment:
    def __init__(self, model_id: str):
        from vllm import LLM
        self.llm = LLM(model=model_id)

    async def generate(self, prompt: str, **kwargs):
        outputs = self.llm.generate([prompt], **kwargs)
        return outputs[0].outputs[0].text

@serve.deployment
class Router:
    def __init__(self, model_7b: DeploymentHandle, model_70b: DeploymentHandle):
        self.model_7b = model_7b
        self.model_70b = model_70b

    async def __call__(self, request):
        data = await request.json()
        model_size = data.get("model_size", "7b")
        prompt = data["prompt"]

        if model_size == "70b":
            return await self.model_70b.generate.remote(prompt)
        return await self.model_7b.generate.remote(prompt)
```

## 언제 Ray Serve + vLLM 통합이 필요한가

### 단독 vLLM이 적합한 경우

모든 상황에서 Ray Serve가 필요하지는 않다. 다음 조건을 모두 충족하면 단독 vLLM 배포가 더 효율적이다.

- 단일 모델만 서빙
- 단순 텍스트 생성 API만 필요
- Kubernetes HPA로 충분한 스케일링
- 복잡한 전처리/후처리 없음
- 운영 복잡도 최소화 우선

이 경우 vLLM의 OpenAI 호환 서버를 직접 배포하고, Kubernetes Service/Ingress와 HPA로 관리하는 것이 간단하다.

### Ray Serve 통합이 필요한 경우

다음 요구사항 중 하나라도 해당되면 Ray Serve 통합을 고려해야 한다.

**다중 모델 게이트웨이**: 여러 크기/종류의 모델을 단일 엔드포인트로 통합 관리. 모델별 버전 관리, A/B 테스트, 카나리 배포가 필요한 경우.

```python
@serve.deployment
class ModelGateway:
    def __init__(self):
        self.models = {
            "llama-7b": VLLMDeployment.bind("meta-llama/Llama-3.2-7B"),
            "llama-70b": VLLMDeployment.bind("meta-llama/Llama-3.3-70B-Instruct"),
            "qwen-32b": VLLMDeployment.bind("Qwen/Qwen3-32B"),
        }

    async def route(self, model_name: str, prompt: str):
        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}")
        return await self.models[model_name].generate.remote(prompt)
```

**RAG 파이프라인**: 임베딩 생성, 벡터 검색, 컨텍스트 구성, LLM 생성을 하나의 서비스로 통합.

```python
@serve.deployment
class RAGPipeline:
    def __init__(self, embedder: DeploymentHandle, llm: DeploymentHandle):
        self.embedder = embedder
        self.llm = llm
        self.vector_db = MilvusClient()

    async def query(self, question: str):
        # 1. 질문 임베딩 생성
        embedding = await self.embedder.embed.remote(question)

        # 2. 유사 문서 검색
        docs = self.vector_db.search(embedding, top_k=5)

        # 3. 컨텍스트 구성 및 LLM 생성
        context = "\n".join([doc.text for doc in docs])
        prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"

        return await self.llm.generate.remote(prompt)
```

**세밀한 자동 스케일링**: GPU 활용률, 큐 길이, 지연 시간 기반 스케일링 정책.

```python
@serve.deployment(
    autoscaling_config={
        "min_replicas": 1,
        "max_replicas": 10,
        "target_ongoing_requests": 5,  # 복제본당 목표 동시 요청
        "upscale_delay_s": 30,
        "downscale_delay_s": 300,
    },
    ray_actor_options={"num_gpus": 1}
)
class AutoScaledLLM:
    ...
```

**복합 에이전트 워크플로우**: 여러 LLM 호출, 도구 사용, 조건부 분기가 포함된 에이전틱 워크플로우.

## Kubernetes에서의 Ray Serve 배포

### KubeRay Operator

KubeRay는 Kubernetes에서 Ray 클러스터를 관리하는 오퍼레이터다. RayService CRD를 통해 Ray Serve 애플리케이션을 선언적으로 배포한다.

```yaml
apiVersion: ray.io/v1
kind: RayService
metadata:
  name: llm-serving
  namespace: ray-system
spec:
  serviceUnhealthySecondThreshold: 900
  deploymentUnhealthySecondThreshold: 300
  serveConfigV2: |
    applications:
      - name: llm-app
        route_prefix: /
        import_path: serve_app:deployment
        deployments:
          - name: VLLMDeployment
            num_replicas: 2
            ray_actor_options:
              num_gpus: 1
            user_config:
              model_id: "meta-llama/Llama-3.2-7B-Instruct"
  rayClusterConfig:
    rayVersion: '2.44.0'
    headGroupSpec:
      rayStartParams:
        dashboard-host: '0.0.0.0'
      template:
        spec:
          containers:
            - name: ray-head
              image: rayproject/ray-ml:2.44.0-py311-gpu
              resources:
                limits:
                  cpu: "4"
                  memory: "16Gi"
              ports:
                - containerPort: 6379
                  name: gcs-server
                - containerPort: 8265
                  name: dashboard
                - containerPort: 8000
                  name: serve
    workerGroupSpecs:
      - replicas: 2
        minReplicas: 1
        maxReplicas: 10
        groupName: gpu-worker
        rayStartParams: {}
        template:
          spec:
            nodeSelector:
              karpenter.sh/instance-family: g6e
            containers:
              - name: ray-worker
                image: rayproject/ray-ml:2.44.0-py311-gpu
                resources:
                  limits:
                    cpu: "8"
                    memory: "32Gi"
                    nvidia.com/gpu: "1"
            tolerations:
              - key: nvidia.com/gpu
                operator: Exists
                effect: NoSchedule
```

### vLLM Ray Serve 통합 배포

[Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks) 아키텍처에서는 Ray Serve를 통한 분산 추론을 구현한다.

:::info vLLM v0.15.x 호환성
vLLM v0.15.1은 Ray Serve와의 통합이 크게 개선되었습니다:
- **자동 텐서 병렬화**: Ray의 GPU 할당에 따라 자동 설정
- **Multi-LoRA on Ray**: Ray Serve 레플리카별 LoRA 어댑터 동적 로딩
- **향상된 메트릭**: Prometheus 호환 메트릭 자동 노출
:::

```python
# serve_app.py
import os
from typing import Dict, List, Optional
from ray import serve
from vllm import LLM, SamplingParams

@serve.deployment(
    ray_actor_options={"num_gpus": 1},
    autoscaling_config={
        "min_replicas": 1,
        "max_replicas": 8,
        "target_ongoing_requests": 3,
    }
)
class VLLMDeployment:
    def __init__(self, model_id: str, **vllm_kwargs):
        self.model_id = model_id
        self.llm = LLM(
            model=model_id,
            trust_remote_code=True,
            **vllm_kwargs
        )

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.95,
    ) -> str:
        sampling_params = SamplingParams(
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
        outputs = self.llm.generate([prompt], sampling_params)
        return outputs[0].outputs[0].text

    async def batch_generate(
        self,
        prompts: List[str],
        **kwargs
    ) -> List[str]:
        sampling_params = SamplingParams(**kwargs)
        outputs = self.llm.generate(prompts, sampling_params)
        return [o.outputs[0].text for o in outputs]

    def reconfigure(self, config: Dict):
        """동적 설정 업데이트를 위한 메서드"""
        pass

# 배포 구성
deployment = VLLMDeployment.bind(
    model_id=os.environ.get("MODEL_ID", "meta-llama/Llama-3.2-7B-Instruct"),
    gpu_memory_utilization=0.9,
    max_model_len=4096,
)
```

### 다중 GPU 텐서 병렬 배포

대규모 모델의 경우 Ray의 placement group을 활용하여 다중 GPU 텐서 병렬화를 구성한다.

```python
from ray import serve
from ray.util.placement_group import placement_group
from ray.util.scheduling_strategies import PlacementGroupSchedulingStrategy

@serve.deployment(
    ray_actor_options={
        "num_gpus": 4,
        "scheduling_strategy": PlacementGroupSchedulingStrategy(
            placement_group=placement_group([{"GPU": 4}]),
            placement_group_capture_child_tasks=True,
        )
    }
)
class LargeModelDeployment:
    def __init__(self):
        from vllm import LLM
        self.llm = LLM(
            model="meta-llama/Llama-3.3-70B-Instruct",
            tensor_parallel_size=4,
            gpu_memory_utilization=0.9,
        )

    async def generate(self, prompt: str, **kwargs):
        outputs = self.llm.generate([prompt], **kwargs)
        return outputs[0].outputs[0].text
```

## 자동 스케일링 전략

### Ray Serve 오토스케일링 개선

최신 Ray 버전에서의 오토스케일링 주요 개선:

- **GPU-aware 스케일링**: GPU 활용률 기반 레플리카 수 조정
- **예측적 스케일링**: 요청 패턴 학습 기반 선제적 스케일아웃
- **Karpenter 통합**: Ray 노드 요청 시 Karpenter가 최적의 GPU 인스턴스 자동 프로비저닝

### Ray Serve 자동 스케일링

Ray Serve의 자동 스케일링은 요청 기반으로 동작한다. Kubernetes HPA와 달리 추론 워크로드에 특화된 메트릭을 사용한다.

```python
autoscaling_config = {
    # 복제본 수 범위
    "min_replicas": 1,
    "max_replicas": 20,

    # 스케일링 트리거
    "target_ongoing_requests": 5,  # 복제본당 목표 동시 요청

    # 스케일링 지연 (안정성)
    "upscale_delay_s": 30,    # 확장 전 대기
    "downscale_delay_s": 300,  # 축소 전 대기

    # 스케일링 속도
    "upscaling_factor": 1.0,   # 한 번에 100%까지 확장
    "downscaling_factor": 0.5, # 한 번에 50%까지 축소
}
```

### Karpenter와의 통합

Ray 워커 노드는 Karpenter로 동적 프로비저닝한다. Ray 클러스터 확장 시 필요한 GPU 노드를 자동으로 생성한다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: ray-gpu-workers
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/instance-family
          operator: In
          values: ["g6e", "g5", "p4d"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 100
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
```

### 계층적 스케일링 아키텍처

1. **Ray Serve 수준**: 복제본 자동 스케일링 (요청 기반)
2. **Ray 클러스터 수준**: 워커 노드 자동 스케일링 (리소스 기반)
3. **Kubernetes 수준**: Karpenter 노드 프로비저닝 (Pod 스케줄링 기반)

```
요청 증가 → Ray Serve 복제본 확장 → Ray 워커 부족 →
Ray Autoscaler가 워커 요청 → Pending Pod 발생 → Karpenter가 노드 프로비저닝
```

## 성능 비교 및 선택 가이드

### 아키텍처별 특성 비교

| 특성 | 단독 vLLM | Ray Serve + vLLM |
|-----|---------|-----------------|
| 운영 복잡도 | 낮음 | 높음 |
| 초기 설정 비용 | 최소 | 상당함 |
| 다중 모델 지원 | 모델당 별도 배포 | 통합 관리 |
| 스케일링 세분화 | Pod 수준 | 복제본 수준 |
| 복합 파이프라인 | 외부 오케스트레이션 필요 | 네이티브 지원 |
| 장애 격리 | Pod 단위 | Deployment 단위 |
| 리소스 오버헤드 | 최소 | Ray 클러스터 오버헤드 |
| 지연 시간 | 최소 | 약간의 오버헤드 |

### 의사결정 플로우차트

```
시작
  │
  ├─ 단일 모델만 서빙? ──Yes──→ 복잡한 파이프라인? ──No──→ 단독 vLLM
  │       │                            │
  │      No                           Yes
  │       │                            │
  │       ▼                            ▼
  │   Ray Serve + vLLM          Ray Serve + vLLM
  │
  ├─ 세밀한 자동 스케일링 필요? ──Yes──→ Ray Serve + vLLM
  │       │
  │      No
  │       │
  ├─ 운영 복잡도 최소화 우선? ──Yes──→ 단독 vLLM
  │       │
  │      No
  │       │
  └──────→ Ray Serve + vLLM
```

### 워크로드별 권장 아키텍처

| 워크로드 | 권장 아키텍처 | 이유 |
|---------|-------------|-----|
| 챗봇 API | 단독 vLLM | 단순 요청-응답, 낮은 복잡도 |
| 다중 모델 게이트웨이 | Ray Serve + vLLM | 통합 라우팅, 버전 관리 |
| RAG 시스템 | Ray Serve + vLLM | 임베딩-검색-생성 파이프라인 |
| 에이전트 워크플로우 | Ray Serve + vLLM | 복합 추론, 도구 호출 |
| 배치 처리 | Ray Serve + vLLM | 대규모 병렬 처리 |
| 실시간 저지연 | 단독 vLLM | 최소 오버헤드 |

## 모니터링 및 관찰성

### Ray Dashboard

Ray는 클러스터 상태, 리소스 사용량, Serve 애플리케이션 메트릭을 보여주는 대시보드를 제공한다.

```yaml
# Ray Dashboard Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ray-dashboard
  namespace: ray-system
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
  rules:
    - host: ray-dashboard.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: llm-serving-head-svc
                port:
                  number: 8265
```

### Prometheus 메트릭 통합

Ray Serve는 Prometheus 형식의 메트릭을 노출한다.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ray-serve-monitor
  namespace: ray-system
spec:
  selector:
    matchLabels:
      ray.io/serve: "true"
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

주요 메트릭:
- `ray_serve_deployment_replica_starts`: 복제본 시작 횟수
- `ray_serve_deployment_queued_queries`: 대기 중인 쿼리 수
- `ray_serve_deployment_request_counter`: 총 요청 수
- `ray_serve_deployment_error_counter`: 에러 수
- `ray_serve_deployment_processing_latency_ms`: 처리 지연 시간

### Grafana 대시보드 예시

```json
{
  "panels": [
    {
      "title": "Request Rate by Deployment",
      "expr": "sum(rate(ray_serve_deployment_request_counter[5m])) by (deployment)"
    },
    {
      "title": "P99 Latency",
      "expr": "histogram_quantile(0.99, rate(ray_serve_deployment_processing_latency_ms_bucket[5m]))"
    },
    {
      "title": "Queue Depth",
      "expr": "sum(ray_serve_deployment_queued_queries) by (deployment)"
    },
    {
      "title": "GPU Utilization",
      "expr": "avg(DCGM_FI_DEV_GPU_UTIL) by (pod)"
    }
  ]
}
```

## 프로덕션 배포 체크리스트

### Ray Serve + vLLM 통합 배포 시 확인사항

1. **클러스터 구성**
   - KubeRay Operator 설치 및 CRD 등록
   - Ray 버전과 vLLM 버전 호환성 확인
   - GPU 드라이버 및 CUDA 버전 검증

2. **리소스 계획**
   - Head 노드: CPU 전용, 클러스터 조율
   - Worker 노드: GPU 탑재, 실제 추론 실행
   - 메모리 요구사항 산정 (Ray 오버헤드 포함)

3. **네트워킹**
   - Ray GCS 포트(6379) 내부 통신 허용
   - Serve 포트(8000) 외부 노출
   - Dashboard 포트(8265) 접근 제어

4. **자동 스케일링**
   - Ray Serve autoscaling_config 튜닝
   - Karpenter NodePool GPU 제한 설정
   - 스케일링 지연 시간 최적화

5. **모니터링**
   - Ray Dashboard 접근 구성
   - Prometheus 메트릭 수집
   - 알림 규칙 설정

6. **장애 복구**
   - Head 노드 장애 시 클러스터 재시작 전략
   - 워커 노드 선점 대응
   - 모델 체크포인트 복구

## 참고 자료

- [Ray Serve 공식 문서](https://docs.ray.io/en/latest/serve/index.html)
- [KubeRay GitHub](https://github.com/ray-project/kuberay)
- [vLLM 공식 문서](https://docs.vllm.ai/en/latest/)
- [Scalable Model Inference on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks)
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit)
