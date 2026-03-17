---
title: "LG U+ Agentic AI Platform 아키텍처 개선 리포트"
sidebar_label: "아키텍처 개선 리포트"
description: "EKS 기반 Agentic AI Platform의 레이어별 아키텍처 검토 및 개선 권고사항"
tags: [eks, architecture, review, agentic-ai, gpu, llm, platform]
last_update:
  date: 2026-03-17
---

# LG U+ Agentic AI Platform 아키텍처 개선 리포트

> 작성일: 2026-03-17

---

## 1. Executive Summary

LG U+ Agentic AI Platform의 EKS 기반 오픈소스 아키텍처를 5개 레이어별로 검토하고, **52개 컴포넌트를 25개로 통합**하는 개선안을 제안합니다. 핵심 방향은 다음과 같습니다:

- **서빙 프레임워크 통합**: 7개 → 2개 (vLLM + Triton)
- **관리형 서비스 전환**: Prometheus/Grafana/ArgoCD → AMP/AMG/EKS Add-on
- **인증 단일화**: Cognito + Keycloak → IAM Identity Center
- **Gateway API 표준화**: Kong → kgateway + llm-d + LiteLLM 3-Tier
- **데이터 레이어 경량화**: Spark/Delta Lake/Feast 제거, RAG 파이프라인 중심

| 지표 | 현재 | 개선 후 | 효과 |
|------|:----:|:------:|------|
| 총 컴포넌트 수 | 52개 | 25개 | 52% 감소 |
| EKS 내 관리 Pod 수 | ~45개 (인프라) | ~10개 | 78% 감소 |
| 서빙 프레임워크 | 7종 | 2종 | 운영 복잡도 대폭 감소 |
| 인증 시스템 | 2개 (Cognito+Keycloak) | 1개 (IAM IdC) | 토큰 관리 단순화 |
| 파이프라인 오케스트레이터 | 2개 (Airflow+Kubeflow) | 1개 (Kubeflow) | 중복 제거 |

---

## 2. 레이어별 개선 상세

### 2.1 Portal Layer

#### 변경 요약

| 컴포넌트 | Before | After | 변경 이유 |
|----------|--------|-------|-----------|
| Auth | Keycloak + Cognito | **IAM Identity Center** | 이중 IdP 제거, 사내 AD 네이티브 SCIM 연동 |
| Metering | Prometheus (Self-hosted) | **AMP** (Managed Prometheus) | 운영 부담 제거, 150일 자동 보관 |
| GPU Monitor | Grafana (Self-hosted) | **AMG** (Managed Grafana) | IAM IdC SSO 연동, 관리 불필요 |
| Deploy Mgr | ArgoCD (Self-hosted) | **EKS ArgoCD Add-on** | EKS 라이프사이클 관리, 자동 업데이트 |
| Prompt Mgmt | LangSmith (SaaS) | **Langfuse** (Self-host) | 데이터 주권 확보, MIT 라이선스 |
| Portal UI | Next.js | **Next.js** (유지) | — |
| Metadata | OpenSearch | **OpenSearch** (유지) | — |
| Notebook | JupyterHub | **JupyterHub** (유지) | — |

#### 핵심 개선: 인증 단일화

```
Before:
  사용자 → ALB → Cognito → EKS → Keycloak → 각 서비스

After:
  사용자 → ALB → IAM Identity Center (SAML) → 각 서비스
  API 호출 → kgateway → LiteLLM Virtual Key → 각 서비스
```

- 사람 인증: IAM Identity Center SSO (사내 AD 연동)
- API 인증: LiteLLM Virtual Key (팀별 발급, 비용 추적 포함)

#### 핵심 개선: 관리형 모니터링

```
Before:
  vLLM → Prometheus (StatefulSet, PV 500GB) → Grafana (Deployment)
  관리 Pod: Prometheus 3 + Grafana 2 + AlertManager 1 = 6개

After:
  vLLM → ADOT Collector (DaemonSet) → AMP → AMG
  관리 Pod: ADOT DaemonSet만 (노드당 1개)
```

