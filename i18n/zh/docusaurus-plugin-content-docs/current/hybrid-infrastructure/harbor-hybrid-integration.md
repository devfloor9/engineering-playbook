---
title: "Harbor 2.13 与 EKS Hybrid Nodes 集成指南"
sidebar_label: "4. Harbor Registry"
description: "Harbor 2.13 私有容器镜像仓库与 Amazon EKS Hybrid Nodes (Kubernetes 1.33) 集成的完整分步指南，涵盖安装、SSL/TLS 配置、身份认证和故障排除"
tags: [eks, hybrid-nodes, harbor, container-registry, kubernetes, ssl-tls, nodeadm]
category: "hybrid-multicloud"
sidebar_position: 4
last_update:
  date: 2026-02-14
  author: devfloor9
---

# Harbor 2.13 与 EKS Hybrid Nodes 集成指南

> 📅 **撰写日期**: 2025-08-20 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 3 分钟


## 概述

本指南提供了将 Harbor 2.13 与 EKS Hybrid Nodes (Kubernetes 1.33) 集成的分步配置方法。EKS Hybrid Nodes 于 2024 年 12 月正式发布，支持将本地基础设施与 AWS EKS 进行统一管理，而 Harbor 2.13 则提供了增强的安全功能和 AI 模型管理能力。

## 第一部分：Harbor 私有仓库安装与配置

### 步骤 1：Harbor 2.13 安装准备

#### 系统要求

- Docker Engine 20.10.10+
- Docker Compose 2.0+
- 最低硬件要求：2 CPU 核心，4GB RAM
- 支持的操作系统：Ubuntu 20.04/22.04、RHEL 8/9、CentOS 7/8

#### 下载 Harbor 2.13.2

```bash
# 下载 Harbor 2.13.2（最新稳定版）
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# 解压归档文件
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### 步骤 2：SSL/TLS 证书配置

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

### 步骤 3：Harbor 配置文件设置

#### 修改 harbor.yml

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

### 步骤 4：Harbor 安装

```bash
# 运行安装准备脚本
sudo ./prepare

# 安装 Harbor（包含 Trivy）
sudo ./install.sh --with-trivy

# 验证安装
docker-compose ps
```

### 步骤 5：Harbor 用户认证配置

#### LDAP 认证设置（可选）

```bash
# 通过 API 配置 LDAP
curl -X PUT "https://harbor.yourdomain.com/api/v2.0/configurations" \
  -H "Content-Type: application/json" \
  -u "admin:Harbor12345!" \
  -d '{
    "auth_mode": "ldap_auth",
    "ldap_url": "ldap://ldap.company.com:389",
    "ldap_base_dn": "ou=users,dc=company,dc=com",
    "ldap_filter": "(objectClass=person)",
    "ldap_uid": "uid",
    "ldap_scope": 2,
    "ldap_search_dn": "cn=admin,dc=company,dc=com",
    "ldap_search_password": "admin_password",
    "ldap_verify_cert": false
  }'
```

#### 创建 Robot 账户（用于 Kubernetes 集成）

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

## 第二部分：EKS Hybrid Nodes 配置

### 步骤 6：nodeadm 安装与准备

#### 下载 nodeadm

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

#### 安装所需组件

```bash
# 安装 Kubernetes 1.33 支持组件
sudo nodeadm install 1.33 --credential-provider ssm

# 或使用 IAM Roles Anywhere 时
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### 步骤 7：创建 NodeConfig 文件

#### 编写用于 Harbor 集成的 NodeConfig

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

### 步骤 8：安装证书

#### 在节点上安装 Harbor CA 证书

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

### 步骤 9：节点初始化

```bash
# 使用 NodeConfig 初始化节点
sudo nodeadm init --config-source file://nodeconfig.yaml

# 验证节点状态
kubectl get nodes
```

## 第三部分：Harbor 与 EKS 集成

### 步骤 10：网络配置

#### 配置安全组

```bash
# 允许 EKS 节点访问 Harbor 安全组
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

#### DNS 配置

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

### 步骤 11：创建 Kubernetes Secret

#### 创建 Harbor 认证 Secret

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

#### 将 ImagePullSecret 添加到 ServiceAccount

```bash
# 修改默认 ServiceAccount
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "harbor-registry"}]}'

# 或通过 YAML 定义
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: default
imagePullSecrets:
- name: harbor-registry
EOF
```

### 步骤 12：测试与验证

#### 连接测试

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

### 步骤 13：故障排除

#### 常见问题与解决方案

**1. ImagePullBackOff 错误**

```bash
# 诊断问题
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# 检查 Secret
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d

# 解决方案
# - 重新创建 Secret
# - 验证镜像名称和标签
# - 检查 Harbor 项目访问权限
```

**2. 证书错误 (x509: certificate signed by unknown authority)**

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

**3. DNS 解析失败**

```bash
# 测试 DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# 检查 CoreDNS 日志
kubectl logs -n kube-system -l k8s-app=kube-dns

# 解决方案：重启 CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

## 第四部分：运维与维护

### 步骤 14：安全加固

#### 配置 Harbor 安全策略

```bash
# 启用漏洞扫描自动化
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

### 步骤 15：备份与恢复

#### Harbor 备份脚本

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. 备份 Harbor 配置
cp -r /data/harbor $BACKUP_DIR/

# 2. 备份数据库
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. 备份镜像仓库数据（可选 - 可能很大）
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "备份完成: $BACKUP_DIR"
```

### 步骤 16：监控

#### Prometheus 指标采集

```yaml
# prometheus-scrape-config.yaml
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

## 结论

本指南详细介绍了 Harbor 2.13 与 EKS Hybrid Nodes (Kubernetes 1.33) 的分步集成配置。关键成功因素包括：

1. **正确的证书管理**：使用自签名证书时，需在所有节点上安装 CA 证书
2. **网络配置**：确保 Harbor 与 EKS 节点之间的安全通信链路
3. **认证设置**：通过 Robot 账户实现自动化认证配置
4. **持续验证**：通过分步测试进行配置验证

利用 Harbor 2.13 的增强功能和 EKS Hybrid Nodes 的灵活性，您可以构建跨本地与云端的统一容器管理环境。
