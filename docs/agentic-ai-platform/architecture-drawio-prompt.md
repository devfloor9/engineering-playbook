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
- **2-Tier Gateway**: Separates kgateway (authentication, routing, traffic control) from LiteLLM (LLM provider aggregation, fallback, cost tracking) to isolate concerns.
- **Hybrid Observability**: Dev/staging uses LangSmith (LangGraph Studio native integration), while production uses Langfuse (self-hosted, data sovereignty).
- **On-Premise ↔ Cloud Integration**: Bridges on-premise GPU resources (Colab-Co for training, Sangam for inference) with cloud-based ML pipelines.
- **Standard Protocols**: Adopts MCP (tool connectivity) and A2A (agent-to-agent communication) standards for agent extensibility.

### Layer Roles

| Layer | Role | Key Components |
|-------|------|----------------|
| **Portal Layer** | User interface, observability dashboards, notebook environment | Portal UI, LangSmith, Langfuse, JupyterHub |
| **Orchestration Layer** | Agent workflow execution, API serving, RAG chain, safety filtering, LLM routing | kgateway, FastAPI, LangChain, LangGraph, RAG Chain, NeMo Guardrails, LiteLLM |
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
다음 사양에 맞춰 LG U+ Agentic AI Platform의 EKS 기반 아키텍처를 draw.io XML로 작성해줘.

## 전체 레이아웃

- 제목: "LG U+ Agentic AI Platform - EKS 기반 개선 아키텍처 (v4)"
- 캔버스 크기: 가로 1400px, 세로 1000px
- 배경: 흰색
- 폰트: 맑은 고딕 (또는 Noto Sans KR)
- 전체적으로 왼쪽에서 오른쪽으로 트래픽 흐름, 상단에서 하단으로 레이어 계층

---

## 색상 팔레트

| 용도 | 배경색 | 글자색 | 테두리 |
|------|--------|--------|--------|
| AWS 서비스 | #FF9900 | #FFFFFF | #CC7A00 |
| Kubernetes/EKS | #326CE5 | #FFFFFF | #2855B8 |
| GPU/NVIDIA | #76B900 | #FFFFFF | #5E9400 |
| ML/AI 프레임워크 | #FFD93D | #333333 | #CCB030 |
| 보안/인증 | #FF6B6B | #FFFFFF | #CC5555 |
| 모니터링/관찰성 | #9C27B0 | #FFFFFF | #7B1FA2 |
| 데이터/스토리지 | #00BCD4 | #FFFFFF | #0097A7 |
| 외부 서비스 | #E0E0E0 | #333333 | #BDBDBD |
| On-Premise | #F8BBD0 (점선 테두리) | #333333 | #E91E63 |
| 사용자/클라이언트 | #34A853 | #FFFFFF | #2D8F47 |

---

## 좌측: 사용자 및 Agent Ready (캔버스 왼쪽 바깥, x=0~120)

### 사용자 그룹 (상단)
- 아이콘: 사람 모양
- 라벨: "사용자"
- 하위 라벨: "모델러 / 서비스팀 / 관리자"

