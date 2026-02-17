---
title: "ROSA 演示安装指南"
sidebar_label: "1. Installation Demo"
description: "ROSA 集群安装演示 - 基于 STS 的集群创建、IAM 角色配置、自动扩缩容设置及管理员访问配置指南"
tags: [rosa, openshift, installation, sts, demo, autoscaling, iam]
category: "rosa"
sidebar_position: 1
last_update:
  date: 2026-02-14
  author: devfloor9
---

# ROSA 演示安装指南

> 📅 **撰写日期**: 2025-02-05 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 2 分钟


本文档记录了 ROSA (Red Hat OpenShift Service on AWS) 集群的安装过程和结果。包括安全增强的基于 STS 的安装和自动扩缩容配置。

---

## 集群创建

### 创建命令

使用以下命令创建 ROSA 集群：

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

## 集群信息

安装完成后创建的集群详细信息如下：

| 项目 | 值 |
|------|-------|
| **名称** | rosa-demo-icn |
| **控制平面** | Customer Hosted |
| **频道组** | stable |
| **区域** | ap-northeast-2 |
| **多可用区** | false |

### 节点配置

| 节点类型 | 数量 |
|-----------|-------|
| Control Plane | 3 |
| Infra | 2 |
| Compute | 2 |

### 网络配置

| 设置 | 值 |
|---------|-------|
| **类型** | OVNKubernetes |
| **Service CIDR** | 172.30.0.0/16 |
| **Machine CIDR** | 10.0.0.0/16 |
| **Pod CIDR** | 10.128.0.0/14 |
| **Host Prefix** | /23 |

### IAM 角色 (STS)

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

### 附加配置

| 设置 | 值 |
|---------|-------|
| **EC2 Metadata Http Tokens** | optional |
| **Managed Policies** | No |
| **Private** | No |
| **User Workload Monitoring** | Enabled |

---

## 自动扩缩容配置

集群的自动扩缩容设置如下：

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

## 管理员用户配置

集群安装后创建管理员账户：

```bash
I: Admin account has been added to cluster 'rosa-demo-icn'.
I: Please securely store this generated password.
I: If you lose this password you can delete and recreate the cluster admin user.

# 登录命令
oc login https://api.rosa-demo-icn.XXXX.p1.openshiftapps.com:6443 \
  --username cluster-admin \
  --password <REDACTED>
```

:::warning 安全注意事项

- 安全存储管理员密码
- 如果密码丢失，必须删除并重新创建管理员账户
- 访问可能需要几分钟才能激活
:::

---

## 安装后步骤

安装完成后，请执行以下步骤：

### 1. 配置身份提供商

```bash
rosa create idp --help
```

### 2. 验证集群状态

```bash
rosa describe cluster -c rosa-demo-icn
```

### 3. 监控安装日志

```bash
rosa logs install -c rosa-demo-icn --watch
```

---

## 架构图

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

:::tip 提示
使用 `--sts` 选项创建 ROSA 集群可启用基于 STS 的临时凭证，增强安全性。
:::
