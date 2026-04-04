---
title: "Inference Gateway 및 Dynamic Routing"
sidebar_label: "Inference Gateway"
description: "Kgateway 기반 AI 모델 추론 요청의 동적 라우팅 및 로드 밸런싱 구성"
tags: [eks, gateway-api, kgateway, routing, load-balancing, inference]
category: "genai-aiml"
last_update:
  date: 2026-04-04
  author: devfloor9
sidebar_position: 1
---

# Inference Gateway 및 Dynamic Routing

> 📅 **작성일**: 2025-02-05 | **수정일**: 2026-02-14 | ⏱️ **읽는 시간**: 약 6분

## 개요

대규모 AI 모델 서빙 환경에서는 다양한 모델에 대한 추론 요청을 효율적으로 라우팅하고 관리하는 것이 핵심입니다. 이 문서에서는 Kubernetes Gateway API와 Kgateway를 활용하여 AI 모델 추론 요청의 동적 라우팅, 로드 밸런싱, 그리고 장애 대응 전략을 구성하는 방법을 다룹니다.

### 주요 목표

- **지능형 라우팅**: 요청 특성에 따른 최적의 모델 백엔드 선택
- **트래픽 분배**: 가중치 기반 로드 밸런싱으로 안정적인 서비스 제공
- **점진적 배포**: 카나리 및 A/B 테스트를 통한 안전한 모델 업데이트
- **고가용성**: 폴백 및 재시도 정책을 통한 서비스 연속성 보장

---

## Inference Gateway 아키텍처

### 전체 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph CL["Client Layer"]
        CLIENT[Clients]
        SDK[SDK]
        UI[UI]
    end

    subgraph GTW["Gateway Layer"]
        GC[GatewayClass]
        GW[Gateway]
        HR1[model-routing]
        HR2[canary-routing]
        HR3[fallback-routing]
    end

    subgraph BE["Backend Services"]
        subgraph PA["Pool A"]
            V1[vLLM<br/>GPT-4 Pri]
            V2[vLLM<br/>GPT-4 Can]
        end

        subgraph PB["Pool B"]
            V3[vLLM<br/>Claude-3]
        end

        subgraph PC["Pool C"]
            T1[TGI<br/>Mixtral-8x7B]
        end
    end

    subgraph OBS["Observability"]
        M[Prometheus]
        T[OpenTelemetry]
    end

    CLIENT & SDK & UI --> GW
    GC --> GW
    GW --> HR1 & HR2 & HR3

    HR1 --> V1 & V3 & T1
    HR2 --> V1 & V2
    HR3 --> V1 & V3

    GW -.-> M & T

    style GW fill:#326ce5,stroke:#333
    style V1 fill:#ffd93d,stroke:#333
    style V2 fill:#76b900,stroke:#333
    style V3 fill:#ff9900,stroke:#333
    style T1 fill:#e53935,stroke:#333
```

### 컴포넌트 구조

import { ComponentStructureTable } from '@site/src/components/InferenceGatewayTables';

<ComponentStructureTable />


### 트래픽 플로우

```mermaid
sequenceDiagram
    participant C as Client
    participant G as kgateway
    participant R as HTTPRoute
    participant L as LB
    participant M as Model

    C->>G: POST /v1/chat<br/>x-model-id: gpt-4
    G->>R: 라우팅 매칭
    R->>L: 백엔드 선택<br/>(가중치)
    L->>M: 요청 전달
    M-->>L: 추론 결과
    L-->>G: 응답
    G-->>C: 최종 응답
```

:::info Gateway API 표준
Kgateway는 Kubernetes Gateway API 표준을 구현하여 벤더 중립적인 설정이 가능합니다. 이를 통해 다른 Gateway 구현체로의 마이그레이션이 용이합니다.
:::

### Topology-Aware Routing (Kubernetes 1.33+)

Kubernetes 1.33+의 topology-aware routing을 활용하면 동일 AZ 내 Pod 간 통신을 우선시하여 크로스 AZ 데이터 전송 비용을 절감하고 지연 시간을 개선할 수 있습니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vllm-inference
  namespace: ai-inference
  annotations:
    # Kubernetes 1.33+ Topology-Aware Routing
    service.kubernetes.io/topology-mode: "Auto"
spec:
  selector:
    app: vllm
  ports:
    - port: 8000
      targetPort: 8000
  # 토폴로지 인식 라우팅 활성화
  trafficDistribution: PreferClose
```

