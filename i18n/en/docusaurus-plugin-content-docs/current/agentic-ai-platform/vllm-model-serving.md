---
title: "vLLM-based Foundation Model Deployment and Performance Optimization"
sidebar_label: "vLLM Model Serving"
description: "Foundation Model deployment using vLLM, Kubernetes integration, and performance optimization strategies"
sidebar_position: 5
---

# vLLM-based Foundation Model Deployment and Performance Optimization

vLLM is a high-performance LLM inference engine that reduces KV cache memory waste by 60-80% through the PagedAttention algorithm and achieves 2-24x higher throughput than conventional approaches through Continuous Batching. Major companies such as Meta, Mistral AI, Cohere, and IBM use vLLM in production environments, and it provides OpenAI-compatible APIs for easy migration of existing applications.

This document provides a practical guide for deploying and operating vLLM in Amazon EKS environments. It covers GPU memory calculations, parallelization strategy selection, Kubernetes deployment patterns, and performance tuning methods for production environments.

## Core Architecture Understanding

### PagedAttention and Memory Efficiency

The biggest bottleneck in traditional LLM serving is KV cache memory management. Due to the auto-regressive nature of the Transformer architecture, each request must store key-value pairs from all previous tokens, and this KV cache grows linearly with the input sequence length and the number of concurrent users.

vLLM's PagedAttention, inspired by operating system virtual memory management, stores KV cache in non-contiguous blocks. This eliminates memory fragmentation, dynamically allocates memory, and maximizes GPU utilization. The 60-80% memory waste that occurred with conventional methods is eliminated, and the same hardware can handle more concurrent requests.

### Continuous Batching

Static batching waits until a fixed number of requests arrive before processing. If batch size is 32, the 31st request must wait for the 32nd request to arrive. When requests arrive irregularly, the GPU is only partially utilized, degrading throughput.

vLLM's Continuous Batching completely removes batch boundaries. The scheduler operates at the iteration level, immediately removing completed requests and dynamically adding new ones. This ensures the GPU always operates at full capacity, improving both average latency and throughput.

## GPU Memory Requirement Calculations

Before deploying a model, GPU memory requirements must be calculated accurately. Memory usage is divided into three main components: model weights, non-torch memory, and KV cache.

```
Required GPU Memory = Model Weights + Non-torch Memory + PyTorch Activation Peak Memory + (KV Cache Memory per Batch × Batch Size)
```

Model weight memory is determined by the number of parameters and precision.

| Precision | Bytes per Parameter | 70B Model Memory |
|-----------|---------------------|------------------|
| FP32 | 4 | 280GB |
| FP16/BF16 | 2 | 140GB |
| INT8 | 1 | 70GB |
| INT4 | 0.5 | 35GB |

Deploying a 70B parameter model in FP16 requires 140GB for weights alone. This is impossible with a single GPU and requires multi-GPU tensor parallelization. Quantizing the same model to INT4 reduces it to 35GB, making it deployable on a single A100 80GB or H100 with headroom for KV cache.

## Parallelization Strategies

### Tensor Parallelism

Tensor parallelism distributes parameters within each model layer across multiple GPUs. It is the most common strategy when deploying large models within a single node.

When to apply:

- When the model does not fit on a single GPU
- To reduce memory pressure per GPU, freeing up KV cache space and increasing throughput

```python
from vllm import LLM

# Distribute model across 4 GPUs
llm = LLM(model="meta-llama/Llama-3.3-70B-Instruct", tensor_parallel_size=4)
```

The constraint of tensor parallelism is the number of attention heads. tensor_parallel_size must be a divisor of the model's number of attention heads.

### Pipeline Parallelism

Pipeline parallelism distributes model layers sequentially across multiple GPUs. Tokens flow through the pipeline sequentially.

When to apply:

- When tensor parallelism is fully utilized but additional GPUs are needed
- When multi-node deployment is required

