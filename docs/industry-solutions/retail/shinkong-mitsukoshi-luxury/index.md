---
title: "Shinkong Mitsukoshi Luxury Retail PoC"
sidebar_label: "Overview"
description: "新光三越 대만 럭셔리 백화점·면세 — VIP 멤버십 + 외국인 관광객 + 입점 브랜드 700+를 Ontology + Agentic AI로"
---

# Shinkong Mitsukoshi Luxury Retail PoC

> **"VIP·외국인 회원·럭셔리 입점 브랜드·면세·매장 데이터를 외부 트렌드·환율·관광 시그널과 묶어 온톨로지 + Agentic AI로 풀어내는 백화점 혁신 PoC"**

新光三越 19개 점포의 VIP 멤버십, 입점 럭셔리 브랜드 700+, 외국인 관광객(일본·홍콩·동남아) 행동, 면세점 데이터를 단일 KG로 통합. 공개 정보만 활용.

---

## 🚀 인터랙티브 데모

> **[👉 데모 페이지 열기 (새 창)](/engineering-playbook/demo/mitsukoshi/)**

11 시나리오를 사이드바에서 전환하며 페르소나 스위처·외국인 관광객 분석·럭셔리 SOV·VIP 컨시어지 등 핵심 UI를 직접 체험.

---

## 1. PoC 한 줄 요약

| 축 | 내용 |
|---|---|
| **누구를 위해** | 마케팅·고객인사이트·디지털·VIP멤버십·MD 5 부서 |
| **무엇을** | VIP 회원·외국인·입점 700+ 브랜드·면세·매장 + 외부 4종 시그널 |
| **어떻게** | Ontology(KG 25 클래스) + Agentic AI(Bedrock + AgentCore) |
| **무엇으로 보여주나** | 11 시나리오 동작 시연 + 5 부서 페르소나 스위처 |
| **차별점** | **외국인 면세 추천 + 럭셔리 SOV + VIP 컨시어지** 3종 특화 |

---

## 2. 사업 구조 (공개 정보)

| 축 | 내용 |
|---|---|
| 점포 | 19개 (台北信義/A11/A8/A9/A4 + 台中/台南/高雄/桃園/嘉義) |
| 입점 브랜드 | 700+ (LV·Hermes·Chanel·Gucci·Dior·Prada·Tiffany 등) |
| 멤버십 | skm-member (VIP/Black/Platinum/Gold/일반) |
| 면세 | 외국인 TaxRefund + 면세점 운영 |
| 핵심 시즌 | 週年慶 (가을 대규모 세일), 春節, SS/FW |

---

## 3. 5 부서 페르소나

| 코드 | 부서 | KPI |
|---|---|---|
| **P1** | 마케팅·캠페인 | 週年慶 ROAS · 외국인 유치 · 신상 런칭 |
| **P2** | 고객 인사이트 | VIP LTV · 외국인 비중 · SOV |
| **P3** | 데이터·디지털 | 모델 정확도 · 면세 데이터 품질 · 모바일 SLA |
| **P4** | VIP·멤버십 | 등급 전환 · 라운지 활용 · 컨시어지 NPS |
| **P5** | MD·매장 운영 | 매장·층별 매출 · 입점 브랜드 회전 · 매대 점유 |

---

## 4. 11 시나리오 (한 줄 요약)

| # | 시나리오 | 데이터 믹스 |
|---|---|---|
| **S1** | 자연어 시맨틱 검색 | 입점 브랜드 SKU + 회원 + 외부 후기 (소홍서·Dcard) |
| **S2** | 5 부서 페르소나 챗봇 | 모든 도구 자율 호출 |
| **S3** | 카테고리·BU 인사이트 카드 | 자사 GMV + 환율 + 관광 + 경쟁사 |
| **S4** | 라이프스타일 페르소나 매칭 + 클러스터링 | RFM + 럭셔리 친화도 + 소셜 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 週年慶·DM·SNS·인플루언서 채널 믹스 |
| **S6** | 외부 시그널 융합 (4종) | 자사 GMV × 외부 4종 (관광지표 포함) |
| **S7** | 옴니채널 회원 여정 | 자사몰→매장→면세→재방문 |
| **S8** | 마케팅 동의·PII 가드레일 | Bedrock Guardrails + 면세 규정 |
| **S9-M** ⭐ | **외국인 관광객 행동 분석 + 면세 추천** | 여권·국적·환율·관광 |
| **S10-M** ⭐ | **럭셔리 브랜드 SOV + 매대 점유** | 입점 브랜드 700+ × 점포 × 시즌 |
| **S11-M** ⭐ | **VIP 등급 라운지 컨시어지** | Black/Platinum/Gold 추천·프리세일 |

---

## 5. AWS Stack (공통)

LG H&H 동일 + 다국어 (번체중·일본어·영어), 환율 라이브 추가, ~550K edges (입점 브랜드 카탈로그 풍부).

---

## 6. Top-5 시연 흐름 (30분)

| 순서 | 시나리오 | 시연 포인트 | 시간 |
|---|---|---|---|
| 1 | **S1** 시맨틱 검색 | "30대 여성 + LV·Chanel + 週年慶 50% 할인" | 4분 |
| 2 | **S9-M** ⭐ 외국인 면세 | "일본인 관광객 30대 → 면세 추천 + 환율 결합" | 5분 |
| 3 | **S10-M** ⭐ 럭셔리 SOV | "Hermes vs Chanel 점포별 매대 점유" | 4분 |
| 4 | **S11-M** ⭐ VIP 컨시어지 | "Black 등급 회원 프리세일 추천" | 5분 |
| 5 | **S2** 페르소나 챗봇 | "週年慶 ROAS" P1 vs P5 비교 | 4분 |

상세: [99. Demo Storytelling](./demo-storytelling)

---

## 7. 산출물 인덱스

- [01. Personas](./personas) · [02. Ontology](./ontology) · [03. Scenarios](./scenarios) · [04. Data Sources](./data-sources) · [05. Architecture](./architecture)
- [06. Design Specs](./06-design-spec/S1-semantic-search) (11)
- [99. Demo Storytelling](./demo-storytelling)
