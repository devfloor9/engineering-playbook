---
title: "AI Agent 监控与运维"
sidebar_label: "12. Agent Monitoring & Operations"
description: "使用 LangFuse 和 LangSmith 监控、告警和排查 Agentic AI 应用的综合指南"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry, operations, troubleshooting, alerting]
category: "genai-aiml"
sidebar_position: 12
last_update:
  date: 2026-02-14
  author: devfloor9
---

import {
  LangFuseVsLangSmithTable,
  LatencyMetricsTable,
  TokenUsageMetricsTable,
  ErrorRateMetricsTable,
  DailyChecksTable,
  WeeklyChecksTable,
  MaturityModelTable
} from '@site/src/components/AgentMonitoringTables';

# AI Agent 监控与运维

> 📅 **撰写日期**: 2025-02-05 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 4 分钟

本文档介绍使用 LangFuse 和 LangSmith 有效追踪和监控 Agentic AI 应用性能与行为的综合方法。我们提供了从 Kubernetes 环境部署到 Grafana 仪表盘配置、告警设置和故障排查的完整运维指南。

## 概述

Agentic AI 应用执行复杂的推理链和多样的工具调用，仅依靠传统的 APM（应用性能监控）工具难以实现充分的可见性。LangFuse 和 LangSmith 是 LLM 专用的可观测性工具，提供以下核心能力：

- **Trace 追踪**：追踪 LLM 调用、工具执行和 Agent 推理过程的完整流程
- **Token 用量分析**：计算输入/输出 Token 数量和成本
- **质量评估**：对响应质量进行评分并收集反馈
- **调试**：通过审查提示词和响应来诊断问题

:::info 目标受众
本文档面向平台运维人员、MLOps 工程师和 AI 开发者。需要具备 Kubernetes 和 Python 的基础知识。
:::

## LangFuse vs LangSmith 对比

<LangFuseVsLangSmithTable />

:::tip 选型指南

- **LangFuse**：当数据主权至关重要或需要成本优化时
- **LangSmith**：当主要基于 LangChain 开发且需要快速上手时
:::


## LangFuse Kubernetes 部署

### 架构概述

LangFuse 由以下组件组成：

```mermaid
graph TB
    subgraph LangFuseStack["LangFuse Stack"]
        WEB["LangFuse Web<br/>(Next.js)"]
        API["LangFuse API<br/>(tRPC)"]
        WORKER["Background Worker<br/>(Queue Processing)"]
    end

    subgraph Storage["Storage Layer"]
        PG["PostgreSQL<br/>(Metadata)"]
        REDIS["Redis<br/>(Cache/Queue)"]
        S3["S3<br/>(Blob Storage)"]
    end

    subgraph Clients["AI Applications"]
        AGENT1["Agent 1"]
        AGENT2["Agent 2"]
        AGENTN["Agent N"]
    end

    AGENT1 --> API
    AGENT2 --> API
    AGENTN --> API
    WEB --> API
    API --> PG
    API --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    WORKER --> S3

    style LangFuseStack fill:#e8f5e9
    style Storage fill:#e3f2fd
    style Clients fill:#fff3e0
```

### PostgreSQL 部署

部署 PostgreSQL 用于 LangFuse 元数据存储。

```yaml
# langfuse-postgres.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: observability
  labels:
    app.kubernetes.io/part-of: langfuse
---
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-postgres-secret
  namespace: observability
type: Opaque
stringData:
  POSTGRES_USER: langfuse
  POSTGRES_PASSWORD: "your-secure-password-here"  # 生产环境请使用 Secrets Manager
  POSTGRES_DB: langfuse
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: langfuse-postgres-pvc
  namespace: observability
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 100Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: langfuse-postgres
  namespace: observability
spec:
  serviceName: langfuse-postgres
  replicas: 1
  selector:
    matchLabels:
      app: langfuse-postgres
  template:
    metadata:
      labels:
        app: langfuse-postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: langfuse-postgres-secret
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - langfuse
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - langfuse
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: langfuse-postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: langfuse-postgres
  namespace: observability
spec:
  selector:
    app: langfuse-postgres
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
```


