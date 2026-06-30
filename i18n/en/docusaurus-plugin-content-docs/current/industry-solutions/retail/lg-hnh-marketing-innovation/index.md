---
title: LG H&H Marketing Innovation PoC
description: LG H&H Beauty + HDB + Refreshment 3-BU integrated marketing innovation PoC — Ontology + Agentic AI based 8-scenario demo
created: "2026-05-14"
last_update:
  date: "2026-06-15"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - scope:nav
sidebar_label: Overview
---

> **"A marketing innovation PoC that ties together first-party member, SKU, campaign, and omnichannel transaction data with external trend, weather, economic, and competitor signals via ontology + Agentic AI."**

A **working demonstration** that semantically connects scattered data so that 5 departments can use it from their own perspectives. Using only public information, it presents a blueprint for solving the data silo problem at LG H&H's Marketing Innovation Division.

---

## Interactive Demo

> **[Open Demo Page (new window)](/engineering-playbook/demo/lg-hnh/)**

Switch between the 8 scenarios in the sidebar to directly experience core UI patterns such as the persona switcher, charts, KG graphs, SSE chatbot traces, and Swimlane timelines.

---

## 1. PoC One-Line Summary

| Axis | Content |
|---|---|
| **For whom** | LG H&H Marketing Innovation Division (Brand Marketing, Insights, D&A, CRM, MD — 5 departments) |
| **What** | 3 BU (Beauty + HDB + Refreshment) first-party data + 4 types of external signals integrated |
| **How** | Ontology (Neptune KG, 25 classes) + Agentic AI (Bedrock Sonnet + AgentCore) |
| **How is it shown** | 8-scenario working demonstration + 5-department persona switcher |
| **Differentiator** | Not a concept but a **working demonstration** (real data N=500~5K + synthetic 50K + live external) |

---

## 2. 3 BU Integration (based on public information)

| BU | Key Brands | Core Channels |
|---|---|---|
| **Beauty** | The History of Whoo / Su:m37 / OHUI / belif / CNP / VDL / THE FACE SHOP | Duty-free · Department store · Owned mall · Olive Young · Coupang |
| **HDB** | Elastine / Perioe / Tech Plus / Bamboo Salt / Dr.Groot / Saffron / Safran | Hypermarkets · Owned mall · Coupang · Convenience stores |
| **Refreshment** | Coca-Cola / Fanta / Sprite / Minute Maid / Toreta / Powerade / Seagram / Galbae Cider | Convenience stores · Hypermarkets · QSR · Vending machines |

> **3-BU integration is the core value**: A single LG Members member is observed via one KG to see how they move across BUs and channels.

---

## 3. 5-Department Personas (Switcher)

| Code | Department | KPI |
|---|---|---|
| **P1** | Brand Marketer | Campaign ROAS · New product adoption rate |
| **P2** | Consumer & Trend Insights | LTV · Persona share · SOV |
| **P3** | D&A · MarTech | Model accuracy · Drift · Pipeline SLA |
| **P4** | CRM · LG Members | Tier conversion · Active members · NPS |
| **P5** | MD · Channel Sales | Channel GMV · Inventory turn · New product adoption |

> Same data, different perspectives. The sidebar ordering, card emphasis, and chatbot tone all change.

---

## 4. 8 Scenarios (One-Line Summary)

| # | Scenario | Data Mix (first-party + external) |
|---|---|---|
| **S1** | Natural-language semantic search | SKU · Member · First-party reviews + Olive Young · X reviews |
| **S2** | 5-department persona chatbot | Autonomous invocation of all tools |
| **S3** | Category · BU insight cards | First-party GMV + search trends + weather + competitors |
| **S4** | Lifestyle persona matching + clustering | Member RFM + category affinity + social personas |
| **S5** | Omnichannel campaign ROAS simulation | Campaign · sell-through + search · SNS responses |
| **S6** | External signal fusion (trend · weather · economy · competitor) | First-party GMV × all 4 external types |
| **S7** | Omnichannel member journey | Owned mall → SNS ads → Olive Young → Mart → Repurchase |
| **S8** | Marketing consent · PII · minor guardrails | Bedrock Guardrails + cosmetics guard |

Detailed mapping: [03. Scenarios](./scenarios)

---

## 5. 4 External Data Types (based on public information)

| Type | Example Sources |
|---|---|
| **Social trends** | Naver · Google Trends / X / Instagram / Shorts · Tistory / Olive Young reviews |
| **Weather · Environment** | KMA (Korea Meteorological Administration) / Air quality index |
| **Economy · Consumption** | KOSIS · Bank of Korea exchange rates · CPI · employment |
| **Competitor signals** | Public appearances of Amorepacific · Aimo · Yuhan-Kimberly new product trends |

---

## 6. AWS Stack (Single Plan)

| Layer | Component |
|---|---|
| **Edge / Auth** | CloudFront + Lambda@Edge + Cognito (RS256 JWT) |
| **Frontend** | Next.js 14 (App Router) |
| **Backend** | FastAPI (Python 3.12) on ECS Fargate ARM64 |
| **AI** | Bedrock Sonnet 4.6 + Cohere embed-v4 / rerank-v3.5 |
| **Agent** | AgentCore (Memory + Code Interpreter) |
| **Graph** | Amazon Neptune (openCypher, ~500K edges) |
| **Search** | OpenSearch Serverless (Nori + KNN + RRF) |
| **Data** | S3 + DynamoDB (sessions) + Glue (external data ETL) |
| **Governance** | Bedrock Guardrails (4 topics + consent + minor) |

Details: [05. Architecture](./architecture)

---

## 7. Top-5 Demo Flow (30 minutes)

| Order | Scenario | Demo Highlight | Time |
|---|---|---|---|
| 1 | **S1 Semantic Search** | Korean natural language → SKU + Member + external reviews simultaneously | 4 min |
| 2 | **S2 Persona Chatbot** | Compare answers across 5 departments via switcher | 5 min |
| 3 | **S3 Insight Cards** | Auto-report combining 4 external types | 4 min |
| 4 | **S5 Campaign ROAS** | Bayesian attribution + channel mix | 4 min |
| 5 | **S7 Member Journey** | Omnichannel single timeline | 3 min |

Details: [99. Demo Storytelling](./demo-storytelling)

---

## 8. Deliverables Index

- [01. Personas](./personas) — 5-department persona definitions
- [02. Ontology](./ontology) — KG 25 classes + Mermaid
- [03. Scenarios](./scenarios) — 8-scenario mapping + prioritization
- [04. Data Sources](./data-sources) — First-party + 4 external types specification
- [05. Architecture](./architecture) — AWS single architecture
- [06. Design Specs](./06-design-spec/S1-semantic-search) — Design specs for 8 scenarios
- [99. Demo Storytelling](./demo-storytelling) — 30-minute demo script
