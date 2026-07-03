---
title: S11-U. Cold-Chain · Logistics SLA + Store Ordering (UPI-Specific)
description: President Transnet cold-chain SLA + outdoor temperature + store-order optimization
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-U. Cold Chain
---

> **Uni-President differentiator** ⭐ — the in-house logistics arm (President Transnet) runs the cold chain that directly determines quality for core SKUs (dairy, ice cream, bento). Combines outdoor temperature + store-order optimization.

## 1. URL · Persona
- `/cold-chain` · P5 (Manufacturing · Logistics · Stores)

## 2. User Story
> P5 — At southern heatwaves of 35℃+, derive the dairy cold-chain SLA breach rate + store-order correction recommendations.

## 3. Data Mix
| Data | Source |
|---|---|
| ColdChainSLA logs | TimeStream (~50K) |
| OwnSKU (cold-chain scope) | Neptune |
| Store (7ELE / Carrefour stores) | Neptune |
| Outdoor temperature | WeatherSignal |
| Store inventory | Inventory |

## 4. Processing Pipeline
```
1. Aggregate daily cold-chain SLA per (origin BU, destination store)
2. Join outdoor temperature (Central Weather Administration, 中央氣象署)
3. Count breaches (actual exceeds target_temp + 2.0℃)
4. Compute store-inventory remainder + breach impact
5. Simulate next-day ordering correction (Sonnet)
```

## 5. Output UI
- Left: SLA breach-rate time series per region (north / central / south)
- Center: Outdoor temperature vs breach-rate scatter plot
- Right: Per-store SLA-impact heatmap
- Bottom: Next-day ordering-correction simulation (inventory · forecast orders · cold-chain recovery)

## 6. Guardrails
- Block external exposure of store unit pricing and inventory
- Cite external weather sources

## 7. Demo Scenarios
1. **Southern heatwave 35℃+** → dairy cold-chain breach rate 28% (vs. 8% baseline)
2. **Next-day ordering correction** → -20% orders to breaching stores, +10% to stable stores
3. **Weekly ordering simulation** → recovery cost per region · SKU