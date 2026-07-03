---
title: AWS 단일 아키텍처 (AMWAY)
description: Bedrock + Neptune + OpenSearch + AgentCore + Cohere — ABO Tree·구독·다국어 특화
created: "2026-05-14"
last_update:
  date: "2026-06-30"
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

> LG H&H와 동일 골격 + AMWAY 특화: ABO Tree (Neptune 깊이 쿼리), 정기구독 (state machine), 글로벌 다국어, 직접판매 규제 가드

---

## 1. 아키텍처 개요

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
        GR[Bedrock Guardrails<br/>+ 직접판매 규제]
    end
    subgraph Semantic
        SP[Semantic Pipeline<br/>Glue + Lambda]
        Neptune[(Neptune<br/>~700K edges<br/>ABO Tree 깊이 쿼리)]
        OS[OpenSearch Serverless<br/>다국어 + KNN + RRF]
        SubMgr[Subscription State Manager<br/>Step Functions]
    end
    subgraph External
        Reg[규제 (FTC·방판법·식약처)]
        Soc[소셜 (다국어)]
        Wea[기상]
        Eco[환율 (다국가)]
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

## 2. AMWAY 특화 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| **Neptune (700K edges)** | ABO Tree 깊이 5단 쿼리 (`*1..5` openCypher) — LG H&H 500K 대비 +40% |
| **Step Functions (Subscription State Manager)** | 구독 state machine: Active → Pause → Cancelled / Renewed |
| **Bedrock Guardrails (강화)** | 4 토픽 + 직접판매 규제 + 미성년 + 건강기능식품 광고 |
| **Cohere embed-v4 / rerank-v3.5** | 한·중·일·영·스페인어 동시 (글로벌 100여 국가, `cohere.rerank-v3-5:0`) |
| **OpenSearch 다국어 분석기** | Nori + Smartcn (중국어) + Kuromoji (일본어) + Standard |

---

## 3. 트래픽 흐름 (S9-A ABO 트리 시각화)

```
1. Browser → CloudFront → Lambda@Edge (JWT + persona 헤더)
2. CloudFront → Next.js → FastAPI /api/abo-tree?root=$rootId&depth=5
3. FastAPI → Neptune openCypher: MATCH (root)-[:HAS_DOWNLINE*1..5]->(d) ...
4. 결과 → cytoscape.js JSON
5. Browser 렌더링 + 인터랙션
```

---

## 4. 보안·거버넌스 (AMWAY 강화)

| 항목 | 구현 |
|---|---|
| 인증 | Cognito + Lambda@Edge JWT |
| 권한 | 페르소나 × 국가 화이트리스트 (P5 Compliance만 RegulatorySignal 쓰기) |
| PII | ABO 트리 시각화 시 마스킹 ID만 노출 |
| 가드레일 | 4 토픽 + 직접판매 + 미성년 + 건기식 + 다국가 광고 표현 검수 |
| 감사 | CloudTrail + Audit DynamoDB (Compliance 행동 일별 보고) |

---

## 5. 비용 (8주 PoC)

| 항목 | 추정 |
|---|---|
| Bedrock Sonnet | 챗봇 1.5만/월 (다국어 길어짐) |
| Cohere multilingual | 6만/월 |
| Neptune | r6g.large 1노드 (700K edges) |
| OpenSearch Serverless | 3 OCU |
| Step Functions | 구독 state 처리 |
| **월 추정** | **약 $5K~$7K USD** |

---

## 6. PoC 마일스톤 (8주)

| 주차 | 작업 |
|---|---|
| 1-2 | 인프라 + 데이터 적재 (자사 + 49.5K 합성 ABO Tree + 외부) |
| 3 | S1·S2·S3 |
| 4 | S9-A ABO Tree + S10-A 구독 |
| 5 | S5·S7 |
| 6 | S11-A 규제 + S8 가드레일 |
| 7 | S4·S6 |
| 8 | 시연 리허설 |