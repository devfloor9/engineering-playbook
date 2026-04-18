---
title: "PFR: EKS GPU 추론 인프라 개선 요청"
sidebar_label: "PFR: GPU 추론"
description: "대형 MoE 모델 배포 과정에서 발견한 EKS Auto Mode 제약 및 개선 요청"
tags: [pfr, eks, gpu, auto-mode, dynamo]
last_update:
  date: 2026-04-18
  author: YoungJoon Jeong
---

# PFR: EKS GPU 추론 인프라 개선 요청

GLM-5 (744B MoE) 및 Kimi K2.5 (1T MoE) 대형 언어 모델을 EKS Auto Mode에 배포하는 과정에서 발견한 제약사항과 개선 요청사항을 기록합니다.

:::info 문서 목적
이 문서는 **Product Feature Request (PFR)** 형식으로 작성되었으며, EKS/EC2/DLC 팀에 전달할 개선 요청 사항을 포함합니다. 각 항목은 문제 상황, 재현 단계, 기대 동작, 현재 워크어라운드, 비즈니스 임팩트를 포함합니다.
:::

## 배경

### 배포 대상 모델
- **GLM-5 (744B MoE)**: 192개 Expert, 8개 Active Expert, 최소 8×H200/B200 GPU 필요
- **Kimi K2.5 (1T MoE)**: 256개 Expert, 16개 Active Expert, 최소 16×H200/B200 GPU 필요

### 배포 환경
- **인프라**: Amazon EKS Auto Mode (v1.32)
- **GPU 타겟**: p6-b200.48xlarge (8×B200, 192GB HBM3e), p5.48xlarge (8×H100, 80GB HBM3)
- **모델 서빙**: vLLM v0.19.x + NVIDIA Dynamo (Disaggregated Serving)
- **스케줄링**: Karpenter (Auto Mode 내장) + NVIDIA GPU Operator

---

## PFR-1: EKS Auto Mode p6-b200 인스턴스 지원

**우선순위**: P0 (Critical)  
**영향 서비스**: Amazon EKS

### 문제 상황
EKS Auto Mode NodePool에서 `p6-b200.48xlarge` 인스턴스 타입을 지정하면 dry-run은 통과하지만, 실제 Pod 생성 시 Karpenter가 NodeClaim 프로비저닝에 실패합니다.

```yaml
# NodePool 설정 (dry-run 통과)
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-b200
spec:
  template:
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["p6-b200.48xlarge"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
```

### 재현 단계
1. EKS Auto Mode 클러스터 생성 (v1.32)
2. NodePool에 `p6-b200.48xlarge` 설정
3. GPU 요청 Pod 생성 (`nvidia.com/gpu: 8`)
4. Karpenter가 NodeClaim 시도 → 실패

**에러 메시지**:
```
NodePool requirements filtered out all compatible available instance types
NoCompatibleInstanceTypes: All instance types were filtered out during launch
```

### 기대 동작
- p6-b200.48xlarge 인스턴스가 EKS Auto Mode에서 정상적으로 프로비저닝되어야 함
- Karpenter가 NodeClaim 생성 시 p6-b200 availability를 확인하고 노드를 시작해야 함

### 현재 워크어라운드
**EKS Standard Mode + self-managed Karpenter 사용**
```bash
# Standard Mode 클러스터로 전환
eksctl create cluster --name gpu-inference-std \
  --region us-east-2 \
  --version 1.32 \
  --with-oidc \
  --managed

# Karpenter 수동 설치
helm install karpenter oci://public.ecr.aws/karpenter/karpenter \
  --version 1.2.3 \
  --namespace kube-system
```

### 비즈니스 임팩트
- **B200 GPU (192GB HBM3e)는 744B~1T MoE 모델에 필수**:
  - GLM-5: H100 (80GB)로는 expert offloading 필요 → 레이턴시 2배 증가
  - Kimi K2.5: B200 없이는 배포 불가 (메모리 부족)
- **Auto Mode 사용 불가 → Standard Mode 전환 필요**:
  - 운영 복잡도 증가 (Karpenter, VPC CNI, CoreDNS 수동 관리)
  - Auto Mode의 self-healing, auto-upgrade 혜택 상실
- **고객 데모 일정 지연**: p6-b200 사용 불가로 us-east-2 p5 Spot으로 대체 → 성능 제약

---

## PFR-2: EKS Auto Mode KAI Scheduler 지원

**우선순위**: P1 (High)  
**영향 서비스**: Amazon EKS

