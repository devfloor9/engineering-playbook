---
title: Prefix Cache Tuning and Accuracy Correlation Validation
description: Define cached-token, turn-gap, and preemption data contracts, correlation limits, and non-inferiority quality gates for prefix cache tuning.
created: "2026-09-05"
last_update:
  date: 2026-09-18
  author: YoungJoon Jeong
reading_time: 38
tags:
  - vllm
  - langfuse
  - prometheus
  - evaluation
  - inference
  - observability
  - scope:ops
sidebar_label: Cache Tuning and Accuracy Correlation
sidebar_position: 3
category: genai-aiml
---

## 1. Overview {#overview}

This guide defines how to validate efficiency changes and quality regressions separately when tuning prefix caching. Engine hit ratio, request-level cached ratio, turn gaps, and preemption are different measurements. The intended readers are platform teams joining inference metrics with request-level evaluation. Correlation analysis identifies associations to investigate; it does not replace causal evidence that quality has been preserved.

The [Serving Optimization Monitoring Strategy](./llm-serving-optimization-monitoring.md) describes seven metric layers, score schemas, and alerts. This guide expands its cache-tuning validation procedure. See [Agent Monitoring and Operations](./agent-monitoring.md) for collection foundations and [Cache Hit Strategy](../../model-serving/inference-optimization/cache-hit-strategy.md) for cache-layer background.

**Verification scope:** Engine definitions use pinned vLLM `v0.26.0` source. Verify supported features and actual usage mappings for the deployed image separately. All numbers, tables, and code are synthetic or design examples. They contain no production measurements, customer data, or model-call results.

## 2. Background and Validation Questions {#background}

Prefix caching reuses KV for identical input prefixes and cache keys to reduce computation. Cache misses and preemption are not accuracy scores. However, a design intended to preserve output does not prove identical execution results, statistical independence from judge scores, or the absence of implementation defects.

vLLM does not guarantee reproducibility by default. Even `VLLM_BATCH_INVARIANT=1` requires checking supported hardware, models, and operations, and can have a performance cost. The same-hardware and same-vLLM-version conditions still apply. Do not treat the option as an automatic solution to every residual association ([reproducibility](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/usage/reproducibility.md), [batch invariance](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/batch_invariance.md)).

Separate two validation questions:

1. **Efficiency effect:** Did the change improve cache reuse, TTFT, throughput, or resource use through the intended mechanism?
2. **Quality constraint:** Is task-specific quality after the change within a predefined acceptable degradation margin?

Task difficulty, turn position, prompt changes, routing, timeouts, and numerical execution differences can all contribute to associations between caching and judge scores. A significant correlation neither establishes caching as the cause nor justifies excluding it by design. Aggregate correlations also cannot estimate hash-collision or implementation-defect frequency; those require controlled reproduction and diagnostic evidence.

## 3. Metric Contracts {#metric-contracts}

### 3.1 Three Cached-Ratio Definitions {#cached-ratio}

| Definition | Unit and denominator | Interpretation | Limitation |
|---|---|---|---|
| Engine hit ratio | Sum of `rate(prefix_cache_hits_total)` / sum of `rate(prefix_cache_queries_total)` | Local hit tokens among queried tokens | Not request-based; preempted re-queries use separate statistics |
| Gateway cached share | Captured cached input tokens / total input tokens for the same population | Reuse observed through the gateway | Check missing usage, provider differences, retries, and external KV scope |
| Request `cached_ratio` | Cached input tokens / total input tokens for that request | Request-level explanatory variable | Averaging request ratios does not reproduce the engine's weighted ratio |

Actual Prometheus names in the first row include the `vllm:` prefix. Use the [metrics logger](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py) and [statistics source](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/stats.py) as the definition. Keep local prefix hits separate from external KV connector hits.

The vLLM OpenAI-compatible API's `usage.prompt_tokens_details.cached_tokens` can be absent depending on options and response mode. For `v0.26.0`, check server `--enable-prompt-tokens-details` and, for streaming usage, request `stream_options.include_usage` or the server's forced-usage setting. The gateway must preserve the field for it to reach a trace. Do not replace absence with zero ([serving source](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/entrypoints/openai/chat_completion/serving.py)).

