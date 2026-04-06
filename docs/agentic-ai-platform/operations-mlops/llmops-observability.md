---
title: "LLMOps Observability 비교 가이드"
sidebar_label: "LLMOps Observability"
description: "Langfuse, LangSmith, Helicone 비교 및 하이브리드 Observability 아키텍처 구성 가이드"
tags: [eks, observability, langfuse, langsmith, helicone, llmops, monitoring]
category: "genai-aiml"
last_update:
  date: 2026-04-04
  author: devfloor9
sidebar_position: 7
---

# LLMOps Observability 비교 가이드

## 1. 개요

### 1.1 전통적 APM이 LLM 워크로드에서 부족한 이유

전통적인 Application Performance Monitoring (APM) 도구들은 LLM 기반 애플리케이션의 특수한 요구사항을 충족하지 못합니다:

- **토큰 비용 추적 불가**: 기존 APM은 CPU/메모리 사용량만 측정하며, LLM API 호출의 실제 비용인 입력/출력 토큰 수와 프로바이더별 가격을 추적하지 못합니다
- **프롬프트 품질 평가 부재**: HTTP 요청/응답 본문은 기록하지만, 프롬프트 템플릿 버전 관리, A/B 테스트, 품질 평가 메트릭이 없습니다
- **체인 추적의 한계**: LangChain/LlamaIndex 같은 프레임워크의 복잡한 체인(Chain)과 에이전트 워크플로우는 단순 HTTP trace로는 가시성 확보가 어렵습니다
- **의미론적 컨텍스트 부족**: 단순 latency/throughput만 측정할 뿐, "답변이 정확한가?", "환각(hallucination)이 발생했는가?"와 같은 의미론적 품질을 평가하지 못합니다

### 1.2 LLMOps Observability의 4가지 핵심 영역

LLMOps Observability는 다음 네 가지 영역을 통합적으로 다룹니다:

1. **Tracing**: 전체 요청 라이프사이클 추적 (프롬프트 → LLM → 응답), 중첩된 체인/에이전트 단계별 가시성
2. **Evaluation**: 자동/수동 평가를 통한 응답 품질 측정 (정확도, 충실도, 관련성, 독성 등)
3. **Prompt Management**: 프롬프트 템플릿 버전 관리, A/B 테스트, 프로덕션 배포 파이프라인
4. **Cost Tracking**: 프로바이더별/모델별 토큰 비용 실시간 집계, 팀/프로젝트별 예산 관리

### 1.3 주요 목표

이 문서는 다음을 제공합니다:

- **3대 LLMOps Observability 솔루션** (Langfuse, LangSmith, Helicone) 심층 비교
- **하이브리드 아키텍처** 설계: Gateway (Bifrost/kgateway) + Observability (Langfuse) 분리 전략
- **EKS 셀프호스트 배포**: Langfuse를 Aurora PostgreSQL + ClickHouse와 연동
- **OpenTelemetry 통합**: 기존 APM과 LLMOps Observability 통합 대시보드
- **평가 파이프라인**: Ragas와 연계한 RAG 품질 자동 평가

---

## 2. LLMOps Observability 핵심 개념

### 2.1 주요 개념 정의

#### Trace
요청의 전체 라이프사이클을 나타내는 최상위 단위입니다. 하나의 사용자 질문이 여러 LLM 호출, 데이터베이스 검색, 도구 실행을 거쳐 최종 응답을 생성하는 과정 전체를 추적합니다.

#### Span
Trace를 구성하는 개별 단계입니다. 각 Span은 다음을 포함할 수 있습니다:
- **LLM 호출**: 특정 모델에 대한 API 요청
- **도구 호출**: 함수 호출, API 요청, 데이터베이스 쿼리
- **검색 단계**: Vector DB 검색, Reranking
- **후처리**: 파싱, 포맷팅, 검증

#### Generation
LLM API 호출의 세부 정보를 담는 특수한 Span입니다:
- 입력 토큰 수 / 출력 토큰 수
- 모델명 및 파라미터 (temperature, top_p 등)
- 지연 시간 (Time to First Token, Total Time)
- 계산된 비용 (프로바이더별 가격표 기반)

#### Score
응답 품질을 평가하는 메트릭입니다:
- **자동 평가**: LLM-as-Judge, 규칙 기반 점수
- **수동 평가**: 사람의 피드백 (thumbs up/down, 상세 리뷰)
- **메트릭 예시**: Faithfulness (0-1), Relevancy (0-1), Toxicity (0-1)

#### Session
대화형 애플리케이션에서 여러 Trace를 묶는 컨텍스트입니다. 챗봇의 멀티턴 대화, 에이전트의 여러 시도를 하나의 사용자 세션으로 그룹화합니다.

### 2.2 Trace 구조 시각화

```mermaid
flowchart TB
    subgraph Trace["Trace: User Question"]
        direction TB
        A[Query<br/>Processing]
        B[Vector<br/>Search]
        C[LLM Call 1<br/>gpt-4o-mini<br/>1200→80 tok<br/>$0.0024]
        D[Reranking]
        E[LLM Call 2<br/>gpt-4o<br/>3500→450 tok<br/>$0.0285]
        F[Response<br/>Format]
        G[Faithfulness<br/>0.92]
        H[Relevancy<br/>0.88]

        A --> B
        A --> C
        B --> D
        D --> E
        E --> F
        F --> G
        F --> H
    end

    style C fill:#ffd93d,stroke:#333
    style E fill:#ffd93d,stroke:#333
    style G fill:#76b900,stroke:#333
    style H fill:#76b900,stroke:#333
```

---

## 3. 솔루션 비교

### 3.1 Langfuse

#### 개요
Langfuse는 오픈소스 LLMOps Observability 플랫폼으로, 완전한 셀프호스트를 지원하며 MIT 라이선스로 제공됩니다.

#### 핵심 기능

**Tracing**
- LangChain, LlamaIndex, OpenAI SDK 네이티브 통합
- 커스텀 SDK로 모든 프레임워크 지원
- 중첩된 체인과 에이전트 워크플로우 완전 가시성

**Prompt Management**
- 프롬프트 템플릿 버전 관리
- 프로덕션/스테이징 환경 분리
- API를 통한 동적 프롬프트 로딩
- A/B 테스트 지원 (프롬프트 변형 비교)

**Evaluation**
- 자동 평가 파이프라인 (LLM-as-Judge, 규칙 기반)
- Annotation Queue: 수동 평가 워크플로우
- Dataset 관리: 회귀 테스트용 골든셋 구축
- 커스텀 평가자 플러그인

**Dataset Management**
- Trace에서 Dataset 항목 추출
- 버전 관리 및 태깅
- CI/CD 파이프라인 통합 (자동 회귀 테스트)

#### 아키텍처

```mermaid
flowchart LR
    A[Langfuse SDK]
    B[Langfuse<br/>Server]
    C[(PostgreSQL<br/>메타데이터)]
    D[(ClickHouse<br/>분석)]
    E[(Redis<br/>캐시)]
    F[UI]
    G[Eval<br/>Worker]

    A -->|Async<br/>Trace| B
    B --> C
    B --> D
    B --> E
    F --> B
    G --> B

    style C fill:#326ce5,stroke:#333
    style D fill:#76b900,stroke:#333
    style E fill:#e53935,stroke:#333
    style B fill:#ff9900,stroke:#333
```

- **PostgreSQL**: Trace 메타데이터, 프롬프트 버전, 사용자 정보
- **ClickHouse**: 대규모 분석 쿼리 (비용 집계, 트렌드 분석)
- **Redis**: API 응답 캐싱, Rate limiting

#### 장점
- **완전한 데이터 소유권**: 모든 데이터를 자체 인프라에 저장
- **강력한 평가 파이프라인**: Dataset + 자동 평가자 + Annotation Queue
- **프롬프트 버전 관리**: 프로덕션 배포와 롤백 지원
- **무제한 확장**: 클릭하우스 클러스터로 수평 확장 가능
- **비용 효율**: 셀프호스트 시 무제한 트레이스

