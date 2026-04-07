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

Agentic AI Platform은 자율적인 AI 에이전트가 복잡한 작업을 수행할 수 있도록 지원하는 통합 플랫폼입니다. 단일 거대 LLM을 기업의 주요 업무에 투입하기에는 **비용**, **응답 지연**, **정보 정확성(환각)**, **거버넌스** 측면에서 분명한 한계가 존재합니다. 기업은 복잡한 추론은 LLM이, 반복적 실무는 도메인 특화 SLM이 담당하는 **이질적 다중 모델 생태계**로 전환해야 하며, 이를 효율적으로 운영하기 위한 **인프라 플랫폼화**가 핵심입니다. Kubernetes는 DRA, Gateway API Inference Extension, Kueue 등 AI 네이티브 기능을 빠르게 확장하고 있으며, 이 플랫폼은 이러한 K8s 생태계 위에서 다중 모델 전환을 **코드 변경 없이** 지원합니다.

이 문서 시리즈는 플랫폼의 아키텍처를 이해하고, 구축 시 직면하는 **5가지 핵심 도전과제**를 파악한 후, **AWS Native 매니지드 접근**과 **EKS 기반 오픈 아키텍처** 두 가지 방식으로 해결하는 여정을 안내합니다. 두 접근은 상호 보완적이며, AWS Native로 시작하여 필요에 따라 EKS로 확장하는 점진적 여정을 권장합니다.

---

## 프로덕션 추론 파이프라인 아키텍처

EKS Auto Mode 기반 프로덕션 추론 파이프라인의 전체 요청 흐름입니다. kgateway ExtProc가 프롬프트를 분석하여 LLM 라우팅을 결정하고, Bifrost 거버넌스 레이어와 llm-d KV Cache-aware 라우팅을 거쳐 최적의 모델에 요청을 전달합니다.

<iframe
  src="/engineering-playbook/agentic-platform-architecture.html"
  style={{width: '100%', height: '1600px', border: 'none', borderRadius: '12px'}}
  title="Agentic AI Platform 추론 파이프라인 아키텍처"
  loading="lazy"
/>

---

## 문서 구성

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture"
    icon="🏗️"
    title="설계 & 아키텍처"
    description="플랫폼 6개 레이어 설계, 5가지 도전과제, AWS Native vs EKS 구현, 2-Tier 추론 게이트웨이 & Cascade Routing 전략."
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
    to="/docs/agentic-ai-platform/operations-mlops"
    icon="📈"
    title="운영 & 거버넌스"
    description="Agent 모니터링, LLMOps Observability, RAG 품질 평가, Agentic Playbook, 컴플라이언스, 도메인 커스터마이징."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/reference-architecture"
    icon="📐"
    title="Reference Architecture"
    description="실전 배포 가이드: 커스텀 모델 배포, Inference Gateway 구성, MLOps 파이프라인, SageMaker-EKS 통합."
    color="#f59e0b"
  />
</DocCardGrid>

---

:::info 추천 학습 경로

**플랫폼 구축 경로:**
설계 & 아키텍처 → 모델 서빙 & 추론 인프라 → 운영 & 거버넌스 → Reference Architecture

**GenAI 애플리케이션 개발 경로:**
모델 서빙(vLLM) → 분산 추론(llm-d) → 게이트웨이(Inference Gateway) → RAG(Milvus) → Agent(Kagent) → 평가(Ragas)
:::

## 관련 카테고리

- [AIDLC](/docs/aidlc) — AI Development Lifecycle 및 AgenticOps
- [Hybrid Infrastructure](/docs/hybrid-infrastructure) — 하이브리드 환경의 AI 배포
- [EKS Best Practices](/docs/eks-best-practices) — EKS 운영 베스트 프랙티스
