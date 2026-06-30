---
title: S2. 5 부서 페르소나 챗봇
description: 5 부서별 도구 자율 호출 챗봇 — Bedrock Sonnet + AgentCore Memory + 12 도구
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S2. Persona Chatbot
---

## 1. URL 경로
- `/chat`
- 좌측 채팅 / 우측 도구 호출 트레이스 (SSE)

## 2. 사용자 스토리
> P5 (MD) — "이번 달 페리오 매출 떨어진 채널 TOP5와 원인은?" — 채널·외부 시그널 자동 결합 답변.

> P1 (브랜드 마케터) — 같은 질문에 캠페인·세그먼트·다음 액션 중심.

## 3. 입력 UI
- 채팅 입력창 + 페르소나 스위처
- 추천 질의 4종 (페르소나별)
- 분석 모드 토글 (짧음/표준/심층)

## 4. 데이터 믹스
도구가 자율 호출 — 거의 모든 데이터 소스 접근 가능 (Snowflake·Neptune·OpenSearch·외부 4종).

## 5. 처리 파이프라인
```
1. 사용자 입력 → Bedrock Guardrails (4 토픽 + 동의 + 미성년)
2. Bedrock Sonnet 4.6 (페르소나 system prompt + 도구 정의)
3. tool_use → FastAPI 병렬 도구 호출
4. 도구 결과 → Sonnet 재호출 (multi-turn)
5. 최종 응답 → Guardrails (출력)
6. SSE 토큰 스트리밍
7. 트레이스 우측 표시
```

## 6. 사용 도구 12종

| 도구명 | 설명 |
|---|---|
| `semantic_search` | OpenSearch BM25+KNN+Rerank |
| `neptune_query` | openCypher 실행 |
| `snowflake_query` | (옵션) Snowflake DW |
| `campaign_simulator` | Bayesian ROAS |
| `behavior_change_detect` | 통계 시그너처 |
| `weather_join` | KMA 일별 조인 |
| `social_trend_join` | 네이버·구글·X·인스타·올영 |
| `competitor_join` | 경쟁사 신제품·이벤트 |
| `cluster_run` | KMeans + LLM 라벨링 |
| `sku_price_lookup` | 상품 가격·재고 |
| `attribution_calc` | 어트리뷰션 계산 |
| `channel_metrics_push` | 채널 KPI 캐시 |

## 7. 부서별 변형
| 페르소나 | system prompt 키워드 | 주 도구 |
|---|---|---|
| P1 브랜드 마케터 | 캠페인·ROAS·세그먼트 | campaign_simulator, attribution_calc |
| P2 인사이트 | 코호트·LTV·트렌드·페르소나 | cluster_run, social_trend_join, competitor_join |
| P3 D&A | 정확도·drift·시그너처 | behavior_change_detect, neptune_query |
| P4 CRM·LG 멤버스 | 등급·NPS·동의 | semantic_search (회원), weather_join |
| P5 MD·채널 영업 | GMV·재고·회전·채널 | channel_metrics_push, sku_price_lookup |

## 8. 가드레일
- 입력: 4 토픽 + 마케팅 동의 + 미성년 화장품
- 출력: PII 자동 마스킹, 동의 미수신 회원 발송 권유 차단
- 도구: `channel_metrics_push` 등 쓰기 도구는 P3·P5에만

## 9. 데모 시나리오
1. **(P5)** "이번 달 페리오 매출 떨어진 채널 TOP5와 원인은?" → channel_metrics_push, weather_join, social_trend_join 자동 호출
2. **(P5→P1 스위처)** 같은 질의 — 답변 톤·KPI·다음 액션 변경 (시연 하이라이트)
3. **(P2)** "최근 인스타에서 떠오른 키워드와 자사 매출 연결" → social_trend_join + neptune_query