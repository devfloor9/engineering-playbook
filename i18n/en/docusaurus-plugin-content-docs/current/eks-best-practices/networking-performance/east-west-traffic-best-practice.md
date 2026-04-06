---
title: "East-West Traffic Optimization: Balancing Performance and Cost"
sidebar_label: "East-West Traffic Optimization"
description: "Deep optimization strategies for minimizing inter-service communication latency and reducing cross-AZ costs in EKS. Covers Topology Aware Routing, InternalTrafficPolicy, Cilium ClusterMesh, AWS VPC Lattice, and Istio multi-cluster"
tags: [eks, networking, performance, cost-optimization, service-mesh, topology-aware-routing]
category: "performance-networking"
last_update:
  date: 2026-02-14
  author: devfloor9
---

import { ServiceTypeComparison, LatencyCostComparison, CostSimulation, ScenarioMatrix } from '@site/src/components/EastWestTrafficTables';

# EKS East-West Traffic Optimization Guide

> **Written**: 2026-02-09 | **Updated**: 2026-02-14 | **Reading time**: ~21 min

## Overview

This guide covers optimizing inter-service communication (East-West traffic) in Amazon EKS from **latency minimization** and **cost efficiency** perspectives. It progressively addresses scenarios from single cluster to multi-AZ, multi-cluster, and multi-account environments.

When East-West hops increase from 1 to 2, p99 latency grows by milliseconds. Cross-AZ traffic incurs AWS bandwidth charges ($0.01/GB). This guide analyzes layer-by-layer options from **Kubernetes-native features (Topology Aware Routing, InternalTrafficPolicy)** to **Cilium ClusterMesh, AWS VPC Lattice, and Istio service mesh**, with quantitative latency, overhead, and cost comparisons.

### Key Benefits

| Item | Improvement |
|------|-----------|
| Network Latency | Same-AZ routing via Topology Aware Routing, sub-ms p99 |
| Cost Savings | ~$100/month at 10TB/month by eliminating cross-AZ traffic |
| Operational Simplicity | ClusterIP-based inter-service optimization without LBs |
| DNS Performance | NodeLocal DNSCache: ms → sub-ms DNS lookup |
| Scalability | Consistent extension path to multi-cluster/account |

<ServiceTypeComparison />

## Implementation

1. **Topology Aware Routing** — `service.kubernetes.io/topology-mode: Auto`
2. **InternalTrafficPolicy Local** — Same-node-only traffic
3. **Pod Topology Spread Constraints** — AZ-balanced distribution
4. **NodeLocal DNSCache** — Local DNS caching per node
5. **Internal LB IP Mode** — Direct Pod IP targeting
6. **Istio Service Mesh** (optional) — mTLS, locality-aware routing

### Multi-Cluster Connection Strategies

- **Cilium ClusterMesh**: Lowest latency, Pod-to-Pod direct, eBPF-based
- **AWS VPC Lattice**: Managed proxy, IAM auth, multi-account
- **Istio Multi-cluster**: Full mesh features across clusters, mTLS
- **Route53 + ExternalDNS**: Simplest, DNS-based

<LatencyCostComparison />
<CostSimulation />
<ScenarioMatrix />

## References

1. [AWS ELB Pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)
2. [AWS Data Transfer Pricing](https://aws.amazon.com/ec2/pricing/on-demand/#Data_Transfer)
3. [Kubernetes Topology Aware Routing](https://kubernetes.io/docs/concepts/services-networking/topology-aware-routing/)
4. [Cilium ClusterMesh](https://docs.cilium.io/en/stable/network/clustermesh/)
5. [AWS VPC Lattice Pricing](https://aws.amazon.com/vpc/lattice/pricing/)
