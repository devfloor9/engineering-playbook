---
title: "NeMo Framework"
sidebar_label: "8. NeMo Framework"
description: "Building LLM fine-tuning and optimization pipelines with NVIDIA NeMo"
sidebar_position: 8
tags:
  - nemo
  - nvidia
  - fine-tuning
  - llm
  - training
  - tensorrt
  - genai
last_update:
  date: 2026-02-14
  author: devfloor9
category: "genai-aiml"
---

import { NemoComponents, GPURequirements, CheckpointSharding, MonitoringMetrics, NCCLImportance } from '@site/src/components/NemoTables';

# NeMo Framework

NVIDIA NeMo is an end-to-end framework for training, fine-tuning, and optimizing large language models (LLMs). It supports distributed training and efficient model deployment in Kubernetes environments.

## Overview

### Why NeMo is Needed

When domain-specialized models are required for the Agentic AI platform:

- **Domain Adaptation**: Customize models for specific industries/fields
- **Performance Optimization**: Inference acceleration through TensorRT-LLM
- **Cost Efficiency**: Replace large models with smaller fine-tuned models
- **Data Privacy**: Train on-premises with sensitive data

```mermaid
graph LR
    subgraph "NeMo Pipeline"
        Data["Data Preparation"]
        Pretrain["Pretraining<br/>(Optional)"]
        Finetune["Fine-tuning"]
        Eval["Evaluation"]
        Export["TensorRT Conversion"]
        Deploy["Deployment"]
    end

    Data --> Pretrain
    Pretrain --> Finetune
    Data --> Finetune
    Finetune --> Eval
    Eval --> Export
    Export --> Deploy

    style Finetune fill:#76b900,stroke:#333,stroke-width:2px
    style Export fill:#76b900,stroke:#333,stroke-width:2px
```

### NeMo Framework Components

<NemoComponents />

## EKS Deployment Architecture

### Distributed Training Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        Launcher["NeMo Launcher"]
        Scheduler["Kubernetes Scheduler"]
    end

    subgraph "Worker Nodes"
        subgraph "Node 1"
            W1["Worker Pod"]
            G1["GPU 0-7"]
        end
        subgraph "Node 2"
            W2["Worker Pod"]
            G2["GPU 0-7"]
        end
        subgraph "Node 3"
            W3["Worker Pod"]
            G3["GPU 0-7"]
        end
    end

    subgraph "Storage"
        S3["S3 / FSx"]
        Checkpoint["Checkpoints"]
    end

    subgraph "Communication"
        NCCL["NCCL / EFA"]
    end

    Launcher --> Scheduler
    Scheduler --> W1
    Scheduler --> W2
    Scheduler --> W3

    W1 <--> NCCL
    W2 <--> NCCL
    W3 <--> NCCL

    W1 --> S3
    W2 --> S3
    W3 --> S3

    W1 --> Checkpoint
    W2 --> Checkpoint
    W3 --> Checkpoint

    style Launcher fill:#76b900,stroke:#333
    style NCCL fill:#4285f4,stroke:#333
```

### GPU Node Requirements

<GPURequirements />

## NeMo Container Deployment

### Helm Chart Installation

```bash
# Authenticate with NVIDIA NGC registry
kubectl create secret docker-registry ngc-secret \
  --docker-server=nvcr.io \
  --docker-username='$oauthtoken' \
  --docker-password=${NGC_API_KEY} \
  --namespace=nemo

# Install NeMo Operator
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install nemo-operator nvidia/nemo-operator \
  --namespace nemo \
  --create-namespace \
  --set operator.image.repository=nvcr.io/nvidia/nemo-operator \
  --set operator.image.tag=24.07
```

### NeMo Training Job Definition

```yaml
apiVersion: nemo.nvidia.com/v1alpha1
kind: NeMoTraining
metadata:
  name: llama-finetune
  namespace: nemo
spec:
  # Model configuration
  model:
    name: "meta-llama/Llama-2-7b-hf"
    source: "huggingface"

  # Training configuration
  training:
    type: "sft"  # supervised fine-tuning
    epochs: 3
    batchSize: 4
    gradientAccumulationSteps: 8
    learningRate: 2e-5

    # Distributed training configuration
    distributed:
      tensorParallelism: 1
      pipelineParallelism: 1
      dataParallelism: 8

  # Data configuration
  data:
    trainDataset: "s3://nemo-data/train.jsonl"
    valDataset: "s3://nemo-data/val.jsonl"
    format: "jsonl"

  # Resource configuration
  resources:
    nodes: 1
    gpusPerNode: 8
    gpuType: "nvidia.com/gpu"

  # Checkpoint configuration
  checkpoint:
    enabled: true
    path: "s3://nemo-checkpoints/llama-finetune"
    saveInterval: 500

  # Container image
  image:
    repository: "nvcr.io/nvidia/nemo"
    tag: "24.07"
    pullSecrets:
      - name: ngc-secret
