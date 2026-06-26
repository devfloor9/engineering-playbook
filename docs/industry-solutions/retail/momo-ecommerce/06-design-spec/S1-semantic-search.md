---
title: S1. 자연어 시맨틱 검색 (Momo)
description: 방대 SKU + 회원 + 라이브 후기 + Dcard·小紅書 통합 검색
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S1. Semantic Search
---

# S1. 자연어 시맨틱 검색 (Momo)

## 1. URL · 페르소나
- `/semantic-search` · P1 (마케팅), P3 (검색·추천)

## 2. 데이터 믹스
- 자사 방대 SKU + 회원 프로필 + 자사 리뷰 + 라이브 방송 후기 + Dcard·小紅書·인스타

## 3. 입력 예시
- "여름 캠핑용 가성비 텐트 + 24시간 배송 + Dcard 별점 4.5↑"

## 4. 출력 UI
- 결과 3컬럼: SKU + 회원 + 외부 후기
- 1-hop KG (cytoscape)
- **롱테일 SKU 표시** (longtail_score 배지)

## 5. 데모 시나리오
1. "여름 캠핑 텐트" → 추천 SKU + 24시간 배송 가능 표시
2. "라이브 방송에서 인기 화장품" → LiveStreamPurchase 결합
3. "롱테일 SKU 노출 + 신상" → S11-Mo 연계