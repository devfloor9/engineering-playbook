---
title: Overview & Architecture
description: Covers EKS Hybrid Nodes concepts, how it works, key technical characteristics, and the Routable Pod CIDR vs Hybrid Nodes Gateway architecture decision framework.
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

This section covers what EKS Hybrid Nodes is and how it works, along with the criteria for the core decision in hybrid design: whether to make the Pod address range routable.

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
    description="Routable Pod CIDR (BGP) vs CNI NAT vs Hybrid Nodes Gateway — decision criteria and a decision flow for the three options"
    color="#4a90d9"
  />
</DocCardGrid>
