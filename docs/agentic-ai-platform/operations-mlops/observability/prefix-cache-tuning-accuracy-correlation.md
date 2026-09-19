---
title: Prefix 캐시 히트율 튜닝과 정확도 상관 검증
description: Prefix 캐시 튜닝의 효율 개선과 품질 회귀를 구분하기 위해 cached 토큰·턴 간격·preemption의 데이터 계약, 상관 분석의 한계, 비열등성 기반 품질 게이트를 정의하는 운영 가이드입니다.
created: "2026-09-05"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 18
tags:
  - vllm
  - langfuse
  - prometheus
  - evaluation
  - inference
  - observability
  - scope:ops
sidebar_label: 히트율 튜닝과 정확도 상관 검증
sidebar_position: 3
category: genai-aiml
---

## 1. 개요 {#overview}

이 문서는 prefix 캐시 튜닝의 효율 변화와 품질 회귀를 분리하여 검증하는 절차를 정의합니다. 엔진 히트율, 요청별 cached 비율, 턴 간격, preemption을 각각 다른 측정값으로 취급합니다. 대상 독자는 추론 엔진 메트릭과 요청별 평가 결과를 연결하는 플랫폼 팀입니다. 상관 분석은 조사할 연관성을 찾는 도구이며, 품질이 보존됐다는 인과적 증명을 대신하지 않습니다.

[서빙 최적화 모니터링 전략](./llm-serving-optimization-monitoring.md)은 7층 지표 체계·점수 스키마·경보를 설명합니다. 이 문서는 해당 체계의 캐시 튜닝 검증을 구체화합니다. 수집 기반은 [Agent 모니터링 및 운영](./agent-monitoring.md), 캐시 계층의 배경은 [캐시 히트율 전략](../../model-serving/inference-optimization/cache-hit-strategy.md)을 참조합니다.

**검증 범위:** 엔진 정의는 vLLM `v0.26.0` 고정 소스에 근거합니다. 사용 중인 이미지의 지원 기능과 실제 usage 매핑은 별도로 확인합니다. 모든 수치·표·코드는 합성 예시 또는 설계 예시입니다. 운영 실측, 실제 고객 데이터, 모델 호출 결과를 포함하지 않습니다.

## 2. 배경과 검증 가설 {#background}

Prefix caching은 동일한 입력 prefix와 캐시 키의 KV를 재사용하여 계산을 줄이는 최적화입니다. 캐시 미스나 preemption 자체는 정확도 점수가 아닙니다. 그러나 “캐시가 출력을 보존하도록 설계됐다”는 설명으로 실행 결과의 동일성, judge 점수와의 독립성, 구현 결함의 부재를 증명할 수는 없습니다.

vLLM은 기본 설정에서 재현성을 보장하지 않습니다. `VLLM_BATCH_INVARIANT=1`도 지원되는 하드웨어·모델·연산 조건을 확인해야 하며 성능 비용이 있을 수 있습니다. 같은 하드웨어·vLLM 버전이라는 조건도 남습니다. 따라서 이 옵션을 모든 잔여 상관의 자동 해결책으로 취급하지 않습니다([재현성](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/usage/reproducibility.md), [batch invariance](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/batch_invariance.md)).

검증 질문은 두 가지로 분리합니다.

1. **효율 효과:** 변경이 목표한 경로를 통해 cache reuse, TTFT, 처리량 또는 자원 사용을 개선했는가.
2. **품질 제약:** 변경 후 과제별 품질이 사전에 정한 허용 저하폭 이내에 있는가.

캐시 비율과 judge 점수의 연관성에는 질문 난도, 턴 위치, 프롬프트 변경, routing, timeout, 수치 실행 차이 등이 섞일 수 있습니다. 유의한 상관만으로 캐시가 원인이라고 하거나, 설계상 캐시는 원인이 될 수 없다고 배제하지 않습니다. 해시 충돌·구현 오류의 빈도도 집계 상관으로 추정하지 않고 별도 통제 재현과 진단 증거로 조사합니다.

