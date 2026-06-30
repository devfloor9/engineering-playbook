---
title: S1. 자연어 시맨틱 검색 (Uni-President)
description: 5 BU SKU + OPENPOINT 회원 + 외부 후기 통합 검색
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
sidebar_label: S1. Semantic Search
---

## 1. URL · 페르소나
- `/semantic-search` · P1, P5

## 2. 데이터 믹스
- 5 BU 자사 SKU + OPENPOINT 회원 + 자사 리뷰 + Dcard·小紅書 후기

## 3. 입력 예시
- "여름 우롱차 PB SKU + 7ELE 매장 + Dcard 별점 4+"

## 4. 출력 UI
- 결과 3컬럼: SKU + 회원 + 외부 후기
- BU 색상 코딩 (7ELE/까르푸/Starbucks/Donut/KFC/統一食품)
- 1-hop KG (cytoscape)

## 5. 데모 시나리오
1. "麥香 음료 7ELE 매장 인기 SKU" → SKU + sell-through (S10-U 연계)
2. "OPENPOINT 골드 회원 + 까르푸 식품 충성층" → 회원 + 카테고리 매트릭스
3. "Starbucks 인기 시즌 메뉴" → SKU + 외부 후기