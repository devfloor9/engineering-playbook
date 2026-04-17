---
title: "모델 서빙 & 추론 인프라"
sidebar_label: "모델 서빙 & 추론 인프라"
description: "GPU 인프라 계층과 추론·학습 프레임워크 계층으로 나뉜 모델 서빙 가이드"
tags: [model-serving, gpu, vllm, llm-d, inference, eks, 'scope:tech']
sidebar_position: 2
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 모델 서빙 & 추론 인프라

GPU/가속기 위에서 LLM 을 배포하고 서빙하는 방법을 두 계층으로 나누어 다룹니다.

- **GPU 인프라 계층**: Kubernetes 위에서 GPU 인스턴스·드라이버·스케줄러·파티셔닝을 관리하는 계층. 어느 노드에 어떻게 GPU 를 할당할지 결정합니다.
- **추론 프레임워크 계층**: 확보된 GPU 위에서 실제로 모델을 서빙·분산 추론·파인튜닝하는 AI 프레임워크 계층. vLLM·llm-d·MoE·NeMo 가 여기 속합니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure"
    icon="🖥️"
    title="GPU 인프라"
    description="EKS GPU 노드 전략, Karpenter·KEDA·DRA 기반 리소스 관리, NVIDIA GPU 스택(ClusterPolicy·DCGM·MIG·Time-Slicing), AWS Neuron Stack(Trainium2/Inferentia2)."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks"
    icon="🚀"
    title="추론 프레임워크"
    description="vLLM PagedAttention·Multi-LoRA, llm-d 분산 추론·KV Cache-aware 라우팅, MoE 모델 서빙, NVIDIA NeMo 학습·파인튜닝 프레임워크."
    color="#ff6b6b"
  />
</DocCardGrid>

:::tip 학습 순서
**GPU 인프라 → 추론 프레임워크** 순으로 읽는 것이 자연스럽습니다. GPU 인프라에서 "어떤 노드·파티셔닝·드라이버 스택을 쓸 것인가" 를 먼저 결정한 뒤, 추론 프레임워크에서 "그 위에 vLLM·llm-d 를 어떻게 배포할 것인가" 를 다룹니다.
:::
