---
title: Control Plane & Scaling
description: EKS Control Plane internals, CRD scaling strategies, and multi-cluster high availability architecture
created: "2026-03-24"
last_update:
  date: "2026-06-26"
  author: devfloor9
reading_time: 2
tags:
  - eks
  - control-plane
  - crd
  - scaling
  - multi-cluster
  - ha
  - scope:nav
sidebar_label: Control Plane & Scaling
sidebar_position: 2
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Control Plane & Scaling

Understand EKS Control Plane internals and learn strategies for stable scaling of CRD-based platforms and multi-cluster high availability.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/eks-control-plane-crd-scaling"
    icon="🎛️"
    title="EKS Control Plane & CRD at Scale"
    description="Control Plane internals, VAS auto-scaling, Provisioned Control Plane, CRD impact analysis, and monitoring strategies"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/cross-cluster-object-replication"
    icon="🔄"
    title="Cross-Cluster Object Replication (HA)"
    description="Architecture pattern comparison and decision guide for achieving high availability through K8s object replication in multi-cluster environments"
    color="#34a853"
  />
</DocCardGrid>
