---
title: S6. External Signal Fusion (Mitsukoshi)
description: Fusion of 4 external signals — social, weather, FX (JPY/USD/HKD), and tourism
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

## 1. URL · Personas
- `/signals` · P2, P3

## 2. 4 External Signals (Mitsukoshi-specific)

| Type | Source |
|---|---|
| Social | Xiaohongshu · Dcard · Instagram · Japanese Twitter · Hong Kong Facebook |
| Weather | Central Weather Administration of Taiwan (中央氣象署) |
| **FX** (multi-country) | JPY/USD/HKD/SGD ↔ TWD daily |
| **Tourism** | Taiwan Tourism Bureau foreign arrivals (by nationality) |

## 3. Processing Pipeline
1. Aggregate first-party GMV by day (store, BU)
2. Join with 4 external types
3. Correlation and lag analysis
4. Visualization: time series + heatmap + tourism annotation

## 4. Output UI
- Dual-axis time series (external + first-party)
- Category × external correlation heatmap
- Lag analysis (lag 0–14 days)
- FX fluctuation annotation

## 5. Demo Scenarios
1. Weak yen -10% → Japanese duty-free -25% (lag 7 days)
2. "Lifestyle" keyword vs first-party SKU
3. Taiwan foreign arrivals +20% → Mitsukoshi foreigner revenue +15%
