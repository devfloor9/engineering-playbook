---
title: S2. 5-Department Persona Chatbot (Momo)
description: Autonomous tool invocation tailored to each of 5 departments — Marketing · Category · Search-Recommendation · CS · Logistics
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

## 1. URL · Persona
- `/chat`

## 2. 12 Tools

| Tool | Description |
|---|---|
| `semantic_search` | OpenSearch BM25 + KNN + Rerank |
| `neptune_query` | openCypher |
| `live_attribution` | Live viewer → purchase funnel (S9-Mo) |
| `delivery_sla_query` | TimeStream delivery SLA (S10-Mo) |
| `recommendation_diversity` | Recommendation diversity score (S11-Mo) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | Dcard · Xiaohongshu · Instagram |
| `weather_join` | Central Weather Administration |
| `economic_join` | DGBAS |
| `competitor_join` | PChome · Yahoo · Shopee |
| `cluster_run` | KMeans + LLM labels |
| `pii_mask` | PII |

## 3. Per-Persona Variants
| P | Primary Tools |
|---|---|
| P1 | live_attribution · campaign_simulator |
| P2 | cluster_run · social_trend_join |
| P3 | recommendation_diversity · neptune_query |
| P4 | semantic_search · behavior_change_detect |
| P5 | delivery_sla_query · weather_join |

## 4. Demo Scenarios
1. (P1) "Yesterday's Top 3 live GMV" → live_attribution
2. (P5) "Northern fulfillment-center SLA breach rate" → delivery_sla_query + weather_join
3. (P1 ↔ P5 switcher) Same query, different tone
