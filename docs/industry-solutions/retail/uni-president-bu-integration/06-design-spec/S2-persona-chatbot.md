---
title: S2. 5-Department Persona Chatbot (Uni-President)
description: Autonomous tool invocation across 5 departments — Integrated Marketing · CMI · D&A · OPENPOINT · Manufacturing & Logistics
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
sidebar_label: S2. Persona Chatbot
---

## 12 Tools

**Table 1. The 12 agent tools**

| Tool | Description |
|---|---|
| `semantic_search` | OpenSearch BM25 + KNN + rerank |
| `neptune_query` | openCypher (cross-BU queries) |
| `bu_crossover` | Members crossing BUs (S9-U) |
| `sku_sellthrough` | Own-SKU channel turnover (S10-U) |
| `cold_chain_sla` | Cold-chain SLA + outdoor temperature (S11-U) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | Dcard · Xiaohongshu (小紅書) · Instagram |
| `weather_join` | Central Weather Administration (中央氣象署) |
| `economic_join` | DGBAS · Central Bank (央行) |
| `competitor_join` | FamilyMart · Hi-Life · RT-Mart |
| `cluster_run` | KMeans + LLM |
| `pii_mask` | PII |

## Per-Persona Variations

**Table 2. Primary tools by persona**

| P | Primary Tools |
|---|---|
| P1 | bu_crossover · campaign_simulator |
| P2 | cluster_run · bu_crossover |
| P3 | neptune_query · behavior_change_detect |
| P4 | semantic_search · membership_matrix |
| P5 | sku_sellthrough · cold_chain_sla · weather_join |

## Demo Scenarios
1. (P1) "+5pt cross-BU usage campaign" → bu_crossover
2. (P5) "Mai-Hsiang (麥香) beverages — 7ELE vs Carrefour turnover" → sku_sellthrough
3. (P1↔P5 switcher) Same query, tonal shift