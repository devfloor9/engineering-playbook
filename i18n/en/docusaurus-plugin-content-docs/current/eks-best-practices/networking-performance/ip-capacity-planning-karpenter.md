---
title: "IP Capacity Planning and Karpenter Node Sizing: Subnet, NAU, and SGP Budgets"
description: How Pod IPs on EKS consume subnet addresses, VPC NAU, and branch ENI limits, and how to keep Karpenter's instance-size fallback from turning into IP exhaustion through NodePool and VPC CNI settings.
created: "2026-09-19"
last_update:
  date: "2026-09-19"
  author: YoungJoon Jeong
reading_time: 24
tags:
  - eks
  - vpc-cni
  - ipam
  - karpenter
  - networking
  - capacity-planning
  - scope:ops
keywords:
  - Prefix Delegation
  - Enhanced Subnet Discovery
  - NAU
  - Security Groups for Pods
  - WARM_IP_TARGET
  - InsufficientFreeAddressesInSubnet
sidebar_label: IP Capacity Planning & Karpenter
category: performance-networking
---

## Overview

Amazon VPC CNI hands every Pod a real IP address from a VPC subnet. As Pod counts grow, three separate ceilings come into play: the free addresses in the subnet, the VPC's Network Address Usage (NAU) quota, and the per-instance branch ENI limit. Whichever one is hit first stops new Pods and new nodes. This guide shows how to work out the IPs and NAU a single node consumes, and under what conditions Karpenter's fallback from large to small instances combines with warm pool settings to drain a subnet quickly. It is written for platform teams that own both node autoscaling and subnet design, typically in environments where many clusters share one VPC.

## Background

Terms are used with the following meanings.

- **secondary IP / prefix** — An extra IPv4 address assigned to an ENI, or a /28 prefix bundling 16 addresses
- **branch ENI** — An ENI attached per Pod for Pods that use Security Groups for Pods (SGP), hanging off the node's trunk ENI
- **warm pool** — Spare IPs and ENIs that ipamd holds in advance so it can answer Pod creation requests immediately
- **NAU (Network Address Usage)** — The unit that counts address resources attached to a VPC. IPs, prefixes, and ENIs each count at a fixed rate

The algorithm ipamd uses to fill the warm pool, the mechanics of Prefix Delegation, and the IP cooldown are covered in [How VPC CNI Works](./vpc-cni-deep-dive.md). This guide takes that behavior as given and concentrates on how to calculate consumption and where to leave headroom.

On EKS Auto Mode clusters, AWS manages node networking (including the ENI lifecycle), so there are no VPC CNI environment variables such as `WARM_*` or `MINIMUM_IP_TARGET`. IP allocation is controlled through the NodeClass instead. `advancedNetworking.ipv4PrefixSize` is either `Auto` (the default: Prefix Delegation, one /28 assigned to each node up front and another added when it fills) or `"32"` (secondary IP mode, one IP per Pod, only one spare IP kept warm). `secondaryIPv4Count` and `secondaryIPv4PrefixCount` under `advancedNetworking.networkInterfaces` fix the IP count per ENI at launch, after which no IPs, prefixes, or ENIs are added. Pod subnets are separated from node subnets with `podSubnetSelectorTerms`.

Security Groups for Pods is not supported on Auto Mode; `podSecurityGroupSelectorTerms` on the NodeClass takes its place, and nodes are capped at 110 Pods. The warm-target and NodePool guidance below applies to self-managed nodes where you run Karpenter yourself. On Auto Mode, a large fleet with few Pods per node avoids the 16-IP-per-node reservation of prefix mode by choosing `ipv4PrefixSize: "32"`.

## Architecture

IPs leave a node along two paths. Regular Pods take secondary IPs (or prefixes) on the primary and secondary ENIs; Pods with an SGP take the primary IP of a branch ENI attached to the trunk ENI. Both paths draw down the subnet's free addresses and the VPC's NAU counter.

