---
title: "运维与稳定性"
sidebar_label: "运维与稳定性"
description: "EKS 集群稳定运维的 GitOps、故障诊断、高可用性、Pod 生命周期管理最佳实践"
tags: [eks, operations, reliability, gitops, debugging, ha, pod-lifecycle]
sidebar_position: 5
last_update:
  date: 2026-03-25
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 运维与稳定性

EKS 集群稳定运维的实战指南。涵盖基于 GitOps 的运维自动化、故障诊断、高可用架构及 Pod 生命周期管理。

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/gitops-cluster-operation"
    icon="🔄"
    title="基于 GitOps 的 EKS 集群运维"
    description="GitOps 架构、KRO/ACK 使用、多集群管理策略及自动化"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/node-monitoring-agent"
    icon="📡"
    title="EKS Node Monitoring Agent"
    description="节点状态自动检测、架构、部署策略、最佳实践"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-debugging"
    icon="🔍"
    title="EKS 故障诊断与响应"
    description="应用程序及基础设施问题的系统化诊断与故障排除"
    color="#e63946"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-resiliency-guide"
    icon="🛡️"
    title="EKS 高可用架构"
    description="为确保高可用性和故障恢复能力的架构模式与运维策略"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-pod-health-lifecycle"
    icon="💓"
    title="Pod 健康检查与生命周期"
    description="Probe 配置策略、Graceful Shutdown、Pod 生命周期管理"
    color="#ff6b35"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-pod-scheduling-availability"
    icon="📋"
    title="Pod 调度与可用性模式"
    description="Affinity/Anti-Affinity、PDB、Priority/Preemption、Taints/Tolerations"
    color="#9b59b6"
  />
</DocCardGrid>