##### Topology-Aware Routing 효과

import { TopologyEffectsTable } from '@site/src/components/InferenceGatewayTables';

<TopologyEffectsTable />


:::tip Topology-Aware Routing 활용 시나리오
- **멀티 AZ 배포**: 여러 AZ에 분산된 GPU 노드 간 통신 최적화
- **대규모 추론**: 높은 처리량이 필요한 추론 워크로드
- **비용 최적화**: 크로스 AZ 데이터 전송 비용 절감이 중요한 경우
:::

---

## Kgateway 설치 및 구성

### 사전 요구사항

- Kubernetes 1.33 이상 (topology-aware routing 지원)
- Helm 3.x
- Gateway API CRD 설치

:::info Kubernetes 1.33+ 권장
Kubernetes 1.33+를 사용하면 topology-aware routing을 활용하여 크로스 AZ 트래픽 비용을 절감하고 지연 시간을 개선할 수 있습니다. Kubernetes 1.34+에서는 projected service account tokens로 보안이 더욱 강화됩니다.
:::

### Gateway API CRD 설치

```bash
# Gateway API 표준 CRD 설치 (v1.2.0+)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# 실험적 기능 포함 설치 (HTTPRoute 필터 등)
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/experimental-install.yaml
```

:::info Gateway API v1.2.0+ 기능
Gateway API v1.2.0은 다음과 같은 향상된 기능을 제공합니다:
- **HTTPRoute 개선**: 더 유연한 라우팅 규칙
- **GRPCRoute 안정화**: gRPC 서비스 라우팅 지원
- **BackendTLSPolicy**: 백엔드 TLS 설정 표준화
- **Kubernetes 1.33+ 통합**: Topology-aware routing 지원
:::

### Kgateway Helm 차트 설치

```bash
# Helm 저장소 추가
helm repo add kgateway oci://cr.kgateway.dev/kgateway-dev/charts
helm repo update

# 네임스페이스 생성
kubectl create namespace kgateway-system

# Kgateway 설치 (v2.0+)
helm install kgateway kgateway/kgateway \
  --namespace kgateway-system \
  --version 2.0.5 \
  --set controller.replicaCount=2 \
  --set controller.resources.requests.cpu=500m \
  --set controller.resources.requests.memory=512Mi \
  --set controller.resources.limits.cpu=1000m \
  --set controller.resources.limits.memory=1Gi \
  --set metrics.enabled=true \
  --set metrics.serviceMonitor.enabled=true
```

:::info Kgateway v2.0+ 기능
Kgateway v2.0+는 다음과 같은 향상된 기능을 제공합니다:
- **Gateway API v1.2.0+ 지원**: 최신 Gateway API 표준 완벽 지원
- **향상된 성능**: 더 빠른 라우팅 및 낮은 지연 시간
- **Kubernetes 1.33+ 최적화**: Topology-aware routing 통합
:::

### Helm Values 상세 설정

```yaml
# values.yaml
controller:
  replicaCount: 2

  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

  # 고가용성 설정
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: kgateway
            topologyKey: kubernetes.io/hostname

# 메트릭 설정
metrics:
  enabled: true
  port: 9090
  serviceMonitor:
    enabled: true
    interval: 15s
    labels:
      release: prometheus

# 로깅 설정
logging:
  level: info
  format: json

# TLS 설정
tls:
  enabled: true
  certManager:
    enabled: true
    issuerRef:
      name: letsencrypt-prod
      kind: ClusterIssuer
```

---

## GatewayClass 및 Gateway 설정

### GatewayClass 정의

GatewayClass는 Gateway 구현체를 정의합니다.

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
  # 프록시 설정
  proxy:
    replicas: 3
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "2"
        memory: "4Gi"

  # 연결 설정
  connectionSettings:
    maxConnections: 10000
    connectTimeout: 10s
    idleTimeout: 60s
