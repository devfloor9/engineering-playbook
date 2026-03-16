---
title: "Agentic AI 워크로드의 기술적 도전과제"
sidebar_label: "1. 기술적 도전과제"
description: "Agentic AI 워크로드 운영 시 직면하는 4가지 핵심 도전과제와 Kubernetes 기반 오픈소스 생태계"
tags: [kubernetes, genai, agentic-ai, gpu, challenges, open-source]
category: "genai-aiml"
last_update:
  date: 2026-02-14
  author: devfloor9
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { ChallengeSummary, K8sCoreFeatures, SolutionMapping, ModelServingComparison, InferenceGatewayComparison, ObservabilityComparison, KAgentFeatures, ObservabilityLayerStack, LlmdFeatures, DistributedTrainingStack, GpuInfraStack } from '@site/src/components/AgenticChallengesTables';

> 📅 **작성일**: 2025-02-05 | **수정일**: 2026-02-14 | ⏱️ **읽는 시간**: 약 8분

## 소개

Agentic AI 플랫폼을 구축하고 운영할 때, 플랫폼 엔지니어와 아키텍트는 기존 웹 애플리케이션과는 근본적으로 다른 기술적 도전에 직면합니다. 이 문서에서는 **4가지 핵심 도전과제**를 분석하고, 이를 해결하기 위한 **Kubernetes 기반 오픈소스 생태계**를 탐구합니다.

## Agentic AI 플랫폼의 4가지 핵심 도전과제

Frontier Model(최신 대규모 언어 모델)을 활용한 Agentic AI 시스템은 기존 웹 애플리케이션과는 **근본적으로 다른 인프라 요구사항**을 가집니다.

```mermaid
flowchart TD
    subgraph Challenges["4가지 핵심 도전과제"]
        C1["도전과제 1<br/>GPU 모니터링 및<br/>리소스 스케줄링"]
        C2["도전과제 2<br/>Agentic AI 요청<br/>동적 라우팅 및 스케일링"]
        C3["도전과제 3<br/>토큰/세션 수준<br/>모니터링 및 비용 컨트롤"]
        C4["도전과제 4<br/>FM 파인튜닝과<br/>자동화 파이프라인"]
    end

    COMMON["공통 특성<br/>- GPU 리소스 집약적<br/>- 예측 불가능한 워크로드<br/>- 높은 인프라 비용<br/>- 복잡한 분산 시스템"]

    C1 --> COMMON
    C2 --> COMMON
    C3 --> COMMON
    C4 --> COMMON

    style C1 fill:#ffe1e1
    style C2 fill:#e1f5ff
    style C3 fill:#fff4e1
    style C4 fill:#e1ffe1
    style COMMON fill:#f0f0f0
```

### 도전과제 요약

<ChallengeSummary />

:::warning 기존 인프라 접근 방식의 한계
전통적인 VM 기반 인프라나 수동 관리 방식으로는 Agentic AI의 **동적이고 예측 불가능한 워크로드 패턴**에 효과적으로 대응할 수 없습니다. GPU 리소스의 높은 비용과 복잡한 분산 시스템 요구사항은 **자동화된 인프라 관리**를 필수로 만듭니다.
:::

---

## 해결의 핵심: 클라우드 인프라 자동화와 AI 플랫폼의 통합

Agentic AI 플랫폼의 도전과제를 해결하는 핵심은 **클라우드 인프라 자동화와 AI 워크로드의 유기적 통합**입니다. 이 통합이 중요한 이유는 다음과 같습니다:

```mermaid
flowchart LR
    subgraph AIWorkload["AI 워크로드 특성"]
        AI1["동적 리소스 요구"]
        AI2["예측 불가능한<br/>트래픽"]
        AI3["고비용<br/>GPU 리소스"]
        AI4["복잡한 분산 처리"]
    end

    PLATFORM["Kubernetes<br/>컨테이너<br/>오케스트레이션"]

    subgraph InfraAuto["인프라 자동화 요구사항"]
        INF1["실시간<br/>프로비저닝"]
        INF2["자동 스케일링"]
        INF3["비용 최적화"]
        INF4["선언적 관리"]
    end

    AI1 --> PLATFORM
    AI2 --> PLATFORM
    AI3 --> PLATFORM
    AI4 --> PLATFORM
    PLATFORM --> INF1
    PLATFORM --> INF2
    PLATFORM --> INF3
    PLATFORM --> INF4

    style PLATFORM fill:#326ce5,color:#fff
    style AIWorkload fill:#e1f5ff
    style InfraAuto fill:#e1ffe1
```

