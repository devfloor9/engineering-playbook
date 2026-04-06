---
title: Infrastructure Performance Benchmark
sidebar_label: "Report 6. Infrastructure Performance [Upcoming]"
sidebar_position: 6
description: EKS cluster infrastructure performance benchmark - Network, DNS, Autoscaling
category: "benchmarks"
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-13
  author: devfloor9
---

# Infrastructure Performance Benchmark

Measure and analyze key performance indicators of EKS cluster infrastructure.

## Network Performance

### Cilium ENI vs VPC CNI Comparison

A quantitative comparison of VPC CNI and Cilium CNI across multiple modes (kube-proxy, kube-proxy-less, ENI, tuning applied) is covered in detail in a separate document.

See [2. CNI Performance Comparison](./cni-performance-comparison.md) for detailed benchmark results.

**Comparison Scenarios (5):**

- A: VPC CNI Default (kube-proxy + iptables)
- B: Cilium + kube-proxy (Overlay)
- C: Cilium kube-proxy-less (eBPF replacement)
- D: Cilium ENI Mode (Native Routing)
- E: Cilium ENI + Full Tuning (DSR, XDP, Socket LB, etc.)

### Gateway API Performance

**Metrics**

- Request processing latency (P50, P95, P99)
- Requests per second (RPS)
- TLS handshake overhead

## DNS Performance

### CoreDNS Optimization Before/After Comparison

**Metrics**

- DNS resolution latency
- Cache hit rate
- Queries per second throughput
- NodeLocal DNSCache effect

## Autoscaling Response Speed

### Karpenter vs Cluster Autoscaler

**Metrics**

- Scale-out response time
- Node provisioning time
- Pod scheduling delay

## Cost Efficiency

### Cost-to-Performance Ratio by Instance Type

**Metrics**

- Throughput per vCPU
- Cost per memory
- Spot vs On-Demand stability comparison
