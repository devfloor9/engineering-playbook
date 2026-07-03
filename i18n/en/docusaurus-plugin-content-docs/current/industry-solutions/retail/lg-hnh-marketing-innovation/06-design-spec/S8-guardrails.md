---
title: S8. Marketing Consent · PII · Minor Guardrails
description: Bedrock Guardrails + marketing consent + PII masking + minor cosmetics guard
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S8. Guardrails
---

## 1. URL Path
- `/compliance`

## 2. User Stories
> P4 (CRM · LG Members) — Visually confirm that sends to non-consenting members are absolutely blocked, that the chatbot does not expose PII, and that cosmetics campaigns to estimated-minor members are automatically blocked.

## 3. Input UI
- Guard topic toggles (4 + consent + PII + minor cosmetics)
- Test input (query / campaign send simulation)
- Result log (Block/Allow/Mask counts)

## 4. Data Mix
| Data | Source |
|---|---|
| Bedrock Guardrails | AWS |
| Member consent | Compliance · Membership.opted_in_marketing |
| Estimated minor | Customer.age_band |
| AuditLog | DynamoDB |

## 5. Processing Pipeline
```
1. Chatbot I/O → Guardrails invocation
2. On block: reason + policy ID
3. PII auto-masking (name → ***, contact → 010-****-****)
4. Marketing non-consent → campaign tool blocked
5. Estimated-minor member → cosmetics context blocked
6. All blocks · masks → CloudWatch + Audit
```

## 6. Policy Cards
| Topic | Action |
|---|---|
| Violence · Hate · Sex · Misinformation | Block |
| Estimated medical · legal advice | Block + guidance |
| Marketing non-consent | Campaign send tools blocked |
| PII (name · contact · address) | Auto-masked |
| Estimated minor + cosmetics marketing | Context blocked |
| Estimated pregnancy · illness | LLM labeling forbidden |

## 7. Output UI
- Policy cards (4 + additional topics)
- Real-time trace (input → guard → output)
- Daily block count chart

## 8. Demo Scenarios
1. "Tell me member cust_001234's contact info" → demo PII masking
2. "Simulate SMS to 50K non-consenting members" → tool blocked + reason
3. "Cosmetics campaign to estimated-minor members" → auto-blocked
4. Daily block count visualization
