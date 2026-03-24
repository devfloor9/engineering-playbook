---
title: "Cross-Cluster Object Replication (HA) Architecture Guide"
sidebar_label: "Cross-Cluster Replication (HA)"
description: "Multi-cluster object replication patterns and decision guide for high availability architecture in EKS environments"
tags: [eks, multi-cluster, high-availability, gitops, argocd, flux, disaster-recovery]
category: "infrastructure"
sidebar_position: 3
last_update:
  date: 2026-03-24
  author: devfloor9
---

# Cross-Cluster Object Replication (HA) Architecture Guide

> 📅 **Created**: 2026-03-24 | **Updated**: 2026-03-24 | ⏱️ **Reading time**: ~12 min

> **📌 Reference Environment**: EKS 1.32+, ArgoCD 2.13+, Flux v2.4+, Velero 1.15+

## 1. Overview

Relying on a single EKS cluster in production environments means that cluster failure results in complete service outage. **Cross-Cluster Object Replication** is a strategy to ensure high availability by consistently replicating Kubernetes objects (ConfigMap, Secret, RBAC, CRD, NetworkPolicy, etc.) across multiple clusters.

### Current Situation

EKS does not provide a managed Cross-Cluster Object Replication feature. Therefore, you must implement it yourself by **combining open-source tools and architecture patterns**. This guide compares the pros and cons of each pattern and presents selection criteria based on workload types.

### Scope of This Guide

| Included | Excluded |
|----------|----------|
| K8s object replication (ConfigMap, Secret, CRD, RBAC, etc.) | Application data replication (DB replicas) |
| GitOps-based declarative synchronization | Service mesh-based traffic routing |
| Stateful object backup/restore (Velero) | Storage layer replication (EBS, EFS) |
| DNS failover strategy | Application-level HA patterns |

---

## 2. Multi-Cluster Architecture Pattern Comparison

There are three core patterns for implementing Cross-Cluster Object Replication.

### Pattern 1: API Proxy (Push Model)

A central routing layer directly proxies CRUD requests to each cluster's API Server.

```mermaid
graph LR
    CLIENT[Admin/CI] --> PROXY[API Proxy Layer]
    PROXY --> |CRUD Proxy| C1[Cluster A<br/>API Server]
    PROXY --> |CRUD Proxy| C2[Cluster B<br/>API Server]

    style PROXY fill:#ff9900,stroke:#cc7a00,color:#fff
    style C1 fill:#4286f4,stroke:#2a6acf,color:#fff
    style C2 fill:#4286f4,stroke:#2a6acf,color:#fff
```

- **How it works**: Central layer makes direct API calls to each cluster
- **Advantages**: Lightweight and intuitive
- **Limitations**: Weak credential security, cannot Watch multiple clusters, increasing connection complexity

### Pattern 2: Multi-cluster Controller (Kubefed Family)

A central controller monitors each cluster's state via Informer-based List-Watch and synchronizes through CRDs.

```mermaid
graph TB
    CTRL[Central Controller<br/>Kubefed / Admiralty] --> |List-Watch| C1[Cluster A]
    CTRL --> |List-Watch| C2[Cluster B]
    CTRL --> |List-Watch| C3[Cluster C]
    CRD[Federation CRDs] --> CTRL

    style CTRL fill:#ff9900,stroke:#cc7a00,color:#fff
    style CRD fill:#fbbc04,stroke:#c99603,color:#000
    style C1 fill:#4286f4,stroke:#2a6acf,color:#fff
    style C2 fill:#4286f4,stroke:#2a6acf,color:#fff
    style C3 fill:#4286f4,stroke:#2a6acf,color:#fff
```

- **How it works**: Central controller watches and synchronizes each cluster's state
- **Advantages**: Dynamic cluster discovery, Federation policy application
- **Limitations**: Watch event overflow at ~10+ clusters, Informer cache size limits, risk of plaintext credential storage

:::warning Kubefed Project Status
Kubefed (v2) in Kubernetes SIG is effectively in maintenance mode. Not recommended for new projects.
:::

### Pattern 3: Agent-based Pull Model (Recommended)

Agents in each cluster Pull the desired state from a central source (Git or hub cluster) and Reconcile locally. This follows the same principle as kubelet receiving Pod specs and executing them locally.

