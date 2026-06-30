---
title: S7. Omnichannel Member Journey (Uni-President)
description: Cross-BU journey of an OPENPOINT member across own BUs
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S7. Customer Journey
---

> Similar to S9-U, but S7 centers on an **individual member's 90-day timeline**, while S9-U focuses on **statistical cross-BU patterns**.

## Data Mix
- SearchEvent · CartEvent · CVSTransaction · HypermarketTransaction · CafeTransaction · Touchpoint · Coupon · BUTransfer

## Output UI
- Swimlane (7ELE · Carrefour · Starbucks · Donut · KFC · SMS · SNS)
- BU color coding (5 colors)
- Cross-BU events highlighted

## Demo Scenarios
1. Gold OPENPOINT member 90 days → weekday 7ELE → weekend Carrefour → morning Starbucks
2. New member → moment of crossing into another BU
3. Churn risk → pattern of plunging BU activity