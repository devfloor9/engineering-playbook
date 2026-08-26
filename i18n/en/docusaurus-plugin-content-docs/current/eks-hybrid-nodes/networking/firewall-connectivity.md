---
title: Firewall/DNS Pre-Registration and TGW Topology
description: "Covers a 5-zone pre-registration rule table to submit to firewall and network teams when adopting EKS Hybrid Nodes, handling environments without FQDN wildcard support, Transit Gateway topology, and on-premises LB path design."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 10
tags:
  - eks
  - hybrid-node
  - networking
  - firewall
  - security
  - scope:impl
keywords:
  - Transit Gateway
  - Route 53 Resolver
  - FQDN
  - "602401143452"
sidebar_label: Firewall & TGW Topology
category: hybrid-multicloud
---

## Overview

In organizations where firewall and network operations are handled by separate teams, registration requests must be submitted before deployment begins, and any missing item translates directly into deployment delays. This document covers an application-ready rule table that organizes firewall registration points into 5 zones, handling environments without FQDN wildcard support, and Transit Gateway (TGW) topology together with on-premises LB path design.

## 5-Zone Firewall Registration Structure

| Zone | Registration point | Owning team (typical) |
|----|-----------|------------------|
| A | On-premises firewall (ongoing operations rules) | Network/Security team |
| B | AWS security groups | Cloud platform team |
| C | On-premises → AWS service endpoints (outbound domains) | Network/Security team |
| D | Control plane ENI ranges and DNS | Joint agreement |
| E | Recommended additional rules (CNI, ICMP) | Network/Security team |

### Zone A: On-Premises Firewall Ongoing Operations Rules

The ongoing operations requirements from the official documentation, organized in application form, are as follows.

| Direction | Protocol/Port | Source | Destination | Reason |
|------|--------------|--------|--------|------|
| Outbound | TCP 443 | Node CIDR | EKS control plane ENI subnet CIDRs | kubelet → Kubernetes API server |
| Outbound | TCP 443 | Pod CIDR | EKS control plane ENI subnet CIDRs | Pod → Kubernetes API server |
| Outbound | TCP 443 | Node CIDR | SSM service endpoints | SSM credential refresh + 5-minute heartbeat (when using SSM) |
| Outbound | TCP 443 | Node CIDR | IAM Roles Anywhere endpoints | Credential refresh (when using IAM RA) |
| Outbound | TCP 443 | Pod CIDR | STS regional endpoint | Only for Pods using IRSA |
| Outbound | TCP 443 | Node CIDR | EKS Auth endpoint | When using EKS Pod Identity |
| **Inbound** | TCP 10250 | EKS control plane ENI subnet CIDRs | Node CIDR | **Kubernetes API server → kubelet** (`kubectl logs`/`exec`) |
| **Inbound** | TCP webhook ports | EKS control plane ENI subnet CIDRs | Pod CIDR | API server → webhooks (when running webhooks on hybrid nodes) |
| In/Out | TCP/UDP 53 | Pod CIDR | Pod CIDR (+ VPC CIDR if CoreDNS runs in the cloud) | Pod → CoreDNS |
| In/Out | App ports | Pod CIDR | Pod CIDR | Pod-to-Pod communication |

:::warning Watch the direction
TCP 10250 is **inbound from AWS (control plane) into on-premises**. A common mistake is to request it as outbound "because it is a Kubernetes port"; in that case node registration succeeds but `kubectl logs`/`exec` fails with a timeout. Also, TCP 443 is outbound from on-premises and is not "bidirectional". Port 6443 does not exist in EKS and should not be requested.
:::

Webhook ports vary by add-on (e.g., 443, 8443, 9443). Check the webhook Service definitions of the add-ons you plan to deploy to finalize the list. When using the Hybrid Nodes Gateway, the webhook inbound rules and the on-premises rules related to the Pod CIDR become unnecessary; instead, a **UDP 8472 rule (gateway node IPs ↔ hybrid node IPs, bidirectional)** is added.

Response-packet rules are omitted under the assumption that the firewall is stateful (connection-tracking based). If a stateless ACL device is on the path, separate reverse-direction ephemeral port rules are required.

### Zone B: AWS Security Groups

EKS **automatically creates the inbound rules** for clusters with remote networks configured. Outbound relies on the SG default (allow all), so organizations that restrict outbound must register the rules below explicitly.

| Direction | Protocol/Port | Target | Reason | Created by |
|------|--------------|------|------|-----------|
| Inbound | TCP 443 | Node CIDR | kubelet → API server | Auto-created by EKS |
| Inbound | TCP 443 | Pod CIDR | Pod → API server (when CNI NAT is not used) | Auto-created by EKS |
| Outbound | TCP 10250 | Node CIDR | API server → kubelet | **Manual registration** (if outbound is restricted) |
| Outbound | TCP webhook ports | Pod CIDR | API server → webhooks | **Manual registration** (if outbound is restricted) |
| In+Out | UDP 8472 | Gateway nodes ↔ hybrid nodes | VXLAN (when using the Gateway, on the gateway SG) | Manual registration |

