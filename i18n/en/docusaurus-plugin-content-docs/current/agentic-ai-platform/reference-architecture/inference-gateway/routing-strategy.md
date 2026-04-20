---
title: "Inference Gateway & LLM Gateway Routing Strategy"
sidebar_label: "Gateway Routing Strategy"
description: "kgateway + Bifrost/LiteLLM 2-Tier architecture with Cascade Routing, Semantic Router, and Hybrid Routing design patterns"
tags: [kgateway, bifrost, litellm, gateway-api, agentgateway, cascade-routing, semantic-caching, vllm-semantic-router, 'scope:impl']
last_update:
  date: 2026-04-17
  author: YoungJoon Jeong
---

# Inference Gateway & LLM Gateway Routing Strategy

> Created: 2025-02-05 | Updated: 2026-04-17 | Reading Time: ~15 minutes

This document covers **design principles** for 2-Tier gateway architecture and routing strategies (Cascade / Semantic Router / Hybrid). For actual **deployment procedures** including Helm installation, HTTPRoute manifests, and OTel integration, refer to [Inference Gateway Deployment Guide](./inference-gateway-setup/).

## Overview

In large-scale AI model serving environments, **infrastructure traffic management** and **LLM provider abstraction** must be separated. A single gateway leads to exponential complexity and makes optimizing each layer difficult.

**2-Tier Gateway Architecture**:
- **L1 (Ingress Gateway)**: kgateway — Kubernetes Gateway API standard, traffic routing, mTLS, rate limiting
- **L2-A (Inference Gateway)**: Bifrost/LiteLLM — Provider integration, cascade routing, semantic caching
- **L2-B (Data Plane)**: agentgateway — MCP/A2A protocols, stateful session management

Each tier is managed independently, separating infrastructure and AI workloads.

---

## 2-Tier Gateway Architecture

### Gateway Layer Separation

LLM inference platforms must clearly distinguish **3 different Gateway roles**:

| Gateway Type | Role | Implementation | Location |
|-------------|------|-------|------|
| **Ingress Gateway** | External traffic ingress, TLS termination, path-based routing | kgateway (NLB integration) | Tier 1 |
| **Inference Gateway** | Model selection, intelligent routing, request cascading | Bifrost / LiteLLM | Tier 2-A |
| **Data Plane** | MCP/A2A protocols, stateful sessions, tool routing | agentgateway | Tier 2-B |

```mermaid
graph LR
    Client[Client] --> IGW[Ingress Gateway<br/>kgateway NLB<br/>TLS Termination]
    IGW -->|Complexity Analysis| IFG[Inference Gateway<br/>Bifrost / LiteLLM<br/>Model Selection]
    IFG -->|Complex| LLM[GLM-5 744B<br/>Reasoning]
    IFG -->|Simple| SLM[Qwen3-Coder 3B<br/>Fast Response]
    IGW -->|MCP/A2A| AGW[agentgateway<br/>Session Mgmt<br/>Tool Routing]
    
    style IGW fill:#326ce5,stroke:#333,color:#fff
    style IFG fill:#e53935,stroke:#333,color:#fff
    style AGW fill:#ff9900,stroke:#333,color:#000
    style LLM fill:#76b900,stroke:#333,color:#000
    style SLM fill:#ffd93d,stroke:#333,color:#000
```

**Core Principles:**
- **Ingress Gateway (kgateway)**: Handles network-level traffic control only. Does not include model selection logic
- **Inference Gateway (Bifrost/LiteLLM)**: Analyzes request complexity → Automatically selects appropriate model → Cost optimization
- **Data Plane (agentgateway)**: Handles AI-specific protocols (MCP/A2A), maintains stateful sessions

### Overall Architecture

