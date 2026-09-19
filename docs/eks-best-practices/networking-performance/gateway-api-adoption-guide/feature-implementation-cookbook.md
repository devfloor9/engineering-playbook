---
title: "기능별 구현 쿡북: 6개 Gateway API 구현체"
description: 인증·Rate Limiting·IP 제어·URL Rewrite·헤더 조작·세션 어피니티·본문 크기 제한·커스텀 에러 페이지를 AWS LBC·Cilium·NGINX GF·Envoy Gateway·kGateway별 YAML로 구현하는 레퍼런스
created: "2026-06-17"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 13
tags:
  - eks
  - gateway-api
  - cilium
  - envoy
  - kong
  - networking
  - scope:tech
sidebar_label: 기능별 구현 쿡북
category: performance-networking
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info
이 문서는 [Gateway API 도입 가이드](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide)의 심화 가이드입니다. NGINX Ingress에서 사용하던 8가지 주요 기능을 각 Gateway API 구현체에서 어떻게 구현하는지 YAML 예제로 비교합니다. 솔루션 선정·비교표·의사결정 트리는 본 가이드의 [섹션 4](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide#4-gateway-api-구현체-비교---aws-native-vs-open-source)를 참조하세요.
:::

## 개요

이 쿡북은 다음 8가지 기능을 AWS Native(LBC v3), Cilium, NGINX Gateway Fabric, Envoy Gateway, kGateway별로 구현하는 방법을 다룹니다. URL Rewrite와 헤더 조작은 Gateway API v1 표준 기능으로 모든 구현체에서 동일하게 작동합니다.

| # | 기능 | 표준 여부 |
|---|------|----------|
| 1 | 인증 (Basic Auth 대체) | 구현체별 상이 |
| 2 | Rate Limiting | 구현체별 상이 |
| 3 | IP 제어 (IP Allowlist) | 구현체별 상이 |
| 4 | URL Rewrite | Gateway API v1 표준 |
| 5 | Header 조작 | Gateway API v1 표준 |
| 6 | 세션 어피니티 (Cookie-based) | 구현체별 상이 |
| 7 | 요청 본문 크기 제한 | 구현체별 상이 |
| 8 | 커스텀 에러 페이지 | 구현체별 상이 |

---

## 1. 인증 (Basic Auth 대체)

아래 탭은 서로 다른 controller의 **대안 구성**입니다. 해당 버전의 CRD/controller, `production` namespace, 같은 namespace의 `production-gateway` HTTPS listener(`https`)와 TLS 인증서, DNS, `api-service:8080` backend가 준비되어야 합니다. `example.com` IdP/host와 Secret/공개 키 참조는 실제 환경에 맞게 바꿉니다. manifest를 렌더링·파싱한 것만으로 인증 성공을 확인할 수는 없습니다.

`Authorization` 헤더의 존재나 정규식 일치는 인증이 아닙니다. JWT 서명·issuer·audience·시간 조건 검증 또는 실제 인증 서비스의 allow/deny 결정이 필요합니다. 아래 예제는 학습용 자격 증명을 내장하지 않으며, 배포·인증 요청은 실행하지 않았습니다.
<Tabs>
<TabItem value="aws" label="AWS Native" default>
AWS LBC 3.0.0의 확장은 `gateway.k8s.aws/v1beta1`의 `ListenerRuleConfiguration`입니다. HTTPS listener에서 ALB가 RS256 JWT의 서명·`iss`·`exp`를 검증하고, 존재하면 `nbf/iat`도 확인합니다. 여기서는 문자열 `aud=api-gateway-client`를 추가로 요구합니다. IdP가 audience 배열을 내보내면 해당 claim 형식도 맞춰야 합니다. JWKS endpoint의 공개 접근성과 ALB 제한은 [공식 JWT 문서](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html)를 확인합니다.
```yaml
# auth-aws.yaml
# AWS Load Balancer Controller v3.0.0; existing HTTPS listener named https.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: jwt-protected-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      filters:
        - type: ExtensionRef
          extensionRef:
            group: gateway.k8s.aws
            kind: ListenerRuleConfiguration
            name: api-jwt
      backendRefs:
        - name: api-service
          port: 8080
---
apiVersion: gateway.k8s.aws/v1beta1
kind: ListenerRuleConfiguration
metadata:
  name: api-jwt
  namespace: production
spec:
  actions:
    - type: jwt-validation
      jwtValidationConfig:
        jwksEndpoint: https://idp.example.com/realms/production/protocol/openid-connect/certs
        issuer: https://idp.example.com/realms/production
        additionalClaims:
          - name: aud
            format: single-string
            values:
              - api-gateway-client
```
JWT 검증은 browser OIDC 로그인 redirect와 다른 기능입니다. 유효한 token은 backend에 그대로 전달되며 위 확장은 `claimsToHeaders`를 구성하지 않습니다. downstream identity header가 필요하면 별도 신뢰·덮어쓰기 계약을 정의합니다. [LBC 3.0.0 LRC 계약](https://github.com/kubernetes-sigs/aws-load-balancer-controller/blob/v3.0.0/docs/guide/gateway/listenerruleconfig.md)
</TabItem>
<TabItem value="cilium" label="Cilium">
:::warning 제한 사항
Cilium은 네이티브 JWT/OIDC 인증을 지원하지 않습니다. CiliumEnvoyConfig로 Envoy ext_authz 필터를 구성하거나, 별도 인증 서비스(OAuth2 Proxy 등)를 배포해야 합니다.
:::

이 경고의 Cilium 1.19.3 경계는 그대로 유지합니다. 아래에서는 별도 OAuth2 Proxy를 사용하는 **browser OIDC 세션** 경로를 선택합니다. Gateway는 `/api`와 `/oauth2` callback을 포함한 해당 host의 요청을 먼저 proxy로 보내고, proxy가 인증 후 `api-service`로 전달합니다. Bearer 헤더 일치만으로 backend에 보내는 route나 불완전한 CiliumEnvoyConfig를 추가하지 않습니다.

OAuth2 Proxy 7.9.0에 맞는 OIDC client/redirect URL, 허용 email domain과 Secret의 `client-id`, `client-secret`, `cookie-secret`을 준비합니다. cookie secret은 [공식 설정](https://oauth2-proxy.github.io/oauth2-proxy/7.9.x/configuration/overview/)의 키 길이·인코딩 조건을 따라 생성·보관합니다. IdP는 PKCE S256 및 필요한 email claim을 지원해야 합니다.
```yaml
# auth-cilium.yaml
# Cilium Gateway API + OAuth2 Proxy 7.9.0: browser OIDC session authentication.
# Pre-create oauth2-proxy-credentials with client-id, client-secret, cookie-secret.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oauth2-proxy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: oauth2-proxy
  template:
    metadata:
      labels:
        app: oauth2-proxy
    spec:
      containers:
        - name: oauth2-proxy
          image: quay.io/oauth2-proxy/oauth2-proxy:v7.9.0
          args:
            - --provider=oidc
            - --oidc-issuer-url=https://idp.example.com/realms/production
            - --redirect-url=https://api.example.com/oauth2/callback
            - --email-domain=example.com
            - --upstream=http://api-service.production.svc.cluster.local:8080
            - --http-address=0.0.0.0:4180
            - --reverse-proxy=true
            - --cookie-secure=true
            - --cookie-samesite=lax
            - --code-challenge-method=S256
            - --skip-provider-button=true
          env:
            - name: OAUTH2_PROXY_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: oauth2-proxy-credentials
                  key: client-id
            - name: OAUTH2_PROXY_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: oauth2-proxy-credentials
                  key: client-secret
            - name: OAUTH2_PROXY_COOKIE_SECRET
              valueFrom:
                secretKeyRef:
                  name: oauth2-proxy-credentials
                  key: cookie-secret
          ports:
            - name: http
              containerPort: 4180
          readinessProbe:
            httpGet:
              path: /ready
              port: http
          livenessProbe:
            httpGet:
              path: /ping
              port: http
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: "1"
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: oauth2-proxy
  namespace: production
spec:
  selector:
    app: oauth2-proxy
  ports:
    - name: http
      port: 4180
      targetPort: http
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: auth-protected
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: oauth2-proxy
          port: 4180
---
# Restrict the application to traffic from the actual authentication proxy Pods.
# Other policies allowing these Pods remain additive and must also be reviewed.
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-from-auth-proxy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api-service
  ingress:
    - fromEndpoints:
        - matchLabels:
            io.kubernetes.pod.namespace: production
            app: oauth2-proxy
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
```
`endpointSelector`의 `app: api-service`는 실제 backend Pod의 라벨과 일치해야 합니다. 서비스 이름만 같아서는 해당 Pod에 정책이 적용되지 않습니다. Gateway→proxy와 proxy→backend의 네트워크 정책·TLS 요구도 확인합니다.

Backend를 별도 외부 route/Service로 노출하지 않고, 다른 허용 정책이 접근 범위를 넓히는지도 검토합니다. 인증 proxy에서는 접근되고 다른 Pod나 외부 경로에서는 차단되는지 실제로 확인해야 합니다. 위 정책은 임의의 `ingress-nginx` namespace 대신 인증 proxy Pod를 선택합니다. Bearer-token API 인증이나 gRPC ext_authz가 필요하면 해당 프로토콜의 authorizer와 listener·route·filter·cluster를 연결하고 실패 시 동작을 별도로 검증합니다.
</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">
:::warning 인증 방식 구분
NGINX Gateway Fabric 2.4.0의 아래 `AuthenticationFilter`는 **Basic 인증**입니다. JWT/OIDC 인증을 구성하지 않으며, `UpstreamSettingsPolicy`도 인증 정책이 아닙니다. OIDC가 필요하면 검증된 별도 인증 proxy 경로 등 해당 버전이 지원하는 구성을 사용합니다.
:::

`production/api-basic-auth` Secret의 `auth` key에 htpasswd 형식의 자격 증명을 외부 비밀 관리 절차로 준비합니다. TLS listener가 필요하며 비밀번호·hash 예시를 재사용하지 않습니다. [2.4.0 AuthenticationFilter schema](https://github.com/nginx/nginx-gateway-fabric/blob/v2.4.0/apis/v1alpha1/authenticationfilter_types.go)
```yaml
# auth-nginx.yaml
# NGINX Gateway Fabric v2.4.0. This implements Basic authentication, not JWT.
# Pre-create Secret api-basic-auth in production, with an auth key containing
# htpasswd-format credentials generated and rotated outside the document.
apiVersion: gateway.nginx.org/v1alpha1
kind: AuthenticationFilter
metadata:
  name: api-basic-auth
  namespace: production
spec:
  type: Basic
  basic:
    secretRef:
      name: api-basic-auth
    realm: Protected API
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: auth-protected
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      filters:
        - type: ExtensionRef
          extensionRef:
            group: gateway.nginx.org
            kind: AuthenticationFilter
            name: api-basic-auth
      backendRefs:
        - name: api-service
          port: 8080
```
</TabItem>
<TabItem value="envoy" label="Envoy Gateway">
Envoy Gateway 1.7.0에서는 `SecurityPolicy.extAuth.http.backendRefs`로 HTTP authorizer를 연결합니다. 같은 namespace의 `auth-service:8080`은 원래 요청 경로에서 Authorization 값을 검증하고 허용 시 200, 거부 시 401/403을 반환하는 **HTTP ext_authz 계약**을 구현해야 합니다. OAuth2 Proxy의 browser proxy port를 검증 없이 이 check endpoint로 지정하지 않습니다.
```yaml
# auth-envoy.yaml
# Envoy Gateway v1.7.0; auth-service implements the HTTP ext_authz contract.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: ext-auth
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  extAuth:
    failOpen: false
    timeout: 2s
    headersToExtAuth:
      - authorization
    http:
      backendRefs:
        - name: auth-service
          port: 8080
```
`failOpen: false`는 authorizer 오류/timeout 시 backend 전달을 차단합니다. `http.path`를 추가하면 원래 경로 앞에 붙으므로 서비스의 routing과 맞춰야 합니다. 필요한 경우에만 검증한 identity response header를 `headersToBackend`로 허용하고 backend가 다른 입력 header를 신뢰하지 않도록 합니다. [1.7.0 extAuth 계약](https://github.com/envoyproxy/gateway/blob/v1.7.0/api/v1alpha1/ext_auth_types.go)
</TabItem>
<TabItem value="kgateway" label="kGateway">
kgateway 2.2.0 Envoy 경로는 `gateway.kgateway.dev`의 `TrafficPolicy`와 JWT provider를 정의한 `GatewayExtension`을 사용합니다. 아래 예제는 trusted 공개 JWKS를 `production/api-jwks` ConfigMap의 `jwks` key로 제공합니다. 키 회전·철회와 ConfigMap 갱신 절차가 필요하며 임의 또는 오래된 공개 키를 그대로 사용하면 안 됩니다.
```yaml
# auth-kgateway.yaml
# kgateway v2.2.0 (Envoy data plane), not the legacy Gloo RouteOption API.
# Pre-create api-jwks ConfigMap in production; its jwks key contains trusted,
# public signing keys. Define and operate a key-rotation/update procedure.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
---
apiVersion: gateway.kgateway.dev/v1alpha1
kind: TrafficPolicy
metadata:
  name: jwt-auth
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  jwtAuth:
    extensionRef:
      name: api-jwt
---
apiVersion: gateway.kgateway.dev/v1alpha1
kind: GatewayExtension
metadata:
  name: api-jwt
  namespace: production
spec:
  type: JWT
  jwt:
    providers:
      - name: keycloak
        issuer: https://idp.example.com/realms/production
        audiences:
          - api-gateway-client
        tokenSource:
          header:
            header: Authorization
            prefix: "Bearer "
        forwardToken: false
        jwks:
          local:
            configMapRef:
              name: api-jwks
```
`jwtAuth.extensionRef`, provider의 `jwks.local.configMapRef`, issuer/audience/token source를 동일 namespace에서 연결합니다. token을 downstream에 전달하지 않도록 명시했으며, 이 예제는 claim-to-header 신뢰 계약을 추가하지 않습니다. [2.2.0 JWT schema](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/api/v1alpha1/kgateway/jwt_types.go) · [versioned configuration example](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/pkg/kgateway/translator/gateway/testutils/inputs/jwt/gateway-configmap.yaml)
</TabItem>
</Tabs>
인증 적용 전후에는 선택한 메커니즘에 맞춰 정상 자격 증명, 누락·변조·만료된 token 또는 잘못된 비밀번호, 잘못된 issuer/audience, authorizer 장애, callback 경로와 backend 직접 접근을 확인합니다. route/policy 상태의 `Accepted`/`ResolvedRefs`와 실제 backend 요청 도달 여부를 함께 기록해야 합니다. 정적 schema 검사만으로 이 실행 결과를 대신하지 않습니다.

## 2. Rate Limiting

<Tabs>
<TabItem value="aws" label="AWS Native" default>

:::warning 제한 사항
AWS Native(LBC v3)는 게이트웨이 레벨의 네이티브 Rate Limiting을 지원하지 않습니다. AWS WAF Rate-based Rule을 사용하여 IP 기반 요청 제한을 구현합니다.
:::

```yaml
# ALB에 WAF Rate-based Rule 연결
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    # Rate limiting WAF ACL ARN
    aws.load-balancer.waf-acl-arn: arn:aws:wafv2:us-west-2:123456789012:regional/webacl/rate-limit/a1b2c3d4
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

**ACK(AWS Controllers for Kubernetes)로 WAF Rate-based Rule 생성:**

ACK WAFv2 컨트롤러를 사용하면 WAF 리소스를 Kubernetes 매니페스트로 선언적 관리할 수 있습니다.

**EKS Capabilities로 ACK 활성화 (권장):**

EKS Capabilities(2025년 11월 GA)를 사용하면 ACK 컨트롤러를 AWS 완전 관리형으로 운영할 수 있습니다. 컨트롤러가 AWS 관리 인프라에서 실행되므로 워커 노드에 별도 Pod가 배포되지 않습니다.

```bash
# 1. IAM Capability Role 생성
aws iam create-role \
  --role-name EKS-ACK-Capability-Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "eks.amazonaws.com" },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": { "aws:SourceAccount": "<ACCOUNT_ID>" }
      }
    }]
  }'

