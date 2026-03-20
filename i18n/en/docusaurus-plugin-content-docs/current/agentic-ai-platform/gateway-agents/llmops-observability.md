---
title: "LLMOps Observability Comparison Guide"
sidebar_label: "LLMOps Observability"
description: "Langfuse, LangSmith, Helicone comparison and hybrid Observability architecture guide"
tags: [eks, observability, langfuse, langsmith, helicone, llmops, monitoring]
category: "genai-aiml"
last_update:
  date: 2026-03-16
  author: devfloor9
sidebar_position: 7
---

# LLMOps Observability Comparison Guide

## 1. Overview

### 1.1 Why Traditional APM Falls Short for LLM Workloads

Traditional Application Performance Monitoring (APM) tools cannot meet the unique requirements of LLM-based applications:

- **No Token Cost Tracking**: Existing APM only measures CPU/memory usage and cannot track input/output token counts and provider-specific pricing, which are the actual costs of LLM API calls
- **No Prompt Quality Evaluation**: While HTTP request/response bodies are logged, there is no prompt template version management, A/B testing, or quality evaluation metrics
- **Limited Chain Tracking**: Complex chains and agent workflows in frameworks like LangChain/LlamaIndex are difficult to visualize with simple HTTP traces
- **Lack of Semantic Context**: Only latency/throughput are measured, without evaluating semantic quality like "Is the answer accurate?" or "Did hallucination occur?"

### 1.2 Four Core Areas of LLMOps Observability

LLMOps Observability comprehensively addresses the following four areas:

1. **Tracing**: Track the entire request lifecycle (prompt → LLM → response), with step-by-step visibility into nested chains/agents
2. **Evaluation**: Measure response quality through automated/manual evaluation (accuracy, faithfulness, relevance, toxicity, etc.)
3. **Prompt Management**: Prompt template version management, A/B testing, production deployment pipeline
4. **Cost Tracking**: Real-time aggregation of token costs by provider/model, budget management by team/project

### 1.3 Key Goals

This document provides:

- **In-depth comparison** of the 3 major LLMOps Observability solutions (Langfuse, LangSmith, Helicone)
- **Hybrid architecture** design: Strategy for separating Gateway (Bifrost/kgateway) and Observability (Langfuse)
- **EKS self-hosted deployment**: Langfuse integration with Aurora PostgreSQL + ClickHouse
- **OpenTelemetry integration**: Unified dashboard combining existing APM with LLMOps Observability
- **Evaluation pipeline**: Automated RAG quality evaluation with Ragas

---

## 2. LLMOps Observability Core Concepts

### 2.1 Key Concept Definitions

#### Trace
The top-level unit representing the entire lifecycle of a request. It tracks the complete process from a single user question through multiple LLM calls, database searches, and tool executions to the final response.

#### Span
Individual steps that compose a Trace. Each Span can include:
- **LLM Call**: API request to a specific model
- **Tool Call**: Function calls, API requests, database queries
- **Retrieval Step**: Vector DB search, Reranking
- **Post-processing**: Parsing, formatting, validation

#### Generation
A specialized Span containing details of LLM API calls:
- Input token count / Output token count
- Model name and parameters (temperature, top_p, etc.)
- Latency (Time to First Token, Total Time)
- Calculated cost (based on provider price list)

#### Score
Metrics evaluating response quality:
- **Automated Evaluation**: LLM-as-Judge, rule-based scores
- **Manual Evaluation**: Human feedback (thumbs up/down, detailed review)
- **Metric Examples**: Faithfulness (0-1), Relevancy (0-1), Toxicity (0-1)

#### Session
A context that groups multiple Traces in conversational applications. It groups multi-turn conversations in chatbots and multiple attempts by agents into a single user session.

### 2.2 Trace Structure Visualization

```mermaid
flowchart TB
    subgraph Trace["Trace: User Question"]
        direction TB
        A[Query<br/>Processing]
        B[Vector<br/>Search]
        C[LLM Call 1<br/>gpt-4o-mini<br/>1200→80 tok<br/>$0.0024]
        D[Reranking]
        E[LLM Call 2<br/>gpt-4o<br/>3500→450 tok<br/>$0.0285]
        F[Response<br/>Format]
        G[Faithfulness<br/>0.92]
        H[Relevancy<br/>0.88]

        A --> B
        A --> C
        B --> D
        D --> E
        E --> F
        F --> G
        F --> H
    end

    style C fill:#ffd93d,stroke:#333
    style E fill:#ffd93d,stroke:#333
    style G fill:#76b900,stroke:#333
    style H fill:#76b900,stroke:#333
```

---

## 3. Solution Comparison

### 3.1 Langfuse

#### Overview
Langfuse is an open-source LLMOps Observability platform that fully supports self-hosting and is provided under the MIT license.

#### Core Features

**Tracing**
- Native integration with LangChain, LlamaIndex, OpenAI SDK
- Support for all frameworks with custom SDK
- Complete visibility into nested chains and agent workflows

**Prompt Management**
- Prompt template version management
- Production/staging environment separation
- Dynamic prompt loading via API
- A/B testing support (compare prompt variations)

**Evaluation**
- Automated evaluation pipeline (LLM-as-Judge, rule-based)
- Annotation Queue: Manual evaluation workflow
- Dataset management: Build golden sets for regression testing
- Custom evaluator plugins

**Dataset Management**
- Extract dataset items from Traces
- Version management and tagging
- CI/CD pipeline integration (automated regression testing)

#### Architecture

