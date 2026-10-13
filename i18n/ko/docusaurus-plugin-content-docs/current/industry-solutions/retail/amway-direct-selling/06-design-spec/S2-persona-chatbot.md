---
title: S2. 5 부서 페르소나 챗봇 (AMWAY)
description: ABO Field/CMI/D&A/CX/Compliance 5 부서별 도구 자율 호출 챗봇
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 1. URL · 페르소나
- `/chat` · 모든 페르소나

## 2. 사용자 스토리
- P1 (ABO Field): "이번 분기 Diamond 진입한 ABO TOP 10과 Downline 활동"
- P5 (Compliance): "프로틴 캠페인 광고 검수 + 미성년 차단 카운트"

## 3. UI
- 좌 채팅 / 우 SSE 도구 호출 트레이스
- 페르소나 스위처 + 추천 질의 4종

## 4. 도구 12종

| 도구명 | 설명 |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank (다국어) |
| `neptune_query` | openCypher |
| `abo_tree_query` | ABO 트리 깊이 쿼리 (S9-A) |
| `subscription_lifecycle` | 구독 state·해지 시그너처 (S10-A) |
| `campaign_simulator` | Bayesian ROAS |
| `behavior_change_detect` | 통계 시그너처 |
| `social_trend_join` | 소셜 다국어 |
| `weather_join` | KMA·글로벌 기상 |
| `economic_join` | 환율·물가 (다국가) |
| `regulation_join` | 직접판매 규제 |
| `cluster_run` | KMeans + LLM 라벨 |
| `pii_mask` | PII 마스킹 |

## 5. 페르소나별 변형
| P | system prompt 키워드 | 주 도구 |
|---|---|---|
| P1 | ABO·Sponsor·Downline·PV/BV | abo_tree_query, campaign_simulator |
| P2 | 코호트·LTV·SOV | cluster_run, social_trend_join |
| P3 | 정확도·Drift | behavior_change_detect, neptune_query |
| P4 | 등급·NPS·구독 | subscription_lifecycle, semantic_search |
| P5 | 규제·동의·미성년 | regulation_join, pii_mask |

## 6. 가드레일
- 입력: 4 토픽 + 직접판매 + 미성년 + 건기식
- 출력: PII 마스킹, 규제 답변 시 출처 인용 의무
- 도구: 쓰기 도구는 P3·P5만

## 7. 데모 시나리오
1. (P1) "이번 분기 Diamond 진입 ABO TOP 10" → abo_tree_query + neptune_query
2. (P1→P4 스위처) 동일 질의 → 답변 톤 변경 (등급·NPS 관점)
3. (P5) "Nutrilite 광고 검수" → regulation_join + 위험 SKU 리스트