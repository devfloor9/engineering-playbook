---
title: S2. 5-Department Persona Chatbot (Mitsukoshi)
description: Autonomous tool invocation tailored to Marketing, Insights, Digital, VIP, and MD personas
created: "2026-05-14"
last_update:
  date: "2026-06-30"
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

## 1. URL · Personas
- `/chat` · All personas

## 2. 12 Tools

| Tool | Description |
|---|---|
| `semantic_search` | OpenSearch BM25 + KNN + Rerank (multilingual) |
| `neptune_query` | openCypher |
| `foreigner_analysis` | Behavior joined with nationality and FX (S9-M) |
| `brand_sov` | Tenant brand SOV and counter occupancy (S10-M) |
| `vip_concierge` | Black/Platinum/Gold recommendations (S11-M) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | Xiaohongshu, Dcard, Instagram, Japanese Twitter |
| `weather_join` | Central Weather Administration of Taiwan |
| `economic_join` | FX and CPI (multi-country) |
| `tourism_join` | Taiwan Tourism Bureau |
| `cluster_run` | KMeans + LLM labeling |
| `pii_mask` | PII |

## 3. Persona Variants

| P | Primary Tools |
|---|---|
| P1 | campaign_simulator · attribution_calc |
| P2 | cluster_run · social_trend_join · foreigner_analysis |
| P3 | behavior_change_detect · neptune_query |
| P4 | vip_concierge · semantic_search |
| P5 | brand_sov · store_metrics_push |

## 4. Demo Scenarios
1. (P1) "Anniversary Sale response rate by store and nationality" → tourism_join + campaign
2. (P1 → P5 switcher) Same prompt → counter merchandising perspective
3. (P2) "Japanese women in their 30s behavior" → foreigner_analysis