### Agent Ready 박스 (중단)
- 컨테이너 박스, 테두리: #326CE5, 배경: #E8F0FE
- 제목: "Agent Ready"
- 내부 박스 (각각 작은 둥근 사각형, 2열 배치):
  - "ixi-Enterprise" (배경 #326CE5, 흰 글자)
  - "영업 Agent" (배경 #FFD93D, 검정 글자)
  - "법무 Agent" (배경 #FFD93D, 검정 글자)
  - "빌링 Agent" (배경 #FFD93D, 검정 글자)
  - "AICC Agent" (배경 #FFD93D, 검정 글자)
  - "Agent Builder" (배경 #FFD93D, 검정 글자)

### ArgoCD (하단, Agent Ready 아래)
- 배경: #FF6B6B, 흰 글자
- 라벨: "ArgoCD (EKS Add-on)"
- 비고: GitOps 배포 — EKS 클러스터 외부에서 관리

---

## 진입점 (x=130~200, 세로 중앙)

위에서 아래로 세로 배치, 화살표로 연결:
1. **Route 53** (AWS 주황, 작은 박스)
2. **CloudFront** (AWS 주황)
3. **WAF** (보안 빨강)
4. **ALB** (AWS 주황)
5. **IAM Identity Center** (보안 빨강, 라벨: "IAM IdC / SSO")

ALB에서 EKS 클러스터 내부로 화살표 진입.
ArgoCD (좌측 하단)에서 EKS 클러스터로 점선 화살표 (GitOps 배포).

---

## 중앙: Amazon EKS Cluster (x=210~1050, y=30~900)

큰 파란색 점선 컨테이너 박스:
- 제목: "Amazon EKS Cluster (Karpenter Auto-scaling)"
- 테두리: #326CE5, 점선, 배경: #F0F4FF (매우 연한 파랑)

### 내부 5개 레이어 (위에서 아래로)

---

#### Layer 1: Portal Layer (y=50~170, 연보라 배경 #F3E5F5)

컨테이너 제목: "① Portal Layer"

내부 박스 (가로 배치):
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | Portal UI (Next.js) | #326CE5 | |
| 2 | LangSmith (Dev/Staging Observability) | #FFD93D | "Dev/Staging" 라벨 표시 |
| 3 | Langfuse (Prod Observability + Prompt Mgmt) | #9C27B0 | "Production" 라벨 표시 |
| 4 | JupyterHub (Notebook) | #FFD93D | |

> LangSmith와 Langfuse를 나란히 배치하여 하이브리드 Observability 전략을 시각적으로 표현.
> LangSmith 박스 하단에 작은 텍스트: "LangGraph Studio 네이티브 통합"
> Langfuse 박스 하단에 작은 텍스트: "Self-host, 데이터 주권, MIT"
> OpenSearch는 우측 AWS Storage & DB 영역으로 이동, ArgoCD는 좌측 진입점 영역으로 이동.

---

#### Layer 2: Orchestration Layer (y=180~380, 연파랑 배경 #E3F2FD)

컨테이너 제목: "② Orchestration Layer (LangChain + LangGraph)"

내부를 **4 서브그룹 구조**로 배치:

**Gateway Tier (최상단, 전체 폭):**
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | kgateway (Gateway API / 인증 / Rate Limit / TLS / WebSocket·SSE 네이티브) | #326CE5 | Envoy HTTP/1.1 Upgrade 지원 명시 |

kgateway 하단에 작은 텍스트: "Path 분기: /api/* → FastAPI, /ws/* → WebSocket, /v1/* → LiteLLM (AI)"

**Core Services (좌측):**
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | FastAPI (API + WebSocket + SSE) | #34A853 | 통합 박스 1개 (API Server + WebSocket 병합) |
| 2 | Redis (Session + Cache) | #FF6B6B | LangGraph checkpointer |

**Agent Framework (중앙):**
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | LangChain (Agent Runtime) | #FFD93D | |
| 2 | LangGraph (Workflow + ReAct + Tool Registry) | #FFD93D | MCP/A2A 프로토콜 지원 |

> Agent Ready 앱은 MCP/A2A 표준 프로토콜로 LangGraph와 연결됩니다.

**RAG Pipeline (우측 상단):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | RAG Chain | #00BCD4 |

**Safety (우측 하단):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | NeMo Guardrails (Input/Output 필터) | #FF6B6B |

**LLM Router (하단, 전체 폭):**
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | LiteLLM (LLM Router / 폴백 / 비용 추적) (또는 Bifrost — Rust 기반 고성능 대안) | #FF9900 | 인프라 레벨 비용 집계 |

> LiteLLM은 100+ LLM 프로바이더 통합 및 비용 추적을 제공합니다. 고성능이 필요한 경우 Rust 기반 Bifrost를 대안으로 고려할 수 있습니다.

---

#### Layer 3: Model Serving Layer (y=390~530, 연초록 배경 #E8F5E9)

컨테이너 제목: "③ Model Serving Layer (vLLM + Triton)"

내부를 2단 구조로 배치:

**1단 (Inference Gateway):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | llm-d Inference Gateway (KV Cache-aware Routing) | #76B900 |

llm-d 박스는 전체 폭의 80% 차지, 중앙 배치.

**2단 (Serving Engines):**
| 박스 | 라벨 | 배경색 | 크기 | 비고 |
|------|------|--------|------|------|
| 1 | vLLM - Large (Qwen3-72B, TP=4, H100x4) | #FFD93D | 넓게 | LLM 텍스트 생성 |
| 2 | vLLM - Medium (Qwen3-32B, TP=2, H100x2) | #FFD93D | 중간 | LLM 텍스트 생성 |
| 3 | vLLM - Small (EXAONE-32B, TP=2) | #FFD93D | 중간 | LLM 텍스트 생성 |
| 4 | vLLM - LoRA (7B + LoRA, MIG) | #FFD93D | 작게 | LLM 텍스트 생성 |
| 5 | Triton Inference Server (Whisper STT / BGE-M3 Embedding / Reranker) | #9C27B0 | 중간 | 비-LLM 추론 |

> Triton은 음성인식(Whisper), 임베딩(BGE-M3), 리랭킹 등 비-LLM 추론을 처리합니다.

하단에 가로 막대 박스:
- "GPU: NVIDIA H100/L40s (EKS Auto Mode + Karpenter)" — 배경 #76B900

---

#### Layer 4: Model Pipeline Layer (y=540~660, 연노랑 배경 #FFF9C4)

컨테이너 제목: "④ Model Pipeline Layer (MLflow + Kubeflow)"

내부 박스 (가로 배치):
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | MLflow (Model Registry / Experiment Tracking) | #326CE5 |
| 2 | ECR (Container Image) | #FF9900 |
| 3 | DeepEval (Offline Evaluation) | #9C27B0 |
| 4 | Kubeflow Pipelines (Orchestration) | #FFD93D |

하단에 텍스트 흐름 화살표:
"Model Lifecycle: On-Prem 학습 → S3 업로드 → MLflow 등록 → DeepEval 평가 → ArgoCD 배포"

---

#### Layer 5: Data Foundry Layer (y=670~790, 연빨강 배경 #FFEBEE)

컨테이너 제목: "⑤ Data Foundry Layer (RAG Pipeline)"

내부 박스 (가로 배치):
| 박스 | 라벨 | 배경색 | 비고 |
|------|------|--------|------|
| 1 | Unstructured.io (문서 파싱 / 청킹) | #00BCD4 | |
| 2 | Milvus (Vector DB) | #326CE5 | |
| 3 | Glue Catalog (Metadata) (선택사항 — 거버넌스 요구 시) | #FF9900 | 점선 테두리 |
| 4 | Label Studio (Data Labeling) | #FF6B6B | |
| 5 | Langfuse (Feedback Loop) | #9C27B0 | |

> Glue Catalog은 데이터 거버넌스가 필요한 경우에만 사용하며, 선택 사항입니다.

---

## 우측 상단: External LLMs (x=1060~1380, y=30~200)

컨테이너 박스, 제목: "External LLMs", 배경 #F5F5F5

내부 박스 (2열 배치):
| 박스 | 라벨 | 배경색 |
|------|------|--------|
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

## 우측 중간: AWS Storage & DB (x=1060~1380, y=210~400)

컨테이너 박스, 제목: "AWS Storage & DB", 배경 #FFF3E0

내부 박스 (3열 배치):
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | S3 | #FF9900 |
| 2 | DynamoDB | #FF9900 |
| 3 | OpenSearch | #FF9900 |
| 4 | ElastiCache | #FF9900 |
| 5 | RDS | #FF9900 |
| 6 | EFS | #FF9900 |
| 7 | FSx Lustre | #FF9900 |

---

## 우측 하단 1: Monitoring & Security (x=1060~1380, y=410~550)

컨테이너 박스, 제목: "Monitoring & Security", 배경 #F3E5F5

내부 박스:
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | AMP (Managed Prometheus) | #9C27B0 |
| 2 | AMG (Managed Grafana) | #9C27B0 |
| 3 | CloudWatch | #FF9900 |
| 4 | X-Ray (ADOT) | #FF9900 |
| 5 | Secrets Manager | #FF6B6B |
| 6 | KMS | #FF6B6B |
| 7 | GuardDuty | #FF6B6B |

---

## 우측 하단 2: On-Premise (x=1060~1380, y=560~780)

### On-Premise (코랩코) - 학습
- 점선 테두리 컨테이너, 배경 #F8BBD0
- 제목: "On-Premise (코랩코) - 학습"
- 내부:
  - "H100 16대 (128장) / Slurm + Ray"
  - "H200 26대 (208장) / DeepSpeed/FSDP"
  - "Megatron-LM / NeMo Framework"

### On-Premise (상암) - 추론
- 점선 테두리 컨테이너, 배경 #F8BBD0
- 제목: "On-Premise (상암) - 추론"
- 내부:
  - "H200 2대, H100 6대, L40s 6대 (88장)"
  - "K-EXAONE | ixi-GEN | GPT-OSS | STT/TTS"

---

## 화살표 (연결선)

### 진입 흐름 (실선, 검정)
1. 사용자 → Route 53
2. Route 53 → CloudFront → WAF → ALB → IAM Identity Center
3. IAM Identity Center → kgateway (EKS 내부 진입)

### EKS 내부 흐름 (실선, #326CE5 파랑)
4. kgateway → FastAPI (REST + WebSocket + SSE) (/api/*, /ws/*)
5. kgateway → LiteLLM (/v1/* AI 트래픽)
6. FastAPI → LangChain / LangGraph (에이전트 요청)
7. LangChain → LiteLLM (LLM 호출)
8. LangChain → RAG Chain → Triton (Embedding) → Milvus (RAG 검색)
9. LangChain → NeMo Guardrails (Input/Output 필터링, 양방향 화살표)
10. LiteLLM → llm-d Inference Gateway (자체 모델)
11. llm-d → vLLM Large / Medium / Small / LoRA (KV Cache-aware 분배)
12. LiteLLM → External LLMs (외부 모델, 우측으로 화살표)

### 데이터 흐름 (점선, #00BCD4 청록)
13. On-Premise (코랩코) --점선화살표--> S3 (모델 아티팩트)
14. S3 → MLflow (모델 등록)
15. MLflow → DeepEval → ArgoCD → vLLM (배포 파이프라인)
16. Unstructured.io → Triton (BGE-M3 Embedding) → Milvus (RAG 인덱싱)
17. RAG Chain → Triton (Embedding) → Milvus (검색 시 임베딩)

### 모니터링 흐름 (점선, #9C27B0 보라)
18. vLLM/llm-d --점선--> ADOT --점선--> AMP → AMG
19. FastAPI --점선--> LangSmith (Dev/Staging 트레이스, 라벨: "애플리케이션 레벨")
20. FastAPI --점선--> Langfuse (Production 트레이스, 라벨: "애플리케이션 레벨")
21. LiteLLM --점선--> LiteLLM 자체 비용 집계 (라벨: "인프라 레벨")
22. Langfuse --점선--> Label Studio (피드백 루프)

### GitOps 배포 (점선, #FF6B6B 빨강)
23. ArgoCD --점선--> EKS Cluster (GitOps 배포, vLLM/Agent 서비스 등)

### On-Premise 연결 (점선, #E91E63 분홍)
24. On-Premise (상암) --점선--> LiteLLM (자체 추론 서버 등록)
25. On-Premise (코랩코) --점선--> S3 (학습 결과 업로드)

---

## 주석 및 범례

캔버스 좌하단에 범례 박스:
- 실선 화살표: 요청/응답 흐름
- 파란 점선: 데이터 흐름
- 보라 점선: 모니터링/메트릭
- 빨강 점선: GitOps 배포 (ArgoCD)
- 분홍 점선: On-Premise 연결

캔버스 우하단에 버전 정보:
- "v4.0 | 2026-03-17 | Portal 경량화 + ArgoCD 외부 배치 + Qwen/DeepSeek 추가"

---

## 스타일 규칙

1. 모든 박스는 둥근 사각형 (rounded=1, arcSize=10)
2. 컨테이너 박스 제목은 좌상단 정렬, 볼드
3. 내부 컴포넌트 박스는 가로 80px, 세로 40px 기본 크기
4. 컴포넌트 박스 내 텍스트: 첫 줄 서비스명 (볼드), 둘째 줄 기술명 (일반)
5. 화살표는 orthogonal 라우팅 (직각 꺾임)
6. 레이어 간 여백 10px
7. 같은 레이어 내 박스 간 여백 8px
8. 모든 텍스트는 중앙 정렬

## 변경 하이라이트 (선택사항)

원본 대비 변경된 부분에 작은 별표(*) 또는 "NEW", "CHANGED", "REMOVED", "HYBRID" 뱃지를 추가:
- kgateway: "CHANGED (Kong→kgateway, WebSocket/SSE 네이티브)"
- IAM Identity Center: "CHANGED (Cognito+Keycloak→IAM IdC)"
- FastAPI: "CHANGED (API Server+WebSocket 통합)"
- llm-d: "NEW"
- AMP/AMG: "CHANGED (Self-hosted→Managed)"
- ArgoCD: "MOVED (Portal→좌측 진입점, EKS Add-on)"
- LangSmith + Langfuse: "HYBRID (LangSmith Dev + Langfuse Prod)"
- Unstructured.io: "NEW"
- NeMo Guardrails: 4 서브그룹 Safety로 분리 표시
- Triton Inference Server: "NEW (비-LLM 추론)"
- MCP/A2A: "NEW (Agent 표준 프로토콜)"
- Bifrost: "NEW (LiteLLM 대안)"
- 2-Tier 비용 추적: "NEW (애플리케이션 + 인프라)"
- Glue Catalog: "OPTIONAL (점선 테두리)"
- OpenSearch: "MOVED (Portal→AWS Storage & DB)"
- Qwen, DeepSeek: "NEW (External LLMs)"
- 제거된 컴포넌트는 표시하지 않음

이 사양으로 draw.io XML을 생성해줘.
```

---

## 프롬프트 사용법

### 방법 1: Claude에게 draw.io XML 생성 요청

위 프롬프트를 Claude에게 붙여넣으면 `.drawio` XML을 생성합니다. 생성된 XML을 `architecture-v4.drawio` 파일로 저장 후 draw.io에서 열면 됩니다.

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

## v3 → v4 변경 요약

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
| 비용 추적 | 단일 레이어 | **2-Tier (애플리케이션: Langfuse, 인프라: LiteLLM)** | 계층별 비용 집계 |
| Triton | 미포함 | **Triton Inference Server 추가** | 비-LLM 추론 (Whisper, BGE-M3, Rerank) |
| MCP/A2A | 미언급 | **Agent Framework에 MCP/A2A 프로토콜 명시** | 표준 프로토콜 지원 |
| Glue Catalog | 필수 | **선택사항 (거버넌스 요구 시)** | 유연한 아키텍처 |
| 버전 | v2.0 | **v3.0** | 52→26 컴포넌트 + 하이브리드 Observability + 2-Tier 비용 추적 |
