---
created: 2026-05-14
title: "S3. 카테고리·BU 인사이트 카드 (Uni-President)"
sidebar_label: "S3. Insight Cards"
description: "5 BU GMV + 자사 SKU sell-through + 외부 4종 결합"
last_update:
  date: 2026-05-14
reading_time: 2
---
# S3. 카테고리·BU 인사이트 카드 (Uni-President)

## 카드 프리셋

| 카드 | 데이터 |
|---|---|
| 월별 BU GMV (5 BU 비교) | All Transactions × BU |
| **OPENPOINT 회원 BU 교차 사용률** | BUTransfer × Customer |
| **자사 統一 SKU 채널별 회전** | OwnSKU × CVS/Hyper × Volume |
| 폭염 vs 콜드체인 SLA | WeatherSignal × ColdChainSLA |
| 검색 트렌드 vs 자사 | SocialSignal + GMV |
| 경쟁사 (FamilyMart) 캠페인 영향 | CompetitorSignal annotation |

## 페르소나별 코멘트 차이

| P | BU GMV 코멘트 |
|---|---|
| P1 | "Starbucks 7월 +18% — 여름 캠페인 효과" |
| P2 | "OPENPOINT BU 교차 사용 +3pt — 7ELE↔까르푸 늘어남" |
| P3 | "BU 간 ETL SLA 99.2%, 30분 지연 1건" |
| P4 | "OPENPOINT 활성 회원 1,200만 (전월 +1.5%)" |
| P5 | "麥香 음료 7ELE 회전 +0.4 — 발주 +20% 권장" |

## 데모 시나리오
1. "월별 BU GMV" → 5 페르소나 코멘트
2. "BU 교차 사용률" → 7ELE↔까르푸 30%, ↔Starbucks 12%
3. "폭염 vs 콜드체인" → R² 0.72