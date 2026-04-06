---
title: "AI Agent Monitoring and Operations"
sidebar_label: "Agent Monitoring & Operations"
description: "Agentic AI application monitoring architecture, key metric design, and alerting strategy overview"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry, operations, alerting]
category: "genai-aiml"
last_update:
  date: 2026-04-05
  author: devfloor9
sidebar_position: 1
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

# AI Agent Monitoring and Operations

This document covers the monitoring architecture, key metric design, and alerting strategy for Agentic AI applications at a conceptual level.

:::info Production Deployment Guide
For Langfuse Helm deployment, AMP/AMG configuration, ServiceMonitor YAML, and Grafana dashboard JSON, see the [Monitoring Stack Setup Guide](../reference-architecture/monitoring-observability-setup.md).
:::

## Overview

Agentic AI applications perform complex reasoning chains and various tool calls, making it difficult to achieve sufficient visibility with traditional APM (Application Performance Monitoring) tools alone. LLM-specialized observability tools like Langfuse and LangSmith provide the following core capabilities:

- **Trace tracking**: Full flow tracking of LLM calls, tool execution, and agent reasoning processes
- **Token usage analysis**: Input/output token counts and cost calculation
- **Quality evaluation**: Response quality scoring and feedback collection
- **Debugging**: Problem diagnosis through prompt and response content review

:::info Target Audience
This document is intended for platform operators, MLOps engineers, and AI developers. Basic understanding of Kubernetes and Python is required.
:::

---

## Monitoring Architecture

### Langfuse Architecture Overview

Langfuse v2.75.0+ consists of the following components:

```mermaid
flowchart TB
    subgraph Clients["AI Applications"]
        AGENT1[Agent 1]
        AGENT2[Agent 2]
        AGENTN[Agent N]
    end

    subgraph Langfuse["Langfuse Stack"]
        WEB[Web UI<br/>Next.js]
        API[API Server<br/>tRPC]
        WORKER[Background<br/>Worker]
    end

    subgraph Storage["Storage"]
        PG[(PostgreSQL<br/>Metadata)]
        REDIS[(Redis<br/>Cache/Queue)]
        S3[S3<br/>Blob]
    end

    AGENT1 -->|Traces| API
    AGENT2 -->|Traces| API
    AGENTN -->|Traces| API
    WEB -->|Query| API
    API --> PG
    API --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    WORKER -->|Artifacts| S3

    style Clients fill:#ffd93d
    style Langfuse fill:#4285f4
    style Storage fill:#326ce5
```

### AMP/AMG Integrated Data Flow

```mermaid
flowchart TB
    subgraph Sources["Metric Sources"]
        VLLM[vLLM<br/>:8000/metrics]
        DCGM[DCGM Exporter<br/>:9400/metrics]
        NODE[Node Exporter<br/>:9100/metrics]
        KGATEWAY[kgateway<br/>:9091/metrics]
    end
    
    subgraph Collector["Collector"]
        PROM[Prometheus<br/>ServiceMonitor]
    end
    
    subgraph AWS["AWS Managed Services"]
        AMP[Amazon Managed<br/>Prometheus]
        AMG[Amazon Managed<br/>Grafana]
    end
    
    VLLM --> PROM
    DCGM --> PROM
    NODE --> PROM
    KGATEWAY --> PROM
    
    PROM -->|Remote Write<br/>SigV4 Auth| AMP
    AMP -->|Query| AMG
    
    style VLLM fill:#ffd93d,stroke:#333
    style DCGM fill:#76b900,stroke:#333
    style NODE fill:#326ce5,stroke:#333
    style KGATEWAY fill:#326ce5,stroke:#333
    style PROM fill:#e53935,stroke:#333
    style AMP fill:#ff9900,stroke:#333
    style AMG fill:#ff9900,stroke:#333
```

### Monitoring Data Layers