```

### Gateway 리소스 정의

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ai-inference-gateway
  namespace: ai-gateway
  annotations:
    # AWS ALB 통합
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  gatewayClassName: kgateway

  listeners:
    # HTTPS 리스너
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "inference.example.com"
      tls:
        mode: Terminate
        certificateRefs:
          - name: inference-tls-cert
            kind: Secret
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              gateway-access: "true"

    # HTTP 리스너 (HTTPS 리다이렉트용)
    - name: http
      protocol: HTTP
      port: 80
      hostname: "inference.example.com"
      allowedRoutes:
        namespaces:
          from: Same

    # 내부 gRPC 리스너
    - name: grpc
      protocol: HTTPS
      port: 8443
      hostname: "inference-grpc.example.com"
      tls:
        mode: Terminate
        certificateRefs:
          - name: inference-grpc-tls-cert
      allowedRoutes:
        kinds:
          - kind: GRPCRoute
```

:::warning TLS 인증서 관리
프로덕션 환경에서는 cert-manager를 사용하여 TLS 인증서를 자동으로 관리하세요. 수동 인증서 관리는 만료로 인한 서비스 중단 위험이 있습니다.
:::

---

## Dynamic Routing 설정

### 헤더 기반 라우팅

요청 헤더의 `x-model-id` 값에 따라 적절한 모델 백엔드로 라우팅합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-header-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway
      namespace: ai-gateway
      sectionName: https

  hostnames:
    - "inference.example.com"

  rules:
    # GPT-4 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        - name: vllm-gpt4-service
          namespace: ai-inference
          port: 8000
          weight: 100

    # Claude-3 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "claude-3"
      backendRefs:
        - name: vllm-claude3-service
          namespace: ai-inference
          port: 8000
          weight: 100

    # Mixtral MoE 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "mixtral-8x7b"
      backendRefs:
        - name: tgi-mixtral-service
          namespace: ai-inference
          port: 8080
          weight: 100
```

### 경로 기반 라우팅

API 경로에 따라 다른 서비스로 라우팅합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: path-based-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway
      namespace: ai-gateway

  hostnames:
    - "inference.example.com"

  rules:
    # Chat Completions API
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
      backendRefs:
        - name: chat-completion-service
          port: 8000

    # Embeddings API
    - matches:
        - path:
            type: PathPrefix
            value: /v1/embeddings
      backendRefs:
        - name: embedding-service
          port: 8000

    # Completions API (Legacy)
    - matches:
        - path:
            type: PathPrefix
            value: /v1/completions
      backendRefs:
        - name: completion-service
          port: 8000

    # Health Check
    - matches:
        - path:
            type: Exact
            value: /health
      backendRefs:
        - name: health-check-service
          port: 8080
```

### 복합 조건 라우팅

여러 조건을 조합한 고급 라우팅 규칙입니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: advanced-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    # 프리미엄 고객 + GPT-4 요청 → 전용 백엔드
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
            - name: x-customer-tier
              value: "premium"
      backendRefs:
        - name: vllm-gpt4-premium
          port: 8000

    # 일반 고객 + GPT-4 요청 → 공유 백엔드
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
            - name: x-customer-tier
              value: "standard"
      backendRefs:
        - name: vllm-gpt4-shared
          port: 8000
```

---

## 로드 밸런싱 전략

### 가중치 기반 트래픽 분배

모델 버전 간 트래픽을 가중치로 분배합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: weighted-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        # Primary 백엔드: 80% 트래픽
        - name: vllm-gpt4-v1
          port: 8000
          weight: 80
        # Secondary 백엔드: 20% 트래픽
        - name: vllm-gpt4-v2
          port: 8000
          weight: 20
```

### A/B 테스트 라우팅

새로운 모델 버전을 특정 사용자 그룹에게만 노출합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ab-test-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    # A/B 테스트 그룹 A (기존 모델)
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-ab-test-group
              value: "control"
      backendRefs:
        - name: vllm-model-baseline
          port: 8000

    # A/B 테스트 그룹 B (새 모델)
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-ab-test-group
              value: "experiment"
      backendRefs:
        - name: vllm-model-new
          port: 8000
```

### 카나리 배포

새 모델 버전을 점진적으로 롤아웃합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: canary-deployment
  namespace: ai-gateway
  annotations:
    # 카나리 배포 단계 추적
    deployment.kubernetes.io/canary-weight: "10"
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        # Stable 버전: 90%
        - name: vllm-gpt4-stable
          port: 8000
          weight: 90
        # Canary 버전: 10%
        - name: vllm-gpt4-canary
          port: 8000
          weight: 10
```

