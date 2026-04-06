---
title: "추론 게이트웨이 & LLM Gateway 아키텍처"
sidebar_label: "추론 게이트웨이"
description: "kgateway + Bifrost/LiteLLM 2-Tier 아키텍처, Cascade Routing, Semantic Caching, agentgateway"
tags: [kgateway, bifrost, litellm, gateway-api, agentgateway, cascade-routing, semantic-caching, vllm-semantic-router]
sidebar_position: 1
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

# 추론 게이트웨이 & LLM Gateway 아키텍처

> 작성일: 2025-02-05 | 수정일: 2026-04-06 | 읽는 시간: 약 15분

## 개요

대규모 AI 모델 서빙 환경에서는 **인프라 트래픽 관리**와 **LLM 프로바이더 추상화**를 분리해야 합니다. 단일 Gateway는 복잡성이 급증하고 각 레이어 최적화가 어렵습니다.

**2-Tier Gateway 아키텍처**:
- **L1 (Ingress Gateway)**: kgateway — Kubernetes Gateway API 표준, 트래픽 라우팅, mTLS, rate limiting
- **L2-A (Inference Gateway)**: Bifrost/LiteLLM — 프로바이더 통합, cascade routing, semantic caching
- **L2-B (Data Plane)**: agentgateway — MCP/A2A 프로토콜, stateful 세션 관리

각 티어는 독립적으로 관리되며, 인프라와 AI 워크로드를 분리합니다.

---

## 2-Tier Gateway 아키텍처

### Gateway 계층 구분

LLM 추론 플랫폼은 **3가지 서로 다른 Gateway 역할**을 명확히 구분해야 합니다:

| Gateway 유형 | 역할 | 구현체 | 위치 |
|-------------|------|-------|------|
| **Ingress Gateway** | 외부 트래픽 수신, TLS 종료, 경로 기반 라우팅 | kgateway (NLB 연동) | Tier 1 |
| **Inference Gateway** | 모델 선택, 지능형 라우팅, 요청 캐스케이딩 | Bifrost / LiteLLM | Tier 2-A |
| **Data Plane** | MCP/A2A 프로토콜, stateful 세션, 도구 라우팅 | agentgateway | Tier 2-B |

```mermaid
graph LR
    Client[클라이언트] --> IGW[Ingress Gateway<br/>kgateway NLB<br/>TLS 종료]
    IGW -->|복잡도 분석| IFG[Inference Gateway<br/>Bifrost / LiteLLM<br/>모델 선택]
    IFG -->|복잡| LLM[GLM-5 744B<br/>Reasoning]
    IFG -->|단순| SLM[Qwen3-Coder 3B<br/>빠른 응답]
    IGW -->|MCP/A2A| AGW[agentgateway<br/>세션 관리<br/>도구 라우팅]
    
    style IGW fill:#326ce5,stroke:#333,color:#fff
    style IFG fill:#e53935,stroke:#333,color:#fff
    style AGW fill:#ff9900,stroke:#333,color:#000
    style LLM fill:#76b900,stroke:#333,color:#000
    style SLM fill:#ffd93d,stroke:#333,color:#000
```

**핵심 원칙:**
- **Ingress Gateway (kgateway)**: 네트워크 레벨 트래픽 제어만 담당. 모델 선택 로직은 포함하지 않음
- **Inference Gateway (Bifrost/LiteLLM)**: 요청 복잡도 분석 → 적절한 모델 자동 선택 → 비용 최적화
- **Data Plane (agentgateway)**: AI 전용 프로토콜 (MCP/A2A) 처리, stateful 세션 유지

### 전체 구조

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

### Tier별 역할 분리

| Tier | 컴포넌트 | 책임 | 프로토콜 |
|------|----------|------|----------|
| **Tier 1** | kgateway (Envoy 기반) | 트래픽 라우팅, mTLS, rate limiting, 네트워크 정책 | HTTP/HTTPS, gRPC |
| **Tier 2-A** | Bifrost / LiteLLM | 지능형 모델 선택, 비용 추적, request cascading, semantic caching | OpenAI-compatible API |
| **Tier 2-B** | agentgateway | MCP/A2A 세션 관리, 자체 추론 인프라 라우팅, Tool Poisoning 방지 | HTTP, JSON-RPC, MCP, A2A |

### 트래픽 플로우

