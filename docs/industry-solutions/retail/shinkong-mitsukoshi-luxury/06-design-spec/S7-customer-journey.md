---
title: S7. 옴니채널 회원 여정 (Mitsukoshi)
description: 자사몰 → 매장 → 면세 → 재방문 단일 타임라인
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S7. Customer Journey
---

## 1. URL · 페르소나
- `/journey` · P4

## 2. 데이터 믹스
- SearchEvent · CartEvent · OrderTransaction · POSTransaction · TaxRefundTransaction · Touchpoint · Coupon · ReviewRating

## 3. 출력 UI
- Swimlane (자사몰·점포·면세·DM·SNS)
- 점포·층 색상 코딩
- VIP 등급 변화 표시

## 4. 데모 시나리오
1. Black 회원 90일 여정 → 자사몰→信義 1F→면세→일본 추천
2. 외국인 단발 여정 → 입국→면세→재방문 시도
3. VIP 진입 트리거 시점