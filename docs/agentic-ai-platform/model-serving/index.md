---
title: "모델 서빙 & 추론 인프라"
sidebar_label: "모델 서빙 & 추론 인프라"
description: "GPU 인프라 계층과 추론·학습 프레임워크 계층으로 나뉜 모델 서빙 가이드"
created: 2026-03-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - model-serving
  - gpu
  - vllm
  - llm-d
  - inference
  - eks
  - scope:tech
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

GPU/가속기 위에서 LLM 을 배포하고 서빙하는 방법을 다룹니다. 추론이 인프라 레벨에서 어떻게 동작하고 어느 계층에서 무엇을 튜닝하는지에 대한 전체 지도는 먼저 **추론 인프라 개요**를 읽는 것을 권장합니다.

- **추론 인프라 개요**: 요청 경로 전체와 계층별 튜닝 레버(게이트웨이·라우팅·캐시)를 한 장으로 정리하는 진입 문서.
- **GPU 인프라 계층**: Kubernetes 위에서 GPU 인스턴스·드라이버·스케줄러·파티셔닝을 관리하는 계층. 어느 노드에 어떻게 GPU 를 할당할지 결정합니다.
- **추론 프레임워크 계층**: 확보된 GPU 위에서 실제로 모델을 서빙·분산 추론·파인튜닝하는 AI 프레임워크 계층. vLLM·llm-d·MoE·NeMo 가 여기 속합니다.
- **추론 최적화 & 라우팅 계층**: KV 캐시·Disaggregated Serving·LMCache·캐시 히트 전략과 게이트웨이 라우팅으로 성능과 비용을 최적화하는 계층.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-infrastructure-overview"
    icon="🗺️"
    title="추론 인프라 개요"
    description="추론 요청의 전체 경로와 계층별 튜닝 레버(인퍼런스 게이트웨이·prefill/decode 분리·KV cache-aware 라우팅·LMCache·캐시 히트 전략)를 한 장의 지도로 정리한 진입 문서."
    color="#9c27b0"
  />
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
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-optimization"
    icon="⚡"
    title="추론 최적화 & 라우팅"
    description="KV Cache 최적화, Disaggregated Serving, LMCache, 캐시 히트 전략, 티어드 게이트웨이·Cascade 라우팅 전략."
    color="#00897b"
  />
</DocCardGrid>

:::tip 학습 순서
**추론 인프라 개요**로 전체 그림을 잡은 뒤 **GPU 인프라 → 추론 프레임워크 → 추론 최적화 & 라우팅** 순으로 읽는 것이 자연스럽습니다. GPU 인프라에서 "어떤 노드·파티셔닝·드라이버 스택을 쓸 것인가" 를 결정하고, 추론 프레임워크에서 "그 위에 vLLM·llm-d 를 어떻게 배포할 것인가" 를, 추론 최적화 & 라우팅에서 "어떻게 성능·비용을 최적화하고 트래픽을 라우팅할 것인가" 를 다룹니다.
:::