```

### Distributed Training with PyTorchJob

```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: nemo-distributed-training
  namespace: nemo
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: nvcr.io/nvidia/nemo:24.07
            command:
            - python
            - -m
            - nemo.collections.llm.recipes.finetune
            - --config-path=/config
            - --config-name=llama_finetune
            env:
            - name: NCCL_DEBUG
              value: "INFO"
            - name: NCCL_IB_DISABLE
              value: "0"
            resources:
              limits:
                nvidia.com/gpu: 8
                vpc.amazonaws.com/efa: 4
            volumeMounts:
            - name: config
              mountPath: /config
            - name: data
              mountPath: /data
            - name: shm
              mountPath: /dev/shm
          volumes:
          - name: config
            configMap:
              name: nemo-config
          - name: data
            persistentVolumeClaim:
              claimName: training-data-pvc
          - name: shm
            emptyDir:
              medium: Memory
              sizeLimit: 64Gi
    Worker:
      replicas: 3
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: nvcr.io/nvidia/nemo:24.07
            # Worker configuration same as Master
```

## Fine-Tuning Guide

### SFT (Supervised Fine-Tuning)

```python
# nemo_sft_config.yaml
trainer:
  devices: 8
  num_nodes: 1
  accelerator: gpu
  precision: bf16
  max_epochs: 3
  val_check_interval: 500

model:
  # Base model
  restore_from_path: /models/llama-2-7b.nemo

  # LoRA configuration (efficient fine-tuning)
  peft:
    peft_scheme: "lora"
    lora_tuning:
      adapter_dim: 32
      alpha: 32
      dropout: 0.1
      target_modules:
        - "q_proj"
        - "v_proj"
        - "k_proj"
        - "o_proj"

  # Data configuration
  data:
    train_ds:
      file_path: /data/train.jsonl
      micro_batch_size: 4
      global_batch_size: 32
    validation_ds:
      file_path: /data/val.jsonl
      micro_batch_size: 4

  # Optimizer configuration
  optim:
    name: fused_adam
    lr: 2e-5
    weight_decay: 0.01
    betas:
      - 0.9
      - 0.98
```

### Data Format

```json
{"input": "Answer the following question: What is EKS?", "output": "Amazon EKS (Elastic Kubernetes Service) is a managed Kubernetes service provided by AWS."}
{"input": "Explain the key features of Karpenter.", "output": "Karpenter provides automatic node provisioning, consolidation, and drift detection features for Kubernetes node auto-scaling."}
```

### PEFT/LoRA Fine-Tuning

```python
from nemo.collections.llm import finetune
from nemo.collections.llm.peft import LoRA

# LoRA configuration
lora_config = LoRA(
    r=32,
    alpha=32,
    dropout=0.1,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
)

# Run fine-tuning
model = finetune(
    model_path="/models/llama-2-7b.nemo",
    data_path="/data/train.jsonl",
    peft_config=lora_config,
    trainer_config={
        "devices": 8,
        "max_epochs": 3,
        "precision": "bf16",
    },
    output_path="/output/llama-2-7b-finetuned",
)
```

## Checkpoint Management

### S3 Checkpoint Saving

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nemo-checkpoint-config
  namespace: nemo
data:
  checkpoint.yaml: |
    checkpoint:
      save_dir: "s3://nemo-checkpoints/${JOB_NAME}"
      save_top_k: 3
      save_last: true
      save_interval: 500

      # Auto-recovery configuration
      resume:
        enabled: true
        resume_from_checkpoint: "auto"  # Auto-resume from latest checkpoint
```

### Checkpoint Conversion

```bash
# Convert NeMo checkpoint to HuggingFace format
python -m nemo.collections.llm.scripts.convert_nemo_to_hf \
  --input_path /checkpoints/llama-finetuned.nemo \
  --output_path /models/llama-finetuned-hf \
  --model_type llama
```