```mermaid
flowchart LR
    A[Langfuse SDK]
    B[Langfuse<br/>Server]
    C[(PostgreSQL<br/>Metadata)]
    D[(ClickHouse<br/>Analytics)]
    E[(Redis<br/>Cache)]
    F[UI]
    G[Eval<br/>Worker]

    A -->|Async<br/>Trace| B
    B --> C
    B --> D
    B --> E
    F --> B
    G --> B

    style C fill:#326ce5,stroke:#333
    style D fill:#76b900,stroke:#333
    style E fill:#e53935,stroke:#333
    style B fill:#ff9900,stroke:#333
```

- **PostgreSQL**: Trace metadata, prompt versions, user information
- **ClickHouse**: Large-scale analytical queries (cost aggregation, trend analysis)
- **Redis**: API response caching, rate limiting

#### Advantages
- **Complete Data Ownership**: Store all data on your own infrastructure
- **Powerful Evaluation Pipeline**: Dataset + automated evaluators + Annotation Queue
- **Prompt Version Management**: Production deployment and rollback support
- **Unlimited Scaling**: Horizontal scaling with ClickHouse cluster
- **Cost Efficiency**: Unlimited traces when self-hosted

#### Disadvantages
- **Operational Overhead**: Requires managing PostgreSQL + ClickHouse + Redis
- **Manual Scaling Management**: Manual scaling required with traffic growth
- **Initial Setup Complexity**: Helm chart + database integration required

#### Suitable Use Cases
- Enterprises where data sovereignty is critical
- Processing millions+ traces
- Operating prompt engineering teams
- CI/CD integrated regression testing

---

### 3.2 LangSmith

#### Overview
A cloud-based Observability platform provided by LangChain AI, deeply integrated with the LangChain/LangGraph ecosystem.

#### Core Features

**Tracing**
- Zero-code integration with LangChain/LangGraph
- Automatic tracking of LangServe deployments
- Support for direct SDK calls (OpenAI, Anthropic, etc.)

**Hub (Prompt Marketplace)**
- Community-shared prompt templates
- Version management and Fork/Share
- Runtime loading with LangChain Hub API

**Evaluation**
- LangSmith Evaluator: Pre-defined evaluator library
- Custom evaluator creation (Python functions)
- Comparison mode: Simultaneous evaluation of multiple prompt/model variations

**Annotation Queue**
- Workflow for collecting human feedback
- Team collaboration features (comments, tags)
- Data source for RLHF pipeline

#### Advantages
- **LangChain Deep Integration**: Automatic tracking of entire chain with one line of code
- **Powerful Evaluation Tools**: Pre-defined evaluator library
- **Managed Service**: No infrastructure management required
- **Quick Start**: Integration possible within 5 minutes

#### Disadvantages
- **LangChain Dependency**: Complex integration when using other frameworks
- **Cloud-Only**: Limited self-host options (enterprise only)
- **Cost**: Per-trace billing (expensive at large scale)
- **Data Sovereignty**: Sensitive data stored in LangChain cloud

#### Suitable Use Cases
- LangChain/LangGraph-centric development
- Rapid prototyping and experimentation
- Small to medium-scale production (under 1M traces/month)

---

### 3.3 Helicone

#### Overview
A high-performance LLM Gateway + Observability integrated solution written in Rust. Operates on a proxy basis, enabling tracking without application code changes.

#### Core Features

**Zero-Code Integration**
- Automatic tracking by simply changing OpenAI endpoint to `oai.helicone.ai`
- No SDK installation required
- Support for all LLM providers (OpenAI, Anthropic, Cohere, etc.)

**Gateway + Observability One-Stop**
- Rate limiting, Caching, Retries
- Load balancing (multiple API keys)
- Real-time cost dashboard

**Prompt Management (Limited)**
- Prompt Registry: Save and retrieve prompts
- No version management (simple repository only)

#### Architecture

```mermaid
flowchart LR
    A[App Code]
    B[Helicone<br/>Proxy]
    C[OpenAI<br/>API]
    D[(Helicone<br/>DB)]
    E[UI]

    A -->|1. API Call| B
    B -->|2. Forward| C
    C -->|3. Response| B
    B -->|4. Response| A
    B -.->|5. Log| D
    E --> D

    style B fill:#e53935,stroke:#333
    style C fill:#ffd93d,stroke:#333
```

#### Advantages
- **Ultra-Fast Integration**: Start tracking immediately by just changing URL
- **High Performance**: Rust-based, latency < 10ms
- **Built-in Gateway Features**: No separate gateway needed
- **Managed + Self-Host**: Both options available

#### Disadvantages
- **Lack of Prompt Management**: No version management or A/B testing support
- **No Evaluation Pipeline**: Missing automated evaluators and dataset management
- **Limited Analytics**: Weak support for advanced analytical queries
- **Limited LangChain Chain Tracking**: Inaccurate nested Span tracking

#### Suitable Use Cases
- MVPs requiring quick start
- Simple LLM API calls (no complex chains)
- Cases requiring both Gateway and Observability

---

### 3.4 Solution Comparison Table

| Feature | Langfuse | LangSmith | Helicone |
|---------|----------|-----------|----------|
| **License** | MIT (Open Source) | Proprietary | Proprietary (Self-host Available) |
| **Self-Host** | Full Support | Enterprise Only | Supported |
| **Tracing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Prompt Management** | ⭐⭐⭐⭐⭐ (Version, A/B) | ⭐⭐⭐⭐ (Hub) | ⭐⭐ (Simple Storage) |
| **Evaluation** | ⭐⭐⭐⭐⭐ (Pipeline) | ⭐⭐⭐⭐⭐ | ⭐ (None) |
| **Dataset Management** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ (None) |
| **Cost Tracking** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **LangChain Integration** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Framework Neutrality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Gateway Features** | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **Integration Difficulty** | Medium (SDK Required) | Easy (with LangChain) | Very Easy (Proxy) |
| **Scale Limit** | Unlimited (Self-host) | Plan Limited | Plan Limited |
| **Price (Self-Host)** | Free (Infrastructure Only) | Enterprise Negotiation | Free (Infrastructure Only) |
| **Price (Cloud)** | Developer: Free<br/>Pro: $59/mo<br/>Team: $299/mo | Developer: Free<br/>Plus: $39/mo<br/>Enterprise: Negotiation | Hobby: Free<br/>Pro: $20/mo<br/>Growth: $250/mo |
| **Data Sovereignty** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

