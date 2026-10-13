---
title: Eval Gate · Registry · KPI
description: 학습 체크포인트 평가, 승인 기반 Canary 승격, Registry 버전 관리, 검증된 라우팅 복구와 비용·품질 KPI 계약.
created: "2026-04-18"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 16
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

### Threshold 검증

후보 모델과 기준 모델에 동일한 고정 평가 입력을 보내고 응답·완료 상태·클라이언트 관측 지연을 먼저 저장합니다. 모델 호출 구간은 입력 전송부터 전체 응답 수신까지로 통일하고, 동일한 동시성·타임아웃·재시도 정책을 사용합니다. Ragas는 저장한 응답을 평가하며 후보 모델을 실행하거나 지연을 측정하지 않습니다. 아래 어댑터는 `ragas==0.2.15`의 `EvaluationDataset`과 명시적으로 전달한 judge/embedding을 사용합니다. 어댑터 실행은 유료 모델 호출을 발생시킬 수 있으며 여기서는 실행하지 않았습니다.

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

각 JSON에는 `schema_version: 1`, 데이터셋·평가 프로토콜의 SHA-256, 고정된 `judge_revision`·`embedding_revision`·`model_revision`, `ragas_version: "0.2.15"`, 그리고 위 어댑터가 반환한 `samples`를 저장합니다. 프로토콜에는 캡처 방법, judge 프롬프트, 샘플링 설정과 평가 소프트웨어 버전을 포함합니다. 신뢰할 수 있는 평가 작업이 파일과 모델 아티팩트의 연결을 검증해야 합니다. 아래 게이트는 최소 500개, 동일한 sample ID 집합, 유한한 점수와 양의 지연을 요구합니다. 원시 샘플을 검사하므로 NaN을 제외한 평균이 실패를 숨기지 않습니다. P99는 nearest-rank이며 3pp/10%를 **초과**한 회귀를 실패 처리합니다.

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

