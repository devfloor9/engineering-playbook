---
title: AIDLC 도구 & 구현
description: AIDLC를 실현하는 도구 — AI 코딩 에이전트, 오픈 웨이트 모델, EKS 자동화, 기술 로드맵
created: "2026-04-07"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 2
tags:
  - aidlc
  - toolchain
  - scope:nav
sidebar_label: 도구 & 구현
---

# AIDLC 도구 & 구현

AIDLC [방법론](/docs/aidlc/methodology)을 실제 프로젝트에서 구현하기 위한 도구와 기술 스택을 다룹니다. AI 코딩 에이전트부터 오픈 웨이트 모델 활용, EKS 기반 선언적 자동화, 기술 투자 로드맵까지 실무 수준의 가이드를 제공합니다.

## 구성

**표 1. AIDLC 도구별 핵심 내용과 대상 독자**

| 문서 | 핵심 내용 | 대상 독자 |
|------|----------|----------|
| [AI 코딩 에이전트](./ai-coding-agents.md) | AIDLC Vibe 워크플로 기반 Spec-Driven 개발, Q Developer, 에이전트 비교 | 개발자, 테크 리드 |
| [오픈 웨이트 모델](./open-weight-models.md) | 온프레미스 배포, 클라우드 vs 자체 호스팅 TCO, 데이터 레지던시 | 아키텍트, 보안 담당자 |
| [EKS 선언적 자동화](./eks-declarative-automation.md) | Managed Argo CD, ACK, KRO, Gateway API | 개발자, DevOps |
| [기술 로드맵](./technology-roadmap.md) | Build-vs-Wait 결정 매트릭스, 투자 계획 | CTO, 엔터프라이즈 아키텍트 |

## 도구 선택 의사결정

**그림 1. 추론 데이터 처리 경계와 코딩 에이전트 선택에 따른 도구 결정 흐름**

```mermaid
flowchart TD
    START["AIDLC 도구 선택"] --> Q1{"추론 데이터가 경계 밖으로<br/>나갈 수 없는가?<br/>(처리 경계)"}
    Q1 -->|"그렇다 (경계 내 처리 필요)"| OW["오픈 웨이트 모델<br/>온프레미스 배포"]
    Q1 -->|"아니다 (저장 레지던시만 요구)"| Q2{"코딩 에이전트<br/>선택"}
    Q2 -->|"Spec-Driven 개발"| KIRO["Kiro"]
    Q2 -->|"실시간 코드 지원"| QD["Q Developer"]
    Q2 -->|"두 가지 모두"| BOTH["Kiro + Q Developer"]
    OW --> HYBRID["하이브리드 구성<br/>클라우드 + 온프레미스"]

    style START fill:#326ce5,color:#fff
    style OW fill:#ff9900,color:#fff
    style KIRO fill:#76b900,color:#fff
    style QD fill:#76b900,color:#fff
```

위 분기는 "데이터 레지던시"를 단순히 있음/없음으로 묻지 않고, **추론 데이터 처리 경계**와 **데이터 저장 레지던시**를 구분합니다. 추론 과정에서 데이터가 경계(온프레미스·특정 VPC 등) 밖으로 나갈 수 없다면 자체 호스팅 오픈 웨이트 모델을 선택합니다. 저장 위치만 특정 리전으로 제한하면 되고 처리 자체는 관리형 서비스로 가능한 경우에는, 데이터 저장 리전을 지정한 채 Kiro·Q Developer 등 관리형 코딩 에이전트를 사용할 수 있습니다.
