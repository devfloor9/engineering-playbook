---
title: Networking & Performance Optimization
description: Best practices for DNS optimization, East-West traffic, and Gateway API adoption in EKS environments
created: "2026-03-24"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 3
tags:
  - eks
  - networking
  - performance
  - dns
  - gateway-api
  - scope:nav
sidebar_label: Networking & Performance
sidebar_position: 1
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Networking & Performance Optimization

A practical guide to maximizing network performance in EKS clusters. Covers DNS tuning, inter-service traffic optimization, and adoption strategies for Gateway API — the next-generation traffic routing standard.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/networking-performance/vpc-cni-deep-dive"
    icon="🔌"
    title="VPC CNI Deep Dive"
    description="L3 routed-mode datapath, ipamd warm pool, Prefix Delegation, IP cooldown, and eBPF NetworkPolicy architecture"
    color="#2a9d8f"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide"
    icon="🌐"
    title="Gateway API Adoption Guide"
    description="Community ingress-nginx project end-of-life (EOL) response, Gateway API architecture, GAMMA Initiative, Cilium ENI + Gateway API deep dive, and migration strategy"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/service-mesh"
    icon="🕸️"
    title="Service Mesh Comparison"
    description="Data plane architecture, feature matrix, performance overhead, and selection guide for Istio, Cilium, Linkerd, and VPC Lattice — plus GAMMA Initiative"
    color="#8e44ad"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/coredns-monitoring-optimization"
    icon="🔍"
    title="CoreDNS Monitoring & Performance Optimization"
    description="DNS query performance analysis, CoreDNS caching strategies, NodeLocal DNSCache usage, and monitoring architecture"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/east-west-traffic-best-practice"
    icon="↔️"
    title="East-West Traffic Optimization"
    description="Inter-service communication optimization, Topology Aware Routing, and multi-cluster traffic management"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/nitro-architecture-performance-tuning"
    icon="⚙️"
    title="Nitro Architecture & Tuning"
    description="Per-generation network changes across Nitro v2–v6, ENA driver and kernel requirements, and PPS/CPS performance tuning"
    color="#ff6b35"
  />
</DocCardGrid>
