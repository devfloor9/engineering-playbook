---
title: Shinkong Mitsukoshi Luxury Retail PoC
description: Shinkong Mitsukoshi (新光三越) Taiwan luxury department store and duty-free — VIP membership, foreign tourists, and 700+ tenant brands unified through Ontology + Agentic AI
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - scope:nav
sidebar_label: Overview
---

> **"A department store innovation PoC that ties together VIP members, foreign members, luxury tenant brands, duty-free, and store data with external trend, FX, and tourism signals through Ontology + Agentic AI"**

VIP membership across 19 Shinkong Mitsukoshi stores, 700+ luxury tenant brands, foreign tourist behavior (Japan, Hong Kong, Southeast Asia), and duty-free data integrated into a single KG. Uses public information only.

---

## 🚀 Interactive Demo

> <strong><a href="/engineering-playbook/demo/mitsukoshi/" target="_blank" rel="noopener noreferrer">👉 Open demo page (new window)</a></strong>

Switch between 11 scenarios from the sidebar to experience the persona switcher, foreign tourist analysis, luxury SOV, and VIP concierge UIs hands-on.

---

## 1. PoC One-Line Summary

| Axis | Description |
|---|---|
| **Target audience** | 5 departments: Marketing, Customer Insights, Digital, VIP Membership, MD |
| **Subject** | VIP members, foreigners, 700+ tenant brands, duty-free, stores + 4 external signal types |
| **Method** | Ontology (KG with 25 classes) + Agentic AI (Bedrock + AgentCore) |
| **Demonstration** | Live execution of 11 scenarios + 5-department persona switcher |
| **Differentiation** | **Foreign duty-free recommendation + luxury SOV + VIP concierge** — 3 specialized capabilities |

---

## 2. Business Structure (Public Information)

| Axis | Description |
|---|---|
| Stores | 19 (Taipei Xinyi/A11/A8/A9/A4 + Taichung/Tainan/Kaohsiung/Taoyuan/Chiayi) |
| Tenant brands | 700+ (LV, Hermes, Chanel, Gucci, Dior, Prada, Tiffany, etc.) |
| Membership | skm-member (VIP/Black/Platinum/Gold/Standard) |
| Duty-free | Foreigner TaxRefund + duty-free shop operations |
| Key seasons | Anniversary Sale (週年慶, major fall sale), Chinese New Year (春節), SS/FW |

---

## 3. 5-Department Personas

| Code | Department | KPI |
|---|---|---|
| **P1** | Marketing & Campaigns | Anniversary Sale ROAS · Foreigner acquisition · New product launches |
| **P2** | Customer Insights | VIP LTV · Foreigner share · SOV |
| **P3** | Data & Digital | Model accuracy · Duty-free data quality · Mobile SLA |
| **P4** | VIP & Membership | Tier upgrades · Lounge utilization · Concierge NPS |
| **P5** | MD & Store Operations | Store and floor revenue · Tenant brand turnover · Counter occupancy |

---

## 4. 11 Scenarios (One-Line Summary)

| # | Scenario | Data Mix |
|---|---|---|
| **S1** | Natural-language semantic search | Tenant brand SKU + members + external reviews (Xiaohongshu, Dcard) |
| **S2** | 5-department persona chatbot | Autonomous invocation of all tools |
| **S3** | Category / BU insight cards | First-party GMV + FX + tourism + competitors |
| **S4** | Lifestyle persona matching + clustering | RFM + luxury affinity + social |
| **S5** | Omnichannel campaign ROAS simulator | Anniversary Sale, DM, SNS, influencer channel mix |
| **S6** | External signal fusion (4 types) | First-party GMV × 4 external signals (including tourism metrics) |
| **S7** | Omnichannel member journey | First-party online → store → duty-free → repeat visit |
| **S8** | Marketing consent / PII guardrails | Bedrock Guardrails + duty-free regulations |
| **S9-M** ⭐ | **Foreign tourist behavior analysis + duty-free recommendation** | Passport, nationality, FX, tourism |
| **S10-M** ⭐ | **Luxury brand SOV + counter occupancy** | 700+ tenant brands × stores × seasons |
| **S11-M** ⭐ | **VIP tier lounge concierge** | Black/Platinum/Gold recommendations and pre-sale |

---

## 5. AWS Stack (Common)

Same as LG H&H + multilingual (Traditional Chinese, Japanese, English), live FX added, ~550K edges (enriched tenant brand catalog).

---

## 6. Top-5 Demo Flow (30 minutes)

| Order | Scenario | Demo Highlight | Time |
|---|---|---|---|
| 1 | **S1** Semantic search | "Female in her 30s + LV/Chanel + Anniversary Sale 50% off" | 4 min |
| 2 | **S9-M** ⭐ Foreigner duty-free | "Japanese tourist in her 30s → duty-free recommendation + FX-aware" | 5 min |
| 3 | **S10-M** ⭐ Luxury SOV | "Hermes vs Chanel counter occupancy by store" | 4 min |
| 4 | **S11-M** ⭐ VIP concierge | "Pre-sale recommendation for a Black-tier member" | 5 min |
| 5 | **S2** Persona chatbot | "Anniversary Sale ROAS" P1 vs P5 comparison | 4 min |

Details: [99. Demo Storytelling](./99-demo-storytelling.md)

---

## 7. Deliverable Index

- [01. Personas](./01-personas.md) · [02. Ontology](./02-ontology.md) · [03. Scenarios](./03-scenarios.md) · [04. Data Sources](./04-data-sources.md) · [05. Architecture](./05-architecture.md)
- [06. Design Specs](./06-design-spec/S1-semantic-search.md) (11)
- [99. Demo Storytelling](./99-demo-storytelling.md)
