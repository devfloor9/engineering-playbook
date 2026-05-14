---
title: "S9-M. 외국인 관광객 행동 분석 + 면세 추천 (Mitsukoshi 특화)"
sidebar_label: "S9-M. Foreigner Tax Refund"
description: "여권·국적·환율·관광 결합 외국인 면세 추천 시스템"
---

# S9-M. 외국인 관광객 행동 분석 + 면세 추천

> **Mitsukoshi 차별 포인트** ⭐ — 백화점 매출의 큰 비중을 차지하는 외국인 관광객(특히 일본)을 국적·환율·관광 데이터로 분석.

## 1. URL · 페르소나
- `/foreigner` · P2 (인사이트), P1 (마케팅)

## 2. 사용자 스토리
> P2 — 일본인 30대 여성의 평균 객단가·선호 카테고리·재방문률을 한 화면에서.

> P1 — 환율 변동에 따라 어느 국적 관광객을 타겟할지 자동 추천.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Foreigner | Neptune (~500 real + 합성) |
| TaxRefundTransaction | Neptune (~80K) |
| 환율 | EconomicSignal (JPY/USD/HKD/SGD ↔ TWD) |
| 관광 | TourismSignal (대만 관광청) |
| 외국인 후기 | OpenSearch `idx_social_trend` (일본 트위터·홍콩 페북) |

## 4. 처리 파이프라인
```
1. Foreigner × TaxRefundTransaction × Brand 집계
2. 국적별 카테고리 선호 (히트맵)
3. 환율 변동 vs 국적별 매출 (상관)
4. 관광 입국 +자사 매출 시차 분석
5. 추천: 환율 ↑인 국가 → 캠페인 노출 +
```

## 5. 출력 UI
- 좌: 국적별 외국인 분포 도넛 (JP/HK/SG/MY/...)
- 중앙: 국적 × 카테고리 선호 히트맵
- 우: 환율 결합 추천 (JP 엔저 → 동남아 관광객 타겟)
- 하단: TaxRefund 활용률 + 면세 SKU TOP 10

## 6. 가드레일
- 여권 hash만 노출 (실명·번호 비공개)
- 면세 자격 검증
- 국적별 차별 표현 금지

## 7. 데모 시나리오
1. **일본 30대 여성** → 평균 객단가 NTD 25K · LV/Hermes 선호 · 환율 민감
2. **엔저 효과** → 일본인 면세 -25% (시차 7일), 동남아 +15% 자동 추천
3. **단발 외국인 → VIP 회원 전환 추천** (재방문 시 멤버십 가입 유도)