### 문제 상황
EKS Auto Mode는 내장 managed 스케줄러만 사용하며, 사용자 정의 스케줄러 (예: NVIDIA KAI Scheduler) 설정을 지원하지 않습니다. NVIDIA Dynamo의 Disaggregated Serving은 gang scheduling과 topology-aware placement가 필수이나 Auto Mode에서는 불가능합니다.

### 재현 단계
1. NVIDIA Dynamo 설치 (KAI Scheduler 포함)
2. Prefill/Decode Pod에 `schedulerName: kai-scheduler` 설정
3. EKS Auto Mode가 kai-scheduler를 무시하고 default scheduler 사용 → gang scheduling 실패
4. Prefill Pod는 시작되지만 Decode Pod는 Pending → 추론 불가

```yaml
# KAI Scheduler를 사용하는 Prefill Pod (Auto Mode에서 동작하지 않음)
apiVersion: v1
kind: Pod
metadata:
  name: dynamo-prefill
spec:
  schedulerName: kai-scheduler  # Auto Mode에서 무시됨
  containers:
  - name: vllm-prefill
    image: nvcr.io/nvidia/vllm:latest
    resources:
      limits:
        nvidia.com/gpu: 4
```

### 기대 동작
- **옵션 1**: Auto Mode에서 KAI Scheduler 사용 허용
  - `schedulerName` 필드 지원
  - Auto Mode와 custom scheduler의 공존
- **옵션 2**: Auto Mode 내장 스케줄러에 gang scheduling 기능 추가
  - PodGroup CRD 지원
  - Topology-aware placement (NVLink, EFA 고려)

### 현재 워크어라운드
**Leaderworker Set (LWS) + Pod Affinity로 수동 구현**
```yaml
apiVersion: leaderworkerset.x-k8s.io/v1
kind: LeaderWorkerSet
metadata:
  name: dynamo-gang
spec:
  replicas: 2  # prefill + decode
  leaderWorkerTemplate:
    workerTemplate:
      spec:
        affinity:
          podAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: dynamo
              topologyKey: kubernetes.io/hostname
```

**제약사항**:
- Gang scheduling 불완전 (preemption 시 일부 Pod만 삭제 가능)
- Topology-aware placement 없음 (NVLink 활용 불가)

### 비즈니스 임팩트
- **Disaggregated Serving 최적 배치 불가**:
  - Prefill (8 GPU) + Decode (8 GPU)가 같은 노드에 배치되지 않으면 NVLink 활용 불가
  - Inter-node KV 전송 시 레이턴시 10배 증가 (NVLink 300GB/s → EFA 400Gbps = 50GB/s)
- **GPU 활용도 저하**:
  - Gang scheduling 없이는 Prefill만 시작 → Decode Pod Pending → 8 GPU 유휴
  - 비용 낭비: p5.48xlarge $98/hr × 50% 유휴 = $49/hr 손실

---

## PFR-3: EKS Auto Mode GPU Operator Device Plugin 호환성

**우선순위**: P1 (High)  
**영향 서비스**: Amazon EKS

### 문제 상황
NVIDIA GPU Operator를 `devicePlugin.enabled=true`로 설치하면 EKS Auto Mode 내장 Device Plugin과 충돌하여 GPU 노드의 `nvidia.com/gpu` allocatable이 0이 됩니다.

### 재현 단계
1. EKS Auto Mode 클러스터 생성
2. GPU Operator 설치 (Device Plugin 활성화)
   ```bash
   helm install gpu-operator nvidia/gpu-operator \
     --set devicePlugin.enabled=true
   ```
3. GPU 노드에서 확인:
   ```bash
   kubectl describe node <gpu-node> | grep nvidia.com/gpu
   # Allocatable: nvidia.com/gpu: 0  (예상: 8)
   ```
4. GPU 요청 Pod 생성 → Pending (Insufficient nvidia.com/gpu)

### 기대 동작
- **옵션 1**: GPU Operator Device Plugin과 Auto Mode 내장 Device Plugin이 공존
  - 자동 감지 및 충돌 회피
- **옵션 2**: 충돌 시 명확한 에러 메시지 제공
  - "EKS Auto Mode already provides GPU Device Plugin. Set devicePlugin.enabled=false"
- **옵션 3**: Auto Mode에서 GPU Operator Device Plugin 우선 사용 옵션

### 현재 워크어라운드
**GPU Operator Device Plugin 비활성화**
```bash
helm install gpu-operator nvidia/gpu-operator \
  --set devicePlugin.enabled=false \
  --set dcgm.enabled=true \
  --set gfd.enabled=true
```

**노드 재생성 절차** (충돌 발생 시):
1. 모든 GPU Pod 삭제 (워크로드 중단)
2. NodeClaim 삭제
   ```bash
   kubectl delete nodeclaim <nodeclaim-name>
   ```
