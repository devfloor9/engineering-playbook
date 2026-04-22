---
title: "GPU Resources · Observability · Hybrid Node · Lessons Learned"
sidebar_label: "Cost · Observability · Hybrid"
description: "2-Tier GPU autoscaling, DCGM/vLLM monitoring, Bifrost→Bedrock Cascade Fallback, Hybrid Node on-premises integration, large MoE deployment lessons learned"
created: 2026-04-03
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 25
tags:
  - inference
  - optimization
  - gpu
  - karpenter
  - keda
  - hybrid-node
  - cost-optimization
  - langfuse
  - lessons-learned
  - scope:tech
sidebar_position: 4
---

## Overview

The majority of LLM serving operational costs come from GPU uptime, and achieving cost efficiency requires autoscaling, observability, fallback, and on-premises integration to work together organically. This document consolidates 2-Tier scaling, DCGM/vLLM monitoring, Bifrost→Bedrock Cascade Fallback, EKS Hybrid Node integration, and lessons learned from large MoE model deployments.

## GPU Resource Management & Autoscaling

### 2-Tier Scaling Architecture

LLM serving configures Pod scaling and Node scaling in two stages.

```mermaid
flowchart TB
    subgraph Metrics["Metrics Sources"]
        DCGM[DCGM Exporter<br/>GPU Metrics]
        VLLM[vLLM Metrics<br/>KV Cache, TTFT, Queue]
    end

    subgraph PodScale["Stage 1: Pod Scaling"]
        KEDA[KEDA<br/>GPU Metrics-based]
        HPA[HPA v2<br/>Custom Metrics]
    end

    subgraph NodeScale["Stage 2: Node Scaling"]
        KARP[Karpenter<br/>Auto Provisioning]
    end

    DCGM --> KEDA
    VLLM --> KEDA
    KEDA -->|Pod Increase| PodScale
    PodScale -->|GPU Shortage| KARP
    KARP -->|"p5.48xlarge Provisioning"| NodeScale

    style DCGM fill:#76b900,color:#fff
    style KEDA fill:#326ce5,color:#fff
    style KARP fill:#ff9900,color:#fff
```

### KEDA Scaling Configuration

Three core scaling signals for LLM serving:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: llm-inference-scaler
spec:
  scaleTargetRef:
    name: vllm-deployment
  minReplicaCount: 2
  maxReplicaCount: 8
  triggers:
    # 1. KV Cache saturation — most sensitive signal
    - type: prometheus
      metadata:
        query: avg(vllm_gpu_cache_usage_perc)
        threshold: "80"
    # 2. Number of waiting requests
    - type: prometheus
      metadata:
        query: sum(vllm_num_requests_waiting)
        threshold: "10"
    # 3. TTFT SLO violation proximity
    - type: prometheus
      metadata:
        query: |
          histogram_quantile(0.95,
            rate(vllm_time_to_first_token_seconds_bucket[5m]))
        threshold: "2"
```

### Disaggregated Serving Scaling Criteria

Prefill and Decode have different bottleneck signals.

| | Prefill | Decode |
|---|---|---|
| **Bottleneck Signal** | TTFT increase, input queue backlog | TPS decrease, KV Cache saturation |
| **Scaling Criterion** | Input token processing wait time | Concurrent generation session count |
| **GPU Characteristics** | Compute-intensive (compute bottleneck) | Memory-intensive (bandwidth bottleneck) |

### DRA (Dynamic Resource Allocation) Reality

DRA provides GPU partitioning/topology-aware scheduling as v1beta1 in K8s 1.32+ and GA in 1.34+. However, there is an **architectural limitation of incompatibility with Karpenter/Auto Mode**.

- Karpenter must simulate GPU resources **before node creation**, but DRA's ResourceSlice is published by DRA Driver **after node creation**
- Due to this "chicken and egg" problem, DRA Pods are skipped in Karpenter
- **When Using DRA**: MNG + Cluster Autoscaler required

:::info DRA Usage Decision
**When DRA is needed:** MIG partitioning, CEL-based attribute GPU selection, P6e-GB200 environments

**When Device Plugin is sufficient:** Whole GPU unit allocation, Karpenter/Auto Mode usage
:::

### Cost Optimization Stack

Combining four strategies can achieve **approximately 85% total cost reduction**.

| Strategy | Reduction Effect | Application Method |
|------|---------|---------|
| **Spot Instances** | 60-90% | Karpenter `capacity-type: spot`, p5 Spot $13-15/hr (us-east-2) |
| **Consolidation** | 20-30% | `consolidationPolicy: WhenEmptyOrUnderutilized`, 30s wait |
| **Right-sizing** | 15-25% | Automatic instance type selection by model size (NodePool weight) |
| **Time-based Scheduling** | 30-40% | disruption budget to reduce 50%+ during non-business hours |

```yaml
# Karpenter time-based disruption budget example
disruption:
  consolidationPolicy: WhenEmptyOrUnderutilized
  consolidateAfter: 30s
  budgets:
    # Business hours: stability priority
    - nodes: "10%"
      schedule: "0 9 * * 1-5"
      duration: 9h
    # Non-business hours: cost priority
    - nodes: "50%"
      schedule: "0 18 * * 1-5"
      duration: 15h
