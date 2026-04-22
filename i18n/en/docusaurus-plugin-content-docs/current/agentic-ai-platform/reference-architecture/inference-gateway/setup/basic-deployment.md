---
title: "Basic Deployment"
sidebar_label: "1. Basic Deployment"
description: "kgateway installation, HTTPRoute configuration, Bifrost Gateway Mode setup"
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags: [kgateway, bifrost, httproute, gateway-api, 'scope:impl']
sidebar_position: 1
---

This document covers the procedures for deploying **core components** of the kgateway + Bifrost-based inference gateway. Route multiple services path-based behind a single NLB endpoint and implement multi-provider integration with Bifrost Gateway Mode.

:::tip Time Required
**Learning**: 30 min | **Deployment**: 45 min
:::

---

## 1. kgateway Installation and Basic Resource Configuration

### 1.1 Install Gateway API CRDs

```bash
# Install Gateway API standard CRDs (v1.2.0+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# Install with experimental features (HTTPRoute filters, etc.)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/experimental-install.yaml
```

### 1.2 Install kgateway v2.2.2 via Helm

```bash
# Add Helm repository
helm repo add kgateway oci://ghcr.io/kgateway-dev/charts
helm repo update

# Create namespace
kubectl create namespace kgateway-system

# Install kgateway v2.2.2
helm install kgateway kgateway/kgateway \
  --namespace kgateway-system \
  --version v2.2.2 \
  --set controller.replicaCount=2 \
  --set controller.resources.requests.cpu=500m \
  --set controller.resources.requests.memory=512Mi \
  --set controller.resources.limits.cpu=1000m \
  --set controller.resources.limits.memory=1Gi \
  --set metrics.enabled=true \
  --set metrics.port=9091
```

### 1.3 Define GatewayClass

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: kgateway
spec:
  controllerName: kgateway.dev/kgateway-controller
  description: "Kgateway for AI inference routing"
  parametersRef:
    group: kgateway.dev
    kind: GatewayClassConfig
    name: kgateway-config
---
apiVersion: kgateway.dev/v1alpha1
kind: GatewayClassConfig
metadata:
  name: kgateway-config
spec:
  proxy:
    replicas: 3
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
  connectionSettings:
    maxConnections: 10000
    connectTimeout: 10s
    idleTimeout: 60s
```

### 1.4 Gateway Resource (Single NLB Integration)

:::danger Production Environment Required
This is a basic configuration for development/test. **In production, always apply [Advanced Features: CloudFront + WAF/Shield](./advanced-features.md#cloudfront-waf)** and do not expose NLB directly. Opening SG publicly without authentication will be automatically blocked by company policy.
:::

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: unified-gateway
  namespace: ai-gateway
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  gatewayClassName: kgateway
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
```

### 1.5 ReferenceGrant (Cross-Namespace Access)

ReferenceGrant is required for HTTPRoute to reference Services in different namespaces.

```yaml
# Allow access to Services in ai-inference namespace
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-services
  namespace: ai-inference
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway
  to:
    - group: ""
      kind: Service
---
# Allow access to Langfuse Service in observability namespace
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-langfuse
  namespace: observability
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway
  to:
    - group: ""
      kind: Service
```

---

## 2. HTTPRoute Configuration

Route multiple services path-based behind a single NLB endpoint.

### 2.1 Direct vLLM Routing

This pattern routes directly from kgateway to vLLM without Bifrost. Simplest approach when using a single model.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: vllm-route
  namespace: ai-inference
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
            value: /v1/
      backendRefs:
        - name: vllm-service
          port: 8000
```

### 2.2 Routing via Bifrost

Route through Bifrost when multi-provider integration, Cascade Routing, and OTel monitoring are required.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: bifrost-route
  namespace: ai-gateway
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
            value: /v1/
      backendRefs:
        - name: bifrost-service
          namespace: ai-external
          port: 8080
```

### 2.3 Langfuse Sub-path Routing (URLRewrite) {#langfuse-sub-path-routing-urlrewrite}

Langfuse (Next.js) serves from `/`, so URLRewrite is required to access via `/langfuse` prefix. For Langfuse architecture and deployment details, refer to [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md).

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: langfuse-route
  namespace: observability
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  hostnames:
    - "api.example.com"
  rules:
    # /langfuse → / prefix removal
    - matches:
        - path:
            type: PathPrefix
            value: /langfuse/
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Next.js static assets
    - matches:
        - path:
            type: PathPrefix
            value: /_next
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse auth API
    - matches:
        - path:
            type: PathPrefix
            value: /api/auth
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse public API
    - matches:
        - path:
            type: PathPrefix
            value: /api/public
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Favicon and static files
    - matches:
        - path:
            type: PathPrefix
            value: /icon.svg
      backendRefs:
        - name: langfuse-web
          port: 3000
