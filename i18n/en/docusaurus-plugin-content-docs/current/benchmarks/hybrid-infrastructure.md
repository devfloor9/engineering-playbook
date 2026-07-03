---
title: Hybrid Infrastructure Benchmark
description: Hybrid cloud infrastructure network and storage performance benchmark
created: "2026-02-11"
last_update:
  date: "2026-06-30"
  author: devfloor9
reading_time: 2
tags:
  - benchmark
  - hybrid
  - network
  - storage
  - sriov
sidebar_label: Report 7. Hybrid Infrastructure [Upcoming]
sidebar_position: 7
category: benchmarks
---

Measure the performance of hybrid infrastructure between cloud and on-premises.

## Network Performance

### EKS Hybrid Nodes Network

:::note Testing Planned
This benchmark is currently being prepared.
:::

**Metrics**

- Cloud-to-on-premises latency
- VPN/Direct Connect bandwidth
- Pod-to-Pod communication performance (cross-region)

### SR-IOV Network Acceleration

**Metrics**

- SR-IOV vs virtual NIC throughput
- RDMA performance (GPU Direct)
- Network latency reduction rate

## Storage Performance

### Hybrid File Storage

**Metrics**

- Sequential/Random read/write IOPS
- Large file transfer speed
- Shared filesystem concurrent access performance

## Container Registry

### Harbor Registry Performance

**Metrics**

- Image pull speed (local vs remote)
- Replication latency
- Concurrent pull request throughput