**Rating Criteria**:
- ⭐⭐⭐⭐⭐: Industry-leading level
- ⭐⭐⭐⭐: Excellent
- ⭐⭐⭐: Basic functionality provided
- ⭐⭐: Limited
- ⭐: Not supported

---

## 4. Hybrid Architecture Recommendation

### 4.1 Why a Single Solution Falls Short

In real-world enterprise environments, there are complex requirements:

1. **Gateway Separation Needed**
   - Rate limiting, Caching, Failover should be managed independently from Observability
   - No need to replace Observability tool when changing providers

2. **Multi-Framework Support**
   - LangChain, LlamaIndex, and custom code coexist
   - Framework-neutral Observability not tied to specific frameworks

3. **Data Sovereignty and Cost**
   - Sensitive data cannot be sent to cloud
   - Cloud billing spikes with large-scale traffic

4. **Advanced Evaluation Pipeline**
   - Integration with specialized evaluation frameworks like Ragas
   - Automated regression testing in CI/CD pipeline

### 4.2 Recommended Combination: Bifrost (Gateway) + Langfuse (Observability)

This combination provides the following benefits:

- **Gateway Separation of Concerns**: Bifrost handles provider routing, Caching, Rate limiting
- **Observability Specialization**: Langfuse handles Tracing, evaluation, prompt management
- **Complete Self-Host**: Run all components on EKS
- **Scalability**: Scale each layer independently

### 4.3 Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        A[Web App]
    end

    subgraph EKS["EKS Cluster"]
        subgraph GW["Gateway"]
            B[Kong/Envoy]
            C[Bifrost]
        end

        subgraph OBS["Observability"]
            D[Langfuse]
            E[(Aurora)]
            F[(ClickHouse)]
            G[(Redis)]
        end

        subgraph EVAL["Evaluation"]
            H[Eval Worker]
            I[Ragas]
        end
    end

    subgraph EXT["External LLM"]
        J[OpenAI]
        K[Anthropic]
        L[Bedrock]
    end

    A -->|Request| B
    B --> C
    C --> J & K & L
    J & K & L -->|Response| C
    C --> B
    B --> A

    C -.->|Trace| D
    D --> E & F & G
    H --> D
    I --> D

    style C fill:#e53935,stroke:#333
    style D fill:#326ce5,stroke:#333
    style H fill:#76b900,stroke:#333
```

**Data Flow**:
1. Client sends request to Kong/Envoy Gateway
2. Gateway routes to Bifrost
3. Bifrost makes LLM API calls per provider
4. Receives response
5. Bifrost returns response to Gateway
6. Gateway returns response to client
7. **Async**: Bifrost sends Trace to Langfuse (no response delay)

### 4.4 Helicone Standalone vs Bifrost+Langfuse Separated Architecture Comparison

| Aspect | Helicone Standalone | Bifrost + Langfuse |
|--------|---------------------|---------------------|
| **Integration Complexity** | Very Low (URL change only) | Medium (SDK integration required) |
| **Gateway Features** | Built-in (Rate limiting, Cache) | Provided by Bifrost |
| **Prompt Management** | Limited (Storage only) | Strong (Version, A/B testing) |
| **Evaluation Pipeline** | None | Full Support (Ragas integration) |
| **Chain Tracking** | Limited | Perfect (Nested Spans) |
| **Data Sovereignty** | Secured when Self-hosted | Fully Secured |
| **Scalability** | Gateway/Observability Coupled | Independent Scaling |
| **Cost (Large Scale)** | May hit plan limits | Unlimited (Infrastructure Only) |
| **Suitable Scenario** | MVP, Simple API Calls | Enterprise, Complex Chains |

**Conclusion**: Helicone is suitable for quick starts, but the Bifrost + Langfuse combination is superior for enterprise environments with prompt engineering teams and evaluation pipelines.

---

## 5. Langfuse EKS Self-Hosted Deployment

### 5.1 Infrastructure Prerequisites

Prepare the following AWS resources before deploying Langfuse to EKS:

- **RDS Aurora PostgreSQL**: Store Langfuse metadata
- **ClickHouse** (EC2 or Altinity.Cloud): For analytical queries
- **ElastiCache Redis**: API response caching
- **EKS Cluster**: v1.28 or higher
- **Application Load Balancer**: Ingress entry point

### 5.2 Helm Chart Installation

#### values.yaml Configuration

```yaml
# langfuse-values.yaml
replicaCount: 3

image:
  repository: langfuse/langfuse
  tag: "2.45.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/xxxxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
  hosts:
    - host: langfuse.example.com
      paths:
        - path: /
          pathType: Prefix

env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: langfuse-db
        key: postgres-url

  - name: CLICKHOUSE_URL
    valueFrom:
      secretKeyRef:
        name: langfuse-db
        key: clickhouse-url

  - name: REDIS_HOST
    value: "langfuse-redis.cache.amazonaws.com"

  - name: REDIS_PORT
    value: "6379"

  - name: NEXTAUTH_URL
    value: "https://langfuse.example.com"

  - name: NEXTAUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: langfuse-secrets
        key: nextauth-secret

  - name: SALT
    valueFrom:
      secretKeyRef:
        name: langfuse-secrets
        key: salt

  - name: TELEMETRY_ENABLED
    value: "false"

  - name: LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES
    value: "true"

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector:
  workload: genai

