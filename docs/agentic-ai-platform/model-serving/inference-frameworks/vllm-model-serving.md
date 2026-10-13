---
title: vLLM Model Serving
description: vLLM PagedAttention, parallelization strategies, Multi-LoRA, and hardware support architecture
created: "2026-02-05"
last_update:
  date: 2026-10-13
  author: devfloor9
reading_time: 41
tags:
  - vllm
  - paged-attention
  - tensor-parallel
  - pipeline-parallel
  - multi-lora
  - serving
  - inference
  - gpu
  - optimization
  - scope:tech
sidebar_label: vLLM Model Serving
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

## Overview

vLLM is a high-performance LLM inference engine. Its PagedAttention algorithm reduces the KV cache over-reservation that the original vLLM authors measured at 60-80% of memory in prior serving systems, and its Continuous Batching reported a 2-24x throughput improvement over the HuggingFace Transformers and TGI baselines in the June 2023 vLLM benchmark (the exact factor depends on model, hardware, and workload). Major companies including Meta, Mistral AI, Cohere, and IBM use it in production environments, and it provides an OpenAI-compatible API for easy migration of existing applications.

> **📌 Current Version**: vLLM v0.24+ / v0.25.x (as of 2026-07)

### Why vLLM Became the Standard

Reserving KV-cache space for every request's maximum length leaves unused memory when a request ends early. With a fixed batch, a request that finishes early can also leave an empty processing slot until the remaining requests finish. vLLM reduces this waste by allocating additional KV blocks as needed and updating the active requests at each generation iteration.

vLLM core innovations:
- **PagedAttention**: Inspired by OS virtual memory management, manages KV cache as non-contiguous blocks
- **Continuous Batching**: Removes batch boundaries and dynamically adds/removes requests at the iteration level
- **OpenAI API Compatible**: Migration possible without changing existing application code

## Core Architecture

### PagedAttention and KV Cache Management

Transformer language models generate output one token at a time. To avoid recalculating attention data for earlier tokens, the serving engine stores their key and value tensors in the **KV cache**. Cache memory grows in proportion to sequence length and the number of concurrent requests. Pre-allocating space for every request’s maximum sequence length can leave much of that memory unused.

vLLM's PagedAttention divides KV cache into fixed-size blocks stored non-contiguously. Short requests allocate fewer blocks; longer ones allocate additional blocks as needed. Block tables maintain logical ordering, which removes the external fragmentation and over-reservation of the contiguous-allocation approach. Some internal waste remains in the last partially filled block of each sequence; the original vLLM authors measured this residual waste at under 4%.

**Memory efficiency improvement**:
- Traditional: Pre-allocate max sequence length × batch size → 60-80% of memory wasted to over-reservation and fragmentation (June 2023 vLLM measurement of prior serving systems)
- PagedAttention: Allocate blocks on demand → over-reservation and external fragmentation removed, with residual last-block waste measured at under 4%

### Continuous Batching

Static batching waits for a fixed number of requests before processing. With irregular request arrivals, GPUs are only partially utilized, reducing throughput. Also, requests that finish early must wait for the entire batch to complete.

vLLM's continuous batching updates the requests in a batch at each generation iteration.

- Remove requests that have completed.
- Admit waiting requests when processing capacity is available.
- This reduces idle time associated with fixed batches, but GPU utilization still depends on request arrivals and memory/compute limits.
- Measure latency and throughput changes separately under the same load.

### Speculative Decoding

Speculative decoding uses a small draft model to predict tokens, with the main model verifying in parallel, providing 2-3x speed improvement. Especially effective for predictable outputs (code generation, structured responses).

```python
from vllm import LLM

# vLLM v0.9+ API (speculative_config); method/model/num_speculative_tokens
# are fields of SpeculativeConfig. The draft and target models must share a
# tokenizer/vocabulary.
llm = LLM(
    model="large-model",
    speculative_config={
        "method": "draft_model",
        "model": "small-draft-model",
        "num_speculative_tokens": 5
    }
)
```

