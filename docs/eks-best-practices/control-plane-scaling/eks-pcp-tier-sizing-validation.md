---
title: EKS PCP 티어 사이징 & 성능 검증 가이드
description: PCP 티어별 상세 파라미터, APF seat 산정 공식, 대규모 클러스터 사이징 예시, ClusterLoader2 성능 검증 방법론, 고객 사례
created: "2026-04-07"
last_update:
  date: "2026-06-28"
  author: YoungJoon Jeong
reading_time: 45
tags:
  - eks
  - pcp
  - sizing
  - performance
  - apf
  - clusterloader2
  - etcd
  - scope:ops
sidebar_label: PCP Tier Sizing
sidebar_position: 2
---

> **목적**: Kubernetes 버전별 공개 용량 사양으로 PCP 후보를 좁히고 워크로드 측정으로 검증합니다. 문서화된 구성, 계획 가정, 산술 예제, 공개 벤치마크를 구분합니다.

:::tip 관련 문서
아키텍처와 CRD 설계 배경은 [EKS Control Plane & CRD at Scale 종합 가이드](./eks-control-plane-crd-scaling)를 참조하세요.
:::

## 이 문서에서 다루는 내용 {#이-문서에서-다루는-내용}

1. 버전별 티어 사양과 재현 가능한 사이징 방법
2. 공개 벤치마크의 조건과 적용 한계
3. 측정, throttling 진단, 통제된 성능 검증

**공개 근거 확인일: 2026-09-18.** 티어 기준은 해당 날짜에 확인한 [EKS Provisioned Control Plane 사용자 가이드][pcp]입니다. AWS가 문서를 갱신하므로 실제 운영 결정 전에는 버전별 표를 다시 확인하세요. 아래 계산은 예제이며 EKS 클러스터 실측 결과가 아닙니다.

## 1. PCP 사양과 사이징 근거 {#1-pcp-티어-스팩-기준-및-practical-오브젝트-수량}

<a id="확인된-고객-사례"></a>
<a id="클러스터-규모에-대한-중요-참고사항"></a>
<a id="단일-클러스터-스케일링의-주요-병목"></a>

### 1.1 클러스터 규모만으로 알 수 있는 범위 {#11-대형-고객-단일-클러스터-규모-벤치마크}

노드와 Pod 수는 워크로드 규모를 나타내지만 API 요청 구성, seat 점유, DB 사용량, 복구 성능을 결정하지는 않습니다. 2.2절의 AWS 공개 벤치마크는 특정 워크로드의 참고 사례이며 노드 수를 티어에 대응시키는 규칙이 아닙니다.

이 문서는 고객 데이터를 근거로 사용하지 않습니다. 벤치마크를 인용하려면 공개 출처와 함께 워크로드, 구성, 측정 조건을 평가할 수 있어야 합니다. 가상의 10,000노드·1,000,000 Pod 예제가 해당 규모의 지원이나 검증을 입증하지는 않습니다. Kubernetes 확장성 SLO에도 [구성, 확장 기능, 부하에 관한 전제 조건][slos]이 있으며 모든 배포판과 워크로드를 무조건 보장하지 않습니다.

### 1.2 버전별 공개 티어 사양 {#12-티어별-공식-사양}

다음은 **2026-09-18에 확인한 AWS 사용자 가이드**의 값입니다. EKS v1.30–v1.33과 v1.34 이상을 구분합니다. AWS는 티어 속성을 내부 구성 값으로 설명하며 실제 처리 성능은 워크로드에 따라 달라진다고 명시합니다. 특히 스케줄링 속성이 같은 속도의 Pod Ready 전환을 보장하지는 않습니다. [출처: 티어 사양과 실제 성능의 구분][pcp].

| 티어 | API seats: EKS v1.30–v1.33 | API seats: EKS v1.34+ | 스케줄링 속성 (pods/s) | DB 크기 (GB, AWS 표기) |
|---|---:|---:|---:|---:|
| XL | 1,700 | 2,000 | 167 | 16 |
| 2XL | 3,400 | 4,000 | 283 | 16 |
| 4XL | 6,800 | 8,000 | 400 | 16 |
| 8XL | 13,600 | 16,000 | 400 | 16 |

Standard 모드는 자동 확장하며 DB 한도는 8 GB입니다. 이 사양은 Standard에 고정된 seat 수나 스케줄링 임계값을 제시하지 않습니다. Provisioned 모드는 선택한 티어를 유지하며 티어 사이를 자동으로 이동하지 않습니다. 표에 없는 버전 구간의 값을 추정해서 적용하지 마세요. AWS 가이드는 버전별 티어 속성을 조회하는 방법으로 `DescribeClusterVersions`도 안내합니다. [출처][pcp].

### 1.3 공개 구성과 내부 구현 추정의 경계 {#13-티어별-k8s-컨트롤-플레인-파라미터-상세}

API 서버 수나 서버별 플래그를 역산하지 않고 위 티어 속성을 사용합니다. 공개 근거가 없는 `max-requests-inflight`, 컨트롤러 QPS, compaction 주기, 이벤트 저장 구조를 티어별 값으로 제시하지 않습니다.

APF가 활성화된 Kubernetes는 두 inflight 한도를 합쳐 API 서버별 동시성 예산을 만들고 우선순위 수준에 배분합니다. 설정된 대여·차용 정책에 따라 각 수준의 유효 한도가 달라질 수 있습니다. 공개 티어 용량과 특정 API 서버의 APF 한도는 관측 범위가 다릅니다. [출처: APF 우선순위 수준][apf].

