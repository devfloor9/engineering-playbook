---
title: AWS Nitro Architecture and Performance Tuning
description: AWS Nitro System components, per-generation (v2–v6) networking changes, ENA driver/kernel requirements on EKS nodes, and PPS/CPS-focused performance tuning strategies
created: "2026-06-19"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 28
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
sidebar_label: Nitro Architecture & Tuning
---

## Overview

The AWS Nitro System is the underlying platform for current-generation Amazon EC2 instances and governs the networking, storage, and security behavior of EKS worker nodes. Nitro generations (v2–v6) differ in network bandwidth, ENA (Elastic Network Adapter) features, and TCP behavior, which in turn change the ENA driver/kernel version requirements and performance tuning points for node AMIs. This document summarizes the Nitro components and per-generation changes, then covers the driver/kernel requirements to verify from an EKS-node perspective along with PPS (Packets Per Second)/CPS (Connections Per Second)-focused tuning strategies.

## Background

The Nitro System is a collection of components that offload virtualization overhead to dedicated hardware.

- **Nitro Card**: Handles all I/O interfaces — networking, local NVMe storage, management, monitoring, security — on a self-contained compute device physically separate from the host mainboard.
- **Nitro Security Chip**: Integrated into the mainboard, providing a hardware root of trust.
- **Nitro Hypervisor**: A lightweight hypervisor responsible only for memory/CPU allocation, delivering performance indistinguishable from bare metal for most workloads.

Check an instance's Nitro version in the **`Hypervisor` column of the Platform summary table** on the instance family spec page. Features are **cumulative** — newer versions include all features of lower versions (except where explicitly stated).

## Per-Generation Networking Changes

**Table 1. Key networking changes by Nitro generation**

| Generation | Key changes | Example instances |
|------------|-------------|-------------------|
| **v6** | Up to 400 Gbps per network card. Idle TCP established timeout reduced 432,000s → **350s**. Traffic Mirroring not supported | M8i·C8i·R8i, P6-B200, G7 |
| **v5** | Up to 200 Gbps per card. Traffic Mirroring not supported | M8g·C8g·R8g, Trn2, P5en, P6e-GB200 |
| **v4** | 100 Gbps for GPU/Trainium families, up to 170 Gbps otherwise. **ENA Express** support, RDMA read/write (EFA) on select types. Traffic Mirroring supported | M7i·C7i·R7i, M7g, Inf2, Trn1, P5, G6 |
| **v3** | Up to 100 Gbps per card. **Encryption in transit**. Traffic Mirroring supported | C5n, R5n, P4d, G4dn, Inf1 |
| **v2** | **ENA-based enhanced networking** introduced. Traffic Mirroring supported | M5·C5·R5, M6g·C6g, T3·T4g |

:::warning Impact of v6's shortened TCP established timeout

On Nitro v6, the default established timeout for idle TCP connections was **drastically shortened from 432,000s to 350s**. Workloads maintaining long-lived connections — connection pools, gRPC keepalive, long-idle DB connections — may experience unintended disconnects. Tune the application/kernel keepalive settings (`net.ipv4.tcp_keepalive_time`, etc.) shorter than the timeout to keep connections alive.

:::

## Driver and Kernel Requirements

Nitro instances use ENA for enhanced networking and NVMe block devices for storage volumes. Requirements tighten with each generation and directly affect not only performance but also whether ENI attachment succeeds.

### ENA Driver Minimum Versions

- ENA Linux driver **2.2.9 or later**: recommended on Nitro v4, **required on Nitro v5 and later**.
- Versions below 2.2.9 on v5, or below 1.2.0 on pre-v5 generations, cause **ENI attachment failures**.
- The **accelerated path feature works only with recent ENA drivers (2.2.9+)**. Older drivers don't support the accelerated path and degrade PPS performance. Driver updates are therefore effectively the top tuning priority.

### Minimum Kernel Versions by Distribution

Some distributions require a minimum kernel version for optimal ENA feature performance.

**Table 2. ENA minimum kernel version by distribution**

| Distribution | Minimum kernel |
|--------------|----------------|
| Linux upstream | 5.9 |
| Amazon Linux 2 | 4.14.186 |
| RHEL | 8.4 (4.18.0-305) |
| Ubuntu | 20.04 (5.4.0-1025-aws) |
| Debian | 11 (5.10.0) |

Amazon Linux 2023 and Bottlerocket bundle Nitro v4+ ENA features and drivers by default, so the ENA features themselves are usable out of the box with no extra installation. This is limited to ENA feature/driver compatibility, however, and does not mean no workload needs any separate kernel tuning. As the kernel-parameter section below covers, workload-specific sysctl/queue tuning and measuring its effect are still required. Where possible, use Amazon Linux 2023 or Bottlerocket-based AMIs for EKS nodes to reduce driver/kernel management overhead.

### Additional Graviton (arm64) Requirements

Graviton processor instances require a 64-bit ARM architecture AMI and UEFI boot with ACPI tables and ACPI hot-plug of PCI devices, and support Linux operating systems only.

## Network Performance Tuning

