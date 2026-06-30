---
title: 5-Department Personas (Uni-President)
description: Integrated Marketing · CMI · D&A · OPENPOINT · Manufacturing & Logistics — five departments
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

| Code | Department | Mission | KPI | Primary Scenarios |
|---|---|---|---|---|
| **P1** | Integrated Marketing (cross-BU) | Drive OPENPOINT campaigns & cross-BU usage | Campaign ROAS / cross-BU share | S1·S2·S5·**S9-U** |
| **P2** | Consumer & Trend Insights | Persona · LTV · cross-BU analysis | LTV / personas / 7ELE↔Carrefour crossover rate | S2·S4·S6·**S9-U** |
| **P3** | D&A Platform | Cross-BU ETL · model quality | Model accuracy / drift / cross-BU ETL SLA | S2·S3·S6 |
| **P4** | Membership · OPENPOINT | Tier transitions · earning · redemption | Tier / activity / earning · redemption · NPS | S2·S7·S8 |
| **P5** | Manufacturing · Logistics · Stores | Uni-President SKU turnover · cold chain · store inventory | Sell-through / cold-chain SLA / inventory turnover | S2·**S10-U**·**S11-U** |

## Per-Persona Tone & Tools

- **P1**: "Campaign targeting +5pt OPENPOINT cross-BU usage rate this quarter" → bu_crossover · campaign_simulator
- **P2**: "Which Carrefour categories do 7ELE beverage loyalists migrate to?" → cluster_run · bu_crossover
- **P3**: "Cross-BU ETL SLA / Snowflake sync latency" → snowflake_query · neptune_query
- **P4**: "OPENPOINT tier-level earning · redemption matrix" → semantic_search · membership_matrix
- **P5**: "Uni-President Mai-Hsiang (麥香) beverages — 7ELE vs Carrefour sell-through" → sku_sellthrough · cold_chain_sla