```mermaid
flowchart TB
    subgraph CL["Client Layer"]
        CLIENT[Clients]
        SDK[SDK]
        UI[UI]
    end

    subgraph T1["Tier 1: Ingress Gateway"]
        GW1[kgateway<br/>NLB + TLS]
        HR1[External LLM]
        HR2[Self-hosted]
        HR3[MCP/A2A]
    end

    subgraph T2A["Tier 2-A: Inference Gateway"]
        BIFROST[Bifrost / LiteLLM]
        OPENAI[OpenAI]
        ANTHROPIC[Anthropic]
        BEDROCK[Bedrock]
    end

    subgraph T2B["Tier 2-B: Data Plane"]
        AGENTGW[agentgateway]
        VLLM1[vLLM-1]
        VLLM2[vLLM-2]
        LLMD[llm-d]
    end

    subgraph OBS["Observability"]
        LANGFUSE[Langfuse]
        PROM[Prometheus]
    end

    CLIENT & SDK & UI --> GW1
    GW1 --> HR1 & HR2 & HR3

    HR1 --> BIFROST
    BIFROST --> OPENAI & ANTHROPIC & BEDROCK

    HR2 --> AGENTGW
    AGENTGW --> VLLM1 & VLLM2 & LLMD

    HR3 --> AGENTGW

    BIFROST & AGENTGW -.-> LANGFUSE
    GW1 -.-> PROM

    style GW1 fill:#326ce5,stroke:#333
    style BIFROST fill:#e53935,stroke:#333
    style AGENTGW fill:#ff9900,stroke:#333
    style LANGFUSE fill:#9c27b0,stroke:#333
```

### Responsibility Separation by Tier

| Tier | Component | Responsibility | Protocol |
|------|----------|------|----------|
| **Tier 1** | kgateway (Envoy-based) | Traffic routing, mTLS, rate limiting, network policies | HTTP/HTTPS, gRPC |
| **Tier 2-A** | Bifrost / LiteLLM | Intelligent model selection, cost tracking, request cascading, semantic caching | OpenAI-compatible API |
| **Tier 2-B** | agentgateway | MCP/A2A session management, self-hosted inference routing, Tool Poisoning prevention | HTTP, JSON-RPC, MCP, A2A |

### Traffic Flow

**External LLM**: Client → kgateway → Bifrost/LiteLLM (Cascade + Cache) → OpenAI → Response + Cost tracking
**Self-hosted vLLM**: Client → kgateway → agentgateway → vLLM → Response

---

## kgateway (L1 Inference Gateway)

### Gateway API-based Routing

kgateway implements the Kubernetes Gateway API standard, enabling vendor-neutral configuration.

import { ComponentStructureTable } from '@site/src/components/InferenceGatewayTables';

<ComponentStructureTable />

Gateway API v1.2.0+ provides HTTPRoute improvements, GRPCRoute stabilization, and BackendTLSPolicy, fully supported by kgateway v2.0+.

### Dynamic Routing Concepts

| Routing Type | Criteria | Use Case |
|------------|------|----------|
| **Header-based** | `x-model-id`, `x-provider` | Backend selection by model/provider |
| **Path-based** | `/v1/chat/completions`, `/v1/embeddings` | Service separation by API type |
| **Weight-based** | backendRef weight | Canary deployment, A/B testing |
| **Composite conditions** | Headers + Path + Tier | Premium/standard customer backends |

Canary deployments start with 5-10% traffic and gradually increase, with immediate rollback via weight=0 on issues.

### Load Balancing Strategies

| Strategy | Description | Suitable Scenario |
|------|------|--------------|
| **Round Robin** | Sequential distribution (default) | Uniform model instances |
| **Random** | Random distribution | Large backend pools |
| **Consistent Hash** | Same key → Same backend | KV Cache reuse, session affinity |

Consistent Hash is particularly useful for LLM inference. Routing requests from the same user to the same vLLM instance increases prefix cache hit rates, significantly improving TTFT (Time to First Token).

### Topology-Aware Routing (Kubernetes 1.33+)

Kubernetes 1.33+ topology-aware routing prioritizes same-AZ Pod communication to reduce cross-AZ data transfer costs.

import { TopologyEffectsTable } from '@site/src/components/InferenceGatewayTables';

<TopologyEffectsTable />

### Failure Handling Concepts

| Mechanism | Description | LLM Inference Considerations |
|----------|------|-------------------|
| **Timeout** | Maximum processing time per request | LLM long response generation takes tens of seconds. Adequate timeout needed (120s+) |
| **Retry** | Auto-retry on 5xx, timeout, connection failure | Max 3 retries. Infinite retries cause system overload |
| **Circuit Breaker** | Temporarily block backend on consecutive failures | Set `maxEjectionPercent` to 50% or below to ensure at least half backends available |

For streaming responses, `backendRequest` timeout is for first byte, `request` is for total time. POST retries require idempotency guarantees (caution with tool calls).

