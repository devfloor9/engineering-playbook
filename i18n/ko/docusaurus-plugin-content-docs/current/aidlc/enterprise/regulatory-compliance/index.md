---
title: AI 규제 컴플라이언스 프레임워크
description: EU AI Act, NIST AI RMF, ISO/IEC 42001, 한국 AI 기본법 4개 프레임워크의 AIDLC 통합 가이드
created: "2026-04-18"
last_update:
  date: 2026-10-29
  author: devfloor9
reading_time: 8
tags:
  - compliance
  - regulation
  - eu-ai-act
  - nist
  - iso-42001
  - scope:enterprise
sidebar_label: Regulatory Compliance
---

## 개요

2026년 현재, 글로벌 기업은 **여러 지역의 AI 규제를 동시에 준수**해야 하는 복잡한 환경에 직면했습니다:

- **EU**: AI Act (2024 채택, 2025-2027 단계적 적용: 금지 조항 2025년 2월, GPAI 의무 2025년 8월, 일반·고위험 2026년 8월, Annex I 고위험 2027년 8월)
- **미국**: NIST AI RMF 1.0 (자발적 프레임워크), 적용되는 연방·기관별 조달 정책, 주별 개별 규제
- **한국**: AI 기본법 (2026년 1월 22일 시행)
- **국제 표준**: ISO/IEC 42001:2023 (AI Management System 인증)

### 왜 AIDLC 통합이 필요한가

규제 요구사항을 **AIDLC 프로세스 단계에 직접 매핑**하면:

1. **추적 가능한 통제 커버리지**: 각 단계에서 필요한 controls를 추적 가능하게 매핑 (매핑은 준수를 돕지만 자동 보장하지는 않음)
2. **통합 감사 로그**: 단일 감사 추적 체계로 모든 규제 대응
3. **효율적 업데이트**: 규제 변화 시 AIDLC 단계 정의만 수정
4. **증거 수집 지원**: 컴플라이언스 보고서 생성 지원

```mermaid
graph TB
    subgraph Regulations["규제 프레임워크"]
        EU[EU AI Act]
        NIST[NIST AI RMF]
        ISO[ISO/IEC 42001]
        KR[한국 AI 기본법]
    end

    subgraph AIDLC["AIDLC 프로세스"]
        INC[Inception<br/>요구사항·설계]
        CON[Construction<br/>구현·테스트]
        OPS[Operations<br/>배포·모니터링]
    end

    EU -->|risk tier 분류| INC
    NIST -->|GOVERN/MAP| INC
    ISO -->|PDCA 계획| INC
    KR -->|영향평가| INC

    EU -->|robustness tests| CON
    NIST -->|MEASURE| CON
    ISO -->|구현·검증| CON
    KR -->|투명성 표시| CON

    EU -->|post-market monitoring| OPS
    NIST -->|MANAGE| OPS
    ISO -->|감사·개선| OPS
    KR -->|사후관리| OPS

    style Regulations fill:#ff9800,color:#fff
    style AIDLC fill:#2196f3,color:#fff
```

---

## 4개 프레임워크 요약

### EU AI Act (2024-2027)

**핵심 특징:**
- 세계 최초 포괄적 AI 규제 (법적 구속력)
- 4단계 위험도 분류 (Prohibited/High-risk/Limited/Minimal)
- 고위험 AI 시스템 엄격한 의무 (위험 관리, 데이터 거버넌스, 기술 문서, 자동 로깅, 투명성, 인간 감독, 견고성)
- 위반 과태료: 최대 35M€ 또는 전 세계 매출의 7%

**AIDLC 적용:**
- **Inception**: Risk Tier 분류, 위험 관리 계획
- **Construction**: 기술 문서 자동 생성, 감사 로그, Robustness 테스트
- **Operations**: Post-market monitoring, 사고 보고 (Art. 73, 일반 15일/중대 2일/사망 10일)

[상세 가이드 →](./frameworks/eu-ai-act.md)

### NIST AI RMF 1.0 {#nist-ai-rmf-11}

**핵심 특징:**
- 미국 NIST 발표; 법률·기관 정책·계약의 의무와 별도로 적용하는 자발적 프레임워크
- 4 Functions: GOVERN, MAP, MEASURE, MANAGE
- Generative AI Profile (NIST AI 600-1, 2024-07)은 AI RMF 1.0의 보조 자료
- 국제 호환 (ISO/IEC 42001 상호 매핑 가능)

