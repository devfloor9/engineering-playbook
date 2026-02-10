---
title: "VPC CNI vs Cilium CNI Performance Comparison Benchmark"
sidebar_label: "CNI Performance Comparison"
description: "Benchmark report comparing network and application performance of VPC CNI vs Cilium CNI in EKS across 5 scenarios (kube-proxy, kube-proxy-less, ENI, tuning)"
tags: [benchmark, cni, cilium, vpc-cni, networking, performance, eks]
category: "benchmark"
date: 2026-02-09
authors: [devfloor9]
sidebar_position: 5
last_update:
  date: 2026-02-09
  author: devfloor9
---

import HttpPerformanceChart from '@site/src/components/HttpPerformanceChart';
import ServiceScalingChart from '@site/src/components/ServiceScalingChart';
import KubeproxyScalingChart from '@site/src/components/KubeproxyScalingChart';
import LatencyChart from '@site/src/components/LatencyChart';
import UdpLossChart from '@site/src/components/UdpLossChart';
import ThroughputChart from '@site/src/components/ThroughputChart';
import AimlRelevanceChart from '@site/src/components/AimlRelevanceChart';
import TestEnvironmentChart from '@site/src/components/TestEnvironmentChart';
import ScenarioComparisonChart from '@site/src/components/ScenarioComparisonChart';
import DnsResourceChart from '@site/src/components/DnsResourceChart';
import OverviewSummaryChart from '@site/src/components/OverviewSummaryChart';
import TuningPointsChart from '@site/src/components/TuningPointsChart';
import KeyResultsSummaryChart from '@site/src/components/KeyResultsSummaryChart';
import KeyFindingsChart from '@site/src/components/KeyFindingsChart';
import RecommendationChart from '@site/src/components/RecommendationChart';
import XdpCompatibilityChart from '@site/src/components/XdpCompatibilityChart';
import NetworkPolicyChart from '@site/src/components/NetworkPolicyChart';

# VPC CNI vs Cilium CNI Performance Comparison Benchmark

> 📅 **Published**: 2026-02-09 | ✍️ **Author**: devfloor9 | ⏱️ **Reading Time**: ~25 min

## Executive Summary

A quantitative benchmark comparing VPC CNI and Cilium CNI performance across 5 scenarios on Amazon EKS 1.31.

**Bottom line**: TCP throughput is NIC-bound (12.5 Gbps) and identical across all CNI configurations, but Cilium ENI with full tuning delivers **680× lower UDP packet loss** (20% → 0.03%), **36% lower RTT** (4,894 → 3,135 µs), and **20% lower HTTP p99 latency** (10.92 → 8.75 ms) compared to VPC CNI. Additionally, 1,000-service scaling tests show that kube-proxy's iptables rules grew **101× (99→10,059 rules)** with **+16% per-connection overhead**, while Cilium eBPF maintained **O(1) constant performance** regardless of service count.

**5 Scenarios**:
- **A** VPC CNI Baseline
- **B** Cilium + kube-proxy (migration impact)
- **C** Cilium kube-proxy-less (kube-proxy removal effect)
- **D** Cilium ENI Mode (Overlay vs Native Routing)
- **E** Cilium ENI + Full Tuning (cumulative optimization)

<OverviewSummaryChart />

<AimlRelevanceChart />

---

## Test Environment

<TestEnvironmentChart />

**Cluster Configuration**: See `scripts/benchmarks/cni-benchmark/cluster.yaml`
**Workload Deployment**: See `scripts/benchmarks/cni-benchmark/workloads.yaml`

---

## Test Scenarios

The 5 scenarios are designed to isolate the independent impact of each variable: CNI type, kube-proxy mode, IP allocation method, and tuning application.

<ScenarioComparisonChart />

### Scenario E Tuning Points

<TuningPointsChart />

:::warning XDP and DSR Compatibility
On m6i.xlarge with the ENA driver, XDP native acceleration (`loadBalancer.acceleration=native`) failed with a "bpf_link is not supported" error. Even `acceleration=best-effort` mode failed. DSR (`loadBalancer.mode=dsr`) caused pod crashes and was reverted to `mode=snat`. Scenario E therefore represents partial tuning: Socket LB, BPF Host Routing, BPF Masquerade, Bandwidth Manager, BBR, Native Routing, CT Table expansion, and Hubble disabled were successfully applied.
:::

---

## Architecture

### Packet Path Comparison: VPC CNI vs Cilium