#### 단점
- **운영 오버헤드**: PostgreSQL + ClickHouse + Redis 관리 필요
- **스케일링 직접 관리**: 트래픽 증가 시 수동 스케일링
- **초기 설정 복잡도**: Helm chart + 데이터베이스 연동 필요

#### 적합한 사용 사례
- 데이터 주권이 중요한 엔터프라이즈
- 수백만 개 이상의 트레이스 처리
- 프롬프트 엔지니어링 팀 운영
- CI/CD 통합 회귀 테스트

---

### 3.2 LangSmith

#### 개요
LangChain 개발사인 LangChain AI에서 제공하는 클라우드 기반 Observability 플랫폼으로, LangChain/LangGraph 생태계와 깊이 통합되어 있습니다.

#### 핵심 기능

**Tracing**
- LangChain/LangGraph 제로 코드 통합
- LangServe 배포 자동 추적
- OpenAI, Anthropic 등 직접 SDK 호출 지원

**Hub (프롬프트 마켓플레이스)**
- 커뮤니티 공유 프롬프트 템플릿
- 버전 관리 및 Fork/Share
- LangChain Hub API로 런타임 로딩

**Evaluation**
- LangSmith Evaluator: 사전 정의된 평가자 라이브러리
- 커스텀 평가자 작성 (Python 함수)
- 비교 모드: 여러 프롬프트/모델 변형 동시 평가

**Annotation Queue**
- 사람의 피드백 수집 워크플로우
- 팀 협업 기능 (댓글, 태그)
- RLHF 파이프라인 데이터 소스

#### 장점
- **LangChain 딥 인테그레이션**: 코드 한 줄로 전체 체인 자동 추적
- **강력한 평가 도구**: 사전 정의된 평가자 라이브러리
- **관리형 서비스**: 인프라 관리 불필요
- **빠른 시작**: 5분 내 통합 가능

#### 단점
- **LangChain 종속성**: 다른 프레임워크 사용 시 통합 복잡
- **클라우드 전용**: 셀프호스트 옵션 제한적 (엔터프라이즈만 가능)
- **비용**: 트레이스당 과금 (대규모 트래픽 시 고비용)
- **데이터 주권**: 민감 데이터가 LangChain 클라우드에 저장

#### 적합한 사용 사례
- LangChain/LangGraph 중심 개발
- 빠른 프로토타이핑과 실험
- 중소규모 프로덕션 (월 100만 트레이스 미만)

---

### 3.3 Helicone

#### 개요
Rust로 작성된 고성능 LLM Gateway + Observability 통합 솔루션입니다. Proxy 기반으로 작동하여 애플리케이션 코드 변경 없이 추적이 가능합니다.

#### 핵심 기능

**Zero-Code 통합**
- OpenAI endpoint를 `oai.helicone.ai`로 변경만 하면 자동 추적
- SDK 설치 불필요
- 모든 LLM 프로바이더 지원 (OpenAI, Anthropic, Cohere 등)

**Gateway + Observability 원스톱**
- Rate limiting, Caching, Retries
- Load balancing (복수 API 키)
- 실시간 비용 대시보드

**Prompt Management (제한적)**
- Prompt Registry: 프롬프트 저장 및 조회
- 버전 관리 미지원 (단순 저장소)

#### 아키텍처

```mermaid
flowchart LR
    A[App Code]
    B[Helicone<br/>Proxy]
    C[OpenAI<br/>API]
    D[(Helicone<br/>DB)]
    E[UI]

    A -->|1. API Call| B
    B -->|2. Forward| C
    C -->|3. Response| B
    B -->|4. Response| A
    B -.->|5. Log| D
    E --> D

    style B fill:#e53935,stroke:#333
    style C fill:#ffd93d,stroke:#333
```

#### 장점
- **초고속 통합**: URL만 변경하면 즉시 추적 시작
- **고성능**: Rust 기반, 지연 시간 < 10ms
- **Gateway 기능 내장**: 별도 Gateway 불필요
- **관리형 + 셀프호스트**: 두 옵션 모두 제공

#### 단점
- **프롬프트 관리 부족**: 버전 관리, A/B 테스트 미지원
- **평가 파이프라인 없음**: 자동 평가자, Dataset 관리 부재
- **제한적 분석**: 심화 분석 쿼리 지원 약함
- **LangChain 체인 추적 한계**: 중첩된 Span 추적 부정확

#### 적합한 사용 사례
- 빠른 시작이 필요한 MVP
- 단순 LLM API 호출 (복잡한 체인 없음)
- Gateway와 Observability를 동시에 필요로 하는 경우

---

### 3.4 솔루션 비교 테이블

| 기능 | Langfuse | LangSmith | Helicone |
|------|----------|-----------|----------|
| **라이선스** | MIT (오픈소스) | Proprietary | Proprietary (셀프호스트 가능) |
| **셀프호스트** | 완전 지원 | 엔터프라이즈만 | 지원 |
| **Tracing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Prompt Management** | ⭐⭐⭐⭐⭐ (버전, A/B) | ⭐⭐⭐⭐ (Hub) | ⭐⭐ (단순 저장) |
| **Evaluation** | ⭐⭐⭐⭐⭐ (Pipeline) | ⭐⭐⭐⭐⭐ | ⭐ (없음) |
| **Dataset Management** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ (없음) |
| **Cost Tracking** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **LangChain 통합** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **프레임워크 중립성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Gateway 기능** | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **통합 난이도** | 중간 (SDK 필요) | 쉬움 (LangChain 시) | 매우 쉬움 (Proxy) |
| **스케일 한계** | 무제한 (셀프호스트) | 플랜 제한 | 플랜 제한 |
| **가격 (셀프호스트)** | 무료 (인프라 비용만) | 엔터프라이즈 협상 | 무료 (인프라 비용만) |
| **가격 (클라우드)** | Developer: 무료<br/>Pro: $59/월<br/>Team: $299/월 | Developer: 무료<br/>Plus: $39/월<br/>Enterprise: 협상 | Hobby: 무료<br/>Pro: $20/월<br/>Growth: $250/월 |
| **데이터 주권** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

**평가 기준**:
- ⭐⭐⭐⭐⭐: 업계 최고 수준
- ⭐⭐⭐⭐: 우수
- ⭐⭐⭐: 기본 기능 제공
- ⭐⭐: 제한적
- ⭐: 미지원

---

## 4. 하이브리드 아키텍처 추천

### 4.1 왜 단일 솔루션이 부족한가

실전 엔터프라이즈 환경에서는 다음과 같은 복합적 요구사항이 존재합니다:

1. **Gateway 분리 필요**
   - Rate limiting, Caching, Failover는 Observability와 독립적으로 관리되어야 함
   - 프로바이더 변경 시 Observability 도구를 교체할 필요 없음

2. **멀티 프레임워크 지원**
   - LangChain, LlamaIndex, 커스텀 코드가 혼재
   - 특정 프레임워크에 종속되지 않는 중립적 Observability

3. **데이터 주권과 비용**
   - 민감 데이터는 클라우드로 전송 불가
   - 대규모 트래픽 시 클라우드 과금 급증

4. **고급 평가 파이프라인**
   - Ragas 같은 전문 평가 프레임워크 통합
   - CI/CD 파이프라인에서 회귀 테스트 자동화

### 4.2 추천 조합: Bifrost (Gateway) + Langfuse (Observability)

이 조합은 다음과 같은 이점을 제공합니다:

- **Gateway 책임 분리**: Bifrost가 프로바이더 라우팅, Caching, Rate limiting 담당
- **Observability 전문화**: Langfuse가 Tracing, 평가, 프롬프트 관리 담당
- **완전한 셀프호스트**: 모든 구성 요소를 EKS에서 실행
- **확장성**: 각 계층을 독립적으로 스케일링