```

## Observability & Fallback Strategy

### GPU Monitoring Stack

```mermaid
flowchart LR
    subgraph GPU["GPU Layer"]
        DCGM[DCGM Exporter<br/>GPU Sensor Metrics]
        VLLM_M[vLLM Metrics<br/>Inference Metrics]
    end

    subgraph Collect["Collection"]
        PROM[Prometheus]
    end

    subgraph Visualize["Visualization & Alerting"]
        GRAF[Grafana<br/>Dashboard]
        ALERT[AlertManager<br/>Alerts]
    end

    subgraph AppLevel["Application Level"]
        BIFROST[Bifrost<br/>Infrastructure Cost Tracking]
        LANGFUSE[Langfuse<br/>Inference Quality/Latency]
    end

    DCGM --> PROM
    VLLM_M --> PROM
    PROM --> GRAF
    PROM --> ALERT

    style DCGM fill:#76b900,color:#fff
    style PROM fill:#9c27b0,color:#fff
    style BIFROST fill:#ff9900,color:#fff
    style LANGFUSE fill:#326ce5,color:#fff
```

### Core Monitoring Metrics

**GPU Infrastructure Metrics (DCGM):**

| Metric | Description | Threshold |
|--------|------|-------|
| `DCGM_FI_DEV_GPU_UTIL` | GPU SM utilization | &gt; 90%: warning, &gt; 95%: critical |
| `DCGM_FI_DEV_MEM_COPY_UTIL` | Memory copy utilization | &gt; 80%: caution |
| `DCGM_FI_DEV_FB_USED` | Framebuffer usage | Available memory &lt; 10%: critical |
| `DCGM_FI_DEV_POWER_USAGE` | GPU power consumption | Caution when approaching TDP |

**vLLM Inference Metrics:**

| Metric | Description | Threshold |
|--------|------|-------|
| `vllm:gpu_cache_usage_perc` | KV Cache usage | &gt; 80%: scale out |
| `vllm:num_requests_waiting` | Waiting requests | &gt; 10: scale out |
| `vllm:time_to_first_token_seconds` | TTFT | P95 &gt; 2s: action required |
| `vllm:num_preemptions_total` | Preemption count | High indicates memory shortage |
| `vllm:avg_generation_throughput_toks_per_s` | Generation throughput | Monitor vs baseline |

### 2-Tier Cost Tracking

Track both infrastructure and application levels for complete cost visibility.

- **Bifrost (Infrastructure Level)**: Token unit price per model, team/project budget management, monthly cost reports
- **Langfuse (Application Level)**: Token consumption per Agent workflow stage, chain end-to-end latency, Trace-based performance bottleneck analysis

This 2-Tier strategy enables simultaneous understanding of "which models were used how much" (infrastructure) and "which features drive costs" (application).

### Bifrost → Bedrock Cascade Fallback

When self-hosted models (vLLM/llm-d) are overloaded or failing, Cascade Routing can be configured to automatically fallback to Amazon Bedrock's managed models. Bifrost (or LiteLLM) acts as the Gateway, switching requests to Bedrock on response failures/timeouts.

```mermaid
flowchart LR
    C[Client App] --> BF[Bifrost Gateway]

    subgraph SelfHosted["Self-Hosted (EKS)"]
        LLMD[llm-d + vLLM<br/>Qwen3-32B / GLM-5]
    end

    subgraph Managed["AWS Managed"]
        BR[Amazon Bedrock<br/>Claude 4 Sonnet<br/>Nova Pro]
    end

    BF -->|"Primary: Self-hosted"| LLMD
    BF -->|"Secondary: Fallback"| BR

    LLMD -.->|"500/502/503/timeout"| BF
    BF -.->|"Automatic Switch"| BR

    style BF fill:#ff9900,color:#fff
    style LLMD fill:#326ce5,color:#fff
    style BR fill:#ff6b6b,color:#fff
