---
title: "GLM-5.1 대형 MoE 모델 EKS 배포 실전 가이드"
sidebar_label: "GLM-5.1 배포 가이드"
description: "GLM-5 744B MoE FP8 모델을 EKS에서 vLLM + llm-d로 배포하면서 경험한 실전 이슈와 해결책"
tags: [glm-5, moe, vllm, eks, gpu, deployment, lessons-learned]
last_update:
  date: 2026-04-05
  author: YoungJoon Jeong
---

# GLM-5.1 대형 MoE 모델 EKS 배포 실전 가이드

이 문서는 [Agentic AI Platform 샘플 아키텍처](../design-architecture/agentic-platform-architecture.md)를 바탕으로 **GLM-5.1 744B MoE FP8** 모델의 실전 배포 사례를 제공합니다. 배포 과정에서 경험한 이슈와 해결책을 정리하여, 대형 MoE 모델을 EKS에서 운영하려는 팀이 동일한 시행착오를 반복하지 않도록 돕습니다.

:::info 이 가이드의 목적
이 문서는 "이렇게 하면 된다"보다는 "이런 이슈를 만났고, 이렇게 해결했다"에 초점을 맞춥니다. 실제 프로덕션 배포 시 겪을 수 있는 문제를 미리 파악하고 대응하는 데 도움을 드립니다.
:::

## 1. 모델 개요

### GLM-5.1 주요 특징

- **GLM-5.1 = GLM-5 동일 가중치**: 코딩 작업에 특화된 post-training RL만 추가
- **744B MoE (40B active)**: 256 experts 중 토큰당 8개 활성화
- **HuggingFace**: `zai-org/GLM-5-FP8`
- **라이선스**: MIT License
- **컨텍스트**: 200K 토큰 지원
- **성능**: 
  - Agentic Coding 벤치마크 오픈소스 1위 (55.00점)
  - SWE-bench 77.8% (GPT-4o 57.0%)

:::tip 왜 GLM-5.1을 선택했나?
MIT 라이선스로 상업적 활용 가능하며, Agentic Coding 작업에서 OpenAI GPT-4o를 능가하는 성능을 보여줍니다. 특히 SWE-bench 스코어가 77.8%로 코드 생성 및 버그 수정 작업에 강점을 보입니다.
:::

### 모델 스펙

| 항목 | 세부사항 |
|------|---------|
| 파라미터 | 744B (전체) / 40B (활성) |
| MoE 구조 | 256 experts, top-8 routing |
| 정밀도 | FP8 |
| 모델 크기 | ~704GB (가중치) |
| 필요 VRAM | ~744GB (단일 노드 로딩) |
| 최소 GPU | H200 8개 (1,128GB) 또는 B200 8개 (1,536GB) |

## 2. GPU 인스턴스 선택 매트릭스

744B 모델 배포 시 가장 중요한 선택은 GPU 인스턴스 타입입니다.

| 인스턴스 | GPU | VRAM | 단일노드 가능? | PP=2 멀티노드 | Spot 가격 (us-east-2) | 권장도 |
|---------|-----|------|---------------|--------------|---------------------|--------|
| p5.48xlarge | H100×8 | 640GB | ❌ (744GB > 640GB) | ⚠️ vLLM 교착 발생 | $12/hr | ⚠️ |
| p5en.48xlarge | H200×8 | 1,128GB | ✅ | ✅ (불필요) | $12/hr | ✅ 최적 |
| p6-b200.48xlarge | B200×8 | 1,536GB | ✅ | ✅ (불필요) | $18/hr | ✅ 여유 |

:::warning p5.48xlarge 단일노드 불가
GLM-5 FP8는 ~744GB VRAM이 필요하지만, p5.48xlarge는 640GB만 제공합니다. 이론적으로 PP=2 멀티노드가 가능하지만, vLLM V1 엔진의 멀티노드 PP 교착 문제로 인해 안정적 배포가 어렵습니다 (섹션 6 참조).
:::

### 권장 선택: p5en.48xlarge Spot

**p5en.48xlarge Spot ($12/hr)를 권장하는 이유:**

1. **가격 동일**: p5 Spot과 동일한 $12/hr
2. **VRAM 1.76배**: 1,128GB로 단일 노드 배포 가능
3. **단순성**: 멀티노드 복잡도 제거
4. **안정성**: vLLM PP 교착 문제 회피

```bash
# p5en.48xlarge Spot 가격 조회 (us-east-2)
aws ec2 describe-spot-price-history \
  --instance-types p5en.48xlarge \
  --region us-east-2 \
  --start-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --product-descriptions "Linux/UNIX" \
  --query 'SpotPriceHistory[0].[SpotPrice,Timestamp]' \
  --output table
```

## 3. EKS 배포 모드 선택

EKS Auto Mode vs Standard Mode 중 어떤 것을 선택할지는 사용하려는 GPU 인스턴스에 따라 달라집니다.

| 모드 | p5.48xlarge | p5en.48xlarge | p6-b200.48xlarge | 안정성 |
|------|------------|---------------|------------------|--------|
| Auto Mode | ✅ | ❌ NoCompatibleInstanceTypes | ❌ 미지원 | ⚠️ |
| Auto Mode + MNG 하이브리드 | ✅ | ✅ (MNG 지연/실패 가능) | ✅ (MNG 지연/실패 가능) | ⚠️ |
| Standard Mode + MNG | ✅ | ✅ | ✅ | ✅ 가장 안정적 |

:::caution Auto Mode의 p5en/p6 지원 제약
2026년 4월 기준, EKS Auto Mode는 p5.48xlarge는 지원하지만 p5en.48xlarge와 p6-b200.48xlarge는 `NoCompatibleInstanceTypes` 오류를 반환합니다. Auto Mode + MNG 하이브리드 구성이 가능하지만, MNG 생성이 지연되거나 실패할 수 있습니다.
:::

### 권장: Standard Mode + MNG

**Standard Mode + Managed Node Group을 권장하는 이유:**

1. **인스턴스 타입 자유도**: p5, p5en, p6 모두 지원
2. **MNG 안정성**: Auto Mode 제약 없음
3. **Spot 제어**: Spot 대체 전략 세밀 제어
4. **Karpenter 선택지**: 필요 시 Karpenter 추가 가능

#### Standard Mode + MNG 설정 예시

