---
title: "S5. 옴니채널 캠페인 ROAS (Mitsukoshi)"
sidebar_label: "S5. Campaign ROAS"
description: "週年慶 등 점포·DM·소셜 채널 Bayesian 어트리뷰션"
---

# S5. 옴니채널 캠페인 ROAS (Mitsukoshi)

## 1. URL · 페르소나
- `/campaign-roas` · P1

## 2. 채널 후보
- DM 카탈로그 · SMS · 카톡/Line · 소홍서 · 인스타 · 일본 트위터 · 점포 디스플레이 · 인플루언서

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| 과거 캠페인 (週年慶/SS/FW) | CAMPAIGN_MART |
| 채널 sell-through | OrderTransaction + POSTransaction |
| 검색·SNS 반응 | SocialSignal (다국어) |
| 외국인 유치 효과 | TourismSignal × TaxRefundTransaction |

## 4. UI
- 추천 채널 믹스 (donut)
- ROAS 분포 (violin)
- 점포·국적별 효과

## 5. 데모 시나리오
1. 週年慶 예산 5억 NTD → 추천 믹스
2. 외국인 유치 캠페인 시뮬 → 일본 트위터 비중 +30% 시 ROAS 변화
3. 점포·국적별 GMV 영향
