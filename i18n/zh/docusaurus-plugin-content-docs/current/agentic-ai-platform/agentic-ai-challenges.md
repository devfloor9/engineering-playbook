---
title: "Agentic AI 工作负载的技术挑战"
sidebar_label: "1. Technical Challenges"
description: "运营 Agentic AI 工作负载的 4 大核心技术挑战及基于 Kubernetes 的开源生态系统"
tags: [kubernetes, genai, agentic-ai, gpu, challenges, open-source]
category: "genai-aiml"
sidebar_position: 1
last_update:
  date: 2026-02-14
  author: devfloor9
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { ChallengeSummary, K8sCoreFeatures, SolutionMapping, ModelServingComparison, InferenceGatewayComparison, ObservabilityComparison, KAgentFeatures, ObservabilityLayerStack, LlmdFeatures, DistributedTrainingStack, GpuInfraStack } from '@site/src/components/AgenticChallengesTables';

> 📅 **撰写日期**: 2025-02-05 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 7 分钟

## 简介

在构建和运营 Agentic AI 平台时，平台工程师和架构师面临着与传统 Web 应用根本不同的独特技术挑战。本文分析了 **4 大核心挑战**，并探讨了旨在解决这些挑战的**基于 Kubernetes 的开源生态系统**。

## Agentic AI 平台的 4 大核心技术挑战

利用前沿模型（最新大语言模型）的 Agentic AI 系统与传统 Web 应用有着**根本不同的基础设施需求**。

```mermaid
graph TB
    subgraph "4 Key Technical Challenges"
        C1["🖥️ Challenge 1<br/>GPU Monitoring & Resource Scheduling"]
        C2["🔀 Challenge 2<br/>Agentic AI Request Dynamic Routing & Scaling"]
        C3["📊 Challenge 3<br/>Token/Session Level Monitoring & Cost Control"]
        C4["🔧 Challenge 4<br/>FM Fine-tuning & Automation Pipeline"]
    end

    subgraph "Common Characteristics"
        COMMON["GPU Resource Intensive<br/>Unpredictable Workloads<br/>High Infrastructure Costs<br/>Complex Distributed Systems"]
    end

    C1 --> COMMON
    C2 --> COMMON
    C3 --> COMMON
    C4 --> COMMON

    style C1 fill:#ff6b6b
    style C2 fill:#4ecdc4
    style C3 fill:#45b7d1
    style C4 fill:#96ceb4
    style COMMON fill:#f9f9f9
```

### 挑战概述

<ChallengeSummary />

:::warning 传统基础设施方案的局限性
传统的基于虚拟机的基础设施或手动管理方式无法有效应对 Agentic AI 的**动态且不可预测的工作负载模式**。GPU 资源的高昂成本和复杂的分布式系统要求使得**自动化基础设施管理**成为必需。
:::

---

## 解决之道：云基础设施自动化与 AI 平台的融合

解决 Agentic AI 平台挑战的关键在于**云基础设施自动化与 AI 工作负载的有机融合**。以下是这种融合至关重要的原因：

```mermaid
graph LR
    subgraph "AI Workload Characteristics"
        AI1["Dynamic Resource Demands"]
        AI2["Unpredictable Traffic"]
        AI3["High-cost GPU Resources"]
        AI4["Complex Distributed Processing"]
    end

    subgraph "Infrastructure Automation Requirements"
        INF1["Real-time Provisioning"]
        INF2["Automatic Scaling"]
        INF3["Cost Optimization"]
        INF4["Declarative Management"]
    end

    subgraph "Integration Platform"
        PLATFORM["Kubernetes<br/>Container Orchestration"]
    end

    AI1 --> PLATFORM
    AI2 --> PLATFORM
    AI3 --> PLATFORM
    AI4 --> PLATFORM
    PLATFORM --> INF1
    PLATFORM --> INF2
    PLATFORM --> INF3
    PLATFORM --> INF4

    style PLATFORM fill:#326ce5
```

## 为什么选择 Kubernetes？

