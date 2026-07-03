---
title: 8-Scenario Mapping
description: Eight core scenarios for marketing innovation. Data mix (first-party + 4 external types) is specified for every scenario
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 7
tags:
  - industry-solution
  - retail
  - lg-hnh
  - scenario
  - use-case
  - scope:design
sidebar_label: 03. Scenarios
---

> The 8 core scenarios most directly tied to marketing innovation in this data-silo + external-signal fusion PoC. **Every scenario specifies a data mix combining first-party data with the 4 external types (social · weather · economy · competitor).**

---

## 1. 8-Scenario Overview

| # | Scenario | First-Party Data | External Data | URL | Primary Persona |
|---|---|---|---|---|---|
| **S1** | Natural-language semantic search | SKU · Member · First-party reviews | Olive Young · X reviews (social) | `/semantic-search` | P1, P5 |
| **S2** | 5-department persona chatbot | All first-party data | All 4 external types (tool autonomy) | `/chat` | All |
| **S3** | Category · BU insight cards | OrderTransaction · ChannelSellThrough | Search trend + Weather + Competitor | `/insights` | P3 |
| **S4** | Lifestyle persona matching + clustering | Member RFM · Category affinity | Social personas (Instagram · Olive Young) | `/personas` | P2 |
| **S5** | Omnichannel campaign ROAS simulation | Past campaigns · Channel sell-through | Search trends · SNS responses | `/campaign-roas` | P1, P5 |
| **S6** | External signal fusion | First-party GMV (BU · Category · Store) | All 4 types (trend · weather · economy · competitor) | `/signals` | P2, P3 |
| **S7** | Omnichannel member journey | Owned mall · CartEvent · SNS ad responses · channel transactions | (none, prioritize first-party data integration) | `/journey` | P4 |
| **S8** | Marketing consent · PII · minor guardrails | Member consent · Compliance | (none, Bedrock Guardrails) | `/compliance` | P4 |

---

## 2. 14 Patterns → Compressed Mapping to 8 Scenarios

> Among the 14-scenario pool that frequently appears in ontology + Agentic AI PoC patterns, the 8 most directly relevant to LG H&H marketing innovation have been selected and redefined.

| Original Pattern | LG H&H Mapping | Notes |
|---|---|---|
| Hybrid search | **S1** Natural-language semantic search | Strengthened by combining external reviews |
| Persona chatbot | **S2** 5-department persona chatbot | As-is |
| Insight cards | **S3** Category · BU insight cards | Strengthened by combining 4 external types |
| Persona matching | **S4 (merged)** | Merged with clustering |
| Clustering | **S4 (merged)** | Merged with persona matching |
| Look-alike expansion | (excluded) | Deferred to PoC v2 |
| Campaign ROI | **S5** Omnichannel campaign ROAS simulation | As-is |
| Regional competition map | (excluded) | Deferred to PoC v2 |
| Terms · Guardrails | **S8** Marketing consent · PII · minor guardrails | Added minor cosmetics guard |
| External signal fusion | **S6** External signal fusion | Expanded to 4 types |
| Anomaly detection | (excluded) | PoC v2 |
| Payment · Membership matrix | (excluded) | PoC v2 |
| Unified customer journey | **S7** Omnichannel member journey | Emphasizes behavior crossing BUs |
| Weather × Sales | **S6 integrated** | As a subset of external signals |

---

## 3. Per-Scenario Data Mix Details

### S1 — Natural-Language Semantic Search
| Data | Source | Use |
|---|---|---|
| First-party SKU | OpenSearch `idx_product` | BM25 + KNN |
| Member profile | OpenSearch `idx_customer` | KNN |
| First-party reviews | OpenSearch `idx_review` | BM25 + KNN |
| **Olive Young reviews** | External crawl → `idx_review` | KNN (social SOV) |
| **X / Instagram reviews** | External → `idx_social_trend` | KNN |
| KG 1-hop | Neptune | Customer × Product × Brand × BU |

### S2 — 5-Department Persona Chatbot
12 tools invoked autonomously (see S2 design spec). All scenarios' tools are unified-invoked through this chatbot.

