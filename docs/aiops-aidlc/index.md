---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "AI 기반 운영 자동화(AIOps)와 AI 주도 개발 라이프사이클(AIDLC)을 활용한 Modern Application Platform 구축 가이드"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-11
  author: devfloor9
---

# AIops & AIDLC for Modern Application Platform

**AIops(AI for IT Operations)**와 **AIDLC(AI-Driven Development Lifecycle)**를 결합하여 EKS 기반 Modern Application Platform을 지능적으로 구축하고 운영하는 방법을 다룹니다.

## 기존 콘텐츠와의 차이점

| 기존 Agentic AI Platform | 이 카테고리 |
|--------------------------|-------------|
| LLM 서빙 및 추론 최적화 | AI로 플랫폼 자체를 운영 |
| vLLM, llm-d 배포 구성 | Kubeflow, MLflow, KServe 파이프라인 |
| 실시간 추론 패턴 | 학습, 실험 추적, 모델 버전 관리 |
| GPU 리소스 관리 | 예측 스케일링, 자동 복구 |

## 가이드 구성

### Phase 1: AIOps 기초

- **[AIOps 소개](/docs/aiops-aidlc/aiops-introduction)** — AIOps 개념, 전통적 모니터링 vs AI 기반 관찰성, EKS 적용 시나리오
- **[지능형 관찰성 스택](/docs/aiops-aidlc/aiops-observability-stack)** — OpenTelemetry + CloudWatch AI + DevOps Guru 통합 아키텍처

### Phase 2: AI 주도 개발

- **[AIDLC 프레임워크](/docs/aiops-aidlc/aidlc-framework)** — AWS Labs AIDLC 방법론, AI 코딩 에이전트 활용, GitOps 통합

### Phase 3: MLOps 파이프라인

- **[EKS 기반 MLOps 파이프라인](/docs/aiops-aidlc/mlops-pipeline-eks)** — Kubeflow + MLflow + KServe 엔드투엔드 ML 라이프사이클
- **[SageMaker-EKS 통합](/docs/aiops-aidlc/sagemaker-eks-integration)** — 하이브리드 아키텍처, 학습은 SageMaker + 서빙은 EKS

### Phase 4: 예측 운영

- **[예측 스케일링 및 자동 복구](/docs/aiops-aidlc/aiops-predictive-operations)** — ML 기반 예측 오토스케일링, 자가 치유 패턴, 피드백 루프

## 핵심 기술 스택

| 영역 | AWS 서비스 | 오픈소스 |
|------|-----------|---------|
| 이상 탐지 | DevOps Guru, CloudWatch AI | Prometheus + ML 플러그인 |
| ML 파이프라인 | SageMaker Pipelines | Kubeflow, Argo Workflows |
| 모델 레지스트리 | SageMaker Model Registry | MLflow |
| 모델 서빙 | - | KServe, Seldon Core |
| 관찰성 | CloudWatch, X-Ray | OpenTelemetry, Grafana |
| 개발 지원 | Amazon Q Developer | GitHub Copilot |

## 참고 자료

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [Kubeflow on AWS](https://awslabs.github.io/kubeflow-manifests/)