# WAFv2 권한 정책 연결
aws iam put-role-policy \
  --role-name EKS-ACK-Capability-Role \
  --policy-name ACK-WAFv2-Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["wafv2:*"],
      "Resource": "*"
    }]
  }'

# 2. EKS 클러스터에 ACK Capability 생성
aws eks create-capability \
  --cluster-name my-eks-cluster \
  --capability-type ACK \
  --capability-configuration '{
    "capabilityRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/EKS-ACK-Capability-Role"
  }'

# 3. CRD 등록 확인
kubectl get crds | grep wafv2
```

<details>
<summary>대안: Helm으로 직접 설치 (비 EKS 환경)</summary>

EKS가 아닌 환경이나 컨트롤러를 직접 관리해야 하는 경우 Helm으로 설치할 수 있습니다.

```bash
helm install ack-wafv2-controller \
  oci://public.ecr.aws/aws-controllers-k8s/wafv2-chart \
  --namespace ack-system \
  --create-namespace \
  --set aws.region=ap-northeast-2
```

이 방식은 컨트롤러가 워커 노드에 Pod로 배포되며, IRSA(IAM Roles for Service Accounts)로 권한을 관리합니다.

</details>

```yaml
# ACK WAFv2 WebACL - Rate-based Rule 정의
apiVersion: wafv2.services.k8s.aws/v1alpha1
kind: WebACL
metadata:
  name: rate-limit-acl
  namespace: production
