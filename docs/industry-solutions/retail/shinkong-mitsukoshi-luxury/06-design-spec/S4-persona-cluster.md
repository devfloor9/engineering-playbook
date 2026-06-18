---
created: 2026-05-14
title: "S4. 페르소나 매칭 + 클러스터링 (Mitsukoshi)"
sidebar_label: "S4. Persona & Cluster"
description: "라이프스타일 페르소나 5종 + RFM × 럭셔리 친화도 + 소셜 페르소나"
last_update:
  date: 2026-05-14
reading_time: 1
---
# S4. 라이프스타일 페르소나 매칭 + 클러스터링

## 1. URL · 페르소나
- `/personas` · P2

## 2. 라이프스타일 5종

| 페르소나 | 시그널 |
|---|---|
| 럭셔리 콜렉터 | LV·Hermes·Chanel 정기 구매 · Black 등급 |
| 시즌 트렌드세터 | SS/FW 신상 즉시 구매 · 인스타 |
| 외국인 관광객 | TaxRefund · 환율 민감 · 단발 구매 |
| 가족 쇼핑객 | 식품·주말 · 평균 객단가 |
| 액세서리 입문자 | 저가 SKU · 첫 구매 |

## 3. 데이터 믹스
- RFM (Customer + Foreigner)
- 럭셔리 친화도 (LV/Hermes/Chanel 구매 비중)
- 소홍서·Dcard 키워드 (소셜 페르소나)

## 4. 출력 UI
- 페르소나 카드 5종 분포
- KMeans 6 클러스터 (LLM 라벨)
- PCA 산점도

## 5. 데모 시나리오
1. 단건 매칭 → "럭셔리 콜렉터 0.62 / 시즌 트렌드세터 0.18"
2. 2,500명 일괄 → 6 클러스터
3. 클러스터 → 캠페인 시뮬 (S5)