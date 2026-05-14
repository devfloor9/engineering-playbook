---
title: "5 부서 페르소나 (Uni-President)"
sidebar_label: "01. Personas"
description: "통합 마케팅·CMI·D&A·OPENPOINT·제조물류 5 부서"
---

# 5 부서 페르소나 (Uni-President)

| 코드 | 부서 | 미션 | KPI | 주 시나리오 |
|---|---|---|---|---|
| **P1** | 통합 마케팅 (BU 가로) | OPENPOINT 캠페인·BU 교차 사용 유도 | 캠페인 ROAS / BU 교차 비중 | S1·S2·S5·**S9-U** |
| **P2** | 소비자·트렌드 인사이트 | 페르소나·LTV·BU 교차 분석 | LTV / 페르소나 / 7ELE↔까르푸 교차율 | S2·S4·S6·**S9-U** |
| **P3** | D&A 플랫폼 | BU 간 ETL·모델 품질 | 모델 정확도 / Drift / BU 간 ETL SLA | S2·S3·S6 |
| **P4** | 멤버십·OPENPOINT | 등급 전환·적립·사용률 | 등급 / 활성 / 적립·사용·NPS | S2·S7·S8 |
| **P5** | 제조·물류·점포 | 統一 SKU 회전·콜드체인·매장 재고 | sell-through / 콜드체인 SLA / 재고 회전 | S2·**S10-U**·**S11-U** |

## 페르소나별 톤·도구

- **P1**: "이번 분기 OPENPOINT 회원 BU 교차 사용률 +5pt 목표 캠페인" → bu_crossover · campaign_simulator
- **P2**: "7ELE 음료 충성층이 까르푸 어떤 카테고리로 옮겨가나" → cluster_run · bu_crossover
- **P3**: "BU 간 ETL SLA / Snowflake 동기 지연" → snowflake_query · neptune_query
- **P4**: "OPENPOINT 등급별 적립·사용 매트릭스" → semantic_search · membership_matrix
- **P5**: "統一 麥香 음료 7ELE/까르푸 sell-through 비교" → sku_sellthrough · cold_chain_sla
