---
title: GRPO/DPO Training Job
description: Production configuration for running NeMo-RL (GRPO) and TRL (DPO) training jobs with labeled preference datasets on Karpenter Spot node pools and Volcano Gang Scheduling.
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 10
tags:
  - continuous-training
  - grpo
  - dpo
  - training
  - nemo
  - trl
  - scope:impl
sidebar_label: GRPO/DPO Training
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

The reward values above (0.9/0.6/0.3) are an illustrative example. GRPO learns from a group-relative advantage, not from the ranking itself: each response's reward is normalized by the mean and standard deviation of the group's rewards for the same prompt, and that group-relative advantage drives the policy update. The reward can come from a learned reward model or from a rule-based function such as test-passing or format validation.

In this pipeline, the previous stage computes a `final_reward` per trace offline and stores it in the dataset. The online GRPO training loop, by contrast, re-scores the rollouts (responses) that the current policy generates at each step. These two rewards play different roles — do not conflate them.

**Advantages:**

- Learns a **group-relative advantage** instead of absolute scores → robust to labeling noise
- Generates multiple responses per prompt → data-efficient
- Simpler than PPO: no separate value function (critic), which lowers memory and implementation overhead (a separate reward model is not strictly required)

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

- Directly optimizes the relative log-probability difference between preferred and non-preferred responses against a reference policy (the model frozen at the start of training). It trains with a **single loss**, without the online reward-model training and value function (critic) that PPO-style RLHF requires.
- Stable training (simpler hyperparameter tuning than PPO)
- Reported in production use (e.g. Llama 3.1)

### Selection Criteria

The recommendations in the table below are not settled conclusions but starting hypotheses that depend on the workload. Decide the actual method by training both on the same data and comparing them with an evaluation metric such as held-out preference accuracy or response win-rate.

**Table 1. Starting GRPO/DPO hypothesis and rationale by situation**

| Situation | Starting Hypothesis | Reason |
|-----------|-------------------|--------|
| **Can generate diverse responses** | GRPO | Higher data efficiency through ranking |
| **Clear preferred/non-preferred distinction** | DPO | Simple and stable |
| **High labeling noise** | GRPO | Relative ranking more robust than absolute scores |
| **Rapid prototyping** | DPO | Simple hyperparameter tuning |

## NeMo-RL-based GRPO Training

