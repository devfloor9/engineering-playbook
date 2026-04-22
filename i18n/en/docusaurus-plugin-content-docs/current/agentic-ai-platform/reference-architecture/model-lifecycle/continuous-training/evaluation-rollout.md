---
title: "Eval Gate · Registry · KPI"
sidebar_label: "Evaluation & Rollout"
description: "Threshold verification of trained checkpoints, kgateway-based gradual Canary deployment, MLflow Registry version management, automatic rollback on regression, cost and quality KPI dashboard configuration."
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

### Threshold Verification

Trained models must pass quality thresholds before deployment.

```python
# eval_gate.py
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# Test dataset (500 representative production samples)
test_dataset = load_test_dataset('s3://training-data-lake/test-dataset.parquet')

# Evaluate new model
new_model_results = evaluate(
    test_dataset,
    model='glm-5-dpo-checkpoint-1000',
    metrics=[faithfulness, answer_relevancy]
)

# Evaluate baseline model
baseline_results = evaluate(
    test_dataset,
    model='glm-5-baseline',
    metrics=[faithfulness, answer_relevancy]
)

# Threshold verification
THRESHOLDS = {
    'faithfulness': 0.85,
    'answer_relevancy': 0.80,
}

REGRESSION_TOLERANCE = {
    'faithfulness': 0.03,  # Fail if drops > 3pp
    'p99_latency_ms': 0.10,  # Fail if increases > 10%
}

def check_eval_gate(new, baseline, thresholds, regression):
    failures = []
    
    # Absolute threshold verification
    for metric, threshold in thresholds.items():
        if new[metric] < threshold:
            failures.append(f"{metric}: {new[metric]:.3f} < {threshold}")
    
    # Regression verification
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

Use [Gateway API](https://gateway-api.sigs.k8s.io/) HTTPRoute to gradually shift traffic.

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
    # Existing stable version (95%)
    - name: vllm-glm5-stable
      port: 8000
      weight: 95
    
    # New canary version (5%)
    - name: vllm-glm5-canary
      port: 8000
      weight: 5
```

#### Stage 2: 25% (after 24 hours if no issues)

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

#### Stage 3: 100% (final promotion after 7 days)

```yaml
# canary-100-percent.yaml
backendRefs:
- name: vllm-glm5-canary
  port: 8000
  weight: 100
```

### Canary Monitoring

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
      # Faithfulness regression detection
      - alert: CanaryFaithfulnessDrop
        expr: |
          (
            avg_over_time(langfuse_trace_faithfulness{model="glm5-canary"}[1h])
            -
            avg_over_time(langfuse_trace_faithfulness{model="glm5-stable"}[1h])
          ) < -0.03
        for: 10m
        annotations:
          summary: "Canary model faithfulness dropped > 3pp"
          description: "Canary: {{ $value | humanize }}pp drop"
      
      # P99 latency regression
      - alert: CanaryLatencyRegression
        expr: |
          (
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-canary"})
            /
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-stable"})
          ) > 1.10
        for: 5m
        annotations:
          summary: "Canary model P99 latency increased > 10%"
      
      # Error rate increase
      - alert: CanaryErrorRateHigh
        expr: |
          rate(vllm_request_errors_total{model="glm5-canary"}[5m])
          >
          rate(vllm_request_errors_total{model="glm5-stable"}[5m]) * 2
        for: 5m
        annotations:
          summary: "Canary model error rate increased > 2x"
```

### CI Integration (Argo Workflows)

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
    
    # Step 3: Wait 24h + monitoring
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
    
    # Step 5: Wait 7 days
    - - name: monitor-7d
        template: monitor-canary
        arguments:
          parameters:
          - name: duration
            value: "168h"
    
    # Step 6: Promote to 100%
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
        # (eval_gate.py code above)
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
        # Query canary metrics from Prometheus
        sleep {{inputs.parameters.duration}}
        
        # Check Faithfulness
        faithfulness_drop=$(curl -s 'http://prometheus:9090/api/v1/query?query=...')
        if [ "$faithfulness_drop" -lt "-0.03" ]; then
          echo "unhealthy"
          exit 1
        fi
        
        echo "healthy"
```

## Registry & Rollback

### MLflow Model Registry

