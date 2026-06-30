---
title: 11-Scenario Map (Uni-President)
description: 8 common + 3 UPI-specific (cross-BU member journey · own-SKU sell-through · cold chain)
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - scenario
  - use-case
  - scope:design
sidebar_label: 03. Scenarios
---

| # | Scenario | URL | Primary Persona |
|---|---|---|---|
| S1 | Natural-language semantic search | `/semantic-search` | P1, P5 |
| S2 | 5-department persona chatbot | `/chat` | All |
| S3 | Category · BU insight cards | `/insights` | P3 |
| S4 | Persona matching + clustering | `/personas` | P2 |
| S5 | Omnichannel campaign ROAS simulation | `/campaign-roas` | P1 |
| S6 | External-signal fusion | `/signals` | P2 |
| S7 | Omnichannel member journey | `/journey` | P4 |
| S8 | Guardrails | `/compliance` | P4 |
| **S9-U** ⭐ | Cross-BU OPENPOINT member journey | `/bu-journey` | P1, P2 |
| **S10-U** ⭐ | Own-manufactured SKU vs own-channel sell-through | `/own-sku` | P5 |
| **S11-U** ⭐ | Cold-chain · logistics SLA + store ordering | `/cold-chain` | P5 |

## Persona Matrix

| Department | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-U | S10-U | S11-U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | ⭐ | ⭐ |  |  | ⭐ |  |  |  | ⭐ |  |  |
| P2 |  | ⭐ |  | ⭐ |  | ⭐ |  |  | ⭐ |  |  |
| P3 |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| P4 |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  |  |  |
| P5 | ⭐ | ⭐ |  |  |  |  |  |  |  | ⭐ | ⭐ |

## Top-5 Demo Path (30 min)

```
[S1] Semantic search  4 min
   "Summer oolong tea PB SKUs + 7ELE stores"

[S9-U] Cross-BU OPENPOINT journey  6 min ⭐ (PoC decisive moment)
   "One OPENPOINT member over 90 days — 7ELE → Carrefour → Starbucks → Donut"
   → A single timeline of cross-BU behavior

[S10-U] Own-SKU sell-through  4 min ⭐
   "Uni-President Mai-Hsiang (麥香) beverages — 7ELE vs Carrefour turnover"

[S11-U] Cold-chain SLA  4 min ⭐
   "Southern Taiwan heatwave — dairy SLA breach rate + ordering correction"

[S2] Persona chatbot  4 min
   "Cross-BU usage promotion campaign" — P1 vs P5
```

## PoC Schedule (8 weeks)
| Week | Work |
|---|---|
| 1-2 | Load 5-BU data + OPENPOINT |
| 3-4 | S1 · S2 · S3 |
| 5 | S9-U (most challenging) |
| 6 | S10-U · S11-U |
| 7 | S5 · S7 · S8 |
| 8 | Demo rehearsal |