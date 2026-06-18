---
created: 2026-05-14
title: "S3. 카테고리·BU 인사이트 카드 (AMWAY)"
sidebar_label: "S3. Insight Cards"
description: "Nutrition/Beauty/Home BU 매출 + 외부 4종 결합 자동 보고서 카드"
last_update:
  date: 2026-05-14
reading_time: 2
---
# S3. 카테고리·BU 인사이트 카드 (AMWAY)

## 1. URL · 페르소나
- `/insights` · P3 (D&A)

## 2. 카드 프리셋

| 카드 | 데이터 |
|---|---|
| 월별 BU GMV (Nutrition/Beauty/Home) | OrderTransaction × Category × Month |
| 국가별 ABO Direct Sale | ABODirectSale × Country |
| 정기구독 가입·해지 추이 | Subscription·Event |
| 비건 트렌드 vs Nutrilite 매출 | SocialSignal + GMV |
| 환율 vs 자사 글로벌 매출 | EconomicSignal × Country GMV |
| 규제 발효 후 영향 | RegulatorySignal annotation |

## 3. 페르소나별 코멘트 차이

| P | 동일 카드 (월별 BU GMV) 코멘트 |
|---|---|
| P1 | "Beauty BU +12%, Sponsor 캠페인 효과 추정" |
| P2 | "1인가구 페르소나가 Beauty 비중 25%로 상승" |
| P3 | "11월 +1.5σ — 환율 변수 결합 분석 필요" |
| P4 | "VIP ABO 적립률 +3pt — 등급 캠페인 효과" |
| P5 | "광고 표현 위반 0건, 규제 안전" |

## 4. 가드레일
- 외부 출처 표기
- 인과 추정 금지
- LLM 코멘트 다국어 정확도 모니터

## 5. 데모 시나리오
1. "월별 BU GMV" → 5 페르소나 코멘트
2. "비건 트렌드 vs Nutrilite" → 상관 R² 0.71
3. "이 카드를 챗봇으로" → S2 자연 전환