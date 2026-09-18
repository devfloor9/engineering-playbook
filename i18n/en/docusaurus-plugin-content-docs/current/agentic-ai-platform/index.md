---
title: Agentic AI Platform
description: In-depth technical documentation on the architecture, deployment, and operations of the Agentic AI Platform
created: "2026-02-04"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 4
tags:
  - eks
  - kubernetes
  - genai
  - agentic-ai
  - gpu
  - llm
  - platform
  - scope:nav
sidebar_label: Agentic AI Platform
sidebar_position: 3
category: genai-aiml
---

import DocCardList from '@theme/DocCardList';

Design, model serving, operations, and implementation guides for AI platforms. Choose a starting path below.

## Starting paths

- **Design**: [Architecture](./design-architecture/index.md) → [Platform decisions](./design-architecture/platform-selection/ai-platform-decision-framework.md)
- **Build**: [Model serving](./model-serving/index.md) → [Reference architectures](./reference-architecture/index.md)
- **Operate**: [Operations and governance](./operations-mlops/index.md)

## Documentation Structure

<DocCardList />

---

## Background

This manual helps platform architects and engineers connect requirements to design decisions, deployment configuration, and operational measurements. Choose or combine managed services and EKS according to data boundaries, model control, and operating capacity. Evaluate quality, latency, and cost for the actual workload before choosing a single-model or multi-model design.

The architecture chapters use **six runtime layers and three shared planes** to describe platform responsibilities. The model-serving chapters use **L0–L5 tuning layers** as a separate view of inference performance. These numbers are not a one-to-one mapping. Implementation procedures belong in Reference Architecture. A model replacement also requires checking tool calls, output formats, and evaluation results beyond API compatibility.

## Related Categories

- [AIDLC](/docs/aidlc) — AI Development Lifecycle and AgenticOps
- [EKS Hybrid Nodes](/docs/eks-hybrid-nodes) — AI deployment in hybrid environments
- [EKS Best Practices](/docs/eks-best-practices) — EKS operational best practices
