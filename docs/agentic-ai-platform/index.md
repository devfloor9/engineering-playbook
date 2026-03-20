---
title: "Agentic AI Platform"
sidebar_label: "Agentic AI 플랫폼"
description: "Agentic AI 플랫폼의 아키텍처, 구축, 운영에 대한 심화 기술 문서"
tags: [eks, kubernetes, genai, agentic-ai, gpu, llm, platform]
category: "genai-aiml"
sidebar_position: 3
last_update:
  date: 2026-03-20
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agentic AI Platform

Agentic AI Platform은 자율적인 AI 에이전트가 복잡한 작업을 수행할 수 있도록 지원하는 통합 플랫폼입니다. 이 문서 시리즈는 플랫폼의 아키텍처를 이해하고, 구축 시 직면하는 **5가지 핵심 도전과제**를 파악한 후, **AWS Native 매니지드 접근**과 **EKS 기반 오픈 아키텍처** 두 가지 방식으로 해결하는 여정을 안내합니다. 두 접근은 상호 보완적이며, AWS Native로 시작하여 필요에 따라 EKS로 확장하는 점진적 여정을 권장합니다.

---

## 문서 구성

<DocCardGrid columns={2}>
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="설계 & 아키텍처"
    description="플랫폼의 6개 핵심 레이어와 설계 원칙을 이해하고, 5가지 기술적 도전과제를 파악한 후, AWS Native와 EKS 두 가지 구현 접근을 비교합니다."
    color="#667eea"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/model-serving"
    icon="🚀"
    title="모델 서빙 & 추론 인프라"
    description="EKS GPU 노드 전략, Karpenter 스케일링, vLLM 추론 엔진, llm-d 분산 추론, MoE 서빙, NVIDIA GPU 스택, NeMo 학습 프레임워크."
    color="#ff6b6b"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/gateway-agents"
    icon="🌐"
    title="추론 게이트웨이 & 라우팅"
    description="Self-hosted LLM과 External AI Provider를 통합하는 2-Tier Gateway 아키텍처. 모델별 라우팅, Cascade Routing, 비용 추적."
    color="#3b82f6"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/agent-data"
    icon="🤖"
    title="에이전트 & 데이터"
    description="Kubernetes CRD 기반 AI 에이전트 라이프사이클 관리, MCP/A2A 도구 연결, 벡터 DB 기반 RAG 파이프라인 구축."
    color="#10b981"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="운영 & MLOps"
    description="Agent 모니터링, LLM 트레이싱, RAG 품질 평가, MLOps 파이프라인 자동화, SageMaker-EKS 하이브리드 학습-서빙."
    color="#8b5cf6"
  />
</DocCardGrid>

---

:::info 추천 학습 경로

**플랫폼 구축 경로:**
설계 & 아키텍처 → 모델 서빙 & 추론 인프라 → 추론 게이트웨이 → 에이전트 & 데이터 → 운영 & MLOps

**GenAI 애플리케이션 개발 경로:**
모델 서빙(vLLM) → 분산 추론(llm-d) → 게이트웨이(Inference Gateway) → RAG(Milvus) → Agent(Kagent) → 평가(Ragas)
:::

## 관련 카테고리

- [Operations & Observability](/docs/operations-observability) — AI/ML 워크로드 모니터링
- [Infrastructure Optimization](/docs/infrastructure-optimization) — GPU 성능 최적화
- [Hybrid Infrastructure](/docs/hybrid-infrastructure) — 하이브리드 환경의 AI 배포
