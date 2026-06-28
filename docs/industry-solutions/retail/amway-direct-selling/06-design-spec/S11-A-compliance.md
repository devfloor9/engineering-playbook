---
title: S11-A. 직접판매·미성년·건강기능식품 컴플라이언스 (AMWAY 특화)
description: FTC·방판법·식약처·EU 직접판매 규제 자동 검수 + 다국가 광고 가드
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-A. Regulatory
---

# S11-A. 방판법·미성년·건강기능식품 광고 컴플라이언스

> **AMWAY 차별 포인트** ⭐ — 글로벌 직접판매 사업의 가장 큰 리스크는 규제. 다국가 규제 시그널 + 광고 텍스트 자동 검수 + 미성년 가드.

## 1. URL · 페르소나
- `/regulatory` · P5 (Compliance & Regulatory)

## 2. 사용자 스토리
> P5 — Nutrilite 신상 광고 텍스트 1건을 입력하면 FTC·식약처·방판법 기준으로 자동 검수 + 위험 표현 강조 + 권장 수정안.

> P5 — 미성년 ABO 가입 시도 24시간 카운트와 차단된 사유 분포.

## 3. 입력 UI
- 광고 텍스트 입력 (다국어)
- 대상 국가 (US/KR/JP/CN/EU 등)
- 채널 (자사몰/카탈로그/SNS/이메일)
- 페르소나 = P5 고정

## 4. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Bedrock Guardrails | AWS |
| RegulatorySignal | Neptune (FTC·방판법·식약처·EU 룰셋) |
| Compliance 정책 | Compliance 노드 (회원 동의·등급 검증) |
| 미성년 추정 | Customer.age_band = under_18 |
| AuditLog | DynamoDB |

## 5. 검수 체크리스트

| 카테고리 | 검수 항목 |
|---|---|
| **FTC (US)** | 등급 보장 표현 / 수익 보장 / 과장 표현 |
| **방판법 (KR)** | 청약철회 표시 / 등급 검증 / 다단계 표현 |
| **식약처 (KR)** | 효능·치료 표현 / 의약품 오인 |
| **FDA (US)** | Health Claim 사전 승인 |
| **EU Direct Selling Code** | 환불 14일 / 미성년 |
| **공통** | PII 노출 / 미성년 타겟팅 |

## 6. 처리 파이프라인
```
1. 입력 텍스트 → Bedrock Guardrails (4 토픽)
2. 국가별 RegulatorySignal 룰 매칭 (Neptune)
3. 위험 표현 식별 + 위험도 점수
4. Sonnet 4.6 → 권장 수정안 생성 (다국어)
5. 결과: 원문 + 수정안 + 위반 룰 ID + 출처
6. AuditLog 기록
```

## 7. 출력 UI
- 좌: 입력 텍스트 (위험 부분 하이라이트)
- 중앙: 위반 룰 카드 (룰 ID, 출처 링크, 위험도)
- 우: 권장 수정안 (다국어 동시)
- 하단: 24시간 차단 카운트 + 사유 분포

## 8. 가드레일
- 자동 발송 X (반드시 P5 검토)
- 모든 검수 이력 → AuditLog
- 규제 텍스트 출처 인용 의무 (FTC 16 CFR Part 437 등)

## 9. 데모 시나리오
1. "Nutrilite로 면역력 강화 — 의사들이 추천!" → 식약처·FDA 위반 강조
2. "Diamond 등급으로 월 1만 달러 보장" → FTC 등급 보장 위반
3. 미성년 ABO 가입 시도 24시간 차단 카운트 → 차트
4. 다국가 동시 검수 (한국 + 미국 + 일본) → 국가별 위험도 비교