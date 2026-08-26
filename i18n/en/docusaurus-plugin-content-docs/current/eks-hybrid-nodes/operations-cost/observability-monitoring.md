---
title: Observability Integration — Self-Diagnosis, Container Insights, eBPF
description: "Observability implementation guide for EKS Hybrid Nodes — covers Cluster Insights configuration self-diagnosis, CloudWatch Container Insights hybrid configuration (RUN_WITH_IRSA), NVIDIA GPU metric integration, a Cilium Hubble-based eBPF dashboard, and Network Flow Monitor applicability analysis."
created: "2026-08-26"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 11
tags:
  - eks
  - hybrid-node
  - observability
  - ebpf
  - cilium
  - monitoring
  - scope:ops
keywords:
  - Cluster Insights
  - Container Insights
  - Hubble
  - Network Flow Monitor
  - DCGM
sidebar_label: Observability Integration
category: hybrid-multicloud
---

## Overview

The observability regime for a hybrid cluster builds on the 3-layer model (nodes/workloads, cross-network path, Gateway) of [Operations and Cost Optimization](./operations-cost-optimization#monitoring-architecture). This document covers its implementation — EKS Cluster Insights' hybrid configuration self-diagnosis, the hybrid-specific configuration and constraints of CloudWatch Container Insights, NVIDIA GPU metric integration, a Cilium Hubble-based eBPF network dashboard, and an applicability analysis of CloudWatch Network Flow Monitor (NFM) for hybrid nodes.

## EKS Cluster Insights: Configuration Self-Diagnosis

Among its three insight types (configuration, upgrade, rollback readiness), EKS Cluster Insights provides **configuration insights** specialized for hybrid nodes clusters. The control plane automatically scans the cluster, detecting private-network and permission issues such as the following and suggesting remediation.

- **Control plane → webhook communication failure**: when webhooks are placed on hybrid nodes while RemotePodNetwork is unconfigured or the Pod CIDR is unrouted
- **`kubectl exec`/`kubectl logs` failures**: control plane → kubelet (TCP 10250) path problems — a firewall inbound direction mistake is the typical cause ([direction caution](../networking/firewall-connectivity#zone-a-on-premises-firewall-ongoing-operations-rules))
- Other remote network configuration mismatches

The operational workflow is as follows. Insights refresh automatically on a 24-hour cycle, and a manual refresh after remediation confirms resolution immediately.

```bash
# List configuration insights
aws eks list-insights \
  --cluster-name CLUSTER_NAME \
  --filter categories=CONFIGURATION

# View detailed diagnosis and recommendations for an individual insight
aws eks describe-insight \
  --cluster-name CLUSTER_NAME \
  --id INSIGHT_ID
```

Pairing Cluster Insights (the control plane's perspective) with `nodeadm debug` (the node's perspective, see [configuration validation automation](./operations-cost-optimization#configuration-validation-automation)) enables bidirectional cross-diagnosis between "problems seen from the cluster side" and "problems seen from the node side." Fix new deployments, firewall changes, and post-upgrade as mandatory checkpoints in the runbook.

## CloudWatch Container Insights Integration

The CloudWatch Observability add-on (`amazon-cloudwatch-observability`) is compatible with hybrid nodes from v2.2.1-eksbuild.1. It unifies on-premises node metrics and logs into the same CloudWatch views as cloud nodes, but three hybrid-specific constraints must be accounted for.

| Item | Detail | Handling |
|------|--------|----------|
| No IMDS | Hybrid nodes have no EC2 Instance Metadata Service, so **node-level metrics are not collected** (cluster, workload, Pod, and container levels work normally) | Supplement node level with Prometheus Node Exporter (a hybrid-compatible add-on) |
| Credentials | The agent cannot obtain IMDS-based credentials | Add the `RUN_WITH_IRSA=True` environment variable to the `AmazonCloudWatchAgent` resource (required) |
| Operator webhooks | The add-on operator uses webhooks | Configure Pod CIDR routing/Gateway, or place the operator on cloud nodes in mixed mode |

```bash
# After installing the add-on — edit the manifest so the agent runs on hybrid nodes
kubectl edit amazoncloudwatchagents -n amazon-cloudwatch cloudwatch-agent
```

```yaml
# Add under spec.env
spec:
  env:
    - name: RUN_WITH_IRSA
      value: "True"
```

Log collection (Fluent Bit) is handled by the same add-on, aggregating hybrid nodes' kubelet and system logs into CloudWatch Logs. In air-gapped networks, the `logs` and `monitoring` VPC endpoints are prerequisites ([endpoint mapping](../networking/private-vpc-endpoints#required-interface-endpoint-mapping)).

### NVIDIA GPU Metric Integration

Accelerator metrics for on-premises GPUs (DGX and similar) are collected with the DCGM (Data Center GPU Manager) Exporter as the standard. The official AWS reference architecture is DCGM Exporter → Amazon Managed Service for Prometheus (AMP) → Amazon Managed Grafana (AMG).

- **DCGM Exporter**: Exposes GPU utilization, memory, temperature, power, and XID errors in Prometheus format. As with the [hybrid-only Device Plugin](../compute-gpu/gpu-scheduling-failover#hybrid-only-nvidia-device-plugin), restrict the deployment scope with the `eks.amazonaws.com/compute-type: hybrid` nodeSelector.
- **Choosing the collection path**: The AMP managed collector requires Pod metric endpoints reachable from the VPC, so Pod CIDR routing (BGP/Gateway) is a prerequisite. In unroutable configurations, use the ADOT add-on or an in-cluster Prometheus that scrapes and remote-writes to AMP.
- **Organizations requiring CloudWatch consolidation**: The CloudWatch agent's Prometheus scrape configuration can ingest DCGM metrics into CloudWatch, providing observation in the same account and console as the Container Insights views.
- Deploying the Node Monitoring Agent (a hybrid-compatible add-on) alongside strengthens detection of GPU-related node health issues.

## eBPF-Based Unified Network Dashboard: Cilium Hubble

The fact that the hybrid nodes' CNI is Cilium means **kernel-level eBPF network observability data already exists in the data plane**, with no extra agent. Hubble is the observability layer built into Cilium, capturing Pod-to-Pod flows, DNS queries, and policy drops via eBPF.

### Enabling It

```yaml
# Add to cilium-values.yaml (merge with existing values)
hubble:
  enabled: true
  metrics:
    enableOpenMetrics: true
    enabled:
      - dns
      - drop            # policy/routing drops — the primary signal for hybrid path issues
      - tcp
      - flow
      - port-distribution
  relay:
    enabled: true       # cluster-wide flow aggregation
  ui:
    enabled: true       # service map visualization (optional)
```

```bash
helm upgrade cilium oci://public.ecr.aws/eks/cilium/cilium \
  --namespace kube-system --reuse-values --values cilium-values.yaml

# Observe flows in real time (diagnose drop causes)
hubble observe --verdict DROPPED --last 100
```

- Hubble metrics are exposed on each Cilium agent's port 9965 (default); Prometheus/AMP scrapes them and visualizes them with the official Hubble Grafana dashboards (L3/L4 flows, DNS, drop-reason distribution).
- **Beware the conflict with the Hybrid Nodes Gateway**: the Gateway requires `l7Proxy=false` ([pre-adoption checklist](../networking/hybrid-nodes-gateway#pre-adoption-checklist)), so Hubble's L7 protocol visibility (HTTP, etc.) is unavailable in Gateway environments. L3/L4 flow, DNS, and drop observability work independently of the L7 proxy.
- Placing Hubble Relay and UI on hybrid nodes keeps observability traffic contained on-premises. If queried from cloud-side Grafana (AMG), placement is irrelevant from the data source (AMP) perspective.
- **Support scope caution**: Hubble is an upstream Cilium feature not included in the Cilium support scope table of the official documentation (network policy, BGP, Ingress, LB IPAM, etc.). It technically works on the EKS distribution of Cilium, but it is outside AWS Support scope — organizations for whom support contracts matter should state this boundary in their operational documentation.

### Unified Dashboard Composition Strategy

Consolidating the observability stack onto AMP (or self-managed Prometheus) + Grafana allows four families of metrics of different natures to be correlated on a single screen.

| Panel family | Data source | Observation target |
|--------------|------------|--------------------|
| Pod network flows (eBPF) | Hubble metrics (`hubble_*`) | On-prem Pod-to-Pod and cross-network flows, drops, DNS failures |
| Cross-network tunnel | Gateway metrics (`hybrid_gateway_*`) | VXLAN traffic volume, leader status, route update errors |
| GPU accelerators | DCGM metrics (`DCGM_FI_*`) | GPU utilization, memory, XID errors |
| Node and connectivity layer | Node Exporter, CloudWatch (DX/VPN) | Node resources, tunnel and circuit availability |

For example, in an "inference latency spike" scenario, comparing GPU utilization (DCGM), Gateway bandwidth saturation (`hybrid_gateway_primary_nic_*`), and Pod drops (`hubble_drop_total`) on one screen immediately narrows down the bottleneck layer.

## Network Flow Monitor Applicability Analysis

CloudWatch Network Flow Monitor (NFM) is a service built on a lightweight eBPF (`bpf_sock_ops`) agent that collects TCP flow retransmissions, RTT, and throughput, and powers the EKS console's Container Network Observability (service map and flow table). Assessing its applicability to hybrid clusters yields the following.

| Assessment axis | Detail | Verdict |
|-----------------|--------|---------|
| Supported targets | Official documentation scopes agent installation to "AWS compute resources (Amazon EC2 and Amazon EKS)" | On-prem nodes out of scope |
| Hybrid add-on compatibility | The NFM agent add-on (`aws-network-flow-monitoring-agent`) is **absent** from the validated hybrid-compatible add-on list — the official documentation treats unlisted add-ons as unvalidated, and incompatible add-ons carry an anti-affinity against the hybrid label | Unvalidated — no documented support |
| Mixed-mode cloud nodes | Fully supported as an EKS add-on (add-on v1.1.0+, kernel 5.8+, roughly 5,000 nodes / 5M flows per minute per cluster) | Usable |
| Air-gapped networks | The NFM ingestion path supports PrivateLink | Usable (with endpoints opened) |

**Conclusion**: Hybrid nodes support for NFM is not documented (there is no explicit prohibition either, but it is absent from the validated list), so in production designs it is safest to position NFM as an observability tool for the **cloud-node segment only** in mixed-mode clusters. The resulting recommended arrangement is a division of roles.

- **Cloud node segment**: the NFM add-on — EKS console service map and flow table, AWS network health indicator (NHI). Scraping the agent's OpenMetrics endpoint (`OPEN_METRICS=on`) with Prometheus folds the cloud segment into the unified Grafana dashboard above as its own panel family.
- **Hybrid node segment**: Cilium Hubble — the same eBPF class of data (flows, drops, DNS) collected on-premises, covering the segment NFM cannot.
- **The junction between the two (cross-network)**: covered by Gateway metrics and DX/VPN CloudWatch metrics.

Whether NFM supports hybrid nodes is determined by the add-on compatibility list, so periodically recheck the [hybrid-compatible add-ons documentation](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html).

## Summary of Recommendations

- Fix Cluster Insights (control plane perspective) and `nodeadm debug` (node perspective) as cross-diagnosis tools in the runbook, and confirm with manual refreshes right after deployments and changes.
- Container Insights requires the `RUN_WITH_IRSA=True` setting, and the node-level metric gap on hybrid nodes is filled with Node Exporter.
- Use DCGM Exporter → AMP → Grafana as the default GPU metrics path, and CloudWatch agent scraping when CloudWatch consolidation is required.
- In Cilium environments, eBPF observability is obtained just by enabling Hubble — only mind the L7 visibility constraint when using the Gateway.
- Deploy NFM for cloud nodes only, with Hubble covering the on-premises segment in a division-of-roles design.
- Compose the unified dashboard so the four metric families — Hubble, Gateway, DCGM, and the connectivity layer — can be correlated in a single Grafana.

## References

### Official Documentation
- [Prepare for Kubernetes version upgrades and troubleshoot misconfigurations with cluster insights](https://docs.aws.amazon.com/eks/latest/userguide/cluster-insights.html) — Hybrid configuration insights
- [Configure add-ons for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html) — Container Insights hybrid constraints (RUN_WITH_IRSA, IMDS) and the compatible add-on list
- [Monitor Kubernetes workload traffic with Container Network Observability](https://docs.aws.amazon.com/eks/latest/userguide/network-observability.html) — NFM-based EKS network observability
- [How Network Flow Monitor works](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-NetworkFlowMonitor-inside-network-flow-monitor.html) — eBPF (bpf_sock_ops) collection mechanics and limits
- [Hubble — Cilium Documentation](https://docs.cilium.io/en/stable/observability/hubble/) — Hubble architecture and metric configuration

### Technical Blogs
- [Deploy production generative AI at the edge using Amazon EKS Hybrid Nodes with NVIDIA DGX — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deploy-production-generative-ai-at-the-edge-using-amazon-eks-hybrid-nodes-with-nvidia-dgx/) — DCGM → AMP → AMG GPU observability reference

### Related Documents (Internal)
- [Operations and Cost Optimization](./operations-cost-optimization) — The 3-layer observability model and cross-network SPOF
- [Building and Operating the Hybrid Nodes Gateway](../networking/hybrid-nodes-gateway) — `hybrid_gateway_*` metrics and the l7Proxy constraint
- [GPU Scheduling and Cloud Fallback](../compute-gpu/gpu-scheduling-failover) — Restricting the DCGM Exporter deployment scope
- [Private Air-gapped VPC Endpoint Design](../networking/private-vpc-endpoints) — logs, monitoring, and aps endpoints
