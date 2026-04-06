---
title: "AI Agent 모니터링 및 운영"
sidebar_label: "Agent 모니터링 & 운영"
description: "Langfuse, LangSmith를 활용한 Agentic AI 애플리케이션 모니터링, 알림 설정, 트러블슈팅 가이드"
tags: [eks, langfuse, langsmith, monitoring, observability, tracing, opentelemetry, operations, troubleshooting, alerting]
category: "genai-aiml"
last_update:
  date: 2026-04-05
  author: devfloor9
sidebar_position: 1
---

import {
  LangFuseVsLangSmithTable,
  LatencyMetricsTable,
  TokenUsageMetricsTable,
  ErrorRateMetricsTable,
  DailyChecksTable,
  WeeklyChecksTable,
  MaturityModelTable
} from '@site/src/components/AgentMonitoringTables';

# AI Agent 모니터링 및 운영

이 문서에서는 Langfuse와 LangSmith를 활용하여 Agentic AI 애플리케이션의 성능과 동작을 효과적으로 추적하고 모니터링하는 방법을 다룹니다. Kubernetes 환경에서의 배포부터 Grafana 대시보드 구성, 알림 설정, 그리고 트러블슈팅까지 실무에 필요한 전체 운영 가이드를 제공합니다.

## 개요

Agentic AI 애플리케이션은 복잡한 추론 체인과 다양한 도구 호출을 수행하기 때문에, 전통적인 APM(Application Performance Monitoring) 도구만으로는 충분한 가시성을 확보하기 어렵습니다. LLM 특화 관측성 도구인 Langfuse와 LangSmith는 다음과 같은 핵심 기능을 제공합니다:

- **트레이스 추적**: LLM 호출, 도구 실행, 에이전트 추론 과정의 전체 흐름 추적
- **토큰 사용량 분석**: 입력/출력 토큰 수 및 비용 계산
- **품질 평가**: 응답 품질 점수화 및 피드백 수집
- **디버깅**: 프롬프트 및 응답 내용 검토를 통한 문제 진단

:::info 대상 독자
이 문서는 플랫폼 운영자, MLOps 엔지니어, AI 개발자를 대상으로 합니다. Kubernetes와 Python에 대한 기본적인 이해가 필요합니다.
:::

## Langfuse vs LangSmith 비교

<LangFuseVsLangSmithTable />

:::tip 선택 가이드

- **Langfuse**: 데이터 주권이 중요하거나, 비용 최적화가 필요한 경우
- **LangSmith**: LangChain 기반 개발이 주력이고, 빠른 시작이 필요한 경우
:::


## Langfuse Kubernetes 배포

### 아키텍처 개요

Langfuse v2.75.0 이상은 다음 컴포넌트로 구성됩니다:

```mermaid
flowchart TB
    subgraph Clients["AI 애플리케이션"]
        AGENT1[Agent 1]
        AGENT2[Agent 2]
        AGENTN[Agent N]
    end

    subgraph Langfuse["Langfuse 스택"]
        WEB[Web UI<br/>Next.js]
        API[API Server<br/>tRPC]
        WORKER[Background<br/>Worker]
    end

    subgraph Storage["스토리지"]
        PG[(PostgreSQL<br/>메타데이터)]
        REDIS[(Redis<br/>캐시/큐)]
        S3[S3<br/>Blob]
    end

    AGENT1 -->|트레이스| API
    AGENT2 -->|트레이스| API
    AGENTN -->|트레이스| API
    WEB -->|조회| API
    API --> PG
    API --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    WORKER -->|아티팩트| S3

    style Clients fill:#ffd93d
    style Langfuse fill:#4285f4
    style Storage fill:#326ce5
```

### PostgreSQL 배포

Langfuse의 메타데이터 저장을 위한 PostgreSQL을 배포합니다.

```yaml
# langfuse-postgres.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    app.kubernetes.io/part-of: langfuse
---
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-postgres-secret
  namespace: monitoring
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
  namespace: monitoring
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
  namespace: monitoring
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
  namespace: monitoring
spec:
  selector:
    app: langfuse-postgres
  ports:
    - port: 5432
      targetPort: 5432
  clusterIP: None
```


