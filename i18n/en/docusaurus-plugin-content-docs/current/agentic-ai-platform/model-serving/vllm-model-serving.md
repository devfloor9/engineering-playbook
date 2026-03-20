---
title: "vLLM-based FM Deployment and Performance Optimization"
sidebar_label: "vLLM Model Serving"
description: "Foundation Model deployment using vLLM, Kubernetes integration, and performance optimization strategies"
category: "genai-aiml"
sidebar_position: 2
last_update:
  date: 2026-03-17
  author: devfloor9
tags: [vllm, model-serving, gpu, inference, optimization, foundation-model, eks]
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

# vLLM-based Foundation Model Deployment and Performance Optimization

vLLM is a high-performance LLM inference engine that reduces KV cache memory waste by 60-80% through the PagedAttention algorithm and provides 2-24x throughput improvement over existing solutions through Continuous Batching. Major companies including Meta, Mistral AI, Cohere, and IBM are using it in production environments, and it provides OpenAI-compatible APIs for easy migration of existing applications.

> **📌 Current Version**: vLLM v0.6.3 / v0.7.x (2025-02 stable release). Code examples in this document are based on v0.6.x / v0.7.x.

This document provides a practical guide for deploying and operating vLLM in Amazon EKS environments. It covers GPU memory calculation, parallelization strategy selection, Kubernetes deployment patterns, and performance tuning methods for production environments.

## Understanding Core Architecture

### PagedAttention and Memory Efficiency

The biggest bottleneck in traditional LLM serving is KV cache memory management. Due to the autoregressive nature of the Transformer architecture, each request must store key-value pairs of previous tokens, and this KV cache grows linearly with input sequence length and number of concurrent users.

vLLM's PagedAttention is inspired by operating system virtual memory management and stores KV cache in non-contiguous blocks. This eliminates memory fragmentation and dynamically allocates memory to maximize GPU utilization. The 60-80% memory waste that occurred in existing methods is eliminated, allowing more concurrent requests to be processed on the same hardware.

### Continuous Batching

Static batching processes requests after waiting for a fixed number of requests to accumulate. If the batch size is 32, the 31st request must wait until the 32nd request arrives. When requests arrive irregularly, the GPU is only partially utilized, resulting in reduced throughput.

vLLM's Continuous Batching completely removes batch boundaries. The scheduler operates at the iteration level, immediately removing completed requests and dynamically adding new requests. This keeps the GPU operating at maximum capacity at all times, improving both average latency and throughput.

## GPU Memory Requirements Calculation

Before deploying a model, the required GPU memory must be accurately calculated. Memory usage is divided into three main components: model weights, activations, and KV cache.

```
Required GPU Memory = Model Weights + Non-torch Memory + PyTorch Activation Peak Memory + (KV Cache Memory per Batch × Batch Size)
```

Model weight memory is determined by the number of parameters and precision.

<SpecificationTable
  headers={['Precision', 'Bytes per Parameter', '70B Model Memory']}
  rows={[
    { id: '1', cells: ['FP32', '4', '280GB'] },
    { id: '2', cells: ['FP16/BF16', '2', '140GB'] },
    { id: '3', cells: ['INT8', '1', '70GB'] },
    { id: '4', cells: ['INT4', '0.5', '35GB'] }
  ]}
/>

To deploy a 70B parameter model in FP16, weights alone require 140GB. This is impossible with a single GPU, and multi-GPU tensor parallelism is essential. With INT4 quantization of the same model, it reduces to 35GB, allowing deployment on a single A100 80GB or H100 with KV cache space.

## Parallelization Strategies

### Tensor Parallelism

Tensor parallelism distributes parameters within each model layer across multiple GPUs. This is the most common strategy when deploying large models within a single node.

When to apply:

- When the model doesn't fit in a single GPU
- When reducing memory pressure per GPU to secure KV cache space and increase throughput

