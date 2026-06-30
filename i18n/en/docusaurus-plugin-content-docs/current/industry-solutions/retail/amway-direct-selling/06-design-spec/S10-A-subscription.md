---
title: S10-A. Subscription Lifetime Analysis (AMWAY-specific)
description: Subscription state machine + churn signature detection + automated win-back campaigns
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S10-A. Subscription
---

> **AMWAY differentiator** ⭐ — Nutrilite and Artistry subscriptions are core to AMWAY revenue. Automatically detect the signup → renewal → pause → cancel state machine and churn-risk signatures.

## 1. URL & Personas
- `/subscription` · P4 (CX), P1 (ABO Field)

## 2. User Stories
> P4 — Automatically extract the top 100 ABOs that exhibit a 6-month churn signature, with recommended automated win-back campaigns.

> P1 — Sponsors track subscription retention for their own Downline on a single screen.

## 3. Input UI
- Cohort (all ABO / Customer / by level / by country)
- Period (12 / 24 months)
- Churn signature threshold
- Persona switcher

## 4. Data Mix
| Data | Source |
|---|---|
| Subscription node | Neptune (~10K active + ~5K cancelled) |
| SubscriptionEvent | Neptune (start / renew / pause / cancel) |
| Payment failure history | Neptune (attributes) |
| 90-day activity | OrderTransaction + ABODirectSale |
| Re-signup after cancellation | SubscriptionEvent type='start' |

## 5. Churn Signatures (z-score based)

| Signature | Definition |
|---|---|
| Repeated payment failures | At least 2 of the last 3 auto-payments fail |
| Zero activity | No activity for 30 days while auto-renewal is imminent |
| Downline drop-off (ABO) | Sponsor has at least one Downline cancel |
| Surge within 24 hours of price increase | Cancel-event spike after the price-increase announcement |
| Seasonal effect | Avoidance of end-of-quarter renewals |

## 6. Processing Pipeline
```
1. Count per Subscription state in Neptune
2. Compute 30-day retention curves
3. Apply churn-signature rules → high-risk ABO / Customer list
4. Recommend automated win-back campaigns (Bedrock + persona rules)
5. For the P1 persona, group by Sponsor and alert the responsible ABO
```

## 7. Output UI
- Left: Subscription state-machine diagram (Sankey)
- Center: 12-month retention curve (by cohort)
- Right: Top 100 high-risk ABOs (signature labels)
- Bottom: Automated win-back campaign simulation (linked to S5)

## 8. Guardrails
- PII masking
- No auto-send (action only after P4 review)
- Auto-exclude consent-missing members

## 9. Demo Scenarios
1. **Cohort 12-month retention curve** → 50% of new ABOs cancel after 6 months
2. **Top 100 high-risk subscribers** → signature labels (3 rules)
3. **Automated win-back campaign simulation** → recommended channel and message + projected ROAS
