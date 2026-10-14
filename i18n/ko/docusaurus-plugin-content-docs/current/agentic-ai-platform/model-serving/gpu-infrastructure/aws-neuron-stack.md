---
title: AWS Neuron Stack — Trainium2/Inferentia2 on EKS
description: EKS 위에서 AWS 커스텀 AI 가속기(Trainium2/Inferentia2)를 운영하기 위한 Neuron SDK, Device Plugin, NxD Inference 가이드
created: "2026-04-17"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 28
tags:
  - trainium2
  - inferentia2
  - neuron-sdk
  - aws-accelerator
  - eks
  - vllm-neuron
  - nxd-inference
  - inference
  - scope:tech
sidebar_label: AWS Neuron Stack
---

AWS Neuron은 AWS가 설계한 AI 가속기(Trainium, Inferentia) 위에서 학습·추론 워크로드를 실행하기 위한 소프트웨어 스택입니다. NVIDIA의 CUDA + GPU Operator 조합이 NVIDIA GPU 상에서 수행하는 역할과 유사하게, Neuron SDK + Neuron Device Plugin 이 EKS 위에서 Trainium/Inferentia 칩을 Kubernetes 리소스로 추상화합니다.

이 문서는 Trainium2/Inferentia2 인스턴스를 EKS에서 운영하기 위한 Neuron 소프트웨어 스택, Device Plugin, Karpenter 구성, 추론 프레임워크 선택 기준을 다룹니다. NVIDIA GPU 기반 스택은 [NVIDIA GPU 스택](./nvidia-gpu-stack.md)을, 노드 타입 선택 전반은 [EKS GPU 노드 전략](./eks-gpu-node-strategy.md)을 참조하세요.

| 계층 | 역할 | 핵심 컴포넌트 |
|------|------|-------------|
| **인프라 자동화** | Neuron 드라이버, 런타임, Device Plugin | aws-neuron-dkms, neuron-device-plugin |
| **컴파일러** | 모델 → NEFF(Neuron Executable) 컴파일 | neuronx-cc (Neuron Compiler) |
| **런타임** | NeuronCore 실행, 메모리 관리 | aws-neuron-runtime, neuronx-collectives |
| **추론 프레임워크** | 대규모 LLM 서빙 | NxD Inference, vLLM Neuron backend, TGI Neuron |
| **관측** | NeuronCore 메트릭, 프로파일링 | neuron-monitor, neuron-top, neuron-ls |

---

## 1. 왜 Neuron 인가

### 1.1 Neuron 을 선택하는 세 가지 이유

**1) 비용 효율성 (Per-Token TCO) — 검증이 필요한 가설**

AWS 는 Trainium2/Inferentia2 가 유사 성능 GPU 대비 토큰당 비용 우위를 가진다고 홍보하지만, 이는 모든 모델·트래픽·리전에 보편적으로 성립하는 확정된 사실이 아니라 **본인의 워크로드에서 직접 검증해야 하는 가설** 입니다. AWS 공식 자료의 비교값은 특정 모델·배치·정밀도 조건에서 측정된 것이므로, 다음 조건이 충족될 때 우위가 나타날 가능성이 높다는 **선택 고려사항** 으로만 다루세요.

- 장기간(예: 3개월 이상) 지속되는 안정적 추론 트래픽
- FP8/INT8/BF16 기반 표준 Transformer 계열 모델
- AWS Reserved/Savings Plan 적용 가능한 워크로드

비용을 비교할 때는 광고된 시간당 단가가 아니라 **동일한 지연·처리량 SLO 조건에서 측정한 "수용된 토큰당 비용(cost per accepted token)"** 을 기준으로, 대상 모델·리전·시점의 실제 가격으로 재계산하세요. 이 문서는 가격 수치를 명시하지 않으며, 현재 가격은 AWS 공식 가격 페이지와 Pricing Calculator 로 확인해야 합니다.

**2) Capacity 가용성 — 시점·리전 종속 가설**

NVIDIA H100/H200/B200 공급이 타이트한 시기에 Trainium2 가 상대적으로 확보가 용이할 수 있으나, 가속기 가용성은 리전·시점·계정 할당량에 따라 달라지므로 **보편적 조달 우위로 단정할 수 없습니다**. 특정 리전에서 p5/p5en 재고가 부족할 때 Neuron 이 대안이 될 수 있다는 서술은 과거·일부 리전의 관찰에 근거한 가설이며, 배포 직전 대상 리전에서 On-Demand/Spot/Capacity Reservation 가용성을 AWS 콘솔 또는 계정 팀으로 직접 확인해야 합니다.

**3) Bedrock 과의 연속성**

Bedrock 이 서빙하는 일부 FM(Claude, Llama, Titan 등)은 내부적으로 Neuron 스택 위에서 동작합니다(AWS 공식 확인: Bedrock FAQ는 Trainium2 사용을 명시, AWS CMO Julia White는 2025-10 인터뷰에서 "Bedrock의 절반 이상이 Trainium에서 구동"이라고 공개). Bedrock → Self-hosted 마이그레이션 경로에서 Neuron 을 선택하면 Neuron 운영 패턴(모니터링·NEFF 캐시 관리·거버넌스)을 재사용할 수 있습니다. 단, Bedrock은 fully managed API 서비스로 내부 컴파일 아티팩트(NEFF)는 고객에게 노출·내보내기되지 않으며, NEFF는 배치 크기·TP 구성·Neuron SDK 메이저 버전에 종속되어 호환성이 보장되지 않습니다.