3. Karpenter가 Empty 노드 감지 후 자동 종료 (5-10분 대기)
4. 새 NodeClaim 생성 → 올바른 설정으로 노드 시작

:::warning
Auto Mode는 EC2 인스턴스에 resource-based policy로 `ec2:TerminateInstances`를 차단합니다. 직접 terminate 불가능하며 NodeClaim 삭제 후 Karpenter의 자동 종료를 기다려야 합니다.
:::

### 비즈니스 임팩트
- **디버깅 시간 손실**: 충돌 원인을 찾는 데 3-4시간 소요
  - EKS 문서에 GPU Operator + Auto Mode 호환성 가이드 없음
  - `allocatable=0` 원인이 Device Plugin 충돌임을 알기 어려움
- **노드 재생성 비용**: 워크로드 중단 → NodeClaim 삭제 → 5-10분 대기 → 재배포
  - 프로덕션 환경에서 위험 (다운타임)

---

## PFR-4: EKS Auto Mode 관리 노드 EC2 TerminateInstances 허용

**우선순위**: P2 (Medium)  
**영향 서비스**: Amazon EKS

### 문제 상황
EKS Auto Mode가 관리하는 EC2 인스턴스에 resource-based policy로 `ec2:TerminateInstances`를 명시적으로 차단합니다. 관리자도 GPU 노드를 강제 종료할 수 없습니다.

### 재현 단계
1. EKS Auto Mode GPU 노드 식별
   ```bash
   kubectl get nodes -l node.kubernetes.io/instance-type=p5.48xlarge
   # ip-10-0-1-100.us-east-2.compute.internal
   ```
2. EC2 인스턴스 ID 확인
   ```bash
   aws ec2 describe-instances \
     --filters "Name=private-dns-name,Values=ip-10-0-1-100.us-east-2.compute.internal" \
     --query 'Reservations[0].Instances[0].InstanceId'
   # i-0123456789abcdef0
   ```
3. 인스턴스 종료 시도
   ```bash
   aws ec2 terminate-instances --instance-ids i-0123456789abcdef0
   ```

**에러 메시지**:
```json
{
  "Code": "UnauthorizedOperation",
  "Message": "You are not authorized to perform this operation. User: arn:aws:iam::123456789012:user/admin is not authorized to perform: ec2:TerminateInstances on resource: arn:aws:ec2:us-east-2:123456789012:instance/i-0123456789abcdef0 with an explicit deny in a resource-based policy"
}
```

### 기대 동작
- **옵션 1**: 클러스터 관리자에게 emergency drain 권한 제공
  - IAM policy로 `ec2:TerminateInstances` 허용 옵션
  - EKS Console에서 "Force Terminate Node" 버튼
- **옵션 2**: `kubectl drain --force --delete-emptydir-data --ignore-daemonsets` 후 자동 종료
  - Drain 완료 시 Karpenter가 즉시 노드 종료 (현재: 5-10분 대기)

### 현재 워크어라운드
**NodeClaim 삭제 후 자동 종료 대기**
```bash
# 1. 워크로드 삭제
kubectl delete pod <gpu-pod>

# 2. NodeClaim 삭제
kubectl delete nodeclaim <nodeclaim-name>

# 3. Karpenter가 Empty 노드 감지 후 자동 종료 (5-10분 대기)
kubectl get nodes -w
```

### 비즈니스 임팩트
- **빠른 복구 불가**:
  - GPU Operator Device Plugin 충돌 등으로 노드 상태가 비정상인 경우
  - 워크로드 삭제 → NodeClaim 삭제 → 5-10분 대기 → 재생성 (총 15-20분)
  - 직접 terminate 가능 시: 1-2분 내 복구
- **프로덕션 리스크**:
  - 비정상 노드가 장시간 유지되면 Karpenter가 신규 NodeClaim 생성 못함 (capacity limit)
  - GPU Pod Pending 상태 유지 → 추론 서비스 중단

---

## PFR-5: p5/p5en Spot 용량 아시아 리전 확대

**우선순위**: P1 (High)  
**영향 서비스**: Amazon EC2

### 문제 상황
아시아 리전 (ap-northeast-2 서울, ap-northeast-1 도쿄)에서 p5.48xlarge Spot 인스턴스를 프로비저닝하면 `InsufficientInstanceCapacity` 에러가 발생합니다.

### 재현 단계
1. EKS 클러스터를 ap-northeast-2 (서울)에 생성
2. Karpenter NodePool에 p5.48xlarge Spot 설정
   ```yaml
   spec:
     template:
       spec:
         requirements:
           - key: node.kubernetes.io/instance-type
             operator: In
             values: ["p5.48xlarge"]
           - key: karpenter.sh/capacity-type
             operator: In
             values: ["spot"]
   ```
