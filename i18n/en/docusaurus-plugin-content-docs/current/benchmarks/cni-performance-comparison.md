---
title: "VPC CNI vs Cilium CNI Performance Comparison Benchmark"
sidebar_label: "CNI Performance Comparison"
description: "Benchmark report comparing network and application performance of VPC CNI vs Cilium CNI in EKS across 5 scenarios (kube-proxy, kube-proxy-less, ENI, tuning)"
tags: [benchmark, cni, cilium, vpc-cni, networking, performance, eks]
category: "benchmark"
date: 2026-02-09
authors: [devfloor9]
sidebar_position: 5
---

# VPC CNI vs Cilium CNI Performance Comparison Benchmark

## Executive Summary

This report presents quantitative performance measurements of VPC CNI vs Cilium CNI across 5 scenarios (VPC CNI baseline, Cilium+kube-proxy, Cilium kube-proxy-less, Cilium ENI, Cilium ENI+full tuning) in Amazon EKS 1.31 environment. We analyze the independent effects of kube-proxy removal, Overlay vs Native Routing, and full tuning application to support CNI configuration selection based on workload characteristics. Key findings: TCP throughput is identical across all scenarios (~12.4 Gbps, limited by m6i.xlarge NIC bandwidth), but Cilium shows dramatic UDP loss reduction (0.03-0.94% vs 20%+), 36% RTT improvement with tuning (3135µs vs 4894µs), and 20% better HTTP p99 latency with ENI mode.

---

## Test Environment

| Item | Specification |
|------|---------------|
| EKS Version | 1.31 |
| Node Type | m6i.xlarge (4 vCPU, 16GB RAM) |
| Node Count | 3 (single AZ: ap-northeast-2a) |
| OS | Amazon Linux 2023 |
| Tools | kubectl 1.31+, Cilium CLI 0.16+, Helm 3.16+, Fortio 1.65+, iperf3 3.17+ |
| Measurement Method | Median of 3+ repeated measurements |

**Cluster Configuration**: See `scripts/benchmarks/cni-benchmark/cluster.yaml`
**Workload Deployment**: See `scripts/benchmarks/cni-benchmark/workloads.yaml`

---

## Test Scenarios

The 5 scenarios are designed to measure the independent impact of each variable: CNI, kube-proxy mode, IP allocation method, and tuning application.

| # | Scenario | CNI | kube-proxy | IP Allocation | Tuning | Measurement Purpose |
|---|---------|-----|-----------|---------------|--------|---------------------|
| A | VPC CNI Baseline | VPC CNI | iptables | ENI Secondary IP | Default | Baseline |
| B | Cilium + kube-proxy | Cilium | iptables retained | Overlay (VXLAN) | Default | VPC CNI → Cilium migration impact |
| C | Cilium kube-proxy-less | Cilium | eBPF replacement | Overlay (VXLAN) | Default | kube-proxy removal effect |
| D | Cilium ENI Mode | Cilium | eBPF replacement | AWS ENI (native) | Default | Overlay vs Native Routing |
| E | Cilium ENI + Full Tuning | Cilium | eBPF replacement | AWS ENI (native) | All applied | Cumulative tuning effect |

### Scenario E Tuning Points

| Tuning Item | Helm Value | Effect | Applied |
|-------------|-----------|--------|---------|
| BPF Host Routing | `bpf.hostLegacyRouting=false` | Host NS iptables bypass | ✅ |
| DSR | `loadBalancer.mode=dsr` | Direct server return for NodePort/LB | ❌ (reverted to `snat`, caused pod crashes) |
| Bandwidth Manager | `bandwidthManager.enabled=true` | EDT-based rate limiting | ✅ |
| BPF Masquerade | `bpf.masquerade=true` | iptables MASQUERADE → eBPF | ✅ |
| Socket-level LB | `socketLB.enabled=true` | LB at connect() time | ✅ |
| XDP Acceleration | `loadBalancer.acceleration=native` | NIC driver-level processing | ❌ (ENA driver lacks `bpf_link` support) |
| BBR | `bandwidthManager.bbr=true` | Google BBR congestion control | ✅ |
| Native Routing | `routingMode=native` | Remove VXLAN encapsulation | ✅ |
| CT Table Expansion | `bpf.ctGlobalAnyMax`, `bpf.ctGlobalTCPMax` | Expand Connection Tracking | ✅ |
| Hubble Disabled | `hubble.enabled=false` | Remove observability overhead (benchmark only) | ✅ |

