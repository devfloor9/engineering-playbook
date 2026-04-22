---
title: "GRPO/DPO Training Job"
sidebar_label: "GRPO/DPO Training"
description: "Production configuration for running NeMo-RL (GRPO) and TRL (DPO) training jobs with labeled preference datasets on Karpenter Spot node pools and Volcano Gang Scheduling."
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 8
tags:
  - continuous-training
  - grpo
  - dpo
  - training
  - nemo
  - trl
  - scope:impl
sidebar_position: 3
---

## Overview

This document covers the stage 3 **Preference Tuning** implementation of the Continuous Training Pipeline. It takes the labeled trace dataset (with `final_reward` column) from the previous stage and fine-tunes the model using NeMo-RL-based GRPO or TRL-based DPO. Karpenter Spot node pools and Volcano Gang Scheduling minimize GPU costs and idle time.

## GRPO vs DPO Concepts

### GRPO (Group Relative Policy Optimization)

**GRPO** ranks multiple responses to the same prompt by reward and learns from the relative ordering.

```
Prompt: "What are the advantages of EKS Auto Mode?"

Response A (reward=0.9): "AWS fully manages nodes, reducing operational burden..."
Response B (reward=0.6): "Auto Mode is convenient..."
Response C (reward=0.3): "I don't know."

Training: Policy optimization with ranking A > B > C
```

**Advantages:**

- Learns **relative ranking** instead of absolute scores → robust to labeling noise
- Generates multiple responses per prompt → data-efficient
- Simpler than RLHF (no separate reward model training required)

### DPO (Direct Preference Optimization)

**DPO** directly learns from preferred/non-preferred pairs.

```
Prompt: "What are Karpenter's main features?"

Preferred (reward >= 0.7):
"Karpenter provides automatic node provisioning, bin-packing optimization..."

Non-preferred (reward < 0.5):
"Karpenter is a scaling tool." (too short)

Training: Increase probability of preferred responses ↑, decrease non-preferred ↓
```

**Advantages:**

- Trains with **single loss** without separate Value Function like RLHF
- Stable training (simpler hyperparameter tuning than PPO)
- Many production use cases (Llama 3.1, Claude 3, etc.)

### Selection Criteria

| Situation | Recommended Method | Reason |
|-----------|-------------------|--------|
| **Can generate diverse responses** | GRPO | Higher data efficiency through ranking |
| **Clear preferred/non-preferred distinction** | DPO | Simple and stable |
| **High labeling noise** | GRPO | Relative ranking more robust than absolute scores |
| **Rapid prototyping** | DPO | Simple hyperparameter tuning |

## NeMo-RL-based GRPO Training

[NeMo Framework](../../../model-serving/inference-frameworks/nemo-framework.md) is NVIDIA's large-scale model training framework.

```python
# nemo_grpo_training.py
from nemo.collections.llm import GRPO, GPTModel
from nemo.collections.nlp.data import PreferenceDataset

# Load training data
dataset = PreferenceDataset(
    data_path='s3://training-data-lake/labeled-dataset/',
    reward_column='final_reward',
    min_reward_threshold=0.5,  # Exclude below 0.5
)

# Load base model
model = GPTModel.from_pretrained('glm-5-32b')

# GRPO configuration
grpo_config = GRPO(
    num_iterations=1000,
    batch_size=32,
    learning_rate=1e-5,
    kl_coeff=0.1,  # KL divergence penalty (prevent deviation from base model)
    cliprange=0.2,
    vf_coeff=0.5,
)

# Distributed training execution
trainer = Trainer(
    devices=8,  # 8 H100s
    num_nodes=3,  # 3 nodes = 24 GPUs
    precision='bf16',
    strategy='fsdp',  # Fully Sharded Data Parallel
)

trainer.fit(model, grpo_config, dataset)
```

## TRL-based DPO Training

