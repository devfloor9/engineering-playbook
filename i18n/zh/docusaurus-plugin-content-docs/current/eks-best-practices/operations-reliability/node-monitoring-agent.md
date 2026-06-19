---
title: "EKS Node Monitoring Agent"
sidebar_label: "Node Monitoring Agent"
description: "AWS EKS Node Monitoring Agent 的架构、部署策略、限制和最佳实践——自动检测并报告节点健康问题"
tags: [eks, monitoring, node-monitoring, aws, observability, cloudwatch]
category: "observability-monitoring"
last_update:
  date: 2026-06-19
  author: devfloor9
---

# EKS Node Monitoring Agent

> **创建**: 2025-08-26 | **更新**: 2026-06-19 | **阅读时间**: 约 9 分钟

## 概述

EKS Node Monitoring Agent（NMA）是 AWS 提供的节点健康监控工具，可自动检测并报告 EKS 集群节点上的硬件与系统级问题。该功能于 2024 年正式发布（GA），与 Node Auto Repair 配合使用以提升集群稳定性。

### 主要特性

- **基于日志的问题检测**：实时分析系统日志并进行模式匹配
- **自动事件生成**：检测到问题时创建 Kubernetes Events 和 Node Conditions
- **CloudWatch 集成**：通过 CloudWatch 进行集中式监控
- **EKS Add-on 支持**：简化安装与管理

## 启用方式

无需向 AWS 提交额外申请——NMA 为自助启用。EKS Auto Mode 默认内置；其他计算类型（托管节点组、Karpenter、自管理）可通过 EKS 托管插件（`eks-node-monitoring-agent`）或 Helm 添加。仅支持 Linux，不支持 Fargate。

## 架构

以 DaemonSet 方式部署，监控以下子系统：Container Runtime、Storage、Networking、Kernel 以及 Accelerated Hardware（GPU/Neuron）。采用 controller-runtime 实现与 Kubernetes 的原生集成。

### Node Conditions

除标准的 `Ready`、`DiskPressure`、`MemoryPressure` 外，还包括 `ContainerRuntimeReady`、`StorageReady`、`NetworkingReady`、`KernelReady`、`AcceleratedHardwareReady`。

### 严重程度：Condition 与 Event

NMA 按严重程度对问题分类，这决定了 Node Auto Repair 是否执行操作：

- **Condition**：需要执行 Replace/Reboot 的终止性问题。启用 Auto Repair 时会触发修复。
- **Event**：临时或非关键问题。**不会**触发 Auto Repair，仅记录用于排查。

**containerd 场景**：因运行时故障导致 Pod 卡在终止状态时，表现为 `PodStuckTerminating`（Condition → Replace）。而单纯的容器创建失败（`ContainerRuntimeFailed`）仅为 Event，不会自动修复。

## Node Auto Repair 联动

NMA 单独使用仅提供可见性；与 Auto Repair 配合方可实现自动 Replace/Reboot。

- **仅 Auto Repair（无 NMA）** 响应：kubelet 的 `Ready`、手动删除的 node object、加入集群失败的托管节点组实例。
- **Auto Repair + NMA** 额外响应：`AcceleratedHardwareReady`、`ContainerRuntimeReady`、`KernelReady`、`NetworkingReady`、`StorageReady`。

| Condition | 修复等待时间 | 操作 |
|-----------|-------------|------|
| `AcceleratedHardwareReady` | 10 分钟 | Replace 或 Reboot |
| `ContainerRuntimeReady` | 30 分钟 | Replace |
| `KernelReady` / `NetworkingReady` / `StorageReady` / `Ready` | 30 分钟 | Replace |
| `DiskPressure` / `MemoryPressure` | 不适用 | 无 |

:::warning DiskPressure / MemoryPressure / PIDPressure 不属于自动修复对象

Auto Repair 有意不响应这些标准 Kubernetes 条件——它们通常反映应用或工作负载配置问题，而非节点级故障，应交由 Kubernetes node-pressure eviction 处理。因此，以内存/磁盘/PID 压力形式表现的容器负载不会触发节点替换；只有真正的运行时故障（如 `PodStuckTerminating` 这类 Condition）才会触发。

:::

**安全护栏**：当节点组/NodePool 中超过 20% 的节点不健康时，会停止新的修复操作（托管节点组还要求节点数 >5；发生 ARC zonal shift 时停止）。启用方式：Auto Mode（始终开启）、Karpenter（feature gate `NodeRepair=true`）、托管节点组（`--node-repair-config enabled=true`）。

## 限制

- 并非指标采集工具——仅基于日志分析
- 无法检测突发硬件故障或网络完全中断
- Prometheus 端点功能有限（端口 8080）

## 最佳实践

将 NMA 作为多层监控栈中的 L1（状态检测）：L1 NMA → L2 Container Insights/Prometheus → L3 Node Auto Repair → L4 统一仪表盘。

资源占用（插件/Helm 默认值）：requests CPU 10m / Memory 30Mi，limits CPU 250m / Memory 100Mi。

## 参考资料

- [Detect node health issues and enable automatic node repair](https://docs.aws.amazon.com/eks/latest/userguide/node-health.html)
- [Detect node health issues with the EKS node monitoring agent](https://docs.aws.amazon.com/eks/latest/userguide/node-health-nma.html)
- [Automatically repair nodes in EKS clusters](https://docs.aws.amazon.com/eks/latest/userguide/node-repair.html)
- [aws/eks-node-monitoring-agent](https://github.com/aws/eks-node-monitoring-agent)
