---
title: S3. 카테고리·BU 인사이트 카드 (Momo)
description: 방대 SKU 카테고리 + 라이브 + 배송 + 외부 결합 자동 보고서
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S3. Insight Cards
---

## 1. URL · 페르소나
- `/insights` · P3

## 2. 카드 프리셋

| 카드 | 데이터 |
|---|---|
| 카테고리 GMV TOP 30 (월별) | OrderTransaction × Category |
| **라이브 방송 GMV** vs 일반 GMV | LiveStreamPurchase vs OrderTransaction |
| **배송 SLA 추이** (24시간 약속) | DeliverySLA × 권역 |
| **롱테일 SKU 노출 비율** | LongTailSKU × 추천 노출 |
| 검색 트렌드 vs 자사 | SocialSignal + GMV |
| 폭우 영향 (배송) | WeatherSignal × DeliverySLA |

## 3. 페르소나별 코멘트

| P | 동일 카드 (라이브 GMV) |
|---|---|
| P1 | "어제 19시 라이브 GMV 1.2억 — 신상 캠페인 효과" |
| P2 | "소셜 #여름텐트 +35% — 라이브 효과 추정" |
| P3 | "라이브 핀 SKU 다양성 0.42 (낮음) — 추천 보강 필요" |
| P4 | "라이브 후 환불률 8% — 평균 5% 대비 +3pt 위험" |
| P5 | "라이브 다발 시간대 fulfillment 부하 +60%" |

## 4. 데모 시나리오
1. "어제 라이브 GMV" → 5 페르소나 코멘트
2. "폭우 영향" → 배송 -15% 시각화
3. "롱테일 노출" → 다양성 0.4 미달 카테고리 표시