## 왜 Kubernetes인가?

Kubernetes는 Agentic AI 플랫폼의 모든 도전과제를 해결할 수 있는 **이상적인 기반 플랫폼**입니다:

<K8sCoreFeatures />

```mermaid
flowchart TD
    subgraph K8sCore["Kubernetes 핵심 컴포넌트"]
        API["API Server<br/>선언적 리소스 관리"]
        SCHED["Scheduler<br/>GPU 인식 스케줄링"]
        CTRL["Controller Manager<br/>상태 조정 루프"]
        ETCD["etcd<br/>클러스터 상태 저장"]
    end

    subgraph AISupport["AI 워크로드 지원"]
        GPU["GPU Device Plugin<br/>GPU 리소스 추상화"]
        HPA["HPA/KEDA<br/>메트릭 기반 스케일링"]
        OP["Operators<br/>워크플로우 자동화"]
    end

    subgraph Solutions["도전과제 해결"]
        S1["GPU 리소스<br/>통합 관리"]
        S2["동적 스케일링"]
        S3["리소스 할당량<br/>관리"]
        S4["분산 학습<br/>자동화"]
    end

    API --> GPU
    SCHED --> GPU
    CTRL --> HPA
    CTRL --> OP
    GPU --> S1
    HPA --> S2
    API --> S3
    OP --> S4

    style API fill:#326ce5,color:#fff
    style SCHED fill:#326ce5,color:#fff
    style CTRL fill:#326ce5,color:#fff
    style ETCD fill:#326ce5,color:#fff
    style K8sCore fill:#e1f5ff
    style AISupport fill:#fff4e1
    style Solutions fill:#e1ffe1
```

:::info Kubernetes의 AI 워크로드 지원
Kubernetes는 NVIDIA GPU Operator, Kubeflow, KEDA 등 AI/ML 생태계와의 풍부한 통합을 제공합니다. 이를 통해 GPU 리소스 관리, 분산 학습, 모델 서빙을 **단일 플랫폼에서 통합 관리**할 수 있습니다.
:::

---

이제 Kubernetes가 AI 워크로드에 적합한 이유를 이해했습니다. 다음으로, **각 도전과제를 해결하는 구체적인 오픈소스 솔루션들**을 살펴보겠습니다.

## Kubernetes 생태계의 Agentic AI 솔루션 버드뷰

Kubernetes 생태계에는 Agentic AI 플랫폼의 각 도전과제를 해결하기 위한 **전문화된 오픈소스 솔루션**들이 존재합니다. 이 솔루션들은 Kubernetes 네이티브로 설계되어 **선언적 관리, 자동 스케일링, 고가용성**의 이점을 그대로 활용할 수 있습니다.

### 솔루션 매핑 개요

```mermaid
flowchart TD
    subgraph Challenges["4가지 핵심 도전과제"]
        C1["GPU 모니터링 및<br/>리소스 스케줄링"]
        C2["동적 라우팅 및<br/>스케일링"]
        C3["토큰/세션 모니터링<br/>및 비용 컨트롤"]
        C4["FM 파인튜닝과<br/>자동화 파이프라인"]
    end

    subgraph K8sSolutions["Kubernetes 네이티브 솔루션"]
        S1["Karpenter<br/>GPU 노드<br/>자동 프로비저닝"]
        S2["Kgateway<br/>+<br/>LiteLLM"]
        S3["LangFuse<br/>/<br/>LangSmith"]
        S4["NeMo<br/>+<br/>Kubeflow"]
    end

    subgraph ModelServing["모델 서빙"]
        VLLM["vLLM<br/>추론 엔진"]
        LLMD["llm-d<br/>스케줄러"]
    end

    KAGENT["KAgent<br/>Agent 프레임워크"]

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4

    S2 --> VLLM
    S2 --> LLMD
    KAGENT --> S2
    KAGENT --> S3

    style C1 fill:#ffe1e1
    style C2 fill:#e1f5ff
    style C3 fill:#fff4e1
    style C4 fill:#e1ffe1
    style S1 fill:#ffd93d
    style S2 fill:#e1f5ff
    style S3 fill:#f0e1ff
    style S4 fill:#e1ffe1
    style VLLM fill:#ffe1e1
    style LLMD fill:#ffe1e1
    style KAGENT fill:#e1ffe1
```

### 도전과제별 솔루션 상세 매핑