spec:
  name: rate-limit-acl
  scope: REGIONAL
  defaultAction:
    allow: {}
  rules:
    - name: ip-rate-limit
      priority: 1
      action:
        block: {}
      statement:
        rateBasedStatement:
          limit: 500            # 5분간 최대 요청 수 (100~2,000,000,000)
          aggregateKeyType: IP  # IP 기반 집계
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: ip-rate-limit
  visibilityConfig:
    sampledRequestsEnabled: true
    cloudWatchMetricsEnabled: true
    metricName: rate-limit-acl
```

```yaml
# 생성된 WebACL ARN을 Gateway에 연결
# WebACL 생성 후 status.ackResourceMetadata.arn 에서 ARN 확인:
#   kubectl get webacl rate-limit-acl -n production \
#     -o jsonpath='{.status.ackResourceMetadata.arn}'
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    aws.load-balancer.waf-acl-arn: <WebACL ARN>
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

:::note ACK WAFv2 컨트롤러 요구사항
- ACK WAFv2 컨트롤러에 `wafv2:CreateWebACL`, `wafv2:UpdateWebACL`, `wafv2:DeleteWebACL`, `wafv2:GetWebACL` 등의 IAM 권한이 필요합니다
- **EKS Capabilities** 사용 시: IAM Capability Role에 WAFv2 권한을 연결합니다. 컨트롤러는 AWS 관리 인프라에서 실행됩니다
- **Helm 설치** 사용 시: IRSA(IAM Roles for Service Accounts) 또는 EKS Pod Identity를 통해 최소 권한을 부여하세요
- WebACL과 ALB는 동일 리전에 있어야 합니다
:::