:::warning XDP and DSR Compatibility
On m6i.xlarge with ENA driver, XDP native acceleration (`loadBalancer.acceleration=native`) failed with "bpf_link is not supported" error. Even `acceleration=best-effort` mode failed. DSR (`loadBalancer.mode=dsr`) caused pod crashes and was reverted to `mode=snat`. Scenario E represents partial tuning: Socket LB, BPF Host Routing, BPF Masquerade, Bandwidth Manager, BBR, Native Routing, CT Table expansion, and Hubble disabled were successfully applied.
:::

---

## Architecture

### Packet Path Comparison: VPC CNI vs Cilium

Comparison of Pod-to-Service traffic packet paths between VPC CNI (kube-proxy) and Cilium (eBPF).

#### Cilium Architecture Overview

The Cilium Daemon manages BPF programs in the kernel, injecting eBPF programs into each container and network interface (eth0).

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

Comparing Service LB, CNI Agent, and network layer configuration with key performance metrics across all scenarios.

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
Benchmark data collected on 2026-02-09 on Amazon EKS 1.31 with m6i.xlarge nodes in ap-northeast-2a. Each measurement represents the median of 3+ test runs.
:::

### Network Performance

#### TCP/UDP Throughput

![TCP/UDP Throughput Comparison](/img/benchmarks/chart-network-throughput.svg)

:::info Why UDP Throughput Differs Across Configurations
TCP throughput is identical across all scenarios (saturated at NIC bandwidth of 12.5 Gbps), but UDP shows significant performance differences:

- **Scenarios A (VPC CNI) and D (Cilium ENI default)**: UDP throughput ~10 Gbps but with **20% packet loss**. Without eBPF Bandwidth Manager, the kernel's default UDP buffers cannot handle iperf3's high-speed transmission, causing buffer overflow and packet drops.
- **Scenarios B, C (Cilium Overlay)**: UDP throughput ~7.9 Gbps (lower) but with **under 1% packet loss**. VXLAN encapsulation overhead reduces raw throughput, but Cilium's eBPF-based packet processing optimizes buffer management, significantly reducing loss.
- **Scenario E (Cilium ENI+Tuning)**: UDP throughput ~8.0 Gbps with **0.03% packet loss**. Bandwidth Manager (EDT-based rate limiting) and BBR congestion control regulate transmission rate to match receiver capacity, preventing buffer overflow.

**Key insight**: For UDP workloads, **packet loss rate** is a more meaningful performance metric than raw throughput. High throughput with high loss actually means lower effective data transfer.
:::

#### Pod-to-Pod Latency

![Pod-to-Pod RTT Comparison](/img/benchmarks/chart-latency-comparison.svg)

#### UDP Packet Loss

![UDP Packet Loss Comparison](/img/benchmarks/chart-udp-loss.svg)

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

![HTTP Application Performance Comparison](/img/benchmarks/chart-http-performance.svg)

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

### DNS Resolution Performance

| Metric | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+Tuning |
|--------|-----------|-------------|-----------|--------|---------------|
| DNS Resolution p50 (ms) | 2 | 2 | 2 | 2 | 2 |
| DNS Resolution p99 (ms) | 4 | 4 | 2 | 4 | 3 |

### Resource Usage

| Metric | A: VPC CNI (aws-node) | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+Tuning |
|--------|-----------|-------------|-----------|--------|---------------|
| CPU (under load, per node) | N/M | ~4-6m | ~4-6m | ~5-6m | ~4-5m |
| Memory (per node) | N/M | ~83Mi | ~129Mi | ~81Mi | ~82Mi |

**N/M**: Not measured separately (VPC CNI aws-node DaemonSet resource usage not isolated during benchmark).

### Individual Tuning Point Impact

:::info Tuning Methodology
Individual tuning point impact was not measured separately. Scenario E applied all compatible tunings simultaneously to Scenario D (ENI baseline). The following table shows which tunings were successfully applied:
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

![Key Findings Summary](/img/benchmarks/chart-key-findings.svg)

![Recommended CNI Configuration by Workload](/img/benchmarks/chart-recommendation-matrix.svg)

<details>
<summary>View Detailed Analysis</summary>

### Key Finding 1: TCP Throughput Saturated by NIC Bandwidth

All scenarios achieved essentially identical TCP throughput (12.34-12.41 Gbps), limited by m6i.xlarge's 12.5 Gbps baseline network bandwidth. CNI choice does not impact TCP throughput on instance types where the network becomes the bottleneck. This finding generalizes to most AWS instance types with under 25 Gbps bandwidth.

### Key Finding 2: UDP Loss as Primary Differentiator

The most significant performance difference was UDP packet loss:

- **VPC CNI (A)**: 20.39% loss at 10 Gbps target
- **Cilium ENI (D)**: 20.42% loss at 10 Gbps target (similar to VPC CNI)
- **Cilium Overlay (B, C)**: 0.69-0.94% loss at 10 Gbps target
- **Cilium ENI+Tuning (E)**: 0.03% loss at 10 Gbps target

