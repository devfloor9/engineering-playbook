---
title: "Monitoring & Observability Setup Guide"
sidebar_label: "Monitoring"
description: "Hands-on setup guide for integrated monitoring with Prometheus to AMP, AMG, Langfuse, and Bifrost OTel"
created: 2026-04-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags: [monitoring, langfuse, amp, amg, prometheus, otel, deployment, 'scope:impl']
---

This document covers the **hands-on deployment procedures** for integrated monitoring with Prometheus to AMP, AMG, Langfuse, and Bifrost OTel. For architecture concepts and design principles, see [Agent Monitoring](../../operations-mlops/observability/agent-monitoring.md) and [LLMOps Observability](../../operations-mlops/observability/llmops-observability.md).

---

## Monitoring Architecture Overview

```mermaid
graph LR
    subgraph "EKS Cluster"
        Client[Aider/IDE] --> KGW[kgateway NLB]
        KGW -->|/v1/*| BF[Bifrost]
        BF --> VLLM[vLLM]
        BF -->|OTel traces| KGW2[kgateway URLRewrite]
        KGW2 -->|/api/public/otel/v1/traces| LF[Langfuse]
        VLLM -->|/metrics scrape| PROM[Prometheus]
        BF -->|:9090/metrics| PROM
        PROM -->|remote-write<br/>Pod Identity| AMP[AMP]
    end

    subgraph "AWS Managed"
        AMP -->|SigV4 ec2_iam_role| AMG[AMG Grafana]
    end

    style AMP fill:#ff9900
    style AMG fill:#ff9900
    style LF fill:#4c9aff
    style BF fill:#2ecc71
```

**Data Flow Summary**:

| Data | Path | Purpose |
|------|------|---------|
| Infrastructure Metrics | vLLM/DCGM/kgateway → Prometheus → AMP → AMG | GPU utilization, TPS, latency, error rate |
| LLM Traces | Bifrost → OTel → Langfuse | Token usage, cost, prompt quality |
| Gateway Metrics | kgateway → Prometheus → AMP | Request count, 5xx errors, upstream status |

---

## Prometheus + AMP Setup

### 2.1 Create AMP Workspace

```bash
# Create AMP workspace
aws amp create-workspace \
  --alias "vllm-inference-metrics" \
  --region ap-northeast-2

# Get workspace ID
export AMP_WORKSPACE_ID=$(aws amp list-workspaces \
  --region ap-northeast-2 \
  --query 'workspaces[?alias==`vllm-inference-metrics`].workspaceId' \
  --output text)

echo "AMP Workspace ID: $AMP_WORKSPACE_ID"
```

### 2.2 Create IAM Role (for Pod Identity)

```bash
# Create IAM Role
aws iam create-role \
  --role-name prometheus-amp-remote-write \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "pods.eks.amazonaws.com"},
      "Action": ["sts:AssumeRole", "sts:TagSession"]
    }]
  }'

# Attach AMP RemoteWrite permissions
aws iam attach-role-policy \
  --role-name prometheus-amp-remote-write \
  --policy-arn arn:aws:iam::aws:policy/AmazonPrometheusRemoteWriteAccess
```

### 2.3 Create Pod Identity Association

```bash
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring \
  --service-account prometheus-kube-prometheus-prometheus \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/prometheus-amp-remote-write
```

:::tip Pod Identity vs IRSA
Pod Identity requires no OIDC Provider configuration and can be set up with a single command. Pod Identity is recommended for EKS 1.28+ clusters.
:::

### 2.4 Key Prometheus Helm Values

```yaml
# values-eks.yaml
prometheus:
  prometheusSpec:
    remoteWrite:
      - url: "https://aps-workspaces.ap-northeast-2.amazonaws.com/workspaces/${AMP_WORKSPACE_ID}/api/v1/remote_write"
        queueConfig:
          maxSamplesPerSend: 1000
          maxShards: 200
          capacity: 2500
        sigv4:
          region: ap-northeast-2

    serviceMonitorSelector: {}
    serviceMonitorNamespaceSelector: {}

  serviceAccount:
    name: prometheus-kube-prometheus-prometheus
    # No annotations needed when using Pod Identity (unlike IRSA)

# Scrape targets
additionalScrapeConfigs:
  # vLLM metrics
  - job_name: 'vllm'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: [ai-inference]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: vllm
        action: keep
    metrics_path: /metrics

  # DCGM Exporter (GPU metrics)
  - job_name: 'dcgm-exporter'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: [monitoring]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: dcgm-exporter
        action: keep

  # kgateway metrics
  - job_name: 'kgateway'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: [kgateway-system]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: kgateway
        action: keep
    metrics_path: /metrics
```

