---
title: S11-M. VIP Tier Lounge Concierge (Mitsukoshi-specific)
description: Recommendations, pre-sale priority, and personal concierge chatbot for Black/Platinum/Gold members
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-M. VIP Concierge
---

> **Mitsukoshi differentiation point** ⭐ — Automate the 1:1 concierge experience for VIP members with Bedrock + Memory.

## 1. URL · Personas
- `/vip-concierge` · P4 (VIP & Membership)

## 2. User Stories
> P4 — Click on a Black-tier member to see their frequently purchased brands, pre-sale priority, lounge utilization history, and tailored recommendations on a single screen.

> Black member → chatbot responds in personal concierge tone ("Mr./Ms. ○○, an SS new release that you may enjoy has arrived at the Xinyi store").

## 3. Data Mix
| Data | Source |
|---|---|
| Membership (Black/Platinum/Gold) | Neptune |
| Concierge history (lounge visits / requests) | Neptune (Touchpoint subtype='concierge') |
| AgentCore Memory | Long-term preferences per member |
| First-party reviews + external reviews | OpenSearch |

## 4. Tier Benefits (general public expression)

| Tier | Core |
|---|---|
| Black | Unlimited lounge, pre-sale priority, 1:1 concierge |
| Platinum | Lounge + complimentary valet |
| Gold | Accelerated point accrual + early seasonal announcements |

## 5. Output UI
- Left: member profile card (tier, 12-month LTV, persona)
- Center: recommendation cards (new releases by brand + pre-sale priority)
- Right: concierge chatbot (personal memory)
- Bottom: lounge utilization and NPS trend

## 6. Guardrails
- PII masking (names visible only on the tier card)
- No pregnancy or illness inference
- Automatically exclude members who have not granted consent

## 7. Demo Scenarios
1. **One Black member** → 5 recommendations + concierge message (personal tone)
2. **Pre-sale priority** → 24-hour early notice for SS new releases
3. **Lounge utilization NPS** → trend by tier + improvement suggestions
