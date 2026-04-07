---
title: "EKS Control Plane Deep Dive — CRD at Scale Comprehensive Guide"
sidebar_label: "Control Plane & CRD Scaling"
description: "Understand EKS Control Plane internals and learn Provisioned Control Plane usage, monitoring strategies, and CRD design best practices for stable scaling of CRD-based platforms"
tags: [eks, kubernetes, control-plane, crd, etcd, scaling, monitoring, best-practices]
sidebar_position: 1
last_update:
  date: 2026-03-24
  author: devfloor9
---

# EKS Control Plane Deep Dive — CRD at Scale Comprehensive Guide

> **Written**: 2026-03-24 | **Reading time**: ~25 min

When operating CRD-based platforms on EKS, the Control Plane is the first bottleneck. This guide covers Control Plane internals, CRD impacts, Provisioned Control Plane (PCP), and monitoring strategies.

---

## 1. EKS Control Plane Internal Architecture

### 1.1 Physical Infrastructure Layout

```
EKS Control Plane (AWS Managed)
├── kube-apiserver (min 2, multi-AZ)
├── kube-controller-manager
├── kube-scheduler
├── etcd (distributed key-value store)
└── Network Load Balancer (API Server endpoint)
```

- Components distributed across multiple AZs for HA
- Single API Server endpoint exposed via NLB
- Fully managed by AWS, separate from customer VPC

### 1.2 etcd — The Heart of the Control Plane

| Characteristic | Description | CRD Impact |
|---------------|-------------|------------|
| **DB Size Limit** | Standard 8GB, Provisioned 16GB | More CRD objects increase DB size |
| **Request Size Limit** | Single object max 1.5MB | Large CR specs approach the limit |
| **Watch Stream** | Real-time change propagation | Load increases with more CRD controller Watches |
| **RAFT Consensus** | Majority agreement for writes | Latency in write-heavy CRD patterns |

:::info etcd Architecture Evolution
AWS continues improving the EKS etcd layer for **predictable performance**, **data durability**, and **availability**.
:::

---

## 2. Control Plane Auto-Scaling

EKS **automatically vertically scales** Control Plane instances based on API Server load, etcd load, scheduling load, and data plane size.

:::warning Key Insight
Standard tier etcd DB Size is **fixed at 8GB**. This is the first bottleneck for CRD-heavy platforms — auto-scaling CPU/Memory does not expand etcd capacity.
:::

---

## 3. EKS Provisioned Control Plane (PCP)

GA at re:Invent 2025. Set a **performance floor** by selecting a tier.

| Tier | etcd DB | SLA | Hourly Price |
|------|---------|-----|-------------|
| Standard | 8GB | 99.95% | $0.10 |
| **XL** | **16GB** | **99.99%** | $1.65 |
| **2XL** | **16GB** | **99.99%** | $3.40 |
| **4XL** | **16GB** | **99.99%** | $6.90 |
| **8XL** | **16GB** | **99.99%** | $13.90 |

| Feature | Standard | XL+ |
|---------|----------|-----|
| API Server horizontal scaling (>2) | Limited to 2 | Yes |
| etcd DB Size 16GB | Fixed 8GB | 16GB |
| etcd Event Sharding | No | Yes |
| 99.99% SLA | 99.95% | 99.99% |

:::tip Why Provisioned for CRD Platforms
The first limit in CRD platforms is **etcd DB Size**. Provisioned doubles it to 16GB and offloads event pressure via Event Sharding.
:::

```bash
aws eks create-cluster --name prod \
  --role-arn arn:aws:iam::012345678910:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-xxx,securityGroupIds=sg-xxx \
  --control-plane-scaling-config tier=XL

aws eks update-cluster-config --name example \
  --control-plane-scaling-config tier=XL
```

---

## 4. Impact of CRDs on Control Plane

### 4.1 Impact on etcd

| Factor | Mechanism | Severity |
|--------|-----------|----------|
| **DB Size Growth** | CRD objects occupy etcd storage | High |
| **Watch Stream Load** | Controllers create Watch streams | High |
| **Request Size** | Objects approach 1.5MB limit | Medium |
| **List Call Cost** | JSON encoding (not protobuf) | High |

### 4.2 Impact on API Server

1. **JSON vs Protobuf**: CRDs use JSON — List/Watch performance significantly degraded
2. **APF**: List requests can occupy up to 10 seats
3. **Watch Cache**: Defaults to 100

```mermaid
flowchart LR
    A[429 Throttling increase] --> B[Inflight request limit exceeded]
    B --> C[CRD List requests consuming excessive APF seats]
    D[Slow List responses] --> E[JSON serialization overhead]
    G[etcd DB Size warning] --> H[CRD object accumulation]
    J[Watch disconnects] --> K[etcd Watch Stream overload]
```

:::danger CRD Load Formula
**Control Plane Load = CRD Type Count x Object Size x Controller Pattern (List/Watch Frequency)**
:::

---

## 5. EKS Control Plane Monitoring

Four observability dimensions:

1. **CloudWatch Vended Metrics** (automatic, free, v1.28+)
2. **Prometheus Endpoints** (KCM/KSH/etcd, manual)
3. **Control Plane Logging** (5 log types to CloudWatch)
4. **Cluster Insights** (automatic health/upgrade checks)

