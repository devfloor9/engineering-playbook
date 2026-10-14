---
title: HyperPod Inference Operator (Managed KV Cache and Intelligent Routing)
description: Comparing SageMaker HyperPod Inference Operator's managed KV cache, intelligent routing, and DPD with a Tiered Gateway, and clarifying its role and limitations as an L2 inference routing layer.
created: "2026-06-23"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 29
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

Amazon SageMaker HyperPod Inference Operator is a managed component that serves LLM inference on an **EKS-orchestrated HyperPod cluster**. It is not a general-purpose add-on you install on any EKS cluster: you must first have a HyperPod cluster created with Amazon EKS orchestration, and you install the operator as the `amazon-sagemaker-hyperpod-inference` EKS add-on. Before installation, the cluster needs supporting infrastructure (AWS Load Balancer Controller, Amazon S3 and FSx CSI drivers, KEDA, and cert-manager). The operator then provides Managed Tiered KV Cache and Intelligent Routing, reducing prefill recomputation and improving throughput for vLLM-based workloads. For the exact prerequisites and installation steps, see the [HyperPod model deployment setup guide](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-setup.html).

This document describes which layer of the [Tiered Gateway Architecture](../../model-serving/inference-routing/tiered-gateway-architecture.md) HyperPod's inference routing maps to, what differs from a full-stack gateway, and the configuration of KV cache, routing strategies, and instance requirements. The intended audience is platform engineers evaluating and configuring HyperPod inference endpoints.

## Background: Two Routing Layers of HyperPod Inference

