---
title: "EKS Pod 资源优化指南"
sidebar_label: "5. Pod 资源优化"
description: "Kubernetes Pod 的 CPU/Memory 资源设置、QoS 类别、VPA/HPA 自动扩缩容、资源 Right-Sizing 策略"
tags: [eks, kubernetes, resources, cpu, memory, qos, vpa, hpa, right-sizing, optimization]
category: "performance-networking"
last_update:
  date: 2026-02-14
  author: devfloor9
sidebar_position: 5
---

# EKS Pod 资源优化指南

> 📅 **撰写日期**: 2026-02-12 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 46 分钟

> **📌 基准环境**: EKS 1.30+, Kubernetes 1.30+, Metrics Server v0.7+

## 概述

在 Kubernetes 环境中，Pod 资源设置直接影响集群效率和成本。**50% 的容器仅使用了其请求 CPU 的 1/3**，这导致平均 40-60% 的资源浪费。本指南通过 Pod 级别的资源优化，提供最大化集群效率并降低 30-50% 成本的实战策略。

:::info 与相关文档的区别
- **[karpenter-autoscaling.md](/docs/infrastructure-optimization/karpenter-autoscaling)**: 节点级别的自动扩缩容（本文档是 Pod 级别）
- **[cost-management.md](/docs/infrastructure-optimization/cost-management)**: 整体成本策略（本文档专注于资源设置）
- **[eks-resiliency-guide.md](/docs/operations-observability/eks-resiliency-guide)**: 仅将资源设置作为检查清单项
:::

### 核心内容

- **Requests vs Limits 深入理解**: CPU throttling 和 OOM Kill 机制
- **QoS 类别策略**: Guaranteed、Burstable、BestEffort 的实战应用
- **VPA 完整指南**: 自动资源调整与 HPA 共存模式
- **Right-Sizing 方法论**: 基于 P95 的资源估算及 Goldilocks 使用
- **成本影响分析**: 资源优化的实际节省效果

### 学习目标

完成本指南后，您将能够：

- 理解 CPU 和 Memory requests/limits 的精确工作原理
- 根据工作负载特性选择合适的 QoS 类别
- 安全地配置 VPA 和 HPA 共存
- 基于实际使用量执行 Right-Sizing
- 将资源效率提升 30% 以上

## 前置要求

### 所需工具

| 工具 | 版本 | 用途 |
|------|------|------|
| kubectl | 1.28+ | Kubernetes 集群管理 |
| helm | 3.12+ | VPA、Goldilocks 安装 |
| metrics-server | 0.7+ | 资源指标收集 |
| kubectl-top | 内置 | 资源使用量确认 |

### 所需权限

```bash
# RBAC 权限确认
kubectl auth can-i get pods --all-namespaces
kubectl auth can-i get resourcequotas
kubectl auth can-i create verticalpodautoscaler
```

### 前置知识

- Kubernetes Pod、Deployment 基本概念
- YAML 清单编写经验
- Linux cgroups 基本理解（推荐）
- Prometheus/Grafana 基本使用方法（推荐）

## Resource Requests & Limits 深入理解

### 2.1 Requests vs Limits 的精确含义

Resource requests 和 limits 是 Kubernetes 资源管理的核心概念。

**Requests（请求量）**
- **定义**: 调度器在 Pod 放置时保证的最小资源
- **作用**: 节点选择依据、QoS 类别决定
- **保证**: kubelet 始终确保此量的可用

**Limits（限制量）**
- **定义**: kubelet 强制执行的最大资源
- **作用**: 防止资源耗尽、限制嘈杂邻居（noisy neighbor）
- **强制**: CPU 使用 throttling，Memory 使用 OOM Kill

```mermaid
graph TB
    subgraph "资源分配流程"
        A[Pod 创建请求] --> B{Scheduler}
        B -->|检查 Requests| C[选择合适的节点]
        C --> D[kubelet]
        D -->|设置 cgroups| E[Container Runtime]

        subgraph "运行时控制"
            E --> F{实际使用量}
            F -->|CPU > Limit| G[CPU Throttling]
            F -->|Memory > Limit| H[OOM Kill]
            F -->|正常范围| I[正常运行]
        end
    end

    style G fill:#ff6b6b
    style H fill:#ff0000,color:#fff
    style I fill:#51cf66
```

**核心差异**

| 属性 | CPU | Memory |
|------|-----|--------|
| **超过 Requests 时** | 如果其他 Pod 未使用则可以使用 | 如果其他 Pod 未使用则可以使用 |
| **超过 Limits 时** | **Throttling**（进程速度降低） | **OOM Kill**（进程强制终止） |
| **是否可压缩** | 可压缩 (Compressible) | 不可压缩 (Incompressible) |
| **超额使用风险** | 性能下降 | 服务中断 |

### 2.2 CPU 资源深入理解

#### CPU Millicore 单位

```yaml
# CPU 表示方法
resources:
  requests:
    cpu: "500m"    # 500 millicore = 0.5 CPU core
    cpu: "1"       # 1000 millicore = 1 CPU core
    cpu: "2.5"     # 2500 millicore = 2.5 CPU cores
```

**1 CPU core = 1000 millicore**
- AWS vCPU、Azure vCore 均相同
- 在超线程环境中也是以逻辑核心为基准

#### CFS Bandwidth Throttling

Linux CFS (Completely Fair Scheduler) 强制执行 CPU limits：

```bash
# cgroups v2 基准
/sys/fs/cgroup/cpu.max
# 示例: "100000 100000" = 每 100ms 周期可使用 100ms (100% = 1 CPU)
# 示例: "50000 100000" = 每 100ms 周期可使用 50ms (50% = 0.5 CPU)
```

**Throttling 机制**

```
时间周期: 100ms
CPU Limit: 500m (0.5 CPU)
→ 100ms 中仅可使用 50ms

实际运行:
[0-50ms] ████████████████████ (运行)
[50-100ms] ...................... (throttled)
[100-150ms] ████████████████████ (运行)
[150-200ms] ...................... (throttled)
```

:::warning 不设置 CPU Limits 的策略
Google、Datadog 等大规模集群运营组织不设置 CPU limits：

**原因：**
- CPU 是可压缩资源（其他 Pod 需要时会自动调整）
- 避免因 Throttling 导致的不必要性能下降
- 仅通过 Requests 即可实现调度和 QoS 控制

**替代推荐：**
- CPU requests 基于 P95 使用量设置
- 通过 HPA 按负载水平扩展
- 加强节点级别资源监控

**例外（需要设置 Limits）：**
- 批处理作业（防止 CPU 独占）
- 不可信的工作负载
- 多租户环境
:::

#### CPU 资源设置示例

```yaml
# 模式 1: 仅设置 Requests（推荐）
apiVersion: v1
kind: Pod
metadata:
  name: web-server
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    resources:
      requests:
        cpu: "250m"       # 基于 P95 使用量
        memory: "128Mi"
      # 省略 limits - 利用 CPU 可压缩资源特性

---
# 模式 2: 批处理作业（设置 Limits）
apiVersion: batch/v1
kind: Job
metadata:
  name: data-processing
spec:
  template:
    spec:
      containers:
      - name: processor
        image: data-processor:v1
        resources:
          requests:
            cpu: "1000m"
          limits:
            cpu: "2000m"   # 防止 CPU 独占
            memory: "4Gi"
      restartPolicy: OnFailure
```

### 2.3 Memory 资源深入理解

#### Memory 单位

```yaml
# Memory 表示方法 (1024 基准 vs 1000 基准)
resources:
  requests:
    memory: "128Mi"    # 128 * 1024^2 bytes = 134,217,728 bytes
    memory: "128M"     # 128 * 1000^2 bytes = 128,000,000 bytes
    memory: "1Gi"      # 1 * 1024^3 bytes = 1,073,741,824 bytes
    memory: "1G"       # 1 * 1000^3 bytes = 1,000,000,000 bytes
```

**推荐**: **使用 Mi、Gi**（1024 基准，Kubernetes 标准）

#### OOM Kill 机制

当超过 Memory limits 时，Linux OOM Killer 会强制终止进程：

```
实际使用量 > Memory Limit
→ 超过 cgroup memory.max
→ Kernel OOM Killer 触发
→ 进程 SIGKILL
→ Pod 状态: OOMKilled
→ kubelet 重启 Pod（遵循 RestartPolicy）
```

**OOM Score 计算**

```bash
# 查看每个进程的 OOM Score
cat /proc/<PID>/oom_score

# OOM Score 计算因素
# 1. 内存使用量（越高分数越高）
# 2. oom_score_adj 值（每个 QoS 类别不同）
# 3. root 进程保护（-1000 = 绝不 Kill）
```

:::danger Memory limits 必须设置
Memory 是不可压缩资源，因此**必须设置 limits**：

**原因：**
- Memory 耗尽时整个节点不稳定
- 可能导致 Kernel Panic
- 影响其他 Pod（节点 Eviction）

**推荐设置：**
- `requests = limits`（Guaranteed QoS）
- 或 `limits = requests * 1.5`（Burstable QoS）
- JVM 应用：Heap 大小设置为 limits 的 75%
:::

#### Memory 资源设置示例

```yaml
# 模式 1: Guaranteed QoS（稳定性优先）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: database
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:16
        resources:
          requests:
            cpu: "2000m"
            memory: "4Gi"
          limits:
            cpu: "2000m"      # 与 requests 相同
            memory: "4Gi"     # 与 requests 相同 (Guaranteed)

---
# 模式 2: JVM 应用
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: java-app:v1
        env:
        - name: JAVA_OPTS
          value: "-Xmx3072m -Xms3072m"  # limits 的 75% (4Gi * 0.75 = 3Gi)
        resources:
          requests:
            memory: "4Gi"
          limits:
            memory: "4Gi"

---
# 模式 3: Node.js 应用
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: nodejs-api:v2
        env:
        - name: NODE_OPTIONS
          value: "--max-old-space-size=896"  # limits 的 70% (1280Mi * 0.7 = 896Mi)
        resources:
          requests:
            memory: "1280Mi"
          limits:
            memory: "1280Mi"
```

### 2.4 Ephemeral Storage

容器本地存储也可以作为资源进行管理：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ephemeral-demo
spec:
  containers:
  - name: app
    image: busybox
    resources:
      requests:
        ephemeral-storage: "2Gi"    # 最低保证
      limits:
        ephemeral-storage: "4Gi"    # 最大使用量
    volumeMounts:
    - name: cache
      mountPath: /cache
  volumes:
  - name: cache
    emptyDir:
      sizeLimit: "4Gi"
```

**Ephemeral Storage 包含项：**
- 容器层写入
- 日志文件（`/var/log`）
- emptyDir 卷
- 临时文件

**节点 Eviction 阈值：**

```yaml
# kubelet 设置
evictionHard:
  nodefs.available: "10%"      # 节点整体磁盘低于 10% 时 eviction
  nodefs.inodesFree: "5%"      # inode 低于 5% 时 eviction
  imagefs.available: "10%"     # 镜像文件系统低于 10% 时 eviction
```

### 2.5 EKS Auto Mode 资源优化

EKS Auto Mode 是一种完全托管的解决方案，能够极大地降低 Kubernetes 集群运维的复杂性。它从计算、存储、网络的资源配置到持续维护全部自动化，使运维团队能够专注于应用开发而非基础设施管理。

#### 2.5.1 Auto Mode 概述

**核心功能：**
- **一键激活**: 创建集群时只需 `--compute-config autoMode` 标志即可激活
- **自动基础设施配置**: 根据 Pod 调度需求自动选择最优实例类型
- **持续维护**: OS 补丁、安全更新、核心 Add-on 管理自动化
- **成本优化**: 自动使用 Graviton 处理器和 Spot 实例
- **集成安全**: AWS 安全服务默认集成

```bash
# Auto Mode 集群创建
aws eks create-cluster \
  --name my-auto-cluster \
  --compute-config autoMode=ENABLED \
  --kubernetes-network-config serviceIpv4Cidr=10.100.0.0/16 \
  --access-config bootstrapClusterCreatorAdminPermissions=true
```

:::info Auto Mode vs 手动管理
Auto Mode 并非完全替代现有的手动管理方式，而是为希望最小化运维开销的团队提供的**补充选择**。如果需要精细控制，仍然可以选择手动管理方式。
:::

#### 2.5.2 Auto Mode vs 手动管理对比

| 项目 | 手动管理 | Auto Mode |
|------|----------|-----------|
| **节点配置** | Managed Node Group、Self-managed、Karpenter 直接配置 | 自动配置（基于 EC2 Managed Instances） |
| **实例类型选择** | 手动选择并配置 NodePool | 基于 Pod 需求自动选择（Graviton 优先） |
| **VPA 设置** | 需要手动安装和配置 | 不需要（自动资源优化） |
| **HPA 设置** | 手动设置和指标配置 | 可自动配置（开发者仅需声明） |
| **OS 补丁** | 手动或自动化脚本 | 完全自动（零宕机） |
| **安全更新** | 手动应用 | 自动应用 |
| **核心 Add-on 管理** | 手动升级 (CoreDNS, kube-proxy, VPC CNI) | 自动升级 |
| **成本优化** | 手动配置 Spot、Graviton | 自动使用（最高节省 90%） |
| **Request/Limit 设置** | 开发者负责（必须） | 开发者负责（仍然必须） |
| **资源效率** | VPA Off 模式 + 手动应用 | 自动 Right-Sizing（持续） |
| **学习曲线** | 高（需要 Kubernetes、AWS 专业知识） | 低（仅需 Kubernetes 基础） |
| **运维开销** | 高 | 最小 |

:::warning Auto Mode 中开发者的责任
Auto Mode 自动化了基础设施，但 **Pod 级别的 requests/limits 设置仍然是开发者的责任**。这是因为最了解应用实际资源需求的人是开发者。
:::

#### 2.5.3 Graviton + Spot 组合优化

Auto Mode 智能地组合 AWS Graviton 处理器和 Spot 实例，最大化成本效率。

**Graviton 处理器的优势：**
- **性价比提升 40%**（相比 x86）
- 最适合通用工作负载、Web 服务器、容器化微服务
- 支持 Arm64 架构（大多数容器镜像兼容）

**Spot 实例节省：**
- **最高节省 90% 成本**（相比 On-Demand）
- Auto Mode 自动监控 Spot 可用性并处理 Fallback
- 中断前 2 分钟通知，保证 Graceful Termination

```mermaid
graph TB
    subgraph "Auto Mode 实例选择逻辑"
        A[Pod 调度请求] --> B{资源需求分析}
        B --> C[优先尝试 Graviton Spot]
        C --> D{检查 Spot 可用性}
        D -->|可用| E[配置 Graviton Spot 实例]
        D -->|不可用| F[尝试 Graviton On-Demand]
        F --> G{On-Demand 可用性}
        G -->|可用| H[配置 Graviton On-Demand]
        G -->|不可用| I[x86 Spot/On-Demand Fallback]

        E --> J[Pod 放置完成]
        H --> J
        I --> J
    end

    style E fill:#51cf66
    style H fill:#ffa94d
    style I fill:#ff6b6b
```

**NodePool YAML 示例（手动管理集群 - 基于 Karpenter）：**

```yaml
# Auto Mode 会自动创建此类 NodePool，
# 以下展示手动设置时的 Graviton + Spot 模式供参考
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: graviton-spot-pool
spec:
  template:
    spec:
      requirements:
      # Graviton 实例优先
      - key: kubernetes.io/arch
        operator: In
        values: ["arm64"]

      # Spot 优先，Fallback 到 On-Demand
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot", "on-demand"]

      # 通用工作负载实例族
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["m7g.medium", "m7g.large", "m7g.xlarge", "m7g.2xlarge"]

      nodeClassRef:
        name: default

  # Spot 中断处理
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h

  # 资源限制
  limits:
    cpu: "1000"
    memory: "1000Gi"

---
# Fallback: x86 On-Demand（Spot 不可用时）
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: x86-ondemand-fallback
spec:
  weight: 10  # 低优先级
  template:
    spec:
      requirements:
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]

      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand"]

      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["m6i.large", "m6i.xlarge", "m6i.2xlarge"]

      nodeClassRef:
        name: default
```

**Auto Mode 中的自动处理：**

Auto Mode 无需手动编写上述 NodePool 配置，它会分析 Pod 的资源需求和工作负载特性，自动选择最优实例。

```yaml
# Auto Mode 环境中开发者编写的 Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 10
  template:
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-arm64  # Graviton 用镜像
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            memory: "1Gi"

      # Auto Mode 自动执行：
      # 1. 尝试选择 Graviton Spot 实例
      # 2. Spot 不可用时 Fallback 到 Graviton On-Demand
      # 3. 自动选择实例类型 (m7g.large 等)
      # 4. 节点配置及 Pod 放置
```

:::tip Graviton 镜像准备
要使用 Graviton 实例，需要 **arm64 架构的容器镜像**。大多数官方镜像支持 multi-arch，因此可以使用相同的镜像标签在 Graviton 和 x86 上运行。

```bash
# 检查 multi-arch 镜像
docker manifest inspect nginx:1.25 | jq '.manifests[].platform'

# 输出示例：
# { "architecture": "amd64", "os": "linux" }
# { "architecture": "arm64", "os": "linux" }
```
:::

**实际成本节省示例：**

| 场景 | 实例类型 | 每小时成本 | 月成本 (730小时) | 节省率 |
|---------|-------------|-----------|-------------------|--------|
| x86 On-Demand | m6i.2xlarge | $0.384 | $280.32 | - |
| Graviton On-Demand | m7g.2xlarge | $0.3264 | $238.27 | 15% |
| Graviton Spot | m7g.2xlarge | $0.0979 | $71.47 | 75% |

以 10 个节点为基准：
- x86 On-Demand: $2,803/月
- Graviton On-Demand: $2,383/月 (节省 15%)
- **Graviton Spot: $715/月 (节省 75%)** ⭐

**Graviton4 专项优化：**

Graviton4 (R8g, M8g, C8g) 实例相比 Graviton3 提供了 **30% 的计算性能提升**和 **75% 的内存带宽提升**。

| 代际 | 实例族 | 性能提升 | 主要工作负载 |
|------|---------------|---------|-------------|
| Graviton3 | m7g, c7g, r7g | 基准 | 通用 Web/API、容器 |
| **Graviton4** | **m8g, c8g, r8g** | **+30% 计算, +75% 内存** | **高性能数据库、ML 推理、实时分析** |

**ARM64 Multi-Arch 构建流水线：**

要充分利用 Graviton 实例，需要同时支持 ARM64 和 AMD64 的 multi-arch 容器镜像。

```dockerfile
# Multi-arch Dockerfile 示例
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder
ARG TARGETOS TARGETARCH

WORKDIR /app
COPY . .

# 针对目标架构构建
RUN GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o app .

# 运行时镜像
FROM alpine:3.19
COPY --from=builder /app/app /usr/local/bin/app
ENTRYPOINT ["/usr/local/bin/app"]
```

**GitHub Actions CI/CD 中的 multi-arch 构建：**

```yaml
# .github/workflows/build.yml
name: Build Multi-Arch Image
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push multi-arch
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64  # 包含 ARM64
          push: true
          tags: |
            ${{ secrets.ECR_REGISTRY }}/myapp:${{ github.sha }}
            ${{ secrets.ECR_REGISTRY }}/myapp:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Graviton3 → Graviton4 迁移基准测试要点：**