<a id="api-request-concurrency-seats"></a>
<a id="1700-seat이-작아-보이지-않는-이유"></a>
<a id="pod-scheduling-rate-podssec"></a>
<a id="cluster-db-size-etcd"></a>

### 1.4 단위와 측정 범위 {#14-각-메트릭의-실제-의미}

| 항목 | 의미 | 사이징 시 해석 |
|---|---|---|
| Seats | 가중 API 실행 동시성. 한 요청이 여러 seat을 점유할 수 있음 | 요청 수나 requests/s만으로 산정할 수 없음 |
| Seat-seconds | seat 수와 점유 시간의 곱 | 요청률과 요청당 평균 seat-seconds의 곱은 평균 점유량이며 버스트 피크가 아님 |
| 스케줄링 pods/s | 성공한 스케줄링 처리율. 시도 횟수나 애플리케이션 준비 완료와 구분 | 스케줄링 성공과 전체 복구 시간을 별도로 측정 |
| DB bytes | 할당된 저장 공간과 사용 중인 데이터를 구분 | quota 관련 메트릭과 같은 단위의 한도를 비교 |

APF는 큰 LIST 요청에 가중치를 적용하고 watch 초기화 및 쓰기로 발생하는 watch 작업을 반영합니다. 모든 LIST가 10 seats를 사용하거나 모든 쓰기의 추가 비용이 고정이라고 가정하지 마세요. 해당 버전의 동작과 요청 구성을 확인해야 합니다. [출처][apf].

현재 AWS [CloudWatch 메트릭 정의][cw]는 할당 크기인 `etcd_mvcc_db_total_size_in_bytes`(`apiserver_storage_size_bytes`로도 알려짐)와 quota 판단에 쓰는 `etcd_mvcc_db_total_size_in_use_in_bytes`를 구분합니다. JSON payload 길이는 어느 DB 메트릭과도 같지 않습니다. 아래 payload 계산은 10진 단위인 1 kB = 1,000 bytes, 1 GB = 1,000,000,000 bytes를 사용합니다. 운영 비교는 bytes를 유지하고 실제 quota 표기를 확인하세요. GB를 GiB(1,073,741,824 bytes)로 바꾸어 계산하면 안 됩니다.

<a id="용어-정리-두-가지-다른-레이어"></a>
<a id="핵심-차이-동시-요청-수-vs-동시-seat-수"></a>
<a id="구체적-시나리오-예시-4xl-클러스터"></a>
<a id="apf-prioritylevel-분배-예시-4xl-basis"></a>

### 1.5 영향을 받은 우선순위 수준에서 APF 포화 진단 {#15-api-request-concurrency-vs-inflight-seats--개념-심화-및-예시}

APF는 FlowSchema로 요청을 분류하고 요청을 처리하는 API 서버에서 해당 우선순위 수준의 한도를 적용합니다. 초과 요청을 거부하도록 설정된 수준은 즉시 429를 반환할 수 있습니다. 큐를 사용하는 수준도 큐가 가득 차거나 대기 시간이 만료되면 거부할 수 있습니다. 다른 수준에 여유 seat이 있다는 사실만으로 해당 요청이 이를 빌릴 수 있다고 판단할 수 없습니다. [출처][apf].

**설명용 가정이며 EKS 기본값이 아닙니다:** 한 서버의 예산이 1,000 seats이고, 수준 A의 현재 한도가 100이며 100을 모두 사용한다고 가정합니다. A는 초과 요청을 거부하고 이 예제의 설정상 추가 차용이 불가능합니다. 다른 수준은 900 seats를 배정받고 100을 사용합니다. 전체 사용률은 `(100 + 100) / 1,000 = 20%`이지만 A의 다음 요청은 429를 받을 수 있습니다. 이 관측만으로 PCP 티어 상향을 결론 내릴 수 없습니다.

429가 발생하면 응답 시점과 API 응답 주체를 확인하고 resource/subresource, verb, 클라이언트, FlowSchema, 우선순위 수준, 거부 사유, 큐 대기, 요청 지연을 같은 시간대에 비교하세요. 클라이언트 rate limiter가 서버 전송 전에 요청을 지연시킬 수 있지만 그 지연 자체가 서버의 HTTP 429는 아닙니다. 누적 거부 카운터의 비영 값은 과거 이벤트일 수 있으므로 장애 구간의 증가량을 확인해야 합니다. [출처: APF 메트릭과 디버깅][apf].

### 1.6 가상 10,000노드 워크로드 계산 예제 {#16-large-scale-cluster-scenario-10000-nodes--100-pods-environment-pcp-sizing}

#### 가정 {#assumptions}

10,000노드에 각각 100 Pods를 배치한다고 가정하면 `10,000 × 100 = 1,000,000 Pods`입니다. 산술 입력일 뿐이며, 아래 payload 크기, 요청 시간, 영향받는 Pod 수, 시간 예산은 모두 설명을 위한 가정입니다. 실측이나 고객 사례를 나타내지 않습니다.

#### 1단계: payload 합계와 DB 사이징 구분 {#step-1-etcd-db-크기-산정}

| 가정한 payload 그룹 | 수량 | 개당 가정 크기 (bytes) | Payload 소계 (bytes) |
|---|---:|---:|---:|
| Pods | 1,000,000 | 1,500 | 1,500,000,000 |
| 커스텀 리소스 (CRs) | 1,000,000 | 1,000 | 1,000,000,000 |
| Nodes | 10,000 | 5,000 | 50,000,000 |
| 기타 payload의 가정 합계 | 1 | 150,000,000 | 150,000,000 |
| 합계 | | | 2,700,000,000 |