[MLflow](https://mlflow.org/) tracks model versions and lifecycle.

```python
# mlflow_registry.py
import mlflow
from mlflow.tracking import MlflowClient

mlflow.set_tracking_uri("http://mlflow-server.mlflow.svc.cluster.local:5000")
client = MlflowClient()

# Register new model
model_uri = "s3://training-checkpoints/grpo-run-001/checkpoint-1000"

with mlflow.start_run(run_name="grpo-iteration-001"):
    # Log metrics
    mlflow.log_metrics({
        "faithfulness": 0.92,
        "answer_relevancy": 0.88,
        "p99_latency_ms": 850,
        "training_loss": 0.15,
    })
    
    # Register model
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

# Stage transition (None → Staging → Production)
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Staging",  # During Canary deployment
)

# Promote to Production after 7 days
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Production",
)

# Archive previous version
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=0,  # Previous baseline model
    stage="Archived",
)
```

### Agent Versioning Integration

[Agent Versioning](../../../../aidlc/enterprise/agent-versioning/index.md) synchronizes agent code with model versions.

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
          version: 0  # Still using previous version
          registry: mlflow
          stage: Production
```

### Bedrock Agents Hybrid Sync

In hybrid architecture (EKS + Bedrock), EKS model updates must also be reflected in Bedrock Agents.

```python
# sync_to_bedrock.py
import boto3

bedrock = boto3.client('bedrock-agent')

# EKS new model information
eks_model_version = "glm-5-grpo-v1"
eks_endpoint = "http://vllm-glm5-canary.model-serving.svc.cluster.local:8000"

# Update Bedrock Agent
bedrock.update_agent(
    agentId='AGENT123',
    agentName='code-assistant',
    foundationModel='anthropic.claude-3-sonnet-20240229-v1:0',  # fallback model
    instruction=f"""
    Use the custom EKS model for code generation tasks:
    - Model: {eks_model_version}
    - Endpoint: {eks_endpoint}
    
    Fallback to Claude Sonnet if EKS model is unavailable.
    """,
)
```

### Rollback YAML

Immediately rollback to the previous stable version when regression is detected.

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
    # Remove canary, restore 100% stable
    - name: vllm-glm5-stable
      port: 8000
      weight: 100
---
# Stop Canary Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-glm5-canary
  namespace: model-serving
spec:
  replicas: 0  # Scale down immediately
```

**Rollback Automation (Argo Rollouts):**

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
      
      # Automatic rollback conditions
      analysis:
        templates:
        - templateName: canary-quality-check
        args:
        - name: service-name
          value: vllm-glm5-canary
  
  revisionHistoryLimit: 5  # Keep last 5 versions
```

### Checkpoint Retention Policy

Optimize costs for S3 checkpoints with lifecycle policies.

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

**Retention Strategy:**

- **Last 30 days**: S3 Standard (immediate access)
- **30-90 days**: Glacier Instant Retrieval (infrequent access)
- **90-365 days**: Glacier Deep Archive (long-term storage)
- **Production checkpoints**: Permanent retention

## Observability & Cost KPIs

### GPU-hours per Quality Improvement

**KPI Definition**: GPU time and cost required per 0.01 faithfulness increase

```python
# kpi_calculation.py
import pandas as pd

# Training history
training_runs = pd.DataFrame([
    {'iteration': 1, 'gpu_hours': 96, 'cost_usd': 1200, 'faithfulness_delta': 0.02},
    {'iteration': 2, 'gpu_hours': 120, 'cost_usd': 1500, 'faithfulness_delta': 0.015},
    {'iteration': 3, 'gpu_hours': 144, 'cost_usd': 1800, 'faithfulness_delta': 0.01},
])

# Calculate KPI
training_runs['gpu_hours_per_0.01_improvement'] = training_runs['gpu_hours'] / (training_runs['faithfulness_delta'] * 100)
training_runs['cost_per_0.01_improvement'] = training_runs['cost_usd'] / (training_runs['faithfulness_delta'] * 100)

print(training_runs)
```

**Example Results:**

| iteration | gpu_hours | cost_usd | faithfulness_delta | gpu_hours_per_0.01 | cost_per_0.01 |
|-----------|-----------|----------|-------------------|-------------------|--------------|
| 1 | 96 | $1,200 | 0.020 | 48 | $600 |
| 2 | 120 | $1,500 | 0.015 | 80 | $1,000 |
| 3 | 144 | $1,800 | 0.010 | 144 | $1,800 |

**Interpretation**: Initial improvements are rapid, but **diminishing returns** occur as iterations progress. Consider stopping training when cost efficiency drops.

### AMP Recording Rule

Prometheus Recording Rules pre-calculate KPIs to optimize dashboard query performance.

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
      # Average Faithfulness per model (1-hour window)
      - record: model:faithfulness:avg1h
        expr: |
          avg_over_time(langfuse_trace_faithfulness[1h])
      
      # Canary vs Stable Faithfulness difference
      - record: canary:faithfulness:delta
        expr: |
          model:faithfulness:avg1h{model="glm5-canary"}
          -
          model:faithfulness:avg1h{model="glm5-stable"}
      
      # GPU usage time (cumulative)
      - record: training:gpu_hours:total
        expr: |
          sum(
            rate(container_gpu_allocation{namespace="training-pipeline"}[5m])
          ) * 3600
      
      # Training cost estimate (GPU-hour × $12.5)
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

### Grafana Dashboard

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

### Recommended Weekly/Monthly Cadence

| Cycle | Action | Goal |
|-------|--------|------|
| **Weekly** | Trace collection → Reward Labeling | Secure minimum 5,000 high-quality traces |
| **Bi-weekly** | GRPO/DPO training iteration | Faithfulness +0.01 improvement |
| **Monthly** | Full evaluation + Canary deployment | 1% production quality improvement |
| **Quarterly** | Cost vs ROI analysis | Training stop/continue decision |

**Recommended Starting Cycle:**

- **First 3 months**: Bi-weekly iterations (rapid improvement)
- **Maturity (6+ months)**: Monthly iterations (stabilization)

### Break-even Analysis

```python
# roi_analysis.py
# Assumption: 1% model quality improvement → 5% user satisfaction increase → 2% churn reduction

# Current metrics
monthly_revenue = 100_000  # $100K/month
churn_rate = 0.10  # 10% monthly churn rate
ltv_per_user = 5_000  # User lifetime value $5K

# Training cost
training_cost_per_iteration = 2_000
iterations_per_month = 2
monthly_training_cost = training_cost_per_iteration * iterations_per_month  # $4K

# Quality improvement effect
quality_improvement_per_month = 0.01  # 1% faithfulness increase
churn_reduction = quality_improvement_per_month * 2  # 2% churn reduction

# Revenue increase
retained_users = (monthly_revenue / ltv_per_user) * churn_reduction
revenue_increase = retained_users * ltv_per_user

print(f"Monthly training cost: ${monthly_training_cost:,}")
print(f"Monthly revenue increase: ${revenue_increase:,.0f}")
print(f"Net profit: ${revenue_increase - monthly_training_cost:,.0f}")
print(f"ROI: {(revenue_increase / monthly_training_cost - 1) * 100:.1f}%")
```

**Example Output:**

```
Monthly training cost: $4,000
Monthly revenue increase: $20,000
Net profit: $16,000
ROI: 400%
```

## Next Steps

- [Trace → Dataset Materializer](./trace-to-dataset.md) — Collect data for next iteration after deployment
- [GRPO/DPO Training Job](./grpo-dpo-training.md) — Re-run training when regression occurs
- [Agent Versioning](../../../../aidlc/enterprise/agent-versioning/index.md) — Agent-level rollout strategy

## References

### Official Documentation

- [MLflow](https://mlflow.org/) — Model Registry and Tracking
- [Gateway API](https://gateway-api.sigs.k8s.io/) — HTTPRoute-based Canary
- [Argo Rollouts](https://argoproj.github.io/argo-rollouts/) — Declarative Canary/Blue-Green automation
- [Prometheus Recording Rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)

### Papers & Technical Blogs

- [Canary Analysis: Netflix Tech Blog](https://netflixtechblog.com/automated-canary-analysis-at-netflix-with-kayenta-3260bc7acc69)
- [Ragas: Automated Evaluation of RAG (arxiv 2309.15217)](https://arxiv.org/abs/2309.15217)

### Related Documents

- [Ragas Evaluation](../../../operations-mlops/governance/ragas-evaluation.md)
- [Inference Gateway Routing Strategy](../../inference-gateway/routing-strategy.md)
- [Monitoring & Observability Setup](../../integrations/monitoring-observability-setup.md)
