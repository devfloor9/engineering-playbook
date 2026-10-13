---
title: S6. External Signal Fusion (AMWAY)
description: Fusion of 4 sources — social, weather, FX (multi-country), regulatory
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

## 1. URL & Personas
- `/signals` · P2, P3

## 2. Four External Signals

| Type | Sources |
|---|---|
| Social | Global Instagram · Reddit · X · Korea Naver · China Weibo · Xiaohongshu |
| Weather | KMA + open-meteo (global) |
| Economic | Bank of Korea · Statistics Korea + Open Exchange Rates (multi-country FX) |
| **Regulatory** | FTC · Korea Door-to-Door Sales Act · MFDS · EU |

## 3. Processing Pipeline
1. Aggregate in-house GMV per day and country
2. Join time series of the 4 external signals
3. Correlation and lag analysis
4. Time series + correlation heatmap + regulatory annotations

## 4. Output UI
- Time series with dual axes (external + in-house)
- Category × signal × country correlation heatmap
- Lag analysis (lag 0–14 days)
- Annotations on regulatory effective dates

## 5. Guardrails
- Cite sources (public data only)
- Prohibit causal inference

## 6. Demo Scenarios
1. FX +5% vs. non-US in-house sales (14-day lag)
2. "Vegan beauty" global keyword vs. Artistry vegan revenue
3. Eight weeks of in-house direct sales after the FTC regulation took effect
