---
title: "Feature Implementation Cookbook: 6 Gateway API Implementations"
description: Reference for implementing authentication, rate limiting, IP control, URL rewrite, header manipulation, session affinity, body size limits, and custom error pages as YAML across AWS LBC, Cilium, NGINX GF, Envoy Gateway, and kGateway
created: "2026-06-17"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 32
tags:
  - eks
  - gateway-api
  - cilium
  - envoy
  - kong
  - networking
  - scope:tech
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

The tabs are **alternative configurations for different controllers**. Prepare the corresponding versioned CRDs/controller, the `production` namespace, a `production-gateway` HTTPS listener named `https` in the same namespace, its TLS certificate/DNS and the `api-service:8080` backend. Replace `example.com` IdP/host values and Secret/public-key references with the deployment's configuration. Rendering or parsing a manifest does not establish successful authentication.

The presence or regex match of an `Authorization` header is not authentication. JWT signature, issuer, audience and time checks, or a real authorization service's allow/deny decision, are required. The examples embed no working credentials; no deployment or authentication requests were executed.
<Tabs>
<TabItem value="aws" label="AWS Native" default>
AWS LBC 3.0.0 exposes `ListenerRuleConfiguration` in `gateway.k8s.aws/v1beta1`. On an HTTPS listener, ALB checks an RS256 JWT's signature, `iss` and `exp`, plus `nbf/iat` when present. This example also requires the string claim `aud=api-gateway-client`; use the matching claim format if the IdP emits an audience array. Verify public JWKS reachability and ALB limits in the [official JWT documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-verify-jwt.html).
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
JWT validation is distinct from a browser OIDC login redirect. A valid token is forwarded as-is; this extension does not configure `claimsToHeaders`. Define a separate trusted identity-header/overwrite contract if the backend requires one. [LBC 3.0.0 LRC contract](https://github.com/kubernetes-sigs/aws-load-balancer-controller/blob/v3.0.0/docs/guide/gateway/listenerruleconfig.md)
</TabItem>
<TabItem value="cilium" label="Cilium">
:::warning Limitation
Cilium does not support native JWT/OIDC authentication. You must configure an Envoy ext_authz filter via CiliumEnvoyConfig, or deploy a separate authentication service (such as OAuth2 Proxy).
:::

Retain that Cilium 1.19.3 boundary. This example selects a separate OAuth2 Proxy for **browser OIDC sessions**. The Gateway sends the host's requests, including `/api` and `/oauth2` callbacks, to the proxy before the proxy forwards authenticated traffic to `api-service`. It adds neither a Bearer-header-only bypass route nor an incomplete CiliumEnvoyConfig.

Prepare an OAuth2 Proxy 7.9.0 OIDC client/redirect URL, permitted email domain and the `client-id`, `client-secret` and `cookie-secret` Secret keys. Generate/store the cookie secret according to the length/encoding rules in the [official configuration](https://oauth2-proxy.github.io/oauth2-proxy/7.9.x/configuration/overview/). The IdP must support PKCE S256 and the required email claim.
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
The `endpointSelector` value `app: api-service` must match the actual backend Pod labels. A matching Service name alone does not apply the policy to those Pods. Check network-policy and TLS requirements for both Gateway→proxy and proxy→backend paths.

Keep the backend off other external routes/Services, and review other allow policies that could widen access. Verify that traffic from the authentication proxy succeeds while other Pods and external paths are blocked. This policy selects the authentication-proxy Pods rather than an unrelated `ingress-nginx` namespace. Bearer-token API authentication or gRPC ext_authz needs a separate authorizer with complete listener, route, filter and cluster wiring, plus verified failure behavior.
</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">
:::warning Distinguish authentication mechanisms
The NGINX Gateway Fabric 2.4.0 `AuthenticationFilter` below implements **Basic authentication**. It configures no JWT/OIDC authentication, and `UpstreamSettingsPolicy` is not an authentication policy. For OIDC, use a verified separate authentication-proxy path or another configuration supported by the selected version.
:::

Provision htpasswd-format credentials under the `auth` key of Secret `production/api-basic-auth` through the secret-management process. Use a TLS listener and do not reuse example passwords/hashes. [2.4.0 AuthenticationFilter schema](https://github.com/nginx/nginx-gateway-fabric/blob/v2.4.0/apis/v1alpha1/authenticationfilter_types.go)
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
Envoy Gateway 1.7.0 connects an HTTP authorizer through `SecurityPolicy.extAuth.http.backendRefs`. The same-namespace `auth-service:8080` must implement the **HTTP ext_authz contract**: check Authorization at the original request path, return 200 for allow and 401/403 for deny. Do not assume an OAuth2 Proxy browser-proxy port implements this check endpoint.
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
`failOpen: false` blocks backend forwarding on authorizer failure/timeout. If `http.path` is added, it prefixes the original path and must match the authorizer's routing. Only allow verified identity response headers through `headersToBackend` when needed, with a corresponding backend trust policy. [1.7.0 extAuth contract](https://github.com/envoyproxy/gateway/blob/v1.7.0/api/v1alpha1/ext_auth_types.go)
</TabItem>
<TabItem value="kgateway" label="kGateway">
The kgateway 2.2.0 Envoy path uses `TrafficPolicy` and a JWT-provider `GatewayExtension` in `gateway.kgateway.dev`. This example supplies trusted public JWKS through the `jwks` key of ConfigMap `production/api-jwks`. Define key rotation/revocation and ConfigMap updates; do not reuse arbitrary or stale keys.
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
Connect `jwtAuth.extensionRef`, the provider's `jwks.local.configMapRef`, issuer/audience and token source in the same namespace. Token forwarding is explicitly disabled; no claim-to-header trust contract is added here. [2.2.0 JWT schema](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/api/v1alpha1/kgateway/jwt_types.go) · [Versioned configuration example](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/pkg/kgateway/translator/gateway/testutils/inputs/jwt/gateway-configmap.yaml)
</TabItem>
</Tabs>
For the selected mechanism, verify valid credentials, missing/tampered/expired tokens or incorrect passwords, wrong issuer/audience, authorizer failure, callback routing and direct-backend access. Record applicable `Accepted`/`ResolvedRefs` status and actual backend reachability. Static schema checks do not replace these runtime acceptance results.

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

This Cilium `v1.19.3` example uses a separately managed `CiliumEnvoyConfig` (CEC) to handle traffic for the existing single-port `production/api-service:8080` Service. Configure it separately from the listeners automatically managed by a Gateway.

Enable kube-proxy replacement and Envoy configuration support, and use the packaged Envoy build containing `local_ratelimit`. Cilium supplies the Service's backend endpoints through EDS. Combine required filters in one configuration instead of applying multiple CECs to the same Service. Leave Gateway-generated CECs under controller ownership, preserve the authentication path and check the identities used by network policy.

The token bucket starts with 200 tokens and refills 100 each second **per Envoy process**. Activation and enforcement are both 100%. Treat these values as process-local limits, not as a quota for the entire cluster or an authenticated user. Enforcement with actual traffic still requires verification.

```yaml
# cilium-rate.yaml
# Cilium v1.19.3 Service interception; one owner per Service/listener.
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: rate-limit
  namespace: production
  annotations:
    cec.cilium.io/use-original-source-address: "false"
spec:
  services:
    - name: api-service
      namespace: production
      ports: [8080]
      listener: rate-limit-listener
  resources:
    - "@type": type.googleapis.com/envoy.config.listener.v3.Listener
      name: rate-limit-listener
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: rate-limit
                rds:
                  route_config_name: rate-limit-routes
                http_filters:
                  - name: envoy.filters.http.local_ratelimit
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                      stat_prefix: api_local_rate
                      token_bucket:
                        max_tokens: 200
                        tokens_per_fill: 100
                        fill_interval: 1s
                      filter_enabled:
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                      filter_enforced:
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
    - "@type": type.googleapis.com/envoy.config.route.v3.RouteConfiguration
      name: rate-limit-routes
      virtual_hosts:
        - name: api
          domains: ["*"]
          routes:
            - match:
                prefix: "/"
              route:
                cluster: production/api-service
    - "@type": type.googleapis.com/envoy.config.cluster.v3.Cluster
      name: production/api-service
      type: EDS
      connect_timeout: 5s
      lb_policy: ROUND_ROBIN
```

[Cilium 1.19.3 Service/CEC contract](https://github.com/cilium/cilium/blob/v1.19.3/pkg/k8s/apis/cilium.io/v2/cec_types.go) · [Versioned L7 caveats](https://github.com/cilium/cilium/blob/v1.19.3/Documentation/network/servicemesh/l7-traffic-management.rst)

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

For the kgateway `v2.2.0` **Envoy data plane**, use `TrafficPolicy` to add a local request limit to an existing `production/api-route`. The HTTPRoute needs valid Gateway and backend references.

The token bucket allows a burst of 200 and refills 100 each second per Envoy process. The controller enables and enforces the filter by default, but check for runtime overrides. A cluster-wide quota requires a separate rate-limit service/GatewayExtension. Per-user quotas also require verified identity inputs; an arbitrary `x-user-id` header is insufficient.

When combining this with authentication from Section 1 or the body-limit example, put the required settings into the intended effective policy and retain JWT authentication. Do not assume that independent policies targeting the same resource merge automatically.

```yaml
# kgateway-rate.yaml
# kgateway v2.2.0 Envoy data plane; existing production/api-route.
apiVersion: gateway.kgateway.dev/v1alpha1
kind: TrafficPolicy
metadata:
  name: rate-limit
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  rateLimit:
    local:
      tokenBucket:
        maxTokens: 200
        tokensPerFill: 100
        fillInterval: 1s
```

[2.2.0 rate-limit API](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/api/v1alpha1/kgateway/traffic_policy_types.go) · [Controller activation/enforcement](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/pkg/kgateway/extensions2/plugins/trafficpolicy/local_rate_limit_plugin.go)

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
The Kubernetes NetworkPolicy below restricts TCP port 8080 access to Pods labeled `app: api-service` in the `production` namespace. It requires a CNI that enforces the policy. A Gateway or NAT can change the source address seen by that policy, so verify the actual network path. This policy does not inspect client addresses carried in HTTP headers.
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

NGINX Gateway Fabric `v2.4.0` configures cookie persistence through **HTTPRoute rule `sessionPersistence`**. It requires NGINX Plus, Gateway API `v1.4.1` experimental CRDs and NGF experimental-feature support. Adding an `UpstreamSettingsPolicy.sessionAffinity` field is unsupported.

NGINX OSS can use `UpstreamSettingsPolicy.targetRefs` with `loadBalancingMethod: ip_hash` for IP-based affinity. That approach uses the client IP and differs from cookie-based affinity.

The YAML below contains fields to add to an existing `HTTPRoute.spec.rules[]` entry. Merge them while preserving its matches, authentication filters and backend references. `Permanent` with `absoluteTimeout: 1h` sets the persistence cookie's lifetime. The cookie does not authenticate a user or guarantee the selected backend's availability.

```yaml
# ngf-session-rule.yaml
# Merge into an existing HTTPRoute.spec.rules[] entry; not a resource.
# NGF v2.4.0 + NGINX Plus + Gateway API v1.4.1 experimental CRDs.
sessionPersistence:
  sessionName: BACKEND_SESSION
  type: Cookie
  absoluteTimeout: 1h
  cookieConfig:
    lifetimeType: Permanent
```

[NGF 2.4.0 Plus/experimental guards](https://github.com/nginx/nginx-gateway-fabric/blob/v2.4.0/internal/controller/state/graph/httproute.go) · [Versioned Plus example](https://github.com/nginx/nginx-gateway-fabric/blob/v2.4.0/tests/suite/manifests/session-persistence/routes-plus.yaml)

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

For kgateway `v2.2.0` with the **Envoy data plane** and Gateway API `v1.4.1` experimental CRDs, use HTTPRoute rule `sessionPersistence`. Check the data plane's feature support separately before adapting this example for agentgateway.

The YAML below is a set of fields to merge into an existing rule of `production/api-route`. Preserve its matches, backend references and the authentication policy attached in Section 1.

A persistence cookie directs requests to the same backend. Give it a name distinct from the application's authentication cookie. The one-hour setting controls this routing cookie's lifetime; it does not define the user's session lifetime or keep a failed backend available.

```yaml
# kgateway-session-rule.yaml
# Merge into an existing HTTPRoute.spec.rules[] entry; not a resource.
# kgateway v2.2.0 Envoy data plane + Gateway API v1.4.1 experimental CRDs.
sessionPersistence:
  sessionName: BACKEND_SESSION
  type: Cookie
  absoluteTimeout: 1h
  cookieConfig:
    lifetimeType: Permanent
```

[kgateway 2.2.0 cookie fixture](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/test/e2e/features/session_persistence/testdata/cookie-session-persistence.yaml)

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

Cilium `v1.19.3` can limit request-body size with the HTTP **buffer filter** included in its packaged Envoy image. The example below configures a listener, route and EDS cluster for the existing single-port `production/api-service:8080`. It requires kube-proxy replacement and Envoy configuration support.

To use the request limit in Section 2 as well, combine the filters in one configuration instead of applying both CECs unchanged. Leave Gateway-generated CECs under controller ownership, preserve the authentication path and verify network-policy identities.

`max_request_bytes: 10485760` limits the body buffered by this filter to **10 MiB**; larger bodies receive HTTP 413. Connection buffers and header sizes have separate limits. Buffering the complete body affects streaming and memory use. Verify decompressed application-payload sizes and paths that bypass this filter separately.

```yaml
# cilium-body.yaml
# Cilium v1.19.3 Service interception; one owner per Service/listener.
apiVersion: cilium.io/v2
kind: CiliumEnvoyConfig
metadata:
  name: body-size-limit
  namespace: production
  annotations:
    cec.cilium.io/use-original-source-address: "false"
spec:
  services:
    - name: api-service
      namespace: production
      ports: [8080]
      listener: body-size-limit-listener
  resources:
    - "@type": type.googleapis.com/envoy.config.listener.v3.Listener
      name: body-size-limit-listener
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: body-size-limit
                rds:
                  route_config_name: body-size-limit-routes
                http_filters:
                  - name: envoy.filters.http.buffer
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.buffer.v3.Buffer
                      max_request_bytes: 10485760
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
    - "@type": type.googleapis.com/envoy.config.route.v3.RouteConfiguration
      name: body-size-limit-routes
      virtual_hosts:
        - name: api
          domains: ["*"]
          routes:
            - match:
                prefix: "/"
              route:
                cluster: production/api-service
    - "@type": type.googleapis.com/envoy.config.cluster.v3.Cluster
      name: production/api-service
      type: EDS
      connect_timeout: 5s
      lb_policy: ROUND_ROBIN
```

[Packaged Envoy image](https://github.com/cilium/cilium/blob/v1.19.3/install/kubernetes/cilium/values.yaml) · [Packaged build extensions](https://github.com/cilium/proxy/blob/2437d2edeaf4d9b56ef279bd0d71127440c067aa/envoy_build_config/extensions_build_config.bzl) · [Buffer contract](https://github.com/envoyproxy/envoy/blob/v1.36.0/api/envoy/extensions/filters/http/buffer/v3/buffer.proto)

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

For kgateway `v2.2.0` with the **Envoy data plane**, set `TrafficPolicy.spec.buffer.maxRequestSize` to limit request-body size. `10Mi` is **10 MiB = 10,485,760 bytes**; the HTTP buffer filter rejects larger bodies with HTTP 413. This limit is separate from connection-level buffer sizes.

Prepare `production/api-route` and its Gateway/backend first. When combining request limits and authentication, collect the required settings in the intended effective policy. Verify the effects of full-body buffering on streaming and memory, as well as limits on decompressed payloads and bypass paths.

```yaml
# kgateway-body.yaml
# kgateway v2.2.0 Envoy data plane; existing production/api-route.
apiVersion: gateway.kgateway.dev/v1alpha1
kind: TrafficPolicy
metadata:
  name: body-size-limit
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  buffer:
    maxRequestSize: 10Mi
```

[2.2.0 buffer API](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/api/v1alpha1/kgateway/traffic_policy_types.go) · [Buffer translation](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/pkg/kgateway/extensions2/plugins/trafficpolicy/buffer.go)

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

For the kgateway `v2.2.0` **Envoy data plane**, an HTTPRoute `ExtensionRef` can reference `gateway.kgateway.dev/DirectResponse`. The route below returns a fixed 503 HTML page for requests matching the `/maintenance` path prefix.

This route has no backend reference. It adds an explicit maintenance path while preserving existing application and authentication routes; it does not rewrite arbitrary upstream 500/503 responses.

Prepare the `production-gateway` HTTPS listener, certificate/DNS and allowed route attachment first. The inline body must fit the DirectResponse schema's 4,096-character limit.

```yaml
# kgateway-maintenance.yaml
# kgateway v2.2.0 Envoy data plane; explicit maintenance path only.
apiVersion: gateway.kgateway.dev/v1alpha1
kind: DirectResponse
metadata:
  name: maintenance-response
  namespace: production
spec:
  status: 503
  body: |
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
      sectionName: https
  hostnames:
    - api.example.com
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /maintenance
      filters:
        - type: ExtensionRef
          extensionRef:
            group: gateway.kgateway.dev
            kind: DirectResponse
            name: maintenance-response
        - type: ResponseHeaderModifier
          responseHeaderModifier:
            set:
              - name: content-type
                value: text/html; charset=utf-8
```

[2.2.0 DirectResponse schema](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/api/v1alpha1/kgateway/direct_response_types.go) · [Versioned route example](https://github.com/kgateway-dev/kgateway/blob/v2.2.0/examples/example-direct-response-route.yaml)

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