<SolutionMapping />

---

지금까지 Kubernetes 생태계의 다양한 솔루션들을 살펴보았습니다. 이제 이 솔루션들이 **실제로 어떻게 통합되어 작동하는지** 오픈소스 아키텍처 관점에서 자세히 알아보겠습니다.

## 오픈소스 생태계와 Kubernetes 통합 아키텍처

Agentic AI 플랫폼은 다양한 오픈소스 프로젝트들이 Kubernetes를 중심으로 유기적으로 통합되어 구성됩니다. 이 섹션에서는 **LLM Observability, 모델 서빙, 벡터 데이터베이스, GPU 인프라** 영역의 핵심 오픈소스들이 어떻게 협력하여 완전한 Agentic AI 플랫폼을 형성하는지 설명합니다.

### 1. 모델 서빙: vLLM + llm-d

**vLLM**은 LLM 추론을 위한 고성능 서빙 엔진으로, PagedAttention을 통해 **메모리 효율성을 극대화**합니다. vLLM v0.6+는 CUDA 12.x와 완벽하게 호환되며, H100/H200 GPU를 완전히 지원합니다.

**llm-d**는 Kubernetes 환경에서 LLM 추론 요청을 **지능적으로 분산**하는 스케줄러입니다.

```mermaid
flowchart LR
    REQ["Client Request"]
    LLMD["llm-d<br/>Request Router"]

    subgraph VllmInstances["vLLM Instances"]
        V1["vLLM Pod 1<br/>GPU: A100"]
        V2["vLLM Pod 2<br/>GPU: A100"]
        V3["vLLM Pod 3<br/>GPU: H100"]
    end

    REQ --> LLMD
    LLMD --> V1
    LLMD --> V2
    LLMD --> V3

    style LLMD fill:#ffe1e1
    style V1 fill:#e1f5ff
    style V2 fill:#e1f5ff
    style V3 fill:#e1f5ff
```

<ModelServingComparison />

**Kubernetes 통합:**

- Kubernetes Deployment로 배포
- Service를 통해 노출
- 큐 깊이 메트릭 기반 HPA로 스케일링
- resource requests/limits를 통한 GPU 할당
- **K8s 1.33+**: In-place resource resizing으로 Pod 재시작 없이 GPU 메모리 조정 가능

### 2. 추론 게이트웨이: Kgateway + LiteLLM

**Kgateway** (v2.0+)는 Kubernetes Gateway API 기반의 AI 추론 게이트웨이로, **멀티 모델 라우팅과 트래픽 관리**를 제공합니다. Gateway API v1.2.0+를 지원하며, HTTPRoute 및 GRPCRoute를 완벽하게 지원합니다.

**LiteLLM** (latest)은 다양한 LLM 프로바이더를 **통합 API로 추상화**하여 모델 전환을 용이하게 합니다.

```mermaid
flowchart TD
    CLIENT["Client Applications"]

    subgraph Gateway["Gateway 계층"]
        KGW["Kgateway<br/>Inference Gateway"]
        LITE["LiteLLM<br/>Provider Abstraction"]
    end

    subgraph Backends["모델 백엔드"]
        SELF["Self-hosted<br/>vLLM / TGI"]
        BEDROCK["Amazon<br/>Bedrock"]
        OPENAI["OpenAI API"]
    end

    CLIENT --> KGW
    KGW --> LITE
    LITE --> SELF
    LITE --> BEDROCK
    LITE --> OPENAI

    style KGW fill:#e1f5ff
    style LITE fill:#f0e1ff
    style Gateway fill:#fff4e1
    style Backends fill:#f0f0f0
```

<InferenceGatewayComparison />

**Kubernetes 통합:**

- Kubernetes Gateway API v1.2.0+ 표준 구현
- HTTPRoute 리소스를 통한 선언적 라우팅
- Kubernetes Service와 네이티브 통합
- 크로스 네임스페이스 라우팅 지원
- **K8s 1.33+**: Topology-aware routing으로 크로스 AZ 트래픽 비용 절감 및 지연 시간 개선

### 3. LLM Observability: LangFuse + LangSmith

**LangFuse**와 **LangSmith**는 LLM 애플리케이션의 **전체 라이프사이클을 추적**하는 관측성 플랫폼입니다.