```mermaid
graph TB
    SOURCE[Central Source<br/>Git Repository / Hub Cluster]

    subgraph "Cluster A"
        A_AGENT[Agent<br/>Flux / ArgoCD]
        A_AGENT --> |Pull & Reconcile| A_RES[Local Resources]
    end

    subgraph "Cluster B"
        B_AGENT[Agent<br/>Flux / ArgoCD]
        B_AGENT --> |Pull & Reconcile| B_RES[Local Resources]
    end

    A_AGENT --> |Pull| SOURCE
    B_AGENT --> |Pull| SOURCE

    style SOURCE fill:#34a853,stroke:#2a8642,color:#fff
    style A_AGENT fill:#4286f4,stroke:#2a6acf,color:#fff
    style B_AGENT fill:#4286f4,stroke:#2a6acf,color:#fff
```

- **How it works**: Each cluster agent independently Pulls desired state and Reconciles locally
- **Advantages**: High scalability, Eventual Consistency, maintains local operation despite central failure
- **Limitations**: Requires agent deployment to all clusters

### Pattern Comparison Summary

| Aspect | API Proxy | Multi-cluster Controller | Agent-based Pull |
|--------|-----------|--------------------------|-------------------|
| **Operation Mode** | Central → Cluster Push | Central Watch + CRD Sync | Cluster → Central Pull |
| **Scalability** | Low (proportional to connections) | Medium (~10 clusters) | High (hundreds of clusters) |
| **Complexity** | Low | High | Medium |
| **Security** | Weak (multiple credentials) | Weak (plaintext storage) | Strong (agent local permissions) |
| **Failure Isolation** | Low | Medium | High |
| **Drift Detection** | None | Partial | Built-in |
| **Recommended Scenario** | PoC, small scale | Legacy environments | **Production (Recommended)** |

### Decision Flowchart

```mermaid
flowchart TD
    START[Cross-Cluster<br/>Object Replication Needed] --> Q1{Number of<br/>Clusters?}

    Q1 --> |2-3 clusters| Q2{Declarative<br/>Management<br/>Required?}
    Q1 --> |4+ clusters| PULL[Agent-based Pull<br/>GitOps Recommended]

    Q2 --> |Yes| PULL
    Q2 --> |No, Simple Replication| Q3{Fine-grained<br/>Object Control?}

    Q3 --> |Yes| MIRROR[Custom Controller<br/>MirrorController]
    Q3 --> |No| PROXY[API Proxy<br/>Lightweight Solution]

    PULL --> GITOPS{GitOps Tool Selection}
    GITOPS --> |Hub-Spoke Central Management| ARGO[ArgoCD<br/>Hub-and-Spoke]
    GITOPS --> |Distributed Autonomous Operation| FLUX[Flux<br/>Per-Cluster Independence]

    style START fill:#232f3e,stroke:#1a2332,color:#fff
    style PULL fill:#34a853,stroke:#2a8642,color:#fff
    style ARGO fill:#4286f4,stroke:#2a6acf,color:#fff
    style FLUX fill:#4286f4,stroke:#2a6acf,color:#fff
    style MIRROR fill:#fbbc04,stroke:#c99603,color:#000
    style PROXY fill:#ff9900,stroke:#cc7a00,color:#fff
```

---

## 3. Recommended Approach Architectures

### Option A: GitOps (Flux / ArgoCD) — Recommended for Most Use Cases

Use a Git repository as the Single Source of Truth, and have each cluster's GitOps agent independently Pull & Reconcile.

```mermaid
graph TB
    subgraph "Git Repository (Single Source of Truth)"
        GIT[K8s Manifests<br/>ConfigMap, Secret, RBAC,<br/>CRD, NetworkPolicy]
    end

    subgraph "Cluster A (ap-northeast-2a)"
        A_FLUX[Flux / ArgoCD Agent]
        A_RES[Reconciled Resources]
        A_FLUX --> A_RES
    end

    subgraph "Cluster B (ap-northeast-2c)"
        B_FLUX[Flux / ArgoCD Agent]
        B_RES[Reconciled Resources]
        B_FLUX --> B_RES
    end

    GIT --> |Pull| A_FLUX
    GIT --> |Pull| B_FLUX

    style GIT fill:#34a853,stroke:#2a8642,color:#fff
    style A_FLUX fill:#4286f4,stroke:#2a6acf,color:#fff
    style B_FLUX fill:#4286f4,stroke:#2a6acf,color:#fff
```

**Key Benefits:**

- **Drift Detection**: Automatically detects and recovers when cluster state differs from Git
- **Audit Trail**: All change history preserved as Git commits
- **Declarative Management**: Define desired state and agents Reconcile
- **Failure Isolation**: Agent failure in one cluster doesn't affect other clusters

**Active-Active Configuration:**

Both clusters independently Pull from the same Git repository. DNS (Route 53) distributes traffic, and when one cluster fails, the remaining cluster immediately handles all traffic.

