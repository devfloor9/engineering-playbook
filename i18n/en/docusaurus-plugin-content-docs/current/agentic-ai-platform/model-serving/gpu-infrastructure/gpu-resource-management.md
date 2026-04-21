---
title: "GPU Resource Management"
sidebar_label: "GPU Resource Management"
description: "GPU resource management and cost optimization using Karpenter, KEDA, and DRA on EKS"
tags: [gpu, karpenter, keda, dra, autoscaling, cost-optimization]
sidebar_position: 2
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import { SpecificationTable, ComparisonTable } from '@site/src/components/tables';
import { DraLimitationsTable, ScalingDecisionTable } from '@site/src/components/GpuResourceTables';
import {
  SpotInstancePricingInference,
  SavingsPlansPricingTraining,
  CostOptimizationStrategies,
  KarpenterGpuOptimization
} from '@site/src/components/AgenticSolutionsTables';

# GPU Resource Management

GPU resource management strategies in EKS environments are organized around three axes.

| Axis | Key Question | Core Technologies |
|---|---|---|
| **Provisioning** | Which GPU nodes to create and when? | Karpenter, EKS Auto Mode, Managed Node Group |
| **Scheduling** | Which node to place GPU Pods on? | Device Plugin, DRA, Topology-Aware Routing |
| **Scaling** | How to respond to traffic changes? | KEDA, HPA, Cluster Autoscaler |

This document covers the architecture and design decision criteria for each axis. For GPU hardware partitioning (MIG, Time-Slicing) and the NVIDIA software stack, see [NVIDIA GPU Stack](./nvidia-gpu-stack.md).

---

## Karpenter GPU NodePool

:::info Karpenter v1.2+ GA
Karpenter has been GA since v1.0, and all examples in this document use the `karpenter.sh/v1` API.
:::

### GPU Node Auto-Provisioning Concepts

Karpenter analyzes Pending Pod resource requests (`nvidia.com/gpu`, memory, CPU) to automatically provision the optimal EC2 instance. The core value of Karpenter for GPU workloads includes:

- **Instance diversity**: Support for various GPU instances (p4d, p5, g5, g6e, etc.) in a single NodePool
- **Spot/On-Demand mix**: Balance cost and stability with capacity-type
- **Consolidation**: Automatically clean up idle GPU nodes for cost savings
- **Taint-based isolation**: Set `nvidia.com/gpu` taint on GPU nodes to exclude non-GPU workloads

### NodePool Configuration Example

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

**Design Points:**

- `limits.nvidia.com/gpu: 64` — Cluster-wide GPU cap to prevent cost runaway
- `disruption.consolidateAfter: 30s` — Quick cleanup is key since GPU nodes are expensive
- `weight: 100` — Priority setting among multiple NodePools

### GPU Instance Type Comparison

<ComparisonTable
  headers={['Instance Type', 'GPU', 'GPU Memory', 'vCPU', 'Memory', 'Network', 'Use Case']}
  rows={[
    { id: '1', cells: ['p4d.24xlarge', '8x A100', '40GB x 8', '96', '1152 GiB', '400 Gbps EFA', 'Large-scale LLM inference'], recommended: true },
    { id: '2', cells: ['p5.48xlarge', '8x H100', '80GB x 8', '192', '2048 GiB', '3200 Gbps EFA', 'Ultra-large models, training'] },
    { id: '3', cells: ['p5e.48xlarge', '8x H200', '141GB x 8', '192', '2048 GiB', '3200 Gbps EFA', 'Large model training/inference'] },
    { id: '4', cells: ['g5.48xlarge', '8x A10G', '24GB x 8', '192', '768 GiB', '100 Gbps', 'Small/medium model inference'] },
    { id: '5', cells: ['g6e.xlarge ~ g6e.48xlarge', 'NVIDIA L40S', 'Up to 8x48GB', 'Up to 192', 'Up to 768 GiB', 'Up to 100 Gbps', 'Cost-efficient inference'] },
    { id: '6', cells: ['trn2.48xlarge', '16x Trainium2', '-', '192', '2048 GiB', '1600 Gbps', 'AWS native training'] }
  ]}
/>