### V1 Engine Architecture

The vLLM V1 engine was first released as an alpha on 2025-01-27 (opt-in via `VLLM_USE_V1=1`) and later became the default engine; by the v0.19.x–v0.25.x line documented here it is the default. It provides these features:
- **Chunked Prefill**: Mixes prefill (compute-intensive) and decode (memory-intensive) in the same batch
- **FP8 KV Cache**: Stores KV cache in FP8 (1 byte/element) instead of FP16 (2 bytes), roughly halving KV cache memory for longer context support
- **Improved Prefix Caching**: Reuses the KV cache of a shared prefix across requests; V1 made this near-zero-overhead and enabled it by default. Throughput gains depend on the prefix hit rate and are not a fixed figure.

## GPU Memory Requirements

Accurately calculate required GPU memory before model deployment. Memory usage breaks down as:

```
Required GPU Memory = Model Weights + Non-torch Memory + PyTorch Activation Peak Memory + (Per-batch KV Cache Memory × Batch Size)
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

**Example calculation** (Llama-3.3-70B, FP16 weights and FP16 KV cache):

Weights: 70B × 2 bytes = 140 GB.

KV cache per token uses the model's attention dimensions. Llama-3.3-70B (per the Meta `llama-models` definition, identical to Llama-3/3.1-70B) has `n_layers = 80`, `n_kv_heads = 8` (grouped-query attention), and `head_dim = dim / n_heads = 8192 / 64 = 128`:

```
KV bytes/token = 2 (key+value) × n_layers × n_kv_heads × head_dim × bytes_per_element
               = 2 × 80 × 8 × 128 × 2 (FP16)
               = 327,680 bytes ≈ 320 KiB/token
