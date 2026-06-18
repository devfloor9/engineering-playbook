---
created: 2026-05-14
title: "S5. 옴니채널 캠페인 ROAS (AMWAY)"
sidebar_label: "S5. Campaign ROAS"
description: "자사몰·ABO 직판·카탈로그·SNS 채널 Bayesian 어트리뷰션"
last_update:
  date: 2026-05-14
reading_time: 2
---
# S5. 옴니채널 캠페인 ROAS 시뮬 (AMWAY)

## 1. URL · 페르소나
- `/campaign-roas` · P1 (ABO Field)

## 2. 채널 후보
- SMS · 이메일 · 카톡/Line · 인스타 광고 · 자사몰 배너 · ABO 직판 (Sponsor) · 카탈로그 · 인플루언서

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| 과거 캠페인 | Snowflake CAMPAIGN_MART |
| 채널 sell-through | OrderTransaction + ABODirectSale |
| **SNS 반응** | SocialSignal (인스타·Reddit·X) |
| **검색 트렌드** | 다국어 검색 트렌드 |

## 4. 처리 파이프라인
1. Snowflake에서 채널·국가 prior 추출
2. MCMC 1000 샘플 (PyMC) → posterior
3. 채널 믹스 ROAS 분포
4. 어트리뷰션 (Last-touch / Linear / Time-decay)

## 5. 출력 UI
- 추천 채널 믹스 (donut)
- ROAS 분포 (violin)
- 채널·국가별 한계 효율
- 트렌드·SNS 영향 분리 표시

## 6. 가드레일
- 동의 미수신 자동 제외
- 미성년 캠페인 자동 제외
- 직접판매 규제 위반 텍스트 차단

## 7. 데모 시나리오
1. 예산 1억 / Nutrilite 신상 / 골드 ABO 5만 → 추천 믹스
2. ABO 직판 비중 +20% → ROAS 변화 즉시
3. "트렌드 효과 vs 캠페인 효과" 분리