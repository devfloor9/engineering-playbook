---
title: "AWS Nitro 架构与性能调优"
sidebar_label: "Nitro 架构与调优"
description: "AWS Nitro System 组件、各代（v2–v6）网络变化、EKS 节点上的 ENA 驱动/内核要求，以及以 PPS/CPS 为核心的性能调优策略"
created: 2026-06-19
last_update:
  date: 2026-06-20
  author: devfloor9
reading_time: 14
tags:
  - eks
  - networking
  - performance
  - ena
  - nitro
  - scope:tech
keywords:
  - Nitro System
  - ENA Express
  - PPS
  - conntrack
---

# AWS Nitro 架构与性能调优

> 📅 **创建**: 2026-06-19 | **更新**: 2026-06-20 | ⏱️ **阅读时间**: 约 14 分钟

## 概述

AWS Nitro System 是现代 Amazon EC2 实例的底层平台，决定了 EKS 工作节点的网络、存储与安全行为。Nitro 各代（v2–v6）在网络带宽、ENA（Elastic Network Adapter）功能与 TCP 行为上存在差异，从而改变节点 AMI 的 ENA 驱动/内核版本要求与性能调优要点。本文总结 Nitro 组件与各代变化，并从 EKS 节点角度阐述需确认的驱动/内核要求以及以 PPS（Packets Per Second）/CPS（Connections Per Second）为核心的调优策略。

## 背景

Nitro System 是一组将虚拟化开销卸载到专用硬件的组件集合。

- **Nitro 卡**：在与主板物理隔离的独立计算设备上处理所有 I/O 接口——网络、本地 NVMe 存储、管理、监控、安全。
- **Nitro 安全芯片**：集成于主板，提供硬件信任根。
- **Nitro Hypervisor**：仅负责内存/CPU 分配的轻量级 hypervisor，对大多数工作负载提供与裸机无异的性能。

可在实例系列规格页面的 **Platform summary 表的 `Hypervisor` 列** 查看实例的 Nitro 版本。各代功能为**累积式（cumulative）**——高版本包含低版本的全部功能（除非另有明确说明）。

## 各代网络变化

| 代际 | 主要变化 | 代表实例 |
|------|----------|----------|
| **v6** | 每张网卡最高 400 Gbps。空闲 TCP established 超时 432,000 秒 → **350 秒**。不支持 Traffic Mirroring | M8i·C8i·R8i, M8g, P6-B200, G7 |
| **v5** | 每卡最高 200 Gbps。不支持 Traffic Mirroring | M8g·C8g·R8g, Trn2, P5en, P6e-GB200 |
| **v4** | GPU/Trainium 系列 100 Gbps，其余最高 170 Gbps。支持 **ENA Express**，部分类型支持 RDMA 读/写（EFA）。支持 Traffic Mirroring | M7i·C7i·R7i, M7g, Inf2, Trn1, P5, G6 |
| **v3** | 每卡最高 100 Gbps。**传输中加密（encryption in transit）**。支持 Traffic Mirroring | C5n, R5n, P4d, G4dn, Inf1 |
| **v2** | 引入 **基于 ENA 的增强网络（enhanced networking）**。支持 Traffic Mirroring | M5·C5·R5, M6g·C6g, T3·T4g |

:::warning v6 缩短 TCP established 超时的影响

在 Nitro v6 上，空闲 TCP 连接的默认 established 超时从 432,000 秒 **大幅缩短至 350 秒**。维持长连接的工作负载——连接池、gRPC keepalive、长时间空闲的数据库连接——可能遭遇意外断连。应将应用/内核的 keepalive 设置（`net.ipv4.tcp_keepalive_time` 等）调得短于该超时，以保持连接存活。

:::

## 驱动与内核要求

Nitro 实例使用 ENA 实现增强网络，并以 NVMe 块设备暴露存储卷。要求随代际提升而趋严，且不仅影响性能，还直接关系到 ENI 挂载是否成功。

### ENA 驱动最低版本

- ENA Linux 驱动 **2.2.9 及以上**：Nitro v4 推荐，**Nitro v5 及以后为必需**。
- v5 上低于 2.2.9，或 v5 之前的代际低于 1.2.0 的驱动，会导致 **ENI 挂载失败**。
- **加速路径（accelerated path）功能仅在较新的 ENA 驱动（2.2.9+）上可用**。旧驱动不支持加速路径并会降低 PPS 性能。因此驱动更新实质上是首要调优项。

### 各发行版最低内核版本

为获得 ENA 功能的最佳性能，部分发行版要求最低内核版本。

