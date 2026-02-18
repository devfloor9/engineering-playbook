---
title: "CoreDNS 监控与性能优化完全指南"
sidebar_label: "2. CoreDNS 监控 & 优化"
description: "系统化监控和优化 Amazon EKS 中 CoreDNS 性能的方法。包含 Prometheus 指标、TTL 调优、监控架构、实际问题解决案例"
tags: [eks, coredns, dns, monitoring, prometheus, performance]
category: "performance-networking"
last_update:
  date: 2026-02-18
  author: devfloor9
sidebar_position: 2
---

import { GoldenSignals, CoreDnsMetricsTable, TtlConfigGuide, MonitoringArchitecture, TroubleshootingTable, PerformanceBenchmarks } from '@site/src/components/CoreDnsTables';

# CoreDNS 监控与优化指南

> 📅 **创建日期**: 2025-05-20 | **更新日期**: 2026-02-18 | ⏱️ **阅读时间**: 约 13 分钟

在 Amazon EKS 和现代 Kubernetes 集群中，**CoreDNS** 是负责集群内所有服务发现和外部域名解析的核心组件。CoreDNS 的性能和可用性直接影响应用程序的响应时间和稳定性，因此构建**有效的监控和优化架构**至关重要。本文分析 **CoreDNS 性能监控指标**、**TTL 配置指南**、**监控架构最佳实践**以及 **AWS 推荐方案和实战案例**。各章节通过 Prometheus 指标和 Amazon EKS 环境中的应用示例，深入了解 CoreDNS 监控策略。

## 1. CoreDNS 性能监控：核心 Prometheus 指标与含义

CoreDNS 通过 `metrics` 插件提供 **Prometheus 格式的指标**，在 EKS 中默认通过 `kube-dns` 服务的 `9153` 端口暴露。核心指标展示 **DNS 请求的吞吐量、延迟、错误和缓存效率**等信息，通过监控这些指标可以快速捕获 DNS 性能瓶颈或故障征兆。

### CoreDNS 四大黄金信号

<GoldenSignals />

### CoreDNS 核心 Prometheus 指标

<CoreDnsMetricsTable />

此外还提供**请求/响应大小**（`coredns_dns_request_size_bytes`、`...response_size_bytes`）、**DO 位设置**（`coredns_dns_do_requests_total`）等指标，以及 CoreDNS 加载的**各插件附加指标**。例如通过 **Forward 插件**的上游查询时间（`coredns_forward_request_duration_seconds`）或 **kubernetes 插件**的 API 更新延迟（`coredns_kubernetes_dns_programming_duration_seconds`）等。

### 主要指标含义与活用

例如，通过 `coredns_dns_requests_total` 的每秒增长率来掌握 **DNS QPS**，并按 CoreDNS Pod 分别查看负载是否**均衡**。若 QPS 持续增长，需检讨 CoreDNS 是否需要**横向扩展**。当 `coredns_dns_request_duration_seconds` 的 P99 高于正常水平时，表示 CoreDNS 正在经历**响应延迟**，需检查**上游 DNS 延迟**或 CoreDNS **CPU/内存饱和**。此时若 CoreDNS 缓存（`coredns_cache_hits_total`）命中率较低，需确认 TTL 是否过短导致缓存效果下降并进行调整。若 `coredns_dns_responses_total` 中 `SERVFAIL` 或 `REFUSED` 比例上升，需检查日志确认是否存在 CoreDNS **外部通信问题**或**访问权限问题**。若 `NXDOMAIN` 针对特定域名急增，则可能是应用程序在查询错误的域名。

此外，**系统资源指标**（CPU/内存）也很重要。监控 CoreDNS Pod 的 CPU/内存使用率，当各 Pod **接近资源限制**时设置告警。例如 EKS 默认 CoreDNS **内存请求/限制为 70Mi/170Mi**，因此需跟踪内存使用是否超过 150Mi，达到阈值时发出警报并增加内存限制或添加 Pod。CPU 达到限制时 kubelet 会对 CoreDNS 进程进行**节流**，导致 DNS 延迟，因此 CPU 使用率接近限制时应考虑扩展或增加资源分配。

:::warning VPC ENI DNS 包限制
每个节点 ENI 每秒仅允许 1024 个 DNS 包。即使放开 CoreDNS 的 `max_concurrent` 限制，由于 ENI PPS 限制（1024 PPS），也可能无法达到预期性能。
:::