3. GPU 요청 Pod 생성 → NodeClaim 실패

**에러 메시지**:
```
InsufficientInstanceCapacity: We currently do not have sufficient p5.48xlarge capacity in the Availability Zone you requested (apne2-az1). Our system will be working on provisioning additional capacity.
```

**시도한 리전**:
- ap-northeast-2 (서울): 모든 AZ 실패
- ap-northeast-1 (도쿄): 모든 AZ 실패
- us-east-2 (Ohio): **Spot 확보 성공** ($13-15/hr)

### 기대 동작
- 아시아 리전 (서울, 도쿄, 싱가포르)에서 p5/p5en Spot 용량 확대
- 최소 1-2개 AZ에서 p5.48xlarge Spot 사용 가능

### 현재 워크어라운드
**us-east-2 (Ohio) 리전 사용**
```bash
# 서울 대신 Ohio에서 클러스터 생성
eksctl create cluster --name gpu-inference \
  --region us-east-2 \
  --version 1.32
```

**Spot 가격 (2026-04-01 기준)**:
- us-east-2: $13-15/hr (On-Demand $98/hr의 13-15%)
- ap-northeast-2: 용량 없음

### 비즈니스 임팩트
- **아시아 고객 대상 데모 불가**:
  - 한국/일본 고객이 us-east-2 접속 시 레이턴시 150-200ms 증가
  - 실시간 추론 데모에서 체감 지연 발생
- **데이터 주권 요구사항 미충족**:
  - 금융/의료 고객은 데이터 리전 제약 → 미국 리전 사용 불가
- **비용 절감 기회 상실**:
  - Spot 사용 시 85-87% 비용 절감 가능
  - On-Demand $98/hr vs Spot $13/hr → 연간 $745,200 절감 (10 인스턴스 기준)

---

## PFR-6: AWS DLC vLLM 이미지 transformers v5+ 포함

**우선순위**: P2 (Medium)  
**영향 서비스**: AWS Deep Learning Containers

### 문제 상황
AWS Deep Learning Containers의 vLLM 이미지 (`public.ecr.aws/deep-learning-containers/vllm`)가 transformers v4.x를 사용하며, 최신 모델 (GLM-5 `glm_moe_dsa`, Kimi K2.5 등)을 지원하지 않습니다.

### 재현 단계
1. AWS DLC vLLM 이미지로 GLM-5 서빙 시도
   ```bash
   docker run --gpus all \
     public.ecr.aws/deep-learning-containers/vllm:0.7.0-gpu-py310-cu124 \
     --model THUDM/glm-5-8b
   ```
2. 에러 발생:
   ```
   ValueError: The model type `glm_moe_dsa` is not currently supported, 
   but Transformers does not recognize this architecture.
   ```

### 기대 동작
- AWS DLC vLLM 이미지에 transformers v5.2+ 포함
- 또는 nightly DLC 제공 (transformers main branch)

### 현재 워크어라운드
**vLLM nightly + initContainer로 transformers 업그레이드**
```yaml
apiVersion: v1
kind: Pod
spec:
  initContainers:
  - name: install-transformers
    image: public.ecr.aws/deep-learning-containers/vllm:0.7.0-gpu-py310-cu124
    command: ["/bin/bash", "-c"]
    args:
    - |
      pip install --no-cache-dir \
        https://github.com/huggingface/transformers/archive/refs/heads/main.zip
    volumeMounts:
    - name: pip-cache
      mountPath: /root/.cache/pip
  containers:
  - name: vllm
    image: public.ecr.aws/deep-learning-containers/vllm:0.7.0-gpu-py310-cu124
    volumeMounts:
    - name: pip-cache
      mountPath: /root/.cache/pip
  volumes:
  - name: pip-cache
    emptyDir: {}
```

**제약사항**:
- initContainer 실행 시간 2-3분 추가 (Cold Start 지연)
- pip cache 관리 필요 (PV 사용 시 추가 비용)

### 비즈니스 임팩트
- **커스텀 이미지 빌드 필요**:
  - DLC 이미지의 보안 패치, 최적화를 받지 못함
  - 자체 이미지 레지스트리 유지 비용
- **최신 모델 배포 지연**:
  - GLM-5, Kimi K2.5 등 2026년 모델이 DLC에 미포함
  - 고객 요구사항 대응 늦음

---

## PFR-7: EKS Auto Mode NIXL/GPUDirect RDMA 지원

**우선순위**: P2 (Medium)  
**영향 서비스**: Amazon EKS

