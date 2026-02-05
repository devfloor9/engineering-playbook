---
title: "High-Performance Networking with Cilium ENI and Gateway API"
sidebar_label: "Cilium ENI & Gateway API"
description: "Complete guide to implementing high-performance eBPF-based native networking by combining Cilium ENI mode and Gateway API on Amazon EKS"
tags: [eks, cilium, eni, gateway-api, networking, ebpf]
category: "performance-networking"
date: 2025-01-07
authors: [devfloor9]
sidebar_position: 3
---

# Cilium ENI Mode and Gateway API Configuration Guide

This guide provides a comprehensive overview for configuring Cilium ENI mode and Gateway API in Amazon EKS environments. For detailed implementation methods, please refer to the official documentation links in each section.

## Version Information

---

## 1. Overview and Architecture

### 1.1 What is Cilium ENI Mode?

Cilium ENI mode is a networking approach that assigns VPC IPs directly to pods by leveraging AWS Elastic Network Interfaces (ENI).

**Key Features:**

- Pods use VPC-native IPs directly
- Can replace AWS VPC CNI
- High-performance eBPF-based networking
- Native routing eliminates overlay overhead

### 1.2 What is Gateway API?

Gateway API is a next-generation standard that replaces Kubernetes Ingress for traffic management.

**Key Benefits:**

- Role-based resource separation (infrastructure admin vs. application developer)
- Expressive routing rules
- Extensible design
- Multi-protocol support (HTTP, HTTPS, TCP, gRPC)

### 1.3 Architecture Overview

**Key Components:**

- **NLB (Network Load Balancer)**: L4 load balancer forwarding TCP traffic to nodes
- **eBPF TPROXY**: Transparently redirects traffic arriving at nodes to Envoy
- **Cilium Envoy**: Handles L7 routing (applies HTTPRoute rules)
- **Cilium Operator**: Manages ENI creation/lifecycle and serves as Gateway Controller
- **Cilium Agent**: Manages eBPF programs and networking on each node
- **ENI (Elastic Network Interface)**: Assigns VPC-native IPs to pods
- **Hubble**: Provides network flow observability

### 1.4 Traffic Flow

**Traffic Processing Steps:**

1. **Client → NLB**: HTTPS request arrives at NLB (L4)
2. **NLB → Node**: TCP packets forwarded to node (L4 forwarding only)
3. **eBPF TPROXY**: eBPF intercepts traffic at node and redirects to Envoy
4. **Cilium Envoy → Pod**: Routes to Pod IP (ENI IP) based on HTTPRoute rules

:::tip
Service resources are not in the actual traffic path. They are referenced in HTTPRoute backendRef for endpoint discovery only.
:::

### 1.5 Relationship Between ENI Mode and Gateway API

- **NLB + Envoy Combination**: NLB handles L4 load balancing, Envoy handles L7 routing
- **Cilium Operator**: Manages ENI creation/lifecycle and serves as Gateway Controller
- **Native Routing**: Envoy forwards traffic directly to Pod ENI IPs (bypasses Service)
- **Integrated Observability**: Traffic monitoring possible via Hubble
- **Network Policy Integration**: CiliumNetworkPolicy applicable to ingress traffic

:::info More Information
See Cilium AWS ENI documentation
:::

---

## 2. Pre-requisites Checklist

### 2.1 EKS Cluster Requirements

:::tip
Cilium DaemonSet runs with hostNetwork: true, allowing installation without CNI. Using taints ensures other pods don't schedule until Cilium is ready.
:::

### 2.2 VPC and Subnet Requirements

### 2.3 IAM Permission Requirements

- `ec2:CreateNetworkInterface`
- `ec2:DeleteNetworkInterface`
- `ec2:DescribeNetworkInterfaces`
- `ec2:AttachNetworkInterface`
- `ec2:ModifyNetworkInterfaceAttribute`
- `ec2:AssignPrivateIpAddresses`
- `ec2:UnassignPrivateIpAddresses`

### 2.4 Network Requirements

:::info Detailed Requirements
See Cilium Installation Prerequisites
:::

---

## 3. Installation Flow Overview

### 3.1 Installation Steps Summary

**New Cluster (Recommended):**

```text
1. Create EKS cluster (use --bootstrapSelfManagedAddons false option)
   └─→ Skip default VPC CNI, CoreDNS, kube-proxy installation
   └─→ Apply node taint: node.cilium.io/agent-not-ready=true:NoExecute

2. Install Gateway API CRDs
   └─→ kubectl apply -f gateway-api-crds.yaml

3. Add Cilium Helm repository
   └─→ helm repo add cilium https://helm.cilium.io/

4. Install Cilium Helm (runs with hostNetwork, no CNI needed)
   └─→ helm install cilium cilium/cilium --values values.yaml

5. Install CoreDNS (after Cilium)
   └─→ kubectl apply -f coredns.yaml or install via EKS add-on

6. Validate installation
   └─→ cilium status --wait

7. Create Gateway resources
   └─→ GatewayClass → Gateway → HTTPRoute
```

**Existing Cluster (Causes Downtime):**

```text
1. Backup/prepare existing workloads

2. Delete aws-node DaemonSet
   └─→ kubectl -n kube-system delete daemonset aws-node

3. Install Cilium
   └─→ helm install cilium cilium/cilium --values values.yaml

4. Restart existing pods (recover networking)
   └─→ kubectl rollout restart deployment -n <namespace>
```

