---
title: Basic Deployment
description: kgateway installation, HTTPRoute configuration, Bifrost Gateway Mode setup
created: "2026-04-18"
last_update:
  date: 2026-10-28
  author: devfloor9
reading_time: 19
tags:
  - kgateway
  - bifrost
  - httproute
  - gateway-api
  - scope:impl
sidebar_label: 1. Basic Deployment
sidebar_position: 1
---

Deploy the core components of a **kgateway + Bifrost inference gateway** behind a single NLB endpoint. kgateway sends requests to services according to their URL paths, while Bifrost Gateway Mode integrates the configured model providers.

:::tip Time Required
**Learning**: 30 min | **Deployment**: 45 min
:::

---

## 1. kgateway Installation and Basic Resource Configuration

### 1.1 Install Gateway API CRDs

```bash
# Install Gateway API standard CRDs (v1.5.1+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.1/standard-install.yaml

# Install with experimental features (HTTPRoute filters, etc.)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.1/experimental-install.yaml
```

### 1.2 Install kgateway via Helm (CRDs → main chart) {#12-install-kgateway-v222-via-helm}

The kgateway chart is distributed via an OCI registry (`cr.kgateway.dev`). An OCI registry is not a `helm repo add` target, so reference it **directly** with `helm upgrade -i`, and install the **CRDs chart first**, then the main chart.

```bash
# Set the latest stable version (releases: github.com/kgateway-dev/kgateway/releases)
export KGW_VERSION=v2.3.5

# 1) Install the CRDs chart first
helm upgrade -i kgateway-crds \
  oci://cr.kgateway.dev/kgateway-dev/charts/kgateway-crds \
  --version ${KGW_VERSION} \
  --namespace kgateway-system --create-namespace --wait

# 2) Install the main kgateway chart
helm upgrade -i kgateway \
  oci://cr.kgateway.dev/kgateway-dev/charts/kgateway \
  --version ${KGW_VERSION} \
  --namespace kgateway-system \
  --wait
```

