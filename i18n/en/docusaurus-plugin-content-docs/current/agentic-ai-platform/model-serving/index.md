---
title: "Model Serving & Inference Infrastructure"
sidebar_label: "Model Serving & Inference Infrastructure"
description: "EKS-based GPU node strategy, vLLM/llm-d inference engines, MoE serving, and NVIDIA GPU stack guide"
tags: [model-serving, gpu, vllm, llm-d, inference, eks]
sidebar_position: 2
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Model Serving & Inference Infrastructure

This section covers how to deploy and serve LLMs on GPUs and accelerators. It is organized sequentially from the EKS infrastructure layer through inference engines, distributed serving, GPU software stack, and training frameworks.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU Node Strategy"
    description="Optimal node strategies for GPU workloads across Auto Mode, Karpenter, Managed Node Group, and Hybrid Nodes. Includes security hardening and troubleshooting guides."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management"
    icon="📊"
    title="GPU Resource Management"
    description="Karpenter-based GPU node scaling, KEDA autoscaling, DRA dynamic resource allocation, and Spot/Consolidation cost optimization strategies."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving"
    icon="🚀"
    title="vLLM Model Serving"
    description="High-performance LLM inference engine based on PagedAttention. Covers model deployment, performance optimization, Continuous Batching, and Tensor Parallelism configuration."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode"
    icon="🔀"
    title="llm-d Distributed Inference"
    description="Kubernetes-native distributed inference scheduler. KV Cache-aware routing, Prefix Cache optimization, and Disaggregated Serving architecture."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/moe-model-serving"
    icon="🧩"
    title="MoE Model Serving"
    description="Efficient serving of Mixture of Experts models. Expert Parallelism, dynamic routing, and memory optimization strategies."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU Stack"
    description="Guide to the NVIDIA GPU software stack including GPU Operator, DCGM monitoring, MIG/Time-Slicing partitioning, and the Dynamo inference framework."
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/nemo-framework"
    icon="🧠"
    title="NeMo Framework"
    description="Large-scale model training and fine-tuning with NVIDIA NeMo. Distributed training, EFA high-speed networking, and checkpointing strategies."
    color="#9c27b0"
  />
</DocCardGrid>

:::tip Learning Order
Start from infrastructure: Reading in the order **EKS GPU Node Strategy** → **GPU Resource Management** → **vLLM Model Serving** → **llm-d Distributed Inference** will help you understand the full flow of building inference services on GPU infrastructure.
:::
