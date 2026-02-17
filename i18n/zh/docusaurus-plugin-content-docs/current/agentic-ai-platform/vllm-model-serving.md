---
title: "基于 vLLM 的基础模型部署与性能优化"
sidebar_label: "5. vLLM Model Serving"
description: "使用 vLLM 部署基础模型、Kubernetes 集成及性能优化策略"
sidebar_position: 5
last_update:
  date: 2026-02-14
  author: devfloor9
category: "genai-aiml"
tags: [vllm, model-serving, gpu, inference, optimization, foundation-model, eks]
---

# 基于 vLLM 的基础模型部署与性能优化

> 📅 **撰写日期**: 2026-02-14 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 6 分钟


vLLM 是一款高性能 LLM 推理引擎，通过 PagedAttention 算法将 KV Cache 内存浪费减少 60-80%，并通过 Continuous Batching 实现比传统方法高 2-24 倍的吞吐量。Meta、Mistral AI、Cohere 和 IBM 等主要企业在生产环境中使用 vLLM，并且它提供 OpenAI 兼容 API，方便现有应用的迁移。

本文档提供在 Amazon EKS 环境中部署和运维 vLLM 的实用指南。涵盖 GPU 内存计算、并行化策略选择、Kubernetes 部署模式以及生产环境的性能调优方法。

## 核心架构理解

### PagedAttention 与内存效率

传统 LLM 服务的最大瓶颈是 KV Cache 内存管理。由于 Transformer 架构的自回归特性，每个请求必须存储所有先前 Token 的键值对，而这个 KV Cache 会随输入序列长度和并发用户数线性增长。

vLLM 的 PagedAttention 受操作系统虚拟内存管理的启发，将 KV Cache 存储在非连续的块中。这消除了内存碎片，实现动态内存分配，并最大化 GPU 利用率。传统方法中 60-80% 的内存浪费被消除，相同的硬件可以处理更多并发请求。

### Continuous Batching

静态批处理会等到固定数量的请求到达后才开始处理。如果批大小为 32，第 31 个请求必须等待第 32 个请求到达。当请求不规则到达时，GPU 仅部分利用，吞吐量下降。

vLLM 的 Continuous Batching 完全消除了批处理边界。调度器在迭代级别运行，立即移除已完成的请求并动态添加新请求。这确保 GPU 始终以满负荷运行，同时改善平均延迟和吞吐量。

## GPU 内存需求计算

在部署模型之前，必须准确计算 GPU 内存需求。内存使用分为三个主要部分：模型权重、非 Torch 内存和 KV Cache。

```
所需 GPU 内存 = 模型权重 + 非 Torch 内存 + PyTorch 激活峰值内存 + (每批次 KV Cache 内存 × 批大小)
```

模型权重内存由参数数量和精度决定。

| 精度 | 每参数字节数 | 70B 模型内存 |
|-----------|---------------------|------------------|
| FP32 | 4 | 280GB |
| FP16/BF16 | 2 | 140GB |
| INT8 | 1 | 70GB |
| INT4 | 0.5 | 35GB |

以 FP16 部署 70B 参数模型仅权重就需要 140GB。这在单个 GPU 上不可能实现，需要多 GPU 张量并行化。将同一模型量化为 INT4 可减少到 35GB，使其可以在单个 A100 80GB 或 H100 上部署，并留有 KV Cache 的余量。

## 并行化策略

### 张量并行

张量并行将每个模型层内的参数分布到多个 GPU 上。这是在单节点内部署大型模型时最常用的策略。

适用场景：

- 模型无法放入单个 GPU
- 减少每个 GPU 的内存压力，释放 KV Cache 空间以提高吞吐量

```python
from vllm import LLM

# 将模型分布到 4 个 GPU
llm = LLM(model="meta-llama/Llama-3.3-70B-Instruct", tensor_parallel_size=4)
```

张量并行的约束是注意力头的数量。tensor_parallel_size 必须是模型注意力头数量的因子。

### 流水线并行

流水线并行将模型层按顺序分布到多个 GPU 上。Token 按顺序流过流水线。

适用场景：

- 张量并行已充分利用但仍需更多 GPU
- 需要多节点部署时