:::tip Instance Selection Guide
- **p5e.48xlarge**: 100B+ parameter models, maximize H200 memory
- **p5.48xlarge**: 70B+ parameter models, highest performance requirements
- **p4d.24xlarge**: 13B-70B parameter models, balanced cost-performance
- **g6e**: 13B-70B models, cost-efficient inference with L40S
- **g5.48xlarge**: 7B and below models, cost-efficient inference
- **trn2.48xlarge**: AWS native training workloads
:::

:::tip EKS Auto Mode
EKS Auto Mode automatically detects GPU workloads and provisions appropriate GPU instances. Without separate NodePool configuration, it selects optimal instances based on Pod resource requests.
:::

---

## Kubernetes GPU Scheduling

### Device Plugin Model

The default method for using GPUs in Kubernetes is the NVIDIA Device Plugin. It registers `nvidia.com/gpu` extended resources with kubelet, and Pods specify GPU count in `resources.requests`.

```yaml
resources:
  requests:
    nvidia.com/gpu: 1
  limits:
    nvidia.com/gpu: 1
```

Device Plugin is simple and stable but can only allocate GPUs as **whole units** and cannot do attribute-based selection (e.g., MIG profiles, specific GPU models).

### Topology-Aware Routing

Topology-Aware Routing, stabilized in K8s 1.33+, minimizes network latency between GPU nodes. It prioritizes routing traffic to GPU nodes within the same AZ, particularly improving performance for multi-node tensor parallelism workloads.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vllm-inference
  annotations:
    service.kubernetes.io/topology-mode: "Auto"
spec:
  selector:
    app: vllm
  ports:
    - port: 8000
  trafficDistribution: PreferClose
```

### Gang Scheduling

For large-scale LLM training or tensor parallel inference, multiple GPU Pods must be scheduled **simultaneously**. If only some are placed, the rest remain Pending and occupy resources, creating a deadlock.

**Solutions:**
- **Coscheduling Plugin** (scheduler-plugins): PodGroup CRD to specify minimum Pod count for all-or-nothing scheduling
- **Volcano**: Batch scheduler with native Gang Scheduling support
- **KAI Scheduler**: NVIDIA's GPU-aware scheduler with GPU topology-aware Gang Scheduling (details in [NVIDIA GPU Stack](./nvidia-gpu-stack.md#kai-scheduler))

---

## DRA (Dynamic Resource Allocation)

### Concepts and Necessity

DRA is Kubernetes' new GPU resource management paradigm that overcomes Device Plugin limitations.

<DraLimitationsTable />

:::info DRA Version History
- **K8s 1.26-1.30**: Alpha (`v1alpha2` API, feature gate required)
- **K8s 1.31**: Promoted to Beta, enabled by default
- **K8s 1.32**: New implementation (KEP #4381), `v1beta1` API
- **K8s 1.33+**: `v1beta1` stabilized
- **K8s 1.34+**: **DRA GA (Stable)**, prioritized alternatives support
- **K8s 1.35**: GA, recommended for production
:::

### DRA Core Model

DRA separates **declarative resource requests** (ResourceClaim) from **immediate allocation**. When a Pod requests GPUs based on attributes like "1 H100 GPU, MIG 3g.20gb profile", the DRA Driver matches it with actual hardware.

```mermaid
flowchart LR
    A[Pod Creation<br/>ResourceClaim] -->|Pending| B[kube-scheduler<br/>DRA Analysis]
    B -->|Node Selection| D[DRA Driver]
    D -->|Allocated| E[Pod Binding]
    E -->|Reserved| F[Pod Running]

    B -.->|Insufficient Capacity| CA[Cluster Autoscaler]
    CA -->|MNG Scale-out| N[GPU Node]
    N -->|DRA Driver Deploy| D
