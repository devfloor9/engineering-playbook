---
title: "AWS Nitro Architecture and Performance Tuning"
sidebar_label: "Nitro Architecture & Tuning"
description: "AWS Nitro System components, per-generation (v2–v6) networking changes, ENA driver/kernel requirements on EKS nodes, and PPS/CPS-focused performance tuning strategies"
created: 2026-06-19
last_update:
  date: 2026-06-20
  author: devfloor9
reading_time: 14
tags:
  - eks
  - networking
  - performance
  - ena
  - nitro
  - scope:tech
keywords:
  - Nitro System
  - ENA Express
  - PPS
  - conntrack
---

# AWS Nitro Architecture and Performance Tuning

> **Written**: 2026-06-19 | **Updated**: 2026-06-20 | **Reading time**: ~14 min

## Overview

The AWS Nitro System is the underlying platform for current-generation Amazon EC2 instances and governs the networking, storage, and security behavior of EKS worker nodes. Nitro generations (v2–v6) differ in network bandwidth, ENA (Elastic Network Adapter) features, and TCP behavior, which in turn change the ENA driver/kernel requirements and tuning points for node AMIs. This document summarizes Nitro components, per-generation changes, and the driver/kernel requirements plus PPS/CPS-focused tuning relevant to EKS nodes.

## Background

Nitro offloads virtualization functions to dedicated hardware:

- **Nitro Cards**: handle all I/O (networking, local NVMe storage, management, monitoring, security) on a self-contained device physically separate from the host mainboard.
- **Nitro Security Chip**: integrated into the mainboard, providing a hardware root of trust.
- **Nitro Hypervisor**: a lightweight hypervisor managing only CPU/memory allocation, delivering near bare-metal performance.

Check an instance's Nitro version in the **`Hypervisor` column of the Platform summary table** on the instance family spec page. Features are **cumulative** — newer versions include all prior features unless stated otherwise.

## Per-Generation Networking Changes

| Generation | Key changes | Example instances |
|------------|-------------|-------------------|
| **v6** | Up to 400 Gbps per network card. Idle TCP established timeout reduced 432,000s → **350s**. Traffic Mirroring not supported | M8i·C8i·R8i, M8g, P6-B200, G7 |
| **v5** | Up to 200 Gbps per card. Traffic Mirroring not supported | M8g·C8g·R8g, Trn2, P5en, P6e-GB200 |
| **v4** | 100 Gbps for GPU/Trainium, up to 170 Gbps otherwise. **ENA Express** support, RDMA read/write (EFA) on select types. Traffic Mirroring supported | M7i·C7i·R7i, M7g, Inf2, Trn1, P5, G6 |
| **v3** | Up to 100 Gbps. **Encryption in transit**. Traffic Mirroring supported | C5n, R5n, P4d, G4dn, Inf1 |
| **v2** | **ENA-based enhanced networking** introduced. Traffic Mirroring supported | M5·C5·R5, M6g·C6g, T3·T4g |

:::warning Impact of v6's shortened TCP established timeout

Nitro v6 reduced the default idle TCP established timeout from 432,000s to **350s**. Workloads maintaining long-lived connections (connection pools, gRPC keepalive, idle DB connections) may experience unexpected disconnects. Set kernel keepalive (`net.ipv4.tcp_keepalive_time`, etc.) shorter than the timeout to keep connections alive.

:::

## Driver and Kernel Requirements

Nitro instances use ENA for enhanced networking and NVMe block devices for storage. Requirements tighten with each generation and affect both performance and ENI attachment success.

### ENA driver minimum versions

- ENA Linux driver **2.2.9+**: recommended on Nitro v4, **required on Nitro v5 and later**.
- Versions below 2.2.9 on v5 (or below 1.2.0 on pre-v5) cause **ENI attachment failures**.
- The **accelerated path feature works only with recent ENA drivers (2.2.9+)**; older drivers don't support it and degrade PPS. Driver updates are effectively the top tuning priority.

### Minimum kernel versions by distribution

| Distribution | Minimum kernel |
|--------------|----------------|
| Linux upstream | 5.9 |
| Amazon Linux 2 | 4.14.186 |
| RHEL | 8.4 (4.18.0-305) |
| Ubuntu | 20.04 (5.4.0-1025-aws) |
| Debian | 11 (5.10.0) |

Amazon Linux 2023 and Bottlerocket support Nitro v4+ ENA features by default. Prefer these AMIs for EKS nodes to reduce driver/kernel management overhead. Graviton (arm64) instances additionally require a 64-bit ARM AMI and UEFI boot with ACPI.

## Network Performance Tuning

All current-generation EC2 instances process network packets on Nitro Cards. A flow is identified by a **5-tuple** (source/dest IP, source/dest port, protocol). The first packet of a new flow is fully evaluated; subsequent packets reuse cached state via the accelerated path.

