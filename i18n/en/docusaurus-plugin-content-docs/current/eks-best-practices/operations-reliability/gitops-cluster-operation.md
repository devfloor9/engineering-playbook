---
title: "GitOps-based EKS Cluster Operations"
sidebar_label: "GitOps Cluster Operations"
description: "GitOps architecture, KRO/ACK usage, multi-cluster management strategies and automation for stable large-scale EKS cluster operations"
tags: [eks, gitops, argocd, kro, ack, kubernetes, automation, infrastructure-as-code]
category: "observability-monitoring"
last_update:
  date: 2026-02-18
  author: devfloor9
---

# GitOps-based EKS Cluster Operations

> **Written**: 2025-02-09 | **Updated**: 2026-02-18 | **Reading time**: ~6 min

> **Reference Versions**: ArgoCD v2.13+ / v3 (pre-release), EKS Capability for Argo CD (GA), Kubernetes 1.32

## Overview

Stable and scalable large-scale EKS cluster operations require automated deployment and management strategies following GitOps principles. This document explains how to build production-grade cluster operational environments using ArgoCD, KRO/ACK, and Infrastructure as Code patterns.

### Key Recommendations

1. **GitOps Platform**: ArgoCD ApplicationSets for multi-cluster management + Flagger for progressive delivery
2. **Infrastructure as Code**: ACK/KRO (Kubernetes Resource Orchestrator) — gradual migration from Terraform, K8s-native consistency
3. **Automation**: Blue/Green EKS upgrades, addon version testing pipelines, Policy as Code (OPA/Gatekeeper)
4. **Security**: External Secrets Operator + AWS Secrets Manager, Git signing, RBAC-based approval workflows

## EKS Capabilities: Fully Managed Platform Features (re:Invent 2025)

| Capability | Base Project | Role |
|-----------|------------|------|
| **Argo CD** | CNCF Argo CD | Declarative GitOps continuous delivery |
| **ACK** | AWS Controllers for Kubernetes | K8s-native AWS resource management |
| **kro** | Kube Resource Orchestrator | Higher-level K8s/AWS resource composition |

Key difference from Add-ons: Capabilities run **outside worker nodes** in AWS-managed accounts with zero operational overhead.

```bash
aws eks create-capability \
  --cluster-name my-cluster \
  --capability-type ARGOCD \
  --role-arn arn:aws:iam::123456789012:role/eks-argocd-capability-role
```

## Multi-Cluster Management

ArgoCD ApplicationSets with Cluster Generator, Git Directory Generator, and Matrix Generator for consistent multi-cluster deployment.

## Terraform to KRO Migration

Phase 1 (2 months): Dev pilot → Phase 2 (3 months): Staging expansion → Phase 3 (4 months): Full production migration.

## ArgoCD v3 Updates (2025)

Scalability improvements, security enhancements, RBAC improvements, and audit logging. Pre-released at KubeCon EU 2025.
