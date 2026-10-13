---
title: Infrastructure Performance Benchmark
description: EKS cluster infrastructure performance benchmark - Network, DNS, Autoscaling
created: "2026-02-11"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 3
tags:
  - benchmark
  - infrastructure
  - performance
  - network
  - dns
  - scope:tech
sidebar_label: Report 6. Infrastructure Performance [Upcoming]
sidebar_position: 6
category: benchmarks
---

This is a measurement plan for EKS networking, DNS and autoscaling. The items below define test scope; this document does not present measured results.

## Network Performance

### Cilium ENI vs VPC CNI Comparison

A separate document examines historical summaries for five VPC CNI and Cilium configurations and explains their verification limits.

See [1. CNI Performance Comparison](./cni-performance-comparison.md) for metric definitions and requirements for a new experiment. Raw logs and effective configuration are missing, so a product performance ranking remains unverified.

**Configurations requested by the historical runner (5):**

- A: VPC CNI Default (kube-proxy + iptables)
- B: Cilium + kube-proxy (Overlay)
- C: Cilium kube-proxy-less (eBPF replacement)
- D: Cilium ENI Mode (Native Routing)
- E: Cilium ENI with additional options (DSR, native XDP, socket LB, etc.; effective activation unverified)

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