</TabItem>
<TabItem value="cilium" label="Cilium">

```yaml
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: rate-limit
spec:
  services:
    - name: api-service
      namespace: production
  backendServices:
    - name: api-service
      namespace: production
      number:
        - "8080"
  resources:
    - "@type": type.googleapis.com/envoy.config.listener.v3.Listener
      name: envoy-lb-listener
      filterChains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typedConfig:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                httpFilters:
                  - name: envoy.filters.http.local_ratelimit
                    typedConfig:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                      statPrefix: http_local_rate_limiter
                      tokenBucket:
                        maxTokens: 200
                        tokensPerFill: 100
                        fillInterval: 1s
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: rate-limit
spec:
  rateLimiting:
    rate: 100r/s  # 초당 100 요청
    burst: 200    # 버스트 200 요청
    noDelay: true # 즉시 제한 적용
    zoneSize: 10m # 메모리 존 크기
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  rateLimit:
    type: Global
    global:
      rules:
        - limit:
            requests: 100
            unit: Second
          clientSelectors:
            - headers:
                - name: x-user-id
                  type: Distinct  # 사용자별 제한
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

```yaml
apiVersion: gateway.kgateway.io/v1alpha1
kind: RouteOption
metadata:
  name: rate-limit
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  rateLimitConfigs:
    - actions:
        - genericKey:
            descriptorValue: per-user
        - requestHeaders:
            headerName: x-user-id
            descriptorKey: user_id
      limit:
        dynamicMetadata:
          metadataKey:
            key: rl
            path:
              - key: per-user
        unit: SECOND
        requestsPerUnit: 100
