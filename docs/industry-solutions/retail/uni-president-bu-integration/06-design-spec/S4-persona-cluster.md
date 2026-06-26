---
title: S4. 페르소나 매칭 + 클러스터링 (Uni-President)
description: 라이프스타일 페르소나 5종 + RFM × BU 친화도 + 소셜
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S4. Persona & Cluster
---

# S4. 라이프스타일 페르소나 매칭 + 클러스터링 (Uni-President)

## 라이프스타일 5종

| 페르소나 | 시그널 |
|---|---|
| 편의점 일상러 | 7ELE 매일 + 음료·도시락 |
| 마트 가족 쇼핑 | 까르푸 주말 + 식품·생활용품 |
| 카페 모닝 | Starbucks 평일 아침 |
| BU 다채널 | 7ELE+까르푸+Starbucks 모두 활용 |
| 시즌 트렌드세터 | 신상 즉시 구매 + SNS |

## 데이터 믹스
- RFM
- BU 친화도 (CVS/Hyper/Cafe 비중)
- BUTransfer 빈도
- 소셜 페르소나 (Dcard·小紅書 키워드)

## 출력 UI
- 페르소나 카드 5종
- KMeans 6 클러스터 (LLM 라벨)
- PCA 산점도

## 데모 시나리오
1. 단건 매칭 → "BU 다채널 0.65"
2. 5K 일괄 → 6 클러스터 ("아침 Starbucks + 점심 7ELE 직장인" 등)
3. 클러스터 → BU 교차 캠페인 (S5)