Payload 합계는 **10진 단위 2.7 GB**이며 etcd 사용량 예측이 아닙니다. 저장 인코딩, 키, 보존된 버전, 저장 공간 할당 효과를 포함하지 않습니다. etcd가 compaction까지 버전을 보존한다는 사실만으로 일률적인 1.5×–5× 배수, 고정 EKS compaction 주기, 또는 “변경 필드만 저장하므로 리비전당 0.1 kB”라는 가정을 정당화할 수 없습니다. [출처: etcd 데이터 모델][etcd-model].

대신 승인된 테스트 환경에 대표 오브젝트를 적재하고, 전후의 in-use/allocated DB bytes를 기록하세요. 갱신·삭제 패턴을 재현하며 반복 주기의 피크와 회복을 측정합니다. 이 데이터가 없으면 **DB 용량 적합 여부는 미확정**입니다.

#### 2단계: 평균 seat 점유 계산 후 피크 실측 {#step-2-api-concurrency-seats-requirement-estimation}

요청 유형 `i`의 `w_i`를 실행 중 seat 점유를 시간에 대해 적분한 값의 평균, 즉 seat-seconds/request로 정의합니다. 계획 모델은 `평균 seats = Σ(requests/s_i × w_i)`입니다. 큐 대기는 실행 seat 점유가 아니므로 전체 응답 지연을 `w_i` 대신 바로 사용할 수 없습니다.

| 가정한 요청 유형 | Requests/s | 실행 중 seats | 요청당 실행 시간 (s) | 평균 seats |
|---|---:|---:|---:|---:|
| 단순 요청 | 1,000 | 1 | 0.05 | 50 |
| LIST 요청 | 2 | 5 | 0.20 | 2 |
| 합계 | | | | 52 |

예를 들어 `2 × (5 × 0.20) = 2 seats`입니다. 고정 가중치와 실행 시간은 가정이며 일반적인 EKS 지연값이나 Kubernetes LIST 비용 산정식이 아닙니다. 결과 **52는 평균값**이며 피크나 티어 권고가 아닙니다. 대표 버스트에서 실행 seats, 큐 수요, 거부, 지연을 함께 측정하세요. 이미 throttling이 발생하는 환경에서는 실행 seats만으로 실제 유입 수요를 알 수 없습니다.

#### 3단계: 스케줄링 시간 예산 명시 {#step-3-scheduling-throughput-requirement-estimation}

정확히 **3,333개 영향 노드 × 100 Pods = 333,300 Pods**를 재배치한다고 가정합니다. 이는 클러스터의 약 1/3이며 10,000노드를 정확히 3등분한 값은 아닙니다. `필요 처리율 = 영향받는 Pod 수 / 스케줄링 시간 예산(초)`로 계산합니다.

| 가정한 복구 목표 | 다른 작업에 할당한 시간 | 스케줄링 예산 (s) | 필요 처리율 (pods/s) | 속성 100% 기준 스케줄링만 검토한 후보 | 80% 기준 스케줄링만 검토한 후보 |
|---|---:|---:|---:|---|---|
| 15분 | 0 s | 900 | 370.333… | 4XL 또는 8XL | 표에 후보 없음 |
| 30분 | 0 s | 1,800 | 185.166… | 2XL, 4XL 또는 8XL | 2XL, 4XL 또는 8XL |
| 15분 | 180 s | 720 | 462.916… | 표에 후보 없음 | 표에 후보 없음 |

다른 단계에 시간을 배정하지 않은 행은 의도적으로 낙관적인 가정입니다. 장애 감지, 퇴거·대체, 노드 프로비저닝, 네트워크, 볼륨, 이미지 pull, readiness에도 전체 복구 시간이 소요됩니다. 스케줄링 용량만으로 복구 기한을 보장할 수 없습니다. 예제의 80% 기준에서 4XL과 8XL은 모두 `400 × 0.8 = 320 pods/s`입니다. 333,300 Pods 스케줄링에만 `333,300 / 320 = 1,041.5625 s`, 약 **17.36분**이 필요하며 다른 복구 단계의 시간은 별도입니다.

#### 4단계: 미확정 항목 기록 {#step-4-comprehensive-pcp-tier-sizing-result}

30분 목표를 스케줄링만으로 검토하면 2XL 이상을 테스트 후보로 삼을 수 있습니다. 15분 목표는 예제의 80% 정책에서 표에 후보가 없습니다. 어느 결과도 운영 티어를 확정하지 않습니다. 피크 seat 수요, 우선순위 수준별 동작, DB 사용량, 스케줄링 가능 여부, 애플리케이션 복구가 아직 측정되지 않았기 때문입니다. 표에 있는 티어를 높여도 공개 스케줄링 속성은 400 pods/s를 넘지 않습니다.

<a id="theoretical-maximum-based-on-etcd-db-size-pcp-16gb-basis"></a>
<a id="actual-benchmarks-and-customer-cases"></a>
<a id="recommended-workload-scale-guide-by-tier"></a>
<a id="specific-impact-of-crds-on-control-plane"></a>

### 1.7 오브젝트 한도 대신 증가 양상 측정 {#17-production-environment-practical-object-quantities}

