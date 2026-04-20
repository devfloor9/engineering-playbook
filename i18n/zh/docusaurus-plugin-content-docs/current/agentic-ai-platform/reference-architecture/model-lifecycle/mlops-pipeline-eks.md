---
title: "基于 EKS 的 MLOps 流水线构建"
sidebar_label: "MLOps 流水线"
description: "基于 Kubeflow + MLflow + vLLM + ArgoCD GitOps 的端到端 ML 生命周期管理"
sidebar_position: 3
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, vllm, argocd, gitops, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-04-06
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

# 基于 EKS 的 MLOps 流水线构建

> 📅 **创建日期**：2026-02-13 | **修改日期**：2026-04-06 | ⏱️ **阅读时间**：约 12 分钟

## 概述

MLOps 是自动化和标准化机器学习模型开发、部署、运营的实践方法论。本文档介绍在 Amazon EKS 环境中利用 Kubeflow Pipelines、MLflow、vLLM 模型服务、ArgoCD GitOps 部署构建从数据准备到模型服务的端到端 ML 生命周期。

### 主要目标

- **完全自动化**：构建从数据收集到模型部署的自动化流水线
- **实验追踪**：通过 MLflow 进行系统化实验管理和模型版本管理
- **可扩展服务**：基于 vLLM 的高性能模型服务 + ArgoCD GitOps 部署
- **GPU 优化**：利用 Karpenter 的动态 GPU 资源管理

<PipelineComponents />

本文档的详细内容（Kubeflow 安装、MLflow 配置、Argo Workflows、GitOps 配置等）由于篇幅原因请参阅[韩文原文](/docs/agentic-ai-platform/reference-architecture/model-lifecycle/mlops-pipeline-eks)。