### 2.5 Install Prometheus via Helm

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f values-eks.yaml
```

---

## AMG (Grafana) Setup

### 3.1 Create AMG Workspace

```bash
aws grafana create-workspace \
  --account-access-type CURRENT_ACCOUNT \
  --authentication-providers AWS_SSO \
  --permission-type SERVICE_MANAGED \
  --workspace-name "vllm-monitoring" \
  --region ap-northeast-2

export AMG_WORKSPACE_ID=$(aws grafana list-workspaces \
  --region ap-northeast-2 \
  --query 'workspaces[?name==`vllm-monitoring`].id' \
  --output text)
```

### 3.2 Create Service Account + Token

A Service Account Token is required to add data sources via the AMG API.

```bash
# Create Grafana Service Account (via AMG Console or API)
# AMG Web Console -> Configuration -> Service Accounts -> Add Service Account
# Role: Admin
# Save the generated token

export GRAFANA_TOKEN="<generated-token>"
export GRAFANA_ENDPOINT="<AMG-workspace-URL>"
```

### 3.3 Add AMP Data Source

```bash
curl -X POST "https://${GRAFANA_ENDPOINT}/api/datasources" \
  -H "Authorization: Bearer ${GRAFANA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amazon Managed Prometheus",
    "type": "prometheus",
    "url": "https://aps-workspaces.ap-northeast-2.amazonaws.com/workspaces/'${AMP_WORKSPACE_ID}'/",
    "access": "proxy",
    "isDefault": true,
    "jsonData": {
      "httpMethod": "POST",
      "sigV4Auth": true,
      "sigV4AuthType": "ec2_iam_role",
      "sigV4Region": "ap-northeast-2"
    }
  }'
```

:::danger Do NOT use workspace-iam-role
Make sure to set `sigV4AuthType` to **`ec2_iam_role`**. The value `workspace-iam-role` is invalid and will return a **502 error**. The AMG workspace IAM Role must have the `AmazonPrometheusQueryAccess` policy attached.
:::

### 3.4 Grant IAM Identity Center User Permissions

```bash
aws grafana update-permissions \
  --user-id "<IAM Identity Center user-id>" \
  --user-type "SSO_USER" \
  --permissions-type "ADMIN" \
  --workspace-id $AMG_WORKSPACE_ID \
  --region ap-northeast-2
```

---

## Langfuse Deployment on EKS

### 4.1 Helm Installation

```bash
# Add Langfuse Helm repository
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update

# Create namespace
kubectl create namespace langfuse

# Install Langfuse via Helm (includes PostgreSQL + ClickHouse + Redis)
helm install langfuse langfuse/langfuse \
  --namespace langfuse \
  --set postgresql.enabled=true \
  --set postgresql.auth.password="secure-password" \
  --set clickhouse.enabled=true \
  --set redis.enabled=true \
  --set ingress.enabled=false \
  --set replicaCount=2
```

:::info EBS CSI Driver Required
Langfuse's PostgreSQL and ClickHouse require persistent storage.

```bash
# Verify EBS CSI Driver installation
kubectl get csidriver ebs.csi.aws.com

# Check default StorageClass
kubectl get storageclass
```
:::

### 4.2 Inject Redis Password (Prevent Worker CrashLoopBackOff)

The Bitnami Valkey chart creates the Secret key as `valkey-password`, but the Langfuse Helm chart does not automatically include the password in the Worker's `REDIS_CONNECTION_STRING`.

```bash
# Retrieve Redis password
REDIS_PW=$(kubectl get secret langfuse-redis -n langfuse \
  -o jsonpath='{.data.valkey-password}' | base64 -d)