:::info Applicable version range
The two-layer (ALB + Intelligent Router) configuration this section describes corresponds to the **operator-only architecture** (Operator v3.5 / add-on v1.6.0-eksbuild.1 and earlier, including the 2026-06 v3.2 this document is based on). Starting with Operator v3.6 / add-on `v2.0.0-eksbuild.2` (released 2026-09-10), a **managed Inference Gateway** adds model-aware (LLM-aware) routing and optional JWT authentication. That is covered separately in [Managed Inference Gateway (v3.6+)](#managed-inference-gateway-v36) below.
:::

A HyperPod inference endpoint consists of two routing layers. This distinction is the starting point for the question "is the HyperPod gateway a full-stack gateway?"

**Table 1. The two routing layers of a HyperPod inference endpoint and what each handles**

| Layer | Component | Handled in this guide's configuration | Not handled in this guide's configuration |
|--------|----------|------|---------------|
| **L1 (Edge)** | Application Load Balancer | TLS termination, health checks, DNS (optional Route 53 integration) | Model/provider selection |
| **L2 (Inference Routing)** | Intelligent Router (Inference Operator) | KV cache state-based Pod selection (prefix-aware, etc.) | AuthN, concurrency limiting, context-aware (semantic) routing |

The last column reflects **the architectural placement this guide chooses, not a capability limit.** For example, the ALB itself can perform OIDC/Cognito authentication through the `authenticate-oidc` and `authenticate-cognito` actions on an HTTPS listener ([Authenticate users with an ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html)), so whether authentication lives on the ALB or on an upstream gateway is a design choice. This guide's operator-only configuration assumes no authentication is configured on the ALB.

Request admission is handled not by the router but by a **per-Pod nginx sidecar**. This control is not per-time-rate limiting (RPS); it is a **concurrency cap with an admission queue**. Configure it in `worker.requestLimits` of the `InferenceEndpointConfig`: `maxConcurrentRequests` (the maximum number of requests a Pod processes concurrently), `maxQueueSize` (how many requests to queue once the cap is reached), and `overflowStatusCode` (the status code returned when the cap and queue are exceeded; default 429). When the cap is reached, a request waits in the queue (up to 60 seconds) if one is configured, or is rejected immediately with `overflowStatusCode` if the queue is full or absent. This is Pod-level (L3) control, not gateway-level policy.

:::caution Prerequisite: `metrics.enabled: true`
To apply request limits, metrics must be enabled on the deployment. The nginx sidecar proxy that actually enforces the limits is created only when `metrics.enabled: true`, so if metrics are off, specifying `requestLimits` has no effect ([Request Limits documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html)).
:::

## HyperPod Intelligent Router vs Tiered Gateway

The 2-Tier gateway in the [Routing Strategy document](../../model-serving/inference-routing/routing-strategy.md) separates the **L1 edge gateway** (AuthN, rate limit, TLS) and **L2 inference routing** (KV-aware Pod selection) into distinct components. The comparison below is based on the Intelligent Router in the **operator-only architecture** (with the managed Inference Gateway not enabled, i.e. handling only L2).

**Table 2. Feature comparison of the HyperPod Intelligent Router and a Tiered Gateway**

| Feature | HyperPod Intelligent Router (operator-only) | Tiered Gateway (kgateway + EPP) |
|------|----------------------------|--------------------------------|
| KV cache-aware Pod routing | Provided (prefixaware · kvaware, etc.) | Provided (EPP `prefix-cache-scorer`) |
| Management model | AWS managed (EKS add-on) | Self-managed (K8s standard) |
| AuthN/AuthZ | Not provided (configure separately upstream, or use the optional JWT of the v3.6+ managed gateway) | Configured at the gateway level |
| Concurrency limiting (request admission) | Per-Pod nginx sidecar (L3) | Token/request-based at the gateway level |
| Context-aware (semantic) routing | Not provided | Integrated with LLM Classifier · vLLM Semantic Router |
| MCP/A2A | Not provided | Integrated with agentgateway |

:::tip Key distinction (operator-only architecture)
In an operator-only configuration with the managed Inference Gateway not enabled, the ALB (L1) and Intelligent Router (L2) are deployed together and **appear architecturally co-located**, but — apart from concurrency limiting — full-stack gateway features such as authentication and semantic routing are not part of the L2 router itself. If these features are needed, place a separate L1 gateway (kgateway, Kong, etc.) in front of HyperPod, or enable the managed Inference Gateway (v3.6+) below. In a self-managed EKS environment, the gateway and router are separate components from the start.
:::

## Managed Inference Gateway (v3.6+) {#managed-inference-gateway-v36}

Starting with Operator v3.6 / add-on `v2.0.0-eksbuild.2` (2026-09-10), HyperPod provides a **managed Inference Gateway**. Unlike the Intelligent Router above (which selects Pods by KV cache state), this is a **model-aware (LLM-aware) routing layer** that reads the `model` field from the request body to distribute traffic across multiple models. It builds on the operator rather than replacing it and is installed through the same `amazon-sagemaker-hyperpod-inference` add-on. You opt a model in with `spec.inferenceGateway.enabled: true` on its `InferenceEndpointConfig` (mutually exclusive with `intelligentRoutingSpec.enabled` on the same model).

Compared with the operator-only architecture, two things change:

- **Optional request authentication**: You can configure JWT bearer-token authentication through `spec.auth.jwt` on the `InferenceGatewayConfig`. However, **the default is no authentication**. When `spec.auth` is omitted, the gateway accepts any request and access is restricted only by your VPC/network controls. AWS strongly recommends enabling JWT authentication on every gateway.
- **Broader model-server support**: The gateway's Endpoint Picker supports both vLLM and SGLang (`engineType: vllm | sglang` on a scheduler). Managed KV cache and `kvaware` routing, by contrast, remain vLLM-only (see below).

Features the gateway does not provide (per-time rate limiting, semantic routing, MCP/A2A integration, etc.) must still be supplied by an upstream L1 gateway. For the full schema and installation steps, see the [Inference Gateway documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html).

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

**Table 3. The four strategies Intelligent Routing provides and their behavior**

| Strategy | Behavior |
|------|------|
| `prefixaware` (default) | Routes requests with the same prompt prefix to the same instance |
| `kvaware` | Routes to the instance with the highest KV cache hit rate |
| `session` | Routes requests from the same user session to the same instance |
| `roundrobin` | Distributes evenly without considering KV cache state |

The `kvaware` strategy has constraints. It works only with vLLM-based images, and you must set `invocationEndpoint` to `/completions` in the deployment manifest (`/v1/chat/completions` is not supported). This endpoint constraint applies only to `kvaware`; the other strategies (`prefixaware`, `session`, `roundrobin`) work with any invocation endpoint.

Compatible LMCache/vLLM versions come in **two supported combinations** depending on the Operator version. v3.1.3 is not a minimum requirement: the official compatibility matrix lists a lower-version combination as supported as well.

**Table 4. Compatible LMCache and vLLM version combinations by Operator version**

| Inference Operator | Amazon EKS Add-on | LMCache Image | vLLM Image |
|------|------|------|------|
| `>= v3.1.3` (recommended) | `>= v1.2.1-eksbuild.1` | `>= v0.4.3` | `>= v0.19.1` |
| `< v3.1.3` | `< v1.2.1-eksbuild.1` | `v0.3.9post2` | `v0.11.1` |

AWS recommends using `v3.1.3` or later (with the corresponding LMCache/vLLM versions), which improves the robustness of KV-aware routing with tensor parallelism, better failure handling, and cache worker registration ([Caching and Routing documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html)).

:::caution P-type instance requirement needs verification (unconfirmed)
The requirement that managed tiered KV cache (L2 `tieredstorage`) **is created only on P-series instances has not been confirmed in the official documentation.** The part where official documentation explicitly requires an instance family is the **Disaggregated Prefill/Decode (DPD)** below, which requires EFA · GPUDirect RDMA-capable instances (`ml.p5` · `ml.p5e` · `ml.p5en` · `ml.p6-b200` · `ml.p6-b300`).

In the field, there have been reports that "the tiered KV cache configuration object is not created on non-P-type instances," but this is not reflected in public documentation. The exact question — including "since which version is it P-only" — is an open item that must be **directly verified against the Operator version in use and the actual CRD spec**. The object name (`TieredKvcacheConfig`, etc.) may also differ across versions, so re-checking the release notes at the time of application is recommended.
:::

## Disaggregated Prefill/Decode (DPD)

HyperPod introduced managed Disaggregated Prefill/Decode in v3.2 (2026-06). This is a pattern that separates prefill (compute-bound) and decode (memory-bound) so each stage can scale independently, with a strong effect on long contexts and large models (see [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) for the concept).

DPD requires **EFA · GPUDirect RDMA-capable instances** for KV cache transfer: `ml.p5.48xlarge` · `ml.p5e.48xlarge` · `ml.p5en.48xlarge` · `ml.p6-b200.48xlarge` · `ml.p6-b300.48xlarge`. For workloads with short, repetitive prompts such as search-result summarization, prefix cache reuse (see the throughput levers below) provides a more direct gain than DPD.

## Throughput (TTFT · TPS) Levers

In workloads where the **same token prefix is reused** and KV cache hit rate dominates throughput (for example, a shared system prompt or a repeated long instruction), the following levers have a direct effect. The reuse condition is not that "the same keywords appear" but that the **tokenized prefix matches exactly, block by block.** vLLM automatic prefix caching caches only fully filled blocks and identifies them by a hash of the block's tokens plus the preceding prefix tokens, so only prefixes with an identical token sequence are reused (it does not change model outputs; see the [vLLM Automatic Prefix Caching design doc](https://raw.githubusercontent.com/vllm-project/vllm/v0.24.0/docs/design/prefix_caching.md)).

Concrete performance numbers (TTFT and throughput improvement) vary widely with model, hardware, percentile, baseline, and metric, so they are covered — together with sourced measurements — in [KV Cache Optimization](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing). The table below indicates only the direction of each lever's effect; absolute figures are not asserted without a benchmark artifact.

**Table 5. Direction of each throughput (TTFT · TPS) lever's effect and how it applies in HyperPod**

| Lever | Effect (direction) | In HyperPod |
|------|------|-------------|
| Prefix cache reuse | Skips prefill for an identical token prefix → lower TTFT, higher throughput (see the KV Cache Optimization doc for figures) | `prefixaware` / `kvaware` routing + L2 tiered cache |
| Automatic Prefix Caching (vLLM) | Skip prefill for repeated prefixes | vLLM container `--enable-prefix-caching` |
| Chunked Prefill | Balance TTFT and throughput | vLLM engine option |
| DPD | Improves tail latency for long contexts | v3.2 managed (requires EFA P5/P6) |

The routing decision (prefix hash lookup) is not inference; only the final workload is inference. For this distinction, see [the routing note in the KV Cache Optimization document](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing).

## Fit and Limitations

**Table 6. Good-fit areas and constraints of the HyperPod Inference Operator**

| Aspect | Details |
|------|------|
| **Good fit** | Minimal ops staffing, automatic node recovery and governance, vLLM-based serving, leveraging AWS-managed KV cache |
| **Backend constraints** | Managed KV cache and `kvaware`/`prefixaware` intelligent routing are **vLLM-only**, and `kvaware` supports only `invocationEndpoint: /completions`. The v3.6+ managed Inference Gateway's model-aware routing, however, supports both vLLM and SGLang (`engineType: vllm \| sglang`). If a TensorRT-LLM performance ceiling is required, consider self-managed options such as Dynamo |
| **Gateway features** | In an operator-only configuration, authentication, semantic routing, and MCP are not part of the L2 router, so an upstream L1 gateway is needed. Enabling the v3.6+ managed Inference Gateway adds optional JWT authentication (default: no auth) and model-aware routing. Per-time rate limiting, semantic routing, and MCP are still not included |
| **Cost** | Instance unit-price comparisons depend on the date, Region, and exact SKU. Earlier material cited roughly a +15–20% premium over EC2 as an example, but that figure has no verified primary price source, so for an actual evaluation compare the target SKU, Region, and date directly in [SageMaker pricing](https://aws.amazon.com/sagemaker/pricing/) and [EC2 pricing](https://aws.amazon.com/ec2/pricing/). Auto-recovery and governance can raise utilization and offset this |
| **Availability** | Verify region and instance-family availability. P-series often has supply constraints |

> Managed KV cache and intelligent routing went GA in 2025-11, and DPD was introduced in v3.2 (2026-06). Features and versions should be reconfirmed against the [HyperPod inference release notes](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) at the time of application.

## References

### Official Documentation
- [SageMaker HyperPod — Model Deployment Setup](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-setup.html) — EKS-orchestrated HyperPod cluster prerequisite and operator installation requirements
- [SageMaker HyperPod — Caching and Routing](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html) — Managed tiered KV cache (L1/L2), the four routing strategies, and the `kvaware` compatibility matrix
- [SageMaker HyperPod — Inference Gateway](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html) — v3.6+ managed model-aware gateway, optional JWT authentication, vLLM and SGLang support
- [SageMaker HyperPod — Disaggregated Prefill and Decode](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-dpd.html) — DPD and EFA-capable instance requirements
- [SageMaker HyperPod — Request Limits](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html) — Per-Pod nginx sidecar-based concurrency limits and the `metrics.enabled` prerequisite
- [SageMaker HyperPod Inference Release Notes](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) — Feature introduction history by version

### Related Documents (Internal)
- [Tiered Gateway Architecture](../../model-serving/inference-routing/tiered-gateway-architecture.md) — Definition of Tier 1 / Tier 2 gateway layers
- [Inference Gateway Routing Strategy](../../model-serving/inference-routing/routing-strategy.md) — L2 option comparison (EPP vs HyperPod vs Dynamo), multi-region considerations
- [KV Cache Optimization](../inference-optimization/kv-cache-optimization.md) — Cache-Aware Routing, throughput levers, routing≠inference distinction
- [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) — Prefill/Decode disaggregation architecture
