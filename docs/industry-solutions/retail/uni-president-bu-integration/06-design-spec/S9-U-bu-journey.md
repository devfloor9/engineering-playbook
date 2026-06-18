---
created: 2026-05-14
title: "S9-U. BU 가로지르는 OPENPOINT 회원 여정 (UPI 특화)"
sidebar_label: "S9-U. BU Crossover"
description: "한 OPENPOINT 회원이 7-Eleven → 까르푸 → Starbucks → Donut 가로지르는 단일 KG 행동 분석"
last_update:
  date: 2026-05-14
reading_time: 3
---
# S9-U. BU 가로지르는 OPENPOINT 회원 여정

> **Uni-President 차별 포인트** ⭐ (PoC 결정적 한 컷) — 한 OPENPOINT 회원이 5 BU(7ELE/까르푸/Starbucks/Donut/KFC)를 어떻게 가로지르는지 단일 KG로 시각화·분석.

## 1. URL · 페르소나
- `/bu-journey` · P1 (통합 마케팅), P2 (CMI)

## 2. 사용자 스토리
> P1 — 골드 OPENPOINT 회원 1,200만 명의 평균 BU 교차 사용률 + 평일/주말 패턴 + 시간대별 BU 이동.

> P2 — "7ELE 음료 충성층 → 까르푸로 이동하는 카테고리"의 통계적 패턴.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| OPENPOINTMembership | Neptune |
| CVSTransaction (7ELE) | Neptune (~300K) |
| HypermarketTransaction (까르푸) | Neptune (~80K) |
| CafeTransaction (Starbucks/Donut/KFC) | Neptune (~50K) |
| BUTransfer (BU 간 이동 로그) | Neptune (~20K) |

## 4. 처리 파이프라인
```
1. OPENPOINT 회원 cohort 선택
2. 일별 BU별 거래 매트릭스 생성
3. BU 교차 이벤트 (within 24h / 1week) 카운트
4. BU pair별 transfer flow 계산
5. 시각화: Sankey (BU 흐름) + Heatmap (BU pair 매트릭스) + 개별 회원 타임라인
```

## 5. 출력 UI
- 좌: BU 교차 Sankey (7ELE → 까르푸 30% / 7ELE → Starbucks 12% 등)
- 중앙: BU pair 매트릭스 (5×5 히트맵)
- 우: 개별 회원 90일 타임라인 (단일 사례)
- 하단: BU 교차 사용률 코호트 비교 (등급별)

## 6. 가드레일
- 회원 PII 마스킹 (OPENPOINT ID hash)
- BU 영업 정보 분리 (BU별 단가 비공개)

## 7. 데모 시나리오
1. **OPENPOINT 1,200만 통계** → 7ELE → 까르푸 교차 사용률 30%
2. **개별 회원 90일** → 평일 7ELE → 주말 까르푸 → 모닝 Starbucks (단일 타임라인)
3. **BU pair 매트릭스** → "7ELE↔Starbucks 12% (강함), Donut↔KFC 8% (약함)"
4. **이 회원에게 BU 교차 유도 캠페인** → S5 연계