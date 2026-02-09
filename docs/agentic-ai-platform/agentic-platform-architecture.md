---
title: "Agentic AI Platform 아키텍처"
sidebar_label: "플랫폼 아키텍처"
description: "Amazon EKS 기반 프로덕션급 GenAI 플랫폼의 전체 시스템 아키텍처, 핵심 컴포넌트 설계, 그리고 구현 전략을 다루는 종합 가이드"
tags: [eks, architecture, agentic-ai, platform, kubernetes, kagent, kgateway, genai, mlops]
category: "genai-aiml"
date: 2025-02-05
authors: [devfloor9]
sidebar_position: 4
---

# Agentic AI Platform 아키텍처

> 📅 **작성일**: 2025-02-05 | ⏱️ **읽는 시간**: 약 15분

이 문서는 Amazon EKS 기반 프로덕션급 Agentic AI Platform의 전체 시스템 아키텍처와 핵심 컴포넌트 설계를 다룹니다. 자율적으로 작업을 수행하는 AI 에이전트를 효율적으로 구축하고 운영하기 위한 플랫폼 아키텍처를 제시합니다.

## 개요

Agentic AI Platform은 자율적인 AI 에이전트가 복잡한 작업을 수행할 수 있도록 지원하는 통합 플랫폼입니다. 최신 AI/ML 기술, 컨테이너 오케스트레이션, 그리고 클라우드 네이티브 아키텍처를 통합하여 안정적이고 확장 가능한 GenAI 서비스를 제공합니다.

### 해결하는 문제

기존 GenAI 서비스 구축 과정에서의 도전 과제:

- **AI 모델 서빙의 복잡성**: 다양한 모델의 배포 및 리소스 관리 어려움
- **통합 부족**: ML 프레임워크와 도구의 통합 부재
- **스케일링 문제**: 성능 최적화 및 자동 확장의 어려움
- **MLOps 자동화**: 배포 파이프라인 및 자동화 부재
- **비용 효율성**: 리소스 활용 최적화 방안 부재

이 가이드는 이러한 문제들을 체계적으로 해결하기 위한 실전 전략을 제시합니다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **에이전트 오케스트레이션** | Kagent를 통한 AI 에이전트 라이프사이클 관리 |
| **지능형 라우팅** | Kgateway를 통한 추론 요청의 동적 라우팅 |
| **벡터 검색** | Milvus를 통한 RAG(Retrieval-Augmented Generation) 지원 |
| **관측성** | LangFuse를 통한 에이전트 동작 추적 및 분석 |
| **확장성** | Kubernetes 네이티브 수평적 확장 |
| **멀티테넌트** | 리소스 격리와 공정한 분배를 통한 다중 팀 지원 |

:::info 대상 독자
이 문서는 솔루션 아키텍트, 플랫폼 엔지니어, DevOps 엔지니어를 대상으로 합니다. Kubernetes와 AI/ML 워크로드에 대한 기본적인 이해가 필요합니다.
:::

## 전체 시스템 아키텍처

Agentic AI Platform은 6개의 주요 레이어로 구성됩니다. 각 레이어는 명확한 책임을 가지며, 느슨한 결합을 통해 독립적인 확장과 운영이 가능합니다.