**AIDLC 적용:**

4개 Function은 단계별로 한 번씩 끝나는 순차 작업이 아니라 반복적이며, 특히 GOVERN과 MANAGE는 전 단계에 걸쳐 지속적으로 작동합니다. 아래 매핑은 각 Function이 어느 단계에서 특히 집중되는지를 나타냅니다.

- **Inception**: GOVERN + MAP (거버넌스·위험 식별)
- **Construction**: MEASURE (성능·편향·견고성 평가)
- **Operations**: MANAGE (위험 대응·지속 모니터링)

[상세 가이드 →](./frameworks/nist-ai-rmf.md)

### ISO/IEC 42001:2023

**핵심 특징:**
- 국제 표준 AI 관리 시스템 (인증 가능)
- PDCA 기반 (Plan-Do-Check-Act 사이클)
- 9개 통제 목표(A.2~A.10) 아래 38개 통제 (Annex A; 2026-10-29 기준 공개 2차 해설 자료로 확인했으며 유료 표준 원문과는 대조하지 않음)
- ISMS (ISO 27001), QMS (ISO 9001)와 통합 운영 가능

**AIDLC 적용:**
- **Inception**: Plan (위험 평가·정책 수립)
- **Construction**: Do + Check (구현·검증·모니터링)
- **Operations**: Act (개선·시정 조치)

[상세 가이드 →](./frameworks/iso-42001.md)

### 한국 AI 기본법 (2026)

**핵심 특징:**
- 2026년 1월 22일 시행
- 고영향 또는 생성형 AI 이용 시 사용자 사전 고지 의무 (고영향 AI는 영향 평가를 포함한 안전성 확보 조치, 세부 기준은 시행령)
- 생성형 AI 표시 의무 (워터마크/메타데이터 권장)
- PIPA/ISMS-P와 교차 준수

**AIDLC 적용:**
- **Inception**: 영향 평가 (고영향 AI 판정 — 법령상 영역 기준)
- **Construction**: AI 생성 코드 투명성 표시
- **Operations**: 사후 관리 (오작동 시정, 중대 사고 보고)

[상세 가이드 →](./frameworks/korea-ai-law.md)

---

## 교차 매핑 표 (Comparative Matrix)

### 통제 요소별 규제 매핑

| 통제 요소 | EU AI Act | NIST AI RMF | ISO/IEC 42001 | 한국 AI 기본법 |
|----------|-----------|-------------|---------------|---------------|
| **리스크 평가** | Art. 6, 9 (위험 관리) | MAP 5.1 | A.5.1 (정책), A.10.2 (위험 관리) | 영향 평가 (고영향 AI) |
| **데이터 거버넌스** | Art. 10 (데이터 품질) | MAP 2.3 | A.7.* (데이터 12개 controls) | PIPA 준수 |
| **투명성·설명가능성** | Art. 13 (투명성) | MEASURE 2.8 / 2.9 | A.8.2 (투명성), A.8.3 (설명) | 생성형 AI 표시 의무 |
| **인간 감독 (HITL)** | Art. 14 (인간 감독) | MAP 3.5 | A.10.5 (인간 개입) | 제34조제1항제4호 (고영향 AI에 대한 사람의 관리·감독) |
| **기술 문서** | Art. 11 (문서화) | GOVERN 1.4 | A.8.1 (문서), A.10.6 (기록) | 제34조제1항제5호 (안전성·신뢰성 확보 조치 문서의 작성·보관, 고영향 AI) |
| **성능 모니터링** | Art. 15 (정확성) | MEASURE 2.3 / 2.4 | A.11.1 (성능 메트릭) | - |
| **사후 모니터링** | Art. 72 (post-market) | MANAGE 4.1 | A.10.10 (지속 모니터링) | 사후 관리 의무 |
| **사고 보고** | Art. 73 (지체 없이·일반 15일/광범위·중대 2일/사망 10일, 고위험 제공자) | MANAGE 4.3 | A.10.11 (사고 대응) | 중대 사고 보고 |
| **보안** | Art. 15 (사이버보안) | MEASURE 2.7 | A.12.* (보안 10개) | ISMS-P 연계 |
| **공급망 관리** | - | GOVERN 6.1 / MANAGE 3.1 | A.13.* (타사 6개) | - |

