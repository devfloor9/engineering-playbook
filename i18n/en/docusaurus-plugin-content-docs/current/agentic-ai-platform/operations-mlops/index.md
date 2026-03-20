---
title: "운영 & MLOps"
sidebar_label: "운영 & MLOps"
sidebar_position: 5
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 운영 & MLOps

프로덕션 배포 이후의 모니터링, 관측성, 품질 평가, CI/CD 파이프라인, 하이브리드 학습-서빙 아키텍처를 구성합니다. 안정적인 운영과 지속적 개선 체계를 수립하는 방법을 다룹니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/agent-monitoring"
    icon="📈"
    title="Agent 모니터링 & 운영"
    description="에이전트 상태 및 성능 모니터링. LLM 트레이싱 통합, 토큰 비용 추적, 알림 규칙, 운영 대시보드 구성."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/ragas-evaluation"
    icon="✅"
    title="Ragas 평가"
    description="RAG 파이프라인 품질 평가 프레임워크. Faithfulness, Relevance, Correctness 메트릭, CI/CD 통합 자동 평가."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/llmops-observability"
    icon="👁️"
    title="LLMOps Observability"
    description="Langfuse, LangSmith, Helicone 비교 가이드. LLM 트레이싱, 토큰 비용 분석, 프롬프트 품질 모니터링."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/mlops-pipeline-eks"
    icon="⚙️"
    title="MLOps 파이프라인"
    description="Kubeflow + MLflow + ArgoCD GitOps 기반 ML 파이프라인. 학습 → 평가 → 레지스트리 → 배포 자동화."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/sagemaker-eks-integration"
    icon="🔬"
    title="SageMaker-EKS 통합"
    description="SageMaker 학습 + EKS 서빙 하이브리드 패턴. 매니지드 학습 인프라와 EKS 추론 서빙의 최적 조합."
    color="#ff9900"
  />
</DocCardGrid>