---

### 2.2 Orchestration Layer (Model Orchestration)

#### 변경 요약

| 컴포넌트 | Before | After | 변경 이유 |
|----------|--------|-------|-----------|
| API Gateway | Kong | **kgateway** | Gateway API 네이티브, llm-d와 동일 CRD 체계 |
| Model Router | LiteLLM | **LiteLLM** (유지) | 모델 매핑, 폴백, 비용 추적 |
| Session | Redis | **Redis / ElastiCache** (유지) | LangGraph checkpointer |
| Config | Consul | **제거** | ConfigMap + ArgoCD로 충분 |
| Agent | LangChain | **LangChain** (유지) | Agent 런타임 |
| Workflow | LangGraph | **LangGraph** (유지) | 멀티스텝 워크플로우 |
| Guardrails | NeMo Guardrails | **NeMo Guardrails** (유지) | FastAPI 미들웨어로 통합 |
| Audio | Whisper | **Serving Layer로 이동** | Triton에서 서빙 |
| Observability | OpenTelemetry | **인프라로 이동** | ADOT → AMP |
| tiktoken | 별도 서비스 | **제거** | LangChain 내부 라이브러리 |
| Exception Handler | 별도 서비스 | **제거** | FastAPI 미들웨어로 통합 |
| Data Handler | FastAPI | **API Server로 통합** | Core Service |
| WebSocket | FastAPI | **API Server로 통합** | Core Service |
| RAG Chain | LangChain | **RAG 서브그룹으로 분리** | — |
| Agent Exec (ReAct) | 별도 | **Agent 서브그룹으로 통합** | — |
| Function Call | 별도 | **Agent 서브그룹으로 통합** | — |

**16개 → 4개 서브그룹 (8개 컴포넌트)**

#### 재구성 구조

```
Orchestration Layer
├── Core Services
│   ├── FastAPI (API Server + WebSocket)
│   └── Redis (Session + Cache)
├── Agent Framework
│   ├── LangChain (Agent Runtime)
│   └── LangGraph (Workflow + ReAct + Tool Registry)
├── RAG Pipeline
│   └── RAG Chain (Embedding/Reranker는 Serving Layer 호출)
└── Safety
    └── NeMo Guardrails (API 미들웨어)
```

#### Gateway 3-Tier 구조

```
Tier 1: kgateway — 인증, TLS, Rate Limit, HTTPRoute 분기
Tier 2: LiteLLM — 모델 라우팅, 폴백, 비용 추적
Tier 3: llm-d — KV Cache-aware 라우팅, InferencePool/InferenceModel CRD
```

---

### 2.3 Model Serving Layer

#### 변경 요약

| 컴포넌트 | Before | After | 변경 이유 |
|----------|--------|-------|-----------|
| vLLM | 유지 | **vLLM** (메인 LLM 서빙) | PagedAttention, LoRA 핫스왑, Speculative Decoding |
| TGI | 사용 | **제거** | vLLM이 모든 기능 커버 |
| Triton | 유지 | **Triton** (Non-LLM만) | Whisper, Embedding, Reranker |
| Ray Serve | 사용 | **제거** | 복합 파이프라인 없으면 불필요 |
| ModelMesh | 사용 | **제거** | vLLM 멀티모델 서빙으로 대체 |
| TorchServe | 사용 | **제거** | Triton으로 대체 |
| Seldon Core | 사용 | **제거** | vLLM + ArgoCD GitOps로 대체 |
| Inference Gateway | 없음 | **llm-d 추가** | KV Cache-aware 라우팅 |

**7개 → 2개 (vLLM + Triton) + llm-d**

#### vLLM 성능 최적화 설정

