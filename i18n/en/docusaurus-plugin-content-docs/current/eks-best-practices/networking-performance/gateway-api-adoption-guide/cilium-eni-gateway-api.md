---
title: Cilium ENI Mode + Gateway API Deep-dive Configuration
description: Cilium ENI mode architecture, Gateway API resource configuration, performance optimization, Hubble observability, BGP Control Plane v2 deep-dive guide
created: "2026-02-14"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 47
tags:
  - eks
  - cilium
  - eni
  - gateway-api
  - ebpf
  - networking
  - bgp
  - scope:tech
sidebar_label: Cilium ENI + Gateway API
category: performance-networking
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { EksRequirementsTable, InstanceTypeTable, LatencyComparisonTable, AlgorithmComparisonTable } from '@site/src/components/GatewayApiTables';

:::info
This document extends the [Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide). It provides practical guidance for combining Cilium ENI mode and Gateway API to configure high-performance networking.
:::

Cilium ENI mode is a high-performance networking solution that uses AWS Elastic Network Interfaces directly to assign VPC IP addresses to Pods. Combined with Gateway API, it provides standardized L7 routing and eBPF-based ultra-low-latency processing.

## 1. What is Cilium ENI Mode?

Cilium ENI mode is a high-performance networking solution that uses AWS Elastic Network Interfaces directly to assign VPC IP addresses to Pods. Unlike traditional overlay networks, ENI mode provides the following capabilities.

### Key Features

**Direct use of AWS ENIs**<br/>
Each Pod receives a VPC IP. Security groups apply to ENIs, NACLs apply to subnets, and VPC Flow Logs provide flow visibility. This does not by itself provide per-Pod security group assignment equivalent to AWS VPC CNI Security Groups for Pods.

**High-performance networking with eBPF**<br/>
Cilium implements packet forwarding and Service handling with eBPF in the Linux kernel. Improvement over iptables depends on traffic, rule count, instance type, and configuration; this document does not contain a measured comparison.

```mermaid
graph TB
    subgraph "Traditional iptables"
        A[Packet] --> B[Netfilter Hooks]
        B --> C[iptables Rules]
        C --> D[Chain Traversal]
        D --> E[Target Action]
        E --> F[Packet Out]
    end

    subgraph "Cilium eBPF"
        G[Packet] --> H[eBPF hook<br/>Path dependent]
        H --> I[eBPF Program]
        I --> J[Direct Action]
        J --> K[Packet Out]
    end

    style I fill:#00D4AA
    style D fill:#FF6B6B
```

**Native routing without overlay overhead**<br/>
ENI mode uses VPC routing tables directly, without overlay encapsulation such as VXLAN or Geneve. This minimizes network hops and prevents MTU issues caused by encapsulation.

:::tip
Consider ENI mode for EC2 nodes that need VPC IPs and native routing. The previously attributed Datadog figures of 40% lower latency and 35% higher throughput are not supported by an identified original experiment and must not be used as performance evidence. Measure with the same workload and node configuration.
:::

## 2. Architecture Overview

The architecture combining Cilium ENI mode and Gateway API consists of the following components.

```mermaid
graph LR
    subgraph "AWS Cloud"
        NLB[Network Load Balancer<br/>L4 traffic distribution]

        subgraph "EKS Cluster"
            subgraph "Worker Node 1"
                TPROXY1[eBPF TPROXY<br/>Transparent proxy]
                ENVOY1[Cilium Envoy<br/>L7 Gateway]
                POD1A[Pod A<br/>ENI IP: 10.0.1.10]
                POD1B[Pod B<br/>ENI IP: 10.0.1.11]

                TPROXY1 --> ENVOY1
                ENVOY1 --> POD1A
                ENVOY1 --> POD1B
            end

            subgraph "Worker Node 2"
                TPROXY2[eBPF TPROXY]
                ENVOY2[Cilium Envoy]
                POD2A[Pod C<br/>ENI IP: 10.0.2.10]
                POD2B[Pod D<br/>ENI IP: 10.0.2.11]

                TPROXY2 --> ENVOY2
                ENVOY2 --> POD2A
                ENVOY2 --> POD2B
            end

            OPERATOR[Cilium Operator<br/>ENI allocation management]
            AGENT1[Cilium Agent<br/>eBPF program loading]
            AGENT2[Cilium Agent]

            OPERATOR -.->|Create/delete ENIs| AGENT1
            OPERATOR -.->|Create/delete ENIs| AGENT2
        end

        ENI1[(ENI Pool<br/>Node 1)]
        ENI2[(ENI Pool<br/>Node 2)]

        NLB -->|TCP 443| TPROXY1
        NLB -->|TCP 443| TPROXY2

        ENI1 -.->|IP allocation| POD1A
        ENI1 -.->|IP allocation| POD1B
        ENI2 -.->|IP allocation| POD2A
        ENI2 -.->|IP allocation| POD2B
    end

    CLIENT[Client] -->|HTTPS| NLB

    HUBBLE[Hubble Relay<br/>Observability aggregation] -.->|Monitoring| AGENT1
    HUBBLE -.->|Monitoring| AGENT2

    style NLB fill:#FF9900
    style TPROXY1 fill:#00D4AA
    style TPROXY2 fill:#00D4AA
    style ENVOY1 fill:#AC58E6
    style ENVOY2 fill:#AC58E6
    style OPERATOR fill:#5E35B1
    style HUBBLE fill:#00BFA5
```

### Key Components

**1. Network Load Balancer (NLB)**
- AWS managed L4 load balancer
- Ultra-low latency, measured in microseconds
- Cross-Zone Load Balancing support
- Static IP or Elastic IP allocation
- TLS passthrough mode support

**2. eBPF TPROXY (Transparent Proxy)**
- Intercepts Service traffic with eBPF and redirects it to Envoy through TPROXY
- Envoy performs L7 processing in userspace; this is not a complete kernel bypass
- Maintains connection tracking and Service state in eBPF maps
- XDP acceleration is an option for supported L4 forwarding paths, distinct from TPROXY

**3. Cilium Envoy (L7 Gateway)**
- L7 processing engine based on Envoy Proxy
- Implements Gateway API resources such as HTTPRoute and TLSRoute
- Dynamic listener and route configuration through the xDS API
- Request/response transformation, header manipulation, and rate limiting

**4. Cilium Operator**
- Orchestrates ENI creation and deletion
- Manages IP address pools, including Prefix Delegation
- Synchronizes policies across the cluster
- Manages CiliumNode CRD status

**5. Cilium Agent (DaemonSet)**
- Loads and manages eBPF programs on each node
- Implements the CNI plugin
- Tracks endpoint status
- Enforces network policies

**6. ENI (Elastic Network Interface)**
- AWS VPC network interface
- Maximum ENI count depends on the instance type (for example, 3 for m5.large)
- Maximum IP count per ENI is limited (for example, 10 per ENI for m5.large)
- IPv4 prefix delegation provides 16 addresses per /28; each prefix consumes one secondary IPv4 address slot on the ENI

**7. Hubble (Observability)**
- Real-time visibility into network flows
- Automatic service dependency map generation
- L7 protocol visibility (HTTP, gRPC, Kafka, DNS)
- Prometheus metric export

