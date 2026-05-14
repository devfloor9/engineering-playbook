---
title: "S6. 외부 시그널 융합 (Momo)"
sidebar_label: "S6. External Signals"
description: "소셜·기상·경제·경쟁사 4종 융합"
---

# S6. 외부 시그널 융합 (Momo)

## 1. 외부 4종

| 종류 | 출처 |
|---|---|
| 소셜 | Dcard · 小紅書 · 인스타 · X |
| 기상 | 中央氣象署 (배송 SLA 영향) |
| 경제 | DGBAS · 央行 |
| 경쟁사 | PChome · Yahoo奇摩 · Shopee TW 공개 |

## 2. 처리
- 일별 자사 GMV × 외부 4종 조인
- 상관·시차 분석
- 시각화: 시계열 + 히트맵 + 경쟁사 annotation

## 3. 데모 시나리오
1. 폭우 -50mm → 24시간 배송 SLA 위반 +60%, 일부 카테고리 GMV +20%
2. "여름텐트" 검색 +35% → 자사 GMV (시차 5일)
3. 경쟁사 광棍節 캠페인 후 자사 GMV 변화
