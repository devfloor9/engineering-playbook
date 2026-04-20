---
title: "故障排除指南"
sidebar_label: "3. 故障排除"
description: "Inference Gateway 部署及运营中发生的常见问题及解决方法"
tags: [troubleshooting, debugging, kgateway, bifrost, 'scope:impl']
sidebar_position: 3
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 故障排除指南

本文档涵盖 Inference Gateway 部署及运营中发生的常见问题及解决方法。问题发生时参考相应章节快速解决。

---

## 1. 404 Not Found

**症状**：`http://<NLB_ENDPOINT>/v1/chat/completions` 请求时出现 404

**诊断**：
```bash
# 确认 HTTPRoute 状态
kubectl get httproute -A

# 确认 Gateway 状态
kubectl get gateway -n ai-gateway -o yaml

# 确认 kgateway 日志
kubectl logs -n kgateway-system -l app=kgateway --tail=50
```

**常见原因**：
- HTTPRoute 的 `parentRefs.namespace` 与 Gateway 命名空间不一致
- 缺少 ReferenceGrant 导致无法跨命名空间访问
- `hostnames` 字段与请求的 Host 头不一致

**解决方法**：

1. **确认 parentRefs**：
```yaml
# HTTPRoute 中明确指定 Gateway 命名空间
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Gateway 所在的命名空间
```

2. **创建 ReferenceGrant**：
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-services
  namespace: ai-inference  # Service 所在的命名空间
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway  # HTTPRoute 所在的命名空间
  to:
    - group: ""
      kind: Service
```

3. **验证 hostnames**：
```bash
# 请求时确认 Host 头
curl -v http://<NLB_ENDPOINT>/v1/models

# HTTPRoute 添加匹配的 hostname
spec:
  hostnames:
    - "api.example.com"
    - "<NLB_ENDPOINT>"  # 也添加 NLB DNS 名称
```

---

## 2. Bifrost provider/model 错误

**症状**：`Provider not found` 或 `Model not found` 错误

**原因和解决**：

| 错误消息 | 原因 | 解决 |
|------------|------|------|
| `Provider not found: vllm` | 未使用内置 provider 名称 | 使用 `openai`、`anthropic` 等内置名称 |
| `Model not found: glm-5` | 缺少 provider 前缀 | 请求时以 `openai/glm-5` 形式发送 |
| UI 中不显示配置 | providers 写成数组 | `"providers": [...]` -> `"providers": {...}`（map）|
| OTel trace 未送达 | trace_type 错误 | `"genai_extension"` -> `"otel"` |
| Langfuse 403/401 | Authorization 格式错误 | 确认 `Basic <BASE64(public_key:secret_key)>` |

**正确的 config.json 格式**：

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

**OTel 插件正确配置**：

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

## 3. Bifrost 模型名标准化问题

**症状**：使用 `openai/glm-5` 请求但 vLLM 中出现 `model not found`

**原因**：Bifrost 从模型名移除连字符进行标准化（`glm-5` -> `glm5`）。

**解决**：将 vLLM 的 `--served-model-name` 与标准化名称匹配。

```bash
# vLLM 服务器启动时
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm5 \  # 无连字符的名称
  --tensor-parallel-size=8
```

**客户端请求**：
```python
from openai import OpenAI

client = OpenAI(base_url="http://<NLB_ENDPOINT>/v1", api_key="dummy")