CRD는 리소스 유형의 정의이고, 커스텀 리소스 인스턴스(CR)는 각각 별도 오브젝트입니다. 두 항목과 함께 기본 리소스, 컨트롤러, admission webhook, 오브젝트 크기 분포, 갱신률, LIST 범위·빈도, watch 소비자를 조사하세요. 이 목록으로 워크로드를 재현하고 DB와 API 실측 결과를 설명합니다. [출처: 컨트롤 플레인 확장 가이드][scale].

16 GB를 가정한 평균 오브젝트 크기로 나누어도 지원 가능한 오브젝트 수가 되지 않습니다. 오브젝트 수와 변경 빈도를 늘리며 DB 증가, API 지연, 컨트롤러 backlog를 기록하세요. 공개 벤치마크의 리소스 수를 다른 CRD 워크로드의 실용 한도로 적용하지 마세요.

<a id="kubernetes-upstream-및-eks-공식-테스트-한도"></a>
<a id="pcp-티어-산정-공식-요약"></a>

### 1.8 일관된 후보 선택 모델과 경계값 {#18-티어-선택-의사결정-트리}

**AWS 요구사항이 아닌 계획 정책입니다:** 목표 사용률 `u = 0.8`을 선택하여 각 공개 속성의 20%를 여유로 남깁니다. 후보는 다음 조건을 **모두** 충족해야 합니다.

```text
peak execution seats <= u × version-specific tier seats
required scheduling pods/s <= u × tier scheduling attribute
peak in-use database bytes / applicable quota bytes <= u
```

이 모델은 후보를 좁히는 용도입니다. 대표성 있는 측정, 빠짐없는 수집, throttling으로 가려지지 않은 유입 수요를 전제로 합니다. 조건을 만족해도 3절의 워크로드 검증이 필요합니다. 여유 정책을 바꾸면 후보도 달라지므로 계산 전에 정책을 기록하세요.

| 티어 | v1.30–v1.33 seat 예산, 80% | v1.34+ seat 예산, 80% | 스케줄링 예산, 80% (pods/s) |
|---|---:|---:|---:|
| XL | 1,360 | 1,600 | 133.6 |
| 2XL | 2,720 | 3,200 | 226.4 |
| 4XL | 5,440 | 6,400 | 320 |
| 8XL | 10,880 | 12,800 | 320 |

네 티어의 DB 속성은 모두 16 GB이며 XL에서 8XL로 올려도 늘어나지 않습니다. 이 모델의 DB 사용 비율은 모든 후보에서 최대 0.8입니다. `16 × 0.8 = 12.8` 계산은 사양의 GB 표기를 유지한 산술이며, 실제 검사는 측정한 bytes와 해당 quota bytes를 비교해야 합니다. Standard는 별도로 측정하며 고정 처리율을 가정하지 않습니다.

독립적인 **스케줄링 경계 검사**에서 `u = 1`로 두면 표에 있는 가장 작은 후보는 다음과 같습니다.

| 필요 처리율 R (pods/s) | 표에 있는 가장 작은 후보 |
|---|---|
| 0 ≤ R ≤ 167 | XL |
| 167 < R ≤ 283 | 2XL |
| 283 < R ≤ 400 | 4XL |
| R > 400 | 표에 후보 없음 |

정확히 167, 283, 400이면 각각 XL, 2XL, 4XL입니다. 80%를 적용하면 경계는 133.6, 226.4, 320이 됩니다. Seat와 DB 조건도 함께 적용하세요. 등호를 허용하는 것은 이 수학적 정책의 정의이며 서비스 한도까지 사용하는 운영이 적절하다는 근거는 아닙니다. 8XL을 고르는 이유는 더 많은 seats이며 스케줄링이나 DB 속성 증가가 아닙니다.

<a id="method-1-cloudwatch-vended-metrics-free-simplest"></a>
<a id="method-2-prometheus-direct-scraping-detailed-analysis"></a>
<a id="method-3-kubectl-one-liner--check-right-now"></a>
<a id="measurement-result-interpretation-guide"></a>
<a id="고객-측정-요청-템플릿"></a>

### 1.9 모델 적용 전 근거 수집 {#19-apf-seat-actual-usage-monitoring-guide--determine-tier-by-measurement-not-claims}

같은 메트릭 정의로 평상시, 배포 피크, 갱신 부하, 복구 테스트 구간을 수집합니다. 업무 피크를 포함한 일주일은 가능한 관측 계획 중 하나이며 충분성을 보장하지 않습니다. 드문 장애 상황은 별도의 대표 테스트가 필요합니다. 수집 경로와 통계는 3.6절에 정리합니다.

CloudWatch는 기본 EKS 메트릭을 1분 주기로 게시합니다. 실행 seats는 각 1분 구간에 문서화된 **Sum** 통계를 사용하고, 관측 기간의 구간별 값 중 최댓값을 확인하세요. 서로 다른 시간의 seat 값을 합산하지 마세요. 1분 표본은 짧은 버스트를 놓칠 수 있습니다. [출처][cw].

Prometheus에서는 합산 전에 각 API 서버를 정확히 한 번씩 수집하는지 확인합니다. 진단 중에는 instance, 우선순위 수준, FlowSchema 차원을 유지하세요. 단일 `kubectl get --raw /metrics` 응답은 응답한 API 서버의 상태이며 클러스터 전체 합계나 피크를 입증하지 않습니다. 메트릭 누락, 중복 수집, 수집 대상 변경, 측정 클러스터의 포화가 있으면 티어 결정을 확정할 수 없습니다. [출처: raw 메트릭][raw], [APF 메트릭][apf].

## 2. 공개 기능과 벤치마크 근거 {#2-eks-컨트롤-플레인-아키텍처-개선-효과}

