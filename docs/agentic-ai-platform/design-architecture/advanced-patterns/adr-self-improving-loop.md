---
title: ADR — Self-Improving Agent Loop Adoption Decision
description: Architecture Decision Record documenting principles, scope, responsibilities, and rollback boundaries to be agreed upon before introducing the Self-Improving Agent Loop to production
created: "2026-04-19"
last_update:
  date: 2026-10-13
  author: devfloor9
reading_time: 27
tags:
  - adr
  - self-improving
  - autoresearch
  - governance
  - agentic-ai
  - scope:design
sidebar_label: "ADR: Self-Improving Loop"
sidebar_position: 99
---

- **Status**: Proposed (consensus required before production deployment)
- **Related Documents**
  - Design: [Self-Improving Agent Loop](./self-improving-agent-loop.md)
  - Implementation: [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md)
  - Operations: [Cascade Routing Tuning](../../model-serving/inference-routing/cascade-routing-tuning.md)

---

## Architecture Decision Record Overview

An Architecture Decision Record (ADR) is a lightweight record format that fixes an architecturally significant decision around three elements — **Context, Decision, and Consequences**. The template originates from Michael Nygard's 2011 blog post ["Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions); later variants such as [MADR](https://adr.github.io/madr/), [adr-tools](https://github.com/npryce/adr-tools), and [arc42](https://docs.arc42.org/) have become common industry practice.

### Purpose

- **Preserve decision history** — Version-control "why we chose this structure at this point in time" alongside the code repository. This retains context longer than wiki or Slack notes, and keeps code changes and decision changes tracked together.
- **A channel for stakeholder consensus** — A `Proposed` ADR acts as a lightweight RFC that platform, security, FinOps, and compliance teams review against a single shared document.
- **Grounds for re-evaluation and rollback** — When the assumptions behind a decision no longer hold, the ADR's Context section becomes the reference point for "what must be re-evaluated."

### General Structure (Nygard original)

| Section | Role |
|---------|------|
| Title | One-line decision summary (e.g., "Self-Improving Loop Adoption Principles") |
| Status | `Proposed` / `Accepted` / `Deprecated` / `Superseded by <new ADR>` |
| Context | The background, constraints, and relevant facts that made the decision necessary |
| Decision | The agreed choice — a single decision, or multiple Decision Points |
| Consequences | The decision's positive and negative effects, trade-offs, and follow-up actions |

### This Platform's ADR Conventions

1. **Location** — Place under `design-architecture/advanced-patterns/` or a domain-specific subcategory.
2. **File name** — Use the form `adr-<topic>.md` (e.g., `adr-self-improving-loop.md`, `adr-knowledge-feature-store.md`).
3. **Frontmatter tags** — Must include `adr` and `scope:design`; add technology-stack and domain tags as needed.
4. **Status transitions** — `Proposed → Accepted → (Deprecated or Superseded)`. Update `last_update.date` on each transition.
5. **Immutability** — Do not edit the decision body after it is Accepted. To reverse a decision, **write a new ADR** and mark the existing one `Superseded by <new ADR path>`.
6. **Review procedure** — In the Proposed stage, record review approval from at least one DRI plus one relevant team lead as PR comments.

### Where This ADR Fits

This document is the ADR that fixes the **operational principles** of the [Self-Improving Agent Loop design](./self-improving-agent-loop.md). Where the design document describes "what is technically possible (the technical structure of the autoresearch loop)," this ADR seeks consensus on "**what to adopt, within which boundaries** (automation scope, responsibilities, rollback criteria)." The implementation specification is covered in the [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md).

---

## Context

In the Phase 3 documentation reorganization, two documents mapping Andrej Karpathy's autoresearch discourse to enterprise environments were added. The design (`self-improving-agent-loop.md`) and implementation (`continuous-training/`) are in draft status, and **operational principle consensus** must precede internal review.

Automated learning loops can improve models, but reward hacking, data leakage, and gaps in governance can outweigh those benefits. This ADR asks teams to agree on what the loop may automate and where human approval is required.

---

## Decision Points (Consensus Items)

### 1. Fixed Scope — Self-hosted Open-Weight Models Only (Initial Small-Model Pilot) {#1-fixed-scope--self-hosted-slm-only}

- This loop is exclusively for self-hosted open-weight models: **Qwen3 / Llama 4 / GLM-5**. These are not "small language models (SLMs)." For example, Llama 4 Scout is a mixture-of-experts model with 17B active / 109B total parameters, and Maverick with 17B active / 400B total ([Llama 4 model card](https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md), verified 2026-10-13). The loop therefore **targets** open-weight models in general, while the operational **initial pilot** starts with a small model such as Qwen3-4B (see Decision Point 7).
- Managed closed models (OpenAI GPT-4.1, Google Gemini 2.5, Anthropic Claude, etc.) are excluded from scope. Note that **Amazon Bedrock AgentCore is not a model but a framework-agnostic agent runtime (hosting environment)** ([Bedrock AgentCore Runtime docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html), verified 2026-10-13), so we do not conflate the runtime and the model endpoint into one label such as "AgentCore Claude/Nova." The exclusion criterion is "managed model providers whose weights are not accessible."
- While Ragas/LLM-judge evaluation may use shared resources, **target models receiving weight updates** are limited to self-hosted open-weight models.