### 문제 상황
NVIDIA Dynamo의 Disaggregated Serving은 NIXL (NVIDIA Inter-GPU Communication Library)을 통한 KV 전송에 GPUDirect RDMA (EFA)가 필수이나, EKS Auto Mode에서 EFA 구성이 불확실합니다.

### 배경: Disaggregated Serving 아키텍처
```
┌─────────────┐  NIXL/EFA  ┌─────────────┐
│ Prefill GPU ├───────────►│ Decode GPU  │
│  (8×H100)   │  KV Cache  │  (8×H100)   │
└─────────────┘  300 GB/s  └─────────────┘
```

- **NIXL**: GPU 간 직접 메모리 전송 (CPU bypass)
- **GPUDirect RDMA**: EFA 통한 inter-node KV 전송
- **대역폭**: NVLink 300GB/s, EFA 400Gbps (50GB/s), TCP 10Gbps

### 재현 단계
1. EKS Auto Mode에서 p5.48xlarge NodePool 생성
2. Dynamo Prefill/Decode Pod 배포
3. Prefill Pod에서 NIXL 초기화 실패
   ```
   ERROR: Failed to initialize NIXL: No EFA device found
   ```

### 기대 동작
- EKS Auto Mode GPU 노드에서 EFA 자동 구성
  - EFA 드라이버 pre-install
  - Security Group 자동 설정 (EFA 트래픽 허용)
- NIXL 지원 확인
  - `nvidia-smi topo` 출력에 EFA 포함
  - NCCL/NIXL 테스트 통과

### 현재 워크어라운드
**EKS Standard Mode + p5 인스턴스 (EFA 내장) 사용**
```yaml
# Standard Mode NodePool (self-managed Karpenter)
apiVersion: karpenter.sh/v1
kind: NodeClass
metadata:
  name: gpu-efa
spec:
  amiFamily: AL2023
  instanceProfile: KarpenterNodeInstanceProfile
  securityGroupSelectorTerms:
  - tags:
      karpenter.sh/discovery: gpu-inference
  subnetSelectorTerms:
  - tags:
      karpenter.sh/discovery: gpu-inference
  userData: |
    #!/bin/bash
    # EFA 드라이버 설치
    curl -O https://efa-installer.amazonaws.com/aws-efa-installer-latest.tar.gz
    tar -xf aws-efa-installer-latest.tar.gz
    cd aws-efa-installer && ./efa_installer.sh -y
```

### 비즈니스 임팩트
- **Auto Mode에서 Disaggregated Serving 불가**:
  - Dynamo의 핵심 기능 (Prefill/Decode 분리) 미사용
  - GPU 활용도 최적화 불가 (Prefill 60% + Decode 90% → 통합 75%)
- **Standard Mode 전환 필요**:
  - 운영 복잡도 증가 (EFA 드라이버, Security Group 수동 관리)

---

## PFR-8: EKS Auto Mode + MNG 하이브리드 시 MNG 생성 지연 (P1)

**우선순위**: P1 (High)  
**영향 서비스**: Amazon EKS

### 문제 상황

EKS Auto Mode 클러스터에 Managed Node Group(MNG)을 추가하려고 하면 MNG 생성이 비정상적으로 느려지며, 결국 정상 동작하지 않습니다.

### 재현 단계

1. EKS Auto Mode 클러스터 생성 (v1.32)
   ```bash
   eksctl create cluster --name auto-mode-cluster \
     --region us-east-2 \
     --version 1.32 \
     --auto-mode-config enabled=true
   ```

2. MNG 추가 시도 (p5en.48xlarge 타겟)
   ```bash
   eksctl create nodegroup \
     --cluster auto-mode-cluster \
     --name gpu-p5en \
     --node-type p5en.48xlarge \
     --nodes 1 \
     --nodes-min 0 \
     --nodes-max 4
   ```

3. MNG 상태 확인
   ```bash
   aws eks describe-nodegroup \
     --cluster-name auto-mode-cluster \
     --nodegroup-name gpu-p5en
   
   # Status: CREATING (30분+ 멈춤)
   # Resources: null
   ```

4. CloudFormation 스택 확인
   ```bash
   aws cloudformation describe-stacks \
     --stack-name eksctl-auto-mode-cluster-nodegroup-gpu-p5en
   
   # Resources: [] (빈 배열)
   # ASG가 생성되지 않음
   ```

### 기대 동작

- MNG가 5-10분 내에 `ACTIVE` 상태로 전환
- Auto Scaling Group과 Launch Template 정상 생성
- EC2 인스턴스 프로비저닝 시작

### 현재 워크어라운드

**EKS Standard Mode로 클러스터 재생성**