**외부 LLM**: Client → kgateway → Bifrost/LiteLLM (Cascade + Cache) → OpenAI → 응답 + 비용 기록
**자체 vLLM**: Client → kgateway → agentgateway → vLLM → 응답

---

## kgateway (L1 Inference Gateway)

### Gateway API 기반 라우팅

kgateway는 Kubernetes Gateway API 표준을 구현하여 벤더 중립적인 설정이 가능합니다.

import { ComponentStructureTable } from '@site/src/components/InferenceGatewayTables';

<ComponentStructureTable />

Gateway API v1.2.0+는 HTTPRoute 개선, GRPCRoute 안정화, BackendTLSPolicy를 제공하며 kgateway v2.0+는 이를 완전히 지원합니다.

### Dynamic Routing 개념

| 라우팅 유형 | 기준 | 사용 사례 |
|------------|------|----------|
| **헤더 기반** | `x-model-id`, `x-provider` | 모델/프로바이더별 백엔드 선택 |
| **경로 기반** | `/v1/chat/completions`, `/v1/embeddings` | API 유형별 서비스 분리 |
| **가중치 기반** | backendRef weight | 카나리 배포, A/B 테스트 |
| **복합 조건** | 헤더 + 경로 + 티어 | 프리미엄/일반 고객별 백엔드 |

카나리 배포는 5-10% 트래픽으로 시작하여 점진적으로 증가시키며, 문제 발생 시 weight=0으로 즉시 롤백합니다.

### 로드 밸런싱 전략

| 전략 | 설명 | 적합 시나리오 |
|------|------|--------------|
| **Round Robin** | 순차적 분배 (기본값) | 균일한 모델 인스턴스 |
| **Random** | 무작위 분배 | 대규모 백엔드 풀 |
| **Consistent Hash** | 동일 키 → 동일 백엔드 | KV Cache 재활용, 세션 유지 |

Consistent Hash는 LLM 추론에서 특히 유용합니다. 동일 사용자의 요청을 같은 vLLM 인스턴스로 라우팅하면 prefix cache 적중률이 높아져 TTFT(Time to First Token)를 크게 개선할 수 있습니다.

### Topology-Aware Routing (Kubernetes 1.33+)

Kubernetes 1.33+의 topology-aware routing을 활용하면 동일 AZ 내 Pod 간 통신을 우선시하여 크로스 AZ 데이터 전송 비용을 절감합니다.

import { TopologyEffectsTable } from '@site/src/components/InferenceGatewayTables';

<TopologyEffectsTable />

### 장애 대응 개념

| 메커니즘 | 설명 | LLM 추론 고려사항 |
|----------|------|-------------------|
| **타임아웃** | 요청별 최대 처리 시간 제한 | LLM 긴 응답 생성 시 수십 초 소요. 충분한 타임아웃 필요 (120s+) |
| **재시도** | 5xx, 타임아웃, 연결 실패 시 자동 재시도 | 최대 3회 제한. 무한 재시도는 시스템 과부하 유발 |
| **서킷 브레이커** | 연속 실패 시 백엔드 일시 차단 | `maxEjectionPercent` 50% 이하로 설정하여 최소 절반의 백엔드 가용 보장 |

스트리밍 응답 시 `backendRequest` 타임아웃은 첫 바이트까지, `request`는 전체 요청 시간입니다. POST 재시도는 멱등성 보장 필요 (도구 호출 주의).

---

## LLM Gateway 솔루션 비교

### 주요 솔루션 비교 표

| 솔루션 | 언어 | 주요 특징 | Cascade Routing | 라이선스 | 적합 환경 |
|--------|------|-----------|-----------------|----------|-----------|
| **Bifrost** | Go/Rust | 50x faster, CEL Rules 조건부 라우팅, failover | CEL Rules + 외부 classifier | Apache 2.0 | 고성능, 저비용, 셀프호스트 |
| **LiteLLM** | Python | 100+ 프로바이더, complexity-based routing 네이티브 | `routing_strategy: complexity-based` | MIT | Python 생태계, 빠른 프로토타이핑 |
| **vLLM Semantic Router** | Python | vLLM 전용, 경량 임베딩 기반 라우팅 | 임베딩 유사도 기반 | Apache 2.0 | vLLM 단독 환경 |
| **Portkey** | TypeScript | SOC2 인증, semantic caching, Virtual Keys | 지원 | Proprietary + OSS | 엔터프라이즈, 규정 준수 |
| **Kong AI Gateway** | Lua/C | MCP 지원, 기존 Kong 인프라 활용 | 플러그인 | Apache 2.0 / Enterprise | 기존 Kong 사용자 |
| **Helicone** | Rust | Gateway + Observability 통합, 고성능 | 지원 | Apache 2.0 | 고성능 + 관측성 동시 필요 |

