---
title: S5. Omnichannel Campaign ROAS (AMWAY)
description: Bayesian attribution across in-house store, ABO direct sale, catalog, and SNS channels
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S5. Campaign ROAS
---

## 1. URL & Personas
- `/campaign-roas` · P1 (ABO Field)

## 2. Candidate Channels
- SMS · email · KakaoTalk/Line · Instagram ads · in-house store banners · ABO direct sale (Sponsor) · catalog · influencer

## 3. Data Mix
| Data | Source |
|---|---|
| Historical campaigns | Snowflake CAMPAIGN_MART |
| Channel sell-through | OrderTransaction + ABODirectSale |
| **SNS response** | SocialSignal (Instagram · Reddit · X) |
| **Search trends** | Multilingual search trends |

## 4. Processing Pipeline
1. Extract channel · country priors from Snowflake
2. 1,000 MCMC samples (PyMC) → posterior
3. ROAS distribution for the channel mix
4. Attribution (last-touch / linear / time-decay)

## 5. Output UI
- Recommended channel mix (donut)
- ROAS distribution (violin)
- Marginal efficiency by channel and country
- Separately display trend vs. SNS impact

## 6. Guardrails
- Automatically exclude consent-missing members
- Automatically exclude minor-targeted campaigns
- Block direct-selling-regulation-violating text

## 7. Demo Scenarios
1. Budget KRW 100M / Nutrilite new product / 50K Gold ABOs → recommended mix
2. Raise ABO direct-sale share by 20% → instant ROAS shift
3. "Trend effect vs. campaign effect" decomposed