```bash
# 1. Standard Mode 클러스터 생성
eksctl create cluster --name standard-cluster \
  --region us-east-2 \
  --version 1.32 \
  --with-oidc \
  --managed

# 2. MNG 추가 (정상 동작)
eksctl create nodegroup \
  --cluster standard-cluster \
  --name gpu-p5en \
  --node-type p5en.48xlarge \
  --nodes 1
```

**제약사항**: Auto Mode의 자동 관리 혜택 상실.

### 비즈니스 임팩트

- **Auto Mode + 대형 GPU 동시 사용 불가**:
  - p5en/p6 인스턴스는 Auto Mode Karpenter가 미지원
  - MNG 하이브리드 패턴도 동작하지 않음
  - 결과: Auto Mode에서는 p5.48xlarge까지만 사용 가능

- **아키텍처 선택 제약**:
  - GLM-5 (744B)는 H200/B200 권장이나 p5.48xlarge로 대체 배포 필요
  - Pipeline Parallelism 필요 → 비용 2배 (2노드)

- **운영 복잡도 증가**:
  - Standard Mode 전환 시 Karpenter, VPC CNI, CoreDNS 수동 관리 필요
  - Auto Mode의 self-healing, auto-upgrade 혜택 상실

---

## PFR-9: vLLM PP=2 멀티노드 V1 엔진 교착 (P1, vLLM 이슈)

**우선순위**: P1 (High)  
**영향 서비스**: vLLM (오픈소스)

### 문제 상황

vLLM V1 엔진에서 Pipeline Parallelism (PP=2) 멀티노드 배포 시 교착 상태가 발생하여 추론 서비스를 시작할 수 없습니다.

### 재현 단계

1. LeaderWorkerSet 기반 PP=2 배포
   ```yaml
   apiVersion: leaderworkerset.x-k8s.io/v1
   kind: LeaderWorkerSet
   metadata:
     name: vllm-glm5-pp2
   spec:
     replicas: 1
     leaderWorkerTemplate:
       size: 2  # leader + worker
       leaderTemplate:
         spec:
           containers:
           - name: vllm
             image: vllm/vllm-openai:v0.19.2
             command: ["vllm", "serve"]
             args:
               - "THUDM/glm-5-8b"
               - "--tensor-parallel-size=8"
               - "--pipeline-parallel-size=2"
               - "--nnodes=2"
               - "--node-rank=0"
             resources:
               limits:
                 nvidia.com/gpu: "8"
   ```

2. Leader Pod 시작 → 모델 로딩 완료
3. Worker Pod 시작 → TCPStore 연결 시도
4. Leader가 Worker 응답 대기 중 timeout

**에러 로그**:
```
Leader Pod:
  INFO: Model weights loaded on rank 0
  WARNING: Waiting for worker rank 1... (timeout in 600s)
  ERROR: VLLM_ENGINE_READY_TIMEOUT_S expired. Worker not ready.

Worker Pod:
  INFO: Connecting to TCPStore at vllm-glm5-pp2-0.svc:29500
  ERROR: [Errno 32] Broken pipe
  CRITICAL: Worker initialization failed
```

### 기대 동작

- vLLM V1 엔진이 PP=2 non-Ray 멀티노드에서 안정적으로 동작
- Leader와 Worker가 TCPStore를 통해 정상 동기화
- 744B 급 대형 모델도 멀티노드로 서빙 가능

### 현재 워크어라운드

**옵션 1: SGLang 사용 (검증 완료)**

```yaml
containers:
- name: sglang
  image: lmsysorg/sglang:latest
  command: ["python3", "-m", "sglang.launch_server"]
  args:
    - "--model-path"
    - "THUDM/glm-5-8b"
    - "--tp"
    - "8"
    - "--pp"
    - "2"
    - "--nnodes"
    - "2"
```

**결과**: GLM-5 멀티노드 배포 성공, 교착 없음.

**옵션 2: 단일 노드 + 대형 인스턴스**

p5en.48xlarge (H200 1,128GB) 또는 p6-b200.48xlarge (B200 1,536GB)를 사용하여 PP=1로 배포.

**제약**: EKS Standard Mode 필요 (Auto Mode는 p5en/p6 미지원).

### 비즈니스 임팩트

- **700B+ MoE 모델의 멀티노드 vLLM 배포 불가**:
  - GLM-5 (744B), Kimi K2.5 (1T) 등 대형 모델은 멀티노드 필수
  - vLLM 사용 시 SGLang으로 대체 필요 → 에코시스템 분열

- **기술 선택 제약**:
  - vLLM의 OpenAI 호환 API, Prefix Caching 등 장점 활용 불가
  - SGLang 러닝 커브 및 운영 경험 부족