```yaml
# Graviton4 优先 NodePool 示例 (Karpenter)
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: graviton4-spot-pool
spec:
  template:
    spec:
      requirements:
      # Graviton4 优先，Graviton3 Fallback
      - key: node.kubernetes.io/instance-type
        operator: In
        values:
          # Graviton4（最优先）
          - "m8g.medium"
          - "m8g.large"
          - "m8g.xlarge"
          - "m8g.2xlarge"
          # Graviton3（Fallback）
          - "m7g.medium"
          - "m7g.large"
          - "m7g.xlarge"
          - "m7g.2xlarge"

      - key: kubernetes.io/arch
        operator: In
        values: ["arm64"]

      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot", "on-demand"]

      nodeClassRef:
        name: default

  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s

  limits:
    cpu: "1000"
    memory: "2000Gi"
```

**Graviton4 性能基准测试检查点：**

迁移时监控以下指标以验证性能提升：

| 指标 | Graviton3 基准 | Graviton4 目标 | 测量方法 |
|-------|--------------|--------------|---------|
| **P99 响应时间** | 100ms | 70ms (-30%) | Prometheus `http_request_duration_seconds` |
| **吞吐量 (RPS)** | 1000 req/s | 1300 req/s (+30%) | 负载测试 (k6, Locust) |
| **内存带宽** | 205 GB/s | 358 GB/s (+75%) | `sysbench memory` |
| **CPU 使用率** | 60% | 45% (-25%) | `node_cpu_seconds_total` |

```bash
# Graviton4 性能测试脚本
#!/bin/bash
# 1. 内存带宽测试
sysbench memory --memory-total-size=100G --memory-oper=write run

# 2. CPU 基准测试
sysbench cpu --cpu-max-prime=20000 --threads=8 run

# 3. 应用负载测试 (k6)
k6 run --vus 100 --duration 5m loadtest.js

# 4. Prometheus 指标收集
curl -s http://localhost:9090/api/v1/query?query=rate(http_request_duration_seconds_sum[5m]) | jq .
```

:::tip Graviton4 迁移检查清单

- [ ] **容器镜像**: 确认 ARM64 支持 (`docker manifest inspect`)
- [ ] **依赖库**: 验证 ARM64 兼容性
- [ ] **CI/CD 流水线**: 启用 Multi-arch 构建
- [ ] **NodePool 优先级**: 设置 Graviton4 → Graviton3 → x86 顺序
- [ ] **性能基准测试**: 测量 P99 延迟、吞吐量、CPU 使用率
- [ ] **成本分析**: 计算相比 Graviton3 的性价比
:::

#### 2.5.4 Auto Mode 环境的资源设置建议

Auto Mode 虽然自动化了很多部分，但开发者仍需准确设置应用的资源需求。

**Auto Mode 自动处理的项目：**

| 项目 | 手动管理 | Auto Mode |
|------|----------|-----------|
| 节点配置 | Karpenter、Managed Node Group 设置 | 自动 |
| 实例类型选择 | 在 NodePool 中手动指定 | 基于 Pod requests 自动选择 |
| Spot/On-Demand 切换 | 手动或 Karpenter 设置 | 自动 Fallback |
| 节点扩缩容 | HPA + Cluster Autoscaler/Karpenter | 自动 |
| OS 补丁 | 手动或自动化脚本 | 自动（零宕机） |

**开发者仍需设置的项目：**

| 项目 | 原因 | 推荐方法 |
|------|------|----------|
| **CPU Requests** | 调度决策依据 | P95 使用量 + 20% |
| **Memory Requests** | 调度及 OOM 防止 | P95 使用量 + 20% |
| **Memory Limits** | 防止 OOM Kill（必须） | Requests × 1.5~2 |
| **CPU Limits** | 通用工作负载建议不设置 | 仅批处理作业设置 |
| **HPA 指标** | 水平扩展基准 | CPU 70%, Custom Metrics |

**Auto Mode 环境中 VPA 角色的变化：**

```mermaid
graph TB
    subgraph "手动管理集群"
        A1[VPA Recommender] --> A2[生成建议]
        A2 --> A3[VPA Updater]
        A3 --> A4[通过 Pod 重启更改资源]
    end

    subgraph "Auto Mode 集群"
        B1[内置 Right-Sizing 引擎] --> B2[持续使用量分析]
        B2 --> B3[自动资源优化]
        B3 --> B4[向开发者提供建议]
        B4 --> B5[开发者更新 Deployment]
    end

    style A4 fill:#ffa94d
    style B3 fill:#51cf66
```

**在 Auto Mode 中 VPA：**
- 无需单独安装
- 内置 Right-Sizing 引擎持续分析工作负载
- 向开发者提供建议（而非自动应用）
- 开发者审核后反映到 Deployment 清单中

**推荐工作流程：**

```bash
# 1. 部署到 Auto Mode 集群
kubectl apply -f deployment.yaml

# 2. 7-14 天后在 Auto Mode 仪表板查看建议
# (AWS Console → EKS → Clusters → <cluster-name> → Insights)

# 3. 将建议反映到 Deployment
kubectl set resources deployment web-app \
  --requests=cpu=300m,memory=512Mi \
  --limits=memory=1Gi

# 4. 通过 GitOps 更新清单
git add deployment.yaml
git commit -m "chore: apply Auto Mode resource recommendations"
git push
```

:::tip Auto Mode 推荐场景
Auto Mode 在以下情况中特别有用：

- **新集群**: 无现有基础设施，快速启动
- **运维资源不足**: 小团队无 Kubernetes 专家运维
- **成本优化优先**: 自动使用 Graviton + Spot 立即节省
- **标准化工作负载**: 一般的 Web/API 服务器、微服务

**推荐手动管理的场景：**
- **需要精细控制**: 特定实例类型、AZ 放置、网络配置
- **现有 Karpenter 投资**: 拥有高度定制的 NodePool 策略
- **合规要求**: 特定硬件、安全组强制
:::

**Auto Mode + 手动 Right-Sizing 对比：**

| 项目 | 手动 Right-Sizing (VPA Off) | Auto Mode |
|------|---------------------------|-----------|
| 初始设置复杂度 | 高（VPA 安装、Prometheus 配置） | 低（创建集群时仅需标志） |
| 建议生成时间 | 7-14 天 | 7-14 天（相同） |
| 建议准确度 | 高（基于 Prometheus） | 高（内置分析引擎） |
| 应用方式 | 手动（开发者修改清单） | 手动（开发者修改清单） |
| 持续监控 | 手动（定期检查 VPA） | 自动（仪表板告警） |
| 基础设施优化 | 手动（Karpenter 设置） | 自动（Graviton + Spot） |
| 总运维开销 | 高 | 低 |

**结论：**

Auto Mode **消除了资源优化的复杂性**，但**不消除资源设置的责任**。开发者仍需设置应用的 requests/limits，Auto Mode 基于此自动配置最优基础设施。

这通过**"开发者定义应用需求，AWS 管理基础设施"**的明确职责分离，让双方都能专注于各自的专业领域。

## QoS (Quality of Service) 类别

### 3.1 三种 QoS 类别

Kubernetes 根据资源设置将 Pod 分为 3 种 QoS 类别：

#### Guaranteed（最高优先级）

**条件：**
- 所有容器都设置了 CPU 和 Memory 的 requests 和 limits
- **requests == limits**（相同值）

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: guaranteed-pod
  labels:
    qos: guaranteed
spec:
  containers:
  - name: app
    image: nginx:1.25
    resources:
      requests:
        cpu: "500m"
        memory: "256Mi"
      limits:
        cpu: "500m"        # 与 requests 相同
        memory: "256Mi"    # 与 requests 相同
  - name: sidecar
    image: fluentd:v1
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "100m"
        memory: "128Mi"
```

**特点：**
- oom_score_adj: **-997**（最低，OOM Kill 优先级最低）
- 节点资源压力时最后被 Eviction
- CPU 调度优先级高

#### Burstable（中等优先级）

**条件：**
- 至少 1 个容器设置了 CPU 或 Memory requests
- 不满足 Guaranteed 条件

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: burstable-pod
  labels:
    qos: burstable
spec:
  containers:
  - name: app
    image: web-app:v1
    resources:
      requests:
        cpu: "250m"
        memory: "512Mi"
      limits:
        cpu: "1000m"       # 大于 requests (Burstable)
        memory: "1Gi"      # 大于 requests

  - name: cache
    image: redis:7
    resources:
      requests:
        memory: "256Mi"    # 无 CPU requests (Burstable)
      limits:
        memory: "512Mi"
```

**特点：**
- oom_score_adj: **min(max(2, 1000 - (1000 * memoryRequestBytes) / machineMemoryCapacityBytes), 999)**
- 根据使用量动态调整
- 有余量时可 burst

#### BestEffort（最低优先级）

**条件：**
- 所有容器都未设置 requests 和 limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: besteffort-pod
  labels:
    qos: besteffort
spec:
  containers:
  - name: app
    image: test-app:latest
    # 无 resources 段或为空
```

**特点：**
- oom_score_adj: **1000**（最高，OOM Kill 最优先）
- 节点资源压力时最先被 Eviction
- 建议仅在开发/测试环境使用

### 3.2 QoS 与 Eviction 优先级

当节点资源压力时，kubelet 按以下顺序 Evict Pod：

```mermaid
graph TB
    A[节点资源压力] --> B{Eviction 决策}

    B --> C[第 1 阶段: BestEffort Pod]
    C --> D{资源恢复?}
    D -->|No| E[第 2 阶段: Burstable Pod<br/>超过 requests 使用中]
    D -->|Yes| Z[Eviction 停止]

    E --> F{资源恢复?}
    F -->|No| G[第 3 阶段: Burstable Pod<br/>低于 requests 使用中]
    F -->|Yes| Z

    G --> H{资源恢复?}
    H -->|No| I[第 4 阶段: Guaranteed Pod<br/>仅排除必要系统 Pod]
    H -->|Yes| Z

    I --> Z

    style C fill:#ff6b6b
    style E fill:#ffa94d
    style G fill:#ffd43b
    style I fill:#ff0000,color:#fff
    style Z fill:#51cf66
```

**Eviction 顺序摘要：**

| 顺位 | QoS 类别 | 条件 | oom_score_adj |
|------|-----------|------|---------------|
| 1 (最优先) | BestEffort | 所有 Pod | 1000 |
| 2 | Burstable | 超过 requests 使用中 | 2-999 (与使用量成比例) |
| 3 | Burstable | 低于 requests 使用中 | 2-999 (与使用量成比例) |
| 4 (最后) | Guaranteed | 排除系统关键 Pod | -997 |

**oom_score_adj 查看方法：**

```bash
# 查找 Pod 的主容器进程
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[0].containerID}'

# 在节点上查看 oom_score_adj
docker inspect <container-id> | grep Pid
cat /proc/<pid>/oom_score_adj

# 示例输出
# BestEffort: 1000
# Burstable: 500 (根据使用量变动)
# Guaranteed: -997
```

### 3.3 实战 QoS 策略

根据工作负载特性选择 QoS 类别的指南：

| 工作负载类型 | 推荐 QoS | 设置模式 | 原因 |
|-------------|---------|----------|------|
| **生产 API** | Guaranteed | requests = limits | 稳定性优先，防止 Eviction |
| **数据库** | Guaranteed | requests = limits | 内存压力时也受保护 |
| **批处理作业** | Burstable | limits > requests | 空闲时利用资源，成本效率高 |
| **队列 Worker** | Burstable | limits > requests | 应对负载波动 |
| **开发/测试** | BestEffort | 不设置 | 资源效率（生产环境禁止） |
| **监控 Agent** | Guaranteed | 设置较低值 | 系统稳定性 |

**生产推荐设置：**

```yaml
# 模式 1: 关键任务服务 (Guaranteed)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: production
spec:
  replicas: 5
  template:
    metadata:
      labels:
        app: payment-api
        tier: critical
    spec:
      containers:
      - name: api
        image: payment-api:v2.1
        resources:
          requests:
            cpu: "1000m"
            memory: "2Gi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
      priorityClassName: system-cluster-critical  # 额外保护

---
# 模式 2: 一般 Web 服务 (Burstable)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
  namespace: production
spec:
  replicas: 10
  template:
    spec:
      containers:
      - name: frontend
        image: web-frontend:v1.5
        resources:
          requests:
            cpu: "200m"       # P50 使用量
            memory: "256Mi"
          limits:
            cpu: "500m"       # P95 使用量
            memory: "512Mi"   # 防止 OOM

---
# 模式 3: 批处理 Worker (Burstable)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: report-generator
            image: report-gen:v1
            resources:
              requests:
                cpu: "500m"
                memory: "1Gi"
              limits:
                cpu: "4000m"     # 夜间时段利用资源
                memory: "8Gi"
          restartPolicy: OnFailure
```

## VPA (Vertical Pod Autoscaler) 详细指南

### 4.1 VPA 架构

VPA 由 3 个组件构成：

```mermaid
graph TB
    subgraph "VPA 架构"
        subgraph "指标收集"
            MS[Metrics Server] -->|资源指标| PROM[Prometheus]
            PROM -->|时间序列数据| REC[VPA Recommender]
        end

        subgraph "VPA 组件"
            REC -->|计算推荐值| VPA_OBJ[VPA CRD Object]
            VPA_OBJ -->|检查模式| UPD[VPA Updater]
            VPA_OBJ -->|验证新 Pod| ADM[VPA Admission Controller]

            UPD -->|重启 Pod| POD[Running Pods]
            ADM -->|注入资源| NEW_POD[New Pods]
        end

        subgraph "工作负载"
            POD -->|上报使用量| MS
            NEW_POD -->|上报使用量| MS
        end
    end

    style REC fill:#4dabf7
    style UPD fill:#ffa94d
    style ADM fill:#51cf66
```

**组件角色：**

| 组件 | 角色 | 数据源 |
|---------|------|-----------|
| **Recommender** | 分析历史使用量，计算推荐值 | Metrics Server、Prometheus |
| **Updater** | Auto 模式下重启 Pod | VPA CRD 状态 |
| **Admission Controller** | 自动向新 Pod 注入资源 | VPA CRD 推荐值 |

#### 4.1.4 VPA Recommender ML 算法详解

VPA Recommender 并非简单的平均值计算，而是基于机器学习的精细算法来计算资源推荐值。

##### 指数加权直方图 (Exponentially-weighted Histogram)

VPA Recommender 的核心是随时间衰减的加权直方图：

```
最近数据 → 高权重
历史数据 → 低权重（指数衰减）
```

**算法工作方式：**

1. **指标收集周期**：每分钟收集 Pod 资源使用量
2. **直方图更新**：将每次测量值累积到直方图桶中
3. **权重应用**：历史数据以 `e^(-t/decay_half_life)` 权重衰减
4. **推荐值计算**：基于直方图百分位数计算推荐值

```mermaid
graph TB
    subgraph "VPA Recommender 算法"
        A[Metrics Server] -->|每分钟| B[收集指标]
        B --> C[更新直方图桶]
        C --> D[应用指数权重]
        D --> E[计算百分位数]

        E --> F[Lower Bound<br/>P5]
        E --> G[Target<br/>P95]
        E --> H[Upper Bound<br/>P99]
        E --> I[Uncapped Target<br/>无约束 P95]

        F --> J[更新 VPA CRD]
        G --> J
        H --> J
        I --> J
    end

    style G fill:#51cf66
    style J fill:#4dabf7
```

##### 四种推荐值计算方法

| 推荐值 | 计算方法 | 含义 |
|--------|----------|------|
| **Lower Bound** | P5（第 5 百分位数） | 最低所需资源 - 95% 时间内足够 |
| **Target** | P95（第 95 百分位数） | **推荐设置值** - 应对 5% 峰值负载 |
| **Upper Bound** | P99（第 99 百分位数） | 最大观察使用量 - 用于 Limits 设置参考 |
| **Uncapped Target** | 无 maxAllowed 约束计算的 P95 | 用于确认实际需求量 |

**百分位数计算示例：**

```python
# 虚拟 CPU 使用量直方图（1 天 = 1440 分钟）
cpu_samples = [100m, 150m, 200m, 250m, 300m, 350m, 400m, 450m, 500m, ...]

# 应用指数权重（decay_half_life = 24 小时）
weighted_samples = [
    (100m, weight=1.0),    # 最近（1 小时前）
    (150m, weight=0.97),   # 2 小时前
    (200m, weight=0.92),   # 5 小时前
    (250m, weight=0.71),   # 12 小时前
    (300m, weight=0.50),   # 24 小时前（半衰期）
    (350m, weight=0.25),   # 48 小时前
    ...
]

# 百分位数计算
P5  = 150m  # Lower Bound
P95 = 450m  # Target ⭐
P99 = 500m  # Upper Bound
```

##### Confidence Multiplier：基于置信度的调整

数据收集期越短，推荐值越保守（越高）：

```
Confidence Multiplier = f(数据收集期)

0-24 小时：multiplier = 1.5（50% 安全裕量）
1-3 天：   multiplier = 1.3（30% 安全裕量）
3-7 天：   multiplier = 1.1（10% 安全裕量）
7 天以上： multiplier = 1.0（置信度足够）
```

**实际应用示例：**

```yaml
# 数据收集第 2 天
原始 P95: 450m
Confidence Multiplier: 1.3
最终 Target: 450m × 1.3 = 585m ≈ 600m

# 数据收集第 10 天
原始 P95: 450m
Confidence Multiplier: 1.0
最终 Target: 450m × 1.0 = 450m
```

:::info 数据收集期的重要性
VPA 要提供准确的推荐值，至少需要 **7 天，建议 14 天**的数据收集期。要捕捉工作日/周末等周期性模式，至少需要 2 周以上的观察。
:::

##### Memory 推荐：基于 OOM 事件的 Bump-Up

Memory 与 CPU 不同，会特别考虑 OOM Kill 事件：

**检测到 OOM 事件时：**

```
当前 Memory Target: 500Mi
OOM Kill 发生时内存: 600Mi
→ 新 Target: 600Mi × 1.2 = 720Mi（增加 20% 安全裕量）
```

**OOM Bump-Up 逻辑：**

```python
if oom_kill_detected:
    oom_memory = get_memory_at_oom_time()
    new_target = max(
        current_target,
        oom_memory * 1.2  # 20% 安全裕量
    )

    # 防止突然变化（最大 2 倍）
    new_target = min(new_target, current_target * 2)
```

:::warning OOM Kill 即时生效
与 CPU throttling 不同，OOM Kill 事件会**立即上调 Memory Target**。这是防止服务中断的安全机制。
:::

##### CPU 推荐：基于 P95/P99 使用量

CPU 是可压缩资源，因此采取保守策略：

```
CPU Target = P95 使用量
CPU Upper Bound = P99 使用量

Throttling 发生时：
→ 不改变推荐值（建议使用 HPA 解决）
```

**检测到 CPU Throttling 时：**

```python
if cpu_throttling_detected:
    throttled_percentage = get_throttled_time_percentage()

    if throttled_percentage > 10:
        # VPA 自身推荐值保持不变
        # 而是建议以下措施：
        # 1. 添加 HPA 进行水平扩展
        # 2. 移除 CPU limits（Google、Datadog 模式）
        # 3. 或者手动将 Target 上调至 P99
        pass
