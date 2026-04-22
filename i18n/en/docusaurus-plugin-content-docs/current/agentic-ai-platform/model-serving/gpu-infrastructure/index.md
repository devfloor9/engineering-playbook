---
title: "GPU Infrastructure"
sidebar_label: "GPU Infrastructure"
description: "EKS GPU node strategy, Karpenter·KEDA·DRA resource management, NVIDIA GPU stack, AWS Neuron stack"
created: 2026-04-17
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - gpu
  - eks
  - karpenter
  - gpu-operator
  - neuron
  - scope:tech
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

The layer that determines **which GPU instances · how to schedule · and which driver/partitioning stack to manage** on Kubernetes. This layer must be established for upper-layer inference frameworks (vLLM, llm-d, etc.) to run stably.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU Node Strategy"
    description="Auto Mode vs Karpenter vs Managed Node Group vs Hybrid Node — optimal node selection by workload, security hardening, troubleshooting."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management"
    icon="📊"
    title="GPU Resource Management"
    description="Karpenter NodePool, KEDA scaling, DRA dynamic resource allocation, Spot/Consolidation cost optimization strategies."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU Stack"
    description="GPU Operator ClusterPolicy, DCGM monitoring, MIG·Time-Slicing partitioning, Dynamo inference framework."
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/aws-neuron-stack"
    icon="🧭"
    title="AWS Neuron Stack"
    description="Trainium2/Inferentia2, Neuron SDK 2.x, aws-neuron-device-plugin, NxD Inference, vLLM Neuron backend."
    color="#ff9900"
  />
</DocCardGrid>

:::tip Selection Guide
If focused on NVIDIA, read **Node Strategy → Resource Management → NVIDIA Stack**; if considering AWS silicon (Trainium/Inferentia), read **Node Strategy → Neuron Stack**.
:::