---

## LLM Gateway Solution Comparison

### Major Solution Comparison Table

| Solution | Language | Key Features | Cascade Routing | License | Best For |
|--------|------|-----------|-----------------|----------|-----------|
| **Bifrost** | Go/Rust | 50x faster, CEL Rules conditional routing, failover | CEL Rules + external classifier | Apache 2.0 | High performance, low cost, self-hosted |
| **LiteLLM** | Python | 100+ providers, native complexity-based routing | `routing_strategy: complexity-based` | MIT | Python ecosystem, rapid prototyping |
| **vLLM Semantic Router** | Python | vLLM-only, lightweight embedding-based routing | Embedding similarity-based | Apache 2.0 | vLLM standalone environment |
| **Portkey** | TypeScript | SOC2 certified, semantic caching, Virtual Keys | Supported | Proprietary + OSS | Enterprise, compliance |
| **Kong AI Gateway** | Lua/C | MCP support, leverages existing Kong infra | Plugin | Apache 2.0 / Enterprise | Existing Kong users |
| **Helicone** | Rust | Gateway + Observability integrated, high performance | Supported | Apache 2.0 | High performance + observability needed |

### Bifrost vs LiteLLM

**Bifrost**: Go/Rust implementation with 50x faster throughput than Python, 1/10 memory usage. CEL Rules enable conditional routing (header-based cascade, failover). Helm Chart deployment, OpenAI-compatible API. Proxy latency < 100us. Intelligent cascade via app-side complexity score calculation → `x-complexity-score` header → CEL rule branching pattern or Go Plugin.

**LiteLLM**: 100+ provider support, **native complexity-based routing** (activate with 1-line `routing_strategy: complexity-based` config), one-line Langfuse integration (`success_callback: ["langfuse"]`), direct LangChain/LlamaIndex integration. However, Python-based with lower throughput, higher memory usage.

### Selection Criteria

| Use Case | Recommended Solution | Reason |
|-----------|-----------|------|
| Intelligent cascade (convenience priority) | **LiteLLM** | Native complexity-based routing, 1-line config |
| Intelligent cascade (performance priority) | **Bifrost** | CEL Rules + external classifier, 50x faster |
| vLLM standalone environment | **vLLM Semantic Router** | vLLM native, lightweight routing |
| High performance, low cost self-hosted | **Bifrost** | 50x faster processing, low memory |
| Python ecosystem (LangChain) | **LiteLLM** | Native integration, 100+ providers |
| Enterprise compliance | **Portkey** | SOC2/HIPAA/GDPR, Semantic Cache |
| High performance + observability integrated | **Helicone** | Rust-based All-in-one |

### Recommended Combinations by Scenario

| Scenario | Recommended Stack | Reason |
|----------|----------|------|
| **Startup/PoC** | kgateway + LiteLLM | Low cost, 10-min deployment, complexity routing 1-line |
| **Self-hosted focused (performance)** | kgateway + Bifrost (CEL cascade) + agentgateway | High performance, external+self-hosted pool 2-Tier |
| **Enterprise multi-provider** | kgateway + Portkey + Langfuse | Compliance, 250+ providers |
| **Hybrid (external+self-hosted)** | kgateway + Bifrost/LiteLLM + agentgateway | External via Bifrost/LiteLLM, self-hosted via agentgateway |
| **Global deployment** | Cloudflare AI Gateway + kgateway | Edge caching, DDoS protection |

---

## Request Cascading: Intelligent Model Routing

### Concept

**Request Cascading** is an intelligent optimization technique that automatically analyzes request complexity and routes to appropriate models. Simple queries go to cheap and fast models, complex reasoning to powerful models, simultaneously improving cost and latency. IDEs use a single endpoint only; model selection is centrally controlled at platform level.

### Three Cascading Patterns

| Pattern | Description | Implementation | Use Case |
|------|------|------|----------|
| **1. Weight-based** | Distribute traffic by fixed ratio | kgateway `backendRef weight` | A/B testing, gradual model migration |
| **2. Fallback-based** | Auto-switch to another model on error | kgateway retry + multiple backendRef | Availability improvement, rate limit avoidance |
| **3. Intelligent routing** | Auto-select model after request analysis | **LLM Classifier** / LiteLLM / vLLM Semantic Router | Cost optimization, quality maintenance |

