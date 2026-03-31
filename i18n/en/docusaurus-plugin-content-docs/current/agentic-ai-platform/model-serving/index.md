---
title: "Model Serving & Inference Infrastructure"
sidebar_label: "Model Serving & Inference"
sidebar_position: 2
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Model Serving & Inference Infrastructure

This section covers deploying and serving LLMs on GPUs/accelerators. It is structured sequentially from the EKS infrastructure layer through inference engines, distributed serving, GPU software stack, to training frameworks.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU Node Strategy"
    description="Optimal node strategies for GPU workloads: Auto Mode, Karpenter, Managed Node Group, Hybrid Node. Includes security hardening and troubleshooting guides."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-resource-management"
    icon="📊"
    title="GPU Resource Management"
    description="Karpenter-based GPU node scaling, KEDA autoscaling, DRA dynamic resource allocation, Spot/Consolidation cost optimization strategies."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/vllm-model-serving"
    icon="🚀"
    title="vLLM Model Serving"
    description="High-performance LLM inference engine based on PagedAttention. Model deployment, performance optimization, Continuous Batching, Tensor Parallelism configuration guide."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/llm-d-eks-automode"
    icon="🔀"
    title="llm-d Distributed Inference"
    description="Kubernetes-native distributed inference scheduler. KV Cache-aware routing, Prefix Cache optimization, Disaggregated Serving architecture."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/moe-model-serving"
    icon="🧩"
    title="MoE Model Serving"
    description="Efficient serving of Mixture of Experts models. Expert Parallelism, dynamic routing, memory optimization strategies."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU Stack"
    description="NVIDIA GPU software stack guide including GPU Operator, DCGM monitoring, MIG/Time-Slicing partitioning, Dynamo inference framework."
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/nemo-framework"
    icon="🧠"
    title="NeMo Framework"
    description="Large-scale model training and fine-tuning based on NVIDIA NeMo. Distributed training, EFA high-speed networking, checkpointing strategies."
    color="#9c27b0"
  />
</DocCardGrid>

:::tip Learning Sequence
Start from infrastructure: Reading in the sequence **EKS GPU Node Strategy** → **GPU Resource Management** → **vLLM Model Serving** → **llm-d Distributed Inference** will help you understand the complete flow of building inference services on GPU infrastructure.
:::
