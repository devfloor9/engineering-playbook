---
title: EKS Hybrid Nodes Concepts and How They Work
description: "Covers Amazon EKS Hybrid Nodes from definition, use cases, and pricing model to the nodeadm registration flow, RemoteNodeNetwork/RemotePodNetwork networking structure, traffic flows, and key technical characteristics."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 52
tags:
  - eks
  - hybrid-node
  - kubernetes
  - cilium
  - networking
  - scope:design
keywords:
  - RemoteNodeNetwork
  - RemotePodNetwork
  - nodeadm
  - CGNAT
  - VXLAN
sidebar_label: Concepts and How They Work
category: hybrid-multicloud
---

## Overview

This document is the conceptual chapter of the EKS Hybrid Nodes Best Practices guide. It explains, in order, what Hybrid Nodes are (definition, use cases, pricing), how they work (architecture, node registration, basic networking structure, traffic flows), and what technical characteristics they have (routing requirement principles, NAT limitations, Hybrid Nodes Gateway, CGNAT support, mixed mode). Detailed answers to individual technical topics are covered in the guide's respective chapters — [Architecture Decision](./architecture-decision-guide.md), [CIDR Design](../networking/cidr-network-design.md), [Gateway Deployment and Operations](../networking/hybrid-nodes-gateway.md), [Firewall Pre-registration](../networking/firewall-connectivity.md), and [Node Authentication](../security-authn/node-authentication.md).

:::info Verification Basis
The key figures and requirements in this document were written after directly verifying the EKS User Guide, CloudFormation Template Reference, and AWS Containers Blog sources (as of 2026-08-24).
:::

## What Are EKS Hybrid Nodes

### Definition

EKS Hybrid Nodes is a capability that connects physical servers or virtual machines in on-premises and edge infrastructure to an Amazon EKS cluster as worker nodes. It reached general availability (GA) in December 2024. The control plane (API server, etcd) is fully managed by AWS in the Region, while the data plane (worker nodes) runs on customer infrastructure. A mixed mode configuration where cloud nodes (EC2) and hybrid nodes coexist in a single cluster is supported, and both are managed through the same EKS API, cluster policies, and add-on system.

### Use Cases

- **Leveraging existing GPU assets**: Combine already-purchased on-premises GPU servers (such as DGX) with cloud GPUs and Amazon Bedrock to build a cost-efficient inference layer
- **Data sovereignty and regulatory compliance**: Keep data on-premises while standardizing the Kubernetes operating model on EKS
- **Gradual migration**: Migrate on-premises workloads to the cloud incrementally within a single cluster
- **Edge computing**: Run latency-sensitive workloads close to users while managing them centrally

### Deployment Option Comparison

**Table 1. Comparison of on-premises Kubernetes deployment options**

| Item | EKS Hybrid Nodes | AWS Outposts (local clusters) | Amazon EKS Anywhere | Self-managed K8s |
|------|-----------------|--------------|---------------------|----------------|
| Control plane location | AWS Region (managed) | Outposts rack (managed) | On-premises (customer-operated) | On-premises (customer-operated) |
| Hardware | Customer-owned equipment | AWS-provided racks/servers | Customer-owned equipment | Customer-owned equipment |
| Network requirements | Persistent DX/VPN connectivity | AWS connectivity required | Disconnected operation possible | No constraints |
| Control plane operational burden | None | None | Yes (upgrades, backups) | Full |
| Best fit | Existing equipment + managed control plane | Extending AWS infrastructure on-premises | Air-gapped or disconnected environments | Full self-governance required |

:::note Outposts local clusters vs extended clusters
The "AWS Outposts" column above reflects **local clusters**, where the control plane also runs on the Outposts rack. EKS on Outposts offers two deployment options. **Extended clusters** run the control plane in an **AWS Region** and place only the nodes on the Outpost, conserving Outpost capacity, but a loss of Region connectivity can affect application availability. **Local clusters** run both the control plane and nodes on the Outpost, so cluster operations continue through Region disconnects, which suits data residency requirements or a need for disconnect tolerance. Local clusters are supported only on Outposts racks, and in both options the control plane is fully managed by AWS.
:::

EKS Hybrid Nodes fits environments where "the equipment already exists and the goal is to eliminate control plane operational burden." Because the control plane resides in an AWS Region, a stable private connection between on-premises and the Region is a prerequisite.

