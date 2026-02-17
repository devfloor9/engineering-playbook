---
title: "EKS Hybrid Nodes 完整指南"
sidebar_label: "1. Hybrid Nodes Complete Guide"
description: "Amazon EKS Hybrid Nodes 采用完整指南：架构、配置、网络、DNS、GPU 服务器、成本分析和动态资源分配 (DRA)"
tags: [eks, hybrid-nodes, nodeadm, kubernetes, harbor, networking, dns, gpu, dra, cost-optimization, architecture]
category: "hybrid-multicloud"
sidebar_position: 1
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Hybrid Nodes 完整指南

> 📅 **撰写日期**: 2025-08-20 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 6 分钟

## 目录

1. [概述](#概述)
2. [前提条件](#前提条件)
3. [网络与 DNS 配置](#网络与-dns-配置)
4. [Harbor 私有镜像仓库安装](#harbor-私有镜像仓库安装)
5. [EKS Hybrid Nodes 配置](#eks-hybrid-nodes-配置)
6. [Harbor 与 EKS 集成](#harbor-与-eks-集成)
7. [GPU 服务器集成](#gpu-服务器集成)
8. [成本分析与优化](#成本分析与优化)
9. [动态资源分配 (DRA)](#动态资源分配-dra)
10. [运维与维护](#运维与维护)

## 概述

本指南提供了 Amazon EKS Hybrid Nodes 的完整采用方法。EKS Hybrid Nodes 于 2024 年 12 月正式发布，支持将本地基础设施与 AWS EKS 进行统一管理，允许在单个 Kubernetes 集群内管理高性能 GPU 服务器和云资源。

**主要特性：**

- 本地与云端统一管理
- Harbor 2.13 私有镜像仓库集成
- H100 GPU 服务器支持
- 动态资源分配 (DRA)
- 灵活的工作负载调度

## 前提条件

### 系统要求

**本地节点：**

- 操作系统：Ubuntu 20.04/22.04/24.04 LTS 或 RHEL 8/9
- Docker Engine 20.10.10+（用于 Harbor）
- 容器运行时：containerd 1.6.x 或更高版本
- 最低硬件要求：2 CPU 核心，4GB RAM

**GPU 服务器（可选）：**

- NVIDIA 驱动 550.x 或更高版本
- NVIDIA Container Toolkit
- H100/H200 GPU 支持

### 网络要求

| 项目 | 要求 |
|------|------|
| 带宽 | 最低 10Gbps（Direct Connect 或 VPN） |
| 延迟 | 建议 5ms 以下 |
| MTU | 建议 Jumbo Frame (9000) |

## 网络与 DNS 配置

### 所需防火墙设置

配置本地与 AWS 之间所需的防火墙端口：

| 协议 | 端口 | 方向 | 用途 |
|------|------|------|------|
| TCP | 443 | 双向 | Kubernetes API 服务器通信 |
| TCP | 10250 | 本地 → AWS | Kubelet API |
| TCP/UDP | 53 | 双向 | DNS 查询 |
| TCP | 6443 | 本地 → AWS | Kubernetes API（备选） |

### Pod CIDR 防火墙配置

:::tip 建议
建议在防火墙中注册整个 Pod CIDR 范围。
:::

**配置方法：**

- **完整 CIDR 注册（推荐）**：例如 `10.244.0.0/16`
  - 灵活适应动态 Pod IP 分配
  - Pod 扩展时无需额外防火墙设置
  - 降低管理复杂度

- **仅固定 IP Worker 节点（不推荐）**：
  - 每当 Pod IP 变更时需更新防火墙规则
  - 增加运维复杂度
  - 增加服务中断风险

### Istio + Calico CNI 混合模式

同时使用 Istio 服务网格和 Calico CNI 时的额外端口配置：

| 组件 | 端口 | 用途 |
|------|------|------|
| Envoy Proxy | 15001 | 出站流量 |
| Envoy Proxy | 15006 | 入站流量 |
| Pilot | 15010 | xDS 服务器 |
| Istio Telemetry | 15004 | Mixer 策略 |
| Calico BGP | 179 | BGP 对等 |
| Calico Felix | 9099 | 指标 |

```bash
# 防火墙规则示例（AWS Security Group）
aws ec2 authorize-security-group-ingress \
  --group-id sg-hybrid-nodes \
  --protocol tcp \
  --port 15001 \
  --source-group sg-eks-cluster

aws ec2 authorize-security-group-ingress \
  --group-id sg-hybrid-nodes \
  --protocol tcp \
  --port 179 \
  --source-group sg-hybrid-nodes
```

### DNS 配置

#### Route 53 Resolver Inbound Endpoint（本地 → AWS）

**用途**：使本地服务器能够查询 AWS 内部域名

```bash
# 创建 Route 53 Resolver Inbound Endpoint
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-123 \
  --name hybrid-inbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction INBOUND \
  --ip-addresses SubnetId=subnet-xxxxx,Ip=10.0.1.100 \
              SubnetId=subnet-yyyyy,Ip=10.0.2.100
```

**本地 DNS 配置（示例：BIND）：**

```bash
# /etc/named.conf
zone "eks.amazonaws.com" {
    type forward;
    forward only;
    forwarders { 10.0.1.100; 10.0.2.100; };
};
```

#### Route 53 Resolver Outbound Endpoint（AWS → 本地）

**用途**：使 AWS Worker 节点能够查询本地内部域名

```bash
# 创建 Outbound Endpoint
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-456 \
  --name hybrid-outbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction OUTBOUND \
  --ip-addresses SubnetId=subnet-xxxxx \
              SubnetId=subnet-yyyyy

# 创建 Resolver 规则
aws route53resolver create-resolver-rule \
  --creator-request-id unique-id-789 \
  --name on-prem-dns-rule \
  --rule-type FORWARD \
  --domain-name company.local \
  --target-ips Ip=192.168.1.53,Port=53 Ip=192.168.1.54,Port=53 \
  --resolver-endpoint-id rslvr-out-xxxxx
```

#### 双向 DNS 查询验证

```bash
# 从本地查询 AWS 域名
dig @10.0.1.100 my-service.eks.amazonaws.com

# 从 AWS 查询本地域名
dig harbor.company.local
```

### CIDR 设计

#### CIDR 设计原则

**AWS VPC CIDR：**

- 主要：`10.0.0.0/16`（65,536 个 IP）
- 辅助（如需要）：`10.1.0.0/16`

**本地 CIDR：**

- 现有网络：`192.168.0.0/16`
- Pod CIDR：`10.244.0.0/16`
- Service CIDR：`10.96.0.0/16`

**防止地址重叠：**

```bash
# 检查 CIDR 重叠
aws ec2 describe-vpcs --query 'Vpcs[*].CidrBlock'
# 检查本地路由表
ip route show
```

#### 路由配置

```bash
# 创建 AWS Transit Gateway
aws ec2 create-transit-gateway \
  --description "Hybrid connectivity" \
  --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=enable

# 创建 VPN 连接
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-xxxxx \
  --transit-gateway-id tgw-xxxxx \
  --options TunnelInsideIpVersion=ipv4,TunnelOptions=[{TunnelInsideCidr=169.254.10.0/30}]
```

## Harbor 私有镜像仓库安装

### 下载 Harbor 2.13.2

```bash
# 下载 Harbor 2.13.2（最新稳定版）
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# 解压归档文件
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### SSL/TLS 证书配置

#### 生成自签名证书

```bash
# 1. 生成 CA 证书
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrganization/CN=Harbor-CA"

# 2. 生成服务器证书
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrganization/CN=harbor.yourdomain.com"

# 3. 创建 v3.ext 文件（SAN 配置）
cat > v3.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.yourdomain.com
DNS.2=yourdomain.com
IP.1=192.168.1.100
EOF

# 4. 签署证书
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

# 5. 创建证书目录并复制文件
mkdir -p /data/cert
cp harbor.crt /data/cert/
cp harbor.key /data/cert/
```

### Harbor 配置文件设置

```bash
# 复制并编辑 harbor.yml 文件
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

关键配置内容：

```yaml
# 主机名设置
hostname: harbor.yourdomain.com

# HTTPS 配置
https:
  port: 443
  certificate: /data/cert/harbor.crt
  private_key: /data/cert/harbor.key

# Harbor 管理员密码
harbor_admin_password: Harbor12345!

# 数据库配置
database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0

# 数据存储路径
data_volume: /data

# 日志配置
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor

# Trivy 漏洞扫描器配置
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  insecure: false

# 指标配置
metric:
  enabled: true
  port: 9090
  path: /metrics
```

### Harbor 安装

```bash
# 运行安装准备脚本
sudo ./prepare

# 安装 Harbor（包含 Trivy）
sudo ./install.sh --with-trivy

# 验证安装
docker-compose ps
```

### 创建 Robot 账户

```bash
# 通过 Harbor UI 创建或使用 API
curl -X POST "https://harbor.yourdomain.com/api/v2.0/robots" \
  -H "Content-Type: application/json" \
  -u "admin:Harbor12345!" \
  -d '{
    "name": "k8s-robot",
    "duration": 365,
    "description": "Robot account for Kubernetes",
    "disable": false,
    "level": "system",
    "permissions": [
      {
        "namespace": "*",
        "kind": "project",
        "access": [
          {
            "resource": "repository",
            "action": "pull"
          }
        ]
      }
    ]
  }'
```

## EKS Hybrid Nodes 配置

### 安装 nodeadm

```bash
# x86_64 架构
curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/amd64/nodeadm'

# ARM 架构（如需要）
# curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/arm64/nodeadm'

# 授予执行权限
chmod +x nodeadm
sudo mv nodeadm /usr/local/bin/

# 验证版本
nodeadm version
```

### 安装所需组件

```bash
# 安装 Kubernetes 1.33 支持组件
sudo nodeadm install 1.33 --credential-provider ssm

# 或使用 IAM Roles Anywhere 时
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### 创建 NodeConfig 文件

```yaml
# nodeconfig.yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: ap-northeast-2

  # 使用 SSM 的混合节点配置
  hybrid:
    ssm:
      activationCode: "YOUR-ACTIVATION-CODE"
      activationId: "YOUR-ACTIVATION-ID"

  # Containerd 配置（Harbor 镜像仓库设置）
  containerd:
    config: |
      version = 2

      [plugins."io.containerd.grpc.v1.cri"]
        [plugins."io.containerd.grpc.v1.cri".registry]
          config_path = "/etc/containerd/certs.d:/etc/docker/certs.d"

        [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
          [plugins."io.containerd.grpc.v1.cri".registry.mirrors."harbor.yourdomain.com"]
            endpoint = ["https://harbor.yourdomain.com"]

        [plugins."io.containerd.grpc.v1.cri".registry.configs]
          [plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.yourdomain.com"]
            [plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.yourdomain.com".auth]
              username = "robot$k8s-robot"
              password = "YOUR-ROBOT-TOKEN"

            [plugins."io.containerd.grpc.v1.cri".registry.configs."harbor.yourdomain.com".tls]
              ca_file = "/etc/ssl/certs/harbor-ca.crt"
              insecure_skip_verify = false

  # Kubelet 配置
  kubelet:
    config:
      shutdownGracePeriod: 30s
      maxPods: 110
    flags:
      - --node-labels=node-type=hybrid,registry=harbor
```

### 安装证书

```bash
# 将 CA 证书添加到系统信任存储
sudo cp ca.crt /usr/local/share/ca-certificates/harbor-ca.crt
sudo update-ca-certificates

# 为 containerd 创建证书目录
sudo mkdir -p /etc/containerd/certs.d/harbor.yourdomain.com

# 复制证书
sudo cp ca.crt /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt

# 重启 containerd
sudo systemctl restart containerd
```

### 节点初始化

```bash
# 使用 NodeConfig 初始化节点
sudo nodeadm init --config-source file://nodeconfig.yaml

# 验证节点状态
kubectl get nodes
```

## Harbor 与 EKS 集成

### 网络配置

```bash
# 允许 EKS 节点访问 Harbor 安全组
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

### CoreDNS 配置

```yaml
# 修改 CoreDNS ConfigMap
kubectl edit configmap coredns -n kube-system

# 添加以下内容
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
        }
        # 添加 Harbor DNS
        hosts {
          192.168.1.100 harbor.yourdomain.com
          fallthrough
        }
        prometheus :9153
        forward . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    }
```

### 创建 Kubernetes Secret

```bash
# 测试 docker 登录
docker login harbor.yourdomain.com
Username: robot$k8s-robot
Password: YOUR-ROBOT-TOKEN

# 创建 Kubernetes Secret
kubectl create secret docker-registry harbor-registry \
  --docker-server=harbor.yourdomain.com \
  --docker-username='robot$k8s-robot' \
  --docker-password='YOUR-ROBOT-TOKEN' \
  --docker-email=admin@yourdomain.com

# 将 Secret 复制到所有命名空间（可选）
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get secret harbor-registry -o yaml | \
    sed "s/namespace: default/namespace: $ns/" | \
    kubectl apply -f -
done
```

### 测试与验证

```bash
# 1. 验证网络连通性
curl -k https://harbor.yourdomain.com/api/v2.0/health

# 2. 直接从节点测试镜像拉取
sudo crictl pull harbor.yourdomain.com/library/nginx:latest

# 3. 测试 Kubernetes Pod 部署
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: harbor-test
spec:
  containers:
  - name: nginx
    image: harbor.yourdomain.com/library/nginx:latest
  imagePullSecrets:
  - name: harbor-registry
EOF

# 4. 验证 Pod 状态
kubectl get pod harbor-test
kubectl describe pod harbor-test
```

## GPU 服务器集成

### H100 GPU 服务器集成

**验证目标**：将 10 台 H100 GPU 服务器作为 EKS Hybrid Nodes 接入

#### GPU 节点配置

```yaml
# nodeconfig-gpu.yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: gpu-hybrid-cluster
    region: ap-northeast-2

  hybrid:
    ssm:
      activationCode: "ACTIVATION-CODE"
      activationId: "ACTIVATION-ID"

  kubelet:
    config:
      maxPods: 110
      shutdownGracePeriod: 30s
    flags:
      - --node-labels=node-type=hybrid,gpu=h100,gpu-count=8
      - --register-with-taints=nvidia.com/gpu=present:NoSchedule

  containerd:
    config: |
      version = 2
      [plugins."io.containerd.grpc.v1.cri".containerd]
        default_runtime_name = "nvidia"
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia]
          privileged_without_host_devices = false
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia.options]
            BinaryName = "/usr/bin/nvidia-container-runtime"
```

#### 部署 NVIDIA Device Plugin

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.5/nvidia-device-plugin.yml

# 验证 GPU 资源
kubectl get nodes -o json | jq '.items[].status.allocatable."nvidia.com/gpu"'
```

#### GPU 测试

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test
spec:
  restartPolicy: Never
  containers:
  - name: cuda
    image: nvidia/cuda:12.3.0-base-ubuntu22.04
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: 1
  nodeSelector:
    gpu: h100
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
```

### 本地存储访问

#### NFS 挂载测试

```bash
# 在 AWS Worker 节点上运行
sudo mount -t nfs -o vers=4.1,rsize=1048576,wsize=1048576 \
  192.168.1.100:/export/data /mnt/onprem-storage

# 性能测量
dd if=/dev/zero of=/mnt/onprem-storage/testfile bs=1M count=1000 oflag=direct
```

#### PersistentVolume 配置

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: onprem-storage-pv
spec:
  capacity:
    storage: 10Ti
  accessModes:
    - ReadWriteMany
  nfs:
    server: 192.168.1.100
    path: /export/data
  mountOptions:
    - vers=4.1
    - rsize=1048576
    - wsize=1048576
    - hard
    - timeo=600
    - retrans=2
```

## 成本分析与优化

### Hybrid Nodes 定价结构

**基础定价（2025 年 2 月）：**

- 每 vCPU：$0.1099/小时
- 按每月 730 小时计算：约 $80.23/vCPU

### H100 GPU 服务器成本分析

**H100 GPU 服务器规格（基于 DGX H200）：**

- CPU：224 vCPU（2x Intel Xeon Platinum 8592+）
- RAM：2TB
- GPU：8x H200（141GB HBM3e）

**月度成本计算：**

```
单节点：
- 224 vCPU × $80.23 = $17,971.52/月

10 节点：
- $17,971.52 × 10 = $179,715.20/月
```

:::warning 需要审查成本优化
由于 H100 GPU 服务器的 vCPU 数量较多，Hybrid Nodes 成本相当可观。请审查以下优化方法：

1. **选择性工作负载调度**：仅将 GPU 密集型工作负载放置在 Hybrid Nodes 上
2. **Spot 实例混合使用**：为 AWS Worker 利用 Spot 实例
3. **自动扩缩容**：在非使用时段移除节点
4. **预留容量**：针对长期使用协商预留选项
:::

### 成本降低策略

#### 1. 混合工作负载分布

```yaml
# GPU 工作负载 → 本地
apiVersion: v1
kind: Pod
metadata:
  name: gpu-training
spec:
  nodeSelector:
    gpu: h100
    node-type: hybrid
  containers:
  - name: training
    image: pytorch/pytorch:2.1-cuda12.1
    resources:
      limits:
        nvidia.com/gpu: 8

---
# CPU 工作负载 → AWS EC2
apiVersion: v1
kind: Pod
metadata:
  name: web-api
spec:
  nodeSelector:
    eks.amazonaws.com/compute-type: ec2
  containers:
  - name: api
    image: nginx:latest
```

#### 2. Cluster Autoscaler 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
      - name: cluster-autoscaler
        image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
        command:
          - ./cluster-autoscaler
          - --cloud-provider=aws
          - --skip-nodes-with-system-pods=false
          - --expander=least-waste
          - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled
```

#### 3. 成本监控

```bash
# 使用 AWS Cost Explorer API 跟踪 Hybrid Nodes 成本
aws ce get-cost-and-usage \
  --time-period Start=2025-02-01,End=2025-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json

# filter.json
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Elastic Kubernetes Service - Hybrid Nodes"]
  }
}
```

### 工作负载分布策略

**本地 GPU Worker：**

- AI/ML 训练工作负载
- 高性能推理服务
- 数据密集型处理

**AWS CPU Worker：**

- Web 应用和 API
- 微服务
- 轻量级批处理任务

## 动态资源分配 (DRA)

:::info 什么是 DRA？
动态资源分配 (DRA) 是 Kubernetes 1.26 引入的功能，使 Pod 能够在请求时动态分配 GPU、NPU 和专用加速器等资源。这改进了传统的静态资源分配方法，实现了更高效的资源利用。
:::

### 启用 DRA

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: hybrid-dra-cluster
  region: ap-northeast-2
  version: "1.30"

kubernetesNetworkConfig:
  serviceIPv4CIDR: 10.100.0.0/16

managedNodeGroups:
  - name: cpu-nodes
    instanceType: m5.xlarge
    desiredCapacity: 3
    minSize: 1
    maxSize: 10
    labels:
      node-type: cpu
      workload: general

  - name: gpu-nodes
    instanceType: g5.xlarge
    desiredCapacity: 2
    minSize: 1
    maxSize: 5
    labels:
      node-type: gpu
      workload: ml
    taints:
      - key: nvidia.com/gpu
        value: "true"
        effect: NoSchedule
```

### 部署 DRA 驱动

```bash
# 添加 DRA 驱动 Helm 仓库
helm repo add dra-driver https://charts.dra.io
helm repo update

# 安装 DRA 驱动
helm install dra-driver dra-driver/dra-driver \
  --namespace kube-system \
  --set driver.name=eks-hybrid-dra \
  --set driver.enableGPU=true \
  --set driver.enableCPU=true
```

### 定义资源类

```yaml
apiVersion: resource.k8s.io/v1alpha2
kind: ResourceClass
metadata:
  name: gpu-compute-class
spec:
  driverName: eks-hybrid-dra
  suitableNodes:
    nodeSelectorTerms:
    - matchExpressions:
      - key: node-type
        operator: In
        values: ["gpu"]
  parametersRef:
    name: gpu-parameters
    namespace: kube-system
---
apiVersion: resource.k8s.io/v1alpha2
kind: ResourceClass
metadata:
  name: cpu-compute-class
spec:
  driverName: eks-hybrid-dra
  suitableNodes:
    nodeSelectorTerms:
    - matchExpressions:
      - key: node-type
        operator: In
        values: ["cpu"]
  parametersRef:
    name: cpu-parameters
    namespace: kube-system
```

### 配置资源声明

```yaml
apiVersion: resource.k8s.io/v1alpha2
kind: ResourceClaimTemplate
metadata:
  name: ml-training-claim
  namespace: ml-workloads
spec:
  spec:
    resourceClassName: gpu-compute-class
    allocationMode: WaitForFirstConsumer
    parametersRef:
      name: ml-training-params
      namespace: ml-workloads
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-training-params
  namespace: ml-workloads
data:
  gpu-count: "1"
  gpu-memory: "16Gi"
  cuda-version: "12.2"
```

### ML 训练作业示例

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ml-training-job
  namespace: ml-workloads
spec:
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      resourceClaims:
      - name: gpu-resource
        source:
          resourceClaimTemplateName: ml-training-claim
      containers:
      - name: training
        image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
        command: ["python", "train.py"]
        resources:
          claims:
          - name: gpu-resource
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0"
      restartPolicy: OnFailure
      tolerations:
      - key: nvidia.com/gpu
        operator: Equal
        value: "true"
        effect: NoSchedule
```

### DRA 监控

:::tip 关键指标
监控以下关键指标以评估 DRA 性能：

- `dra_allocation_duration_seconds` - 资源分配耗时
- `dra_allocation_errors_total` - 分配失败次数
- `dra_resource_utilization_ratio` - 资源使用效率
- `dra_pending_claims_total` - 未调度的资源声明
:::

## 运维与维护

### 安全加固

```bash
# 启用 Harbor 漏洞扫描自动化
curl -X PUT "https://harbor.yourdomain.com/api/v2.0/projects/1" \
  -H "Content-Type: application/json" \
  -u "admin:Harbor12345!" \
  -d '{
    "metadata": {
      "auto_scan": "true",
      "prevent_vul": "true",
      "severity": "high"
    }
  }'

# 配置镜像签名策略（Notary）
export DOCKER_CONTENT_TRUST=1
export DOCKER_CONTENT_TRUST_SERVER=https://harbor.yourdomain.com:4443
```

### 备份与恢复

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. 备份 Harbor 配置
cp -r /data/harbor $BACKUP_DIR/

# 2. 备份数据库
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. 备份镜像仓库数据（可选）
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "备份完成: $BACKUP_DIR"
```

### 监控

#### Prometheus 指标采集

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'harbor'
      static_configs:
      - targets: ['harbor.yourdomain.com:9090']
      metrics_path: '/metrics'
```

#### 关键监控指标

- 镜像仓库请求速率
- 认证失败次数
- 存储使用量
- 数据库连接数
- API 响应时间

### 性能验证

#### Direct Connect 性能测试

```bash
# 1. 基础连通性测试
ping -c 100 <aws-endpoint>

# 2. 检查 MTU 优化
ping -M do -s 8972 <aws-endpoint>

# 3. 路由跟踪
traceroute -n <aws-endpoint>

# 4. 带宽测量
iperf3 -c <aws-endpoint> -t 60 -P 10 -w 512K
```

#### 性能基准

| 指标 | 目标值 | 告警值 | 严重值 |
|------|--------|--------|--------|
| 延迟 | < 5ms | 5-10ms | > 10ms |
| 抖动 | < 2ms | 2-5ms | > 5ms |
| 丢包率 | < 0.01% | 0.01-0.1% | > 0.1% |
| 带宽 | > 10Gbps | 5-10Gbps | < 5Gbps |

### 故障排除

#### ImagePullBackOff 错误

```bash
# 诊断问题
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# 检查 Secret
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d
```

#### 证书错误

```bash
# 在所有节点上安装 CA 证书
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: harbor-ca-installer
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: harbor-ca-installer
  template:
    metadata:
      labels:
        name: harbor-ca-installer
    spec:
      hostNetwork: true
      hostPID: true
      containers:
      - name: installer
        image: busybox
        command: ['sh', '-c']
        args:
        - |
          echo "Installing Harbor CA certificate..."
          cp /ca-cert/ca.crt /host/usr/local/share/ca-certificates/harbor-ca.crt
          chroot /host update-ca-certificates
          chroot /host systemctl restart containerd
          sleep 3600
        volumeMounts:
        - name: ca-cert
          mountPath: /ca-cert
        - name: host
          mountPath: /host
        securityContext:
          privileged: true
      volumes:
      - name: ca-cert
        configMap:
          name: harbor-ca
      - name: host
        hostPath:
          path: /
EOF
```

#### DNS 解析失败

```bash
# 测试 DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# 检查 CoreDNS 日志
kubectl logs -n kube-system -l k8s-app=kube-dns

# 重启 CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

## 结论

EKS Hybrid Nodes 提供了跨本地与云端的统一 Kubernetes 环境。本指南涵盖的关键成功因素：

1. **正确的网络配置**：完整的 Pod CIDR 防火墙注册和双向 DNS 配置
2. **证书管理**：使用自签名证书时，需在所有节点上安装 CA 证书
3. **成本优化**：根据工作负载特性建立混合分布策略
4. **动态资源分配**：使用 DRA 实现高效的 GPU 资源管理
5. **持续验证**：通过分步测试进行配置验证

在采用前，优先审查以下事项：

- 通过 Direct Connect 确保安全的低延迟连接
- H100 GPU 服务器高 vCPU 成本优化策略
- 通过 PoC 验证实际环境的性能和稳定性

---

### 参考资料

- [Amazon EKS Hybrid Nodes 官方文档](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes.html)
- [EKS Hybrid Nodes 定价](https://aws.amazon.com/eks/pricing/)
- [Harbor 2.13 发行说明](https://github.com/goharbor/harbor/releases/tag/v2.13.2)
- [Kubernetes DRA KEP](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/3063-dynamic-resource-allocation)
- [NVIDIA GPU Operator 文档](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
