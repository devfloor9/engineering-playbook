---
title: NVIDIA Dynamo Inference Benchmark
description: Hardware requirements, four workload families, and a measurement plan for comparing aggregated and disaggregated NVIDIA Dynamo serving on EKS
created: "2026-03-20"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 22
tags:
  - benchmark
  - nvidia
  - dynamo
  - vllm
  - inference
  - gpu
  - disaggregated-serving
  - eks
  - kv-cache
  - nixl
  - scope:tech
sidebar_label: Report 5. Dynamo Inference [New]
sidebar_position: 5
category: benchmark
---

:::info Document Status
**New** — Benchmark execution planning stage.
:::

## Overview

This plan compares **Aggregated** serving, where one worker processes the input during **prefill** and generates output tokens during **decode**, with Disaggregated serving, which assigns the stages to separate workers. First, keep GPU resources equal to measure the effect of separation. Then compare response time and cost when combining different GPU types. The plan uses four workload families generated with AIPerf. No results have been collected.

:::info Deployment Guide
For EKS deployment of this benchmark, see the [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack).
:::

## Test Environment

### EKS Cluster Specifications

| Item | Configuration |
|------|------|
| **EKS version and node management** | Select a supported version and either Auto Mode or a separate node group before execution |
| **Homogeneous baseline candidate** | Two p4d.24xlarge nodes: eight A100 40GB GPUs per node, 16 GPUs total |
| **Heterogeneous candidate** | g6e.12xlarge: four L40S 48GB GPUs per node; determine node count from memory validation and the cost limit |
| **Storage** | Fix model storage and local cache paths/capacity; measure downloads and startup separately from steady-state inference |
| **Network** | Record CNI, AZ, MTU, GPU/NIC placement and the actual transfer backend; EFA support alone does not verify a GPUDirect path |

The [P4 specification][p4] lists **320GB** of GPU memory per p4d node. Eight A100 80GB GPUs describe p4de. The [G6e specification][g6e] lists **four GPUs and 192GB total** for g6e.12xlarge. These are deployment candidates, not resources already provisioned or tested.

Auto Mode manages NVIDIA drivers and the device plugin; do not install duplicate GPU Operator components on those nodes. If a separate node group uses GPU Operator, first verify its supported OS, driver ownership and deployment scope.[^gpu-ownership]

### Software Stack

| Component | Version |
|----------|------|
| **NVIDIA Dynamo** | Selected release, chart and image digest |
| **vLLM Runtime** | Runtime image supported by that Dynamo release, including its vLLM, CUDA and NIXL versions |
| **GPU driver and device plugin** | Auto Mode components or a verified configuration on a separate node group |
| **AIPerf** | CLI version, configuration and request dataset hash |
| **Prometheus + Grafana** | Chart version, scrape interval, actual metrics and dashboard revision |

Do not assemble independently selected latest versions. Check the combination in the [Dynamo compatibility matrix][compatibility], validate model loading and short requests in the selected image, then fill these fields in the run record.

### Test Model

| Model | Parameters | Active Parameters | Precision | Architecture |
|------|---------|-------------|--------|---------|
| **Qwen/Qwen3-30B-A3B** | 30.5B | 3.3B | BF16 baseline | MoE |
| **Qwen/Qwen3-30B-A3B-FP8** | 30.5B | 3.3B | Separate quantization candidate | MoE |

The [official model card][qwen] gives 3.3B active parameters per token. That is not the size of all resident weights. A simple BF16 calculation for 30.5B parameters gives approximately 61GB for weights alone, before KV cache and runtime buffers. Validate memory fit for each worker's GPU count, tensor parallelism (TP) and context length.

FP8 checkpoint formats and supported kernels depend on the GPU and backend. Do not assume the same FP8 path works on A100 and L40S. Confirm support, actual compute precision and output quality before reporting quantized results separately from BF16.

---

## Architecture Comparison

### Aggregated Serving

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

A single worker handles both stages. Measure whether one stage competes with the other for resources at the selected input lengths and concurrency. This configuration can also reuse KV cache; cache reuse is not an exclusive benefit of disaggregation.

### Disaggregated Serving

```
Client → Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ KV transfer
              → Decode Worker (A100 × 4, TP=4)
```

The diagram illustrates worker placement for the homogeneous experiment. With 16 GPUs, one candidate compares four Aggregated workers against two Prefill and two Decode workers. Fix worker counts and stage allocation before running. Replacing Decode GPUs with L40S is a separate experiment that changes resources, TP and cost.

- **KV Router**: Compare how cache information affects routing and recomputation.
- **NIXL Transfer**: Verify the selected transfer plugin, memory registration and actual data path, then measure KV transfer time. Using NIXL does not by itself guarantee direct GPU transfers or minimum latency.[^nixl]
- **KV Cache Offloading**: Compare memory/storage reads against avoided recomputation. KVBM support depends on the backend, and it can be configured separately for both Aggregated and Disaggregated serving.[^kvbm]

Changing stage separation, cache routing and offload together cannot establish each feature's contribution. Keep incremental experiments separate from the intended operating configuration.

---

## Benchmark Modes

This plan uses [AIPerf][aiperf] to construct four workload families. These are not an exhaustive list of the tool's modes. The values below are initial proposals; preserve request-generation settings and datasets in each run record.

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

Measure performance stability across sequence length distributions. If the selected AIPerf version does not directly support a distribution, generate a dataset with a fixed seed and record requested and actual output lengths.

| Parameter | Value |
|---------|---|
| Distribution Types | Uniform, Zipf, Lognormal |
| ISL Range | 128-4096 |
| OSL Range | 64-2048 |
| Concurrency | 16 |

**Measured Metrics**: TTFT/TPS variance by distribution, long sequence processing stability

### 4. Prefix Cache