```python
from vllm import LLM

# Distribute model across 4 GPUs
llm = LLM(model="meta-llama/Llama-3.3-70B-Instruct", tensor_parallel_size=4)
```

The constraint of tensor parallelism is the number of attention heads. tensor_parallel_size must be a divisor of the model's attention head count.

### Pipeline Parallelism

Pipeline parallelism distributes model layers sequentially across multiple GPUs. Tokens flow through the pipeline sequentially.

When to apply:

- When you've maximized tensor parallelism but need additional GPUs
- When multi-node deployment is required

```bash
# 4 GPUs for tensor parallel, 2 nodes for pipeline parallel
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### Data Parallelism

Data parallelism replicates entire model copies to multiple servers to process independent requests. It can be combined with Kubernetes HPA (Horizontal Pod Autoscaler) for elastic scaling.

### Expert Parallelism

A specialized strategy for MoE (Mixture-of-Experts) models. Tokens are routed only to relevant "experts" to reduce unnecessary computation. Enabled with the `--enable-expert-parallel` flag.

## Expanded Hardware Support

vLLM v0.6+ supports various hardware accelerators:

<ComparisonTable
  headers={['Hardware', 'Support Level', 'Primary Use']}
  rows={[
    { id: '1', cells: ['NVIDIA GPU (A100, H100, H200)', 'Full Support', 'Production Inference'], recommended: true },
    { id: '2', cells: ['AMD GPU (MI300X)', 'Supported', 'Alternative GPU Infrastructure'] },
    { id: '3', cells: ['Intel GPU (Gaudi 2/3)', 'Supported', 'Cost-Effective Inference'] },
    { id: '4', cells: ['Google TPU', 'Supported', 'GCP Environment'] },
    { id: '5', cells: ['AWS Trainium/Inferentia', 'Supported', 'AWS Native Acceleration'] }
  ]}
/>

In AWS EKS environments, NVIDIA GPUs are the default choice, and AWS Trainium2 instances (`trn2.48xlarge`) can be considered for cost optimization.

### vLLM v0.6+ Key New Features

Major features added in vLLM v0.6 and above:

- **FP8 KV Cache**: Reduces KV cache memory by 2x to support longer context or larger batch sizes
- **Improved Prefix Caching**: 400%+ throughput improvement through common prefix reuse
- **Multi-LoRA Serving**: Simultaneously serve multiple LoRA adapters on a single base model
- **GGUF Quantization**: Native support for GGUF format quantized models
- **Enhanced Speculative Decoding**: Improved speculative decoding for faster token generation

## Kubernetes Deployment

### Basic Deployment Configuration

The following is a basic configuration for deploying vLLM on AWS EKS. It references patterns from the [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-32b-fp8
  namespace: vllm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qwen3-32b-fp8
  template:
    metadata:
      labels:
        app: qwen3-32b-fp8
    spec:
      nodeSelector:
        karpenter.sh/instance-family: g6e
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          command: ["vllm", "serve"]
          args:
            - Qwen/Qwen3-32B-FP8
            - --served-model-name=qwen3-32b-fp8
            - --trust-remote-code
            - --gpu-memory-utilization=0.95
            - --max-model-len=32768
            - --enable-auto-tool-choice
            - --tool-call-parser=hermes
            - --enable-prefix-caching
            - --kv-cache-dtype=fp8
          env:
            - name: HUGGING_FACE_HUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-token
                  key: token
          ports:
            - name: http
              containerPort: 8000
          resources:
            requests:
              cpu: 3
              memory: 24Gi
              nvidia.com/gpu: 1
            limits:
              nvidia.com/gpu: 1
          volumeMounts:
            - name: huggingface-cache
              mountPath: /root/.cache/huggingface
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: huggingface-cache
          persistentVolumeClaim:
            claimName: huggingface-cache
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: "16Gi"
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
---
apiVersion: v1
kind: Service
metadata:
  name: qwen3-32b-fp8
  namespace: vllm
spec:
  selector:
    app: qwen3-32b-fp8
  ports:
    - name: http
      port: 8000
```

