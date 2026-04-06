---
title: "EKS Pod Scheduling & Availability Patterns"
sidebar_label: "Pod Scheduling & Availability"
description: "Kubernetes Pod scheduling strategies, Affinity/Anti-Affinity, PDB, Priority/Preemption, Taints/Tolerations best practices"
tags: [eks, kubernetes, scheduling, affinity, pdb, priority, taints, tolerations, descheduler]
category: "operations"
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Pod Scheduling & Availability Patterns

> **Written**: 2026-02-12 | **Updated**: 2026-02-14 | **Reading time**: ~54 min

> **Reference Environment**: EKS 1.30+, Karpenter v1.x, Kubernetes 1.30+

## 1. Overview

Kubernetes Pod scheduling directly impacts service availability, performance, and cost efficiency. Proper scheduling strategies provide: high availability (failure domain isolation), performance optimization (workload-appropriate node placement), resource efficiency (balanced node utilization), and stable operations (priority-based resource guarantees).

## 2. Kubernetes Scheduling Fundamentals

3-phase process: **Filtering** (Predicates) → **Scoring** (Priorities) → **Binding**

| Factor | Type | Phase | Enforcement |
|--------|------|-------|-------------|
| Node Selector | Pod | Filtering | Hard |
| Node Affinity | Pod | Filtering/Scoring | Hard/Soft |
| Pod Affinity | Pod | Scoring | Hard/Soft |
| Pod Anti-Affinity | Pod | Filtering/Scoring | Hard/Soft |
| Taints/Tolerations | Node+Pod | Filtering | Hard |
| Topology Spread | Pod | Scoring | Hard/Soft |
| PriorityClass | Pod | Preemption | Hard |

## 3. Node Affinity & Anti-Affinity

Node Selector (basic exact match), Node Affinity (complex conditions with `In`, `NotIn`, `Exists`, `DoesNotExist`, `Gt`, `Lt` operators), Required vs Preferred, weight-based preferences.

## 4. Pod Affinity & Anti-Affinity

Pod Affinity for co-location (cache locality, data locality). Pod Anti-Affinity for fault isolation (distribute replicas across nodes/AZs). topologyKey: hostname, zone, region, custom.

## 5-9. Taints/Tolerations, Topology Spread, PDB, PriorityClass, Descheduler, Advanced Patterns

Comprehensive coverage including: dedicated node isolation, GPU/Spot taints, Topology Spread Constraints with minDomains, PDB design, PriorityClass hierarchy, Descheduler+Karpenter combination, and AI/ML workload scheduling patterns.

## 10. 2025-2026 AWS Innovations

EKS Auto Mode scheduling, Karpenter v1 GA features, Node Readiness Controller.

---

## Related Documents

- [EKS High Availability Architecture](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide)
- [Pod Health Checks & Lifecycle](/docs/eks-best-practices/operations-reliability/eks-pod-health-lifecycle)
- [Karpenter Autoscaling](/docs/eks-best-practices/resource-cost/karpenter-autoscaling)