### 4.3 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        A[Web App]
    end

    subgraph EKS["EKS Cluster"]
        subgraph GW["Gateway"]
            B[Kong/Envoy]
            C[Bifrost]
        end

        subgraph OBS["Observability"]
            D[Langfuse]
            E[(Aurora)]
            F[(ClickHouse)]
            G[(Redis)]
        end

        subgraph EVAL["Evaluation"]
            H[Eval Worker]
            I[Ragas]
        end
    end

    subgraph EXT["External LLM"]
        J[OpenAI]
        K[Anthropic]
        L[Bedrock]
    end

    A -->|Request| B
    B --> C
    C --> J & K & L
    J & K & L -->|Response| C
    C --> B
    B --> A

    C -.->|Trace| D
    D --> E & F & G
    H --> D
    I --> D

    style C fill:#e53935,stroke:#333
    style D fill:#326ce5,stroke:#333
    style H fill:#76b900,stroke:#333
```

**데이터 흐름**:
1. 클라이언트가 Kong/Envoy Gateway로 요청
2. Gateway가 Bifrost로 라우팅
3. Bifrost가 프로바이더별로 LLM API 호출
4. 응답 수신
5. Bifrost가 Gateway로 응답 반환
6. Gateway가 클라이언트로 응답
7. **비동기**: Bifrost가 Langfuse로 Trace 전송 (응답 지연 없음)

### 4.4 Helicone 단독 vs Bifrost+Langfuse 분리 아키텍처 비교

| 측면 | Helicone 단독 | Bifrost + Langfuse |
|------|---------------|---------------------|
| **통합 복잡도** | 매우 낮음 (URL 변경만) | 중간 (SDK 통합 필요) |
| **Gateway 기능** | 내장 (Rate limiting, Cache) | Bifrost가 제공 |
| **프롬프트 관리** | 제한적 (저장만) | 강력 (버전, A/B 테스트) |
| **평가 파이프라인** | 없음 | 완전 지원 (Ragas 통합) |
| **체인 추적** | 제한적 | 완벽 (중첩 Span) |
| **데이터 주권** | 셀프호스트 시 확보 | 완전 확보 |
| **확장성** | Gateway/Observability 결합 | 독립 스케일링 |
| **비용 (대규모)** | 플랜 제한 가능 | 무제한 (인프라 비용만) |
| **적합 시나리오** | MVP, 단순 API 호출 | 엔터프라이즈, 복잡한 체인 |

**결론**: Helicone은 빠른 시작에 적합하지만, 프롬프트 엔지니어링 팀과 평가 파이프라인이 필요한 엔터프라이즈 환경에서는 Bifrost + Langfuse 조합이 우수합니다.

---

## 5. Langfuse EKS 배포 및 vLLM 연동

### 5.1 Langfuse EKS 배포 개요

Langfuse를 EKS에 배포하고 kgateway HTTPRoute로 단일 NLB 통합 라우팅을 구성합니다.

### 5.2 Helm 설치

Langfuse Helm 차트를 사용하여 PostgreSQL, ClickHouse, Redis를 포함한 전체 스택을 배포합니다.

```bash
# Langfuse Helm 저장소 추가
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update

# 네임스페이스 생성
kubectl create namespace observability

# Langfuse Helm 설치 (PostgreSQL + ClickHouse + Redis 포함)
helm install langfuse langfuse/langfuse \
  --namespace observability \
  --set postgresql.enabled=true \
  --set postgresql.auth.password="secure-password" \
  --set clickhouse.enabled=true \
  --set redis.enabled=true \
  --set ingress.enabled=false \
  --set replicaCount=2
```

:::info EBS CSI Driver 필수
Langfuse의 PostgreSQL과 ClickHouse는 영구 스토리지가 필요합니다. EKS 클러스터에 **EBS CSI Driver**가 설치되어 있고 **default StorageClass**가 구성되어 있어야 합니다.

```bash
# EBS CSI Driver 설치 확인
kubectl get csidriver ebs.csi.aws.com

# default StorageClass 확인
kubectl get storageclass
```
:::

### 5.3 Langfuse Helm 배포 주의사항

:::warning Langfuse Helm 배포 시 발생 가능한 이슈

Langfuse를 Helm으로 배포할 때 다음 세 가지 문제가 자주 발생합니다:

#### 1. Redis 패스워드 불일치 (Worker CrashLoopBackOff)

**증상**: `langfuse-worker` Pod가 CrashLoopBackOff 상태

**원인**: Bitnami Valkey 차트는 Secret key를 `valkey-password`로 생성하지만, Langfuse Helm 차트가 `redis-password`를 기대하여 Worker의 `REDIS_CONNECTION_STRING`에 패스워드가 누락됩니다.

**해결 방법**:
```bash
# Redis 패스워드 확인
REDIS_PASSWORD=$(kubectl get secret langfuse-redis -n observability -o jsonpath='{.data.valkey-password}' | base64 -d)

# Worker Deployment에 REDIS_CONNECTION_STRING 직접 주입
kubectl set env deploy/langfuse-worker \
  REDIS_CONNECTION_STRING="redis://default:${REDIS_PASSWORD}@langfuse-redis-primary:6379/0" \
  -n observability
```

#### 2. 오브젝트 스토리지: AWS S3 + KMS 권장 (MinIO 대체)

Langfuse Helm 차트는 기본적으로 MinIO를 내장 S3로 설치하지만, **안정성과 보안을 위해 AWS S3 + KMS를 권장**합니다.

| | MinIO (기본) | AWS S3 + KMS (권장) |
|---|---|---|
| **가용성** | 단일 Pod | 99.999999999% (11 nines) |
| **암호화** | 없음 | SSE-KMS (자동 암호화) |
| **인증** | Access Key (환경변수) | Pod Identity (키 불필요) |
| **백업** | 수동 | S3 버전 관리 + Lifecycle |
| **비용** | 클러스터 리소스 | S3 저장 + 요청 비용 |

**S3 + KMS 구성:**

```bash
# 1. S3 버킷 + KMS 키 생성
aws s3api create-bucket --bucket langfuse-traces-<ACCOUNT_ID> --region <REGION> \
  --create-bucket-configuration LocationConstraint=<REGION>
KMS_KEY=$(aws kms create-key --description "Langfuse trace encryption" \
  --query 'KeyMetadata.KeyId' --output text)

# 2. S3 기본 암호화 (KMS)
aws s3api put-bucket-encryption --bucket langfuse-traces-<ACCOUNT_ID> \
  --server-side-encryption-configuration \
  '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "'$KMS_KEY'"}, "BucketKeyEnabled": true}]}'

