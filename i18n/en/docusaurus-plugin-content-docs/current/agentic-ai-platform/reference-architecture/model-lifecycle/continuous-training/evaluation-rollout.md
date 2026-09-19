---
title: Eval Gate · Registry · KPI
description: Checkpoint evaluation, approval-gated canary promotion, Registry versioning, verified routing recovery and cost/quality KPI contracts.
created: "2026-04-18"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 28
tags:
  - continuous-training
  - canary
  - mlflow
  - rollback
  - monitoring
  - scope:impl
sidebar_label: Evaluation & Rollout
sidebar_position: 4
---

## Eval Gate

### Threshold Verification

First run the candidate and baseline against identical frozen inputs and capture each response, completion status and client-observed latency. Measure from request submission through the complete response, using the same concurrency, timeout and retry policy. Ragas scores those captured responses; it neither runs the candidate model nor measures its latency. This adapter uses `ragas==0.2.15`, `EvaluationDataset` and explicitly supplied judge/embedding clients. Running it may invoke paid models; it has not been executed here.

```python
# score_responses.py -- ragas==0.2.15; executing this function calls the supplied judge.
from ragas import EvaluationDataset, evaluate
from ragas.metrics import Faithfulness, ResponseRelevancy


def score_responses(captured, *, judge_llm, embeddings):
    # captured: same held-out ids, user_input and retrieved_contexts for each model;
    # response and latency_ms were recorded by the candidate caller, not Ragas.
    if not captured:
        raise ValueError('empty captured dataset')
    result = evaluate(
        dataset=EvaluationDataset.from_list([
            {k: row[k] for k in ('user_input', 'response', 'retrieved_contexts')}
            for row in captured
        ]),
        metrics=[Faithfulness(), ResponseRelevancy()],
        llm=judge_llm, embeddings=embeddings, raise_exceptions=True,
    )
    if len(result.scores) != len(captured):
        raise ValueError('incomplete judge result')
    return [
        {'id': row['id'], 'completed': row['completed'], 'latency_ms': row['latency_ms'],
         'faithfulness': scores['faithfulness'], 'answer_relevancy': scores['answer_relevancy']}
        for row, scores in zip(captured, result.scores)
    ]
```

Each JSON contains `schema_version: 1`, dataset and evaluation-protocol SHA-256 hashes, pinned `judge_revision`, `embedding_revision` and `model_revision`, `ragas_version: "0.2.15"`, and the adapter output as `samples`. The protocol covers capture timing, judge prompts, sampling settings and evaluation software versions. A trusted evaluation job must bind these files to the model artifacts. The gate requires at least 500 cases, identical sample ID sets, finite scores and positive latencies. It inspects individual scores rather than letting a NaN-skipping mean hide failed evaluations. P99 uses nearest rank; regressions **greater than** 3pp or 10% fail.

