---
title: "Architecture Draw.io Prompt"
sidebar_label: "Draw.io Prompt"
last_update:
  date: 2026-03-25
---

# LG U+ Agentic AI Platform - Architecture Draw.io Prompt

## Architecture Overview

### Design Goals

This architecture serves as a **reference architecture** for building a telecom-scale Agentic AI Platform on Amazon EKS. The core design principles are:

- **Kubernetes Native**: All AI workloads are declaratively managed on EKS with GPU node auto-scaling via Karpenter.
- **Environment Separation**: Production and Staging/Dev are separate EKS clusters. Prod emphasizes data sovereignty (Langfuse self-hosted), while Stag/Dev prioritizes developer velocity (LangSmith + LangGraph Studio).
- **Streamlined Ingress**: CloudFront → WAF → NLB (auto-provisioned by kgateway Service) → kgateway. ALB is eliminated to reduce latency hops and cost (50~75% LB cost reduction). AWS Shield Advanced protects the NLB endpoint. Authentication uses kgateway in-memory JWT validation (~µs) with IAM Identity Center OIDC, requiring no additional auth proxy Pods.
- **2-Tier Gateway**: Separates kgateway (authentication, routing, traffic control) from Bifrost (LLM provider aggregation, fallback, cost tracking) to isolate concerns. Bifrost is a Go-based high-performance gateway (~11µs overhead at 5k RPS).
- **Knowledge Feature Store**: Extends the LLM Feature Store with an ontology layer (Knowledge Graph) for structured reasoning. Combines Vector RAG (Milvus) with GraphRAG (Neo4j/Neptune) and ontology schema (OWL/RDF) for relationship-based retrieval beyond similarity search.
- **Hybrid Observability**: Dev/staging uses LangSmith (LangGraph Studio native integration), while production uses Langfuse (self-hosted, data sovereignty). GPU infrastructure monitored via DCGM → AMP → AMG. Pod-level cost attribution via Kubecost. Bifrost integrates with Langfuse via OpenTelemetry for gateway-level traces.
- **Graceful Operations**: Zero-downtime Karpenter consolidation via vLLM `--shutdown-timeout` + llm-d drain-aware routing + PDB. EKS upgrades via Blue/Green NodePool with llm-d weight-based traffic shifting.
- **EKS + AgentCore Hybrid**: Core LLM inference and Knowledge Feature Store run on EKS (GPU control, data sovereignty). Bedrock AgentCore complements as a managed layer for MCP Gateway, A2A hub, AG-UI streaming, and lightweight serverless agents.
- **On-Premise ↔ Cloud Integration**: Bridges on-premise GPU resources (Colab-Co for training, Sangam for inference) with cloud-based ML pipelines.
- **Standard Protocols**: Adopts MCP (tool connectivity), A2A (agent-to-agent communication), and AG-UI (agent-to-frontend streaming) standards for agent extensibility.

### Layer Roles

| Layer | Role | Key Components |
|-------|------|----------------|
| **Portal Layer** | User interface, observability dashboards, notebook environment | Portal UI, LangSmith, Langfuse, JupyterHub |
| **Orchestration Layer** | Agent workflow execution, API serving, RAG chain, safety filtering, LLM routing | kgateway, FastAPI, LangChain, LangGraph, RAG Chain, NeMo Guardrails, Bifrost |
| **Model Serving Layer** | LLM text generation (vLLM) and non-LLM inference (Triton), KV Cache-aware intelligent distribution | llm-d, vLLM (Large/Medium/Small/LoRA), Triton (Embedding/Reranking/STT) |
| **Model Pipeline Layer** | Model registry, experiment tracking, offline evaluation, training pipeline orchestration | MLflow, ECR, DeepEval, Kubeflow Pipelines |
| **Data Foundry Layer** | Document parsing for RAG, vector indexing, data labeling, feedback loop | Unstructured.io, Milvus, Label Studio, Langfuse |

### Knowledge Feature Store (Cross-Layer Logical Group)

The Knowledge Feature Store extends the LLM Feature Store with an **ontology layer** for structured knowledge reasoning. It bundles components spanning multiple layers into a unified knowledge surface:

| Component | Source Layer | Role in Feature Store |
|-----------|-------------|----------------------|
| **Knowledge Graph (Neo4j/Neptune)** | Data Foundry | Entity-relationship graph, SPARQL/Cypher query, ontology reasoning |
| **Ontology Schema (OWL/RDF)** | Data Foundry | Domain model (telecom: plans, services, terms, rules) |
| **Langfuse Prompt Mgmt** | Portal / Orchestration | Prompt template versioning, A/B testing |
| **Semantic Cache (Redis)** | Orchestration | Cache frequent LLM responses, reduce latency & cost |
| **RAG Chain (Vector + Graph)** | Orchestration | Hybrid retrieval: Vector RAG (similarity) + GraphRAG (relationship) |
| **Milvus (Vector DB)** | Data Foundry | Vector similarity search for RAG retrieval |
| **Triton BGE-M3 Embedding** | Model Serving | Document/query embedding for vector indexing |
| **Unstructured.io** | Data Foundry | Document parsing and chunking for RAG ingestion |

> **Vector RAG vs GraphRAG**: Vector RAG finds "similar document chunks". GraphRAG traverses entity relationships for "rule-chain reasoning" (e.g., plan → speed limit → overage condition → auto-switch rule → related terms). The combination reduces hallucination and enables fact-chain verification.

### Environment Separation

| Aspect | Production | Staging / Dev |
|--------|-----------|---------------|
| **EKS Cluster** | Dedicated Prod cluster | Shared Stag/Dev cluster |
| **Observability** | Langfuse (self-hosted, data sovereignty) | LangSmith (LangGraph Studio native) |
| **GPU Resources** | Full GPU allocation (H100/L40s) | Reduced GPU, spot instances |
| **Ingress** | CloudFront → WAF → NLB → kgateway | NLB → kgateway (simplified) |
| **Guardrails** | NeMo Guardrails enforced | NeMo Guardrails optional |
| **Cost Tracking** | Bifrost hierarchical (key/team/customer) | Bifrost basic |

### External Integrations