# 3. IAM Role + Pod Identity (Access Key 불필요)
aws iam create-role --role-name langfuse-s3-access \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"pods.eks.amazonaws.com"},"Action":["sts:AssumeRole","sts:TagSession"]}]}'
aws iam put-role-policy --role-name langfuse-s3-access --policy-name s3-kms \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:PutObject","s3:GetObject","s3:DeleteObject","s3:ListBucket"],"Resource":["arn:aws:s3:::langfuse-traces-<ACCOUNT_ID>","arn:aws:s3:::langfuse-traces-<ACCOUNT_ID>/*"]},{"Effect":"Allow","Action":["kms:GenerateDataKey","kms:Decrypt"],"Resource":"arn:aws:kms:<REGION>:<ACCOUNT_ID>:key/'$KMS_KEY'"}]}'
aws eks create-pod-identity-association \
  --cluster-name <CLUSTER> --namespace langfuse \
  --service-account langfuse \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/langfuse-s3-access

# 4. Langfuse 환경변수 변경 (MinIO → S3)
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_BUCKET="langfuse-traces-<ACCOUNT_ID>" \
  LANGFUSE_S3_EVENT_UPLOAD_REGION="<REGION>" \
  LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT- \
  LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID- \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY- \
  LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE-
```

:::tip MinIO를 유지하는 경우
MinIO를 사용할 경우, Helm 차트가 S3 Secret Key를 환경변수에 자동 주입하지 않습니다. Secret key 이름이 `valkey-password`처럼 `root-password`이므로 수동 주입이 필요합니다:
```bash
MINIO_PW=$(kubectl get secret langfuse-s3 -n langfuse -o jsonpath='{.data.root-password}' | base64 -d)
kubectl set env deploy/langfuse-web deploy/langfuse-worker -n langfuse \
  LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY="$MINIO_PW" \
  LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY="$MINIO_PW"
```
:::

#### 3. NEXTAUTH_URL 설정 오류 (인증 루프)

**증상**: Langfuse UI 로그인 시 무한 리다이렉트

**원인**: `NEXTAUTH_URL`이 `localhost:3000`으로 설정되어 있음

**해결 방법**:
```bash
# 실제 접근 URL로 변경
kubectl set env deploy/langfuse \
  NEXTAUTH_URL="https://langfuse.example.com" \
  -n observability
```

**values.yaml 올바른 설정 예시**:
```yaml
env:
  - name: NEXTAUTH_URL
    value: "https://langfuse.example.com"
  - name: REDIS_CONNECTION_STRING
    value: "redis://default:$(REDIS_PASSWORD)@langfuse-redis-primary:6379/0"
  - name: LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: langfuse-s3
        key: root-password
```

:::

### 5.3 Pod Identity로 IAM 권한 관리

EKS Pod Identity를 사용하여 Langfuse에 S3, RDS 등의 AWS 리소스 접근 권한을 부여합니다.

```yaml
# langfuse-pod-identity.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: langfuse
  namespace: observability
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/LangfuseRole
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse
  namespace: observability
spec:
  template:
    spec:
      serviceAccountName: langfuse
```

IAM Role 정책 예시:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::langfuse-traces/*"
    }
  ]
}
```

### 5.4 kgateway HTTPRoute로 /langfuse/* 라우팅

kgateway를 사용하여 단일 NLB 엔드포인트에서 `/langfuse/*` 경로를 Langfuse 서비스로 라우팅합니다.

```yaml
# langfuse-httproute.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: langfuse-route
  namespace: observability
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  hostnames:
    - "api.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /langfuse/
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: langfuse
          port: 3000
---
# ReferenceGrant for cross-namespace access
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-langfuse
  namespace: observability
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway
  to:
    - group: ""
      kind: Service
```

접속 URL:
```
http://[NLB_ENDPOINT]/langfuse/     → Langfuse 웹 UI
http://[NLB_ENDPOINT]/langfuse/api  → Langfuse API
```

### 5.5 데이터 흐름 다이어그램

```mermaid
flowchart TB
    subgraph Client["클라이언트"]
        USER[AI 애플리케이션]
    end
    
    subgraph Gateway["Gateway 계층"]
        KGATEWAY[kgateway<br/>NLB 통합]
    end
    
    subgraph Services["서비스 계층"]
        VLLM[vLLM<br/>/v1/*]
        LANGFUSE[Langfuse<br/>/langfuse/*]
    end
    
    subgraph Storage["스토리지 계층"]
        PG[(PostgreSQL<br/>메타데이터)]
        CH[(ClickHouse<br/>분석)]
        REDIS[(Redis<br/>캐시)]
    end
    
    USER -->|1. 추론 요청| KGATEWAY
    KGATEWAY -->|2. /v1/* 라우팅| VLLM
    VLLM -->|3. 응답| USER
    VLLM -.->|4. SDK로 Trace 전송| LANGFUSE
    
    USER -->|5. 대시보드 접속| KGATEWAY
    KGATEWAY -->|6. /langfuse/* 라우팅| LANGFUSE
    
    LANGFUSE --> PG
    LANGFUSE --> CH
    LANGFUSE --> REDIS
    
    style KGATEWAY fill:#326ce5,stroke:#333
    style VLLM fill:#ffd93d,stroke:#333
    style LANGFUSE fill:#4285f4,stroke:#333
    style PG fill:#336791,stroke:#333
    style CH fill:#FF3333,stroke:#333
    style REDIS fill:#DC382D,stroke:#333
```

### 5.6 Langfuse 수집 데이터 계층

Langfuse는 다음과 같은 계층 구조로 데이터를 수집합니다:

```mermaid
flowchart TB
    TRACE[Trace<br/>전체 요청 라이프사이클]
    SPAN1[Span: Vector Search]
    SPAN2[Span: Reranking]
    GEN[Generation<br/>LLM API 호출]
    SCORE1[Score: Faithfulness]
    SCORE2[Score: Relevancy]
    
    TRACE --> SPAN1
    TRACE --> SPAN2
    TRACE --> GEN
    GEN --> SCORE1
    GEN --> SCORE2
    
    style TRACE fill:#4285f4,stroke:#333
    style GEN fill:#ffd93d,stroke:#333
    style SCORE1 fill:#34a853,stroke:#333
    style SCORE2 fill:#34a853,stroke:#333
```

**수집 데이터 종류:**

| 데이터 유형 | 설명 | 확인 가능 항목 |
|------------|------|---------------|
| **Trace** | 전체 요청 라이프사이클 | 총 지연 시간, 총 비용, 세션 ID |
| **Generation** | LLM API 호출 상세 | 입력/출력 토큰, 모델명, 지연 시간, 파라미터(temperature 등) |
| **Span** | 개별 작업 단계 | Vector 검색, Reranking, 도구 호출 등 |
| **Score** | 품질 평가 메트릭 | Faithfulness, Relevancy, Toxicity 등 |

### 5.7 확인 가능한 주요 항목

Langfuse 대시보드에서 다음을 실시간으로 확인할 수 있습니다:

1. **사용자별 토큰 소비 패턴**
   - 사용자/테넌트별 일일 토큰 사용량
   - 입력 vs 출력 토큰 비율
   - 피크 시간대 분석

2. **모델별 비용**
   - 모델별 총 비용 및 요청 수
   - 가장 비용이 높은 모델 식별
   - 예산 대비 사용량

3. **TTFT (Time to First Token) / TPS (Tokens per Second) 추이**
   - P50, P95, P99 지연 시간
   - 모델별 처리 속도 비교
   - 시간대별 성능 변화

4. **프롬프트 품질**
   - Faithfulness, Relevancy 점수 분포
   - 낮은 점수를 받은 프롬프트 필터링
   - A/B 테스트 결과 비교

### 5.8 인프라 사전 준비

Langfuse를 EKS에 배포하기 전에 다음 AWS 리소스를 준비합니다:

- **RDS Aurora PostgreSQL**: Langfuse 메타데이터 저장
- **ClickHouse** (EC2 또는 Altinity.Cloud): 분석 쿼리용
- **ElastiCache Redis**: API 응답 캐싱
- **EKS Cluster**: v1.28 이상
- **Application Load Balancer**: Ingress 진입점

### 5.2 Helm Chart 설치

#### values.yaml 설정

```yaml
# langfuse-values.yaml
replicaCount: 3

image:
  repository: langfuse/langfuse
  tag: "2.45.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3000

ingress:
  enabled: true
  className: alb
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/xxxxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
  hosts:
    - host: langfuse.example.com
      paths:
        - path: /
          pathType: Prefix

env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: langfuse-db
        key: postgres-url

  - name: CLICKHOUSE_URL
    valueFrom:
      secretKeyRef:
        name: langfuse-db
        key: clickhouse-url

  - name: REDIS_HOST
    value: "langfuse-redis.cache.amazonaws.com"

  - name: REDIS_PORT
    value: "6379"

  - name: NEXTAUTH_URL
    value: "https://langfuse.example.com"

  - name: NEXTAUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: langfuse-secrets
        key: nextauth-secret

  - name: SALT
    valueFrom:
      secretKeyRef:
        name: langfuse-secrets
        key: salt

  - name: TELEMETRY_ENABLED
    value: "false"

  - name: LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES
    value: "true"

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector:
  workload: genai

tolerations:
  - key: "workload"
    operator: "Equal"
    value: "genai"
    effect: "NoSchedule"

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - langfuse
          topologyKey: kubernetes.io/hostname
```

#### Secret 생성

```bash
# PostgreSQL 연결 문자열
kubectl create secret generic langfuse-db \
  --from-literal=postgres-url='postgresql://langfuse:PASSWORD@langfuse-db.cluster-xxx.us-west-2.rds.amazonaws.com:5432/langfuse' \
  --from-literal=clickhouse-url='http://user:password@clickhouse.example.com:8123/langfuse' \
  -n genai

# NextAuth 시크릿 생성
kubectl create secret generic langfuse-secrets \
  --from-literal=nextauth-secret=$(openssl rand -base64 32) \
  --from-literal=salt=$(openssl rand -base64 32) \
  -n genai
```

#### Helm 배포

```bash
# Langfuse Helm Repository 추가
helm repo add langfuse https://langfuse.github.io/langfuse-helm
helm repo update

# 배포
helm upgrade --install langfuse langfuse/langfuse \
  -f langfuse-values.yaml \
  -n genai \
  --create-namespace

# 상태 확인
kubectl get pods -n genai -l app=langfuse
kubectl get ingress -n genai
```

### 5.3 PostgreSQL (RDS Aurora) 연동

#### RDS Aurora 설정

```hcl
# Terraform 예시
resource "aws_rds_cluster" "langfuse" {
  cluster_identifier      = "langfuse-db"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "langfuse"
  master_username         = "langfuse"
  master_password         = random_password.langfuse_db.result

  db_subnet_group_name    = aws_db_subnet_group.private.name
  vpc_security_group_ids  = [aws_security_group.langfuse_db.id]

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 16
  }

  skip_final_snapshot     = false
  final_snapshot_identifier = "langfuse-db-final-snapshot"

  tags = {
    Environment = "production"
    Service     = "langfuse"
  }
}

resource "aws_rds_cluster_instance" "langfuse" {
  count              = 2
  identifier         = "langfuse-db-${count.index}"
  cluster_identifier = aws_rds_cluster.langfuse.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.langfuse.engine
  engine_version     = aws_rds_cluster.langfuse.engine_version
}
```

#### 초기 스키마 마이그레이션

Langfuse는 첫 시작 시 자동으로 스키마를 생성하지만, 수동 마이그레이션도 가능합니다:

```bash
# Langfuse Pod에 접속
kubectl exec -it langfuse-0 -n genai -- /bin/bash

# 마이그레이션 실행
npm run db:migrate
```

### 5.4 ClickHouse 연동 (분석 쿼리용)

#### ClickHouse Operator 배포 (EKS 내부)

```yaml
# clickhouse-cluster.yaml
apiVersion: clickhouse.altinity.com/v1
kind: ClickHouseInstallation
metadata:
  name: langfuse-clickhouse
  namespace: genai
spec:
  configuration:
    clusters:
      - name: langfuse
        layout:
          shardsCount: 2
          replicasCount: 2
    zookeeper:
      nodes:
        - host: zk-0.zk-headless.genai.svc.cluster.local
        - host: zk-1.zk-headless.genai.svc.cluster.local
        - host: zk-2.zk-headless.genai.svc.cluster.local

  templates:
    podTemplates:
      - name: default
        spec:
          containers:
            - name: clickhouse
              image: clickhouse/clickhouse-server:23.12
              resources:
                requests:
                  cpu: "2"
                  memory: "8Gi"
                limits:
                  cpu: "4"
                  memory: "16Gi"

    volumeClaimTemplates:
      - name: data
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 500Gi
          storageClassName: gp3
```

#### Langfuse에서 ClickHouse 활성화

Langfuse는 ClickHouse를 분석 쿼리 가속화에 사용합니다. 환경 변수로 활성화:

```yaml
env:
  - name: CLICKHOUSE_URL
    value: "http://clickhouse-langfuse.genai.svc.cluster.local:8123"

  - name: CLICKHOUSE_USER
    value: "default"

  - name: CLICKHOUSE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: clickhouse-secret
        key: password

  - name: CLICKHOUSE_DATABASE
    value: "langfuse"
```

Langfuse가 자동으로 ClickHouse 테이블을 생성하고 PostgreSQL 데이터를 동기화합니다.

### 5.5 Redis 연동 (캐싱)

#### ElastiCache Redis 설정

```hcl
# Terraform 예시
resource "aws_elasticache_replication_group" "langfuse" {
  replication_group_id       = "langfuse-redis"
  replication_group_description = "Redis for Langfuse caching"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r7g.large"
  number_cache_clusters      = 2

  subnet_group_name          = aws_elasticache_subnet_group.private.name
  security_group_ids         = [aws_security_group.langfuse_redis.id]

  automatic_failover_enabled = true
  multi_az_enabled           = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.langfuse_redis.result

  tags = {
    Environment = "production"
    Service     = "langfuse"
  }
}
```

#### Langfuse Redis 설정

```yaml
env:
  - name: REDIS_HOST
    value: "langfuse-redis.xxxxx.cache.amazonaws.com"

  - name: REDIS_PORT
    value: "6379"

  - name: REDIS_AUTH
    valueFrom:
      secretKeyRef:
        name: redis-secret
        key: auth-token

  - name: REDIS_CONNECTION_STRING
    value: "rediss://:$(REDIS_AUTH)@$(REDIS_HOST):$(REDIS_PORT)"
```

### 5.6 Ingress 설정

#### AWS Load Balancer Controller 기반 ALB

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: langfuse
  namespace: genai
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/xxxxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/healthcheck-path: /api/health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/backend-protocol: HTTP
    alb.ingress.kubernetes.io/tags: Environment=production,Service=langfuse
spec:
  ingressClassName: alb
  rules:
    - host: langfuse.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: langfuse
                port:
                  number: 3000
```

### 5.7 리소스 요구사항 테이블

| 구성 요소 | CPU (Request/Limit) | Memory (Request/Limit) | 스토리지 | 인스턴스 수 |
|-----------|---------------------|------------------------|----------|-------------|
| **Langfuse Server** | 1 / 2 | 2Gi / 4Gi | - | 3-10 (HPA) |
| **PostgreSQL (Aurora)** | - | - | 100GB (초기) | 2 (Reader) |
| **ClickHouse** | 2 / 4 | 8Gi / 16Gi | 500GB / shard | 4 (2 shards × 2 replicas) |
| **Redis (ElastiCache)** | - | cache.r7g.large (13.07GB) | - | 2 (Primary + Replica) |
| **Evaluation Worker** | 0.5 / 1 | 1Gi / 2Gi | - | 2 |

**추정 비용** (us-west-2, 월간):
- EKS Worker Nodes (m6i.2xlarge × 5): ~$600
- RDS Aurora Serverless v2 (0.5-8 ACU): ~$150
- ClickHouse (m6i.xlarge × 4): ~$480
- ElastiCache Redis (r7g.large × 2): ~$240
- ALB: ~$20
- **총합**: ~$1,490/월

---

## 6. OpenTelemetry 연동

### 6.1 왜 OpenTelemetry를 통합하는가?

Langfuse는 LLM 특화 Observability를 제공하지만, 전체 애플리케이션 컨텍스트는 기존 APM (Datadog, New Relic, Grafana)에서 관리합니다. OpenTelemetry를 사용하면:

- **통합 대시보드**: LLM Trace + 기존 APM Trace를 한 화면에서 조회
- **상관 관계 분석**: HTTP 요청 → DB 쿼리 → LLM 호출의 전체 흐름 추적
- **단일 계측 SDK**: OpenTelemetry만 사용하여 Langfuse와 기존 APM 동시 전송

### 6.1.1 Bifrost → Langfuse OTel 통합

Bifrost에서 Langfuse로 OpenTelemetry trace를 전송할 때 주의할 점:

**OTLP 엔드포인트 경로**: Langfuse는 `/api/public/otel/v1/traces` 전체 경로를 요구하지만, Bifrost OTel 플러그인은 `collector_url`의 base path만 사용합니다. 따라서 kgateway에서 URLRewrite로 경로 변환이 필요합니다.

#### Bifrost → kgateway → Langfuse 데이터 흐름

```mermaid
graph LR
    Client[클라이언트] --> kgateway1[kgateway<br/>/v1/*]
    kgateway1 -->|라우팅| Bifrost
    Bifrost --> vLLM[vLLM<br/>추론]
    Bifrost -->|OTel traces<br/>/api/public/otel| kgateway2[kgateway<br/>URLRewrite]
    kgateway2 -->|/api/public/otel/v1/traces| Langfuse

    style Bifrost fill:#e53935,stroke:#333
    style kgateway2 fill:#326ce5,stroke:#333
    style Langfuse fill:#9c27b0,stroke:#333
```

#### kgateway URLRewrite 설정

```yaml
# langfuse-otel-route.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: langfuse-otel-route
  namespace: observability
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  hostnames:
    - "api.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/public/otel
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /api/public/otel/v1/traces
      backendRefs:
        - name: langfuse-web
          port: 3000
```

**설명**:
- Bifrost가 `http://api.example.com/api/public/otel`로 전송
- kgateway가 `/api/public/otel` → `/api/public/otel/v1/traces`로 리라이트
- Langfuse가 올바른 OTLP 엔드포인트로 수신

**Bifrost config.json OTel 설정**:
```json
{
  "plugins": [{
    "enabled": true,
    "name": "otel",
    "config": {
      "service_name": "bifrost",
      "trace_type": "otel",
      "protocol": "http",
      "collector_url": "http://api.example.com/api/public/otel",
      "headers": {
        "Authorization": "Basic <BASE64(pk:sk)>",
        "x-langfuse-ingestion-version": "4"
      }
    }
  }]
}
```

:::tip Bifrost OTel 플러그인 주의사항

Bifrost OTel 플러그인은 `collector_url`의 base path만 사용하므로, `/v1/traces` suffix를 직접 추가하지 않습니다. kgateway URLRewrite를 통해 전체 경로로 변환해야 합니다.

**잘못된 설정** (동작하지 않음):
```json
"collector_url": "http://langfuse:3000/api/public/otel/v1/traces"
```

**올바른 설정**:
```json
"collector_url": "http://api.example.com/api/public/otel"
```
+ kgateway URLRewrite: `/api/public/otel` → `/api/public/otel/v1/traces`

:::

### 6.2 OTEL SDK로 커스텀 Span 추가

#### Python 예시

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from langfuse.opentelemetry import LangfuseSpanProcessor

# OTEL Tracer 초기화
provider = TracerProvider()
trace.set_tracer_provider(provider)

# Langfuse로 Span 전송
langfuse_processor = LangfuseSpanProcessor(
    public_key="pk-lf-xxx",
    secret_key="sk-lf-xxx",
    host="https://langfuse.example.com"
)
provider.add_span_processor(langfuse_processor)

# 기존 APM (Grafana Tempo)로도 전송
otlp_exporter = OTLPSpanExporter(endpoint="https://tempo.example.com:4317")
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

tracer = trace.get_tracer(__name__)

# RAG 파이프라인 추적
def rag_pipeline(question: str) -> str:
    with tracer.start_as_current_span("rag_pipeline") as span:
        span.set_attribute("question", question)

        # 1. Vector 검색
        with tracer.start_as_current_span("vector_search") as search_span:
            docs = vector_store.search(question, top_k=5)
            search_span.set_attribute("num_results", len(docs))

        # 2. Reranking
        with tracer.start_as_current_span("reranking") as rerank_span:
            reranked = reranker.rerank(docs, question)
            rerank_span.set_attribute("model", "cross-encoder/ms-marco")

        # 3. LLM 호출
        with tracer.start_as_current_span(
            "llm_generation",
            attributes={
                "llm.model": "gpt-4o",
                "llm.temperature": 0.7,
            }
        ) as llm_span:
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": question}
                ],
                temperature=0.7
            )

            llm_span.set_attribute("llm.input_tokens", response.usage.prompt_tokens)
            llm_span.set_attribute("llm.output_tokens", response.usage.completion_tokens)
            llm_span.set_attribute("llm.total_cost", calculate_cost(response.usage))

            answer = response.choices[0].message.content
            span.set_attribute("answer", answer)

        return answer
```

### 6.3 Langfuse OTEL Exporter 설정

Langfuse는 OpenTelemetry Semantic Conventions를 준수합니다. 다음 Span 속성이 자동 매핑됩니다:

| OTEL 속성 | Langfuse 필드 | 설명 |
|-----------|---------------|------|
| `llm.model` | `model` | 모델명 (gpt-4o, claude-3-opus 등) |
| `llm.input_tokens` | `usage.input` | 입력 토큰 수 |
| `llm.output_tokens` | `usage.output` | 출력 토큰 수 |
| `llm.temperature` | `modelParameters.temperature` | Temperature 파라미터 |
| `llm.request.prompt` | `input` | 프롬프트 |
| `llm.response.completion` | `output` | 응답 텍스트 |
| `llm.total_cost` | `calculatedTotalCost` | 계산된 비용 |

### 6.4 Grafana + Langfuse 통합 대시보드

#### Grafana Tempo + Langfuse 조합

```mermaid
flowchart LR
    A[Application]
    B[OTEL<br/>Collector]
    C[Tempo]
    D[Langfuse]
    E[Grafana UI]

    A -->|OTEL<br/>Spans| B
    B -->|Export| C
    B -->|Export| D
    E --> C
    E --> D

    style C fill:#9c27b0,stroke:#333
    style D fill:#326ce5,stroke:#333
    style B fill:#ff9900,stroke:#333
```

#### Grafana Dashboard JSON 예시 (일부)

```json
{
  "dashboard": {
    "title": "LLM Observability - Unified View",
    "panels": [
      {
        "title": "LLM Request Latency (p95)",
        "targets": [
          {
            "datasource": "Tempo",
            "query": "histogram_quantile(0.95, sum(rate(traces_spanmetrics_latency_bucket{span_name=\"llm_generation\"}[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Token Usage by Model",
        "targets": [
          {
            "datasource": "Langfuse",
            "query": "SELECT model, SUM(usage_input + usage_output) as total_tokens FROM traces WHERE timestamp > now() - interval '1 hour' GROUP BY model"
          }
        ]
      },
      {
        "title": "Cost per Project",
        "targets": [
          {
            "datasource": "Langfuse",
            "query": "SELECT project_name, SUM(calculated_total_cost) as cost FROM traces WHERE timestamp > now() - interval '1 day' GROUP BY project_name"
          }
        ]
      }
    ]
  }
}
```

Grafana에서 Langfuse를 데이터소스로 추가하려면 Langfuse의 ClickHouse를 직접 쿼리하거나, Langfuse API를 통해 데이터를 가져옵니다.

---

## 7. 평가 파이프라인 구축

### 7.1 Langfuse Evaluation 설정

Langfuse Evaluation은 다음 세 가지 방식을 지원합니다:

1. **LLM-as-Judge**: 별도 LLM을 사용하여 응답 품질 평가
2. **규칙 기반**: Python 함수로 커스텀 평가 로직
3. **수동 평가**: Annotation Queue에서 사람이 직접 평가

### 7.2 자동 평가: LLM-as-Judge

#### 평가자 정의

```python
# evaluators/faithfulness.py
from langfuse import Langfuse
from openai import OpenAI

langfuse = Langfuse(
    public_key="pk-lf-xxx",
    secret_key="sk-lf-xxx",
    host="https://langfuse.example.com"
)

openai_client = OpenAI()

def evaluate_faithfulness(trace_id: str):
    """
    Faithfulness: 응답이 주어진 컨텍스트에 충실한가?
    """
    # Langfuse에서 Trace 조회
    trace = langfuse.get_trace(trace_id)

    # 필요한 정보 추출
    context = trace.input.get("context", "")
    response = trace.output.get("answer", "")

    # LLM-as-Judge 프롬프트
    judge_prompt = f"""
    Given the following context and response, evaluate if the response is faithful to the context.

    Context:
    {context}

    Response:
    {response}

    Rate faithfulness on a scale of 0-1, where:
    - 1.0: Completely faithful, all claims are supported by context
    - 0.5: Partially faithful, some claims lack support
    - 0.0: Not faithful, contains contradictions or unsupported claims

    Output only the numeric score.
    """

    # GPT-4를 Judge로 사용
    judge_response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": judge_prompt}],
        temperature=0.0
    )

    score = float(judge_response.choices[0].message.content.strip())

    # Langfuse에 Score 기록
    langfuse.score(
        trace_id=trace_id,
        name="faithfulness",
        value=score,
        comment=f"Evaluated by GPT-4 (Judge)"
    )

    return score
```

#### 평가 파이프라인 자동화

```python
# evaluation_pipeline.py
from langfuse import Langfuse
import time

langfuse = Langfuse(...)

def run_evaluation_pipeline():
    """
    새로운 Trace에 대해 자동 평가 실행
    """
    while True:
        # 평가되지 않은 Trace 조회
        traces = langfuse.get_traces(
            filter={"scores.faithfulness": {"$exists": False}},
            limit=100
        )

        for trace in traces:
            try:
                # 평가 실행
                evaluate_faithfulness(trace.id)
                evaluate_relevancy(trace.id)
                evaluate_toxicity(trace.id)

                print(f"Evaluated trace {trace.id}")
            except Exception as e:
                print(f"Error evaluating {trace.id}: {e}")

        # 10초마다 폴링
        time.sleep(10)

if __name__ == "__main__":
    run_evaluation_pipeline()
```

#### Kubernetes CronJob으로 배포

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: langfuse-evaluation
  namespace: genai
spec:
  schedule: "*/5 * * * *"  # 5분마다 실행
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: evaluator
            image: myregistry/langfuse-evaluator:latest
            env:
              - name: LANGFUSE_PUBLIC_KEY
                valueFrom:
                  secretKeyRef:
                    name: langfuse-keys
                    key: public-key
              - name: LANGFUSE_SECRET_KEY
                valueFrom:
                  secretKeyRef:
                    name: langfuse-keys
                    key: secret-key
              - name: LANGFUSE_HOST
                value: "https://langfuse.example.com"
              - name: OPENAI_API_KEY
                valueFrom:
                  secretKeyRef:
                    name: openai-secret
                    key: api-key
          restartPolicy: OnFailure
