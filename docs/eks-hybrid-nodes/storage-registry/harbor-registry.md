---
title: Harbor 2.15 and EKS Hybrid Nodes Integration Guide
description: Configuration guidance separating DNS, TLS trust, containerd setup, project credentials and recovery verification for Harbor and EKS Hybrid Nodes
created: "2025-08-20"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 31
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

A Hybrid Node must resolve the Harbor hostname, trust its server certificate and receive credentials for the required image. This guide checks those three paths separately.

Harbor 2.15.1 and Kubernetes 1.33 are versions from the existing example, not a latest-version recommendation or a record of completed deployment. The 2026-09-19 review compared configuration examples with official documentation; it did not install Harbor, restart nodes, pull images or test recovery. Select a supported Harbor, nodeadm, OS, containerd, EKS and CNI combination before applying it.

The examples prepare a separate Harbor host and a **Hybrid Node that has not yet joined the cluster**. Changes to an existing node's runtime require a separate maintenance procedure. Replace the hostname, account, region, namespace and image with the intended environment's values.

## Part 1: Harbor Private Repository Installation and Configuration

### Step 1: Prepare the Harbor 2.15 Installation

#### Verify System Requirements

Harbor 2.15's Compose prerequisites specify Docker Engine >20.10, Docker Compose >2.3 and at least two CPUs, 4 GB memory and 40 GB disk. These are installation minima; size production capacity for artifact retention, concurrent pulls and scanning.

Harbor host Docker/OS support differs from Hybrid Node OS support. Check the selected releases rather than assuming compatibility from an OS name. Prepare HTTPS 443, DNS, authentication-server access and scanner database updates.

#### Download Harbor 2.15.x

```bash
# Pinned example release; verify its release checksum before extraction.
wget https://github.com/goharbor/harbor/releases/download/v2.15.1/harbor-offline-installer-v2.15.1.tgz

# Extract the archive
tar xvf harbor-offline-installer-v2.15.1.tgz
cd harbor
```

### Step 2: Configure SSL/TLS Certificates

#### Generate Self-Signed Certificates

This private-CA example is for an isolated test environment. Run the generation and signing commands on a protected issuance host separate from Harbor. Match SANs to the actual DNS/IP and keep the CA private key off registry and node hosts. Use the organization’s issuance and renewal process in production. Harbor administration and image-pull clients also need trust in the CA certificate.

```bash
umask 077
# 1. Generate the CA certificate
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=US/ST=Washington/L=Seattle/O=MyOrganization/CN=Harbor-CA"

# 2. Generate the server certificate
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=US/ST=Washington/L=Seattle/O=MyOrganization/CN=harbor.yourdomain.com"

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

```

After signing, transfer only `harbor.crt` and `harbor.key` to Harbor over a protected channel. Keep the CA private key on the issuance host and distribute public `ca.crt` separately for client trust. Run the following on the Harbor host to install the server certificate and key.

```bash
# Install only the server certificate and key on the Harbor host
sudo install -d -m 0750 /data/cert
sudo install -m 0644 harbor.crt /data/cert/harbor.crt
sudo install -m 0600 harbor.key /data/cert/harbor.key
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

# Set a unique generated secret before the first start.
harbor_admin_password: REPLACE_WITH_GENERATED_ADMIN_SECRET

# Database configuration (change to a strong password + rotate regularly)
database:
  password: REPLACE_WITH_GENERATED_DATABASE_SECRET
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

Replace every `REPLACE_WITH_...` value with distinct secrets before installation. Restrict `harbor.yml` to its owner and keep it out of Git. `harbor_admin_password` initializes the first startup; changing this file alone does not rotate an existing administrator password.

### Step 4: Run the Harbor Installation

The offline installer's `install.sh` loads the bundled images before running preparation. Do not invoke `prepare` first on a fresh host.

```bash
# Install Harbor (with Trivy)
sudo ./install.sh --with-trivy

# Verify the installation
docker compose ps
```

### Step 5: Configure Harbor User Authentication

#### LDAP Authentication Setup (Optional)

Configure LDAP under Administration → Configuration → Authentication. Use `ldaps://`, a trusted server certificate and certificate verification. Give the search identity only the directory-read permissions it needs; do not reuse an administrator password.

Define Base DN, UID, filters and groups. Use Test LDAP Server, then test allowed/denied logins and project permissions. Switching from database authentication to LDAP is supported only when there are no local users other than `admin`; plan identity migration first for an existing installation.

#### Create a Robot Account (for Kubernetes Integration)

Create the application project and a project-scoped robot account with repository pull permission. Image pulls do not require push, delete or all-project access. Define expiry and a rotation owner.

