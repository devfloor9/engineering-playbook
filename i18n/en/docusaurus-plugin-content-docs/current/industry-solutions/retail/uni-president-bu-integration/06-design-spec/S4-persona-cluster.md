---
title: S4. Persona Matching + Clustering (Uni-President)
description: 5 lifestyle personas + RFM × BU affinity + social
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

## 5 Lifestyle Personas

| Persona | Signal |
|---|---|
| Daily CVS Shopper | Daily 7ELE + beverages · bento |
| Weekend Family Hyper Shopper | Weekend Carrefour + groceries · household goods |
| Café Morning | Weekday-morning Starbucks |
| Multi-BU Omnishopper | Active across 7ELE + Carrefour + Starbucks |
| Seasonal Trendsetter | Buys new SKUs immediately + active on social |

## Data Mix
- RFM
- BU affinity (CVS / Hyper / Cafe share)
- BUTransfer frequency
- Social personas (Dcard · Xiaohongshu (小紅書) keywords)

## Output UI
- 5 persona cards
- KMeans 6 clusters (LLM-labeled)
- PCA scatter plot

## Demo Scenarios
1. Single-record match → "Multi-BU Omnishopper 0.65"
2. Bulk 5K → 6 clusters ("Morning Starbucks + Lunch 7ELE office worker", etc.)
3. Cluster → cross-BU campaign (S5)