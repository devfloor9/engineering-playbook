---
title: "Feature Implementation Cookbook: 6 Gateway API Implementations"
description: Reference for implementing authentication, rate limiting, IP control, URL rewrite, header manipulation, session affinity, body size limits, and custom error pages as YAML across AWS LBC, Cilium, NGINX GF, Envoy Gateway, and kGateway
created: "2026-06-17"
last_update:
  date: "2026-06-17"
  author: devfloor9
reading_time: 17
tags:
  - eks
  - gateway-api
  - cilium
  - envoy
  - kong
  - networking
sidebar_label: Feature Implementation Cookbook
category: performance-networking
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info
This document is a deep-dive guide for the [Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide). It compares, with YAML examples, how the 8 major features used in NGINX Ingress are implemented in each Gateway API implementation. For solution selection, comparison matrices, and the decision tree, see [Section 4](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide#4-gateway-api-implementation-comparison--aws-native-vs-open-source) of the main guide.
:::

## Overview

This cookbook covers how to implement the following 8 features for AWS Native (LBC v3), Cilium, NGINX Gateway Fabric, Envoy Gateway, and kGateway. URL Rewrite and header manipulation are Gateway API v1 standard features that work identically across all implementations.

| # | Feature | Standard? |
|---|---------|-----------|
| 1 | Authentication (Basic Auth replacement) | Per-implementation |
| 2 | Rate Limiting | Per-implementation |
| 3 | IP Control (IP Allowlist) | Per-implementation |
| 4 | URL Rewrite | Gateway API v1 standard |
| 5 | Header Manipulation | Gateway API v1 standard |
| 6 | Session Affinity (cookie-based) | Per-implementation |
| 7 | Request Body Size Limit | Per-implementation |
| 8 | Custom Error Pages | Per-implementation |

---

## 1. Authentication (Basic Auth replacement)

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# Native JWT verification with AWS LBC v3
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
# JWTAuthorizer CRD (LBC v3 extension)
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

:::warning Limitation
Cilium does not support native JWT/OIDC authentication. You must configure an Envoy ext_authz filter via CiliumEnvoyConfig, or deploy a separate authentication service (such as OAuth2 Proxy).
:::

```yaml
# L7 HTTP header verification with CiliumNetworkPolicy (basic auth)
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
# Or configure Envoy ext_authz via CiliumEnvoyConfig
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

:::warning Limitation
NGINX Gateway Fabric does not support native JWT verification. You must combine the nginx.org/v1alpha1 UpstreamSettingsPolicy with an external authentication service.
:::

```yaml
# Pattern using an external authentication service
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: auth-protected
  namespace: production
spec:
  parentRefs:
    - name: production-gateway
  rules:
    # Route to /api only when the Authorization header is present
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
    # Return 401 if no Authorization header (separate error service)
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
  # In NGINX, use the auth_request module to validate external authentication
  # Implement by deploying OAuth2 Proxy or a similar auth proxy
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

:::warning Limitation
AWS Native (LBC v3) does not support gateway-level native rate limiting. IP-based request limiting is implemented using AWS WAF Rate-based Rules.
:::

```yaml
# Attach a WAF Rate-based Rule to the ALB
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

**Create a WAF Rate-based Rule with ACK (AWS Controllers for Kubernetes):**

Using the ACK WAFv2 controller, WAF resources can be managed declaratively as Kubernetes manifests.

**Enable ACK with EKS Capabilities (recommended):**

Using EKS Capabilities (GA in November 2025), the ACK controller can run as a fully AWS-managed component. Because the controller runs on AWS-managed infrastructure, no separate pod is deployed on the worker nodes.

```bash
# 1. Create the IAM Capability Role
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

# Attach the WAFv2 permission policy
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

# 2. Create the ACK Capability on the EKS cluster
aws eks create-capability \
  --cluster-name my-eks-cluster \
  --capability-type ACK \
  --capability-configuration '{
    "capabilityRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/EKS-ACK-Capability-Role"
  }'

