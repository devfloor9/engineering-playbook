---
title: Industry Solutions
description: Industry-validated PoC patterns and working demo assets — Retail, Energy, Financial Services, Manufacturing, and more.
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - scope:nav
sidebar_label: Industry Solutions
---

> Industry-validated PoC patterns and demo assets. While other sections of the Engineering Playbook focus on "how to build it (How)," this section focuses on **"what value to show customers and how (What/Why)."**

---

## Categories

### Retail
Comprehensive e-commerce, large-scale offline retail, household goods, beauty, beverages manufacturing-distribution, and other retail industry domains.

- **[LG H&H Marketing Innovation PoC](./retail/lg-hnh-marketing-innovation/)** — Integrated marketing innovation PoC across 3 BUs (Beauty + HDB + Refreshment). First-party data + 4 external signals × Ontology + Agentic AI 8-scenario demo.

### Energy (Planned)
Refining, gas station network memberships, and campaigns.

### Financial Services (Planned)
Integrated PoC patterns for banking, cards, and securities data.

### Manufacturing (Planned)
Manufacturing OEE, SCM, and customer integration.

---

## Common PoC Patterns

All Industry Solutions leverage the following shared assets:

1. **Knowledge Graph (Neptune, openCypher)** — 25-class domain model
2. **Hybrid Search (OpenSearch + Cohere embed/rerank + Bedrock)** — BM25 + KNN + RRF + Rerank
3. **Persona Switcher** — Same data, recomposed through each department's lens
4. **Agentic AI (Bedrock Sonnet 4.6 + AgentCore)** — Autonomous tool invocation + Memory + Code Interpreter
5. **Cohort Separation** — Real data + synthetic data + external signals separated via `cohort_tag`
6. **Bedrock Guardrails** — 4 topics + marketing consent + PII + industry-specific guards

---

## Use Cases

- Demo assets for customer meetings (30-minute demo path)
- Industry-specific references for PoC proposals
- Solution architecture (SA) sales enablement material
- Pattern reuse when entering new industries

---

## Design Principles

| Principle | Meaning |
|---|---|
| **Public-information based** | No dependency on customer-confidential materials — anyone can verify |
| **Working demos, not concepts** | Real data + synthetic + external live signals combined |
| **7–10 scenarios** | Not too many; each scenario specifies its data mix |
| **5 department personas** | Recomposing the same data through different lenses — the core differentiator |
| **Single architecture suitable for an 8-week PoC** | Decision trade-offs are separate; the PoC stays simple |
