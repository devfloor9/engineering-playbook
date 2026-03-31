---
title: "Design & Architecture"
sidebar_label: "Design & Architecture"
sidebar_position: 1
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Design & Architecture

This guide walks you through understanding the Agentic AI platform architecture, identifying technical challenges, and exploring solutions through both AWS Native managed services and EKS-based open architecture. You'll understand **what** the platform is, **why** it's challenging, and **how** to build it with two complementary approaches.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-platform-architecture"
    icon="🏗️"
    title="Platform Architecture"
    description="The 6 core layers of Agentic AI Platform (Client, Gateway, Agent, Model Serving, Data, Observability) and design principles. A platform blueprint independent of specific implementations."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-challenges"
    icon="⚡"
    title="Technical Challenges"
    description="Analyzing 5 key challenges faced when building the platform: GPU resource management, inference routing, LLMOps observability, Agent orchestration, and model supply chain."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/aws-native-agentic-platform"
    icon="☁️"
    title="AWS Native Platform"
    description="Managed service approach leveraging Amazon Bedrock, Strands Agents SDK, and AgentCore to focus on Agent development without GPU management. Optimal for quick starts."
    color="#ff9900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-solutions-eks"
    icon="🔧"
    title="EKS-Based Open Architecture"
    description="Approach to achieve self-hosted Open Weight models, hybrid architecture, and granular GPU cost optimization with Amazon EKS Auto Mode + open-source ecosystem."
    color="#10b981"
  />
</DocCardGrid>

:::tip Recommended Learning Path
For the most effective understanding of the full context, read in this order: **Platform Architecture** (what) → **Technical Challenges** (why) → **AWS Native** or **EKS Open Architecture** (how). The two implementation approaches are complementary and can be combined.
:::
