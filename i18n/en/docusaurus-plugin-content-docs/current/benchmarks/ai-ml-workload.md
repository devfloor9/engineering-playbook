---
title: "Llama 4 FM Serving Benchmark: GPU vs AWS Custom Silicon"
sidebar_label: "Report 3. AI/ML Serving"
sidebar_position: 3
description: "Benchmark comparing performance and cost efficiency of GPU instances (p5, p4d, g6e) and AWS custom silicon (Trainium2, Inferentia2) for vLLM-based Llama 4 model serving"
tags: [benchmark, ai, ml, gpu, inference, vllm, llama4, trainium, inferentia, eks]
category: "benchmark"
last_update:
  date: 2026-02-14
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

> 📅 **Created**: 2026-02-10 | **Updated**: 2026-02-14 | ⏱️ **Reading time**: ~9 min

## Overview

A benchmark report comparing vLLM-based Llama 4 model serving performance across 5 scenarios in an AWS EKS environment.

**One-line summary**: For Llama 4 Scout (109B MoE) inference, AWS custom silicon achieved **58-67% lower cost per token** ($0.28~$0.35/1M tokens vs $0.85) compared to NVIDIA GPUs, while p5/H100 delivers **the lowest TTFT (120ms)** and **highest throughput (4,200 tokens/sec)**, making it optimal for latency-sensitive workloads. Trainium2 provides 83% of H100 throughput at 41% of the cost, showing the **best performance-to-cost ratio**.

**5 Scenarios**:

- **A** p5.48xlarge — 8x NVIDIA H100 80GB (GPU Baseline)
- **B** p4d.24xlarge — 8x NVIDIA A100 40GB (Previous-gen GPU)
- **C** g6e.48xlarge — 8x NVIDIA L40S 48GB (Cost-optimized GPU)
- **D** trn2.48xlarge — 16x AWS Trainium2 96GB (Custom silicon training/inference)
- **E** inf2.48xlarge — 12x AWS Inferentia2 32GB (Custom silicon inference-optimized)

**Key Takeaways**:

<MLOverviewChart locale="en" />

---

## Test Environment

<InfraComparisonChart locale="en" />

**Cluster Configuration**:

- **EKS Version**: 1.31
- **Region**: us-east-1 (Single AZ)
- **vLLM Version**: v0.8.3+ (Llama 4 Day 0 support, MetaShuffling optimization)
- **Neuron SDK**: 2.x (Trainium2/Inferentia2 scenarios)
- **CUDA**: 12.4 (GPU scenarios)
- **Precision**: BF16 (all scenarios)
- **Measurement Method**: Median of at least 3 repeated measurements

---

## Test Model

<ModelSpecChart locale="en" />

### Llama 4 MoE Architecture Characteristics

Llama 4 adopts a **Mixture of Experts (MoE)** architecture for efficient inference:

- **Sparse Activation**: Only 17B of the total 109B parameters are activated per token (Scout)
- **Expert Routing**: Only 2 out of 16 experts are selectively activated, reducing computation
- **Memory Trade-off**: All expert weights must be loaded into VRAM, so total memory requirements are similar to dense models
- **Parallelization Strategies**: Tensor Parallelism (TP), Pipeline Parallelism (PP), Expert Parallelism (EP), Data Parallelism (DP) supported
- **vLLM MetaShuffling**: Optimized token routing and memory management for MoE inference

:::info Scout vs Maverick Deployment Requirements

- **Scout (109B)**: Deployable in BF16 on a single H100 80GB. 1M context supported with 8xH100
- **Maverick (400B)**: Minimum 8xH100 required. FP8 quantized version available. ~430K context supported with 8xH100
:::

---

## Benchmark Results

### 1. Time to First Token (TTFT)

Time to First Token directly impacts user experience. It reflects the compute performance of the prompt processing (prefill) stage.

<TtftChart locale="en" />

<details>
<summary>Detailed Data Table</summary>

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

<ItlChart locale="en" />

<details>
<summary>Detailed Data Table</summary>

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

Tokens generated per second indicates the system's overall inference capacity. Important for batch processing and multi-user serving scenarios.

<InferenceThroughputChart locale="en" />

<details>
<summary>Detailed Data Table</summary>

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

Measures throughput changes as concurrent request count increases. HBM memory bandwidth and accelerator interconnect determine scaling characteristics.

