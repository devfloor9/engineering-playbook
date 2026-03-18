---
title: "개선된 아키텍처 Draw.io 작성 프롬프트"
sidebar_label: "Draw.io 작성 프롬프트"
last_update:
  date: 2026-03-18
---

# LG U+ Agentic AI Platform - 개선 아키텍처 Draw.io 프롬프트

## Architecture Overview

### Design Goals

This architecture serves as a **reference architecture** for building a telecom-scale Agentic AI Platform on Amazon EKS. The core design principles are:

- **Kubernetes Native**: All AI workloads are declaratively managed on EKS with GPU node auto-scaling via Karpenter.
- **Streamlined Ingress**: CloudFront → WAF → NLB (auto-provisioned by kgateway Service) → kgateway. ALB is eliminated to reduce latency hops. AWS Shield Advanced protects the NLB endpoint.
- **2-Tier Gateway**: Separates kgateway (authentication, routing, traffic control) from Bifrost (LLM provider aggregation, fallback, cost tracking) to isolate concerns. Bifrost is a Go-based high-performance gateway (~11µs overhead at 5k RPS).
- **Hybrid Observability**: Dev/staging uses LangSmith (LangGraph Studio native integration), while production uses Langfuse (self-hosted, data sovereignty). Bifrost integrates with Langfuse via OpenTelemetry for gateway-level traces.
- **On-Premise ↔ Cloud Integration**: Bridges on-premise GPU resources (Colab-Co for training, Sangam for inference) with cloud-based ML pipelines.
- **Standard Protocols**: Adopts MCP (tool connectivity) and A2A (agent-to-agent communication) standards for agent extensibility.

### Layer Roles

| Layer | Role | Key Components |
|-------|------|----------------|
| **Portal Layer** | User interface, observability dashboards, notebook environment | Portal UI, LangSmith, Langfuse, JupyterHub |
| **Orchestration Layer** | Agent workflow execution, API serving, RAG chain, safety filtering, LLM routing | kgateway, FastAPI, LangChain, LangGraph, RAG Chain, NeMo Guardrails, Bifrost |
| **Model Serving Layer** | LLM text generation (vLLM) and non-LLM inference (Triton), KV Cache-aware intelligent distribution | llm-d, vLLM (Large/Medium/Small/LoRA), Triton (Embedding/Reranking/STT) |
| **Model Pipeline Layer** | Model registry, experiment tracking, offline evaluation, training pipeline orchestration | MLflow, ECR, DeepEval, Kubeflow Pipelines |
| **Data Foundry Layer** | Document parsing for RAG, vector indexing, data labeling, feedback loop | Unstructured.io, Milvus, Label Studio, Langfuse |

### External Integrations

| Area | Role |
|------|------|
| **External LLMs** | 10+ model providers including Bedrock, SageMaker, OpenAI, Claude, Gemini, Qwen, DeepSeek |
| **AWS Storage & DB** | S3, DynamoDB, OpenSearch, ElastiCache, RDS, EFS, FSx Lustre |
| **Monitoring & Security** | AMP/AMG (infra metrics), CloudWatch, X-Ray (ADOT), Secrets Manager, KMS, GuardDuty |
| **On-Premise** | Colab-Co (H100/H200 training), Sangam (H200/H100/L40s inference) |
| **GitOps** | ArgoCD — declarative deployment management from outside the EKS cluster |

---

아래 프롬프트를 draw.io AI 또는 Claude에게 제공하여 아키텍처 다이어그램을 생성하세요.

---

## 프롬프트

