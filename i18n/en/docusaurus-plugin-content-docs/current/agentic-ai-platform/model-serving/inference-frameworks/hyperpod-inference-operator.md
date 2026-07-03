---
title: HyperPod Inference Operator (Managed KV Cache and Intelligent Routing)
description: Comparing SageMaker HyperPod Inference Operator's managed KV cache, intelligent routing, and DPD with a Tiered Gateway, and clarifying its role and limitations as an L2 inference routing layer.
created: "2026-06-23"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 12
tags:
  - hyperpod
  - sagemaker
  - eks
  - vllm
  - kv-cache
  - inference
  - model-serving
  - scope:tech
keywords:
  - TieredKvcacheConfig
  - Intelligent Routing
  - Disaggregated Prefill Decode
sidebar_label: HyperPod Inference Operator
---

## Overview

Amazon SageMaker HyperPod Inference Operator is a managed component that serves LLM inference on EKS. It provides Managed Tiered KV Cache and Intelligent Routing as an EKS add-on, reducing prefill recomputation and improving throughput for vLLM-based workloads.

This document describes which layer of the [Tiered Gateway Architecture](../../model-serving/inference-routing/tiered-gateway-architecture.md) HyperPod's inference routing maps to, what differs from a full-stack gateway, and the configuration of KV cache, routing strategies, and instance requirements. The intended audience is platform engineers evaluating and configuring HyperPod inference endpoints.

## Background: Two Routing Layers of HyperPod Inference

A HyperPod inference endpoint consists of two routing layers. This distinction is the starting point for the question "is the HyperPod gateway a full-stack gateway?"

| Layer | Component | Responsibilities | Not Responsible For |
|--------|----------|------|---------------|
| **L1 (Edge)** | Application Load Balancer | TLS termination, health checks, DNS (optional Route 53 integration) | AuthN/AuthZ, rate limiting, model/provider selection |
| **L2 (Inference Routing)** | Intelligent Router (Inference Operator) | KV cache state-based Pod selection (prefix-aware, etc.) | AuthN, rate limiting, context-aware (semantic) routing |

Per-request rate limiting is handled not by the router but by a **per-Pod nginx sidecar** (the `InferenceEndpointConfig` `RequestLimits`: `maxConcurrentRequests`, `maxQueueSize`, `overflowStatusCode`). This is Pod-level (L3) control, not gateway-level policy.

## HyperPod Intelligent Router vs Tiered Gateway

The 2-Tier gateway in the [Routing Strategy document](../../model-serving/inference-routing/routing-strategy.md) separates the **L1 edge gateway** (AuthN, rate limit, TLS) and **L2 inference routing** (KV-aware Pod selection) into distinct components. The HyperPod Intelligent Router handles **only L2** of these.

| Feature | HyperPod Intelligent Router | Tiered Gateway (kgateway + EPP) |
|------|----------------------------|--------------------------------|
| KV cache-aware Pod routing | Provided (prefixaware · kvaware, etc.) | Provided (EPP `prefix-cache-scorer`) |
| Management model | AWS managed (EKS add-on) | Self-managed (K8s standard) |
| AuthN/AuthZ | Not provided (configure separately upstream) | Configured at the gateway level |
| Rate limiting | Per-Pod nginx sidecar (L3) | Token/request-based at the gateway level |
| Context-aware (semantic) routing | Not provided | Integrated with LLM Classifier · vLLM Semantic Router |
| MCP/A2A | Not provided | Integrated with agentgateway |

:::tip Key distinction
With HyperPod, the ALB (L1) and Intelligent Router (L2) are deployed together and **appear architecturally co-located**, but full-stack gateway features such as rate limiting, authentication, and semantic routing are not included. If these features are needed, a separate L1 gateway (kgateway, Kong, etc.) must be placed in front of HyperPod. In a self-managed EKS environment, the gateway and router are separate components from the start.
:::

## KV Cache Configuration: L1/L2 Cache and Routing Strategies

HyperPod's managed KV cache is configured as a **2-tier cache** in the inference endpoint settings.

- **L1 Cache**: CPU memory on each inference node. Local low-latency reuse on the node.
- **L2 Cache**: A layer shared across nodes. Choose `redis` (customer-managed) or `tieredstorage` (HyperPod-managed distributed memory) as the backend.

Configuration is performed in the KV cache spec of `InferenceEndpointConfig` by enabling `enableL1Cache` and `enableL2Cache` and specifying `l2CacheBackend`.

```yaml
# Conceptual example — verify exact field names and schema against the Operator version in use
kvCacheSpec:
  enableL1Cache: true
  enableL2Cache: true
  l2CacheSpec:
    l2CacheBackend: tieredstorage   # or redis
```

### Four Routing Strategies

Intelligent Routing sends incoming requests to the instance most likely to hold the relevant KV cache. The following strategies are provided.