| Area | Role |
|------|------|
| **Bedrock AgentCore** | Managed MCP Gateway (Stateful, auth built-in), A2A hub (agent discovery/delegation), AG-UI proxy (SSE/WebSocket streaming), lightweight serverless agents, Managed Memory |
| **External LLMs** | 10+ model providers including Bedrock, SageMaker, OpenAI, Claude, Gemini, Qwen, DeepSeek |
| **AWS Storage & DB** | S3, DynamoDB, OpenSearch, ElastiCache, RDS, EFS, FSx Lustre, Neptune (Knowledge Graph option) |
| **Monitoring & Security** | AMP/AMG (infra metrics), DCGM Exporter (GPU metrics), Kubecost (Pod-level cost), CloudWatch, X-Ray (ADOT), Secrets Manager, KMS, GuardDuty |
| **On-Premise** | Colab-Co (H100/H200 training), Sangam (H200/H100/L40s inference) |
| **GitOps** | ArgoCD — declarative deployment management from outside the EKS cluster |

### EKS vs AgentCore Workload Placement

| Workload | Placement | Reason |
|----------|-----------|--------|
| LLM inference (vLLM + llm-d) | EKS | GPU control, Karpenter, KV Cache optimization |
| Core agents (AICC, complex workflows) | EKS | Ontology integration, custom Guardrails, Langfuse |
| Knowledge Feature Store | EKS | Neo4j/Milvus direct operation, data sovereignty |
| MCP Gateway (external tools) | AgentCore | Managed Stateful MCP, auth built-in, long-running sessions |
| A2A hub (agent collaboration) | AgentCore | Framework-agnostic, managed discovery/delegation |
| AG-UI (frontend streaming) | AgentCore | Managed SSE/WebSocket, session isolation (microVM) |
| Lightweight agents (FAQ, routing) | AgentCore | Serverless, zero ops, auto-scaling |

### Graceful Operations Strategy

| Event | Strategy | Key Configuration |
|-------|----------|-------------------|
| **Karpenter consolidation** | vLLM graceful drain + llm-d drain-aware routing | `--shutdown-timeout=240`, `terminationGracePeriodSeconds=300`, PDB `maxUnavailable=1`, Karpenter `budgets: nodes=1` |
| **EKS version upgrade** | Blue/Green NodePool + llm-d weight-based traffic shift | Create GREEN NodePool → pre-load models → HTTPRoute weight shift (30/70 → 0/100) → delete BLUE |
| **Long-running sessions** | AgentCore Runtime (microVM session isolation) | AICC consultations, multi-step agent workflows delegated to AgentCore |
| **Future: GPU live migration** | CRIU-based (Cast AI / K8s WG checkpoint/restore) | KV Cache preservation for in-flight LLM inference (pending GPU CRIU maturity) |

---

Provide the prompt below to draw.io AI or Claude to generate the architecture diagram.

---

## Prompt

