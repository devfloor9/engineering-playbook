---
title: "11 시나리오 매핑 (AMWAY)"
sidebar_label: "03. Scenarios"
description: "공통 8 시나리오 (S1~S8) + AMWAY 특화 3 시나리오 (S9-A·S10-A·S11-A)"
---

# 11 시나리오 매핑 (AMWAY)

> 공통 8 시나리오 (S1~S8) + AMWAY 특화 3 시나리오 (S9-A·S10-A·S11-A) = 총 11개.
> 모든 시나리오에 자사 + 외부 4종(소셜·기상·경제·규제) 데이터 믹스 명시.

---

## 1. 11 시나리오 개요

| # | 시나리오 | 자사 데이터 | 외부 데이터 | URL | 주 페르소나 |
|---|---|---|---|---|---|
| **S1** | 자연어 시맨틱 검색 | SKU·ABO·자사 리뷰 | 소셜 후기 | `/semantic-search` | P1, P2 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 자사 | 모든 외부 4종 | `/chat` | All |
| **S3** | 카테고리·BU 인사이트 카드 | OrderTransaction·ABODirectSale | 트렌드·환율 | `/insights` | P3 |
| **S4** | 라이프스타일 페르소나 매칭 + 클러스터링 | RFM·카테고리 친화도 | 소셜 페르소나 | `/personas` | P2 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·Touchpoint | SNS·검색 반응 | `/campaign-roas` | P1 |
| **S6** | 외부 시그널 융합 | 자사 GMV (BU·국가) | 4종 모두 | `/signals` | P2, P3 |
| **S7** | 옴니채널 회원 여정 | 자사몰→ABO 직판→구독→재가입 | (없음) | `/journey` | P4 |
| **S8** | 마케팅 동의·PII 가드레일 | 동의·Compliance | (없음) | `/compliance` | P4, P5 |
| **S9-A** ⭐ | **ABO 조직 시각화 + 성과 트래킹** | ABO Tree·PV/BV·등급 | (없음) | `/abo-tree` | P1 |
| **S10-A** ⭐ | **정기구독 라이프타임 분석** | Subscription·Event 이력 | (없음) | `/subscription` | P4 |
| **S11-A** ⭐ | **방판법·미성년·건기식 광고 컴플라이언스** | Compliance·동의 | RegulatorySignal | `/regulatory` | P5 |

---

## 2. 페르소나 × 시나리오 매트릭스

| 부서 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-A | S10-A | S11-A |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1 ABO Field** | ⭐ | ⭐ |  |  | ⭐ |  |  |  | ⭐ |  |  |
| **P2 CMI** |  | ⭐ |  | ⭐ |  | ⭐ |  |  |  |  |  |
| **P3 D&A** |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| **P4 CX** |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  | ⭐ |  |
| **P5 Compliance** |  | ⭐ |  |  |  |  |  | ⭐ |  |  | ⭐ |

---

## 3. 시나리오별 데이터 믹스 (요약)

| # | 핵심 데이터 |
|---|---|
| S1 | OpenSearch (BM25 + KNN + RRF + Rerank) + Neptune 1-hop |
| S2 | 12 도구 자율 호출 (semantic_search · neptune_query · campaign_simulator · social_trend_join · weather_join · economic_join · regulation_join · abo_tree_query · subscription_lifecycle · cluster_run · attribution_calc · pii_mask) |
| S3 | Snowflake/Neptune 집계 + AgentCore Code Interpreter |
| S4 | KMeans 6 + LLM 라벨링 + 소셜 키워드 보강 |
| S5 | Bayesian (PyMC) + 채널·국가 prior |
| S6 | 시계열 + 상관 히트맵 + 시차 분석 |
| S7 | Swimlane 타임라인 (자사몰·ABO·구독·캠페인) |
| S8 | Bedrock Guardrails + 동의 매트릭스 |
| **S9-A** | Neptune ABO Tree DFS + cytoscape.js |
| **S10-A** | Subscription state machine + 해지 시그너처 + LSTM(옵션) |
| **S11-A** | RegulatorySignal × 광고 텍스트 검수 + 미성년 가드 |

---

## 4. Top-5 시연 패스 (30분)

```
[S1] 자연어 검색 4분
   "비건 프로틴 + 30대 신규 ABO + 인스타 +20%"
   → SKU(Nutrilite Plant Protein) + ABO + 외부 후기

[S9-A] ABO 조직 시각화 5분 ⭐ AMWAY 차별점
   "Diamond 등급 ABO의 5단 Downline 트리"
   → cytoscape 트리 + PV/BV·등급 색상

[S10-A] 정기구독 라이프타임 5분 ⭐
   "6개월 후 해지 시그너처 가진 ABO TOP 100 + 자동 회복 캠페인"
   → 구독 state · 해지 z-score · 추천

[S2] 페르소나 챗봇 5분 (스위처)
   "Upline ROI vs 정기구독 retention"
   → P1 (ABO Field) ↔ P4 (CX) 답변 비교

[S11-A] 컴플라이언스 3분 ⭐
   "미성년 ABO 가입 시도 차단" + "Nutrilite 광고 표현 검수"
   → 차단/마스킹 카운트 시각화
```

---

## 5. PoC 일정 (8주)

| 주차 | 작업 |
|---|---|
| 1-2 | 데이터 적재 (자사 N=1K ABO + 5K Customer + 50K 합성 + 외부 4종) |
| 3-4 | S1·S2·S3 |
| 5 | S9-A ABO 트리 + S10-A 정기구독 |
| 6 | S5·S7·S11-A 컴플라이언스 |
| 7 | S4·S6·S8 |
| 8 | 시연 리허설 + 백업 |