### 2.1 Provisioned 모드의 변화 {#21-개요}

Standard 모드는 컨트롤 플레인 용량을 자동 확장합니다. Provisioned 모드는 선택한 티어를 사전 할당하고 변경 전까지 유지합니다. 사이징 관점의 이점은 수요 발생 전에 용량을 확보하는 것이며 모든 요청 지연이나 Pod 복구 시간을 보장하는 것은 아닙니다. [출처][pcp].

### 2.2 조건을 함께 읽는 공개 벤치마크 {#22-performance-improvement-benefits-for-customers}

[2025-11-27에 게시된 AWS 출시 글][launch]은 다음 **테스트 시나리오**를 보고합니다.

| 리소스 | Standard 테스트 | 4XL 테스트 |
|---|---:|---:|
| Nodes | 5,000 | 40,000 |
| Pods | 80,000 | 640,000 |
| Deployments | 500 | 40,000 |
| Jobs | 500 | 40,000 |

AWS는 ClusterLoader2, 여러 subnet/CIDR, 여러 AZ의 Karpenter static node pool, VPC CNI prefix delegation과 warm prefix, ECR 이미지, SOCI로 최적화한 containerd를 사용했습니다. 워크로드에는 stateless 서비스, Job, DaemonSet이 포함되었고 지속 부하와 버스트 단계를 수행했습니다. 글은 결과를 워크로드에 따라 달라지는 참고 지표로 명시합니다. [출처][launch].

이는 AWS가 보고한 근거이며 이 문서에서 재현한 테스트가 아닙니다. 표의 리소스 행은 저장된 Kubernetes 오브젝트 전체 목록이 아닙니다. 해당 글만으로는 버전이 고정된 완전한 재현 자료와 원시 시계열을 확보할 수 없으므로 그래프에서 보편적인 P99 지연, 지속적인 350 pods/s, 100만 Pod 지원을 추론하지 않습니다. 출시 당시의 티어 표도 최신 버전별 사용자 가이드를 대체하지 않습니다.

### 2.3 용량과 가용성의 경계 {#23-xl-이상-티어에서만-사용-가능한-기능}

사용자 가이드는 Standard의 8 GB DB와 각 PCP 티어의 16 GB DB, 서로 다른 가용성 SLA 조건을 명시합니다. 엔드포인트 가용성 SLA는 API 지연, 오브젝트 용량, 복구 목표와 별개입니다. 보장과 조건은 [EKS SLA][sla]에서, 비용은 메트릭으로 추정하지 말고 [요금 페이지][pricing]에서 확인하세요. [출처][pcp].

API 서버 수평 확장이 PCP 전용이라고 추정하거나, 공개 사양 없이 이벤트 샤딩 보장이나 티어별 서버 구조를 제시하지 마세요. 사용자 가이드에 따르면 Standard로 복귀하려면 DB 크기가 **8 GB 미만**이어야 합니다. 이후 롤백 계획에 이 제약을 반영해야 합니다. [출처][pcp].

## 3. 워크로드 성능 검증 {#3-eks-컨트롤-플레인-성능-검증-방법론}

<a id="installation-and-build"></a>
<a id="execution-method"></a>
<a id="key-override-parameters"></a>

### 3.1 ClusterLoader2와 재현성 {#31-testing-tool-clusterloader2-cl2}

[ClusterLoader2(CL2)][cl2]는 Kubernetes의 YAML 기반 확장성 테스트 프레임워크이며 AWS 공개 벤치마크에도 사용되었습니다. README는 측정 항목, override, 필수 플래그를 설명합니다. 테스트 클러스터와 호환되는 리비전을 선택하고 정확한 Git SHA, 빌드 환경, 구성, override, 이미지, 수집 설정을 기록하세요. 링크의 README는 참조를 위해 리비전을 고정했으며 현재 EKS에서 해당 리비전을 빌드하거나 검증했다는 의미가 아닙니다.

목표 리소스 구성과 변경 패턴을 모델링하는 테스트 설정을 사용하세요. 일반 부하 테스트만으로 CRD나 복구 동작을 검증할 수는 없습니다. `--provider=eks` 지원을 가정하지 말고 선택한 리비전의 provider 옵션을 확인하세요. 필수 측정이 실제로 실행되는지도 확인해야 합니다. CL2는 Prometheus가 없으면 API 응답성 측정을 건너뛸 수 있다고 설명합니다. [출처][cl2].

### 3.2 테스트 시나리오 {#32-테스트-시나리오-유형}

| 시나리오 | 통제할 입력 | 기록할 근거 |
|---|---|---|
| 평상시 | 안정된 오브젝트 목록과 요청 구성 | Seats, DB bytes, 지연, 스케줄링 성공 |
| 배포 버스트 | 유한한 Pod 수와 유입률 | 유입·완료 작업, 큐 대기, 거부 |
| CR 변경 부하 | 크기, 초당 갱신·삭제, 지속 시간 | In-use/allocated DB 피크, LIST 지연 |
| 컨트롤러 재연결 | 재연결하는 watch 클라이언트 수 | Relist 수, seat 수요, 컨트롤러 회복 |
| 복구 | 영향 Pod 수, 준비된 여유 용량, 단계별 예산 | 스케줄링과 애플리케이션 준비 완료 시간 |

제안된 테스트이며 측정 결과가 아닙니다.

### 3.3 다섯 단계 검증 {#33-5-phase-load-testing-strategy}