### Bifrost vs LiteLLM

**Bifrost**: Go/Rust 구현으로 Python 대비 50배 빠른 throughput, 1/10 메모리 사용. CEL Rules로 조건부 라우팅 (헤더 기반 cascade, failover) 구현 가능. Helm Chart 배포, OpenAI 호환 API. 프록시 레이턴시 100us 미만. 지능형 cascade는 App에서 complexity score 계산 → `x-complexity-score` 헤더 → CEL rule 분기 패턴 또는 Go Plugin으로 구현.

**LiteLLM**: 100+ 프로바이더 지원, **complexity-based routing 네이티브** (`routing_strategy: complexity-based` 설정 1줄로 활성화), Langfuse 한 줄 연동 (`success_callback: ["langfuse"]`), LangChain/LlamaIndex 직접 통합. 단, Python 기반으로 낮은 throughput, 높은 메모리 사용량.

### 선택 기준

| 사용 사례 | 권장 솔루션 | 이유 |
|-----------|-----------|------|
| 지능형 cascade (편의성 우선) | **LiteLLM** | Complexity-based routing 네이티브, 설정 1줄 |
| 지능형 cascade (성능 우선) | **Bifrost** | CEL Rules + 외부 classifier, 50x 빠름 |
| vLLM 단독 환경 | **vLLM Semantic Router** | vLLM 네이티브, 경량 라우팅 |
| 고성능, 저비용 셀프호스트 | **Bifrost** | 50x 빠른 처리, 저메모리 |
| Python 생태계 (LangChain) | **LiteLLM** | 네이티브 통합, 100+ 프로바이더 |
| 엔터프라이즈 규정 준수 | **Portkey** | SOC2/HIPAA/GDPR, Semantic Cache |
| 고성능 + 관측성 통합 | **Helicone** | Rust 기반 All-in-one |

### 시나리오별 추천 조합

| 시나리오 | 추천 조합 | 이유 |
|----------|----------|------|
| **스타트업/PoC** | kgateway + LiteLLM | 저비용, 10분 배포, complexity routing 1줄 |
| **셀프호스트 중심 (성능)** | kgateway + Bifrost (CEL cascade) + agentgateway | 고성능, 외부+자체 풀 2-Tier |
| **엔터프라이즈 멀티 프로바이더** | kgateway + Portkey + Langfuse | 규정 준수, 250+ 프로바이더 |
| **하이브리드 (외부+자체)** | kgateway + Bifrost/LiteLLM + agentgateway | 외부는 Bifrost/LiteLLM, 자체는 agentgateway |
| **글로벌 배포** | Cloudflare AI Gateway + kgateway | Edge caching, DDoS 방어 |

---

## Request Cascading: 지능형 모델 라우팅

### 개념

**Request Cascading**은 요청 복잡도를 자동 분석하여 적절한 모델로 라우팅하는 지능형 최적화 기법입니다. 간단한 질의는 저렴하고 빠른 모델로, 복잡한 reasoning은 강력한 모델로 자동 분배하여 비용과 지연을 동시에 개선합니다. IDE는 단일 엔드포인트만 사용하고, 모델 선택은 플랫폼 레벨에서 중앙 통제합니다.

### Cascading 패턴 3가지

| 패턴 | 설명 | 구현 | 사용 사례 |
|------|------|------|----------|
| **1. Weight 기반** | 고정 비율로 트래픽 분배 | Bifrost `weights: [0.7, 0.3]` | A/B 테스트, 점진적 모델 마이그레이션 |
| **2. Fallback 기반** | 오류 시 다른 모델로 자동 전환 | Bifrost `fallback: true` | 가용성 향상, rate limit 회피 |
| **3. 지능형 라우팅** | 요청 분석 후 자동 모델 선택 | LiteLLM/Bifrost/vLLM Semantic Router | 비용 최적화, 품질 유지 |