:::tip 카나리 배포 전략

1. **초기 단계**: 5-10% 트래픽으로 시작
2. **모니터링**: 오류율, 지연 시간, 품질 메트릭 확인
3. **점진적 증가**: 문제 없으면 25% → 50% → 75% → 100%
4. **롤백 준비**: 문제 발생 시 즉시 0%로 롤백

:::

### 카나리 배포 진행 예시

```mermaid
gantt
    title 카나리 배포 타임라인
    dateFormat HH:mm
    axisFormat %H:%M

    section 트래픽
    10%  :a1, 00:00, 30m
    25%  :a2, after a1, 30m
    50%  :a3, after a2, 60m
    75%  :a4, after a3, 60m
    100% :a5, after a4, 60m

    section 모니터링
    메트릭 확인 :b1, 00:00, 300m
```

---

## 장애 대응 설정

### 폴백 설정

주 백엔드 장애 시 대체 백엔드로 자동 전환합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: fallback-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        # Primary 백엔드
        - name: vllm-gpt4-primary
          port: 8000
          weight: 100
      # 폴백 설정은 BackendLBPolicy로 구성
---
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: BackendLBPolicy
metadata:
  name: gpt4-fallback-policy
  namespace: ai-gateway
spec:
  targetRefs:
    - group: ""
      kind: Service
      name: vllm-gpt4-primary
  sessionPersistence:
    sessionName: "model-session"
    type: Cookie
  # 폴백 백엔드 지정
  default:
    backendRef:
      name: vllm-gpt4-fallback
      port: 8000
```

### 타임아웃 설정

추론 요청의 타임아웃을 설정합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: timeout-config
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
      backendRefs:
        - name: vllm-service
          port: 8000
      timeouts:
        # 요청 타임아웃 (전체 요청 처리 시간)
        request: 120s
        # 백엔드 연결 타임아웃
        backendRequest: 60s
```

### 재시도 정책

일시적 오류에 대한 자동 재시도를 구성합니다.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: retry-policy
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
      backendRefs:
        - name: vllm-service
          port: 8000
      # 재시도 설정 (Kgateway 확장)
      filters:
        - type: ExtensionRef
          extensionRef:
            group: kgateway.dev
            kind: RetryPolicy
            name: inference-retry-policy
---
apiVersion: kgateway.dev/v1alpha1
kind: RetryPolicy
metadata:
  name: inference-retry-policy
  namespace: ai-gateway
spec:
  # 최대 재시도 횟수
  numRetries: 3

  # 재시도 조건
  retryOn:
    - "5xx"
    - "reset"
    - "connect-failure"
    - "retriable-4xx"

  # 재시도 간격
  perTryTimeout: 30s

  # 백오프 설정
  retryBackOff:
    baseInterval: 100ms
    maxInterval: 1s
```

### 서킷 브레이커 설정

연속 실패 시 백엔드를 일시적으로 차단합니다.

```yaml
apiVersion: kgateway.dev/v1alpha1
kind: CircuitBreakerPolicy
metadata:
  name: inference-circuit-breaker
  namespace: ai-gateway
spec:
  targetRefs:
    - group: ""
      kind: Service
      name: vllm-gpt4-service

  # 최대 동시 연결 수
  maxConnections: 1000

  # 최대 대기 요청 수
  maxPendingRequests: 100

  # 최대 동시 요청 수
  maxRequests: 1000

  # 연속 실패 임계값
  consecutiveErrors: 5

  # 차단 시간
  interval: 10s

  # 차단 해제 후 테스트 요청 수
  maxEjectionPercent: 50
```

:::danger 장애 대응 주의사항

- **타임아웃 설정**: LLM 추론은 시간이 오래 걸릴 수 있으므로 충분한 타임아웃 설정 필요
- **재시도 제한**: 무한 재시도는 시스템 과부하를 유발할 수 있음
- **서킷 브레이커**: 너무 민감한 설정은 정상 트래픽도 차단할 수 있음

:::

---

## 모니터링 및 관측성

### Prometheus 메트릭

Kgateway가 노출하는 주요 메트릭입니다.

import { MonitoringMetricsTable } from '@site/src/components/InferenceGatewayTables';

<MonitoringMetricsTable />


### ServiceMonitor 설정

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kgateway-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: kgateway
  namespaceSelector:
    matchNames:
      - kgateway-system
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

### Grafana 대시보드 쿼리 예시

```promql
# 초당 요청 수 (RPS)
sum(rate(kgateway_requests_total[5m])) by (route)

