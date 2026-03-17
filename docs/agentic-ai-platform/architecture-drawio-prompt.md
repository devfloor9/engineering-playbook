---
title: "개선된 아키텍처 Draw.io 작성 프롬프트"
sidebar_label: "Draw.io 작성 프롬프트"
last_update:
  date: 2026-03-17
---

# LG U+ Agentic AI Platform - 개선 아키텍처 Draw.io 프롬프트

아래 프롬프트를 draw.io AI 또는 Claude에게 제공하여 아키텍처 다이어그램을 생성하세요.

---

## 프롬프트

```
다음 사양에 맞춰 LG U+ Agentic AI Platform의 EKS 기반 아키텍처를 draw.io XML로 작성해줘.

## 전체 레이아웃

- 제목: "LG U+ Agentic AI Platform - EKS 기반 개선 아키텍처 (v2)"
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

### Agent Ready 박스 (하단)
- 컨테이너 박스, 테두리: #326CE5, 배경: #E8F0FE
- 제목: "Agent Ready"
- 내부 박스 (각각 작은 둥근 사각형):
  - "ixi-Enterprise" (배경 #326CE5, 흰 글자)
  - "영업 Agent" (배경 #FFD93D, 검정 글자)
  - "법무 Agent" (배경 #FFD93D, 검정 글자)
  - "빌링 Agent" (배경 #FFD93D, 검정 글자)
  - "AICC Agent" (배경 #FFD93D, 검정 글자)
  - "Agent Builder" (배경 #FFD93D, 검정 글자)

---

## 진입점 (x=130~200, 세로 중앙)

위에서 아래로 세로 배치, 화살표로 연결:
1. **Route 53** (AWS 주황, 작은 박스)
2. **CloudFront** (AWS 주황)
3. **WAF** (보안 빨강)
4. **ALB** (AWS 주황)
5. **IAM Identity Center** (보안 빨강, 라벨: "IAM IdC / SSO")

ALB에서 EKS 클러스터 내부로 화살표 진입.

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
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | Portal UI (Next.js) | #326CE5 |
| 2 | Langfuse (Prompt Mgmt + Observability) | #9C27B0 |
| 3 | OpenSearch (Metadata) | #FF9900 |
| 4 | JupyterHub (Notebook) | #FFD93D |
| 5 | ArgoCD (EKS Add-on) | #FF6B6B |

---

#### Layer 2: Orchestration Layer (y=180~380, 연파랑 배경 #E3F2FD)

컨테이너 제목: "② Orchestration Layer (LangChain + LangGraph)"

내부를 3단 구조로 배치:

**1단 (Gateway Tier):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | kgateway (Gateway API / 인증 / Rate Limit / TLS) | #326CE5 |

**2단 (Core + Agent):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | API Server (FastAPI) | #34A853 |
| 2 | WebSocket (FastAPI) | #34A853 |
| 3 | Redis (Session / Cache) | #FF6B6B |
| 4 | LangChain (Agent Runtime) | #FFD93D |
| 5 | LangGraph (Workflow Engine) | #FFD93D |

**3단 (RAG + Safety + Router):**
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | LiteLLM (LLM Router / 폴백 / 비용) | #FF9900 |
| 2 | RAG Chain | #00BCD4 |
| 3 | NeMo Guardrails (Input/Output 필터) | #FF6B6B |

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
| 박스 | 라벨 | 배경색 | 크기 |
|------|------|--------|------|
| 1 | vLLM - Large (Qwen3-72B, TP=4, H100x4) | #FFD93D | 넓게 |
| 2 | vLLM - Medium (Qwen3-32B, TP=2, H100x2) | #FFD93D | 중간 |
| 3 | vLLM - Small (EXAONE-32B, TP=2) | #FFD93D | 중간 |
| 4 | vLLM - LoRA (7B + LoRA, MIG) | #FFD93D | 작게 |
| 5 | Triton (Whisper / Embedding / Reranker) | #9C27B0 | 중간 |

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
| 박스 | 라벨 | 배경색 |
|------|------|--------|
| 1 | Unstructured.io (문서 파싱 / 청킹) | #00BCD4 |
| 2 | Milvus (Vector DB) | #326CE5 |
| 3 | Glue Catalog (Metadata) | #FF9900 |
| 4 | Label Studio (Data Labeling) | #FF6B6B |
| 5 | Langfuse (Feedback Loop) | #9C27B0 |

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
4. kgateway → API Server (일반 트래픽)
5. kgateway → LiteLLM (/v1/* AI 트래픽)
6. API Server → LangChain / LangGraph (에이전트 요청)
7. LangChain → LiteLLM (LLM 호출)
8. LangChain → RAG Chain → Milvus (RAG 검색)
9. LiteLLM → llm-d Inference Gateway (자체 모델)
10. llm-d → vLLM Large / Medium / Small / LoRA (KV Cache-aware 분배)
11. LiteLLM → External LLMs (외부 모델, 우측으로 화살표)

### 데이터 흐름 (점선, #00BCD4 청록)
12. On-Premise (코랩코) --점선화살표--> S3 (모델 아티팩트)
13. S3 → MLflow (모델 등록)
14. MLflow → DeepEval → ArgoCD → vLLM (배포 파이프라인)
15. Unstructured.io → Triton Embedding → Milvus (RAG 인덱싱)

### 모니터링 흐름 (점선, #9C27B0 보라)
16. vLLM/llm-d --점선--> ADOT --점선--> AMP → AMG
17. Langfuse --점선--> Label Studio (피드백 루프)

### On-Premise 연결 (점선, #E91E63 분홍)
18. On-Premise (상암) --점선--> LiteLLM (자체 추론 서버 등록)
19. On-Premise (코랩코) --점선--> S3 (학습 결과 업로드)

---

## 주석 및 범례

캔버스 좌하단에 범례 박스:
- 실선 화살표: 요청/응답 흐름
- 파란 점선: 데이터 흐름
- 보라 점선: 모니터링/메트릭
- 분홍 점선: On-Premise 연결

캔버스 우하단에 버전 정보:
- "v2.0 | 2026-03-17 | 컴포넌트 52→26개 통합"

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

원본 대비 변경된 부분에 작은 별표(*) 또는 "NEW", "CHANGED", "REMOVED" 뱃지를 추가:
- kgateway: "CHANGED (Kong→kgateway)"
- IAM Identity Center: "CHANGED (Cognito+Keycloak→IAM IdC)"
- llm-d: "NEW"
- AMP/AMG: "CHANGED (Self-hosted→Managed)"
- ArgoCD: "CHANGED (Self-hosted→EKS Add-on)"
- Langfuse: "CHANGED (LangSmith→Langfuse)"
- Unstructured.io: "NEW"
- 제거된 컴포넌트는 표시하지 않음

이 사양으로 draw.io XML을 생성해줘.
```

---

## 프롬프트 사용법

### 방법 1: Claude에게 draw.io XML 생성 요청

위 프롬프트를 Claude에게 붙여넣으면 `.drawio` XML을 생성합니다. 생성된 XML을 `architecture-v2.drawio` 파일로 저장 후 draw.io에서 열면 됩니다.

### 방법 2: draw.io에서 직접 작업

1. draw.io (app.diagrams.net) 열기
2. 위 프롬프트의 레이아웃 사양을 참고하여 수동 배치
3. 색상 팔레트와 스타일 규칙을 적용

### 방법 3: draw.io MCP 서버 활용

draw.io MCP 서버가 설정되어 있다면:
```
/architecture-diagram 위 프롬프트 내용으로 다이어그램 생성
```
