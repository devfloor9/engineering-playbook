---
title: "基础部署"
sidebar_label: "1. 基础部署"
description: "kgateway 安装、HTTPRoute 配置、Bifrost Gateway Mode 配置"
tags: [kgateway, bifrost, httproute, gateway-api, 'scope:impl']
sidebar_position: 1
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 基础部署

本文档涵盖部署基于 kgateway + Bifrost 的推理网关**核心组件**的流程。在单个 NLB 端点后基于路径路由多个服务，并通过 Bifrost Gateway Mode 实现多提供商集成。

:::tip 所需时间
**学习**：30分钟 | **部署**：45分钟
:::

---

## 1. kgateway 安装及基础资源配置

### 1.1 Gateway API CRD 安装

```bash
# 安装 Gateway API 标准 CRD（v1.2.0+）
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# 包含实验性功能的安装（HTTPRoute 过滤器等）
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/experimental-install.yaml
```

### 1.2 kgateway v2.2.2 Helm 安装

```bash
# 添加 Helm 仓库
helm repo add kgateway oci://ghcr.io/kgateway-dev/charts
helm repo update

# 创建命名空间
kubectl create namespace kgateway-system

# 安装 kgateway v2.2.2
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

### 1.3 GatewayClass 定义

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

### 1.4 Gateway 资源（单一 NLB 集成）

:::danger 生产环境必需
以下为开发/测试用基础配置。**生产环境中必须应用 [高级功能：CloudFront + WAF/Shield](./advanced-features.md#cloudfront-waf)**，不要直接暴露 NLB。未经认证公开 SG 将被公司策略自动阻止。
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

### 1.5 ReferenceGrant（跨命名空间访问）

HTTPRoute 要引用其他命名空间的 Service 需要 ReferenceGrant。

```yaml
# 允许访问 ai-inference 命名空间的 Service
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
# 允许访问 observability 命名空间的 Langfuse Service
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

## 2. HTTPRoute 配置

在单个 NLB 端点后基于路径路由多个服务。

### 2.1 vLLM 直接路由

不通过 Bifrost，kgateway 直接路由到 vLLM 的模式。仅使用单一模型时最简单。

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

### 2.2 Bifrost 经由路由

需要多提供商集成、Cascade Routing、OTel 监控时经由 Bifrost。

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

### 2.3 Langfuse Sub-path 路由（URLRewrite） {#langfuse-sub-path-路由-urlrewrite}

Langfuse（Next.js）在 `/` 提供服务，因此要以 `/langfuse` 前缀访问需要 URLRewrite。Langfuse 架构及部署详情参阅 [Langfuse 部署指南](../../integrations/monitoring-observability-setup.md)。

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
    # Next.js 静态资源
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
    # Favicon 等静态文件
    - matches:
        - path:
            type: PathPrefix
            value: /icon.svg
      backendRefs:
        - name: langfuse-web
          port: 3000
```

### 2.4 OTel URLRewrite（Bifrost → Langfuse）

Bifrost OTel 插件仅使用 `collector_url` 的 base path，因此 kgateway 转换为完整 OTLP 路径。OTel 集成详情参阅 [Langfuse OTel 配置](../monitoring-observability-setup.md#opentelemetry-连动)。

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

### 2.5 路由端点结构总结

```
http://<NLB_ENDPOINT>/v1/*           → vLLM 或 Bifrost（推理 API）
http://<NLB_ENDPOINT>/langfuse/*     → Langfuse（Observability UI）
http://<NLB_ENDPOINT>/_next/*        → Langfuse（静态资源）
http://<NLB_ENDPOINT>/api/public/*   → Langfuse（API + OTel）
https://<AMG_ENDPOINT>               → Grafana（独立托管）
```

:::tip 配置更改即时生效
基于 Gateway API CRD 的路由无需重启 Pod 即可实时反映。修改 HTTPRoute 或 Gateway 资源后，kgateway 控制器会自动检测并立即应用。
:::

---

## 3. Bifrost Gateway Mode 配置

### 3.1 config.json 结构

Bifrost Gateway Mode 使用声明式 config.json 进行配置。这是经过实际验证的格式。

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

### 3.2 主要配置项

#### providers（Map 结构）

- `providers` 是 **map**（非数组）。key 是 Bifrost 内置 provider 名称（`openai`、`anthropic` 等）
- `keys` 是 **数组**，`models` 限制可用模型
- 请求时模型名使用 `provider/model` 格式（例：`openai/glm-5`）

:::danger providers 格式注意
使用 `"providers": [...]`（数组）编写时 UI 中不显示配置。必须使用 `"providers": {...}`（map）编写。
:::

#### OTel 插件

- `trace_type` 必须使用 `"otel"`（使用 `"genai_extension"` 时 trace 不会送达 Langfuse）
- `collector_url` 是 Langfuse OTLP 完整路径：`/api/public/otel/v1/traces`
- Authorization 头：`Basic <BASE64(public_key:secret_key)>` 格式

---

## 4. Bifrost K8s 部署模式（PVC + initContainer）

Bifrost 在 `-app-dir` 路径管理 config.json + SQLite。使用 PVC 和 initContainer 实现声明式部署。

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

:::warning fsGroup: 1000 必需
Bifrost 容器以 UID 1000 运行。不设置 `securityContext.fsGroup: 1000` 将导致 PVC 写入权限错误。
:::

---

## 5. Bifrost provider/model 格式及 IDE 兼容性

Bifrost 使用 `provider/model` 形式的模型名。

### 5.1 正确的模型名格式

```
openai/gpt-4o           (提供商/模型)
anthropic/claude-sonnet-4
openai/glm-5            (自有 vLLM 也使用 openai provider)