### 1.2 적합/비적합 워크로드

| 구분 | 워크로드 |
|------|---------|
| **적합** | 표준 Llama/Mistral/Qwen 계열 추론, 대규모 장기 운영, FP8/BF16 기반 서빙, Bedrock 스타일 거버넌스 |
| **주의 필요** | 신규 아키텍처 최초 출시 모델(지원 지연), 커스텀 CUDA 커널 의존 워크로드, AWQ/GPTQ 일부 양자화 포맷 |
| **부적합** | 연구·실험 환경에서 모델 구조를 자주 바꾸는 경우, CUDA 전용 라이브러리(Triton inference server custom kernels)에 강하게 결합된 코드 |

:::info Neuron vs NVIDIA 의사결정 원칙
- **모델 생태계 최신성이 핵심** → NVIDIA GPU (H100/H200/B200)
- **장기 운영 TCO / Capacity 가 핵심** → Trainium2 / Inferentia2
- **Bedrock 과 하이브리드 운영** → Neuron 우선 검토
:::

---

## 2. 인스턴스 라인업

AWS 공식 제품 페이지 및 EC2 사용자 가이드 기준 2026-04 시점의 Neuron 인스턴스 라인업입니다. 실제 리전별 가용성은 AWS 콘솔에서 확인해야 합니다.

### 2.1 추론 전용 인스턴스 (Inferentia2)

| 인스턴스 | 칩 수 | NeuronCore | 총 가속기 메모리 | vCPU | 메모리 | 네트워크 |
|---------|------|-----------|----------------|------|-------|---------|
| inf2.xlarge | 1× Inferentia2 | 2 | 32 GB | 4 | 16 GB | 최대 15 Gbps |
| inf2.8xlarge | 1× Inferentia2 | 2 | 32 GB | 32 | 128 GB | 최대 25 Gbps |
| inf2.24xlarge | 6× Inferentia2 | 12 | 192 GB | 96 | 384 GB | 50 Gbps |
| inf2.48xlarge | 12× Inferentia2 | 24 | 384 GB | 192 | 768 GB | 100 Gbps |

### 2.2 학습·추론 겸용 인스턴스 (Trainium1/Trainium2)

| 인스턴스 | 칩 수 | NeuronCore | 총 가속기 메모리 | vCPU | 메모리 | 네트워크 |
|---------|------|-----------|----------------|------|-------|---------|
| trn1.2xlarge | 1× Trainium1 | 2 | 32 GB | 8 | 32 GB | 최대 12.5 Gbps |
| trn1.32xlarge | 16× Trainium1 | 32 | 512 GB | 128 | 512 GB | 800 Gbps EFA |
| trn1n.32xlarge | 16× Trainium1 | 32 | 512 GB | 128 | 512 GB | 1,600 Gbps EFA |
| trn2.48xlarge | 16× Trainium2 | 128 (물리) | 1.5 TB (HBM3) | 192 | 2 TiB | 3.2 Tbps EFA v3 |
| **Trn2 UltraServer** (trn2u, 4×trn2.48xlarge) | 64× Trainium2 (4×trn2 NeuronLink) | 512 (물리) | 6 TB (HBM3) | - | - | 12.8 Tbps |

:::caution Trn2 UltraServer 가용성
Trn2 UltraServer(trn2u, 4대의 trn2.48xlarge 를 NeuronLink 로 연결한 ultraserver)는 2026-04 기준 **preview 또는 제한 가용성** 상태로, 본 문서 전반(섹션 7의 모델 매트릭스 포함)에서 UltraServer 관련 서술은 동일한 가용성 제약을 공유합니다. 일반 가용성·리전 범위·Spot 지원 여부는 AWS 계정 팀 또는 공식 문서로 반드시 확인하세요. UltraServer 는 단일 EC2 인스턴스가 아니라 여러 trn2 인스턴스를 묶은 구성이므로, 위 표의 trn2.48xlarge(단일 인스턴스) 수치와 혼동하지 마세요.
:::

:::caution 버전·수치 주의
- NeuronCore 수 및 메모리 용량은 AWS 공식 자료 기준이며 SDK 릴리스에 따라 보고 단위가 달라질 수 있습니다. 배포 전 `neuron-ls` 로 실제 디바이스를 확인하세요.
- 위 표의 NeuronCore 수(trn2.48xlarge 128, UltraServer 512)는 **물리 NeuronCore** 기준입니다. Trn2 는 Logical NeuronCore(LNC) 설정에 따라 2개의 물리 코어를 1개의 논리 코어로 묶을 수 있고(기본값은 SDK·실행 환경에 따라 다름), 애플리케이션과 Device Plugin 이 보는 할당 가능 코어 수는 LNC 설정에 따라 물리 코어 수의 절반이 될 수 있습니다. 따라서 Device Plugin 의 `aws.amazon.com/neuroncore` 할당 가능 수가 애플리케이션이 사용하는 논리 코어 수와 항상 같다고 가정하지 말고, `neuron-ls` 와 LNC 구성([Logical NeuronCore configuration](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/general/arch/neuron-features/logical-neuroncore-config.html))으로 실제 노출 값을 확인하세요.
- inf1 (1세대 Inferentia) 은 본 문서에서 다루지 않습니다. 신규 배포에는 Inferentia2/Trainium2 를 사용하세요.
:::