### LangFuse 部署

部署 LangFuse 应用。

```yaml
# langfuse-deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-secret
  namespace: observability
type: Opaque
stringData:
  # 必需的环境变量
  DATABASE_URL: "postgresql://langfuse:your-secure-password-here@langfuse-postgres:5432/langfuse"
  NEXTAUTH_SECRET: "your-nextauth-secret-32-chars-min"  # openssl rand -base64 32
  SALT: "your-salt-value-here"  # openssl rand -base64 32
  ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000"  # 64 个十六进制字符

  # 可选的环境变量
  NEXTAUTH_URL: "https://langfuse.your-domain.com"
  LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: "true"

  # S3 配置（可选）
  S3_ENDPOINT: "https://s3.ap-northeast-2.amazonaws.com"
  S3_ACCESS_KEY_ID: "your-access-key"
  S3_SECRET_ACCESS_KEY: "your-secret-key"
  S3_BUCKET_NAME: "langfuse-traces"
  S3_REGION: "ap-northeast-2"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse
  namespace: observability
  labels:
    app: langfuse
spec:
  replicas: 2
  selector:
    matchLabels:
      app: langfuse
  template:
    metadata:
      labels:
        app: langfuse
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/api/public/metrics"
    spec:
      containers:
        - name: langfuse
          image: langfuse/langfuse:2
          ports:
            - containerPort: 3000
              name: http
          envFrom:
            - secretRef:
                name: langfuse-secret
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: HOSTNAME
              value: "0.0.0.0"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/public/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
          readinessProbe:
            httpGet:
              path: /api/public/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: langfuse
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: langfuse
  namespace: observability
spec:
  selector:
    app: langfuse
  ports:
    - port: 80
      targetPort: 3000
      name: http
  type: ClusterIP
```


### Ingress 配置

配置 Ingress 以实现外部访问。

```yaml
# langfuse-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: langfuse-ingress
  namespace: observability
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:XXXXXXXXXXXX:certificate/xxx
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /api/public/health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "2"
spec:
  ingressClassName: alb
  rules:
    - host: langfuse.your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: langfuse
                port:
                  number: 80
```

### HPA 配置

基于流量配置自动扩缩容。

```yaml
# langfuse-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: langfuse-hpa
  namespace: observability
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: langfuse
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

:::warning 生产部署注意事项

- 始终将 `NEXTAUTH_SECRET`、`SALT` 和 `ENCRYPTION_KEY` 设置为安全的随机值
- 在生产环境中，使用 AWS Secrets Manager 或 HashiCorp Vault 进行密钥管理
- 对于 PostgreSQL，建议使用 RDS（高可用、自动备份）
:::


## LangSmith 集成

LangSmith 是 LangChain 提供的托管可观测性平台。虽然没有自托管选项，但与基于 LangChain 的应用集成非常简便。

### 环境配置

设置使用 LangSmith 所需的环境变量。

```yaml
# langsmith-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langsmith-config
  namespace: ai-agents
type: Opaque
stringData:
  LANGCHAIN_TRACING_V2: "true"
  LANGCHAIN_ENDPOINT: "https://api.smith.langchain.com"
  LANGCHAIN_API_KEY: "ls__your-api-key-here"
  LANGCHAIN_PROJECT: "agentic-ai-production"
```

### LangChain Agent 集成

将 LangSmith 与 LangChain Agent 集成的 Python 代码示例。

```python
# agent_with_langsmith.py
import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree

# 环境变量（从 Kubernetes Secret 注入）
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
# LANGCHAIN_API_KEY=ls__xxx
# LANGCHAIN_PROJECT=agentic-ai-production

