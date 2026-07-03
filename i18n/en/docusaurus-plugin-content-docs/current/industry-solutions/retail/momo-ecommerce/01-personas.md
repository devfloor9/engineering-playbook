---
title: 5-Department Personas (Momo)
description: 5 departments — Marketing · Category · Search/Recommendation · CS · Logistics
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

| Code | Department | Mission | KPI | Primary Scenarios |
|---|---|---|---|---|
| **P1** | Marketing (App · Campaign) | App traffic · Campaign ROAS · Live inflow | App ROAS / Live concurrent viewers · Conversion | S1·S2·S5·**S9-Mo** |
| **P2** | Category · Trend | New-product trend · Category revenue | New-product SOV / Category LTV | S2·S4·S6 |
| **P3** | Search · Recommendation · MarTech | Recommendation accuracy · Diversity · Search latency | Model accuracy / Diversity / Latency | S2·S3·**S11-Mo** |
| **P4** | Customer Service · CRM | Refunds · Delivery complaints · NPS | NPS / Refund rate / Delivery satisfaction | S2·S7·S8 |
| **P5** | Logistics · MD | Delivery SLA · Ordering · Inventory | Delivery SLA / Fulfillment load | S2·**S10-Mo** |

## Persona Tone · Tools
- P1: "Conversion rate against 50K live concurrent viewers" → live_attribution · campaign_simulator
- P2: "New-product #summernew SOV vs ours" → social_trend_join · cluster_run
- P3: "Categories where recommendation diversity has dropped" → recommendation_diversity · neptune_query
- P4: "Top 100 SKUs with a refund-rate spike" → behavior_change_detect · semantic_search
- P5: "Northern fulfillment center 24-hour-promise SLA" → delivery_sla · weather_join