```mermaid
flowchart TB
    subgraph NODE["One worker node"]
        PENI["primary ENI"]
        SENI["secondary ENI"]
        TENI["trunk ENI<br/>(ENABLE_POD_ENI)"]
        PENI -->|secondary IP / /28 prefix| POOL["Regular Pod IP warm pool"]
        SENI -->|secondary IP / /28 prefix| POOL
        TENI -->|one branch ENI each| BR["SGP Pod<br/>(1 primary IP)"]
    end
    POOL -->|1 IP = 1 NAU<br/>1 prefix = 1 NAU| SUBNET["Subnet free IPs"]
    BR -->|1 IP = 1 NAU| SUBNET
    SUBNET --> CIDR["VPC CIDR block"]
    CIDR --> NAU["VPC NAU counter<br/>(default 64,000 / VPC)"]
```

Which subnet a secondary ENI lands in is decided by the VPC CNI settings and Enhanced Subnet Discovery. Branch ENI capacity is a fixed per-instance-type limit and is not affected by the warm targets.

## Calculating IP Consumption

### What one node holds

Because of the warm pool, a node always holds more IPs than it has Pods. If `MINIMUM_IP_TARGET` is above the Pod count, ipamd fills up to that value; otherwise it fills up to the Pod count plus `WARM_IP_TARGET`. SGP Pods each take one more IP on a branch ENI, outside this pool.

```text
IPs per node ≈ max(MINIMUM_IP_TARGET, non-SGP Pods + WARM_IP_TARGET) + SGP Pods
IPs per cluster ≈ sum over nodes
```

If neither `WARM_IP_TARGET` nor `MINIMUM_IP_TARGET` is set, the `WARM_ENI_TARGET` default of 1 applies and a whole ENI's worth of IPs is reserved. Actual consumption is then higher than the formula above.

### VPC NAU

NAU counts one IP assigned to an ENI, one prefix assigned to an ENI, and one additional ENI as 1 each. In secondary IP mode a Pod costs 1 NAU; in Prefix Delegation mode only the prefix is counted, so 16 Pods cost 1 NAU. The quota is 64,000 per VPC by default and can be raised to 256,000. VPCs peered within the same Region also share an aggregate quota (default 128,000, maximum 512,000); peering across Regions is not included.

When dozens of clusters share a single VPC, the NAU quota can be reached while subnets still have free addresses. That is why subnet size and NAU belong in the same spreadsheet.

### Effect of instance size

The table below takes the same 2,000 Pods and changes only the instance size. Pods per node are assumed to scale with vCPU (100 on a 24xlarge, 33 on an 8xlarge, 16 on a 4xlarge); all Pods are non-SGP, secondary IP mode is used, `WARM_IP_TARGET=2`, and `MINIMUM_IP_TARGET` is tuned to each size's Pod count. Real Pod counts depend on kubelet `max-pods` and workload requests.

| Instance size | Pods per node | Nodes | IPs per node | IPs per cluster | Total warm IPs |
|---|---|---|---|---|---|
| 24xlarge | 100 | 20 | 102 | 2,040 | 40 |
| 8xlarge | 33 | 61 | 35 | 2,135 | 122 |
| 4xlarge | 16 | 125 | 18 | 2,250 | 250 |

Same Pod count, six times the nodes, six times the warm IPs. This is the optimistic case where `MINIMUM_IP_TARGET` is tuned per size. In practice there is exactly one value for the whole cluster, and the next section shows what that does.

## Over-reservation on Small-Instance Fallback

VPC CNI environment variables are set cluster-wide on the aws-node DaemonSet, so a NodePool cannot carry its own values. If `MINIMUM_IP_TARGET` is set to 100 because a 24xlarge is expected to run 100 Pods, a node that fell back to a 4xlarge reserves 100 IPs too. It will only ever run 16 Pods, so 84 addresses per node sit idle.

```text
Idle IPs per fallback node ≈ MINIMUM_IP_TARGET − Pods per node at that size
Example: 100 − 16 = 84
500 × 4xlarge × 84 ≈ 42,000 → more than one /17 subnet (32,763 usable)
```

