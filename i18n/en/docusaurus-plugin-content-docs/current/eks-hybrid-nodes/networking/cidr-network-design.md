---
title: CIDR Design and Range Minimization
description: "IP range design best practices for EKS Hybrid Nodes — routing requirement assessment procedure, VPC minimum sizing rationale, dedicated control plane ENI subnet strategy, proactive Pod CIDR allocation, and multi-environment address planning."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 6
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

In other words, the negotiation scope with the on-premises network team shrinks to "Node CIDR routing + allowing UDP 8472". The Pod CIDR is managed only inside the cluster (EKS configuration, Cilium, Gateway).

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
| ALB/NLB subnets | 8+ per AZ | When exposing via LB |

The decisive factor is that on cloud nodes the VPC CNI consumes a VPC IP per Pod. Running just a few webhooks, CoreDNS, and monitoring agents can require dozens of IPs per node. A /25 (128 IPs) to /24 (256 IPs) per environment (dev/stg/prd) reflects this consumption structure plus growth headroom — it is not over-provisioning. Conversely, in an extreme configuration that minimizes cloud nodes and uses neither the Gateway nor endpoints, the VPC can be compressed to /26, but expansion then incurs the management burden of secondary CIDRs.

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

`RemotePodNetwork` can be updated after cluster creation, but only by replacing the entire list, and the more important constraint lies on the CNI side. Cilium's `clusterPoolIPv4PodCIDRList` is effectively immutable during operation (changing it requires reinstall-level work), so if the Pod CIDR pool is exhausted, node scale-out is blocked. Multiply the per-node Pod CIDR slice (`clusterPoolIPv4MaskSize`, typically /25 to /26) by the target node count plus growth to **allocate a generous Pod CIDR from the start**. With the Gateway, the Pod CIDR is not exposed to on-premises, so allocating it large does not conflict with internal IPAM (as long as the three non-overlap rules are followed).

## Multi-Environment (dev/stg/prd) Address Planning

In a structure with separate accounts per environment plus one VPC each, the following principles hold.

- **Node CIDR**: Assign separate on-premises ranges per environment (this becomes the unit of routing and firewall applications)
- **Pod CIDR**: With the Gateway, reuse across environments is technically possible, but distinct values per environment are recommended for incident analysis and audit log readability (e.g., dev `10.85.0.0/16`, stg `10.86.0.0/16`, prd `10.87.0.0/16`)
- **VPC CIDR**: No overlap between environments (in case they are later interconnected via TGW)
- The Gateway is one set per cluster, so 3 environments = 6 Gateway EC2 instances (2 per environment) as a fixed cost to include in the plan

## Summary of Recommendations

- Node CIDR bidirectional routing is non-negotiable — secure and request the on-premises range first.
- Pin the control plane ENI range with two dedicated /28 subnets so firewall applications are done at subnet CIDR granularity.
- Size the VPC at /25 to /24 per environment, attaching the consumption table above as supporting evidence when persuading the network team.
- Allocate the Pod CIDR generously from the start, accounting for the immutability constraint of Cilium's `clusterPoolIPv4PodCIDRList`.
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