1. **기준선:** 메트릭 수집 범위를 확인하고 초기 오브젝트 목록과 지연을 기록합니다.
2. **부하 증가:** 제한된 유입 부하를 늘리며 실제 완료율과 큐 대기·거부·SLO 위반의 시작점을 기록합니다.
3. **피크 유지:** 관련 변경·저장 주기를 포함할 만큼 계획한 부하를 유지합니다. 30분은 예시이며 보편적인 요구사항이 아닙니다.
4. **버스트:** 정해진 배포·재연결 패턴을 실행하고 큐와 애플리케이션이 회복하는 시간을 측정합니다.
5. **회복:** 생성 부하를 중지하고 테스트 소유 리소스만 정리한 뒤 DB, backlog, 지연이 예상 범위로 돌아오는지 확인합니다.

후보 티어를 비교할 때는 동일한 시나리오를 반복합니다. 한 번의 성공만으로 변동성이나 장애 복구를 설명할 수는 없습니다.

### 3.4 제한된 테스트 도구의 요구사항 {#34-간단한-스크립트-기반-테스트-without-cl2}

CL2를 사용하지 않더라도 테스트 도구에는 유한한 작업 수, 명시적 요청률·동시성 한도, 지속 시간, timeout, 제한된 재시도, 완료·오류 집계가 필요합니다. 무한 LIST 루프나 수천 개의 백그라운드 `kubectl` 프로세스는 클라이언트 부하와 컨트롤 플레인 용량을 혼동하게 합니다. AWS도 비효율적인 kubectl 반복 호출을 피하도록 권고합니다. [출처][scale].

운영자가 실행하기 전에 AWS account/profile/region, cluster/context, 전용 namespace, 리소스 소유권, 최대 워커 용량, 비용 예산, 중지 조건, 정리·복구 절차를 기록하세요. 사전에 정한 애플리케이션 또는 컨트롤 플레인 SLO를 위반하면 중지합니다. 이전 티어 복구는 해당 용량과 Standard DB 복귀 조건을 확인한 뒤 수행해야 합니다. 이 문서 검토에서는 라이브 테스트나 티어 변경을 실행하지 않습니다.

### 3.5 Upstream SLO와 테스트 합격 기준 구분 {#35-official-kubernetes-slislo-standards-validation-success-criteria}

[리비전이 고정된 Kubernetes SLO 프레임워크][slos]는 구성·워크로드 전제 조건하에 다음 목표를 포함합니다.

| Upstream 범위 | 목표 |
|---|---|
| 단일 오브젝트 변경 호출과 resource 범위의 비스트리밍 읽기 | P99 ≤ 1 s |
| Namespace/cluster 범위의 비스트리밍 읽기 | P99 ≤ 30 s |
| 스케줄링 가능한 stateless Pod의 시작, 이미지 pull과 init container 시간 제외 | P99 ≤ 5 s |

이 프레임워크의 API 목표는 명시된 대로 virtual/aggregated 리소스와 CRD를 제외합니다. SLI 관측 구간과 클러스터별 일일 평가 방식도 중요하며 단일 5분 P99가 전체 SLO 평가는 아닙니다. Pod 시작 목표는 일률적인 scheduler P99 ≤ 5 s 보장이 아닙니다. CR, admission webhook, 오류율, 스케줄링 처리율, 애플리케이션 준비 완료까지의 복구에 대해 오류 예산, 관측 구간, 반복 실행을 포함한 별도 합격 기준을 정의하세요.

<a id="cloudwatch-vended-metrics-free-automatic"></a>
<a id="prometheus-scraping-endpoints-k8s-128"></a>

### 3.6 수집 경로와 유효 통계 {#36-주요-모니터링-메트릭--수집-경로별-가용성-by-collection-path}

[CloudWatch 기본 EKS 메트릭][cw]은 Kubernetes v1.28 이상에서 `AWS/EKS`에 1분 주기로 게시됩니다. 표에는 문서화된 통계를 사용합니다. 추가 수집, 저장, 로그, 경보는 각자의 설정과 비용 조건을 확인해야 합니다.

| CloudWatch 메트릭 | 통계 | 해석 |
|---|---|---|
| `apiserver_flowcontrol_current_executing_seats` | Sum | 구간의 실행 seats. 구간별 값의 피크 확인 |
| `apiserver_request_total_429` | Sum | 구간 내 서버 429 수. 원인 자체는 아님 |
| `apiserver_request_total_5XX` | Sum | 서버 5xx 수. 메트릭 이름의 대소문자에 주의 |
| `scheduler_schedule_attempts_SCHEDULED` | Sum | 성공한 스케줄링 시도. 1분 집계를 60으로 나누면 pods/s |
| `scheduler_schedule_attempts_UNSCHEDULABLE` | Sum | 배치 제약으로 실패한 시도. PCP 상향 조건이 아님 |
| `apiserver_request_duration_seconds_LIST_P99` | Average | 이미 계산된 LIST P99. 다시 백분위수 계산하지 않음 |
| `etcd_mvcc_db_total_size_in_use_in_bytes` | Maximum | EKS quota 판단에 쓰는 실제 DB 사용량 |
| `etcd_mvcc_db_total_size_in_bytes` | Maximum | 할당 크기. 복제된 DB 사본을 합산하지 않음 |

[AWS가 문서화한 raw 엔드포인트][raw]는 다음과 같습니다.

```bash
# Read-only snapshots; use the intended kubeconfig context.
kubectl get --raw /metrics
kubectl get --raw /apis/metrics.eks.amazonaws.com/v1/ksh/container/metrics
kubectl get --raw /apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics
```

