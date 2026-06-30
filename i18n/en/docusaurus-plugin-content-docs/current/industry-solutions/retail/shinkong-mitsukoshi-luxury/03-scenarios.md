---
title: 11 Scenario Mapping (Mitsukoshi)
description: 8 common + 3 Mitsukoshi-specific (Foreigner duty-free, Luxury SOV, VIP concierge)
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - scenario
  - use-case
  - scope:design
sidebar_label: 03. Scenarios
---

| # | Scenario | First-party Data | External Data | URL | Primary Persona |
|---|---|---|---|---|---|
| **S1** | Natural-language semantic search | Product, members, first-party reviews | Xiaohongshu, Dcard reviews | `/semantic-search` | P1, P5 |
| **S2** | 5-department persona chatbot | All first-party | 4 types | `/chat` | All |
| **S3** | Category / BU insight cards | POSTransaction × Boutique | FX, tourism, competitors | `/insights` | P3 |
| **S4** | Persona matching + clustering | RFM + luxury affinity | Social personas | `/personas` | P2 |
| **S5** | Omnichannel campaign ROAS simulator | Campaign, Touchpoint | Search, SNS | `/campaign-roas` | P1 |
| **S6** | External signal fusion | First-party GMV | 4 types (including tourism) | `/signals` | P2, P3 |
| **S7** | Omnichannel member journey | Online → store → duty-free → repeat visit | (none) | `/journey` | P4 |
| **S8** | Marketing consent / PII guardrails | Compliance | (none) | `/compliance` | P4 |
| **S9-M** ⭐ | **Foreign tourist behavior analysis + duty-free recommendation** | Foreigner, TaxRefund | FX, tourism | `/foreigner` | P2 |
| **S10-M** ⭐ | **Luxury brand SOV + counter occupancy** | Boutique × Brand × Store | Competitors | `/brand-sov` | P5 |
| **S11-M** ⭐ | **VIP tier lounge concierge** | Black/Platinum/Gold + concierge history | (none) | `/vip-concierge` | P4 |

---

## Persona Matrix

| Department | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-M | S10-M | S11-M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |  |
| P2 |  | ⭐ |  | ⭐ |  | ⭐ |  |  | ⭐ |  |  |
| P3 |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| P4 |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  |  | ⭐ |
| P5 | ⭐ | ⭐ |  |  |  |  |  |  |  | ⭐ |  |

---

## Top-5 Demo Path (30 minutes)

```
[S1] Natural-language search — 4 min
   "Female in her 30s + LV/Chanel + Anniversary Sale 50% off"
   → SKU + members + external reviews

[S9-M] Foreigner duty-free — 5 min ⭐
   "Japanese female in her 30s → duty-free recommendation + FX-aware"
   → Foreigner profile + recommended brands + FX fluctuations

[S10-M] Luxury SOV — 4 min ⭐
   "Xinyi store 1F LV vs Hermes counter occupancy"
   → Brand GMV comparison + turnover

[S11-M] VIP concierge — 5 min ⭐
   "Pre-sale recommendation for a Black-tier member"
   → Member profile + recommended brands + concierge message

[S2] Persona chatbot — 4 min
   "Anniversary Sale ROAS" P1 vs P5 comparison
```

---

## PoC Schedule (8 weeks)
| Week | Task |
|---|---|
| 1-2 | Data ingestion (first-party + 49.5K synthetic + external) |
| 3-4 | S1, S2, S3 |
| 5 | S9-M + S11-M |
| 6 | S5, S7, S10-M |
| 7 | S4, S6, S8 |
| 8 | Demo rehearsal |
