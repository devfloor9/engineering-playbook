---
title: S3. Category · BU Insight Cards
description: Automated report cards combining first-party GMV + search trends + weather + competitors
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S3. Insight Cards
---

## 1. URL Path
- `/insights`

## 2. User Stories
> P3 (D&A) — Builds the same report every week. Save time with automatic 4-type external signal fusion + LLM comments.

> P5 (MD) — Sees a category sales card and wants to immediately ask "Why?" via the chatbot (S2).

## 3. Input UI
- Card type selector (8 presets)
- Period (week/month/quarter), BU/Category/Channel/Brand filters
- "Generate Insights" button

## 4. Data Mix
| Data | Source | Use |
|---|---|---|
| First-party GMV (BU × Category × Month) | Snowflake / Neptune | line/bar |
| **Search trends** | Naver · Google → SocialSignal | Dual axis |
| **Weather** | KMA → WeatherSignal | Dual axis |
| **Competitor new products** | CompetitorSignal | annotation |

## 5. Processing Pipeline
```
1. Card selection → openCypher / Snowflake aggregation
2. External signal join (date/region/category keys)
3. Result dataframe → AgentCore Code Interpreter
4. matplotlib + NanumGothic PNG
5. PNG + dataframe → Sonnet 4.6
6. Generate comments via persona system prompt
7. Card = PNG + comments + data table
```

## 6. 8 Card Presets
| Card | Data |
|---|---|
| Monthly BU GMV trend | Beauty/HDB/Refreshment comparison |
| Category × Channel GMV | Owned mall · Mart · H&B · Convenience |
| **Sunscreen GMV vs. Temperature · UV** | WeatherSignal combined |
| **Beverage GMV vs. Outside temp · Precipitation** | WeatherSignal combined |
| **Search Trends vs. First-Party GMV** | SocialSignal combined |
| **First-Party Impact After Competitor Launch** | CompetitorSignal annotation |
| Membership Tier × GMV | Membership × Order |
| Time-of-day Transaction Distribution | OrderTransaction.order_at |

## 7. Per-Department Comment Differences
| Persona | Comment example for the same card (Beauty monthly GMV) |
|---|---|
| P1 Brand Marketer | "November Whoo +12% — estimated effect of pre-SMS campaign. Next campaign should..." |
| P2 Insights | "Single-household persona's Beauty share rises to 25% — review new segment" |
| P3 D&A | "November distribution +1.5σ vs. norm — temperature variable joint analysis required" |
| P4 CRM · LG Members | "VIP point accrual rate 18% (+3pt) — tier retention campaign effect" |
| P5 MD · Channel Sales | "Beauty turnover +0.4 — propose shelf expansion in department stores · Olive Young" |

## 8. Guardrails
- Mandatory source attribution for external data
- No causal inference (correlation only) — LLM comment guard
- Emphasize confidence intervals for small-sample categories

## 9. Demo Scenarios
1. "Monthly BU GMV trend" card → demo comments across 5 personas
2. "Sunscreen vs. Temperature" card → R² 0.62 scatter + order guide
3. "Take this card to the chatbot" button → natural transition to S2
