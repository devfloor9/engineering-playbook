---
title: "Model Serving & Inference Infrastructure"
sidebar_label: "Model Serving & Inference Infrastructure"
description: "Model serving guide divided into GPU infrastructure layer and inference/training framework layer"
created: 2026-03-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - model-serving
  - gpu
  - vllm
  - llm-d
  - inference
  - eks
  - scope:tech
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Methods for deploying and serving LLMs on GPUs and accelerators are covered in two layers.

- **GPU Infrastructure Layer**: The layer that manages GPU instances, drivers, schedulers, and partitioning on top of Kubernetes. Determines which nodes get GPU allocation and how.
- **Inference Framework Layer**: The AI framework layer that actually serves models, performs distributed inference, and fine-tunes on the secured GPUs. vLLM, llm-d, MoE, and NeMo belong here.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure"
    icon="🖥️"
    title="GPU Infrastructure"
    description="EKS GPU node strategy, Karpenter·KEDA·DRA-based resource management, NVIDIA GPU stack (ClusterPolicy·DCGM·MIG·Time-Slicing), AWS Neuron Stack (Trainium2/Inferentia2)."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks"
    icon="🚀"
    title="Inference Frameworks"
    description="vLLM PagedAttention·Multi-LoRA, llm-d distributed inference·KV Cache-aware routing, MoE model serving, NVIDIA NeMo training·fine-tuning framework."
    color="#ff6b6b"
  />
</DocCardGrid>

:::tip Learning Order
Reading in the order **GPU Infrastructure → Inference Frameworks** is natural. First decide "which nodes, partitioning, and driver stack to use" in GPU Infrastructure, then cover "how to deploy vLLM and llm-d on top of that" in Inference Frameworks.
:::