# 3. Verify CRD registration
kubectl get crds | grep wafv2
```

<details>
<summary>Alternative: install directly with Helm (non-EKS environments)</summary>

For non-EKS environments or when the controller must be self-managed, it can be installed with Helm.

```bash
helm install ack-wafv2-controller \
  oci://public.ecr.aws/aws-controllers-k8s/wafv2-chart \
  --namespace ack-system \
  --create-namespace \
  --set aws.region=ap-northeast-2
```

With this approach the controller is deployed as a pod on the worker nodes, and permissions are managed via IRSA (IAM Roles for Service Accounts).

</details>

```yaml
# ACK WAFv2 WebACL - Rate-based Rule definition
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
          limit: 500            # max requests per 5 minutes (100~2,000,000,000)
          aggregateKeyType: IP  # aggregate by IP
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
# Attach the created WebACL ARN to the Gateway
# After WebACL creation, find the ARN in status.ackResourceMetadata.arn:
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

:::note ACK WAFv2 Controller Requirements
- The ACK WAFv2 controller requires IAM permissions such as `wafv2:CreateWebACL`, `wafv2:UpdateWebACL`, `wafv2:DeleteWebACL`, and `wafv2:GetWebACL`
- When using **EKS Capabilities**: attach the WAFv2 permissions to the IAM Capability Role. The controller runs on AWS-managed infrastructure
- When using **Helm install**: grant least privilege via IRSA (IAM Roles for Service Accounts) or EKS Pod Identity
- The WebACL and the ALB must be in the same region
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
    rate: 100r/s  # 100 requests per second
    burst: 200    # burst of 200 requests
    noDelay: true # apply limit immediately
    zoneSize: 10m # memory zone size
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
                  type: Distinct  # per-user limit
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

## 3. IP Control (IP Allowlist)

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# Attach WAF to ALB Ingress (LBC v3)
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

**Create a WAF IP Allowlist with ACK (AWS Controllers for Kubernetes):**

Using the ACK WAFv2 controller, IPSet and WebACL can be managed declaratively as Kubernetes manifests.

```yaml
# 1. ACK WAFv2 IPSet - define the list of allowed IPs
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
    - "10.0.0.0/8"        # internal VPC
    - "192.168.1.0/24"    # office network
    - "203.0.113.100/32"  # specific allowed IP
```

```yaml
# 2. ACK WAFv2 WebACL - IPSet-based allowlist rule
# After IPSet creation, find the ARN in status.ackResourceMetadata.arn:
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
    block: {}  # block by default, only the allowlist passes
  rules:
    - name: allow-trusted-ips
      priority: 1
      action:
        allow: {}
      statement:
        ipSetReferenceStatement:
          arn: <IPSet ARN>  # ARN of the allowed-ips IPSet
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
# 3. Attach the created WebACL ARN to the Gateway
# After WebACL creation, find the ARN in status.ackResourceMetadata.arn:
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

:::note ACK WAFv2 IPSet Management Tips
- Updating the `addresses` field of the IPSet causes the ACK controller to automatically sync the AWS WAF IPSet
- Combined with GitOps (ArgoCD/Flux), IP changes can be managed via PRs
- The IPSet and WebACL must be in the same region, and `wafv2:*IPSet*` and `wafv2:*WebACL*` permissions are required (EKS Capabilities: IAM Capability Role / Helm: IRSA)
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
        - "10.0.0.0/8"        # internal VPC
        - "192.168.1.0/24"    # office
        - "203.0.113.100/32"  # specific IP
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
      - "203.0.113.0/24"  # IP range to block
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

:::warning Limitation
kGateway implements native IP filtering by combining the RouteOption CRD's networkPolicy or a Kubernetes NetworkPolicy.
:::

```yaml
# IP control using a Kubernetes NetworkPolicy
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