Store the **full returned account name and secret** in the secret store. The prefix is configurable; do not construct a name such as `robot$k8s-robot` from assumptions. Capture the new secret at creation. For an overlapping rotation, create a new robot account, update the Kubernetes Secret, verify pulls from new Pods, then retire the old account. Do not assume that refreshing one account’s secret leaves both old and new secrets valid.

## Part 2: EKS Hybrid Nodes Configuration

### Step 6: Install and Prepare nodeadm

Install nodeadm, OS and containerd versions supported by the selected EKS release, then check `containerd --version` and installation logs. Kubernetes version alone does not determine the containerd configuration format. SSM or IAM Roles Anywhere node authentication, cluster access, CNI and network prerequisites are separate from Harbor credentials.

Complete preparation for the new node using the [official nodeadm reference](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-nodeadm.html) and [node authentication guide](../security-authn/node-authentication.md).

### Step 7: Create the NodeConfig File

#### Write a NodeConfig for Harbor Integration

This example preserves nodeadm's containerd defaults. The reviewed [nodeadm template](https://github.com/aws/eks-hybrid/blob/20aace438668970fee38a1b053836c59fd5cfd72/internal/containerd/config.template.toml) already reads `/etc/containerd/certs.d`, so it needs no Harbor runtime override. Confirm that path in the installed nodeadm version and generated configuration. Replace SSM values for the intended node enrollment and restrict file permissions. Pass robot secrets through a namespace-scoped imagePullSecret, not NodeConfig.

```yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: us-west-2
  hybrid:
    ssm:
      activationCode: "REPLACE_WITH_ACTIVATION_CODE"
      activationId: "REPLACE_WITH_ACTIVATION_ID"
  kubelet:
    flags:
      - --node-labels=node-type=hybrid,registry=harbor
```

Do not choose the TOML format from the containerd binary's major version alone. The reviewed nodeadm generates a **version 2 base file** and places custom TOML in a separate import.

```toml
# Excerpt from the reviewed nodeadm-generated configuration, not a replacement file.
version = 2
[plugins."io.containerd.grpc.v1.cri".registry]
  config_path = "/etc/containerd/certs.d:/etc/docker/certs.d"
```