None of this shows up on a normal day. While large instances are available, the reserved IPs are mostly used by Pods. The waste appears when fallback happens all at once: a DR drill or a large redeploy during a regional capacity shortage brings up hundreds of small nodes together and empties the subnet. IPs released by deleted Pods are reusable only after the default 30-second cooldown (`IP_COOLDOWN_PERIOD`), so in a large redeploy that waiting stock adds to the momentary consumption as well.

Lowering the warm targets alone does not fix it. A value tuned for large nodes slows Pod startup on those nodes if reduced, and wastes addresses on small nodes if left alone. The other half of the fix is to keep fallback from dropping straight from 24xlarge to 4xlarge: split NodePools so it passes through the 8–16xlarge range and the spread of node sizes stays narrow.

## IP Consumption by Security Groups for Pods

With `ENABLE_POD_ENI=true`, every Pod matched by a `SecurityGroupPolicy` gets a branch ENI, and each branch ENI consumes one primary IP. Branch ENI counts are a separate per-instance-type limit, independent of the secondary IP limit; the values are listed in [limits.go in vpc-resource-controller](https://github.com/aws/amazon-vpc-resource-controller-k8s/blob/master/pkg/aws/vpc/limits.go). A c5.4xlarge, for example, can hold up to 234 secondary IPs (or /28 prefixes) on its standard ENIs and attach up to 54 branch ENIs on top; the branch ENI limit is additive to the secondary IP limit.

In clusters where most Pods use SGP, a few properties make IP planning harder.

- Turning on `ENABLE_PREFIX_DELEGATION=true` does not raise branch ENI Pod density. A branch ENI receives a single primary IP, so prefixes bring nothing.
- Branch ENI Pod counts are independent of the `WARM_*` targets. Setting the warm targets low, based on non-SGP Pods only, wastes less.
- `POD_SECURITY_GROUP_ENFORCING_MODE` is `strict` (default) or `standard`. `standard` exempts same-host kubelet and NodeLocal DNS traffic from the SG rules and is required when kube-proxy runs in `ipvs` mode. SGP and trunk/branch ENIs work only on Nitro instances.

## Subnet Expansion Paths

When a subnet runs short, consider these options in order of how much they change.

1. **Enhanced Subnet Discovery** — Attach a new CIDR block to the VPC and tag the new subnets with `kubernetes.io/role/cni=1`. Nodes running with `ENABLE_SUBNET_DISCOVERY=true` (the default since VPC CNI v1.18.0) create their new secondary ENIs in those subnets. Existing Pods are untouched and the address space grows. The VPC CNI role needs IAM permission to call `ec2:DescribeSubnets`.
2. **Secondary CIDR** — Add the RFC 6598 shared range `100.64.0.0/10` (for example `100.64.0.0/16`) to the VPC to give Pods address space without spending corporate RFC 1918 ranges.
3. **Custom networking** — When Pods must live in a different subnet from the node, use `AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG=true` with `ENIConfig`. The primary ENI can no longer serve Pods, so the maximum Pods per node drops.
4. **IPv6** — For a new cluster, IPv4 exhaustion goes away entirely. IPv6 requires Prefix Delegation mode and Nitro instances.

Check the VPC quotas as well. A VPC allows 5 IPv4 CIDR blocks by default (up to 50) and 200 subnets by default; request increases where needed. For reference, eksctl splits its default VPC `192.168.0.0/16` into eight /19 subnets (8,192 addresses each).

Instead of tuning warm targets and guarding add-on configuration against drift indefinitely, moving the workloads that keep running out of IPs to an EKS Auto Mode NodePool is also worth considering as a way to shrink node-networking operations. You pick the per-node reservation unit with `ipv4PrefixSize` and hand the ENI lifecycle and CNI updates to AWS; in exchange you accept no Security Groups for Pods, a 110-Pod cap per node, and no fine-grained warm-target control. Auto Mode nodes and self-managed nodes can share one cluster, with workloads split between them.

## How Karpenter Picks Subnets

Karpenter v1 (`karpenter.sh/v1`) does not actively manage the IP budget. Among the subnets found by the EC2NodeClass `subnetSelectorTerms`, if several belong to the AZ where the node will launch, it picks the one with the most free IPs, and `status.subnets` is sorted by free IP count in descending order. This is a tiebreak within one AZ; Karpenter does not move nodes between AZs based on IP headroom.

If the subnet has no free IPs at launch time, the EC2 launch fails with `InsufficientFreeAddressesInSubnet` and the error is recorded on the NodeClaim. What Karpenter cannot see is a node that is already running and whose ipamd can no longer get IPs, leaving Pods in `ContainerCreating`. This is why the IP budget has to be built into NodePool design and subnet sizing up front.

## Implementation

### Adding subnets and tagging them for the CNI

Create the new subnets and tag them so the CNI can discover them.

```bash
# 1) Attach a secondary CIDR to the VPC (RFC 6598 shared range)
aws ec2 associate-vpc-cidr-block --vpc-id vpc-0abc --cidr-block 100.64.0.0/16

# 2) Create a subnet per AZ, then add the CNI role tag
aws ec2 create-tags --resources subnet-0def \
  --tags Key=kubernetes.io/role/cni,Value=1

# 3) Check free IPs in the subnet
aws ec2 describe-subnets --subnet-ids subnet-0def \
  --query 'Subnets[].AvailableIpAddressCount'
```

### Managing warm targets through add-on configuration

Values changed with `kubectl set env` revert to defaults when the VPC CNI add-on is updated. Tuning that quietly disappears and brings IP exhaustion back is a common outcome. Managing the values as add-on configuration keeps them across updates.

```bash
aws eks update-addon --cluster-name my-cluster --addon-name vpc-cni \
  --configuration-values '{"env":{"WARM_ENI_TARGET":"0","WARM_IP_TARGET":"2","MINIMUM_IP_TARGET":"12"}}' \
  --resolve-conflicts OVERWRITE
```

Set `MINIMUM_IP_TARGET` to the Pod count expected on the dominant node size, and set `WARM_IP_TARGET` alongside it to a small value greater than 0. With `MINIMUM_IP_TARGET` alone, `WARM_IP_TARGET` is treated as 0 and no spare IPs are acquired once the minimum is reached. A smaller `WARM_IP_TARGET` saves IPs but adds an EC2 API call every time a Pod comes or goes, so on a large cluster or one with high Pod churn it can trigger EC2 API throttling. The VPC CNI README advises against relying on `WARM_IP_TARGET` alone in that situation; covering the base with `MINIMUM_IP_TARGET` and keeping `WARM_IP_TARGET` small is the compromise.

### Three-tier weighted NodePools

Instead of letting fallback jump from 24xlarge to 4xlarge, split the sizes and families into three NodePools with descending weights. The `weight`, `limits`, and disruption `budgets` syntax is covered in [Karpenter Autoscaling](../resource-cost/karpenter-autoscaling.md).

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: primary-large
spec:
  weight: 100
  template:
    spec:
      requirements:
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["c7i", "m7i"]
        - key: karpenter.k8s.aws/instance-size
          operator: In
          values: ["24xlarge"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
    budgets:
      - nodes: "10%"
  limits:
    cpu: "20000"
```

Give the second NodePool `weight: 50` with `instance-size In ["8xlarge","12xlarge","16xlarge"]`, and give the last 4xlarge NodePool a low weight plus `limits` so small nodes cannot grow without bound. Constrain size with the `karpenter.k8s.aws/instance-size` label, and family and generation with `instance-family` and `instance-generation`.

### Narrowing the SGP scope

Keep only the Pods that truly need a per-Pod security group (for example, Pods that must reference a datastore's SG) as `SecurityGroupPolicy` targets, and cover the rest of the Pod-to-Pod isolation with node SGs and VPC CNI Network Policy. Branch ENI consumption drops accordingly. Network Policy is supported from VPC CNI v1.14.0 and is enforced with eBPF.

### Prefix Delegation on NodePools without SGP

For NodePools that do not use SGP, enable Prefix Delegation to improve ENI slot efficiency and reduce EC2 API calls. `spec.ipPrefixCount` on the EC2NodeClass controls the number of prefixes per node. A fragmented subnet may have no contiguous /28 left, which surfaces as `InsufficientCidrBlocks`; pair prefix mode with a dedicated subnet or a Subnet CIDR reservation. Recalculate kubelet `max-pods` for prefix mode, and roll the change out as a new NodePool rather than converting existing nodes in place.

### DR capacity

Options for the case where large instances cannot be obtained.

- Allow several families and sizes in the NodePool requirements rather than pinning one type.
- Consume On-Demand Capacity Reservations (ODCRs) first through `capacityReservationSelectorTerms` on the EC2NodeClass. This feature is in Beta as of the karpenter.sh documentation (September 2026) and requires `karpenter.sh/capacity-type: reserved` and the `ec2:DescribeCapacityReservations` IAM permission.
- Pre-warm nodes with static NodePool `replicas` or overprovisioning ([Karpenter Autoscaling](../resource-cost/karpenter-autoscaling.md)). For the disruption design when those nodes are consumed, see [Pod Scheduling and Availability](../operations-reliability/eks-pod-scheduling-availability.md).

## Operational Considerations

- Read subnet headroom from `AvailableIpAddressCount` in `aws ec2 describe-subnets`, and the headroom of subnets Karpenter can choose from the EC2NodeClass `status.subnets`.
- Keep metrics exposure on aws-node enabled (`DISABLE_METRICS=false`, the default) and deploy the CNI Metrics Helper to get the number of ENIs the cluster can support, ENIs and IPs assigned, and total and maximum available IPs into CloudWatch. With Prometheus, scrape port 61678 on aws-node directly.
- Monitor VPC NAU in CloudWatch and request a quota increase before the limit is reached. Past the quota, calls such as `RunInstances` and `AssignPrivateIpAddresses` fail with `NetworkAddressUsageLimitExceeded`.
- Alarm at 80% on both subnet free IPs and NAU usage. Adding a CIDR after exhaustion still leaves a gap before ENIs appear in the new subnets.
- The step-by-step procedure for diagnosing IP exhaustion symptoms is in [Networking Debugging](../operations-reliability/eks-debugging/networking.md).
- Hundreds of small nodes arriving at once during DR put load on the API server. Stage the scale-out and, where needed, arrange control plane capacity in advance.

## Troubleshooting

| Symptom | Cause | Action | How to verify |
|---|---|---|---|
| Pods wait for an IP in `ContainerCreating`, Pod count is low, subnet free IPs are 0 | Default `WARM_ENI_TARGET` reserves a whole ENI's worth of IPs | Set `WARM_ENI_TARGET=0` and retune `WARM_IP_TARGET` / `MINIMUM_IP_TARGET` via add-on configuration | Gap between total and assigned IPs narrows in CNI metrics |
| Each small fallback node holds many idle IPs | Cluster-wide `MINIMUM_IP_TARGET` sized for large nodes | Raise the fallback size to 8–16xlarge, add a minimum Pod size policy | Assigned/total IP ratio per node |
| Karpenter `InsufficientFreeAddressesInSubnet`, only one AZ fails to scale | That AZ's subnet is exhausted; Karpenter does not steer across AZs | Add a secondary CIDR with ESD tags, check `status.subnets` | ENIs appear in the new subnet |
| `InsufficientCidrBlocks` in prefix mode | Fragmented subnet, no contiguous /28 | Subnet CIDR reservation or a dedicated subnet | Reservation usage |
| IP pressure persists after enabling Prefix Delegation | SGP Pods consume branch ENI IPs (no prefix benefit) | Narrow the SGP scope, replace with Network Policy | SGP Pod share, branch ENI count |
| Pending with `Insufficient vpc.amazonaws.com/pod-eni` | Per-instance branch ENI limit reached | Account for per-type limits, narrow the SGP scope | Node allocatable `pod-eni` |
| IP exhaustion returns after an add-on update | Values set with `kubectl set env` reverted to defaults | Move to `update-addon --configuration-values`, manage through GitOps | Values in `describe-addon` |
| Small nodes surge during DR when large instances are unavailable | Single pinned type, regional capacity shortage | Weighted NodePools across sizes and families, ODCR, pre-warm | Node size distribution, ICE event count |

## Summary

In the routable Pod IP model, capacity is set by whichever of subnet free IPs, the VPC NAU quota, and the per-instance branch ENI limit is reached first. IPs per node are approximately the larger of the warm target and the Pod count, plus SGP Pods; because the warm target is a cluster-wide setting, fallback from large to small instances wastes addresses. Karpenter checks subnet IPs only at launch time and cannot see CNI-level exhaustion, so subnet expansion and size-split weighted NodePools have to be in place beforehand. SGP Pods get no benefit from Prefix Delegation, so reducing the SGP scope contributes directly to IP and ENI efficiency.

## References

### Official Documentation
- [EKS Best Practices: Optimizing IP Address Utilization](https://docs.aws.amazon.com/eks/latest/best-practices/ip-opt.html) — Enhanced Subnet Discovery, secondary CIDR, warm pool tuning caveats
- [EKS Best Practices: Security Groups for Pods](https://docs.aws.amazon.com/eks/latest/best-practices/sgpp.html) — Trunk/branch ENI structure and supported instances
- [amazon-vpc-cni-k8s CNI Configuration Variables](https://github.com/aws/amazon-vpc-cni-k8s#cni-configuration-variables) — WARM/MINIMUM targets, ENABLE_SUBNET_DISCOVERY, POD_SECURITY_GROUP_ENFORCING_MODE defaults
- [VPC Network Address Usage](https://docs.aws.amazon.com/vpc/latest/userguide/network-address-usage.html) — How NAU is calculated per IP, prefix, and ENI
- [Amazon VPC quotas](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html) — Default subnet, CIDR, and NAU quotas
- [Karpenter NodePools](https://karpenter.sh/docs/concepts/nodepools/) — weight, limits, disruption budgets, well-known labels
- [Karpenter NodeClasses](https://karpenter.sh/docs/concepts/nodeclasses/) — subnetSelectorTerms, capacityReservationSelectorTerms, ipPrefixCount
- [Learn about VPC Networking and Load Balancing in EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/auto-networking.html) — Managed node networking in Auto Mode and NodeClass subnet selection
- [Create a Node Class for Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/create-node-class.html) — `ipv4PrefixSize`, `networkInterfaces`, separate Pod subnets, the 110-Pod-per-node limit
- [eksctl VPC Configuration](https://eksctl.io/usage/vpc-configuration/) — Default VPC 192.168.0.0/16 split into eight /19 subnets

### Technical Blogs
- [Amazon VPC CNI introduces Enhanced Subnet Discovery](https://aws.amazon.com/blogs/containers/amazon-vpc-cni-introduces-enhanced-subnet-discovery/) — Tag-based, non-disruptive subnet expansion
- [Amazon VPC CNI increases pods per node limits](https://aws.amazon.com/blogs/containers/amazon-vpc-cni-increases-pods-per-node-limits/) — Density gains and constraints of Prefix Delegation

### Related Documents (internal)
- [How VPC CNI Works](./vpc-cni-deep-dive.md) — ipamd warm pool, Prefix Delegation, and IP cooldown mechanics
- [Karpenter Autoscaling](../resource-cost/karpenter-autoscaling.md) — NodePool syntax, weight, overprovisioning
- [Networking Debugging](../operations-reliability/eks-debugging/networking.md) — IP exhaustion diagnostic runbook
- [Pod Scheduling and Availability](../operations-reliability/eks-pod-scheduling-availability.md) — Taints, PDBs, and disruption design
