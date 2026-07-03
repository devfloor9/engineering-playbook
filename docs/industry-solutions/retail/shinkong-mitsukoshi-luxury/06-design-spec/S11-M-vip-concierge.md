---
title: S11-M. VIP 등급 라운지 컨시어지 (Mitsukoshi 특화)
description: Black/Platinum/Gold 회원 추천·프리세일·개인 컨시어지 챗봇
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-M. VIP Concierge
---

> **Mitsukoshi 차별 포인트** ⭐ — VIP 회원 1:1 컨시어지 경험을 Bedrock + Memory로 자동화.

## 1. URL · 페르소나
- `/vip-concierge` · P4 (VIP·멤버십)

## 2. 사용자 스토리
> P4 — Black 등급 회원 한 명을 클릭하면 그가 자주 사는 브랜드·프리세일 우선권·라운지 활용 이력·맞춤 추천이 한 화면에.

> Black 회원 → 챗봇이 개인 컨시어지 톤 ("○○님께서 좋아하실 만한 SS 신상이 信義점에 입고됐습니다") 응답.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Membership (Black/Platinum/Gold) | Neptune |
| 컨시어지 이력 (라운지 방문·요청) | Neptune (Touchpoint subtype='concierge') |
| AgentCore Memory | 회원 단위 long-term 선호 |
| 자사 리뷰 + 외부 후기 | OpenSearch |

## 4. 등급별 혜택 (공개 일반 표현)

| 등급 | 핵심 |
|---|---|
| Black | 라운지 무제한, 프리세일 우선, 1:1 컨시어지 |
| Platinum | 라운지 + 무료 발렛 |
| Gold | 적립 가속 + 시즌 우선 안내 |

## 5. 출력 UI
- 좌: 회원 프로필 카드 (등급, 12개월 LTV, 페르소나)
- 중앙: 추천 카드 (브랜드별 신상 + 프리세일 우선권)
- 우: 컨시어지 챗봇 (개인 메모리)
- 하단: 라운지 활용·NPS 추이

## 6. 가드레일
- PII 마스킹 (이름은 등급 카드에서만 표시 가능)
- 임신·질병 추정 금지
- 동의 미수신 회원 자동 제외

## 7. 데모 시나리오
1. **Black 회원 1명** → 추천 5종 + 컨시어지 메시지 (개인 톤)
2. **프리세일 우선권** → SS 신상 24시간 우선 안내
3. **라운지 활용 NPS** → 등급별 추이 + 개선 제안