## 3. 메트릭의 의미 {#metric-contracts}

### 3.1 cached 비율의 세 정의 {#cached-ratio}

| 정의 | 단위·분모 | 해석 | 제한 |
|---|---|---|---|
| 엔진 hit ratio | `rate(prefix_cache_hits_total)` 합 / `rate(prefix_cache_queries_total)` 합 | 조회 토큰 중 로컬 cache hit 토큰 비율 | 요청 수 기준 아님. preempted 재조회는 별도 통계 |
| 게이트웨이 cached share | 수집된 cached 입력 토큰 합 / 같은 대상의 총 입력 토큰 합 | 게이트웨이가 관측한 재사용 비중 | 사용 누락·provider 차이·retry·external KV 범위 확인 |
| 요청별 `cached_ratio` | cached 입력 토큰 / 그 요청의 총 입력 토큰 | 요청 단위 설명 변수 | 모든 요청의 비율 평균은 엔진 가중 비율과 다름 |

첫 행의 실제 Prometheus 이름에는 `vllm:` 접두사가 붙습니다. 상세 정의는 [metrics logger](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py)와 [통계 소스](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/stats.py)를 기준으로 합니다. local prefix cache와 외부 KV connector hit를 섞지 않습니다.

vLLM OpenAI 호환 API의 `usage.prompt_tokens_details.cached_tokens`는 옵션·응답 모드에 따라 없을 수 있습니다. `v0.26.0`에서는 서버의 `--enable-prompt-tokens-details` 설정과, 스트리밍 usage를 요청하는 `stream_options.include_usage` 또는 서버 강제 포함 설정을 확인합니다. 게이트웨이가 그 필드를 보존해야 트레이스에 도달합니다. 필드 부재를 0으로 채우지 않습니다([서빙 소스](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/entrypoints/openai/chat_completion/serving.py)).