```

**Bifrost Cascade Routing Configuration:**

```yaml
# bifrost-config.yaml
routing:
  defaultModel: self-hosted-qwen3
  strategy: cascade
  cascadeOrder:
    - self-hosted-qwen3      # Primary: EKS Self-hosted (cost optimized)
    - self-hosted-glm5        # Secondary: EKS Self-hosted alternative
    - bedrock-claude-sonnet   # Tertiary: Bedrock managed (fallback)
  fallbackConditions:
    - statusCode: [500, 502, 503, 504]
    - latencyMs: "> 30000"    # Fallback if exceeding 30s
    - errorRate: "> 0.1"      # Fallback if error rate exceeds 10%

models:
  - name: self-hosted-qwen3
    provider: openai-compatible
    baseUrl: http://inference-gateway.llm-d:8080/v1
    model: Qwen/Qwen3-32B
    priority: 1
    costPer1kTokens: 0.001    # Self-hosted estimated cost

  - name: self-hosted-glm5
    provider: openai-compatible
    baseUrl: http://glm5-service.agentic-serving:8000/v1
    model: zai-org/GLM-5-FP8
    priority: 2
    costPer1kTokens: 0.003

  - name: bedrock-claude-sonnet
    provider: bedrock
    model: anthropic.claude-sonnet-4-20250514
    region: us-east-1
    priority: 3
    costPer1kTokens: 0.003    # Bedrock official pricing
    maxTokens: 4096
```

**Advantages of Cascade Routing:**

| Perspective | Self-hosted Only | Cascade (Self-hosted + Bedrock) |
|------|----------------|-------------------------------|
| **Availability** | Service interruption on GPU failure | Uninterrupted via Bedrock fallback |
| **Cost** | Fixed GPU cost | Regular Self-hosted (low cost) + peak Bedrock (pay-as-you-go) |
| **Capacity Planning** | Secure GPU for peak traffic | GPU for baseline traffic only, excess to Bedrock |
| **Cold Start** | Several minutes delay on Spot interruption | Bedrock immediate response |

:::tip Cost Optimization Pattern
Processing 80% of regular traffic with Self-hosted and offloading 20% peak to Bedrock **eliminates the need to provision GPUs for peak capacity**, achieving an additional 30-40% infrastructure cost reduction. Bedrock also serves as immediate backup during Spot instance interruptions.
:::

## Hybrid Node: On-Premises GPU Farm Integration

### Overview

EKS Hybrid Node is a feature for **registering on-premises GPU servers to EKS clusters** (GA November 2024). Existing DGX and GPU servers can be integrated with cloud EKS to build hybrid Inference architecture.

```mermaid
flowchart LR
    subgraph AWS["AWS Cloud"]
        EKS[EKS Control Plane]
        subgraph CloudNodes["Cloud GPU Nodes"]
            CN1[p5.48xlarge<br/>H100×8<br/>Spot]
            CN2[g6e.12xlarge<br/>L40S×4]
        end
    end

    subgraph OnPrem["On-Premises (VPN/Direct Connect)"]
        HN1[Hybrid Node 1<br/>DGX A100×8]
        HN2[Hybrid Node 2<br/>GPU Server×4]
    end

    subgraph Gateway["Inference Gateway"]
        BF[Bifrost<br/>Cascade Routing]
    end

    BF -->|"Primary: On-Prem<br/>(Fixed Cost)"| HN1
    BF -->|"Secondary: Cloud GPU<br/>(Spot/On-Demand)"| CN1
    BF -->|"Tertiary: Bedrock<br/>(Pay-as-you-go Fallback)"| BR[Amazon Bedrock]

    HN1 -.->|"VPN / DX"| EKS
    HN2 -.->|"VPN / DX"| EKS
    CN1 -.-> EKS
    CN2 -.-> EKS

    style AWS fill:#fff3e0
    style OnPrem fill:#e8f5e9
    style BF fill:#ff9900,color:#fff