| 최적화 | 설정 | 효과 |
|--------|------|------|
| Prefix Caching | `--enable-prefix-caching` | 동일 시스템 프롬프트 TTFT 60-80% 감소 |
| Chunked Prefill | `--enable-chunked-prefill` | 긴 컨텍스트에서 TTFT 안정화 |
| CUDA Graph | `--enforce-eager=false` | Decode latency 10-20% 감소 |
| FlashAttention v2 | `VLLM_ATTENTION_BACKEND=FLASH_ATTN` | 메모리 효율 + 속도 향상 |
| FP8 Quantization | `--quantization=fp8` | 메모리 50% 절감, 성능 손실 미미 |
| Speculative Decoding | `--speculative-model=...` | Decode 처리량 2-3x |

#### 모델별 배포 전략

| 모델 | GPU 구성 | 배포 방식 |
|------|----------|----------|
| Qwen3-72B | H100 x4, TP=4 | Auto Mode (GPU 전체 활용) |
| Qwen3-32B | H100 x2, TP=2 | Auto Mode (GPU 전체 활용) |
| EXAONE-32B | H100 x2, TP=2 | Auto Mode (GPU 전체 활용) |
| 7B 모델 + LoRA | H100 MIG 1g.10gb | Karpenter + GPU Operator (MIG 분할) |
| Whisper (STT) | Triton, GPU 공유 | Time-Slicing |
| BGE-M3 (Embedding) | Triton, CPU/GPU | Triton Ensemble |

---

### 2.4 Model Pipeline Layer

#### 변경 요약

| 컴포넌트 | Before | After | 변경 이유 |
|----------|--------|-------|-----------|
| MLflow | 유지 | **MLflow** (모델 레지스트리 통합) | 실험 추적 + 버전 관리 + 아티팩트 |
| Kubeflow Pipelines | 유지 | **Kubeflow Pipelines** (유지) | 파이프라인 오케스트레이션 |
| DeepEval | 유지 | **DeepEval** (유지) | 오프라인 모델 평가 |
| ECR | 유지 | **ECR** (유지) | 컨테이너 이미지 저장 |
| KServe | 사용 | **제거** | vLLM + llm-d + ArgoCD로 대체 |
| Ray Train | 사용 | **제거** | On-Premise에서 학습 (Slurm + NeMo) |
| DVC | 사용 | **제거** | MLflow + S3로 아티팩트 관리 |
| W&B | 사용 | **제거** | MLflow Tracking으로 통합 |
| Kaniko | 사용 | **제거** | vLLM 공식 이미지 사용, 커스텀 빌드 불필요 |

**12개 → 5개**

#### 모델 라이프사이클

```
On-Prem 학습 → S3 체크포인트 업로드 → MLflow 등록 (Staging)
  → Kubeflow Pipeline 트리거
    → DeepEval 오프라인 평가
      → Pass: MLflow (Production) → Git 업데이트 → ArgoCD → vLLM 배포
      → Fail: 알림 → 재학습 트리거
```

---

### 2.5 Data Foundry Layer

#### 변경 요약

| 컴포넌트 | Before | After | 변경 이유 |
|----------|--------|-------|-----------|
| Milvus | 유지 | **Milvus** (벡터 DB) | RAG 핵심 인프라 |
| Glue Catalog | 유지 | **Glue Catalog** (메타데이터) | 문서/청크 메타데이터 관리 |
| Label Studio | 유지 | **Label Studio** (라벨링) | 파인튜닝 데이터 라벨링 |
| Kubeflow Pipelines | 추가 | **Kubeflow Pipelines** (통합) | 데이터 + 모델 파이프라인 통합 |
| Unstructured.io | 추가 | **Unstructured.io** (신규) | 비정형 문서 파싱 |
| Airflow | 사용 | **제거** | Kubeflow Pipelines와 중복 |
| Spark | 사용 | **제거** | LLM 플랫폼에서 대규모 분산 처리 불필요 |
| Delta Lake | 사용 | **제거** | S3 + Glue로 충분 |
| Feast | 사용 | **제거** | LLM은 Vector Store 중심 |
| Great Expectations | 사용 | **제거** | 정형 데이터 검증 도구, 비정형 문서와 미스매치 |
| FeedbackOps | 사용 | **제거** | Langfuse 피드백 기능으로 대체 |

