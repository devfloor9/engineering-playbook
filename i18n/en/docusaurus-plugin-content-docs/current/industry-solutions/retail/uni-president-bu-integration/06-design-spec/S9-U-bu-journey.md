---
title: S9-U. Cross-BU OPENPOINT Member Journey (UPI-Specific)
description: Single-KG behavior analysis of one OPENPOINT member crossing 7-Eleven → Carrefour → Starbucks → Donut
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
sidebar_label: S9-U. BU Crossover
---

> **Uni-President differentiator** ⭐ (the PoC's decisive moment) — visualize and analyze, in a single KG, how one OPENPOINT member crosses 5 BUs (7ELE / Carrefour / Starbucks / Donut / KFC).

## 1. URL · Persona
- `/bu-journey` · P1 (Integrated Marketing), P2 (CMI)

## 2. User Story
> P1 — Average cross-BU usage rate of 12M Gold OPENPOINT members + weekday/weekend patterns + per-hour BU migration.

> P2 — Statistical pattern of "the categories where 7ELE beverage loyalists migrate to Carrefour."

## 3. Data Mix
| Data | Source |
|---|---|
| OPENPOINTMembership | Neptune |
| CVSTransaction (7ELE) | Neptune (~300K) |
| HypermarketTransaction (Carrefour) | Neptune (~80K) |
| CafeTransaction (Starbucks/Donut/KFC) | Neptune (~50K) |
| BUTransfer (cross-BU migration log) | Neptune (~20K) |

## 4. Processing Pipeline
```
1. Select OPENPOINT member cohort
2. Build daily per-BU transaction matrix
3. Count cross-BU events (within 24h / 1 week)
4. Compute per-BU-pair transfer flow
5. Visualize: Sankey (BU flow) + heatmap (BU-pair matrix) + individual-member timeline
```

## 5. Output UI
- Left: Cross-BU Sankey (e.g., 7ELE → Carrefour 30% / 7ELE → Starbucks 12%)
- Center: BU-pair matrix (5×5 heatmap)
- Right: Individual member 90-day timeline (single case)
- Bottom: Cross-BU-usage cohort comparison (by tier)

## 6. Guardrails
- Member PII masking (OPENPOINT ID hash)
- BU commercial-information segregation (per-BU unit pricing not disclosed)

## 7. Demo Scenarios
1. **12M OPENPOINT statistics** → 7ELE → Carrefour crossover rate 30%
2. **Individual member 90 days** → weekday 7ELE → weekend Carrefour → morning Starbucks (single timeline)
3. **BU-pair matrix** → "7ELE↔Starbucks 12% (strong), Donut↔KFC 8% (weak)"
4. **Cross-BU-driving campaign for this member** → linked to S5