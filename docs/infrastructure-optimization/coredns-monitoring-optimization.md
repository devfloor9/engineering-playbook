---
title: "CoreDNS 모니터링과 성능 최적화 완벽 가이드"
sidebar_label: "2. CoreDNS 모니터링 & 최적화"
description: "Amazon EKS의 CoreDNS 성능을 체계적으로 모니터링하고 최적화하는 방법. Prometheus 메트릭, TTL 튜닝, 모니터링 아키텍처, 실제 문제 해결 사례 포함"
tags: [eks, coredns, dns, monitoring, prometheus, performance]
category: "performance-networking"
last_update:
  date: 2026-02-18
  author: devfloor9
sidebar_position: 2
---

import { GoldenSignals, CoreDnsMetricsTable, TtlConfigGuide, MonitoringArchitecture, TroubleshootingTable, PerformanceBenchmarks } from '@site/src/components/CoreDnsTables';

# CoreDNS 모니터링 및 최적화 가이드

> 📅 **작성일**: 2025-05-20 | **수정일**: 2026-02-18 | ⏱️ **읽는 시간**: 약 13분


Amazon EKS와 최신 Kubernetes 클러스터에서 **CoreDNS**는 클러스터 내 모든 서비스 디스커버리와 외부 도메인 이름 해석을 담당하는 핵심 컴포넌트입니다. CoreDNS의 성능과 가용성은 애플리케이션 응답 시간과 안정성에 직접적인 영향을 미치기 때문에, **효과적인 모니터링 및 최적화 아키텍처**를 구축하는 것이 중요합니다. 이 아티클에서는 **CoreDNS 성능 모니터링 메트릭**, **TTL 설정 가이드**, **모니터링 아키텍처 모범 사례**, **AWS 권장 사항 및 실무 사례**를 분석합니다. 각 섹션에서는 Prometheus 메트릭, Amazon EKS 환경에서의 적용 예시를 활용하여 CoreDNS 모니터링 전략을 알아봅니다.

## 1. CoreDNS 성능 모니터링: 주요 Prometheus 메트릭과 의미

CoreDNS는 `metrics` 플러그인을 통해 **Prometheus 형식의 메트릭**을 제공하며, 기본적으로 EKS에서는 `kube-dns` 서비스의 `9153` 포트로 노출됩니다. 핵심 메트릭들은 **DNS 요청의 처리량, 지연 시간, 오류, 캐싱 효율** 등을 보여주며, 이를 모니터링함으로써 DNS 성능 병목이나 장애 징후를 빠르게 포착할 수 있습니다.

### CoreDNS 4 Golden Signals

<GoldenSignals />

### CoreDNS 핵심 Prometheus 메트릭

<CoreDnsMetricsTable />

이 외에도 **요청/응답 크기**(`coredns_dns_request_size_bytes`, `...response_size_bytes`), **DO 비트 설정 여부**(`coredns_dns_do_requests_total`) 등의 메트릭이 제공되며, CoreDNS에 로드된 **플러그인별 추가 메트릭**도 존재할 수 있습니다. 예를 들어 **Forward 플러그인**을 통한 업스트림 질의 시간(`coredns_forward_request_duration_seconds`)이나 **kubernetes 플러그인**의 API 업데이트 지연(`coredns_kubernetes_dns_programming_duration_seconds`) 등이 있습니다.

### 주요 메트릭 의미 및 활용

예를 들어 `coredns_dns_requests_total`의 초당 증가율로 **DNS QPS**를 파악하고, 이를 CoreDNS Pod별로 나누어 부하가 **균등**한지 확인합니다. QPS가 지속적으로 증가하면 CoreDNS **스케일 아웃**이 필요한지 검토합니다. `coredns_dns_request_duration_seconds`의 99퍼센타일이 평소보다 높아지면, CoreDNS가 **응답 지연**을 겪고 있다는 의미이므로 **업스트림 DNS 지연**이나 CoreDNS **CPU/메모리 포화** 여부를 점검합니다. 이 때 CoreDNS 캐시(`coredns_cache_hits_total`) hit 비율이 낮다면, TTL이 너무 짧아 캐시효과가 떨어지는지 확인하고 조정합니다. `coredns_dns_responses_total`에서 `SERVFAIL` 또는 `REFUSED` 비율이 증가하면 CoreDNS **외부 통신 문제**나 **접근 권한 문제**가 없는지 로그를 점검해야 합니다. 한편 `NXDOMAIN` 증가가 특정 도메인에 대해 급증한다면, 애플리케이션이 잘못된 도메인을 조회하고 있을 수 있으므로 해당 부분을 수정해야 합니다.

