---
title: AMWAY Direct Selling Innovation PoC
description: AMWAY Global Direct Selling — ABO/IBO multi-level organization + Nutrilite/Artistry/Home + recurring subscriptions delivered through an Ontology + Agentic AI PoC
created: "2026-05-14"
last_update:
  date: "2026-06-15"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - scope:nav
sidebar_label: Overview
---

> **"A global direct selling innovation PoC that unifies ABO, customer, SKU, subscription, and campaign data with external trend, FX, and regulatory signals through an Ontology + Agentic AI."**

A working demonstration that integrates the ABO (Amway Business Owner) multi-level organization across more than 100 countries, in-house SKUs (Nutrilite, Artistry, Amway Home), subscription programs, and direct-selling compliance into a single Knowledge Graph and connects them semantically. Built using public information only.

---

## 🚀 Interactive Demo

> **[👉 Open Demo Page (new window)](/engineering-playbook/demo/amway/)**

Switch between 11 scenarios in the sidebar to interact with the core UI: ABO organization tree, persona switcher, subscription analytics, charts, KG graph, and more.

---

## 1. One-line PoC Summary

| Axis | Content |
|---|---|
| **For Whom** | Five AMWAY global departments — Marketing, ABO Field, D&A, CX, Compliance |
| **What** | ABO organization (Upline ↔ Downline) + in-house SKUs + subscriptions + four external signals |
| **How** | Ontology (Neptune KG, 25 classes) + Agentic AI (Bedrock + AgentCore) |
| **Shown As** | Working demonstration of 11 scenarios + persona switcher across 5 departments |
| **Differentiator** | **Three specialized scenarios — ABO multi-level tree visualization + subscription lifetime + direct-selling compliance** |

---

## 2. AMWAY Business Structure (Public Information)

| Category | Key Brands |
|---|---|
| **Nutrition & Health Functional Foods** | Nutrilite (multivitamins, protein) · XS Energy |
| **Beauty** | Artistry · ARTISTRY SIGNATURE SELECT |
| **Home Care** | Amway Home · L.O.C. · SA8 |
| **Personal Care** | G&H · Glister · Satinique |

Channels: in-house e-commerce (amway.com) · ABO direct selling · catalog · mobile app

---

## 3. Persona Switcher Across 5 Departments

| Code | Department | KPI |
|---|---|---|
| **P1** | ABO Field Marketing | ABO recruitment · Upline ROI · subscriptions |
| **P2** | Consumer Insights | LTV · retention · persona share |
| **P3** | Data & MarTech | Model accuracy · drift · multilingual SLA |
| **P4** | Customer Experience (CRM) | NPS · active ABOs · subscription churn rate |
| **P5** | Compliance & Regulatory | Regulatory compliance · ad guards · level verification |

---

## 4. 11 Scenarios (One-line Summary)

| # | Scenario | Data Mix |
|---|---|---|
| **S1** | Natural-language semantic search | SKU · ABO · in-house reviews + external social posts |
| **S2** | Persona chatbot across 5 departments | Autonomous invocation of every tool |
| **S3** | Category & BU insight cards | In-house GMV + trends + FX |
| **S4** | Lifestyle persona matching + clustering | RFM + category affinity + social |
| **S5** | Omnichannel campaign ROAS simulation | Campaign & sell-through + external response |
| **S6** | External signal fusion (4 types) | In-house GMV × 4 external signals |
| **S7** | Omnichannel member journey | In-house store → ABO direct sale → re-subscription |
| **S8** | Marketing consent, PII, and minor guardrails | Bedrock Guardrails + direct-selling regulations |
| **S9-A** ⭐ | **ABO organization visualization + performance tracking** | ABO tree + PV/BV + level |
| **S10-A** ⭐ | **Subscription lifetime analysis** | Subscription rotation, churn, auto-redelivery |
| **S11-A** ⭐ | **Direct-selling law, minors, health functional food advertising compliance** | Direct-selling regulations + ad guards |

---

## 5. AWS Stack (Common)

| Layer | Component |
|---|---|
| Edge / Auth | CloudFront + Lambda@Edge + Cognito (RS256 JWT) |
| Frontend | Next.js 14 (App Router) |
| Backend | FastAPI (Python 3.12) on ECS Fargate ARM64 |
| AI | Bedrock Sonnet 4.6 + Cohere embed-v4 / rerank-v3.5 |
| Agent | AgentCore (Memory + Code Interpreter) |
| Graph | Amazon Neptune (openCypher, ~700K edges — reflecting ABO tree depth) |
| Search | OpenSearch Serverless (multilingual analyzers + KNN + RRF) |
| Data | S3 + DynamoDB + Glue |
| Governance | Bedrock Guardrails (4 topics + direct-selling regulations + minors + health functional foods) |

---

## 6. Top-5 Demo Flow (30 minutes)

| Order | Scenario | Demo Point | Time |
|---|---|---|---|
| 1 | **S1** Natural-language search | "Vegan protein + new ABO in their 30s" | 4 min |
| 2 | **S9-A** ⭐ ABO organization visualization | Five-level Downline tree for a Diamond-level ABO | 5 min |
| 3 | **S10-A** ⭐ Subscription lifetime | 6-month churn signature + automated win-back campaign | 5 min |
| 4 | **S2** Persona chatbot | "Upline revisit recommendation" P1 vs P5 (Compliance) | 5 min |
| 5 | **S11-A** ⭐ Compliance | Demonstration of blocking a minor's ABO sign-up attempt | 3 min |

Details: [99. Demo Storytelling](./demo-storytelling)

---

## 7. Deliverables Index

- [01. Personas](./personas) — 5-department personas
- [02. Ontology](./ontology) — 25 KG classes (emphasizing ABO Tree and Subscription)
- [03. Scenarios](./scenarios) — 11-scenario mapping
- [04. Data Sources](./data-sources) — In-house + 4 external sources
- [05. Architecture](./architecture) — Single AWS architecture
- [06. Design Specs](./06-design-spec/S1-semantic-search) — 11-scenario specifications
- [99. Demo Storytelling](./demo-storytelling) — 30-minute demo script
