---
title: "Ralph Loop Series: Bedrock, EKS Baseline, and Inference Optimization"
description: Evidence boundaries and the registered plan for a common-model coding-agent comparison across Bedrock and self-hosted EKS
created: "2026-10-30"
last_update:
  date: 2026-10-30
  author: devfloor9
reading_time: 12
tags:
  - benchmark
  - coding-agent
  - bedrock
  - eks
  - scope:tech
sidebar_label: "Ralph Loop Series [Measured / Planned]"
category: benchmark
---

:::caution Measurement status
Only Part 1's original 14-model dataset is published: 70 attempts and 69 completions. No verified Terra follow-up or EKS result is included. Planned stages have no throughput, latency, completion, cost, or improvement chart points.
:::

## Series

| Part | Report | Evidence |
|---|---|---|
| 1 | [Bedrock direct inference](./ralph-loop-coding-agent-bedrock.md) | Historical measurements; caching was already used |
| 2 | [EKS self-hosted baseline](./ralph-loop-coding-agent-eks.md) | Planned; optional cross-request reuse disabled |
| 3 | [EKS inference optimization](./ralph-loop-inference-optimization.md) | Planned; same model and hardware as Part 2 |

The follow-up tracks one cost-effective common model across the three stages. **Kimi K3 is a candidate, not a frozen self-hosted deployment.** Its exact checkpoint, serving compatibility, GPU capacity and complete cost must be verified before execution. Keep the historical Kimi K3 Bedrock results intact; they are not a cache-free baseline.

[Issue #216](https://github.com/devfloor9/engineering-playbook/issues/216) records an earlier Qwen3-Coder-30B-A3B-Instruct medium-model pilot and a USD 300 budget. That pilot is not evidence that a common Kimi K3 deployment fits the same footprint or budget. Do not silently substitute the pilot model or reuse its proposed GPU allocation for the common-model comparison.

## Common protocol

The registered follow-up reuses the original RealWorld task, builder/verifier prompts and independent grader. The original runner is not published in this repository; a replacement harness must not be described as the recovered one.

- Pin pi 0.87.1, Node 22.23.3, Hurl 8.0.1, container digest, prompts, loop and grader hashes.
- Use the same model for builder and verifier. Start every attempt with a fresh repository and fresh role sessions; retain repository state only between iterations.
- Predeclare five attempts per configuration. Preserve failures, partial usage and chargeable discarded work.
- Keep the 30-iteration limit, 1,200-second agent deadline and 300-second stall watchdog.
- Completion requires `.ralph-done` and all 13 Hurl files / 154 requests passing. Record grading overhead and separately flag completion beyond the agent deadline.
- Record any Bedrock Converse → OpenAI-compatible adapter difference, effective reasoning/tool settings and request configuration.

## Freeze before spending

Record a signed-off manifest with the common model/version mapping, checkpoint revision, precision, runtime image digest, tool parser, context limits, cache settings and client protocol. Bedrock model IDs and self-hosted checkpoint IDs differ; verify their mapping rather than assuming equivalent weights. If exact revision equivalence cannot be established, disclose that limit and avoid causal platform-speedup claims.

For EKS, record the pinned AI on EKS reference, Auto Mode changes, Region, private access, add-ons, bounded CPU/GPU NodePools, instance limits and resource ownership. The [registered AI on EKS reference](https://github.com/awslabs/ai-on-eks/tree/2f15e1104013c3ead5898deed5e233ff60a467cb) is a starting point; this page does not establish its current deployability or GPU availability. Explicit Auto Mode configuration is required by the registered plan.

Validate API/tool behavior, timeout/stall handling, independent grading, raw usage collection, idle deadline and cleanup before scheduling measured attempts. Preserve global configuration and unrelated resources.

## Registered optimization matrix

| Variant | Optional reuse | Attempts | State |
|---|---|---|---|
| B0 | Prefix, external KV and response caches disabled | 5 | Planned |
| P0 | Exact-prefix KV reuse only; clear reusable state before each attempt | 5 | Planned |
| P1 | Same as P0; fixed and separately costed warm-up | 5 | Planned |
| S1 | Semantic-response eligibility/correctness fixtures | Separate | Planned |

Normal within-request autoregressive KV state remains enabled in B0. Inspect the server's effective settings: omitting a prefix-cache option does not prove caching is disabled. Keep model weights resident while clearing reusable prefix state, so model loading is not confused with cache reuse.

S1 bypasses stateful and tool-enabled Ralph requests. Use held-out read-only fixtures for paraphrases, similar questions with different answers, stale versions, namespace isolation, misses and errors. Report incorrect hits and embedding/lookup overhead separately from hit ratio. S1 is not a Ralph completion result.

KV dtype changes, offload, routing, multi-replica load and combined variants need a measured bottleneck and a revised bounded matrix.

## Cost and publication gates

The earlier USD 300 pilot stops new scheduling at an estimated USD 250 and retains USD 50 for cleanup and unreported overhead. Its budget is a pilot constraint, not an authorization to expand the common-model deployment. Resolve the actual account/Region, available capacity, allocation bounds and total budget before launching that deployment.

Cost includes control plane, CPU/GPU nodes, storage, network/NAT/load balancing, observability, downloads, cache/embedding services, setup, warm-up, idle time, failed attempts, grading and teardown. Polling cannot guarantee an exact final bill; retain a cleanup reserve and enforce allocation bounds.

Publish all outcomes, completed-run medians/ranges, failure-inclusive cost per completion and full experiment cost. Zero completions give undefined medians and cost-per-completion, never zero. Raw evidence needs stage, batch, model revision, cache state, UTC window, price date and completion denominator.

Compare Part 2 → Part 3 only with fixed model, precision, hardware and client protocol. Keep historical Bedrock batches, later follow-ups and different-model pilots in named comparison groups; do not silently pool their Pareto rankings. Provider evaluations and token-price arithmetic remain separate from local task measurements.

Acceptance still requires actual runs, reconciled usage/cost, both-language reports, accessible charts/exports and verified cleanup. Keep account IDs, internal hostnames, credentials, private URLs and raw conversations out of public artifacts. Follow-up page work is tracked in [Issue #209](https://github.com/devfloor9/engineering-playbook/issues/209).