- **고객 데모 리스크**:
  - "vLLM 기반 추론 플랫폼"으로 제안했으나 실제로는 SGLang 사용
  - 기술 스택 불일치로 신뢰도 저하

---

## PFR-10: AWS DLC vLLM 이미지 transformers v5+ 미포함 (P2)

**우선순위**: P2 (Medium)  
**영향 서비스**: AWS Deep Learning Containers

### 문제 상황

AWS Deep Learning Containers의 vLLM 이미지 (`public.ecr.aws/deep-learning-containers/vllm`)가 transformers v4.x를 포함하고 있어, 2026년 신규 모델 (GLM-5의 `glm_moe_dsa`, Kimi K2.5 등)을 인식하지 못합니다.

### 재현 단계

1. AWS DLC vLLM 이미지로 GLM-5 서빙 시도
   ```bash
   kubectl run vllm-glm5 \
     --image=public.ecr.aws/deep-learning-containers/vllm:0.7.0-gpu-py310-cu124 \
     -- vllm serve THUDM/glm-5-8b
   ```

2. 에러 발생
   ```
   ValueError: The model type `glm_moe_dsa` is not currently supported, 
   but Transformers does not recognize this architecture.
   
   Hint: You may need to upgrade transformers to v5.2+
   ```

3. transformers 버전 확인
   ```bash
   kubectl exec vllm-glm5 -- pip show transformers
   # Version: 4.46.2
   ```

### 기대 동작

- AWS DLC vLLM 이미지에 transformers v5.2+ 포함
- 또는 nightly DLC 제공 (transformers main branch 포함)
- 최신 모델 아키텍처 자동 인식

### 현재 워크어라운드

**커스텀 Dockerfile로 transformers 업그레이드**

```dockerfile
FROM public.ecr.aws/deep-learning-containers/vllm:0.7.0-gpu-py310-cu124

# transformers main branch 설치
RUN pip install --no-cache-dir \
  https://github.com/huggingface/transformers/archive/refs/heads/main.zip

# 검증
RUN python -c "import transformers; print(transformers.__version__)"
```

**제약사항**:
- 커스텀 이미지 빌드 및 레지스트리 유지 비용
- DLC의 보안 패치, 최적화를 실시간으로 받지 못함
- CI/CD 파이프라인에 이미지 빌드 단계 추가 필요

### 비즈니스 임팩트

- **최신 모델 배포 지연**:
  - 2026년 1-4월 출시 모델 (GLM-5, Kimi K2.5, Qwen3 등) 즉시 사용 불가
  - 커스텀 이미지 빌드 및 검증에 1-2일 소요

- **보안 및 규정 준수**:
  - AWS DLC는 보안 스캔 및 CVE 패치가 자동 적용
  - 커스텀 이미지는 자체 스캔 프로세스 필요 (ECR Inspector 등)

- **고객 요구사항 대응 늦음**:
  - "최신 오픈소스 모델 즉시 사용 가능"이 AWS AI/ML의 핵심 가치
  - DLC 지연으로 인해 경쟁 플랫폼 (Azure, GCP) 대비 열위

---

## 요약

### PFR 목록

| ID | 제목 | 우선순위 | 영향 서비스 | 상태 |
|---|---|---|---|---|
| **PFR-1** | EKS Auto Mode p6-b200 인스턴스 지원 | **P0** | EKS | Open |
| **PFR-2** | EKS Auto Mode KAI Scheduler 지원 | **P1** | EKS | Open |
| **PFR-3** | GPU Operator Device Plugin 호환성 | **P1** | EKS | Open |
| **PFR-4** | Auto Mode 노드 TerminateInstances 허용 | **P2** | EKS | Open |
| **PFR-5** | p5/p5en Spot 용량 아시아 리전 확대 | **P1** | EC2 | Open |
| **PFR-6** | DLC vLLM transformers v5+ 포함 | **P2** | DLC | Open |
| **PFR-7** | Auto Mode NIXL/GPUDirect RDMA 지원 | **P2** | EKS | Open |
| **PFR-8** | EKS Auto Mode + MNG 하이브리드 시 MNG 생성 지연 | **P1** | EKS | Open |
| **PFR-9** | vLLM PP=2 멀티노드 V1 엔진 교착 | **P1** | vLLM (오픈소스) | Open |
| **PFR-10** | AWS DLC vLLM 이미지 transformers v5+ 미포함 | **P2** | DLC | Open |
| **PFR-11** | EKS Auto Mode 지원 인스턴스 타입 조회 API 미제공 | **P2** | EKS | Open |

---

## PFR-11: EKS Auto Mode 지원 인스턴스 타입 조회 API 미제공 (P2)

