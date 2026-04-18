---
title: "Llama 4 FM 推理基准测试：GPU vs AWS 自研芯片"
sidebar_label: "报告 3. AI/ML 推理服务"
sidebar_position: 3
description: "对比 GPU 实例（p5、p4d、g6e）和 AWS 自研芯片（Trainium2、Inferentia2）在 vLLM 基础 Llama 4 模型服务中的性能和成本效率的基准测试"
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

# Llama 4 FM 推理基准测试：GPU vs AWS 自研芯片

> 📅 **创建日期**：2026-02-10 | **更新日期**：2026-02-14 | ⏱️ **阅读时间**：约 9 分钟

## 概述

在 AWS EKS 环境中，对基于 vLLM 的 Llama 4 模型在 5 种场景下进行推理性能对比的基准测试报告。

**一句话总结**：对于 Llama 4 Scout（109B MoE）推理，AWS 自研芯片实现了比 NVIDIA GPU **低 58-67% 的每 Token 成本**（$0.28~$0.35/1M tokens vs $0.85），而 p5/H100 提供了**最低的 TTFT（120ms）**和**最高吞吐量（4,200 tokens/sec）**，是延迟敏感工作负载的最优选择。Trainium2 以 H100 41% 的成本提供了 83% 的性能，展现了**最佳性价比**。

**5 种场景**：

- **A** p5.48xlarge — 8x NVIDIA H100 80GB（GPU 基准）
- **B** p4d.24xlarge — 8x NVIDIA A100 40GB（上一代 GPU）
- **C** g6e.48xlarge — 8x NVIDIA L40S 48GB（成本优化 GPU）
- **D** trn2.48xlarge — 16x AWS Trainium2 96GB（自研芯片 训练/推理）
- **E** inf2.48xlarge — 12x AWS Inferentia2 32GB（自研芯片 推理优化）

**核心要点**：

<MLOverviewChart locale="zh" />

---

## 测试环境

<InfraComparisonChart locale="zh" />

**集群配置**：

- **EKS 版本**：1.31
- **区域**：us-east-1（单可用区）
- **vLLM 版本**：v0.8.3+（Llama 4 首日支持，MetaShuffling 优化）
- **Neuron SDK**：2.x（Trainium2/Inferentia2 场景）
- **CUDA**：12.4（GPU 场景）
- **精度**：BF16（所有场景）
- **测量方法**：至少 3 次重复测量的中位数

---

## 测试模型

<ModelSpecChart locale="zh" />

### Llama 4 MoE 架构特性

Llama 4 采用 **Mixture of Experts（MoE）** 架构实现高效推理：

- **稀疏激活**：每个 Token 仅激活总 109B 参数中的 17B（Scout）
- **专家路由**：16 个专家中仅选择性激活 2 个，减少计算量
- **内存权衡**：所有专家权重都需要加载到显存，因此总内存需求与稠密模型相当
- **并行化策略**：支持张量并行（TP）、流水线并行（PP）、专家并行（EP）、数据并行（DP）
- **vLLM MetaShuffling**：针对 MoE 推理优化的 Token 路由和内存管理

:::info Scout 与 Maverick 部署要求

- **Scout（109B）**：可在单张 H100 80GB 上以 BF16 部署。8xH100 支持 1M 上下文
- **Maverick（400B）**：最少需要 8xH100。提供 FP8 量化版本。8xH100 支持约 430K 上下文
:::

---

## 基准测试结果

### 1. 首 Token 延迟（TTFT）

首 Token 延迟直接影响用户体验，反映了提示处理（prefill）阶段的计算性能。

<TtftChart locale="zh" />

<details>
<summary>详细数据表</summary>

**Llama 4 Scout（512 输入 Token）**

| 场景 | 实例 | TTFT（ms） | vs 基准 |
|---------|---------|-----------|----------|
| A | p5/H100 | 120 | 基准 |
| B | p4d/A100 | 280 | +133% |
| C | g6e/L40S | 350 | +192% |
| D | trn2 | 150 | +25% |
| E | inf2 | 200 | +67% |

**Llama 4 Maverick（512 输入 Token）**

| 场景 | 实例 | TTFT（ms） |
|---------|---------|-----------|
| A | p5/H100 | 250 |
| D | trn2 | 300 |

</details>

### 2. Token 间延迟（ITL）

Token 间延迟衡量解码阶段每个 Token 生成之间的延迟，决定了流式响应的流畅度。

<ItlChart locale="zh" />

<details>
<summary>详细数据表</summary>

**Llama 4 Scout**

| 场景 | ITL（ms） | vs 基准 |
|---------|----------|----------|
| A | 8 | 基准 |
| B | 18 | +125% |
| C | 22 | +175% |
| D | 10 | +25% |
| E | 14 | +75% |

**Llama 4 Maverick**

| 场景 | ITL（ms） |
|---------|----------|
| A | 12 |
| D | 15 |

</details>

### 3. 推理吞吐量

每秒生成的 Token 数表示系统的整体推理能力。对批处理和多用户服务场景至关重要。

<InferenceThroughputChart locale="zh" />

<details>
<summary>详细数据表</summary>

**Llama 4 Scout**

| 场景 | Tokens/sec | vs 基准 |
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

衡量并发请求增加时的吞吐量变化。HBM 内存带宽和加速器互联决定了扩展特性。

<ConcurrencyChart locale="zh" />

<details>
<summary>详细数据表</summary>

