---
title: S8. Marketing Consent & PII Guardrails (AMWAY)
description: Bedrock Guardrails — 4 topics + direct selling + minors + HFF advertising guards
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S8. Guardrails
---

## 1. URL & Personas
- `/compliance` · P4 (CX), P5 (Compliance)

## 2. Active Policies

| Policy | Action |
|---|---|
| Violence · hate · sexual · misinformation (Bedrock 4 topics) | Block |
| Suspected medical / legal advice | Block + guidance |
| Sending campaigns without marketing consent | Block tool |
| PII (name, contact, card) | Auto-mask |
| Suspected minor-ABO sign-up | Block context |
| Health functional food advertising language (efficacy / treatment claims) | LLM-labeled guard |
| Direct-selling level guarantees | Auto-block |

## 3. Processing Pipeline
1. Chatbot inputs and outputs → Guardrails
2. On block: reason + policy ID
3. Auto-mask PII
4. All blocks and masks → Audit DynamoDB

## 4. Output UI
- 7 policy cards
- Real-time trace
- Daily block counts

## 5. Demo Scenarios
1. "ABO cust_001234 contact" → PII masking
2. "Minor ABO sign-up simulation" → block + reason
3. "Ads emphasizing Nutrilite efficacy" → LLM guard auto-rewrites
