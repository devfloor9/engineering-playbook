---
title: "ADR — Self-Improving Agent Loop Adoption Decision"
sidebar_label: "ADR: Self-Improving Loop"
description: "Architecture Decision Record documenting principles, scope, responsibilities, and rollback boundaries to be agreed upon before introducing the Self-Improving Agent Loop to production"
created: 2026-04-19
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 5
tags:
  - adr
  - self-improving
  - autosearch
  - governance
  - agentic-ai
  - scope:design
sidebar_position: 99
---

- **Status**: Proposed (consensus required before production deployment)
- **Date**: 2026-04-19
- **Related Documents**
  - Design: [Self-Improving Agent Loop](./self-improving-agent-loop.md)
  - Implementation: [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md)
  - Operations: [Cascade Routing Tuning](../../reference-architecture/inference-gateway/cascade-routing-tuning.md)

---

## Context

In the Phase 3 documentation reorganization, two documents mapping Andrej Karpathy's autosearch discourse to enterprise environments were added. The design (`self-improving-agent-loop.md`) and implementation (`continuous-training/`) are in draft status, and **operational principle consensus** must precede internal review.

While automated learning loops are technically appealing, in enterprise environments the risk of losses from reward hacking, data leakage, and governance gaps exceeding benefits is significant. This ADR serves as meeting material for agreeing on "what to automate and where to draw boundaries."

---

## Decision Points (Consensus Items)

### 1. Fixed Scope — Self-hosted SLM Only

- This loop is exclusively for self-hosted open-weight models: **Qwen3 / Llama 4 / GLM-5**.
- Excludes managed closed models (Bedrock AgentCore Claude/Nova, OpenAI GPT-4.1, Gemini 2.5).
- While Ragas/LLM-judge evaluation may use shared resources, **target models receiving weight updates** are limited to self-hosted models.

**Rationale**: Closed models lack weight access and risk vendor ToS violations. Address through prompt/routing tuning rather than loop application.

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

1. **PII Gate** — Mask personal information with Presidio/Comprehend. Discard failed traces.
2. **Consent Gate** — Exclude traces without collection consent from training data (`consent=true` tag required).
3. **Regional Gate** — Traces from regulated regions (EU GDPR, KR PIPA) only used by training jobs within corresponding regional data boundaries.
4. **Confidentiality Gate** — Customer confidential/internal-only traces reflected only in internal-only models.

**Rationale**: Using traces for training without compliance team pre-review causes cost explosion for retraining-level data deletion requests.

### 5. Cost Guardrails

- **Monthly GPU-hour ceiling**: Pre-specified per environment (default proposal: 1,000 GPU-hour/month on p5en Spot, ~$15K ceiling).
- **Auto-halt on quality degradation**: Automatic rollback if Ragas faithfulness drops 5%p or misroute rate rises 10%p after Canary deployment.
- Train job scheduling prohibited without FinOps review when ceiling breach imminent.

**Rationale**: One GRPO iteration requires multi-hour GPU usage. Unlimited automation makes budget management impossible.

### 6. Rollback Boundary — Which Versions Must Allow Immediate Reversion

- **Model versions**: Retain last 3 generation weights in registry (deletion prohibited).
- **Reward model versions**: Maintain last 5 versions.
- **Router classifier versions**: Maintain last 10 versions.
- Periodically conduct Game day exercises verifying **automatic reversion within 5 minutes** to previous generation on Canary failure.

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
- Excludes closed models, avoiding vendor contract risks.
- 3-stage automation reduces blast radius in incident scenarios.

### Negative / Trade-offs
- Manual Train/Deploy approval sacrifices some speed advantages of "fully automated autosearch."
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

### Papers / Tech Blogs
- Andrej Karpathy — "LLMs doing autosearch" (2026 Q1 discourse)
- [LMSYS RouteLLM](https://lmsys.org/blog/2024-07-01-routellm/) — Cascade routing classifier design
- [Langfuse OTel](https://langfuse.com/docs/opentelemetry) — Production trace standard

### Related Documents (Internal)
- [Self-Improving Agent Loop Design](./self-improving-agent-loop.md) — 5-Stage Loop detailed architecture
- [Continuous Training Pipeline Implementation](../../reference-architecture/model-lifecycle/continuous-training/index.md) — Actual pipeline specifications
- [Cascade Routing Tuning Operations](../../reference-architecture/inference-gateway/cascade-routing-tuning.md) — Canary operations guide
