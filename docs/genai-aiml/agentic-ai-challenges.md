---
title: "Agentic AI Platform 기술적 도전과제와 Karpenter 기반 해결 방안"
sidebar_label: "기술적 도전과제"
description: "Agentic AI Platform 구축 시 직면하는 4가지 핵심 도전과제와 Karpenter를 중심으로 한 EKS 기반 해결 방안"
tags: [eks, kubernetes, genai, agentic-ai, gpu, infrastructure, challenges, karpenter]
category: "genai-aiml"
date: 2025-02-05
authors: [devfloor9]
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

> 📅 **작성일**: 2025-02-05 | ⏱️ **읽는 시간**: 약 25분

Agentic AI Platform을 구축하고 운영하는 과정에서 플랫폼 엔지니어와 아키텍트는 다양한 기술적 도전과제에 직면합니다. 이 문서에서는 4가지 핵심 도전과제를 분석하고, **Karpenter를 중심으로 한 EKS 기반 해결 방안**을 제시합니다.

## 개요

Frontier Model(최신 대규모 언어 모델)을 활용한 Agentic AI 시스템은 기존 웹 애플리케이션과는 근본적으로 다른 인프라 요구사항을 가집니다. 특히 **GPU 리소스의 동적 프로비저닝과 비용 최적화**가 핵심 과제이며, 이를 해결하기 위해 **Karpenter**가 가장 효과적인 솔루션입니다.

```mermaid
graph TB
    subgraph "4가지 핵심 도전과제"
        C1["🖥️ GPU 모니터링 및<br/>리소스 스케줄링"]
        C2["🔀 Agentic AI 요청<br/>동적 라우팅 및 스케일링"]
        C3["📊 토큰/세션 수준<br/>모니터링 및 비용 컨트롤"]
        C4["🔧 FM 파인튜닝과<br/>자동화 파이프라인"]
    end

    subgraph "Karpenter 중심 해결 방안"
        S1["⭐ Karpenter<br/>Just-in-Time GPU 프로비저닝"]
        S2["Gateway API + KEDA<br/>동적 스케일링 연동"]
        S3["LangFuse + OpenTelemetry<br/>비용 추적"]
        S4["Kubeflow + NeMo<br/>학습 파이프라인"]
    end

    C1 --> S1
    C2 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4

    style C1 fill:#ff6b6b
    style C2 fill:#4ecdc4
    style C3 fill:#45b7d1
    style C4 fill:#96ceb4
    style S1 fill:#ffd93d
```

:::info 대상 독자
이 문서는 Agentic AI Platform 도입을 검토하는 **기술 의사결정자**와 **솔루션 아키텍트**를 대상으로 합니다. Karpenter를 활용한 GPU 리소스 최적화 전략과 EKS 도입의 근거를 제공합니다.
:::

## Karpenter: Agentic AI 인프라의 핵심

Karpenter는 Agentic AI Platform의 모든 도전과제를 해결하는 **핵심 컴포넌트**입니다. 기존 Cluster Autoscaler와 달리 Karpenter는 워크로드 요구사항을 직접 분석하여 최적의 노드를 즉시 프로비저닝합니다.

### Karpenter가 제공하는 핵심 가치

| 기능 | 설명 | Agentic AI 적용 |
| --- | --- | --- |
| Just-in-Time 프로비저닝 | 워크로드 요구에 따라 즉시 노드 생성 | GPU 노드 대기 시간 최소화 |
| Spot 인스턴스 지원 | 최대 90% 비용 절감 | 추론 워크로드 비용 최적화 |
| Consolidation | 유휴 노드 자동 정리 | GPU 리소스 효율성 극대화 |
| 다양한 인스턴스 타입 | 워크로드에 최적화된 인스턴스 자동 선택 | 모델 크기별 최적 GPU 매칭 |

```mermaid
flowchart LR
    subgraph "기존 방식 (Cluster Autoscaler)"
        CA1[Pod Pending] --> CA2[Node Group 확인]
        CA2 --> CA3[ASG 스케일 아웃]
        CA3 --> CA4[노드 준비 완료]
        CA4 --> CA5[Pod 스케줄링]
    end

    subgraph "Karpenter 방식"
        K1[Pod Pending] --> K2[워크로드 분석]
        K2 --> K3[최적 인스턴스 선택]
        K3 --> K4[즉시 프로비저닝]
    end

    style K2 fill:#ffd93d
    style K3 fill:#ffd93d
    style K4 fill:#ffd93d
```

:::tip Karpenter vs Cluster Autoscaler
Karpenter는 Node Group 없이 워크로드 요구사항을 직접 분석하여 최적의 인스턴스를 선택합니다. GPU 워크로드의 경우 프로비저닝 시간이 **50% 이상 단축**됩니다.
:::

## 4가지 핵심 기술적 도전과제

### 도전과제 1: GPU 모니터링 및 리소스 스케줄링

Agentic AI 워크로드는 GPU 리소스에 크게 의존합니다. 복수의 GPU 클러스터를 운영할 때 다음과 같은 어려움에 직면합니다.

#### 기술적 문제점 상세 분석

**1. 멀티 클러스터 GPU 가시성 부재**

대규모 AI 플랫폼에서는 여러 클러스터에 분산된 GPU 리소스를 통합적으로 파악해야 합니다:

```mermaid
graph TB
    subgraph "가시성 문제"
        Q1["클러스터 A의 GPU 사용률은?"]
        Q2["전체 유휴 GPU는 몇 개?"]
        Q3["어느 클러스터에 워크로드 배치?"]
    end

    subgraph "분산된 GPU 클러스터"
        subgraph "Cluster A (US-East)"
            A1["A100 x 16<br/>사용률: ???"]
        end
        subgraph "Cluster B (US-West)"
            B1["H100 x 8<br/>사용률: ???"]
        end
        subgraph "Cluster C (EU)"
            C1["A100 x 24<br/>사용률: ???"]
        end
    end

    Q1 -.-> A1
    Q2 -.-> A1 & B1 & C1
    Q3 -.-> A1 & B1 & C1

    style Q1 fill:#ff6b6b
    style Q2 fill:#ff6b6b
    style Q3 fill:#ff6b6b
```

