---
title: 混合基础设施基准测试
sidebar_label: "报告 7. 混合基础设施 [即将推出]"
sidebar_position: 7
description: 混合云基础设施网络和存储性能基准测试
category: "benchmarks"
tags: [benchmark, hybrid, network, storage, sriov]
last_update:
  date: 2026-02-14
  author: devfloor9
---

# 混合基础设施基准测试

测量云端与本地之间混合基础设施的性能。

## 网络性能

### EKS 混合节点网络

:::note 测试计划中
该基准测试目前正在准备中。
:::

**指标**

- 云端到本地延迟
- VPN/Direct Connect 带宽
- Pod 到 Pod 通信性能（跨区域）

### SR-IOV 网络加速

**指标**

- SR-IOV 与虚拟网卡吞吐量对比
- RDMA 性能（GPU Direct）
- 网络延迟降低率

## 存储性能

### 混合文件存储

**指标**

- 顺序/随机读写 IOPS
- 大文件传输速度
- 共享文件系统并发访问性能

## 容器镜像仓库

### Harbor Registry 性能

**指标**

- 镜像拉取速度（本地 vs 远程）
- 复制延迟
- 并发拉取请求吞吐量
