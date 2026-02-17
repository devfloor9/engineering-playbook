---
title: "ROSA (Red Hat OpenShift on AWS)"
sidebar_label: "ROSA"
description: "关于 ROSA (Red Hat OpenShift Service on AWS) 集群部署和运维的技术文档"
sidebar_position: 6
last_update:
  date: 2026-02-13
  author: devfloor9
category: "rosa"
---

# ROSA (Red Hat OpenShift on AWS)

本章节涵盖 ROSA (Red Hat OpenShift Service on AWS) 集群部署和运维的技术文档。ROSA 是由 AWS 和 Red Hat 联合管理的完全托管 OpenShift 服务，可轻松构建企业级 Kubernetes 平台。

## 📚 主要文档（实施顺序）

### 步骤 1: 集群安装和配置

- **[ROSA 演示安装指南](./rosa-demo-installation.md)**
  - 基于 STS (Security Token Service) 的集群创建
  - 通过 ROSA CLI 逐步安装
  - 自动扩缩容配置
  - 网络和 IAM 角色设置
  - 初始集群验证
  - 实验环境配置和测试

### 步骤 2: 安全和访问控制

- **[ROSA 安全合规控制台访问控制](./rosa-security-compliance.md)**
  - Red Hat Hybrid Cloud Console 访问控制配置
  - 满足金融行业安全要求的访问控制策略
  - IdP (Identity Provider) 集成和 MFA 配置
  - 基于角色的访问控制 (RBAC) 配置
  - 审计和日志设置

## 🎯 学习目标

通过本章节，您将学习：

- ROSA 集群安装和初始配置方法
- 基于 STS 的 IAM 角色配置和安全最佳实践
- 通过 Red Hat Hybrid Cloud Console 进行集中管理
- 满足金融行业安全要求的策略
- IdP 集成和用户认证管理
- 集群自动扩缩容和资源管理
- ROSA 集群运维和监控
- 从本地 OpenShift 迁移到 ROSA

## 🏗️ 架构模式

```mermaid
graph TB
    subgraph AWS[\"AWS Cloud\"]
        subgraph ROSA[\"ROSA Cluster\"]
            CP[\"Control Plane<br/>(Red Hat Managed)\"]
            WN[\"Worker Nodes<br/>(Customer Managed)\"]
            IN[\"Infrastructure Nodes<br/>(System Components)\"]
        end
        IAM[\"IAM Roles<br/>(STS Token Service)\"]
        VPC[\"VPC & Networking<br/>(Customer VPC)\"]
        KMS[\"KMS & Secrets<br/>(Encryption)\"]
    end

    subgraph RedHat[\"Red Hat\"]
        HCC[\"Hybrid Cloud Console<br/>(Central Management)\"]
        Registry[\"Quay Registry<br/>(Container Images)\"]
        OIDC[\"OIDC Provider<br/>(Authentication)\"]
    end

    subgraph Customer[\"Customer Environment\"]
        IdP[\"Identity Provider<br/>(Okta/Azure AD/etc)\"]
        Admin[\"Administrators<br/>(Access Management)\"]
        OnPrem[\"On-Premises Systems<br/>(Hybrid Integration)\"]
    end

    Admin -->|Authentication| IdP
    IdP -->|OIDC Tokens| OIDC
    OIDC -->|Identity| HCC
    HCC -->|Management| CP
    CP -->|Orchestration| WN
    CP -->|System| IN
    WN & IN -->|Compute| AWS
    IAM <-->|STS| ROSA
    KMS <-->|Encryption| ROSA
    VPC <-->|Networking| ROSA
    HCC -->|Container Images| Registry
    OnPrem <-->|Hybrid Workloads| ROSA

    style AWS fill:#ff9900
    style RedHat fill:#c41e3a
    style Customer fill:#34a853
```

## 🔧 关键技术和工具

| 技术 | 描述 | 用途 |
|-----------|-------------|---------|
| **ROSA CLI** | OpenShift 集群管理命令行工具 | 集群创建、管理、删除 |
| **STS (Security Token Service)** | 临时安全凭证 | 增强 IAM 角色管理 |
| **OIDC** | OpenID Connect 协议 | 外部身份提供商集成 |
| **OVNKubernetes** | OpenShift 网络插件 | 高性能网络 |
| **Cluster Autoscaler** | 自动扩缩容 | 根据工作负载自动调整节点 |
| **Hybrid Cloud Console** | Red Hat 集中管理门户 | 多集群集中管理 |
| **Quay Registry** | 容器镜像仓库 | 构建和部署自动化 |

