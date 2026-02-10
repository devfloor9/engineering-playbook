---
title: "VPC CNI vs Cilium CNI 성능 비교 벤치마크"
sidebar_label: "CNI 성능 비교"
description: "EKS 환경에서 VPC CNI와 Cilium CNI의 네트워크 및 애플리케이션 성능을 5개 시나리오(kube-proxy, kube-proxy-less, ENI, 튜닝)로 비교한 벤치마크 보고서"
tags: [benchmark, cni, cilium, vpc-cni, networking, performance, eks]
category: "benchmark"
date: 2026-02-09
authors: [devfloor9]
sidebar_position: 5
---

# VPC CNI vs Cilium CNI 성능 비교 벤치마크

## 개요 요약

본 보고서는 Amazon EKS 1.31 환경에서 VPC CNI와 Cilium CNI의 네트워크 성능을 5개 시나리오(VPC CNI 기본, Cilium+kube-proxy, Cilium kube-proxy-less, Cilium ENI, Cilium ENI+풀튜닝)로 측정하여 정량 비교한 결과를 제시합니다. kube-proxy 제거, Overlay vs Native Routing, 풀 튜닝 적용의 독립적 영향을 분석하여 워크로드 특성에 맞는 CNI 구성 선택을 지원합니다. 주요 발견: TCP throughput은 NIC 대역폭(12.5 Gbps)에 포화되어 모든 시나리오에서 동일(~12.4 Gbps). Cilium ENI+튜닝은 VPC CNI 대비 RTT 36% 개선(4894→3135µs), HTTP p99@1000QPS 20% 개선(10.92→8.75ms), UDP loss 극적 감소(20%→0.03%).

---

## 테스트 환경

| 항목 | 사양 |
|------|------|
| EKS 버전 | 1.31 (Platform: eks.51) |
| Cilium 버전 | 1.16.5 (Helm Chart: cilium-1.16.5) |
| 노드 타입 | m6i.xlarge (4 vCPU, 16GB RAM, ENA NIC) |
| 노드 수 | 3 (단일 AZ: ap-northeast-2a) |
| OS | Amazon Linux 2023.10.20260120 |
| 커널 | 6.1.159-182.297.amzn2023.x86_64 |
| 컨테이너 런타임 | containerd 2.1.5 |
| Service CIDR | 10.100.0.0/16 |
| 도구 | kubectl 1.31+, Cilium CLI 0.16+, Helm 3.16+, Fortio 1.65+, iperf3 3.17+ |
| 측정 방식 | 최소 3회 반복 측정 후 중앙값 사용 |

**클러스터 구성**: `scripts/benchmarks/cni-benchmark/cluster.yaml` 참조
**워크로드 배포**: `scripts/benchmarks/cni-benchmark/workloads.yaml` 참조

---

## 테스트 시나리오

5개 시나리오는 CNI, kube-proxy 모드, IP 할당 방식, 튜닝 적용 여부를 조합하여 각 변수의 독립적 영향을 측정하도록 설계했습니다.

| # | 시나리오 | CNI | kube-proxy | IP 할당 | 튜닝 | 측정 목적 |
|---|---------|-----|-----------|---------|------|----------|
| A | VPC CNI 기본 | VPC CNI | iptables | ENI Secondary IP | 기본값 | 베이스라인 |
| B | Cilium + kube-proxy | Cilium | iptables 유지 | Overlay (VXLAN) | 기본값 | VPC CNI → Cilium 전환 시 영향 |
| C | Cilium kube-proxy-less | Cilium | eBPF 대체 | Overlay (VXLAN) | 기본값 | kube-proxy 제거 효과 |
| D | Cilium ENI 모드 | Cilium | eBPF 대체 | AWS ENI (native) | 기본값 | Overlay vs Native Routing |
| E | Cilium ENI + 풀 튜닝 | Cilium | eBPF 대체 | AWS ENI (native) | 전체 적용 | 튜닝 누적 효과 |

### 시나리오 E 튜닝 포인트

| 튜닝 항목 | Helm Value | 효과 | 적용 여부 |
|-----------|-----------|------|----------|
| BPF Host Routing | `bpf.hostLegacyRouting=false` | 호스트 NS iptables bypass | ✅ |
| DSR | `loadBalancer.mode=dsr` | NodePort/LB 응답 직접 반환 | ❌ (ENA 호환성) |
| Bandwidth Manager | `bandwidthManager.enabled=true` | EDT 기반 rate limiting | ✅ |
| BPF Masquerade | `bpf.masquerade=true` | iptables MASQUERADE → eBPF | ✅ |
| Socket-level LB | `socketLB.enabled=true` | connect() 시점 LB 수행 | ✅ |
| XDP Acceleration | `loadBalancer.acceleration=native` | NIC 드라이버 수준 처리 | ❌ (ENA 호환성) |
| BBR | `bandwidthManager.bbr=true` | Google BBR 혼잡 제어 | ✅ |
| Native Routing | `routingMode=native` | VXLAN 제거 | ✅ |
| CT Table 확장 | `bpf.ctGlobalAnyMax`, `bpf.ctGlobalTCPMax` | Connection Tracking 확대 | ✅ |
| Hubble 비활성화 | `hubble.enabled=false` | 관찰성 오버헤드 제거 (벤치마크 전용) | ✅ |

