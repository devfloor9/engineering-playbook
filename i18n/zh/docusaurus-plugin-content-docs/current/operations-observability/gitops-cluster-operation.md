---
title: "基于 GitOps 的 EKS 集群运维"
sidebar_label: "1. GitOps 集群运维"
description: "为大规模 EKS 集群的稳定运维提供 GitOps 架构、KRO/ACK 使用方法、多集群管理策略和自动化技术"
tags: [eks, gitops, argocd, kro, ack, kubernetes, automation, infrastructure-as-code]
category: "observability-monitoring"
last_update:
  date: 2025-02-09
  author: devfloor9
sidebar_position: 1
---

# 基于 GitOps 的 EKS 集群运维

> 📅 **作成日期**: 2025-02-09 | ⏱️ **阅读时间**: 约 7 分钟

> **📌 基准版本**: ArgoCD v2.13+ / v3（预发布版），Kubernetes 1.32

## 概述

为了稳定且可扩展地运维大规模 EKS 集群，遵循 GitOps 原则的自动化部署和管理策略是必不可少的。本文档说明如何使用 ArgoCD、KRO/ACK 和 Infrastructure as Code 模式构建生产级集群运维环境。

### 问题解决

传统的 EKS 集群运维存在以下问题：

- 手动配置导致环境间不一致
- 难以追踪基础设施变更历史
- 大规模多集群管理的复杂性
- 缺乏部署验证和回滚流程
- 策略合规自动化不足

本架构旨在解决这些问题。

## 技术考虑事项和架构摘要

### 核心建议

**1. GitOps 平台选择**

- 使用 ArgoCD ApplicationSets 进行多集群管理
- 集成 Flagger 实现渐进式交付

:::tip ArgoCD 作为 EKS Add-on
ArgoCD 也作为 EKS Add-on 提供。通过 `aws eks create-addon` 安装后，AWS 会管理版本兼容性。
:::

**2. Infrastructure as Code 策略**

- **建议采用 ACK/KRO（Kubernetes Resource Orchestrator）**
  - 可与现有 Terraform 状态进行渐进式迁移
  - 通过 Kubernetes 原生方式确保运维一致性
  - 相比 Helm 提供更灵活的资源编排

**3. 自动化核心要素**

- Blue/Green 方式的 EKS 升级自动化
- 用于 Addon 版本管理的自动化测试管道
- 基于 Policy as Code（OPA/Gatekeeper）的治理

**4. 安全和合规**

- External Secrets Operator + AWS Secrets Manager 组合
- Git 签名和基于 RBAC 的批准工作流
- 实时合规监控仪表板

### 预期 ROI

| 效果 | 改进 |
|------|------|
| 运维负担 | 通过自动化减少手动工作 |
| 升级频率 | 从每年 1 次到每季度可能 |
| 故障恢复 | 通过自动回滚改善时间 |

## 架构概述

基于 GitOps 的 EKS 集群运维以 Git 作为单一真实来源，通过声明式配置管理自动同步集群状态。

### GitOps 工作流

```mermaid
sequenceDiagram
    participant Dev as 开发者
    participant Git as Git Repository
    participant PR as PR/MR Review
    participant Argo as ArgoCD Server
    participant AS as ApplicationSets
    participant KRO as KRO Controller
    participant OPA as OPA Gatekeeper
    participant ESO as External Secrets
    participant EKS as EKS Clusters
    participant AWS as AWS Services
    participant Mon as Monitoring

    Dev->>Git: 1. Push 变更
    Git->>PR: 2. 创建 PR/MR
    PR->>PR: 3. 自动验证 (CI)
    PR->>Dev: 4. 请求批准
    Dev->>PR: 5. 批准
    PR->>Git: 6. Merge to main

    Git->>Argo: 7. Webhook 触发
    Argo->>Git: 8. Pull 最新变更

    alt Application 部署
        Argo->>AS: 9a. ApplicationSet 同步
        AS->>AS: 10a. 生成集群特定清单
        AS->>OPA: 11a. 策略验证
        OPA-->>AS: 12a. 验证结果
        alt 策略通过
            AS->>ESO: 13a. Secret 请求
            ESO->>AWS: 14a. 查询 Secrets Manager
            AWS-->>ESO: 15a. 返回 Secret
            ESO-->>AS: 16a. 注入 Secret
            AS->>EKS: 17a. 应用清单
            EKS-->>AS: 18a. 部署状态
        else 策略违规
            OPA->>Mon: 13b. 策略违规警报
            OPA->>Dev: 14b. 部署阻止通知
        end
    else Infrastructure 变更
        Argo->>KRO: 9b. KRO 资源同步
        KRO->>KRO: 10b. 资源验证
        KRO->>AWS: 11b. AWS API 调用
        AWS-->>KRO: 12b. 创建/修改资源
        KRO->>EKS: 13b. 状态更新
    end

    EKS->>Mon: 19. 发送指标/日志
    Mon->>Mon: 20. 异常检测

    alt 检测到异常
        Mon->>Argo: 21. 触发回滚
        Argo->>EKS: 22. 部署以前版本
        Mon->>Dev: 23. 发送通知
    end

    loop Health Check (每 30 秒)
        Argo->>EKS: 状态检查
        EKS-->>Argo: 同步状态
        Argo->>Mon: 同步指标
    end
```

