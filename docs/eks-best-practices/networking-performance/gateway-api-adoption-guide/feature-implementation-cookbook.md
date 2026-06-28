---
title: "기능별 구현 쿡북: 6개 Gateway API 구현체"
description: 인증·Rate Limiting·IP 제어·URL Rewrite·헤더 조작·세션 어피니티·본문 크기 제한·커스텀 에러 페이지를 AWS LBC·Cilium·NGINX GF·Envoy Gateway·kGateway별 YAML로 구현하는 레퍼런스
created: "2026-06-17"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 11
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

> 📅 **작성일**: 2026-06-17 | **수정일**: 2026-06-17

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

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# AWS LBC v3의 네이티브 JWT 검증
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: jwt-protected-route
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      filters:
        - type: ExtensionRef
          extensionRef:
            group: eks.amazonaws.com
            kind: JWTAuthorizer
            name: cognito-authorizer
      backendRefs:
        - name: api-service
          port: 8080

---
# JWTAuthorizer CRD (LBC v3 확장)
apiVersion: eks.amazonaws.com/v1
kind: JWTAuthorizer
metadata:
  name: cognito-authorizer
spec:
  issuer: https://cognito-idp.us-west-2.amazonaws.com/us-west-2_ABC123
  audiences:
    - api-gateway-client
  claimsToHeaders:
    - claim: sub
      header: x-user-id
    - claim: email
      header: x-user-email
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning 제한 사항
Cilium은 네이티브 JWT/OIDC 인증을 지원하지 않습니다. CiliumEnvoyConfig로 Envoy ext_authz 필터를 구성하거나, 별도 인증 서비스(OAuth2 Proxy 등)를 배포해야 합니다.
:::

```yaml
# CiliumNetworkPolicy로 L7 HTTP 헤더 검증 (기본 인증)
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: auth-header-check
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: api-service
  ingress:
    - fromEndpoints:
        - matchLabels:
            io.kubernetes.pod.namespace: ingress-nginx
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: GET
                headers:
                  - "Authorization: Bearer.*"

---
# 또는 CiliumEnvoyConfig로 Envoy ext_authz 구성
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: ext-authz
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
                httpFilters:
                  - name: envoy.filters.http.ext_authz
                    typedConfig:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz
                      grpcService:
                        envoyGrpc:
                          clusterName: ext-authz-service
                      includePeerCertificate: true
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

:::warning 제한 사항
NGINX Gateway Fabric은 네이티브 JWT 검증을 지원하지 않습니다. nginx.org/v1alpha1 UpstreamSettingsPolicy와 외부 인증 서비스를 조합해야 합니다.
:::

```yaml
# 외부 인증 서비스를 통한 패턴
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: auth-protected
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    # 인증 없이 /auth 엔드포인트로 먼저 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /api
          headers:
            - name: Authorization
              type: RegularExpression
              value: "^Bearer .+"
      backendRefs:
        - name: api-service
          port: 8080
    # Authorization 헤더 없으면 401 반환 (별도 에러 서비스)
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: auth-error-service
          port: 80

---
apiVersion: gateway.nginx.org/v1alpha1
kind: UpstreamSettingsPolicy
metadata:
  name: auth-proxy
spec:
  targetRef:
    group: ""
    kind: Service
    name: api-service
  # NGINX에서는 auth_request 모듈을 사용하여 외부 인증 검증
  # OAuth2 Proxy 또는 유사한 인증 프록시를 배포하여 구현
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
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
    http:
      service:
        name: auth-service
        port: 8080
      headersToBackend:
        - x-user-id
        - x-user-role
      backendRefs:
        - name: auth-service
          port: 8080
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

```yaml
apiVersion: gateway.kgateway.io/v1alpha1
kind: RouteOption
metadata:
  name: jwt-auth
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  jwt:
    providers:
      - name: keycloak
        issuer: https://keycloak.example.com/auth/realms/production
        audiences:
          - api-gateway
        jwksUri: https://keycloak.example.com/auth/realms/production/protocol/openid-connect/certs
        claimsToHeaders:
          - claim: sub
            header: x-user-id
          - claim: groups
            header: x-user-groups
```

</TabItem>
</Tabs>

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
