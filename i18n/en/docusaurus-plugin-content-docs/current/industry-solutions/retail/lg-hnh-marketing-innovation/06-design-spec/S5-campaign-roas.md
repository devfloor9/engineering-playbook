---
title: S5. Omnichannel Campaign ROAS Simulation
description: Omnichannel (Owned mall/Mart/H&B/SNS) Bayesian attribution + search · SNS response combined
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
sidebar_label: S5. Campaign ROAS
---

## 1. URL Path
- `/campaign-roas`

## 2. User Stories
> P1 (Brand Marketer) — Next week Su:m37 new product launch / Budget 100M KRW / VIP 50K → channel mix simulation.

> P5 (MD) — Omnichannel ROI considering channel · shelf placement together.

## 3. Input UI
- Campaign definition (target segment, period, budget, target BU/brand)
- Channel candidates (SMS · Push · KakaoTalk · SNS ad · owned-mall banner · mart shelf · H&B display · influencer)
- Hypothesis (e.g., "SMS:Push:KakaoTalk:SNS:H&B = 20:15:15:30:20")

## 4. Data Mix
| Data | Source | Use |
|---|---|---|
| Past campaigns | Snowflake CAMPAIGN_MART | Bayesian prior |
| Channel sell-through | ChannelSellThrough | Per-channel response rate |
| **SNS responses** | SocialSignal (X · Instagram ad clicks) | Posterior adjustment |
| **Search trends** | SocialSignal (Naver · Google) | Separate non-campaign effects |

## 5. Processing Pipeline
```
1. Extract per-channel priors from past campaigns
2. Combine external signals (search · SNS) → separate trend effects
3. MCMC 1000 samples (PyMC) → posterior
4. Channel mix ROAS distribution
5. Recommended mix (max expected ROAS value)
6. Attribution (Last-touch / Linear / Time-decay)
```

## 6. Output UI
- Recommended channel mix (donut + table)
- ROAS distribution (violin)
- Per-channel marginal efficiency (line)
- Channel · store GMV impact (bar)
- Separated display of trend · SNS effects

## 7. Guardrails
- Automatically exclude non-consenting members
- Per-channel send limit (spam guard)
- Include confidence intervals in simulation results (no point estimates)
- Automatically exclude cosmetics campaigns to minors

## 8. Demo Scenarios
1. Budget 100M KRW / Su:m37 new product / VIP 50K → recommended mix + ROAS distribution
2. Change assumption (SNS +20%) → ROAS change immediate
3. "When combining search trends, trend effect vs. campaign effect" separation chart
