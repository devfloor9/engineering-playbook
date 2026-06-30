---
title: S1. 자연어 시맨틱 검색 (Mitsukoshi)
description: 입점 브랜드 SKU + VIP·Foreigner + 외부 후기 (소홍서·Dcard·인스타) 통합 검색
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S1. Semantic Search
---

## 1. URL · 페르소나
- `/semantic-search` · P1, P5

## 2. 사용자 스토리
- P1: "30대 여성 + LV·Chanel + 週年慶 50% 할인" → SKU + VIP 회원 추천
- P5: "信義점 1F LV 인기 SKU + 일본인 후기" → 매대 진열 인사이트

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| 입점 SKU | OpenSearch `idx_product` (Smartcn) |
| 회원 + Foreigner | OpenSearch `idx_customer` |
| 자사 리뷰 | OpenSearch `idx_review` |
| 외부 후기 (소홍서·Dcard·인스타·일본 트위터) | OpenSearch `idx_social_trend` (다국어) |
| KG 1-hop | Neptune (Customer × Boutique × Brand × Store) |

## 4. UI
- 다국어 자연어 입력 (번체중·영·일)
- 필터: 점포 / 층 / 브랜드 / 가격
- 결과 3컬럼: SKU / 회원 / 외부 후기

## 5. 가드레일
- PII 마스킹
- 면세 자격 검증 (Foreigner만)

## 6. 데모 시나리오
1. "30대 여성 + LV 신상 + 일본인 인기" → SKU + 일본 후기
2. "Black 등급 회원이 자주 사는 Hermes SKU" → 회원 매트릭스
3. "週年慶 + 50% 할인 가능한 럭셔리 SKU" → 캠페인 연계