| 并发请求 | A：p5/H100 | B：p4d/A100 | C：g6e/L40S | D：trn2 | E：inf2 |
|----------|-----------|-------------|-------------|---------|---------|
| 1 | 4,200 | 1,800 | 1,400 | 3,500 | 2,800 |
| 4 | 14,800 | 5,600 | 4,200 | 12,500 | 9,800 |
| 8 | 24,500 | 8,400 | 6,800 | 21,000 | 16,200 |
| 16 | 35,200 | 11,200 | 8,500 | 30,800 | 22,400 |
| 32 | 42,000 | 12,800 | 9,200 | 38,500 | 28,000 |

</details>

### 5. 成本效率

每 Token 成本（$/1M tokens）通过将小时实例成本除以吞吐量计算。这是生产服务中最重要的决策指标。

<CostPerTokenChart locale="zh" />

<details>
<summary>详细数据表</summary>

**Llama 4 Scout**

| 场景 | 小时成本 | 吞吐量 | $/1M tokens | vs 基准 |
|---------|-----------|--------|------------|----------|
| A | $98.32 | 4,200 | $0.85 | 基准 |
| B | $21.96 | 1,800 | $0.72 | -15% |
| C | $54.91 | 1,400 | $0.52 | -39% |
| D | $45.00 | 3,500 | $0.35 | -59% |
| E | $12.89 | 2,800 | $0.28 | -67% |

</details>

---

## 分析与核心发现

<KeyFindingsMLChart locale="zh" />

### GPU 与自研芯片的权衡

| 方面 | GPU（H100/A100/L40S） | 自研芯片（trn2/inf2） |
|------|---------------------|---------------------------|
| **性能** | 最高原始性能（H100） | H100 的 67-83% |
| **成本** | 高（$0.52-$0.85/1M tokens） | 低（$0.28-$0.35/1M tokens） |
| **生态系统** | CUDA，丰富的库 | Neuron SDK，依赖 AWS |
| **灵活性** | 支持所有框架 | 限于 vLLM/Neuron 支持的模型 |
| **扩展性** | NVSwitch 高带宽 | NeuronLink，支持大规模集群 |
| **可用性** | 有限（供不应求） | 相对更容易获取 |

### MoE 架构对性能的影响

Llama 4 的 MoE 架构对推理性能产生以下影响：

1. **内存带宽瓶颈**：频繁的专家权重加载使 HBM 带宽成为关键瓶颈
2. **动态路由开销**：每 Token 的专家选择需要额外计算
3. **专家激活不均衡**：负载集中在特定专家时可能降低并行效率
4. **KV Cache 优化**：MoE 的稀疏激活使得 KV Cache 效率相比稠密模型更优

---

## 按工作负载的建议

<MLRecommendationChart locale="zh" />

### 场景选择指南

```
工作负载需求检查
├── 需要最低延迟？ ──→ A：p5/H100（120ms TTFT）
├── 最低成本优先？ ──→ E：inf2（$0.28/1M tokens）
├── 性能/成本平衡？ ──→ D：trn2（83% 性能，41% 成本）
├── Maverick（400B）服务？ ──→ A：p5/H100 或 D：trn2
├── 多模型服务？ ──→ C：g6e/L40S（48GB/GPU）
└── 现有 GPU 基础设施？ ──→ B：p4d/A100（性价比 GPU）
```

---

## 配置说明

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

### Neuron SDK 兼容性说明

:::warning Neuron SDK 版本管理

- Trainium2/Inferentia2 需要 AWS Neuron SDK 2.x 或更高版本
- vLLM 的 Neuron 后端需要单独安装：`pip install vllm[neuron]`
- 并非所有 Llama 4 模型都在 Neuron 上验证过——请查看官方兼容性列表
- FP8 量化仅在 GPU 场景中支持（Maverick）
:::

### 成本优化策略

1. **Spot 实例使用**：批量推理工作负载可节省 50-70% 成本（可接受中断时）
2. **EC2 Capacity Blocks**：为 Trainium2 实例预留分配以确保可用性
3. **自动扩缩**：基于 Karpenter + KEDA 的 GPU 指标扩缩（详见：[GPU 资源管理](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management)）
4. **模型量化**：通过 FP8/INT8 量化减少内存使用并提升吞吐量

---

## 参考资料

- [Meta AI — Llama 4 官方公告](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
- [vLLM — Llama 4 首日支持](https://blog.vllm.ai/2025/04/05/llama4.html)
- [PyTorch — MetaShuffling MoE 优化](https://pytorch.org/blog/metashuffling-accelerating-llama-4-moe-inference/)
- [AWS EC2 P5 实例](https://aws.amazon.com/ec2/instance-types/p5/)
- [AWS EC2 Trn2 实例](https://aws.amazon.com/ec2/instance-types/trn2/)
- [AWS EC2 Inf2 实例](https://aws.amazon.com/ec2/instance-types/inf2/)
- [AWS Neuron SDK 文档](https://awsdocs-neuron.readthedocs-hosted.com/)
- [NVIDIA — Llama 4 推理加速](https://developer.nvidia.com/blog/nvidia-accelerates-inference-on-meta-llama-4-scout-and-maverick/)
- [vLLM 模型服务指南](/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving)
- [GPU 资源管理](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management)

:::note 数据可靠性声明
本基准测试中的数据是基于 Meta、AWS、NVIDIA 和 vLLM 项目发布的规格和基准数据的**估算值**。实际性能可能因工作负载特性、输入长度、批次大小和模型配置而异。建议在生产部署前在实际环境中进行基准测试。
:::
