---
title: "NVIDIA Dynamo Inference Benchmark"
sidebar_label: "Report 5. Dynamo Inference [New]"
sidebar_position: 5
description: "NVIDIA Dynamo-based Aggregated/Disaggregated LLM serving performance comparison benchmark — EKS environment AIPerf 4 modes execution"
tags: [benchmark, nvidia, dynamo, vllm, inference, gpu, disaggregated-serving, eks, kv-cache, nixl]
category: "benchmark"
last_update:
  date: 2026-03-20
  author: devfloor9
---

# Report 5. NVIDIA Dynamo Inference Benchmark

> 📅 **Written**: 2026-03-20 | **Status**: New

## Overview

This benchmark compares performance between **Aggregated** mode and **Disaggregated** mode in NVIDIA Dynamo-based LLM serving. By running 4 measurement modes of the AIPerf benchmark tool in an EKS environment, it quantitatively validates what performance differences the KV Router + NIXL Transfer of Disaggregated Serving creates in actual workloads.

:::info Deployment Code
The EKS deployment manifests for this benchmark are available in [`deploy/nvidia-platform/`](/deploy/nvidia-platform/).
:::

## Test Environment

### EKS Cluster Specifications

| Item | Configuration |
|------|--------------|
| **EKS Version** | v1.32 (Auto Mode) |
| **GPU Nodes (Prefill)** | p4d.24xlarge × 2 (A100 80GB × 8/node) |
| **GPU Nodes (Decode)** | g6e.12xlarge × 4 (L40S 48GB × 4/node) |
| **Storage** | EFS (model repository), gp3 (etcd/Prometheus) |
| **Network** | VPC CNI, EFA enabled (p4d nodes) |

### Software Stack

| Component | Version |
|-----------|---------|
| **NVIDIA Dynamo** | v0.9.1 |
| **vLLM Runtime** | v0.7.x |
| **GPU Operator** | v24.9.0 |
| **AIPerf** | v0.9.1 |
| **Prometheus + Grafana** | kube-prometheus-stack 65.x |

### Test Model

| Model | Parameters | Active Parameters | Precision | Architecture |
|-------|-----------|------------------|-----------|-------------|
| **Qwen3-30B-A3B-FP8** | 30B | 3B | FP8 | MoE |

Reasons for choosing MoE (Mixture-of-Experts) model:
- Clear comparison of Expert routing and KV cache strategy effects in Disaggregated Serving
- GPU memory efficiency maximized with FP8 quantization
- Small active parameters (3B) enable L40S-class GPU utilization in Decode workers

---

## Architecture Comparison

### Aggregated Serving

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

A single worker handles both Prefill and Decode. Implementation is simple but GPU utilization is uneven.

### Disaggregated Serving

```
Client → KV Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ NIXL Transfer
              → Decode Worker (L40S × 2, TP=2)
                  └── KV Cache Offload: GPU → CPU → SSD
```

Prefill and Decode are separated, allocating optimized GPUs for each stage:

- **KV Router**: Maximizes KV hit rate with cache-aware routing
- **NIXL Transfer**: Minimizes KV cache movement latency with GPU-to-GPU direct transfer
- **KV Cache Offloading**: Overcomes memory limits with GPU → CPU → SSD 3-tier cache

---

## Benchmark Modes

The AIPerf benchmark tool provides 4 measurement modes:

### 1. Concurrency Sweep

Measures TTFT, TPS, and Throughput while gradually increasing concurrent request count.

| Parameter | Value |
|-----------|-------|
| Concurrency | 1, 2, 4, 8, 16, 32, 64 |
| ISL (Input Seq Len) | 1024 |
| OSL (Output Seq Len) | 512 |
| Duration | 120s/step |

**Metrics**: TTFT p50/p99, ITL p50/p99, Throughput (tokens/s), Request Latency

### 2. Multi-turn Conversation

Measures KV cache reuse effects in multi-turn conversation scenarios.

| Parameter | Value |
|-----------|-------|
| Conversation Turns | 5 |
| Concurrent Conversations | 8 |
| ISL/OSL | 512/256 |
| Duration | 300s |

**Metrics**: TTFT change per turn, cache hit rate, total conversation response time

### 3. Sequence Distribution

Measures performance stability across various sequence length distributions.

| Parameter | Value |
|-----------|-------|
| Distribution Type | Uniform, Zipf, Lognormal |
| ISL Range | 128–4096 |
| OSL Range | 64–2048 |
| Concurrency | 16 |