tolerations:
  - key: "workload"
    operator: "Equal"
    value: "genai"
    effect: "NoSchedule"

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - langfuse
          topologyKey: kubernetes.io/hostname
```

#### Secret Creation

```bash
# PostgreSQL connection string
kubectl create secret generic langfuse-db \
  --from-literal=postgres-url='postgresql://langfuse:PASSWORD@langfuse-db.cluster-xxx.us-west-2.rds.amazonaws.com:5432/langfuse' \
  --from-literal=clickhouse-url='http://user:password@clickhouse.example.com:8123/langfuse' \
  -n genai

# NextAuth secret creation
kubectl create secret generic langfuse-secrets \
  --from-literal=nextauth-secret=$(openssl rand -base64 32) \
  --from-literal=salt=$(openssl rand -base64 32) \
  -n genai
```

#### Helm Deployment

```bash
# Add Langfuse Helm Repository
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update

# Deploy
helm upgrade --install langfuse langfuse/langfuse \
  -f langfuse-values.yaml \
  -n genai \
  --create-namespace

# Check status
kubectl get pods -n genai -l app=langfuse
kubectl get ingress -n genai
```

### 5.3 PostgreSQL (RDS Aurora) Integration

#### RDS Aurora Configuration

```hcl
# Terraform example
resource "aws_rds_cluster" "langfuse" {
  cluster_identifier      = "langfuse-db"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "langfuse"
  master_username         = "langfuse"
  master_password         = random_password.langfuse_db.result

  db_subnet_group_name    = aws_db_subnet_group.private.name
  vpc_security_group_ids  = [aws_security_group.langfuse_db.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 16
  }

  skip_final_snapshot     = false
  final_snapshot_identifier = "langfuse-db-final-snapshot"

  tags = {
    Environment = "production"
    Service     = "langfuse"
  }
}

resource "aws_rds_cluster_instance" "langfuse" {
  count              = 2
  identifier         = "langfuse-db-${count.index}"
  cluster_identifier = aws_rds_cluster.langfuse.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.langfuse.engine
  engine_version     = aws_rds_cluster.langfuse.engine_version
}
```

#### Initial Schema Migration

Langfuse automatically creates schemas on first start, but manual migration is also possible:

```bash
# Connect to Langfuse Pod
kubectl exec -it langfuse-0 -n genai -- /bin/bash

# Run migration
npm run db:migrate
```

### 5.4 ClickHouse Integration (For Analytical Queries)

#### ClickHouse Operator Deployment (Inside EKS)

```yaml
# clickhouse-cluster.yaml
apiVersion: clickhouse.altinity.com/v1
kind: ClickHouseInstallation
metadata:
  name: langfuse-clickhouse
  namespace: genai
spec:
  configuration:
    clusters:
      - name: langfuse
        layout:
          shardsCount: 2
          replicasCount: 2
    zookeeper:
      nodes:
        - host: zk-0.zk-headless.genai.svc.cluster.local
        - host: zk-1.zk-headless.genai.svc.cluster.local
        - host: zk-2.zk-headless.genai.svc.cluster.local

  templates:
    podTemplates:
      - name: default
        spec:
          containers:
            - name: clickhouse
              image: clickhouse/clickhouse-server:23.12
              resources:
                requests:
                  cpu: "2"
                  memory: "8Gi"
                limits:
                  cpu: "4"
                  memory: "16Gi"

    volumeClaimTemplates:
      - name: data
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 500Gi
          storageClassName: gp3
```

#### Enable ClickHouse in Langfuse

Langfuse uses ClickHouse to accelerate analytical queries. Enable via environment variables:

```yaml
env:
  - name: CLICKHOUSE_URL
    value: "http://clickhouse-langfuse.genai.svc.cluster.local:8123"

  - name: CLICKHOUSE_USER
    value: "default"

  - name: CLICKHOUSE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: clickhouse-secret
        key: password

  - name: CLICKHOUSE_DATABASE
    value: "langfuse"
```

Langfuse automatically creates ClickHouse tables and synchronizes data from PostgreSQL.

### 5.5 Redis Integration (Caching)

#### ElastiCache Redis Configuration

```hcl
# Terraform example
resource "aws_elasticache_replication_group" "langfuse" {
  replication_group_id       = "langfuse-redis"
  replication_group_description = "Redis for Langfuse caching"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r7g.large"
  number_cache_clusters      = 2

  subnet_group_name          = aws_elasticache_subnet_group.private.name
  security_group_ids         = [aws_security_group.langfuse_redis.id]

  automatic_failover_enabled = true
  multi_az_enabled           = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.langfuse_redis.result

  tags = {
    Environment = "production"
    Service     = "langfuse"
  }
}
```

#### Langfuse Redis Configuration

```yaml
env:
  - name: REDIS_HOST
    value: "langfuse-redis.xxxxx.cache.amazonaws.com"

  - name: REDIS_PORT
    value: "6379"

  - name: REDIS_AUTH
    valueFrom:
      secretKeyRef:
        name: redis-secret
        key: auth-token

  - name: REDIS_CONNECTION_STRING
    value: "rediss://:$(REDIS_AUTH)@$(REDIS_HOST):$(REDIS_PORT)"
```

### 5.6 Ingress Configuration

#### AWS Load Balancer Controller-based ALB

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: langfuse
  namespace: genai
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/xxxxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/backend-protocol: HTTP
    alb.ingress.kubernetes.io/tags: Environment=production,Service=langfuse
spec:
  ingressClassName: alb
  rules:
    - host: langfuse.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: langfuse
                port:
                  number: 3000
```

### 5.7 Resource Requirements Table