## 2. CoreDNS TTL 配置指南与 Amazon EKS 应用示例

**TTL（Time-To-Live）** 是 DNS 记录的有效缓存时间，适当的 TTL 设置决定了 **DNS 流量负载**与**信息新鲜度**之间的平衡。CoreDNS 在两个层面处理 TTL：

- **权威区域记录（SOA）TTL：** Kubernetes 集群内部域（`cluster.local` 等）的 **kubernetes 插件**响应 TTL，默认值为 **5 秒**。可在 CoreDNS `Corefile` 的 `kubernetes` 部分指定 `ttl` 选项进行更改，范围从最小 0 秒（不缓存）到最大 3600 秒。
- **缓存 TTL：** **cache 插件**中缓存条目的最大保留时间，默认为**最大 3600 秒（成功响应）**，可在 CoreDNS 配置中以 `cache [TTL]` 形式调整。指定的 TTL 作为**上限**，若实际 DNS 记录的 TTL 更短，则按较短值从缓存中删除。（`cache` 插件的默认最小 TTL 为 5 秒，可通过 `MINTTL` 调整）。

<TtlConfigGuide />

### Amazon EKS 默认 CoreDNS 配置

查看 EKS 部署的默认 CoreDNS Corefile，`kubernetes` 插件未指定单独的 TTL，使用**默认 5 秒**，而通过 `cache 30` 设置将**所有 DNS 响应最多缓存 30 秒**。即**内部服务记录**的响应包 TTL 为 5 秒，但 CoreDNS 通过 cache 插件最多缓存 30 秒，避免对相同查询频繁调用 Kubernetes API。外部域名查询也最多缓存 30 秒，确保不会保留**过期的 DNS 信息**。

### TTL 设置指南

通常**短 TTL（如 5 秒以下）** 的优点是 DNS 记录变更（如新服务 IP 或 Pod IP 变化）能快速反映，但会导致客户端或 DNS 缓存的**重复查询增多**，增加 CoreDNS 负载。相反，**长 TTL（如数分钟以上）** 减少 DNS 查询频率提高性能，但变更传播延迟，增加因**过期信息**导致的临时连接失败可能性。**推荐方法**是根据集群规模和工作负载模式，将 TTL **适当提高（数十秒级）** 以**提高缓存命中率**同时避免严重的信息延迟。大多数 Kubernetes 环境中 **TTL 30 秒**左右是一个基准。

### Amazon EKS 应用示例

要在 EKS 中调整 TTL，需修改 **CoreDNS ConfigMap**。例如要增加内部域缓存时间，可在 Corefile 的 `kubernetes cluster.local ...` 块中添加 `ttl 30`。这样**集群内部 DNS 响应的 TTL 字段**增加到 30 秒，客户端（如 NodeLocal DNSCache 或应用运行时）参考此值缓存 30 秒内不再重新查询。但在 Kubernetes 环境中，Linux glibc resolver 不自行缓存而是每次都查询 CoreDNS，因此没有 **NodeLocal DNSCache** 等辅助缓存的话，增加 TTL 对客户端的优势有限。主要是为了减轻 CoreDNS 本身的负载而调整 TTL。

:::warning Aurora DNS 负载均衡问题
**AWS Aurora** 等服务使用**极低的 TTL（1 秒）** 进行 DNS 负载均衡。此时 CoreDNS 由于默认最小 TTL 5 秒，会将原本 1 秒的 TTL **过度缓存**为 5 秒，导致 Aurora Reader 端点流量分配失衡。这种情况下需要引入**针对特定域名降低 TTL 的配置**。
:::

实际案例中，通过在 NodeLocal DNSCache CoreDNS 配置中对 `amazonaws.com` 区域应用 `cache 1` 和 `success/denial 1` TTL 细分设置，使 Aurora 端点遵循原始 1 秒 TTL，从而解决了问题。因此**外部服务的 TTL 策略**也需要纳入 CoreDNS TTL 和缓存策略的调优考虑。

## 3. CoreDNS 监控架构最佳实践

CoreDNS 监控架构理想情况下应构建为包含**指标收集（Prometheus 等）** 和**日志收集（如 Fluent Bit 等）** 以及可视化和告警体系的**综合可观测性管道**。在 Amazon EKS 环境中，可以结合**托管服务**和**开源工具**实现稳定且可扩展的监控系统。