```bash
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/ksh/container/metrics
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/etcd/container/metrics

aws eks update-cluster-config --name my-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

| Channel | Cost | Setup | PCP Support |
|---------|------|-------|-------------|
| CloudWatch Vended Metrics | Free | Automatic (v1.28+) | Tier usage metrics |
| Prometheus Endpoint | Free | Manual | Extensible |
| Control Plane Logging | CW rates | Manual | — |
| Cluster Insights | Free | Automatic | Future tier recommendations |

---

## 6. CRD Design Best Practices

1. **Minimize Object Size** — Keep CR specs small, offload large data
2. **Manage CRD Count** — Consolidate similar resources, clean unused CRDs
3. **Controller Optimization** — SharedInformer, pagination, Exponential Backoff
4. **Keep K8s Current** — K8s 1.33+ Streaming List
5. **Cluster Architecture** — Separate CRD clusters from workload clusters

---

## 7. Recommendations & Adoption Roadmap

| 工作负载规模 | 推荐层级 | 核心原因 | 月费用（预估） |
|-----------|---------|---------|------------|
| ~50 节点，基础插件（Karpenter、cert-manager） | Standard | 默认自动扩展即可满足 | ~$73 |
| ~200 节点，5+ Operator（ArgoCD、Prometheus、自定义控制器） | **XL** | etcd 16GB，99.99% SLA | ~$1,204 |
| ~500 节点，服务网格 + GitOps + 多租户 | **2XL** | 增强 API Server 吞吐量 | ~$2,482 |
| 1,000+ 节点，AI/ML Operator + 大规模 CRD 管道 | **4XL** | API Server 水平扩展 | ~$5,037 |

### 各规模控制平面指标参考值

影响 EKS 控制平面扩展决策的关键指标行业平均参考值。实际值因工作负载模式而异——**超过阈值时应立即调查**。

| 指标 | ~50 节点 (Standard) | ~200 节点 (XL) | ~500 节点 (2XL) | 1,000+ 节点 (4XL) |
|------|-------------------|---------------|----------------|-----------------|
| **etcd DB 大小** | 0.5–1.5 GB | 2–5 GB | 5–10 GB | 10–20 GB |
| **etcd 对象数** | ~5,000 | ~30,000 | ~100,000 | 300,000+ |
| **API QPS**（请求/秒） | 20–50 | 100–300 | 300–800 | 1,000–3,000 |
| **API 延迟**（p99） | < 200ms | < 500ms | < 1s | < 1.5s（目标） |
| **429 限流**（/分钟） | 0 | < 5 | < 20 | 升级触发点 |
| **Watch 连接数** | ~200 | ~1,500 | ~5,000 | 15,000+ |
| **CRD 类型数**（参考） | 5–15 | 15–40 | 40–80 | 80+ |
| **控制器 Reconcile/秒** | 5–20 | 50–150 | 150–500 | 500–2,000 |

:::info 测量方法
- **etcd DB 大小**: `apiserver_storage_size_bytes`（CloudWatch 或 Prometheus）
- **API QPS**: `apiserver_request_total` rate（建议按 verb 拆分）
- **429 限流**: `apiserver_request_total{code="429"}` — 非零时立即调查
- **Watch 连接**: `apiserver_longrunning_requests{verb="WATCH"}` — 随控制器/节点数增长
- **Reconcile 速率**: 各控制器 `controller_runtime_reconcile_total` rate
:::

:::warning etcd 大小告警阈值
- **Standard**: 超过 6GB 时 Warning → 考虑升级到 XL
- **XL/2XL**: 超过 12GB 时 Warning → 清理无用 CR 或升级层级
- **4XL**: 超过 20GB 时 Critical → 考虑架构拆分（多集群）
:::

| Phase | Timeline | Activities |
|-------|----------|-----------|
| **1: Basic** | 1 week | CloudWatch alarms, Control Plane Logging |
| **2: Prometheus** | 2 weeks | AMP Scraper, Grafana dashboards |
| **3: PCP** | 1 week | Select and apply PCP tier |
| **4: Optimize** | Ongoing | Insights, tier adjustments, controller tuning |

---

:::info References
- [Amazon EKS Provisioned Control Plane](https://docs.aws.amazon.com/eks/latest/userguide/provisioned-control-plane.html)
- [EKS Control Plane Metrics](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-metrics.html)
- [EKS Best Practices — Control Plane](https://docs.aws.amazon.com/eks/latest/best-practices/control-plane.html)
- [Amazon EKS Introduces Provisioned Control Plane](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/)
- [Managing etcd Database Size on Amazon EKS Clusters](https://aws.amazon.com/blogs/containers/managing-etcd-database-size-on-amazon-eks-clusters)
- [Amazon EKS Enhances Kubernetes Control Plane Observability](https://aws.amazon.com/blogs/containers/amazon-eks-enhances-kubernetes-control-plane-observability/)
- [API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [etcd Performance Best Practices](https://etcd.io/docs/v3.5/op-guide/performance/)
- [Grafana Dashboard: EKS Control Plane](https://grafana.com/grafana/dashboards/21192-eks-control-plane/)
:::
