---
title: Troubleshooting Guide
description: Common issues and solutions during Inference Gateway deployment and operations
created: "2026-04-18"
last_update:
  date: 2026-10-29
  author: devfloor9
reading_time: 19
tags:
  - troubleshooting
  - debugging
  - kgateway
  - bifrost
  - scope:impl
sidebar_label: 3. Troubleshooting
sidebar_position: 3
---

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
- The Gateway listener's `allowedRoutes` does not permit the HTTPRoute's namespace, so the route does not attach
- ReferenceGrant missing, preventing cross-namespace backend reference
- `hostnames` field doesn't match request's Host header

**Solutions**:

1. **Check parent status first**: In the HTTPRoute's `status.parents` conditions, confirm that both `Accepted` and `ResolvedRefs` are `True`. `Accepted=False` indicates a listener attachment problem (namespace/hostname); `ResolvedRefs=False` indicates a backend reference problem (including ReferenceGrant).
```bash
kubectl get httproute <route> -n <ns> -o jsonpath='{.status.parents[*].conditions[*].type}{"\n"}{.status.parents[*].conditions[*].status}'
```

2. **Verify parentRefs**:
```yaml
# Specify Gateway namespace in HTTPRoute
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Namespace where Gateway resides
```

3. **Authorize the route namespace in the listener's allowedRoutes**: When the HTTPRoute lives in a different namespace than the Gateway, the Gateway listener must allow routes from that namespace for the route to attach. ReferenceGrant applies to cross-namespace backend references, not to listener attachment, so do not conflate the two.
```yaml
# Gateway listener
spec:
  listeners:
    - name: http
      allowedRoutes:
        namespaces:
          from: Selector  # or All
          selector:
            matchLabels:
              kubernetes.io/metadata.name: ai-gateway  # Namespace where HTTPRoute resides
```

4. **Create ReferenceGrant** (only when the backend is in another namespace):
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

5. **Validate hostnames**:
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

