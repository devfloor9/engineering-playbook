---
title: "模型服务与推理基础设施"
sidebar_label: "模型服务与推理基础设施"
description: "EKS GPU 节点策略、vLLM/llm-d 推理引擎、MoE 服务、NVIDIA GPU 堆栈指南"
tags: [model-serving, gpu, vllm, llm-d, inference, eks]
sidebar_position: 2
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 模型服务与推理基础设施

介绍如何在 GPU/加速器上部署和服务 LLM。从 EKS 基础设施层到推理引擎、分布式服务、GPU 软件栈、训练框架，按顺序组织。

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU 节点策略"
    description="Auto Mode、Karpenter、Managed Node Group、Hybrid Node 的 GPU 工作负载最优节点策略。包含安全加固及故障排除指南。"
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-resource-management"
    icon="📊"
    title="GPU 资源管理"
    description="基于 Karpenter 的 GPU 节点伸缩、KEDA 自动伸缩、DRA 动态资源分配、Spot/Consolidation 成本优化策略。"
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/vllm-model-serving"
    icon="🚀"
    title="vLLM 模型服务"
    description="基于 PagedAttention 的高性能 LLM 推理引擎。模型部署、性能优化、Continuous Batching、Tensor Parallelism 配置指南。"
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/llm-d-eks-automode"
    icon="🔀"
    title="llm-d 分布式推理"
    description="Kubernetes 原生分布式推理调度器。KV Cache 感知路由、Prefix Cache 优化、Disaggregated Serving 架构。"
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/moe-model-serving"
    icon="🧩"
    title="MoE 模型服务"
    description="Mixture of Experts 模型的高效服务。Expert Parallelism、动态路由、内存优化策略。"
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU 堆栈"
    description="GPU Operator、DCGM 监控、MIG/Time-Slicing 分区、Dynamo 推理框架等 NVIDIA GPU 软件栈指南。"
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/nemo-framework"
    icon="🧠"
    title="NeMo 框架"
    description="基于 NVIDIA NeMo 的大规模模型训练与微调。分布式训练、EFA 高速网络、检查点策略。"
    color="#9c27b0"
  />
</DocCardGrid>

:::tip 学习顺序
从基础设施开始：**EKS GPU 节点策略** → **GPU 资源管理** → **vLLM 模型服务** → **llm-d 分布式推理**，按此顺序阅读可以理解在 GPU 基础设施上构建推理服务的完整流程。
:::