```bash
# EKS 클러스터 생성 (Standard Mode)
eksctl create cluster \
  --name glm5-cluster \
  --region us-east-2 \
  --version 1.33 \
  --without-nodegroup

# p5en.48xlarge MNG 생성
eksctl create nodegroup \
  --cluster glm5-cluster \
  --region us-east-2 \
  --name glm5-gpu-nodes \
  --node-type p5en.48xlarge \
  --nodes 1 \
  --nodes-min 0 \
  --nodes-max 2 \
  --spot \
  --managed \
  --node-ami-family Ubuntu2204 \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub \
  --node-labels "workload=glm5,gpu=h200" \
  --node-volume-size 500 \
  --node-volume-type gp3 \
  --kubelet-extra-args "--max-pods=110"
```

## 4. vLLM 커스텀 이미지 빌드

### 문제: GLM-5 모델 인식 실패

vLLM 표준 이미지 (v0.18.1, latest, nightly)는 transformers v4.x를 사용하는데, GLM-5의 `glm_moe_dsa` 아키텍처를 인식하지 못합니다.

```bash
# 표준 vLLM 이미지 실행 시 오류
ValueError: Model type 'glm_moe_dsa' is not supported.
```

### 해결: Transformers v5.5 설치

transformers의 main 브랜치 (v5.5-dev)에는 GLM-5 지원이 포함되어 있습니다.

#### Dockerfile

```dockerfile
FROM vllm/vllm-openai:nightly
RUN pip install https://github.com/huggingface/transformers/archive/refs/heads/main.zip
ENV VLLM_USE_DEEP_GEMM=1
```

:::tip VLLM_USE_DEEP_GEMM
`VLLM_USE_DEEP_GEMM=1`은 NVIDIA H100/H200/B200의 FP8 Tensor Core를 활성화하여 MoE 모델 추론 성능을 향상시킵니다.
:::

#### 빌드 및 푸시

```bash
# ECR 레지스트리 생성
aws ecr create-repository \
  --repository-name vllm-glm5 \
  --region us-east-2

# ECR 로그인
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

# 멀티 플랫폼 빌드 (linux/amd64)
docker buildx build --platform linux/amd64 \
  -t <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/vllm-glm5:nightly \
  --push .
```

:::warning Mac에서 cross-platform 빌드 느림
Apple Silicon Mac에서 `--platform linux/amd64` 빌드는 에뮬레이션으로 인해 매우 느립니다 (30분 이상). 대안으로 initContainer에서 `pip install` 직접 실행하는 방법도 고려할 수 있습니다.
:::

#### 대안: initContainer zip install

```yaml
initContainers:
- name: install-transformers
  image: vllm/vllm-openai:nightly
  command: ["/bin/bash", "-c"]
  args:
    - |
      pip install https://github.com/huggingface/transformers/archive/refs/heads/main.zip
  volumeMounts:
  - name: vllm-python-packages
    mountPath: /opt/vllm/.local
```

## 5. 모델 캐시 전략

GLM-5 모델은 ~704GB로 다운로드 시간이 매우 깁니다. 효율적인 캐시 전략이 필수입니다.

| 전략 | 다운로드 시간 | 멀티노드 동기화 | 비용 | 복잡도 | 권장도 |
|------|-------------|----------------|-----|--------|--------|
| HuggingFace Hub 직접 | ~45분 (노드당) | ❌ 각 노드 독립 | 무료 (대역폭) | 낮음 | ⚠️ |
| S3 + init container `aws s3 sync` | ~30분 (노드당) | ⚠️ 타이밍 불일치 가능 | S3 저장+전송 | 중간 | ✅ |
| S3 + init container `s5cmd` | ~15분 (노드당) | ⚠️ 타이밍 불일치 가능 | S3 저장+전송 | 중간 | ✅ 최적 |
| EFS | ~60분 (노드당) | ✅ 공유 파일시스템 | EFS 저장+처리량 | 높음 | ⚠️ |
| NVMe emptyDir (사전 다운로드 필수) | 즉시 | ✅ (S3 sync 선행) | S3 전송만 | 높음 | ✅ |

### 권장: S3 사전 업로드 → s5cmd → NVMe emptyDir

**추천 워크플로우:**

1. **S3에 모델 사전 업로드** (1회만)
2. **initContainer에서 s5cmd로 병렬 다운로드**
3. **NVMe emptyDir에 캐시**

#### 1단계: S3에 모델 업로드

```bash
# HuggingFace에서 로컬로 다운로드
huggingface-cli download zai-org/GLM-5-FP8 \
  --local-dir /tmp/glm5-fp8 \
  --local-dir-use-symlinks False

# S3로 업로드
aws s3 sync /tmp/glm5-fp8 \
  s3://<MODEL_CACHE_BUCKET>/glm5-fp8/ \
  --region us-east-2
```

#### 2단계: initContainer s5cmd 다운로드

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: vllm-glm5
spec:
  initContainers:
  - name: download-model
    image: public.ecr.aws/aws-cli/aws-cli:latest
    command: ["/bin/bash", "-c"]
    args:
      - |
        # s5cmd 설치
        wget -q https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-64bit.tar.gz
        tar xzf s5cmd_2.2.2_Linux-64bit.tar.gz
        
        # 병렬 다운로드 (16 workers)
        ./s5cmd --numworkers 16 sync \
          s3://<MODEL_CACHE_BUCKET>/glm5-fp8/* \
          /mnt/models/glm5-fp8/
    volumeMounts:
    - name: model-cache
      mountPath: /mnt/models
    env:
    - name: AWS_REGION
      value: us-east-2
  containers:
  - name: vllm
    image: <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/vllm-glm5:nightly
    command: ["vllm", "serve"]
    args:
      - "zai-org/GLM-5-FP8"
      - "--download-dir=/mnt/models"
      - "--tensor-parallel-size=8"
      - "--enforce-eager"
      - "--trust-remote-code"
    volumeMounts:
    - name: model-cache
      mountPath: /mnt/models
  volumes:
  - name: model-cache
    emptyDir:
      medium: ""  # NVMe (p5en은 4TB NVMe 제공)
      sizeLimit: 800Gi