| Layer | Collection Tool | Metric Pattern | Visible Items |
|-------|----------------|---------------|---------------|
| **LLM Inference** | Langfuse | trace, generation | Token usage, cost, TTFT, per-user patterns |
| **Model Server** | vLLM Prometheus | `vllm_*` | Request count, batch size, KV cache utilization, TPS |
| **GPU** | DCGM Exporter | `DCGM_FI_DEV_*` | GPU utilization, temperature, power, memory usage |
| **Infrastructure** | Node Exporter | `node_*` | CPU, memory, network, disk I/O |
| **Gateway** | kgateway | `envoy_*` | Request count, latency, error rate, upstream status |

---

## Langfuse vs LangSmith Comparison

<LangFuseVsLangSmithTable />

:::tip Selection Guide

- **Langfuse**: When data sovereignty is important or cost optimization is needed
- **LangSmith**: When LangChain-based development is the focus and quick start is needed
:::

### AWS Native Observability: CloudWatch Generative AI Observability

Amazon CloudWatch Generative AI Observability is an AWS-native solution for LLM and AI agent monitoring:

- **Infrastructure-agnostic monitoring**: Supports AI workloads across Bedrock, EKS, ECS, on-premises, and more
- **Agent/tool tracking**: Built-in views for agents, knowledge bases, and tool calls
- **End-to-end tracing**: Tracking across the entire AI stack
- **Framework compatibility**: Support for external frameworks like LangChain, LangGraph, CrewAI

Using Langfuse v2.75.0 (self-hosted data sovereignty) together with CloudWatch Gen AI Observability (AWS-native integration) provides the most comprehensive observability.

---

## Key Monitoring Metrics

Defines the key metrics to track in Agentic AI applications.

### Metric Categories

```mermaid
flowchart TB
    subgraph Latency["Latency Metrics"]
        E2E[E2E Latency]
        LLM_LAT[LLM Inference]
        TOOL_LAT[Tool Execution]
        RETRIEVAL_LAT[Retrieval Latency]
    end

    subgraph Tokens["Token Usage"]
        INPUT_TOK[Input Tokens]
        OUTPUT_TOK[Output Tokens]
        TOTAL_TOK[Total Tokens]
        COST[Cost USD]
    end

    subgraph Errors["Error Rate"]
        LLM_ERR[LLM Errors]
        TOOL_ERR[Tool Errors]
        TIMEOUT[Timeouts]
        RATE_LIMIT[Rate Limit]
    end

    subgraph Traces["Trace Analysis"]
        CHAIN_LEN[Chain Length]
        TOOL_CALLS[Tool Calls]
        ITERATIONS[Iterations]
        SUCCESS[Success Rate]
    end

    style Latency fill:#4285f4
    style Tokens fill:#34a853
    style Errors fill:#ea4335
    style Traces fill:#fbbc04
```

### Latency Metrics

<LatencyMetricsTable />

### Token Usage Metrics

<TokenUsageMetricsTable />

### Error Rate Metrics

<ErrorRateMetricsTable />

---

## PromQL Query Reference

### GPU Metrics

```promql
# Overall GPU average utilization
avg(DCGM_FI_DEV_GPU_UTIL)

# Per-node GPU utilization
avg(DCGM_FI_DEV_GPU_UTIL) by (Hostname)

# GPU memory utilization
avg(DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE * 100) by (gpu)
```

### vLLM Metrics

```promql
# Overall TPS (tokens generated per second)
rate(vllm_generation_tokens_total[5m])

# Per-model TPS
sum(rate(vllm_generation_tokens_total[5m])) by (model)

# TTFT P99 (Time to First Token)
histogram_quantile(0.99, rate(vllm_time_to_first_token_seconds_bucket[5m]))

# TTFT P95
histogram_quantile(0.95, rate(vllm_time_to_first_token_seconds_bucket[5m]))

# E2E Latency P99
histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m]))

# Average batch size
avg(vllm_num_requests_running)
```

### Gateway Metrics

```promql
# 5xx error rate (%)
rate(envoy_http_downstream_rq_xx{envoy_response_code_class="5"}[5m]) 
/ 
rate(envoy_http_downstream_rq_total[5m]) * 100

# Upstream health check failure rate
sum(rate(envoy_cluster_upstream_cx_connect_fail[5m])) by (envoy_cluster_name)
```

