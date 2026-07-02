---
title: LG H&H Marketing Innovation PoC
description: LG생활건강 Beauty + HDB + Refreshment 3 BU 통합 마케팅 혁신 PoC — Ontology + Agentic AI 기반 8 시나리오 데모
created: "2026-05-14"
last_update:
  date: "2026-06-15"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - scope:nav
sidebar_label: Overview
---

> **"자사 회원·SKU·캠페인·옴니채널 거래 데이터를 외부 트렌드·기상·경제·경쟁사 시그널과 묶어 온톨로지 + Agentic AI로 풀어내는 마케팅 혁신 PoC"**

흩어진 데이터를 의미적으로 연결해 5 부서가 각자의 시각으로 활용하는 **동작 시연** 자료. 공개 정보만 활용해 LG생활건강 마케팅 혁신 본부의 데이터 사일로 문제를 푸는 청사진을 제시합니다.

---

## 🚀 인터랙티브 데모

> <strong><a href="/engineering-playbook/demo/lg-hnh/" target="_blank" rel="noopener noreferrer">👉 데모 페이지 열기 (새 창)</a></strong>

8 시나리오를 사이드바에서 전환하며 페르소나 스위처·차트·KG 그래프·SSE 챗봇 트레이스·Swimlane 타임라인 등 핵심 UI 패턴을 직접 체험할 수 있습니다.

---

## 1. PoC 한 줄 요약

| 축 | 내용 |
|---|---|
| **누구를 위해** | LG생활건강 마케팅 혁신 본부 (브랜드 마케터·인사이트·D&A·CRM·MD 5 부서) |
| **무엇을** | 3 BU(Beauty + HDB + Refreshment) 자사 데이터 + 외부 4종 시그널 통합 |
| **어떻게** | Ontology(Neptune KG 25 클래스) + Agentic AI(Bedrock Sonnet + AgentCore) |
| **무엇으로 보여주나** | 8 시나리오 동작 시연 + 5 부서 페르소나 스위처 |
| **차별점** | 컨셉이 아닌 **동작 시연** (실데이터 N=500~5K + 합성 50K + 외부 라이브) |

---

## 2. 3 BU 통합 (공개 정보 기준)

| BU | 주요 브랜드 | 핵심 채널 |
|---|---|---|
| **Beauty** | 후 / 숨37 / 오휘 / 빌리프 / CNP / VDL / 더페이스샵 | 면세점 · 백화점 · 자사몰 · 올리브영 · 쿠팡 |
| **HDB** | 엘라스틴 / 페리오 / 테크플러스 / 죽염 / 닥터그루트 / 자연퐁 / 샤프란 | 대형마트 · 자사몰 · 쿠팡 · 편의점 |
| **Refreshment** | 코카콜라 / 환타 / 스프라이트 / 미닛메이드 / 토레타 / 파워에이드 / 씨그램 / 갈배사이다 | 편의점 · 대형마트 · QSR · 자판기 |

> **3 BU 통합이 핵심 가치**: 단일 LG 멤버스 회원이 BU·채널을 가로질러 어떻게 움직이는지 단일 KG로 본다.

---

## 3. 5 부서 페르소나 (스위처)

| 코드 | 부서 | KPI |
|---|---|---|
| **P1** | 브랜드 마케터 | 캠페인 ROAS · 신제품 도입 성공률 |
| **P2** | 소비자·트렌드 인사이트 | LTV · 페르소나 점유 · SOV |
| **P3** | D&A·MarTech | 모델 정확도 · Drift · 파이프라인 SLA |
| **P4** | CRM·LG 멤버스 | 등급 전환 · 활성회원 · NPS |
| **P5** | MD·채널 영업 | 채널 GMV · 재고 회전 · 신상 도입 |

> 동일 데이터, 부서별 시각. 사이드바 정렬·카드 강조·챗봇 어조가 모두 변경.

---

## 4. 8 시나리오 (한 줄 요약)