:::note Gateway API Standard
URL Rewrite is a Gateway API v1 standard feature that works identically across all implementations.
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

## 5. Header Manipulation

:::note Gateway API Standard
Header manipulation is a Gateway API v1 standard feature that works identically across all implementations.
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
        # Add request headers
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Custom-Header
                value: "gateway-api"
              - name: X-Forwarded-Proto
                value: "https"
            remove:
              - Authorization  # remove existing Authorization
        # Add response headers
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

## 6. Session Affinity (cookie-based)

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

:::warning Limitation
Cilium does not support native cookie-based session affinity. You can configure Envoy's consistent hashing or ring hash via CiliumEnvoyConfig.
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

## 7. Request Body Size Limit

<Tabs>
<TabItem value="aws" label="AWS Native" default>

:::warning Limitation
Use an AWS WAF Rule to limit request body size (Console/CloudFormation configuration).
:::

```yaml
# Attach a WAF Body Size Limit Rule to the ALB
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

**Create a WAF Body Size Rule with ACK (AWS Controllers for Kubernetes):**

Using the ACK WAFv2 controller, body size limit rules can be managed declaratively as Kubernetes manifests.

```yaml
# ACK WAFv2 WebACL - Body Size Limit Rule definition
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
              oversizeHandling: MATCH  # also match oversized bodies
          comparisonOperator: GT
          size: 10485760              # 10MB (in bytes)
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
# Attach the created WebACL ARN to the Gateway
# After WebACL creation, find the ARN in status.ackResourceMetadata.arn:
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

:::note Consolidate Rules into a Single WebACL
If you use IP Allowlist, Rate Limiting, and Body Size limits all together, you do not need to create separate WebACLs for each — you can **consolidate multiple rules into a single WebACL, distinguished by `priority`**. Since only one WebACL can be attached per ALB, consolidated management is essential.
:::

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning Limitation
The Cilium Gateway API does not provide a dedicated request body size limit CRD. You must configure Envoy's buffer filter via CiliumEnvoyConfig, or handle it in the backend application.
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
                # Limit request body size with the Envoy buffer filter
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
  clientMaxBodySize: 10m  # max 10MB
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

:::warning Limitation
kGateway does not directly support a body size limit in the RouteOption CRD. Implement it via the backend service or an Envoy filter extension.
:::

```yaml
# kGateway recommends body size validation in the backend application
# Or configure a global buffer limit with ListenerOption
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

## 8. Custom Error Pages

<Tabs>
<TabItem value="aws" label="AWS Native" default>

```yaml
# Use the ALB Fixed Response action
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: error-response
  namespace: production
  annotations:
    # Configure a fixed response with an ALB action annotation
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
        - name: error-503  # action name defined in the annotation
          kind: Service
          port: 503
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning Limitation
The Cilium Gateway API does not support native custom error pages. Deploy a separate error page service and route to it from the HTTPRoute.
:::

```yaml
# Backend service that serves the error page
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
# Route to error-page-service when an error occurs
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

:::warning Limitation
NGINX Gateway Fabric implements custom error pages via a SnippetsPolicy or by routing to a separate error service.
:::

```yaml
# Pattern using a separate error page service
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
    # Main application route
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
    # Error page route
    - matches:
        - path:
            type: PathPrefix
            value: /error
      backendRefs:
        - name: error-page-service
          port: 80

---
# Configure error page directives with NginxProxy (optional)
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
# Fixed Response in the HTTPRoute
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
# Configure a custom response using RouteOption transformation
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

## References

### Official Documentation
- [Kubernetes Gateway API official documentation](https://gateway-api.sigs.k8s.io/) — HTTPRoute, filters, and Standard channel spec
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/) — LBC v3 Gateway API support

### Related Documents (internal)
- [Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide) — solution comparison, decision tree, conclusion
- [Migration Execution Strategy](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy) — 5-phase migration process