### Two Definitions of Air-Gap Environments

In highly regulated environments such as finance and the public sector, the term "closed network" often refers to two environments of very different natures. Whether EKS Hybrid Nodes is supported depends entirely on this distinction, so determine which one applies to your environment before starting the design.

**Table 2. The two air-gap environments and their support status**

| Aspect | Disconnected Air-Gap (physically isolated network) | Private Air-gapped VPC (private closed network) |
|--------|---------------------------------------------------|------------------------------------------------|
| Communication with the AWS Region | Fully blocked or intermittently disrupted (DDIL) | Always-on private communication over DX/private VPN |
| Public internet | Blocked | Blocked (no IGW/NAT) |
| EKS Hybrid Nodes | **Not supported** | **Supported** — via interface VPC endpoints (PrivateLink) |
| Correct architecture | Amazon EKS Anywhere | EKS Hybrid Nodes + Private API endpoint |

:::danger Disconnected environments are not a Hybrid Nodes target
Because the control plane runs in an AWS Region, hybrid nodes presuppose an **always-on, reliable connection** to the Region. In DDIL (Denied, Disrupted, Intermittent, Limited) environments where communication is fully blocked or drops intermittently, node credential renewal, scheduling, and `kubectl` operations all become impossible. The correct answer for such environments is **Amazon EKS Anywhere**, which runs the control plane on-premises as well — do not attempt a workaround with Hybrid Nodes.
:::

By contrast, a **private closed network where only the public internet is blocked** is fully supported. When designing this environment, however, you must secure four distinct communication paths over private routing; collapsing them into one can cause node bootstrap to fail.

- **Kubernetes API access**: Create the EKS cluster API endpoint in Private mode so the kubelet and `kubectl` can reach the control plane. This is privatization at the Kubernetes API level and is separate from the AWS service API access (PrivateLink) below.
- **AWS service API access**: Open the AWS services the node calls for credentials and management — SSM, STS, IAM Roles Anywhere, and others — as interface VPC endpoints (PrivateLink) inside the VPC.
- **Container registry and image layers**: Reach ECR through interface endpoints (`ecr.api` and `ecr.dkr`), and reach **Amazon S3 — where the actual image layers are stored — through a gateway endpoint (or an S3 interface endpoint)**. Opening only the ECR endpoints and omitting the S3 path causes image pulls to fail at the layer-download stage.
- **Node bootstrap artifacts**: The `nodeadm` binary, OS package repositories, and hybrid nodes dependencies are fetched from public locations by default. In a closed network, mirror these into an internal mirror/artifact store, or pre-build an OS image that includes `nodeadm` to remove the runtime external dependency.

Once all four paths are in place, communication completes over the private path of DX/VPN → VPC → PrivateLink. Detailed per-endpoint design is covered in [Private Air-gapped VPC Endpoint Design](../networking/private-vpc-endpoints).

### Shared Responsibility Model

Hybrid nodes carry a wider customer responsibility scope than cloud nodes. Use the following boundaries when finalizing the operating organization and role division.

**Table 3. AWS and customer responsibilities for hybrid nodes by area**

| Area | AWS responsibility | Customer responsibility |
|------|--------------------|-------------------------|
| Control plane | API server and etcd operations, availability (SLA), control plane version upgrades and patches | Deciding to initiate cluster version upgrades |
| Data plane (hybrid nodes) | Providing `nodeadm` and node artifacts | Physical servers and virtualization infrastructure, OS installation and patching, kubelet/containerd upgrades (`nodeadm upgrade`), node drains |
| Networking | Control plane ENIs, VPC routing infrastructure | DX/VPN connectivity, on-premises routing and firewalls, CNI (Cilium) installation and lifecycle |
| Security and authentication | The IAM, SSM, and IAM Roles Anywhere services | Operating the credential infrastructure (activations, private PKI), certificate renewal and revocation, node IAM role least privilege |
| Observability | Control plane logs and metrics, Cluster Insights | Node and workload metric collection, cross-network path monitoring |

For cloud nodes (managed node groups), AWS **builds patched versions of the EKS optimized AMI** and provides node update and replacement orchestration (draining and rolling replacement), but **you initiate the deployment** of those patched AMIs to the node group (the shared responsibility stated in the official documentation). For hybrid nodes, even that AMI-build service is absent, so OS installation and patching and node replacement via `nodeadm upgrade` fall entirely on the customer — that is the practical difference. Upgrade procedures and the runbook are covered in [Upgrades and Lifecycle Management](../operations-cost/upgrade-lifecycle).