```

</TabItem>
</Tabs>

## 3. IP 제어 (IP Allowlist)

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# ALB Ingress에 WAF 연결 (LBC v3)
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    aws.load-balancer.waf-acl-arn: arn:aws:wafv2:us-west-2:123456789012:regional/webacl/ip-allowlist/a1b2c3d4
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

**ACK(AWS Controllers for Kubernetes)로 WAF IP Allowlist 생성:**

ACK WAFv2 컨트롤러를 사용하면 IPSet과 WebACL을 Kubernetes 매니페스트로 선언적 관리할 수 있습니다.

```yaml
# 1. ACK WAFv2 IPSet - 허용할 IP 목록 정의
apiVersion: wafv2.services.k8s.aws/v1alpha1
kind: IPSet
metadata:
  name: allowed-ips
  namespace: production
spec:
  name: allowed-ips
  scope: REGIONAL
  ipAddressVersion: IPV4
  addresses:
    - "10.0.0.0/8"        # VPC 내부
    - "192.168.1.0/24"    # 사무실 네트워크
    - "203.0.113.100/32"  # 특정 허용 IP
```

```yaml
# 2. ACK WAFv2 WebACL - IPSet 기반 Allowlist 규칙
# IPSet 생성 후 status.ackResourceMetadata.arn 에서 ARN 확인:
#   kubectl get ipset allowed-ips -n production \
#     -o jsonpath='{.status.ackResourceMetadata.arn}'
apiVersion: wafv2.services.k8s.aws/v1alpha1
kind: WebACL
metadata:
  name: ip-allowlist-acl
  namespace: production
spec:
  name: ip-allowlist-acl
  scope: REGIONAL
  defaultAction:
    block: {}  # 기본 차단, 허용 목록만 통과
  rules:
    - name: allow-trusted-ips
      priority: 1
      action:
        allow: {}
      statement:
        ipSetReferenceStatement:
          arn: <IPSet ARN>  # allowed-ips IPSet의 ARN
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: allow-trusted-ips
  visibilityConfig:
    sampledRequestsEnabled: true
    cloudWatchMetricsEnabled: true
    metricName: ip-allowlist-acl
```

```yaml
# 3. 생성된 WebACL ARN을 Gateway에 연결
# WebACL 생성 후 status.ackResourceMetadata.arn 에서 ARN 확인:
#   kubectl get webacl ip-allowlist-acl -n production \
#     -o jsonpath='{.status.ackResourceMetadata.arn}'
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    aws.load-balancer.waf-acl-arn: <WebACL ARN>
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

