---
title: S2. 5 부서 페르소나 챗봇 (Uni-President)
description: 통합 마케팅·CMI·D&A·OPENPOINT·제조물류 5 부서별 도구 자율 호출
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 도구 12종

| 도구 | 설명 |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank |
| `neptune_query` | openCypher (BU 간 쿼리) |
| `bu_crossover` | BU 가로지르는 회원 (S9-U) |
| `sku_sellthrough` | 자사 SKU 채널 회전 (S10-U) |
| `cold_chain_sla` | 콜드체인 SLA + 외기온 (S11-U) |
| `campaign_simulator` | Bayesian ROAS |
| `social_trend_join` | Dcard·小紅書·인스타 |
| `weather_join` | 中央氣象署 |
| `economic_join` | DGBAS·央行 |
| `competitor_join` | FamilyMart·Hi-Life·RT-Mart |
| `cluster_run` | KMeans + LLM |
| `pii_mask` | PII |

## 페르소나별 변형
| P | 주 도구 |
|---|---|
| P1 | bu_crossover · campaign_simulator |
| P2 | cluster_run · bu_crossover |
| P3 | neptune_query · behavior_change_detect |
| P4 | semantic_search · membership_matrix |
| P5 | sku_sellthrough · cold_chain_sla · weather_join |

## 데모 시나리오
1. (P1) "BU 교차 사용 +5pt 캠페인" → bu_crossover
2. (P5) "麥香 음료 7ELE vs 까르푸 회전" → sku_sellthrough
3. (P1↔P5 스위처) 동일 질의 톤 변화