```

### 2.4 OTel URLRewrite (Bifrost → Langfuse)

Bifrost OTel plugin uses only the base path of `collector_url`, so kgateway converts it to the full OTLP path. For OTel integration details, refer to [Langfuse OTel Configuration](../../integrations/monitoring-observability-setup.md).

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

### 2.5 Routing Endpoint Structure Summary

```
http://<NLB_ENDPOINT>/v1/*           → vLLM or Bifrost (Inference API)
http://<NLB_ENDPOINT>/langfuse/*     → Langfuse (Observability UI)
http://<NLB_ENDPOINT>/_next/*        → Langfuse (Static Assets)
http://<NLB_ENDPOINT>/api/public/*   → Langfuse (API + OTel)
https://<AMG_ENDPOINT>               → Grafana (Separate managed service)
```

:::tip Configuration Changes Apply Immediately
Gateway API CRD-based routing reflects in real-time without Pod restarts. When you modify HTTPRoute or Gateway resources, the kgateway controller automatically detects and applies changes immediately.
:::

---

## 3. Bifrost Gateway Mode Configuration

### 3.1 config.json Structure

Bifrost Gateway Mode is configured declaratively with config.json. This is a verified working format.

```json
{
  "$schema": "https://www.getbifrost.ai/schema",
  "providers": {
    "openai": {
      "keys": [
        {
          "name": "local-vllm",
          "value": "dummy",
          "weight": 1.0,
          "models": ["glm-5"]
        }
      ],
      "network_config": {
        "base_url": "http://glm5-serving.agentic-serving.svc.cluster.local:8000"
      }
    }
  },
  "plugins": [
    {
      "enabled": true,
      "name": "otel",
      "config": {
        "service_name": "bifrost",
        "trace_type": "otel",
        "protocol": "http",
        "collector_url": "http://langfuse-web.langfuse.svc.cluster.local:3000/api/public/otel/v1/traces",
        "headers": {
          "Authorization": "Basic <BASE64(pk:sk)>",
          "x-langfuse-ingestion-version": "4"
        }
      }
    }
  ]
}
```

### 3.2 Key Configuration Items

#### providers (Map Structure)

- `providers` is a **map** (not array). Keys are Bifrost built-in provider names (`openai`, `anthropic`, etc.)
- `keys` is an **array**, `models` restrict available models
- Request model names use `provider/model` format (e.g., `openai/glm-5`)

:::danger providers Format Warning
Writing `"providers": [...]` (array) will make settings invisible in UI. Always use `"providers": {...}` (map).
:::

#### OTel Plugin

- `trace_type` must be `"otel"` (traces won't arrive at Langfuse if using `"genai_extension"`)
- `collector_url` is the full Langfuse OTLP path: `/api/public/otel/v1/traces`
- Authorization header: `Basic <BASE64(public_key:secret_key)>` format

---

## 4. Bifrost K8s Deployment Pattern (PVC + initContainer)

Bifrost manages config.json + SQLite at the `-app-dir` path. Implement declarative deployment using PVC and initContainer.

### 4.1 PVC + ConfigMap + Deployment

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: bifrost-data
  namespace: ai-external
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: bifrost-gateway-config
  namespace: ai-external
data:
  config.json: |
    {
      "$schema": "https://www.getbifrost.ai/schema",
      "providers": {
        "openai": {
          "keys": [{"name": "local-vllm", "value": "dummy", "weight": 1.0, "models": ["glm-5"]}],
          "network_config": {"base_url": "http://vllm-service:8000"}
        }
      },
      "plugins": [{
        "enabled": true,
        "name": "otel",
        "config": {
          "service_name": "bifrost",
          "trace_type": "otel",
          "protocol": "http",
          "collector_url": "http://langfuse-web.langfuse.svc.cluster.local:3000/api/public/otel/v1/traces",
          "headers": {
            "Authorization": "Basic <BASE64(pk:sk)>",
            "x-langfuse-ingestion-version": "4"
          }
        }
      }]
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bifrost
  namespace: ai-external
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bifrost
  template:
    metadata:
      labels:
        app: bifrost
    spec:
      securityContext:
        fsGroup: 1000
      initContainers:
      - name: setup
        image: busybox
        command:
          - sh
          - -c
          - |
            cp /config/config.json /app/data/config.json
            chown 1000:1000 /app/data/config.json
        volumeMounts:
        - name: bifrost-data
          mountPath: /app/data
        - name: gateway-config
          mountPath: /config
      containers:
      - name: bifrost
        image: bifrost/bifrost:v2.0.0
        args: ["-app-dir", "/app/data"]
        ports:
        - containerPort: 8080
          name: http
        volumeMounts:
        - name: bifrost-data
          mountPath: /app/data
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
      volumes:
      - name: bifrost-data
        persistentVolumeClaim:
          claimName: bifrost-data
      - name: gateway-config
        configMap:
          name: bifrost-gateway-config
---
apiVersion: v1
kind: Service
metadata:
  name: bifrost-service
  namespace: ai-external
spec:
  selector:
    app: bifrost
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

:::warning fsGroup: 1000 Required
Bifrost container runs as UID 1000. Without setting `securityContext.fsGroup: 1000`, PVC write permission errors will occur.
:::

---

## 5. Bifrost provider/model Format and IDE Compatibility

Bifrost uses `provider/model` format for model names.

### 5.1 Correct Model Name Format

```
openai/gpt-4o           (provider/model)
anthropic/claude-sonnet-4
openai/glm-5            (self-hosted vLLM also uses openai provider)