:::note ACK WAFv2 IPSet 관리 팁
- IPSet의 `addresses` 필드를 업데이트하면 ACK 컨트롤러가 자동으로 AWS WAF IPSet을 동기화합니다
- GitOps(ArgoCD/Flux)와 결합하면 IP 변경을 PR 기반으로 관리할 수 있습니다
- IPSet과 WebACL은 동일 리전에 있어야 하며, `wafv2:*IPSet*`, `wafv2:*WebACL*` 권한이 필요합니다 (EKS Capabilities: IAM Capability Role / Helm: IRSA)
:::

</TabItem>
<TabItem value="cilium" label="Cilium">

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: ip-allowlist
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api-service
  ingress:
    - fromCIDR:
        - "10.0.0.0/8"        # VPC 내부
        - "192.168.1.0/24"    # 사무실
        - "203.0.113.100/32"  # 특정 IP
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: ip-filter
spec:
  ipFiltering:
    allow:
      - "10.0.0.0/8"
      - "192.168.1.0/24"
    deny:
      - "203.0.113.0/24"  # 차단할 IP 대역
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: ip-allowlist
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: production-gateway
  authorization:
    rules:
      - action: ALLOW
        from:
          - source:
              principals:
                - "10.0.0.0/8"
                - "192.168.1.0/24"
      - action: DENY
        from:
          - source:
              principals:
                - "*"
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

:::warning 제한 사항
kGateway는 네이티브 IP 필터링을 RouteOption CRD의 networkPolicy 또는 Kubernetes NetworkPolicy와 조합하여 구현합니다.
:::

```yaml
# Kubernetes NetworkPolicy를 사용한 IP 제어
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ip-allowlist
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - ipBlock:
            cidr: 10.0.0.0/8
        - ipBlock:
            cidr: 192.168.1.0/24
        - ipBlock:
            cidr: 203.0.113.100/32
      ports:
        - protocol: TCP
          port: 8080
```

</TabItem>
</Tabs>

## 4. URL Rewrite

:::note Gateway API 표준
URL Rewrite는 Gateway API v1 표준 기능으로, 모든 구현체에서 동일하게 작동합니다.
:::

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-rewrite
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    # /api/v1/users → /users
    - matches:
        - path:
            type: PathPrefix
            value: /api/v1
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: api-service
          port: 8080

    # /old-api/users → /v2/users
    - matches:
        - path:
            type: PathPrefix
            value: /old-api
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /v2
      backendRefs:
        - name: api-service-v2
          port: 8080
```

## 5. Header 조작

:::note Gateway API 표준
Header 조작은 Gateway API v1 표준 기능으로, 모든 구현체에서 동일하게 작동합니다.
:::

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: header-manipulation
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            value: /api
      filters:
        # 요청 헤더 추가
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Custom-Header
                value: "gateway-api"
              - name: X-Forwarded-Proto
                value: "https"
            remove:
              - Authorization  # 기존 Authorization 제거
        # 응답 헤더 추가
        - type: ResponseHeaderModifier
          responseHeaderModifier:
            add:
              - name: X-Server
                value: "gateway-api"
              - name: Strict-Transport-Security
                value: "max-age=31536000; includeSubDomains"
      backendRefs:
        - name: api-service
          port: 8080
```

## 6. 세션 어피니티 (Cookie-based)

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: sticky-session
  annotations:
    aws.load-balancer.target-group.stickiness.enabled: "true"
    aws.load-balancer.target-group.stickiness.type: "lb_cookie"
    aws.load-balancer.target-group.stickiness.duration: "3600"
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - backendRefs:
        - name: api-service
          port: 8080
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning 제한 사항
Cilium은 네이티브 쿠키 기반 세션 어피니티를 지원하지 않습니다. CiliumEnvoyConfig로 Envoy의 consistent hashing 또는 ring hash를 구성할 수 있습니다.
:::