## TensorRT-LLM Conversion and Optimization

### Model Conversion Pipeline

```mermaid
graph LR
    NeMo["NeMo<br/>Checkpoint"]
    HF["HuggingFace<br/>Format"]
    TRT["TensorRT-LLM<br/>Engine"]
    Triton["Triton<br/>Server"]

    NeMo --> HF
    HF --> TRT
    TRT --> Triton

    style TRT fill:#76b900,stroke:#333,stroke-width:2px
```

### TensorRT-LLM Conversion Script

```python
# convert_to_trt.py
from tensorrt_llm import LLM, SamplingParams
from tensorrt_llm.builder import BuildConfig

# Build configuration
build_config = BuildConfig(
    max_input_len=4096,
    max_output_len=2048,
    max_batch_size=64,

    # Quantization configuration
    quantization="fp8",  # FP8 quantization for memory savings

    # Optimization configuration
    use_paged_kv_cache=True,
    use_inflight_batching=True,
)

# Model conversion
llm = LLM(
    model="/models/llama-finetuned-hf",
    build_config=build_config,
)

# Save engine
llm.save("/engines/llama-finetuned-trt")
```

### Run Conversion with Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: trt-llm-conversion
  namespace: nemo
spec:
  template:
    spec:
      containers:
      - name: converter
        image: nvcr.io/nvidia/tritonserver:24.07-trtllm-python-py3
        command:
        - python
        - /scripts/convert_to_trt.py
        - --input=/models/llama-finetuned-hf
        - --output=/engines/llama-finetuned-trt
        - --quantization=fp8
        - --max-batch-size=64
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "80Gi"
        volumeMounts:
        - name: models
          mountPath: /models
        - name: engines
          mountPath: /engines
        - name: scripts
          mountPath: /scripts
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: models-pvc
      - name: engines
        persistentVolumeClaim:
          claimName: engines-pvc
      - name: scripts
        configMap:
          name: conversion-scripts
      restartPolicy: Never
```

## Triton Inference Server Deployment

### TensorRT-LLM Backend Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: triton-trtllm
  namespace: inference
spec:
  replicas: 2
  selector:
    matchLabels:
      app: triton-trtllm
  template:
    metadata:
      labels:
        app: triton-trtllm
    spec:
      containers:
      - name: triton
        image: nvcr.io/nvidia/tritonserver:24.07-trtllm-python-py3
        args:
        - tritonserver
        - --model-repository=/models
        - --http-port=8000
        - --grpc-port=8001
        - --metrics-port=8002
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 8001
          name: grpc
        - containerPort: 8002
          name: metrics
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "80Gi"
        volumeMounts:
        - name: model-repository
          mountPath: /models
      volumes:
      - name: model-repository
        persistentVolumeClaim:
          claimName: triton-models-pvc
```

### Model Repository Structure

```
/models/
└── llama-finetuned/
    ├── config.pbtxt
    ├── 1/
    │   └── model.plan
    └── tokenizer/
        ├── tokenizer.json
        └── tokenizer_config.json
```

### config.pbtxt Configuration

```protobuf
name: "llama-finetuned"
backend: "tensorrtllm"
max_batch_size: 64

input [
  {
    name: "input_ids"
    data_type: TYPE_INT32
    dims: [-1]
  },
  {
    name: "input_lengths"
    data_type: TYPE_INT32
    dims: [1]
  }
]

output [
  {
    name: "output_ids"
    data_type: TYPE_INT32
    dims: [-1]
  }
]

instance_group [
  {
    count: 1
    kind: KIND_GPU
    gpus: [0]
  }
]

parameters {
  key: "max_tokens_in_paged_kv_cache"
  value: { string_value: "8192" }
}

parameters {
  key: "batch_scheduler_policy"
  value: { string_value: "inflight_fused_batching" }
}
```

## Monitoring and Logging

### Training Metrics Collection

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: nemo-training-monitor
  namespace: nemo
spec:
  selector:
    matchLabels:
      app: nemo-training
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### Key Monitoring Metrics

<MonitoringMetrics />

---

## Deep Dive: NCCL for Distributed Training

### Role and Importance of NCCL

NCCL (**NVIDIA Collective Communication Library**) is the core library responsible for **high-speed communication between multi-GPUs** in distributed GPU training. The performance of deep learning models is directly affected by the degree of NCCL optimization.