# P99 지연 시간
histogram_quantile(0.99,
  sum(rate(kgateway_request_duration_seconds_bucket[5m])) by (le, route)
)

# 오류율
sum(rate(kgateway_upstream_rq_5xx[5m])) /
sum(rate(kgateway_requests_total[5m])) * 100

# 백엔드별 활성 연결
sum(kgateway_upstream_cx_active) by (upstream_cluster)
```

### 알림 규칙

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kgateway-alerts
  namespace: monitoring
spec:
  groups:
    - name: kgateway-alerts
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(kgateway_upstream_rq_5xx[5m])) /
            sum(rate(kgateway_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Inference Gateway 오류율 5% 초과"
            description: "최근 5분간 오류율이 {{ $value | humanizePercentage }}입니다"

        - alert: HighLatency
          expr: |
            histogram_quantile(0.99,
              sum(rate(kgateway_request_duration_seconds_bucket[5m])) by (le)
            ) > 30
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Inference Gateway P99 지연 시간 30초 초과"

        - alert: CircuitBreakerOpen
          expr: kgateway_circuit_breaker_open == 1
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "서킷 브레이커 활성화됨"
            description: "{{ $labels.upstream_cluster }} 백엔드의 서킷 브레이커가 열렸습니다"
```

---

## 운영 모범 사례

### 라우팅 규칙 관리

1. **버전 관리**: HTTPRoute를 Git으로 관리하여 변경 이력 추적
2. **네임스페이스 분리**: 환경별(dev/staging/prod) 네임스페이스 분리
3. **라벨링**: 일관된 라벨링으로 리소스 관리 용이성 확보

### 성능 최적화

```yaml
# 연결 풀 최적화
apiVersion: kgateway.dev/v1alpha1
kind: ConnectionPoolSettings
metadata:
  name: inference-connection-pool
spec:
  targetRefs:
    - kind: Service
      name: vllm-service
  tcp:
    maxConnections: 1000
    connectTimeout: 10s
  http:
    h2UpgradePolicy: UPGRADE
    maxRequestsPerConnection: 100
    maxRetries: 3
```

### 보안 설정

```yaml
# Rate Limiting
apiVersion: kgateway.dev/v1alpha1
kind: RateLimitPolicy
metadata:
  name: inference-rate-limit
spec:
  targetRefs:
    - kind: HTTPRoute
      name: model-routing
  local:
    tokenBucket:
      maxTokens: 1000
      tokensPerFill: 100
      fillInterval: 1s
  # 테넌트별 제한
  descriptors:
    - entries:
        - key: x-tenant-id
      limit:
        requestsPerUnit: 100
        unit: MINUTE
```

---

## agentgateway: AI 네이티브 데이터 플레인

### agentgateway 개요

agentgateway는 kgateway의 **AI 워크로드 전용 데이터 플레인**으로, 기존 Envoy 데이터 플레인이 처리하기 어려운 AI 특화 프로토콜과 보안 요구사항을 해결합니다.

```mermaid
flowchart LR
    subgraph CP["Control Plane"]
        CTRL[kgateway<br/>Controller]
    end

    subgraph DP["Data Planes"]
        ENVOY[Envoy<br/>HTTP/gRPC]
        AGENT[agentgateway<br/>MCP/A2A]
    end

    subgraph BE["Backends"]
        REST[REST API<br/>vLLM/TGI]
        MCP[MCP Server<br/>Tools]
        A2A[A2A Agent<br/>협업]
    end

    CTRL --> ENVOY
    CTRL --> AGENT
    ENVOY --> REST
    AGENT --> MCP
    AGENT --> A2A

    style CTRL fill:#326ce5,stroke:#333
    style ENVOY fill:#ff9900,stroke:#333
    style AGENT fill:#e53935,stroke:#333
    style REST fill:#76b900,stroke:#333
    style MCP fill:#ffd93d,stroke:#333
    style A2A fill:#9c27b0,stroke:#333
```

### Envoy vs agentgateway 비교