```mermaid
flowchart TB
    Q[User Query]
    
    subgraph P1["Pattern 1: Weight-based"]
        W1[70% → Cheap]
        W2[30% → Premium]
    end
    
    subgraph P2["Pattern 2: Fallback-based"]
        F1[Primary Model]
        F2{5xx/Timeout?}
        F3[Fallback Model]
    end
    
    subgraph P3["Pattern 3: Intelligent Routing"]
        R1[LLM Classifier]
        R2{Prompt Analysis}
        R3[Strong Model]
        R4[Weak Model]
    end
    
    Q --> P1 & P2 & P3
    
    F1 --> F2
    F2 -->|Yes| F3
    
    R1 --> R2
    R2 -->|Complex| R3
    R2 -->|Simple| R4
    
    style P1 fill:#ffd93d,stroke:#333
    style P2 fill:#ff9900,stroke:#333
    style P3 fill:#e53935,stroke:#333,color:#fff
```

### Practical Request Cascading Implementation

Intelligent cascade routing analyzes request complexity and auto-routes to appropriate models. This section focuses on verified approaches in self-hosted environments.

#### Approach A: LLM Classifier (Recommended — Field-Validated)

**LLM Classifier** is a Python FastAPI-based lightweight router that directly analyzes prompt content to auto-select SLM/LLM. It operates as ExtProc (External Processing) or independent service behind kgateway, with clients using only a single endpoint (`/v1`).

```mermaid
graph LR
    Client[Aider/Cline] --> KGW[kgateway NLB]
    KGW -->|/v1/*| CLS[LLM Classifier<br/>FastAPI]
    CLS -->|weak: no keywords, <500 chars| SLM[Qwen3-4B<br/>L4 $0.3/hr]
    CLS -->|strong: refactor, design, analysis| LLM[GLM-5 744B<br/>H200 $12/hr]
    CLS -->|OTel| LF[Langfuse]
    
    style KGW fill:#326ce5,stroke:#333,color:#fff
    style CLS fill:#e53935,stroke:#333,color:#fff
    style SLM fill:#ffd93d,stroke:#333,color:#000
    style LLM fill:#76b900,stroke:#333,color:#000
    style LF fill:#9c27b0,stroke:#333,color:#fff
```

**Classification Criteria:**

| Criteria | weak (SLM) | strong (LLM) |
|------|-----------|-------------|
| **Keywords** | None | Refactor, architecture, design, analysis, debug, optimization, migration, etc. |
| **Input length** | < 500 chars | ≥ 500 chars |
| **Conversation turns** | ≤ 5 turns | > 5 turns |

**Core Classification Logic:**

```python
STRONG_KEYWORDS = ["refactor", "architect", "design", "analyze",
                   "optimize", "debug", "migration", "complex"]
TOKEN_THRESHOLD = 500

def classify(messages: list[dict]) -> str:
    content = " ".join(m.get("content", "") for m in messages if m.get("content"))
    # Keyword matching
    if any(kw in content.lower() for kw in STRONG_KEYWORDS):
        return "strong"
    # Input length
    if len(content) > TOKEN_THRESHOLD:
        return "strong"
    # Conversation turns
    if len(messages) > 5:
        return "strong"
    return "weak"
```

**Pros**: No client modification needed, direct prompt analysis, direct Langfuse OTel transmission, simple deployment (single Pod)
**Cons**: Classification accuracy depends on heuristics (can be gradually improved with ML classifier)

:::tip Why LLM Classifier is Optimal
Standard OpenAI-compatible clients (Aider, Cline, etc.) only configure **a single `base_url`**. LLM Classifier analyzes prompts behind this single endpoint and proxies directly to backend vLLM instances. Clients are completely unaware of model selection.
:::

#### Bifrost Self-hosted Cascade Limitations

We attempted to use Bifrost for self-hosted vLLM cascade but switched to **LLM Classifier** due to the following limitations:

| Limitation | Description |
|------|------|
| **provider/model format enforcement** | Requires `openai/glm-5` format. Standard OpenAI clients (Aider, etc.) expect single model names like `model: "auto"` |
| **Single base_url per provider** | Only one `network_config.base_url` per provider (e.g., `openai`). Cannot route to same provider if SLM and LLM are on different Services |
| **No prompt access in CEL** | CEL Rules only access `request.headers`. Cannot analyze request body (prompt content) for routing |
| **Model name normalization issues** | Unpredictable normalization like hyphen removal causes mismatch with vLLM `served-model-name` |

