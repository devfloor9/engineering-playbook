---
title: Harbor 2.15 and EKS Hybrid Nodes Integration Guide
description: A complete step-by-step guide for integrating the Harbor 2.15 private container registry with Amazon EKS Hybrid Nodes (Kubernetes 1.33), covering installation, SSL/TLS configuration, authentication, and troubleshooting.
created: "2025-08-20"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 8
tags:
  - eks
  - hybrid-node
  - harbor
  - container-registry
  - kubernetes
  - ssl-tls
  - nodeadm
  - scope:impl
sidebar_label: Harbor Registry
category: hybrid-multicloud
---

## Overview

This guide provides step-by-step configuration instructions for integrating Harbor 2.15 with EKS Hybrid Nodes (Kubernetes 1.33). EKS Hybrid Nodes, generally available since December 2024, enables unified management of on-premises infrastructure and AWS EKS, while Harbor 2.15 provides enhanced security features and AI model management capabilities.

## Part 1: Harbor Private Repository Installation and Configuration

### Step 1: Prepare the Harbor 2.15 Installation

#### Verify System Requirements

- Docker Engine 20.10.10+
- Docker Compose 2.0+
- Minimum hardware: 2 CPU cores, 4GB RAM
- Supported OS: Ubuntu 22.04/24.04, RHEL 8/9

#### Download Harbor 2.15.x

```bash
# Download Harbor 2.15.x (current stable version)
wget https://github.com/goharbor/harbor/releases/download/v2.15.1/harbor-offline-installer-v2.15.1.tgz

# Extract the archive
tar xvf harbor-offline-installer-v2.15.1.tgz
cd harbor
```

### Step 2: Configure SSL/TLS Certificates

#### Generate Self-Signed Certificates

```bash
# 1. Generate the CA certificate
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrganization/CN=Harbor-CA"

# 2. Generate the server certificate
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrganization/CN=harbor.yourdomain.com"

# 3. Create the v3.ext file (SAN configuration)
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

# 4. Sign the certificate
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

# 5. Create the certificate directory and copy certificates
mkdir -p /data/cert
cp harbor.crt /data/cert/
cp harbor.key /data/cert/
```

### Step 3: Configure the Harbor Configuration File

#### Edit harbor.yml

```bash
# Copy and edit the harbor.yml file
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

Key configuration settings:

```yaml
# Hostname configuration
hostname: harbor.yourdomain.com

# HTTPS configuration
https:
  port: 443
  certificate: /data/cert/harbor.crt
  private_key: /data/cert/harbor.key

# Harbor admin password (change immediately after deployment)
harbor_admin_password: CHANGE_ME_AFTER_INSTALL

# Database configuration (change to a strong password + rotate regularly)
database:
  password: CHANGE_DB_PASSWORD
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0

# Data storage path
data_volume: /data

# Log configuration
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

### Step 4: Run the Harbor Installation

```bash
# Run the installation preparation script
sudo ./prepare

# Install Harbor (with Trivy)
sudo ./install.sh --with-trivy

# Verify the installation
docker-compose ps
```

### Step 5: Configure Harbor User Authentication

#### LDAP Authentication Setup (Optional)

```bash
# Configure LDAP via the API
curl -X PUT "https://harbor.yourdomain.com/api/v2.0/configurations" \
  -H "Content-Type: application/json" \
  -u "admin:YOUR_ADMIN_PASSWORD" \
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

#### Create a Robot Account (for Kubernetes Integration)

```bash
# Create in the Harbor UI or use the API
curl -X POST "https://harbor.yourdomain.com/api/v2.0/robots" \
  -H "Content-Type: application/json" \
  -u "admin:YOUR_ADMIN_PASSWORD" \
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

### Step 6: Install and Prepare nodeadm

Download the nodeadm binary and install the components that support Kubernetes 1.33. For the credential provider, choose either SSM (Systems Manager) or IAM Roles Anywhere. For the nodeadm installation procedure and credential provider selection criteria, refer to [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md) and [Node Authentication Methods](../security-authn/node-authentication.md).

### Step 7: Create the NodeConfig File

#### Write a NodeConfig for Harbor Integration

```yaml
# nodeconfig.yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: ap-northeast-2  # Seoul region

  # Hybrid node configuration using SSM
  hybrid:
    ssm:
      activationCode: "YOUR-ACTIVATION-CODE"
      activationId: "YOUR-ACTIVATION-ID"

  # Containerd configuration (Harbor registry settings)
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

### Step 8: Install Certificates

#### Install the Harbor CA Certificate on Nodes

```bash
# Add the CA certificate to the system trust store
sudo cp ca.crt /usr/local/share/ca-certificates/harbor-ca.crt
sudo update-ca-certificates