### Pricing Model

EKS Hybrid Nodes applies tiered billing based on vCPU-hours of hybrid nodes. The unit price decreases as monthly cumulative usage increases. Billing starts when a node joins the cluster and stops when it is removed, and the tiers apply to the **aggregate monthly vCPU-hours in the same AWS Region within the account** (aggregated across accounts in the organization when AWS Organizations consolidated billing is used). The unit prices below are from the official pricing page (verified 2026-10-13); they can change by Region and over time, so confirm actual costs against the pricing page or an AWS quote.

**Table 4. Tiered unit prices by monthly cumulative vCPU-hour range**

| Monthly cumulative vCPU-hours (range) | Unit price ($/vCPU-hr) |
|-------------------|-----------------|
| First 576,000 | $0.020 |
| Next 576,000 (576,001 – 1,152,000) | $0.014 |
| Next 4,608,000 (1,152,001 – 5,760,000) | $0.010 |
| Next 5,760,000 (5,760,001 – 11,520,000) | $0.008 |
| Over 11,520,000 | $0.006 |

:::warning Machines over 32 vCPU require a separate quote
The official pricing page states that **if you intend to run hybrid nodes on machines larger than 32 vCPU per machine, you must contact your account team for additional pricing information.** The 224-vCPU example below is therefore only a **hypothetical estimate** that applies the public tier prices directly — not an actual bill — and such large-machine environments must obtain an applicable quote.
:::

For example, assuming the public tier prices apply directly, running one 224-vCPU server (DGX H200 class) continuously for 730 hours per month produces about 163,520 vCPU-hr (224 × 730). All of it falls in tier 1 ($0.020), so the estimate is about $3,270. Running 10 servers (1,635,200 vCPU-hr per month) applies $0.020 to the first 576,000, $0.014 to the next 576,000, and $0.010 to the remaining 483,200, for a total of about $24,416, or about $2,441.60 per node on average. This amount is an EKS management-fee estimate; hardware purchase, power, and colocation costs are separate. EKS cluster fees and cloud node (EC2) charges apply as usual. Cost optimization strategies leveraging the billing structure are covered in [Operations and Cost Optimization](../operations-cost/operations-cost-optimization.md).

### System Requirements

**Table 5. Hybrid node system requirements**

| Item | Requirement |
|------|----------|
| Operating system | Amazon Linux 2023 (AL2023, on-premises virtualized environments only — not covered by AWS Support Plans when run outside Amazon EC2), Ubuntu 20.04/22.04/24.04 LTS, RHEL 8/9, Bottlerocket v1.37.0+ (VMware vSphere variants only) |
| Architecture | x86_64 and ARM (ARM requires an ARMv8.2+Crypto processor); the Bottlerocket VMware variant is x86_64 only |
| Container runtime | containerd (installed and managed by nodeadm) |
| Network connectivity | AWS Direct Connect, Site-to-Site VPN, or self-managed VPN-based private connection |
| Bandwidth and latency | Minimum 100Mbps, round-trip time (RTT) of 200ms or less recommended (official guidance) |
| CNI | Cilium — the AWS-supported CNI (the VPC CNI is incompatible with hybrid nodes; Calico is a community-supported path) |

:::note OS support boundaries and the Bottlerocket bootstrap path
The operating systems in the table above are the ones the official documentation validates for hybrid nodes, which is distinct from "whether AWS supports the OS itself." **For Ubuntu and RHEL, AWS supports the hybrid nodes integration but not the operating system itself**, so OS provisioning and management are your responsibility. **AL2023 can only be used in on-premises virtualized environments** — installing it directly on physical (bare-metal) servers is not a supported configuration, so bare-metal GPU servers you own require Ubuntu/RHEL or a virtualization layer. **Bottlerocket is supported only in VMware vSphere environments** and does not use `nodeadm`: it already contains the hybrid nodes dependencies and automatically connects to the cluster at host startup, so its registration flow differs from the other operating systems.
:::

:::note Interpreting the Bandwidth Requirement
100Mbps/200ms is general guidance that accommodates most use cases, not a strict requirement. Actual bandwidth needs depend on node count, container image size, monitoring and logging configuration, and AWS service data access patterns. GPU inference environments that use large model images require validation with their own workloads before production adoption.
:::

