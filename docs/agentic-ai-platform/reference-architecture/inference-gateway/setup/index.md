---
title: Inference Gateway Deployment Guide
description: Step-by-step deployment guide for kgateway-based Inference Gateway (basic/advanced/troubleshooting)
created: "2026-04-18"
last_update:
  date: 2026-10-28
  author: devfloor9
reading_time: 13
tags:
  - inference-gateway
  - kgateway
  - deployment
  - scope:impl
sidebar_label: Inference Gateway Deployment
sidebar_position: 4
---

import { useColorMode } from '@docusaurus/theme-common';
import { useEffect, useRef } from 'react';

export const InferencePipelineDiagram = () => {
  const { colorMode } = useColorMode();
  const iframeRef = useRef(null);
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'theme-change', theme: colorMode },
        '*'
      );
    }
  }, [colorMode]);
  return (
    <iframe
      ref={iframeRef}
      src={`/engineering-playbook/agentic-platform-architecture.html?theme=${colorMode}`}
      style={{width: '100%', height: '1600px', border: 'none', borderRadius: '12px'}}
      title="Production Inference Pipeline Architecture"
      loading="lazy"
    />
  );
};

This document covers **production deployment procedures** for kgateway + Bifrost-based inference gateway. For architecture concepts and routing strategies (Cascade, Semantic Router, 2-Tier structure), refer to [Inference Gateway Routing](../../../model-serving/inference-routing/routing-strategy.md).

:::info Guide Structure
This guide consists of 3 documents. Learn sequentially or reference specific sections as needed.
:::

## Production Inference Pipeline Reference Architecture

The complete request flow of an EKS-based production inference pipeline. CloudFront (WAF/Shield) → NLB → kgateway receives inbound traffic, after which you compose one of two routing paths **by purpose**.

- **L1 — across-model proxy / governance**: Bifrost (or the LLM Classifier) abstracts external/internal models and provides cascade, cost tracking, and semantic cache. It decides "which *model*." → [Basic Deployment](./basic-deployment.md) · [Advanced Features](./advanced-features.md)
- **L2 — within-model KV-aware routing**: the Gateway API Inference Extension (InferencePool + EPP) selects a Pod based on vLLM metrics (KV cache and load). It decides "which *Pod*." → [Advanced Features: Inference Extension](./advanced-features.md#inference-extension)

The two layers are not exclusive and can be used together (L1 → L2 → vLLM). For the layer definitions and selection criteria, refer to [Routing Strategy](../../../model-serving/inference-routing/routing-strategy.md#two-routing-layers--keep-them-distinct).

:::note About the reference architecture diagram
The diagram below is a **target (reference) architecture** that includes L1 (Bifrost), L2 (llm-d EPP), and observability all together. An actual deployment selects and composes the two paths above; when KV-aware (L2) is needed, follow the InferencePool + EPP procedure in the [Inference Extension section](./advanced-features.md#inference-extension).
:::

<InferencePipelineDiagram />

---

## Deployment Stages Overview

### [Basic Deployment](./basic-deployment.md) (Required)

Configure kgateway + HTTPRoute + Bifrost behind a single NLB endpoint to complete basic inference pipeline.

**Includes:**
- kgateway installation and Gateway API CRD configuration
- GatewayClass, Gateway, HTTPRoute resource definitions
- Cross-namespace access via ReferenceGrant
- Bifrost Gateway Mode configuration (config.json + PVC)
- provider/model format and IDE compatibility (Aider, Cline, Continue.dev)
- config.json change procedure (restart-based reconciliation, preserves stored config)

**Learning Time:** 30 min | **Deployment Time:** 45 min

---

### [Advanced Features](./advanced-features.md) (Optional)

Add prompt-based automatic routing, production security layer, and Semantic Caching to enhance cost optimization and security.

**Includes:**
- LLM Classifier deployment (prompt-based SLM/LLM automatic branching)
- **Gateway API Inference Extension (InferencePool + EPP)** — KV-aware (L2) routing
- CloudFront + WAF/Shield security layer
- Semantic Caching implementation options (GPTCache, RedisVL, Portkey, Helicone)

**Learning Time:** 45 min | **Deployment Time:** 60-90 min

---

### [Troubleshooting](./troubleshooting-guide.md) (Reference)

Common issues and solutions during deployment and operations.

**Includes:**
- 404 Not Found (HTTPRoute/Gateway configuration errors)
- Bifrost provider/model errors
- Bifrost model name normalization issues
- Langfuse Sub-path 404
- OTel Trace not arriving

**Reference Frequency:** During deployment or when issues occur

---

## Learning Paths

### Quick Start (Development/Test Environment)

**Figure 1. Quick-start learning path (Basic Deployment → Troubleshooting)**

```mermaid
graph LR
    A[Basic Deployment] --> B[Troubleshooting]
    style A fill:#326ce5,stroke:#333,color:#fff
    style B fill:#ffd93d,stroke:#333,color:#000
```

1. Configure kgateway + Bifrost with [Basic Deployment](./basic-deployment.md)
2. Refer to [Troubleshooting](./troubleshooting-guide.md) when issues occur

**Time Required:** 1-2 hours

---

### Production Configuration (Complete Pipeline)

**Figure 2. Production configuration learning path (Basic Deployment → Advanced Features → Troubleshooting)**

```mermaid
graph LR
    A[Basic Deployment] --> B[Advanced Features]
    B --> C[Troubleshooting]
    style A fill:#326ce5,stroke:#333,color:#fff
    style B fill:#76b900,stroke:#333,color:#000
    style C fill:#ffd93d,stroke:#333,color:#000
```

1. Configure basic infrastructure with [Basic Deployment](./basic-deployment.md)
2. Add LLM Classifier + CloudFront/WAF + Semantic Caching in [Advanced Features](./advanced-features.md)
3. Refer to [Troubleshooting](./troubleshooting-guide.md) during operations

**Time Required:** 3-4 hours

---

## Prerequisites

Verify the following before proceeding with all deployment stages.

### Required

- [x] EKS cluster (K8s 1.33+ recommended; core DRA (Dynamic Resource Allocation) reached GA in K8s 1.34)
- [x] kubectl installed with cluster access
- [x] Helm 3.x installed
- [x] vLLM or llm-d based model serving Pods deployed

### Recommended

- AWS Load Balancer Controller installed (for automatic NLB creation)
- Langfuse deployed (refer to [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md))
- Production environment: ACM certificate issued (for CloudFront + TLS)

---

## Next Steps

- **Get Started**: Navigate to [Basic Deployment](./basic-deployment.md) to begin kgateway installation.
- **Understand Architecture**: Read [Inference Gateway Routing](../../../model-serving/inference-routing/routing-strategy.md) before deployment to grasp the overall structure.
- **Prepare Monitoring**: Configure observability stack by referring to [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md).

---

## References

- [Inference Gateway Routing](../../../model-serving/inference-routing/routing-strategy.md) - kgateway architecture and routing strategy details
- [Langfuse Deployment Guide](../../integrations/monitoring-observability-setup.md) - Helm installation, OTel integration, Redis/ClickHouse configuration
- [Agent Monitoring](../../../operations-mlops/observability/agent-monitoring.md) - Langfuse architecture and components
- [Kubernetes Gateway API Official Documentation](https://gateway-api.sigs.k8s.io/)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [Bifrost Official Documentation](https://docs.getbifrost.ai/overview)
