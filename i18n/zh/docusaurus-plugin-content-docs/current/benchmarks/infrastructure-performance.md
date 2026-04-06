---
title: 基础设施性能基准测试
sidebar_label: "报告 6. 基础设施性能 [即将推出]"
sidebar_position: 6
description: EKS 集群基础设施性能基准测试 - 网络、DNS、自动扩缩
category: "benchmarks"
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-13
  author: devfloor9
---

# 基础设施性能基准测试

测量和分析 EKS 集群基础设施的关键性能指标。

## 网络性能

### Cilium ENI 与 VPC CNI 对比

VPC CNI 和 Cilium CNI 在多种模式下（kube-proxy、kube-proxy-less、ENI、调优后）的量化对比已在单独文档中详细说明。

详见 [2. CNI 性能对比](./cni-performance-comparison.md) 获取详细基准测试结果。

**对比场景（5 个）：**

- A：VPC CNI 默认配置（kube-proxy + iptables）
- B：Cilium + kube-proxy（Overlay）
- C：Cilium kube-proxy-less（eBPF 替代）
- D：Cilium ENI 模式（原生路由）
- E：Cilium ENI + 全面调优（DSR、XDP、Socket LB 等）

### Gateway API 性能

**指标**

- 请求处理延迟（P50、P95、P99）
- 每秒请求数（RPS）
- TLS 握手开销

## DNS 性能

### CoreDNS 优化前后对比

**指标**

- DNS 解析延迟
- 缓存命中率
- 每秒查询吞吐量
- NodeLocal DNSCache 效果

## 自动扩缩响应速度

### Karpenter vs Cluster Autoscaler

**指标**

- 扩展响应时间
- 节点配置时间
- Pod 调度延迟

## 成本效率

### 按实例类型的成本性能比

**指标**

- 每 vCPU 吞吐量
- 每内存成本
- Spot 与按需实例稳定性对比