```

For batch size 256 and sequence length 8192 the KV cache holds up to 256 × 8192 = 2,097,152 tokens:

```
KV cache = 2,097,152 tokens × 320 KiB ≈ 640 GiB   (NOT ~40 GB)
```

- **Total (full occupancy)**: ~140 GB weights + ~640 GiB KV + activation/overhead. This cannot fit on a single H100 80GB.
- With TP=4 the weights and KV cache are sharded across 4 GPUs, so the KV cache alone is ~160 GiB per rank — still far above an 80GB GPU at full 256×8192 occupancy. Reaching this batch×sequence point therefore requires more GPUs (higher TP and/or more nodes), KV-cache quantization (FP8 halves the figure to ~320 KiB→160 KiB/token), or a smaller `max_num_seqs`/`max_model_len`. In practice vLLM sizes the usable KV cache from `gpu_memory_utilization` and the free HBM after weights, so the real serviceable batch×sequence is whatever fits that budget — not a fixed 256×8192.

Quantizing a 70B parameter model to INT4 reduces the weights to 35GB; the KV cache is sized separately from weights, so the deployable batch×sequence on a single A100 80GB or H100 depends on the remaining HBM after the 35GB of weights.

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
  headers={['Scenario', 'Model Size', 'GPU Configuration', 'Parallelization Strategy', 'TP × PP']}
  rows={[
    { id: '1', cells: ['Small model', '7B-13B', '1×H100 80GB', 'None', '1 × 1'], recommended: true },
    { id: '2', cells: ['Medium model', '32B-70B', '4×H100 80GB (single node)', 'TP=4', '4 × 1'], recommended: true },
    { id: '3', cells: ['Large model', '175B-405B', '8×H100 (2 nodes)', 'TP=4, PP=2', '4 × 2'] },
    { id: '4', cells: ['Ultra-large model', '744B MoE', '16×H100 (2 nodes)', 'TP=8, PP=2', '8 × 2'] }
  ]}
/>

The GPU-count column shows the parallelization *topology*, not a verified memory fit; whether a model fits depends on checkpoint precision. The aggregate HBM must exceed the weights plus KV cache and activation overhead. For example, Llama-3.1-405B in BF16 is 405B × 2 bytes ≈ 810 GB, which exceeds 8×H100 (640 GB) before any KV cache — it needs an FP8/INT-quantized checkpoint or more GPUs. A 744B-parameter MoE in BF16 is ≈ 1,488 GB, which exceeds 16×H100 (1,280 GB); as an MoE only a subset of experts is active per token, but the full weights must still be resident, so it likewise requires a quantized checkpoint or more devices. Size each row against the actual checkpoint dtype and per-rank budget before deploying.

### PP Multi-node Constraints (V1 Engine, 2026-04) {#pp-multi-node-constraints-v1-engine-202604}

vLLM V1 engine's `multiproc_executor` performs multi-node synchronization via NCCL TCPStore. The `VLLM_ENGINE_READY_TIMEOUT_S` environment variable (default 600s, confirmed in the v0.25.0 `envs.py`) bounds how long the engine waits to become ready. In an internally observed incident with a large model (744B class), loading time exceeded this timeout during startup. The following is a single observed case, not a reproduced root-cause analysis: distinguish a **startup readiness timeout** (loading did not finish within 600s) from a true runtime **deadlock** — the available evidence confirms the timeout value but does not isolate the cause or establish a general deadlock.

**Observed symptoms**: Leader Pod timed out waiting for a Worker response → Worker reported `TCPStore Broken pipe` → cyclical restarts.

**Mitigations** (evaluate against your own versions and workload; none is verified here as a universal fix):
1. **Raise `VLLM_ENGINE_READY_TIMEOUT_S`** so slow loads of very large checkpoints are not cut off during startup.
2. **Ray-based vLLM**: Ray Cluster configuration (increased operational complexity).
3. **Single-node deployment**: Use H200 (141GB × 8) or B200 (180GB × 8 on p6-b200.48xlarge) to remove the need for multi-node PP.
4. **Alternative engines** such as SGLang are reported to support multi-node PP; validate stability for your model and topology before relying on it rather than assuming it.

For details, see the [Custom Model Deployment Guide](../../reference-architecture/model-lifecycle/custom-model-deployment.md#6-pp-multi-node-deadlock-issue-lessons-learned).

### Data Parallelism (DP)

Replicates the entire model across multiple servers for independent request processing. Combined with Kubernetes HPA (Horizontal Pod Autoscaler) for elastic scaling.

The `Pods` metric below (`vllm_num_requests_waiting`) is a **custom per-Pod metric**, not a built-in resource metric. vLLM exposes `vllm:num_requests_waiting` on its `/metrics` endpoint in Prometheus text format, but HPA reads custom metrics only through the `custom.metrics.k8s.io` API. The following YAML therefore has prerequisites:

- A metrics pipeline (for example Prometheus) scrapes the vLLM `/metrics` endpoint.
- A custom metrics adapter (for example [prometheus-adapter](https://github.com/kubernetes-sigs/prometheus-adapter)) is installed and configured to expose `vllm_num_requests_waiting` as a per-Pod metric through `custom.metrics.k8s.io`, mapped to the `vllm-deployment` Pods.
- Without that adapter and mapping, HPA cannot read the metric and does not scale.

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
  - type: Pods          # requires a custom.metrics.k8s.io adapter exposing this metric
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

vLLM v0.22+ supports various hardware accelerators:

<ComparisonTable
  headers={['Hardware', 'Support Level', 'Primary Use', 'AWS Instance Type']}
  rows={[
    { id: '1', cells: ['NVIDIA H100 (80GB)', 'Full support', 'Production inference', 'p5.48xlarge (H100×8)'], recommended: true },
    { id: '2', cells: ['NVIDIA H200 (141GB)', 'Full support', 'Large model inference', 'p5en.48xlarge (H200×8)'] },
    { id: '3', cells: ['NVIDIA B200 (180GB)', 'Full support', 'Ultra-large model inference', 'p6-b200.48xlarge (B200×8)'] },
    { id: '4', cells: ['NVIDIA L40S (48GB)', 'Full support', 'Cost-efficient inference', 'g6e.xlarge~48xlarge (L40S×1~8)'] },
    { id: '5', cells: ['AWS Trainium2', 'Supported', 'AWS native acceleration', 'trn2.48xlarge (Trn2×16)'] },
    { id: '6', cells: ['AMD MI300X', 'Supported', 'Alternative GPU infrastructure', '-'] }
  ]}
/>

**AWS EKS Recommended Configuration**:
- **Production**: p5.48xlarge (H100 × 8, 640GB HBM3) → Deploy 175B models with TP=8
- **Large models**: p5en.48xlarge (H200 × 8, 1,128GB HBM3e) → Deploy 405B models with TP=8
- **Cost optimization**: g6e instances (NVIDIA L40S, 48GB per GPU) → 7B~13B models, Spot instance utilization

## Multi-LoRA Serving

vLLM can simultaneously serve multiple LoRA adapters on a single base model. This enables efficient operation of domain-specific models on a single GPU set, significantly saving GPU resources.

### Architecture Concept

**Base Model + Adapter Hot-swap**:
- The base model (70B) stays resident in GPU memory.
- LoRA adapters (hundreds of MB to several GB) are activated per request. Adapters that are preloaded (via `--lora-modules`) or already held in the CPU adapter cache are reused without reloading; only an adapter not yet registered has to be fetched and loaded dynamically, which is the slower path.
- Switching between already-resident adapters avoids reloading the full base model. The actual switching latency depends on adapter size, rank, how many adapters share a batch, and whether the adapter is cache-resident or loaded on demand, so treat any single speed figure as workload-dependent rather than a fixed multiple.

**Memory efficiency**:
- Traditional: Per-domain full model × N deployments = 140GB × 5 = 700GB
- Multi-LoRA: Base Model (140GB) + Adapter cache (10GB) = 150GB

### Key Configuration Options

<SpecificationTable
  headers={['Option', 'Description', 'Default']}
  rows={[
    { id: '1', cells: ['--enable-lora', 'Enable Multi-LoRA serving', 'False'] },
    { id: '2', cells: ['--lora-modules', 'Pre-load LoRA modules (name=path)', 'None'] },
    { id: '3', cells: ['--max-loras', 'Max number of distinct LoRAs in a single batch (not the total registered count)', '1'] },
    { id: '4', cells: ['--max-cpu-loras', 'Max LoRAs stored in CPU memory (must be ≥ --max-loras; defaults to --max-loras)', 'None'] },
    { id: '5', cells: ['--max-lora-rank', 'Maximum supported LoRA rank', '16'] }
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
  headers={['Quantization Method', 'Weight Storage Width', 'Weight Memory vs FP16', 'Checkpoint/Backend Support', 'Typical Use']}
  rows={[
    { id: '1', cells: ['FP8 (W8A8)', '8-bit', '~50% smaller', 'Hopper/Blackwell (and other FP8-capable backends)', 'Production inference'], recommended: true },
    { id: '2', cells: ['AWQ (INT4)', '4-bit', '~75% smaller', 'GPU; prequantized AWQ checkpoint', 'High-throughput services'] },
    { id: '3', cells: ['GPTQ (INT4)', '4-bit', '~75% smaller', 'GPU; prequantized GPTQ checkpoint', 'GPU memory-constrained environments'] },
    { id: '4', cells: ['GGUF', '2–8 bit (per GGUF type)', 'Varies by type', 'Built-in but highly experimental; single-file GGUF', 'Portability / low-memory footprint'] }
  ]}
/>

The "Weight Memory vs FP16" column is a deterministic consequence of the storage width and applies to the model **weights** only; the KV cache and activations are sized separately. Quality loss and inference speed are **not** fixed values — they depend on the model, the quantization method, the calibration data, and the task, so measure them per workload rather than assuming a fixed percentage. GGUF support in vLLM is built in but, per the vLLM docs, highly experimental and under-optimized, and may be incompatible with other features.

**Usage examples**:

```bash
# FP8 quantization (recommended)
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ quantization
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GGUF quantization (built-in, highly experimental; single-file GGUF only)
# Load directly from a HuggingFace repo with the repo_id:quant_type syntax,
# and point --tokenizer at the base model to avoid slow GGUF tokenizer conversion.
vllm serve unsloth/Qwen3-0.6B-GGUF:Q4_K_M --tokenizer Qwen/Qwen3-0.6B

