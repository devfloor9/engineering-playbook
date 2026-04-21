---
title: "Inference Frameworks"
sidebar_label: "Inference Frameworks"
description: "vLLM·llm-d·MoE·NeMo — AI framework layer for actual model serving, distributed inference, and fine-tuning on GPUs"
tags: [vllm, llm-d, moe, nemo, inference, fine-tuning, 'scope:tech']
sidebar_position: 2
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Inference Frameworks

The AI framework layer on top of [GPU Infrastructure](../gpu-infrastructure/index.md) that actually performs **LLM serving, distributed inference, and fine-tuning**. Covers single-node high-performance serving (vLLM), Kubernetes-native distributed inference (llm-d), MoE model processing, and NVIDIA NeMo-based training.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving"
    icon="🚀"
    title="vLLM Model Serving"
    description="High-performance LLM inference with PagedAttention, Continuous Batching, Tensor/Pipeline Parallelism, Multi-LoRA hot-swapping."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode"
    icon="🔀"
    title="llm-d Distributed Inference"
    description="Kubernetes-native distributed inference scheduler, KV Cache-aware routing, Prefix Cache optimization, Disaggregated Serving."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/moe-model-serving"
    icon="🧩"
    title="MoE Model Serving"
    description="Efficient serving of Mixture of Experts models — Expert Parallelism, dynamic routing, memory optimization."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/nemo-framework"
    icon="🧠"
    title="NeMo Framework"
    description="Large-scale training and fine-tuning with NVIDIA NeMo, distributed training, EFA high-speed networking, checkpointing."
    color="#9c27b0"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/semantic-caching-strategy"
    icon="⚡"
    title="Semantic Caching Strategy"
    description="LLM Gateway-level semantic caching — similarity threshold design, 3-layer cache distinction (KV/Prompt/Semantic), observability & security guide."
    color="#22c55e"
  />
</DocCardGrid>

:::tip Reading Order
Reading in **vLLM → llm-d → MoE → NeMo** order follows the progressive difficulty of "single-node optimization → distributed inference → large-scale MoE → training framework."
:::