```mermaid
graph TB
    subgraph ClientLayer["🖥️ Client Layer"]
        CLIENT["API Clients<br/>(REST/gRPC)"]
        UI["Web UI<br/>(Dashboard)"]
        SDK["Agent SDK<br/>(Python/JS)"]
    end

    subgraph GatewayLayer["🚪 Gateway Layer"]
        KGWY["Kgateway<br/>Inference Gateway"]
        AUTH["Authentication<br/>(OIDC/JWT)"]
        RATE["Rate Limiter<br/>(Token Bucket)"]
    end

    subgraph AgentLayer["🤖 Agent Layer"]
        KAGENT["Kagent Controller<br/>(Operator)"]
        AGENT1["Agent Instance 1<br/>(Customer Support)"]
        AGENT2["Agent Instance 2<br/>(Data Analysis)"]
        AGENTN["Agent Instance N<br/>(Custom Agent)"]
        TOOLS["Tool Registry<br/>(CRD-based)"]
    end

    subgraph ModelLayer["🧠 Model Serving Layer"]
        VLLM1["vLLM<br/>Model A (GPT-4)"]
        VLLM2["vLLM<br/>Model B (Claude)"]
        TGI["TGI<br/>MoE Model (Mixtral)"]
    end

    subgraph DataLayer["💾 Data Layer"]
        MILVUS["Milvus<br/>Vector DB"]
        REDIS["Redis<br/>Session Cache"]
        S3["S3<br/>Document Store"]
    end

    subgraph ObservabilityLayer["📊 Observability Layer"]
        LANGFUSE["LangFuse<br/>Agent Tracing"]
        PROM["Prometheus<br/>Metrics"]
        GRAFANA["Grafana<br/>Dashboards"]
        OTEL["OpenTelemetry<br/>Collector"]
    end

    CLIENT --> KGWY
    UI --> KGWY
    SDK --> KGWY
    KGWY --> AUTH
    AUTH --> RATE
    RATE --> KAGENT
    KAGENT --> AGENT1
    KAGENT --> AGENT2
    KAGENT --> AGENTN
    KAGENT --> TOOLS
    AGENT1 --> VLLM1
    AGENT2 --> VLLM2
    AGENTN --> TGI
    AGENT1 --> MILVUS
    AGENT2 --> MILVUS
    AGENTN --> MILVUS
    AGENT1 --> REDIS
    AGENT2 --> REDIS
    MILVUS --> S3
    VLLM1 --> LANGFUSE
    VLLM2 --> LANGFUSE
    TGI --> LANGFUSE
    LANGFUSE --> OTEL
    OTEL --> PROM
    PROM --> GRAFANA

    style ClientLayer fill:#e3f2fd
    style GatewayLayer fill:#fff3e0
    style AgentLayer fill:#e8f5e9
    style ModelLayer fill:#fce4ec
    style DataLayer fill:#f3e5f5
    style ObservabilityLayer fill:#e0f7fa
```

### 레이어별 역할

| 레이어 | 역할 | 주요 컴포넌트 |
| ------ | ---- | ------------- |
| **Client Layer** | 사용자 및 애플리케이션 인터페이스 | API Clients, Web UI, SDK |
| **Gateway Layer** | 인증, 라우팅, 트래픽 관리 | Kgateway, Auth, Rate Limiter |
| **Agent Layer** | AI 에이전트 실행 및 오케스트레이션 | Kagent, Agent Instances, Tool Registry |
| **Model Serving Layer** | LLM 모델 추론 서비스 | vLLM, TGI |
| **Data Layer** | 데이터 저장 및 검색 | Milvus, Redis, S3 |
| **Observability Layer** | 모니터링 및 추적 | LangFuse, Prometheus, Grafana |

## 핵심 컴포넌트

### Agent Runtime Layer

Agent Runtime Layer는 AI 에이전트가 실행되는 환경을 제공합니다. 각 에이전트는 독립적인 Pod로 실행되며, Kagent Controller에 의해 관리됩니다.

```mermaid
graph LR
    subgraph AgentPod["Agent Pod"]
        RUNTIME["Agent Runtime<br/>(Python/LangChain)"]
        MEMORY["Memory Manager<br/>(Short/Long-term)"]
        EXECUTOR["Tool Executor<br/>(Async)"]
    end

    subgraph External["External Services"]
        LLM["LLM Service"]
        VECTOR["Vector Store"]
        TOOLS["External Tools"]
    end

    RUNTIME --> MEMORY
    RUNTIME --> EXECUTOR
    EXECUTOR --> LLM
    EXECUTOR --> VECTOR
    EXECUTOR --> TOOLS

    style AgentPod fill:#e8f5e9
    style External fill:#fff3e0
```