```bash
# 4 个 GPU 张量并行，2 个节点流水线并行
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### 数据并行

数据并行将整个模型复制到多个服务器上以处理独立请求。可以与 Kubernetes HPA（Horizontal Pod Autoscaler）结合实现弹性扩展。

### Expert 并行

这是针对 MoE（Mixture-of-Experts）模型的专用策略。Token 仅路由到相关的 "Expert"，减少不必要的计算。通过 `--enable-expert-parallel` 标志激活。

## Kubernetes 部署

### 基本部署配置

以下是在 AWS EKS 上部署 vLLM 的基本配置。它遵循 [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit) 的模式。

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

### 核心配置参数

**gpu-memory-utilization**：GPU VRAM 分配给 KV Cache 预分配的比例。默认 0.9，最高可设置 0.95 以获得最佳性能。找到不发生 OOM 的最大值。

**max-model-len**：支持的最大序列长度。直接影响 KV Cache 大小。根据实际工作负载进行调整。

**max-num-seqs**：同时处理的最大序列数。默认 256-1024。在内存和吞吐量之间权衡。

**tensor-parallel-size**：用于张量并行化的 GPU 数量。

### 多 GPU 张量并行部署

70B 及以上的大型模型需要多 GPU 配置。

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

**重要提示**：张量并行推理需要 `hostIPC: true` 和足够的共享内存（`/dev/shm`）。

## 性能优化策略

### 量化

在模型质量和内存效率之间取得平衡。

```bash
# 使用 FP8 量化模型
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ 量化
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GPTQ 量化
vllm serve TheBloke/Llama-2-70B-GPTQ --quantization gptq
```

FP8 以可忽略的质量下降将内存减半。INT4（AWQ、GPTQ）在复杂推理任务中可能导致质量下降，需要针对每个工作负载进行性能分析。

### 前缀缓存

对于标准化系统提示或重复上下文，利用率提升超过 400%。

```bash
vllm serve model-name --enable-prefix-caching
```

由于系统提示的 KV Cache 只需计算一次即可共享，具有相同前缀的请求可以避免冗余计算。命中率因应用而异。

### 推测解码

对于可预测的输出，可提供 2-3 倍的速度提升。一个小型草稿模型预测 Token，主模型进行验证。

```bash
vllm serve large-model \
  --speculative-model small-draft-model \
  --num-speculative-tokens 5
```

对于多变的提示，缓存维护开销可能超过收益。

### 分块预填充

通过在同一批次中混合计算密集型的预填充和内存密集型的解码工作，同时改善吞吐量和延迟。在 vLLM V1 中默认启用。

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # 可调参数
)
```

调整 max_num_batched_tokens 以平衡 TTFT（首个 Token 时间）和吞吐量。

## 监控与可观测性

### Prometheus 指标

vLLM 暴露各种 Prometheus 指标。

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

关键监控指标：

- `vllm:num_requests_running`：当前正在处理的请求数
- `vllm:num_requests_waiting`：等待中的请求数
- `vllm:gpu_cache_usage_perc`：GPU KV Cache 利用率百分比
- `vllm:num_preemptions_total`：被抢占的请求数（高值表示内存不足）

### 抢占处理

当 KV Cache 空间不足时，vLLM 会抢占请求以释放空间。如果以下警告频繁出现，需要采取措施。

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

应对措施：

- 增加 `gpu_memory_utilization`
- 减少 `max_num_seqs` 或 `max_num_batched_tokens`
- 增加 `tensor_parallel_size` 以释放每个 GPU 的内存
- 减少 `max_model_len`

## 生产部署清单

部署前请验证：

1. 计算 GPU 内存需求并选择合适的实例类型
2. 确定量化策略并验证质量-效率权衡
3. 配置适合工作负载的 max_model_len
4. 确定是否需要张量并行化并决定 GPU 数量
5. 分配足够的共享内存（/dev/shm）
6. 设置 Prometheus 指标收集和仪表板
7. 配置 HPA 进行弹性扩展
8. 通过 PVC 持久化模型缓存

## 参考资料

- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit)：自动化部署包括 LiteLLM、vLLM、Langfuse 和 Milvus 在内的 GenAI 组件
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks)：包含 llm-d、Karpenter 和 RAG 工作流的综合架构
- [vLLM 官方文档](https://docs.vllm.ai)：优化和调优指南
- [vLLM Kubernetes 部署指南](https://docs.vllm.ai/en/stable/deployment/k8s.html)
