---
title: "EKS GPU Cluster Dynamic Resource Management"
sidebar_label: "GPU Resource Management"
description: "GPU node scaling in Amazon EKS with Karpenter, KEDA autoscaling, DRA dynamic resource allocation (MNG required), and cost optimization strategies"
tags: [eks, gpu, karpenter, autoscaling, resource-management, dra, keda, managed-node-group]
category: "genai-aiml"
last_update:
  date: 2026-03-30
  author: devfloor9
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { SpecificationTable, ComparisonTable } from '@site/src/components/tables';
import { DraLimitationsTable, ScalingDecisionTable } from '@site/src/components/GpuResourceTables';
import {
  SpotInstancePricingInference,
  SavingsPlansPricingTraining,
  SmallScaleCostCalculation,
  MediumScaleCostCalculation,
  LargeScaleCostCalculation,
  CostOptimizationStrategies,
  CostOptimizationDetails,
  TrainingCostOptimization,
  KarpenterGpuOptimization
} from '@site/src/components/AgenticSolutionsTables';

# EKS GPU Cluster Dynamic Resource Management

> 📅 **Created**: 2025-02-09 | **Updated**: 2026-03-30 | ⏱️ **Reading Time**: Approximately 10 minutes


## Overview

In large-scale GenAI service environments, efficiently managing multiple GPU clusters and dynamically reallocating resources based on traffic changes is critical. This document covers GPU node autoscaling with Karpenter in Amazon EKS, workload autoscaling with KEDA, DRA (Dynamic Resource Allocation)-based GPU resource management, and cost optimization strategies.

### Key Objectives

- **Resource Efficiency**: Minimize GPU resource idle time
- **Cost Optimization**: Cost reduction through Spot instance utilization and Consolidation
- **Automated Scaling**: Automatic resource adjustment based on traffic patterns
- **Service Stability**: Ensure adequate resources to meet SLA requirements

---

## Multi-GPU Cluster Architecture

### Overall Architecture Diagram

```mermaid
flowchart TB
    subgraph Traffic["Traffic Layer"]
        ALB[Application<br/>Load Balancer]
        IGW[Ingress<br/>Gateway]
    end

    subgraph Control["EKS Control Plane"]
        API[K8s API<br/>Server]
        KARP[Karpenter]
        KEDA_OP[KEDA<br/>Operator]
    end

    subgraph PoolA["GPU Pool A: Model Serving"]
        NPA1[p4d.24xlarge<br/>Node 1]
        NPA2[p4d.24xlarge<br/>Node 2]
        NPA3[p5.48xlarge<br/>Node 3]
        MA1[vLLM<br/>Pod A-1]
        MA2[vLLM<br/>Pod A-2]
        MA3[vLLM<br/>Pod A-3]
    end

    subgraph PoolB["GPU Pool B: Model Serving"]
        NPB1[g5.48xlarge<br/>Node 1]
        NPB2[g5.48xlarge<br/>Node 2]
        MB1[vLLM<br/>Pod B-1]
        MB2[vLLM<br/>Pod B-2]
    end

    subgraph Monitor["Monitoring"]
        DCGM[DCGM<br/>Exporter]
        PROM[Prometheus]
        GRAF[Grafana]
    end

    ALB -->|Request| IGW
    IGW -->|Routing| MA1
    IGW -->|Routing| MB1

    API -->|Node Management| KARP
    API -->|Scaling| KEDA_OP

    KARP -.->|Provisioning| NPA1
    KARP -.->|Provisioning| NPB1

    DCGM -->|Metrics| PROM
    PROM -->|Trigger| KEDA_OP
    PROM -->|Visualization| GRAF

    style ALB fill:#ff9900
    style API fill:#326ce5
    style KARP fill:#326ce5
    style NPA1 fill:#76b900
    style NPB1 fill:#76b900
    style PROM fill:#9c27b0
```

### Resource Sharing Architecture

Architecture for efficient GPU resource sharing between multiple models.

```mermaid
flowchart LR
    subgraph Pool["Shared GPU Pool"]
        GPU1[GPU 1-4<br/>Model A<br/>Primary]
        GPU2[GPU 5-8<br/>Model B<br/>Primary]
        GPU3[GPU 9-12<br/>Elastic<br/>Pool]
    end

    subgraph Allocator["Resource Allocator"]
        RA[Dynamic<br/>Allocator]
        METRICS[GPU<br/>Metrics]
    end

    subgraph Work["Workload"]
        WA[Model A]
        WB[Model B]
    end

    METRICS -->|Collection| RA
    RA -.->|Management| GPU1
    RA -.->|Management| GPU2
    RA -.->|Management| GPU3
    WA -->|Primary Allocation| GPU1
    WB -->|Primary Allocation| GPU2
    WA -.->|On Spike| GPU3
    WB -.->|On Spike| GPU3

    style GPU1 fill:#76b900
    style GPU2 fill:#76b900
    style GPU3 fill:#ffd93d
    style RA fill:#326ce5
```