# Create the certificate directory for containerd
sudo mkdir -p /etc/containerd/certs.d/harbor.yourdomain.com

# Copy the certificate
sudo cp ca.crt /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt

# Restart containerd
sudo systemctl restart containerd
```

### Step 9: Initialize the Node

```bash
# Initialize the node using the NodeConfig
sudo nodeadm init --config-source file://nodeconfig.yaml

# Check node status
kubectl get nodes
```

## Part 3: Harbor and EKS Integration

### Step 10: Network Configuration

#### Security Group Setup

```bash
# Allow EKS node access in the Harbor security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-harbor-xxxxx \
  --protocol tcp \
  --port 443 \
  --source-group sg-eks-nodes-xxxxx \
  --region ap-northeast-2
```

#### DNS Configuration

```yaml
# Edit the CoreDNS ConfigMap
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

### Step 11: Create Kubernetes Secrets

#### Create a Secret for Harbor Credentials

```bash
# Test Docker login
docker login harbor.yourdomain.com
Username: robot$k8s-robot
Password: YOUR-ROBOT-TOKEN

# Create the Kubernetes Secret
kubectl create secret docker-registry harbor-registry \
  --docker-server=harbor.yourdomain.com \
  --docker-username='robot$k8s-robot' \
  --docker-password='YOUR-ROBOT-TOKEN' \
  --docker-email=admin@yourdomain.com

# Copy the Secret to all namespaces (optional)
for ns in $(kubectl get ns -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get secret harbor-registry -o yaml | \
    sed "s/namespace: default/namespace: $ns/" | \
    kubectl apply -f -
done
```

#### Add the ImagePullSecret to a ServiceAccount

```bash
# Patch the default ServiceAccount
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "harbor-registry"}]}'

# Or define it in YAML
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

#### Connectivity Tests

```bash
# 1. Verify network connectivity
curl -k https://harbor.yourdomain.com/api/v2.0/health

# 2. Test pulling an image directly on the node
sudo crictl pull harbor.yourdomain.com/library/nginx:latest

# 3. Test deploying a Kubernetes Pod
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

# 4. Check Pod status
kubectl get pod harbor-test
kubectl describe pod harbor-test
```

### Step 13: Troubleshooting

#### Common Issues and Solutions

**1. ImagePullBackOff Error**

```bash
# Diagnose the issue
kubectl describe pod <pod-name>
kubectl get events --field-selector involvedObject.name=<pod-name>

# Check the Secret
kubectl get secret harbor-registry -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d

# Solutions
# - Recreate the Secret
# - Verify the image name and tag
# - Verify Harbor project access permissions
```

**2. Certificate Error (x509: certificate signed by unknown authority)**

```bash
# Install the CA certificate on all nodes
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

# Solution: restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

## Part 4: Operations and Maintenance

### Step 14: Security Hardening

#### Configure Harbor Security Policies

```bash
# Enable automated vulnerability scanning
curl -X PUT "https://harbor.yourdomain.com/api/v2.0/projects/1" \
  -H "Content-Type: application/json" \
  -u "admin:YOUR_ADMIN_PASSWORD" \
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

# 1. Back up the Harbor configuration
cp -r /data/harbor $BACKUP_DIR/

# 2. Back up the database
docker exec harbor-db pg_dump -U postgres registry > $BACKUP_DIR/registry.sql

# 3. Back up the registry data (optional - can be large)
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

This guide walked through the integration of Harbor 2.15 with EKS Hybrid Nodes (Kubernetes 1.33) step by step. The key success factors are:

1. **Proper certificate management**: When using self-signed certificates, install the CA certificate on all nodes
2. **Network configuration**: Establish a secure communication path between Harbor and EKS nodes
3. **Authentication setup**: Configure automated authentication through Robot Accounts
4. **Continuous validation**: Verify the configuration through testing at each step

By leveraging the enhanced capabilities of Harbor 2.15 and the flexibility of EKS Hybrid Nodes, a unified container management environment spanning on-premises and the cloud can be built.

## References

### Official Documentation
- [Harbor Documentation](https://goharbor.io/docs/) — Official documentation for the Harbor private registry
- [Harbor GitHub Repository](https://github.com/goharbor/harbor) — Harbor open-source project repository
- [Amazon EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Official EKS Hybrid Nodes user guide
- [Trivy Vulnerability Scanner](https://github.com/aquasecurity/trivy) — Vulnerability scanner integrated with Harbor

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes architecture and nodeadm components
- [Node Authentication Methods](../security-authn/node-authentication.md) — Selection criteria for SSM and IAM Roles Anywhere credential providers
- [Firewall and Network Connectivity](../networking/firewall-connectivity.md) — Private registry pre-registration strategy in FQDN-restricted environments
- [File Storage](./file-storage.md) — Storage options for EKS Hybrid Nodes
