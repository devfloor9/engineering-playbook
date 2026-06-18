---
created: 2026-05-14
title: "S9-Mo. 라이브 커머스 방송 효과 어트리뷰션 (Momo 특화)"
sidebar_label: "S9-Mo. Live Attribution"
description: "라이브 시청자 → 장바구니 → 구매 funnel + 진행자별·SKU별 효과"
last_update:
  date: 2026-05-14
reading_time: 2
---
# S9-Mo. 라이브 커머스 방송 효과 어트리뷰션

> **Momo 차별 포인트** ⭐ — 라이브 방송 시청·핀·구매 이벤트를 Kinesis로 실시간 수집해 진행자·SKU·시간대별 어트리뷰션.

## 1. URL · 페르소나
- `/live-attribution` · P1 (마케팅)

## 2. 사용자 스토리
> P1 — 어제 19시 라이브 방송 1시간 — 시청자 5만, 장바구니 8천, 구매 3천 명, GMV 1.2억. 진행자별·SKU별·시간대별 효과 한 화면에.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| LiveStream 메타 | Neptune |
| LiveViewer 시청 이벤트 | Kinesis → Neptune |
| LiveStreamPurchase | Neptune (~50K) |
| Pin 이벤트 (진행자가 SKU 핀) | LiveStream 속성 (시간 시퀀스) |
| 외부 SNS 반응 | SocialSignal |

## 4. 처리 파이프라인
```
1. 라이브 방송 1건 선택
2. 시청자 → 장바구니 → 구매 funnel 계산
3. 진행자별 GMV·전환률 집계
4. SKU 핀 시점 ± 5분 내 구매 어트리뷰션
5. 시청 시간 vs 구매 확률 곡선 (생존 분석)
```

## 5. 출력 UI
- 좌: Funnel chart (시청 → 카트 → 구매)
- 중앙: 진행자별 GMV 막대 + 평점
- 우: SKU 핀 vs 구매 timeline (인터랙티브)
- 하단: 시청 시간 분포 + 구매 확률

## 6. 가드레일
- PII 마스킹 (시청자)
- 진행자 영업 정보 보호

## 7. 데모 시나리오
1. **어제 19시 라이브 방송** → 시청자 5만 → 카트 8천 → 구매 3,200 → GMV 1.2억
2. **진행자 A vs B** → 같은 SKU 핀, 전환률 12% vs 4%
3. **SKU 핀 직후 5분 GMV spike** → 어트리뷰션 자동 계산