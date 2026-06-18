---
created: 2026-05-14
title: "5 부서 페르소나 (Momo)"
sidebar_label: "01. Personas"
description: "마케팅·카테고리·검색추천·CS·물류 5 부서"
last_update:
  date: 2026-05-14
reading_time: 2
---
# 5 부서 페르소나 (Momo)

| 코드 | 부서 | 미션 | KPI | 주 시나리오 |
|---|---|---|---|---|
| **P1** | 마케팅 (앱·캠페인) | 앱 트래픽·캠페인 ROAS·라이브 유입 | 앱 ROAS / 라이브 동시접속·전환 | S1·S2·S5·**S9-Mo** |
| **P2** | 카테고리·트렌드 | 신상 트렌드·카테고리 매출 | 신상 SOV / 카테고리 LTV | S2·S4·S6 |
| **P3** | 검색·추천·MarTech | 추천 정확도·다양성·검색 latency | 모델 정확도 / 다양성 / latency | S2·S3·**S11-Mo** |
| **P4** | 고객 서비스·CRM | 환불·배송 불만·NPS | NPS / 환불률 / 배송 만족도 | S2·S7·S8 |
| **P5** | 물류·MD | 배송 SLA·발주·재고 | 배송 SLA / fulfillment 부하 | S2·**S10-Mo** |

## 페르소나 톤·도구
- P1: "라이브 동시접속 5만 대비 전환률" → live_attribution · campaign_simulator
- P2: "신상 #여름신상 SOV vs 자사" → social_trend_join · cluster_run
- P3: "추천 다양성 떨어진 카테고리" → recommendation_diversity · neptune_query
- P4: "환불률 spike한 SKU TOP 100" → behavior_change_detect · semantic_search
- P5: "북부 fulfillment center 24시간 약속 SLA" → delivery_sla · weather_join