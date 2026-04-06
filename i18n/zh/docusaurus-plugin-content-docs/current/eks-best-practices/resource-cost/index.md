---
title: "资源与成本优化"
sidebar_label: "资源与成本"
description: "Karpenter 自动扩缩容、Pod 资源优化、EKS 成本管理策略"
tags: [eks, karpenter, cost-management, resource-optimization, finops]
sidebar_position: 4
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 资源与成本优化

涵盖 EKS 集群资源效率化和成本节约的实战策略。包括基于 Karpenter 的智能节点供应、Pod 资源 Rightsizing、基于 FinOps 的成本管理。

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/resource-cost/karpenter-autoscaling"
    icon="⚡"
    title="Karpenter 自动扩缩容"
    description="基于 Karpenter 的智能节点供应、Spot 实例使用、成本优化策略"
    color="#ff6b35"
  />
  <DocCard
    to="/docs/eks-best-practices/resource-cost/eks-resource-optimization"
    icon="📊"
    title="EKS 资源优化"
    description="Pod 资源 Rightsizing、Request/Limit 调优、VPA/HPA 使用策略"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/resource-cost/cost-management"
    icon="💰"
    title="大规模 EKS 成本管理"
    description="基于 FinOps 的成本结构分析、Kubecost 使用、30-90% 成本节约策略"
    color="#34a853"
  />
</DocCardGrid>
