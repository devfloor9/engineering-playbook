---
title: "Ralph Loop Part 2: EKS Self-Hosted Baseline"
description: Planned common-model EKS baseline with explicit cache settings, reproducibility and complete cost gates
created: "2026-10-30"
last_update:
  date: 2026-10-30
  author: devfloor9
reading_time: 5
tags:
  - benchmark
  - coding-agent
  - eks
  - scope:tech
sidebar_label: "Ralph Part 2. EKS Baseline [Planned]"
category: benchmark
---

**Series:** [Index](./ralph-loop-series.md) · [Part 1: Bedrock](./ralph-loop-coding-agent-bedrock.md) · **Part 2: EKS baseline** · [Part 3: optimization](./ralph-loop-inference-optimization.md).

:::caution Planned — no measured results
The common-model checkpoint, runtime, GPU allocation, Region/capacity and total budget are not frozen. No deployment or measured performance is established by this page. Kimi K3 is a candidate; the earlier Qwen medium-model pilot is a separate scope.
:::

## Baseline contract

Use the [series protocol and publication gates](./ralph-loop-series.md#common-protocol). Before execution, freeze the common model mapping, exact checkpoint, precision, hardware, runtime image, tool parser, context and client configuration. Verify the AI on EKS reference deltas and Auto Mode setup. Preserve unrelated resources and global configuration.

The B0 variant disables optional cross-request prefix reuse, external KV reuse, exact-response caching and semantic-response caching. Normal within-request KV state remains enabled. Record effective server settings and a cache-state check; an omitted flag alone does not prove cache-off behavior.

Five predeclared fresh attempts use the original task, prompts, runner and independent grader. Retain all outcomes and usage, including failures, timeout/stall stops, grading overhead and work beyond the deadline.

## Required evidence

| Evidence | Status |
|---|---|
| Model/runtime/resource manifest | Pending |
| Private endpoint and API/tool/grader preflight | Not run |
| B0 five-attempt batch | Not run |
| Full allocation and cost timeline | Not available |
| Cleanup confirmation | Not available |

The operating cost includes setup, downloads, model loading, warm-up, idle time, CPU/GPU nodes, EKS control plane, storage, networking, failures and teardown. GPU utilization is not a billing discount. Resource bounds, idle deadline, cleanup reserve and the approved total budget must be set before provisioning.

Report completed-run medians/ranges and cost per completion including failed attempts. Keep any unknown Bedrock/self-hosted revision difference explicit. Different-model rows are configuration trade-offs, not a causal platform speedup. Results enter the charts only after raw records, independent grading and complete costs reconcile.

Continue to [Part 3's controlled cache variants](./ralph-loop-inference-optimization.md) after B0 is verified. Execution and evidence remain tracked in [Issue #216](https://github.com/devfloor9/engineering-playbook/issues/216).