### Langfuse Deployment

Langfuse 애플리케이션을 배포합니다.

```yaml
# langfuse-deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-secret
  namespace: monitoring
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
  namespace: monitoring
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
          image: langfuse/langfuse:2.75.0
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
  namespace: monitoring
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
  namespace: monitoring
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
  namespace: monitoring
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
- PostgreSQL은 Amazon RDS PostgreSQL을 사용하는 것을 강력히 권장합니다 (고가용성, 자동 백업, 관리형 업데이트)
- StatefulSet PostgreSQL은 개발/테스트 환경에만 사용하세요
:::

### AWS Secrets Manager 통합 (권장)

프로덕션 환경에서는 Kubernetes Secret 대신 AWS Secrets Manager와 External Secrets Operator를 사용하세요:

```yaml
# external-secrets-operator 설치
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace

# SecretStore 설정
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: monitoring
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: langfuse

# ExternalSecret 설정
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: langfuse-secret
  namespace: monitoring
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: langfuse-secret
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: langfuse/database-url
    - secretKey: NEXTAUTH_SECRET
      remoteRef:
        key: langfuse/nextauth-secret
    - secretKey: SALT
      remoteRef:
        key: langfuse/salt
    - secretKey: ENCRYPTION_KEY
      remoteRef:
        key: langfuse/encryption-key
```

### Amazon RDS PostgreSQL 사용 (권장)

프로덕션 환경에서는 StatefulSet PostgreSQL 대신 Amazon RDS를 사용하세요:

```yaml
# RDS PostgreSQL 연결 설정
apiVersion: v1
kind: Secret
metadata:
  name: langfuse-postgres-secret
  namespace: monitoring
type: Opaque
stringData:
  DATABASE_URL: "postgresql://langfuse:password@langfuse-db.xxxxxxxxxxxx.ap-northeast-2.rds.amazonaws.com:5432/langfuse?sslmode=require"
```

**RDS 장점:**
- 자동 백업 및 포인트인타임 복구
- Multi-AZ 고가용성
- 자동 패치 및 업데이트
- 성능 인사이트 및 모니터링
- 읽기 전용 복제본 지원


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


### Langfuse Python 통합

Langfuse를 Python 애플리케이션에 통합하는 방법입니다.

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

# Langfuse 클라이언트 초기화
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
    """Langfuse 트레이싱이 적용된 에이전트 실행"""

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
    """사용자 피드백을 Langfuse에 기록"""
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
flowchart TB
    subgraph Latency["지연시간 메트릭"]
        E2E[E2E 지연]
        LLM_LAT[LLM 추론]
        TOOL_LAT[도구 실행]
        RETRIEVAL_LAT[검색 지연]
    end

    subgraph Tokens["토큰 사용량"]
        INPUT_TOK[입력 토큰]
        OUTPUT_TOK[출력 토큰]
        TOTAL_TOK[총 토큰]
        COST[비용 USD]
    end

    subgraph Errors["오류율"]
        LLM_ERR[LLM 오류]
        TOOL_ERR[도구 오류]
        TIMEOUT[타임아웃]
        RATE_LIMIT[Rate Limit]
    end

    subgraph Traces["트레이스 분석"]
        CHAIN_LEN[체인 길이]
        TOOL_CALLS[도구 호출]
        ITERATIONS[반복 횟수]
        SUCCESS[성공률]
    end

    style Latency fill:#4285f4
    style Tokens fill:#34a853
    style Errors fill:#ea4335
    style Traces fill:#fbbc04
```

### Latency 메트릭

<LatencyMetricsTable />

### Token Usage 메트릭

<TokenUsageMetricsTable />

### Error Rate 메트릭

<ErrorRateMetricsTable />

### Prometheus 메트릭 수집 설정

