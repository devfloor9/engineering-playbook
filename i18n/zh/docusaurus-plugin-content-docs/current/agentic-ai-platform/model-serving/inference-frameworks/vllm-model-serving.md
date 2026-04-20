---
title: "vLLM 模型服务"
sidebar_label: "vLLM 模型服务"
description: "vLLM 的 PagedAttention、并行化策略、Multi-LoRA、硬件支持架构"
tags: [vllm, paged-attention, tensor-parallel, pipeline-parallel, multi-lora, serving]
sidebar_position: 3
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import ComparisonTable from '@site/src/components/tables/ComparisonTable';
import SpecificationTable from '@site/src/components/tables/SpecificationTable';

# vLLM 模型服务

## 概述

vLLM 通过 PagedAttention 算法将 KV 缓存内存浪费减少 60-80%，并通过连续批处理（Continuous Batching）提供比传统方案高 2-24 倍的吞吐量，是高性能 LLM 推理引擎。Meta、Mistral AI、Cohere、IBM 等主要企业在生产环境中使用，并提供 OpenAI 兼容 API 便于现有应用迁移。

> **当前版本**：vLLM v0.18+ / v0.19.x（2026-04 基准）

### 为什么 vLLM 成为标准

传统 LLM 服务引擎静态分配 KV 缓存内存导致 60-80% 内存浪费。静态批处理等待固定数量请求积累后处理，GPU 空闲时间长。vLLM 消除了这两个根本瓶颈，在相同硬件上提供最高 24 倍的吞吐量。

vLLM 的核心创新：
- **PagedAttention**：受操作系统虚拟内存管理启发，以不连续块管理 KV 缓存
- **Continuous Batching**：消除批处理边界，在迭代（iteration）级别动态添加/移除请求
- **OpenAI API 兼容**：无需修改现有应用代码即可迁移

## 核心架构

### PagedAttention 与 KV 缓存管理

由于 Transformer 架构的自回归特性，每个请求需要存储之前 Token 的键值对。此 KV 缓存随输入序列长度和并发用户数线性增长，传统方式按最大长度预分配内存，与实际使用量无关地浪费空间。

vLLM 的 PagedAttention 将 KV 缓存分成固定大小块以不连续方式存储。请求短则分配少量块，变长则按需分配更多块。通过块表维护逻辑顺序，消除内存碎片。

**内存效率改善**：
- 传统方式：最大序列长度 × 批大小预分配 → 60-80% 浪费
- PagedAttention：仅按实际使用量动态分配 → 消除浪费

### Continuous Batching

静态批处理等待固定数量请求积累后处理。请求不规则到达时 GPU 仅部分利用，吞吐量下降。且批内先完成的请求也需等待整个批处理完成。

vLLM 的连续批处理完全消除批处理边界：
- 调度器在迭代级别运行
- 完成的请求立即移除，新请求动态添加
- GPU 始终以最大容量运行
- 平均延迟和吞吐量都得到改善

### Speculative Decoding

推测性解码由小的 Draft 模型预测 Token，主模型并行验证，提供 2-3 倍速度提升。在可预测输出（代码生成、格式化响应）中特别有效。

```python
from vllm import LLM

llm = LLM(
    model="large-model",
    speculative_model="small-draft-model",
    num_speculative_tokens=5
)
```

### V1 引擎架构

vLLM v0.6+ 版本引入 V1 引擎改进了以下功能：
- **Chunked Prefill**：在同一批中混合处理 Prefill（计算密集）和 Decode（内存密集）
- **FP8 KV Cache**：KV 缓存内存减少 2 倍支持更长上下文
- **Improved Prefix Caching**：通过共享公共前缀提升 400%+ 吞吐量

## GPU 内存需求

部署模型前需要准确计算所需 GPU 内存。内存使用由以下组成：

```
所需 GPU 内存 = 模型权重 + 非 torch 内存 + PyTorch 激活峰值内存 + (每批 KV 缓存内存 × 批大小)
```

### 模型权重内存

由参数数和精度决定。

<SpecificationTable
  headers={['精度', '每参数字节', '70B 模型内存']}
  rows={[
    { id: '1', cells: ['FP32', '4', '280GB'] },
    { id: '2', cells: ['FP16/BF16', '2', '140GB'] },
    { id: '3', cells: ['INT8', '1', '70GB'] },
    { id: '4', cells: ['INT4', '0.5', '35GB'] }
  ]}
/>

**计算示例**：
- Llama-3.3-70B (FP16)：70B × 2 bytes = 140GB（仅权重）
- KV 缓存（批大小 256、序列长度 8192）：约 40GB
- 激活及其他开销：约 20GB
- **总计**：约 200GB → 单个 H100 80GB 不可行，需要 TP=4（每 GPU 50GB）

