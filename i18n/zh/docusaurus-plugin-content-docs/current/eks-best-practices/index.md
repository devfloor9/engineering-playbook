---
title: "EKS Best Practices"
sidebar_label: "EKS 最佳实践"
description: "Amazon EKS 生产运维的网络、Control Plane、安全、成本优化综合指南"
tags: [eks, kubernetes, best-practices, networking, control-plane, security, cost]
category: "infrastructure"
sidebar_position: 1
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# EKS Best Practices

本文档涵盖 Amazon EKS 在生产环境运维中面临的深入主题。提供网络性能优化、Control Plane 扩展、安全、成本管理、运维稳定性等 5 个领域的最佳实践。

---

## 文档结构

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/networking-performance"
    icon="🌐"
    title="网络与性能优化"
    description="Gateway API 引入、CoreDNS 调优、East-West 流量优化等 EKS 网络性能最大化策略"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling"
    icon="🎛️"
    title="Control Plane 与扩展"
    description="EKS Control Plane 工作原理、CRD at Scale、Provisioned Control Plane、多集群高可用性"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/security-authn"
    icon="🔐"
    title="安全与认证"
    description="EKS API Server 认证/授权、Access Entry、Pod Identity、OIDC 集成指南"
    color="#e63946"
  />
  <DocCard
    to="/docs/eks-best-practices/resource-cost"
    icon="💰"
    title="资源与成本优化"
    description="Karpenter 自动扩缩容、Pod 资源 Rightsizing、基于 FinOps 的成本节约策略"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability"
    icon="🛡️"
    title="运维与稳定性"
    description="基于 GitOps 的运维、故障诊断、高可用架构、Pod 健康检查与调度模式"
    color="#9b59b6"
  />
</DocCardGrid>