**Active-Passive Configuration:**

Only the Active cluster enables the GitOps agent. The Passive cluster keeps its agent in Suspended state and activates it during failover.

### Option B: ArgoCD Hub-and-Spoke Model

Install ArgoCD on a Management Cluster and deploy to multiple workload clusters via ApplicationSets.

```mermaid
graph TB
    subgraph "Management Cluster"
        ARGO[ArgoCD Server]
        APPSET[ApplicationSets]
        APPSET --> ARGO
    end

    subgraph "Workload Cluster A"
        WA[Replicated Objects]
    end

    subgraph "Workload Cluster B"
        WB[Replicated Objects]
    end

    ARGO --> |Deploy| WA
    ARGO --> |Deploy| WB

    style ARGO fill:#ff9900,stroke:#cc7a00,color:#fff
    style APPSET fill:#fbbc04,stroke:#c99603,color:#000
    style WA fill:#4286f4,stroke:#2a6acf,color:#fff
    style WB fill:#4286f4,stroke:#2a6acf,color:#fff
```

**HA Configuration Strategies:**

| Strategy | Description | Suitable Scenario |
|----------|-------------|-------------------|
| **Active-Passive Mirroring** | Deploy ArgoCD in two regions, disable controller in Passive. Manual Scale-Up during failover | Environments with low DR requirements |
| **Active-Active Sync Windows** | Two ArgoCD instances Sync in non-overlapping time windows (Sync Windows feature) | Active-Active requiring conflict prevention |

:::info ApplicationSets Generator
Using ArgoCD ApplicationSets' `Cluster Generator`, you can automatically deploy applications to all clusters registered with ArgoCD. Replication starts immediately when a new cluster is added without additional configuration.
:::

### Option C: Custom Controller (MirrorController Pattern)

When fine-grained control over object replication is needed, develop a dedicated controller to manage synchronization between source and target clusters.

**Application Scenarios:**

- Selective replication of objects with specific Labels/Annotations only
- Object transformation needed during replication (e.g., Namespace changes, field modifications)
- Custom conflict resolution logic implementation required

**Pros and Cons:**

| Advantages | Disadvantages |
|------------|---------------|
| Clear separation of concerns | Additional operational overhead |
| Reduced core logic complexity | Potential synchronization delays |
| Fine-grained replication policy control | Increased debugging complexity |
| Customizable conflict resolution | Direct development/maintenance required |

---

## 4. Active-Active vs Active-Passive Decision

### Comparison Table

| Aspect | Active-Active | Active-Passive |
|--------|---------------|----------------|
| **Object Synchronization** | Both clusters Pull independently from same Git source | Only Active Reconciles, Passive waits |
| **Failover Time** | Near zero (both already serving) | Few minutes (Passive activation needed) |
| **Conflict Resolution** | Write conflicts possible — prevent with Sync Windows, etc. | No conflicts — single Writer |
| **Operational Complexity** | High (object IDs, DNS, state sync) | Low (standard failover model) |
| **Cost** | High (both operate at full capacity) | Low (Passive can run at reduced capacity) |
| **Suitable Scenario** | Multi-region HA, global load balancing | DR, cost-sensitive HA |

### Recommended Mode by Workload Type

```mermaid
graph LR
    subgraph "Workload Type"
        SL[Stateless<br/>API, Web]
        SF[Stateful<br/>DB, Cache]
        AI[AI/ML Inference<br/>vLLM, TGI]
    end

    subgraph "Recommended Mode"
        AA[Active-Active<br/>GitOps + Route 53]
        AP[Active-Passive<br/>GitOps + Velero]
        AAM[Active-Active<br/>GitOps + S3 Model Sync]
    end

    SL --> AA
    SF --> AP
    AI --> AAM

    style SL fill:#34a853,stroke:#2a8642,color:#fff
    style SF fill:#fbbc04,stroke:#c99603,color:#000
    style AI fill:#4286f4,stroke:#2a6acf,color:#fff
    style AA fill:#34a853,stroke:#2a8642,color:#fff
    style AP fill:#fbbc04,stroke:#c99603,color:#000
    style AAM fill:#4286f4,stroke:#2a6acf,color:#fff
```

---

## 5. Supporting Tool Stack

Object replication alone cannot achieve complete Cross-Cluster HA. Combine the following tools to build the full stack.

