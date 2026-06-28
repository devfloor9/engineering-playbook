---
title: S4. 페르소나 매칭 + 클러스터링 (Momo)
description: 라이프스타일 페르소나 5종 + RFM × 라이브 시청 친화도
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

# S4. 라이프스타일 페르소나 매칭 + 클러스터링 (Momo)

## 1. 라이프스타일 5종

| 페르소나 | 시그널 |
|---|---|
| 라이브 즉흥 구매 | LiveStreamPurchase 비중 高 · 시청 시간 高 |
| 검색 익스플로러 | SearchEvent 다수 · 카트 abandon 高 |
| 24시간 배송 의존 | OrderTransaction 즉시 결제 · SLA 민감 |
| 가족 쇼핑객 | 다수 가구 SKU · 주말 |
| TV 홈쇼핑 충성 | TVPurchase 비중 高 · 50대+ |

## 2. 데이터 믹스
- RFM (Customer)
- 라이브 시청 친화도 (LiveStream × Viewer)
- 채널 비중 (앱/웹/TV/라이브)
- 소셜 페르소나 (Dcard·인스타 키워드)

## 3. 출력 UI
- 페르소나 카드 5종 분포
- KMeans 6 클러스터 (LLM 라벨)
- PCA 산점도

## 4. 데모 시나리오
1. 단건 매칭 → "라이브 즉흥 구매 0.58"
2. 5K 일괄 → 6 클러스터
3. 클러스터 → 라이브 캠페인 (S5)