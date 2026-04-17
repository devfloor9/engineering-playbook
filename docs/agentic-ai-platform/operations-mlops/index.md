---
title: "운영 & 거버넌스"
sidebar_label: "운영 & 거버넌스"
description: "AI 플랫폼 모니터링, Observability, 평가, 컴플라이언스, 도메인 특화 운영 가이드"
tags: [operations, monitoring, observability, mlops, compliance]
sidebar_position: 4
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 운영 & 거버넌스

프로덕션 AI 플랫폼의 안정적 운영을 위한 **모니터링**, **Observability**, **품질 평가**, **컴플라이언스**, **도메인 특화 운영** 가이드를 제공합니다.

이 섹션은 다음 영역을 통합적으로 다룹니다:

- **모니터링 & Observability**: Agent 상태 추적, LLM 트레이싱, 토큰 비용 분석
- **품질 평가**: RAG 파이프라인 평가 프레임워크 (Ragas)
- **Agent 관리**: Kubernetes 기반 Agent 라이프사이클 관리 (Kagent)
- **엔터프라이즈 운영**: Playbook, 컴플라이언스, 도메인 특화 커스터마이징
- **벡터 데이터베이스**: Milvus 운영 가이드

:::tip 실전 배포 가이드
MLOps 파이프라인 구축 및 SageMaker-EKS 통합 등 실제 배포 아키텍처는 [Reference Architecture](../reference-architecture/index.md) 섹션을 참조하세요.
:::

## 문서 목록

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/agent-monitoring"
    icon="📈"
    title="Agent 모니터링 & 운영"
    description="에이전트 상태 및 성능 모니터링. LLM 트레이싱 통합, 토큰 비용 추적, 알림 규칙, 운영 대시보드 구성."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/llmops-observability"
    icon="👁️"
    title="LLMOps Observability"
    description="Langfuse, LangSmith, Helicone 비교 가이드. LLM 트레이싱, 토큰 비용 분석, 프롬프트 품질 모니터링."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent: Kubernetes Agent 관리"
    description="Kubernetes 기반 Agent 라이프사이클 관리. Pod-based Agent 배포, 동적 스케일링, 헬스체크 통합."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/ragas-evaluation"
    icon="✅"
    title="Ragas 평가"
    description="RAG 파이프라인 품질 평가 프레임워크. Faithfulness, Relevance, Correctness 메트릭, CI/CD 통합 자동 평가."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/agentic-playbook"
    icon="📚"
    title="Agentic Playbook"
    description="프로덕션 Agent 운영을 위한 Best Practice 모음. 장애 대응, 성능 튜닝, 비용 최적화 시나리오별 플레이북."
    color="#ec4899"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/ai-gateway-guardrails"
    icon="🛡️"
    title="AI Gateway Guardrails"
    description="LLM Gateway 레벨 Guardrails. PII Redaction, Prompt Injection 방어, 도구 비교(Guardrails AI/NeMo/Llama Guard/Bedrock), 한국 금융권 컴플라이언스 매핑."
    color="#dc2626"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/compliance-framework"
    icon="🔒"
    title="컴플라이언스 프레임워크"
    description="규제 준수 및 거버넌스 체계. GDPR, HIPAA, 금융권 규정 대응, 감사 로그, 데이터 보호 정책 수립."
    color="#ef4444"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/domain-customization"
    icon="🎯"
    title="도메인 특화 커스터마이징"
    description="산업별 Agent 커스터마이징 가이드. 금융, 헬스케어, 제조업 등 도메인별 특화 전략 및 구현 패턴."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/milvus-vector-database"
    icon="🗄️"
    title="Milvus 벡터 데이터베이스"
    description="프로덕션 벡터 DB 운영. Milvus 클러스터 구성, 인덱스 최적화, 백업/복구, 성능 튜닝 가이드."
    color="#7c3aed"
  />
</DocCardGrid>

## 관련 섹션

- **[Reference Architecture](../reference-architecture/index.md)**: MLOps 파이프라인, SageMaker-EKS 통합, 실전 배포 가이드
- **[AIDLC > AgenticOps](/docs/aidlc/operations)**: AIOps 기반 자동화된 운영 및 예측 모니터링
- **[설계 & 아키텍처](../design-architecture/index.md)**: 플랫폼 전체 아키텍처 설계 문서