```

### 7.3 수동 평가: Annotation Queue

Langfuse Annotation Queue는 사람의 피드백을 수집하는 워크플로우를 제공합니다.

#### Annotation Queue 생성

```python
from langfuse import Langfuse

langfuse = Langfuse(...)

# Queue 생성
queue = langfuse.create_annotation_queue(
    name="rag_quality_review",
    description="RAG 응답 품질 수동 검토",
    scoring_config={
        "categories": [
            {
                "name": "quality",
                "values": ["excellent", "good", "poor"]
            },
            {
                "name": "issues",
                "values": ["hallucination", "irrelevant", "incomplete", "none"]
            }
        ]
    }
)

# Trace를 Queue에 추가
langfuse.add_to_annotation_queue(
    queue_id=queue.id,
    trace_id="trace-xxx"
)
```

팀원들이 Langfuse UI에서 Queue를 열어 각 Trace를 검토하고 점수를 부여합니다.

### 7.4 Ragas 연동

Ragas는 RAG 시스템 전용 평가 프레임워크로, Langfuse와 통합하여 더 정교한 평가를 제공합니다.

자세한 내용은 [RAG Evaluation with Ragas](./ragas-evaluation.md) 문서를 참조하세요.

#### 간단한 Ragas + Langfuse 예시

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from langfuse import Langfuse

langfuse = Langfuse(...)

# Dataset 준비
dataset = {
    "question": ["What is the capital of France?"],
    "answer": ["The capital of France is Paris."],
    "contexts": [["France is a country in Europe. Its capital is Paris."]],
    "ground_truth": ["Paris"]
}

# Ragas 평가 실행
result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision]
)

# 결과를 Langfuse에 기록
for idx, row in result.iterrows():
    langfuse.score(
        trace_id=row["trace_id"],
        name="ragas_faithfulness",
        value=row["faithfulness"]
    )
    langfuse.score(
        trace_id=row["trace_id"],
        name="ragas_answer_relevancy",
        value=row["answer_relevancy"]
    )
```

