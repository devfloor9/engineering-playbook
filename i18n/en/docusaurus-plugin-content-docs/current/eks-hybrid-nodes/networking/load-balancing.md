---
title: Load Balancing and Service Exposure
description: "Designing external exposure for EKS Hybrid Nodes workloads — the traffic-origin-based NLB vs Cilium built-in LB decision principle, AWS Load Balancer Controller configuration requirements, Cilium LB IPAM and BGP advertisement, and community options such as MetalLB."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 7
tags:
  - eks
  - hybrid-node
  - cilium
  - networking
  - load-balancing
  - scope:impl
keywords:
  - CiliumLoadBalancerIPPool
  - loadBalancerClass
  - MetalLB
  - NLB
sidebar_label: Load Balancing & Service Exposure
category: hybrid-multicloud
---

## Overview

Exposing workloads running on hybrid nodes outside the cluster requires different judgment than in cloud-only clusters. AWS officially supports two options for Services of type LoadBalancer — NLB (Network Load Balancer) and Cilium — and the selection criterion is the **origin of the application traffic**. This document covers that decision principle, the configuration requirements for each path (NLB + AWS Load Balancer Controller, Cilium built-in LB), community options such as MetalLB, and the L7 Ingress path.

## Decision Principle: Traffic Origin

> "The decision to use NLB or Cilium is based on the source of application traffic. If application traffic originates from an AWS Region, AWS recommends using AWS NLB and the AWS Load Balancer Controller. If application traffic originates from the local on-premises or edge environment, AWS recommends using Cilium's built-in load balancing capabilities."
> — [Configure Services of type LoadBalancer for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-load-balancing.html)

| Traffic origin | Recommended path | Prerequisites |
|----------------|-----------------|---------------|
| AWS Region (or internet via the Region) | NLB/ALB + AWS Load Balancer Controller (IP targets) | Pod CIDR reachable from AWS (full BGP routing or Gateway) |
| On-premises / edge local | Cilium built-in LB (LB IPAM + BGP) | Cilium BGP Control Plane, or on-premises routing for the LB IPs |
| On-premises local (existing equipment and operational continuity) | Community options such as MetalLB | Upstream Kubernetes compatible — self-operated |

Detouring traffic that originates and is consumed on premises through a Regional LB adds DX/VPN round-trip latency and bandwidth consumption. The origin principle is a design criterion that prevents this hairpin path.

## Path 1: NLB + AWS Load Balancer Controller (Region-Originating)