---

## 3. Neuron SDK 2.x 스택 아키텍처

### 3.1 계층 구조

```mermaid
flowchart TB
    subgraph App["Application Layer"]
        NXD["NxD Inference<br/>(PyTorch 기반)"]
        VLLM["vLLM Neuron backend"]
        TGI["TGI Neuron fork"]
        TORCH["torch-neuronx"]
    end

    subgraph Compiler["Compilation"]
        NCC["neuronx-cc<br/>Neuron Compiler"]
        NEFF["NEFF Artifact<br/>(컴파일된 실행 파일)"]
    end

    subgraph Runtime["Runtime Layer"]
        RT["aws-neuron-runtime<br/>libnrt.so"]
        COL["aws-neuronx-collectives<br/>(분산 통신)"]
    end

    subgraph K8s["Kubernetes Layer"]
        DP["neuron-device-plugin<br/>DaemonSet"]
        SCHED["kube-scheduler"]
    end

    subgraph Driver["Driver"]
        DKMS["aws-neuron-dkms<br/>커널 모듈"]
        HW["Trainium2 / Inferentia2<br/>하드웨어"]
    end

    NXD --> TORCH
    VLLM --> TORCH
    TGI --> TORCH
    TORCH --> NCC
    NCC --> NEFF
    NEFF --> RT
    RT --> COL
    RT --> DKMS
    DP --> SCHED
    DP --> DKMS
    DKMS --> HW

    style NXD fill:#ff9900,color:#fff
    style RT fill:#232f3e,color:#fff
    style DKMS fill:#146eb4,color:#fff
```

### 3.2 핵심 컴포넌트

| 컴포넌트 | 설명 | 배포 형태 |
|---------|------|---------|
| **aws-neuron-dkms** | Linux 커널 모듈. `/dev/neuron*` 디바이스 노드 생성 | AMI 사전 설치 또는 DKMS 패키지 |
| **aws-neuron-runtime (libnrt)** | NeuronCore 실행, 메모리 관리, 스케줄링 | 컨테이너 이미지 포함 |
| **aws-neuronx-collectives** | 분산 학습·추론용 collectives (AllReduce, AllGather 등) | 컨테이너 이미지 포함 |
| **neuronx-cc** | 그래프 컴파일러. PyTorch/JAX 모델을 NEFF 로 변환 | 개발·빌드 단계에서 사용 |
| **torch-neuronx** | PyTorch 2.x 프론트엔드. `torch.compile(backend="neuronx")` | pip 패키지 |
| **neuron-device-plugin** | Kubernetes Device Plugin. `aws.amazon.com/neuron*` 리소스 등록 | DaemonSet |
| **neuron-monitor / neuron-top / neuron-ls** | 관측 및 프로파일링 도구 | 컨테이너 이미지/CLI |

:::info Neuron SDK 2.x (2026-04 기준 최신 안정 버전)
Neuron SDK 는 2.x 릴리스 트레인에서 정기적으로 업데이트됩니다. 2026-04 기준 최신 안정 버전의 주요 특징:

- Trainium2 (trn2) + Trn2 UltraServer(NeuronLink) 정식 지원
- NxD Inference 의 LLM 라이브러리 (Llama 3/4, DBRX, Mistral 계열 pre-compiled checkpoint)
- vLLM Neuron backend 정식 지원 (continuous batching, PagedAttention-유사 구조)
- PyTorch 2.5+ / JAX 호환
- FP8 (E4M3/E5M2) 추론 경로

정확한 마이너 버전은 [AWS Neuron SDK Release Notes](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/release-notes/) 에서 확인하세요.
:::

### 3.3 컴파일 모델과 NEFF

Neuron은 **사전 컴파일(Ahead-of-Time, AOT)** 방식을 사용합니다. PyTorch eager 모드처럼 바로 실행하는 대신, 실행 전에 모델을 컴파일합니다. `neuronx-cc`는 모델의 출력을 계산하는 데 필요한 연산들을 나타내는 **연산 그래프**를 NeuronCore 하드웨어 명령어로 변환하고, 실행할 수 있도록 NEFF(Neuron Executable File Format) 파일에 저장합니다.

```
PyTorch / JAX 모델
        ↓  torch-neuronx trace/compile
Neuron IR (HLO)
        ↓  neuronx-cc
NEFF (Neuron Executable) — 최초 컴파일 5-30분, 이후 캐시 재사용
        ↓  aws-neuron-runtime
Trainium / Inferentia 하드웨어 실행
```

