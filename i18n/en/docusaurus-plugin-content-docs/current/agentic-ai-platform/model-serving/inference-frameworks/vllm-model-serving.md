---
title: "vLLM Model Serving"
sidebar_label: "vLLM Model Serving"
description: "vLLM PagedAttention, parallelization strategies, Multi-LoRA, and hardware support architecture"
tags: [vllm, paged-attention, tensor-parallel, pipeline-parallel, multi-lora, serving]
sidebar_position: 3
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

# vLLM Model Serving

## Overview

vLLM is a high-performance LLM inference engine that reduces KV cache memory waste by 60-80% through the PagedAttention algorithm and provides 2-24x throughput improvement over traditional approaches via Continuous Batching. Major companies including Meta, Mistral AI, Cohere, and IBM use it in production environments. It provides an OpenAI-compatible API for easy migration of existing applications.

> **Current version**: vLLM v0.18+ / v0.19.x (as of 2026-04)

### Why vLLM Became the Standard

Traditional LLM serving engines statically allocated KV cache memory, resulting in 60-80% memory waste. Static batching waited until a fixed number of requests accumulated, leading to long GPU idle time. vLLM eliminates these two fundamental bottlenecks, providing up to 24x higher throughput on the same hardware.

vLLM core innovations:
- **PagedAttention**: Inspired by OS virtual memory management, manages KV cache as non-contiguous blocks
- **Continuous Batching**: Removes batch boundaries and dynamically adds/removes requests at the iteration level
- **OpenAI API Compatible**: Migration possible without changing existing application code

## Core Architecture

### PagedAttention and KV Cache Management

Due to the autoregressive nature of Transformer architecture, each request must store key-value pairs from previous tokens. This KV cache grows linearly with input sequence length and concurrent users. Traditional approaches pre-allocate memory for maximum length, wasting space regardless of actual usage.

vLLM's PagedAttention divides KV cache into fixed-size blocks stored non-contiguously. Short requests allocate fewer blocks; longer ones allocate additional blocks as needed. Block tables maintain logical ordering, eliminating memory fragmentation.

**Memory efficiency improvement**:
- Traditional: Pre-allocate max sequence length x batch size → 60-80% waste
- PagedAttention: Dynamically allocate only actual usage → waste eliminated

### Continuous Batching

Static batching waits for a fixed number of requests before processing. With irregular request arrivals, GPUs are only partially utilized, reducing throughput. Also, requests that finish early must wait for the entire batch to complete.

vLLM's continuous batching completely removes batch boundaries:
- Scheduler operates at the iteration level
- Completed requests are immediately removed and new requests dynamically added
- GPU always operates at maximum capacity
- Both average latency and throughput are improved

### Speculative Decoding

Speculative decoding uses a small draft model to predict tokens, with the main model verifying in parallel, providing 2-3x speed improvement. Especially effective for predictable outputs (code generation, structured responses).

```python
from vllm import LLM

llm = LLM(
    model="large-model",
    speculative_model="small-draft-model",
    num_speculative_tokens=5
)
```

### V1 Engine Architecture

vLLM v0.6+ introduces the V1 engine with these improvements:
- **Chunked Prefill**: Mixes prefill (compute-intensive) and decode (memory-intensive) in the same batch
- **FP8 KV Cache**: Reduces KV cache memory by 2x for longer context support
- **Improved Prefix Caching**: 400%+ throughput improvement through common prefix reuse

## GPU Memory Requirements

Accurately calculate required GPU memory before model deployment. Memory usage breaks down as:

```
Required GPU Memory = Model Weights + Non-torch Memory + PyTorch Activation Peak Memory + (Per-batch KV Cache Memory x Batch Size)
```

### Model Weight Memory

Determined by parameter count and precision.

<SpecificationTable
  headers={['Precision', 'Bytes per Parameter', '70B Model Memory']}
  rows={[
    { id: '1', cells: ['FP32', '4', '280GB'] },
    { id: '2', cells: ['FP16/BF16', '2', '140GB'] },
    { id: '3', cells: ['INT8', '1', '70GB'] },
    { id: '4', cells: ['INT4', '0.5', '35GB'] }
  ]}
/>

**Example calculation**:
- Llama-3.3-70B (FP16): 70B x 2 bytes = 140GB (weights only)
- KV Cache (batch size 256, sequence length 8192): ~40GB
- Activation and other overhead: ~20GB
- **Total**: ~200GB → Not possible on single H100 80GB, TP=4 needed (50GB per GPU)

Quantizing a 70B parameter model to INT4 reduces it to 35GB, making it deployable on a single A100 80GB or H100 with KV cache headroom.

## Parallelization Strategies

