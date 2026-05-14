---
title: "S5. 옴니채널 캠페인 ROAS (Momo)"
sidebar_label: "S5. Campaign ROAS"
description: "앱·라이브·TV·메신저 채널 Bayesian 어트리뷰션"
---

# S5. 옴니채널 캠페인 ROAS (Momo)

## 1. URL · 페르소나
- `/campaign-roas` · P1

## 2. 채널 후보
- 앱 푸시 · 카톡/Line · 라이브 방송 · TV 홈쇼핑 · SNS 광고 · 메신저 · 인플루언서

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| 과거 캠페인 | Snowflake 또는 자체 마트 |
| 채널 sell-through | OrderTransaction + LiveStreamPurchase + TVPurchase |
| 라이브 시청·전환 | LiveStream + Viewer + LiveStreamPurchase |
| SNS 반응 | SocialSignal |

## 4. 출력 UI
- 추천 채널 믹스 (donut)
- ROAS 분포 (violin)
- 라이브·TV·앱 비중 시뮬

## 5. 데모 시나리오
1. 예산 5억 NTD / 여름 신상 → 추천 믹스
2. 라이브 비중 +30% → ROAS 변화 즉시
3. 라이브 호스트별 효과 비교
