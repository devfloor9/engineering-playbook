---
title: CPU 성능 비교 가능성과 Pod·노드 사이징 표준
description: 같은 워크로드의 CPU 사용률이 인스턴스 크기·세대에 따라 달라지는 원인을 정리하고, 크기·세대 비교에 쓸 KPI와 스로틀링·스케줄링 대기의 관측 경로, Pod 사이징 기준, 혼합 노드풀 판단 절차를 제시합니다.
created: "2026-09-19"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 26
tags:
  - eks
  - cpu
  - right-sizing
  - performance
  - graviton
  - ebpf
  - scope:ops
keywords:
  - CFS throttling
  - run queue latency
  - CPU Manager static policy
  - LimitRange
  - perf-per-cost
  - PSI
  - cAdvisor
sidebar_label: CPU 사이징 & 성능 비교
category: performance-networking
---

## 개요

같은 컨테이너 이미지를 다른 크기나 세대의 노드로 옮기면 CPU 사용률(CPU%)이 달라질 수 있습니다. 사용률이 높아졌다는 사실만으로 처리 성능이 나빠졌다고 판단할 수는 없습니다. 먼저 사용률의 분모를 확인하고, 같은 부하에서 처리량과 응답 시간이 어떻게 달라졌는지 비교해야 합니다.

이 문서는 노드 크기를 정하는 플랫폼팀과 애플리케이션을 운영하는 팀을 위한 비교 절차입니다. CPU 사용률의 차이를 해석하고, 스로틀링과 스케줄링 대기를 관측한 뒤, 측정 결과로 Pod 크기와 노드 후보를 정하는 순서로 설명합니다.

## 배경

requests와 limits의 의미, CFS bandwidth throttling이 cgroup에서 동작하는 방식, QoS 클래스, VPA 기반 Right-Sizing, throttled-period PromQL은 [Pod 리소스 최적화 가이드](./eks-resource-optimization.md)에 있습니다. 노드 커널과 arm64 전제는 [Nitro 아키텍처 성능 튜닝](../networking-performance/nitro-architecture-performance-tuning.md), 노드 크기 구성과 consolidation은 [Karpenter 오토스케일링](./karpenter-autoscaling.md)을 참조합니다.

용어는 다음 의미로 사용합니다.