**9개 → 5개**

#### RAG 데이터 흐름

```
문서 수집 (S3/Crawler) → Unstructured.io (파싱) → Semantic Chunking
  → Triton BGE-M3 (임베딩) → Milvus (인덱싱)
  → Glue Catalog (메타데이터 등록)
```

#### 피드백 루프

```
사용자 응답 → Langfuse (피드백 수집, 품질 낮은 응답 필터)
  → Label Studio (사람 라벨링)
  → S3 (파인튜닝 데이터셋)
  → Kubeflow Pipeline → On-Premise 파인튜닝 트리거
```

---

### 2.6 인프라 & 외부 연동 (변경 없음 + 보강)

#### External LLMs (유지)

- Amazon Bedrock (Claude)
- OpenAI (GPT-4.1)
- On-Premise 자체 모델 (K-EXAONE, ixi-GEN)

#### AWS Storage & DB (유지)

- S3, DynamoDB, OpenSearch, ElastiCache, RDS, EFS, FSx Lustre

#### Monitoring & Security (일부 변경)

| Before | After |
|--------|-------|
| CloudWatch | CloudWatch (유지) |
| X-Ray | **ADOT → X-Ray** (OTEL 통합) |
| Secrets Manager | Secrets Manager (유지) |
| KMS | KMS (유지) |
| GuardDuty | GuardDuty (유지) |

#### On-Premise 연결 (보강 필요)

| 항목 | 권장 구성 |
|------|----------|
| 네트워크 | AWS Direct Connect (코랩코/상암 ↔ AWS VPC) |
| 모델 전송 | On-Prem → S3 Transfer Acceleration → MLflow |
| 추론 연동 | 상암 On-Prem 추론 서버 → LiteLLM에 엔드포인트 등록 |
| Hybrid Nodes | 검토 대상 — On-Prem GPU를 EKS 노드로 조인 가능 |

---

## 3. 전체 아키텍처 비교

### 3.1 컴포넌트 수 비교

| 레이어 | Before | After | 감소율 |
|--------|:------:|:-----:|:------:|
| Portal Layer | 8개 | 5개 (+ 3개 관리형) | 38% |
| Orchestration Layer | 16개 | 8개 | 50% |
| Model Serving Layer | 7개 | 3개 (vLLM + Triton + llm-d) | 57% |
| Model Pipeline Layer | 12개 | 5개 | 58% |
| Data Foundry Layer | 9개 | 5개 | 44% |
| **합계** | **52개** | **26개** | **50%** |

### 3.2 운영 부담 비교

| 항목 | Before | After |
|------|--------|-------|
| Self-hosted 인프라 서비스 | Prometheus, Grafana, ArgoCD, Kong, Consul, Airflow, Keycloak | ADOT Collector만 |
| 관리형 전환 | — | AMP, AMG, EKS ArgoCD Add-on, IAM Identity Center |
| DB 의존성 | PostgreSQL (MLflow, Airflow, Keycloak, Kong), Redis | PostgreSQL (MLflow), Redis |
| 인증 시스템 | 2개 (Cognito + Keycloak) | 1개 (IAM Identity Center) |
| 서빙 프레임워크 학습 비용 | 7종 | 2종 |

### 3.3 비용 영향 (예상)

| 항목 | 변화 | 월 비용 영향 |
|------|------|-------------|
| AMP/AMG | 관리형 전환 | +$200~500 |
| Prometheus/Grafana Pod 제거 | 컴퓨팅 절감 | -$300~600 |
| Airflow Pod 제거 | 컴퓨팅 절감 | -$200~400 |
| Kong Pod 제거 | 컴퓨팅 절감 | -$100~200 |
| Keycloak Pod 제거 | 컴퓨팅 절감 | -$100~200 |
| llm-d KV Cache 라우팅 | GPU 연산 절감 (TTFT 감소) | -$1,000~3,000 |
| 서빙 프레임워크 통합 | 운영 인력 절감 | 정량화 어려움 |

