---
title: ROSA (Red Hat OpenShift on AWS)
description: Technical documentation on deploying and operating Red Hat OpenShift Service on AWS (ROSA)
created: "2025-02-05"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 12
tags:
  - scope:nav
sidebar_label: ROSA
sidebar_position: 6
category: rosa
---

<a id="rosa-red-hat-openshift-on-aws" />

This section provides technical documentation for deploying and operating Red Hat OpenShift Service on AWS (ROSA). ROSA is a fully managed OpenShift service jointly managed by AWS and Red Hat that supports deployment of enterprise-grade Kubernetes platforms.

## Key Documents (Implementation Order)

### Step 1: Cluster Installation & Configuration

- **[1. ROSA Demo Installation](./rosa-demo-installation.md)**
  - Cluster creation using Security Token Service (STS)
  - Step-by-step installation with the ROSA CLI
  - Auto-scaling configuration
  - Network and IAM role configuration
  - Initial cluster validation
  - Lab environment setup and testing

### Step 2: Security & Access Control

- **[2. ROSA Security Compliance](./rosa-security-compliance.md)**
  - Red Hat Hybrid Cloud Console access control configuration
  - Access control strategies for financial-sector security requirements
  - Identity provider (IdP) integration and MFA configuration
  - Role-based access control (RBAC) configuration
  - Audit and logging setup

## Learning Objectives

This section covers:

- ROSA cluster installation and initial configuration
- STS-based IAM role configuration and security best practices
- Centralized management through Red Hat Hybrid Cloud Console
- Strategies for meeting financial-sector security requirements
- IdP integration and user authentication management
- Cluster auto-scaling and resource management
- ROSA cluster operations and monitoring
- Migration from on-premises OpenShift to ROSA

## Architecture Pattern

```mermaid
graph TB
    subgraph AWS["AWS Cloud"]
        subgraph ROSA["ROSA Cluster"]
            CP["Control Plane<br/>(Red Hat Managed)"]
            WN["Worker Nodes<br/>(Customer Managed)"]
            IN["Infrastructure Nodes<br/>(System Components)"]
        end
        IAM["IAM Roles<br/>(STS Token Service)"]
        VPC["VPC & Networking<br/>(Customer VPC)"]
        KMS["KMS & Secrets<br/>(Encryption)"]
    end

    subgraph RedHat["Red Hat"]
        HCC["Hybrid Cloud Console<br/>(Central Management)"]
        Registry["Quay Registry<br/>(Container Images)"]
        OIDC["OIDC Provider<br/>(Authentication)"]
    end

    subgraph Customer["Customer Environment"]
        IdP["Identity Provider<br/>(Okta/Azure AD/etc)"]
        Admin["Administrators<br/>(Access Management)"]
        OnPrem["On-Premises Systems<br/>(Hybrid Integration)"]
    end

    Admin -->|Authentication| IdP
    IdP -->|OIDC Tokens| OIDC
    OIDC -->|Identity| HCC
    HCC -->|Management| CP
    CP -->|Orchestration| WN
    CP -->|System| IN
    WN & IN -->|Compute| AWS
    IAM <-->|STS| ROSA
    KMS <-->|Encryption| ROSA
    VPC <-->|Networking| ROSA
    HCC -->|Container Images| Registry
    OnPrem <-->|Hybrid Workloads| ROSA

    style AWS fill:#ff9900
    style RedHat fill:#c41e3a
    style Customer fill:#34a853
```

## Key Technologies

| Technology | Description | Purpose |
|------|------|------|
| **ROSA CLI** | Command-line tool for managing OpenShift clusters | Cluster creation, management, and deletion |
| **STS (Security Token Service)** | Temporary security credentials | More secure IAM role management |
| **OIDC** | OpenID Connect protocol | External identity provider integration |
| **OVNKubernetes** | OpenShift network plugin | High-performance networking |
| **Cluster Autoscaler** | Auto-scaling | Automatic node adjustment based on workload |
| **Hybrid Cloud Console** | Red Hat central management portal | Centralized multi-cluster management |
| **Quay Registry** | Container image registry | Build and deployment automation |

## Key Concepts

### ROSA Characteristics

- **Fully managed service**: AWS and Red Hat jointly operate the control plane.
- **High availability**: Automated patching and updates.
- **Security**: STS-based temporary credentials and OIDC provider integration.
- **Flexibility**: Customers retain full control of worker nodes.

