---
title: "Cilium ENI Mode + Gateway API Deep-dive Configuration"
sidebar_label: "Cilium ENI + Gateway API"
description: "Cilium ENI mode architecture, Gateway API resource configuration, performance optimization, Hubble observability, BGP Control Plane v2 deep-dive guide"
tags: [eks, cilium, eni, gateway-api, ebpf, networking, bgp]
category: "performance-networking"
last_update:
  date: 2026-02-14
  author: devfloor9
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { EksRequirementsTable, InstanceTypeTable, LatencyComparisonTable, AlgorithmComparisonTable } from '@site/src/components/GatewayApiTables';

:::info
This document is a deep-dive guide for the [Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide). It provides a practical guide for combining Cilium ENI mode with Gateway API for high-performance networking.
:::

Cilium ENI mode is a high-performance networking solution that directly utilizes AWS Elastic Network Interfaces to assign VPC IP addresses to pods. Combined with Gateway API, it achieves both standardized L7 routing and eBPF-based ultra-low latency processing.

## 1. What is Cilium ENI Mode?

Cilium ENI mode directly uses AWS ENI to assign VPC IP addresses to pods. Key features:

- **AWS ENI Direct Use**: Each pod receives a real VPC IP, fully integrating with AWS networking (Security Groups, NACLs, VPC Flow Logs)
- **eBPF-based High-Performance Networking**: 10x+ performance improvement over iptables with minimal CPU overhead
- **Native Routing**: No overlay encapsulation (VXLAN/Geneve), using VPC routing tables directly

## 2. Architecture Overview

NLB (L4) → eBPF TPROXY (transparent proxy) → Cilium Envoy (L7 Gateway) → Backend Pods (ENI IPs)

### Key Components

1. **NLB**: Managed L4 load balancer, microsecond latency
2. **eBPF TPROXY**: XDP-level packet interception, lock-free per-CPU processing
3. **Cilium Envoy**: L7 processing, HTTPRoute/TLSRoute implementation
4. **Cilium Operator**: ENI lifecycle management, IP pool management
5. **Cilium Agent** (DaemonSet): eBPF program management, CNI plugin
6. **Hubble**: Real-time network flow observability, L7 protocol visibility

## 3. Prerequisites

<EksRequirementsTable />

## 4. Installation Flow

For new clusters: disable VPC CNI → install Gateway API CRDs → install Cilium via Helm → create Gateway resources.

For existing clusters: **downtime required** (5-10 min) for VPC CNI removal and Cilium installation.

## 5. Gateway API Resource Configuration

Standard HTTPRoute, traffic splitting (canary), header-based routing, URL rewrite, and role separation patterns are all supported identically to other Gateway API implementations.

## 6. Performance Optimization

- **NLB + Cilium Envoy**: ~3.5ms total vs ~15ms with ALB+NGINX
- **Prefix Delegation**: 16x fewer ENI attach operations
- **BPF tuning**: Pre-allocated maps, Maglev load balancing
- **XDP acceleration**: 10x packet filtering, 80% CPU reduction for DDoS

<LatencyComparisonTable />
<AlgorithmComparisonTable />
<InstanceTypeTable />

## 7. Operations & Observability

Hubble provides real-time flow observation, service maps, L7 protocol visibility (HTTP, gRPC, Kafka, DNS), and Prometheus metric export.

## 8. BGP Control Plane v2

For hybrid environments needing on-premises to EKS traffic routing via BGP. Not required when using NLB in pure AWS environments.

## 9. Hybrid Nodes Architecture and AI/ML Workloads

For EKS Hybrid Nodes combining cloud and on-premises GPU nodes, Cilium serves as a unified CNI. Recommended architecture: **Cilium CNI + Cilium Gateway API + llm-d** for minimized component count with optimal performance.

---

## Related Documents

- **[Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide)**
- **[llm-d + EKS Deployment Guide](/docs/agentic-ai-platform/model-serving/llm-d-eks-automode)**
- [Cilium Official Documentation](https://docs.cilium.io/)
- [Gateway API Inference Extension](https://gateway-api.sigs.k8s.io/geps/gep-3567/)
