---
title: Momo eCommerce & Live Innovation PoC
description: 富邦媒(momo.com) 대만 1위 이커머스 — 라이브 커머스 + 24시간 배송 + 방대 SKU를 Ontology + Agentic AI로
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - scope:nav
sidebar_label: Overview
---

> **"방대한 SKU·회원·라이브 방송·캠페인·자체 물류 데이터를 외부 트렌드·기상·경제·경쟁사 시그널과 묶어 온톨로지 + Agentic AI로 풀어내는 이커머스 혁신 PoC"**

momo.com의 수백만 SKU, TV 홈쇼핑·라이브커머스, 모바일 앱, 자체 물류(24시간 배송)를 단일 KG로 통합. 공개 정보만 활용.

---

## 🚀 인터랙티브 데모

> **[👉 데모 페이지 열기 (새 창)](/engineering-playbook/demo/momo/)**

11 시나리오 + 라이브 커머스 어트리뷰션·배송 SLA·추천 다양성 등 핵심 UI 직접 체험.

---

## 1. PoC 한 줄 요약

| 축 | 내용 |
|---|---|
| **누구를 위해** | 마케팅·카테고리·검색추천·CS·물류 5 부서 |
| **무엇을** | 방대 SKU + 회원 + 라이브 방송 + 자체 물류 + 외부 4종 |
| **어떻게** | Ontology(KG 25 클래스) + Agentic AI |
| **차별점** | **라이브 커머스 어트리뷰션 + 배송 SLA 모니터링 + 추천 다양성** |

---

## 2. 사업 구조 (공개 정보)

| 축 | 내용 |
|---|---|
| 채널 | 모바일 앱 (TW 1위 트래픽) · 웹 · TV 홈쇼핑 · 라이브 방송 · Line/카카오 |
| SKU | 수백만 (롱테일 강점) |
| 물류 | momo Fast (24시간 배송), 자체 fulfillment center |
| 모회사 | 富邦금융 자회사 |

---

## 3. 5 부서 페르소나

| 코드 | 부서 | KPI |
|---|---|---|
| **P1** | 마케팅 (앱·캠페인) | 앱 ROAS · 라이브 동시접속·전환 |
| **P2** | 카테고리·트렌드 | 신상 트렌드 SOV · 카테고리 LTV |
| **P3** | 검색·추천·MarTech | 추천 정확도 · 다양성 · search latency |
| **P4** | 고객 서비스·CRM | NPS · 환불률 · 배송 만족도 |
| **P5** | 물류·MD | 배송 SLA · 권역별 fulfillment 부하 |

---

## 4. 11 시나리오 요약

| # | 시나리오 | 데이터 믹스 |
|---|---|---|
| **S1** | 자연어 시맨틱 검색 | SKU + 회원 + 라이브 후기 + 외부 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 도구 자율 호출 |
| **S3** | 카테고리·BU 인사이트 카드 | 자사 GMV + 트렌드 + 경쟁사 |
| **S4** | 페르소나 매칭 + 클러스터링 | RFM + 라이브 시청 + 소셜 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·라이브·앱·메신저 |
| **S6** | 외부 시그널 융합 | 4종 (소셜·기상·경제·경쟁사) |
| **S7** | 옴니채널 회원 여정 | 앱→라이브→TV→재구매 |
| **S8** | 마케팅 동의·PII 가드레일 | Bedrock Guardrails + 광고 표현 |
| **S9-Mo** ⭐ | **라이브 커머스 방송 효과 어트리뷰션** | 시청자→장바구니→구매 funnel |
| **S10-Mo** ⭐ | **자체 물류 배송 SLA + 발주 최적화** | 24시간 약속 vs 실측 |
| **S11-Mo** ⭐ | **모바일 앱 추천·검색 다양성** | 다양성·신상 노출·롱테일 |

---

## 5. AWS Stack (공통)

LG H&H 동일 + 라이브 스트림 어트리뷰션 (Kinesis), 배송 SLA (TimeStream), ~800K edges (방대 SKU + 라이브 이벤트).

---

## 6. Top-5 시연 (30분)

| 순서 | 시나리오 | 시간 |
|---|---|---|
| 1 | **S1** 시맨틱 검색 | 4분 |
| 2 | **S9-Mo** ⭐ 라이브 커머스 어트리뷰션 | 5분 |
| 3 | **S10-Mo** ⭐ 배송 SLA + 발주 | 4분 |
| 4 | **S11-Mo** ⭐ 추천 다양성 | 5분 |
| 5 | **S2** 페르소나 챗봇 | 4분 |

---

## 7. 산출물

- [01. Personas](./01-personas.md) · [02. Ontology](./02-ontology.md) · [03. Scenarios](./03-scenarios.md) · [04. Data Sources](./04-data-sources.md) · [05. Architecture](./05-architecture.md)
- [06. Design Specs](./06-design-spec/S1-semantic-search.md) (11)
- [99. Demo Storytelling](./99-demo-storytelling.md)