---
title: "CoreDNS Monitoring and Performance Optimization Complete Guide"
sidebar_label: "2. CoreDNS Monitoring & Optimization"
description: "Systematic methods for monitoring and optimizing CoreDNS performance on Amazon EKS. Includes Prometheus metrics, TTL tuning, monitoring architecture, and real-world troubleshooting case studies"
tags: [eks, coredns, dns, monitoring, prometheus, performance]
category: "performance-networking"
last_update:
  date: 2026-02-18
  author: devfloor9
sidebar_position: 2
---

import { GoldenSignals, CoreDnsMetricsTable, TtlConfigGuide, MonitoringArchitecture, TroubleshootingTable, PerformanceBenchmarks } from '@site/src/components/CoreDnsTables';

# CoreDNS Monitoring and Optimization Guide

> 📅 **Written**: 2025-05-20 | **Last Modified**: 2026-02-18 | ⏱️ **Reading Time**: ~13 min


In Amazon EKS and modern Kubernetes clusters, **CoreDNS** serves as the core component responsible for all in-cluster service discovery and external domain name resolution. Because CoreDNS performance and availability directly impact application response times and stability, establishing an **effective monitoring and optimization architecture** is critical. This article analyzes **CoreDNS performance monitoring metrics**, **TTL configuration guidelines**, **monitoring architecture best practices**, **AWS recommendations, and real-world case studies**. Each section leverages Prometheus metrics and Amazon EKS environment examples to explore CoreDNS monitoring strategies.

## 1. CoreDNS Performance Monitoring: Key Prometheus Metrics and Their Meaning

CoreDNS provides **Prometheus-format metrics** through the `metrics` plugin, exposed by default on port `9153` of the `kube-dns` service in EKS. Core metrics reveal **DNS request throughput, latency, errors, and caching efficiency**, enabling rapid detection of DNS performance bottlenecks or failure indicators through monitoring.

### CoreDNS 4 Golden Signals

<GoldenSignals />

### CoreDNS Key Prometheus Metrics

<CoreDnsMetricsTable />

Beyond these, additional metrics like **request/response size** (`coredns_dns_request_size_bytes`, `...response_size_bytes`), **DO bit settings** (`coredns_dns_do_requests_total`), and **plugin-specific metrics** are available. For example, the **Forward plugin** provides upstream query time (`coredns_forward_request_duration_seconds`), and the **kubernetes plugin** offers API update latency (`coredns_kubernetes_dns_programming_duration_seconds`).

### Key Metrics Meaning and Application

For example, use the rate of increase in `coredns_dns_requests_total` to determine **DNS QPS**, dividing by CoreDNS pod count to verify **balanced** load distribution. If QPS continuously rises, evaluate whether CoreDNS **scale-out** is needed. When the 99th percentile of `coredns_dns_request_duration_seconds` exceeds normal levels, CoreDNS is experiencing **response delays**—check for **upstream DNS latency** or CoreDNS **CPU/memory saturation**. If CoreDNS cache (`coredns_cache_hits_total`) hit rate is low, verify whether TTL is too short, reducing cache effectiveness, and adjust accordingly. When `coredns_dns_responses_total` shows increased `SERVFAIL` or `REFUSED` rates, check logs for CoreDNS **external communication issues** or **permission problems**. If `NXDOMAIN` increases spike for specific domains, applications may be querying incorrect domains—correct the application code.

Additionally, **system resource metrics** (CPU/memory) are crucial. Monitor CoreDNS pod CPU/memory usage to set alerts when each pod approaches **resource limits**. For example, EKS default CoreDNS **memory request/limit is 70Mi/170Mi**, so track when memory usage exceeds 150Mi to alert at threshold and take action like increasing memory limits or adding pods. If CPU reaches limits, kubelet **throttles** the CoreDNS process, causing DNS delays—when CPU usage approaches limits, consider scaling or increasing resource allocation.

:::warning VPC ENI DNS Packet Limit
Each node ENI allows only 1024 DNS packets per second. Even if CoreDNS's `max_concurrent` limit is raised, the ENI PPS limit (1024 PPS) restriction may prevent reaching desired performance.
:::

## 2. CoreDNS TTL Configuration Guide and Amazon EKS Application Examples

**TTL (Time-To-Live)** defines the valid cache time for DNS records, and appropriate TTL settings balance **DNS traffic load** versus **information freshness**. CoreDNS handles TTL at two levels:

- **Authoritative Zone Record (SOA, Start of Authority) TTL:** The **kubernetes plugin** response TTL for in-cluster domains (`cluster.local`, etc.), with a default of **5 seconds**. Modify via the `ttl` option in the CoreDNS `Corefile` kubernetes section, configurable from minimum 0 seconds (no caching) to maximum 3600 seconds.
- **Cache TTL:** The maximum time the **cache plugin** retains cached items, defaulting to **3600 seconds (success responses)**, adjustable via `cache [TTL]` format in CoreDNS config. The specified TTL acts as an **upper bound**—if the actual DNS record TTL is shorter, items are removed from cache according to that shorter value. (The cache plugin's default minimum TTL is 5 seconds, adjustable via `MINTTL`).

<TtlConfigGuide />

### Amazon EKS Default CoreDNS Configuration

Examining the default CoreDNS Corefile deployed in EKS, no explicit TTL is specified for the `kubernetes` plugin, using the **default 5 seconds**, while the `cache 30` setting configures **caching all DNS responses for maximum 30 seconds**. This means **internal service record** TTL in response packets is 5 seconds, but CoreDNS itself caches responses via the cache plugin for maximum 30 seconds, optimizing to avoid frequent Kubernetes API queries for identical requests. For external domain queries, results are also cached for maximum 30 seconds, ensuring even external records with very long TTLs refresh after 30 seconds to avoid retaining **excessively stale DNS information**.

### TTL Configuration Guidelines

Generally, **short TTL (e.g., 5 seconds or less)** has the advantage of rapidly reflecting DNS record changes (new service IPs, pod IP changes), but increases **repeated queries** from clients or DNS caches, raising CoreDNS load. Conversely, **long TTL (several minutes or more)** reduces DNS query frequency to improve performance, but delays change propagation, increasing the possibility of temporary connection failures due to **stale information**. The **recommended approach** is to moderately increase TTL **(in tens of seconds units)** according to cluster size and workload patterns to **raise cache hit rates** while avoiding serious information delays. Many Kubernetes environments use **TTL around 30 seconds** as a baseline.

### Amazon EKS Application Example

To adjust TTL in EKS, modify the **CoreDNS ConfigMap**. For example, to increase internal domain cache time, add `ttl 30` to the `kubernetes cluster.local ...` block in Corefile. This increases the **cluster internal DNS response TTL field** to 30 seconds, allowing client-side (NodeLocal DNSCache, application runtimes) caching for 30 seconds without re-querying. However, in Kubernetes environments, typical Linux glibc resolvers don't self-cache and query CoreDNS every time, so without auxiliary caches like **NodeLocal DNSCache**, increasing TTL provides limited client-side benefits. TTL adjustments primarily reduce CoreDNS load.

:::warning Aurora DNS Load Balancing Issue
Services like **AWS Aurora** use **very low TTL (1 second)** for **DNS load balancing**. In this case, CoreDNS's default minimum 5-second TTL **over-caches** the original 1-second TTL, distorting Aurora reader endpoint traffic distribution. In such situations, introduce **domain-specific low TTL settings**.
:::

Real-world cases resolved this by configuring NodeLocal DNSCache CoreDNS with `cache 1` and `success/denial 1` TTL specifics for the `amazonaws.com` zone, respecting Aurora endpoint's original 1-second TTL. Therefore, **external service TTL policies** must be considered when tuning CoreDNS TTL and cache strategies.

## 3. CoreDNS Monitoring Architecture Best Practices

The ideal CoreDNS monitoring architecture is built as a **comprehensive observability pipeline** including **metric collection (Prometheus, etc.)**, **log collection (Fluent Bit, etc.)**, plus visualization and alerting systems. In Amazon EKS environments, stable and scalable monitoring systems can be implemented by combining **managed services** and **open-source tools**.

<MonitoringArchitecture />

### Metrics Collection and Storage

Amazon EKS typically uses **two approaches** for collecting CoreDNS Prometheus metrics:

1. **Amazon Managed Service for Prometheus (AMP)**: AWS-provided **fully-managed Prometheus-compatible** service that remote-writes cluster metrics to a **scalable time-series DB**. Deploy **ADOT (AWS Distro for OpenTelemetry) Collector** or **Prometheus server** in the EKS cluster to scrape CoreDNS metrics and send to AMP. AMP-stored metrics are **PromQL-queryable**, suitable for long-term retention and large-cluster support.

2. **CloudWatch Container Insights (and CloudWatch Agent):** Method for **collecting Prometheus metrics to CloudWatch** using AWS CloudWatch. Deploy CloudWatch agent as DaemonSet, configuring to scrape CoreDNS metrics from the `kube-system/kube-dns` service port 9153.

:::tip ServiceMonitor Setup
Amazon EKS's kube-dns service provides a metrics port, so with Prometheus Operator, create a ServiceMonitor targeting the k8s-app=kube-dns labeled service in kube-system namespace to scrape port 9153.
:::

### Log Collection

CoreDNS **query logs and error logs** are useful information sources for diagnosing performance issues or security monitoring (e.g., flood queries for specific domains). The default CoreDNS Corefile lacks the `log` plugin, but you can activate `log` or `errors` plugins as needed. **In practice**, the common pattern is to collect logs written to CoreDNS pod stdout/stderr using **Fluent Bit** or **Fluentd** as DaemonSet and export to CloudWatch Logs.

:::warning Log Collection Caution
Avoid excessive load from over-collection by logging only necessary levels. EKS best practices recommend **metadata caching** (`Kube_Meta_Cache_TTL=60`, etc.) for agents like Fluent Bit to prevent repeated Kubernetes API queries and reduce unnecessary field collection.
:::

### Visualization and Dashboards

Collected CoreDNS metrics are typically visualized via **Grafana** monitoring dashboards. Amazon Managed Grafana (AMG) natively integrates with AMP or CloudWatch as data sources and controls access via **IAM-integrated SSO**. When building CoreDNS dashboards in Grafana, configure panels for **request rate (QPS), response latency (histogram), error rate (rcode distribution), cache hit rate**.

### Alarms/Alerting

Use **Prometheus Alertmanager** or CloudWatch Alarms to set **alerts for DNS anomaly indicators**. Representative CoreDNS-related Alertmanager **rule examples**:

- **CoreDNSDown**: Alert when CoreDNS metrics (`up{job="kube-dns"}`, etc.) aren't reported for a period (e.g., `for: 15m`).
- **HighDNSLatency**: Alert when `coredns_dns_request_duration_seconds` **p99 latency** exceeds, for example, **100ms** and is higher than usual.
- **DNSErrorsSpike**: Alert when the rate of `coredns_dns_responses_total` with `rcode` label `SERVFAIL` or `NXDOMAIN` exceeds a threshold.
- **ENIThrottling**: AWS-specific metric monitoring **EC2 network interface (ENI) DNS packet limit exceeded** alerts.
- **HighCoreDNSCPU/Memory**: CoreDNS pod CPU/memory usage monitoring alerts.

## 4. Amazon EKS Best Practices and Customer Case Studies (DNS Bottleneck Resolution)

AWS provides **EKS DNS operational best practices** via documentation and blogs. Key recommendations and frequently-encountered scenarios:

<TroubleshootingTable />

### CoreDNS Horizontal Scaling (Replica Adjustment)

The default CoreDNS Deployment replica count at EKS cluster creation is fixed at 2, but **horizontal scaling** may be needed as node count and workload increase. AWS best practice is using **Cluster Proportional Autoscaler** to automatically increase CoreDNS replicas **proportional to node count or CPU core count**.

### NodeLocal DNSCache Adoption

In **large-scale clusters** or **workloads with very frequent DNS traffic**, the central CoreDNS processing approach can become bottlenecked by **network latency and ENI limits**. Kubernetes's official add-on *NodeLocal DNSCache* runs a **DNS cache agent (CoreDNS-based) as DaemonSet on all nodes**, providing **local DNS** on each node.

### DNS Packet Limit and Traffic Distribution

A common AWS bottleneck is the **VPC DNS packet limit (1024 PPS/ENI)**. In real-world cases, when applications make massive external DNS queries and CoreDNS pods both run on the **same node**, all external DNS queries exit through that node's single ENI, risking exceeding the limit.

### Graceful Termination Configuration (Lameduck & Ready Plugin)

Configuration to prevent **transient DNS failures** during CoreDNS pod restart or scale-down. AWS best practice is applying **lameduck 30s** setting to CoreDNS and configuring **Readiness Probe** to the `/ready` endpoint.

### When Higher QPS is Needed

1. **Increase `max_concurrent`**: Adjustable above `2000`, but consider memory usage (2 KB × concurrent query count) and upstream DNS latency together.

2. **CoreDNS Horizontal Scaling**: Increase replica count or use Cluster Proportional Autoscaler, HPA, or **NodeLocal DNSCache** to distribute queries to node level.

3. **Monitor ENI Limits**: Set alarms on `aws_ec2_eni_allowance_exceeded` (CloudWatch) or `linklocal_allowance_exceeded` metrics for early detection of ENI PPS overage.

## Key Summary

<PerformanceBenchmarks />

- **Monitoring Metrics**: `requests_total`, `request_duration_seconds`, `cache_hits/misses`, `responses_total{rcode}`, CPU/memory
- **TTL Recommendations**: Service records 30s, cache (success 30, denial 5-10), prefetch 5 60s
- **Monitoring**: kube-prometheus-stack default dashboard + Alertmanager rules, scale-out with NodeLocal DNSCache if needed

## Appendix: Configuration Examples

### Recommended Corefile Configuration

```text
.:53 {
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30           # Service/POD record TTL
  }

  cache 30 {         # Maximum 30-second retention
    success 10000 30 # capacity 10k, maxTTL 30s
    denial 2000 10   # negative cache 2k, maxTTL 10s
    prefetch 5 60s   # 5+ identical queries → refresh 60s prior
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

### Large-Scale Clusters (>100 nodes or QPS > 5k)

1. **NodeLocal DNSCache** (DaemonSet form) caches at node level to reduce RTT
   - Collect nodelocaldns metrics in Prometheus to compare with CoreDNS
2. **CloudWatch Container Insights** (EKS-specific)
   - If Prometheus collection is difficult, use `cwagent + adot-internal-metrics` option to send CoreDNS container metrics to CloudWatch (separate charges apply)
