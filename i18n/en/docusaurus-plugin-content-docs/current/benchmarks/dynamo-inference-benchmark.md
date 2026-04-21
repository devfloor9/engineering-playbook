---
title: "NVIDIA Dynamo Inference Benchmark"
sidebar_label: "Report 5. Dynamo Inference [New]"
sidebar_position: 5
description: "Benchmark comparing Aggregated vs Disaggregated LLM serving performance using NVIDIA Dynamo — Running AIPerf 4 modes in an EKS environment"
tags: [benchmark, nvidia, dynamo, vllm, inference, gpu, disaggregated-serving, eks, kv-cache, nixl]
category: "benchmark"
last_update:
  date: 2026-03-20
  author: devfloor9
---

# Report 5. NVIDIA Dynamo Inference Benchmark

> 📅 **Created**: 2026-03-20 | **Status**: New

## Overview

A benchmark comparing the performance of **Aggregated** and **Disaggregated** modes in NVIDIA Dynamo-based LLM serving. By running 4 measurement modes of the AIPerf benchmark tool in an EKS environment, this quantitatively validates what performance differences the KV Router + NIXL Transfer of Disaggregated Serving make in real workloads.

:::info Deployment Guide
For EKS deployment of this benchmark, see the [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack).
:::

## Test Environment

### EKS Cluster Specifications

| Item | Configuration |
|------|------|
| **EKS Version** | v1.32 (Auto Mode) |
| **GPU Nodes (Prefill)** | p4d.24xlarge x 2 (A100 80GB x 8/node) |
| **GPU Nodes (Decode)** | g6e.12xlarge x 4 (L40S 48GB x 4/node) |
| **Storage** | EFS (model store), gp3 (etcd/Prometheus) |
| **Network** | VPC CNI, EFA enabled (p4d nodes) |

### Software Stack

| Component | Version |
|----------|------|
| **NVIDIA Dynamo** | v0.9.1 |
| **vLLM Runtime** | v0.7.x |
| **GPU Operator** | v24.9.0 |
| **AIPerf** | v0.9.1 |
| **Prometheus + Grafana** | kube-prometheus-stack 65.x |

### Test Model

| Model | Parameters | Active Parameters | Precision | Architecture |
|------|---------|-------------|--------|---------|
| **Qwen3-30B-A3B-FP8** | 30B | 3B | FP8 | MoE |

Reasons for choosing an MoE (Mixture-of-Experts) model:
- Clearly compares the effects of Expert routing and KV cache strategies in Disaggregated Serving
- Maximized GPU memory efficiency with FP8 quantization
- Small active parameters (3B) enable use of L40S-class GPUs for Decode workers

---

## Architecture Comparison

### Aggregated Serving

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

A single worker handles both Prefill and Decode. Simple implementation but uneven GPU utilization.

### Disaggregated Serving

```
Client → KV Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ NIXL Transfer
              → Decode Worker (L40S × 2, TP=2)
                  └── KV Cache Offload: GPU → CPU → SSD
```

Separates Prefill and Decode to allocate GPUs optimized for each stage:

- **KV Router**: Cache-aware routing to maximize KV hit rate
- **NIXL Transfer**: GPU-to-GPU direct transfer to minimize KV cache migration latency
- **KV Cache Offloading**: 3-tier cache (GPU → CPU → SSD) to overcome memory limitations

---

## Benchmark Modes

The AIPerf benchmark tool provides 4 measurement modes:

### 1. Concurrency Sweep

Incrementally increases concurrent requests while measuring TTFT, TPS, and Throughput.

| Parameter | Value |
|---------|---|
| Concurrency | 1, 2, 4, 8, 16, 32, 64 |
| ISL (Input Seq Len) | 1024 |
| OSL (Output Seq Len) | 512 |
| Duration | 120s/step |

**Measured Metrics**: TTFT p50/p99, ITL p50/p99, Throughput (tokens/s), Request Latency

### 2. Multi-turn Conversation

Measures KV cache reuse effects in multi-turn conversation scenarios.

| Parameter | Value |
|---------|---|
| Conversation Turns | 5 |
| Concurrent Conversations | 8 |
| ISL/OSL | 512/256 |
| Duration | 300s |

**Measured Metrics**: Per-turn TTFT change, cache hit rate, total conversation response time

### 3. Sequence Distribution

Measures performance stability across various sequence length distributions.

