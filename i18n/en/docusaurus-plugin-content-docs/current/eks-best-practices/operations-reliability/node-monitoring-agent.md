---
title: "EKS Node Monitoring Agent"
sidebar_label: "Node Monitoring Agent"
description: "Architecture, deployment strategies, limitations, and best practices for the AWS EKS Node Monitoring Agent that automatically detects and reports node health issues"
tags: [eks, monitoring, node-monitoring, aws, observability, cloudwatch]
category: "observability-monitoring"
last_update:
  date: 2026-02-13
  author: devfloor9
---

# EKS Node Monitoring Agent

> **Written**: 2025-08-26 | **Updated**: 2026-02-13 | **Reading time**: ~7 min

## Overview

The EKS Node Monitoring Agent (NMA) is an AWS-provided node health monitoring tool that automatically detects and reports hardware and system-level issues on EKS cluster nodes. GA in 2024, it works alongside Node Auto Repair for improved cluster stability.

### Key Features

- **Log-based problem detection**: Real-time system log analysis with pattern matching
- **Automatic event generation**: Creates Kubernetes Events and Node Conditions on detection
- **CloudWatch integration**: Centralized monitoring via CloudWatch
- **EKS Add-on support**: Simple installation and management

## Architecture

DaemonSet-based deployment monitoring: Container Runtime, Storage, Networking, Kernel, and Accelerated Hardware (GPU/Neuron). Uses controller-runtime for K8s-native integration.

### Node Conditions

- `ContainerRuntimeReady`, `StorageReady`, `NetworkingReady`, `KernelReady`, `AcceleratedHardwareReady`

### Detectable Issues

**Conditions (auto-repair targets)**: DiskPressure, MemoryPressure, PIDPressure, NetworkUnavailable, KubeletUnhealthy, ContainerRuntimeUnhealthy

**Events (warning only)**: Kernel soft lockup, I/O delays, filesystem errors, network packet loss, hardware error indicators

### Limitations

- Not a metrics collection tool — log-based analysis only
- Cannot detect sudden hardware failures or complete network disconnection
- Limited Prometheus endpoint (port 8080)

### Best Practices

Use NMA as L1 (state detection) in a multi-layer monitoring stack: L1 NMA → L2 Container Insights/Prometheus → L3 Node Auto Repair → L4 Unified Dashboard.

Resource usage: CPU 10m-250m, Memory 30Mi-100Mi.