또한 **시스템 리소스 메트릭** (CPU/메모리)도 중요합니다. CoreDNS Pod의 CPU/메모리 사용률을 모니터링하여, 각 Pod가 **리소스 한계에 근접**하는 경우 알림을 설정합니다. 예를 들어 EKS의 기본 CoreDNS **메모리 요청/제한은 70Mi/170Mi**로 설정되어 있으므로, 메모리 사용량이 150Mi를 넘어서는지 추적하여 임계치 도달 시 경보를 울리고 메모리 한계를 늘리거나 Pod을 추가하는 등의 조치를 취할 수 있습니다. CPU도 제한에 도달하면 kubelet이 CoreDNS 프로세스를 **스로틀링**하여 DNS 지연을 초래할 수 있으므로, CPU 사용률이 제한치에 근접하면 확장이나 자원 할당 증설을 고려해야 합니다.

:::warning VPC ENI DNS 패킷 제한
각 노드 ENI는 초당 1024개의 DNS 패킷만 허용합니다. CoreDNS의 `max_concurrent` 한계를 풀어도, ENI PPS 한계(1024 PPS)의 제한으로 인하여 원하는 성능에 도달하지 못할 수도 있습니다.
:::

## 2. CoreDNS TTL 설정 가이드 및 Amazon EKS 적용 예시

**TTL(Time-To-Live)**은 DNS 레코드의 유효 캐시 시간을 의미하며, 적절한 TTL 설정은 **DNS 트래픽 부하**와 **정보 신선도** 사이의 균형을 좌우합니다. CoreDNS에서는 두 가지 수준에서 TTL을 다룹니다:

- **권한 영역 레코드(SOA, Start of Authority) TTL:** Kubernetes 클러스터 내부 도메인(`cluster.local` 등)에 대한 **kubernetes 플러그인** 응답 TTL로, 기본값은 **5초**입니다. CoreDNS `Corefile`에서 `kubernetes` 섹션에 `ttl` 옵션을 지정하여 변경할 수 있으며, 최소 0초(캐싱 안 함)에서 최대 3600초까지 설정 가능합니다.
- **캐시 TTL:** **cache 플러그인**에서 캐시된 항목을 보관하는 최대 시간으로, 기본값은 **최대 3600초 (성공 응답)**이며 CoreDNS 설정에서 `cache [TTL]` 형태로 조정할 수 있습니다. 지정된 TTL은 **상한치**로 동작하며, 실제 DNS 레코드의 TTL이 그보다 짧으면 그 짧은 값에 따라 캐시에서 제거됩니다. (`cache` 플러그인의 기본 최소 TTL은 5초이며, `MINTTL`로 조정 가능).

<TtlConfigGuide />

### Amazon EKS 기본 CoreDNS 설정

EKS에 배포되는 기본 CoreDNS Corefile을 살펴보면, `kubernetes` 플러그인에 별도의 TTL이 지정되지 않아 **기본 5초**가 사용되고 있고, 대신 `cache 30` 설정을 통해 **모든 DNS 응답을 최대 30초까지 캐시**하도록 구성되어 있습니다. 즉 **내부 서비스 레코드**의 TTL은 응답 패킷상 5초이지만, CoreDNS 자체는 cache 플러그인으로 최대 30초간 응답을 캐싱하여 동일한 질의에 대해 빈번히 Kubernetes API를 조회하지 않도록 최적화합니다. 또한 외부 도메인 조회 시에도 최대 30초간 결과를 캐싱하여, 예를 들어 TTL이 매우 큰 외부 레코드라도 30초 이후에는 갱신하도록 함으로써 **지나치게 오래된 DNS 정보**를 들고 있지 않도록 합니다.

### TTL 설정 가이드

일반적으로 **짧은 TTL(예: 5초 이하)**은 DNS 레코드 변경사항(예: 새로운 서비스 IP나 Pod IP 변화)이 신속히 반영되는 장점이 있으나, 클라이언트나 DNS 캐시에 의한 **반복 조회가 많아** CoreDNS 부하가 증가할 수 있습니다. 반대로 **긴 TTL(예: 수분 이상)**은 DNS 질의 빈도를 줄여 성능을 높이지만, 변경 사항 전파가 지연되어 **구형 정보**로 인한 일시적 연결 실패 가능성이 커집니다. **권장되는 접근법**은 클러스터 크기와 워크로드 패턴에 따라 TTL을 **적당히 (수십 초 단위)** 늘려 **캐시 적중률을 높이면서** 심각한 정보 지연은 피하는 것입니다. 많은 Kubernetes 환경에서 **TTL 30초** 전후가 하나의 기준으로 사용됩니다.