```

:::tip s5cmd vs aws s3 sync
`s5cmd`는 Go로 작성된 고성능 S3 클라이언트로, `aws s3 sync`보다 3-4배 빠릅니다. `--numworkers 16`으로 병렬 다운로드를 활용하면 704GB 모델을 ~15분에 다운로드할 수 있습니다.
:::

:::warning HuggingFace Hub 직접 다운로드의 멀티노드 문제
HuggingFace Hub에서 직접 다운로드하면 각 노드가 개별적으로 다운로드하므로:
1. 다운로드 타이밍이 불일치 (Leader는 완료, Worker는 진행 중)
2. vLLM 엔진 초기화 타임아웃 발생 가능
3. PP 멀티노드에서 동기화 문제 유발

S3 사전 업로드 후 `s5cmd`로 빠르게 다운로드하면 타이밍 불일치를 최소화할 수 있습니다.
:::

## 6. vLLM PP=2 멀티노드 교착 문제 (Lessons Learned)

이 섹션은 **실패 사례**입니다. p5.48xlarge에서 PP=2 멀티노드 배포를 시도하며 겪은 문제와 해결 시도를 상세히 기록합니다.

### 증상

1. **Leader Pod**: 모델 로딩 완료 → `vllm.engine.engine.LLMEngine` 초기화 성공
2. **Worker Pod**: `Waiting for engine process to be ready...` → 타임아웃 (10분)
3. **결과**: GPU 메모리 해제 → `TCPStore::recv: Connection closed by peer` → Crash

```bash
# Leader Pod 로그 (정상)
INFO 04-01 12:34:56 engine.py:123] Initialized engine process.
INFO 04-01 12:35:02 model_runner.py:456] Loading weights on GPU...
INFO 04-01 12:37:45 model_runner.py:789] Model loading complete. VRAM: 43GB / 80GB

# Worker Pod 로그 (교착)
INFO 04-01 12:34:58 engine.py:123] Initialized engine process.
INFO 04-01 12:35:05 model_runner.py:456] Loading weights on GPU...
INFO 04-01 12:35:05 worker.py:234] Waiting for engine process to be ready...
INFO 04-01 12:35:05 worker.py:234] Waiting for engine process to be ready...
... (10분 반복) ...
ERROR 04-01 12:45:05 worker.py:345] Engine process failed to become ready within 600s.
NCCL ERROR: Call to connect() failed: Connection refused
ERROR: TCPStore::recv: Connection closed by peer
```

### 원인 분석

#### 1. vLLM 엔진 타임아웃 기본값 부족

vLLM의 `VLLM_ENGINE_READY_TIMEOUT_S` 기본값은 600초 (10분)입니다. 그러나 GLM-5 744B 모델은:

- Leader: 모델 로딩 ~3분
- Worker: 모델 로딩 ~8분 (Leader보다 느림)
- torch.compile (첫 실행 시): 추가 5-10분

Worker가 타임아웃에 걸리면서 교착이 시작됩니다.

#### 2. V1 엔진의 멀티노드 PP 미완성

vLLM V1 엔진은 `multiproc_executor`를 사용하는데, 멀티노드 Pipeline Parallelism이 아직 실험적 단계입니다. Ray를 사용하지 않는 non-Ray 모드에서는:

- Leader-Worker 동기화 메커니즘 불완전
- TCPStore 타임아웃 처리 미흡
- torch.distributed 초기화 순서 이슈

#### 3. torch.compile 동기화 교착

`--enforce-eager`가 제대로 적용되지 않으면 torch.compile이 활성화됩니다. 멀티노드 환경에서 torch.compile은:

- Leader와 Worker의 컴파일 타이밍 불일치
- NCCL collective 중 일부 rank 대기 → 데드락
- GPU 메모리 OOM → 프로세스 종료 → NCCL 연결 끊김

#### 4. 노드별 독립 다운로드로 인한 타이밍 불일치

HuggingFace Hub에서 직접 다운로드하면 각 노드가 독립적으로 다운로드하므로:

- Leader: 3분에 완료
- Worker: 8분에 완료
- Leader가 먼저 엔진 초기화 → Worker 대기 → 타임아웃

### 시도한 해결책과 결과

| 시도 | 방법 | 결과 | 비고 |
|------|------|------|------|
| 1. 타임아웃 연장 | `VLLM_ENGINE_READY_TIMEOUT_S=1800` (30분) | Worker crash 빈도 감소, 교착 유지 | 근본 해결 아님 |
| 2. Eager 모드 강제 | `--enforce-eager` | ❌ 적용 안 됨 | LWS LeaderWorkerSet이 vLLM args를 제대로 전달하지 못함 |
| 3. S3 사전 다운로드 | S3 + s5cmd | 타이밍 개선, 교착 유지 | 다운로드는 빨라졌지만 동기화 문제 여전 |
| 4. NCCL 타임아웃 연장 | `NCCL_TIMEOUT=1800` | 효과 없음 | NCCL 타임아웃이 아닌 엔진 타임아웃 문제 |
| 5. Distributed 타임아웃 | `VLLM_DISTRIBUTED_TIMEOUT=1800` | ❌ 환경변수 미인식 | vLLM 코드에 해당 변수 없음 |
| 6. Ray 모드 | `--engine-use-ray` | ❌ Kubernetes + Ray 통합 복잡 | Ray cluster 구성 필요 |

:::caution 결론: vLLM V1 멀티노드 PP는 2026.04 기준 불안정
vLLM V1 엔진의 non-Ray 멀티노드 Pipeline Parallelism은 2026년 4월 기준 프로덕션 환경에 적합하지 않습니다. Leader-Worker 동기화가 불완전하고, torch.compile 활성화 시 교착 발생 빈도가 높습니다.
:::

### 권장 대안

#### 대안 1: p5en/p6 단일 노드 (최우선 권장)

```yaml
resources:
  limits:
    nvidia.com/gpu: 8  # H200 8개 = 1,128GB
```

- **장점**: 멀티노드 복잡도 제거, 안정성 최대화
- **단점**: Spot 가용성 (단일 노드만 필요하므로 영향 적음)

#### 대안 2: SGLang (GLM-5 최적화 버전)

SGLang은 GLM-5를 위한 전용 이미지를 제공하며, 멀티노드 PP를 더 안정적으로 지원합니다.

```yaml
image: lmsysorg/sglang:glm5-hopper
command: ["python3", "-m", "sglang.launch_server"]
args:
  - "--model-path=zai-org/GLM-5-FP8"
  - "--tp=8"
  - "--pp=2"  # 멀티노드 PP 지원
  - "--trust-remote-code"
```

- **장점**: GLM-5 전용 최적화, 멀티노드 PP 안정성
- **단점**: vLLM 생태계 이탈 (OpenAI API 호환성은 유지)

#### 대안 3: vLLM Ray 모드

vLLM의 Ray 모드는 멀티노드 분산을 더 안정적으로 지원하지만, Kubernetes와의 통합이 복잡합니다.

```bash
# Ray cluster 구성 필요
helm install ray-cluster kuberay/ray-cluster \
  --set head.resources.limits.nvidia\\.com/gpu=0 \
  --set worker.replicas=2 \
  --set worker.resources.limits.nvidia\\.com/gpu=8
