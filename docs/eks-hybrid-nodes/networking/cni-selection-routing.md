---
title: CNI Configuration and Pod CIDR Routing
description: "CNI selection criteria and core Cilium configuration for EKS Hybrid Nodes — hybrid-node-only affinity, cluster-pool IPAM, choosing a Pod CIDR routing method (BGP, static, Gateway), and the Cilium BGP Control Plane configuration procedure."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 18
tags:
  - eks
  - hybrid-node
  - cilium
  - networking
  - bgp
  - scope:impl
keywords:
  - bgpControlPlane
  - CiliumBGPClusterConfig
  - clusterPoolIPv4PodCIDRList
sidebar_label: CNI & Pod CIDR Routing
category: hybrid-multicloud
---

## Overview

Hybrid nodes remain in the `NotReady` state until a CNI is running, and the Amazon VPC CNI is incompatible with hybrid nodes. Selecting a CNI and deciding on a Pod CIDR routing method are therefore prerequisites for the cluster to serve workloads. This document covers CNI selection criteria, the core Cilium installation settings (affinity and IPAM), and the configuration procedures for BGP and static routing — two of the three Pod CIDR routing methods. The third method, the Hybrid Nodes Gateway, is covered in a [separate chapter](./hybrid-nodes-gateway.md).

## CNI Selection Criteria

> "Cilium is the AWS-supported Container Networking Interface (CNI) for Amazon EKS Hybrid Nodes. You must install a CNI for hybrid nodes to become ready to serve workloads. Hybrid nodes appear with status `Not Ready` until a CNI is running."
> — [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html)

**Table 1. Hybrid node support and characteristics by CNI**

