---
title: S8. Guardrails (Uni-President)
description: Bedrock Guardrails + PDPA + BU commercial-information segregation
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
sidebar_label: S8. Guardrails
---

## Active Policies

| Policy | Action |
|---|---|
| Violence · hate · sexual · misinformation | Block |
| Suspected medical · legal | Block + notice |
| Marketing-consent missing | Block tool use |
| **PDPA (Taiwan Personal Data Protection Act, 個資法)** | Auto-mask PII + verify cross-border-transfer consent |
| Minors + alcohol/tobacco SKUs | Block context |
| **BU commercial-information segregation** | Prohibit exposing 7ELE pricing to a Carrefour persona |
| Cold-chain unit pricing | Block external exposure |

## Demo Scenarios
1. PII masking
2. Minors + alcohol SKU blocked
3. BU segregation — P5 (7ELE) attempting to view Carrefour store unit pricing → blocked