```

- **장점**: vLLM 생태계 유지, 안정성 향상
- **단점**: Ray cluster 운영 오버헤드

## 7. LWS 멀티노드 설정 (성공한 부분)

교착 문제는 있었지만, LeaderWorkerSet (LWS)의 멀티노드 네트워킹은 성공적으로 작동했습니다.

### LWS LeaderWorkerSet 정의

```yaml
apiVersion: leaderworkerset.x-k8s.io/v1
kind: LeaderWorkerSet
metadata:
  name: vllm-glm5
spec:
  replicas: 1  # 1 Leader + 1 Worker = 2 nodes
  leaderWorkerTemplate:
    size: 2  # Leader (rank 0) + Worker (rank 1)
    restartPolicy: Default  # Worker만 재시작
    leaderTemplate:
      metadata:
        labels:
          role: leader
      spec:
        containers:
        - name: vllm
          image: <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/vllm-glm5:nightly
          command: ["vllm", "serve"]
          args:
            - "zai-org/GLM-5-FP8"
            - "--tensor-parallel-size=8"
            - "--pipeline-parallel-size=2"
            - "--node-rank=0"
            - "--master-addr=$(LWS_LEADER_ADDRESS)"
            - "--master-port=29500"
            - "--trust-remote-code"
            - "--port=8000"
          env:
          - name: LWS_LEADER_ADDRESS
            valueFrom:
              fieldRef:
                fieldPath: status.podIP
          - name: VLLM_ENGINE_READY_TIMEOUT_S
            value: "1800"
          - name: NCCL_DEBUG
            value: "INFO"
          resources:
            limits:
              nvidia.com/gpu: 8
    workerTemplate:
      metadata:
        labels:
          role: worker
      spec:
        containers:
        - name: vllm
          image: <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/vllm-glm5:nightly
          command: ["vllm", "serve"]
          args:
            - "zai-org/GLM-5-FP8"
            - "--tensor-parallel-size=8"
            - "--pipeline-parallel-size=2"
            - "--node-rank=1"
            - "--master-addr=$(LWS_LEADER_ADDRESS)"
            - "--master-port=29500"
            - "--trust-remote-code"
            - "--port=8001"  # Worker는 다른 포트
          env:
          - name: VLLM_ENGINE_READY_TIMEOUT_S
            value: "1800"
          - name: NCCL_DEBUG
            value: "INFO"
          resources:
            limits:
              nvidia.com/gpu: 8
```

### 성공한 부분

#### 1. NCCL 16 rank 연결 성공

```bash
# Leader Pod 로그
vllm-glm5-0 vllm[1234]: NCCL INFO rank 0 initialized 16 ranks on 2 nodes
vllm-glm5-0 vllm[1234]: NCCL INFO Using network Socket
vllm-glm5-0 vllm[1234]: NCCL INFO Channel 00/02: 0/0 -> 8/0 [0x10] via NET/Socket/0
...
vllm-glm5-0 vllm[1234]: NCCL INFO 16 Ranks, 16 CONNECTED

# Worker Pod 로그
vllm-glm5-0-1 vllm[5678]: NCCL INFO rank 8 initialized 16 ranks on 2 nodes
vllm-glm5-0-1 vllm[5678]: NCCL INFO Using network Socket
```

NCCL이 16 ranks (각 노드 8개 GPU × 2 노드)를 성공적으로 연결했습니다.

#### 2. 모델 가중치 분산 로딩 성공

```bash
# Leader: 43GB VRAM 사용
vllm-glm5-0 vllm[1234]: Model weights loaded: 43.2GB / 80GB

# Worker: 43GB VRAM 사용
vllm-glm5-0-1 vllm[5678]: Model weights loaded: 43.5GB / 80GB
```

744GB 모델이 2개 노드에 균등하게 분산되었습니다.

#### 3. LWS_LEADER_ADDRESS 자동 주입

LWS가 Leader Pod의 IP를 Worker에게 자동으로 전달했습니다.

```bash
# Worker Pod 환경변수
echo $LWS_LEADER_ADDRESS
10.0.45.123  # Leader Pod IP
```

#### 4. Worker 포트 분리

Leader는 8000번, Worker는 8001번 포트를 사용하여 충돌을 방지했습니다.

:::tip restartPolicy: Default
`restartPolicy: Default`는 Worker Pod만 재시작하고, Leader는 유지합니다. 이는 Worker의 일시적 장애 시 전체 그룹을 재시작하지 않아도 되므로 안정성을 높입니다.
:::

## 8. K8s Service 네이밍 주의

Kubernetes는 Service 이름을 기반으로 환경변수를 자동 생성합니다. 이로 인해 예상치 못한 vLLM 설정 오류가 발생할 수 있습니다.

### 문제 상황

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vllm-glm5  # ❌ vllm- prefix 사용
spec:
  selector:
    app: vllm-glm5
  ports:
  - port: 8000
    targetPort: 8000
```

위와 같이 Service 이름을 `vllm-glm5`로 지정하면, Kubernetes가 다음 환경변수를 자동 생성합니다:

```bash
VLLM_GLM5_SERVICE_HOST=10.100.45.67
VLLM_GLM5_SERVICE_PORT=8000
VLLM_GLM5_PORT=tcp://10.100.45.67:8000
VLLM_GLM5_PORT_8000_TCP=tcp://10.100.45.67:8000
VLLM_GLM5_PORT_8000_TCP_ADDR=10.100.45.67
VLLM_GLM5_PORT_8000_TCP_PORT=8000
VLLM_GLM5_PORT_8000_TCP_PROTO=tcp
```

vLLM은 `VLLM_*` prefix를 가진 환경변수를 자체 설정으로 오인하여 다음과 같은 경고를 발생시킵니다:

```bash
WARNING: Unknown vLLM environment variable: VLLM_GLM5_SERVICE_HOST
WARNING: Unknown vLLM environment variable: VLLM_GLM5_SERVICE_PORT
```

### 해결: Service 이름에 vllm- prefix 사용 금지

```yaml
apiVersion: v1
kind: Service
metadata:
  name: glm5-serving  # ✅ vllm- prefix 제거
spec:
  selector:
    app: vllm-glm5
  ports:
  - port: 8000
    targetPort: 8000
```

이제 Kubernetes가 생성하는 환경변수는 `GLM5_SERVING_*`이므로 vLLM과 충돌하지 않습니다.

:::caution K8s 환경변수 자동 생성 규칙
Kubernetes는 Service 이름을 `<NAME>_<PORT>_` 형태로 변환하여 환경변수를 생성합니다. `vllm-`, `llm-`, `model-` 같은 일반적인 prefix는 사용을 피하세요.
:::

