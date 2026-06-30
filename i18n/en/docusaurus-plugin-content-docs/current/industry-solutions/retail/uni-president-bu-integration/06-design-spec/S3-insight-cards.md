---
title: S3. Category · BU Insight Cards (Uni-President)
description: Combination of 5-BU GMV + own-SKU sell-through + 4 external sources
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
sidebar_label: S3. Insight Cards
---

## Card Presets

| Card | Data |
|---|---|
| Monthly BU GMV (5-BU comparison) | All Transactions × BU |
| **OPENPOINT cross-BU usage rate** | BUTransfer × Customer |
| **Channel turnover of Uni-President own SKUs** | OwnSKU × CVS/Hyper × Volume |
| Heatwave vs cold-chain SLA | WeatherSignal × ColdChainSLA |
| Search trends vs own performance | SocialSignal + GMV |
| Competitor (FamilyMart) campaign impact | CompetitorSignal annotation |

## Per-Persona Commentary Differences

| P | BU GMV Commentary |
|---|---|
| P1 | "Starbucks +18% in July — effect of summer campaign" |
| P2 | "OPENPOINT cross-BU usage +3pt — 7ELE↔Carrefour growing" |
| P3 | "Cross-BU ETL SLA 99.2%; one 30-minute delay" |
| P4 | "12M active OPENPOINT members (+1.5% MoM)" |
| P5 | "Mai-Hsiang (麥香) beverage 7ELE turnover +0.4 — recommend +20% ordering" |

## Demo Scenarios
1. "Monthly BU GMV" → commentary from 5 personas
2. "Cross-BU usage rate" → 7ELE↔Carrefour 30%, ↔Starbucks 12%
3. "Heatwave vs cold chain" → R² 0.72