```yaml
# prometheus-scrape-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-agent-scrape
  namespace: monitoring
data:
  agent-scrape.yaml: |
    scrape_configs:
      - job_name: 'langfuse'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - monitoring
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
    "gpt-4o": {"input": 0.0025, "output": 0.01},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "claude-sonnet-4": {"input": 0.003, "output": 0.015},
    "claude-3.5-haiku": {"input": 0.0008, "output": 0.004},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
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


## Grafana 대시보드 및 알림

### 대시보드 개요

AI Agent 모니터링을 위한 Grafana 대시보드를 구성합니다.

```mermaid
flowchart TB
    subgraph Overview["개요"]
        TOTAL_REQ[총 요청]
        SUCCESS_RATE[성공률]
        AVG_LATENCY[평균 지연]
        ACTIVE_USERS[활성 사용자]
    end

    subgraph Performance["성능"]
        LATENCY_CHART[지연 분포]
        THROUGHPUT[처리량]
        ERROR_RATE[오류율]
    end

    subgraph Cost["비용 & 사용량"]
        TOKEN_USAGE[토큰 사용]
        COST_BY_MODEL[모델별 비용]
        COST_BY_TENANT[테넌트별 비용]
    end

    subgraph Traces["트레이스"]
        TRACE_TABLE[최근 트레이스]
        SLOW_TRACES[느린 요청]
        ERROR_TRACES[오류 트레이스]
    end

    style Overview fill:#4285f4
    style Performance fill:#34a853
    style Cost fill:#fbbc04
    style Traces fill:#9c27b0
```

### Grafana 알림 규칙

```yaml
# grafana-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-alert-rules
  namespace: monitoring
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


## 운영 체크리스트

### 일일 점검 항목

<DailyChecksTable />

### 주간 점검 항목

<WeeklyChecksTable />


## 트러블슈팅 가이드

### GPU OOM (Out of Memory) 문제

#### 증상

```
CUDA out of memory. Tried to allocate X GiB
RuntimeError: CUDA error: out of memory
```

#### 진단

```bash
# GPU 메모리 상태 확인
kubectl exec -it <pod-name> -n inference -- nvidia-smi

# DCGM 메트릭 확인
kubectl exec -it <dcgm-exporter-pod> -n monitoring -- dcgmi dmon -e 155,156
```

#### 해결 방안

```yaml
# 1. 배치 크기 줄이기
env:
- name: MAX_BATCH_SIZE
  value: "16"  # 32에서 16으로 감소

# 2. 모델 양자화 적용
env:
- name: QUANTIZATION
  value: "int8"  # 또는 "fp8"

# 3. KV 캐시 크기 제한
env:
- name: MAX_NUM_SEQS
  value: "128"  # 동시 시퀀스 수 제한
```

### 네트워크 지연 문제

#### 증상

- 추론 요청 타임아웃
- 모델 간 통신 지연
- NCCL 타임아웃 (분산 추론 시)

#### 해결 방안

```yaml
# 1. Pod Anti-Affinity로 분산 배치
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchLabels:
            app: inference
        topologyKey: "topology.kubernetes.io/zone"

# 2. 타임아웃 증가
env:
- name: NCCL_TIMEOUT
  value: "1800"  # 30분
- name: REQUEST_TIMEOUT
  value: "300"   # 5분
```

### Langfuse 연결 오류

```bash
# 증상: Langfuse에 트레이스가 기록되지 않음

# 1. Langfuse 서비스 상태 확인
kubectl get pods -n monitoring -l app=langfuse

# 2. Langfuse 로그 확인
kubectl logs -n monitoring -l app=langfuse --tail=100

# 3. 네트워크 연결 테스트
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl -v http://langfuse.monitoring.svc/api/public/health

# 4. 환경 변수 확인
kubectl exec -n ai-agents <pod-name> -- env | grep LANGFUSE
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

# 2025년 기준 모델 가격
MODEL_PRICING: Dict[str, ModelPricing] = {
    # OpenAI
    "gpt-4o": ModelPricing(0.0025, 0.01),
    "gpt-4o-mini": ModelPricing(0.00015, 0.0006),
    "gpt-4-turbo": ModelPricing(0.01, 0.03),

    # Anthropic
    "claude-sonnet-4": ModelPricing(0.003, 0.015),
    "claude-3.5-haiku": ModelPricing(0.0008, 0.004),
    "claude-3-opus": ModelPricing(0.015, 0.075),
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
```

