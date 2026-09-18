---
title: CoreDNS 모니터링과 성능 최적화 완벽 가이드
description: Amazon EKS의 CoreDNS 성능을 체계적으로 모니터링하고 최적화하는 방법. Prometheus 메트릭, TTL 튜닝, 모니터링 아키텍처, 실제 문제 해결 사례 포함
created: "2025-05-20"
last_update:
  date: "2026-09-17"
  author: YoungJoon Jeong
reading_time: 16
tags:
  - eks
  - coredns
  - dns
  - monitoring
  - prometheus
  - performance
  - scope:tech
sidebar_label: CoreDNS 모니터링 & 최적화
category: performance-networking
---

import { GoldenSignals, CoreDnsMetricsTable, TtlConfigGuide, MonitoringArchitecture, TroubleshootingTable, PerformanceBenchmarks } from '@site/src/components/CoreDnsTables';

Amazon EKS와 최신 Kubernetes 클러스터에서 **CoreDNS**는 클러스터 내 모든 서비스 디스커버리와 외부 도메인 이름 해석을 담당하는 핵심 컴포넌트입니다. CoreDNS의 성능과 가용성은 애플리케이션 응답 시간과 안정성에 직접적인 영향을 미치기 때문에, **효과적인 모니터링 및 최적화 아키텍처**를 구축하는 것이 중요합니다. 이 아티클에서는 **CoreDNS 성능 모니터링 메트릭**, **TTL 설정 가이드**, **모니터링 아키텍처 모범 사례**, **AWS 운영 점검과 진단 예시**를 분석합니다. 각 섹션에서는 Prometheus 메트릭, Amazon EKS 환경에서의 적용 예시를 활용하여 CoreDNS 모니터링 전략을 알아봅니다.

## 1. CoreDNS 성능 모니터링: 주요 Prometheus 메트릭과 의미