```mermaid
flowchart LR
    subgraph Application["LLM Application"]
        APP["Agent<br/>Application"]
        CHAIN["LangChain<br/>LlamaIndex"]
    end

    subgraph Platform["Observability Platform"]
        LF["LangFuse<br/>Self-hosted"]
        LS["LangSmith<br/>Managed"]
    end

    subgraph Features["분석 기능"]
        TRACE["Trace<br/>분석"]
        COST["비용<br/>추적"]
        EVAL["품질<br/>평가"]
        DEBUG["디버깅"]
    end

    APP --> CHAIN
    CHAIN --> LF
    CHAIN --> LS
    LF --> TRACE
    LF --> COST
    LF --> EVAL
    LF --> DEBUG
    LS --> TRACE
    LS --> COST
    LS --> EVAL
    LS --> DEBUG

    style LF fill:#fff4e1
    style LS fill:#f0e1ff
```

<ObservabilityComparison />

**Kubernetes 통합 (LangFuse):**

- StatefulSet 또는 Deployment로 배포
- PostgreSQL 백엔드 필요 (관리형 RDS 또는 클러스터 내 구성 가능)
- Prometheus 형식의 메트릭 노출
- Pod 환경 변수를 통한 SDK 연동
- **K8s 1.33+**: Stable sidecar containers로 로깅 및 메트릭 수집 사이드카 안정화

### 4. Agent 오케스트레이션: KAgent

**KAgent**는 Kubernetes 네이티브 AI Agent 프레임워크로, **Agent 워크플로우를 CRD로 정의**하고 관리합니다.

```mermaid
flowchart TD
    subgraph KAgent["KAgent Architecture"]
        CRD["Agent CRD<br/>선언적 정의"]
        CTRL["KAgent Controller<br/>상태 관리"]

        subgraph Components["Agent Components"]
            TOOL["Tool<br/>Definitions"]
            MEM["Memory<br/>Store"]
            LLM["LLM<br/>Backend"]
        end
    end

    subgraph Integration["통합"]
        KGW["Kgateway"]
        OBS["LangFuse"]
    end

    CRD --> CTRL
    CTRL --> TOOL
    CTRL --> MEM
    CTRL --> LLM
    CTRL --> KGW
    CTRL --> OBS

    style CRD fill:#e1ffe1
    style CTRL fill:#e1ffe1
    style KAgent fill:#f0f0f0
```

<KAgentFeatures />

**Kubernetes 통합:**

- Custom Resource Definitions (CRD)로 Kubernetes 확장
- Controller 패턴을 통한 상태 조정
- Kubernetes RBAC와 네이티브 통합
- Kubernetes Secrets를 활용한 API 키 관리

### 솔루션 스택 통합 아키텍처

```mermaid
flowchart TD
    subgraph Client["Client Layer"]
        WEB["Web App"]
        API["API Clients"]
        AGENT["Agents"]
    end

    subgraph Gateway["Gateway Layer"]
        KGW["Kgateway"]
        LITE["LiteLLM"]
    end

    subgraph Orchestration["Orchestration"]
        KAGENT["KAgent"]
        KEDA["KEDA"]
    end

    subgraph Serving["Model Serving"]
        LLMD["llm-d"]
        VLLM1["vLLM-1"]
        VLLM2["vLLM-2"]
        VLLM3["vLLM-3"]
    end

    subgraph Infra["Infrastructure"]
        KARP["Karpenter"]
        GPU1["GPU<br/>Node 1"]
        GPU2["GPU<br/>Node 2"]
        GPU3["GPU<br/>Node 3"]
    end

    subgraph Obs["Observability"]
        LF["LangFuse"]
        PROM["Prometheus"]
        GRAF["Grafana"]
    end

    WEB --> KGW
    API --> KGW
    AGENT --> KGW
    KGW --> LITE
    LITE --> KAGENT
    KAGENT --> LLMD
    LLMD --> VLLM1
    LLMD --> VLLM2
    LLMD --> VLLM3
    VLLM1 --> GPU1
    VLLM2 --> GPU2
    VLLM3 --> GPU3
    KARP --> GPU1
    KARP --> GPU2
    KARP --> GPU3
    KEDA --> VLLM1
    KEDA --> VLLM2
    KEDA --> VLLM3

    KAGENT -.-> LF
    VLLM1 -.-> PROM
    VLLM2 -.-> PROM
    VLLM3 -.-> PROM
    PROM --> GRAF
    LF --> GRAF

    style KGW fill:#e1f5ff
    style KAGENT fill:#e1ffe1
    style KARP fill:#ffd93d
    style LF fill:#fff4e1
    style LLMD fill:#ffe1e1
```

---

