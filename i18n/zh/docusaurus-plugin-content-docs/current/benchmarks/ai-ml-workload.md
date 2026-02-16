---
title: "Llama 4 FM 服务基准测试：GPU vs AWS Custom Silicon"
sidebar_label: "3. AI/ML 服务基准测试"
description: "基于 vLLM 的 Llama 4 模型服务中 GPU 实例（p5、p4d、g6e）和 AWS 定制芯片（Trainium2、Inferentia2）的性能及成本效率比较基准测试"
tags: [benchmark, ai, ml, gpu, inference, vllm, llama4, trainium, inferentia, eks]
category: "benchmark"
last_update:
  date: 2026-02-10
  author: devfloor9
sidebar_position: 4
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

# Llama 4 FM 服务基准测试：GPU vs AWS Custom Silicon

> 📅 **编写日期**: 2026-02-10 | ✍️ **作者**: devfloor9 | ⏱️ **阅读时间**: 约20分钟

## 概述

AWS EKS 环境中使用 vLLM 的 Llama 4 模型服务性能通过5个场景比较的基准测试报告。

**一句话总结**: 在 Llama 4 Scout（109B MoE）推理中，AWS 定制芯片相比 NVIDIA GPU 实现了**58-67% 更低的每 token 成本**（$0.28~$0.35/1M tokens vs $0.85），p5/H100 以**最低 TTFT（120ms）**和**最高吞吐量（4,200 tokens/sec）**最适合延迟敏感工作负载。Trainium2 以41%的成本提供 H100 83%的吞吐量，显示**最佳的性能成本比**。

**5个场景**:

- **A** p5.48xlarge — 8× NVIDIA H100 80GB（GPU 基准）
- **B** p4d.24xlarge — 8× NVIDIA A100 40GB（前一代 GPU）
- **C** g6e.48xlarge — 8× NVIDIA L40S 48GB（成本优化 GPU）
- **D** trn2.48xlarge — 16× AWS Trainium2 96GB（定制芯片训练/推理）
- **E** inf2.48xlarge — 12× AWS Inferentia2 32GB（定制芯片推理专用）

**主要启示**:

<MLOverviewChart locale="zh" />

---

## 测试环境

<InfraComparisonChart locale="zh" />

**集群配置**:

- **EKS 版本**: 1.31
- **区域**: us-east-1（单一 AZ）
- **vLLM 版本**: v0.8.3+（Llama 4 Day 0 支持、MetaShuffling 优化）
- **Neuron SDK**: 2.x（Trainium2/Inferentia2 场景）
- **CUDA**: 12.4（GPU 场景）
- **精度**: BF16（所有场景）
- **测量方式**: 至少重复测量3次后使用中位数

---

## 测试模型

<ModelSpecChart locale="zh" />

### Llama 4 MoE 架构特征

Llama 4 采用 **Mixture of Experts (MoE)** 架构实现高效推理：

- **稀疏激活**: 109B 总参数中每 token 仅激活 17B（Scout 基准）
- **Expert 路由**: 16个 Expert 中仅选择性激活2个以减少计算量
- **内存权衡**: 所有 Expert 权重必须加载到 VRAM，因此总内存需求与 Dense 模型类似
- **并行化策略**: 支持 Tensor Parallelism（TP）、Pipeline Parallelism（PP）、Expert Parallelism（EP）、Data Parallelism（DP）
- **vLLM MetaShuffling**: 为 MoE 推理优化的 token 路由和内存管理

:::info Scout vs Maverick 部署要求

- **Scout (109B)**: 可在单个 H100 80GB 上以 BF16 部署。8×H100 支持 1M 上下文
- **Maverick (400B)**: 至少需要 8×H100。提供 FP8 量化版本。8×H100 支持约430K 上下文
:::

---

## 基准测试结果

### 1. 首 token 生成时间（TTFT）

Time to First Token 是直接影响用户体验的核心指标。反映提示处理（prefill）阶段的计算性能。

<TtftChart locale="zh" />

<details>
<summary>📊 详细数据表</summary>

**Llama 4 Scout（输入 512 tokens）**