Kubernetes 是解决 Agentic AI 平台所有挑战的**理想基础平台**：

<K8sCoreFeatures />

```mermaid
graph TB
    subgraph "Kubernetes Core Components"
        API["API Server<br/>Declarative Resource Management"]
        SCHED["Scheduler<br/>GPU-aware Scheduling"]
        CTRL["Controller Manager<br/>State Reconciliation Loop"]
        ETCD["etcd<br/>Cluster State Storage"]
    end

    subgraph "AI Workload Support"
        GPU["GPU Device Plugin<br/>GPU Resource Abstraction"]
        HPA["HPA/KEDA<br/>Metrics-based Scaling"]
        OP["Operators<br/>Complex Workflow Automation"]
    end

    subgraph "Challenge Resolution"
        S1["✅ Integrated GPU Resource Management"]
        S2["✅ Dynamic Scaling"]
        S3["✅ Resource Quota Management"]
        S4["✅ Distributed Learning Automation"]
    end

    API --> GPU
    SCHED --> GPU
    CTRL --> HPA
    CTRL --> OP
    GPU --> S1
    HPA --> S2
    API --> S3
    OP --> S4

    style API fill:#326ce5
    style SCHED fill:#326ce5
    style CTRL fill:#326ce5
```

:::info Kubernetes 对 AI 工作负载的支持
Kubernetes 提供了与 AI/ML 生态系统的丰富集成，包括 NVIDIA GPU Operator、Kubeflow 和 KEDA。通过这些集成，GPU 资源管理、分布式训练和模型服务可以在**单一平台上统一管理**。
:::

---

既然我们已经了解了为什么 Kubernetes 是 AI 工作负载的理想选择，接下来让我们看看**针对每个挑战的具体开源解决方案**。

## Kubernetes Agentic AI 解决方案鸟瞰图

Kubernetes 生态系统拥有**专门的开源解决方案**来解决 Agentic AI 平台的每个挑战。这些解决方案被设计为 Kubernetes 原生的，让您能够充分利用**声明式管理、自动扩展和高可用性**的优势。

### 解决方案映射概览

```mermaid
graph TB
    subgraph "4 Key Technical Challenges"
        C1["🖥️ GPU Monitoring &<br/>Resource Scheduling"]
        C2["🔀 Dynamic Routing &<br/>Scaling"]
        C3["📊 Token/Session Monitoring<br/>& Cost Control"]
        C4["🔧 FM Fine-tuning &<br/>Automation Pipeline"]
    end

    subgraph "Kubernetes Native Solutions"
        S1["Karpenter<br/>GPU Node Auto Provisioning"]
        S2["Kgateway + LiteLLM<br/>Inference Gateway"]
        S3["LangFuse / LangSmith<br/>LLM Observability"]
        S4["NeMo + Kubeflow<br/>Distributed Training Pipeline"]
    end

    subgraph "Model Serving Layer"
        VLLM["vLLM<br/>High-Performance Inference Engine"]
        LLMD["llm-d<br/>Distributed Inference Scheduler"]
    end

    subgraph "Agent Orchestration"
        KAGENT["KAgent<br/>Kubernetes Agent Framework"]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4

    S2 --> VLLM
    S2 --> LLMD
    KAGENT --> S2
    KAGENT --> S3

    style C1 fill:#ff6b6b
    style C2 fill:#4ecdc4
    style C3 fill:#45b7d1
    style C4 fill:#96ceb4
    style S1 fill:#ffd93d
    style S2 fill:#4286f4
    style S3 fill:#9b59b6
    style S4 fill:#76b900
    style VLLM fill:#e74c3c
    style LLMD fill:#e74c3c
    style KAGENT fill:#2ecc71
```

### 挑战对应的解决方案详细映射

<SolutionMapping />

---

到目前为止，我们已经概览了 Kubernetes 生态系统中的各种解决方案。现在让我们从开源架构的角度，深入了解**这些解决方案如何实际集成和协同工作**。

## 开源生态系统与 Kubernetes 集成架构