```

### Hybrid Node Registration

```bash
# 1. Create Hybrid Node IAM Role
aws iam create-role \
  --role-name EKSHybridNodeRole \
  --assume-role-policy-document file://hybrid-node-trust-policy.json

aws iam attach-role-policy \
  --role-name EKSHybridNodeRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

# 2. Register Hybrid Node from on-premises server
curl -o hybrid-node-installer.sh https://hybrid.eks.amazonaws.com/installer
chmod +x hybrid-node-installer.sh

sudo ./hybrid-node-installer.sh \
  --cluster-name genai-platform \
  --region us-west-2 \
  --role-arn arn:aws:iam::123456789012:role/EKSHybridNodeRole \
  --credential-provider ssm

# 3. Verify nodes
kubectl get nodes -l node.kubernetes.io/instance-type=hybrid
```

### Hybrid Node GPU Operator Installation

On-premises nodes lack AWS-managed GPU stack, so **GPU Operator is required**.

```yaml
# GPU Operator Helm Values (Hybrid Node dedicated)
driver:
  enabled: true               # On-premises: driver installation required
  version: "580.126.18"
  nodeSelector:
    node.kubernetes.io/instance-type: hybrid

toolkit:
  enabled: true
  nodeSelector:
    node.kubernetes.io/instance-type: hybrid

devicePlugin:
  enabled: true               # On-premises: Device Plugin installation required
  nodeSelector:
    node.kubernetes.io/instance-type: hybrid

dcgmExporter:
  enabled: true
  serviceMonitor:
    enabled: true
    additionalLabels:
      location: on-premises   # Separate on-premises/cloud metrics
  nodeSelector:
    node.kubernetes.io/instance-type: hybrid
```

### 3-Tier Cascade: On-Prem → Cloud → Bedrock

Combining Hybrid Node with Bifrost Cascade creates a 3-Tier architecture that **maximizes both cost efficiency and availability**.

| Tier | Infrastructure | Cost Structure | Role |
|------|--------|---------|------|
| **Tier 1** | On-Prem Hybrid Node (DGX) | Fixed cost (already owned) | Handle baseline traffic (always active) |
| **Tier 2** | Cloud GPU (EKS Spot/OD) | Variable cost (hourly) | Peak traffic bursts |
| **Tier 3** | Amazon Bedrock | Pay-as-you-go (per token) | Failure/overload fallback |

```yaml
# Bifrost 3-Tier Cascade configuration
routing:
  strategy: cascade
  cascadeOrder:
    - onprem-dgx-llm          # Primary: On-Prem (fixed cost, always active)
    - cloud-eks-llm            # Secondary: Cloud GPU (Spot, elastic)
    - bedrock-fallback         # Tertiary: Bedrock (pay-as-you-go, unlimited capacity)

models:
  - name: onprem-dgx-llm
    provider: openai-compatible
    baseUrl: http://hybrid-node-vllm.inference:8000/v1
    model: Qwen/Qwen3-32B
    priority: 1
    healthCheck:
      endpoint: /health
      intervalMs: 10000

  - name: cloud-eks-llm
    provider: openai-compatible
    baseUrl: http://inference-gateway.llm-d:8080/v1
    model: Qwen/Qwen3-32B
    priority: 2

  - name: bedrock-fallback
    provider: bedrock
    model: anthropic.claude-sonnet-4-20250514
    region: us-east-1
    priority: 3
