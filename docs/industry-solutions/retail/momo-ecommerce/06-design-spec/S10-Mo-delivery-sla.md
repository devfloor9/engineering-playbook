---
title: S10-Mo. 자체 물류 배송 SLA + 발주 최적화 (Momo 특화)
description: 24시간 배송 약속 vs 실측 + 권역별 fulfillment center 부하 + 외기온 결합
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S10-Mo. Delivery SLA
---

> **Momo 차별 포인트** ⭐ — 자체 물류(momo Fast)의 24시간 배송 약속 위반률을 권역·시간대·외기온 결합 분석.

## 1. URL · 페르소나
- `/delivery-sla` · P5 (물류·MD)

## 2. 사용자 스토리
> P5 — 북부 fulfillment center 24시간 약속 위반률 + 폭우 영향 + 다음 날 발주 가이드를 한 화면에.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| DeliverySLA 로그 | TimeStream (~250K) |
| Fulfillment center | Neptune (Channel 노드) |
| 권역 (북·중·남) | DeliverySLA 속성 |
| 외부 기상 | WeatherSignal (中央氣象署) |
| 주문 폭증 (광棍節 등) | Campaign + OrderTransaction |

## 4. 처리 파이프라인
```
1. 일별 (권역, fulfillment_center) 24h SLA 위반률 계산
2. WeatherSignal 조인 (폭우·태풍)
3. 광棍節 등 캠페인 annotation
4. 다음날 발주 시뮬 (현 재고·예상 주문·SLA 회복 비용)
5. 권장: fulfillment 부하 + 외기온 결합 발주 가이드
```

## 5. 출력 UI
- 좌: 권역별 SLA 위반률 시계열
- 중앙: fulfillment center 부하 히트맵 (시간대 × 권역)
- 우: 외기온 vs SLA 위반 산점도
- 하단: 다음날 발주 시뮬 (재고·예상·권장)

## 6. 가드레일
- 영업 정보 (재고·물류 단가) 외부 노출 차단
- 외부 기상 출처 표기

## 7. 데모 시나리오
1. **북부 24시간 위반률 32%** → 폭우 -50mm 영향 (시차 1일)
2. **광棍節 다음날** → 일반 대비 위반 +25%, 발주 +30% 권장
3. **다음 7일 시뮬** → 권역별 SLA 회복 비용