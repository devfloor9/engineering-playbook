---
title: S1. Natural-Language Semantic Search (Uni-President)
description: Unified search across 5-BU SKUs + OPENPOINT members + external reviews
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
sidebar_label: S1. Semantic Search
---

## 1. URL · Persona
- `/semantic-search` · P1, P5

## 2. Data Mix
- 5-BU own SKUs + OPENPOINT members + first-party reviews + Dcard · Xiaohongshu (小紅書) reviews

## 3. Sample Input
- "Summer oolong tea PB SKUs + 7ELE stores + Dcard rating 4+"

## 4. Output UI
- 3-column results: SKUs + members + external reviews
- BU color coding (7ELE / Carrefour / Starbucks / Donut / KFC / Uni-President Food)
- 1-hop KG (cytoscape)

## 5. Demo Scenarios
1. "Top-selling Mai-Hsiang (麥香) beverage SKUs at 7ELE" → SKUs + sell-through (linked to S10-U)
2. "OPENPOINT Gold members + Carrefour food loyalists" → members + category matrix
3. "Popular Starbucks seasonal menu" → SKUs + external reviews