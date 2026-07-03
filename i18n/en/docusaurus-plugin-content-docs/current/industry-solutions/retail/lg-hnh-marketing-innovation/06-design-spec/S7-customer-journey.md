---
title: S7. Omnichannel Member Journey
description: A single member's owned mall → SNS ad → Olive Young → Mart → Repurchase single timeline crossing BUs · channels
created: "2026-05-14"
last_update:
  date: "2026-06-30"
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

> **The decisive moment of the 3-BU integrated PoC**: A single timeline showing how one member moves across Beauty (Olive Young) → HDB (Mart) → Refreshment (Convenience store).

## 1. URL Path
- `/journey`

## 2. User Stories
> P4 (CRM · LG Members) — A single timeline of one member's 90-day touchpoints (owned-mall search · SNS ad · Olive Young store · CU convenience store · repurchase · refund) + analysis of where churn/loyalty diverged.

## 3. Input UI
- Member search (masked ID or natural language)
- Period (30/90/180 days)
- Event-type filters (search · SNS · store · campaign · refund)
- BU filter (Beauty/HDB/Refreshment)

## 4. Data Mix
| Data | Source |
|---|---|
| SearchEvent · CartEvent · OrderTransaction (owned mall) | Neptune |
| ChannelSellThrough (Mart/H&B/Convenience/QSR) | Neptune |
| Touchpoint (SMS/KakaoTalk/SNS ad) | Neptune |
| Coupon · ReviewRating | Neptune |
| BU mapping | Brand → BU |

## 5. Processing Pipeline
```
1. Member ID → UNION of all events 1-hop
2. BU mapping (Product → Brand → BU)
3. Sort by time
4. Double coding by event color + BU color
5. Swimlane timeline (channel lane × BU color)
6. Highlight key conversions (first purchase · tier transition · BU crossover · churn risk)
```

## 6. Output UI
- Swimlane timeline (owned mall · SNS · Olive Young · Mart · Convenience · SMS · KakaoTalk)
- BU color coding (Beauty pink / HDB blue / Refreshment red)
- Event card click → detail (search keyword · SKU · BU)
- Right-side summary: 90-day LTV · tier change · persona · BU share donut

## 7. Guardrails
- PII auto-masked (name · contact)
- "Sensitive inference" forbidden

## 8. Demo Scenarios
1. High-value member 90 days → Owned mall (Beauty) → SNS ad (HDB) → Olive Young (Beauty) → CU (Refreshment) → VIP entry
2. Pre-churn member → owned-mall activity decline + refund pattern
3. BU share change (a year ago 90%/5%/5% → now 50%/30%/20%) — persona evolution
4. "What campaign for this member?" → S5 linkage
