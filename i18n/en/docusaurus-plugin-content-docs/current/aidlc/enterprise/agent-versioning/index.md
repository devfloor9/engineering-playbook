---
title: "Agent Versioning & Change Management"
sidebar_label: "Agent Versioning"
description: "Integrated change management system for enterprise agent prompts, models, deployment strategies, and governance"
tags: [agent-versioning, prompt-registry, canary, feature-flag, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Agent Change Management

## Why Agent Change Management is Needed

### Differences from Traditional Software Changes

In traditional software, change management targets code, configuration, and infrastructure changes. Agent systems add **probabilistic components**:

| Change Type | Traditional System | Agentic System |
|-------------|-------------------|----------------|
| **Output Determinism** | Same input → Same output | Same input → Probability distribution |
| **Regression Detection** | Unit tests, integration tests | Statistical evaluation (BLEU, Exact Match, LLM-as-Judge) |
| **Rollback Criteria** | Feature failures, performance degradation | Accuracy decline, increased hallucination, latency P99 |
| **Change Unit** | Code commits, binaries | Prompt versions, model replacement, parameter tuning |

### Why Prompts and Models Should Be Managed Like Code

1. **Prompts Are Core Logic**  
   Changing one line from "You are a financial analysis expert" → "You are a conservative investment advisor" transforms the entire output pattern.

2. **Model Replacement Is Runtime Replacement**  
   When switching GPT-4 → Claude 4.7 Sonnet, even the same prompt produces different response styles, token usage, and latency.

3. **No Tracking Means No Rollback**  
   When receiving reports like "it worked yesterday but is strange today," recovery is impossible without knowing who changed which prompt and when.

4. **Regulatory Requirements**  
   Financial, medical, and public sectors must maintain audit records of "which prompt version and model version generated this response."

---

## 3-Tier Change Management System

Agent change management consists of three layers:

### 1. Prompt & Model Registry

Central repository managing prompt and model versions like code. Uses Langfuse, Bedrock Prompt Management, PromptLayer, etc. for version control, labeling, and change history tracking.

**[View Prompt & Model Registry Details →](./prompt-model-registry.md)**

### 2. Deployment Strategies

Progressive deployment strategies including Shadow Testing, Canary Rollout, A/B Testing, Blue-Green Deployment, and Feature Flag-based rollout approaches.

**[View Deployment Strategies Details →](./deployment-strategies.md)**

### 3. Governance & Automation

Regression detection, automatic rollback, approval workflows, audit trails, and AIDLC stage-specific application approaches.

**[View Governance & Automation Details →](./governance-automation.md)**

---

## Core Principles

1. **All Changes Are Version Controlled**: Prompt, model, and parameter changes must be traceable like Git commits.
2. **Progressive Deployment**: Don't change all traffic at once. Canary → gradual expansion.
3. **Automatic Regression Detection**: Immediately detect performance degradation through Golden Dataset evaluation + real-time metric monitoring.
4. **Fast Rollback**: Mechanism to recover within 1 minute when issues occur is essential.
5. **Audit Evidence**: 7-year retention system for financial, medical, and public sector regulatory compliance.

---

## Related Documents

import DocCardList from '@theme/DocCardList';

<DocCardList />

---

## AIDLC Related Documents

- [Evaluation Framework](../../toolchain/evaluation-framework.md) — Golden Dataset-based regression detection
- [Agent Monitoring](../../../agentic-ai-platform/operations-mlops/agent-monitoring.md) — Real-time observability

---

## Next Steps

Once you've established the change management process:

1. **[Prompt & Model Registry](./prompt-model-registry.md)** — Select and build Langfuse/Bedrock PM
2. **[Deployment Strategies](./deployment-strategies.md)** — Choose appropriate strategy among Canary/Shadow/A-B
3. **[Governance & Automation](./governance-automation.md)** — Build automatic regression detection and rollback system
