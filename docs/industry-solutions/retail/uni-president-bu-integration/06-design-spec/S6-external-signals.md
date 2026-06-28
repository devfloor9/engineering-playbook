---
title: S6. 외부 시그널 융합 (Uni-President)
description: 소셜·기상·경제·경쟁사 4종 융합
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

# S6. 외부 시그널 융합 (Uni-President)

## 외부 4종

| 종류 | 출처 |
|---|---|
| 소셜 | Dcard · 小紅書 · 인스타 · X |
| 기상 | 中央氣象署 (콜드체인 핵심) |
| 경제 | DGBAS · 央行 |
| 경쟁사 | FamilyMart · Hi-Life · RT-Mart |

## 처리
- 일별 자사 GMV (BU별) × 외부 4종 조인
- 상관·시차 분석
- 시각화: 시계열 + 히트맵 + 경쟁사 annotation

## 데모 시나리오
1. 폭염 35℃+ → 7ELE 음료 +35% / 콜드체인 SLA -15%
2. "고급 도시락" 키워드 vs 7ELE 도시락 매출
3. FamilyMart 광棍節 캠페인 후 자사 7ELE GMV -3% (시차 7일)