| 发行版 | 最低内核 |
|--------|----------|
| Linux upstream | 5.9 |
| Amazon Linux 2 | 4.14.186 |
| RHEL | 8.4 (4.18.0-305) |
| Ubuntu | 20.04 (5.4.0-1025-aws) |
| Debian | 11 (5.10.0) |

Amazon Linux 2023 与 Bottlerocket 默认支持 Nitro v4+ 的 ENA 功能，无需单独的内核调优。EKS 节点应尽可能使用基于 Amazon Linux 2023 或 Bottlerocket 的 AMI，以降低驱动/内核管理负担。

### Graviton（arm64）额外要求

Graviton 处理器实例要求 64 位 ARM 架构 AMI，以及支持 ACPI 表和 PCI 设备 ACPI 热插拔的 UEFI 引导，且仅支持 Linux 操作系统。

## 网络性能调优

所有现代 EC2 实例都在 Nitro 卡上处理网络数据包。Nitro 卡对新流的首包评估安全组、ACL 与路由，对同一流的后续包复用缓存信息以降低开销。流由源/目的 IP、端口和协议构成的 **5 元组** 标识。

### 同时考虑 PPS 与 CPS

新连接（CPS）需要完整的 5 元组评估，开销较大；只有连接建立后的数据包（PPS）才受益于加速路径。DNS、防火墙、虚拟路由器等新连接率高的工作负载从加速中获益较少，因此应将应用设计为复用连接。

### 关键调优点

- **保持 ENA 驱动最新**：启用加速路径的前提。保持在上述最低版本及以上。
- **避免非对称路由**：入站/出站接口不同会触发安全组 conntrack 跟踪并降低峰值性能。耗尽 conntrack 配额会限流新连接。
- **优先同 AZ 通信**：长距离连接因 TCP windowing 和 RTT 增大而降低 PPS。
- **BQL（Byte Queue Limit）**：在 ENA 驱动和大多数发行版中默认禁用。与 fragment proxy override 同时启用可能限制性能。

### 内核参数与驱动调优

Nitro 实例的网络性能可通过 ENA 驱动模块参数、ethtool 设置和内核 sysctl 值进行调整。下列项目区分了 AWS 官方文档明确给出的调优点，以及按工作负载特性调整的通用内核参数。所有取值在应用前后均建议以峰值 active flow 为基准进行基准测试。

#### ENA 驱动模块参数

| 项目 | 说明 | 应用方法 |
|------|------|----------|
| `enable_frag_bypass` | 绕过出站分片 PPS 限制（1024）的 fragment proxy 模式。适用于因超出 MTU 而频繁分片的工作负载 | 加载驱动时：`sudo insmod ena.ko enable_frag_bypass=1` |

请勿将 fragment proxy 模式与 BQL 同时启用，否则可能限制性能。详细选项请参阅 ENA Linux 驱动 README 与 Best Practices 指南。

#### ENA 队列与环形缓冲区（ethtool）

高性能网络工作负载应使用多个 ENA 队列以在 vCPU 间分散处理。受支持的实例类型可按 ENI 动态分配队列（Flexible ENA queue allocation）。使用 `ethtool` 查看并调整队列数量与环形缓冲区大小。

```bash
# 查看并调整当前通道（队列）数
ethtool -l eth0
ethtool -L eth0 combined <N>

# 查看并调整环形缓冲区大小（出现丢包时调大）
ethtool -g eth0
ethtool -G eth0 rx <SIZE> tx <SIZE>
```

#### 连接管理（conntrack · TCP keepalive）

- **空闲连接超时**：安全组 connection tracking 会跟踪空闲连接并消耗 conntrack 配额。若要快速关闭空闲连接，使用 connection tracking 超时；若要保持空闲连接打开，使用 TCP keepalive。
- **Nitro v6 应对**：v6 的 established 超时短至 350 秒，因此在需要维持长连接时，应将内核 keepalive 周期设得短于该值。

```bash
# TCP keepalive —— 保持空闲连接存活（短于 350 秒）
sysctl -w net.ipv4.tcp_keepalive_time=300
sysctl -w net.ipv4.tcp_keepalive_intvl=30
sysctl -w net.ipv4.tcp_keepalive_probes=5
```

#### 按工作负载的通用内核参数

AWS 未对以下 sysctl 提供统一推荐值；当观察到 NMA 暴露的相应内核事件（`ApproachingKernelPidMax`、`ApproachingMaxOpenFiles`、`ConntrackExceededKernel`）或 ethtool 丢包指标时，按工作负载调高。