---

## 4. 구현 로드맵

### Phase 1: 기반 전환 (2주)

- [ ] kgateway 설치 + Gateway API CRD 구성
- [ ] IAM Identity Center 설정 + 사내 AD SCIM 연동
- [ ] AMP 워크스페이스 생성 + ADOT Collector 배포
- [ ] AMG 워크스페이스 생성 + AMP 데이터소스 연결
- [ ] EKS ArgoCD Add-on 전환

### Phase 2: 서빙 레이어 통합 (2주)

- [ ] vLLM 성능 최적화 설정 적용
- [ ] llm-d 설치 + InferencePool/InferenceModel CRD 구성
- [ ] LiteLLM → llm-d 연동 설정
- [ ] TGI, Ray Serve, ModelMesh, TorchServe, Seldon Core 제거
- [ ] Triton 배포 (Whisper, Embedding, Reranker)

### Phase 3: 오케스트레이션 정리 (1주)

- [ ] Kong → kgateway HTTPRoute 마이그레이션
- [ ] Consul 제거 → ConfigMap 전환
- [ ] NeMo Guardrails를 FastAPI 미들웨어로 통합
- [ ] Langfuse self-host 배포

### Phase 4: 파이프라인 & 데이터 레이어 (2주)

- [ ] Airflow → Kubeflow Pipelines 마이그레이션
- [ ] W&B/DVC → MLflow 통합
- [ ] KServe 제거 → ArgoCD GitOps 배포 전환
- [ ] Unstructured.io 기반 RAG 파이프라인 구성
- [ ] Spark/Delta Lake/Feast 제거

### Phase 5: 검증 & 정리 (1주)

- [ ] 전체 E2E 테스트 (Agent 워크플로우)
- [ ] 성능 벤치마크 (TTFT, TPS, Cache Hit Rate)
- [ ] 비용 비교 분석
- [ ] 문서화 및 운영 가이드 작성

---

## 5. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| kgateway 성숙도 | Kong 대비 생태계 작음 | kgateway는 Envoy 기반으로 안정적, Gateway API 표준 준수 |
| llm-d 초기 프로젝트 | 프로덕션 사례 제한적 | llm-d 없이도 vLLM 단독 운영 가능, 점진 도입 |
| AMP/AMG 비용 | 대규모 메트릭 시 비용 증가 | 메트릭 필터링, 리텐션 정책 설정 |
| Airflow → Kubeflow 전환 | 기존 DAG 마이그레이션 필요 | 병행 운영 후 점진 전환 |
| Langfuse self-host | 운영 부담 | PostgreSQL + S3만 필요, 구조 단순 |

---

## 6. 결론

이번 개선의 핵심은 **"모든 옵션을 다 넣은" 아키텍처에서 "운영 가능한 최소 구성"으로 전환**하는 것입니다.

- 컴포넌트 52개 → 26개: 운영 복잡도 50% 감소
- 서빙 프레임워크 7종 → 2종: 학습 비용과 장애 포인트 대폭 감소
- 관리형 서비스 적극 활용: 인프라 운영 인력을 플랫폼 개발에 집중
- Gateway API 표준 통합: kgateway + llm-d + LiteLLM이 하나의 CRD 체계로 동작
- KV Cache-aware 라우팅: llm-d 도입으로 GPU 비용 절감 및 TTFT 개선

개선된 아키텍처는 Agentic AI 워크로드의 특성(LLM 추론 + Agent + RAG)에 최적화되어 있으며, 전통 ML 워크로드가 추가될 경우 해당 컴포넌트만 별도 네임스페이스로 확장할 수 있습니다.