**Rationale**: Closed models lack weight access and risk vendor ToS violations, so they are addressed through prompt/routing tuning rather than loop application. Open-weight models, by contrast, do provide weight access — but as Decision Points 5 and 6 describe, the obligation to review model license and data rights remains.

### 2. Loop Automation Boundary — Only 3 of 5 Stages Automated

| Stage | Automation | Human Intervention |
|-------|-----|----------|
| 1. Rollout (trace collection) | ✅ Automated | — |
| 2. Score (Reward labeling) | ✅ Automated | Weekly 1–2% manual sample verification |
| 3. Filter (data curation) | ✅ Automated | Mandatory PII scanner pass |
| 4. Train (GRPO/DPO/RLAIF) | ⚠ **Manual trigger** | Deployment engineer approval required |
| 5. Deploy (Canary) | ⚠ **Manual approval + Canary** | 10% → 50% → 100% staged gates |

**Rationale**: Unattended automation through Train/Deploy dramatically increases reward hacking risk and rollback costs. Start Train with minimum weekly cadence manual job triggers.

### 3. Reward Model Owner Designation

- Changes to reward model policy (LLM-judge prompts, Ragas weights, user feedback weights) require a **single Directly Responsible Individual (DRI)**.
- Changes require PR review + backtest results on past 30 days of traces.
- **Decision owner**: Platform MLOps Lead (TBD)

**Rationale**: Reward signals determine overall learning direction. Indiscriminate weight adjustments are the root cause of silent drift.

### 4. Data Governance — Mandatory 4-Gate Passage

Traces promoted to training data must pass the following 4 gates sequentially:

1. **PII Gate** — Detect and mask personal information with Presidio/Comprehend, and discard traces that fail detection. A scanner pass is evidence of de-identification only within a validated detection-recall range. **Amazon Comprehend's PII detection supports only English and Spanish text** ([Comprehend PII docs](https://docs.aws.amazon.com/comprehend/latest/dg/how-pii.html), verified 2026-10-13), so do not treat Comprehend alone as guaranteeing PII coverage for other languages such as Korean. Measure detection recall per target language and entity type, then state the applicable scope.
2. **Consent Gate** — Exclude traces without collection consent from training data (`consent=true` tag required). A collection-consent tag does not by itself establish authorization for **training (secondary use)**. Record purpose-specific authorization provenance for each trace ("for what purpose and processing it may be used") and confirm that training use falls within that scope.
3. **Regional Gate** — This gate is **a data-residency policy this organization proposes**: "traces collected in regulated regions (EU GDPR, KR PIPA, etc.) are used only by training jobs within the corresponding regional data boundary." GDPR and PIPA do not, by themselves, require that all training stay in-region. Where cross-border transfer is needed, permit exceptions only after legal review confirms an applicable transfer basis such as an adequacy decision or Standard Contractual Clauses ([EDPB international data transfers guide](https://www.edpb.europa.eu/sme-data-protection-guide/international-data-transfers_en), verified 2026-10-13).
4. **Confidentiality Gate** — Customer confidential/internal-only traces reflected only in internal-only models.

**Rationale**: Using traces for training without compliance team pre-review causes cost explosion for retraining-level data deletion requests.

### 5. Cost Guardrails

- **Monthly GPU-hour ceiling**: Set per environment as a pre-approved **budget ceiling**. This is not a guarantee of future price but an operational limit: "beyond this cap, no Train Job runs without explicit approval." The default proposal is **1,000 GPU-hour/month**, and any monetary conversion is valid only under stated assumptions:
  - Unit conversion: 1,000 GPU-hour × (the per-GPU Spot price for p5en.48xlarge in your region and at your point in time). A p5en.48xlarge has 8 GPUs per instance, so if you use an instance-hour price, divide by 8 to get the per-GPU-hour rate.
  - Spot prices vary by region, date, and demand, so whenever you state a monetary ceiling, also record the **query region, query date, purchase option (Spot/On-Demand), and instance type**. Each organization fixes its ceiling amount from the current [EC2 Spot price](https://aws.amazon.com/ec2/spot/pricing/) in its deployment region.
  - This figure and the monetary ceiling shown in the Korean document (≈$15K) differ because their assumptions differ. The monetary ceiling must be **recomputed and fixed by each organization using its own region/date prices**; this document does not guarantee any specific dollar amount. (The KO/EN amount mismatch is an unresolved item: the author must decide a confirmed price and then update both documents together.)
- **Auto-halt on quality degradation**: Automatic rollback if Ragas faithfulness drops 5%p or misroute rate rises 10%p after Canary deployment.
- Train job scheduling prohibited without FinOps review when ceiling breach imminent.

**Rationale**: The time one GRPO iteration takes depends on model size, batch size, number of generations, and sequence length ([TRL GRPOTrainer docs](https://huggingface.co/docs/trl/grpo_trainer), verified 2026-10-13). "Multi-hour" is an operational assumption, not a measurement tied to a stated model and batch configuration, so the actual ceiling should be re-tuned from the iteration duration measured on the target model. The point of a ceiling is to prevent budget control from becoming impossible under unlimited automation.

### 6. Rollback Boundary — Which Versions Must Allow Immediate Reversion

- **Model versions**: Retaining the last 3 generation weights in the registry is **proposed as the default rollback policy**. "Deletion prohibited" is not unconditional, however: when a model is compromised, its license is terminated or changed (e.g., a possible breach of the [Llama 4 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE) terms or Acceptable Use Policy), or security revocation is required, the weights may be deleted or quarantined **once an approved replacement version is in place**.
- **Reward model versions**: Maintaining the last 5 versions is proposed.
- **Router classifier versions**: Maintaining the last 10 versions is proposed.
- Periodically measure the reversion time to the previous generation via Game day exercises on Canary failure. Reversion time is not guaranteed merely by a version existing in the registry; measure it as the **actual service-recovery point including weight load and warmup (model loading, KV-cache/compile warmup)**. **Reversion within 5 minutes** is a target to be verified and tuned by measurement, and is not stated as a confirmed guarantee until measured.

**Rationale**: The most common failure mode in self-learning loops is "worked yesterday, broken today" pattern. Without fast reversion paths, operational risk is excessive.

### 7. Organizational Boundaries — Single Team Pilot → Platform Expansion

- Phase 1 (0–3 months): **Classifier v7 / router** only as self-learning targets. Single team pilot.
- Phase 2 (3–6 months): Expand to one specific self-hosted SLM (Qwen3-4B).
- Phase 3 (6+ months): Re-evaluate expansion to large models like GLM-5. **Separate ADR required**.

**Rationale**: Technical feasibility differs from organizational operability. Start with small scope, accumulate operational data, then expand.

---

## Consequences

### Positive
- Explicitly defined loop introduction scope, speed, and responsibilities increase predictability.
- Excluding closed models avoids dependence on provider APIs whose weights are not accessible. This does not eliminate vendor contract risk entirely: open-weight models still carry obligations to review the model license (e.g., the Llama 4 Community License terms and Acceptable Use Policy) and training-data rights, and that review continues to apply.
- 3-stage automation reduces blast radius in incident scenarios.

### Negative / Trade-offs
- Manual Train/Deploy approval sacrifices some speed advantages of "fully automated autoresearch."
- 4-gate data gates may significantly reduce initial data collection volume, slowing learning pace.
- Single DRI model risks operational disruption on personnel departure, requiring backup DRI designation.

### Next Actions

- [ ] Circulate this ADR draft to relevant leads (MLOps / Security / FinOps / Compliance).
- [ ] Designate Reward model DRI (internal platform team discussion).
- [ ] Create 4-gate data pipeline design work item → Enhance `continuous-training/trace-to-dataset.md` § Stage 3.
- [ ] Draft Game day rollback scenarios → Enhance `cascade-routing-tuning.md` § Canary rollout.
- [ ] Update status to **Proposed → Accepted** after consensus.

---

## References

### Official Documentation
- [Kubernetes Canary Deployment](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#canary-deployment) — Progressive rollout standard
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html) — Model version management reference
- [MADR (Markdown ADR)](https://adr.github.io/madr/) — Latest ADR template spec
- [adr-tools](https://github.com/npryce/adr-tools) — ADR creation/management CLI

### Papers / Tech Blogs
- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — The original ADR template proposal (2011)
- [Andrej Karpathy — autoresearch (March 2026)](https://github.com/karpathy/autoresearch) — An autonomous ML research loop project. An AI agent repeatedly edits `train.py` in a single-GPU nanochat training setup, runs fixed 5-minute training experiments, and keeps or discards changes to improve the validation metric — a self-improving loop
- [LMSYS RouteLLM](https://lmsys.org/blog/2024-07-01-routellm/) — Cascade routing classifier design
- [Langfuse OTel](https://langfuse.com/docs/opentelemetry) — Production trace standard
- [ThoughtWorks Technology Radar — Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records) — ADR industry adoption

### Related Documents (Internal)
- [Self-Improving Agent Loop Design](./self-improving-agent-loop.md) — 5-Stage Loop detailed architecture
- [Continuous Training Pipeline Implementation](../../reference-architecture/model-lifecycle/continuous-training/index.md) — Actual pipeline specifications
- [Cascade Routing Tuning Operations](../../model-serving/inference-routing/cascade-routing-tuning.md) — Canary operations guide
