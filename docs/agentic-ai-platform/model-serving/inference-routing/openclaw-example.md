---
title: OpenClaw AI Agent Gateway Deployment & Full Observability
description: Deploy OpenClaw AI Agent Gateway on EKS with cost optimization, and achieve full observability using LiteLLM Auto Router + Cilium Hubble + Langfuse
created: "2026-03-06"
last_update:
  date: 2026-10-31
  author: devfloor9
reading_time: 57
tags:
  - eks
  - openclaw
  - litellm
  - langfuse
  - cilium
  - hubble
  - bedrock
  - graviton
  - pod-identity
  - observability
  - scope:impl
sidebar_label: OpenClaw AI Gateway
sidebar_position: 5
category: genai-aiml
---

## Overview

OpenClaw is a general-purpose AI agent framework that provides autonomous agent workflows leveraging various LLMs. AWS offers the `aws-samples/sample-OpenClaw-on-AWS-with-Bedrock` sample as an EC2 + CloudFormation quick-start guide — a simple setup connecting a single Bedrock model on a single instance. The comparison below is relative to **that sample's single-model, single-instance configuration**; if the sample has since changed to support multiple models, re-check each row against the sample's current version.

Instead of that sample, this document **proposes an alternative architecture**: deploying the OpenClaw gateway on an existing EKS cluster and combining multi-model routing with 3-layer observability. The configurations, figures, and savings shown here are a design proposal that operators should validate against their own traffic and environment before adopting; they do not, by themselves, certify that the result is production-ready.

**Table 1. EC2 standalone vs EKS-based deployment**

| | EC2 Standalone Deployment (reference sample) | EKS-Based Deployment (alternative proposed here) |
|---|---|---|
| **Infrastructure** | EC2 + CloudFormation, instance-level management | Add Pods to existing EKS cluster, Karpenter auto-scaling |
| **LLM Integration** | Bedrock single model | LiteLLM Auto Router → content-based multi-model (Claude/GLM on Bedrock + Solar via external provider) |
| **Observability** | CloudWatch basic metrics | 3-Layer: Network (Hubble) + LLM (Langfuse) + System (OTEL/Prometheus) |
| **Cost Control** | Instance size adjustment | Graviton4 ARM + Spot + semantic caching + budget control |
| **Scalability** | Manual scaling | HPA/Karpenter auto-scaling, native Spot instance interruption handling |

### Related Documents

**Table 2. Related documents and their relationship to this document**

| Document | Content | Relationship |
|----------|---------|-------------|
| [Inference Gateway](routing-strategy.md) | Kgateway-based routing | Theoretical foundation |
| [Agent Monitoring](../../operations-mlops/observability/agent-monitoring.md) | Langfuse/LangSmith monitoring | Monitoring theory |
| **17. OpenClaw AI Gateway** (this document) | OpenClaw production deployment + full o11y | **Hands-on implementation** |

---

## Architecture Design

This architecture is based on 6 key design decisions to simultaneously achieve **cost efficiency**, **observability**, and **operational automation** required in enterprise environments.

import OpenClawArchitecture from '@site/src/components/OpenClawArchitecture';

<OpenClawArchitecture />

### Key Design Decisions Summary

Each layer of this architecture is based on the following design decisions:

**Table 3. Per-layer design decisions: choice, alternative, rationale**

