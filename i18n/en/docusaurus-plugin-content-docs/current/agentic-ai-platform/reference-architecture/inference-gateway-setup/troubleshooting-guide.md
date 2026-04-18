---
title: "Troubleshooting Guide"
sidebar_label: "3. Troubleshooting"
description: "Common issues and solutions during Inference Gateway deployment and operations"
tags: [troubleshooting, debugging, kgateway, bifrost, 'scope:impl']
sidebar_position: 3
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Troubleshooting Guide

This document covers common issues and solutions during Inference Gateway deployment and operations. Refer to the relevant section to quickly resolve issues when they occur.

---

## 1. 404 Not Found

**Symptom**: 404 when requesting `http://<NLB_ENDPOINT>/v1/chat/completions`

**Diagnosis**:
```bash
# Check HTTPRoute status
kubectl get httproute -A

# Check Gateway status
kubectl get gateway -n ai-gateway -o yaml

# Check kgateway logs
kubectl logs -n kgateway-system -l app=kgateway --tail=50
```

**Common Causes**:
- HTTPRoute's `parentRefs.namespace` doesn't match Gateway namespace
- ReferenceGrant missing, preventing cross-namespace access
- `hostnames` field doesn't match request's Host header

**Solutions**:

1. **Verify parentRefs**:
```yaml
# Specify Gateway namespace in HTTPRoute
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Namespace where Gateway resides
```

2. **Create ReferenceGrant**:
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-services
  namespace: ai-inference  # Namespace where Service resides
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway  # Namespace where HTTPRoute resides
  to:
    - group: ""
      kind: Service
```

3. **Validate hostnames**:
```bash
# Check Host header in request
curl -v http://<NLB_ENDPOINT>/v1/models

# Add matching hostname in HTTPRoute
spec:
  hostnames:
    - "api.example.com"
    - "<NLB_ENDPOINT>"  # Also add NLB DNS name
```

---

## 2. Bifrost provider/model Errors

**Symptom**: `Provider not found` or `Model not found` errors

**Causes and Solutions**:

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Provider not found: vllm` | Not using built-in provider name | Use built-in names like `openai`, `anthropic` |
| `Model not found: glm-5` | Missing provider prefix | Send as `openai/glm-5` format in request |
| Settings not displayed in UI | providers written as array | `"providers": [...]` → `"providers": {...}` (map) |
| OTel trace not arriving | trace_type error | `"genai_extension"` → `"otel"` |
| Langfuse 403/401 | Authorization format error | Verify `Basic <BASE64(public_key:secret_key)>` |

**Correct config.json Format**:

```json
{
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
        "base_url": "http://vllm-service:8000"
      }
    }
  }
}
```

**Correct OTel Plugin Configuration**:

```json
{
  "plugins": [
    {
      "enabled": true,
      "name": "otel",
      "config": {
        "service_name": "bifrost",
        "trace_type": "otel",  # NOT "genai_extension"
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

---

## 3. Bifrost Model Name Normalization Issue

**Symptom**: Requested with `openai/glm-5` but vLLM returns `model not found`

**Cause**: Bifrost normalizes model names by removing hyphens (`glm-5` → `glm5`).

**Solution**: Match vLLM's `--served-model-name` to the normalized name.

```bash
# When starting vLLM server
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm5 \  # Name without hyphens
  --tensor-parallel-size=8
```

**Client Request**:
```python
from openai import OpenAI

client = OpenAI(base_url="http://<NLB_ENDPOINT>/v1", api_key="dummy")

