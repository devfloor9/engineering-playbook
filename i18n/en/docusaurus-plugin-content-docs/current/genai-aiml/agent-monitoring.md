---
title: "AI Agent Monitoring (LangFuse & LangSmith)"
sidebar_label: "Agent Monitoring"
description: "Guide to monitoring and tracing Agentic AI applications using LangFuse and LangSmith"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry]
category: "genai-aiml"
date: 2025-02-05
authors: [devfloor9]
sidebar_position: 8
---

# AI Agent Monitoring (LangFuse & LangSmith)

> **Written**: 2025-02-05 | **Reading time**: ~15 min

This document covers methods for effectively tracking and monitoring the performance and behavior of Agentic AI applications using LangFuse and LangSmith. We provide a comprehensive guide for practical operations, from deployment in Kubernetes environments to configuring Grafana dashboards.

## Overview

Agentic AI applications perform complex reasoning chains and diverse tool invocations, making it difficult to achieve sufficient visibility with traditional APM (Application Performance Monitoring) tools alone. LangFuse and LangSmith, LLM-specialized observability tools, provide the following key capabilities:

- **Trace tracking**: Track complete flows of LLM calls, tool executions, and agent inference processes
- **Token usage analysis**: Calculate input/output token counts and costs
- **Quality assessment**: Score response quality and collect feedback
- **Debugging**: Diagnose issues by reviewing prompts and responses

:::info Target Audience
This document targets platform operators, MLOps engineers, and AI developers. Basic understanding of Kubernetes and Python is required.
:::

## LangFuse vs LangSmith Comparison

| Feature | LangFuse | LangSmith |
| ---- | -------- | --------- |
| **License** | Open source (MIT) | Commercial (free tier) |
| **Deployment** | Self-hosted / Cloud | Cloud only |
| **Data Sovereignty** | Full control | LangChain servers |
| **Integration** | Multiple frameworks | LangChain optimized |
| **Cost** | Infrastructure only | Usage-based pricing |
| **Scalability** | Kubernetes native | Managed |

:::tip Selection Guide
- **LangFuse**: When data sovereignty is critical or cost optimization is needed
- **LangSmith**: When development is primarily LangChain-based and quick start is needed
:::


## LangFuse Kubernetes Deployment

### Architecture Overview

LangFuse consists of the following components:

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

### PostgreSQL Deployment

Deploy PostgreSQL for LangFuse metadata storage.

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
  POSTGRES_PASSWORD: "your-secure-password-here"  # Use Secrets Manager in production
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


### LangFuse Deployment

Deploy the LangFuse application.

```yaml
# langfuse-deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-secret
  namespace: observability
type: Opaque
stringData:
  # Required environment variables
  DATABASE_URL: "postgresql://langfuse:your-secure-password-here@langfuse-postgres:5432/langfuse"
  NEXTAUTH_SECRET: "your-nextauth-secret-32-chars-min"  # openssl rand -base64 32
  SALT: "your-salt-value-here"  # openssl rand -base64 32
  ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000"  # 64 hex chars

  # Optional environment variables
  NEXTAUTH_URL: "https://langfuse.your-domain.com"
  LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: "true"

  # S3 configuration (optional)
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


### Ingress Configuration

Configure Ingress for external access.

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

### HPA Configuration

Configure auto-scaling based on traffic.

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

:::warning Production Deployment Notes
- Always set `NEXTAUTH_SECRET`, `SALT`, and `ENCRYPTION_KEY` to secure random values
- In production, use AWS Secrets Manager or HashiCorp Vault for secret management
- For PostgreSQL, using RDS is recommended (high availability, automatic backups)
:::


## LangSmith Integration

LangSmith is a managed observability platform provided by LangChain. While it lacks a self-hosted option, integration with LangChain-based applications is very straightforward.

### Environment Configuration

Set environment variables for LangSmith usage.

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

### LangChain Agent Integration

Python code example for integrating LangSmith with LangChain agents.

```python
# agent_with_langsmith.py
import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree

# Environment variables (injected from Kubernetes Secret)
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
# LANGCHAIN_API_KEY=ls__xxx
# LANGCHAIN_PROJECT=agentic-ai-production

# Define custom tools
@tool
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information."""
    # Milvus search logic
    return f"Search results: Information about {query}..."

@tool
def create_support_ticket(title: str, description: str, priority: str = "medium") -> str:
    """Create a customer support ticket."""
    # Ticket creation logic
    return f"Ticket created: {title} (Priority: {priority})"

# Agent configuration
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

# Wrap as traceable function
@traceable(
    name="customer_support_agent",
    run_type="chain",
    tags=["production", "customer-support"],
)
def run_agent(user_input: str, chat_history: list = None, metadata: dict = None):
    """Execute agent and record trace to LangSmith."""
    if chat_history is None:
        chat_history = []

    # Add metadata to current run tree
    run_tree = get_current_run_tree()
    if run_tree and metadata:
        run_tree.extra["metadata"] = metadata

    result = agent_executor.invoke({
        "input": user_input,
        "chat_history": chat_history,
    })

    return result

# Usage example
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


### LangFuse Python Integration

How to integrate LangFuse into Python applications.

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

# Initialize LangFuse client
langfuse = Langfuse(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST", "https://langfuse.your-domain.com"),
)

# LangChain callback handler
langfuse_handler = LangfuseCallbackHandler(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST"),
)

# Agent configuration
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
    """Agent execution with LangFuse tracing."""

    # Add metadata to trace
    langfuse_context.update_current_trace(
        user_id=user_id,
        session_id=session_id,
        metadata={
            "tenant_id": tenant_id,
            "environment": os.environ.get("ENVIRONMENT", "production"),
        },
        tags=["customer-support", "production"],
    )

    # Execute agent
    result = agent_executor.invoke(
        {"input": user_input, "chat_history": []},
        config={"callbacks": [langfuse_handler]},
    )

    # Record output tokens and cost
    langfuse_context.update_current_observation(
        output=result["output"],
        metadata={
            "intermediate_steps": len(result.get("intermediate_steps", [])),
        },
    )

    return result

@observe(name="vector_search", as_type="span")
def search_with_tracing(query: str, collection: str, top_k: int = 5):
    """Perform vector search with tracing."""
    from pymilvus import Collection

    langfuse_context.update_current_observation(
        input={"query": query, "collection": collection, "top_k": top_k},
    )

    # Perform Milvus search
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

# Record score and feedback
def record_feedback(trace_id: str, score: float, comment: str = None):
    """Record user feedback to LangFuse."""
    langfuse.score(
        trace_id=trace_id,
        name="user_feedback",
        value=score,
        comment=comment,
    )

# Usage example
if __name__ == "__main__":
    response = run_agent_with_langfuse(
        user_input="Please tell me about the product return process",
        user_id="user_123",
        session_id="session_456",
        tenant_id="tenant_abc",
    )

    # Record feedback (e.g., user satisfied with response)
    trace_id = langfuse_context.get_current_trace_id()
    record_feedback(trace_id, score=1.0, comment="Accurate answer")

    # Flush to send all events
    langfuse.flush()
```


## Core Monitoring Metrics

Define key metrics to track for Agentic AI applications.

### Metric Categories

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

### Latency Metrics

| Metric | Description | Target | Alert Threshold |
| ------ | ---- | ------ | ----------- |
| `agent_request_duration_seconds` | Total request processing time | P95 < 5s | P99 > 10s |
| `llm_inference_duration_seconds` | LLM inference time | P95 < 3s | P99 > 8s |
| `tool_execution_duration_seconds` | Tool execution time | P95 < 1s | P99 > 3s |
| `vector_search_duration_seconds` | Vector search time | P95 < 200ms | P99 > 500ms |

### Token Usage Metrics

| Metric | Description | Monitoring Purpose |
| ------ | ---- | ------------- |
| `llm_input_tokens_total` | Total input tokens | Prompt optimization |
| `llm_output_tokens_total` | Total output tokens | Response length analysis |
| `llm_total_tokens_total` | Total tokens | Cost tracking |
| `llm_cost_dollars_total` | Estimated cost (USD) | Budget management |

### Error Rate Metrics

| Metric | Description | Alert Threshold |
| ------ | ---- | ----------- |
| `agent_errors_total` | Total agent errors | Error rate > 5% |
| `llm_rate_limit_errors_total` | Rate limit errors | > 10 per minute |
| `tool_execution_errors_total` | Tool execution errors | Error rate > 10% |
| `agent_timeout_total` | Timeout occurrences | > 5 per minute |

### Prometheus Metrics Collection Configuration

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


### Python Metrics Exporter

Code for exposing Prometheus metrics from agent applications.

```python
# metrics_exporter.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define metrics
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

# Model pricing (USD per 1K tokens)
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
    """Record LLM usage metrics."""
    # Record token counts
    LLM_TOKENS.labels(model=model, token_type="input", tenant_id=tenant_id).inc(input_tokens)
    LLM_TOKENS.labels(model=model, token_type="output", tenant_id=tenant_id).inc(output_tokens)

    # Calculate and record cost
    if model in MODEL_COSTS:
        cost = (
            (input_tokens / 1000) * MODEL_COSTS[model]["input"] +
            (output_tokens / 1000) * MODEL_COSTS[model]["output"]
        )
        LLM_COST.labels(model=model, tenant_id=tenant_id).inc(cost)

    # Record inference time
    LLM_INFERENCE_DURATION.labels(model=model, provider="openai").observe(duration)

def record_agent_request(
    agent_name: str,
    model: str,
    tenant_id: str,
    duration: float,
    success: bool,
    error_type: str = None,
):
    """Record agent request metrics."""
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

# Start metrics server
def start_metrics_server(port: int = 8000):
    """Start Prometheus metrics server."""
    start_http_server(port)
    print(f"Metrics server started on port {port}")
```


## Grafana Dashboard

### Dashboard Overview

Configure a Grafana dashboard for AI Agent monitoring.

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

### Dashboard JSON Configuration

```json
{
  "dashboard": {
    "id": null,
    "uid": "ai-agent-monitoring",
    "title": "AI Agent Monitoring",
    "tags": ["ai", "agent", "langfuse", "llm"],
    "timezone": "browser",
    "schemaVersion": 38,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Total Requests",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "sum(increase(agent_request_duration_seconds_count[24h]))",
            "legendFormat": "Total"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Success Rate",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
        "targets": [
          {
            "expr": "1 - (sum(rate(agent_errors_total[5m])) / sum(rate(agent_request_duration_seconds_count[5m])))",
            "legendFormat": "Success Rate"
          }
        ],
        "options": {
          "showThresholdLabels": false,
          "showThresholdMarkers": true
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0,
            "max": 1,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 0.9},
                {"color": "green", "value": 0.95}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "P95 Latency",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 5},
                {"color": "red", "value": 10}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Active Sessions",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 0},
        "targets": [
          {
            "expr": "sum(agent_active_sessions)",
            "legendFormat": "Active"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null}
              ]
            }
          }
        }
      },
      {
        "id": 5,
        "title": "Request Latency Distribution",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4},
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "id": 6,
        "title": "Error Rate by Type",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
        "targets": [
          {
            "expr": "sum(rate(agent_errors_total[5m])) by (error_type)",
            "legendFormat": "{{error_type}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "custom": {
              "drawStyle": "bars",
              "fillOpacity": 80
            }
          }
        }
      },
      {
        "id": 7,
        "title": "Token Usage by Model",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 12},
        "targets": [
          {
            "expr": "sum(rate(llm_tokens_total[1h])) by (model)",
            "legendFormat": "{{model}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "custom": {
              "drawStyle": "line",
              "fillOpacity": 20,
              "stacking": {"mode": "normal"}
            }
          }
        }
      },
      {
        "id": 8,
        "title": "Cost by Tenant (Daily)",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 12},
        "targets": [
          {
            "expr": "sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)",
            "legendFormat": "{{tenant_id}}"
          }
        ],
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "right",
            "values": ["value", "percent"]
          },
          "pieType": "donut"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD"
          }
        }
      }
    ]
  }
}
```


### Alert Configuration

Set up Grafana alert rules to detect anomalies.

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
              summary: "Agent {{ $labels.agent_name }} P99 latency is above 10s"
              description: "Current P99 latency: {{ $values.A }}s"
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
              summary: "Agent {{ $labels.agent_name }} error rate is above 5%"
              description: "Current error rate: {{ printf \"%.2f\" $values.A }}%"
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
              summary: "LLM {{ $labels.model }} rate limit errors detected"
              description: "{{ $values.A }} rate limit errors in last 5 minutes"
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
                        params: [100]  # $100 daily budget
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
              summary: "Tenant {{ $labels.tenant_id }} exceeded daily cost budget"
              description: "Current daily cost: ${{ printf \"%.2f\" $values.A }}"
            labels:
              severity: warning
```


## Cost Tracking

### Cost Analysis by Model

Track and analyze LLM usage costs by model.

```python
# cost_tracker.py
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

@dataclass
class ModelPricing:
    """Model pricing information (USD per 1K tokens)"""
    input_price: float
    output_price: float

# Model pricing as of 2024
MODEL_PRICING: Dict[str, ModelPricing] = {
    # OpenAI
    "gpt-4-turbo": ModelPricing(0.01, 0.03),
    "gpt-4-turbo-preview": ModelPricing(0.01, 0.03),
    "gpt-4": ModelPricing(0.03, 0.06),
    "gpt-4-32k": ModelPricing(0.06, 0.12),
    "gpt-3.5-turbo": ModelPricing(0.0005, 0.0015),
    "gpt-3.5-turbo-16k": ModelPricing(0.003, 0.004),

    # Anthropic
    "claude-3-opus": ModelPricing(0.015, 0.075),
    "claude-3-sonnet": ModelPricing(0.003, 0.015),
    "claude-3-haiku": ModelPricing(0.00025, 0.00125),
    "claude-2.1": ModelPricing(0.008, 0.024),

    # Amazon Bedrock (Claude)
    "anthropic.claude-3-opus-20240229-v1:0": ModelPricing(0.015, 0.075),
    "anthropic.claude-3-sonnet-20240229-v1:0": ModelPricing(0.003, 0.015),
    "anthropic.claude-3-haiku-20240307-v1:0": ModelPricing(0.00025, 0.00125),

    # Self-hosted (e.g., vLLM) - estimated based on infrastructure
    "llama-3-70b": ModelPricing(0.001, 0.001),
    "mixtral-8x7b": ModelPricing(0.0005, 0.0005),
}

@dataclass
class UsageRecord:
    """Usage record"""
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
    """Cost tracker"""

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
        """Record usage."""
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

        # Update Prometheus metrics
        from metrics_exporter import record_llm_usage
        record_llm_usage(
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tenant_id=tenant_id,
            duration=0,  # Needs separate measurement
        )

        return record

    def get_cost_by_tenant(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, float]:
        """Aggregate cost by tenant."""
        if start_time is None:
            start_time = datetime.utcnow() - timedelta(days=30)
        if end_time is None:
            end_time = datetime.utcnow()

        costs: Dict[str, float] = {}
        for record in self.records:
            if start_time <= record.timestamp <= end_time:
                if record.tenant_id not in costs:
                    costs[record.tenant_id] = 0.0
                costs[record.tenant_id] += record.cost

        return costs

    def get_cost_by_model(
        self,
        tenant_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Dict[str, float]]:
        """Aggregate cost and token usage by model."""
        if start_time is None:
            start_time = datetime.utcnow() - timedelta(days=30)
        if end_time is None:
            end_time = datetime.utcnow()

        result: Dict[str, Dict[str, float]] = {}
        for record in self.records:
            if start_time <= record.timestamp <= end_time:
                if tenant_id and record.tenant_id != tenant_id:
                    continue

                if record.model not in result:
                    result[record.model] = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "cost": 0.0,
                        "requests": 0,
                    }

                result[record.model]["input_tokens"] += record.input_tokens
                result[record.model]["output_tokens"] += record.output_tokens
                result[record.model]["total_tokens"] += record.total_tokens
                result[record.model]["cost"] += record.cost
                result[record.model]["requests"] += 1

        return result

    def generate_cost_report(
        self,
        tenant_id: Optional[str] = None,
        period_days: int = 30,
    ) -> str:
        """Generate cost report."""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=period_days)

        model_costs = self.get_cost_by_model(tenant_id, start_time, end_time)
        tenant_costs = self.get_cost_by_tenant(start_time, end_time)

        report = {
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "days": period_days,
            },
            "summary": {
                "total_cost": sum(tenant_costs.values()),
                "total_requests": sum(m["requests"] for m in model_costs.values()),
                "total_tokens": sum(m["total_tokens"] for m in model_costs.values()),
            },
            "by_model": model_costs,
            "by_tenant": tenant_costs,
        }

        return json.dumps(report, indent=2, default=str)
```


### Cost Allocation by Tenant

How to fairly allocate costs in multi-tenant environments.

```yaml
# cost-allocation-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cost-allocation-config
  namespace: observability
data:
  allocation-rules.yaml: |
    # Tenant budget configuration
    tenants:
      tenant-a:
        monthly_budget_usd: 5000
        alert_threshold_percent: 80
        models_allowed:
          - gpt-4-turbo
          - gpt-3.5-turbo
          - claude-3-sonnet
        rate_limits:
          requests_per_minute: 100
          tokens_per_day: 1000000

      tenant-b:
        monthly_budget_usd: 2000
        alert_threshold_percent: 80
        models_allowed:
          - gpt-3.5-turbo
          - claude-3-haiku
        rate_limits:
          requests_per_minute: 50
          tokens_per_day: 500000

      tenant-c:
        monthly_budget_usd: 10000
        alert_threshold_percent: 90
        models_allowed:
          - gpt-4-turbo
          - gpt-4
          - claude-3-opus
          - claude-3-sonnet
        rate_limits:
          requests_per_minute: 200
          tokens_per_day: 5000000

    # Infrastructure cost allocation
    infrastructure_cost_allocation:
      method: proportional  # proportional, equal, fixed
      base_monthly_cost_usd: 1000  # GPU infrastructure base cost

    # Alert configuration
    alerts:
      budget_warning:
        threshold_percent: 80
        channels: [slack, email]
      budget_exceeded:
        threshold_percent: 100
        channels: [slack, email, pagerduty]
      rate_limit_warning:
        threshold_percent: 90
        channels: [slack]
```

### Cost Dashboard Queries

Example PromQL queries for cost analysis in Grafana.

```promql
# Daily total cost
sum(increase(llm_cost_dollars_total[24h]))

# Daily cost by tenant
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# Model cost ratio
sum(increase(llm_cost_dollars_total[24h])) by (model)
/ ignoring(model) group_left
sum(increase(llm_cost_dollars_total[24h]))

# Cost trend per hour
sum(rate(llm_cost_dollars_total[1h])) * 3600

# Budget utilization (monthly)
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id)
/ on(tenant_id) group_left
tenant_monthly_budget_usd

# Average cost per token
sum(rate(llm_cost_dollars_total[1h]))
/ sum(rate(llm_tokens_total[1h]))

# Average cost per request
sum(increase(llm_cost_dollars_total[24h]))
/ sum(increase(agent_request_duration_seconds_count[24h]))
```

:::tip Cost Optimization Tips
1. **Model Selection Optimization**: Use cheaper models (GPT-3.5, Claude Haiku) for simple tasks
2. **Prompt Optimization**: Remove unnecessary context to reduce input tokens
3. **Caching**: Cache responses for repeated queries
4. **Batch Processing**: Process requests in batches when possible to reduce overhead
:::


## OpenTelemetry Integration

Integrate LangFuse with existing observability stacks using OpenTelemetry.

### OpenTelemetry Collector Configuration

```yaml
# otel-collector-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: observability
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

      prometheus:
        config:
          scrape_configs:
            - job_name: 'langfuse'
              static_configs:
                - targets: ['langfuse:3000']
              metrics_path: /api/public/metrics

    processors:
      batch:
        timeout: 10s
        send_batch_size: 1000

      memory_limiter:
        check_interval: 1s
        limit_mib: 1000
        spike_limit_mib: 200

      attributes:
        actions:
          - key: environment
            value: production
            action: upsert
          - key: service.namespace
            value: ai-platform
            action: upsert

    exporters:
      prometheus:
        endpoint: "0.0.0.0:8889"
        namespace: ai_agent

      otlp/jaeger:
        endpoint: jaeger-collector.observability:4317
        tls:
          insecure: true

      awsxray:
        region: ap-northeast-2

      logging:
        loglevel: info

    extensions:
      health_check:
        endpoint: 0.0.0.0:13133
      pprof:
        endpoint: 0.0.0.0:1777

    service:
      extensions: [health_check, pprof]
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch, attributes]
          exporters: [otlp/jaeger, awsxray, logging]

        metrics:
          receivers: [otlp, prometheus]
          processors: [memory_limiter, batch]
          exporters: [prometheus]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: observability
spec:
  replicas: 2
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.92.0
          args:
            - --config=/etc/otel/config.yaml
          ports:
            - containerPort: 4317  # OTLP gRPC
            - containerPort: 4318  # OTLP HTTP
            - containerPort: 8889  # Prometheus exporter
            - containerPort: 13133 # Health check
          volumeMounts:
            - name: config
              mountPath: /etc/otel
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    app: otel-collector
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
    - name: prometheus
      port: 8889
      targetPort: 8889
```

### Python OpenTelemetry Integration

```python
# otel_integration.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
import os

def setup_opentelemetry():
    """Initialize OpenTelemetry."""
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: "ai-agent",
        ResourceAttributes.SERVICE_VERSION: "1.0.0",
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.environ.get("ENVIRONMENT", "production"),
    })

    provider = TracerProvider(resource=resource)

    # OTLP Exporter configuration
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "otel-collector:4317"),
        insecure=True,
    )

    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(provider)

    # Auto-instrument HTTP requests
    RequestsInstrumentor().instrument()

    return trace.get_tracer(__name__)

# Usage example
tracer = setup_opentelemetry()

@tracer.start_as_current_span("agent_execution")
def execute_agent(user_input: str, tenant_id: str):
    """Execute agent with OpenTelemetry tracing."""
    current_span = trace.get_current_span()
    current_span.set_attribute("tenant_id", tenant_id)
    current_span.set_attribute("input_length", len(user_input))

    # Execute agent logic
    with tracer.start_as_current_span("llm_inference") as llm_span:
        llm_span.set_attribute("model", "gpt-4-turbo")
        # LLM call
        response = call_llm(user_input)
        llm_span.set_attribute("output_tokens", response.usage.completion_tokens)

    return response
```


## Troubleshooting

### Common Issues and Solutions

#### LangFuse Connection Error

```bash
# Symptom: Traces not recorded in LangFuse

# 1. Check LangFuse service status
kubectl get pods -n observability -l app=langfuse

# 2. Check LangFuse logs
kubectl logs -n observability -l app=langfuse --tail=100

# 3. Test network connection
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://langfuse.observability.svc/api/public/health

# 4. Verify environment variables
kubectl exec -n ai-agents <pod-name> -- env | grep LANGFUSE
```

#### High Latency Debugging

```python
# trace_analyzer.py
from langfuse import Langfuse
from datetime import datetime, timedelta

langfuse = Langfuse()

def analyze_slow_traces(threshold_seconds: float = 10.0, hours: int = 24):
    """Analyze slow traces."""
    traces = langfuse.get_traces(
        limit=100,
        order_by="latency",
        order="desc",
    )

    slow_traces = []
    for trace in traces.data:
        if trace.latency and trace.latency > threshold_seconds:
            # Analyze latency per span
            observations = langfuse.get_observations(trace_id=trace.id)

            breakdown = []
            for obs in observations.data:
                if obs.end_time and obs.start_time:
                    duration = (obs.end_time - obs.start_time).total_seconds()
                    breakdown.append({
                        "name": obs.name,
                        "type": obs.type,
                        "duration": duration,
                    })

            slow_traces.append({
                "trace_id": trace.id,
                "total_latency": trace.latency,
                "breakdown": sorted(breakdown, key=lambda x: x["duration"], reverse=True),
            })

    return slow_traces

# Run analysis
slow = analyze_slow_traces(threshold_seconds=10.0)
for trace in slow[:5]:
    print(f"\nTrace: {trace['trace_id']}")
    print(f"Total Latency: {trace['total_latency']:.2f}s")
    print("Breakdown:")
    for item in trace['breakdown'][:5]:
        print(f"  - {item['name']}: {item['duration']:.2f}s ({item['type']})")
```

#### Memory Leak Diagnosis

```yaml
# memory-debug-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: memory-debug
  namespace: observability
spec:
  containers:
    - name: debug
      image: python:3.11-slim
      command: ["sleep", "infinity"]
      resources:
        requests:
          memory: "256Mi"
        limits:
          memory: "512Mi"
      env:
        - name: LANGFUSE_HOST
          value: "http://langfuse.observability.svc"
```

```python
# memory_profiler.py
import tracemalloc
import gc
from langfuse import Langfuse

def profile_langfuse_memory():
    """Profile LangFuse client memory usage."""
    tracemalloc.start()

    langfuse = Langfuse()

    # Create multiple traces
    for i in range(100):
        trace = langfuse.trace(name=f"test-trace-{i}")
        trace.generation(
            name="test-generation",
            input="test input",
            output="test output",
        )

    langfuse.flush()

    # Memory snapshot
    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')

    print("Top 10 memory allocations:")
    for stat in top_stats[:10]:
        print(stat)

    # Garbage collection
    gc.collect()

    tracemalloc.stop()
```

### Performance Optimization Checklist

| Item | Check | Recommended |
| ---- | --------- | --------- |
| **Batch Size** | Trace batch send size | 100-500 |
| **Flush Interval** | Auto flush period | 5-10 seconds |
| **Connection Pool** | HTTP connection reuse | Enabled |
| **Async Transmission** | Background transmission | Enabled |
| **Sampling** | High-traffic sampling | 10-50% |

:::danger Caution
- Storing all traces in production can increase storage costs dramatically
- Apply masking to sensitive data (PII) to prevent exposure in traces
- Set up regular backups and retention policies for LangFuse database
:::


## Conclusion

AI Agent monitoring is essential for stable operation and continuous improvement of Agentic AI applications. Summary of key topics covered in this document:

### Key Summary

1. **LangFuse Deployment**: Deploy self-hosted LangFuse in Kubernetes to secure data sovereignty and optimize costs
2. **LangSmith Integration**: Easily enable tracing for LangChain-based applications
3. **Core Metrics**: Comprehensive monitoring through latency, token usage, error rate, and trace analysis
4. **Grafana Dashboard**: Real-time monitoring and alerting for proactive operations
5. **Cost Tracking**: Model and tenant-based cost analysis for budget management and optimization

### Monitoring Maturity Model

| Level | Maturity | Implementation |
| ---- | ---- | --------- |
| **Level 1** | Basic | Log collection, basic metrics |
| **Level 2** | Standard | LangFuse/LangSmith tracing, Grafana dashboard |
| **Level 3** | Advanced | Cost tracking, quality assessment, automated alerts |
| **Level 4** | Optimized | A/B testing, auto-tuning, predictive analytics |

:::tip Next Steps
- [Agentic AI Platform Architecture](./agentic-platform-architecture.md) - Overall platform design
- [Kagent Kubernetes Agent Management](./kagent-kubernetes-agents.md) - Agent deployment and operations
- [RAG Evaluation Framework](./ragas-evaluation.md) - Quality assessment using Ragas
:::

## References

- [LangFuse Documentation](https://langfuse.com/docs)
- [LangFuse GitHub Repository](https://github.com/langfuse/langfuse)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [LangChain Callbacks](https://python.langchain.com/docs/modules/callbacks/)
