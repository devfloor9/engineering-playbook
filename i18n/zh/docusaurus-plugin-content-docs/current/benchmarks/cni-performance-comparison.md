---
title: "VPC CNI vs Cilium CNI 性能比较基准测试"
sidebar_label: "2. CNI 性能比较"
description: "EKS 环境中 VPC CNI 和 Cilium CNI 的网络及应用性能通过5个场景（kube-proxy、kube-proxy-less、ENI、调优）比较的基准测试报告"
tags: [benchmark, cni, cilium, vpc-cni, networking, performance, eks]
category: "benchmark"
last_update:
  date: 2026-02-09
  author: devfloor9
sidebar_position: 2
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
import CniConclusionInfographic from '@site/src/components/CniConclusionInfographic';

# VPC CNI vs Cilium CNI 性能比较基准测试

> 📅 **编写日期**: 2026-02-09 | ✍️ **作者**: devfloor9 | ⏱️ **阅读时间**: 约25分钟

## 概述

Amazon EKS 1.31 环境中通过5个场景对 VPC CNI 和 Cilium CNI 性能进行定量比较的基准测试报告。

<CniConclusionInfographic locale="zh" />

**5个场景**:

- **A** VPC CNI 基本配置（基准）
- **B** Cilium + kube-proxy（测量转换影响）
- **C** Cilium kube-proxy-less（kube-proxy 移除效果）
- **D** Cilium ENI 模式（Overlay vs Native Routing）
- **E** Cilium ENI + 完整调优（累积优化效果）

**主要启示**:

<OverviewSummaryChart locale="zh" />

<AimlRelevanceChart locale="zh" />

---

## 测试环境

<TestEnvironmentChart locale="zh" />

**集群配置**: 参见 `scripts/benchmarks/cni-benchmark/cluster.yaml`
**工作负载部署**: 参见 `scripts/benchmarks/cni-benchmark/workloads.yaml`

---

## 测试场景

5个场景组合了 CNI、kube-proxy 模式、IP 分配方式、调优应用与否，设计用于测量各变量的独立影响。

<ScenarioComparisonChart locale="zh" />

### 场景 E 调优点

<TuningPointsChart locale="zh" />

:::warning XDP 和 DSR 兼容性限制
m6i.xlarge 实例的 ENA 驱动不支持 XDP `bpf_link` 功能，无法使用 XDP acceleration（native/best-effort）。DSR 模式也会导致 Pod 崩溃，因此回退到基本 SNAT 模式。场景 E 是应用其余8项调优的结果。
:::

---

## 架构

### 数据包路径比较：VPC CNI vs Cilium

比较 VPC CNI（kube-proxy）和 Cilium（eBPF）中 Pod-to-Service 流量的数据包路径差异。

#### Cilium 架构概述

Cilium Daemon 管理内核的 BPF 程序，并向每个容器和网络接口（eth0）注入 eBPF 程序。

