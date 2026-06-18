---
created: 2026-05-14
title: "Uni-President BU Integration PoC"
sidebar_label: "Overview"
description: "統一企業 — 7-Eleven Taiwan + 까르푸 + Starbucks + 식품 제조 BU 통합을 Ontology + Agentic AI로"
last_update:
  date: 2026-05-14
reading_time: 6
---
# Uni-President BU Integration PoC

> **"OPENPOINT 회원·식품 제조·7-Eleven·까르푸·Starbucks·물류 데이터를 외부 트렌드·기상·경제·경쟁사 시그널과 묶어 온톨로지 + Agentic AI로 풀어내는 BU 통합 혁신 PoC"**

統一企業의 자사 BU(統一食品 제조 + 7-Eleven Taiwan + 까르푸 + Starbucks + Mister Donut + KFC) 1,400만 OPENPOINT 회원이 BU·채널을 가로지르는 행동을 단일 KG로. 공개 정보만 활용.

---

## 🚀 인터랙티브 데모

> **[👉 데모 페이지 열기 (새 창)](/engineering-playbook/demo/upi/)**

11 시나리오 + BU 가로지르는 OPENPOINT 회원 여정·콜드체인 SLA·자사 SKU sell-through 등 핵심 UI 직접 체험.

---

## 1. PoC 한 줄 요약

| 축 | 내용 |
|---|---|
| **누구를 위해** | 통합 마케팅·CMI·D&A·OPENPOINT·제조물류 5 부서 |
| **무엇을** | OPENPOINT + 자사 SKU + 7ELE/까르푸/Starbucks 거래 + 콜드체인 + 외부 4종 |
| **차별점** | **BU 가로지르는 회원 여정 + 자사 SKU sell-through + 콜드체인 SLA** |

---

## 2. 사업 구조 (공개 정보)

| BU | 내용 |
|---|---|
| **統一食品 (제조)** | 統一麵·麥香 음료·乳製品 등 자사 제조 SKU |
| **7-Eleven Taiwan** | 6,800매장 (대만 1위 편의점) |
| **까르푸 Taiwan** ('23 인수) | 대형마트 + 미니마트 ~330점 |
| **Starbucks Taiwan** | 합작 운영 |
| **Mister Donut / KFC / 21Century** | 외식 BU |
| **President Transnet** | 자체 물류 (콜드체인) |
| **OPENPOINT** | 1,400만 회원 (BU 통합 멤버십) |

---

## 3. 5 부서 페르소나

| 코드 | 부서 | KPI |
|---|---|---|
| **P1** | 통합 마케팅 (BU 가로) | OPENPOINT 캠페인 ROAS · BU 교차 사용 |
| **P2** | 소비자·트렌드 인사이트 | LTV · 페르소나 · 7ELE↔까르푸 교차 |
| **P3** | D&A 플랫폼 | 모델 정확도 · BU 간 ETL SLA |
| **P4** | 멤버십·OPENPOINT | 등급 전환 · 적립·사용률 · NPS |
| **P5** | 제조·물류·점포 | 統一 SKU sell-through · 매장 재고 · 콜드체인 |

---

## 4. 11 시나리오 요약

| # | 시나리오 | 데이터 믹스 |
|---|---|---|
| **S1** | 자연어 시맨틱 검색 | 자사 SKU + 회원 + 외부 후기 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 도구 자율 호출 |
| **S3** | 카테고리·BU 인사이트 카드 | BU별 GMV + 외부 |
| **S4** | 페르소나 매칭 + 클러스터링 | RFM + 카테고리 + 소셜 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·OPENPOINT |
| **S6** | 외부 시그널 융합 | 4종 |
| **S7** | 옴니채널 회원 여정 | 7ELE→까르푸→Starbucks |
| **S8** | 가드레일 | PDPA 준수 + 미성년 |
| **S9-U** ⭐ | **BU 가로지르는 OPENPOINT 회원 여정** | 한 회원이 BU 가로 행동 |
| **S10-U** ⭐ | **자사 제조 SKU vs 자사 채널 sell-through** | 統一 SKU의 7ELE/까르푸 회전 |
| **S11-U** ⭐ | **콜드체인·물류 SLA + 매장 발주 최적화** | 콜드체인 vs 매장 재고 + 외기온 |

---

## 5. AWS Stack

LG H&H 동일 + BU 간 ETL Glue 강화, 콜드체인 TimeStream, ~900K edges (BU 다양성).

---

## 6. Top-5 시연 (30분)

| 순서 | 시나리오 | 시간 |
|---|---|---|
| 1 | **S1** 시맨틱 검색 | 4분 |
| 2 | **S9-U** ⭐ BU 가로지르는 OPENPOINT 여정 | 6분 (PoC 결정적 한 컷) |
| 3 | **S10-U** ⭐ 자사 SKU sell-through | 4분 |
| 4 | **S11-U** ⭐ 콜드체인 SLA | 4분 |
| 5 | **S2** 페르소나 챗봇 | 4분 |

---

## 7. 산출물

- [01. Personas](./personas) · [02. Ontology](./ontology) · [03. Scenarios](./scenarios) · [04. Data Sources](./data-sources) · [05. Architecture](./architecture)
- [06. Design Specs](./06-design-spec/S1-semantic-search) (11)
- [99. Demo Storytelling](./demo-storytelling)