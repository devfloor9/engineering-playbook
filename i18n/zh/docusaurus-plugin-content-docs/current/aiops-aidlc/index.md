---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "AIops & AIDLC 指南：利用 AI 最大化 K8s 平台优势，同时降低复杂性以加速创新"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-12
  author: devfloor9
---

import { PlatformComparison, CoreTechStack } from '@site/src/components/AiopsIntroTables';

# 现代应用平台的 AIops & AIDLC

> 📅 **撰写日期**: 2026-02-12 | ⏱️ **阅读时间**: 约 5 分钟

Kubernetes 已确立了容器编排的标准地位，但其多样化的功能和可扩展性也带来了运维复杂性的代价。AIOps（AI for IT Operations）和 AIDLC（AI-Driven Development Lifecycle）是利用 AI 解决这种复杂性，同时最大化 K8s 平台优势的方法。它们不仅仅是将 AI 应用于监控，而是提出了一种新的运维范式，让 AI 主导从开发到部署、运维和事件响应的整个生命周期。

本指南的核心前提是 AWS 的开源战略。AWS 通过 Managed Add-ons（22+）、Community Add-ons Catalog 和托管开源服务（AMP、AMG、ADOT）提供 Kubernetes 生态系统的核心工具，将运维负担委托给 AWS，同时保持开源的灵活性和可移植性。2025 年 11 月，AWS 宣布了 EKS Capabilities（Managed Argo CD、ACK、KRO），将 GitOps 和声明式基础设施管理扩展到 AWS 托管服务。EKS 作为这一开源战略的关键执行者，充当 K8s 原生自动化的中央组件。

在此基础上，Kiro 和 MCP（Model Context Protocol）已成为核心 AIOps 工具。Kiro 通过规范驱动的开发方法（requirements → design → tasks → code）实现程序化自动化，并通过 AWS MCP 服务器（50+ GA）在开发工作流中直接执行 EKS 集群控制、CloudWatch 指标分析和成本优化。2025 年 11 月，新增了 Fully Managed MCP（EKS/ECS Preview）和 AWS MCP Server Integration（15,000+ API，Preview），提供从本地执行到云托管和完整 AWS API 集成的三层托管选项。虽然单独的 MCP 服务器提供深度的服务特定工具（kubectl 执行、PromQL 查询等），但集成服务器在多服务组合任务和 Agent SOPs（预构建工作流）方面表现出色，两种方法是互补的，而非替代关系。

如果 Kiro + MCP 代表了"人类指令、AI 执行"的程序化模式，AI Agent 框架就是下一阶段，AI 基于事件自主检测、判断和执行。Amazon Q Developer（GA）在 CloudWatch Investigations 和 EKS 故障排除方面提供了最成熟的生产模式，而 Strands Agents（开源）是在 AWS 生产环境中验证的 Agent SDK，将 Agent SOPs 定义为自然语言工作流。Kagent 是一个支持 MCP 集成（kmcp）的 K8s 原生 AI Agent，但仍处于早期阶段。现实的方法是从 Q Developer 开始，逐步扩大 Agent 范围。

## 与 Agentic AI Platform 的区别

本类别专注于**如何使用 AI 运维平台**。虽然 Agentic AI Platform 涵盖运行 AI 工作负载的平台本身——LLM 服务、GPU 管理、推理优化——AIops & AIDLC 提供的方法论是使用 AI 工具更高效地开发和运维该平台（或通用应用平台）。

<PlatformComparison />

<CoreTechStack />

:::info 学习路径
按照 **阶段 1 → 2 → 3 → 4** 的顺序阅读，可以跟随从 AIOps 战略制定到自主运维实现的整个旅程。阶段 1（AIOps 战略）是理解整体方向的起点，阶段 2（可观测性）构建 AI 分析的数据基础，阶段 3（AIDLC）涵盖开发方法论，阶段 4（预测性运维）处理自主运维的实现。
:::

## 参考资料

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [AWS MCP Servers (Individual 50+ GA)](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
