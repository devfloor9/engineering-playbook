---
title: Inference Frameworks
description: vLLM·llm-d·MoE·NeMo — AI framework layer for actual model serving, distributed inference, and fine-tuning on GPUs
created: "2026-04-17"
last_update:
  date: 2026-10-13
  author: devfloor9
reading_time: 4
tags:
  - vllm
  - llm-d
  - moe
  - nemo
  - inference
  - fine-tuning
  - serving
  - scope:tech
sidebar_label: Inference Frameworks
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

The AI framework layer on top of [Accelerated Computing Infrastructure](../gpu-infrastructure/index.md) that actually performs **LLM serving, distributed inference, and fine-tuning**. Covers single-node high-performance serving (vLLM), Kubernetes-native distributed inference (llm-d), MoE model processing, NVIDIA NeMo-based training, and operating criteria for reasoning and tool-call output boundaries of reasoning models.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving"
    icon="🚀"
    title="vLLM Model Serving"
    description="High-performance LLM inference with PagedAttention, Continuous Batching, Tensor/Pipeline Parallelism, Multi-LoRA hot-swapping."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/reasoning-tool-output-parsing"
    icon="🧹"
    title="Reasoning & Tool-Call Output Integrity"
    description="Classifies why reasoning and tool calls leak into answers across the model, template, parser, API, and client layers, and prevents it with engine settings, validation, and a remediation layer."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode"
    icon="🔀"
    title="llm-d Distributed Inference"
    description="Kubernetes-native distributed inference scheduler, KV Cache-aware routing, prefix cache optimization, Disaggregated Serving."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/hyperpod-inference-operator"
    icon="⚙️"
    title="HyperPod Inference Operator"
    description="SageMaker HyperPod managed KV cache, intelligent routing (prefix-aware/kv-aware), and DPD. How it differs from the Tiered Gateway and its role as the L2 routing layer."
    color="#f59e0b"
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
</DocCardGrid>

:::tip Reading Order
Reading in **vLLM → Reasoning & Tool-Call Output Integrity → llm-d → HyperPod Inference Operator → MoE → NeMo** order follows the progressive difficulty of "single-node optimization → output boundary operations → distributed inference → managed inference routing → large-scale MoE → training framework."
:::
