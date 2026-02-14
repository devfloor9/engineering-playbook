---
title: "ROSA Demo Installation Guide"
sidebar_label: "Installation Demo"
description: "ROSA cluster installation demo - STS-based cluster creation, IAM role configuration, auto-scaling setup, and admin access configuration guide"
tags: [rosa, openshift, installation, sts, demo, autoscaling, iam]
category: "rosa"
date: 2024-03-06
authors: [devfloor9]
sidebar_position: 1
---

# ROSA Demo Installation Guide

This document records the ROSA (Red Hat OpenShift Service on AWS) cluster installation process and results. It includes security-enhanced STS-based installation and auto-scaling configuration.

---

## Cluster Creation

### Creation Command

Create a ROSA cluster using the following command:

```bash
I: Creating cluster 'rosa-demo-icn'
I: To create this cluster again in the future, you can run:
rosa create cluster --cluster-name rosa-demo-icn \
  --sts \
  --create-admin-user \
  --role-arn arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Installer-Role \
  --support-role-arn arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Support-Role \
  --controlplane-iam-role arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-ControlPlane-Role \
  --worker-iam-role arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Worker-Role \
  --operator-roles-prefix rosa-oidc \
  --oidc-config-id XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --region ap-northeast-2 \
  --version 4.13.34 \
  --ec2-metadata-http-tokens optional \
  --enable-autoscaling \
  --min-replicas 2 \
  --max-replicas 2 \
  --compute-machine-type m5.xlarge \
  --machine-cidr 10.0.0.0/16 \
  --service-cidr 172.30.0.0/16 \
  --pod-cidr 10.128.0.0/14 \
  --host-prefix 23 \
  --autoscaler-balance-similar-node-groups \
  --autoscaler-log-verbosity 1 \
  --autoscaler-max-pod-grace-period 600 \
  --autoscaler-pod-priority-threshold -10 \
  --autoscaler-ignore-daemonsets-utilization \
  --autoscaler-max-nodes-total 180 \
  --autoscaler-min-cores 0 \
  --autoscaler-max-cores 11520 \
  --autoscaler-min-memory 0 \
  --autoscaler-max-memory 230400 \
  --autoscaler-scale-down-utilization-threshold 0.500000
```

---

## Cluster Information

Details of the created cluster after installation completion are as follows:

| Item | Value |
|------|-------|
| **Name** | rosa-demo-icn |
| **Control Plane** | Customer Hosted |
| **Channel Group** | stable |
| **Region** | ap-northeast-2 |
| **Multi-AZ** | false |

### Node Configuration

| Node Type | Count |
|-----------|-------|
| Control Plane | 3 |
| Infra | 2 |
| Compute | 2 |

### Network Configuration

| Setting | Value |
|---------|-------|
| **Type** | OVNKubernetes |
| **Service CIDR** | 172.30.0.0/16 |
| **Machine CIDR** | 10.0.0.0/16 |
| **Pod CIDR** | 10.128.0.0/14 |
| **Host Prefix** | /23 |

### IAM Roles (STS)

```yaml
STS Role ARN: arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Installer-Role
Support Role ARN: arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Support-Role
Instance IAM Roles:
  - Control Plane: arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-ControlPlane-Role
  - Worker: arn:aws:iam::XXXXXXXXXXXX:role/ManagedOpenShift-Worker-Role
Operator IAM Roles:
  - rosa-oidc-openshift-cluster-csi-drivers-ebs-cloud-credentials
  - rosa-oidc-openshift-cloud-network-config-controller-cloud-credentials
  - rosa-oidc-openshift-machine-api-aws-cloud-credentials
  - rosa-oidc-openshift-cloud-credential-operator-cloud-credential-operator
  - rosa-oidc-openshift-image-registry-installer-cloud-credentials
  - rosa-oidc-openshift-ingress-operator-cloud-credentials
```

### Additional Configuration

| Setting | Value |
|---------|-------|
| **EC2 Metadata Http Tokens** | optional |
| **Managed Policies** | No |
| **Private** | No |
| **User Workload Monitoring** | Enabled |

---

## Auto-scaler Configuration

The cluster's auto-scaling settings are as follows:

```yaml
autoscaler:
  balanceSimilarNodeGroups: true
  logVerbosity: 1
  maxPodGracePeriod: 600
  podPriorityThreshold: -10
  ignoreDaemonsetsUtilization: true
  maxNodesTotal: 180
  resourceLimits:
    minCores: 0
    maxCores: 11520
    minMemory: 0
    maxMemory: 230400  # GB
  scaleDownUtilizationThreshold: 0.5
```

---

## Admin User Configuration

Create admin account after cluster installation:

```bash
I: Admin account has been added to cluster 'rosa-demo-icn'.
I: Please securely store this generated password.
I: If you lose this password you can delete and recreate the cluster admin user.

# Login command
oc login https://api.rosa-demo-icn.XXXX.p1.openshiftapps.com:6443 \
  --username cluster-admin \
  --password <REDACTED>
```

:::warning Security Caution

- Store admin password securely
- If password is lost, you must delete and recreate the admin account
- Access may take several minutes to become active
:::

---

## Post-Installation Steps

After installation completion, proceed with the following steps:

### 1. Configure Identity Provider

```bash
rosa create idp --help
```

### 2. Verify Cluster Status

```bash
rosa describe cluster -c rosa-demo-icn
```

### 3. Monitor Installation Logs

```bash
rosa logs install -c rosa-demo-icn --watch
```

---

## Architecture Diagram

```mermaid
graph TB
    subgraph AWS[\"AWS Cloud (ap-northeast-2)\"]
        subgraph VPC[\"VPC (10.0.0.0/16)\"]
            subgraph CP[\"Control Plane\"]
                M1[Master 1]
                M2[Master 2]
                M3[Master 3]
            end
            subgraph Infra[\"Infra Nodes\"]
                I1[Infra 1]
                I2[Infra 2]
            end
            subgraph Workers[\"Worker Nodes (Auto-scaling)\"]
                W1[Worker 1<br/>m5.xlarge]
                W2[Worker 2<br/>m5.xlarge]
            end
        end
        IAM[IAM Roles<br/>STS-based]
        OIDC[OIDC Provider]
    end

    subgraph Network[\"Network CIDR\"]
        SC[\"Service: 172.30.0.0/16\"]
        PC[\"Pod: 10.128.0.0/14\"]
    end

    IAM --> CP
    IAM --> Workers
    OIDC --> IAM

    style CP fill:#EE0000,stroke:#232f3e
    style Workers fill:#ff9900,stroke:#232f3e
```

:::tip Tip
Using the `--sts` option when creating a ROSA cluster enables STS-based temporary credentials for enhanced security.
:::
