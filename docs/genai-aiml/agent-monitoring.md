---
title: "AI Agent 모니터링 (LangFuse & LangSmith)"
sidebar_label: "Agent 모니터링"
description: "LangFuse, LangSmith를 활용한 Agentic AI 애플리케이션 모니터링 및 추적"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry]
category: "genai-aiml"
date: 2025-02-05
authors: [devfloor9]
sidebar_position: 8
---

# AI Agent 모니터링 (LangFuse & LangSmith)

이 문서에서는 LangFuse와 LangSmith를 활용하여 Agentic AI 애플리케이션의 성능과 동작을 효과적으로 추적하고 모니터링하는 방법을 다룹니다. Kubernetes 환경에서의 배포부터 Grafana 대시보드 구성까지 실무에 필요한 전체 가이드를 제공합니다.

## 개요

Agentic AI 애플리케이션은 복잡한 추론 체인과 다양한 도구 호출을 수행하기 때문에, 전통적인 APM(Application Performance Monitoring) 도구만으로는 충분한 가시성을 확보하기 어렵습니다. LLM 특화 관측성 도구인 LangFuse와 LangSmith는 다음과 같은 핵심 기능을 제공합니다:

- **트레이스 추적**: LLM 호출, 도구 실행, 에이전트 추론 과정의 전체 흐름 추적
- **토큰 사용량 분석**: 입력/출력 토큰 수 및 비용 계산
- **품질 평가**: 응답 품질 점수화 및 피드백 수집
- **디버깅**: 프롬프트 및 응답 내용 검토를 통한 문제 진단

:::info 대상 독자
이 문서는 플랫폼 운영자, MLOps 엔지니어, AI 개발자를 대상으로 합니다. Kubernetes와 Python에 대한 기본적인 이해가 필요합니다.
:::

## LangFuse vs LangSmith 비교

| 특성 | LangFuse | LangSmith |
| ---- | -------- | --------- |
| **라이선스** | 오픈소스 (MIT) | 상용 (무료 티어 제공) |
| **배포 방식** | Self-hosted / Cloud | Cloud only |
| **데이터 주권** | 완전한 제어 | LangChain 서버 |
| **통합** | 다양한 프레임워크 | LangChain 최적화 |
| **비용** | 인프라 비용만 | 사용량 기반 과금 |
| **확장성** | Kubernetes 네이티브 | 관리형 |

:::tip 선택 가이드
- **LangFuse**: 데이터 주권이 중요하거나, 비용 최적화가 필요한 경우
- **LangSmith**: LangChain 기반 개발이 주력이고, 빠른 시작이 필요한 경우
:::


## LangFuse Kubernetes 배포

### 아키텍처 개요

LangFuse는 다음 컴포넌트로 구성됩니다:

```mermaid
graph TB
    subgraph LangFuseStack["LangFuse Stack"]
        WEB["LangFuse Web<br/>(Next.js)"]
        API["LangFuse API<br/>(tRPC)"]
        WORKER["Background Worker<br/>(Queue Processing)"]
    end
    
    subgraph Storage["Storage Layer"]
        PG["PostgreSQL<br/>(Metadata)"]
        REDIS["Redis<br/>(Cache/Queue)"]
        S3["S3<br/>(Blob Storage)"]
    end
    
    subgraph Clients["AI Applications"]
        AGENT1["Agent 1"]
        AGENT2["Agent 2"]
        AGENTN["Agent N"]
    end
    
    AGENT1 --> API
    AGENT2 --> API
    AGENTN --> API
    WEB --> API
    API --> PG
    API --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    WORKER --> S3
    
    style LangFuseStack fill:#e8f5e9
    style Storage fill:#e3f2fd
    style Clients fill:#fff3e0
```

### PostgreSQL 배포

LangFuse의 메타데이터 저장을 위한 PostgreSQL을 배포합니다.

```yaml
# langfuse-postgres.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: observability
  labels:
    app.kubernetes.io/part-of: langfuse
---
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-postgres-secret
  namespace: observability
type: Opaque
stringData:
  POSTGRES_USER: langfuse
  POSTGRES_PASSWORD: "your-secure-password-here"  # 프로덕션에서는 Secrets Manager 사용
  POSTGRES_DB: langfuse
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: langfuse-postgres-pvc
  namespace: observability
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 100Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: langfuse-postgres
  namespace: observability
spec:
  serviceName: langfuse-postgres
  replicas: 1
  selector:
    matchLabels:
      app: langfuse-postgres
  template:
    metadata:
      labels:
        app: langfuse-postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: langfuse-postgres-secret
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - langfuse
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - langfuse
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: langfuse-postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: langfuse-postgres
  namespace: observability
spec:
  selector:
    app: langfuse-postgres
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
```


### LangFuse Deployment

LangFuse 애플리케이션을 배포합니다.

