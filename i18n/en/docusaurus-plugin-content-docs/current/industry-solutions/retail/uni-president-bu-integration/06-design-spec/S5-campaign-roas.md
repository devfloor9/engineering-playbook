---
title: S5. Omnichannel Campaign ROAS (Uni-President)
description: OPENPOINT unified campaigns + cross-BU-driving channel mix with Bayesian attribution
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
sidebar_label: S5. Campaign ROAS
---

## Channel Candidates
- OPENPOINT app push · KakaoTalk / Line · 7ELE in-store display · Carrefour flyer · Starbucks card earning · SNS ads · live streaming

## Data Mix
| Data | Source |
|---|---|
| Historical campaigns | CAMPAIGN_MART |
| Cross-BU usage (BUTransfer) | Neptune |
| OPENPOINT earning · redemption | OPENPOINTMembership |
| SNS engagement | SocialSignal |

## Output UI
- Recommended channel mix (donut)
- ROAS distribution (violin)
- Cross-BU drive-effect matrix

## Demo Scenarios
1. Budget 100M / cross-drive campaign 7ELE→Carrefour → recommended mix
2. +20% SNS share → ROAS change
3. Simulate +5pt cross-BU usage target