| Component | CPU (Request/Limit) | Memory (Request/Limit) | Storage | Instance Count |
|-----------|---------------------|------------------------|---------|----------------|
| **Langfuse Server** | 1 / 2 | 2Gi / 4Gi | - | 3-10 (HPA) |
| **PostgreSQL (Aurora)** | - | - | 100GB (Initial) | 2 (Reader) |
| **ClickHouse** | 2 / 4 | 8Gi / 16Gi | 500GB / shard | 4 (2 shards × 2 replicas) |
| **Redis (ElastiCache)** | - | cache.r7g.large (13.07GB) | - | 2 (Primary + Replica) |
| **Evaluation Worker** | 0.5 / 1 | 1Gi / 2Gi | - | 2 |

**Estimated Cost** (us-west-2, monthly):
- EKS Worker Nodes (m6i.2xlarge × 5): ~$600
- RDS Aurora Serverless v2 (0.5-8 ACU): ~$150
- ClickHouse (m6i.xlarge × 4): ~$480
- ElastiCache Redis (r7g.large × 2): ~$240
- ALB: ~$20
- **Total**: ~$1,490/month

---

## 6. OpenTelemetry Integration

### 6.1 Why Integrate OpenTelemetry?

Langfuse provides LLM-specific Observability, but the full application context is managed in existing APM (Datadog, New Relic, Grafana). Using OpenTelemetry:

- **Unified Dashboard**: View LLM Trace + existing APM Trace in one screen
- **Correlation Analysis**: Track entire flow of HTTP request → DB query → LLM call
- **Single Instrumentation SDK**: Use only OpenTelemetry to send to both Langfuse and existing APM

### 6.2 Add Custom Spans with OTEL SDK

#### Python Example

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from langfuse.opentelemetry import LangfuseSpanProcessor

# Initialize OTEL Tracer
provider = TracerProvider()
trace.set_tracer_provider(provider)

# Send Spans to Langfuse
langfuse_processor = LangfuseSpanProcessor(
    public_key="pk-lf-xxx",
    secret_key="sk-lf-xxx",
    host="https://langfuse.example.com"
)
provider.add_span_processor(langfuse_processor)

# Also send to existing APM (Grafana Tempo)
otlp_exporter = OTLPSpanExporter(endpoint="https://tempo.example.com:4317")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

tracer = trace.get_tracer(__name__)

# Track RAG pipeline
def rag_pipeline(question: str) -> str:
    with tracer.start_as_current_span("rag_pipeline") as span:
        span.set_attribute("question", question)

        # 1. Vector search
        with tracer.start_as_current_span("vector_search") as search_span:
            docs = vector_store.search(question, top_k=5)
            search_span.set_attribute("num_results", len(docs))

        # 2. Reranking
        with tracer.start_as_current_span("reranking") as rerank_span:
            reranked = reranker.rerank(docs, question)
            rerank_span.set_attribute("model", "cross-encoder/ms-marco")

        # 3. LLM call
        with tracer.start_as_current_span(
            "llm_generation",
            attributes={
                "llm.model": "gpt-4o",
                "llm.temperature": 0.7,
            }
        ) as llm_span:
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": question}
                ],
                temperature=0.7
            )

            llm_span.set_attribute("llm.input_tokens", response.usage.prompt_tokens)
            llm_span.set_attribute("llm.output_tokens", response.usage.completion_tokens)
            llm_span.set_attribute("llm.total_cost", calculate_cost(response.usage))

            answer = response.choices[0].message.content
            span.set_attribute("answer", answer)

        return answer
```

### 6.3 Langfuse OTEL Exporter Configuration

Langfuse complies with OpenTelemetry Semantic Conventions. The following Span attributes are automatically mapped:

| OTEL Attribute | Langfuse Field | Description |
|----------------|----------------|-------------|
| `llm.model` | `model` | Model name (gpt-4o, claude-3-opus, etc.) |
| `llm.input_tokens` | `usage.input` | Input token count |
| `llm.output_tokens` | `usage.output` | Output token count |
| `llm.temperature` | `modelParameters.temperature` | Temperature parameter |
| `llm.request.prompt` | `input` | Prompt |
| `llm.response.completion` | `output` | Response text |
| `llm.total_cost` | `calculatedTotalCost` | Calculated cost |

### 6.4 Grafana + Langfuse Unified Dashboard

#### Grafana Tempo + Langfuse Combination

```mermaid
flowchart LR
    A[Application]
    B[OTEL<br/>Collector]
    C[Tempo]
    D[Langfuse]
    E[Grafana UI]

    A -->|OTEL<br/>Spans| B
    B -->|Export| C
    B -->|Export| D
    E --> C
    E --> D

    style C fill:#9c27b0,stroke:#333
    style D fill:#326ce5,stroke:#333
    style B fill:#ff9900,stroke:#333
