---
title: Operations & Cost
description: Covers EKS Hybrid Nodes Mixed Mode operational patterns, Cluster Insights configuration validation, monitoring, and cost optimization based on vCPU-hour billing.
created: "2026-08-25"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - operations
  - scope:nav
sidebar_label: Operations & Cost
sidebar_position: 6
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers day-to-day operations of hybrid clusters. It guides Mixed Mode workload placement, configuration validation automation, the observability stack, upgrades and lifecycle management, and cost optimization leveraging the tiered vCPU-hour billing structure.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/operations-cost/operations-cost-optimization"
    icon="📊"
    title="Operations and Cost Optimization"
    description="Mixed Mode placement strategy, Cluster Insights and nodeadm debug validation, monitoring stack, cost reduction through workload placement and node lifetime management"
    color="#9b59b6"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/operations-cost/upgrade-lifecycle"
    icon="🔄"
    title="Upgrades & Lifecycle Management"
    description="The nodeadm upgrade 4-phase process, mandatory manual cordon/drain, handling SSM signing key expiration (1.0.19+), air-gapped private mirror configuration, upgrade runbook"
    color="#2a9d8f"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/operations-cost/observability-monitoring"
    icon="🔭"
    title="Observability Integration"
    description="EKS configuration insights self-diagnosis, CloudWatch Container Insights and GPU metric integration, Cilium Hubble-based eBPF dashboard, Network Flow Monitor applicability analysis"
    color="#264653"
  />
</DocCardGrid>
