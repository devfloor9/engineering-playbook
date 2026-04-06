---
title: "ROSA (Red Hat OpenShift on AWS)"
sidebar_label: "ROSA"
description: "Technical documentation on deploying and operating Red Hat OpenShift Service on AWS (ROSA)"
category: "rosa"
sidebar_position: 6
last_update:
  date: 2026-02-13
  author: devfloor9
---

# ROSA (Red Hat OpenShift on AWS)

> 📅 **Created**: 2025-02-05 | **Updated**: 2026-02-13 | ⏱️ **Reading time**: ~6 min

This section covers technical documentation for deploying and operating Red Hat OpenShift Service on AWS (ROSA). ROSA is a fully managed OpenShift service jointly managed by AWS and Red Hat, enabling easy deployment of enterprise-grade Kubernetes platforms.

## Key Documents (Implementation Order)

### Step 1: Cluster Installation & Configuration

- **[1. ROSA Demo Installation](./rosa-demo-installation.md)**
  - STS (Security Token Service) based cluster creation
  - Step-by-step installation using ROSA CLI
  - Auto-scaling configuration
  - Network and IAM role setup
  - Initial cluster validation
  - Lab environment setup and testing

### Step 2: Security & Access Control

- **[2. ROSA Security Compliance](./rosa-security-compliance.md)**
  - Red Hat Hybrid Cloud Console access control configuration
  - Access control strategies for financial regulatory compliance
  - IdP (Identity Provider) integration and MFA configuration
  - Role-Based Access Control (RBAC) setup
  - Audit and logging configuration

## Key Technologies

| Technology | Description | Purpose |
|-----------|-------------|---------|
| **ROSA CLI** | OpenShift cluster management CLI tool | Cluster creation, management, deletion |
| **STS** | Temporary security credentials | Enhanced IAM role management |
| **OIDC** | OpenID Connect protocol | External identity provider integration |
| **OVNKubernetes** | OpenShift network plugin | High-performance networking |
| **Cluster Autoscaler** | Auto-scaling | Automatic node adjustment based on workload |
| **Hybrid Cloud Console** | Red Hat central management portal | Multi-cluster centralized management |

## ROSA vs EKS vs On-Premises OpenShift

| Item | ROSA | EKS | On-Premises OpenShift |
|------|------|-----|----------------------|
| **Control Plane Mgmt** | Red Hat/AWS | AWS | Customer responsibility |
| **Security** | Highest level | High | Configuration required |
| **Cost** | Medium-High | Low-Medium | High initial investment |
| **Operational Complexity** | Low | Low | High |
| **Developer Experience** | Excellent | High | Very High |
| **Hybrid Support** | Excellent | Average | Excellent |
| **Multi-Cloud** | Excellent | AWS only | Excellent |

## Related Categories

- [Hybrid Infrastructure](/docs/hybrid-infrastructure) - Hybrid environment management
- [Security & Governance](/docs/security-governance) - ROSA security architecture
- [EKS Best Practices](/docs/eks-best-practices) - Networking optimization and cluster monitoring

:::warning Licensing Notice
ROSA requires separate OpenShift licensing. When calculating costs, consider both ROSA service costs and OpenShift licensing costs.
:::