```yaml
# langfuse-deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-secret
  namespace: observability
type: Opaque
stringData:
  # 필수 환경 변수
  DATABASE_URL: "postgresql://langfuse:your-secure-password-here@langfuse-postgres:5432/langfuse"
  NEXTAUTH_SECRET: "your-nextauth-secret-32-chars-min"  # openssl rand -base64 32
  SALT: "your-salt-value-here"  # openssl rand -base64 32
  ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000"  # 64 hex chars
  
  # 선택적 환경 변수
  NEXTAUTH_URL: "https://langfuse.your-domain.com"
  LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: "true"
  
  # S3 설정 (선택적)
  S3_ENDPOINT: "https://s3.ap-northeast-2.amazonaws.com"
  S3_ACCESS_KEY_ID: "your-access-key"
  S3_SECRET_ACCESS_KEY: "your-secret-key"
  S3_BUCKET_NAME: "langfuse-traces"
  S3_REGION: "ap-northeast-2"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse
  namespace: observability
  labels:
    app: langfuse
spec:
  replicas: 2
  selector:
    matchLabels:
      app: langfuse
  template:
    metadata:
      labels:
        app: langfuse
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/api/public/metrics"
    spec:
      containers:
        - name: langfuse
          image: langfuse/langfuse:2
          ports:
            - containerPort: 3000
              name: http
          envFrom:
            - secretRef:
                name: langfuse-secret
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: HOSTNAME
              value: "0.0.0.0"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/public/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
          readinessProbe:
            httpGet:
              path: /api/public/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: langfuse
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: langfuse
  namespace: observability
spec:
  selector:
    app: langfuse
  ports:
    - port: 80
      targetPort: 3000
      name: http
  type: ClusterIP
```


### Ingress 설정

외부 접근을 위한 Ingress를 구성합니다.

```yaml
# langfuse-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: langfuse-ingress
  namespace: observability
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:XXXXXXXXXXXX:certificate/xxx
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/healthcheck-path: /api/public/health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "2"
spec:
  ingressClassName: alb
  rules:
    - host: langfuse.your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: langfuse
                port:
                  number: 80
```

### HPA 설정

트래픽에 따른 자동 스케일링을 구성합니다.

```yaml
# langfuse-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: langfuse-hpa
  namespace: observability
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: langfuse
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

:::warning 프로덕션 배포 시 주의사항
- `NEXTAUTH_SECRET`, `SALT`, `ENCRYPTION_KEY`는 반드시 안전한 랜덤 값으로 설정하세요
- 프로덕션에서는 AWS Secrets Manager 또는 HashiCorp Vault를 사용하여 시크릿을 관리하세요
- PostgreSQL은 RDS를 사용하는 것을 권장합니다 (고가용성, 자동 백업)
:::


## LangSmith 통합

LangSmith는 LangChain에서 제공하는 관리형 관측성 플랫폼입니다. Self-hosted 옵션이 없지만, LangChain 기반 애플리케이션과의 통합이 매우 간편합니다.

### 환경 설정

LangSmith를 사용하기 위한 환경 변수를 설정합니다.

```yaml
# langsmith-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langsmith-config
  namespace: ai-agents
type: Opaque
stringData:
  LANGCHAIN_TRACING_V2: "true"
  LANGCHAIN_ENDPOINT: "https://api.smith.langchain.com"
  LANGCHAIN_API_KEY: "ls__your-api-key-here"
  LANGCHAIN_PROJECT: "agentic-ai-production"
```

### LangChain 에이전트 연동

LangSmith와 LangChain 에이전트를 연동하는 Python 코드 예제입니다.

```python
# agent_with_langsmith.py
import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree

# 환경 변수 설정 (Kubernetes Secret에서 주입)
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
# LANGCHAIN_API_KEY=ls__xxx
# LANGCHAIN_PROJECT=agentic-ai-production

# 커스텀 도구 정의
@tool
def search_knowledge_base(query: str) -> str:
    """지식 베이스에서 관련 정보를 검색합니다."""
    # Milvus 검색 로직
    return f"검색 결과: {query}에 대한 정보..."

@tool
def create_support_ticket(title: str, description: str, priority: str = "medium") -> str:
    """고객 지원 티켓을 생성합니다."""
    # 티켓 생성 로직
    return f"티켓 생성 완료: {title} (우선순위: {priority})"

# 에이전트 설정
llm = ChatOpenAI(
    model="gpt-4-turbo",
    temperature=0.7,
    max_tokens=4096,
)