### 7.5 평가 메트릭

| 메트릭 | 범위 | 설명 | 평가 방법 |
|--------|------|------|-----------|
| **Faithfulness** | 0-1 | 응답이 제공된 컨텍스트에 충실한가? | LLM-as-Judge |
| **Answer Relevancy** | 0-1 | 응답이 질문과 관련이 있는가? | Ragas (임베딩 유사도) |
| **Context Precision** | 0-1 | 검색된 컨텍스트가 질문과 관련이 있는가? | Ragas |
| **Context Recall** | 0-1 | Ground Truth가 검색된 컨텍스트에 포함되어 있는가? | Ragas |
| **Toxicity** | 0-1 | 응답에 유해한 내용이 포함되어 있는가? | Detoxify 라이브러리 |
| **Latency** | ms | 응답 생성 지연 시간 | 자동 수집 |
| **Cost** | USD | 요청당 비용 | 자동 계산 |

---

## 8. 비용 추적 및 최적화

### 8.1 프로바이더별 토큰 비용 자동 계산

Langfuse는 프로바이더별 가격표를 내장하고 있어 자동으로 비용을 계산합니다.

#### 가격표 커스터마이징

```python
from langfuse import Langfuse

langfuse = Langfuse(...)

# 커스텀 모델 가격 등록
langfuse.update_model_pricing(
    model="gpt-4o-custom",
    input_price_per_1k_tokens=0.005,
    output_price_per_1k_tokens=0.015
)
```