# Or load a local single-file .gguf:
#   vllm serve ./Qwen3-0.6B-Q4_K_M.gguf --tokenizer Qwen/Qwen3-0.6B
```

FP8 roughly halves the weight storage. INT4 (AWQ, GPTQ) can degrade quality on complex reasoning tasks, and GGUF support is experimental, so profile quality and speed per workload rather than assuming a fixed figure.

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

Tune `max_num_batched_tokens` to trade off inter-token latency (ITL), time to first token (TTFT), and throughput. These are three separate quantities, so measure each under the same load:
- **Smaller values** (e.g. 2048) → better ITL, because fewer prefill tokens slow down the prioritized decode steps.
- **Higher values** → better TTFT and throughput, because more prefill tokens are processed per batch (vLLM recommends `> 8192` for throughput, especially for smaller models on large GPUs).

### CUDA Graph

Captures repetitive computation patterns as graphs to reduce GPU kernel execution overhead. Enabled by default in vLLM V1.

```bash
vllm serve model-name --enforce-eager  # Disable CUDA Graph (for debugging)
```

CUDA Graph provides 10-20% performance improvement in most cases, but may add overhead with dynamic sequence length patterns.

### DeepGEMM (FP8)

Custom GEMM kernel that accelerates **FP8 block-quantized weight** matrix multiplications on NVIDIA Hopper and Blackwell GPUs (SM90/SM100). It is controlled by `VLLM_USE_DEEP_GEMM`, which defaults to `True` (enabled) in current versions (v0.10.2+), and it engages only when the model's weights use block-FP8 GEMMs and the DeepGEMM backend is available — the `--kv-cache-dtype=fp8` flag sets the KV-cache precision and does **not** by itself cause weight GEMMs to use DeepGEMM.

```bash
# Enabled by default (v0.10.2+); FP8 block-quantized weights on Hopper/Blackwell
vllm serve model-name