## 9. GPU Operator + Auto Mode 충돌

EKS Auto Mode는 내장 NVIDIA Device Plugin을 제공하는데, GPU Operator를 기본 설정으로 설치하면 충돌이 발생합니다.

### 문제 상황

```bash
# GPU Operator 기본 설치
helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace

# GPU 노드 확인
kubectl get nodes -l node.kubernetes.io/instance-type=p5en.48xlarge -o json | \
  jq '.items[0].status.allocatable'
{
  "nvidia.com/gpu": "0"  # ❌ GPU가 0개로 표시됨
}
```

### 원인

Auto Mode는 이미 NVIDIA Device Plugin을 내장하고 있습니다. GPU Operator의 `devicePlugin.enabled=true` (기본값)는 추가 Device Plugin을 설치하여 충돌을 일으킵니다.

```bash
# 충돌 확인
kubectl get pods -n gpu-operator | grep device-plugin
nvidia-device-plugin-daemonset-abcde   0/1     CrashLoopBackOff   5          3m
```

### 해결: devicePlugin.enabled=false

```bash
# GPU Operator 재설치 (Device Plugin 비활성화)
helm upgrade --install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace \
  --set devicePlugin.enabled=false \
  --set dcgm.enabled=true \
  --set dcgmExporter.enabled=true \
  --set gfd.enabled=true \
  --set nodeStatusExporter.enabled=true
```

이제 DCGM, GFD (GPU Feature Discovery), Node Status Exporter만 실행되며, Device Plugin은 Auto Mode의 내장 버전을 사용합니다.

```bash
# GPU 정상 인식 확인
kubectl get nodes -l node.kubernetes.io/instance-type=p5en.48xlarge -o json | \
  jq '.items[0].status.allocatable'
{
  "nvidia.com/gpu": "8"  # ✅ 8개 GPU 정상 인식
}
```

:::warning 충돌 후 GPU 노드 재생성 필요
Device Plugin 충돌이 발생한 후에는 GPU Operator를 재설치하더라도 GPU 노드를 재생성해야 합니다:

1. GPU 워크로드 삭제
2. NodeClaim 삭제 (Auto Mode) 또는 Node drain + 종료 (Standard Mode)
3. 새 GPU 노드 프로비저닝
:::

## 10. 추천 배포 아키텍처

위의 모든 lessons learned를 종합한 권장 아키텍처입니다.

```mermaid
graph TB
    subgraph "사전 준비 (1회)"
        HF[HuggingFace Hub<br/>zai-org/GLM-5-FP8]
        ECR_BUILD[ECR Image Build<br/>vllm-glm5:nightly<br/>transformers v5.5]
        S3_UPLOAD[S3 Upload<br/>s3://models/glm5-fp8/]
    end
    
    HF -->|huggingface-cli download| S3_UPLOAD
    
    subgraph "EKS Standard Mode (us-east-2)"
        MNG[MNG: p5en.48xlarge<br/>H200×8, 1,128GB<br/>Spot $12/hr]
        
        subgraph "Pod 초기화"
            INIT[initContainer<br/>s5cmd sync<br/>S3 → NVMe emptyDir]
        end
        
        subgraph "vLLM 서빙"
            VLLM[vLLM serve<br/>TP=8, 단일노드<br/>transformers v5.5]
        end
        
        S3_UPLOAD -->|s5cmd --numworkers 16| INIT
        ECR_BUILD -->|image pull| VLLM
        INIT -->|704GB 모델| VLLM
        MNG --> INIT
        MNG --> VLLM
    end
    
    VLLM --> SVC[Service: glm5-serving<br/>Port: 8000]
    SVC --> INGRESS[Ingress / Gateway API<br/>OpenAI API 엔드포인트]
    
    style S3_UPLOAD fill:#f9f,stroke:#333,stroke-width:2px
    style MNG fill:#bbf,stroke:#333,stroke-width:2px
    style VLLM fill:#bfb,stroke:#333,stroke-width:2px
```

### 배포 체크리스트

#### 1. 사전 준비 (1회만)

- [ ] HuggingFace에서 GLM-5-FP8 다운로드
- [ ] S3 버킷 생성 및 모델 업로드
- [ ] vLLM 커스텀 이미지 빌드 (transformers v5.5 포함)
- [ ] ECR에 푸시

#### 2. EKS 클러스터 구성

- [ ] EKS 클러스터 생성 (Standard Mode, Kubernetes 1.33)
- [ ] p5en.48xlarge MNG 생성 (Spot, 500GB EBS gp3)
- [ ] GPU Operator 설치 (`devicePlugin.enabled=false`)
- [ ] DCGM, GFD 정상 동작 확인

#### 3. vLLM Deployment

- [ ] Service 이름 검증 (vllm- prefix 없음)
- [ ] initContainer s5cmd 다운로드 설정
- [ ] NVMe emptyDir 800Gi 설정
- [ ] vLLM args: TP=8, --enforce-eager, --trust-remote-code
- [ ] Resource limits: 8 GPU

#### 4. 검증

- [ ] Pod 시작 성공 (initContainer 완료)
- [ ] 모델 로딩 성공 (VRAM ~744GB 사용)
- [ ] OpenAI API 응답 정상
- [ ] 성능 벤치마크 (tps, ttft, latency)

### 단일 노드 배포 YAML 전체 예시