Vary the proportion of requests sharing a prefix and measure TTFT and actual cache reuse. Input prefix overlap is not the server cache hit rate: capacity, eviction and routing can still produce misses.

| Parameter | Value |
|---------|---|
| Input prefix overlap | 0%, 25%, 50%, 75%, 100% |
| ISL/OSL | 2048/512 |
| Concurrency | 16 |

**Measured Metrics**: TTFT reduction by hit ratio, cache memory usage, Eviction Rate

Define TTFT from request start to the first output token, and ITL between successive output tokens. Separate aggregate output tokens/s from per-request generation speed, retaining errors, timeouts and cancellations. Collect cache hits/misses, evictions and transfer bytes from backend metrics rather than inferring them from AIPerf output. Hold prompts, thinking mode, sampling and output-quality criteria constant. Report distributions and sample counts for each repetition.

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
| Aggregated, homogeneous baseline | - | - | - |
| Disaggregated, equal GPU total | - | - | - |
| Disaggregated, separate heterogeneous cost experiment | - | - | - |

Divide cost over the measurement period by **successful output tokens** in the same period, then multiply by 1,000,000. Declare which allocated nodes, EKS/node-management charges, storage and network costs are included. Compare heterogeneous deployments at the same cost limit, quality requirement and latency SLO; extra GPUs do not demonstrate an improvement caused solely by disaggregation.

### Grafana Dashboards

Plan to collect the following observations. Dashboard names do not establish that metrics are collected; verify actual metric names and units for the selected release.

- **Pareto Dashboard**: TTFT vs Throughput Pareto analysis
- **DCGM Metrics**: GPU utilization, memory, temperature, power
- **Dynamo Platform**: Worker status, request rate, KV cache hit rate
- **KV Block Manager**: Block allocation, eviction, offload status

See the [Agent Monitoring Guide](/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring) for dashboard configuration.

---

## Deployment Guide

### Prerequisites

- Dedicated AWS account/profile/region/cluster/namespace, cost limit and stop conditions
- Supported EKS version, node management, GPU quota and AZ capacity
- Model access, weight/image digests, storage and network configuration
- CSI driver, ingress path and Helm version required by the selected deployment; not every configuration needs the same add-ons

### Installation Order

1. Base resources: Namespace, StorageClass, HF Token Secret
2. GPU verification: Drivers, device plugin and memory under the selected node-management model
3. Monitoring: Prometheus + Grafana and the backend's exporter/scrape configuration
4. Dynamo: CRDs, Operator, discovery and messaging required by the selected release; do not assume etcd and NATS are mandatory for every version and feature combination
5. Model download: Store model weights on EFS
6. Serving deployment: Choose Aggregated or Disaggregated mode
7. Validate model, transport and instrumentation with short requests, then run warm-up and the four workload families

See the [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack) for detailed deployment guide.

To stop a test, halt load generation first and restore only that test's workers and configuration. Check the inventory of created resources and whether billing has stopped; do not delete unrelated resources. This document does not report a completed deployment or successful recovery test.

---

## Key Validation Points

Core questions this benchmark aims to validate:

1. **How does separation change TTFT, ITL and successful throughput at equal GPU count?**
   - Compare short and long inputs, from low load through the point where the SLO is exceeded

2. **Does KV Cache Offloading (GPU→CPU→SSD) provide practical cost savings?**
   - Performance-to-cost when operating Decode workers with L40S (48GB)

3. **How does input prefix overlap relate to the observed cache hit rate?**
   - Apply equivalent cache conditions to Aggregated serving

4. **Does NIXL Transfer overhead negate the Disaggregation advantage?**
   - Whether Disaggregated is still beneficial for short sequences

---

## Recommendations

:::note To be updated after benchmark completion
Recommendations will be written based on actual measurement results.
:::

### Hypotheses to Test {#expected-recommendation-scenarios}

| Scenario | Hypothesis | Evidence to collect |
|---------|----------|------|
| Low load, short inputs | Separation may add transfer and scheduling costs | TTFT, ITL and KV transfer time |
| Multi-turn conversations | Routing/offload may reduce recomputation | Actual hits/misses and eviction in both serving modes |
| High load, long inputs | Reduced prefill interference may expose a decode bottleneck | Stage queues, GPU utilization and SLO compliance |
| Cost optimization | A heterogeneous mix may help within a particular load range | Period cost and successful output tokens at equal quality/SLO |

## References

- [NVIDIA Dynamo Documentation](https://docs.nvidia.com/dynamo/)
- [vLLM Project](https://docs.vllm.ai/)
- [AIPerf Benchmark Tool](https://github.com/ai-dynamo/aiperf)
- [NVIDIA GPU Stack Guide](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)
- [Dynamo compatibility matrix][compatibility]
- [Qwen3 model card][qwen]

[p4]: https://aws.amazon.com/ec2/instance-types/p4/
[g6e]: https://aws.amazon.com/ec2/instance-types/g6e/
[qwen]: https://huggingface.co/Qwen/Qwen3-30B-A3B-FP8
[compatibility]: https://docs.nvidia.com/dynamo/dev/reference/compatibility
[aiperf]: https://github.com/ai-dynamo/aiperf
[^gpu-ownership]: [EKS Auto Mode GPU management](https://docs.aws.amazon.com/eks/latest/userguide/auto-accelerated.html), [GPU Operator prerequisites on EKS](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/amazon-eks.html).
[^nixl]: [NIXL transfer backends and memory registration](https://github.com/ai-dynamo/nixl/blob/main/docs/nixl.md).
[^kvbm]: [Dynamo v1.2.1 KVBM scope and limitations](https://github.com/ai-dynamo/dynamo/blob/v1.2.1/docs/components/kvbm/README.md). Check the support matrix for the release actually installed.