```

#### Grafana Dashboard JSON Example (Partial)

```json
{
  "dashboard": {
    "title": "LLM Observability - Unified View",
    "panels": [
      {
        "title": "LLM Request Latency (p95)",
        "targets": [
          {
            "datasource": "Tempo",
            "query": "histogram_quantile(0.95, sum(rate(traces_spanmetrics_latency_bucket{span_name=\"llm_generation\"}[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Token Usage by Model",
        "targets": [
          {
            "datasource": "Langfuse",
            "query": "SELECT model, SUM(usage_input + usage_output) as total_tokens FROM traces WHERE timestamp > now() - interval '1 hour' GROUP BY model"
          }
        ]
      },
      {
        "title": "Cost per Project",
        "targets": [
          {
            "datasource": "Langfuse",
            "query": "SELECT project_name, SUM(calculated_total_cost) as cost FROM traces WHERE timestamp > now() - interval '1 day' GROUP BY project_name"
          }
        ]
      }
    ]
  }
}
```

To add Langfuse as a data source in Grafana, query Langfuse's ClickHouse directly or fetch data via Langfuse API.

---

## 7. Building Evaluation Pipeline

### 7.1 Langfuse Evaluation Configuration

Langfuse Evaluation supports three methods:

1. **LLM-as-Judge**: Evaluate response quality using a separate LLM
2. **Rule-Based**: Custom evaluation logic with Python functions
3. **Manual Evaluation**: Human evaluation directly in Annotation Queue

### 7.2 Automated Evaluation: LLM-as-Judge

#### Define Evaluator

```python
# evaluators/faithfulness.py
from langfuse import Langfuse
from openai import OpenAI

langfuse = Langfuse(
    public_key="pk-lf-xxx",
    secret_key="sk-lf-xxx",
    host="https://langfuse.example.com"
)

openai_client = OpenAI()

def evaluate_faithfulness(trace_id: str):
    """
    Faithfulness: Is the response faithful to the given context?
    """
    # Retrieve Trace from Langfuse
    trace = langfuse.get_trace(trace_id)

    # Extract required information
    context = trace.input.get("context", "")
    response = trace.output.get("answer", "")

    # LLM-as-Judge prompt
    judge_prompt = f"""
    Given the following context and response, evaluate if the response is faithful to the context.

    Context:
    {context}

    Response:
    {response}

    Rate faithfulness on a scale of 0-1, where:
    - 1.0: Completely faithful, all claims are supported by context
    - 0.5: Partially faithful, some claims lack support
    - 0.0: Not faithful, contains contradictions or unsupported claims

    Output only the numeric score.
    """

    # Use GPT-4 as Judge
    judge_response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": judge_prompt}],
        temperature=0.0
    )

    score = float(judge_response.choices[0].message.content.strip())

    # Record Score in Langfuse
    langfuse.score(
        trace_id=trace_id,
        name="faithfulness",
        value=score,
        comment=f"Evaluated by GPT-4 (Judge)"
    )

    return score
```

#### Automate Evaluation Pipeline

```python
# evaluation_pipeline.py
from langfuse import Langfuse
import time

langfuse = Langfuse(...)

def run_evaluation_pipeline():
    """
    Run automated evaluation on new Traces
    """
    while True:
        # Retrieve unevaluated Traces
        traces = langfuse.get_traces(
            filter={"scores.faithfulness": {"$exists": False}},
            limit=100
        )

        for trace in traces:
            try:
                # Execute evaluation
                evaluate_faithfulness(trace.id)
                evaluate_relevancy(trace.id)
                evaluate_toxicity(trace.id)

                print(f"Evaluated trace {trace.id}")
            except Exception as e:
                print(f"Error evaluating {trace.id}: {e}")

        # Poll every 10 seconds
        time.sleep(10)

if __name__ == "__main__":
    run_evaluation_pipeline()
```

#### Deploy as Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: langfuse-evaluation
  namespace: genai
spec:
  schedule: "*/5 * * * *"  # Run every 5 minutes
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: evaluator
            image: myregistry/langfuse-evaluator:latest
            env:
              - name: LANGFUSE_PUBLIC_KEY
                valueFrom:
                  secretKeyRef:
                    name: langfuse-keys
                    key: public-key
              - name: LANGFUSE_SECRET_KEY
                valueFrom:
                  secretKeyRef:
                    name: langfuse-keys
                    key: secret-key
              - name: LANGFUSE_HOST
                value: "https://langfuse.example.com"
              - name: OPENAI_API_KEY
                valueFrom:
                  secretKeyRef:
                    name: openai-secret
                    key: api-key
          restartPolicy: OnFailure
```

### 7.3 Manual Evaluation: Annotation Queue

Langfuse Annotation Queue provides a workflow for collecting human feedback.

#### Create Annotation Queue

```python
from langfuse import Langfuse

langfuse = Langfuse(...)

# Create Queue
queue = langfuse.create_annotation_queue(
    name="rag_quality_review",
    description="Manual review of RAG response quality",
    scoring_config={
        "categories": [
            {
                "name": "quality",
                "values": ["excellent", "good", "poor"]
            },
            {
                "name": "issues",
                "values": ["hallucination", "irrelevant", "incomplete", "none"]
            }
        ]
    }
)

# Add Trace to Queue
langfuse.add_to_annotation_queue(
    queue_id=queue.id,
    trace_id="trace-xxx"
)
```

Team members open the Queue in Langfuse UI to review each Trace and assign scores.

### 7.4 Ragas Integration

Ragas is a specialized evaluation framework for RAG systems that integrates with Langfuse to provide more sophisticated evaluation.

For details, see [RAG Evaluation with Ragas](../operations-mlops/ragas-evaluation.md) documentation.

#### Simple Ragas + Langfuse Example

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from langfuse import Langfuse

langfuse = Langfuse(...)

# Prepare dataset
dataset = {
    "question": ["What is the capital of France?"],
    "answer": ["The capital of France is Paris."],
    "contexts": [["France is a country in Europe. Its capital is Paris."]],
    "ground_truth": ["Paris"]
}

# Run Ragas evaluation
result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision]
)

# Record results in Langfuse
for idx, row in result.iterrows():
    langfuse.score(
        trace_id=row["trace_id"],
        name="ragas_faithfulness",
        value=row["faithfulness"]
    )
    langfuse.score(
        trace_id=row["trace_id"],
        name="ragas_answer_relevancy",
        value=row["answer_relevancy"]
    )
