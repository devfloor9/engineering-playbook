---
title: "Harbor 2.13 and EKS Hybrid Nodes Integration Guide"
sidebar_label: "Harbor Registry"
description: "Complete step-by-step guide for integrating Harbor 2.13 private container registry with Amazon EKS Hybrid Nodes (Kubernetes 1.33), covering installation, SSL/TLS configuration, authentication, and troubleshooting"
tags: [eks, hybrid-nodes, harbor, container-registry, kubernetes, ssl-tls, nodeadm]
category: "hybrid-multicloud"
date: 2025-08-20
authors: [devfloor9]
sidebar_position: 5
---

# Harbor 2.13 and EKS Hybrid Nodes Integration Guide

## Overview

This guide provides step-by-step configuration methods for integrating Harbor 2.13 with EKS Hybrid Nodes (Kubernetes 1.33). EKS Hybrid Nodes, officially released in December 2024, enables integrated management of on-premises infrastructure with AWS EKS, while Harbor 2.13 provides enhanced security features and AI model management capabilities.

## Part 1: Harbor Private Repository Installation and Configuration

### Step 1: Harbor 2.13 Installation Preparation

#### System Requirements

- Docker Engine 20.10.10+
- Docker Compose 2.0+
- Minimum hardware: 2 CPU cores, 4GB RAM
- Supported OS: Ubuntu 20.04/22.04, RHEL 8/9, CentOS 7/8

#### Download Harbor 2.13.2

```bash
# Download Harbor 2.13.2 (latest stable version)
wget https://github.com/goharbor/harbor/releases/download/v2.13.2/harbor-offline-installer-v2.13.2.tgz

# Extract archive
tar xvf harbor-offline-installer-v2.13.2.tgz
cd harbor
```

### Step 2: SSL/TLS Certificate Configuration

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

### Step 3: Harbor Configuration File Setup

#### Modify harbor.yml

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

### Step 4: Harbor Installation

```bash
# Run installation preparation script
sudo ./prepare

# Install Harbor (with Trivy)
sudo ./install.sh --with-trivy

# Verify installation
docker-compose ps
```

### Step 5: Harbor User Authentication Configuration

#### LDAP Authentication Setup (Optional)

```bash
# Configure LDAP via API
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

#### Create Robot Account (for Kubernetes integration)

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

## Part 2: EKS Hybrid Nodes Configuration

### Step 6: nodeadm Installation and Preparation

#### Download nodeadm

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

#### Install Required Components

```bash
# Install Kubernetes 1.33 supporting components
sudo nodeadm install 1.33 --credential-provider ssm

# Or when using IAM Roles Anywhere
# sudo nodeadm install 1.33 --credential-provider iam-ra
```

### Step 7: Create NodeConfig File

#### Write NodeConfig for Harbor Integration

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

### Step 8: Install Certificate

#### Install Harbor CA Certificate on Node

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

### Step 9: Node Initialization

```bash
# Initialize node using NodeConfig
sudo nodeadm init --config-source file://nodeconfig.yaml

# Verify node status
kubectl get nodes
```

## Part 3: Harbor and EKS Integration

### Step 10: Network Configuration

#### Configure Security Groups

```bash
# Allow EKS nodes to access Harbor security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

#### DNS Configuration

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

### Step 11: Create Kubernetes Secret

#### Create Harbor Authentication Secret

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

#### Add ImagePullSecret to ServiceAccount

```bash
# Modify default ServiceAccount
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "harbor-registry"}]}'

# Or define via YAML
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

### Step 12: Testing and Validation

#### Connection Test

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

### Step 13: Troubleshooting

#### Common Issues and Solutions

**1. ImagePullBackOff Error**

```bash
# Diagnose problem
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# Check Secret
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d

# Solution
# - Recreate Secret
# - Verify image name and tag
# - Check Harbor project access permissions
```

**2. Certificate Error (x509: certificate signed by unknown authority)**

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

**3. DNS Resolution Failure**

```bash
# Test DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup harbor.yourdomain.com

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns

# Solution: Restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

## Part 4: Operations and Maintenance

### Step 14: Security Hardening

#### Configure Harbor Security Policies

```bash
# Enable vulnerability scan automation
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

### Step 15: Backup and Recovery

#### Harbor Backup Script

```bash
#!/bin/bash
# harbor-backup.sh

BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 1. Backup Harbor configuration
cp -r /data/harbor $BACKUP_DIR/

# 2. Backup database
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. Backup registry data (optional - can be large)
tar -czf $BACKUP_DIR/registry-data.tar.gz /data/registry

echo "Backup completed: $BACKUP_DIR"
```

### Step 16: Monitoring

#### Prometheus Metrics Collection

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

#### Key Monitoring Metrics

- Registry request rate
- Authentication failure count
- Storage usage
- Database connection count
- API response time

## Conclusion

This guide described step-by-step integration configuration of Harbor 2.13 and EKS Hybrid Nodes (Kubernetes 1.33). Key success factors are:

1. **Proper Certificate Management**: When using self-signed certificates, install CA certificate on all nodes
2. **Network Configuration**: Secure communication path between Harbor and EKS nodes
3. **Authentication Setup**: Automated authentication configuration through Robot Account
4. **Continuous Validation**: Configuration validation through step-by-step testing

By leveraging Harbor 2.13's enhanced features and EKS Hybrid Nodes' flexibility, you can build an integrated container management environment spanning on-premises and cloud.
