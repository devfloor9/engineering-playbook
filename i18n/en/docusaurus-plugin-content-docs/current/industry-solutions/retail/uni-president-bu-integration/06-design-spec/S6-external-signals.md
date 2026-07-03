---
title: S6. External Signal Fusion (Uni-President)
description: Fusion of 4 external sources — social · weather · economic · competitor
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S6. External Signals
---

## 4 External Sources

| Type | Source |
|---|---|
| Social | Dcard · Xiaohongshu (小紅書) · Instagram · X |
| Weather | Central Weather Administration (中央氣象署) — cold-chain critical |
| Economic | DGBAS · Central Bank (央行) |
| Competitor | FamilyMart · Hi-Life · RT-Mart |

## Processing
- Daily own GMV (per BU) × 4 external sources, joined
- Correlation and lag analysis
- Visualization: time series + heatmap + competitor annotations

## Demo Scenarios
1. Heatwave 35℃+ → 7ELE beverages +35% / cold-chain SLA -15%
2. "Premium bento" keyword vs 7ELE bento sales
3. After FamilyMart Singles' Day (光棍節) campaign, own 7ELE GMV -3% (7-day lag)