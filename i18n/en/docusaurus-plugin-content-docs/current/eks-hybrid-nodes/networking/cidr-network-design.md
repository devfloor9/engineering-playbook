---
title: CIDR Design and Range Minimization
description: "IP range design best practices for EKS Hybrid Nodes — routing requirement assessment procedure, VPC minimum sizing rationale, dedicated control plane ENI subnet strategy, proactive Pod CIDR allocation, and multi-environment address planning."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 21
tags:
  - eks
  - hybrid-node
  - networking
  - ipam
  - scope:design
keywords:
  - RemotePodNetwork
  - clusterPoolIPv4PodCIDRList
  - VPC CIDR
sidebar_label: CIDR Design and Range Minimization
category: hybrid-multicloud
---

## Overview

For organizations with scarce internal IPAM address space, the first question is "which ranges, how large, and to what extent must they be made routable". This document covers the routing requirement assessment procedure, the reduced registration scope when adopting the Gateway, the rationale behind AWS VPC minimum sizing, and multi-environment (dev/stg/prd) address planning.

## Routing Requirement Assessment Procedure

1. **Node CIDR**: Bidirectional routing is always required. This is a non-negotiable requirement.
2. **Pod CIDR**: Determine whether any of the 5 items in the [feature table](../overview-architecture/hybrid-nodes-fundamentals.md#node-cidr-required-pod-cidr-optional-principle) apply.
   - If none apply → CNI egress NAT is sufficient (no Pod CIDR routing or registration needed)
   - If any apply → choose between BGP full routing and the Hybrid Nodes Gateway ([Architecture Decision Guide](../overview-architecture/architecture-decision-guide.md))

## Reduced Scope When Adopting the Gateway

Adopting the Gateway reduces the ranges that must be registered and routed in the on-premises network as follows.

| Item | Without Gateway (full routing) | With Gateway |
|------|--------------------------|--------------|
| Node CIDR on-prem routing | Required | **Required (unchanged)** |
| Pod CIDR on-prem routing | Required (BGP/static) | **Not required** |
| Pod CIDR VPC route tables | Manual configuration | Managed automatically by the Gateway |
| On-prem firewall awareness of the Pod CIDR | Required | Not required (only UDP 8472 added) |

In other words, within the negotiation scope with the on-premises network team, the **Pod underlay routing portion** shrinks to "Node CIDR routing + allowing UDP 8472 (VXLAN)". This means on-premises routing and firewall registration of the Pod CIDR itself go away, while the **remaining network requirements for operating hybrid nodes stay in place**. That is, baseline firewall rules such as control plane ↔ kubelet (TCP 10250), node → EKS/S3/ECR/STS/SSM endpoints (HTTPS 443), DNS, and credential traffic are still required regardless of whether the Gateway is adopted (for the detailed port list, see the [Firewall/DNS Pre-Registration Guide](./firewall-connectivity.md)). The Pod CIDR is managed only inside the cluster (EKS configuration, Cilium, Gateway).

## AWS VPC Minimum Sizing

A VPC CIDR cannot be shrunk or changed after creation (only secondary CIDRs can be added), so initial sizing matters.

**Theoretical minimum**: EKS requires two subnets in different AZs, and each subnet needs at least 6 available IPs for EKS. Two /28 subnets (11 usable IPs each) — roughly a /27 VPC — is the theoretical floor.

**Rationale for the practical recommendation (/25 to /24)**: control plane ENIs alone do not make a complete cluster.

| Consumer | Required IPs (approx.) | Notes |
|-----------|---------------------|------|
| Control plane ENI subnets ×2 | /28 ×2 (32) | Includes headroom for new ENI creation and replacement during upgrades |
| Gateway nodes ×2 (if adopted) | 2–4 | In different AZs |
| Cloud nodes (webhooks, CoreDNS, system add-ons) | A few to dozens depending on subnet size | Mandatory portion of mixed mode. VPC CNI assigns VPC IPs to Pods too, so consumption scales with Pod count |
| VPC endpoints (PrivateLink for ECR, SSM, STS, etc.) | 1 per AZ per endpoint | When avoiding the internet path |
| Route 53 Resolver inbound endpoint | 1 per AZ | For on-prem → AWS DNS resolution |
| ALB subnets | At least a /27 (subnet block) + 8 free IPs per AZ | When exposing via ALB. Each AZ subnet must have at least a `/27` bitmask, plus at least 8 free IP addresses per subnet reserved for scale-out |
| NLB subnets | One subnet per AZ + spare IPs | When exposing via NLB. Unlike ALB there is no explicit `/27` minimum, but keep spare IPs for nodes and scaling |

The decisive factor is that on cloud nodes the VPC CNI consumes a VPC IP per Pod. Running just a few webhooks, CoreDNS, and monitoring agents can require dozens of IPs per node.

**Worked example (two AZs, in subnet blocks)**: the VPC size is only settled once the consumers above are laid out as actual subnet blocks. The example below assumes a topology with dedicated subnets for the control plane ENIs, the cloud nodes, and the endpoints. AWS reserves five addresses in every subnet, so a /28 has 11 usable IPs and a /27 has 27.

| Subnet (one per AZ × 2) | Block per AZ | Addresses across 2 AZs | Holds |
|-----------|-----------|---------------|------|
| Dedicated control plane ENI | /28 (11 usable) | 32 | ENIs created by EKS, plus replacement headroom during upgrades |
| Cloud nodes | /27 (27 usable) | 64 | System add-on nodes and their Pods (VPC CNI), Gateway instances (if adopted) |
| VPC endpoints and Resolver inbound | /28 (11 usable) | 32 | Interface endpoints and the Resolver inbound endpoint. Each uses one IP per AZ; together they fit up to 11 per AZ |
| **Subtotal (no ALB)** | | **128** | **Fills a /25 exactly, with no free block** |
| Dedicated ALB (when exposing via ALB) | /27 (27 usable, at least 8 of which must stay free) | 64 | ALB nodes |
| **Total (with ALB)** | | **192** | **Requires a /24. The leftover /26 block (64 addresses) is the growth headroom** |

Two conclusions follow. First, without an ALB a /25 exactly matches current consumption and leaves no growth headroom. If the cloud nodes and their Pods are expected to need more than 27 usable IPs per AZ, start with a /24. Second, adding dedicated ALB subnets brings the total to 192, and because a VPC CIDR block size is a power of two, a /24 (256) is required. The ALB could share the node subnets instead, but the VPC CNI keeps consuming node-subnet IPs, which makes the ALB's "at least eight free IP addresses per subnet" requirement hard to maintain. NLB is not included in this example. If you need one, you can carve NLB subnets out of the leftover /26 block in the /24 layout.

In short, per environment (dev/stg/prd) the VPC is a /25 (no headroom) for the minimal layout without an ALB where the cloud nodes fit within a /27 per AZ, and a /24 when you use an ALB or need growth headroom. Conversely, in an extreme configuration that minimizes cloud nodes and uses neither the Gateway nor endpoints, the VPC can be compressed to /26, but expansion then incurs the management burden of secondary CIDRs.

## Dedicated Control Plane ENI Subnet Strategy

The IPs of the control plane ENIs that EKS creates are not fixed; during cluster upgrades and similar changes, existing ENIs are deleted and new ENIs are created. The official documentation addresses this characteristic by recommending **constraining the IP range with small dedicated subnets**.

> "You can restrict the IP range for the Amazon EKS network interfaces by using constrained subnet sizes for the subnets you pass during cluster creation, which makes it easier to configure your on-premises firewall."
> — [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html)

If only two dedicated /28 subnets are passed for the control plane at cluster creation, the firewall registration can use **these two subnet CIDRs** instead of individual IPs. Even when ENI IPs change, no firewall re-application is needed. Use the following command to check the current ENI IPs.

```bash
aws ec2 describe-network-interfaces \
  --query 'NetworkInterfaces[?(VpcId == `VPC_ID` && contains(Description, `Amazon EKS`))].PrivateIpAddress'
```

## Proactive Pod CIDR Allocation

`RemotePodNetwork` can be updated after cluster creation, but only by replacing the entire list, and the more important constraint lies on the CNI side. The Cilium documentation clearly distinguishes expanding the pool from changing existing ranges. When the pool is exhausted, you **expand it by appending a new element** to `clusterPoolIPv4PodCIDRList`. By contrast, **changing an already-allocated existing element, or changing `clusterPoolIPv4MaskSize` (the per-node slice size), is not supported** (changing existing elements causes unexpected behavior, and the mask size cannot be changed). In other words, re-allocation is blocked but appending is allowed, so the first response to pool exhaustion during operation is adding a new CIDR element, not a reinstall. However, adding a pool means you must **update the EKS `RemotePodNetwork`, VPC and on-premises routing, and firewall registrations together to match the new CIDR**, so to avoid this operational change cost it is preferable to multiply the per-node Pod CIDR slice (`clusterPoolIPv4MaskSize`, typically /25 to /26) by the target node count plus growth and **allocate a generous Pod CIDR from the start**. With the Gateway, the Pod CIDR is not exposed to on-premises, so allocating it large does not conflict with internal IPAM (as long as the three non-overlap rules are followed).

## Multi-Environment (dev/stg/prd) Address Planning

In a structure with separate accounts per environment plus one VPC each, the following principles hold.

- **Node CIDR**: Assign separate on-premises ranges per environment (this becomes the unit of routing and firewall applications)
- **Pod CIDR**: Use **unique ranges per environment as the default** (e.g., dev `10.85.0.0/16`, stg `10.86.0.0/16`, prd `10.87.0.0/16`). The AWS hybrid nodes networking requirements assume Pod CIDRs do not overlap with each other, the VPC CIDR, or the Service CIDR, and unique ranges are also preferable for incident analysis and audit log readability. Because the Gateway is one set per cluster, reuse of Pod CIDRs across environments may seem theoretically possible, but that is an **unvalidated exception configuration** that assumes each environment's routing is fully isolated and no destination overlap occurs. If you consider reuse, apply it only after explicitly analyzing and validating per-environment routing isolation and the possibility of destination overlap.
- **VPC CIDR**: No overlap between environments (in case they are later interconnected via TGW)
- The Gateway is one set per cluster, so 3 environments = 6 Gateway EC2 instances (2 per environment) as a fixed cost to include in the plan

## Summary of Recommendations

- Node CIDR bidirectional routing is non-negotiable — secure and request the on-premises range first.
- Pin the control plane ENI range with two dedicated /28 subnets so firewall applications are done at subnet CIDR granularity.
- Size the VPC per environment in subnet blocks, as in the worked example: a /25 (no growth headroom) for the minimal layout without an ALB, and a /24 when you use an ALB or need headroom. Attach the consumption table and the worked example as supporting evidence when agreeing the range with the network team.
- Allocate the Pod CIDR generously from the start, accounting for Cilium's constraint that existing `clusterPoolIPv4PodCIDRList` elements and `clusterPoolIPv4MaskSize` cannot be changed; when more space is needed, expand by appending a new CIDR element (which also requires updating routing and firewall rules).
- Specify the Service CIDR explicitly to keep firewall and routing design predictable.

## References

### Official Documentation
- [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html) — CIDR requirements and the ENI subnet constraint method
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — Fully routed constraint and the optional nature of the Pod CIDR
- [Amazon EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-overview.html) — Routing requirement changes when adopting the Gateway

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and Fundamentals](../overview-architecture/hybrid-nodes-fundamentals.md) — Feature table for Pod CIDR routing needs, CGNAT range support
- [Architecture Decision Guide](../overview-architecture/architecture-decision-guide.md) — Full routing vs Gateway selection criteria
- [Firewall/DNS Pre-Registration Guide](./firewall-connectivity.md) — Firewall application procedure for the secured ranges