Agentic AI 平台由各种开源项目组成，它们围绕 Kubernetes 有机地集成在一起。本节说明 **LLM 可观测性、模型服务、向量数据库和 GPU 基础设施**中的核心开源项目如何协作，形成完整的 Agentic AI 平台。

### 1. 模型服务：vLLM + llm-d

**vLLM** 是一个高性能的 LLM 推理服务引擎，通过 PagedAttention **最大化内存效率**。

**llm-d** 是一个在 Kubernetes 环境中**智能分发** LLM 推理请求的调度器。

```mermaid
graph LR
    subgraph "Inference Request Flow"
        REQ["Client Request"]
        LLMD["llm-d<br/>Request Router"]

        subgraph "vLLM Instances"
            V1["vLLM Pod 1<br/>GPU: A100"]
            V2["vLLM Pod 2<br/>GPU: A100"]
            V3["vLLM Pod 3<br/>GPU: H100"]
        end
    end

    REQ --> LLMD
    LLMD --> V1
    LLMD --> V2
    LLMD --> V3

    style LLMD fill:#e74c3c
    style V1 fill:#3498db
    style V2 fill:#3498db
    style V3 fill:#3498db
```

<ModelServingComparison />

**Kubernetes 集成：**

- 以 Kubernetes Deployment 形式部署
- 通过 Service 暴露服务
- 基于队列深度指标通过 HPA 进行扩展
- 通过资源请求/限制进行 GPU 分配

### 2. 推理网关：Kgateway + LiteLLM

**Kgateway** 是一个基于 Kubernetes Gateway API 的 AI 推理网关，提供**多模型路由和流量管理**。

**LiteLLM** 通过统一 API **抽象各种 LLM 提供商**，使模型切换变得简单。

```mermaid
graph TB
    subgraph "Gateway Layer"
        CLIENT["Client Applications"]
        KGW["Kgateway<br/>Inference Gateway"]
        LITE["LiteLLM<br/>Provider Abstraction"]
    end

    subgraph "Model Backends"
        SELF["Self-hosted<br/>vLLM / TGI"]
        BEDROCK["Amazon Bedrock"]
        OPENAI["OpenAI API"]
    end

    CLIENT --> KGW
    KGW --> LITE
    LITE --> SELF
    LITE --> BEDROCK
    LITE --> OPENAI

    style KGW fill:#4286f4
    style LITE fill:#9b59b6
```

<InferenceGatewayComparison />

**Kubernetes 集成：**

- 实现 Kubernetes Gateway API（标准）
- 通过 HTTPRoute 资源进行声明式路由
- 与 Kubernetes Service 原生集成
- 支持跨命名空间路由

### 3. LLM 可观测性：LangFuse + LangSmith

**LangFuse** 和 **LangSmith** 是**追踪 LLM 应用全生命周期**的可观测性平台。

```mermaid
graph LR
    subgraph "LLM Application"
        APP["Agent Application"]
        CHAIN["LangChain / LlamaIndex"]
    end

    subgraph "Observability Platform"
        LF["LangFuse<br/>(Self-hosted)"]
        LS["LangSmith<br/>(Managed)"]
    end

    subgraph "Analysis Features"
        TRACE["Trace Analysis"]
        COST["Cost Tracking"]
        EVAL["Quality Evaluation"]
        DEBUG["Debugging"]
    end

    APP --> CHAIN
    CHAIN --> LF
    CHAIN --> LS
    LF --> TRACE & COST & EVAL & DEBUG
    LS --> TRACE & COST & EVAL & DEBUG

    style LF fill:#45b7d1
    style LS fill:#9b59b6
```

<ObservabilityComparison />

**Kubernetes 集成（LangFuse）：**

- 以 StatefulSet 或 Deployment 形式部署
- 需要 PostgreSQL 后端（可使用托管 RDS 或集群内部署）
- 以 Prometheus 格式暴露指标
- 通过 Pod 中的环境变量进行 SDK 集成

### 4. Agent 编排：KAgent

