---
title: "EKS Pod Resource Optimization Guide"
sidebar_label: "Pod Resource Optimization"
description: "Kubernetes Pod CPU/Memory resource configuration, QoS classes, VPA/HPA autoscaling, and resource right-sizing strategies"
tags: [eks, kubernetes, resources, cpu, memory, qos, vpa, hpa, right-sizing, optimization]
category: "performance-networking"
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Pod Resource Optimization Guide

> **Written**: 2026-02-12 | **Updated**: 2026-02-14 | **Reading time**: ~46 min

> **Reference Environment**: EKS 1.30+, Kubernetes 1.30+, Metrics Server v0.7+

## Overview

Pod resource configuration directly impacts cluster efficiency and cost. **50% of containers use only 1/3 of requested CPU**, resulting in 40-60% average resource waste. This guide provides practical strategies for 30-50% cost reduction through Pod-level resource optimization.

## Resource Requests & Limits Deep-dive

### Requests vs Limits

- **Requests**: Minimum guaranteed resources for scheduling and QoS
- **Limits**: Maximum enforced resources — CPU throttling, Memory OOM Kill

| Property | CPU | Memory |
|----------|-----|--------|
| Over-limit | **Throttling** (slowdown) | **OOM Kill** (forced termination) |
| Compressible | Yes | No |

### CPU Deep-dive

CFS Bandwidth Throttling, millicore units (1 CPU = 1000m). Consider **not setting CPU limits** (Google/Datadog approach) — CPU is compressible, throttling causes unnecessary degradation.

### Memory Deep-dive

**Always set memory limits** — memory is incompressible, exhaustion causes node instability. Guaranteed QoS (`requests = limits`) recommended for databases. JVM apps: heap = 75% of limits. Node.js: `--max-old-space-size` = 70% of limits.

### QoS Classes

- **Guaranteed** (`requests = limits`): Highest priority, never evicted first
- **Burstable** (`requests < limits`): Middle priority
- **BestEffort** (no requests/limits): Lowest priority, evicted first

## VPA (Vertical Pod Autoscaler)

Modes: Off (recommendations only), Initial (set at creation), Auto (live updates). Safe coexistence with HPA: VPA manages memory, HPA manages CPU-based scaling.

## Right-Sizing Methodology

P95-based resource calculation with 20% buffer. Tools: Goldilocks, Kubecost recommendations, VPA Off mode.

## EKS Auto Mode Resource Optimization

Auto Mode automates infrastructure but **Pod-level requests/limits remain developer responsibility**. Graviton + Spot automatic optimization for up to 90% cost savings.

---

## Related Documents

- [Karpenter Autoscaling](/docs/eks-best-practices/resource-cost/karpenter-autoscaling)
- [EKS Cost Management](/docs/eks-best-practices/resource-cost/cost-management)
