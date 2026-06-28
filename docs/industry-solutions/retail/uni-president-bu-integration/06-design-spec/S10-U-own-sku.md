---
title: S10-U. 자사 제조 SKU vs 자사 채널 sell-through (UPI 특화)
description: 統一食品 자사 SKU(統一麵·麥香 등)의 7ELE/까르푸 회전 vs 외부 채널 비교
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S10-U. Own SKU
---

# S10-U. 자사 제조 SKU vs 자사 채널 sell-through

> **Uni-President 차별 포인트** ⭐ — 제조-유통 수직 통합의 핵심: 자사 統一食品 SKU가 자사 채널(7ELE·까르푸)에서 외부 채널 대비 어떻게 회전하는지 분석.

## 1. URL · 페르소나
- `/own-sku` · P5 (제조·물류·점포)

## 2. 사용자 스토리
> P5 — 統一 麥香 우롱차의 7ELE vs 까르푸 vs 외부 (FamilyMart·Hi-Life) sell-through를 비교 + 신상 出荷 우선순위 결정.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| OwnSKU (자사 제조) | Neptune (~5K SKU) |
| CVSTransaction (7ELE) | Neptune |
| HypermarketTransaction (까르푸) | Neptune |
| 외부 sell-through (추정) | CompetitorSignal (공개 매출 지수) |
| 콜드체인 출하 로그 | ColdChainSLA |

## 4. 처리 파이프라인
```
1. OwnSKU 노드 → 제조 BU 매핑
2. (자사 채널 7ELE/까르푸) 회전 집계
3. 외부 채널 추정 회전 (CompetitorSignal + 공개 시장 점유)
4. 자사 vs 외부 비율 계산
5. 추천: 자사 우선 출하 (재고 보호) vs 외부 확대
```

## 5. 출력 UI
- 좌: 자사 SKU TOP 30 회전 막대 (자사 vs 외부)
- 중앙: SKU별 자사 채널 의존도 (donut)
- 우: 신상 출하 우선순위 추천 (Sonnet)
- 하단: 시즌별 회전 추이

## 6. 가드레일
- 자사 SKU 단가·이익률 외부 노출 차단
- 외부 추정 데이터에 신뢰 표기

## 7. 데모 시나리오
1. **麥香 우롱차** → 자사 회전 65% / 외부 35%
2. **신상 SKU 출하 추천** → 7ELE 우선 (자사 채널 의존도 높음)
3. **카테고리별 자사 의존도** → 음료 70% / 라면 55% / 유제품 80%