[TRL (Transformer Reinforcement Learning)](https://github.com/huggingface/trl) is HuggingFace's RLHF library.

```python
# trl_dpo_training.py
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

# Load model
model = AutoModelForCausalLM.from_pretrained('glm-5-32b', torch_dtype='bfloat16')
tokenizer = AutoTokenizer.from_pretrained('glm-5-32b')

# Prepare preferred/non-preferred dataset
def format_dpo_dataset(example):
    """Separate preferred/non-preferred by reward"""
    if example['final_reward'] >= 0.7:
        return {
            'prompt': example['input'],
            'chosen': example['output'],
            'rejected': None,  # Non-preferred examples matched separately
        }
    else:
        return None

dataset = load_dataset('parquet', data_files='s3://training-data-lake/labeled-dataset/*.parquet')
dpo_dataset = dataset.map(format_dpo_dataset).filter(lambda x: x is not None)

# DPO training configuration
training_args = DPOConfig(
    output_dir='/output/glm-5-dpo',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    max_length=4096,
    beta=0.1,  # DPO temperature (higher emphasizes preference differences)
    num_train_epochs=1,
    bf16=True,
    logging_steps=10,
    save_strategy='steps',
    save_steps=100,
)

# Execute training
trainer = DPOTrainer(
    model=model,
    args=training_args,
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)

trainer.train()
```

## Kubernetes Job YAML

```yaml
# grpo-training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: grpo-training-glm5
  namespace: training-pipeline
spec:
  parallelism: 3  # 3-node parallel execution
  completions: 1
  template:
    metadata:
      labels:
        app: grpo-training
        karpenter.sh/capacity-type: spot  # Use Spot instances
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge  # 8 H200s
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        operator: Equal
        value: spot
        effect: NoSchedule
      
      volumes:
      - name: checkpoint-storage
        persistentVolumeClaim:
          claimName: training-checkpoints
      
      containers:
      - name: nemo-trainer
        image: nvcr.io/nvidia/nemo:26.02
        command:
        - python
        - /workspace/nemo_grpo_training.py
        args:
        - --data-path=s3://training-data-lake/labeled-dataset/
        - --output-path=/checkpoints/grpo-run-001
        - --num-nodes=3
        - --devices=8
        volumeMounts:
        - name: checkpoint-storage
          mountPath: /checkpoints
        resources:
          requests:
            nvidia.com/gpu: 8
            memory: 1600Gi  # H200 141GB × 8 + overhead
          limits:
            nvidia.com/gpu: 8
            memory: 1600Gi
        env:
        - name: NCCL_DEBUG
          value: "INFO"
        - name: NCCL_MIN_NCHANNELS
          value: "16"
        - name: FI_PROVIDER
          value: "efa"
        - name: FI_EFA_USE_DEVICE_RDMA
          value: "1"
      
      restartPolicy: OnFailure
---
# Karpenter NodePool - Spot instances
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: training-spot-pool
spec:
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 5m
  template:
    spec:
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot"]
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["p5en.48xlarge"]
      - key: topology.kubernetes.io/zone
        operator: In
        values: ["us-east-2a", "us-east-2b"]
      
      nodeClassRef:
        name: training-gpu-class
      
      taints:
      - key: nvidia.com/gpu
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        value: spot
        effect: NoSchedule
```

### Volcano Batch Scheduling

[Volcano](https://volcano.sh/) is a batch scheduler for AI/ML workloads. Gang Scheduling waits until all nodes are ready before starting execution simultaneously.

```yaml
# volcano-job.yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: grpo-training-volcano
spec:
  minAvailable: 3  # Wait until all 3 nodes are ready
  schedulerName: volcano
  queue: training-queue
  tasks:
  - name: trainer
    replicas: 3
    template:
      spec:
        # (Same container spec as above)
```

**Why Gang Scheduling:**

```
Standard Kubernetes:
  Node 1: Starts immediately → Waiting for others → GPU idle
  Node 2: Starts after 5 minutes
  Node 3: Starts after 10 minutes
  → Node 1's GPUs wasted for 10 minutes

Volcano Gang Scheduling:
  Nodes 1, 2, 3: Wait until all ready
  → Start simultaneously after 10 minutes → All GPUs utilized immediately
```

## Cost Example

| Resource | Spec | Hourly Cost | Training Time (1 epoch) | Total Cost |
|----------|------|-------------|------------------------|------------|
| **p5en.48xlarge Spot** | 8 H200s × 3 nodes | $10-15/GPU-hr | 4-6 hours | **$960-2,160** |
| **FSx Lustre (training data)** | 1.2 MB/s/TiB | $0.14/GB-month | - | ~$50 |
| **S3 checkpoint storage** | - | $0.023/GB | - | ~$10 |
| **Total cost per iteration** | - | - | - | **$1,020-2,220** |

:::warning Cost Disclaimer
p5en Spot pricing varies with demand. Automatic checkpoint saving is required to handle Spot interruptions. Assuming 24 iterations per year: $24K-53K range.
:::

## Next Steps

- [Eval Gate · Registry · KPI](./evaluation-rollout.md) — Threshold verification and Canary deployment of trained checkpoints
- [Trace → Dataset Materializer](./trace-to-dataset.md) — Review dataset construction stage before training

## References

### Official Documentation

- [NVIDIA NeMo Framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/) — GRPO/RLHF training pipeline
- [HuggingFace TRL](https://github.com/huggingface/trl) — DPO/PPO/ORPO reference
- [Karpenter](https://karpenter.sh/) — Automatic node provisioning
- [Volcano Scheduler](https://volcano.sh/) — Gang Scheduling

### Papers & Technical Blogs

- [GRPO Paper (arxiv 2402.03300)](https://arxiv.org/abs/2402.03300) — GRPO algorithm from DeepSeekMath
- [DPO Paper (arxiv 2305.18290)](https://arxiv.org/abs/2305.18290) — Original Direct Preference Optimization
- [Llama 3.1 Technical Report](https://arxiv.org/abs/2407.21783) — DPO production use case

### Related Documents

- [NeMo Framework Overview](../../../model-serving/inference-frameworks/nemo-framework.md)
- [Custom Model Pipeline](../custom-model-pipeline.md) — SFT → preference tuning flow
- [GPU Resource Management](../../../model-serving/gpu-infrastructure/gpu-resource-management.md) — Karpenter/KEDA/DRA
