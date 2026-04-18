---
title: "GPU 基础设施"
sidebar_label: "GPU 基础设施"
description: "EKS GPU 节点策略、Karpenter·KEDA·DRA 资源管理、NVIDIA GPU 栈、AWS Neuron 栈"
tags: [gpu, eks, karpenter, gpu-operator, neuron, 'scope:tech']
sidebar_position: 0
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# GPU 基础设施

在 Kubernetes 上处理**使用哪些 GPU 实例·如何调度·使用哪些驱动和分区栈进行管理**的层次。只有建立了这一层，上层的推理框架（vLLM·llm-d 等）才能稳定运行。

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU 节点策略"
    description="Auto Mode vs Karpenter vs Managed Node Group vs Hybrid Node — 按工作负载选择最佳节点、安全强化、故障排查。"
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management"
    icon="📊"
    title="GPU 资源管理"
    description="Karpenter NodePool、KEDA 扩展、DRA 动态资源分配、Spot/Consolidation 成本优化策略。"
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU 栈"
    description="GPU Operator ClusterPolicy、DCGM 监控、MIG·Time-Slicing 分区、Dynamo 推理框架。"
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/aws-neuron-stack"
    icon="🧭"
    title="AWS Neuron 栈"
    description="Trainium2/Inferentia2、Neuron SDK 2.x、aws-neuron-device-plugin、NxD Inference、vLLM Neuron backend。"
    color="#ff9900"
  />
</DocCardGrid>

:::tip 选择指南
如果以 NVIDIA 为中心，请按**节点策略 → 资源管理 → NVIDIA 栈**顺序阅读；如果考虑 AWS 定制芯片（Trainium/Inferentia），请按**节点策略 → Neuron 栈**顺序阅读。
:::
