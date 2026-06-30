---
title: 5-Department Personas
description: 5 personas — Brand Marketer / Insights / D&A · MarTech / CRM · LG Members / MD · Channel Sales
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - industry-solution
  - retail
  - lg-hnh
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

> Five departments use the same data through their own KPIs, languages, and decision units. The **department persona switcher** changes the sidebar order, card emphasis, and chatbot tone all at once.

---

## At a Glance

| Code | Department | Mission | Core KPIs | Primary Scenarios |
|---|---|---|---|---|
| **P1** | Brand Marketer | Own-brand campaign ROAS · New product launch | ROAS / CTR / New product adoption rate | S1 · S2 · S5 |
| **P2** | Consumer & Trend Insights | Persona · Trend · Competitor analysis | LTV / Persona share / SOV | S2 · S4 · S6 |
| **P3** | D&A · MarTech | Data · model quality · MarTech operations | Model accuracy / Drift / Pipeline SLA | S2 · S3 · S6 |
| **P4** | CRM · LG Members | Member tier · Journey · Loyalty | Tier conversion / Active members / NPS | S2 · S7 · S8 |
| **P5** | MD · Channel Sales | SKU · Channel sell-through · Inventory | Channel GMV / Inventory turn / New product adoption | S1 · S2 · S5 |

---

## P1. Brand Marketer

### Profile
- **Position**: Brand Marketing (by BU — Beauty: The History of Whoo · Su:m37 · OHUI / HDB: Elastine · Perioe / Refreshment: Coca-Cola · Fanta)
- **Language tone**: Campaign / ROAS / Conversion / Response rate / Retargeting / New product launch
- **Decision unit**: Weekly campaign operations, monthly budget reallocation, quarterly new product launches
- **Data perspective**: Channel × Campaign × Segment × Brand

### KPIs
| Metric | Definition |
|---|---|
| ROAS | Campaign revenue ÷ Campaign cost |
| CTR / Response rate | Actions vs. impressions/sends |
| New product adoption rate | 30-day post-launch sales target achievement |
| Revisit rate | 30/60/90 days |

### Chatbot Tone Examples
- "Break down this month's The History of Whoo new product launch campaign response rate by channel"
- "Predict SNS reaction for next week's Coca-Cola Zero campaign"

### Primary Scenarios
- **S1** Natural language search — "Women in their 30s, unpurchased for 90 days + organic preference" → instant targeting
- **S2** Chatbot — invokes `campaign_simulator`, `attribution_calc`
- **S5** Campaign ROAS — Bayesian channel mix

---

## P2. Consumer & Trend Insights

### Profile
- **Position**: Consumer & Market Insights / Trend Lab
- **Language tone**: Cohort / LTV / Persona / SOV / Trend / Churn
- **Decision unit**: Quarterly segment definitions, monthly trend reports
- **Data perspective**: Cohort × Behavior × External signals (social · trends · competitors)

### KPIs
| Metric | Definition |
|---|---|
| LTV | Cumulative purchase amount over 12/24 months |
| Churn rate | Ratio of members with no purchase in 90/180 days |
| Persona share | Distribution across lifestyle personas |
| SOV | Share of voice in SNS · search for a category/brand |

### Chatbot Tone Examples
- "Common patterns among members entering top 10% LTV in the last 3 months"
- "Newly emerging keywords in Olive Young reviews + connected first-party SKUs"

### Primary Scenarios
- **S4** Persona matching + clustering — Kids mom · Gold miss · Single household · Senior · Trendsetter
- **S6** External signal fusion — All 4 types combined

---

## P3. D&A · MarTech

### Profile
- **Position**: AI/ML / Data Platform / MarTech operations
- **Language tone**: Accuracy / Drift / Pipeline / RMSE / AUC
- **Decision unit**: Model deployment cycle, data quality SLA
- **Data perspective**: Model performance × Data quality × Pipeline health

### KPIs
| Metric | Definition |
|---|---|
| Model accuracy | Per recommendation/prediction/classification model |
| Data quality score | Missing · duplicate · outliers |
| Pipeline SLA | Daily/hourly processing success rate |
| Model drift | Input distribution change |

### Chatbot Tone Examples
- "Cohorts where recommendation-model CTR dropped in the last 30 days + drift"
- "Statistical detection of anomalous transaction signatures"

### Primary Scenarios
- **S3** Insight cards — Code Interpreter + matplotlib
- **S6** External signal fusion — correlation · lag analysis

---

## P4. CRM · LG Members

### Profile
- **Position**: Membership operations / Loyalty / CS
- **Language tone**: Tier / Points / Benefits / Retention / Consent / NPS
- **Decision unit**: Monthly tier-conversion campaigns, quarterly benefit revamps
- **Data perspective**: Tier × Payment × Channel × Time

### KPIs
| Metric | Definition |
|---|---|
| Tier conversion rate | Regular → Silver → Gold → VIP |
| Active members | Active members over 30/90 days |
| Point usage rate | Used vs. accrued |
| NPS | Membership satisfaction |

### Chatbot Tone Examples
- "Common patterns of members whose activity dropped 6 months after entering VIP"
- "Absolute send-block guard for non-consenting members"

### Primary Scenarios
- **S7** Omnichannel journey — Owned mall → SNS → Olive Young → Mart → Repurchase
- **S8** Guardrails — Bedrock Guardrails + consent + minor cosmetics

---

## P5. MD · Channel Sales

### Profile
- **Position**: Merchandising (MD) / Channel sales (owned mall · marts · H&B · convenience stores · QSR)
- **Language tone**: GMV / Inventory / Shelf / Order / Turn / Sell-through / PB / New product
- **Decision unit**: Weekly orders, monthly category reviews, quarterly channel evaluations
- **Data perspective**: Brand × Category × Channel × Time

### KPIs
| Metric | Definition |
|---|---|
| Channel GMV | Per-channel revenue |
| Inventory turn | Revenue ÷ average inventory |
| New product adoption rate | 30-day post-launch revenue |
| Channel share | Owned mall vs. Mart vs. H&B vs. Convenience store |

### Chatbot Tone Examples
- "Top 5 channels/stores where Perioe sales dropped last week and the causes"
- "Order guide for hot packs, hand creams, and cocoa when -5°C is forecast"

### Primary Scenarios
- **S5** Campaign ROAS — channel · store unit
- **S1** Natural language search — SKU turn · new product shelves

---

## How the Persona Switcher Affects the UI

| UI Element | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Sidebar emphasis | S1·S2·S5 | S4·S6 | S3·S6 | S7·S8 | S1·S5 |
| Insight card order | Campaign/ROAS | LTV/SOV | Drift/Quality | Tier/NPS | GMV/Inventory |
| Chatbot system prompt | Marketer | Analyst | Data scientist | Operations manager | MD/store manager |
| Recommended queries | "This week's campaign ROI?" | "High-value cohort?" | "Anomalous transactions?" | "VIP churn risk?" | "Channels where Perioe sales dropped?" |
| Guardrail strength | Marketing consent required | PII masking | Answer confidence | Consent · tier | Protect store sales info |

---

## Demo Usage Tips

1. **During S2 chatbot stage**, demonstrate the persona switcher — issue the same query "What caused Perioe's sales drop this month?" in P1·P3·P5 sequentially to emphasize differences in answer tone, KPIs, and tool calls
2. **S8 Guardrails** stage should be demoed in the P4 persona — consent · minor cosmetics guards activate automatically
3. **S7 Omnichannel journey** should be demoed in the P4 persona — a 90-day timeline of a single member, emphasizing member behavior crossing BUs