```
Generate a draw.io XML for the LG U+ Agentic AI Platform architecture on EKS with the following specifications.

## Overall Layout

- Title: "LG U+ Agentic AI Platform - Improved EKS Architecture (v7)"
- Canvas size: 2600px wide, 1500px tall
- Background: white
- Font: Noto Sans KR (or system default sans-serif)
- Traffic flows left-to-right, layers stack top-to-bottom
- The canvas is split into two environment zones side by side:
  - **Left zone (x=0~1600)**: Production environment (full detail)
  - **Right zone (x=1630~2600)**: Staging / Dev environment (simplified mirror) + Bedrock AgentCore zone
- A vertical dashed divider line at x=1615, label: "Environment Boundary"

---

## Color Palette

| Purpose | Background | Text | Border |
|---------|-----------|------|--------|
| AWS Services | #FF9900 | #FFFFFF | #CC7A00 |
| Kubernetes/EKS | #326CE5 | #FFFFFF | #2855B8 |
| GPU/NVIDIA | #76B900 | #FFFFFF | #5E9400 |
| ML/AI Frameworks | #FFD93D | #333333 | #CCB030 |
| Security/Auth | #FF6B6B | #FFFFFF | #CC5555 |
| Monitoring/Observability | #9C27B0 | #FFFFFF | #7B1FA2 |
| Data/Storage | #00BCD4 | #FFFFFF | #0097A7 |
| External Services | #E0E0E0 | #333333 | #BDBDBD |
| On-Premise | #F8BBD0 (dashed border) | #333333 | #E91E63 |
| User/Client | #34A853 | #FFFFFF | #2D8F47 |
| Knowledge Feature Store (logical group) | #E0F7FA (dashed border) | #006064 | #00ACC1 |
| Knowledge Graph / Ontology | #1565C0 | #FFFFFF | #0D47A1 |
| Bedrock AgentCore | #FF9900 (dashed border) | #FFFFFF | #CC7A00 |
| Stag/Dev Zone | #F1F8E9 (light green bg) | #333333 | #689F38 |

---

## Left Side: Users & Agent Ready (x=0~120)

### User Group (top)
- Icon: person shape
- Label: "Users"
- Sub-label: "Modelers / Service Teams / Admins"

### Agent Ready Box (middle)
- Container box, border: #326CE5, background: #E8F0FE
- Title: "Agent Ready"
- Internal boxes (small rounded rectangles, 2-column layout):
  - "ixi-Enterprise" (bg #326CE5, white text)
  - "Sales Agent" (bg #FFD93D, black text)
  - "Legal Agent" (bg #FFD93D, black text)
  - "Billing Agent" (bg #FFD93D, black text)
  - "AICC Agent" (bg #FFD93D, black text)
  - "Agent Builder" (bg #FFD93D, black text)

### ArgoCD (bottom, below Agent Ready)
- Background: #FF6B6B, white text
- Label: "ArgoCD (EKS Add-on)"
- Note: GitOps deployment — managed outside EKS cluster

---

## Entry Points (x=130~200, vertically centered)

Stacked vertically top-to-bottom, connected by arrows:
1. **Route 53** (AWS orange, small box)
2. **CloudFront + Shield Advanced** (AWS orange, label: "CloudFront + Shield")
3. **WAF** (security red)
4. **NLB** (AWS orange, label: "NLB (auto-provisioned)", small text below: "kgateway Service type: LoadBalancer")
Arrow from NLB enters the EKS cluster → kgateway.
Dashed arrow from ArgoCD (bottom-left) to EKS cluster (GitOps deployment).

> **Auth Architecture (JWT Validation)**:
> - ALB is removed. NLB is auto-provisioned by kgateway's Kubernetes Service (type: LoadBalancer).
> - WAF is enforced at CloudFront level. Shield Advanced protects CloudFront + NLB endpoints.
> - **Web browsers**: Portal UI → IAM Identity Center (OIDC login) → JWT issued → kgateway validates JWT in-memory (~µs, no external call).
> - **API/Agent (M2M)**: Client → IAM Identity Center (Client Credentials Grant) → JWT issued → kgateway validates JWT.
> - kgateway caches JWKS (public keys) from IAM Identity Center and validates tokens in-process. No additional Pod (e.g., OAuth2 Proxy) is required.
> - JWT claims (team, role) are mapped to Bifrost Virtual Keys for budget/permission control.
> - **IAM Identity Center** is shown as a dashed connection to kgateway (label: "OIDC / JWKS"), not as an inline entry point box.

---

## Center: Amazon EKS Cluster (x=210~1150, y=30~1050)

Large blue dashed container box:
- Title: "Amazon EKS Cluster (Karpenter Auto-scaling)"
- Border: #326CE5, dashed, background: #F0F4FF (very light blue)

### 5 Internal Layers (top to bottom)

---

#### Layer 1: Portal Layer (y=50~190, light purple bg #F3E5F5)

Container title: "① Portal Layer"

Internal boxes (horizontal layout):
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Portal UI (Next.js) | #326CE5 | |
| 2 | Langfuse (Prod Observability + Prompt Mgmt) | #9C27B0 | Show "Production" label |
| 3 | JupyterHub (Notebook) | #FFD93D | |

> Langfuse is Production-only. LangSmith appears only in the Stag/Dev zone (right side).
> Small text below Langfuse: "Self-hosted, data sovereignty, MIT license"
> OpenSearch moved to AWS Storage & DB area on the right. ArgoCD moved to entry point area on the left.

---

#### Layer 2: Orchestration Layer (y=220~450, light blue bg #E3F2FD)

Container title: "② Orchestration Layer (LangChain + LangGraph)"

Arrange internally as **4 sub-groups**:

**Gateway Tier (top, full width):**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | kgateway (Gateway API / Auth / Rate Limit / TLS / WebSocket·SSE Native) | #326CE5 | Indicate Envoy HTTP/1.1 Upgrade support |

Small text below kgateway: "Path routing: /api/* → FastAPI, /ws/* → WebSocket, /v1/* → Bifrost (AI)"

**Core Services (left):**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | FastAPI (API + WebSocket + SSE) | #34A853 | Single unified box (API Server + WebSocket merged) |
| 2 | Redis (Session + Cache) | #FF6B6B | LangGraph checkpointer |

**Agent Framework (center):**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | LangChain (Agent Runtime) | #FFD93D | |
| 2 | LangGraph (Workflow + ReAct + Tool Registry) | #FFD93D | MCP/A2A/AG-UI protocol support |

> Agent Ready apps connect to LangGraph via MCP/A2A standard protocols.
> LangGraph registers ontology_query (SPARQL/Cypher), vector_search, entity_resolve, rule_engine as Tools.
> LangGraph code runs on EKS (self-hosted) for core agents, or on Bedrock AgentCore Runtime for lightweight agents.
> AG-UI protocol connects agents to Portal UI via AgentCore for real-time streaming.

**RAG Pipeline (upper right, inside LLM Feature Store overlay):**
| # | Label | Background |
|---|-------|-----------|
| 1 | RAG Chain | #00BCD4 |

> RAG Chain is visually enclosed by the cross-layer "LLM Feature Store" dashed overlay (see below).

**Safety (lower right):**
| # | Label | Background |
|---|-------|-----------|
| 1 | NeMo Guardrails (Input/Output Filter) | #FF6B6B |

**LLM Router (bottom, full width):**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Bifrost (LLM Router / Fallback / Cost Tracking / OTel) (or LiteLLM — mature ecosystem alternative) | #FF9900 | Infra-level cost aggregation, OTel→Langfuse integration |

> Bifrost is a Go-based high-performance router with native support for 20+ LLM providers, hierarchical cost tracking (key/team/customer), semantic caching, and MCP tool filtering. It delivers 40~50x faster gateway performance (~11µs/req at 5k RPS) compared to LiteLLM. Langfuse integration is achieved via OpenTelemetry. Consider LiteLLM as an alternative when 100+ long-tail providers or Langfuse native plugin is required.

---

#### Layer 3: Model Serving Layer (y=480~650, light green bg #E8F5E9)

Container title: "③ Model Serving Layer (vLLM + Triton)"

Arrange in 2 tiers:

**Tier 1 (Inference Gateway):**
| # | Label | Background |
|---|-------|-----------|
| 1 | llm-d Inference Gateway (KV Cache-aware Routing) | #76B900 |

llm-d box spans 80% of the full width, centered.

**Tier 2 (Serving Engines):**
| # | Label | Background | Size | Note |
|---|-------|-----------|------|------|
| 1 | vLLM - Large (Qwen3-72B, TP=4, H100x4) | #FFD93D | Wide | LLM text generation |
| 2 | vLLM - Medium (Qwen3-32B, TP=2, H100x2) | #FFD93D | Medium | LLM text generation |
| 3 | vLLM - Small (EXAONE-32B, TP=2) | #FFD93D | Medium | LLM text generation |
| 4 | vLLM - LoRA (7B + LoRA, MIG) | #FFD93D | Small | LLM text generation |
| 5 | Triton Inference Server (Whisper STT / BGE-M3 Embedding / Reranker) | #9C27B0 | Medium | Non-LLM inference |

> Triton handles non-LLM inference: speech recognition (Whisper), embeddings (BGE-M3), and reranking.

Bottom horizontal bar box:
- "GPU: NVIDIA H100/L40s (EKS Auto Mode + Karpenter)" — bg #76B900
- Small text below: "Graceful Ops: vLLM --shutdown-timeout=240 · llm-d drain-aware routing · PDB maxUnavailable=1"
- Small text second line: "GPU Monitoring: DCGM Exporter → AMP → AMG · Kubecost (Pod-level cost)"

---

#### Layer 4: Model Pipeline Layer (y=680~810, light yellow bg #FFF9C4)

Container title: "④ Model Pipeline Layer (MLflow + Kubeflow)"

Internal boxes (horizontal layout):
| # | Label | Background |
|---|-------|-----------|
| 1 | MLflow (Model Registry / Experiment Tracking) | #326CE5 |
| 2 | ECR (Container Image) | #FF9900 |
| 3 | DeepEval (Offline Evaluation) | #9C27B0 |
| 4 | Kubeflow Pipelines (Orchestration) | #FFD93D |

Bottom text flow arrow:
"Model Lifecycle: On-Prem Training → S3 Upload → MLflow Register → DeepEval Evaluate → ArgoCD Deploy"

---

#### Layer 5: Data Foundry Layer (y=840~990, light red bg #FFEBEE)

Container title: "⑤ Data Foundry Layer (RAG + Knowledge Graph Pipeline)"

Internal boxes (horizontal layout):
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Unstructured.io (Document Parsing / Chunking) | #00BCD4 | Inside Knowledge Feature Store overlay |
| 2 | Milvus (Vector DB) | #326CE5 | Inside Knowledge Feature Store overlay |
| 3 | Neo4j / Neptune (Knowledge Graph) | #1565C0 | Inside Knowledge Feature Store overlay, white text |
| 4 | Glue Catalog (Metadata) (Optional — for governance) | #FF9900 | Dashed border |
| 5 | Label Studio (Data Labeling) | #FF6B6B | |
| 6 | Langfuse (Feedback Loop) | #9C27B0 | |

> Neo4j (self-hosted on EKS) or Amazon Neptune (managed) for Knowledge Graph. Contains telecom domain ontology schema (OWL/RDF): plans, services, terms, rules, customer relationships.
> Glue Catalog is optional, used only when data governance is required.

---

### Knowledge Feature Store Overlay (Cross-Layer Dashed Group)

Draw a large **dashed overlay container** (bg #E0F7FA, opacity 15%, border #00ACC1, dashed, rounded) that spans across layers ②③⑤ and visually groups the following components:

| Component | Layer | Position in Overlay |
|-----------|-------|---------------------|
| Langfuse Prompt Mgmt | ① Portal → ② Orchestration | Top-right of overlay |
| Semantic Cache (Redis) | ② Orchestration | Top-left of overlay |
| RAG Chain (Vector + Graph) | ② Orchestration | Center of overlay |
| Triton BGE-M3 Embedding | ③ Model Serving | Middle of overlay |
| Neo4j / Neptune (Knowledge Graph) | ⑤ Data Foundry | Bottom-right of overlay |
| Milvus (Vector DB) | ⑤ Data Foundry | Bottom-center of overlay |
| Unstructured.io | ⑤ Data Foundry | Bottom-left of overlay |

- Overlay title (top-right, outside border): "Knowledge Feature Store"
- The overlay does NOT move or duplicate the components — it draws a dashed boundary around their existing positions
- The overlay sits behind the layer containers (lower z-index) so layer backgrounds remain visible
- Small annotation below the overlay title: "Ontology · GraphRAG · Vector RAG · Prompt Mgmt · Semantic Cache · Document Processing"

---

## Right Zone: Staging / Dev Environment (x=1630~2350)

### Stag/Dev EKS Cluster

Container box (bg #F1F8E9, border #689F38, dashed):
- Title: "Staging / Dev EKS Cluster (Karpenter — spot instances)"

Simplified mirror of the Prod cluster with these differences:

**Entry Point (simplified):**
- NLB → kgateway (no CloudFront, no WAF, no Shield)

**Portal Layer:**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Portal UI (Next.js) | #326CE5 | |
| 2 | LangSmith (Observability + LangGraph Studio) | #FFD93D | "Dev/Staging" label |
| 3 | JupyterHub | #FFD93D | |

> Small text below LangSmith: "LangGraph Studio native integration"

**Orchestration Layer (simplified):**
| # | Label | Background |
|---|-------|-----------|
| 1 | kgateway | #326CE5 |
| 2 | FastAPI | #34A853 |
| 3 | LangChain + LangGraph | #FFD93D |
| 4 | Bifrost (basic) | #FF9900 |

**Model Serving Layer (simplified):**
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | vLLM - Small (dev models, spot GPU) | #FFD93D | Reduced GPU |
| 2 | Triton (Embedding/Rerank) | #9C27B0 | |

**Data Foundry (simplified):**
| # | Label | Background |
|---|-------|-----------|
| 1 | Milvus (dev) | #326CE5 |
| 2 | Unstructured.io | #00BCD4 |

> NeMo Guardrails is optional in Stag/Dev (shown as dashed border).
> Model Pipeline Layer is shared with Prod (MLflow, ECR, Kubeflow are accessed cross-environment).

### Shared Services (between Prod and Stag/Dev)

Draw dashed arrows crossing the environment boundary for:
- MLflow (Model Registry) — shared across both environments
- ECR (Container Images) — shared
- S3 (Model Artifacts, Data) — shared
- IAM Identity Center — shared OIDC provider
- ArgoCD — deploys to both clusters

Small annotation at the boundary: "Shared: MLflow · ECR · S3 · IAM IdC · ArgoCD"

---

## Right Zone: Bedrock AgentCore (x=1630~2600, y=800~1250)

Container box (bg #FFF3E0, border #FF9900, dashed):
- Title: "Bedrock AgentCore (Managed Agent Runtime)"
- Small text: "Serverless · microVM session isolation · Auto-scaling"

Internal boxes (vertical layout):
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | MCP Gateway (Stateful, Auth built-in) | #FF9900 | "Elicitation · Sampling · Progress · Long-running" |
| 2 | A2A Hub (Agent Discovery / Delegation) | #FF9900 | "Framework-agnostic: LangGraph, Strands, OpenAI SDK, Google ADK" |
| 3 | AG-UI Proxy (Agent → Frontend Streaming) | #FF9900 | "SSE / WebSocket · Real-time state sync" |
| 4 | Lightweight Agents (FAQ / Routing) | #FFD93D | "Serverless, zero ops" |
| 5 | Managed Memory (Session + Long-term) | #FF9900 | "Cross-session persistence" |
| 6 | Bedrock Guardrails | #FF6B6B | "Supplementary to NeMo Guardrails" |

> AgentCore complements EKS — it does NOT replace the core inference and knowledge layers.
> LangGraph agent code can deploy to both EKS (core agents) and AgentCore (lightweight agents) without code changes.
> AgentCore resolves long-running session challenges (AICC consultations, multi-step workflows) via microVM session isolation, reducing need for CRIU in the agent orchestration layer.

Dashed arrows:
- EKS LangGraph --dashed--> AgentCore A2A Hub (label: "A2A delegation")
- AgentCore MCP Gateway --dashed--> External Tools (label: "Stateful MCP")
- AgentCore AG-UI --dashed--> Portal UI (label: "AG-UI streaming")
- AgentCore Lightweight Agents --dashed--> Bifrost (label: "LLM calls via Bifrost")

---

## Upper Right: External LLMs (x=1170~1510, y=30~220)

Container box, title: "External LLMs", bg #F5F5F5

Internal boxes (2-column layout):
| # | Label | Background |
|---|-------|-----------|
| 1 | Amazon Bedrock | #FF9900 |
| 2 | SageMaker Endpoint | #FF9900 |
| 3 | OpenAI | #E0E0E0 |
| 4 | Claude | #E0E0E0 |
| 5 | Gemini | #E0E0E0 |
| 6 | Llama 3 | #E0E0E0 |
| 7 | Mistral | #E0E0E0 |
| 8 | EXAONE | #E0E0E0 |
| 9 | Qwen | #E0E0E0 |
| 10 | DeepSeek | #E0E0E0 |

---

## Middle Right: AWS Storage & DB (x=1170~1510, y=250~460)

Container box, title: "AWS Storage & DB", bg #FFF3E0

Internal boxes (3-column layout):
| # | Label | Background |
|---|-------|-----------|
| 1 | S3 | #FF9900 |
| 2 | DynamoDB | #FF9900 |
| 3 | OpenSearch | #FF9900 |
| 4 | ElastiCache | #FF9900 |
| 5 | RDS | #FF9900 |
| 6 | EFS | #FF9900 |
| 7 | FSx Lustre | #FF9900 |
| 8 | Neptune (Knowledge Graph option) | #FF9900 |

---

## Lower Right 1: Monitoring & Security (x=1170~1510, y=490~660)

Container box, title: "Monitoring & Security", bg #F3E5F5

Internal boxes:
| # | Label | Background |
|---|-------|-----------|
| 1 | AMP (Managed Prometheus) | #9C27B0 |
| 2 | AMG (Managed Grafana) | #9C27B0 |
| 3 | DCGM Exporter (GPU Metrics) | #76B900 |
| 4 | Kubecost (Pod-level Cost) | #00BCD4 |
| 5 | CloudWatch | #FF9900 |
| 6 | X-Ray (ADOT) | #FF9900 |
| 7 | Secrets Manager | #FF6B6B |
| 8 | KMS | #FF6B6B |
| 9 | GuardDuty | #FF6B6B |

---

## Lower Right 2: On-Premise (x=1170~1510, y=690~940)

### On-Premise (Colab-Co) - Training
- Dashed border container, bg #F8BBD0
- Title: "On-Premise (Colab-Co) - Training"
- Contents:
  - "H100 x16 (128 GPUs) / Slurm + Ray"
  - "H200 x26 (208 GPUs) / DeepSpeed/FSDP"
  - "Megatron-LM / NeMo Framework"

### On-Premise (Sangam) - Inference
- Dashed border container, bg #F8BBD0
- Title: "On-Premise (Sangam) - Inference"
- Contents:
  - "H200 x2, H100 x6, L40s x6 (88 GPUs)"
  - "K-EXAONE | ixi-GEN | GPT-OSS | STT/TTS"

---

## Arrows (Connections)

> **Arrow Routing Principles — Arrows MUST NOT cross over unrelated objects. Follow the rules below strictly.**

### Routing Channels (Dedicated Corridors)

Route arrows through **dedicated channels** instead of across objects.
Each channel occupies empty space with no objects.

| Channel | Position | Purpose |
|---------|----------|---------|
| **Left Ingress Lane** | x=120~200 (Entry Points area) | User → EKS ingress flow only |
| **Inter-Layer Gap** | 30px gap between each layer | Vertical connections between layers (short straight lines only) |
| **Right Export Lane** | x=1140~1165 (EKS cluster right boundary) | EKS → external services (External LLMs, Storage, Monitoring) |
| **Bottom Pipeline Lane** | y=1000~1040 (margin below Layer 5) | Model Pipeline horizontal flow (On-Prem → S3 → MLflow → Deploy) |
| **AgentCore Bridge** | x=1600~1630 (Environment Boundary) | EKS ↔ AgentCore connections (vertical path) |
| **Monitoring Bus** | x=1130 (EKS internal right margin), vertical bar | Consolidate all monitoring arrows into a single bus |

### Port Convention (Entry/Exit Direction)

All object boxes connect arrows in a consistent direction:

| Direction | Usage |
|-----------|-------|
| **Top (↓ in)** | Incoming requests from upper layers |
| **Bottom (↓ out)** | Outgoing requests to lower layers |
| **Right (→ out)** | Connections to external services / Monitoring Bus |
| **Left (← in)** | Ingress traffic (entering from Ingress Lane) |

---

### Flow 1: Ingress (solid, black, strokeWidth=2)

Straight left-to-right flow. Descend vertically along the Left Ingress Lane, then enter EKS.

1. Users → Route 53 → CloudFront (+ Shield) → WAF → NLB
   - Vertical stack: each box bottom → next box top (straight line)
2. NLB →(right) kgateway (enters EKS cluster via left port)

### Flow 2: Auth (dashed, #FF6B6B, strokeWidth=1)

Place IAM Identity Center next to Entry Points area (x=60, y=center).
Arrows use the left margin of the Left Ingress Lane to avoid overlapping other flows.

3. IAM Identity Center ←→ kgateway (label: "OIDC / JWKS", horizontal dashed, 5px offset below Ingress arrow)
4. Portal UI --→ IAM Identity Center (label: "OIDC Login", diagonal upper-left)
5. API Client --→ IAM Identity Center (label: "Client Credentials", diagonal lower-left)

### Flow 3: EKS Request Path (solid, #326CE5, strokeWidth=2)

**Within a layer**: horizontal. **Between layers**: vertical via Inter-Layer Gap. NEVER route through another layer's objects.

**Within Layer ② (horizontal flow, left → right):**
6. kgateway →(bottom) forks into two paths:
   - 6a. kgateway → FastAPI (label: "/api/*, /ws/*")
   - 6b. kgateway → Bifrost (label: "/v1/* AI traffic")
7. FastAPI →(right) LangChain/LangGraph
8. LangChain →(right) NeMo Guardrails (bidirectional, horizontal)
9. LangChain →(bottom) RAG Chain (vertical, toward Inter-Layer Gap)
10. LangChain →(bottom) Bifrost (label: "LLM calls", vertical)

**Layer ② → ③ (vertical, Inter-Layer Gap):**
11. Bifrost →(bottom) llm-d Inference Gateway
12. RAG Chain →(bottom) Triton BGE-M3 (Embedding, vertical)

**Within Layer ③ (horizontal):**
13. llm-d →(bottom) vLLM Large / Medium / Small / LoRA (fan-out, short vertical arrows)

**Layer ② → ⑤ (RAG vertical path, via EKS internal right margin x=1120):**
14. RAG Chain → Triton (Embedding) →(bottom) Milvus (label: "Vector RAG", vertical straight)
15. RAG Chain →(right, via right margin then bottom) Neo4j/Neptune (label: "GraphRAG · SPARQL/Cypher")
    - Path: RAG Chain right → descend at x=1120 → enter Neo4j left (L-shaped path)

**Layer ② → External (right exit):**
16. Bifrost →(right) Right Export Lane → External LLMs (horizontal straight)

### Flow 4: Data Pipeline (dashed, #00BCD4, strokeWidth=1.5)

Flows horizontally along the Bottom Pipeline Lane (y=1000~1040). Minimize vertical connections.

17. On-Premise (Colab-Co) →(right) S3 (Bottom Pipeline Lane, horizontal)
18. S3 →(left) MLflow →(right) DeepEval →(right) ArgoCD (Bottom Pipeline Lane, horizontal chain)
19. ArgoCD →(up) vLLM (vertical ascent, straight from ArgoCD position)
20. Unstructured.io →(up) Triton BGE-M3 →(right) Milvus (within Layer ⑤, horizontal)

### Flow 5: Monitoring Bus (dashed, #9C27B0, strokeWidth=1)

**Monitoring Bus Bar**: Place a purple vertical bar at the EKS cluster internal right margin (x=1130), spanning the full height of Layers ①~⑤.
Each component connects to the bus with **one short horizontal arrow**. Only **one arrow** exits the bus to external services.

```
[vLLM/llm-d] ──→ ┃                          ┃ ──→ [AMP → AMG]
[DCGM Exporter] ─→ ┃  Monitoring Bus          ┃ ──→ [Kubecost]
[FastAPI] ────→ ┃  (x=1130, vertical bar)  ┃ ──→ [CloudWatch/X-Ray]
[Bifrost] ────→ ┃                          ┃
```

Individual connections:
21. vLLM, llm-d, DCGM Exporter →(right) Monitoring Bus (short horizontal, no label)
22. FastAPI →(right) Monitoring Bus (short horizontal)
23. Bifrost →(right) Monitoring Bus (short horizontal, label: "OTel")
24. Monitoring Bus →(right) Right Export Lane → AMP/AMG (label: "Metrics + Traces")
25. Monitoring Bus →(right) Right Export Lane → Kubecost (label: "Cost")

**Application-level Observability (separate, not via bus):**
26. [Prod] FastAPI →(up) Langfuse (vertical ascent within same layer, short arrow)
27. [Stag/Dev] FastAPI →(up) LangSmith (within Stag/Dev zone, short arrow)
28. Bifrost (OTel) →(up) Langfuse (label: "Gateway traces", vertical within Layer ②)
29. Langfuse →(bottom) Label Studio (within Layer ⑤, vertical)

### Flow 6: AgentCore (dashed, #FF9900, strokeWidth=1.5)

Routes via AgentCore Bridge (x=1600~1630). All arrows cross the Environment Boundary horizontally.

30. LangGraph →(right) AgentCore A2A Hub (horizontal, label: "A2A delegation")
31. AgentCore AG-UI →(left) Portal UI (horizontal return, label: "AG-UI streaming")
32. AgentCore Lightweight Agents →(left) Bifrost (horizontal, label: "LLM calls")
33. AgentCore MCP Gateway →(right) External Tools (right exit, label: "Stateful MCP")

> AgentCore Managed Memory ↔ EKS Redis connection is optional — show as **annotation text only** (no arrow).

### Flow 7: GitOps & On-Premise (dashed, strokeWidth=1)

**GitOps (red #FF6B6B):**
34. ArgoCD →(right) EKS Cluster left boundary (label: "GitOps deploy", via bottom of Left Ingress Lane)

**On-Premise (pink #E91E63):**
35. On-Premise (Sangam) →(up) Bifrost (label: "Self-hosted inference", via bottom of Right Export Lane then enter left)
36. On-Premise (Colab-Co) →(right) S3 (Bottom Pipeline Lane, shared with Flow 4)

---

## Annotations & Legend

Bottom-left legend box (2-column layout):

| Style | Meaning |
|-------|---------|
| ━━ Solid black (2px) | Ingress flow |
| ━━ Solid blue (2px) | EKS internal request path |
| ┅┅ Teal dashed (1.5px) | Data pipeline |
| ┅┅ Purple dashed (1px) | Monitoring (via Bus) |
| ┅┅ Red dashed (1px) | Auth (OIDC/JWT) & GitOps |
| ┅┅ Orange dashed (1.5px) | Bedrock AgentCore |
| ┅┅ Pink dashed (1px) | On-Premise connections |
| ▮ Purple vertical bar | Monitoring Bus |

Bottom-right version info:
- "v7.1 | 2026-03-25 | Arrow routing channels + Monitoring Bus + Port convention + Relaxed spacing"

---

## Style Rules

1. All boxes use rounded rectangles (rounded=1, arcSize=10)
2. Container box titles are top-left aligned, bold
3. Internal component boxes default to 100px wide, 50px tall
4. Component box text: first line service name (bold), second line tech name (regular)
5. Arrows use orthogonal routing (right-angle bends), **no diagonal lines except Auth flow**
6. Inter-layer spacing: 30px — this gap is reserved for vertical arrow routing only (no objects)
7. Intra-layer box spacing: 15px
8. All text is center-aligned
9. **Arrow routing**: arrows MUST travel through designated Routing Channels. Arrows MUST NOT cross over or overlap with unrelated component boxes. When an arrow needs to cross layers, route it through the nearest channel (Right Export Lane x=1140, or EKS right margin x=1120).
10. **Monitoring Bus**: draw a purple vertical bar (width=6px, rounded ends) at x=1130, spanning y=50~990. All monitoring sources connect to the bus with short horizontal stubs (≤20px). Bus outputs exit right at designated y-offsets.
11. **Arrow label placement**: labels sit on the midpoint of the arrow segment, offset 3px above. For vertical arrows, labels are rotated 90° or placed to the right.
12. **Arrow z-index**: arrows render above layer backgrounds but below component boxes. This ensures arrows are visible in gaps but never obscure box content.
13. **Maximum 2 arrows per gap**: no more than 2 arrows should run in parallel through the same Inter-Layer Gap to prevent visual clutter.

## Change Highlights (optional)

Add small badges ("NEW", "CHANGED", "REMOVED", "HYBRID", "MOVED", "ALTERNATIVE", "OPTIONAL") to components changed from the original:
- ALB: "REMOVED (replaced by NLB auto-provisioned via kgateway Service)"
- NLB: "NEW (auto-provisioned, L4 only, Shield Advanced protected)"
- CloudFront: "CHANGED (added Shield Advanced, WAF enforcement point)"
- kgateway: "CHANGED (Kong→kgateway, WebSocket/SSE native, OIDC auth)"
- IAM Identity Center: "CHANGED (Cognito+Keycloak→IAM IdC, OIDC via kgateway)"
- FastAPI: "CHANGED (API Server+WebSocket unified)"
- llm-d: "NEW"
- AMP/AMG: "CHANGED (Self-hosted→Managed)"
- ArgoCD: "MOVED (Portal→Entry point area, EKS Add-on)"
- LangSmith + Langfuse: "HYBRID (LangSmith Dev + Langfuse Prod)"
- Unstructured.io: "NEW"
- NeMo Guardrails: Separated into Safety sub-group
- Triton Inference Server: "NEW (Non-LLM inference)"
- MCP/A2A: "NEW (Agent standard protocols)"
- Bifrost: "CHANGED (Rust→Go correction, OTel→Langfuse integration added, features detailed)"
- LiteLLM: "ALTERNATIVE (100+ providers, Langfuse native plugin)"
- 2-Tier Cost Tracking: "NEW (Application: Langfuse + Infrastructure: Bifrost)"
- Bifrost OTel→Langfuse: "NEW (Gateway-level traces)"
- Glue Catalog: "OPTIONAL (dashed border)"
- OpenSearch: "MOVED (Portal→AWS Storage & DB)"
- Qwen, DeepSeek: "NEW (External LLMs)"
- Neo4j/Neptune (Knowledge Graph): "NEW (Ontology, GraphRAG)"
- Bedrock AgentCore: "NEW (Managed MCP Gateway, A2A Hub, AG-UI, Lightweight Agents)"
- AG-UI: "NEW (Agent→Frontend streaming protocol)"
- DCGM Exporter: "NEW (GPU metrics → Prometheus)"
- Kubecost: "NEW (Pod-level GPU/CPU cost attribution)"
- Neptune: "NEW (AWS Storage & DB, Knowledge Graph option)"
- RAG Chain: "CHANGED (Vector RAG → Vector + Graph RAG hybrid)"
- LLM Feature Store: "CHANGED → Knowledge Feature Store (ontology layer added)"
- vLLM: "CHANGED (added --shutdown-timeout graceful drain)"
- llm-d: "CHANGED (added drain-aware routing)"
- GPU bar: "CHANGED (added Graceful Ops annotations + GPU monitoring)"
- Data Foundry: "CHANGED (added Knowledge Graph, renamed to RAG + Knowledge Graph Pipeline)"
- Removed components are not shown

Generate the draw.io XML based on these specifications.
```