### 비용 대시보드 쿼리

```promql
# 일별 총 비용
sum(increase(llm_cost_dollars_total[24h]))

# 테넌트별 일별 비용
sum(increase(llm_cost_dollars_total[24h])) by (tenant_id)

# 모델별 비용 비율
sum(increase(llm_cost_dollars_total[24h])) by (model)
/ ignoring(model) group_left
sum(increase(llm_cost_dollars_total[24h]))

# 예산 대비 사용률 (월간)
sum(increase(llm_cost_dollars_total[30d])) by (tenant_id)
/ on(tenant_id) group_left
tenant_monthly_budget_usd
```

:::tip 비용 최적화 팁

1. **모델 선택 최적화**: 간단한 작업에는 저렴한 모델(GPT-4o-mini, Claude 3.5 Haiku) 사용
2. **프롬프트 최적화**: 불필요한 컨텍스트 제거로 입력 토큰 절감
3. **캐싱 활용**: 반복적인 쿼리에 대한 응답 캐싱
4. **배치 처리**: 가능한 경우 요청을 배치로 처리하여 오버헤드 감소
:::


## AMP/AMG + vLLM GPU 모니터링 실전 구성

### 개요

Amazon Managed Prometheus (AMP)와 Amazon Managed Grafana (AMG)를 사용하여 vLLM GPU 모니터링 스택을 구성합니다. 이를 통해 LLM 추론부터 GPU 하드웨어까지 전체 계층의 메트릭을 통합 대시보드에서 확인할 수 있습니다.

### AMP 워크스페이스 생성

```bash
# AMP 워크스페이스 생성
aws amp create-workspace \
  --alias "vllm-inference-metrics" \
  --region ap-northeast-2

# 워크스페이스 ID 확인
export AMP_WORKSPACE_ID=$(aws amp list-workspaces \
  --region ap-northeast-2 \
  --query 'workspaces[?alias==`vllm-inference-metrics`].workspaceId' \
  --output text)

echo "AMP Workspace ID: $AMP_WORKSPACE_ID"
```

### Prometheus → AMP Remote Write 설정

EKS 클러스터의 Prometheus가 AMP로 메트릭을 전송하도록 구성합니다.

```yaml
# prometheus-amp-remote-write.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-server
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    remote_write:
      - url: https://aps-workspaces.ap-northeast-2.amazonaws.com/workspaces/${AMP_WORKSPACE_ID}/api/v1/remote_write
        queue_config:
          max_samples_per_send: 1000
          max_shards: 200
          capacity: 2500
        sigv4:
          region: ap-northeast-2
    
    scrape_configs:
      # vLLM 메트릭
      - job_name: 'vllm'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - ai-inference
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: vllm
            action: keep
        metrics_path: /metrics
      
      # DCGM Exporter (GPU 메트릭)
      - job_name: 'dcgm-exporter'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - monitoring
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: dcgm-exporter
            action: keep
      
      # Node Exporter (인프라 메트릭)
      - job_name: 'node-exporter'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - monitoring
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: node-exporter
            action: keep
      
      # kgateway (게이트웨이 메트릭)
      - job_name: 'kgateway'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - kgateway-system
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: kgateway
            action: keep
        metrics_path: /metrics
```

### IAM 권한 설정 (Pod Identity)

Prometheus Pod가 AMP에 메트릭을 쓸 수 있도록 IAM 권한을 부여합니다.

```yaml
# prometheus-serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus-server
  namespace: monitoring
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/PrometheusRemoteWriteRole
```

IAM Role 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "aps:RemoteWrite",
        "aps:GetSeries",
        "aps:GetLabels",
        "aps:GetMetricMetadata"
      ],
      "Resource": "arn:aws:aps:ap-northeast-2:123456789012:workspace/${AMP_WORKSPACE_ID}"
    }
  ]
}
```

### AMG 워크스페이스 생성 및 사용자 권한

```bash
# AMG 워크스페이스 생성
aws grafana create-workspace \
  --account-access-type CURRENT_ACCOUNT \
  --authentication-providers AWS_SSO \
  --permission-type SERVICE_MANAGED \
  --workspace-name "vllm-monitoring" \
  --region ap-northeast-2

