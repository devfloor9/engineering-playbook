---
title: S7. ABO & Customer Omnichannel Journey (AMWAY)
description: A single timeline of in-house store → ABO direct sale → subscription → resignup
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

## 1. URL & Personas
- `/journey` · P4 (CX)

## 2. User Story
> P4 — Render every touchpoint over 12 months for a single ABO or customer (in-house search · ABO direct sale · subscription signup / renewal / cancellation · campaign response) on a single timeline.

## 3. Data Mix
- SearchEvent · CartEvent · OrderTransaction · ABODirectSale · SubscriptionEvent · Touchpoint · Coupon · ReviewRating

## 4. Processing Pipeline
1. ABO / Customer ID → UNION of every event 1-hop away
2. Map to BUs (Nutrition / Beauty / Home)
3. Chronological sort + color coding
4. Swimlane timeline (store · ABO direct · subscription · campaign · social)
5. Key conversions (first subscription · level entry · churn risk · BU crossover)

## 5. Output UI
- Swimlane (5 channels)
- BU colors (Nutrition · Beauty · Home)
- Click an event card → detail
- Right-side summary: 12-month LTV · level changes · persona · subscription status

## 6. Guardrails
- PII masking
- Prohibit sensitive inferences

## 7. Demo Scenarios
1. A new ABO over 12 months → in-house search → ABO direct sale → first subscription → level entry
2. Churn-risk ABO → sharp activity drop + subscription on pause
3. BU mix shift (one year ago N 90% / B 5% / H 5% → now N 50% / B 30% / H 20%)
