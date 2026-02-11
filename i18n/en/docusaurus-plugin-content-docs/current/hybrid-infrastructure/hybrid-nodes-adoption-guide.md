---
title: "EKS Hybrid Nodes Complete Guide"
sidebar_label: "Hybrid Nodes Complete Guide"
description: "Complete guide for Amazon EKS Hybrid Nodes adoption: architecture, configuration, networking, DNS, GPU servers, cost analysis, and dynamic resource allocation (DRA)"
tags: [eks, hybrid-nodes, nodeadm, kubernetes, harbor, networking, dns, gpu, dra, cost-optimization, architecture]
category: "hybrid-multicloud"
date: 2025-08-20
authors: [devfloor9]
sidebar_position: 6
---

# EKS Hybrid Nodes Complete Guide

> 📅 **Date**: 2025-08-20 | ⏱️ **Reading Time**: ~15 minutes

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Networking and DNS Configuration](#networking-and-dns-configuration)
4. [Harbor Private Registry Installation](#harbor-private-registry-installation)
5. [EKS Hybrid Nodes Configuration](#eks-hybrid-nodes-configuration)
6. [Harbor and EKS Integration](#harbor-and-eks-integration)
7. [GPU Server Integration](#gpu-server-integration)
8. [Cost Analysis and Optimization](#cost-analysis-and-optimization)
9. [Dynamic Resource Allocation (DRA)](#dynamic-resource-allocation-dra)
10. [Operations and Maintenance](#operations-and-maintenance)

## Overview

This guide provides complete adoption methods for Amazon EKS Hybrid Nodes. EKS Hybrid Nodes, officially released in December 2024, enables integrated management of on-premises infrastructure with AWS EKS, allowing management of high-performance GPU servers and cloud resources within a single Kubernetes cluster.

**Key Features:**

- Unified management of on-premises and cloud
- Harbor 2.13 private registry integration
- H100 GPU server support
- Dynamic Resource Allocation (DRA)
- Flexible workload placement

## Prerequisites

### System Requirements

**On-premises Nodes:**

- Operating System: Ubuntu 20.04/22.04/24.04 LTS or RHEL 8/9
- Docker Engine 20.10.10+ (for Harbor)
- Container Runtime: containerd 1.6.x or later
- Minimum Hardware: 2 CPU cores, 4GB RAM

**GPU Servers (Optional):**

- NVIDIA Driver 550.x or later
- NVIDIA Container Toolkit
- H100/H200 GPU support

### Network Requirements

| Item | Requirement |
|------|-------------|
| Bandwidth | Minimum 10Gbps (Direct Connect or VPN) |
| Latency | 5ms or less recommended |
| MTU | Jumbo Frame (9000) recommended |

## Networking and DNS Configuration

### Required Firewall Settings

Configure necessary firewall ports between on-premises and AWS:

| Protocol | Port | Direction | Purpose |
|----------|------|-----------|---------|
| TCP | 443 | Bidirectional | Kubernetes API server communication |
| TCP | 10250 | On-premises → AWS | Kubelet API |
| TCP/UDP | 53 | Bidirectional | DNS queries |
| TCP | 6443 | On-premises → AWS | Kubernetes API (alternative) |

### Pod CIDR Firewall Configuration

:::tip Recommendation
It is recommended to register the entire Pod CIDR range in the firewall.
:::

**Configuration Methods:**

- **Complete CIDR Registration (Recommended)**: e.g., `10.244.0.0/16`
  - Flexible adaptation to dynamic Pod IP allocation
  - No additional firewall settings needed during pod scaling
  - Reduced management complexity

- **Fixed IP Worker Nodes Only (Not Recommended)**:
  - Need to update firewall rules whenever pod IPs change
  - Increased operational complexity
  - Increased service disruption risk

### Istio + Calico CNI Mixed Mode

Additional port configuration when using Istio service mesh and Calico CNI together:

| Component | Port | Purpose |
|-----------|------|---------|
| Envoy Proxy | 15001 | Outbound traffic |
| Envoy Proxy | 15006 | Inbound traffic |
| Pilot | 15010 | xDS server |
| Istio Telemetry | 15004 | Mixer policy |
| Calico BGP | 179 | BGP peering |
| Calico Felix | 9099 | Metrics |

```bash
# Firewall rule example (AWS Security Group)
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

### DNS Configuration

#### Route 53 Resolver Inbound Endpoint (On-premises → AWS)

**Purpose**: Enable on-premises servers to query AWS internal domains

```bash
# Create Route 53 Resolver Inbound Endpoint
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-123 \
  --name hybrid-inbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction INBOUND \
  --ip-addresses SubnetId=subnet-xxxxx,Ip=10.0.1.100 \
              SubnetId=subnet-yyyyy,Ip=10.0.2.100
```

**On-premises DNS Configuration (Example: BIND):**

```bash
# /etc/named.conf
zone "eks.amazonaws.com" {
    type forward;
    forward only;
    forwarders { 10.0.1.100; 10.0.2.100; };
};
```

#### Route 53 Resolver Outbound Endpoint (AWS → On-premises)

**Purpose**: Enable AWS worker nodes to query on-premises internal domains

```bash
# Create Outbound Endpoint
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-456 \
  --name hybrid-outbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction OUTBOUND \
  --ip-addresses SubnetId=subnet-xxxxx \
              SubnetId=subnet-yyyyy

# Create Resolver Rule
aws route53resolver create-resolver-rule \
  --creator-request-id unique-id-789 \
  --name on-prem-dns-rule \
  --rule-type FORWARD \
  --domain-name company.local \
  --target-ips Ip=192.168.1.53,Port=53 Ip=192.168.1.54,Port=53 \
  --resolver-endpoint-id rslvr-out-xxxxx
```

#### Bidirectional DNS Query Validation

```bash
# Query AWS domains from on-premises
dig @10.0.1.100 my-service.eks.amazonaws.com

# Query on-premises domains from AWS
dig harbor.company.local
```

### CIDR Design

#### CIDR Design Principles

**AWS VPC CIDR:**

- Primary: `10.0.0.0/16` (65,536 IPs)
- Secondary (if needed): `10.1.0.0/16`

**On-premises CIDR:**

- Existing network: `192.168.0.0/16`
- Pod CIDR: `10.244.0.0/16`
- Service CIDR: `10.96.0.0/16`

**Preventing Overlaps:**

```bash
# Check CIDR overlaps
aws ec2 describe-vpcs --query 'Vpcs[*].CidrBlock'
# Check on-premises routing table
ip route show
```

#### Routing Configuration

```bash
# Create AWS Transit Gateway
aws ec2 create-transit-gateway \
  --description "Hybrid connectivity" \
  --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=enable

# Create VPN Connection
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-xxxxx \
  --transit-gateway-id tgw-xxxxx \
  --options TunnelInsideIpVersion=ipv4,TunnelOptions=[{TunnelInsideCidr=169.254.10.0/30}]
```

## Harbor Private Registry Installation

### Download Harbor 2.13.2

```bash
# Download Harbor 2.13.2 (latest stable version)
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# Extract archive
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### SSL/TLS Certificate Configuration

#### Generate Self-Signed Certificate

```bash
# 1. Generate CA certificate
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrganization/CN=Harbor-CA"

# 2. Generate server certificate
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=MyOrganization/CN=harbor.yourdomain.com"

# 3. Create v3.ext file (SAN configuration)
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

# 4. Sign certificate
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

# 5. Create certificate directory and copy files
mkdir -p /data/cert
cp harbor.crt /data/cert/
cp harbor.key /data/cert/
```

### Harbor Configuration File Setup

```bash
# Copy and edit harbor.yml file
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

Key configuration content:

```yaml
# Hostname setting
hostname: harbor.yourdomain.com

# HTTPS configuration
https:
  port: 443
  certificate: /data/cert/harbor.crt
  private_key: /data/cert/harbor.key

# Harbor admin password
harbor_admin_password: Harbor12345!

# Database configuration
database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0

# Data storage path
data_volume: /data

# Logging configuration
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor

# Trivy vulnerability scanner configuration
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  insecure: false

# Metrics configuration
metric:
  enabled: true
  port: 9090
  path: /metrics
```

### Harbor Installation

```bash
# Run installation preparation script
sudo ./prepare

# Install Harbor (with Trivy)
sudo ./install.sh --with-trivy

# Verify installation
docker-compose ps
```

### Create Robot Account

```bash
# Create via Harbor UI or use API
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

## EKS Hybrid Nodes Configuration

### Install nodeadm

```bash
# For x86_64 architecture
curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/amd64/nodeadm'

# For ARM architecture (if needed)
# curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/arm64/nodeadm'

# Grant execute permission
chmod +x nodeadm
sudo mv nodeadm /usr/local/bin/

# Verify version
nodeadm version
```

### Install Required Components

```bash
# Install Kubernetes 1.33 supporting components
sudo nodeadm install 1.33 --credential-provider ssm

# Or when using IAM Roles Anywhere
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### Create NodeConfig File

```yaml
# nodeconfig.yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: ap-northeast-2

  # Hybrid node configuration using SSM
  hybrid:
    ssm:
      activationCode: "YOUR-ACTIVATION-CODE"
      activationId: "YOUR-ACTIVATION-ID"

  # Containerd configuration (Harbor registry setup)
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

  # Kubelet configuration
  kubelet:
    config:
      shutdownGracePeriod: 30s
      maxPods: 110
    flags:
      - --node-labels=node-type=hybrid,registry=harbor
```

### Install Certificate

```bash
# Add CA certificate to system trust store
sudo cp ca.crt /usr/local/share/ca-certificates/harbor-ca.crt
sudo update-ca-certificates

# Create certificate directory for containerd
sudo mkdir -p /etc/containerd/certs.d/harbor.yourdomain.com

# Copy certificate
sudo cp ca.crt /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt

# Restart containerd
sudo systemctl restart containerd
```

### Node Initialization

```bash
# Initialize node using NodeConfig
sudo nodeadm init --config-source file://nodeconfig.yaml

# Verify node status
kubectl get nodes
```

## Harbor and EKS Integration

### Network Configuration

```bash
# Allow EKS nodes to access Harbor security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

### CoreDNS Configuration

```yaml
# Modify CoreDNS ConfigMap
kubectl edit configmap coredns -n kube-system

# Add the following content
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
        }
        # Add Harbor DNS
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

### Create Kubernetes Secret

```bash
# Test docker login
docker login harbor.yourdomain.com
Username: robot$k8s-robot
Password: YOUR-ROBOT-TOKEN

# Create Kubernetes Secret
kubectl create secret docker-registry harbor-registry \
  --docker-server=harbor.yourdomain.com \
  --docker-username='robot$k8s-robot' \
  --docker-password='YOUR-ROBOT-TOKEN' \
  --docker-email=admin@yourdomain.com

# Copy Secret to all namespaces (optional)
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get secret harbor-registry -o yaml | \
    sed "s/namespace: default/namespace: $ns/" | \
    kubectl apply -f -
done
```

### Testing and Validation

```bash
# 1. Verify network connectivity
curl -k https://harbor.yourdomain.com/api/v2.0/health

# 2. Test image pull directly from node
sudo crictl pull harbor.yourdomain.com/library/nginx:latest

# 3. Test Kubernetes Pod deployment
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

# 4. Verify Pod status
kubectl get pod harbor-test
kubectl describe pod harbor-test
```

## GPU Server Integration

### H100 GPU Server Integration

**Validation Goal**: Integrate 10 H100 GPU servers as EKS Hybrid Nodes

#### GPU Node Configuration

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

#### Deploy NVIDIA Device Plugin

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.5/nvidia-device-plugin.yml

# Verify GPU resources
kubectl get nodes -o json | jq '.items[].status.allocatable."nvidia.com/gpu"'
```

#### GPU Test

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

### On-premises Storage Access

#### NFS Mount Test

```bash
# Run on AWS worker node
sudo mount -t nfs -o vers=4.1,rsize=1048576,wsize=1048576 \
  192.168.1.100:/export/data /mnt/onprem-storage

# Performance measurement
dd if=/dev/zero of=/mnt/onprem-storage/testfile bs=1M count=1000 oflag=direct
```

#### PersistentVolume Configuration

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

## Cost Analysis and Optimization

### Hybrid Nodes Pricing Structure

**Base Pricing (February 2025):**

- Per vCPU: $0.1099/hour
- Based on 730 hours/month: approximately $80.23/vCPU

### H100 GPU Server Cost Analysis

**H100 GPU Server Specifications (DGX H200 basis):**

- CPU: 224 vCPU (2x Intel Xeon Platinum 8592+)
- RAM: 2TB
- GPU: 8x H200 (141GB HBM3e)

**Monthly Cost Calculation:**

```
Single Node:
- 224 vCPU × $80.23 = $17,971.52/month

10 Nodes:
- $17,971.52 × 10 = $179,715.20/month
```

:::warning Cost Optimization Review Needed
Due to the high number of vCPUs in H100 GPU servers, Hybrid Nodes costs are substantial. Review the following optimization approaches:

1. **Selective Workload Placement**: Place only GPU-intensive workloads on Hybrid Nodes
2. **Spot Instances Mix**: Utilize Spot instances for AWS workers
3. **Auto Scaling**: Remove nodes during non-usage hours
4. **Reserved Capacity**: Negotiate reserved options for long-term usage
:::

### Cost Reduction Strategies

#### 1. Hybrid Workload Distribution

```yaml
# GPU workload → On-premises
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
# CPU workload → AWS EC2
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

#### 2. Cluster Autoscaler Configuration

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

#### 3. Cost Monitoring

```bash
# Track Hybrid Nodes costs using AWS Cost Explorer API
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

### Workload Distribution Strategy

**On-premises GPU Workers:**

- AI/ML training workloads
- High-performance inference services
- Data-intensive processing

**AWS CPU Workers:**

- Web applications and APIs
- Microservices
- Lightweight batch jobs

## Dynamic Resource Allocation (DRA)

:::info What is DRA?
Dynamic Resource Allocation (DRA) is a feature introduced in Kubernetes 1.26 that enables Pods to dynamically allocate resources such as GPUs, NPUs, and specialized accelerators when requested. This improves upon traditional static resource allocation methods, enabling more efficient resource utilization.
:::

### Enable DRA

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

### Deploy DRA Driver

```bash
# Add DRA driver helm repository
helm repo add dra-driver https://charts.dra.io
helm repo update

# Install DRA driver
helm install dra-driver dra-driver/dra-driver \
  --namespace kube-system \
  --set driver.name=eks-hybrid-dra \
  --set driver.enableGPU=true \
  --set driver.enableCPU=true
```

### Define Resource Classes

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

### Configure Resource Claims

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

### ML Training Job Example

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

### DRA Monitoring

:::tip Key Metrics
Monitor these critical metrics for DRA performance:

- `dra_allocation_duration_seconds` - Time to allocate resources
- `dra_allocation_errors_total` - Failed allocation attempts
- `dra_resource_utilization_ratio` - Resource usage efficiency
- `dra_pending_claims_total` - Unscheduled resource claims
:::

## Operations and Maintenance

### Security Hardening

```bash
# Enable Harbor vulnerability scan automation
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

# Configure image signing policy (Notary)
export DOCKER_CONTENT_TRUST=1
export DOCKER_CONTENT_TRUST_SERVER=https://harbor.yourdomain.com:4443
```

### Backup and Recovery

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. Backup Harbor configuration
cp -r /data/harbor $BACKUP_DIR/

# 2. Backup database
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. Backup registry data (optional)
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "Backup completed: $BACKUP_DIR"
```

### Monitoring

#### Prometheus Metrics Collection

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

#### Key Monitoring Metrics

- Registry request rate
- Authentication failure count
- Storage usage
- Database connection count
- API response time

### Performance Validation

#### Direct Connect Performance Test

```bash
# 1. Basic connectivity test
ping -c 100 <aws-endpoint>

# 2. Check MTU optimization
ping -M do -s 8972 <aws-endpoint>

# 3. Trace route
traceroute -n <aws-endpoint>

# 4. Measure bandwidth
iperf3 -c <aws-endpoint> -t 60 -P 10 -w 512K
```

#### Performance Baseline

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Latency | < 5ms | 5-10ms | > 10ms |
| Jitter | < 2ms | 2-5ms | > 5ms |
| Packet Loss | < 0.01% | 0.01-0.1% | > 0.1% |
| Bandwidth | > 10Gbps | 5-10Gbps | < 5Gbps |

### Troubleshooting

#### ImagePullBackOff Error

```bash
# Diagnose problem
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# Check Secret
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d
```

#### Certificate Error

```bash
# Install CA certificate on all nodes
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

#### DNS Resolution Failure

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns

# Restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

## Conclusion

EKS Hybrid Nodes provides an integrated Kubernetes environment spanning on-premises and cloud. Key success factors covered in this guide:

1. **Proper Networking Configuration**: Complete Pod CIDR firewall registration and bidirectional DNS configuration
2. **Certificate Management**: When using self-signed certificates, install CA certificate on all nodes
3. **Cost Optimization**: Establish hybrid distribution strategies according to workload characteristics
4. **Dynamic Resource Allocation**: Efficient GPU resource management using DRA
5. **Continuous Validation**: Configuration validation through step-by-step testing

Before adoption, prioritize reviewing:

- Secure low-latency connectivity through Direct Connect
- H100 GPU server high vCPU cost optimization strategies
- Verify actual environment performance and stability through PoC

---

### Reference Materials

- [Amazon EKS Hybrid Nodes Official Documentation](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes.html)
- [EKS Hybrid Nodes Pricing](https://aws.amazon.com/eks/pricing/)
- [Harbor 2.13 Release Notes](https://github.com/goharbor/harbor/releases/tag/v2.13.2)
- [Kubernetes DRA KEP](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/3063-dynamic-resource-allocation)
- [NVIDIA GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