### Amazon EKS 적용 예시

EKS에서 TTL을 조정하려면 **CoreDNS ConfigMap**을 수정해야 합니다. 예를 들어 내부 도메인 캐시 시간을 늘리고자 한다면, Corefile의 `kubernetes cluster.local ...` 블록에 `ttl 30`을 추가할 수 있습니다. 이렇게 하면 **클러스터 내부 DNS 응답의 TTL 필드**가 30초로 증가하여, 클라이언트 측(예: NodeLocal DNSCache나 애플리케이션 런타임)이 이를 참고해 캐싱할 경우 30초간 재조회하지 않게 됩니다. 다만 Kubernetes 환경에서는 일반적인 리눅스 glibc resolver가 자체 캐시를 하지 않고 매번 CoreDNS에 조회하기 때문에, **NodeLocal DNSCache**와 같은 보조 캐시가 없으면 TTL을 늘려도 클라이언트 측 이점은 제한적입니다. 주로 CoreDNS 자체의 부하 경감을 위하여 TTL을 조정하게 됩니다.

:::warning Aurora DNS 로드밸런싱 이슈
**AWS Aurora**와 같이 **DNS 로드밸런싱을 위해 매우 낮은 TTL(1초)**을 사용하는 서비스가 있습니다. 이 경우 CoreDNS가 기본 최소 TTL 5초로 인해 원래 1초 TTL을 5초로 **과도 캐싱**하여 Aurora 리더 엔드포인트 트래픽 분산이 왜곡되는 문제가 보고되었습니다. 이러한 상황에서는 **특정 도메인에 한해 TTL을 낮추는 설정**을 도입해야 합니다.
:::

실제 사례에서는 NodeLocal DNSCache CoreDNS 설정에 `amazonaws.com` 영역에 대해 `cache 1` 및 `success/denial 1` TTL 세부 설정을 적용함으로써, Aurora 엔드포인트의 원래 TTL 1초를 준수하도록 구성하여 문제를 해결했습니다. 따라서 **외부 서비스의 TTL 정책**도 고려하여 CoreDNS의 TTL과 캐시 전략을 튜닝해야 합니다.

## 3. CoreDNS 모니터링 아키텍처 모범 사례

CoreDNS 모니터링 아키텍처는 **메트릭 수집(Prometheus 등)**과 **로그 수집(예: Fluent Bit 등)**, 그리고 시각화 및 알림 체계를 모두 포함하는 **통합적인 관찰성 파이프라인**으로 구축하는 것이 이상적입니다. Amazon EKS 환경에서는 **Managed 서비스**와 **오픈소스 도구**를 조합하여 안정적이고 확장 가능한 모니터링 시스템을 구현할 수 있습니다.

<MonitoringArchitecture />

### 메트릭 수집 및 저장

Amazon EKS에서는 CoreDNS의 Prometheus 메트릭을 수집하기 위해 **두 가지 접근**이 일반적입니다:

1. **Amazon Managed Service for Prometheus (AMP)**: AWS에서 제공하는 **완전 관리형 Prometheus 호환** 서비스로, 클러스터 내 메트릭을 원격 수집(remote write)하여 **확장성 높은 시계열 DB**에 보관합니다. EKS 클러스터에는 **ADOT(AWS Distro for OpenTelemetry) Collector** 또는 **Prometheus 서버**를 설치하여 CoreDNS 메트릭을 스크랩한 후 AMP로 전송합니다. AMP에 저장된 메트릭은 **PromQL**로 쿼리 가능하며, 장기 보관 및 대규모 클러스터 지원에 적합합니다.

2. **CloudWatch Container Insights (및 CloudWatch 에이전트):** AWS의 CloudWatch를 활용하여 **Prometheus 메트릭을 CloudWatch로 수집**하는 방법입니다. CloudWatch 에이전트를 DaemonSet으로 배포하고, `kube-system/kube-dns` 서비스의 9153 포트로부터 CoreDNS 메트릭을 스크랩하도록 설정합니다.