```

### 7.5 Evaluation Metrics

| Metric | Range | Description | Evaluation Method |
|--------|-------|-------------|-------------------|
| **Faithfulness** | 0-1 | Is the response faithful to the provided context? | LLM-as-Judge |
| **Answer Relevancy** | 0-1 | Is the response relevant to the question? | Ragas (Embedding Similarity) |
| **Context Precision** | 0-1 | Is the retrieved context relevant to the question? | Ragas |
| **Context Recall** | 0-1 | Is the Ground Truth contained in the retrieved context? | Ragas |
| **Toxicity** | 0-1 | Does the response contain harmful content? | Detoxify Library |
| **Latency** | ms | Response generation latency | Auto-collected |
| **Cost** | USD | Cost per request | Auto-calculated |

---

## 8. Cost Tracking and Optimization

### 8.1 Automatic Token Cost Calculation by Provider

Langfuse has built-in provider price lists and automatically calculates costs.

#### Customize Price List

```python
from langfuse import Langfuse

langfuse = Langfuse(...)

# Register custom model pricing
langfuse.update_model_pricing(
    model="gpt-4o-custom",
    input_price_per_1k_tokens=0.005,
    output_price_per_1k_tokens=0.015
)
```

#### Cost Calculation Example

```python
# Cost automatically calculated when creating Trace
trace = langfuse.trace(
    name="rag_query",
    input={"question": "What is RAG?"},
    metadata={"user_id": "user-123", "project": "chatbot-v2"}
)

generation = trace.generation(
    name="llm_call",
    model="gpt-4o",
    input="What is RAG?",
    output="RAG stands for Retrieval-Augmented Generation...",
    usage={
        "input": 1200,
        "output": 450
    }
)

# Langfuse automatically calculates cost:
# Cost = (1200 * $0.005 / 1000) + (450 * $0.015 / 1000) = $0.01275
```

### 8.2 Cost Dashboard by Team/Project

In Langfuse UI, you can aggregate costs by the following criteria:

- **By Project**: `metadata.project`
- **By Team**: `metadata.team`
- **By User**: `metadata.user_id`
- **By Environment**: `metadata.environment` (production, staging)

#### Custom Reports with ClickHouse Queries

```sql
-- Daily cost by project
SELECT
    toDate(timestamp) as date,
    JSONExtractString(metadata, 'project') as project,
    SUM(calculated_total_cost) as total_cost,
    COUNT(*) as num_requests
FROM traces
WHERE timestamp >= today() - INTERVAL 30 DAY
GROUP BY date, project
ORDER BY date DESC, total_cost DESC;

-- Average cost by model
SELECT
    model,
    AVG(calculated_total_cost) as avg_cost,
    PERCENTILE_CONT(0.95)(calculated_total_cost) as p95_cost,
    COUNT(*) as num_requests
FROM traces
WHERE timestamp >= today() - INTERVAL 7 DAY
GROUP BY model
ORDER BY avg_cost DESC;
```

### 8.3 Configure Cost Alerts

#### Prometheus + Alertmanager Integration

```yaml
# langfuse-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: langfuse
  namespace: genai
spec:
  selector:
    matchLabels:
      app: langfuse
  endpoints:
    - port: metrics
      interval: 30s

---
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: langfuse-cost-alerts
  namespace: genai
spec:
  groups:
    - name: langfuse_cost
      interval: 5m
      rules:
        - alert: HighDailyCost
          expr: sum(increase(langfuse_cost_total[1d])) > 500
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Daily LLM cost exceeded $500"
            description: "Total cost in the last 24h: ${{ $value }}"

        - alert: UnexpectedCostSpike
          expr: rate(langfuse_cost_total[5m]) > 2 * rate(langfuse_cost_total[1h] offset 1h)
          for: 10m
          labels:
            severity: critical
          annotations:
            summary: "LLM cost spike detected"
            description: "Cost rate is 2x higher than 1 hour ago"
```

#### Slack Notifications

```python
# cost_monitor.py
import requests
from langfuse import Langfuse

langfuse = Langfuse(...)
SLACK_WEBHOOK = "https://hooks.slack.com/services/xxx"

def check_daily_cost():
    # Query today's total cost
    today_cost = langfuse.get_daily_cost()

    if today_cost > 500:
        requests.post(SLACK_WEBHOOK, json={
            "text": f"Warning: Today's LLM cost is ${today_cost:.2f} (threshold: $500)"
        })
```

### 8.4 Cost Optimization with Cascade Routing

You can optimize costs by integrating with Bifrost Gateway's Cascade Routing:

1. **First Attempt**: Low-cost model (gpt-4o-mini)
2. **On Failure**: Fallback to high-performance model (gpt-4o)
3. **Langfuse Tracking**: Record each attempt as a Span for cost-effectiveness analysis

```python
from bifrost import BifrostClient
from langfuse import Langfuse

bifrost = BifrostClient(...)
langfuse = Langfuse(...)

trace = langfuse.trace(name="cascade_routing_query")

# 1st attempt: gpt-4o-mini
with trace.span(name="attempt_1", metadata={"model": "gpt-4o-mini"}):
    response = bifrost.complete(
        model="gpt-4o-mini",
        prompt="Summarize this document..."
    )

    if response.quality_score < 0.7:
        # 2nd attempt: gpt-4o
        with trace.span(name="attempt_2", metadata={"model": "gpt-4o"}):
            response = bifrost.complete(
                model="gpt-4o",
                prompt="Summarize this document..."
            )