70B 参数模型 INT4 量化后降至 35GB，可在单个 A100 80GB 或 H100 上连同 KV 缓存余量一起部署。

## 并行化策略

大规模模型无法放入单个 GPU 或需要利用多 GPU 提高吞吐量。vLLM 支持四种并行化策略。

### 张量并行（Tensor Parallelism, TP）

在模型每层内将参数分布到多个 GPU。单节点内部署大规模模型时最常用的策略。

**适用时机**：
- 模型无法放入单个 GPU
- 减少每 GPU 内存压力以腾出 KV 缓存空间

```python
from vllm import LLM

# 将模型分布到 4 个 GPU
llm = LLM(
    model="meta-llama/Llama-3.3-70B-Instruct",
    tensor_parallel_size=4
)
```

**约束**：`tensor_parallel_size` 必须是模型注意力头数的约数。例如 70B 模型有 64 个注意力头，则 TP=2、4、8、16 等可行。

### 流水线并行（Pipeline Parallelism, PP）

将模型层顺序分布到多个 GPU。Token 通过流水线顺序流动。

**适用时机**：
- 张量并行已用到极限但需要更多 GPU
- 需要多节点部署

```bash
# 4 个 GPU 张量并行、2 个节点流水线并行
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 4 \
  --pipeline-parallel-size 2
```

### 并行化策略组合矩阵

<ComparisonTable
  headers={['场景', '模型大小', 'GPU 配置', '并行策略', 'TP × PP']}
  rows={[
    { id: '1', cells: ['小型模型', '7B-13B', '1×H100 80GB', 'None', '1 × 1'], recommended: true },
    { id: '2', cells: ['中型模型', '32B-70B', '4×H100 80GB（单节点）', 'TP=4', '4 × 1'], recommended: true },
    { id: '3', cells: ['大型模型', '175B-405B', '8×H100（2 节点）', 'TP=4, PP=2', '4 × 2'] },
    { id: '4', cells: ['超大型模型', '744B MoE', '16×H100（2 节点）', 'TP=8, PP=2', '8 × 2'] }
  ]}
/>

### PP 多节点限制（V1 引擎，2026.04）

vLLM V1 引擎的 multiproc_executor 通过 NCCL TCPStore 进行多节点同步，大型模型（744B 级）加载时间超过 `VLLM_ENGINE_READY_TIMEOUT_S`（默认 600 秒）时可能出现死锁。

**症状**：Leader Pod 等待 Worker 响应超时 → Worker 出现 `TCPStore Broken pipe` 错误 → 循环重启

**解决方案**：
1. **使用 SGLang**（推荐）：稳定支持多节点 PP
2. **基于 Ray 的 vLLM**：配置 Ray Cluster（运维复杂度增加）
3. **单节点部署**：使用 H200（141GB × 8）或 B200（192GB × 8）消除 PP

详细内容请参阅 [自定义模型部署指南](../reference-architecture/model-lifecycle/custom-model-deployment.md)。

### 数据并行（Data Parallelism, DP）

将完整模型副本复制到多台服务器独立处理请求。结合 Kubernetes 的 HPA（Horizontal Pod Autoscaler）可弹性扩展。

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

### 专家并行（Expert Parallelism, EP）

面向 MoE（Mixture-of-Experts）模型的特殊策略。Token 仅路由到相关"专家"减少不必要的计算。

```bash
vllm serve model-name --enable-expert-parallel
```

详细内容请参阅 [MoE 模型服务](./moe-model-serving.md)。

## 支持硬件

vLLM v0.6+ 版本支持多种硬件加速器：

<ComparisonTable
  headers={['硬件', '支持级别', '主要用途', 'AWS 实例类型']}
  rows={[
    { id: '1', cells: ['NVIDIA H100 (80GB)', '完全支持', '生产推理', 'p5.48xlarge (H100×8)'], recommended: true },
    { id: '2', cells: ['NVIDIA H200 (141GB)', '完全支持', '大型模型推理', 'p5en.48xlarge (H200×8)'] },
    { id: '3', cells: ['NVIDIA B200 (192GB)', '完全支持', '超大型模型推理', 'p6-b200.48xlarge (B200×8)'] },
    { id: '4', cells: ['NVIDIA L4 (24GB)', '完全支持', '性价比推理', 'g6e.xlarge~12xlarge (L4×1~8)'] },
    { id: '5', cells: ['AWS Trainium2', '支持', 'AWS 原生加速', 'trn2.48xlarge (Trn2×16)'] },
    { id: '6', cells: ['AMD MI300X', '支持', '替代 GPU 基础设施', '-'] }
  ]}
/>

**AWS EKS 推荐配置**：
- **生产**：p5.48xlarge (H100 × 8, 640GB HBM3) → TP=8 可部署 175B 模型
- **大型模型**：p5en.48xlarge (H200 × 8, 1,128GB HBM3e) → TP=8 可部署 405B 模型
- **成本优化**：g6e 实例 (L4) → 7B~13B 模型，利用 Spot 实例

