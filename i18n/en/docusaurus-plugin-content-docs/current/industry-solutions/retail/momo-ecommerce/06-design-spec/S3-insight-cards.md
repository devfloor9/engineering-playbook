---
title: S3. Category · BU Insight Cards (Momo)
description: Automated reports combining massive-SKU categories + Live + Delivery + External signals
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S3. Insight Cards
---

## 1. URL · Persona
- `/insights` · P3

## 2. Card Presets

| Card | Data |
|---|---|
| Top-30 Category GMV (monthly) | OrderTransaction × Category |
| **Live-broadcast GMV** vs Regular GMV | LiveStreamPurchase vs OrderTransaction |
| **Delivery SLA trend** (24-hour promise) | DeliverySLA × Region |
| **Long-tail SKU exposure ratio** | LongTailSKU × Recommendation exposure |
| Search trend vs in-house | SocialSignal + GMV |
| Heavy-rain impact (delivery) | WeatherSignal × DeliverySLA |

## 3. Per-Persona Commentary

| P | Same Card (Live GMV) |
|---|---|
| P1 | "Yesterday's 19:00 live GMV 120M NTD — new-product campaign effect" |
| P2 | "Social #summertent +35% — likely live-broadcast effect" |
| P3 | "Live-pin SKU diversity 0.42 (low) — recommendation reinforcement needed" |
| P4 | "Refund rate after live broadcasts 8% — +3pt vs 5% average risk" |
| P5 | "Fulfillment load +60% during high-frequency live time slots" |

## 4. Demo Scenarios
1. "Yesterday's live GMV" → 5-persona commentary
2. "Heavy-rain impact" → -15% delivery visualization
3. "Long-tail exposure" → categories below 0.4 diversity