**운영상의 함의:**
- 첫 Pod 기동 시 NEFF 컴파일로 20-30분 이상 소요 가능 → **사전 컴파일 후 S3/ECR 에 캐싱**(사용자가 직접 생성·관리하는 컴파일 캐시)
- 그래프 구조(배치 크기·시퀀스 길이·TP 구성 등)가 바뀌면 재컴파일이 필요합니다. 다만 **가중치만 바뀌는 경우** 에는, 모델을 `torch_neuronx.trace(..., inline_weights_to_neff=False)` 로 가중치 분리 컴파일한 경우에 한해 `torch_neuronx.replace_weights()` 로 재컴파일 없이 가중치를 교체할 수 있습니다([replace_weights API](https://raw.githubusercontent.com/aws-neuron/aws-neuron-sdk/master/frameworks/torch/torch-neuronx/api-reference-guide/inference/api-torch-neuronx-replace-weights.rst)). `inline_weights_to_neff` 기본값은 `True` 이므로, 이 예외를 쓰려면 컴파일 시점에 명시적으로 분리 옵션을 지정해야 합니다. 따라서 "가중치 변경 = 항상 재컴파일" 은 기본 구성에서의 동작이며 보편 규칙이 아닙니다.
- NxD Inference 가 공식 모델에 대해 제공하는 **pre-compiled checkpoint** 는 위의 사용자 컴파일 캐시와 구분됩니다. 이는 AWS/벤더가 특정 모델·SDK·인스턴스 조합으로 미리 컴파일해 배포하는 아티팩트로, 제공 여부·대상 모델·버전은 해당 시점의 [NxD Inference 모델 레퍼런스](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/developer_guides/model-reference.html)에서 확인해야 하며 모든 모델에 보장되지 않습니다.

---

## 4. EKS 통합

### 4.1 Neuron Device Plugin 배포

Neuron Device Plugin 은 노드의 `/dev/neuron*` 디바이스를 Kubernetes 확장 리소스로 등록합니다. AWS 는 현재 **Helm 차트(OCI 레지스트리 배포)** 를 공식 설치 경로로 안내합니다.

```bash
# 공식 Helm 차트 기반 배포 (AWS 공식 문서 기준)
helm upgrade --install neuron-helm-chart \
  oci://public.ecr.aws/neuron/neuron-helm-chart \
  --set "npd.enabled=false"

# 설치 확인
kubectl get ds neuron-device-plugin -n kube-system
```

:::caution 레거시 raw manifest 주의
과거에 널리 인용된 `src/k8/k8s-neuron-device-plugin.yml` raw manifest 를 그대로 `kubectl apply` 하는 방식은 사용하지 마세요. 해당 manifest 의 DaemonSet nodeAffinity 는 trn2 를 포함하지 않는 버전이 있어, 의도한 trn2 노드에 Pod 가 스케줄되지 않을 수 있습니다. 반드시 위 Helm 차트를 사용하거나, raw manifest 를 쓸 경우 적용 전 nodeAffinity 의 `beta.kubernetes.io/instance-type`/`node.kubernetes.io/instance-type` 매칭에 trn2 가 포함되는지 직접 확인하세요. 설치 전 [EKS Prerequisites](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/containers/kubernetes-getting-started.html) 의 드라이버·커널 요구사항도 충족해야 합니다.
:::

배포 후 노드 리소스에 다음이 나타납니다.

```bash
kubectl describe node <trn2-node> | grep aws.amazon.com
# Allocatable:
#   aws.amazon.com/neuron:       16    # trn2.48xlarge: Trainium2 칩 수(디바이스 단위)
#   aws.amazon.com/neuroncore:  128    # 총 NeuronCore 수(물리 기준; LNC 설정에 따라 노출 값이 달라질 수 있음)
```

:::caution neurondevice 리소스 제거 (Neuron 2.20+)
Neuron SDK 2.20(2024-09)부터 `aws.amazon.com/neurondevice` 리소스는 `aws.amazon.com/neuron`으로 통합되어 제거되었습니다. 현행 Device Plugin(master YAML 기준 v2.22.4)은 `neuron`과 `neuroncore` 두 리소스만 등록합니다. 기존 YAML에서 `neurondevice`를 참조하면 스케줄링 실패합니다.
:::

### 4.2 리소스 요청 패턴

Pod 스펙에서 Neuron 리소스를 요청할 때 두 가지 단위 중 하나를 선택합니다.

| 리소스 | 의미 | 사용 시점 |
|-------|------|---------|
| `aws.amazon.com/neuron` | Neuron 칩 단위 (trn2 의 Trainium2 칩) | 칩 단위 할당이 명확한 경우 |
| `aws.amazon.com/neuroncore` | NeuronCore 단위 (trn2 칩당 8개) | 세밀한 코어 단위 스케줄링 |

```yaml
# 예: trn2.48xlarge 전체 사용 (칩 16개 = NeuronCore 128개)
apiVersion: v1
kind: Pod
metadata:
  name: llama3-70b-neuron
spec:
  nodeSelector:
    node.kubernetes.io/instance-type: trn2.48xlarge
  tolerations:
    - key: aws.amazon.com/neuron
      operator: Exists
      effect: NoSchedule
  containers:
    - name: server
      image: public.ecr.aws/neuron/pytorch-inference-neuronx:2.x
      resources:
        limits:
          aws.amazon.com/neuron: "16"
        requests:
          aws.amazon.com/neuron: "16"
```

```yaml
# 예: 단일 Pod 에 NeuronCore 4개 할당
# (한 Pod 는 하나의 노드에만 스케줄되므로, 할당 가능 코어가 4개 이상인 인스턴스가 필요합니다.
#  예: inf2.xlarge·inf2.8xlarge 는 NeuronCore 가 각 2개뿐이므로 부족하고,
#  inf2.24xlarge(12개)·inf2.48xlarge(24개)·trn2.48xlarge 처럼 요청량 이상을 가진 단일 인스턴스를 선택하세요.
#  코어를 여러 호스트에 걸쳐 요청할 수는 없습니다.
#  리소스 값은 정수여야 하며 "절반 코어" 같은 분수 요청은 허용되지 않습니다.)
resources:
  limits:
    aws.amazon.com/neuroncore: "4"
```

### 4.3 노드 Taint / Toleration 패턴

NVIDIA GPU 노드와 동일한 패턴을 권장합니다.

```yaml
# 노드에 taint 적용 (Karpenter NodePool 에서 설정)
taints:
  - key: aws.amazon.com/neuron
    effect: NoSchedule
```

```yaml
# Pod 에서 toleration 선언
tolerations:
  - key: aws.amazon.com/neuron
    operator: Exists
    effect: NoSchedule
```

### 4.4 AMI 선택

| AMI | Neuron 드라이버 | 권장 용도 |
|-----|--------------|---------|
| **EKS Optimized AMI (Neuron)** | 사전 설치 | 프로덕션 표준 — `--ami-type AL2023_x86_64_NEURON` 또는 동등 |
| **Deep Learning AMI (Neuron)** | 사전 설치 + Neuron SDK tools | 개발/디버깅 노드 |
| **일반 AL2023** | 수동 설치(DKMS) | 권장하지 않음 |

EKS 관리형 노드 그룹에서 Neuron 최적화 AMI 사용 시 `nodeadm` 이 Neuron 드라이버를 자동으로 구성합니다.

---

## 5. Karpenter NodePool 예시

### 5.1 trn2 학습/대형 추론 NodePool

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: neuron-trn2
spec:
  template:
    metadata:
      labels:
        accelerator: neuron
        accelerator-family: trainium2
    spec:
      requirements:
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["trn2"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: topology.kubernetes.io/zone
          operator: In
          values: ["us-east-2a", "us-east-2b", "us-east-2c"]
      taints:
        - key: aws.amazon.com/neuron
          effect: NoSchedule
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: neuron-nodeclass
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 10m
  limits:
    aws.amazon.com/neuron: "64"
```

### 5.2 inf2 저비용 추론 NodePool

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: neuron-inf2
spec:
  template:
    metadata:
      labels:
        accelerator: neuron
        accelerator-family: inferentia2
    spec:
      requirements:
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["inf2"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
      taints:
        - key: aws.amazon.com/neuron
          effect: NoSchedule
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: neuron-nodeclass
  limits:
    aws.amazon.com/neuron: "48"
```

### 5.3 EC2NodeClass (Neuron AMI)

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: neuron-nodeclass
spec:
  amiSelectorTerms:
    - alias: al2023@latest   # Neuron 최적화 AMI variant 를 사용하는 경우 명시적으로 id 지정 권장
  role: KarpenterNodeRole-eks-genai
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: eks-genai
        subnet-type: private
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: eks-genai
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 500Gi   # NEFF 캐시 + 모델 가중치 공간
        volumeType: gp3
        iops: 16000
        throughput: 1000
        encrypted: true
  metadataOptions:
    httpTokens: required
```

:::tip AMI 선택 주의
Karpenter EC2NodeClass 의 `amiSelectorTerms` 에서 `al2023` alias 동작은 Karpenter provider 버전에 따라 다릅니다. **karpenter-provider-aws v1.8.3 기준으로는** instance type 이 Neuron 계열(trn/inf)일 때 `al2023` alias 가 해당 노드에 맞는 **Neuron variant AMI(AL2023 x86_64 Neuron)** 를 자동으로 해석(discovery)합니다. 따라서 이 버전 이상에서는 Neuron 드라이버 사전 설치를 위해 SSM parameter 나 명시적 AMI ID 를 수동 지정할 필요가 없는 경우가 많습니다. 사용 중인 Karpenter 버전을 확인하고, 해석된 AMI 가 기대한 Neuron variant 인지 `kubectl get ec2nodeclass -o yaml` 의 status 로 검증하세요. UserData 로 Neuron DKMS 를 수동 설치하는 방식은 variant 자동 해석이 동작하지 않는 환경에서만 고려하세요.
:::

---

## 6. 추론 프레임워크

Neuron 에서 LLM 을 서빙하는 주요 프레임워크는 세 가지입니다.

### 6.1 NxD Inference (Neuron Distributed Inference)

AWS 가 공식 유지하는 **대규모 LLM 추론 라이브러리** 입니다. PyTorch 기반으로 Llama 계열 및 주요 공개 모델에 대해 Tensor/Pipeline Parallelism, Continuous Batching, PagedAttention 유사 메모리 관리, Speculative Decoding 을 제공합니다. NxD Inference 는 **실행 라이브러리** 로, 아래 vLLM·TGI 같은 서빙 프런트엔드가 내부적으로 호출하는 공통 실행 계층 역할도 합니다(별개의 대안이 아니라 상·하위 관계인 경우가 많음).

**특징:**
- Llama 3/4, DBRX, Mistral, Mixtral 등 공식 모델에 대한 **pre-compiled checkpoint 제공**(제공 여부·대상은 [모델 레퍼런스](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/developer_guides/model-reference.html)에서 시점별 확인)
- NeuronCore 단위의 TP/PP 구성 API
- Apache 2.0 / AWS 공식 지원

### 6.2 vLLM Neuron backend

vLLM 의 Neuron 지원은 **NxD Inference 를 실행 백엔드로 구동하는 vLLM 확장(plugin)** 형태입니다. 두 가지 경로가 있습니다: (1) AWS 가 유지하는 vLLM fork([upstreaming-to-vllm](https://github.com/aws-neuron/upstreaming-to-vllm))와 (2) 상위 vLLM 프로젝트의 플러그인([vllm-neuron](https://raw.githubusercontent.com/vllm-project/vllm-neuron/main/README.md), 2026-04 기준 **beta**). Neuron 전용 기능은 vLLM 의 `additional_config` 안의 `override_neuron_config` 를 통해 **NxD Inference 설정으로 전달** 됩니다. 지원 모델은 NxDI 가 지원하는 모델의 **부분집합** 입니다(Llama 3.x/4, Qwen 2.5/3 등).

**특징:**
- 서빙은 표준 vLLM 진입점을 사용합니다. 예: `vllm serve <model> --tensor-parallel-size N` 또는 `python3 -m vllm.entrypoints.openai.api_server --model <model> --tensor-parallel-size N --port 8000`. (과거 문서의 `vllm --device neuron …` 형태는 현행 진입점과 다릅니다.)
- PagedAttention 자체는 CUDA 구현이나, Neuron 경로는 블록 단위 KV 관리로 동등 기능을 제공
- 기능 지원 상태(continuous batching, chunked prefill, prefix caching, speculative decoding)는 경로·버전별로 다르므로 **플러그인/릴리스 노트와 지원 매트릭스 확인 필수**

### 6.3 TGI (Text Generation Inference) Neuron fork

HuggingFace 가 유지하는 TGI 의 **optimum-neuron** 기반 fork 입니다. `optimum-neuron[neuronx]` 패키지(공식 README 기준: `pip install --upgrade-strategy eager optimum-neuron[neuronx]`)를 통해 HuggingFace 모델을 Neuron 으로 컴파일·서빙합니다. 설치 전에 **Neuron 드라이버와 tools 가 먼저 설치되어 있어야 하며**, 추론용 vLLM 연동이 필요하면 `optimum-neuron[vllm]` extra 를 사용합니다. (`optimum[neuronx]` 는 잘못된 표기입니다 — 패키지 이름은 `optimum` 이 아니라 `optimum-neuron` 입니다.)

**특징:**
- HuggingFace Hub 기반 워크플로우와 긴밀하게 통합
- TGI 자체가 2025년부터 유지보수 모드 → 신규 기능은 vLLM 대비 느린 편
- SageMaker 의 HuggingFace LLM DLC 와의 호환성

### 6.4 프레임워크 비교

| 항목 | NxD Inference | vLLM Neuron backend | TGI Neuron fork |
|------|--------------|--------------------|-----------------| 
| **유지 주체** | AWS 공식 | vLLM 커뮤니티 + AWS 기여 | HuggingFace + AWS 기여 |
| **모델 커버리지** | AWS 선정 공식 모델 (Llama/Mistral/DBRX 등) | vLLM 지원 모델 중 Neuron 포팅된 것 | HuggingFace 모델 중 optimum-neuron 지원 |
| **pre-compiled checkpoint** | 제공 | 부분적 | 부분적 |
| **OpenAI 호환 API** | 지원 | 지원 | 지원 |
| **Continuous Batching** | 지원 | 지원 | 지원 |
| **Speculative Decoding** | 지원 (모델별) | 부분 지원 | 제한적 |
| **Prefix Caching** | 모델별 | 제한적 | 제한적 |
| **업데이트 속도** | AWS 릴리스 주기 | vLLM 릴리스 주기(빠름) | 느림(유지보수 모드) |
| **권장 용도** | AWS 공식 모델 대규모 프로덕션 | 다양한 모델·기능 최신 기능 활용 | HuggingFace 생태계 연속성 |

:::tip 프레임워크 선택 가이드
- **Llama 계열 대규모 프로덕션** → NxD Inference (pre-compiled checkpoint 이점)
- **다양한 모델, 최신 vLLM 기능 활용** → vLLM Neuron backend
- **HuggingFace Hub 기반 기존 파이프라인** → TGI Neuron fork
- **신규 프로젝트** 는 NxD Inference 또는 vLLM Neuron 중 택일을 권장
:::

---

## 7. 지원 모델 매트릭스

AWS Neuron 공식 Model Zoo 및 NxD Inference 지원 매트릭스 기준입니다. 최신 지원 범위는 [AWS Neuron Samples GitHub](https://github.com/aws-neuron/aws-neuron-samples) 및 [NxD Inference 문서](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/index.html) 를 확인하세요.

### 7.1 주요 공식 지원 모델 (2026-04 기준)

| 모델 | 크기 (활성/전체) | 권장 인스턴스 | Pre-compiled | 비고 |
|------|-----|------------|-------------|------|
| Llama 4 Scout (17Bx16E) | 17B 활성 / 109B 전체 (MoE) | trn2.48xlarge | 릴리스 기준 확인 | NxD 지원 — 지원 매트릭스 확인 |
| Llama 4 Maverick (17Bx128E) | 17B 활성 / 400B 전체 (MoE) | trn2.48xlarge / Trn2 UltraServer | 릴리스 기준 확인 | NxD 지원 — 지원 매트릭스 확인 |
| Mistral 7B / Mixtral 8x7B | 7B / 47B 전체 | inf2.48xlarge | 릴리스 기준 확인 | NxD/vLLM 지원 |
| Mixtral 8x22B | 141B 전체 | trn2.48xlarge | 릴리스 기준 확인 | MoE, EP 필요 |
| Qwen3 계열 | 4B-32B | inf2 / trn2 | 릴리스 기준 확인 | vLLM Neuron 경유 권장 |
| DBRX | 132B 전체 (36B 활성) | trn2.48xlarge | 릴리스 기준 확인 | MoE |
| DeepSeek V3 | 671B 전체 (37B 활성) MoE | Trn2 UltraServer | 릴리스 기준 확인 | 컴파일·메모리 제약 확인 필요 |

:::caution Pre-compiled 열의 의미와 Llama 4 파라미터
- **파라미터 표기**: Llama 4 는 MoE 모델로 활성(activated)·전체(total) 파라미터가 다릅니다. Meta 공식 모델 카드 기준 Scout 는 17B 활성/109B 전체(16 experts), Maverick 은 17B 활성/400B 전체(128 experts) 입니다. 과거 표의 "Scout 17B / Maverick 70B / Behemoth 288B+" 는 잘못된 값입니다(Behemoth 는 본 문서 작성 시점에 공개 릴리스되지 않았습니다).
- **Pre-compiled 열**: 특정 모델에 pre-compiled checkpoint 가 "제공됨(✅)"을 단정하려면 해당 아티팩트 경로·버전 근거가 필요합니다. 근거 없이 ✅ 로 단정하지 않고 **"릴리스 기준 확인"** 으로 표기했습니다. 실제 제공 여부는 배포 시점의 [NxD Inference 지원 매트릭스](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/developer_guides/model-reference.html)와 Release Notes 로 확인하세요.
- 모델×하드웨어×dtype×컨텍스트 길이 조합마다 지원 여부가 다르므로, 본 표는 참고용이며 구체 버전 지원을 보장하지 않습니다.
:::

### 7.2 양자화 지원

| 포맷 | Neuron 지원 |
|------|------------|
| BF16 | 기본 |
| FP16 | 지원 |
| FP8 (E4M3, E5M2) | Trainium2 지원, Inferentia2 제한적 |
| INT8 (weights) | 지원 (모델별) |
| AWQ | 제한적 (모델·버전별 확인 필요) |
| GPTQ | 제한적 |
| GGUF | 미지원 |

---

## 8. 관측성

### 8.1 Neuron 전용 도구

| 도구 | 역할 | 사용 시점 |
|-----|------|---------|
| **neuron-ls** | 노드의 Neuron 디바이스 나열 | 초기 진단 |
| **neuron-top** | 실시간 NeuronCore 사용률, 메모리, 전력 | 실시간 모니터링 |
| **neuron-monitor** | JSON 포맷 메트릭 스트리밍 | Prometheus exporter 입력 |
| **neuron-profile** | NEFF 실행 프로파일링 | 성능 최적화 |

### 8.2 Prometheus / CloudWatch 통합

```mermaid
flowchart LR
    subgraph Node["Neuron Node"]
        NMON["neuron-monitor"]
        EXP["neuron-monitor-prometheus<br/>exporter (SDK 공식 예제)"]
    end

    subgraph Observability["Observability"]
        AMP["AMP / Prometheus"]
        AMG["AMG / Grafana"]
        CWL["CloudWatch Container Insights"]
    end

    NMON --> EXP
    EXP -->|"/metrics (scrape, 포트 구성값)"| AMP
    AMP --> AMG
    NMON --> CWL

    style NMON fill:#ff9900,color:#fff
    style AMP fill:#e6522c,color:#fff
```

**수집 체인:**
- `neuron-monitor` 가 JSON 스트림으로 NeuronCore 사용률, 메모리 사용량, 디바이스 온도, 실행 상태(execution status) 등을 출력
- `neuron-monitor-prometheus` exporter 가 이를 Prometheus 형식으로 변환합니다. 이 exporter 와 참조용 Grafana 대시보드는 **AWS Neuron SDK 공식 예제**(`src/examples/neuron-monitor/`)로 제공되며, "커뮤니티 전용" 산출물이 아닙니다.
- AMP(Amazon Managed Prometheus) 에서 remote-write 로 수집하고 AMG(Amazon Managed Grafana) 에서 대시보드화
- CloudWatch Container Insights 의 Neuron 메트릭도 함께 활용 가능

상세 AMP/AMG 구성은 [모니터링·Observability 셋업](../../reference-architecture/integrations/monitoring-observability-setup.md) 을 참조하세요.

### 8.3 주요 메트릭

아래는 공식 Grafana 대시보드 예제(`neuron-monitor-grafana.json`)에서 실제로 사용하는 시계열 이름과 단위입니다. 정확한 라벨·시계열은 사용 중인 exporter 버전의 [neuron-monitor 사용자 가이드](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/tools/neuron-sys-tools/neuron-monitor-user-guide.html)로 확인하세요.

| 메트릭 (시계열) | 설명 / 단위 | 활용 |
|-------|------|------|
| `neuroncore_utilization_ratio` | NeuronCore 사용률 (0~1 비율) | HPA/KEDA 트리거 |
| `neuron_runtime_memory_used_bytes` | Neuron 런타임 메모리 사용량 (bytes) | OOM 방지, 용량 계획 |
| `execution_status_total{status_type="completed"}` | 완료된 실행 수(counter) — `rate()` 로 처리량 산출. **런타임 실행 지표이며 엔드투엔드 요청 지연(SLO)과 다릅니다**; 요청 지연은 서빙 프레임워크(vLLM 등) 메트릭으로 별도 수집 | 처리량·성공률 |
| `execution_errors_total` | 실행 오류 수(counter) | 하드웨어·런타임 건강 체크 |
| `hardware_ecc_events_total` | ECC 오류 이벤트 수(counter) | 하드웨어 건강 체크 |

:::note 지연 메트릭 주의
`neuron-monitor` 가 제공하는 것은 NeuronCore **런타임 실행** 지표입니다. 자동 스케일링과 SLO 를 같은 값으로 운영하려면, 오토스케일링 트리거(`neuroncore_utilization_ratio`)와 사용자 체감 지연(서빙 프레임워크의 요청 지연 메트릭)을 구분해 각각 수집하세요.
:::

---

## 9. 한계 및 주의사항

### 9.1 기능 제약

| 범주 | 제약 |
|------|------|
| **커스텀 커널** | CUDA 전용 커널(FlashAttention custom impl 등)은 Neuron 으로 직접 포팅 필요 |
| **양자화** | AWQ/GPTQ 일부 변종, GGUF 미지원 |
| **컴파일 시간** | 신규 모델 최초 컴파일 20-30분 이상 → NEFF 캐시 필수 |
| **디버깅** | nvidia-smi 대비 GPU 텔레메트리 도구 생태계가 협소 |
| **오픈소스 생태계** | NVIDIA GPU Operator / DCGM 동등 "통합 오케스트레이터" 부재 — Neuron Device Plugin + 별도 exporter 조합 |

### 9.2 운영상 주의점

:::warning 프로덕션 배포 전 체크리스트
- [ ] 대상 모델이 NxD Inference 또는 vLLM Neuron backend 에서 **현재 버전에서 지원되는지** 확인
- [ ] 모델 NEFF 를 **CI 단계에서 사전 컴파일** 하고 S3/ECR 에 아티팩트로 관리
- [ ] 첫 Pod 기동 지연을 고려한 `readinessProbe` / `startupProbe` 설정 (initialDelaySeconds 충분히 크게)
- [ ] HPA/KEDA 트리거 메트릭에서 `neuron_core_utilization` 이 정상적으로 수집되는지 검증
- [ ] 리전별 Trainium2 capacity 확인 및 Spot 인터럽트 정책 수립
- [ ] Bedrock 과의 하이브리드 운영 시 모델 버전 동기화 정책 명문화
:::

### 9.3 Neuron 에서 피해야 하는 워크로드

- 매주 모델 구조를 바꾸는 R&D 실험 — 컴파일 비용이 반복적으로 발생
- Triton Inference Server + 커스텀 Python backend 가 이미 깊게 결합된 기존 스택
- 매우 작은 요청(&lt;10 tokens/sec) 의 드문 호출 — 워밍업·컴파일 오버헤드가 상대적으로 큼

---

## 10. 관련 문서

- [EKS GPU 노드 전략](./eks-gpu-node-strategy.md) — AWS 가속기 선택 가이드, NVIDIA vs Neuron
- [NVIDIA GPU 스택](./nvidia-gpu-stack.md) — NVIDIA 스택과의 비교 기준
- [GPU 리소스 관리](./gpu-resource-management.md) — Karpenter/KEDA/DRA 기반 오토스케일링
- [vLLM 모델 서빙](../inference-frameworks/vllm-model-serving.md) — vLLM 기반 추론 엔진 (CUDA 경로)
- [MoE 모델 서빙](../inference-frameworks/moe-model-serving.md) — MoE 구조 개념 및 Trainium2 배치 전략
- [모니터링·Observability 셋업](../../reference-architecture/integrations/monitoring-observability-setup.md) — AMP/AMG, Langfuse, OTel

## 참고 자료

- [AWS Neuron SDK GitHub (aws-neuron)](https://github.com/aws-neuron/aws-neuron-sdk)
- [AWS Neuron Documentation](https://awsdocs-neuron.readthedocs-hosted.com/)
- [AWS Neuron Samples](https://github.com/aws-neuron/aws-neuron-samples)
- [NxD Inference Documentation](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/libraries/nxd-inference/index.html)
- [Neuron SDK Release Notes](https://awsdocs-neuron.readthedocs-hosted.com/en/latest/release-notes/)
- [AWS Trainium2 제품 페이지](https://aws.amazon.com/machine-learning/trainium/)
- [AWS Inferentia2 제품 페이지](https://aws.amazon.com/machine-learning/inferentia/)
- [vLLM Neuron backend 문서](https://docs.vllm.ai/en/latest/getting_started/installation.html#neuron-installation)
- [optimum-neuron (HuggingFace)](https://github.com/huggingface/optimum-neuron)
- [AWS Neuron Kubernetes Device Plugin](https://github.com/aws-neuron/aws-neuron-sdk/tree/master/src/k8)