```

### Pod Placement Strategy: Workload Separation with nodeSelector

```yaml
# Deploy on On-Prem Hybrid Node (baseline inference)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-onprem
spec:
  template:
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: hybrid
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          args: ["Qwen/Qwen3-32B-FP8", "--gpu-memory-utilization=0.95"]
          resources:
            limits:
              nvidia.com/gpu: 1
---
# Deploy on Cloud GPU Node (burst traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-cloud-burst
spec:
  template:
    spec:
      nodeSelector:
        karpenter.sh/nodepool: gpu-inference  # Cloud Karpenter NodePool
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          args: ["Qwen/Qwen3-32B-FP8", "--gpu-memory-utilization=0.95"]
          resources:
            limits:
              nvidia.com/gpu: 1
```

:::warning Hybrid Node Network Considerations
- **Latency**: 10-50ms additional delay via VPN/Direct Connect compared to cloud nodes
- **Bandwidth**: Multi-node NCCL communication requires high bandwidth → On-Prem internal PP is feasible, but On-Prem↔Cloud PP is not recommended
- **Recommendation**: On-Prem nodes serve independent models, connect with Cloud nodes via Cascade Routing at Gateway level
:::

## Lessons Learned: Large MoE Model Deployment

### Image/Model Download Failure Mitigation

Large model (744GB+) weight download is the most common Cold Start bottleneck in LLM serving. Downloading hundreds of GB from HuggingFace Hub frequently fails due to network instability, timeouts, and disk shortage.

#### Problem Types and Responses

| Problem | Symptoms | Response |
|------|------|------|
| **HF Hub Download Timeout** | Pod CrashLoopBackOff, `ConnectionError` | Retry + resume support (`HF_HUB_ENABLE_HF_TRANSFER=1`) |
| **Large File Partial Download** | Corruption error during model loading | Checksum verification + re-download |
| **Slow Container Image Pull** | `ImagePullBackOff`, several minutes wait | Pre-cache images (Bottlerocket data volume, SOCI) |
| **Multi-node Simultaneous Download** | Network bandwidth contention | S3 caching + init container sequential loading |
| **Slow EFS Download** | 30+ minutes loading time | Switch to NVMe emptyDir |

#### Strategy 1: HuggingFace Transfer Acceleration

`hf_transfer` is a Rust-based high-speed download library, **3-5x faster** than default download.

```yaml
env:
  - name: HF_HUB_ENABLE_HF_TRANSFER
    value: "1"
  - name: HF_TOKEN
    valueFrom:
      secretKeyRef:
        name: hf-token
        key: token
  # Download retry configuration
  - name: HF_HUB_DOWNLOAD_TIMEOUT
    value: "600"            # 10 minute timeout
```

#### Strategy 2: S3 Pre-caching + Init Container

Most stable method. Pre-upload model weights to S3, copy to local NVMe in init container.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-with-s3-cache
spec:
  template:
    spec:
      initContainers:
        # Stage 1: Download model from S3 to NVMe
        - name: model-downloader
          image: amazon/aws-cli:latest
          command: ["/bin/sh", "-c"]
          args:
            - |
              echo "Checking local cache..."
              if [ -f /models/config.json ]; then
                echo "Model already cached, skipping download"
                exit 0
              fi
              echo "Downloading model from S3..."
              aws s3 sync s3://model-cache/qwen3-32b-fp8/ /models/ \
                --no-progress \
                --expected-size 65000000000
              echo "Download complete, verifying..."
              # Checksum verification
              if [ -f /models/model.safetensors.index.json ]; then
                echo "Model verified successfully"
              else
                echo "ERROR: Model incomplete, retrying..."
                rm -rf /models/*
                aws s3 sync s3://model-cache/qwen3-32b-fp8/ /models/
              fi
          volumeMounts:
            - name: model-cache
              mountPath: /models
          resources:
            requests:
              cpu: 2
              memory: 4Gi
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          args:
            - /models
            - "--gpu-memory-utilization=0.95"
          volumeMounts:
            - name: model-cache
              mountPath: /models
      volumes:
        - name: model-cache
          emptyDir:
            sizeLimit: 200Gi  # NVMe emptyDir
```