```bash
# 4 GPUs with tensor parallelism, 2 nodes with pipeline parallelism
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### Data Parallelism

Data parallelism replicates the entire model across multiple servers to handle independent requests. It can be elastically scaled by combining with Kubernetes HPA (Horizontal Pod Autoscaler).

### Expert Parallelism

A specialized strategy for MoE (Mixture-of-Experts) models. Tokens are routed only to relevant "experts," reducing unnecessary computation. Activated with the `--enable-expert-parallel` flag.

## Kubernetes Deployment

### Basic Deployment Configuration

The following is a basic configuration for deploying vLLM on AWS EKS. It follows patterns from the [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit).

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
          image: vllm/vllm-openai:v0.10.2
          command: ["vllm", "serve"]
          args:
            - Qwen/Qwen3-32B-FP8
            - --served-model-name=qwen3-32b-fp8
            - --trust-remote-code
            - --gpu-memory-utilization=0.95
            - --max-model-len=32768
            - --enable-auto-tool-choice
            - --tool-call-parser=hermes
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

### Core Configuration Parameters

**gpu-memory-utilization**: GPU VRAM allocation ratio for KV cache pre-allocation. Default 0.9, can be set up to 0.95 for optimal performance. Find the maximum value without OOM.

**max-model-len**: Maximum sequence length to support. Directly affects KV cache size. Adjust to match actual workloads.

**max-num-seqs**: Maximum number of sequences to process concurrently. Default 256-1024. Trade-off between memory and throughput.

**tensor-parallel-size**: Number of GPUs to use for tensor parallelization.

### Multi-GPU Tensor Parallel Deployment

Large models of 70B or larger require multi-GPU configuration.

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
          image: vllm/vllm-openai:v0.10.2
          command: ["vllm", "serve"]
          args:
            - meta-llama/Llama-3.3-70B-Instruct
            - --tensor-parallel-size=4
            - --gpu-memory-utilization=0.90
            - --max-model-len=8192
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

**Important**: Tensor parallel inference requires `hostIPC: true` and sufficient shared memory (`/dev/shm`).

## Performance Optimization Strategies

### Quantization

Balance between model quality and memory efficiency.

```bash
# Use FP8 quantized model
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ quantization
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GPTQ quantization
vllm serve TheBloke/Llama-2-70B-GPTQ --quantization gptq
```

FP8 reduces memory by half with negligible quality degradation. INT4 (AWQ, GPTQ) can cause quality degradation in complex inference tasks, requiring per-workload profiling.

### Prefix Caching

Provides over 400% improvement in utilization for standardized system prompts or repeated contexts.

```bash
vllm serve model-name --enable-prefix-caching
```

Since the KV cache of system prompts is computed once and shared, requests with identical prefixes can avoid redundant computation. Hit rates vary by application.

### Speculative Decoding

Provides 2-3x speed improvement for predictable outputs. A small draft model predicts tokens, and the main model validates them.

```bash
vllm serve large-model \
  --speculative-model small-draft-model \
  --num-speculative-tokens 5
```

For variable prompts, the cache maintenance overhead may exceed the benefits.

### Chunked Prefill

Improves both throughput and latency by mixing compute-intensive prefill and memory-intensive decode work in the same batch. Enabled by default in vLLM V1.

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

- `vllm:num_requests_running`: Number of requests currently being processed
- `vllm:num_requests_waiting`: Number of requests waiting
- `vllm:gpu_cache_usage_perc`: GPU KV cache utilization percentage
- `vllm:num_preemptions_total`: Number of preempted requests (high value indicates memory shortage)

### Preemption Handling

When KV cache space is insufficient, vLLM preempts requests to free up space. If the following warning occurs frequently, action is needed.

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

Response measures:

- Increase `gpu_memory_utilization`
- Decrease `max_num_seqs` or `max_num_batched_tokens`
- Increase `tensor_parallel_size` to free up per-GPU memory
- Decrease `max_model_len`

## Production Deployment Checklist

Before deployment, verify:

1. Calculate GPU memory requirements and select appropriate instance type
2. Decide on quantization strategy and verify quality-efficiency trade-off
3. Configure max_model_len appropriate for workload
4. Determine if tensor parallelization is needed and decide number of GPUs
5. Allocate sufficient shared memory (/dev/shm)
6. Set up Prometheus metrics collection and dashboard
7. Configure HPA for elastic scaling
8. Persist model cache through PVC

## References

- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit): Automated deployment of GenAI components including LiteLLM, vLLM, Langfuse, and Milvus
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks): Comprehensive architecture including llm-d, Karpenter, and RAG workflows
- [vLLM Official Documentation](https://docs.vllm.ai): Optimization and tuning guide
- [vLLM Kubernetes Deployment Guide](https://docs.vllm.ai/en/stable/deployment/k8s.html)