```mermaid
flowchart TB
    Q[User Query]
    
    subgraph P1["패턴 1: Weight 기반"]
        W1[70% → Cheap]
        W2[30% → Premium]
    end
    
    subgraph P2["패턴 2: Fallback 기반"]
        F1[Primary Model]
        F2{5xx/Timeout?}
        F3[Fallback Model]
    end
    
    subgraph P3["패턴 3: 지능형 라우팅"]
        R1[Complexity Router]
        R2{복잡도 분석}
        R3[Strong Model]
        R4[Weak Model]
    end
    
    Q --> P1 & P2 & P3
    
    F1 --> F2
    F2 -->|Yes| F3
    
    R1 --> R2
    R2 -->|복잡| R3
    R2 -->|단순| R4
    
    style P1 fill:#ffd93d,stroke:#333
    style P2 fill:#ff9900,stroke:#333
    style P3 fill:#e53935,stroke:#333,color:#fff
```

### 지능형 Cascade Routing 구현 방법

지능형 cascade routing은 요청 복잡도를 분석하여 적절한 모델로 자동 라우팅합니다. 구현 방법은 크게 3가지입니다:

#### 접근 A: LiteLLM 네이티브 (편의성 우선)

LiteLLM은 **complexity-based routing**을 네이티브로 지원합니다. 설정 파일에 1줄만 추가하면 자동으로 요청 복잡도를 분석하여 모델을 선택합니다.

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
  routing_strategy: complexity-based  # 이 1줄로 활성화
  complexity_threshold: 0.7           # 0.7 이상 → 강력한 모델
```

**장점**: 설정 1줄로 활성화, 프롬프트 길이·코드 포함 여부·추론 키워드 자동 분석
**단점**: Python 기반 낮은 throughput, 복잡도 알고리즘 커스터마이징 불가

#### 접근 B: Bifrost CEL Rules + 외부 Classifier (성능 우선)

Bifrost는 **CEL (Common Expression Language) Rules**를 사용하여 헤더 기반 조건부 라우팅을 수행합니다. 복잡도 분석은 **애플리케이션 레벨**에서 수행하고, 결과를 `x-complexity-score` 헤더로 전달하면 Bifrost가 CEL rule로 모델을 선택합니다.

```yaml
# Bifrost 설정 (config.yaml)
routes:
  - path: /v1/chat/completions
    rules:
      - condition: 'request.headers["x-complexity-score"] > 0.7'
        backend: gpt-4-turbo
      - condition: 'request.headers["x-complexity-score"] <= 0.7'
        backend: gpt-3.5-turbo
    fallback: gpt-4-turbo  # CEL rule 실패 시
```

애플리케이션에서 복잡도 점수를 계산하여 헤더로 전달:

```python
# 클라이언트 코드 (예: Python)
import openai

def calculate_complexity(prompt: str) -> float:
    # 간단한 휴리스틱 (실전에서는 ML 모델 사용)
    score = 0.0
    if len(prompt) > 500: score += 0.3
    if "explain" in prompt or "analyze" in prompt: score += 0.4
    if "```" in prompt: score += 0.3  # 코드 포함
    return min(score, 1.0)

prompt = "Analyze this complex algorithm and explain..."
complexity_score = calculate_complexity(prompt)

response = openai.ChatCompletion.create(
    model="auto",  # Bifrost가 실제 모델 선택
    messages=[{"role": "user", "content": prompt}],
    headers={"x-complexity-score": str(complexity_score)}
)
```

**장점**: 50x 빠른 throughput, 복잡도 알고리즘 완전 제어, Go/Rust 성능
**단점**: 애플리케이션 레벨 classifier 개발 필요 (단, 간단한 휴리스틱으로도 충분한 경우 많음)

#### 접근 C: Bifrost Go Plugin (완전 통합)

Bifrost는 Go Plugin을 통해 **Gateway 내부에서 직접 복잡도 분석**을 수행할 수 있습니다. `PreLLMHook` 인터페이스를 구현하여 요청을 가로채고, 복잡도를 분석한 뒤 적절한 백엔드로 라우팅합니다.

```go
// complexity_plugin.go (Bifrost Plugin)
package main

import (
    "strings"
    "github.com/bifrost/sdk"
)

type ComplexityRouter struct{}

