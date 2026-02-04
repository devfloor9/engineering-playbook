---
title: "GenAI Platform on Amazon EKS"
description: "Comprehensive workshop guide for building production-ready GenAI platforms on Amazon EKS, covering architecture, implementation, and best practices for AI/ML workloads."
tags: [eks, genai, ai, ml, llm, platform, kubernetes, mlops, dify, vllm]
category: "genai-aiml"
date: 2025-02-04
authors: [devfloor9]
sidebar_position: 2
---

# GenAI Platform on Amazon EKS

## Discovery Workshop Slides

*LG U+ & AWS Joint Workshop - Week 1
Date: June 12, 2025*

---

## Agenda

1. **Opening & Introduction**
2. **LG U+ Business Objectives & KPIs**
3. **Workshop Deliverables & Scope Confirmation**
4. **Current Project Violet Architecture Review**
5. **Gap Analysis & Prioritization**
6. **Success Metrics Definition**
7. **Next Steps & Q&A**

---

## 1. Opening & Introduction

### Welcome & Participants

**LG U+ Team (18 Members)**

- **Executive Leadership**: 정성권 CTO (DAX)
- **Core Platform Team**: 송주영, 배주혁, 윤병찬, 정유진
- **Development Teams**: 김보경, 김진우, 심근우, 이채은, 전다현, 전웅재, 최성욱, 허남준, 이무용, 서선애, 오승철, 금도원, 강예빈

**AWS Team (7 Members)**

- **Technical Lead**: YoungJoon Jeong (WWSO GTM SA)
- **Facilitation**: Ian Choi (WWSO GTM)
- **Account Team**: DongJo Seo (AM), SiMyung Yang (SA)
- **Container Specialists**: Junseok Oh, Kichul Kim, Yoojung Lee

---

## 2. LG U+ Business Objectives & KPIs

### 2.1 Project Violet Overview

**Mission Statement**

:::tip Project Violet Mission
"All in AI" B2B 전략의 핵심 자산으로서 GenAI 서비스 전 생명주기를 자동화하는 플랫폼
:::

### Core Capabilities

- **End-to-end MLOps**: AI 개발, 훈련, 배포, 관리 자동화
- **Self-Service Interface**: 기술/비기술 사용자 모두를 위한 GenAI 서비스 생성
- **Data Integration**: 데이터 관리 플랫폼과의 연동을 통한 지속적 데이터 개선
- **Industry-Specific Models**: 신속한 커스터마이징이 가능한 산업별 AI 모델
- **Multi-Use Case Support**: 콜센터, 기업통신, 중소기업 솔루션, 모빌리티 애플리케이션

---

### 2.2 Business Goals & Success Metrics

#### Primary Business Objectives

---

### 2.3 Technical KPIs

#### Platform Performance Metrics

---

### 2.4 Expected Business Impact

#### Revenue & Cost Impact

- **예상 매출 증가**: 새로운 AI 서비스를 통한 B2B 매출 확대
- **비용 절감**: 클라우드 네이티브 아키텍처를 통한 운영비용 30% 절감
- **Time-to-Market**: AI 서비스 개발/배포 시간 50% 단축

#### Strategic Benefits

- **시장 선점**: 차세대 GenAI 플랫폼 기술 선도
- **고객 만족도**: 향상된 AI 서비스 품질을 통한 고객 만족도 증가
- **조직 역량**: AI/ML 플랫폼 구축 및 운영 역량 내재화

---

## 3. Workshop Deliverables & Scope Confirmation

### 3.1 Workshop Deliverables Overview

#### ✅ What We WILL Deliver

- **Working Blueprints**: Production-ready architecture designs
- **Best-Practice PoCs**: Hands-on implementation examples
- **Technical Documentation**: Comprehensive guides and runbooks
- **Production Roadmap**: Step-by-step implementation plan
- **Team Enablement**: Knowledge transfer and capability building

#### ❌ What We Will NOT Deliver

- **Complete Production System**: This is a blueprint/PoC workshop
- **Custom Business Logic**: LG U+-specific business requirements
- **Data Migration**: Existing data integration and migration
- **End-to-End Testing**: Production-scale performance testing

---

### 3.2 Weekly Deliverables

---

