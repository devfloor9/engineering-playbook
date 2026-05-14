---
title: "S10-A. 정기구독 라이프타임 분석 (AMWAY 특화)"
sidebar_label: "S10-A. Subscription"
description: "정기구독 state machine + 해지 시그너처 탐지 + 자동 회복 캠페인"
---

# S10-A. 정기구독(Subscription) 라이프타임 분석

> **AMWAY 차별 포인트** ⭐ — Nutrilite·Artistry 정기구독은 AMWAY 매출의 핵심. 가입→갱신→일시정지→해지 state machine과 해지 위험 시그너처를 자동 탐지.

## 1. URL · 페르소나
- `/subscription` · P4 (CX), P1 (ABO Field)

## 2. 사용자 스토리
> P4 — 6개월 후 해지 시그너처를 보이는 ABO TOP 100을 자동 추출 + 자동 회복 캠페인 추천.

> P1 — Sponsor가 자기 Downline 정기구독 retention을 한 화면에서 추적.

## 3. 입력 UI
- 코호트 (전체 ABO / Customer / 등급별 / 국가별)
- 기간 (12/24개월)
- 해지 시그너처 임계값
- 페르소나 스위처

## 4. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Subscription 노드 | Neptune (~10K 활성 + ~5K 해지) |
| SubscriptionEvent | Neptune (start/renew/pause/cancel) |
| 결제 실패 이력 | Neptune (속성) |
| 90일 활동 | OrderTransaction + ABODirectSale |
| 해지 후 재가입 | SubscriptionEvent type='start' |

## 5. 해지 시그너처 (z-score 기반)

| 시그너처 | 정의 |
|---|---|
| 결제 실패 다발 | 최근 3회 자동 결제 중 2회 실패 |
| 활동 0 | 30일 활동 없음 + 구독 자동 갱신 임박 |
| Downline 이탈 (ABO) | Sponsor의 Downline 1명 이상 해지 |
| 가격 인상 후 24시간 폭증 | 인상 발표 후 cancel event spike |
| 시즌 영향 | 분기말 갱신 회피 패턴 |

## 6. 처리 파이프라인
```
1. Neptune에서 Subscription state별 카운트
2. 30일 단위 retention curve 계산
3. 해지 시그너처 룰 적용 → 위험 ABO/Customer 리스트
4. 자동 회복 캠페인 추천 (Bedrock + 페르소나 룰)
5. P1 페르소나면 Sponsor 단위 그룹 + 책임 ABO 알람
```

## 7. 출력 UI
- 좌: Subscription state machine 다이어그램 (Sankey)
- 중앙: 12개월 retention curve (cohort별)
- 우: 해지 위험 ABO 리스트 (TOP 100, 시그너처 라벨)
- 하단: 자동 회복 캠페인 시뮬 (S5 연계)

## 8. 가드레일
- PII 마스킹
- 자동 발송 X (P4 검토 후 액션)
- 동의 미수신 회원 자동 제외

## 9. 데모 시나리오
1. **Cohort 12개월 retention curve** → 신규 ABO의 50% 6개월 후 해지
2. **해지 위험 TOP 100** → 시그너처 라벨 (3개 룰)
3. **자동 회복 캠페인 시뮬** → 추천 채널·메시지 + ROAS 예상