실패나 잘못된 입력은 종료 코드 1을 반환합니다. 보고서의 문자열을 비교하는 대신 종료 코드를 다음 배포 단계의 조건으로 사용합니다. [Ragas 0.2.15 평가 계약](https://github.com/explodinggradients/ragas/blob/v0.2.15/src/ragas/evaluation.py)을 기준으로 작성했으며 모델 기반 점수의 재현성은 별도 검증 대상입니다.

### Canary Deployment (kgateway)

[Gateway API](https://gateway-api.sigs.k8s.io/)의 HTTPRoute를 사용하여 트래픽을 점진적으로 전환합니다. Shadow·Canary·A/B·Blue-Green 각 전략의 일반론과 선택 기준은 [배포 전략](../../../../aidlc/enterprise/agent-versioning/deployment-strategies.md)에서 다루며, 이 문서는 학습 파이프라인의 **Eval Gate와 연계된 kgateway 기반 Canary 구현**에 집중합니다.

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

아래는 동일한 HTTPRoute의 `spec.rules[0].backendRefs` 전체를 교체할 값입니다. 독립 리소스가 아닙니다.

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

25% 단계에서 추가 7일의 관측과 승인을 마친 뒤 같은 목록을 교체합니다. 최초 5% 배포부터는 최소 8일이며, 승인 대기 시간은 별도입니다.

```yaml
# canary-100-percent.yaml
backendRefs:
- name: vllm-glm5-canary
  port: 8000
  weight: 100
```

### Canary 모니터링

다음은 이 문서에서 정의하는 **커스텀 exporter 계약**입니다. `model_eval_faithfulness_sum/count`는 완료된 평가의 점수 합과 건수를 누적하고, `model_requests_total`은 동일 요청 집합을 `outcome="success|error"`로 누적합니다. 오류가 없어도 error 시계열을 0으로 내보냅니다. `model_request_duration_seconds_bucket`은 같은 요청의 classic histogram이며 `le`와 +Inf 버킷을 포함합니다. 모두 `namespace`, `rollout`, `track="stable|canary"`를 사용합니다. Pod별 서로 다른 요청은 합산하되 HA scrape/remote-write 복제본은 수집 단계에서 중복 제거해야 합니다. 이 이름과 레이블은 vLLM이나 Langfuse의 기본 메트릭이 아닙니다.

승격용 신선도에는 다음 gauge도 필요합니다. 신뢰할 수 있는 exporter/reconciler가 **예상 producer 목록 전체**와 수집 상태를 확인한 뒤, 각 `namespace`, `rollout`, `track`에 대해 하나의 권위 있는 시계열 집합을 내보냅니다.

| 커스텀 gauge | 값의 의미 |
|---|---|
| `model_last_request_observation_timestamp_seconds` | 필요한 각 producer의 마지막 유효 요청 관측 시각 중 가장 오래된 Unix 시각(초) |
| `model_last_evaluation_observation_timestamp_seconds` | 필요한 각 producer의 마지막 완료 평가 관측 시각 중 가장 오래된 Unix 시각(초) |
| `model_collection_complete` | 예상 producer가 모두 존재하고 해당 관측 구간의 수집 상태가 정상임을 확인했을 때만 `1`; 누락·불완전·확인 불가는 `0` |

producer 하나가 사라지면 남은 producer의 `min`만 계산해 정상으로 보이게 해서는 안 됩니다. reconciler는 예상 목록을 기준으로 누락을 확인하고 `model_collection_complete=0`을 내보내야 합니다. 관측 timestamp **값**은 scrape나 rule 재평가 시각으로 갱신하지 않습니다. 아래 rule은 이 gauge를 전달할 뿐, producer 목록이나 수집 상태를 검증하지 않습니다. exporter/reconciler와 clock 동기화는 별도 필수 구현이며 이 문서에 포함되어 있지 않습니다.

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

관측기는 30초마다 다음 조건을 확인합니다.

- 두 track에 각각 8개 시계열이 모두 있고, 중복 없이 유한한 값을 제공해야 합니다.
- 각 track에 최소 100개 요청과 20개 평가가 있어야 합니다.
- 마지막 요청·평가를 관측한 뒤 지난 시간이 0~90초이고, `collection_complete`가 `1`이어야 합니다.

방금 조회한 결과라도 오래된 관측에서 계산됐을 수 있습니다. 그래서 쿼리 응답 시각과 **메트릭 값으로 전달한 관측 시각**을 따로 검사합니다. 누락, 오래되거나 미래인 관측, 불완전한 수집, 조회 실패가 있으면 승격을 중단합니다. 알림이 없다는 이유만으로 승격하지 않습니다.

오류율의 허용 상한은 알람과 parser 모두 `min(1%, max(0.1%, 2 × stable 오류율))`입니다. 최소 표본과 90초는 이 예제의 정책입니다. 실제 트래픽과 평가 주기에 맞춰 정해야 하며, 이 조건을 통과했다고 두 모델의 품질이 통계적으로 같아지는 것은 아닙니다.

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

### CI 통합 (Argo Workflows)

이 예제는 Argo Workflows **v3.7.0**의 DAG 계약을 사용합니다. `canary-gate-programs` ConfigMap에는 위의 두 Python 프로그램을, 읽기 전용 `reviewed-evaluation-inputs` PVC에는 승인된 입력 파일을 준비해야 합니다. 두 Service, 준비된 모델 Pod, Gateway 및 해당 namespace를 허용하는 listener가 선행 조건입니다. `canary-deployer`에는 필요한 HTTPRoute의 get/create/patch/update와 Argo 작업 결과 기록 권한만 부여합니다. Python 이미지도 운영 전에 digest로 고정합니다.

`approval`은 시간이 지나면 자동 해제되는 pause가 아니라 승인자가 재개해야 하는 suspend입니다. 시작/승격 승인은 평가·릴리스 증거를 확인합니다. 각 `verify-*`에서는 해당 parent/controller의 최신 generation에 대해 `Accepted=True`, `ResolvedRefs=True`와 실제 데이터 경로를 확인합니다. 최초 관측 전에 exporter에 충분한 샘플이 쌓여야 합니다. 재개 권한은 승인자에게만 부여하고, 게이트 파일 변경·직접 리소스 수정 권한을 분리합니다. 관측 실패 시 후속 승격은 차단되지만 기존 트래픽이 자동 복구되지는 않으므로 아래 롤백 절차를 실행합니다.

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

MLflow Registry는 아티팩트 위치와 버전을 기록합니다. 등록과 alias 변경은 EKS 배포를 실행하지 않습니다. 기존 모델 이름을 사용하고, 평가 보고서와 아티팩트 digest의 연결을 검증한 릴리스 작업에서 아래 함수를 호출합니다. 서버가 지원하는 아티팩트 URI와 형식을 확인해야 하며 임의 체크포인트 디렉터리가 자동으로 MLflow flavor 모델이 되지는 않습니다. 버전 번호는 생성 결과를 사용하고, 완료된 Canary의 승인 이후에만 production alias를 바꿉니다.

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

### Agent Versioning 연계

[Agent Versioning](../../../../aidlc/enterprise/agent-versioning/index.md)은 코드·도구·프롬프트와 **해결된 불변 모델 버전**을 함께 기록하는 애플리케이션 계약입니다. ConfigMap을 만드는 것만으로 에이전트나 Bedrock이 동기화되지는 않습니다. 아래 1/2는 예시 버전이며 실제 Registry 응답으로 대체합니다. 롤백은 manifest와 라우팅 변경을 함께 검증합니다.

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
          version: 1  # 아직 이전 버전 사용
          registry: mlflow
          registry_alias_at_resolution: production
```

### Bedrock Agents 하이브리드 동기

Bedrock Agents의 `foundationModel`은 오케스트레이션 모델입니다. instruction에 EKS URL을 넣어도 도구 호출·클러스터 DNS 접근·fallback이 구현되지는 않습니다. 아래는 [return control](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-returncontrol.html)을 사용하는 함수 action group 예제입니다. 애플리케이션이 고정된 승인 모델 endpoint에 접근할 수 있는 네트워크와 인증을 갖추고 호출을 수행합니다. `eks_generate`와 `fallback_generate`는 제한 시간과 출력 검증을 구현한 필수 어댑터이며 이 문서에 구현되어 있지 않습니다. DRAFT 변경 후에는 agent 준비와 alias 승격도 별도로 수행해야 합니다.

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

새 이름의 HTTPRoute를 만들지 말고 트래픽에 연결된 `model-serving/model-serving-canary`를 stable 100%로 되돌립니다. stable Pod가 준비되어 있어야 합니다. 리소스 적용 성공과 데이터 경로 반영은 다르므로, 해당 parent/controller의 최신 generation에서 `Accepted=True`, `ResolvedRefs=True`를 확인한 뒤 실제 요청으로 stable 모델을 확인합니다. 진행 중인 요청·스트림이 drain되고 canary 유입이 중단된 것을 확인하기 전에는 canary를 0으로 축소하지 않습니다. 복구 소요 시간은 controller 반영과 연결 수명에 따라 달라집니다.

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

**Rollback 자동화 (Argo Rollouts):**

아래는 Argo Rollouts로 옮길 때의 **정책 발췌**이며 실행 가능한 Rollout이 아닙니다. 실제 적용에는 selector와 Pod template 또는 workloadRef, stable/canary Service, 설치한 버전과 맞는 Gateway API traffic-router plugin 및 `trafficRouting` 설정, 유효한 `canary-quality-check` AnalysisTemplate이 필요합니다. pause는 관측이나 승인을 대신하지 않으며 누락·오류 결과 처리와 rollback 동작을 별도 검증해야 합니다. 위 Workflows와 Rollouts가 같은 HTTPRoute를 동시에 관리하게 하지 마십시오.

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

### Checkpoint 보존 정책

실험 체크포인트와 운영 체크포인트를 서로 겹치지 않는 prefix에 저장합니다. 아래 규칙은 `training-checkpoints/experimental/`만 만료시키며 `training-checkpoints/production/`에는 매칭되지 않습니다. 기존의 상위 prefix 규칙도 함께 검토해야 합니다. 더 구체적인 no-action 규칙은 넓은 만료 규칙의 예외가 되지 않습니다.

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

**보존 전략:**

- 실험 객체: 0–30일 Standard, 30–120일 Glacier Instant Retrieval, 120–365일 Deep Archive, 365일 만료.
- Glacier Instant Retrieval의 최소 90일 보관 후 전환합니다. 작은 객체 전환 제한·요청 비용·최소 보관 요금도 확인합니다.
- 운영 객체: 이 규칙으로 만료되지 않습니다. 영구 보존 보장은 아니며 버전 관리, 다른 lifecycle 규칙, 삭제 권한과 필요시 Object Lock 정책을 따로 설계합니다.

[S3 전환 제한](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html)을 따릅니다. 기존 운영 객체는 검증된 복사본과 복구 절차 없이 이동하거나 삭제하지 않습니다.

## 관측·비용 KPI

### GPU-hours per Quality Improvement

**KPI 정의**: Faithfulness 0.01 상승당 소요된 GPU 시간과 비용

다음 수치와 표는 계산을 설명하기 위한 가상 학습 이력이며 측정 결과가 아닙니다. 실제 입력에서는 GPU 시간·비용이 유한한 비음수이고 `faithfulness_delta > 0`인지 검증합니다. 개선이 0 이하인 실행은 이 비율을 계산하지 말고 별도로 표시합니다.

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

**해석**: 이 가상 이력에서는 개선당 비용이 증가합니다. 실제 중단 결정은 동일한 평가 프로토콜의 반복 측정, 오차 범위와 사업 목표를 함께 검토해야 합니다.

### AMP Recording Rule

`training_gpu_seconds_total{model_family,job}`은 작업별 실제 할당 GPU 수 × 경과 초를 누적하는 커스텀 counter입니다. GPU allocation gauge에 `rate()`를 적용하지 않습니다. `model_release_faithfulness{model_family}`는 동일한 고정 평가 집합·프로토콜로 얻은 현재 승인 릴리스 점수이며 안정된 레이블로 export합니다. 7일 전 값이 없으면 delta는 데이터 없음입니다. 릴리스 점수 차이는 gauge끼리 빼며 `increase()`를 사용하지 않습니다. $12.5/GPU-hour는 계산용 가정으로, 실제 인스턴스 단가나 청구 총액이 아닙니다.

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

이 YAML은 Prometheus 규칙 파일입니다. ConfigMap만 생성해도 AMP에 업로드되지 않습니다. AMP에서는 권한 있는 운영자가 [규칙 파일 업로드](https://docs.aws.amazon.com/prometheus/latest/userguide/AMP-ruler-rulesfile.html) 절차로 rules namespace를 생성/수정하고 상태를 확인해야 합니다. 데이터 수집·규칙 업로드는 이 문서에서 실행하지 않았습니다.

### Grafana 대시보드

아래는 위 규칙을 사용하는 패널 쿼리 명세이며 Grafana import용 dashboard JSON은 아닙니다. 사용하는 Grafana 버전에서 datasource UID, 패널 schema와 필드 단위(초/달러/비율)를 설정합니다. 7일 window 결과에 다시 `increase()`를 적용하지 않습니다. 요청 점유율은 실제 관측값이며 HTTPRoute weight와 정확히 같다고 가정하지 않습니다. 변경 시각은 배포 이벤트에서 가져오며 가상 날짜를 실제 주석으로 표시하지 않습니다.

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

### 주간/월간 Cadence 권장

| 주기 | 액션 | 목표 |
|------|------|------|
| **주간** | Trace 수집 → Reward Labeling | 승인·중복 제거·검토를 통과한 샘플과 부족한 사례 확인 |
| **격주** | GRPO/DPO 학습 여부 검토 | 데이터가 충분할 때만 학습하고 고정 평가셋으로 변화 측정 |
| **월간** | 전체 평가 + Canary 검토 | 품질·지연·오류 기준을 통과한 후보만 승격 |
| **분기** | 비용 대비 ROI 분석 | 학습 중단/지속 의사결정 |

**권장 시작 주기:**

이 일정은 검토 주기의 예시입니다. 데이터 확보 속도, 평가 비용, 한 차례 배포에 필요한 관측 기간에 맞춰 조정하세요. 정해진 주기마다 학습하거나 배포한다고 품질이 일정 비율로 좋아지지는 않습니다.

### 손익 분기 분석

품질 점수의 변화가 이탈률을 얼마나 바꾸는지는 실험으로 확인해야 합니다. 아래는 활성 사용자 수와 월별 매출을 기준으로 한 첫 달 시나리오입니다. 이탈률 10%의 **상대 2% 감소**는 9.8%이며 2pp 감소가 아닙니다. LTV를 월별 사용자당 매출로 대체해 단위를 맞춥니다. 장기 LTV 편익, 공헌이익률, 할인율과 서빙 비용은 포함하지 않았습니다.

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

**출력 예시:**

```text
Monthly training cost: $4,000
Expected additional retained users: 4.0
First-month revenue preserved: $200
Net first-month contribution before other costs: $-3,800
First-month ROI: -95.0%
```

## 다음 단계

- [Trace → Dataset Materializer](./trace-to-dataset.md) — 배포 후 다음 iteration 데이터 수집
- [GRPO/DPO 학습 Job](./grpo-dpo-training.md) — 회귀 발생 시 재학습 실행
- [Agent Versioning](../../../../aidlc/enterprise/agent-versioning/index.md) — 에이전트 레벨 롤아웃 전략

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

- [배포 전략 — Shadow·Canary·A/B·Blue-Green](../../../../aidlc/enterprise/agent-versioning/deployment-strategies.md) — 배포 전략 일반론·선택 기준·Feature Flag 전개 (일반론 canonical)
- [Ragas Evaluation](../../../operations-mlops/governance/ragas-evaluation.md)
- [Inference Gateway 라우팅 전략](../../../model-serving/inference-routing/routing-strategy.md)
- [모니터링 · Observability 셋업](../../integrations/monitoring-observability-setup.md)