## Multi-LoRA 服务

vLLM 可以在单一基础模型上同时服务多个 LoRA 适配器。在一组 GPU 上高效运营领域特化模型，大幅节省 GPU 资源。

### 架构概念

**基础模型 + 适配器热交换**：
- Base Model（70B）始终加载在 GPU 内存中
- LoRA 适配器（数百 MB~数 GB）按请求动态加载/卸载
- 适配器切换开销：数十~数百 ms（比重新加载整个模型快 100 倍）

**内存效率**：
- 传统方式：领域级完整模型 × N 个部署 = 140GB × 5 = 700GB
- Multi-LoRA：Base Model（140GB）+ 适配器缓存（10GB）= 150GB

### 主要配置选项

<SpecificationTable
  headers={['选项', '说明', '默认值']}
  rows={[
    { id: '1', cells: ['--enable-lora', '启用 Multi-LoRA 服务', 'False'] },
    { id: '2', cells: ['--lora-modules', '预加载的 LoRA 模块 (name=path)', 'None'] },
    { id: '3', cells: ['--max-loras', '最大同时加载 LoRA 数', '1'] },
    { id: '4', cells: ['--max-lora-rank', '支持的最大 LoRA rank', '16'] },
    { id: '5', cells: ['--lora-extra-vocab-size', 'LoRA 适配器额外词汇大小', '256'] }
  ]}
/>

**基本使用示例**：

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules customer-support=./lora-cs finance=./lora-fin \
  --max-loras 4 \
  --max-lora-rank 64
```

:::info 详细指南
Multi-LoRA 热交换部署、客户级适配器路由、A/B 测试、S3 动态加载等详细实现请参阅 [自定义模型流水线指南](../reference-architecture/model-lifecycle/custom-model-pipeline.md)。
:::

## 性能优化

### 量化（Quantization）

平衡模型质量和内存效率。

<ComparisonTable
  headers={['量化方式', '内存节省', '质量损失', '推理速度', '推荐用途']}
  rows={[
    { id: '1', cells: ['FP8', '50%', '极小（低于 1%）', '快（H100 优化）', '生产推理'], recommended: true },
    { id: '2', cells: ['AWQ', '75%', '低（1-3%）', '非常快', '高吞吐量服务'] },
    { id: '3', cells: ['GPTQ', '75%', '低（1-3%）', '快', 'GPU 内存受限环境'] },
    { id: '4', cells: ['GGUF', '50-75%', '低-中', '快', 'CPU/边缘部署'] }
  ]}
/>

**使用示例**：

```bash
# FP8 量化（推荐）
vllm serve Qwen/Qwen3-32B-FP8 --quantization fp8

# AWQ 量化
vllm serve TheBloke/Llama-2-70B-AWQ --quantization awq

# GGUF 量化（vLLM v0.6+）
vllm serve --model TheBloke/Llama-2-70B-GGUF \
  --quantization gguf \
  --gguf-file llama-2-70b.Q4_K_M.gguf
```

FP8 质量损失几乎为零且内存减半。INT4（AWQ、GPTQ）在复杂推理任务中可能出现质量下降，需要按工作负载分析。

### Prefix Caching

在标准化系统 Prompt 或重复上下文中提供 400% 以上的利用率提升。

```bash
vllm serve model-name --enable-prefix-caching
```

**工作原理**：
- 系统 Prompt 的 KV 缓存计算一次后共享
- 具有相同前缀的请求避免重复计算
- 命中率取决于应用（RAG 系统中特别有效）

**适用场景**：
- RAG 系统（共享上下文复用）
- 固定系统 Prompt 使用
- Few-shot learning（相同示例重复使用）

### Chunked Prefill

在同一批中混合处理 Prefill（计算密集）和 Decode（内存密集），同时改善吞吐量和延迟。vLLM V1 中默认启用。

```python
from vllm import LLM

