---
title: "EKS Hybrid Nodes Adoption Guide"
sidebar_label: "Hybrid Node Adoption"
description: "Comprehensive guide for EKS Hybrid Nodes adoption covering networking, DNS, GPU servers, cost analysis, and architecture decisions"
tags: [eks, hybrid-nodes, networking, dns, gpu, cost-optimization, architecture]
category: "hybrid-multicloud"
date: 2025-05-26
authors: [devfloor9]
sidebar_position: 7
---

# EKS Hybrid Nodes Adoption Guide

## Networking and Firewall Configuration

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
  - No additional firewall settings needed when pods scale
  - Reduced management complexity

- **Fixed IP Worker Nodes Only (Not Recommended)**:
  - Need to update firewall rules whenever pod IPs change
  - Increased operational complexity
  - Increased service disruption risk

### Istio + Calico CNI Mixed Mode

When using Istio service mesh and Calico CNI together, configure additional ports:

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

## DNS Configuration

### Route 53 Resolver Architecture

#### Inbound Endpoint (On-premises → AWS)

**Purpose**: Enable on-premises servers to query AWS internal domains

**Configuration:**

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

#### Outbound Endpoint (AWS → On-premises)

**Purpose**: Enable AWS worker nodes to query on-premises internal domains

**Configuration:**

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

### Bidirectional DNS Query Validation

```bash
# Query AWS domains from on-premises
dig @10.0.1.100 my-service.eks.amazonaws.com

# Query on-premises domains from AWS
dig harbor.company.local
```

## PoC Validation Items

### 1. H100 GPU Server EKS Hybrid Node Join

**Validation Goal**: Integrate 10 H100 GPU servers as EKS Hybrid Nodes

#### Prerequisites

- **Operating System**: Ubuntu 22.04/24.04 LTS or RHEL 8/9
- **NVIDIA Driver**: 550.x or later
- **Container Runtime**: containerd 1.6.x or later
- **NVIDIA Container Toolkit**: Installation required

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

#### NVIDIA Device Plugin Deployment

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.5/nvidia-device-plugin.yml

# Verify GPU resources
kubectl get nodes -o json | jq '.items[].status.allocatable."nvidia.com/gpu"'
```

#### Validation Test

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

### 2. AWS Worker Nodes Accessing On-premises High-Performance File Storage

**Validation Goal**: AWS EC2 worker nodes accessing on-premises NFS/Lustre storage

#### Network Requirements

- **Direct Connect** or **VPN**: Minimum 10Gbps recommended
- **MTU Settings**: Jumbo Frame (9000) recommended
- **Latency**: 5ms or less recommended

#### Storage Connection Test

```bash
# Run on AWS worker node
# NFS mount test
sudo mount -t nfs -o vers=4.1,rsize=1048576,wsize=1048576 \
  192.168.1.100:/export/data /mnt/onprem-storage

# Performance measurement
dd if=/dev/zero of=/mnt/onprem-storage/testfile bs=1M count=1000 oflag=direct
```

#### Kubernetes PersistentVolume Configuration

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

### 3. On-premises-AWS Networking Configuration and CIDR Design

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

## Cost-Related Information

### Hybrid Nodes Pricing Structure

**Base Pricing (February 2025):**
- Per vCPU: $0.1099/hour (approximately 159 KRW/hour)
- Based on 730 hours/month: approximately $80.23/vCPU (approximately 116,534 KRW)

### H100 GPU Server Cost Analysis

**H100 GPU Server Specifications (DGX H200 basis):**
- CPU: 224 vCPU (2x Intel Xeon Platinum 8592+)
- RAM: 2TB
- GPU: 8x H200 (141GB HBM3e)

**Monthly Cost Calculation:**

```
Single Node:
- 224 vCPU × $80.23 = $17,971.52/month (approximately 26.1 million KRW)

10 Nodes:
- $17,971.52 × 10 = $179,715.20/month (approximately 261 million KRW)
```

:::warning Cost Optimization Review Needed
Due to the high number of vCPUs in H100 GPU servers, Hybrid Nodes costs are substantial. Review the following optimization approaches:

1. **Selective Workload Placement**: Place only GPU-intensive workloads on Hybrid Nodes
2. **Spot Instances Mix**: Utilize Spot instances for AWS workers
3. **Auto Scaling**: Remove nodes during non-usage hours
4. **Reserved Capacity**: Negotiate reserved options for long-term usage
:::

### Cost Reduction Strategies

**1. Hybrid Workload Distribution:**

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

**2. Cluster Autoscaler Configuration:**

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

**3. Cost Monitoring:**

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

## Architecture

### Mixed Mode Configuration Considerations

#### 1. Workload Distribution Strategy

**On-premises GPU Workers:**
- AI/ML training workloads
- High-performance inference services
- Data-intensive processing

**AWS CPU Workers:**
- Web applications and APIs
- Microservices
- Lightweight batch jobs

#### 2. Network Latency Optimization

**Measurement Tools:**

```bash
# Measure latency
kubectl run netperf --image=networkstatic/netperf --rm -it -- \
  /bin/bash -c "netperf -H <target-pod-ip> -t TCP_RR -- -o min_latency,mean_latency,max_latency"

# Measure bandwidth
kubectl run iperf3 --image=networkstatic/iperf3 --rm -it -- \
  iperf3 -c <target-pod-ip> -t 30 -P 10
```

**Performance Targets:**
- Pod-to-Pod latency: Less than 10ms
- Bandwidth: Over 1Gbps (general), over 10Gbps (storage)

#### 3. High Availability Design

```yaml
# Pod distribution using anti-affinity
apiVersion: apps/v1
kind: Deployment
metadata:
  name: critical-app
spec:
  replicas: 6
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: critical-app
            topologyKey: kubernetes.io/hostname
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 50
            preference:
              matchExpressions:
              - key: eks.amazonaws.com/compute-type
                operator: In
                values: [ec2]
          - weight: 50
            preference:
              matchExpressions:
              - key: node-type
                operator: In
                values: [hybrid]
```

### Connection Performance Validation Methods

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

## Conclusion

When adopting EKS Hybrid Nodes, prioritize reviewing the following:

1. **Networking**: Complete Pod CIDR firewall registration and bidirectional DNS configuration
2. **Costs**: Establish H100 GPU server high vCPU cost optimization strategies
3. **Performance**: Secure low-latency connectivity through Direct Connect
4. **Architecture**: Establish hybrid distribution strategies according to workload characteristics
5. **Validation**: Verify actual environment performance and stability through PoC

---

### Reference Materials

- Amazon EKS Hybrid Nodes official documentation
- EKS Hybrid Nodes pricing
- AWS Direct Connect user guide
- Route 53 Resolver configuration guide
- NVIDIA GPU Operator documentation