**KAgent** 是一个 Kubernetes 原生的 AI Agent 框架，**将 Agent 工作流定义为 CRD 并进行管理**。

```mermaid
graph TB
    subgraph "KAgent Architecture"
        CRD["Agent CRD<br/>Declarative Definition"]
        CTRL["KAgent Controller<br/>State Management"]

        subgraph "Agent Components"
            TOOL["Tool Definitions"]
            MEM["Memory Store"]
            LLM["LLM Backend"]
        end
    end

    subgraph "Integration"
        KGW["Kgateway"]
        OBS["LangFuse"]
    end

    CRD --> CTRL
    CTRL --> TOOL & MEM & LLM
    CTRL --> KGW
    CTRL --> OBS

    style CRD fill:#2ecc71
    style CTRL fill:#2ecc71
```

<KAgentFeatures />

**Kubernetes 集成：**

- 通过自定义资源定义（CRD）扩展 Kubernetes
- 控制器模式实现状态协调
- 与 Kubernetes RBAC 原生集成
- 利用 Kubernetes Secrets 管理 API 密钥

### 解决方案栈集成架构

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["Web Application"]
        API["API Clients"]
        AGENT["Agent Applications"]
    end

    subgraph "Gateway Layer"
        KGW["Kgateway<br/>Traffic Management"]
        LITE["LiteLLM<br/>Provider Abstraction"]
    end

    subgraph "Orchestration Layer"
        KAGENT["KAgent<br/>Agent Framework"]
        KEDA["KEDA<br/>Event-driven Scaling"]
    end

    subgraph "Serving Layer"
        LLMD["llm-d<br/>Request Scheduler"]
        VLLM1["vLLM Instance 1"]
        VLLM2["vLLM Instance 2"]
        VLLM3["vLLM Instance 3"]
    end

    subgraph "Infrastructure Layer"
        KARP["Karpenter<br/>Node Provisioning"]
        GPU1["GPU Node 1"]
        GPU2["GPU Node 2"]
        GPU3["GPU Node 3"]
    end

    subgraph "Observability Layer"
        LF["LangFuse<br/>LLM Tracing"]
        PROM["Prometheus<br/>Metrics"]
        GRAF["Grafana<br/>Dashboards"]
    end

    WEB & API & AGENT --> KGW
    KGW --> LITE
    LITE --> KAGENT
    KAGENT --> LLMD
    LLMD --> VLLM1 & VLLM2 & VLLM3
    VLLM1 --> GPU1
    VLLM2 --> GPU2
    VLLM3 --> GPU3
    KARP --> GPU1 & GPU2 & GPU3
    KEDA --> VLLM1 & VLLM2 & VLLM3

    KAGENT -.-> LF
    VLLM1 & VLLM2 & VLLM3 -.-> PROM
    PROM --> GRAF
    LF --> GRAF

    style KGW fill:#4286f4
    style KAGENT fill:#2ecc71
    style KARP fill:#ffd93d
    style LF fill:#45b7d1
    style LLMD fill:#e74c3c
```

---

### 完整的开源集成架构

```mermaid
graph TB
    subgraph "Application Layer"
        AGENT["Agentic AI Application"]
        RAG["RAG Pipeline"]
    end

    subgraph "LLM Observability Layer"
        LF["LangFuse<br/>(Self-hosted)"]
        LS["LangSmith<br/>(Managed)"]
        RAGAS["RAGAS<br/>(RAG Quality Evaluation)"]
    end

    subgraph "Inference Gateway Layer"
        LITE["LiteLLM<br/>(Provider Abstraction)"]
        KGW["Kgateway<br/>(Traffic Management)"]
    end

    subgraph "Model Serving Layer"
        LLMD["llm-d<br/>(Distributed Scheduler)"]
        VLLM["vLLM<br/>(Inference Engine)"]
    end

    subgraph "Vector Database Layer"
        MILVUS["Milvus<br/>(Vector Store)"]
    end

    subgraph "GPU Infrastructure Layer"
        DRA["DRA<br/>(Dynamic Resource Allocation)"]
        DCGM["DCGM<br/>(GPU Monitoring)"]
        NCCL["NCCL<br/>(GPU Communication)"]
        KARP["Karpenter<br/>(Node Provisioning)"]
    end

    AGENT --> LF & LS
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

    style LF fill:#45b7d1
    style LS fill:#9b59b6
    style RAGAS fill:#e67e22
    style LITE fill:#9b59b6
    style LLMD fill:#e74c3c
    style MILVUS fill:#00d4aa
    style DRA fill:#326ce5
    style DCGM fill:#76b900
    style NCCL fill:#76b900
    style KARP fill:#ffd93d