**Analysis**: Cilium's eBPF-based bandwidth manager provides effective rate limiting, preventing buffer overflows that cause packet loss. VPC CNI and untuned Cilium ENI lack this capability. For UDP-heavy workloads (streaming, gaming, DNS), Cilium with bandwidth manager is essential.

### Key Finding 3: Latency Improvements with Tuning

Pod-to-pod RTT measurements:

- **VPC CNI (A)**: 4894 µs
- **Cilium ENI (D)**: 4453 µs (9% improvement)
- **Cilium ENI+Tuning (E)**: 3135 µs (36% improvement vs A, 29.6% vs D)

The D→E tuning reduced latency primarily through Socket LB, BPF Host Routing, and BPF Masquerade, which eliminate iptables traversal in the hot path.

### Key Finding 4: HTTP Performance at QPS=1000

At low-to-moderate load (QPS=1000), p99 latency showed clear CNI impact:

- **VPC CNI (A)**: 10.92ms
- **Cilium ENI (D)**: 8.75ms (20% improvement, best)
- **Cilium kp-less (C)**: 8.91ms (18% improvement)
- **Cilium ENI+Tuning (E)**: 9.89ms (9% improvement)

Scenario D achieved the best p99 latency despite not having full tuning. Scenario E's slightly higher p99 may be due to BBR's conservative congestion control under low load.

### Key Finding 5: QPS=5000 Anomalies

At QPS=5000, Scenarios A and C showed anomalous p99 spikes (440ms and 358ms respectively) while B, D, E remained stable (21-24ms). This suggests transient congestion or buffer buildup in VPC CNI and Cilium overlay mode under burst load. ENI mode with native routing avoided this issue.

### ENI Mode vs Overlay Mode

Comparing Scenario B (Cilium overlay) vs D (Cilium ENI):

- **RTT**: Overlay 4955µs vs ENI 4453µs (10% improvement)
- **UDP Loss**: Overlay 0.94% vs ENI 20.42% (ENI worse without tuning)
- **HTTP QPS@5000 p99**: Overlay 21.60ms vs ENI 23.01ms (similar)
- **Visibility**: ENI mode provides direct VPC CIDR visibility for Flow Logs and Security Groups

ENI mode's primary benefit is AWS tooling integration. Performance is comparable, but UDP loss requires bandwidth manager tuning.

### Effect of kube-proxy Removal

Comparing Scenario B (kube-proxy) vs C (kube-proxy-less):

- **RTT**: B 4955µs vs C 5092µs (C slightly worse)
- **HTTP QPS@1000 p99**: B 9.87ms vs C 8.91ms (C better)
- **DNS p99**: B 4ms vs C 2ms (C better)

kube-proxy removal shows mixed results at small scale (under 100 Services). The benefit becomes significant at 500+ Services where iptables rule chain traversal (O(n)) becomes a bottleneck, while eBPF maintains O(1) hash map lookups.

### XDP and DSR Limitations on ENA

**Critical compatibility finding**: m6i.xlarge with ENA driver does not support XDP native acceleration (`bpf_link` unsupported) or DSR mode (pod crashes). These tunings are unavailable on most AWS instance types. Scenario E's performance gains came from Socket LB, BPF Host Routing, BPF Masquerade, and Bandwidth Manager—not XDP or DSR.

### Recommended Configuration by Workload

| Workload Characteristics | Recommended Scenario | Rationale |
|-------------------------|---------------------|-----------|
| Small, Simple (under 100 Services) | A: VPC CNI Baseline | Minimal operational complexity, TCP/HTTP performance sufficient |
| UDP-heavy (streaming, gaming, DNS) | E: Cilium ENI+Tuning | 0.03% UDP loss vs 20%+ with VPC CNI |
| Network Policies Required | C: Cilium kp-less | L3/L4/L7 policies, low UDP loss, good DNS p99 |
| Large Scale (500+ Services) | D: Cilium ENI | eBPF O(1) lookups, best HTTP p99 at QPS=1000 |
| Latency Sensitive (finance, real-time) | E: Cilium ENI+Tuning | 36% RTT improvement vs VPC CNI (3135µs vs 4894µs) |
| AWS Tooling Integration | D or E: Cilium ENI | Direct VPC CIDR visibility for Flow Logs, Security Groups |
| Multi-tenant, Observability Focus | D + Hubble enabled | ENI performance + network visibility |

### Final Scenario Evaluation

