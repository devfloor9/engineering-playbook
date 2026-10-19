---
title: GRPO/DPO 학습 Job
description: 레이블링된 preference 데이터셋으로 NeMo-RL(GRPO)·TRL(DPO) 학습 Job을 Karpenter Spot 노드풀 + Volcano Gang Scheduling으로 실행하는 실전 구성.
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 6
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

위 reward 값(0.9/0.6/0.3)은 개념 설명용 예시입니다. GRPO는 순위 자체가 아니라 그룹 내 상대 advantage로 학습합니다. 같은 프롬프트에 대한 그룹의 reward 평균·표준편차로 각 응답의 reward를 정규화한 값(그룹 상대 advantage)을 정책 업데이트에 사용합니다. 이때 reward는 학습된 보상 모델에서 올 수도 있고, 테스트 통과·형식 검증 같은 규칙 기반 함수에서 올 수도 있습니다.

이 파이프라인에서는 직전 단계가 trace마다 `final_reward`를 오프라인으로 미리 계산해 데이터셋에 넣습니다. 반면 온라인 GRPO 학습 루프는 현재 정책이 생성한 롤아웃(응답)에 대해 매 스텝 reward를 다시 매깁니다. 두 지점의 reward는 역할이 다르므로 혼동하지 마세요.

**장점:**

- 절대 점수 대신 **그룹 상대 advantage** 학습 → 라벨링 노이즈에 강건
- 한 프롬프트당 여러 응답 생성 → 데이터 효율적
- PPO 대비 간단: 별도 가치 함수(critic)를 두지 않아 메모리·구현 부담이 줄어듦 (별도 보상 모델이 필수인 것은 아님)

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

- 참조 정책(학습 시작 시점의 모델을 고정) 대비 선호/비선호의 상대 로그확률 차이를 직접 최적화합니다. PPO 방식 RLHF가 필요로 하는 온라인 보상 모델 학습과 가치 함수(critic)를 두지 않아 **단일 Loss로 학습**합니다.
- 안정적인 학습 (PPO 대비 하이퍼파라미터 튜닝 간단)
- 프로덕션 적용 사례 보고됨 (예: Llama 3.1)

### 선택 기준

아래 표의 권장은 확정된 결론이 아니라 워크로드에 따라 달라지는 시작 가설입니다. 실제 선택은 두 방법을 같은 데이터로 학습해 홀드아웃 선호 정확도(preference accuracy)나 응답 win-rate 같은 평가 지표로 비교해 정해야 합니다.

**표 1. 상황별 GRPO·DPO 시작 가설과 근거**

| 상황 | 시작 가설 | 근거 |
|------|----------|------|
| **다양한 응답 생성 가능** | GRPO | 순위 학습으로 데이터 효율 ↑ |
| **명확한 선호/비선호 구분** | DPO | 단순하고 안정적 |
| **라벨링 노이즈 많음** | GRPO | 상대 순위는 절대 점수보다 강건 |
| **빠른 프로토타이핑** | DPO | 하이퍼파라미터 튜닝 간단 |

## NeMo-RL 기반 GRPO 학습

