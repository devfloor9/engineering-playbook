---
title: "EKS Node Monitoring Agent"
sidebar_label: "Node Monitoring Agent"
description: "Architecture, deployment strategies, limitations, and best practices for the AWS EKS Node Monitoring Agent that automatically detects and reports node health issues"
tags: [eks, monitoring, node-monitoring, aws, observability, cloudwatch]
category: "observability-monitoring"
last_update:
  date: 2026-06-19
  author: devfloor9
---

# EKS Node Monitoring Agent

> **Written**: 2025-08-26 | **Updated**: 2026-06-19 | **Reading time**: ~9 min

## Overview

The EKS Node Monitoring Agent (NMA) is an AWS-provided node health monitoring tool that automatically detects and reports hardware and system-level issues on EKS cluster nodes. GA in 2024, it works alongside Node Auto Repair for improved cluster stability.

### Key Features

- **Log-based problem detection**: Real-time system log analysis with pattern matching
- **Automatic event generation**: Creates Kubernetes Events and Node Conditions on detection
- **CloudWatch integration**: Centralized monitoring via CloudWatch
- **EKS Add-on support**: Simple installation and management

## Enablement

No special AWS request is required — NMA is self-service. It is built into EKS Auto Mode by default; for other compute types (managed node groups, Karpenter, self-managed) it is added as an EKS managed add-on (`eks-node-monitoring-agent`) or via Helm. Linux only; not supported on Fargate.

## Architecture

DaemonSet-based deployment monitoring: Container Runtime, Storage, Networking, Kernel, and Accelerated Hardware (GPU/Neuron). Uses controller-runtime for K8s-native integration.

### Node Conditions

`ContainerRuntimeReady`, `StorageReady`, `NetworkingReady`, `KernelReady`, `AcceleratedHardwareReady` (in addition to the standard `Ready`, `DiskPressure`, `MemoryPressure`).

### Severity: Condition vs. Event

NMA classifies issues by severity, which determines whether Node Auto Repair acts:

- **Condition**: terminal issue warranting a Replace/Reboot. Triggers Auto Repair when enabled.
- **Event**: temporary or non-critical issue. **Does not** trigger Auto Repair — recorded for investigation only.

**containerd scenario**: A runtime failure where a pod is stuck terminating surfaces as `PodStuckTerminating` (Condition → Replace). A plain container-create failure (`ContainerRuntimeFailed`) is an Event only and is not auto-remediated.

## Node Auto Repair Integration

NMA alone provides visibility; pairing it with Auto Repair enables automatic Replace/Reboot.

- **Auto Repair alone (no NMA)** reacts to: kubelet `Ready`, manually deleted node objects, managed node group instances that fail to join.
- **Auto Repair + NMA** additionally reacts to: `AcceleratedHardwareReady`, `ContainerRuntimeReady`, `KernelReady`, `NetworkingReady`, `StorageReady`.

| Condition | Repair after | Action |
|-----------|-------------|--------|
| `AcceleratedHardwareReady` | 10 min | Replace or Reboot |
| `ContainerRuntimeReady` | 30 min | Replace |
| `KernelReady` / `NetworkingReady` / `StorageReady` / `Ready` | 30 min | Replace |
| `DiskPressure` / `MemoryPressure` | N/A | None |

:::warning DiskPressure / MemoryPressure / PIDPressure are NOT auto-repair targets

Auto Repair intentionally does not act on these standard Kubernetes conditions — they usually reflect application or workload-configuration issues rather than node-level faults, and are handled by Kubernetes node-pressure eviction. So container load that surfaces as memory/disk/PID pressure will not trigger node replacement; only genuine runtime failures (Conditions like `PodStuckTerminating`) do.

:::

**Guardrails**: new repair actions are halted when more than 20% of nodes in a node group/NodePool are unhealthy (managed node groups: also requires >5 nodes; halts on ARC zonal shift). Enablement: Auto Mode (always on), Karpenter (feature gate `NodeRepair=true`), managed node groups (`--node-repair-config enabled=true`).

## Limitations

- Not a metrics collection tool — log-based analysis only
- Cannot detect sudden hardware failures or complete network disconnection
- Limited Prometheus endpoint (port 8080)

## Best Practices

Use NMA as L1 (state detection) in a multi-layer monitoring stack: L1 NMA → L2 Container Insights/Prometheus → L3 Node Auto Repair → L4 Unified Dashboard.

Resource usage (add-on/Helm defaults): requests CPU 10m / Memory 30Mi, limits CPU 250m / Memory 100Mi.

## References

- [Detect node health issues and enable automatic node repair](https://docs.aws.amazon.com/eks/latest/userguide/node-health.html)
- [Detect node health issues with the EKS node monitoring agent](https://docs.aws.amazon.com/eks/latest/userguide/node-health-nma.html)
- [Automatically repair nodes in EKS clusters](https://docs.aws.amazon.com/eks/latest/userguide/node-repair.html)
- [aws/eks-node-monitoring-agent](https://github.com/aws/eks-node-monitoring-agent)