## How It Works

### Architecture: A Single Cluster with the VPC as Hub

In the EKS Hybrid Nodes architecture, the VPC acts as the network hub. The EKS control plane attaches ENIs (Elastic Network Interfaces) to the subnets specified at cluster creation, and all traffic crossing the cloud boundary transits this VPC. On-premises and the VPC are connected via Direct Connect, Site-to-Site VPN, or a self-managed VPN, and the VPC-side attachment point is typically a VGW (Virtual Private Gateway) or TGW (Transit Gateway).

**Figure 1. Single-cluster architecture with the VPC as hub**

```mermaid
flowchart LR
    subgraph REGION["AWS Region"]
        subgraph VPC["VPC (Network Hub)"]
            ENI["EKS Control Plane ENI<br/>(dedicated subnets ×2 AZ)"]
            CN["Cloud Nodes (EC2)<br/>VPC CNI"]
        end
        CP["EKS Control Plane<br/>(AWS-managed)"]
    end
    subgraph ONPREM["On-premises"]
        HN["Hybrid Nodes<br/>Cilium/Calico CNI"]
        POD["Pods (overlay network)"]
    end
    CP === ENI
    VPC <-- "DX / Site-to-Site VPN<br/>(via VGW or TGW)" --> ONPREM
    HN --- POD
    CN -.->|"mixed mode"| HN
```

### Node Registration Flow: nodeadm

Hybrid nodes are registered with `nodeadm`, a CLI tool provided by AWS. The registration flow has three steps: ① install dependencies → ② configure IAM credentials → ③ join the cluster.

```bash
# 1. Download nodeadm (x86_64)
curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/amd64/nodeadm'
chmod +x nodeadm && sudo mv nodeadm /usr/local/bin/

# 2. Install Kubernetes version-specific dependencies (containerd, kubelet, SSM agent, etc.)
sudo nodeadm install 1.33 --credential-provider ssm
# When using IAM Roles Anywhere: --credential-provider iam-ra

# 3. Initialize the node based on NodeConfig
sudo nodeadm init --config-source file://nodeconfig.yaml
```

`NodeConfig` declaratively defines cluster information, credentials, and kubelet/containerd settings.

```yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: us-west-2
  hybrid:
    ssm:
      activationCode: "YOUR-ACTIVATION-CODE"
      activationId: "YOUR-ACTIVATION-ID"
  kubelet:
    config:
      shutdownGracePeriod: 30s
      maxPods: 110
    flags:
      - --node-labels=node-type=hybrid
```

The IAM credentials used by the node are issued via SSM hybrid activation or IAM Roles Anywhere, and the kubelet uses these credentials to authenticate to the EKS control plane. A comparison of the two methods and selection criteria are covered in [Node Authentication Methods](../security-authn/node-authentication.md). Registered hybrid nodes receive the `eks.amazonaws.com/compute-type: hybrid` label.

### Basic Networking Structure: RemoteNodeNetwork and RemotePodNetwork

Two remote CIDR ranges are provided at cluster creation.

**Table 6. Meaning and allocator of the RemoteNodeNetwork and RemotePodNetwork fields**

| Field | Meaning | Allocated by |
|------|------|----------|
| `RemoteNodeNetwork` | IP range of the hybrid node machines | On-premises network |
| `RemotePodNetwork` | IP range of Pods on hybrid nodes | CNI (overlay network) |

The EKS control plane uses these ranges to route traffic destined for them through the VPC to on-premises. The core constraint in the official documentation is as follows.

> "The main constraint is that the EKS control plane and all nodes, cloud or hybrid nodes, need to form a **fully routed** network. This means that all nodes must be able to reach each other at layer three, by IP address."
> — [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html)

The "fully routed" requirement applies at the **node level**. Commands such as `kubectl logs` and `kubectl exec` require the control plane to initiate direct connections to the node's kubelet (port 10250), so the VPC route table needs a route for the Node CIDR, and node IPs must also be routable from on-premises. In contrast, the same document explicitly designates Pod CIDR routing as optional, and this distinction is the principle that runs through the entire hybrid network design. Detailed decision criteria are covered in [Key Technical Characteristics](#node-cidr-required-pod-cidr-optional-principle).

