---
title: Design & Architecture
description: Architecture design, technical challenges, and AWS Native and EKS-based implementation approaches for the Agentic AI Platform
created: "2026-03-06"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 3
tags:
  - architecture
  - design
  - agentic-ai
  - eks
  - aws
  - scope:nav
sidebar_label: Design & Architecture
sidebar_position: 0
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Start with the platform architecture and its technical challenges, then compare two implementation approaches: AWS Native managed services and an EKS-based open architecture. Use the selection guide to weigh their trade-offs for your workload.

<DocCardGrid columns={3}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/foundations"
    icon="🏗️"
    title="Platform Foundations"
    description="Understand the fundamentals of the Agentic AI Platform through the 6 runtime layers + 3 cross-cutting planes platform blueprint, 5 key challenges, and Knowledge Feature Store concept."
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