```

:::tip CPU Throttling vs HPA
VPA 检测到 CPU throttling 时不会大幅提高推荐值。相反，**使用 HPA 进行水平扩展**才是 Kubernetes 最佳实践。
:::

##### VPA 与 Prometheus 数据源集成

VPA Recommender 仅使用 Metrics Server 即可运行，但与 Prometheus 集成后能提供更精确的推荐：

**Prometheus 指标使用：**

```yaml
# VPA Recommender 的 Prometheus 集成配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: vpa-recommender-config
  namespace: vpa-system
data:
  recommender-config.yaml: |
    # 启用 Prometheus 指标源
    metrics-provider: prometheus
    prometheus-url: http://prometheus-server.monitoring.svc:9090

    # 直方图设置
    histogram-decay-half-life: 24h
    histogram-bucket-size-growth: 1.05

    # CPU 推荐设置
    cpu-histogram-decay-half-life: 24h
    memory-histogram-decay-half-life: 48h  # Memory 需要更长的观察期

    # OOM 事件处理
    oom-min-bump-up: 1.2  # 最低 20% 增加
    oom-bump-up-ratio: 0.5  # 50% 安全裕量
```

**Prometheus Custom Metrics API 集成：**

```bash
# 部署 Custom Metrics API 适配器（Prometheus Adapter）
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-server.monitoring.svc \
  --set rules.default=true

# 设置 VPA 使用 Custom Metrics API
kubectl edit deploy vpa-recommender -n vpa-system

# 添加环境变量：
# - PROMETHEUS_ADDRESS=http://prometheus-server.monitoring.svc:9090
# - USE_CUSTOM_METRICS=true
```

**验证集成：**

```bash
# 确认 VPA Recommender 正在使用 Prometheus 指标
kubectl logs -n vpa-system deploy/vpa-recommender | grep prometheus

# 预期输出：
# I0212 10:15:30.123456  1 metrics_client.go:45] Using Prometheus metrics provider
# I0212 10:15:31.234567  1 prometheus_client.go:78] Connected to Prometheus at http://prometheus-server.monitoring.svc:9090
```

##### VPA 推荐质量验证方法

用于验证推荐值是否合理的 PromQL 查询：

**1. CPU 推荐值 vs 实际使用量比较：**

```promql
# VPA Target vs 实际 P95 使用量比较
(
  kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource="cpu"}
  -
  quantile_over_time(0.95,
    container_cpu_usage_seconds_total{pod=~"web-app-.*"}[7d]
  ) * 1000
) /
kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource="cpu"} * 100

# 输出：推荐值与实际 P95 差异（%）
# 10-20% 范围：合适 ✅
# >30%：过度配置 ⚠️
# <0%：配置不足（需立即调整）🚨
```

**2. Memory 推荐值验证：**

```promql
# VPA Target vs 实际 P99 使用量
(
  kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource="memory"}
  -
  quantile_over_time(0.99,
    container_memory_working_set_bytes{pod=~"web-app-.*"}[7d]
  )
) /
kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource="memory"} * 100

# 20-30% 余量：理想 ✅
# <10% 余量：OOM 风险 🚨
```

**3. OOM Kill 频率监控：**

```promql
# 最近 7 天 OOM Kill 事件数
increase(
  kube_pod_container_status_terminated_reason{reason="OOMKilled"}[7d]
)

# 0 次：VPA 推荐准确 ✅
# 1-2 次：可接受（峰值负载）
# >3 次：需手动上调 VPA Target 🚨
```

**4. CPU Throttling 比率：**

```promql
# CPU Throttling 时间比率（%）
rate(container_cpu_cfs_throttled_seconds_total{pod=~"web-app-.*"}[5m])
/
rate(container_cpu_cfs_periods_total{pod=~"web-app-.*"}[5m]) * 100

# <5%：正常 ✅
# 5-10%：需要监控 ⚠️
# >10%：考虑添加 HPA 或移除 CPU limits 🚨
```

**Grafana 仪表板示例：**

```yaml
# VPA 推荐质量监控仪表板
apiVersion: v1
kind: ConfigMap
metadata:
  name: vpa-quality-dashboard
  namespace: monitoring
data:
  dashboard.json: |
    {
      "panels": [
        {
          "title": "CPU: VPA Target vs P95 实际使用量",
          "targets": [
            {
              "expr": "kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource=\"cpu\"}",
              "legendFormat": "VPA Target"
            },
            {
              "expr": "quantile_over_time(0.95, container_cpu_usage_seconds_total[7d]) * 1000",
              "legendFormat": "实际 P95"
            }
          ]
        },
        {
          "title": "Memory: VPA Target vs P99 实际使用量",
          "targets": [
            {
              "expr": "kube_verticalpodautoscaler_status_recommendation_containerrecommendations_target{resource=\"memory\"}",
              "legendFormat": "VPA Target"
            },
            {
              "expr": "quantile_over_time(0.99, container_memory_working_set_bytes[7d])",
              "legendFormat": "实际 P99"
            }
          ]
        },
        {
          "title": "OOM Kill 事件（7 天）",
          "targets": [
            {
              "expr": "increase(kube_pod_container_status_terminated_reason{reason=\"OOMKilled\"}[7d])"
            }
          ]
        }
      ]
    }
```

:::tip VPA 推荐的局限性
VPA 基于历史数据推荐，因此在以下场景存在局限：
- **突然的流量模式变化**：历史中不存在的峰值负载
- **季节性工作负载**：月末批处理、年终结算等
- **初始引导阶段**：应用启动时的高内存使用

这些情况下需要**手动调整**或**与 HPA 配合使用**。
:::

### 4.2 VPA 安装与配置

#### 通过 Helm 安装

```bash
# 1. 安装 Metrics Server（前置条件）
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. 确认 Metrics Server
kubectl get deployment metrics-server -n kube-system
kubectl top nodes

# 3. 添加 VPA Helm 仓库
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm repo update

# 4. 安装 VPA
helm install vpa fairwinds-stable/vpa \
  --namespace vpa-system \
  --create-namespace \
  --set recommender.enabled=true \
  --set updater.enabled=true \
  --set admissionController.enabled=true

# 5. 确认安装
kubectl get pods -n vpa-system
# 预期输出：
# NAME                                      READY   STATUS    RESTARTS   AGE
# vpa-admission-controller-xxx              1/1     Running   0          1m
# vpa-recommender-xxx                       1/1     Running   0          1m
# vpa-updater-xxx                           1/1     Running   0          1m
```

#### 手动安装（官方方法）

```bash
# 克隆 VPA 官方仓库
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler

# 安装 VPA
./hack/vpa-up.sh

# 确认安装
kubectl get crd | grep verticalpodautoscaler
```

### 4.3 VPA 模式

VPA 有 3 种运行模式：

#### Off 模式（仅提供推荐值）

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"    # 仅显示推荐值，不自动应用
```

**适用场景：**
- 首次引入 VPA 时
- 分析生产工作负载
- 需要手动审核后再应用时

**查看推荐值：**

```bash
# 查看 VPA 状态
kubectl describe vpa web-app-vpa -n production

# 输出示例：
# Recommendation:
#   Container Recommendations:
#     Container Name: web-app
#     Lower Bound:
#       Cpu:     150m
#       Memory:  200Mi
#     Target:          # ← 推荐使用此值
#       Cpu:     250m
#       Memory:  300Mi
#     Uncapped Target:
#       Cpu:     350m
#       Memory:  400Mi
#     Upper Bound:
#       Cpu:     500m
#       Memory:  600Mi
```

#### Initial 模式（仅在 Pod 创建时应用）

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: batch-worker-vpa
  namespace: batch
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: batch-worker
  updatePolicy:
    updateMode: "Initial"    # 仅在 Pod 创建时设置资源
  resourcePolicy:
    containerPolicies:
    - containerName: worker
      minAllowed:
        cpu: "100m"
        memory: "128Mi"
      maxAllowed:
        cpu: "4000m"
        memory: "16Gi"
```

**适用场景：**
- CronJob、Job 工作负载
- 不允许重启的 StatefulSet
- 需要手动扩缩的场景

**工作方式：**
1. 新 Pod 创建请求
2. VPA Admission Controller 注入推荐资源
3. 正在运行的 Pod 保持不变

#### Auto 模式（完全自动化）

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: development
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Auto"    # 自动重启 Pod 并调整资源
    minReplicas: 2        # 至少维持 2 个 Pod
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: "200m"
        memory: "256Mi"
      maxAllowed:
        cpu: "2000m"
        memory: "4Gi"
      controlledResources:
      - cpu
      - memory
      controlledValues: RequestsAndLimits  # 同时调整 requests 和 limits
```

**适用场景：**
- 开发/预发布环境
- Stateless 应用
- 已配置 PodDisruptionBudget 的工作负载

:::warning Auto 模式注意事项
Auto 模式会**重启 Pod**：
- 通过 Eviction API 重启
- 可能导致停机
- 必须配置 PodDisruptionBudget (PDB)
- 生产环境需谨慎使用

**建议：** 生产环境使用 **Off 或 Initial 模式**
:::

### 4.4 VPA + HPA 共存策略

同时使用 VPA 和 HPA 时必须防止冲突。

#### 冲突场景（❌ 禁止）

```yaml
# ❌ 错误配置：VPA Auto + HPA CPU 同时使用
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: bad-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"    # ❌ Auto 模式
  resourcePolicy:
    containerPolicies:
    - containerName: app
      controlledResources:
      - cpu                # ❌ 控制 CPU
      - memory

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bad-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu          # ❌ 使用 CPU 指标
      target:
        type: Utilization
        averageUtilization: 70
```

**问题：**
- VPA 更改 CPU requests → HPA 的 CPU 使用率计算发生变化
- HPA 触发 Scale Out → VPA 再次调整资源 → 无限循环

#### 模式 1：VPA Off + HPA（✅ 推荐）

```yaml
# ✅ 正确配置：VPA 仅提供推荐，HPA 负责扩缩
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"    # ✅ 仅提供推荐值
  resourcePolicy:
    containerPolicies:
    - containerName: app
      controlledResources:
      - cpu
      - memory

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

**运维工作流：**
1. VPA 生成推荐值
2. 周会审查 VPA 推荐值
3. 手动更新 Deployment 清单
4. HPA 根据负载进行水平扩展

#### 模式 2：VPA Memory + HPA CPU（✅ 推荐）

```yaml
# ✅ 指标分离：VPA 管理 Memory，HPA 管理 CPU
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  updatePolicy:
    updateMode: "Auto"    # 仅自动调整 Memory
  resourcePolicy:
    containerPolicies:
    - containerName: api
      controlledResources:
      - memory            # ✅ 仅控制 Memory
      minAllowed:
        memory: "256Mi"
      maxAllowed:
        memory: "8Gi"

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu          # ✅ 仅使用 CPU 指标
      target:
        type: Utilization
        averageUtilization: 60
```

**优势：**
- VPA 优化 Memory（垂直）
- HPA 根据负载水平扩展（水平）
- 无冲突

#### 模式 3：VPA + HPA + Custom Metrics（✅ 高级）

```yaml
# ✅ HPA 使用自定义指标
---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: worker-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: queue-worker
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: worker
      controlledResources:
      - cpu
      - memory

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: queue-worker
  minReplicas: 2
  maxReplicas: 50
  metrics:
  - type: External
    external:
      metric:
        name: sqs_queue_depth    # ✅ 自定义指标（非 CPU/Memory）
        selector:
          matchLabels:
            queue: "tasks"
      target:
        type: AverageValue
        averageValue: "30"
```

**适用场景：**
- 基于队列的工作负载（SQS、RabbitMQ、Kafka）
- 事件驱动架构
- 基于业务指标的扩缩

### 4.5 VPA 限制与注意事项

:::danger VPA 使用注意事项

**1. 需要重启 Pod（Auto/Recreate 模式）**
- VPA **无法就地 (in-place) 变更**运行中 Pod 的资源
- 通过 Evict Pod 并重新创建（可能导致停机）
- 解决方案：必须配置 PodDisruptionBudget

**2. JVM 堆大小不匹配**
```yaml
# 问题场景
containers:
- name: java-app
  env:
  - name: JAVA_OPTS
    value: "-Xmx2g"    # 固定值
  resources:
    requests:
      memory: "3Gi"    # VPA 之后可能变更为 4Gi
    limits:
      memory: "3Gi"    # VPA 之后可能变更为 4Gi

# VPA 将 memory 变更为 4Gi，但 JVM 仍使用 2Gi 堆
# → 资源浪费
```

**解决方案：**
```yaml
containers:
- name: java-app
  env:
  - name: MEM_LIMIT
    valueFrom:
      resourceFieldRef:
        resource: limits.memory
  - name: JAVA_OPTS
    value: "-XX:MaxRAMPercentage=75.0"  # 动态计算
  resources:
    requests:
      memory: "2Gi"
    limits:
      memory: "2Gi"
```

**3. StatefulSet 注意事项**
- StatefulSet Pod 按顺序重启
- 存在数据丢失风险
- 推荐：**仅使用 Initial 模式**

**4. Metrics Server 依赖**
- VPA 必须依赖 Metrics Server
- Metrics Server 故障时推荐值更新停止

**5. 推荐值计算时间**
- 至少需要 24 小时数据
- 流量模式变化的反映需要时间
:::

## HPA 高级模式

### 5.1 HPA Behavior 设置

HPA v2 可以精细控制扩缩行为：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: advanced-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 5
  maxReplicas: 100

  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0    # 立即扩容
      policies:
      - type: Percent
        value: 100                     # 允许 100% 增加（2 倍）
        periodSeconds: 15              # 每 15 秒评估
      - type: Pods
        value: 10                      # 或增加 10 个 Pod
        periodSeconds: 15
      selectPolicy: Max                # 选择较大值

    scaleDown:
      stabilizationWindowSeconds: 300  # 5 分钟稳定期（防止急剧缩减）
      policies:
      - type: Percent
        value: 10                      # 10% 缩减
        periodSeconds: 60              # 每分钟评估
      - type: Pods
        value: 5                       # 或减少 5 个 Pod
        periodSeconds: 60
      selectPolicy: Min                # 选择较小值（保守）
```

**参数说明：**

| 参数 | 说明 | 推荐值 |
|---------|------|--------|
| `stabilizationWindowSeconds` | 指标稳定等待时间 | ScaleUp: 0-30s，ScaleDown: 300-600s |
| `type: Percent` | 按当前副本百分比增减 | ScaleUp: 100%，ScaleDown: 10-25% |
| `type: Pods` | 按绝对 Pod 数增减 | 根据工作负载规模调整 |
| `periodSeconds` | 策略评估周期 | 15-60 秒 |
| `selectPolicy` | Max（激进）、Min（保守）、Disabled | ScaleUp: Max，ScaleDown: Min |

:::info 参考 karpenter-autoscaling.md
HPA 与 Karpenter 配合使用的完整架构，请参考 [Karpenter 自动扩缩指南](/docs/infrastructure-optimization/karpenter-autoscaling)。
:::

### 5.2 自定义指标 HPA

#### Prometheus Adapter 使用

```bash
# 安装 Prometheus Adapter
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-server.monitoring.svc \
  --set prometheus.port=80
```

**自定义指标配置：**

```yaml
# values.yaml for prometheus-adapter
rules:
  default: false
  custom:
  - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace: {resource: "namespace"}
        pod: {resource: "pod"}
    name:
      matches: "^(.*)_total$"
      as: "${1}_per_second"
    metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
```

**HPA 配置：**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: custom-metric-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"    # 每 Pod 1000 req/s
```

#### KEDA ScaledObject

```bash
# 安装 KEDA
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace
```

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: prometheus-scaledobject
spec:
  scaleTargetRef:
    name: api-server
  minReplicaCount: 2
  maxReplicaCount: 100
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-server.monitoring.svc:80
      metricName: http_requests_per_second
      threshold: "1000"
      query: sum(rate(http_requests_total{app="api-server"}[2m]))
```

### 5.3 多指标 HPA

组合多个指标进行扩缩：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: multi-metric-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 5
  maxReplicas: 100

  metrics:
  # 1. CPU 指标
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # 2. Memory 指标
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  # 3. 自定义指标 - RPS
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

  # 4. 外部指标 - ALB Target Response Time
  - type: External
    external:
      metric:
        name: alb_target_response_time
        selector:
          matchLabels:
            targetgroup: "web-app-tg"
      target:
        type: Value
        value: "100"    # 100ms

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 50
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

**多指标评估：**
- HPA **独立评估每个指标**
- 选择**最高的副本数**（保守策略）
- 例如：CPU 需要 10 个，Memory 需要 15 个，RPS 需要 20 个 → **选择 20 个**

## Node Readiness Controller 与资源优化

### 5.3 未就绪节点上的资源浪费

在 Kubernetes 集群中，当新节点被配置时，CNI 插件、CSI 驱动、GPU 驱动等基础设施组件未就绪前 Pod 就被调度的问题可能发生。这会导致以下资源浪费：

**资源浪费场景：**

1. **CrashLoopBackOff 循环**
   - Pod 被调度到未就绪节点 → 失败 → 反复重启
   - 不必要的 CPU/内存使用和容器镜像重新下载

2. **不必要的节点配置**
   - Pod 处于 Pending 状态 → Karpenter/Cluster Autoscaler 创建额外节点
   - 实际上现有节点就绪后即可承载

3. **重调度开销**
   - 将失败的 Pod 移动到其他节点 → 网络/存储资源浪费
   - 应用初始化成本重复发生

### 5.4 Node Readiness Controller (NRC) 概述

Node Readiness Controller 是 Kubernetes 1.32 引入的功能，在基础设施就绪之前阻止 Pod 调度，从而提高资源效率。

**核心功能：**

| 功能 | 说明 | 资源优化效果 |
|------|------|-------------------|
| **Readiness Gate** | 特定条件满足前将节点保持在 NotReady 状态 | 阻止 Pod 调度防止 CrashLoop |
| **Custom Taint** | 自动为未就绪节点添加 taint | 防止资源浪费（NoSchedule 效果）|
| **Enforcement Mode** | 选择 `bootstrap-only` 或 `continuous` 模式 | 仅初始引导或持续验证 |

**API 结构：**

```yaml
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
```

### 5.5 Karpenter 联动优化

将 Karpenter 与 Node Readiness Controller 配合使用可显著提高节点配置效率。

**优化模式：**

```mermaid
graph TB
    A[Karpenter: 配置新节点] --> B[NRC: 自动添加 Taint]
    B --> C{CNI/CSI 就绪？}
    C -->|否| D[Pod 保持 Pending]
    D --> E[Karpenter: 不创建额外节点]
    C -->|是| F[NRC: 移除 Taint]
    F --> G[开始调度 Pod]
    G --> H[资源高效分配]

    style B fill:#a8dadc
    style E fill:#457b9d
    style H fill:#1d3557
```

**Karpenter NodePool 与 NRC 联动：**