### 오픈소스 통합 전체 아키텍처

```mermaid
flowchart TD
    subgraph App["Application Layer"]
        AGENT["Agentic AI<br/>Application"]
        RAG["RAG Pipeline"]
    end

    subgraph ObsLayer["LLM Observability"]
        LF["LangFuse"]
        LS["LangSmith"]
        RAGAS["RAGAS"]
    end

    subgraph GatewayLayer["Inference Gateway"]
        LITE["LiteLLM"]
        KGW["Kgateway"]
    end

    subgraph ServingLayer["Model Serving"]
        LLMD["llm-d"]
        VLLM["vLLM"]
    end

    subgraph VectorDB["Vector DB"]
        MILVUS["Milvus"]
    end

    subgraph GPUInfra["GPU Infrastructure"]
        DRA["DRA"]
        DCGM["DCGM"]
        NCCL["NCCL"]
        KARP["Karpenter"]
    end

    AGENT --> LF
    AGENT --> LS
    AGENT --> LITE
    RAG --> MILVUS
    RAG --> RAGAS
    LITE --> KGW
    KGW --> LLMD
    LLMD --> VLLM
    VLLM --> DRA
    DRA --> DCGM
    VLLM --> NCCL
    KARP --> DRA

    style LF fill:#fff4e1
    style LS fill:#f0e1ff
    style RAGAS fill:#fff4e1
    style LITE fill:#f0e1ff
    style LLMD fill:#ffe1e1
    style MILVUS fill:#e1f5ff
    style DRA fill:#326ce5,color:#fff
    style DCGM fill:#e1ffe1
    style NCCL fill:#e1ffe1
    style KARP fill:#ffd93d
```

### 계층별 오픈소스 역할과 통합

#### LLM Observability 계층: LangFuse, LangSmith, RAGAS

LLM 애플리케이션의 **전체 라이프사이클을 추적하고 품질을 평가**하는 핵심 도구들입니다.

<ObservabilityLayerStack />

```mermaid
flowchart LR
    subgraph Application["LLM Application"]
        APP["Agent App"]
        SDK1["LangFuse<br/>SDK"]
        SDK2["LangSmith<br/>SDK"]
    end

    subgraph K8s["Kubernetes Cluster"]
        subgraph LFStack["LangFuse Stack"]
            LF_WEB["LangFuse<br/>Web"]
            LF_WORKER["LangFuse<br/>Worker"]
            LF_DB["PostgreSQL"]
            LF_REDIS["Redis"]
        end

        subgraph Evaluation["RAGAS Evaluation"]
            RAGAS_JOB["RAGAS<br/>Job"]
        end
    end

    APP --> SDK1
    SDK1 --> LF_WEB
    APP --> SDK2
    LF_WEB --> LF_WORKER
    LF_WORKER --> LF_DB
    LF_WORKER --> LF_REDIS
    RAGAS_JOB --> LF_DB

    style LF_WEB fill:#fff4e1
    style RAGAS_JOB fill:#fff4e1
```

**LangFuse Kubernetes 배포 예시:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse-web
  namespace: observability
spec:
  replicas: 2
  selector:
    matchLabels:
      app: langfuse-web
  template:
    spec:
      containers:
        - name: langfuse
          image: langfuse/langfuse:latest
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
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ragas-evaluation
  namespace: observability
spec:
  schedule: "0 */6 * * *"  # 6시간마다 실행
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: ragas
              image: ragas/ragas:latest
              command: ["python", "-m", "ragas.evaluate"]
              env:
                - name: LANGFUSE_HOST
                  value: "http://langfuse-web:3000"
          restartPolicy: OnFailure
```

#### Inference Gateway 계층: LiteLLM

**LiteLLM**은 100개 이상의 LLM 프로바이더를 **통합 OpenAI 호환 API로 추상화**합니다.

```mermaid
flowchart TD
    subgraph Gateway["LiteLLM Gateway"]
        PROXY["LiteLLM<br/>Proxy"]
        CONFIG["Config<br/>ConfigMap"]
        CACHE["Redis<br/>Cache"]
    end

    subgraph Backends["LLM Backends"]
        SELF["Self-hosted<br/>vLLM/TGI"]
        BEDROCK["Amazon<br/>Bedrock"]
        OPENAI["OpenAI<br/>API"]
        ANTHROPIC["Anthropic<br/>API"]
    end

    subgraph Features["기능"]
        LB["Load<br/>Balancing"]
        FALLBACK["Fallback<br/>Logic"]
        COST["Cost<br/>Tracking"]
        RATE["Rate<br/>Limiting"]
    end

    CONFIG --> PROXY
    CACHE --> PROXY
    PROXY --> SELF
    PROXY --> BEDROCK
    PROXY --> OPENAI
    PROXY --> ANTHROPIC
    PROXY --> LB
    PROXY --> FALLBACK
    PROXY --> COST
    PROXY --> RATE

    style PROXY fill:#f0e1ff
    style Gateway fill:#f0f0f0