```
Generate a draw.io XML for the LG U+ Agentic AI Platform architecture on EKS with the following specifications.

## Overall Layout

- Title: "LG U+ Agentic AI Platform - Improved EKS Architecture (v5)"
- Canvas size: 1400px wide, 1000px tall
- Background: white
- Font: Noto Sans KR (or system default sans-serif)
- Traffic flows left-to-right, layers stack top-to-bottom

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
5. **IAM Identity Center** (security red, label: "IAM IdC / SSO")

Arrow from NLB enters the EKS cluster → kgateway.
Dashed arrow from ArgoCD (bottom-left) to EKS cluster (GitOps deployment).

> ALB is removed. NLB is auto-provisioned by kgateway's Kubernetes Service (type: LoadBalancer). This eliminates one L7 hop, reducing latency. WAF is enforced at CloudFront level. Shield Advanced protects CloudFront + NLB endpoints. IAM Identity Center authentication is handled by kgateway (OIDC integration).

---

## Center: Amazon EKS Cluster (x=210~1050, y=30~900)

Large blue dashed container box:
- Title: "Amazon EKS Cluster (Karpenter Auto-scaling)"
- Border: #326CE5, dashed, background: #F0F4FF (very light blue)

### 5 Internal Layers (top to bottom)

---

#### Layer 1: Portal Layer (y=50~170, light purple bg #F3E5F5)

Container title: "① Portal Layer"

Internal boxes (horizontal layout):
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Portal UI (Next.js) | #326CE5 | |
| 2 | LangSmith (Dev/Staging Observability) | #FFD93D | Show "Dev/Staging" label |
| 3 | Langfuse (Prod Observability + Prompt Mgmt) | #9C27B0 | Show "Production" label |
| 4 | JupyterHub (Notebook) | #FFD93D | |

> Place LangSmith and Langfuse side by side to visually represent the hybrid observability strategy.
> Small text below LangSmith: "LangGraph Studio native integration"
> Small text below Langfuse: "Self-hosted, data sovereignty, MIT license"
> OpenSearch moved to AWS Storage & DB area on the right. ArgoCD moved to entry point area on the left.

---

#### Layer 2: Orchestration Layer (y=180~380, light blue bg #E3F2FD)

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
| 2 | LangGraph (Workflow + ReAct + Tool Registry) | #FFD93D | MCP/A2A protocol support |

> Agent Ready apps connect to LangGraph via MCP/A2A standard protocols.

**RAG Pipeline (upper right):**
| # | Label | Background |
|---|-------|-----------|
| 1 | RAG Chain | #00BCD4 |

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

#### Layer 3: Model Serving Layer (y=390~530, light green bg #E8F5E9)

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

---

#### Layer 4: Model Pipeline Layer (y=540~660, light yellow bg #FFF9C4)

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

#### Layer 5: Data Foundry Layer (y=670~790, light red bg #FFEBEE)

Container title: "⑤ Data Foundry Layer (RAG Pipeline)"

Internal boxes (horizontal layout):
| # | Label | Background | Note |
|---|-------|-----------|------|
| 1 | Unstructured.io (Document Parsing / Chunking) | #00BCD4 | |
| 2 | Milvus (Vector DB) | #326CE5 | |
| 3 | Glue Catalog (Metadata) (Optional — for governance) | #FF9900 | Dashed border |
| 4 | Label Studio (Data Labeling) | #FF6B6B | |
| 5 | Langfuse (Feedback Loop) | #9C27B0 | |

> Glue Catalog is optional, used only when data governance is required.

---

## Upper Right: External LLMs (x=1060~1380, y=30~200)

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

## Middle Right: AWS Storage & DB (x=1060~1380, y=210~400)

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

---

## Lower Right 1: Monitoring & Security (x=1060~1380, y=410~550)

Container box, title: "Monitoring & Security", bg #F3E5F5

Internal boxes:
| # | Label | Background |
|---|-------|-----------|
| 1 | AMP (Managed Prometheus) | #9C27B0 |
| 2 | AMG (Managed Grafana) | #9C27B0 |
| 3 | CloudWatch | #FF9900 |
| 4 | X-Ray (ADOT) | #FF9900 |
| 5 | Secrets Manager | #FF6B6B |
| 6 | KMS | #FF6B6B |
| 7 | GuardDuty | #FF6B6B |

---

## Lower Right 2: On-Premise (x=1060~1380, y=560~780)

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

### Ingress Flow (solid, black)
1. Users → Route 53
2. Route 53 → CloudFront (+ Shield Advanced) → WAF → NLB (auto-provisioned)
3. NLB → kgateway (enters EKS cluster, OIDC auth via IAM Identity Center)

### EKS Internal Flow (solid, #326CE5 blue)
4. kgateway → FastAPI (REST + WebSocket + SSE) (/api/*, /ws/*)
5. kgateway → Bifrost (/v1/* AI traffic)
6. FastAPI → LangChain / LangGraph (agent requests)
7. LangChain → Bifrost (LLM calls)
8. LangChain → RAG Chain → Triton (Embedding) → Milvus (RAG retrieval)
9. LangChain → NeMo Guardrails (Input/Output filtering, bidirectional arrow)
10. Bifrost → llm-d Inference Gateway (self-hosted models)
11. llm-d → vLLM Large / Medium / Small / LoRA (KV Cache-aware distribution)
12. Bifrost → External LLMs (external models, arrow to the right)

### Data Flow (dashed, #00BCD4 teal)
13. On-Premise (Colab-Co) --dashed--> S3 (model artifacts)
14. S3 → MLflow (model registration)
15. MLflow → DeepEval → ArgoCD → vLLM (deployment pipeline)
16. Unstructured.io → Triton (BGE-M3 Embedding) → Milvus (RAG indexing)
17. RAG Chain → Triton (Embedding) → Milvus (embedding at query time)

### Monitoring Flow (dashed, #9C27B0 purple)
18. vLLM/llm-d --dashed--> ADOT --dashed--> AMP → AMG
19. FastAPI --dashed--> LangSmith (Dev/Staging traces, label: "Application Level")
20. FastAPI --dashed--> Langfuse (Production traces, label: "Application Level")
21. Bifrost --dashed--> Bifrost built-in cost aggregation (label: "Infrastructure Level")
21-1. Bifrost (OTel Plugin) --dashed--> Langfuse (label: "OTel→Langfuse gateway traces")
22. Langfuse --dashed--> Label Studio (feedback loop)

### GitOps Deployment (dashed, #FF6B6B red)
23. ArgoCD --dashed--> EKS Cluster (GitOps deployment for vLLM/Agent services)

### On-Premise Connections (dashed, #E91E63 pink)
24. On-Premise (Sangam) --dashed--> Bifrost (register self-hosted inference servers)
25. On-Premise (Colab-Co) --dashed--> S3 (upload training results)

---

## Annotations & Legend

Bottom-left legend box:
- Solid arrow: Request/Response flow
- Blue dashed: Data flow
- Purple dashed: Monitoring/Metrics
- Red dashed: GitOps deployment (ArgoCD)
- Pink dashed: On-Premise connections

Bottom-right version info:
- "v5.1 | 2026-03-18 | ALB removed, NLB auto-provisioned by kgateway + Shield Advanced + Streamlined ingress"

---

## Style Rules

1. All boxes use rounded rectangles (rounded=1, arcSize=10)
2. Container box titles are top-left aligned, bold
3. Internal component boxes default to 80px wide, 40px tall
4. Component box text: first line service name (bold), second line tech name (regular)
5. Arrows use orthogonal routing (right-angle bends)
6. Inter-layer spacing: 10px
7. Intra-layer box spacing: 8px
8. All text is center-aligned

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
- Removed components are not shown

Generate the draw.io XML based on these specifications.
```

