---
title: "运维与可观测性"
sidebar_label: "运维与可观测性"
description: "Amazon EKS 环境中可观测性和监控相关的深度技术文档"
category: "operations"
sidebar_position: 2
last_update:
  date: 2025-02-05
  author: devfloor9
---

# 运维与可观测性

> 📅 **作成日期**: 2025-02-05 | ⏱️ **阅读时间**: 约 3 分钟

在现代云原生环境中，运维和可观测性不仅仅是简单的监控，而是全面理解系统健康状况并主动响应的核心能力。在 Amazon EKS 等容器编排平台中，数百个微服务动态地创建和销毁，复杂的网络通信不断进行，传统的监控方式难以掌握系统状态。为了在这种环境中构建有效的可观测性，需要综合利用日志、指标、追踪这三大支柱，并应用基于 GitOps 的声明式运维方式来系统地管理变更。

特别是在 Kubernetes 集群中，网络可见性至关重要。必须能够实时追踪 Pod 之间的通信流，确认网络策略是否正确应用，并及早发现意外的流量模式。使用 Hubble 等工具可以观察基于 Cilium 的网络层中的所有通信，确保服务网格级别的可见性。通过这种方式，可以检测安全威胁，识别网络瓶颈，并满足合规要求。

为了实现运维的自动化和一致性，GitOps 方式的方法是必不可少的。通过将所有集群配置作为代码管理在 Git 仓库中，并使用 Flux CD 或 ArgoCD 等 GitOps 工具自动同步声明式状态，可以防止手动操作导致的错误并完整追踪变更历史。这种方式保证了可重现性和审计追踪，最大化了将基础设施作为代码管理的 Infrastructure as Code 的优势。节点级别的监控也很重要。需要持续收集每个工作节点的 CPU、内存、磁盘、网络使用情况，评估节点的健康状况，以便在问题发生之前主动响应。

为了构建有效的可观测性，必须明确定义 SLI（Service Level Indicators）和 SLO（Service Level Objectives），并基于此专注于有意义的指标。试图监控所有内容反而会增加噪音，可能错过重要信号。通过 Prometheus 收集时间序列指标，使用 Grafana 进行可视化，并通过 Jaeger 实现分布式追踪，可以理解系统的整体行为并优化性能。本节介绍如何将这些工具应用到实际环境中以及最佳实践。

## 文档列表（实施顺序）

### 第 1 步：构建集群运维体系

**[1. 基于 GitOps 的 EKS 集群运维](./gitops-cluster-operation.md)**
基于 GitOps 的集群配置管理和声明式基础设施运维 - 首先构建运维基础体系

### 第 2 步：部署监控代理

**[2. EKS 节点监控代理](./node-monitoring-agent.md)**
节点状态监控和系统指标收集，通过 Hubble 确保网络流量可见性

### 第 3 步：EKS 故障诊断和响应

**[3. EKS 故障诊断和响应指南](./eks-debugging-guide.md)**
EKS 环境中控制平面、节点、工作负载、网络、存储全层的系统性故障诊断和解决指南

### 第 4 步：EKS 高可用性架构

**[4. EKS 高可用性架构指南](./eks-resiliency-guide.md)**
Multi-AZ 策略、Cell-Based Architecture、Chaos Engineering 等确保高可用性和故障恢复能力的架构模式

### 第 5 步：Pod 健康检查和生命周期管理

**[5. EKS Pod 健康检查和生命周期管理](./eks-pod-health-lifecycle.md)**
Kubernetes Probe 设置策略（Startup/Liveness/Readiness）、Graceful Shutdown 模式、Pod 生命周期钩子、Init Container、容器镜像优化

### 第 6 步：Pod 调度和可用性模式

**[6. EKS Pod 调度和可用性模式](./eks-pod-scheduling-availability.md)**
Node/Pod Affinity·Anti-Affinity、Taints·Tolerations、PodDisruptionBudget 高级模式、Priority·Preemption、使用 Descheduler 的工作负载放置策略