![Cilium Architecture](/img/benchmarks/cilium-arch.png)
*来源: [Cilium Component Overview](https://docs.cilium.io/en/stable/overview/component-overview.html)*

#### Cilium eBPF 数据包路径

在 Pod-to-Pod 通信中，eBPF 程序附加到 veth pair（lxc）完全绕过 iptables。下图显示了 Endpoint 之间的直接通信路径。

![Cilium eBPF Endpoint-to-Endpoint](/img/benchmarks/cilium_bpf_endpoint.svg)
*来源: [Cilium - Life of a Packet](https://docs.cilium.io/en/stable/network/ebpf/lifeofapacket.html)*

#### Cilium Native Routing（ENI 模式）

在 Native Routing 模式下，Pod 流量直接通过主机的路由表转发，无需 VXLAN 封装。在 ENI 模式下，Pod IP 直接从 VPC CIDR 分配。

![Cilium Native Routing](/img/benchmarks/cilium_native_routing.png)
*来源: [Cilium Routing](https://docs.cilium.io/en/stable/network/concepts/routing.html)*

#### Cilium ENI IPAM 架构

Cilium Operator 通过 EC2 API 从 ENI 分配 IP，并通过 CiliumNode CRD 向各节点的 Agent 提供 IP Pool。

![Cilium ENI Architecture](/img/benchmarks/cilium_eni_arch.png)
*来源: [Cilium ENI Mode](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)*

### 5个场景的数据平面堆栈

比较各场景的 Service LB、CNI Agent、网络层配置和主要性能指标。

![数据平面堆栈比较](/img/benchmarks/dataplane-stack-comparison.svg)

---

## 测试方法

### 测试工作负载

- **httpbin**: HTTP 回显服务器（2个副本）
- **Fortio**: HTTP 负载生成器
- **iperf3**: 网络吞吐量测量服务器/客户端

### 测量指标

1. **网络性能**: TCP/UDP 吞吐量、Pod-to-Pod 延迟（p50/p99）、连接建立速率
2. **HTTP 性能**: 按 QPS 的吞吐量和延迟（Fortio → httpbin）
3. **DNS 性能**: 解析延迟（p50/p99）、QPS 容量
4. **资源使用**: CNI 本身的 CPU/内存开销
5. **调优效果**: 各调优点的性能贡献度

### 基准测试执行

**批量执行所有场景**:

```bash
./scripts/benchmarks/cni-benchmark/run-all-scenarios.sh
```

**执行单个场景**:

```bash
./scripts/benchmarks/cni-benchmark/run-benchmark.sh <scenario-name>
```

详细测试步骤请参见脚本内部注释。

---

## 基准测试结果

:::info 数据收集完成
以下结果在 2026-02-09 EKS 1.31 环境（m6i.xlarge、Amazon Linux 2023、单一 AZ）中测量。每个指标至少重复测量3次后使用中位数。
:::

### 网络性能

#### TCP/UDP 吞吐量

<ThroughputChart />

:::info UDP 数据包丢失差异是功能差异而非性能差异
TCP 在所有场景下都饱和到 NIC 带宽（12.5 Gbps）没有差异，这代表了实际的 CNI 性能。在 UDP 中观察到的数据包丢失率差异应在以下背景下理解：

- **iperf3 测试的特殊性**: iperf3 以可能的最大速度发送 UDP 数据包，故意使网络饱和。这在实际生产工作负载中几乎不会发生的极端条件。
- **缓冲区溢出是原因**: 场景 A（VPC CNI）和 D（Cilium ENI 基本）中发生20%的数据包丢失是因为内核 UDP 缓冲区无法处理高速传输而发生溢出。
- **Bandwidth Manager 是功能**: 场景 E 中丢失率降至0.03%是因为 Bandwidth Manager（基于 EDT 的速率限制）将传输速度调整为接收处理能力。这是 Cilium 的**附加功能**，而不意味着 CNI 本身的性能优势。

**结论**: 在一般生产工作负载中，UDP 数据包丢失差异难以感知。只有在需要 Bandwidth Manager 的情况下（大容量媒体流等极端 UDP 工作负载），Cilium 的该功能才有意义。
:::

#### Pod-to-Pod 延迟

<LatencyChart />

#### UDP 数据包丢失率

<UdpLossChart />

<details>
<summary>详细数据表</summary>

| 指标 | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+调优 |
|--------|-----------|-------------|-----------|--------|------------|
| TCP 吞吐量 (Gbps) | 12.41 | 12.34 | 12.34 | 12.41 | 12.40 |
| UDP 吞吐量 (Gbps) | 10.00 | 7.92 | 7.92 | 10.00 | 7.96 |
| UDP 丢失 (%) | 20.39 | 0.94 | 0.69 | 20.42 | 0.03 |
| Pod-to-Pod RTT p50 (µs) | 4894 | 4955 | 5092 | 4453 | 3135 |
| Pod-to-Pod RTT p99 (µs) | 4894 | 4955 | 5092 | 4453 | 3135 |

:::note TCP 吞吐量饱和
m6i.xlarge 的基准网络带宽为 12.5 Gbps。所有场景下的 TCP 吞吐量都达到了这个极限，因此未出现 CNI 之间的差异。
:::

</details>

### HTTP 应用性能

<HttpPerformanceChart />

<details>
<summary>详细数据表</summary>

| QPS 目标 | 指标 | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+调优 |
|---------|--------|-----------|-------------|-----------|--------|------------|
| 1,000 | 实际 QPS | 999.6 | 999.6 | 999.7 | 999.7 | 999.7 |
| 1,000 | p50 (ms) | 4.39 | 4.36 | 4.45 | 4.29 | 4.21 |
| 1,000 | p99 (ms) | 10.92 | 9.87 | 8.91 | 8.75 | 9.89 |
| 5,000 | 实际 QPS | 4071.1 | 4012.0 | 3986.5 | 3992.6 | 4053.2 |
| 5,000 | p99 (ms) | 440.45 | 21.60 | 358.38 | 23.01 | 24.44 |
| Max | 实际 QPS | 4103.9 | 4044.7 | 4019.3 | 4026.4 | 4181.9 |
| Max | p99 (ms) | 28.07 | 25.25 | 28.50 | 26.67 | 28.45 |

:::caution QPS=5000 以上负载时的波动性
场景 A 和 C 在 QPS=5000 测试时 p99 测量异常高（440ms、358ms）。推测为暂时的网络拥塞，在 Max QPS 测试（实测约4000QPS）中回归到正常水平（25-28ms）。为了可重现的比较，建议使用 QPS=1000 结果作为主要指标。
:::

</details>

### 服务数量扩展对性能的影响（场景 E）

为了验证 Cilium eBPF 的 O(1) 服务查找性能，在相同的场景 E 环境下将服务数从4个更改为104个后进行性能比较。

<ServiceScalingChart />

<details>
<summary>详细数据表</summary>

| 指标 | 4个服务 | 104个服务 | 差异 |
|--------|-----------|-------------|------|
| HTTP p99 @QPS=1000 (ms) | 3.94 | 3.64 | -8%（测量误差范围） |
| 最大达到 QPS | 4,405 | 4,221 | -4.2% |
| TCP 吞吐量 (Gbps) | 12.3 | 12.4 | ~相同 |
| DNS 解析 p50 (ms) | 2 | 2 | 相同 |

</details>

:::info eBPF O(1) 服务查找确认
在 Cilium eBPF 环境下，即使服务数从4个增加到104个（26倍），所有指标都在测量误差范围（5%以内）内相同。这确认了基于 eBPF 哈希映射的 O(1) 查找无论服务数如何都保持恒定性能。但是，如下面的 kube-proxy 扩展测试所示，iptables 方式的开销在1000个服务级别上也实际上微不足道，因此除非服务数扩展到数千个以上，这种差异影响实际性能的可能性很低。
:::

### kube-proxy（iptables）服务扩展：4 → 104 → 1,000个

为了对比验证 eBPF 的 O(1) 优势，在 VPC CNI + kube-proxy（场景 A）中将服务数扩展为 **4个 → 104个 → 1,000个**，测量性能变化。

<KubeproxyScalingChart locale="zh" />

#### keepalive vs Connection:close 比较分析

**keepalive 模式**（重用现有连接）：即使 iptables 规则增加101倍，也不影响 HTTP 性能。这是因为 conntrack 缓存已建立连接的数据包，绕过 iptables 链遍历。

**Connection:close 模式**（每个请求建立新的 TCP 连接）：所有 SYN 数据包都遍历 KUBE-SERVICES iptables 链以评估 DNAT 规则。在1000个服务中测量到**每连接 +26µs（+16%）**的开销。

:::info 为什么 Connection:close 测试很重要？
在生产环境中不使用 keepalive 的工作负载（未使用 gRPC 的传统服务、一次性 HTTP 请求、基于 TCP 的微服务等）每个请求都要支付 iptables 链遍历成本。KUBE-SERVICES 链使用基于概率的匹配（`-m statistic --mode random`），因此平均遍历长度为 O(n/2)，随服务数增加而增加。
:::

:::note iptables 扩展特性
在1000个服务规模下，每连接开销测量为 +26µs（+16%），但绝对值为**非常微小的水平**。这在大多数生产环境中难以感知。理论上具有随服务数线性增加的 O(n) 特性，因此在数千个以上的服务中可能会有累积影响，但在一般的 EKS 集群（数百个服务）中很难体验到 iptables 和 eBPF 之间的实质性性能差异。Cilium eBPF 的 O(1) 查找在**为大规模服务环境做未来准备（future-proofing）**方面具有意义。
:::

<details>
<summary>kube-proxy vs Cilium 完整比较数据</summary>

| 指标 | kube-proxy 4个 | kube-proxy 104个 | kube-proxy 1000个 | 变化（4→1000） | Cilium 4个 | Cilium 104个 | 变化 |
|--------|---------------|-----------------|------------------|--------------|-----------|-------------|------|
| HTTP p99 @QPS=1000 | 5.86ms | 5.99ms | 2.96ms | -49% | 3.94ms | 3.64ms | -8% |
| HTTP avg @QPS=1000 | 2.508ms | 2.675ms | 1.374ms | -45% | - | - | - |
| 最大 QPS（keepalive） | 4,197 | 4,231 | 4,178 | ~0% | 4,405 | 4,221 | -4.2% |
| TCP 吞吐量 | 12.4 Gbps | 12.4 Gbps | - | - | 12.3 Gbps | 12.4 Gbps | ~0% |
| iptables NAT 规则数 | 99 | 699 | 10,059 | **+101倍** | N/A（eBPF） | N/A（eBPF） | - |
| 同步周期时间 | ~130ms | ~160ms | ~170ms | +31% | N/A | N/A | - |
| 每连接建立时间（Connection:close） | 164µs | - | 190µs | **+16%** | N/A | N/A | - |
| HTTP avg（Connection:close） | 4.399ms | - | 4.621ms | +5% | N/A | N/A | - |
| HTTP p99（Connection:close） | 8.11ms | - | 8.53ms | +5% | N/A | N/A | - |

</details>

### DNS 解析性能和资源使用

<DnsResourceChart locale="zh" />

### 调优点的影响度

:::warning 未测量单个调优效果
本基准测试测量了场景 E 中同时应用所有调优的**累积效果**。未执行单独应用每个调优选项以测量独立贡献度的工作。场景 E 的整体性能改进（RTT 36%、p99 20%）是8项调优的复合结果。
:::

**场景 E 中应用的调优**:

- ✅ Socket-level LB、BPF Host Routing、BPF Masquerade、Bandwidth Manager、BBR、Native Routing、CT Table 扩展、Hubble 禁用
- ❌ XDP Acceleration、DSR（由于 ENA 驱动兼容性限制未应用）

**ENA 驱动 XDP 限制**:
m6i.xlarge 的 ENA 驱动不支持 `bpf_link` 功能，XDP native 和 best-effort 模式均失败。DSR 模式也导致 Pod 崩溃，回退到 SNAT 模式。需要在未来 NIC 驱动更新时重新尝试。

---

## 核心结论：性能差异 vs 功能差异

本次基准测试最重要的结论是 **VPC CNI 和 Cilium CNI 之间几乎没有实质性性能差异**。

| 项目 | 结果 | 解释 |
|------|------|------|
| TCP 吞吐量 | 所有场景相同（12.4 Gbps） | 饱和到 NIC 带宽，与 CNI 无关 |
| HTTP p99 @QPS=1000 | 8.75~10.92ms（场景间波动） | 测量误差范围内 |
| UDP 数据包丢失 | VPC CNI 20% vs Cilium 调优 0.03% | Bandwidth Manager 功能有无差异（iperf3 极端条件） |
| 服务扩展 | iptables +26µs/连接 @1,000个 | 可测量但实际环境中微不足道 |

:::tip AI/ML 实时推理工作负载中的意义
但是，在**基于 HTTP/gRPC 的实时推理服务**环境中，RTT 改进（4,894→3,135µs，约36%）和 HTTP p99 延迟减少（10.92→8.75ms，约20%）的累积可能是有意义的。在 Agentic AI 工作负载中，一个请求**经过多个微服务的 multi-hop 通信模式**（例如：Gateway → Router → vLLM → RAG → Vector DB），每个 hop 节省的延迟会累积，因此在整个 end-to-end 响应时间中可能会产生可感知的差异。在需要超低延迟的实时推理服务中，需要考虑这一点。
:::

**选择两种 CNI 时应考虑的真正差异是功能：**

- **L7 网络策略**（基于 HTTP 路径/方法的过滤）
- **基于 FQDN 的 Egress 策略**（通过域名控制外部访问）
- **基于 eBPF 的可观察性**（通过 Hubble 实时网络流可见性）
- **Hubble 网络映射** — 基于 eBPF 在内核级别收集数据包元数据，因此与 sidecar 代理方式相比**开销极低**，可以实时可视化服务间通信流、依赖关系、策略判定（ALLOWED/DENIED）。即使没有单独的服务网格也能获得网络拓扑图，这在运维可见性方面是一大优势。
- **kube-proxy-less 架构**（减少运维复杂度，为大规模环境做未来准备）
- **Bandwidth Manager**（极端 UDP 工作负载的 QoS 控制）

如果目的是性能优化，那么**应用调优、实例类型选择、网络拓扑优化**比 CNI 选择的影响要大得多。但是在 multi-hop 推理管道或网络可见性重要的环境中，Cilium 的功能优势可以转化为性能改进。

---

## 分析和建议

<KeyResultsSummaryChart locale="zh" />

### 主要发现

<KeyFindingsChart locale="zh" />

### 按工作负载推荐的配置

<RecommendationChart locale="zh" />

:::tip XDP 支持确认
要使用 XDP Acceleration 和 DSR，请确认实例类型的 NIC 驱动是否支持 `bpf_link` 功能。m6i.xlarge 的 ENA 驱动当前不支持。在考虑未来驱动更新或其他实例类型（C6i、C7i 等）时需要重新验证。
:::

---

## 配置时的注意事项

总结基准测试环境配置过程中发现的问题和解决方法。在将 Cilium 引入 EKS 或重现基准测试时请参考。

### eksctl 集群创建

- **至少需要2个 AZ**: eksctl 在 `availabilityZones` 中至少需要2个 AZ。即使想要单一 AZ 节点组，集群级别也必须指定2个以上的 AZ。

  ```yaml
  # 集群级别：必须2个 AZ
  availabilityZones:
    - ap-northeast-2a
    - ap-northeast-2c
  # 节点组级别：可以单一 AZ
  managedNodeGroups:
    - availabilityZones: [ap-northeast-2a]
  ```

### Cilium Helm chart 兼容性

- **`tunnel` 选项已删除**（Cilium 1.15+）：`--set tunnel=vxlan` 或 `--set tunnel=disabled` 不再有效。请改用 `routingMode` 和 `tunnelProtocol`。

  ```bash
  # 以前（Cilium 1.14 及更早版本）
  --set tunnel=vxlan

  # 现在（Cilium 1.15+）
  --set routingMode=tunnel --set tunnelProtocol=vxlan

  # Native Routing（ENI 模式）
  --set routingMode=native
  ```

### XDP 加速使用条件

XDP（eXpress Data Path）在 NIC 驱动级别处理数据包以绕过内核网络堆栈。要在 Cilium 中使用 XDP，必须满足以下所有条件。

<XdpCompatibilityChart locale="zh" />

#### DSR（Direct Server Return）兼容性

- 设置 `loadBalancer.mode=dsr` 时可能导致 Cilium Agent Pod 崩溃
- AWS ENA 环境建议使用 `mode=snat`（默认值）
- DSR 仅在 XDP 正常工作的环境（Bare Metal + mlx5/i40e 等）中稳定

:::tip XDP 支持检查

```bash
# 检查 Cilium XDP 激活状态
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep XDP
# 显示"Disabled"时，该实例不支持 XDP

# 检查 NIC 驱动
ethtool -i eth0 | grep driver
```

:::

### 工作负载部署

- **Fortio 容器镜像限制**: `fortio/fortio` 镜像中没有 `sleep`、`sh`、`nslookup` 二进制文件。等待空闲时，请使用 Fortio 自身的服务器模式而不是 `sleep infinity`。

  ```yaml
  command: ["fortio", "server", "-http-port", "8080"]
  ```

- **DNS 测试用 Pod 选择**: DNS 解析测试应在包含 `sh` 的镜像（例如 iperf3）中使用 `getent hosts`。`nslookup` 需要单独安装。

### CNI 转换时 Pod 重启

- **Rolling Update 时 CPU 不足**: 从 VPC CNI → Cilium 转换后重启工作负载时，Rolling Update 策略会暂时将 Pod 数量增加到2倍。在小型节点上可能会发生 CPU 不足。

  ```bash
  # 安全的重启方法：删除现有 Pod 后重新创建
  kubectl delete pods -n bench --all
  kubectl rollout status -n bench deployment --timeout=120s
  ```

- **Cilium DaemonSet 重启**: 如果 Cilium Helm 值更改后 DaemonSet 不自动重启，请手动触发。

  ```bash
  kubectl -n kube-system rollout restart daemonset/cilium
  kubectl -n kube-system rollout status daemonset/cilium --timeout=300s
  ```

### AWS 认证

- **SSO 令牌过期**: 在长时间基准测试执行期间，AWS SSO 令牌可能会过期。请在执行前检查令牌有效时间，或使用 `aws sso login` 更新。

---

## 参考：VPC CNI vs Cilium 网络策略比较

在 EKS 中 VPC CNI 和 Cilium 都支持网络策略，但支持范围和功能存在很大差异。

<NetworkPolicyChart locale="zh" />

### 主要差异

**L7 策略（Cilium 专用）**: 可以在 HTTP 请求的路径、方法、头级别进行过滤。例如，可以设置允许 `GET /api/public` 但阻止 `DELETE /api/admin` 的策略。

```yaml
# Cilium L7 策略示例
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

**基于 FQDN 的策略（Cilium 专用）**: 可以通过 DNS 名称控制对外部域的访问。即使 IP 更改，策略也会自动更新。

```yaml
# 仅允许特定 AWS 服务
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

**策略执行可见性**: Cilium 的 Hubble 实时显示所有网络流的策略判定（ALLOWED/DENIED）。VPC CNI 仅通过 CloudWatch Logs 提供有限的日志记录。

:::tip 选择指南

- **仅需要基本 L3/L4 策略**: VPC CNI 的 EKS Network Policy 就足够了。
- **需要 L7 过滤、FQDN 策略、实时可见性**: Cilium 是唯一的选择。
- **多租户环境**: Cilium 的 CiliumClusterwideNetworkPolicy 和 Host-level 策略很强大。
:::

---

## 参考资料

- [Cilium Performance Tuning Guide](https://docs.cilium.io/en/stable/operations/performance/tuning/)
- [Cilium ENI Mode Documentation](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)
- [AWS EKS Networking Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/networking.html)
- [Cilium kube-proxy Replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [eBPF & XDP Reference](https://docs.cilium.io/en/stable/bpf/)
- [Fortio - HTTP Load Testing](https://fortio.org/)
