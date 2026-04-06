---
title: "EKS Troubleshooting and Incident Response Guide"
sidebar_label: "EKS Troubleshooting & Incident Response"
description: "Comprehensive troubleshooting guide for systematically diagnosing and resolving application and infrastructure issues in Amazon EKS environments"
tags: [eks, kubernetes, debugging, troubleshooting, observability, incident-response]
category: "observability-monitoring"
last_update:
  date: 2026-02-13
  author: devfloor9
---

import { IncidentEscalationTable, ZonalShiftImpactTable, ControlPlaneLogTable, ClusterHealthTable, NodeGroupErrorTable, ErrorQuickRefTable } from '@site/src/components/EksDebugTables';

# EKS Troubleshooting and Incident Response Guide

> **Written**: 2026-02-10 | **Updated**: 2026-02-13 | **Reading time**: ~23 min

> **Reference Environment**: EKS 1.30+, kubectl 1.30+, AWS CLI v2

## 1. Overview

Issues during EKS operations span multiple layers: control plane, nodes, networking, workloads, storage, and observability. This guide provides SREs, DevOps engineers, and platform teams with a **systematic diagnosis and rapid resolution** framework.

### EKS Debugging Layers

Control Plane → Nodes → Network → Workloads → Storage → Observability

### Debugging Approach

| Approach | Description | Suitable For |
|----------|-------------|-------------|
| **Top-down (symptom → cause)** | Start from reported symptoms, trace to root cause | Service outages, performance degradation |
| **Bottom-up (infra → app)** | Inspect infrastructure layers sequentially | Preventive checks, post-migration validation |

## 2. Incident Triage (Rapid Assessment)

### First 5 Minutes Checklist

**30 seconds**: `aws eks describe-cluster`, `kubectl get nodes`, check non-Running pods
**2 minutes**: Recent events, pod status aggregation, abnormal pod distribution by node
**5 minutes**: Pod details, previous container logs, resource usage

### Scope Assessment Decision Tree

Single Pod → Workload debugging. Same Node → Node-level debugging. Same AZ → AZ failure (ARC Zonal Shift). All namespaces → Control Plane. Specific namespaces → Networking.

<IncidentEscalationTable />

## 3. Control Plane Debugging

<ControlPlaneLogTable />

Enable logs, use CloudWatch Logs Insights queries for: API server errors (400+), authentication failures, aws-auth changes, API throttling, unauthorized access attempts.

### Authentication/Authorization

IAM authentication, aws-auth ConfigMap, Access Entries, IRSA debugging, Pod Identity debugging, Service Account token expiration (HTTP 401).

### Add-on Troubleshooting

CoreDNS, kube-proxy, VPC CNI, EBS CSI — each with specific error patterns, diagnostics, and resolutions.

<ClusterHealthTable />

## 4-8. Node, Workload, Network, Storage, Observability Debugging

Comprehensive sections covering: node health (kubelet, containerd, Karpenter), workload issues (Pod states, Probe failures, HPA), networking (VPC CNI, DNS, Service, NetworkPolicy), storage (EBS/EFS CSI), and observability setup.

<ErrorQuickRefTable />

---

## Related Documents

- [EKS High Availability Architecture Guide](./eks-resiliency-guide.md)
- [Pod Health Checks & Lifecycle](./eks-pod-health-lifecycle.md)
- [Pod Scheduling & Availability](./eks-pod-scheduling-availability.md)