### Benefits of STS-Based Authentication

- **Temporary credentials**: Permanent access keys are unnecessary.
- **Automatic token renewal**: Tokens are renewed before expiration.
- **Least privilege**: Grant only the minimum required permissions.
- **Audit trail**: All access records are stored in CloudTrail.

### Role of Red Hat Hybrid Cloud Console

- **Centralized management**: Manage multiple clusters from one location.
- **Multi-cloud support**: Unified management of AWS, Azure, GCP, and on-premises OpenShift.
- **Policy-based management**: Enforce security policies centrally.
- **Cost tracking**: Monitor costs per cluster.

### Network Configuration

- **OVNKubernetes**: High-performance networking based on Open vSwitch.
- **Network Policy**: Full support for Kubernetes network policies.
- **Ingress Controller**: Built-in ingress controller.
- **Service Mesh Ready**: Support for Istio/Kiali integration.

## Use Cases

### Enterprise Migration

- **On-premises OpenShift → ROSA**: Migrate existing OpenShift environments to ROSA.
- **Reduced management burden**: Automate control plane operations.
- **Cost savings**: Reduce operating costs.
- **Global expansion**: Deploy across multiple regions.

### Financial-Sector Compliance

- **Security requirements**: Advanced security through STS, OIDC, MFA, and related capabilities.
- **Access control**: Fine-grained permission management.
- **Audit logging**: Record and track all activities.
- **Data protection**: KMS-based encryption.

### Hybrid Cloud Strategy

- **On-premises + AWS**: Manage both environments through a single platform.
- **Multi-cloud**: Manage AWS, Azure, and GCP together.
- **Cloud bursting**: Expand into the cloud during peak demand.
- **Disaster recovery**: Implement multi-region disaster recovery strategies.

## ROSA vs EKS vs On-Premises OpenShift

| Item | ROSA | EKS | On-Premises OpenShift |
|------|------|-----|----------------|
| **Control Plane Management** | Red Hat/AWS | AWS | Customer responsibility |
| **Security** | Highest level | High | Requires configuration |
| **Cost** | Medium to high | Low to medium | High initial investment |
| **Operational Complexity** | Low | Low | High |
| **Developer Experience** | Excellent | High | Very high |
| **Deployment Speed** | Fast | Fast | Slow |
| **Hybrid Support** | Excellent | Average | Excellent |
| **Multi-Cloud** | Excellent | AWS only | Excellent |

## Deployment Patterns

### 1. Single-Cluster Deployment

```text
ROSA Cluster
├── Development namespace
├── Staging namespace
└── Production namespace
```

### 2. Multi-Cluster Deployment

```text
Hybrid Cloud Console (central management)
├── AWS Region 1 (ROSA)
├── AWS Region 2 (ROSA)
├── On-Premises (OpenShift)
└── Multi-Cloud (Azure/GCP)
```

### 3. High-Availability Deployment

```text
Primary Region (ROSA)
├── Active Cluster
├── Replication to DR
└── Auto-failover
    └── Secondary Region (ROSA)
```

## Related Categories

- [EKS Hybrid Nodes](/docs/eks-hybrid-nodes) - Hybrid environment management
- [Security & Governance](/docs/eks-best-practices/security-authn) - EKS security governance best practices
- [EKS Best Practices](/docs/eks-best-practices) - Networking optimization and cluster monitoring

---

:::tip Operational Benefits
Joint management by AWS and Red Hat reduces the burden of operating the ROSA control plane. Its security and compliance capabilities are particularly relevant to financial-sector and enterprise environments.
:::

:::info Recommended Learning Path

1. Understand ROSA fundamentals.
2. Create an STS-based cluster.
3. Integrate an IdP and manage users.
4. Use Hybrid Cloud Console.
5. Apply advanced deployment patterns, including multi-cluster and hybrid deployments.
:::

:::warning Licensing Notice
ROSA requires separate OpenShift licensing. Include both ROSA service costs and OpenShift licensing costs when calculating the budget.
:::

:::success Migration Guidance
For migration from an existing on-premises OpenShift environment to ROSA, establish a **phased migration strategy**:

1. Start with development and test environments.
2. Move workloads that are not business-critical.
3. Migrate production workloads after gaining operational experience.
:::