| 문제 영역 | 구체적 어려움 | 영향 |
| --- | --- | --- |
| 메트릭 수집 | 클러스터별 다른 모니터링 스택 | 통합 대시보드 구축 어려움 |
| 실시간 현황 | GPU 할당 상태 파악 지연 | 리소스 낭비, 스케줄링 실패 |
| 용량 계획 | 전체 GPU 인벤토리 파악 불가 | 과잉/부족 프로비저닝 |

**2. GPU 세대별 워크로드 매칭 복잡성**

A100, H100, H200 등 다양한 GPU 세대가 혼합 운영될 때, 워크로드 특성에 맞는 최적의 GPU를 선택해야 합니다:

| GPU 세대 | 메모리 | FP16 성능 | 적합 워크로드 | 시간당 비용 |
| --- | --- | --- | --- | --- |
| A10G | 24GB | 125 TFLOPS | 소규모 추론 (7B 이하) | ~$1.0 |
| A100 40GB | 40GB | 312 TFLOPS | 중규모 추론/학습 | ~$4.1 |
| A100 80GB | 80GB | 312 TFLOPS | 대규모 모델 | ~$5.1 |
| H100 80GB | 80GB | 989 TFLOPS | 초대규모 학습/추론 | ~$12.3 |
| H200 | 141GB | 989 TFLOPS | 최대 규모 모델 | ~$15.0+ |

**3. GPU 메트릭 수집의 기술적 한계**

- DCGM Exporter의 메트릭 수집 주기와 정확도
- MIG(Multi-Instance GPU) 환경에서의 메트릭 분리
- 컨테이너 레벨 GPU 사용량 추적의 어려움

```mermaid
graph LR
    subgraph "GPU 클러스터 환경"
        subgraph "Cluster A"
            A100_1["A100 x 8"]
            A100_2["A100 x 8"]
        end
        subgraph "Cluster B"
            H100_1["H100 x 8"]
            H100_2["H100 x 8"]
        end
        subgraph "Cluster C"
            H200_1["H200 x 8"]
        end
    end

    subgraph "Karpenter + 모니터링"
        KARP["Karpenter<br/>NodePool"]
        DCGM["DCGM Exporter"]
        PROM["Prometheus"]
    end

    A100_1 --> DCGM
    H100_1 --> DCGM
    H200_1 --> DCGM
    DCGM --> PROM
    PROM --> KARP

    style KARP fill:#ffd93d
```

#### Karpenter 기반 해결 방안 (권장)

**Karpenter NodePool**을 활용하면 GPU 워크로드에 최적화된 노드를 자동으로 프로비저닝하고 관리할 수 있습니다.