| Strategy | Behavior |
|------|------|
| `prefixaware` (default) | Routes requests with the same prompt prefix to the same instance |
| `kvaware` | Routes to the instance with the highest KV cache hit rate |
| `session` | Routes requests from the same user session to the same instance |
| `roundrobin` | Distributes evenly without considering KV cache state |

The `kvaware` strategy has constraints. It works only with vLLM-based images, requires the `/completions` endpoint (`/v1/chat/completions` not supported), and needs LMCache/vLLM versions compatible with Inference Operator v3.1.3 or later.

:::caution P-type instance requirement needs verification (unconfirmed)
The requirement that managed tiered KV cache (L2 `tieredstorage`) **is created only on P-series instances has not been confirmed in the official documentation.** The part where official documentation explicitly requires an instance family is the **Disaggregated Prefill/Decode (DPD)** below, which requires EFA · GPUDirect RDMA-capable instances (`ml.p5` · `ml.p5e` · `ml.p5en` · `ml.p6-b200` · `ml.p6-b300`).

In the field, there have been reports that "the tiered KV cache configuration object is not created on non-P-type instances," but this is not reflected in public documentation. The exact question — including "since which version is it P-only" — is an open item that must be **directly verified against the Operator version in use and the actual CRD spec**. The object name (`TieredKvcacheConfig`, etc.) may also differ across versions, so re-checking the release notes at the time of application is recommended.
:::

## Disaggregated Prefill/Decode (DPD)

HyperPod introduced managed Disaggregated Prefill/Decode in v3.2 (2026-06). This is a pattern that separates prefill (compute-bound) and decode (memory-bound) so each stage can scale independently, with a strong effect on long contexts and large models (see [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) for the concept).

DPD requires **EFA · GPUDirect RDMA-capable instances** for KV cache transfer: `ml.p5.48xlarge` · `ml.p5e.48xlarge` · `ml.p5en.48xlarge` · `ml.p6-b200.48xlarge` · `ml.p6-b300.48xlarge`. For workloads with short, repetitive prompts such as search-result summarization, prefix cache reuse (see the throughput levers below) provides a more direct gain than DPD.

## Throughput (TTFT · TPS) Levers

In workloads such as search summarization where the same keywords repeat and KV cache hit rate dominates throughput, the following levers have a direct effect. For numbers and detailed configuration, see [KV Cache Optimization](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing).

| Lever | Effect | In HyperPod |
|------|------|-------------|
| Prefix cache reuse | TTFT 50–80%↓ for the same system prompt, throughput 400%+↑ | `prefixaware` / `kvaware` routing + L2 tiered cache |
| Automatic Prefix Caching (vLLM) | Skip prefill for repeated prefixes | vLLM container `--enable-prefix-caching` |
| Chunked Prefill | Balance TTFT and throughput | vLLM engine option |
| DPD | Improves tail latency for long contexts | v3.2 managed (requires EFA P5/P6) |

The routing decision (prefix hash lookup) is not inference; only the final workload is inference. For this distinction, see [the routing note in the KV Cache Optimization document](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing).

## Fit and Limitations

| Aspect | Details |
|------|------|
| **Good fit** | Minimal ops staffing, automatic node recovery and governance, vLLM-based serving, leveraging AWS-managed KV cache |
| **Backend constraints** | vLLM only. `kvaware` only `/completions`. If TensorRT-LLM performance ceiling is required, consider self-managed options such as Dynamo |
| **Gateway features** | AuthN, rate limiting, semantic routing, and MCP not included → configure a separate L1 gateway upstream |
| **Cost** | +15–20% instance premium over EC2 (e.g., `ml.p5` $66 vs `p5` $55, us-east-1, 2026-06). Auto-recovery and governance can raise utilization and offset this |
| **Availability** | Verify region and instance-family availability. P-series often has supply constraints |

> Managed KV cache and intelligent routing went GA in 2025-11, and DPD was introduced in v3.2 (2026-06). Features and versions should be reconfirmed against the [HyperPod inference release notes](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) at the time of application.

## References

### Official Documentation
- [SageMaker HyperPod — Caching and Routing](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html) — Managed tiered KV cache (L1/L2) and the four routing strategies
- [SageMaker HyperPod — Disaggregated Prefill and Decode](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-dpd.html) — DPD and EFA-capable instance requirements
- [SageMaker HyperPod — Request Limits](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html) — Per-Pod nginx sidecar-based request limits
- [SageMaker HyperPod Inference Release Notes](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) — Feature introduction history by version

### Related Documents (Internal)
- [Tiered Gateway Architecture](../../model-serving/inference-routing/tiered-gateway-architecture.md) — Definition of Tier 1 / Tier 2 gateway layers
- [Inference Gateway Routing Strategy](../../model-serving/inference-routing/routing-strategy.md) — L2 option comparison (EPP vs HyperPod vs Dynamo), multi-region considerations
- [KV Cache Optimization](../inference-optimization/kv-cache-optimization.md) — Cache-Aware Routing, throughput levers, routing≠inference distinction
- [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) — Prefill/Decode disaggregation architecture