#### Strategy 3: Container Image Pre-caching

Methods to reduce Pull time for vLLM/SGLang images (10-20GB).

```yaml
# Enable image pre-Pull in Karpenter NodePool
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference
spec:
  template:
    spec:
      kubelet:
        # Raise image GC threshold to maintain cache
        imageGCHighThresholdPercent: 90
        imageGCLowThresholdPercent: 85
```

**Using SOCI (Seekable OCI) Index:**

Creating SOCI index in ECR enables image lazy-loading via Pull, **reducing container start time by 70-80%**.

```bash
# Create SOCI index (ECR)
aws soci create \
  --image-uri 123456789012.dkr.ecr.us-east-2.amazonaws.com/vllm:v0.6.3

# EKS Auto Mode automatically supports SOCI
# Karpenter: Native SOCI support when using Bottlerocket AMI
```

#### Strategy 4: Multi-node LWS Model Download Coordination

When deploying with LWS multi-node, network contention occurs if Leader and Worker simultaneously download the same model.

```yaml
# Leader Pod: Download from S3 then cache to NVMe
initContainers:
  - name: model-downloader
    command: ["/bin/sh", "-c"]
    args:
      - |
        # Only Leader downloads from S3
        aws s3 sync s3://model-cache/glm5-fp8/ /models/
        echo "READY" > /models/.download-complete

# Worker Pod: Wait for Leader completion then download independently
initContainers:
  - name: model-downloader
    command: ["/bin/sh", "-c"]
    args:
      - |
        # Worker downloads independently from S3
        # (NVMe emptyDir is node-independent, cannot share)
        aws s3 sync s3://model-cache/glm5-fp8/ /models/
```

:::tip Download Performance Comparison
| Method | 744GB Model Time | Stability | Cost |
|------|-------------------|--------|------|
| HF Hub Direct | 20-40min | Frequent timeouts | Free |
| HF Hub + hf_transfer | 10-15min | Good | Free |
| **S3 Pre-caching** | **5-10min** | **Very Stable** | **S3 Storage Cost** |
| FSx for Lustre | 5-8min | Stable | High |
| NVMe Local Cache (Restart) | &lt; 1min | Best | Free |
:::

### EKS Auto Mode GPU Limitations

Core limitations identified during GLM-5 (744B MoE) and Kimi K2.5 (1T MoE) deployments.

#### p6-b200 Not Supported

As of April 2026, EKS Auto Mode's managed Karpenter **cannot provision p6-b200.48xlarge**. NodePool validation passes but actual NodeClaim creation fails with `NoCompatibleInstanceTypes` error.

#### GPU Instance Capacity Acquisition

p5.48xlarge frequently has InsufficientCapacity in Seoul/Tokyo regions. **Available in us-east-2 (Ohio) Spot for $13-15/hr** (85% reduction vs On-Demand $98/hr).

| Region | p5.48xlarge On-Demand | p5.48xlarge Spot | Spot Price |
|------|---------------------|-----------------|----------|
| ap-northeast-2 (Seoul) | InsufficientCapacity | Unconfirmed | — |
| ap-northeast-1 (Tokyo) | InsufficientCapacity | Unconfirmed | — |
| **us-east-2 (Ohio)** | Variable availability | **Available** | **$13~15/hr** |

#### GPU Operator Conflict

Installing GPU Operator with `devicePlugin.enabled=true` conflicts with Auto Mode's built-in Device Plugin, resulting in `allocatable=0`. **Must install with `devicePlugin.enabled=false`**.

#### Cannot Directly Terminate EC2 Instances

Auto Mode managed nodes block `ec2:TerminateInstances` via resource-based policy. Node cleanup must be performed indirectly through Karpenter NodePool deletion or Pod removal.

### Serving Framework Compatibility

| Model | vLLM Support | SGLang Support | Notes |
|------|---------|-----------|------|
| Qwen3-32B | Supported | Supported | llm-d default model, Apache 2.0 |
| Kimi K2.5 (1T MoE) | Supported | Supported | INT4 W4A16 Marlin MoE, `gpu_memory_utilization=0.85` |
| GLM-5 (744B MoE) | Not supported | Supported | `glm_moe_dsa` architecture → requires transformers v5.2+, vLLM uses v4.x |
| DeepSeek V3.2 | Supported | Supported | MoE, 671B/37B active |

