---
title: S5. Omnichannel Campaign ROAS (Mitsukoshi)
description: Bayesian attribution across store, DM, and social channels for events such as the Anniversary Sale
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S5. Campaign ROAS
---

## 1. URL · Personas
- `/campaign-roas` · P1

## 2. Candidate Channels
- DM catalog · SMS · KakaoTalk / Line · Xiaohongshu · Instagram · Japanese Twitter · in-store display · influencers

## 3. Data Mix
| Data | Source |
|---|---|
| Past campaigns (Anniversary Sale / SS / FW) | CAMPAIGN_MART |
| Channel sell-through | OrderTransaction + POSTransaction |
| Search / SNS response | SocialSignal (multilingual) |
| Foreigner acquisition impact | TourismSignal × TaxRefundTransaction |

## 4. UI
- Recommended channel mix (donut)
- ROAS distribution (violin)
- Effects by store and nationality

## 5. Demo Scenarios
1. Anniversary Sale budget NTD 500M → recommended mix
2. Foreigner acquisition campaign simulation → ROAS change when Japanese Twitter share is +30%
3. GMV impact by store and nationality