### Consider both PPS and CPS

New connections (CPS) require full 5-tuple evaluation and are expensive; only post-establishment packets (PPS) benefit from acceleration. High-connection-churn workloads (DNS, firewalls, routers) gain less from acceleration — design for connection reuse.

### Key tuning points

- **Keep ENA driver current**: prerequisite for the accelerated path.
- **Avoid asymmetric routing**: differing inbound/outbound interfaces trigger security-group conntrack tracking and reduce peak performance; exhausting the conntrack allowance throttles new connections.
- **Prefer same-AZ communication**: long distances reduce PPS due to TCP windowing and RTT.
- **BQL (Byte Queue Limit)**: disabled by default; combining it with fragment proxy override can constrain performance.

### Kernel parameters and driver tuning

Tune via ENA driver module parameters, ethtool settings, and kernel sysctls. The items below separate AWS-prescribed tuning points from general kernel parameters that require workload benchmarking.

**ENA driver module parameter**

| Item | Description | Method |
|------|-------------|--------|
| `enable_frag_bypass` | Fragment proxy mode bypassing the egress fragment PPS limit (1024) | `sudo insmod ena.ko enable_frag_bypass=1` |

Do not combine fragment proxy mode with BQL.

**ENA queues and ring buffers (ethtool)**

High-performance workloads need multiple ENA queues to distribute work across vCPUs. Supported types allow dynamic per-ENI queue allocation (Flexible ENA queue allocation).

```bash
ethtool -l eth0; ethtool -L eth0 combined <N>   # channels/queues
ethtool -g eth0; ethtool -G eth0 rx <SIZE> tx <SIZE>   # ring buffers (raise on drops)
```

**Connection management (conntrack / TCP keepalive)**

Close idle connections via connection-tracking timeouts, or keep them open via TCP keepalive. On Nitro v6 (350s timeout), set keepalive shorter:

```bash
sysctl -w net.ipv4.tcp_keepalive_time=300
sysctl -w net.ipv4.tcp_keepalive_intvl=30
sysctl -w net.ipv4.tcp_keepalive_probes=5
```

**Workload-specific general kernel parameters** (AWS publishes no single recommended value; raise per workload when corresponding NMA events / ethtool drops appear):

| Parameter | Trigger (NMA event, etc.) |
|-----------|---------------------------|
| `net.netfilter.nf_conntrack_max` | `ConntrackExceededKernel` |
| `kernel.pid_max` | `ApproachingKernelPidMax` |
| `fs.file-max` / `fs.nr_open` | `ApproachingMaxOpenFiles` |
| `net.core.somaxconn`, `net.ipv4.tcp_max_syn_backlog` | high-CPS accept-queue saturation |
| `net.core.rmem_max` / `net.core.wmem_max` | socket buffers at high bandwidth (100 Gbps+) |

:::warning Applying sysctls on EKS nodes

Apply these at the node bootstrap layer rather than editing node OS directly: launch template user data or Bottlerocket `[settings.kernel.sysctl]`; per-Pod via `securityContext.sysctls` (namespaced only). Node-global (non-namespaced) parameters like `net.core.*` and `net.ipv4.tcp_*` cannot be set via Pod `securityContext` and must be applied at the bootstrap layer.

:::

Monitor via ENA ethtool metrics (`bw_in/out_allowance_exceeded`, `pps_allowance_exceeded`, `conntrack_allowance_exceeded`, `conntrack_allowance_available`). Non-zero values mean an allowance limit was hit — consider kernel tuning or a higher Nitro generation.

### EKS health signals

NMA surfaces Nitro/ENA limit overruns as node Events: `BandwidthInExceeded`, `BandwidthOutExceeded`, `PPSExceeded`, `ConntrackExceeded`, `LinkLocalExceeded`, `NetworkSysctl`. These are Event severity and do not trigger Auto Repair, so recurring events call for a design response (larger instance / higher Nitro generation, or workload distribution). See [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md).

## Summary

Nitro generation determines an EKS node's network bandwidth, TCP behavior, and driver requirements. Identify the Nitro version of the target instance family first; v5+ requires an AMI meeting ENA driver 2.2.9+. v6 instances need keepalive tuning for the shortened TCP timeout, and high-PPS/CPS workloads should design for connection reuse and avoid asymmetric routing. Since AWS publishes no single recommended sysctl set, base tuning on ethtool allowance metrics and NMA events, applied at the node bootstrap layer or via Pod `securityContext`.

## References

- [Instances built on the AWS Nitro System](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html)
- [Nitro system considerations for performance tuning](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-nitro-perf.html)
- [ENA Linux Driver Best Practices and Performance Optimization Guide](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/ENA_Linux_Best_Practices.rst)
- [Monitor network performance for ENA settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html)
- [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md)
