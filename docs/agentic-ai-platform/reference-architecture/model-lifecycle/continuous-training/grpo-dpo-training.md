---
title: "GRPO/DPO 학습 Job"
sidebar_label: "GRPO/DPO Training"
description: "레이블링된 preference 데이터셋으로 NeMo-RL(GRPO)·TRL(DPO) 학습 Job을 Karpenter Spot 노드풀 + Volcano Gang Scheduling으로 실행하는 실전 구성."
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

## 개요

Continuous Training Pipeline의 3단계 **Preference Tuning** 구현을 다룹니다. 직전 단계에서 레이블링된 trace 데이터셋(`final_reward` 컬럼 포함)을 입력으로 받아, NeMo-RL 기반 GRPO 또는 TRL 기반 DPO로 모델을 파인튜닝합니다. Karpenter Spot 노드풀과 Volcano Gang Scheduling으로 GPU 비용과 유휴 시간을 최소화합니다.

## GRPO vs DPO 개념

### GRPO (Group Relative Policy Optimization)

**GRPO**는 동일 프롬프트에 대한 여러 응답을 reward 기준으로 순위화하여 학습하는 방법입니다.

```
프롬프트: "EKS Auto Mode의 장점은?"

응답 A (reward=0.9): "AWS가 노드를 완전 관리하여 운영 부담이 감소합니다..."
응답 B (reward=0.6): "Auto Mode는 편리합니다..."
응답 C (reward=0.3): "잘 모르겠습니다."

학습: A > B > C 순위로 정책 최적화
```

**장점:**

- 절대 점수 대신 **상대 순위** 학습 → 라벨링 노이즈에 강건
- 한 프롬프트당 여러 응답 생성 → 데이터 효율적
- RLHF 대비 간단 (Reward Model 별도 학습 불필요)

### DPO (Direct Preference Optimization)

**DPO**는 선호/비선호 쌍을 직접 학습하는 방법입니다.

```
프롬프트: "Karpenter의 주요 기능은?"

선호 (reward >= 0.7):
"Karpenter는 자동 노드 프로비저닝, bin-packing 최적화..."

비선호 (reward < 0.5):
"Karpenter는 스케일링 도구입니다." (너무 짧음)

학습: 선호 응답의 확률 ↑, 비선호 응답의 확률 ↓
```

**장점:**

- RLHF처럼 별도 Value Function 없이 **단일 Loss로 학습**
- 안정적인 학습 (PPO 대비 하이퍼파라미터 튜닝 간단)
- 프로덕션 적용 사례 많음 (Llama 3.1, Claude 3 등)

### 선택 기준

| 상황 | 권장 방법 | 이유 |
|------|----------|------|
| **다양한 응답 생성 가능** | GRPO | 순위 학습으로 데이터 효율 ↑ |
| **명확한 선호/비선호 구분** | DPO | 단순하고 안정적 |
| **라벨링 노이즈 많음** | GRPO | 상대 순위는 절대 점수보다 강건 |
| **빠른 프로토타이핑** | DPO | 하이퍼파라미터 튜닝 간단 |

## NeMo-RL 기반 GRPO 학습

[NeMo Framework](../../model-serving/inference-frameworks/nemo-framework.md)는 NVIDIA의 대규모 모델 학습 프레임워크입니다.

```python
# nemo_grpo_training.py
from nemo.collections.llm import GRPO, GPTModel
from nemo.collections.nlp.data import PreferenceDataset

# 학습 데이터 로드
dataset = PreferenceDataset(
    data_path='s3://training-data-lake/labeled-dataset/',
    reward_column='final_reward',
    min_reward_threshold=0.5,  # 0.5 이하는 제외
)

# 기본 모델 로드
model = GPTModel.from_pretrained('glm-5-32b')

# GRPO 설정
grpo_config = GRPO(
    num_iterations=1000,
    batch_size=32,
    learning_rate=1e-5,
    kl_coeff=0.1,  # KL divergence 페널티 (원본 모델과 너무 멀어지지 않도록)
    cliprange=0.2,
    vf_coeff=0.5,
)

# 분산 학습 실행
trainer = Trainer(
    devices=8,  # H100 8개
    num_nodes=3,  # 3 노드 = 24 GPU
    precision='bf16',
    strategy='fsdp',  # Fully Sharded Data Parallel
)

trainer.fit(model, grpo_config, dataset)
```

## TRL 기반 DPO 학습