```yaml
# 1. CSI Driver 就绪确认（EBS）
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: ebs-csi-readiness
spec:
  conditions:
    - type: "ebs.csi.aws.com/driver-ready"
      requiredStatus: "True"
  taint:
    key: "readiness.k8s.io/storage-unavailable"
    effect: "NoSchedule"
    value: "pending"
  enforcementMode: "bootstrap-only"  # 仅初始引导验证

---
# 2. VPC CNI 就绪确认
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: vpc-cni-readiness
spec:
  conditions:
    - type: "vpc.amazonaws.com/cni-ready"
      requiredStatus: "True"
  taint:
    key: "readiness.k8s.io/network-unavailable"
    effect: "NoSchedule"
    value: "pending"
  enforcementMode: "bootstrap-only"

---
# 3. GPU Driver 就绪确认（GPU 节点专用）
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: gpu-driver-readiness
spec:
  conditions:
    - type: "nvidia.com/gpu-driver-ready"
      requiredStatus: "True"
    - type: "nvidia.com/cuda-ready"
      requiredStatus: "True"
  taint:
    key: "readiness.k8s.io/gpu-unavailable"
    effect: "NoSchedule"
    value: "pending"
  enforcementMode: "bootstrap-only"
  # GPU 驱动加载耗时较长（30-60 秒）
  # NRC 在此期间阻止 Pod 调度
```

### 5.6 资源效率改善效果

Node Readiness Controller 实施前后对比：

| 指标 | 实施前 | 实施后 | 改善率 |
|------|---------|---------|--------|
| **CrashLoopBackOff 发生率** | 15-20% | < 2% | 90% 降低 |
| **不必要的节点配置** | 平均 2-3 个/小时 | < 0.5 个/小时 | 75% 降低 |
| **Pod 启动失败率** | 8-12% | < 1% | 90% 降低 |
| **容器镜像重新下载** | 100-200GB/天 | 20-30GB/天 | 80% 降低 |

**成本影响（100 节点集群基准）：**

```
实施前：
- 不必要的节点配置：平均 3 个 × $0.384/小时 × 24 小时 × 30 天 = $829/月
- 镜像重新下载数据传输费：150GB/天 × 30 天 × $0.09/GB = $405/月
- 总浪费成本：$1,234/月

实施后：
- 不必要的节点配置：平均 0.5 个 × $0.384/小时 × 24 小时 × 30 天 = $138/月
- 镜像重新下载数据传输费：25GB/天 × 30 天 × $0.09/GB = $67.5/月
- 总成本：$205.5/月

节省金额：$1,234 - $205.5 = $1,028.5/月（83% 节省）
```

### 5.7 实战实施指南

#### Step 1：启用 Feature Gate

```bash
# 在 EKS 1.32+ 集群中确认 Feature Gate
kubectl get --raw /metrics | grep node_readiness_controller

# 在 Karpenter 配置中启用 Feature Gate
# values.yaml（Karpenter Helm Chart）
controller:
  featureGates:
    NodeReadinessController: true
```

#### Step 2：应用 NodeReadinessRule

```yaml
# production-nrc.yaml
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: production-readiness
spec:
  # 多个条件以 AND 方式验证
  conditions:
    - type: "ebs.csi.aws.com/driver-ready"
      requiredStatus: "True"
    - type: "vpc.amazonaws.com/cni-ready"
      requiredStatus: "True"

  taint:
    key: "readiness.k8s.io/not-ready"
    effect: "NoSchedule"
    value: "pending"

  # bootstrap-only：仅验证节点初始引导
  # continuous：持续验证（驱动重启时也生效）
  enforcementMode: "bootstrap-only"
```

```bash
kubectl apply -f production-nrc.yaml

# 确认应用
kubectl get nodereadinessrule
kubectl describe nodereadinessrule production-readiness
```

#### Step 3：监控节点状态

```bash
# 新节点配置后确认条件
kubectl get nodes -o json | jq '.items[] | {
  name: .metadata.name,
  conditions: [.status.conditions[] | select(.type |
    test("ebs.csi.aws.com|vpc.amazonaws.com")) |
    {type: .type, status: .status}]
}'

# 确认 Taint 状态
kubectl get nodes -o json | jq '.items[] | {
  name: .metadata.name,
  taints: .spec.taints
}'
```

#### Step 4：Karpenter NodePool 优化

```yaml
# Karpenter NodePool with NRC
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: optimized-pool
spec:
  template:
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]

      # NRC 自动管理 taint，此处无需配置
      # taints: []  # NRC 管理

      # 增加节点引导完成等待时间
      kubelet:
        maxPods: 110
        # 由于 NRC 导致节点 Ready 时间增加（30 秒 → 60 秒）
        # 设置避免 Karpenter 过早超时
        systemReserved:
          cpu: 100m
          memory: 512Mi

  disruption:
    consolidationPolicy: WhenUnderutilized
    # 由于 NRC 导致节点启动变慢，增加 consolidation 间隔
    consolidateAfter: 60s  # 默认 30s → 60s
```

:::warning GPU 节点特别注意事项
GPU 驱动加载需要 30-60 秒，因此 GPU NodePool 必须应用 NRC。否则 Pod 将在 GPU 不可用状态下被调度并持续失败。

```yaml
# GPU 专用 NRC
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: gpu-readiness
spec:
  nodeSelector:
    matchExpressions:
      - key: nvidia.com/gpu
        operator: Exists
  conditions:
    - type: "nvidia.com/gpu-driver-ready"
      requiredStatus: "True"
  taint:
    key: "nvidia.com/gpu-not-ready"
    effect: "NoSchedule"
  enforcementMode: "bootstrap-only"
```
:::

### 5.8 问题排查与监控

#### 常见问题

**1. 节点持续处于 NotReady 状态：**

```bash
# 查看节点条件详情
kubectl describe node <node-name> | grep -A 10 "Conditions:"

# 查看 NRC 事件
kubectl get events --all-namespaces --field-selector involvedObject.kind=Node,involvedObject.name=<node-name>

# 查看驱动 DaemonSet 状态
kubectl get pods -n kube-system | grep -E "aws-node|ebs-csi|nvidia"
```

**2. Taint 未被移除：**

```bash
# 确认 NRC 是否正在运行
kubectl logs -n kube-system -l app=karpenter -c controller | grep "NodeReadiness"

# 手动移除 taint（临时解决）
kubectl taint nodes <node-name> readiness.k8s.io/not-ready:NoSchedule-
```

#### Prometheus 指标

```yaml
# NRC 指标的 ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: node-readiness-controller
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: karpenter
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s

# 主要指标：
# - node_readiness_controller_reconcile_duration_seconds
# - node_readiness_controller_condition_evaluation_total
# - node_readiness_controller_taint_operations_total
```