# 定义自定义工具
@tool
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information."""
    # Milvus 搜索逻辑
    return f"Search results: Information about {query}..."

@tool
def create_support_ticket(title: str, description: str, priority: str = "medium") -> str:
    """Create a customer support ticket."""
    # 工单创建逻辑
    return f"Ticket created: {title} (Priority: {priority})"

# Agent 配置
llm = ChatOpenAI(
    model="gpt-4-turbo",
    temperature=0.7,
    max_tokens=4096,
)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful and professional customer support agent.
    Always provide accurate information, and be honest about what you don't know.
    When necessary, search the knowledge base or create a ticket."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

tools = [search_knowledge_base, create_support_ticket]
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    return_intermediate_steps=True,
)

# 包装为可追踪函数
@traceable(
    name="customer_support_agent",
    run_type="chain",
    tags=["production", "customer-support"],
)
def run_agent(user_input: str, chat_history: list = None, metadata: dict = None):
    """执行 Agent 并将 trace 记录到 LangSmith。"""
    if chat_history is None:
        chat_history = []

    # 向当前运行树添加元数据
    run_tree = get_current_run_tree()
    if run_tree and metadata:
        run_tree.extra["metadata"] = metadata

    result = agent_executor.invoke({
        "input": user_input,
        "chat_history": chat_history,
    })

    return result

# 使用示例
if __name__ == "__main__":
    response = run_agent(
        user_input="Please check the shipping status of order #12345",
        metadata={
            "user_id": "user_123",
            "session_id": "session_456",
            "tenant_id": "tenant_abc",
        }
    )
    print(response)
```


### LangFuse Python 集成

如何将 LangFuse 集成到 Python 应用中。

```python
# agent_with_langfuse.py
import os
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from langfuse.openai import openai  # OpenAI wrapper
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.callbacks import LangfuseCallbackHandler

# 初始化 LangFuse 客户端
langfuse = Langfuse(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST", "https://langfuse.your-domain.com"),
)

# LangChain 回调处理器
langfuse_handler = LangfuseCallbackHandler(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST"),
)

# Agent 配置
llm = ChatOpenAI(
    model="gpt-4-turbo",
    temperature=0.7,
    callbacks=[langfuse_handler],
)

@observe(name="customer_support_agent")
def run_agent_with_langfuse(
    user_input: str,
    user_id: str = None,
    session_id: str = None,
    tenant_id: str = None,
):
    """带有 LangFuse 追踪的 Agent 执行。"""

    # 向 trace 添加元数据
    langfuse_context.update_current_trace(
        user_id=user_id,
        session_id=session_id,
        metadata={
            "tenant_id": tenant_id,
            "environment": os.environ.get("ENVIRONMENT", "production"),
        },
        tags=["customer-support", "production"],
    )

    # 执行 Agent
    result = agent_executor.invoke(
        {"input": user_input, "chat_history": []},
        config={"callbacks": [langfuse_handler]},
    )

    # 记录输出 Token 和成本
    langfuse_context.update_current_observation(
        output=result["output"],
        metadata={
            "intermediate_steps": len(result.get("intermediate_steps", [])),
        },
    )

    return result

@observe(name="vector_search", as_type="span")
def search_with_tracing(query: str, collection: str, top_k: int = 5):
    """带追踪的向量搜索。"""
    from pymilvus import Collection

    langfuse_context.update_current_observation(
        input={"query": query, "collection": collection, "top_k": top_k},
    )

    # 执行 Milvus 搜索
    collection = Collection(collection)
    results = collection.search(
        data=[get_embedding(query)],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"ef": 64}},
        limit=top_k,
        output_fields=["content", "metadata"],
    )

    langfuse_context.update_current_observation(
        output={"num_results": len(results[0])},
    )

    return results

# 记录评分和反馈
def record_feedback(trace_id: str, score: float, comment: str = None):
    """将用户反馈记录到 LangFuse。"""
    langfuse.score(
        trace_id=trace_id,
        name="user_feedback",
        value=score,
        comment=comment,
    )

# 使用示例
if __name__ == "__main__":
    response = run_agent_with_langfuse(
        user_input="请告诉我关于产品退货流程的信息",
        user_id="user_123",
        session_id="session_456",
        tenant_id="tenant_abc",
    )

    # 记录反馈（例如，用户对响应满意）
    trace_id = langfuse_context.get_current_trace_id()
    record_feedback(trace_id, score=1.0, comment="回答准确")

    # 刷新以发送所有事件
    langfuse.flush()
```


## 核心监控指标

定义 Agentic AI 应用需要追踪的关键指标。

### 指标分类

```mermaid
graph TB
    subgraph Metrics["Core Metrics"]
        subgraph Latency["⏱️ Latency"]
            E2E["End-to-End Latency"]
            LLM_LAT["LLM Inference Time"]
            TOOL_LAT["Tool Execution Time"]
            RETRIEVAL_LAT["Retrieval Latency"]
        end

        subgraph Tokens["🔢 Token Usage"]
            INPUT_TOK["Input Tokens"]
            OUTPUT_TOK["Output Tokens"]
            TOTAL_TOK["Total Tokens"]
            COST["Cost"]
        end

        subgraph Errors["❌ Error Rate"]
            LLM_ERR["LLM Errors"]
            TOOL_ERR["Tool Errors"]
            TIMEOUT["Timeouts"]
            RATE_LIMIT["Rate Limit"]
        end

        subgraph Traces["🔍 Trace Analysis"]
            CHAIN_LEN["Chain Length"]
            TOOL_CALLS["Tool Call Count"]
            ITERATIONS["Iterations"]
            SUCCESS["Success Rate"]
        end
    end

    style Latency fill:#e3f2fd
    style Tokens fill:#e8f5e9
    style Errors fill:#ffcdd2
    style Traces fill:#fff3e0
```

### 延迟指标

<LatencyMetricsTable />

### Token 用量指标

<TokenUsageMetricsTable />

### 错误率指标

<ErrorRateMetricsTable />

### Prometheus 指标采集配置

```yaml
# prometheus-scrape-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-agent-scrape
  namespace: observability
data:
  agent-scrape.yaml: |
    scrape_configs:
      - job_name: 'langfuse'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - observability
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: langfuse
            action: keep
          - source_labels: [__meta_kubernetes_pod_container_port_number]
            regex: "3000"
            action: keep
        metrics_path: /api/public/metrics

      - job_name: 'ai-agents'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ai-agents
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            regex: "true"
            action: keep
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```


### Python 指标导出器

从 Agent 应用中暴露 Prometheus 指标的代码。

```python
# metrics_exporter.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# 定义指标
AGENT_REQUEST_DURATION = Histogram(
    'agent_request_duration_seconds',
    'Agent request duration in seconds',
    ['agent_name', 'model', 'tenant_id'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

LLM_INFERENCE_DURATION = Histogram(
    'llm_inference_duration_seconds',
    'LLM inference duration in seconds',
    ['model', 'provider'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

LLM_TOKENS = Counter(
    'llm_tokens_total',
    'Total LLM tokens used',
    ['model', 'token_type', 'tenant_id']  # token_type: input, output
)

LLM_COST = Counter(
    'llm_cost_dollars_total',
    'Total LLM cost in USD',
    ['model', 'tenant_id']
)

AGENT_ERRORS = Counter(
    'agent_errors_total',
    'Total agent errors',
    ['agent_name', 'error_type', 'tenant_id']
)

TOOL_EXECUTION_DURATION = Histogram(
    'tool_execution_duration_seconds',
    'Tool execution duration in seconds',
    ['tool_name', 'agent_name'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]
)

ACTIVE_SESSIONS = Gauge(
    'agent_active_sessions',
    'Number of active agent sessions',
    ['agent_name', 'tenant_id']
)

# 模型定价（每 1K Token 的美元价格）
MODEL_COSTS = {
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
}

def record_llm_usage(
    model: str,
    input_tokens: int,
    output_tokens: int,
    tenant_id: str,
    duration: float,
):
    """记录 LLM 使用指标。"""
    # 记录 Token 数量
    LLM_TOKENS.labels(model=model, token_type="input", tenant_id=tenant_id).inc(input_tokens)
    LLM_TOKENS.labels(model=model, token_type="output", tenant_id=tenant_id).inc(output_tokens)

    # 计算并记录成本
    if model in MODEL_COSTS:
        cost = (
            (input_tokens / 1000) * MODEL_COSTS[model]["input"] +
            (output_tokens / 1000) * MODEL_COSTS[model]["output"]
        )
        LLM_COST.labels(model=model, tenant_id=tenant_id).inc(cost)

    # 记录推理时间
    LLM_INFERENCE_DURATION.labels(model=model, provider="openai").observe(duration)

def record_agent_request(
    agent_name: str,
    model: str,
    tenant_id: str,
    duration: float,
    success: bool,
    error_type: str = None,
):
    """记录 Agent 请求指标。"""
    AGENT_REQUEST_DURATION.labels(
        agent_name=agent_name,
        model=model,
        tenant_id=tenant_id
    ).observe(duration)

    if not success and error_type:
        AGENT_ERRORS.labels(
            agent_name=agent_name,
            error_type=error_type,
            tenant_id=tenant_id
        ).inc()

# 启动指标服务器
def start_metrics_server(port: int = 8000):
    """启动 Prometheus 指标服务器。"""
    start_http_server(port)
    print(f"Metrics server started on port {port}")
```


## Grafana 仪表盘与告警

### 仪表盘概述

配置用于 AI Agent 监控的 Grafana 仪表盘。

```mermaid
graph TB
    subgraph Dashboard["Grafana Dashboard"]
        subgraph Row1["Overview"]
            TOTAL_REQ["Total Requests"]
            SUCCESS_RATE["Success Rate"]
            AVG_LATENCY["Average Latency"]
            ACTIVE_USERS["Active Users"]
        end

        subgraph Row2["Performance"]
            LATENCY_CHART["Latency Distribution"]
            THROUGHPUT["Throughput Trend"]
            ERROR_RATE["Error Rate Trend"]
        end

        subgraph Row3["Cost & Usage"]
            TOKEN_USAGE["Token Usage"]
            COST_BY_MODEL["Cost by Model"]
            COST_BY_TENANT["Cost by Tenant"]
        end

        subgraph Row4["Traces"]
            TRACE_TABLE["Recent Traces"]
            SLOW_TRACES["Slow Requests"]
            ERROR_TRACES["Error Traces"]
        end
    end

    style Row1 fill:#e3f2fd
    style Row2 fill:#e8f5e9
    style Row3 fill:#fff3e0
    style Row4 fill:#fce4ec
```

### Grafana 告警规则

```yaml
# grafana-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-alert-rules
  namespace: observability
data:
  ai-agent-alerts.yaml: |
    apiVersion: 1
    groups:
      - orgId: 1
        name: AI Agent Alerts
        folder: AI Monitoring
        interval: 1m
        rules:
          - uid: agent-high-latency
            title: Agent High Latency
            condition: C
            data:
              - refId: A
                relativeTimeRange:
                  from: 300
                  to: 0
                datasourceUid: prometheus
                model:
                  expr: histogram_quantile(0.99, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le, agent_name))
                  intervalMs: 1000
                  maxDataPoints: 43200
              - refId: B
                relativeTimeRange:
                  from: 300
                  to: 0
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [10]
                        type: gt
                      operator:
                        type: and
                      query:
                        params: [A]
                      reducer:
                        type: last
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            noDataState: NoData
            execErrState: Error
            for: 5m
            annotations:
              summary: "Agent {{ $labels.agent_name }} P99 延迟超过 10 秒"
              description: "当前 P99 延迟：{{ $values.A }} 秒"
            labels:
              severity: warning

          - uid: agent-high-error-rate
            title: Agent High Error Rate
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: |
                    sum(rate(agent_errors_total[5m])) by (agent_name) /
                    sum(rate(agent_request_duration_seconds_count[5m])) by (agent_name)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [0.05]
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 5m
            annotations:
              summary: "Agent {{ $labels.agent_name }} 错误率超过 5%"
              description: "当前错误率：{{ printf \"%.2f\" $values.A }}%"
            labels:
              severity: critical

          - uid: llm-rate-limit
            title: LLM Rate Limit Errors
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: sum(increase(llm_rate_limit_errors_total[5m])) by (model)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [10]
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 2m
            annotations:
              summary: "LLM {{ $labels.model }} 检测到速率限制错误"
              description: "过去 5 分钟内有 {{ $values.A }} 次速率限制错误"
            labels:
              severity: warning

          - uid: cost-budget-alert
            title: Daily Cost Budget Exceeded
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [100]  # 每日 $100 预算
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 0s
            annotations:
              summary: "租户 {{ $labels.tenant_id }} 超出每日成本预算"
              description: "当前每日成本：${{ printf \"%.2f\" $values.A }}"
            labels:
              severity: warning
```


## 运维检查清单

### 每日检查

<DailyChecksTable />

### 每周检查

<WeeklyChecksTable />


## 故障排查指南

### GPU OOM（内存不足）问题

#### 症状

```
CUDA out of memory. Tried to allocate X GiB
RuntimeError: CUDA error: out of memory
```

#### 诊断

```bash
# 检查 GPU 内存状态
kubectl exec -it <pod-name> -n inference -- nvidia-smi

# 检查 DCGM 指标
kubectl exec -it <dcgm-exporter-pod> -n monitoring -- dcgmi dmon -e 155,156
```

#### 解决方案

```yaml
# 1. 减小批处理大小
env:
- name: MAX_BATCH_SIZE
  value: "16"  # 从 32 减少

# 2. 应用模型量化
env:
- name: QUANTIZATION
  value: "int8"  # 或 "fp8"

# 3. 限制 KV 缓存大小
env:
- name: MAX_NUM_SEQS
  value: "128"  # 限制并发序列数
```

### 网络延迟问题

#### 症状

- 推理请求超时
- 模型间延迟
- NCCL 超时（分布式推理）

#### 解决方案

```yaml
# 1. 分布式部署的 Pod 反亲和性
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels:
            app: inference
        topologyKey: "topology.kubernetes.io/zone"

# 2. 增加超时时间
env:
- name: NCCL_TIMEOUT
  value: "1800"  # 30 分钟
- name: REQUEST_TIMEOUT
  value: "300"   # 5 分钟
```

### LangFuse 连接错误

```bash
# 症状：Trace 未记录到 LangFuse

# 1. 检查 LangFuse 服务状态
kubectl get pods -n observability -l app=langfuse

# 2. 检查 LangFuse 日志
kubectl logs -n observability -l app=langfuse --tail=100

# 3. 测试网络连接
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://langfuse.observability.svc/api/public/health

# 4. 验证环境变量
kubectl exec -n ai-agents <pod-name> -- env | grep LANGFUSE
```


## 成本追踪

### 按模型的成本分析

按模型追踪和分析 LLM 使用成本。

```python
# cost_tracker.py
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

@dataclass
class ModelPricing:
    """模型定价信息（每 1K Token 的美元价格）"""
    input_price: float
    output_price: float

# 2024 年模型定价
MODEL_PRICING: Dict[str, ModelPricing] = {
    # OpenAI
    "gpt-4-turbo": ModelPricing(0.01, 0.03),
    "gpt-4": ModelPricing(0.03, 0.06),
    "gpt-3.5-turbo": ModelPricing(0.0005, 0.0015),

    # Anthropic
    "claude-3-opus": ModelPricing(0.015, 0.075),
    "claude-3-sonnet": ModelPricing(0.003, 0.015),
    "claude-3-haiku": ModelPricing(0.00025, 0.00125),
}

@dataclass
class UsageRecord:
    """使用记录"""
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    tenant_id: str
    agent_name: str
    trace_id: str

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    @property
    def cost(self) -> float:
        if self.model not in MODEL_PRICING:
            return 0.0
        pricing = MODEL_PRICING[self.model]
        return (
            (self.input_tokens / 1000) * pricing.input_price +
            (self.output_tokens / 1000) * pricing.output_price
        )

class CostTracker:
    """成本追踪器"""

    def __init__(self, langfuse_client=None):
        self.langfuse = langfuse_client
        self.records: List[UsageRecord] = []

    def record_usage(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        tenant_id: str,
        agent_name: str,
        trace_id: str,
    ):
        """记录使用情况。"""
        record = UsageRecord(
            timestamp=datetime.utcnow(),
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tenant_id=tenant_id,
            agent_name=agent_name,
            trace_id=trace_id,
        )
        self.records.append(record)

        # 更新 Prometheus 指标
        from metrics_exporter import record_llm_usage
        record_llm_usage(
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tenant_id=tenant_id,
            duration=0,  # 需要单独测量
        )

        return record
```

### 成本仪表盘查询

```promql
# 每日总成本
sum(increase(llm_cost_dollars_total[24h]))

# 按租户的每日成本
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# 模型成本占比
sum(increase(llm_cost_dollars_total[24h])) by (model)
/ ignoring(model) group_left
sum(increase(llm_cost_dollars_total[24h]))

# 预算使用率（月度）
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id)
/ on(tenant_id) group_left
tenant_monthly_budget_usd
```

:::tip 成本优化建议

1. **模型选择优化**：简单任务使用更经济的模型（GPT-3.5、Claude Haiku）
2. **提示词优化**：去除不必要的上下文以减少输入 Token
3. **缓存**：为重复查询缓存响应
4. **批处理**：尽可能批量处理请求以减少开销
:::


## 总结

AI Agent 监控对于 Agentic AI 应用的稳定运行和持续改进至关重要。以下是本文档涵盖的关键主题摘要：

### 核心要点

1. **LangFuse 部署**：在 Kubernetes 中部署自托管 LangFuse，确保数据主权并优化成本
2. **LangSmith 集成**：为基于 LangChain 的应用轻松启用追踪
3. **核心指标**：通过延迟、Token 用量、错误率和 Trace 分析实现全面监控
4. **Grafana 仪表盘**：实时监控和告警，实现主动运维
5. **成本追踪**：基于模型和租户的成本分析，用于预算管理和优化
6. **故障排查**：GPU OOM、网络延迟、模型加载失败等常见问题的解决

### 监控成熟度模型

<MaturityModelTable />

:::tip 后续步骤

- [Agentic AI 平台架构](./agentic-platform-architecture.md) - 整体平台设计
- [Kagent Kubernetes Agent 管理](./kagent-kubernetes-agents.md) - Agent 部署与运维
- [RAG 评估框架](./ragas-evaluation.md) - 使用 Ragas 进行质量评估
:::

## 参考资料

- [LangFuse 文档](https://langfuse.com/docs)
- [LangFuse GitHub 仓库](https://github.com/langfuse/langfuse)
- [LangSmith 文档](https://docs.smith.langchain.com/)
- [OpenTelemetry 文档](https://opentelemetry.io/docs/)
- [Prometheus 监控](https://prometheus.io/docs/)
- [Grafana 仪表盘](https://grafana.com/docs/grafana/latest/dashboards/)
- [LangChain 回调](https://python.langchain.com/docs/modules/callbacks/)