# Bifrost 将 glm-5 → glm5 标准化，因此 vLLM 需以 glm5 提供服务
response = client.chat.completions.create(
    model="openai/glm-5",  # 请求时使用原名称
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info Bifrost 模型 alias 功能
Bifrost 的模型 alias 功能已在 [#1058](https://github.com/maximhq/bifrost/issues/1058) 请求，但截至 2026.04 尚未实现。
:::

---

## 4. Langfuse Sub-path 404

**症状**：访问 `/langfuse/` 时页面加载但 CSS/JS 等静态资源出现 404

**原因**：Next.js 静态资源路径（`/_next/*`）未路由到 Langfuse

**解决**：在 [基础部署章节 2.3](./basic-deployment.md#langfuse-sub-path-路由-urlrewrite) 的 HTTPRoute 中添加 `/_next`、`/api/auth`、`/api/public`、`/icon.svg` 路径到 Langfuse 的路由

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
    # /langfuse → / 移除前缀
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
    # Next.js 静态资源（必需！）
    - matches:
        - path:
            type: PathPrefix
            value: /_next
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse auth API（必需！）
    - matches:
        - path:
            type: PathPrefix
            value: /api/auth
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse public API（必需！）
    - matches:
        - path:
            type: PathPrefix
            value: /api/public
      backendRefs:
        - name: langfuse-web
          port: 3000
```

---

## 5. OTel Trace 未送达 Langfuse

**诊断顺序**：

```bash
# 1. Bifrost 日志中确认 OTel 传送
kubectl logs -l app=bifrost -n ai-external --tail=30 | grep -i otel

# 2. Langfuse 日志中确认 OTLP 接收（根据环境调整命名空间）
kubectl logs -l app=langfuse-web -n observability --tail=30 | grep -i otlp

# 3. 确认 kgateway URLRewrite 运行
kubectl logs -n kgateway-system -l app=kgateway --tail=30 | grep "otel"
```

**检查列表**：

| 确认项目 | 正确值 |
|----------|----------|
| `trace_type` | `"otel"`（不是 `"genai_extension"`）|
| `collector_url` | 包含完整路径（`/api/public/otel/v1/traces`）|
| Authorization | `Basic <BASE64(public_key:secret_key)>` |
| kgateway URLRewrite | `/api/public/otel` -> `/api/public/otel/v1/traces`（经由时）|
| ReferenceGrant | 在 observability 命名空间中创建 |

**验证 Bifrost OTel 插件**：

```bash
# 确认 Bifrost config.json
kubectl get configmap bifrost-gateway-config -n ai-external -o yaml

# 验证 Authorization 头 BASE64 解码
echo "<BASE64_STRING>" | base64 -d
# 预期输出：pk-xxx:sk-xxx
```

**直接测试 Langfuse 端点**：

```bash
# Langfuse Pod 内部直接发送 OTLP 测试
kubectl exec -it -n observability <langfuse-web-pod> -- curl -v \
  -H "Authorization: Basic <BASE64(pk:sk)>" \
  -H "x-langfuse-ingestion-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' \
  http://localhost:3000/api/public/otel/v1/traces
# 预期：200 OK
```

详细配置参阅 [Langfuse OTel 集成](../monitoring-observability-setup.md#opentelemetry-连动)。

---

## 6. kgateway Pod CrashLoopBackOff

**症状**：kgateway 控制器或代理 Pod 反复重启

**诊断**：
```bash
# 确认 Pod 状态
kubectl get pods -n kgateway-system

# 确认 Pod 事件
kubectl describe pod -n kgateway-system <pod-name>

# 确认日志
kubectl logs -n kgateway-system <pod-name> --previous
```

**常见原因**：
- Gateway API CRD 未安装或版本不一致
- GatewayClass 的 `parametersRef` 引用不存在的 GatewayClassConfig
- 资源不足（CPU/Memory）

**解决方法**：

1. **确认 CRD 安装**：
```bash
kubectl get crd | grep gateway
# 预期：gatewayclasses.gateway.networking.k8s.io, gateways.gateway.networking.k8s.io, httproutes.gateway.networking.k8s.io
```

2. **确认 GatewayClassConfig 存在**：
```bash
kubectl get gatewayclassconfig -A
```

3. **增加资源**：
```yaml
# kgateway Helm values
controller:
  resources:
    requests:
      cpu: 500m      # 增加
      memory: 1Gi    # 增加
    limits:
      cpu: 2000m
      memory: 2Gi
```

---

## 7. Bifrost SQLite 初始化失败

**症状**：Bifrost Pod 日志中出现 `failed to initialize database` 或 `permission denied`

**原因**：PVC 写入权限错误（未设置 fsGroup）

**解决**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bifrost
spec:
  template:
    spec:
      securityContext:
        fsGroup: 1000  # 必需！
      containers:
      - name: bifrost
        image: bifrost/bifrost:v2.0.0
        args: ["-app-dir", "/app/data"]
        volumeMounts:
        - name: bifrost-data
          mountPath: /app/data
```

**验证**：
```bash
# Bifrost Pod 内部确认权限
kubectl exec -it -n ai-external <bifrost-pod> -- ls -la /app/data
# 预期：drwxrwsr-x 2 1000 1000
```

---

## 8. CloudFront 403 Forbidden

**症状**：通过 CloudFront 的请求返回 403 错误

**原因**：
- WAF 规则阻止正常流量
- NLB Security Group 未允许 CloudFront Prefix List
- CloudFront Origin 配置错误

**诊断**：

```bash
# 1. 确认 WAF 日志（CloudWatch Logs）
aws logs tail /aws-wafv2/cloudfront/inference-gateway-waf --follow

# 2. 确认 NLB SG
aws ec2 describe-security-groups --group-ids ${CF_RESTRICTED_SG_ID}

# 3. CloudFront → NLB 直接测试（Pod 内部）
kubectl exec -it -n kgateway-system <kgateway-pod> -- curl -v \
  -H "Host: <CF_DOMAIN>" \
  https://<NLB_DNS>/v1/models
```

**解决**：

1. **调整 WAF 规则**（临时切换到 Count 模式分析流量）：
```bash
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --region us-east-1 \
  --id <WEB_ACL_ID> \
  --lock-token <LOCK_TOKEN> \
  --default-action '{"Allow":{}}'
```

2. **在 NLB SG 中添加 CloudFront Prefix List**：
```bash
export CF_PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists \
  --filters "Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing" \
  --query "PrefixLists[0].PrefixListId" --output text)

aws ec2 authorize-security-group-ingress \
  --group-id ${CF_RESTRICTED_SG_ID} \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=${CF_PREFIX_LIST_ID}}]"
```

---

## 9. LLM Classifier 分类错误

**症状**：简单请求路由到 GLM-5，或复杂请求路由到 Qwen3-4B

**原因**：分类关键词或阈值需要调整

**诊断**：
```bash
# 确认 LLM Classifier 日志
kubectl logs -l app=llm-classifier -n ai-inference --tail=50
```

**解决**：调整 `extproc_http.py` 分类逻辑

```python
# 添加/删除关键词
STRONG_KEYWORDS = [
    "重构", "架构", "设计", "分析", "优化", "调试", "迁移",
    "refactor", "architect", "design", "analyze", "optimize", "debug",
    "migration", "complex", "performance", "security", "review",
    "实现",  # 添加示例
]

# 调整阈值
TOKEN_THRESHOLD = 500  # 300-700 范围实验
TURN_THRESHOLD = 5     # 3-10 范围实验
```

**A/B 测试配置**（渐进式推出）：

```yaml
# 流量分割：50% LLM Classifier，50% 直接路由
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

## 10. 常见问题（FAQ）

### Q1：kgateway vs Bifrost 区别？

**A**：kgateway 是 Kubernetes Gateway API 标准实现，负责基于路径的路由，Bifrost 提供多提供商集成 + Cascade Routing + 治理。通常按 kgateway → Bifrost → vLLM 顺序连接。

### Q2：config.json 变更后未立即反映

**A**：Bifrost 启动时将 config.json 保存到 SQLite。变更时需重启 Pod：
```bash
kubectl delete pod -l app=bifrost -n ai-external
```

### Q3：Langfuse trace 送达缓慢

**A**：Langfuse 使用异步批处理。trace 送达需要 10-30 秒正常。需要实时确认时直接查看 Langfuse 日志：
```bash
kubectl logs -l app=langfuse-web -n observability --tail=20 -f
```

### Q4：NLB 直接访问 vs CloudFront 经由速度差异？

**A**：CloudFront 经由时因 TLS 终止 + WAF 检查约增加 10-50ms 延迟。生产环境推荐接受安全权衡。

### Q5：Bifrost double-prefix 技巧的必要性？

**A**：Aider 内部使用 LiteLLM，LiteLLM 移除 `openai/` 前缀。`openai/openai/glm-5` → LiteLLM 移除 → `openai/glm-5` → 到达 Bifrost。使用 LLM Classifier 时不需要此技巧。

---

## 参考资料

- [基础部署](./basic-deployment.md) - kgateway、HTTPRoute、Bifrost 基础配置
- [高级功能](./advanced-features.md) - LLM Classifier、CloudFront/WAF、Semantic Caching
- [Langfuse 部署指南](../monitoring-observability-setup.md) - OTel 集成及故障排除
- [Kubernetes Gateway API 官方文档](https://gateway-api.sigs.k8s.io/)
- [kgateway 官方文档](https://kgateway.dev/docs/)
- [Bifrost 官方文档](https://bifrost.dev/docs)