**Metrics**: TTFT/TPS variance by distribution, long sequence processing stability

### 4. Prefix Cache

Measures TTFT improvement effect based on identical Prefix hit ratio changes.

| Parameter | Value |
|-----------|-------|
| Prefix Hit Ratio | 0%, 25%, 50%, 75%, 100% |
| ISL/OSL | 2048/512 |
| Concurrency | 16 |

**Metrics**: TTFT reduction by hit ratio, cache memory usage, Eviction Rate

---

## Benchmark Results

:::note Data Collection Upcoming
Result data will be updated after benchmark execution.
:::

### Expected Result Structure

#### Concurrency Sweep Results

| Concurrency | Aggregated TTFT p50 | Disagg TTFT p50 | Aggregated TPS | Disagg TPS |
|-------------|--------------------:|----------------:|---------------:|-----------:|
| 1 | - | - | - | - |
| 4 | - | - | - | - |
| 16 | - | - | - | - |
| 32 | - | - | - | - |
| 64 | - | - | - | - |

#### Prefix Cache Effect

| Hit Ratio | Aggregated TTFT | Disagg TTFT | Improvement |
|-----------|----------------:|------------:|------------:|
| 0% | - | - | - |
| 50% | - | - | - |
| 100% | - | - | - |

#### Cost Efficiency

| Configuration | GPU Cost ($/hr) | Throughput (tok/s) | $/1M tokens |
|---------------|----------------:|-------------------:|------------:|
| Aggregated (p4d × 2) | - | - | - |
| Disaggregated (p4d × 2 + g6e × 4) | - | - | - |

### Grafana Dashboards

Benchmark results are visualized in Grafana dashboards:

- **Pareto Dashboard**: TTFT vs Throughput Pareto analysis
- **DCGM Metrics**: GPU utilization, memory, temperature, power
- **Dynamo Platform**: Worker status, request rate, KV cache hit rate
- **KV Block Manager**: Block allocation, Eviction, Offload status

Dashboard JSONs are available in `deploy/nvidia-platform/monitoring/dashboards/`.

---

## Deployment Guide

### Prerequisites

- EKS v1.32+ (Auto Mode recommended)
- GPU node groups: p4d.24xlarge (Prefill), g6e.12xlarge (Decode)
- EFS CSI Driver, AWS Load Balancer Controller
- Helm v3.14+

### Installation Order

1. Base resources: Namespace, StorageClass, HF Token Secret
2. GPU Operator: NVIDIA drivers and device plugin
3. Monitoring: Prometheus + Grafana + Pushgateway
4. Dynamo Platform: CRDs + Operator + etcd + NATS
5. Model download: Store model weights in EFS
6. Serving deployment: Choose Aggregated or Disaggregated mode
7. Benchmark execution: Run 4 modes sequentially

For detailed deployment guide, refer to [`deploy/nvidia-platform/README.md`](/deploy/nvidia-platform/).

---

## Key Validation Points

Core questions this benchmark aims to validate:

1. **How much does Disaggregated Serving improve TTFT over Aggregated?**
   - Especially the difference at high concurrency (32+)

2. **Does KV Cache Offloading (GPU→CPU→SSD) provide practical cost savings?**
   - Cost vs performance when operating Decode workers with L40S (48GB)

3. **Is TTFT improvement linear with Prefix Cache hit ratio?**
   - Actual effect of cache reuse in multi-turn conversations

4. **Does NIXL Transfer overhead negate Disaggregation benefits?**
   - Whether Disaggregated is advantageous even for short sequences

---

## Recommendations

:::note To Be Updated After Benchmark Completion
Recommendations will be written based on actual measurement results.
:::

### Expected Recommendation Scenarios

| Scenario | Recommended Mode | Rationale |
|----------|-----------------|-----------|
| Single model, low concurrency (&lt;8) | Aggregated | Implementation simplicity, minimal overhead |
| Multi-turn conversation, high cache hit rate | Disaggregated | Maximize KV Router + Prefix Cache effect |
| High concurrency (32+), strict SLA | Disaggregated | TTFT stabilization through Prefill/Decode separation |
| Cost optimization priority | Disaggregated | Utilize low-cost GPU (L40S) for Decode |

## References

- [NVIDIA Dynamo Documentation](https://docs.nvidia.com/dynamo/)
- [vLLM Project](https://docs.vllm.ai/)
- [AIPerf Benchmark Tool](https://github.com/NVIDIA/dynamo)
- [Deployment Manifests: deploy/nvidia-platform/](../../deploy/nvidia-platform/)