CoreDNS는 Corefile의 `prometheus :9153` 설정으로 **Prometheus 형식의 메트릭**을 제공합니다. `9153`은 이 가이드의 수집 포트 예시이며, 실제 Pod의 리스닝 포트와 수집 설정을 확인해야 합니다. `kube-dns` Service가 이 포트를 노출한다고 가정하지 마세요. 핵심 메트릭들은 **DNS 요청의 처리량, 지연 시간, 응답 코드, 캐싱 효율**을 보여줍니다. 플러그인과 EKS 설정의 출처는 [참고 자료](#primary-sources)에 정리했습니다.

### CoreDNS 4 Golden Signals

<GoldenSignals />

### CoreDNS 핵심 Prometheus 메트릭

<CoreDnsMetricsTable />

메트릭 이름은 [forward 플러그인](https://coredns.io/plugins/forward/)과 [cache 플러그인](https://coredns.io/plugins/cache/)의 현재 레퍼런스를 기준으로 합니다. 기존 `coredns_forward_requests_total`·`coredns_forward_responses_total`은 proxy histogram의 `_count`로, `coredns_cache_misses_total`은 requests − hits로 대체합니다. 실행 중인 CoreDNS 버전에서 노출 여부를 확인하세요.

이 외에도 **요청/응답 크기**(`coredns_dns_request_size_bytes`, `...response_size_bytes`), **DO 비트 설정 여부**(`coredns_dns_do_requests_total`) 등의 메트릭이 제공되며, CoreDNS에 로드된 **플러그인별 추가 메트릭**도 존재할 수 있습니다. 예를 들어 **Forward 플러그인**을 통한 업스트림 질의 시간(`coredns_proxy_request_duration_seconds{proxy_name="forward"}`)이나 **kubernetes 플러그인**의 API 업데이트 지연(`coredns_kubernetes_dns_programming_duration_seconds`) 등이 있습니다.

### 주요 메트릭 의미 및 활용

예를 들어 `coredns_dns_requests_total`의 초당 증가율로 **DNS QPS**를 파악하고, 이를 CoreDNS Pod별로 나누어 부하가 **균등**한지 확인합니다. QPS가 지속적으로 증가하면 CoreDNS **스케일 아웃**이 필요한지 검토합니다. `coredns_dns_request_duration_seconds`의 99퍼센타일이 평소보다 높아지면 **업스트림 DNS 지연**이나 CoreDNS **CPU/메모리 포화** 여부를 점검합니다. 캐시 적중률이 낮으면 반복 질의 비중, TTL, eviction을 함께 확인합니다. `SERVFAIL`은 이름 해석 실패를 나타내며, `REFUSED`는 정책에 따른 거부나 `forward max_concurrent` 초과일 수 있습니다. `NXDOMAIN`은 존재하지 않는 이름이나 검색 도메인 확장 과정에서 예상할 수 있는 응답입니다. 증가만으로 장애나 잘못된 도메인 조회라고 단정하지 말고 평소 응답 코드 분포, 애플리케이션 실패, 필요한 범위의 쿼리 로그를 함께 확인하세요.

또한 **시스템 리소스 메트릭** (CPU/메모리)도 중요합니다. 요청량·제한량은 설치된 EKS 애드온 버전, 사용자 설정, Deployment에서 확인하세요. **70Mi/170Mi를 모든 EKS 배포의 메모리 기본값으로 가정하지 않습니다.** 예를 들어 실제 메모리 제한이 170Mi인 배포에서 150Mi 경보를 시험할 수 있지만, 이는 해당 배포만의 초기값입니다. 메모리 증가 추세, OOM 이력, 캐시 크기와 Kubernetes 객체 수를 보고 여유를 정하세요. CPU는 설정된 limit 대비 사용률과 실제 throttling을 함께 확인합니다.

:::warning VPC ENI DNS 패킷 제한
Amazon DNS 등 링크 로컬 서비스로 보내는 트래픽은 ENI당 1024 PPS 한도를 공유합니다. 모든 DNS 트래픽의 한도는 아니며, IMDS·Amazon Time Sync 트래픽도 이 예산을 사용합니다. `max_concurrent`를 높여도 이 한도는 늘어나지 않습니다. [AWS ENA 메트릭](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html)의 `linklocal_allowance_exceeded`를 확인하세요.
:::

## 2. CoreDNS TTL 설정 가이드 및 Amazon EKS 적용 예시

**TTL(Time-To-Live)**은 DNS 레코드의 유효 캐시 시간을 의미하며, 적절한 TTL 설정은 **DNS 트래픽 부하**와 **정보 신선도** 사이의 균형을 좌우합니다. CoreDNS에서는 두 가지 수준에서 TTL을 다룹니다:

아래 플러그인 기본값은 **upstream CoreDNS v1.11.3**의 [kubernetes 레퍼런스](https://github.com/coredns/coredns/blob/v1.11.3/plugin/kubernetes/README.md)와 [cache 레퍼런스](https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/README.md)를 기준으로 합니다. EKS 애드온이 이 값을 그대로 사용한다는 뜻은 아닙니다.

- **Kubernetes 응답 TTL:** `kubernetes` 플러그인이 생성하는 레코드의 TTL입니다. SOA 레코드만의 설정이 아니며, `ttl` 생략 시 **5초**, 허용 범위는 **0–3600초**입니다. TTL 0으로 캐싱을 방지하려면 경로상의 캐시가 0을 존중하는지도 확인해야 합니다.
- **캐시 TTL:** `cache` 플러그인의 기본 최대 TTL은 **success 3600초, denial 1800초**, 기본 최소 TTL(`MINTTL`)은 **각각 5초**입니다. denial은 NXDOMAIN뿐 아니라 레코드 유형에 대한 데이터가 없는 NODATA도 포함합니다. `cache 30`은 두 캐시의 상한을 30초로 설정하고, `success CAPACITY TTL MINTTL`·`denial CAPACITY TTL MINTTL`로 각각 재정의할 수 있습니다. SERVFAIL 캐싱은 별도 `servfail` 옵션으로 제어하며 이 버전의 기본값은 5초입니다.

일반적인 success/denial 항목의 유효 캐시 시간은 `min(max(응답에서 산출한 TTL, MINTTL), 최대 TTL)`입니다([v1.11.3 구현](https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/cache.go)). 따라서 **5초 레코드 + `cache 30` + 기본 최소 TTL 5초 = 5초**이며, 30초로 늘어나지 않습니다. 반면 `success 9984 30 10`처럼 최소 TTL을 명시적으로 10초로 올리면 해당 성공 응답을 **10초** 캐싱할 수 있습니다. 용량 부족 시 더 일찍 eviction될 수 있고, `serve_stale`을 별도로 켜면 만료 응답 제공 정책도 달라집니다.

<TtlConfigGuide />

### Amazon EKS 기본 CoreDNS 설정

설치된 **애드온 버전, Corefile, Deployment**를 함께 확인해야 EKS에서의 실제 기본 구성을 알 수 있습니다. `kubernetes`에 `ttl`이 없고 `cache 30`만 있는 구성이라면 위 버전의 내부 레코드는 5초 동안 유효하게 캐시됩니다. `ttl 30`까지 명시된 구성에서는 내부 레코드의 TTL 자체가 30초입니다. 긴 TTL의 외부 응답은 cache 상한으로 제한되며, 짧은 TTL은 최소 TTL과 함께 평가합니다.

`kubernetes` 플러그인은 Kubernetes API의 객체 변경을 **watch하여 로컬 상태를 유지**합니다. DNS cache miss마다 API를 다시 조회하는 구조가 아니므로, cache TTL을 늘려 API 조회를 막는다는 설명은 맞지 않습니다.

### TTL 설정 가이드

일반적으로 **짧은 TTL**은 변경을 빨리 반영하지만 반복 질의가 늘 수 있고, **긴 TTL**은 반복 질의를 줄이지만 오래된 주소 사용 시간을 늘릴 수 있습니다. **30초는 이 가이드의 시험값이며 보편적인 최적값이 아닙니다.** 서비스·엔드포인트 변경 빈도, 장애 조치 목표, 실제 캐시 적중률을 보고 결정하세요. denial TTL은 새 이름이나 레코드가 생겼을 때 발견을 늦출 수 있으므로 별도로 평가합니다.

`prefetch AMOUNT [[DURATION] [PERCENTAGE%]]`에서 `prefetch 5 60s 10%`는 질의 간격이 60초 이상 벌어지지 않는 인기 항목을 5회 기준으로 판단하고, 캐시 hit 시 남은 TTL이 10% 임계치에 도달하면 갱신을 시도합니다. **60초는 만료 전 갱신 시간이 아닙니다.** v1.11.3에서 DURATION 생략값은 1분, PERCENTAGE 생략값은 10%이며 허용 범위는 10–90%입니다. 레퍼런스의 1초 전 갱신 경계도 후속 질의가 있을 때 평가되므로, 트래픽이 없어도 실행되는 예약 작업으로 해석하면 안 됩니다.

### Amazon EKS 적용 예시

내부 응답을 최대 30초 사용하는 것이 허용되는 워크로드라면 `kubernetes` 블록의 `ttl 30`과 cache 설정을 함께 시험할 수 있습니다. 클라이언트·NodeLocal DNSCache·애플리케이션 런타임의 캐싱 정책도 결과에 영향을 줍니다. EKS 관리형 애드온은 해당 버전의 지원 스키마와 `configurationValues.corefile`을 확인하여 사용자 구성을 관리하세요. ConfigMap을 직접 수정한 내용은 애드온 업데이트에서 덮어쓸 수 있습니다([EKS 관리 가이드](https://docs.aws.amazon.com/eks/latest/userguide/managing-coredns.html)).

:::warning Aurora DNS 로드밸런싱 이슈
Aurora 등의 엔드포인트를 사용하는 경우 **실제 DNS 응답 TTL과 연결 풀 동작**을 확인하세요. 응답 TTL이 1초인 엔드포인트를 관측했고 cache 상한이 30초라면, v1.11.3의 기본 최소 TTL 5초가 이를 5초로 늘릴 수 있습니다. 모든 Aurora 엔드포인트의 TTL이 1초라는 가정은 하지 않습니다.
:::

낮은 TTL을 존중해야 하는 **확인된 DNS 영역의 서버 블록**에서는 `success 9984 30 0`·`denial 2048 10 0`처럼 최소 TTL을 0으로 명시하는 방안을 시험할 수 있습니다. 첫 번째 숫자는 TTL이 아니라 **캐시 용량**입니다. `success 1`·`denial 1`은 1초 TTL 설정이 아닙니다. NodeLocal DNSCache를 포함한 경로 전체를 확인하고, 예외 범위를 `amazonaws.com` 전체로 확대하지 마세요.

## 3. CoreDNS 모니터링 아키텍처 모범 사례

CoreDNS 모니터링 아키텍처는 **메트릭 수집(Prometheus 등)**과 **로그 수집(예: Fluent Bit 등)**, 그리고 시각화 및 알림 체계를 모두 포함하는 **통합적인 관찰성 파이프라인**으로 구축하는 것이 이상적입니다. Amazon EKS 환경에서는 **Managed 서비스**와 **오픈소스 도구**를 조합하여 안정적이고 확장 가능한 모니터링 시스템을 구현할 수 있습니다.

<MonitoringArchitecture />

### 메트릭 수집 및 저장

Amazon EKS에서는 CoreDNS의 Prometheus 메트릭을 수집하기 위해 **두 가지 접근**이 일반적입니다:

1. **Amazon Managed Service for Prometheus (AMP)**: AWS에서 제공하는 **완전 관리형 Prometheus 호환** 서비스로, 클러스터 내 메트릭을 원격 수집(remote write)하여 **확장성 높은 시계열 DB**에 보관합니다. EKS 클러스터에는 **ADOT(AWS Distro for OpenTelemetry) Collector** 또는 **Prometheus 서버**를 설치하여 CoreDNS 메트릭을 스크랩한 후 AMP로 전송합니다. AMP에 저장된 메트릭은 **PromQL**로 쿼리 가능하며, 장기 보관 및 대규모 클러스터 지원에 적합합니다.

2. **CloudWatch Container Insights (및 CloudWatch 에이전트):** Prometheus 수집 기능을 구성한 CloudWatch 에이전트로 CoreDNS Pod의 메트릭 엔드포인트를 스크랩합니다. 애플리케이션 메트릭 수집 대상과 포트는 별도 설정을 확인해야 합니다.

:::tip ServiceMonitor 설정
먼저 Corefile의 `prometheus` 리스너와 Service 포트·레이블을 확인하세요. 메트릭 포트를 노출하는 Service가 있으면 해당 이름의 포트를 ServiceMonitor로 선택하고, 없으면 별도 metrics Service 또는 Pod 대상 수집을 구성합니다. `k8s-app=kube-dns` 레이블만으로 9153 포트가 노출된다고 보장할 수 없습니다.
:::

### 로그 수집

CoreDNS의 **쿼리 로그와 에러 로그**는 성능 문제를 진단하거나 보안 모니터링(예: 특정 도메인에 대한 폭주 조회) 측면에서 유용한 정보원입니다. 필요에 따라 `log` 또는 `errors` 플러그인을 활성화할 수 있으며, 현재 Corefile에서 활성화 여부를 확인합니다. **실무에서는** CoreDNS Pod의 표준 출력(stdout/stderr)에 기록되는 로그를 수집하기 위해 **Fluent Bit**이나 **Fluentd**를 DaemonSet으로 운용하여 CloudWatch Logs로 내보내는 패턴이 흔합니다.

:::warning 로그 수집 주의사항
과도한 로그 수집으로 인한 부하를 피하기 위해 필요 수준으로만 로그를 남기는 것이 중요합니다. EKS 모범 사례에서는 Fluent Bit 등 에이전트가 Kubernetes API를 반복 조회하지 않도록 **메타데이터 캐싱**을 설정하고 (`Kube_Meta_Cache_TTL=60` 등) 불필요한 필드 수집을 줄이는 것을 권장합니다.
:::

### 시각화 및 대시보드

수집된 CoreDNS 메트릭은 **Grafana**를 통해 모니터링 대시보드로 시각화하는 것이 일반적입니다. Amazon Managed Grafana(AMG)는 AMP나 CloudWatch와 네이티브 통합되어 데이터 소스로 활용할 수 있고, **IAM 연동 SSO**로 접근을 제어할 수 있습니다. Grafana에서 CoreDNS 대시보드를 구축할 때, **요청률(QPS), 응답 지연(histogram), 오류율(rcode 분포), 캐시 히트율** 등의 패널을 구성합니다.

### 알람/Alerting

**Prometheus 알림 규칙과 Alertmanager**, 또는 CloudWatch Alarms로 **DNS 이상 징후**를 탐지할 수 있습니다. 대표적인 점검 항목은 다음과 같습니다:

- **CoreDNSDown**: 선택한 수집 범위의 `up{job="coredns"}`이 모두 0이거나 시계열이 없을 때 수집 장애를 탐지합니다. DNS 가용성은 별도의 실제 질의 probe로 확인합니다.
- **HighDNSLatency**: 부록에서는 트래픽이 있을 때 p99 **50ms 초과**를 5분간 관측하는 시험값을 사용합니다. 워크로드 기준선과 SLO에 맞게 조정합니다.
- **DNSErrorsSpike**: `SERVFAIL` 응답 비율을 추적합니다. `REFUSED`는 의도한 정책과 동시 질의 제한을 확인하고, `NXDOMAIN`은 평소 수준과 애플리케이션 영향을 기준으로 별도 조사합니다.
- **ENIThrottling**: `linklocal_allowance_exceeded` 증가로 Amazon DNS를 포함한 링크 로컬 서비스의 패킷 드롭을 확인합니다.
- **HighCoreDNSCPU/Memory**: CoreDNS Pod의 CPU/메모리 사용률 모니터링 경보.

## 4. Amazon EKS 모범 사례 및 고객 사례 (DNS 병목 대응 등)

아래는 공개 CoreDNS·AWS 문서를 바탕으로 한 **운영 점검과 진단 시나리오**입니다. 수치로 검증된 고객 사례를 제시하는 표는 아니며, 설치된 구성과 워크로드에서 원인을 확인해야 합니다.

<TroubleshootingTable />

### CoreDNS Horizontal Scaling (복제수 조정)

복제수는 현재 Deployment와 애드온 설정에서 확인하세요. 노드 수·CPU 코어·실제 질의 부하를 바탕으로 EKS 관리형 애드온의 자동 확장 지원 또는 Cluster Proportional Autoscaler를 검토할 수 있습니다. 두 제어기가 같은 복제수를 동시에 관리하지 않도록 합니다.

### NodeLocal DNSCache 도입

**대규모 클러스터**나 **DNS 트래픽이 매우 빈번한 워크로드**에서는, CoreDNS를 중앙에서 처리하는 방식이 **네트워크 지연 및 ENI 한계**로 병목이 될 수 있습니다. Kubernetes의 공식 애드온인 *NodeLocal DNSCache*는 **지원되는 노드에 DNS 캐시 에이전트(CoreDNS 기반)를 DaemonSet으로 배치**하여, 각 Node에서 **로컬 DNS**를 제공하는 방식입니다.

### DNS 패킷 한계 및 트래픽 분산

Amazon DNS로 향하는 링크 로컬 트래픽은 **1024 PPS/ENI** 한도를 공유합니다. CoreDNS Pod가 같은 노드에 모이면 외부 질의가 같은 ENI에 집중될 수 있습니다. Pod 분산과 캐싱으로 부하를 줄이되, NodeLocal DNSCache도 cache miss에 대한 업스트림 질의와 ENI 한도를 없애지는 않습니다.

### Graceful Termination 설정 (Lameduck & Ready 플러그인)

`health { lameduck DURATION }`은 종료를 지연시키며, 그 동안 `/health`는 200을 반환하지만 `/ready`는 준비 완료를 반환하지 않습니다([health 레퍼런스](https://github.com/coredns/coredns/blob/v1.11.3/plugin/health/README.md)). upstream v1.11.3은 `lameduck` 생략 시 지연을 추가하지 않습니다. **30초는 보편적인 AWS 권장값이 아닙니다.** 부록의 5초 역시 시험값입니다. 실제 endpoint 전파 시간과 종료 지연을 측정하고 `terminationGracePeriodSeconds`에 preStop, lameduck, 종료 처리 시간의 여유를 확보하세요.

[EKS 문서](https://docs.aws.amazon.com/eks/latest/userguide/managing-coredns.html)는 **v1.9.3-eksbuild.3 이상 및 v1.10.1-eksbuild.6 이상**의 readiness probe가 `/ready`를 사용한다고 명시합니다. 해당 구성에서는 사용자 Corefile에도 `ready` 플러그인이 있어야 합니다. 실제 애드온 버전과 probe 설정을 함께 확인하세요.

### 더 높은 QPS가 필요할 때

1. **`max_concurrent` 평가**: upstream v1.11.3에서는 생략 시 이 플러그인의 동시 질의 제한이 없습니다. 명시할 값은 업스트림 QPS × 응답 시간과 여유분을 바탕으로 정합니다. 부록의 `2000`은 시험값이며, 질의당 약 2 KB의 추가 메모리와 제한 초과 시 `REFUSED` 응답을 고려합니다([forward 레퍼런스](https://github.com/coredns/coredns/blob/v1.11.3/plugin/forward/README.md)).

2. **CoreDNS 수평 확장**: Replica 수를 늘리거나 Cluster Proportional Autoscaler, HPA, 혹은 **NodeLocal DNSCache**로 질의를 노드 단으로 분산합니다.

3. **ENI 한계 모니터링**: ENA의 `linklocal_allowance_exceeded` 증가량을 수집합니다. CloudWatch로 내보내려면 에이전트 설정이 필요하며, 실제 발행되는 메트릭 이름과 차원을 확인하세요.

## 핵심 요약

<PerformanceBenchmarks />

- **모니터링 메트릭**: requests, latency, cache requests/hits, rcode 분포, CPU/메모리. Cache misses는 requests − hits로 계산합니다.
- **TTL 시험값**: 내부 응답 30s, success 최대 30s, denial 최대 10s, `prefetch 5 60s 10%`. 변경 반영 목표와 측정 결과에 따라 선택하며, 5초 레코드를 `cache 30`만으로 30초 캐싱하지 않습니다.
- **모니터링**: 수집 설정에 맞춘 Grafana 대시보드 + Prometheus 알림 규칙, 필요 시 NodeLocal DNSCache로 스케일-아웃

## 부록: 구성 예시

### Corefile 권장 구성

아래는 **워크로드별 검증이 필요한 Corefile 예시**입니다. EKS 기본 Corefile 전체를 대체하는 처방이 아닙니다. 내부 응답의 30초 신선도 예산, cache 용량, 업스트림 동시 질의 부하, 종료 유예 시간을 확인한 뒤 적용합니다. 용량은 256 단위로 내림되므로 예시에는 9984와 2048을 사용합니다. 쿼리 `log`는 진단에 필요한 범위와 시간에만 활성화하세요.

```text
.:53 {
  errors
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30                # Trial response TTL; requires a 30s freshness budget
  }

  cache 30 {              # Ceiling, not a forced lifetime for every response
    success 9984 30 5     # Capacity, maximum TTL, minimum TTL (seconds)
    denial 2048 10 5      # Separate negative-cache capacity and TTL bounds
    prefetch 5 60s 10%    # Popularity: gaps <60s; refresh at remaining-TTL threshold
  }

  forward . /etc/resolv.conf {
    max_concurrent 2000   # Trial cap; size from upstream QPS and latency
  }

  prometheus :9153
  health {
    lameduck 5s           # Trial delay; allow shutdown headroom in the Pod grace period
  }
  ready
  loop
  reload
  loadbalance
}
```

### Alertmanager 룰 예시

아래 YAML은 **Prometheus가 평가하고 Alertmanager로 전달하는 규칙 파일**입니다. 메트릭 표와 동일하게 **단일 클러스터의 `job="coredns"`** 수집 범위를 가정합니다. 실제 job 이름으로 바꾸고, 여러 클러스터를 조회할 때는 **모든 selector**에 동일한 cluster 조건을 추가하세요. 먼저 `/metrics`와 수집 레이블을 확인합니다. 비율·지연·지속 시간은 예시 임계치입니다. NXDOMAIN은 critical 오류에 포함하지 않으며, REFUSED는 정책·동시 질의 제한과 함께 별도로 평가합니다. 무응답·Pod 장애는 응답 코드 비율만으로 탐지할 수 없으므로 scrape 상태와 실제 DNS 질의 probe를 함께 확인합니다.

```yaml
groups:
  - name: coredns-example
    rules:
      - alert: CoreDNSHighErrorRate
        expr: >
          (sum(rate(coredns_dns_responses_total{job="coredns",rcode="SERVFAIL"}[5m])) /
           sum(rate(coredns_dns_responses_total{job="coredns"}[5m]))) > 0.01
          and on() sum(rate(coredns_dns_responses_total{job="coredns"}[5m])) > 0
        for: 10m
        labels:
          severity: critical
        annotations:
          description: "CoreDNS SERVFAIL response ratio > 1% for 10 min"

      - alert: CoreDNSP99Latency
        expr: >
          histogram_quantile(0.99,
            sum by (le) (rate(coredns_dns_request_duration_seconds_bucket{job="coredns"}[5m]))) > 0.05
          and on() sum(rate(coredns_dns_requests_total{job="coredns"}[5m])) > 0
        for: 5m
        labels:
          severity: warning

      - alert: CoreDNSScrapeUnavailable
        expr: sum(up{job="coredns"}) == 0 or absent(up{job="coredns"})
        for: 5m
        labels:
          severity: warning
        annotations:
          description: "No healthy CoreDNS scrape target; check collection and DNS probes"
```

### 대규모 클러스터 (>100 노드 또는 QPS > 5k)

1. **NodeLocal DNSCache** (DaemonSet 형태)로 노드 로컬에서 캐시하여 RTT 단축
   - nodelocaldns 메트릭도 Prometheus에 수집해 CoreDNS와 비교
2. **CloudWatch Container Insights** (EKS 전용)
   - CloudWatch 에이전트의 Prometheus 수집 설정과 수집 비용을 확인하여 CoreDNS 메트릭을 전송합니다.

## 참고 자료 {#primary-sources}

- [CoreDNS v1.11.3 cache reference](https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/README.md), [TTL implementation](https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/cache.go), [prefetch implementation](https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/handler.go)
- [CoreDNS v1.11.3 kubernetes reference](https://github.com/coredns/coredns/blob/v1.11.3/plugin/kubernetes/README.md)
- [CoreDNS v1.11.3 health reference](https://github.com/coredns/coredns/blob/v1.11.3/plugin/health/README.md), [health implementation](https://github.com/coredns/coredns/blob/v1.11.3/plugin/health/health.go), [forward reference](https://github.com/coredns/coredns/blob/v1.11.3/plugin/forward/README.md), [forward implementation](https://github.com/coredns/coredns/blob/v1.11.3/plugin/forward/forward.go)
- [CoreDNS Prometheus plugin](https://coredns.io/plugins/metrics/)
- [Amazon EKS: Manage CoreDNS](https://docs.aws.amazon.com/eks/latest/userguide/managing-coredns.html)
- [Amazon EC2: ENA network performance metrics](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html), [link-local PPS limit](https://docs.aws.amazon.com/vpc/latest/userguide/AmazonDNS-concepts.html)
- [Kubernetes NodeLocal DNSCache](https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/)
- [Prometheus alerting rules](https://github.com/prometheus/prometheus/blob/v3.5.0/docs/configuration/alerting_rules.md), [query functions](https://github.com/prometheus/prometheus/blob/v3.5.0/docs/querying/functions.md)