- **서비스**: EKS
- **우선순위**: P2

### 문제 상황
EKS Auto Mode에서 특정 인스턴스 타입이 실제로 프로비저닝 가능한지 사전에 확인할 수 있는 API나 문서가 없습니다. NodePool dry-run(`kubectl apply --dry-run=server`)은 모든 인스턴스 타입에 대해 통과하므로 신뢰할 수 없습니다.

### 재현 단계
1. Auto Mode 클러스터에서 `p5en.48xlarge` NodePool dry-run → ✅ 통과
2. 실제 GPU Pod 배포 → `NoCompatibleInstanceTypes` 발생
3. 동일 인스턴스(`p5.48xlarge`)는 정상 프로비저닝

### 기대 동작
- EKS API 또는 AWS CLI로 Auto Mode에서 지원되는 인스턴스 타입 목록을 조회할 수 있어야 함
- 예: `aws eks describe-auto-mode-instance-types --cluster-name <name>`
- 또는 NodePool dry-run이 실제 offering 매칭까지 검증하여 미지원 인스턴스에 대해 사전 경고

### 현재 워크어라운드
실제 Pod을 배포하여 `NoCompatibleInstanceTypes` 이벤트 발생 여부로 판별:
```bash
kubectl get events --sort-by='.lastTimestamp' | grep NoCompatibleInstanceTypes
```

### 비즈니스 임팩트
- 인스턴스 지원 여부를 사전에 파악할 수 없어 **trial-and-error로 시간 낭비** (건당 30분+)
- 고객 데모 시 예상치 못한 `NoCompatibleInstanceTypes`로 배포 실패 → 신뢰도 하락

---

### 임팩트 분석

#### P0 (Critical)
- **PFR-1**: B200 GPU 없이는 GLM-5 (744B) / Kimi K2.5 (1T) 배포 불가 → Standard Mode 전환 필수

#### P1 (High)
- **PFR-2**: Gang scheduling 없으면 GPU 활용도 50% 저하 → 비용 낭비 $49/hr/인스턴스
- **PFR-3**: 디버깅 시간 3-4시간 손실 + 노드 재생성 15-20분 다운타임
- **PFR-5**: 아시아 리전 Spot 미지원 → 연간 $745,200 비용 절감 기회 상실 (10 인스턴스 기준)
- **PFR-8**: Auto Mode에서 p5en/p6 사용 불가 → Standard Mode 전환 필요 → 운영 복잡도 증가
- **PFR-9**: vLLM 멀티노드 PP 불가 → SGLang 대체 필요 → 기술 스택 불일치

#### P2 (Medium)
- **PFR-4**: 비정상 노드 복구 시간 15-20분 → 1-2분으로 단축 필요
- **PFR-6**: 최신 모델 (2026) 배포 지연 → 커스텀 이미지 빌드 필요
- **PFR-7**: Disaggregated Serving 미사용 → GPU 활용도 15% 개선 기회 상실
- **PFR-10**: DLC transformers 구버전 → 2026년 신규 모델 즉시 사용 불가
- **PFR-11**: 인스턴스 지원 여부 사전 확인 불가 → trial-and-error로 30분+ 낭비

### 권장 사항

#### EKS 팀
1. **P0 우선**: p6-b200 Auto Mode 지원 → 2026 Q2 타겟
2. **P1 대응**: KAI Scheduler 호환성 또는 내장 gang scheduling 추가
3. **문서 개선**: GPU Operator + Auto Mode 호환성 가이드 추가

#### EC2 팀
1. **Spot 용량 확대**: 서울/도쿄 리전에 p5.48xlarge Spot 용량 증설
2. **p6 GA 계획**: 아시아 리전 p6-b200 availability 로드맵 공유

#### DLC 팀
1. **nightly 빌드 제공**: transformers main branch 포함 vLLM 이미지
2. **릴리스 주기 단축**: 분기별 → 월별 (최신 모델 지원 가속화)

---

## 참고 자료

- [EKS Auto Mode 문서](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- [Karpenter 문서](https://karpenter.sh/docs/)
- [NVIDIA GPU Operator 설치 가이드](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html)
- [NVIDIA Dynamo 아키텍처](https://developer.nvidia.com/blog/disaggregated-serving-with-nvidia-dynamo/)
- [AWS DLC vLLM 이미지](https://github.com/aws/deep-learning-containers/tree/master/vllm)

:::note 연락처
- **작성자**: YoungJoon Jeong, Sr. SSA Containers, AWS
- **GitHub**: [@devfloor9](https://github.com/devfloor9)
- **이메일**: youngjoo@amazon.com (내부 전용)
:::