:::tip Check version and values
Confirm the latest 2.x chart version at [kgateway releases](https://github.com/kgateway-dev/kgateway/releases). For tuning values such as controller replicas/resources and metrics, confirm the actual keys with `helm show values oci://cr.kgateway.dev/kgateway-dev/charts/kgateway --version ${KGW_VERSION}` before specifying them with `--set`/`-f values.yaml` (keys may differ per chart version).
:::

:::info To use the Gateway API Inference Extension (EPP)
To configure KV-aware (L2) routing, install InferencePool + EPP separately. See [Advanced Features: Inference Extension](./advanced-features.md#inference-extension).
:::

### 1.3 Define GatewayClass

The kgateway Helm chart installs a default `GatewayClass` (named `kgateway`). If you define it yourself, the `controllerName` is `kgateway.dev/kgateway`.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: kgateway
spec:
  controllerName: kgateway.dev/kgateway
  description: "kgateway for AI inference routing"
```

:::tip Tune the proxy with GatewayParameters
In kgateway v2.x, infrastructure settings such as proxy replicas and resources are defined in a separate `GatewayParameters` resource (group `gateway.kgateway.dev/v1alpha1`) and referenced from the **Gateway resource's `spec.infrastructure.parametersRef`** (not the GatewayClass's `parametersRef`).

```yaml
apiVersion: gateway.kgateway.dev/v1alpha1
kind: GatewayParameters
metadata:
  name: kgateway-params
  namespace: ai-gateway
spec:
  kube:
    deployment:
      replicas: 3
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: unified-gateway
  namespace: ai-gateway
spec:
  gatewayClassName: kgateway
  infrastructure:
    parametersRef:
      group: gateway.kgateway.dev
      kind: GatewayParameters
      name: kgateway-params
  # listeners: see 1.4 below
```

Confirm the exact `spec.kube` subfields against the `GatewayParameters` CRD schema of the installed chart version (`kubectl explain gatewayparameters.spec.kube`).
:::

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
---
# Allow access to the Bifrost Service in the ai-external namespace
# (required because 2.2 bifrost-route references bifrost-service in ai-external as a backend)
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-bifrost
  namespace: ai-external
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway
  to:
    - group: ""
      kind: Service
```

:::note allowedRoutes and backend access are different
A Gateway's `allowedRoutes.namespaces.from: All` only allows **which namespaces' HTTPRoutes may attach** to this Gateway. An HTTPRoute **referencing a Service in another namespace as a backend** is separate and requires a `ReferenceGrant` in the namespace where the target Service lives. That is why the three namespaces `ai-inference`, `observability`, and `ai-external` each get a ReferenceGrant above. If you omit the ReferenceGrant, the HTTPRoute still attaches, but the backend reference is rejected and routing fails. Placing the route and backend in the same namespace works without a ReferenceGrant.
:::

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

:::caution Prefer a dedicated host/root over a sub-path
Mapping `/langfuse` to `/` with URLRewrite is a known-fragile configuration because a Next.js app generates links, static assets, `NEXTAUTH_URL`, and API calls against absolute paths (`/`). Prefer the following when possible.

1. Serve Langfuse at the root (`/`) of a **dedicated hostname** (e.g. `langfuse.example.com`). With no rewrite, this is the most stable.
2. If a sub-path is required, build Langfuse to be sub-path-aware at build time with `NEXT_PUBLIC_BASE_PATH` (and a matching `NEXTAUTH_URL`).

Treat the URLRewrite configuration above as **unverified until all navigation, auth-redirect, static-asset, and public-API flows are tested and pass**.
:::

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

The Bifrost OTel plugin uses `collector_url` as a full URL (including the path), so you can specify the full OTLP path directly in config.json. The HTTPRoute below is only needed if kgateway must perform path conversion. For OTel integration details, refer to [Langfuse OTel Configuration](../../integrations/monitoring-observability-setup.md).

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
  "$schema": "https://docs.getbifrost.ai/schema",
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
        "trace_type": "genai_extension",
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

- `trace_type` must be `"genai_extension"` (required as of v1.5.0+; the legacy `"otel"` value was removed from the schema)
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
      "$schema": "https://docs.getbifrost.ai/schema",
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
          "trace_type": "genai_extension",
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
  replicas: 1                 # SQLite is safe with a single writer only, so pin to one replica
  strategy:
    type: Recreate            # the previous Pod must terminate before the next can take the RWO PVC
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
        image: maximhq/bifrost:v1.5.16  # check the latest tag at hub.docker.com/r/maximhq/bifrost
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

:::warning Single-replica assumption (SQLite + RWO)
The configuration above places a SQLite-backed config store on a single `ReadWriteOnce` PVC, so it is **single-replica only**. A `ReadWriteOnce` volume mounts on only one node, and SQLite is corrupted if multiple writers share the same file, so you must not raise `replicas` above 1 (it would cause scheduling failures or DB corruption). Switching the access mode to `ReadWriteMany` does not make shared SQLite safe.

If you need multiple replicas, choose one of the following.
1. Move the config store to an external database (e.g. PostgreSQL, where Bifrost supports it) so state lives on a shareable backend.
2. Use file-only mode (`config_store.enabled: false`, see section 6) so each Pod holds its own **independent read-only config** copied from the ConfigMap, and remove runtime writes.
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

**Table 1. model-field transmission and Bifrost compatibility by IDE/coding tool**

| Tool | model Field Transmission | Bifrost Compatible | Configuration Method |
|------|--------------------------|-------------------|---------------------|
| **Cline** | Passed as-is | Supported | Model ID: `openai/glm-5` |
| **Continue.dev** | Passed as-is | Supported | model: `openai/glm-5` |
| **Aider** | LiteLLM prefix removal | Conditional (double-prefix needed) | `openai/openai/glm-5` |
| **Cursor** | Self-validation | Conditional | Supports the `provider/model` format, but intermittently rejects non-catalog model names |

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

## 6. config.json Change Procedure {#6-sqlite-initialization-procedure-when-configjson-changes}

Bifrost reads config.json at startup and reconciles it with the config store (SQLite). The current version (v1.5+) re-reads the file on every startup and detects changes via a per-entity content hash, so a Pod restart after a ConfigMap change is enough to apply it.

### Change Procedure

```bash
# 1. Update ConfigMap
kubectl apply -f bifrost-gateway-config.yaml

# 2. Restart Pods (re-reads config.json and reconciles into the config store)
kubectl rollout restart deployment/bifrost -n ai-external

# 3. Wait for the restart to complete
kubectl rollout status deployment/bifrost -n ai-external
```

:::info File-only mode
To use the file as the sole source, set `config_store.enabled: false` in config.json. This is the recommended configuration for GitOps operations.
:::

:::caution Difference from kgateway CRD Changes
kgateway **automatically reflects** CRD changes (no Pod restart needed), but Bifrost **requires a Pod restart** when the ConfigMap changes. Always understand this difference during operations.
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
# HTTPRoute hostnames is api.example.com, so the Host header must be set to route.
curl -s -H "Host: api.example.com" http://${NLB_ENDPOINT}/v1/models | jq .

# 5. Test via Bifrost (when using bifrost-route)
curl -s -H "Host: api.example.com" http://${NLB_ENDPOINT}/v1/models | jq .

# 6. Test Langfuse access
# /langfuse is mapped to / via URLRewrite, and the Langfuse home redirects to
# login, so it may not be 200 directly (typically 302 or 307).
curl -s -o /dev/null -w "%{http_code}" \
  -H "Host: api.example.com" http://${NLB_ENDPOINT}/langfuse/
# Expected: 200 or a login redirect (302/307)
```

---

## Next Steps

Use the verification results above to choose the next step: resolve deployment errors, add advanced features, or complete monitoring integration.

1. **Troubleshooting**: If errors occurred during deployment, refer to [Troubleshooting Guide](./troubleshooting-guide.md).
2. **Advanced Features**: Configure [LLM Classifier, CloudFront/WAF, Semantic Caching](./advanced-features.md) for production environments.
3. **Monitoring**: Complete OTel integration by referring to [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md).

---

## References

- [Troubleshooting Guide](./troubleshooting-guide.md) - Diagnosing and resolving kgateway, HTTPRoute, and Bifrost deployment errors
- [Advanced Features](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [Inference Gateway Routing](../../../model-serving/inference-routing/routing-strategy.md) - kgateway architecture and routing strategies
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [Bifrost Official Documentation](https://docs.getbifrost.ai/overview)