```

**LiteLLM Kubernetes 배포 예시:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-proxy
  namespace: ai-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: litellm
  template:
    spec:
      containers:
        - name: litellm
          image: ghcr.io/berriai/litellm:main-latest
          ports:
            - containerPort: 4000
          env:
            - name: LITELLM_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  name: litellm-secrets
                  key: master-key
            - name: REDIS_HOST
              value: "redis-cache"
          volumeMounts:
            - name: config
              mountPath: /app/config.yaml
              subPath: config.yaml
      volumes:
        - name: config
          configMap:
            name: litellm-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: litellm-config
  namespace: ai-gateway
data:
  config.yaml: |
    model_list:
      - model_name: gpt-4
        litellm_params:
          model: openai/gpt-4
          api_key: os.environ/OPENAI_API_KEY
      - model_name: claude-3
        litellm_params:
          model: anthropic/claude-3-opus
          api_key: os.environ/ANTHROPIC_API_KEY
      - model_name: llama-70b
        litellm_params:
          model: openai/llama-70b
          api_base: http://vllm-llama:8000/v1

    router_settings:
      routing_strategy: least-busy
      enable_fallbacks: true

    general_settings:
      master_key: os.environ/LITELLM_MASTER_KEY
```

#### 분산 추론 계층: llm-d

**llm-d**는 Kubernetes 환경에서 LLM 추론 요청을 **지능적으로 분산**하는 스케줄러입니다.

<LlmdFeatures />

```mermaid
flowchart LR
    subgraph LlmdArch["llm-d Architecture"]
        ROUTER["llm-d<br/>Router"]
        SCHED["Scheduler<br/>Logic"]
        CACHE["Prefix<br/>Cache"]
    end

    subgraph VllmBackends["vLLM Backends"]
        V1["vLLM-1<br/>A100"]
        V2["vLLM-2<br/>A100"]
        V3["vLLM-3<br/>H100"]
    end

    subgraph K8sResources["Kubernetes Resources"]
        SVC["Service"]
        EP["Endpoint<br/>Slice"]
        HPA["HPA/<br/>KEDA"]
    end

    ROUTER --> SCHED
    SCHED --> CACHE
    SCHED --> V1
    SCHED --> V2
    SCHED --> V3
    SVC --> ROUTER
    EP --> V1
    EP --> V2
    EP --> V3
    HPA --> V1
    HPA --> V2
    HPA --> V3

    style ROUTER fill:#ffe1e1
    style SCHED fill:#ffe1e1
```

**llm-d Kubernetes 배포 예시:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-d-router
  namespace: ai-inference
spec:
  replicas: 2
  selector:
    matchLabels:
      app: llm-d
  template:
    spec:
      containers:
        - name: llm-d
          image: ghcr.io/llm-d/llm-d:latest
          ports:
            - containerPort: 8080
          env:
            - name: BACKENDS
              value: "vllm-0.vllm:8000,vllm-1.vllm:8000,vllm-2.vllm:8000"
            - name: ROUTING_STRATEGY
              value: "prefix-aware"
            - name: PROMETHEUS_ENDPOINT
              value: "http://prometheus:9090"
          resources:
            requests:
              memory: "256Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: llm-d
  namespace: ai-inference
spec:
  selector:
    app: llm-d
  ports:
    - port: 8080
      targetPort: 8080
