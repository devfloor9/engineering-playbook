---
title: Infrastructure Performance Benchmark
sidebar_label: "1. Infrastructure Performance"
sidebar_position: 1
description: EKS cluster infrastructure performance benchmark - network, DNS, autoscaling
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-13
  author: devfloor9
category: "benchmarks"
---

# Infrastructure Performance Benchmark

> 📅 **Written**: 2026-02-13 | **Last Modified**: 2026-02-13 | ⏱️ **Reading Time**: ~1 min


We measure and analyze key performance metrics of EKS cluster infrastructure.

## Network Performance

### Cilium ENI vs VPC CNI Comparison

A detailed quantitative comparison of VPC CNI and Cilium CNI across multiple modes (kube-proxy, kube-proxy-less, ENI, with tuning applied) is covered in a separate dedicated document.

For detailed benchmark results, refer to [CNI Performance Comparison Benchmark](./cni-performance-comparison.md).

**Comparison Scenarios (5):**

- A: VPC CNI baseline (kube-proxy + iptables)
- B: Cilium + kube-proxy (Overlay)
- C: Cilium kube-proxy-less (eBPF replacement)
- D: Cilium ENI mode (Native Routing)
- E: Cilium ENI + full tuning (DSR, XDP, Socket LB, etc.)

### Gateway API Performance

**Metrics**

- Request processing latency (P50, P95, P99)
- Requests per second (RPS) throughput
- TLS handshake overhead

## DNS Performance

### CoreDNS Before/After Optimization

**Metrics**

- DNS resolution latency
- Cache hit rate
- Queries per second throughput
- NodeLocal DNSCache effect

## Autoscaling Response Time

### Karpenter vs Cluster Autoscaler

**Metrics**

- Scale-out response time
- Node provisioning time
- Pod scheduling delay

## Cost Efficiency

### Cost vs Performance by Instance Type

**Metrics**

- Throughput per vCPU
- Cost per memory
- Spot vs On-Demand stability comparison
