---
title: 11-Scenario Mapping (AMWAY)
description: 8 common scenarios (S1–S8) + 3 AMWAY-specific scenarios (S9-A · S10-A · S11-A)
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - industry-solution
  - retail
  - amway
  - scenario
  - use-case
  - scope:design
sidebar_label: 03. Scenarios
---

> 8 common scenarios (S1–S8) + 3 AMWAY-specific scenarios (S9-A · S10-A · S11-A) = 11 in total.
> Every scenario specifies a data mix combining in-house data with four external sources (social, weather, economic, regulatory).

---

## 1. Overview of the 11 Scenarios

| # | Scenario | In-house Data | External Data | URL | Primary Persona |
|---|---|---|---|---|---|
| **S1** | Natural-language semantic search | SKU · ABO · in-house reviews | Social posts | `/semantic-search` | P1, P2 |
| **S2** | Persona chatbot across 5 departments | All in-house | All 4 external | `/chat` | All |
| **S3** | Category & BU insight cards | OrderTransaction · ABODirectSale | Trends · FX | `/insights` | P3 |
| **S4** | Lifestyle persona matching + clustering | RFM · category affinity | Social personas | `/personas` | P2 |
| **S5** | Omnichannel campaign ROAS simulation | Campaign · Touchpoint | SNS · search response | `/campaign-roas` | P1 |
| **S6** | External signal fusion | In-house GMV (BU · country) | All 4 | `/signals` | P2, P3 |
| **S7** | Omnichannel member journey | Store → ABO direct → subscription → re-signup | (none) | `/journey` | P4 |
| **S8** | Marketing consent · PII guardrails | Consent · compliance | (none) | `/compliance` | P4, P5 |
| **S9-A** ⭐ | **ABO organization visualization + performance tracking** | ABO tree · PV/BV · level | (none) | `/abo-tree` | P1 |
| **S10-A** ⭐ | **Subscription lifetime analysis** | Subscription · event history | (none) | `/subscription` | P4 |
| **S11-A** ⭐ | **Direct-selling law, minors, HFF advertising compliance** | Compliance · consent | RegulatorySignal | `/regulatory` | P5 |

---

## 2. Persona × Scenario Matrix

| Department | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-A | S10-A | S11-A |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1 ABO Field** | ⭐ | ⭐ |  |  | ⭐ |  |  |  | ⭐ |  |  |
| **P2 CMI** |  | ⭐ |  | ⭐ |  | ⭐ |  |  |  |  |  |
| **P3 D&A** |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| **P4 CX** |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  | ⭐ |  |
| **P5 Compliance** |  | ⭐ |  |  |  |  |  | ⭐ |  |  | ⭐ |

---

## 3. Per-scenario Data Mix (Summary)

| # | Core Data |
|---|---|
| S1 | OpenSearch (BM25 + KNN + RRF + Rerank) + Neptune 1-hop |
| S2 | Autonomous invocation of 12 tools (semantic_search · neptune_query · campaign_simulator · social_trend_join · weather_join · economic_join · regulation_join · abo_tree_query · subscription_lifecycle · cluster_run · attribution_calc · pii_mask) |
| S3 | Snowflake/Neptune aggregation + AgentCore Code Interpreter |
| S4 | KMeans 6 + LLM labeling + social keyword enrichment |
| S5 | Bayesian (PyMC) + channel · country prior |
| S6 | Time series + correlation heatmap + lag analysis |
| S7 | Swimlane timeline (store · ABO · subscription · campaign) |
| S8 | Bedrock Guardrails + consent matrix |
| **S9-A** | Neptune ABO Tree DFS + cytoscape.js |
| **S10-A** | Subscription state machine + churn signature + LSTM (optional) |
| **S11-A** | RegulatorySignal × ad-text review + minor guard |

---

## 4. Top-5 Demo Path (30 minutes)

```
[S1] Natural-language search 4 min
   "Vegan protein + new ABO in their 30s + Instagram +20%"
   → SKU (Nutrilite Plant Protein) + ABO + external reviews

[S9-A] ABO organization visualization 5 min ⭐ AMWAY differentiator
   "Five-level Downline tree for a Diamond-level ABO"
   → cytoscape tree + PV/BV · level color coding

[S10-A] Subscription lifetime 5 min ⭐
   "Top 100 ABOs with 6-month churn signatures + automated win-back campaign"
   → Subscription state · churn z-score · recommendation

[S2] Persona chatbot 5 min (switcher)
   "Upline ROI vs subscription retention"
   → Compare answers from P1 (ABO Field) and P4 (CX)

[S11-A] Compliance 3 min ⭐
   "Blocking minor ABO sign-ups" + "Reviewing Nutrilite ad language"
   → Block / mask count visualization
```

---

## 5. PoC Timeline (8 weeks)

| Week | Work |
|---|---|
| 1–2 | Data ingestion (in-house N = 1K ABOs + 5K customers + 50K synthetic + 4 external sources) |
| 3–4 | S1 · S2 · S3 |
| 5 | S9-A ABO tree + S10-A subscriptions |
| 6 | S5 · S7 · S11-A compliance |
| 7 | S4 · S6 · S8 |
| 8 | Demo rehearsal + backup |