# Disable when it is not beneficial (e.g. some MoE models):
VLLM_USE_DEEP_GEMM=0 vllm serve model-name
# For MoE specifically: VLLM_MOE_USE_DEEP_GEMM=0
```

The gain is workload-dependent and not a fixed figure; on some Blackwell model types DeepGEMM is auto-disabled (E8M0 scale limitation), and for some MoE workloads disabling it can be faster.

### Optimization Option Comparison

<ComparisonTable
  headers={['Optimization Technique', 'Primary Benefit', 'Mechanism / Conditions', 'Implementation Difficulty']}
  rows={[
    { id: '1', cells: ['Prefix Caching', 'Throughput + TTFT on cache hits', 'Reuses the shared-prefix KV cache; benefit grows with the prefix hit rate (near-zero overhead at 0% hit in V1)', 'Low (single flag)'], recommended: true },
    { id: '2', cells: ['FP8 Quantization', 'Weight memory + throughput', 'Halves weight storage; speedup depends on model and FP8-capable hardware', 'Low (model/checkpoint selection)'], recommended: true },
    { id: '3', cells: ['Chunked Prefill', 'ITL / TTFT balance', 'Mixes prefill and decode in one batch; tune via max_num_batched_tokens', 'Low (enabled by default)'] },
    { id: '4', cells: ['Speculative Decoding', 'Lower latency on predictable output', 'Draft model proposes tokens, target verifies; gain depends on draft acceptance rate', 'Medium (draft model)'] },
    { id: '5', cells: ['CUDA Graph', 'Lower kernel-launch overhead', 'Captures repeated kernels; may add overhead with dynamic shapes', 'Low (enabled by default)'] },
    { id: '6', cells: ['DeepGEMM', 'Faster FP8 weight GEMMs', 'Block-FP8 weight kernels on Hopper/Blackwell; workload-dependent', 'Low (enabled by default on supported GPUs)'] }
  ]}
/>

The benefit column states the direction and the condition under which each technique helps. The guide does not attach a fixed percentage to any row because the published vLLM sources describe the mechanism rather than a single benchmark number; measure the actual gain on your own model, hardware, and workload.

## Reasoning and Tool-Call Parsers

When serving reasoning models, vLLM uses `--reasoning-parser` to split the reasoning span of model output into the `reasoning` field and the rest into `content`. Tool calling is enabled with `--enable-auto-tool-choice` and `--tool-call-parser`, and function calls are parsed only from `content`. Set both parsers together to match the model family and chat template. Setting only a tool-call parser has been reported to erase the reasoning boundary and merge reasoning into `content`.

The reasoning field was renamed from `reasoning_content` to `reasoning`. Clients that read the old name get an empty value without an error, so check clients together with engine upgrades. Per-model parser names, leaks from streaming with `stop`, the interaction between structured output and the reasoning span, and the design of an output validation layer are described in [Reasoning and Tool-Call Output Integrity](./reasoning-tool-output-parsing.md).

## Monitoring Metrics

vLLM exposes various metrics in Prometheus format.

### Key Metrics

<SpecificationTable
  headers={['Metric', 'Description', 'Threshold Example']}
  rows={[
    { id: '1', cells: ['vllm:num_requests_running', 'Currently processing request count', '< max_num_seqs'] },
    { id: '2', cells: ['vllm:num_requests_waiting', 'Waiting request count', '< 50 (prevent overload)'] },
    { id: '3', cells: ['vllm:kv_cache_usage_perc', 'KV cache utilization (v0.9.2+)', '70-90% (optimal)'] },
    { id: '4', cells: ['vllm:num_preemptions_total', 'Preempted request count', '< 10/min (lower is better)'] },
    { id: '5', cells: ['vllm:prompt_tokens_total', 'Cumulative prompt tokens (counter)', 'use rate() for throughput'] },
    { id: '6', cells: ['vllm:generation_tokens_total', 'Cumulative generation tokens (counter)', 'use rate() for throughput'] },
    { id: '7', cells: ['vllm:time_to_first_token_seconds', 'Time to First Token (TTFT)', '< 1s (conversational services)'] },
    { id: '8', cells: ['vllm:inter_token_latency_seconds', 'Inter-token latency (V1 engine)', '< 0.1s (real-time streaming)'] },
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
- **[Reasoning and Tool-Call Output Integrity](./reasoning-tool-output-parsing.md)**: reasoning and tool-call parser pairing, streaming leaks, output validation layer
- **[MoE Model Serving](./moe-model-serving.md)**: Expert Parallelism, GLM-5/Kimi K2.5 deployment strategy
- **[GPU Resource Management](../gpu-infrastructure/gpu-resource-management.md)**: Karpenter, KEDA, GPU Operator configuration

### References
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Bifrost, vLLM, Langfuse, Milvus and other GenAI component deployment automation
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): Comprehensive architecture including llm-d, Karpenter, RAG workflows
- [vLLM Official Documentation](https://docs.vllm.ai): Optimization and tuning guide
- [vLLM Kubernetes Deployment Guide](https://docs.vllm.ai/en/stable/deployment/k8s.html)
