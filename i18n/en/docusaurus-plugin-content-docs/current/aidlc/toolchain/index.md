---
title: "Tools & Implementation"
sidebar_label: "Tools & Implementation"
description: "Tools that enable AIDLC — AI Coding Agents, Open-Weight Models, EKS Automation, Technology Roadmap"
last_update:
  date: 2026-04-18
  author: devfloor9
---

# AIDLC Tools & Implementation

> **Reading time**: Approx. 2 minutes

This section covers tools and technology stacks for implementing the AIDLC [methodology](/docs/aidlc/methodology) in real-world projects. From AI coding agents to open-weight model utilization, EKS-based declarative automation, and technology investment roadmaps, we provide practical implementation guides.

## Structure

| Document | Key Content | Target Audience |
|----------|-------------|----------------|
| [AI Coding Agents](./ai-coding-agents.md) | Kiro Spec-Driven development, Q Developer, agent comparison | Developers, Tech Leads |
| [Open-Weight Models](./open-weight-models.md) | On-premises deployment, cloud vs self-hosting TCO, data residency | Architects, Security Officers |
| [EKS Declarative Automation](./eks-declarative-automation.md) | Managed Argo CD, ACK, KRO, Gateway API | Developers, DevOps |
| [Technology Roadmap](./technology-roadmap.md) | Build-vs-Wait decision matrix, investment planning | CTO, Enterprise Architects |

## Tool Selection Decision Flow

```mermaid
flowchart TD
    START["AIDLC Tool Selection"] --> Q1{"Data Residency<br/>Requirements?"}
    Q1 -->|Yes| OW["Open-Weight Models<br/>On-Premises Deployment"]
    Q1 -->|No| Q2{"Coding Agent<br/>Selection"}
    Q2 -->|"Spec-Driven Development"| KIRO["Kiro"]
    Q2 -->|"Real-time Code Support"| QD["Q Developer"]
    Q2 -->|"Both"| BOTH["Kiro + Q Developer"]
    OW --> HYBRID["Hybrid Configuration<br/>Cloud + On-Premises"]

    style START fill:#326ce5,color:#fff
    style OW fill:#ff9900,color:#fff
    style KIRO fill:#76b900,color:#fff
    style QD fill:#76b900,color:#fff
```
