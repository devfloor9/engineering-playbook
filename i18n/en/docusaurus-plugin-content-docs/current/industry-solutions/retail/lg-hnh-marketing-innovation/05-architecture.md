---
title: AWS Single Architecture
description: Bedrock + Neptune + OpenSearch + AgentCore + Cohere — a single architecture that delivers a working demo in 8 weeks
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 5
tags:
  - industry-solution
  - retail
  - lg-hnh
  - architecture
  - agent
  - scope:design
sidebar_label: 05. Architecture
---

> The first iteration's "3-option comparison" depended on a PPTX deck and was removed. This PoC uses a **single AWS-native stack** that delivers a working demo in 8 weeks.

---

## 1. Architecture Overview

```mermaid
graph TB
    subgraph User["User"]
        Browser[Browser / Mobile]
    end

    subgraph Edge["Edge / Auth"]
        CF[CloudFront]
        LE[Lambda@Edge]
        Cog[Cognito User Pool]
    end

    subgraph App["Frontend / Backend"]
        Next[Next.js 14 App Router]
        FastAPI[FastAPI Python 3.12<br/>ECS Fargate ARM64]
    end

    subgraph AI["AI / Agent"]
        Bedrock[Bedrock<br/>Sonnet 4.6]
        Cohere[Cohere<br/>embed-v4 / rerank-v3.5]
        AC[AgentCore<br/>Memory + Code Interpreter]
        GR[Bedrock Guardrails<br/>4 topics + consent + minor]
    end

    subgraph Data["Data Layer"]
        Neptune[(Amazon Neptune<br/>openCypher<br/>~500K edges)]
        OS[OpenSearch Serverless<br/>Nori + KNN + RRF]
        S3[(S3<br/>real / synth / external)]
        DDB[(DynamoDB<br/>Sessions·Cache)]
    end

    subgraph Ingest["Data Ingest"]
        Glue[AWS Glue<br/>External ETL]
        Lam[Lambda<br/>PII Masking]
        EB[EventBridge<br/>cron]
    end

    subgraph External["4 External Data Types"]
        Soc[Social<br/>Naver·Google·X·Instagram·Olive Young]
        Wea[Weather<br/>KMA·Air quality]
        Eco[Economy<br/>KOSIS·Bank of Korea]
        Comp[Competitor<br/>Amorepacific·Aimo·Yuhan-Kimberly]
    end

    Browser --> CF --> LE --> Cog
    CF --> Next
    Next <--> FastAPI
    FastAPI --> Bedrock
    FastAPI --> Cohere
    FastAPI --> AC
    Bedrock --> GR
    FastAPI <--> Neptune
    FastAPI <--> OS
    FastAPI <--> S3
    FastAPI <--> DDB

    External --> EB
    EB --> Glue
    Glue --> S3
    Lam --> S3
    S3 --> Neptune
    S3 --> OS
```

---

## 2. Components by Layer

### 2.1 Edge / Auth
| Component | Role |
|---|---|
| **CloudFront** | Static assets · SSR cache · WAF (Korean PoP) |
| **Lambda@Edge** | JWT verification · Persona header routing |
| **Cognito User Pool** | Authentication + department · persona group mapping |

### 2.2 Frontend
| Component | Role |
|---|---|
| **Next.js 14 (App Router)** | SSR + Client Components + persona switcher |
| **Cytoscape.js** | KG 1-hop visualization (S1, S7) |
| **Plotly / D3** | Charts · scatter · choropleth (S3, S5, S6) |

### 2.3 Backend
| Component | Role |
|---|---|
| **FastAPI (Python 3.12)** | API + SSE streaming |
| **ECS Fargate ARM64** | Container runtime (Graviton) |
| **OpenTelemetry** | Tracing → CloudWatch + Langfuse |