# 워크스페이스 ID 확인
export AMG_WORKSPACE_ID=$(aws grafana list-workspaces \
  --region ap-northeast-2 \
  --query 'workspaces[?name==`vllm-monitoring`].id' \
  --output text)

echo "AMG Workspace ID: $AMG_WORKSPACE_ID"
```

### IAM Identity Center 사용자 권한 부여

```bash
# IAM Identity Center 사용자에게 Grafana Admin 권한 부여
aws grafana update-permissions \
  --user-id "user-id-from-identity-center" \
  --user-type "SSO_USER" \
  --permissions-type "ADMIN" \
  --workspace-id $AMG_WORKSPACE_ID \
  --region ap-northeast-2
```

### AMP를 AMG 데이터 소스로 연결

AMG 웹 콘솔에서:

1. Configuration → Data Sources → Add data source
2. Prometheus 선택
3. URL: `https://aps-workspaces.ap-northeast-2.amazonaws.com/workspaces/${AMP_WORKSPACE_ID}`
4. Auth: SigV4 활성화
   - Region: `ap-northeast-2`
   - Service: `aps`
5. Save & Test

:::caution SigV4 auth type 주의
AMG에서 AMP 데이터 소스 추가 시 `sigV4AuthType`을 반드시 `ec2_iam_role`로 설정하세요. `workspace-iam-role`은 유효하지 않은 값으로 502 에러를 반환합니다.
:::

:::tip Pod Identity vs IRSA
EKS 1.28+ 클러스터에서는 **Pod Identity**를 권장합니다. IRSA와 달리 OIDC Provider 설정이 불필요하며, `aws eks create-pod-identity-association` 한 줄로 설정 완료됩니다.
:::

### 모니터링 데이터 연결성 (계층별)

| 계층 | 수집 도구 | 메트릭 패턴 | 확인 가능 항목 |
|------|----------|-----------|--------------|
| **LLM 추론** | Langfuse | trace, generation | 토큰 사용량, 비용, TTFT, 사용자별 패턴 |
| **모델 서버** | vLLM Prometheus | `vllm_*` | 요청 수, 배치 크기, KV cache 사용률, TPS |
| **GPU** | DCGM Exporter | `DCGM_FI_DEV_*` | GPU 활용도, 온도, 전력, 메모리 사용량 |
| **인프라** | Node Exporter | `node_*` | CPU, 메모리, 네트워크, 디스크 I/O |
| **게이트웨이** | kgateway | `envoy_*` | 요청 수, 레이턴시, 에러율, 업스트림 상태 |

### PromQL 쿼리 예시

#### GPU 평균 활용도

```promql
# 전체 GPU 평균 활용도
avg(DCGM_FI_DEV_GPU_UTIL)

# 노드별 GPU 활용도
avg(DCGM_FI_DEV_GPU_UTIL) by (Hostname)

# GPU 메모리 사용률
avg(DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE * 100) by (gpu)
```

#### 초당 생성 토큰

```promql
# 전체 TPS
rate(vllm_generation_tokens_total[5m])

# 모델별 TPS
sum(rate(vllm_generation_tokens_total[5m])) by (model)

# 배치 크기 평균
avg(vllm_num_requests_running)
```

#### TTFT P99 (Time to First Token)

```promql
# TTFT P99
histogram_quantile(0.99, rate(vllm_time_to_first_token_seconds_bucket[5m]))

# TTFT P95
histogram_quantile(0.95, rate(vllm_time_to_first_token_seconds_bucket[5m]))

# E2E 지연 P99
histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m]))
```

#### 게이트웨이 5xx 에러율

```promql
# 5xx 에러율 (%)
rate(envoy_http_downstream_rq_xx{envoy_response_code_class="5"}[5m]) 
/ 
rate(envoy_http_downstream_rq_total[5m]) * 100

# 업스트림 헬스 체크 실패율
sum(rate(envoy_cluster_upstream_cx_connect_fail[5m])) by (envoy_cluster_name)
```

### 데이터 흐름 다이어그램

