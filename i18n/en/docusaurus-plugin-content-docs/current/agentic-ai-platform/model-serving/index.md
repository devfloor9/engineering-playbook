---
title: "Model Serving & Inference Infrastructure"
sidebar_label: "Model Serving & Inference Infrastructure"
sidebar_position: 2
---

# Model Serving & Inference Infrastructure

Covers how to deploy and serve LLMs on GPUs/accelerators. Organized from EKS infrastructure layers through inference engines to distributed serving.

- [EKS GPU Node Strategy](./eks-gpu-node-strategy.md) — Auto Mode + Karpenter + Hybrid Node configuration
- [GPU Resource Management](./gpu-resource-management.md) — Karpenter scaling, KEDA, DRA, cost optimization
- [vLLM Model Serving](./vllm-model-serving.md) — Basic model serving configuration
- [llm-d Distributed Inference](./llm-d-eks-automode.md) — Kubernetes-native distributed inference, Disaggregated Serving
- [MoE Model Serving](./moe-model-serving.md) — Mixture of Experts model serving
- [NVIDIA GPU Stack](./nvidia-gpu-stack.md) — GPU Operator, DCGM, MIG/Time-Slicing, Dynamo
- [NeMo Framework](./nemo-framework.md) — Training and serving framework
