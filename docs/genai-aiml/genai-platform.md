---
title: "GenAI Platform on Amazon EKS"
sidebar_label: "GenAI 플랫폼"
description: "Amazon EKS 위에 프로덕션급 GenAI 플랫폼을 구축하기 위한 종합 가이드. 아키텍처 설계부터 구현, 모범 사례까지 AI/ML 워크로드의 전체 생명주기를 다룹니다."
tags: [eks, genai, ai, ml, llm, platform, kubernetes, mlops, dify, vllm]
category: "genai-aiml"
date: 2025-06-12
authors: [devfloor9]
sidebar_position: 2
---

# GenAI Platform on Amazon EKS

## 개요

이 가이드는 Amazon EKS를 기반으로 프로덕션급 GenAI 플랫폼을 구축하기 위한 종합적인 정보를 제공합니다. 최신 AI/ML 기술, 컨테이너 오케스트레이션, 그리고 클라우드 네이티브 아키텍처를 통합하여 안정적이고 확장 가능한 GenAI 서비스 플랫폼을 구현하는 방법을 설명합니다.

### 문제 해결

기존 GenAI 서비스 구축 과정에서의 도전 과제:

- AI 모델 서빙의 복잡성 및 리소스 관리 어려움
- 다양한 ML 프레임워크와 도구의 통합 부족
- 스케일링 및 성능 최적화의 어려움
- MLOps 자동화 및 배포 파이프라인 부재
- 비용 효율적인 리소스 활용 방안 부재

이 가이드는 이러한 문제들을 체계적으로 해결하기 위한 실전 전략을 제시합니다.

---

## Discovery Workshop Slides

**LG U+ & AWS Joint Workshop - Week 1**
**Date: June 12, 2025**

---

## Agenda

1. Opening & Introduction
2. LG U+ Business Objectives & KPIs
3. Workshop Deliverables & Scope Confirmation
4. Current Project Violet Architecture Review
5. Gap Analysis & Prioritization
6. Success Metrics Definition
7. Next Steps & Q&A

---

## 1. Opening & Introduction

### 참여자

**LG U+ Team (18 Members)**

| 역할 | 이름 |
|------|------|
| Executive Leadership | 정성권 CTO (DAX) |
| Core Platform Team | 송주영, 배주혁, 윤병찬, 정유진 |
| Development Teams | 김보경, 김진우, 심근우, 이채은, 전다현, 전웅재, 최성욱, 허남준, 이무용, 서선애, 오승철, 금도원, 강예빈 |

**AWS Team (7 Members)**

| 역할 | 이름 |
|------|------|
| Technical Lead | YoungJoon Jeong (WWSO GTM SA) |
| Facilitation | Ian Choi (WWSO GTM) |
| Account Team | DongJo Seo (AM), SiMyung Yang (SA) |
| Container Specialists | Junseok Oh, Kichul Kim, Yoojung Lee |

---

## 2. LG U+ Business Objectives & KPIs

### 2.1 Project Violet Overview

:::tip Project Violet Mission

"All in AI" B2B 전략의 핵심 자산으로서 GenAI 서비스 전 생명주기를 자동화하는 플랫폼

:::

#### 핵심 역량

| 역량 | 설명 |
|------|------|
| End-to-end MLOps | AI 개발, 훈련, 배포, 관리 자동화 |
| Self-Service Interface | 기술/비기술 사용자 모두를 위한 GenAI 서비스 생성 |
| Data Integration | 데이터 관리 플랫폼과의 연동을 통한 지속적 데이터 개선 |
| Industry-Specific Models | 신속한 커스터마이징이 가능한 산업별 AI 모델 |
| Multi-Use Case Support | 콜센터, 기업통신, 중소기업 솔루션, 모빌리티 애플리케이션 |

---

### 2.2 Business Goals & Success Metrics

#### 주요 비즈니스 목표

프로젝트의 성공을 위한 핵심 비즈니스 목표들을 정의하고 측정 가능한 지표로 변환합니다.

---

### 2.3 Technical KPIs

#### 플랫폼 성능 메트릭

기술적 성공을 측정하기 위한 핵심 성능 지표를 정의합니다.

---

### 2.4 Expected Business Impact

#### 수익 및 비용 영향

| 항목 | 목표 |
|------|------|
| 매출 증가 | 새로운 AI 서비스를 통한 B2B 매출 확대 |
| 비용 절감 | 클라우드 네이티브 아키텍처를 통한 운영비용 30% 절감 |
| Time-to-Market | AI 서비스 개발/배포 시간 50% 단축 |

#### 전략적 이점

| 효과 | 설명 |
|------|------|
| 시장 선점 | 차세대 GenAI 플랫폼 기술 선도 |
| 고객 만족도 | 향상된 AI 서비스 품질을 통한 고객 만족도 증가 |
| 조직 역량 | AI/ML 플랫폼 구축 및 운영 역량 내재화 |

---

## 3. Workshop Deliverables & Scope Confirmation

### 3.1 Workshop Deliverables Overview

#### 제공되는 결과물

:::tip 제공 내용

- **Working Blueprints**: 프로덕션 준비 완료된 아키텍처 설계
- **Best-Practice PoCs**: 실습형 구현 예제
- **Technical Documentation**: 종합 가이드 및 운영 매뉴얼
- **Production Roadmap**: 단계별 구현 계획
- **Team Enablement**: 지식 이전 및 역량 강화

:::

#### 제공하지 않는 항목

:::warning 범위 제외

- **Complete Production System**: 이는 청사진/PoC 워크숍입니다
- **Custom Business Logic**: LG U+ 특화 비즈니스 로직
- **Data Migration**: 기존 데이터 통합 및 마이그레이션
- **End-to-End Testing**: 프로덕션 규모 성능 테스트

