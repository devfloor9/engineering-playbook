---
title: "自定义模型部署指南"
sidebar_label: "模型部署"
description: "基于 GLM-5.1 案例 — 大型开源模型 EKS 部署实战指南"
tags: [deployment, glm-5, vllm, eks, gpu, lws, lessons-learned]
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

# 自定义模型部署指南

本文档是在 EKS 上使用 vLLM 部署大型开源模型的实战指南。以 **GLM-5.1 744B MoE FP8** 模型部署案例为示例，同样的模式可应用于其他大型模型（DeepSeek-V3、Mixtral、Qwen-MoE 等）。

:::info 本指南的目的
本文档不是"这样做就行"，而是聚焦于"遇到了这些问题，这样解决的"。帮助提前了解实际生产部署中可能遇到的问题并做好应对。
:::

## 1. 模型选择标准

部署模型选择时评估以下标准。

| 标准 | 确认事项 | 备注 |
|------|----------|------|
| **许可** | MIT、Apache 2.0 等商业可用性 | 部分模型为非商业许可 |
| **模型大小（VRAM）** | FP8/FP16 基准所需 VRAM | 直接影响 GPU 实例选择 |
| **vLLM 兼容性** | vLLM 官方支持与否、transformers 版本 | 不支持时需自定义镜像 |
| **基准性能** | 目标任务（编码、推理、对话等）基准 | SWE-bench、HumanEval 等 |
| **上下文长度** | 支持的最大 Token 数 | 推荐 200K+（Agentic 工作负载）|
| **MoE 结构** | 总参数 vs 激活参数 | MoE VRAM 对比性能效率高 |

### 示例：GLM-5.1 主要特点

- **GLM-5.1 = GLM-5 相同权重**：仅添加了编码任务特化的 post-training RL
- **744B MoE（40B active）**：256 experts 中每 Token 激活 8 个
- **HuggingFace**：`zai-org/GLM-5-FP8`
- **许可**：MIT License
- **上下文**：200K Token 支持
- **性能**：Agentic Coding 基准开源第 1（55.00 分），SWE-bench 77.8%（GPT-4o 57.0%）

:::tip 为什么选择 GLM-5.1？
MIT 许可可商业使用，Agentic Coding 任务中超越 OpenAI GPT-4o 的性能。特别是 SWE-bench 分数 77.8% 在代码生成和 Bug 修复任务中显示优势。
:::

:::info 自动模型分流
使用 LLM Classifier 时客户端通过单一端点（`/v1`）请求，根据 Prompt 内容自动选择 SLM/LLM。简单请求路由到 Qwen3-4B（L4 $0.3/hr），复杂请求（重构、架构、设计等）路由到 GLM-5 744B（H200 $12/hr）。配置请参阅 [网关配置指南](../inference-gateway/setup)。
:::

### 模型规格（GLM-5.1 示例）

| 项目 | 详情 |
|------|------|
| 参数 | 744B（总）/ 40B（激活）|
| MoE 结构 | 256 experts，top-8 routing |
| 精度 | FP8 |
| 模型大小 | ~704GB（权重）|
| 所需 VRAM | ~744GB（单节点加载）|
| 最少 GPU | H200 8 个（1,128GB）或 B200 8 个（1,536GB）|

## 2. GPU 实例选择矩阵

部署大型模型时最重要的选择是 GPU 实例类型。根据模型 VRAM 需求选择实例。

| 实例 | GPU | VRAM | 744B 模型单节点？ | PP=2 多节点 | Spot 价格（us-east-2）| 推荐度 |
|---------|-----|------|-------------------|--------------|---------------------|--------|
| p5.48xlarge | H100×8 | 640GB | 否（744GB 大于 640GB）| 有 vLLM 死锁风险 | $12/hr | 注意 |
| p5en.48xlarge | H200×8 | 1,128GB | 是 | 是（不需要）| $12/hr | 最优 |
| p6-b200.48xlarge | B200×8 | 1,536GB | 是 | 是（不需要）| $18/hr | 充裕 |

:::warning VRAM 不足实例使用注意
模型 VRAM 需求超过实例 VRAM 时需要 PP（Pipeline Parallelism）多节点。但 vLLM V1 引擎的多节点 PP 死锁问题（第 6 节参考）使得稳定部署困难。**推荐选择 VRAM 充足的实例进行单节点部署。**
:::

### 实例选择原则

**选择 VRAM 充足的最低价 Spot 实例。**

1. **价格相同**：p5en Spot 和 p5 Spot 同为 $12/hr 时选择 VRAM 更大的 p5en
2. **VRAM 余量**：确保模型大小 1.5 倍以上 VRAM（KV Cache 空间）
3. **简单性**：消除多节点复杂度
4. **稳定性**：规避 PP 死锁问题

## 3. EKS 部署模式选择

EKS Auto Mode vs Standard Mode 的选择取决于要使用的 GPU 实例。

详细的 GPU 节点策略请参阅 [EKS GPU 节点策略](../../model-serving/gpu-infrastructure/eks-gpu-node-strategy.md)。

本文档的详细内容（YAML 清单、故障排除、LWS 多节点配置等）由于篇幅原因请参阅[韩文原文](/docs/agentic-ai-platform/reference-architecture/model-lifecycle/custom-model-deployment)。

---

## 参考资料

- [vLLM 官方文档](https://docs.vllm.ai/)
- [GLM-5 HuggingFace](https://huggingface.co/zai-org/GLM-5-FP8)
- [EKS Auto Mode 文档](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- [LeaderWorkerSet CRD](https://github.com/kubernetes-sigs/lws)