#### 주요 기능

- **상태 관리**: 에이전트의 대화 컨텍스트 및 작업 상태 유지
- **도구 실행**: 등록된 도구를 비동기적으로 실행
- **메모리 관리**: 단기/장기 메모리를 통한 컨텍스트 유지
- **오류 복구**: 실패한 작업의 자동 재시도 및 폴백

### Tool Registry

Tool Registry는 에이전트가 사용할 수 있는 도구들을 중앙에서 관리합니다. Kubernetes CRD(Custom Resource Definition)를 통해 도구를 선언적으로 정의합니다.

```yaml
apiVersion: kagent.dev/v1alpha1
kind: Tool
metadata:
  name: web-search
  namespace: ai-agents
spec:
  type: api
  description: "웹 검색을 수행하여 최신 정보를 가져옵니다"
  config:
    endpoint: http://search-service/api/search
    method: POST
    timeout: 30s
  parameters:
    - name: query
      type: string
      required: true
      description: "검색 쿼리"
    - name: max_results
      type: integer
      default: 10
      description: "최대 결과 수"
  authentication:
    type: bearer
    secretRef:
      name: search-api-token
      key: token
```

#### 도구 유형

| 유형 | 설명 | 예시 |
| ---- | ---- | ---- |
| **API** | 외부 REST/gRPC API 호출 | 웹 검색, 티켓 생성 |
| **Retrieval** | 벡터 저장소 검색 | 문서 검색, FAQ 조회 |
| **Code** | 코드 실행 (샌드박스) | Python 스크립트, SQL 쿼리 |
| **Human** | 사람의 승인/입력 대기 | 결제 승인, 민감 작업 확인 |

### Memory Store (Milvus)

Milvus는 RAG 시스템의 핵심인 벡터 저장소 역할을 합니다. 에이전트는 Milvus를 통해 관련 문서를 검색하고 컨텍스트를 보강합니다.

```mermaid
graph TB
    subgraph MilvusCluster["Milvus Cluster"]
        PROXY["Proxy<br/>(Load Balancer)"]
        QUERY["Query Node<br/>(Search)"]
        INDEX["Index Node<br/>(Indexing)"]
        DATA["Data Node<br/>(Storage)"]
    end

    subgraph Storage["Storage Backend"]
        ETCD["etcd<br/>(Metadata)"]
        MINIO["MinIO/S3<br/>(Vectors)"]
        PULSAR["Pulsar<br/>(Log)"]
    end

    PROXY --> QUERY
    PROXY --> INDEX
    PROXY --> DATA
    QUERY --> ETCD
    INDEX --> MINIO
    DATA --> PULSAR

    style MilvusCluster fill:#f3e5f5
    style Storage fill:#e0f7fa
```

#### 컬렉션 설계 예시

```python
from pymilvus import Collection, FieldSchema, CollectionSchema, DataType

# 컬렉션 스키마 정의
fields = [
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="metadata", dtype=DataType.JSON),
    FieldSchema(name="tenant_id", dtype=DataType.VARCHAR, max_length=64),
]

schema = CollectionSchema(fields, description="Knowledge base for agents")
collection = Collection(name="agent_knowledge", schema=schema)

# HNSW 인덱스 생성 (고성능 검색)
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {"M": 16, "efConstruction": 256}
}
collection.create_index(field_name="embedding", index_params=index_params)
```

### Orchestrator (Kagent)

Kagent는 Kubernetes Operator 패턴을 사용하여 AI 에이전트의 전체 라이프사이클을 관리합니다.

