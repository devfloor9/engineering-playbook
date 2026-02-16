---
title: 基础设施性能基准测试
sidebar_label: "1. 基础设施性能"
sidebar_position: 1
description: EKS 集群基础设施性能基准测试 - 网络、DNS、自动扩展
category: "benchmarks"
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-09
  author: devfloor9
---

# 基础设施性能基准测试

测量和分析 EKS 集群基础设施的核心性能指标。

## 网络性能

### Cilium ENI vs VPC CNI 比较

VPC CNI 和 Cilium CNI 的多种模式（kube-proxy、kube-proxy-less、ENI、应用调优）的定量比较已作为独立文档详细说明。

详细基准测试结果请参见 [2. CNI 性能比较](./cni-performance-comparison.md)。

**比较场景（5个）：**

- A: VPC CNI 基本配置（kube-proxy + iptables）
- B: Cilium + kube-proxy（Overlay）
- C: Cilium kube-proxy-less（eBPF 替代）
- D: Cilium ENI 模式（Native Routing）
- E: Cilium ENI + 完整调优（DSR、XDP、Socket LB 等）

### Gateway API 性能

**测量项目**

- 请求处理延迟时间（P50、P95、P99）
- 每秒请求处理量（RPS）
- TLS 握手开销

## DNS 性能

### CoreDNS 优化前后比较

**测量项目**

- DNS 解析延迟时间
- 缓存命中率
- 每秒查询处理量
- NodeLocal DNSCache 效果

## 自动扩展响应速度

### Karpenter vs Cluster Autoscaler

**测量项目**

- 横向扩展响应时间
- 节点配置时间
- Pod 调度延迟

## 成本效率

### 实例类型的性价比

**测量项目**

- 每 vCPU 吞吐量
- 每内存成本
- Spot vs On-Demand 稳定性比较