```yaml
apiVersion: v1
kind: Service
metadata:
  name: glm5-serving
  namespace: default
spec:
  selector:
    app: vllm-glm5
  ports:
  - name: http
    port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-glm5
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-glm5
  template:
    metadata:
      labels:
        app: vllm-glm5
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge
      initContainers:
      - name: download-model
        image: public.ecr.aws/aws-cli/aws-cli:latest
        command: ["/bin/bash", "-c"]
        args:
          - |
            set -e
            echo "Installing s5cmd..."
            wget -q https://github.com/peak/s5cmd/releases/download/v2.2.2/s5cmd_2.2.2_Linux-64bit.tar.gz
            tar xzf s5cmd_2.2.2_Linux-64bit.tar.gz
            
            echo "Downloading GLM-5-FP8 from S3..."
            ./s5cmd --numworkers 16 sync \
              "s3://<MODEL_CACHE_BUCKET>/glm5-fp8/*" \
              /mnt/models/glm5-fp8/
            
            echo "Download complete. Model size:"
            du -sh /mnt/models/glm5-fp8/
        volumeMounts:
        - name: model-cache
          mountPath: /mnt/models
        env:
        - name: AWS_REGION
          value: us-east-2
        resources:
          requests:
            memory: "16Gi"
            cpu: "4"
          limits:
            memory: "32Gi"
            cpu: "8"
      containers:
      - name: vllm
        image: <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/vllm-glm5:nightly
        command: ["vllm", "serve"]
        args:
          - "zai-org/GLM-5-FP8"
          - "--download-dir=/mnt/models"
          - "--tensor-parallel-size=8"
          - "--enforce-eager"
          - "--trust-remote-code"
          - "--host=0.0.0.0"
          - "--port=8000"
          - "--max-model-len=32768"
          - "--gpu-memory-utilization=0.95"
        env:
        - name: VLLM_USE_DEEP_GEMM
          value: "1"
        - name: NCCL_DEBUG
          value: "WARN"
        - name: CUDA_VISIBLE_DEVICES
          value: "0,1,2,3,4,5,6,7"
        ports:
        - containerPort: 8000
          name: http
        volumeMounts:
        - name: model-cache
          mountPath: /mnt/models
        - name: shm
          mountPath: /dev/shm
        resources:
          limits:
            nvidia.com/gpu: 8
            memory: "800Gi"
          requests:
            nvidia.com/gpu: 8
            memory: "600Gi"
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 300
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 600
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
      volumes:
      - name: model-cache
        emptyDir:
          medium: ""  # NVMe
          sizeLimit: 800Gi
      - name: shm
        emptyDir:
          medium: Memory
          sizeLimit: 64Gi
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
```

## 마무리

### 핵심 교훈 요약

1. **p5en.48xlarge Spot ($12/hr)를 선택하라** — p5와 동일 가격으로 1.76배 VRAM, 단일 노드 배포 가능
2. **Standard Mode + MNG가 가장 안정적** — Auto Mode의 인스턴스 타입 제약 없음
3. **vLLM 커스텀 이미지 필수** — transformers v5.5로 GLM-5 지원
4. **S3 + s5cmd + NVMe emptyDir** — 15분 내 704GB 모델 다운로드
5. **vLLM PP 멀티노드는 피하라** — 2026.04 기준 불안정, SGLang 또는 단일 노드 권장
6. **Service 이름에 vllm- prefix 금지** — K8s 환경변수 충돌
7. **GPU Operator는 devicePlugin=false** — Auto Mode 내장 Device Plugin 사용

### 다음 단계

- [ ] **Monitoring**: DCGM Exporter + Prometheus + Grafana 대시보드 구성
- [ ] **Autoscaling**: KEDA + Prometheus로 큐 길이 기반 오토스케일링
- [ ] **Disaggregated Serving**: llm-d로 prefill/decode 분리 (섹션 6 참조)
- [ ] **Gateway**: LiteLLM 또는 Bifrost로 멀티 모델 라우팅
- [ ] **Observability**: Langfuse 또는 Helicone로 추론 요청 추적

## 11. 배포 검증 결과 (2026-04-03)

:::tip 배포 성공
아래 구성으로 GLM-5.1 (744B MoE FP8) 서빙에 성공했습니다.
:::

### 최종 배포 스펙

| 항목 | 값 |
|------|-----|
| 클러스터 | `glm5-std-us-east-2` (EKS Standard Mode, K8s 1.35) |
| 인스턴스 | **p5en.48xlarge** (H200×8, 1,128GB VRAM) |
| Capacity | **Spot** (~$12/hr, On-Demand $76/hr 대비 84% 절감) |
| GPU 사용량 | 131.7 GB / 143.7 GB per GPU (91.6%) |
| 디스크 | **2TB** (모델 704GB + 여유 1.3TB) |
| 모델 캐시 | S3 → `aws s3 sync` (병렬 50) → NVMe emptyDir |
| vLLM | v0.18.2rc1 nightly + transformers v5.5.0.dev0 |
| TP | 8 (PP 불필요) |
| max_model_len | 32,768 |
| max_num_seqs | 64 |

### 추론 응답 예시

```json
{
  "model": "glm-5",
  "choices": [{
    "message": {
      "role": "assistant",
      "reasoning": "We need to write a Python function...",
      "content": "def is_prime(n: int) -> bool: ..."
    },
    "finish_reason": "length"
  }],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 200
  }
}
```

### 배포 시 주의사항

:::caution 디스크 크기 설정
GLM-5 FP8 (704GB) 배포 시 MNG `disk-size`를 **최소 1500GB, 권장 2000GB**로 설정하세요. emptyDir은 노드의 ephemeral storage를 사용하므로, 500GB 디스크에서는 `ephemeral-storage eviction`이 발생합니다.
:::

:::warning EKS 모드 선택
대형 GPU 인스턴스 (p5en, p6) 배포 시 **EKS Standard Mode**를 사용하세요. Auto Mode + MNG 하이브리드는 MNG 생성이 30분+ 지연되거나 실패합니다.
:::

## 12. 모니터링 및 Observability 구성

### 아키텍처 개요

```mermaid
graph LR
    subgraph "EKS Cluster"
        Client[Aider/IDE] --> KGW[kgateway NLB]
        KGW -->|/v1/*| BF[Bifrost]
        BF --> VLLM[vLLM GLM-5]
        BF -->|OTel traces| KGW2[kgateway URLRewrite]
        KGW2 -->|/api/public/otel/v1/traces| LF[Langfuse]
        VLLM -->|/metrics scrape| PROM[Prometheus]
        BF -->|:9090/metrics| PROM
        PROM -->|remote-write<br/>Pod Identity| AMP[AMP]
    end
    
    subgraph "AWS Managed"
        AMP -->|SigV4 ec2_iam_role| AMG[AMG Grafana]
    end
    
    style AMP fill:#ff9900
    style AMG fill:#ff9900
    style LF fill:#4c9aff
    style BF fill:#2ecc71
```

### 12-1. Prometheus → AMP (Pod Identity 인증)

Prometheus가 AMP로 메트릭을 전송하려면 **Pod Identity**로 `aps:RemoteWrite` 권한이 필요합니다. 배포 스크립트 (`monitoring/install.sh`)가 자동으로 처리합니다.

**핵심 구성 요소:**

| 구성 | 값 | 비고 |
|------|-----|------|
| IAM Role | `prometheus-amp-remote-write` | `AmazonPrometheusRemoteWriteAccess` 정책 |
| 인증 방식 | **Pod Identity** (IRSA 불필요) | `aws eks create-pod-identity-association` |
| ServiceAccount | `prometheus-kube-prometheus-prometheus` | Helm 차트 기본 SA |

