---
title: "Architecture Draw.io Prompt (Compact)"
sidebar_label: "Draw.io Prompt (Compact)"
last_update:
  date: 2026-03-26
---

# LG U+ Agentic AI Platform - Compact Draw.io Prompt

This is the compact version of the draw.io generation prompt. For design rationale, selection criteria, and changelog, see [architecture-drawio-prompt.md](./architecture-drawio-prompt.md).

## Prompt

```
Generate a draw.io XML for the LG U+ Agentic AI Platform architecture on EKS with the following specifications.

## Overall Layout

- Title: "LG U+ Agentic AI Platform - EKS Architecture (v7.4)"
- Canvas: 2600x1500px, white background, font: Noto Sans KR
- Left zone (x=0~1600): Production. Right zone (x=1630~2600): Staging/Dev + AgentCore
- Vertical dashed divider at x=1615, label: "Environment Boundary"

## Color Palette

| Purpose | Bg | Text | Border |
|---------|----|------|--------|
| AWS | #FF9900 | #FFF | #CC7A00 |
| K8s/EKS | #326CE5 | #FFF | #2855B8 |
| GPU/NVIDIA | #76B900 | #FFF | #5E9400 |
| ML/AI | #FFD93D | #333 | #CCB030 |
| Security | #FF6B6B | #FFF | #CC5555 |
| Monitoring | #9C27B0 | #FFF | #7B1FA2 |
| Data | #00BCD4 | #FFF | #0097A7 |
| External | #E0E0E0 | #333 | #BDBDBD |
| On-Prem | #F8BBD0 dashed | #333 | #E91E63 |
| User | #34A853 | #FFF | #2D8F47 |
| Feature Store | #E0F7FA dashed | #006064 | #00ACC1 |
| Knowledge Graph | #1565C0 | #FFF | #0D47A1 |
| AgentCore | #FF9900 dashed | #FFF | #CC7A00 |
| Stag/Dev | #F1F8E9 | #333 | #689F38 |

## Style Rules

- Rounded rectangles (arcSize=10), 100x50px default, 15px spacing
- Inter-layer gap: 30px (arrow routing only)
- Orthogonal arrow routing, no diagonals except Auth
- NodePool badges: top-right pill [GPU] #76B900, [HighMem] #00BCD4, [CPU] #326CE5 (40x16px, white text, 8px)
- "OR" option boxes: side-by-side 40% width each, dashed vertical divider
- Monitoring Bus: purple vertical bar (6px) at x=1130, y=50~990

## Left Side (x=0~120)

Users (person icon, "Modelers / Service Teams / Admins")

Agent Ready (container, border #326CE5, bg #E8F0FE):
- ixi-Enterprise (#326CE5), Sales Agent (#FFD93D), Legal Agent (#FFD93D)
- Billing Agent (#FFD93D), AICC Agent (#FFD93D), Agent Builder (#FFD93D)

ArgoCD (EKS Add-on) (#FF6B6B) — below Agent Ready

## Entry Points (x=130~200)

Vertical stack: Route 53 (#FF9900) → CloudFront + Shield (#FF9900) → WAF (#FF6B6B) → NLB (#FF9900, "auto-provisioned")
NLB → kgateway (enters EKS). ArgoCD → EKS (dashed, "GitOps deploy")
IAM Identity Center (x=60) ←→ kgateway (dashed, "OIDC / JWKS")

## EKS Cluster (x=210~1150, y=30~1050)

Blue dashed container, bg #F0F4FF
Title: "Amazon EKS Cluster (Karpenter Auto-scaling · 3 NodePools)"
Subtitle: "NodePool: GPU (p5/g6) · HighMem (r7i) · CPU (m7i) — Same AZ co-location"

### Layer 1: Portal (y=50~190, bg #F3E5F5) [CPU]

| Label | Bg |
|-------|----|
| Portal UI (Next.js) | #326CE5 |
| Langfuse (Prod Observability + Prompt Mgmt) | #9C27B0 |
| JupyterHub (Notebook) | #FFD93D |

### Layer 2: Orchestration (y=220~450, bg #E3F2FD) [CPU]

Title: "② Orchestration Layer (FastAPI + LangGraph)"

**Gateway (top, full width):**
kgateway (Gateway API / Auth / Rate Limit / TLS / WebSocket·SSE) #326CE5
Text: "/api/* → FastAPI, /ws/* → WebSocket, /v1/* → Bifrost"

**Tier 1 Direct LLM (left):**
FastAPI (API + WebSocket + SSE) #34A853 [CPU]
Text: "Tier 1: 단순 LLM → Bifrost 직접"

**Tier 2 Stateful (center):**
LangGraph (Stateful Workflow + ReAct + Tool Registry) #FFD93D [CPU]
Redis (Session + Checkpointer) #FF6B6B [HighMem]
Text: "Tier 2: AICC, 멀티스텝 에이전트"

**RAG (upper right, inside Feature Store overlay):**
RAG Chain #00BCD4

**Safety (lower right):**
NeMo Guardrails (Input/Output Filter) #FF6B6B

**LLM Router (bottom, full width):**
Bifrost (LLM Router / Fallback / Cost / OTel / LoRA Alias) #FF9900
Text: "(or LiteLLM)"

### Layer 3: Model Serving (y=480~680, bg #E8F5E9) [GPU]

Title: "③ Model Serving Layer (vLLM + Triton)"

**Inference Gateway (choose one — side-by-side with "OR" divider):**
| Option | Label | Bg |
|--------|-------|----|
| A | llm-d (KV Cache + LoRA-aware · EPP) | #76B900 |
| B | NVIDIA Dynamo (Router + Flash Indexer + Planner · EPP) | #76B900 |
Text: "공통: NIXL · EPP · OpenAI-compatible API"

**Serving Engines:**
| Label | Bg | Size |
|-------|----|------|
| vLLM Large (Qwen3-72B, TP=4, H100x4) | #FFD93D | Wide |
| vLLM Medium (Qwen3-32B, TP=2, H100x2) | #FFD93D | Medium |
| vLLM Small (EXAONE-32B, TP=2) | #FFD93D | Medium |
| vLLM Multi-LoRA (Base 7B/14B, MIG, --max-loras=8) | #FFD93D | Medium |
| Triton (Whisper STT / BGE-M3 / Reranker) | #9C27B0 | Medium |

**Bottom bar** (#76B900):
"GPU: H100/L40s · Karpenter · vLLM --shutdown-timeout=240 · LoRA hot-swap · DCGM→AMP→AMG · Kubecost"

### Layer 4: Model Pipeline (y=700~830, bg #FFF9C4) [CPU]

| Label | Bg |
|-------|----|
| MLflow (Registry / Experiment) | #326CE5 |
| LoRA Adapter Registry (MLflow + S3) | #326CE5 |
| ECR | #FF9900 |
| DeepEval (Evaluation) | #9C27B0 |
| Kubeflow Pipelines | #FFD93D |

### Layer 5: Data Foundry (y=860~1010, bg #FFEBEE) [HighMem]

| Label | Bg | NodePool |
|-------|----|----------|
| Unstructured.io (Parsing/Chunking) | #00BCD4 | CPU |
| Milvus (Vector DB) | #326CE5 | HighMem |
| Neo4j/Neptune (Knowledge Graph) | #1565C0 | HighMem |
| Glue Catalog (Optional, dashed) | #FF9900 | CPU |
| Label Studio | #FF6B6B | CPU |
| Fine-tune Dataset (Feedback→JSONL) | #9C27B0 | CPU |
| Langfuse (Feedback Loop) | #9C27B0 | CPU |

### Knowledge Feature Store Overlay

Dashed container (bg #E0F7FA 15%, border #00ACC1) spanning layers ②③⑤, grouping:
Langfuse Prompt Mgmt, Redis (Semantic Cache), RAG Chain, Triton BGE-M3, Neo4j/Neptune, Milvus, Unstructured.io
Title: "Knowledge Feature Store"

## Right Zone: Stag/Dev (x=1630~2350)

Dashed container (bg #F1F8E9, border #689F38)
Title: "Staging / Dev EKS Cluster (Karpenter — spot)"

Entry: NLB → kgateway (simplified)
Portal: Portal UI (#326CE5), LangSmith (#FFD93D), JupyterHub (#FFD93D)
Orchestration: kgateway, FastAPI, LangGraph (Tier 2), Bifrost (basic)
Serving: vLLM Small (spot GPU), Triton
Data: Milvus (dev), Unstructured.io
Annotation: "Shared: MLflow · ECR · S3 · IAM IdC · ArgoCD"

## Right Zone: AgentCore (x=1630~2600, y=800~1250)

Dashed container (bg #FFF3E0, border #FF9900)
Title: "Bedrock AgentCore (Managed Agent Runtime)"

| Label | Bg |
|-------|----|
| MCP Gateway (Stateful, Auth) | #FF9900 |
| A2A Hub (Discovery/Delegation) | #FF9900 |
| AG-UI Proxy (SSE/WebSocket) | #FF9900 |
| Lightweight Agents (FAQ/Routing) | #FFD93D |
| Managed Memory | #FF9900 |
| Bedrock Guardrails | #FF6B6B |

## External Areas

**External LLMs (x=1170~1510, y=30~220, bg #F5F5F5):**
Bedrock, SageMaker, OpenAI, Claude, Gemini, Llama 3, Mistral, EXAONE, Qwen, DeepSeek

**AWS Storage & DB (x=1170~1510, y=250~460, bg #FFF3E0):**
S3, DynamoDB, OpenSearch, ElastiCache, RDS, EFS, FSx Lustre, Neptune

**Monitoring & Security (x=1170~1510, y=490~660, bg #F3E5F5):**
AMP, AMG, DCGM Exporter (#76B900), Kubecost (#00BCD4), CloudWatch, X-Ray, Secrets Manager, KMS, GuardDuty

**On-Premise (x=1170~1510, y=690~940, bg #F8BBD0 dashed):**
Colab-Co Training: H100x16, H200x26, Megatron-LM/NeMo/PEFT
Sangam Inference: H200x2, H100x6, L40sx6

## EKS Topology Inset (x=1630~2600, y=1260~1480)

Box (bg #F0F4FF, border #326CE5), title: "EKS Cluster Topology — NodePool × AZ"
Two columns: AZ-a (Primary) | AZ-b (HA Standby)

| NodePool | Instances | Workloads | Taint |
|----------|-----------|-----------|-------|
| GPU | p5/g6 | vLLM, Triton, llm-d/Dynamo | nvidia.com/gpu:NoSchedule |
| HighMem | r7i | Milvus, Neo4j, Redis | workload-type=highmem:NoSchedule |
| CPU | m7i | FastAPI, LangGraph, Bifrost, Portal | (default) |

Text: "Same AZ ~200us · Cross-AZ ~1-2ms · Hybrid Nodes (On-Prem SSM, EKS 1.31+)"

## Arrows

### Ingress (solid black, 2px)
Users → Route 53 → CloudFront → WAF → NLB → kgateway

### Auth (dashed #FF6B6B, 1px)
IAM Identity Center ↔ kgateway ("OIDC/JWKS")

### EKS Request (solid #326CE5, 2px)
kgateway → FastAPI ("/api/*"), kgateway → Bifrost ("/v1/*")
FastAPI → Bifrost ("Tier 1: direct LLM", dashed green)
FastAPI → LangGraph ("Tier 2: stateful")
LangGraph ↔ NeMo Guardrails
LangGraph → RAG Chain, LangGraph → Bifrost ("LLM calls")
Bifrost → llm-d/Dynamo
RAG Chain → Triton BGE-M3
llm-d/Dynamo → vLLM (fan-out)
RAG Chain → Milvus ("Vector RAG"), RAG Chain → Neo4j ("GraphRAG")
Bifrost → External LLMs

### Data Pipeline (dashed #00BCD4, 1.5px)
On-Prem → S3 → MLflow → DeepEval → ArgoCD → vLLM
Unstructured.io → Triton BGE-M3 → Milvus

### Monitoring Bus (dashed #9C27B0, 1px)
vLLM, llm-d, DCGM, FastAPI, Bifrost → Bus (x=1130) → AMP/AMG, Kubecost, CloudWatch
FastAPI → Langfuse (Prod), Bifrost OTel → Langfuse, Langfuse → Label Studio

### AgentCore (dashed #FF9900, 1.5px)
LangGraph → A2A Hub, AG-UI → Portal UI, Lightweight Agents → Bifrost, MCP Gateway → External Tools

### LoRA Lifecycle (dashed #FFD93D, 1.5px)
Langfuse Feedback → Fine-tune Dataset → On-Prem → S3 → LoRA Registry → vLLM Multi-LoRA ("dynamic load")

### GitOps & On-Prem (dashed, 1px)
ArgoCD → EKS (#FF6B6B), Sangam → Bifrost (#E91E63), Colab-Co → S3 (#E91E63)

## Legend (bottom-left)

| Style | Meaning |
|-------|---------|
| Solid black 2px | Ingress |
| Solid blue 2px | EKS request path |
| Teal dashed 1.5px | Data pipeline |
| Purple dashed 1px | Monitoring (Bus) |
| Red dashed 1px | Auth & GitOps |
| Yellow dashed 1.5px | LoRA lifecycle |
| Orange dashed 1.5px | AgentCore |
| Pink dashed 1px | On-Premise |
| Purple bar | Monitoring Bus |

Version: v7.4 | 2026-03-26

Generate the complete draw.io XML.
```