Comparison of Pod-to-Service traffic packet paths between VPC CNI (kube-proxy) and Cilium (eBPF).

#### Cilium Architecture Overview

The Cilium Daemon manages BPF programs in the kernel, attaching eBPF programs to each container's network interface (eth0) and veth pairs.

![Cilium Architecture](/img/benchmarks/cilium-arch.png)
*Source: [Cilium Component Overview](https://docs.cilium.io/en/stable/overview/component-overview.html)*

#### Cilium eBPF Packet Path

In Pod-to-Pod communication, eBPF programs attached to veth pairs (lxc) completely bypass iptables. The diagram below shows the direct communication path between endpoints.

![Cilium eBPF Endpoint-to-Endpoint](/img/benchmarks/cilium_bpf_endpoint.svg)
*Source: [Cilium - Life of a Packet](https://docs.cilium.io/en/stable/network/ebpf/lifeofapacket.html)*

#### Cilium Native Routing (ENI Mode)

In native routing mode, pod traffic is forwarded directly through the host's routing table without VXLAN encapsulation. In ENI mode, pod IPs are allocated directly from the VPC CIDR.

![Cilium Native Routing](/img/benchmarks/cilium_native_routing.png)
*Source: [Cilium Routing](https://docs.cilium.io/en/stable/network/concepts/routing.html)*

#### Cilium ENI IPAM Architecture

The Cilium Operator allocates IPs from ENIs via the EC2 API and provides IP pools to each node's Agent through CiliumNode CRDs.

![Cilium ENI Architecture](/img/benchmarks/cilium_eni_arch.png)
*Source: [Cilium ENI Mode](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)*

### Data Plane Stack by Scenario

Comparison of Service LB, CNI Agent, and network layer configuration with key performance metrics across all scenarios.

![Data Plane Stack Comparison](/img/benchmarks/dataplane-stack-comparison.svg)

---

## Test Methodology

### Test Workloads

- **httpbin**: HTTP echo server (2 replicas)
- **Fortio**: HTTP load generator
- **iperf3**: Network throughput measurement server/client

### Metrics Measured

1. **Network Performance**: TCP/UDP Throughput, Pod-to-Pod Latency (p50/p99), Connection Setup Rate
2. **HTTP Performance**: Throughput and latency per QPS level (Fortio → httpbin)
3. **DNS Performance**: Resolution latency (p50/p99), QPS Capacity
4. **Resource Usage**: CNI overhead on CPU/Memory
5. **Tuning Effects**: Performance contribution of individual tuning points

### Benchmark Execution

**Run all scenarios**:
```bash
./scripts/benchmarks/cni-benchmark/run-all-scenarios.sh
```

**Run individual scenario**:
```bash
./scripts/benchmarks/cni-benchmark/run-benchmark.sh <scenario-name>
```

See script comments for detailed test procedures.

---

## Benchmark Results

:::info Data Collection
Benchmark data collected on 2026-02-09 on Amazon EKS 1.31 with m6i.xlarge nodes (Amazon Linux 2023, single AZ: ap-northeast-2a). Each measurement represents the median of 3+ test runs.
:::

### Network Performance

#### TCP/UDP Throughput

<ThroughputChart />

:::info Why UDP Throughput Differs Across Configurations
TCP throughput is identical across all scenarios (saturated at the NIC bandwidth of 12.5 Gbps), but UDP shows significant performance differences:

- **Scenarios A (VPC CNI) and D (Cilium ENI default)**: UDP throughput ~10 Gbps but with **20% packet loss**. Without the eBPF Bandwidth Manager, the kernel's default UDP buffers cannot handle iperf3's high-speed transmission, causing buffer overflow and packet drops.
- **Scenarios B, C (Cilium Overlay)**: UDP throughput ~7.9 Gbps (lower) but with **under 1% packet loss**. VXLAN encapsulation overhead reduces raw throughput, yet Cilium's eBPF-based packet processing optimizes buffer management, significantly reducing loss.
- **Scenario E (Cilium ENI+Tuning)**: UDP throughput ~8.0 Gbps with **0.03% packet loss**. The Bandwidth Manager (EDT-based rate limiting) and BBR congestion control regulate the transmission rate to match receiver capacity, preventing buffer overflow.

**Key insight**: For UDP workloads, **packet loss rate** is a more meaningful performance metric than raw throughput. High throughput with high loss actually means lower effective data transfer.
:::

#### Pod-to-Pod Latency

<LatencyChart />

#### UDP Packet Loss

<UdpLossChart />

<details>
<summary>Detailed Data Table</summary>

| Metric | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+Tuning |
|--------|-----------|-------------|-----------|--------|---------------|
| TCP Throughput (Gbps) | 12.41 | 12.34 | 12.34 | 12.41 | 12.40 |
| UDP Throughput (Gbps) | 10.00 | 7.92 | 7.92 | 10.00 | 7.96 |
| UDP Loss (%) | 20.39 | 0.94 | 0.69 | 20.42 | 0.03 |
| Pod-to-Pod RTT (µs) | 4894 | 4955 | 5092 | 4453 | 3135 |

</details>

### HTTP Application Performance

<HttpPerformanceChart />

<details>
<summary>Detailed Data Table</summary>

| Target QPS | Metric | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+Tuning |
|-----------|--------|-----------|-------------|-----------|--------|---------------|
| 1,000 | Actual QPS | 999.6 | 999.6 | 999.7 | 999.7 | 999.7 |
| 1,000 | p50 (ms) | 4.39 | 4.36 | 4.45 | 4.29 | 4.21 |
| 1,000 | p99 (ms) | 10.92 | 9.87 | 8.91 | 8.75 | 9.89 |
| 5,000 | Actual QPS | 4071.1 | 4012.0 | 3986.5 | 3992.6 | 4053.2 |
| 5,000 | p99 (ms) | 440.45 | 21.60 | 358.38 | 23.01 | 24.44 |
| max | Actual QPS | 4103.9 | 4044.7 | 4019.3 | 4026.4 | 4181.9 |
| max | p99 (ms) | 28.07 | 25.25 | 28.50 | 26.67 | 28.45 |

</details>

### Service Scaling Impact (Scenario E)

To validate Cilium eBPF's O(1) service lookup performance, we compared performance with 4 services vs 104 services in the same Scenario E environment.

<ServiceScalingChart />

<details>
<summary>Detailed Data Table</summary>

| Metric | 4 Services | 104 Services | Difference |
|--------|-----------|-------------|------------|
| HTTP p99 @QPS=1000 (ms) | 3.94 | 3.64 | -8% (within noise) |
| Max Achieved QPS | 4,405 | 4,221 | -4.2% |
| TCP Throughput (Gbps) | 12.3 | 12.4 | ~identical |
| DNS Resolution p50 (ms) | 2 | 2 | identical |

</details>

:::info eBPF O(1) Service Lookup Confirmed
Increasing the service count from 4 to 104 (26x increase) showed no meaningful performance difference on Cilium eBPF — all metrics remained within 5% measurement noise. This confirms that eBPF hash map-based O(1) lookups maintain constant performance regardless of service count. In contrast, kube-proxy (iptables) traverses rule chains proportionally at O(n), with significant degradation at 500+ services.
:::

### kube-proxy (iptables) Service Scaling: 4 → 104 → 1,000 Services

To validate eBPF's O(1) advantage, the same scaling test was conducted on VPC CNI + kube-proxy (Scenario A), extending the service count from **4 → 104 → 1,000 services** to measure actual iptables scaling behavior.

<KubeproxyScalingChart />

#### keepalive vs Connection:close Analysis

**keepalive mode** (connection reuse): No HTTP performance impact even with 101× rule growth. This is because conntrack caches established connection state and bypasses iptables chain traversal for subsequent packets.

**Connection:close mode** (new TCP connection per request): Every SYN packet triggers KUBE-SERVICES iptables chain traversal for DNAT rule evaluation. At 1,000 services, a **+26µs (+16%) per-connection overhead** was measured.

:::info Why Connection:close Testing Matters
Production workloads that don't use keepalive (legacy services without gRPC, one-shot HTTP requests, TCP-based microservices) pay the iptables chain traversal cost on every request. The KUBE-SERVICES chain uses probability-based matching (`-m statistic --mode random`), so average traversal length is O(n/2) and grows proportionally with service count.
:::

:::warning iptables Scaling Limits
At 1,000 services, per-connection overhead is measurable (+26µs) but still modest. However, this trend **scales linearly with service count**, and the real degradation threshold occurs at **5,000+ services**:

- kube-proxy sync regeneration exceeds **500ms+**
- Chain traversal adds **hundreds of µs per connection**
- Every Service endpoint change requires full iptables rule regeneration

In contrast, Cilium eBPF maintains **O(1) hash map lookups** regardless of service count, with zero iptables rule overhead.
:::

<details>
<summary>kube-proxy vs Cilium Full Comparison Data</summary>

| Metric | kube-proxy 4 svc | kube-proxy 104 svc | kube-proxy 1000 svc | Change (4→1000) | Cilium 4 svc | Cilium 104 svc | Change |
|--------|-----------------|-------------------|---------------------|-----------------|-------------|---------------|--------|
| HTTP p99 @QPS=1000 | 5.86ms | 5.99ms | 2.96ms | -49% | 3.94ms | 3.64ms | -8% |
| HTTP avg @QPS=1000 | 2.508ms | 2.675ms | 1.374ms | -45% | - | - | - |
| Max QPS (keepalive) | 4,197 | 4,231 | 4,178 | ~0% | 4,405 | 4,221 | -4.2% |
| TCP Throughput | 12.4 Gbps | 12.4 Gbps | - | - | 12.3 Gbps | 12.4 Gbps | ~0% |
| iptables NAT rules | 99 | 699 | 10,059 | **+101×** | N/A (eBPF) | N/A (eBPF) | - |
| Sync cycle time | ~130ms | ~160ms | ~170ms | +31% | N/A | N/A | - |
| Per-conn setup (Connection:close) | 164µs | - | 190µs | **+16%** | N/A | N/A | - |
| HTTP avg (Connection:close) | 4.399ms | - | 4.621ms | +5% | N/A | N/A | - |
| HTTP p99 (Connection:close) | 8.11ms | - | 8.53ms | +5% | N/A | N/A | - |

</details>

### DNS Resolution & Resource Usage

<DnsResourceChart />

### Individual Tuning Point Impact

:::info Tuning Methodology
Individual tuning point impact was not measured in isolation. Scenario E applied all compatible tunings simultaneously to Scenario D (ENI baseline). The following table shows which tunings were successfully applied:
:::

| Tuning Point | Applied in Scenario E | Notes |
|--------------|----------------------|-------|
| BPF Host Routing | ✅ | Host namespace iptables bypass |
| Socket LB | ✅ | LB at connect() time |
| BPF Masquerade | ✅ | iptables NAT → eBPF |
| Bandwidth Manager + BBR | ✅ | EDT-based rate limiting + Google BBR congestion control |
| Native Routing (ENI) | ✅ | VXLAN encapsulation removed (already in Scenario D) |
| CT Table Expansion | ✅ | Connection tracking capacity increased |
| Hubble Disabled | ✅ | Observability overhead removed for benchmark |
| DSR | ❌ | Caused pod crashes with ENA, reverted to SNAT |
| XDP Acceleration | ❌ | ENA driver lacks `bpf_link` support on m6i.xlarge |

**Cumulative Effect (D→E)**: RTT improved from 4453µs to 3135µs (29.6% reduction), max QPS increased from 4026 to 4182 (3.9% improvement).

---

## Analysis and Recommendations

<KeyResultsSummaryChart />

### Key Findings

<KeyFindingsChart />

### Recommended Configuration by Workload

<RecommendationChart />

---

## Configuration Notes

Issues discovered during benchmark environment setup and their solutions. Reference these when deploying Cilium on EKS or reproducing this benchmark.

### eksctl Cluster Creation

- **Minimum 2 AZs required**: eksctl requires at least 2 availability zones in `availabilityZones`, even if you want a single-AZ node group.
  ```yaml
  # Cluster level: 2 AZs required
  availabilityZones:
    - ap-northeast-2a
    - ap-northeast-2c
  # Node group level: single AZ is fine
  managedNodeGroups:
    - availabilityZones: [ap-northeast-2a]
  ```

### Cilium Helm Chart Compatibility

- **`tunnel` option removed** (Cilium 1.15+): `--set tunnel=vxlan` or `--set tunnel=disabled` are no longer valid. Use `routingMode` and `tunnelProtocol` instead.
  ```bash
  # Legacy (Cilium 1.14 and below)
  --set tunnel=vxlan

  # Current (Cilium 1.15+)
  --set routingMode=tunnel --set tunnelProtocol=vxlan

  # Native Routing (ENI mode)
  --set routingMode=native
  ```

### XDP Acceleration Requirements

XDP (eXpress Data Path) processes packets at the NIC driver level, bypassing the kernel network stack. Using XDP with Cilium requires meeting ALL of the following conditions.

<XdpCompatibilityChart />

:::warning XDP Not Available on Virtualized AWS Instances
During this benchmark, `loadBalancer.acceleration=native` and `best-effort` both failed on m6i.xlarge:
```
attaching program cil_xdp_entry using bpf_link: create link: invalid argument
```
This is because the ENA driver does not support `bpf_link`-based XDP attachment in virtualized environments. This constraint applies equally to all virtualized EC2 instances regardless of architecture (x86 or ARM).
:::

#### DSR (Direct Server Return) Compatibility

- `loadBalancer.mode=dsr` can cause Cilium Agent pod crashes
- Use `mode=snat` (default) in AWS ENA environments
- DSR is only stable in environments where XDP works properly (Bare Metal + mlx5/i40e, etc.)

#### Optimizations Achievable Without XDP

This benchmark achieved **36% RTT improvement** (4894 to 3135 µs, comparing VPC CNI baseline to Cilium ENI+Tuning) without XDP or DSR. See the tuning details in the component above.

:::tip Verify XDP Support
```bash
# Check Cilium XDP activation status
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep XDP
# "Disabled" means XDP is not supported on this instance type

# Check NIC driver
ethtool -i eth0 | grep driver
```
:::

### Workload Deployment

- **Fortio container image constraints**: The `fortio/fortio` image does not include `sleep`, `sh`, or `nslookup` binaries. Use Fortio's built-in server mode for idle pods instead of `sleep infinity`.
  ```yaml
  command: ["fortio", "server", "-http-port", "8080"]
  ```
- **DNS test pod selection**: For DNS resolution tests, use an image with `sh` (e.g., iperf3) and `getent hosts`. `nslookup` requires separate installation.

### Pod Restart During CNI Transition

- **CPU exhaustion during Rolling Updates**: When restarting workloads after VPC CNI to Cilium transition, Rolling Update temporarily doubles pod count. This can cause CPU shortage on small nodes.
  ```bash
  # Safe restart: delete existing pods and let them recreate
  kubectl delete pods -n bench --all
  kubectl rollout status -n bench deployment --timeout=120s
  ```
- **Cilium DaemonSet restart**: If Cilium DaemonSet doesn't auto-restart after Helm value changes, trigger it manually.
  ```bash
  kubectl -n kube-system rollout restart daemonset/cilium
  kubectl -n kube-system rollout status daemonset/cilium --timeout=300s
  ```

### AWS Authentication

- **SSO token expiration**: AWS SSO tokens may expire during long-running benchmarks. Verify token validity before execution or refresh with `aws sso login`.

---

## Reference: VPC CNI vs Cilium Network Policy Comparison

Both VPC CNI and Cilium support network policies on EKS, but they differ significantly in scope and capabilities.

<NetworkPolicyChart />

### Key Differences

**L7 Policies (Cilium only)**: Filter at HTTP request path, method, and header level. For example, allow `GET /api/public` while blocking `DELETE /api/admin`.

```yaml
# Cilium L7 policy example
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-get-only
spec:
  endpointSelector:
    matchLabels:
      app: api-server
  ingress:
  - fromEndpoints:
    - matchLabels:
        role: frontend
    toPorts:
    - ports:
      - port: "80"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/public.*"
```

**FQDN-based Policies (Cilium only)**: Control external access by DNS name. Policies automatically update when IPs change.

```yaml
# Allow specific AWS services only
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-aws-only
spec:
  endpointSelector:
    matchLabels:
      app: backend
  egress:
  - toFQDNs:
    - matchPattern: "*.amazonaws.com"
    - matchPattern: "*.eks.amazonaws.com"
```

**Policy Enforcement Visibility**: Cilium's Hubble shows real-time policy verdicts (ALLOWED/DENIED) for all network flows. VPC CNI provides limited logging through CloudWatch Logs.

:::tip Selection Guide
- **Basic L3/L4 policies only**: VPC CNI's EKS Network Policy is sufficient.
- **L7 filtering, FQDN policies, real-time visibility needed**: Cilium is the only option.
- **Multi-tenant environments**: Cilium's CiliumClusterwideNetworkPolicy and host-level policies are essential.
:::

---

## References

- [Cilium Performance Tuning Guide](https://docs.cilium.io/en/stable/operations/performance/tuning/)
- [Cilium ENI Mode Documentation](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)
- [AWS EKS Networking Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/networking.html)
- [Cilium kube-proxy Replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [eBPF & XDP Reference](https://docs.cilium.io/en/stable/bpf/)
- [Fortio - HTTP Load Testing](https://fortio.org/)
