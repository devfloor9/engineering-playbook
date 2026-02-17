---
title: "混合基础设施"
sidebar_label: "Hybrid Infrastructure"
description: "使用 Amazon EKS 构建混合和多云环境的高级技术文档"
sidebar_position: 4
last_update:
  date: 2026-02-13
  author: devfloor9
category: "hybrid"
---

# 混合基础设施

现代企业基础设施环境正在超越云与本地之间的界限。通过 Amazon EKS Hybrid Nodes，企业现在可以将云原生平台的能力扩展到自己的数据中心。这种方法不仅仅是简单地连接两个环境，而是使组织能够在统一的管理平面下将本地和云资源作为单一 Kubernetes 集群运行。

混合基础设施的核心价值在于灵活性和选择。即使数据主权或监管要求强制某些数据保留在本地，应用程序的其余部分仍可利用云的弹性和可扩展性。组织还可以继续利用现有的本地硬件投资，特别是昂贵的 GPU 服务器或专用硬件，同时享受基于云的现代管理工具和自动化能力。

EKS Hybrid Nodes 在每台本地服务器上部署轻量级代理，与 AWS EKS 控制平面进行安全通信。这些代理通过 VPN 或 AWS Direct Connect 经加密通道接收管理命令，而实际工作负载在本地执行。这种架构对于网络延迟至关重要的应用程序或需要在本地处理大量数据的场景尤其有价值。

从存储管理的角度来看，混合环境提供了新的可能性。使用 Harbor 镜像仓库可以在本地管理容器镜像并与云同步，传统的存储协议如 NFS 或 iSCSI 可以与 Kubernetes 持久卷集成。通过动态资源分配 (DRA) 技术，Kubernetes 可以原生识别和分配 GPU 或 FPGA 等专用硬件，使高性能计算工作负载的放置更加精细。

Cloud Bursting 代表了混合基础设施最具吸引力的使用模式之一。组织可以在正常运行期间使用本地资源，然后在流量激增或特殊事件发生时自动将工作负载扩展到云端。结合 Karpenter 等自动扩缩容工具，这种方法在保持成本效率的同时，可在需要时获得几乎无限的计算能力。

## 文档列表（实施顺序）

### 步骤 1: Hybrid Nodes 基础指南

**[EKS Hybrid Nodes 完整指南](./hybrid-nodes-adoption-guide.md)**
将本地节点连接到 EKS 集群的基本方法、混合网络配置和安全设置、混合环境迁移策略、工作负载选择和放置标准

### 步骤 2: 高性能网络 (SR-IOV)

**[DGX H200 SR-IOV 网络配置](./sriov-dgx-h200-hybrid.md)**
通过 SR-IOV 实现高性能网络、NVIDIA DGX H200 系统集成和优化

### 步骤 3: 共享存储配置

**[EKS Hybrid Nodes 共享文件存储解决方案](./hybrid-nodes-file-storage.md)**
本地节点的文件存储配置、NFS/iSCSI 使用和数据同步

### 步骤 4: 容器镜像仓库集成

**[Harbor 2.13 与 EKS Hybrid Nodes 集成指南](./harbor-hybrid-integration.md)**
通过 Harbor 运营容器镜像仓库、本地与云之间的镜像同步
