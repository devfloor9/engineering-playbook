---
title: S9-M. Foreign Tourist Behavior Analysis + Duty-Free Recommendation (Mitsukoshi-specific)
description: Duty-free recommendation system for foreigners combining passport, nationality, FX, and tourism data
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
sidebar_label: S9-M. Foreigner Tax Refund
---

> **Mitsukoshi differentiation point** ⭐ — Analyze foreign tourists (especially Japanese) who account for a major share of department store revenue, using nationality, FX, and tourism data.

## 1. URL · Personas
- `/foreigner` · P2 (insights), P1 (marketing)

## 2. User Stories
> P2 — See average basket size, preferred categories, and repeat-visit rate of Japanese women in their 30s on a single screen.

> P1 — Automatically recommend which nationality of tourist to target based on FX fluctuations.

## 3. Data Mix
| Data | Source |
|---|---|
| Foreigner | Neptune (~500 real + synthetic) |
| TaxRefundTransaction | Neptune (~80K) |
| FX | EconomicSignal (JPY/USD/HKD/SGD ↔ TWD) |
| Tourism | TourismSignal (Taiwan Tourism Bureau) |
| Foreigner reviews | OpenSearch `idx_social_trend` (Japanese Twitter, Hong Kong Facebook) |

## 4. Processing Pipeline
```
1. Aggregate Foreigner × TaxRefundTransaction × Brand
2. Category preference by nationality (heatmap)
3. FX fluctuation vs revenue by nationality (correlation)
4. Tourism arrivals + first-party revenue lag analysis
5. Recommendation: countries with rising FX → increase campaign exposure
```

## 5. Output UI
- Left: nationality distribution donut (JP/HK/SG/MY/...)
- Center: nationality × category preference heatmap
- Right: FX-aware recommendation (JP weak yen → target Southeast Asian tourists)
- Bottom: TaxRefund utilization rate + duty-free SKU TOP 10

## 6. Guardrails
- Only passport hash exposed (real name and number kept private)
- Duty-free eligibility verification
- No discriminatory expressions by nationality

## 7. Demo Scenarios
1. **Japanese woman in her 30s** → avg basket size NTD 25K · prefers LV/Hermes · FX-sensitive
2. **Weak yen effect** → Japanese duty-free -25% (lag 7 days), Southeast Asia +15% auto-recommended
3. **Single-visit foreigner → VIP member conversion recommendation** (encourage membership signup on repeat visit)