Large models may not fit on a single GPU or may need multiple GPUs for higher throughput. vLLM supports four parallelization strategies.

### Tensor Parallelism (TP)

Distributes parameters within each model layer across multiple GPUs. The most common strategy for deploying large models within a single node.

**When to use**:
- When the model doesn't fit on a single GPU
- When reducing per-GPU memory pressure to free KV cache space

```python
from vllm import LLM

# Distribute model across 4 GPUs
llm = LLM(
    model="meta-llama/Llama-3.3-70B-Instruct",
    tensor_parallel_size=4
)
```

**Constraint**: `tensor_parallel_size` must be a divisor of the model's attention head count. For example, a 70B model with 64 attention heads supports TP=2, 4, 8, 16, etc.

### Pipeline Parallelism (PP)

Distributes model layers sequentially across multiple GPUs. Tokens flow through the pipeline sequentially.

**When to use**:
- When tensor parallelism is maxed out but more GPUs are needed
- When multi-node deployment is required

```bash
# 4 GPUs tensor parallel, 2 nodes pipeline parallel
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### Parallelization Strategy Combination Matrix

<ComparisonTable
  headers={['Scenario', 'Model Size', 'GPU Configuration', 'Parallelization Strategy', 'TP x PP']}
  rows={[
    { id: '1', cells: ['Small model', '7B-13B', '1x H100 80GB', 'None', '1 x 1'], recommended: true },
    { id: '2', cells: ['Medium model', '32B-70B', '4x H100 80GB (single node)', 'TP=4', '4 x 1'], recommended: true },
    { id: '3', cells: ['Large model', '175B-405B', '8x H100 (2 nodes)', 'TP=4, PP=2', '4 x 2'] },
    { id: '4', cells: ['Ultra-large model', '744B MoE', '16x H100 (2 nodes)', 'TP=8, PP=2', '8 x 2'] }
  ]}
/>

### PP Multi-node Limitations (V1 Engine, 2026.04)

vLLM V1 engine's multiproc_executor performs multi-node synchronization via NCCL TCPStore. For large models (744B class), loading time may exceed `VLLM_ENGINE_READY_TIMEOUT_S` (default 600s), causing deadlock.

**Symptoms**: Leader Pod timeout waiting for Worker response → Worker `TCPStore Broken pipe` error → Cyclical restarts

**Solutions**:
1. **Use SGLang** (recommended): Stably supports multi-node PP
2. **Ray-based vLLM**: Ray Cluster configuration (increased operational complexity)
3. **Single node deployment**: Use H200 (141GB x 8) or B200 (192GB x 8) to eliminate PP

For details, see the [Custom Model Deployment Guide](../../reference-architecture/model-lifecycle/custom-model-deployment.md#vllm-pp-multi-node-limitations).

### Data Parallelism (DP)

Replicates the entire model across multiple servers for independent request processing. Combined with Kubernetes HPA (Horizontal Pod Autoscaler) for elastic scaling.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: vllm_num_requests_waiting
      target:
        type: AverageValue
        averageValue: "10"
```

### Expert Parallelism (EP)

A specialized strategy for MoE (Mixture-of-Experts) models. Tokens are routed only to relevant "experts," reducing unnecessary computation.

```bash
vllm serve model-name --enable-expert-parallel
```

For details, see [MoE Model Serving](./moe-model-serving.md).

## Supported Hardware

vLLM v0.6+ supports various hardware accelerators:

<ComparisonTable
  headers={['Hardware', 'Support Level', 'Primary Use', 'AWS Instance Type']}
  rows={[
    { id: '1', cells: ['NVIDIA H100 (80GB)', 'Full support', 'Production inference', 'p5.48xlarge (H100x8)'], recommended: true },
    { id: '2', cells: ['NVIDIA H200 (141GB)', 'Full support', 'Large model inference', 'p5en.48xlarge (H200x8)'] },
    { id: '3', cells: ['NVIDIA B200 (192GB)', 'Full support', 'Ultra-large model inference', 'p6-b200.48xlarge (B200x8)'] },
    { id: '4', cells: ['NVIDIA L4 (24GB)', 'Full support', 'Cost-efficient inference', 'g6e.xlarge~12xlarge (L4x1~8)'] },
    { id: '5', cells: ['AWS Trainium2', 'Supported', 'AWS native acceleration', 'trn2.48xlarge (Trn2x16)'] },
    { id: '6', cells: ['AMD MI300X', 'Supported', 'Alternative GPU infrastructure', '-'] }
  ]}
/>

**AWS EKS Recommended Configuration**:
- **Production**: p5.48xlarge (H100 x 8, 640GB HBM3) → Deploy 175B models with TP=8
- **Large models**: p5en.48xlarge (H200 x 8, 1,128GB HBM3e) → Deploy 405B models with TP=8
- **Cost optimization**: g6e instances (L4) → 7B-13B models, Spot instance utilization