```python
# eval_gate.py -- Python 3.11+; local scored JSON only, no model calls.
import argparse
import json
import math
from pathlib import Path
from statistics import fmean

CONTRACT_KEYS = (
    'dataset_sha256', 'evaluation_protocol_sha256', 'judge_revision',
    'embedding_revision', 'ragas_version',
)


def finite_number(value, name, low=None, high=None):
    try:
        valid = type(value) in (int, float) and math.isfinite(value)
    except OverflowError:
        valid = False
    if not valid:
        raise ValueError(f'{name}: finite number required')
    if low is not None and value < low or high is not None and value > high:
        raise ValueError(f'{name}: outside allowed range')
    return float(value)


def summarize(run):
    if run.get('schema_version') != 1:
        raise ValueError('unsupported evaluation schema')
    for key in (*CONTRACT_KEYS, 'model_revision'):
        if not isinstance(run.get(key), str) or not run[key].strip():
            raise ValueError(f'missing {key}')
    for key in ('dataset_sha256', 'evaluation_protocol_sha256'):
        if len(run[key]) != 64 or any(c not in '0123456789abcdef' for c in run[key]):
            raise ValueError(f'invalid {key}')
    if run['ragas_version'] != '0.2.15':
        raise ValueError('this scoring contract requires ragas 0.2.15')
    samples = run.get('samples')
    if not isinstance(samples, list) or len(samples) < 500:
        raise ValueError('at least 500 scored samples required by this example policy')
    seen, faith, relevance, latency = set(), [], [], []
    for row in samples:
        identifier = row.get('id')
        if not isinstance(identifier, str) or not identifier or identifier in seen:
            raise ValueError('missing or duplicate sample id')
        seen.add(identifier)
        if row.get('completed') is not True:
            raise ValueError(f'{identifier}: incomplete candidate request')
        faith.append(finite_number(row.get('faithfulness'), 'faithfulness', 0, 1))
        relevance.append(finite_number(row.get('answer_relevancy'), 'answer_relevancy', -1, 1))
        elapsed = finite_number(row.get('latency_ms'), 'latency_ms', 0)
        if elapsed == 0:
            raise ValueError('latency must be positive')
        latency.append(elapsed)
    return seen, {
        'faithfulness': fmean(faith),
        'answer_relevancy': fmean(relevance),
        'p99_latency_ms': sorted(latency)[math.ceil(0.99 * len(latency)) - 1],
        'sample_count': len(samples),
    }


def check_eval_gate(candidate, baseline):
    ids, new = summarize(candidate)
    baseline_ids, old = summarize(baseline)
    if ids != baseline_ids or any(candidate[k] != baseline[k] for k in CONTRACT_KEYS):
        raise ValueError('baseline and candidate must use the same cases and scoring protocol')
    failures = []
    for metric, threshold in {'faithfulness': 0.85, 'answer_relevancy': 0.80}.items():
        if new[metric] < threshold:
            failures.append(f'{metric} below {threshold}')
    for name, delta, tolerance in (
        ('faithfulness regression', old['faithfulness'] - new['faithfulness'], 0.03),
        ('p99 latency regression', new['p99_latency_ms'] / old['p99_latency_ms'] - 1, 0.10),
    ):
        if delta > tolerance and not math.isclose(delta, tolerance, rel_tol=1e-12, abs_tol=1e-12):
            failures.append(name)
    return {'passed': not failures, 'failures': failures, 'candidate': new, 'baseline': old,
            'model_revision': candidate['model_revision'],
            **{k: candidate[k] for k in CONTRACT_KEYS}}


def read_json(path):
    def reject_constant(value):
        raise ValueError(f'non-standard JSON number: {value}')
    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'duplicate JSON key: {key}')
            result[key] = value
        return result
    return json.loads(Path(path).read_text(), parse_constant=reject_constant,
                      object_pairs_hook=unique_keys)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('candidate')
    parser.add_argument('baseline')
    args = parser.parse_args()
    try:
        report = check_eval_gate(read_json(args.candidate), read_json(args.baseline))
    except (ValueError, TypeError, KeyError, AttributeError, OSError, OverflowError) as exc:
        report = {'passed': False, 'failures': [str(exc)]}
    print(json.dumps(report, allow_nan=False))
    raise SystemExit(0 if report['passed'] else 1)
```

```bash
python eval_gate.py candidate.json baseline.json > evaluation-report.json
```

