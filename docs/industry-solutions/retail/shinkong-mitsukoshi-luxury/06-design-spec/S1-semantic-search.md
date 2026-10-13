---
title: S1. Natural-Language Semantic Search (Mitsukoshi)
description: Unified search across tenant brand SKUs + VIP/Foreigner + external reviews (Xiaohongshu, Dcard, Instagram)
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S1. Semantic Search
---

## 1. URL · Personas
- `/semantic-search` · P1, P5

## 2. User Stories
- P1: "Female in her 30s + LV/Chanel + Anniversary Sale 50% off" → SKU + VIP member recommendation
- P5: "Popular SKUs of LV on the 1F of Xinyi store + Japanese reviews" → counter merchandising insight

## 3. Data Mix
| Data | Source |
|---|---|
| Tenant SKU | OpenSearch `idx_product` (Smartcn) |
| Members + Foreigner | OpenSearch `idx_customer` |
| First-party reviews | OpenSearch `idx_review` |
| External reviews (Xiaohongshu, Dcard, Instagram, Japanese Twitter) | OpenSearch `idx_social_trend` (multilingual) |
| KG 1-hop | Neptune (Customer × Boutique × Brand × Store) |

## 4. UI
- Multilingual natural-language input (Traditional Chinese, English, Japanese)
- Filters: store / floor / brand / price
- 3-column result: SKU / member / external reviews

## 5. Guardrails
- PII masking
- Duty-free eligibility verification (Foreigner only)

## 6. Demo Scenarios
1. "Female in her 30s + LV new release + popular among Japanese" → SKU + Japanese reviews
2. "Hermes SKUs frequently purchased by Black-tier members" → member matrix
3. "Luxury SKUs eligible for Anniversary Sale + 50% off" → campaign linkage