```bash
# Pod Identity 생성 (install.sh에서 자동 실행)
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER_NAME> \
  --namespace monitoring \
  --service-account prometheus-kube-prometheus-prometheus \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/prometheus-amp-remote-write
```

:::tip Pod Identity vs IRSA
Pod Identity는 OIDC Provider 설정 없이 한 줄 명령으로 완료됩니다. EKS 1.28+ 클러스터에서는 Pod Identity를 권장합니다.
:::

### 12-2. AMG 데이터 소스 설정

AMG에서 AMP를 데이터 소스로 추가할 때 **SigV4 auth type을 `ec2_iam_role`로 설정**해야 합니다.

```bash
# Grafana API로 AMP 데이터 소스 추가
curl -X POST "https://<GRAFANA_ENDPOINT>/api/datasources" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amazon Managed Prometheus",
    "type": "prometheus",
    "url": "https://aps-workspaces.<REGION>.amazonaws.com/workspaces/<AMP_WS_ID>/",
    "access": "proxy",
    "isDefault": true,
    "jsonData": {
      "httpMethod": "POST",
      "sigV4Auth": true,
      "sigV4AuthType": "ec2_iam_role",
      "sigV4Region": "<REGION>"
    }
  }'
```

:::caution SigV4 auth type
`ec2_iam_role`을 사용하세요. `workspace-iam-role`은 유효하지 않은 값으로 502 에러를 반환합니다. AMG workspace IAM Role에 `AmazonPrometheusQueryAccess` 정책이 연결되어 있어야 합니다.
:::

### 12-3. Langfuse 배포 주의사항

Langfuse Helm 차트 배포 시 3가지 핵심 설정이 필요합니다:

#### 1. Redis 패스워드 주입 (Worker CrashLoopBackOff 방지)

Langfuse Helm 차트는 Bitnami Redis (Valkey) 서브차트를 사용하며, Secret 키 이름이 `valkey-password`입니다. Helm 차트가 이 패스워드를 Worker의 `REDIS_CONNECTION_STRING`에 자동으로 포함하지 않으므로 수동 주입이 필요합니다.

```bash
# 배포 스크립트 (langfuse/install.sh)에서 자동 처리
REDIS_PW=$(kubectl get secret langfuse-redis -n langfuse \
  -o jsonpath='{.data.valkey-password}' | base64 -d)
kubectl set env deploy/langfuse-worker deploy/langfuse-web -n langfuse \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PW}@langfuse-redis-primary:6379/0"
```

#### 2. NEXTAUTH_URL 설정

`NEXTAUTH_URL`을 실제 접근 가능한 URL로 설정해야 합니다 (`localhost:3000` 금지).

```bash
kubectl set env deploy/langfuse-web -n langfuse \
  NEXTAUTH_URL="http://<NLB_ENDPOINT>/langfuse"
```

#### 3. kgateway Sub-path 라우팅 (URLRewrite + Static Assets)

Langfuse (Next.js)는 `/`에서 서빙하므로, `/langfuse` prefix로 접근하려면:

1. **URLRewrite**: `/langfuse` → `/`로 prefix 제거
2. **Static Assets**: `/_next/*`, `/api/auth/*`, `/api/public/*`, `/icon.svg`도 Langfuse로 라우팅

```yaml
# kgateway HTTPRoute (gateway.yaml에 포함)
rules:
  # /langfuse → / prefix 제거
  - matches:
    - path: { type: PathPrefix, value: /langfuse }
    filters:
    - type: URLRewrite
      urlRewrite:
        path: { type: ReplacePrefixMatch, replacePrefixMatch: / }
    backendRefs:
    - name: langfuse-web
      namespace: langfuse
      port: 3000
  # Next.js static assets + auth API
  - matches:
    - path: { type: PathPrefix, value: /_next }
    backendRefs: [{ name: langfuse-web, namespace: langfuse, port: 3000 }]
  - matches:
    - path: { type: PathPrefix, value: /api/auth }
    backendRefs: [{ name: langfuse-web, namespace: langfuse, port: 3000 }]
```

#### 4. MinIO S3 Secret Key 주입

Langfuse Helm 차트가 MinIO S3 secret key를 환경변수에 자동으로 주입하지 않습니다. 누락 시 OTel trace 수신에서 500 에러가 발생합니다.

```bash
# MinIO 패스워드 확인
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse \
  -o jsonpath='{.data.root-password}' | base64 -d)

# Web + Worker 모두 주입
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```

:::info 배포 스크립트에서 자동 처리
위의 모든 설정은 `deploy/full-platform/manifests/` 하위 스크립트에서 자동으로 처리됩니다. 수동 수정 없이 `deploy-glm5.sh` 한 번 실행으로 전체 스택이 올바르게 구성됩니다.
:::

:::warning 프로덕션 Hardening
현재 구성은 아키텍처 검증 및 데모 목적입니다. 프로덕션 환경에서는 다음을 추가로 구성해야 합니다:
- **TLS**: NLB에 ACM 인증서 + HTTPS 리스너
- **인증**: Langfuse SSO/OIDC, Bifrost API Key 인증
- **Pod Security**: `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`
- **NetworkPolicy**: 네임스페이스 간 트래픽 격리
- **HA**: PostgreSQL → RDS Multi-AZ, Redis → ElastiCache, Langfuse HPA
- **Secrets**: S3 + KMS 암호화 (MinIO → AWS S3 전환), AWS Secrets Manager
:::

### 12-4. Kiro vs 자체 호스팅 비교

