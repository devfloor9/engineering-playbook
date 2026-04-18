tags: [aidlc, toolchain, 'scope:toolchain']
---
title: "工具与实现"
sidebar_label: "工具与实现"
description: "实现 AIDLC 的工具 — AI 编码代理、Open-Weight 模型、EKS 自动化、技术路线图"
last_update:
  date: 2026-04-18
  author: devfloor9
---

# AIDLC 工具与实现

> **阅读时间**: 约 2 分钟

本章节介绍在实际项目中实施 AIDLC [方法论](/docs/aidlc/methodology) 所需的工具与技术栈。从 AI 编码代理、Open-Weight 模型落地、基于 EKS 的声明式自动化到技术投资路线图,提供达到实操水平的指南。

## 组成

| 文档 | 核心内容 | 目标读者 |
|------|----------|----------|
| [AI 编码代理](./ai-coding-agents.md) | Kiro Spec-Driven 开发、Q Developer、代理对比 | 开发者、技术负责人 |
| [Open-Weight 模型](./open-weight-models.md) | 本地部署、云 vs 自托管 TCO、数据驻留 | 架构师、安全负责人 |
| [EKS 声明式自动化](./eks-declarative-automation.md) | Managed Argo CD、ACK、KRO、Gateway API | 开发者、DevOps |
| [技术路线图](./technology-roadmap.md) | Build-vs-Wait 决策矩阵、投资规划 | CTO、企业架构师 |

## 工具选择决策

```mermaid
flowchart TD
    START["AIDLC 工具选择"] --> Q1{"是否有数据驻留<br/>合规要求?"}
    Q1 -->|是| OW["Open-Weight 模型<br/>本地部署"]
    Q1 -->|否| Q2{"编码代理<br/>选择"}
    Q2 -->|"Spec-Driven 开发"| KIRO["Kiro"]
    Q2 -->|"实时代码辅助"| QD["Q Developer"]
    Q2 -->|"两者兼用"| BOTH["Kiro + Q Developer"]
    OW --> HYBRID["混合部署<br/>云 + 本地"]

    style START fill:#326ce5,color:#fff
    style OW fill:#ff9900,color:#fff
    style KIRO fill:#76b900,color:#fff
    style QD fill:#76b900,color:#fff
```
