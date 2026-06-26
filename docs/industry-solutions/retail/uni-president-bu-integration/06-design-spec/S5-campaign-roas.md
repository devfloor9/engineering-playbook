---
title: S5. 옴니채널 캠페인 ROAS (Uni-President)
description: OPENPOINT 통합 캠페인 + BU 교차 유도 채널 믹스 Bayesian 어트리뷰션
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S5. Campaign ROAS
---

# S5. 옴니채널 캠페인 ROAS (Uni-President)

## 채널 후보
- OPENPOINT 앱 푸시 · 카톡/Line · 7ELE 매장 디스플레이 · 까르푸 전단 · Starbucks 카드 적립 ·  SNS 광고 · 라이브

## 데이터 믹스
| 데이터 | 출처 |
|---|---|
| 과거 캠페인 | CAMPAIGN_MART |
| BU 교차 사용 (BUTransfer) | Neptune |
| OPENPOINT 적립·사용 | OPENPOINTMembership |
| SNS 반응 | SocialSignal |

## 출력 UI
- 추천 채널 믹스 (donut)
- ROAS 분포 (violin)
- BU 교차 유도 효과 매트릭스

## 데모 시나리오
1. 예산 1억 / 7ELE→까르푸 교차 유도 캠페인 → 추천 믹스
2. SNS 비중 +20% → ROAS 변화
3. BU 교차 사용 +5pt 목표 시뮬