```yaml
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: session-affinity
  namespace: production
spec:
  services:
    - name: api-service
      namespace: production
  resources:
    - "@type": type.googleapis.com/envoy.config.cluster.v3.Cluster
      name: api-service-cluster
      type: STRICT_DNS
      lbPolicy: RING_HASH
      ringHashLbConfig:
        hashFunction: XX_HASH
        minimumRingSize: 1024
      loadAssignment:
        clusterName: api-service-cluster
        endpoints:
          - lbEndpoints:
              - endpoint:
                  address:
                    socketAddress:
                      address: api-service.production.svc.cluster.local
                      portValue: 8080
    - "@type": type.googleapis.com/envoy.config.route.v3.RouteConfiguration
      name: session-affinity-route
      virtualHosts:
        - name: api-service
          domains: ["*"]
          routes:
            - match:
                prefix: "/"
              route:
                cluster: api-service-cluster
                hashPolicy:
                  - cookie:
                      name: SESSION_COOKIE
                      ttl: 3600s
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: UpstreamSettingsPolicy
metadata:
  name: session-affinity
  namespace: production
spec:
  targetRef:
    group: ""
    kind: Service
    name: api-service
  sessionAffinity:
    cookieName: BACKEND_SESSION
    cookieExpires: 1h
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: session-affinity
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  loadBalancer:
    type: ConsistentHash
    consistentHash:
      type: Cookie
      cookie:
        name: SESSION_COOKIE
        ttl: 3600s
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

```yaml
apiVersion: gateway.kgateway.io/v1alpha1
kind: RouteOption
metadata:
  name: session-affinity
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  sessionAffinity:
    cookieBased:
      cookie:
        name: JSESSIONID
        ttl: 3600s
        path: /
```

</TabItem>
</Tabs>

## 7. 요청 본문 크기 제한

<Tabs>
<TabItem value="aws" label="AWS Native" default>

:::warning 제한 사항
AWS WAF Rule을 사용하여 요청 본문 크기를 제한합니다 (Console/CloudFormation 설정).
:::

```yaml
# ALB에 WAF Body Size Limit Rule 연결
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    aws.load-balancer.waf-acl-arn: arn:aws:wafv2:us-west-2:123456789012:regional/webacl/body-size-limit/a1b2c3d4
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

**ACK(AWS Controllers for Kubernetes)로 WAF Body Size Rule 생성:**

ACK WAFv2 컨트롤러를 사용하면 Body Size 제한 규칙을 Kubernetes 매니페스트로 선언적 관리할 수 있습니다.

```yaml
# ACK WAFv2 WebACL - Body Size Limit Rule 정의
apiVersion: wafv2.services.k8s.aws/v1alpha1
kind: WebACL
metadata:
  name: body-size-limit-acl
  namespace: production
spec:
  name: body-size-limit-acl
  scope: REGIONAL
  defaultAction:
    allow: {}
  rules:
    - name: block-large-body
      priority: 1
      action:
        block: {}
      statement:
        sizeConstraintStatement:
          fieldToMatch:
            body:
              oversizeHandling: MATCH  # 오버사이즈 본문도 매칭
          comparisonOperator: GT
          size: 10485760              # 10MB (바이트 단위)
          textTransformations:
            - priority: 0
              type: NONE
      visibilityConfig:
        sampledRequestsEnabled: true
        cloudWatchMetricsEnabled: true
        metricName: block-large-body
  visibilityConfig:
    sampledRequestsEnabled: true
    cloudWatchMetricsEnabled: true
    metricName: body-size-limit-acl
```

```yaml
# 생성된 WebACL ARN을 Gateway에 연결
# WebACL 생성 후 status.ackResourceMetadata.arn 에서 ARN 확인:
#   kubectl get webacl body-size-limit-acl -n production \
#     -o jsonpath='{.status.ackResourceMetadata.arn}'
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    aws.load-balancer.waf-acl-arn: <WebACL ARN>
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      port: 80
      protocol: HTTP
```

:::note 단일 WebACL로 규칙 통합
IP Allowlist, Rate Limiting, Body Size 제한을 모두 사용한다면, 별도의 WebACL을 각각 만들 필요 없이 **하나의 WebACL에 여러 규칙을 `priority`로 구분하여 통합**할 수 있습니다. ALB당 WebACL은 하나만 연결 가능하므로 통합 관리가 필수입니다.
:::

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning 제한 사항
Cilium Gateway API는 별도의 요청 본문 크기 제한 CRD를 제공하지 않습니다. CiliumEnvoyConfig로 Envoy의 buffer 필터를 구성하거나, 백엔드 애플리케이션에서 처리해야 합니다.
:::

```yaml
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: body-size-limit
  namespace: production
spec:
  services:
    - name: api-service
      namespace: production
  resources:
    - "@type": type.googleapis.com/envoy.config.listener.v3.Listener
      name: envoy-lb-listener
      filterChains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typedConfig:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                commonHttpProtocolOptions:
                  maxRequestHeadersKb: 60
                http2ProtocolOptions:
                  maxConcurrentStreams: 100
                # Envoy buffer 필터로 요청 본문 크기 제한
                perConnectionBufferLimitBytes: 10485760  # 10MB
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: body-size-limit
spec:
  clientMaxBodySize: 10m  # 최대 10MB
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: ClientTrafficPolicy
metadata:
  name: body-size-limit
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: production-gateway
  http1:
    http10Disabled: false
    maxRequestHeadersKb: 60
  connection:
    bufferLimitBytes: 10485760  # 10MB
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

:::warning 제한 사항
kGateway는 RouteOption CRD에서 body size limit을 직접 지원하지 않습니다. 백엔드 서비스 또는 Envoy 필터 확장을 통해 구현합니다.
:::

```yaml
# kGateway는 백엔드 애플리케이션에서 본문 크기 검증을 권장
# 또는 ListenerOption으로 전역 버퍼 제한 구성
apiVersion: gateway.kgateway.io/v1alpha1
kind: ListenerOption
metadata:
  name: body-size-limit
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: production-gateway
      sectionName: http
  options:
    perConnectionBufferLimitBytes: 10485760  # 10MB