:::tip Caution on Automatic Service CIDR Selection
If the Kubernetes Service IPv4 CIDR is not specified at cluster creation, EKS automatically selects a CIDR that does not overlap with the remote ranges, and in that case a range other than the standard defaults (`10.100.0.0/16`, `172.20.0.0/16`) may be assigned. Explicitly specifying the Service CIDR is recommended for predictable firewall and routing design.
:::

### Traffic Flows: Direction Makes the Difference

The difficulty of hybrid networking varies with the **direction** of traffic.

**① On-premises → AWS (egress)**: Traffic from the kubelet and Pods going out to the API server, SSM, ECR, and so on. When the CNI SNATs the source IP of Pod-originated packets to the node IP, return traffic comes back over the Node CIDR route alone, and conntrack reverses the SNAT. This works without Pod CIDR routing.

**② AWS → On-premises node (inbound, node level)**: The control plane initiates connections to the kubelet (TCP 10250). `kubectl logs`/`exec` use this path, which is why bidirectional Node CIDR routing is mandatory.

**③ AWS → On-premises Pod (inbound, Pod level)**: Webhook calls, the control plane reaching the Metrics Server Pod, and ALB/NLB IP-target traffic use the Pod IP directly as the destination. SNAT cannot create a path for externally initiated connections, so Pod CIDR routing or the Hybrid Nodes Gateway is required. For Metrics Server, distinguish two flows. **(a) Control plane → Metrics Server**: for the API aggregation layer, the kube-apiserver must reach the Metrics Server's **Pod IP on port 10250** (or the node IP and a custom port if Metrics Server runs with `hostNetwork`), so this is the inbound (③) flow that requires Pod CIDR routing or the Gateway. **(b) Metrics Server → kubelet**: a separate flow in which Metrics Server scrapes each node's kubelet (port 10250), targeting node IPs and ports, so it is handled over the Node CIDR (②). In other words, "scraping" is not the Pod-level inbound requirement; the path that requires Pod CIDR routing is the (a) API aggregation path.

```text
[egress — supported by default]
Pod(10.85.1.56)
   │  CNI SNAT: Src 10.85.1.56 → 10.80.0.2 (Node IP)
   ▼
Node(10.80.0.2) ─► on-prem router ─► DX/VPN ─► EKS Control Plane ENI
   ▲                                              │
   └── VPC Route: Node CIDR → VGW/TGW ◄───────────┘
       (return possible without a Pod CIDR route)

[inbound Pod level — cannot be solved with SNAT]
EKS Control Plane ─► webhook Pod IP(10.85.1.23:8443) ─► ???
(NAT cannot create a path for externally initiated connections)
```

### CNI Behavior and the Asymmetry of Routing Burden

This difference stems from how CNIs operate. The VPC CNI on cloud nodes allocates Pod IPs directly from the VPC range, so no additional routing is needed. On-premises, Cilium/Calico run Pods in a VXLAN overlay by default, so if the physical network is unaware of the overlay range, traffic destined for Pod IPs is dropped. Solving this requires advertising the Pod CIDR to the on-premises network via BGP (recommended) or static routing. CNI selection criteria and the Cilium BGP Control Plane configuration procedure are covered in [CNI Configuration and Pod CIDR Routing](../networking/cni-selection-routing.md).

The routing burden is asymmetric. On the VPC side, a single "Pod CIDR → gateway" route suffices, but on the on-premises side, the local router in the same subnet as the hybrid nodes must know each node's Pod CIDR slice. In large enterprises with separate network organizations, this coordination burden becomes the biggest barrier to adoption, and this is the background behind the launch of the Hybrid Nodes Gateway.

## Key Technical Characteristics

### Node CIDR Required, Pod CIDR Optional Principle

The conclusion is **Node CIDR required, Pod CIDR recommended (optional)**.

> "Note, the constraint for making your on-premises pod CIDRs routable is **optional**."
> — [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html)

However, if any of the following capabilities is needed, Pod CIDR routing (or the Gateway) becomes effectively mandatory.

**Table 7. Capabilities that require Pod CIDR routing and the reason**

