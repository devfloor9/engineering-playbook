---
title: "EKS Hybrid Nodes 共享文件存储解决方案"
sidebar_label: "3. File Storage"
description: "EKS Hybrid Nodes 环境中共享文件存储的全面实施指南，涵盖 AWS 托管服务、企业存储集成和 Amazon Linux 2023 替代方案"
tags: [eks, hybrid-nodes, storage, efs, fsx, nfs, amazon-linux-2023]
category: "hybrid-multicloud"
sidebar_position: 3
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Hybrid Nodes 共享文件存储解决方案

> 📅 **撰写日期**: 2025-09-15 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 9 分钟


## 概述

混合环境中的共享文件存储是实现多节点间数据共享、运行有状态应用以及维护云端与本地间数据一致性的关键组件。随着 Amazon Linux 2023 移除了传统高可用集群软件包（pacemaker、corosync），传统的 NFS 集群配置方式已不再适用。

本文档针对这些变化，介绍适用于 EKS Hybrid Nodes 环境的有效共享文件存储解决方案，反映了截至 2025 年的最新信息。

## 技术背景与现状

### Amazon Linux 2023 软件包策略变更

从 Amazon Linux 2 过渡到 Amazon Linux 2023 后，以下集群相关软件包已被移除：

- `corosync` 及相关库（`corosynclib`、`corosync-qdevice`、`corosync-qnetd`）
- `pacemaker` 完整软件包集（`pacemaker-cli`、`pacemaker-cluster-libs`、`pacemaker-remote` 等）

这一变化反映了 AWS 的战略方向。与其使用复杂的基础设施级集群，不如通过经过验证的托管服务提供更高的可靠性和运维效率。

### EKS Hybrid Nodes 支持的操作系统（2025 年更新）

EKS Hybrid Nodes 于 2024 年 12 月正式发布（GA）时，提到的支持操作系统如下：

**官方支持的操作系统（2025 年）：**

- **Amazon Linux 2023**：AWS 优化的操作系统，本地仅可在虚拟化环境中使用
- **Ubuntu**：支持 20.04、22.04、24.04 LTS 版本
- **Red Hat Enterprise Linux (RHEL)**：支持版本 8、9

**重要变更：**

- **Bottlerocket 支持已停止**：截至 2025 年，已从官方支持列表中移除
- **Rocky Linux**：仍未纳入官方支持列表，不在 AWS Support 范围内

**支持范围：**

- AWS 仅支持 EKS Hybrid 集成功能；操作系统支持由厂商负责
- AWS Support 仅提供混合节点连接和管理功能的支持

## 共享文件存储解决方案架构

### 1. 基于 AWS 托管服务的解决方案

### Amazon EFS (Elastic File System)

Amazon EFS 是 EKS Hybrid Nodes 环境中最推荐的共享文件存储解决方案。

**核心特性：**

- 支持 NFSv4.1 协议，与现有 NFS 客户端兼容
- 自动扩展/缩减，无需容量管理
- 跨多个可用区自动复制，提供 99.999999999%（11 个 9）的持久性
- 传输中加密和静态加密

**混合连接方式：**

- 通过 AWS Direct Connect 或 VPN 进行私有连接
- 通过 EFS Mount Helper 优化挂载性能
- 通过 EFS CSI Driver 实现 Kubernetes 原生集成

**实施注意事项：**

- 从本地访问 EFS 时的网络延迟考量
- 基于带宽使用的网络成本计算
- 备份和生命周期策略配置

### Amazon FSx

对于需要高性能的工作负载，可以考虑 Amazon FSx。

**FSx for Lustre：**

- 针对高性能计算 (HPC) 和 AI/ML 工作负载优化
- 原生 S3 集成，支持数据分层
- 支持数百 GB/s 吞吐量和数百万 IOPS
- 截至 2025 年，在 GenAI 推理工作负载中的使用场景增加

**FSx for NetApp ONTAP：**

- 与现有 NetApp 环境兼容
- 多协议支持（NFS、SMB、iSCSI）
- 高级数据管理功能（快照、克隆、复制）