#### 비용 계산 예시

```python
# Trace 생성 시 비용 자동 계산
trace = langfuse.trace(
    name="rag_query",
    input={"question": "What is RAG?"},
    metadata={"user_id": "user-123", "project": "chatbot-v2"}
)

generation = trace.generation(
    name="llm_call",
    model="gpt-4o",
    input="What is RAG?",
    output="RAG stands for Retrieval-Augmented Generation...",
    usage={
        "input": 1200,
        "output": 450
    }
)

# Langfuse가 자동으로 비용 계산:
# Cost = (1200 * $0.005 / 1000) + (450 * $0.015 / 1000) = $0.01275
```

### 8.2 팀/프로젝트별 비용 대시보드

Langfuse UI에서 다음 기준으로 비용을 집계할 수 있습니다:

- **프로젝트별**: `metadata.project`
- **팀별**: `metadata.team`
- **사용자별**: `metadata.user_id`
- **환경별**: `metadata.environment` (production, staging)

#### ClickHouse 쿼리로 커스텀 리포트

```sql
-- 일별 프로젝트별 비용
SELECT
    toDate(timestamp) as date,
    JSONExtractString(metadata, 'project') as project,
    SUM(calculated_total_cost) as total_cost,
    COUNT(*) as num_requests
FROM traces
WHERE timestamp >= today() - INTERVAL 30 DAY
GROUP BY date, project
ORDER BY date DESC, total_cost DESC;

-- 모델별 평균 비용
SELECT
    model,
    AVG(calculated_total_cost) as avg_cost,
    PERCENTILE_CONT(0.95)(calculated_total_cost) as p95_cost,
    COUNT(*) as num_requests
FROM traces
WHERE timestamp >= today() - INTERVAL 7 DAY
GROUP BY model
ORDER BY avg_cost DESC;
```

### 8.3 비용 알림 설정

#### Prometheus + Alertmanager 연동

```yaml
# langfuse-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: langfuse
  namespace: genai
spec:
  selector:
    matchLabels:
      app: langfuse
  endpoints:
    - port: metrics
      interval: 30s

---
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: langfuse-cost-alerts
  namespace: genai
spec:
  groups:
    - name: langfuse_cost
      interval: 5m
      rules:
        - alert: HighDailyCost
          expr: sum(increase(langfuse_cost_total[1d])) > 500
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Daily LLM cost exceeded $500"
            description: "Total cost in the last 24h: ${{ $value }}"

        - alert: UnexpectedCostSpike
          expr: rate(langfuse_cost_total[5m]) > 2 * rate(langfuse_cost_total[1h] offset 1h)
          for: 10m
          labels:
            severity: critical
          annotations:
            summary: "LLM cost spike detected"
            description: "Cost rate is 2x higher than 1 hour ago"
```

#### Slack 알림

```python
# cost_monitor.py
import requests
from langfuse import Langfuse

langfuse = Langfuse(...)
SLACK_WEBHOOK = "https://hooks.slack.com/services/xxx"

def check_daily_cost():
    # 오늘 총 비용 조회
    today_cost = langfuse.get_daily_cost()

    if today_cost > 500:
        requests.post(SLACK_WEBHOOK, json={
            "text": f"Warning: Today's LLM cost is ${today_cost:.2f} (threshold: $500)"
        })
```