### 3.3 Technology Stack Scope

#### Core Infrastructure

- **Container Orchestration**: Amazon EKS (Auto Mode, Pod Identity)
- **Networking**: Cilium CNI, Gateway API, VPC Lattice
- **Security**: OPA/Kyverno, RBAC, Pod Security Standards
- **GitOps**: ArgoCD, Helm, Kustomize

#### GenAI Technologies

- **Model Serving**: vLLM, Text Generation Inference (TGI)
- **Low-Code Platform**: Dify (Visual AI Workflow Builder)
- **Agent Frameworks**: LangChain, LangGraph, CrewAI
- **Vector Databases**: Integration patterns for RAG

#### Platform Operations

- **Observability**: OpenTelemetry, Prometheus, Grafana, Hubble
- **Cost Management**: Kubecost, Karpenter optimization
- **Automation**: AWS Controllers for Kubernetes (ACK)

---

### 3.4 Success Criteria

#### Technical Success Metrics

#### Knowledge Transfer Success

---

### 3.5 Out of Scope Items

#### Business Logic & Applications

- **Custom Business Workflows**: LG U+-specific business process automation
- **Legacy System Integration**: Existing system migrations and integrations
- **Data Pipelines**: Production data ingestion and transformation
- **User Interface Development**: Custom UI/UX beyond PoC demonstrations

#### Production Operations

- **24/7 Support**: Production support and maintenance
- **Compliance Certification**: Regulatory compliance validation
- **Disaster Recovery**: Full DR implementation and testing
- **Performance Testing**: Production-scale load testing

---

## 4. Workshop Scope Boundaries

### 4.1 What's Included in 5 Weeks

#### ✅ Architecture & Design

- Comprehensive system architecture design
- Security and networking blueprints
- Multi-tenant platform design patterns
- Cost optimization strategies

#### ✅ Hands-on Implementation

- Working PoC deployments
- Configuration templates and scripts
- Integration examples and demos
- Performance optimization examples

#### ✅ Knowledge Transfer

- Technical documentation and runbooks
- Best practices and design patterns
- Troubleshooting guides
- Production readiness checklists

---

### 4.2 Post-Workshop Expectations

#### LG U+ Responsibilities

- **Production Implementation**: Full-scale deployment based on blueprints
- **Business Integration**: Integration with existing LG U+ systems
- **Customization**: Adaptation to specific business requirements
- **Operational Procedures**: 24/7 operations and maintenance

#### AWS Continued Support

- **Office Hours**: Weekly technical consultation (4 weeks)
- **Architecture Reviews**: Quarterly design reviews (6 months)
- **Community Access**: CNCF and AWS community resources
- **Service Team Escalation**: Direct access to AWS service teams when needed

---

## 5. Risk Management & Dependencies

### 5.1 Technical Risks

### 5.2 Project Dependencies

#### External Dependencies

- **AWS Service Availability**: EKS, EC2, VPC service uptime
- **Third-party Tools**: Dify, vLLM, Cilium community support
- **Network Connectivity**: Stable internet connection for cloud resources

#### Internal Dependencies

- **Team Availability**: Key stakeholder participation
- **Decision Making**: Timely architectural decisions
- **Resource Access**: AWS account permissions and access

---

## 6. Communication & Feedback Framework

### 6.1 Weekly Rhythm

- **Daily Standups**: 15-min progress updates during workshop weeks
- **Weekly Retrospectives**: Lessons learned and improvement actions
- **Stakeholder Updates**: Executive summary for leadership team

### 6.2 Feedback Channels

- **Real-time**: Slack workspace for immediate questions
- **Structured**: Weekly feedback forms and surveys
- **Executive**: Bi-weekly leadership briefings

---

## 7. Next Steps & Action Items

### 7.1 Immediate Actions (Week 1)

### 7.2 Week 1 Preparation

---

## 8. Q&A Session

### Discussion Topics

1. **Business Objectives Clarification**
2. **Technical Scope Questions**
3. **Resource Requirements**
4. **Timeline Concerns**
5. **Success Criteria Validation**

---

## Appendix

### A. Contact Information

### B. Reference Materials

### C. Prerequisite Checklist

### D. Weekly Schedule Details

---

*End of Discovery Workshop Slides*
