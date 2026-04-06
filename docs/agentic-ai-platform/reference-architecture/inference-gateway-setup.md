---
title: "추론 게이트웨이 구성 가이드"
sidebar_label: "게이트웨이"
description: "kgateway + Bifrost 설치, HTTPRoute 설정, OTel 연동 실전 가이드"
tags: [kgateway, bifrost, gateway-api, httproute, otel, deployment]
last_update:
  date: 2026-04-05
  author: YoungJoon Jeong
---

# 추론 게이트웨이 구성 가이드

이 문서는 kgateway + Bifrost 기반 추론 게이트웨이의 **실전 배포 절차**를 다룹니다. 아키텍처 개념과 설계 원칙은 [추론 게이트웨이 라우팅](../gateway-agents/inference-gateway-routing.md) 및 [LLM Gateway 2-Tier 아키텍처](../gateway-agents/llm-gateway-architecture.md)를 참조하세요.

---

## 1. kgateway 설치 및 기본 리소스 구성

### 1.1 Gateway API CRD 설치

```bash
# Gateway API 표준 CRD 설치 (v1.2.0+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# 실험적 기능 포함 설치 (HTTPRoute 필터 등)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/experimental-install.yaml
```

### 1.2 kgateway v2.2.2 Helm 설치

```bash
# Helm 저장소 추가
helm repo add kgateway oci://ghcr.io/kgateway-dev/charts
helm repo update

# 네임스페이스 생성
kubectl create namespace kgateway-system

# kgateway v2.2.2 설치
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

### 1.3 GatewayClass 정의

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

### 1.4 Gateway 리소스 (단일 NLB 통합)

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

### 1.5 ReferenceGrant (크로스 네임스페이스 접근)

HTTPRoute가 다른 네임스페이스의 Service를 참조하려면 ReferenceGrant가 필요합니다.

```yaml
# ai-inference 네임스페이스의 Service 접근 허용
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
# observability 네임스페이스의 Langfuse Service 접근 허용
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

## 2. HTTPRoute 설정

단일 NLB 엔드포인트 뒤에서 여러 서비스를 경로 기반으로 라우팅합니다.

### 2.1 vLLM 직접 라우팅

Bifrost 없이 kgateway에서 vLLM으로 직접 라우팅하는 패턴입니다. 단일 모델만 사용하는 경우 가장 단순합니다.

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

### 2.2 Bifrost 경유 라우팅

멀티 프로바이더 통합, Cascade Routing, OTel 모니터링이 필요한 경우 Bifrost를 경유합니다.

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

### 2.3 Langfuse Sub-path 라우팅 (URLRewrite)

Langfuse (Next.js)는 `/`에서 서빙하므로, `/langfuse` prefix로 접근하려면 URLRewrite가 필요합니다.

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
    # /langfuse → / prefix 제거
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
    # Favicon 등 static files
    - matches:
        - path:
            type: PathPrefix
            value: /icon.svg
      backendRefs:
        - name: langfuse-web
          port: 3000
```

### 2.4 OTel URLRewrite (Bifrost → Langfuse)

Bifrost OTel 플러그인은 `collector_url`의 base path만 사용하므로, kgateway에서 전체 OTLP 경로로 변환합니다.

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

### 2.5 라우팅 엔드포인트 구조 요약

```
http://<NLB_ENDPOINT>/v1/*           → vLLM 또는 Bifrost (추론 API)
http://<NLB_ENDPOINT>/langfuse/*     → Langfuse (Observability UI)
http://<NLB_ENDPOINT>/_next/*        → Langfuse (Static Assets)
http://<NLB_ENDPOINT>/api/public/*   → Langfuse (API + OTel)
https://<AMG_ENDPOINT>               → Grafana (별도 관리형)
```

:::tip 설정 변경 즉시 반영
Gateway API CRD 기반 라우팅은 Pod 재시작 없이 실시간으로 반영됩니다. HTTPRoute 또는 Gateway 리소스를 수정하면 kgateway 컨트롤러가 자동으로 감지하여 즉시 적용합니다.
:::

---

## 3. Bifrost Gateway Mode 구성

### 3.1 config.json 구조

Bifrost Gateway Mode는 선언적 config.json으로 설정합니다. 실제 동작이 확인된 포맷입니다.

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

### 3.2 주요 설정 항목

#### providers (Map 구조)

- `providers`는 **map** (배열이 아님). key는 Bifrost 빌트인 provider 이름 (`openai`, `anthropic` 등)
- `keys`는 **배열**, `models`로 사용 가능한 모델 제한
- 요청 시 모델명은 `provider/model` 포맷 (예: `openai/glm-5`)

:::danger providers 포맷 주의
`"providers": [...]` (배열)로 작성하면 UI에서 설정이 보이지 않습니다. 반드시 `"providers": {...}` (map)으로 작성하세요.
:::

#### OTel 플러그인

- `trace_type`은 반드시 `"otel"` 사용 (`"genai_extension"` 사용 시 Langfuse에 trace 미도착)
- `collector_url`은 Langfuse OTLP 전체 경로: `/api/public/otel/v1/traces`
- Authorization 헤더: `Basic <BASE64(public_key:secret_key)>` 포맷

---

## 4. Bifrost K8s 배포 패턴 (PVC + initContainer)

Bifrost는 `-app-dir` 경로에서 config.json + SQLite를 관리합니다. PVC와 initContainer를 사용하여 선언적 배포를 구현합니다.

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

:::warning fsGroup: 1000 필수
Bifrost 컨테이너는 UID 1000으로 실행됩니다. `securityContext.fsGroup: 1000`을 설정하지 않으면 PVC 쓰기 권한 오류가 발생합니다.
:::

---

## 5. Bifrost provider/model 포맷 및 IDE 호환성

Bifrost는 `provider/model` 형식의 모델 이름을 사용합니다.

### 5.1 올바른 모델명 형식

```
openai/gpt-4o           (프로바이더/모델)
anthropic/claude-sonnet-4
openai/glm-5            (자체 vLLM도 openai provider 사용)