:::info Resource Sharing Principles

- **Primary Pool**: Base GPU resources allocated to each model
- **Elastic Pool**: Shared resources dynamically allocated during traffic spikes
- **Priority-based Allocation**: Protect critical workloads through priority-based resource allocation

:::

---

## Karpenter-based Node Scaling

:::info Karpenter v1.0+ GA Status
Karpenter has been GA (Generally Available) since v1.0 and can be used reliably in production environments. All examples in this document use the Karpenter v1 API (`karpenter.sh/v1`).
:::

### NodePool Configuration

Example Karpenter NodePool configuration for GPU workloads.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference-pool
spec:
  template:
    metadata:
      labels:
        node-type: gpu-inference
        workload: genai
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p4d.24xlarge    # 8x A100 40GB
            - p5.48xlarge     # 8x H100 80GB
            - g5.48xlarge     # 8x A10G 24GB
        - key: karpenter.k8s.aws/instance-gpu-count
          operator: Gt
          values: ["0"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
  limits:
    cpu: 1000
    memory: 4000Gi
    nvidia.com/gpu: 64
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
  weight: 100
```

### EC2NodeClass Configuration

EC2NodeClass configuration for GPU instances.

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-nodeclass
spec:
  role: KarpenterNodeRole-${CLUSTER_NAME}
  amiSelectorTerms:
    - alias: al2023@latest
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: ${CLUSTER_NAME}
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 500Gi
        volumeType: gp3
        iops: 10000
        throughput: 500
        encrypted: true
        deleteOnTermination: true
  instanceStorePolicy: RAID0
  userData: |
    #!/bin/bash
    # NVIDIA Driver and Container Toolkit setup
    nvidia-smi

    # GPU Memory Mode setting (Persistence Mode)
    nvidia-smi -pm 1

    # EFA Driver load (for p4d, p5 instances)
    modprobe efa
  tags:
    Environment: production
    Workload: genai-inference
```

### GPU Instance Type Comparison

<ComparisonTable
  headers={['Instance Type', 'GPU', 'GPU Memory', 'vCPU', 'Memory', 'Network', 'Use Case']}
  rows={[
    { id: '1', cells: ['p4d.24xlarge', '8x A100', '40GB x 8', '96', '1152 GiB', '400 Gbps EFA', 'Large-scale LLM inference'], recommended: true },
    { id: '2', cells: ['p5.48xlarge', '8x H100', '80GB x 8', '192', '2048 GiB', '3200 Gbps EFA', 'Ultra-large models, training'] },
    { id: '3', cells: ['p5e.48xlarge', '8x H200', '141GB x 8', '192', '2048 GiB', '3200 Gbps EFA', 'Large-scale model training/inference'] },
    { id: '4', cells: ['g5.48xlarge', '8x A10G', '24GB x 8', '192', '768 GiB', '100 Gbps', 'Small-medium model inference'] },
    { id: '5', cells: ['g6e.xlarge ~ g6e.48xlarge', 'NVIDIA L40S', 'Up to 8x48GB', 'Up to 192', 'Up to 768 GiB', 'Up to 100 Gbps', 'Cost-efficient inference'] },
    { id: '6', cells: ['trn2.48xlarge', '16x Trainium2', '-', '192', '2048 GiB', '1600 Gbps', 'AWS native training'] }
  ]}
/>

:::tip Instance Selection Guide

- **p5e.48xlarge**: 100B+ parameter models, maximum H200 memory utilization
- **p5.48xlarge**: 70B+ parameter models, when highest performance is required
- **p4d.24xlarge**: 13B-70B parameter models, balanced cost-performance
- **g6e.xlarge~48xlarge**: 13B-70B models, cost-efficient L40S inference
- **g5.48xlarge**: 7B and smaller models, cost-efficient inference
- **trn2.48xlarge**: AWS native training workload, Trainium2 optimization

:::

:::tip EKS Auto Mode GPU Scheduling
EKS Auto Mode automatically detects GPU workloads and provisions appropriate GPU instances. Even without NodePool configuration, it selects optimal instances based on GPU Pod resource requests.
:::

---

## Kubernetes GPU Resource Management

### K8s 1.33/1.34 Major Features

Kubernetes versions 1.33 and 1.34 introduced several important features for GPU workload management.

<Tabs>
  <TabItem value="k8s133" label="Kubernetes 1.33+" default>

| Feature | Description | GPU Workload Impact |
|---------|-------------|---------------------|
| **Stable Sidecar Containers** | Init containers can run throughout Pod lifecycle | Stabilization of GPU metrics collection and logging sidecars |
| **Topology-Aware Routing** | Traffic routing based on node topology | Optimal path selection between GPU nodes, reduced latency |
| **In-Place Resource Resizing** | Resource adjustment without Pod restart | Dynamic GPU memory adjustment (limited) |
| **DRA v1beta1 Stabilization** | Dynamic Resource Allocation API stabilization | Production GPU partitioning support |

  </TabItem>
  <TabItem value="k8s134" label="Kubernetes 1.34+">

| Feature | Description | GPU Workload Impact |
|---------|-------------|---------------------|
| **Projected Service Account Tokens** | Enhanced service account token management | Enhanced GPU Pod security |
| **DRA Prioritized Alternatives** | Resource allocation priority alternatives | Intelligent scheduling during GPU resource contention |
| **Improved Resource Quota** | Granular resource quota | Precise allocation control per GPU tenant |

  </TabItem>
</Tabs>

### DRA Deep Dive: Dynamic Resource Allocation

#### DRA Background and Necessity

:::info DRA (Dynamic Resource Allocation) Status Update

- **K8s 1.26-1.30**: Alpha (feature gate required, `v1alpha2` API)
- **K8s 1.31**: Promoted to Beta, enabled by default (`v1alpha2` API)
- **K8s 1.32**: Transition to new implementation (KEP #4381), `v1beta1` API (disabled by default)
- **K8s 1.33+**: `v1beta1` API stabilization, significant performance improvements
- **K8s 1.34+**: **DRA GA (Stable)**, enabled by default, prioritized alternatives support
- In EKS 1.32+, you must explicitly enable the `DynamicResourceAllocation` feature gate to use DRA.
- In EKS 1.33+, DRA is enabled by default. **Production use is recommended with K8s 1.34+ (DRA GA).**
:::

:::danger DRA Node Compatibility Constraints (As of March 2026)

**DRA is not compatible with Karpenter and EKS Auto Mode.** To use DRA, you must use **EKS Managed Node Group** or **Self-Managed Node Group**.

| Node Provisioning | DRA Compatible | Notes |
|---|---|---|
| **Managed Node Group** | ✅ Supported | Recommended |
| **Self-Managed Node Group** | ✅ Supported | Manual configuration required |
| **Karpenter** | ❌ Not Supported | Skips Pods with `ResourceClaim` ([#1231](https://github.com/kubernetes-sigs/karpenter/issues/1231)) |
| **EKS Auto Mode** | ❌ Not Supported | Same limitation (Karpenter-based internally) |

**Reference**: [AWS EKS Official Documentation — Manage hardware devices](https://docs.aws.amazon.com/eks/latest/userguide/device-management.html)
:::

In early Kubernetes, GPU resource allocation used the **Device Plugin** model. This model has the following fundamental limitations:

<DraLimitationsTable />

**DRA (Dynamic Resource Allocation)** was introduced as Alpha in Kubernetes 1.26 and promoted to Beta in 1.31+, overcoming these limitations.

#### Technical Reason Why Karpenter Cannot Support DRA

This is not simply a CRD interpretation issue, but an **architectural limitation of node provisioning**.

**Difference Between Scheduling vs Provisioning:**

| Stage | Role | DRA Support |
|---|---|---|
| **Pod Scheduling** (kube-scheduler) | Place Pod on existing node | ✅ Native support |
| **Node Provisioning** (Karpenter) | Create new node | ❌ Simulation impossible |

Karpenter analyzes Pod requirements to calculate the optimal instance for **"nodes that don't yet exist"**. This calculation is impossible with DRA:

1. **ResourceSlice requires node existence**: DRA Driver publishes ResourceSlice after detecting GPU on the node, but Karpenter needs this information before node creation (chicken-and-egg problem)
2. **No instance→ResourceSlice mapping**: With Device Plugin, we can statically know `p5.48xlarge → nvidia.com/gpu: 8`, but with DRA, ResourceSlice content varies by Driver implementation
3. **Cannot simulate CEL expressions**: DRA uses CEL to select devices, but the ResourceSlice attribute values needed for evaluation don't exist before node creation

In contrast, **Cluster Autoscaler works without interpreting DRA**. CA makes a simple decision: "There's a Pending Pod, so scale up the pre-defined MNG," so it doesn't need to simulate which instance is required.

#### Karpenter `IGNORE_DRA_REQUESTS` Workaround

Karpenter has an `IGNORE_DRA_REQUESTS` flag. When enabled, Karpenter ignores DRA requirements and provisions nodes based on remaining conditions like nodeSelector/labels.

```yaml
# Enable DRA ignore in Karpenter configuration
env:
  - name: IGNORE_DRA_REQUESTS
    value: "true"
```

**Workflow:**

```
Pod (ResourceClaim + nodeSelector: gpu-class=h100)
  → Karpenter: Ignore ResourceClaim, check nodeSelector
    → NodePool matching → Provision p5.48xlarge
      → Deploy DRA Driver → Publish ResourceSlice
        → kube-scheduler: Match ResourceClaim ↔ ResourceSlice → Place Pod
```

:::warning IGNORE_DRA_REQUESTS Limitations

This flag is for **PoC/testing purposes** and requires caution in production:

- **Bin-packing errors**: Karpenter doesn't know DRA resource consumption, so may place more Pods on one node than GPU capacity allows
- **Scale-down misjudgment**: May judge nodes in use as empty because it doesn't recognize DRA resources
- **Temporary flag**: Will be removed when formal DRA support is added
- **Dual management**: Must manage GPU intent in two places (DRA ResourceClaim and nodeSelector labels), risking inconsistency

**Production recommendation**: MNG + Cluster Autoscaler
:::

#### DRA Core Concepts

DRA is a new paradigm that separates **declarative resource requests from immediate allocation**:

```mermaid
flowchart LR
    A[Pod Creation<br/>ResourceClaim] -->|Pending| B[kube-scheduler<br/>DRA Analysis]
    B -->|Select Node| D[DRA<br/>Driver]
    D -->|Allocated| E[Pod<br/>Binding]
    E -->|Reserved| F[Pod<br/>Scheduling]
    F -->|InUse| G[Pod<br/>Running]

    H[Quota] -.->|Check| D
    I[DeviceClass<br/>Policy] -.->|Apply| D

    B -.->|Capacity Shortage| CA[Cluster<br/>Autoscaler]
    CA -->|MNG Scale-out| N[GPU Node<br/>Provisioning]
    N -->|Deploy DRA Driver| D

    style A fill:#f5f5f5
    style D fill:#326ce5
    style E fill:#76b900
    style G fill:#ffd93d
    style CA fill:#ff9900
```

:::warning This flow does not work with Karpenter/Auto Mode
Even when DRA Pods enter Pending state, Karpenter skips Pods with `ResourceClaim`. Node scale-out for DRA workloads only works with **Managed Node Group + Cluster Autoscaler** combination.
:::

#### ResourceClaim Lifecycle

The core of DRA is a new Kubernetes resource called **ResourceClaim**:

:::warning API Version Notice
The examples below are based on the `v1alpha2` API for K8s 1.31 and earlier.

**K8s 1.32+**: Transition to `resource.k8s.io/v1beta1` API, use DeviceClass instead of ResourceClass, ResourceClaim spec structure changed

**K8s 1.33+**: `v1beta1` API stabilization, production use recommended

**K8s 1.34+**: DRA prioritized alternatives support, enhanced resource scheduling

Use the API appropriate for your cluster version in production deployments.
:::

```yaml
# 1. Lifecycle State Description

# PENDING state: Waiting for resource allocation
apiVersion: resource.k8s.io/v1alpha2
kind: ResourceClaim
metadata:
  name: gpu-claim-vllm
  namespace: ai-inference
spec:
  resourceClassName: gpu.nvidia.com
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClaimParameters
    name: h100-params
status:
  phase: Pending  # Not yet allocated

---

# ALLOCATED state: DRA controller completed resource reservation
status:
  phase: Allocated
  allocation:
    resourceHandle: "gpu-handle-12345"
    shareable: false

---

# RESERVED state: Ready for Pod binding
status:
  phase: Reserved
  allocation:
    resourceHandle: "gpu-handle-12345"
    nodeName: "gpu-node-01"

---

# INUSE state: Pod actively running
status:
  phase: InUse
  allocation:
    resourceHandle: "gpu-handle-12345"
    nodeName: "gpu-node-01"
  reservedFor:
    - kind: Pod
      name: vllm-inference
      namespace: ai-inference
      uid: "abc123"
```

To transition from one state to the next, specific conditions must be met:

- **Pending -> Allocated**: DRA driver confirms and reserves available resources
- **Allocated -> Reserved**: Pod specifies ResourceClaim and scheduler determines node
- **Reserved -> InUse**: Pod actually starts running on the node

#### DRA vs Device Plugin Detailed Comparison

<ComparisonTable
  headers={['Item', 'Device Plugin', 'DRA']}
  rows={[
    { id: '1', cells: ['Resource Allocation Timing', 'At node startup (static)', 'At Pod scheduling (dynamic)'] },
    { id: '2', cells: ['Allocation Unit', 'Whole GPU only', 'GPU divisible (MIG, time-slicing)'] },
    { id: '3', cells: ['Priority Support', 'None (first-come-first-served)', 'ResourceClaim priority support'] },
    { id: '4', cells: ['Multi-resource Coordination', 'Not possible', 'Multiple resources coordinated at Pod level'] },
    { id: '5', cells: ['Performance Constraint Policy', 'None', 'Performance policy definable via ResourceClass'] },
    { id: '6', cells: ['Allocation Resilience', 'Manual cleanup on node failure', 'Automatic recovery mechanism'] },
    { id: '7', cells: ['Kubernetes Version', '1.8+', '1.26+ (Alpha), 1.32+ (v1beta1)'] },
    { id: '8', cells: ['Maturity', 'Production', '1.33+ production-ready'], recommended: true }
  ]}
/>

:::tip DRA Selection Guide
**When to use DRA:**

- GPU partitioning needed (MIG, time-slicing, MPS)
- Multi-tenant environment requiring attribute-based (CEL) GPU selection
- Topology-aware scheduling (NVLink, NUMA, IMEX)
- P6e-GB200 UltraServer environment (DRA required, Device Plugin not supported)
- **K8s 1.34+ environment**: DRA GA, production use recommended

**Before using DRA, verify:**

- **Node Provisioning**: Managed Node Group or Self-Managed Node Group required
- **Cannot use Karpenter/Auto Mode**: Skips DRA Pods, scale-out impossible
- **NVIDIA DRA Driver (v25.3.0+)** and **GPU Operator (v25.3.0+)** installation required

**When Device Plugin is sufficient:**

- Simply allocating GPUs in whole units
- **Using Karpenter or EKS Auto Mode** for node management
- Kubernetes version is 1.33 or earlier
- Legacy system compatibility is important
:::

### DRA Workload GPU Scale-out Strategy

DRA workloads cannot use Karpenter/Auto Mode's dynamic provisioning, so you must configure scale-out with **MNG + Cluster Autoscaler + KEDA** combination.

#### Scale-out Decision Criteria: 2-Stage Strategy

In LLM serving workloads, you must start scale-out **before** Pod Pending occurs. GPU node provisioning takes several minutes, so a purely reactive approach cannot guarantee SLO.

**Stage 1 (Proactive): KEDA + LLM Metrics → Pod Scale-out**

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: llm-decode-scaler
spec:
  scaleTargetRef:
    name: llm-decode
  minReplicaCount: 2
  maxReplicaCount: 8
  triggers:
    # KV Cache saturation — Most sensitive signal for LLM serving
    - type: prometheus
      metadata:
        query: |
          avg(vllm_gpu_cache_usage_perc{model="exaone"})
        threshold: "80"
    # Number of waiting requests
    - type: prometheus
      metadata:
        query: |
          sum(vllm_num_requests_waiting{model="exaone"})
        threshold: "10"
    # Approaching TTFT SLO violation
    - type: prometheus
      metadata:
        query: |
          histogram_quantile(0.95,
            rate(vllm_time_to_first_token_seconds_bucket[5m]))
        threshold: "2"
```

**Stage 2 (Reactive): Cluster Autoscaler → MNG Node Scale-out**

When Pods enter Pending state, Cluster Autoscaler increases the MNG's desired capacity.

```yaml
# Cluster Autoscaler configuration (for DRA GPU nodes)
- --expander=priority          # Specify GPU node group priority
- --scale-down-enabled=false   # Disable GPU node scale-down (CBR environment)
- --max-node-provision-time=15m # Consider GPU node provisioning time
```

**Scaling Chain:**

```
LLM Metrics (KV Cache, TTFT, Queue)
  → KEDA: Pod scale-out
    → kube-scheduler: Attempt ResourceClaim matching
      ├─ Success → Place on existing node
      └─ Failure → Pod Pending
           → Cluster Autoscaler: MNG +1
             → New GPU node → Install DRA Driver
               → Create ResourceSlice → Place Pod
```

#### Disaggregated Serving Scale-out Criteria

When operating separate Prefill and Decode, each role has different bottleneck signals:

| | Prefill | Decode |
|---|---|---|
| **Bottleneck Signal** | TTFT increase, input queue backlog | TPS decrease, KV Cache saturation |
| **Scale Criteria** | Input token processing wait time | Number of concurrent generation sessions |
| **Scale Unit** | GPU compute intensive | GPU memory intensive |

### Topology-Aware Routing Utilization

Select optimal paths between GPU nodes to minimize latency.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vllm-inference
  namespace: ai-inference
  annotations:
    # K8s 1.33+ Topology-Aware Routing
    service.kubernetes.io/topology-mode: "Auto"
spec:
  selector:
    app: vllm
  ports:
    - port: 8000
      targetPort: 8000
  # Enable topology-aware routing
  trafficDistribution: PreferClose
```

---

## Workload Autoscaling

### KEDA ScaledObject Configuration

Configure GPU metrics-based autoscaling using KEDA. GPU metrics are collected through DCGM Exporter. For DCGM deployment and metric details, refer to [NVIDIA GPU Stack](./nvidia-gpu-stack.md#dcgm-monitoring).

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: model-a-gpu-scaler
  namespace: inference
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-a-serving
  pollingInterval: 15
  cooldownPeriod: 60
  minReplicaCount: 2
  maxReplicaCount: 10
  fallback:
    failureThreshold: 3
    replicas: 3
  advanced:
    horizontalPodAutoscalerConfig:
      behavior:
        scaleDown:
          stabilizationWindowSeconds: 300
          policies:
            - type: Percent
              value: 25
              periodSeconds: 60
        scaleUp:
          stabilizationWindowSeconds: 0
          policies:
            - type: Percent
              value: 100
              periodSeconds: 15
            - type: Pods
              value: 4
              periodSeconds: 15
          selectPolicy: Max
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus-server.monitoring:9090
        metricName: gpu_utilization
        query: |
          avg(DCGM_FI_DEV_GPU_UTIL{pod=~"model-a-.*"})
        threshold: "70"
        activationThreshold: "50"
```

### Autoscaling Thresholds

Recommended thresholds based on workload characteristics.

<SpecificationTable
  headers={['Workload Type', 'Scale Up Threshold', 'Scale Down Threshold', 'Cooldown']}
  rows={[
    { id: '1', cells: ['Real-time Inference', 'GPU 70%', 'GPU 30%', '60s'] },
    { id: '2', cells: ['Batch Processing', 'GPU 85%', 'GPU 40%', '300s'] },
    { id: '3', cells: ['Interactive Service', 'GPU 60%', 'GPU 25%', '30s'] }
  ]}
/>

:::tip Threshold Tuning Guide

1. **Initial Setup**: Start with conservative values (Scale Up 80%, Scale Down 20%)
2. **Monitoring**: Observe actual traffic patterns for 2-3 days
3. **Adjustment**: Gradually adjust considering response time SLA and cost
4. **Validation**: Validate configuration through load testing

:::

### HPA and KEDA Integration

Configuration when using basic HPA together with KEDA.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-a-hpa
  namespace: inference
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-a-serving
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: External
      external:
        metric:
          name: gpu_utilization
          selector:
            matchLabels:
              scaledobject.keda.sh/name: model-a-gpu-scaler
        target:
          type: AverageValue
          averageValue: "70"
```

### Dynamic Resource Allocation Strategy

#### Traffic Spike Scenario

Traffic spike scenarios that can occur in actual operational environments and response strategies.

```mermaid
sequenceDiagram
    participant User as User
    participant LB as LB
    participant ModelA as Model A
    participant KEDA as KEDA
    participant Karp as Karpenter
    participant AWS as EC2

    Note over User,AWS: Normal: Model A 40%, Model B 30%

    User->>LB: Traffic Spike
    LB->>ModelA: Forward Request
    ModelA->>KEDA: GPU 85%

    KEDA->>ModelA: Increase Pods
    KEDA->>Karp: Request Node

    Karp->>AWS: Create p4d
    AWS-->>Karp: Ready

    Karp->>ModelA: Place Pod
    ModelA-->>User: Normalized
```

#### Inter-Model Resource Reallocation Procedure

Specific procedure for allocating Model B's idle resources to Model A when traffic spikes in Model A.

**Step 1: Metrics Collection and Analysis**

```yaml
# Key metrics collected by DCGM Exporter
# - DCGM_FI_DEV_GPU_UTIL: GPU utilization
# - DCGM_FI_DEV_MEM_COPY_UTIL: Memory copy utilization
# - DCGM_FI_DEV_FB_USED: Framebuffer usage
```

**Step 2: Scaling Decision**

<ScalingDecisionTable />

**Step 3: Execute Resource Reallocation**

```bash
# Reduce Model B replica count (free idle resources)
kubectl scale deployment model-b-serving --replicas=1 -n inference

# Increase Model A replica count
kubectl scale deployment model-a-serving --replicas=5 -n inference

# Or let KEDA handle it automatically
```

**Step 4: Node-level Scaling**

Karpenter automatically provisions additional nodes or cleans up idle nodes.

:::warning Caution

To ensure Model B's minimum SLA during resource reallocation, you must set `minReplicas`. Complete resource recovery can cause service interruption.

:::

---

## Cost Optimization Strategies

### GPU Workload Cost Comparison

Compare cost efficiency of various GPU instance types based on actual AWS pricing.

#### Inference Workload Cost Comparison (Hourly)

<SpotInstancePricingInference />

#### Training Workload Cost Comparison (Hourly)

<SavingsPlansPricingTraining />

#### Monthly Cost Scenarios (24/7 Operation)

**Scenario 1: Small-scale Inference Service (g5.2xlarge x 2)**

<SmallScaleCostCalculation />

**Scenario 2: Medium-scale Inference Service (g5.12xlarge x 4)**

<MediumScaleCostCalculation />

**Scenario 3: Large-scale Training Cluster (p4d.24xlarge x 8)**

<LargeScaleCostCalculation />

#### Cost Optimization Strategy Effects

<CostOptimizationStrategies />

:::tip Practical Cost Optimization Tips

**Inference Workloads:**
1. Use Spot instances by default (70% savings)
2. Remove idle nodes with Karpenter Consolidation (additional 20% savings)
3. Schedule-based resource reduction during off-hours (additional 30% savings)
4. **Total savings effect: approximately 85%**

**Training Workloads:**
1. 1-year Savings Plans commitment (35% savings)
2. Use Spot instances for experimental training (additional 40% savings)
3. Checkpoint-based restart for Spot interruptions
4. **Total savings effect: approximately 60%**
:::

### Karpenter-based Cost Optimization Strategies

Karpenter is the **key lever** for GPU infrastructure cost optimization. Maximum benefits can be achieved by combining the following 4 strategies.

<KarpenterGpuOptimization />

#### Strategy 1: Prioritize Spot Instance Utilization

Utilizing Karpenter's Spot instance support can reduce GPU costs by **up to 90%**.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-spot-inference
spec:
  template:
    metadata:
      labels:
        cost-tier: spot
        workload: inference
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.12xlarge
            - g5.24xlarge
            - g5.48xlarge
            - p4d.24xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-spot-nodeclass
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
        - key: karpenter.sh/capacity-type
          value: "spot"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 32
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
  weight: 50  # Prefer over On-Demand
```

#### Strategy 2: Schedule-based Cost Management

Apply differentiated resource policies based on business and off-business hours.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-scheduled-pool
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.12xlarge
            - g5.24xlarge
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
  limits:
    nvidia.com/gpu: 16
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s
    budgets:
      # Business hours: Prioritize stability (minimize node disruption)
      - nodes: "10%"
        schedule: "0 9 * * 1-5"
        duration: 9h
      # Off-hours: Prioritize cost (aggressive consolidation)
      - nodes: "50%"
        schedule: "0 18 * * 1-5"
        duration: 15h
      # Weekends: Maintain minimum resources
      - nodes: "80%"
        schedule: "0 0 * * 0,6"
        duration: 24h
```

#### Strategy 3: Remove Idle Resources Through Consolidation

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-consolidation-pool
spec:
  disruption:
    # Consolidate when nodes are empty or underutilized
    consolidationPolicy: WhenEmptyOrUnderutilized
    # Quick consolidation for cost savings (consolidate after 30s wait)
    consolidateAfter: 30s
```

#### Strategy 4: Workload-specific Instance Optimization

```yaml
# For small models (7B and below) - Cost efficient
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-small-models
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - g5.xlarge      # 1x A10G - $1.01/hr
            - g5.2xlarge     # 1x A10G - $1.21/hr
  weight: 100  # Top priority

---
# For large models (70B+) - Performance priority
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-large-models
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            - p4d.24xlarge   # 8x A100 - $32.77/hr
            - p5.48xlarge    # 8x H100 - $98.32/hr
  weight: 10   # Select only when necessary
```

#### Cost Optimization Strategy Detailed Comparison

<CostOptimizationDetails />

:::warning Spot Instance Cautions

- **Interruption Handling**: Spot instances receive 2-minute interruption notices. Proper graceful shutdown implementation required
- **Workload Suitability**: Suitable for stateless inference workloads
- **Availability**: Spot availability for specific instance types may be low, so specifying various types is recommended

:::


### Spot Interruption Handling

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-serving-spot
  namespace: inference
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 120
      containers:
        - name: vllm
          lifecycle:
            preStop:
              exec:
                command:
                  - /bin/sh
                  - -c
                  - |
                    # Stop receiving new requests
                    curl -X POST localhost:8000/drain
                    # Wait for in-progress requests to complete
                    sleep 90
      tolerations:
        - key: karpenter.sh/capacity-type
          operator: Equal
          value: "spot"
          effect: NoSchedule
```

### Consolidation Policy

Automatically clean up idle nodes to optimize costs.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference-pool
spec:
  disruption:
    # Consolidate when nodes are empty or underutilized
    consolidationPolicy: WhenEmptyOrUnderutilized
    # Consolidation wait time
    consolidateAfter: 30s
    # Budget settings - limit number of nodes that can be disrupted simultaneously
    budgets:
      - nodes: "20%"
      - nodes: "0"
        schedule: "0 9 * * 1-5"  # Prevent disruption during weekday business hours
        duration: 8h
```

### LLMOps Cost Governance

Complete cost visibility requires tracking both infrastructure costs and token-level costs. A hybrid strategy using **LangSmith for development/staging environments** and **Langfuse for production environments** is recommended.

#### 2-Tier Cost Tracking Strategy

Complete cost visibility requires tracking both **infrastructure level** and **application level** costs.

```mermaid
flowchart LR
    subgraph "Infrastructure Layer"
        LITE["Bifrost<br/>Infrastructure Cost Tracking"]
        METRICS["Model Unit Price × Tokens<br/>Team Budget Management"]
    end

    subgraph "Application Layer"
        LANGFUSE["Langfuse<br/>Application Cost Tracking"]
        APP_METRICS["Agent Step-by-step Cost<br/>Chain Latency<br/>Trace Analysis"]
    end

    LITE --> METRICS
    LANGFUSE --> APP_METRICS
```

**Bifrost (Infrastructure Level):**
- Set model token unit price (GPT-4: $0.03/1K, Claude: $0.015/1K)
- Team/project budget allocation and real-time monitoring
- Monthly cost reporting and alerts

**Langfuse (Application Level):**
- Track token consumption for each step in Agent workflows
- End-to-end latency and cost for entire chains
- Trace-based performance bottleneck analysis

This 2-Tier strategy enables simultaneous understanding of "which models are being used and how much" (infrastructure) and "which features are driving costs" (application).

#### Cost Monitoring Dashboard Configuration

```yaml
# Prometheus cost-related metrics collection rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-cost-rules
  namespace: monitoring
spec:
  groups:
    - name: gpu-cost
      rules:
        - record: gpu:hourly_cost:sum
          expr: |
            sum(
              karpenter_nodes_total_pod_requests{resource_type="nvidia.com/gpu"}
              * on(instance_type) group_left()
              aws_ec2_instance_hourly_cost
            )
        - alert: HighGPUCostAlert
          expr: gpu:hourly_cost:sum > 100
          for: 1h
          labels:
            severity: warning
          annotations:
            summary: "Hourly GPU cost exceeded $100"
```

### Training Infrastructure Cost Optimization

<TrainingCostOptimization />

:::tip Training Infrastructure Best Practices

1. **Production Training**: Ensure stability with On-Demand instances
2. **Experimentation/Tuning**: Cost savings with Spot instances
3. **Checkpointing**: Periodic saves to FSx for Lustre
4. **Monitoring**: Track training progress with TensorBoard + Prometheus
:::

### Cost Optimization Checklist

<SpecificationTable
  headers={['Item', 'Description', 'Expected Savings']}
  rows={[
    { id: '1', cells: ['Spot Instance Utilization', 'Non-production and fault-tolerant workloads', '60-90%'] },
    { id: '2', cells: ['Enable Consolidation', 'Automatic idle node cleanup', '20-30%'] },
    { id: '3', cells: ['Right-sizing', 'Select instances appropriate for workload', '15-25%'] },
    { id: '4', cells: ['Schedule-based Scaling', 'Reduce resources during off-hours', '30-40%'] }
  ]}
/>

:::tip Cost Optimization Execution Checklist

1. **Spot Instance Ratio**: Operate 70%+ of inference workloads on Spot
2. **Enable Consolidation**: Clean up idle nodes within 30 seconds
3. **Schedule-based Policy**: Reduce resources by 50%+ during off-hours
4. **Right-sizing**: Automatic selection of instance types matching model size
:::

:::warning Cost Optimization Cautions

- Graceful shutdown implementation required to minimize service impact during Spot instance interruptions
- Excessive Consolidation can cause scale-out delays
- Balance between cost savings and SLA compliance needs to be established
:::

:::tip Cost Monitoring

Use Kubecost or AWS Cost Explorer to track GPU workload-specific costs and regularly review optimization opportunities.

:::

---

## Operational Best Practices

### GPU Resource Request Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-a-serving
  namespace: inference
spec:
  template:
    spec:
      containers:
        - name: vllm
          resources:
            requests:
              nvidia.com/gpu: 1
              memory: "32Gi"
              cpu: "8"
            limits:
              nvidia.com/gpu: 1
              memory: "64Gi"
              cpu: "16"
```

### Monitoring Dashboard Configuration

Key panels to monitor in Grafana dashboard:

1. **GPU Utilization Trend**: GPU utilization changes over time
2. **Memory Usage**: GPU memory usage and available space
3. **Pod Scaling Events**: HPA/KEDA scaling history
4. **Node Provisioning**: Karpenter node creation/deletion events
5. **Cost Tracking**: Hourly/daily GPU costs

### Alert Configuration

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-alerts
  namespace: monitoring
spec:
  groups:
    - name: gpu-alerts
      rules:
        - alert: HighGPUUtilization
          expr: avg(DCGM_FI_DEV_GPU_UTIL) > 90
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "GPU utilization exceeded 90%"

        - alert: GPUMemoryPressure
          expr: (DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE)) > 0.9
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "GPU memory shortage risk"
```

---

## Summary

Dynamic resource management of EKS GPU clusters is a critical factor determining the performance and cost efficiency of GenAI services.

### Key Points

1. **Node Strategy Separation**: DRA workloads use Managed Node Group, general workloads use Karpenter/Auto Mode
2. **DRA Compatibility**: DRA not supported on Karpenter/Auto Mode — MNG + Cluster Autoscaler required
3. **KEDA Integration**: GPU metrics-based workload autoscaling (KV Cache, TTFT, queue depth)
4. **Spot Instances**: Cost reduction by utilizing Spot for appropriate workloads (non-DRA workloads)
5. **Consolidation**: Cost optimization through automatic cleanup of idle resources

### Next Steps

- [NVIDIA GPU Software Stack](./nvidia-gpu-stack.md) -- GPU Operator, DCGM, MIG, Time-Slicing, Dynamo
- [EKS GPU Node Strategy](./eks-gpu-node-strategy.md) -- Auto Mode + Karpenter + Hybrid Node Configuration
- [vLLM Model Serving](./vllm-model-serving.md) -- Inference Engine Deployment

---

## References

- [Karpenter Official Documentation](https://karpenter.sh/)
- [KEDA Official Documentation](https://keda.sh/)
- [AWS GPU Instance Guide](https://aws.amazon.com/ec2/instance-types/#Accelerated_Computing)
- [Kubernetes DRA Documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/)
