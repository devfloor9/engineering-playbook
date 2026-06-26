---
title: AWS 단일 아키텍처 (Momo)
description: Bedrock + Neptune + OpenSearch + Kinesis (라이브) + TimeStream (배송 SLA)
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: 05. Architecture
---

# AWS 단일 아키텍처 (Momo)

> LG H&H 골격 + Momo 특화: **Kinesis Data Streams** (라이브 방송 이벤트), **TimeStream** (배송 SLA 시계열), 다국어, ~800K edges.

## 1. 아키텍처

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
        Kinesis[Kinesis Data Streams<br/>라이브 이벤트]
        TS[TimeStream<br/>배송 SLA 시계열]
    end
    subgraph External
        Soc[Dcard·인스타·小紅書]
        Wea[中央氣象署 - 폭우/태풍]
        Eco[DGBAS]
        Comp[PChome·Yahoo·Shopee]
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

## 2. 특화 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| **Kinesis Data Streams** | 라이브 방송 시청·핀 이벤트 실시간 수집 (S9-Mo) |
| **TimeStream** | 배송 SLA 시계열 (S10-Mo) — fulfillment center별 latency |
| **OpenSearch + Smartcn** | 번체중 형태소 + KNN |
| **Cohere multilingual** | 다국어 임베딩 |

## 3. 비용 (8주 PoC)
| 항목 | 추정 |
|---|---|
| Bedrock + Cohere | $1.8K/월 |
| Neptune + OpenSearch | $1.5K/월 |
| Kinesis + TimeStream | $0.8K/월 (이벤트량 큼) |
| ECS + 외부 API | $0.5K/월 |
| **합계** | **~$4.6K/월** |