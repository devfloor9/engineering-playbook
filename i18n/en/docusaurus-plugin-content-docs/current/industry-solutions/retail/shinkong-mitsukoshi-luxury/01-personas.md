---
title: 5-Department Personas (Mitsukoshi)
description: Shinkong Mitsukoshi 5-department personas — Marketing, Insights, Digital, VIP, MD
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

| Code | Department | Mission | KPI | Primary Scenarios |
|---|---|---|---|---|
| **P1** | Marketing & Campaigns | Anniversary Sale, new products, foreigner acquisition | Campaign ROAS / Foreigner share | S1, S2, S5 |
| **P2** | Customer Insights | VIP, foreigners, trends | VIP LTV / Foreigner share / SOV | S2, S4, S6, **S9-M** |
| **P3** | Data & Digital | Model quality, duty-free data | Model accuracy / Drift | S3, S6 |
| **P4** | VIP & Membership | Black/Platinum/Gold operations | Tier upgrades / Lounge & concierge NPS | S2, S7, S8, **S11-M** |
| **P5** | MD & Store Operations | Stores, tenant brand counters | Store and floor GMV / Turnover | S2, **S10-M** |

---

## P1. Marketing & Campaigns
- Vocabulary: Anniversary Sale (週年慶), DM, SNS, influencer, foreigner acquisition
- Chatbot: "Break down Anniversary Sale response rates by store and nationality", "Simulate SNS campaign ROAS for the next SS season"
- Tools: campaign_simulator · attribution_calc · social_trend_join

## P2. Customer Insights
- Vocabulary: VIP, foreigner cohorts, SOV, trends (Xiaohongshu, Dcard, Instagram)
- Chatbot: "Behavior patterns of Japanese women in their 30s", "Recent trending luxury keywords on Xiaohongshu joined with our revenue"
- Tools: cluster_run · social_trend_join · foreigner_analysis

## P3. Data & Digital
- Vocabulary: Accuracy, drift, duty-free data quality, mobile SLA
- Chatbot: "CTR drift of the recommendation model over the past 30 days", "Duty-free transaction omission rate"
- Tools: behavior_change_detect · neptune_query

## P4. VIP & Membership
- Vocabulary: Black/Platinum/Gold, lounge, concierge, pre-sale, NPS
- Chatbot: "Concierge satisfaction for Black-tier members", "Pre-sale priority utilization rate"
- Tools: vip_concierge · subscription_lifecycle

## P5. MD & Store Operations
- Vocabulary: Stores, floors, tenant brands, counters, turnover, SOV
- Chatbot: "Compare LV vs Hermes revenue on the 1F of Xinyi store", "Top 10 counter turnover during Anniversary Sale"
- Tools: store_metrics_push · brand_sov

---

## UI Impact

| Element | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Sidebar emphasis | S1, S2, S5 | S4, S6, S9-M | S3, S6 | S7, S8, S11-M | S10-M |
| Card sorting | Campaign / ROAS | LTV / SOV | Drift | Tier / NPS | GMV / SOV |
| Chatbot tone | Marketer | Analyst | DS | Concierge | MD / Store manager |
