---
title: "Agent 版本管理与变更管理"
sidebar_label: "Agent 版本管理"
description: "集成企业 Agent 提示词、模型、部署策略和治理的变更管理体系"
tags: [agent-versioning, prompt-registry, canary, feature-flag, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Agent 变更管理

## 为什么需要 Agent Change Management

### 与传统软件变更的差异

传统软件的变更管理针对代码、配置和基础设施变更。Agent 系统还增加了**概率性组件**：

| 变更类型 | 传统系统 | Agentic 系统 |
|-----------|--------------|---------------|
| **输出确定性** | 相同输入 → 相同输出 | 相同输入 → 概率分布 |
| **回归检测** | 单元测试、集成测试 | 统计评估(BLEU, Exact Match, LLM-as-Judge) |
| **回滚标准** | 功能故障、性能下降 | 准确率下降、幻觉增加、latency P99 |
| **变更单位** | 代码提交、二进制 | 提示词版本、模型替换、参数调整 |

### 为什么要像管理代码一样管理 Prompt 和 Model

1. **Prompt 是逻辑的核心**  
   "你是金融分析专家" → "你是保守型投资顾问" 这一行变更会改变整个输出模式。

2. **模型替换等同于运行时替换**  
   GPT-4 → Claude 4.7 Sonnet 切换时，即使使用相同提示词，响应风格、token 使用量和延迟也会不同。

3. **没有变更追踪就无法回滚**  
   当收到"昨天还好今天就不对了"的报告时，如果不知道谁在何时更改了哪个提示词，就无法恢复。

4. **监管要求**  
   金融、医疗和公共部门需要审计记录："这个答案是由哪个提示词版本、哪个模型版本生成的"，并保存审计日志。

---

## 三层 Change Management 体系

Agent 变更管理由三个层次组成：

### 1. 提示词·模型注册中心

像管理代码一样管理提示词和模型版本的中央存储库。使用 Langfuse、Bedrock Prompt Management、PromptLayer 等进行版本管理、标记和变更历史追踪。

**[查看提示词·模型注册中心详情 →](./prompt-model-registry.md)**

### 2. 部署策略

Shadow Testing、Canary Rollout、A/B Testing、Blue-Green Deployment 等渐进式部署策略和基于 Feature Flag 的展开方式。

**[查看部署策略详情 →](./deployment-strategies.md)**

### 3. 治理·自动化

回归检测、自动回滚、审批工作流、审计证据、AIDLC 阶段应用方案。

**[查看治理·自动化详情 →](./governance-automation.md)**

---

## 核心原则

1. **所有变更都要版本管理**：提示词、模型、参数变更应该像 Git commit 一样可追踪。
2. **渐进式部署**：不要一次性更改全部流量。Canary → 逐步扩大。
3. **自动回归检测**：Golden Dataset 评估 + 实时指标监控，立即检测性能下降。
4. **快速回滚**：必须具备问题发生时 1 分钟内恢复的机制。
5. **审计证据**：金融·医疗·公共部门监管对应的 7 年保存体系。

---

## 相关文档

import DocCardList from '@theme/DocCardList';

<DocCardList />

---

## AIDLC 关联文档

- [Evaluation Framework](../../toolchain/evaluation-framework.md) — 基于 Golden Dataset 的回归检测
- [Agent 监控](../../../agentic-ai-platform/operations-mlops/agent-monitoring.md) — 实时 observability

---

## 下一步

建立变更管理流程后：

1. **[提示词·模型注册中心](./prompt-model-registry.md)** — 选择并构建 Langfuse/Bedrock PM
2. **[部署策略](./deployment-strategies.md)** — 选择 Canary/Shadow/A-B 中的合适策略
3. **[治理·自动化](./governance-automation.md)** — 构建自动回归检测和回滚体系
