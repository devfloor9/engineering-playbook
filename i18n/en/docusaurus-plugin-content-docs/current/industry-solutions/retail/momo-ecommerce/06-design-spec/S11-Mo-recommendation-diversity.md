---
title: S11-Mo. Mobile-App Recommendation · Search Diversity (Momo-Specific)
description: Recommendation diversity · New-product exposure · Long-tail SKU discovery — exploration-purchase balance monitor
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-Mo. Recommendation Diversity
---

> **Momo differentiation point** ⭐ — Monitors recommendation diversity and long-tail exposure so that the massive SKU asset stays discoverable in the mobile app.

## 1. URL · Persona
- `/recommendation-diversity` · P3 (Search · Recommendation · MarTech)

## 2. User Story
> P3 — Track recommendation diversity score, new-product exposure ratio, and long-tail SKU exposure rate by category, segment, and time slot.

## 3. Data Mix
| Data | Source |
|---|---|
| Product (LongTailSKU flag) | Neptune |
| Recommendation · Search exposure logs | OpenSearch |
| OrderTransaction | Neptune |
| User behavior (exploration vs purchase) | CartEvent + SearchEvent |

## 4. Metrics

| Metric | Definition |
|---|---|
| **Diversity score (intra-list)** | Category · brand distribution entropy within recommendations |
| **New-product exposure ratio** | Share of SKUs launched within last 30 days |
| **Long-tail exposure rate** | Share of SKUs with monthly transactions below SKU average |
| **Exploration-purchase balance** | Click / Purchase ratio within normal range |

## 5. Processing Pipeline
```
1. Recommendation exposure log dataframe
2. Compute category · brand entropy
3. Compute new-product · long-tail ratios
4. Per-category diversity score → auto-alert when below threshold
5. A/B comparison (diversity ↑ vs CTR ↑ tradeoff)
```

## 6. Output UI
- Left: Per-category diversity-score bars
- Center: New-product · long-tail exposure time series
- Right: Exploration-purchase balance score
- Bottom: Diversity ↑ A/B results

## 7. Guardrails
- Recommendation-algorithm business-information protection
- A/B test results shown with statistical confidence intervals

## 8. Demo Scenarios
1. **Per-category diversity score** → "Summer tent" 0.31 (low — concentrated in 1-2 popular SKUs)
2. **Long-tail exposure ratio** → 8% → 12% after diversity-corrected recommendation simulation
3. **A/B results** → After diversity ↑: CTR -2%, GMV +6% (long-horizon efficiency ↑)