All current-generation EC2 instances perform network packet processing on the Nitro Card. The Nitro Card evaluates security groups, ACLs, and routing for the first packet of a new flow, and reuses cached information for subsequent packets of the same flow to reduce overhead. A flow is identified by a **5-tuple** of source/destination IP, port, and protocol.

### Consider PPS and CPS Together

New connections (CPS) require full 5-tuple evaluation and are expensive; only post-establishment packets (PPS) benefit from the accelerated path. Workloads with high new-connection rates — DNS, firewalls, virtual routers — gain less from acceleration, so design applications to reuse connections.

### Key Tuning Points

- **Keep the ENA driver current**: a prerequisite for enabling the accelerated path. Stay at or above the minimum versions above.
- **Avoid asymmetric routing**: differing inbound/outbound interfaces trigger security-group conntrack tracking and degrade peak performance. Exhausting the conntrack allowance throttles new connections.
- **Prefer same-AZ communication**: long-distance connections reduce PPS due to TCP windowing and increased RTT.
- **BQL (Byte Queue Limit)**: disabled by default in ENA drivers and most distributions. Enabling it together with fragment proxy override can constrain performance.

### Kernel Parameters and Driver Tuning

Network performance on Nitro instances can be adjusted via ENA driver module parameters, ethtool settings, and kernel sysctl values. The items below separate the tuning points AWS official documentation prescribes from general kernel parameters tuned per workload characteristics. Benchmark all values before and after applying, using peak active flow count.

#### ENA Driver Module Parameter

**Table 3. ENA driver module parameters**

| Item | Description | Method |
|------|-------------|--------|
| `enable_frag_bypass` | Fragment proxy mode that bypasses the egress fragment PPS limit (1024). Useful for workloads with frequent fragmentation from exceeding MTU | At driver load: `sudo insmod ena.ko enable_frag_bypass=1` |

Do not use fragment proxy mode together with BQL, as this can constrain performance. Also, `enable_frag_bypass` is a feature added later than the 2.2.9 baseline driver required for ENI attachment, and is available only in ENA Linux driver **2.13.3 or later** (the 2.13.3 release added Fragment bypass support). Applying this parameter on a driver older than 2.13.3 can fail to load, so before applying it verify the current module supports the parameter with `modinfo ena | grep enable_frag_bypass`. For detailed options, refer to the ENA Linux driver README and Best Practices guide.

#### ENA Queues and Ring Buffers (ethtool)

High-performance network workloads should use multiple ENA queues to distribute processing across vCPUs. Supported instance types allow dynamic per-ENI queue allocation (Flexible ENA queue allocation). Check and adjust queue count and ring buffer size with `ethtool`.

```bash
# Check and adjust current channel (queue) count
ethtool -l eth0
ethtool -L eth0 combined <N>

# Check and adjust ring buffer size (raise on drops)
ethtool -g eth0
ethtool -G eth0 rx <SIZE> tx <SIZE>
```

#### Connection Management (conntrack · TCP keepalive)

- **Idle connection timeout**: Security-group connection tracking tracks idle connections and consumes the conntrack allowance. Use connection-tracking timeouts to close idle connections quickly, or TCP keepalive to keep idle connections open.
- **Nitro v6 handling**: Since v6 has a short 350s established timeout, set the kernel keepalive interval shorter than that when long-lived connections must be maintained.

```bash
# TCP keepalive — keep idle connections alive (shorter than 350s)
sysctl -w net.ipv4.tcp_keepalive_time=300
sysctl -w net.ipv4.tcp_keepalive_intvl=30
sysctl -w net.ipv4.tcp_keepalive_probes=5
```

