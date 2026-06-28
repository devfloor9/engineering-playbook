---
title: S7. 옴니채널 회원 여정
description: 단일 회원이 자사몰→SNS 광고→올영→마트→재구매 BU·채널 가로지르는 단일 타임라인
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S7. Customer Journey
---

# S7. 옴니채널 회원 여정

> **3 BU 통합 PoC의 결정적 한 컷**: 한 회원이 Beauty(올영) → HDB(마트) → Refreshment(편의점)을 어떻게 이동하는지 단일 타임라인.

## 1. URL 경로
- `/journey`

## 2. 사용자 스토리
> P4 (CRM·LG 멤버스) — 회원 한 명의 90일 모든 터치포인트(자사몰 검색·SNS 광고·올영 매장·CU 편의점·재구매·환불)를 단일 타임라인으로 + 어디서 이탈/충성이 갈렸는지 분석.

## 3. 입력 UI
- 회원 검색 (마스킹 ID 또는 자연어)
- 기간 (30/90/180일)
- 이벤트 타입 필터 (검색·SNS·매장·캠페인·환불)
- BU 필터 (Beauty/HDB/Refreshment)

## 4. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| SearchEvent · CartEvent · OrderTransaction (자사몰) | Neptune |
| ChannelSellThrough (마트/H&B/편의점/QSR) | Neptune |
| Touchpoint (SMS/카톡/SNS광고) | Neptune |
| Coupon · ReviewRating | Neptune |
| BU 매핑 | Brand → BU |

## 5. 처리 파이프라인
```
1. 회원 ID → 모든 이벤트 1-hop UNION
2. BU 매핑 (Product → Brand → BU)
3. 시간순 정렬
4. 이벤트 색상 + BU 색상 더블 코딩
5. Swimlane 타임라인 (채널 lane × BU 색)
6. 핵심 전환 강조 (첫 구매·등급 전환·BU 교차·이탈 위험)
```

## 6. 출력 UI
- Swimlane 타임라인 (자사몰·SNS·올영·마트·편의점·SMS·카톡)
- BU 색상 코딩 (Beauty 핑크 / HDB 블루 / Refreshment 레드)
- 이벤트 카드 클릭 → 상세 (검색 키워드·SKU·BU)
- 우측 요약: 90일 LTV·등급 변화·페르소나·BU 비중 도넛

## 7. 가드레일
- PII 자동 마스킹 (이름·연락처)
- "민감 추정" 금지

## 8. 데모 시나리오
1. 고가치 회원 90일 → 자사몰(Beauty) → SNS 광고(HDB) → 올영(Beauty) → CU(Refreshment) → VIP 진입
2. 이탈 예정 회원 → 자사몰 활동 급감 + 환불 패턴
3. BU 비중 변화 (1년 전 90%/5%/5% → 현재 50%/30%/20%) — 페르소나 진화
4. "이 회원에 어떤 캠페인을?" → S5 연계