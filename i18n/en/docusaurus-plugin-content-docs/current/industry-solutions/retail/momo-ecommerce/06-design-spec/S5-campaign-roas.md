---
title: S5. Omnichannel Campaign ROAS (Momo)
description: Bayesian attribution across App · Live · TV · Messenger channels
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
sidebar_label: S5. Campaign ROAS
---

## 1. URL · Persona
- `/campaign-roas` · P1

## 2. Channel Candidates
- App push · KakaoTalk/Line · Live broadcasts · TV home-shopping · SNS ads · Messenger · Influencers

## 3. Data Mix
| Data | Source |
|---|---|
| Past campaigns | Snowflake or in-house mart |
| Channel sell-through | OrderTransaction + LiveStreamPurchase + TVPurchase |
| Live viewing · Conversion | LiveStream + Viewer + LiveStreamPurchase |
| SNS reactions | SocialSignal |

## 4. Output UI
- Recommended channel mix (donut)
- ROAS distribution (violin)
- Live · TV · App share simulation

## 5. Demo Scenarios
1. Budget 500M NTD / summer new product → recommended mix
2. Live share +30% → immediate ROAS change
3. Per-host live effect comparison
