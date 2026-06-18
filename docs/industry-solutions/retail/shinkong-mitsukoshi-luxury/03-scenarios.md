---
created: 2026-05-14
title: "11 시나리오 매핑 (Mitsukoshi)"
sidebar_label: "03. Scenarios"
description: "공통 8 + Mitsukoshi 특화 3 (외국인 면세·럭셔리 SOV·VIP 컨시어지)"
last_update:
  date: 2026-05-14
reading_time: 3
---
# 11 시나리오 매핑 (Mitsukoshi)

| # | 시나리오 | 자사 데이터 | 외부 데이터 | URL | 주 페르소나 |
|---|---|---|---|---|---|
| **S1** | 자연어 시맨틱 검색 | Product · 회원 · 자사 리뷰 | 소홍서·Dcard 후기 | `/semantic-search` | P1, P5 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 자사 | 4종 | `/chat` | All |
| **S3** | 카테고리·BU 인사이트 카드 | POSTransaction × Boutique | 환율·관광·경쟁사 | `/insights` | P3 |
| **S4** | 페르소나 매칭 + 클러스터링 | RFM + 럭셔리 친화도 | 소셜 페르소나 | `/personas` | P2 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 캠페인·Touchpoint | 검색·SNS | `/campaign-roas` | P1 |
| **S6** | 외부 시그널 융합 | 자사 GMV | 4종 (관광 포함) | `/signals` | P2, P3 |
| **S7** | 옴니채널 회원 여정 | 자사몰→매장→면세→재방문 | (없음) | `/journey` | P4 |
| **S8** | 마케팅 동의·PII 가드레일 | Compliance | (없음) | `/compliance` | P4 |
| **S9-M** ⭐ | **외국인 관광객 행동 분석 + 면세 추천** | Foreigner · TaxRefund | 환율 · 관광 | `/foreigner` | P2 |
| **S10-M** ⭐ | **럭셔리 브랜드 SOV + 매대 점유** | Boutique × Brand × Store | 경쟁사 | `/brand-sov` | P5 |
| **S11-M** ⭐ | **VIP 등급 라운지 컨시어지** | Black/Platinum/Gold + 컨시어지 이력 | (없음) | `/vip-concierge` | P4 |

---

## 페르소나 매트릭스

| 부서 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9-M | S10-M | S11-M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |  |
| P2 |  | ⭐ |  | ⭐ |  | ⭐ |  |  | ⭐ |  |  |
| P3 |  | ⭐ | ⭐ |  |  | ⭐ |  |  |  |  |  |
| P4 |  | ⭐ |  |  |  |  | ⭐ | ⭐ |  |  | ⭐ |
| P5 | ⭐ | ⭐ |  |  |  |  |  |  |  | ⭐ |  |

---

## Top-5 시연 패스 (30분)

```
[S1] 자연어 검색 4분
   "30대 여성 + LV·Chanel + 週年慶 50% 할인"
   → SKU + 회원 + 외부 후기

[S9-M] 외국인 면세 5분 ⭐
   "일본인 30대 여성 → 면세 추천 + 환율 결합"
   → Foreigner profile + 추천 브랜드 + 환율 변동

[S10-M] 럭셔리 SOV 4분 ⭐
   "信義점 1F LV vs Hermes 매대 점유"
   → 브랜드 GMV 비교 + 회전율

[S11-M] VIP 컨시어지 5분 ⭐
   "Black 등급 회원 프리세일 추천"
   → 회원 프로필 + 추천 브랜드 + 컨시어지 메시지

[S2] 페르소나 챗봇 4분
   "週年慶 ROAS" P1 vs P5 비교
```

---

## PoC 일정 (8주)
| 주차 | 작업 |
|---|---|
| 1-2 | 데이터 적재 (자사 + 49.5K 합성 + 외부) |
| 3-4 | S1·S2·S3 |
| 5 | S9-M + S11-M |
| 6 | S5·S7·S10-M |
| 7 | S4·S6·S8 |
| 8 | 시연 리허설 |