# Cost comparison analysis
print(f"Total cost: ${trace.calculated_total_cost:.4f}")
print(f"Attempts: {trace.span_count}")
```

You can visualize "Cascade Routing success rate" and "average cost savings" in the Langfuse dashboard.

---

## 9. Recommendations by Scenario

| Scenario | Recommended Solution | Reason |
|----------|---------------------|--------|
| **LangChain/LangGraph-Centric Development** | LangSmith | - LangChain native integration<br/>- Track entire chain with one line of code<br/>- Share prompt templates via Hub |
| **Data Sovereignty Required (Finance/Healthcare)** | Langfuse (Self-hosted) | - Store all data on own infrastructure<br/>- GDPR/HIPAA compliance<br/>- Unlimited traces |
| **Quick Start (MVP/PoC)** | Helicone | - Start tracking immediately with URL change<br/>- Built-in gateway features<br/>- Minimal setup complexity |
| **Operating Prompt Engineering Team** | Langfuse | - Strong prompt version management<br/>- A/B testing support<br/>- Dataset + automated evaluation pipeline |
| **Enterprise Hybrid** | Bifrost (Gateway) + Langfuse (Observability) | - Separation of Gateway and Observability concerns<br/>- Multi-framework support<br/>- Independent scaling |
| **Full-Stack GenAI Platform** | kgateway + Bifrost + Langfuse + Ragas | - API management with Kong<br/>- LLM routing with Bifrost<br/>- Tracking with Langfuse<br/>- Quality evaluation with Ragas |
| **Large-Scale Traffic (10M+ traces/month)** | Langfuse (Self-hosted) + ClickHouse Cluster | - Horizontal scaling<br/>- Cost efficient (no plan limits)<br/>- High-speed analytical queries |
| **Multi-Cloud Environment** | Langfuse (Self-hosted) | - Independent deployment per cloud<br/>- Centralized dashboard integration |

---

## 10. Summary and Next Steps

### 10.1 Key Summary

1. **LLMOps Observability is Essential**: Traditional APM cannot support token costs, prompt quality, and chain tracking for LLM workloads.

2. **Comparison of 3 Major Solutions**:
   - **Langfuse**: Open source, self-hosted, powerful evaluation pipeline
   - **LangSmith**: LangChain optimized, managed, quick start
   - **Helicone**: Proxy-based, Gateway + Observability integrated, ultra-simple setup

3. **Hybrid Architecture Recommended**: Bifrost (Gateway) + Langfuse (Observability) combination is optimal for enterprise environments

4. **OpenTelemetry Integration**: Connect existing APM with LLMOps Observability in unified dashboard

5. **Evaluation Pipeline**: Automated/manual quality evaluation using LLM-as-Judge, Ragas, Annotation Queue

6. **Cost Optimization**: Automatic token cost calculation by provider, team/project dashboards, Cascade Routing integration

### 10.2 Next Steps

#### Immediate Start (1-2 days)
- [ ] Build quick PoC with Helicone (URL change only)
- [ ] Check basic Tracing dashboard
- [ ] Verify token cost tracking

#### Short-term (1-2 weeks)
- [ ] Deploy Langfuse self-hosted (EKS + RDS Aurora)
- [ ] Integrate LangChain/LlamaIndex SDK
- [ ] Connect OpenTelemetry (integrate with existing APM)
- [ ] Start prompt version management

#### Mid-term (1-2 months)
- [ ] Connect ClickHouse (large-scale analytical queries)
- [ ] Build automated evaluation pipeline (LLM-as-Judge)
- [ ] Integrate Ragas (RAG quality evaluation)
- [ ] Automate Dataset management and regression testing

#### Long-term (3+ months)
- [ ] Integrate with Bifrost Gateway (hybrid architecture)
- [ ] Collect RLHF data with Annotation Queue
- [ ] Cost alerts and automatic optimization
- [ ] Multi-cloud deployment (centralized dashboard)

### 10.3 Checklist

Essential check items before deployment:

- [ ] **Infrastructure**: Prepare RDS Aurora, ClickHouse, Redis
- [ ] **Security**: Ingress TLS certificate, NextAuth secret creation
- [ ] **Scaling**: HPA configuration, determine ClickHouse cluster size
- [ ] **Backup**: PostgreSQL backup policy, ClickHouse snapshots
- [ ] **Monitoring**: Prometheus, Grafana integration
- [ ] **Cost Alerts**: Set daily budget exceeded alerts
- [ ] **Evaluation Pipeline**: Deploy automated evaluator CronJob
- [ ] **Documentation**: Write team member onboarding guide

---

## 11. References

### Official Documentation
- [Langfuse Documentation](https://langfuse.com/docs)
- [LangSmith Documentation](https://docs.smith.langchain.com)
- [Helicone Documentation](https://docs.helicone.ai)
- [OpenTelemetry LLM Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Ragas Documentation](https://docs.ragas.io)

### Related Documentation
- [Bifrost Gateway Configuration Guide](./llm-gateway-architecture.md)
- [kgateway-based Kong API Gateway Integration](./inference-gateway-routing.md)
- [RAG Evaluation with Ragas](../operations-mlops/ragas-evaluation.md)
- [Cascade Routing Strategy](./llm-gateway-architecture.md)

### GitHub Repositories
- [Langfuse](https://github.com/langfuse/langfuse)
- [Langfuse Helm Chart](https://github.com/langfuse/langfuse-helm)
- [LangChain](https://github.com/langchain-ai/langchain)
- [Ragas](https://github.com/explodinggradients/ragas)

### Blogs and Articles
- [Why LLM Observability is Different](https://langfuse.com/blog/llm-observability)
- [Building a Cost-Effective LLMOps Pipeline](https://www.langchain.com/blog/cost-effective-llmops)
- [Evaluating RAG Systems with Ragas](https://blog.langchain.dev/evaluating-rag-pipelines-with-ragas-langsmith/)

### Community
- [Langfuse Discord](https://discord.gg/langfuse)
- [LangChain Discord](https://discord.gg/langchain)
- [GenAI Observability Slack](https://genai-observability.slack.com)

---

**Last Updated**: 2026-03-16
**Author**: devfloor9
**Document Version**: 1.0
