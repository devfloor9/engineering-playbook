---
title: S2. 5 부서 페르소나 챗봇 (Momo)
description: 마케팅·카테고리·검색추천·CS·물류 5 부서별 도구 자율 호출
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 1. URL · 페르소나
- `/chat`

## 2. 도구 12종

| 도구 | 설명 |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank |
| `neptune_query` | openCypher |
| `live_attribution` | 라이브 시청→구매 funnel (S9-Mo) |
| `delivery_sla_query` | TimeStream 배송 SLA (S10-Mo) |
| `recommendation_diversity` | 추천 다양성 점수 (S11-Mo) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | Dcard·小紅書·인스타 |
| `weather_join` | 中央氣象署 |
| `economic_join` | DGBAS |
| `competitor_join` | PChome·Yahoo·Shopee |
| `cluster_run` | KMeans + LLM 라벨 |
| `pii_mask` | PII |

## 3. 페르소나별 변형
| P | 주 도구 |
|---|---|
| P1 | live_attribution · campaign_simulator |
| P2 | cluster_run · social_trend_join |
| P3 | recommendation_diversity · neptune_query |
| P4 | semantic_search · behavior_change_detect |
| P5 | delivery_sla_query · weather_join |

## 4. 데모 시나리오
1. (P1) "어제 라이브 GMV TOP 3" → live_attribution
2. (P5) "북부 fulfillment center SLA 위반률" → delivery_sla_query + weather_join
3. (P1↔P5 스위처) 동일 질의 톤 변화