# Inject into both Web and Worker
kubectl set env deploy/langfuse-worker deploy/langfuse-web -n langfuse \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PW}@langfuse-redis-primary:6379/0"
```

:::warning Worker CrashLoopBackOff Root Cause
If the `langfuse-worker` Pod is in CrashLoopBackOff, a **missing Redis password** is the most common cause. Manually inject it using the command above.
:::

### 4.3 Migrating from MinIO to S3 + KMS (Recommended)

The Langfuse Helm chart installs MinIO as built-in S3 storage by default, but AWS S3 + KMS is recommended for production.

| | MinIO (Default) | AWS S3 + KMS (Recommended) |
|---|---|---|
| **Availability** | Single Pod | 99.999999999% (11 nines) |
| **Encryption** | None | SSE-KMS (automatic encryption) |
| **Authentication** | Access Key (environment variable) | Pod Identity (no keys required) |
| **Backup** | Manual | S3 versioning + Lifecycle |

#### S3 + KMS Configuration Steps

```bash
# 1. Create S3 bucket + KMS key
aws s3api create-bucket --bucket langfuse-traces-<ACCOUNT_ID> --region <REGION> \
  --create-bucket-configuration LocationConstraint=<REGION>

KMS_KEY=$(aws kms create-key --description "Langfuse trace encryption" \
  --query 'KeyMetadata.KeyId' --output text)

# 2. Enable S3 default encryption (KMS)
aws s3api put-bucket-encryption --bucket langfuse-traces-<ACCOUNT_ID> \
  --server-side-encryption-configuration \
  '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "'$KMS_KEY'"}, "BucketKeyEnabled": true}]}'

# 3. IAM Role + Pod Identity (no Access Key required)
aws iam create-role --role-name langfuse-s3-access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "pods.eks.amazonaws.com"},
      "Action": ["sts:AssumeRole", "sts:TagSession"]
    }]
  }'

aws iam put-role-policy --role-name langfuse-s3-access --policy-name s3-kms \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
        "Resource": [
          "arn:aws:s3:::langfuse-traces-<ACCOUNT_ID>",
          "arn:aws:s3:::langfuse-traces-<ACCOUNT_ID>/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": ["kms:GenerateDataKey", "kms:Decrypt"],
        "Resource": "arn:aws:kms:<REGION>:<ACCOUNT_ID>:key/'$KMS_KEY'"
      }
    ]
  }'

aws eks create-pod-identity-association \
  --cluster-name <CLUSTER> --namespace langfuse \
  --service-account langfuse \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/langfuse-s3-access

# 4. Update Langfuse environment variables (remove MinIO, switch to S3)
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_BUCKET="langfuse-traces-<ACCOUNT_ID>" \
  LANGFUSE_S3_EVENT_UPLOAD_REGION="<REGION>" \
  LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT- \
  LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID- \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY- \
  LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE-
```

:::tip If You Keep MinIO
When using MinIO, the Helm chart does not automatically inject the S3 Secret Key into environment variables. If missing, OTel trace ingestion will return 500 errors.

```bash
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse \
  -o jsonpath='{.data.root-password}' | base64 -d)

kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```
:::

### 4.4 NEXTAUTH_URL Configuration

`NEXTAUTH_URL` must be set to the actual accessible URL. Leaving it as the default `localhost:3000` will cause an infinite redirect loop during login.

```bash
# When accessing via kgateway sub-path
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="http://<NLB_ENDPOINT>/langfuse"

