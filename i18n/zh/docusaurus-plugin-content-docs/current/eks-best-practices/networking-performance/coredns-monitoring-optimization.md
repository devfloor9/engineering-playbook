---
title: "CoreDNS Monitoring and Performance Optimization Complete Guide"
sidebar_label: "CoreDNS Monitoring & Optimization"
description: "Systematically monitor and optimize CoreDNS performance in Amazon EKS. Includes Prometheus metrics, TTL tuning, monitoring architecture, and real-world troubleshooting cases"
tags: [eks, coredns, dns, monitoring, prometheus, performance]
category: "performance-networking"
last_update:
  date: 2026-02-18
  author: devfloor9
---

import { GoldenSignals, CoreDnsMetricsTable, TtlConfigGuide, MonitoringArchitecture, TroubleshootingTable, PerformanceBenchmarks } from '@site/src/components/CoreDnsTables';

# CoreDNS Monitoring and Optimization Guide

> **Written**: 2025-05-20 | **Updated**: 2026-02-18 | **Reading time**: ~13 min

In Amazon EKS and modern Kubernetes clusters, **CoreDNS** is the core component responsible for all in-cluster service discovery and external domain name resolution. Since CoreDNS performance and availability directly impact application response times and stability, building an **effective monitoring and optimization architecture** is critical. This article analyzes **CoreDNS performance monitoring metrics**, **TTL configuration guide**, **monitoring architecture best practices**, and **AWS recommendations with real-world cases**. Each section leverages Prometheus metrics and Amazon EKS environment examples.

## 1. CoreDNS Performance Monitoring: Key Prometheus Metrics

CoreDNS exposes **Prometheus-format metrics** through the `metrics` plugin, available by default in EKS on port `9153` of the `kube-dns` service. The core metrics cover **DNS request throughput, latency, errors, and caching efficiency**, enabling rapid detection of DNS performance bottlenecks or failure indicators.

### CoreDNS 4 Golden Signals

<GoldenSignals />

### CoreDNS Key Prometheus Metrics

<CoreDnsMetricsTable />

Beyond these, additional metrics such as **request/response size** (`coredns_dns_request_size_bytes`, `...response_size_bytes`), **DO bit presence** (`coredns_dns_do_requests_total`), and **plugin-specific metrics** are available. For example, the **Forward plugin** provides upstream query time (`coredns_forward_request_duration_seconds`), and the **kubernetes plugin** provides API update latency (`coredns_kubernetes_dns_programming_duration_seconds`).

### Key Metric Meanings and Usage

Track `coredns_dns_requests_total` per-second rate for **DNS QPS**, distributed per CoreDNS Pod to verify **load balance**. If QPS consistently grows, evaluate whether CoreDNS **scale-out** is needed. When `coredns_dns_request_duration_seconds` p99 rises above normal, CoreDNS is experiencing **response latency** — check for **upstream DNS delays** or CoreDNS **CPU/memory saturation**. If cache hit ratio (`coredns_cache_hits_total`) is low, check whether TTL is too short. If `coredns_dns_responses_total` shows increasing `SERVFAIL` or `REFUSED`, check CoreDNS **external communication** or **access control** issues. A spike in `NXDOMAIN` for specific domains may indicate applications querying incorrect domains.

System resource metrics (CPU/memory) are also important. Monitor CoreDNS Pod CPU/memory utilization and alert when approaching **resource limits**. EKS default CoreDNS **memory request/limit is 70Mi/170Mi** — track if usage exceeds 150Mi. CPU throttling by kubelet causes DNS latency, so consider scaling when CPU approaches limits.

:::warning VPC ENI DNS Packet Limit
Each node ENI allows only 1024 DNS packets per second. Even if you increase CoreDNS `max_concurrent`, the ENI PPS limit (1024 PPS) may prevent reaching desired performance.
:::

## 2. CoreDNS TTL Configuration Guide and Amazon EKS Examples

**TTL (Time-To-Live)** defines the DNS record cache validity period, balancing **DNS traffic load** and **information freshness**. CoreDNS handles TTL at two levels:

- **Authoritative zone record (SOA) TTL:** The `kubernetes` plugin response TTL for internal cluster domains (`cluster.local`, etc.), defaulting to **5 seconds**. Configurable in the `kubernetes` section of the Corefile with the `ttl` option (min 0, max 3600 seconds).
- **Cache TTL:** The `cache` plugin maximum cache retention time, defaulting to **3600 seconds (success responses)**. The specified TTL acts as an **upper limit** — if the actual DNS record TTL is shorter, the cache respects the shorter value.

<TtlConfigGuide />

### Amazon EKS Default CoreDNS Configuration

The default EKS CoreDNS Corefile uses **5-second default TTL** for the `kubernetes` plugin (no explicit TTL) and `cache 30` to **cache all DNS responses for up to 30 seconds**. Internal service record TTL is 5 seconds in the response packet, but CoreDNS itself caches for up to 30 seconds to avoid frequent Kubernetes API queries. External domains are also cached up to 30 seconds.

