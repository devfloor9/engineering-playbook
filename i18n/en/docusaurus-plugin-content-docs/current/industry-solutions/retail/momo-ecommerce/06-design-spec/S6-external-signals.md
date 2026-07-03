---
title: S6. External Signal Fusion (Momo)
description: 4-source fusion — Social · Weather · Economy · Competitor
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

## 1. 4 External Sources

| Type | Source |
|---|---|
| Social | Dcard · Xiaohongshu · Instagram · X |
| Weather | Central Weather Administration (delivery SLA impact) |
| Economy | DGBAS · Central Bank |
| Competitors | PChome · Yahoo奇摩 · Shopee TW public |

## 2. Processing
- Daily in-house GMV × 4 external sources join
- Correlation · Lag analysis
- Visualization: time series + heatmap + competitor annotation

## 3. Demo Scenarios
1. Heavy rain -50mm → 24-hour delivery SLA breach +60%, some categories GMV +20%
2. "Summer tent" search +35% → in-house GMV (5-day lag)
3. Competitor Double 11 campaign → in-house GMV change
