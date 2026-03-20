---
title: "모델 서빙 & 추론 인프라"
sidebar_label: "모델 서빙 & 추론 인프라"
sidebar_position: 2
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 모델 서빙 & 추론 인프라

GPU/가속기 위에서 LLM을 배포하고 서빙하는 방법을 다룹니다. EKS 인프라 레이어부터 추론 엔진, 분산 서빙, GPU 소프트웨어 스택, 학습 프레임워크까지 순서대로 구성되어 있습니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU 노드 전략"
    description="Auto Mode, Karpenter, Managed Node Group, Hybrid Node의 GPU 워크로드별 최적 노드 전략. 보안 강화 및 트러블슈팅 가이드 포함."
    color="#326ce5"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/gpu-resource-management"
    icon="📊"
    title="GPU 리소스 관리"
    description="Karpenter 기반 GPU 노드 스케일링, KEDA 자동 스케일링, DRA 동적 리소스 할당, Spot/Consolidation 비용 최적화 전략."
    color="#f59e0b"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/vllm-model-serving"
    icon="🚀"
    title="vLLM 모델 서빙"
    description="PagedAttention 기반 고성능 LLM 추론 엔진. 모델 배포, 성능 최적화, Continuous Batching, Tensor Parallelism 설정 가이드."
    color="#ff6b6b"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/llm-d-eks-automode"
    icon="🔀"
    title="llm-d 분산 추론"
    description="Kubernetes 네이티브 분산 추론 스케줄러. KV Cache-aware 라우팅, Prefix Cache 최적화, Disaggregated Serving 아키텍처."
    color="#8b5cf6"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/moe-model-serving"
    icon="🧩"
    title="MoE 모델 서빙"
    description="Mixture of Experts 모델의 효율적 서빙. Expert Parallelism, 동적 라우팅, 메모리 최적화 전략."
    color="#06b6d4"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU 스택"
    description="GPU Operator, DCGM 모니터링, MIG/Time-Slicing 파티셔닝, Dynamo 추론 프레임워크 등 NVIDIA GPU 소프트웨어 스택 가이드."
    color="#76b900"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving/nemo-framework"
    icon="🧠"
    title="NeMo 프레임워크"
    description="NVIDIA NeMo 기반 대규모 모델 학습 및 파인튜닝. 분산 학습, EFA 고속 네트워크, 체크포인팅 전략."
    color="#9c27b0"
  />
</DocCardGrid>

:::tip 학습 순서
인프라부터 시작: **EKS GPU 노드 전략** → **GPU 리소스 관리** → **vLLM 모델 서빙** → **llm-d 분산 추론** 순서로 읽으면 GPU 인프라 위에서 추론 서비스를 구축하는 전체 흐름을 이해할 수 있습니다.
:::