<MonitoringArchitecture />

### 指标收集与存储

在 Amazon EKS 中收集 CoreDNS 的 Prometheus 指标通常有**两种方法**：

1. **Amazon Managed Service for Prometheus (AMP)**: AWS 提供的**完全托管 Prometheus 兼容**服务，通过远程写入（remote write）从集群收集指标并存储在**高扩展性时序数据库**中。在 EKS 集群中安装 **ADOT（AWS Distro for OpenTelemetry）Collector** 或 **Prometheus 服务器**，抓取 CoreDNS 指标后发送到 AMP。AMP 中存储的指标可通过 **PromQL** 查询，适合长期保留和大规模集群支持。

2. **CloudWatch Container Insights（及 CloudWatch Agent）:** 利用 AWS CloudWatch **将 Prometheus 指标收集到 CloudWatch**。将 CloudWatch Agent 部署为 DaemonSet，配置从 `kube-system/kube-dns` 服务的 9153 端口抓取 CoreDNS 指标。

:::tip ServiceMonitor 配置
Amazon EKS 的 kube-dns 服务提供 metrics 端口，使用 Prometheus Operator 时可创建 ServiceMonitor，针对 kube-system 命名空间中 k8s-app=kube-dns 标签的服务抓取 9153 端口。
:::

### 日志收集

CoreDNS 的**查询日志和错误日志**在诊断性能问题或安全监控（如特定域名的爆发查询）方面非常有用。CoreDNS 默认 Corefile 中没有 `log` 插件，但可根据需要启用 `log` 或 `errors` 插件。**实践中**，为收集 CoreDNS Pod 标准输出（stdout/stderr）的日志，通常以 DaemonSet 方式运行 **Fluent Bit** 或 **Fluentd** 将日志导出到 CloudWatch Logs。

:::warning 日志收集注意事项
为避免过度日志收集导致的负载，仅保留必要级别的日志非常重要。EKS 最佳实践建议配置 Fluent Bit 等 Agent 的**元数据缓存**（`Kube_Meta_Cache_TTL=60` 等），避免重复查询 Kubernetes API，并减少不必要的字段收集。
:::

### 可视化与仪表盘

收集的 CoreDNS 指标通常通过 **Grafana** 进行监控仪表盘可视化。Amazon Managed Grafana (AMG) 与 AMP 和 CloudWatch 原生集成可作为数据源，并通过 **IAM 联合 SSO** 控制访问。在 Grafana 中构建 CoreDNS 仪表盘时，配置**请求率（QPS）、响应延迟（histogram）、错误率（rcode 分布）、缓存命中率**等面板。

### 告警/Alerting

应使用 **Prometheus Alertmanager** 或 CloudWatch Alarms 设置 **DNS 异常征兆的告警**。典型的 CoreDNS 相关 Alertmanager **规则示例**如下：

- **CoreDNSDown**: 一定时间内（`for: 15m` 等）CoreDNS 指标（`up{job="kube-dns"}` 等）未报告时告警。
- **HighDNSLatency**: `coredns_dns_request_duration_seconds` 的 **P99 延迟**超过例如 **100ms** 且高于正常水平时告警。
- **DNSErrorsSpike**: `coredns_dns_responses_total` 中 `rcode` 标签为 `SERVFAIL` 或 `NXDOMAIN` 的比例超过一定阈值时告警。
- **ENIThrottling**: AWS 环境特有指标，监控 **EC2 网络接口（ENI）DNS 包限制超标**的告警。
- **HighCoreDNSCPU/Memory**: CoreDNS Pod 的 CPU/内存使用率监控告警。

## 4. Amazon EKS 最佳实践与客户案例（DNS 瓶颈应对等）

AWS 通过文档和博客提供针对云环境的 **EKS DNS 运维最佳实践**。以下是主要推荐方案和客户案例中常见的场景：

<TroubleshootingTable />

### CoreDNS 水平扩展（副本数调整）

EKS 集群创建时默认 CoreDNS Deployment 副本数固定为 2，但随着节点数和工作负载增加可能需要**水平扩展**。AWS 最佳实践是使用 **Cluster Proportional Autoscaler** 根据**节点数或 CPU 核心数按比例自动增加** CoreDNS 副本数。