```

### 5. 벡터 데이터베이스 계층: Milvus

RAG 파이프라인의 핵심 컴포넌트인 Milvus는 Kubernetes에서 분산 아키텍처로 운영됩니다.

자세한 내용은 **[Milvus 벡터 데이터베이스](../gateway-agents/milvus-vector-database.md)** 문서를 참조하세요.

**Milvus의 주요 특징:**

- **분산 아키텍처**: Query/Data/Index Nodes를 독립적으로 스케일링
- **Kubernetes Operator**: CRD 기반 선언적 관리
- **GPU 가속**: Index Node에서 GPU를 활용한 빠른 인덱스 빌드
- **S3 통합**: Amazon S3를 영구 스토리지로 사용 가능

### 6. 분산 학습: NeMo + Kubeflow

**NVIDIA NeMo**와 **Kubeflow**는 대규모 모델의 **분산 학습 파이프라인 자동화**를 제공합니다.

<DistributedTrainingStack />

```mermaid
flowchart LR
    subgraph DataPipeline["데이터 파이프라인"]
        DATA["학습<br/>데이터"]
        PREP["데이터<br/>전처리"]
    end

    subgraph TrainingCluster["학습 클러스터"]
        NEMO["NeMo<br/>Framework"]
        DIST["분산<br/>학습"]
    end

    subgraph ModelRegistry["모델 레지스트리"]
        CKPT["체크포인트<br/>저장"]
        MLFLOW["MLflow<br/>Registry"]
    end

    subgraph Deployment["배포"]
        SERVE["모델<br/>서빙"]
        CANARY["Canary<br/>배포"]
    end

    DATA --> PREP
    PREP --> NEMO
    NEMO --> DIST
    DIST --> CKPT
    CKPT --> MLFLOW
    MLFLOW --> SERVE
    SERVE --> CANARY

    style NEMO fill:#e1ffe1
    style DIST fill:#e1ffe1
```

**Kubernetes 통합:**

- Kubeflow Training Operators (PyTorchJob, MPIJob 등)
- 분산 워크로드를 위한 Gang 스케줄링
- 토폴로지 인식 스케줄링 (노드 어피니티, 안티 어피니티)
- 공유 스토리지를 위한 CSI 드라이버 연동 (FSx for Lustre)

---

## GPU 인프라 및 리소스 관리

GPU 리소스 관리는 Agentic AI 플랫폼의 핵심입니다. 자세한 내용은 다음 문서를 참조하세요:

- **[GPU 리소스 관리](../model-serving/gpu-resource-management.md)**: Device Plugin, DRA(Dynamic Resource Allocation), GPU 토폴로지 인식 스케줄링
- **[NeMo 프레임워크](../model-serving/nemo-framework.md)**: 분산 학습과 NCCL 최적화

:::tip GPU 관리의 핵심 개념

- **Device Plugin**: Kubernetes의 기본 GPU 할당 메커니즘
- **DRA (Dynamic Resource Allocation)**: Kubernetes 1.26+의 유연한 리소스 관리
- **NCCL**: 분산 GPU 학습을 위한 고성능 통신 라이브러리
:::

### GPU 인프라 스택 개요

```mermaid
flowchart TD
    subgraph InfraStack["GPU Infrastructure Stack"]
        subgraph ResourceAlloc["Resource Allocation"]
            DRA["DRA<br/>K8s 1.32+"]
            DRIVER["NVIDIA<br/>Device Plugin"]
        end

        subgraph Monitoring["모니터링"]
            DCGM["DCGM<br/>Exporter"]
            PROM["Prometheus"]
            GRAF["Grafana"]
        end

        subgraph Communication["통신"]
            NCCL["NCCL<br/>GPU Comm"]
            EFA["EFA Driver"]
        end

        subgraph NodeMgmt["Node Management"]
            KARP["Karpenter<br/>v1.0+"]
            GPU_OP["GPU<br/>Operator"]
        end
    end

    subgraph GPUNodes["GPU Nodes"]
        N1["Node 1<br/>8x A100"]
        N2["Node 2<br/>8x A100"]
        N3["Node 3<br/>8x H100"]
        N4["Node 4<br/>8x H200"]
    end

    DRA --> DRIVER
    DRIVER --> N1
    DRIVER --> N2
    DRIVER --> N3
    DRIVER --> N4
    DCGM --> N1
    DCGM --> N2
    DCGM --> N3
    DCGM --> N4
    DCGM --> PROM
    PROM --> GRAF
    NCCL --> EFA
    EFA --> N1
    EFA --> N2
    EFA --> N3
    EFA --> N4
    KARP --> N1
    KARP --> N2
    KARP --> N3
    KARP --> N4
    GPU_OP --> DRIVER
    GPU_OP --> DCGM

    style DRA fill:#326ce5,color:#fff
    style DCGM fill:#e1ffe1
    style NCCL fill:#e1ffe1
    style KARP fill:#ffd93d
