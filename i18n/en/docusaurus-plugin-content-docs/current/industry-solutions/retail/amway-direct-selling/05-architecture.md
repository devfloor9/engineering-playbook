---
title: Single AWS Architecture (AMWAY)
description: Bedrock + Neptune + OpenSearch + AgentCore + Cohere — specialized for ABO tree, subscriptions, multilingual operations
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - architecture
  - agent
  - scope:design
sidebar_label: 05. Architecture
---

> Same skeleton as LG H&H plus AMWAY specialization: ABO Tree (Neptune depth queries), recurring subscriptions (state machine), global multilingual support, and direct-selling regulatory guards.

---

## 1. Architecture Overview

```mermaid
graph TB
    subgraph Edge
        CF[CloudFront]
        LE[Lambda@Edge]
        Cog[Cognito]
    end
    subgraph App
        Next[Next.js 14]
        FastAPI[FastAPI<br/>ECS Fargate ARM64]
    end
    subgraph AI
        Bedrock[Bedrock Sonnet 4.6]
        Cohere[Cohere multilingual]
        AC[AgentCore]
        GR[Bedrock Guardrails<br/>+ direct-selling regulations]
    end
    subgraph Semantic
        SP[Semantic Pipeline<br/>Glue + Lambda]
        Neptune[(Neptune<br/>~700K edges<br/>ABO Tree depth queries)]
        OS[OpenSearch Serverless<br/>Multilingual + KNN + RRF]
        SubMgr[Subscription State Manager<br/>Step Functions]
    end
    subgraph External
        Reg[Regulation - FTC, Korea Door-to-Door Sales Act, MFDS]
        Soc[Social - multilingual]
        Wea[Weather]
        Eco[FX - multi-country]
    end

    Browser-->CF-->LE-->Cog
    CF-->Next<-->FastAPI
    FastAPI-->Bedrock-->GR
    FastAPI-->Cohere-->AC
    FastAPI<-->Neptune
    FastAPI<-->OS
    FastAPI<-->SubMgr
    External-->SP-->Neptune
    SP-->OS
```

---

## 2. AMWAY-specific Components

| Component | Role |
|---|---|
| **Neptune (700K edges)** | ABO tree 5-level depth queries (`*1..5` openCypher) — +40% vs. LG H&H's 500K |
| **Step Functions (Subscription State Manager)** | Subscription state machine: Active → Pause → Cancelled / Renewed |
| **Bedrock Guardrails (enhanced)** | 4 topics + direct-selling regulations + minors + health functional food ads |
| **Cohere embed-v4 / rerank-v3.5** | Korean · Chinese · Japanese · English · Spanish concurrently (more than 100 countries, `cohere.rerank-v3-5:0`) |
| **OpenSearch multilingual analyzers** | Nori + Smartcn (Chinese) + Kuromoji (Japanese) + Standard |

---

## 3. Traffic Flow (S9-A ABO Tree Visualization)

```
1. Browser → CloudFront → Lambda@Edge (JWT + persona header)
2. CloudFront → Next.js → FastAPI /api/abo-tree?root=$rootId&depth=5
3. FastAPI → Neptune openCypher: MATCH (root)-[:HAS_DOWNLINE*1..5]->(d) ...
4. Result → cytoscape.js JSON
5. Browser rendering + interaction
```

---

## 4. Security & Governance (AMWAY-enhanced)

| Item | Implementation |
|---|---|
| Authentication | Cognito + Lambda@Edge JWT |
| Authorization | Persona × country whitelist (only P5 Compliance can write RegulatorySignal) |
| PII | ABO tree visualization exposes only masked IDs |
| Guardrails | 4 topics + direct selling + minors + HFF + multi-country ad-language review |
| Audit | CloudTrail + Audit DynamoDB (Compliance daily activity report) |

---

## 5. Cost (8-week PoC)

| Item | Estimate |
|---|---|
| Bedrock Sonnet | Chatbot 15K/month (multilingual lengthens responses) |
| Cohere multilingual | 60K/month |
| Neptune | r6g.large 1 node (700K edges) |
| OpenSearch Serverless | 3 OCU |
| Step Functions | Subscription state processing |
| **Monthly estimate** | **Approximately $5K–$7K USD** |

---

## 6. PoC Milestones (8 weeks)

| Week | Work |
|---|---|
| 1–2 | Infrastructure + data ingestion (in-house + 49.5K synthetic ABO tree + external) |
| 3 | S1 · S2 · S3 |
| 4 | S9-A ABO Tree + S10-A subscription |
| 5 | S5 · S7 |
| 6 | S11-A regulatory + S8 guardrails |
| 7 | S4 · S6 |
| 8 | Demo rehearsal |
