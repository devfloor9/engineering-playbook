---
title: "East-West Traffic Optimization: Balancing Performance and Cost"
sidebar_label: "East-West Traffic Optimization"
description: "In-depth optimization strategies for minimizing latency in service-to-service communication on EKS and reducing cross-AZ costs. From Topology Hints to Cilium ClusterMesh and Istio Ambient"
tags: [eks, networking, performance, cost-optimization, service-mesh]
category: "performance-networking"
date: 2025-05-22
authors: [devfloor9]
sidebar_position: 4
---

# EKS East-West Traffic Optimization Guide

When East-West (service-to-service) hops increase from 1 to 2, p99 latency increases by milliseconds, and crossing availability zones incurs AWS bandwidth charges ($0.01/GB). This article explores layer-by-layer options from Kubernetes-native features (Topology Hints, InternalTrafficPolicy) through Cilium ClusterMesh, AWS VPC Lattice, and Istio Ambient—comparing p99/p999 latency, CPU/memory overhead, and costs assuming 10 TB/month of same-AZ traffic.

---

## 2. Kubernetes Fundamentals Deep Dive

:::tip NodeLocal DNSCache Effect
Enabling NodeLocal DNSCache reduces cross-AZ DNS charges and latency.
:::

With NodeLocal DNSCache enabled, DNS queries are processed locally on nodes, reducing p99 lookup latency from several ms to sub-ms and alleviating CoreDNS QPS load.

---

## 3. AWS Internal Load Balancer Options Comparison

Using **IP targets** keeps LB→Pod traffic local to AZ, eliminating unnecessary cross-AZ charges.

---

## 4. Service Mesh vs Sidecar-less: Performance Data

Istio 1.24 official benchmark: sidecar Envoy, 2-worker, 1 KB HTTP, 1 kRPS baseline

---

## 5. Multi-Cluster Connectivity Options

---

## 6. 10 TB/Month East-West Traffic Cost Simulation

Assumption: Same region 3-AZ EKS cluster, total 10 TB (= 10,240 GB) service-to-service traffic.

Calculation:

- NLB / ALB processing charges approximated as 14.22 GB/h → NLCU or LCU * rate ($0.006 / $0.008)
- Cross-AZ unit price: $0.01 / GB (same region)

**Insights:**

- With InternalTrafficPolicy Local ensuring node-local, achieve **zero cost with lowest latency**. However, Pod Affinity configuration and proximity placement are required.
- With 20+ services and multi-account, Lattice provides operational convenience (with additional cost).
- ALB is best deployed as "spot" investment for specific paths needing L7 features/WAF, while maintaining ClusterIP path for remaining workloads—this **hybrid approach** is most economical for most workloads.

---

## 7. p99/p999 Performance Summary

p99/p999 extracted from experimental values + AWS public SLA (ELB ≤ 2 ms).

---

## 8. Architecture Selection Guide

1. **"Low Cost + Ultra-Low Latency"**: ClusterIP + Topology Hints (+ InternalTrafficPolicy Local if needed) + NodeLocal DNSCache.
2. **"L4 Stability and Fixed IP Required"**: NLB IP mode, but verify costs if traffic > 5 TB/month.
3. **"L7 Routing, WAF, gRPC Method-Level Control"**: Internal ALB + K8s Gateway API. Deploy only on required paths to prevent LCU increase.
4. **"Enterprise Zero-Trust, Multi-Cluster"**: Istio Ambient → transition sidecar to required workloads only.
5. **"Multi-Account, Services > 50"**: Managed Lattice + IAM policies to reduce network management complexity.

---

## 9. Conclusion

- In EKS, **network locality is the optimal path** for both performance and cost. Topology Aware Routing and IP-target LBs alone can reduce cross-AZ and DTO costs nearly to zero.
- To gain service mesh benefits (mTLS, traffic policy) while reducing overhead, evaluate the progression: **sidecar → node-proxy (Ambient) → sidecar-less (eBPF)**.
- Example: At 10 TB/month scale, ClusterIP-Local configuration saves **approximately $98 vs ALB and $400+ vs VPC Lattice**.

---

## References

1. AWS Elastic Load Balancing LCU/NLCU pricing examples
2. AWS Cross-AZ transmission $0.01/GB billing FAQ
3. AWS ELB latency p99 ≤ 2 ms guidance
4. AWS Network Load Balancer ultralow latency explanation
5. AWS NLB cross-AZ cost analysis blog
6. AWS VPC Lattice pricing documentation
7. Istio 1.24 Sidecar benchmark table (p99, CPU, Memory)
8. Istio official sidecar resource guide
9. NodeLocal DNSCache official documentation