gpt-4o                   (missing provider — error)
openai-gpt-4o            (hyphen instead of slash — error)
```

### 5.2 IDE/Coding Tool Compatibility

| Tool | model Field Transmission | Bifrost Compatible | Configuration Method |
|------|--------------------------|-------------------|---------------------|
| **Cline** | Passed as-is | ✅ | Model ID: `openai/glm-5` |
| **Continue.dev** | Passed as-is | ✅ | model: `openai/glm-5` |
| **Aider** | LiteLLM prefix removal | ⚠️ double-prefix needed | `openai/openai/glm-5` |
| **Cursor** | Self-validation rejects | ❌ | Rejects model names with `/` |

### 5.3 Aider Connection Example

```bash
# double-prefix trick: LiteLLM removes first openai/ → sends openai/glm-5 to Bifrost
aider --model openai/openai/glm-5 \
  --openai-api-base http://<NLB_ENDPOINT>/v1 \
  --openai-api-key dummy \
  --no-auto-commits
```

### 5.4 Continue.dev Configuration Example

```json
{
  "models": [
    {
      "title": "GLM-5 (Bifrost)",
      "provider": "openai",
      "model": "openai/glm-5",
      "apiBase": "http://<NLB_ENDPOINT>/v1",
      "apiKey": "dummy"
    }
  ]
}
```

### 5.5 Cline Configuration Example

Settings -> API Provider -> OpenAI Compatible
- Base URL: `http://<NLB_ENDPOINT>/v1`
- Model: `openai/glm-5`
- API Key: `dummy`

### 5.6 Python Client Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://<NLB_ENDPOINT>/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="openai/glm-5",  # provider/model format required
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info Endpoint De-identification
In production, map NLB endpoints to domain names (e.g., `api.your-company.com`). Do not expose direct IP addresses or AWS auto-generated DNS names.
:::

---

## 6. SQLite Initialization Procedure (When config.json Changes)

Bifrost reads config.json once at startup and stores in SQLite. Afterward, it uses SQLite, so SQLite must be regenerated when config.json changes.

### Change Procedure

```bash
# 1. Update ConfigMap
kubectl apply -f bifrost-gateway-config.yaml

# 2. Delete Pods (PVC data config.db automatically initialized)
kubectl delete pod -l app=bifrost -n ai-external

# 3. initContainer copies new config.json → Bifrost regenerates SQLite
kubectl get pods -n ai-external -l app=bifrost -w
```

:::caution Difference from kgateway CRD Changes
kgateway **automatically reflects** CRD changes (no Pod restart needed), but Bifrost **requires Pod restart** when ConfigMap changes. Always understand this difference during operations.
:::

---

## Verification

Verify configuration after deployment with these commands.

```bash
# 1. Check Gateway status
kubectl get gateway -n ai-gateway

# 2. Check HTTPRoute status
kubectl get httproute -A

# 3. Check NLB endpoint
export NLB_ENDPOINT=$(kubectl get gateway unified-gateway -n ai-gateway \
  -o jsonpath='{.status.addresses[0].value}')
echo "NLB Endpoint: ${NLB_ENDPOINT}"

# 4. Test direct vLLM access (when using vllm-route)
curl -s http://${NLB_ENDPOINT}/v1/models | jq .

# 5. Test via Bifrost (when using bifrost-route)
curl -s http://${NLB_ENDPOINT}/v1/models | jq .

# 6. Test Langfuse access
curl -s -o /dev/null -w "%{http_code}" http://${NLB_ENDPOINT}/langfuse/
# Expected: 200
```

---

## Next Steps

Basic deployment is complete. Proceed to the next steps:

1. **Troubleshooting**: If errors occurred during deployment, refer to [Troubleshooting Guide](./troubleshooting-guide.md).
2. **Advanced Features**: Configure [LLM Classifier, CloudFront/WAF, Semantic Caching](./advanced-features.md) for production environments.
3. **Monitoring**: Complete OTel integration by referring to [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md).

---

## References

- [Inference Gateway Routing](../routing-strategy.md) - kgateway architecture and routing strategies
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [Bifrost Official Documentation](https://bifrost.dev/docs)