Two operational cautions. (1) The default SG inbound rule quota is 60; when approaching the quota, auto-created rules may fail to apply and manual supplementation is required. (2) When a remote network is removed from the cluster, EKS does not automatically delete the corresponding SG rules — cleanup is the operator's responsibility.

### Zone C: AWS Service Endpoints (Outbound Domains)

Domains required **during installation and upgrades** (bake them into the OS image at build time or allow at runtime per host).

| Component | URL | Port |
|----------|-----|------|
| EKS node artifacts (S3) | `hybrid-assets.eks.amazonaws.com` | TCP 443 |
| EKS service | `eks.<region>.amazonaws.com` | TCP 443 |
| ECR API | `api.ecr.<region>.amazonaws.com` | TCP 443 |
| EKS add-on image registry | Varies by region — see [Handling missing wildcard support](#handling-environments-without-fqdn-wildcard-support) below | TCP 443 |
| SSM binaries | `amazon-ssm-<region>.s3.<region>.amazonaws.com` (when using SSM) | TCP 443 |
| SSM service | `ssm.<region>.amazonaws.com` (when using SSM) | TCP 443 |
| IAM Roles Anywhere binaries | `rolesanywhere.amazonaws.com` (when using IAM RA) | TCP 443 |
| IAM Roles Anywhere service | `rolesanywhere.<region>.amazonaws.com` (when using IAM RA) | TCP 443 |
| OS package repositories | Varies by OS and region (yum/apt/snap repositories) | TCP 443 |

**For ongoing operations**, access to the credential endpoints in the Zone A table (ssm/rolesanywhere/sts/eks-auth) and `eks.<region>` must be maintained. When using the Cilium and Gateway charts, `public.ecr.aws` (Amazon ECR Public) must also be allowed.

### Zone D: Control Plane ENI Ranges and DNS

**ENI IPs are not fixed.** During cluster upgrades and similar changes, existing ENIs are deleted and recreated, so firewall registration at the individual IP level will inevitably break. Following the [dedicated subnet strategy in the CIDR design document](./cidr-network-design.md#dedicated-control-plane-eni-subnet-strategy), pass two dedicated /28 subnets to the cluster and register **the two subnet CIDRs** in the firewall.

**DNS**: If on-premises nodes need to resolve AWS internal domains (private endpoints, etc.), place a Route 53 Resolver inbound endpoint in the VPC and configure the on-premises DNS to forward those zones. Conversely, if cloud Pods need to resolve on-premises domains (internal registries, etc.), configure an outbound endpoint plus a forward rule.

```bash
# inbound endpoint (on-prem → AWS resolution)
aws route53resolver create-resolver-endpoint \
  --creator-request-id hybrid-inbound-001 \
  --name hybrid-inbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction INBOUND \
  --ip-addresses SubnetId=subnet-xxxxx SubnetId=subnet-yyyyy

# outbound endpoint + internal domain forwarding (AWS → on-prem resolution)
aws route53resolver create-resolver-rule \
  --creator-request-id hybrid-fwd-001 \
  --name on-prem-dns-rule \
  --rule-type FORWARD \
  --domain-name company.local \
  --target-ips Ip=192.168.1.53,Port=53 \
  --resolver-endpoint-id rslvr-out-xxxxx
```

Resolver endpoint IPs are also firewall targets (TCP/UDP 53), so include them in the Zone A application.

### Zone E: Recommended Additional Rules

| Item | Rule | Reason |
|------|-----|------|
| CNI-specific ports | Cilium: node-to-node UDP 8472 (VXLAN), TCP 4240 (health), ICMP echo / Calico: TCP 179 (BGP), etc. | The official documentation requires separately allowing CNI-specific ports — finalize based on each CNI's documentation |
| PMTUD | Allow ICMP Type 3 Code 4 (Fragmentation Needed) | In environments where overlay encapsulation reduces the effective MTU, large responses are silently dropped if path MTU discovery fails |
| Monitoring | Scraping paths of the observability stack (e.g., AMP/Prometheus → Pod CIDR) | Finalize per observability target and tool |

## Handling Environments Without FQDN Wildcard Support

In environments where the FQDN firewall does not support wildcards (`*.amazonaws.com`), domains must be enumerated individually. Concrete values for the us-west-2 region are as follows.

| Purpose | Domain (us-west-2) |
|------|------------------------|
| EKS node artifacts | `hybrid-assets.eks.amazonaws.com` |
| EKS API | `eks.us-west-2.amazonaws.com` |
| ECR API | `api.ecr.us-west-2.amazonaws.com` |
| **EKS add-on image registry** | `602401143452.dkr.ecr.us-west-2.amazonaws.com` |
| ECR Public (Cilium/Gateway charts) | `public.ecr.aws` |
| SSM | `ssm.us-west-2.amazonaws.com`, `amazon-ssm-us-west-2.s3.us-west-2.amazonaws.com` |
| IAM Roles Anywhere | `rolesanywhere.us-west-2.amazonaws.com`, `rolesanywhere.amazonaws.com` |
| STS (for IRSA) | `sts.us-west-2.amazonaws.com` |

The add-on registry account ID `602401143452` is common across major regions, but **some regions use a different account** (e.g., ap-southeast-5 uses `151610086707`), so verify your target region in the [official registry list](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html). ECR pulls may fetch image layers from S3, so in environments with strict FQDN control, mirroring through a private registry (Harbor) or going through ECR PrivateLink (VPC endpoints) is a practical alternative. For Harbor configuration, see [Harbor Registry Integration](../storage-registry/harbor-registry.md).

## Registration Request Checklist per Environment

Fill in the values below for each dev/stg/prd environment to prepare the application.

- [ ] Node CIDR (per-environment on-premises range)
- [ ] Pod CIDR (on-premises registration required only when the Gateway is not used)
- [ ] EKS control plane ENI dedicated subnet CIDRs ×2
- [ ] Zone A ongoing rule table (direction-verified version)
- [ ] Zone C domain list (select SSM or IAM RA rows depending on the authentication method)
- [ ] When using the Gateway: UDP 8472 rule (gateway node IPs or gateway subnet CIDR ↔ Node CIDR)
- [ ] Route 53 Resolver endpoint IPs (when integrating DNS)
- [ ] Webhook port list (when running webhooks on hybrid nodes)

## TGW Topology

### TGW-Based Hybrid Connectivity Structure

The official networking guide covers TGW alongside VGW as a standard connectivity option. Three items must be checked in a TGW topology.

1. **VPC route tables**: Routes destined for the Node CIDR (and the Pod CIDR when using full routing) must point to the TGW attachment.
2. **TGW route tables**: The Node/Pod CIDRs must be propagated or statically registered toward the on-premises-facing attachment (DX Gateway or VPN), and in the reverse direction the VPC CIDR must be advertised to the on-premises side.
3. **Multi-account**: In structures with per-environment account separation, share the TGW via Resource Access Manager (RAM) and explicitly design the TGW route table isolation policy (whether routing between environments is blocked).

### Interaction Between the Gateway and TGW

The Hybrid Nodes Gateway works without issues in a TGW environment and in fact reduces the items to manage on the TGW side.

- **The Pod CIDR is excluded from TGW routes.** The Gateway manages the "Pod CIDR → leader ENI" routes in the VPC route tables, so the TGW and on-premises routers do not need to know about the Pod CIDR.
- **VXLAN traffic traverses the TGW as UDP 8472 between node IPs.** The TGW only needs Node CIDR ↔ VPC CIDR routes.
- The Gateway's `routeTableIDs` must enumerate **the route tables of all subnets that communicate with hybrid Pods**, including the TGW attachment subnets.

### On-Premises LB → Cloud Pod (DR) Path

A configuration where an on-premises load balancer sends traffic to DR Pods running in AWS is possible. The key is the IP characteristics of cloud Pods.

- Pods on cloud nodes are **directly assigned IPs from the VPC range** by the VPC CNI, so as long as routing from on-premises to the VPC CIDR (via TGW) is in place, Pod IPs are directly reachable.
- However, Pod IPs change on rescheduling, so statically registering Pod IPs as LB targets is fragile. A layered configuration is recommended: **place an internal NLB/ALB on the AWS side and have the on-premises LB target the NLB/ALB's stable endpoint**.
- The security group must allow inbound from the on-premises LB range (or the Node CIDR) on the relevant ports, and the health check path and port must be allowed the same way.

The reverse direction (AWS LB → on-premises hybrid Pod IP targets) requires Pod CIDR routing or the Gateway as a prerequisite (see the [feature table](../overview-architecture/hybrid-nodes-fundamentals.md#node-cidr-required-pod-cidr-optional-principle)).

## Summary of Recommendations

- Structure firewall applications into 5 zones (on-prem rules, SG, endpoints, ENI ranges, recommended rules) and submit them separately per owning team.
- Always re-verify the direction of TCP 10250 (AWS → on-prem inbound) in the application — it is the most frequent mistake.
- Register control plane ENIs as two dedicated /28 subnet CIDRs, not as individual IPs.
- In environments without FQDN wildcard support, verify the per-region add-on registry account ID in the official list and register domains individually; consider Harbor mirroring or ECR PrivateLink in the long term.
- In multi-account TGW structures, finalize RAM sharing and the route table isolation policy at the design stage.
- For on-prem LB → cloud workload paths, route through an internal NLB/ALB instead of targeting Pod IPs directly.

## References

### Official Documentation
- [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html) — Firewall/SG rules and endpoint list
- [View Amazon container image registries for Amazon EKS add-ons](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html) — Per-region add-on registry account IDs
- [Configure webhooks for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-webhooks.html) — Webhook ports and placement strategy

### Related Documents (Internal)
- [CIDR Design and Range Minimization](./cidr-network-design.md) — Dedicated ENI subnet strategy and sizing of ranges to request
- [Hybrid Nodes Gateway Deployment and Operations](./hybrid-nodes-gateway.md) — Gateway configuration requiring the UDP 8472 rule
- [Node Authentication Methods](../security-authn/node-authentication.md) — Firewall endpoint differences per authentication method
- [Harbor Registry Integration](../storage-registry/harbor-registry.md) — Private registry alternative for FQDN-restricted environments
