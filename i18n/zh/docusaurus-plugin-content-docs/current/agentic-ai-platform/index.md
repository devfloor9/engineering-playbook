---
title: "Agentic AI Platform"
sidebar_label: "Agentic AI 平台"
description: "Agentic AI 平台的架构、构建与运营深度技术文档"
tags: [eks, kubernetes, genai, agentic-ai, gpu, llm, platform]
category: "genai-aiml"
sidebar_position: 3
last_update:
  date: 2026-03-27
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agentic AI Platform

Agentic AI Platform 是一个支持自主 AI Agent 执行复杂任务的统一平台。将单一大型 LLM 投入企业核心业务时，在**成本**、**响应延迟**、**信息准确性（幻觉）**和**治理**方面存在明显局限。企业需要转向**异构多模型生态系统**——复杂推理由 LLM 负责，重复性实务由领域特化 SLM 承担，而高效运营这一生态系统的关键在于**基础设施平台化**。Kubernetes 正在快速扩展 DRA、Gateway API Inference Extension、Kueue 等 AI 原生功能，本平台基于 K8s 生态实现**无需代码变更**的多模型切换支持。

本文档系列将引导您理解平台架构、识别构建过程中面临的 **5 大核心挑战**，并分别通过 **AWS Native 托管方案**和 **EKS 开放架构**两种方式加以解决。两种方案互为补充，建议从 AWS Native 起步，按需扩展至 EKS。

---

## 生产推理管道架构

基于 EKS Auto Mode 的生产推理管道完整请求流程。kgateway ExtProc 分析提示词确定 LLM 路由，经过 Bifrost 治理层和 llm-d KV Cache 感知路由，将请求发送到最优模型。

<iframe
  src="/engineering-playbook/agentic-platform-architecture-zh.html"
  style={{width: '100%', height: '1600px', border: 'none', borderRadius: '12px'}}
  title="Agentic AI Platform 推理管道架构"
  loading="lazy"
/>

---

## 文档结构

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="设计与架构"
    description="平台 6 层设计、5 大挑战、AWS Native vs EKS 实现、2-Tier 推理网关与 Cascade Routing 策略。"
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving"
    icon="🚀"
    title="模型服务与推理基础设施"
    description="EKS GPU 节点策略、Karpenter 弹性伸缩、vLLM 推理引擎、llm-d 分布式推理、MoE 服务、NVIDIA GPU 堆栈、NeMo 训练框架。"
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="运营与治理"
    description="Agent 监控、LLMOps 可观测性、RAG 质量评估、Agentic Playbook、合规框架、领域定制化。"
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/reference-architecture"
    icon="📐"
    title="Reference Architecture"
    description="实战部署指南：自定义模型部署、Inference Gateway 配置、MLOps 流水线、SageMaker-EKS 集成。"
    color="#f59e0b"
  />
</DocCardGrid>

---

:::info 推荐学习路径

**平台构建路径：**
设计与架构 → 模型服务与推理基础设施 → 运营与治理 → Reference Architecture

**GenAI 应用开发路径：**
模型服务（vLLM）→ 分布式推理（llm-d）→ 网关（Inference Gateway）→ RAG（Milvus）→ Agent（Kagent）→ 评估（Ragas）
:::

## 相关分类

- [AIDLC](/docs/aidlc) — AI Development Lifecycle 与 AgenticOps
- [Hybrid Infrastructure](/docs/hybrid-infrastructure) — 混合环境的 AI 部署
- [EKS Best Practices](/docs/eks-best-practices) — EKS 运营最佳实践