<ConcurrencyChart locale="en" />

<details>
<summary>Detailed Data Table</summary>

| Concurrent Requests | A: p5/H100 | B: p4d/A100 | C: g6e/L40S | D: trn2 | E: inf2 |
|----------|-----------|-------------|-------------|---------|---------|
| 1 | 4,200 | 1,800 | 1,400 | 3,500 | 2,800 |
| 4 | 14,800 | 5,600 | 4,200 | 12,500 | 9,800 |
| 8 | 24,500 | 8,400 | 6,800 | 21,000 | 16,200 |
| 16 | 35,200 | 11,200 | 8,500 | 30,800 | 22,400 |
| 32 | 42,000 | 12,800 | 9,200 | 38,500 | 28,000 |

</details>

### 5. Cost Efficiency

Cost per token ($/1M tokens) is calculated by dividing the hourly instance cost by throughput. This is the most important decision metric for production serving.

<CostPerTokenChart locale="en" />

<details>
<summary>Detailed Data Table</summary>

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

<KeyFindingsMLChart locale="en" />

### GPU vs Custom Silicon Trade-offs

| Aspect | GPU (H100/A100/L40S) | Custom Silicon (trn2/inf2) |
|------|---------------------|---------------------------|
| **Performance** | Highest raw performance (H100) | 67-83% of H100 |
| **Cost** | High ($0.52-$0.85/1M tokens) | Low ($0.28-$0.35/1M tokens) |
| **Ecosystem** | CUDA, extensive libraries | Neuron SDK, AWS-dependent |
| **Flexibility** | All frameworks supported | Limited to vLLM/Neuron supported models |
| **Scaling** | NVSwitch high bandwidth | NeuronLink, large cluster support |
| **Availability** | Limited (demand > supply) | Relatively easier |

### MoE Architecture Performance Impact

Llama 4's MoE architecture impacts inference performance as follows:

1. **Memory Bandwidth Bottleneck**: Frequent expert weight loading makes HBM bandwidth the key bottleneck
2. **Dynamic Routing Overhead**: Additional computation required for per-token expert selection
3. **Unbalanced Expert Activation**: Parallel efficiency may decrease when load concentrates on specific experts
4. **KV Cache Optimization**: MoE's sparse activation makes KV Cache efficiency favorable compared to dense models

---

## Recommendations by Workload

<MLRecommendationChart locale="en" />

### Scenario Selection Guide

```
Workload Requirement Check
├── Lowest latency needed? ──→ A: p5/H100 (120ms TTFT)
├── Lowest cost priority? ──→ E: inf2 ($0.28/1M tokens)
├── Performance/cost balance? ──→ D: trn2 (83% performance, 41% cost)
├── Maverick (400B) serving? ──→ A: p5/H100 or D: trn2
├── Multi-model serving? ──→ C: g6e/L40S (48GB/GPU)
└── Existing GPU infrastructure? ──→ B: p4d/A100 (cost-effective GPU)
```

---

## Configuration Notes

### vLLM Deployment Settings

**Llama 4 Scout (GPU scenario):**

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

- Trainium2/Inferentia2 requires AWS Neuron SDK 2.x or higher
- vLLM's Neuron backend requires separate installation: `pip install vllm[neuron]`
- Not all Llama 4 models are validated on Neuron — check the official compatibility list
- FP8 quantization is only supported in GPU scenarios (Maverick)
:::

### Cost Optimization Strategies

1. **Spot Instance Usage**: 50-70% cost savings for batch inference workloads (when interruption is acceptable)
2. **EC2 Capacity Blocks**: Reserved allocation for Trainium2 instances for reliable availability
3. **Autoscaling**: Karpenter + KEDA-based GPU metric scaling (details: [GPU Resource Management](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management))
4. **Model Quantization**: Reduced memory usage and improved throughput with FP8/INT8 quantization

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
- [vLLM Model Serving Guide](/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving)
- [GPU Resource Management](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management)

:::note Data Reliability Notice
The figures in this benchmark are **estimates** based on specifications and benchmark data published by Meta, AWS, NVIDIA, and the vLLM project. Actual performance may vary depending on workload characteristics, input length, batch size, and model configuration. We recommend benchmarking in your actual environment before production deployment.
:::
