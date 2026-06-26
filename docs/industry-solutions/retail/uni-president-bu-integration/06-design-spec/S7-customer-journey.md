---
title: S7. 옴니채널 회원 여정 (Uni-President)
description: OPENPOINT 회원의 자사 BU 가로지르는 여정
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S7. Customer Journey
---

# S7. 옴니채널 회원 여정 (Uni-President)

> S9-U와 유사하지만 S7은 **개별 회원 90일 타임라인** 중심, S9-U는 **통계적 BU 교차 패턴** 중심.

## 데이터 믹스
- SearchEvent · CartEvent · CVSTransaction · HypermarketTransaction · CafeTransaction · Touchpoint · Coupon · BUTransfer

## 출력 UI
- Swimlane (7ELE·까르푸·Starbucks·Donut·KFC·SMS·SNS)
- BU 색상 (5색)
- BU 교차 이벤트 강조

## 데모 시나리오
1. 골드 OPENPOINT 회원 90일 → 평일 7ELE → 주말 까르푸 → Starbucks 모닝
2. 신규 회원 → BU 교차 진입 시점
3. 이탈 위험 → BU 활동 급감 패턴