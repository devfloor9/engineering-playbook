---
title: S8. Guardrails (Mitsukoshi)
description: Bedrock Guardrails 4 topics + duty-free regulations + minors-and-luxury guard
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S8. Guardrails
---

## 1. URL · Personas
- `/compliance` · P4

## 2. Active Policies

| Policy | Action |
|---|---|
| Violence / hate / sexual / misinformation | Block |
| Medical / legal inference | Block + guidance |
| Marketing consent not received | Block tool |
| PII | Auto-mask |
| Minors + luxury marketing | Context block |
| Duty-free ineligibility | Context block |
| Price display (Taiwan Consumer Protection Act) | Review |

## 3. Demo Scenarios
1. PII masking
2. Duty-free ineligibility simulation
3. Block minors / luxury campaign
