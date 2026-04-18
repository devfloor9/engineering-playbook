---
title: "NIST AI RMF — 미국 연방 AI 위험 관리 프레임워크"
sidebar_label: "NIST AI RMF"
description: "NIST AI Risk Management Framework 1.1의 4 Functions (GOVERN/MAP/MEASURE/MANAGE)와 AIDLC 통합 가이드"
tags: [nist, ai-rmf, compliance, federal, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# NIST AI RMF 1.1 (Risk Management Framework)

> 📅 **작성일**: 2026-04-18 | ⏱️ **읽는 시간**: 약 5분

---

## 개요

**NIST AI RMF (Risk Management Framework)**는 미국 국립표준기술연구소(NIST)가 2023년 발표한 AI 위험 관리 프레임워크입니다.

**특징:**
- **자발적 준수** (Voluntary) — 법적 강제력 없음
- **연방 조달 요구사항**: 미국 정부 계약 시 NIST AI RMF 준수 필수 (EO 14110)
- **국제 호환**: ISO/IEC 42001과 상호 매핑 가능

**버전 이력:**
- v1.0 (2023.01): 최초 발표
- v1.1 (2024.12): Generative AI 섹션 추가, 투명성 강화

---

## 4 Functions — GOVERN, MAP, MEASURE, MANAGE

```mermaid
graph LR
    GOV[GOVERN<br/>거버넌스·정책]
    MAP[MAP<br/>맥락·위험 식별]
    MEASURE[MEASURE<br/>평가·테스트]
    MANAGE[MANAGE<br/>대응·모니터링]
    
    GOV --> MAP
    MAP --> MEASURE
    MEASURE --> MANAGE
    MANAGE -.피드백.-> GOV
    
    style GOV fill:#9c27b0,color:#fff
    style MAP fill:#2196f3,color:#fff
    style MEASURE fill:#ff9800,color:#fff
    style MANAGE fill:#4caf50,color:#fff
```

### 1. GOVERN

**목적**: AI 시스템 거버넌스 정책·문화·책임 수립

**핵심 하위 카테고리:**
- **GOVERN-1.1**: AI 위험 관리 전략 수립
- **GOVERN-1.2**: 책임 소재 명확화 (AI 시스템 소유자)
- **GOVERN-1.3**: 법적·규제적·윤리적 고려사항 통합
- **GOVERN-1.4**: 조직 전체 AI 리스크 문화 조성

**AIDLC 매핑**: [거버넌스 프레임워크](../../governance-framework.md) — 3층 거버넌스 모델

### 2. MAP

**목적**: AI 시스템 맥락 이해, 위험 식별

**핵심 하위 카테고리:**
- **MAP-1.1**: 비즈니스 맥락 파악 (사용 사례, 이해관계자)
- **MAP-1.2**: AI 시스템 범위 정의 (입력, 출력, 의존성)
- **MAP-2.1**: 데이터 품질 평가
- **MAP-3.1**: 위험 식별 (편향, 프라이버시, 보안)
- **MAP-5.1**: 임팩트 평가

**AIDLC 매핑**: Inception → Requirements Analysis, Reverse Engineering

### 3. MEASURE

**목적**: AI 시스템 성능·신뢰성·공정성 측정

**핵심 하위 카테고리:**
- **MEASURE-1.1**: 성능 메트릭 정의 (정확도, F1, AUC)
- **MEASURE-2.1**: 설명 가능성 평가
- **MEASURE-2.2**: 편향 테스트 (demographic parity, equalized odds)
- **MEASURE-2.3**: 견고성 테스트 (adversarial robustness)
- **MEASURE-3.1**: 프라이버시 영향 평가

**AIDLC 매핑**: Construction → Build & Test, [하네스 엔지니어링](../../../methodology/harness-engineering.md) Quality Gates

### 4. MANAGE

**목적**: AI 위험 대응·모니터링·지속 개선

**핵심 하위 카테고리:**
- **MANAGE-1.1**: 위험 완화 전략 실행
- **MANAGE-2.1**: 사고 대응 계획
- **MANAGE-3.1**: 지속적 모니터링
- **MANAGE-4.1**: 피드백 루프 (위험 재평가)

**AIDLC 매핑**: Operations → Post-market monitoring, 사고 대응

---

## NIST AI RMF 1.0 → 1.1 주요 변경사항

| 항목 | v1.0 (2023.01) | v1.1 (2024.12) |
|------|---------------|---------------|
| **Generative AI** | 간략한 언급 | 전용 섹션 추가 (Appendix B) |
| **투명성** | MEASURE-2.1 | 강화 (Model Card, Data Sheet 예시) |
| **Red Teaming** | - | MEASURE-2.3 추가 (적대적 테스트) |
| **Supply Chain** | GOVERN-1.5 | 확장 (오픈소스 모델 위험) |

---

## 미국 연방 조달 요구사항 (EO 14110)

**Executive Order 14110 (2023.10.30)**: "Safe, Secure, and Trustworthy AI"

**핵심 내용:**
- 연방 기관은 AI 도입 시 **NIST AI RMF 준수 필수**
- 10^26 FLOP 초과 모델 개발 시 **정부에 보고** 의무
- 연방 조달 계약에 **AI 위험 관리 조항 포함**

**AIDLC 대응**: 미국 연방 계약 프로젝트는 NIST AI RMF 매핑 필수

---

## AIDLC 통합 예시

### Inception 단계: GOVERN + MAP

```yaml
# .aidlc/compliance/nist-map.yaml
project: federal-contract-ai-tool
assessment_date: 2026-04-18

# GOVERN-1.1: AI 위험 관리 전략
governance:
  strategy: "연방 계약 준수 AI 코드 생성 도구"
  responsible_party: "AI Governance Team"
  
# MAP-1.1: 비즈니스 맥락
business_context:
  use_case: "연방 기관 백엔드 서비스 코드 생성"
  stakeholders:
    - "연방 조달 담당자"
    - "개발팀"
    - "보안팀"

# MAP-3.1: 위험 식별
identified_risks:
  - risk_id: RISK-001
    category: "보안"
    description: "생성 코드의 취약점"
    mitigation: "SAST 자동 스캔"
  - risk_id: RISK-002
    category: "프라이버시"
    description: "PII 노출"
    mitigation: "Guardrails 필터"
```

### Construction 단계: MEASURE

```yaml
# .aidlc/harness/nist-measure-gates.yaml
quality_gates:
  # MEASURE-1.1: 성능 메트릭
  - gate: performance_metrics
    enabled: true
    metrics:
      code_coverage: ">= 80%"
      duplication: "<= 3%"
      
  # MEASURE-2.2: 편향 테스트
  - gate: bias_test
    enabled: true
    tests:
      - "demographic_parity_check"
      - "equalized_odds_check"
    
  # MEASURE-2.3: 견고성 테스트
  - gate: adversarial_robustness
    enabled: true
    tools:
      - "bandit"  # SAST
      - "semgrep"
```

### Operations 단계: MANAGE

```yaml
# .aidlc/monitoring/nist-manage.yaml
continuous_monitoring:
  # MANAGE-3.1: 지속적 모니터링
  metrics:
    - name: "error_rate"
      target: "< 1%"
      alert_threshold: 0.95
    - name: "bias_score"
      target: "< 0.05"
      alert_threshold: 0.04
  
  # MANAGE-4.1: 피드백 루프
  feedback_loop:
    frequency: "monthly"
    action: "위험 재평가 및 완화 전략 업데이트"
```

---

## 참고 자료

**공식 문서:**
- [NIST AI RMF 1.1 (2024.12)](https://www.nist.gov/itl/ai-risk-management-framework)
- [Executive Order 14110 (White House)](https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/)

**관련 문서:**
- [규제 컴플라이언스 개요](../index.md)
- [거버넌스 프레임워크](../../governance-framework.md)
- [하네스 엔지니어링](../../../methodology/harness-engineering.md)
