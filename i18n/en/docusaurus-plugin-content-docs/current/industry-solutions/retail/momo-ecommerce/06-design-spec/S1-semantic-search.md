---
title: S1. Natural-Language Semantic Search (Momo)
description: Unified search across massive SKU + Members + Live reviews + Dcard · Xiaohongshu
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S1. Semantic Search
---

## 1. URL · Persona
- `/semantic-search` · P1 (Marketing), P3 (Search · Recommendation)

## 2. Data Mix
- In-house massive SKU + Member profiles + In-house reviews + Live-broadcast reviews + Dcard · Xiaohongshu · Instagram

## 3. Input Example
- "Cost-effective summer camping tent + 24-hour delivery + Dcard rating 4.5+"

## 4. Output UI
- 3-column results: SKU + Member + External review
- 1-hop KG (cytoscape)
- **Long-tail SKU indicator** (longtail_score badge)

## 5. Demo Scenarios
1. "Summer camping tent" → recommended SKUs + 24-hour delivery availability tag
2. "Cosmetics popular on live broadcasts" → LiveStreamPurchase join
3. "Long-tail SKU exposure + new products" → ties into S11-Mo