```

### DRA vs Device Plugin Comparison

<ComparisonTable
  headers={['Item', 'Device Plugin', 'DRA']}
  rows={[
    { id: '1', cells: ['Resource Allocation', 'Static registration at node start', 'Dynamic allocation at Pod scheduling'] },
    { id: '2', cells: ['Allocation Unit', 'Whole GPU only', 'GPU partitioning possible (MIG, Time-Slicing)'] },
    { id: '3', cells: ['Attribute-based Selection', 'Not possible (index-based)', 'GPU attribute matching via CEL expressions'] },
    { id: '4', cells: ['Multi-resource Coordination', 'Not possible', 'Pod-level coordination of multiple resources'] },
    { id: '5', cells: ['Karpenter Compatible', 'Fully supported', 'Not supported (MNG required)'] },
    { id: '6', cells: ['Maturity', 'Production', 'K8s 1.34+ GA'], recommended: true }
  ]}
/>

### Node Provisioning Compatibility

:::danger DRA is not compatible with Karpenter/Auto Mode

| Node Provisioning | DRA Compatible | Notes |
|---|---|---|
| **Managed Node Group** | Supported | Recommended |
| **Self-Managed Node Group** | Supported | Manual configuration required |
| **Karpenter** | Not supported | Skips Pods with ResourceClaim |
| **EKS Auto Mode** | Not supported | Same limitation due to internal Karpenter |
:::

**Why Karpenter cannot support DRA:**

Karpenter analyzes Pod requirements to calculate optimal instances for **nodes that don't yet exist**. This calculation is impossible with DRA:

1. **ResourceSlice is created after node exists**: DRA Driver issues ResourceSlice after detecting GPUs on the node, but Karpenter needs this information before node creation (chicken-and-egg problem)
2. **No instance→ResourceSlice mapping**: With Device Plugin, `p5.48xlarge → nvidia.com/gpu: 8` is statically known, but with DRA the content varies by Driver implementation
3. **CEL expression simulation impossible**: ResourceSlice attribute values needed for evaluation don't exist before node creation

In contrast, **Cluster Autoscaler works without interpreting DRA**. It only needs the simple decision "there are Pending Pods, so scale up MNG."

### DRA Selection Guide

:::tip When to use DRA
**DRA is needed when:**
- GPU partitioning required (MIG, Time-Slicing, MPS)
- CEL-based GPU attribute selection in multi-tenant environments
- Topology-aware scheduling (NVLink, NUMA)
- P6e-GB200 UltraServer environments (DRA required)
- K8s 1.34+ environments

**Device Plugin is sufficient when:**
- Only whole GPU allocation needed
- Using Karpenter or EKS Auto Mode
- K8s 1.33 or below
:::

---

## KEDA GPU-Based Autoscaling

### Scaling Architecture

GPU workload autoscaling operates as a **2-stage chain**.

```mermaid
flowchart LR
    M[GPU Metrics<br/>DCGM/vLLM] --> KEDA[KEDA]
    KEDA -->|Pod Scale-out| S[kube-scheduler]
    S -->|Node Shortage| K[Karpenter or<br/>Cluster Autoscaler]
    K -->|GPU Node Creation| N[EC2]
    N --> S
```

1. **Workload Scaling (KEDA/HPA)**: Adjust Pod count based on GPU metrics
2. **Node Scaling (Karpenter/CA)**: Auto-provision GPU nodes when Pending Pods occur

### LLM Serving Metrics-Based ScaledObject

For LLM serving, **KV Cache saturation**, **TTFT**, and **queue depth** are more sensitive scaling signals than simple GPU utilization.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: llm-serving-scaler
spec:
  scaleTargetRef:
    name: llm-serving
  minReplicaCount: 2
  maxReplicaCount: 10
  triggers:
    # KV Cache saturation — most sensitive signal for LLM serving
    - type: prometheus
      metadata:
        query: avg(vllm_gpu_cache_usage_perc{model="exaone"})
        threshold: "80"
    # Waiting request count
    - type: prometheus
      metadata:
        query: sum(vllm_num_requests_waiting{model="exaone"})
        threshold: "10"
    # TTFT SLO violation approaching
    - type: prometheus
      metadata:
        query: |
          histogram_quantile(0.95,
            rate(vllm_time_to_first_token_seconds_bucket[5m]))
        threshold: "2"
```

### Disaggregated Serving Scaling Criteria

When operating Prefill and Decode separately, the bottleneck signals differ for each role.

| | Prefill | Decode |
|---|---|---|
| **Bottleneck Signal** | TTFT increase, input queue backlog | TPS decrease, KV Cache saturation |
| **Scale Criteria** | Input token processing wait time | Concurrent generation session count |
| **Scale Unit** | GPU compute intensive | GPU memory intensive |

### Recommended Scaling Thresholds

<SpecificationTable
  headers={['Workload Type', 'Scale Up Threshold', 'Scale Down Threshold', 'Cooldown']}
  rows={[
    { id: '1', cells: ['Real-time Inference', 'GPU 70%', 'GPU 30%', '60s'] },
    { id: '2', cells: ['Batch Processing', 'GPU 85%', 'GPU 40%', '300s'] },
    { id: '3', cells: ['Conversational Service', 'GPU 60%', 'GPU 25%', '30s'] }
  ]}
