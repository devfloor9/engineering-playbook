---
title: Hybrid Infrastructure Benchmark
sidebar_label: "5. Hybrid Infrastructure"
sidebar_position: 5
description: Hybrid cloud infrastructure network and storage performance benchmark
tags: [benchmark, hybrid, network, storage, sriov]
last_update:
  date: 2026-02-14
  author: devfloor9
category: "benchmarks"
---

# Hybrid Infrastructure Benchmark

> 📅 **Written**: 2026-02-14 | **Last Modified**: 2026-02-14 | ⏱️ **Reading Time**: ~1 min


We measure the performance of hybrid infrastructure between cloud and on-premises.

## Network Performance

### EKS Hybrid Nodes Network

:::note Scheduled for Testing
This benchmark is currently in preparation.
:::

**Metrics**

- Cloud-to-on-premises latency
- VPN/Direct Connect bandwidth
- Pod-to-pod communication performance (cross-region)

### SR-IOV Network Acceleration

**Metrics**

- SR-IOV vs virtual NIC throughput
- RDMA performance (GPU Direct)
- Network latency reduction rate

## Storage Performance

### Hybrid File Storage

**Metrics**

- Sequential/random read/write IOPS
- Large file transfer speed
- Shared filesystem concurrent access performance

## Container Registry

### Harbor Registry Performance

**Metrics**

- Image pull speed (local vs remote)
- Replication latency
- Concurrent pull request throughput