## Multi-LoRA Serving

vLLM can simultaneously serve multiple LoRA adapters on a single base model. This enables efficient operation of domain-specific models on a single GPU set, significantly saving GPU resources.

### Architecture Concept

**Base Model + Adapter Hot-swap**:
- Base Model (70B) is always loaded in GPU memory
- LoRA adapters (hundreds of MB to several GB) are dynamically loaded/unloaded per request
- Adapter switching overhead: tens to hundreds of ms (100x faster than full model reloading)

**Memory efficiency**:
- Traditional: Per-domain full model x N deployments = 140GB x 5 = 700GB
- Multi-LoRA: Base Model (140GB) + Adapter cache (10GB) = 150GB

### Key Configuration Options

<SpecificationTable
  headers={['Option', 'Description', 'Default']}
  rows={[
    { id: '1', cells: ['--enable-lora', 'Enable Multi-LoRA serving', 'False'] },
    { id: '2', cells: ['--lora-modules', 'Pre-load LoRA modules (name=path)', 'None'] },
    { id: '3', cells: ['--max-loras', 'Maximum simultaneous loaded LoRAs', '1'] },
    { id: '4', cells: ['--max-lora-rank', 'Maximum supported LoRA rank', '16'] },
    { id: '5', cells: ['--lora-extra-vocab-size', 'LoRA adapter extra vocabulary size', '256'] }
  ]}
/>

**Basic usage example**:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules customer-support=./lora-cs finance=./lora-fin \
  --max-loras 4 \
  --max-lora-rank 64
```

:::info Detailed Guide
For Multi-LoRA hot-swap deployment, per-customer adapter routing, A/B testing, and S3 dynamic loading, see the [Custom Model Pipeline Guide](../../reference-architecture/model-lifecycle/custom-model-pipeline.md#multi-lora-hot-swap-deployment).
:::

## Performance Optimization

### Quantization

Balances model quality and memory efficiency.

<ComparisonTable
  headers={['Quantization Method', 'Memory Savings', 'Quality Loss', 'Inference Speed', 'Recommended Use']}
  rows={[
    { id: '1', cells: ['FP8', '50%', 'Minimal (<1%)', 'Fast (H100 optimized)', 'Production inference'], recommended: true },
    { id: '2', cells: ['AWQ', '75%', 'Low (1-3%)', 'Very fast', 'High-throughput services'] },
    { id: '3', cells: ['GPTQ', '75%', 'Low (1-3%)', 'Fast', 'GPU memory-constrained environments'] },
    { id: '4', cells: ['GGUF', '50-75%', 'Low-Medium', 'Fast', 'CPU/edge deployment'] }
  ]}
/>

**Usage examples**:

```bash
# FP8 quantization (recommended)
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ quantization
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GGUF quantization (vLLM v0.6+)
vllm serve --model TheBloke/Llama-2-70B-GGUF \
  --quantization gguf \
  --gguf-file llama-2-70b.Q4_K_M.gguf
```

FP8 reduces memory by half with virtually no quality degradation. INT4 (AWQ, GPTQ) may cause quality degradation in complex reasoning tasks, so per-workload profiling is necessary.

### Prefix Caching

Provides 400%+ utilization improvement with standardized system prompts or repeated contexts.

```bash
vllm serve model-name --enable-prefix-caching
```

**How it works**:
- System prompt KV cache is computed once and shared
- Requests with identical prefixes avoid redundant computation
- Hit rate varies by application (especially effective in RAG systems)

**Applicable scenarios**:
- RAG systems (common context reuse)
- Fixed system prompt usage
- Few-shot learning (same examples repeated)

### Chunked Prefill

Mixes prefill (compute-intensive) and decode (memory-intensive) operations in the same batch, improving both throughput and latency. Enabled by default in vLLM V1.

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # Tunable
)
```

Adjust `max_num_batched_tokens` to balance TTFT and throughput:
- Higher value → increased throughput, increased TTFT
- Lower value → decreased TTFT, decreased throughput

### CUDA Graph

Captures repetitive computation patterns as graphs to reduce GPU kernel execution overhead. Enabled by default in vLLM V1.

```bash
vllm serve model-name --enforce-eager  # Disable CUDA Graph (for debugging)
```

CUDA Graph provides 10-20% performance improvement in most cases, but may add overhead with dynamic sequence length patterns.

### DeepGEMM (FP8)

Custom GEMM kernel that accelerates FP8 operations on NVIDIA H100 GPUs.

```bash
VLLM_USE_DEEP_GEMM=1 vllm serve model-name --kv-cache-dtype=fp8
```

