---
title: Overview & Architecture
description: Covers EKS Hybrid Nodes concepts, how it works, key technical characteristics, and a guide to the six design decisions — connectivity, topology, Pod CIDR exposure, CNI, authentication, and workload exposure.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - architecture
  - scope:nav
sidebar_label: Overview & Architecture
sidebar_position: 1
category: hybrid
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers what EKS Hybrid Nodes is and how it works, along with the criteria and ordering for the six design decisions that make up a hybrid architecture — connectivity, cluster topology, Pod CIDR exposure, CNI and routing, node authentication, and workload exposure.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/overview-architecture/hybrid-nodes-fundamentals"
    icon="📖"
    title="Concepts and How It Works"
    description="Definition, use cases, pricing model, nodeadm registration flow, RemoteNodeNetwork/RemotePodNetwork, traffic flow and CNI behavior, key technical characteristics"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/overview-architecture/architecture-decision-guide"
    icon="🧭"
    title="Architecture Decision Guide"
    description="Connectivity (DX/VPN), topology (mixed mode), Pod CIDR exposure, CNI, node authentication, workload exposure — decision criteria and dependencies for the six design decisions"
    color="#4a90d9"
  />
</DocCardGrid>