| CNI | Hybrid node support | Notes |
|-----|--------------------|-------|
| Amazon VPC CNI | **Incompatible** | Configured by default with anti-affinity for the `eks.amazonaws.com/compute-type: hybrid` label, so it is never scheduled on hybrid nodes |
| Cilium | **AWS-supported CNI** | Lifecycle-managed with Helm using the EKS distribution (`public.ecr.aws/eks`). Note that Cilium running on cloud nodes is not covered by AWS support |
| Calico | Community path | The Calico guidance in the official User Guide has been moved to the [EKS Hybrid Examples repository](https://github.com/aws-samples/eks-hybrid-examples) |

Two constraints matter for this decision.

- **Gateway dependency**: The Hybrid Nodes Gateway is exclusive to Cilium's VTEP feature. Choosing Calico excludes the Gateway option, limiting Pod CIDR routing to BGP or static routing ([Architecture Decision Guide](../overview-architecture/architecture-decision-guide.md)).
- **Mixed-mode placement isolation**: Cilium must be placed exclusively on hybrid nodes and the VPC CNI exclusively on cloud nodes. The VPC CNI's anti-affinity comes built in, but on the Cilium side you must declare hybrid-label affinity on both the agent and the operator at install time to prevent it from encroaching on cloud nodes. The official Hybrid Nodes values set `affinity` (agent) and `operator.affinity` separately.

## Core Cilium Installation Settings

In the Cilium Helm values, the two settings specific to hybrid environments are affinity and IPAM.

```yaml
# cilium-values.yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: eks.amazonaws.com/compute-type
              operator: In
              values:
                - hybrid            # Schedule only on hybrid nodes
ipam:
  mode: cluster-pool
  operator:
    clusterPoolIPv4MaskSize: 26      # Per-node Pod IP slice (/26 = 64 addresses, 2 reserved)
    clusterPoolIPv4PodCIDRList:
      - 10.86.0.0/16                 # Must match RemotePodNetwork
operator:
  affinity:                          # Confine the operator to hybrid nodes too (set separately from the agent affinity)
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: eks.amazonaws.com/compute-type
                operator: In
                values:
                  - hybrid
  unmanagedPodWatcher:
    restart: false                   # Prevent restarts of cloud-node Pods (managed by the VPC CNI)
```

```bash
helm install cilium oci://public.ecr.aws/eks/cilium/cilium \
  --version CILIUM_VERSION \
  --namespace kube-system \
  --values cilium-values.yaml
```

- `clusterPoolIPv4PodCIDRList` must match the `RemotePodNetwork` specified at cluster creation. During operation you cannot change existing CIDR elements, and `clusterPoolIPv4MaskSize` cannot be changed either. However, if the pool is exhausted you can expand it by **appending a new CIDR element** to the list (existing elements must not be modified). Any CIDR you add must also be reflected in the cluster's `RemotePodNetwork` and in on-premises routing, so allocating generously from the start keeps the operational burden lower ([Proactive Pod CIDR Allocation](./cidr-network-design.md#proactive-pod-cidr-allocation), [Cilium Expanding the cluster pool](https://docs.cilium.io/en/stable/network/concepts/ipam/cluster-pool/#expanding-the-cluster-pool)).
- `clusterPoolIPv4MaskSize` determines the per-node Pod slice size. The figures shown are **total address counts** (/26 = 64, /25 = 128); Cilium reserves 2 addresses per CIDR block for the network and broadcast addresses, so the actually allocatable Pod IPs are fewer (/26 = 62, /25 = 126). Confirm the reservation behavior of your deployed Cilium version, then align it with the kubelet `maxPods` setting.
- In mixed-mode clusters, `unmanagedPodWatcher.restart: false` is a safeguard that keeps the Cilium operator from restarting cloud-node Pods under VPC CNI management.

## Choosing a Pod CIDR Routing Method

In environments that require Pod-level inbound traffic ([feature table](../overview-architecture/hybrid-nodes-fundamentals.md#node-cidr-required-pod-cidr-optional-principle)), there are three ways to make the Pod CIDR reachable.

**Table 2. Suitable environment, requirements, and characteristics of the three Pod CIDR routing methods**

| Method | Suitable environment | Requirements | Characteristics |
|--------|---------------------|--------------|-----------------|
| BGP dynamic routing (recommended) | Medium-to-large environments with frequent node changes | BGP-capable router, ASN/peering coordination | Automatically advertises each node's Pod CIDR slice — no router changes needed when scaling out |
| Static routing | Small environments with a fixed node count, or equipment without BGP support | Manually register per-node routes on the router | Router routes must be updated on every node addition or replacement — operational burden accumulates |
| Hybrid Nodes Gateway | Environments where Pod CIDR routing coordination is impractical due to organizational separation or IPAM exhaustion | Cilium only, 2 gateway EC2 instances | Removes Pod CIDR underlay routing coordination (Node CIDR routing and the gateway's VXLAN/firewall setup are still required) — [setup procedure](./hybrid-nodes-gateway.md) |

Per-node Pod CIDR slices are assigned dynamically by the CNI, so static routing requires identifying slice assignments in advance, registering routes per node, and re-verifying them when nodes are replaced. This management burden is what confines static routing to small environments.

## Cilium BGP Control Plane Configuration

Cilium's BGP capability (BGP Control Plane) advertises Pod CIDRs and Service addresses to the on-premises network. Configuration proceeds in three steps: ① enable via Helm → ② apply the three CRDs → ③ verify peering.

### 1. Enable the BGP Control Plane

```bash
helm upgrade cilium oci://public.ecr.aws/eks/cilium/cilium \
  --namespace kube-system \
  --reuse-values \
  --set operator.rollOutPods=true \
  --set bgpControlPlane.enabled=true
```

Adding BGP to an existing deployment requires restarting the Cilium operator; `operator.rollOutPods=true` performs this as part of the Helm upgrade.

:::warning
The command above is copied verbatim from the official feature-enable example and does not specify `--version`. Combined with `--reuse-values`, it can unexpectedly change the Cilium version depending on your local Helm chart cache. For feature-only changes such as enabling BGP, pin the currently installed supported chart version with `--version`. When you intend to change the version, first run the [official upgrade procedure](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html#hybrid-nodes-cilium-upgrade), including the preflight check and the OS/kernel and version compatibility verification.
:::

### 2. Configure the Three BGP CRDs

**Table 3. Role and key fields of the three Cilium BGP Control Plane CRDs**

| CRD | Role | Key fields |
|-----|------|-----------|
| `CiliumBGPClusterConfig` | Defines BGP instances and peers for a node group | `localASN` (node side), `peerASN` / `peerAddress` (on-premises router) |
| `CiliumBGPPeerConfig` | Peer session parameters | `holdTimeSeconds` (default 90s), `keepAliveTimeSeconds` (default 30s), graceful restart (default 120s) — must match the router-side settings |
| `CiliumBGPAdvertisement` | Declares what to advertise | `advertisementType: PodCIDR` (Pod ranges) or `Service` (LB addresses) |

```yaml
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPClusterConfig
metadata:
  name: cilium-bgp
spec:
  nodeSelector:
    matchExpressions:
      - key: eks.amazonaws.com/compute-type
        operator: In
        values:
          - hybrid
  bgpInstances:
    - name: "rack0"
      localASN: NODES_ASN
      peers:
        - name: "onprem-router"
          peerASN: ONPREM_ROUTER_ASN
          peerAddress: ONPREM_ROUTER_IP
          peerConfigRef:
            name: "cilium-peer"
---
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPPeerConfig
metadata:
  name: cilium-peer                  # Must match peerConfigRef.name in the ClusterConfig
spec:
  timers:
    holdTimeSeconds: 90
    keepAliveTimeSeconds: 30
  gracefulRestart:
    enabled: true
    restartTimeSeconds: 120
  families:
    - afi: ipv4
      safi: unicast
      advertisements:
        matchLabels:
          advertise: "bgp"           # Must match labels.advertise on the Advertisement
---
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPAdvertisement
metadata:
  name: bgp-advertisement-pods
  labels:
    advertise: bgp
spec:
  advertisements:
    - advertisementType: "PodCIDR"
```

The manifest above contains three resources; the official procedure writes each to a separate file and applies them with `kubectl apply` in the order `CiliumBGPClusterConfig` → `CiliumBGPPeerConfig` → `CiliumBGPAdvertisement`. Replace `NODES_ASN`, `ONPREM_ROUTER_ASN`, and `ONPREM_ROUTER_IP` with the actual values coordinated with your network team. The link is made by matching `peerConfigRef.name` (`cilium-peer`) to the `CiliumBGPPeerConfig` name, and the families `matchLabels.advertise` (`bgp`) to the `labels.advertise` on the `CiliumBGPAdvertisement`. After applying, confirm the session is established with the three verification steps below.

The Cilium agent on each hybrid node peers individually with the on-premises router and advertises only the Pod CIDR slice it owns. Configuring the on-premises router as a BGP Route Reflector lets the router learn Pod CIDRs dynamically without participating in the data path.

### 3. Verify Peering

```bash
# Confirm the Session State is established
cilium bgp peers

# Check the routes advertised per node (one slice per node)
cilium bgp routes
```

If the session does not establish, check the router-side consistency of ASN, peer IP, and timer values, along with whether the firewall allows TCP 179. Include Cilium's own ports (BGP TCP 179, VXLAN UDP 8472, health TCP 4240) in the Zone E rules of the [firewall pre-registration request](./firewall-connectivity.md).

## Summary of Recommendations

- Design new deployments around the EKS distribution of Cilium. Calico is a community path and excludes the Gateway option.
- In mixed mode, always declare hybrid-label affinity in the Cilium values to keep it off cloud nodes.
- Match `clusterPoolIPv4PodCIDRList` to `RemotePodNetwork`, and allocate generously from the start given its immutability constraint.
- For Pod CIDR routing, evaluate BGP first; use the Gateway when routing coordination is impractical, and reserve static routing for small, fixed environments.
- Coordinate BGP timers and ASNs with the network team in advance, and include TCP 179 in the firewall request.

## References

### Official Documentation
- [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html) — Cilium install/upgrade/delete; VPC CNI incompatibility stated
- [Configure Cilium BGP for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cilium-bgp.html) — Enabling the BGP Control Plane and CRD configuration
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — Fully routed constraint and Pod CIDR routing options

### Technical Blogs
- [Deep dive into cluster networking for Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deep-dive-into-cluster-networking-for-amazon-eks-hybrid-nodes/) — BGP Route Reflector and static routing configuration examples
- [A deep dive into Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — Background on CNI affinity and cluster-pool IPAM configuration

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How It Works](../overview-architecture/hybrid-nodes-fundamentals.md) — Table of features requiring Pod CIDR routing
- [Architecture Decision Guide](../overview-architecture/architecture-decision-guide.md) — Full routing vs Gateway decision flow
- [CIDR Design and Range Minimization](./cidr-network-design.md) — Proactive Pod CIDR allocation and slice sizing
- [Hybrid Nodes Gateway Setup and Operations](./hybrid-nodes-gateway.md) — The third option without routing coordination
