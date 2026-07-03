---
title: 30-Minute Demo Script (AMWAY)
description: A 30-minute demonstration for AMWAY global executives and ABO meetings — Top-5 (S1 · S9-A · S10-A · S2 · S11-A)
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - industry-solution
  - retail
  - amway
  - demo
  - storytelling
  - scope:design
sidebar_label: 99. Demo Storytelling
---

> **Goal**: In 30 minutes, prove that the PoC is a working demonstration and highlight three AMWAY differentiators (ABO Tree · Subscription · Compliance).

---

## 0. Pre-demo Preparation (5 minutes, outside the slot)

| Check | Item |
|---|---|
| ✅ | All Top-5 scenarios respond within 1 minute |
| ✅ | Confirm 5 personas |
| ✅ | cohort_tag badges |
| ✅ | Multilingual chatbot responses (English and Korean simultaneously) |
| ✅ | RegulatorySignal is live |

---

## 1. Opening (3 minutes)

> "Today's demo is a working demonstration of AMWAY's three core assets — the ABO multi-level organization, recurring subscriptions, and multi-country regulations — unified in a single KG and operated by five departments from their own perspectives. **This is not a concept**; N = 1K ABOs + 5K customers + 49.5K synthetic ABO tree + four external signals are all running live."

Four key messages:
1. **ABO Tree visualization** — Five-level Downline + PV/BV + Sponsor performance on one screen
2. **Subscription lifetime** — Automated churn-signature detection + win-back campaigns
3. **Multi-country regulatory review** — FTC · Korea Door-to-Door Sales Act · MFDS · EU concurrently
4. **Department persona switcher** — One dataset, five departmental perspectives

---

## 2. Top-5 Demo (20 minutes)

### Step 1 — S1 Natural-language Semantic Search (4 minutes)
- Persona: P1 (ABO Field)
- Input: "Vegan protein + new ABO in their 30s + Instagram +20%"
- Result: SKU (Nutrilite Plant Protein) + ABO + external reviews (Reddit · Instagram)

### Step 2 — S9-A ABO Organization Visualization ⭐ (5 minutes)
- Persona: P1
- Input: "5-level Downline for one Diamond-level ABO"
- Result: cytoscape tree + PV/BV · level color coding + Sponsor performance
- Emphasis: **"AMWAY's unique core asset — a view you cannot get at other companies."**

### Step 3 — S10-A Subscription Lifetime ⭐ (5 minutes)
- Persona: P4 (CX)
- Input: "Nutrilite subscription 12-month retention + Top 100 at risk of churn"
- Result: State-machine Sankey + retention curve + win-back campaign simulation
- Emphasis: "Three churn signatures detected automatically + projected ROAS for the win-back campaign."

### Step 4 — S2 Persona Chatbot (5 minutes, switcher demo)
- P1 → "Top 10 ABOs at risk of subscription churn + recovery actions"
- P5 → Same query → "Concurrent regulatory-violation check + recommended guards"
- Emphasis: "Same data, different perspective, different action."

### Step 5 — S11-A Compliance ⭐ (3 minutes)
- Persona: P5
- Input: "Boost immunity with Nutrilite — doctors recommend it!" (high-risk ad)
- Result: MFDS · FDA violations highlighted + recommended revisions (Korean and English concurrently)
- Minor ABO sign-up: 24-hour blocked count

---

## 3. Governance & Data Trust (3 minutes)

### 3.1 cohort_tag Segmentation (30 seconds)
- 🟢 real (N = 1K ABOs + 5K customers) / 🟡 synth (49.5K tree) / 🔵 external (4 sources)

### 3.2 Guardrails (1 minute)
- Automatic blocking when consent is missing
- PII masking
- Minor + HFF advertising guards

### 3.3 AWS Stack (1 minute 30 seconds)
- Bedrock + Neptune (~700K edges) + OpenSearch (multilingual) + AgentCore + Cohere multilingual

---

## 4. Closing (4 minutes)

### 4.1 Recap (2 minutes)
> "The five scenarios you just saw are a subset of the 11. S3 insight cards, S4 persona clustering, S5 ROAS, S6 external signals, and S7 omnichannel journey all follow the same pattern."

### 4.2 Proposed Next Steps (2 minutes)

| Phase | Duration | Deliverables |
|---|---|---|
| Discovery | 2 weeks | ABO data inventory + multi-country regulatory mapping |
| PoC 8 weeks | 8 weeks | Top-5 demo (real ABOs N = 1K) |
| Expansion | +4 weeks | Full 11-scenario set + multilingual enhancement |
| Operational rollout | +8 weeks | LLMOps + multi-country launch |

---

## 5. Frequently Asked Q&A

| Question | Answer |
|---|---|
| Is ABO tree depth of 5 levels sufficient? | Optional extension to 7 levels; Neptune r6g.xlarge is recommended. |
| Multi-country regulatory review concurrently? | Automated once RegulatorySignal rulesets are registered. |
| Accuracy of subscription churn signatures? | Validated at the PoC stage (cross-validated against real-data signatures). |
| Cost? | Approximately $5K–$7K/month (including multilingual embeddings). |

---

## 6. Backup Procedures

| Failure | Response |
|---|---|
| ABO tree query latency | Fall back to a cached tree |
| Multilingual chatbot failure | Switch to Korean-only responses |
| External API (SNS) outage | Fall back to cache |
