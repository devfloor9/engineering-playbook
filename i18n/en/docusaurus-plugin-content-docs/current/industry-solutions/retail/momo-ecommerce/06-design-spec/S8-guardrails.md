---
title: S8. Guardrails (Momo)
description: Bedrock Guardrails + Live-broadcast ad language + Minors + Refund regulations
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
sidebar_label: S8. Guardrails
---

## Active Policies
| Policy | Action |
|---|---|
| Violence · Hate · Sexual · Misinformation | Block |
| Suspected medical · legal advice | Block + guidance |
| Marketing-consent not collected | Block tool |
| PII | Auto-masking |
| **Live-broadcast ad language** | LLM guard (efficacy · exaggeration review) |
| Minors + 18+ SKU | Context block |
| 7-day refund (Taiwan Consumer Protection Act) | Disclosure obligation |

## Demo Scenarios
1. PII masking
2. "Live host says 'this cosmetic is 100% effective'" → guard auto-corrects
3. Minor + alcohol SKU → blocked
