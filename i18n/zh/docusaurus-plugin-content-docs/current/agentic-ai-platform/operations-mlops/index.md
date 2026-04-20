---
title: "运营与治理"
sidebar_label: "运营与治理"
description: "AI 平台监控、Observability、评估、合规、领域特化运营指南"
tags: [operations, monitoring, observability, mlops, compliance]
sidebar_position: 4
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 运营与治理

为生产级 AI 平台的稳定运营提供**监控**、**可观测性**、**质量评估**、**合规**、**领域特化运营**指南。

本节综合涵盖以下领域：

- **监控与可观测性**：Agent 状态追踪、LLM 链路追踪、Token 成本分析
- **质量评估**：RAG 流水线评估框架（Ragas）
- **Agent 管理**：基于 Kubernetes 的 Agent 生命周期管理（Kagent）
- **企业运营**：Playbook、合规、领域特化定制
- **向量数据库**：Milvus 运维指南

:::tip 实战部署指南
MLOps 流水线构建及 SageMaker-EKS 集成等实际部署架构请参阅 [Reference Architecture](../reference-architecture/index.md) 章节。
:::

## 文档列表

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring"
    icon="📈"
    title="Agent 监控与运营"
    description="Agent 状态及性能监控。LLM 链路追踪集成、Token 成本追踪、告警规则、运营仪表板配置。"
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/llmops-observability"
    icon="👁️"
    title="LLMOps Observability"
    description="Langfuse、LangSmith、Helicone 对比指南。LLM 链路追踪、Token 成本分析、Prompt 质量监控。"
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent: Kubernetes Agent 管理"
    description="基于 Kubernetes 的 Agent 生命周期管理。Pod-based Agent 部署、动态伸缩、健康检查集成。"
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/ragas-evaluation"
    icon="✅"
    title="Ragas 评估"
    description="RAG 流水线质量评估框架。Faithfulness、Relevance、Correctness 指标，CI/CD 集成自动评估。"
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/agentic-playbook"
    icon="📚"
    title="Agentic Playbook"
    description="生产级 Agent 运营最佳实践。故障响应、性能调优、成本优化场景化 Playbook。"
    color="#ec4899"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/compliance-framework"
    icon="🔒"
    title="合规框架"
    description="法规遵从与治理体系。GDPR、HIPAA、金融监管对接、审计日志、数据保护策略制定。"
    color="#ef4444"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/domain-customization"
    icon="🎯"
    title="领域特化定制"
    description="按行业定制 Agent 指南。金融、医疗、制造等领域特化策略与实现模式。"
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/data-infrastructure/milvus-vector-database"
    icon="🗄️"
    title="Milvus 向量数据库"
    description="生产级向量数据库运维。Milvus 集群配置、索引优化、备份/恢复、性能调优指南。"
    color="#7c3aed"
  />
</DocCardGrid>

## 相关章节

- **[Reference Architecture](../reference-architecture/index.md)**：MLOps 流水线、SageMaker-EKS 集成、实战部署指南
- **[AIDLC > AgenticOps](/docs/aidlc/agentic-ops)**：基于 AIOps 的自动化运营与预测性监控
- **[设计与架构](../design-architecture/index.md)**：平台整体架构设计文档