---

## How to Use the Prompt

### Option 1: Request draw.io XML from Claude

Paste the prompt above into Claude to generate `.drawio` XML. Save the generated XML as `architecture-v7.drawio` and open it in draw.io.

### Option 2: Manual layout in draw.io

1. Open draw.io (app.diagrams.net)
2. Refer to the layout specifications in the prompt above for manual placement
3. Apply the color palette and style rules

### Option 3: draw.io MCP Server

If a draw.io MCP server is configured:
```
/architecture-diagram Generate diagram using the prompt above
```

---

## v7.0 → v7.1 Changelog

| Area | v7.0 | v7.1 | Reason |
|------|------|------|--------|
| Arrow routing | Free-form paths (35 arrows, crossing objects) | **Routing Channel based** (6 dedicated corridors) | Eliminate arrow-object overlap |
| Monitoring flow | 7 individual arrows | **Monitoring Bus** (1 vertical bar + stubs) | Drastically reduce visual complexity |
| Port convention | Undefined (arbitrary direction) | **Top/Bottom/Left/Right convention** unified | Consistent arrow entry/exit |
| Arrow count | ~35 | **~22** (merged + converted to annotations) | Improve readability of key flows |
| Arrow style | Single stroke width | **Differentiated strokeWidth** (primary 2px, secondary 1px) | Visual hierarchy |
| AgentCore Memory | Arrow (#30) | **Annotation text** (optional, arrow removed) | Reduce unnecessary crossings |
| Style rules | 8 rules | **13 rules** (routing, bus, z-index, gap limit added) | Concrete guide for draw.io generation |
| Spacing | Inter-layer 10px, intra-box 8px, box 80x40 | **Inter-layer 30px, intra-box 15px, box 100x50** | Easier to select and edit individual components |
| Canvas size | 2400x1200 | **2600x1500** | Accommodate relaxed spacing |

## v6 → v7 Changelog

| Area | v6 | v7 | Reason |
|------|----|----|--------|
| Feature Store | LLM Feature Store (Vector RAG focused) | **Knowledge Feature Store** (Vector RAG + GraphRAG + ontology) | Telecom domain rule-chain reasoning, reduce hallucination |
| Knowledge Graph | None | **Neo4j/Neptune** (OWL/RDF schema, SPARQL/Cypher) | Add entity-relationship reasoning |
| Bedrock AgentCore | None | **AgentCore complementary layer** (MCP Gateway, A2A Hub, AG-UI, Lightweight Agents, Managed Memory) | Reduce agent runtime ops burden, solve long-running sessions |
| Agent protocols | MCP, A2A | MCP, A2A, **AG-UI** | Standardize agent→frontend real-time streaming |
| Graceful Operations | None (implicit) | **Explicit strategy** (vLLM shutdown-timeout, llm-d drain-aware, PDB, Blue/Green NodePool) | Zero-downtime Karpenter consolidation / EKS upgrade |
| GPU monitoring | AMP/AMG only | **DCGM Exporter** (GPU metrics) + **Kubecost** (per-Pod cost) added | Enhance GPU utilization/cost visibility |
| Data Foundry | RAG Pipeline | **RAG + Knowledge Graph Pipeline** | Add ontology layer |
| RAG Chain | Vector RAG only | **Vector + Graph RAG hybrid** | Combine similarity search + relationship reasoning |
| LangGraph Tools | Basic Tool Registry | **ontology_query, vector_search, entity_resolve, rule_engine** specified | Concretize Knowledge Feature Store integration |
| Agent deployment | EKS only | **EKS (core) + AgentCore (lightweight)** hybrid | Core inference on EKS, operational simplification via AgentCore |
| AWS Storage | 7 services | **Neptune** added (Knowledge Graph option) | Managed Knowledge Graph option |
| Canvas size | 2200x1100 | **2600x1500** | Accommodate AgentCore zone + relaxed spacing |

## v5 → v6 Changelog

| Area | v5 | v6 | Reason |
|------|----|----|--------|
| Environment layout | Single EKS cluster (Prod/Dev mixed) | **Prod / Stag·Dev separated** (side-by-side 2-zone layout) | Differentiate security/cost/observability policies per environment |
| Observability placement | LangSmith + Langfuse in same Portal Layer | **Langfuse → Prod only, LangSmith → Stag/Dev only** | Clarify hybrid strategy via environment separation |
| LLM Feature Store | Ungrouped (components scattered) | **Cross-layer logical group** (Prompt Mgmt, Semantic Cache, RAG Chain, Milvus, Triton BGE-M3, Unstructured.io) | Visualize common Feature Surface for LLM apps |
| Stag/Dev Ingress | Same as Prod (CloudFront→WAF→NLB) | **NLB → kgateway** (CloudFront/WAF/Shield omitted) | Simplify dev environment, reduce cost |
| Stag/Dev GPU | Same as Prod | **Spot instances, reduced GPU** | Optimize dev environment cost |
| Shared services | Not specified | **MLflow · ECR · S3 · IAM IdC · ArgoCD** shared across environments | Clarify resource reuse |
| NeMo Guardrails | Required in all environments | **Required in Prod, optional in Stag/Dev** (dashed border) | Dev velocity vs safety tradeoff |
| Canvas size | 1400x1000 | **2200x1100** | Accommodate 2-zone layout |

## v4 → v5 Changelog

| Area | v4 | v5 | Reason |
|------|----|----|--------|
| Bifrost tech stack | Labeled "Rust-based" | **Go-based** corrected (~11µs/req at 5k RPS) | Correct actual implementation language |
| Bifrost features | LLM Router / fallback / cost tracking | **Hierarchical cost tracking (key/team/customer), semantic caching, MCP tool filtering** added | Feature detail |
| Bifrost → Langfuse | Not connected | **OTel Plugin → Langfuse** gateway trace integration | Complete observability pipeline |
| LiteLLM criteria | "Python ecosystem alternative" | **100+ long-tail providers, Langfuse native plugin** when needed | Clarify selection criteria |
| Monitoring flow | Bifrost built-in cost aggregation only | **Bifrost OTel → Langfuse** flow added (#21-1) | Gateway-level traces |

### v3 → v4 Changelog (prior)

| Area | v3 | v4 | Reason |
|------|----|----|--------|
| Portal Layer | 6 items (Portal UI, LangSmith, Langfuse, OpenSearch, JupyterHub, ArgoCD) | **4 items** (Portal UI, LangSmith, Langfuse, JupyterHub) | Lighten Portal |
| ArgoCD position | Inside Portal Layer | **Left entry point area** (outside EKS, GitOps deployment) | Relocate as external management tool |
| OpenSearch position | Inside Portal Layer | Moved to **AWS Storage & DB** area | Classify as AWS managed service |
| External LLMs | 8 (Bedrock~EXAONE) | **10** (Qwen, DeepSeek added) | Reflect Chinese open-source model ecosystem |

### v2 → v3 Changelog (prior)

| Area | v2 | v3 | Reason |
|------|----|----|--------|
| Orchestration structure | 3-tier (Gateway / Core+Agent / RAG+Safety+Router) | 4 sub-groups (Core Services / Agent Framework / RAG Pipeline / Safety) | Align with architecture report |
| API Server + WebSocket | 2 separate boxes | **FastAPI** unified box | Single API+WebSocket+SSE service |
| kgateway | Basic Gateway | WebSocket/SSE native support specified | Envoy HTTP/1.1 Upgrade |
| Observability | Langfuse only | **LangSmith (Dev) + Langfuse (Prod)** hybrid | Environment-specific role separation |
| Cost tracking | Single layer | **2-Tier (Application: Langfuse, Infrastructure: Bifrost)** | Per-layer cost aggregation |
| Triton | Not included | **Triton Inference Server added** | Non-LLM inference (Whisper, BGE-M3, Rerank) |
| MCP/A2A | Not mentioned | **MCP/A2A protocols specified** in Agent Framework | Standard protocol support |
| Glue Catalog | Required | **Optional (when governance needed)** | Flexible architecture |
| Version | v2.0 | **v3.0** | 52→26 components + hybrid Observability + 2-Tier cost tracking |