prompt = ChatPromptTemplate.from_messages([
    ("system", """당신은 친절하고 전문적인 고객 지원 에이전트입니다.
    항상 정확한 정보를 제공하고, 모르는 것은 솔직히 인정하세요.
    필요한 경우 지식 베이스를 검색하거나 티켓을 생성하세요."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

tools = [search_knowledge_base, create_support_ticket]
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=10,
    return_intermediate_steps=True,
)

# 트레이스 가능한 함수로 래핑
@traceable(
    name="customer_support_agent",
    run_type="chain",
    tags=["production", "customer-support"],
)
def run_agent(user_input: str, chat_history: list = None, metadata: dict = None):
    """에이전트를 실행하고 LangSmith에 트레이스를 기록합니다."""
    if chat_history is None:
        chat_history = []
    
    # 현재 실행 트리에 메타데이터 추가
    run_tree = get_current_run_tree()
    if run_tree and metadata:
        run_tree.extra["metadata"] = metadata
    
    result = agent_executor.invoke({
        "input": user_input,
        "chat_history": chat_history,
    })
    
    return result

# 사용 예시
if __name__ == "__main__":
    response = run_agent(
        user_input="주문 #12345의 배송 상태를 확인해주세요",
        metadata={
            "user_id": "user_123",
            "session_id": "session_456",
            "tenant_id": "tenant_abc",
        }
    )
    print(response)
```


### LangFuse Python 통합

LangFuse를 Python 애플리케이션에 통합하는 방법입니다.

```python
# agent_with_langfuse.py
import os
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from langfuse.openai import openai  # OpenAI 래퍼
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.callbacks import LangfuseCallbackHandler

# LangFuse 클라이언트 초기화
langfuse = Langfuse(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST", "https://langfuse.your-domain.com"),
)

# LangChain 콜백 핸들러
langfuse_handler = LangfuseCallbackHandler(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    host=os.environ.get("LANGFUSE_HOST"),
)

# 에이전트 설정
llm = ChatOpenAI(
    model="gpt-4-turbo",
    temperature=0.7,
    callbacks=[langfuse_handler],
)

@observe(name="customer_support_agent")
def run_agent_with_langfuse(
    user_input: str,
    user_id: str = None,
    session_id: str = None,
    tenant_id: str = None,
):
    """LangFuse 트레이싱이 적용된 에이전트 실행"""
    
    # 트레이스에 메타데이터 추가
    langfuse_context.update_current_trace(
        user_id=user_id,
        session_id=session_id,
        metadata={
            "tenant_id": tenant_id,
            "environment": os.environ.get("ENVIRONMENT", "production"),
        },
        tags=["customer-support", "production"],
    )
    
    # 에이전트 실행
    result = agent_executor.invoke(
        {"input": user_input, "chat_history": []},
        config={"callbacks": [langfuse_handler]},
    )
    
    # 출력 토큰 및 비용 기록
    langfuse_context.update_current_observation(
        output=result["output"],
        metadata={
            "intermediate_steps": len(result.get("intermediate_steps", [])),
        },
    )
    
    return result

@observe(name="vector_search", as_type="span")
def search_with_tracing(query: str, collection: str, top_k: int = 5):
    """벡터 검색을 트레이싱과 함께 수행"""
    from pymilvus import Collection
    
    langfuse_context.update_current_observation(
        input={"query": query, "collection": collection, "top_k": top_k},
    )
    
    # Milvus 검색 수행
    collection = Collection(collection)
    results = collection.search(
        data=[get_embedding(query)],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"ef": 64}},
        limit=top_k,
        output_fields=["content", "metadata"],
    )
    
    langfuse_context.update_current_observation(
        output={"num_results": len(results[0])},
    )
    
    return results

# 점수 및 피드백 기록
def record_feedback(trace_id: str, score: float, comment: str = None):
    """사용자 피드백을 LangFuse에 기록"""
    langfuse.score(
        trace_id=trace_id,
        name="user_feedback",
        value=score,
        comment=comment,
    )

# 사용 예시
if __name__ == "__main__":
    response = run_agent_with_langfuse(
        user_input="제품 반품 절차를 알려주세요",
        user_id="user_123",
        session_id="session_456",
        tenant_id="tenant_abc",
    )
    
    # 피드백 기록 (예: 사용자가 응답에 만족)
    trace_id = langfuse_context.get_current_trace_id()
    record_feedback(trace_id, score=1.0, comment="정확한 답변")
    
    # 플러시하여 모든 이벤트 전송
    langfuse.flush()
```


## 핵심 모니터링 메트릭

Agentic AI 애플리케이션에서 추적해야 할 핵심 메트릭을 정의합니다.

### 메트릭 카테고리

```mermaid
graph TB
    subgraph Metrics["핵심 메트릭"]
        subgraph Latency["⏱️ Latency"]
            E2E["End-to-End 지연"]
            LLM_LAT["LLM 추론 시간"]
            TOOL_LAT["도구 실행 시간"]
            RETRIEVAL_LAT["검색 지연"]
        end
        
        subgraph Tokens["🔢 Token Usage"]
            INPUT_TOK["입력 토큰"]
            OUTPUT_TOK["출력 토큰"]
            TOTAL_TOK["총 토큰"]
            COST["비용"]
        end
        
        subgraph Errors["❌ Error Rate"]
            LLM_ERR["LLM 오류"]
            TOOL_ERR["도구 오류"]
            TIMEOUT["타임아웃"]
            RATE_LIMIT["Rate Limit"]
        end
        
        subgraph Traces["🔍 Trace Analysis"]
            CHAIN_LEN["체인 길이"]
            TOOL_CALLS["도구 호출 수"]
            ITERATIONS["반복 횟수"]
            SUCCESS["성공률"]
        end
    end
    
    style Latency fill:#e3f2fd
    style Tokens fill:#e8f5e9
    style Errors fill:#ffcdd2
    style Traces fill:#fff3e0
```

### Latency 메트릭

| 메트릭 | 설명 | 목표값 | 알림 임계값 |
| ------ | ---- | ------ | ----------- |
| `agent_request_duration_seconds` | 전체 요청 처리 시간 | P95 < 5s | P99 > 10s |
| `llm_inference_duration_seconds` | LLM 추론 시간 | P95 < 3s | P99 > 8s |
| `tool_execution_duration_seconds` | 도구 실행 시간 | P95 < 1s | P99 > 3s |
| `vector_search_duration_seconds` | 벡터 검색 시간 | P95 < 200ms | P99 > 500ms |

### Token Usage 메트릭

| 메트릭 | 설명 | 모니터링 목적 |
| ------ | ---- | ------------- |
| `llm_input_tokens_total` | 입력 토큰 총합 | 프롬프트 최적화 |
| `llm_output_tokens_total` | 출력 토큰 총합 | 응답 길이 분석 |
| `llm_total_tokens_total` | 전체 토큰 총합 | 비용 추적 |
| `llm_cost_dollars_total` | 추정 비용 (USD) | 예산 관리 |

### Error Rate 메트릭

| 메트릭 | 설명 | 알림 임계값 |
| ------ | ---- | ----------- |
| `agent_errors_total` | 에이전트 오류 총합 | 오류율 > 5% |
| `llm_rate_limit_errors_total` | Rate Limit 오류 | 분당 10회 이상 |
| `tool_execution_errors_total` | 도구 실행 오류 | 오류율 > 10% |
| `agent_timeout_total` | 타임아웃 발생 | 분당 5회 이상 |

### Prometheus 메트릭 수집 설정

```yaml
# prometheus-scrape-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-agent-scrape
  namespace: observability
data:
  agent-scrape.yaml: |
    scrape_configs:
      - job_name: 'langfuse'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - observability
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: langfuse
            action: keep
          - source_labels: [__meta_kubernetes_pod_container_port_number]
            regex: "3000"
            action: keep
        metrics_path: /api/public/metrics
        
      - job_name: 'ai-agents'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ai-agents
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            regex: "true"
            action: keep
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```


### Python 메트릭 익스포터

에이전트 애플리케이션에서 Prometheus 메트릭을 노출하는 코드입니다.

```python
# metrics_exporter.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# 메트릭 정의
AGENT_REQUEST_DURATION = Histogram(
    'agent_request_duration_seconds',
    'Agent request duration in seconds',
    ['agent_name', 'model', 'tenant_id'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

LLM_INFERENCE_DURATION = Histogram(
    'llm_inference_duration_seconds',
    'LLM inference duration in seconds',
    ['model', 'provider'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

LLM_TOKENS = Counter(
    'llm_tokens_total',
    'Total LLM tokens used',
    ['model', 'token_type', 'tenant_id']  # token_type: input, output
)

LLM_COST = Counter(
    'llm_cost_dollars_total',
    'Total LLM cost in USD',
    ['model', 'tenant_id']
)

AGENT_ERRORS = Counter(
    'agent_errors_total',
    'Total agent errors',
    ['agent_name', 'error_type', 'tenant_id']
)

TOOL_EXECUTION_DURATION = Histogram(
    'tool_execution_duration_seconds',
    'Tool execution duration in seconds',
    ['tool_name', 'agent_name'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]
)

ACTIVE_SESSIONS = Gauge(
    'agent_active_sessions',
    'Number of active agent sessions',
    ['agent_name', 'tenant_id']
)

# 모델별 비용 (USD per 1K tokens)
MODEL_COSTS = {
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
}

def record_llm_usage(
    model: str,
    input_tokens: int,
    output_tokens: int,
    tenant_id: str,
    duration: float,
):
    """LLM 사용량 메트릭 기록"""
    # 토큰 수 기록
    LLM_TOKENS.labels(model=model, token_type="input", tenant_id=tenant_id).inc(input_tokens)
    LLM_TOKENS.labels(model=model, token_type="output", tenant_id=tenant_id).inc(output_tokens)
    
    # 비용 계산 및 기록
    if model in MODEL_COSTS:
        cost = (
            (input_tokens / 1000) * MODEL_COSTS[model]["input"] +
            (output_tokens / 1000) * MODEL_COSTS[model]["output"]
        )
        LLM_COST.labels(model=model, tenant_id=tenant_id).inc(cost)
    
    # 추론 시간 기록
    LLM_INFERENCE_DURATION.labels(model=model, provider="openai").observe(duration)

def record_agent_request(
    agent_name: str,
    model: str,
    tenant_id: str,
    duration: float,
    success: bool,
    error_type: str = None,
):
    """에이전트 요청 메트릭 기록"""
    AGENT_REQUEST_DURATION.labels(
        agent_name=agent_name,
        model=model,
        tenant_id=tenant_id
    ).observe(duration)
    
    if not success and error_type:
        AGENT_ERRORS.labels(
            agent_name=agent_name,
            error_type=error_type,
            tenant_id=tenant_id
        ).inc()

# 메트릭 서버 시작
def start_metrics_server(port: int = 8000):
    """Prometheus 메트릭 서버 시작"""
    start_http_server(port)
    print(f"Metrics server started on port {port}")
```


## Grafana 대시보드

### 대시보드 개요

AI Agent 모니터링을 위한 Grafana 대시보드를 구성합니다.

```mermaid
graph TB
    subgraph Dashboard["Grafana Dashboard"]
        subgraph Row1["Overview"]
            TOTAL_REQ["총 요청 수"]
            SUCCESS_RATE["성공률"]
            AVG_LATENCY["평균 지연"]
            ACTIVE_USERS["활성 사용자"]
        end
        
        subgraph Row2["Performance"]
            LATENCY_CHART["지연 시간 분포"]
            THROUGHPUT["처리량 추이"]
            ERROR_RATE["오류율 추이"]
        end
        
        subgraph Row3["Cost & Usage"]
            TOKEN_USAGE["토큰 사용량"]
            COST_BY_MODEL["모델별 비용"]
            COST_BY_TENANT["테넌트별 비용"]
        end
        
        subgraph Row4["Traces"]
            TRACE_TABLE["최근 트레이스"]
            SLOW_TRACES["느린 요청"]
            ERROR_TRACES["오류 트레이스"]
        end
    end
    
    style Row1 fill:#e3f2fd
    style Row2 fill:#e8f5e9
    style Row3 fill:#fff3e0
    style Row4 fill:#fce4ec
```

### 대시보드 JSON 설정

```json
{
  "dashboard": {
    "id": null,
    "uid": "ai-agent-monitoring",
    "title": "AI Agent Monitoring",
    "tags": ["ai", "agent", "langfuse", "llm"],
    "timezone": "browser",
    "schemaVersion": 38,
    "version": 1,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "Total Requests",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "sum(increase(agent_request_duration_seconds_count[24h]))",
            "legendFormat": "Total"
          }
        ],
        "options": {
          "colorMode": "value",
          "graphMode": "area",
          "justifyMode": "auto"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Success Rate",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
        "targets": [
          {
            "expr": "1 - (sum(rate(agent_errors_total[5m])) / sum(rate(agent_request_duration_seconds_count[5m])))",
            "legendFormat": "Success Rate"
          }
        ],
        "options": {
          "showThresholdLabels": false,
          "showThresholdMarkers": true
        },
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0,
            "max": 1,
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": null},
                {"color": "yellow", "value": 0.9},
                {"color": "green", "value": 0.95}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "P95 Latency",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 5},
                {"color": "red", "value": 10}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Active Sessions",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 0},
        "targets": [
          {
            "expr": "sum(agent_active_sessions)",
            "legendFormat": "Active"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null}
              ]
            }
          }
        }
      },
      {
        "id": 5,
        "title": "Request Latency Distribution",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4},
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "P99"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "custom": {
              "drawStyle": "line",
              "lineInterpolation": "smooth",
              "fillOpacity": 10
            }
          }
        }
      },
      {
        "id": 6,
        "title": "Error Rate by Type",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
        "targets": [
          {
            "expr": "sum(rate(agent_errors_total[5m])) by (error_type)",
            "legendFormat": "{{error_type}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "custom": {
              "drawStyle": "bars",
              "fillOpacity": 80
            }
          }
        }
      },
      {
        "id": 7,
        "title": "Token Usage by Model",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 12},
        "targets": [
          {
            "expr": "sum(rate(llm_tokens_total[1h])) by (model)",
            "legendFormat": "{{model}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short",
            "custom": {
              "drawStyle": "line",
              "fillOpacity": 20,
              "stacking": {"mode": "normal"}
            }
          }
        }
      },
      {
        "id": 8,
        "title": "Cost by Tenant (Daily)",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 12},
        "targets": [
          {
            "expr": "sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)",
            "legendFormat": "{{tenant_id}}"
          }
        ],
        "options": {
          "legend": {
            "displayMode": "table",
            "placement": "right",
            "values": ["value", "percent"]
          },
          "pieType": "donut"
        },
        "fieldConfig": {
          "defaults": {
            "unit": "currencyUSD"
          }
        }
      }
    ]
  }
}
```


### 알림 설정

Grafana 알림 규칙을 설정하여 이상 상황을 감지합니다.

```yaml
# grafana-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-alert-rules
  namespace: observability
data:
  ai-agent-alerts.yaml: |
    apiVersion: 1
    groups:
      - orgId: 1
        name: AI Agent Alerts
        folder: AI Monitoring
        interval: 1m
        rules:
          - uid: agent-high-latency
            title: Agent High Latency
            condition: C
            data:
              - refId: A
                relativeTimeRange:
                  from: 300
                  to: 0
                datasourceUid: prometheus
                model:
                  expr: histogram_quantile(0.99, sum(rate(agent_request_duration_seconds_bucket[5m])) by (le, agent_name))
                  intervalMs: 1000
                  maxDataPoints: 43200
              - refId: B
                relativeTimeRange:
                  from: 300
                  to: 0
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [10]
                        type: gt
                      operator:
                        type: and
                      query:
                        params: [A]
                      reducer:
                        type: last
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            noDataState: NoData
            execErrState: Error
            for: 5m
            annotations:
              summary: "Agent {{ $labels.agent_name }} P99 latency is above 10s"
              description: "Current P99 latency: {{ $values.A }}s"
            labels:
              severity: warning
              
          - uid: agent-high-error-rate
            title: Agent High Error Rate
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: |
                    sum(rate(agent_errors_total[5m])) by (agent_name) / 
                    sum(rate(agent_request_duration_seconds_count[5m])) by (agent_name)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [0.05]
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 5m
            annotations:
              summary: "Agent {{ $labels.agent_name }} error rate is above 5%"
              description: "Current error rate: {{ printf \"%.2f\" $values.A }}%"
            labels:
              severity: critical
              
          - uid: llm-rate-limit
            title: LLM Rate Limit Errors
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: sum(increase(llm_rate_limit_errors_total[5m])) by (model)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [10]
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 2m
            annotations:
              summary: "LLM {{ $labels.model }} rate limit errors detected"
              description: "{{ $values.A }} rate limit errors in last 5 minutes"
            labels:
              severity: warning
              
          - uid: cost-budget-alert
            title: Daily Cost Budget Exceeded
            condition: C
            data:
              - refId: A
                datasourceUid: prometheus
                model:
                  expr: sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)
              - refId: B
                datasourceUid: __expr__
                model:
                  conditions:
                    - evaluator:
                        params: [100]  # $100 daily budget
                        type: gt
                  type: threshold
              - refId: C
                datasourceUid: __expr__
                model:
                  expression: B
                  type: reduce
                  reducer: last
            for: 0s
            annotations:
              summary: "Tenant {{ $labels.tenant_id }} exceeded daily cost budget"
              description: "Current daily cost: ${{ printf \"%.2f\" $values.A }}"
            labels:
              severity: warning
```


## 비용 추적

### 모델별 비용 분석

LLM 사용 비용을 모델별로 추적하고 분석합니다.

```python
# cost_tracker.py
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

@dataclass
class ModelPricing:
    """모델별 가격 정보 (USD per 1K tokens)"""
    input_price: float
    output_price: float
    
# 2024년 기준 모델 가격
MODEL_PRICING: Dict[str, ModelPricing] = {
    # OpenAI
    "gpt-4-turbo": ModelPricing(0.01, 0.03),
    "gpt-4-turbo-preview": ModelPricing(0.01, 0.03),
    "gpt-4": ModelPricing(0.03, 0.06),
    "gpt-4-32k": ModelPricing(0.06, 0.12),
    "gpt-3.5-turbo": ModelPricing(0.0005, 0.0015),
    "gpt-3.5-turbo-16k": ModelPricing(0.003, 0.004),
    
    # Anthropic
    "claude-3-opus": ModelPricing(0.015, 0.075),
    "claude-3-sonnet": ModelPricing(0.003, 0.015),
    "claude-3-haiku": ModelPricing(0.00025, 0.00125),
    "claude-2.1": ModelPricing(0.008, 0.024),
    
    # Amazon Bedrock (Claude)
    "anthropic.claude-3-opus-20240229-v1:0": ModelPricing(0.015, 0.075),
    "anthropic.claude-3-sonnet-20240229-v1:0": ModelPricing(0.003, 0.015),
    "anthropic.claude-3-haiku-20240307-v1:0": ModelPricing(0.00025, 0.00125),
    
    # Self-hosted (예: vLLM) - 인프라 비용 기반 추정
    "llama-3-70b": ModelPricing(0.001, 0.001),
    "mixtral-8x7b": ModelPricing(0.0005, 0.0005),
}

@dataclass
class UsageRecord:
    """사용량 기록"""
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    tenant_id: str
    agent_name: str
    trace_id: str
    
    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens
    
    @property
    def cost(self) -> float:
        if self.model not in MODEL_PRICING:
            return 0.0
        pricing = MODEL_PRICING[self.model]
        return (
            (self.input_tokens / 1000) * pricing.input_price +
            (self.output_tokens / 1000) * pricing.output_price
        )

class CostTracker:
    """비용 추적기"""
    
    def __init__(self, langfuse_client=None):
        self.langfuse = langfuse_client
        self.records: List[UsageRecord] = []
    
    def record_usage(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        tenant_id: str,
        agent_name: str,
        trace_id: str,
    ):
        """사용량 기록"""
        record = UsageRecord(
            timestamp=datetime.utcnow(),
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tenant_id=tenant_id,
            agent_name=agent_name,
            trace_id=trace_id,
        )
        self.records.append(record)
        
        # Prometheus 메트릭 업데이트
        from metrics_exporter import record_llm_usage
        record_llm_usage(
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tenant_id=tenant_id,
            duration=0,  # 별도 측정 필요
        )
        
        return record
    
    def get_cost_by_tenant(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, float]:
        """테넌트별 비용 집계"""
        if start_time is None:
            start_time = datetime.utcnow() - timedelta(days=30)
        if end_time is None:
            end_time = datetime.utcnow()
        
        costs: Dict[str, float] = {}
        for record in self.records:
            if start_time <= record.timestamp <= end_time:
                if record.tenant_id not in costs:
                    costs[record.tenant_id] = 0.0
                costs[record.tenant_id] += record.cost
        
        return costs
    
    def get_cost_by_model(
        self,
        tenant_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Dict[str, float]]:
        """모델별 비용 및 토큰 사용량 집계"""
        if start_time is None:
            start_time = datetime.utcnow() - timedelta(days=30)
        if end_time is None:
            end_time = datetime.utcnow()
        
        result: Dict[str, Dict[str, float]] = {}
        for record in self.records:
            if start_time <= record.timestamp <= end_time:
                if tenant_id and record.tenant_id != tenant_id:
                    continue
                    
                if record.model not in result:
                    result[record.model] = {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                        "cost": 0.0,
                        "requests": 0,
                    }
                
                result[record.model]["input_tokens"] += record.input_tokens
                result[record.model]["output_tokens"] += record.output_tokens
                result[record.model]["total_tokens"] += record.total_tokens
                result[record.model]["cost"] += record.cost
                result[record.model]["requests"] += 1
        
        return result
    
    def generate_cost_report(
        self,
        tenant_id: Optional[str] = None,
        period_days: int = 30,
    ) -> str:
        """비용 리포트 생성"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=period_days)
        
        model_costs = self.get_cost_by_model(tenant_id, start_time, end_time)
        tenant_costs = self.get_cost_by_tenant(start_time, end_time)
        
        report = {
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "days": period_days,
            },
            "summary": {
                "total_cost": sum(tenant_costs.values()),
                "total_requests": sum(m["requests"] for m in model_costs.values()),
                "total_tokens": sum(m["total_tokens"] for m in model_costs.values()),
            },
            "by_model": model_costs,
            "by_tenant": tenant_costs,
        }
        
        return json.dumps(report, indent=2, default=str)
```


### 테넌트별 비용 할당

멀티 테넌트 환경에서 비용을 공정하게 할당하는 방법입니다.

```yaml
# cost-allocation-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cost-allocation-config
  namespace: observability
data:
  allocation-rules.yaml: |
    # 테넌트별 예산 설정
    tenants:
      tenant-a:
        monthly_budget_usd: 5000
        alert_threshold_percent: 80
        models_allowed:
          - gpt-4-turbo
          - gpt-3.5-turbo
          - claude-3-sonnet
        rate_limits:
          requests_per_minute: 100
          tokens_per_day: 1000000
          
      tenant-b:
        monthly_budget_usd: 2000
        alert_threshold_percent: 80
        models_allowed:
          - gpt-3.5-turbo
          - claude-3-haiku
        rate_limits:
          requests_per_minute: 50
          tokens_per_day: 500000
          
      tenant-c:
        monthly_budget_usd: 10000
        alert_threshold_percent: 90
        models_allowed:
          - gpt-4-turbo
          - gpt-4
          - claude-3-opus
          - claude-3-sonnet
        rate_limits:
          requests_per_minute: 200
          tokens_per_day: 5000000
    
    # 공유 인프라 비용 분배
    infrastructure_cost_allocation:
      method: proportional  # proportional, equal, fixed
      base_monthly_cost_usd: 1000  # GPU 인프라 기본 비용
      
    # 알림 설정
    alerts:
      budget_warning:
        threshold_percent: 80
        channels: [slack, email]
      budget_exceeded:
        threshold_percent: 100
        channels: [slack, email, pagerduty]
      rate_limit_warning:
        threshold_percent: 90
        channels: [slack]
```

### 비용 대시보드 쿼리

Grafana에서 비용 분석을 위한 PromQL 쿼리 예시입니다.

```promql
# 일별 총 비용
sum(increase(llm_cost_dollars_total[24h]))

# 테넌트별 일별 비용
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# 모델별 비용 비율
sum(increase(llm_cost_dollars_total[24h])) by (model) 
/ ignoring(model) group_left 
sum(increase(llm_cost_dollars_total[24h]))

# 시간당 비용 추이
sum(rate(llm_cost_dollars_total[1h])) * 3600

# 예산 대비 사용률 (월간)
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id) 
/ on(tenant_id) group_left 
tenant_monthly_budget_usd

# 토큰당 평균 비용
sum(rate(llm_cost_dollars_total[1h])) 
/ sum(rate(llm_tokens_total[1h]))

# 요청당 평균 비용
sum(increase(llm_cost_dollars_total[24h])) 
/ sum(increase(agent_request_duration_seconds_count[24h]))
```

:::tip 비용 최적화 팁
1. **모델 선택 최적화**: 간단한 작업에는 저렴한 모델(GPT-3.5, Claude Haiku) 사용
2. **프롬프트 최적화**: 불필요한 컨텍스트 제거로 입력 토큰 절감
3. **캐싱 활용**: 반복적인 쿼리에 대한 응답 캐싱
4. **배치 처리**: 가능한 경우 요청을 배치로 처리하여 오버헤드 감소
:::


## OpenTelemetry 통합

LangFuse와 기존 관측성 스택을 OpenTelemetry로 통합합니다.

### OpenTelemetry Collector 설정

```yaml
# otel-collector-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: observability
data:
  config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      
      prometheus:
        config:
          scrape_configs:
            - job_name: 'langfuse'
              static_configs:
                - targets: ['langfuse:3000']
              metrics_path: /api/public/metrics
    
    processors:
      batch:
        timeout: 10s
        send_batch_size: 1000
      
      memory_limiter:
        check_interval: 1s
        limit_mib: 1000
        spike_limit_mib: 200
      
      attributes:
        actions:
          - key: environment
            value: production
            action: upsert
          - key: service.namespace
            value: ai-platform
            action: upsert
    
    exporters:
      prometheus:
        endpoint: "0.0.0.0:8889"
        namespace: ai_agent
        
      otlp/jaeger:
        endpoint: jaeger-collector.observability:4317
        tls:
          insecure: true
      
      awsxray:
        region: ap-northeast-2
        
      logging:
        loglevel: info
    
    extensions:
      health_check:
        endpoint: 0.0.0.0:13133
      pprof:
        endpoint: 0.0.0.0:1777
    
    service:
      extensions: [health_check, pprof]
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, batch, attributes]
          exporters: [otlp/jaeger, awsxray, logging]
        
        metrics:
          receivers: [otlp, prometheus]
          processors: [memory_limiter, batch]
          exporters: [prometheus]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: observability