| 특성 | Envoy Data Plane | agentgateway |
|---|---|---|
| 프로토콜 | HTTP/1.1, HTTP/2, gRPC | MCP (JSON-RPC), A2A |
| 세션 관리 | Stateless | Stateful (JSON-RPC 세션) |
| 보안 모델 | TLS, mTLS | Per-session Authorization, Tool Poisoning 방지 |
| 트래픽 패턴 | Request-Response | Bidirectional Streaming |
| 주요 대상 | REST API, 모델 추론 | AI Agent 통신, Tool 호출 |

### 핵심 기능

#### 1. Stateful JSON-RPC 세션

agentgateway는 MCP 프로토콜의 stateful 특성을 지원하여, 에이전트와 도구 간의 세션 컨텍스트를 유지합니다.

```yaml
apiVersion: agentgateway.io/v1alpha1
kind: MCPRoute
metadata:
  name: tool-routing
  namespace: ai-gateway
spec:
  parentRefs:
    - name: ai-inference-gateway
  rules:
    - matches:
        - method: "tools/call"
      backendRefs:
        - name: mcp-tool-server
          port: 3000
      sessionAffinity:
        enabled: true
        ttl: 300s
```

#### 2. Tool Poisoning 방지

에이전트가 호출하는 도구의 무결성을 검증하여 악의적인 도구 주입을 방지합니다.

```yaml
apiVersion: agentgateway.io/v1alpha1
kind: ToolPolicy
metadata:
  name: tool-validation
spec:
  validation:
    # 허용된 도구 목록만 호출 가능
    allowedTools:
      - "search_database"
      - "send_email"
      - "create_ticket"
    # 도구 응답 크기 제한
    maxResponseSize: 1Mi
    # 도구 호출 타임아웃
    timeout: 30s
  # 도구 설명 변조 감지
  integrityCheck:
    enabled: true
    hashAlgorithm: sha256
```

#### 3. Per-session Authorization

각 세션별로 독립적인 인가 정책을 적용할 수 있습니다.

```yaml
apiVersion: agentgateway.io/v1alpha1
kind: SessionPolicy
metadata:
  name: agent-session-auth
spec:
  authorization:
    # 세션 시작 시 JWT 토큰 검증
    jwt:
      issuer: "https://auth.example.com"
      audience: "agent-gateway"
    # 세션별 도구 접근 제어
    toolAccess:
      - role: "admin"
        tools: ["*"]
      - role: "user"
        tools: ["search_database", "create_ticket"]
```

### 2-Tier Gateway와의 통합

agentgateway는 kgateway의 2-Tier 아키텍처에서 Tier 2-B(자체 추론 인프라)의 AI 네이티브 트래픽을 처리합니다. 상세한 2-Tier Gateway 아키텍처와 솔루션 비교는 [LLM Gateway 2-Tier 아키텍처](./llm-gateway-architecture.md)를 참조하세요.

:::info agentgateway 프로젝트 현황
agentgateway는 2025년 말 kgateway 프로젝트에서 분리된 AI 전용 데이터 플레인으로, 현재 활발하게 개발 중입니다. MCP 프로토콜과 A2A 프로토콜의 빠른 발전에 맞춰 기능이 지속적으로 추가되고 있습니다.
:::

---

## kgateway 단일 NLB 통합 라우팅 패턴

### 개요

kgateway v2.2.2는 단일 NLB(Network Load Balancer) 뒤에서 여러 서비스를 Gateway API CRD 기반으로 라우팅할 수 있습니다. 이를 통해 vLLM 추론 API, Langfuse 관측성 대시보드, Grafana 메트릭 등을 통합된 엔드포인트로 제공할 수 있습니다.

### kgateway v2.2.2 설치

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

### 단일 NLB 통합 라우팅 구성

Gateway API CRD를 사용하여 단일 NLB 뒤에 여러 서비스를 라우팅합니다.