### TTL Configuration Guide

Short TTLs (≤5s) reflect DNS changes quickly but increase CoreDNS load. Long TTLs (minutes+) reduce query frequency but delay change propagation. The **recommended approach** is to moderately increase TTL (tens of seconds) to **improve cache hit rate** while avoiding severe information delays. Many Kubernetes environments use **30 seconds** as a baseline.

### Amazon EKS Application Examples

To adjust TTL in EKS, modify the **CoreDNS ConfigMap**. Add `ttl 30` to the `kubernetes cluster.local ...` block. Note that standard Linux glibc resolver doesn't cache — without **NodeLocal DNSCache**, TTL increases mainly reduce CoreDNS's own load.

:::warning Aurora DNS Load Balancing Issue
**AWS Aurora** uses very low TTL (1 second) for DNS load balancing. CoreDNS's default minimum TTL of 5 seconds **over-caches** the 1-second TTL, distorting Aurora reader endpoint traffic distribution. Apply **domain-specific low TTL settings** for such cases.
:::

## 3. CoreDNS Monitoring Architecture Best Practices

<MonitoringArchitecture />

### Metric Collection and Storage

Two common approaches in Amazon EKS:

1. **Amazon Managed Service for Prometheus (AMP)**: Fully managed Prometheus-compatible service. Install **ADOT Collector** or **Prometheus** to scrape and forward CoreDNS metrics.
2. **CloudWatch Container Insights**: Use CloudWatch agent as DaemonSet to scrape CoreDNS metrics from `kube-dns` service port 9153.

:::tip ServiceMonitor Configuration
EKS's kube-dns service provides a metrics port. With Prometheus Operator, create a ServiceMonitor targeting the `k8s-app=kube-dns` label on port 9153.
:::

### Log Collection

Enable `log` or `errors` plugins as needed. Use **Fluent Bit** or **Fluentd** DaemonSets to collect CoreDNS stdout/stderr logs and export to CloudWatch Logs.

:::warning Log Collection Caution
Avoid excessive logging overhead. Set **metadata caching** (`Kube_Meta_Cache_TTL=60`) and reduce unnecessary field collection.
:::

### Visualization and Dashboards

Use **Grafana** (or Amazon Managed Grafana) to visualize CoreDNS metrics: **QPS, latency histograms, error rates (rcode distribution), cache hit rates**.

### Alerting

Set alerts via **Prometheus Alertmanager** or CloudWatch Alarms:
- **CoreDNSDown**: CoreDNS metrics unreported for 15+ minutes
- **HighDNSLatency**: p99 latency exceeding 100ms
- **DNSErrorsSpike**: SERVFAIL/NXDOMAIN ratio above threshold
- **ENIThrottling**: ENI DNS packet limit exceeded
- **HighCoreDNSCPU/Memory**: Resource utilization alerts

## 4. Amazon EKS Best Practices and Customer Cases

<TroubleshootingTable />

### CoreDNS Horizontal Scaling
Default 2 replicas; use **Cluster Proportional Autoscaler** to scale based on node count or CPU cores.

### NodeLocal DNSCache
For large clusters or high DNS traffic, deploy NodeLocal DNSCache DaemonSet for **local DNS caching** on every node.

### DNS Packet Limits and Traffic Distribution
VPC DNS packet limit is **1024 PPS/ENI**. Ensure CoreDNS Pods are distributed across nodes.

### Graceful Termination (Lameduck & Ready Plugin)
Apply **lameduck 30s** and configure Readiness Probe on `/ready` endpoint.

### Higher QPS Requirements
1. Increase `max_concurrent` to 2000+
2. Scale CoreDNS horizontally or deploy NodeLocal DNSCache
3. Monitor ENI limits via `aws_ec2_eni_allowance_exceeded`

## Key Summary

<PerformanceBenchmarks />

- **Monitoring Metrics**: `requests_total`, `request_duration_seconds`, `cache_hits/misses`, `responses_total{rcode}`, CPU/memory
- **Recommended TTL**: Service records 30s, cache (success 30, denial 5-10), prefetch 5 60s
- **Monitoring**: kube-prometheus-stack dashboards + Alertmanager rules, NodeLocal DNSCache for scale-out

## Appendix: Configuration Examples

### Recommended Corefile

```text
.:53 {
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30           # Service/POD record TTL
  }

  cache 30 {         # Max 30s retention
    success 10000 30 # capacity 10k, maxTTL 30s
    denial 2000 10   # negative cache 2k, maxTTL 10s
    prefetch 5 60s   # refresh before expiry if 5+ identical queries
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

### Alertmanager Rule Examples

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

### Large Clusters (>100 Nodes or QPS > 5k)

1. **NodeLocal DNSCache** (DaemonSet) for local caching and RTT reduction
2. **CloudWatch Container Insights** as alternative when Prometheus collection is difficult
