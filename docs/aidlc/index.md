---
title: "AIDLC"
sidebar_label: "AIDLC"
description: "AI-Driven Development Lifecycle — AI가 주도하는 소프트웨어 개발 방법론의 엔터프라이즈 적용 가이드"
sidebar_position: 4
category: "aidlc"
last_update:
  date: 2026-04-07
  author: devfloor9
---

# AIDLC: AI-Driven Development Lifecycle

> **읽는 시간**: 약 3분

AIDLC(AI-Driven Development Lifecycle)는 AI가 소프트웨어 개발의 전 과정을 주도하는 새로운 개발 방법론입니다. 기존 SDLC가 사람 중심의 프로세스였다면, AIDLC는 **Intent → Unit → Bolt** 모델을 통해 AI가 요구사항 분석부터 설계, 구현, 테스트까지 개발 주기 전체를 가속합니다.

## 4개 트랙

AIDLC 가이드는 독자의 역할과 관심사에 따라 4개 트랙으로 구성됩니다.

```mermaid
flowchart TB
    subgraph METHOD["방법론"]
        direction TB
        P["10대 원칙<br/>Intent · Unit · Bolt"]
        O["온톨로지 엔지니어링<br/>Typed World Model"]
        H["하네스 엔지니어링<br/>아키텍처 제약 설계"]
        D["DDD 통합<br/>도메인 주도 설계"]
    end

    subgraph ENTER["엔터프라이즈 도입"]
        direction TB
        A["도입 전략<br/>워터폴→하이브리드"]
        R["역할 재정의<br/>하네스 엔지니어"]
        C["비용 효과<br/>RFP 산정 모델"]
        G["거버넌스<br/>3층 프레임워크"]
        M["MSA 복잡도<br/>적합성 평가"]
        CS["사례 연구"]
    end

    subgraph TOOL["도구 & 구현"]
        direction TB
        AI["AI 코딩 에이전트<br/>Kiro · Q Developer"]
        OW["오픈 웨이트 모델<br/>온프레미스 · TCO"]
        EKS["EKS 선언적 자동화<br/>GitOps · Gateway API"]
        TR["기술 로드맵<br/>Build vs Wait"]
    end

    subgraph OPS["AgenticOps"]
        direction TB
        OB["관찰성 스택<br/>ADOT · AMP · CloudWatch"]
        PR["예측 운영<br/>ML 스케일링 · 이상 감지"]
        AR["자율 대응<br/>AI Agent · Chaos Eng"]
    end

    METHOD --> TOOL
    METHOD --> ENTER
    TOOL --> OPS
    OPS -->|"피드백 루프"| METHOD

    style METHOD fill:#326ce5,color:#fff
    style ENTER fill:#ff9900,color:#fff
    style TOOL fill:#76b900,color:#fff
    style OPS fill:#e74c3c,color:#fff
```

## 독자별 학습 경로

| 역할 | 추천 경로 |
|------|----------|
| **경영진 · PM** | [엔터프라이즈 도입](/docs/aidlc/enterprise) → [비용 효과](/docs/aidlc/enterprise/cost-estimation) → [사례 연구](/docs/aidlc/enterprise/case-studies) |
| **아키텍트** | [방법론](/docs/aidlc/methodology) → [온톨로지](/docs/aidlc/methodology/ontology-engineering) → [하네스](/docs/aidlc/methodology/harness-engineering) → [MSA 복잡도](/docs/aidlc/enterprise/msa-complexity) |
| **개발자** | [10대 원칙](/docs/aidlc/methodology/principles-and-model) → [DDD 통합](/docs/aidlc/methodology/ddd-integration) → [AI 코딩 에이전트](/docs/aidlc/toolchain/ai-coding-agents) |
| **운영팀 · SRE** | [AgenticOps](/docs/aidlc/operations) → [관찰성](/docs/aidlc/operations/observability-stack) → [자율 대응](/docs/aidlc/operations/autonomous-response) |
| **보안 · 컴플라이언스** | [거버넌스](/docs/aidlc/enterprise/governance-framework) → [하네스 엔지니어링](/docs/aidlc/methodology/harness-engineering) → [오픈 웨이트 모델](/docs/aidlc/toolchain/open-weight-models) |

## 핵심 개념

### 신뢰성 듀얼 축: 온톨로지 × 하네스

AI 생성 코드의 신뢰성을 체계적으로 보장하기 위해 AIDLC는 두 축의 프레임워크를 도입합니다:

- **[온톨로지](/docs/aidlc/methodology/ontology-engineering)(WHAT + WHEN)**: 도메인 지식을 형식화한 typed world model. Inner/Middle/Outer 피드백 루프를 통해 지속적으로 진화하며 AI 환각을 방지합니다.
- **[하네스 엔지니어링](/docs/aidlc/methodology/harness-engineering)(HOW)**: 온톨로지가 정의한 제약을 아키텍처적으로 검증·강제하는 구조. 서킷 브레이커, 재시도 예산, 출력 게이트 등으로 AI 실행의 안전성을 보장합니다.

## 참고 자료

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
