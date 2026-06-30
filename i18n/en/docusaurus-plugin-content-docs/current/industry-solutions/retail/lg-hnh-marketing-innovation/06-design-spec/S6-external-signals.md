---
title: S6. External Signal Fusion (4 Types)
description: First-party GMV × 4 external types (social · weather · economy · competitor) macro analysis
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

> Use all 4 external data types — one of the core values of the marketing innovation PoC.

## 1. URL Path
- `/signals`

## 2. User Stories
> P2 (Insights) — Wants to see, on one screen, the correlation between the external environment (trends · weather · FX · competitors) and first-party category sales.

> P3 (D&A) — Statistical validation of category × external variable correlation coefficients.

## 3. Input UI
- 4 external signal toggles: social · weather · economy · competitor
- First-party data: BU/Category/Segment/Channel
- Period slider

## 4. Data Mix
| External Signal | First-Party Mapping | Use |
|---|---|---|
| **Social trends** (Naver · Google · X · Instagram · Olive Young) | Category · keyword mapping | Time series + SOV |
| **Weather** (KMA · Air quality) | Region · date key | Scatter + correlation |
| **Economy** (FX · CPI · Employment) | Month · first-party GMV | Time series + lag |
| **Competitor** (Amorepacific · Aimo · Yuhan-Kimberly) | Category mapping + event dates | annotation + comparison |

## 5. Processing Pipeline
```
1. Daily (region, category) first-party GMV aggregation
2. Load 4-type external signal time series
3. Join by date/region/category key
4. Correlation · lag analysis (cross-correlation)
5. Visualization: time series + scatter + correlation heatmap + competitor annotation
6. LLM comments (per persona)
```

## 6. Output UI
- Dual-axis time series (external + first-party)
- Category × external signal correlation heatmap
- Lag analysis line (lag 0~14 days)
- Competitor event annotation (launch · campaign · controversy)

## 7. Guardrails
- Mandatory source attribution (social · weather · economy · competitor — all)
- No causal inference (express "correlation" only)
- Competitor information only from public sources

## 8. Demo Scenarios
1. Temperature -5°C vs. hot pack · hand cream → R² 0.78
2. Instagram "vegan beauty" keyword vs. first-party vegan SKU sales
3. FX vs. imported category GMV (7-day lag)
4. Change in first-party category sales 4 weeks after competitor new product launch
