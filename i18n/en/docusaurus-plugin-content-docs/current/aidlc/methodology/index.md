---
title: AIDLC Methodology
description: Core methodology of AIDLC — 10 Principles, Ontology, Harness Engineering, DDD Integration
created: "2026-04-07"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 3
tags:
  - scope:nav
sidebar_label: Methodology
---

# AIDLC Methodology

This track explains how AIDLC organizes collaboration between people and AI during development. It introduces the Intent → Unit → Bolt execution model, then explains how domain schemas, validation controls, and domain-driven design support that workflow.

## Structure

The methodology track consists of 4 core documents. Reading them in order will help you understand the entire theoretical framework of AIDLC.

```mermaid
flowchart LR
    P["10 Principles<br/>Intent · Unit · Bolt"] --> O["Ontology<br/>WHAT + WHEN"]
    P --> H["Harness<br/>HOW"]
    O --> D["DDD Integration<br/>Domain Design"]
    H --> D

    style P fill:#326ce5,color:#fff
    style O fill:#2ecc71,color:#fff
    style H fill:#e74c3c,color:#fff
    style D fill:#9b59b6,color:#fff
```

| Order | Document | Core Question |
|------|------|----------|
| 1 | [10 Principles and Execution Model](./principles-and-model.md) | What is AIDLC and how does it work? |
| 2 | [Ontology Engineering](./ontology-engineering.md) | How do we ensure the **accuracy** of AI-generated code? |
| 3 | [Harness Engineering](./harness-engineering.md) | How do we architecturally enforce the **safety** of AI execution? |
| 4 | [DDD Integration](./ddd-integration.md) | How do we transform business domains into designs that AI can understand? |

## Relationship with Other Tracks

- **[Enterprise Adoption](/docs/aidlc/enterprise)**: Interprets the methodology's concepts (ontology, harness) as organizational transformation and cost effectiveness.
- **[Tools & Implementation](/docs/aidlc/toolchain)**: Covers concrete tools (Kiro, Q Developer, EKS) that realize the methodology.
- **[AgenticOps](/docs/aidlc/operations)**: Builds a circular structure where operational data feeds back into the ontology Outer Loop.
