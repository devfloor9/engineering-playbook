---
title: S7. 옴니채널 회원 여정 (Momo)
description: 앱 검색 → 라이브 시청 → TV 홈쇼핑 → 재구매 단일 타임라인
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S7. Customer Journey
---

## 1. URL · 페르소나
- `/journey` · P4 (CS·CRM)

## 2. 데이터 믹스
- SearchEvent · CartEvent · OrderTransaction · LiveStream 시청 · LiveStreamPurchase · TVPurchase · Touchpoint · Coupon · DeliverySLA

## 3. 출력 UI
- Swimlane (앱·라이브·TV·메신저·배송)
- 라이브 방송 핀 이벤트 강조
- 배송 위반 시 빨간 점

## 4. 데모 시나리오
1. 라이브 즉흥 구매 회원 90일 → 앱 검색→라이브 5회 시청→3회 구매
2. 24시간 배송 위반 → CS 챗 → NPS 5점 하락
3. 신규 → 활성 → 충성 전환 트리거