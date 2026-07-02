---
title: Uni-President BU Integration PoC
description: Uni-President (統一企業) — 7-Eleven Taiwan + Carrefour + Starbucks + food manufacturing BU integration via Ontology + Agentic AI
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - scope:nav
sidebar_label: Overview
---

> **"BU integration innovation PoC that ties OPENPOINT members, food manufacturing, 7-Eleven, Carrefour, Starbucks, and logistics data together with external trend, weather, economic, and competitor signals — solved through ontology + Agentic AI."**

For Uni-President (統一企業), this PoC unifies its own BUs (Uni-President Food manufacturing + 7-Eleven Taiwan + Carrefour + Starbucks + Mister Donut + KFC) and the cross-BU, cross-channel behavior of 14M OPENPOINT members into a single Knowledge Graph. Uses publicly available information only.

---

## 🚀 Interactive Demo

> <strong><a href="/engineering-playbook/demo/upi/" target="_blank" rel="noopener noreferrer">👉 Open Demo Page (new window)</a></strong>

Experience the core UIs hands-on: 11 scenarios + cross-BU OPENPOINT member journey, cold-chain SLA, and own-SKU sell-through.

---

## 1. PoC One-Liner

| Axis | Content |
|---|---|
| **For Whom** | 5 departments — Integrated Marketing, CMI, D&A, OPENPOINT, Manufacturing & Logistics |
| **What** | OPENPOINT + own SKUs + 7ELE/Carrefour/Starbucks transactions + cold chain + 4 external sources |
| **Differentiator** | **Cross-BU member journey + own-SKU sell-through + cold-chain SLA** |

---

## 2. Business Structure (Public Information)

| BU | Content |
|---|---|
| **Uni-President Food (統一食品, manufacturing)** | Own-manufactured SKUs such as Uni-Noodle (統一麵), Mai-Hsiang (麥香) beverages, dairy |
| **7-Eleven Taiwan** | 6,800 stores (Taiwan's #1 convenience store) |
| **Carrefour Taiwan** (acquired in '23) | Hypermarkets + minimarts, ~330 stores |
| **Starbucks Taiwan** | Joint-venture operation |
| **Mister Donut / KFC / 21Century** | Foodservice BUs |
| **President Transnet** | Own logistics (cold chain) |
| **OPENPOINT** | 14M members (BU-integrated membership) |

---

## 3. 5-Department Personas

| Code | Department | KPI |
|---|---|---|
| **P1** | Integrated Marketing (cross-BU) | OPENPOINT campaign ROAS · cross-BU usage |
| **P2** | Consumer & Trend Insights | LTV · personas · 7ELE↔Carrefour crossover |
| **P3** | D&A Platform | Model accuracy · cross-BU ETL SLA |
| **P4** | Membership · OPENPOINT | Tier transitions · earning/redemption rates · NPS |
| **P5** | Manufacturing · Logistics · Stores | Uni-President SKU sell-through · store inventory · cold chain |

---

## 4. 11-Scenario Summary

| # | Scenario | Data Mix |
|---|---|---|
| **S1** | Natural-language semantic search | Own SKUs + members + external reviews |
| **S2** | 5-department persona chatbot | All tools invoked autonomously |
| **S3** | Category · BU insight cards | Per-BU GMV + external |
| **S4** | Persona matching + clustering | RFM + categories + social |
| **S5** | Omnichannel campaign ROAS simulation | Campaigns · OPENPOINT |
| **S6** | External signal fusion | 4 sources |
| **S7** | Omnichannel member journey | 7ELE→Carrefour→Starbucks |
| **S8** | Guardrails | PDPA compliance + minors |
| **S9-U** ⭐ | **Cross-BU OPENPOINT member journey** | One member's cross-BU behavior |
| **S10-U** ⭐ | **Own-manufactured SKU vs own-channel sell-through** | Uni-President SKU turnover at 7ELE/Carrefour |
| **S11-U** ⭐ | **Cold-chain · logistics SLA + store-order optimization** | Cold chain vs store inventory + outdoor temperature |

---

## 5. AWS Stack

Same as LG H&H + reinforced cross-BU ETL via Glue, TimeStream for cold chain, ~900K edges (BU diversity).

---

## 6. Top-5 Demo (30 min)

| Order | Scenario | Duration |
|---|---|---|
| 1 | **S1** Semantic search | 4 min |
| 2 | **S9-U** ⭐ Cross-BU OPENPOINT journey | 6 min (PoC decisive moment) |
| 3 | **S10-U** ⭐ Own-SKU sell-through | 4 min |
| 4 | **S11-U** ⭐ Cold-chain SLA | 4 min |
| 5 | **S2** Persona chatbot | 4 min |

---

## 7. Deliverables

- [01. Personas](./01-personas.md) · [02. Ontology](./02-ontology.md) · [03. Scenarios](./03-scenarios.md) · [04. Data Sources](./04-data-sources.md) · [05. Architecture](./05-architecture.md)
- [06. Design Specs](./06-design-spec/S1-semantic-search.md) (11)
- [99. Demo Storytelling](./99-demo-storytelling.md)