:::tip
Cilium DaemonSet runs with hostNetwork: true, allowing installation even without CNI via host network.
:::

### 3.2 Key Helm Values Overview

```yaml
# Core configuration - see official documentation for complete options
eni:
  enabled: true
  awsEnablePrefixDelegation: true  # Expand IP capacity

ipam:
  mode: eni

routingMode: native  # Native routing (tunneling disabled)

gatewayAPI:
  enabled: true

hubble:
  enabled: true
  relay:
    enabled: true
  ui:
    enabled: true

operator:
  replicas: 2  # High availability
```

### 3.3 Key Configuration Decision Points

### 3.4 Gateway Exposure Method Comparison

:::tip Recommendation
For production environments, we recommend NLB + Cilium Gateway API combination. NLB handles L4 load balancing and health checks, while Cilium Envoy handles L7 routing.
:::

📚 **Detailed Installation Guide**: Cilium Helm Installation Documentation

---

## 4. Gateway API Configuration Overview

### 4.1 Resource Hierarchy

```text
GatewayClass (cluster-scoped)
    │
    └─→ Gateway (namespace-scoped)
            │
            └─→ HTTPRoute (namespace-scoped)
                    │
                    └─→ Service → Pod
```

### 4.2 Role Separation

### 4.3 Basic Resource Examples

**GatewayClass:**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cilium
spec:
  controllerName: io.cilium/gateway-controller
```

**Gateway (Using NLB):**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
  namespace: default
  annotations:
    # Annotations for NLB usage (when using AWS Load Balancer Controller)
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  gatewayClassName: cilium
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Same
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: my-tls-secret
      allowedRoutes:
        namespaces:
          from: Same
```

**HTTPRoute:**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-route
  namespace: default
spec:
  parentRefs:
    - name: my-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service  # Service for endpoint discovery
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web-service
          port: 80
```

:::tip
When you create a Gateway resource, Cilium automatically creates a LoadBalancer-type Service. If AWS Load Balancer Controller is installed, it will provision an NLB based on annotations.
:::

📚 **Detailed Configuration Guide**: Cilium Gateway API Documentation

---

## 5. Performance Optimization Considerations

### 5.1 Benefits of NLB + Cilium Envoy Combination

- **NLB (L4)**: High-performance TCP load balancing, low latency, auto-scaling
- **Cilium Envoy (L7)**: Flexible HTTP routing, TLS termination, header-based routing
- **eBPF TPROXY**: Transparent traffic delivery at kernel level, kube-proxy bypass

### 5.2 ENI and IP Management

- **Enable Prefix Delegation**: `awsEnablePrefixDelegation: true` to significantly increase IP capacity per node
- **Release Excess IPs**: `awsReleaseExcessIPs: true` to return unused IPs
- **Subnet Sizing**: Allocate sufficient CIDR blocks matching workload scale

### 5.3 BPF Tuning

- **Map Pre-allocation**: `bpf.preallocateMaps: true` to reduce runtime allocation overhead
- **Map Size Adjustment**: In large clusters, adjust `bpf.mapDynamicSizeRatio`
- **LRU Maps**: Optimize connection tracking table size

### 5.4 Routing Optimization

- **Native Routing**: `routingMode: native` to eliminate overlay overhead
- **Maglev Load Balancing**: Consistent hashing improves connection distribution
- **XDP Acceleration**: Enable `loadBalancer.acceleration: native` on supported instances

### 5.5 Instance Type Considerations

📚 **Detailed Tuning Guide**: Cilium Performance Tuning Documentation

---

## 6. Operational Considerations

### 6.1 Observability Tools

**Hubble:**

- Real-time network flow visibility
- Service map visualization
- L7 protocol observation

**Prometheus Metrics:**

- Cilium Agent metrics
- Gateway traffic metrics
- ENI allocation metrics

**Grafana Dashboards:**

- Official Cilium dashboards provided
- Gateway API traffic monitoring

### 6.2 Source IP Preservation

Cilium Gateway API preserves source IP without `externalTrafficPolicy: Local` configuration:

- **X-Forwarded-For**: Contains original client IP
- **X-Envoy-External-Address**: Trusted client address

```yaml
# Check headers in application
X-Forwarded-For: <client-ip>, <nlb-ip>
X-Envoy-External-Address: <client-ip>
```

:::warning
With TLS Passthrough, TCP proxy mode preserves source IP as Envoy IP.
:::

### 6.3 Key Validation Commands

```bash
# Check Cilium status
cilium status --wait

# Test connectivity
cilium connectivity test

# Check Gateway resources
kubectl get gatewayclass,gateway,httproute -A

# Gateway detailed status
kubectl describe gateway <gateway-name>

# Observe network flows with Hubble
hubble observe --namespace default

# Check ENI status
kubectl get ciliumnodes -o wide
```

### 6.4 Common Issues and Resolution Directions

📚 **Detailed Troubleshooting Guide**: Cilium Troubleshooting Documentation

---

## 7. Official Documentation Links Collection

### 7.1 Cilium Documentation

### 7.2 Kubernetes Gateway API Documentation

### 7.3 AWS Documentation

---

## Next Steps

1. Apply environment-specific detailed configuration following official documentation
2. Configure network monitoring using Hubble
