---
title: 기본 배포
description: kgateway 설치, HTTPRoute 설정, Bifrost Gateway Mode 구성
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 12
tags:
  - kgateway
  - bifrost
  - httproute
  - gateway-api
  - scope:impl
sidebar_label: 1. 기본 배포
sidebar_position: 1
---

이 문서는 kgateway + Bifrost 기반 추론 게이트웨이의 **핵심 구성 요소**를 배포하는 절차를 다룹니다. 단일 NLB 엔드포인트 뒤에서 여러 서비스를 경로 기반으로 라우팅하고, Bifrost Gateway Mode로 멀티 프로바이더 통합을 구현합니다.

:::tip 소요 시간
**학습**: 30분 | **배포**: 45분
:::

---

## kgateway 설치 및 기본 리소스 구성

### 1.1 Gateway API CRD 설치

```bash
# Gateway API 표준 CRD 설치 (v1.5.1+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.1/standard-install.yaml

# 실험적 기능 포함 설치 (HTTPRoute 필터 등)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.1/experimental-install.yaml
```

### 1.2 kgateway Helm 설치 (CRDs → 메인 차트)

kgateway 차트는 OCI 레지스트리(`cr.kgateway.dev`)로 배포됩니다. OCI 레지스트리는 `helm repo add` 대상이 아니므로 `helm upgrade -i`로 **직접 참조**하며, **CRDs 차트를 먼저** 설치한 뒤 메인 차트를 설치합니다.

```bash
# 최신 안정 버전으로 설정 (릴리스: github.com/kgateway-dev/kgateway/releases)
export KGW_VERSION=v2.3.5

# 1) CRDs 차트 먼저 설치
helm upgrade -i kgateway-crds \
  oci://cr.kgateway.dev/kgateway-dev/charts/kgateway-crds \
  --version ${KGW_VERSION} \
  --namespace kgateway-system --create-namespace --wait

# 2) 메인 kgateway 차트 설치
helm upgrade -i kgateway \
  oci://cr.kgateway.dev/kgateway-dev/charts/kgateway \
  --version ${KGW_VERSION} \
  --namespace kgateway-system \
  --wait
```

