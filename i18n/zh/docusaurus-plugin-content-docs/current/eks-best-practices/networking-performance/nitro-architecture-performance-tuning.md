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

> **创建**: 2026-06-19 | **更新**: 2026-06-20 | **阅读时间**: 约 14 分钟

## 概述

AWS Nitro System 是现代 Amazon EC2 实例的底层平台，决定了 EKS 工作节点的网络、存储和安全行为。Nitro 各代（v2–v6）在网络带宽、ENA（Elastic Network Adapter）功能和 TCP 行为上存在差异，从而影响节点 AMI 的 ENA 驱动/内核要求与调优要点。本文总结 Nitro 组件、各代变化，以及与 EKS 节点相关的驱动/内核要求和以 PPS/CPS 为核心的调优。

## 背景

Nitro 将虚拟化功能卸载到专用硬件：

- **Nitro 卡**：在与主板物理隔离的独立设备上处理所有 I/O（网络、本地 NVMe 存储、管理、监控、安全）。
- **Nitro 安全芯片**：集成于主板，提供硬件信任根。
- **Nitro Hypervisor**：仅负责 CPU/内存分配的轻量级 hypervisor，性能接近裸机。

可在实例系列规格页面的 **Platform summary 表的 `Hypervisor` 列** 查看实例的 Nitro 版本。功能为**累积式**——除非另有说明，新版本包含此前所有版本的功能。

## 各代网络变化

| 代际 | 主要变化 | 代表实例 |
|------|----------|----------|
| **v6** | 每张网卡最高 400 Gbps。空闲 TCP established 超时从 432,000 秒缩短至 **350 秒**。不支持 Traffic Mirroring | M8i·C8i·R8i, M8g, P6-B200, G7 |
| **v5** | 每卡最高 200 Gbps。不支持 Traffic Mirroring | M8g·C8g·R8g, Trn2, P5en, P6e-GB200 |
| **v4** | GPU/Trainium 100 Gbps，其余最高 170 Gbps。支持 **ENA Express**，部分类型支持 RDMA 读/写（EFA）。支持 Traffic Mirroring | M7i·C7i·R7i, M7g, Inf2, Trn1, P5, G6 |
| **v3** | 最高 100 Gbps。**传输中加密（encryption in transit）**。支持 Traffic Mirroring | C5n, R5n, P4d, G4dn, Inf1 |
| **v2** | 引入 **基于 ENA 的增强网络（enhanced networking）**。支持 Traffic Mirroring | M5·C5·R5, M6g·C6g, T3·T4g |

:::warning v6 缩短 TCP established 超时的影响

Nitro v6 将默认空闲 TCP established 超时从 432,000 秒大幅缩短至 **350 秒**。维持长连接的工作负载（连接池、gRPC keepalive、空闲数据库连接）可能遭遇意外断连。应将内核 keepalive（`net.ipv4.tcp_keepalive_time` 等）设置为短于该超时，以保持连接存活。

:::

## 驱动与内核要求

Nitro 实例使用 ENA 实现增强网络，并以 NVMe 块设备暴露存储卷。要求随代际提升而趋严，且不仅影响性能，还影响 ENI 挂载是否成功。

### ENA 驱动最低版本

- ENA Linux 驱动 **2.2.9 及以上**：Nitro v4 推荐，**Nitro v5 及以后为必需**。
- v5 上低于 2.2.9（或 v5 之前低于 1.2.0）会导致 **ENI 挂载失败**。
- **加速路径（accelerated path）功能仅在较新的 ENA 驱动（2.2.9+）上可用**；旧驱动不支持并会降低 PPS。因此驱动更新实质上是首要调优项。

### 各发行版最低内核版本

| 发行版 | 最低内核 |
|--------|----------|
| Linux upstream | 5.9 |
| Amazon Linux 2 | 4.14.186 |
| RHEL | 8.4 (4.18.0-305) |
| Ubuntu | 20.04 (5.4.0-1025-aws) |
| Debian | 11 (5.10.0) |

Amazon Linux 2023 和 Bottlerocket 默认支持 Nitro v4+ 的 ENA 功能。EKS 节点优先选用这些 AMI 以降低驱动/内核管理负担。Graviton（arm64）实例还需 64 位 ARM AMI 及带 ACPI 的 UEFI 引导。

## 网络性能调优

所有现代 EC2 实例都在 Nitro 卡上处理网络数据包。流由 **5 元组**（源/目的 IP、源/目的端口、协议）标识。新流的首包会被完整评估，后续包经加速路径复用缓存状态。

### 同时考虑 PPS 与 CPS

新连接（CPS）需要完整的 5 元组评估，开销较大；只有连接建立后的数据包（PPS）才受益于加速。高连接churn 工作负载（DNS、防火墙、路由器）从加速中获益较少——应设计为复用连接。