### Cost Metrics

```promql
# Daily total cost
sum(increase(llm_cost_dollars_total[24h]))

# Per-tenant daily cost
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# Per-model cost ratio
sum(increase(llm_cost_dollars_total[24h])) by (model)
/ ignoring(model) group_left
sum(increase(llm_cost_dollars_total[24h]))

# Budget utilization (monthly)
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id)
/ on(tenant_id) group_left
tenant_monthly_budget_usd
```

---

## Alerting Strategy

### Alert Threshold Design

| Alert | Condition | Severity | Duration |
|-------|----------|----------|----------|
| **Agent High Latency** | P99 latency > 10s | Warning | 5 min |
| **Agent High Error Rate** | Error rate > 5% | Critical | 5 min |
| **LLM Rate Limit** | Rate limit errors > 10/5min | Warning | 2 min |
| **Daily Cost Budget** | Daily cost > $100 | Warning | Immediate |
| **GPU High Temperature** | GPU temp > 85C | Warning | 5 min |
| **GPU Memory Full** | GPU memory > 95% | Critical | 3 min |
| **vLLM High Latency** | P99 E2E latency > 30s | Warning | 5 min |

### Alert Hierarchy

1. **Infrastructure layer**: GPU temperature, memory, power anomalies
2. **Model server layer**: vLLM latency increase, KV cache shortage
3. **Application layer**: Agent error rate, Rate limit
4. **Business layer**: Cost overrun, SLA violations

:::tip Monitoring Best Practices

1. **Cross-layer metric correlation**: Analyze correlations — LLM request increase -> GPU utilization rise -> infrastructure load increase
2. **Anomaly detection**: When P99 latency suddenly increases, simultaneously check GPU temperature and memory usage
3. **Capacity planning**: Consider provisioning additional GPU nodes when average GPU utilization exceeds 70%
4. **Cost optimization**: Prioritize models with lower TTFT to improve user experience + increase throughput
:::

---

## Cost Tracking

### Cost Tracking Concepts

Track LLM usage costs by the following criteria:

- **Per-model**: Total cost and request count per model, identifying the most expensive models
- **Per-tenant**: Per-tenant/team daily token usage and budget utilization
- **Per-time**: Peak time analysis, cost trends

### Per-Model Cost Reference (2026 baseline)

| Model | Input ($/1K tok) | Output ($/1K tok) |
|-------|-----------------|------------------|
| GPT-4o | $0.0025 | $0.01 |
| GPT-4o-mini | $0.00015 | $0.0006 |
| Claude Sonnet 4 | $0.003 | $0.015 |
| Claude 3.5 Haiku | $0.0008 | $0.004 |

:::tip Cost Optimization Tips

1. **Model selection optimization**: Use cheaper models (GPT-4o-mini, Claude 3.5 Haiku) for simple tasks
2. **Prompt optimization**: Reduce input tokens by removing unnecessary context
3. **Caching**: Cache responses for repetitive queries
4. **Cascade Routing**: Try low-cost model first, Fallback to high-performance model on failure
:::

---

## Operations Checklist

### Daily Checks

<DailyChecksTable />

### Weekly Checks

<WeeklyChecksTable />

---

## Monitoring Maturity Model

<MaturityModelTable />

---

## Next Steps

- [Monitoring Stack Setup Guide](../reference-architecture/monitoring-observability-setup.md) - AMP/AMG deployment, Langfuse Helm installation, ServiceMonitor, Grafana dashboard production setup
- [LLMOps Observability Comparison Guide](./llmops-observability.md) - In-depth comparison of Langfuse vs LangSmith vs Helicone
- [Agentic AI Platform Architecture](../design-architecture/agentic-platform-architecture.md) - Overall platform design
- [RAG Evaluation Framework](./ragas-evaluation.md) - Quality evaluation with Ragas

## References

- [Langfuse Documentation](https://langfuse.com/docs)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [CloudWatch Generative AI Observability](https://aws.amazon.com/blogs/mt/launching-amazon-cloudwatch-generative-ai-observability-preview/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