A failed gate or invalid input exits with code 1. Use the process exit code to gate deployment, rather than comparing a printed status string. The adapter follows the [Ragas 0.2.15 evaluation contract](https://github.com/explodinggradients/ragas/blob/v0.2.15/src/ragas/evaluation.py); reproducibility of model-generated scores still requires separate evaluation.

### Canary Deployment (kgateway)

Use [Gateway API](https://gateway-api.sigs.k8s.io/) HTTPRoute to gradually shift traffic. The general principles and selection criteria of the Shadow, Canary, A/B, and Blue-Green strategies are covered in [Deployment Strategies](../../../../aidlc/enterprise/agent-versioning/deployment-strategies.md); this document focuses on the **kgateway-based Canary implementation integrated with the training pipeline's Eval Gate**.

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

Replace the complete `spec.rules[0].backendRefs` list on the same HTTPRoute with this fragment. It is not a standalone resource.

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

Replace the same list after an additional seven-day observation at 25% and approval. This is at least eight days after the first 5% deployment, plus approval delays.

```yaml
# canary-100-percent.yaml
backendRefs:
- name: vllm-glm5-canary
  port: 8000
  weight: 100
```

### Canary Monitoring

The following is a **custom exporter contract** for this document. `model_eval_faithfulness_sum/count` accumulate completed evaluation scores and counts; `model_requests_total` counts the same request population by `outcome="success|error"`. Emit a zero-valued error series when there are no errors. `model_request_duration_seconds_bucket` is a classic histogram for those requests, including `le` and +Inf buckets. All metrics carry `namespace`, `rollout` and `track="stable|canary"`. Sum distinct Pod request streams, but deduplicate HA scrape/remote-write replicas during ingestion. These names and labels are not default vLLM or Langfuse metrics.

Promotion freshness also requires these gauges. A trusted exporter/reconciler checks the **entire expected producer inventory** and collection health, then emits one authoritative series set for each `namespace`, `rollout` and `track`.

| Custom gauge | Meaning of the value |
|---|---|
| `model_last_request_observation_timestamp_seconds` | Oldest Unix timestamp, in seconds, among the last valid request observations of all required producers |
| `model_last_evaluation_observation_timestamp_seconds` | Oldest Unix timestamp, in seconds, among the last completed evaluation observations of all required producers |
| `model_collection_complete` | `1` only when every expected producer is present and collection health for the observation window is confirmed; `0` for missing, incomplete or unverified collection |

If a producer disappears, taking `min` over only the remaining producers must not make the collection appear healthy. The reconciler must detect the missing producer against the expected inventory and emit `model_collection_complete=0`. Do not refresh observation timestamp **values** at scrape or rule-evaluation time. The rules below only pass these gauges through; they do not verify producer inventory or collection health. The exporter/reconciler and synchronized clocks remain required external implementations, not components supplied by this document.

```yaml
# Custom exporter metrics; load as a Prometheus rule file, not an unconsumed ConfigMap.
groups:
- name: canary-monitoring
  interval: 30s
  rules:
  - record: canary:quality
    expr: sum by (namespace, rollout, track) (increase(model_eval_faithfulness_sum[1h])) / sum by (namespace, rollout, track) (increase(model_eval_faithfulness_count[1h]))
  - record: canary:evaluations
    expr: sum by (namespace, rollout, track) (increase(model_eval_faithfulness_count[1h]))
  - record: canary:requests
    expr: sum by (namespace, rollout, track) (increase(model_requests_total[5m]))
  - record: canary:error_fraction
    expr: sum by (namespace, rollout, track) (increase(model_requests_total{outcome="error"}[5m])) / sum by (namespace, rollout, track) (increase(model_requests_total[5m]))
  - record: canary:p99_seconds
    expr: histogram_quantile(0.99, sum by (namespace, rollout, track, le) (rate(model_request_duration_seconds_bucket[5m])))
  # One authoritative reconciler series per track; do not aggregate away missing producers.
  - record: canary:last_request_observation_timestamp_seconds
    expr: model_last_request_observation_timestamp_seconds
  - record: canary:last_evaluation_observation_timestamp_seconds
    expr: model_last_evaluation_observation_timestamp_seconds
  - record: canary:collection_complete
    expr: model_collection_complete
  # Match the parser's floating-point tolerance at the exact policy boundaries.
  - alert: CanaryFaithfulnessDrop
    expr: (canary:quality{track="canary"} - ignoring(track) canary:quality{track="stable"}) < -(0.03 + 1e-12)
    for: 10m
  - alert: CanaryLatencyRegression
    expr: (canary:p99_seconds{track="canary"} / ignoring(track) canary:p99_seconds{track="stable"}) > (1.10 + 1.1e-12)
    for: 5m
  - alert: CanaryErrorRateHigh
    expr: (canary:error_fraction{track="canary"} > ignoring(track) clamp_min(2 * canary:error_fraction{track="stable"}, 0.001)) or (canary:error_fraction{track="canary"} > 0.01)
    for: 5m
```

Every 30 seconds, the monitor checks these conditions:

- Each track has all eight required series, with unique identities and finite values.
- Each track has at least 100 requests and 20 evaluations.
- The last request and evaluation observations are zero to 90 seconds old, and `collection_complete` equals `1`.

A newly queried result can still be calculated from old observations. The monitor therefore checks query response time separately from the **observation timestamps supplied as metric values**. Missing data, stale or future observations, incomplete collection and query failures block promotion. The absence of an alert does not authorize it.

Both the alert and parser cap the error fraction at `min(1%, max(0.1%, 2 × stable error fraction))`. The sample minima and 90-second limit are example policy. Set them for the actual traffic and evaluation cadence; passing these checks does not establish statistical equivalence between the models.

```python
# monitor_canary.py -- Python 3.11+; custom recording-rule contract below.
import argparse
import json
import math
import time
from urllib.parse import urlencode
from urllib.request import urlopen

MAX_OBSERVATION_AGE_SECONDS = 90
MAX_QUERY_AGE_SECONDS = 90  # Response sanity only, not source-data freshness.
OBSERVATION_TIMESTAMPS = (
    'last_request_observation_timestamp_seconds',
    'last_evaluation_observation_timestamp_seconds',
)
METRICS = ('quality', 'p99_seconds', 'error_fraction', 'requests', 'evaluations',
           *OBSERVATION_TIMESTAMPS, 'collection_complete')


def parse_vector(payload, *, now):
    if type(now) not in (int, float) or not math.isfinite(now):
        raise ValueError('invalid current time')
    if payload.get('status') != 'success' or payload.get('warnings') or payload.get('infos'):
        raise ValueError('Prometheus query failed or returned annotations')
    data = payload.get('data', {})
    if data.get('resultType') != 'vector':
        raise ValueError('instant vector required')
    found = {}
    for row in data.get('result', []):
        labels = row['metric']
        if labels.get('namespace') != 'model-serving' or labels.get('rollout') != 'glm5':
            raise ValueError('wrong namespace or rollout')
        track, metric = labels.get('track'), labels.get('__name__', '').removeprefix('canary:')
        key = (track, metric)
        if track not in ('stable', 'canary') or metric not in METRICS or key in found:
            raise ValueError('unexpected or duplicate series')
        stamp, value = row['value']
        if type(stamp) not in (int, float) or not isinstance(value, str):
            raise ValueError('invalid Prometheus timestamp/value types')
        stamp, value = float(stamp), float(value)
        # Query timestamps describe evaluation time, not observation time.
        if not math.isfinite(stamp) or not 0 <= now - stamp <= MAX_QUERY_AGE_SECONDS:
            raise ValueError('invalid query response time')
        if not math.isfinite(value):
            raise ValueError('nonfinite metric value')
        found[key] = value
    if set(found) != {(t, m) for t in ('stable', 'canary') for m in METRICS}:
        raise ValueError('missing series')
    for track in ('stable', 'canary'):
        if found[track, 'collection_complete'] != 1:
            raise ValueError('producer inventory or collection health incomplete')
        for metric in OBSERVATION_TIMESTAMPS:
            if not 0 <= now - found[track, metric] <= MAX_OBSERVATION_AGE_SECONDS:
                raise ValueError('stale or future required observation')
        if not 0 <= found[track, 'quality'] <= 1 or not 0 <= found[track, 'error_fraction'] <= 1:
            raise ValueError('invalid quality or error fraction')
        if found[track, 'p99_seconds'] <= 0:
            raise ValueError('invalid latency')
        if found[track, 'requests'] < 100 or found[track, 'evaluations'] < 20:
            raise ValueError('insufficient observations; do not promote')
    quality_drop = found['stable', 'quality'] - found['canary', 'quality']
    if quality_drop > 0.03 and not math.isclose(quality_drop, 0.03, rel_tol=1e-12, abs_tol=1e-12):
        raise ValueError('quality regression')
    latency_ratio = found['canary', 'p99_seconds'] / found['stable', 'p99_seconds']
    if latency_ratio > 1.10 and not math.isclose(latency_ratio, 1.10, rel_tol=1e-12, abs_tol=1e-12):
        raise ValueError('latency regression')
    # Both a relative limit and an absolute 1% error budget; zero baseline stays meaningful.
    if found['canary', 'error_fraction'] > min(0.01, max(0.001, 2 * found['stable', 'error_fraction'])):
        raise ValueError('error budget exceeded')
    return found


def monitor(endpoint, seconds):
    if type(seconds) is not int or not 0 < seconds <= 604800:
        raise ValueError('duration must be 1..604800 seconds')
    deadline = time.monotonic() + seconds
    query = ('{__name__=~"canary:(' + '|'.join(METRICS)
             + ')",namespace="model-serving",rollout="glm5"}')
    while True:
        with urlopen(endpoint.rstrip('/') + '/api/v1/query?' + urlencode({'query': query}), timeout=10) as response:
            raw = response.read(1_048_577)
            if len(raw) > 1_048_576:
                raise ValueError('query result too large')
        parse_vector(json.loads(raw), now=time.time())
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return
        time.sleep(min(30, remaining))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('endpoint')
    p.add_argument('seconds', type=int)
    a = p.parse_args()
    monitor(a.endpoint, a.seconds)  # Any error exits nonzero; no-data is never healthy.
    print(json.dumps({'healthy': True, 'observed_seconds': a.seconds}))
```

### CI Integration (Argo Workflows)

This example follows the Argo Workflows **v3.7.0** DAG contract. Prepare `canary-gate-programs` with the two Python programs above and the read-only `reviewed-evaluation-inputs` PVC with reviewed inputs. Both Services, ready model Pods, the Gateway and a listener allowing this namespace must already exist. Give `canary-deployer` only the necessary HTTPRoute get/create/patch/update permissions and Argo task-result permissions. Pin the Python image by digest before operational use.

`approval` is a suspend that requires an authorized reviewer to resume it, rather than a timed pause. Start/promotion approvals inspect evaluation and release evidence. Each `verify-*` checks `Accepted=True` and `ResolvedRefs=True` for the relevant parent/controller and current generation, plus the actual data path. Allow enough exporter samples to accumulate before monitoring starts. Restrict resume permissions to reviewers and separate them from gate-file changes or direct resource edits. A monitoring failure blocks later promotions but does not restore existing traffic automatically; execute the rollback procedure below.

```yaml
# Argo Workflows v3.7.0 reference. Install prerequisites separately; do not apply blindly.
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: canary-deployment-
  namespace: training-pipeline
spec:
  serviceAccountName: canary-deployer
  entrypoint: canary-pipeline
  arguments:
    parameters:
    - name: prometheus-url
      value: http://prometheus.monitoring.svc.cluster.local:9090
  volumes:
  - name: programs
    configMap: {name: canary-gate-programs}
  - name: evidence
    persistentVolumeClaim: {claimName: reviewed-evaluation-inputs, readOnly: true}
  templates:
  - name: canary-pipeline
    dag:
      tasks:
      - name: eval-gate
        template: run-eval-gate
      - name: approve-start
        depends: eval-gate.Succeeded
        template: approval
      - name: deploy-canary-5
        depends: eval-gate.Succeeded && approve-start.Succeeded
        template: apply-canary-weight
        arguments: {parameters: [{name: weight, value: '5'}]}
      - name: verify-start
        depends: deploy-canary-5.Succeeded
        template: approval
      - name: monitor-24h
        depends: verify-start.Succeeded
        template: monitor-canary
        arguments: {parameters: [{name: seconds, value: '86400'}]}
      - name: approve-25
        depends: monitor-24h.Succeeded
        template: approval
      - name: deploy-canary-25
        depends: eval-gate.Succeeded && monitor-24h.Succeeded && approve-25.Succeeded
        template: apply-canary-weight
        arguments: {parameters: [{name: weight, value: '25'}]}
      - name: verify-25
        depends: deploy-canary-25.Succeeded
        template: approval
      - name: monitor-7d
        depends: verify-25.Succeeded
        template: monitor-canary
        arguments: {parameters: [{name: seconds, value: '604800'}]}
      - name: approve-production
        depends: monitor-7d.Succeeded
        template: approval
      - name: promote-to-production
        depends: eval-gate.Succeeded && monitor-7d.Succeeded && approve-production.Succeeded
        template: apply-canary-weight
        arguments: {parameters: [{name: weight, value: '100'}]}
      - name: verify-production
        depends: promote-to-production.Succeeded
        template: approval
  - name: approval
    suspend: {}
  - name: run-eval-gate
    container:
      image: python:3.12-slim
      command: [python, /programs/eval_gate.py]
      args: [/evidence/candidate.json, /evidence/baseline.json]
      volumeMounts:
      - {name: programs, mountPath: /programs, readOnly: true}
      - {name: evidence, mountPath: /evidence, readOnly: true}
      resources:
        requests: {cpu: 100m, memory: 128Mi}
        limits: {cpu: '1', memory: 512Mi}
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
          namespace: model-serving
        spec:
          parentRefs:
          - name: inference-gateway
            namespace: kgateway-system
          hostnames: [api.example.com]
          rules:
          - matches:
            - path: {type: PathPrefix, value: /v1/chat/completions}
            backendRefs:
            - name: vllm-glm5-stable
              port: 8000
              weight: {{=100 - asInt(inputs.parameters.weight)}}
            - name: vllm-glm5-canary
              port: 8000
              weight: {{=asInt(inputs.parameters.weight)}}
  - name: monitor-canary
    inputs:
      parameters:
      - name: seconds
    container:
      image: python:3.12-slim
      command: [python, /programs/monitor_canary.py]
      args: ['{{workflow.parameters.prometheus-url}}', '{{inputs.parameters.seconds}}']
      volumeMounts:
      - {name: programs, mountPath: /programs, readOnly: true}
      resources:
        requests: {cpu: 100m, memory: 128Mi}
        limits: {cpu: '1', memory: 256Mi}
```

## Registry & Rollback

### MLflow Model Registry

MLflow Registry records artifact locations and versions. Registration and alias updates do not deploy to EKS. Use an existing registered model and call these functions from a release job that verifies the binding between evaluation evidence and artifact digest. Check the artifact URI and format supported by the registry backend; an arbitrary checkpoint directory does not automatically become an MLflow flavor model. Use the returned version number and update the production alias only after the canary rollout is approved and verified.

```python
# mlflow_registry.py -- MLflow 3.14 API contract; functions are not executed here.
from mlflow import MlflowClient
from eval_gate import check_eval_gate, read_json


def register_evaluated_model(client, name, artifact_uri, candidate_path, baseline_path):
    report = check_eval_gate(read_json(candidate_path), read_json(baseline_path))
    if not report['passed']:
        raise ValueError('evaluation failed')
    # name exists; artifact_uri is bound to report['model_revision'] by the release job.
    version = client.create_model_version(name=name, source=artifact_uri,
        tags={'eval_gate_status': 'passed', 'model_revision': report['model_revision'],
              'evaluation_protocol_sha256': report['evaluation_protocol_sha256']})
    client.set_registered_model_alias(name, 'candidate', version.version)
    return version.version


def record_completed_promotion(client, name, approved_version):
    # Call ONLY after the deployment controller verifies final rollout/approval evidence.
    # An alias records a release decision; it neither deploys nor changes HTTPRoute traffic.
    previous = client.get_model_version_by_alias(name, 'production')
    client.set_registered_model_alias(name, 'previous', previous.version)
    client.set_registered_model_alias(name, 'production', str(approved_version))
```

### Agent Versioning Integration

[Agent Versioning](../../../../aidlc/enterprise/agent-versioning/index.md) is an application contract that records code, tools and prompts alongside the **resolved immutable model version**. Creating this ConfigMap does not synchronize agents or Bedrock. Versions 1/2 below are illustrative and must be replaced with actual Registry versions. Verify both the manifest and routing during rollback.

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
          version: 2
          registry: mlflow
          registry_alias_at_resolution: production
        tools:
          - mcp-github
          - mcp-jira
        prompt_version: v2.3.0
      
      - name: docs-writer
        version: v1.5.0
        model:
          name: glm-5-grpo
          version: 1  # Still using previous version
          registry: mlflow
          registry_alias_at_resolution: production
```

### Bedrock Agents Hybrid Sync

A Bedrock Agent’s `foundationModel` is its orchestration model. Putting an EKS URL in an instruction does not implement tool invocation, cluster DNS access or fallback. This example defines a function action group using [return control](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-returncontrol.html). The application performs the call through authenticated network access to a fixed approved-model endpoint. `eks_generate` and `fallback_generate` are required adapters with timeouts and output validation; they are not implemented in this document. A DRAFT change also requires separate agent preparation and alias promotion.

```python
# Bedrock Agents action group definition; a DRAFT change needs preparation and alias promotion.
def define_eks_tool(bedrock_agent, agent_id):
    return bedrock_agent.create_agent_action_group(
        agentId=agent_id, agentVersion='DRAFT', actionGroupName='ApprovedModelTools',
        actionGroupState='ENABLED', actionGroupExecutor={'customControl': 'RETURN_CONTROL'},
        functionSchema={'functions': [{
            'name': 'generate_code', 'description': 'Generate code using the approved model release',
            'parameters': {'prompt': {'type': 'string', 'required': True}},
        }]},
    )


def execute_returned_function(function_input, *, eks_generate, fallback_generate):
    # Only allow this action/function. Never accept an endpoint URL from agent output.
    if (function_input.get('actionGroup') != 'ApprovedModelTools'
            or function_input.get('function') != 'generate_code'):
        raise ValueError('unexpected action')
    parameters = function_input.get('parameters', [])
    if len(parameters) != 1 or parameters[0].get('name') != 'prompt':
        raise ValueError('expected exactly one prompt parameter')
    prompt = parameters[0].get('value')
    if not isinstance(prompt, str) or not 0 < len(prompt) <= 16000:
        raise ValueError('invalid prompt')
    try:
        # Inject authenticated clients with bounded timeouts and fixed model revisions.
        text = eks_generate(prompt)
    except (TimeoutError, ConnectionError):
        text = fallback_generate(prompt)
    if not isinstance(text, str) or not text:
        raise ValueError('empty tool response')
    return {'functionResult': {
        'actionGroup': 'ApprovedModelTools', 'function': 'generate_code',
        'responseBody': {'TEXT': {'body': text}},
    }}


# In the InvokeAgent event stream, extract returnControl.invocationId and its
# invocationInputs[].functionInvocationInput. Execute the allowlisted function,
# then call InvokeAgent with the SAME sessionId and:
# sessionState={
#   'invocationId': invocation_id,
#   'returnControlInvocationResults': [function_result],
# }
# The caller owns networking, authentication, retries and the fallback model call.
```

### Rollback YAML

Restore stable traffic on the attached `model-serving/model-serving-canary` HTTPRoute rather than creating a new route name. Stable Pods must be ready. A successful API write does not prove data-plane convergence: check `Accepted=True` and `ResolvedRefs=True` for the relevant parent/controller and current generation, then verify the stable model with real requests. Do not scale canary to zero until in-flight requests/streams have drained and new canary traffic has stopped. Recovery time depends on controller convergence and connection lifetimes.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-serving-canary
  namespace: model-serving
spec:
  parentRefs:
  - name: inference-gateway
    namespace: kgateway-system
  hostnames: [api.example.com]
  rules:
  - matches:
    - path: {type: PathPrefix, value: /v1/chat/completions}
    backendRefs:
    - name: vllm-glm5-stable
      port: 8000
      weight: 100
```

**Rollback Automation (Argo Rollouts):**

This is a **policy excerpt** for a possible Argo Rollouts integration, not an executable Rollout. A complete integration needs a selector and Pod template or workloadRef, stable/canary Services, a version-compatible Gateway API traffic-router plugin with `trafficRouting`, and a valid `canary-quality-check` AnalysisTemplate. A pause does not perform monitoring or approval; validate missing/error result handling and rollback behavior separately. Do not let Workflows and Rollouts concurrently manage the same HTTPRoute.

```yaml
# Policy excerpt only: NOT a complete or applyable Rollout.
strategy:
  canary:
    steps:
    - setWeight: 5
    - pause: {duration: 24h}
    - setWeight: 25
    - pause: {duration: 168h}
    - setWeight: 100
    analysis:
      templates:
      - templateName: canary-quality-check
      args:
      - name: service-name
        value: vllm-glm5-canary
revisionHistoryLimit: 5
```

### Checkpoint Retention Policy

Store experimental and production checkpoints under disjoint prefixes. This rule expires only `training-checkpoints/experimental/`; it does not match `training-checkpoints/production/`. Review other existing rules too: a narrower no-action rule does not override a broader expiration rule.

```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Filter": {
        "Prefix": "training-checkpoints/experimental/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER_IR"
        },
        {
          "Days": 120,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 365
      },
      "ID": "archive-experimental-checkpoints"
    }
  ]
}
```

**Retention strategy:**

- Experimental objects: Standard for days 0–30, Glacier Instant Retrieval for days 30–120, Deep Archive for days 120–365, expiration at day 365.
- Transition out of Glacier Instant Retrieval only after its 90-day minimum. Check small-object transition limits, request costs and minimum storage charges.
- Production objects: not expired by this rule. This is not a guarantee of permanent retention; separately design versioning, other lifecycle rules, delete permissions and Object Lock where required.

Follow the [S3 transition constraints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html). Do not move or delete existing production objects without a verified copy and recovery procedure.

## Observability & Cost KPIs

### GPU-hours per Quality Improvement

**KPI Definition**: GPU time and cost required per 0.01 faithfulness increase

The following values and table are synthetic training history for explaining the calculation, not measurements. For real inputs, require finite nonnegative GPU hours/costs and `faithfulness_delta > 0`. Report runs with zero or negative improvement separately instead of dividing by that value.

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

**Interpretation**: Cost per improvement increases in this synthetic history. A real stop/continue decision needs repeated measurements under the same evaluation protocol, uncertainty estimates and business objectives.

### AMP Recording Rule

`training_gpu_seconds_total{model_family,job}` is a custom counter accumulating allocated GPU count × elapsed seconds per job. Do not apply `rate()` to a GPU-allocation gauge. `model_release_faithfulness{model_family}` exports the current approved release’s score on the same frozen evaluation set/protocol, with stable labels. If the seven-day-old score is absent, the delta is missing. Subtract these gauge values; do not apply `increase()` to quality scores. $12.5/GPU-hour is an illustrative rate, not an actual instance price or billing total.

```yaml
# Custom exporter: training_gpu_seconds_total is a cumulative counter, not a gauge.
groups:
- name: continuous-training-kpi
  interval: 1m
  rules:
  - record: training:gpu_hours:7d
    expr: sum by (model_family) (increase(training_gpu_seconds_total[7d])) / 3600
  - record: training:cost_usd:7d_estimate
    expr: training:gpu_hours:7d * 12.5
  - record: model:faithfulness:delta7d
    expr: model_release_faithfulness - model_release_faithfulness offset 7d
  - record: training:improvement_per_dollar
    expr: (model:faithfulness:delta7d > 0) / on(model_family) (training:cost_usd:7d_estimate > 0)
```

This YAML is a Prometheus rule file. Creating a ConfigMap does not upload it to AMP. An authorized operator must create/update the AMP rules namespace through the [rules-file upload procedure](https://docs.aws.amazon.com/prometheus/latest/userguide/AMP-ruler-rulesfile.html) and verify its status. Neither ingestion nor rule upload has been executed here.

### Grafana Dashboard

This is a panel-query specification for the rules above, not an importable Grafana dashboard JSON. Configure datasource UID, panel schema and field units (seconds/dollars/fractions) for your Grafana version. Do not apply `increase()` again to a trailing seven-day result. Request share is observed traffic and need not exactly equal the HTTPRoute weight. Obtain rollout annotations from deployment events rather than displaying synthetic dates as actual events.

```json
{
  "title": "Continuous Training KPI — query specification",
  "queries": [
    {
      "panel": "Faithfulness trend",
      "expr": "canary:quality{namespace=\"model-serving\",rollout=\"glm5\"}"
    },
    {
      "panel": "Estimated training cost, trailing 7d (USD)",
      "expr": "training:cost_usd:7d_estimate"
    },
    {
      "panel": "Positive quality improvement per $1000",
      "expr": "training:improvement_per_dollar * 1000"
    },
    {
      "panel": "Observed canary request share",
      "expr": "sum(rate(model_requests_total{namespace=\"model-serving\",rollout=\"glm5\",track=\"canary\"}[5m])) / sum(rate(model_requests_total{namespace=\"model-serving\",rollout=\"glm5\"}[5m]))"
    }
  ]
}
```

### Recommended Weekly/Monthly Cadence

| Cycle | Action | Goal |
|-------|--------|------|
| **Weekly** | Trace collection → Reward Labeling | Review approved, deduplicated samples and gaps in case coverage |
| **Bi-weekly** | Review whether to run GRPO/DPO training | Train when enough data is available; measure changes on the frozen evaluation set |
| **Monthly** | Full evaluation + Canary review | Promote only candidates that pass quality, latency and error criteria |
| **Quarterly** | Cost vs ROI analysis | Training stop/continue decision |

**Recommended Starting Cycle:**

This is an example review schedule. Adjust it to data availability, evaluation cost and the observation period needed for each rollout. A fixed training or release schedule does not imply a fixed rate of quality improvement.

### Break-even Analysis

The relationship between quality scores and churn needs experimental evidence. This scenario estimates first-month effects from active users and monthly revenue. A **2% relative reduction** in 10% churn yields 9.8%, not a two-percentage-point reduction. Use monthly revenue per user for a monthly calculation rather than dividing monthly revenue by lifetime value. Long-term LTV benefits, contribution margin, discounting and serving costs are excluded.

```python
# roi_analysis.py
# Illustrative assumptions, not a measured relationship between quality and churn.
active_users = 2_000
monthly_revenue_per_user = 50
monthly_churn_rate = 0.10
relative_churn_reduction = 0.02  # 2% relative: 10% -> 9.8%, a 0.2 percentage-point drop.
training_cost_per_iteration = 2_000
iterations_per_month = 2
monthly_training_cost = training_cost_per_iteration * iterations_per_month
retained_users = active_users * monthly_churn_rate * relative_churn_reduction
first_month_revenue_preserved = retained_users * monthly_revenue_per_user
net_first_month = first_month_revenue_preserved - monthly_training_cost
roi = net_first_month / monthly_training_cost * 100
print(f'Monthly training cost: ${monthly_training_cost:,.0f}')
print(f'Expected additional retained users: {retained_users:.1f}')
print(f'First-month revenue preserved: ${first_month_revenue_preserved:,.0f}')
print(f'Net first-month contribution before other costs: ${net_first_month:,.0f}')
print(f'First-month ROI: {roi:.1f}%')
```

**Example output:**

```text
Monthly training cost: $4,000
Expected additional retained users: 4.0
First-month revenue preserved: $200
Net first-month contribution before other costs: $-3,800
First-month ROI: -95.0%
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

- [Deployment Strategies — Shadow·Canary·A/B·Blue-Green](../../../../aidlc/enterprise/agent-versioning/deployment-strategies.md) — General deployment strategy principles, selection criteria, and Feature Flag rollout (canonical for general strategy)
- [Ragas Evaluation](../../../operations-mlops/governance/ragas-evaluation.md)
- [Inference Gateway Routing Strategy](../../../model-serving/inference-routing/routing-strategy.md)
- [Monitoring & Observability Setup](../../integrations/monitoring-observability-setup.md)