# When accessing via a separate domain
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="https://langfuse.example.com"
```

### 4.5 kgateway Sub-path Routing

This configures Langfuse to be served at the `/langfuse` path through the kgateway unified NLB. For detailed HTTPRoute YAML, see [Inference Gateway Setup: Basic Deployment](../inference-gateway/setup/basic-deployment#langfuse-sub-path-routing-urlrewrite).

Required routing rules:

1. `/langfuse/*` -> URLRewrite `/` + Langfuse backend
2. `/_next/*` -> Langfuse (Next.js Static Assets)
3. `/api/auth/*` -> Langfuse (Authentication API)
4. `/api/public/*` -> Langfuse (Public API + OTel)

---

## 5. Bifrost OTel to Langfuse Integration

### 5.1 Bifrost OTel Plugin Configuration

OTel plugin configuration in Bifrost's config.json.

```json
{
  "plugins": [{
    "enabled": true,
    "name": "otel",
    "config": {
      "service_name": "bifrost",
      "trace_type": "otel",
      "protocol": "http",
      "collector_url": "http://langfuse-web.langfuse.svc.cluster.local:3000/api/public/otel/v1/traces",
      "headers": {
        "Authorization": "Basic <BASE64(public_key:secret_key)>",
        "x-langfuse-ingestion-version": "4"
      }
    }
  }]
}
```

**Key Considerations**:

| Setting | Correct Value | Incorrect Value |
|---------|--------------|----------------|
| `trace_type` | `"otel"` | `"genai_extension"` |
| `collector_url` | Full OTLP path included | Base URL only |
| Authorization | `Basic <BASE64(pk:sk)>` | Bearer token |

### 5.2 kgateway URLRewrite (When Routing Externally)

When Bifrost sends OTel traces to Langfuse through kgateway, URLRewrite is required.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: langfuse-otel-route
  namespace: observability
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  hostnames:
    - "api.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/public/otel
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /api/public/otel/v1/traces
      backendRefs:
        - name: langfuse-web
          port: 3000
```

In this case, the `collector_url` in Bifrost config uses the kgateway endpoint:

```json
"collector_url": "http://api.example.com/api/public/otel"
```

kgateway rewrites `/api/public/otel` to `/api/public/otel/v1/traces`.

:::tip Direct In-Cluster vs Through kgateway

| Method | collector_url | URLRewrite Required |
|--------|---------------|---------------------|
| Direct in-cluster | `http://langfuse-web.langfuse.svc:3000/api/public/otel/v1/traces` | No |
| Through kgateway | `http://api.example.com/api/public/otel` | Yes |

Direct in-cluster delivery is simpler and has lower latency. Routing through kgateway is used when sending OTel from external networks.
:::

### 5.3 Exact OTLP Endpoint Path

The Langfuse OTLP ingestion endpoint is:

```
POST /api/public/otel/v1/traces
```

**Incorrect paths** (will not work):
```
/api/public/otel              (missing suffix)
/v1/traces                    (missing prefix)
/api/public/otel/traces       (missing v1)
```

---

## 6. Recommended PromQL Query Reference

| Metric | PromQL | Purpose |
|--------|--------|---------|
| GPU Utilization | `avg(DCGM_FI_DEV_GPU_UTIL)` | GPU activity |
| GPU Memory Usage | `avg(DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100) by (gpu)` | VRAM usage |
| GPU Temperature | `DCGM_FI_DEV_GPU_TEMP` | Overheating monitoring |
| vLLM TPS | `rate(vllm:request_success_total[5m])` | Inference throughput |
| vLLM TTFT P99 | `histogram_quantile(0.99, rate(vllm:time_to_first_token_seconds_bucket[5m]))` | Time to first token |
| vLLM E2E P99 | `histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m]))` | End-to-end request latency |
| vLLM Batch Size | `avg(vllm_num_requests_running)` | Concurrent inference count |
| kgateway RPS | `sum(rate(kgateway_requests_total[5m])) by (route)` | Requests per second |
| kgateway 5xx Error Rate | `sum(rate(kgateway_upstream_rq_5xx[5m])) / sum(rate(kgateway_requests_total[5m])) * 100` | Error rate (%) |
| kgateway P99 Latency | `histogram_quantile(0.99, sum(rate(kgateway_request_duration_seconds_bucket[5m])) by (le, route))` | Gateway latency |
| Bifrost Request Rate | `rate(bifrost_requests_total[5m])` | Gateway request rate |
| Active Connections | `sum(kgateway_upstream_cx_active) by (upstream_cluster)` | Active connections per backend |

### Alert Rule Examples

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: vllm-gpu-alerts
  namespace: monitoring
spec:
  groups:
    - name: gpu-alerts
      interval: 30s
      rules:
        - alert: HighGPUTemperature
          expr: DCGM_FI_DEV_GPU_TEMP > 85
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "GPU {{ $labels.gpu }} temperature is high"
            description: "GPU temperature: {{ $value }} C"

        - alert: GPUMemoryFull
          expr: (DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100) > 95
          for: 3m
          labels:
            severity: critical
          annotations:
            summary: "GPU {{ $labels.gpu }} memory is nearly full"

        - alert: HighVLLMLatency
          expr: histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m])) > 30
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "vLLM P99 latency is above 30s"

        - alert: HighGatewayErrorRate
          expr: |
            sum(rate(kgateway_upstream_rq_5xx[5m])) /
            sum(rate(kgateway_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Inference Gateway error rate exceeds 5%"
```

---

## 7. Troubleshooting

### 7.1 AMP 403 (Missing Pod Identity)

**Symptom**: `403 Forbidden` remote write error in Prometheus logs

**Diagnosis**:
```bash
# Check Pod Identity Association
aws eks list-pod-identity-associations \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring

# Verify Prometheus ServiceAccount
kubectl get sa prometheus-kube-prometheus-prometheus -n monitoring -o yaml
```

**Resolution**:
```bash
# Create Pod Identity Association
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring \
  --service-account prometheus-kube-prometheus-prometheus \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/prometheus-amp-remote-write

# Restart Prometheus Pod (to apply Pod Identity)
kubectl rollout restart statefulset prometheus-kube-prometheus-prometheus -n monitoring
```

### 7.2 AMG 502 (SigV4 Auth Type Error)

**Symptom**: 502 Bad Gateway when testing AMP data source in AMG

**Cause**: `sigV4AuthType` is set to `workspace-iam-role`

**Resolution**:
1. AMG Console -> Data Sources -> Edit AMP data source
2. SigV4 Auth Details -> Change Auth Type to **`ec2_iam_role`**
3. Save & Test

Or fix via API:
```bash
curl -X PUT "https://${GRAFANA_ENDPOINT}/api/datasources/<DS_ID>" \
  -H "Authorization: Bearer ${GRAFANA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonData": {
      "sigV4Auth": true,
      "sigV4AuthType": "ec2_iam_role",
      "sigV4Region": "ap-northeast-2"
    }
  }'
```

### 7.3 Langfuse Worker CrashLoopBackOff (Redis)

**Symptom**: `langfuse-worker` Pod is in CrashLoopBackOff

**Diagnosis**:
```bash
# Check Worker logs
kubectl logs -n langfuse -l app.kubernetes.io/component=worker --tail=30

# Test Redis connectivity
kubectl run -it --rm redis-test --image=redis:7 --restart=Never -n langfuse -- \
  redis-cli -h langfuse-redis-primary -a $(kubectl get secret langfuse-redis -n langfuse -o jsonpath='{.data.valkey-password}' | base64 -d) ping
```

**Resolution**:
```bash
REDIS_PW=$(kubectl get secret langfuse-redis -n langfuse \
  -o jsonpath='{.data.valkey-password}' | base64 -d)

kubectl set env deploy/langfuse-worker deploy/langfuse-web -n langfuse \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PW}@langfuse-redis-primary:6379/0"
```

### 7.4 Langfuse S3 500 (Missing MinIO Secret)

**Symptom**: Langfuse returns 500 error on OTel trace ingestion, S3-related errors in logs

**Cause**: The Langfuse Helm chart does not automatically inject the MinIO S3 secret key into environment variables

**Resolution**:
```bash
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse \
  -o jsonpath='{.data.root-password}' | base64 -d)

kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```

:::tip Permanent Fix: Migrate to S3 + KMS
To fundamentally resolve MinIO-related issues, we recommend migrating to S3 + KMS as described in Section 4.3. Pod Identity-based authentication eliminates Access Key management, and availability and encryption are guaranteed.
:::

### 7.5 Langfuse 404 (Sub-path Routing)

**Symptom**: Page loads at `/langfuse/` but CSS/JS is broken or returns 404

**Cause**: Next.js static asset paths (`/_next/*`) and authentication API (`/api/auth/*`) are not routed to Langfuse

**Resolution**: Additional path rules are needed in the kgateway HTTPRoute:

```yaml
# Additional paths required
/_next/*        -> langfuse-web:3000  (Static Assets)
/api/auth/*     -> langfuse-web:3000  (NextAuth)
/api/public/*   -> langfuse-web:3000  (Public API + OTel)
/icon.svg       -> langfuse-web:3000  (Favicon)
```

For detailed HTTPRoute YAML, see [Inference Gateway Setup: Basic Deployment](../inference-gateway/setup/basic-deployment#langfuse-sub-path-routing-urlrewrite).

### 7.6 Langfuse Infinite Redirect (NEXTAUTH_URL)

**Symptom**: Infinite redirect loop when logging into Langfuse UI

**Cause**: `NEXTAUTH_URL` is set to the default `localhost:3000`

**Resolution**:
```bash
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="http://<NLB_ENDPOINT>/langfuse"
```

---

## References

- [Agent Monitoring](../../operations-mlops/observability/agent-monitoring.md) - Detailed monitoring architecture and metric design
- [LLMOps Observability](../../operations-mlops/observability/llmops-observability.md) - Langfuse/LangSmith/Helicone comparison and evaluation pipelines
- [Amazon Managed Prometheus](https://docs.aws.amazon.com/prometheus/)
- [Amazon Managed Grafana](https://docs.aws.amazon.com/grafana/)
- [Langfuse Helm Chart](https://github.com/langfuse/langfuse-helm)