| Capability requiring Pod CIDR routing | Reason |
|------|------|
| Running webhooks on hybrid nodes (AWS Load Balancer Controller, cert-manager, etc.) | The API server initiates direct connections to the webhook Pod IP |
| Direct cloud Pod ↔ on-premises Pod communication (east-west) | Requires a direct path between the VPC CNI (cloud) and Cilium/Calico (on-prem) |
| Running Metrics Server on hybrid nodes | Requires control plane → Metrics Server Pod IP connectivity |
| Amazon Managed Service for Prometheus (AMP) managed collector | Pod metrics scraping (alternative: ADOT add-on) |
| Targeting hybrid Pods as ALB/NLB IP targets | Target IPs must be routable from AWS |

### Scope and Limitations of Pod Traffic NAT

The official guidance for environments where the Pod range cannot be routed (unroutable) is CNI-level NAT.

> "Configure your CNI to use egress masquerade or network address translation (NAT) for pod traffic as it leaves your on-premises hosts. **This is enabled by default in Cilium. Calico requires `natOutgoing` to be set to `true`.**"
> — [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html)

In summary:

- **On-premises Pod → AWS direction (egress)**: This is an officially supported pattern.
- **AWS → On-premises Pod direction (inbound)** — webhooks, Metrics Server, AMP scraping, ALB/NLB IP targets — cannot be solved with SNAT. In unroutable configurations, running webhooks on cloud nodes in mixed mode is the official recommendation.

The only Pod traffic NAT mechanism specified in the official documentation is CNI-level masquerade. AWS-managed NAT Gateway and on-premises NAT appliances are not covered for this purpose.

### Hybrid Nodes Gateway: Eliminating the Pod Routing Requirement

[Amazon EKS Hybrid Nodes Gateway](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-eks-hybrid-nodes-gateway/), generally available since April 21, 2026, removes the requirement to "make the Pod CIDR routable from on-premises."

> "The gateway **eliminates the need to make on-premises pod networks routable from the VPC** or coordinate network infrastructure changes."
> — [Amazon EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-overview.html)

The Gateway leverages the VTEP (VXLAN Tunnel Endpoint) capability of the Cilium CNI. It establishes a VXLAN tunnel (`hybrid_vxlan0` interface, VNI 2, UDP 8472) between EC2 gateway nodes in the VPC and Cilium nodes on-premises, encapsulating and forwarding Pod traffic. Because the outer header on the physical network shows only UDP traffic between node IPs, you **no longer need to advertise the Pod CIDR as routable on the on-premises physical network**. This removes the routing requirement, but it is not concealment or encryption. Distinguish two points.

- **Encryption boundary**: The official documentation states that the **VXLAN tunnels created by the Gateway do not encrypt traffic**. The encapsulated inner packet still carries the Pod IP header and payload, so if you require encryption in transit, you must separately use an **encrypted transport layer** such as Direct Connect with MACsec or a VPN.
- **Pod CIDR visibility**: For the Gateway to work, the Pod ranges still appear in the **VPC route table entries** managed by the leader gateway and in the **`CiliumVTEPConfig` custom resource** deployed to hybrid nodes. In other words, the Pod CIDR does not disappear from the cluster and VPC configuration; only the requirement to advertise it to the on-premises physical routers goes away.

It operates on a Kubernetes Lease-based leader-election active-standby model, and because both gateway Pods create a VXLAN interface at startup, the official documentation states an expected failover time of about 3–5 seconds. This is a design target, so measure and confirm the actual switchover time in your own environment.

**What the Gateway does not do** is equally clear. The Gateway is not NAT, so it does not resolve CIDR overlaps, and the Node CIDR routing and VPC↔on-premises private connectivity requirements remain unchanged. The Gateway solves the routing problem at the Pod layer; it does not replace hybrid connectivity itself. Operating mechanisms, adoption procedures, and operational details are covered in [Hybrid Nodes Gateway Deployment and Operations](../networking/hybrid-nodes-gateway.md).

### CGNAT Range (100.64.0.0/10) Support

In addition to the RFC 1918 private ranges, the CGNAT range is officially supported for on-premises Node/Pod CIDRs.

> "Be within one of the following `IPv4` RFC-1918 ranges: `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`, **or within the CGNAT range defined by RFC 6598: `100.64.0.0/10`**."
> — [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html)

**Table 8. IP ranges allowed for remote networks and their standards**

| Range | Standard | RemoteNodeNetwork | RemotePodNetwork |
|------|------|-------------------|------------------|
| `10.0.0.0/8` | RFC 1918 | O | O |
| `172.16.0.0/12` | RFC 1918 | O | O |
| `192.168.0.0/16` | RFC 1918 | O | O |
| `100.64.0.0/10` | RFC 6598 (CGNAT) | **O** | **O** |
| Other public ranges | — | X | X |

