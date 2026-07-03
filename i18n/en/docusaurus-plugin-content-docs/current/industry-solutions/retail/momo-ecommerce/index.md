---
title: Momo eCommerce & Live Innovation PoC
description: Momo (富邦媒 / momo.com) — Taiwan's #1 eCommerce — Live commerce + 24-hour delivery + massive SKU catalog, unlocked with Ontology + Agentic AI
created: "2026-05-14"
last_update:
  date: "2026-07-02"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - scope:nav
sidebar_label: Overview
---

> **"An eCommerce innovation PoC that ties massive SKU, member, live-broadcast, campaign, and in-house logistics data together with external trend, weather, economic, and competitor signals — solved through Ontology + Agentic AI."**

Momo (富邦媒 / momo.com)'s millions of SKUs, TV home-shopping and live commerce, mobile app, and in-house logistics (24-hour delivery) consolidated into a single KG. Public information only.

---

## 🚀 Interactive Demo

> <strong><a href="/engineering-playbook/demo/momo/" target="_blank" rel="noopener noreferrer">👉 Open the demo page (new window)</a></strong>

Hands-on with 11 scenarios plus the core UIs for live-commerce attribution, delivery SLA, and recommendation diversity.

---

## 1. PoC One-Line Summary

| Axis | Content |
|---|---|
| **For whom** | 5 departments: Marketing · Category · Search/Recommendation · CS · Logistics |
| **What** | Massive SKU + Member + Live broadcast + In-house logistics + 4 external sources |
| **How** | Ontology (KG 25 classes) + Agentic AI |
| **Differentiator** | **Live commerce attribution + Delivery SLA monitoring + Recommendation diversity** |

---

## 2. Business Structure (Public Information)

| Axis | Content |
|---|---|
| Channels | Mobile app (#1 traffic in TW) · Web · TV home-shopping · Live broadcasts · Line/KakaoTalk |
| SKUs | Millions (long-tail strength) |
| Logistics | momo Fast (24-hour delivery), in-house fulfillment centers |
| Parent | Fubon Financial subsidiary |

---

## 3. Five-Department Personas

| Code | Department | KPI |
|---|---|---|
| **P1** | Marketing (App · Campaigns) | App ROAS · Live concurrent viewers and conversion |
| **P2** | Category · Trend | New-product trend SOV · Category LTV |
| **P3** | Search · Recommendation · MarTech | Recommendation accuracy · Diversity · Search latency |
| **P4** | Customer Service · CRM | NPS · Refund rate · Delivery satisfaction |
| **P5** | Logistics · MD | Delivery SLA · Per-region fulfillment load |

---

## 4. 11 Scenarios Summary

| # | Scenario | Data Mix |
|---|---|---|
| **S1** | Natural-language semantic search | SKU + Member + Live review + External |
| **S2** | 5-department persona chatbot | All tools autonomously invoked |
| **S3** | Category · BU insight cards | In-house GMV + Trend + Competitor |
| **S4** | Persona matching + Clustering | RFM + Live viewing + Social |
| **S5** | Omnichannel campaign ROAS simulator | Campaign · Live · App · Messenger |
| **S6** | External signal fusion | 4 sources (Social · Weather · Economy · Competitor) |
| **S7** | Omnichannel member journey | App → Live → TV → Re-purchase |
| **S8** | Marketing consent · PII guardrails | Bedrock Guardrails + Ad-copy review |
| **S9-Mo** ⭐ | **Live-commerce broadcast attribution** | Viewer → Cart → Purchase funnel |
| **S10-Mo** ⭐ | **In-house logistics delivery SLA + Order optimization** | 24-hour promise vs measured |
| **S11-Mo** ⭐ | **Mobile-app recommendation · Search diversity** | Diversity · New-product exposure · Long-tail |

---

## 5. AWS Stack (Common)

Same as LG H&H + live-stream attribution (Kinesis), delivery SLA (TimeStream), ~800K edges (massive SKU + live events).

---

## 6. Top-5 Demo (30 minutes)

| Order | Scenario | Time |
|---|---|---|
| 1 | **S1** Semantic search | 4 min |
| 2 | **S9-Mo** ⭐ Live commerce attribution | 5 min |
| 3 | **S10-Mo** ⭐ Delivery SLA + ordering | 4 min |
| 4 | **S11-Mo** ⭐ Recommendation diversity | 5 min |
| 5 | **S2** Persona chatbot | 4 min |

---

## 7. Deliverables

- [01. Personas](./01-personas.md) · [02. Ontology](./02-ontology.md) · [03. Scenarios](./03-scenarios.md) · [04. Data Sources](./04-data-sources.md) · [05. Architecture](./05-architecture.md)
- [06. Design Specs](./06-design-spec/S1-semantic-search.md) (11)
- [99. Demo Storytelling](./99-demo-storytelling.md)
