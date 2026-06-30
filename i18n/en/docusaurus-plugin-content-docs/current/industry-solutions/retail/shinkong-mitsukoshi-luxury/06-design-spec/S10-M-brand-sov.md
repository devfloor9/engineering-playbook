---
title: S10-M. Luxury Brand SOV + Counter Occupancy (Mitsukoshi-specific)
description: Counter occupancy analysis across 700+ tenant brands × 19 stores × seasons
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S10-M. Brand SOV
---

> **Mitsukoshi differentiation point** ⭐ — Analyze counter occupancy and SOV (Share of Voice) of 700+ tenant brands by 19 stores, floors, and seasons.

## 1. URL · Personas
- `/brand-sov` · P5 (MD & Store Operations)

## 2. User Stories
> P5 — Compare counter GMV and turnover for LV vs Hermes on the 1F of Xinyi store + analyze 4-week impact after SS-season new releases hit the display.

## 3. Data Mix
| Data | Source |
|---|---|
| Boutique × Brand × Store | Neptune (~3K Boutique) |
| POSTransaction | Neptune (~200K) |
| Counter area / lease | Boutique attributes |
| Season (Anniversary Sale / SS / FW) | Campaign nodes |
| Competitor SOV | CompetitorSignal (social + mention frequency) |

## 4. Processing Pipeline
```
1. Aggregate GMV / turnover by (store, floor, brand)
2. Compute GMV efficiency per counter area
3. Compare seasons (4-week impact after SS new releases)
4. Join with competitor SOV (Xiaohongshu and Instagram mentions)
5. Counter re-layout recommendation (Sonnet 4.6)
```

## 5. Output UI
- Left: 19 stores × floor matrix (heatmap)
- Center: brand SOV bar chart (first-party vs competitors)
- Right: counter efficiency scatter plot (area vs GMV)
- Bottom: recommended counter re-layout card (Sonnet)

## 6. Guardrails
- Protect tenant brand business information (no external exposure)
- Counter lease prices kept private

## 7. Demo Scenarios
1. **Xinyi store 1F LV vs Hermes** → GMV comparison + turnover
2. **4 weeks after SS new release** → first-party LV +12%, competitor SOV +18%
3. **Counter re-layout recommendation** → "Moving B1 food → 1F new-release cabinet expected to lift +8%"
