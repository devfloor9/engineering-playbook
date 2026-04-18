---
title: "한국 AI 기본법 — 고영향 AI 규제와 생성형 AI 표시 의무"
sidebar_label: "한국 AI 기본법"
description: "한국 AI 기본법의 고영향 AI 시스템 영향 평가, 생성형 AI 표시 의무, PIPA/ISMS-P 교차 준수 및 AIDLC 통합 가이드"
tags: [korea, ai-law, pipa, isms-p, compliance, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 한국 AI 기본법 (2026 시행 예정)

> 📅 **작성일**: 2026-04-18 | ⏱️ **읽는 시간**: 약 5분

---

## 개요

**인공지능 기본법**은 한국 최초의 포괄적 AI 규제법으로, **2026년 상반기 시행 예정**입니다.

**입법 배경:**
- 과학기술정보통신부 주도
- 2025년 국회 통과 (예정)
- EU AI Act를 참고하되 한국 실정에 맞게 조정

---

## 핵심 조항

### 1. 고영향 AI 시스템 지정

**정의**: 사람의 생명·안전·권리에 중대한 영향을 미치는 AI

**예시:**
- 채용·승진 결정 지원 시스템
- 신용 평가·대출 심사
- 의료 진단 보조
- 범죄 예측·양형 지원

**의무사항:**
- 사전 영향 평가 실시
- 사용자에게 AI 사용 사실 고지
- 의사결정 과정 설명 의무

---

### 2. 생성형 AI 표시 의무

**대상**: 텍스트·이미지·동영상·코드 생성 AI

**의무 내용:**
- AI가 생성한 콘텐츠임을 **명확히 표시**
- 워터마크 또는 메타데이터 삽입 권장

**AIDLC 대응:**
```python
# AI-GENERATED: Claude 3.7 Sonnet (2026-04-18)
# PROMPT: "사용자 인증 API 엔드포인트 구현"
# REVIEW: @senior-developer (2026-04-18)

@app.post("/auth/login")
def login(credentials: LoginRequest):
    # 생성된 코드...
```

---

### 3. 영향 평가

**대상**: 고영향 AI 시스템 도입 전

**평가 항목:**
- 위험 요인 (편향, 프라이버시 침해)
- 완화 조치
- 대체 수단 검토
- 사후 모니터링 계획

**AIDLC 매핑**: Inception → Requirements Analysis (NFR 충족 여부)

```yaml
# .aidlc/compliance/korea-impact-assessment.yaml
impact_assessment:
  project: payment-service-v2
  assessment_date: 2026-04-18
  
  # 고영향 AI 판정
  high_impact: false
  rationale: "개발 도구로 사용, 최종 결정은 개발자"
  
  # 위험 요인
  risk_factors:
    - factor: "생성 코드 보안 취약점"
      severity: medium
      mitigation: "SAST 자동 스캔 + 독립 리뷰"
    
    - factor: "PII 노출"
      severity: high
      mitigation: "Guardrails 필터 + 로그 마스킹"
  
  # 사후 모니터링
  post_monitoring:
    frequency: daily
    metrics:
      - "보안 취약점 탐지율"
      - "코드 품질 메트릭"
```

---

### 4. 사후 관리

**의무 내용:**
- 배포 후 **지속적 모니터링**
- 오작동·편향 발견 시 **즉시 시정**
- 중대 사고 발생 시 **과기정통부에 보고**

**AIDLC 매핑**: Operations → Post-market monitoring

```yaml
# .aidlc/monitoring/korea-post-market.yaml
post_market_monitoring:
  responsible_party: "AI Governance Team"
  
  # 지속적 모니터링
  monitoring:
    frequency: daily
    metrics:
      - name: "error_rate"
        target: "< 1%"
      - name: "security_vulnerabilities"
        target: "0 critical"
  
  # 시정 조치
  corrective_action:
    sla: 7d  # 오작동 발견 시 7일 이내 시정
    escalation: "중대 사고 시 과기정통부 보고"
```

---

## 개인정보보호법(PIPA)과의 교차

**PIPA (Personal Information Protection Act)**와 AI 기본법은 **상호 보완**:

| 항목 | PIPA | AI 기본법 |
|------|------|-----------|
| **적용 대상** | 개인정보 처리 전반 | AI 시스템 특화 |
| **프로파일링** | 동의 필요 (Art. 15) | 고영향 AI 시 영향 평가 추가 |
| **자동화 결정** | 거부권 보장 (Art. 37-2) | 설명 의무 (AI 기본법) |
| **책임** | 정보 주체 권리 중심 | AI 시스템 안전성 중심 |

**AIDLC 대응**: 개인정보 처리 시 PIPA + AI 기본법 **동시 준수** 필요

```yaml
# .aidlc/compliance/korea-privacy.yaml
privacy_compliance:
  # PIPA 준수
  pipa:
    consent: "명시적 동의 획득"
    data_minimization: "최소한의 개인정보만 수집"
    purpose_limitation: "수집 목적 외 사용 금지"
    
  # AI 기본법 준수
  ai_law:
    transparency: "AI 사용 사실 고지"
    explainability: "의사결정 과정 설명"
    human_oversight: "중요 결정 인간 승인"
```

---

## ISMS-P와의 연계

**ISMS-P (정보보호 및 개인정보보호 관리체계)** 인증 보유 조직:
- AI 기본법 요구사항을 **ISMS-P 관리체계에 통합** 가능
- 인증 심사 시 AI 시스템 관리 항목 추가 예정 (2026년 이후)

**통합 운영:**
```yaml
# .aidlc/compliance/korea-isms-p-integration.yaml
isms_p_integration:
  # ISMS-P 기존 통제
  existing_controls:
    - "2.5.1 개인정보 수집·이용"
    - "2.6.2 개인정보 저장·보관"
    - "3.1.1 정보보호 정책"
    
  # AI 기본법 추가 통제
  ai_controls:
    - control: "고영향 AI 영향 평가"
      mapping: "ISMS-P 2.1.2 위험 관리"
    
    - control: "생성형 AI 표시 의무"
      mapping: "ISMS-P 2.5.6 정보 주체 권리"
    
    - control: "AI 시스템 사후 관리"
      mapping: "ISMS-P 3.2.1 모니터링"
```

---

## AIDLC 통합 체크리스트

### Inception 단계
- [ ] 고영향 AI 시스템 판정
- [ ] 영향 평가 실시 (위험 식별·완화 전략)
- [ ] PIPA 개인정보 영향 평가 (해당 시)

### Construction 단계
- [ ] AI 생성 코드에 투명성 표시 (`# AI-GENERATED: ...`)
- [ ] 독립 리뷰 프로세스 구현
- [ ] 보안 취약점 자동 스캔 (SAST)

### Operations 단계
- [ ] 지속적 모니터링 대시보드 운영
- [ ] 오작동 발견 시 7일 이내 시정
- [ ] 중대 사고 발생 시 과기정통부 보고

---

## 참고 자료

**공식 문서:**
- [과학기술정보통신부 AI 정책](https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112) (공식 발표 시 업데이트 필요)
- [개인정보보호법 (PIPA)](https://www.pipc.go.kr/np/default/page.do?mCode=D030010000)
- [ISMS-P 인증 기준](https://isms.kisa.or.kr/)

**관련 문서:**
- [규제 컴플라이언스 개요](../index.md)
- [거버넌스 프레임워크](../../governance-framework.md)
- [하네스 엔지니어링](../../../methodology/harness-engineering.md)
