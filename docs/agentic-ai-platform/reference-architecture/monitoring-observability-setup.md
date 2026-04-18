---
title: "모니터링 & Observability 구성 가이드"
sidebar_label: "모니터링"
description: "Prometheus→AMP, AMG, Langfuse, Bifrost OTel 통합 모니터링 실전 구성 가이드"
tags: [monitoring, langfuse, amp, amg, prometheus, otel, deployment, 'scope:impl']
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

# 모니터링 & Observability 구성 가이드

이 문서는 Prometheus → AMP, AMG, Langfuse, Bifrost OTel 통합 모니터링의 **실전 배포 절차**를 다룹니다. 아키텍처 개념과 설계 원칙은 [Agent 모니터링](../operations-mlops/agent-monitoring.md) 및 [LLMOps Observability](../operations-mlops/llmops-observability.md)를 참조하세요.

---

## 1. 모니터링 아키텍처 개요

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

**데이터 흐름 요약**:

| 데이터 | 경로 | 용도 |
|--------|------|------|
| 인프라 메트릭 | vLLM/DCGM/kgateway → Prometheus → AMP → AMG | GPU 활용도, TPS, 지연시간, 에러율 |
| LLM Trace | Bifrost → OTel → Langfuse | 토큰 사용량, 비용, 프롬프트 품질 |
| 게이트웨이 메트릭 | kgateway → Prometheus → AMP | 요청 수, 5xx 에러, 업스트림 상태 |

---

## 2. Prometheus + AMP 구성

### 2.1 AMP 워크스페이스 생성

```bash
# AMP 워크스페이스 생성
aws amp create-workspace \
  --alias "vllm-inference-metrics" \
  --region ap-northeast-2

# 워크스페이스 ID 확인
export AMP_WORKSPACE_ID=$(aws amp list-workspaces \
  --region ap-northeast-2 \
  --query 'workspaces[?alias==`vllm-inference-metrics`].workspaceId' \
  --output text)

echo "AMP Workspace ID: $AMP_WORKSPACE_ID"
```

### 2.2 IAM Role 생성 (Pod Identity용)

```bash
# IAM Role 생성
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

# AMP RemoteWrite 권한 부여
aws iam attach-role-policy \
  --role-name prometheus-amp-remote-write \
  --policy-arn arn:aws:iam::aws:policy/AmazonPrometheusRemoteWriteAccess
```

### 2.3 Pod Identity Association 생성

```bash
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring \
  --service-account prometheus-kube-prometheus-prometheus \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/prometheus-amp-remote-write
```

:::tip Pod Identity vs IRSA
Pod Identity는 OIDC Provider 설정 없이 한 줄 명령으로 완료됩니다. EKS 1.28+ 클러스터에서는 Pod Identity를 권장합니다.
:::

### 2.4 Prometheus Helm values 핵심 설정

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
    # Pod Identity 사용 시 annotations 불필요 (IRSA와 달리)

# scrape 대상
additionalScrapeConfigs:
  # vLLM 메트릭
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

  # DCGM Exporter (GPU 메트릭)
  - job_name: 'dcgm-exporter'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: [monitoring]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: dcgm-exporter
        action: keep

  # kgateway 메트릭
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

### 2.5 Prometheus Helm 설치

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f values-eks.yaml
```

---

## 3. AMG (Grafana) 구성

### 3.1 AMG 워크스페이스 생성

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

### 3.2 Service Account + Token 생성

AMG API를 통해 데이터 소스를 추가하려면 Service Account Token이 필요합니다.

```bash
# Grafana Service Account 생성 (AMG 콘솔 또는 API)
# AMG 웹 콘솔 → Configuration → Service Accounts → Add Service Account
# Role: Admin
# Token 생성 후 저장

export GRAFANA_TOKEN="<생성된 Token>"
export GRAFANA_ENDPOINT="<AMG 워크스페이스 URL>"
```

### 3.3 AMP 데이터 소스 추가

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

:::danger workspace-iam-role 금지
`sigV4AuthType`을 반드시 **`ec2_iam_role`**로 설정하세요. `workspace-iam-role`은 유효하지 않은 값으로 **502 에러**를 반환합니다. AMG workspace IAM Role에 `AmazonPrometheusQueryAccess` 정책이 연결되어 있어야 합니다.
:::

### 3.4 IAM Identity Center 사용자 권한 부여

```bash
aws grafana update-permissions \
  --user-id "<IAM Identity Center user-id>" \
  --user-type "SSO_USER" \
  --permissions-type "ADMIN" \
  --workspace-id $AMG_WORKSPACE_ID \
  --region ap-northeast-2