```

<GpuInfraStack />

---

## 결론: 왜 Agentic AI에 Kubernetes인가?

Kubernetes는 현대 Agentic AI 플랫폼을 가능하게 하는 **기본 인프라 계층**을 제공합니다:

### 핵심 장점

1. **통합 플랫폼**: 추론, 학습, 오케스트레이션을 위한 단일 플랫폼
2. **선언적 관리**: 버전 관리가 가능한 Infrastructure as Code
3. **풍부한 생태계**: AI 워크로드를 위한 광범위한 오픈소스 솔루션
4. **클라우드 이식성**: 어디서나 실행 가능 (온프레미스, AWS, GCP, Azure)
5. **성숙한 도구**: kubectl, Helm, operators, 모니터링 스택
6. **활발한 커뮤니티**: Kubernetes AI/ML SIG가 혁신을 주도

### 앞으로의 방향

```mermaid
flowchart LR
    START["Agentic AI<br/>요구사항"]
    K8S["Kubernetes<br/>기반 플랫폼"]
    OSS["오픈소스<br/>생태계"]
    CLOUD["클라우드<br/>프로바이더 통합"]
    SOLUTION["완전한<br/>AI 플랫폼"]

    START --> K8S
    K8S --> OSS
    OSS --> CLOUD
    CLOUD --> SOLUTION

    style START fill:#ffe1e1
    style K8S fill:#326ce5,color:#fff
    style OSS fill:#e1ffe1
    style CLOUD fill:#ff9900,color:#fff
    style SOLUTION fill:#e1f5ff
```

Agentic AI 플랫폼을 구축하는 조직을 위한 권장 사항:

1. **Kubernetes로 시작**: 팀 내 Kubernetes 전문성 확보
2. **오픈소스 활용**: 검증된 솔루션 도입 (vLLM, LangFuse 등)
3. **클라우드 통합**: 오픈소스와 관리형 서비스 결합
4. **인프라 자동화**: 자동 스케일링 및 프로비저닝 구현
5. **전면적 관측성**: 첫날부터 포괄적인 관측성 확보

:::info 다음 단계: EKS 기반 솔루션
이러한 도전과제를 해결하기 위한 **Amazon EKS와 AWS 서비스** 활용 방법은 [EKS 기반 Agentic AI 솔루션](./agentic-ai-solutions-eks.md)을 참조하세요.
:::

---

## 다음 단계

이 문서에서는 Agentic AI 워크로드의 4가지 핵심 도전과제와 Kubernetes 기반 오픈소스 생태계를 살펴보았습니다.

:::info 다음 단계: EKS 기반 해결방안
이 문서에서 소개한 도전과제들을 **Amazon EKS와 AWS 서비스**를 활용하여 해결하는 구체적인 방법은 [EKS 기반 Agentic AI 해결방안](./agentic-ai-solutions-eks.md)을 참조하세요.

다음 문서에서 다룰 내용:

- EKS Auto Mode로 완전 자동화된 클러스터 구축
- Karpenter를 통한 GPU 노드 자동 프로비저닝
- AWS 서비스와의 통합 (Bedrock, S3, CloudWatch)
- 프로덕션 환경을 위한 보안 및 운영 전략
- 실전 배포 가이드 및 트러블슈팅
:::

---

## 참고 자료

### Kubernetes 및 인프라

- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Karpenter 공식 문서](https://karpenter.sh/docs/)
- [Amazon EKS Best Practices Guide](https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html)
- [NVIDIA GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
- [KEDA - Kubernetes Event-driven Autoscaling](https://keda.sh/)

### 모델 서빙 및 추론

- [vLLM Documentation](https://docs.vllm.ai/)
- [llm-d Project](https://github.com/llm-d/llm-d)
- [Kgateway Documentation](https://kgateway.io/docs/)
- [LiteLLM Documentation](https://docs.litellm.ai/)

### LLM Observability

- [LangFuse Documentation](https://langfuse.com/docs)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [RAGAS Documentation](https://docs.ragas.io/)

### 벡터 데이터베이스

- [Milvus Documentation](https://milvus.io/docs)
- [Milvus Operator](https://github.com/milvus-io/milvus-operator)

### GPU 인프라

- [NVIDIA GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/)
- [DCGM Exporter](https://github.com/NVIDIA/dcgm-exporter)
- [NCCL Documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/index.html)
- [AWS EFA Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html)

### Agent 프레임워크 및 학습

- [KAgent - Kubernetes Agent Framework](https://github.com/kagent-dev/kagent)
- [NVIDIA NeMo Framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/overview.html)
- [Kubeflow Documentation](https://www.kubeflow.org/docs/)
