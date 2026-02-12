---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "K8s 플랫폼의 장점을 AI로 극대화하면서 복잡도는 낮춰 혁신을 가속하는 AIOps & AIDLC 가이드"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-12
  author: devfloor9
---

# AIops & AIDLC for Modern Application Platform

**K8s 플랫폼의 다양한 기능과 확장성을 AI로 극대화하면서 복잡도는 낮추고 혁신을 가속하는 모델**

AIops(AI for IT Operations)와 AIDLC(AI-Driven Development Lifecycle)를 결합하여 EKS 기반 Modern Application Platform을 지능적으로 구축하고 운영하는 방법을 다룹니다.

## 핵심 내러티브

```
[1단계] AWS 오픈소스 전략 — K8s 네이티브 관리형 서비스로 진화
  ├─ Managed Add-ons (22+): VPC CNI, CoreDNS, ADOT, GuardDuty, EBS CSI 등
  ├─ 관리형 오픈소스: AMP(Prometheus), AMG(Grafana), ADOT(OpenTelemetry)
  └─ Community Add-ons Catalog (2025.03): metrics-server, cert-manager, external-dns
  → K8s의 장점을 극대화하면서 운영 복잡성 제거
                    ↓
[2단계] EKS = 오픈소스 전략의 핵심 실행자
  ├─ EKS Capabilities (2025.11): Argo CD, ACK, KRO를 AWS 관리형으로 제공
  ├─ ACK: 50+ AWS 서비스를 K8s CRD로 선언적 관리
  ├─ KRO: ResourceGroup CRD로 복합 리소스 단일 배포 단위 구성
  └─ LBC v3 (2025.01): Gateway API GA (L4/L7), QUIC/HTTP3, JWT 검증
  → EKS가 자동화의 핵심 컴포넌트
                    ↓
[3단계] Kiro + MCP = AIOps의 핵심
  ├─ Kiro: Spec-driven 개발 (requirements→design→tasks→코드), MCP 네이티브
  ├─ 개별 MCP 서버 (65+, GA): EKS, CloudWatch, Cost Explorer, Terraform 등
  ├─ Fully Managed MCP (2025.11 Preview): EKS/ECS 클라우드 호스팅
  ├─ AWS MCP Server 통합 (2025.11 Preview): 15,000+ API + Agent SOPs
  └─ 프로그래머틱 자동화: 디렉팅 기반 → 코드 기반 운영/디버깅
  → 비용효율적이고 빠른 대응이 가능한 AI 시대의 운영 방법론
                    ↓
[4단계] AI Agent로 자율 운영 확장
  ├─ Kagent: K8s 네이티브 AI 에이전트, MCP 통합 (kmcp)
  ├─ Strands Agents: AWS 프로덕션 검증, Agent SOPs (자연어 워크플로우)
  └─ Amazon Q Developer: CloudWatch Investigations, EKS 트러블슈팅
  → 다양한 데이터 소스 기반 운영 인사이트 + 세부적·광범위한 컨트롤
```

## 기존 콘텐츠와의 차이점

| 기존 Agentic AI Platform | 이 카테고리 (AIops & AIDLC) |
|--------------------------|---------------------------|
| LLM 서빙 및 추론 최적화 | AI로 플랫폼 자체를 운영하고 개발 |
| vLLM, llm-d 배포 구성 | Kiro+MCP 기반 프로그래머틱 자동화 |
| GPU 리소스 관리 | 예측 스케일링, AI Agent 자율 운영 |
| 실시간 추론 패턴 | 관찰성 스택, AIDLC 개발 방법론 |

## 가이드 구성

### Phase 1: AIOps 전략과 기초

- **[AI로 K8s 운영 혁신하기 — AIOps 전략 가이드](./aiops-introduction.md)** — AIOps 정의, AWS 오픈소스 전략과 EKS 진화, Kiro+MCP 핵심, 프로그래머틱 운영, 성숙도 모델, ROI 평가

### Phase 2: 지능형 관찰성

- **[지능형 관찰성 스택 구축](./aiops-observability-stack.md)** — Managed Add-ons 기반 관찰성, ADOT+AMP+AMG, CloudWatch AI, DevOps Guru, Hosted MCP 통합 분석, SLO/SLI

### Phase 3: AI 주도 개발

- **[AIDLC 프레임워크](./aidlc-framework.md)** — Kiro Spec-driven 개발, AI 코딩 에이전트, EKS Capabilities(Managed Argo CD, ACK, KRO) + GitOps, Quality Gates, AI Agent 거버넌스

### Phase 4: 예측 운영

- **[예측 스케일링 및 자동 복구](./aiops-predictive-operations.md)** — ML 예측 스케일링, Karpenter+AI, CloudWatch Anomaly Detection, AI Agent 자율 대응, Kiro 프로그래머틱 디버깅, Chaos Engineering

### MLOps 파이프라인

MLOps 관련 문서는 **[Agentic AI Platform](/docs/agentic-ai-platform)** 카테고리로 이동했습니다:

- [EKS 기반 MLOps 파이프라인](/docs/agentic-ai-platform/mlops-pipeline-eks) — Kubeflow + MLflow + KServe
- [SageMaker-EKS 통합](/docs/agentic-ai-platform/sagemaker-eks-integration) — 하이브리드 ML 아키텍처

## 핵심 기술 스택

| 영역 | AWS 서비스 | 오픈소스/도구 |
|------|-----------|-------------|
| **관찰성** | CloudWatch, X-Ray, AMP, AMG | ADOT (OpenTelemetry), Grafana |
| **이상 탐지** | DevOps Guru, CloudWatch AI, Anomaly Detection | Prometheus + ML |
| **AI 개발** | Kiro, Amazon Q Developer | GitHub Copilot, Claude Code |
| **MCP 통합** | 개별 MCP (65+ GA), Fully Managed MCP (EKS/ECS Preview), AWS MCP Server 통합 (Preview) | Kagent (kmcp) |
| **GitOps** | Managed Argo CD (EKS Capability) | Argo CD |
| **인프라 선언** | ACK (50+ AWS CRD), KRO (ResourceGroup) | Terraform, Helm |
| **네트워킹** | LBC v3 (Gateway API GA), Container Network Observability | Gateway API |
| **AI Agent** | Amazon Q Developer, Strands Agents | Kagent |
| **예측 스케일링** | CloudWatch Anomaly Detection | Prophet, ARIMA |
| **노드 관리** | Karpenter | - |

## 학습 경로

```
[시작] AIOps 소개 — 전략과 방향성 이해
   ↓
[기반] 지능형 관찰성 스택 — 데이터 수집·분석 기반 구축
   ↓
[실천] AIDLC 프레임워크 — AI 주도 개발 방법론
   ↓
[심화] 예측 스케일링 및 자동 복구 — 자율 운영 실현
```

## 참고 자료

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [AWS MCP Servers (개별 65+ GA)](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