```yaml
# gateway-multi-service.yaml
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
---
# HTTPRoute for vLLM inference
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
---
# HTTPRoute for Langfuse observability
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
        - name: langfuse
          port: 80
---
# ReferenceGrant for cross-namespace access
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

### 라우팅 엔드포인트 구조

단일 NLB 엔드포인트로 여러 서비스를 제공합니다:

```
http://<NLB_ENDPOINT>/v1/*        → vLLM (추론 API)
http://<NLB_ENDPOINT>/langfuse/*  → Langfuse (Observability)
https://<AMG_ENDPOINT>            → Grafana (별도 관리형)
```

:::tip 설정 변경
Gateway API CRD 기반 라우팅은 Pod 재시작 없이 실시간으로 반영됩니다. HTTPRoute 또는 Gateway 리소스를 수정하면 kgateway 컨트롤러가 자동으로 감지하여 즉시 적용합니다.
:::

### 메트릭 노출

kgateway는 Prometheus 메트릭을 기본 포트 9091에서 노출합니다:

```yaml
# kgateway-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kgateway-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: kgateway
  namespaceSelector:
    matchNames:
      - kgateway-system
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

주요 메트릭:
- `kgateway_requests_total`: 총 요청 수
- `kgateway_request_duration_seconds`: 요청 지연 시간
- `kgateway_upstream_rq_5xx`: 백엔드 5xx 오류
- `kgateway_upstream_cx_active`: 활성 연결 수

### 코딩 도구 연결 예시

Continue.dev, Cursor, Aider 등의 AI 코딩 도구에서 kgateway를 통해 vLLM에 연결할 수 있습니다.

**Continue.dev 설정 예시**:

```json
{
  "models": [
    {
      "title": "Llama-3.1-70B",
      "provider": "openai",
      "model": "meta-llama/Llama-3.1-70B-Instruct",
      "apiBase": "http://[NLB_ENDPOINT]/v1",
      "apiKey": "dummy"
    }
  ]
}
```

**Cursor 설정 예시**:

Settings → Models → OpenAI API Compatible
- Base URL: `http://[NLB_ENDPOINT]/v1`
- Model: `meta-llama/Llama-3.1-70B-Instruct`
- API Key: `dummy`

**Aider 설정 예시**:

```bash
aider \
  --model openai/meta-llama/Llama-3.1-70B-Instruct \
  --openai-api-base http://[NLB_ENDPOINT]/v1 \
  --openai-api-key dummy
```

:::info 엔드포인트 비식별화
실제 프로덕션 환경에서는 NLB 엔드포인트를 도메인 네임(예: `api.your-company.com`)으로 매핑하여 사용하세요. 직접 IP 주소나 AWS 자동 생성 DNS 이름을 노출하지 마세요.
:::

---

## Bifrost 선택 가이드

### Bifrost란?

Bifrost는 경량 LLM Gateway로, 여러 프로바이더(OpenAI, Anthropic, Bedrock 등)를 단일 엔드포인트로 통합하고 cascade routing, semantic caching, guardrails 등의 기능을 제공합니다.

### 언제 Bifrost가 필요한가?

#### 단일 모델만 사용하는 경우: **불필요**

vLLM 하나만 사용하고 복잡한 라우팅이 필요 없다면 kgateway에서 직접 vLLM으로 라우팅하는 것이 가장 간단합니다.

```mermaid
flowchart LR
    CLIENT[Client] --> KGATEWAY[kgateway] --> VLLM[vLLM]
    
    style KGATEWAY fill:#326ce5,stroke:#333
    style VLLM fill:#ffd93d,stroke:#333
```

#### 멀티 모델 + 고급 기능이 필요한 경우: **유용**

다음 기능이 필요한 경우 Bifrost를 추가하세요:

1. **Cascade Routing**: 저렴한 모델로 시도 후 실패 시 고성능 모델로 자동 폴백
2. **Semantic Caching**: 의미론적으로 유사한 쿼리에 대한 응답 캐싱
3. **Guardrails**: PII 필터링, 프롬프트 인젝션 방어
4. **멀티 프로바이더 통합**: OpenAI + Anthropic + Bedrock + 자체 vLLM

```mermaid
flowchart LR
    CLIENT[Client] --> KGATEWAY[kgateway] --> BIFROST[Bifrost]
    
    BIFROST --> VLLM1[vLLM<br/>Llama-70B]
    BIFROST --> VLLM2[vLLM<br/>Mixtral-8x7B]
    BIFROST --> OPENAI[OpenAI<br/>GPT-4o]
    BIFROST --> BEDROCK[Bedrock<br/>Claude-4]
    
    style KGATEWAY fill:#326ce5,stroke:#333
    style BIFROST fill:#e53935,stroke:#333
    style VLLM1 fill:#ffd93d,stroke:#333
    style VLLM2 fill:#ffd93d,stroke:#333
```