### 8.4 Cascade Routing과 연계한 비용 최적화

Bifrost Gateway의 Cascade Routing과 연계하여 비용을 최적화할 수 있습니다:

1. **첫 번째 시도**: 저비용 모델 (gpt-4o-mini)
2. **실패 시**: 고성능 모델로 Fallback (gpt-4o)
3. **Langfuse 추적**: 각 시도를 Span으로 기록하여 비용 효과 분석

```python
from bifrost import BifrostClient
from langfuse import Langfuse

bifrost = BifrostClient(...)
langfuse = Langfuse(...)

trace = langfuse.trace(name="cascade_routing_query")

# 1차 시도: gpt-4o-mini
with trace.span(name="attempt_1", metadata={"model": "gpt-4o-mini"}):
    response = bifrost.complete(
        model="gpt-4o-mini",
        prompt="Summarize this document..."
    )

    if response.quality_score < 0.7:
        # 2차 시도: gpt-4o
        with trace.span(name="attempt_2", metadata={"model": "gpt-4o"}):
            response = bifrost.complete(
                model="gpt-4o",
                prompt="Summarize this document..."
            )

# 비용 비교 분석
print(f"Total cost: ${trace.calculated_total_cost:.4f}")
print(f"Attempts: {trace.span_count}")
```

Langfuse 대시보드에서 "Cascade Routing 성공률"과 "평균 비용 절감액"을 시각화할 수 있습니다.

---

## 9. 시나리오별 추천

| 시나리오 | 추천 솔루션 | 이유 |
|----------|-------------|------|
| **LangChain/LangGraph 중심 개발** | LangSmith | - LangChain 네이티브 통합<br/>- 코드 한 줄로 전체 체인 추적<br/>- Hub에서 프롬프트 템플릿 공유 |
| **데이터 주권 필수 (금융/의료)** | Langfuse (셀프호스트) | - 모든 데이터를 자체 인프라에 저장<br/>- GDPR/HIPAA 컴플라이언스<br/>- 무제한 트레이스 |
| **빠른 시작 (MVP/PoC)** | Helicone | - URL 변경만으로 즉시 추적<br/>- Gateway 기능 내장<br/>- 설정 복잡도 최소 |
| **프롬프트 엔지니어링 팀 운영** | Langfuse | - 강력한 프롬프트 버전 관리<br/>- A/B 테스트 지원<br/>- Dataset + 자동 평가 파이프라인 |
| **엔터프라이즈 하이브리드** | Bifrost (Gateway) + Langfuse (Observability) | - Gateway와 Observability 책임 분리<br/>- 멀티 프레임워크 지원<br/>- 독립적 스케일링 |
| **풀스택 GenAI 플랫폼** | kgateway + Bifrost + Langfuse + Ragas | - Kong으로 API 관리<br/>- Bifrost로 LLM 라우팅<br/>- Langfuse로 추적<br/>- Ragas로 품질 평가 |
| **대규모 트래픽 (월 1000만+ 트레이스)** | Langfuse (셀프호스트) + ClickHouse 클러스터 | - 수평 확장 가능<br/>- 비용 효율 (플랜 제한 없음)<br/>- 고속 분석 쿼리 |
| **멀티 클라우드 환경** | Langfuse (셀프호스트) | - 각 클라우드에 독립 배포<br/>- 중앙 집중식 대시보드 통합 |

---

## 10. 요약 및 다음 단계

### 10.1 핵심 요약

1. **LLMOps Observability는 필수**: 전통적 APM은 LLM 워크로드의 토큰 비용, 프롬프트 품질, 체인 추적을 지원하지 못합니다.

2. **3대 솔루션 비교**:
   - **Langfuse**: 오픈소스, 셀프호스트, 강력한 평가 파이프라인
   - **LangSmith**: LangChain 최적화, 관리형, 빠른 시작
   - **Helicone**: Proxy 기반, Gateway + Observability 통합, 초간단 설정

3. **하이브리드 아키텍처 추천**: Bifrost (Gateway) + Langfuse (Observability) 조합이 엔터프라이즈 환경에 최적

4. **OpenTelemetry 통합**: 기존 APM과 LLMOps Observability를 통합 대시보드로 연결

5. **평가 파이프라인**: LLM-as-Judge, Ragas, Annotation Queue를 활용한 자동/수동 품질 평가

6. **비용 최적화**: 프로바이더별 토큰 비용 자동 계산, 팀/프로젝트별 대시보드, Cascade Routing 연계

### 10.2 다음 단계

#### 즉시 시작 (1-2일)
- [ ] Helicone으로 빠른 PoC 구축 (URL 변경만)
- [ ] 기본 Tracing 대시보드 확인
- [ ] 토큰 비용 추적 확인

#### 단기 (1-2주)
- [ ] Langfuse 셀프호스트 배포 (EKS + RDS Aurora)
- [ ] LangChain/LlamaIndex SDK 통합
- [ ] OpenTelemetry 연동 (기존 APM과 통합)
- [ ] 프롬프트 버전 관리 시작

#### 중기 (1-2개월)
- [ ] ClickHouse 연동 (대규모 분석 쿼리)
- [ ] 자동 평가 파이프라인 구축 (LLM-as-Judge)
- [ ] Ragas 연동 (RAG 품질 평가)
- [ ] Dataset 관리 및 회귀 테스트 자동화

#### 장기 (3개월+)
- [ ] Bifrost Gateway와 통합 (하이브리드 아키텍처)
- [ ] Annotation Queue로 RLHF 데이터 수집
- [ ] 비용 알림 및 자동 최적화
- [ ] 멀티 클라우드 배포 (중앙 집중식 대시보드)

### 10.3 체크리스트

배포 전 필수 체크 항목:

- [ ] **인프라**: RDS Aurora, ClickHouse, Redis 준비
- [ ] **보안**: Ingress TLS 인증서, NextAuth 시크릿 생성
- [ ] **스케일링**: HPA 설정, ClickHouse 클러스터 크기 결정
- [ ] **백업**: PostgreSQL 백업 정책, ClickHouse 스냅샷
- [ ] **모니터링**: Prometheus, Grafana 연동
- [ ] **비용 알림**: 일일 예산 초과 알림 설정
- [ ] **평가 파이프라인**: 자동 평가자 CronJob 배포
- [ ] **문서화**: 팀원 온보딩 가이드 작성

---

## 11. 참고 자료

### 공식 문서
- [Langfuse Documentation](https://langfuse.com/docs)
- [LangSmith Documentation](https://docs.smith.langchain.com)
- [Helicone Documentation](https://docs.helicone.ai)
- [OpenTelemetry LLM Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Ragas Documentation](https://docs.ragas.io)

### 관련 문서
- [Bifrost Gateway 구성 가이드](../gateway-agents/llm-gateway-architecture.md)
- [kgateway 기반 Kong API Gateway 통합](../gateway-agents/inference-gateway-routing.md)
- [RAG Evaluation with Ragas](./ragas-evaluation.md)
- [Cascade Routing 전략](../gateway-agents/llm-gateway-architecture.md)

### GitHub 리포지토리
- [Langfuse](https://github.com/langfuse/langfuse)
- [Langfuse Helm Chart](https://github.com/langfuse/langfuse-helm)
- [LangChain](https://github.com/langchain-ai/langchain)
- [Ragas](https://github.com/explodinggradients/ragas)

### 블로그 및 아티클
- [Why LLM Observability is Different](https://langfuse.com/blog/llm-observability)
- [Building a Cost-Effective LLMOps Pipeline](https://www.langchain.com/blog/cost-effective-llmops)
- [Evaluating RAG Systems with Ragas](https://blog.langchain.dev/evaluating-rag-pipelines-with-ragas-langsmith/)

### 커뮤니티
- [Langfuse Discord](https://discord.gg/langfuse)
- [LangChain Discord](https://discord.gg/langchain)
- [GenAI Observability Slack](https://genai-observability.slack.com)

---

**마지막 업데이트**: 2026-03-16
**작성자**: devfloor9
**문서 버전**: 1.0