:::tip ServiceMonitor 설정
Amazon EKS의 kube-dns 서비스는 metrics 포트를 제공하므로, Prometheus Operator를 사용한다면 ServiceMonitor를 생성하여 kube-system 네임스페이스의 k8s-app=kube-dns 레이블을 가진 서비스를 대상으로 9153포트를 스크랩할 수 있습니다.
:::

### 로그 수집

CoreDNS의 **쿼리 로그와 에러 로그**는 성능 문제를 진단하거나 보안 모니터링(예: 특정 도메인에 대한 폭주 조회) 측면에서 유용한 정보원입니다. CoreDNS의 기본 Corefile에는 `log` 플러그인이 없지만, 필요에 따라 `log` 또는 `errors` 플러그인을 활성화할 수 있습니다. **실무에서는** CoreDNS Pod의 표준 출력(stdout/stderr)에 기록되는 로그를 수집하기 위해 **Fluent Bit**이나 **Fluentd**를 DaemonSet으로 운용하여 CloudWatch Logs로 내보내는 패턴이 흔합니다.

:::warning 로그 수집 주의사항
과도한 로그 수집으로 인한 부하를 피하기 위해 필요 수준으로만 로그를 남기는 것이 중요합니다. EKS 모범 사례에서는 Fluent Bit 등 에이전트가 Kubernetes API를 반복 조회하지 않도록 **메타데이터 캐싱**을 설정하고 (`Kube_Meta_Cache_TTL=60` 등) 불필요한 필드 수집을 줄이는 것을 권장합니다.
:::

### 시각화 및 대시보드

수집된 CoreDNS 메트릭은 **Grafana**를 통해 모니터링 대시보드로 시각화하는 것이 일반적입니다. Amazon Managed Grafana(AMG)는 AMP나 CloudWatch와 네이티브 통합되어 데이터 소스로 활용할 수 있고, **IAM 연동 SSO**로 접근을 제어할 수 있습니다. Grafana에서 CoreDNS 대시보드를 구축할 때, **요청률(QPS), 응답 지연(histogram), 오류율(rcode 분포), 캐시 히트율** 등의 패널을 구성합니다.

### 알람/Alerting

**Prometheus Alertmanager** 또는 CloudWatch Alarms를 활용하여 **DNS 이상 징후에 대한 경보**를 설정해야 합니다. 대표적인 CoreDNS 관련 Alertmanager **규칙 예시**는 다음과 같습니다:

- **CoreDNSDown**: 일정 시간 동안 (`for: 15m` 등) CoreDNS 메트릭(`up{job="kube-dns"}` 등)가 보고되지 않을 때 경보.
- **HighDNSLatency**: `coredns_dns_request_duration_seconds`의 **p99 지연 시간**이 예를 들어 **100ms**를 초과하고 평소보다 높을 때 경보.
- **DNSErrorsSpike**: `coredns_dns_responses_total`에서 `rcode` 라벨이 `SERVFAIL` 또는 `NXDOMAIN`인 값의 비율이 일정 임계치 이상일 때 경보.
- **ENIThrottling**: AWS 환경 특화 메트릭으로, **EC2 네트워크 인터페이스(ENI)의 DNS 패킷 제한 초과**를 모니터링하는 경보입니다.
- **HighCoreDNSCPU/Memory**: CoreDNS Pod의 CPU/메모리 사용률 모니터링 경보.

## 4. Amazon EKS 모범 사례 및 고객 사례 (DNS 병목 대응 등)

AWS 클라우드 환경에 특화된 **EKS DNS 운용 모범사례**를 문서와 블로그를 통해 제공하고 있습니다. 주요 권장사항과 고객 사례에서 자주 등장하는 시나리오는 다음과 같습니다:

<TroubleshootingTable />

### CoreDNS Horizontal Scaling (복제수 조정)

EKS 클러스터 생성 시 기본 CoreDNS Deployment 복제수는 2개로 고정되지만, 노드 수와 워크로드 증가에 따라 **수평 확장**이 필요할 수 있습니다. AWS 모범 사례는 **Cluster Proportional Autoscaler**를 사용해 CoreDNS 복제수를 **노드 수 또는 CPU 코어 수에 비례하여 자동 증가**시키는 것입니다.

### NodeLocal DNSCache 도입