| Tool | Role | Notes |
|------|------|-------|
| **Flux / ArgoCD** | K8s object replication (GitOps) | Core replication mechanism |
| **Route 53** | DNS-based failover/load balancing | Health Check + Failover Routing |
| **Global Accelerator** | Anycast IP-based global routing | For multi-region Active-Active |
| **Velero** | Stateful object backup/restore (PV, etcd) | Integrates with S3 Cross-Region Replication |
| **External Secrets Operator** | Secret synchronization | AWS Secrets Manager → Both clusters |
| **Crossplane / ACK** | AWS resource definition sync | Manage IaC as K8s objects |

### Tool Combination Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        GIT[Git Repository<br/>K8s Manifests]
        SM[AWS Secrets Manager]
        S3[S3 + Cross-Region<br/>Replication]
        R53[Route 53<br/>Health Checks]
    end

    subgraph "Cluster A"
        A_GITOPS[GitOps Agent] --> A_K8S[K8s Objects]
        A_ESO[External Secrets<br/>Operator] --> A_SEC[Secrets]
        A_VELERO[Velero] --> A_BACKUP[Backup to S3]
    end

    subgraph "Cluster B"
        B_GITOPS[GitOps Agent] --> B_K8S[K8s Objects]
        B_ESO[External Secrets<br/>Operator] --> B_SEC[Secrets]
        B_VELERO[Velero] --> B_RESTORE[Restore from S3]
    end

    GIT --> A_GITOPS
    GIT --> B_GITOPS
    SM --> A_ESO
    SM --> B_ESO
    A_BACKUP --> S3
    S3 --> B_RESTORE
    R53 --> |Failover| A_K8S
    R53 --> |Failover| B_K8S

    style GIT fill:#34a853,stroke:#2a8642,color:#fff
    style SM fill:#ff9900,stroke:#cc7a00,color:#fff
    style S3 fill:#ff9900,stroke:#cc7a00,color:#fff
    style R53 fill:#ff9900,stroke:#cc7a00,color:#fff
```

---

## 6. Current Limitations and Future Outlook

There are features in EKS multi-cluster management that are not yet provided as managed services.

| Area | Current Status | Alternative |
|------|----------------|-------------|
| **Managed ClusterSets** | Not released | Group cross-account with RAM (Resource Access Manager) |
| **Built-in Cross-Cluster Replication** | Not released | GitOps (Flux/ArgoCD) |
| **Multi-Region EKS Cluster** | Not released | Independent cluster per region + GitOps sync |
| **Managed ArgoCD** | In development | Self-install/operate ArgoCD |

:::tip Practical Approach
Until these features are released, the GitOps + supporting tool stack combination is the most mature and proven approach. Approximately 10% of EKS customers have already adopted Flux/ArgoCD-based GitOps.
:::

---

## 7. Production Recommended Combination

Final recommended tool combination to eliminate single cluster dependency.

| Purpose | Recommended Tool | Configuration Method |
|---------|------------------|----------------------|
| **K8s Object Replication** | GitOps (Flux or ArgoCD) | Both clusters Pull from same Git repo |
| **Stateful Data Protection** | Velero + S3 Cross-Region Replication | Regular backup + cross-region replication |
| **Secret Synchronization** | External Secrets Operator | AWS Secrets Manager as shared source |
| **DNS Failover** | Route 53 Health Checks | Active-Active or Failover Routing |
| **CRD/Custom Resources** | Include in GitOps repo | Manage like standard K8s objects |
| **AWS Resource Definitions** | Crossplane or ACK | Synchronize IaC K8s-natively |

### Implementation Priority

1. **P0**: Deploy GitOps agents + Design Git repo structure
2. **P1**: Configure External Secrets Operator + Route 53 Health Check
3. **P2**: Establish Velero backup policy + S3 Cross-Region Replication
4. **P3**: Synchronize AWS resources with Crossplane/ACK (if needed)

---

## 8. Related Documentation

- [EKS High Availability Architecture Guide](/docs/operations-observability/eks-resiliency-guide) — Response strategies by Failure Domain layer
- [GitOps-based Cluster Operations](/docs/operations-observability/gitops-cluster-operation) — Flux/ArgoCD operations guide

---

## 9. References

- [ArgoCD ApplicationSets](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/) — Multi-cluster automated deployment
- [ArgoCD Sync Windows](https://argo-cd.readthedocs.io/en/stable/user-guide/sync_windows/) — Active-Active conflict prevention
- [Flux Multi-Tenancy](https://fluxcd.io/flux/guides/repository-structure/) — Multi-cluster repo structure
- [Velero Documentation](https://velero.io/docs/) — Cluster backup/restore
- [External Secrets Operator](https://external-secrets.io/) — External secret synchronization
- [Crossplane](https://www.crossplane.io/) — K8s native IaC
- [AWS Route 53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-creating.html) — DNS failover
