---
title: "Agentic AI Platform"
sidebar_label: "Agentic AI Platform"
description: "In-depth technical documentation on the architecture, deployment, and operations of the Agentic AI Platform"
tags: [eks, kubernetes, genai, agentic-ai, gpu, llm, platform]
category: "genai-aiml"
sidebar_position: 3
last_update:
  date: 2026-03-27
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agentic AI Platform

The Agentic AI Platform is a unified platform that enables autonomous AI agents to perform complex tasks. Deploying a single monolithic LLM for mission-critical enterprise workloads has clear limitations in terms of **cost**, **latency**, **accuracy (hallucination)**, and **governance**. Organizations must transition to a **heterogeneous multi-model ecosystem** where LLMs handle complex reasoning while domain-specific SLMs handle routine operations — and **platform-level infrastructure** is the key to operating this efficiently. Kubernetes is rapidly expanding AI-native capabilities such as DRA, Gateway API Inference Extension, and Kueue, and this platform supports multi-model switching **without code changes** on top of the K8s ecosystem.

This documentation series guides you through understanding the platform architecture, identifying the **5 key challenges** faced during deployment, and addressing them through two approaches: **AWS Native managed services** and **EKS-based open architecture**. These two approaches are complementary, and we recommend a gradual journey starting with AWS Native and expanding to EKS as needed.

---

## Documentation Structure

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="Design & Architecture"
    description="Platform 6-layer design, 5 key challenges, AWS Native vs EKS implementation, 2-Tier Inference Gateway & Cascade Routing strategy."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving"
    icon="🚀"
    title="Model Serving & Inference Infrastructure"
    description="EKS GPU node strategy, Karpenter scaling, vLLM inference engine, llm-d distributed inference, MoE serving, NVIDIA GPU stack, NeMo training framework."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="Operations & Governance"
    description="Agent monitoring, LLMOps Observability, RAG quality evaluation, Agentic Playbook, compliance, domain customization."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/reference-architecture"
    icon="📐"
    title="Reference Architecture"
    description="Production deployment guides: custom model deployment, Inference Gateway setup, MLOps pipelines, SageMaker-EKS integration."
    color="#f59e0b"
  />
</DocCardGrid>

---

:::info Recommended Learning Paths

**Platform Building Path:**
Design & Architecture → Model Serving & Inference Infrastructure → Operations & Governance → Reference Architecture

**GenAI Application Development Path:**
Model Serving (vLLM) → Distributed Inference (llm-d) → Gateway (Inference Gateway) → RAG (Milvus) → Agent (Kagent) → Evaluation (Ragas)
:::

## Related Categories

- [AIDLC](/docs/aidlc) — AI Development Lifecycle and AgenticOps
- [Hybrid Infrastructure](/docs/hybrid-infrastructure) — AI deployment in hybrid environments
- [EKS Best Practices](/docs/eks-best-practices) — EKS operational best practices