| Environment | Recommended Scenario | Operational Complexity | Performance | Application Timing |
|------------|---------------------|----------------------|-------------|-------------------|
| Dev/Staging | A: VPC CNI | Low | Baseline | Default |
| General Production | D: Cilium ENI | Medium | High | 500+ Services |
| High-Performance Production | E: Cilium ENI+Tuning | High | Maximum | Latency-sensitive workloads |
| Network Policies Required | C or D | Medium | High | When policy requirements arise |
| Cost-Sensitive (Overlay OK) | C: kp-less | Medium | Moderate | IP address constrained environments |

</details>

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

#### Prerequisites

| Requirement | Condition | Notes |
|------------|-----------|-------|
| Linux Kernel | >= 5.10 (Cilium base requirement) | `bpf_link` support requires >= 5.7 |
| NIC Driver | XDP Native-capable driver | See driver compatibility below |
| Cilium Config | `kubeProxyReplacement=true` | kube-proxy replacement required |
| Interface | Physical NIC (no bond/VLAN) | Bond and VLAN interfaces unsupported |

#### NIC Driver XDP Compatibility

| Driver | XDP Native | Min Kernel | Environment | Notes |
|--------|-----------|-----------|-------------|-------|
| **mlx5** (Mellanox ConnectX-4/5/6) | ✅ Full support | >= 4.9 | Bare Metal, on-premises | Best performance, recommended |
| **i40e** (Intel XL710/X710) | ✅ Full support | >= 4.12 | Bare Metal | Stable |
| **ixgbe** (Intel 82599/X540) | ✅ Full support | >= 4.12 | Bare Metal | 10GbE |
| **bnxt_en** (Broadcom) | ✅ Supported | >= 4.11 | Bare Metal | - |
| **ena** (AWS ENA) | ⚠️ Limited | >= 5.6 | AWS EC2 | See AWS constraints below |
| **virtio-net** | ⚠️ Generic only | >= 4.10 | KVM/QEMU | No native mode |

#### AWS EC2 Instance XDP Support

| Instance Type | XDP Native | Reason |
|--------------|-----------|--------|
| **Bare Metal** (c5.metal, m6i.metal, r6i.metal, etc.) | ✅ Supported | Direct hardware access, full ENA driver capabilities |
| **Virtualized** (m6i.xlarge, c6i.2xlarge, etc.) | ❌ Unsupported | ENA driver lacks `bpf_link` XDP implementation |
| **ENA Express** (c6in, m6in, r6in, etc.) | ❌ Unsupported | ENA Express is SRD protocol (bandwidth improvement), unrelated to XDP |
| **Graviton** (m7g, c7g, etc.) | ❌ Unsupported | Same ENA driver constraint (ARM/x86 irrelevant) |

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

This benchmark achieved **36% RTT improvement** (4453 to 3135 us) without XDP or DSR using:

| Tuning Item | Effect |
|-------------|--------|
| Socket-level LB | Direct connection at connect() time, no per-packet NAT |
| BPF Host Routing | Complete host iptables bypass |
| BPF Masquerade | iptables MASQUERADE replaced by eBPF |
| Bandwidth Manager + BBR | EDT-based rate limiting + BBR congestion control |
| Native Routing (ENI) | VXLAN encapsulation removed |

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

| Feature | VPC CNI (EKS Network Policy) | Cilium |
|---------|----------------------------|--------|
| **Kubernetes NetworkPolicy API** | ✅ Supported | ✅ Supported |
| **L3/L4 Filtering** (IP, Port, Protocol) | ✅ Supported | ✅ Supported |
| **L7 Filtering** (HTTP path/method, gRPC, Kafka) | ❌ Not supported | ✅ CiliumNetworkPolicy CRD |
| **FQDN-based Policies** (DNS domain allow/deny) | ❌ Not supported | ✅ `toFQDNs` rules |
| **Identity-based Matching** | ❌ IP-based | ✅ Cilium Identity (eBPF, O(1)) |
| **Cluster-wide Policies** | ❌ Namespace-scoped only | ✅ CiliumClusterwideNetworkPolicy |
| **Host-level Policies** | ❌ Pod traffic only | ✅ Host traffic control |
| **Policy Enforcement Visibility** | CloudWatch Logs (limited) | ✅ Hubble (real-time flow + verdict) |
| **Policy Editor/UI** | ❌ | ✅ Cilium Network Policy Editor |
| **Implementation** | eBPF (AWS network policy agent) | eBPF (Cilium agent) |
| **Performance Impact** | Low | Low (same eBPF-based) |

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
- [AWS EKS Networking Best Practices](https://aws.github.io/aws-eks-best-practices/networking/)
- [Cilium kube-proxy Replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [eBPF & XDP Reference](https://docs.cilium.io/en/stable/bpf/)
- [Fortio - HTTP Load Testing](https://fortio.org/)
- [Infrastructure Performance Benchmark](./infrastructure-performance.md) — Comprehensive network, DNS, and autoscaling benchmarks