```

---

## 4. Langfuse EKS 배포

### 4.1 Helm 설치

```bash
# Langfuse Helm 저장소 추가
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update

# 네임스페이스 생성
kubectl create namespace langfuse

# Langfuse Helm 설치 (PostgreSQL + ClickHouse + Redis 포함)
helm install langfuse langfuse/langfuse \
  --namespace langfuse \
  --set postgresql.enabled=true \
  --set postgresql.auth.password="secure-password" \
  --set clickhouse.enabled=true \
  --set redis.enabled=true \
  --set ingress.enabled=false \
  --set replicaCount=2
```

:::info EBS CSI Driver 필수
Langfuse의 PostgreSQL과 ClickHouse는 영구 스토리지가 필요합니다.

```bash
# EBS CSI Driver 설치 확인
kubectl get csidriver ebs.csi.aws.com

# default StorageClass 확인
kubectl get storageclass
```
:::

### 4.2 Redis 패스워드 주입 (Worker CrashLoopBackOff 방지)

Bitnami Valkey 차트는 Secret key를 `valkey-password`로 생성하지만, Langfuse Helm 차트가 Worker의 `REDIS_CONNECTION_STRING`에 패스워드를 자동 포함하지 않습니다.

```bash
# Redis 패스워드 확인
REDIS_PW=$(kubectl get secret langfuse-redis -n langfuse \
  -o jsonpath='{.data.valkey-password}' | base64 -d)

# Web + Worker 모두 주입
kubectl set env deploy/langfuse-worker deploy/langfuse-web -n langfuse \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PW}@langfuse-redis-primary:6379/0"
```

:::warning Worker CrashLoopBackOff 원인
`langfuse-worker` Pod가 CrashLoopBackOff 상태라면 **Redis 패스워드 누락**이 가장 흔한 원인입니다. 위 명령으로 수동 주입하세요.
:::

### 4.3 MinIO → S3 + KMS 전환 가이드 (권장)

Langfuse Helm 차트는 기본적으로 MinIO를 내장 S3로 설치하지만, 프로덕션에서는 AWS S3 + KMS를 권장합니다.

| | MinIO (기본) | AWS S3 + KMS (권장) |
|---|---|---|
| **가용성** | 단일 Pod | 99.999999999% (11 nines) |
| **암호화** | 없음 | SSE-KMS (자동 암호화) |
| **인증** | Access Key (환경변수) | Pod Identity (키 불필요) |
| **백업** | 수동 | S3 버전 관리 + Lifecycle |

#### S3 + KMS 구성 절차

```bash
# 1. S3 버킷 + KMS 키 생성
aws s3api create-bucket --bucket langfuse-traces-<ACCOUNT_ID> --region <REGION> \
  --create-bucket-configuration LocationConstraint=<REGION>

KMS_KEY=$(aws kms create-key --description "Langfuse trace encryption" \
  --query 'KeyMetadata.KeyId' --output text)

# 2. S3 기본 암호화 (KMS)
aws s3api put-bucket-encryption --bucket langfuse-traces-<ACCOUNT_ID> \
  --server-side-encryption-configuration \
  '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "'$KMS_KEY'"}, "BucketKeyEnabled": true}]}'

# 3. IAM Role + Pod Identity (Access Key 불필요)
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

# 4. Langfuse 환경변수 변경 (MinIO 제거 → S3)
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_BUCKET="langfuse-traces-<ACCOUNT_ID>" \
  LANGFUSE_S3_EVENT_UPLOAD_REGION="<REGION>" \
  LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT- \
  LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID- \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY- \
  LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE-
```

:::tip MinIO를 유지하는 경우
MinIO를 사용할 경우, Helm 차트가 S3 Secret Key를 환경변수에 자동 주입하지 않습니다. 누락 시 OTel trace 수신에서 500 에러가 발생합니다.

```bash
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse \
  -o jsonpath='{.data.root-password}' | base64 -d)

kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```
:::

### 4.4 NEXTAUTH_URL 설정

`NEXTAUTH_URL`을 실제 접근 가능한 URL로 설정해야 합니다. `localhost:3000` (기본값)으로 두면 로그인 시 무한 리다이렉트가 발생합니다.

```bash
# kgateway sub-path로 접근하는 경우
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="http://<NLB_ENDPOINT>/langfuse"

