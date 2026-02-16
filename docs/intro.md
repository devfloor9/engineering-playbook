---
title: 소개
description: 클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트 — Amazon EKS 인프라 최적화, Agentic AI 플랫폼, AIOps/AIDLC, 성능 벤치마크
category: "getting-started"
tags: [kubernetes, cloud-native, introduction, getting-started]
sidebar_position: 1
last_update:
  date: 2026-02-13
  author: devfloor9
---

# Engineering Playbook

**클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트**에 오신 것을 환영합니다. 이 플레이북은 Amazon EKS 기반 클라우드 네이티브 인프라 최적화, Agentic AI 플랫폼 엔지니어링, AIOps/AIDLC 방법론을 위한 실전 가이드와 아키텍처 패턴을 종합적으로 다룹니다. 각 기술 도메인에 대한 **정량적 성능 벤치마크 리포트**를 함께 제공하여, 데이터 기반의 아키텍처 의사결정을 지원합니다.

## 주요 내용

이 플레이북은 일곱 가지 핵심 기술 도메인과 독립적인 벤치마크 리포트 섹션으로 구성되어 있으며, 각 도메인에는 상세한 구현 가이드, 트러블슈팅 자료, 실제 사례와 정량적 성능 데이터가 포함되어 있습니다.

### [Infrastructure Optimization](./infrastructure-optimization/)

- Gateway API 도입 가이드 (NGINX Ingress EOL 대응, 5개 솔루션 비교)
- CoreDNS 모니터링 및 최적화
- Karpenter 오토스케일링
- East-West 트래픽 최적화
- 비용 관리 및 최적화

### [Operations & Observability](./operations-observability/)

- GitOps 기반 클러스터 운영
- 노드 모니터링 에이전트 배포
- EKS 장애 진단 및 대응
- EKS 고가용성 및 복원력 아키텍처

### [Agentic AI Platform](./agentic-ai-platform/)

- 프로덕션 GenAI 플랫폼 아키텍처
- GPU 리소스 관리 및 최적화
- vLLM / MoE 모델 서빙
- llm-d 분산 추론 (EKS Auto Mode)
- Inference Gateway 라우팅
- Milvus 벡터 DB 및 RAG
- Kagent Kubernetes AI 에이전트
- Langfuse 에이전트 모니터링
- NeMo Framework 통합
- Amazon Bedrock AgentCore + MCP
- RAGAS 평가 프레임워크

### [AIops & AIDLC](./aiops-aidlc/)

- AIOps 소개 및 EKS 적용 전략
- EKS 지능형 관찰성 스택 (ADOT + AMP/AMG + CloudWatch AI)
- AIDLC 프레임워크 (Kiro + MCP + DevOps Agent)
- 예측 스케일링 및 자동 복구 패턴

### [Hybrid Infrastructure](./hybrid-infrastructure/)

- 하이브리드 노드 도입 가이드
- SR-IOV DGX H200 고성능 네트워킹
- 하이브리드 노드 파일 스토리지
- Harbor 컨테이너 레지스트리 통합

### [Security & Governance](./security-governance/)

- Identity-First Security
- GuardDuty Extended Threat Detection
- Kyverno 정책 관리
- Default Namespace 인시던트 분석
- 소프트웨어 공급망 보안

### [ROSA](./rosa/)

- ROSA 데모 설치 가이드
- ROSA 보안 및 컴플라이언스

### [Benchmark Reports](./benchmarks/)

- 인프라 성능 벤치마크
- CNI 성능 비교 (Cilium vs VPC CNI)
- AI/ML 워크로드 벤치마크
- 하이브리드 인프라 벤치마크
- 보안 운영 벤치마크

## 시작하기

1. **클라우드 네이티브가 처음이신가요?** 각 도메인의 소개 문서부터 시작하세요
2. **특정 사용 사례가 있으신가요?** 검색 기능을 활용하여 관련 가이드를 찾아보세요
3. **구현 준비가 되셨나요?** 코드 예제가 포함된 단계별 가이드를 따라하세요

## 플레이북 활용 방법

각 가이드는 일관된 구조를 따릅니다:

- **개요**: 배경과 목표
- **사전 요구사항**: 필요한 지식과 도구
- **아키텍처**: 시스템 설계와 구성요소
- **구현**: 단계별 구현 방법
- **모니터링**: 검증 및 관찰성
- **트러블슈팅**: 일반적인 문제와 해결 방법

## 기여하기

이 플레이북은 최신 클라우드 네이티브 패턴과 모범 사례로 지속적으로 업데이트됩니다. 기여, 이슈 또는 제안 사항은 [GitHub 저장소](https://github.com/devfloor9/engineering-playbook)를 방문해 주세요.

## 지원

- **문서 관련 이슈**: [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues)
- **기술 질문**: 검색 기능을 활용하거나 태그별로 찾아보세요
