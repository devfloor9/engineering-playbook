---
title: "CoreDNS Monitoring and Performance Optimization Guide"
sidebar_label: "CoreDNS Monitoring & Optimization"
description: "Systematic methods for monitoring and optimizing CoreDNS performance on Amazon EKS. Includes Prometheus metrics, TTL tuning, monitoring architecture, and real-world troubleshooting case studies"
tags: [eks, coredns, dns, monitoring, prometheus, performance]
category: "performance-networking"
date: 2025-05-20
authors: [devfloor9]
sidebar_position: 6
---

# CoreDNS Monitoring and Optimization Guide

In Amazon EKS and modern Kubernetes clusters, **CoreDNS** is a critical component responsible for all in-cluster service discovery and external domain name resolution. CoreDNS performance and availability directly impact application response times and system stability. Establishing **effective monitoring and optimization architecture** is essential. This article analyzes **CoreDNS performance monitoring metrics**, **TTL configuration guidelines**, **monitoring architecture best practices**, and **AWS recommendations with real-world case studies**. Each section includes Prometheus metrics and practical examples for EKS environments.

## 1. CoreDNS Performance Monitoring: Key Prometheus Metrics and Their Meaning

CoreDNS provides **Prometheus-format metrics** through the `metrics` plugin, exposed by default on port `9153` of the `kube-dns` service in EKS. Core metrics show **DNS request throughput, latency, errors, and caching efficiency**, enabling rapid identification of DNS performance bottlenecks or failure indicators. Below, **Table 1** summarizes key CoreDNS Prometheus metrics, their meanings, and applications.

**Table 1. CoreDNS Key Prometheus Metrics and Meanings**

Beyond these, additional metrics like **request/response size** (`coredns_dns_request_size_bytes`, `...response_size_bytes`), **DO bit settings** (`coredns_dns_do_requests_total`), and **plugin-specific metrics** are available. For example, **Forward plugin** upstream query time (`coredns_forward_request_duration_seconds`) or **kubernetes plugin** API update latency (`coredns_kubernetes_dns_programming_duration_seconds`). Comprehensive monitoring of these metrics enables management of **CoreDNS's four golden signals**.

### CoreDNS Golden Signals

1. **Throughput (Traffic)**
2. **Latency**
3. **Errors**
4. **Resource Usage**

### Key Metrics Meaning and Application

For example, the rate of increase in `coredns_dns_requests_total` reveals **DNS QPS**, which you can check for balance across CoreDNS pods. Rising QPS suggests need for CoreDNS **scale-out**. When `coredns_dns_request_duration_seconds` p99 exceeds normal levels, CoreDNS is experiencing **response delays**—check for **upstream DNS latency** or CoreDNS **CPU/memory saturation**. If CoreDNS cache (`coredns_cache_hits_total`) hit rate is low, check if TTL is too short, reducing cache effectiveness. When `coredns_dns_responses_total` shows increased `SERVFAIL` or `REFUSED`, check CoreDNS **external communication issues** or **permission problems** via logs. If `NXDOMAIN` spikes for specific domains, applications may be querying incorrect domains—correct the application.

Additionally, **system resource metrics** (CPU/memory) are critical. Monitor CoreDNS pod CPU/memory usage to alert when each pod approaches **resource limits**. For example, EKS default CoreDNS **memory request/limit is 70Mi/170Mi**, so track when usage exceeds 150Mi and alert, allowing memory limit increases or pod additions. CPU approaching limits causes kubelet to **throttle** CoreDNS, introducing DNS delays—monitor CPU usage closely and consider scaling or resource increases when approaching limits.

### Additional Consideration (ENI DNS Packet Limit)

:::warning VPC ENI DNS Packet Limit
Each node ENI allows only 1024 DNS packets per second. Even if CoreDNS's 1000 concurrent query limit is raised, ENI PPS limits (1024 PPS) may still prevent reaching desired performance.
:::

## 2. CoreDNS TTL Configuration Guide and Amazon EKS Application Examples