:::tip 버전·values 확인
차트 버전은 [kgateway releases](https://github.com/kgateway-dev/kgateway/releases)에서 최신 2.x를 확인하세요. 컨트롤러 replica/리소스, 메트릭 등 튜닝 값은 `helm show values oci://cr.kgateway.dev/kgateway-dev/charts/kgateway --version ${KGW_VERSION}`로 실제 키를 확인한 뒤 `--set`/`-f values.yaml`로 지정하세요(차트 버전마다 키가 다를 수 있음).
:::

:::info Gateway API Inference Extension(EPP)을 쓰려면
KV-aware(L2) 라우팅을 구성하려면 InferencePool + EPP를 별도 설치합니다. [고급 기능: Inference Extension](./advanced-features.md#inference-extension)을 참조하세요.
:::

### 1.3 GatewayClass 정의

kgateway Helm 차트는 기본 `GatewayClass`(이름 `kgateway`)를 함께 설치합니다. 직접 정의할 경우 `controllerName`은 `kgateway.dev/kgateway`입니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: kgateway
spec:
  controllerName: kgateway.dev/kgateway
  description: "kgateway for AI inference routing"
```

:::tip 프록시 튜닝은 GatewayParameters로
kgateway v2.x에서 프록시 replica·리소스 등 인프라 설정은 별도 `GatewayParameters`(group `gateway.kgateway.dev/v1alpha1`) 리소스로 정의하고, **Gateway 리소스의 `spec.infrastructure.parametersRef`**에서 참조합니다(GatewayClass의 `parametersRef`가 아님).

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
  # listeners 는 아래 1.4 참조
```

정확한 `spec.kube` 하위 필드는 설치한 차트 버전의 `GatewayParameters` CRD 스키마(`kubectl explain gatewayparameters.spec.kube`)로 확인하세요.
:::

### 1.4 Gateway 리소스 (단일 NLB 통합)

:::danger 프로덕션 환경 필수
아래는 개발/테스트용 기본 구성입니다. **프로덕션 환경에서는 반드시 [고급 기능: CloudFront + WAF/Shield](./advanced-features.md#cloudfront-waf)를 적용**하여 NLB를 직접 노출하지 마세요. 인증 없이 퍼블릭으로 SG를 오픈하면 회사 정책에 의해 자동 차단됩니다.
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
---
# ai-external 네임스페이스의 Bifrost Service 접근 허용
# (2.2 bifrost-route가 ai-external의 bifrost-service를 backend로 참조하므로 필요)
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

:::note allowedRoutes와 backend 접근은 다릅니다
Gateway의 `allowedRoutes.namespaces.from: All`은 **어느 네임스페이스의 HTTPRoute가 이 Gateway에 attach**할 수 있는지만 허용합니다. HTTPRoute가 **다른 네임스페이스의 Service를 backend로 참조**하는 것은 별개이며, 대상 Service가 있는 네임스페이스에 `ReferenceGrant`가 있어야 합니다. 위에서 `ai-inference`·`observability`·`ai-external` 세 네임스페이스에 각각 ReferenceGrant를 둔 이유입니다. ReferenceGrant를 생략하면 HTTPRoute는 attach되지만 backend 참조가 거부되어 라우팅이 실패합니다. 라우트와 backend를 같은 네임스페이스에 두면 ReferenceGrant 없이도 동작합니다.
:::

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

### 2.3 Langfuse Sub-path 라우팅 (URLRewrite) {#langfuse-sub-path-라우팅-urlrewrite}

Langfuse (Next.js)는 `/`에서 서빙하므로, `/langfuse` prefix로 접근하려면 URLRewrite가 필요합니다. Langfuse 아키텍처 및 배포 상세는 [Langfuse 배포 가이드](../../integrations/monitoring-observability-setup.md)를 참조하세요.

:::caution 서브패스보다 전용 호스트/루트를 권장
`/langfuse` 서브패스에 URLRewrite로 `/`를 매핑하는 방식은 Next.js 앱이 절대 경로(`/`)로 생성한 링크·정적 자산·`NEXTAUTH_URL`·API 호출과 어긋나기 쉬운 알려진 취약 구성입니다. 가능하면 다음을 우선합니다.

1. Langfuse를 **전용 호스트명**(예: `langfuse.example.com`)의 루트(`/`)로 서빙합니다. 리라이트가 없어 가장 안정적입니다.
2. 서브패스가 꼭 필요하면 Langfuse를 빌드 시점에 `NEXT_PUBLIC_BASE_PATH`(및 그에 맞춘 `NEXTAUTH_URL`)로 서브패스를 인지하도록 빌드합니다.

위 URLRewrite 구성은 네비게이션·인증 리다이렉트·정적 자산·공개 API 흐름을 **모두 테스트해 통과하기 전까지는 미검증**으로 취급합니다.
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

Bifrost OTel 플러그인은 `collector_url`을 전체 URL(경로 포함)로 사용하므로, config.json에서 전체 OTLP 경로를 직접 지정할 수 있습니다. 단, kgateway에서 경로 변환이 필요한 경우 아래 HTTPRoute를 사용할 수 있습니다. OTel 연동 상세는 [Langfuse OTel 설정](../../integrations/monitoring-observability-setup.md)을 참조하세요.

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

### 3.2 주요 설정 항목

#### providers (Map 구조)

- `providers`는 **map** (배열이 아님). key는 Bifrost 빌트인 provider 이름 (`openai`, `anthropic` 등)
- `keys`는 **배열**, `models`로 사용 가능한 모델 제한
- 요청 시 모델명은 `provider/model` 포맷 (예: `openai/glm-5`)

:::danger providers 포맷 주의
`"providers": [...]` (배열)로 작성하면 UI에서 설정이 보이지 않습니다. 반드시 `"providers": {...}` (map)으로 작성하세요.
:::

#### OTel 플러그인

- `trace_type`은 반드시 `"genai_extension"` 사용 (v1.5.0+ 기준, 레거시 `"otel"` 값은 스키마에서 제거됨)
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
  replicas: 1                 # SQLite는 단일 writer만 안전하므로 단일 레플리카로 고정
  strategy:
    type: Recreate            # RWO PVC를 다음 Pod가 받으려면 이전 Pod가 먼저 종료되어야 함
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
        image: maximhq/bifrost:v1.5.16  # 최신 태그는 hub.docker.com/r/maximhq/bifrost 확인
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

:::warning 단일 레플리카 전제 (SQLite + RWO)
위 구성은 `ReadWriteOnce` PVC 하나에 SQLite 기반 config store를 두므로 **단일 레플리카 전용**입니다. `ReadWriteOnce` 볼륨은 한 노드에만 마운트되고, SQLite는 여러 writer가 같은 파일을 공유하면 손상되므로, `replicas`를 2 이상으로 올리면 안 됩니다(스케줄링 실패 또는 DB 손상). 접근 모드를 `ReadWriteMany`로 바꿔도 SQLite 공유가 안전해지지는 않습니다.

여러 레플리카가 필요하면 다음 중 하나를 택합니다.
1. config store를 외부 DB(예: Bifrost가 지원하는 PostgreSQL)로 분리해 상태를 공유 가능한 백엔드로 옮깁니다.
2. 파일 전용 모드(`config_store.enabled: false`, 6절 참조)로 각 Pod가 ConfigMap에서 복사한 **읽기 전용 config를 독립적으로** 보유하게 하고 런타임 쓰기를 제거합니다.
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

**표 1. IDE·코딩 도구별 model 필드 전달과 Bifrost 호환성**

| 도구 | model 필드 전달 | Bifrost 호환 | 설정 방법 |
|------|----------------|-------------|----------|
| **Cline** | 그대로 전달 | 지원 | Model ID: `openai/glm-5` |
| **Continue.dev** | 그대로 전달 | 지원 | model: `openai/glm-5` |
| **Aider** | LiteLLM prefix 제거 | 조건부(double-prefix 필요) | `openai/openai/glm-5` |
| **Cursor** | 자체 검증 | 조건부 | `provider/model` 포맷 지원하나 비카탈로그 모델명 간헐적 거부 이슈 |

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

## 6. config.json 변경 반영 절차

Bifrost는 시작 시 config.json을 읽어 config store(SQLite)와 리컨실합니다. 현재 버전(v1.5+)은 매 시작 시 파일을 다시 읽고 엔티티별 콘텐츠 해시로 변경을 감지하므로, ConfigMap 변경 후 Pod 재시작만으로 반영됩니다.

### 변경 절차

```bash
# 1. ConfigMap 업데이트
kubectl apply -f bifrost-gateway-config.yaml

# 2. Pod 재시작 (config.json을 다시 읽어 config store에 리컨실)
kubectl rollout restart deployment/bifrost -n ai-external

# 3. 재시작 완료 대기
kubectl rollout status deployment/bifrost -n ai-external
```

:::info 파일 전용 모드
파일만을 유일한 소스로 사용하려면 config.json에서 `config_store.enabled: false`로 설정하세요. 이는 GitOps 운영 시 권장되는 구성입니다.
:::

:::caution kgateway CRD 변경과의 차이
kgateway는 CRD 변경 시 **자동 반영** (Pod 재시작 불필요)되지만, Bifrost는 ConfigMap 변경 시 **Pod 재시작 필요**합니다. 이 차이를 운영 시 반드시 숙지하세요.
:::

---

## 검증

배포 완료 후 다음 명령으로 구성을 검증합니다.

```bash
# 1. Gateway 상태 확인
kubectl get gateway -n ai-gateway

# 2. HTTPRoute 상태 확인
kubectl get httproute -A

# 3. NLB 엔드포인트 확인
export NLB_ENDPOINT=$(kubectl get gateway unified-gateway -n ai-gateway \
  -o jsonpath='{.status.addresses[0].value}')
echo "NLB Endpoint: ${NLB_ENDPOINT}"

# 4. vLLM 직접 접근 테스트 (vllm-route 사용 시)
# HTTPRoute hostnames가 api.example.com이므로 Host 헤더를 명시해야 라우팅됩니다.
curl -s -H "Host: api.example.com" http://${NLB_ENDPOINT}/v1/models | jq .

# 5. Bifrost 경유 테스트 (bifrost-route 사용 시)
curl -s -H "Host: api.example.com" http://${NLB_ENDPOINT}/v1/models | jq .

# 6. Langfuse 접근 테스트
# /langfuse 는 URLRewrite로 / 에 매핑되며, Langfuse 홈이 로그인으로
# 리다이렉트하므로 바로 200이 아닐 수 있습니다(일반적으로 302 또는 307).
curl -s -o /dev/null -w "%{http_code}" \
  -H "Host: api.example.com" http://${NLB_ENDPOINT}/langfuse/
# 예상: 200 또는 로그인 리다이렉트(302/307)
```

---

## 다음 단계

위 검증 결과를 바탕으로 다음 단계를 선택하세요. 배포 오류를 해결하거나, 고급 기능을 추가하거나, 모니터링 연동을 진행할 수 있습니다.

1. **문제 해결**: 배포 중 오류가 발생했다면 [트러블슈팅 가이드](./troubleshooting-guide.md)를 참조하세요.
2. **고급 기능**: 프로덕션 환경을 위한 [LLM Classifier, CloudFront/WAF, Semantic Caching](./advanced-features.md)을 구성하세요.
3. **모니터링**: [Langfuse 배포 가이드](../../integrations/monitoring-observability-setup.md)를 참조하여 OTel 연동을 완료하세요.

---

## 참고 자료

- [트러블슈팅 가이드](./troubleshooting-guide.md) - kgateway·HTTPRoute·Bifrost 배포 오류 진단과 해결
- [고급 기능](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [추론 게이트웨이 라우팅](../../../model-serving/inference-routing/routing-strategy.md) - kgateway 아키텍처 및 라우팅 전략
- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/)
- [kgateway 공식 문서](https://kgateway.dev/docs/)
- [Bifrost 공식 문서](https://docs.getbifrost.ai/)