## 💡 核心概念

### ROSA 特性

- **完全托管服务**: AWS 和 Red Hat 联合管理控制平面
- **高可用性**: 自动补丁和更新
- **安全性**: 基于 STS 的临时凭证、OIDC 提供商集成
- **灵活性**: 客户对 Worker Node 有完全控制权

### 基于 STS 认证的优势

- **临时凭证**: 无需永久访问密钥
- **自动令牌更新**: 令牌在过期前自动更新
- **最小权限**: 仅授予最低限度的必要权限
- **审计追踪**: 所有访问记录在 CloudTrail 中

### Red Hat Hybrid Cloud Console 的角色

- **集中管理**: 从一个界面管理多个集群
- **多云支持**: 跨 AWS、Azure、GCP、本地 OpenShift 的集成管理
- **基于策略的管理**: 集中安全策略执行
- **成本追踪**: 监控各集群的成本

### 网络配置

- **OVNKubernetes**: 基于 OpenVSwitch 的高性能网络
- **Network Policy**: 完全支持 Kubernetes 网络策略
- **Ingress Controller**: 内置 Ingress Controller
- **Service Mesh Ready**: 集成 Istio/Kiali 支持

## 💼 使用场景

### 企业迁移

- **本地 OpenShift → ROSA**: 从现有 OpenShift 迁移到 ROSA
- **降低管理负担**: 自动化控制平面运维
- **成本节约**: 降低运营成本
- **全球扩展**: 多区域部署

### 金融行业合规

- **安全要求**: 通过 STS、OIDC、MFA 实现高级安全
- **访问控制**: 细粒度权限管理
- **审计日志**: 所有活动的记录和追踪
- **数据保护**: 基于 KMS 的加密

### 混合云策略

- **本地 + AWS**: 单一平台管理
- **多云**: 同时管理 AWS、Azure、GCP
- **Cloud Bursting**: 在需求高峰时扩展到云端
- **灾难恢复**: 多区域灾难恢复策略

## 📊 ROSA vs EKS vs 本地 OpenShift

| 项目 | ROSA | EKS | 本地 OpenShift |
|------|------|-----|----------------------|
| **控制平面管理** | Red Hat/AWS | AWS | 客户自行负责 |
| **安全性** | 最高 | 高 | 需要配置 |
| **成本** | 中高 | 低中 | 高初始投资 |
| **运维复杂度** | 低 | 低 | 高 |
| **开发者体验** | 最高 | 高 | 非常高 |
| **部署速度** | 快 | 快 | 慢 |
| **混合支持** | 优秀 | 一般 | 优秀 |
| **多云** | 优秀 | 仅 AWS | 优秀 |

## 🚀 部署模式

### 1. 单集群部署

```
ROSA Cluster
├── Development Namespace
├── Staging Namespace
└── Production Namespace
```

### 2. 多集群部署

```
Hybrid Cloud Console (Central Management)
├── AWS Region 1 (ROSA)
├── AWS Region 2 (ROSA)
├── On-Premises (OpenShift)
└── Multi-Cloud (Azure/GCP)
```

### 3. 高可用部署

```
Primary Region (ROSA)
├── Active Cluster
├── Replication to DR
└── Auto-failover
    └── Secondary Region (ROSA)
```

## 🔗 相关分类

- [混合基础设施](/docs/hybrid-infrastructure) - 混合环境管理
- [安全与治理](/docs/security-governance) - ROSA 安全架构
- [基础设施优化](/docs/infrastructure-optimization) - 网络优化
- [运维与可观测性](/docs/operations-observability) - 集群监控

---

:::tip 提示
ROSA 是由 AWS 和 Red Hat 联合管理的服务，大大降低了控制平面运维负担。特别是在金融或企业环境中，ROSA 的安全和合规功能非常有价值。
:::

:::info 推荐学习路径

1. 了解 ROSA 基本概念
2. 创建基于 STS 的集群
3. IdP 集成和用户管理
4. 利用 Hybrid Cloud Console
5. 高级部署模式（多集群、混合）
:::

:::warning 注意 - 许可
ROSA 需要单独的 OpenShift 许可证。在预算中需要同时考虑 ROSA 服务成本和 OpenShift 许可成本。
:::

:::success 迁移提示
如果计划从本地 OpenShift 迁移到 ROSA，请制定**分阶段迁移策略**：

1. 从开发/测试环境开始
2. 迁移非关键业务工作负载
3. 积累运维经验后，再迁移生产工作负载
:::