:::tip 参考资料
- **官方博客**：[Introducing Node Readiness Controller](https://kubernetes.io/blog/2026/02/03/introducing-node-readiness-controller/)
- **KEP (Kubernetes Enhancement Proposal)**：KEP-4403
- **API 文档**：`readiness.node.x-k8s.io/v1alpha1`
:::

## Right-Sizing 方法论

### 6.1 当前资源使用量分析

#### kubectl top 使用

```bash
# 按节点查看资源使用量
kubectl top nodes

# 按命名空间查看 Pod 资源使用量
kubectl top pods -n production --sort-by=cpu
kubectl top pods -n production --sort-by=memory

# 查看特定 Pod 的容器级使用量
kubectl top pods <pod-name> --containers -n production
```

#### Metrics Server API 直接查询

```bash
# CPU 使用量
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/production/pods | jq '.items[] | {name: .metadata.name, cpu: .containers[0].usage.cpu}'

# Memory 使用量
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/production/pods | jq '.items[] | {name: .metadata.name, memory: .containers[0].usage.memory}'
```

#### Container Insights (AWS)

```bash
# CloudWatch Logs Insights 查询
fields @timestamp, PodName, ContainerName, pod_cpu_utilization, pod_memory_utilization
| filter Namespace = "production"
| stats avg(pod_cpu_utilization) as avg_cpu,
        max(pod_cpu_utilization) as max_cpu,
        avg(pod_memory_utilization) as avg_mem,
        max(pod_memory_utilization) as max_mem
  by PodName
| sort max_cpu desc
```

#### 6.1.5 基于 CloudWatch Observability Operator 的自动分析

AWS 于 2025 年 12 月通过 **CloudWatch Observability Operator** 添加了 EKS Control Plane 指标监控功能。这使得可以先行检测资源瓶颈并实现自动化分析。

**CloudWatch Observability Operator 安装：**

```bash
# 1. 添加 Helm 仓库
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# 2. 安装 Operator（Amazon CloudWatch Observability namespace）
helm install amazon-cloudwatch-observability eks/amazon-cloudwatch-observability \
  --namespace amazon-cloudwatch \
  --create-namespace \
  --set clusterName=<cluster-name> \
  --set region=<region>

# 3. 确认安装
kubectl get pods -n amazon-cloudwatch

# 预期输出：
# NAME                                                     READY   STATUS    RESTARTS   AGE
# amazon-cloudwatch-observability-controller-manager-xxx   2/2     Running   0          2m
# cloudwatch-agent-xxx                                     1/1     Running   0          2m
# dcgm-exporter-xxx                                        1/1     Running   0          2m
# fluent-bit-xxx                                           1/1     Running   0          2m
```

**Container Insights Enhanced 功能：**

CloudWatch Observability Operator 提供以下高级分析功能：

| 功能 | 说明 | 用途 |
|------|------|------|
| **异常检测** | 通过 CloudWatch Anomaly Detection 自动识别异常模式 | 提前检测 CPU/Memory 峰值 |
| **内存泄漏可视化** | 在时序图中高亮显示持续增长模式 | 早期发现内存泄漏 |
| **下钻分析** | Namespace → Deployment → Pod → Container 层级探索 | 资源瓶颈根因分析 |
| **Control Plane 指标** | API Server、etcd、Scheduler 性能指标 | 提前检测集群扩缩瓶颈 |
| **自动创建告警** | 基于推荐阈值自动配置 CloudWatch 告警 | 运维自动化 |

**通过 EKS Control Plane 指标先行检测资源瓶颈：**

通过 Control Plane 指标可以提前检测 Pod 调度延迟、API Server 过载等影响资源优化的集群级问题。

```bash
# CloudWatch Insights 查询 - Control Plane API Server 负载分析
fields @timestamp, apiserver_request_duration_seconds_sum, apiserver_request_total
| filter @logStream like /kube-apiserver/
| stats avg(apiserver_request_duration_seconds_sum) as avg_latency,
        max(apiserver_request_total) as max_requests
  by bin(5m)
| sort @timestamp desc
```

**主要 Control Plane 指标：**

| 指标 | 含义 | 阈值 | 应对措施 |
|--------|------|--------|------|
| `apiserver_request_duration_seconds` | API 请求延迟 | P95 > 1 秒 | 考虑 Provisioned Control Plane |
| `etcd_request_duration_seconds` | etcd 响应时间 | P95 > 100ms | 减少节点/Pod 数量 |
| `scheduler_schedule_attempts_total` | 调度尝试次数 | 失败率 > 5% | 资源不足，检查 Node Affinity |
| `workqueue_depth` | Control Plane 工作队列深度 | > 100 | 集群过载信号 |

**数据驱动优化的 3 种浪费模式（AWS 官方指南）：**

AWS 于 2025 年 11 月发布的 [Data-driven Amazon EKS cost optimization](https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/) 指南中，通过实际数据分析识别了以下 3 种主要浪费模式：

```mermaid
graph TB
    A[资源浪费模式分析] --> B[1. Greedy Workloads]
    A --> C[2. Pet Workloads]
    A --> D[3. Isolated Workloads]

    B --> B1[过度的资源请求]
    B1 --> B2[实际使用量的 3-5 倍 requests]
    B2 --> B3[导致节点碎片化]

    C --> C1[严格的 PodDisruptionBudget]
    C1 --> C2[阻止节点驱逐]
    C2 --> C3[阻碍集群缩减]

    D --> D1[固定在特定节点的工作负载]
    D1 --> D2[过度使用 Node Affinity/Selector]
    D2 --> D3[节点池碎片化]

    style B fill:#ff6b6b
    style C fill:#ffa94d
    style D fill:#ffd43b
```

**1. Greedy Workloads（贪婪工作负载）：**

过度请求资源的 Pod 导致节点利用率低下的模式。

```bash
# CloudWatch Insights 查询 - 识别 Over-requesting 容器
fields @timestamp, PodName, ContainerName, pod_cpu_request, pod_cpu_utilization_over_pod_limit
| filter Namespace = "production"
| stats avg(pod_cpu_request) as avg_requested,
        avg(pod_cpu_utilization_over_pod_limit) as avg_utilization
  by PodName
| filter avg_utilization < 30  # 使用不到请求量的 30%
| sort avg_requested desc
```

**识别标准：**
- CPU requests 使用不到 30%
- Memory requests 使用不到 50%
- 持续时间：7 天以上

**应对方法：**
```yaml
# Before（Greedy）
resources:
  requests:
    cpu: "2000m"       # 实际使用量：400m（20%）
    memory: "4Gi"      # 实际使用量：1Gi（25%）

# After（Right-Sized）
resources:
  requests:
    cpu: "500m"        # P95 400m + 20% = 480m → 500m
    memory: "1280Mi"   # P95 1Gi + 20% = 1.2Gi → 1280Mi
  limits:
    memory: "2Gi"
```

**2. Pet Workloads（宠物工作负载）：**

由于严格的 PodDisruptionBudget (PDB) 导致集群无法缩减的模式。

```bash
# 确认因 PDB 导致的节点驱逐失败
kubectl get events --all-namespaces \
  --field-selector reason=EvictionFailed \
  --sort-by='.lastTimestamp'

# 预期输出：
# NAMESPACE   LAST SEEN   TYPE      REASON           MESSAGE
# production  5m          Warning   EvictionFailed   Cannot evict pod as it would violate the pod's disruption budget
```

**识别标准：**
- 设置了 `minAvailable: 100%` 或 `maxUnavailable: 0`
- 存在长期（>30 分钟）Pending 状态节点
- Karpenter/Cluster Autoscaler 缩减失败日志

**应对方法：**
```yaml
# Before（Pet）
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: critical-app-pdb
spec:
  minAvailable: 100%  # 保护所有 Pod → 无法缩减

# After（Balanced）
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: critical-app-pdb
spec:
  minAvailable: 80%   # 留 20% 余量允许缩减
  selector:
    matchLabels:
      app: critical-app
```

**3. Isolated Workloads（孤立工作负载）：**

过度使用 Node Affinity、Taints/Tolerations 导致节点池碎片化的模式。

```bash
# 分析每个节点的 Pod 数和利用率
kubectl get nodes -o json | jq -r '
  .items[] |
  {
    name: .metadata.name,
    pods: (.status.allocatable.pods | tonumber),
    cpu_capacity: (.status.capacity.cpu | tonumber),
    cpu_allocatable: (.status.allocatable.cpu | tonumber)
  }
' | jq -s 'sort_by(.pods) | .[]'
```

**识别标准：**
- 每节点平均 Pod 数 < 10 个
- 节点数 > 所需容量的 150%
- NodeSelector/Affinity 使用率 > 50%

**应对方法：**
```yaml
# Before（Isolated）
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: workload-type
          operator: In
          values:
          - api-server-v2  # 过于具体 → 节点碎片化

# After（Flexible）
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:  # required → preferred
    - weight: 100
      preference:
        matchExpressions:
        - key: workload-class
          operator: In
          values:
          - compute-optimized  # 更广泛的类别
```

**数据驱动优化流程：**

```mermaid
graph LR
    A[1. 数据收集] --> B[2. 模式分析]
    B --> C[3. 浪费识别]
    C --> D[4. 优化应用]
    D --> E[5. 验证]
    E --> F{达成目标？}
    F -->|是| G[持续监控]
    F -->|否| B

    A1[CloudWatch Container Insights] --> A
    A2[Prometheus Metrics] --> A
    A3[Cost Explorer] --> A

    C1[Greedy Workloads] --> C
    C2[Pet Workloads] --> C
    C3[Isolated Workloads] --> C

    D1[Right-Sizing] --> D
    D2[PDB 放宽] --> D
    D3[Affinity 优化] --> D

    style A fill:#e3f2fd
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style G fill:#c8e6c9
```

**实际效果案例（AWS 官方指南）：**

| 组织 | 浪费模式 | 采取措施 | 节省效果 |
|------|----------|----------|----------|
| 金融科技初创公司 | Greedy Workloads 40% | 应用 VPA 推荐值 | 节点数减少 35% |
| 电商企业 | Pet Workloads 25% | PDB minAvailable 放宽至 80% | 缩减速度提升 3 倍 |
| SaaS 平台 | Isolated Workloads 30% | 移除 NodeSelector，使用 Spot | 成本节省 45% |

:::tip 自动化浪费模式检测
使用 CloudWatch Contributor Insights 可以创建自动检测上述 3 种模式的规则：

```bash
# 创建 Contributor Insights 规则（Greedy Workloads）
aws cloudwatch put-insight-rule \
  --rule-name "EKS-GreedyWorkloads" \
  --rule-definition file://greedy-workloads-rule.json
```

规则定义示例：
```json
{
  "Schema": {
    "Name": "CloudWatchLogRule",
    "Version": 1
  },
  "LogGroupNames": ["/aws/containerinsights/<cluster-name>/performance"],
  "LogFormat": "JSON",
  "Contribution": {
    "Keys": ["PodName"],
    "Filters": [
      {
        "Match": "$.Type",
        "In": ["Pod"]
      },
      {
        "Match": "$.pod_cpu_utilization_over_pod_limit",
        "LessThan": 30
      }
    ],
    "ValueOf": "pod_cpu_request"
  },
  "AggregateOn": "Sum"
}
```
:::

#### Prometheus 查询

```promql
# CPU 使用量（P95，7 天）
quantile_over_time(0.95,
  sum by (pod, namespace) (
    rate(container_cpu_usage_seconds_total{namespace="production"}[5m])
  )[7d:5m]
)

# Memory 使用量（P95，7 天）
quantile_over_time(0.95,
  sum by (pod, namespace) (
    container_memory_working_set_bytes{namespace="production"}
  )[7d:5m]
)

# CPU Requests 与实际使用量比较
sum by (pod) (rate(container_cpu_usage_seconds_total[5m]))
/
sum by (pod) (kube_pod_container_resource_requests{resource="cpu"})

# Memory Requests 与实际使用量比较
sum by (pod) (container_memory_working_set_bytes)
/
sum by (pod) (kube_pod_container_resource_requests{resource="memory"})
```

### 6.2 使用 Goldilocks 自动 Right-Sizing

Goldilocks 基于 VPA Recommender 提供仪表板。

#### 安装

```bash
# 通过 Helm 安装
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm repo update

helm install goldilocks fairwinds-stable/goldilocks \
  --namespace goldilocks \
  --create-namespace \
  --set dashboard.service.type=LoadBalancer
```

#### 启用命名空间

```bash
# 为命名空间添加标签
kubectl label namespace production goldilocks.fairwinds.com/enabled=true
kubectl label namespace staging goldilocks.fairwinds.com/enabled=true

# Goldilocks 将自动创建 VPA（Off 模式）
kubectl get vpa -n production
```

#### 访问仪表板

```bash
# 确认仪表板 URL
kubectl get svc -n goldilocks goldilocks-dashboard

# 端口转发
kubectl port-forward -n goldilocks svc/goldilocks-dashboard 8080:80

# 在浏览器中访问 http://localhost:8080
```

**仪表板功能：**
- 按命名空间显示资源推荐值
- 显示 VPA Lower Bound、Target、Upper Bound
- 当前配置与推荐值对比
- QoS 类别显示

### 6.3 Container Insights Enhanced 异常检测

AWS Container Insights Enhanced 提供比标准 Container Insights 更增强的可观测性功能，特别是通过**自动异常检测**和**下钻分析**功能可以提前发现资源问题。

#### 6.3.1 Container Insights Enhanced 概述

**相比标准 Container Insights 的增强功能：**

| 功能 | 标准 Container Insights | Enhanced |
|------|------------------------|----------|
| **指标收集** | Pod/Container 级别 | Pod/Container + 网络细粒度 |
| **异常检测** | 手动（用户设置阈值） | **自动（ML 基础 anomaly detection）** |
| **下钻** | 有限 | **完整层级结构（Cluster → Node → Pod → Container）** |
| **内存泄漏检测** | 需手动分析 | **自动识别视觉模式** |
| **CPU Throttling** | 仅提供指标 | **自动告警 + 原因分析** |
| **网络可观测性** | 基本 | **Pod-to-Pod 流量分析** |

**启用方法：**

```bash
# 部署 CloudWatch Observability Operator
kubectl apply -f https://raw.githubusercontent.com/aws-observability/aws-cloudwatch-observability-operator/main/deploy/operator.yaml

# 启用 Container Insights Enhanced
cat <<EOF | kubectl apply -f -
apiVersion: cloudwatch.aws.amazon.com/v1alpha1
kind: CloudWatchObservability
metadata:
  name: cloudwatch-observability
spec:
  enableContainerInsights: true
  enableEnhancedContainerInsights: true  # 启用 Enhanced
  enableAutoInstrumentation: true
EOF

# 确认启用
kubectl get cloudwatchobservability cloudwatch-observability -o yaml
```

#### 6.3.2 内存泄漏视觉识别模式

Container Insights Enhanced 可自动检测内存使用量的**渐进增长模式**。

**内存泄漏检测场景：**

```mermaid
graph TB
    subgraph "Container Insights Enhanced 内存泄漏检测"
        A[收集内存指标] --> B[CloudWatch Anomaly Detection]
        B --> C{检测到异常模式？}

        C -->|正常| D[继续正常监控]
        C -->|内存渐进增长| E[疑似内存泄漏]

        E --> F[自动发送通知<br/>SNS/Slack/PagerDuty]
        F --> G[开始下钻分析]

        G --> H[确认 Pod 级指标]
        H --> I[Container 级详细分析]
        I --> J[识别原因 Container]

        J --> K[资源 Right-Sizing 或<br/>应用修复]
    end

    style E fill:#ff6b6b
    style J fill:#ffa94d
    style K fill:#51cf66
```

**在 CloudWatch Console 中确认内存泄漏：**

1. **CloudWatch → Container Insights → Performance monitoring**
2. **View: EKS Pods** 选择
3. **指标：Memory Utilization (%)** 选择
4. **启用 Anomaly Detection Band**

```
正常模式：
Memory (%) ▲
100% |                    ┌────┐
     |        ┌────┐  ┌──┘    └──┐
 50% |   ┌───┘    └──┘           └───┐
     |───┘                            └───
  0% +──────────────────────────────────►
     0h    6h   12h   18h   24h        Time

内存泄漏模式（🚨）：
Memory (%) ▲
100% |                          ┌────OOM Kill
     |                    ┌────┤
 50% |           ┌───────┤     │
     |      ┌────┤       │     │
  0% +──────┤────────────────────────────►
     0h    6h   12h   18h   24h        Time
     渐进上升（Anomaly Detection 自动检测）
```

**自动告警配置示例：**

```yaml
# CloudWatch Alarm with Anomaly Detection
apiVersion: v1
kind: ConfigMap
metadata:
  name: memory-leak-alarm
data:
  alarm.json: |
    {
      "AlarmName": "EKS-MemoryLeak-Detection",
      "ComparisonOperator": "LessThanLowerOrGreaterThanUpperThreshold",
      "EvaluationPeriods": 3,
      "Metrics": [
        {
          "Id": "m1",
          "ReturnData": true,
          "MetricStat": {
            "Metric": {
              "Namespace": "ContainerInsights",
              "MetricName": "pod_memory_utilization",
              "Dimensions": [
                {
                  "Name": "ClusterName",
                  "Value": "production-eks"
                }
              ]
            },
            "Period": 300,
            "Stat": "Average"
          }
        },
        {
          "Id": "ad1",
          "Expression": "ANOMALY_DETECTION_BAND(m1, 2)",
          "Label": "MemoryUsage (Expected)"
        }
      ],
      "ThresholdMetricId": "ad1",
      "ActionsEnabled": true,
      "AlarmActions": [
        "arn:aws:sns:us-east-1:123456789012:ops-alerts"
      ]
    }
```

**通过 AWS CLI 创建告警：**

```bash
# 基于 Anomaly Detection 的内存告警
aws cloudwatch put-metric-alarm \
  --alarm-name eks-memory-leak-detection \
  --alarm-description "Detects memory leak patterns in EKS pods" \
  --comparison-operator LessThanLowerOrGreaterThanUpperThreshold \
  --evaluation-periods 3 \
  --metrics '[
    {
      "Id": "m1",
      "ReturnData": true,
      "MetricStat": {
        "Metric": {
          "Namespace": "ContainerInsights",
          "MetricName": "pod_memory_utilization",
          "Dimensions": [
            {"Name": "ClusterName", "Value": "production-eks"}
          ]
        },
        "Period": 300,
        "Stat": "Average"
      }
    },
    {
      "Id": "ad1",
      "Expression": "ANOMALY_DETECTION_BAND(m1, 2)"
    }
  ]' \
  --threshold-metric-id ad1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:ops-alerts
```

#### 6.3.3 CPU Throttling 自动检测

Container Insights Enhanced 可自动检测 CPU throttling，并对**过高的 CPU limit 设置**发出告警。

**CPU Throttling 指标：**

```
throttled_time_percentage = (container_cpu_cfs_throttled_seconds_total / container_cpu_cfs_periods_total) * 100

正常：<5%
注意：5-10% ⚠️
严重：>10% 🚨（需要 HPA 或移除 CPU limits）
```

**通过 CloudWatch Insights 查询分析 Throttling：**

```sql
# CloudWatch Logs Insights Query
fields @timestamp, kubernetes.pod_name, cpu_limit_millicores, cpu_usage_millicores, throttled_time_ms
| filter kubernetes.namespace_name = "production"
| filter throttled_time_ms > 100  # throttling 超过 100ms
| stats
    avg(cpu_usage_millicores) as avg_cpu,
    max(cpu_usage_millicores) as max_cpu,
    avg(throttled_time_ms) as avg_throttled,
    count(*) as throttling_count
  by kubernetes.pod_name
| sort throttling_count desc
| limit 20

# 结果示例：
# pod_name            avg_cpu  max_cpu  avg_throttled  throttling_count
# web-app-abc123      450m     800m     250ms          150
# api-server-def456   600m     1000m    180ms          120
```

**Throttling 自动告警 CloudWatch Alarm：**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name eks-cpu-throttling-high \
  --alarm-description "Alerts when CPU throttling exceeds 10%" \
  --namespace ContainerInsights \
  --metric-name pod_cpu_throttled_percentage \
  --dimensions Name=ClusterName,Value=production-eks \
  --statistic Average \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:ops-alerts
```

#### 6.3.4 异常检测带 (Anomaly Detection Band) 设置

CloudWatch Anomaly Detection 使用 ML 模型自动学习正常范围。

**Anomaly Detection 工作原理：**

```
1. 学习期：至少收集 2 周数据
2. ML 模型训练：学习时段、星期模式
3. 预测范围生成：计算预期上限/下限
4. 实时比较：实际值超出范围时告警
```

**带宽调整（标准差）：**

```yaml
# 2 个标准差（默认，95% 置信区间）
Expression: ANOMALY_DETECTION_BAND(m1, 2)

# 3 个标准差（99.7% 置信区间，更保守）
Expression: ANOMALY_DETECTION_BAND(m1, 3)

# 1 个标准差（68% 置信区间，灵敏检测）
Expression: ANOMALY_DETECTION_BAND(m1, 1)
```

**可视化示例：**

```
资源使用量 ▲
              |     ┌──── Upper Band（预测上限）
              |    /
         100% | ──●────  实际使用量（无异常）
              |  / │
              | /  │
          50% |────●────  实际使用量（正常）
              | \  │
              |  \ │
           0% | ──●────  Lower Band（预测下限）
              +──────────────────────────►
              0h   6h   12h   18h   24h
```

#### 6.3.5 实战工作流：异常检测 → 调查 → Right-Sizing

**Step 1：CloudWatch Alarm 触发**

```
[CloudWatch Alarm] → [SNS Topic] → [Slack Webhook]

通知示例：
🚨 EKS Memory Anomaly Detected
Cluster: production-eks
Pod: web-app-7d8c9f-abc123
Memory Usage: 1.8Gi (Expected: 1.2Gi ± 200Mi)
Duration: 15 minutes
Action: Investigate memory leak
```

**Step 2：Container Insights 下钻分析**

```bash
# 1. 在 CloudWatch Console 中选择该 Pod
# 2. 点击 "View in Container Insights"
# 3. 层级下钻：
#    Cluster → Node → Pod → Container

# 或通过 AWS CLI 查询指标：
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name pod_memory_utilization \
  --dimensions \
    Name=ClusterName,Value=production-eks \
    Name=Namespace,Value=production \
    Name=PodName,Value=web-app-7d8c9f-abc123 \
  --start-time 2026-02-12T00:00:00Z \
  --end-time 2026-02-12T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

**Step 3：识别原因**

```bash
# 确认内存泄漏
kubectl top pod web-app-7d8c9f-abc123 -n production --containers

# 查看日志（OOM 警告）
kubectl logs web-app-7d8c9f-abc123 -n production | grep -i "memory\|heap\|oom"

# 应用性能分析（Java 示例）
kubectl exec web-app-7d8c9f-abc123 -n production -- jmap -heap 1
```

**Step 4：应用 Right-Sizing**

```yaml
# 使用 VPA Off 模式确认推荐值
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"

# 确认 VPA 推荐值后更新 Deployment
resources:
  requests:
    memory: "2Gi"    # VPA Target 1.8Gi + 20% 缓冲
  limits:
    memory: "3Gi"    # Upper Bound 2.5Gi + 余量
```

**Step 5：持续监控**

```bash
# 确认 CloudWatch Alarm 状态
aws cloudwatch describe-alarms \
  --alarm-names eks-memory-leak-detection \
  --query 'MetricAlarms[0].StateValue'

# 输出："OK"（正常）或 "ALARM"（异常）
```

:::tip Container Insights Enhanced vs Prometheus
Container Insights Enhanced 的优势在于 **AWS 原生集成**和**零配置异常检测**。Prometheus 可以实现更精细的自定义，但需要自行构建异常检测 ML 模型。两种工具并行使用可获得最佳可观测性。
:::

:::warning 异常检测的局限性
ML 基础异常检测学习**历史模式**，因此以下情况可能产生误报（False Positive）：
- 新部署之后（学习数据不足）
- 营销活动等计划性流量增长
- 季节性事件（黑色星期五、年终结算等）

这些情况下需要**暂时静音告警**或**将预期事件反映到 Anomaly Detection 模型中**。
:::

### 6.4 Right-Sizing 流程

5 阶段系统化 Right-Sizing 流程：

```mermaid
graph TB
    A[1 阶段：建立基线] --> B[2 阶段：部署 VPA Off 模式]
    B --> C[3 阶段：收集 7-14 天数据]
    C --> D[4 阶段：分析推荐值]
    D --> E[5 阶段：分阶段应用]

    E --> F{验证}
    F -->|性能问题| G[回滚]
    F -->|正常| H[下一个工作负载]

    G --> D
    H --> I[持续监控]

    style A fill:#e3f2fd
    style C fill:#fff3e0
    style E fill:#f3e5f5
    style H fill:#c8e6c9
```

#### 1 阶段：建立基线

```bash
# 备份当前资源配置
kubectl get deploy -n production -o yaml > deployments-backup.yaml

# 当前使用量快照
kubectl top pods -n production --containers > baseline-usage.txt
```

#### 2 阶段：部署 VPA Off 模式

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'    # 所有容器
      minAllowed:
        cpu: "50m"
        memory: "64Mi"
      maxAllowed:
        cpu: "8000m"
        memory: "32Gi"
```

#### 3 阶段：收集 7-14 天数据

```bash
# 监控 VPA 状态
watch kubectl describe vpa web-app-vpa -n production

# 至少等待 7 天，建议 14 天
# 如果流量模式呈周周期，14 天为必须
```

#### 4 阶段：分析推荐值

```bash
# 提取 VPA 推荐值
kubectl get vpa web-app-vpa -n production -o jsonpath='{.status.recommendation.containerRecommendations[0]}' | jq .

# 输出示例：
# {
#   "containerName": "web-app",
#   "lowerBound": {
#     "cpu": "150m",
#     "memory": "200Mi"
#   },
#   "target": {
#     "cpu": "250m",
#     "memory": "350Mi"
#   },
#   "uncappedTarget": {
#     "cpu": "300m",
#     "memory": "400Mi"
#   },
#   "upperBound": {
#     "cpu": "500m",
#     "memory": "700Mi"
#   }
# }
```

**推荐值解读：**

| 项目 | 含义 | 使用时机 |
|------|------|----------|
| **Lower Bound** | 最低所需资源 | 极端成本节省（风险高）|
| **Target** | **推荐设置值** | **默认使用** ⭐ |
| **Uncapped Target** | 无约束推荐值 | maxAllowed 调整参考 |
| **Upper Bound** | 最大观察使用量 | Limits 设置参考 |

:::tip Requests 计算公式
**推荐公式**：`Requests = VPA Target + 20% 缓冲`

原因：
- 基于 P95 的推荐值（应对 5% 流量峰值）
- 部署、初始化等临时使用量增加
- 最小化 Throttling、OOM 风险

**示例：**
```
VPA Target CPU: 250m
→ Requests: 250m * 1.2 = 300m

VPA Target Memory: 350Mi
→ Requests: 350Mi * 1.2 = 420Mi（四舍五入 512Mi）
```
:::

#### 5 阶段：分阶段应用

```yaml
# 原始配置
resources:
  requests:
    cpu: "1000m"       # 过度配置
    memory: "2Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"

# VPA Target: CPU 250m, Memory 350Mi

# Right-Sized 配置
resources:
  requests:
    cpu: "300m"        # Target 250m + 20% = 300m
    memory: "512Mi"    # Target 350Mi + 20% ≈ 420Mi → 512Mi
  limits:
    # 移除 CPU limits（可压缩资源）
    memory: "1Gi"      # Upper Bound 700Mi + 余量 = 1Gi
```

**应用策略：**

```bash
# 1. Canary 部署（10% 流量）
kubectl patch deploy web-app -n production -p '
{
  "spec": {
    "strategy": {
      "type": "RollingUpdate",
      "rollingUpdate": {
        "maxSurge": 1,
        "maxUnavailable": 0
      }
    }
  }
}'

# 2. 应用资源变更
kubectl set resources deploy web-app -n production \
  --limits=memory=1Gi \
  --requests=cpu=300m,memory=512Mi

# 3. 监控（1-3 天）
kubectl top pods -n production -l app=web-app
kubectl get events -n production --field-selector involvedObject.name=web-app

# 4. 无异常则全面应用
# 有异常则立即回滚
kubectl rollout undo deploy web-app -n production
```

### 6.5 AI 驱动的资源推荐自动化（高级）

利用 AI 和 LLM 可以自动化资源优化流程。本节介绍使用 Amazon Bedrock、Kiro、Amazon Q Developer 的最新模式。

#### 6.5.1 Amazon Bedrock + Prometheus → 自动 Right-Sizing PR 生成

将传统手动 Right-Sizing 流程通过 AI 实现端到端自动化的工作流。

**架构概述：**

```mermaid
graph TB
    subgraph "数据收集"
        A[EKS Cluster] -->|指标| B[Prometheus/AMP]
        A -->|VPA 推荐值| C[VPA Recommender]
    end

    subgraph "AI 分析"
        B --> D[Lambda Function]
        C --> D
        D -->|指标查询| E[Amazon Bedrock<br/>Claude/Titan]
        E -->|分析结果| F[Right-Sizing 推荐值]
    end

    subgraph "自动应用"
        F --> G[GitHub API]
        G -->|创建 Pull Request| H[GitHub Repository]
        H -->|自动审批/合并| I[ArgoCD/Flux]
        I -->|GitOps 部署| A
    end

    style E fill:#4dabf7
    style G fill:#51cf66
    style I fill:#ffa94d
```

**实现示例：**

```python
# Lambda Function：AI 驱动的 Right-Sizing 推荐
import boto3
import json
import requests
from datetime import datetime, timedelta

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
amp_query_url = "https://aps-workspaces.us-east-1.amazonaws.com/workspaces/ws-xxx/api/v1/query"

def lambda_handler(event, context):
    # 1. 收集 Prometheus 指标（7 天）
    metrics = collect_prometheus_metrics(
        namespace="production",
        deployment="web-app",
        period_days=7
    )

    # 2. 收集 VPA 推荐值
    vpa_recommendations = get_vpa_recommendations("web-app-vpa", "production")

    # 3. 通过 Amazon Bedrock 分析
    analysis_prompt = f"""
    请分析以下 Kubernetes Deployment 的资源优化：

    当前配置：
    {json.dumps(metrics['current_resources'], indent=2)}

    7 天实际使用量（P50/P95/P99）：
    CPU: {metrics['cpu_p50']}m / {metrics['cpu_p95']}m / {metrics['cpu_p99']}m
    Memory: {metrics['mem_p50']}Mi / {metrics['mem_p95']}Mi / {metrics['mem_p99']}Mi

    VPA 推荐值：
    {json.dumps(vpa_recommendations, indent=2)}

    请提供以下分析：
    1. 当前资源浪费或不足情况
    2. 推荐的 requests/limits 值（具体数值）
    3. 预计成本节省额
    4. 风险因素和注意事项
    5. 分阶段应用计划
    """

    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [{
                "role": "user",
                "content": analysis_prompt
            }]
        })
    )

    analysis = json.loads(response['body'].read())['content'][0]['text']

    # 4. 创建 GitHub Pull Request
    create_right_sizing_pr(
        deployment="web-app",
        namespace="production",
        analysis=analysis,
        recommended_resources=parse_recommendations(analysis)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Right-sizing PR created', 'analysis': analysis})
    }

