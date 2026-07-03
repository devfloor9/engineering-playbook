---
title: S1. Natural-Language Semantic Search
description: Integrated semantic search across first-party SKU · Member · Reviews + external social reviews (Olive Young · X)
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S1. Semantic Search
---

## 1. URL Path
- `/semantic-search`
- Persona switcher header applied automatically

## 2. User Stories
> P1 (Brand Marketer) — Enter "Women in 30s, sensitive scalp, prefers organic, unpurchased in last 90 days + Olive Young rating 4.5+" and instantly see Member + SKU + first-party / external reviews on one screen.

> P5 (MD) — Enter "Popular winter hand creams in the 5K KRW range + surging Instagram mentions" and see SKU · turnover · social SOV simultaneously.

## 3. Input UI
- Main search bar (natural-language, Korean)
- Filters: BU (Beauty/HDB/Refreshment) · Brand · Price · Period · Segment
- Persona switcher

## 4. Data Mix
| Data | Source | Use |
|---|---|---|
| First-party SKU | OpenSearch `idx_product` | BM25+KNN |
| Member profile | OpenSearch `idx_customer` | KNN |
| First-party reviews | OpenSearch `idx_review` (owned mall) | BM25+KNN |
| **External reviews (Olive Young · Naver · X)** | OpenSearch `idx_review`/`idx_social_trend` | KNN |
| KG 1-hop | Neptune (Customer × Product × Brand × BU) | Graph expansion |

## 5. Processing Pipeline
```
1. Input → Cohere embed-v4 (1024d)
2. OpenSearch in parallel
   - BM25 (Nori) → top 100 (first-party + external reviews)
   - KNN (cosine) → top 100
3. RRF fusion → top 50
4. Cohere rerank-v3.5 → top 20
5. Neptune 1-hop expansion (selected SKU/Customer)
6. Result cards + graph
```

## 6. Output UI
- Result cards (3 columns): SKU card / Member card / **Review card (first-party · external separated)**
- 1-hop graph panel (cytoscape.js)
- Cohort badges: green real / yellow synth / blue external
- Result count: "37 items (BM25 12, KNN 18, common 7)"

## 7. Per-Department Variations
| Persona | Recommended Query | Result Order |
|---|---|---|
| P1 Brand Marketer | "Gold members unpurchased in last 90 days" | Member card prioritized, with campaign recommendations attached |
| P2 Insights | "SKUs with surging negative Olive Young reviews" | Review card prioritized, SOV shown |
| P3 D&A | "Review embedding drift" | Review card + drift score |
| P4 CRM · LG Members | "Members with low activity after VIP entry" | Member + tier change |
| P5 MD · Channel Sales | "Popular winter hand creams + Instagram mentions surge" | SKU prioritized, turn · SOV |

## 8. Guardrails
- PII masking (name · contact · address)
- Marketing-non-consent member cards: separate badge + external send blocked
- Block cosmetics marketing for estimated-minor members
- External review source attribution (Olive Young · Naver · X labels)

## 9. Demo Scenarios
1. "30s sensitive scalp organic shampoo in 20K KRW range + Olive Young rating 4.5+" → SKU(Elastine) + first-party/Olive Young reviews integrated
2. "Single-household + Beauty loyalists + Instagram mentions surging" → Members + SKUs they frequently buy + SNS keywords
3. "Beverage SKUs whose sales dropped during last week's rain" → SKU + Channel + external signals (S6 linkage)