```mermaid
graph TB
    subgraph KagentController["Kagent Controller"]
        RECONCILER["Reconciler<br/>(Control Loop)"]
        WEBHOOK["Admission Webhook<br/>(Validation)"]
        METRICS["Metrics Exporter"]
    end

    subgraph CRDs["Custom Resources"]
        AGENT_CRD["Agent CRD"]
        TOOL_CRD["Tool CRD"]
        WORKFLOW_CRD["Workflow CRD"]
    end

    subgraph ManagedResources["Managed Resources"]
        DEPLOY["Deployments"]
        SVC["Services"]
        HPA["HPA"]
        CM["ConfigMaps"]
    end

    RECONCILER --> AGENT_CRD
    RECONCILER --> TOOL_CRD
    RECONCILER --> WORKFLOW_CRD
    WEBHOOK --> AGENT_CRD
    AGENT_CRD --> DEPLOY
    AGENT_CRD --> SVC
    AGENT_CRD --> HPA
    AGENT_CRD --> CM

    style KagentController fill:#e8f5e9
    style CRDs fill:#fff3e0
    style ManagedResources fill:#e3f2fd
```

#### Agent CRD 예시

```yaml
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: customer-support-agent
  namespace: ai-agents
spec:
  # 모델 설정
  model:
    provider: openai
    name: gpt-4-turbo
    temperature: 0.7
    maxTokens: 4096

  # 시스템 프롬프트
  systemPrompt: |
    당신은 친절하고 전문적인 고객 지원 에이전트입니다.
    항상 정확한 정보를 제공하고, 모르는 것은 솔직히 인정하세요.

  # 사용할 도구
  tools:
    - name: search-knowledge-base
      type: retrieval
      config:
        vectorStore: milvus
        collection: support-docs
        topK: 5
    - name: create-ticket
      type: api
      config:
        endpoint: http://ticketing-service/api/tickets
        method: POST

  # 메모리 설정
  memory:
    type: redis
    config:
      host: redis-master.ai-data.svc.cluster.local
      port: 6379
      ttl: 3600
      maxHistory: 50

  # 스케일링 설정
  scaling:
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilization: 70
    targetMemoryUtilization: 80

  # 리소스 제한
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"
```

### Inference Gateway (Kgateway)

Kgateway는 Kubernetes Gateway API를 기반으로 AI 모델 추론 요청을 지능적으로 라우팅합니다.

```mermaid
graph LR
    subgraph Clients["Clients"]
        C1["Agent 1"]
        C2["Agent 2"]
        C3["Agent N"]
    end

    subgraph Kgateway["Kgateway"]
        LB["Load Balancer"]
        ROUTER["Smart Router"]
        CACHE["Response Cache"]
    end

    subgraph Models["Model Backends"]
        M1["vLLM - GPT-4"]
        M2["vLLM - Claude"]
        M3["TGI - Mixtral"]
    end

    C1 --> LB
    C2 --> LB
    C3 --> LB
    LB --> ROUTER
    ROUTER --> CACHE
    ROUTER --> M1
    ROUTER --> M2
    ROUTER --> M3

    style Clients fill:#e3f2fd
    style Kgateway fill:#fff3e0
    style Models fill:#fce4ec
```

#### HTTPRoute 설정 예시

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: inference-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-gateway
      namespace: ai-gateway
  rules:
    # GPT-4 모델 라우팅 (가중치 기반)
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        - name: vllm-gpt4-primary
          port: 8000
          weight: 80
        - name: vllm-gpt4-canary
          port: 8000
          weight: 20

    # Claude 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "claude-3"
      backendRefs:
        - name: vllm-claude3
          port: 8000

    # MoE 모델 라우팅 (복잡한 작업용)
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "mixtral-8x7b"
      backendRefs:
        - name: tgi-mixtral
          port: 8080