spec:
  replicas: 2
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:0.92.0
          args:
            - --config=/etc/otel/config.yaml
          ports:
            - containerPort: 4317  # OTLP gRPC
            - containerPort: 4318  # OTLP HTTP
            - containerPort: 8889  # Prometheus exporter
            - containerPort: 13133 # Health check
          volumeMounts:
            - name: config
              mountPath: /etc/otel
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    app: otel-collector
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
    - name: prometheus
      port: 8889
      targetPort: 8889
```

### Python OpenTelemetry 통합

```python
# otel_integration.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
import os

def setup_opentelemetry():
    """OpenTelemetry 초기화"""
    resource = Resource.create({
        ResourceAttributes.SERVICE_NAME: "ai-agent",
        ResourceAttributes.SERVICE_VERSION: "1.0.0",
        ResourceAttributes.DEPLOYMENT_ENVIRONMENT: os.environ.get("ENVIRONMENT", "production"),
    })
    
    provider = TracerProvider(resource=resource)
    
    # OTLP Exporter 설정
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "otel-collector:4317"),
        insecure=True,
    )
    
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(provider)
    
    # HTTP 요청 자동 계측
    RequestsInstrumentor().instrument()
    
    return trace.get_tracer(__name__)

# 사용 예시
tracer = setup_opentelemetry()

