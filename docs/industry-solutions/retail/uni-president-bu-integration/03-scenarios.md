---
created: 2026-05-14
title: "11 시나리오 매핑 (Uni-President)"
sidebar_label: "03. Scenarios"
description: "공통 8 + UPI 특화 3 (BU 회원 여정·자사 SKU sell-through·콜드체인)"
last_update:
  date: 2026-05-14
reading_time: 2
---
# 11 시나리오 매핑 (Uni-President)

| # | 시나리오 | URL | 주 페르소나 |
|---|---|---|---|
| S1 | 자연어 시맨틱 검색 | `/semantic-search` | P1, P5 |
| S2 | 5 부서 페르소나 챗봇 | `/chat` | All |
| S3 | 카테고리·BU 인사이트 카드 | `/insights` | P3 |
| S4 | 페르소나 매칭 + 클러스터링 | `/personas` | P2 |
| S5 | 옴니채널 캠페인 ROAS 시뮬 | `/campaign-roas` | P1 |
| S6 | 외부 시그널 융합 | `/signals` | P2 |
| S7 | 옴니채널 회원 여정 | `/journey` | P4 |
| S8 | 가드레일 | `/compliance` | P4 |
| **S9-U** ⭐ | BU 가로지르는 OPENPOINT 회원 여정 | `/bu-journey` | P1, P2 |
| **S10-U** ⭐ | 자사 제조 SKU vs 자사 채널 sell-through | `/own-sku` | P5 |
| **S11-U** ⭐ | 콜드체인·물류 SLA + 매장 발주 | `/cold-chain` | P5 |

## 페르소나 매트릭스

| 부서 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-U | S10-U | S11-U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | ⭐ | ⭐ |  |  | ⭐ |  |  |  | ⭐ |  |  |
| P2 |  | ⭐ |  | ⭐ |  | ⭐ |  |  | ⭐ |  |  |
| P3 |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| P4 |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  |  |  |
| P5 | ⭐ | ⭐ |  |  |  |  |  |  |  | ⭐ | ⭐ |

## Top-5 시연 패스 (30분)

```
[S1] 시맨틱 검색 4분
   "여름 우롱차 PB SKU + 7ELE 매장"

[S9-U] BU 가로지르는 OPENPOINT 여정 6분 ⭐ (PoC 결정적 한 컷)
   "OPENPOINT 회원 한 명의 90일 — 7ELE→까르푸→Starbucks→Donut"
   → BU 가로지르는 행동의 단일 타임라인

[S10-U] 자사 SKU sell-through 4분 ⭐
   "統一 麥香 음료 7ELE vs 까르푸 회전 비교"

[S11-U] 콜드체인 SLA 4분 ⭐
   "남부 폭염 시 우유 SLA 위반률 + 발주 보정"

[S2] 페르소나 챗봇 4분
   "BU 교차 사용 유도 캠페인" P1 vs P5
```

## PoC 일정 (8주)
| 주차 | 작업 |
|---|---|
| 1-2 | 5 BU 데이터 적재 + OPENPOINT |
| 3-4 | S1·S2·S3 |
| 5 | S9-U (가장 도전적) |
| 6 | S10-U·S11-U |
| 7 | S5·S7·S8 |
| 8 | 시연 리허설 |