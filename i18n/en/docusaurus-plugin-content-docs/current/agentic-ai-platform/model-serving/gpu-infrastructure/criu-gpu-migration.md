---
title: "CRIU-based GPU Live Migration (Preview)"
sidebar_label: "CRIU GPU Migration"
description: "Technical status and EKS application scenarios for GPU workload checkpoint/restore during Spot reclaim and scheduling events (Experimental)"
tags: [criu, gpu, checkpoint, spot, experimental, 'scope:tech']
sidebar_position: 5
last_update:
  date: 2026-04-18
  author: devfloor9
---

:::caution Experimental / Research Preview
As of April 2026, GPU CRIU is in alpha/beta state with NVIDIA cuda-checkpoint + CRIU + runc integration and not production-ready. This document provides technology trends and validation checklists.
:::

:::caution Verification pending
The practical alternative (graceful drain + warm start) ordering and EKS Auto Mode constraints are in a pre-verification state awaiting GLM-5 operator real-world validation. Timing and ordering measured values and banner will be updated upon completion.

Verification tracking: [Issue #7](https://github.com/devfloor9/engineering-playbook/issues/7)
:::


# CRIU-based GPU Live Migration (Preview)

## 1. Why CRIU: Spot Reclaim and KV Cache Loss Problems

### Problem Statement

Spot instance usage is a core cost reduction strategy in large-scale LLM serving environments (85-94% savings). However, Spot reclaim events cause critical issues:

**GLM-5 (744B MoE) Case on p5en.48xlarge H200Ã8:**

| Item | time | Notes |
|------|-----|------|
| Spot reclaim warning | 2min | AWSthat characters ê³µíis characters characters¼í time |
| Model reloading time | 15-20min | 744B parameter weight loading |
| KV Cache warmup | 5-10min | Major prefix regeneration |
| **Total recovery time** | **22-32min** | Cannot handle urgent requests |
| **Cost** | $40-65/reclaim | p5en per hour ~$120 based on |

**Fundamental Limitations of Spot Reclaim:**

```
Spot reclaim warning (2min)
  â
  ââ gracefulShutdown (1-2min) â Complete in-flight requests
  ââ ëª¨ë¸ characters¸ë¡ë (30sec-1min) â Memory deallocation
  ââ Pod termination
       â
  New node provisioning (3-5min)
       â
  Model reloading (15-20min) â bottleneck
       â
  KV Cache warmup (5-10min) â bottleneck
       â
  Resume serving (characters´ 25-37min)
```

### Limitations of Existing Alternatives

| Alternative | Advantages | Limitations |
|------|------|------|
| **Warm Replica** | Immediate failover | GPU 2Ã Cost ($240/hr â $480/hr) |
| **llm-d KV Offload** | KV Cacheonly network transfer | Model reloadingis characters¬characters í required |
| **On-Demand fallback** | Stable | Spot vs. 10Ã Cost |
| **Multi-AZ mincharacters°** | AZ Fault tolerance | Spot reclaim does not solve reclaim itself |

### CRIU Core Problem CRIU Aims to Solve

CRIU(Checkpoint/Restore In Userspace)is of a running process **entire state**to save to disk(checkpoint)and, resume from that point on another node(restore)enables you to.

**GPU Expected benefits when applied to GPU workloads:**

```
Spot reclaim warning (2min)
  â
  CRIU checkpoint (1-2min) â GPU memory + process status dump
  â
  New node provisioning (3-5min)
  â
  CRIU restore (1-3min) â Model reloading omitted
  â
  Resume serving (characters´ 5-10min, 70-80% reduction)
```

**Savings effect:**

- **ë³µêµ¬ time**: 25-37min â 5-10min (70-80% reduction)
- **Cost**: reclaimper $40-65 â $10-20 (50-70% savings)
- **SLA**: urgent requests 22min instead of 5min can be handled within

---

## 2. Technology Stack Status (2026.04)

### Overall Architecture

```mermaid
flowchart TB
    subgraph App["Application Layer"]
        VLLM["vLLM/SGLang<br/>GPU workload"]
    end

    subgraph Runtime["Container Runtime"]
        RUNC["runc + CRIU<br/>checkpoint/restore"]
        TOOLKIT["nvidia-container-toolkit<br/>CR plugin"]
    end

    subgraph GPU["GPU Layer"]
        CUDACK["cuda-checkpoint<br/>NVIDIA"]
        DRIVER["GPU Driver R580+"]
    end

    subgraph K8s["Kubernetes"]
        CKPT_API["ContainerCheckpoint API<br/>KEP-2008"]
        KUBELET["kubelet"]
    end

    VLLM --> RUNC
    RUNC --> TOOLKIT
    TOOLKIT --> CUDACK
    CUDACK --> DRIVER
    KUBELET --> CKPT_API
    CKPT_API --> RUNC

    style CUDACK fill:#76b900,color:#fff
    style CKPT_API fill:#326ce5,color:#fff
    style RUNC fill:#ff9900,color:#fff
```

### Core Component Maturity

| Component | Version | status | Notes |
|---------|------|------|------|
| **CRIU** | v4.0+ | Stable | CPU workloads production-verified |
| **cuda-checkpoint** | alpha/beta | **Experimental** | NVIDIA Official tool, GPU memory dump |
| **nvidia-container-toolkit** | v1.17+ | Beta | CR(checkpoint/restore) plugin included |
| **runc** | v1.2+ | Alpha | CRIU integration, GPU CR support |
| **K8s ContainerCheckpoint API** | 1.30 alpha | **Alpha** | KEP-2008, feature gate required |
| **EKS support** | - | **Not supported** | Self-validation required |

:::warning Maturity Warning
- **cuda-checkpoint**: NVIDIA Labs project beta or below. No official support
- **K8s API**: 1.30 alpha, 1.34until beta expected. GAthe 1.35+ projected
- **EKS**: ContainerCheckpoint APIthat feature gatecharacters´ë¯to EKSunclear if enabled in
- **production cases**: publicly available GPU CRIU no production cases (2026.04 based on)
:::

### Technology Stack Details

#### CRIU (Checkpoint/Restore In Userspace)

- **Role**: Linux process memory, file descriptors, network sockets, characters¤ë ë statusto checkpoint
- **GPU Constraints**: by default GPU memorydoes not recognize â cuda-checkpoint required
- **characters±charactersë**: CPU workloadis 10years+ characters­characters¬to Stable. Docker/Podmanalso used

#### cuda-checkpoint (NVIDIA)

- **GitHub**: [NVIDIA/cuda-checkpoint](https://github.com/NVIDIA/cuda-checkpoint)
- **Role**: CUDA context, GPU memory(device memory), unified memoryto dump/restore
- **Constraintscharacters¬í­**:
  - H100/H200: device memory charactersµë 80GB/141GB â checkpoint ícharacters¼ Size ëcharacters¼
  - PCIe BAR remapping: ëcharacters¼ GPU UUID ë¸ëë¡only restore thatë¥
  - NVLink topology Fixed: Multi-GPU workloadrequires same topology required
  - CUDA Version match: checkpoint/restore characters ëcharacters¼ CUDA Version required

#### nvidia-container-toolkit CR plugin

- **Role**: containerd/runcthat GPU containerto checkpoint/restoreí  ë cuda-checkpointto automatic call
- **Configuration**: `/etc/nvidia-container-runtime/config.toml`at `checkpoint-restore = true`
- **Status**: v1.17+at experimental support

#### K8s ContainerCheckpoint API (KEP-2008)

```yaml
# K8s 1.30+ (alpha, feature gate required)
apiVersion: v1
kind: Pod
metadata:
  name: vllm-pod
spec:
  enableServiceLinks: false
  containers:
  - name: vllm
    image: vllm/vllm-openai:latest
    # checkpoint target container
```

**checkpoint creation:**

```bash
kubectl checkpoint create <pod-name> \
  --container=vllm \
  --output=/var/lib/kubelet/checkpoints/vllm-ckpt.tar
```

**restore (on new node):**

```bash
kubectl apply -f pod-restore.yaml  # checkpoint path reference
```

:::caution K8s API Constraints
- 1.30: alpha, feature gate `ContainerCheckpoint=true` required
- EKS Auto Mode: feature gate cannot control â unavailable
- EKS Standard Mode: kube-apiserver/kubelet flag modification required
:::

---

## 3. GPU status checkpointof fundamental Constraints

### Device Memory Dump Size

| GPU | VRAM | checkpoint ícharacters¼ Size | Transfer time (10GbE) | Transfer time (100GbE) |
|-----|------|-------------------|-----------------|------------------|
| A100 40GB | 40GB | ~40GB | 32sec | 3.2sec |
| H100 80GB | 80GB | ~80GB | 64sec | 6.4sec |
| H200 141GB | 141GB | ~141GB | 113sec | 11.3sec |
| H200 x8 | 1,128GB | ~1,128GB | **15min** | **1.5min** |

:::warning Network bottleneck
p5en.48xlarge (H200Ã8)of checkpointis **1.1TB**is. cross-node Transferis requiring ê²½characters°:
- 10GbE: 15min (Spot reclaim 2min within impossible)
- 100GbE: 1.5min (Spot reclaim 2min within thatë¥, but ENA Constraints)
- **characters¤characters§characters with cross-node migrateis impossible**, only same-node restart is realistic
:::

### PCIe BAR remapping Constraints

GPUthe PCIe Base Address Register(BAR)to through CPUand communicates. checkpoint saved during BAR address is **hardware-dependent**characters´ë¯to ë¤characters Constraintsis characterscharactersµëë¤:

| Scenario | Feasibility | Reason |
|---------|---------|------|
| ëcharacters¼ ë¸ë restart | â | ëcharacters¼ PCIe slot, ëcharacters¼ BAR address |
| ëcharacters¼ instance type (ëcharacters¼ AZ) | â ï¸ Experimental | GPU UUID UUID match difficult to guarantee |
| ëcharacters¼ instance type (Cross-AZ) | â | PCIe different topology |
| Heterogeneous (H200âH100) | â | architectureÂ·memory Size charactersis |

### NVLink Topology Fixed

Multi-GPU workload(TP=4, TP=8)the GPU between NVLink characters°ê²° êµ¬characters¡°to ofcharacters¡´. checkpointthe **GPU indexand NVLink topologyto characters ë pathto save**íë¯ë¡:

```
Original:
  GPU 0 <--NVLink--> GPU 1
  GPU 2 <--NVLink--> GPU 3

Restore on different topology:
  GPU 0 <--PCIe--> GPU 1  â NVLink ëê¹
  GPU 2 <--NVLink--> GPU 3
  â Tensor Parallelism íµcharacters  characters¤í¨
```

**ê²°ë¡ **: TP>1 workloadis **ëcharacters¼ NVLink êµ¬characters± ë¸ëë¡only** restore thatë¥

### CUDA Context Version characters¼characters¹

- **CUDA Runtime Version**: checkpoint/restore characters ëcharacters¼ CUDA Version required (12.2 â 12.3 ë¶that)
- **Driver ABI í¸ícharacters±**: GPU driver major Version characters¼characters¹ required (R580 â R570 ë¶that)
- **AMI Fixed**: EKS Auto Modeis driver Version cannot control â Karpenter + Custom AMI required

---

## 4. EKS characters characters© Scenario ë§¤í¸ë¦­characters¤

### Scenarioë³ Feasibility

| Scenario | Feasibility | Complexity | Notes |
|---------|-----------|-------|------|
| **(a) ëcharacters¼ ë¸ë restart** | â Ready | Medium | OS update, kubelet restart |
| **(b) ëcharacters¼ instance type migrate** | â ï¸ Experimental | High | GPU UUID UUID match difficult to guarantee |
| **(c) Heterogeneous migrate (H200âH100)** | â Blocked | - | charactersí¤ícharacters² charactersis |
| **(d) Cross-AZ migrate** | â Blocked | - | NIXL recommended |

### (a) ëcharacters¼ ë¸ë restart â Ready

**Use Case:**
- Spot reclaim without ë¸ë OS update
- kubelet/containerd restart
- GPU driver update (ëcharacters¼ major Version)

**Procedure:**

```bash
# 1. Checkpoint characterscharacters±
kubectl checkpoint create gpu-pod-1 \
  --container=vllm \
  --output=/mnt/efs/checkpoints/vllm-$(date +%s).tar

# 2. ë¸ë maintenance
kubectl drain <node> --ignore-daemonsets
# ... OS update, driver update
kubectl uncordon <node>

# 3. Restore
kubectl apply -f vllm-pod-restore.yaml
```

**Constraintscharacters¬í­:**
- EFS/FSxto checkpoint save required (local disk is restart deleted on)
- ëcharacters¼ GPU index(CUDA_VISIBLE_DEVICES) maintain required
- kubelet feature gate `ContainerCheckpoint=true` required (EKS Standard)

**expected í¨ê³¼:**
- restart time: 20-30min â 3-5min (80-85% reduction)
- maintenance charactersëcharacters°: 1time â 10min

### (b) ëcharacters¼ instance type migrate â Experimental

**Use Case:**
- Spot reclaim characters ëcharacters¼ instance type ë¸ëto migration
- node replacement (hardware failure)

**Prerequisites:**
- ëcharacters¼ instance type (p5en.48xlarge â p5en.48xlarge)
- ëcharacters¼ AZ (us-east-2a â us-east-2a)
- **ëcharacters¼ GPU UUID** â AWSnot guaranteed by AWS â ï¸

**GPU UUID Pre-verification:**

```bash
# all p5en ë¸ëof GPU UUID collect
kubectl get nodes -l node.kubernetes.io/instance-type=p5en.48xlarge \
  -o json | jq '.items[].metadata.labels["nvidia.com/gpu.uuid"]'
```

**NodePool Constraints:**

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-checkpoint-pool
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["p5en.48xlarge"]  # ë¨characters¼ type Fixed
        - key: topology.kubernetes.io/zone
          operator: In
          values: ["us-east-2a"]  # ë¨characters¼ AZ Fixed
        # GPU UUID characters¼characters¹ ë³´characters¥ impossible â AWS API Not supported
```

**ë¬¸characters characters :**
- AWSthe GPU UUID characters¬characters  characterscharacters½ API not provided
- checkpoint/restore on failure fallbackwith cold start required
- Spot reclaim 2min within checkpoint + network Transfer + restore impossible

**Conclusion:** Technically possible but **not operationally viable**. for validation environment experiments

### (c) Heterogeneous migrate (H200âH100) â Blocked

**impossibleí Reason:**
- GPU charactersí¤ícharacters² charactersis (Hopper vs Ada)
- VRAM Size charactersis (141GB vs 80GB)
- CUDA Compute Capability charactersis (9.0 vs 8.0)
- cuda-checkpointthat charactersí¤ícharacters² between ë³í Not supported

### (d) Cross-AZ migrate â Blocked

**Use Case:**
- AZ failure characters different AZto migration

**Alternative: llm-d NIXL KV Offload**

Cross-AZ GPU workload migrationis CRIU instead of **llm-d NIXL**is ë characters í©í©ëë¤:

```
AZ-A:
  Prefill Pod â KV Cacheto AZ-Bto NIXL Transfer

AZ-B:
  Decode Pod â KV Cache receive â ëª¨ë¸is isë¯¸ toëë status
```

| Item | CRIU | llm-d NIXL |
|------|------|-----------|
| Transfer Data | entire GPU memory (1TB+) | KV Cacheonly (characterscharacters­ GB) |
| Transfer time | 15min+ | characters sec |
| Model reloading | ë¶required | required (but Decode Podis isë¯¸ toë) |
| network | 10GbE â bottleneck | RDMA/NVLink â secê³ characters |

**characterscharacters¸**: [llm-d EKS Auto Mode â Disaggregated Serving](../inference-frameworks/llm-d-eks-automode.md#disaggregated-serving-replicaë)

---

## 5. characters¤characters  Alternativeê³¼ Combination Strategy

### Alternative comparisoní

| strategy | ë³µêµ¬ time | Cost | Complexity | characters±charactersalso | recommended |
|------|---------|-----|-------|-------|:----:|
| **Warm Replica** | characters¦characters | 2Ã | Low | Production | â­â­â­ |
| **llm-d NIXL KV Offload** | 5-10min | 1Ã | Medium | GA | â­â­â­â­ |
| **vLLM Prefix Cache Warm-up** | 10-15min | 1Ã | Low | GA | â­â­â­ |
| **Karpenter do-not-evict** | - | Spot ë¶that | Low | GA | â­â­ |
| **2-replica Hot Standby** | 1-2min | 2Ã | Low | Production | â­â­â­â­â­ |
| **CRIU (ëcharacters¼ ë¸ë)** | 3-5min | 1Ã | High | Experimental | â­ |
| **CRIU (Cross-node)** | impossible | - | - | Blocked | â |

### llm-d NIXL KV Offload

llm-dof Disaggregated Servingis Prefill/Decodeto minë¦¬and, KV Cacheto NIXLto Transfer. Spot reclaim characters:

```
Prefill Pod (Spot, p5en.48xlarge):
  - Spot reclaim warning â checkpoint KV Cache to S3/FSx (characters sec)
  - Pod termination

Decode Pod (On-Demand, p5.48xlarge):
  - ê¸°characters¡´ ëª¨ë¸ ê³characters charactersë¹
  - Prefill without decodeonly charactersí (characters¼characterscharacters  TTFT characters¦that)

characters Prefill Pod:
  - KV Cacheto S3/FSxat ë³µêµ¬ (5-10sec)
  - Resume serving
```

**Advantages:**
- Decode Podis no interruption
- Prefill ë³µêµ¬only 5-10sec
- Model reloading ë¶required

**ë¨characters :**
- TTFTthat temporarily increases (Prefill Pod during recovery)

**characterscharacters¸**: [llm-d EKS Auto Mode](../inference-frameworks/llm-d-eks-automode.md)

### vLLM Prefix Cache Warm-up

vLLM v0.18+is automatic prefix caching/ support. Spot reclaim characters  characters£¼characters prefixto ë¯¸ë¦¬ characters²ë¦¬ícharacters¬ charactersºcharactersto warmupí  characters characterscharactersµëë¤:

```python
# warm-up script
prefixes = [
    "You are a helpful assistant...",
    "Analyze the following document...",
    # ... characters£¼characters characterscharacters¤í prompt
]

for prefix in prefixes:
    client.completions.create(
        model="gpt-4",
        prompt=prefix,
        max_tokens=1  # charactersµcharacters characterscharacters±with charactersºcharactersonly warmup
    )
```

**Advantages:**
- vLLM default feature, ë³also alsoêµ¬ ë¶required
- Spot reclaim after characters£¼characters prefixfast response

**ë¨characters :**
- Model reloadingis characters¬characters í 15-20min required
- entire KV Cache recovery impossible

### Karpenter do-not-evict

Karpenterof `do-not-evict` with annotation, specific Podto Spot reclaim can exclude from target:

```yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    karpenter.sh/do-not-evict: "true"
spec:
  # ... GPU Pod characters of
```

**Advantages:**
- no interruption

**ë¨characters :**
- Spot characters¸characters¤í´characters¤to On-Demanduse like â Cost ischaracters  characterscharacters¤
- AWS Spot reclaim cannot prevent itself (annotationis Karpenterof charactersë°characters  consolidationonly characters characters´)

### 2-replica Hot Standby (recommended)

Production íê²½at thatcharacters¥ Stablecharacters¸ strategyis **2replica replica operation**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-serving
spec:
  replicas: 2  # charactersµcharacters 2replica maintain
  template:
    spec:
      containers:
      - name: vllm
        # ... ëcharacters¼ ëª¨ë¸ charactersë¹
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: vllm-serving
            topologyKey: kubernetes.io/hostname  # different ë¸ëto Ãcharacters¹
```

**Cost:**
- 2ë operation characters Cost 2Ã â Spot when using **On-Demand 1similar to Cost**
- p5.48xlarge Spot $12/hr Ã 2 = $24/hr vs On-Demand $98/hr Ã 1

**Advantages:**
- 1replica replica Spot reclaim remaining when 1replicahandles traffic
- during recovery charactersë¹characters¤ no interruption
- throughput via load balancing 2Ã

**ë¨characters :**
- GPU 2Ã usage (but Spotwith On-Demand 1level Cost)

### Combination Strategy

The realistic optimal configuration is **2-replica Hot Standby + llm-d NIXL**:

```
âââââââââââââââââââââââ
â llm-d Gateway       â
â (KV Cache-aware LB) â
ââââââââââââ¬âââââââââââ
           â
    ââââââââ´ââââââââ
    â              â
âââââ¼ââââ      âââââ¼ââââ
âReplicaâ      âReplicaâ
â   1   â      â   2   â
â Spot  â      â Spot  â
âp5.48x â      âp5.48x â
âââââââââ      âââââââââ
  different AZ        different AZ

Replica 1 Spot reclaim:
  â llm-dthat Replica 2switch traffic to
  â KV Cacheis NIXLto share (required characters)
  â Replica 1 ë³µêµ¬ (15min) characters¤charactersalso charactersë¹characters¤ characters characters
```

**Advantages:**
- no service interruption
- KV Cache characters¬usagewith TTFT reduction
- Spot ícharacters©with Cost í¨characters¨characters 

---

## 6. Roadmap and Validation Points

### CNCF/Kubernetes Community Trends

| Period | Major Milestone | status |
|------|-----------|------|
| K8s 1.30 | ContainerCheckpoint API alpha | Completed (2024.04) |
| K8s 1.32 | ContainerCheckpoint API beta | expected (2024.12) |
| K8s 1.34 | ContainerCheckpoint API GA | expected (2025.08) |
| K8s 1.35 | GPU checkpoint official support | í¬ë§ (2026.02) |
| **2026.04** | **ícharacters¬ characterscharacters¹** | **Alpha/Beta Mixed** |

:::info CNCF WG Activity
CNCF Batch Working Groupê³¼ AI Working Groupat GPU checkpointto ë¼of characters¤is. However official KEPthe does not exist yet, nvidia-container-toolkitof Experimental êµ¬íonly characters¡´characters¬.
:::

### Self-validation characters²´í¬ë¦¬characters¤í¸

CRIU GPU checkpointto characters¤ííë ¤ë©´ ë¤characters characters²´í¬ë¦¬characters¤í¸to ícharacters¸ícharacters¸characters:

#### Infrastructure Requirements

- [ ] **EKS Standard Mode** â Auto Modeis feature gate cannot control
- [ ] **K8s 1.30+** â ContainerCheckpoint API required
- [ ] **kubelet feature gate** â `ContainerCheckpoint=true`
- [ ] **GPU Driver R580+** â cuda-checkpoint í¸í Version
- [ ] **Custom AMI** â driver Version Fixed required
- [ ] **EFS/FSx mount** â checkpoint ícharacters¼ save (HDDis ëë¦¼, SSD recommended)

#### Software Stack

- [ ] **runc v1.2+** â CRIU integration Version
- [ ] **CRIU v4.0+** â GPU support build
- [ ] **cuda-checkpoint beta** â NVIDIA Labsat ë¤characters´ë¡ë
- [ ] **nvidia-container-toolkit v1.17+** â CR plugin enable
- [ ] **ëcharacters¼ CUDA Version** â checkpoint/restore ë¸ë characters¼characters¹

#### ë¸ë Configuration

- [ ] **NodePool ë¨characters¼ instance type** â Heterogeneous ë¶that
- [ ] **ë¨characters¼ AZ** â Cross-AZ ë¶that
- [ ] **GPU UUID collect** â characters¬characters  ë§¤í table create
- [ ] **NVLink topology characters¼characters¹** â Multi-GPU characters required

#### test Scenario

1. **ëcharacters¼ ë¸ë restart test** (Low Risk)
   - test Pod checkpoint/restore
   - ëª¨ë¸ loading time vs checkpoint time comparison
   - memory integrity verification (inference result consistency)

2. **ëcharacters¼ instance type migrate test** (High Risk)
   - GPU UUID manual mapping
   - checkpoint network Transfer
   - restore success rate measurement
   - on failure fallback procedure verification

3. **Spot reclaim simulation** (Production Readiness)
   - 2min forced with timer checkpoint
   - ë³µêµ¬ time measurement
   - SLA charactersí¥ mincharacters

### verification on failure Action

| Failure Type | Action |
|---------|------|
| checkpoint characterscharacters± characters¤í¨ | cuda-checkpoint check logs, GPU driver Version verification |
| restore characters¤í¨ (GPU UUID mismatch) | ëcharacters¼ ë¸ëë¡only restore, NodePool redesign |
| restore characters¤í¨ (CUDA Version mismatch) | AMI Version Fixed, driver update prohibit |
| Spot reclaim 2min within ë¯¸Completed | checkpoint Size reduce, network ëcharacters­í­ expand, ëis CRIU abandon |
| performance degradation | CRIU overhead measurement, warm-up time consider |

---

## References

- **CRIU official ë¬¸characters**: [criu.org](https://criu.org/)
- **NVIDIA cuda-checkpoint GitHub**: [github.com/NVIDIA/cuda-checkpoint](https://github.com/NVIDIA/cuda-checkpoint)
- **K8s KEP-2008**: [ContainerCheckpoint API](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/2008-forensic-container-checkpointing)
- **nvidia-container-toolkit CR plugin**: [NVIDIA Container Toolkit Docs](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/)
- **llm-d NIXL**: [llm-d GitHub](https://github.com/llm-d/llm-d) â KV Cache network Transfer Alternative

## Related Documents

- [EKS GPU ë¸ë strategy](./eks-gpu-node-strategy.md) â Spot/On-Demand strategy, Cost charactersµcharacters í
- [GPU ë¦¬characterscharacters¤ management](./gpu-resource-management.md) â Karpenter characters¤í characters¤characters¼characters¼ë§
- [llm-d EKS Auto Mode](../inference-frameworks/llm-d-eks-automode.md) â Disaggregated Serving + NIXL KV Offload
- [vLLM ëª¨ë¸ charactersë¹](../inference-frameworks/vllm-model-serving.md) â Prefix Cache, KV Cache management
