---
title: S5. 옴니채널 캠페인 ROAS (AMWAY)
description: 자사몰·ABO 직판·카탈로그·SNS 채널 Bayesian 어트리뷰션
created: "2026-05-14"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S5. Campaign ROAS
---

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
1. Snowflake의 과거 채널·국가 데이터를 사용해 캠페인 모델의 사전 가정을 정합니다.
2. PyMC에서 마르코프 연쇄 몬테카를로(MCMC)로 1,000개 표본을 뽑아, 데이터를 반영한 뒤의 사후분포를 근사합니다.
3. 표본으로 얻은 모델 결과에서 채널 조합별 광고비 대비 매출(ROAS)의 분포를 추정합니다.
4. 마지막 접점, 선형, 시간 감쇠 방식으로 전환 기여도를 어떻게 배분했는지 보고합니다. 이 배분 방식과 모델의 불확실성은 구분합니다.

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