**Table 1. Cause and solution per Provider/Model error message**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Provider not found: vllm` | Not using built-in provider name | Use built-in names like `openai`, `anthropic` |
| `Model not found: glm-5` | Missing provider prefix | Send as `openai/glm-5` format in request |
| Settings not displayed in UI | providers written as array | `"providers": [...]` → `"providers": {...}` (map) |
| OTel trace not arriving | trace_type error | legacy `"otel"` → `"genai_extension"` (current documented values: `genai_extension`, `vercel`, `open_inference`, as of 2026-10-29) |
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

**Correct OTel Plugin Configuration**: Set `trace_type` to `genai_extension`. As of 2026-10-29, the Bifrost OpenTelemetry documentation defines the allowed `trace_type` values as `genai_extension`, `vercel` and `open_inference`; `otel` is not in that list. The Bifrost release that removed the `otel` value has not been confirmed from release notes, so check the allowed values in the documentation for the Bifrost version you run.

```json
{
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

---

## 3. Bifrost Model Name Normalization Issue

**Symptom**: Requested with `openai/glm-5` but vLLM returns `model not found`

**Cause**: Bifrost strips only the provider prefix and passes the model name through unchanged (`openai/glm-5` → `glm-5` is sent to vLLM). An error occurs when vLLM's `--served-model-name` does not match.

**Solution**: Match vLLM's `--served-model-name` to the requested model name.

```bash
# When starting vLLM server
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm-5 \
  --tensor-parallel-size=8
# --served-model-name must match the name Bifrost forwards (glm-5)
```

**Client Request**:
```python
from openai import OpenAI

client = OpenAI(base_url="http://<NLB_ENDPOINT>/v1", api_key="dummy")

# Bifrost strips the openai/ prefix → glm-5 is sent to vLLM
response = client.chat.completions.create(
    model="openai/glm-5",
    messages=[{"role": "user", "content": "Hello"}]
)
```

**If you need a custom name mapping**, use the Bifrost v1.5.0+ model alias feature. The configuration below maps a `glm-5` request to vLLM's `glm5-prod`.

```json
{
  "providers": {
    "openai": {
      "keys": [{
        "name": "local-vllm",
        "aliases": {
          "glm-5": "glm5-prod"
        }
      }]
    }
  }
}
```

See the [Bifrost Aliasing Models documentation](https://docs.getbifrost.ai/providers/aliasing-models) for details.

---

## 4. Langfuse Sub-path 404

**Symptom**: Page loads when accessing `/langfuse/` but CSS/JS static assets return 404

**Cause**: Next.js static asset paths (`/_next/*`) not routed to Langfuse

**Recommended**: Where possible, expose Langfuse on a dedicated hostname (for example `langfuse.example.com`) rather than a sub-path. The paths below are root paths that can collide with other applications' root API/static paths, and routing alone does not serve Langfuse correctly under a sub-path. You must also configure the build-time base path (`NEXTAUTH_URL`/base path settings), the auth callback URL, and the health probe paths for the sub-path, then verify login, in-app navigation, and static asset loading.

**Solution when a sub-path must be kept**: In the HTTPRoute from [Basic Deployment Section 2.3](./basic-deployment.md#langfuse-sub-path-routing-urlrewrite), add routing for `/_next`, `/api/auth`, `/api/public`, `/icon.svg` paths to Langfuse

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

**Table 2. OTel trace integration check items and correct values**

| Check Item | Correct Value |
|-----------|---------------|
| `trace_type` | `"genai_extension"` (not `"otel"`) |
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

An empty `resourceSpans` request only checks endpoint reachability and auth acceptance (a 200 means the connection and authorization succeeded; it does not verify that a trace is actually stored and displayed). To reproduce the missing-trace symptom, send a valid synthetic span with known trace/span IDs and timestamps, then confirm in the Langfuse UI that the trace is ingested and displayed.

```bash
# Connectivity/auth check only: direct OTLP transmission from inside Langfuse Pod
kubectl exec -it -n observability <langfuse-web-pod> -- curl -v \
  -H "Authorization: Basic <BASE64(pk:sk)>" \
  -H "x-langfuse-ingestion-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' \
  http://localhost:3000/api/public/otel/v1/traces
# Expected: 200 on connection/auth success (verify storage/display separately with a valid span)
```

For detailed configuration, refer to [Langfuse OTel Integration](../../integrations/monitoring-observability-setup.md).

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
- Gateway API CRDs or kgateway CRDs (`kgateway-crds` chart) not installed, or version mismatch
- Gateway's `spec.infrastructure.parametersRef` references a non-existent `GatewayParameters`
- Resource shortage (CPU/Memory)

**Solutions**:

1. **Verify CRD Installation**:
```bash
kubectl get crd | grep gateway
# Expected: gatewayclasses.gateway.networking.k8s.io, gateways.gateway.networking.k8s.io, httproutes.gateway.networking.k8s.io
```

2. **Verify GatewayParameters Exists** (when referenced):
```bash
kubectl get gatewayparameters -A
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
        image: maximhq/bifrost:v1.5.16  # Check hub.docker.com/r/maximhq/bifrost for the latest tag
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

# 3. Direct origin (NLB) reachability test (from inside Pod — bypasses CloudFront/WAF)
#    This request goes straight from the Pod to the NLB, so CloudFront and WAF are bypassed.
#    Also, -H "Host:" only changes the application Host header; it does not set TLS SNI to that name.
kubectl exec -it -n kgateway-system <kgateway-pod> -- curl -v \
  -H "Host: <CF_DOMAIN>" \
  https://<NLB_DNS>/v1/models

# To verify the CloudFront path itself, send the request to the CloudFront domain
# and specify a certificate/SNI-compatible connection (e.g. with --resolve).
# curl -v https://<CF_DOMAIN>/v1/models
```

**Solutions**:

1. **Adjust WAF Rules** (temporarily switch specific rules to Count mode to analyze traffic):

   Changing the `DefaultAction` to `Allow` changes the ACL's default handling to allow — not the matching rules to Count — and can remove protections. `update-web-acl` also replaces the entire configuration, so you must resend `Name`, `VisibilityConfig`, and `Rules`. To switch only the rules you need into Count, first read and preserve the current configuration and `LockToken`, apply `OverrideAction: Count` (for a rule group) or `RuleActionOverrides` on the referenced rule group to those rules only, and restore the original configuration when analysis is done.

```bash
# 1) Read the full ACL configuration and LockToken, and back them up
aws wafv2 get-web-acl --scope CLOUDFRONT --region us-east-1 \
  --id <WEB_ACL_ID> --name <WEB_ACL_NAME> > webacl-backup.json
LOCK_TOKEN=$(jq -r '.LockToken' webacl-backup.json)

# 2) From the backup, take Rules/VisibilityConfig and build a Rules set
#    with only the target rule(s)/group set to Count via OverrideAction or
#    RuleActionOverrides (keep DefaultAction and all other rules unchanged)

# 3) Re-apply the full configuration (Name/VisibilityConfig/Rules required)
aws wafv2 update-web-acl \
  --scope CLOUDFRONT --region us-east-1 \
  --id <WEB_ACL_ID> --name <WEB_ACL_NAME> \
  --default-action "$(jq -c '.WebACL.DefaultAction' webacl-backup.json)" \
  --visibility-config "$(jq -c '.WebACL.VisibilityConfig' webacl-backup.json)" \
  --rules file://rules-count-override.json \
  --lock-token ${LOCK_TOKEN}

# 4) Rollback: get-web-acl again for the latest LockToken and restore the backup Rules
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

The HTTPRoute below only works once it attaches to a Gateway via `parentRefs`, and if the backends (`llm-classifier`, `bifrost-service`) are in a different namespace than the route, the `allowedRoutes`/ReferenceGrant setup from Section 1 is required. Sending traffic to the `llm-classifier` backend is only valid if the classifier is an HTTP proxy that receives the request and forwards it to the inference API unchanged. If the classifier is not a proxy, this weighted split cannot be applied as-is.

```yaml
# Split traffic: 50% LLM Classifier, 50% direct routing
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ab-test-route
  namespace: ai-inference  # Namespace where the backend Services reside
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Namespace where Gateway resides
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

**A**: Bifrost stores config.json to SQLite at startup, so a configuration change takes effect only after the Pod restarts. Deleting all label-matching Pods at once can affect availability. For a Deployment, use a rolling restart, confirm readiness, and roll back if there is a problem. With a single replica, or when SQLite is on a local volume, a brief interruption during restart is unavoidable, so perform it during a maintenance window.

```bash
# Rolling restart of the Deployment (preserves availability)
kubectl rollout restart deployment/bifrost -n ai-external
kubectl rollout status deployment/bifrost -n ai-external   # confirm readiness
# Roll back if there is a problem
kubectl rollout undo deployment/bifrost -n ai-external
```

### Q3: Langfuse Traces Arriving Slowly

**A**: Langfuse uses asynchronous batch processing, so a trace is not displayed immediately after it is sent. The arrival delay depends on the OTel exporter's batch/flush interval, Langfuse ingestion-queue backlog, and version, so it cannot be stated as a fixed "normal range." A delay observed in a particular environment (for example, a few seconds to tens of seconds) is only an example for that environment's settings and load; the actual value must be measured against your batch settings and queue state. If you need real-time verification, check Langfuse logs directly:
```bash
kubectl logs -l app=langfuse-web -n observability --tail=20 -f
```

### Q4: Speed Difference Between Direct NLB Access vs CloudFront Routing?

**A**: AWS WAF inspection is typically on the order of single-digit milliseconds, and CloudFront edge TLS termination can actually reduce client-to-edge latency. The added latency from an extra hop on a cache miss varies by situation, so the actual latency must be measured per workload. In production, using CloudFront + WAF is recommended given the security tradeoff.

### Q5: Why Is Bifrost double-prefix Trick Necessary?

**A**: Aider internally uses LiteLLM, and LiteLLM removes the `openai/` prefix. `openai/openai/glm-5` → LiteLLM removes → `openai/glm-5` → arrives at Bifrost. This trick becomes unnecessary when using LLM Classifier.

---

## References

- [Basic Deployment](./basic-deployment.md) - kgateway, HTTPRoute, Bifrost basic configuration
- [Advanced Features](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md) - OTel integration and troubleshooting
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [Bifrost Official Documentation](https://docs.getbifrost.ai/overview)
