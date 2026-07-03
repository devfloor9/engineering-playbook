---
title: S11-A. Direct Selling, Minors, and Health Functional Food Compliance (AMWAY-specific)
description: Automated review of FTC, Korea Door-to-Door Sales Act, MFDS, and EU direct-selling regulations + multi-country ad guards
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-A. Regulatory
---

> **AMWAY differentiator** ⭐ — The biggest risk in the global direct-selling business is regulation. Combine multi-country regulatory signals + automated ad-text review + minor guards.

## 1. URL & Personas
- `/regulatory` · P5 (Compliance & Regulatory)

## 2. User Stories
> P5 — Submit one ad text for a Nutrilite new product to receive automated reviews against FTC, MFDS, and Korea Door-to-Door Sales Act standards, with high-risk language highlighted and recommended revisions.

> P5 — A 24-hour count of minor ABO sign-up attempts and the distribution of block reasons.

## 3. Input UI
- Ad-text input (multilingual)
- Target country (US / KR / JP / CN / EU, etc.)
- Channel (store / catalog / SNS / email)
- Persona = P5 (fixed)

## 4. Data Mix
| Data | Source |
|---|---|
| Bedrock Guardrails | AWS |
| RegulatorySignal | Neptune (FTC / Korea Door-to-Door Sales Act / MFDS / EU rulesets) |
| Compliance policy | Compliance nodes (member consent / level verification) |
| Suspected minor | Customer.age_band = under_18 |
| AuditLog | DynamoDB |

## 5. Review Checklist

| Category | Review Items |
|---|---|
| **FTC (US)** | Level guarantees / income guarantees / exaggerated claims |
| **Korea Door-to-Door Sales Act (KR)** | Cooling-off-period disclosure / level verification / multi-level claims |
| **MFDS (KR)** | Efficacy / treatment claims / pharmaceutical confusion |
| **FDA (US)** | Pre-approval for Health Claims |
| **EU Direct Selling Code** | 14-day refunds / minors |
| **Common** | PII exposure / minor targeting |

## 6. Processing Pipeline
```
1. Input text → Bedrock Guardrails (4 topics)
2. Match country-specific RegulatorySignal rules (Neptune)
3. Identify high-risk phrasing + risk score
4. Sonnet 4.6 → generate recommended revisions (multilingual)
5. Result: original + revised + violated rule IDs + sources
6. Log to AuditLog
```

## 7. Output UI
- Left: Input text (high-risk segments highlighted)
- Center: Violated-rule cards (rule ID, source link, risk level)
- Right: Recommended revisions (multilingual concurrently)
- Bottom: 24-hour block count + reason distribution

## 8. Guardrails
- No auto-send (P5 review is mandatory)
- All review history → AuditLog
- Citations are mandatory for regulatory text (FTC 16 CFR Part 437, etc.)

## 9. Demo Scenarios
1. "Boost immunity with Nutrilite — doctors recommend it!" → MFDS / FDA violations highlighted
2. "Earn USD 10K per month at Diamond level" → FTC level-guarantee violation
3. 24-hour minor ABO sign-up block count → chart
4. Concurrent multi-country review (Korea + United States + Japan) → cross-country risk comparison