Langfuse의 flat `usageDetails`는 **서로 겹치지 않는 bucket** 계약입니다. `input`에서 `input_cached_tokens`가 이미 제외된 경우 분모는 둘의 합입니다. 멀티모달·cache-write 등 다른 입력 bucket이 있으면 중복 없이 추가해야 합니다. 모든 exporter가 동일한 필드명을 쓰는 것은 아닙니다([usage 계약](https://langfuse.com/docs/observability/features/token-and-cost-tracking)).

다음은 총 입력 1,000토큰 중 cached 800토큰, 출력 100토큰인 **합성 예시**입니다.

```json
{
  "provider_usage": {
    "prompt_tokens": 1000,
    "prompt_tokens_details": {"cached_tokens": 800},
    "completion_tokens": 100
  },
  "normalized_usage_details": {
    "input": 200,
    "input_cached_tokens": 800,
    "output": 100,
    "total": 1100
  },
  "cached_ratio": 0.8
}
```

`800 / 200`은 잘못된 분모입니다. 아래 검사는 **입력 bucket이 두 개뿐인 계약**에서만 사용합니다. 누락을 unknown으로 유지하고, 불일치를 0–1 범위로 강제 보정하지 않습니다.

```python
def cached_ratio_from_two_buckets(usage):
    keys = ("input", "input_cached_tokens")
    if any(key not in usage or usage[key] is None for key in keys):
        return None
    uncached, cached = (usage[key] for key in keys)
    if any(type(value) is not int or value < 0 for value in (uncached, cached)):
        raise ValueError("Token buckets must be non-negative integers")
    total_input = uncached + cached
    return cached / total_input if total_input else None
```

캐시 매칭은 최종 token ID와 관련 키를 기준으로 합니다. 물리적 `block_size`, `prefix_match_unit`, hybrid attention의 상태 저장·매칭 제약을 확인합니다. 큰 블록 또는 낮은 평균 프롬프트 길이만으로 모든 요청이 구조적 미스라고 판정하지 않습니다.

### 3.2 턴 간격과 잔존 시간 {#turn-gap}

사용자 대화 턴은 같은 세션의 모든 LLM observation과 같지 않습니다. 도구 호출, 병렬 분기, retry를 구분한 뒤 `turn_index`를 정의합니다. 연속 요청의 시작 시각 차이인 `start_gap_s`와 다음 시작에서 이전 완료를 뺀 `idle_gap_s`를 구분합니다. 병렬 요청이나 미완료 요청에는 단순한 연속 idle gap을 부여하지 않습니다.

| 히스토그램 | 의미 | 표본 제한 |
|---|---|---|
| `vllm:kv_block_idle_before_evict_seconds` | 마지막 touch부터 축출까지 | 세션별 TTL 아님 |
| `vllm:kv_block_reuse_gap_seconds` | 블록 touch 사이 간격 | 최근 간격만 보존, 미재사용 블록에는 값 없음 |
| `vllm:kv_block_lifetime_seconds` | 할당부터 축출까지 | 살아 있는 장수 블록의 현재 수명 미포함 |

`--kv-cache-metrics`는 기본 비활성이고 `--kv-cache-metrics-sample` 기본값은 0.01입니다. log stats가 필요합니다. **세 지표 모두 표본 블록의 축출 시 보고**되므로, 표본 추출과 관측 창의 검열·지연을 고려해야 합니다([설정](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/config/observability.py), [보고 소스](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py)).

턴 간격 p95와 축출 idle p50은 다른 개체의 분포입니다. 이를 비교해 “다음 턴은 이미 축출됐다”거나 “축출 이전이다”라고 판정하지 않습니다. cached 비율 산점도의 경계도 routing·부하·입력 변화가 만드는 연관성일 수 있습니다. histogram이 없으면 요청별 비교, 통제된 반복 입력, 대상 엔진 추적 등으로 조사하되 동일한 잔존 시간 측정이라고 부르지 않습니다.

### 3.3 preemption {#preemption}

`vllm:num_preemptions_total`은 preemption 이벤트 수이며 영향을 받은 고유 요청 수가 아닙니다. 동일 요청이 여러 번 preempt될 수 있습니다. 재개 시의 추가 계산이나 지연과 품질 결과를 분리합니다.

| 경로 | 검증할 내용 | 필요한 증거 |
|---|---|---|
| KV 재사용·재계산 | 동일 입력·모델·설정의 결과 보존 기대 | 통제된 출력 비교·엔진 진단 |
| 추가 대기·deadline | 지연 후 취소·스트림 오류·응답 미완료 | 요청별 시간·오류·클라이언트 기록 |
| 실행 조건 변화 | 배치·커널·스케줄링의 영향 가능성 | 고정 입력·seed·revision과 지원되는 재현성 조건 |

요청에 연결한 메트릭 시간 창은 해당 구간에 엔진이나 풀 전체에서 발생한 이벤트를 나타냅니다. 같은 구간의 다른 요청에서 발생한 이벤트도 포함될 수 있으므로, 이 값만으로 특정 요청이 preempt됐다고 판단할 수는 없습니다.

### 3.4 결과 변수 {#outcomes}

[점수 스키마](./llm-serving-optimization-monitoring.md#score-schema)를 사용하되, 점수별 평가 대상·누락·evaluator 오류를 분리합니다. `answer_present`는 사실성 평가가 아니고, `contains_expected`는 키워드 포함 검사입니다. `not_truncated=1`도 정확도를 보장하지 않습니다. 참조 정답·실행 검사·사람 평가로 judge의 적합성을 확인하고, 반복 채점 일치율도 기록합니다.

전체 응답의 미완료율과 완료 응답의 내용 품질을 모두 보고합니다. 미완료 응답을 제외한 분석은 완료한 집단에 조건을 걸기 때문에 선택 편향이 생길 수 있습니다. 제외 후 차이가 사라졌다고 잘림이 유일한 원인이라고 결론 내리지 않습니다.

## 4. 히트율 튜닝 레버 {#tuning-levers}

| 레버 | 의도한 변화 | 검증할 부작용·조건 |
|---|---|---|
| Cache-aware routing·세션 affinity | 재사용 가능한 endpoint로 전달 | 부하 집중·다른 cache salt·stale index·queue 악화 |
| replica 증설 | 처리 용량과 배치 분산 | 엔진별 KV 크기는 그대로이며 locality·cold cache로 hit가 낮아질 수 있음 |
| `gpu_memory_utilization`·동시성 조정 | 메모리·스케줄링 여유 변경 | KV 예산과 다른 메모리 수요·처리량의 트레이드오프 |
| KV dtype FP8 | 16비트 대비 KV 원소 저장 크기 감소 | 전체 메모리·블록 수가 정확히 절반·두 배라는 보장 없음. 품질·backend·scale 검증 |
| 스케일 안정화·최소 replica | 불필요한 프로세스 교체 감소 | crash·rollout·노드 교체나 캐시 축출을 방지하는 보장 아님 |
| 프롬프트 재배열·직렬화 고정 | 공유 token prefix 증가 | 공백·메시지 순서도 모델 입력을 바꿀 수 있음 |
| 매칭 단위·블록 설정 | 재사용 가능한 경계 변경 | 모델·backend·hybrid cache 제약과 성능 확인 |
| context 절단·요약 | 입력 길이와 계산 감소 | 정보 손실·prefix 변화로 hit와 정확도 모두 변동 가능 |

라우팅·용량 레버는 입력 보존을 의도하는 변경이며 무검증으로 “정확도 중립”이라고 인증하지 않습니다. 프롬프트·직렬화·dtype·context·모델 변경에는 직접 품질 게이트가 필요합니다. FP8의 층별 민감도와 calibration 제약은 [고정 양자화 문서](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/quantization/quantized_kvcache.md)를 참조합니다.

효율 결과는 hit ratio, cached prefill 토큰 절대량, TTFT·처리량·자원 사용을 함께 보고합니다. 완료 요청의 `request_prompt_tokens_sum`과 `request_prefill_kv_computed_tokens_sum`의 rate 차이는 cached 토큰 집계이며 실제 GPU 시간 절감의 실측이 아닙니다. TTFT가 개선되지 않았다고 queue만 원인이라고 확정하지 않습니다. 네트워크·토큰화·입력 길이·실험 부하도 확인합니다.

## 5. 비교 설계와 상관 분석 {#comparison-design}

### 5.1 질문·허용 저하폭·배정 단위 {#hypothesis}

품질을 평가된 요청의 통과율로 측정한다면, 먼저 새 설정에서 허용할 최대 저하폭 `margin`을 정합니다. 새 설정과 기준 설정의 통과율 차이는 `delta = p_new - p_baseline`입니다. **비열등성** 판단은 두 설정의 품질이 정확히 같다는 뜻이 아니라, 새 설정의 저하폭이 정해 둔 한도보다 작다는 근거가 있는지 확인하는 절차입니다. 이를 위해 delta 신뢰구간의 하한이 `-margin`보다 높은지 봅니다.

개선과 저하를 모두 일정 범위 안으로 제한하는 양방향 동등성이 목적이라면, 신뢰구간의 상·하한을 사전에 정한 동등성 구간과 비교하는 별도 검정을 설계합니다([통계 방법론](https://lakens.github.io/statistical_inferences/09-equivalencetest.html)).

“통계적으로 유의한 차이 없음”은 비열등성이나 독립성의 증거가 아닙니다. 넓은 신뢰구간은 유해한 저하도 포함할 수 있습니다. 기준 통과율, 허용 margin, 유의수준, 검정력, 표본 배분, 세션 내 상관에 따라 필요한 표본 크기를 계산합니다. 전량 키워드 검사를 하더라도 측정의 한계와 미래 트래픽에 대한 불확실성은 남습니다.

가능하면 동일한 과제 분포에서 무작위 카나리 또는 고정 데이터셋의 paired 비교를 사용합니다. 세션을 두 arm에 나누면 히스토리와 캐시에 간섭하므로 배정 단위를 세션 등으로 정합니다. 공유 엔진의 cache·queue 간섭도 기록합니다. 별도 풀 비교는 간섭을 줄일 수 있지만 자원 조건 차이를 통제해야 합니다. 동시간대 배포만으로 이런 혼동이 제거되지는 않습니다.

### 5.2 데이터 단위와 조인 {#data-join}

| 필드 | 출처 | 계약 |
|---|---|---|
| 논리 요청·시도·observation ID | gateway·trace | retry·fallback을 별도 시도로 연결 |
| `cached_ratio`, total input·output | 정규화 usage | 누락 여부·bucket 계약·cache 범위 보존 |
| `turn_index`, `start_gap_s`, `idle_gap_s` | 세션·시각 | 사용자 턴·도구·병렬 분기 구분 |
| 모델·template·tokenizer·엔진 revision | 배포·trace | 변경 arm과 공변량 구분 |
| cluster·namespace·Pod·engine | 선택 endpoint 기록 | request→engine 귀속. 식별자는 접근 제어 |
| `preempt_window`, KV·queue | Prometheus 시간 창 | 개별 요청 preemption 여부 아님 |
| 평가 값·상태·버전·포함 확률 | 평가 저장소 | 결과 누락·오류·표본 설계 포함 |

관측·점수 목록 API를 pagination하여 추출하고 `observation ID + evaluator version` 등의 키로 조인합니다. Metrics API의 집계값은 요청 단위 export를 대체하지 않습니다. 배포된 Langfuse 서버의 지원 API를 확인하고, 인제스트 지연을 고려한 watermark와 멱등 재수집을 사용합니다.

다음 PromQL은 **뒤쪽 5분 창**에 대해 계산합니다. 5분은 예시이며 최소한 여러 scrape가 들어오도록 조정합니다. `cluster`, `namespace`, `pod`를 target 라벨로 붙이고 엔진당 수집원 하나를 사용하는 계약은 [모니터링 전략](./llm-serving-optimization-monitoring.md#cache-breakdown)과 같습니다.

```promql
# Interval exposure, not a request-level preemption flag.
sum by (cluster, namespace, pod, model_name, engine) (
  increase(vllm:num_preemptions_total[5m])
) > bool 0
```

```promql
# Mean of observed gauge samples within the trailing window.
avg_over_time(vllm:kv_cache_usage_perc[5m])
```

요청 처리 구간과 겹치는 창을 연결하고 scrape 간격·빈 구간·시계 오차를 기록합니다. 미래 ±1분을 붙이는 방식은 온라인 예측에 쓰지 않으며, 소급 분석에서도 요청 이후 사건 혼입을 명시해야 합니다. 시리즈가 없거나 표본이 부족하면 `preempt_window=0`이 아니라 unknown입니다. Pod 귀속이 없으면 풀 단위 노출이라고 표시합니다.

### 5.3 층화·표본·신뢰구간 {#stratification}

상관관계를 살펴볼 때는 모델, 과제 유형, 템플릿, 입력 길이, 턴 위치, 시간대와 부하가 다른 요청을 구분해 비교합니다. 다만 비교하려는 변경 자체가 프롬프트 버전이라면, 버전별로 자료를 나눈 뒤 각 버전 안에서만 분석해서는 구버전과 신버전의 차이를 확인할 수 없습니다. 같은 과제와 입력 집합에 두 버전을 적용하고, 그 밖의 조건을 맞춰 비교하세요. 입력 토큰 수가 같아도 입력 내용이나 과제 난도가 같다는 뜻은 아닙니다.

| 탐색 변수 | 예시 구간 | 함께 보고할 결과 |
|---|---|---|
| `cached_ratio` | 0 / (0, 0.5] / (0.5, 0.9] / (0.9, 1] | 점수·통과율·미완료율·표본 수·누락률 |
| `idle_gap_s` | 사전에 정한 workload별 구간 | 모델·turn·부하별 결과. 축출 p50을 TTL 경계로 사용하지 않음 |
| `preempt_window` | 0 / 1 / unknown | 전체 미완료율과 완료 집단의 품질을 함께 표시 |

요청들이 같은 세션·템플릿·시간대에 묶여 있으면 독립 표본을 가정한 단순 신뢰구간은 과도하게 좁아질 수 있습니다. 실험 배정 단위의 집계 또는 cluster bootstrap 등 설계에 맞는 방법을 사용합니다. Judge 하드캡·실패로 표본 포함 확률이 다르면 층별 비교·가중치·민감도 분석을 적용합니다. 여러 구간·점수를 반복 검사할 때는 다중 비교와 중간 결과를 보고 중단하는 규칙도 사전에 정합니다.

아래는 margin 2%p, 사전에 선택한 신뢰수준을 가정한 **판정 로직 예시**입니다. 신뢰구간은 설명을 위해 주어진 값이며 실제 표본에서 계산한 결과가 아닙니다.

| delta 신뢰구간 | 하한과 −2%p 비교 | 품질 게이트 |
|---|---|---|
| [−0.8%p, +0.4%p] | 하한이 높음 | 정해진 기준에서 비열등성 충족 |
| [−4%p, +1%p] | 허용 저하폭을 포함 | 결론 불충분. 무차이로 승격하지 않음 |
| [−5%p, −3%p] | 전체 구간이 낮음 | 품질 회귀 근거. 보류·롤백 조건 평가 |

### 5.4 결과 해석 {#interpretation}

| 관측 | 가능한 설명 | 후속 확인 |
|---|---|---|
| hit 상승·품질 기준 충족 | 목표한 효율 개선 | TTFT·처리량·coverage와 부작용 확인 |
| hit 상승·품질 CI가 넓음 | 평가 정보 부족 | 사전 계획에 따른 추가 표본 또는 변경 보류 |
| cached 비율과 점수 연관 | 과제 난도·턴 위치·입력·실행 경로 | 층화·통제 비교. 캐시 원인으로 단정하거나 배제하지 않음 |
| 긴 gap과 낮은 점수 | 주제 전환·입력 절단·routing·부하 | 내용·최종 입력·대상 엔진 확인 |
| preemption 창에 미완료·점수 악화 | deadline·포화·동시 이벤트 | 요청별 경로 확인. 완료 집단 분석의 선택 편향 표시 |
| 변경 arm에서 지속적 저하 | 프롬프트·모델·dtype 등 회귀 가능성 | 이전 설정과 통제 재현, rollout 보류·rollback |

층화 후 연관성이 사라져도 단일 원인을 증명하지 못합니다. 남는 연관성도 batch 비결정성이나 해시 충돌을 자동으로 뜻하지 않습니다. 구현 오류, 누락된 변수, 측정 오차를 함께 조사합니다.

### 5.5 한계 {#limitations}

- Judge는 정답이 아니며, 사람·참조 평가와의 일치도와 반복 채점 안정성이 필요합니다.
- 상관 분석은 측정되지 않은 혼동 변수와 역인과를 제거하지 못합니다.
- 인프라 시간 창은 개별 요청의 preemption·축출 이력을 대체하지 못합니다.
- 축출 histogram은 표본·보고 지연·관측 창에 의존합니다.
- 대표성이 낮은 평가 표본과 미완료·누락 응답 제외는 결과를 왜곡할 수 있습니다.
- 좁은 기간·과제·환경에서의 비열등성은 다른 모델·부하·입력 분포의 보장이 아닙니다.

## 6. 운영 절차 {#tuning-cycle}

1. **계약과 기준선:** 데이터 매핑·coverage·evaluator 버전을 확인하고 대표 부하 주기를 포함하는 기간을 선택합니다. 24시간은 예시일 뿐 충분성의 보장이 아닙니다.
2. **실험 계획:** 레버 하나, 배정 단위, 지표, 품질 margin, 표본 계획, 관측 기간, 승격·중단·rollback 조건을 기록합니다.
3. **제한된 변경:** 동시간 비교 또는 paired 실험으로 변경 arm을 구분합니다. 기존 모델·템플릿·dtype·배포 설정을 복구할 수 있게 보존합니다.
4. **효율 확인:** hit ratio, cached 토큰 절대량, TTFT·처리량·자원 사용과 보조 지표를 비교합니다. 단일 지표의 개선만으로 경로를 확정하지 않습니다.
5. **품질 게이트:** 계약 위반·미완료율과 유효한 평가의 비열등성을 확인합니다. 표본 부족·coverage 부족이면 보류합니다. 입력 보존을 의도한 레버도 기본 계약·회귀 검사를 생략하지 않습니다.
6. **상관 감사와 기록:** 탐색 표·신뢰구간·표본 수·누락률·설정 revision·복구 절차를 남깁니다. 설명되지 않은 회귀가 있으면 승격을 보류하고 추가 진단합니다.

실제 클라우드 변경과 평가 모델 호출은 운영 승인·예산·데이터 정책에 따라 별도로 수행합니다. 이 가이드는 해당 실행이나 검증 완료를 주장하지 않습니다.

## 7. 결론 {#summary}

캐시 효율은 품질 점수가 아니며, 출력 보존 설계는 무상관의 통계적 증명이 아닙니다. 튜닝은 올바른 usage 분모와 요청·엔진 귀속을 바탕으로 효율 효과를 측정합니다. 품질은 사전에 정한 허용 저하폭, 대표 표본, 신뢰구간과 커버리지로 검증합니다. 상관 분석은 후속 조사의 방향을 제공하고, 승격 판단에는 실험 설계와 명시적인 품질 기준이 필요합니다.

## 참고 자료 {#references}

### 공식 문서·고정 소스

- [vLLM v0.26.0 prefix caching](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/design/prefix_caching.md) — 캐시 키·축출·해시 설계
- [vLLM metrics logger](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/loggers.py) — 지표 정의·종료 요청 집계·축출 이벤트 보고
- [vLLM statistics](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/v1/metrics/stats.py) — 토큰 기준 카운터와 preempted 통계 분리
- [vLLM CacheConfig](https://github.com/vllm-project/vllm/blob/v0.26.0/vllm/config/cache.py) — 물리적 블록과 prefix 매칭 단위
- [vLLM reproducibility](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/usage/reproducibility.md) — 재현성 조건
- [vLLM batch invariance](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/batch_invariance.md) — 지원 조건과 성능 비용
- [vLLM quantized KV cache](https://github.com/vllm-project/vllm/blob/v0.26.0/docs/features/quantization/quantized_kvcache.md) — FP8와 calibration의 제약
- [Langfuse usage contract](https://langfuse.com/docs/observability/features/token-and-cost-tracking) — 입력 bucket 정규화와 이중 계산 방지
- [Langfuse Metrics API](https://langfuse.com/docs/metrics/features/metrics-api) — 집계 API와 배포 버전 호환성
- [Langfuse scores](https://langfuse.com/docs/evaluation/evaluation-methods/scores-via-sdk) — 점수 타입·관측 연결·멱등 저장

### 논문·방법론

- [Judging LLM-as-a-Judge](https://arxiv.org/abs/2306.05685) — judge 편향과 사람 평가 비교
- [Equivalence testing](https://lakens.github.io/statistical_inferences/09-equivalencetest.html) — 동등성·비열등성과 비유의성의 차이

### 관련 문서

- [서빙 최적화 모니터링 전략](./llm-serving-optimization-monitoring.md) — 7층 관측 체계와 품질 스키마
- [캐시 히트율 전략](../../model-serving/inference-optimization/cache-hit-strategy.md) — 캐시 계층과 효율 목표
- [KV 캐시 최적화](../../model-serving/inference-optimization/kv-cache-optimization.md) — KV 메모리와 최적화 배경
- [Ragas 평가](../governance/ragas-evaluation.md) — RAG 평가 지표·데이터셋