```

</TabItem>
</Tabs>

## 8. 커스텀 에러 페이지

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# ALB의 Fixed Response 액션 사용
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: error-response
  namespace: production
  annotations:
    # ALB action annotation으로 고정 응답 구성
    alb.ingress.kubernetes.io/actions.error-503: |
      {
        "type": "fixed-response",
        "fixedResponseConfig": {
          "contentType": "text/html",
          "statusCode": "503",
          "messageBody": "<html><body><h1>Service Under Maintenance</h1><p>Please try again later.</p></body></html>"
        }
      }
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /maintenance
      backendRefs:
        - name: error-503  # annotation에 정의된 액션 이름
          kind: Service
          port: 503
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning 제한 사항
Cilium Gateway API는 네이티브 커스텀 에러 페이지를 지원하지 않습니다. 별도 에러 페이지 서비스를 배포하고 HTTPRoute에서 라우팅합니다.
:::

```yaml
# 에러 페이지를 제공하는 백엔드 서비스
apiVersion: v1
kind: Service
metadata:
  name: error-page-service
  namespace: production
spec:
  selector:
    app: error-pages
  ports:
    - port: 80

---
# 에러 발생 시 error-page-service로 라우팅
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: error-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /error
      backendRefs:
        - name: error-page-service
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /maintenance
      backendRefs:
        - name: error-page-service
          port: 80
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

:::warning 제한 사항
NGINX Gateway Fabric은 SnippetsPolicy 또는 별도 에러 서비스 라우팅으로 커스텀 에러 페이지를 구현합니다.
:::

```yaml
# 별도 에러 페이지 서비스를 통한 패턴
apiVersion: v1
kind: Service
metadata:
  name: error-page-service
  namespace: production
spec:
  selector:
    app: error-pages
  ports:
    - port: 80

---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: error-handling
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    # 메인 애플리케이션 라우트
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
    # 에러 페이지 라우트
    - matches:
        - path:
            type: PathPrefix
            value: /error
      backendRefs:
        - name: error-page-service
          port: 80

---
# NginxProxy로 에러 페이지 지시문 구성 (선택적)
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: error-pages
spec:
  errorPages:
    - codes: [500, 502, 503, 504]
      return:
        statusCode: 503
        body: "<html><body><h1>Service Unavailable</h1></body></html>"
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: custom-error
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  faultInjection:
    - match:
        headers:
          - name: x-trigger-error
      abort:
        httpStatus: 503
        percentage: 100

---
# HTTPRoute에서 Fixed Response
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: error-response
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /maintenance
      filters:
        - type: ExtensionRef
          extensionRef:
            group: gateway.envoyproxy.io
            kind: DirectResponse
            name: maintenance-response

---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: DirectResponse
metadata:
  name: maintenance-response
  namespace: production
spec:
  statusCode: 503
  body:
    type: Inline
    inline: |
      <html>
      <body>
        <h1>Service Under Maintenance</h1>
        <p>Please try again later.</p>
      </body>
      </html>
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

```yaml
# RouteOption의 transformation을 사용하여 커스텀 응답 구성
apiVersion: gateway.kgateway.io/v1alpha1
kind: RouteOption
metadata:
  name: custom-error
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: maintenance-route
  options:
    transformations:
      responseTransformation:
        transformationTemplate:
          headers:
            ":status":
              text: "503"
            content-type:
              text: "text/html"
          body:
            text: |
              <html>
              <body>
                <h1>Service Under Maintenance</h1>
                <p>Please try again later.</p>
              </body>
              </html>

---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: maintenance-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /maintenance
      backendRefs:
        - name: api-service
          port: 8080
```

</TabItem>
</Tabs>

---

## 참고 자료

### 공식 문서
- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/) — HTTPRoute·필터·표준 채널 스펙
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/) — LBC v3 Gateway API 지원

### 관련 문서 (내부)
- [Gateway API 도입 가이드](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide) — 솔루션 비교·의사결정 트리·결론
- [마이그레이션 실행 전략](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy) — 5-Phase 마이그레이션 프로세스
