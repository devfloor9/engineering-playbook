---
title: "ROSA (Red Hat OpenShift on AWS)"
sidebar_label: "ROSA"
description: "Technical documentation on ROSA (Red Hat OpenShift Service on AWS) cluster deployment and operations"
sidebar_position: 6
---

# ROSA (Red Hat OpenShift on AWS)

This section covers technical documentation on ROSA (Red Hat OpenShift Service on AWS) cluster deployment and operations. ROSA is a fully managed OpenShift service jointly managed by AWS and Red Hat, making it easy to build enterprise-grade Kubernetes platforms.

## 📚 Main Documents (Implementation Order)

### Step 1: Cluster Installation and Configuration
- **[ROSA Demo Installation Guide](./rosa-demo-installation.md)**
  - STS (Security Token Service)-based cluster creation
  - Step-by-step installation via ROSA CLI
  - Auto-scaling configuration
  - Network and IAM role setup
  - Initial cluster validation
  - Lab environment configuration and testing

### Step 2: Security and Access Control
- **[ROSA Security Compliance Console Access Control](./rosa-security-compliance.md)**
  - Red Hat Hybrid Cloud Console access control configuration
  - Access control strategies for meeting financial sector security requirements
  - IdP (Identity Provider) integration and MFA configuration
  - Role-based access control (RBAC) configuration
  - Audit and logging settings

## 🎯 Learning Objectives

Through this section, you will learn:

- ROSA cluster installation and initial configuration methods
- STS-based IAM role configuration and security best practices
- Central management via Red Hat Hybrid Cloud Console
- Strategies for meeting financial sector security requirements
- IdP integration and user authentication management
- Cluster auto-scaling and resource management
- ROSA cluster operations and monitoring
- Migration from on-premises OpenShift to ROSA

## 🏗️ Architecture Patterns