def collect_prometheus_metrics(namespace, deployment, period_days):
    """从 Prometheus 收集资源使用量"""
    end_time = datetime.now()
    start_time = end_time - timedelta(days=period_days)

    queries = {
        'cpu_p50': f'quantile_over_time(0.50, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'cpu_p95': f'quantile_over_time(0.95, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'cpu_p99': f'quantile_over_time(0.99, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'mem_p50': f'quantile_over_time(0.50, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
        'mem_p95': f'quantile_over_time(0.95, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
        'mem_p99': f'quantile_over_time(0.99, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
    }

    results = {}
    for key, query in queries.items():
        response = requests.get(amp_query_url, params={'query': query})
        results[key] = int(float(response.json()['data']['result'][0]['value'][1]))

    return results

def create_right_sizing_pr(deployment, namespace, analysis, recommended_resources):
    """在 GitHub 创建 Right-Sizing PR"""
    github_token = get_secret('github-token')
    repo_owner = "my-org"
    repo_name = "k8s-manifests"

    # 修改 Deployment YAML
    updated_yaml = update_deployment_resources(
        deployment=deployment,
        namespace=namespace,
        resources=recommended_resources
    )

    # 创建 Pull Request
    pr_body = f"""
## 🤖 AI 驱动的资源 Right-Sizing 建议

### 分析结果
{analysis}

### 变更内容
- Deployment: `{namespace}/{deployment}`
- 更新资源 requests/limits

### 验证检查清单
- [ ] 在 Staging 环境完成测试
- [ ] 确认性能指标正常
- [ ] 验证成本节省额

### 自动生成信息
- Generator: Amazon Bedrock + VPA Analysis
- Timestamp: {datetime.now().isoformat()}
"""

    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    # 创建分支并提交
    create_branch_and_commit(repo_owner, repo_name, updated_yaml, headers)

    # 创建 PR
    pr_data = {
        'title': f'[AI] Right-Size {namespace}/{deployment}',
        'head': f'right-size-{deployment}-{datetime.now().strftime("%Y%m%d")}',
        'base': 'main',
        'body': pr_body
    }

    response = requests.post(
        f'https://api.github.com/repos/{repo_owner}/{repo_name}/pulls',
        headers=headers,
        json=pr_data
    )

    return response.json()
```

**通过 EventBridge 调度自动化：**

```yaml
# CloudFormation 模板示例
Resources:
  RightSizingSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: weekly-right-sizing-analysis
      Description: "Weekly AI-based right-sizing analysis"
      ScheduleExpression: "cron(0 9 ? * MON *)"  # 每周一上午 9 点
      State: ENABLED
      Targets:
        - Arn: !GetAtt RightSizingLambda.Arn
          Id: RightSizingTarget
          Input: |
            {
              "namespaces": ["production", "staging"],
              "auto_create_pr": true,
              "require_approval": true
            }
```

#### 6.5.2 利用 Kiro + EKS MCP 的资源优化

**Kiro** 是 AWS 的 AI 驱动云运维工具，可通过**自然语言查询**执行 EKS 资源优化。

**Kiro 安装与配置：**

```bash
# 安装 Kiro CLI
curl -sL https://kiro.aws.dev/install.sh | bash

# 连接 EKS MCP (Model Context Protocol)
kiro mcp connect eks --cluster production-eks --region us-east-1

# 确认连接
kiro mcp list
# 输出：
# ✓ eks-production (connected)
# ✓ cloudwatch-insights (connected)
# ✓ cost-explorer (connected)
```

**自然语言查询示例：**

```bash
# 1. 查找需要资源优化的 Pod
kiro ask "在 production 命名空间中找出 CPU 使用率低于 30% 的 Pod，并给出 Right-Sizing 推荐值"

# Kiro 响应示例：
# 📊 分析结果：12 个 Pod 处于过度配置状态。
#
# 前 5 名：
# 1. web-app-7d8c9f（当前：2 CPU / 实际 P95：0.4 CPU）→ 推荐：0.5 CPU
# 2. api-server-abc123（当前：4 CPU / 实际 P95：0.8 CPU）→ 推荐：1 CPU
# 3. worker-def456（当前：1 CPU / 实际 P95：0.2 CPU）→ 推荐：0.3 CPU
#
# 💰 预计节省：$450/月（45% 资源减少）
#
# 是否应用？(y/n)

# 2. 识别疑似内存泄漏的 Pod
kiro ask "找出过去 7 天内存使用量持续增长的 Pod"

# Kiro 响应：
# 🔍 检测到内存增长模式：
#
# ⚠️ cache-service-xyz789
# - 起始：500Mi → 当前：1.8Gi（增长 260%）
# - 趋势：每天增长 150Mi
# - 预计 OOM 时间：3 天后
# - 建议措施：调查内存泄漏 + 临时将 limits 上调至 2.5Gi
#
# 📋 是否生成详细分析报告？(y/n)

# 3. 整个集群效率分析
kiro ask "分析 production 集群的资源效率并给出优化优先级"

# Kiro 响应：
# 📈 集群效率报告
#
# 总体效率：52%（行业平均：65%）
#
# 优化优先级：
# 1. 🔴 高优先级（立即处理）
#    - 10 个 Deployment 有 70% CPU 未使用
#    - 预计节省：$1,200/月
#
# 2. 🟡 中优先级（1 周内）
#    - 5 个 StatefulSet 的 PVC 大小过大
#    - 预计节省：$300/月
#
# 3. 🟢 低优先级（规划阶段）
#    - 15 个 Deployment 未配置 HPA
#    - 建议分析流量模式后应用
#
# 是否创建自动 Right-Sizing PR？(y/n)
```

**Kiro 工作流自动化：**

```yaml
# kiro-workflow.yaml
apiVersion: kiro.aws.dev/v1alpha1
kind: Workflow
metadata:
  name: weekly-optimization
spec:
  schedule: "0 9 * * MON"  # 每周一上午 9 点
  steps:
    - name: analyze-underutilized
      action: analyze
      query: "分析所有 CPU 使用率低于 30% 或 Memory 使用率低于 40% 的 Pod"
      outputFormat: json

    - name: generate-recommendations
      action: recommend
      input: ${{ steps.analyze-underutilized.output }}
      includeVPA: true
      includePrometheus: true

    - name: create-pr
      action: github-pr
      repository: my-org/k8s-manifests
      branch: kiro-right-sizing-{{ date }}
      title: "[Kiro] Weekly Right-Sizing Recommendations"
      body: ${{ steps.generate-recommendations.output }}
      autoMerge: false  # 需要人工审核

    - name: notify
      action: slack
      webhook: ${{ secrets.SLACK_WEBHOOK }}
      message: |
        📊 每周 Right-Sizing 分析完成
        PR: ${{ steps.create-pr.pr_url }}
        预计节省：${{ steps.generate-recommendations.estimated_savings }}
```

#### 6.5.3 利用 Amazon Q Developer 的对话式优化

Amazon Q Developer 可在 IDE 和 CLI 中直接提供资源优化建议。

**在 VS Code 中使用：**

```yaml
# 打开 deployment.yaml 并向 Q Developer 提问
# /q optimize-resources

# Q Developer 响应：
# 分析了当前 Deployment 的资源配置：
#
# 🔍 发现的问题：
# 1. CPU requests 比实际使用量高 3 倍（1000m → 推荐 350m）
# 2. 未设置 Memory limits，存在 OOM 风险
# 3. QoS 类别：Burstable（推荐 Guaranteed）
#
# 💡 优化后的配置：
resources:
  requests:
    cpu: "350m"      # 实际 P95 + 20% 缓冲
    memory: "512Mi"  # 实际 P95 400Mi + 20%
  limits:
    memory: "1Gi"    # Upper Bound + 余量
    # 移除 CPU limits（Google/Datadog 模式）
#
# 是否应用此变更？(Apply / Dismiss)
```

**在 CLI 中使用：**

```bash
# 通过 Amazon Q CLI 查询
q ask "优化这个 Deployment 的资源" --file deployment.yaml

# 输出：
# 分析中... ✓
#
# 当前配置问题：
# - CPU over-provisioned by 65%
# - Memory under-provisioned (OOM risk)
#
# 推荐变更已保存到 deployment-optimized.yaml。
# 是否查看差异？(y/n)

# 输入 y 时：
diff deployment.yaml deployment-optimized.yaml
```

#### 6.5.4 注意事项与局限性

AI 驱动的资源推荐虽然强大，但需理解以下局限性：

| 局限性 | 说明 | 应对方法 |
|------|------|----------|
| **依赖历史数据** | 无法预测过去未出现的流量模式 | 并行使用 HPA，保持缓冲余量 |
| **缺乏上下文** | 未反映业务需求（SLA、合规） | 必须包含人工审核阶段 |
| **临时峰值** | 未考虑营销活动等计划性负载 | 活动期间手动扩容 |
| **成本优化偏差** | 可能优先考虑成本节省而非稳定性 | 排除 Critical 工作负载 |

:::warning AI 推荐应作为辅助工具使用
AI 驱动的资源推荐是**辅助工具而非最终决策工具**。生产环境应用前必须：

1. **在 Staging 环境验证**（至少 3 天）
2. **监控性能指标**（Latency P99、Error Rate）
3. **渐进式发布**（Canary 10% → 50% → 100%）
4. **制定回滚计划**（1 分钟内可恢复到上一版本）

特别是以下工作负载**不要应用 AI 推荐，应手动管理**：
- 金融交易系统
- 医疗信息系统
- 实时流媒体服务
- Stateful 数据库
:::

**AI 推荐验证检查清单：**

```yaml
# 生产环境应用前必须验证
ai_recommendation_validation:
  staging_test:
    duration_days: 3
    success_criteria:
      - p99_latency_increase: "<5%"
      - error_rate_increase: "<0.1%"
      - no_oom_kills: true
      - no_cpu_throttling: "<10%"

  canary_rollout:
    initial_percentage: 10
    increment_percentage: 20
    increment_interval_hours: 6
    auto_rollback_threshold:
      error_rate: 1.0  # 错误率超过 1% 时自动回滚
      latency_p99_ms: 500  # P99 延迟超过 500ms 时回滚

  monitoring:
    dashboard_url: "https://grafana.example.com/d/right-sizing"
    alert_channels: ["slack://ops-team", "pagerduty://oncall"]
    review_required: true  # 禁止自动合并，必须人工审核
```

:::tip AI + Human 混合方法
最佳效果来自 **AI 推荐 + 人类专家审核**的组合：

1. AI 从数千个 Pod 中筛选优化目标（速度）
2. 人类排除 Critical 工作负载并验证（可靠性）
3. AI 生成初始 PR（自动化）
4. 人类在 Staging 测试后审批（安全性）
5. GitOps 渐进式部署（运维效率）

此流程可实现**比手动节省 80% 时间**，**稳定性保持不变**。
:::

## Resource Quota 与 LimitRange

### 7.1 Namespace 级别资源限制

通过 ResourceQuota 限制命名空间的总资源：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    # 总资源限制
    requests.cpu: "100"           # 100 CPU 核
    requests.memory: "200Gi"      # 200GB RAM
    limits.cpu: "200"             # CPU limits 合计
    limits.memory: "400Gi"        # Memory limits 合计

    # 对象数量限制
    pods: "500"                   # 最多 500 个 Pod
    services: "50"                # 最多 50 个 Service
    persistentvolumeclaims: "100" # 最多 100 个 PVC

    # 存储限制
    requests.storage: "2Ti"       # 总共 2TB 存储

---
# 按环境配置 Quota 示例
apiVersion: v1
kind: ResourceQuota
metadata:
  name: development-quota
  namespace: development
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "100"

---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: staging-quota
  namespace: staging
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    limits.cpu: "100"
    limits.memory: "200Gi"
    pods: "200"
```

**查看 Quota 使用量：**

```bash
# 当前 Quota 使用量
kubectl describe resourcequota production-quota -n production

# 输出示例：
# Name:            production-quota
# Namespace:       production
# Resource         Used   Hard
# --------         ----   ----
# limits.cpu       150    200
# limits.memory    300Gi  400Gi
# pods             342    500
# requests.cpu     75     100
# requests.memory  150Gi  200Gi
```

### 7.2 通过 LimitRange 设置默认值

通过 LimitRange 自动为 Pod/Container 注入默认资源：

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limitrange
  namespace: production
spec:
  limits:
  # Container 级别约束
  - type: Container
    default:                    # 未设置 limits 时的默认值
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:             # 未设置 requests 时的默认值
      cpu: "100m"
      memory: "128Mi"
    max:                        # 最大允许值
      cpu: "4000m"
      memory: "8Gi"
    min:                        # 最小要求值
      cpu: "50m"
      memory: "64Mi"
    maxLimitRequestRatio:       # limits/requests 最大比率
      cpu: "4"                  # limits 最多为 requests 的 4 倍
      memory: "2"               # limits 最多为 requests 的 2 倍

  # Pod 级别约束
  - type: Pod
    max:
      cpu: "8000m"
      memory: "16Gi"
    min:
      cpu: "100m"
      memory: "128Mi"

  # PVC 约束
  - type: PersistentVolumeClaim
    max:
      storage: "100Gi"
    min:
      storage: "1Gi"

---
# 开发环境 LimitRange
apiVersion: v1
kind: LimitRange
metadata:
  name: development-limitrange
  namespace: development
spec:
  limits:
  - type: Container
    default:
      cpu: "200m"
      memory: "256Mi"
    defaultRequest:
      cpu: "50m"
      memory: "64Mi"
    max:
      cpu: "2000m"
      memory: "4Gi"
```

**工作示例：**

```yaml
# 开发者编写的 YAML（未指定资源）
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: production
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    # 没有 resources 部分

# LimitRange 自动注入后的结果
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: production
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    resources:
      requests:           # 应用 defaultRequest
        cpu: "100m"
        memory: "128Mi"
      limits:             # 应用 default
        cpu: "500m"
        memory: "512Mi"
```

**验证：**

```bash
# 查看 LimitRange
kubectl describe limitrange production-limitrange -n production

# 查看 Pod 应用的资源
kubectl get pod test-pod -n production -o jsonpath='{.spec.containers[0].resources}' | jq .
```

### 7.3 DRA (Dynamic Resource Allocation) - GPU/特殊资源管理

Kubernetes 1.31+ 引入的 **DRA (Dynamic Resource Allocation)** 是一种可以更灵活地分配 GPU、FPGA、NPU 等特殊资源的新机制。

#### 现有 Device Plugin vs DRA

| 特性 | Device Plugin（现有） | DRA (K8s 1.31+) |
|------|---------------------|-----------------|
| **资源表示** | 简单数字 (`nvidia.com/gpu: 1`) | 结构化参数（内存、计算模式）|
| **共享可能性** | 不可能（1 Pod = 1 GPU）| 可能（时间分片、MIG 支持）|
| **动态分配** | 调度时决定 | 运行时动态分配 |
| **复杂拓扑** | 有限 | NUMA、PCIe 拓扑感知 |
| **多租户** | 困难 | 原生支持 |

**DRA 核心概念：**

```mermaid
graph LR
    A[Pod with ResourceClaim] --> B[Scheduler]
    B --> C[ResourceClass 匹配]
    C --> D[DRA Driver]
    D --> E[分配物理 GPU]
    E --> F[Pod 运行]

    style A fill:#4dabf7
    style E fill:#51cf66
```

#### DRA 组成部分

**1. ResourceClass（集群级资源定义）**

```yaml
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClass
metadata:
  name: nvidia-a100-gpu
spec:
  driverName: gpu.nvidia.com
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClassParameters
    name: a100-80gb
---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClassParameters
metadata:
  name: a100-80gb
spec:
  # GPU 特性定义
  memory: "80Gi"
  computeCapability: "8.0"
  # MIG (Multi-Instance GPU) 支持
  migEnabled: true
  migProfile: "1g.10gb"  # 1/7 GPU 切片
```

**2. ResourceClaim（Pod 请求的资源）**

```yaml
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: ml-training-gpu
  namespace: ml-team
spec:
  resourceClassName: nvidia-a100-gpu
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClaimParameters
    name: training-config
---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClaimParameters
metadata:
  name: training-config
spec:
  # 请求的 GPU 规格
  count: 2  # 请求 2 个 GPU
  sharing: "TimeSlicing"  # 允许时间分片共享
  selector:
    matchLabels:
      gpu.nvidia.com/memory: "80Gi"
```

**3. 在 Pod 中使用 ResourceClaim**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pytorch-training
  namespace: ml-team
spec:
  containers:
  - name: trainer
    image: pytorch/pytorch:2.1.0-cuda12.1
    command: ["python", "train.py"]
    resources:
      requests:
        cpu: "8"
        memory: "32Gi"
      limits:
        memory: "64Gi"

  # 通过 DRA 分配 GPU
  resourceClaims:
  - name: gpu
    source:
      resourceClaimName: ml-training-gpu

  # 在容器中引用 claim
  containers:
  - name: trainer
    # ...
    resources:
      claims:
      - name: gpu
```

#### 在 EKS 中启用 DRA 及 GPU 分配示例

**Step 1：在 EKS 集群中启用 DRA Feature Gate**

```bash
# 创建 EKS 1.31+ 集群时
eksctl create cluster \
  --name dra-enabled-cluster \
  --version 1.31 \
  --region us-west-2 \
  --nodegroup-name gpu-nodes \
  --node-type p4d.24xlarge \
  --nodes 2 \
  --kubernetes-feature-gates DynamicResourceAllocation=true
```

**Step 2：安装 NVIDIA GPU Operator（含 DRA 驱动）**

```bash
# 通过 Helm 安装 GPU Operator（DRA 支持版本）
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace \
  --set driver.enabled=true \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=false \  # 禁用现有 device plugin
  --set dra.enabled=true \             # 启用 DRA
  --set migManager.enabled=true        # MIG 支持
```

**Step 3：通过 ResourceClaimTemplate 自动创建 Claim**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference
  namespace: ml-team
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: model-server
        image: tritonserver:24.01
        resources:
          requests:
            cpu: "4"
            memory: "16Gi"
          claims:
          - name: gpu

      # 通过 ResourceClaimTemplate 为每个 Pod 自动创建
      resourceClaims:
      - name: gpu
        source:
          resourceClaimTemplateName: shared-gpu-template

---
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaimTemplate
metadata:
  name: shared-gpu-template
  namespace: ml-team
spec:
  spec:
    resourceClassName: nvidia-a100-gpu
    parametersRef:
      apiGroup: gpu.nvidia.com
      kind: GpuClaimParameters
      name: shared-inference-config

---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClaimParameters
metadata:
  name: shared-inference-config
spec:
  count: 1
  sharing: "TimeSlicing"  # 多个 Pod 时间分片共享
  requests:
    memory: "10Gi"        # 仅请求 10GB GPU 内存
```

**DRA 优势总结：**

1. **GPU 共享**：通过 MIG 或 Time-Slicing 让多个 Pod 使用 1 个 GPU
2. **精细控制**：可指定 GPU 内存、计算模式、拓扑
3. **动态分配**：Pod 创建后也可添加/移除资源
4. **成本节省**：提高 GPU 利用率（现有 30-40% → DRA 70-80%）

:::warning EKS DRA 支持状态（2026 年 2 月基准）
- Kubernetes 1.31+ 以 alpha 功能提供
- EKS 中需手动启用 Feature Gate
- 生产使用时确认 NVIDIA GPU Operator 最新版本（v24.9.0+）
- MIG 支持仅在 A100/H100 GPU 上可用
:::

### 7.3.1 Setu：Kueue-Karpenter 集成消除 GPU 空闲成本

在 AI/ML 工作负载中 GPU 是最昂贵的资源，但现有反应式配置方式会导致严重浪费。**Setu** 将 Kueue 的配额管理与 Karpenter 的节点配置连接起来，实现主动式资源分配。

#### 反应式配置的资源浪费问题

**问题场景：**
1. 4-GPU 训练 Job 进入 Queue
2. Karpenter 逐个配置节点（耗时 5-10 分钟）
3. 仅 2 个节点就绪时 Pod 尝试调度 → 失败
4. **2 个 GPU 处于空闲等待状态产生成本**
5. 其余节点就绪后工作负载才开始

**成本影响：**
- p4d.24xlarge (8x A100) = $32.77/小时
- 10 分钟空闲等待 × 2 节点 = **$10.92 浪费**
- 每日 100 次执行时每月 $32,760 不必要成本

#### Setu 的 All-or-Nothing 配置

```mermaid
graph LR
    A[Job 提交] --> B[Kueue: 配额验证]
    B --> C[Setu: NodePool 容量预检]
    C -->|充足| D[所有节点同时配置]
    C -->|不足| E[立即失败 - 等待时间 0]
    D --> F[确认所有节点 Ready]
    F --> G[Job 执行 - 无空闲]

    style C fill:#4dabf7
    style G fill:#51cf66
    style E fill:#ff6b6b
```

**Setu 工作方式：**

1. **预检容量**：确认 Karpenter NodePool 中是否有足够的节点容量
2. **同时配置**：同时请求所有节点（无顺序等待）
3. **Gang Scheduling 保证**：所有节点 Ready 后才启动工作负载
4. **失败时立即终止**：容量不足时立即失败，消除无意义等待

#### Kueue ClusterQueue 集成

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: gpu-cluster-queue
spec:
  namespaceSelector: {}
  resourceGroups:
  - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
    flavors:
    - name: a100-spot
      resources:
      - name: "nvidia.com/gpu"
        nominalQuota: 32  # 4 个节点 × 8 GPU
      - name: "cpu"
        nominalQuota: 384
      - name: "memory"
        nominalQuota: 1536Gi
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: ml-team-queue
  namespace: ml-training
spec:
  clusterQueue: gpu-cluster-queue
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: a100-spot-pool
spec:
  template:
    spec:
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["p4d.24xlarge"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot", "on-demand"]
      nodeClassRef:
        name: a100-nodeclass
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
  # Setu 预检此 NodePool 的容量
  limits:
    cpu: "384"
    memory: "1536Gi"
```

**Setu Controller 操作：**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: llm-training
  namespace: ml-training
  labels:
    kueue.x-k8s.io/queue-name: ml-team-queue
    setu.io/enabled: "true"  # 启用 Setu
spec:
  parallelism: 4  # 需要 4 个节点
  completions: 4
  template:
    spec:
      schedulerName: default-scheduler
      containers:
      - name: trainer
        image: pytorch/pytorch:2.1-cuda12.1
        resources:
          requests:
            nvidia.com/gpu: 8  # 每节点 8 GPU
            memory: 384Gi
          limits:
            nvidia.com/gpu: 8
```

**Setu 操作流程：**

1. Job 进入 Kueue Queue
2. Kueue 确认配额（32 GPU 中可用数确认）
3. **Setu 介入**：验证 Karpenter NodePool `a100-spot-pool` 中是否可配置 4 个 p4d.24xlarge 节点
4. **可行时**：同时请求配置 4 个节点 + Job 等待
5. **不可行时**：Job 立即失败（路由到其他 Queue 或重试）
6. 所有节点 Ready 后调度 Job → **空闲 GPU 为 0**

#### 资源效率对比

| 场景 | 现有方式 | Setu 方式 | 节省效果 |
|------|----------|-----------|----------|
| **4-GPU Job 启动时间** | 逐个配置节点（15 分钟） | 同时配置（7 分钟） | **缩短 53%** |
| **空闲 GPU 成本** | 2 个节点 × 10 分钟等待 = $10.92 | 0（同时启动） | **节省 100%** |
| **容量不足时等待** | 等待 10 分钟后失败 | 立即失败（0 秒） | **消除等待时间** |
| **Spot 中断时重启** | 部分节点重建 → 产生空闲 | Gang 保证重配置 | **最小化中断成本** |

**月度成本节省（100 Job 执行基准）：**
- 空闲成本节省：**$32,760/月**
- Cold start 消除：**$16,380/月**（启动时间缩短 53%）
- **总节省：$49,140/月**

#### 多租户环境中的公平性 + 效率

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: shared-gpu-queue
spec:
  preemption:
    withinClusterQueue: LowerPriority
    reclaimWithinCohort: Any
  resourceGroups:
  - coveredResources: ["nvidia.com/gpu"]
    flavors:
    - name: a100-80gb
      resources:
      - name: "nvidia.com/gpu"
        nominalQuota: 64
        borrowingLimit: 32  # 其他团队空闲时可额外使用 32 GPU
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: research-team
  namespace: research
spec:
  clusterQueue: shared-gpu-queue
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: production-team
  namespace: production
spec:
  clusterQueue: shared-gpu-queue
```

**Setu + Kueue 集成优势：**

1. **公平配额管理**：Kueue 管理团队级 GPU 配额
2. **高效配置**：Setu 基于 NodePool 容量进行预检
3. **Borrowing 优化**：其他团队使用空闲 GPU 时也保证 Gang Scheduling
4. **Spot 利用最大化**：防止部分分配，最小化 Spot 中断影响

:::tip Setu 推荐应用场景
- **大规模 GPU 工作负载**：需要 4+ GPU 时空闲成本严重
- **使用 Spot 实例**：通过 gang scheduling 提高 Spot 中断应对能力
- **多租户环境**：同时确保 Kueue 公平性 + Karpenter 效率
- **成本敏感**：GPU 空闲时间每月造成数千美元成本
:::

**参考资料：**
- [Setu GitHub Repository](https://github.com/sanjeevrg89/Setu)
- [Kueue 官方文档](https://kueue.sigs.k8s.io/)
- [Karpenter NodePool 配置指南](https://karpenter.sh/)

### 7.4 通过 EKS Blueprints IaC 模式标准化资源策略

使用 Terraform EKS Blueprints 可以将 ResourceQuota、LimitRange、Policy Enforcement 代码化，在所有集群中一致应用。

#### Terraform EKS Blueprints AddOn 结构

```hcl
# main.tf - 通过 EKS Blueprints 自动部署资源策略
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "production-eks"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      instance_types = ["m6i.xlarge"]
    }
  }
}

# 通过 EKS Blueprints AddOns 部署资源策略
module "eks_blueprints_addons" {
  source  = "aws-ia/eks-blueprints-addons/aws"
  version = "~> 1.16"

  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = module.eks.cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  # Metrics Server（VPA 前置条件）
  enable_metrics_server = true

  # Karpenter（节点自动扩缩）
  enable_karpenter = true
  karpenter = {
    repository_username = data.aws_ecrpublic_authorization_token.token.user_name
    repository_password = data.aws_ecrpublic_authorization_token.token.password
  }

  # Kyverno（资源策略强制）
  enable_kyverno = true
  kyverno = {
    values = [templatefile("${path.module}/kyverno-policies.yaml", {
      default_cpu_request    = "100m"
      default_memory_request = "128Mi"
      max_cpu_limit          = "4000m"
      max_memory_limit       = "8Gi"
    })]
  }
}

# 通过 Helm Chart 部署 ResourceQuota
resource "helm_release" "resource_quotas" {
  name      = "resource-quotas"
  namespace = "kube-system"

  chart = "${path.module}/charts/resource-quotas"

  values = [
    yamlencode({
      quotas = {
        production = {
          cpu    = "100"
          memory = "200Gi"
          pods   = "500"
        }
        staging = {
          cpu    = "50"
          memory = "100Gi"
          pods   = "200"
        }
        development = {
          cpu    = "20"
          memory = "40Gi"
          pods   = "100"
        }
      }
    })
  ]
}
```

#### 通过 Kyverno 策略强制资源请求

```yaml
# kyverno-policies.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-requests
  annotations:
    policies.kyverno.io/title: Require Resource Requests
    policies.kyverno.io/severity: medium
    policies.kyverno.io/description: |
      所有 Pod 必须设置 CPU 和 Memory requests。
spec:
  validationFailureAction: Enforce  # Audit（仅警告）或 Enforce（阻止）
  background: true
  rules:
  - name: check-cpu-memory-requests
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "CPU 和 Memory requests 是必需的"
      pattern:
        spec:
          containers:
          - resources:
              requests:
                memory: "?*"
                cpu: "?*"

  - name: enforce-memory-limits
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "Memory limits 是必需的（防止 OOM Kill）"
      pattern:
        spec:
          containers:
          - resources:
              limits:
                memory: "?*"

  - name: prevent-excessive-resources
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "CPU 最大 {{ max_cpu_limit }}，Memory 最大 {{ max_memory_limit }}"
      deny:
        conditions:
          any:
          - key: "{{ request.object.spec.containers[].resources.requests.cpu }}"
            operator: GreaterThan
            value: "{{ max_cpu_limit }}"
          - key: "{{ request.object.spec.containers[].resources.requests.memory }}"
            operator: GreaterThan
            value: "{{ max_memory_limit }}"
```

#### OPA Gatekeeper 策略示例（替代方案）

```yaml
# ConstraintTemplate - 强制资源请求
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequireresources
spec:
  crd:
    spec:
      names:
        kind: K8sRequireResources
      validation:
        openAPIV3Schema:
          type: object
          properties:
            exemptNamespaces:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequireresources

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.cpu
          msg := sprintf("容器 %v 未设置 CPU requests", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.requests.memory
          msg := sprintf("容器 %v 未设置 Memory requests", [container.name])
        }

        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.resources.limits.memory
          msg := sprintf("容器 %v 未设置 Memory limits（OOM 风险）", [container.name])
        }

---
# Constraint - 应用 ConstraintTemplate
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequireResources
metadata:
  name: require-resources-production
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces: ["production", "staging"]
  parameters:
    exemptNamespaces: ["kube-system", "kube-node-lease"]
```

#### 基于 GitOps 的资源策略管理模式

**通过 ArgoCD ApplicationSet 按环境部署 ResourceQuota：**

```yaml
# argocd/applicationset-resource-policies.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: resource-policies
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - env: production
        cpu: "100"
        memory: "200Gi"
        pods: "500"
      - env: staging
        cpu: "50"
        memory: "100Gi"
        pods: "200"
      - env: development
        cpu: "20"
        memory: "40Gi"
        pods: "100"

  template:
    metadata:
      name: "resource-quota-{{env}}"
    spec:
      project: platform
      source:
        repoURL: https://github.com/myorg/k8s-manifests
        targetRevision: main
        path: resource-policies/{{env}}
        helm:
          parameters:
          - name: quota.cpu
            value: "{{cpu}}"
          - name: quota.memory
            value: "{{memory}}"
          - name: quota.pods
            value: "{{pods}}"
      destination:
        server: https://kubernetes.default.svc
        namespace: "{{env}}"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

**仓库结构：**

```
k8s-manifests/
├── resource-policies/
│   ├── production/
│   │   ├── resource-quota.yaml
│   │   ├── limit-range.yaml
│   │   └── kyverno-policies.yaml
│   ├── staging/
│   │   └── ...
│   └── development/
│       └── ...
└── argocd/
    └── applicationset-resource-policies.yaml
```

:::tip EKS Blueprints + GitOps 推荐模式
1. **通过 Terraform 配置集群**（VPC、EKS、AddOns）
2. **通过 Kyverno/OPA 强制策略**（资源请求必需、阻止过度分配）
3. **通过 ArgoCD ApplicationSet 按环境部署策略**（GitOps）
4. **通过 Prometheus + Grafana 监控策略合规率**

此组合实现 **"集群用 Terraform，策略用 Git"** 的管理方式，达到基础设施标准化和运维自动化。
:::
kubectl top pods -n production --containers > baseline-usage.txt
```

#### 第2步：部署 VPA Off 模式

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Off"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'    # 所有容器
      minAllowed:
        cpu: "50m"
        memory: "64Mi"
      maxAllowed:
        cpu: "8000m"
        memory: "32Gi"
```

#### 第3步：收集 7-14 天数据

```bash
# 监控 VPA 状态
watch kubectl describe vpa web-app-vpa -n production

# 至少等待 7 天，建议 14 天
# 如果流量模式具有周间周期，则必须等待 14 天
```

#### 第4步：分析建议

```bash
# 提取 VPA 建议
kubectl get vpa web-app-vpa -n production -o jsonpath='{.status.recommendation.containerRecommendations[0]}' | jq .

# 输出示例：
# {
#   "containerName": "web-app",
#   "lowerBound": {
#     "cpu": "150m",
#     "memory": "200Mi"
#   },
#   "target": {
#     "cpu": "250m",
#     "memory": "350Mi"
#   },
#   "uncappedTarget": {
#     "cpu": "300m",
#     "memory": "400Mi"
#   },
#   "upperBound": {
#     "cpu": "500m",
#     "memory": "700Mi"
#   }
# }
```

**建议解读：**

| 项目 | 含义 | 使用时机 |
|------|------|----------|
| **Lower Bound** | 最小所需资源 | 极端成本削减（有风险） |
| **Target** | **推荐设定值** | **默认使用** ⭐ |
| **Uncapped Target** | 无约束推荐值 | 调整 maxAllowed 参考 |
| **Upper Bound** | 观察到的最大使用量 | Limits 设置参考 |

:::tip Requests 计算公式
**推荐公式**：`Requests = VPA Target + 20% 缓冲`

原因：
- 基于 P95 的建议（应对 5% 流量尖峰）
- 应对部署、初始化等临时使用量增加
- 最小化 Throttling、OOM 风险

**示例：**
```
VPA Target CPU: 250m
→ Requests: 250m * 1.2 = 300m

VPA Target Memory: 350Mi
→ Requests: 350Mi * 1.2 = 420Mi（四舍五入为 512Mi）
```
:::

#### 第5步：分阶段应用

```yaml
# 现有设置
resources:
  requests:
    cpu: "1000m"       # 过度配置
    memory: "2Gi"
  limits:
    cpu: "2000m"
    memory: "2Gi"

# VPA Target: CPU 250m, Memory 350Mi

# Right-Sized 设置
resources:
  requests:
    cpu: "300m"        # Target 250m + 20% = 300m
    memory: "512Mi"    # Target 350Mi + 20% ≈ 420Mi → 512Mi
  limits:
    # 移除 CPU limits（可压缩资源）
    memory: "1Gi"      # Upper Bound 700Mi + 余量 = 1Gi
```

**应用策略：**

```bash
# 1. Canary 部署（10% 流量）
kubectl patch deploy web-app -n production -p '
{
  "spec": {
    "strategy": {
      "type": "RollingUpdate",
      "rollingUpdate": {
        "maxSurge": 1,
        "maxUnavailable": 0
      }
    }
  }
}'

# 2. 应用资源变更
kubectl set resources deploy web-app -n production \
  --limits=memory=1Gi \
  --requests=cpu=300m,memory=512Mi

# 3. 监控（1-3 天）
kubectl top pods -n production -l app=web-app
kubectl get events -n production --field-selector involvedObject.name=web-app

# 4. 无异常则全面应用
# 有异常则立即回滚
kubectl rollout undo deploy web-app -n production
```

### 6.5 基于 AI 的资源推荐自动化（高级）

利用 AI 和 LLM 可以自动化资源优化流程。本节介绍使用 Amazon Bedrock、Kiro、Amazon Q Developer 的最新模式。

#### 6.5.1 Amazon Bedrock + Prometheus → 自动 Right-Sizing PR 生成

将传统的手动 Right-Sizing 流程通过 AI 实现端到端自动化的工作流。

**架构概览：**

```mermaid
graph TB
    subgraph "数据收集"
        A[EKS Cluster] -->|指标| B[Prometheus/AMP]
        A -->|VPA 建议| C[VPA Recommender]
    end

    subgraph "AI 分析"
        B --> D[Lambda Function]
        C --> D
        D -->|指标查询| E[Amazon Bedrock<br/>Claude/Titan]
        E -->|分析结果| F[Right-Sizing 建议]
    end

    subgraph "自动应用"
        F --> G[GitHub API]
        G -->|创建 Pull Request| H[GitHub Repository]
        H -->|自动审批/合并| I[ArgoCD/Flux]
        I -->|GitOps 部署| A
    end

    style E fill:#4dabf7
    style G fill:#51cf66
    style I fill:#ffa94d
```

**实现示例：**

```python
# Lambda Function：基于 AI 的 Right-Sizing 推荐
import boto3
import json
import requests
from datetime import datetime, timedelta

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
amp_query_url = "https://aps-workspaces.us-east-1.amazonaws.com/workspaces/ws-xxx/api/v1/query"

def lambda_handler(event, context):
    # 1. 收集 Prometheus 指标（7 天）
    metrics = collect_prometheus_metrics(
        namespace="production",
        deployment="web-app",
        period_days=7
    )

    # 2. 收集 VPA 建议
    vpa_recommendations = get_vpa_recommendations("web-app-vpa", "production")

    # 3. 使用 Amazon Bedrock 进行分析
    analysis_prompt = f"""
    请分析以下 Kubernetes Deployment 的资源优化：

    当前设置：
    {json.dumps(metrics['current_resources'], indent=2)}

    7 天实际使用量（P50/P95/P99）：
    CPU: {metrics['cpu_p50']}m / {metrics['cpu_p95']}m / {metrics['cpu_p99']}m
    Memory: {metrics['mem_p50']}Mi / {metrics['mem_p95']}Mi / {metrics['mem_p99']}Mi

    VPA 建议：
    {json.dumps(vpa_recommendations, indent=2)}

    请提供包含以下内容的分析：
    1. 当前资源是否存在浪费或不足
    2. 推荐的 requests/limits 值（具体数值）
    3. 预计成本节省额
    4. 风险因素及注意事项
    5. 分阶段应用计划
    """

    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [{
                "role": "user",
                "content": analysis_prompt
            }]
        })
    )

    analysis = json.loads(response['body'].read())['content'][0]['text']

    # 4. 创建 GitHub Pull Request
    create_right_sizing_pr(
        deployment="web-app",
        namespace="production",
        analysis=analysis,
        recommended_resources=parse_recommendations(analysis)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Right-sizing PR created', 'analysis': analysis})
    }

def collect_prometheus_metrics(namespace, deployment, period_days):
    """从 Prometheus 收集资源使用量"""
    end_time = datetime.now()
    start_time = end_time - timedelta(days=period_days)

    queries = {
        'cpu_p50': f'quantile_over_time(0.50, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'cpu_p95': f'quantile_over_time(0.95, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'cpu_p99': f'quantile_over_time(0.99, container_cpu_usage_seconds_total{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) * 1000',
        'mem_p50': f'quantile_over_time(0.50, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
        'mem_p95': f'quantile_over_time(0.95, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
        'mem_p99': f'quantile_over_time(0.99, container_memory_working_set_bytes{{namespace="{namespace}",pod=~"{deployment}-.*"}}[{period_days}d]) / 1024 / 1024',
    }

    results = {}
    for key, query in queries.items():
        response = requests.get(amp_query_url, params={'query': query})
        results[key] = int(float(response.json()['data']['result'][0]['value'][1]))

    return results

def create_right_sizing_pr(deployment, namespace, analysis, recommended_resources):
    """在 GitHub 上创建 Right-Sizing PR"""
    github_token = get_secret('github-token')
    repo_owner = "my-org"
    repo_name = "k8s-manifests"

    # 修改 Deployment YAML
    updated_yaml = update_deployment_resources(
        deployment=deployment,
        namespace=namespace,
        resources=recommended_resources
    )

    # 创建 Pull Request
    pr_body = f"""
## 🤖 基于 AI 的资源 Right-Sizing 建议

### 分析结果
{analysis}

### 变更内容
- Deployment：`{namespace}/{deployment}`
- 更新资源 requests/limits

### 验证清单
- [ ] Staging 环境测试完成
- [ ] 性能指标正常确认
- [ ] 成本节省额验证

### 自动生成信息
- Generator：Amazon Bedrock + VPA Analysis
- Timestamp：{datetime.now().isoformat()}
"""

    headers = {
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    # 创建分支并提交
    create_branch_and_commit(repo_owner, repo_name, updated_yaml, headers)

    # 创建 PR
    pr_data = {
        'title': f'[AI] Right-Size {namespace}/{deployment}',
        'head': f'right-size-{deployment}-{datetime.now().strftime("%Y%m%d")}',
        'base': 'main',
        'body': pr_body
    }

    response = requests.post(
        f'https://api.github.com/repos/{repo_owner}/{repo_name}/pulls',
        headers=headers,
        json=pr_data
    )

    return response.json()
```

**通过 EventBridge 调度实现自动化：**

```yaml
# CloudFormation 模板示例
Resources:
  RightSizingSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: weekly-right-sizing-analysis
      Description: "Weekly AI-based right-sizing analysis"
      ScheduleExpression: "cron(0 9 ? * MON *)"  # 每周一上午 9 点
      State: ENABLED
      Targets:
        - Arn: !GetAtt RightSizingLambda.Arn
          Id: RightSizingTarget
          Input: |
            {
              "namespaces": ["production", "staging"],
              "auto_create_pr": true,
              "require_approval": true
            }
```

#### 6.5.2 利用 Kiro + EKS MCP 进行资源优化

**Kiro** 是 AWS 的基于 AI 的云运维工具，可以通过**自然语言查询**执行 EKS 资源优化。

**Kiro 安装和配置：**

```bash
# 安装 Kiro CLI
curl -sL https://kiro.aws.dev/install.sh | bash

# 连接 EKS MCP（Model Context Protocol）
kiro mcp connect eks --cluster production-eks --region us-east-1

# 确认连接
kiro mcp list
# 输出：
# ✓ eks-production (connected)
# ✓ cloudwatch-insights (connected)
# ✓ cost-explorer (connected)
```

**自然语言查询示例：**

```bash
# 1. 查找需要资源优化的 Pod
kiro ask "找出 production 命名空间中 CPU 使用率低于 30% 的 Pod，并给出 Right-Sizing 建议"

# Kiro 响应示例：
# 📊 分析结果：12 个 Pod 处于过度配置状态。
#
# 前 5 个：
# 1. web-app-7d8c9f（当前：2 CPU / 实际 P95：0.4 CPU）→ 建议：0.5 CPU
# 2. api-server-abc123（当前：4 CPU / 实际 P95：0.8 CPU）→ 建议：1 CPU
# 3. worker-def456（当前：1 CPU / 实际 P95：0.2 CPU）→ 建议：0.3 CPU
#
# 💰 预计节省：$450/月（45% 资源减少）
#
# 是否应用？(y/n)

# 2. 识别疑似内存泄漏的 Pod
kiro ask "找出过去 7 天内存使用量持续增长的 Pod"

# Kiro 响应：
# 🔍 检测到内存增长模式：
#
# ⚠️ cache-service-xyz789
# - 起始：500Mi → 当前：1.8Gi（增长 260%）
# - 趋势：每天增长 150Mi
# - 预计 OOM 时间：3 天
# - 建议措施：调查内存泄漏 + 临时将 limits 提高到 2.5Gi
#
# 📋 是否生成详细分析报告？(y/n)

# 3. 集群整体效率分析
kiro ask "分析 production 集群的资源效率并给出优化优先级"

# Kiro 响应：
# 📈 集群效率报告
#
# 整体效率：52%（行业平均：65%）
#
# 优化优先级：
# 1. 🔴 高优先级（立即处理）
#    - 10 个 Deployment 的 CPU 有 70% 未使用
#    - 预计节省：$1,200/月
#
# 2. 🟡 中优先级（1 周内）
#    - 5 个 StatefulSet 的 PVC 大小过大
#    - 预计节省：$300/月
#
# 3. 🟢 低优先级（规划阶段）
#    - 15 个 Deployment 未设置 HPA
#    - 建议分析流量模式后应用
#
# 是否创建自动 Right-Sizing PR？(y/n)
```

**Kiro 工作流自动化：**

```yaml
# kiro-workflow.yaml
apiVersion: kiro.aws.dev/v1alpha1
kind: Workflow
metadata:
  name: weekly-optimization
spec:
  schedule: "0 9 * * MON"  # 每周一上午 9 点
  steps:
    - name: analyze-underutilized
      action: analyze
      query: "分析所有 CPU 使用率低于 30% 或 Memory 使用率低于 40% 的 Pod"
      outputFormat: json

    - name: generate-recommendations
      action: recommend
      input: ${{ steps.analyze-underutilized.output }}
      includeVPA: true
      includePrometheus: true

    - name: create-pr
      action: github-pr
      repository: my-org/k8s-manifests
      branch: kiro-right-sizing-{{ date }}
      title: "[Kiro] Weekly Right-Sizing Recommendations"
      body: ${{ steps.generate-recommendations.output }}
      autoMerge: false  # 需要手动审查

    - name: notify
      action: slack
      webhook: ${{ secrets.SLACK_WEBHOOK }}
      message: |
        📊 每周 Right-Sizing 分析完成
        PR: ${{ steps.create-pr.pr_url }}
        预计节省: ${{ steps.generate-recommendations.estimated_savings }}
```

#### 6.5.3 利用 Amazon Q Developer 进行交互式优化

Amazon Q Developer 直接在 IDE 和 CLI 中提供资源优化建议。

**在 VS Code 中使用：**

```yaml
# 打开 deployment.yaml 并向 Q Developer 提问
# /q optimize-resources

# Q Developer 响应：
# 已分析当前 Deployment 的资源设置：
#
# 🔍 发现的问题：
# 1. CPU requests 比实际使用量高 3 倍（1000m → 建议 350m）
# 2. 没有 Memory limits，存在 OOM 风险
# 3. QoS 类别：Burstable（建议 Guaranteed）
#
# 💡 优化后的设置：
resources:
  requests:
    cpu: "350m"      # 实际 P95 + 20% 缓冲
    memory: "512Mi"  # 实际 P95 400Mi + 20%
  limits:
    memory: "1Gi"    # Upper Bound + 余量
    # 移除 CPU limits（Google/Datadog 模式）
#
# 是否应用此变更？(Apply / Dismiss)
```

**在 CLI 中使用：**

```bash
# 通过 Amazon Q CLI 查询
q ask "优化这个 Deployment 的资源" --file deployment.yaml

# 输出：
# 分析中... ✓
#
# 当前设置问题：
# - CPU over-provisioned by 65%
# - Memory under-provisioned (OOM risk)
#
# 推荐变更已保存到 deployment-optimized.yaml。
# 是否查看差异？(y/n)

# 输入 y 时：
diff deployment.yaml deployment-optimized.yaml
```

#### 6.5.4 注意事项和局限性

基于 AI 的资源推荐虽然强大，但需要了解以下局限性：

| 局限 | 说明 | 应对方法 |
|------|------|----------|
| **依赖历史数据** | 无法预测过去不存在的流量模式 | 配合 HPA，确保充足缓冲 |
| **缺乏上下文** | 未反映业务需求（SLA、法规） | 手动审查步骤必不可少 |
| **临时尖峰** | 未考虑营销活动等计划性负载 | 活动期间手动扩容 |
| **成本优化偏向** | 可能优先考虑成本削减而非稳定性 | 排除关键工作负载设置 |

:::warning AI 推荐作为辅助工具使用
基于 AI 的资源推荐是**辅助工具而非最终决策工具**。在应用到生产环境之前务必：

1. **在 Staging 环境中验证**（至少 3 天）
2. **监控性能指标**（Latency P99、Error Rate）
3. **渐进式发布**（Canary 10% → 50% → 100%）
4. **制定回滚计划**（1 分钟内恢复到之前版本）

特别是以下工作负载**不要应用 AI 推荐，应手动管理**：
- 金融交易系统
- 医疗信息系统
- 实时流媒体服务
- Stateful 数据库
:::

**AI 推荐验证清单：**

```yaml
# 生产环境应用前必须验证
ai_recommendation_validation:
  staging_test:
    duration_days: 3
    success_criteria:
      - p99_latency_increase: "<5%"
      - error_rate_increase: "<0.1%"
      - no_oom_kills: true
      - no_cpu_throttling: "<10%"

  canary_rollout:
    initial_percentage: 10
    increment_percentage: 20
    increment_interval_hours: 6
    auto_rollback_threshold:
      error_rate: 1.0  # 错误率超过 1% 时自动回滚
      latency_p99_ms: 500  # P99 延迟超过 500ms 时回滚

  monitoring:
    dashboard_url: "https://grafana.example.com/d/right-sizing"
    alert_channels: ["slack://ops-team", "pagerduty://oncall"]
    review_required: true  # 禁止自动合并，需手动审查
```

:::tip AI + 人类混合方法
最佳结果来自 **AI 推荐 + 人类专家审查**的组合：

1. AI 从数千个 Pod 中筛选优化目标（速度）
2. 人类排除关键工作负载并验证（可靠性）
3. AI 生成初始 PR（自动化）
4. 人类在 Staging 测试后批准（安全性）
5. GitOps 渐进式部署（运维效率）

通过此流程可实现**比手动节省 80% 时间**，同时**保持相同的稳定性**。
:::

## Resource Quota 与 LimitRange

### 7.1 Namespace 级别资源限制

通过 ResourceQuota 限制整个命名空间的资源：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    # 总资源限制
    requests.cpu: "100"           # 100 CPU cores
    requests.memory: "200Gi"      # 200GB RAM
    limits.cpu: "200"             # CPU limits 总计
    limits.memory: "400Gi"        # Memory limits 总计

    # 对象数量限制
    pods: "500"                   # 最多 500 个 Pod
    services: "50"                # 最多 50 个 Service
    persistentvolumeclaims: "100" # 最多 100 个 PVC

    # 存储限制
    requests.storage: "2Ti"       # 总计 2TB 存储

---
# 各环境配额示例
apiVersion: v1
kind: ResourceQuota
metadata:
  name: development-quota
  namespace: development
spec:
  hard:
    requests.cpu: "20"
    requests.memory: "40Gi"
    limits.cpu: "40"
    limits.memory: "80Gi"
    pods: "100"

---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: staging-quota
  namespace: staging
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    limits.cpu: "100"
    limits.memory: "200Gi"
    pods: "200"
```

**查看配额使用量：**

```bash
# 当前配额使用量
kubectl describe resourcequota production-quota -n production

# 输出示例：
# Name:            production-quota
# Namespace:       production
# Resource         Used   Hard
# --------         ----   ----
# limits.cpu       150    200
# limits.memory    300Gi  400Gi
# pods             342    500
# requests.cpu     75     100
# requests.memory  150Gi  200Gi
```

### 7.2 通过 LimitRange 设置默认值

通过 LimitRange 自动为 Pod/Container 注入默认资源：

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limitrange
  namespace: production
spec:
  limits:
  # Container 级别约束
  - type: Container
    default:                    # 未设置 limits 时的默认值
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:             # 未设置 requests 时的默认值
      cpu: "100m"
      memory: "128Mi"
    max:                        # 最大允许值
      cpu: "4000m"
      memory: "8Gi"
    min:                        # 最小要求值
      cpu: "50m"
      memory: "64Mi"
    maxLimitRequestRatio:       # limits/requests 最大比率
      cpu: "4"                  # limits 最多为 requests 的 4 倍
      memory: "2"               # limits 最多为 requests 的 2 倍

  # Pod 级别约束
  - type: Pod
    max:
      cpu: "8000m"
      memory: "16Gi"
    min:
      cpu: "100m"
      memory: "128Mi"

  # PVC 约束
  - type: PersistentVolumeClaim
    max:
      storage: "100Gi"
    min:
      storage: "1Gi"

---
# 开发环境 LimitRange
apiVersion: v1
kind: LimitRange
metadata:
  name: development-limitrange
  namespace: development
spec:
  limits:
  - type: Container
    default:
      cpu: "200m"
      memory: "256Mi"
    defaultRequest:
      cpu: "50m"
      memory: "64Mi"
    max:
      cpu: "2000m"
      memory: "4Gi"
```

**行为示例：**

```yaml
# 开发者编写的 YAML（未指定资源）
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: production
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    # 没有 resources 部分

# LimitRange 自动注入后的结果
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
  namespace: production
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    resources:
      requests:           # 应用 defaultRequest
        cpu: "100m"
        memory: "128Mi"
      limits:             # 应用 default
        cpu: "500m"
        memory: "512Mi"
```

**验证：**

```bash
# 查看 LimitRange
kubectl describe limitrange production-limitrange -n production

# 查看 Pod 上应用的资源
kubectl get pod test-pod -n production -o jsonpath='{.spec.containers[0].resources}' | jq .
```

### 7.3 DRA（Dynamic Resource Allocation）- GPU/特殊资源管理

Kubernetes 1.31+ 引入的 **DRA（Dynamic Resource Allocation）** 是一种新机制，可以更灵活地分配 GPU、FPGA、NPU 等特殊资源。

#### 现有 Device Plugin vs DRA

| 特性 | Device Plugin（现有） | DRA（K8s 1.31+） |
|------|---------------------|-----------------|
| **资源表示** | 简单数字（`nvidia.com/gpu: 1`） | 结构化参数（内存、计算模式） |
| **共享能力** | 不可能（1 Pod = 1 GPU） | 可能（时间分片、MIG 支持） |
| **动态分配** | 调度时决定 | 运行时动态分配 |
| **复杂拓扑** | 有限 | 考虑 NUMA、PCIe 拓扑 |
| **多租户** | 困难 | 原生支持 |

**DRA 的核心概念：**

```mermaid
graph LR
    A[Pod with ResourceClaim] --> B[Scheduler]
    B --> C[ResourceClass 匹配]
    C --> D[DRA Driver]
    D --> E[物理 GPU 分配]
    E --> F[Pod 运行]

    style A fill:#4dabf7
    style E fill:#51cf66
```

#### DRA 组成部分

**1. ResourceClass（集群级别资源定义）**

```yaml
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClass
metadata:
  name: nvidia-a100-gpu
spec:
  driverName: gpu.nvidia.com
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClassParameters
    name: a100-80gb
---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClassParameters
metadata:
  name: a100-80gb
spec:
  # GPU 特性定义
  memory: "80Gi"
  computeCapability: "8.0"
  # MIG（Multi-Instance GPU）支持
  migEnabled: true
  migProfile: "1g.10gb"  # 1/7 GPU 切片
```

**2. ResourceClaim（Pod 请求的资源）**

```yaml
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaim
metadata:
  name: ml-training-gpu
  namespace: ml-team
spec:
  resourceClassName: nvidia-a100-gpu
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClaimParameters
    name: training-config
---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClaimParameters
metadata:
  name: training-config
spec:
  # 请求的 GPU 规格
  count: 2  # 请求 2 个 GPU
  sharing: "TimeSlicing"  # 允许时间分片共享
  selector:
    matchLabels:
      gpu.nvidia.com/memory: "80Gi"
```

**3. 在 Pod 中使用 ResourceClaim**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pytorch-training
  namespace: ml-team
spec:
  containers:
  - name: trainer
    image: pytorch/pytorch:2.1.0-cuda12.1
    command: ["python", "train.py"]
    resources:
      requests:
        cpu: "8"
        memory: "32Gi"
      limits:
        memory: "64Gi"

  # 通过 DRA 分配 GPU
  resourceClaims:
  - name: gpu
    source:
      resourceClaimName: ml-training-gpu

  # 在容器中引用 claim
  containers:
  - name: trainer
    # ...
    resources:
      claims:
      - name: gpu
```

#### 在 EKS 中启用 DRA 和 GPU 分配示例

**Step 1：在 EKS 集群中启用 DRA Feature Gate**

```bash
# 创建 EKS 1.31+ 集群时
eksctl create cluster \
  --name dra-enabled-cluster \
  --version 1.31 \
  --region us-west-2 \
  --nodegroup-name gpu-nodes \
  --node-type p4d.24xlarge \
  --nodes 2 \
  --kubernetes-feature-gates DynamicResourceAllocation=true
```

**Step 2：安装 NVIDIA GPU Operator（包含 DRA 驱动）**

```bash
# 通过 Helm 安装 GPU Operator（DRA 支持版本）
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace \
  --set driver.enabled=true \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=false \  # 禁用现有 device plugin
  --set dra.enabled=true \             # 启用 DRA
  --set migManager.enabled=true        # MIG 支持
```

**Step 3：使用 ResourceClaimTemplate 自动创建 Claim**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference
  namespace: ml-team
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: model-server
        image: tritonserver:24.01
        resources:
          requests:
            cpu: "4"
            memory: "16Gi"
          claims:
          - name: gpu

      # 通过 ResourceClaimTemplate 为每个 Pod 自动创建
      resourceClaims:
      - name: gpu
        source:
          resourceClaimTemplateName: shared-gpu-template

---
apiVersion: resource.k8s.io/v1alpha3
kind: ResourceClaimTemplate
metadata:
  name: shared-gpu-template
  namespace: ml-team
spec:
  spec:
    resourceClassName: nvidia-a100-gpu
    parametersRef:
      apiGroup: gpu.nvidia.com
      kind: GpuClaimParameters
      name: shared-inference-config

---
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClaimParameters
metadata:
  name: shared-inference-config
spec:
  count: 1
  sharing: "TimeSlicing"  # 多个 Pod 通过时间分片共享
  requests:
    memory: "10Gi"        # 仅请求 10GB GPU 内存
```

**DRA 优势总结：**

1. **GPU 共享**：通过 MIG 或 Time-Slicing，多个 Pod 使用 1 个 GPU
2. **精细控制**：可指定 GPU 内存、计算模式、拓扑
3. **动态分配**：Pod 创建后也可添加/移除资源
4. **成本降低**：GPU 利用率提升（现有 30-40% → DRA 可达 70-80%）

:::warning EKS DRA 支持状态（2026 年 2 月基准）
- 在 Kubernetes 1.31+ 中作为 alpha 功能提供
- 在 EKS 中需要手动启用 Feature Gate
- 生产使用时请确认 NVIDIA GPU Operator 最新版本（v24.9.0+）
- MIG 支持仅在 A100/H100 GPU 上可用
:::