---

## 프롬프트 사용법

### 방법 1: Claude에게 draw.io XML 생성 요청

위 프롬프트를 Claude에게 붙여넣으면 `.drawio` XML을 생성합니다. 생성된 XML을 `architecture-v5.drawio` 파일로 저장 후 draw.io에서 열면 됩니다.

### 방법 2: draw.io에서 직접 작업

1. draw.io (app.diagrams.net) 열기
2. 위 프롬프트의 레이아웃 사양을 참고하여 수동 배치
3. 색상 팔레트와 스타일 규칙을 적용

### 방법 3: draw.io MCP 서버 활용

draw.io MCP 서버가 설정되어 있다면:
```
/architecture-diagram 위 프롬프트 내용으로 다이어그램 생성
```

---

## v4 → v5 변경 요약

| 영역 | v4 | v5 | 변경 이유 |
|------|----|----|-----------|
| Bifrost 기술 스택 | "Rust 기반" 표기 | **Go 기반** 수정 (~11µs/req at 5k RPS) | 실제 구현 언어 정정 |
| Bifrost 기능 설명 | LLM Router / 폴백 / 비용 추적 | **계층형 비용 추적(키/팀/고객), 시맨틱 캐싱, MCP 도구 필터링** 추가 | 기능 상세화 |
| Bifrost → Langfuse | 미연결 | **OTel Plugin → Langfuse** 게이트웨이 트레이스 연동 | 옵저버빌리티 파이프라인 완성 |
| LiteLLM 대안 기준 | "Python 생태계 대안" | **100+ 롱테일 프로바이더, Langfuse 네이티브 플러그인** 필요 시 | 선택 기준 명확화 |
| 모니터링 흐름 | Bifrost 자체 비용 집계만 | **Bifrost OTel → Langfuse** 흐름 추가 (21-1번) | 게이트웨이 레벨 트레이스 |

