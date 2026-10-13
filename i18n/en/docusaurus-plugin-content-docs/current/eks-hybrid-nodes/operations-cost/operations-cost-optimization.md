---
title: Operations and Cost Optimization
description: "Operational best practices for EKS Hybrid Nodes — mixed mode workload placement, configuration validation with Cluster Insights and nodeadm debug, monitoring architecture, and cost optimization based on tiered vCPU-hour billing."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 16
tags:
  - eks
  - hybrid-node
  - operations
  - monitoring
  - cost-optimization
  - scope:ops
keywords:
  - Cluster Insights
  - nodeadm debug
  - mixed mode
sidebar_label: Operations and Cost Optimization
category: hybrid-multicloud
---

## Overview

Because a hybrid cluster combines cloud nodes and on-premises nodes in a single structure, it requires operational decisions different from cloud-only clusters in four areas: workload placement, configuration validation, observability, and cost. This document covers mixed mode placement strategy, configuration validation automation tools, the monitoring architecture, and cost optimization that leverages the vCPU-hour billing structure.

## Mixed Mode Workload Placement Strategy

Mixed mode, which co-locates cloud nodes and hybrid nodes in a single cluster, is the official operational pattern for working around Pod routing constraints and the default topology for hybrid operations.

- **Place webhooks on cloud nodes**: In environments where the Pod CIDR is unroutable, pin webhook components such as the AWS Load Balancer Controller and cert-manager to cloud nodes using nodeAffinity. Hybrid nodes are identified by the `eks.amazonaws.com/compute-type: hybrid` label, so write affinity conditions against this label.
- **At least 1 CoreDNS replica on each side**: Topology spreading is recommended so that DNS lookups on the hybrid node side are handled without a round trip to the cloud.
- **Service Traffic Distribution**: Keep traffic close to the zone where it originates to reduce unnecessary cross-network hops.
- **Review system add-on placement**: Requirements differ by component, so distinguish two types. Metrics Server is a component the control plane accesses directly via the Pod IP (or the node IP when hostNetwork is enabled); unless you configure routable Pod IPs, place it on cloud nodes or run it in hostNetwork mode. The AMP managed collector's scraper, by contrast, is managed by AWS and is not subject to your node scheduling, so there is no concept of "placing it on cloud nodes." The AMP managed collector requires that the metric endpoints of your hybrid-node applications be reachable from the VPC (including routes to remote Pod network CIDRs and open ports in your on-premises firewall) and that the cluster has private cluster endpoint access configured (see the [capability table](../overview-architecture/hybrid-nodes-fundamentals.md#node-cidr-required-pod-cidr-optional-principle)).

## Configuration Validation Automation

- **EKS Cluster Insights**: Automatically scans clusters with hybrid nodes to detect configuration issues such as control plane↔webhook communication and `kubectl exec`/`logs` paths, and provides remediation recommendations. Results are available in the console, CLI, and SDK. Use it as the first inspection tool after new builds or configuration changes.
- **`nodeadm debug`**: Run directly on a hybrid node to validate whether networking and credential requirements are met. It is the first-line diagnostic tool when node join fails.

```bash
# Run on the hybrid node — validates networking and credential requirements
sudo nodeadm debug --config-source file://nodeconfig.yaml
```

## Monitoring Architecture

A hybrid cluster has three observation layers.

