---
title: "设计与架构"
sidebar_label: "设计与架构"
description: "Agentic AI 平台的架构设计、技术挑战、AWS Native 及 EKS 实现方案"
tags: [architecture, design, agentic-ai, eks, aws]
sidebar_position: 1
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 设计与架构

理解 Agentic AI 平台的架构，识别技术挑战，然后通过 AWS Native 托管方案和 EKS 开放架构逐步解决。先了解平台**是什么**，再理解**为什么难**，最后比较**如何构建**的两种方案。在推理网关层面，涵盖 2-Tier 架构和智能 Cascade Routing 策略。

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/foundations/agentic-platform-architecture"
    icon="🏗️"
    title="平台架构"
    description="Agentic AI Platform 的 6 大核心层（Client、Gateway、Agent、Model Serving、Data、Observability）与设计原则。提供独立于具体实现的平台蓝图。"
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/foundations/agentic-ai-challenges"
    icon="⚡"
    title="技术挑战"
    description="GPU 资源管理、推理路由、LLMOps 可观测性、Agent 编排、模型供应链——分析构建平台时面临的 5 大核心挑战。"
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/platform-selection/aws-native-agentic-platform"
    icon="☁️"
    title="AWS Native 平台"
    description="利用 Amazon Bedrock、Strands Agents SDK、AgentCore，无需 GPU 管理即可专注 Agent 开发的托管服务方案。快速启动的最佳选择。"
    color="#ff9900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/platform-selection/agentic-ai-solutions-eks"
    icon="🔧"
    title="EKS 开放架构"
    description="Amazon EKS Auto Mode + 开源生态实现 Open Weight 模型自托管、混合架构、精细化 GPU 成本优化。"
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/reference-architecture/inference-gateway/routing-strategy"
    icon="🔀"
    title="推理网关与 Cascade Routing"
    description="kgateway + Bifrost/LiteLLM 2-Tier 架构、基于复杂度的 Cascade Routing（LiteLLM 原生、Bifrost CEL Rules、vLLM Semantic Router）、Hybrid Routing 模式、agentgateway MCP/A2A。"
    color="#e53935"
  />
</DocCardGrid>

:::tip 推荐学习顺序
按照**平台架构**（是什么）→**技术挑战**（为什么）→ **AWS Native** 或 **EKS 开放架构**（如何实现）→**推理网关**（流量路由）的顺序阅读，可以最有效地理解全貌。
:::
