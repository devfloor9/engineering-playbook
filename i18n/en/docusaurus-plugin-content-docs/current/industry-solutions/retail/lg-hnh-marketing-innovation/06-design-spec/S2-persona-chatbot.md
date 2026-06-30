---
title: S2. 5-Department Persona Chatbot
description: Per-department autonomous tool-invoking chatbot — Bedrock Sonnet + AgentCore Memory + 12 tools
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 1. URL Path
- `/chat`
- Left: chat / Right: tool-invocation trace (SSE)

## 2. User Stories
> P5 (MD) — "Top 5 channels where Perioe sales dropped this month and the cause?" — answer automatically combines channel + external signals.

> P1 (Brand Marketer) — Same question, but answer focused on campaigns · segments · next actions.

## 3. Input UI
- Chat input + persona switcher
- 4 recommended queries (per persona)
- Analysis mode toggle (short/standard/deep)

## 4. Data Mix
Tools invoke autonomously — almost all data sources accessible (Snowflake · Neptune · OpenSearch · 4 external types).

## 5. Processing Pipeline
```
1. User input → Bedrock Guardrails (4 topics + consent + minor)
2. Bedrock Sonnet 4.6 (persona system prompt + tool definitions)
3. tool_use → FastAPI parallel tool invocations
4. Tool results → Sonnet re-invocation (multi-turn)
5. Final response → Guardrails (output)
6. SSE token streaming
7. Trace displayed on the right
```

## 6. 12 Tools Used

| Tool | Description |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank |
| `neptune_query` | Execute openCypher |
| `snowflake_query` | (Optional) Snowflake DW |
| `campaign_simulator` | Bayesian ROAS |
| `behavior_change_detect` | Statistical signatures |
| `weather_join` | KMA daily join |
| `social_trend_join` | Naver · Google · X · Instagram · Olive Young |
| `competitor_join` | Competitor new products · events |
| `cluster_run` | KMeans + LLM labeling |
| `sku_price_lookup` | Product price · inventory |
| `attribution_calc` | Attribution calculation |
| `channel_metrics_push` | Channel KPI cache |

## 7. Per-Department Variations
| Persona | system prompt keywords | Primary Tools |
|---|---|---|
| P1 Brand Marketer | Campaign · ROAS · Segment | campaign_simulator, attribution_calc |
| P2 Insights | Cohort · LTV · Trend · Persona | cluster_run, social_trend_join, competitor_join |
| P3 D&A | Accuracy · Drift · Signature | behavior_change_detect, neptune_query |
| P4 CRM · LG Members | Tier · NPS · Consent | semantic_search (member), weather_join |
| P5 MD · Channel Sales | GMV · Inventory · Turn · Channel | channel_metrics_push, sku_price_lookup |

## 8. Guardrails
- Input: 4 topics + marketing consent + minor cosmetics
- Output: Automatic PII masking, block recommendations to send to non-consenting members
- Tools: Write tools such as `channel_metrics_push` only for P3 · P5

## 9. Demo Scenarios
1. **(P5)** "Top 5 channels where Perioe sales dropped this month and the cause?" → automatically invokes channel_metrics_push, weather_join, social_trend_join
2. **(P5→P1 switch)** Same query — change in answer tone · KPI · next action (demo highlight)
3. **(P2)** "Recent Instagram trending keywords connected to first-party sales" → social_trend_join + neptune_query
