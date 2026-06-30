---
title: 30-Minute Demo Script (Momo)
description: 30-minute live demo for Momo executives, live-operations teams, and logistics teams
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - demo
  - storytelling
  - scope:design
sidebar_label: 99. Demo Storytelling
---

## 0. Pre-Demo Checklist
| ✅ | Top-5 responses under 1 minute / Live-event mock operational / Delivery SLA live |

## 1. Opening (3 min)
> "A live walkthrough that consolidates Momo's four core assets — **massive SKU, live commerce, in-house logistics, and mobile-app recommendations** — into a single KG so that five departments can use it visually. Not a concept slide, but a live run with N=5K real members + 50K SKUs + 500 live broadcasts + 250K delivery logs + 4 external feeds."

Four key messages:
1. **Live-commerce attribution** (S9-Mo)
2. **Delivery SLA + outdoor weather** (S10-Mo)
3. **Recommendation diversity · Long-tail** (S11-Mo)
4. **5-department persona switcher**

## 2. Top-5 Demo (20 min)

### Step 1 — S1 Semantic Search (4 min)
- Input: "Summer camping tent + 24-hour delivery + Dcard rating 4.5+"
- Result: SKU + Member + Dcard reviews + 24-hour delivery availability tag

### Step 2 — S9-Mo Live Attribution ⭐ (5 min)
- "Funnel of yesterday's 19:00 live broadcast"
- 50K viewers → 8K carts → 3,200 purchases → 120M NTD GMV
- Host A vs B effect comparison

### Step 3 — S10-Mo Delivery SLA ⭐ (4 min)
- "Northern fulfillment 24-hour SLA breach rate + heavy-rain impact"
- Breach rate 32%, 1-day lag after heavy rain
- Recommended ordering simulation

### Step 4 — S11-Mo Recommendation Diversity ⭐ (5 min)
- "Recommendation diversity score + long-tail exposure rate"
- "Summer tent" diversity 0.31 (low) → corrected simulation result
- A/B: diversity ↑ → GMV +6%

### Step 5 — S2 Persona Chatbot (4 min)
- P1 vs P5 comparison (campaign vs logistics)

## 3. Governance (3 min)
- cohort_tag · Live-ad guard · Delivery-information protection

## 4. Closing (4 min)
- Summary + next steps (Discovery 2 weeks → PoC 8 weeks → Operations 12 weeks)

## Q&A
| Question | Answer |
|---|---|
| Live event volume? | Add Kinesis shards (1 shard sufficient for PoC) |
| Delivery SLA accuracy? | TimeStream + measured cross-validation |
| Cost? | ~$4.6K/month |