For traffic originating in the Region, use the AWS Load Balancer Controller and NLB in **IP target mode**. In IP target mode, the NLB bypasses the Service layer and forwards directly to Pod IPs, so the hybrid Pod CIDR must be routable from AWS — this is a Pod-level inbound requirement, which presupposes full BGP routing or the Hybrid Nodes Gateway ([feature table](../overview-architecture/hybrid-nodes-fundamentals.md#node-cidr-required-pod-cidr-optional-principle)).

```yaml
# Service type LoadBalancer (NLB)
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"

# Ingress (ALB) — for L7 exposure
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-type: ip
```

Three configuration cautions apply.

- **Controller placement**: The AWS Load Balancer Controller uses webhooks. Running it on hybrid nodes requires `RemotePodNetwork` configuration and Pod CIDR routing, so in mixed-mode clusters the recommended pattern is placing it on cloud nodes ([Mixed Mode placement strategy](../operations-cost/operations-cost-optimization.md)).
- **No instance targets**: Hybrid nodes are not EC2 instances, so instance target mode cannot be used. IP targets are the only path.
- **Firewall path**: NLB → hybrid Pod traffic traverses DX/VPN, so the on-premises firewall must allow the VPC → Pod CIDR direction on the service and health check ports ([firewall pre-registration](./firewall-connectivity.md)).

## Path 2: Cilium Built-In LB (On-Premises-Originating)

On-premises local traffic can be handled by Cilium's built-in capabilities without separate load balancer infrastructure. Three features divide the responsibilities.

| Feature | Role | Notes |
|---------|------|-------|
| kube-proxy replacement | Distributes Service traffic to backend Pods | Requires kernel v4.19.57 / v5.1.16 / v5.2.0 or later — among supported OSes, only RHEL 8.x falls short |
| Load Balancer IPAM | Assigns external IPs to Services of type LoadBalancer | IP pools defined with `CiliumLoadBalancerIPPool` |
| BGP Control Plane | Advertises assigned LB IPs to the on-premises network | Requires [BGP configuration](./cni-selection-routing.md#cilium-bgp-control-plane-configuration) first |

LB IPAM and BGP advertisement can be used without kube-proxy replacement; in that case, backend distribution is handled by kube-proxy (iptables), the EKS default.

```yaml
# Define the LB IP pool
apiVersion: cilium.io/v2alpha1
kind: CiliumLoadBalancerIPPool
metadata:
  name: tcp-service-pool
spec:
  blocks:
    - cidr: "LB_IP_CIDR"          # A /32 selects a single IP
  serviceSelector:
    matchLabels:
      io.kubernetes.service.name: tcp-sample-service
---
# Advertise the LB IP on premises via BGP
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPAdvertisement
metadata:
  name: bgp-advertisement-tcp-service
  labels:
    advertise: bgp
spec:
  advertisements:
    - advertisementType: "Service"
      service:
        addresses:
          - LoadBalancerIP
      selector:
        matchLabels:
          io.kubernetes.service.name: tcp-sample-service
---
# Service — loadBalancerClass is required
apiVersion: v1
kind: Service
metadata:
  name: tcp-sample-service
  annotations:
    lbipam.cilium.io/ips: "LB_IP_ADDRESS"   # Request a specific IP (optional)
spec:
  loadBalancerClass: io.cilium/bgp-control-plane
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
  selector:
    app: nginx
```

- `loadBalancerClass` is required to prevent the legacy AWS Cloud Provider from creating a Classic Load Balancer for the Service. Use `io.cilium/bgp-control-plane` for BGP advertisement.
- `io.cilium/l2-announcer` (L2 Announcements) is a beta feature and not officially supported by AWS.
- With BGP advertisement, each hybrid node advertises the LB IP as a /32, and backend distribution happens inside the cluster. `cilium-dbg service list` shows the LB IP → backend Pod mapping.

## Community Options: MetalLB and Others

Hybrid nodes are fully upstream-Kubernetes compatible, so most LB and Ingress solutions common on premises can be used. Options mentioned in the official blog include Cilium (BGP or L2), Calico (BGP), MetalLB, NGINX, HAProxy, Apache APISIX, Emissary Ingress, and Istio.

MetalLB offers two modes.

- **L2 mode (ARP)**: Uses an IP pool reserved from the node subnet, and a single elected node answers ARP requests for a given LB IP. It can start without BGP operations, making it suitable for edge and small environments, but capacity planning must account for the fact that ingress traffic per LB IP converges on a single node.
- **BGP mode (L3)**: Advertises LB IPs via BGP. However, if Cilium is already the CNI, consolidating on Cilium BGP Control Plane + LB IPAM reduces the number of managed components rather than adding another one.

The selection criteria are the operational skills already present in the on-premises environment and the application requirements. Keep a proven LB operating model if one exists; for greenfield builds, evaluate the AWS-supported Cilium built-in LB first.

## L7 Ingress

- **Region-originating**: Use ALB + AWS Load Balancer Controller (`target-type: ip`). Prerequisites are the same as Path 1.
- **On-premises-originating**: Use Cilium Ingress or Cilium Gateway (Gateway API). The LoadBalancer IP the Ingress/Gateway receives is allocated by Cilium LB IPAM, so that IP must be reachable on premises via BGP advertisement or alternative routing. See [Configure Kubernetes Ingress for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-ingress.html) for the procedure.

The reverse direction — the on-premises LB → cloud Pod (DR) path — is covered in [Firewall and TGW Topology](./firewall-connectivity.md#on-premises-lb--cloud-pod-dr-path).

## Summary of Recommendations

- Determine the traffic origin first — Region-originating traffic defaults to NLB/ALB with IP targets; on-premises local traffic defaults to the Cilium built-in LB.
- Avoid hairpin structures that detour on-premises local traffic through a Regional LB; they incur DX/VPN latency and bandwidth cost.
- Confirm early in the design that NLB/ALB IP targets presuppose Pod CIDR routing (BGP or Gateway).
- Place the AWS Load Balancer Controller on cloud nodes in mixed mode.
- When using the Cilium built-in LB, set `loadBalancerClass: io.cilium/bgp-control-plane` on the Service, and do not use kube-proxy replacement on RHEL 8.x.
- Factor MetalLB L2 mode's single-node ingress per LB IP into capacity planning.

## References

### Official Documentation
- [Configure Services of type LoadBalancer for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-load-balancing.html) — NLB vs Cilium decision principle and configuration procedures
- [Configure Kubernetes Ingress for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-ingress.html) — L7 exposure with Cilium Ingress and Gateway
- [Configure add-ons for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html) — AWS Load Balancer Controller IP target and webhook requirements

### Technical Blogs
- [Deep dive into cluster networking for Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deep-dive-into-cluster-networking-for-amazon-eks-hybrid-nodes/) — MetalLB L2/BGP modes and load balancing considerations
- [A deep dive into Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — The two traffic-path categories and the list of community options

### Related Documents (Internal)
- [CNI Configuration and Pod CIDR Routing](./cni-selection-routing.md) — Prerequisite Cilium BGP Control Plane configuration
- [EKS Hybrid Nodes Concepts and How It Works](../overview-architecture/hybrid-nodes-fundamentals.md) — Table of features requiring Pod-level inbound
- [Firewall and DNS Pre-Registration with TGW Topology](./firewall-connectivity.md) — Firewall rules for LB paths and the on-premises LB → cloud path
- [Operations and Cost Optimization](../operations-cost/operations-cost-optimization.md) — Placing webhook components on cloud nodes