[NeMo-RL](https://docs.nvidia.com/nemo/rl/) is NVIDIA's reinforcement-learning framework, a separate package from NeMo.

```python
# nemo_grpo_training.py
from nemo_rl.algorithms.grpo import MasterConfig, grpo_train, setup
from nemo_rl.data import PreferenceDataset

# Load training data
dataset = PreferenceDataset(
    data_path='s3://training-data-lake/labeled-dataset/',
    reward_column='final_reward',
    min_reward_threshold=0.5,  # Exclude below 0.5
)

# GRPO configuration (YAML-based recommended)
# See examples/configs/grpo_math_8B.yaml
grpo_config = {
    'num_iterations': 1000,
    batch_size=32,
    learning_rate=1e-5,
    kl_coeff=0.1,  # KL divergence penalty (keep close to the base model)
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
# 'glm-5-32b' is not a public HF checkpoint but a placeholder for a private/distilled
# artifact you must prepare in advance. Replace it with an accessible, compatible checkpoint
# path, and provision the VRAM/GPU count its architecture requires (e.g. a 32B BF16 model
# needs on the order of hundreds of GB).
model = AutoModelForCausalLM.from_pretrained('glm-5-32b', torch_dtype='bfloat16')
tokenizer = AutoTokenizer.from_pretrained('glm-5-32b')

# Prepare preferred/non-preferred dataset
# Group high-score responses as chosen and low-score responses as rejected per prompt (input),
# building only valid pairs. Drop pairs where chosen/rejected is empty or identical.
from datasets import Dataset

def build_pairs(rows):
    by_prompt = {}
    for r in rows:
        by_prompt.setdefault(r['input'], {'chosen': [], 'rejected': []})
        if r['final_reward'] >= 0.7:
            by_prompt[r['input']]['chosen'].append(r['output'])
        elif r['final_reward'] < 0.5:
            by_prompt[r['input']]['rejected'].append(r['output'])

    pairs = []
    for prompt, g in by_prompt.items():
        for chosen in g['chosen']:
            for rejected in g['rejected']:
                if chosen and rejected and chosen != rejected:
                    pairs.append({'prompt': prompt, 'chosen': chosen, 'rejected': rejected})
    return pairs

raw = load_dataset('parquet', data_files='s3://training-data-lake/labeled-dataset/*.parquet')
pairs = build_pairs(raw['train'])
assert pairs, 'No valid preferred/non-preferred pairs'

# Select the train split
dpo_dataset = Dataset.from_list(pairs).train_test_split(test_size=0.1, seed=42)['train']

# DPO training configuration
training_args = DPOConfig(
    output_dir='/output/glm-5-dpo',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    max_length=4096,
    beta=0.1,  # KL-regularization strength of the default sigmoid DPO loss relative to the reference policy (higher stays closer to the reference model and reflects preference differences more conservatively)
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
    processing_class=tokenizer,  # TRL v0.16+ (renamed from tokenizer→processing_class in v0.12)
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
  parallelism: 3  # Note: a plain batch/v1 Job's parallelism only launches 3 independent Pods.
                  # With no rendezvous, worker topology, or distributed launcher, this is not
                  # multi-node distributed training. For a real 3-node run, use the Volcano Gang
                  # Scheduling job below with a distributed launcher (e.g. torchrun).
  completions: 1
  template:
    metadata:
      labels:
        app: grpo-training
        karpenter.sh/capacity-type: spot  # A label only, not a scheduling constraint (does not force Spot)
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge  # 8 H200s
        karpenter.sh/capacity-type: spot  # Require a Spot node (a toleration alone does not force Spot)
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
        image: nvcr.io/nvidia/nemo:26.02  # Check the latest version in the NGC catalog at deploy time
        # num-nodes=3 distributed training does not work with a plain `python` call.
        # Set up rendezvous with a distributed launcher such as torchrun.
        command:
        - torchrun
        - --nnodes=3
        - --nproc_per_node=8
        - --rdzv_backend=c10d
        - --rdzv_endpoint=$(MASTER_ADDR):29500
        - /workspace/nemo_grpo_training.py
        args:
        - --data-path=s3://training-data-lake/labeled-dataset/
        - --output-path=/checkpoints/grpo-run-001
        volumeMounts:
        - name: checkpoint-storage
          mountPath: /checkpoints
        resources:
          requests:
            nvidia.com/gpu: 8
            memory: 1600Gi  # Host RAM request (not GPU VRAM). Must fit within the node's available RAM to schedule
          limits:
            nvidia.com/gpu: 8
            memory: 1600Gi
        env:
        # S3 access credentials (e.g. IRSA) and the checkpoint PVC must be provisioned in advance.
        - name: NCCL_DEBUG
          value: "INFO"
        - name: NCCL_MIN_NCHANNELS
          value: "16"
        # FI_PROVIDER=efa is valid only when the cluster has the EFA device plugin installed and the instance supports EFA.
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
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: training-gpu-class  # The EC2NodeClass must already exist
      
      taints:
      - key: nvidia.com/gpu
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        value: spot
        effect: NoSchedule
```

### Volcano Batch Scheduling

[Volcano](https://volcano.sh/) is a batch scheduler for AI/ML workloads. Gang Scheduling waits until all nodes are ready before starting execution simultaneously. The YAML below shows only the key fields and is a partial fragment; fill `tasks[].template.spec` with the container spec from the Kubernetes Job above. The Volcano Queue referenced by `queue: training-queue` must also exist beforehand for the job to schedule.

```yaml
# volcano-job.yaml (partial fragment)
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: grpo-training-volcano
spec:
  minAvailable: 3  # Wait until all 3 nodes (the gang) are ready
  schedulerName: volcano
  queue: training-queue  # Requires a pre-created Volcano Queue
  tasks:
  - name: trainer
    replicas: 3
    template:
      spec:
        # (Fill with the same container spec as the Kubernetes Job above)
```

**Why Gang Scheduling (illustrative scenario):**

The following is an example to illustrate the effect of Gang Scheduling; actual node-readiness times vary by environment. Gang Scheduling only guarantees "wait until all are ready, then start together"; it does not guarantee zero GPU idle time.

```
Standard Kubernetes:
  Node 1: Starts immediately → Waiting for others → GPU idle
  Node 2: Starts after 5 minutes
  Node 3: Starts after 10 minutes
  → Node 1's GPUs wasted for 10 minutes

Volcano Gang Scheduling:
  Nodes 1, 2, 3: Wait until all ready
  → Start together once all are ready → less idle from partial occupancy while waiting
```

## Cost Example

**Table 2. Example training time and cost by resource spec**

| Resource | Spec | Hourly Cost | Training Time (1 epoch) | Total Cost |
|----------|------|-------------|------------------------|------------|
| **p5en.48xlarge Spot** | 8 H200s × 3 nodes | $10-15/GPU-hr | 4-6 hours | **$960-2,160** |
| **FSx Lustre (training data)** | 125 MB/s/TiB | $0.145/GB-month | - | ~$50 |
| **S3 checkpoint storage** | - | $0.023/GB | - | ~$10 |
| **Total cost per iteration (illustrative)** | - | - | - | **$1,020-2,220** |

:::warning Cost Disclaimer
The totals above are illustrative arithmetic based on the assumed specs, not measured costs; capacity, retention, region, and date are not fixed here, so measure before relying on them. p5en Spot pricing varies with demand. Automatic checkpoint saving is required to handle Spot interruptions. Assuming 24 iterations per year: $24K-53K range.
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
