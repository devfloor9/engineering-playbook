---
title: 5 부서 페르소나 (Mitsukoshi)
description: 新光三越 마케팅·인사이트·디지털·VIP·MD 5 부서 페르소나
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

| 코드 | 부서 | 미션 | KPI | 주 시나리오 |
|---|---|---|---|---|
| **P1** | 마케팅·캠페인 | 週年慶·신상·외국인 유치 | 캠페인 ROAS / 외국인 비중 | S1·S2·S5 |
| **P2** | 고객 인사이트 | VIP·외국인·트렌드 | VIP LTV / 외국인 점유 / SOV | S2·S4·S6·**S9-M** |
| **P3** | 데이터·디지털 | 모델 품질·면세 데이터 | 모델 정확도 / Drift | S3·S6 |
| **P4** | VIP·멤버십 | Black/Platinum/Gold 운영 | 등급 전환 / 라운지·컨시어지 NPS | S2·S7·S8·**S11-M** |
| **P5** | MD·매장 운영 | 점포·입점 브랜드 매대 | 매장·층별 GMV / 회전 | S2·**S10-M** |

---

## P1. 마케팅·캠페인
- 언어: 週年慶·DM·SNS·인플루언서·외국인 유치
- 챗봇: "週年慶 응답률을 점포별·국적별로 분해", "다음 SS 시즌 SNS 캠페인 ROAS 시뮬"
- 도구: campaign_simulator · attribution_calc · social_trend_join

## P2. 고객 인사이트
- 언어: VIP·외국인 코호트·SOV·트렌드 (소홍서·Dcard·인스타)
- 챗봇: "30대 일본인 여성 행동 패턴", "최근 소홍서에서 떠오른 럭셔리 키워드 + 자사 매출 연결"
- 도구: cluster_run · social_trend_join · foreigner_analysis

## P3. 데이터·디지털
- 언어: 정확도·Drift·면세 데이터 품질·모바일 SLA
- 챗봇: "지난 30일 추천 모델 CTR drift", "면세 거래 누락률"
- 도구: behavior_change_detect · neptune_query

## P4. VIP·멤버십
- 언어: Black/Platinum/Gold·라운지·컨시어지·프리세일·NPS
- 챗봇: "Black 등급 회원 컨시어지 만족도", "프리세일 우선권 활용률"
- 도구: vip_concierge · subscription_lifecycle

## P5. MD·매장 운영
- 언어: 점포·층·입점 브랜드·매대·회전·SOV
- 챗봇: "信義점 1F LV vs Hermes 매출 비교", "週年慶 매대 회전율 TOP 10"
- 도구: store_metrics_push · brand_sov

---

## UI 영향

| 요소 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| 사이드바 강조 | S1·S2·S5 | S4·S6·S9-M | S3·S6 | S7·S8·S11-M | S10-M |
| 카드 정렬 | 캠페인/ROAS | LTV/SOV | Drift | 등급/NPS | GMV/SOV |
| 챗봇 톤 | 마케터 | 분석가 | DS | 컨시어지 | MD/점장 |