[TRL (Transformer Reinforcement Learning)](https://github.com/huggingface/trl)은 HuggingFace의 RLHF 라이브러리입니다.

```python
# trl_dpo_training.py
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

# 모델 로드
model = AutoModelForCausalLM.from_pretrained('glm-5-32b', torch_dtype='bfloat16')
tokenizer = AutoTokenizer.from_pretrained('glm-5-32b')

# 선호/비선호 데이터셋 준비
def format_dpo_dataset(example):
    """Reward 기준으로 선호/비선호 구분"""
    if example['final_reward'] >= 0.7:
        return {
            'prompt': example['input'],
            'chosen': example['output'],
            'rejected': None,  # 비선호 예제는 별도 매칭
        }
    else:
        return None

dataset = load_dataset('parquet', data_files='s3://training-data-lake/labeled-dataset/*.parquet')
dpo_dataset = dataset.map(format_dpo_dataset).filter(lambda x: x is not None)

# DPO 학습 설정
training_args = DPOConfig(
    output_dir='/output/glm-5-dpo',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    max_length=4096,
    beta=0.1,  # DPO temperature (높을수록 선호도 차이 강조)
    num_train_epochs=1,
    bf16=True,
    logging_steps=10,
    save_strategy='steps',
    save_steps=100,
)

# 학습 실행
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
  parallelism: 3  # 3 노드 병렬 실행
  completions: 1
  template:
    metadata:
      labels:
        app: grpo-training
        karpenter.sh/capacity-type: spot  # Spot 인스턴스 활용
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge  # H200 8개
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
            memory: 1600Gi  # H200 141GB × 8 + 오버헤드
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
# Karpenter NodePool - Spot 인스턴스
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

### Volcano 배치 스케줄링

[Volcano](https://volcano.sh/)는 AI/ML 워크로드를 위한 배치 스케줄러입니다. Gang Scheduling으로 모든 노드가 준비될 때까지 대기했다가 동시에 실행합니다.

```yaml
# volcano-job.yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: grpo-training-volcano
spec:
  minAvailable: 3  # 3개 노드 모두 준비될 때까지 대기
  schedulerName: volcano
  queue: training-queue
  tasks:
  - name: trainer
    replicas: 3
    template:
      spec:
        # (위와 동일한 컨테이너 스펙)
```

**Gang Scheduling의 필요성:**

```
일반 Kubernetes:
  노드1: 즉시 시작 → 다른 노드 대기 중 → GPU 유휴
  노드2: 5분 후 시작
  노드3: 10분 후 시작
  → 노드1의 GPU는 10분간 낭비

Volcano Gang Scheduling:
  노드1, 2, 3: 모두 준비될 때까지 대기
  → 10분 후 동시 시작 → 모든 GPU 즉시 활용
```

## 비용 예시

| 리소스 | 스펙 | 시간당 비용 | 학습 시간 (1 epoch) | 총 비용 |
|--------|------|-----------|-------------------|---------|
| **p5en.48xlarge Spot** | H200 8개 × 3 노드 | $10-15/GPU-hr | 4-6시간 | **$960-2,160** |
| **FSx Lustre (학습 데이터)** | 1.2 MB/s/TiB | $0.14/GB-월 | - | ~$50 |
| **S3 체크포인트 저장** | - | $0.023/GB | - | ~$10 |
| **iteration당 총 비용** | - | - | - | **$1,020-2,220** |

:::warning 비용 디스클레이머
p5en Spot 가격은 수요에 따라 변동됩니다. Spot 중단(interruption) 대비 체크포인트 자동 저장 필수. 연간 24회 iteration 가정 시 $24K-53K 수준.
:::

## 다음 단계

- [Eval Gate · Registry · KPI](./evaluation-rollout.md) — 학습된 체크포인트의 Threshold 검증과 Canary 배포
- [Trace → Dataset Materializer](./trace-to-dataset.md) — 학습 전 데이터셋 구성 단계 복습

## 참고 자료

### 공식 문서

- [NVIDIA NeMo Framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/) — GRPO/RLHF 학습 파이프라인
- [HuggingFace TRL](https://github.com/huggingface/trl) — DPO/PPO/ORPO 레퍼런스
- [Karpenter](https://karpenter.sh/) — 노드 자동 프로비저닝
- [Volcano Scheduler](https://volcano.sh/) — Gang Scheduling

### 논문 · 기술 블로그

- [GRPO Paper (arxiv 2402.03300)](https://arxiv.org/abs/2402.03300) — DeepSeekMath의 GRPO 알고리즘
- [DPO Paper (arxiv 2305.18290)](https://arxiv.org/abs/2305.18290) — Direct Preference Optimization 원조
- [Llama 3.1 Technical Report](https://arxiv.org/abs/2407.21783) — DPO 프로덕션 적용 사례

### 관련 문서

- [NeMo Framework 개요](../../model-serving/inference-frameworks/nemo-framework.md)
- [커스텀 모델 파이프라인](../custom-model-pipeline.md) — SFT → 선호도 튜닝 흐름
- [GPU 리소스 관리](../../model-serving/gpu-infrastructure/gpu-resource-management.md) — Karpenter/KEDA/DRA
