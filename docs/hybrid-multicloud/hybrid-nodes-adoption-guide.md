---
title: "EKS Hybrid Nodes 도입 가이드"
sidebar_label: "하이브리드 노드 도입"
description: "Amazon EKS Hybrid Nodes 도입을 위한 네트워킹, DNS, GPU 서버, 비용 분석 및 아키텍처 결정 사항을 다룬 포괄적 가이드"
tags: [eks, hybrid-nodes, networking, dns, gpu, cost-optimization, architecture]
category: "hybrid-multicloud"
date: 2025-05-26
authors: [devfloor9]
sidebar_position: 7
---

# EKS Hybrid Nodes 도입 가이드

> 📅 **작성일**: 2025-05-26 | ⏱️ **읽는 시간**: 약 6분


## 네트워킹 및 방화벽 구성

### 필수 방화벽 설정

온프레미스와 AWS 간 필요한 방화벽 포트 구성:

| 프로토콜 | 포트 | 방향 | 목적 |
|---------|------|------|------|
| TCP | 443 | 양방향 | Kubernetes API 서버 통신 |
| TCP | 10250 | 온프레미스 → AWS | Kubelet API |
| TCP/UDP | 53 | 양방향 | DNS 조회 |
| TCP | 6443 | 온프레미스 → AWS | Kubernetes API (대체) |

### Pod CIDR 방화벽 구성

:::tip 권장사항
전체 Pod CIDR 대역을 방화벽에 등록하는 것을 권장합니다.
:::

**구성 방법:**

- **전체 CIDR 등록 (권장)**: 예) `10.244.0.0/16`
  - 동적 Pod IP 할당에 유연하게 대응
  - Pod 스케일링 시 추가 방화벽 설정 불필요
  - 관리 복잡도 감소

- **고정 IP 워커노드만 등록 (비권장)**:
  - Pod IP가 변경될 때마다 방화벽 규칙 업데이트 필요
  - 운영 복잡도 증가
  - 서비스 중단 위험 증가

### Istio + Calico CNI 혼합 모드

Istio 서비스 메시와 Calico CNI를 함께 사용하는 경우 추가 포트 구성:

| 컴포넌트 | 포트 | 용도 |
|----------|------|------|
| Envoy Proxy | 15001 | 아웃바운드 트래픽 |
| Envoy Proxy | 15006 | 인바운드 트래픽 |
| Pilot | 15010 | xDS 서버 |
| Istio Telemetry | 15004 | Mixer 정책 |
| Calico BGP | 179 | BGP 피어링 |
| Calico Felix | 9099 | 메트릭 |

```bash
# 방화벽 규칙 예시 (AWS Security Group)
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

## DNS 구성

### Route 53 Resolver 아키텍처

#### Inbound Endpoint (온프레미스 → AWS)

**목적**: 온프레미스 서버가 AWS 내부 도메인을 조회할 수 있도록 설정

**구성:**

```bash
# Route 53 Resolver Inbound Endpoint 생성
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-123 \
  --name hybrid-inbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction INBOUND \
  --ip-addresses SubnetId=subnet-xxxxx,Ip=10.0.1.100 \
              SubnetId=subnet-yyyyy,Ip=10.0.2.100
```

**온프레미스 DNS 설정 (예: BIND):**

```bash
# /etc/named.conf
zone "eks.amazonaws.com" {
    type forward;
    forward only;
    forwarders { 10.0.1.100; 10.0.2.100; };
};
```

#### Outbound Endpoint (AWS → 온프레미스)

**목적**: AWS 워커노드가 온프레미스 내부 도메인을 조회할 수 있도록 설정

**구성:**

```bash
# Outbound Endpoint 생성
aws route53resolver create-resolver-endpoint \
  --creator-request-id unique-id-456 \
  --name hybrid-outbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction OUTBOUND \
  --ip-addresses SubnetId=subnet-xxxxx \
              SubnetId=subnet-yyyyy