@tracer.start_as_current_span("agent_execution")
def execute_agent(user_input: str, tenant_id: str):
    """OpenTelemetry 트레이싱이 적용된 에이전트 실행"""
    current_span = trace.get_current_span()
    current_span.set_attribute("tenant_id", tenant_id)
    current_span.set_attribute("input_length", len(user_input))
    
    # 에이전트 로직 실행
    with tracer.start_as_current_span("llm_inference") as llm_span:
        llm_span.set_attribute("model", "gpt-4-turbo")
        # LLM 호출
        response = call_llm(user_input)
        llm_span.set_attribute("output_tokens", response.usage.completion_tokens)
    
    return response
```


## 트러블슈팅

### 일반적인 문제와 해결 방법

#### LangFuse 연결 오류

```bash
# 증상: LangFuse에 트레이스가 기록되지 않음

# 1. LangFuse 서비스 상태 확인
kubectl get pods -n observability -l app=langfuse

# 2. LangFuse 로그 확인
kubectl logs -n observability -l app=langfuse --tail=100

# 3. 네트워크 연결 테스트
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://langfuse.observability.svc/api/public/health

# 4. 환경 변수 확인
kubectl exec -n ai-agents <pod-name> -- env | grep LANGFUSE
```

#### 높은 지연 시간 디버깅

```python
# trace_analyzer.py
from langfuse import Langfuse
from datetime import datetime, timedelta