```mermaid
flowchart TB
    subgraph Sources["메트릭 수집원"]
        VLLM[vLLM<br/>:8000/metrics]
        DCGM[DCGM Exporter<br/>:9400/metrics]
        NODE[Node Exporter<br/>:9100/metrics]
        KGATEWAY[kgateway<br/>:9091/metrics]
    end
    
    subgraph Collector["수집기"]
        PROM[Prometheus<br/>ServiceMonitor]
    end
    
    subgraph AWS["AWS 관리형 서비스"]
        AMP[Amazon Managed<br/>Prometheus]
        AMG[Amazon Managed<br/>Grafana]
    end
    
    VLLM --> PROM
    DCGM --> PROM
    NODE --> PROM
    KGATEWAY --> PROM
    
    PROM -->|Remote Write<br/>SigV4 Auth| AMP
    AMP -->|Query| AMG
    
    style VLLM fill:#ffd93d,stroke:#333
    style DCGM fill:#76b900,stroke:#333
    style NODE fill:#326ce5,stroke:#333
    style KGATEWAY fill:#326ce5,stroke:#333
    style PROM fill:#e53935,stroke:#333
    style AMP fill:#ff9900,stroke:#333
    style AMG fill:#ff9900,stroke:#333
```

### Grafana 대시보드 패널 예시

#### 1. GPU 활용도 타임시리즈

```json
{
  "title": "GPU Utilization (%)",
  "targets": [
    {
      "expr": "avg(DCGM_FI_DEV_GPU_UTIL) by (gpu)",
      "legendFormat": "GPU {{gpu}}"
    }
  ],
  "type": "timeseries"
}
```

#### 2. vLLM 요청 처리량

```json
{
  "title": "vLLM Requests per Second",
  "targets": [
    {
      "expr": "rate(vllm_request_success_total[5m])",
      "legendFormat": "Success"
    },
    {
      "expr": "rate(vllm_request_failure_total[5m])",
      "legendFormat": "Failure"
    }
  ],
  "type": "graph"
}
```

#### 3. 토큰 사용량 (Langfuse 데이터)

Langfuse는 자체 API를 제공하므로 Grafana에서 HTTP 데이터소스로 연결하거나 ClickHouse를 직접 쿼리합니다.

```sql
-- ClickHouse 쿼리 (Grafana ClickHouse 플러그인 사용)
SELECT
  toStartOfInterval(timestamp, INTERVAL 1 HOUR) as time,
  model,
  sum(usage_input + usage_output) as total_tokens
FROM traces
WHERE timestamp > now() - INTERVAL 24 HOUR
GROUP BY time, model
ORDER BY time
```

### 알림 규칙 예시

```yaml
# amp-alert-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: vllm-gpu-alerts
  namespace: monitoring
spec:
  groups:
    - name: gpu-alerts
      interval: 30s
      rules:
        - alert: HighGPUTemperature
          expr: DCGM_FI_DEV_GPU_TEMP > 85
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "GPU {{ $labels.gpu }} temperature is high"
            description: "GPU temperature: {{ $value }}°C"
        
        - alert: GPUMemoryFull
          expr: (DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE * 100) > 95
          for: 3m
          labels:
            severity: critical
          annotations:
            summary: "GPU {{ $labels.gpu }} memory is nearly full"
        
        - alert: HighVLLMLatency
          expr: histogram_quantile(0.99, rate(vllm_e2e_request_latency_seconds_bucket[5m])) > 30
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "vLLM P99 latency is above 30s"
```

### 통합 대시보드 구성

AMG에서 다음 패널을 포함하는 통합 대시보드를 구성합니다:

1. **상단**: 전체 요약 (총 요청, 성공률, 평균 지연, 비용)
2. **LLM 계층**: 토큰 사용량, TTFT/TPS, 모델별 요청 수
3. **GPU 계층**: GPU 활용도, 온도, 메모리, 전력
4. **인프라 계층**: CPU, 메모리, 네트워크, 디스크
5. **게이트웨이 계층**: 요청 수, 에러율, 업스트림 상태

:::tip 모니터링 베스트 프랙티스