| 参数 | 触发条件（NMA 事件等） |
|------|------------------------|
| `net.netfilter.nf_conntrack_max` | `ConntrackExceededKernel` —— 内核 conntrack 表饱和 |
| `kernel.pid_max` | `ApproachingKernelPidMax` —— PID 即将耗尽 |
| `fs.file-max` / `fs.nr_open` | `ApproachingMaxOpenFiles` —— open file 限制即将到达 |
| `net.core.somaxconn`、`net.ipv4.tcp_max_syn_backlog` | 高 CPS 服务的连接接受队列饱和 |
| `net.core.rmem_max` / `net.core.wmem_max` | 高带宽（100 Gbps+）传输时的套接字缓冲区 |

:::warning 在 EKS 节点上应用 sysctl 的方法

在 EKS 工作节点上永久应用上述内核参数时，不要直接修改节点 OS，而应在节点引导层进行设置。

- **托管节点组 / self-managed**：launch template user data，或 Bottlerocket 的 `[settings.kernel.sysctl]` 设置
- **按 Pod**：Pod `securityContext.sysctls`（namespaced sysctl），或 privileged init container
- **DaemonSet**：当需要节点全局 sysctl 时，使用在启动时应用的 node-tuning DaemonSet

`net.core.*`、`net.ipv4.tcp_*` 等节点全局（non-namespaced）参数无法通过 Pod `securityContext` 设置，必须在节点引导层应用。

:::

通过 ENA 驱动暴露的 ethtool 指标（`bw_in/out_allowance_exceeded`、`pps_allowance_exceeded`、`conntrack_allowance_exceeded`、`conntrack_allowance_available` 等）监控性能指标。该值非零表示相应配额已达上限——应考虑内核调优或迁移到更高 Nitro 代际的实例。

### EKS 视角的关联信号

EKS Node Monitoring Agent（NMA）将 Nitro/ENA 层的配额超限暴露为节点 Event。代表性的有 `BandwidthInExceeded`、`BandwidthOutExceeded`、`PPSExceeded`、`ConntrackExceeded`、`LinkLocalExceeded`、`NetworkSysctl`。它们为 Event 严重程度，不会触发 Auto Repair。由于自动节点替换无法解决这些问题，反复出现时需要设计层面的应对，如更大的实例类型（更高 Nitro 代际）或分散工作负载。节点健康信号的解读参见 [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md)。

## 总结

Nitro 代际是决定 EKS 节点网络带宽、TCP 行为与驱动要求的硬件层。应先确认工作负载将运行的实例系列的 Nitro 版本；v5 及以后需要满足 ENA 驱动 2.2.9+ 的 AMI。v6 实例需针对缩短的 TCP established 超时调优 keepalive，高 PPS/CPS 工作负载应设计为复用连接并避免非对称路由，以最大化利用加速路径。内核参数调优以 ENA 驱动模块选项、ethtool 队列/环形缓冲区、conntrack/keepalive sysctl 为核心；由于 AWS 未提供统一的按工作负载推荐值，应基于 ethtool 配额指标与 NMA 事件并通过基准测试进行调整。在 EKS 节点上，通过节点引导层（launch template user data、Bottlerocket 设置）或 Pod `securityContext` 应用。

## 参考资料

### 官方文档
- [Instances built on the AWS Nitro System](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html) —— 各代网络功能、实例映射、驱动/内核要求
- [Nitro system considerations for performance tuning](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-nitro-perf.html) —— 数据包流、PPS/CPS、加速路径与 PPS 调优（`enable_frag_bypass`）
- [ENA Linux Driver Best Practices and Performance Optimization Guide](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/ENA_Linux_Best_Practices.rst) —— ENA 驱动队列/环形缓冲区/调优最佳实践
- [Monitor network performance for ENA settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html) —— ethtool 配额指标监控
- [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) —— Nitro 组件概述

### 技术博客
- [Using connection tracking improvements to increase network performance](https://aws.amazon.com/blogs/networking-and-content-delivery/using-connection-tracking-improvements-to-increase-network-performance/) —— conntrack 配额与性能
- [EC2 instance-level network performance metrics](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-ec2-instance-level-network-performance-metrics-uncover-new-insights/) —— 监控 ENA 配额超限指标

### 相关文档（内部）
- [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md) —— 节点网络配额超限事件的解读
- [Cilium ENI + Gateway API](./gateway-api-adoption-guide/cilium-eni-gateway-api.md) —— 基于 ENA 驱动的 ENI 模式网络