ISO/IEC 42001 열의 통제 식별자는 표준 원문(유료)과 대조하지 못한 값입니다(2026-10-29 기준). 공개된 2차 해설 자료는 Annex A를 A.2~A.10의 9개 통제 목표와 38개 통제로 설명하므로, 이 열의 식별자(A.11~A.13 포함)는 인증이나 감사의 근거로 쓰기 전에 원문으로 확인해야 합니다. 한국 AI 기본법 열의 `-`는 법률 본문에서 해당 통제를 직접 정한 조문을 찾지 못했다는 뜻이며, 시행령과 고시는 확인하지 못했습니다.

### AIDLC 단계별 규제 요구사항 집계

```mermaid
graph TB
    subgraph Inception["Inception 단계"]
        I1["EU AI Act: Risk Tier 분류 (Art. 6)"]
        I2["NIST: GOVERN + MAP"]
        I3["ISO 42001: Plan (PDCA)"]
        I4["한국: 영향 평가"]
    end

    subgraph Construction["Construction 단계"]
        C1["EU AI Act: 문서화 (Art. 11), 로깅 (Art. 12)"]
        C2["NIST: MEASURE"]
        C3["ISO 42001: Do + Check (PDCA)"]
        C4["한국: 생성 표시 의무"]
    end

    subgraph Operations["Operations 단계"]
        O1["EU AI Act: Post-market monitoring (Art. 72)"]
        O2["NIST: MANAGE"]
        O3["ISO 42001: Act (PDCA)"]
        O4["한국: 사후 관리"]
    end

    I1 -.공통 목표: 위험 식별.-> I2
    I2 -.공통 목표: 위험 식별.-> I3
    I3 -.공통 목표: 위험 식별.-> I4

    C1 -.공통 목표: 안전성 검증.-> C2
    C2 -.공통 목표: 안전성 검증.-> C3
    C3 -.공통 목표: 안전성 검증.-> C4

    O1 -.공통 목표: 지속 모니터링.-> O2
    O2 -.공통 목표: 지속 모니터링.-> O3
    O3 -.공통 목표: 지속 모니터링.-> O4

    style Inception fill:#4caf50,color:#fff
    style Construction fill:#2196f3,color:#fff
    style Operations fill:#ff9800,color:#fff
```

---

## 다음 단계

import DocCardList from '@theme/DocCardList';

<DocCardList />

---

## 참고 자료

### 공식 문서

**EU AI Act:**
- [Regulation (EU) 2024/1689 (Official Text)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689)
- [EU AI Act Timeline (European Commission)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

**NIST AI RMF:**
- [NIST AI RMF 1.0 (2023-01)](https://www.nist.gov/itl/ai-risk-management-framework)
- [Executive Order 14110 (Federal Register)](https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence) (2025년 1월 폐지, 역사적 참고용)

**ISO/IEC 42001:**
- [ISO/IEC 42001:2023 (ISO Store)](https://www.iso.org/standard/81230.html)
- [ISO/IEC 42001 AI Management System (BSI)](https://www.bsigroup.com/en-GB/products-and-services/standards/iso-42001-ai-management-system/)

**한국 AI 기본법:**
- [과학기술정보통신부 AI 정책](https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112)
- [개인정보보호법 (PIPA)](https://www.pipc.go.kr/np/default/page.do?mCode=D030010000)

### AWS 관련 자료

- [AWS Artifact (Compliance Reports)](https://aws.amazon.com/artifact/) — AWS의 ISO/IEC 42001:2023 인증서를 열람할 수 있습니다(2026-10-29 기준, [AWS ISO/IEC 42001 FAQ](https://aws.amazon.com/compliance/iso-42001-faqs/)). EU AI Act 관련 보고서 제공 여부는 확인하지 못했으므로 Artifact에서 현재 제공 목록을 직접 확인하세요.
- [AWS Compliance Center](https://aws.amazon.com/compliance/programs/) — 지역별 규제 매핑
- [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) — 런타임 가드레일 구현

### 관련 AIDLC 문서

- [거버넌스 프레임워크](../governance-framework.md) — 3층 거버넌스 모델, 스티어링 파일
- [하네스 엔지니어링](../../methodology/harness-engineering.md) — Quality Gates, 독립 검증 원칙
- [Adaptive Execution](../../methodology/adaptive-execution.md) — AIDLC 단계별 실행 조건
- [도입 전략](../adoption-strategy.md) — 조직별 AIDLC 도입 로드맵