명령은 예제이며 이번 검토에서 실행하지 않았습니다. 권한과 실제 메트릭 노출 여부를 확인하세요. PCP 가이드는 Prometheus용 in-use etcd 메트릭의 배포를 안내하므로 클러스터에서 실제 제공되는지 확인해야 합니다. `apiserver_storage_size_bytes`는 할당 크기이며 quota 계산에서 in-use bytes 대신 그대로 사용할 수 없습니다. 문서화되지 않은 raw etcd 엔드포인트가 있다고 가정하지 마세요. [출처][pcp] [cw].

### 3.7 검증 근거 체크리스트 {#37-load-testing-checklist-10-items}

티어 검증을 완료했다고 기록하기 전에 다음 자료를 보관합니다.

1. Kubernetes/platform 버전, 티어, 리전, 테스트 시각
2. 도구 SHA, 구성, override, 이미지 digest, 테스트 시간
3. 오브젝트 목록, 크기 분포, 요청 구성, 유입 부하
4. 메트릭 이름, 단위, label, 통계, 수집 주기
5. API 서버 수집 범위, 중복 시계열 검사, 데이터 누락 구간
6. Instance·우선순위 수준별 실행 seats, 현재 한도, 큐 대기, 거부 사유
7. 작업·리소스별 API 지연과 서버 오류 수
8. 증가·변경·회복 구간의 in-use/allocated DB bytes
9. 스케줄링 성공, unschedulable 사유, 애플리케이션 준비 완료 시간
10. 합격 기준, 반복 실행 결과, 중지 이벤트, 정리 결과

자격 증명, 고객 원시 로그, 식별자, 비공개 워크로드 데이터는 공개 근거에 넣지 않습니다. 승인되고 민감정보가 제거된 결과와 해석에 필요한 한계만 공개하세요.

### 3.8 진단 질문에 맞는 PromQL {#38-유용한-promql-쿼리}

예제는 **단일 클러스터**, 각 API 서버를 한 번 수집하는 `apiserver` job, 중복 없이 scheduler를 수집하는 `ksh` job을 가정합니다. 환경에 맞게 selector를 바꾸고 여러 클러스터를 조회하면 cluster label을 유지하세요. 시계열 누락은 사용량 0이 아니라 수집 범위 미확인입니다. APF 이름과 label은 [Kubernetes v1.34.0 메트릭 정의][apf-metrics]와 대조했습니다. `current_limit_seats`는 해당 버전에서 alpha이므로 제공되지 않을 수 있습니다.

```promql
# Occupancy/current limit by API server and non-exempt priority level.
sum by (instance, priority_level) (
  apiserver_flowcontrol_current_executing_seats{job="apiserver",priority_level!="exempt"}
)
/
sum by (instance, priority_level) (
  apiserver_flowcontrol_current_limit_seats{job="apiserver",priority_level!="exempt"}
)
```

대여·차용으로 한도가 달라질 수 있으므로 제공된다면 현재 한도를 사용합니다. `apiserver_flowcontrol_nominal_limit_seats`만 있으면 이를 비교하되 결과를 **nominal 사용률**로 표시하세요. 100% 초과는 차용을 반영할 수 있습니다. 한도가 0인 경우는 별도로 조사하고 0으로 나눈 값을 사용률로 해석하지 마세요. [출처][apf].

```promql
# Incident rejection rate: preserve the affected flow and reason.
sum by (instance, priority_level, flow_schema, reason) (
  rate(apiserver_flowcontrol_rejected_requests_total{job="apiserver"}[5m])
)

# Current queued requests: a brief queue is not proof of insufficient tier capacity.
sum by (instance, priority_level, flow_schema) (
  apiserver_flowcontrol_current_inqueue_requests{job="apiserver"}
)

# P99 queue wait by API server and priority level for dispatched requests.
histogram_quantile(0.99,
  sum by (le, instance, priority_level) (
    rate(apiserver_flowcontrol_request_wait_duration_seconds_bucket{
      job="apiserver",execute="true"
    }[5m])
  )
)
```

```promql
# Successful scheduling rate; total attempts also include failures.
sum(rate(scheduler_schedule_attempts_total{job="ksh",result="scheduled"}[5m]))
```

Scheduler 카운터의 `result` 차원은 성공과 unschedulable/error 시도를 구분합니다. 처리율을 실제 배치·readiness 시각과 비교하세요. 이 값은 이미지 pull이나 애플리케이션 준비 완료를 측정하지 않습니다. [출처: Kubernetes v1.34.0 scheduler 메트릭][scheduler-metrics].

### 3.9 Audit 근거와 상관관계 확인 {#39-유용한-cloudwatch-logs-insights-쿼리}

Audit 로깅을 이미 사용할 수 있다면 장애 구간의 완료된 요청을 verb, resource/subresource, API group, 응답 코드, 클라이언트별로 비교합니다. APF 메트릭도 같은 구간에 맞추세요. 분·일 경계를 넘는 지연을 계산할 때는 전체 timestamp를 유지하고 여러 audit stage를 서로 다른 요청으로 중복 집계하지 않습니다.

`customresourcedefinitions` 요청은 정의에 대한 요청이며 CR 인스턴스 트래픽은 해당 커스텀 API group/resource를 사용합니다. 정의 엔드포인트만 매칭하는 쿼리로 CR 트래픽을 파악할 수 없습니다. 민감정보를 제거한 집계를 검토하고 원시 요청 본문이나 비공개 신원을 공개하지 마세요. [출처: 컨트롤 플레인 모니터링 가이드][monitoring].