### 2.4 AI / Agent
| Component | Role | Scenarios |
|---|---|---|
| **Bedrock Sonnet 4.6** | Chatbot · Labeling · Comments | S2, S3, S4, S6 |
| **Cohere embed-v4** | Embedding (1024d) | S1, S4 |
| **Cohere rerank-v3.5** | Reranking | S1 |
| **AgentCore Memory** | short/long-term | S2 |
| **AgentCore Code Interpreter** | Firecracker microVM (matplotlib · sklearn · PyMC) | S3, S4, S5, S6 |
| **Bedrock Guardrails** | 4 topics + marketing consent + PII + minor cosmetics | S8 |

### 2.5 Data Layer
| Component | Role |
|---|---|
| **Amazon Neptune** | KG 25 classes, ~500K edges, openCypher |
| **OpenSearch Serverless** | 6 indexes (product/customer/review/campaign/social_trend/competitor) |
| **S3** | Raw · Synth · External data + embedding cache |
| **DynamoDB** | Sessions · personas · rate limit (TTL) |

### 2.6 Data Ingest
| Component | Role |
|---|---|
| **AWS Glue** | ETL for 4 external types (social · weather · economy · competitor) |
| **Lambda** | PII masking + Semantic Pipeline (S3 → Neptune · OpenSearch) |
| **EventBridge** | Daily/weekly/monthly external data collection cron |

---

## 3. Traffic Flow (S2 Chatbot Example)

```
1. Browser → CloudFront (HTTPS, WAF)
2. CloudFront → Lambda@Edge (JWT verification, x-persona header injection)
3. CloudFront → Next.js — /chat page SSR
4. Client → FastAPI /api/chat (SSE)
5. FastAPI → Bedrock Guardrails (input guard)
6. FastAPI → Bedrock Sonnet 4.6 (persona system prompt + tool definitions)
7. Sonnet tool_use → FastAPI tool invocations
   - semantic_search → OpenSearch
   - neptune_query → Neptune
   - trend_join → SocialSignal/WeatherSignal
   - campaign_simulator → AgentCore Code Interpreter
8. Tool results → Sonnet re-invocation (multi-turn)
9. Final response → Bedrock Guardrails (output guard)
10. SSE token streaming → Browser
11. Traces → CloudWatch + Langfuse
```

---

## 4. Security · Governance

| Item | Implementation |
|---|---|
| Authentication | Cognito (RS256 JWT) + Lambda@Edge verification |
| Authorization | Per-persona group tool · KG query whitelists |
| PII | Lambda masking at S3 ingestion |
| Guardrails | Bedrock Guardrails (input + output) |
| Audit | CloudTrail + CloudWatch Logs + Audit DynamoDB |
| Cohort isolation | All nodes/documents require `cohort_tag` |

---

## 5. Cost (8-Week PoC)

| Item | Estimate |
|---|---|
| Bedrock Sonnet 4.6 | 10K chatbot calls/month |
| Cohere embed/rerank | 50K/month |
| Neptune | r6g.large 1 node, 64 GB EBS |
| OpenSearch Serverless | 2 OCU |
| ECS Fargate ARM64 | 2 vCPU × 4 GB × 2 tasks |
| Glue ETL | Daily (4 external types) |
| S3 + DynamoDB + EventBridge | Light usage |
| **Monthly cost estimate** | **About $4K~$6K USD** |

---

## 6. 8-Week PoC Milestones

| Week | Work |
|---|---|
| 1-2 | VPC · Cognito · CloudFront · ECS infrastructure + Neptune 25-class ingest + 4-type external ETL |
| 3-4 | S1 · S2 · S3 (search · chatbot · insights) |
| 5-6 | S5 · S7 + persona switcher |
| 7 | S4 · S6 · S8 (personas · external signals · guardrails) |
| 8 | Demo rehearsal + backup |

---

## 7. Optional Extensions

| Option | Description |
|---|---|
| **Snowflake integration** | If first-party has Snowflake, use Glue for Snowflake → S3 sync |
| **Hybrid Nodes** | Combine on-prem GPUs with EKS Hybrid Nodes (self-hosted vLLM) |
| **Step Functions** | Nightly batch (KG refresh, synthetic data regeneration) |
| **Bifrost** | Bedrock + self-hosted LLM routing |
