---
title: "EKS Hybrid Nodes 완전 가이드"
sidebar_label: "1. 하이브리드 노드 완전 가이드"
description: "Amazon EKS Hybrid Nodes 도입을 위한 완전한 가이드: 아키텍처, 구성, 네트워킹, DNS, GPU 서버, 비용 분석 및 동적 리소스 할당(DRA)"
tags: [eks, hybrid-nodes, nodeadm, kubernetes, harbor, networking, dns, gpu, dra, cost-optimization, architecture]
category: "hybrid-multicloud"
last_update:
  date: 2025-08-20
  author: devfloor9
sidebar_position: 1
---

# EKS Hybrid Nodes 완전 가이드

> 📅 **작성일**: 2025-08-20 | ⏱️ **읽는 시간**: 약 15분

## 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [네트워킹 및 DNS 구성](#네트워킹-및-dns-구성)
4. [Harbor Private Registry 설치](#harbor-private-registry-설치)
5. [EKS Hybrid Nodes 구성](#eks-hybrid-nodes-구성)
6. [Harbor와 EKS 통합](#harbor와-eks-통합)
7. [GPU 서버 통합](#gpu-서버-통합)
8. [비용 분석 및 최적화](#비용-분석-및-최적화)
9. [동적 리소스 할당 (DRA)](#동적-리소스-할당-dra)
10. [운영 및 유지보수](#운영-및-유지보수)

## 개요

이 가이드는 Amazon EKS Hybrid Nodes의 완전한 도입 방법을 제공합니다. 2024년 12월 정식 출시된 EKS Hybrid Nodes는 온프레미스 인프라와 AWS EKS를 통합 관리할 수 있게 해주며, 특히 고성능 GPU 서버와 클라우드 리소스를 하나의 Kubernetes 클러스터로 관리할 수 있습니다.

**주요 기능:**

- 온프레미스와 클라우드의 통합 관리
- Harbor 2.13 프라이빗 레지스트리 통합
- H100 GPU 서버 지원
- 동적 리소스 할당 (DRA)
- 유연한 워크로드 배치

## 사전 준비

### 시스템 요구사항

**온프레미스 노드:**

- 운영체제: Ubuntu 20.04/22.04/24.04 LTS 또는 RHEL 8/9
- Docker Engine 20.10.10+ (Harbor용)
- Container Runtime: containerd 1.6.x 이상
- 최소 하드웨어: 2 CPU cores, 4GB RAM

**GPU 서버 (선택사항):**

- NVIDIA Driver 550.x 이상
- NVIDIA Container Toolkit
- H100/H200 GPU 지원

### 네트워크 요구사항

| 항목 | 요구사항 |
|------|----------|
| 대역폭 | 최소 10Gbps (Direct Connect 또는 VPN) |
| 지연시간 | 5ms 이하 권장 |
| MTU | Jumbo Frame (9000) 권장 |

## 네트워킹 및 DNS 구성

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

### DNS 구성

#### Route 53 Resolver Inbound Endpoint (온프레미스 → AWS)

**목적**: 온프레미스 서버가 AWS 내부 도메인을 조회할 수 있도록 설정

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

#### Route 53 Resolver Outbound Endpoint (AWS → 온프레미스)

**목적**: AWS 워커노드가 온프레미스 내부 도메인을 조회할 수 있도록 설정

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

#### 양방향 DNS 조회 검증

```bash
# 온프레미스에서 AWS 도메인 조회
dig @10.0.1.100 my-service.eks.amazonaws.com

# AWS에서 온프레미스 도메인 조회
dig harbor.company.local
```

### CIDR 설계

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

## Harbor Private Registry 설치

### Harbor 2.13.2 다운로드

```bash
# Harbor 2.13.2 다운로드 (최신 안정 버전)
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# 압축 해제
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### SSL/TLS 인증서 구성

#### 자체 서명 인증서 생성

```bash
# 1. CA 인증서 생성
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrganization/CN=Harbor-CA"

# 2. 서버 인증서 생성
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrganization/CN=harbor.yourdomain.com"

# 3. v3.ext 파일 생성 (SAN 설정)
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

# 4. 인증서 서명
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

# 5. 인증서 디렉토리 생성 및 복사
mkdir -p /data/cert
cp harbor.crt /data/cert/
cp harbor.key /data/cert/
```

### Harbor 구성 파일 설정

```bash
# harbor.yml 파일 복사 및 편집
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

주요 설정 내용:

```yaml
# 호스트명 설정
hostname: harbor.yourdomain.com

# HTTPS 구성
https:
  port: 443
  certificate: /data/cert/harbor.crt
  private_key: /data/cert/harbor.key

# Harbor 관리자 비밀번호
harbor_admin_password: Harbor12345!

# 데이터베이스 설정
database:
  password: root123
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0

# 데이터 저장 경로
data_volume: /data

# 로그 설정
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor

# Trivy 취약점 스캐너 설정
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  insecure: false

# 메트릭 설정
metric:
  enabled: true
  port: 9090
  path: /metrics
```

### Harbor 설치 실행

```bash
# 설치 준비 스크립트 실행
sudo ./prepare

# Harbor 설치 (Trivy 포함)
sudo ./install.sh --with-trivy

# 설치 확인
docker-compose ps
```

### Robot Account 생성

```bash
# Harbor UI에서 생성하거나 API 사용
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

## EKS Hybrid Nodes 구성

### nodeadm 설치

```bash
# x86_64 아키텍처용
curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/amd64/nodeadm'

# ARM 아키텍처용 (필요시)
# curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/arm64/nodeadm'

# 실행 권한 부여
chmod +x nodeadm
sudo mv nodeadm /usr/local/bin/

# 버전 확인
nodeadm version
```

### 필수 구성 요소 설치

```bash
# Kubernetes 1.33 지원 컴포넌트 설치
sudo nodeadm install 1.33 --credential-provider ssm

# 또는 IAM Roles Anywhere 사용시
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### NodeConfig 파일 생성

```yaml
# nodeconfig.yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: ap-northeast-2  # 서울 리전

  # SSM을 사용한 하이브리드 노드 구성
  hybrid:
    ssm:
      activationCode: "YOUR-ACTIVATION-CODE"
      activationId: "YOUR-ACTIVATION-ID"

  # Containerd 구성 (Harbor 레지스트리 설정)
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

  # Kubelet 설정
  kubelet:
    config:
      shutdownGracePeriod: 30s
      maxPods: 110
    flags:
      - --node-labels=node-type=hybrid,registry=harbor
```

### 인증서 설치

```bash
# CA 인증서를 시스템 신뢰 저장소에 추가
sudo cp ca.crt /usr/local/share/ca-certificates/harbor-ca.crt
sudo update-ca-certificates

# Containerd용 인증서 디렉토리 생성
sudo mkdir -p /etc/containerd/certs.d/harbor.yourdomain.com

# 인증서 복사
sudo cp ca.crt /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt

# Containerd 재시작
sudo systemctl restart containerd
```

### 노드 초기화

```bash
# NodeConfig를 사용하여 노드 초기화
sudo nodeadm init --config-source file://nodeconfig.yaml

# 노드 상태 확인
kubectl get nodes
```

## Harbor와 EKS 통합

### 네트워크 구성

```bash
# Harbor 보안 그룹에 EKS 노드 액세스 허용
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

### CoreDNS 구성

```yaml
# CoreDNS ConfigMap 수정
kubectl edit configmap coredns -n kube-system

# 다음 내용 추가
data:
  Corefile: |
    .:53 {
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          fallthrough in-addr.arpa ip6.arpa
        }
        # Harbor DNS 추가
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

### Kubernetes Secret 생성

```bash
# Docker 로그인 테스트
docker login harbor.yourdomain.com
Username: robot$k8s-robot
Password: YOUR-ROBOT-TOKEN

# Kubernetes Secret 생성
kubectl create secret docker-registry harbor-registry \
  --docker-server=harbor.yourdomain.com \
  --docker-username='robot$k8s-robot' \
  --docker-password='YOUR-ROBOT-TOKEN' \
  --docker-email=admin@yourdomain.com

# 모든 네임스페이스에 Secret 복사 (선택사항)
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get secret harbor-registry -o yaml | \
    sed "s/namespace: default/namespace: $ns/" | \
    kubectl apply -f -
done
```

### 테스트 및 검증

```bash
# 1. 네트워크 연결 확인
curl -k https://harbor.yourdomain.com/api/v2.0/health

# 2. 노드에서 직접 이미지 풀 테스트
sudo crictl pull harbor.yourdomain.com/library/nginx:latest

# 3. Kubernetes Pod 배포 테스트
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

# 4. Pod 상태 확인
kubectl get pod harbor-test
kubectl describe pod harbor-test
```

## GPU 서버 통합

### H100 GPU 서버 통합

**검증 목표**: H100 GPU 서버 10대를 EKS Hybrid Node로 통합

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

#### GPU 테스트

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

### 온프레미스 스토리지 접근

#### NFS 마운트 테스트

```bash
# AWS 워커노드에서 실행
sudo mount -t nfs -o vers=4.1,rsize=1048576,wsize=1048576 \
  192.168.1.100:/export/data /mnt/onprem-storage

# 성능 측정
dd if=/dev/zero of=/mnt/onprem-storage/testfile bs=1M count=1000 oflag=direct
```

#### PersistentVolume 구성

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

## 비용 분석 및 최적화

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

#### 1. 하이브리드 워크로드 분산

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

#### 2. Cluster Autoscaler 구성

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

#### 3. 비용 모니터링

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

### 워크로드 분산 전략

**온프레미스 GPU 워커:**

- AI/ML 훈련 워크로드
- 고성능 추론 서비스
- 데이터 집약적 처리

**AWS CPU 워커:**

- 웹 애플리케이션 및 API
- 마이크로서비스
- 경량 배치 작업

## 동적 리소스 할당 (DRA)

:::info DRA란?
동적 리소스 할당(DRA)은 Kubernetes 1.26에서 도입된 기능으로, Pod이 요청할 때 GPU, NPU, 특수 가속기 등의 리소스를 동적으로 할당할 수 있게 합니다. 이는 기존의 정적 리소스 할당 방식을 개선하여 더 효율적인 리소스 활용을 가능하게 합니다.
:::

### DRA 활성화

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

### DRA Driver 배포

```bash
# DRA driver helm repository 추가
helm repo add dra-driver https://charts.dra.io
helm repo update

# DRA driver 설치
helm install dra-driver dra-driver/dra-driver \
  --namespace kube-system \
  --set driver.name=eks-hybrid-dra \
  --set driver.enableGPU=true \
  --set driver.enableCPU=true
```

### Resource Class 정의

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

### Resource Claim 구성

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

### ML Training Job 예제

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

### DRA 모니터링

:::tip 주요 메트릭
DRA 성능을 위해 다음 메트릭을 모니터링하세요:

- `dra_allocation_duration_seconds` - 리소스 할당 소요 시간
- `dra_allocation_errors_total` - 실패한 할당 시도
- `dra_resource_utilization_ratio` - 리소스 사용 효율성
- `dra_pending_claims_total` - 스케줄되지 않은 리소스 클레임
:::

## 운영 및 유지보수

### 보안 강화

```bash
# Harbor 취약점 스캔 자동화 활성화
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

# 이미지 서명 정책 구성 (Notary)
export DOCKER_CONTENT_TRUST=1
export DOCKER_CONTENT_TRUST_SERVER=https://harbor.yourdomain.com:4443
```

### 백업 및 복구

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. Harbor 구성 백업
cp -r /data/harbor $BACKUP_DIR/

# 2. 데이터베이스 백업
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. 레지스트리 데이터 백업 (선택사항)
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "Backup completed: $BACKUP_DIR"
```

### 모니터링

#### Prometheus 메트릭 수집

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

#### 주요 모니터링 지표

- Registry 요청 비율
- 인증 실패 횟수
- 스토리지 사용량
- 데이터베이스 연결 수
- API 응답 시간

### 성능 검증

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

### 문제 해결

#### ImagePullBackOff 오류

```bash
# 문제 진단
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# Secret 확인
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d
```

#### 인증서 오류

```bash
# 모든 노드에 CA 인증서 설치
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

#### DNS 해결 실패

```bash
# DNS 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# CoreDNS 로그 확인
kubectl logs -n kube-system -l k8s-app=kube-dns

# CoreDNS 재시작
kubectl rollout restart deployment coredns -n kube-system
```

## 결론

EKS Hybrid Nodes는 온프레미스와 클라우드를 아우르는 통합 Kubernetes 환경을 제공합니다. 이 가이드에서 다룬 주요 성공 요인:

1. **적절한 네트워킹 구성**: 전체 Pod CIDR 방화벽 등록 및 양방향 DNS 구성
2. **인증서 관리**: 자체 서명 인증서 사용 시 모든 노드에 CA 인증서 설치
3. **비용 최적화**: 워크로드 특성에 따른 하이브리드 분산 전략 수립
4. **동적 리소스 할당**: DRA를 활용한 효율적인 GPU 리소스 관리
5. **지속적인 검증**: 각 단계별 테스트를 통한 구성 검증

도입 전 다음 사항을 우선적으로 검토하세요:

- Direct Connect를 통한 저지연 연결 확보
- H100 GPU 서버의 높은 vCPU 비용 최적화 전략
- PoC를 통한 실제 환경 성능 및 안정성 확인

---

### 참고 자료

- [Amazon EKS Hybrid Nodes 공식 문서](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes.html)
- [EKS Hybrid Nodes 가격 책정](https://aws.amazon.com/eks/pricing/)
- [Harbor 2.13 릴리스 노트](https://github.com/goharbor/harbor/releases/tag/v2.13.2)
- [Kubernetes DRA KEP](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/3063-dynamic-resource-allocation)
- [NVIDIA GPU Operator 문서](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/overview.html)