| Decision Area | Choice | Alternative | Key Rationale |
|---------------|--------|-------------|---------------|
| **Hosting Platform** | EKS | EC2 standalone / AgentCore | Karpenter auto-scaling, o11y stack flexibility, Spot/Graviton combination possible. Bedrock AgentCore reached GA in 2025-10 with scheduling/cron and observability integration, but whether to use the managed abstraction or control everything directly on EKS is a trade-off to decide per requirements ([AgentCore runtime docs](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html)) |
| **LLM Gateway** | LiteLLM Proxy | Bifrost / llm-d | The gateway configuration in this document (`model_list` / `litellm_params` / `router_settings` / `success_callback`, port 4000, `LITELLM_MASTER_KEY`) is entirely the LiteLLM Proxy contract. OpenAI-compatible API, 100+ providers, per-virtual-key budget control, one-line `success_callback: ["langfuse"]` callback. Hybrid `LiteLLM → llm-d → vLLM` possible when adding self-hosted vLLM. Bifrost is an OpenAI-compatible alternative, but its config format (`config.json` + `$schema`/`providers`), default port (8080), and auth token (`BIFROST_SETUP_TOKEN`) differ, so the config below cannot be used with it as-is ([LiteLLM Langfuse integration](https://docs.litellm.ai/docs/observability/langfuse_integration), [Bifrost setup](https://docs.getbifrost.ai/quickstart/gateway/setting-up)) |
| **LLM Observability** | Langfuse (self-hosted) | Tempo / Loki | Langfuse specializes in storing and inspecting prompt/completion content, token usage, cost, and tool-call chains as LLM traces. Tempo/Loki can also store OTLP traces/logs, but they do not provide an LLM-specific UI that surfaces prompt/completion content and per-model-call token and cost |
| **Network Observability** | Cilium Hubble (ENI mode) | CW Network Flow Monitor | L7 visibility (HTTP paths, status codes, DNS) is collected only when an L7 visibility policy and the Envoy-based L7 proxy are enabled. The Cilium/Hubble software itself is free, but the node resources used for eBPF data processing and the retention of Hubble flow logs are additional costs. CW NFM supports L3/L4 only at $20-45/month |
| **IAM Authentication** | EKS Pod Identity | IRSA | No OIDC provider required, single command `aws eks create-pod-identity-association` mapping |
| **Compute** | Graviton4 M8g + Spot | x86 On-Demand | ARM64 20-40% cheaper, additional Spot savings, Karpenter native interruption handling |

---

## Technology Stack

### Compute

OpenClaw (TypeScript/Node.js) and LiteLLM (Python) provide ARM64-compatible images and use multi-arch images.

**Table 4. Compute instance configuration and future transition**

| Item | Configuration | Details |
|------|---------------|---------|
| **Instance** | Graviton4 **M8g** | GA, 20-40% cost reduction vs x86 (workload-dependent), energy efficiency per AWS published figures |
| **Future Transition** | Graviton5 **M9g** | ~25% performance improvement over M8g, **GA 2026-06-10**. Same cost with additional performance after GA transition |
| **Purchase Option** | **Spot Instance** preferred | Savings vs On-Demand vary by instance, region, and time. Karpenter v1.0+ native interruption handling + NMA node health monitoring |

#### Spot Instance Operational Considerations {#stable-spot-instance-operations}

To run the OpenClaw gateway on Spot Instances, first account for the fact that the gateway is a **stateful workload**. OpenClaw's official Kubernetes install includes a PersistentVolumeClaim (10Gi by default) for agent state and config, and after first boot the copy persisted in the PVC is the source of truth ([OpenClaw Kubernetes install](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/install/kubernetes.md)). So persist the PVC and credentials so state survives node replacement, and define replicas, placement constraints, and termination behavior together. Three layers are combined for stable operations:

**Table 5. Three-layer configuration for stable Spot operations**

| Layer | Tool | Role |
|-------|------|------|
| **Spot Interruption Handling** | Karpenter v1.0+ | 2-minute interruption warning (best-effort, not guaranteed) → replacement node provisioning → Pod rescheduling |
| **Node Health Monitoring** | NMA (EKS Add-on) | Kernel/containerd/disk/network anomaly detection → Node Condition update |
| **Auto Recovery** | Node Auto Repair | Automatic replacement of unhealthy nodes reported by NMA |

Karpenter NodePool, EC2NodeClass, and NMA configurations are detailed in [5.1 Infrastructure](#51-infrastructure).

**Pod Configuration — graceful shutdown + AZ distribution:**

```yaml
spec:
  terminationGracePeriodSeconds: 120  # Grace period for terminating in-flight requests (only within the 2-min interruption window)
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: openclaw-gateway
```

`terminationGracePeriodSeconds: 120` only sets a termination grace period; it does not guarantee that in-flight responses complete within a Spot interruption, because receiving the 2-minute warning is itself best-effort (see [EC2 Spot interruption notices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html)). `topologySpreadConstraints` encourages Pod distribution across AZs, but to actually guard against a single-AZ failure you must also confirm that multiple replicas land in different AZs ([Kubernetes Pods](https://kubernetes.io/docs/concepts/workloads/pods/)).

### LLM Models — Content-Based Routing

**Table 6. Models, providers, and routing rationale by query type**

| Query Type | Model | Provider | Rationale |
|------------|-------|----------|-----------|
| General (default) | **Claude Sonnet 4.6** | Bedrock | Routing default, using the context length Bedrock supports. "Best performance" holds only against specific benchmarks, so compare on your target tasks before adopting |
| Coding / Programming | **GLM-4.7** | Bedrock | MoE architecture, optimized for code generation. About 355B total parameters with about 32B active per token. The model card README gives no figure, so this was checked against [config.json](https://huggingface.co/zai-org/GLM-4.7/raw/main/config.json) (same structure as GLM-4.5: 92 layers, 8 of 160 routed experts plus 1 shared expert active). The safetensors parameter count reported by Hugging Face is 358.3B including the MTP layer (checked 2026-10-13). Bedrock's [official model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-zai-glm-4-7.html) confirms ID `zai.glm-4.7`; see the dated API/region details below |
| Korean / Korea-related | **Solar Pro 3** | External (OpenRouter / Upstage Console API) | 128K context, Korean-optimized. Solar Pro 3 was not found in the Bedrock model reference, so it is listed via an external provider. Re-check the model reference for whether it has since been added (do not assert "unavailable" from a failed lookup) |

:::note Model identity and provider verification
The [official GLM 4.7 model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-zai-glm-4-7.html), checked on **2026-10-31**, lists model ID `zai.glm-4.7` for `bedrock-runtime` and `bedrock-mantle`. It supports **Invoke, Converse, and Chat Completions**, but not Responses. This gateway's `bedrock/zai.glm-4.7` configuration uses that exact model ID.

The card lists **in-region** availability in `us-east-1`, `us-east-2`, `us-west-2`, `eu-north-1`, `eu-west-2`, `ap-northeast-1`, `ap-northeast-2`, `ap-south-1`, `ap-southeast-1`, `ap-southeast-2`, `ap-southeast-3`, `ap-southeast-4`, and `sa-east-1`; it lists no Geo or Global cross-region inference ID for this model.

These are public API and region specifications, **not a check of the target account's access, quotas, or gateway execution**. Model availability can change; before deployment, recheck the model card and your account's authorized availability. Solar Pro 3's Bedrock model ID, APIs, regions, and target-account availability remain unconfirmed here; the external-provider route above remains the proposed path. No paid inference was performed for this source check.
:::

### Networking

**Table 7. Networking components and technologies**

| Component | Technology |
|-----------|-----------|
| CNI | Cilium (ENI mode) |
| Service Map | Hubble UI + Grafana |
| Bedrock Connection | VPC Endpoint (`com.amazonaws.<region>.bedrock-runtime`) |

### Observability (3-Layer)

**Table 8. Three-layer observability: tools and tracked data per layer**

| Layer | Tool | Tracks |
|-------|------|--------|
| **Network** | Cilium Hubble | L7 HTTP flows, DNS, service map |
| **LLM** | Langfuse | Prompts/completions, token cost, tool call chains |
| **System** | OTEL → Prometheus/Grafana | CPU, memory, Pod health, custom metrics |

---

## Cost Analysis

The figures below are **example estimates** under specific traffic/capacity assumptions; actual cost varies with request volume, model mix, cache hit rate, and region. Bedrock API cost scales with usage, and usage-independent paid resources — VPC Endpoint, Redis, Langfuse storage/DB, and data transfer — are additional.

**Table 9. Estimated monthly cost by item with assumptions and exclusions**

| Item | Estimated Monthly Cost (example) | Assumptions / exclusions |
|------|----------------------|------|
| Gateway + LiteLLM (ARM) | ~$30 | One small Graviton node; varies with Spot |
| Bedrock API (Claude/GLM) | ~$15-40 | Proportional to assumed monthly request/token volume; external Solar billed separately |
| Langfuse (self-hosted) | ~$10 | PostgreSQL (and ClickHouse/Redis/object storage) and backups billed separately |
| Redis (cache) | ~$5 | Varies with memory size and persistence settings |
| Cilium + Hubble | software $0 | Node resources for eBPF processing and Hubble log retention are extra |
| Prometheus/Grafana | $0 (if reusing existing stack) | New deployment incurs storage/compute cost |
| VPC Endpoint | separate | Interface endpoint hourly charge + data processing charge |
| **Total** | **roughly $60-85/month + the separate items above** | Example range when the assumptions above hold |

### Cost Optimization Strategies

Each figure is a conditional effect; actual savings depend on traffic patterns and configuration.

**Table 10. Cost optimization strategies and conditional effects**

| Strategy | Detail | Effect (conditional) |
|----------|--------|---------|
| Graviton4 ARM | vs x86 | ~20-40% cost reduction depending on workload |
| Spot Instance | vs On-Demand, Karpenter native interruption handling | Savings vary by instance, region, and time |
| Auto-Router | Cost/quality balance via specialized model routing | Per-model cost optimization depending on query mix |
| Semantic Caching | Redis-based, caching identical/similar requests | Large savings only when repeated requests are a high share (depends on similarity threshold and hit rate) |
| Budget Control | Monthly budget per virtual key, rate limiting | Enforced **asynchronously** when budgets are exceeded, so it is not an immediate or absolute spend cap |
| VPC Endpoint | Sends Bedrock traffic over a private path | Reduces NAT Gateway data transfer cost (the endpoint itself still incurs charges) |

---

## Deployment Guide

### 5.1 Infrastructure

#### EKS Cluster Prerequisites

**Table 11. EKS cluster prerequisites**

| Requirement | Details |
|-------------|---------|
| EKS Version | 1.30+ (at least the minimum required by your Karpenter/add-on versions) |
| Karpenter | v1.0+ (includes native Spot interruption handling) |
| EKS Add-ons | Pod Identity Agent, EKS Node Monitoring Agent |
| VPC | Bedrock VPC Endpoint (`com.amazonaws.<region>.bedrock-runtime`) |
| CNI | Cilium ENI mode (if Hubble L7 visibility is needed) or VPC CNI |

Compute and CNI follow one of two paths; you cannot mix them.

- **Self-managed path (the Karpenter example in this document):** define nodes yourself with the `EC2NodeClass`/`NodePool` below, and optionally install Cilium in ENI mode for Hubble L7 visibility. This path requires you to set up the Karpenter controller and prerequisites such as the node IAM role and discovery tags.
- **EKS Auto Mode path:** Auto Mode manages node provisioning and the CNI for you, so it is **not** compatible with applying the self-managed `EC2NodeClass` below or layering Cilium ENI on Auto Mode nodes ([EKS Auto Mode networking](https://docs.aws.amazon.com/eks/latest/userguide/auto-networking.html)). To use Auto Mode, follow its NodePool/networking model instead of the Karpenter example below.

The Karpenter configuration below assumes the **self-managed path**.

#### Karpenter — Cost-Optimized Node Configuration

Graviton4 M8g Spot-first configuration to minimize compute costs. In the YAML below, `${CLUSTER_NAME}` is a **placeholder that Karpenter does not interpolate automatically**, so inject the real value with a templating tool (`envsubst`, Helm, or Kustomize) before applying. The `al2023@latest` alias is a **mutable reference** that can resolve to a different AMI at each apply, so pin a specific AMI ID when you need reproducible deployments ([Karpenter NodeClass](https://karpenter.sh/docs/concepts/nodeclasses/)).

```yaml
# EC2NodeClass — Graviton4 ARM64 node configuration
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: openclaw-arm64
spec:
  role: "KarpenterNodeRole-${CLUSTER_NAME}"
  amiSelectorTerms:
    - alias: al2023@latest     # Amazon Linux 2023, automatically selects ARM64
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "${CLUSTER_NAME}"
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "${CLUSTER_NAME}"
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 30Gi
        volumeType: gp3
        deleteOnTermination: true
```

```yaml
# NodePool — Graviton4+ (instance generation 8+), Spot first, On-Demand fallback
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: openclaw-gateway
spec:
  template:
    metadata:
      labels:
        workload-type: ai-gateway
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]  # Spot preferred when available
        - key: karpenter.k8s.aws/instance-generation
          operator: Gt
          values: ["7"]                   # instance generation 8+ → m8g, c8g, r8g (Graviton4)
        - key: karpenter.k8s.aws/instance-size
          operator: In
          values: ["medium", "large"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: openclaw-arm64
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
      - nodes: "1"  # At most 1 node evicted at a time during consolidation
  limits:
    cpu: "8"        # Total vCPU this NodePool may provision
    memory: 16Gi
```

:::tip Graviton Generation Selection
`instance-generation: Gt "7"` + `arch: arm64` restricts candidates to **instance generation 8+** (m8g, c8g, r8g = Graviton4). Note that `instance-generation` is the EC2 instance-family number (the "8" in m8g), not the Graviton chip number — `Gt "3"` would also include t4g (Graviton2) and m6g/m7g (Graviton2/3), so older generations could be provisioned. When newer Graviton generations reach GA, Karpenter selects among instance types that satisfy the requirements based on price and available capacity, so newer generations are usually included as candidates without NodePool changes. It does not, however, "automatically pick the performance-optimal instance"; the result depends on your requirements and Karpenter's cost/capacity decision ([Karpenter NodePool](https://karpenter.sh/docs/concepts/nodepools/)).

`budgets: nodes: "1"` only limits how many nodes are evicted at once during consolidation/disruption; it does not ensure availability — use replica count, PodDisruptionBudget, and AZ spread for that ([Karpenter Disruption](https://karpenter.sh/docs/concepts/disruption/)). `limits.cpu` is the total vCPU ceiling this NodePool may provision, not a per-node size or a per-request billing cap.
:::

#### Node Monitoring Agent — Node Health Monitoring

Karpenter handles Spot interruption events, but it does not detect **system-level node issues** such as kernel problems, containerd failures, disk/network anomalies. Enabling the EKS Node Monitoring Agent (NMA) as an EKS Add-on covers this gap.

**Table 12. Division of roles between Karpenter and NMA by detection area**

| Detection Area | Karpenter | NMA |
|----------------|-----------|-----|
| 2-min Spot interruption warning | **Detects + provisions replacement node** | - |
| Kernel/containerd failures | - | **Detects → updates Node Condition** |
| Disk/network anomalies | - | **Detects → creates Kubernetes Event** |
| Node Auto Repair integration | - | **Triggers automatic replacement of unhealthy nodes** |

```bash
# Enable NMA EKS Add-on
aws eks create-addon \
  --cluster-name ${CLUSTER_NAME} \
  --addon-name eks-node-monitoring-agent
```

Installing the NMA Add-on alone does not automatically replace unhealthy nodes. Automatic replacement requires enabling **Node Auto Repair** separately (the activation method and supported conditions differ by mode — EKS managed node groups vs Karpenter's repair feature, [EKS node health docs](https://docs.aws.amazon.com/eks/latest/userguide/node-health.html)); NMA's role is to detect node state and update Node Conditions and events.

Karpenter's Spot interruption handling also requires wiring EC2 interruption warnings through an **interruption queue (SQS) and EventBridge rules**, with IAM permission for the Karpenter controller to read that queue ([Karpenter Disruption](https://karpenter.sh/docs/concepts/disruption/)). Recovery time varies by environment, so no specific recovery timing is guaranteed.

Combining Karpenter (Spot interruption handling) + NMA (node health monitoring) + Node Auto Repair (automatic replacement) automates node fault recovery even in Spot instance environments.

#### IAM — EKS Pod Identity

```bash
# After enabling Pod Identity Agent add-on:
aws eks create-pod-identity-association \
  --cluster-name ${CLUSTER_NAME} \
  --namespace openclaw \
  --service-account openclaw-sa \
  --role-arn arn:aws:iam::${ACCOUNT_ID}:role/openclaw-bedrock-role
```

Required IAM Role permissions:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

For this association to take effect, the role's trust policy must trust the EKS Pod Identity service principal (`pods.eks.amazonaws.com`), the Pod must run as the `openclaw-sa` ServiceAccount, and the container's AWS SDK must be able to obtain credentials via the default credential chain and region configuration ([EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html)). The single command alone does not make an arbitrary Pod or SDK assume the role.

In this architecture, the component that calls Bedrock directly is the gateway (LiteLLM). So grant the Bedrock permissions only to the gateway's ServiceAccount, and give the OpenClaw agent a separate least-privilege ServiceAccount. Sharing one ServiceAccount would unnecessarily grant Bedrock access to the agent, which does not call Bedrock directly.

### 5.2 LiteLLM AI Gateway {#52-bifrost-ai-gateway}

This gateway configuration is the **LiteLLM Proxy** format (`model_list`/`litellm_params`/`router_settings`, default port 4000, `LITELLM_MASTER_KEY`). To use Bifrost instead you must rewrite it in Bifrost's `config.json` + `$schema`/`providers` format with default port 8080 and `BIFROST_SETUP_TOKEN` auth, so the config below cannot be used with it as-is.

#### Config — Multi-Model + Auto-Router

:::note Version/schema check
The configuration below assumes LiteLLM Proxy's Auto Router. Auto Router field names and behavior vary by LiteLLM version, so confirm the fields against the LiteLLM version you run (`litellm/router_strategy/auto_router/auto_router.py`) before applying. In LiteLLM, the Auto Router is a `model_list` entry (`model: auto_router/<name>`) with a config file path plus `auto_router_default_model` and `auto_router_embedding_model`; it is not an `auto_router:` block nested under `router_settings`.
:::

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-4-6

  - model_name: glm-4.7
    litellm_params:
      model: bedrock/zai.glm-4.7

  - model_name: solar-pro-3
    litellm_params:
      model: openrouter/upstage/solar-pro-3
      api_key: os.environ/OPENROUTER_API_KEY

  # Embedding model — used by the Auto Router to embed queries (OpenAI call, external traffic/cost)
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

  # Auto Router — default_model/embedding_model are required LiteLLM AutoRouter parameters
  - model_name: auto_router_1
    litellm_params:
      model: auto_router/auto_router_1
      auto_router_config_path: /config/router.json
      auto_router_default_model: claude-sonnet
      auto_router_embedding_model: text-embedding-3-small

router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - claude-sonnet: ["glm-4.7"]
    - glm-4.7: ["claude-sonnet"]

litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: redis
    port: 6379
  success_callback: ["langfuse"]
  failure_callback: ["langfuse"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

**Auto Router config file** (`/config/router.json`):

```json
{
  "routes": [
    {
      "name": "korean-queries",
      "model": "solar-pro-3",
      "utterances": [
        "한국어로 답변해줘",
        "Korea-related question",
        "Korean language query",
        "한국 뉴스",
        "Korean translation"
      ],
      "description": "Korean language or Korea-related queries",
      "score_threshold": 0.5
    },
    {
      "name": "coding-queries",
      "model": "glm-4.7",
      "utterances": [
        "write code",
        "debug this function",
        "코드 작성해줘",
        "programming",
        "fix this bug"
      ],
      "description": "Coding, programming, and debugging queries",
      "score_threshold": 0.5
    }
  ],
  "default_route": "claude-sonnet",
  "encoder": {
    "type": "openai",
    "name": "text-embedding-3-small"
  }
}
```

:::note LiteLLM Auto Router
LiteLLM Auto Router adds a router to `model_list` as `model: auto_router/auto_router_1`, with `auto_router_config_path` for the routing-rule JSON and `auto_router_default_model`/`auto_router_embedding_model` for the default and embedding models (both are required LiteLLM AutoRouter parameters). Sending a request with `model: "auto_router_1"` activates utterance-based routing. Each route in `router.json` must point its `model` field at a model alias defined in `model_list` (`solar-pro-3`, `glm-4.7`), and `default_route` must likewise be a `model_list` alias. The utterances deliberately mix Korean and English phrases to classify both Korean queries and English instructions, so keep examples in both languages when translating.
:::

#### Create Secrets

```bash
kubectl create secret generic litellm-secrets \
  --from-literal=LITELLM_MASTER_KEY='<your-master-key>' \
  --from-literal=OPENAI_API_KEY='<your-openai-key>' \
  --from-literal=OPENROUTER_API_KEY='<your-openrouter-key>'
```

Quote the `<...>` placeholders in single quotes so the shell does not interpret them as redirection, and replace them with real values. The secret key names must match the environment variable names referenced in the config (`LITELLM_MASTER_KEY`).

Bedrock-backed models (Claude/GLM) use IAM auth via EKS Pod Identity, so they need no separate API key. However, the OpenAI embedding model used by the Auto Router (`text-embedding-3-small`) and the externally-routed Solar (OpenRouter) require `OPENAI_API_KEY` and `OPENROUTER_API_KEY` respectively, and those calls generate outbound traffic and cost to external endpoints.

- Redis: Auto-Router embedding cache and LiteLLM response cache (`cache: true` + `type: redis`)
- Service: ClusterIP (port 4000, OpenAI-compatible API)

:::tip Cache type
The `cache: true` + `type: redis` configuration above is an exact-match cache keyed on identical request parameters. A semantic cache that groups similar queries requires additional configuration. For semantic-cache design principles — similarity threshold selection, cache key design (multi-tenant namespace), PII-safe handling, and observability metrics — refer to [Semantic Caching Strategy](../inference-optimization/semantic-caching-strategy.md).
:::

### 5.3 OpenClaw Gateway

#### Deployment

- Image: `ghcr.io/openclaw/openclaw:2026.7.1-2-slim` — the **immutable versioned tag** used by the official install. Do not use `:latest` (it breaks reproducibility and rollback); bump the tag when upgrading ([OpenClaw Kubernetes install](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/install/kubernetes.md)).
- Persistence: a **PersistentVolumeClaim** (10Gi in the official example) is required for agent state and config; after first boot the PVC copy is the source of truth.
- Auth: protect the Control UI/gateway with the gateway token (`OPENCLAW_GATEWAY_TOKEN`), and when exposing beyond loopback add TLS and allowed origins ([OpenClaw gateway security](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/gateway/security/index.md)).
- Resources: 512Mi memory, 250m CPU — an **example** until measured; size from actual request/session load.
- NodeSelector: `kubernetes.io/arch: arm64`
- Service: ClusterIP (port 18789)

#### Config (`openclaw.json`)

The OpenClaw config schema has no top-level `ai` key. Models/providers go under `models`, the agent's default model under the `agents` configuration, and diagnostics under `diagnostics`. The snippet below is a **partial example** showing only the OTel diagnostics; write the model, agent, and gateway settings against the schema of the version you run ([zod-schema.root-shape.ts](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.5/src/config/zod-schema.root-shape.ts)). Also, pinning a fixed model bypasses the LiteLLM Auto Router, so to use routing set the agent's default model to the gateway's `auto_router_1` alias.

```json
{
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true
    }
  }
}
```

### 5.4 Cilium CNI (ENI Mode) + Hubble

**Cilium ENI Mode** — a datapath that assigns Pod IPs directly from the ENI, replacing VPC CNI. Replacing the CNI changes the foundation of cluster networking, so treat it as a separately planned and validated change, not an incidental deployment step.

- Pod IPs assigned directly from ENI
- NetworkPolicy support
- Single eBPF datapath

**Hubble UI** capabilities and prerequisites:

- Interactive service map: visualize request flows between Pods
- **L7 visibility (HTTP paths/status codes) is not enabled automatically.** You must apply an L7 visibility policy (Layer 7 visibility, e.g. `.spec.ingress[].toPorts[].rules.http`) or enable L7 protocol visibility, which routes traffic through the Envoy-based L7 proxy ([Cilium Layer 7 visibility](https://raw.githubusercontent.com/cilium/cilium/v1.18.1/Documentation/observability/visibility.rst)).
- HTTP detail for TLS-encrypted traffic is not visible unless the end-to-end encryption is terminated/intercepted. DNS visibility is likewise collected only within the scope of the visibility policy.
- Because sensitive content can flow through, define capture scope, redaction, and retention.
- Cost: the Cilium/Hubble **software license is $0**, but the node resources used for eBPF data processing and the storage/retention of Hubble flow logs are additional costs.

### 5.5 LLM Observability (Langfuse)

- Langfuse self-hosted Helm chart — besides the Langfuse server and PostgreSQL, it also requires **ClickHouse, Redis, and S3-compatible object storage**. The required components differ by version, so confirm against the [Langfuse Kubernetes (Helm) guide](https://langfuse.com/self-hosting/deployment/kubernetes-helm) for the version you deploy.
- The gateway (LiteLLM) `success_callback: ["langfuse"]` sends LLM calls to Langfuse. This captures only the model calls that pass through the gateway, so to reconstruct the OpenClaw agent's internal tool-execution steps in a single trace you must also propagate the agent's traces.

**Tracked items (gateway LLM calls):**

- Prompt/completion content
- Token usage
- Cost per model
- Tool call chains (when the agent trace is propagated)
- Latency

### 5.6 System Observability (OTEL + Prometheus/Grafana)

- **OTEL Collector**: receives OTLP (gRPC `:4317` and/or HTTP `:4318`) and exports metrics to Prometheus. OpenClaw's `diagnostics-otel` uses OTLP/HTTP (protobuf), so enable the HTTP receiver port (`:4318`).
- Traces and logs need a separate exporter/pipeline to a trace/log backend (e.g. Tempo/Loki or Langfuse), not Prometheus.
- Reuse existing kube-prometheus-stack if available; otherwise deploy via Helm
- OpenClaw metrics: `openclaw.tokens`, `openclaw.cost.usd`, `openclaw.run.duration_ms`, `openclaw.message.*`

---

## Dashboards & Alerts

### Langfuse (LLM Level)

- **Agent Trace Explorer**: Message → LLM call → tool execution → response chain
- **Token Usage**: Token consumption by model and time
- **Cost Analytics**: Daily/weekly cost trends
- **Prompt/Completion Inspector**: View actual inputs and outputs

### Hubble (Network Level)

- **Interactive Service Map**: HTTP request flows between Pods
- **L7 Visibility**: `POST /v1/chat/completions → 200 OK (320ms)`
- **DNS Query Tracking**: Which external APIs are being called

### Grafana (System Level)

- **Gateway Health**: Uptime, connections, memory, CPU
- **LiteLLM**: Cache hit rate, request throughput, latency
- **Pod/Node Resource Usage**

### Alert Rules

The thresholds below are an **example starting point**; tune real alerts to the metric type, observation window, and traffic SLO. For instance, "Pod restart > 3" is an investigation trigger rather than a direct signal that the gateway is down, and latency/error-rate rules are meaningful only when you also define the measurement window and sample size.

**Table 13. Example alert rules and threshold conditions**

| Alert | Condition (example) | Note |
|-------|-----------|------|
| Budget Threshold Approaching | LiteLLM budget &gt; 80% | Per virtual-key budget |
| Gateway Restart Loop | Pod restart &gt; 3 in 5min | Investigation trigger, not a "down" verdict |
| LLM Response Delay | p95 latency &gt; 5s (e.g. 5-min window) | Specify percentile/window per SLO |
| Cache Hit Rate Drop | Cache hit &lt; 30% (given enough samples) | Beware false positives at low traffic |
| Error Rate | Error rate &gt; 5% (e.g. 5-min window) | Specify window and minimum request count |

---

## Verification Checklist

A Pod being `Running` does not mean it is ready to serve traffic, so check readiness, end-to-end behavior, and fault recovery as well.

**Table 14. Deployment verification checklist**

| # | Check | Command / Action |
|---|-------|-----------------|
| 1 | All Pods Ready | `kubectl get pods` — confirm the `READY` column and readiness-probe pass, not just `Running` |
| 2 | Gateway Status | `openclaw status` (after port-forward); check `/readyz` and `/startupz` responses |
| 3 | Auto-Router Routing | Verify model list + routing results in the LiteLLM UI/logs |
| 4 | Service Map | Verify L7 flows between Pods in Hubble UI (with the L7 visibility policy applied) |
| 5 | LLM Trace | Verify prompt → tool → response trace in Langfuse UI |
| 6 | System Metrics | Check Grafana dashboards |
| 7 | Bedrock Audit | Check CloudTrail logs |
| 8 | Routing Validation (end-to-end) | Send Korean / coding / general queries individually and confirm the actual routed model matches expectations |
| 9 | Spot Stability | Verify Karpenter node transition events with `kubectl get events`, confirm replacement node provisioning with `kubectl get nodeclaims`, and confirm end-to-end that requests recover after an interruption |

---

:::tip Next Steps
- Adding self-hosted vLLM: See [llm-d Distributed Inference](../../model-serving/inference-frameworks/llm-d-eks-automode.md) for `LiteLLM → llm-d → vLLM` hybrid setup
- Bifrost alternative: You can replace LiteLLM with Bifrost (OpenAI-compatible, Go-based), but its config format, default port (8080), and auth token differ, so the config in this document must be rewritten in Bifrost's format
- Adding vector search RAG: See [Milvus Vector DB](../../operations-mlops/data-infrastructure/milvus-vector-database.md)
- Agent evaluation: Measure response quality with [Ragas Evaluation](../../operations-mlops/governance/ragas-evaluation.md)
:::