### 引入 NodeLocal DNSCache

在**大规模集群**或 **DNS 流量非常频繁的工作负载**中，CoreDNS 集中处理方式可能因**网络延迟和 ENI 限制**成为瓶颈。Kubernetes 官方插件 *NodeLocal DNSCache* 通过**在所有节点上以 DaemonSet 运行 DNS 缓存代理（基于 CoreDNS）**，在各节点提供**本地 DNS**。

### DNS 包限制与流量分散

AWS 环境中常见瓶颈是 **VPC DNS 包限额（1024 PPS/ENI）**。实践中，若大量外部 DNS 查询的应用存在时，CoreDNS 的 2 个 Pod **都在同一节点**上，该节点的单个 ENI 承载所有外部 DNS 查询，存在超出限额的风险。

### 优雅终止设置（Lameduck & Ready 插件）

防止 CoreDNS Pod 重启或缩容时发生的**临时 DNS 故障**的设置。AWS 最佳实践是对 CoreDNS 应用 **lameduck 30s** 设置，并将 **Readiness Probe** 配置为 `/ready` 端点。

### 需要更高 QPS 时

1. **提高 `max_concurrent`**: 可调至 `2000` 以上，但需同时考虑内存使用（2 KB × 并发查询数）和上游 DNS 延迟。

2. **CoreDNS 水平扩展**: 增加 Replica 数，或通过 Cluster Proportional Autoscaler、HPA 或 **NodeLocal DNSCache** 将查询分散到节点级别。

3. **ENI 限制监控**: 对 `aws_ec2_eni_allowance_exceeded`（CloudWatch）或 `linklocal_allowance_exceeded` 指标设置告警，提前检测 ENI PPS 超标。

## 核心总结

<PerformanceBenchmarks />

- **监控指标**: `requests_total`、`request_duration_seconds`、`cache_hits/misses`、`responses_total{rcode}`、CPU/内存
- **TTL 推荐值**: 服务记录 30s，cache（success 30，denial 5-10），prefetch 5 60s
- **监控**: kube-prometheus-stack 默认仪表盘 + Alertmanager 规则，必要时通过 NodeLocal DNSCache 横向扩展

## 附录：配置示例

### Corefile 推荐配置

```text
.:53 {
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30           # Service/POD 记录 TTL
  }

  cache 30 {         # 最大保留 30 秒
    success 10000 30 # capacity 10k, maxTTL 30s
    denial 2000 10   # negative cache 2k, maxTTL 10s
    prefetch 5 60s   # 同一查询 5 次以上时提前刷新
  }

  forward . /etc/resolv.conf {
    max_concurrent 2000
    prefer_udp
  }

  prometheus :9153
  health {
    lameduck 30s
  }
  ready
  reload
  log
}
```

### Alertmanager 规则示例

```yaml
- alert: CoreDNSHighErrorRate
  expr: >
    (sum(rate(coredns_dns_responses_total{rcode!~"NOERROR"}[5m])) /
     sum(rate(coredns_dns_requests_total[5m]))) > 0.01
  for: 10m
  labels:
    severity: critical
  annotations:
    description: "CoreDNS error rate > 1% for 10 min"

- alert: CoreDNSP99Latency
  expr: >
    histogram_quantile(0.99,
      sum(rate(coredns_dns_request_duration_seconds_bucket[5m])) by (le)) > 0.05
  for: 5m
  labels:
    severity: warning
```

### 调试命令

```bash
# 检查 CoreDNS 日志
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100

# 测试 DNS 解析
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- \
  nslookup kubernetes.default.svc.cluster.local

# 检查 CoreDNS 指标
kubectl port-forward -n kube-system deployment/coredns 9153:9153
curl http://localhost:9153/metrics
```

### 大规模集群（>100 节点或 QPS > 5k）

1. **NodeLocal DNSCache**（DaemonSet 形式）在节点本地缓存，缩短 RTT
   - nodelocaldns 指标也收集到 Prometheus，与 CoreDNS 进行比较
2. **CloudWatch Container Insights**（EKS 专用）
   - Prometheus 收集困难的环境可通过 `cwagent + adot-internal-metrics` 选项将 CoreDNS 容器指标发送到 CloudWatch（另收费用）
