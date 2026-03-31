---
title: "Agentic AI Platform"
sidebar_label: "Agentic AI Platform"
description: "In-depth technical documentation on Agentic AI platform architecture, deployment, and operations"
tags: [eks, kubernetes, genai, agentic-ai, gpu, llm, platform]
category: "genai-aiml"
sidebar_position: 3
last_update:
  date: 2026-03-20
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agentic AI Platform

The Agentic AI Platform is an integrated platform that enables autonomous AI agents to perform complex tasks. This documentation series guides you through understanding the platform architecture, identifying **5 core technical challenges** faced during implementation, and resolving them through two approaches: **AWS Native Managed Services** and **EKS-based Open Architecture**. These approaches are complementary, and we recommend a progressive journey starting with AWS Native and expanding to EKS as needed.

---

## Documentation Structure

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="Design & Architecture"
    description="Understand the platform's 6 core layers and design principles, identify 5 technical challenges, and compare AWS Native vs EKS implementation approaches."
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
    to="/docs/agentic-ai-platform/gateway-agents"
    icon="🌐"
    title="Inference Gateway & Routing"
    description="2-Tier Gateway architecture integrating self-hosted LLM and external AI providers. Model-specific routing, Cascade Routing, cost tracking."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/agent-data"
    icon="🤖"
    title="Agents & Data"
    description="Kubernetes CRD-based AI agent lifecycle management, MCP/A2A tool integration, vector DB-based RAG pipeline construction."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="Operations & MLOps"
    description="Agent monitoring, LLM tracing, RAG quality evaluation, MLOps pipeline automation, SageMaker-EKS hybrid training-serving."
    color="#8b5cf6"
  />
</DocCardGrid>

---

:::info Recommended Learning Paths

**Platform Implementation Path:**
Design & Architecture → Model Serving & Inference Infrastructure → Inference Gateway → Agents & Data → Operations & MLOps

**GenAI Application Development Path:**
Model Serving (vLLM) → Distributed Inference (llm-d) → Gateway (Inference Gateway) → RAG (Milvus) → Agent (Kagent) → Evaluation (Ragas)
:::

## Related Categories

- [Operations & Observability](/docs/operations-observability) — AI/ML workload monitoring
- [Infrastructure Optimization](/docs/infrastructure-optimization) — GPU performance optimization
- [Hybrid Infrastructure](/docs/hybrid-infrastructure) — AI deployment in hybrid environments