| # | 시나리오 | 데이터 믹스 (자사 + 외부) |
|---|---|---|
| **S1** | 자연어 시맨틱 검색 | SKU·회원·자사 리뷰 + 올리브영·X 리뷰 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 도구 자율 호출 |
| **S3** | 카테고리·BU 인사이트 카드 | 자사 GMV + 검색 트렌드 + 기상 + 경쟁사 |
| **S4** | 라이프스타일 페르소나 매칭 + 클러스터링 | 회원 RFM + 카테고리 친화도 + 소셜 페르소나 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·sell-through + 검색·SNS 반응 |
| **S6** | 외부 시그널 융합 (트렌드·기상·경제·경쟁사) | 자사 GMV × 외부 4종 모두 |
| **S7** | 옴니채널 회원 여정 | 자사몰→SNS 광고→올영→마트→재구매 |
| **S8** | 마케팅 동의·PII·미성년 가드레일 | Bedrock Guardrails + 화장품 가드 |

상세 매핑: [03. Scenarios](./03-scenarios.md)

---

## 5. 외부 데이터 4종 (공개 정보 기반)

| 종류 | 예시 출처 |
|---|---|
| **소셜 트렌드** | 네이버·구글 트렌드 / X / 인스타그램 / 쇼츠·티스토리 / 올리브영 리뷰 |
| **기상·환경** | KMA 기상청 / 대기질 지수 |
| **경제·소비** | 통계청·한국은행 환율·물가·고용 |
| **경쟁사 시그널** | 공개 등장 아모레퍼시픽·아이모·유한킴벌리 신제품 동향 |

---

## 6. AWS Stack (단일 안)

| 레이어 | 컴포넌트 |
|---|---|
| **Edge / Auth** | CloudFront + Lambda@Edge + Cognito (RS256 JWT) |
| **Frontend** | Next.js 14 (App Router) |
| **Backend** | FastAPI (Python 3.12) on ECS Fargate ARM64 |
| **AI** | Bedrock Sonnet 4.6 + Cohere embed-v4 / rerank-v3.5 |
| **Agent** | AgentCore (Memory + Code Interpreter) |
| **Graph** | Amazon Neptune (openCypher, ~500K edges) |
| **Search** | OpenSearch Serverless (Nori + KNN + RRF) |
| **Data** | S3 + DynamoDB (세션) + Glue (외부 데이터 ETL) |
| **거버넌스** | Bedrock Guardrails (4 토픽 + 동의 + 미성년) |

상세: [05. Architecture](./05-architecture.md)

---

## 7. Top-5 시연 흐름 (30분)

| 순서 | 시나리오 | 시연 포인트 | 시간 |
|---|---|---|---|
| 1 | **S1 시맨틱 검색** | 한국어 자연어 → SKU + 회원 + 외부 리뷰 동시 | 4분 |
| 2 | **S2 페르소나 챗봇** | 5 부서 스위처로 답변 비교 | 5분 |
| 3 | **S3 인사이트 카드** | 외부 4종 결합 자동 보고서 | 4분 |
| 4 | **S5 캠페인 ROAS** | Bayesian 어트리뷰션 + 채널 믹스 | 4분 |
| 5 | **S7 회원 여정** | 옴니채널 단일 타임라인 | 3분 |

상세: [99. Demo Storytelling](./99-demo-storytelling.md)

---

## 8. 산출물 인덱스

- [01. Personas](./01-personas.md) — 5 부서 페르소나 정의
- [02. Ontology](./02-ontology.md) — KG 25 클래스 + Mermaid
- [03. Scenarios](./03-scenarios.md) — 8 시나리오 매핑 + 우선순위
- [04. Data Sources](./04-data-sources.md) — 자사 + 외부 4종 명세
- [05. Architecture](./05-architecture.md) — AWS 단일 아키텍처
- [06. Design Specs](./06-design-spec/S1-semantic-search.md) — 8 시나리오 디자인 명세
- [99. Demo Storytelling](./99-demo-storytelling.md) — 30분 시연 스크립트