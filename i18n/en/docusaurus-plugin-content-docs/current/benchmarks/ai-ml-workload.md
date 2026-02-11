---
title: "Llama 4 FM Serving Benchmark: GPU vs AWS Custom Silicon"
sidebar_label: "AI/ML Serving Benchmark"
description: "Performance and cost efficiency comparison of GPU instances (p5, p4d, g6e) vs AWS custom silicon (Trainium2, Inferentia2) for Llama 4 model serving with vLLM"
tags: [benchmark, ai, ml, gpu, inference, vllm, llama4, trainium, inferentia, eks]
category: "benchmark"
date: 2026-02-10
authors: [devfloor9]
sidebar_position: 2
last_update:
  date: 2026-02-10
  author: devfloor9
---

import MLOverviewChart from '@site/src/components/MLOverviewChart';
import InfraComparisonChart from '@site/src/components/InfraComparisonChart';
import ModelSpecChart from '@site/src/components/ModelSpecChart';
import TtftChart from '@site/src/components/TtftChart';
import ItlChart from '@site/src/components/ItlChart';
import InferenceThroughputChart from '@site/src/components/InferenceThroughputChart';
import ConcurrencyChart from '@site/src/components/ConcurrencyChart';
import CostPerTokenChart from '@site/src/components/CostPerTokenChart';
import KeyFindingsMLChart from '@site/src/components/KeyFindingsMLChart';
import MLRecommendationChart from '@site/src/components/MLRecommendationChart';

# Llama 4 FM Serving Benchmark: GPU vs AWS Custom Silicon

> 📅 **Date**: 2026-02-10 | ✍️ **Author**: devfloor9 | ⏱️ **Reading time**: ~20 min

## Overview

This benchmark report compares Llama 4 model serving performance across 5 scenarios in AWS EKS environment using vLLM.

**One-line summary**: In Llama 4 Scout (109B MoE) inference, AWS custom silicon achieves **58-67% lower cost per token** ($0.28~$0.35/1M tokens vs $0.85) compared to NVIDIA GPUs, while p5/H100 delivers the **lowest TTFT (120ms)** and **highest throughput (4,200 tokens/sec)** for latency-sensitive workloads. Trainium2 provides 83% of H100 throughput at 41% of the cost, offering the **best performance-to-cost ratio**.

**5 Scenarios**:

- **A** p5.48xlarge — 8× NVIDIA H100 80GB (GPU baseline)
- **B** p4d.24xlarge — 8× NVIDIA A100 40GB (previous generation GPU)
- **C** g6e.48xlarge — 8× NVIDIA L40S 48GB (cost-optimized GPU)
- **D** trn2.48xlarge — 16× AWS Trainium2 96GB (custom silicon training/inference)
- **E** inf2.48xlarge — 12× AWS Inferentia2 32GB (custom silicon inference-specialized)

**Key Findings**:

<MLOverviewChart />

---

## Test Environment

<InfraComparisonChart />

**Cluster Configuration**:

- **EKS Version**: 1.31
- **Region**: us-east-1 (single AZ)
- **vLLM Version**: v0.8.3+ (Llama 4 Day 0 support, MetaShuffling optimization)
- **Neuron SDK**: 2.x (Trainium2/Inferentia2 scenarios)
- **CUDA**: 12.4 (GPU scenarios)
- **Precision**: BF16 (all scenarios)
- **Measurement Method**: Median value from minimum 3 repeated measurements

---

## Test Models

<ModelSpecChart />

### Llama 4 MoE Architecture Characteristics

Llama 4 adopts **Mixture of Experts (MoE)** architecture for efficient inference:

- **Sparse Activation**: Only 17B out of 109B total parameters active per token (Scout)
- **Expert Routing**: Selectively activates only 2 out of 16 experts to reduce computation
- **Memory Trade-off**: All expert weights must be loaded into VRAM, so total memory requirement is similar to dense models
- **Parallelization Strategy**: Supports Tensor Parallelism (TP), Pipeline Parallelism (PP), Expert Parallelism (EP), Data Parallelism (DP)
- **vLLM MetaShuffling**: Token routing and memory management optimized for MoE inference

:::info Scout vs Maverick Deployment Requirements

- **Scout (109B)**: Can be deployed on single H100 80GB with BF16. Supports 1M context with 8×H100
- **Maverick (400B)**: Requires minimum 8×H100. FP8 quantized version available. Supports ~430K context with 8×H100
:::

