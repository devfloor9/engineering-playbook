---
title: "Agentic AI Platform"
sidebar_label: "Agentic AI 플랫폼"
description: "Agentic AI 플랫폼의 아키텍처, 구축, 운영에 대한 심화 기술 문서"
tags: [eks, kubernetes, genai, agentic-ai, gpu, llm, platform]
category: "genai-aiml"
sidebar_position: 3
last_update:
  date: 2026-03-27
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agentic AI Platform

Agentic AI Platform은 자율적인 AI 에이전트가 복잡한 작업을 수행할 수 있도록 지원하는 통합 플랫폼입니다. 이 문서 시리즈는 플랫폼의 아키텍처를 이해하고, 구축 시 직면하는 **5가지 핵심 도전과제**를 파악한 후, **AWS Native 매니지드 접근**과 **EKS 기반 오픈 아키텍처** 두 가지 방식으로 해결하는 여정을 안내합니다. 두 접근은 상호 보완적이며, AWS Native로 시작하여 필요에 따라 EKS로 확장하는 점진적 여정을 권장합니다.

---

## 문서 구성

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="설계 & 아키텍처"
    description="플랫폼의 6개 핵심 레이어와 설계 원칙을 이해하고, 5가지 기술적 도전과제를 파악한 후, AWS Native와 EKS 두 가지 구현 접근을 비교합니다."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving"
    icon="🚀"
    title="모델 서빙 & 추론 인프라"
    description="EKS GPU 노드 전략, Karpenter 스케일링, vLLM 추론 엔진, llm-d 분산 추론, MoE 서빙, NVIDIA GPU 스택, NeMo 학습 프레임워크."
    color="#ff6b6b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents"
    icon="🌐"
    title="추론 게이트웨이 & 라우팅"
    description="Self-hosted LLM과 External AI Provider를 통합하는 2-Tier Gateway 아키텍처. 모델별 라우팅, Cascade Routing, 비용 추적."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/agent-data"
    icon="🤖"
    title="에이전트 & 데이터"
    description="Kubernetes CRD 기반 AI 에이전트 라이프사이클 관리, MCP/A2A 도구 연결, 벡터 DB 기반 RAG 파이프라인 구축."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="운영 & MLOps"
    description="Agent 모니터링, LLM 트레이싱, RAG 품질 평가, MLOps 파이프라인 자동화, SageMaker-EKS 하이브리드 학습-서빙."
    color="#8b5cf6"
  />
</DocCardGrid>

---

## 엔터프라이즈 도입 전략: 이질적 다중 모델 생태계

Agentic AI를 기업에 도입할 때, 가장 크고 비싼 단일 LLM에 의존하는 방식은 지속 가능하지 않습니다. 연구에 따르면 에이전트 시스템에서 발생하는 LLM 호출의 **40%~70%는 도메인 특화 SLM으로 대체 가능**합니다. 이를 실현하기 위해 기업은 다음 **4가지 데이터 포인트**를 확보해야 합니다.

| # | 데이터 포인트 | 핵심 질문 | 플랫폼 연계 |
|---|-------------|----------|-----------|
| 1 | **워크플로우 분할 & LLM→SLM 전환** | 어떤 호출이 SLM으로 대체 가능한가? | Langfuse 로그 분석 → Bifrost LoRA Alias로 무중단 전환 |
| 2 | **아키텍처 연산 한계 검증** | 산술/논리 연산을 LLM에 맡겨도 되는가? | LangGraph Tool Registry로 외부 도구에 위임 |
| 3 | **인프라 경제성** | 자체 호스팅 vs Bedrock 과금, 어느 쪽이 유리한가? | Auto Mode + vLLM Multi-LoRA + Kubecost 비용 추적 |
| 4 | **거버넌스 & 안전성** | PII 필터링과 Human-in-the-Loop 경계는 어디인가? | NeMo Guardrails + LangGraph `interrupt_before` |

### 우리 아키텍처가 이를 지원하는 방법

이 플랫폼은 처음부터 **이질적 다중 모델 생태계**를 고려하여 설계되었습니다:

```
LLM Orchestrator (Tier 2)          SLM Expert Pool (Tier 1)
┌──────────────────────┐          ┌──────────────────────┐
│ LangGraph            │   작업    │ vLLM Multi-LoRA      │
│ Claude Sonnet 등     │ ──분배──→ │ 7B FAQ · 14B AICC    │
│ 전략 기획, 복잡한 추론 │          │ 도메인 특화 SLM 풀    │
└──────────────────────┘          └──────────────────────┘
         │                                  │
         └──── Bifrost (라우팅 · fallback · 비용 추적) ────┘
```

- **3-Tier Orchestration**: Tier 1(SLM 직접 호출)과 Tier 2(LLM 오케스트레이터)를 코드 변경 없이 분리
- **Bifrost Virtual Key**: JWT claims 기반 팀별 SLM 어댑터 자동 라우팅, LLM fallback 포함
- **LoRA Lifecycle**: Langfuse 피드백 → 파인튜닝 → 어댑터 핫스왑으로 SLM을 지속 개선
- **Tool Delegation**: 트랜스포머의 산술/논리 한계는 Knowledge Graph, Calculator API 등 외부 도구로 보완

> 상세 내용은 [엔터프라이즈 Agentic AI 도입 전략](/docs/agentic-ai-platform/design-architecture/enterprise-agentic-strategy)에서 4가지 영역별 데이터 수집 방법, 비용 시뮬레이션, 실행 로드맵을 확인할 수 있습니다.

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