2026년 4월, [Kiro IDE에서 GLM-5를 네이티브 지원](https://kiro.dev/changelog/models/glm-5-now-available-in-kiro)하기 시작했습니다. Kiro가 오픈 웨이트 모델을 자체 인프라(us-east-1)에서 호스팅하여 0.5x credit으로 제공합니다.

| | **Kiro 호스팅** | **자체 호스팅 (EKS + vLLM)** |
|---|---|---|
| **인프라** | Kiro/AWS 관리 | 직접 운영 (EKS + GPU 노드) |
| **비용** | 사용량 과금 (0.5x credit) | GPU Spot ~$12/hr |
| **LoRA Fine-tuning** | ❌ 불가 | ✅ 도메인 특화 커스터마이징 |
| **데이터 주권** | Kiro 인프라 경유 | ✅ VPC 내 완전 격리 |
| **컴플라이언스** | Kiro 정책 의존 | ✅ SOC2/ISO27001 자체 통제 |
| **Observability** | Kiro 대시보드 | ✅ Langfuse + AMP/AMG 완전 제어 |
| **게이트웨이** | 없음 | ✅ Bifrost (guardrails, caching) |
| **Steering/Spec** | ✅ 네이티브 | 별도 구현 필요 |
| **커스텀 엔드포인트** | ❌ Kiro 모델 목록만 | ✅ 자유 설정 |
| **시작 난이도** | 즉시 | 높음 |

:::tip 자체 호스팅이 필요한 경우
- **FSI/규제 산업**: 데이터가 외부 서비스를 경유할 수 없는 환경 (VPC 격리 필수)
- **LoRA Fine-tuning**: COBOL→Java 전환, 사내 프레임워크 코드 생성 등 도메인 특화
- **멀티 고객 운영**: 고객별 LoRA 어댑터 핫스왑 + Bifrost 라우팅
- **완전한 Observability**: 모든 trace/metric을 자체 Langfuse + AMP로 수집
:::

:::info Kiro가 적합한 경우
- 인프라 구성 없이 GLM-5를 빠르게 프로토타이핑
- Kiro Steering/Spec 네이티브 워크플로우 활용
- GPU 인프라 운영 부담을 줄이려는 소규모 팀
:::

### 12-5. 코딩 도구 연결 (Aider)

[Aider](https://aider.chat)는 가장 널리 사용되는 오픈소스 AI 코딩 도구로, OpenAI-compatible API를 지원합니다.

#### Aider 설치 및 연결

```bash
# Aider 설치
pip install aider-chat

# GLM-5 연결 (Bifrost 경유 → Langfuse 모니터링)
# Bifrost provider/model 포맷 호환을 위한 double-prefix
aider --model openai/openai/glm-5 \
  --openai-api-base http://<NLB_ENDPOINT>/v1 \
  --openai-api-key dummy
```

:::caution Bifrost 모델명 정규화
Bifrost는 내부적으로 모델명의 하이픈을 제거합니다 (`glm-5` → `glm5`). vLLM의 `--served-model-name`을 Bifrost 정규화 결과와 일치시켜야 합니다:
- vLLM: `--served-model-name=glm5` (하이픈 없음)
- Bifrost config: `"models": ["glm-5", "glm5"]` (둘 다 포함)
- Bifrost Feature Request [#1058](https://github.com/maximhq/bifrost/issues/1058): 모델 alias 기능 요청 중 (2025.12~)
:::

#### 지원 코딩 도구 비교

| 도구 | model 필드 전달 | Bifrost 호환 | 설정 방법 |
|------|----------------|-------------|----------|
| **Cline** | 그대로 전달 | ✅ | Model ID: `openai/glm-5` |
| **Continue.dev** | 그대로 전달 | ✅ | model: `openai/glm-5` |
| **Aider** | LiteLLM prefix 제거 | ⚠️ double-prefix 필요 | `openai/openai/glm-5` |
| **Cursor** | 자체 검증 거부 | ❌ | 미지원 |

:::tip Aider 권장 이유
Aider는 Git-aware 코드 수정 + 자동 커밋을 지원하며, double-prefix 트릭 (`openai/openai/glm-5`)으로 Bifrost 경유 → Langfuse 모니터링이 가능합니다. CLI 기반이라 CI/CD 파이프라인에서도 활용 가능합니다.
:::

### 12-6. Langfuse S3 + KMS 구성

프로덕션 환경에서는 Langfuse 내장 MinIO를 **AWS S3 + KMS**로 교체합니다.

| | MinIO (기본) | AWS S3 + KMS |
|---|---|---|
| 가용성 | 단일 Pod | 11 nines |
| 암호화 | ❌ | ✅ SSE-KMS |
| 인증 | Access Key | Pod Identity |
| 비용 | 클러스터 리소스 | S3 저장 + 요청 |

```bash
# S3 버킷 + KMS 키 생성
aws s3api create-bucket --bucket langfuse-traces-<ACCOUNT_ID> --region <REGION>
aws kms create-key --description "Langfuse trace encryption"

# S3 기본 암호화 (KMS)
aws s3api put-bucket-encryption --bucket langfuse-traces-<ACCOUNT_ID> \
  --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "<KMS_KEY_ID>"}, "BucketKeyEnabled": true}]}'

# Pod Identity로 인증 (Access Key 불필요)
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER> --namespace langfuse \
  --service-account langfuse \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/langfuse-s3-access

# Langfuse 환경변수 변경 (MinIO 제거 → S3)
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_BUCKET="langfuse-traces-<ACCOUNT_ID>" \
  LANGFUSE_S3_EVENT_UPLOAD_REGION="<REGION>" \
  LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT- \
  LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID- \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY- \
  LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE-
```

### 12-7. 추천 PromQL 쿼리

| 메트릭 | PromQL | 용도 |
|--------|--------|------|
| GPU 사용률 | `DCGM_FI_DEV_GPU_UTIL` | GPU 활성도 |
| GPU 메모리 | `DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE` | VRAM 사용률 |
| vLLM TPS | `rate(vllm:request_success_total[5m])` | 추론 처리량 |
| vLLM TTFT P99 | `histogram_quantile(0.99, rate(vllm:time_to_first_token_seconds_bucket[5m]))` | 첫 토큰 지연 |
| Bifrost 요청 | `rate(bifrost_requests_total[5m])` | 게이트웨이 요청률 |

## 13. 관련 문서

- [Inference Gateway 라우팅](../gateway-agents/inference-gateway-routing.md) — kgateway + Bifrost + 코딩 도구 연결
- [LLMOps Observability](../operations-mlops/llmops-observability.md) — Langfuse 배포 및 vLLM 연동
- [Agent 모니터링](../operations-mlops/agent-monitoring.md) — AMP/AMG + vLLM GPU 모니터링

## 14. EKS Auto Mode 인스턴스 지원 확인

EKS Auto Mode에서 GPU 인스턴스 지원 여부 확인 방법은 [EKS GPU 노드 전략](./eks-gpu-node-strategy.md#eks-auto-mode-인스턴스-지원-확인)을 참조하세요.

### 참고 자료

- [GLM-5 Model Card](https://huggingface.co/zai-org/GLM-5-FP8)
- [vLLM Documentation](https://docs.vllm.ai/)
- [SGLang GLM-5 Guide](https://sglang.readthedocs.io/en/latest/models/glm5.html)
- [LeaderWorkerSet GitHub](https://github.com/kubernetes-sigs/lws)
- [NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/)
- [s5cmd GitHub](https://github.com/peak/s5cmd)

---

이 가이드는 실제 배포 경험을 바탕으로 작성되었습니다. 질문이나 개선 제안은 이슈로 남겨주세요.