:::warning GLM-5 Deployment Caution
GLM-5 is not supported in vLLM. Must use SGLang-dedicated image (`lmsysorg/sglang:glm5-hopper`), and configure `--pp-size 2 --nnodes 2 --dist-init-addr <leader>:5000` for multi-node deployment.
:::

### Storage Strategy

Storage performance is critical for large model (744GB+) weight loading.

| Storage | Sequential Read | Multi-node Sharing | Recommended Scenario |
|---------|---------|------------|------------|
| **NVMe emptyDir** | ~3,500 MB/s | Node-independent | p5 built-in NVMe, best performance |
| EFS | ~100-300 MB/s | ReadWriteMany | Small models, when sharing needed |
| S3 + init container | ~1,000 MB/s | S3 shared | Medium performance, cost efficient |
| FSx for Lustre | ~1,000+ MB/s | ReadWriteMany | Training workloads |

:::tip Large Model Recommendation
Large models like GLM-5 (744GB) and Kimi K2.5 (630GB) recommend **local NVMe (emptyDir)**. p5.48xlarge has 8×3.84TB NVMe SSD built-in, providing best performance at no additional cost. First startup takes 10-20min with HuggingFace Hub direct download, but subsequent loads are fast.
:::

### GPU Quota Pitfall

EC2 vCPU quotas are separated by instance bucket, requiring caution.

| Quota | Applicable Instances | Default | Caution |
|------|------------|--------|---------|
| Running On-Demand P instances | p4d, p5, p5en | 384 | Can have 2 p5.48xlarge (192 vCPU each) |
| Running On-Demand G and VT instances | g5, g6, g6e | **64** | Cannot even have 1 g6e.48xlarge → quota increase required |

Setting `instance-category: [g, p]` together in GPU NodePool may cause Karpenter to try G types first, hitting the G quota (64 vCPU). If only P types are needed, specify explicitly.

## References

### Official Documentation
- [KEDA Documentation](https://keda.sh/docs/) — Kubernetes Event-driven Autoscaling
- [Karpenter Documentation](https://karpenter.sh/docs/) — Node auto-provisioning, Disruption, Consolidation
- [EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes.html) — On-premises GPU farm integration
- [NVIDIA DCGM Exporter](https://github.com/NVIDIA/dcgm-exporter) — GPU sensor metrics collection
- [Langfuse Self-hosted](https://langfuse.com/docs/deployment/self-host) — Agent observability OSS

### Papers & Technical Blogs
- [a16z "The Economics of AI"](https://a16z.com/navigating-the-high-cost-of-ai-compute/) — GPU cost structure analysis
- [AWS Bottlerocket & SOCI](https://aws.amazon.com/blogs/containers/introducing-seekable-oci-for-lazy-loading-container-images/) — Container image lazy-loading
- [Spot Instance Operations Guide (AWS)](https://aws.amazon.com/ec2/spot/) — Karpenter Spot interruption response
- [NVIDIA Triton & DCGM Metrics Guide](https://developer.nvidia.com/dcgm) — GPU metrics interpretation

### Related Documentation
- [Inference Optimization on EKS (Overview)](./index.md) — Inference optimization category entry point
- [KV Cache Optimization (vLLM Deep Dive + Cache-Aware Routing)](./kv-cache-optimization.md) — vLLM/llm-d/Dynamo deep dive
- [Disaggregated Serving + LWS Multi-Node](./disaggregated-serving.md) — Prefill/Decode separation, LWS deployment
- [GPU Resource Management](../gpu-infrastructure/gpu-resource-management.md) — GPU scaling, DRA
- [NVIDIA GPU Software Stack](../gpu-infrastructure/nvidia-gpu-stack.md) — GPU Operator, DCGM
- [Agent Monitoring (Langfuse Canonical)](../../operations-mlops/observability/agent-monitoring.md) — Langfuse-based Agent observability
