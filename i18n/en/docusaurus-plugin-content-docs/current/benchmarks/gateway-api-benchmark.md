---
title: "Gateway API Implementation Performance Benchmark Plan"
sidebar_label: "3. Gateway API Benchmark"
description: "Performance comparison benchmark plan for 5 Gateway API implementations (AWS LBC v3, Cilium, NGINX Gateway Fabric, Envoy Gateway, kGateway) in EKS environments"
tags: [benchmark, gateway-api, cilium, envoy, nginx, performance, eks]
category: "benchmark"
last_update:
  date: 2026-02-14
  author: devfloor9
sidebar_position: 3
---

# Gateway API Implementation Performance Benchmark Plan

> 📅 **Written**: 2026-02-12 | **Last Modified**: 2026-02-14 | ⏱️ **Reading Time**: ~4 min

A systematic benchmark plan to objectively compare 5 Gateway API implementations in identical Amazon EKS environments. Quantitatively identify each solution's strengths and weaknesses to make data-driven architectural decisions.

:::tip Related Documentation
This benchmark plan targets the 5 solutions analyzed in the [Gateway API Adoption Guide](/docs/infrastructure-optimization/gateway-api-adoption-guide).
:::

## 1. Benchmark Objectives

The goal is to objectively compare the 5 Gateway API implementations across key metrics to provide data-driven recommendations.

**Key Questions:**
1. Which solution provides the lowest latency?
2. Which solution delivers the highest throughput?
3. How do resource requirements (CPU, memory) compare?
4. What is the scalability limit of each solution?
5. How does cost correlate with performance?

## 2. Test Environment

### Infrastructure Specification

```yaml
# EKS Cluster Configuration
Cluster:
  Version: 1.32
  Region: us-west-2
  VPC CIDR: 10.0.0.0/16

Node Groups:
  - Name: gateway-nodes
    Instance Type: c5.2xlarge (8 vCPU, 16GB RAM)
    Count: 3
    AMI: Amazon Linux 2 (EKS Optimized)

  - Name: app-nodes
    Instance Type: m5.xlarge (4 vCPU, 16GB RAM)
    Count: 6
    AMI: Amazon Linux 2 (EKS Optimized)

Load Generator:
  Instance Type: c5.4xlarge (16 vCPU, 32GB RAM)
  Count: 2
  Location: Same VPC, different subnet
```

### Test Application

```yaml
# Deployment: Simple echo server
apiVersion: apps/v1
kind: Deployment
metadata:
  name: benchmark-app
spec:
  replicas: 12  # 2 per app node
  template:
    spec:
      containers:
      - name: echo
        image: ealen/echo-server:latest
        resources:
          requests:
            cpu: 500m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 512Mi
      nodeSelector:
        role: app
```

## 3. Test Scenarios

### Scenario 1: Baseline HTTP Routing

**Configuration:**
- Simple path-based routing (/)
- No TLS
- No additional policies

**Metrics:**
- Latency (P50, P95, P99, P99.9)
- Throughput (RPS)
- CPU usage (gateway + app pods)
- Memory usage

**Load Pattern:**
```bash
# wrk2 constant load
wrk2 -t8 -c400 -d300s -R10000 http://gateway.example.com/
```

### Scenario 2: TLS Termination

**Configuration:**
- HTTPS with TLS 1.3
- 2048-bit RSA certificates

**Metrics:**
- TLS handshake time
- Throughput vs baseline
- CPU increase due to TLS

### Scenario 3: Complex Routing

**Configuration:**
- 10 HTTPRoutes
- Header-based routing
- Path-based routing
- Query parameter matching

**Metrics:**
- Routing decision overhead
- Latency vs baseline

### Scenario 4: Traffic Splitting (Canary)

**Configuration:**
- 90/10 weight split
- 1000 requests per second

**Metrics:**
- Weight distribution accuracy
- Latency impact

### Scenario 5: Rate Limiting

**Configuration:**
- 1000 RPS limit per IP
- Burst: 1500

**Metrics:**
- Enforcement accuracy
- Latency for allowed requests
- CPU overhead

### Scenario 6: Peak Load (Scalability)

**Configuration:**
- Gradual load increase from 1k to 100k RPS
- Find breaking point for each solution

**Metrics:**
- Maximum sustainable RPS
- Latency at breaking point
- Recovery time after load reduction

## 4. Measurement Tools

### Load Generation

```bash
# Install wrk2 (constant throughput load generator)
git clone https://github.com/giltene/wrk2.git
cd wrk2
make
sudo cp wrk2 /usr/local/bin/

# Install vegeta (HTTP load testing)
go install github.com/tsenart/vegeta@latest

# Install k6 (modern load testing)
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee -a /etc/apt/sources.list
sudo apt-get update
sudo apt-get install k6
```

### Metrics Collection

```yaml
# Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.memory=8Gi

# Grafana Dashboards
- Cilium Gateway API Dashboard
- AWS Load Balancer Controller Dashboard
- Envoy Gateway Dashboard
- NGINX Gateway Fabric Dashboard
```

### Log Aggregation

```bash
# Fluent Bit for centralized logging
helm install fluent-bit fluent/fluent-bit \
  --namespace logging \
  --set backend.type=es \
  --set backend.es.host=elasticsearch.logging.svc.cluster.local
```

## 5. Success Criteria

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **P50 Latency** | under 5ms | under 10ms |
| **P99 Latency** | under 20ms | under 50ms |
| **Throughput** | >50k RPS per node | >30k RPS per node |
| **CPU Usage** | under 50% at 30k RPS | under 80% at 30k RPS |
| **Memory Usage** | under 2GB per gateway pod | under 4GB per gateway pod |
| **Error Rate** | under 0.01% | under 0.1% |
| **TLS Handshake** | under 10ms | under 20ms |

## 6. Execution Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Environment Setup | 3 days | Infrastructure provisioned, tools installed |
| 2. Baseline Tests (NGINX) | 2 days | NGINX Ingress performance baseline |
| 3. AWS Native Tests | 2 days | AWS LBC benchmarks across 6 scenarios |
| 4. Cilium Tests | 2 days | Cilium Gateway API benchmarks |
| 5. NGINX Fabric Tests | 2 days | NGINX Gateway Fabric benchmarks |
| 6. Envoy Gateway Tests | 2 days | Envoy Gateway benchmarks |
| 7. kGateway Tests | 2 days | kGateway benchmarks |
| 8. Analysis | 2 days | Data analysis and report writing |

:::info
Benchmark results will be updated in this document upon completion. For related network benchmarks, see [CNI Performance Comparison](./cni-performance-comparison.md).
:::

---

## Related Documentation

- [Gateway API Adoption Guide](/docs/infrastructure-optimization/gateway-api-adoption-guide) — Detailed comparison analysis of 5 solutions
- [CNI Performance Comparison Benchmark](./cni-performance-comparison.md) — VPC CNI vs Cilium network performance
- [Infrastructure Performance Benchmark](./infrastructure-performance.md) — Comprehensive infrastructure performance testing
