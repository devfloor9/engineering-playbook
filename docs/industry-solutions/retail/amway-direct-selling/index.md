---
created: 2026-05-14
title: "AMWAY Direct Selling Innovation PoC"
sidebar_label: "Overview"
description: "AMWAY 글로벌 직접판매 — ABO/IBO 다단계 조직 + Nutrilite/Artistry/Home + 정기구독을 Ontology + Agentic AI로 풀어내는 PoC"
last_update:
  date: 2026-06-15
reading_time: 9
---
# AMWAY Direct Selling Innovation PoC

> **"ABO·고객·SKU·정기구독·캠페인 데이터를 외부 트렌드·환율·규제 시그널과 묶어 온톨로지 + Agentic AI로 풀어내는 글로벌 직접판매 혁신 PoC"**

전 세계 100여 국가의 ABO(Amway Business Owner) 다단계 조직과 Nutrilite·Artistry·Amway Home 등 자사 SKU, 정기구독(Subscription), 직접판매 컴플라이언스를 단일 KG로 통합해 의미적으로 연결하는 동작 시연 자료. 공개 정보만 활용.

---

## 🚀 인터랙티브 데모

> **[👉 데모 페이지 열기 (새 창)](/engineering-playbook/demo/amway/)**

11 시나리오를 사이드바에서 전환하며 ABO 조직 트리·페르소나 스위처·정기구독 분석·차트·KG 그래프 등 핵심 UI를 직접 체험할 수 있습니다.

---

## 1. PoC 한 줄 요약

| 축 | 내용 |
|---|---|
| **누구를 위해** | AMWAY 글로벌 마케팅·ABO Field·D&A·CX·Compliance 5 부서 |
| **무엇을** | ABO 조직(Upline ↔ Downline) + 자사 SKU + 정기구독 + 외부 4종 시그널 통합 |
| **어떻게** | Ontology(Neptune KG 25 클래스) + Agentic AI(Bedrock + AgentCore) |
| **무엇으로 보여주나** | 11 시나리오 동작 시연 + 5 부서 페르소나 스위처 |
| **차별점** | **ABO 다단계 트리 시각화 + 정기구독 라이프타임 + 직접판매 컴플라이언스** 3종 특화 시나리오 |

---

## 2. AMWAY 사업 구조 (공개 정보)

| 카테고리 | 주요 브랜드 |
|---|---|
| **영양·건강기능식품** | Nutrilite (멀티비타민·프로틴) · XS Energy |
| **뷰티** | Artistry · ARTISTRY SIGNATURE SELECT |
| **홈케어** | Amway Home · L.O.C. · SA8 |
| **개인용품** | G&H · Glister · Satinique |

채널: 자사몰(amway.com) · ABO 직접판매 · 카탈로그 · 모바일 앱

---

## 3. 5 부서 페르소나 (스위처)

| 코드 | 부서 | KPI |
|---|---|---|
| **P1** | ABO Field Marketing | ABO 모집·Upline ROI·정기구독 |
| **P2** | Consumer Insights | LTV · Retention · 페르소나 점유 |
| **P3** | Data & MarTech | 모델 정확도 · Drift · 다국어 SLA |
| **P4** | Customer Experience (CRM) | NPS · 활성 ABO · 정기구독 해지율 |
| **P5** | Compliance & Regulatory | 규제 준수 · 광고 가드 · 등급 검증 |

---

## 4. 11 시나리오 (한 줄 요약)

| # | 시나리오 | 데이터 믹스 |
|---|---|---|
| **S1** | 자연어 시맨틱 검색 | SKU·ABO·자사 리뷰 + 외부 SNS 후기 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 도구 자율 호출 |
| **S3** | 카테고리·BU 인사이트 카드 | 자사 GMV + 트렌드 + 환율 |
| **S4** | 라이프스타일 페르소나 매칭 + 클러스터링 | RFM + 카테고리 친화도 + 소셜 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·sell-through + 외부 반응 |
| **S6** | 외부 시그널 융합 (4종) | 자사 GMV × 외부 4종 |
| **S7** | 옴니채널 회원 여정 | 자사몰→ABO 직판→재구독 |
| **S8** | 마케팅 동의·PII·미성년 가드레일 | Bedrock Guardrails + 직접판매 규제 |
| **S9-A** ⭐ | **ABO 조직 시각화 + 성과 트래킹** | ABO Tree + PV/BV + 등급 |
| **S10-A** ⭐ | **정기구독(Subscription) 라이프타임 분석** | 구독 회전·해지·자동 재발송 |
| **S11-A** ⭐ | **방판법·미성년·건강기능식품 광고 컴플라이언스** | 직판 규제 + 광고 가드 |

---

## 5. AWS Stack (공통)

| 레이어 | 컴포넌트 |
|---|---|
| Edge / Auth | CloudFront + Lambda@Edge + Cognito (RS256 JWT) |
| Frontend | Next.js 14 (App Router) |
| Backend | FastAPI (Python 3.12) on ECS Fargate ARM64 |
| AI | Bedrock Sonnet 4.6 + Cohere embed-v4 / rerank-v3.5 |
| Agent | AgentCore (Memory + Code Interpreter) |
| Graph | Amazon Neptune (openCypher, ~700K edges — ABO 트리 깊이 반영) |
| Search | OpenSearch Serverless (다국어 분석기 + KNN + RRF) |
| Data | S3 + DynamoDB + Glue |
| 거버넌스 | Bedrock Guardrails (4 토픽 + 직접판매 규제 + 미성년 + 건강기능식품) |

---

## 6. Top-5 시연 흐름 (30분)

| 순서 | 시나리오 | 시연 포인트 | 시간 |
|---|---|---|---|
| 1 | **S1** 자연어 검색 | "비건 프로틴 + 30대 신규 ABO" | 4분 |
| 2 | **S9-A** ⭐ ABO 조직 시각화 | Diamond 등급 ABO의 Downline 5단계 트리 | 5분 |
| 3 | **S10-A** ⭐ 정기구독 라이프타임 | 6개월 후 해지 시그너처 + 자동 회복 캠페인 | 5분 |
| 4 | **S2** 페르소나 챗봇 | "Upline 재방문 추천" P1 vs P5 (Compliance) | 5분 |
| 5 | **S11-A** ⭐ 컴플라이언스 | 미성년 ABO 가입 시도 차단 시연 | 3분 |

상세: [99. Demo Storytelling](./demo-storytelling)

---

## 7. 산출물 인덱스

- [01. Personas](./personas) — 5 부서 페르소나
- [02. Ontology](./ontology) — KG 25 클래스 (ABO Tree·Subscription 강조)
- [03. Scenarios](./scenarios) — 11 시나리오 매핑
- [04. Data Sources](./data-sources) — 자사 + 외부 4종
- [05. Architecture](./architecture) — AWS 단일 아키텍처
- [06. Design Specs](./06-design-spec/S1-semantic-search) — 11 시나리오 명세
- [99. Demo Storytelling](./demo-storytelling) — 30분 시연 스크립트