These values are illustrative of the direction to tune; verify three things before using them as-is. First, these sysctls take effect only when keepalive is enabled on the socket. If the application does not set `SO_KEEPALIVE` on its sockets, no probes are sent no matter how short the kernel keepalive interval is, so long-idle connections are not protected. Second, a sysctl changed in the host namespace is not automatically applied to the network namespaces of already-running Pods, so after applying it verify the effective value inside the target Pod (`cat /proc/sys/net/ipv4/tcp_keepalive_time`). Third, confirm by measurement that the interval is shorter than the actual ENI/connection-tracking timeout the workload experiences (such as Nitro v6's 350s).

#### Workload-Specific General Kernel Parameters

AWS does not provide a single recommended value for the following sysctls; raise them per workload when the corresponding kernel events surfaced by NMA (`ApproachingKernelPidMax`, `ApproachingMaxOpenFiles`, `ConntrackExceededKernel`) or ethtool drop metrics are observed.

**Table 4. sysctl parameters and their tuning triggers**

| Parameter | Trigger (NMA event, etc.) |
|-----------|---------------------------|
| `net.netfilter.nf_conntrack_max` | `ConntrackExceededKernel` — kernel conntrack table saturated |
| `kernel.pid_max` | `ApproachingKernelPidMax` — PID exhaustion imminent |
| `fs.file-max` / `fs.nr_open` | `ApproachingMaxOpenFiles` — open-file limit imminent |
| `net.core.somaxconn`, `net.ipv4.tcp_max_syn_backlog` | accept-queue saturation in high-CPS services |
| `net.core.rmem_max` / `net.core.wmem_max` | socket buffers for high-bandwidth (100 Gbps+) transfers |

:::warning Applying sysctls on EKS nodes

When permanently applying the above kernel parameters on EKS worker nodes, configure them at the node bootstrap layer rather than editing the node OS directly.

- **Managed node groups / self-managed**: launch template user data, or Bottlerocket's `[settings.kernel.sysctl]` settings
- **Per-Pod**: Pod `securityContext.sysctls` (namespaced sysctls), or a privileged init container
- **DaemonSet**: a node-tuning DaemonSet that applies node-global sysctls at boot when needed

Whether a sysctl can be set at the Pod level depends on whether the parameter is isolated per network namespace (namespaced), so it is wrong to assume blanketly that "node-global parameters cannot be set from a Pod." Only namespaced sysctls can be set via Pod `securityContext.sysctls`; those in the safe set require no extra configuration, while the rest require the kubelet's `--allowed-unsafe-sysctls` to permit them first. For example, the TCP keepalive family (`net.ipv4.tcp_keepalive_time`, `tcp_keepalive_intvl`, `tcp_keepalive_probes`) is in the safe set as of Kubernetes 1.29 and can be set per Pod, while `net.core.somaxconn` is namespaced but classified as unsafe and needs the allow setting. Genuinely node-global (non-namespaced) parameters (such as `net.core.rmem_max`, `net.ipv4.tcp_mem`, and many others) cannot be set via Pod `securityContext` and must be applied at the node bootstrap layer. Classify each parameter by kernel/Kubernetes version, safe/unsafe status, and `hostNetwork` constraints so you avoid making node globals privileged more than necessary.

:::

Monitor performance indicators via the ethtool metrics exposed by the ENA driver, distinguishing their nature. `bw_in/out_allowance_exceeded`, `pps_allowance_exceeded`, and `conntrack_allowance_exceeded` are counters cumulative since the driver reset, so a non-zero value alone does not prove an incident is in progress — look at the increase over a window. In contrast, `conntrack_allowance_available` is a gauge reporting the remaining trackable-connection capacity, so a positive value means capacity remains, not exhaustion. When this gauge approaches 0 or the `*_exceeded` counters increase within a window, the corresponding allowance is reaching its limit — consider kernel tuning or moving to a higher Nitro-generation instance.

### EKS-Perspective Correlation Signals

The EKS Node Monitoring Agent (NMA) surfaces Nitro/ENA limit overruns as node Events. Representative ones include `BandwidthInExceeded`, `BandwidthOutExceeded`, `PPSExceeded`, `ConntrackExceeded`, `LinkLocalExceeded`, and `NetworkSysctl`. These are Event severity and do not trigger Auto Repair. Since automatic node replacement won't resolve them, recurring events call for a design response such as a larger instance type (higher Nitro generation) or workload distribution. For interpreting node health signals, see [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md).

## Summary

The Nitro generation is the hardware layer that determines an EKS node's network bandwidth, TCP behavior, and driver requirements. First confirm the Nitro version of the instance family where the workload will run; v5 and later require an AMI meeting ENA driver 2.2.9+. v6 instances need keepalive tuning that accounts for the shortened TCP established timeout, and high-PPS/CPS workloads should design for connection reuse and avoid asymmetric routing to maximize use of the accelerated path. Kernel parameter tuning centers on ENA driver module options, ethtool queues/ring buffers, and conntrack/keepalive sysctls; since AWS provides no single per-workload recommended value, tune based on ethtool allowance metrics and NMA events while benchmarking. On EKS nodes, apply via the node bootstrap layer (launch template user data, Bottlerocket settings) or Pod `securityContext`.

## References

### Official Documentation
- [Instances built on the AWS Nitro System](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html) — Per-generation network features, instance mapping, driver/kernel requirements
- [Nitro system considerations for performance tuning](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-nitro-perf.html) — Packet flow, PPS/CPS, accelerated path and PPS tuning (`enable_frag_bypass`)
- [ENA Linux Driver Best Practices and Performance Optimization Guide](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/ENA_Linux_Best_Practices.rst) — ENA driver queue/ring-buffer/tuning best practices
- [Monitor network performance for ENA settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html) — ethtool allowance metric monitoring
- [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) — Nitro component overview

### Technical Blogs
- [Using connection tracking improvements to increase network performance](https://aws.amazon.com/blogs/networking-and-content-delivery/using-connection-tracking-improvements-to-increase-network-performance/) — conntrack allowance and performance
- [EC2 instance-level network performance metrics](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-ec2-instance-level-network-performance-metrics-uncover-new-insights/) — Monitoring ENA allowance overrun metrics

### Related Documents (internal)
- [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md) — Interpreting node network limit-overrun events
- [Cilium ENI + Gateway API](./gateway-api-adoption-guide/cilium-eni-gateway-api.md) — ENI-mode networking based on the ENA driver