```

#### 라우팅 전략

| 전략 | 설명 | 사용 사례 |
| ---- | ---- | --------- |
| **가중치 기반** | 트래픽을 비율로 분배 | A/B 테스트, 카나리 배포 |
| **헤더 기반** | 요청 헤더로 라우팅 결정 | 모델 선택, 테넌트 분리 |
| **지연 시간 기반** | 가장 빠른 백엔드로 라우팅 | 성능 최적화 |
| **폴백** | 실패 시 대체 백엔드로 전환 | 고가용성 |

## Kubernetes 배포 아키텍처

### 네임스페이스 구성 전략

Agentic AI Platform은 관심사 분리와 보안을 위해 기능별로 네임스페이스를 분리합니다.

```mermaid
graph TB
    subgraph Cluster["EKS Cluster"]
        subgraph NSGateway["ai-gateway"]
            GW["Kgateway"]
            AUTH["Auth Service"]
        end

        subgraph NSAgents["ai-agents"]
            KAGENT["Kagent Controller"]
            AGENTS["Agent Pods"]
            TOOLS["Tool Registry"]
        end

        subgraph NSInference["ai-inference"]
            VLLM["vLLM Deployments"]
            TGI["TGI Deployments"]
            GPU["GPU Nodes"]
        end

        subgraph NSData["ai-data"]
            MILVUS["Milvus Cluster"]
            REDIS["Redis Cluster"]
        end

        subgraph NSObservability["observability"]
            LANGFUSE["LangFuse"]
            PROM["Prometheus"]
            GRAFANA["Grafana"]
        end
    end

    NSGateway --> NSAgents
    NSAgents --> NSInference
    NSAgents --> NSData
    NSInference --> NSObservability
    NSAgents --> NSObservability

    style NSGateway fill:#fff3e0
    style NSAgents fill:#e8f5e9
    style NSInference fill:#fce4ec
    style NSData fill:#f3e5f5
    style NSObservability fill:#e0f7fa
```

#### 네임스페이스 설정

```yaml
# ai-gateway 네임스페이스
apiVersion: v1
kind: Namespace
metadata:
  name: ai-gateway
  labels:
    istio-injection: enabled
    pod-security.kubernetes.io/enforce: restricted
---
# ai-agents 네임스페이스
apiVersion: v1
kind: Namespace
metadata:
  name: ai-agents
  labels:
    istio-injection: enabled
    pod-security.kubernetes.io/enforce: baseline
---
# ai-inference 네임스페이스 (GPU 워크로드)
apiVersion: v1
kind: Namespace
metadata:
  name: ai-inference
  labels:
    pod-security.kubernetes.io/enforce: privileged
  annotations:
    scheduler.alpha.kubernetes.io/defaultTolerations: '[{"key":"nvidia.com/gpu","operator":"Exists"}]'
---
# ai-data 네임스페이스
apiVersion: v1
kind: Namespace
metadata:
  name: ai-data
  labels:
    pod-security.kubernetes.io/enforce: baseline
---
# observability 네임스페이스
apiVersion: v1
kind: Namespace
metadata:
  name: observability
  labels:
    pod-security.kubernetes.io/enforce: baseline
```

### 리소스 할당 전략

각 네임스페이스에 ResourceQuota를 설정하여 리소스 사용을 제한하고 공정한 분배를 보장합니다.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-inference-quota
  namespace: ai-inference
spec:
  hard:
    requests.cpu: "100"
    requests.memory: "500Gi"
    limits.cpu: "200"
    limits.memory: "1Ti"
    requests.nvidia.com/gpu: "32"
    persistentvolumeclaims: "50"
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-agents-quota
  namespace: ai-agents
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    limits.cpu: "100"
    limits.memory: "200Gi"
    pods: "200"
```

:::warning 리소스 계획
GPU 리소스는 비용이 높으므로 신중하게 계획해야 합니다. 초기에는 보수적으로 설정하고, 모니터링을 통해 점진적으로 조정하세요.
:::

## 확장성 설계

### 수평적 확장 전략

Agentic AI Platform의 각 컴포넌트는 독립적으로 수평 확장이 가능합니다.

```mermaid
graph TB
    subgraph Scaling["확장 전략"]
        subgraph AgentScaling["Agent 확장"]
            HPA_AGENT["HPA<br/>(CPU/Memory)"]
            KEDA_AGENT["KEDA<br/>(Queue Length)"]
        end

        subgraph InferenceScaling["Inference 확장"]
            HPA_VLLM["HPA<br/>(GPU Utilization)"]
            KARPENTER["Karpenter<br/>(Node Provisioning)"]
        end

        subgraph DataScaling["Data 확장"]
            MILVUS_SCALE["Milvus<br/>(Query/Index Nodes)"]
            REDIS_SCALE["Redis<br/>(Cluster Mode)"]
        end
    end

    style AgentScaling fill:#e8f5e9
    style InferenceScaling fill:#fce4ec
    style DataScaling fill:#f3e5f5
```

