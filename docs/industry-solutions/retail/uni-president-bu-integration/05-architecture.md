---
title: AWS 단일 아키텍처 (Uni-President)
description: Bedrock + Neptune + OpenSearch + AgentCore + TimeStream (콜드체인) + Glue (BU 간 ETL)
created: "2026-05-14"
last_update:
  date: "2026-06-27"
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

> LG H&H 골격 + UPI 특화: **5 BU 데이터 통합 Glue ETL**, **TimeStream 콜드체인**, **Neptune ~900K edges** (BU 다양성 + OPENPOINT)

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
        Neptune[(Neptune ~900K edges)]
        OS[OpenSearch]
        TS[TimeStream<br/>콜드체인 SLA]
    end
    subgraph BUSilos
        7ELE[7-Eleven OMS]
        Carr[Carrefour OMS]
        SB[Starbucks/Donut/KFC]
        UPF[統一食품 ERP]
        Trans[Transnet 콜드체인]
        OP[OPENPOINT DW]
    end
    subgraph External
        Soc[Dcard·小紅書·인스타]
        Wea[中央氣象署 - 폭염]
        Eco[DGBAS·央行]
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

## 2. UPI 특화 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| **Glue (BU 간 ETL)** | 5 BU의 별도 OMS·ERP를 매일 통합 → Neptune (S9-U 핵심) |
| **TimeStream** | 콜드체인 SLA 시계열 (S11-U) |
| **OPENPOINT 통합 ID 매핑** | BU별 회원 ID → OPENPOINT 통합 ID 매핑 (Step Functions) |
| **Cohere multilingual** | 번체중·영어 |

## 3. 보안·거버넌스

| 항목 | 구현 |
|---|---|
| 인증 | Cognito + Lambda@Edge |
| 권한 | 페르소나 그룹 × BU 화이트리스트 (P5만 콜드체인 쓰기) |
| PII | OPENPOINT 통합 ID hash 마스킹 |
| 가드레일 | 4 토픽 + 미성년 + PDPA + BU 영업 정보 분리 |

## 4. 비용 (8주 PoC)
| 항목 | 추정 |
|---|---|
| Bedrock + Cohere | $1.8K/월 |
| Neptune (900K) + OpenSearch | $1.8K/월 |
| TimeStream + Glue | $1K/월 (BU 5종 ETL) |
| ECS + 외부 API | $0.5K/월 |
| **합계** | **~$5.1K/월** |