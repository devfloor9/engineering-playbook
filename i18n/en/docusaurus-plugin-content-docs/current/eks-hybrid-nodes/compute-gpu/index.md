---
title: Compute & GPU
description: Covers GPU workload architecture for EKS Hybrid Nodes and DGX H200 SR-IOV and InfiniBand high-performance networking configuration.
created: "2026-08-25"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - gpu
  - scope:nav
sidebar_label: Compute & GPU
sidebar_position: 5
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers the compute layer that utilizes existing GPU assets as hybrid nodes. It guides the 3-tier architecture combining on-premises GPU, cloud GPU, and Bedrock, and high-performance networking configuration for DGX H200-class equipment.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/compute-gpu/gpu-sriov-networking"
    icon="⚡"
    title="GPU Workloads & SR-IOV Networking"
    description="3-Tier Cascade (on-premises GPU, cloud GPU, Bedrock) architecture, DGX H200 SR-IOV VF configuration, MLNX_OFED and systemd orchestration"
    color="#f4a261"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/compute-gpu/gpu-scheduling-failover"
    icon="🎛️"
    title="GPU Scheduling & Cloud Fallback"
    description="GPU taint isolation at node registration time, hybrid-only NVIDIA Device Plugin nodeSelector, Karpenter-based cloud GPU fallback NodePool"
    color="#e76f51"
  />
</DocCardGrid>