gpt-4o                   (프로바이더 누락 — 오류)
openai-gpt-4o            (슬래시 대신 하이픈 — 오류)
```

### 5.2 IDE/코딩 도구 호환성

| 도구 | model 필드 전달 | Bifrost 호환 | 설정 방법 |
|------|----------------|-------------|----------|
| **Cline** | 그대로 전달 | ✅ | Model ID: `openai/glm-5` |
| **Continue.dev** | 그대로 전달 | ✅ | model: `openai/glm-5` |
| **Aider** | LiteLLM prefix 제거 | ⚠️ double-prefix 필요 | `openai/openai/glm-5` |
| **Cursor** | 자체 검증 거부 | ❌ | 모델명 `/` 포함 거부 |

### 5.3 Aider 연결 예시

```bash
# double-prefix 트릭: LiteLLM이 첫 번째 openai/를 제거 → Bifrost에 openai/glm-5 전달
aider --model openai/openai/glm-5 \
  --openai-api-base http://<NLB_ENDPOINT>/v1 \
  --openai-api-key dummy \
  --no-auto-commits
```

### 5.4 Continue.dev 설정 예시

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

### 5.5 Cline 설정 예시

Settings -> API Provider -> OpenAI Compatible
- Base URL: `http://<NLB_ENDPOINT>/v1`
- Model: `openai/glm-5`
- API Key: `dummy`

### 5.6 Python 클라이언트 예시

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://<NLB_ENDPOINT>/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="openai/glm-5",  # provider/model 포맷 필수
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info 엔드포인트 비식별화
프로덕션 환경에서는 NLB 엔드포인트를 도메인 네임(예: `api.your-company.com`)으로 매핑하여 사용하세요. 직접 IP 주소나 AWS 자동 생성 DNS 이름을 노출하지 마세요.
:::

---

## 6. SQLite 초기화 절차 (config.json 변경 시)

Bifrost는 config.json을 시작 시 1회 읽어 SQLite에 저장합니다. 이후에는 SQLite를 사용하므로, config.json 변경 시 SQLite를 재생성해야 합니다.

### 변경 절차

```bash
# 1. ConfigMap 업데이트
kubectl apply -f bifrost-gateway-config.yaml

# 2. Pod 삭제 (PVC 데이터의 config.db 자동 초기화)
kubectl delete pod -l app=bifrost -n ai-external

# 3. initContainer가 새 config.json 복사 → Bifrost가 SQLite 재생성
kubectl get pods -n ai-external -l app=bifrost -w
```

:::caution kgateway CRD 변경과의 차이
kgateway는 CRD 변경 시 **자동 반영** (Pod 재시작 불필요)되지만, Bifrost는 ConfigMap 변경 시 **Pod 재시작 필요**합니다. 이 차이를 운영 시 반드시 숙지하세요.
:::

---

## 7. 트러블슈팅

### 7.1 404 Not Found

**증상**: `http://<NLB_ENDPOINT>/v1/chat/completions` 요청 시 404

