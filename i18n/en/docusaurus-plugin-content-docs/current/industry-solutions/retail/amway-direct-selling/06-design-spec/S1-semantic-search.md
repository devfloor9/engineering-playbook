---
title: S1. Natural-Language Semantic Search (AMWAY)
description: Integrated search across Nutrilite, Artistry, Home SKUs + ABOs + external social posts
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
sidebar_label: S1. Semantic Search
---

## 1. URL & Personas
- `/semantic-search` · P1 (ABO Field), P2 (Insights), P5 (Compliance)

## 2. User Stories
- P1: "Vegan protein + new ABO in their 30s + no active subscription" → instant ABO recommendations
- P5: "Review Nutrilite ad language + SKUs with minor risk" → regulatory guard list

## 3. Input UI
- Natural-language input box (multilingual support)
- Filters: category (Nutrition / Beauty / Home), brand, ABO level, country, price
- Persona switcher

## 4. Data Mix
| Data | Source | Use |
|---|---|---|
| In-house SKUs | OpenSearch `idx_product` | BM25 + KNN |
| ABO profile | OpenSearch `idx_abo` | KNN |
| In-house reviews | OpenSearch `idx_review` | BM25 + KNN |
| External social posts | OpenSearch `idx_social_trend` (Reddit · Instagram · X) | KNN (multilingual) |
| Regulatory text | OpenSearch `idx_regulation` | BM25 (P5 only) |
| KG 1-hop | Neptune (ABO × Product × Brand × BU) | Graph expansion |

## 5. Processing Pipeline
1. Input → Cohere embed-v4
2. OpenSearch in parallel: BM25 + KNN → top 100/100
3. RRF fusion → top 50
4. Cohere rerank-v3.5 (`cohere.rerank-v3-5:0`) → top 20
5. Neptune 1-hop expansion (ABO / SKU nodes)
6. Result cards + graph

## 6. Output UI
- Three columns: SKU cards / ABO · Customer cards / external review cards
- 1-hop KG (cytoscape.js)
- Cohort badge: 🟢 real / 🟡 synth / 🔵 external
- Result count + response time

## 7. Per-department Variations
| Persona | Suggested Query |
|---|---|
| P1 | "Diamond candidate ABO recommendations" |
| P2 | "Emerging vegan trends matched to in-house SKUs" |
| P3 | "Review embedding drift" |
| P4 | "Subscription churn risk + similar ABOs" |
| P5 | "SKUs with ad-language risk" |

## 8. Guardrails
- PII masking (ABO and customer names and contacts)
- Block nutritional supplement and beauty marketing to suspected minors
- Cite external review sources

## 9. Demo Scenarios
1. "Vegan protein + 30s + Instagram +20%" → Nutrilite Plant Protein + reviews
2. "Diamond-level candidate ABOs" → ABO + tree (linked to S9-A)
3. "Artistry ad-language review" → SKU + regulatory risk markers