**FSx for OpenZFS：**

- 高性能 NFS 工作负载支持
- 通过压缩和重复数据删除提高存储效率
- 内置快照和备份功能

### 2. 企业存储集成解决方案

利用现有的本地存储投资，同时与 Kubernetes 环境集成。

### 基于 CSI Driver 的集成

**NetApp Trident：**

- 支持 ONTAP、Cloud Volumes ONTAP、Azure NetApp Files
- 动态卷配置和快照管理
- 内置数据保护和灾难恢复功能

**Dell PowerScale CSI：**

- 基于 OneFS 的横向扩展 NAS 集成
- 满足高性能和大容量存储需求
- 多租户和 QoS 支持

**Pure Storage CSI：**

- FlashBlade 和 FlashArray 集成
- 全闪存性能，配合数据压缩/重复数据删除
- 云原生数据服务

### 实施架构

集成企业存储时，建议采用以下架构：

1. **存储后端配置**：在本地存储系统上配置 NFS 导出或 iSCSI 目标
2. **CSI Driver 部署**：在 Kubernetes 集群上安装供应商的 CSI Driver
3. **StorageClass 定义**：配置用于动态配置的存储类
4. **网络优化**：为存储流量配置专用网段

### 3. 基于混合操作系统的解决方案

针对特定需求或利用现有运维经验的替代方案。

### 基于 Ubuntu/RHEL 的传统 NFS 集群

**Ubuntu 22.04 LTS 方案：**

- 支持 `pacemaker`、`corosync`、`nfs-kernel-server` 软件包
- 5 年长期支持，提供稳定的运维环境
- 广泛的社区支持和文档

**RHEL 9 方案：**

- 企业级支持和安全更新
- Red Hat 高可用附加组件可用
- 利用现有 RHEL 运维经验

**实施注意事项：**

- 处理集群节点间的网络分区场景
- 存储后端的高可用配置
- 定期的集群健康监控和维护

## 实际实施案例与参考

### Dell PowerFlex + EKS Hybrid Nodes

Dell Technologies 的官方参考实施，在集成 PowerFlex 存储的 EKS Hybrid Nodes 环境中运行 PostgreSQL 数据库。

**性能结果：**

- 实现 238,804 读 IOPS
- 平均响应延迟 0.638ms
- 验证了并发会话数的可扩展性

**架构特点：**

- 通过 PowerFlex CSI Driver 实现动态卷配置
- 软件定义存储的灵活性与 Kubernetes 原生集成相结合
- 在混合环境中提供一致的存储管理体验

### Superbet (Happening) 分布式边缘案例

游戏和体育博彩平台 Superbet 利用 EKS Hybrid Nodes 管理分布式边缘环境的案例。

**实施目的：**

- 数据本地化以符合区域监管要求
- 通过集中式 Kubernetes 管理提高运维效率
- 在边缘位置实现低延迟服务交付

**存储策略：**

- 高性能存储用于本地缓存
- 网络存储用于中心数据同步
- 满足合规要求的数据保护

## Amazon 仓库软件包添加请求流程

### 软件包添加请求的可能性

Amazon Linux 2023 仓库软件包添加请求（例如 pacemaker、corosync）在技术上是可行的，但实际上非常有限。

### 官方请求流程

**通过 AWS Support：**

- 通过 AWS Support 控制台创建"功能请求"或"技术支持"案例
- 请求软件包添加时需包含以下信息：
  - 具体的业务案例和使用场景
  - 预估用户数量和市场需求分析
  - 现有替代方案的评审及其限制
  - 安全影响评估和漏洞分析
  - 长期维护和支持计划

### 现实期望与约束

**审查流程：**

- 初步审查：2-4 周（基础可行性检查）
- 详细评估：3-6 个月（安全性、兼容性、依赖性分析）
- 实施和测试：6-12 个月（如获批准）
- 整体流程：至少 1 年以上

**批准可能性：**