func (c *ComplexityRouter) PreLLMHook(req *sdk.LLMRequest) (*sdk.RouteDecision, error) {
    score := c.analyzeComplexity(req.Prompt)
    
    if score > 0.7 {
        return &sdk.RouteDecision{Backend: "gpt-4-turbo"}, nil
    }
    return &sdk.RouteDecision{Backend: "gpt-3.5-turbo"}, nil
}

func (c *ComplexityRouter) analyzeComplexity(prompt string) float64 {
    score := 0.0
    if len(prompt) > 500 { score += 0.3 }
    if strings.Contains(prompt, "explain") { score += 0.4 }
    if strings.Contains(prompt, "```") { score += 0.3 }
    return score
}

func main() {
    sdk.RegisterPlugin(&ComplexityRouter{})
}
```

**장점**: Gateway 레벨 통합, 클라이언트 수정 불필요, 고성능
**단점**: Go 플러그인 개발 필요, Bifrost 전용

#### 접근 D: vLLM Semantic Router (vLLM 전용)

vLLM 환경에서는 **vLLM Semantic Router**를 사용하여 경량 임베딩 기반 라우팅을 수행할 수 있습니다. 사전 정의된 "카테고리"에 임베딩을 매칭하여 모델을 선택합니다.

```python
# vLLM Semantic Router 설정
from vllm import SemanticRouter

router = SemanticRouter(
    categories={
        "simple": ["basic question", "quick answer", "definition"],
        "complex": ["explain in detail", "analyze", "step by step"]
    },
    models={
        "simple": "qwen3-coder-3b",
        "complex": "glm-5-744b"
    },
    threshold=0.85
)

# 자동 라우팅
response = router.route(prompt="Explain the architecture...")  # → glm-5-744b
```

**장점**: vLLM 네이티브, 경량 임베딩 사용 (추론 지연 < 5ms), 설정 간단
**단점**: vLLM 전용, 카테고리 사전 정의 필요

### Hybrid Routing 패턴 (Rule-based + ML-based)

실전에서는 **Rule-based Fast Path (80%)** + **ML-based Slow Path (20%)** 조합이 효과적입니다. 간단한 휴리스틱으로 대부분을 처리하고, 애매한 케이스만 ML 모델로 분류합니다.

```yaml
# LiteLLM Hybrid Routing 예시
router_settings:
  routing_strategy: hybrid
  
  # Fast Path: 간단한 규칙 (80% 트래픽)
  fast_rules:
    - condition: 'len(prompt) < 100'
      model: gpt-3.5-turbo
    - condition: '"code" in prompt or "```" in prompt'
      model: gpt-4o
  
  # Slow Path: ML 분류 (20% 트래픽)
  ml_classifier:
    model: complexity-classifier  # 경량 BERT 모델
    threshold: 0.7
    fallback: gpt-4-turbo
```

**장점**: 80% 요청은 즉시 처리 (< 1ms 오버헤드), 20%만 ML 추론 (5-10ms)
**효과**: 평균 레이턴시 < 2ms, 비용 절감 ~70%

### Cascade Routing 전략 (Fallback 기반)

복잡도에 따라 **cheap -> medium -> premium** 모델을 단계적으로 시도합니다. Fallback 조건: HTTP 5xx, Rate Limit 초과, Timeout, Quality Score < 0.7 (옵션). 복잡도 분류: 토큰 < 100 → Cheap (GPT-3.5), < 500 → Cheap+ (Haiku), < 1500 또는 코드 포함 → Medium (GPT-4o), > 1500 → Premium (GPT-4 Turbo).

### 비용 절감 효과

일 10,000 요청 시나리오: Simple(50% GPT-3.5 $2.5) + Medium(30% Haiku $2.4) + Complex(15% GPT-4o $3.75) + Very Complex(5% GPT-4 Turbo $5) = **$13.65/일**. 모든 요청을 GPT-4 Turbo로 처리 시 $50/일 대비 **73% 절감**.

### 엔터프라이즈 모델 라우팅 패턴

**구현 위치 우선순위**: Gateway > IDE > 클라이언트

| 위치 | 장점 | 적합 환경 |
|------|------|----------|
| **Gateway (Bifrost/LiteLLM)** | 중앙 통제, 정책 일관성 | 엔터프라이즈 **(권장)** |
| **IDE (Claude Code)** | 컨텍스트 인식 | 개발 도구 벤더 |
| **클라이언트 (SDK)** | 유연성 높음 | 프로토타입 |

**실전 권장**: LiteLLM 또는 Bifrost를 Inference Gateway에 배포하여 중앙에서 라우팅. 개발자는 단일 엔드포인트만 사용, 플랫폼 팀이 정책 관리.

---

## 연구 참조: RouteLLM

**RouteLLM**은 LMSYS가 개발한 오픈소스 LLM 라우팅 프레임워크입니다. 경량 분류 모델(Matrix Factorization)이 요청을 분석하여 strong/weak 모델을 자동으로 선택합니다.

```mermaid
graph TD
    Req[요청] --> Router[Complexity Router<br/>분류 모델]
    Router -->|복잡도 > 0.7<br/>복잡한 추론 필요| LLM[Strong Model<br/>GLM-5 744B<br/>Reasoning]
    Router -->|복잡도 ≤ 0.7<br/>단순 응답| SLM[Weak Model<br/>Qwen3-Coder 3B<br/>빠른 응답]
    LLM --> Resp[응답]
    SLM --> Resp
    
    style Router fill:#326ce5,stroke:#333,color:#fff
    style LLM fill:#e53935,stroke:#333,color:#fff
    style SLM fill:#76b900,stroke:#333,color:#000