**진단**:
```bash
# HTTPRoute 상태 확인
kubectl get httproute -A

# Gateway 상태 확인
kubectl get gateway -n ai-gateway -o yaml

# kgateway 로그 확인
kubectl logs -n kgateway-system -l app=kgateway --tail=50
```

**일반적 원인**:
- HTTPRoute의 `parentRefs.namespace`가 Gateway 네임스페이스와 불일치
- ReferenceGrant가 누락되어 크로스 네임스페이스 접근 불가
- `hostnames` 필드가 요청의 Host 헤더와 불일치

### 7.2 Bifrost provider/model 에러

**증상**: `Provider not found` 또는 `Model not found` 에러

**원인과 해결**:

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `Provider not found: vllm` | 빌트인 provider 이름 미사용 | `openai`, `anthropic` 등 빌트인 이름 사용 |
| `Model not found: glm-5` | provider prefix 누락 | 요청 시 `openai/glm-5` 형태로 전송 |
| UI에서 설정 미표시 | providers가 배열로 작성됨 | `"providers": [...]` -> `"providers": {...}` (map) |
| OTel trace 미도착 | trace_type 오류 | `"genai_extension"` -> `"otel"` |
| Langfuse 403/401 | Authorization 포맷 오류 | `Basic <BASE64(public_key:secret_key)>` 확인 |

### 7.3 Bifrost 모델명 정규화 문제

**증상**: `openai/glm-5`로 요청했지만 vLLM에서 `model not found`

**원인**: Bifrost는 모델명에서 하이픈을 제거하여 정규화합니다 (`glm-5` -> `glm5`).

**해결**: vLLM의 `--served-model-name`을 정규화된 이름과 일치시킵니다.

```bash
# vLLM 서버 시작 시
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm5 \  # 하이픈 없는 이름
  --tensor-parallel-size=8
```

:::info Bifrost 모델 alias 기능
Bifrost에서 모델 alias 기능이 [#1058](https://github.com/maximhq/bifrost/issues/1058)로 요청되어 있으나, 2026.04 기준 미구현 상태입니다.
:::

### 7.4 Langfuse Sub-path 404

**증상**: `/langfuse/` 접속 시 페이지는 로드되지만 CSS/JS 등 정적 자산이 404

**원인**: Next.js 정적 자산 경로 (`/_next/*`)가 Langfuse로 라우팅되지 않음

**해결**: 섹션 2.3의 HTTPRoute에서 `/_next`, `/api/auth`, `/api/public`, `/icon.svg` 경로도 Langfuse로 라우팅 추가

### 7.5 OTel Trace가 Langfuse에 도착하지 않음

**진단 순서**:

```bash
# 1. Bifrost 로그에서 OTel 전송 확인
kubectl logs -l app=bifrost -n ai-external --tail=30 | grep -i otel

# 2. Langfuse 로그에서 OTLP 수신 확인
kubectl logs -l app=langfuse-web -n langfuse --tail=30 | grep -i otlp

# 3. kgateway URLRewrite 동작 확인
kubectl logs -n kgateway-system -l app=kgateway --tail=30 | grep "otel"
```

**체크리스트**:

| 확인 항목 | 올바른 값 |
|----------|----------|
| `trace_type` | `"otel"` (not `"genai_extension"`) |
| `collector_url` | `http://langfuse-web.langfuse.svc.cluster.local:3000/api/public/otel/v1/traces` |
| Authorization | `Basic <BASE64(pk:sk)>` |
| kgateway URLRewrite | `/api/public/otel` -> `/api/public/otel/v1/traces` |
| ReferenceGrant | observability 네임스페이스에 생성됨 |

:::tip Bifrost OTel collector_url 경로
Bifrost OTel 플러그인은 `collector_url`에 지정한 경로를 그대로 사용합니다. kgateway를 경유하지 않고 클러스터 내부에서 Langfuse에 직접 전송하는 경우 전체 경로(`/api/public/otel/v1/traces`)를 `collector_url`에 포함해야 합니다.

kgateway를 경유하는 경우에는 URLRewrite로 경로를 변환합니다.
:::

---

## 참고 자료

- [추론 게이트웨이 라우팅](../gateway-agents/inference-gateway-routing.md) - kgateway 아키텍처 및 라우팅 전략 상세
- [LLM Gateway 2-Tier 아키텍처](../gateway-agents/llm-gateway-architecture.md) - Bifrost, LiteLLM 등 솔루션 비교
- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/)
- [kgateway 공식 문서](https://kgateway.dev/docs/)
- [Bifrost 공식 문서](https://bifrost.dev/docs)
