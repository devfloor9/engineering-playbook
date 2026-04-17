---
title: "Design & Architecture"
sidebar_label: "Design & Architecture"
description: "Architecture design, technical challenges, and AWS Native and EKS-based implementation approaches for the Agentic AI Platform"
tags: [architecture, design, agentic-ai, eks, aws]
sidebar_position: 1
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Design & Architecture

This section guides you through understanding the Agentic AI Platform architecture, identifying its technical challenges, and addressing them progressively through AWS Native managed services and EKS-based open architecture. After understanding **what** the platform is, you'll identify **why** it's challenging, then compare **how** to build it through two approaches. For the inference gateway layer, we cover the 2-Tier architecture and intelligent Cascade Routing strategies.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-platform-architecture"
    icon="🏗️"
    title="Platform Architecture"
    description="The 6 core layers of the Agentic AI Platform (Client, Gateway, Agent, Model Serving, Data, Observability) and design principles. Presents an implementation-agnostic platform blueprint."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-challenges"
    icon="⚡"
    title="Technical Challenges"
    description="GPU resource management, inference routing, LLMOps observability, agent orchestration, model supply chain — analysis of the 5 key challenges faced when building the platform."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/aws-native-agentic-platform"
    icon="☁️"
    title="AWS Native Platform"
    description="A managed service approach using Amazon Bedrock, Strands Agents SDK, and AgentCore to focus on agent development without GPU management. Optimal for quick starts."
    color="#ff9900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-solutions-eks"
    icon="🔧"
    title="EKS-Based Open Architecture"
    description="Self-hosting open weight models with Amazon EKS Auto Mode + open-source ecosystem, enabling hybrid architecture and fine-grained GPU cost optimization."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/reference-architecture/inference-gateway-routing"
    icon="🔀"
    title="Inference Gateway & Cascade Routing"
    description="kgateway + Bifrost/LiteLLM 2-Tier architecture, Complexity-based Cascade Routing (LiteLLM native, Bifrost CEL Rules, vLLM Semantic Router), Hybrid Routing patterns, agentgateway MCP/A2A."
    color="#e53935"
  />
</DocCardGrid>

:::tip Recommended Reading Order
Read in this order for the most effective understanding: **Platform Architecture** (what) → **Technical Challenges** (why) → **AWS Native** or **EKS Open Architecture** (how) → **Inference Gateway** (traffic routing).
:::
