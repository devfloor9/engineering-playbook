---
title: 混合基础设施基准测试
sidebar_label: "4. 混合基础设施"
sidebar_position: 5
description: 混合云基础设施网络和存储性能基准测试
category: "benchmarks"
tags: [benchmark, hybrid, network, storage, sriov]
last_update:
  date: 2026-02-09
  author: devfloor9
---

# 混合基础设施基准测试

测量云和本地之间混合基础设施的性能。

## 网络性能

### EKS Hybrid Nodes 网络

:::note 计划测试
此基准测试当前正在准备中。
:::

**测量项目**

- 云-本地间延迟时间
- VPN/Direct Connect 带宽
- Pod 间通信性能（跨区域）

### SR-IOV 网络加速

**测量项目**

- SR-IOV vs 虚拟 NIC 吞吐量
- RDMA 性能（GPU Direct）
- 网络延迟时间减少率

## 存储性能

### 混合文件存储

**测量项目**

- 顺序/随机读写 IOPS
- 大文件传输速度
- 共享文件系统并发访问性能

## 容器注册表

### Harbor 注册表性能

**测量项目**

- 镜像拉取速度（本地 vs 远程）
- 复制延迟时间
- 并发拉取请求吞吐量