Flat Langfuse `usageDetails` uses **mutually exclusive buckets**. When `input` already excludes `input_cached_tokens`, their sum is the denominator. Include any other input buckets, such as multimodal or cache-write tokens, without overlap. Exporters do not necessarily use identical field names ([usage contract](https://langfuse.com/docs/observability/features/token-and-cost-tracking)).

The following **synthetic example** has 1,000 input tokens, including 800 cached tokens, and 100 output tokens.

```json
{
  "provider_usage": {
    "prompt_tokens": 1000,
    "prompt_tokens_details": {"cached_tokens": 800},
    "completion_tokens": 100
  },
  "normalized_usage_details": {
    "input": 200,
    "input_cached_tokens": 800,
    "output": 100,
    "total": 1100
  },
  "cached_ratio": 0.8
}
```

`800 / 200` uses the wrong denominator. The following check applies **only to a contract with exactly these two input buckets**. Preserve missing data as unknown instead of clamping inconsistent results into the 0–1 range.

```python
def cached_ratio_from_two_buckets(usage):
    keys = ("input", "input_cached_tokens")
    if any(key not in usage or usage[key] is None for key in keys):
        return None
    uncached, cached = (usage[key] for key in keys)
    if any(type(value) is not int or value < 0 for value in (uncached, cached)):
        raise ValueError("Token buckets must be non-negative integers")
    total_input = uncached + cached
    return cached / total_input if total_input else None
```

Cache matching uses final token IDs and relevant keys. Check physical `block_size`, `prefix_match_unit`, and hybrid-attention state-storage and matching constraints. A large block or short mean prompt length does not establish structural misses for every request.

### 3.2 Turn Gaps and Residency {#turn-gap}

A user conversation turn is not equivalent to every LLM observation in a session. Define `turn_index` after distinguishing tool calls, parallel branches, and retries. Separate consecutive request start times (`start_gap_s`) from the interval between previous completion and next start (`idle_gap_s`). Do not assign a simple sequential idle gap to parallel or incomplete requests.

| Histogram | Meaning | Sampling limitation |
|---|---|---|
| `vllm:kv_block_idle_before_evict_seconds` | Last touch to eviction | Not a session TTL |
| `vllm:kv_block_reuse_gap_seconds` | Gaps between block touches | Only recent gaps retained; no value for a never-reused block |
| `vllm:kv_block_lifetime_seconds` | Allocation to eviction | Excludes current lifetimes of still-resident long-lived blocks |

`--kv-cache-metrics` defaults to disabled; `--kv-cache-metrics-sample` defaults to 0.01. Log stats must be enabled. **All three report when sampled blocks are evicted**, so account for sampling, reporting delay, and observation-window censoring ([configuration](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/config/observability.py), [reporting source](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py)).

Turn-gap p95 and eviction-idle p50 describe different objects. Comparing them cannot establish that the next turn arrived before or after eviction. Boundaries in cached-ratio scatterplots may also reflect routing, load, or changed inputs. Without histograms, use request-level comparisons, controlled repeated inputs, or target-engine tracing, but do not describe them as equivalent residency measurements.

### 3.3 Preemption {#preemption}

`vllm:num_preemptions_total` counts preemption events, not unique affected requests. A request can be preempted multiple times. Separate additional computation and delay on resumption from quality outcomes.

| Path | Validation question | Evidence needed |
|---|---|---|
| KV reuse and recomputation | Expected output preservation for identical input, model, and settings | Controlled output comparisons and engine diagnostics |
| Additional waiting and deadlines | Cancellation, stream errors, or incomplete delivery after delay | Request timing, errors, and client records |
| Execution conditions | Possible batch, kernel, or scheduling effects | Fixed inputs, seeds, revisions, and supported reproducibility settings |

A metrics window attached to a request is a **concurrent interval exposure**, not proof that this request was preempted. Another request in the same window might have caused the event.

### 3.4 Outcomes {#outcomes}

Use the [score schema](./llm-serving-optimization-monitoring.md#score-schema), with separate eligibility, missing-data, and evaluator-error states. `answer_present` is not a factuality measure; `contains_expected` is a keyword check. `not_truncated=1` does not establish accuracy either. Validate the judge against reference answers, execution checks, or human evaluation, and record repeat-scoring agreement.

Report both overall incomplete-delivery rates and content quality among completed responses. Excluding incomplete responses conditions on completion and can introduce selection bias. If a difference disappears after exclusion, that does not establish truncation as its sole cause.

## 4. Cache-Tuning Controls {#tuning-levers}

| Control | Intended change | Side effects and conditions to validate |
|---|---|---|
| Cache-aware routing or session affinity | Send requests to reusable endpoints | Load concentration, different cache salts, stale indexes, queue growth |
| More replicas | Increase capacity and distribute batches | Per-engine KV size is unchanged; locality and cold caches can reduce hits |
| `gpu_memory_utilization` or concurrency | Adjust memory and scheduling headroom | KV budget versus other memory needs and throughput |
| FP8 KV dtype | Reduce storage per KV element relative to 16-bit values | Total memory is not guaranteed to halve or block count to double; validate quality, backend, and scales |
| Scaling stabilization or minimum replicas | Reduce unnecessary process replacement | Does not prevent crashes, rollouts, node replacement, or cache eviction |
| Prompt reordering or fixed serialization | Increase shared token prefixes | Whitespace and message order can change model input |
| Matching or block configuration | Change reusable boundaries | Model, backend, hybrid-cache constraints, and performance |
| Context truncation or summarization | Reduce input length and computation | Lost information and changed prefixes can alter both hit ratio and accuracy |

Routing and capacity changes intend to preserve inputs; they are not certified as accuracy-neutral without validation. Prompt, serialization, dtype, context, and model changes require direct quality gates. See the [pinned quantization guide](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/quantization/quantized_kvcache.md) for FP8 layer sensitivity and calibration constraints.

Report hit ratio, absolute cached prefill tokens, TTFT, throughput, and resource use together. The rate difference between completed-request `request_prompt_tokens_sum` and `request_prefill_kv_computed_tokens_sum` counts cached tokens, not measured GPU time savings. If TTFT does not improve, do not identify queueing as the only cause; inspect networking, tokenization, input lengths, and experimental load too.

## 5. Comparison Design and Correlation Analysis {#comparison-design}

### 5.1 Question, Degradation Margin, and Assignment Unit {#hypothesis}

When quality is the pass rate among evaluated requests, predefine `delta = p_new - p_baseline` and an acceptable degradation `margin`. A **non-inferiority** decision compares the lower confidence bound for delta with `-margin`. For two-sided equivalence, design a separate test comparing both bounds with the predefined equivalence interval ([statistical methods](https://lakens.github.io/statistical_inferences/09-equivalencetest.html)).

A statistically nonsignificant difference does not establish non-inferiority or independence. A wide confidence interval may still contain harmful degradation. Plan sample size from the baseline pass rate, margin, significance level, power, allocation, and within-session dependence. Evaluating every request with a keyword check still leaves measurement limitations and uncertainty about future traffic.

Where possible, use randomized canaries drawn from the same task distribution or paired comparisons on a fixed dataset. Splitting a session across arms interferes with history and caching, so choose an assignment unit such as the session. Record shared-engine cache and queue interference as well. Separate pools can reduce interference but require control of resource differences. Concurrent deployment alone does not remove these confounders.

### 5.2 Data Unit and Joins {#data-join}

| Field | Source | Contract |
|---|---|---|
| Logical request, attempt, observation IDs | Gateway and trace | Link retries and fallbacks as separate attempts |
| `cached_ratio`, total input and output | Normalized usage | Preserve missingness, bucket contract, and cache scope |
| `turn_index`, `start_gap_s`, `idle_gap_s` | Session and timestamps | Distinguish user turns, tools, and parallel branches |
| Model, template, tokenizer, engine revision | Deployment and trace | Distinguish treatment arm from covariates |
| Cluster, namespace, Pod, engine | Selected endpoint records | Request-to-engine attribution; access-controlled identifiers |
| `preempt_window`, KV and queue | Prometheus windows | Not request-level preemption evidence |
| Score, state, version, inclusion probability | Evaluation store | Include missing outcomes, errors, and sampling design |

Paginate observation and score list APIs, then join on keys such as observation ID and evaluator version. Aggregated Metrics API results do not replace request-level exports. Verify APIs supported by the deployed Langfuse server and use ingestion watermarks with idempotent overlapping retrieval.

The following PromQL uses a **trailing five-minute window**. Five minutes is illustrative; choose a range containing multiple scrapes. The target-label and one-source-per-engine assumptions match the [monitoring guide](./llm-serving-optimization-monitoring.md#cache-breakdown).

```promql
# Interval exposure, not a request-level preemption flag.
sum by (cluster, namespace, pod, model_name, engine) (
  increase(vllm:num_preemptions_total[5m])
) > bool 0
```

```promql
# Mean of observed gauge samples within the trailing window.
avg_over_time(vllm:kv_cache_usage_perc[5m])
```

Join windows overlapping the request's processing interval and record scrape spacing, gaps, and clock uncertainty. A future-inclusive ±1-minute window is unsuitable for online prediction; retrospective analysis must also disclose post-request event contamination. Missing series or insufficient samples mean unknown, not `preempt_window=0`. Without Pod attribution, label the value as pool-level exposure.

### 5.3 Stratification, Sampling, and Confidence Intervals {#stratification}

For exploratory correlations, consider model, task type, template, input length, turn position, time, and load. If prompt version is the treatment, do not stratify it away and remove the treatment contrast. Compare old and new versions on the same tasks or input set while matching other conditions. Equal token counts do not establish equal content or difficulty.

| Exploratory variable | Illustrative bins | Report together |
|---|---|---|
| `cached_ratio` | 0 / (0, 0.5] / (0.5, 0.9] / (0.9, 1] | Scores, pass rates, incomplete rates, sample counts, missingness |
| `idle_gap_s` | Predefined workload-specific ranges | Results by model, turn, and load; do not use eviction p50 as a TTL |
| `preempt_window` | 0 / 1 / unknown | Overall incomplete rate and quality among completed requests |

Requests clustered within sessions, templates, or time periods can make independent-sample confidence intervals too narrow. Use aggregation at the assignment unit, cluster bootstrap, or another method appropriate to the design. When judge caps or failures change inclusion probabilities, use stratified comparisons, weights, and sensitivity analysis. Predefine multiple-comparison handling and stopping rules when inspecting many bins or interim results.

The table below is a **decision-logic example** with a two-percentage-point margin and a preselected confidence level. Intervals are supplied for illustration; they were not calculated from real samples.

| Confidence interval for delta | Lower bound versus −2 pp | Quality gate |
|---|---|---|
| [−0.8 pp, +0.4 pp] | Above the limit | Non-inferiority satisfied under the defined criterion |
| [−4 pp, +1 pp] | Includes unacceptable degradation | Inconclusive; do not promote as “no difference” |
| [−5 pp, −3 pp] | Entire interval below the limit | Evidence of regression; evaluate hold or rollback criteria |

### 5.4 Interpretation {#interpretation}

| Observation | Possible explanation | Follow-up |
|---|---|---|
| Hits improve and quality criterion passes | Intended efficiency gain | Check TTFT, throughput, coverage, and side effects |
| Hits improve but quality interval is wide | Insufficient evaluation information | Collect planned additional samples or hold the change |
| Cached ratio associates with scores | Task difficulty, turn position, inputs, or execution path | Stratify and compare under control; neither assert nor exclude caching as the cause |
| Long gaps associate with lower scores | Topic change, truncation, routing, or load | Inspect content, final inputs, and target engine |
| Preemption windows show worse delivery and scores | Deadlines, saturation, concurrent events | Inspect request paths; disclose selection bias in completed-only analysis |
| The changed arm persistently degrades | Possible prompt, model, dtype, or other regression | Controlled reproduction against previous configuration; hold rollout or roll back |

An association disappearing after stratification does not establish a single cause. A remaining association does not automatically mean batch nondeterminism or hash collisions. Investigate implementation defects, unmeasured variables, and measurement errors as well.

### 5.5 Limitations {#limitations}

- Judges are not ground truth; validate agreement with humans or references and repeat-scoring stability.
- Correlation analysis cannot remove unmeasured confounding or reverse causality.
- Infrastructure windows cannot replace request-level preemption or eviction histories.
- Eviction histograms depend on sampling, reporting delay, and the observation window.
- Unrepresentative evaluation samples and excluding incomplete or missing responses can bias results.
- Non-inferiority within one period, task set, and environment does not guarantee the result for other models, loads, or inputs.

## 6. Operational Procedure {#tuning-cycle}

1. **Contract and baseline:** Verify mappings, coverage, and evaluator versions; choose a period covering representative load cycles. Twenty-four hours is an example, not a sufficiency guarantee.
2. **Experiment plan:** Record one control, assignment unit, metrics, quality margin, sampling plan, observation period, and promotion, stopping, and rollback criteria.
3. **Bounded change:** Distinguish treatment arms using concurrent or paired comparisons. Preserve previous model, template, dtype, and deployment settings for recovery.
4. **Efficiency check:** Compare hit ratio, absolute cached tokens, TTFT, throughput, resources, and supporting signals. Improvement in one metric does not establish the mechanism.
5. **Quality gate:** Check contract violations, incomplete delivery, and non-inferiority of valid evaluations. Hold when sample information or coverage is insufficient. Even changes intended to preserve input require basic contract and regression checks.
6. **Correlation audit and record:** Retain exploratory tables, confidence intervals, sample counts, missingness, configuration revisions, and recovery steps. Hold promotion and investigate unexplained regressions.

Actual cloud changes and evaluation-model calls require their own operational authorization, budget, and data-policy compliance. This guide does not claim they were executed or validated.

## 7. Summary {#summary}

Cache efficiency is not a quality score, and output-preserving design does not prove statistical independence. Measure tuning effects using correct usage denominators and request-to-engine attribution. Validate quality with a predefined degradation margin, representative samples, confidence bounds, and coverage. Correlation analysis guides investigation; promotion requires an appropriate comparison design and explicit quality criteria.

## References {#references}

### Official Documentation and Pinned Source

- [vLLM v0.26.0 prefix caching](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/design/prefix_caching.md) — Cache keys, eviction, and hash design
- [vLLM metrics logger](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py) — Metric definitions, finished-request accounting, and eviction reporting
- [vLLM statistics](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/stats.py) — Token counters and separate preempted statistics
- [vLLM CacheConfig](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/config/cache.py) — Physical blocks and prefix matching granularity
- [vLLM reproducibility](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/usage/reproducibility.md) — Reproducibility conditions
- [vLLM batch invariance](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/batch_invariance.md) — Support conditions and performance costs
- [vLLM quantized KV cache](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/quantization/quantized_kvcache.md) — FP8 and calibration constraints
- [Langfuse usage contract](https://langfuse.com/docs/observability/features/token-and-cost-tracking) — Input normalization and prevention of double counting
- [Langfuse Metrics API](https://langfuse.com/docs/metrics/features/metrics-api) — Aggregation and deployment compatibility
- [Langfuse scores](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-sdk) — Score types, observation linkage, and idempotent storage

### Research and Methods

- [Judging LLM-as-a-Judge](https://arxiv.org/abs/2306.05685) — Judge biases and comparison with human evaluation
- [Equivalence testing](https://lakens.github.io/statistical_inferences/09-equivalencetest.html) — Equivalence, non-inferiority, and nonsignificance

### Related Documents

- [Serving Optimization Monitoring Strategy](./llm-serving-optimization-monitoring.md) — Seven observability layers and quality schema
- [Cache Hit Strategy](../../model-serving/inference-optimization/cache-hit-strategy.md) — Cache layers and efficiency targets
- [KV Cache Optimization](../../model-serving/inference-optimization/kv-cache-optimization.md) — KV memory and optimization background
- [Ragas Evaluation](../governance/ragas-evaluation.md) — RAG metrics and datasets
