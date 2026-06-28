---
title: AWS 단일 아키텍처
description: Bedrock + Neptune + OpenSearch + AgentCore + Cohere — 8주 PoC 가능한 단일 안
created: "2026-05-14"
last_update:
  date: "2026-06-27"
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

# AWS 단일 아키텍처

> 1차 시도의 "3 옵션 비교"는 PPTX 의존이라 제거. 본 PoC는 **단일 안**으로 8주 안에 동작 시연 가능한 AWS Native 스택.

---

## 1. 아키텍처 개요

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
        GR[Bedrock Guardrails<br/>4 토픽 + 동의 + 미성년]
    end

    subgraph Data["Data Layer"]
        Neptune[(Amazon Neptune<br/>openCypher<br/>~500K edges)]
        OS[OpenSearch Serverless<br/>Nori + KNN + RRF]
        S3[(S3<br/>real / synth / external)]
        DDB[(DynamoDB<br/>세션·캐시)]
    end

    subgraph Ingest["Data Ingest"]
        Glue[AWS Glue<br/>외부 ETL]
        Lam[Lambda<br/>PII 마스킹]
        EB[EventBridge<br/>cron]
    end

    subgraph External["외부 데이터 4종"]
        Soc[소셜<br/>네이버·구글·X·인스타·올영]
        Wea[기상<br/>KMA·대기질]
        Eco[경제<br/>통계청·한국은행]
        Comp[경쟁사<br/>아모레·아이모·유한킴벌리]
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

## 2. 레이어별 컴포넌트

### 2.1 Edge / Auth
| 컴포넌트 | 역할 |
|---|---|
| **CloudFront** | 정적 자산·SSR 캐시·WAF (한국 PoP) |
| **Lambda@Edge** | JWT 검증·페르소나 헤더 라우팅 |
| **Cognito User Pool** | 인증 + 부서·페르소나 그룹 매핑 |

### 2.2 Frontend
| 컴포넌트 | 역할 |
|---|---|
| **Next.js 14 (App Router)** | SSR + Client Components + 페르소나 스위처 |
| **Cytoscape.js** | KG 1-hop 시각화 (S1, S7) |
| **Plotly / D3** | 차트·산점도·choropleth (S3, S5, S6) |

### 2.3 Backend
| 컴포넌트 | 역할 |
|---|---|
| **FastAPI (Python 3.12)** | API + SSE 스트리밍 |
| **ECS Fargate ARM64** | 컨테이너 런타임 (Graviton) |
| **OpenTelemetry** | 트레이싱 → CloudWatch + Langfuse |

### 2.4 AI / Agent
| 컴포넌트 | 역할 | 시나리오 |
|---|---|---|
| **Bedrock Sonnet 4.6** | 챗봇·라벨링·코멘트 | S2, S3, S4, S6 |
| **Cohere embed-v4** | 임베딩 (1024d) | S1, S4 |
| **Cohere rerank-v3.5** | 재순위화 | S1 |
| **AgentCore Memory** | short/long-term | S2 |
| **AgentCore Code Interpreter** | Firecracker microVM (matplotlib·sklearn·PyMC) | S3, S4, S5, S6 |
| **Bedrock Guardrails** | 4 토픽 + 마케팅 동의 + PII + 미성년 화장품 | S8 |

### 2.5 Data Layer
| 컴포넌트 | 역할 |
|---|---|
| **Amazon Neptune** | KG 25 클래스, ~500K edges, openCypher |
| **OpenSearch Serverless** | 6 인덱스 (product/customer/review/campaign/social_trend/competitor) |
| **S3** | Raw·Synth·External 데이터 + 임베딩 캐시 |
| **DynamoDB** | 세션·페르소나·rate limit (TTL 활용) |

### 2.6 Data Ingest
| 컴포넌트 | 역할 |
|---|---|
| **AWS Glue** | 외부 4종 데이터 ETL (소셜·기상·경제·경쟁사) |
| **Lambda** | PII 마스킹 + Semantic Pipeline (S3 → Neptune·OpenSearch) |
| **EventBridge** | 일/주/월별 외부 데이터 수집 cron |

---

## 3. 트래픽 흐름 (S2 챗봇 예시)

```
1. Browser → CloudFront (HTTPS, WAF)
2. CloudFront → Lambda@Edge (JWT 검증, x-persona 헤더 주입)
3. CloudFront → Next.js — /chat 페이지 SSR
4. Client → FastAPI /api/chat (SSE)
5. FastAPI → Bedrock Guardrails (입력 가드)
6. FastAPI → Bedrock Sonnet 4.6 (페르소나 system prompt + 도구 정의)
7. Sonnet tool_use → FastAPI 도구 호출
   - semantic_search → OpenSearch
   - neptune_query → Neptune
   - trend_join → SocialSignal/WeatherSignal
   - campaign_simulator → AgentCore Code Interpreter
8. 도구 결과 → Sonnet 재호출 (multi-turn)
9. 최종 응답 → Bedrock Guardrails (출력 가드)
10. SSE 토큰 스트리밍 → Browser
11. 트레이스 → CloudWatch + Langfuse
```

---

## 4. 보안·거버넌스

| 항목 | 구현 |
|---|---|
| 인증 | Cognito (RS256 JWT) + Lambda@Edge 검증 |
| 권한 | 페르소나 그룹별 도구·KG 쿼리 화이트리스트 |
| PII | S3 적재 시점 Lambda 마스킹 |
| 가드레일 | Bedrock Guardrails (입력+출력) |
| 감사 | CloudTrail + CloudWatch Logs + Audit DynamoDB |
| Cohort 격리 | 모든 노드/도큐먼트 `cohort_tag` 필수 |

---

## 5. 비용 (8주 PoC)

| 항목 | 추정 |
|---|---|
| Bedrock Sonnet 4.6 | 챗봇 1만 호출/월 |
| Cohere embed/rerank | 5만/월 |
| Neptune | r6g.large 1노드, 64GB EBS |
| OpenSearch Serverless | 2 OCU |
| ECS Fargate ARM64 | 2 vCPU × 4GB × 2 task |
| Glue ETL | 일 1회 (외부 4종) |
| S3 + DynamoDB + EventBridge | 소량 |
| **월 비용 추정** | **약 $4K~$6K USD** |

---

## 6. 8주 PoC 마일스톤

| 주차 | 작업 |
|---|---|
| 1-2 | VPC·Cognito·CloudFront·ECS 인프라 + Neptune 25 클래스 적재 + 외부 4종 ETL |
| 3-4 | S1·S2·S3 (검색·챗봇·인사이트) |
| 5-6 | S5·S7 + 페르소나 스위처 |
| 7 | S4·S6·S8 (페르소나·외부신호·가드레일) |
| 8 | 시연 리허설 + 백업 |

---

## 7. 옵션 확장

| 옵션 | 설명 |
|---|---|
| **Snowflake 연계** | 자사가 Snowflake 보유 시 Glue로 Snowflake → S3 | 동기 |
| **Hybrid Nodes** | EKS Hybrid Nodes로 온프렘 GPU 결합 (vLLM 자체 LLM) |
| **Step Functions** | 야간 배치 (KG 갱신, 합성 데이터 재생성) |
| **Bifrost** | Bedrock + 자체 LLM 라우팅 |