### Four Stages of Traffic Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant NLB as NLB
    participant TPROXY as eBPF TPROXY
    participant ENVOY as Cilium Envoy
    participant POD as Backend Pod

    Note over C,POD: 1. L4 load balancing
    C->>NLB: TCP SYN (443)
    NLB->>TPROXY: Select node based on health checks

    Note over C,POD: 2. Transparent proxying (TPROXY)
    TPROXY->>TPROXY: Execute eBPF program<br/>Update connection tracking map
    TPROXY->>ENVOY: Redirect to local Envoy

    Note over C,POD: 3. L7 routing
    C->>ENVOY: HTTP/2 GET /api/users
    ENVOY->>ENVOY: Match HTTPRoute<br/>Validate headers<br/>Check rate limits

    Note over C,POD: 4. Native routing
    ENVOY->>POD: Forward directly to ENI IP<br/>(no overlay)
    POD-->>ENVOY: HTTP 200 OK
    ENVOY-->>C: Send response

    Note over TPROXY,POD: Hubble observes every stage
```

**Stage 1: L4 load balancing (NLB)**
- Receives TCP connection requests from clients
- Selects healthy nodes based on target group health checks
- Maintains connection affinity with a flow hash algorithm based on the 5-tuple

**Stage 2: Transparent proxying (eBPF TPROXY)**
- Intercepts Service traffic with eBPF and looks up connection tracking state
- Transparently redirects new connections to the local Envoy listener
- Reads destination information from the map for fast forwarding of existing connections
- Redirects to userspace Envoy for L7 processing; context switches still occur

**Stage 3: L7 routing (Cilium Envoy)**
- Parses HTTP/2 and extracts request headers
- Matches HTTPRoute rules by path, header, and query parameter
- Transforms requests through URL rewrites and header addition/removal
- Enforces rate limiting and authentication/authorization policies

**Stage 4: Native routing**
- Forwards directly to the backend Pod's ENI IP address
- Uses VPC routing tables without VXLAN/Geneve encapsulation
- Does not require disabling EC2 instance source/destination checks
- Returns response packets along the same path in reverse

:::info
In this architecture, Cilium Envoy serves as the Gateway API `GatewayClass` implementation. The Cilium Operator detects changes to `HTTPRoute` resources and dynamically updates the Envoy configuration on each node.
:::

## 3. Prerequisites

The following requirements must be met to deploy Cilium ENI mode successfully.

### EKS Cluster Requirements

<EksRequirementsTable locale="en" />

:::warning
For a new standard EKS cluster, set `addonsConfig.disableDefaultAddons: true` in eksctl to skip the default VPC CNI, kube-proxy, and CoreDNS add-ons. This does not replace Auto Mode networking. Install Cilium and CoreDNS separately afterward.

On an existing cluster, removing the VPC CNI interrupts Pod networking, so **downtime is required**.
:::

### VPC and Subnet Requirements

**IP address availability**<br/>
In ENI mode, each Pod uses an actual VPC IP address, so sufficient IP address space is required.

```bash
# Formula for calculating the required number of IP addresses
Total_required_IPs = (Worker_nodes × Max_Pods_per_node) + Headroom(20%)

# Example: 10 nodes, up to 110 Pods per node
# Total required IPs = (10 × 110) × 1.2 = 1,320
# Recommended subnet: /21 (2,048 IPs) or larger
```

**Subnet configuration**
- At least 1 subnet per Availability Zone (AZ)
- Required subnet tags:
  ```
  kubernetes.io/role/internal-elb = 1
  kubernetes.io/cluster/<cluster-name> = shared
  ```
- Both public and private subnets are supported
- Private subnets are recommended for stronger security

**VPC settings**
- Enable DNS hostnames: `enableDnsHostnames: true`
- Enable DNS support: `enableDnsSupport: true`
- Configure the correct domain name in the DHCP option set

### IAM Permissions

The Cilium Operator and nodes require the following IAM permissions to manage ENIs.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:AttachNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DetachNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeInstances",
        "ec2:ModifyNetworkInterfaceAttribute",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs",
        "ec2:DescribeRouteTables",
        "ec2:DescribeTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeSecurityGroups",
        "ec2:CreateTags"
      ],
      "Resource": "*"
    }
  ]
}
```

**Configure IRSA (IAM Roles for Service Accounts)**

```bash
# Create an IAM role for the Cilium Operator
eksctl create iamserviceaccount \
  --name cilium-operator \
  --namespace kube-system \
  --cluster <cluster-name> \
  --role-name CiliumOperatorRole \
  --role-only \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy \
  --approve

# Attach an additional inline policy
aws iam put-role-policy \
  --role-name CiliumOperatorRole \
  --policy-name CiliumENIPolicy \
  --policy-document file://cilium-eni-policy.json
```

**Add permissions to the node IAM role**

```bash
# Get the node group's IAM role ARN
NODE_ROLE=$(aws eks describe-nodegroup \
  --cluster-name <cluster-name> \
  --nodegroup-name <node-group-name> \
  --query 'nodegroup.nodeRole' \
  --output text)

# Attach the policy
aws iam attach-role-policy \
  --role-name $(echo $NODE_ROLE | cut -d'/' -f2) \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
```

:::tip EKS Auto Mode and Cilium