<Tabs>
<TabItem value="nodepool" label="GPU NodePool 설정" default>

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference-pool
spec:
  template:
    metadata:
      labels:
        node-type: gpu-inference
        workload: genai
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p4d.24xlarge    # 8x A100 40GB
            - p5.48xlarge     # 8x H100 80GB
            - g5.48xlarge     # 8x A10G 24GB
        - key: karpenter.k8s.aws/instance-gpu-count
          operator: Gt
          values: ["0"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 100
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
  weight: 100
```

</TabItem>
<TabItem value="nodeclass" label="EC2NodeClass 설정">

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-nodeclass
spec:
  role: KarpenterNodeRole-${CLUSTER_NAME}
  amiSelectorTerms:
    - alias: al2023@latest
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 500Gi
        volumeType: gp3
        iops: 10000
        throughput: 500
        encrypted: true
  instanceStorePolicy: RAID0
  userData: |
    #!/bin/bash
    nvidia-smi -pm 1
    modprobe efa
```

</TabItem>
</Tabs>

#### Karpenter의 GPU 워크로드 최적화 기능

| 기능 | 설명 | 효과 |
| --- | --- | --- |
| 인스턴스 타입 자동 선택 | 워크로드 요구사항에 맞는 GPU 인스턴스 자동 선택 | 리소스 낭비 방지 |
| Spot 인스턴스 폴백 | Spot 불가 시 On-Demand로 자동 전환 | 가용성 보장 |
| Consolidation | 유휴 GPU 노드 자동 정리 | 비용 30% 절감 |
| 빠른 프로비저닝 | Node Group 없이 직접 EC2 API 호출 | 프로비저닝 시간 50% 단축 |

#### 보조 솔루션: NVIDIA GPU Operator

Karpenter와 함께 NVIDIA GPU Operator를 사용하여 GPU 드라이버 및 모니터링 스택을 자동화합니다.

```yaml
apiVersion: nvidia.com/v1
kind: ClusterPolicy
metadata:
  name: cluster-policy
spec:
  operator:
    defaultRuntime: containerd
  driver:
    enabled: true
    version: "535.104.05"
  toolkit:
    enabled: true
  devicePlugin:
    enabled: true
  dcgmExporter:
    enabled: true
  migManager:
    enabled: true
```

### 도전과제 2: Agentic AI 요청 동적 라우팅 및 스케일링

Agentic AI 시스템은 다양한 FM(Foundation Model)을 동시에 서빙하며, 트래픽 패턴에 따라 동적으로 대응해야 합니다.

#### 기술적 문제점 상세 분석

**1. 멀티 모델 서빙의 복잡성**

Agentic AI 시스템은 단일 모델이 아닌 여러 모델을 조합하여 사용합니다:

```mermaid
graph TB
    subgraph "Agent 요청 처리 흐름"
        REQ["사용자 요청"]
        ROUTER["요청 라우터"]
        
        subgraph "모델 선택 로직"
            M1["GPT-4<br/>복잡한 추론"]
            M2["Claude-3<br/>긴 컨텍스트"]
            M3["Llama-70B<br/>비용 효율"]
            M4["Embedding<br/>벡터 검색"]
        end
        
        RESP["응답 조합"]
    end

    REQ --> ROUTER
    ROUTER --> M1
    ROUTER --> M2
    ROUTER --> M3
    ROUTER --> M4
    M1 & M2 & M3 & M4 --> RESP

    style ROUTER fill:#4ecdc4
```

| 라우팅 기준 | 설명 | 구현 복잡도 |
| --- | --- | --- |
| 요청 유형 | 코드 생성, 대화, 요약 등 | 중간 |
| 컨텍스트 길이 | 토큰 수에 따른 모델 선택 | 낮음 |
| 비용 제약 | 예산 내 최적 모델 선택 | 높음 |
| 지연 시간 요구 | SLA 기반 모델 선택 | 높음 |
| 모델 가용성 | 장애 시 폴백 모델 선택 | 중간 |

**2. 예측 불가능한 트래픽 패턴**

Agentic AI 워크로드는 기존 웹 서비스와 다른 트래픽 특성을 보입니다:

```mermaid
graph LR
    subgraph "트래픽 특성 비교"
        subgraph "일반 웹 서비스"
            W1["예측 가능한 패턴"]
            W2["짧은 요청 시간"]
            W3["균일한 리소스 사용"]
        end
        
        subgraph "Agentic AI 서비스"
            A1["버스트 트래픽"]
            A2["긴 요청 시간 (수초~수분)"]
            A3["요청별 리소스 편차 큼"]
        end
    end

    style A1 fill:#ff6b6b
    style A2 fill:#ff6b6b
    style A3 fill:#ff6b6b
```

**3. GPU 노드 프로비저닝 지연**

트래픽 급증 시 GPU 노드 확보까지의 시간이 서비스 품질에 직접적인 영향을 미칩니다:

| 단계 | 기존 방식 (Cluster Autoscaler) | Karpenter |
| --- | --- | --- |
| Pending Pod 감지 | 30-60초 | 즉시 |
| 스케일링 결정 | Node Group 기반 | 워크로드 직접 분석 |
| 인스턴스 선택 | 고정된 타입 | 최적 타입 자동 선택 |
| 프로비저닝 | ASG 경유 (2-5분) | 직접 EC2 API (1-3분) |
| **총 소요 시간** | **5-10분** | **2-4분** |

**4. 스케일 다운 시 서비스 영향**

GPU 노드 축소 시 진행 중인 요청 처리가 중요합니다:

- LLM 추론은 수초~수분 소요
- 갑작스러운 노드 종료 시 요청 실패
- Graceful shutdown 구현 필요

```mermaid
graph TB
    subgraph "Client Requests"
        REQ1["Chat Request"]
        REQ2["Code Generation"]
        REQ3["RAG Query"]
    end

    subgraph "Gateway Layer"
        GW["Kgateway<br/>Inference Gateway"]
        ROUTE["Dynamic Router"]
    end

    subgraph "Karpenter 관리 노드"
        subgraph "Model Serving"
            M1["vLLM - GPT-4"]
            M2["vLLM - Claude"]
            M3["TGI - Llama"]
        end
        KARP["Karpenter<br/>Auto Provisioning"]
    end

    REQ1 --> GW
    REQ2 --> GW
    REQ3 --> GW
    GW --> ROUTE
    ROUTE --> M1
    ROUTE --> M2
    ROUTE --> M3
    M1 & M2 & M3 -.-> KARP

    style KARP fill:#ffd93d
    style GW fill:#4286f4
```

#### Karpenter + KEDA 연동 해결 방안 (권장)

Karpenter와 KEDA를 연동하면 **워크로드 스케일링과 노드 프로비저닝이 자동으로 연계**됩니다.

```mermaid
sequenceDiagram
    participant User as 사용자 트래픽
    participant KEDA as KEDA Controller
    participant HPA as HPA
    participant Karpenter as Karpenter
    participant AWS as AWS EC2

    User->>KEDA: 트래픽 급증 감지
    KEDA->>HPA: Pod 스케일 아웃 트리거
    HPA->>Karpenter: Pending Pod 감지
    Karpenter->>AWS: 최적 GPU 인스턴스 프로비저닝
    AWS-->>Karpenter: p4d.24xlarge 준비 완료
    Karpenter-->>HPA: 새 노드에 Pod 스케줄링
    HPA-->>User: 응답 지연 시간 정상화
```

<Tabs>
<TabItem value="keda" label="KEDA ScaledObject" default>

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: vllm-gpu-scaler
  namespace: ai-inference
spec:
  scaleTargetRef:
    name: vllm-deployment
  minReplicaCount: 2
  maxReplicaCount: 20
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.observability:9090
        metricName: vllm_pending_requests
        threshold: "50"
        query: |
          sum(vllm_pending_requests{namespace="ai-inference"})
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.observability:9090
        metricName: gpu_utilization
        threshold: "70"
        query: |
          avg(DCGM_FI_DEV_GPU_UTIL{namespace="ai-inference"})
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleUp:
          stabilizationWindowSeconds: 0
          policies:
            - type: Percent
              value: 100
              periodSeconds: 15
        scaleDown:
          stabilizationWindowSeconds: 300
```

</TabItem>
<TabItem value="httproute" label="Gateway API HTTPRoute">

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ai-model-routing
  namespace: ai-inference
spec:
  parentRefs:
    - name: ai-gateway
      namespace: ai-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        - name: vllm-gpt4
          port: 8000
          weight: 80
        - name: vllm-gpt4-canary
          port: 8000
          weight: 20
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "claude-3"
      backendRefs:
        - name: vllm-claude
          port: 8000
```

</TabItem>
</Tabs>

#### Karpenter Disruption 정책으로 안정성 확보

트래픽 급증 시에도 서비스 안정성을 보장하기 위한 Karpenter 설정입니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference-stable
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
    budgets:
      # 동시에 중단 가능한 노드 수 제한
      - nodes: "20%"
      # 업무 시간에는 중단 방지
      - nodes: "0"
        schedule: "0 9 * * 1-5"
        duration: 10h
```

:::warning 스케일링 주의사항
GPU 노드 프로비저닝은 일반 CPU 노드보다 시간이 오래 걸립니다. Karpenter의 `consolidationPolicy`를 적절히 설정하여 불필요한 스케일 다운을 방지하세요.
:::

### 도전과제 3: 토큰/세션 수준 모니터링 및 비용 컨트롤

LLM 기반 시스템에서는 토큰 단위의 세밀한 모니터링과 비용 관리가 필수적입니다. 특히 GPU 인프라 비용이 전체 운영 비용의 70-80%를 차지하므로, **인프라 레벨의 비용 최적화**가 핵심입니다.

#### 기술적 문제점 상세 분석

**1. 토큰 레벨 비용 추적의 복잡성**

LLM 서비스의 비용 구조는 다층적입니다:

```
총 비용 = GPU 인프라 비용 + API 호출 비용 + 스토리지 비용 + 네트워크 비용
```

| 비용 요소 | 측정 난이도 | 비중 | 문제점 |
| --- | --- | --- | --- |
| GPU 인프라 | 중간 | 70-80% | 유휴 시간 비용 발생, 인스턴스 타입별 단가 차이 |
| 토큰 사용량 | 높음 | 10-15% | 입력/출력 토큰 비율 예측 어려움 |
| 스토리지 | 낮음 | 5-10% | 모델 아티팩트 크기 증가 |
| 네트워크 | 낮음 | 3-5% | Cross-AZ 트래픽 비용 |

**2. GPU 유휴 비용 문제**

```mermaid
graph LR
    subgraph "일반적인 GPU 사용 패턴"
        direction TB
        T1["09:00-12:00<br/>사용률 80%"]
        T2["12:00-14:00<br/>사용률 30%"]
        T3["14:00-18:00<br/>사용률 70%"]
        T4["18:00-09:00<br/>사용률 10%"]
    end

    subgraph "비용 낭비 영역"
        W1["점심 시간<br/>유휴 GPU 비용"]
        W2["야간/주말<br/>유휴 GPU 비용"]
    end

    T2 --> W1
    T4 --> W2

    style W1 fill:#ff6b6b
    style W2 fill:#ff6b6b
```

**3. 멀티 테넌트 비용 분리의 어려움**

- 팀/프로젝트별 GPU 사용량 정확한 측정 필요
- 공유 GPU 노드에서의 비용 할당 로직 복잡
- 실시간 할당량(Quota) 관리 및 초과 방지

**4. 예측 불가능한 비용 급증**

- 트래픽 스파이크 시 자동 스케일링으로 인한 비용 급증
- Spot 인스턴스 중단 시 On-Demand 폴백으로 비용 증가
- 모델 업데이트 시 일시적 리소스 중복 사용

```mermaid
graph TB
    subgraph "AI Application"
        APP["Agent Application"]
        SDK["LangFuse SDK"]
    end

    subgraph "Observability Stack"
        LF["LangFuse"]
        OTEL["OpenTelemetry<br/>Collector"]
    end

    subgraph "Metrics & Cost"
        PROM["Prometheus"]
        GRAF["Grafana"]
        COST["Cost Dashboard"]
    end

    subgraph "Karpenter 비용 최적화"
        KARP["Karpenter"]
        SPOT["Spot 인스턴스"]
        CONSOL["Consolidation"]
        BUDGET["Budget 정책"]
    end

    APP --> SDK
    SDK --> LF
    LF --> OTEL
    OTEL --> PROM
    PROM --> GRAF
    PROM --> COST
    KARP --> SPOT
    KARP --> CONSOL
    KARP --> BUDGET
    SPOT --> COST
    CONSOL --> COST

    style LF fill:#45b7d1
    style KARP fill:#ffd93d
```

#### Karpenter 기반 비용 최적화 전략 (권장)

Karpenter는 GPU 인프라 비용 최적화의 **핵심 레버**입니다. 다음 4가지 전략을 조합하여 최대 효과를 얻을 수 있습니다.

**전략 1: Spot 인스턴스 우선 활용**

Karpenter의 Spot 인스턴스 지원을 활용하면 GPU 비용을 **최대 90%까지 절감**할 수 있습니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-spot-inference
spec:
  template:
    metadata:
      labels:
        cost-tier: spot
        workload: inference
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.12xlarge
            - g5.24xlarge
            - g5.48xlarge
            - p4d.24xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-spot-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
        - key: karpenter.sh/capacity-type
          value: "spot"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 32
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
  weight: 50  # On-Demand보다 우선 선택
```

**전략 2: 시간대별 스케줄 기반 비용 관리**

업무 시간과 비업무 시간에 따른 차별화된 리소스 정책을 적용합니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-scheduled-pool
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.12xlarge
            - g5.24xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
  limits:
    nvidia.com/gpu: 16
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
    budgets:
      # 업무 시간: 안정성 우선 (노드 중단 최소화)
      - nodes: "10%"
        schedule: "0 9 * * 1-5"
        duration: 9h
      # 비업무 시간: 비용 우선 (적극적 통합)
      - nodes: "50%"
        schedule: "0 18 * * 1-5"
        duration: 15h
      # 주말: 최소 리소스 유지
      - nodes: "80%"
        schedule: "0 0 * * 0,6"
        duration: 24h
```

**전략 3: Consolidation을 통한 유휴 리소스 제거**

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-consolidation-pool
spec:
  disruption:
    # 노드가 비어있거나 활용도가 낮을 때 통합
    consolidationPolicy: WhenEmptyOrUnderutilized
    # 빠른 통합으로 비용 절감 (30초 대기 후 통합)
    consolidateAfter: 30s
```

**전략 4: 워크로드별 인스턴스 최적화**

```yaml
# 소규모 모델용 (7B 이하) - 비용 효율적
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-small-models
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.xlarge      # 1x A10G - $1.01/hr
            - g5.2xlarge     # 1x A10G - $1.21/hr
  weight: 100  # 최우선 선택

---
# 대규모 모델용 (70B+) - 성능 우선
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-large-models
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p4d.24xlarge   # 8x A100 - $32.77/hr
            - p5.48xlarge    # 8x H100 - $98.32/hr
  weight: 10   # 필요시에만 선택
```

#### 비용 최적화 전략 비교

| 전략 | 구현 방법 | 예상 절감률 | 적용 워크로드 | 위험도 |
| --- | --- | --- | --- | --- |
| Spot 인스턴스 | Karpenter NodePool | 60-90% | 추론, 배치 처리 | 중간 (중단 가능) |
| Consolidation | Karpenter disruption | 20-30% | 모든 워크로드 | 낮음 |
| Right-sizing | Karpenter 인스턴스 자동 선택 | 15-25% | 모든 워크로드 | 낮음 |
| 스케줄 기반 | Karpenter budgets | 30-40% | 비업무 시간 | 낮음 |
| 복합 적용 | 위 전략 조합 | 50-70% | 전체 | 중간 |

#### 보조 솔루션: LangFuse 기반 토큰 추적

인프라 비용과 함께 토큰 레벨 비용도 추적해야 완전한 비용 가시성을 확보할 수 있습니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse
  namespace: observability
spec:
  replicas: 2
  selector:
    matchLabels:
      app: langfuse
  template:
    metadata:
      labels:
        app: langfuse
    spec:
      containers:
        - name: langfuse
          image: langfuse/langfuse:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: langfuse-secrets
                  key: database-url
            - name: NEXTAUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: langfuse-secrets
                  key: nextauth-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

#### 비용 모니터링 대시보드 구성

```yaml
# Prometheus 비용 관련 메트릭 수집 규칙
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-cost-rules
  namespace: monitoring
spec:
  groups:
    - name: gpu-cost
      rules:
        - record: gpu:hourly_cost:sum
          expr: |
            sum(
              karpenter_nodes_total_pod_requests{resource_type="nvidia.com/gpu"} 
              * on(instance_type) group_left() 
              aws_ec2_instance_hourly_cost
            )
        - alert: HighGPUCostAlert
          expr: gpu:hourly_cost:sum > 100
          for: 1h
          labels:
            severity: warning
          annotations:
            summary: "시간당 GPU 비용이 $100를 초과했습니다"
```

:::tip 비용 최적화 체크리스트
1. **Spot 인스턴스 비율**: 추론 워크로드의 70% 이상을 Spot으로 운영
2. **Consolidation 활성화**: 30초 이내 유휴 노드 정리
3. **스케줄 기반 정책**: 비업무 시간 리소스 50% 이상 축소
4. **Right-sizing**: 모델 크기에 맞는 인스턴스 타입 자동 선택
:::

:::warning 비용 최적화 주의사항
- Spot 인스턴스 중단 시 서비스 영향 최소화를 위한 graceful shutdown 구현 필수
- 과도한 Consolidation은 스케일 아웃 지연을 유발할 수 있음
- 비용 절감과 SLA 준수 사이의 균형점 설정 필요
:::

### 도전과제 4: FM 파인튜닝과 자동화 파이프라인

Foundation Model을 특정 도메인에 맞게 파인튜닝하고 지속적으로 개선하는 것은 복잡한 과정입니다. 특히 **대규모 분산 학습 환경에서의 GPU 리소스 관리**가 핵심 과제입니다.

#### 기술적 문제점 상세 분석

**1. 분산 학습 환경의 복잡성**

대규모 LLM 파인튜닝은 단일 GPU로는 불가능하며, 멀티 노드 분산 학습이 필수입니다:

```mermaid
graph TB
    subgraph "분산 학습 토폴로지"
        direction LR
        subgraph "Node 1"
            N1G1["GPU 0-3"]
            N1G2["GPU 4-7"]
        end
        subgraph "Node 2"
            N2G1["GPU 0-3"]
            N2G2["GPU 4-7"]
        end
        subgraph "Node 3"
            N3G1["GPU 0-3"]
            N3G2["GPU 4-7"]
        end
        subgraph "Node 4"
            N4G1["GPU 0-3"]
            N4G2["GPU 4-7"]
        end
    end

    subgraph "통신 패턴"
        NCCL["NCCL All-Reduce"]
        EFA["EFA 네트워크"]
    end

    N1G1 <--> NCCL
    N2G1 <--> NCCL
    N3G1 <--> NCCL
    N4G1 <--> NCCL
    NCCL <--> EFA

    style EFA fill:#ff9900
```

| 병렬화 전략 | 설명 | 적용 시나리오 | 복잡도 |
| --- | --- | --- | --- |
| Data Parallelism | 데이터를 분할하여 각 GPU에서 동일 모델 학습 | 작은 모델, 대용량 데이터 | 낮음 |
| Tensor Parallelism | 모델의 텐서를 GPU 간 분할 | 단일 레이어가 GPU 메모리 초과 시 | 높음 |
| Pipeline Parallelism | 모델 레이어를 GPU 간 분할 | 매우 깊은 모델 | 중간 |
| FSDP | 모델 파라미터, 그래디언트, 옵티마이저 상태 분할 | 대규모 모델 효율적 학습 | 중간 |

**2. GPU 리소스 프로비저닝 지연**

학습 작업은 일반적으로 **배치 형태**로 실행되며, 리소스 확보 시간이 전체 파이프라인 효율성에 직접적인 영향을 미칩니다:

```mermaid
sequenceDiagram
    participant User as 데이터 사이언티스트
    participant Pipeline as ML Pipeline
    participant Scheduler as K8s Scheduler
    participant Karpenter as Karpenter
    participant AWS as AWS EC2

    User->>Pipeline: 학습 Job 제출
    Pipeline->>Scheduler: Pod 생성 요청 (32 GPU)
    
    Note over Scheduler: 기존 방식: Node Group 대기
    Scheduler->>Karpenter: Pending Pod 감지
    
    Note over Karpenter: 워크로드 분석
    Karpenter->>Karpenter: 최적 인스턴스 계산<br/>(4x p4d.24xlarge)
    
    Karpenter->>AWS: 병렬 인스턴스 프로비저닝
    AWS-->>Karpenter: 노드 준비 완료 (2-3분)
    
    Karpenter-->>Scheduler: 노드 등록
    Scheduler-->>Pipeline: Pod 스케줄링 완료
    Pipeline-->>User: 학습 시작
```

**3. 학습 중 장애 복구의 어려움**

- 체크포인트 저장/복구 전략 필요
- 노드 장애 시 전체 학습 재시작 방지
- Spot 인스턴스 사용 시 중단 처리

**4. 리소스 활용 효율성**

- 학습 완료 후 GPU 노드 유휴 상태 지속
- 하이퍼파라미터 튜닝 시 리소스 낭비
- 실험과 프로덕션 학습 간 리소스 경합

```mermaid
graph LR
    subgraph "Data Pipeline"
        DATA["Training Data"]
        PREP["Data Preprocessing"]
    end

    subgraph "Karpenter 관리 학습 클러스터"
        KARP["Karpenter<br/>Training NodePool"]
        NEMO["NeMo Framework"]
        DIST["Distributed Training"]
    end

    subgraph "Model Registry"
        CKPT["Checkpoint Storage"]
        MLFLOW["MLflow Registry"]
    end

    subgraph "Deployment"
        SERVE["Model Serving"]
        CANARY["Canary Deployment"]
    end

    DATA --> PREP
    PREP --> NEMO
    KARP --> NEMO
    NEMO --> DIST
    DIST --> CKPT
    CKPT --> MLFLOW
    MLFLOW --> SERVE
    SERVE --> CANARY

    style KARP fill:#ffd93d
    style NEMO fill:#76b900
```

#### Karpenter 기반 학습 인프라 구성 (권장)

**전략 1: 학습 전용 NodePool 분리**

학습 워크로드는 추론과 다른 특성을 가지므로 별도의 NodePool로 관리합니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-training-pool
spec:
  template:
    metadata:
      labels:
        node-type: gpu-training
        workload: ml-training
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]  # 학습은 On-Demand 권장 (안정성)
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p5.48xlarge     # 8x H100 80GB - 대규모 학습
            - p4d.24xlarge    # 8x A100 40GB - 중규모 학습
            - p4de.24xlarge   # 8x A100 80GB - 메모리 집약적 학습
        - key: karpenter.k8s.aws/instance-gpu-count
          operator: Gt
          values: ["0"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-training-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
        - key: workload-type
          value: "training"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 64
  disruption:
    # 학습 중에는 노드 중단 방지
    consolidationPolicy: WhenEmpty
    consolidateAfter: 1h  # 학습 완료 후 1시간 대기
    budgets:
      # 학습 중에는 노드 중단 완전 방지
      - nodes: "0"
```

**전략 2: EFA 네트워크 최적화 NodeClass**

분산 학습의 성능은 GPU 간 통신 속도에 크게 의존합니다. EFA(Elastic Fabric Adapter)를 활용하여 최대 성능을 확보합니다.

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-training-nodeclass
spec:
  role: KarpenterNodeRole-${CLUSTER_NAME}
  amiSelectorTerms:
    - alias: al2023@latest
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
        network-type: efa-enabled  # EFA 지원 서브넷
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 1000Gi  # 대용량 체크포인트 저장
        volumeType: gp3
        iops: 16000
        throughput: 1000
        encrypted: true
        deleteOnTermination: true
  instanceStorePolicy: RAID0  # NVMe 인스턴스 스토어 활용
  userData: |
    #!/bin/bash
    set -e
    
    # NVIDIA 드라이버 설정
    nvidia-smi -pm 1
    nvidia-smi -ac 1593,1410  # H100 최적 클럭 설정
    
    # EFA 드라이버 로드
    modprobe efa
    
    # NCCL 환경 변수 설정
    echo 'export NCCL_DEBUG=INFO' >> /etc/profile.d/nccl.sh
    echo 'export NCCL_SOCKET_IFNAME=eth0' >> /etc/profile.d/nccl.sh
    echo 'export FI_EFA_USE_DEVICE_RDMA=1' >> /etc/profile.d/nccl.sh
    echo 'export FI_PROVIDER=efa' >> /etc/profile.d/nccl.sh
    
    # 대용량 페이지 설정 (학습 성능 향상)
    echo 'vm.nr_hugepages=5120' >> /etc/sysctl.conf
    sysctl -p
  tags:
    Environment: production
    Workload: ml-training
    CostCenter: ml-platform
```

**전략 3: 실험용 Spot 기반 NodePool**

하이퍼파라미터 튜닝이나 실험적 학습에는 Spot 인스턴스를 활용하여 비용을 절감합니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-experiment-pool
spec:
  template:
    metadata:
      labels:
        node-type: gpu-experiment
        workload: ml-experiment
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p4d.24xlarge
            - g5.48xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-experiment-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
        - key: workload-type
          value: "experiment"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 32
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 10m  # 실험 완료 후 빠른 정리
  weight: 30  # 프로덕션 학습보다 낮은 우선순위
```

#### NeMo 분산 학습 Job 예제

Karpenter가 프로비저닝한 노드에서 실행되는 NeMo 분산 학습 Job입니다.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: nemo-finetune-llama-70b
  namespace: ai-training
spec:
  parallelism: 4  # 4개 노드 병렬 실행
  completions: 4
  completionMode: Indexed
  template:
    metadata:
      labels:
        app: nemo-training
        model: llama-70b
    spec:
      restartPolicy: OnFailure
      containers:
        - name: nemo
          image: nvcr.io/nvidia/nemo:24.01
          command:
            - /bin/bash
            - -c
            - |
              # 분산 학습 환경 설정
              export MASTER_ADDR=$(hostname -i)
              export MASTER_PORT=29500
              export WORLD_SIZE=32  # 4 nodes x 8 GPUs
              export RANK=$JOB_COMPLETION_INDEX
              
              python -m torch.distributed.launch \
                --nproc_per_node=8 \
                --nnodes=4 \
                --node_rank=$RANK \
                --master_addr=$MASTER_ADDR \
                --master_port=$MASTER_PORT \
                /opt/NeMo/examples/nlp/language_modeling/megatron_gpt_finetuning.py \
                --config-path=/config \
                --config-name=llama_70b_finetune
          args:
            - model.data.train_ds.file_path=/data/train.jsonl
            - model.data.validation_ds.file_path=/data/val.jsonl
            - trainer.devices=8
            - trainer.num_nodes=4
            - trainer.max_epochs=3
            - trainer.precision=bf16-mixed
            - model.tensor_model_parallel_size=4
            - model.pipeline_model_parallel_size=2
            - exp_manager.checkpoint_callback_params.save_top_k=3
          resources:
            requests:
              nvidia.com/gpu: 8
              memory: "900Gi"
              cpu: "90"
            limits:
              nvidia.com/gpu: 8
              memory: "1100Gi"
              cpu: "96"
          volumeMounts:
            - name: training-data
              mountPath: /data
            - name: checkpoints
              mountPath: /checkpoints
            - name: config
              mountPath: /config
            - name: shm
              mountPath: /dev/shm
      nodeSelector:
        node-type: gpu-training
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
        - key: workload-type
          operator: Equal
          value: "training"
          effect: NoSchedule
      volumes:
        - name: training-data
          persistentVolumeClaim:
            claimName: training-data-pvc
        - name: checkpoints
          persistentVolumeClaim:
            claimName: checkpoints-pvc
        - name: config
          configMap:
            name: nemo-training-config
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: 256Gi  # 대용량 공유 메모리
```

#### 학습 파이프라인 자동화

Kubeflow Pipelines와 Karpenter를 연동하여 End-to-End 학습 파이프라인을 자동화합니다.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: llm-finetune-pipeline
  namespace: ai-training
spec:
  entrypoint: finetune-pipeline
  templates:
    - name: finetune-pipeline
      dag:
        tasks:
          - name: data-preparation
            template: prepare-data
          - name: training
            template: distributed-training
            dependencies: [data-preparation]
          - name: evaluation
            template: evaluate-model
            dependencies: [training]
          - name: deployment
            template: deploy-model
            dependencies: [evaluation]

    - name: distributed-training
      resource:
        action: create
        manifest: |
          apiVersion: batch/v1
          kind: Job
          metadata:
            name: nemo-finetune-{{workflow.uid}}
          spec:
            # ... (위의 Job 스펙)
      # Karpenter가 자동으로 필요한 GPU 노드 프로비저닝
```

#### 학습 인프라 비용 최적화 전략

| 전략 | 적용 대상 | 예상 절감률 | 구현 방법 |
| --- | --- | --- | --- |
| Spot 실험 클러스터 | 하이퍼파라미터 튜닝 | 60-80% | 별도 NodePool |
| 자동 노드 정리 | 학습 완료 후 | 20-30% | Consolidation |
| 체크포인트 기반 재시작 | Spot 중단 대응 | 10-20% | NeMo 체크포인트 |
| 시간대별 스케줄링 | 비업무 시간 학습 | 15-25% | CronJob + Karpenter |

:::tip 학습 인프라 모범 사례
1. **프로덕션 학습**: On-Demand 인스턴스로 안정성 확보
2. **실험/튜닝**: Spot 인스턴스로 비용 절감
3. **체크포인트**: FSx for Lustre에 주기적 저장
4. **모니터링**: TensorBoard + Prometheus로 학습 진행 추적
:::

:::warning 분산 학습 주의사항
- EFA 네트워크가 지원되는 서브넷에서만 최적 성능 발휘
- NCCL 환경 변수 설정이 성능에 큰 영향
- 체크포인트 저장 주기와 스토리지 비용 간 균형 필요
:::

## Amazon EKS와 Karpenter의 시너지

Amazon EKS는 Karpenter와 함께 사용할 때 최대의 효과를 발휘합니다.

### EKS + Karpenter 아키텍처

```mermaid
graph TB
    subgraph "AWS 관리 영역"
        CP["EKS Control Plane<br/>etcd, API Server, Scheduler"]
        UP["자동 업그레이드"]
        HA["고가용성 (Multi-AZ)"]
    end

    subgraph "Karpenter 관리 영역"
        KARP["Karpenter Controller"]
        NP1["GPU Inference NodePool"]
        NP2["GPU Training NodePool"]
        NP3["Spot NodePool"]
    end

    subgraph "AI Workloads"
        INF["추론 서비스"]
        TRAIN["학습 작업"]
        BATCH["배치 처리"]
    end

    CP --> KARP
    KARP --> NP1
    KARP --> NP2
    KARP --> NP3
    NP1 --> INF
    NP2 --> TRAIN
    NP3 --> BATCH

    style CP fill:#ff9900
    style KARP fill:#ffd93d
```

### EKS Auto Mode와 Karpenter

EKS Auto Mode를 사용하면 Karpenter가 자동으로 구성되어 운영 부담이 크게 줄어듭니다.

| 기능 | EKS Standard + Karpenter | EKS Auto Mode |
| --- | --- | --- |
| Karpenter 설치 | 수동 설치 필요 | 자동 구성 |
| NodePool 관리 | 직접 정의 | 기본 제공 + 커스텀 |
| 업그레이드 | 수동 관리 | 자동 업그레이드 |
| 모니터링 | 별도 구성 | 통합 제공 |

### AWS 서비스 통합

| AWS 서비스 | 용도 | Karpenter 연동 |
| --- | --- | --- |
| Amazon S3 | 모델 아티팩트 저장 | CSI Driver, IRSA |
| FSx for Lustre | 고성능 학습 데이터 | CSI Driver |
| CloudWatch | 메트릭, 로그 | Container Insights |
| EC2 Spot | 비용 최적화 | Karpenter capacity-type |

## Karpenter 도입 효과 요약

### 정량적 효과

| 지표 | 기존 방식 | Karpenter 도입 후 | 개선율 |
| --- | --- | --- | --- |
| GPU 노드 프로비저닝 시간 | 5-10분 | 2-3분 | 50-70% 단축 |
| GPU 리소스 활용률 | 40-50% | 70-80% | 40-60% 향상 |
| 월간 GPU 비용 | 기준 | Spot 활용 시 | 60-90% 절감 |
| 유휴 노드 비용 | 발생 | Consolidation | 20-30% 절감 |

### 정성적 효과

- **운영 복잡성 감소**: Node Group 관리 불필요
- **자동화 수준 향상**: 워크로드 기반 자동 프로비저닝
- **비용 가시성 개선**: 워크로드별 비용 추적 용이
- **확장성 확보**: 트래픽 급증에 즉각 대응

## 결론

Agentic AI Platform 구축의 4가지 핵심 도전과제는 **Karpenter를 중심으로 한 EKS 기반 아키텍처**로 효과적으로 해결할 수 있습니다.

### 도전과제별 Karpenter 해결 방안 요약

| 도전과제 | 핵심 문제 | Karpenter 해결 방안 | 기대 효과 |
| --- | --- | --- | --- |
| GPU 모니터링 | 멀티 클러스터 가시성 부재 | NodePool 기반 통합 관리 | 리소스 활용률 40% 향상 |
| 동적 라우팅/스케일링 | 트래픽 급증 대응 지연 | Just-in-Time 프로비저닝 | 프로비저닝 시간 50% 단축 |
| 비용 컨트롤 | GPU 유휴 비용 | Spot + Consolidation | 비용 50-70% 절감 |
| FM 파인튜닝 | 분산 학습 인프라 복잡성 | 학습 전용 NodePool | 학습 효율성 30% 향상 |

### 핵심 권장사항

1. **Karpenter 우선 도입**: GPU 노드 관리의 핵심 컴포넌트로 Karpenter 활용
2. **워크로드별 NodePool 분리**: 추론/학습/실험 워크로드별 최적화된 NodePool 구성
3. **Spot 인스턴스 적극 활용**: 추론 워크로드에 Spot 인스턴스로 비용 최적화
4. **KEDA 연동**: Karpenter와 KEDA를 연동하여 End-to-End 자동 스케일링 구현
5. **Consolidation 활성화**: 유휴 리소스 자동 정리로 비용 효율성 극대화
6. **스케줄 기반 정책**: 업무/비업무 시간에 따른 차별화된 리소스 정책 적용

### 구현 로드맵

```mermaid
gantt
    title Karpenter 기반 Agentic AI 인프라 구축 로드맵
    dateFormat  YYYY-MM-DD
    section Phase 1: 기반 구축
    Karpenter 설치 및 기본 NodePool    :a1, 2025-01-01, 2w
    DCGM Exporter 연동                 :a2, after a1, 1w
    section Phase 2: 추론 최적화
    추론용 NodePool 구성               :b1, after a2, 2w
    Spot 인스턴스 통합                 :b2, after b1, 1w
    KEDA 연동                          :b3, after b2, 2w
    section Phase 3: 학습 인프라
    학습용 NodePool 구성               :c1, after b3, 2w
    EFA 네트워크 최적화                :c2, after c1, 1w
    section Phase 4: 비용 최적화
    Consolidation 정책 튜닝            :d1, after c2, 2w
    비용 모니터링 대시보드             :d2, after d1, 1w
```

:::info 다음 단계
이 문서에서 소개한 각 도전과제에 대한 상세한 구현 가이드는 다음 문서들을 참조하세요:

- [GPU 리소스 관리](./gpu-resource-management.md) - Karpenter 기반 GPU 클러스터 동적 리소스 할당
- [Inference Gateway](./inference-gateway-routing.md) - Kgateway 기반 동적 라우팅
- [Agent 모니터링](./agent-monitoring.md) - LangFuse, LangSmith 통합
- [NeMo 프레임워크](./nemo-framework.md) - FM 파인튜닝 파이프라인

:::

## 참고 자료

- [Karpenter 공식 문서](https://karpenter.sh/docs/)
- [Amazon EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [NVIDIA GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
- [KEDA - Kubernetes Event-driven Autoscaling](https://keda.sh/)
- [LangFuse Documentation](https://langfuse.com/docs)
- [NVIDIA NeMo Framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/overview.html)