1. **계층별 메트릭 연결**: LLM 요청 증가 → GPU 활용도 상승 → 인프라 부하 증가 상관관계 분석
2. **이상 탐지**: P99 지연이 갑자기 증가하면 GPU 온도나 메모리 사용량 동시 확인
3. **용량 계획**: 평균 GPU 활용도가 70% 이상이면 추가 GPU 노드 프로비저닝 고려
4. **비용 최적화**: TTFT가 낮은 모델을 우선 사용하여 사용자 경험 개선 + 처리량 증가
:::

---

## 결론

AI Agent 모니터링은 Agentic AI 애플리케이션의 안정적인 운영과 지속적인 개선을 위해 필수적입니다. 이 문서에서 다룬 핵심 내용을 요약하면:

### AWS 네이티브 관측성: CloudWatch Generative AI Observability

:::tip re:Invent 2025 신규 서비스
Amazon CloudWatch Generative AI Observability는 2025년 10월 GA로 출시된 AI 워크로드 전용 관측성 서비스입니다. Langfuse/LangSmith와 함께 또는 대안으로 활용할 수 있습니다.
:::

CloudWatch Generative AI Observability는 LLM 및 AI 에이전트 모니터링을 위한 AWS 네이티브 솔루션입니다:

- **인프라 무관 모니터링**: Bedrock, EKS, ECS, 온프레미스 등 모든 환경의 AI 워크로드 지원
- **에이전트/도구 추적**: 에이전트, 지식 베이스, 도구 호출에 대한 기본 제공 뷰
- **엔드투엔드 트레이싱**: 전체 AI 스택에 걸친 추적
- **토큰 및 지연 메트릭**: 네이티브 LLM 트레이싱
- **프레임워크 호환**: LangChain, LangGraph, CrewAI 등 외부 프레임워크 지원

Langfuse v2.75.0 (Self-hosted 데이터 주권)와 CloudWatch Gen AI Observability(AWS 네이티브 통합)를 함께 사용하면 가장 포괄적인 관측성을 확보할 수 있습니다.

또한 **CloudWatch Application Signals**를 활용하면 EKS 워크로드의 자동 텔레메트리 수집, 서비스 관계 시각화, SLI/SLO 모니터링이 가능합니다. 코드 변경 없이 ADOT(AWS Distro for OpenTelemetry) 기반 자동 계측을 지원합니다.

### 핵심 요약

1. **Langfuse 배포**: Kubernetes 환경에서 Self-hosted Langfuse를 배포하여 데이터 주권을 확보하고 비용을 최적화
2. **LangSmith 통합**: LangChain 기반 애플리케이션에서 간편하게 트레이싱 활성화
3. **핵심 메트릭**: Latency, Token Usage, Error Rate, Trace 분석을 통한 종합적인 모니터링
4. **Grafana 대시보드**: 실시간 모니터링과 알림을 통한 proactive 운영
5. **비용 추적**: 모델별, 테넌트별 비용 분석으로 예산 관리 및 최적화
6. **트러블슈팅**: GPU OOM, 네트워크 지연, 모델 로딩 실패 등 일반적인 문제 해결

### 모니터링 성숙도 모델

<MaturityModelTable />

:::tip 다음 단계

- [Agentic AI Platform 아키텍처](../design-architecture/agentic-platform-architecture.md) - 전체 플랫폼 설계
- [Kagent Kubernetes Agent 관리](../agent-data/kagent-kubernetes-agents.md) - 에이전트 배포 및 운영
- [RAG 평가 프레임워크](./ragas-evaluation.md) - Ragas를 활용한 품질 평가
:::

## 참고 자료

- [Langfuse Documentation](https://langfuse.com/docs)
- [Langfuse GitHub Repository](https://github.com/langfuse/langfuse)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [CloudWatch Generative AI Observability](https://aws.amazon.com/blogs/mt/launching-amazon-cloudwatch-generative-ai-observability-preview/)
- [CloudWatch Application Signals](https://aws.amazon.com/blogs/mt/amazon-cloudwatch-application-signals-new-enhancements-for-application-monitoring/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
- [LangChain Callbacks](https://python.langchain.com/docs/modules/callbacks/)