## 多集群管理策略

### 基于 ApplicationSets 的集群管理

ArgoCD ApplicationSets 是在多集群环境中管理一致部署的核心工具。

**核心策略：**

#### 1. Cluster Generator

- 基于集群注册表的动态应用程序生成
- 基于标签的集群分组（按环境、区域、用途）

#### 2. Git Directory Generator

- 按环境配置管理（dev/staging/prod）
- 集群特定覆盖设置

#### 3. Matrix Generator

- 集群 × 应用程序组合管理
- 应用条件部署规则

## 多集群自动化

### EKS 集群升级自动化

使用 Blue/Green 部署模式实现无中断集群升级。

**准备阶段**

- 新集群配置（KRO）
- Addon 兼容性验证
- 安全策略同步

**迁移阶段**

- 渐进式工作负载迁移
- 流量权重调整（0% → 100%）
- 实时监控

**验证和完成**

- 自动化 smoke test
- 性能指标比较
- 旧集群移除

## 安全和治理

### Git Repository 结构设计

有效的 GitOps 实施需要适当的仓库结构。

**Monorepo vs Polyrepo 建议：**

| 对象 | 推荐方式 | 原因 |
|------|---------|------|
| 应用程序代码 | Polyrepo | 保证团队独立性 |
| 基础设施配置 | Monorepo | 中央管理和一致性 |
| 策略定义 | Monorepo | 强制全公司标准化 |

### Secret 管理架构

:::info External Secrets Operator (ESO) 推荐

**主要特点：**

- 集中式 Secret 存储
- 支持自动轮换
- 细粒度访问控制（IRSA）
- 无需在 Git 中加密存储

与 AWS Secrets Manager 配合使用，可以有效实施组织的安全策略。

:::

## 从 Terraform 到 KRO 的迁移策略

从现有 Terraform 环境逐步过渡到 KRO。这种方法在持续提供价值的同时最小化风险。

### 第 1 阶段：试点（2 个月）

- 针对 1 个 Dev 环境集群
- 仅迁移基本资源（VPC、Subnets、Security Groups）
- Terraform 状态导入和验证

### 第 2 阶段：扩大应用（3 个月）

- 包括 Staging 环境
- 添加 EKS 集群和 Addon 管理
- 构建自动化管道

### 第 3 阶段：完整迁移（4 个月）

- 依次应用到 Production 环境
- 所有 AWS 资源由 KRO 管理
- 完全移除 Terraform

### KRO 资源定义示例

以下是使用 KRO 的 EKS 集群和节点组定义示例。

```yaml
apiVersion: kro.io/v1alpha1
kind: ResourceGroup
metadata:
  name: eks-cluster-us-east-1-prod
spec:
  resources:
    # EKS 集群定义
    - apiVersion: eks.aws.crossplane.io/v1beta1
      kind: Cluster
      metadata:
        name: prod-cluster-01
      spec:
        forProvider:
          region: us-east-1
          version: "1.29"
          roleArnRef:
            name: eks-cluster-role
          resourcesVpcConfig:
            - subnetIdRefs:
                - name: private-subnet-1a
                - name: private-subnet-1b

    # 节点组定义
    - apiVersion: eks.aws.crossplane.io/v1alpha1
      kind: NodeGroup
      metadata:
        name: prod-nodegroup-01
      spec:
        forProvider:
          clusterNameRef:
            name: prod-cluster-01
          instanceTypes:
            - c7i.8xlarge
          scalingConfig:
            - minSize: 3
              maxSize: 50
              desiredSize: 10
```

## ArgoCD v3 更新（2025）

ArgoCD v3 在 KubeCon EU 2025 预发布，主要改进如下：

### 可扩展性改进

- **大规模集群支持**：改善管理数千个 Application 资源的性能
- **改进分片**：增强 Application Controller 的水平扩展
- **内存优化**：处理大型清单时减少内存使用

### 安全增强

- **RBAC 改进**：更细粒度的权限控制
- **审计日志**：增强所有操作的审计日志
- **密钥管理**：改进与 External Secrets Operator 的集成

### 迁移指南

从 ArgoCD v2.x 迁移到 v3：

1. 首先升级到 v2.13（确认兼容性）
2. 检查并更新废弃的 API
3. 在 v3 预发布版中测试功能
4. 执行生产环境升级

:::warning 注意事项
ArgoCD v3 在 2025 年上半年处于预发布状态。在生产环境中使用稳定版本（v2.13+），并在 v3 GA 发布后确认再进行迁移。
:::

## 结论

基于 GitOps 的大规模 EKS 集群运维策略可以显著减少手动管理负担，大幅提高稳定性和可扩展性。

:::tip 核心建议

**1. 通过 ACK/KRO 整合基础设施管理**

- Kubernetes 原生基础设施管理
- 与现有 Terraform 状态的兼容性

**2. 使用 ArgoCD ApplicationSets 进行多集群管理**

- 集群间一致的部署
- 按环境自定义

**3. 使用自动化 Blue/Green 升级策略**

- 无中断集群升级
- 自动回滚功能

**4. 基于 Policy as Code 的治理**

- 通过 OPA/Gatekeeper 强制策略
- 合规自动化

:::

通过分阶段迁移方法，可以在最小化风险的同时快速实现价值。