```

### 各层开源组件角色与集成

#### LLM 可观测性层：LangFuse、LangSmith、RAGAS

**追踪 LLM 应用全生命周期并评估质量**的核心工具。

<ObservabilityLayerStack />

```mermaid
graph LR
    subgraph "LLM Application"
        APP["Agent App"]
        SDK1["LangFuse SDK"]
        SDK2["LangSmith SDK"]
    end

    subgraph "Kubernetes Cluster"
        subgraph "LangFuse Stack"
            LF_WEB["LangFuse Web<br/>(Deployment)"]
            LF_WORKER["LangFuse Worker<br/>(Deployment)"]
            LF_DB["PostgreSQL<br/>(StatefulSet)"]
            LF_REDIS["Redis<br/>(StatefulSet)"]
        end

        subgraph "RAGAS Evaluation"
            RAGAS_JOB["RAGAS Job<br/>(CronJob)"]
        end
    end

    APP --> SDK1 --> LF_WEB
    APP --> SDK2
    LF_WEB --> LF_WORKER --> LF_DB
    LF_WORKER --> LF_REDIS
    RAGAS_JOB --> LF_DB

    style LF_WEB fill:#45b7d1
    style RAGAS_JOB fill:#e67e22
```

**LangFuse Kubernetes 部署示例：**

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
  schedule: "0 */6 * * *"  # 每 6 小时运行一次
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

#### 推理网关层：LiteLLM

**LiteLLM** 将 100 多个 LLM 提供商抽象为**统一的 OpenAI 兼容 API**。

```mermaid
graph TB
    subgraph "LiteLLM Gateway"
        PROXY["LiteLLM Proxy<br/>(Deployment)"]
        CONFIG["Config<br/>(ConfigMap)"]
        CACHE["Redis Cache<br/>(StatefulSet)"]
    end

    subgraph "LLM Backends"
        SELF["Self-hosted<br/>vLLM / TGI"]
        BEDROCK["Amazon Bedrock"]
        OPENAI["OpenAI API"]
        ANTHROPIC["Anthropic API"]
    end

    subgraph "Features"
        LB["Load Balancing"]
        FALLBACK["Fallback Logic"]
        COST["Cost Tracking"]
        RATE["Rate Limiting"]
    end

    PROXY --> SELF & BEDROCK & OPENAI & ANTHROPIC
    CONFIG --> PROXY
    CACHE --> PROXY
    PROXY --> LB & FALLBACK & COST & RATE

    style PROXY fill:#9b59b6
```

**LiteLLM Kubernetes 部署示例：**

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

#### 分布式推理层：llm-d

**llm-d** 是一个在 Kubernetes 环境中**智能分发** LLM 推理请求的调度器。

<LlmdFeatures />

```mermaid
graph LR
    subgraph "llm-d Architecture"
        ROUTER["llm-d Router<br/>(Deployment)"]
        SCHED["Scheduler Logic"]
        CACHE["Prefix Cache Index"]
    end

    subgraph "vLLM Backends"
        V1["vLLM-1<br/>GPU: A100"]
        V2["vLLM-2<br/>GPU: A100"]
        V3["vLLM-3<br/>GPU: H100"]
    end

    subgraph "Kubernetes Resources"
        SVC["Service"]
        EP["EndpointSlice"]
        HPA["HPA/KEDA"]
    end

    ROUTER --> SCHED --> CACHE
    SCHED --> V1 & V2 & V3
    SVC --> ROUTER
    EP --> V1 & V2 & V3
    HPA --> V1 & V2 & V3

    style ROUTER fill:#e74c3c
    style SCHED fill:#e74c3c