[NeMo-RL](https://docs.nvidia.com/nemo/rl/)은 NVIDIA의 강화학습 특화 프레임워크로, NeMo와 별도 패키지입니다.

```python
# nemo_grpo_training.py
from nemo_rl.algorithms.grpo import MasterConfig, grpo_train, setup
from nemo_rl.data import PreferenceDataset

# 학습 데이터 로드
dataset = PreferenceDataset(
    data_path='s3://training-data-lake/labeled-dataset/',
    reward_column='final_reward',
    min_reward_threshold=0.5,  # 0.5 이하는 제외
)

# GRPO 설정 (YAML 기반 권장)
# examples/configs/grpo_math_8B.yaml 참조
grpo_config = {
    'num_iterations': 1000,
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
# 'glm-5-32b'은 공개 HF 체크포인트가 아니라, 사전에 준비해야 하는 비공개/증류(distilled)
# 아티팩트의 자리표시자입니다. 실제 사용 시 접근 가능한 호환 체크포인트 경로로 바꾸고,
# 해당 아키텍처가 요구하는 VRAM·GPU 수(예: 32B BF16은 수백 GB급)를 사전에 확보하세요.
model = AutoModelForCausalLM.from_pretrained('glm-5-32b', torch_dtype='bfloat16')
tokenizer = AutoTokenizer.from_pretrained('glm-5-32b')

# 선호/비선호 데이터셋 준비
# 같은 프롬프트(input)별로 고득점 응답을 chosen, 저득점 응답을 rejected로 묶어
# 유효한 쌍만 만듭니다. chosen/rejected가 비어 있거나 서로 동일하면 제외합니다.
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
assert pairs, '유효한 선호/비선호 쌍이 없습니다'

# 학습/검증 split 선택
dpo_dataset = Dataset.from_list(pairs).train_test_split(test_size=0.1, seed=42)['train']

# DPO 학습 설정
training_args = DPOConfig(
    output_dir='/output/glm-5-dpo',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    max_length=4096,
    beta=0.1,  # 기본 sigmoid DPO loss의 참조 정책 대비 KL 규제 강도 (높을수록 참조 모델에서 덜 벗어나며 선호 차이를 보수적으로 반영)
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
    processing_class=tokenizer,  # TRL v0.16+ (v0.12부터 tokenizer→processing_class로 renamed)
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
  parallelism: 3  # 주의: 평범한 batch/v1 Job의 parallelism은 서로 독립적인 Pod 3개를 띄울 뿐
                  # rendezvous/워커 토폴로지/분산 런처가 없어 멀티노드 분산 학습이 성립하지 않습니다.
                  # 실제 3노드 분산은 아래 Volcano Gang Scheduling + 분산 런처(torchrun 등)로 구성하세요.
  completions: 1
  template:
    metadata:
      labels:
        app: grpo-training
        karpenter.sh/capacity-type: spot  # 라벨일 뿐 스케줄링 제약이 아님 (Spot 강제 아님)
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge  # H200 8개
        karpenter.sh/capacity-type: spot  # Spot 노드를 필수로 요구 (toleration만으로는 Spot이 강제되지 않음)
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
        image: nvcr.io/nvidia/nemo:26.02  # 배포 시점 NGC 카탈로그에서 최신 버전 확인
        # num-nodes=3 분산 학습은 평범한 `python` 실행으로는 성립하지 않습니다.
        # torchrun 등 분산 런처로 rendezvous를 구성해야 합니다.
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
            memory: 1600Gi  # 호스트 RAM 요청량 (GPU VRAM이 아님). 노드 가용 RAM 범위 내여야 스케줄됨
          limits:
            nvidia.com/gpu: 8
            memory: 1600Gi
        env:
        # S3 접근 자격증명(IRSA 등)과 checkpoint PVC가 사전에 준비돼야 합니다.
        - name: NCCL_DEBUG
          value: "INFO"
        - name: NCCL_MIN_NCHANNELS
          value: "16"
        # FI_PROVIDER=efa는 클러스터에 EFA 디바이스 플러그인이 설치되고 EFA 지원 인스턴스일 때만 유효합니다.
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
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: training-gpu-class  # EC2NodeClass는 사전에 존재해야 합니다
      
      taints:
      - key: nvidia.com/gpu
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        value: spot
        effect: NoSchedule
```

### Volcano 배치 스케줄링

[Volcano](https://volcano.sh/)는 AI/ML 워크로드를 위한 배치 스케줄러입니다. Gang Scheduling으로 모든 노드가 준비될 때까지 대기했다가 동시에 실행합니다. 아래 YAML은 핵심 필드만 보여주는 부분 조각이며, `tasks[].template.spec`에는 위 Kubernetes Job의 컨테이너 스펙을 그대로 채워야 합니다. 또한 `queue: training-queue`가 가리키는 Volcano Queue가 사전에 생성돼 있어야 스케줄됩니다.

```yaml
# volcano-job.yaml (부분 조각)
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: grpo-training-volcano
spec:
  minAvailable: 3  # 3개 노드(gang) 모두 준비될 때까지 대기
  schedulerName: volcano
  queue: training-queue  # 사전에 생성된 Volcano Queue 필요
  tasks:
  - name: trainer
    replicas: 3
    template:
      spec:
        # (위 Kubernetes Job과 동일한 컨테이너 스펙으로 채우세요)
```

**Gang Scheduling의 필요성(예시 시나리오):**

아래는 Gang Scheduling의 효과를 보여주기 위한 예시이며, 실제 노드 준비 시간은 환경에 따라 다릅니다. Gang Scheduling은 "모두 준비될 때까지 대기 후 동시 시작"을 보장할 뿐, GPU 유휴가 0이 됨을 보장하지는 않습니다.

```
일반 Kubernetes:
  노드1: 즉시 시작 → 다른 노드 대기 중 → GPU 유휴
  노드2: 5분 후 시작
  노드3: 10분 후 시작
  → 노드1의 GPU는 10분간 낭비

Volcano Gang Scheduling:
  노드1, 2, 3: 모두 준비될 때까지 대기
  → 모두 준비된 뒤 동시 시작 → 대기 중 부분 점유로 인한 유휴 감소
```

## 비용 예시

**표 2. 리소스 스펙별 학습 시간과 비용 예시**

| 리소스 | 스펙 | 시간당 비용 | 학습 시간 (1 epoch) | 총 비용 |
|--------|------|-----------|-------------------|---------|
| **p5en.48xlarge Spot** | H200 8개 × 3 노드 | $10-15/GPU-hr | 4-6시간 | **$960-2,160** |
| **FSx Lustre (학습 데이터)** | 125 MB/s/TiB | $0.145/GB-월 | - | ~$50 |
| **S3 체크포인트 저장** | - | $0.023/GB | - | ~$10 |
| **iteration당 총 비용 (예시)** | - | - | - | **$1,020-2,220** |

:::warning 비용 디스클레이머
위 총액은 가정한 스펙으로 계산한 예시이며 실측값이 아닙니다. 용량·보존 기간·리전·날짜를 여기서 고정하지 않았으므로 의존 전에 측정하세요. p5en Spot 가격은 수요에 따라 변동됩니다. Spot 중단(interruption) 대비 체크포인트 자동 저장 필수. 연간 24회 iteration 가정 시 $24K-53K 수준.
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

- [NeMo Framework 개요](../../../model-serving/inference-frameworks/nemo-framework.md)
- [커스텀 모델 파이프라인](../custom-model-pipeline.md) — SFT → 선호도 튜닝 흐름
- [GPU 리소스 관리](../../../model-serving/gpu-infrastructure/gpu-resource-management.md) — Karpenter/KEDA/DRA