:::warning Bifrost is Best for External LLM Provider Integration
Bifrost is optimized for **external provider integration** (OpenAI/Anthropic/Bedrock) and **failover**. LLM Classifier is better suited for intelligent cascade routing between self-hosted vLLM instances.
:::

#### RouteLLM Evaluation Results

[RouteLLM](https://github.com/lm-sys/RouteLLM) is an open-source routing framework developed by LMSYS, with academically validated Matrix Factorization-based classification models (90%+ accuracy on LMSYS Chatbot Arena data).

However, the following issues were confirmed during K8s deployment:

- **Dependency conflicts**: Large dependency trees like `torch`, `transformers`, `sentence-transformers` conflict with vLLM environments
- **Container size**: Image size 10GB+ with classification model (unsuitable for lightweight router)
- **Deployment instability**: High frequency of pip dependency resolution failures
- **Maintenance**: Research project nature with no production support

**Conclusion**: RouteLLM's MF classifier **concept** is valid, but for production deployment we recommend **LLM Classifier** (lightweight heuristics) or **LiteLLM complexity routing** (external provider environments).

#### Approach B: LiteLLM Native (External Provider Environment)

LiteLLM natively supports **complexity-based routing**. Adding just 1 line to the config file enables automatic request complexity analysis and model selection.

```yaml
model_list:
  - model_name: gpt-4-turbo
    litellm_params:
      model: gpt-4-turbo-preview
      api_key: os.environ/OPENAI_API_KEY
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  routing_strategy: complexity-based  # Enable with this 1 line
  complexity_threshold: 0.7           # ≥ 0.7 → stronger model
```

**Pros**: Activate with 1-line config, auto-analyzes prompt length·code inclusion·reasoning keywords, 100+ provider support
**Cons**: Python-based low throughput, complexity algorithm not customizable, overhead for self-hosted vLLM

#### Approach C: vLLM Semantic Router (vLLM-only)

In vLLM environments, **vLLM Semantic Router** can be used for lightweight embedding-based routing. It matches embeddings to pre-defined "categories" to select models.

```python
# vLLM Semantic Router configuration
from vllm import SemanticRouter

router = SemanticRouter(
    categories={
        "simple": ["basic question", "quick answer", "definition"],
        "complex": ["explain in detail", "analyze", "step by step"]
    },
    models={
        "simple": "qwen3-4b",
        "complex": "glm-5-744b"
    },
    threshold=0.85
)

# Auto-routing
response = router.route(prompt="Explain the architecture...")  # → glm-5-744b
```

**Pros**: vLLM native, lightweight embedding usage (inference latency < 5ms), simple configuration
**Cons**: vLLM-only, requires pre-defined categories

### Cascade Routing Implementation Selection Guide

| Environment | Recommended Approach | Reason |
|------|----------|------|
| **Self-hosted vLLM (Aider/Cline)** | **LLM Classifier** | Direct prompt analysis, single endpoint, no client modification |
| **External providers (OpenAI/Anthropic)** | **LiteLLM** | 100+ providers native, complexity routing 1-line |
| **vLLM standalone + embeddings available** | **vLLM Semantic Router** | vLLM native, lightweight |
| **Hybrid (external + self-hosted)** | **LLM Classifier + LiteLLM** | Self-hosted via Classifier, external via LiteLLM |

### Cascade Routing Strategy (Fallback-based)

Try **cheap -> balanced -> frontier** models progressively based on complexity.

**Complexity Classification Criteria (as of 2026-04):**

| Complexity | Conditions | Recommended Model | Cost per Token |
|--------|------|----------|-----------|
| **Simple** | Tokens < 200, no keywords | Haiku 4.5 / GPT-4.1 nano | $0.80-$0.15/M |
| **Medium** | Tokens 200-1000, code included | Sonnet 4.6 / Gemini 2.5 Flash | $3-$0.10/M |
| **Complex** | Tokens 1000+, reasoning keywords | Opus 4.7 / GPT-4.1 | $15-$10/M |

**Fallback Conditions**: HTTP 5xx, Rate Limit exceeded, Timeout, Quality Score < 0.7 (optional)

### Cost Savings Effect (as of 2026-04)

10,000 requests/day scenario:
- Simple (50%): Haiku 4.5 — 50 tok in, 100 tok out → $0.50/day
- Medium (30%): Sonnet 4.6 — 500 tok in, 500 tok out → $2.70/day
- Complex (15%): Opus 4.7 — 1500 tok in, 1000 tok out → $3.38/day
- Very Complex (5%): Opus 4.7 — 3000 tok in, 2000 tok out → $3.00/day

**Total cost: $9.58/day ($287/month)**

Processing all requests with Opus 4.7: $45/day ($1,350/month) → **79% savings**

**Self-hosted LLM Classifier Scenario** (as of 2026-04):
- Qwen3-4B (70% weak, L4 $0.3/hr × 24hr × 30d) = $216/month
- GLM-5 744B (30% strong, H200 $12/hr × 24hr × 30d × 0.3) = $2,592/month
- Langfuse + AMP/AMG = $200/month

**Total cost: $3,008/month** (vs GLM-5 alone $8,900/month → **66% savings**)

### Enterprise Model Routing Patterns

**Implementation Location Priority**: Gateway > IDE > Client

| Location | Advantages | Suitable Environment |
|------|------|----------|
| **Gateway (LLM Classifier)** | Prompt analysis, central control, no client modification | Self-hosted **(Recommended)** |
| **Gateway (LiteLLM/Bifrost)** | Multi-provider, policy consistency | External providers |
| **IDE (Claude Code)** | Context awareness | Dev tool vendors |
| **Client (SDK)** | High flexibility | Prototype |

**Field Recommendation**: In self-hosted environments, deploy with **kgateway → LLM Classifier → vLLM** structure for centralized routing. Developers use only a single endpoint (`/v1`), and platform teams manage classification policies. For detailed deployment guide, refer to [Inference Gateway Deployment: LLM Classifier](./inference-gateway-setup/advanced-features#llm-classifier-deployment).

---

## Research Reference: RouteLLM

**RouteLLM** is an open-source LLM routing framework developed by LMSYS. A lightweight classification model (Matrix Factorization) analyzes requests to automatically select strong/weak models.

```mermaid
graph TD
    Req[Request] --> Router[LLM Classifier<br/>Prompt Analysis]
    Router -->|strong: refactor, design, analysis<br/>≥500 chars, >5 turns| LLM[Strong Model<br/>GLM-5 744B<br/>H200 $12/hr]
    Router -->|weak: simple query<br/><500 chars, ≤5 turns| SLM[Weak Model<br/>Qwen3-4B<br/>L4 $0.3/hr]
    LLM --> Resp[Response]
    SLM --> Resp
    
    style Router fill:#326ce5,stroke:#333,color:#fff
    style LLM fill:#e53935,stroke:#333,color:#fff
    style SLM fill:#76b900,stroke:#333,color:#000
```

| Item | RouteLLM (Research) | LLM Classifier (Production) |
|------|----------------|---------------------|
| **Classification method** | Matrix Factorization embedding | Keywords + token length + conversation turns |
| **Input** | User prompt + conversation history | Same |
| **Output** | Strong/Weak + confidence score | Strong/Weak |
| **Added latency** | < 10ms (MF inference) | < 1ms (rule-based) |
| **Dependencies** | torch, transformers, sentence-transformers | FastAPI, httpx (lightweight) |
| **K8s deployment** | Unstable (dependency conflicts) | Stable (50MB image) |

:::warning RouteLLM Production Deployment Caution
RouteLLM is a research project; K8s production deployment is not recommended. Dependency conflicts and large image size (10GB+) are problematic. The MF classifier **concept** is useful, but for production we recommend **LLM Classifier** (self-hosted) or **LiteLLM complexity routing** (external provider environments).
:::

For detailed deployment code, refer to [Inference Gateway Deployment Guide: LLM Classifier](./inference-gateway-setup/advanced-features#llm-classifier-deployment).

---

## Gateway API Inference Extension

Kubernetes Gateway API enables managing LLM inference as Kubernetes-native resources through **Inference Extension**.

### Core CRDs (Custom Resource Definitions)

| CRD | Role | Example |
|-----|------|------|
| **InferenceModel** | Define per-model serving policies (criticality, routing rules) | `criticality: high` → dedicated GPU allocation |
| **InferencePool** | Model serving Pod group (vLLM replicas) | `replicas: 3` → 3 vLLM instances |
| **LLMRoute** | Rules for routing requests to InferenceModel | `x-model-id: glm-5` → GLM-5 Pool |

For detailed YAML manifests, refer to [Inference Gateway Deployment Guide](./inference-gateway-setup/).

### Gateway API Inference Extension Integration

Gateway API Inference Extension integrates with **kgateway + llm-d EPP** to provide Kubernetes-native inference routing:

```mermaid
graph TB
    Client[Client] --> Gateway[kgateway]
    Gateway --> LLMRoute[LLMRoute CRD<br/>Routing Rules]
    LLMRoute --> Pool1[InferencePool<br/>GLM-5]
    LLMRoute --> Pool2[InferencePool<br/>Qwen3]
    Pool1 --> LLMD1[llm-d EPP<br/>Disaggregated]
    Pool2 --> VLLM[vLLM<br/>Aggregated]
    
    style Gateway fill:#326ce5,stroke:#333,color:#fff
    style LLMRoute fill:#e53935,stroke:#333,color:#fff
    style Pool1 fill:#ff9900,stroke:#333
    style Pool2 fill:#ffd93d,stroke:#333
```

**Current Status**: Actively developed as CNCF project. Expected to provide alpha in Kubernetes 1.34+; production use not currently recommended. For production deployment, refer to [Reference Architecture](../reference-architecture/) guides.

---

## Semantic Caching

Semantic Caching detects semantically similar prompts and reuses previous responses, simultaneously reducing LLM API costs and latency. At the Gateway level (Bifrost/LiteLLM/Portkey), HIT/MISS is determined by embedding similarity, so it can be combined independently with KV Cache (vLLM) · Prompt Cache (provider-managed).

**Recommended default threshold**: 0.85 — allows same meaning, different expression

Design principles (3-tier cache comparison, similarity threshold tradeoffs, tool comparison table, cache key design, observability·production checklist) are covered in detail in separate documentation.

- **Design Principles**: [Semantic Caching Strategy](../model-serving/inference-frameworks/semantic-caching-strategy.md)
- **Production Deployment Example**: LiteLLM + Redis configuration in [OpenClaw AI Gateway Deployment](./openclaw-ai-gateway.mdx)

---

## agentgateway Data Plane

### Overview

**agentgateway** is an AI workload-dedicated data plane for kgateway. Traditional Envoy is optimized for stateless HTTP/gRPC, but AI agents have special requirements like stateful JSON-RPC sessions, MCP protocols, and Tool Poisoning prevention.

### Envoy vs agentgateway Comparison

| Item | Envoy Data Plane | agentgateway |
|------|---------------------|---------------------------|
| **Session Management** | Stateless, HTTP cookie-based | Stateful JSON-RPC sessions, in-memory session store |
| **Protocols** | HTTP/1.1, HTTP/2, gRPC | MCP (Model Context Protocol), A2A (Agent-to-Agent) |
| **Security** | mTLS, RBAC | Tool Poisoning prevention, per-session Authorization |
| **Routing** | Path/header-based | Session ID-based, tool call validation |
| **Observability** | HTTP metrics, Access Log | LLM token tracking, tool call chains, cost |

### Core Features

**1. Stateful JSON-RPC Session Management**: `X-MCP-Session-ID` header-based session tracking, Sticky Session routing, automatic inactive session cleanup (default 30 minutes)

**2. Native MCP/A2A Protocol Support**: `/mcp/v1` (MCP protocol), `/a2a/v1` (A2A agent communication) path support

**3. Tool Poisoning Prevention**: Allowed tool list, dangerous tool blocking (`exec_shell`, `read_credentials`), response size limits, integrity verification (SHA-256)

**4. Per-session Authorization**: JWT token verification, role-based tool access, session hijacking prevention

:::info agentgateway Project Status
agentgateway is an AI-dedicated data plane separated from the kgateway project in late 2025, currently under active development. Features are continuously added to keep pace with rapid evolution of MCP and A2A protocols.
:::

---

## Monitoring & Observability

### Core Metrics

Core metrics to monitor in AI inference gateways:

import { MonitoringMetricsTable } from '@site/src/components/InferenceGatewayTables';

<MonitoringMetricsTable />

| Metric Category | Key Item | Meaning |
|----------------|----------|------|
| **Latency** | TTFT (Time to First Token) | Time until first token generation. User-perceived responsiveness |
| **Throughput** | TPS (Tokens Per Second) | Tokens generated per second. Model serving efficiency |
| **Error Rate** | 5xx / Total Requests | Backend failure ratio. Immediate action if > 5% |
| **Cache Hit Rate** | Cache Hit / Total Requests | Semantic Cache efficiency. 30%+ recommended |
| **Cost** | Token usage by model × unit price | Real-time cost tracking |

### Langfuse OTel Integration

Send OTel traces from Bifrost/LiteLLM to Langfuse to track prompts/completions, token usage, cost analysis, and tool call chains. Bifrost activates via `otel` plugin, LiteLLM via `success_callback: ["langfuse"]` config. For detailed configuration, refer to [Monitoring Stack Setup](../reference-architecture/integrations/monitoring-observability-setup.md).

### Recommended Alert Rules

| Alert | Condition | Severity |
|------|------|--------|
| High error rate | 5xx > 5% (5 min) | Critical |
| High latency | P99 > 30s (5 min) | Warning |
| Circuit breaker activated | circuit_breaker_open == 1 | Critical |
| Cache hit rate drop | Cache hit < 30% | Warning |
| Budget approaching | Budget > 80% | Warning |

---

## Related Documentation

### Production Deployment Guides

For actual code examples and YAML manifests, refer to Reference Architecture section:

- [Inference Gateway Deployment Guide](./inference-gateway-setup/) - kgateway, Bifrost, agentgateway installation and YAML manifests
- [OpenClaw AI Gateway Deployment](../reference-architecture/inference-gateway/openclaw-example.mdx) - OpenClaw + Bifrost + Hubble production deployment
- [Custom Model Deployment](../reference-architecture/model-lifecycle/custom-model-deployment.md) - vLLM/llm-d deployment guide

### Cost and Observability

- [Coding Tools & Cost Analysis](../reference-architecture/integrations/coding-tools-cost-analysis.md) - Aider/Cline connection, NLB unified routing patterns
- [Monitoring Stack Setup](../reference-architecture/integrations/monitoring-observability-setup.md) - Langfuse OTel integration, Prometheus, Grafana dashboards
- [LLMOps Observability](../operations-mlops/observability/llmops-observability.md) - Langfuse/LangSmith-based LLM observability

### Related Infrastructure

- [GPU Resource Management](../model-serving/gpu-infrastructure/gpu-resource-management.md) - Dynamic resource allocation strategies
- [llm-d Distributed Inference](../model-serving/inference-frameworks/llm-d-eks-automode.md) - EKS Auto Mode-based distributed inference
- [Agent Monitoring](../operations-mlops/observability/agent-monitoring.md) - Langfuse integration guide

---

## References

### Official Documentation

- [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/)
- [Gateway API Inference Extension (Proposal)](https://github.com/kubernetes-sigs/gateway-api/issues/2813)
- [kgateway Official Documentation](https://kgateway.dev/docs/)
- [agentgateway GitHub](https://github.com/kgateway-dev/agentgateway)
- [Bifrost Official Documentation](https://www.getmaxim.ai/bifrost/docs)
- [LiteLLM Official Documentation](https://docs.litellm.ai/)
- [LiteLLM Complexity Routing](https://docs.litellm.ai/docs/routing)
- [vLLM Semantic Router](https://github.com/vllm-project/semantic-router)

### LLM Providers

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [AWS Bedrock](https://docs.aws.amazon.com/bedrock/)

### Related Protocols

- [Model Context Protocol (MCP) Spec](https://modelcontextprotocol.io/specification)
- [Agent-to-Agent (A2A) Protocol](https://github.com/a2a-protocol/spec)

### Research Papers & Patterns

- [RouteLLM: Learning to Route LLMs with Preference Data (arXiv)](https://arxiv.org/abs/2406.18665)
- [LMSYS Chatbot Arena Leaderboard](https://chat.lmsys.org/?leaderboard)
- [LLM Router Pattern: Model Switching](https://markaicode.com/llm-router-pattern-model-switching/)