[AWS documentation](https://docs.aws.amazon.com/eks/latest/userguide/auto-networking.html) explicitly excludes alternate CNIs such as Cilium and Calico on Auto Mode nodes. Do not remove their built-in networking or attempt to replace it with Cilium ENI through a bootstrap flag.

The installation examples here target **standard EKS managed/self-managed EC2 nodes outside Auto Mode**. Use those node types when Cilium ENI is required, and plan CNI and workload migration separately when moving to Auto Mode. AWS support for Cilium on EKS Hybrid Nodes is distinct from operating upstream Cilium on EC2 nodes.
:::

## 4. Installation Flow

The installation procedure for Cilium ENI mode depends on whether the cluster is new or existing.

### New Cluster (Recommended)

A new cluster allows Cilium to be deployed before the VPC CNI is installed, providing a clean installation without downtime.

**Step 1: Create an EKS cluster with the VPC CNI disabled**

```bash
# Create a cluster with eksctl
cat <<EOF > cluster-config.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: cilium-gateway-cluster
  region: ap-northeast-2
  version: "1.32"

vpc:
  cidr: 10.0.0.0/16
  nat:
    gateway: HighlyAvailable  # Redundant NAT Gateways

# Disable automatic VPC CNI installation (required)
addonsConfig:
  disableDefaultAddons: true

managedNodeGroups:
  - name: ng-1
    instanceType: m7g.xlarge
    desiredCapacity: 3
    minSize: 3
    maxSize: 10
    volumeSize: 100
    privateNetworking: true
    iam:
      withAddonPolicies:
        autoScaler: true
        albIngress: true
        cloudWatch: true
    labels:
      role: worker
    tags:
      nodegroup-name: ng-1

# disableDefaultAddons also skips kube-proxy and CoreDNS
EOF

# Create the cluster (takes 10-15 minutes)
eksctl create cluster -f cluster-config.yaml
```

:::warning
`addonsConfig.disableDefaultAddons: true` is required for this example. Ordinary Pod networking and DNS are not ready until Cilium and CoreDNS have been installed.
:::

**Step 2: Install Gateway API CRDs**

```bash
# Cilium 1.19.3 compatibility baseline: Gateway API v1.4.1
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/standard-install.yaml

# Verify the installation
kubectl get crd | grep gateway
```

**Example output:**
```
gatewayclasses.gateway.networking.k8s.io         2026-02-12T00:00:00Z
gateways.gateway.networking.k8s.io               2026-02-12T00:00:00Z
httproutes.gateway.networking.k8s.io             2026-02-12T00:00:00Z
referencegrants.gateway.networking.k8s.io        2026-02-12T00:00:00Z
```

**Step 3: Add the Cilium Helm repository**

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
```

**Step 4: Install Cilium with Helm**
These values target the [Cilium 1.19.3 chart](https://github.com/cilium/cilium/blob/v1.19.3/install/kubernetes/cilium/values.yaml). Configure the IRSA role, EKS OIDC provider, AWS Load Balancer Controller, and Prometheus Operator ServiceMonitor CRD first. Replace the account and API endpoint values. The separate inference Gateway versions in section 9.4 do not establish compatibility for this Cilium installation.
```yaml
# cilium-values.yaml
# Enable ENI mode
eni:
  enabled: true
  awsEnablePrefixDelegation: true  # /28 Prefix Delegation
  awsReleaseExcessIPs: true        # Automatically release unused IPs
  iamRole: "arn:aws:iam::123456789012:role/CiliumOperatorRole"

# Set the IPAM mode to ENI
ipam:
  mode: "eni"

# Enable native routing
routingMode: native
autoDirectNodeRoutes: false
ipv4NativeRoutingCIDR: 10.0.0.0/16

# Replace kube-proxy
kubeProxyReplacement: true
k8sServiceHost: <API_SERVER_ENDPOINT>  # EKS API server address
k8sServicePort: 443

# Enable Gateway API
gatewayAPI:
  enabled: true
  hostNetwork:
    enabled: false  # Set to false when using an NLB

# Hubble observability
hubble:
  enabled: true
  relay:
    enabled: true
    replicas: 2
  ui:
    enabled: true
    replicas: 1
    ingress:
      enabled: false  # Expose through a separate HTTPRoute
  metrics:
    enabled:
      - dns
      - drop
      - tcp
      - flow
      - port-distribution
      - icmp
      - httpV2:exemplars=true;labelsContext=source_ip,source_namespace,source_workload,destination_ip,destination_namespace,destination_workload,traffic_direction

# Operator high availability
operator:
  replicas: 2
  rollOutPods: true
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true

# Agent settings
prometheus:
  enabled: true
  serviceMonitor:
    enabled: true

# Security hardening
policyEnforcementMode: "default"
encryption:
  enabled: false  # This example does not enable Pod traffic encryption
  type: wireguard  # Enable WireGuard when required

# Performance optimization
bpf:
  preallocateMaps: true
  mapDynamicSizeRatio: 0.0025  # Use 0.25% of memory
  monitorAggregation: medium
  lbMapMax: 65536  # Load balancer map size

# Maglev load balancing
loadBalancer:
  algorithm: maglev
  mode: snat
  acceleration: disabled  # Enable XDP separately after driver/MTU validation
```

```bash
# Get the EKS API server endpoint
API_SERVER=$(aws eks describe-cluster \
  --name cilium-gateway-cluster \
  --query 'cluster.endpoint' \
  --output text | sed 's/https:\/\///')

# Install the Helm chart
helm install cilium cilium/cilium \
  --version 1.19.3 \
  --namespace kube-system \
  --values cilium-values.yaml \
  --set k8sServiceHost=${API_SERVER} \
  --wait
```

**Step 5: Install CoreDNS**

Because `disableDefaultAddons` also skipped CoreDNS, install it as an EKS add-on after Cilium is ready.

```bash
# Deploy CoreDNS
aws eks create-addon --cluster-name cilium-gateway-cluster --addon-name coredns

# Check CoreDNS Pods
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

**Step 6: Verify the installation**

```bash
# Install the Cilium CLI (macOS)
brew install cilium-cli

# Alternatively, for Linux/macOS
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
curl -L --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-amd64.tar.gz{,.sha256sum}
sudo tar xzvfC cilium-linux-amd64.tar.gz /usr/local/bin
rm cilium-linux-amd64.tar.gz{,.sha256sum}

# Check Cilium status (wait up to 5 minutes)
cilium status --wait

# Test connectivity (takes approximately 2-3 minutes)
cilium connectivity test
```

**Example healthy output:**
```
    /¯¯\
 /¯¯\__/¯¯\    Cilium:             OK
 \__/¯¯\__/    Operator:           OK
 /¯¯\__/¯¯\    Envoy DaemonSet:    OK
 \__/¯¯\__/    Hubble Relay:       OK
    \__/       ClusterMesh:        disabled

DaemonSet         cilium             Desired: 3, Ready: 3/3, Available: 3/3
Deployment        cilium-operator    Desired: 2, Ready: 2/2, Available: 2/2
Deployment        hubble-relay       Desired: 2, Ready: 2/2, Available: 2/2
Containers:       cilium             Running: 3
                  cilium-operator    Running: 2
                  hubble-relay       Running: 2
```

**Step 7: Create Gateway resources**
`default/tls-cert` must contain a valid certificate and private key for the hostname. Prepare those files before running:

```bash
kubectl create secret tls tls-cert -n default --cert=tls.crt --key=tls.key
```
Cilium 1.19.3 creates a synthetic Gateway EndpointSlice (`192.192.192.192:9999`), not a list of backend Pod IPs. Use NLB **instance targets and the generated Service NodePorts** here. The subsequent Envoy-to-Pod hop uses ENI IPs. Do not register the synthetic endpoint as an NLB IP target. [Pinned controller source](https://github.com/cilium/cilium/blob/v1.19.3/operator/pkg/model/translation/gateway-api/translator.go).

```yaml
# gateway-resources.yaml
---
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cilium
spec:
  controllerName: io.cilium/gateway-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: cilium-gateway
  namespace: default
spec:
  gatewayClassName: cilium
  infrastructure:
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: external
      service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
      service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp
      service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
      service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
    - name: https
      protocol: HTTPS
      port: 443
      allowedRoutes:
        namespaces:
          from: All
      tls:
        mode: Terminate
        certificateRefs:
          - kind: Secret
            name: tls-cert
```

```bash
# Deploy the Gateway
kubectl apply -f gateway-resources.yaml

# Check Gateway status
kubectl get gateway cilium-gateway -o yaml
```

**Gateway ready status:**
```yaml
status:
  conditions:
    - type: Accepted
      status: "True"
      reason: Accepted
    - type: Programmed
      status: "True"
      reason: Programmed
  addresses:
    - type: Hostname
      value: "a1234567890abcdef.elb.ap-northeast-2.amazonaws.com"
```

### Existing Cluster (Downtime Required)

On an existing cluster, removing the VPC CNI and replacing it with Cilium temporarily interrupts Pod networking.

:::danger Downtime Warning
This process **interrupts Pod networking across the entire cluster**. For production environments, a blue-green cluster cutover or a scheduled maintenance window is strongly recommended.

Downtime has not been measured here. Plan a maintenance window that includes node replacement, Pod recreation, and validation.
:::

**Step 1: Create backups**

```bash
# Back up the current network configuration
kubectl get -A pods -o yaml > backup-pods.yaml
kubectl get -A services -o yaml > backup-services.yaml
kubectl get -A ingress -o yaml > backup-ingress.yaml

# Back up the VPC CNI configuration
kubectl get daemonset aws-node -n kube-system -o yaml > backup-aws-node.yaml
```

**Step 2: Remove the VPC CNI**

```bash
# Delete the aws-node DaemonSet
kubectl delete daemonset aws-node -n kube-system

# Delete kube-proxy; Cilium replaces it
kubectl delete daemonset kube-proxy -n kube-system
```

**Step 3: Add node taints (optional safeguard)**

```bash
# Add a NoSchedule taint to every node
kubectl get nodes -o name | xargs -I {} kubectl taint {} key=value:NoSchedule
```

**Step 4: Install Cilium using the new-cluster procedure**

Follow Steps 2-7 in the "New Cluster" section above.

**Step 5: Restart Pods**

Before restarting workloads, verify Cilium and DNS, then remove only the temporary taint added above. This maintenance outline is not a complete migration runbook; managed VPC CNI add-on ownership, StatefulSets, standalone Pods, rollback, and node replacement must be planned for the actual cluster.

```bash
kubectl taint nodes --all key:NoSchedule-
```



```bash
# Restart Pods in all namespaces (rolling restart)
kubectl get namespaces -o jsonpath='{.items[*].metadata.name}' | \
  xargs -n1 -I {} kubectl rollout restart deployment -n {}

# Restart DaemonSets as well
kubectl get daemonsets -A -o jsonpath='{range .items[*]}{.metadata.namespace}{" "}{.metadata.name}{"\n"}{end}' | \
  while read ns ds; do
    kubectl rollout restart daemonset $ds -n $ns
  done
```

**Step 6: Verify networking**

```bash
# Test Pod-to-Pod communication
kubectl run test-pod --image=nicolaka/netshoot --rm -it -- /bin/bash
# Inside the Pod:
ping 10.0.1.10  # Another Pod's ENI IP
curl http://kubernetes.default.svc.cluster.local

# Test DNS resolution
nslookup kubernetes.default.svc.cluster.local

# Test external communication
curl https://www.google.com
```

## 5. Gateway API Resource Configuration

The following examples configure practical routing scenarios with Cilium Gateway API.

### Basic HTTPRoute

```yaml
# basic-httproute.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: example-route
  namespace: production
spec:
  parentRefs:
    - name: cilium-gateway
      namespace: default
  hostnames:
    - "api.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/v1
      backendRefs:
        - name: api-service
          port: 8080
          weight: 100
      filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            add:
              - name: X-Backend-Version
                value: "v1"
```

### Traffic Splitting (Canary Deployment)

```yaml
# canary-httproute.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: canary-route
  namespace: production
spec:
  parentRefs:
    - name: cilium-gateway
      namespace: default
  hostnames:
    - "api.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/v2
      backendRefs:
        - name: api-v2-stable
          port: 8080
          weight: 90  # 90% of traffic
        - name: api-v2-canary
          port: 8080
          weight: 10  # 10% of traffic
```

### Header-Based Routing

```yaml
# header-based-route.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: header-route
  namespace: production
spec:
  parentRefs:
    - name: cilium-gateway
      namespace: default
  hostnames:
    - "api.example.com"
  rules:
    # Route beta users to the new version
    - matches:
        - headers:
            - type: Exact
              name: X-User-Type
              value: beta
      backendRefs:
        - name: api-v2-beta
          port: 8080

    # Route regular users to the stable version
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: api-v1-stable
          port: 8080
```

### URL Rewrite

```yaml
# url-rewrite-route.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: rewrite-route
  namespace: production
spec:
  parentRefs:
    - name: cilium-gateway
      namespace: default
  hostnames:
    - "api.example.com"
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
        - name: new-api-service
          port: 8080
```

### Role Separation Guide

The following configuration implements role separation, a key benefit of Gateway API, in Cilium.

```yaml
# role-separation-example.yaml

# 1. Platform team: Manage GatewayClass (cluster-admin)
---
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: production-gateway
spec:
  controllerName: io.cilium/gateway-controller
  parametersRef:
    group: ""
    kind: ConfigMap
    name: gateway-config
    namespace: kube-system

---
# Platform team: Manage Gateway infrastructure (infra namespace)
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shared-gateway
  namespace: infra
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
spec:
  gatewayClassName: production-gateway
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      allowedRoutes:
        namespaces:
          from: All  # Allow attachment from all namespaces
      tls:
        mode: Terminate
        certificateRefs:
          - kind: Secret
            name: wildcard-tls-cert
            namespace: infra

---
# 2. Development team A: Manage HTTPRoute (team-a namespace)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: team-a-route
  namespace: team-a
spec:
  parentRefs:
    - name: shared-gateway
      namespace: infra  # Cross-namespace reference
  hostnames:
    - "team-a.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: team-a-service
          port: 8080

---
# 3. Development team B: Manage HTTPRoute (team-b namespace)
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: team-b-route
  namespace: team-b
spec:
  parentRefs:
    - name: shared-gateway
      namespace: infra
  hostnames:
    - "team-b.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: team-b-service
          port: 9090

---
# Allow cross-namespace references (created by the platform team)
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-team-routes
  namespace: infra
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: team-a
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: team-b
  to:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: shared-gateway
```

**RBAC configuration:**

```yaml
# rbac-platform-team.yaml
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: gateway-infrastructure-admin
rules:
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["gatewayclasses", "gateways"]
    verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-team-gateway
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: gateway-infrastructure-admin
subjects:
  - kind: Group
    name: platform-team
    apiGroup: rbac.authorization.k8s.io

---
# rbac-dev-team.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: httproute-manager
  namespace: team-a
rules:
  - apiGroups: ["gateway.networking.k8s.io"]
    resources: ["httproutes"]
    verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-httproute
  namespace: team-a
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: httproute-manager
subjects:
  - kind: Group
    name: team-a-developers
    apiGroup: rbac.authorization.k8s.io
```

## 6. Performance Optimization

The latency diagram, comparison table, memory estimates, and instance benefit figures in this section are **illustrative, unmeasured assumptions**, not benchmark results or service guarantees. Validate them with a stated workload, hardware, Cilium version, and measurement method.


The following tuning options aim to maximize performance in Cilium ENI mode.

### Benefits of NLB + Cilium Envoy

```mermaid
graph TB
    subgraph "Traditional ALB"
        ALB[ALB L7<br/>~10ms latency]
        ALB --> TARGET1[Target Group]
        TARGET1 --> NGINX1[NGINX Ingress<br/>~5ms latency]
        NGINX1 --> POD1[Pod]

        style ALB fill:#FF9900
        style NGINX1 fill:#009639
    end

    subgraph "NLB + Cilium"
        NLB[NLB L4<br/>~0.4ms latency]
        NLB --> TPROXY[eBPF TPROXY<br/>~0.1ms latency]
        TPROXY --> ENVOY[Cilium Envoy<br/>~3ms latency]
        ENVOY --> POD2[Pod]

        style NLB fill:#FF9900
        style TPROXY fill:#00D4AA
        style ENVOY fill:#AC58E6
    end

    CLIENT[Client] --> ALB
    CLIENT --> NLB

    LATENCY1[Total: ~15ms]
    LATENCY2[Total: ~3.5ms]

    POD1 -.-> LATENCY1
    POD2 -.-> LATENCY2

    style LATENCY2 fill:#4CAF50
    style LATENCY1 fill:#FFC107
```

**Latency comparison:**

<LatencyComparisonTable locale="en" />

### ENI and IP Management Optimization

**Enable Prefix Delegation**<br/>
Allocate /28 blocks of 16 IPs instead of individual addresses. This can improve address allocation efficiency but does not guarantee a fixed reduction in ENI attachments or Pod startup time.

```yaml
# cilium-values.yaml (ENI section)
eni:
  awsEnablePrefixDelegation: true

  # Automatically release excess unused IPs to reduce costs
  awsReleaseExcessIPs: true

# min-allocate/pre-allocate are CiliumNode spec.ipam.min-allocate /
# spec.ipam.pre-allocate fields, not Helm keys under eni.
```

**Benefits:**
- Requires contiguous /28 blocks and instance support for prefixes
- Check the CiliumNode IP pool and AWS API metrics to assess allocation efficiency
- Measure ENI attachments, startup latency, and API throttling for the actual workload

**Check ENI/IP limits by instance type:**

```bash
# Query limits with the AWS CLI
aws ec2 describe-instance-types \
  --instance-types m7g.xlarge \
  --query 'InstanceTypes[0].NetworkInfo.{MaxENI:MaximumNetworkInterfaces,IPv4PerENI:Ipv4AddressesPerInterface}'

# Example output:
# {
#   "MaxENI": 4,
#   "IPv4PerENI": 15
# }
# With those limits, theoretical address slots: 4 × (15 - 1) × 16 = 896
# Actual Pod capacity is lower when constrained by kubelet maxPods, ENIs/slots in use, reservations, or available subnet addresses
```

### BPF Tuning

**Enable map preallocation**<br/>
Preallocate eBPF maps at startup instead of allocating them dynamically to eliminate latency jitter.

```yaml
# cilium-values.yaml
bpf:
  preallocateMaps: true  # Preallocate maps

  # Adjust map sizes to twice the defaults
  lbMapMax: 65536        # Maximum load balancer backend count
  natMax: 524288         # Maximum NAT connection tracking entries
  neighMax: 524288       # Maximum neighbor table entries
  policyMapMax: 16384    # Maximum policy entries

  # Monitor aggregation level (CPU usage vs visibility)
  monitorAggregation: medium  # none, low, medium, maximum

  # Connection tracking (CT) table sizes
  ctTcpMax: 524288
  ctAnyMax: 262144
```

**Calculate memory usage:**
```bash
# Estimated memory usage = sum of (map size × entry size)
# lbMapMax (65536 × 128B) = 8MB
# natMax (524288 × 64B) = 32MB
# Total estimated memory: ~100-200MB/node
```

### Routing Optimization

**Maglev load balancing algorithm**<br/>
Developed by Google, Maglev uses consistent hashing to preserve connection affinity as much as possible when backends change.

```yaml
# cilium-values.yaml
loadBalancer:
  algorithm: maglev  # Default: random
  mode: snat

# Maglev is a top-level key; use the same values on every node
maglev:
  tableSize: 65521
  hashSeed: "JLfvgnHc2kaSUFaI"
```

**Algorithm comparison:**

<AlgorithmComparisonTable locale="en" />

**XDP acceleration (eXpress Data Path)**<br/>
[XDP acceleration](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/#loadbalancer-nodeport-xdp-acceleration) applies to supported LoadBalancer/NodePort forwarding paths with a backend on a remote node. It does not bypass the Gateway’s TPROXY and Envoy L7 processing.

```yaml
# cilium-values.yaml
loadBalancer:
  acceleration: native  # Verify NIC/driver support, MTU, and channel count first
```

**Check XDP support:**
```bash
# Run on the node
ethtool -i eth0 | grep driver
# Supported drivers: ixgbe, i40e, mlx4, mlx5, ena (AWS Nitro)

# Verify that XDP is enabled
ip link show eth0 | grep xdp
```

**Performance improvements:**
- No fixed speedup or CPU reduction has been measured for this example
- AWS ENA requires checks for driver version, supported XDP MTU, and channel limits
- Verify the actual acceleration state with `cilium-dbg status --verbose`

### Instance Type Considerations

**Recommended instances for network performance:**

<InstanceTypeTable locale="en" />

**Reasons to choose Graviton4 (8g series):**
- 40% better price-performance than x86
- 60% improvement in energy efficiency
- eBPF JIT optimization
- Full compatibility with Cilium
- Graviton5 (M9g/M9gd, GA in June 2026): ~25% better performance than M8g

**When to choose Network Optimized instances (n series):**
- Dedicated Gateway nodes
- Traffic of 100,000 RPS or more
- Sub-1ms latency requirements

:::tip
A hybrid configuration is recommended: a dedicated Gateway node group using the `c7gn` series, with general workloads on the `m7g` series.

```yaml
# Example nodeSelector
nodeSelector:
  role: gateway
  instance-type: c7gn.xlarge
```
:::

## 7. Operations & Observability

This section covers operations using Hubble, Cilium's observability tool.

### Hubble Observability

**Observe flows in real time**

```bash
# Install the Hubble CLI
brew install hubble

# Alternatively, download it directly
HUBBLE_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/hubble/master/stable.txt)
curl -L --remote-name-all https://github.com/cilium/hubble/releases/download/$HUBBLE_VERSION/hubble-linux-amd64.tar.gz{,.sha256sum}
sudo tar xzvfC hubble-linux-amd64.tar.gz /usr/local/bin

# Set up port forwarding
cilium hubble port-forward &

# Stream flows in real time across all namespaces
hubble observe --all

# Filter flows for a specific Pod
hubble observe --pod default/frontend-5d5c7b6d8-abc12

# Filter HTTP traffic only
hubble observe --protocol http

# Monitor dropped packets
hubble observe --verdict DROPPED

# Observe traffic between specific namespaces
hubble observe --from-namespace production --to-namespace database
```

**Example output:**
```
Feb 12 10:23:45.123: default/frontend-abc12:8080 -> default/backend-xyz34:9090 http-request FORWARDED (HTTP/2 GET /api/users)
Feb 12 10:23:45.127: default/backend-xyz34:9090 <- default/frontend-abc12:8080 http-response FORWARDED (HTTP/2 200 4.2ms)
Feb 12 10:23:45.130: default/frontend-abc12 -> 8.8.8.8:53 dns-request FORWARDED (A query example.com)
Feb 12 10:23:45.145: 8.8.8.8:53 -> default/frontend-abc12 dns-response FORWARDED (A 93.184.216.34)
```

**Generate a service map**

```bash
# Generate a service dependency map in GraphViz format
hubble observe --all --output jsonpb | \
  hubble-flow-graph > service-map.dot

# Convert to a PNG image
dot -Tpng service-map.dot -o service-map.png

# Open the real-time web UI
cilium hubble ui
# Open http://localhost:12000 in a browser
```

**L7 protocol visibility**

```bash
# Statistics by HTTP method
hubble observe --protocol http --output json | \
  jq -r '.l7.http.method' | \
  sort | uniq -c | sort -rn

# HTTP response code distribution
hubble observe --protocol http --output json | \
  jq -r '.l7.http.code' | \
  sort | uniq -c | sort -rn

# Trace gRPC method calls
hubble observe --protocol grpc

# Kafka topic traffic
hubble observe --protocol kafka
```

### Prometheus Metrics

**Agent metrics (per node)**

```promql
# Packets processed per second
rate(cilium_forward_count_total[5m])

# Dropped packet ratio
sum(rate(cilium_drop_count_total[5m]))
/
(sum(rate(cilium_drop_count_total[5m])) + sum(rate(cilium_forward_count_total[5m])))

# eBPF map utilization
cilium_bpf_map_pressure

# Saturation of the most saturated NAT mapping (%)
cilium_nat_endpoint_max_connection

# Node health probe latency (P99 of the current observation, seconds)
histogram_quantile(0.99, sum by (le, type, protocol, address_type) (cilium_node_health_connectivity_latency_seconds_bucket))
```

**Gateway metrics (Envoy)**

```promql
# Requests per second (RPS)
rate(envoy_http_downstream_rq_total[5m])

# P95 response latency
histogram_quantile(0.95, rate(envoy_http_downstream_rq_time_bucket[5m]))

# 5xx error rate
sum(rate(envoy_http_downstream_rq_xx{envoy_response_code_class="5"}[5m]))
/
sum(rate(envoy_http_downstream_rq_xx[5m]))

# Backend connection failures
rate(envoy_cluster_upstream_cx_connect_fail[5m])

# Active connection count
envoy_http_downstream_cx_active
```

**ENI metrics**

```promql
# Attached interfaces with allocatable IP capacity (operator view)
cilium_operator_ipam_interface_candidates

# Available IP address count
cilium_operator_ipam_available_ips

# IP allocation rate
rate(cilium_operator_ipam_ip_allocation_ops[5m])

# ENI allocation errors
rate(cilium_operator_ipam_allocation_duration_seconds_count{status!="success"}[5m])
```

### Grafana Dashboards

**Import official dashboards**

```bash
# Official Cilium dashboard (Grafana ID: 16611)
# In Grafana, go to Dashboards > Import and enter 16611

# Alternatively, download the JSON file directly
curl -o cilium-dashboard.json https://grafana.com/api/dashboards/16611/revisions/latest/download

# Hubble dashboard (Grafana ID: 16612)
curl -o hubble-dashboard.json https://grafana.com/api/dashboards/16612/revisions/latest/download
```

**Key dashboard panels:**
- Network Throughput (in/out bytes per second)
- Packet Drop Rate by Reason
- Connection Rate (new connections per second)
- NAT Table Utilization
- eBPF Map Pressure
- Gateway Request Rate and Latency
- Top Talkers (most active pods)
- Service Dependency Map

### Source IP Preservation

[AWS NLB documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/edit-target-group-attributes.html#client-ip-preservation) states that client IP preservation is disabled by default for TCP/TLS IP target groups. Set `preserve_client_ip.enabled=true` on a supported network path for Envoy to see the original client IP. Cilium Gateway preserves the peer address reaching it with either Cluster or Local `externalTrafficPolicy`, but cannot recover an address already SNATed by the NLB. Envoy sets X-Forwarded-For and X-Envoy-External-Address. Proxy Protocol v2 is a separate binary protocol, not an XFF-generation option.

The Gateway examples here use instance targets; TCP instance targets preserve client IP by default. The IP-target default above applies to a different target type. The explicit attribute below keeps the intent visible.

**Add the X-Forwarded-For header**

```yaml
# gateway-with-xff.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: cilium-gateway
spec:
  gatewayClassName: cilium
  infrastructure:
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: external
      service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance
      service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: preserve_client_ip.enabled=true
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      tls:
        mode: Terminate
        certificateRefs:
          - name: tls-cert
```

**Read the client IP in the backend (Python example)**
This example assumes that only the trusted Cilium Gateway can reach the backend and that Envoy’s trusted-hop configuration matches the actual proxy chain. Do not trust headers from clients that can reach the backend directly. TLS passthrough does not let Envoy set HTTP headers.
```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/api/info')
def get_client_ip():
    # Trusted Gateway-only backend; do not trust the leftmost client-supplied XFF entry.
    client_ip = request.headers.get('X-Envoy-External-Address')
    return {
        "client_ip": client_ip,
        "proxy_peer_ip": request.remote_addr
    }
```

### Key Verification Commands

```bash
# 1. Check Cilium status
cilium status --wait

# 2. Check Gateway status
kubectl get gateway cilium-gateway -o jsonpath='{.status.conditions[?(@.type=="Programmed")].status}'
# Output: True

# 3. Check HTTPRoute status
kubectl get httproute -A -o wide

# 4. Inspect Envoy listeners
kubectl exec -n kube-system ds/cilium -- cilium-dbg envoy admin listeners

# 5. Check backend endpoints
kubectl exec -n kube-system ds/cilium -- cilium-dbg service list

# 6. Check ENI allocation status
kubectl get ciliumnodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.eni.available}{"\t"}{.status.ipam.used}{"\n"}{end}'

# 7. Monitor flows for 30 seconds
hubble observe --all --since 30s

# 8. Verify network policies
cilium endpoint list

# 9. Inspect BPF map statistics
kubectl exec -n kube-system ds/cilium -- cilium-dbg bpf metrics list

# 10. Test connectivity
cilium connectivity test --test egress-gateway,to-cidr
```

## 8. BGP Control Plane v2

Cilium BGP Control Plane v2 advertises LoadBalancer IPs through BGP in on-premises data centers and hybrid environments.

:::info
This does not advertise AWS NLB addresses through Cilium BGP. The example assumes ownership and routing of a **separate Service VIP pool** reachable through BGP. It requires `bgpControlPlane.enabled=true`, selected nodes, TCP/179 connectivity, return paths, and router configuration. Direct Connect/VPN alone does not configure VIP routing. See the [Cilium v2 configuration](https://docs.cilium.io/en/stable/network/bgp-control-plane/bgp-control-plane-configuration/).
:::

### CiliumBGPPeeringPolicy CRD
`CiliumBGPPeeringPolicy` belongs to the legacy v1 API. The v2 example uses the following three resources. Replace peer addresses and ASNs for your environment.

```yaml
apiVersion: cilium.io/v2
kind: CiliumBGPClusterConfig
metadata:
  name: bgp-policy
spec:
  nodeSelector:
    matchLabels:
      role: gateway
  bgpInstances:
    - name: gateway
      localASN: 64512
      peers:
        - name: router-1
          peerAddress: 192.168.1.1
          peerASN: 64500
          peerConfigRef:
            name: on-premises
        - name: router-2
          peerAddress: 192.168.1.2
          peerASN: 64500
          peerConfigRef:
            name: on-premises
---
apiVersion: cilium.io/v2
kind: CiliumBGPPeerConfig
metadata:
  name: on-premises
spec:
  ebgpMultihop: 10
  timers:
    connectRetryTimeSeconds: 120
    holdTimeSeconds: 90
    keepAliveTimeSeconds: 30
  families:
    - afi: ipv4
      safi: unicast
      advertisements:
        matchLabels:
          advertise: bgp
---
apiVersion: cilium.io/v2
kind: CiliumBGPAdvertisement
metadata:
  name: gateway-vips
  labels:
    advertise: bgp
spec:
  advertisements:
    - advertisementType: Service
      service:
        addresses:
          - LoadBalancerIP
      selector:
        matchLabels:
          bgp-advertise: "true"
```

### LoadBalancer IP Advertisement

The pool’s `10.0.100.50/32` illustrates routing only. Replace it with a VIP you own that does not overlap actual VPC, Pod, or Service CIDRs and that routers can forward to the nodes. An existing workload labeled `app: gateway-backend` is assumed to listen on port 443. This manifest does not replace the Service generated by Cilium Gateway.

```yaml
apiVersion: cilium.io/v2
kind: CiliumLoadBalancerIPPool
metadata:
  name: gateway-vips
spec:
  blocks:
    - cidr: 10.0.100.50/32
  serviceSelector:
    matchLabels:
      bgp-advertise: "true"
---
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
  namespace: default
  labels:
    bgp-advertise: "true"
spec:
  type: LoadBalancer
  loadBalancerClass: io.cilium/bgp-control-plane
  selector:
    app: gateway-backend
  ports:
    - name: https
      port: 443
      targetPort: 443
      protocol: TCP
```

### Hybrid Environment Support

```mermaid
graph TB
    subgraph "On-Premises Data Center"
        ROUTER1[Core Router<br/>AS 64500<br/>192.168.1.1]
        ROUTER2[Core Router<br/>AS 64500<br/>192.168.1.2]
        ONPREM[Legacy Applications]

        ROUTER1 --> ONPREM
        ROUTER2 --> ONPREM
    end

    subgraph "AWS VPC"
        subgraph "EKS Cluster"
            subgraph "Gateway Nodes"
                NODE1[Worker Node 1<br/>BGP Speaker<br/>AS 64512]
                NODE2[Worker Node 2<br/>BGP Speaker<br/>AS 64512]
            end

            NLB[Service VIP<br/>10.0.100.50]
            ENVOY[Service backend]

            NODE1 -.->|Advertise VIP /32| ROUTER1
            NODE2 -.->|Advertise VIP /32| ROUTER2

            NLB --> ENVOY
        end

        DX[AWS Direct Connect<br/>or VPN]
    end

    ROUTER1 <-->|BGP Peering| DX
    ROUTER2 <-->|BGP Peering| DX
    DX <--> NODE1
    DX <--> NODE2

    CLIENT[Client<br/>On-Premises] --> ROUTER1
    CLIENT --> ROUTER2

    style ROUTER1 fill:#4CAF50
    style ROUTER2 fill:#4CAF50
    style NODE1 fill:#00D4AA
    style NODE2 fill:#00D4AA
    style DX fill:#FF9900
```

**Traffic flow:**
1. An on-premises client requests the owned Service VIP
2. The on-premises router selects the BGP route
3. The preconfigured network and return paths deliver traffic to a Cilium node
4. The Cilium Service datapath forwards to a ready backend

**Check BGP status:**

```bash
# Check BGP peer status
kubectl get ciliumbgpnodeconfigs

# Inspect advertised routes
cilium bgp routes advertised ipv4 unicast

# Check peer connection status
cilium bgp peers
```

**Example output:**
```
Local AS   Peer AS   Peer Address   Status    Uptime    Prefixes
64512      64500     192.168.1.1    Established  2h34m     1
64512      64500     192.168.1.2    Established  2h34m     1

Advertised Routes:
10.0.100.50/32 via 172.31.1.10 (self)
```

---

## 9. Hybrid Nodes Architecture and AI/ML Workloads

When EKS Hybrid Nodes combine cloud and on-premises infrastructure, including dedicated GPU data centers, Cilium plays a key role in unifying the CNI and observability.

### 9.1 Why Cilium Is Needed for Hybrid Nodes

The AWS VPC CNI **runs only on EC2 instances inside a VPC**. When on-premises GPU servers join a cluster through EKS Hybrid Nodes, they cannot use the VPC CNI, which results in separate CNIs for cloud and on-premises nodes.

There are three main approaches to CNI configuration in a hybrid node environment.

| Category | VPC CNI + Calico | VPC CNI + Cilium | Cilium Only (requires separate validation) |
|------|-----------------|-----------------|-------------------|
| Cloud node CNI | VPC CNI | VPC CNI | Cilium on standard EC2 nodes; excludes Auto Mode |
| On-premises node CNI | Calico | Cilium for Hybrid Nodes | Requires compatible cluster-wide IPAM/routing design |
| IPAM | Separate by node type | VPC CNI separate from hybrid cluster-pool | Do not assume one installation can mix ENI and cluster-pool |
| Observability | CNI-specific tools | Cloud tools + hybrid Hubble | Hubble according to Cilium deployment scope |
| Gateway API | Verify a compatible controller | Verify Gateway features on Cilium nodes | CNI choice alone does not establish Gateway feature support |
| Operational assessment | Validate routing and policies | Check AWS Hybrid Nodes support scope | Unification alone does not establish lower complexity |

:::warning Overlay Networking on On-Premises Nodes
On-premises Pod CIDRs can communicate through an **overlay or a routed underlay**. Native routing requires bidirectional Pod CIDR reachability. BGP can automate this, but static routing and other routing arrangements are also possible; BGP is not mandatory.
:::

:::info Admission Webhook Routing Issues and Solutions
For the EKS control plane, located in an AWS VPC, to reach webhook Pods on hybrid nodes, the Pod CIDRs must be routable. The [official AWS documentation](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-webhooks.html) describes two approaches.

**When Pod CIDRs are routable:**

- Advertise on-premises Pod CIDRs through BGP (recommended), static routes, or custom routing

**When Pod CIDRs are not routable (without BGP):**

- **Run webhooks on cloud nodes** (the official AWS recommendation) — Pin webhook Pods to cloud nodes with `nodeSelector` or `nodeAffinity`. The API server can access them directly within the VPC
- **An overlay alone does not establish control-plane reachability** — The EKS control plane is not a Cilium VXLAN endpoint. Even with an overlay, provide a supported route from the control plane to webhook Pods or place those webhooks on cloud nodes as described by AWS.
:::

:::tip IPAM Considerations for a Cilium-Only Configuration
Cilium's `ipam.mode=eni` **works only on AWS EC2 instances**. There are three ways to implement a Cilium-only configuration in a hybrid cluster that includes on-premises nodes.

1. **Separate clusters + ClusterMesh**: A cloud ENI cluster and an on-premises cluster-pool cluster can be operated separately. This is not one EKS Hybrid Nodes cluster; validate Pod/node reachability and support scope.
2. **Multi-pool IPAM**: `ipam.mode=multi-pool` allocates CIDRs from CiliumPodIPPool resources. It does not mix the ENI and cluster-pool allocators by node label.
3. **One cluster-pool design**: Using compatible cluster-pool/routing across all nodes requires separate validation. It gives up EC2 ENI IPAM benefits and still requires a solution for control-plane-to-Pod reachability.
:::

### 9.2 Deployment option: Cilium + Gateway + llm-d {#92-권장-아키텍처-cilium--cilium-gateway-api--llm-d}

Using Cilium as the CNI and supporting InferencePool in Cilium Gateway are separate capabilities. The following is an **optional topology that retains the existing Cilium ingress and adds a compatible inference Gateway**. Validate the cost and latency of two proxy hops, as well as timeout, retry, streaming, and authentication header forwarding behavior. Cloud and hybrid node locations are illustrative; validate each node's CNI/IPAM and Pod connectivity separately.

llm-d's [v0.8.1 Gateway Mode](https://github.com/llm-d/llm-d/blob/v0.8.1/docs/architecture/core/router/proxy.md) can also handle ordinary Services and InferencePools through a single compatible Gateway. The EPP is an endpoint selection service, not a second Gateway.

```mermaid
flowchart TB
    subgraph Edge["Existing ingress - optional"]
        CG[Cilium Gateway]
        APP[Traditional Services]
    end
    subgraph Inference["Inference deployment"]
        GW[Compatible inference Gateway]
        EPP[llm-d EPP]
        VLLM[vLLM Pods]
        POOL[InferencePool v1]
        OBJ[InferenceObjective v1alpha2]
    end
    CLIENT[Client] --> CG
    CG --> APP
    CG -->|inference API| GW
    GW <-->|ext-proc| EPP
    GW --> VLLM
    POOL -.->|endpointPickerRef| EPP
    POOL -.->|selector| VLLM
    OBJ -.->|poolRef| POOL
    OBJ -.->|priority| EPP
    style CG fill:#00D4AA
    style GW fill:#326ce5,color:#fff
    style EPP fill:#AC58E6,color:#fff
```

### 9.3 Alternative architectures

| Option | Configuration | Selection Criteria / Trade-offs |
|------|------|----------------------|
| **Retain existing ingress** | Cilium CNI + Cilium Gateway + compatible inference Gateway/EPP | Preserves ingress ownership; requires managing an additional Gateway, policies, and observability |
| **Single compatible Gateway** | Cilium CNI + a Gateway that supports InferencePool/EPP integration | Routes ordinary Services and inference pools through the same Gateway; verify support and security policies for the specific implementation and version |
| **Direct integration with Cilium Gateway** | Cilium CNI + Cilium Gateway + EPP | Choose only after verifying InferencePool backends and EPP integration in the specific Cilium release; using Envoy alone does not establish support |

The [Cilium v1.18.0 Gateway API documentation](https://github.com/cilium/cilium/blob/v1.18.0/Documentation/network/servicemesh/gateway-api/gateway-api.rst) does not establish that the InferencePool/EPP integration required here has been verified. This document does not claim to have validated direct Cilium integration. Installing a CRD alone does not enable a Gateway controller to handle a new backend kind.

### 9.4 Gateway API Inference Extension resources {#94-gateway-api-inference-extension-미래-방향}

The baseline is llm-d v0.8.1 (2026-06-26), router v0.9.0, GIE v1.5.0, and Gateway API v1.5.1. `InferencePool` is the GIE `inference.networking.k8s.io/v1` API, while `InferenceObjective` is llm-d's `llm-d.ai/v1alpha2` alpha policy API. `InferenceModel` is the historical name of the earlier policy API. Older v1alpha1 examples and planned GA dates are not current deployment guidance.

Primary schemas: [llm-d v0.8.1](https://github.com/llm-d/llm-d/releases/tag/v0.8.1), [InferencePool v1](https://github.com/kubernetes-sigs/gateway-api-inference-extension/blob/v1.5.0/config/crd/bases/inference.networking.k8s.io_inferencepools.yaml), [InferenceObjective v1alpha2](https://github.com/llm-d/llm-d-router/blob/v0.9.0/config/crd/bases/llm-d.ai_inferenceobjectives.yaml), [HTTPRoute v1](https://github.com/kubernetes-sigs/gateway-api/blob/v1.5.1/config/crd/standard/gateway.networking.k8s.io_httproutes.yaml).

Define images, model arguments, replica counts, and GPU requests in workloads such as Deployments or LeaderWorkerSets. The Pool connects those Pods through labels, ports, and the EPP; the Objective expresses request priority.

This example defines routing resources only. It requires an existing `llm-d` namespace, `inference-gateway` Gateway, `inference-epp` Service (with an EPP on port 9002 configured to integrate with `gpu-pool`), and model server Pods with the `app: vllm` label and port 8000. It also requires Gateway API v1.5.1, the InferencePool CRD from GIE v1.5.0, the InferenceObjective CRD from router v0.9.0, and compatible controllers.

```yaml
apiVersion: inference.networking.k8s.io/v1
kind: InferencePool
metadata:
  name: gpu-pool
  namespace: llm-d
spec:
  selector:
    matchLabels:
      app: vllm
  targetPorts:
    - number: 8000
  endpointPickerRef:
    name: inference-epp
    kind: Service
    port:
      number: 9002
    failureMode: FailClose
---
apiVersion: llm-d.ai/v1alpha2
kind: InferenceObjective
metadata:
  name: interactive
  namespace: llm-d
spec:
  poolRef:
    group: inference.networking.k8s.io
    kind: InferencePool
    name: gpu-pool
  priority: 10
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: inference-route
  namespace: llm-d
spec:
  parentRefs:
    - name: inference-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1
      backendRefs:
        - group: inference.networking.k8s.io
          kind: InferencePool
          name: gpu-pool
          port: 8000
```

`priority: 10` is an example policy that expresses higher processing priority than requests with priority 0 in the same pool. When using [flow control](https://github.com/llm-d/llm-d/blob/v0.8.1/docs/architecture/core/router/epp/flow-control.md), enable the `flowControl` feature gate in the EPP and have a trusted authentication layer set the `x-llm-d-inference-objective: interactive` header. Creating an Objective alone does not automatically apply it to every request. Validate and reset the header so external users cannot raise their priority arbitrarily. This value does not reserve dedicated GPUs or act as a Pod `PriorityClass`.

---

## Related Documents

- **[Gateway API Adoption Guide](/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide)** - Complete Gateway API migration guide
- **[llm-d + EKS Deployment Guide](/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode)** - Configure the llm-d distributed inference stack
- **[Cilium Documentation](https://docs.cilium.io/)** - Official Cilium project documentation
- **[Cilium Gateway API Documentation](https://docs.cilium.io/en/stable/network/servicemesh/gateway-api/gateway-api/)** - Guide to the Cilium Gateway API implementation
- **[Gateway API Inference Extension](https://gateway-api.sigs.k8s.io/geps/gep-3567/)** - Gateway API extensions for AI/ML inference
- **[AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)** - EKS best practices guide
- **[Introduction to eBPF](https://ebpf.io/)** - eBPF technology overview and learning resources