- **SMT(Simultaneous Multithreading)** — 물리 코어 하나가 여러 하드웨어 스레드를 노출하는 기술. SMT를 사용하는 EC2 타입에서는 vCPU가 논리 CPU 스레드에 대응하지만, Graviton과 x86 C7a처럼 vCPU가 물리 코어에 대응하는 타입도 있습니다. 인스턴스 타입과 CPU 옵션의 실제 topology를 확인합니다
- **run queue** — 실행 준비는 끝났지만 아직 vCPU를 받지 못한 스레드의 대기열. 길어질수록 스케줄링 대기가 늘어납니다
- **LLC(Last-Level Cache)** — CPU의 마지막 단계 캐시. 캐시를 공유하는 코어의 범위는 하드웨어 구조에 따라 다르며, 소켓 전체와 같다고 가정하지 않습니다
- **CFS bandwidth** — 일정 주기 동안 cgroup이 사용할 CPU 시간을 제한하는 기능. CFS라는 이름의 quota와 메트릭이 남아 있어도 태스크 선택 알고리즘은 커널 버전에 따라 다릅니다. Linux는 6.6부터 [EEVDF로 전환](https://docs.kernel.org/scheduler/sched-eevdf.html)하기 시작했습니다
- **PSI(Pressure Stall Information)** — 태스크가 자원을 기다리며 멈춰 있던 시간의 비율을 커널이 집계한 값. cgroup v2에서는 cgroup별 `cpu.pressure` 파일로 노출됩니다

벤치마크 하네스 구현과 부하 도구 배포는 범위 밖이며, 세대별 벤치마크는 파이프라인 설계까지만 다룹니다.

## 아키텍처

CPU 사용률은 물리 하드웨어에서 Pod 관측치까지 여러 층을 거치며 의미가 바뀝니다. 각 층에서 다른 워크로드, 설정, 스케줄러가 개입하기 때문에 맨 위에서 본 CPU%는 아래 층의 상태를 그대로 보여 주지 않습니다. 관측은 이 구조의 아래쪽에서 시작합니다. 커널이 cgroup별 `cpu.stat`과 `cpu.pressure`에 스로틀과 대기 시간을 기록하고, kubelet에 내장된 cAdvisor가 그 값을 메트릭으로 노출하며, Prometheus나 CloudWatch는 그것을 수집할 뿐입니다.

```mermaid
flowchart TB
    PC["물리 코어<br/>(LLC·메모리 대역폭 공유, NUMA)"] --> VCPU["vCPU<br/>(타입별 논리 CPU 또는 물리 코어)"]
    VCPU --> CG["cgroup CPU bandwidth<br/>(cpu.max: MAX PERIOD)"]
    CG --> RQ["scheduler run queue<br/>(대기 시간 · context switch)"]
    RQ --> OBS["Pod 관측치<br/>(CPU% · throttled period · latency)"]
    NOISE["다른 테넌트 Pod<br/>(noisy neighbor)"] -.->|LLC·대역폭 경합| PC
    IPC["세대별 IPC 차이<br/>(x86 세대 · Graviton 세대)"] -.->|같은 명령 수 · 다른 실행 시간| VCPU
    CG -.->|cpu.stat · cpu.pressure| MET["kubelet 내장 cAdvisor<br/>/metrics/cadvisor"]
    MET -.-> SINK["Prometheus · AMP · CloudWatch"]
```

`cpu.max`에는 CPU 시간 상한과 주기가 공백으로 구분되어 들어갑니다. 두 수를 나눈 값이 평균적으로 허용하는 CPU 용량이며, 나눗셈 자체가 파일 형식은 아닙니다. `max`는 해당 cgroup의 상한을 해제하지만 상위 cgroup의 제한까지 없애지는 않습니다([cgroup v2 CPU 인터페이스](https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu-interface-files)).

## CPU 사용률이 비교되지 않는 이유

같은 이미지를 다른 인스턴스에서 돌렸을 때 CPU%가 달라지는 원인은 하드웨어부터 스케줄러까지 여러 층에 걸쳐 있습니다.

- LLC와 메모리 대역폭의 공유 범위는 CPU 구조에 따라 다릅니다. 같은 하드웨어 자원을 쓰는 이웃 Pod의 부하가 캐시 적중률과 대기 시간에 영향을 줄 수 있습니다. 캐시별 공유 CPU 목록은 [sysfs의 `shared_cpu_list`](https://docs.kernel.org/admin-guide/abi-testing.html)로 확인하고, 성능 영향은 워크로드로 측정합니다.
- SMT를 사용하는 x86에서는 형제 vCPU 두 개가 물리 코어 하나의 실행 자원을 공유합니다. 이를 독립된 물리 코어 두 개와 같은 처리량으로 볼 수 없으며, 단일 스레드 대비 이득이나 손실은 워크로드에 따라 달라집니다. x86 C7a와 Graviton처럼 SMT가 없는 타입도 있으므로 아키텍처 이름만으로 대응 관계를 정하지 않습니다.
- 세대가 바뀌면 클록, 캐시 크기, 코어 마이크로아키텍처가 달라져 같은 명령 수를 처리하는 시간이 달라집니다. 시간 비율인 CPU%에는 이 차이가 드러나지 않습니다. Graviton 세대별 코어와 캐시 구성은 [AWS Graviton Technical Guide](https://github.com/aws/aws-graviton-getting-started)에 정리되어 있습니다.
- 사용률이 낮아도 run queue 대기가 길면 지연이 늘어납니다. 사용률과 지연은 따로 봐야 합니다.
- CPU limit이 있는 멀티스레드 컨테이너는 사용률이 낮은 상태에서도 quota를 일찍 소진해 스로틀될 수 있습니다. 동작과 PromQL은 [Pod 리소스 최적화 가이드의 CPU Throttling 관측](./eks-resource-optimization.md#633-cpu-throttling-자동-탐지)을 참조합니다.

먼저 CPU%의 분모를 고정합니다. 소비한 CPU-seconds를 경과 시간으로 나눈 코어 사용량인지, Pod request·limit 또는 노드 전체 CPU로 정규화한 비율인지에 따라 뜻이 달라집니다. 새 세대가 같은 작업을 더 적은 CPU 시간으로 끝낼 수는 있지만 이는 측정할 결과입니다. 소형 노드에서 DaemonSet 비중이 커진다는 사실만으로 애플리케이션 컨테이너의 CPU 사용량이나 고정 request 대비 사용률이 자동으로 증가하지는 않습니다. 노드 오버헤드, 경합, 애플리케이션 소비량을 나누어 비교합니다.

## 비교 가능한 KPI

크기와 세대를 비교할 때는 사용률 대신 같은 조건에서 측정한 워크로드 결과를 씁니다.

| KPI | 정의 | 비교에서의 의미 |
|---|---|---|
| sustained RPS | 정상 상태에서 SLO를 지키며 처리한 초당 요청 수 | 처리 능력의 직접 지표 |
| p99 latency | 99퍼센타일 응답 시간 | 꼬리 지연의 저하 여부 |
| throttled-period 비율 | throttled period / 전체 CFS period | quota 부족 여부 |
| run queue latency | run queue에서 스레드가 대기한 시간 | 스케줄링 경합 여부 |
| cost-per-1K-req | 1,000 요청 처리에 든 컴퓨트 비용 | 가격 대비 성능 |

도메인팀의 CPU% 임계 알람은 SLO(지연·오류율) 기반 알람으로 바꾸는 편이 오탐이 적습니다. throttled-period 비율은 quota 부족을 직접 보여 주므로 CPU%를 대신하는 보조 지표로 쓸 수 있습니다.

단일 인스턴스의 시간당 비용을 `H`, SLO 안에서 측정한 sustained RPS를 `R`이라고 하면 `cost-per-1K-req = H × 1000 / (3600 × R)`입니다. 예를 들어 시간당 $3.60, 100 RPS라면 1,000 요청당 $0.01입니다. 여러 노드를 비교할 때는 같은 측정 범위의 총비용과 처리량을 사용하고 포함·제외한 비용을 명시합니다.

## 스로틀링과 스케줄링 대기 관측

### 스로틀링 카운터의 출처와 수집 경로

스로틀링은 별도 계측 없이 측정됩니다. 커널이 CFS bandwidth 제어를 적용할 때마다 cgroup의 `cpu.stat`에 `nr_periods`, `nr_throttled`, `throttled_usec`(cgroup v1은 `throttled_time`, ns 단위)를 누적하고, kubelet에 내장된 cAdvisor가 이 값을 `/metrics/cadvisor` 엔드포인트에서 `container_cpu_cfs_periods_total`, `container_cpu_cfs_throttled_periods_total`, `container_cpu_cfs_throttled_seconds_total`로 노출합니다. 이 메트릭은 기본으로 켜져 있어서, 클러스터에 Prometheus가 있다면 이미 수집 중일 가능성이 높습니다.

수집 경로는 쓰고 있는 모니터링 스택에 맞춰 고릅니다.

- Prometheus를 kube-prometheus-stack으로 설치했다면 kubernetes-mixin의 "Compute Resources / Pod" 대시보드에 CPU Throttling 패널이, 알림 규칙에 `CPUThrottlingHigh`(기본 15분간 25% 초과)가 들어 있습니다. 추가 작업 없이 바로 씁니다.
- AWS 관리형 스택에서는 ADOT Collector의 prometheus receiver로 kubelet의 `/metrics/cadvisor`를 스크레이프해 Amazon Managed Service for Prometheus(AMP)로 remote write하거나, CloudWatch agent의 Prometheus 스크레이프 설정 또는 ADOT `awsemf` exporter로 CloudWatch 메트릭으로 보냅니다. CloudWatch Container Insights(Enhanced)의 기본 메트릭에는 `pod_cpu_utilization`, `pod_cpu_utilization_over_pod_limit`, `pod_cpu_reserved_capacity`는 있지만 CFS throttled-period 메트릭이 없으므로, CloudWatch 중심 환경에서는 이 스크레이프 job을 더하는 것이 스로틀링을 보는 방법입니다.
- Datadog, New Relic, Dynatrace 같은 상용 에이전트도 같은 cgroup 카운터를 각자의 메트릭 이름으로 노출하므로, 해당 제품 문서에서 이름만 확인하면 됩니다.
- JVM 워크로드는 애플리케이션 안에서도 확인할 수 있습니다. JDK 17 이상의 JFR에는 `jdk.ContainerCPUThrottling` 이벤트(`cpuThrottledSlices`, `cpuThrottledTime`)가 있어 외부 에이전트 없이 기록에 남습니다.

### 스케줄링 대기의 관측

스케줄링 대기는 스로틀링과 다른 신호입니다. quota가 남아 있어도 vCPU를 받지 못해 run queue에서 기다린 시간이며, 가벼운 방법부터 순서대로 확인합니다.

- PSI는 태스크가 CPU를 기다리며 멈춘 시간의 비율을 cgroup 단위로 보여 줍니다. cgroup v2의 `cpu.pressure`(노드 전체는 `/proc/pressure/cpu`)에 `some`(일부 태스크가 대기)과 `full`(모든 태스크가 대기)의 avg10/avg60/avg300과 누적 `total`이 있습니다. 스로틀과 경합을 구분하지는 않지만 파일 하나로 "기다렸는가"에 답합니다. Kubernetes는 1.33부터 kubelet이 PSI를 수집하고 1.36에서 GA되어 `KubeletPSI` 게이트가 고정되었으며, `/metrics/cadvisor`의 `container_pressure_cpu_waiting_seconds_total`(some)·`container_pressure_cpu_stalled_seconds_total`(full)과 Summary API에서 노드·Pod·컨테이너 단위로 읽을 수 있습니다. 커널 4.20 이상, `CONFIG_PSI`, cgroup v2가 전제이고(EKS의 AL2023·Bottlerocket AMI는 cgroup v2가 기본입니다), 배포판이 PSI를 꺼 두었다면 커널 파라미터 `psi=1`이 필요합니다.
- `/proc/<pid>/schedstat`는 스레드별로 CPU에서 실행한 시간, run queue에서 기다린 시간(ns), 타임슬라이스 수를 제공합니다. cAdvisor의 `container_cpu_schedstat_runqueue_seconds_total`과 `container_cpu_schedstat_run_seconds_total`이 이 값을 컨테이너 단위로 합산한 것이지만, `sched` 메트릭 그룹에 속해 기본 비활성이고 kubelet 내장 엔드포인트에는 노출되지 않으므로 standalone cAdvisor DaemonSet에서 `-enable_metrics=sched`로 켜야 합니다.
- 대기 시간의 분포가 필요하면 eBPF `runqlat`을 사용할 수 있습니다. eBPF를 쓰지 않는 경로로는 `perf sched record`로 스케줄 이벤트를 기록하고 `perf sched latency`의 태스크별 통계 또는 `perf sched timehist`의 이벤트별 지연을 분석할 수 있습니다.

## Pod 사이징 기준

### 비율과 최소 크기

Pod의 CPU·메모리 요청량과 노드의 가용 용량을 함께 보며 배치를 계획합니다. 아래 비율은 vCPU:GiB 단위의 검토 예시입니다. 실제 인스턴스 제원, DaemonSet과 시스템 예약량, 워크로드 측정치를 확인해 값을 정합니다. 모든 서비스에 2 vCPU 하한이 필요하다는 의미는 아닙니다.

| Pod 프로파일 | CPU:mem 비율 | 검토할 패밀리 | CPU 요청량 예시 | QoS·정책 |
|---|---|---|---|---|
| CPU 집약 | 1:2 | c (compute) | 2 vCPU 이상(스레드 풀 런타임은 상향 검토) | Burstable, CPU limit 생략 검토 |
| 범용 | 1:4 | m (general) | 2 vCPU | Burstable |
| 메모리 집약 | 1:8 | r (memory) | 2 vCPU | Burstable |
| 지연 민감·격리 필요 | 워크로드별 | c/m | 정수 vCPU | Guaranteed + CPU Manager static |

Pod가 많아 IP나 maxPods에 먼저 닿는지 확인한 뒤 사이징 정책을 정합니다. request 하한만 높여도 고정된 replica 수나 Pod IP 수는 줄지 않으며, 필요한 노드 수가 오히려 늘 수 있습니다. 더 큰 Pod와 적은 replica로 바꾸는 선택은 처리량·SLO 검증을 포함한 워크로드 변경입니다. IP 예산은 [IP 용량 계획과 Karpenter 노드 사이징](../networking-performance/ip-capacity-planning-karpenter.md)을 참조합니다.

지연에 민감한 서비스에서 CPU limit을 생략할지는 격리 요구, 테넌트 정책, LimitRange와의 충돌을 함께 보고 정합니다([Pod 리소스 최적화 가이드의 CFS Bandwidth Throttling](./eks-resource-optimization.md#cfs-bandwidth-throttling)). 노드 단위 설정인 Karpenter EC2NodeClass의 `spec.kubelet.cpuCFSQuota: false`는 CPU limit을 지정한 컨테이너에 대한 kubelet의 quota 적용을 끕니다. 상위 cgroup의 quota나 CPU 경합까지 없애는 설정은 아니므로, 모든 스로틀링이 사라진다고 볼 수 없습니다. 해당 노드 전체에 영향을 주므로 전용 NodePool에서 유효한 cgroup 계층과 격리 정책을 확인한 뒤 검토합니다([커널 bandwidth 계층](https://docs.kernel.org/scheduler/sched-bwc.html#hierarchical-considerations)).

### Guaranteed 정수 CPU와 CPU Manager static

CPU Manager `static`은 Guaranteed QoS이면서 CPU request가 정수인 컨테이너에 배타적인 논리 CPU cpuset을 할당합니다. SMT 환경에서 물리 코어 전체를 격리하려면 `full-pcpus-only` 등 해당 Kubernetes 버전의 policy option과 SMT 폭에 맞는 요청량을 별도로 검토해야 합니다. `static`만으로 형제 스레드까지 배타적으로 확보한다고 가정하지 않습니다. 분수 request와 Burstable·BestEffort Pod는 공유 풀을 사용합니다. `--reserved-cpus` 또는 `--kube-reserved`/`--system-reserved`로 0보다 큰 CPU 예약도 필요합니다. 캐시 지역성과 활용도에 미치는 영향은 실제 워크로드로 확인합니다.

### 런타임 스레드 수

컨테이너가 인식하는 프로세서 수를 CPU 할당과 맞춥니다.

- JVM은 JDK 10부터 `UseContainerSupport`가 기본이라 컨테이너 CPU quota를 보고 `availableProcessors()`를 계산합니다. 값을 고정하려면 `-XX:ActiveProcessorCount=N`을 씁니다.
- Go는 1.25부터 Linux에서 cgroup의 CPU bandwidth limit을 보고 `GOMAXPROCS` 기본값을 낮춥니다. CPU requests는 반영하지 않으며, 환경 변수 `GOMAXPROCS`나 `runtime.GOMAXPROCS` 호출로 값을 직접 정하면 이 동작은 꺼집니다([Go 1.25 릴리스 노트](https://go.dev/doc/go1.25#container-aware-gomaxprocs)). 1.25 미만에서는 [uber-go/automaxprocs](https://github.com/uber-go/automaxprocs)로 같은 효과를 냅니다.

## 크기·세대 혼합 노드풀 판단 절차

크기나 세대가 다른 인스턴스를 같은 워크로드에 섞어 쓸지 결정하기 전에, 비교가 성립하는 조건을 먼저 갖춥니다. 아래 조건이 모두 맞아야 KPI 비교가 유효합니다.

1. 동일 컨테이너 이미지(같은 태그·다이제스트)를 사용합니다.
2. 부하 프로파일(요청 분포·페이로드 크기)을 동일하게 고정합니다.
3. 동시성(클라이언트 스레드·커넥션 수)을 동일하게 설정합니다.
4. SLO(목표 p99·오류율)를 명시하고 그 안에서 sustained RPS를 측정합니다.
5. warm-up 구간을 두어 JIT·캐시·커넥션 풀이 정상 상태에 도달한 뒤 측정합니다.
6. 순간 스파이크가 아닌 정상 상태를 볼 수 있을 만큼 지속 시간을 확보합니다.
7. 최소 3회 반복하고 분산을 확인합니다.
8. p50/p95/p99 latency, sustained RPS, cost-per-1K-req를 함께 보고합니다.

측정 조건이 다르면 결과를 비교 근거로 쓰지 않습니다. Graviton과 x86을 비교할 때는 이미지와 네이티브 의존성이 arm64를 지원하는지 먼저 확인합니다([Nitro 아키텍처 성능 튜닝](../networking-performance/nitro-architecture-performance-tuning.md)).

혼합 노드풀을 채택한다면 KPI가 SLO 안에 드는 크기·세대만 후보로 남기고, 나머지는 제외하거나 별도 weight를 둔 NodePool로 분리합니다. 도메인팀이 보는 CPU% 편차가 커지더라도 처리 능력과 지연은 SLO 안에서 유지됩니다. 후보 선정과 weighted NodePool 구성은 [Karpenter 오토스케일링](./karpenter-autoscaling.md)을 따릅니다.

## 구현

### LimitRange로 최소 요청과 기본값 강제

네임스페이스의 컨테이너에 최소 CPU·메모리와 기본값을 강제합니다. `limits.cpu`를 강제하는 ResourceQuota와 CPU limit 생략 전략은 충돌할 수 있으므로 함께 적용하기 전에 조정합니다([Pod 리소스 최적화 가이드의 Resource Quota & LimitRange](./eks-resource-optimization.md#resource-quota--limitrange)). 값은 예시입니다.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: cpu-sizing-baseline
  namespace: production
spec:
  limits:
  - type: Container
    min:
      cpu: "2000m"        # 최소 2 vCPU 하한
      memory: "4Gi"
    defaultRequest:
      cpu: "2000m"
      memory: "4Gi"
    default:
      memory: "4Gi"       # CPU default 미지정 -> CPU limit 생략 허용
```

### CPU limit 생략을 허용하는 ResourceQuota

`limits.cpu`를 quota에서 생략하면 CPU limit 없는 Pod를 허용할 수 있습니다. 아래의 동일한 memory quota 값은 namespace 전체 request 합계와 limit 합계를 각각 제한할 뿐, 컨테이너마다 request=limit을 강제하지 않습니다. Guaranteed QoS를 원하면 각 컨테이너의 CPU·memory request와 limit을 명시적으로 같게 설정해야 합니다.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    requests.cpu: "200"       # CPU는 request만 집계
    requests.memory: "400Gi"
    limits.memory: "400Gi"    # limits.cpu 미포함 -> CPU limit 생략과 비충돌
    pods: "500"
```

### CPU Manager static 노드풀

`static` policy는 노드 kubelet 설정이므로 별도 NodePool로 분리해 배타적 논리 CPU가 필요한 워크로드만 배치합니다. Karpenter v1 EC2NodeClass의 `spec.kubelet`은 kubelet 설정 중 일부 필드만 지원하고 `cpuManagerPolicy`는 포함되지 않습니다. 예약 CPU는 `spec.kubelet`으로 두고, 정책은 AL2023 `NodeConfig` userData로 전달합니다(Karpenter가 생성한 NodeConfig와 병합됩니다). AMI는 `@latest` 대신 날짜 버전으로 고정합니다. 노드가 다시 뜰 때 AMI가 바뀌면 세대·성능 비교의 기준선이 함께 움직이기 때문입니다. NodePool 문법과 weight는 [Karpenter 오토스케일링](./karpenter-autoscaling.md)을 참조합니다.

아래 YAML은 기존의 유효한 EC2NodeClass에 병합할 설정 발췌이며 독립적으로 적용할 manifest가 아닙니다. `role` 또는 `instanceProfile` 중 하나, subnet·security group selector를 유지하고 AMI 날짜 자리표시자를 검증한 실제 버전으로 바꿉니다.

EKS Auto Mode 노드에는 이 방식이 적용되지 않습니다. Auto Mode는 NodeClass `advancedCompute.kubelet`으로 `maxPods`(최대 110), `podPidsLimit`, eviction 임계값, 컨테이너 로그 로테이션, `singleProcessOOMKill`, `allowedUnsafeSysctls`를 조정할 수 있고 `advancedCompute.kernel.sysctl`로 커널 파라미터도 바꿀 수 있지만, CPU Manager 정책·CFS quota·예약 CPU는 노출하지 않으며 userData(NodeConfig)도 받지 않습니다. 배타적 코어가 필요한 워크로드는 Auto Mode 밖의 자체 관리 NodePool에 둡니다. 반대로 배타적 코어가 필요하지 않은 일반 워크로드는 Auto Mode의 조정 범위로 충분한지 먼저 확인하고, 두 종류의 노드를 한 클러스터에 두어 워크로드별로 나누는 구성도 검토할 수 있습니다.

```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: cpu-pinned
spec:
  amiSelectorTerms:
    - alias: al2023@vYYYYMMDD   # 실제 릴리스 날짜로 고정. @latest는 노드 재생성 시 AMI가 바뀜
  kubelet:
    systemReserved:
      cpu: "1"              # static 활성화에 0보다 큰 예약 필요
    kubeReserved:
      cpu: "1"
  userData: |
    apiVersion: node.eks.aws/v1alpha1
    kind: NodeConfig
    spec:
      kubelet:
        config:
          cpuManagerPolicy: static   # spec.kubelet 미지원 필드는 NodeConfig로 전달
```

### 스로틀링 비율 확인과 알림

즉석 확인은 Prometheus 없이도 됩니다. 컨테이너 안의 cgroup 카운터를 직접 읽거나, 노드의 kubelet cAdvisor 스냅샷을 API 서버 프록시로 받습니다.

```bash
# 컨테이너 안의 cgroup 카운터 (cgroup v2; v1은 /sys/fs/cgroup/cpu/cpu.stat)
kubectl exec -n <namespace> <pod> -c <container> -- cat /sys/fs/cgroup/cpu.stat

# 노드의 kubelet cAdvisor 스냅샷
kubectl get --raw "/api/v1/nodes/<node>/proxy/metrics/cadvisor" \
  | grep 'container_cpu_cfs_throttled_periods_total{.*namespace="<namespace>"'

# PSI (Kubernetes 1.33+, cgroup v2)
kubectl get --raw "/api/v1/nodes/<node>/proxy/metrics/cadvisor" \
  | grep 'container_pressure_cpu_waiting_seconds_total{.*namespace="<namespace>"'
```

Prometheus에서는 두 카운터의 `rate()` 비율로 스로틀 비율을 계산하고, 같은 식을 알림 규칙에 씁니다. kube-prometheus-stack의 `CPUThrottlingHigh`도 같은 방식입니다. Grafana 패널 구성과 상세 PromQL은 [Pod 리소스 최적화 가이드의 CPU Throttling 관측](./eks-resource-optimization.md#633-cpu-throttling-자동-탐지)을 재사용합니다.

```promql
sum by (namespace, pod, container) (rate(container_cpu_cfs_throttled_periods_total{container!=""}[5m]))
/ sum by (namespace, pod, container) (rate(container_cpu_cfs_periods_total{container!=""}[5m]))
```

### 세대별 벤치마크 파이프라인

세대나 크기를 바꿀 때 회귀를 배포 전에 잡으려면 CI에 "동일 이미지 × 인스턴스 매트릭스" 부하시험 스테이지를 둡니다. 하네스 구현은 범위 밖이고, 재현 가능한 벤치마크 문서와 하네스 선례는 repo의 `docs/benchmarks/`를 따릅니다. 게이트는 이 순서로 동작합니다.

```text
For each (instance-size x generation) target NodePool:
- Deploy identical image (same tag/digest) to a dedicated node
- Apply fixed load profile and concurrency for a warm-up + steady window
- Repeat >= 3 runs; record p50/p95/p99, sustained RPS, cost-per-1K-req
- Compare against baseline within the declared SLO
- Fail the stage on regression beyond threshold; publish the report
```

## 운영 고려사항

- 60초 평균은 1분 미만의 스로틀 스파이크를 가리므로 15~30초 해상도와 히스토그램을 사용합니다. PSI의 avg10이 avg300보다 뚜렷하게 높으면 최근에 생긴 경합이고, avg300까지 올라오면 지속적인 병목입니다.
- cAdvisor의 CFS·schedstat·pressure 카운터는 counter 타입이므로 `rate()`를 먼저 적용한 뒤 비율을 계산합니다. 여러 replica를 하나의 값으로 합치지 않고 namespace/pod/container 식별자를 유지하며, Pod 재생성으로 인한 시계열 단절과 scrape 중복도 확인합니다.
- 스로틀 비율 알림은 p99·오류율과 함께 봅니다. 비율이 높아도 SLO 안이면 limit 조정 후보로만 기록하고, SLO를 벗어날 때 조치합니다.
- eBPF 도구의 요구사항은 배포 방식마다 다릅니다. CO-RE 기반 도구는 BTF를 요구할 수 있고, 전통적인 BCC 도구는 커널 헤더와 LLVM/Clang을 이용해 컴파일할 수 있습니다. 선택한 `bcc`/`bpftrace` 또는 [Inspektor Gadget](https://www.inspektor-gadget.io/) 버전의 커널·권한·수집 오버헤드를 확인합니다.

## 트러블슈팅

| 증상 | 원인 | 조치 | 확인 방법 |
|---|---|---|---|
| 소형 노드나 다른 세대 노드에서 CPU% 상승 알람 | 크기·세대 간 비교 불가(캐시·대역폭 공유, SMT, IPC 차이) | SLO 기반 알람으로 전환, 벤치마크로 임계치 재정의 | p99·오류율 불변 확인 |
| 사용률은 낮은데 latency 증가 | CFS 글로벌 quota가 멀티스레드를 스로틀 | CPU limit 생략 검토 또는 스레드 수 정렬 | `cpu.stat`의 nr_throttled/nr_periods, 스로틀 비율 PromQL |
| 스로틀 비율은 0인데 latency 증가 | quota는 남아 있지만 run queue 대기(노드 경합) | 노드 밀도 조정, Guaranteed 정수 CPU 또는 CPU Manager static 검토 | `cpu.pressure` some 비율, schedstat runqueue 시간 |
| Pod 수가 IP 또는 maxPods 상한에 접근 | replica 수·배치·주소 예산의 제약 | 주소 용량과 배치부터 확인하고, replica 수 변경을 포함한 vertical sizing은 SLO로 검증 | 실제 Pod·노드 수, IP 소비, 처리량·지연 |
| Guaranteed 정수 CPU Pod도 성능 편차 | 공유 풀 스케줄, noisy neighbor | `cpuManagerPolicy: static`과 reserved-cpus(여유 코어 손실 명시) | cpuset 확인, run queue latency |
| JVM/Go가 노드 전체 코어 기준으로 스레드 생성 | 런타임이 컨테이너 CPU를 인식하지 못함 | `-XX:ActiveProcessorCount`, Go 1.25+/automaxprocs | 스레드 수·throttled 비율 |

## 결론

인스턴스 크기·세대를 비교할 때는 CPU 사용률의 분모를 맞추고, 동일한 부하에서 sustained RPS, p99, cost-per-1K-req를 함께 측정합니다. 응답 시간이 늘었다면 `cpu.stat`의 스로틀링 카운터와 스케줄링 대기를 구분해 원인을 좁힙니다.

Pod 요청량은 측정한 처리량과 메모리 사용량에 맞춰 정합니다. CPU request만 올려서는 replica 수나 Pod IP 수가 줄지 않습니다. CPU 격리가 필요한 워크로드는 Guaranteed QoS와 CPU Manager 설정을 검토하고, SLO를 만족한 인스턴스 크기·세대만 노드풀 후보로 유지합니다.

## 참고 자료

### 공식 문서

- [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/) — CPU Manager static policy 전제와 kubelet 옵션
- [Understand Pressure Stall Information (PSI) Metrics](https://kubernetes.io/docs/reference/instrumentation/understand-psi-metrics/) — kubelet PSI 메트릭(1.33 도입, 1.36 GA), 요구 조건과 `container_pressure_*` 메트릭
- [PSI - Pressure Stall Information (kernel)](https://docs.kernel.org/accounting/psi.html) — `/proc/pressure/cpu`, cgroup `cpu.pressure`의 some/full 정의
- [cgroup v2 (kernel)](https://docs.kernel.org/admin-guide/cgroup-v2.html) — `cpu.max`, `cpu.stat`(nr_periods, nr_throttled, throttled_usec)
- [cAdvisor Prometheus metrics](https://github.com/google/cadvisor/blob/master/docs/storage/prometheus.md) — CFS·schedstat·pressure 컨테이너 메트릭 정의
- [Enhanced Container Insights metrics for EKS](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-metrics-enhanced-EKS.html) — 제공 메트릭 목록(CFS 스로틀 메트릭 부재 확인)
- [Container Insights Prometheus metrics monitoring](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights-Prometheus.html) — CloudWatch agent의 Prometheus 스크레이프 설정
- [AWS Graviton Technical Guide](https://github.com/aws/aws-graviton-getting-started) — 세대별 코어·캐시·NUMA 구조, arm64 전제
- [Go 1.25 Release Notes: Container-aware GOMAXPROCS](https://go.dev/doc/go1.25#container-aware-gomaxprocs) — cgroup CPU limit 기반 GOMAXPROCS 기본값
- [JDK-8203359: JFR Container Metrics Events](https://bugs.openjdk.org/browse/JDK-8203359) — `jdk.ContainerCPUThrottling` 등 JDK 17 컨테이너 이벤트
- [ContainerCPUThrottlingEvent.java (OpenJDK)](https://github.com/openjdk/jdk/blob/master/src/jdk.jfr/share/classes/jdk/jfr/events/ContainerCPUThrottlingEvent.java) — 이벤트 필드 `cpuElapsedSlices`, `cpuThrottledSlices`, `cpuThrottledTime` 정의
- [Create a Node Class for Amazon EKS](https://docs.aws.amazon.com/eks/latest/userguide/create-node-class.html) — Auto Mode `advancedCompute.kubelet`이 노출하는 kubelet 설정 범위(maxPods·PID 제한·eviction·로그·OOM·unsafe sysctl)와 `advancedCompute.kernel.sysctl`

### 기술 블로그

- [Using Prometheus to Avoid Disasters with Kubernetes CPU Limits](https://aws.amazon.com/blogs/containers/using-prometheus-to-avoid-disasters-with-kubernetes-cpu-limits/) — CFS quota·slice·throttled-period 해석
- [kubernetes-mixin](https://github.com/kubernetes-monitoring/kubernetes-mixin) — kube-prometheus-stack의 CPU Throttling 패널과 `CPUThrottlingHigh` 알림 규칙
- [uber-go/automaxprocs](https://github.com/uber-go/automaxprocs) — Go 1.25 미만에서 컨테이너 CPU 인식 GOMAXPROCS

### 관련 문서 (내부)

- [Pod 리소스 최적화 가이드](./eks-resource-optimization.md) — requests/limits·QoS·CFS throttling PromQL·VPA·LimitRange 상세
- [Karpenter 오토스케일링](./karpenter-autoscaling.md) — NodePool/EC2NodeClass 문법·weight·consolidation
- [IP 용량 계획과 Karpenter 노드 사이징](../networking-performance/ip-capacity-planning-karpenter.md) — 소형 Pod의 IP·슬롯 소비와 노드 밀도
- [Nitro 아키텍처 성능 튜닝](../networking-performance/nitro-architecture-performance-tuning.md) — 노드 커널·arm64·PPS 튜닝 전제
