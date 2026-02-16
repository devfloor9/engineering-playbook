---
title: 介绍
description: 云原生架构工程手册与基准测试报告 — Amazon EKS 基础设施优化、Agentic AI 平台、AIOps/AIDLC、性能基准测试
category: "getting-started"
tags: [kubernetes, cloud-native, introduction, getting-started]
sidebar_position: 1
---

# Engineering Playbook

欢迎来到**云原生架构工程手册与基准测试报告**。本手册全面涵盖了基于 Amazon EKS 的云原生基础设施优化、Agentic AI 平台工程、AIOps/AIDLC 方法论的实战指南和架构模式。每个技术领域都配有**定量性能基准测试报告**，支持基于数据的架构决策。

## 主要内容

本手册由七个核心技术领域和独立的基准测试报告部分组成，每个领域都包含详细的实施指南、故障排查资料、实际案例和定量性能数据。

### [Infrastructure Optimization](./infrastructure-optimization/)

- Gateway API 引入指南（NGINX Ingress EOL 应对、5 种解决方案比较）
- CoreDNS 监控与优化
- Karpenter 自动扩展
- East-West 流量优化
- 成本管理与优化

### [Operations & Observability](./operations-observability/)

- 基于 GitOps 的集群运营
- 节点监控代理部署
- EKS 故障诊断与响应
- EKS 高可用性与弹性架构

### [Agentic AI Platform](./agentic-ai-platform/)

- 生产环境 GenAI 平台架构
- GPU 资源管理与优化
- vLLM / MoE 模型服务
- llm-d 分布式推理（EKS Auto Mode）
- Inference Gateway 路由
- Milvus 向量数据库与 RAG
- Kagent Kubernetes AI 代理
- Langfuse 代理监控
- NeMo Framework 集成
- Amazon Bedrock AgentCore + MCP
- RAGAS 评估框架

### [AIops & AIDLC](./aiops-aidlc/)

- AIOps 介绍及 EKS 应用策略
- EKS 智能可观测性栈（ADOT + AMP/AMG + CloudWatch AI）
- AIDLC 框架（Kiro + MCP + DevOps Agent）
- 预测扩展和自动恢复模式

### [Hybrid Infrastructure](./hybrid-infrastructure/)

- 混合节点引入指南
- SR-IOV DGX H200 高性能网络
- 混合节点文件存储
- Harbor 容器镜像仓库集成

### [Security & Governance](./security-governance/)

- Identity-First Security
- GuardDuty Extended Threat Detection
- Kyverno 策略管理
- Default Namespace 事件分析
- 软件供应链安全

### [ROSA](./rosa/)

- ROSA 演示安装指南
- ROSA 安全与合规

### [Benchmark Reports](./benchmarks/)

- 基础设施性能基准测试
- CNI 性能比较（Cilium vs VPC CNI）
- AI/ML 工作负载基准测试
- 混合基础设施基准测试
- 安全运营基准测试

## 快速开始

1. **初次接触云原生？** 从各领域的介绍文档开始
2. **有特定用例？** 使用搜索功能查找相关指南
3. **准备实施？** 跟随包含代码示例的分步指南

## 如何使用本手册

每个指南都遵循一致的结构：

- **概述**：背景和目标
- **前提条件**：所需知识和工具
- **架构**：系统设计和组件
- **实施**：分步实施方法
- **监控**：验证和可观测性
- **故障排查**：常见问题和解决方法

## 贡献

本手册持续更新最新的云原生模式和最佳实践。如需贡献、提出问题或建议，请访问 [GitHub 仓库](https://github.com/devfloor9/engineering-playbook)。

## 支持

- **文档相关问题**：[GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues)
- **技术问题**：使用搜索功能或按标签浏览
