---
title: "AI Agent Monitoring and Operations"
sidebar_label: "Agent Monitoring & Operations"
description: "Comprehensive guide for monitoring, alerting, and troubleshooting Agentic AI applications using LangFuse and LangSmith"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry, operations, troubleshooting, alerting]
category: "genai-aiml"
date: 2025-02-05
authors: [devfloor9]
sidebar_position: 8
---

# AI Agent Monitoring and Operations

> **Written**: 2025-02-05 | **Reading time**: ~20 min

This document covers comprehensive methods for effectively tracking and monitoring the performance and behavior of Agentic AI applications using LangFuse and LangSmith. We provide a complete operational guide from deployment in Kubernetes environments to Grafana dashboard configuration, alert setup, and troubleshooting.

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


## Grafana Dashboard and Alerting

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

### Grafana Alert Rules

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


## Operations Checklist

### Daily Checks

| Check Item | How to Check | Normal Status |
| --- | --- | --- |
| GPU Status | `kubectl get nodes -l nvidia.com/gpu.present=true` | All nodes Ready |
| Model Pods | `kubectl get pods -n inference` | Running state |
| Error Rate | Grafana dashboard | < 1% |
| Response Time | P99 latency | < 5 seconds |
| GPU Utilization | DCGM metrics | 40-80% |
| Memory Usage | GPU memory | < 90% |

### Weekly Checks

| Check Item | How to Check | Action |
| --- | --- | --- |
| Cost Analysis | Kubecost report | Identify anomalous costs |
| Capacity Planning | Resource trends | Plan scaling |
| Security Patches | Image scan | Patch vulnerabilities |
| Backup Validation | Recovery test | Verify backup policy |


## Troubleshooting Guide

### GPU OOM (Out of Memory) Issue

#### Symptoms

```
CUDA out of memory. Tried to allocate X GiB
RuntimeError: CUDA error: out of memory
```

#### Diagnosis

```bash
# Check GPU memory status
kubectl exec -it <pod-name> -n inference -- nvidia-smi

# Check DCGM metrics
kubectl exec -it <dcgm-exporter-pod> -n monitoring -- dcgmi dmon -e 155,156
```

#### Solutions

```yaml
# 1. Reduce batch size
env:
- name: MAX_BATCH_SIZE
  value: "16"  # Decreased from 32

# 2. Apply model quantization
env:
- name: QUANTIZATION
  value: "int8"  # or "fp8"

# 3. Limit KV cache size
env:
- name: MAX_NUM_SEQS
  value: "128"  # Limit concurrent sequences
```

### Network Latency Issues

#### Symptoms

- Inference request timeouts
- Latency between models
- NCCL timeouts (distributed inference)

#### Solutions

```yaml
# 1. Pod anti-affinity for distributed deployment
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels:
            app: inference
        topologyKey: "topology.kubernetes.io/zone"

# 2. Increase timeout
env:
- name: NCCL_TIMEOUT
  value: "1800"  # 30 minutes
- name: REQUEST_TIMEOUT
  value: "300"   # 5 minutes
```

### LangFuse Connection Error

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
    "gpt-4": ModelPricing(0.03, 0.06),
    "gpt-3.5-turbo": ModelPricing(0.0005, 0.0015),

    # Anthropic
    "claude-3-opus": ModelPricing(0.015, 0.075),
    "claude-3-sonnet": ModelPricing(0.003, 0.015),
    "claude-3-haiku": ModelPricing(0.00025, 0.00125),
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
```

### Cost Dashboard Queries

```promql
# Daily total cost
sum(increase(llm_cost_dollars_total[24h]))

# Daily cost by tenant
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# Model cost ratio
sum(increase(llm_cost_dollars_total[24h])) by (model)
/ ignoring(model) group_left
sum(increase(llm_cost_dollars_total[24h]))

# Budget utilization (monthly)
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id)
/ on(tenant_id) group_left
tenant_monthly_budget_usd
```

:::tip Cost Optimization Tips

1. **Model Selection Optimization**: Use cheaper models (GPT-3.5, Claude Haiku) for simple tasks
2. **Prompt Optimization**: Remove unnecessary context to reduce input tokens
3. **Caching**: Cache responses for repeated queries
4. **Batch Processing**: Process requests in batches when possible to reduce overhead
:::


## Conclusion

AI Agent monitoring is essential for stable operation and continuous improvement of Agentic AI applications. Summary of key topics covered in this document:

### Key Summary

1. **LangFuse Deployment**: Deploy self-hosted LangFuse in Kubernetes to secure data sovereignty and optimize costs
2. **LangSmith Integration**: Easily enable tracing for LangChain-based applications
3. **Core Metrics**: Comprehensive monitoring through latency, token usage, error rate, and trace analysis
4. **Grafana Dashboard**: Real-time monitoring and alerting for proactive operations
5. **Cost Tracking**: Model and tenant-based cost analysis for budget management and optimization
6. **Troubleshooting**: Common problem resolution for GPU OOM, network latency, model loading failures

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