langfuse = Langfuse()

def analyze_slow_traces(threshold_seconds: float = 10.0, hours: int = 24):
    """느린 트레이스 분석"""
    traces = langfuse.get_traces(
        limit=100,
        order_by="latency",
        order="desc",
    )
    
    slow_traces = []
    for trace in traces.data:
        if trace.latency and trace.latency > threshold_seconds:
            # 각 스팬별 지연 시간 분석
            observations = langfuse.get_observations(trace_id=trace.id)
            
            breakdown = []
            for obs in observations.data:
                if obs.end_time and obs.start_time:
                    duration = (obs.end_time - obs.start_time).total_seconds()
                    breakdown.append({
                        "name": obs.name,
                        "type": obs.type,
                        "duration": duration,
                    })
            
            slow_traces.append({
                "trace_id": trace.id,
                "total_latency": trace.latency,
                "breakdown": sorted(breakdown, key=lambda x: x["duration"], reverse=True),
            })
    
    return slow_traces

# 분석 실행
slow = analyze_slow_traces(threshold_seconds=10.0)
for trace in slow[:5]:
    print(f"\nTrace: {trace['trace_id']}")
    print(f"Total Latency: {trace['total_latency']:.2f}s")
    print("Breakdown:")
    for item in trace['breakdown'][:5]:
        print(f"  - {item['name']}: {item['duration']:.2f}s ({item['type']})")
