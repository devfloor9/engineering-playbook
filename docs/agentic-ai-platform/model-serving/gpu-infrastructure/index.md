---
title: Accelerated Computing Infrastructure
description: EKS GPU node strategy, Karpenter·KEDA·DRA resource management, NVIDIA GPU stack, AWS Neuron stack — the accelerated computing layer covering GPUs and AWS custom accelerators
created: "2026-04-17"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 3
tags:
  - gpu
  - eks
  - karpenter
  - gpu-operator
  - neuron
  - scope:tech
sidebar_label: Accelerated Computing Infrastructure
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers three infrastructure decisions on Kubernetes: which accelerated instances to use, how to schedule workloads on them, and how to manage drivers and accelerator partitioning. It includes NVIDIA GPUs and AWS accelerators such as Trainium and Inferentia. Inference frameworks such as vLLM and llm-d depend on this infrastructure.

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