- 必须符合 AWS 战略方向
- 必须展示显著的客户需求和商业价值
- 必须满足安全性和稳定性标准
- 必须验证长期维护的成本效益分析

**AWS 优先事项：**

- 建议通过采用托管服务来解决问题
- 鼓励采用云原生方法
- 强调关注业务逻辑而非复杂的基础设施管理

### 替代方法

**源码编译方式（不推荐）：**

在 Amazon Linux 2023 中直接进行源码编译和软件包安装在技术上是可行的，但存在严重缺点：

- **复杂的依赖管理**：需要数十个依赖库和开发工具
- **缺少安全更新**：需要手动跟踪和应用安全补丁
- **系统稳定性风险**：未经验证的二进制文件可能导致系统不稳定
- **运维复杂度**：升级、备份、恢复流程的复杂度增加
- **排除支持**：AWS Support 无法提供故障排除协助

**推荐替代方案：**

1. **使用受支持的操作系统**：利用 Ubuntu 22.04 LTS 或 RHEL 9 获取所需软件包
2. **托管服务**：采用 Amazon EFS、FSx 等 AWS 原生解决方案
3. **企业解决方案**：集成经过验证的第三方存储解决方案和 CSI Driver

### 软件包请求注意事项

**提高成功概率的因素：**

- 多个企业客户提出相同请求
- 明确的技术必要性且无替代方案
- 与 AWS 合作伙伴生态系统的关联
- 广泛的开源社区支持

**表明高失败概率的因素：**

- 仅来自单个或少数客户的请求
- 现有 AWS 服务可解决的问题
- 软件包存在安全性或稳定性问题
- 维护负担较高的遗留软件

## 成本优化策略

### 各解决方案成本结构分析

### 成本优化建议

**短期策略：**

- 选择与工作负载特性匹配的适当性能模式
- 对未使用的数据应用生命周期策略
- 优化网络流量以降低数据传输成本

**长期策略：**

- 数据分层优化以降低存储成本
- 利用预留实例或 Savings Plans
- 在制定多云策略时考虑厂商独立性

## 安全与合规

### 数据保护

**加密：**

- 传输中加密：通过 TLS 1.2 保护 NFS 流量
- 静态加密：使用 AWS KMS 密钥保护数据
- 密钥管理：定期密钥轮换和访问控制

**访问控制：**

- 通过 IAM 策略实现细粒度权限管理
- 将 POSIX 权限与 AWS 访问控制集成
- 网络级访问控制（安全组、NACL）

### 合规注意事项

**数据主权：**

- 遵守区域数据留存要求
- 遵守跨境数据传输法规
- 满足本地数据处理要求

**审计与日志：**

- 通过 CloudTrail 记录 API 调用
- 通过 VPC Flow Logs 监控网络流量
- 文件访问日志的采集和分析

## 结论与建议

EKS Hybrid Nodes 环境中的共享文件存储配置代表着从传统集群方法向云原生解决方案的转型。Amazon Linux 2023 移除 pacemaker 和 corosync 软件包标志着这一转变，提供了向更稳定、更易管理的解决方案迁移的机会。

**核心建议：**

1. **优先选择 Amazon EFS**：适用于大多数使用场景的最佳选择，无需复杂设置即可提供企业级功能
2. **保护现有投资**：对于本地企业存储，通过 CSI Driver 集成以保护投资并获得云端优势
3. **分阶段实施**：从小规模开始，逐步扩展以最小化风险
4. **运维自动化**：最小化手动管理，建立自动化监控和恢复系统
5. **安全优先**：在初始设计阶段即考虑数据保护和合规要求

通过这种方法，您可以在 EKS Hybrid Nodes 环境中构建稳定、可扩展且成本高效的共享文件存储解决方案。

---

### 参考资料

- Amazon EKS Hybrid Nodes 官方文档
- Amazon EFS 用户指南
- EKS Hybrid Nodes 网络最佳实践
- Dell PowerFlex EKS Hybrid Nodes 参考
- Amazon Linux 2023 发行说明
- Kubernetes CSI Driver 开发指南