### Bifrost 설정 특징

#### ConfigMap 기반 설정

Bifrost는 ConfigMap으로 라우팅 규칙을 관리합니다:

```yaml
# bifrost-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bifrost-config
  namespace: ai-gateway
data:
  config.yaml: |
    models:
      - name: openai/gpt-4o-mini
        provider: openai
        api_key: ${OPENAI_API_KEY}
      
      - name: anthropic/claude-sonnet-4
        provider: anthropic
        api_key: ${ANTHROPIC_API_KEY}
      
      - name: vllm/llama-70b
        provider: openai
        api_base: http://vllm-service.ai-inference.svc:8000/v1
        api_key: dummy
    
    cascade_routing:
      enabled: true
      fallback_chain:
        - vllm/llama-70b
        - openai/gpt-4o-mini
        - anthropic/claude-sonnet-4
```

:::warning 설정 변경 시 Pod 재시작 필요
kgateway는 CRD 변경 시 자동 반영되지만, Bifrost는 ConfigMap 변경 시 **Pod를 재시작**해야 적용됩니다:

```bash
kubectl rollout restart deployment bifrost -n ai-gateway
```
:::

#### 모델 이름 형식 주의

Bifrost는 `provider/model` 형식의 모델 이름을 사용합니다:

```
✅ 올바른 형식:
- openai/gpt-4o
- anthropic/claude-sonnet-4
- vllm/llama-70b

❌ 잘못된 형식:
- gpt-4o (프로바이더 누락)
- openai-gpt-4o (슬래시 대신 하이픈)
```

클라이언트 요청 시 모델 이름을 정확히 지정해야 합니다:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://[NLB_ENDPOINT]/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="vllm/llama-70b",  # 프로바이더 포함 필수
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 선택 가이드 요약

| 사용 사례 | 권장 구성 | 이유 |
|-----------|----------|------|
| vLLM 단일 모델만 사용 | kgateway → vLLM | 단순함, 낮은 지연 시간 |
| 여러 vLLM 모델 라우팅 | kgateway → vLLM (HTTPRoute 멀티) | Gateway API CRD로 충분 |
| 멀티 프로바이더 + Cascade | kgateway → Bifrost → 여러 프로바이더 | 비용 최적화, 고급 라우팅 |
| Semantic Caching 필요 | kgateway → Bifrost | 응답 캐싱으로 비용 절감 |
| Guardrails 필요 | kgateway → Bifrost | PII 필터링, 프롬프트 방어 |

---

## 요약

Inference Gateway는 AI 모델 서빙 환경에서 트래픽 관리의 핵심 컴포넌트입니다.

### 핵심 포인트

1. **Kubernetes Gateway API**: 표준 기반 설정으로 이식성 확보
2. **동적 라우팅**: 헤더, 경로 기반 유연한 라우팅 규칙
3. **로드 밸런싱**: 가중치 기반 트래픽 분배로 점진적 배포 지원
4. **장애 대응**: 타임아웃, 재시도, 서킷 브레이커로 안정성 확보
5. **관측성**: Prometheus 메트릭으로 실시간 모니터링
6. **agentgateway**: MCP/A2A 프로토콜 네이티브 지원으로 AI 에이전트 통신 보안 강화

### 다음 단계

- [LLM Gateway 2-Tier 아키텍처](./llm-gateway-architecture.md) - 2-Tier Gateway 설계 및 솔루션 선택
- [LLMOps Observability](../operations-mlops/llmops-observability.md) - Langfuse/LangSmith 기반 LLM 관측성
- [GPU 리소스 관리](../model-serving/gpu-resource-management.md) - 동적 리소스 할당 전략
- [MoE 모델 서빙](../model-serving/moe-model-serving.md) - Mixture of Experts 모델 배포
- [Agent 모니터링](../operations-mlops/agent-monitoring.md) - Langfuse 통합 가이드

---

## 참고 자료

- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/)
- [Kgateway 공식 문서](https://kgateway.dev/docs/)
- [vLLM 공식 문서](https://docs.vllm.ai/)
- [Envoy Proxy 문서](https://www.envoyproxy.io/docs/)
