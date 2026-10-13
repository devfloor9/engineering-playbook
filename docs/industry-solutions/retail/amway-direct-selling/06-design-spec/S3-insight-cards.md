---
title: S3. Category & BU Insight Cards (AMWAY)
description: Automated report cards combining Nutrition, Beauty, Home BU revenue with 4 external sources
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
sidebar_label: S3. Insight Cards
---

## 1. URL & Personas
- `/insights` · P3 (D&A)

## 2. Card Presets

| Card | Data |
|---|---|
| Monthly BU GMV (Nutrition / Beauty / Home) | OrderTransaction × Category × Month |
| ABO direct sales by country | ABODirectSale × Country |
| Subscription signup / churn trends | Subscription · Event |
| Vegan trend vs. Nutrilite sales | SocialSignal + GMV |
| FX vs. in-house global sales | EconomicSignal × Country GMV |
| Impact after regulatory enactment | RegulatorySignal annotation |

## 3. Per-persona Commentary Differences

| P | Comment on the same card (Monthly BU GMV) |
|---|---|
| P1 | "Beauty BU +12%, estimated Sponsor campaign effect" |
| P2 | "Single-household persona rises to a 25% share of Beauty" |
| P3 | "November +1.5σ — joint analysis with FX is required" |
| P4 | "VIP ABO accrual rate +3pt — level-campaign effect" |
| P5 | "Zero ad-language violations; regulatory-safe" |

## 4. Guardrails
- Cite external sources
- Prohibit causal inference
- Monitor multilingual accuracy of LLM comments

## 5. Demo Scenarios
1. "Monthly BU GMV" → comments from all 5 personas
2. "Vegan trend vs. Nutrilite" → correlation R² 0.71
3. "Hand this card off to the chatbot" → natural transition to S2