containerd 2.x can migrate this v2 base configuration when reading it. Importing a v3 fragment into that v2 base cannot be assumed to preserve migration of runtime and CNI defaults. The [containerd import rules](https://github.com/containerd/containerd/blob/v2.1.4/docs/man/containerd-config.toml.5.md) require the import version not to exceed the base version. For other defaults, verify the complete base file, imports, versions, plugin paths, and certificate directories together; do not replace the complete file with a short fragment.

### Step 8: Install Certificates

#### Install the Harbor CA Certificate on Nodes

Install the CA certificate at `/etc/containerd/certs.d/harbor.yourdomain.com/ca.crt` on the new node and place this `hosts.toml` beside it. Neither the CA private key nor robot tokens belong in this directory.

```toml
# /etc/containerd/certs.d/harbor.yourdomain.com/hosts.toml
server = "https://harbor.yourdomain.com"
[host."https://harbor.yourdomain.com"]
  capabilities = ["pull", "resolve"]
  ca = "/etc/containerd/certs.d/harbor.yourdomain.com/ca.crt"
```

Configure trust separately for other clients. Ubuntu-family systems use `/usr/local/share/ca-certificates/` and `update-ca-certificates`; RHEL-family systems use `/etc/pki/ca-trust/source/anchors/` and `update-ca-trust`. Follow the selected OS procedure. Docker registry trust is separate from containerd configuration.

Containerd documents that updates within the hosts directory do not require a daemon restart. Base runtime changes such as `config_path` require separate application. If an existing node needs a restart, first define single-node draining, spare capacity and recovery, and retain its original configuration.

### Step 9: Initialize the Node

Validate configuration on the new node before enrollment. Passing `config check` does not establish cluster connectivity or successful image pulls.

```bash
sudo nodeadm config check --config-source file://nodeconfig.yaml
sudo nodeadm init --config-source file://nodeconfig.yaml
```

After enrollment, check that node's readiness, CNI, `node-type=hybrid`/`registry=harbor` labels and effective containerd configuration. Investigate nodeadm, kubelet and containerd logs on failure rather than skipping validation.

## Part 3: Harbor and EKS Integration

### Step 10: Network Configuration

#### Security Group Setup

First identify where Harbor is hosted. For EC2 hosting, permit TCP 443 from the actual observed Hybrid Node source CIDRs in the registry security group, and check VPC/on-premises routes, firewalls and the return path. NAT can change source addresses.

An EC2 source-security-group rule applies to interfaces associated with that group. It does not automatically authorize on-premises nodes outside the group. For on-premises Harbor, define access in the relevant network and host firewalls.

#### DNS Configuration

Containerd pulls images from the node, so first verify **hostname resolution by the node OS**. Configure corporate DNS records and forwarding as needed. Successful lookup inside a Pod does not establish that the host resolver follows the same path.

Run these checks on the Hybrid Node where the CA was installed.

```bash
getent hosts harbor.yourdomain.com
curl --fail --show-error --cacert /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt \
  https://harbor.yourdomain.com/api/v2.0/health
```

Handle CoreDNS separately if Pods need additional name resolution. Do not replace the entire Corefile for this integration; preserve existing plugins, including `ready` required by EKS configurations.

### Step 11: Create Kubernetes Secrets

#### Create a Secret for Harbor Credentials

This example creates the initial Secret in an existing `app` namespace. First check Python 3 on the administrator client, the cluster context, and permission to create Secrets in that namespace. Run it as a **separate Bash script**: it prompts for the robot name and token, creates an owner-readable temporary Docker-format file, keeps secrets out of arguments and logs, and removes the file on exit.

Docker login can automatically select a credential helper and store credentials in an external keychain. Instead of copying such a `config.json`, this example writes the `auths` entry that Kubernetes needs. It rejects empty inputs and an invalid username; the subsequent image-pull test must establish whether the credentials actually work.

```bash
#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
registry_auth_dir="$(mktemp -d)"
trap 'rm -rf -- "$registry_auth_dir"' EXIT
read -r -p "Harbor robot account name: " harbor_robot
read -r -s -p "Harbor robot token: " harbor_token
printf '\n'
printf '%s\0%s' "$harbor_robot" "$harbor_token" | python3 -c '
import base64, json, sys
username, token = sys.stdin.buffer.read().split(b"\0", 1)
if not username or not token or b":" in username:
    raise SystemExit("A nonempty robot name without a colon and a token are required")
auth = base64.b64encode(username + b":" + token).decode("ascii")
json.dump({"auths": {"harbor.yourdomain.com": {"auth": auth}}}, sys.stdout)
' > "$registry_auth_dir/config.json"
unset harbor_token
kubectl -n app create secret generic harbor-registry \
  --type=kubernetes.io/dockerconfigjson \
  --from-file=.dockerconfigjson="$registry_auth_dir/config.json"
```

If the Secret exists, update that namespace through the organization's secret-management path instead of repeating creation. Do not copy it to every namespace. Kubernetes Secret base64 encoding is not encryption; manage RBAC and encryption at rest separately.

#### Add the ImagePullSecret to a ServiceAccount

Attach the Secret to a dedicated ServiceAccount in the same `app` namespace. This selects image-pull credentials; it does not grant application AWS IAM permissions.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: app
imagePullSecrets:
  - name: harbor-registry
```

### Step 12: Testing and Validation

#### Connectivity Tests

First push or import the test image into the `app` project and record its path, tag, digest and startup command. The sample `smoke:verified` image must actually exist. Pin the verified digest for production. Use the ServiceAccount above and a Hybrid Node carrying the specified labels.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: harbor-test
  namespace: app
spec:
  serviceAccountName: app-sa
  nodeSelector:
    node-type: hybrid
    registry: harbor
  restartPolicy: Never
  containers:
    - name: smoke
      image: harbor.yourdomain.com/app/smoke:verified
      imagePullPolicy: Always
```

Verify the Pod's nodeName, expected imageID digest and a fresh pull through the authenticated path. A successful pull does not establish application readiness; check container completion and logs as well. Use an approved image that is not already cached, and test expired credentials, another project and an untrusted CA as negative cases.

`curl -k` bypasses CA verification and cannot prove trust. A direct `crictl pull` does not automatically receive a Pod's imagePullSecret, so it tests a different credential path. Assign cleanup of the test Pod and other temporary resources.

### Step 13: Troubleshooting

#### Common Issues and Solutions

| Symptom | First checks |
| --- | --- |
| ImagePullBackOff | Separate DNS, TLS, 401/403 and missing-image events; check the same-namespace Secret/ServiceAccount and actual image path |
| x509 error | Node clock, server SAN/chain and effective containerd config_path/CA path |
| Name resolution failure | Start with the node OS resolver; diagnose Pod DNS separately |
| Only some nodes fail | Compare OS/containerd versions, CA/configuration, routing and actual placement |

Check Secret type, name, namespace and existence before inspecting credentials; do not decode `.dockerconfigjson` into logs. Distribute CA files through node-management tooling with explicit targets and completion tracking. Do not use a privileged host-root DaemonSet that repeatedly restarts containerd across all nodes.

For a necessary base-runtime change on existing nodes, retain the original files and define a single-node capacity, drain, validation and recovery sequence. Do not restart CoreDNS or runtimes cluster-wide before identifying the cause.

## Part 4: Operations and Maintenance

### Step 14: Security Hardening

#### Configure Harbor Security Policies

Configure scan-on-push and accepted vulnerability levels for the intended project, and verify scanner database updates and failure behavior. Do not assume project ID `1`. Define behavior for missing or stale scan results.

Notary v1 is no longer the signing path for Harbor releases from 2.9 onward. Check the selected release's Cosign/Notation support and content-trust policy. Signature storage, registry pull policy and Kubernetes admission verification are separate stages. Match signer, artifact digest and trust policy, and test rejection of modified or unsigned images.

### Step 15: Backup and Recovery

#### Harbor Backup Script

A generic sequence of `cp`, `pg_dump` and `tar` does not establish a recoverable backup. This article's Compose deployment differs from Harbor's Kubernetes/Velero example in storage layout and procedure; do not apply the same script to both.

Include configuration, certificates and secrets from the actual installation directory, the database, registry blob storage and backend configuration, and required jobservice/other state. Image data is not optional for a full restore. Coordinate recovery points with external databases or object storage where used.

1. Define treatment of writes, garbage collection, replication and in-flight jobs. Read Only alone does not guarantee application consistency.
2. Record actual volume/database locations and tool versions, and stop on any failed step. Do not mark empty dumps or partial archives successful.
3. Record backup hashes, completion time, retention, encryption and access permissions.
4. Restore in isolation; verify projects, permissions, signatures, digests and real pulls, and measure RPO/RTO.

The official Velero procedure itself documents crash-consistency, omitted Redis state and post-restore task limitations. No backup or restore was executed for this guide; environment-specific scripts remain pending until recovery is tested.

### Step 16: Monitoring

#### Prometheus Metrics Collection

Merge this `scrape_configs` fragment into the running Prometheus configuration. Creating a ConfigMap alone does not connect it to Prometheus; configure the deployment's mount/reload or Operator resources and check target status. Restrict the example HTTP endpoint on 9090 to a private monitoring path.

```yaml
scrape_configs:
  - job_name: harbor-exporter
    metrics_path: /metrics
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
  - job_name: harbor-core
    metrics_path: /metrics
    params:
      comp: [core]
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
  - job_name: harbor-registry
    metrics_path: /metrics
    params:
      comp: [registry]
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
```

Exporter data at `/metrics` differs from `comp=core` and `comp=registry`. Add `comp=jobservice` where needed. Inspect the selected version's responses, metric types and labels before defining alerts.

#### Key Monitoring Metrics

| Behavior | Evidence |
| --- | --- |
| Component health | `harbor_up`, `harbor_health` and scrape-target status |
| Project capacity | `harbor_project_quota_usage_byte` and actual storage headroom |
| Core requests | `harbor_core_http_request_total` and its duration summary |
| Registry requests/latency | `registry_http_requests_total` and duration histogram |
| Authentication failures/DB connections | Version-specific audit/log and database observations; do not assume undocumented metric names |

Counters, gauges, summaries and histograms need different aggregation. Authentication failures, service availability and successful application pulls are distinct observations.

## Conclusion

Integration is established when the intended Hybrid Node pulls the specified image with correct authentication and TLS verification and rejects invalid access. Record node DNS/CA/runtime configuration, project credentials and restore results. These examples prepare that verification; they are not evidence of a successful production run.

## References

### Official Documentation

- [Harbor 2.15 prerequisites](https://goharbor.io/docs/2.15.0/install-config/installation-prereqs/)
- [Containerd 2.1 registry host configuration](https://github.com/containerd/containerd/blob/v2.1.4/docs/hosts.md)
- [Harbor LDAP authentication](https://goharbor.io/docs/2.15.0/administration/configure-authentication/ldap-auth/)
- [Harbor backup limitations](https://goharbor.io/docs/2.15.0/administration/backup-restore/)
- [Harbor component metrics](https://goharbor.io/docs/2.15.0/administration/metrics/)
- [Harbor Documentation](https://goharbor.io/docs/) — Official documentation for the Harbor private registry
- [Harbor GitHub Repository](https://github.com/goharbor/harbor) — Harbor open-source project repository
- [Amazon EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Official EKS Hybrid Nodes user guide
- [Trivy Vulnerability Scanner](https://github.com/aquasecurity/trivy) — Vulnerability scanner integrated with Harbor

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes architecture and nodeadm components
- [Node Authentication Methods](../security-authn/node-authentication.md) — Selection criteria for SSM and IAM Roles Anywhere credential providers
- [Firewall and Network Connectivity](../networking/firewall-connectivity.md) — Private registry pre-registration strategy in FQDN-restricted environments
- [File Storage](./file-storage.md) — Storage options for EKS Hybrid Nodes