#### Agent 자동 스케일링 (KEDA)

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: agent-scaler
  namespace: ai-agents
spec:
  scaleTargetRef:
    name: customer-support-agent
  minReplicaCount: 2
  maxReplicaCount: 20
  pollingInterval: 15
  cooldownPeriod: 300
  triggers:
    # Redis 큐 길이 기반 스케일링
    - type: redis
      metadata:
        address: redis-master.ai-data.svc:6379
        listName: agent-task-queue
        listLength: "10"
    # Prometheus 메트릭 기반 스케일링
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.observability.svc:9090
        metricName: agent_active_sessions
        threshold: "50"
        query: |
          sum(agent_active_sessions{agent="customer-support"})
```

#### GPU 노드 자동 프로비저닝 (Karpenter)

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference-pool
spec:
  template:
    spec:
      requirements:
        - key: "node.kubernetes.io/instance-type"
          operator: In
          values:
            - "p4d.24xlarge"   # 8x A100 40GB
            - "p5.48xlarge"   # 8x H100 80GB
            - "g5.48xlarge"   # 8x A10G 24GB
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["on-demand", "spot"]
        - key: "kubernetes.io/arch"
          operator: In
          values: ["amd64"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
  limits:
    nvidia.com/gpu: 64
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
    budgets:
      - nodes: "20%"
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-nodeclass
spec:
  amiFamily: AL2
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "ai-cluster"
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "ai-cluster"
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 500Gi
        volumeType: gp3
        iops: 10000
        throughput: 500
  tags:
    Environment: production
    Workload: ai-inference
```

### 멀티 테넌트 지원

Agentic AI Platform은 여러 팀이나 프로젝트가 동일한 플랫폼을 공유할 수 있도록 멀티 테넌트를 지원합니다.

```mermaid
graph TB
    subgraph MultiTenant["멀티 테넌트 아키텍처"]
        subgraph Shared["공유 컴포넌트"]
            GW["Kgateway"]
            KAGENT["Kagent Controller"]
            MILVUS["Milvus (Partitioned)"]
        end

        subgraph TenantA["Tenant A"]
            NS_A["Namespace: tenant-a"]
            AGENT_A["Agents"]
            QUOTA_A["ResourceQuota"]
        end

        subgraph TenantB["Tenant B"]
            NS_B["Namespace: tenant-b"]
            AGENT_B["Agents"]
            QUOTA_B["ResourceQuota"]
        end
    end

    GW --> NS_A
    GW --> NS_B
    KAGENT --> AGENT_A
    KAGENT --> AGENT_B
    AGENT_A --> MILVUS
    AGENT_B --> MILVUS

    style Shared fill:#e3f2fd
    style TenantA fill:#e8f5e9
    style TenantB fill:#fff3e0
```

#### 테넌트 격리 전략

| 격리 수준 | 방법 | 장점 | 단점 |
| --------- | ---- | ---- | ---- |
| **네임스페이스** | 테넌트별 네임스페이스 | 간단한 구현, 리소스 격리 | 네트워크 정책 필요 |
| **노드** | 테넌트별 노드 풀 | 완전한 격리 | 비용 증가 |
| **클러스터** | 테넌트별 클러스터 | 최고 수준 격리 | 관리 복잡성 |

#### 테넌트별 리소스 할당

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    requests.nvidia.com/gpu: "4"
    pods: "50"
    services: "10"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: tenant-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: tenant-a
        - namespaceSelector:
            matchLabels:
              name: ai-gateway
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: tenant-a
        - namespaceSelector:
            matchLabels:
              name: ai-inference
        - namespaceSelector:
            matchLabels:
              name: ai-data
