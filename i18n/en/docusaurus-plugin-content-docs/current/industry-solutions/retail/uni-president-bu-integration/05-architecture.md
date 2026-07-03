---
title: AWS Single Architecture (Uni-President)
description: Bedrock + Neptune + OpenSearch + AgentCore + TimeStream (cold chain) + Glue (cross-BU ETL)
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - architecture
  - agent
  - scope:design
sidebar_label: 05. Architecture
---

> LG H&H skeleton + UPI-specific: **5-BU data integration via Glue ETL**, **TimeStream cold chain**, **Neptune ~900K edges** (BU diversity + OPENPOINT)

## 1. Architecture

```mermaid
graph TB
    subgraph Edge
        CF[CloudFront Taipei PoP]
        LE[Lambda@Edge]
        Cog[Cognito]
    end
    subgraph App
        Next[Next.js 14]
        FastAPI[FastAPI ECS Fargate ARM64]
    end
    subgraph AI
        Bedrock[Bedrock Sonnet 4.6]
        Cohere[Cohere multilingual]
        AC[AgentCore]
    end
    subgraph Data
        Neptune[(Neptune ~900K edges)]
        OS[OpenSearch]
        TS[TimeStream<br/>Cold-chain SLA]
    end
    subgraph BUSilos
        7ELE[7-Eleven OMS]
        Carr[Carrefour OMS]
        SB[Starbucks/Donut/KFC]
        UPF[Uni-President Food ERP]
        Trans[Transnet Cold Chain]
        OP[OPENPOINT DW]
    end
    subgraph External
        Soc[Dcard·Xiaohongshu·Instagram]
        Wea[Central Weather Admin - heatwave]
        Eco[DGBAS·Central Bank]
        Comp[FamilyMart·Hi-Life·RT-Mart]
    end

    Browser --> CF --> Next <--> FastAPI
    FastAPI --> Bedrock
    FastAPI --> Cohere --> AC
    FastAPI <--> Neptune
    FastAPI <--> OS
    FastAPI <--> TS
    BUSilos --> Glue --> Neptune
    External -->|EventBridge| Glue --> Neptune
```

## 2. UPI-Specific Components

| Component | Role |
|---|---|
| **Glue (cross-BU ETL)** | Daily integration of separate OMS · ERP systems across 5 BUs → Neptune (core of S9-U) |
| **TimeStream** | Cold-chain SLA time series (S11-U) |
| **OPENPOINT unified ID mapping** | Per-BU member ID → OPENPOINT unified ID mapping (Step Functions) |
| **Cohere multilingual** | Traditional Chinese · English |

## 3. Security · Governance

| Item | Implementation |
|---|---|
| Authentication | Cognito + Lambda@Edge |
| Authorization | Persona groups × BU allowlist (only P5 may write cold-chain) |
| PII | OPENPOINT unified ID hash masking |
| Guardrails | 4 topics + minors + PDPA + BU commercial-information segregation |

## 4. Cost (8-Week PoC)
| Item | Estimate |
|---|---|
| Bedrock + Cohere | $1.8K/month |
| Neptune (900K) + OpenSearch | $1.8K/month |
| TimeStream + Glue | $1K/month (5-BU ETL) |
| ECS + external APIs | $0.5K/month |
| **Total** | **~$5.1K/month** |