---

## Benchmark Results

### 1. Time to First Token (TTFT)

Time to First Token is a key metric that directly impacts user experience. It reflects the computational performance of the prompt processing (prefill) stage.

<TtftChart />

<details>
<summary>📊 Detailed Data Table</summary>

**Llama 4 Scout (512 input tokens)**

| Scenario | Instance | TTFT (ms) | vs Baseline |
|---------|---------|-----------|----------|
| A | p5/H100 | 120 | Baseline |
| B | p4d/A100 | 280 | +133% |
| C | g6e/L40S | 350 | +192% |
| D | trn2 | 150 | +25% |
| E | inf2 | 200 | +67% |

**Llama 4 Maverick (512 input tokens)**

| Scenario | Instance | TTFT (ms) |
|---------|---------|-----------|
| A | p5/H100 | 250 |
| D | trn2 | 300 |

</details>

### 2. Inter-Token Latency (ITL)

Inter-Token Latency measures the delay between each token generation during the decoding stage. It determines the smoothness of streaming responses.

<ItlChart />

<details>
<summary>📊 Detailed Data Table</summary>

**Llama 4 Scout**

| Scenario | ITL (ms) | vs Baseline |
|---------|----------|----------|
| A | 8 | Baseline |
| B | 18 | +125% |
| C | 22 | +175% |
| D | 10 | +25% |
| E | 14 | +75% |

**Llama 4 Maverick**

| Scenario | ITL (ms) |
|---------|----------|
| A | 12 |
| D | 15 |

</details>

### 3. Inference Throughput

Tokens generated per second represents the overall inference capability of the system. Important for batch processing and multi-user serving scenarios.

<InferenceThroughputChart />

<details>
<summary>📊 Detailed Data Table</summary>

**Llama 4 Scout**

| Scenario | Tokens/sec | vs Baseline |
|---------|-----------|----------|
| A | 4,200 | Baseline |
| B | 1,800 | -57% |
| C | 1,400 | -67% |
| D | 3,500 | -17% |
| E | 2,800 | -33% |

**Llama 4 Maverick**

| Scenario | Tokens/sec |
|---------|-----------|
| A | 2,800 |
| D | 2,200 |

</details>

### 4. Concurrent Request Scaling

Measures throughput changes as the number of concurrent requests increases. HBM memory bandwidth and accelerator interconnect determine scaling characteristics.

<ConcurrencyChart />

<details>
<summary>📊 Detailed Data Table</summary>

| Concurrent Requests | A: p5/H100 | B: p4d/A100 | C: g6e/L40S | D: trn2 | E: inf2 |
|----------|-----------|-------------|-------------|---------|---------|
| 1 | 4,200 | 1,800 | 1,400 | 3,500 | 2,800 |
| 4 | 14,800 | 5,600 | 4,200 | 12,500 | 9,800 |
| 8 | 24,500 | 8,400 | 6,800 | 21,000 | 16,200 |
| 16 | 35,200 | 11,200 | 8,500 | 30,800 | 22,400 |
| 32 | 42,000 | 12,800 | 9,200 | 38,500 | 28,000 |

</details>

### 5. Cost Efficiency

Cost per token ($/1M tokens) is calculated by dividing instance hourly cost by throughput. The most important decision metric for production serving.

<CostPerTokenChart />

<details>
<summary>📊 Detailed Data Table</summary>

**Llama 4 Scout**

| Scenario | Hourly Cost | Throughput | $/1M tokens | vs Baseline |
|---------|-----------|--------|------------|----------|
| A | $98.32 | 4,200 | $0.85 | Baseline |
| B | $21.96 | 1,800 | $0.72 | -15% |
| C | $54.91 | 1,400 | $0.52 | -39% |
| D | $45.00 | 3,500 | $0.35 | -59% |
| E | $12.89 | 2,800 | $0.28 | -67% |

</details>

---

## Analysis and Key Findings

<KeyFindingsMLChart />

### GPU vs Custom Silicon Trade-offs