There are three additional constraints. The on-premises Node/Pod CIDRs must not overlap ① with each other, ② with the VPC CIDR, and ③ with the Kubernetes Service IPv4 CIDR.

The CGNAT range is useful in environments where RFC 1918 space is exhausted. In networks that occupy private ranges extensively — such as finance and telecom — allocating `100.64.0.0/10` exclusively for `RemotePodNetwork` makes overlap avoidance easier. However, carrier CGNAT segments or some internal services may already occupy this range, so an IP inventory check is required beforehand.

:::warning Notation Inconsistency in the IaC Reference Documentation
As of 2026-08-24, the CloudFormation [`AWS::EKS::Cluster RemotePodNetwork` reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-eks-cluster-remotepodnetwork.html) still states only "Each block must be within an IPv4 RFC-1918 network range," omitting the CGNAT range. The User Guide is more current, but the documentation alone cannot determine which one the actual API validation logic matches. If deploying the 100.64 range via CloudFormation/CDK/Terraform, validation in a non-production environment is required before production adoption.
:::

### Mixed Mode Clusters and Webhook Placement

Mixed mode, where cloud nodes and hybrid nodes coexist in a single cluster, is the official operational pattern for working around Pod routing constraints.

- **Place webhooks on cloud nodes**: In environments where the Pod CIDR is unroutable, pin webhook components such as AWS Load Balancer Controller and cert-manager to cloud nodes with nodeAffinity.
- **At least 1 CoreDNS replica on each side**: Topology-aware distribution is recommended so DNS lookups on the hybrid node side are handled without a round trip to the cloud.
- **Service Traffic Distribution**: Keep traffic close to the zone where it originates to reduce unnecessary cross-network hops.

Mixed mode operational patterns and configuration validation automation (Cluster Insights, `nodeadm debug`) are detailed in [Operations and Cost Optimization](../operations-cost/operations-cost-optimization.md).

## Summary

EKS Hybrid Nodes connects an on-premises data plane to an AWS-managed control plane, and the central design question converges on "whether to make the on-premises Pod range routable." Bidirectional Node CIDR routing and private connectivity (DX/VPN) are mandatory in every configuration, while for the Pod range the choice among full BGP routing, CNI NAT, or the Hybrid Nodes Gateway depends on whether webhooks, east-west traffic, or AWS service integration is needed. For IP ranges, CGNAT (100.64.0.0/10) is officially permitted in addition to RFC 1918. For selection criteria among the options, refer to the [Architecture Decision Guide](./architecture-decision-guide.md).

## References

### Official Documentation
- [Amazon EKS Hybrid Nodes overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Hybrid Nodes overview, supported Regions, and requirements
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — Fully routed constraint and explicit statement that Pod CIDR routing is optional
- [Network traffic flows for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-traffic-flows.html) — Packet-level traffic flows with and without CNI NAT
- [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html) — CIDR requirements, firewall/SG rules, endpoint list
- [AWS::EKS::Cluster RemotePodNetwork (CloudFormation)](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-eks-cluster-remotepodnetwork.html) — IaC reference still missing the CGNAT notation
- [EKS Hybrid Nodes pricing](https://aws.amazon.com/eks/pricing/) — Tiered vCPU-hour pricing
- [Amazon EKS Anywhere](https://anywhere.eks.amazonaws.com/) — Alternative architecture for disconnected/air-gapped environments

### Technical Blogs
- [Deep dive into cluster networking for Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deep-dive-into-cluster-networking-for-amazon-eks-hybrid-nodes/) — Detailed BGP and static routing configuration

### Related Documents (Internal)
- [Architecture Decision Guide](./architecture-decision-guide.md) — Decision criteria and dependencies for the six design decisions
- [CIDR Design and Range Minimization](../networking/cidr-network-design.md) — VPC sizing, dedicated ENI subnets, multi-environment address planning
- [Hybrid Nodes Gateway Deployment and Operations](../networking/hybrid-nodes-gateway.md) — Gateway mechanism, installation, and operations
- [Firewall and DNS Pre-registration Guide](../networking/firewall-connectivity.md) — 5-zone firewall rules and TGW topology
