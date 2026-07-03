---
title: 30-Minute Demo Script
description: 30-minute demo for LG H&H Marketing executive meeting — Top-5 (S1·S2·S3·S5·S7)
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - industry-solution
  - retail
  - lg-hnh
  - demo
  - storytelling
  - scope:design
sidebar_label: 99. Demo Storytelling
---

> **Goal**: Prove within 30 minutes that the PoC is "not a concept but works in action" while conveying four values — **5-department perspectives, 3-BU integration, 4-type external signal fusion, governance**.

---

## 0. Pre-Demo Preparation (5 min, outside demo time)

| Check | Item |
|---|---|
| OK | Top-5 (S1·S2·S3·S5·S7) all respond within 1 min |
| OK | All 5 personas confirmed in sidebar order |
| OK | cohort_tag badges (green/yellow/blue) |
| OK | Chatbot SSE trace panel functional |
| OK | Backup scenarios (S4·S6·S8) validated once in advance |
| OK | External data live (social · weather · economy · competitor) |

---

## 1. Opening (3 min)

> "Today's demo is a PoC designed to solve the **department data silo and perspective gap** problem at LG H&H's Marketing Innovation Division. It is **not a concept but a working demonstration** — N=500~5,000 LG Members real data + 49.5K synthetic + **4 external signal types live** all functioning."

Four key messages:
1. **Not a concept but a working demo** — chatbot · graph · simulation all functional
2. **5-department persona switcher** — Brand Marketer / Insights / D&A / CRM · LG Members / MD
3. **3-BU integration** — Beauty + HDB + Refreshment unified into a single KG, visualizing member behavior crossing BUs · channels
4. **4-type external signal fusion** — social · weather · economy · competitor — signals invisible to first-party data alone

---

## 2. Top-5 Demo (20 min)

### Step 1 — S1. Natural-Language Semantic Search (4 min)
> "First, natural-language search. Let's enter as the Brand Marketer."

- Persona: P1 (Brand Marketer)
- Input: **"Women in 30s, sensitive scalp, prefers organic, unpurchased in the last 90 days + Olive Young rating 4.5+"**
- Result: SKU card + Member card + **first-party · Olive Young review combined card**
- Emphasis: "BM25 + embedding KNN + Reranker fused via RRF, showing **not only first-party reviews but Olive Young · X external reviews as well**. Simultaneous semantic + relational view via Neptune 1-hop graph."

### Step 2 — S2. Persona Chatbot (5 min, demo highlight)
> "Now the chatbot. Starting with the **MD persona**."

- Persona: P5 (MD · Channel Sales)
- Input: **"Top 5 channels where Perioe sales dropped this month and the cause?"**
- Right-side trace: "Autonomous invocations of channel_metrics_push → weather_join → social_trend_join"
- After answer, **switch persona to P1 (Brand Marketer)**
- Re-enter the same query
- "Same data, but the answer tone, KPIs (channel→campaign), and next actions all change. **This is the differentiator of department personas.**"

### Step 3 — S3. Insight Cards (4 min)
> "Report automation + external signal fusion."

- Persona: P3 (D&A)
- Card: **"Beauty BU monthly GMV + search trends + weather"**
- Click → AgentCore Code Interpreter generates matplotlib PNG + LLM comments
- Switch persona to P5 (MD) → same card, different comments (GMV · inventory)
- Emphasis: "**Automated cards already combining the 4 external signal types** — turn weekly reports into a one-click action."

### Step 4 — S5. Campaign ROAS Simulation (4 min)
> "Marketing ROI simulation also works."

- Persona: P1 (Brand Marketer)
- Input: Budget 100M KRW / Su:m37 new product / VIP 50K
- Result: Recommended channel mix donut + ROAS distribution violin
- Change assumption (SNS +20%) → ROAS shifts immediately
- Emphasis: "**Separating campaign effect vs. trend effect by combining search trends · SNS responses** — confidence-interval distribution rather than point estimates."

### Step 5 — S7. Omnichannel Member Journey (3 min)
> "Finally, 3-BU integration."

- Persona: P4 (CRM · LG Members)
- Input: 1 high-value member ID / 90 days
- Result: **Owned mall (Beauty) → SNS ad (HDB) → Olive Young (Beauty) → CU (Refreshment) → VIP entry** Swimlane timeline
- Emphasis: "Beauty · HDB · Refreshment data once separated are now connected into **a single KG** — member behavior crossing BUs · channels on a single timeline."

---

## 3. Governance · Data Trust (3 min)

### 3.1 cohort_tag Separation (30 sec)
- Demo result cards with green/yellow/blue badges
- "Real / Synthetic / 4 external types specified on every card"

### 3.2 Guardrails (S8) (1 min)
- "Simulate SMS to 50K non-consenting members" → tool blocked + reason
- "Member cust_001234 contact info" → PII masked
- **"Cosmetics campaign to an estimated-minor member"** → automatically blocked

### 3.3 AWS Stack 1-pager (1 min 30 sec)
- Single architecture diagram
- "Bedrock + Neptune + OpenSearch + AgentCore + Cohere — 8-week PoC feasible"

---

## 4. Closing (4 min)

### 4.1 Summary (2 min)
> "What you've seen today is 5 of the 8 scenarios. S4 (persona matching + clustering), S6 (external signal fusion), and S8 (guardrails) operate on the same pattern."

### 4.2 Next Steps (2 min)

| Stage | Duration | Deliverables |
|---|---|---|
| Discovery | 2 weeks | First-party data inventory + accessibility review of 4 external types |
| PoC 8 weeks | 8 weeks | Top-5 (real data N=500~5K) |
| Expansion | +4 weeks | Full 8-scenario set + guardrails · audit |
| Production transition | +8 weeks | LLMOps + ECS stabilization |

> "**In 8 weeks, the same demo as today is feasible with LG H&H real data.**"

---

## 5. Frequently Asked Questions

| Question | Answer Highlight |
|---|---|
| Why KG instead of plain RAG? | Plain RAG gives only semantics; KG RAG gives semantics + relations. S5 (attribution) and S7 (journey) are infeasible without KG |
| Korean morphology? | OpenSearch Nori + Cohere embed-v4 |
| Cost? | ~$4K~$6K/month for an 8-week PoC |
| What if first-party has Snowflake? | Use Glue for Snowflake → S3 sync; same architecture applies |
| External data licensing? | Public APIs primarily + PDPA · terms compliance review needed |
| Can PoC start with only some BUs? | Yes. Beauty alone follows the same pattern |
| Difference at production transition? | Same infrastructure + reinforced monitoring · LLMOps · guards |

---

## 6. Demo Failure Fallbacks

| Failure | Response |
|---|---|
| Chatbot (S2) response delay | Captured screenshot → move to next scenario |
| Neptune query failure | Bypass via S1·S3·S5 |
| External API (KMA · social) outage | Pre-cached fallback |
| Persona switcher bug | URL direct (`?persona=p1`) |

---

## 7. Post-Demo Deliverable Package

1. Demo recording (15-min edit)
2. 8-scenario design specs (`06-design-spec/`)
3. AWS single architecture diagram
4. 8-week PoC milestones + cost estimate
5. KG 25-class model (`02-ontology.md`)
6. Data ingestion guide (`04-data-sources.md`)