```mermaid
graph TB
    subgraph "Distributed Training Performance Analysis"
        A["Total Training Time"] --> B["Computation Time 60%"]
        A --> C["Communication Time 40%"]

        C --> D["Area NCCL Optimizes"]
        D --> E["Collective Operation Time"]
        E --> F["Synchronization Overhead"]

        B --> G["GPU Computation (Kernels)"]

        style D fill:#326ce5
        style E fill:#76b900
        style F fill:#ff6b6b
    end

    subgraph "Problems NCCL Solves"
        H["3-10x Improvement<br/>vs Raw Network"]
        I["CPU Overhead Elimination"]
        J["GPU Memory Efficiency"]
        K["Automatic NVLink/EFA Usage"]
    end
```

**Why NCCL is Critical in Distributed Training:**

<NCCLImportance />

### Core Collective Operations

#### 1. AllReduce - The Most Important Operation

AllReduce sums data from all GPUs and distributes the result to all GPUs:

```
Initial State:
GPU 0: [1, 2, 3]
GPU 1: [4, 5, 6]
GPU 2: [7, 8, 9]
GPU 3: [10, 11, 12]

After AllReduce:
GPU 0: [22, 26, 30]  # 1+4+7+10, 2+5+8+11, 3+6+9+12
GPU 1: [22, 26, 30]
GPU 2: [22, 26, 30]
GPU 3: [22, 26, 30]
```

**AllReduce Usage Example (in Distributed Training):**

```python
import torch
import torch.distributed as dist

# Initialize distributed training
dist.init_process_group("nccl")
rank = dist.get_rank()
world_size = dist.get_world_size()

# Each GPU's gradients (different from each other)
gradients = torch.randn(1024, device=f"cuda:{rank}")

# AllReduce: Sum and average gradients from all GPUs
dist.all_reduce(gradients, op=dist.ReduceOp.SUM)
gradients /= world_size

# Now all GPUs have identical gradients
# Model weights are synchronized when updating
```

#### 2. AllGather - Collect All Data

AllGather collects data from all GPUs and distributes the complete dataset to each GPU:

```
Initial State:
GPU 0: [1, 2]
GPU 1: [3, 4]
GPU 2: [5, 6]
GPU 3: [7, 8]

After AllGather:
GPU 0: [1, 2, 3, 4, 5, 6, 7, 8]
GPU 1: [1, 2, 3, 4, 5, 6, 7, 8]
GPU 2: [1, 2, 3, 4, 5, 6, 7, 8]
GPU 3: [1, 2, 3, 4, 5, 6, 7, 8]
```

**AllGather Use Cases:**

```python
# Example: Collecting statistics from all GPUs in batch normalization
local_batch_stats = compute_batch_stats(local_batch)

# AllGather to collect statistics from all GPUs
all_batch_stats = [torch.empty_like(local_batch_stats) for _ in range(world_size)]
dist.all_gather(all_batch_stats, local_batch_stats)

# Compute global statistics
global_mean = torch.stack(all_batch_stats).mean(dim=0)
global_std = torch.stack(all_batch_stats).std(dim=0)
```

#### 3. ReduceScatter - Inverse of AllGather

ReduceScatter first sums data, then partitions and distributes to each GPU:

```
Initial State:
GPU 0: [1, 2, 3, 4, 5, 6, 7, 8]
GPU 1: [9, 10, 11, 12, 13, 14, 15, 16]
GPU 2: [17, 18, 19, 20, 21, 22, 23, 24]
GPU 3: [25, 26, 27, 28, 29, 30, 31, 32]

After ReduceScatter sum and partition:
GPU 0: [52, 56]      # (1+9+17+25), (2+10+18+26)
GPU 1: [60, 64]      # (3+11+19+27), (4+12+20+28)
GPU 2: [68, 72]      # (5+13+21+29), (6+14+22+30)
GPU 3: [76, 80]      # (7+15+23+31), (8+16+24+32)
```

**ReduceScatter Use Case (Model Parallelism):**

```python
# Sum and partition computation results in model parallelism
local_output = model_fragment(input_data)

# ReduceScatter: Sum all fragments then partition to each GPU
reduced_output = torch.empty(output_size // world_size, device=local_output.device)
dist.reduce_scatter(reduced_output, [local_output] * world_size)
```

#### 4. Broadcast - Data Distribution

Broadcast copies data from one GPU to all GPUs:

```
Initial State:
GPU 0: [1, 2, 3, 4]
GPU 1: [0, 0, 0, 0]
GPU 2: [0, 0, 0, 0]
GPU 3: [0, 0, 0, 0]

After Broadcast:
GPU 0: [1, 2, 3, 4]
GPU 1: [1, 2, 3, 4]
GPU 2: [1, 2, 3, 4]
GPU 3: [1, 2, 3, 4]
```

**Broadcast Use Case:**

```python
# Broadcast model checkpoint from master GPU
model_state = load_checkpoint() if rank == 0 else None

# Broadcast: Distribute master GPU's model state to all GPUs
dist.broadcast_object_list([model_state], src=0)
model.load_state_dict(model_state)
```

### Network Topology Awareness

NCCL automatically detects the physical connection topology between GPUs and selects the optimal path:

```mermaid
graph TB
    subgraph "Topology Hierarchy (Faster from Top to Bottom)"
        L1["1. NVSwitch (Within Same Node)<br/>Up to 600GB/s"]
        L2["2. NVLink (Within Same Node)<br/>Up to 200GB/s"]
        L3["3. EFA/InfiniBand (Between Nodes)<br/>Up to 100GB/s"]
        L4["4. Ethernet (Between Nodes)<br/>Up to 10-100GB/s"]
    end

    L1 --> L2 --> L3 --> L4

    subgraph "NCCL Automatic Path Selection"
        A["Topology Analysis"] --> B["Optimal Algorithm Selection"]
        B --> C["Channel Configuration"]
    end

    style L1 fill:#76b900
    style L2 fill:#76b900
    style L3 fill:#4ecdc4
    style L4 fill:#ff6b6b
```

### NCCL Performance Tuning Parameters

```yaml
# Complete Guide to NCCL Environment Variables

# 1. Algorithm Selection
export NCCL_ALGO=Ring           # Ring (default), Tree, CollNet
export NCCL_ALGO_ALL=Ring       # Specify AllReduce algorithm
export NCCL_ALGO_TREE=Tree      # Force Tree algorithm

# 2. Protocol Selection
export NCCL_PROTO=Simple        # Simple (default) or LL (Low Latency)

# 3. Channel Settings (Very Important)
export NCCL_MIN_NCHANNELS=4     # Minimum channels (default 4)
export NCCL_MAX_NCHANNELS=8     # Maximum channels (default 32)

# 4. Buffer Size
export NCCL_BUFFSIZE=2097152    # Default 2MB, 1MB-4MB recommended

# 5. Debug Settings
export NCCL_DEBUG=INFO          # TRACE, DEBUG, INFO, WARN
export NCCL_DEBUG_FILE=/var/log/nccl-debug.txt
export NCCL_DEBUG_SUBSYS=ALL    # Trace all subsystems

# 6. Network Interface
export NCCL_SOCKET_IFNAME=eth0  # Network interface to use
export NCCL_IB_DISABLE=0        # Use InfiniBand

# 7. EFA Settings (AWS)
export FI_PROVIDER=efa
export FI_EFA_USE_DEVICE_RDMA=1
export FI_EFA_FORK_SAFE=1

# 8. Kernel Optimization
export NCCL_CHECKS_DISABLE=0    # Enable safety checks (production)
export NCCL_COMM_BLOCKING_WAIT=0
export NCCL_ASYNC_ERROR_HANDLING=1

# 9. P2P Settings
export NCCL_P2P_DISABLE=0       # Enable GPU P2P communication
export NCCL_P2P_LEVEL=SYS       # P2P level: LOC (local), SYS (system)

# 10. Timeout Settings
export NCCL_COMM_WAIT_TIMEOUT=0 # 0 = infinite wait
```

### Kubernetes Integration Points

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

> 📅 **Written**: 2026-02-13 | **Last Modified**: 2026-02-14 | ⏱️ **Reading Time**: ~3 min