### Key Configuration Parameters

**gpu-memory-utilization**: Ratio of GPU VRAM to pre-allocate for KV cache. Default 0.9, can be set up to 0.95 for optimal performance. Must find the maximum value without OOM.

**max-model-len**: Maximum sequence length to support. Directly affects KV cache size. Adjust to actual workload.

**max-num-seqs**: Maximum number of sequences to process concurrently. Default 256-1024. Trade-off between memory and throughput.

**tensor-parallel-size**: Number of GPUs to use for tensor parallelism.

### Multi-GPU Tensor Parallel Deployment

Large models of 70B and above require multi-GPU configurations.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llama-70b-instruct
  namespace: vllm
spec:
  replicas: 1
  selector:
    matchLabels:
      app: llama-70b-instruct
  template:
    metadata:
      labels:
        app: llama-70b-instruct
    spec:
      nodeSelector:
        karpenter.sh/instance-family: p5
      hostNetwork: true
      hostIPC: true
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          command: ["vllm", "serve"]
          args:
            - meta-llama/Llama-3.3-70B-Instruct
            - --tensor-parallel-size=4
            - --gpu-memory-utilization=0.90
            - --max-model-len=8192
            - --enable-prefix-caching
            - --kv-cache-dtype=fp8
          env:
            - name: HUGGING_FACE_HUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-token
                  key: token
            - name: NCCL_DEBUG
              value: "INFO"
          resources:
            requests:
              nvidia.com/gpu: 4
            limits:
              nvidia.com/gpu: 4
          volumeMounts:
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: "32Gi"
```

**Important**: `hostIPC: true` and sufficient shared memory (`/dev/shm`) are required for tensor parallel inference.

## Performance Optimization Strategies

### Quantization

Balances model quality and memory efficiency.

```bash
# Use FP8 quantized model
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ quantization
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GPTQ quantization
vllm serve TheBloke/Llama-2-70B-GPTQ --quantization gptq

# GGUF quantization (vLLM v0.6+)
vllm serve --model TheBloke/Llama-2-70B-GGUF \
  --quantization gguf \
  --gguf-file llama-2-70b.Q4_K_M.gguf
```

**Quantization Method Comparison:**

<ComparisonTable
  headers={['Quantization', 'Memory Savings', 'Quality Loss', 'Inference Speed', 'Support (vLLM v0.6+)']}
  rows={[
    { id: '1', cells: ['FP8', '50%', 'Minimal', 'Fast', '✅'], recommended: true },
    { id: '2', cells: ['AWQ', '75%', 'Low', 'Very Fast', '✅'] },
    { id: '3', cells: ['GPTQ', '75%', 'Low', 'Fast', '✅'] },
    { id: '4', cells: ['GGUF', '50-75%', 'Low-Medium', 'Fast', '✅ (v0.6+)'] }
  ]}
/>

FP8 reduces memory by half with almost no quality degradation. INT4 (AWQ, GPTQ, GGUF) may experience quality degradation in complex inference tasks, requiring workload-specific profiling.

### Multi-LoRA Serving

vLLM can simultaneously serve multiple LoRA adapters on a single base model:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules customer-support=./lora-cs finance=./lora-fin \
  --max-loras 4
```

This enables efficient operation of domain-specific models on a single GPU set, significantly saving GPU resources.

### Prefix Caching

Provides 400%+ utilization improvement with standardized system prompts or repeated contexts.

```bash
vllm serve model-name --enable-prefix-caching
```

System prompt KV cache is computed once and shared, allowing requests with the same prefix to avoid redundant computation. Hit rate varies by application.

### Speculative Decoding

Provides 2-3x speed improvement for predictable outputs. A small draft model predicts tokens, and the main model validates them.

```bash
vllm serve large-model \
  --speculative-model small-draft-model \
  --num-speculative-tokens 5
```

With variable prompts, cache maintenance overhead may exceed benefits.

### Chunked Prefill