Provides 20-30% additional performance improvement when using FP8 models on H100.

### Optimization Option Comparison

<ComparisonTable
  headers={['Optimization Technique', 'Throughput Improvement', 'TTFT Improvement', 'GPU Memory Savings', 'Implementation Difficulty']}
  rows={[
    { id: '1', cells: ['Prefix Caching', '+400%', 'O', 'O', 'Low (single flag)'], recommended: true },
    { id: '2', cells: ['FP8 Quantization', '+50%', 'O', '50%', 'Low (model selection)'], recommended: true },
    { id: '3', cells: ['Chunked Prefill', '+30%', '+20%', '-', 'Low (enabled by default)'] },
    { id: '4', cells: ['Speculative Decoding', '+200%', '+100%', '-', 'Medium (draft model)'] },
    { id: '5', cells: ['CUDA Graph', '+15%', 'O', '-', 'Low (enabled by default)'] },
    { id: '6', cells: ['DeepGEMM', '+25%', '-', '-', 'Low (H100 only)'] }
  ]}
/>

## Monitoring Metrics

vLLM exposes various metrics in Prometheus format.

### Key Metrics

<SpecificationTable
  headers={['Metric', 'Description', 'Threshold Example']}
  rows={[
    { id: '1', cells: ['vllm:num_requests_running', 'Currently processing request count', '< max_num_seqs'] },
    { id: '2', cells: ['vllm:num_requests_waiting', 'Waiting request count', '< 50 (prevent overload)'] },
    { id: '3', cells: ['vllm:gpu_cache_usage_perc', 'GPU KV cache utilization', '70-90% (optimal)'] },
    { id: '4', cells: ['vllm:num_preemptions_total', 'Preempted request count', '< 10/min (lower is better)'] },
    { id: '5', cells: ['vllm:avg_prompt_throughput_toks_per_s', 'Prompt throughput (tokens/sec)', 'Measure against target'] },
    { id: '6', cells: ['vllm:avg_generation_throughput_toks_per_s', 'Generation throughput (tokens/sec)', 'Measure against target'] },
    { id: '7', cells: ['vllm:time_to_first_token_seconds', 'Time to First Token (TTFT)', '< 1s (conversational services)'] },
    { id: '8', cells: ['vllm:time_per_output_token_seconds', 'Time Per Output Token (TPOT)', '< 0.1s (real-time streaming)'] },
    { id: '9', cells: ['vllm:e2e_request_latency_seconds', 'End-to-end request latency', 'Measure against target SLA'] }
  ]}
/>

### Preemption Handling

When KV cache space is insufficient, vLLM preempts requests to free space. If the following warning occurs frequently, action is needed:

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

**Remediation**:
1. Increase `gpu_memory_utilization` (0.9 → 0.95)
2. Decrease `max_num_seqs` or `max_num_batched_tokens`
3. Increase `tensor_parallel_size` to secure per-GPU memory
4. Decrease `max_model_len` (match actual workload)

:::info Detailed Guide
For Prometheus + Grafana monitoring stack setup, alert threshold configuration, and dashboard templates, see the [Monitoring Stack Setup Guide](../../reference-architecture/integrations/monitoring-observability-setup.md).
:::

## Related Documents

### Production Deployment
- **[Custom Model Deployment](../../reference-architecture/model-lifecycle/custom-model-deployment.md)**: Kubernetes deployment YAML, LWS multi-node, S3 model cache, vLLM PP multi-node constraint details, coding-specialized model deployment guide
- **[Custom Model Pipeline](../../reference-architecture/model-lifecycle/custom-model-pipeline.md)**: Multi-LoRA hot-swap, per-customer adapter routing, A/B testing, S3 dynamic loading
- **[Monitoring Stack Setup](../../reference-architecture/integrations/monitoring-observability-setup.md)**: Prometheus + Grafana setup, alert thresholds, dashboard templates

### Related Technologies
- **[llm-d EKS Auto Mode](./llm-d-eks-automode.md)**: Disaggregated Serving via vLLM + llm-d integration
- **[MoE Model Serving](./moe-model-serving.md)**: Expert Parallelism, GLM-5/Kimi K2.5 deployment strategy
- **[GPU Resource Management](../gpu-infrastructure/gpu-resource-management.md)**: Karpenter, KEDA, GPU Operator configuration

### References
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Bifrost, vLLM, Langfuse, Milvus and other GenAI component deployment automation
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): Comprehensive architecture including llm-d, Karpenter, RAG workflows
- [vLLM Official Documentation](https://docs.vllm.ai): Optimization and tuning guide
- [vLLM Kubernetes Deployment Guide](https://docs.vllm.ai/en/stable/deployment/k8s.html)
