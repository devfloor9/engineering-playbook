---
title: "Design & Architecture"
sidebar_label: "Design & Architecture"
description: "Architecture design, technical challenges, and AWS Native and EKS-based implementation approaches for the Agentic AI Platform"
created: 2026-03-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 3
tags:
  - architecture
  - design
  - agentic-ai
  - eks
  - aws
  - scope:nav
sidebar_position: 0
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section guides you through understanding the Agentic AI Platform architecture, identifying its technical challenges, and addressing them progressively through AWS Native managed services and EKS-based open architecture. After understanding **what** the platform is, you'll identify **why** it's challenging, then compare **how** to build it through two approaches. A selection guide comparing the pros and cons of each approach helps you choose the optimal path for your situation.

<DocCardGrid columns={3}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/foundations"
    icon="🏗️"
    title="Platform Foundations"
    description="Understand the fundamentals of the Agentic AI Platform through the 6-layer platform blueprint, 5 key challenges, and Knowledge Feature Store concept."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/platform-selection"
    icon="🧭"
    title="Platform Selection"
    description="Selection criteria by situation including SageMaker/Bedrock/EKS comparison, AWS Native managed services, EKS open-source architecture, and AgentCore hybrid strategy."
    color="#0ea5e9"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/advanced-patterns"
    icon="🔄"
    title="Advanced Patterns"
    description="Build a continuous improvement architecture through Self-Improving Agent Loop and ADR that combines human feedback with automated evaluation."
    color="#f59e0b"
  />
</DocCardGrid>

:::tip Recommended Reading Order
Reading in the order **Platform Foundations** (what & why) → **Platform Selection** (which approach) → **Advanced Patterns** (continuous improvement) provides the most effective understanding of the overall context.
:::
