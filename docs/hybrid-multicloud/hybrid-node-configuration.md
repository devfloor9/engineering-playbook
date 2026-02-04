---
title: "EKS Hybrid Node Configuration Guide"
description: "Comprehensive configuration guide for EKS Hybrid Nodes covering architecture, prerequisites, installation steps, and integration with Harbor private registry."
tags: [eks, hybrid-nodes, nodeadm, kubernetes, harbor, containerd, configuration]
category: "hybrid-multicloud"
date: 2025-02-04
authors: [devfloor9]
sidebar_position: 6
---

# EKS Hybrid Node Configuration Guide

## Table of Contents

- Hybrid Node 아키텍처 및 동작 방식
- Hybrid Node 사전 준비
- 설치 가이드
- 주요 구성
  - Bursting Architecture (on-prem to cloud)
  - Pod to Pod Communication (across DX)

## 개요

이 가이드는 Harbor 2.13과 EKS Hybrid Nodes (Kubernetes 1.33)를 통합하는 단계별 구성 방법을 제공합니다. 2024년 12월 정식 출시된 EKS Hybrid Nodes는 온프레미스 인프라와 AWS EKS를 통합 관리할 수 있게 해주며, Harbor 2.13은 향상된 보안 기능과 AI 모델 관리 기능을 제공합니다.

## Part 1: Harbor Private Repository 설치 및 구성

### Step 1: Harbor 2.13 설치 준비

#### 시스템 요구사항 확인

- Docker Engine 20.10.10+
- Docker Compose 2.0+
- 최소 하드웨어: 2 CPU cores, 4GB RAM
- 지원 OS: Ubuntu 20.04/22.04, RHEL 8/9, CentOS 7/8

#### Harbor 2.13.2 다운로드

```bash
# Harbor 2.13.2 다운로드 (최신 안정 버전)
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# 압축 해제
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### Step 2: SSL/TLS 인증서 구성

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

### Step 3: Harbor 구성 파일 설정

#### harbor.yml 수정

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

### Step 4: Harbor 설치 실행

```bash
# 설치 준비 스크립트 실행
sudo ./prepare

# Harbor 설치 (Trivy 포함)
sudo ./install.sh --with-trivy

# 설치 확인
docker-compose ps
```

### Step 5: Harbor 사용자 인증 구성

#### LDAP 인증 설정 (선택사항)

```bash
# API를 통한 LDAP 구성
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

#### Robot Account 생성 (Kubernetes 연동용)

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

## Part 2: EKS Hybrid Nodes 구성

### Step 6: nodeadm 설치 및 준비

#### nodeadm 다운로드

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

#### 필수 구성 요소 설치

```bash
# Kubernetes 1.33 지원 컴포넌트 설치
sudo nodeadm install 1.33 --credential-provider ssm

# 또는 IAM Roles Anywhere 사용시
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### Step 7: NodeConfig 파일 생성

#### Harbor 통합을 위한 NodeConfig 작성

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

### Step 8: 인증서 설치

#### Harbor CA 인증서를 노드에 설치

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

### Step 9: 노드 초기화

```bash
# NodeConfig를 사용하여 노드 초기화
sudo nodeadm init --config-source file://nodeconfig.yaml

# 노드 상태 확인
kubectl get nodes
```

## Part 3: Harbor와 EKS 통합

### Step 10: 네트워크 구성

#### 보안 그룹 설정

```bash
# Harbor 보안 그룹에 EKS 노드 액세스 허용
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

#### DNS 구성

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

### Step 11: Kubernetes Secret 생성

#### Harbor 인증 정보 Secret 생성

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

#### ServiceAccount에 ImagePullSecret 추가

```bash
# 기본 ServiceAccount 수정
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "harbor-registry"}]}'

# 또는 YAML로 정의
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

### Step 12: 테스트 및 검증

#### 연결 테스트

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

### Step 13: 문제 해결

#### 일반적인 문제와 해결 방법

**1. ImagePullBackOff 오류**

```bash
# 문제 진단
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# Secret 확인
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d

# 해결 방법
# - Secret 재생성
# - 이미지 이름 및 태그 확인
# - Harbor 프로젝트 접근 권한 확인
```

**2. 인증서 오류 (x509: certificate signed by unknown authority)**

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

**3. DNS 해결 실패**

```bash
# DNS 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# CoreDNS 로그 확인
kubectl logs -n kube-system -l k8s-app=kube-dns

# 해결 방법: CoreDNS 재시작
kubectl rollout restart deployment coredns -n kube-system
```

## Part 4: 운영 및 유지보수

### Step 14: 보안 강화

#### Harbor 보안 정책 설정

```bash
# 취약점 스캔 자동화 활성화
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

### Step 15: 백업 및 복구

#### Harbor 백업 스크립트

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. Harbor 구성 백업
cp -r /data/harbor $BACKUP_DIR/

# 2. 데이터베이스 백업
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. 레지스트리 데이터 백업 (선택사항 - 크기가 클 수 있음)
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "Backup completed: $BACKUP_DIR"
```

### Step 16: 모니터링

#### Prometheus 메트릭 수집

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

#### 주요 모니터링 지표

- Registry 요청 비율
- 인증 실패 횟수
- 스토리지 사용량
- 데이터베이스 연결 수
- API 응답 시간

## 결론

이 가이드는 Harbor 2.13과 EKS Hybrid Nodes (Kubernetes 1.33)의 통합 구성을 단계별로 설명했습니다. 주요 성공 요인은:

1. **적절한 인증서 관리**: 자체 서명 인증서 사용 시 모든 노드에 CA 인증서 설치
2. **네트워크 구성**: Harbor와 EKS 노드 간 안전한 통신 경로 확보
3. **인증 설정**: Robot Account를 통한 자동화된 인증 구성
4. **지속적인 검증**: 각 단계별 테스트를 통한 구성 검증

Harbor 2.13의 향상된 기능과 EKS Hybrid Nodes의 유연성을 활용하면, 온프레미스와 클라우드를 아우르는 통합 컨테이너 관리 환경을 구축할 수 있습니다.
