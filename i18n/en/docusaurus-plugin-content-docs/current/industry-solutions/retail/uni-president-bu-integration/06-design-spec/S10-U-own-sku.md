---
title: S10-U. Own-Manufactured SKU vs Own-Channel Sell-Through (UPI-Specific)
description: Compare 7ELE / Carrefour turnover of Uni-President Food own SKUs (Uni-Noodle, Mai-Hsiang, etc.) against external channels
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S10-U. Own SKU
---

> **Uni-President differentiator** ⭐ — the core of manufacturing-distribution vertical integration: analyze how own Uni-President Food SKUs turn over in own channels (7ELE · Carrefour) versus external channels.

## 1. URL · Persona
- `/own-sku` · P5 (Manufacturing · Logistics · Stores)

## 2. User Story
> P5 — Compare Uni-President Mai-Hsiang (麥香) oolong-tea sell-through across 7ELE vs Carrefour vs external (FamilyMart · Hi-Life) + decide shipment priority for new SKUs.

## 3. Data Mix
| Data | Source |
|---|---|
| OwnSKU (own-manufactured) | Neptune (~5K SKUs) |
| CVSTransaction (7ELE) | Neptune |
| HypermarketTransaction (Carrefour) | Neptune |
| External sell-through (estimated) | CompetitorSignal (public sales index) |
| Cold-chain shipment log | ColdChainSLA |

## 4. Processing Pipeline
```
1. Map OwnSKU nodes → manufacturing BU
2. Aggregate turnover in own channels (7ELE / Carrefour)
3. Estimate external-channel turnover (CompetitorSignal + public market share)
4. Compute own-vs-external ratio
5. Recommendation: prioritize own shipment (inventory protection) vs expand external
```

## 5. Output UI
- Left: Top-30 own-SKU turnover bars (own vs external)
- Center: Own-channel dependency per SKU (donut)
- Right: New-SKU shipment-priority recommendation (Sonnet)
- Bottom: Seasonal turnover trend

## 6. Guardrails
- Block external exposure of own-SKU unit pricing and margins
- Mark confidence on externally estimated data

## 7. Demo Scenarios
1. **Mai-Hsiang (麥香) oolong tea** → own-channel turnover 65% / external 35%
2. **New-SKU shipment recommendation** → 7ELE first (high own-channel dependency)
3. **Per-category own-channel dependency** → beverages 70% / noodles 55% / dairy 80%