<Tabs>
<TabItem value="config" label="NCCL Configuration" default>

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: distributed-training
spec:
  containers:
  - name: trainer
    image: nvcr.io/nvidia/pytorch:24.01-py3
    env:
    # NCCL Core Settings
    - name: NCCL_DEBUG
      value: "INFO"  # Enable NCCL logging
    - name: NCCL_DEBUG_SUBSYS
      value: "INIT,GRAPH,ENV"

    # Network Interface Selection
    - name: NCCL_SOCKET_IFNAME
      value: "eth0"  # Primary network interface
    - name: NCCL_IB_DISABLE
      value: "0"  # Enable InfiniBand if available

    # Performance Tuning
    - name: NCCL_NET_GDR_LEVEL
      value: "5"  # GPUDirect RDMA level
    - name: NCCL_P2P_LEVEL
      value: "NVL"  # Use NVLink for P2P
    - name: NCCL_CROSS_NIC
      value: "1"  # Use multiple NICs

    # EFA-specific (AWS)
    - name: FI_PROVIDER
      value: "efa"
    - name: FI_EFA_USE_DEVICE_RDMA
      value: "1"
    - name: NCCL_PROTO
      value: "simple"

    resources:
      limits:
        nvidia.com/gpu: 8
```

</TabItem>
<TabItem value="topology" label="Topology Detection">

```yaml
# ConfigMap with NCCL topology information
apiVersion: v1
kind: ConfigMap
metadata:
  name: nccl-topology
data:
  topology.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <system version="1">
      <gpu dev="0" numa="0" pci="0000:10:1c.0">
        <nvlink target="1" count="12"/>
        <nvlink target="2" count="12"/>
        <nvlink target="3" count="12"/>
      </gpu>
      <gpu dev="1" numa="0" pci="0000:10:1d.0">
        <nvlink target="0" count="12"/>
        <nvlink target="2" count="12"/>
        <nvlink target="3" count="12"/>
      </gpu>
      <!-- Additional GPUs... -->
    </system>
---
apiVersion: v1
kind: Pod
metadata:
  name: training-with-topology
spec:
  containers:
  - name: trainer
    volumeMounts:
    - name: nccl-topology
      mountPath: /etc/nccl
    env:
    - name: NCCL_TOPO_FILE
      value: /etc/nccl/topology.xml
  volumes:
  - name: nccl-topology
    configMap:
      name: nccl-topology
```

</TabItem>
<TabItem value="benchmark" label="NCCL Benchmark">

```yaml
# NCCL Tests DaemonSet for network validation
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nccl-tests
  namespace: gpu-testing
spec:
  selector:
    matchLabels:
      app: nccl-tests
  template:
    metadata:
      labels:
        app: nccl-tests
    spec:
      hostNetwork: true  # Access host network
      containers:
      - name: nccl-test
        image: nvcr.io/nvidia/pytorch:24.01-py3
        command:
        - /bin/bash
        - -c
        - |
          # Install NCCL tests
          git clone https://github.com/NVIDIA/nccl-tests.git
          cd nccl-tests
          make MPI=1

          # Run all-reduce benchmark
          mpirun --allow-run-as-root \
            -np 8 \
            --hostfile /etc/mpi/hostfile \
            --bind-to none \
            -x NCCL_DEBUG=INFO \
            -x NCCL_SOCKET_IFNAME=eth0 \
            ./build/all_reduce_perf -b 8 -e 4G -f 2 -g 1
        resources:
          limits:
            nvidia.com/gpu: 8
        volumeMounts:
        - name: dshm
          mountPath: /dev/shm
      volumes:
      - name: dshm
        emptyDir:
          medium: Memory
          sizeLimit: 64Gi
```

</TabItem>
</Tabs>

**NCCL Performance Factors:**

1. **Network Bandwidth**: InfiniBand (200-400 Gbps) > EFA (100 Gbps) > Ethernet (25-100 Gbps)
2. **GPU Interconnect**: NVLink (600 GB/s) > PCIe 5.0 (128 GB/s)
3. **Topology Awareness**: Direct connections reduce latency
4. **Protocol Selection**: `simple` for small messages, `LL128` for large

---

## Related Documentation

- [GPU Resource Management](./gpu-resource-management.md)
- [MoE Model Serving](./moe-model-serving.md)
- [Inference Gateway](./inference-gateway-routing.md)

:::tip Recommendations

- Measure baseline performance with the base model before fine-tuning
- LoRA/QLoRA enables fine-tuning large models with limited GPU resources
- TensorRT-LLM conversion can improve inference performance by 2-4x
- NCCL tuning is critical for distributed training performance - start with `NCCL_DEBUG=INFO` to understand communication patterns
:::

:::warning Cautions

- Large-scale training incurs significant GPU costs. Utilize spot instances and checkpoints
- Consider NCCL communication overhead when deciding on number of nodes for distributed training
- Always save checkpoints to persistent storage like S3
- Improper NCCL configuration can degrade performance by 50%+ - always validate with NCCL tests
:::