```

#### 메모리 누수 진단

```yaml
# memory-debug-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: memory-debug
  namespace: observability
spec:
  containers:
    - name: debug
      image: python:3.11-slim
      command: ["sleep", "infinity"]
      resources:
        requests:
          memory: "256Mi"
        limits:
          memory: "512Mi"
      env:
        - name: LANGFUSE_HOST
          value: "http://langfuse.observability.svc"
```

```python
# memory_profiler.py
import tracemalloc
import gc
from langfuse import Langfuse

def profile_langfuse_memory():
    """LangFuse 클라이언트 메모리 사용량 프로파일링"""
    tracemalloc.start()
    
    langfuse = Langfuse()
    
    # 여러 트레이스 생성
    for i in range(100):
        trace = langfuse.trace(name=f"test-trace-{i}")
        trace.generation(
            name="test-generation",
            input="test input",
            output="test output",
        )
    
    langfuse.flush()
    
    # 메모리 스냅샷
    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')
    
    print("Top 10 memory allocations:")
    for stat in top_stats[:10]:
        print(stat)
    
    # 가비지 컬렉션
    gc.collect()
    
    tracemalloc.stop()
```

### 성능 최적화 체크리스트

| 항목 | 확인 사항 | 권장 설정 |
| ---- | --------- | --------- |
| **배치 크기** | 트레이스 배치 전송 크기 | 100-500 |
| **플러시 간격** | 자동 플러시 주기 | 5-10초 |
| **연결 풀** | HTTP 연결 재사용 | 활성화 |
| **비동기 전송** | 백그라운드 전송 | 활성화 |
| **샘플링** | 고트래픽 시 샘플링 | 10-50% |

:::danger 주의사항
- 프로덕션에서 모든 트레이스를 저장하면 스토리지 비용이 급증할 수 있습니다
- 민감한 데이터(PII)가 트레이스에 포함되지 않도록 마스킹을 적용하세요
- LangFuse 데이터베이스의 정기적인 백업과 보존 정책을 설정하세요
:::


## 결론

AI Agent 모니터링은 Agentic AI 애플리케이션의 안정적인 운영과 지속적인 개선을 위해 필수적입니다. 이 문서에서 다룬 핵심 내용을 요약하면:

### 핵심 요약

1. **LangFuse 배포**: Kubernetes 환경에서 Self-hosted LangFuse를 배포하여 데이터 주권을 확보하고 비용을 최적화
2. **LangSmith 통합**: LangChain 기반 애플리케이션에서 간편하게 트레이싱 활성화
3. **핵심 메트릭**: Latency, Token Usage, Error Rate, Trace 분석을 통한 종합적인 모니터링
4. **Grafana 대시보드**: 실시간 모니터링과 알림을 통한 proactive 운영
5. **비용 추적**: 모델별, 테넌트별 비용 분석으로 예산 관리 및 최적화

### 모니터링 성숙도 모델

| 단계 | 수준 | 구현 내용 |
| ---- | ---- | --------- |
| **Level 1** | 기본 | 로그 수집, 기본 메트릭 |
| **Level 2** | 표준 | LangFuse/LangSmith 트레이싱, Grafana 대시보드 |
| **Level 3** | 고급 | 비용 추적, 품질 평가, 자동 알림 |
| **Level 4** | 최적화 | A/B 테스트, 자동 튜닝, 예측 분석 |

:::tip 다음 단계
- [Agentic AI Platform 아키텍처](./agentic-platform-architecture.md) - 전체 플랫폼 설계
- [Kagent Kubernetes Agent 관리](./kagent-kubernetes-agents.md) - 에이전트 배포 및 운영
- [RAG 평가 프레임워크](./ragas-evaluation.md) - Ragas를 활용한 품질 평가
:::

## 참고 자료

- [LangFuse Documentation](https://langfuse.com/docs)
- [LangFuse GitHub Repository](https://github.com/langfuse/langfuse)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [LangChain Callbacks](https://python.langchain.com/docs/modules/callbacks/)
