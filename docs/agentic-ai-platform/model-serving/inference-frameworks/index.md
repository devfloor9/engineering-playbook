---
title: "추론 프레임워크"
sidebar_label: "추론 프레임워크"
description: "vLLM·llm-d·MoE·NeMo — GPU 위에서 실제로 모델을 서빙·분산 추론·파인튜닝하는 AI 프레임워크 계층"
tags: [vllm, llm-d, moe, nemo, inference, fine-tuning, 'scope:tech']
sidebar_position: 2
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 추론 프레임워크

[GPU 인프라](../gpu-infrastructure/index.md) 위에서 실제로 **LLM 을 서빙·분산 추론·파인튜닝** 하는 AI 프레임워크 계층입니다. 단일 노드 고성능 서빙(vLLM), Kubernetes 네이티브 분산 추론(llm-d), MoE 모델 처리, NVIDIA NeMo 기반 학습까지 포함합니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving"
    icon="🚀"
    title="vLLM 모델 서빙"
    description="PagedAttention 기반 고성능 LLM 추론, Continuous Batching, Tensor/Pipeline Parallelism, Multi-LoRA 핫스왑."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode"
    icon="🔀"
    title="llm-d 분산 추론"
    description="Kubernetes 네이티브 분산 추론 스케줄러, KV Cache-aware 라우팅, Prefix Cache 최적화, Disaggregated Serving."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/moe-model-serving"
    icon="🧩"
    title="MoE 모델 서빙"
    description="Mixture of Experts 모델 효율 서빙 — Expert Parallelism, 동적 라우팅, 메모리 최적화."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/nemo-framework"
    icon="🧠"
    title="NeMo 프레임워크"
    description="NVIDIA NeMo 기반 대규모 학습·파인튜닝, 분산 학습, EFA 고속 네트워크, 체크포인팅."
    color="#9c27b0"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/inference-frameworks/semantic-caching-strategy"
    icon="⚡"
    title="Semantic Caching 전략"
    description="LLM Gateway 레벨 의미 기반 캐싱 — 유사도 임계값 설계, 3계층 캐시 구분(KV/Prompt/Semantic), 관측성·보안 가이드."
    color="#22c55e"
  />
</DocCardGrid>

:::tip 학습 순서
**vLLM → llm-d → MoE → NeMo** 순으로 읽으면 "단일 노드 최적화 → 분산 추론 → 대규모 MoE → 학습 프레임워크" 의 점진적 난이도를 따라갈 수 있습니다.
:::
