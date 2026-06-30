---
title: S7. ABO·Customer 옴니채널 여정 (AMWAY)
description: 자사몰 → ABO 직판 → 정기구독 → 재가입 단일 타임라인
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S7. Customer Journey
---

## 1. URL · 페르소나
- `/journey` · P4 (CX)

## 2. 사용자 스토리
> P4 — 한 ABO/Customer의 12개월 모든 터치포인트(자사몰 검색 · ABO 직판 · 정기구독 가입·갱신·해지 · 캠페인 응답)를 단일 타임라인으로.

## 3. 데이터 믹스
- SearchEvent · CartEvent · OrderTransaction · ABODirectSale · SubscriptionEvent · Touchpoint · Coupon · ReviewRating

## 4. 처리 파이프라인
1. ABO/Customer ID → 모든 이벤트 1-hop UNION
2. BU(Nutrition/Beauty/Home) 매핑
3. 시간순 정렬 + 색상 코딩
4. Swimlane 타임라인 (자사몰·ABO 직판·구독·캠페인·소셜)
5. 핵심 전환 (첫 정기구독·등급 진입·해지 위험·BU 교차)

## 5. 출력 UI
- Swimlane (5 채널)
- BU 색상 (Nutrition·Beauty·Home)
- 이벤트 카드 클릭 → 상세
- 우측 요약: 12개월 LTV·등급 변화·페르소나·구독 상태

## 6. 가드레일
- PII 마스킹
- 민감 추정 금지

## 7. 데모 시나리오
1. 신규 ABO 12개월 → 자사몰 검색 → ABO 직판 → 첫 구독 → 등급 진입
2. 해지 위험 ABO → 활동 급감 + 구독 일시정지
3. BU 비중 변화 (1년 전 N 90%/B 5%/H 5% → 현재 N 50%/B 30%/H 20%)