```mermaid
graph TB
    subgraph AWS[\"AWS Cloud\"]
        subgraph ROSA[\"ROSA Cluster\"]
            CP[\"Control Plane<br/>(Red Hat Managed)\"]
            WN[\"Worker Nodes<br/>(Customer Managed)\"]
            IN[\"Infrastructure Nodes<br/>(System Components)\"]
        end
        IAM[\"IAM Roles<br/>(STS Token Service)\"]
        VPC[\"VPC & Networking<br/>(Customer VPC)\"]
        KMS[\"KMS & Secrets<br/>(Encryption)\"]
    end
    
    subgraph RedHat[\"Red Hat\"]
        HCC[\"Hybrid Cloud Console<br/>(Central Management)\"]
        Registry[\"Quay Registry<br/>(Container Images)\"]
        OIDC[\"OIDC Provider<br/>(Authentication)\"]
    end
    
    subgraph Customer[\"Customer Environment\"]
        IdP[\"Identity Provider<br/>(Okta/Azure AD/etc)\"]
        Admin[\"Administrators<br/>(Access Management)\"]
        OnPrem[\"On-Premises Systems<br/>(Hybrid Integration)\"]
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

## 🔧 Key Technologies and Tools

| Technology | Description | Purpose |
|-----------|-------------|---------|
| **ROSA CLI** | OpenShift cluster management command-line tool | Cluster creation, management, deletion |
| **STS (Security Token Service)** | Temporary security credentials | Enhanced IAM role management |
| **OIDC** | OpenID Connect protocol | External identity provider integration |
| **OVNKubernetes** | OpenShift network plugin | High-performance networking |
| **Cluster Autoscaler** | Auto-scaling | Automatic node adjustment based on workload |
| **Hybrid Cloud Console** | Red Hat central management portal | Multi-cluster central management |
| **Quay Registry** | Container image repository | Build and deployment automation |

## 💡 Core Concepts

### ROSA Features
- **Fully Managed Service**: AWS and Red Hat jointly manage the control plane
- **High Availability**: Automatic patching and updates
- **Security**: STS-based temporary credentials, OIDC provider integration
- **Flexibility**: Full customer control over worker nodes

### STS-based Authentication Benefits
- **Temporary Credentials**: No permanent access keys required
- **Automatic Token Renewal**: Tokens renewed automatically before expiration
- **Least Privilege**: Only minimum required permissions granted
- **Audit Trail**: All access recorded in CloudTrail

### Red Hat Hybrid Cloud Console Role
- **Centralized Management**: Manage multiple clusters from one place
- **Multi-cloud Support**: Integrated management across AWS, Azure, GCP, on-premises OpenShift
- **Policy-based Management**: Central security policy enforcement
- **Cost Tracking**: Monitor cluster-specific costs

### Network Configuration
- **OVNKubernetes**: OpenVSwitch-based high-performance networking
- **Network Policy**: Full Kubernetes network policy support
- **Ingress Controller**: Built-in ingress controller
- **Service Mesh Ready**: Integrated Istio/Kiali support

## 💼 Use Cases

### Enterprise Migration
- **On-premises OpenShift → ROSA**: Migrate from existing OpenShift to ROSA
- **Reduced Management Burden**: Automated control plane operations
- **Cost Savings**: Reduced operational costs
- **Global Expansion**: Multi-region deployment

### Financial Sector Compliance
- **Security Requirements**: Advanced security with STS, OIDC, MFA
- **Access Control**: Fine-grained permission management
- **Audit Logging**: All activity recording and tracking
- **Data Protection**: KMS-based encryption

### Hybrid Cloud Strategy
- **On-premises + AWS**: Single platform management
- **Multi-cloud**: Simultaneous AWS, Azure, GCP management
- **Cloud Bursting**: Expand to cloud during peak demand
- **Disaster Recovery**: Multi-region disaster recovery strategy

## 📊 ROSA vs EKS vs On-premises OpenShift

| Item | ROSA | EKS | On-premises OpenShift |
|------|------|-----|----------------------|
| **Control Plane Management** | Red Hat/AWS | AWS | Customer Responsibility |
| **Security** | Highest | High | Configuration Required |
| **Cost** | Medium-High | Low-Medium | High Initial Investment |
| **Operational Complexity** | Low | Low | High |
| **Developer Experience** | Highest | High | Very High |
| **Deployment Speed** | Fast | Fast | Slow |
| **Hybrid Support** | Excellent | Fair | Excellent |
| **Multi-cloud** | Excellent | AWS Only | Excellent |

## 🚀 Deployment Patterns

### 1. Single Cluster Deployment
```
ROSA Cluster
├── Development Namespace
├── Staging Namespace
└── Production Namespace
```

### 2. Multi-cluster Deployment
```
Hybrid Cloud Console (Central Management)
├── AWS Region 1 (ROSA)
├── AWS Region 2 (ROSA)
├── On-Premises (OpenShift)
└── Multi-Cloud (Azure/GCP)
```

### 3. High Availability Deployment
```
Primary Region (ROSA)
├── Active Cluster
├── Replication to DR
└── Auto-failover
    └── Secondary Region (ROSA)
```

## 🔗 Related Categories

- [Hybrid Infrastructure](/docs/hybrid-infrastructure) - Hybrid environment management
- [Security & Governance](/docs/security-governance) - ROSA security architecture
- [Infrastructure Optimization](/docs/infrastructure-optimization) - Networking optimization
- [Operations & Observability](/docs/operations-observability) - Cluster monitoring

---

:::tip Tip
ROSA is a jointly managed service by AWS and Red Hat, significantly reducing the burden of control plane operations. Especially in financial or enterprise environments, ROSA's security and compliance features are highly valuable.
:::

:::info Recommended Learning Path
1. Understand ROSA basic concepts
2. Create STS-based cluster
3. IdP integration and user management
4. Leverage Hybrid Cloud Console
5. Advanced deployment patterns (multi-cluster, hybrid)
:::

:::warning Caution - Licensing
ROSA requires separate OpenShift licensing. Consider both ROSA service costs and OpenShift licensing costs in your budget.
:::

:::success Migration Tip
If planning to migrate from on-premises OpenShift to ROSA, establish a **phased migration strategy**:
1. Start with development/test environment
2. Move non-business-critical workloads
3. Build operational experience, then migrate production workloads
:::
