---
title: S9-Mo. Live-Commerce Broadcast Attribution (Momo-Specific)
description: Live viewer → cart → purchase funnel + per-host and per-SKU effect
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
sidebar_label: S9-Mo. Live Attribution
---

> **Momo differentiation point** ⭐ — Live-broadcast viewing, pin, and purchase events are ingested in real time via Kinesis for per-host, per-SKU, and per-time-slot attribution.

## 1. URL · Persona
- `/live-attribution` · P1 (Marketing)

## 2. User Story
> P1 — Yesterday's 19:00 live broadcast (1 hour) — 50K viewers, 8K carts, 3K purchases, 120M NTD GMV. Per-host, per-SKU, and per-time-slot effect on a single screen.

## 3. Data Mix
| Data | Source |
|---|---|
| LiveStream metadata | Neptune |
| LiveViewer viewing events | Kinesis → Neptune |
| LiveStreamPurchase | Neptune (~50K) |
| Pin events (host pinning an SKU) | LiveStream attribute (time sequence) |
| External SNS reactions | SocialSignal |

## 4. Processing Pipeline
```
1. Select a single live broadcast
2. Compute the viewer → cart → purchase funnel
3. Aggregate per-host GMV and conversion rate
4. Attribute purchases within ±5 minutes of an SKU pin
5. Viewing time vs purchase probability curve (survival analysis)
```

## 5. Output UI
- Left: Funnel chart (Viewing → Cart → Purchase)
- Center: Per-host GMV bars + ratings
- Right: SKU pin vs purchase timeline (interactive)
- Bottom: Viewing-time distribution + purchase probability

## 6. Guardrails
- PII masking (viewers)
- Host business-information protection

## 7. Demo Scenarios
1. **Yesterday's 19:00 live broadcast** → 50K viewers → 8K carts → 3,200 purchases → 120M NTD GMV
2. **Host A vs B** → Same SKU pin, conversion 12% vs 4%
3. **5-minute GMV spike after SKU pin** → automatic attribution