**TTL (Time-To-Live)** defines how long DNS record caches remain valid, directly affecting **DNS traffic load** vs. **information freshness** balance. CoreDNS handles TTL at two levels:

- **Authoritative Zone Record (SOA, Start of Authority) TTL:** **kubernetes plugin** response TTL for in-cluster domains (`cluster.local`, etc.), default **5 seconds**. Configure via `ttl` option in CoreDNS `Corefile` kubernetes section; minimum 0 seconds (no caching), maximum 3600 seconds.
- **Cache TTL:** Maximum time **cache plugin** retains cached items, default **3600 seconds (success responses)**. Adjust via `cache [TTL]` in CoreDNS config. Set TTL acts as upper bound—if actual DNS record TTL is shorter, shorter value applies. (Default cache plugin minimum TTL is 5 seconds; adjustable via `MINTTL`).

### Amazon EKS Default CoreDNS Configuration

EKS's default CoreDNS Corefile specifies no explicit TTL for the `kubernetes` plugin, using **default 5 seconds**, with **`cache 30`** configuration caching **all DNS responses up to 30 seconds maximum**. This means **internal service record TTL** is 5 seconds in response packets, but CoreDNS itself caches responses for maximum 30 seconds via cache plugin, avoiding repeated Kubernetes API queries for identical requests. External domain queries also cache for maximum 30 seconds, ensuring even very-long-TTL external records refresh after 30 seconds, preventing **stale DNS information** retention.

### TTL Configuration Guidelines

Generally, **short TTL (e.g., 5 seconds or less)** quickly reflects DNS record changes (new service IPs, pod IP changes) but increases **client/cache repeat queries**, raising CoreDNS load. Conversely, **long TTL (minutes or more)** reduces query frequency, improving performance, but delays **change propagation, risking temporary connection failures** from outdated information. **Recommended approach:** gradually increase TTL (tens of seconds) to **raise cache hit rates** while avoiding serious information delays. Many Kubernetes environments use **30-second TTL** as a baseline. For instance, setting CoreDNS Kubernetes plugin TTL to 30 seconds means service/endpoint changes take maximum 30 seconds to update DNS, while query load significantly decreases. Amazon EKS uses 30-second cache TTL to balance these trade-offs.

### Amazon EKS Application Example

To adjust TTL in EKS, modify **CoreDNS ConfigMap**. For example, to increase internal domain cache time, add `ttl 30` to `kubernetes cluster.local ...` block in Corefile. This increases **cluster internal DNS response TTL field** to 30 seconds, allowing clients (NodeLocal DNSCache, application runtimes) to cache for 30 seconds without re-querying. However, in Kubernetes, typical glibc resolvers don't self-cache and query CoreDNS every time, so without **NodeLocal DNSCache** or similar supplementary cache, TTL increases show limited client-side benefits. TTL adjustment mainly reduces CoreDNS load.

:::warning Aurora DNS Load Balancing Issue
**AWS Aurora** uses **very low TTL (1 second)** for DNS load balancing. CoreDNS's default minimum 5-second TTL **over-caches** the original 1-second TTL, distorting Aurora reader endpoint traffic distribution. Address this with **domain-specific low TTL settings**.
:::

Real-world examples resolve this by configuring NodeLocal DNSCache CoreDNS with `cache 1` and `success/denial 1` TTL specifics for `amazonaws.com` zone, respecting Aurora endpoint's original 1-second TTL. Thus, **external service TTL policies** must guide CoreDNS TTL and cache strategies.

## 3. CoreDNS Monitoring Architecture Best Practices

Ideal CoreDNS monitoring architecture integrates **metric collection (Prometheus, etc.)**, **log collection (Fluent Bit, etc.)**, plus **visualization and alerting**—a **comprehensive observability pipeline**. Amazon EKS enables stable, scalable monitoring combining **managed services** and **open-source tools**.

### Metrics Collection and Storage

Amazon EKS typically uses **two approaches** for CoreDNS Prometheus metrics:

