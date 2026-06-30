---
title: S2. 5 부서 페르소나 챗봇 (Mitsukoshi)
description: 마케팅·인사이트·디지털·VIP·MD 5 부서별 도구 자율 호출
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
sidebar_label: S2. Persona Chatbot
---

## 1. URL · 페르소나
- `/chat` · 모든 페르소나

## 2. 도구 12종

| 도구 | 설명 |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank (다국어) |
| `neptune_query` | openCypher |
| `foreigner_analysis` | 국적·환율 결합 행동 (S9-M) |
| `brand_sov` | 입점 브랜드 SOV 매대 점유 (S10-M) |
| `vip_concierge` | Black/Platinum/Gold 추천 (S11-M) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | 소홍서·Dcard·인스타·일본 트위터 |
| `weather_join` | 中央氣象署 |
| `economic_join` | 환율·물가 (다국가) |
| `tourism_join` | 대만 관광청 |
| `cluster_run` | KMeans + LLM 라벨 |
| `pii_mask` | PII |

## 3. 페르소나별 변형

| P | 주 도구 |
|---|---|
| P1 | campaign_simulator · attribution_calc |
| P2 | cluster_run · social_trend_join · foreigner_analysis |
| P3 | behavior_change_detect · neptune_query |
| P4 | vip_concierge · semantic_search |
| P5 | brand_sov · store_metrics_push |

## 4. 데모 시나리오
1. (P1) "週年慶 응답률 점포·국적별" → tourism_join + campaign
2. (P1→P5 스위처) 동일 → 매대 진열 관점
3. (P2) "30대 일본인 여성 행동" → foreigner_analysis