**대규모 클러스터**나 **DNS 트래픽이 매우 빈번한 워크로드**에서는, CoreDNS를 중앙에서 처리하는 방식이 **네트워크 지연 및 ENI 한계**로 병목이 될 수 있습니다. Kubernetes의 공식 애드온인 *NodeLocal DNSCache*는 **모든 노드에서 DNS 캐시 에이전트(CoreDNS 기반)를 데몬셋으로 실행**하여, 각 Node에서 **로컬 DNS**를 제공하는 방식입니다.

### DNS 패킷 한계 및 트래픽 분산

AWS 환경의 흔한 병목으로 **VPC DNS 패킷 한도(1024 PPS/ENI)**가 있습니다. 실무 사례로, 대량의 외부 DNS 조회를 하는 애플리케이션이 있을 경우 CoreDNS Pod 2개가 **모두 동일한 노드**에 떠 있다면, 그 노드의 ENI 하나로 모든 외부 DNS 질의가 나가 한도를 넘을 위험이 있습니다.

### Graceful Termination 설정 (Lameduck & Ready 플러그인)

CoreDNS Pod를 재시작하거나 축소할 때 발생하는 **일시적인 DNS 실패**를 막기 위한 설정입니다. AWS 모범 사례는 CoreDNS에 **lameduck 30s** 설정을 적용하고, **Readiness Probe**를 `/ready` 엔드포인트로 구성하는 것입니다.

### 더 높은 QPS가 필요할 때

1. **`max_concurrent` 상향**: `2000` 이상으로 조정할 수 있지만, 메모리 사용량(2 KB × 동시 질의 수)과 upstream DNS 지연 시간을 함께 고려해야 합니다.

2. **CoreDNS 수평 확장**: Replica 수를 늘리거나 Cluster Proportional Autoscaler, HPA, 혹은 **NodeLocal DNSCache**로 질의를 노드 단으로 분산합니다.

3. **ENI 한계 모니터링**: `aws_ec2_eni_allowance_exceeded` (CloudWatch) 또는 `linklocal_allowance_exceeded` 지표에 알람을 걸어 ENI PPS 초과를 조기에 탐지합니다.

## 핵심 요약

<PerformanceBenchmarks />

- **모니터링 메트릭**: `requests_total`, `request_duration_seconds`, `cache_hits/misses`, `responses_total{rcode}`, CPU/메모리
- **TTL 권장치**: 서비스 레코드 30s, cache (success 30, denial 5-10), prefetch 5 60s
- **모니터링**: kube-prometheus-stack 기본 대시보드 + Alertmanager 룰, 필요 시 NodeLocal DNSCache로 스케일-아웃

## 부록: 구성 예시

### Corefile 권장 구성

```text
.:53 {
  kubernetes cluster.local in-addr.arpa ip6.arpa {
    pods insecure
    fallthrough in-addr.arpa ip6.arpa
    ttl 30           # Service/POD 레코드 TTL
  }

  cache 30 {         # 최대 30초 보존
    success 10000 30 # capacity 10k, maxTTL 30s
    denial 2000 10   # negative cache 2k, maxTTL 10s
    prefetch 5 60s   # 동일 질의 5회↑면 60s 전에 갱신
  }

  forward . /etc/resolv.conf {
    max_concurrent 2000
    prefer_udp
  }

  prometheus :9153
  health {
    lameduck 30s
  }
  ready
  reload
  log
}
```

### Alertmanager 룰 예시

```yaml
- alert: CoreDNSHighErrorRate
  expr: >
    (sum(rate(coredns_dns_responses_total{rcode!~"NOERROR"}[5m])) /
     sum(rate(coredns_dns_requests_total[5m]))) > 0.01
  for: 10m
  labels:
    severity: critical
  annotations:
    description: "CoreDNS error rate > 1% for 10 min"

- alert: CoreDNSP99Latency
  expr: >
    histogram_quantile(0.99,
      sum(rate(coredns_dns_request_duration_seconds_bucket[5m])) by (le)) > 0.05
  for: 5m
  labels:
    severity: warning
```

### 대규모 클러스터 (>100 노드 또는 QPS > 5k)

1. **NodeLocal DNSCache** (DaemonSet 형태)로 노드 로컬에서 캐시하여 RTT 단축
   - nodelocaldns 메트릭도 Prometheus에 수집해 CoreDNS와 비교
2. **CloudWatch Container Insights** (EKS 전용)
   - Prometheus 수집이 어려운 환경이라면 `cwagent + adot-internal-metrics` 옵션으로 CoreDNS 컨테이너 메트릭을 CloudWatch로 전송 가능 (별도 요금 발생)