```

## 보안 아키텍처

### 인증/인가

Agentic AI Platform은 다층 보안 모델을 적용합니다.

```mermaid
graph TB
    subgraph Security["보안 레이어"]
        subgraph External["외부 접근"]
            OIDC["OIDC Provider<br/>(Cognito/Okta)"]
            JWT["JWT Validation"]
        end

        subgraph Internal["내부 통신"]
            MTLS["mTLS<br/>(Istio)"]
            RBAC["Kubernetes RBAC"]
        end

        subgraph Data["데이터 보안"]
            ENCRYPT["암호화<br/>(At-rest/In-transit)"]
            SECRETS["Secrets Manager"]
        end
    end

    OIDC --> JWT
    JWT --> MTLS
    MTLS --> RBAC
    RBAC --> ENCRYPT
    ENCRYPT --> SECRETS

    style External fill:#ffcdd2
    style Internal fill:#fff9c4
    style Data fill:#c8e6c9
```

#### RBAC 설정 예시

```yaml
# Agent 운영자 역할
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agent-operator
  namespace: ai-agents
rules:
  - apiGroups: ["kagent.dev"]
    resources: ["agents", "tools", "workflows"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
    resourceNames: ["agent-*"]
---
# Agent 뷰어 역할
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agent-viewer
  namespace: ai-agents
rules:
  - apiGroups: ["kagent.dev"]
    resources: ["agents", "tools", "workflows"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
```

### 네트워크 정책

```yaml
# ai-inference 네임스페이스 네트워크 정책
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: inference-network-policy
  namespace: ai-inference
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # ai-agents에서만 접근 허용
    - from:
        - namespaceSelector:
            matchLabels:
              name: ai-agents
        - namespaceSelector:
            matchLabels:
              name: ai-gateway
      ports:
        - protocol: TCP
          port: 8000
        - protocol: TCP
          port: 8080
  egress:
    # 외부 모델 API 접근 (필요시)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
    # observability로 메트릭 전송
    - to:
        - namespaceSelector:
            matchLabels:
              name: observability
      ports:
        - protocol: TCP
          port: 9090
```

:::danger 보안 주의사항

- 프로덕션 환경에서는 반드시 mTLS를 활성화하세요
- API 키와 토큰은 Kubernetes Secrets 또는 AWS Secrets Manager에 저장하세요
- 정기적으로 보안 감사를 수행하고 취약점을 패치하세요

:::

## 데이터 플로우

다음 다이어그램은 사용자 요청이 플랫폼을 통해 처리되는 전체 흐름을 보여줍니다.

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant Gateway as Kgateway
    participant Auth as Auth Service
    participant Kagent as Kagent
    participant Agent as Agent Pod
    participant Milvus as Milvus
    participant LLM as vLLM
    participant LangFuse as LangFuse

    Client->>Gateway: 1. API 요청 (JWT 토큰)
    Gateway->>Auth: 2. 토큰 검증
    Auth-->>Gateway: 3. 검증 결과
    Gateway->>Kagent: 4. 에이전트 라우팅
    Kagent->>Agent: 5. 작업 할당

    Note over Agent: 6. 컨텍스트 검색
    Agent->>Milvus: 7. 벡터 검색 쿼리
    Milvus-->>Agent: 8. 관련 문서 반환

    Note over Agent: 9. LLM 추론
    Agent->>LLM: 10. 프롬프트 + 컨텍스트
    LLM-->>Agent: 11. 생성된 응답

    Agent->>LangFuse: 12. 트레이스 기록
    Agent-->>Kagent: 13. 작업 완료
    Kagent-->>Gateway: 14. 응답 전달
    Gateway-->>Client: 15. 최종 응답
```

### 요청 처리 단계

| 단계 | 컴포넌트 | 설명 |
| ---- | -------- | ---- |
| 1-3 | Gateway, Auth | 인증 및 권한 검증 |
| 4-5 | Kagent, Agent | 에이전트 선택 및 작업 할당 |
| 6-8 | Agent, Milvus | RAG를 위한 컨텍스트 검색 |
| 9-11 | Agent, LLM | LLM 추론 수행 |
| 12 | LangFuse | 관측성 데이터 기록 |
| 13-15 | 전체 | 응답 반환 |

## 모니터링 및 관측성

### 핵심 메트릭

```yaml
# Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: agent-metrics
  namespace: observability
spec:
  selector:
    matchLabels:
      app: kagent
  namespaceSelector:
    matchNames:
      - ai-agents
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
---
# PrometheusRule for Alerts
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: agent-alerts
  namespace: observability
spec:
  groups:
    - name: agent-alerts
      rules:
        - alert: AgentHighLatency
          expr: |
            histogram_quantile(0.99,
              rate(agent_request_duration_seconds_bucket[5m])
            ) > 10
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Agent 응답 지연 발생"
            description: "P99 지연 시간이 10초를 초과했습니다"

        - alert: AgentHighErrorRate
          expr: |
            rate(agent_request_errors_total[5m]) /
            rate(agent_request_total[5m]) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Agent 오류율 증가"
            description: "오류율이 5%를 초과했습니다"
```

### Grafana 대시보드 구성

주요 모니터링 대시보드:

- **Agent Overview**: 에이전트별 요청 수, 지연 시간, 오류율
- **LLM Performance**: 모델별 토큰 처리량, 추론 시간
- **Resource Usage**: CPU, 메모리, GPU 사용률
- **Cost Tracking**: 테넌트별, 모델별 비용 추적

## 기술 스택

### 핵심 인프라

| 분야 | 기술 |
|------|------|
| Container Orchestration | Amazon EKS (Auto Mode, Pod Identity) |
| Networking | Cilium CNI, Gateway API, VPC Lattice |
| Security | OPA/Kyverno, RBAC, Pod Security Standards |
| GitOps | ArgoCD, Helm, Kustomize |

### GenAI 기술

| 분야 | 기술 |
|------|------|
| Model Serving | vLLM, Text Generation Inference (TGI) |
| Low-Code Platform | Dify (Visual AI Workflow Builder) |
| Agent Frameworks | LangChain, LangGraph, CrewAI |
| Vector Databases | Milvus, RAG 통합 패턴 |

### 플랫폼 운영

| 분야 | 기술 |
|------|------|
| Observability | OpenTelemetry, Prometheus, Grafana, Hubble |
| Cost Management | Kubecost, Karpenter optimization |
| Automation | AWS Controllers for Kubernetes (ACK) |

## 결론

Agentic AI Platform 아키텍처는 다음과 같은 핵심 원칙을 따릅니다:

1. **모듈화**: 각 컴포넌트는 독립적으로 배포, 확장, 업데이트 가능
2. **확장성**: Kubernetes 네이티브 스케일링으로 트래픽 변화에 유연하게 대응
3. **관측성**: 전체 요청 흐름을 추적하고 분석할 수 있는 통합 모니터링
4. **보안**: 다층 보안 모델로 데이터와 서비스 보호
5. **멀티 테넌트**: 리소스 격리와 공정한 분배를 통한 다중 팀 지원

:::tip 다음 단계

- [GPU 리소스 관리](./gpu-resource-management.md) - 동적 리소스 할당 상세 가이드
- [Kagent Agent 관리](./kagent-kubernetes-agents.md) - 에이전트 배포 및 운영
- [Agent 모니터링](./agent-monitoring.md) - LangFuse 통합 가이드

:::

## 참고 자료

- [Kagent GitHub Repository](https://github.com/kagent-dev/kagent)
- [Kgateway Documentation](https://kgateway.dev/)
- [Milvus Documentation](https://milvus.io/docs/overview.md)
- [LangFuse Documentation](https://langfuse.com/docs)
- [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/)
- [Karpenter Documentation](https://karpenter.sh/docs/)
