---
title: "Control Plane 与扩展"
sidebar_label: "Control Plane 与扩展"
description: "EKS Control Plane 工作原理、CRD 扩展策略、多集群高可用架构"
tags: [eks, control-plane, crd, scaling, multi-cluster, ha]
sidebar_position: 2
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Control Plane 与扩展

深入理解 EKS Control Plane 的内部工作原理，探讨基于 CRD 的平台稳定扩展和多集群高可用策略。

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/eks-control-plane-crd-scaling"
    icon="🎛️"
    title="EKS Control Plane & CRD at Scale"
    description="Control Plane 工作原理、VAS 自动扩展、Provisioned Control Plane、CRD 影响分析、监控策略"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/cross-cluster-object-replication"
    icon="🔄"
    title="Cross-Cluster Object Replication (HA)"
    description="多集群环境中通过 K8s 对象复制实现高可用架构模式比较与决策指南"
    color="#34a853"
  />
</DocCardGrid>