```

| 항목 | 설명 |
|------|------|
| **분류 모델** | Matrix Factorization (MF) — 경량 임베딩 기반 복잡도 예측 |
| **입력** | 사용자 프롬프트 + 대화 히스토리 |
| **출력** | Strong/Weak 선택 결정 + 신뢰도 점수 |
| **지연** | 추가 지연 < 10ms (분류 모델 추론 시간) |
| **정확도** | LMSYS Chatbot Arena 데이터 기반 학습, 90%+ 정확도 |

:::warning RouteLLM 프로덕션 배포 주의
RouteLLM은 연구 프로젝트로, 프로덕션 직접 배포는 권장하지 않습니다. MF classifier 개념은 유용하지만, 실전에서는 **LiteLLM complexity routing** (네이티브 지원) 또는 **Bifrost CEL Rules** (고성능)를 사용하는 것이 더 안정적입니다.
:::

상세 배포 코드는 [게이트웨이 구성 가이드](../reference-architecture/inference-gateway-setup.md)를 참조하세요.

---

## Gateway API Inference Extension

Kubernetes Gateway API는 **Inference Extension**을 통해 LLM 추론을 쿠버네티스 네이티브 리소스로 관리할 수 있게 합니다.

### 핵심 CRD (Custom Resource Definitions)

| CRD | 역할 | 예시 |
|-----|------|------|
| **InferenceModel** | 모델별 서빙 정책 정의 (criticality, 라우팅 규칙) | `criticality: high` → 전용 GPU 할당 |
| **InferencePool** | 모델 서빙 Pod 그룹 (vLLM replicas) | `replicas: 3` → 3개 vLLM 인스턴스 |
| **LLMRoute** | 요청을 InferenceModel로 라우팅하는 규칙 | `x-model-id: glm-5` → GLM-5 Pool |

상세 YAML 매니페스트는 [게이트웨이 구성 가이드](../reference-architecture/inference-gateway-setup.md)를 참조하세요.

### Gateway API Inference Extension 통합

Gateway API Inference Extension은 **kgateway + llm-d EPP**와 연동하여 쿠버네티스 네이티브 추론 라우팅을 제공합니다:

```mermaid
graph TB
    Client[클라이언트] --> Gateway[kgateway]
    Gateway --> LLMRoute[LLMRoute CRD<br/>라우팅 규칙]
    LLMRoute --> Pool1[InferencePool<br/>GLM-5]
    LLMRoute --> Pool2[InferencePool<br/>Qwen3]
    Pool1 --> LLMD1[llm-d EPP<br/>Disaggregated]
    Pool2 --> VLLM[vLLM<br/>Aggregated]
    
    style Gateway fill:#326ce5,stroke:#333,color:#fff
    style LLMRoute fill:#e53935,stroke:#333,color:#fff
    style Pool1 fill:#ff9900,stroke:#333
    style Pool2 fill:#ffd93d,stroke:#333
