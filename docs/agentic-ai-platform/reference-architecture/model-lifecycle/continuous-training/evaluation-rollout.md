---
title: "Eval Gate · Registry · KPI"
sidebar_label: "Evaluation & Rollout"
description: "학습된 체크포인트의 Threshold 검증, kgateway 기반 Canary 점진 배포, MLflow Registry 버전 관리, 회귀 시 자동 롤백, 비용·품질 KPI 대시보드 구성."
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 16
tags:
  - continuous-training
  - canary
  - mlflow
  - rollback
  - monitoring
  - scope:impl
sidebar_position: 4
---

## Eval Gate

### Threshold 검증

학습된 모델은 배포 전 품질 기준선(threshold)을 통과해야 합니다.

```python
# eval_gate.py
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# 테스트 데이터셋 (프로덕션 대표 샘플 500개)
test_dataset = load_test_dataset('s3://training-data-lake/test-dataset.parquet')

# 신규 모델 평가
new_model_results = evaluate(
    test_dataset,
    model='glm-5-dpo-checkpoint-1000',
    metrics=[faithfulness, answer_relevancy]
)

# 기준선 모델 평가
baseline_results = evaluate(
    test_dataset,
    model='glm-5-baseline',
    metrics=[faithfulness, answer_relevancy]
)

# Threshold 검증
THRESHOLDS = {
    'faithfulness': 0.85,
    'answer_relevancy': 0.80,
}

REGRESSION_TOLERANCE = {
    'faithfulness': 0.03,  # 3%p 이상 하락 시 실패
    'p99_latency_ms': 0.10,  # 10% 이상 증가 시 실패
}

def check_eval_gate(new, baseline, thresholds, regression):
    failures = []
    
    # 절대 Threshold 검증
    for metric, threshold in thresholds.items():
        if new[metric] < threshold:
            failures.append(f"{metric}: {new[metric]:.3f} < {threshold}")
    
    # 회귀 검증
    if baseline['faithfulness'] - new['faithfulness'] > regression['faithfulness']:
        failures.append(f"Faithfulness regression: {baseline['faithfulness']:.3f} → {new['faithfulness']:.3f}")
    
    if (new['p99_latency_ms'] - baseline['p99_latency_ms']) / baseline['p99_latency_ms'] > regression['p99_latency_ms']:
        failures.append(f"Latency regression: {baseline['p99_latency_ms']:.0f}ms → {new['p99_latency_ms']:.0f}ms")
    
    if failures:
        print("❌ Eval Gate FAILED:")
        for f in failures:
            print(f"  - {f}")
        return False
    else:
        print("✅ Eval Gate PASSED")
        return True

passed = check_eval_gate(new_model_results, baseline_results, THRESHOLDS, REGRESSION_TOLERANCE)
```

### Canary Deployment (kgateway)