:::

---

### 3.2 Weekly Deliverables

주간 워크숍 일정과 각 주의 구체적인 결과물을 정의합니다.

---

### 3.3 기술 스택 범위

#### 핵심 인프라

| 분야 | 기술 |
|------|------|
| Container Orchestration | Amazon EKS (Auto Mode, Pod Identity) |
| Networking | Cilium CNI, Gateway API, VPC Lattice |
| Security | OPA/Kyverno, RBAC, Pod Security Standards |
| GitOps | ArgoCD, Helm, Kustomize |

#### GenAI 기술

| 분야 | 기술 |
|------|------|
| Model Serving | vLLM, Text Generation Inference (TGI) |
| Low-Code Platform | Dify (Visual AI Workflow Builder) |
| Agent Frameworks | LangChain, LangGraph, CrewAI |
| Vector Databases | RAG 통합 패턴 |

#### 플랫폼 운영

| 분야 | 기술 |
|------|------|
| Observability | OpenTelemetry, Prometheus, Grafana, Hubble |
| Cost Management | Kubecost, Karpenter optimization |
| Automation | AWS Controllers for Kubernetes (ACK) |

---

### 3.4 성공 기준

#### 기술적 성공 메트릭

기술적 성공을 측정하기 위한 핵심 지표들을 정의합니다.

#### 지식 이전 성공

워크숍 참여 팀의 역량 강화를 평가하는 기준을 설정합니다.

---

### 3.5 범위 제외 항목

#### 비즈니스 로직 & 애플리케이션

- **Custom Business Workflows**: LG U+ 특화 비즈니스 프로세스 자동화
- **Legacy System Integration**: 기존 시스템 마이그레이션 및 통합
- **Data Pipelines**: 프로덕션 데이터 수집 및 변환
- **User Interface Development**: PoC 데모 이상의 커스텀 UI/UX 개발

#### 프로덕션 운영

- **24/7 Support**: 프로덕션 지원 및 유지보수
- **Compliance Certification**: 규정 준수 검증
- **Disaster Recovery**: 전체 DR 구현 및 테스트
- **Performance Testing**: 프로덕션 규모 성능 테스트

---

## 4. Workshop 범위 경계

### 4.1 5주 기간 내 포함 사항

#### 아키텍처 & 설계

- 종합 시스템 아키텍처 설계
- 보안 및 네트워킹 청사진
- 멀티테넌트 플랫폼 설계 패턴
- 비용 최적화 전략

#### 실습형 구현

- 작동 중인 PoC 배포
- 구성 템플릿 및 스크립트
- 통합 예제 및 데모
- 성능 최적화 예제

#### 지식 이전

- 기술 문서 및 운영 매뉴얼
- 모범 사례 및 설계 패턴
- 문제 해결 가이드
- 프로덕션 준비 체크리스트

---

### 4.2 워크숍 이후 책임

#### LG U+ 책임 사항

| 항목 | 설명 |
|------|------|
| Production Implementation | 청사진 기반 전체 배포 |
| Business Integration | 기존 LG U+ 시스템과의 통합 |
| Customization | 특정 비즈니스 요구사항 대응 |
| Operational Procedures | 24/7 운영 및 유지보수 |

#### AWS 지속 지원

| 항목 | 설명 |
|------|------|
| Office Hours | 주간 기술 상담 (4주) |
| Architecture Reviews | 분기별 설계 검토 (6개월) |
| Community Access | CNCF 및 AWS 커뮤니티 리소스 |
| Service Team Escalation | AWS 서비스 팀 직접 액세스 |

---

## 5. 위험 관리 및 의존성

### 5.1 기술적 위험

프로젝트 진행 중 발생할 수 있는 기술적 위험 요소를 파악하고 완화 전략을 수립합니다.

### 5.2 프로젝트 의존성

#### 외부 의존성

- **AWS Service Availability**: EKS, EC2, VPC 서비스 가용성
- **Third-party Tools**: Dify, vLLM, Cilium 커뮤니티 지원
- **Network Connectivity**: 클라우드 리소스에 대한 안정적인 인터넷 연결

#### 내부 의존성

- **Team Availability**: 주요 이해관계자 참여
- **Decision Making**: 시기적절한 아키텍처 의사 결정
- **Resource Access**: AWS 계정 권한 및 액세스

---

## 6. 소통 및 피드백 프레임워크

### 6.1 주간 리듬

- **Daily Standups**: 워크숍 주간 중 15분 진행률 업데이트
- **Weekly Retrospectives**: 학습 내용 및 개선 사항
- **Stakeholder Updates**: 리더십 팀을 위한 경영진 요약

### 6.2 피드백 채널

| 채널 | 목적 |
|------|------|
| Real-time | Slack 워크스페이스로 즉시 질문 |
| Structured | 주간 피드백 양식 및 설문 조사 |
| Executive | 격주 리더십 브리핑 |

---

## 7. 다음 단계 및 실행 항목

### 7.1 즉시 실행 사항 (Week 1)

첫 주에 완료해야 할 중요한 실행 항목들을 정의합니다.

### 7.2 Week 1 사전 준비

워크숍 시작 전 필요한 사전 준비 사항들을 정리합니다.

---

## 8. 질의응답 세션

### 논의 주제

1. 비즈니스 목표 명확화
2. 기술 범위 관련 질문
3. 리소스 요구사항
4. 타임라인 우려사항
5. 성공 기준 검증

---

## 부록

### A. 연락처 정보

### B. 참고 자료

### C. 사전 요구사항 체크리스트

### D. 주간 일정 상세

---

*Discovery Workshop Slides 종료*