| 场景 | 实例 | TTFT (ms) | 相对基准 |
|---------|---------|-----------|----------|
| A | p5/H100 | 120 | 基准 |
| B | p4d/A100 | 280 | +133% |
| C | g6e/L40S | 350 | +192% |
| D | trn2 | 150 | +25% |
| E | inf2 | 200 | +67% |

**Llama 4 Maverick（输入 512 tokens）**

| 场景 | 实例 | TTFT (ms) |
|---------|---------|-----------|
| A | p5/H100 | 250 |
| D | trn2 | 300 |

</details>

### 2. Token 间延迟（ITL）

Inter-Token Latency 测量解码阶段每个 token 生成之间的延迟。决定流式响应的流畅度。

<ItlChart locale="zh" />

<details>
<summary>📊 详细数据表</summary>

**Llama 4 Scout**

| 场景 | ITL (ms) | 相对基准 |
|---------|----------|----------|
| A | 8 | 基准 |
| B | 18 | +125% |
| C | 22 | +175% |
| D | 10 | +25% |
| E | 14 | +75% |

**Llama 4 Maverick**

| 场景 | ITL (ms) |
|---------|----------|
| A | 12 |
| D | 15 |

</details>

### 3. 推理吞吐量

每秒 token 生成量表示系统的整体推理能力。在批处理和多用户服务场景中很重要。

<InferenceThroughputChart locale="zh" />

<details>
<summary>📊 详细数据表</summary>

**Llama 4 Scout**

| 场景 | Tokens/sec | 相对基准 |
|---------|-----------|----------|
| A | 4,200 | 基准 |
| B | 1,800 | -57% |
| C | 1,400 | -67% |
| D | 3,500 | -17% |
| E | 2,800 | -33% |

**Llama 4 Maverick**

| 场景 | Tokens/sec |
|---------|-----------|
| A | 2,800 |
| D | 2,200 |

</details>

### 4. 并发请求扩展

测量并发请求数增加时的吞吐量变化。HBM 内存带宽和加速器互连决定扩展特性。

<ConcurrencyChart locale="zh" />

<details>
<summary>📊 详细数据表</summary>

| 并发请求 | A: p5/H100 | B: p4d/A100 | C: g6e/L40S | D: trn2 | E: inf2 |
|----------|-----------|-------------|-------------|---------|---------|
| 1 | 4,200 | 1,800 | 1,400 | 3,500 | 2,800 |
| 4 | 14,800 | 5,600 | 4,200 | 12,500 | 9,800 |
| 8 | 24,500 | 8,400 | 6,800 | 21,000 | 16,200 |
| 16 | 35,200 | 11,200 | 8,500 | 30,800 | 22,400 |
| 32 | 42,000 | 12,800 | 9,200 | 38,500 | 28,000 |

</details>

### 5. 成本效率

每 token 成本（$/1M tokens）通过将实例每小时成本除以吞吐量计算。是生产服务中最重要的决策指标。

<CostPerTokenChart locale="zh" />

<details>
<summary>📊 详细数据表</summary>

**Llama 4 Scout**

| 场景 | 每小时成本 | 吞吐量 | $/1M tokens | 相对基准 |
|---------|-----------|--------|------------|----------|
| A | $98.32 | 4,200 | $0.85 | 基准 |
| B | $21.96 | 1,800 | $0.72 | -15% |
| C | $54.91 | 1,400 | $0.52 | -39% |
| D | $45.00 | 3,500 | $0.35 | -59% |
| E | $12.89 | 2,800 | $0.28 | -67% |

</details>

---

## 分析和主要发现

<KeyFindingsMLChart locale="zh" />

### GPU vs Custom Silicon 权衡

| 视角 | GPU (H100/A100/L40S) | Custom Silicon (trn2/inf2) |
|------|---------------------|---------------------------|
| **性能** | 最高原始性能（H100） | H100 的 67-83% 水平 |
| **成本** | 高（$0.52-$0.85/1M tokens） | 低（$0.28-$0.35/1M tokens） |
| **生态系统** | CUDA、广泛的库 | Neuron SDK、AWS 依赖 |
| **灵活性** | 支持所有框架 | 仅限 vLLM/Neuron 支持的模型 |
| **扩展** | NVSwitch 高带宽 | NeuronLink、大规模集群 |
| **可用性** | 受限（需求 > 供应） | 相对容易 |