### 3.10 용량 증가 전 병목 해석 {#310-api-vs-etcd-bottleneck-identification}

| 관측 | 다음 조사 | 용량 판단 |
|---|---|---|
| 특정 우선순위 수준·instance만 대기·거부하고 다른 곳은 여유 있음 | FlowSchema 배정, 현재·nominal 한도, 대여·차용, 클라이언트 버스트, 트래픽 불균형 | 먼저 배분과 요청 패턴 진단 |
| 전반적인 seat 압박이 지속되고 큐 대기·거부·지연 목표 위반이 동반됨 | 유입 수요 검증, 불필요한 LIST·재시도 감소, 동일 조건 반복 테스트 | 잔여 용량 부족을 입증하면 더 많은 seat 티어를 후보로 검토 |
| API 지연과 저장·admission 호출 지연이 함께 증가 | 저장 메트릭, 작업·리소스 구성, webhook 지연, 컨트롤러 backlog | 상관관계는 조사 방향이며 티어 상향 효과를 입증하지 않음 |
| API 압박은 비슷한데 Pod가 unschedulable | 노드 readiness·리소스, affinity·taint, 볼륨·네트워크 제약 | 티어 변경만으로 배치 가능 여부를 해결했다고 볼 수 없음 |
| DB 사용 비율이 계획 예산 초과 | 증가·변경 패턴, 오브젝트 보존, in-use bytes 실측 | 표의 모든 PCP 티어는 동일한 DB 속성 |

[APF 동작][apf]과 [EKS 확장 가이드][scale]에 따른 진단 방법이며 자동 업그레이드 규칙이 아닙니다.

### 3.11 티어 결정 기록 {#311-pcp-티어별-업그레이드-판단-기준-요약}

버전별 출처, 여유 정책, 후보 집합, 제약 항목, 실측 합격 결과를 함께 기록하세요. **429는 조사 시작 조건이며 자동 업그레이드 조건이 아닙니다.** 수학적 조건 통과는 테스트 후보라는 의미입니다. 측정에 실패하거나 데이터가 불완전하면 검증된 사이징 결과로 표시하지 않습니다.

어느 티어도 조건을 만족하지 않으면 “이 가정에서 후보 없음”을 명시합니다. 스케줄링·DB 속성이 같은 8XL로 올리는 대신 워크로드 동작, 복구 시간 예산, 클러스터 분할을 재검토하세요. Standard가 실측 목표를 충족한다면 이 문서는 PCP를 요구하는 수치 규칙을 제시하지 않습니다.

## 관련 자료 {#related-resources}

### AWS 공식 문서 {#aws-official-documentation}

- [EKS Provisioned Control Plane][pcp] — 버전별 티어 표와 구성 용량·성능 구분. 2026-09-18 확인.
- [EKS CloudWatch 메트릭][cw] — 이름, 통계, DB 의미. 2026-09-18 확인.
- [Raw 컨트롤 플레인 메트릭][raw], [컨트롤 플레인 확장][scale], [모니터링 가이드][monitoring].
- [EKS SLA][sla], [EKS 요금][pricing] — 운영 결정 전 해당 조건 확인.

### AWS 공개 벤치마크 {#aws-blogs}

- [Amazon EKS introduces Provisioned Control Plane][launch] — 2025-11-27 게시. 특정 워크로드에서 보고된 결과.

### Upstream 참고 자료 {#kubernetes-upstream}

- [API Priority and Fairness][apf], [etcd v3.6 데이터 모델][etcd-model].
- [Kubernetes v1.34.0 APF 메트릭 소스][apf-metrics], [Kubernetes v1.34.0 scheduler 메트릭 소스][scheduler-metrics].
- [Kubernetes SLO 프레임워크, 리비전 14459aa5f98a5258f5dbd97b29897ea1231bc84e][slos].
- [ClusterLoader2 README, 리비전 104d820e9f1ac2e796390d95c5113bf673770ce1][cl2].

[pcp]: https://docs.aws.amazon.com/eks/latest/userguide/eks-provisioned-control-plane.html
[cw]: https://docs.aws.amazon.com/eks/latest/userguide/cloudwatch.html
[raw]: https://docs.aws.amazon.com/eks/latest/userguide/view-raw-metrics.html
[scale]: https://docs.aws.amazon.com/eks/latest/best-practices/scale-control-plane.html
[monitoring]: https://docs.aws.amazon.com/eks/latest/best-practices/control_plane_monitoring.html
[launch]: https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/
[sla]: https://aws.amazon.com/eks/sla/
[pricing]: https://aws.amazon.com/eks/pricing/
[apf]: https://kubernetes.io/docs/concepts/cluster-administration/flow-control/
[etcd-model]: https://etcd.io/docs/v3.6/learning/data_model/
[apf-metrics]: https://github.com/kubernetes/kubernetes/blob/v1.34.0/staging/src/k8s.io/apiserver/pkg/util/flowcontrol/metrics/metrics.go
[scheduler-metrics]: https://github.com/kubernetes/kubernetes/blob/v1.34.0/pkg/scheduler/metrics/metrics.go
[slos]: https://github.com/kubernetes/community/blob/14459aa5f98a5258f5dbd97b29897ea1231bc84e/sig-scalability/slos/slos.md
[cl2]: https://github.com/kubernetes/perf-tests/blob/104d820e9f1ac2e796390d95c5113bf673770ce1/clusterloader2/README.md