### 关键调优点

- **保持 ENA 驱动最新**：加速路径的前提。
- **避免非对称路由**：入站/出站接口不同会触发安全组 conntrack 跟踪并降低峰值性能；耗尽 conntrack 配额会限流新连接。
- **优先同 AZ 通信**：长距离因 TCP windowing 与 RTT 增大而降低 PPS。
- **BQL（Byte Queue Limit）**：默认禁用；与 fragment proxy override 同时启用可能限制性能。

### 内核参数与驱动调优

可通过 ENA 驱动模块参数、ethtool 设置和内核 sysctl 进行调优。下列项目将 AWS 明确给出的调优点与需按工作负载基准测试调整的通用内核参数加以区分。

**ENA 驱动模块参数**

| 项目 | 说明 | 方法 |
|------|------|------|
| `enable_frag_bypass` | 绕过出站分片 PPS 限制（1024）的 fragment proxy 模式 | `sudo insmod ena.ko enable_frag_bypass=1` |

请勿将 fragment proxy 模式与 BQL 同时启用。

**ENA 队列与环形缓冲区（ethtool）**

高性能工作负载需要多个 ENA 队列以在 vCPU 间分散处理。受支持的类型可按 ENI 动态分配队列（Flexible ENA queue allocation）。

```bash
ethtool -l eth0; ethtool -L eth0 combined <N>   # 通道/队列
ethtool -g eth0; ethtool -G eth0 rx <SIZE> tx <SIZE>   # 环形缓冲区（出现丢包时调大）
```

**连接管理（conntrack / TCP keepalive）**

通过 connection tracking 超时关闭空闲连接，或通过 TCP keepalive 保持其打开。在 Nitro v6（350 秒超时）上应将 keepalive 设得更短：

```bash
sysctl -w net.ipv4.tcp_keepalive_time=300
sysctl -w net.ipv4.tcp_keepalive_intvl=30
sysctl -w net.ipv4.tcp_keepalive_probes=5
```

**按工作负载的通用内核参数**（AWS 未给出统一推荐值；当出现相应 NMA 事件 / ethtool 丢包时按工作负载调高）：

| 参数 | 触发条件（NMA 事件等） |
|------|------------------------|
| `net.netfilter.nf_conntrack_max` | `ConntrackExceededKernel` |
| `kernel.pid_max` | `ApproachingKernelPidMax` |
| `fs.file-max` / `fs.nr_open` | `ApproachingMaxOpenFiles` |
| `net.core.somaxconn`、`net.ipv4.tcp_max_syn_backlog` | 高 CPS 接受队列饱和 |
| `net.core.rmem_max` / `net.core.wmem_max` | 高带宽（100 Gbps+）时的套接字缓冲区 |

:::warning 在 EKS 节点上应用 sysctl

应在节点引导层应用，而非直接修改节点 OS：launch template user data 或 Bottlerocket 的 `[settings.kernel.sysctl]`；按 Pod 通过 `securityContext.sysctls`（仅限 namespaced）。`net.core.*`、`net.ipv4.tcp_*` 等节点全局（non-namespaced）参数无法通过 Pod `securityContext` 设置，必须在引导层应用。

:::

通过 ENA ethtool 指标监控（`bw_in/out_allowance_exceeded`、`pps_allowance_exceeded`、`conntrack_allowance_exceeded`、`conntrack_allowance_available`）。非零值表示已触及某项配额上限——应考虑内核调优或升级到更高 Nitro 代际。

### EKS 健康信号

NMA 将 Nitro/ENA 配额超限暴露为节点 Event：`BandwidthInExceeded`、`BandwidthOutExceeded`、`PPSExceeded`、`ConntrackExceeded`、`LinkLocalExceeded`、`NetworkSysctl`。这些为 Event 严重程度，不会触发 Auto Repair，因此反复出现时需要设计层面的应对（更大实例 / 更高 Nitro 代际，或分散工作负载）。参见 [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md)。

## 总结

Nitro 代际决定了 EKS 节点的网络带宽、TCP 行为和驱动要求。应先确认目标实例系列的 Nitro 版本；v5+ 需要满足 ENA 驱动 2.2.9+ 的 AMI。v6 实例需针对缩短的 TCP 超时调优 keepalive，高 PPS/CPS 工作负载应设计为复用连接并避免非对称路由。由于 AWS 未发布统一的 sysctl 推荐值，调优应以 ethtool 配额指标和 NMA 事件为依据，并在节点引导层或通过 Pod `securityContext` 应用。

## 参考资料

- [Instances built on the AWS Nitro System](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html)
- [Nitro system considerations for performance tuning](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-nitro-perf.html)
- [ENA Linux Driver Best Practices and Performance Optimization Guide](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/ENA_Linux_Best_Practices.rst)
- [Monitor network performance for ENA settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html)
- [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md)