# Bifrost normalizes glm-5 → glm5, so vLLM must serve as glm5
response = client.chat.completions.create(
    model="openai/glm-5",  # Use original name in request
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info Bifrost Model Alias Feature
Bifrost model alias feature has been requested in [#1058](https://github.com/maximhq/bifrost/issues/1058), but remains unimplemented as of 2026.04.
:::

---

## 4. Langfuse Sub-path 404

**Symptom**: Page loads when accessing `/langfuse/` but CSS/JS static assets return 404

**Cause**: Next.js static asset paths (`/_next/*`) not routed to Langfuse

**Solution**: In the HTTPRoute from [Basic Deployment Section 2.3](./basic-deployment.md#langfuse-sub-path-routing-urlrewrite), add routing for `/_next`, `/api/auth`, `/api/public`, `/icon.svg` paths to Langfuse

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
    # Next.js static assets (required!)
    - matches:
        - path:
            type: PathPrefix
            value: /_next
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse auth API (required!)
    - matches:
        - path:
            type: PathPrefix
            value: /api/auth
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse public API (required!)
    - matches:
        - path:
            type: PathPrefix
            value: /api/public
      backendRefs:
        - name: langfuse-web
          port: 3000
```

---

## 5. OTel Trace Not Arriving at Langfuse

**Diagnosis Sequence**:

```bash
# 1. Check OTel transmission in Bifrost logs
kubectl logs -l app=bifrost -n ai-external --tail=30 | grep -i otel

# 2. Check OTLP reception in Langfuse logs (adjust namespace per environment)
kubectl logs -l app=langfuse-web -n observability --tail=30 | grep -i otlp

# 3. Verify kgateway URLRewrite operation
kubectl logs -n kgateway-system -l app=kgateway --tail=30 | grep "otel"
```

**Checklist**:

| Check Item | Correct Value |
|-----------|---------------|
| `trace_type` | `"otel"` (not `"genai_extension"`) |
| `collector_url` | Include full path (`/api/public/otel/v1/traces`) |
| Authorization | `Basic <BASE64(public_key:secret_key)>` |
| kgateway URLRewrite | `/api/public/otel` → `/api/public/otel/v1/traces` (when routing via) |
| ReferenceGrant | Created in observability namespace |

**Verify Bifrost OTel Plugin**:

```bash
# Check Bifrost config.json
kubectl get configmap bifrost-gateway-config -n ai-external -o yaml

# Verify Authorization header BASE64 decoding
echo "<BASE64_STRING>" | base64 -d
# Expected output: pk-xxx:sk-xxx
```

**Test Langfuse Endpoint Directly**:

```bash
# Test direct OTLP transmission from inside Langfuse Pod
kubectl exec -it -n observability <langfuse-web-pod> -- curl -v \
  -H "Authorization: Basic <BASE64(pk:sk)>" \
  -H "x-langfuse-ingestion-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' \
  http://localhost:3000/api/public/otel/v1/traces
# Expected: 200 OK
```

For detailed configuration, refer to [Langfuse OTel Integration](../monitoring-observability-setup.md#opentelemetry-integration).

---

## 6. kgateway Pod CrashLoopBackOff

**Symptom**: kgateway controller or proxy Pods repeatedly restarting

**Diagnosis**:
```bash
# Check Pod status
kubectl get pods -n kgateway-system

# Check Pod events
kubectl describe pod -n kgateway-system <pod-name>

# Check logs
kubectl logs -n kgateway-system <pod-name> --previous
```

**Common Causes**:
- Gateway API CRDs not installed or version mismatch
- GatewayClass's `parametersRef` references non-existent GatewayClassConfig
- Resource shortage (CPU/Memory)

**Solutions**:

1. **Verify CRD Installation**:
```bash
kubectl get crd | grep gateway
# Expected: gatewayclasses.gateway.networking.k8s.io, gateways.gateway.networking.k8s.io, httproutes.gateway.networking.k8s.io
```

2. **Verify GatewayClassConfig Exists**:
```bash
kubectl get gatewayclassconfig -A
```

3. **Increase Resources**:
```yaml
# kgateway Helm values
controller:
  resources:
    requests:
      cpu: 500m      # Increase
      memory: 1Gi    # Increase
    limits:
      cpu: 2000m
      memory: 2Gi
```

---

## 7. Bifrost SQLite Initialization Failure

**Symptom**: Bifrost Pod logs show `failed to initialize database` or `permission denied`

**Cause**: PVC write permission error (fsGroup not set)

**Solution**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bifrost
spec:
  template:
    spec:
      securityContext:
        fsGroup: 1000  # Required!
      containers:
      - name: bifrost
        image: bifrost/bifrost:v2.0.0
        args: ["-app-dir", "/app/data"]
        volumeMounts:
        - name: bifrost-data
          mountPath: /app/data
```

**Verification**:
```bash
# Check permissions inside Bifrost Pod
kubectl exec -it -n ai-external <bifrost-pod> -- ls -la /app/data
# Expected: drwxrwsr-x 2 1000 1000
```

---

## 8. CloudFront 403 Forbidden

**Symptom**: Requests via CloudFront return 403 error

**Causes**:
- WAF rules blocking legitimate traffic
- NLB Security Group not allowing CloudFront Prefix List
- CloudFront Origin configuration error

**Diagnosis**:

```bash
# 1. Check WAF logs (CloudWatch Logs)
aws logs tail /aws-wafv2/cloudfront/inference-gateway-waf --follow

# 2. Check NLB SG
aws ec2 describe-security-groups --group-ids ${CF_RESTRICTED_SG_ID}

# 3. Test CloudFront → NLB directly (from inside Pod)
kubectl exec -it -n kgateway-system <kgateway-pod> -- curl -v \
  -H "Host: <CF_DOMAIN>" \
  https://<NLB_DNS>/v1/models
```

**Solutions**:

1. **Adjust WAF Rules** (temporarily switch to Count mode to analyze traffic):
```bash
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --region us-east-1 \
  --id <WEB_ACL_ID> \
  --lock-token <LOCK_TOKEN> \
  --default-action '{"Allow":{}}'
```

2. **Add CloudFront Prefix List to NLB SG**:
```bash
export CF_PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists \
  --filters "Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing" \
  --query "PrefixLists[0].PrefixListId" --output text)

aws ec2 authorize-security-group-ingress \
  --group-id ${CF_RESTRICTED_SG_ID} \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=${CF_PREFIX_LIST_ID}}]"
```

---

## 9. LLM Classifier Classification Errors

**Symptom**: Simple requests routed to GLM-5, or complex requests routed to Qwen3-4B

**Cause**: Classification keywords or thresholds need tuning

**Diagnosis**:
```bash
# Check LLM Classifier logs
kubectl logs -l app=llm-classifier -n ai-inference --tail=50
```

**Solution**: Adjust classification logic in `extproc_http.py`

```python
# Add/remove keywords
STRONG_KEYWORDS = [
    "refactor", "architect", "design", "analyze", "optimize", "debug",
    "migration", "complex", "performance", "security", "review",
    "implement",  # Example addition
]

# Adjust thresholds
TOKEN_THRESHOLD = 500  # Experiment within 300-700 range
TURN_THRESHOLD = 5     # Experiment within 3-10 range
```

**A/B Test Configuration** (gradual rollout):

```yaml
# Split traffic: 50% LLM Classifier, 50% direct routing
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ab-test-route
spec:
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/
      backendRefs:
        - name: llm-classifier
          port: 8080
          weight: 50
        - name: bifrost-service
          port: 8080
          weight: 50
```

---

## 10. Frequently Asked Questions (FAQ)

### Q1: Difference between kgateway and Bifrost?

**A**: kgateway is a Kubernetes Gateway API standard implementation handling path-based routing, while Bifrost provides multi-provider integration + Cascade Routing + governance. Typically connect in order: kgateway → Bifrost → vLLM.

### Q2: config.json Changes Not Reflected Immediately

**A**: Bifrost stores config.json to SQLite at startup. Pod restart required when changed:
```bash
kubectl delete pod -l app=bifrost -n ai-external
```

### Q3: Langfuse Traces Arriving Slowly

**A**: Langfuse uses asynchronous batch processing. 10-30 seconds delay for trace arrival is normal. If real-time verification needed, check Langfuse logs directly:
```bash
kubectl logs -l app=langfuse-web -n observability --tail=20 -f
```

### Q4: Speed Difference Between Direct NLB Access vs CloudFront Routing?

**A**: CloudFront routing adds approximately 10-50ms additional latency due to TLS termination + WAF inspection. Recommended to accept as security tradeoff in production.

### Q5: Why Is Bifrost double-prefix Trick Necessary?

**A**: Aider internally uses LiteLLM, and LiteLLM removes the `openai/` prefix. `openai/openai/glm-5` → LiteLLM removes → `openai/glm-5` → arrives at Bifrost. This trick becomes unnecessary when using LLM Classifier.

---

## References

- [Basic Deployment](./basic-deployment.md) - kgateway, HTTPRoute, Bifrost basic configuration
- [Advanced Features](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [Langfuse Deployment Guide](../monitoring-observability-setup.md) - OTel integration and troubleshooting
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [Bifrost Official Documentation](https://bifrost.dev/docs)
