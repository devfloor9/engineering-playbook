---
title: 5-Department Personas (AMWAY)
description: AMWAY global direct-selling context — ABO Field / Insights / D&A · MarTech / CX / Compliance
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - industry-solution
  - retail
  - amway
  - persona
  - agentic-ai
  - scope:design
sidebar_label: 01. Personas
---

> Five departments use the same data with their own KPIs and vocabulary. The persona switcher changes the sidebar, cards, and chatbot tone all at once.

---

## At a Glance

| Code | Department | Mission | Key KPIs | Primary Scenarios |
|---|---|---|---|---|
| **P1** | ABO Field Marketing | ABO recruitment · Upline performance · subscription expansion | New ABOs / Upline ROI / subscription reactivation rate | S1 · S2 · S5 · **S9-A** |
| **P2** | Consumer Insights | Persona · trend · LTV analysis | LTV / retention / persona share / SOV | S2 · S4 · S6 |
| **P3** | Data & MarTech | Model / data quality / multilingual operations | Model accuracy / drift / pipeline SLA | S2 · S3 · S6 |
| **P4** | Customer Experience (CRM) | ABO activity · subscription retention | NPS / active ABOs / subscription churn rate | S2 · S7 · **S10-A** |
| **P5** | Compliance & Regulatory | Direct-selling regulation · advertising · minors | Regulatory compliance rate / block count | S2 · **S11-A** |

---

## P1. ABO Field Marketing
- **Vocabulary**: ABO · Sponsor · Downline · Upline · Pyramid · subscription · PV/BV
- **Decision unit**: Weekly ABO recruitment campaigns, monthly subscription reactivation
- **Chatbot tone**: "ABOs who reached Diamond level this month and Downline activity," "Sponsor revisit recommendations"
- **Primary tools**: campaign_simulator · attribution_calc · abo_tree_query

## P2. Consumer Insights
- **Vocabulary**: Cohort · LTV · persona · SOV · trend
- **Decision unit**: Quarterly lifestyle persona definition, monthly trend reporting
- **Chatbot tone**: "Behavioral patterns of cohorts newly entering Nutrilite subscriptions," "Artistry trends on Olive Young and Dcard"
- **Primary tools**: cluster_run · social_trend_join · lookalike_expand

## P3. Data & MarTech
- **Vocabulary**: Accuracy · drift · pipeline · multilingual · RMSE
- **Decision unit**: Model release cadence · multilingual embedding quality
- **Chatbot tone**: "CTR drift in Southeast Asia recommendation models," "Multilingual embedding quality monitor"
- **Primary tools**: behavior_change_detect · neptune_query

## P4. Customer Experience (CRM)
- **Vocabulary**: Level · NPS · subscription · churn · consent
- **Decision unit**: Monthly ABO activation · subscription recovery campaigns
- **Chatbot tone**: "Top 100 ABOs at risk of subscription churn," "Channels with declining NPS and root causes"
- **Primary tools**: subscription_lifecycle · semantic_search (members)

## P5. Compliance & Regulatory
- **Vocabulary**: Direct selling · door-to-door sales law · FTC · health functional food ads · minors
- **Decision unit**: Ad review · level verification · monthly policy updates
- **Chatbot tone**: "Results of ad-language guards applied to the protein campaign," "Minor-ABO sign-up attempts blocked"
- **Primary tools**: compliance_check · pii_mask

---

## How the Persona Switcher Affects the UI

| UI Element | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| Sidebar emphasis | S1 · S2 · S5 · S9-A | S4 · S6 | S3 · S6 | S7 · S10-A | S11-A |
| Insight card sorting | ABO recruitment / PV·BV | LTV / churn / SOV | Drift / quality | Level / NPS / subscription | Block count / policy |
| Chatbot system prompt | ABO marketer tone | Trend analyst | Data scientist | Operations manager | Compliance Officer |
| Guardrail strength | Marketing consent required | PII masking | Model confidence | Consent · level | **All guards active** |

---

## Demo Tips

1. During the **S2 chatbot** step, run the same query ("Top 100 ABOs at risk of subscription churn") through P4 (CRM) and P5 (Compliance) to highlight a stark tonal contrast.
2. Run the **S9-A** ABO tree demo with the P1 (ABO Field) persona.
3. Run the **S11-A** guardrail demo with the P5 persona — "Protein advertising language verification."