Mixes prefill (compute-intensive) and decode (memory-intensive) operations in the same batch to improve both throughput and latency. Enabled by default in vLLM V1.

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # Tunable
)
```

Adjust max_num_batched_tokens to balance TTFT (Time To First Token) and throughput.

## Monitoring and Observability

### Prometheus Metrics

vLLM exposes various Prometheus metrics.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: vllm-monitor
  namespace: vllm
spec:
  selector:
    matchLabels:
      app: vllm
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

Key monitoring metrics:

- `vllm:num_requests_running`: Number of currently processing requests
- `vllm:num_requests_waiting`: Number of waiting requests
- `vllm:gpu_cache_usage_perc`: GPU KV cache utilization
- `vllm:num_preemptions_total`: Number of preempted requests (high indicates memory shortage)
- `vllm:avg_prompt_throughput_toks_per_s`: Prompt throughput (tokens/sec)
- `vllm:avg_generation_throughput_toks_per_s`: Generation throughput (tokens/sec)
- `vllm:time_to_first_token_seconds`: Time to first token (TTFT)
- `vllm:time_per_output_token_seconds`: Time per output token (TPOT)
- `vllm:e2e_request_latency_seconds`: End-to-end request latency

### Grafana Dashboard Example

```json
{
  "dashboard": {
    "title": "vLLM Performance Dashboard",
    "panels": [
      {
        "title": "Request Throughput",
        "targets": [{
          "expr": "rate(vllm:request_success_total[5m])",
          "legendFormat": "Requests/sec"
        }]
      },
      {
        "title": "GPU Cache Usage",
        "targets": [{
          "expr": "vllm:gpu_cache_usage_perc",
          "legendFormat": "Cache Usage %"
        }]
      },
      {
        "title": "Token Generation Speed",
        "targets": [{
          "expr": "vllm:avg_generation_throughput_toks_per_s",
          "legendFormat": "Tokens/sec"
        }]
      }
    ]
  }
}
```

### Preemption Handling

When KV cache space is insufficient, vLLM preempts requests to secure space. If the following warning occurs frequently, action is needed.

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

Response measures:

- Increase `gpu_memory_utilization`
- Decrease `max_num_seqs` or `max_num_batched_tokens`
- Increase `tensor_parallel_size` to secure more memory per GPU
- Decrease `max_model_len`

## Production Deployment Checklist

Pre-deployment checklist:

1. Calculate GPU memory requirements and select appropriate instance type
2. Decide quantization strategy and validate quality-efficiency trade-offs
3. Set max_model_len appropriate for workload
4. Determine need for tensor parallelism and number of GPUs
5. Allocate sufficient shared memory (/dev/shm)
6. Configure Prometheus metric collection and dashboards
7. Configure elastic scaling with HPA
8. Persist model cache via PVC

## Legacy Alternative Solutions (Reference)

:::info[Legacy Alternatives (Reference)]

Previously, alternatives such as HuggingFace TGI (Text Generation Inference), Ray Serve, and ModelMesh were considered. However, due to the following characteristics of vLLM, most use cases are now covered by vLLM:

- **vs TGI**: vLLM provides 2-24x higher throughput with PagedAttention and Continuous Batching
- **vs Ray Serve**: Native Kubernetes deployment and simple scaling without additional orchestration layers
- **vs ModelMesh**: Better GPU memory efficiency and immediate migration with OpenAI-compatible API

vLLM v0.6+ integrates advanced features such as FP8 KV Cache, Multi-LoRA, Prefix Caching, and Speculative Decoding, enabling diverse workloads with a single solution.

:::

## References

- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Automated deployment of GenAI components including Bifrost, vLLM, Langfuse, Milvus
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): Comprehensive architecture including llm-d, Karpenter, RAG workflows
- [vLLM Official Documentation](https://docs.vllm.ai): Optimization and tuning guide
- [vLLM Kubernetes Deployment Guide](https://docs.vllm.ai/en/stable/deployment/k8s.html)
