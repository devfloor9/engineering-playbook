---
title: Hybrid Infrastructure Benchmark
description: Hybrid cloud infrastructure network and storage performance benchmark
created: "2026-02-11"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 4
tags:
  - benchmark
  - hybrid
  - network
  - storage
  - sriov
  - scope:tech
sidebar_label: Report 7. Hybrid Infrastructure [Upcoming]
sidebar_position: 7
category: benchmarks
---

This test plan compares network, file-storage, and image-distribution paths between cloud and on-premises sites. It contains no execution results or performance rankings. Record hardware and software versions, traffic paths, load, repetitions, and raw results for each test.

## Network Performance

### EKS Hybrid Nodes Network

:::note Testing Planned
This benchmark is currently being prepared.
:::

**Metrics**

- Latency and packet loss between cloud and on-premises sites
- Observed throughput and available circuit capacity over the VPN or Direct Connect path
- Communication between AWS-hosted and on-premises Pods, with node and Pod addresses, routing, and CNI conditions fixed

This is a **cross-site** comparison. A test between two AWS Regions needs a separate configuration and result set.

### SR-IOV Network Acceleration

**Metrics**

- Throughput on the same physical NIC using an assigned SR-IOV VF versus a specified virtual-switch and virtual-NIC path
- RDMA and GPUDirect RDMA operation and performance in a separate environment with supported GPUs, NICs, drivers, and fabric
- Absolute latency and its difference under the same load

SR-IOV itself exposes virtual functions, so “virtual NIC” alone does not identify the baseline. Establish the required hardware and transport path before an RDMA test; connecting VPN or Direct Connect does not establish RDMA capability. Calculate improvement percentages only when a defined baseline and measurements exist.

## Storage Performance

### Hybrid File Storage

**Metrics**

- Sequential and random read/write IOPS and throughput with fixed block size, queue depth, and cache conditions
- Large-file transfer speed by file size and path
- Shared-filesystem performance by client count and access pattern

## Container Registry

### Harbor Registry Performance

**Metrics**

- Pull time for the same image digest within and across sites, separating empty caches from cached layers
- Replication delay from completed push until the same digest can be resolved and pulled at the destination registry
- Throughput and failure rate by concurrent pull count