### v3 → v4 변경 요약 (이전)

| 영역 | v3 | v4 | 변경 이유 |
|------|----|----|-----------|
| Portal Layer | 6개 (Portal UI, LangSmith, Langfuse, OpenSearch, JupyterHub, ArgoCD) | **4개** (Portal UI, LangSmith, Langfuse, JupyterHub) | Portal 경량화 |
| ArgoCD 위치 | Portal Layer 내부 | **좌측 진입점 영역** (EKS 외부, GitOps 배포) | 클러스터 외부 관리 도구로 재배치 |
| OpenSearch 위치 | Portal Layer 내부 | **AWS Storage & DB** 영역으로 이동 | AWS 관리형 서비스로 분류 |
| External LLMs | 8개 (Bedrock~EXAONE) | **10개** (Qwen, DeepSeek 추가) | 중국 오픈소스 모델 생태계 반영 |

### v2 → v3 변경 요약 (이전)

| 영역 | v2 | v3 | 변경 이유 |
|------|----|----|-----------|
| Orchestration 구조 | 3단 (Gateway / Core+Agent / RAG+Safety+Router) | 4 서브그룹 (Core Services / Agent Framework / RAG Pipeline / Safety) | 아키텍처 리포트 정합 |
| API Server + WebSocket | 별도 박스 2개 | **FastAPI** 통합 박스 1개 | API+WebSocket+SSE 단일 서비스 |
| kgateway | 기본 Gateway | WebSocket/SSE 네이티브 지원 명시 | Envoy HTTP/1.1 Upgrade |
| Observability | Langfuse 단독 | **LangSmith (Dev) + Langfuse (Prod)** 하이브리드 | 환경별 역할 분담 |
| 비용 추적 | 단일 레이어 | **2-Tier (애플리케이션: Langfuse, 인프라: Bifrost)** | 계층별 비용 집계 |
| Triton | 미포함 | **Triton Inference Server 추가** | 비-LLM 추론 (Whisper, BGE-M3, Rerank) |
| MCP/A2A | 미언급 | **Agent Framework에 MCP/A2A 프로토콜 명시** | 표준 프로토콜 지원 |
| Glue Catalog | 필수 | **선택사항 (거버넌스 요구 시)** | 유연한 아키텍처 |
| 버전 | v2.0 | **v3.0** | 52→26 컴포넌트 + 하이브리드 Observability + 2-Tier 비용 추적 |