```

**현재 상태**: CNCF 프로젝트로 활발히 개발 중입니다. Kubernetes 1.34+에서 alpha 제공 예정이며, 현재 프로덕션 사용은 권장하지 않습니다. 실전 배포는 [Reference Architecture](../reference-architecture/) 가이드를 참조하세요.

---

## Semantic Caching

### 개념

Semantic Caching은 **의미적으로 유사한 프롬프트**를 감지하여 이전 응답을 재사용함으로써 LLM API 비용을 절감합니다. 임베딩 기반 유사도 매칭 (threshold > 0.85)을 사용하여 Cache HIT 시 LLM 호출을 건너뜁니다.

### 유사도 임계값 (Similarity Threshold)

| Threshold | 의미 | 캐시 적중률 | 정확도 |
|-----------|------|-------------|--------|
| **0.95+** | 거의 동일한 문장 | 낮음 (~10%) | 매우 높음 |
| **0.85-0.94** | 의미가 같고 표현이 약간 다름 | 중간 (~30%) | 높음 **(권장)** |
| **0.75-0.84** | 유사한 주제 | 높음 (~50%) | 중간 (거짓 긍정 위험) |
| **0.70 이하** | 관련 있는 주제 | 매우 높음 | 낮음 (부적절한 응답 위험) |

**권장 설정**: **0.85** (의미는 같고 표현만 다른 경우 캐시 재사용)

### 비용 절감 효과

일 10,000 요청, 캐시 적중률 30%, GPT-4 Turbo 기준: 월 비용 $4,500 → $3,150 (30% 절감). 추가 비용 (임베딩 ~$0.5/월, Redis/Milvus ~$10-20/월) 포함 시 순 절감 ~$1,300/월 (29%).

**구현 옵션**: Portkey (내장 semantic cache), Helicone (Rust 기반 고성능), 자체 구현 (Redis + 임베딩). 상세 구성은 Reference Architecture 참조.

---

## agentgateway 데이터 플레인

### 개요

**agentgateway**는 kgateway의 AI 워크로드 전용 데이터 플레인입니다. 기존 Envoy는 stateless HTTP/gRPC에 최적화되어 있지만, AI 에이전트는 stateful JSON-RPC 세션, MCP 프로토콜, Tool Poisoning 방지 등 특수 요구사항을 가집니다.

### Envoy vs agentgateway 비교

| 항목 | Envoy 데이터 플레인 | agentgateway |
|------|---------------------|---------------------------|
| **세션 관리** | Stateless, HTTP 쿠키 기반 | Stateful JSON-RPC 세션, 인메모리 세션 스토어 |
| **프로토콜** | HTTP/1.1, HTTP/2, gRPC | MCP (Model Context Protocol), A2A (Agent-to-Agent) |
| **보안** | mTLS, RBAC | Tool Poisoning 방지, per-session Authorization |
| **라우팅** | 경로/헤더 기반 | 세션 ID 기반, 도구 호출 검증 |
| **관측성** | HTTP 메트릭, Access Log | LLM 토큰 추적, 도구 호출 체인, 비용 |

### 핵심 기능

#### 핵심 기능

**1. Stateful JSON-RPC 세션 관리**: `X-MCP-Session-ID` 헤더 기반 세션 추적, Sticky Session 라우팅, 비활성 세션 자동 정리 (기본 30분)

**2. MCP/A2A 프로토콜 네이티브 지원**: `/mcp/v1` (MCP 프로토콜), `/a2a/v1` (A2A 에이전트 통신) 경로 지원

**3. Tool Poisoning 방지**: 허용 도구 목록, 위험 도구 차단 (`exec_shell`, `read_credentials`), 응답 크기 제한, 무결성 검증 (SHA-256)

**4. Per-session Authorization**: JWT 토큰 검증, 역할 기반 도구 접근, 세션 하이재킹 방지

:::info agentgateway 프로젝트 현황
agentgateway는 2025년 말 kgateway 프로젝트에서 분리된 AI 전용 데이터 플레인으로, 현재 활발하게 개발 중입니다. MCP 프로토콜과 A2A 프로토콜의 빠른 발전에 맞춰 기능이 지속적으로 추가되고 있습니다.
:::

---

## 모니터링 & Observability

### 핵심 메트릭

AI 추론 게이트웨이에서 모니터링해야 하는 핵심 메트릭은 다음과 같습니다:

import { MonitoringMetricsTable } from '@site/src/components/InferenceGatewayTables';

<MonitoringMetricsTable />

| 메트릭 카테고리 | 주요 항목 | 의미 |
|----------------|----------|------|
| **레이턴시** | TTFT (Time to First Token) | 첫 번째 토큰 생성까지의 시간. 사용자 체감 응답성 |
| **처리량** | TPS (Tokens Per Second) | 초당 토큰 생성 수. 모델 서빙 효율성 |
| **에러율** | 5xx / 전체 요청 | 백엔드 장애 비율. 5% 초과 시 즉시 대응 |
| **캐시 적중률** | Cache Hit / 전체 요청 | Semantic Cache 효율성. 30% 이상 권장 |
| **비용** | 모델별 토큰 사용량 x 단가 | 실시간 비용 추적 |

### Langfuse OTel 연동

Bifrost/LiteLLM에서 Langfuse로 OTel trace를 전송하여 프롬프트/완료 내용, 토큰 사용량, 비용 분석, 도구 호출 체인을 추적합니다. Bifrost는 `otel` 플러그인, LiteLLM은 `success_callback: ["langfuse"]` 설정으로 활성화합니다. 상세 구성은 [모니터링 스택 설정](../reference-architecture/monitoring-observability-setup.md)을 참조하세요.

### 알림 규칙 권장

| 알림 | 조건 | 심각도 |
|------|------|--------|
| 높은 에러율 | 5xx > 5% (5분간) | Critical |
| 높은 레이턴시 | P99 > 30초 (5분간) | Warning |
| 서킷 브레이커 활성화 | circuit_breaker_open == 1 | Critical |
| 캐시 적중률 급락 | Cache hit < 30% | Warning |
| 예산 초과 임박 | Budget > 80% | Warning |

---

## 관련 문서

### 실전 배포 가이드

실제 코드 예시와 YAML 매니페스트는 Reference Architecture 섹션을 참조하세요:

- [게이트웨이 구성 가이드](../reference-architecture/inference-gateway-setup.md) - kgateway, Bifrost, agentgateway 설치 및 YAML 매니페스트
- [OpenClaw AI Gateway 배포](../reference-architecture/openclaw-ai-gateway.mdx) - OpenClaw + Bifrost + Hubble 실전 배포
- [커스텀 모델 배포](../reference-architecture/custom-model-deployment.md) - vLLM/llm-d 배포 가이드

### 비용 및 관측성

- [코딩 도구 & 비용 분석](../reference-architecture/coding-tools-cost-analysis.md) - Aider/Cline 연결, NLB 통합 라우팅 패턴
- [모니터링 스택 설정](../reference-architecture/monitoring-observability-setup.md) - Langfuse OTel 연동, Prometheus, Grafana 대시보드
- [LLMOps Observability](../operations-mlops/llmops-observability.md) - Langfuse/LangSmith 기반 LLM 관측성

### 관련 인프라

- [GPU 리소스 관리](../model-serving/gpu-resource-management.md) - 동적 리소스 할당 전략
- [llm-d 분산 추론](../model-serving/llm-d-eks-automode.md) - EKS Auto Mode 기반 분산 추론
- [Agent 모니터링](../operations-mlops/agent-monitoring.md) - Langfuse 통합 가이드

---

## 참고 자료

### 공식 문서

- [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/)
- [Gateway API Inference Extension (Proposal)](https://github.com/kubernetes-sigs/gateway-api/issues/2813)
- [kgateway 공식 문서](https://kgateway.dev/docs/)
- [agentgateway GitHub](https://github.com/kgateway-dev/agentgateway)
- [Bifrost 공식 문서](https://www.getmaxim.ai/bifrost/docs)
- [LiteLLM 공식 문서](https://docs.litellm.ai/)
- [LiteLLM Complexity Routing](https://docs.litellm.ai/docs/routing)
- [vLLM Semantic Router](https://github.com/vllm-project/semantic-router)

### LLM 프로바이더

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [AWS Bedrock](https://docs.aws.amazon.com/bedrock/)

### 관련 프로토콜

- [Model Context Protocol (MCP) Spec](https://modelcontextprotocol.io/specification)
- [Agent-to-Agent (A2A) Protocol](https://github.com/a2a-protocol/spec)

### 연구 자료 & 패턴

- [RouteLLM: Learning to Route LLMs with Preference Data (arXiv)](https://arxiv.org/abs/2406.18665)
- [LMSYS Chatbot Arena Leaderboard](https://chat.lmsys.org/?leaderboard)
- [LLM Router Pattern: Model Switching](https://markaicode.com/llm-router-pattern-model-switching/)