[Gateway API](https://gateway-api.sigs.k8s.io/)의 HTTPRoute를 사용하여 트래픽을 점진적으로 전환합니다.

#### Stage 1: 5% Canary

```yaml
# canary-5-percent.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-serving-canary
  namespace: model-serving
spec:
  parentRefs:
  - name: inference-gateway
    namespace: kgateway-system
  
  hostnames:
  - "api.example.com"
  
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat/completions
    
    backendRefs:
    # 기존 stable 버전 (95%)
    - name: vllm-glm5-stable
      port: 8000
      weight: 95
    
    # 신규 canary 버전 (5%)
    - name: vllm-glm5-canary
      port: 8000
      weight: 5
```

#### Stage 2: 25% (24시간 후 문제 없으면)

```yaml
# canary-25-percent.yaml
backendRefs:
- name: vllm-glm5-stable
  port: 8000
  weight: 75
- name: vllm-glm5-canary
  port: 8000
  weight: 25
```

#### Stage 3: 100% (7일 후 최종 승격)

```yaml
# canary-100-percent.yaml
backendRefs:
- name: vllm-glm5-canary
  port: 8000
  weight: 100
```

### Canary 모니터링

```yaml
# canary-monitor-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-canary-rules
  namespace: monitoring
data:
  canary-alerts.yml: |
    groups:
    - name: canary-monitoring
      interval: 30s
      rules:
      # Faithfulness 회귀 감지
      - alert: CanaryFaithfulnessDrop
        expr: |
          (
            avg_over_time(langfuse_trace_faithfulness{model="glm5-canary"}[1h])
            -
            avg_over_time(langfuse_trace_faithfulness{model="glm5-stable"}[1h])
          ) < -0.03
        for: 10m
        annotations:
          summary: "Canary 모델 faithfulness 3%p 이상 하락"
          description: "Canary: {{ $value | humanize }}pp drop"
      
      # P99 레이턴시 회귀
      - alert: CanaryLatencyRegression
        expr: |
          (
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-canary"})
            /
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-stable"})
          ) > 1.10
        for: 5m
        annotations:
          summary: "Canary 모델 P99 레이턴시 10% 이상 증가"
      
      # 에러율 증가
      - alert: CanaryErrorRateHigh
        expr: |
          rate(vllm_request_errors_total{model="glm5-canary"}[5m])
          >
          rate(vllm_request_errors_total{model="glm5-stable"}[5m]) * 2
        for: 5m
        annotations:
          summary: "Canary 모델 에러율 2배 이상 증가"
```

### CI 통합 (Argo Workflows)

```yaml
# canary-deployment-workflow.yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: canary-deployment-
  namespace: training-pipeline
spec:
  entrypoint: canary-pipeline
  
  templates:
  - name: canary-pipeline
    steps:
    # Step 1: Eval Gate
    - - name: eval-gate
        template: run-eval-gate
    
    # Step 2: Canary 5%
    - - name: deploy-canary-5
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "5"
        when: "{{steps.eval-gate.outputs.result}} == passed"
    
    # Step 3: 24시간 대기 + 모니터링
    - - name: monitor-24h
        template: monitor-canary
        arguments:
          parameters:
          - name: duration
            value: "24h"
    
    # Step 4: Canary 25%
    - - name: deploy-canary-25
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "25"
        when: "{{steps.monitor-24h.outputs.result}} == healthy"
    
    # Step 5: 7일 대기
    - - name: monitor-7d
        template: monitor-canary
        arguments:
          parameters:
          - name: duration
            value: "168h"
    
    # Step 6: 100% 승격
    - - name: promote-to-production
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "100"
        when: "{{steps.monitor-7d.outputs.result}} == healthy"
  
  - name: run-eval-gate
    script:
      image: python:3.11
      command: [python]
      source: |
        # (위 eval_gate.py 코드)
        passed = check_eval_gate(...)
        print("passed" if passed else "failed")
  
  - name: apply-canary-weight
    inputs:
      parameters:
      - name: weight
    resource:
      action: apply
      manifest: |
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: model-serving-canary
        spec:
          rules:
          - backendRefs:
            - name: vllm-glm5-stable
              weight: {{100 - inputs.parameters.weight}}
            - name: vllm-glm5-canary
              weight: {{inputs.parameters.weight}}
  
  - name: monitor-canary
    inputs:
      parameters:
      - name: duration
    script:
      image: curlimages/curl:latest
      command: [sh]
      source: |
        # Prometheus에서 canary 메트릭 조회
        sleep {{inputs.parameters.duration}}
        
        # Faithfulness 확인
        faithfulness_drop=$(curl -s 'http://prometheus:9090/api/v1/query?query=...')
        if [ "$faithfulness_drop" -lt "-0.03" ]; then
          echo "unhealthy"
          exit 1
        fi
        
        echo "healthy"
```

## Registry & Rollback

### MLflow Model Registry

[MLflow](https://mlflow.org/)는 모델 버전 관리와 라이프사이클을 추적합니다.

```python
# mlflow_registry.py
import mlflow
from mlflow.tracking import MlflowClient

mlflow.set_tracking_uri("http://mlflow-server.mlflow.svc.cluster.local:5000")
client = MlflowClient()

# 신규 모델 등록
model_uri = "s3://training-checkpoints/grpo-run-001/checkpoint-1000"

with mlflow.start_run(run_name="grpo-iteration-001"):
    # 메트릭 로깅
    mlflow.log_metrics({
        "faithfulness": 0.92,
        "answer_relevancy": 0.88,
        "p99_latency_ms": 850,
        "training_loss": 0.15,
    })
    
    # 모델 등록
    mlflow.register_model(
        model_uri=model_uri,
        name="glm-5-grpo",
        tags={
            "iteration": "001",
            "training_date": "2026-04-18",
            "base_model": "glm-5-32b",
            "method": "GRPO",
            "eval_gate_status": "passed",
        }
    )

# Stage 전환 (None → Staging → Production)
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Staging",  # Canary 배포 중
)

# 7일 후 Production 승격
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Production",
)

# 이전 버전 Archive
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=0,  # 이전 baseline 모델
    stage="Archived",
)
```

### Agent Versioning 연계

[Agent Versioning](../../../aidlc/enterprise/agent-versioning/index.md)은 에이전트 코드와 모델 버전을 동기화합니다.

```yaml
# agent-version-manifest.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-version-config
  namespace: agentic-platform
data:
  versions.yaml: |
    agents:
      - name: code-assistant
        version: v2.3.0
        model:
          name: glm-5-grpo
          version: 1
          registry: mlflow
          stage: Production
        tools:
          - mcp-github
          - mcp-jira
        prompt_version: v2.3.0
      
      - name: docs-writer
        version: v1.5.0
        model:
          name: glm-5-grpo
          version: 0  # 아직 이전 버전 사용
          registry: mlflow
          stage: Production
```

### Bedrock Agents 하이브리드 동기

하이브리드 아키텍처(EKS + Bedrock)에서는 EKS 모델 업데이트를 Bedrock Agent에도 반영해야 합니다.

```python
# sync_to_bedrock.py
import boto3

bedrock = boto3.client('bedrock-agent')

# EKS 신규 모델 정보
eks_model_version = "glm-5-grpo-v1"
eks_endpoint = "http://vllm-glm5-canary.model-serving.svc.cluster.local:8000"

# Bedrock Agent 업데이트
bedrock.update_agent(
    agentId='AGENT123',
    agentName='code-assistant',
    foundationModel='anthropic.claude-3-sonnet-20240229-v1:0',  # fallback 모델
    instruction=f"""
    Use the custom EKS model for code generation tasks:
    - Model: {eks_model_version}
    - Endpoint: {eks_endpoint}
    
    Fallback to Claude Sonnet if EKS model is unavailable.
    """,
)
```

### Rollback YAML

회귀 발견 시 즉시 이전 stable 버전으로 롤백합니다.

```yaml
# rollback-to-stable.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-serving-rollback
  namespace: model-serving
spec:
  rules:
  - backendRefs:
    # Canary 제거, 100% stable로 복구
    - name: vllm-glm5-stable
      port: 8000
      weight: 100
---
# Canary Deployment 정지
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-glm5-canary
  namespace: model-serving
spec:
  replicas: 0  # 즉시 스케일다운
```

**Rollback 자동화 (Argo Rollouts):**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: vllm-glm5
  namespace: model-serving
spec:
  replicas: 3
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 24h}
      - setWeight: 25
      - pause: {duration: 168h}
      - setWeight: 100
      
      # 자동 롤백 조건
      analysis:
        templates:
        - templateName: canary-quality-check
        args:
        - name: service-name
          value: vllm-glm5-canary
  
  revisionHistoryLimit: 5  # 최근 5개 버전 유지
```

### Checkpoint 보존 정책

S3 체크포인트는 lifecycle 정책으로 비용 최적화합니다.

```json
{
  "Rules": [
    {
      "Id": "archive-old-checkpoints",
      "Status": "Enabled",
      "Prefix": "training-checkpoints/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER_IR"
        },
        {
          "Days": 90,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    },
    {
      "Id": "keep-production-checkpoints",
      "Status": "Enabled",
      "Prefix": "training-checkpoints/production/",
      "Transitions": [],
      "Expiration": null
    }
  ]
}
```

**보존 전략:**

- **최근 30일**: S3 Standard (즉시 접근)
- **30-90일**: Glacier Instant Retrieval (드문 액세스)
- **90-365일**: Glacier Deep Archive (장기 보관)
- **Production 체크포인트**: 영구 보존

## 관측·비용 KPI

### GPU-hours per Quality Improvement

**KPI 정의**: Faithfulness 0.01 상승당 소요된 GPU 시간과 비용

```python
# kpi_calculation.py
import pandas as pd

# 학습 이력
training_runs = pd.DataFrame([
    {'iteration': 1, 'gpu_hours': 96, 'cost_usd': 1200, 'faithfulness_delta': 0.02},
    {'iteration': 2, 'gpu_hours': 120, 'cost_usd': 1500, 'faithfulness_delta': 0.015},
    {'iteration': 3, 'gpu_hours': 144, 'cost_usd': 1800, 'faithfulness_delta': 0.01},
])

# KPI 계산
training_runs['gpu_hours_per_0.01_improvement'] = training_runs['gpu_hours'] / (training_runs['faithfulness_delta'] * 100)
training_runs['cost_per_0.01_improvement'] = training_runs['cost_usd'] / (training_runs['faithfulness_delta'] * 100)

print(training_runs)
```

**결과 예시:**

| iteration | gpu_hours | cost_usd | faithfulness_delta | gpu_hours_per_0.01 | cost_per_0.01 |
|-----------|-----------|----------|-------------------|-------------------|--------------|
| 1 | 96 | $1,200 | 0.020 | 48 | $600 |
| 2 | 120 | $1,500 | 0.015 | 80 | $1,000 |
| 3 | 144 | $1,800 | 0.010 | 144 | $1,800 |

**해석**: 초기에는 빠른 개선이 가능하지만, iteration이 진행될수록 **수익체감(diminishing returns)** 발생. 비용 대비 효율이 떨어지면 학습 중단 고려.

### AMP Recording Rule

Prometheus Recording Rule로 KPI를 사전 계산하여 대시보드 쿼리 성능을 최적화합니다.

```yaml
# amp-recording-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: continuous-training-recording-rules
  namespace: monitoring
data:
  rules.yml: |
    groups:
    - name: continuous-training-kpi
      interval: 1m
      rules:
      # 모델별 평균 Faithfulness (1시간 윈도우)
      - record: model:faithfulness:avg1h
        expr: |
          avg_over_time(langfuse_trace_faithfulness[1h])
      
      # Canary vs Stable Faithfulness 차이
      - record: canary:faithfulness:delta
        expr: |
          model:faithfulness:avg1h{model="glm5-canary"}
          -
          model:faithfulness:avg1h{model="glm5-stable"}
      
      # GPU 사용 시간 (누적)
      - record: training:gpu_hours:total
        expr: |
          sum(
            rate(container_gpu_allocation{namespace="training-pipeline"}[5m])
          ) * 3600
      
      # 학습 비용 추정 (GPU-hour × $12.5)
      - record: training:cost_usd:total
        expr: |
          training:gpu_hours:total * 12.5
      
      # Quality Improvement per Dollar
      - record: training:improvement_per_dollar
        expr: |
          increase(model:faithfulness:avg1h[7d])
          /
          increase(training:cost_usd:total[7d])
```

### Grafana 대시보드

```json
{
  "dashboard": {
    "title": "Continuous Training KPI",
    "panels": [
      {
        "title": "Faithfulness Trend (7d)",
        "targets": [
          {
            "expr": "model:faithfulness:avg1h{model=\"glm5-canary\"}"
          },
          {
            "expr": "model:faithfulness:avg1h{model=\"glm5-stable\"}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Training Cost per Week",
        "targets": [
          {
            "expr": "increase(training:cost_usd:total[7d])"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Quality Improvement per $1000",
        "targets": [
          {
            "expr": "training:improvement_per_dollar * 1000"
          }
        ],
        "type": "gauge",
        "thresholds": [
          {"value": 0, "color": "red"},
          {"value": 0.005, "color": "yellow"},
          {"value": 0.01, "color": "green"}
        ]
      },
      {
        "title": "Canary Deployment Timeline",
        "targets": [
          {
            "expr": "sum(rate(vllm_request_success_total{model=\"glm5-canary\"}[5m])) / sum(rate(vllm_request_success_total[5m]))"
          }
        ],
        "type": "graph",
        "annotations": [
          {"text": "Canary 5%", "time": "2026-04-18T06:00:00Z"},
          {"text": "Canary 25%", "time": "2026-04-19T06:00:00Z"},
          {"text": "Production 100%", "time": "2026-04-25T06:00:00Z"}
        ]
      }
    ]
  }
}
```

### 주간/월간 Cadence 권장

| 주기 | 액션 | 목표 |
|------|------|------|
| **주간** | Trace 수집 → Reward Labeling | 최소 5,000개 고품질 trace 확보 |
| **격주** | GRPO/DPO 학습 iteration | Faithfulness +0.01 개선 |
| **월간** | 전체 평가 + Canary 배포 | 프로덕션 품질 1% 개선 |
| **분기** | 비용 대비 ROI 분석 | 학습 중단/지속 의사결정 |

**권장 시작 주기:**

- **초기 3개월**: 격주 iteration (빠른 개선)
- **성숙기 (6개월+)**: 월간 iteration (안정화)

### 손익 분기 분석

```python
# roi_analysis.py
# 가정: 모델 품질 1% 개선 → 사용자 만족도 5% 증가 → 이탈률 2% 감소

# 현재 지표
monthly_revenue = 100_000  # $100K/월
churn_rate = 0.10  # 10% 월간 이탈률
ltv_per_user = 5_000  # 사용자 생애 가치 $5K

# 학습 비용
training_cost_per_iteration = 2_000
iterations_per_month = 2
monthly_training_cost = training_cost_per_iteration * iterations_per_month  # $4K

# 품질 개선 효과
quality_improvement_per_month = 0.01  # 1% faithfulness 증가
churn_reduction = quality_improvement_per_month * 2  # 2% 이탈률 감소

# 매출 증대
retained_users = (monthly_revenue / ltv_per_user) * churn_reduction
revenue_increase = retained_users * ltv_per_user

print(f"월간 학습 비용: ${monthly_training_cost:,}")
print(f"월간 매출 증대: ${revenue_increase:,.0f}")
print(f"순익: ${revenue_increase - monthly_training_cost:,.0f}")
print(f"ROI: {(revenue_increase / monthly_training_cost - 1) * 100:.1f}%")
```

**출력 예시:**

```
월간 학습 비용: $4,000
월간 매출 증대: $20,000
순익: $16,000
ROI: 400%
```

## 다음 단계

- [Trace → Dataset Materializer](./trace-to-dataset.md) — 배포 후 다음 iteration 데이터 수집
- [GRPO/DPO 학습 Job](./grpo-dpo-training.md) — 회귀 발생 시 재학습 실행
- [Agent Versioning](../../../aidlc/enterprise/agent-versioning/index.md) — 에이전트 레벨 롤아웃 전략

## 참고 자료

### 공식 문서

- [MLflow](https://mlflow.org/) — Model Registry·Tracking
- [Gateway API](https://gateway-api.sigs.k8s.io/) — HTTPRoute 기반 Canary
- [Argo Rollouts](https://argoproj.github.io/argo-rollouts/) — 선언적 Canary/Blue-Green 자동화
- [Prometheus Recording Rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)

### 논문 · 기술 블로그

- [Canary Analysis: Netflix Tech Blog](https://netflixtechblog.com/automated-canary-analysis-at-netflix-with-kayenta-3260bc7acc69)
- [Ragas: Automated Evaluation of RAG (arxiv 2309.15217)](https://arxiv.org/abs/2309.15217)

### 관련 문서

- [Ragas Evaluation](../../operations-mlops/governance/ragas-evaluation.md)
- [Inference Gateway 라우팅 전략](../inference-gateway-routing.md)
- [모니터링 · Observability 셋업](../monitoring-observability-setup.md)