### S3 — Category · BU Insight Cards
| Data | Source | Use |
|---|---|---|
| GMV (BU × Category × Month) | Snowflake / Neptune | line/bar chart |
| **Search trends** | Naver · Google Trends → `SocialSignal` | Dual axis |
| **Weather** | KMA → `WeatherSignal` | Dual axis |
| **Competitor new products** | Public appearances → `CompetitorSignal` | annotation |

### S4 — Persona Matching + Clustering
| Data | Source | Use |
|---|---|---|
| RFM features | Neptune | KMeans input |
| Category affinity | Neptune (Customer × Category frequency) | KMeans input |
| **Social personas** | Instagram · Olive Young review keywords → `SocialSignal` | LLM labeling reinforcement |

### S5 — Omnichannel Campaign ROAS
| Data | Source | Use |
|---|---|---|
| Past campaigns | Snowflake CAMPAIGN_MART | Bayesian prior |
| Channel sell-through | ChannelSellThrough | Per-channel response rate |
| **SNS responses** | X · Instagram ad clicks · responses → `SocialSignal` | Posterior adjustment |
| **Search trends** | Naver · Google → `SocialSignal` | Separate non-campaign effects |

### S6 — External Signal Fusion
| Data | Source | Use |
|---|---|---|
| First-party GMV | Snowflake / Neptune | y-axis |
| **Social trends** | `SocialSignal` | x-axis / lag analysis |
| **Weather** | `WeatherSignal` | x-axis (temp · precipitation) |
| **Economy** | `EconomicSignal` (FX · CPI) | x-axis |
| **Competitor** | `CompetitorSignal` | annotation / comparison |

### S7 — Omnichannel Member Journey
| Data | Source | Use |
|---|---|---|
| Owned mall SearchEvent / CartEvent / OrderTransaction | Neptune | Timeline |
| Touchpoint (SMS/KakaoTalk/SNS ad) | Neptune | Timeline |
| ChannelSellThrough (Mart/H&B/Convenience) | Neptune | Timeline |
| Coupon / ReviewRating | Neptune | Timeline |

### S8 — Guardrails
| Data | Source | Use |
|---|---|---|
| Bedrock Guardrails | AWS | Input · output guards |
| Member consent | Compliance · Membership.opted_in_marketing | Block send tools |
| Estimated minor | Customer.age_band | Block cosmetics campaigns |

---

## 4. Persona × Scenario Matrix

| Department | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
| **P1 Brand Marketer** | star | star |  |  | star |  |  |  |
| **P2 Insights** |  | star |  | star |  | star |  |  |
| **P3 D&A · MarTech** |  | star | star |  |  | star |  |  |
| **P4 CRM · LG Members** |  | star |  |  |  |  | star | star |
| **P5 MD · Channel Sales** | star | star |  |  | star |  |  |  |

---

## 5. Top-5 Demo Path (30 minutes)

```
[S1] Natural-language semantic search — 4 min
   "Women in 30s with sensitive scalp + organic shampoo in 20K KRW range + Olive Young rating 4.5+"
   → SKU(Elastine) + Member + first-party / Olive Young reviews simultaneously on cards

[S2] Persona chatbot — 5 min (switcher demo)
   "Top 5 channels where Perioe sales dropped this month and the cause?"
   → Answer in P5(MD) → switch to P1(Brand Marketer) → change in answer tone

[S3] Insight cards — 4 min
   "Beauty BU monthly GMV + search trends + weather combined card"
   → matplotlib PNG + LLM comments (per persona)

[S5] Campaign ROAS simulation — 4 min
   "Next week Su:m37 new product launch / VIP 50K / 100M KRW"
   → Bayesian channel mix + ROAS distribution

[S7] Omnichannel member journey — 3 min
   "Member cust_001234 90-day journey"
   → Owned mall → SNS → Olive Young → Mart → Repurchase single timeline
```

---

## 6. PoC Schedule (8 weeks)

| Week | Work | Scenarios |
|---|---|---|
| 1-2 | Data ingestion (first-party N=500~5K + synthetic 49.5K + 4 external types) | Infrastructure |
| 3-4 | S1 + S2 + S3 implementation | S1, S2, S3 |
| 5-6 | S5 + S7 + persona switcher | S5, S7, P1~P5 |
| 7 | S4 + S6 + S8 | S4, S6, S8 |
| 8 | Demo rehearsal | All |