:::warning XDP 및 DSR 호환성 제약
m6i.xlarge 인스턴스의 ENA 드라이버는 XDP `bpf_link` 기능을 지원하지 않아 XDP acceleration(native/best-effort)을 사용할 수 없습니다. DSR 모드 또한 Pod 크래시를 유발하여 기본 SNAT 모드로 회귀했습니다. 시나리오 E는 나머지 8개 튜닝을 적용한 결과입니다.
:::

---

## 아키텍처

### 패킷 경로 비교: VPC CNI vs Cilium

VPC CNI(kube-proxy)와 Cilium(eBPF)에서 Pod-to-Service 트래픽의 패킷 경로 차이를 비교합니다.

#### Cilium 아키텍처 개요

Cilium Daemon이 커널의 BPF 프로그램을 관리하며, 각 컨테이너와 네트워크 인터페이스(eth0)에 eBPF 프로그램을 주입합니다.

![Cilium Architecture](/img/benchmarks/cilium-arch.png)
*출처: [Cilium Component Overview](https://docs.cilium.io/en/stable/overview/component-overview.html)*

#### Cilium eBPF 패킷 경로

Pod-to-Pod 통신에서 eBPF 프로그램은 veth pair(lxc)에 부착되어 iptables를 완전히 우회합니다. 아래 다이어그램은 Endpoint 간 직접 통신 경로를 보여줍니다.

![Cilium eBPF Endpoint-to-Endpoint](/img/benchmarks/cilium_bpf_endpoint.svg)
*출처: [Cilium - Life of a Packet](https://docs.cilium.io/en/stable/network/ebpf/lifeofapacket.html)*

#### Cilium Native Routing (ENI 모드)

Native Routing 모드에서 Pod 트래픽은 VXLAN 캡슐화 없이 호스트의 라우팅 테이블을 통해 직접 전달됩니다. ENI 모드에서는 Pod IP가 VPC CIDR에서 직접 할당됩니다.

![Cilium Native Routing](/img/benchmarks/cilium_native_routing.png)
*출처: [Cilium Routing](https://docs.cilium.io/en/stable/network/concepts/routing.html)*

#### Cilium ENI IPAM 아키텍처

Cilium Operator가 EC2 API를 통해 ENI에서 IP를 할당하고, CiliumNode CRD를 통해 각 노드의 Agent에 IP Pool을 제공합니다.

![Cilium ENI Architecture](/img/benchmarks/cilium_eni_arch.png)
*출처: [Cilium ENI Mode](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)*

### 5개 시나리오별 데이터 플레인 스택

각 시나리오의 Service LB, CNI Agent, 네트워크 계층 구성과 주요 성능 지표를 비교합니다.

![데이터 플레인 스택 비교](/img/benchmarks/dataplane-stack-comparison.svg)

---

## 테스트 방법

### 테스트 워크로드

- **httpbin**: HTTP 에코 서버 (2 replicas)
- **Fortio**: HTTP 부하 생성기
- **iperf3**: 네트워크 처리량 측정 서버/클라이언트

### 측정 메트릭

1. **네트워크 성능**: TCP/UDP Throughput, Pod-to-Pod Latency (p50/p99), Connection Setup Rate
2. **HTTP 성능**: QPS별 처리량 및 지연 (Fortio → httpbin)
3. **DNS 성능**: 해석 지연 (p50/p99), QPS Capacity
4. **리소스 사용량**: CNI 자체 CPU/메모리 오버헤드
5. **튜닝 효과**: 개별 튜닝 포인트의 성능 기여도

### 벤치마크 실행

**전체 시나리오 일괄 실행**:
```bash
./scripts/benchmarks/cni-benchmark/run-all-scenarios.sh
```

**개별 시나리오 실행**:
```bash
./scripts/benchmarks/cni-benchmark/run-benchmark.sh <scenario-name>
```

상세 테스트 절차는 스크립트 내부 주석 참조.

---

## 벤치마크 결과

:::info 데이터 수집 완료
아래 결과는 2026-02-09 EKS 1.31 환경(m6i.xlarge, Amazon Linux 2023, 단일 AZ)에서 측정되었습니다. 각 메트릭은 최소 3회 반복 측정 후 중앙값을 사용했습니다.
:::

### 네트워크 성능

#### TCP/UDP 처리량

![TCP/UDP 처리량 비교](/img/benchmarks/chart-network-throughput.svg)

:::info UDP 처리량 차이 원인
TCP는 모든 시나리오에서 NIC 대역폭(12.5 Gbps)에 포화되어 차이가 없지만, UDP는 구성별로 뚜렷한 성능 차이가 발생합니다:

- **시나리오 A (VPC CNI)와 D (Cilium ENI 기본)**: UDP throughput ~10 Gbps이지만 **패킷 손실률 20%**. 이는 eBPF Bandwidth Manager가 비활성화되어 커널 네트워크 스택의 기본 UDP 버퍼가 iperf3의 고속 전송을 감당하지 못해 버퍼 오버플로우가 발생하기 때문입니다.
- **시나리오 B, C (Cilium Overlay)**: UDP throughput ~7.9 Gbps로 낮지만 **패킷 손실률 under 1%**. VXLAN 캡슐화의 오버헤드로 전체 처리량은 감소하지만, Cilium의 eBPF 기반 패킷 처리가 버퍼 관리를 최적화하여 손실을 크게 줄입니다.
- **시나리오 E (Cilium ENI+튜닝)**: UDP throughput ~8.0 Gbps이면서 **패킷 손실률 0.03%**. Bandwidth Manager(EDT 기반 rate limiting)와 BBR 혼잡 제어가 전송 속도를 수신자의 처리 능력에 맞춰 조절하여 버퍼 오버플로우를 방지합니다.

**핵심**: UDP 워크로드에서는 단순 throughput 수치보다 **패킷 손실률**이 실질적인 성능 지표입니다. 높은 throughput + 높은 손실률은 실제로는 더 낮은 유효 전송량을 의미합니다.
:::

#### Pod-to-Pod 지연

![Pod-to-Pod RTT 비교](/img/benchmarks/chart-latency-comparison.svg)

#### UDP 패킷 손실률

![UDP 패킷 손실률 비교](/img/benchmarks/chart-udp-loss.svg)

<details>
<summary>상세 데이터 테이블</summary>

| 메트릭 | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+튜닝 |
|--------|-----------|-------------|-----------|--------|------------|
| TCP Throughput (Gbps) | 12.41 | 12.34 | 12.34 | 12.41 | 12.40 |
| UDP Throughput (Gbps) | 10.00 | 7.92 | 7.92 | 10.00 | 7.96 |
| UDP Loss (%) | 20.39 | 0.94 | 0.69 | 20.42 | 0.03 |
| Pod-to-Pod RTT p50 (µs) | 4894 | 4955 | 5092 | 4453 | 3135 |
| Pod-to-Pod RTT p99 (µs) | 4894 | 4955 | 5092 | 4453 | 3135 |

:::note TCP Throughput 포화
m6i.xlarge의 기준 네트워크 대역폭은 12.5 Gbps입니다. 모든 시나리오에서 TCP throughput이 이 한계에 도달하여 CNI별 차이가 나타나지 않았습니다.
:::

</details>

### HTTP 애플리케이션 성능

![HTTP 애플리케이션 성능 비교](/img/benchmarks/chart-http-performance.svg)

<details>
<summary>상세 데이터 테이블</summary>

| QPS 목표 | 메트릭 | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+튜닝 |
|---------|--------|-----------|-------------|-----------|--------|------------|
| 1,000 | Actual QPS | 999.6 | 999.6 | 999.7 | 999.7 | 999.7 |
| 1,000 | p50 (ms) | 4.39 | 4.36 | 4.45 | 4.29 | 4.21 |
| 1,000 | p99 (ms) | 10.92 | 9.87 | 8.91 | 8.75 | 9.89 |
| 5,000 | Actual QPS | 4071.1 | 4012.0 | 3986.5 | 3992.6 | 4053.2 |
| 5,000 | p99 (ms) | 440.45 | 21.60 | 358.38 | 23.01 | 24.44 |
| Max | Actual QPS | 4103.9 | 4044.7 | 4019.3 | 4026.4 | 4181.9 |
| Max | p99 (ms) | 28.07 | 25.25 | 28.50 | 26.67 | 28.45 |

:::caution QPS=5000 이상 부하 시 변동성
시나리오 A와 C에서 QPS=5000 테스트 시 p99가 비정상적으로 높게 측정되었습니다(440ms, 358ms). 이는 일시적인 네트워크 혼잡으로 추정되며, Max QPS 테스트(~4000QPS 실측)에서는 정상 수준(25-28ms)으로 회귀했습니다. 재현성 있는 비교를 위해 QPS=1000 결과를 주요 지표로 사용하는 것을 권장합니다.
:::

</details>

### 서비스 수 확장에 따른 성능 영향 (Scenario E)

Cilium eBPF의 O(1) 서비스 룩업 성능을 검증하기 위해, 동일한 Scenario E 환경에서 서비스 수를 4개 → 104개로 변경한 후 성능을 비교했습니다.

![Service Scaling Impact](/img/benchmarks/chart-service-scaling.svg)

<details>
<summary>상세 데이터 테이블</summary>

| 메트릭 | 4 Services | 104 Services | 차이 |
|--------|-----------|-------------|------|
| HTTP p99 @QPS=1000 (ms) | 3.94 | 3.64 | -8% (측정 오차 범위) |
| 최대 달성 QPS | 4,405 | 4,221 | -4.2% |
| TCP Throughput (Gbps) | 12.3 | 12.4 | ~동일 |
| DNS Resolution p50 (ms) | 2 | 2 | 동일 |

</details>

:::info eBPF O(1) 서비스 룩업 확인
Cilium eBPF 환경에서 서비스 수를 4개에서 104개로 26배 증가시켰음에도 모든 메트릭이 측정 오차 범위(5% 이내)에서 동일했습니다. 이는 eBPF의 해시 맵 기반 O(1) 룩업이 서비스 수에 무관하게 일정한 성능을 유지함을 확인합니다. 반면, kube-proxy(iptables)는 서비스 수에 비례하여 규칙 체인을 순회하는 O(n) 특성을 가지며, 500개 이상의 서비스에서 유의미한 성능 저하가 발생합니다.
:::

### DNS 해석 성능

| 메트릭 | A: VPC CNI | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+튜닝 |
|--------|-----------|-------------|-----------|--------|------------|
| DNS Resolution p50 (ms) | 2 | 2 | 2 | 2 | 2 |
| DNS Resolution p99 (ms) | 4 | 4 | 2 | 4 | 3 |

:::info DNS 성능 차이 미미
모든 시나리오에서 DNS 해석 지연은 2-4ms 범위로 CNI 구성에 관계없이 거의 동일합니다. kube-proxy-less 모드(시나리오 C)에서 p99가 약간 낮은 것(2ms)이 유일한 차이점입니다.
:::

### 리소스 사용량

| 메트릭 | A: VPC CNI (aws-node) | B: Cilium+kp | C: kp-less | D: ENI | E: ENI+튜닝 |
|--------|---------------------|-------------|-----------|--------|------------|
| CPU (벤치마크 부하, per node) | 미측정 | ~4-6m | ~4-6m | ~5-6m | ~4-5m |
| Memory (벤치마크 부하, per node) | 미측정 | ~83Mi | ~129Mi | ~81Mi | ~82Mi |

:::note 리소스 오버헤드 해석
Cilium 에이전트의 리소스 사용량은 벤치마크 부하(iperf3, Fortio) 하에서 측정되었으며, 프로덕션 환경에서는 클러스터 규모(Pod/Service 수, 정책 수)에 따라 증가할 수 있습니다. VPC CNI aws-node 데몬셋은 별도 측정하지 않았습니다. 시나리오 C(kp-less)의 메모리 사용량이 높은 이유는 kube-proxy 대체 시 eBPF 맵에 Service endpoint 상태를 추가로 유지하기 때문입니다.
:::

### 튜닝 포인트별 영향도

:::warning 개별 튜닝 효과 미측정
본 벤치마크는 시나리오 E에서 모든 튜닝을 동시 적용한 **누적 효과**를 측정했습니다. 각 튜닝 옵션을 개별 적용하여 단독 기여도를 측정하는 작업은 수행하지 않았습니다. 시나리오 E의 전체 성능 개선(RTT 36%, p99 20%)은 8개 튜닝의 복합 결과입니다.
:::

**시나리오 E에서 적용된 튜닝**:
- ✅ Socket-level LB, BPF Host Routing, BPF Masquerade, Bandwidth Manager, BBR, Native Routing, CT Table 확장, Hubble 비활성화
- ❌ XDP Acceleration, DSR (ENA 드라이버 호환성 제약으로 미적용)

**ENA 드라이버 XDP 제약사항**:
m6i.xlarge의 ENA 드라이버는 `bpf_link` 기능을 지원하지 않아 XDP native 및 best-effort 모드 모두 실패합니다. DSR 모드 또한 Pod 크래시를 유발하여 SNAT 모드로 회귀했습니다. 향후 NIC 드라이버 업데이트 시 재시도가 필요합니다.

---

## 분석 및 권장사항

![주요 발견사항 요약](/img/benchmarks/chart-key-findings.svg)

![워크로드별 권장 CNI 구성](/img/benchmarks/chart-recommendation-matrix.svg)

<details>
<summary>상세 분석 보기</summary>

### 주요 발견사항

#### 1. TCP Throughput은 NIC 대역폭에 포화

m6i.xlarge의 네트워크 기준 대역폭은 12.5 Gbps입니다. 모든 시나리오에서 TCP throughput이 12.34-12.41 Gbps로 측정되어 CNI 구성에 관계없이 NIC 한계에 도달했습니다. **TCP throughput은 CNI 성능을 비교하는 유의미한 지표가 아닙니다.**

#### 2. UDP Loss가 가장 큰 차이점

| 시나리오 | UDP Loss | 이유 |
|---------|----------|------|
| A (VPC CNI) | 20.39% | Native ENI, eBPF rate limiting 없음 |
| B (Cilium+kp) | 0.94% | eBPF Bandwidth Manager 효과 |
| C (kp-less) | 0.69% | eBPF Bandwidth Manager 효과 |
| D (ENI) | 20.42% | Native ENI + eBPF, 하지만 튜닝 미적용 |
| E (ENI+튜닝) | 0.03% | Bandwidth Manager + BBR 최적화 |

**핵심 인사이트**: Cilium의 eBPF Bandwidth Manager는 EDT 기반 rate limiting을 수행하여 UDP 패킷 드랍을 극적으로 감소시킵니다. VPC CNI와 기본 Cilium ENI 모드(시나리오 D)는 이 기능이 비활성화되어 20% 손실을 보입니다.

#### 3. RTT 지연 개선

시나리오 E(ENI+튜닝)는 VPC CNI 대비 **RTT를 36% 개선**(4894µs → 3135µs)했습니다. 주요 기여 요인:
- Socket-level LB (connect() 시점 직접 연결)
- BPF Host Routing (호스트 NS iptables bypass)
- Native Routing (VXLAN encap/decap 제거)

#### 4. kube-proxy 제거의 효과

시나리오 B(Cilium+kube-proxy) vs C(kp-less)를 비교하면 kube-proxy 제거의 직접적 영향을 볼 수 있습니다:
- **TCP/UDP throughput**: 차이 없음 (동일)
- **RTT**: 오히려 약간 증가 (4955 → 5092µs, 3% 악화)
- **HTTP p99@1000**: 개선 (9.87 → 8.91ms, 10% 개선)
- **DNS p99**: 개선 (4 → 2ms, 50% 개선)

**해석**: 소규모 클러스터(Service 100개 미만)에서는 kube-proxy 제거의 성능 이득이 미미합니다. iptables의 O(n) 룩업 오버헤드는 규모가 커질수록(Service 500개 이상) 지배적이 됩니다. 본 테스트는 최소 워크로드 환경이므로 차이가 작았습니다.

#### 5. ENI 모드 vs Overlay 모드

시나리오 C(kp-less, VXLAN) vs D(ENI, Native Routing) 비교:

| 메트릭 | C (VXLAN) | D (ENI) | 변화 |
|--------|-----------|---------|------|
| TCP Throughput | 12.34 Gbps | 12.41 Gbps | +0.6% (무시 가능) |
| RTT | 5092 µs | 4453 µs | -12.5% (개선) |
| HTTP p99@1000 | 8.91 ms | 8.75 ms | -1.8% (개선) |
| UDP Loss | 0.69% | 20.42% | +2900% (악화, 튜닝 미적용) |

**핵심 인사이트**:
- VXLAN encap/decap의 CPU 오버헤드는 RTT에서 12% 차이를 만듭니다(~640µs 추가 지연).
- TCP throughput은 NIC 포화로 차이 없음.
- ENI 모드는 VPC CIDR에서 직접 IP를 할당하므로 **IP 주소 공간 요구사항**이 증가합니다. IP 제약 환경에서는 Overlay 모드가 더 적합할 수 있습니다.

#### 6. 튜닝 적용의 누적 효과

시나리오 D(ENI 기본) → E(ENI+튜닝) 전환의 복합 효과:

| 메트릭 | D (ENI) | E (ENI+튜닝) | 변화 |
|--------|---------|-------------|------|
| RTT | 4453 µs | 3135 µs | -30% (개선) |
| UDP Loss | 20.42% | 0.03% | -99.9% (극적 개선) |
| HTTP QPS@max | 4026 | 4182 | +3.9% (개선) |
| HTTP p99@1000 | 8.75 ms | 9.89 ms | +13% (약간 악화) |

**가장 영향력 있는 튜닝 (추정)**:
1. **Bandwidth Manager + BBR**: UDP loss를 20% → 0.03%로 극적 개선
2. **Socket LB**: connect() 시점 직접 연결로 RTT 단축
3. **BPF Host Routing**: 호스트 NS iptables bypass

**XDP와 DSR 미적용 영향**: ENA 드라이버 제약으로 XDP와 DSR을 적용하지 못했습니다. 이들이 적용되었다면 추가 10-20% 성능 향상이 기대되었으나 현재 환경에서는 검증 불가합니다.

### 워크로드별 권장 구성

| 워크로드 특성 | 권장 시나리오 | 이유 |
|-------------|-------------|------|
| 소규모, 단순 (Service 100개 미만) | A: VPC CNI 기본 | 운영 복잡도 최소, 충분한 성능 |
| UDP 스트리밍, 비디오 | E: Cilium ENI+튜닝 | UDP loss 0.03% (VPC CNI 대비 680배 개선) |
| 네트워크 정책 필요 | C 또는 D | L3/L4/L7 정책 + eBPF 성능 |
| 고성능, 대규모 (Service 500개 이상) | D: Cilium ENI | 네이티브 라우팅 + kube-proxy 제거 |
| 지연 민감 (금융, 실시간) | E: Cilium ENI+튜닝 | RTT 36% 개선, p99 최소화 |
| IP 주소 제약 환경 | C: Cilium kp-less | VXLAN Overlay로 IP 소비 최소화 |
| 멀티테넌트, 관찰성 중시 | D + Hubble 활성화 | ENI 성능 + 네트워크 가시성 |

### 시나리오별 최종 평가

| 환경 | 권장 시나리오 | 운영 복잡도 | 성능 | 주요 개선 포인트 |
|------|-------------|-----------|------|-----------------|
| 개발/스테이징 | A: VPC CNI | 낮음 | 기준선 | 기본 설정, 학습 곡선 없음 |
| 일반 프로덕션 | D: Cilium ENI | 중간 | 높음 | RTT -9%, kube-proxy 제거 |
| UDP 집약 워크로드 | E: Cilium ENI+튜닝 | 높음 | 최고 | UDP loss 680배 개선 (20% → 0.03%) |
| 지연 민감 워크로드 | E: Cilium ENI+튜닝 | 높음 | 최고 | RTT -36% (4894 → 3135µs) |
| 네트워크 정책 필수 | C 또는 D | 중간 | 높음 | L3/L4/L7 정책 + eBPF |
| IP 주소 제약 환경 | C: kp-less | 중간 | 보통 | VXLAN로 IP 소비 최소화 |

</details>

:::tip XDP 지원 확인
XDP Acceleration과 DSR을 활용하려면 인스턴스 타입의 NIC 드라이버가 `bpf_link` 기능을 지원하는지 확인하세요. m6i.xlarge의 ENA 드라이버는 현재 미지원입니다. 향후 드라이버 업데이트 또는 다른 인스턴스 타입(C6i, C7i 등) 고려 시 재검증이 필요합니다.
:::

---

## 구성 시 주의사항

벤치마크 환경 구성 과정에서 발견된 이슈와 해결 방법을 정리합니다. Cilium을 EKS에 도입하거나 벤치마크를 재현할 때 참고하세요.

### eksctl 클러스터 생성

- **최소 2개 AZ 필요**: eksctl은 `availabilityZones`에 최소 2개 AZ를 요구합니다. 단일 AZ 노드그룹을 원해도 클러스터 수준에서는 2개 이상의 AZ를 지정해야 합니다.
  ```yaml
  # 클러스터 수준: 2개 AZ 필수
  availabilityZones:
    - ap-northeast-2a
    - ap-northeast-2c
  # 노드그룹 수준: 단일 AZ 가능
  managedNodeGroups:
    - availabilityZones: [ap-northeast-2a]
  ```

### Cilium Helm 차트 호환성

- **`tunnel` 옵션 제거됨** (Cilium 1.15+): `--set tunnel=vxlan` 또는 `--set tunnel=disabled`는 더 이상 유효하지 않습니다. 대신 `routingMode`와 `tunnelProtocol`을 사용하세요.
  ```bash
  # 이전 (Cilium 1.14 이하)
  --set tunnel=vxlan

  # 현재 (Cilium 1.15+)
  --set routingMode=tunnel --set tunnelProtocol=vxlan

  # Native Routing (ENI 모드)
  --set routingMode=native
  ```

### XDP 가속 사용 조건

XDP(eXpress Data Path)는 NIC 드라이버 수준에서 패킷을 처리하여 커널 네트워크 스택을 우회합니다. Cilium에서 XDP를 사용하려면 다음 조건을 모두 충족해야 합니다.

#### 필수 요구사항

| 요구사항 | 조건 | 비고 |
|---------|------|------|
| Linux Kernel | >= 5.10 (Cilium 기본 요구사항) | `bpf_link` 지원은 >= 5.7 |
| NIC 드라이버 | XDP Native 지원 드라이버 | 아래 드라이버 호환성 참조 |
| Cilium 설정 | `kubeProxyReplacement=true` | kube-proxy 대체 필수 |
| 인터페이스 | 물리 NIC (bond/VLAN 미지원) | Bond, VLAN 인터페이스 불가 |

#### NIC 드라이버 XDP 호환성

| 드라이버 | XDP Native | 최소 커널 | 환경 | 비고 |
|---------|-----------|---------|------|------|
| **mlx5** (Mellanox ConnectX-4/5/6) | ✅ 완전 지원 | >= 4.9 | Bare Metal, 온프레미스 | 최고 성능, 권장 |
| **i40e** (Intel XL710/X710) | ✅ 완전 지원 | >= 4.12 | Bare Metal | 안정적 |
| **ixgbe** (Intel 82599/X540) | ✅ 완전 지원 | >= 4.12 | Bare Metal | 10GbE |
| **bnxt_en** (Broadcom) | ✅ 지원 | >= 4.11 | Bare Metal | - |
| **ena** (AWS ENA) | ⚠️ 제한적 | >= 5.6 | AWS EC2 | 아래 AWS 제약 참조 |
| **virtio-net** | ⚠️ Generic만 | >= 4.10 | KVM/QEMU | Native 미지원 |

#### AWS EC2 인스턴스별 XDP 지원

| 인스턴스 유형 | XDP Native | 이유 |
|-------------|-----------|------|
| **Bare Metal** (c5.metal, m6i.metal, r6i.metal 등) | ✅ 지원 | 하드웨어 직접 접근, ENA 드라이버 전체 기능 사용 |
| **가상화 인스턴스** (m6i.xlarge, c6i.2xlarge 등) | ❌ 미지원 | ENA 드라이버의 `bpf_link` XDP 미구현 |
| **ENA Express** (c6in, m6in, r6in 등) | ❌ 미지원 | ENA Express는 SRD 프로토콜(대역폭 개선)이며 XDP와 무관 |
| **Graviton** (m7g, c7g 등) | ❌ 미지원 | 동일한 ENA 드라이버 제약 (ARM/x86 무관) |

:::warning AWS 가상화 인스턴스에서 XDP 사용 불가
본 벤치마크에서 m6i.xlarge 인스턴스에서 `loadBalancer.acceleration=native` 및 `best-effort` 모두 실패했습니다:
```
attaching program cil_xdp_entry using bpf_link: create link: invalid argument
```
이는 ENA 드라이버가 가상화 환경에서 `bpf_link` 기반 XDP 부착을 지원하지 않기 때문입니다. 이 제약은 모든 가상화 EC2 인스턴스(x86, ARM 무관)에 동일하게 적용됩니다.
:::

#### DSR (Direct Server Return) 호환성

- `loadBalancer.mode=dsr` 설정 시 Cilium Agent Pod 크래시 발생 가능
- AWS ENA 환경에서는 `mode=snat` (기본값) 권장
- DSR은 XDP가 정상 동작하는 환경(Bare Metal + mlx5/i40e 등)에서만 안정적

#### XDP 없이 달성 가능한 최적화

본 벤치마크에서 XDP와 DSR 없이도 다음 튜닝으로 **RTT 36% 개선** (4453→3135 µs)을 달성했습니다:

| 튜닝 항목 | 효과 |
|-----------|------|
| Socket-level LB | connect() 시점 직접 연결, 패킷당 NAT 불필요 |
| BPF Host Routing | 호스트 iptables 완전 우회 |
| BPF Masquerade | iptables MASQUERADE → eBPF 대체 |
| Bandwidth Manager + BBR | EDT 기반 rate limiting + BBR 혼잡 제어 |
| Native Routing (ENI) | VXLAN 캡슐화 제거 |

:::tip XDP 지원 여부 확인
```bash
# Cilium XDP 활성화 상태 확인
kubectl -n kube-system exec ds/cilium -- cilium-dbg status | grep XDP
# "Disabled" 표시 시 해당 인스턴스에서 XDP 미지원

# NIC 드라이버 확인
ethtool -i eth0 | grep driver
```
:::

### 워크로드 배포

- **Fortio 컨테이너 이미지 제약**: `fortio/fortio` 이미지에는 `sleep`, `sh`, `nslookup` 바이너리가 없습니다. Idle 대기 시 `sleep infinity` 대신 Fortio 자체 서버 모드를 사용하세요.
  ```yaml
  command: ["fortio", "server", "-http-port", "8080"]
  ```
- **DNS 테스트용 Pod 선택**: DNS 해석 테스트는 `sh`가 포함된 이미지(예: iperf3)에서 `getent hosts`를 사용하세요. `nslookup`은 별도 설치가 필요합니다.

### CNI 전환 시 Pod 재시작

- **Rolling Update 시 CPU 부족**: VPC CNI → Cilium 전환 후 워크로드를 재시작할 때, Rolling Update 전략은 Pod 수를 일시적으로 2배로 늘립니다. 소규모 노드에서 CPU 부족이 발생할 수 있습니다.
  ```bash
  # 안전한 재시작 방법: 기존 Pod 삭제 후 재생성
  kubectl delete pods -n bench --all
  kubectl rollout status -n bench deployment --timeout=120s
  ```
- **Cilium DaemonSet 재시작**: Cilium Helm 값 변경 후 DaemonSet이 자동 재시작되지 않으면 수동으로 트리거하세요.
  ```bash
  kubectl -n kube-system rollout restart daemonset/cilium
  kubectl -n kube-system rollout status daemonset/cilium --timeout=300s
  ```

### AWS 인증

- **SSO 토큰 만료**: 장시간 벤치마크 실행 중 AWS SSO 토큰이 만료될 수 있습니다. 실행 전 토큰 유효 시간을 확인하거나, `aws sso login`으로 갱신하세요.

---

## 참고: VPC CNI vs Cilium 네트워크 정책 비교

EKS에서 VPC CNI와 Cilium 모두 네트워크 정책을 지원하지만, 지원 범위와 기능에 큰 차이가 있습니다.

| 기능 | VPC CNI (EKS Network Policy) | Cilium |
|------|----------------------------|--------|
| **Kubernetes NetworkPolicy API** | ✅ 지원 | ✅ 지원 |
| **L3/L4 필터링** (IP, Port, Protocol) | ✅ 지원 | ✅ 지원 |
| **L7 필터링** (HTTP path/method, gRPC, Kafka) | ❌ 미지원 | ✅ CiliumNetworkPolicy CRD |
| **FQDN 기반 정책** (DNS 도메인 허용/차단) | ❌ 미지원 | ✅ `toFQDNs` 규칙 |
| **Identity 기반 매칭** | ❌ IP 기반 | ✅ Cilium Identity (eBPF, O(1)) |
| **Cluster-wide 정책** | ❌ Namespace 단위만 | ✅ CiliumClusterwideNetworkPolicy |
| **Host-level 정책** | ❌ Pod 트래픽만 | ✅ 호스트 트래픽도 제어 |
| **정책 시행 가시성** | CloudWatch Logs (제한적) | ✅ Hubble (실시간 flow + verdict) |
| **정책 편집기/UI** | ❌ | ✅ Cilium Network Policy Editor |
| **구현 방식** | eBPF (AWS network policy agent) | eBPF (Cilium agent) |
| **성능 영향** | 낮음 | 낮음 (eBPF 기반 동일) |

### 주요 차이점

**L7 정책 (Cilium 전용)**: HTTP 요청의 경로, 메서드, 헤더 수준에서 필터링이 가능합니다. 예를 들어 `GET /api/public`은 허용하고 `DELETE /api/admin`은 차단하는 정책을 설정할 수 있습니다.

```yaml
# Cilium L7 정책 예시
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-get-only
spec:
  endpointSelector:
    matchLabels:
      app: api-server
  ingress:
  - fromEndpoints:
    - matchLabels:
        role: frontend
    toPorts:
    - ports:
      - port: "80"
        protocol: TCP
      rules:
        http:
        - method: GET
          path: "/api/public.*"
```

**FQDN 기반 정책 (Cilium 전용)**: 외부 도메인에 대한 접근을 DNS 이름으로 제어할 수 있습니다. IP가 변경되어도 정책이 자동으로 업데이트됩니다.

```yaml
# 특정 AWS 서비스만 허용
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-aws-only
spec:
  endpointSelector:
    matchLabels:
      app: backend
  egress:
  - toFQDNs:
    - matchPattern: "*.amazonaws.com"
    - matchPattern: "*.eks.amazonaws.com"
```

**정책 시행 가시성**: Cilium의 Hubble은 모든 네트워크 흐름에 대해 정책 판정(ALLOWED/DENIED)을 실시간으로 표시합니다. VPC CNI는 CloudWatch Logs를 통해 제한적인 로깅만 제공합니다.

:::tip 선택 가이드
- **기본 L3/L4 정책만 필요**: VPC CNI의 EKS Network Policy로 충분합니다.
- **L7 필터링, FQDN 정책, 실시간 가시성 필요**: Cilium이 유일한 선택지입니다.
- **멀티테넌트 환경**: Cilium의 CiliumClusterwideNetworkPolicy와 Host-level 정책이 강력합니다.
:::

---

## 참고 자료

- [Cilium Performance Tuning Guide](https://docs.cilium.io/en/stable/operations/performance/tuning/)
- [Cilium ENI Mode Documentation](https://docs.cilium.io/en/stable/network/concepts/ipam/eni/)
- [AWS EKS Networking Best Practices](https://aws.github.io/aws-eks-best-practices/networking/)
- [Cilium kube-proxy Replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [eBPF & XDP Reference](https://docs.cilium.io/en/stable/bpf/)
- [Fortio - HTTP Load Testing](https://fortio.org/)
- [인프라 성능 벤치마크](./infrastructure-performance.md) — 네트워크, DNS, 오토스케일링 전체 벤치마크
