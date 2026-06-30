---
title: S2. Persona Chatbot Across 5 Departments (AMWAY)
description: A chatbot autonomously invoking tools for ABO Field, CMI, D&A, CX, and Compliance personas
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 1. URL & Personas
- `/chat` · All personas

## 2. User Stories
- P1 (ABO Field): "Top 10 ABOs who reached Diamond this quarter and their Downline activity"
- P5 (Compliance): "Protein-campaign ad review + minor block counts"

## 3. UI
- Left: chat / Right: SSE tool-call trace
- Persona switcher + four suggested queries

## 4. 12 Tools

| Tool | Description |
|---|---|
| `semantic_search` | OpenSearch BM25 + KNN + Rerank (multilingual) |
| `neptune_query` | openCypher |
| `abo_tree_query` | ABO tree depth query (S9-A) |
| `subscription_lifecycle` | Subscription state · churn signature (S10-A) |
| `campaign_simulator` | Bayesian ROAS |
| `behavior_change_detect` | Statistical signature |
| `social_trend_join` | Social multilingual |
| `weather_join` | KMA · global weather |
| `economic_join` | FX · prices (multi-country) |
| `regulation_join` | Direct-selling regulations |
| `cluster_run` | KMeans + LLM labeling |
| `pii_mask` | PII masking |

## 5. Per-persona Variations
| P | system prompt keywords | Primary tools |
|---|---|---|
| P1 | ABO · Sponsor · Downline · PV/BV | abo_tree_query, campaign_simulator |
| P2 | Cohort · LTV · SOV | cluster_run, social_trend_join |
| P3 | Accuracy · drift | behavior_change_detect, neptune_query |
| P4 | Level · NPS · subscription | subscription_lifecycle, semantic_search |
| P5 | Regulation · consent · minors | regulation_join, pii_mask |

## 6. Guardrails
- Input: 4 topics + direct selling + minors + HFF
- Output: PII masking; citations are mandatory for regulatory answers
- Tools: write tools are restricted to P3 and P5

## 7. Demo Scenarios
1. (P1) "Top 10 ABOs reaching Diamond this quarter" → abo_tree_query + neptune_query
2. (P1 → P4 switcher) Same query → tone shifts (level / NPS lens)
3. (P5) "Review Nutrilite advertising" → regulation_join + list of high-risk SKUs