```

**llm-d Kubernetes 部署示例：**

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

### 5. 向量数据库层：Milvus

Milvus 是 RAG 管线的核心组件，在 Kubernetes 上以分布式架构运行。

详细信息请参阅 **[Milvus 向量数据库](./milvus-vector-database.md)**。

**Milvus 的核心特性：**

- **分布式架构**：将访问层、协调层、工作节点层和存储层分离，实现独立扩展
- **Kubernetes Operator**：基于 CRD 的声明式管理
- **GPU 加速**：在索引节点上进行 GPU 加速的索引构建
- **S3 集成**：使用 Amazon S3 作为持久化存储

### 6. 分布式训练：NeMo + Kubeflow

**NVIDIA NeMo** 和 **Kubeflow** 为大规模模型提供**自动化分布式训练管线**。

<DistributedTrainingStack />

```mermaid
graph LR
    subgraph "Data Pipeline"
        DATA["Training Data"]
        PREP["Data Preprocessing"]
    end

    subgraph "Training Cluster"
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
    NEMO --> DIST
    DIST --> CKPT
    CKPT --> MLFLOW
    MLFLOW --> SERVE
    SERVE --> CANARY

    style NEMO fill:#76b900
```

**Kubernetes 集成：**

- Kubeflow Training Operator（PyTorchJob、MPIJob 等）
- 分布式工作负载的 Gang 调度
- 拓扑感知调度（节点亲和性、反亲和性）
- 与 CSI 驱动集成实现共享存储（FSx for Lustre）

---

## GPU 基础设施与资源管理

GPU 资源管理是 Agentic AI 平台的核心。详细信息请参阅：

- **[GPU 资源管理](./gpu-resource-management.md)**：Device Plugin、DRA（动态资源分配）、GPU 拓扑感知调度
- **[NeMo 框架](./nemo-framework.md)**：分布式训练和 NCCL 优化

:::tip 关键 GPU 管理概念

- **Device Plugin**：Kubernetes 基础 GPU 分配机制
- **DRA（动态资源分配）**：Kubernetes 1.26+ 中的灵活资源管理
- **NCCL**：用于分布式 GPU 训练的高性能通信库
:::

### GPU 基础设施栈概览

```mermaid
graph TB
    subgraph "GPU Infrastructure Stack"
        subgraph "Resource Allocation"
            DRA["DRA<br/>(Dynamic Resource Allocation)"]
            DRIVER["NVIDIA Device Plugin"]
        end

        subgraph "Monitoring"
            DCGM["DCGM Exporter"]
            PROM["Prometheus"]
            GRAF["Grafana"]
        end

        subgraph "Communication"
            NCCL["NCCL<br/>(GPU Collective Comm)"]
            EFA["EFA Driver"]
        end

        subgraph "Node Management"
            KARP["Karpenter"]
            GPU_OP["GPU Operator"]
        end
    end

    subgraph "GPU Nodes"
        N1["Node 1<br/>8x A100"]
        N2["Node 2<br/>8x A100"]
        N3["Node 3<br/>8x H100"]
    end

    DRA --> DRIVER --> N1 & N2 & N3
    DCGM --> N1 & N2 & N3
    DCGM --> PROM --> GRAF
    NCCL --> EFA --> N1 & N2 & N3
    KARP --> N1 & N2 & N3
    GPU_OP --> DRIVER & DCGM

    style DRA fill:#326ce5
    style DCGM fill:#76b900
    style NCCL fill:#76b900
    style KARP fill:#ffd93d