gpt-4o                   (缺少提供商 — 错误)
openai-gpt-4o            (连字符代替斜杠 — 错误)
```

### 5.2 IDE/编码工具兼容性

| 工具 | model 字段传递 | Bifrost 兼容 | 配置方法 |
|------|----------------|-------------|----------|
| **Cline** | 原样传递 | ✅ | Model ID：`openai/glm-5` |
| **Continue.dev** | 原样传递 | ✅ | model：`openai/glm-5` |
| **Aider** | 移除 LiteLLM 前缀 | ⚠️ 需 double-prefix | `openai/openai/glm-5` |
| **Cursor** | 自有验证拒绝 | ❌ | 拒绝包含 `/` 的模型名 |

### 5.3 Aider 连接示例

```bash
# double-prefix 技巧：LiteLLM 移除第一个 openai/ → 传递 openai/glm-5 到 Bifrost
aider --model openai/openai/glm-5 \
  --openai-api-base http://<NLB_ENDPOINT>/v1 \
  --openai-api-key dummy \
  --no-auto-commits
```

### 5.4 Continue.dev 配置示例

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

### 5.5 Cline 配置示例

Settings -> API Provider -> OpenAI Compatible
- Base URL：`http://<NLB_ENDPOINT>/v1`
- Model：`openai/glm-5`
- API Key：`dummy`

### 5.6 Python 客户端示例

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://<NLB_ENDPOINT>/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="openai/glm-5",  # provider/model 格式必需
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info 端点去标识化
生产环境中应将 NLB 端点映射到域名（例：`api.your-company.com`）使用。不要直接暴露 IP 地址或 AWS 自动生成的 DNS 名称。
:::

---

## 6. SQLite 初始化流程（config.json 变更时）

Bifrost 启动时读取一次 config.json 并保存到 SQLite。之后使用 SQLite，因此 config.json 变更时需重新生成 SQLite。

### 变更流程

```bash
# 1. 更新 ConfigMap
kubectl apply -f bifrost-gateway-config.yaml

# 2. 删除 Pod（PVC 数据的 config.db 自动初始化）
kubectl delete pod -l app=bifrost -n ai-external

# 3. initContainer 复制新 config.json → Bifrost 重新生成 SQLite
kubectl get pods -n ai-external -l app=bifrost -w
```

:::caution 与 kgateway CRD 变更的区别
kgateway CRD 变更时**自动反映**（无需重启 Pod），但 Bifrost ConfigMap 变更时**需重启 Pod**。运营时必须熟知此区别。
:::

---

## 验证

部署完成后使用以下命令验证配置。

```bash
# 1. 确认 Gateway 状态
kubectl get gateway -n ai-gateway

# 2. 确认 HTTPRoute 状态
kubectl get httproute -A

# 3. 确认 NLB 端点
export NLB_ENDPOINT=$(kubectl get gateway unified-gateway -n ai-gateway \
  -o jsonpath='{.status.addresses[0].value}')
echo "NLB Endpoint: ${NLB_ENDPOINT}"

# 4. vLLM 直接访问测试（使用 vllm-route 时）
curl -s http://${NLB_ENDPOINT}/v1/models | jq .

# 5. Bifrost 经由测试（使用 bifrost-route 时）
curl -s http://${NLB_ENDPOINT}/v1/models | jq .

# 6. Langfuse 访问测试
curl -s -o /dev/null -w "%{http_code}" http://${NLB_ENDPOINT}/langfuse/
# 预期：200
```

---

## 下一步

基础部署已完成。进行以下步骤：

1. **故障排除**：部署中发生错误时参考 [故障排除指南](./troubleshooting-guide.md)。
2. **高级功能**：为生产环境配置 [LLM Classifier、CloudFront/WAF、Semantic Caching](./advanced-features.md)。
3. **监控**：参考 [Langfuse 部署指南](../../integrations/monitoring-observability-setup.md) 完成 OTel 集成。

---

## 参考资料

- [推理网关路由](../routing-strategy.md) - kgateway 架构及路由策略
- [Kubernetes Gateway API 官方文档](https://gateway-api.sigs.k8s.io/)
- [kgateway 官方文档](https://kgateway.dev/docs/)
- [Bifrost 官方文档](https://bifrost.dev/docs)
