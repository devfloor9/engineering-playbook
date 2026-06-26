---
title: S6. 외부 시그널 융합 (Mitsukoshi)
description: 소셜·기상·환율(JPY/USD/HKD)·관광 4종 융합
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S6. External Signals
---

# S6. 외부 시그널 융합 (Mitsukoshi)

## 1. URL · 페르소나
- `/signals` · P2, P3

## 2. 외부 시그널 4종 (Mitsukoshi 특화)

| 종류 | 출처 |
|---|---|
| 소셜 | 소홍서·Dcard·인스타·일본 트위터·홍콩 페북 |
| 기상 | 中央氣象署 (대만) |
| **환율** (다국가) | JPY/USD/HKD/SGD ↔ TWD 일별 |
| **관광** | 대만 관광청 입국 외국인 (국적별) |

## 3. 처리 파이프라인
1. 일별 자사 GMV (점포·BU) 집계
2. 외부 4종 조인
3. 상관·시차 분석
4. 시각화: 시계열 + 히트맵 + 관광 annotation

## 4. 출력 UI
- 시계열 듀얼 축 (외부 + 자사)
- 카테고리×외부 상관 히트맵
- 시차 분석 (lag 0~14일)
- 환율 변동 annotation

## 5. 데모 시나리오
1. 엔저 -10% → 일본인 면세 -25% (시차 7일)
2. "라이프스타일" 키워드 vs 자사 SKU
3. 대만 입국 외국인 +20% → Mitsukoshi 외국인 매출 +15%