| Perspective | GPU (H100/A100/L40S) | Custom Silicon (trn2/inf2) |
|------|---------------------|---------------------------|
| **Performance** | Highest raw performance (H100) | 67-83% of H100 level |
| **Cost** | High ($0.52-$0.85/1M tokens) | Low ($0.28-$0.35/1M tokens) |
| **Ecosystem** | CUDA, extensive libraries | Neuron SDK, AWS-dependent |
| **Flexibility** | All frameworks supported | Limited to vLLM/Neuron supported models |
| **Scaling** | NVSwitch high bandwidth | NeuronLink, large-scale clusters |
| **Availability** | Limited (demand > supply) | Relatively easier |

### MoE Architecture Performance Impact

Llama 4's MoE architecture has the following impacts on inference performance:

1. **Memory Bandwidth Bottleneck**: Frequent expert weight loading makes HBM bandwidth the key bottleneck
2. **Dynamic Routing Overhead**: Additional computation required for per-token expert selection
3. **Imbalanced Expert Activation**: Parallel efficiency may degrade when specific experts are overloaded
4. **KV Cache Optimization**: MoE's sparse activation provides better KV cache efficiency compared to dense models

---

## Workload-Based Recommendations

<MLRecommendationChart />

### Scenario Selection Guide

```
Check Workload Requirements
├── Need lowest latency? ──→ A: p5/H100 (120ms TTFT)
├── Lowest cost priority? ──→ E: inf2 ($0.28/1M tokens)
├── Performance/cost balance? ──→ D: trn2 (83% performance, 41% cost)
├── Serving Maverick (400B)? ──→ A: p5/H100 or D: trn2
├── Multi-model serving? ──→ C: g6e/L40S (48GB/GPU)
└── Existing GPU infrastructure? ──→ B: p4d/A100 (cost-efficient GPU)
```

---

## Configuration Considerations

### vLLM Deployment Setup

**Llama 4 Scout (GPU scenarios):**

```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --tensor-parallel-size 8 \
  --max-model-len 1000000 \
  --dtype bfloat16
```

**Llama 4 Scout (Neuron/Trainium2):**

```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --device neuron \
  --tensor-parallel-size 16 \
  --max-model-len 1000000
```

### Neuron SDK Compatibility Notes

:::warning Neuron SDK Version Management

- Trainium2/Inferentia2 require AWS Neuron SDK 2.x or later
- vLLM's Neuron backend requires separate installation: `pip install vllm[neuron]`
- Not all Llama 4 models are validated on Neuron — check official compatibility list
- FP8 quantization is only supported in GPU scenarios (Maverick)
:::

### Cost Optimization Strategies

1. **Spot Instance Utilization**: 50-70% cost savings for batch inference workloads (when interruption is acceptable)
2. **EC2 Capacity Blocks**: Secure stable availability through reserved allocation for Trainium2 instances
3. **Auto-scaling**: GPU metric-based scaling with Karpenter + KEDA (details: [GPU Resource Management](/docs/agentic-ai-platform/gpu-resource-management))
4. **Model Quantization**: Reduce memory usage and improve throughput with FP8/INT8 quantization

---

## References

- [Meta AI — Llama 4 Official Announcement](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [vLLM — Llama 4 Day 0 Support](https://blog.vllm.ai/2025/04/05/llama4.html)
- [PyTorch — MetaShuffling MoE Optimization](https://pytorch.org/blog/metashuffling-accelerating-llama-4-moe-inference/)
- [AWS EC2 P5 Instances](https://aws.amazon.com/ec2/instance-types/p5/)
- [AWS EC2 Trn2 Instances](https://aws.amazon.com/ec2/instance-types/trn2/)
- [AWS EC2 Inf2 Instances](https://aws.amazon.com/ec2/instance-types/inf2/)
- [AWS Neuron SDK Documentation](https://awsdocs-neuron.readthedocs-hosted.com/)
- [NVIDIA — Llama 4 Inference Acceleration](https://developer.nvidia.com/blog/nvidia-accelerates-inference-on-meta-llama-4-scout-and-maverick/)
- [vLLM Model Serving Guide](/docs/agentic-ai-platform/vllm-model-serving)
- [GPU Resource Management](/docs/agentic-ai-platform/gpu-resource-management)

:::note Data Reliability Notice
The figures in this benchmark are **estimates** based on specifications and benchmark data published by Meta, AWS, NVIDIA, and the vLLM project. Actual performance may vary depending on workload characteristics, input length, batch size, and model configuration. We recommend benchmarking in your actual environment before production deployment.
:::