```

<GpuInfraStack />

---

## 结论：为什么 Agentic AI 选择 Kubernetes？

Kubernetes 提供了使现代 Agentic AI 平台成为可能的**基础设施底层**：

### 核心优势

1. **统一平台**：推理、训练和编排的单一平台
2. **声明式管理**：基础设施即代码，支持版本控制
3. **丰富的生态系统**：面向 AI 工作负载的大量开源解决方案
4. **云端可移植性**：随处运行（本地、AWS、GCP、Azure）
5. **成熟的工具链**：kubectl、Helm、Operator、监控栈
6. **活跃的社区**：Kubernetes AI/ML SIG 推动创新

### 前进之路

```mermaid
graph LR
    START["Agentic AI<br/>Requirements"] --> K8S["Kubernetes<br/>Foundation"]
    K8S --> OSS["Open Source<br/>Ecosystem"]
    OSS --> CLOUD["Cloud Provider<br/>Integration"]
    CLOUD --> SOLUTION["Complete<br/>AI Platform"]

    style START fill:#ff6b6b
    style K8S fill:#326ce5
    style OSS fill:#2ecc71
    style CLOUD fill:#ff9900
    style SOLUTION fill:#4ecdc4
```

对于构建 Agentic AI 平台的组织：

1. **从 Kubernetes 开始**：在团队中建立 Kubernetes 专业能力
2. **采用开源**：利用经过验证的解决方案（vLLM、LangFuse 等）
3. **与云集成**：将开源与托管服务相结合
4. **自动化基础设施**：实施自动扩展和自动配置
5. **全面可观测**：从第一天起就建立全面的可观测性

:::info 下一步：基于 EKS 的解决方案
有关使用 **Amazon EKS 和 AWS 服务**应对这些挑战的详细解决方案，请参阅 [基于 EKS 的 Agentic AI 解决方案](./agentic-ai-solutions-eks.md)。
:::

---

## 后续步骤

本文探讨了 Agentic AI 工作负载的 4 大核心挑战及基于 Kubernetes 的开源生态系统。

:::info 下一步：基于 EKS 的解决方案
有关使用 **Amazon EKS 和 AWS 服务**解决本文介绍的挑战的具体方法，请参阅 [基于 EKS 的 Agentic AI 解决方案](./agentic-ai-solutions-eks.md)。

下一篇文档涵盖的主题：

- 使用 EKS Auto Mode 构建全自动化集群
- 使用 Karpenter 进行 GPU 节点自动配置
- 与 AWS 服务集成（Bedrock、S3、CloudWatch）
- 生产环境的安全和运维策略
- 实战部署指南与故障排除
:::

---

## 参考资料

### Kubernetes 与基础设施

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Karpenter 官方文档](https://karpenter.sh/docs/)
- [Amazon EKS 最佳实践指南](https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html)
- [NVIDIA GPU Operator 文档](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
- [KEDA - Kubernetes 事件驱动自动扩展](https://keda.sh/)

### 模型服务与推理

- [vLLM 文档](https://docs.vllm.ai/)
- [llm-d 项目](https://github.com/llm-d/llm-d)
- [Kgateway 文档](https://kgateway.io/docs/)
- [LiteLLM 文档](https://docs.litellm.ai/)

### LLM 可观测性

- [LangFuse 文档](https://langfuse.com/docs)
- [LangSmith 文档](https://docs.smith.langchain.com/)
- [RAGAS 文档](https://docs.ragas.io/)

### 向量数据库

- [Milvus 文档](https://milvus.io/docs)
- [Milvus Operator](https://github.com/milvus-io/milvus-operator)

### GPU 基础设施

- [NVIDIA GPU Operator 文档](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/)
- [DCGM Exporter](https://github.com/NVIDIA/dcgm-exporter)
- [NCCL 文档](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/index.html)
- [AWS EFA 文档](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html)

### Agent 框架与训练

- [KAgent - Kubernetes Agent 框架](https://github.com/kagent-dev/kagent)
- [NVIDIA NeMo 框架](https://docs.nvidia.com/nemo-framework/user-guide/latest/overview.html)
- [Kubeflow 文档](https://www.kubeflow.org/docs/)