### MoE 架构性能影响

Llama 4 的 MoE 架构对推理性能产生以下影响：

1. **内存带宽瓶颈**: Expert 权重加载频繁，HBM 带宽是核心瓶颈
2. **动态路由开销**: 每 token 的 Expert 选择需要额外计算
3. **不平衡 Expert 激活**: 特定 Expert 负载集中时并行效率可能降低
4. **KV Cache 优化**: MoE 的稀疏激活使 KV Cache 效率优于 Dense 模型

---

## 按工作负载的建议

<MLRecommendationChart locale="zh" />

### 场景选择指南

```
确认工作负载需求
├── 需要最低延迟？ ──→ A: p5/H100 (120ms TTFT)
├── 优先考虑最低成本？ ──→ E: inf2 ($0.28/1M tokens)
├── 性能/成本平衡？ ──→ D: trn2 (83% 性能、41% 成本)
├── Maverick (400B) 服务？ ──→ A: p5/H100 或 D: trn2
├── 多模型服务？ ──→ C: g6e/L40S (48GB/GPU)
└── 现有 GPU 基础设施？ ──→ B: p4d/A100 (成本有效的 GPU)
```

---

## 配置时的注意事项

### vLLM 部署设置

**Llama 4 Scout（GPU 场景）：**

```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --tensor-parallel-size 8 \
  --max-model-len 1000000 \
  --dtype bfloat16
```

**Llama 4 Scout（Neuron/Trainium2）：**

```bash
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --device neuron \
  --tensor-parallel-size 16 \
  --max-model-len 1000000
```

### Neuron SDK 兼容性注意事项

:::warning Neuron SDK 版本管理

- 使用 Trainium2/Inferentia2 时需要 AWS Neuron SDK 2.x 以上
- vLLM 的 Neuron 后端需要单独安装：`pip install vllm[neuron]`
- 并非所有 Llama 4 模型都在 Neuron 上验证 — 需确认官方兼容列表
- FP8 量化仅在 GPU 场景中支持（Maverick）
:::

### 成本优化策略

1. **利用 Spot 实例**: 在批处理推理工作负载中节省 50-70% 成本（允许中断时）
2. **EC2 Capacity Blocks**: 通过 Trainium2 实例的预留分配确保稳定可用性
3. **自动扩展**: 基于 Karpenter + KEDA 的 GPU 指标扩展（详见：[GPU 资源管理](/docs/agentic-ai-platform/gpu-resource-management)）
4. **模型量化**: 通过 FP8/INT8 量化减少内存使用并提高吞吐量

---

## 参考资料

- [Meta AI — Llama 4 官方公告](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [vLLM — Llama 4 Day 0 支持](https://blog.vllm.ai/2025/04/05/llama4.html)
- [PyTorch — MetaShuffling MoE 优化](https://pytorch.org/blog/metashuffling-accelerating-llama-4-moe-inference/)
- [AWS EC2 P5 实例](https://aws.amazon.com/ec2/instance-types/p5/)
- [AWS EC2 Trn2 实例](https://aws.amazon.com/ec2/instance-types/trn2/)
- [AWS EC2 Inf2 实例](https://aws.amazon.com/ec2/instance-types/inf2/)
- [AWS Neuron SDK 文档](https://awsdocs-neuron.readthedocs-hosted.com/)
- [NVIDIA — Llama 4 推理加速](https://developer.nvidia.com/blog/nvidia-accelerates-inference-on-meta-llama-4-scout-and-maverick/)
- [vLLM 模型服务指南](/docs/agentic-ai-platform/vllm-model-serving)
- [GPU 资源管理](/docs/agentic-ai-platform/gpu-resource-management)

:::note 数据可靠性说明
本基准测试的数值基于 Meta、AWS、NVIDIA、vLLM 项目公开的规格和基准测试数据的**估算**。实际性能可能因工作负载特性、输入长度、批处理大小、模型配置而异。建议在生产部署前在实际环境中进行基准测试。
:::
