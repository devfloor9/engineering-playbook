---
title: AWS Single Architecture (Mitsukoshi)
description: Bedrock + Neptune + OpenSearch + AgentCore — multilingual + live FX
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - architecture
  - agent
  - scope:design
sidebar_label: 05. Architecture
---

> LG H&H skeleton + Mitsukoshi-specific: multilingual (Traditional Chinese, Japanese, English), FX and tourism EventBridge cron, ~550K edges

## 1. Architecture

```mermaid
graph TB
    subgraph Edge
        CF[CloudFront<br/>Tokyo/Taipei PoP]
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
        GR[Bedrock Guardrails]
    end
    subgraph Data
        Neptune[(Neptune<br/>~550K edges)]
        OS[OpenSearch<br/>Smartcn + Kuromoji]
    end
    subgraph External
        FX[Open Exchange Rates<br/>daily]
        Tour[Taiwan Tourism Bureau<br/>daily]
        Soc[Xiaohongshu / Dcard / Instagram]
    end

    Browser --> CF --> Next <--> FastAPI
    FastAPI --> Bedrock --> GR
    FastAPI --> Cohere --> AC
    FastAPI <--> Neptune
    FastAPI <--> OS
    External -->|EventBridge| Glue --> Neptune
```

## 2. Specialized Components

| Component | Role |
|---|---|
| **OpenSearch (Smartcn + Kuromoji)** | Traditional Chinese + Japanese morphological analysis + KNN |
| **Cohere multilingual** | Embedding and rerank for Traditional Chinese, Japanese, English |
| **EventBridge cron** | FX daily, tourism metrics daily |
| **CloudFront Taipei PoP** | Minimize latency for users in Taiwan and Japan |

## 3. Security & Governance

| Item | Implementation |
|---|---|
| Authentication | Cognito + Lambda@Edge JWT |
| Authorization | Persona groups + Boutique tenant brand permissions |
| PII | Masking (Foreigner passport hash) |
| Guardrails | 4 topics + duty-free regulations + advertising expressions |

## 4. Cost (8-week PoC)

| Item | Estimate |
|---|---|
| Bedrock + Cohere multilingual | $1.5K/month |
| Neptune + OpenSearch | $1.2K/month |
| ECS + external APIs | $0.5K/month |
| **Total** | **~$3.5K/month** |