1. **Amazon Managed Service for Prometheus (AMP)**: AWS-provided **fully-managed Prometheus-compatible** service. Remote-writes cluster metrics to **scalable time-series DB**. Deploy **ADOT (AWS Distro for OpenTelemetry) Collector** or **Prometheus server** to scrape CoreDNS metrics, sending to AMP. AWS Observability guides provide Terraform-based **accelerators** automating ADOT Collector and AMP workspace creation for EKS monitoring. AMP-stored metrics are **PromQL-queryable**, ideal for long-term retention and large-cluster support.

2. **CloudWatch Container Insights (and CloudWatch Agent):** CloudWatch-based **Prometheus metric collection**. Deploy CloudWatch agent as DaemonSet, configuring `kube-system/kube-dns` service port 9153 CoreDNS metric scraping. AWS docs provide CloudWatch Agent config examples for Prometheus-compatible metric import—collected metrics stored in CloudWatch. CloudWatch Alarms integrate easily, and AWS Managed Grafana visualizes via CloudWatch. However, **CloudWatch charges** apply (metric collection/storage), and PromQL isn't directly available; CloudWatch dashboard construction uses defined metrics.

:::tip ServiceMonitor Setup
Amazon EKS kube-dns service provides metrics port. With Prometheus Operator, create ServiceMonitor targeting k8s-app=kube-dns labeled service in kube-system namespace, scraping port 9153.
:::

### Log Collection

CoreDNS **query logs and error logs** provide useful performance diagnosis and security monitoring (e.g., domain query flooding detection). Default CoreDNS Corefile lacks `log` plugin, but enable when needed. **Practical approach:** collect CoreDNS pod stdout/stderr logs via **Fluent Bit** or **Fluentd** DaemonSet, exporting to CloudWatch Logs.

:::warning Log Collection Caution
Avoid excessive logging overhead. Enable only necessary log levels. EKS best practices recommend **metadata caching** (`Kube_Meta_Cache_TTL=60`, etc.) in agents like Fluent Bit to prevent repeated Kubernetes API queries, and reduce unnecessary field collection.
:::

### Visualization and Dashboards

Collected CoreDNS metrics typically visualize via **Grafana** monitoring dashboard. **Amazon Managed Grafana (AMG)** natively integrates AMP or CloudWatch as data sources and controls access via **IAM SSO**. Building CoreDNS Grafana dashboards typically includes panels for **QPS (query rate), response latency (histogram), error rate (rcode distribution), cache hit ratio**.

### Alarms/Alerting

Use **Prometheus Alertmanager** or **CloudWatch Alarms** for **DNS anomaly alerts**. Representative CoreDNS Alertmanager **rule examples**:

- **CoreDNSDown**: Alert when `up{job="kube-dns"}` metrics absent for period (e.g., `for: 15m`).
- **HighDNSLatency**: Alert when `coredns_dns_request_duration_seconds` **p99 latency** exceeds threshold (e.g., **500ms**) above baseline.
- **DNSErrorsSpike**: Alert when `coredns_dns_responses_total` with `rcode` `SERVFAIL` or `NXDOMAIN` exceeds threshold.
- **ENIThrottling**: AWS-specific metric—alert on **EC2 ENI DNS packet limit exceeded**.
- **HighCoreDNSCPU/Memory**: Alert on CoreDNS pod CPU/memory usage approaching limits.

## 4. Amazon EKS Best Practices and Customer Case Studies (DNS Bottleneck Resolution)

AWS provides **EKS DNS operational best practices** via documentation and blogs. Key recommendations and frequently-seen scenarios:

### CoreDNS Horizontal Scaling (Replica Adjustment)

Default EKS CoreDNS Deployment replicas are fixed at 2, but require **horizontal scaling** with node/workload growth. AWS recommends **Cluster Proportional Autoscaler** to auto-increase CoreDNS replicas **proportional to node count or CPU cores**.

### NodeLocal DNSCache Adoption

**Large clusters** or **high DNS traffic workloads** risk CoreDNS central processing becoming bottleneck due to **network latency and ENI limits**. Kubernetes's **NodeLocal DNSCache** add-on runs **DNS cache agent (CoreDNS-based) DaemonSet on all nodes**, providing **per-node local DNS**.

