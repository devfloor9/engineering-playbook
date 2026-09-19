---
title: AWS Single Architecture (Momo)
description: Bedrock + Neptune + OpenSearch + Kinesis (Live) + TimeStream (Delivery SLA)
created: "2026-05-14"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - architecture
  - agent
  - scope:design
sidebar_label: 05. Architecture
---

> This design reuses the [LG H&H architecture](../lg-hnh-marketing-innovation/05-architecture.md): a Next.js frontend, FastAPI backend on ECS Fargate, AI-service integration, Neptune, and OpenSearch. Momo adds **Kinesis Data Streams** for live-broadcast events, **TimeStream** for delivery SLA time series, and multilingual support. The graph is sized at approximately **800K edges**.

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
        Neptune[(Neptune ~800K edges)]
        OS[OpenSearch]
        Kinesis[Kinesis Data Streams<br/>Live events]
        TS[TimeStream<br/>Delivery SLA time series]
    end
    subgraph External
        Soc[Dcard · Instagram · Xiaohongshu]
        Wea[Central Weather Administration — heavy rain/typhoon]
        Eco[DGBAS]
        Comp[PChome · Yahoo · Shopee]
    end

    Browser --> CF --> Next <--> FastAPI
    FastAPI --> Bedrock
    FastAPI --> Cohere --> AC
    FastAPI <--> Neptune
    FastAPI <--> OS
    FastAPI <--> TS
    LiveStreamEvents --> Kinesis --> Neptune
    External -->|EventBridge| Glue --> Neptune
```

## 2. Specialized Components

| Component | Role |
|---|---|
| **Kinesis Data Streams** | Real-time ingestion of live-broadcast viewing and pin events (S9-Mo) |
| **TimeStream** | Delivery SLA time series (S10-Mo) — per-fulfillment-center latency |
| **OpenSearch + Smartcn** | Traditional Chinese morphology + KNN |
| **Cohere multilingual** | Multilingual embeddings |

## 3. Cost (8-week PoC)
| Item | Estimate |
|---|---|
| Bedrock + Cohere | $1.8K/month |
| Neptune + OpenSearch | $1.5K/month |
| Kinesis + TimeStream | $0.8K/month (high event volume) |
| ECS + External APIs | $0.5K/month |
| **Total** | **~$4.6K/month** |