llm = LLM(
    model="model-name",
    max_num_batched_tokens=2048  # 可调整
)
```

调整 `max_num_batched_tokens` 平衡 TTFT（Time To First Token）和吞吐量：
- 值大 → 吞吐量增加、TTFT 增加
- 值小 → TTFT 减少、吞吐量减少

### CUDA Graph

将重复计算模式捕获为图形减少 GPU 内核执行开销。vLLM V1 中默认启用。

```bash
vllm serve model-name --enforce-eager  # 禁用 CUDA Graph（调试用）
```

CUDA Graph 大多数情况下提供 10-20% 性能提升，但在动态序列长度模式下可能产生额外开销。

### DeepGEMM (FP8)

在 NVIDIA H100 GPU 上加速 FP8 运算的自定义 GEMM 内核。

```bash
VLLM_USE_DEEP_GEMM=1 vllm serve model-name --kv-cache-dtype=fp8
```

在 H100 上使用 FP8 模型时提供额外 20-30% 性能提升。

### 优化选项对比

<ComparisonTable
  headers={['优化技术', '吞吐量提升', 'TTFT 改善', 'GPU 内存节省', '应用难度']}
  rows={[
    { id: '1', cells: ['Prefix Caching', '+400%', '○', '○', '低（1 个标志）'], recommended: true },
    { id: '2', cells: ['FP8 量化', '+50%', '○', '50%', '低（模型选择）'], recommended: true },
    { id: '3', cells: ['Chunked Prefill', '+30%', '+20%', '-', '低（默认启用）'] },
    { id: '4', cells: ['Speculative Decoding', '+200%', '+100%', '-', '中（Draft 模型）'] },
    { id: '5', cells: ['CUDA Graph', '+15%', '○', '-', '低（默认启用）'] },
    { id: '6', cells: ['DeepGEMM', '+25%', '-', '-', '低（H100 专用）'] }
  ]}
/>

## 监控指标

vLLM 暴露 Prometheus 格式的多种指标。

### 主要指标

<SpecificationTable
  headers={['指标', '说明', '阈值示例']}
  rows={[
    { id: '1', cells: ['vllm:num_requests_running', '当前处理中的请求数', '< max_num_seqs'] },
    { id: '2', cells: ['vllm:num_requests_waiting', '等待中的请求数', '< 50（防过载）'] },
    { id: '3', cells: ['vllm:gpu_cache_usage_perc', 'GPU KV 缓存使用率', '70-90%（最优）'] },
    { id: '4', cells: ['vllm:num_preemptions_total', '被抢占的请求数', '< 10/min（越低越好）'] },
    { id: '5', cells: ['vllm:avg_prompt_throughput_toks_per_s', 'Prompt 吞吐量（tokens/sec）', '对比目标值'] },
    { id: '6', cells: ['vllm:avg_generation_throughput_toks_per_s', '生成吞吐量（tokens/sec）', '对比目标值'] },
    { id: '7', cells: ['vllm:time_to_first_token_seconds', '首个 Token 时间（TTFT）', '< 1 秒（对话服务）'] },
    { id: '8', cells: ['vllm:time_per_output_token_seconds', '每输出 Token 时间（TPOT）', '< 0.1 秒（实时流式）'] },
    { id: '9', cells: ['vllm:e2e_request_latency_seconds', '端到端请求延迟', '对比目标 SLA'] }
  ]}
/>

### 抢占（Preemption）处理

KV 缓存空间不足时 vLLM 会抢占请求释放空间。以下警告频繁出现时需要采取措施：

```
WARNING Sequence group 0 is preempted by PreemptionMode.RECOMPUTE
```

**应对方案**：
1. 增加 `gpu_memory_utilization`（0.9 → 0.95）
2. 减少 `max_num_seqs` 或 `max_num_batched_tokens`
3. 增加 `tensor_parallel_size` 确保每 GPU 内存
4. 减少 `max_model_len`（匹配实际工作负载）

:::info 详细指南
基于 Prometheus + Grafana 的监控栈配置、告警阈值设置、仪表板模板请参阅 [监控栈配置指南](../reference-architecture/integrations/monitoring-observability-setup.md)。
:::

## 相关文档

### 实战部署
- **[自定义模型部署](../reference-architecture/model-lifecycle/custom-model-deployment.md)**：Kubernetes 部署 YAML、LWS 多节点、S3 模型缓存、vLLM PP 多节点限制详情、编码特化模型部署指南
- **[自定义模型流水线](../reference-architecture/model-lifecycle/custom-model-pipeline.md)**：Multi-LoRA 热交换、客户级适配器路由、A/B 测试、S3 动态加载
- **[监控栈配置](../reference-architecture/integrations/monitoring-observability-setup.md)**：Prometheus + Grafana 设置、告警阈值、仪表板模板

### 相关技术
- **[llm-d EKS Auto Mode](./llm-d-eks-automode.md)**：vLLM + llm-d 联动实现 Disaggregated Serving
- **[MoE 模型服务](./moe-model-serving.md)**：Expert Parallelism、GLM-5/Kimi K2.5 部署策略
- **[GPU 资源管理](./gpu-resource-management.md)**：Karpenter、KEDA、GPU Operator 配置

### 参考资料
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit)：Bifrost、vLLM、Langfuse、Milvus 等 GenAI 组件部署自动化
- [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks)：llm-d、Karpenter、RAG 工作流综合架构
- [vLLM 官方文档](https://docs.vllm.ai)：优化及调优指南
- [vLLM Kubernetes 部署指南](https://docs.vllm.ai/en/stable/deployment/k8s.html)