| Parameter | Value |
|---------|---|
| Distribution Types | Uniform, Zipf, Lognormal |
| ISL Range | 128-4096 |
| OSL Range | 64-2048 |
| Concurrency | 16 |

**Measured Metrics**: TTFT/TPS variance by distribution, long sequence processing stability

### 4. Prefix Cache

Measures TTFT improvement effect as identical Prefix hit ratio changes.

| Parameter | Value |
|---------|---|
| Prefix Hit Ratio | 0%, 25%, 50%, 75%, 100% |
| ISL/OSL | 2048/512 |
| Concurrency | 16 |

**Measured Metrics**: TTFT reduction by hit ratio, cache memory usage, Eviction Rate

---

## Benchmark Results

:::note Data Collection Pending
Results data will be updated after benchmark execution.
:::

### Expected Result Structure

#### Concurrency Sweep Results

| Concurrency | Aggregated TTFT p50 | Disagg TTFT p50 | Aggregated TPS | Disagg TPS |
|--------|--------------------:|----------------:|---------------:|-----------:|
| 1 | - | - | - | - |
| 4 | - | - | - | - |
| 16 | - | - | - | - |
| 32 | - | - | - | - |
| 64 | - | - | - | - |

#### Prefix Cache Effect

| Hit Ratio | Aggregated TTFT | Disagg TTFT | Improvement |
|-----------|----------------:|------------:|-------:|
| 0% | - | - | - |
| 50% | - | - | - |
| 100% | - | - | - |

#### Cost Efficiency

| Configuration | GPU Cost ($/hr) | Throughput (tok/s) | $/1M tokens |
|------|---------------:|------------------:|-----------:|
| Aggregated (p4d x 2) | - | - | - |
| Disaggregated (p4d x 2 + g6e x 4) | - | - | - |

### Grafana Dashboards

Benchmark results are visualized in Grafana dashboards:

- **Pareto Dashboard**: TTFT vs Throughput Pareto analysis
- **DCGM Metrics**: GPU utilization, memory, temperature, power
- **Dynamo Platform**: Worker status, request rate, KV cache hit rate
- **KV Block Manager**: Block allocation, eviction, offload status

See the [Agent Monitoring Guide](/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring) for dashboard configuration.

---

## Deployment Guide

### Prerequisites

- EKS v1.32+ (Auto Mode recommended)
- GPU Node Groups: p4d.24xlarge (Prefill), g6e.12xlarge (Decode)
- EFS CSI Driver, AWS Load Balancer Controller
- Helm v3.14+

### Installation Order

1. Base resources: Namespace, StorageClass, HF Token Secret
2. GPU Operator: NVIDIA drivers and device plugins
3. Monitoring: Prometheus + Grafana + Pushgateway
4. Dynamo Platform: CRDs + Operator + etcd + NATS
5. Model download: Store model weights on EFS
6. Serving deployment: Choose Aggregated or Disaggregated mode
7. Benchmark execution: Run 4 modes sequentially

See the [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack) for detailed deployment guide.

---

## Key Validation Points

Core questions this benchmark aims to validate:

1. **How much does Disaggregated Serving improve TTFT compared to Aggregated?**
   - Especially the difference at high concurrency (32+)

2. **Does KV Cache Offloading (GPU→CPU→SSD) provide practical cost savings?**
   - Performance-to-cost when operating Decode workers with L40S (48GB)

3. **Is TTFT improvement linear with Prefix Cache hit rate?**
   - Actual effect of cache reuse in multi-turn conversations

4. **Does NIXL Transfer overhead negate the Disaggregation advantage?**
   - Whether Disaggregated is still beneficial for short sequences

---

## Recommendations

:::note To be updated after benchmark completion
Recommendations will be written based on actual measurement results.
:::

### Expected Recommendation Scenarios

| Scenario | Recommended Mode | Rationale |
|---------|----------|------|
| Single model, low concurrency (fewer than 8) | Aggregated | Implementation simplicity, minimal overhead |
| Multi-turn conversation, high cache hit rate | Disaggregated | Maximize KV Router + Prefix Cache effect |
| High concurrency (32+), strict SLA | Disaggregated | Stabilize TTFT with Prefill/Decode separation |
| Cost optimization priority | Disaggregated | Leverage lower-cost GPUs (L40S) for Decode |

## References

- [NVIDIA Dynamo Documentation](https://docs.nvidia.com/dynamo/)
- [vLLM Project](https://docs.vllm.ai/)
- [AIPerf Benchmark Tool](https://github.com/NVIDIA/dynamo)
- [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)