# Resolver Rule 생성
aws route53resolver create-resolver-rule \
  --creator-request-id unique-id-789 \
  --name on-prem-dns-rule \
  --rule-type FORWARD \
  --domain-name company.local \
  --target-ips Ip=192.168.1.53,Port=53 Ip=192.168.1.54,Port=53 \
  --resolver-endpoint-id rslvr-out-xxxxx
```

### 양방향 DNS 조회 검증

```bash
# 온프레미스에서 AWS 도메인 조회
dig @10.0.1.100 my-service.eks.amazonaws.com

# AWS에서 온프레미스 도메인 조회
dig harbor.company.local
```

## PoC 검증 항목

### 1. H100 GPU 서버 EKS Hybrid Node 조인

**검증 목표**: H100 GPU 서버 10대를 EKS Hybrid Node로 통합

#### 사전 요구사항

- **운영체제**: Ubuntu 22.04/24.04 LTS 또는 RHEL 8/9
- **NVIDIA Driver**: 550.x 이상
- **Container Runtime**: containerd 1.6.x 이상
- **NVIDIA Container Toolkit**: 설치 필요

#### GPU 노드 구성

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

#### NVIDIA Device Plugin 배포

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.5/nvidia-device-plugin.yml

# GPU 리소스 확인
kubectl get nodes -o json | jq '.items[].status.allocatable."nvidia.com/gpu"'
```

#### 검증 테스트

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

### 2. AWS 워커노드에서 온프레미스 고성능 파일 저장소 접근

**검증 목표**: AWS EC2 워커노드가 온프레미스 NFS/Lustre 스토리지에 접근

#### 네트워크 요구사항

- **Direct Connect** 또는 **VPN**: 최소 10Gbps 권장
- **MTU 설정**: Jumbo Frame (9000) 권장
- **지연시간**: 5ms 이하 권장

#### 스토리지 연결 테스트

```bash
# AWS 워커노드에서 실행
# NFS 마운트 테스트
sudo mount -t nfs -o vers=4.1,rsize=1048576,wsize=1048576 \
  192.168.1.100:/export/data /mnt/onprem-storage

# 성능 측정
dd if=/dev/zero of=/mnt/onprem-storage/testfile bs=1M count=1000 oflag=direct
```

#### Kubernetes PersistentVolume 구성

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

### 3. L클라우드-AWS 네트워킹 구성 및 CIDR 설계

#### CIDR 설계 원칙

**AWS VPC CIDR:**
- Primary: `10.0.0.0/16` (65,536 IP)
- Secondary (필요시): `10.1.0.0/16`

**온프레미스 CIDR:**
- 기존 네트워크: `192.168.0.0/16`
- Pod CIDR: `10.244.0.0/16`
- Service CIDR: `10.96.0.0/16`

**중복 방지:**

```bash
# CIDR 중복 검사
aws ec2 describe-vpcs --query 'Vpcs[*].CidrBlock'
# 온프레미스 라우팅 테이블 확인
ip route show
```

#### 라우팅 구성

```bash
# AWS Transit Gateway 생성
aws ec2 create-transit-gateway \
  --description "Hybrid connectivity" \
  --options AmazonSideAsn=64512,AutoAcceptSharedAttachments=enable

# VPN 연결 생성
aws ec2 create-vpn-connection \
  --type ipsec.1 \
  --customer-gateway-id cgw-xxxxx \
  --transit-gateway-id tgw-xxxxx \
  --options TunnelInsideIpVersion=ipv4,TunnelOptions=[{TunnelInsideCidr=169.254.10.0/30}]
```

## 비용 관련

### Hybrid Nodes 가격 구조

**기본 가격 (2025년 2월 기준):**
- vCPU당: $0.1099/시간 (약 159원/시간)
- 월 730시간 기준: vCPU당 약 $80.23 (약 116,534원)

### H100 GPU 서버 비용 분석

**H100 GPU 서버 사양 (DGX H200 기준):**
- CPU: 224 vCPU (2x Intel Xeon Platinum 8592+)
- RAM: 2TB
- GPU: 8x H200 (141GB HBM3e)

**월간 비용 계산:**

