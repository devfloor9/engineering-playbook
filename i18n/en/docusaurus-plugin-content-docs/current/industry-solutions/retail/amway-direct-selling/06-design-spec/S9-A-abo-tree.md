---
title: S9-A. ABO Organization Visualization + Performance Tracking (AMWAY-specific)
description: Visualize AMWAY's multi-level ABO tree to a depth of 5 + PV/BV and level performance + Sponsor analysis
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S9-A. ABO Tree
---

> **AMWAY differentiator** ⭐ — Explore and analyze performance for the ABO organization tree, the core asset of multi-level direct selling, up to a depth of 5 levels on a single screen.

## 1. URL & Personas
- `/abo-tree` · P1 (ABO Field), P4 (CX)

## 2. User Stories
> P1 (ABO Field) — Click a single Diamond-level ABO to auto-expand a 5-level Downline tree and review each ABO's PV/BV, level, and Sponsor performance on one screen.

> P4 (CX) — Within a Sponsor's tree, automatically color-code low-activity ABOs as CRM-campaign triggers.

## 3. Input UI
- Root ABO search (masked ID or natural language: "Diamond level + United States")
- Depth slider (1–5 levels)
- Level filters (Founders Platinum / Diamond / Founders Diamond / EDC / EC)
- Display toggles: PV (Personal Volume) / BV (Business Volume) / activity

## 4. Data Mix
| Data | Source |
|---|---|
| ABO nodes | Neptune (~50K) |
| DownlineLink edges | Neptune (~250K) |
| ABO level, PV/BV | ABO node attributes |
| 90-day activity | OrderTransaction + ABODirectSale frequency |
| Sponsor performance | upline_chain × Downline GMV |

## 5. Processing Pipeline
```
1. Root ABO search → Neptune
2. openCypher MATCH (root)-[:HAS_DOWNLINE*1..5]->(d)
3. Enrich each node with PV/BV and activity
4. Node color: level mapping (Diamond = yellow / Platinum = silver / EDC = light blue)
5. Node size: proportional to PV
6. Activity < 30 days → red outline
7. cytoscape.js tree layout
```

## 6. Output UI
- Left: Tree visualization (cytoscape.js dagre / concentric layout)
- Right: Selected ABO detail card (PV/BV/level/Downline count/Sponsor score)
- Bottom: Sponsor performance matrix (level × Downline productivity)

## 7. Guardrails
- Expose only masked ABO IDs (real names and contacts are hidden)
- Verify authorization when Downline exceeds 5 levels (P5 Compliance only)
- Zero minor ABOs (S11-A guard)

## 8. Demo Scenarios
1. **Root = one Diamond-level ABO** → 5-level tree auto-expands (~120 nodes)
2. **ABOs with activity below 30 days are auto-highlighted** (red outline) → CRM campaign candidates
3. **Sponsor performance matrix** → which Sponsor levels have the most active Downline
