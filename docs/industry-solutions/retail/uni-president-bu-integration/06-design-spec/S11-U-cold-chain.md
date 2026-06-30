---
title: S11-U. 콜드체인·물류 SLA + 매장 발주 (UPI 특화)
description: President Transnet 콜드체인 SLA + 외기온 + 매장 발주 최적화
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-U. Cold Chain
---

> **Uni-President 차별 포인트** ⭐ — 자체 물류 (President Transnet) 콜드체인은 우유·아이스크림·도시락 등 핵심 SKU의 품질 직결. 외기온 결합 + 매장 발주 최적화.

## 1. URL · 페르소나
- `/cold-chain` · P5 (제조·물류·점포)

## 2. 사용자 스토리
> P5 — 남부 폭염 35℃+ 시 우유·유제품 콜드체인 SLA 위반률 + 매장 발주 보정 권고.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| ColdChainSLA 로그 | TimeStream (~50K) |
| OwnSKU (콜드체인 대상) | Neptune |
| Store (7ELE/까르푸 매장) | Neptune |
| 외기온 | WeatherSignal |
| 매장 재고 | Inventory |

## 4. 처리 파이프라인
```
1. 일별 (출하 BU, 도착 매장) 콜드체인 SLA 집계
2. 외기온 조인 (中央氣象署)
3. 위반 (target_temp + 2.0℃ 초과) 카운트
4. 매장 재고 잔량 + 위반 영향 계산
5. 다음날 발주 보정 시뮬 (Sonnet)
```

## 5. 출력 UI
- 좌: 권역별 SLA 위반률 시계열 (북·중·남)
- 중앙: 외기온 vs 위반률 산점도
- 우: 매장별 SLA 영향 히트맵
- 하단: 다음날 발주 보정 시뮬 (재고·예상 주문·콜드체인 회복)

## 6. 가드레일
- 매장 단가·재고 외부 노출 차단
- 외부 기상 출처 표기

## 7. 데모 시나리오
1. **남부 폭염 35℃+** → 우유 콜드체인 위반률 28% (평소 8%)
2. **다음날 발주 보정** → 위반 매장 발주 -20%, 안정 매장 +10%
3. **주간 발주 시뮬** → 권역·SKU별 회복 비용