# 별도 도메인으로 접근하는 경우
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="https://langfuse.example.com"
```

### 4.5 kgateway Sub-path 라우팅

Langfuse를 kgateway 통합 NLB의 `/langfuse` 경로로 서빙하는 설정입니다. 상세한 HTTPRoute YAML은 [추론 게이트웨이 배포: 기본 배포](./inference-gateway-setup/basic-deployment#langfuse-sub-path-라우팅-urlrewrite)를 참조하세요.

필요한 라우팅 규칙:

1. `/langfuse/*` → URLRewrite `/` + Langfuse 백엔드
2. `/_next/*` → Langfuse (Next.js Static Assets)
3. `/api/auth/*` → Langfuse (인증 API)
4. `/api/public/*` → Langfuse (Public API + OTel)

---

## 5. Bifrost OTel → Langfuse 연동

### 5.1 Bifrost OTel 플러그인 설정

Bifrost config.json의 OTel 플러그인 설정입니다.

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

**핵심 주의사항**:

| 설정 항목 | 올바른 값 | 잘못된 값 |
|----------|----------|----------|
| `trace_type` | `"otel"` | `"genai_extension"` |
| `collector_url` | 전체 OTLP 경로 포함 | base URL만 |
| Authorization | `Basic <BASE64(pk:sk)>` | Bearer 토큰 |

### 5.2 kgateway URLRewrite (외부 경유 시)

Bifrost가 kgateway를 경유하여 Langfuse에 OTel trace를 전송하는 경우, URLRewrite가 필요합니다.

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

이 경우 Bifrost config의 `collector_url`은 kgateway 엔드포인트를 사용합니다:

```json
"collector_url": "http://api.example.com/api/public/otel"
```

kgateway가 `/api/public/otel` → `/api/public/otel/v1/traces`로 리라이트합니다.

:::tip 클러스터 내부 직접 전송 vs kgateway 경유

| 방식 | collector_url | URLRewrite 필요 |
|------|---------------|----------------|
| 내부 직접 | `http://langfuse-web.langfuse.svc:3000/api/public/otel/v1/traces` | 불필요 |
| kgateway 경유 | `http://api.example.com/api/public/otel` | 필요 |

클러스터 내부 직접 전송이 더 단순하고 지연이 적습니다. kgateway 경유는 외부 네트워크에서 OTel을 전송하는 경우에 사용합니다.
:::

### 5.3 OTLP 엔드포인트 정확한 경로

Langfuse의 OTLP 수신 엔드포인트는 다음과 같습니다:

```
POST /api/public/otel/v1/traces
```

**잘못된 경로** (동작하지 않음):
```
/api/public/otel              (suffix 누락)
/v1/traces                    (prefix 누락)
/api/public/otel/traces       (v1 누락)
```

---

## 6. 추천 PromQL 쿼리 테이블

| 메트릭 | PromQL | 용도 |
|--------|--------|------|
| GPU 사용률 | `avg(DCGM_FI_DEV_GPU_UTIL)` | GPU 활성도 |
| GPU 메모리 사용률 | `avg(DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) * 100) by (gpu)` | VRAM 사용률 |
| GPU 온도 | `DCGM_FI_DEV_GPU_TEMP` | 과열 모니터링 |
| vLLM TPS | `rate(vllm:request_success_total[5m])` | 추론 처리량 |
| vLLM TTFT P99 | `histogram_quantile(0.99, rate(vllm:time_to_first_token_seconds_bucket[5m]))` | 첫 토큰 지연 |
| vLLM E2E P99 | `histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m]))` | 전체 요청 지연 |
| vLLM 배치 크기 | `avg(vllm_num_requests_running)` | 동시 추론 수 |
| kgateway RPS | `sum(rate(kgateway_requests_total[5m])) by (route)` | 초당 요청 수 |
| kgateway 5xx 에러율 | `sum(rate(kgateway_upstream_rq_5xx[5m])) / sum(rate(kgateway_requests_total[5m])) * 100` | 에러율 (%) |
| kgateway P99 지연 | `histogram_quantile(0.99, sum(rate(kgateway_request_duration_seconds_bucket[5m])) by (le, route))` | 게이트웨이 지연 |
| Bifrost 요청률 | `rate(bifrost_requests_total[5m])` | 게이트웨이 요청률 |
| 활성 연결 수 | `sum(kgateway_upstream_cx_active) by (upstream_cluster)` | 백엔드별 활성 연결 |

### 알림 규칙 예시

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
            summary: "Inference Gateway 오류율 5% 초과"
```

---

## 7. 트러블슈팅

### 7.1 AMP 403 (Pod Identity 누락)

**증상**: Prometheus 로그에 `403 Forbidden` remote write 에러

**진단**:
```bash
# Pod Identity Association 확인
aws eks list-pod-identity-associations \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring

# Prometheus ServiceAccount 확인
kubectl get sa prometheus-kube-prometheus-prometheus -n monitoring -o yaml
```

**해결**:
```bash
# Pod Identity Association 생성
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring \
  --service-account prometheus-kube-prometheus-prometheus \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/prometheus-amp-remote-write

# Prometheus Pod 재시작 (Pod Identity 적용)
kubectl rollout restart statefulset prometheus-kube-prometheus-prometheus -n monitoring
```

### 7.2 AMG 502 (SigV4 auth type 오류)

**증상**: AMG에서 AMP 데이터 소스 Test 시 502 Bad Gateway

**원인**: `sigV4AuthType`이 `workspace-iam-role`로 설정됨

**해결**:
1. AMG 콘솔 → Data Sources → AMP 데이터 소스 편집
2. SigV4 Auth Details → Auth Type을 **`ec2_iam_role`**로 변경
3. Save & Test

또는 API로 수정:
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

**증상**: `langfuse-worker` Pod가 CrashLoopBackOff 상태

**진단**:
```bash
# Worker 로그 확인
kubectl logs -n langfuse -l app.kubernetes.io/component=worker --tail=30

# Redis 연결 테스트
kubectl run -it --rm redis-test --image=redis:7 --restart=Never -n langfuse -- \
  redis-cli -h langfuse-redis-primary -a $(kubectl get secret langfuse-redis -n langfuse -o jsonpath='{.data.valkey-password}' | base64 -d) ping
```

**해결**:
```bash
REDIS_PW=$(kubectl get secret langfuse-redis -n langfuse \
  -o jsonpath='{.data.valkey-password}' | base64 -d)

kubectl set env deploy/langfuse-worker deploy/langfuse-web -n langfuse \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PW}@langfuse-redis-primary:6379/0"
```

### 7.4 Langfuse S3 500 (MinIO Secret 누락)

**증상**: OTel trace 수신 시 Langfuse가 500 에러 반환, 로그에 S3 관련 오류

**원인**: Langfuse Helm 차트가 MinIO S3 secret key를 환경변수에 자동 주입하지 않음

**해결**:
```bash
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse \
  -o jsonpath='{.data.root-password}' | base64 -d)

kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```

:::tip 근본 해결: S3 + KMS 전환
MinIO 관련 이슈를 근본적으로 해결하려면 섹션 4.3의 S3 + KMS 전환을 권장합니다. Pod Identity 기반이므로 Access Key 관리가 불필요하고, 가용성과 암호화가 보장됩니다.
:::

### 7.5 Langfuse 404 (Sub-path Routing)

**증상**: `/langfuse/` 접속 시 페이지는 로드되지만 CSS/JS가 깨지거나 404

**원인**: Next.js 정적 자산 경로(`/_next/*`)와 인증 API(`/api/auth/*`)가 Langfuse로 라우팅되지 않음

**해결**: kgateway HTTPRoute에 추가 경로 규칙 필요:

```yaml
# 추가 필요한 경로들
/_next/*        → langfuse-web:3000  (Static Assets)
/api/auth/*     → langfuse-web:3000  (NextAuth)
/api/public/*   → langfuse-web:3000  (Public API + OTel)
/icon.svg       → langfuse-web:3000  (Favicon)
```

상세 HTTPRoute YAML은 [추론 게이트웨이 배포: 기본 배포](./inference-gateway-setup/basic-deployment#langfuse-sub-path-라우팅-urlrewrite)를 참조하세요.

### 7.6 Langfuse 무한 리다이렉트 (NEXTAUTH_URL)

**증상**: Langfuse UI 로그인 시 무한 리다이렉트 루프

**원인**: `NEXTAUTH_URL`이 기본값 `localhost:3000`으로 설정됨

**해결**:
```bash
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="http://<NLB_ENDPOINT>/langfuse"
```

---

## 참고 자료

- [Agent 모니터링](../operations-mlops/agent-monitoring.md) - 모니터링 아키텍처 및 메트릭 설계 상세
- [LLMOps Observability](../operations-mlops/llmops-observability.md) - Langfuse/LangSmith/Helicone 비교 및 평가 파이프라인
- [Amazon Managed Prometheus](https://docs.aws.amazon.com/prometheus/)
- [Amazon Managed Grafana](https://docs.aws.amazon.com/grafana/)
- [Langfuse Helm Chart](https://github.com/langfuse/langfuse-helm)
