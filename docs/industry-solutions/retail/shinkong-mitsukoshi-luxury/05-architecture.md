---
title: AWS 단일 아키텍처 (Mitsukoshi)
description: Bedrock + Neptune + OpenSearch + AgentCore — 다국어 + 환율 라이브
created: "2026-05-14"
last_update:
  date: "2026-06-30"
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

> LG H&H 골격 + Mitsukoshi 특화: 다국어 (번체중·일본어·영어), 환율·관광 EventBridge cron, ~550K edges

## 1. 아키텍처

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
        FX[Open Exchange Rates<br/>일 1회]
        Tour[대만 관광청<br/>일 1회]
        Soc[소홍서·Dcard·인스타]
    end

    Browser --> CF --> Next <--> FastAPI
    FastAPI --> Bedrock --> GR
    FastAPI --> Cohere --> AC
    FastAPI <--> Neptune
    FastAPI <--> OS
    External -->|EventBridge| Glue --> Neptune
```

## 2. 특화 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| **OpenSearch (Smartcn + Kuromoji)** | 번체중 + 일본어 형태소 + KNN |
| **Cohere multilingual** | 번체중·일본어·영어 임베딩·rerank |
| **EventBridge cron** | 환율 일 1회, 관광 지표 일 1회 |
| **CloudFront Taipei PoP** | 대만·일본 사용자 latency 최소 |

## 3. 보안·거버넌스

| 항목 | 구현 |
|---|---|
| 인증 | Cognito + Lambda@Edge JWT |
| 권한 | 페르소나 그룹 + Boutique 입점 브랜드 권한 |
| PII | 마스킹 (Foreigner 여권 hash) |
| 가드레일 | 4 토픽 + 면세 규정 + 광고 표현 |

## 4. 비용 (8주 PoC)

| 항목 | 추정 |
|---|---|
| Bedrock + Cohere multilingual | $1.5K/월 |
| Neptune + OpenSearch | $1.2K/월 |
| ECS + 외부 API | $0.5K/월 |
| **합계** | **~$3.5K/월** |