/>

### DRA Workload Scale-out

DRA workloads cannot use Karpenter, so they are configured with **MNG + Cluster Autoscaler + KEDA**.

```
LLM Metrics (KV Cache, TTFT, Queue)
  → KEDA: Pod scale-out
    → kube-scheduler: ResourceClaim matching attempt
      ├─ Success → Place on existing node
      └─ Failure → Pod Pending
           → Cluster Autoscaler: MNG +1
             → New GPU node → DRA Driver install
               → ResourceSlice creation → Pod placement
```

---

## Cost Optimization Strategies

### GPU Workload Cost Comparison

#### Inference Workloads (per hour)

<SpotInstancePricingInference />

#### Training Workloads (per hour)

<SavingsPlansPricingTraining />

### Cost Optimization Strategy Effects

<CostOptimizationStrategies />

### 4 Key Karpenter-Based Cost Optimization Strategies

<KarpenterGpuOptimization />

| Strategy | Core Mechanism | Expected Savings | Target |
|----------|---------------|-----------------|--------|
| **Spot Instance Priority** | `capacity-type: spot` + diverse instance types | 60-90% | Inference (stateless) workloads |
| **Time-based Disruption Budget** | Business hours `nodes: 10%`, off-hours `nodes: 50%` | 30-40% | Services with clear business hour patterns |
| **Consolidation** | `WhenEmptyOrUnderutilized` + `consolidateAfter: 30s` | 20-30% | All GPU workloads |
| **Per-workload Instance Optimization** | Small models→g5, large models→p5, weight for priority | 15-25% | Operating various model sizes |

:::tip Combined Cost Optimization Effect
**Inference workloads:** Spot (70%) + Consolidation (20%) + Time-based scheduling (30%) = **~85% total savings**

**Training workloads:** Savings Plans 1-year commitment (35%) + Spot for experiments (40%) + checkpoint restart = **~60% total savings**
:::

### LLMOps Cost Governance

Both infrastructure costs and **token-level costs** must be tracked for complete cost visibility.

```mermaid
flowchart LR
    subgraph "Infrastructure Layer"
        BIFROST["Bifrost/LiteLLM<br/>Per-model unit price × tokens<br/>Per-team budget management"]
    end
    subgraph "Application Layer"
        LANGFUSE["Langfuse<br/>Per-agent-step cost<br/>Chain Latency/Trace"]
    end
```

- **Infrastructure Layer** (Bifrost/LiteLLM): Per-model token pricing, per-team/project budget allocation, monthly cost reports
- **Application Layer** (Langfuse): Per-agent-workflow-step token consumption, end-to-end cost, trace-based bottleneck analysis

:::warning Spot Instance Cautions
- **Interruption handling**: 2-minute advance notice. Implement graceful shutdown with `terminationGracePeriodSeconds` and `preStop` hooks
- **Workload suitability**: Suitable for stateless inference workloads
- **Availability**: Spot availability for specific instance types may be low; specify diverse types
:::

### Cost Optimization Checklist

<SpecificationTable
  headers={['Item', 'Description', 'Expected Savings']}
  rows={[
    { id: '1', cells: ['Spot Instance Usage', 'Non-production and fault-tolerant workloads', '60-90%'] },
    { id: '2', cells: ['Enable Consolidation', 'Auto-cleanup of idle nodes', '20-30%'] },
    { id: '3', cells: ['Right-sizing', 'Select instances matching workloads', '15-25%'] },
    { id: '4', cells: ['Schedule-based Scaling', 'Reduce resources during off-hours', '30-40%'] }
  ]}
/>

---

## Related Documents

- [NVIDIA GPU Stack](./nvidia-gpu-stack.md) — GPU Operator, DCGM, MIG, Time-Slicing, Dynamo
- [EKS GPU Node Strategy](./eks-gpu-node-strategy.md) — Auto Mode + Karpenter + Hybrid Node configuration
- [vLLM Model Serving](../inference-frameworks/vllm-model-serving.md) — Inference engine deployment

## References

- [Karpenter Official Documentation](https://karpenter.sh/)
- [KEDA Official Documentation](https://keda.sh/)
- [AWS GPU Instance Guide](https://aws.amazon.com/ec2/instance-types/#Accelerated_Computing)
- [Kubernetes DRA Documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/)