### DNS Packet Limit and Traffic Distribution

Common AWS bottleneck: **VPC DNS packet limit (1024 PPS/ENI)**. Real-world case: application making massive external DNS queries with CoreDNS pods both on **same node**—that node's single ENI hitting 1024 PPS limit, risking packet drops.

### Graceful Termination Configuration (Lameduck & Ready Plugin)

Prevent **transient DNS failures** during CoreDNS pod restart/scale-down. AWS best practice: apply CoreDNS **lameduck 30s** setting, configure **Readiness Probe** to `/ready` endpoint.

### Real-World Case Study: DNS Performance Bottleneck Resolution

*Case 1*: Enterprise running EKS microservices saw **DNS response delays over 1 second, adding >1s total response time**. Investigation revealed CoreDNS healthy, but **VPC DNS Resolver upstream hitting ENI PPS limit**, dropping packets, causing occasional delays.

*Case 2*: Another firm used **Aurora DB cluster**, observing uneven read load—some reader nodes saturated, others idle. Analysis found **Aurora Reader endpoint DNS** provides multiple reader-node IPs via 1-second TTL round-robin, but CoreDNS/NodeLocal DNSCache cached for 5 seconds, **using same reader IP for 5 seconds**, skewing load.

### Higher QPS Requirement

1. **Raise `max_concurrent`**: Adjustable above `2000`, but account for memory (2 KB × concurrent queries) and upstream DNS latency.

2. **CoreDNS Horizontal Scale**: Increase replicas or use Cluster Proportional Autoscaler, HPA, or **NodeLocal DNSCache** for node-level query distribution.

3. **Monitor ENI Limit**: Set alarms for **`aws_ec2_eni_allowance_exceeded`** (CloudWatch) or `linklocal_allowance_exceeded` metric to detect ENI PPS overage early.

## Key Summary

- **Enhanced Metrics**: request_count_total, request_duration_seconds, cache_hits/misses, response_code_count_total, CPU/memory.
- **TTL Recommendations**: Service records 30s, cache (success 30, denial 5-10).
- **Monitoring**: kube-prometheus-stack default dashboard + Alertmanager rules, scale-out with NodeLocal DNSCache if needed.

## 1. Must-Watch Metrics for CoreDNS Performance Monitoring

## 2. TTL Configuration Guide

Configuration example (Corefile):

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
    prefetch 5 60s   # 5+ identical queries → refresh at 60s prior
  }

  prometheus :9153
  health
  reload
  log
}
```

:::warning Short TTL (under 10 seconds) risks stale IP occurrence.
:::

## 3. CoreDNS Monitoring Architecture Proposal

1. **Prometheus Operator (kube-prometheus-stack)**
   - ServiceMonitor scrapes kube-system/coredns at **:9153/metrics**
   - Use release=kps Grafana k8s-coredns.json dashboard.

2. **Alertmanager Rules Example**

```text
- alert: CoreDNSHighErrorRate
  expr: (sum(rate(coredns_dns_response_code_count_total{rcode!~"NOERROR"}[5m])) /
         sum(rate(coredns_dns_request_count_total[5m]))) > 0.01
  for: 10m
  labels:
    severity: critical
  annotations:
    description: "CoreDNS error rate > 1% for 10 min"

- alert: CoreDNSP99Latency
  expr: histogram_quantile(0.99,
          sum(rate(coredns_dns_request_duration_seconds_bucket[5m])) by (le)) > 0.05
  for: 5m
  labels:
    severity: warning
```

1. **Large-Scale Clusters (>100 nodes) or QPS > 5k**
   - Deploy **NodeLocal DNSCache** (kube-proxy DaemonSet form) for node-local caching/reduced RTT.
   - Collect nodelocaldns metrics in Prometheus, compare CoreDNS ↔ NodeLocal.

2. **CloudWatch Container Insights** (EKS-specific)
   If Prometheus collection is difficult, use **cwagent + adot-internal-metrics** for CoreDNS container metrics to CloudWatch. (Separate charges apply.)
