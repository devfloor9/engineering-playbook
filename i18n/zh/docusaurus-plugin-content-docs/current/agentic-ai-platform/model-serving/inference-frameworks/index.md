---
title: "推理框架"
sidebar_label: "推理框架"
description: "vLLM·llm-d·MoE·NeMo — 在 GPU 上实际进行模型服务·分布式推理·微调的 AI 框架层"
tags: [vllm, llm-d, moe, nemo, inference, fine-tuning, 'scope:tech']
sidebar_position: 2
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 推理框架

在 [GPU 基础设施](../gpu-infrastructure)上实际进行 **LLM 服务·分布式推理·微调**的 AI 框架层。包括单节点高性能服务（vLLM）、Kubernetes 原生分布式推理（llm-d）、MoE 模型处理、基于 NVIDIA NeMo 的训练等。

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving"
    icon="🚀"
    title="vLLM 模型服务"
    description="基于 PagedAttention 的高性能 LLM 推理、Continuous Batching、Tensor/Pipeline Parallelism、Multi-LoRA 热插拔。"
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode"
    icon="🔀"
    title="llm-d 分布式推理"
    description="Kubernetes 原生分布式推理调度器、KV Cache-aware 路由、Prefix Cache 优化、Disaggregated Serving。"
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/moe-model-serving"
    icon="🧩"
    title="MoE 模型服务"
    description="Mixture of Experts 模型高效服务 — Expert Parallelism、动态路由、内存优化。"
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/nemo-framework"
    icon="🧠"
    title="NeMo 框架"
    description="基于 NVIDIA NeMo 的大规模训练·微调、分布式学习、EFA 高速网络、检查点保存。"
    color="#9c27b0"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/semantic-caching-strategy"
    icon="⚡"
    title="Semantic Caching 策略"
    description="LLM Gateway 级别语义缓存 — 相似度阈值设计、3 层缓存划分（KV/Prompt/Semantic）、可观测性·安全指南。"
    color="#22c55e"
  />
</DocCardGrid>

:::tip 学习顺序
按 **vLLM → llm-d → MoE → NeMo** 顺序阅读，可以遵循"单节点优化 → 分布式推理 → 大规模 MoE → 训练框架"的渐进难度。
:::