| Layer | Observation Targets | Tools |
|------|----------|------|
| Nodes and workloads | Hybrid node status, Pod metrics | Prometheus/AMP (ADOT), CloudWatch Observability add-on |
| Cross-network path | DX/VPN availability and bandwidth, VXLAN tunnel traffic | CloudWatch (DX/VPN metrics), Gateway metrics |
| Gateway (if used) | Leader status, route update errors, bandwidth utilization | `hybrid_gateway_*` Prometheus metrics — [details](../networking/hybrid-nodes-gateway.md#monitoring) |

The operational key point is that **the cross-network path is a critical availability dependency**. With a single circuit that path is a single point of failure, but Direct Connect supports multi-circuit, multi-location configurations through the [Resiliency Toolkit](https://docs.aws.amazon.com/directconnect/latest/UserGuide/resiliency_toolkit.html), so choose a level of redundancy that matches your actual shared failure domains and availability target. If the connection between the control plane and the data plane (DX/VPN) is severed, scheduling, `kubectl` operations, and credential renewal stop. Workloads already running locally continue to operate to the extent that their dependencies are local and their credentials and probes do not expire, but workloads that depend on cloud resources or on components that require renewal can be affected. Manage availability metrics and alerts for the connectivity layer at the same level as cluster metrics.

- If Pod metric collection is required, the AMP managed collector assumes that the metric endpoints of your hybrid-node applications are reachable from the VPC (routes to remote Pod network CIDRs and firewall ports) and that private cluster endpoint access is configured. Replacing it with the ADOT add-on does not remove that assumption: the ADOT operator uses admission webhooks to mutate and validate the Collector custom resource, so running the operator on hybrid nodes requires that your on-premises Pod CIDR be routable and that the cluster be configured with your remote Pod network. Therefore, in configurations where the Pod CIDR is unroutable, pin the ADOT operator to cloud nodes with nodeAffinity so the webhooks are reachable, or choose a different collection architecture that avoids the admission dependency.
- Collect system logs and kubelet logs from hybrid nodes via the CloudWatch Logs agent or the existing on-premises logging stack, and ensure time synchronization (NTP) with cluster events.
- Per-tool implementation — Cluster Insights self-diagnosis, the Container Insights hybrid configuration (`RUN_WITH_IRSA`), the Cilium Hubble eBPF dashboard, and Network Flow Monitor applicability — is covered in [Observability Integration](./observability-monitoring).

## Cost Optimization

Based on the tiered vCPU-hour structure of the [pricing model](../overview-architecture/hybrid-nodes-fundamentals.md#pricing-model), the following strategies are effective.

1. **Selective workload placement (a policy choice)**: Hybrid node charges are based on the vCPU capacity that registered nodes report to Kubernetes and on how long they stay registered; billing starts when a node joins and stops when it is removed. Which workloads run on a node does not affect the charge. Consequently, moving general-purpose CPU workloads to cloud nodes (mixed with Spot) does not reduce hybrid fees if the GPU hosts remain registered as hybrid nodes — those hosts' vCPUs are still billed — and it adds EC2/Spot cost for the moved workloads. Hybrid fee savings occur only when you actually reduce the number of registered nodes or their registration time, so treat this placement as a policy choice made after comparing total cost (hybrid fees plus the added cloud cost).
2. **Node registration lifecycle management**: Deregister hybrid nodes from the cluster during unused periods to reduce billable vCPU-hours
3. **Cost visibility**: Filter by the `Amazon Elastic Kubernetes Service - Hybrid Nodes` service dimension in Cost Explorer to observe trends per environment

Include hybrid-specific fixed costs in the plan as well. When using the Gateway, 2 gateway EC2 instances per cluster (6 for three environments — dev/stg/prd) are billed continuously, and standard cross-AZ data transfer charges apply to cross-AZ traffic between the gateway and VPC resources.

## Summary of Recommendations

- Pin components with direct control plane → Pod communication, such as webhooks and Metrics Server, to cloud nodes using nodeAffinity.
- Check Cluster Insights immediately after builds and changes, and use `nodeadm debug` for first-line diagnosis when node join fails.
- Configure availability alerts for the DX/VPN connectivity layer at the same level as cluster alerts.
- Hybrid fees are charged on the vCPU capacity and registration time of registered nodes, so deregister unused nodes to reduce billable vCPU-hours, and decide workload placement after comparing total cost (hybrid fees plus added cloud cost).
- Regularly observe per-environment cost trends with the Hybrid Nodes service filter in Cost Explorer.

## References

### Official Documentation
- [Cluster insights](https://docs.aws.amazon.com/eks/latest/userguide/cluster-insights.html) — Automated configuration checks for hybrid nodes
- [Configure webhooks for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-webhooks.html) — Mixed mode recommendation, per-add-on affinity configuration
- [EKS Hybrid Nodes pricing](https://aws.amazon.com/eks/pricing/) — Tiered vCPU-hour pricing

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How It Works](../overview-architecture/hybrid-nodes-fundamentals.md) — Pricing model and basic mixed mode structure
- [Building and Operating the Hybrid Nodes Gateway](../networking/hybrid-nodes-gateway.md) — Gateway metrics and sizing
- [GPU Workloads and SR-IOV Networking](../compute-gpu/gpu-sriov-networking.md) — Architecture for leveraging on-premises GPU assets