```
단일 노드:
- 224 vCPU × $80.23 = $17,971.52/월 (약 2,610만원)

10개 노드:
- $17,971.52 × 10 = $179,715.20/월 (약 2억 6,100만원)
```

:::warning 비용 최적화 검토 필요
H100 GPU 서버의 높은 vCPU 수로 인해 Hybrid Nodes 비용이 상당합니다. 다음 최적화 방안을 검토하세요:

1. **선택적 워크로드 배치**: GPU 집약적 워크로드만 Hybrid Nodes에 배치
2. **Spot 인스턴스 혼용**: AWS 워커는 Spot 인스턴스 활용
3. **Auto Scaling**: 사용하지 않는 시간대 노드 제거
4. **Reserved Capacity**: 장기 사용 시 예약 옵션 협의
:::

### 비용 절감 전략

**1. 하이브리드 워크로드 분산:**

```yaml
# GPU 워크로드 → 온프레미스
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
# CPU 워크로드 → AWS EC2
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

**2. Cluster Autoscaler 구성:**

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

**3. 비용 모니터링:**

```bash
# AWS Cost Explorer API로 Hybrid Nodes 비용 추적
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

## 아키텍처

### 혼합 모드 구성 고려사항

#### 1. 워크로드 분산 전략

**온프레미스 GPU 워커:**
- AI/ML 훈련 워크로드
- 고성능 추론 서비스
- 데이터 집약적 처리

**AWS CPU 워커:**
- 웹 애플리케이션 및 API
- 마이크로서비스
- 경량 배치 작업

#### 2. 네트워크 지연시간 최적화

**측정 도구:**

```bash
# 지연시간 측정
kubectl run netperf --image=networkstatic/netperf --rm -it -- \
  /bin/bash -c "netperf -H <target-pod-ip> -t TCP_RR -- -o min_latency,mean_latency,max_latency"

# 대역폭 측정
kubectl run iperf3 --image=networkstatic/iperf3 --rm -it -- \
  iperf3 -c <target-pod-ip> -t 30 -P 10
```

**목표 성능:**
- Pod-to-Pod 지연시간: 10ms 미만
- 대역폭: 1Gbps 초과 (일반), 10Gbps 초과 (스토리지)

#### 3. 고가용성 설계

```yaml
# Anti-affinity를 사용한 Pod 분산
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

### 연결 성능 검증 방안

#### Direct Connect 성능 테스트

```bash
# 1. 기본 연결 테스트
ping -c 100 <aws-endpoint>

# 2. MTU 최적화 확인
ping -M do -s 8972 <aws-endpoint>

# 3. 경로 추적
traceroute -n <aws-endpoint>

# 4. 대역폭 측정
iperf3 -c <aws-endpoint> -t 60 -P 10 -w 512K
```

#### 성능 기준선

| 메트릭 | 목표 | 경고 | 임계 |
|--------|------|------|------|
| 지연시간 | 5ms 미만 | 5-10ms | 10ms 초과 |
| Jitter | 2ms 미만 | 2-5ms | 5ms 초과 |
| 패킷 손실 | 0.01% 미만 | 0.01-0.1% | 0.1% 초과 |
| 대역폭 | 10Gbps 초과 | 5-10Gbps | 5Gbps 미만 |

## 결론

EKS Hybrid Nodes 도입 시 다음 사항을 우선적으로 검토하세요:

1. **네트워킹**: 전체 Pod CIDR 방화벽 등록 및 양방향 DNS 구성
2. **비용**: H100 GPU 서버의 높은 vCPU 비용 최적화 전략 수립
3. **성능**: Direct Connect를 통한 저지연 연결 확보
4. **아키텍처**: 워크로드 특성에 따른 하이브리드 분산 전략 수립
5. **검증**: PoC를 통한 실제 환경 성능 및 안정성 확인

---

### 참고 자료

- Amazon EKS Hybrid Nodes 공식 문서
- EKS Hybrid Nodes 가격 책정
- AWS Direct Connect 사용자 가이드
- Route 53 Resolver 구성 가이드
- NVIDIA GPU Operator 문서
