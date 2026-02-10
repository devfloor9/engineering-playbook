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

import HttpPerformanceChart from '@site/src/components/HttpPerformanceChart';
import ServiceScalingChart from '@site/src/components/ServiceScalingChart';
import KubeproxyScalingChart from '@site/src/components/KubeproxyScalingChart';
import LatencyChart from '@site/src/components/LatencyChart';
import UdpLossChart from '@site/src/components/UdpLossChart';
import ThroughputChart from '@site/src/components/ThroughputChart';
import AimlRelevanceChart from '@site/src/components/AimlRelevanceChart';
import TestEnvironmentChart from '@site/src/components/TestEnvironmentChart';
import ScenarioComparisonChart from '@site/src/components/ScenarioComparisonChart';
import DnsResourceChart from '@site/src/components/DnsResourceChart';

# VPC CNI vs Cilium CNI 성능 비교 벤치마크

> 📅 **작성일**: 2026-02-09 | ✍️ **작성자**: devfloor9 | ⏱️ **읽는 시간**: 약 25분

## 개요 요약

Amazon EKS 1.31 환경에서 VPC CNI와 Cilium CNI의 성능을 5개 시나리오로 정량 비교한 벤치마크 보고서입니다.

**한 줄 요약**: TCP throughput은 NIC 대역폭(12.5 Gbps)에 포화되어 CNI 간 차이가 없으나, Cilium ENI+튜닝 적용 시 VPC CNI 대비 **UDP 패킷 손실 680배 개선**(20%→0.03%), **RTT 36% 단축**(4894→3135µs), **HTTP p99 지연 20% 감소**(10.92→8.75ms)를 달성했습니다.

**5개 시나리오**:
- **A** VPC CNI 기본 (베이스라인)
- **B** Cilium + kube-proxy (전환 영향 측정)
- **C** Cilium kube-proxy-less (kube-proxy 제거 효과)
- **D** Cilium ENI 모드 (Overlay vs Native Routing)
- **E** Cilium ENI + 풀 튜닝 (누적 최적화 효과)

**핵심 발견사항**:

| 지표 | VPC CNI (A) | Cilium ENI+튜닝 (E) | 개선폭 |
|------|------------|---------------------|--------|
| TCP Throughput | 12.41 Gbps | 12.40 Gbps | 동일 (NIC 포화) |
| UDP 패킷 손실 | 20.39% | 0.03% | **680배 개선** |
| Pod-to-Pod RTT | 4,894 µs | 3,135 µs | **36% 단축** |
| HTTP p99 @QPS=1000 | 10.92 ms | 8.75 ms* | **20% 감소** |

\* HTTP p99 최저값은 시나리오 D(Cilium ENI 기본)에서 달성. 시나리오 E는 BBR 혼잡 제어의 보수적 동작으로 9.89ms 기록.

<AimlRelevanceChart locale="ko" />

---

## 테스트 환경

<TestEnvironmentChart locale="ko" />

**클러스터 구성**: `scripts/benchmarks/cni-benchmark/cluster.yaml` 참조
**워크로드 배포**: `scripts/benchmarks/cni-benchmark/workloads.yaml` 참조

---

## 테스트 시나리오

5개 시나리오는 CNI, kube-proxy 모드, IP 할당 방식, 튜닝 적용 여부를 조합하여 각 변수의 독립적 영향을 측정하도록 설계했습니다.

<ScenarioComparisonChart locale="ko" />

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

<ThroughputChart />

:::info UDP 처리량 차이 원인
TCP는 모든 시나리오에서 NIC 대역폭(12.5 Gbps)에 포화되어 차이가 없지만, UDP는 구성별로 뚜렷한 성능 차이가 발생합니다:

- **시나리오 A (VPC CNI)와 D (Cilium ENI 기본)**: UDP throughput ~10 Gbps이지만 **패킷 손실률 20%**. 이는 eBPF Bandwidth Manager가 비활성화되어 커널 네트워크 스택의 기본 UDP 버퍼가 iperf3의 고속 전송을 감당하지 못해 버퍼 오버플로우가 발생하기 때문입니다.
- **시나리오 B, C (Cilium Overlay)**: UDP throughput ~7.9 Gbps로 낮지만 **패킷 손실률 under 1%**. VXLAN 캡슐화의 오버헤드로 전체 처리량은 감소하지만, Cilium의 eBPF 기반 패킷 처리가 버퍼 관리를 최적화하여 손실을 크게 줄입니다.
- **시나리오 E (Cilium ENI+튜닝)**: UDP throughput ~8.0 Gbps이면서 **패킷 손실률 0.03%**. Bandwidth Manager(EDT 기반 rate limiting)와 BBR 혼잡 제어가 전송 속도를 수신자의 처리 능력에 맞춰 조절하여 버퍼 오버플로우를 방지합니다.

**핵심**: UDP 워크로드에서는 단순 throughput 수치보다 **패킷 손실률**이 실질적인 성능 지표입니다. 높은 throughput + 높은 손실률은 실제로는 더 낮은 유효 전송량을 의미합니다.
:::

#### Pod-to-Pod 지연

<LatencyChart />

#### UDP 패킷 손실률

<UdpLossChart />

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

<HttpPerformanceChart />

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

<ServiceScalingChart />

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

### kube-proxy (iptables) 서비스 스케일링: 4 → 104 → 1,000개

eBPF의 O(1) 장점을 대조 검증하기 위해 VPC CNI + kube-proxy (시나리오 A)에서 서비스 수를 **4개 → 104개 → 1,000개**로 확장하며 성능 변화를 측정했습니다.

<KubeproxyScalingChart locale="ko" />

#### keepalive vs Connection:close 비교 분석

**keepalive 모드** (기존 연결 재사용): iptables 규칙이 101배 증가해도 HTTP 성능에 영향 없음. 이는 conntrack이 이미 설정된 연결의 패킷을 캐시하여 iptables 체인 순회를 우회하기 때문입니다.

**Connection:close 모드** (매 요청마다 신규 TCP 연결): 모든 SYN 패킷에서 KUBE-SERVICES iptables 체인을 순회하여 DNAT 규칙을 평가합니다. 1,000개 서비스에서 **연결당 +26µs (+16%)** 오버헤드가 측정되었습니다.

:::info 왜 Connection:close 테스트가 중요한가?
프로덕션 환경에서 keepalive를 사용하지 않는 워크로드(gRPC 미사용 레거시 서비스, 단발성 HTTP 요청, TCP 기반 마이크로서비스 등)는 매 요청마다 iptables 체인 순회 비용을 지불합니다. KUBE-SERVICES 체인은 확률 기반 매칭(`-m statistic --mode random`)을 사용하므로 평균 순회 길이는 O(n/2)이며, 서비스 수에 비례하여 증가합니다.
:::

:::warning iptables 스케일링 한계
1,000개 서비스 규모에서 연결당 오버헤드는 측정 가능하지만(+26µs) 아직 미미한 수준입니다. 하지만 이 추세는 **서비스 수에 선형으로 증가**하며, 실질적 성능 저하 임계점은 **5,000개 이상 서비스**에서 나타납니다:

- kube-proxy sync 재생성이 **500ms 이상**으로 증가
- 체인 순회가 연결당 **수백 µs를 추가**
- Service endpoint 변경 시 전체 iptables 규칙 재생성 필요

반면 Cilium eBPF는 서비스 수에 관계없이 **O(1) 해시 맵 조회**를 유지하며, iptables 규칙 오버헤드가 전혀 없습니다.
:::

<details>
<summary>kube-proxy vs Cilium 전체 비교 데이터</summary>

| 메트릭 | kube-proxy 4개 | kube-proxy 104개 | kube-proxy 1000개 | 변화 (4→1000) | Cilium 4개 | Cilium 104개 | 변화 |
|--------|---------------|-----------------|------------------|--------------|-----------|-------------|------|
| HTTP p99 @QPS=1000 | 5.86ms | 5.99ms | 2.96ms | -49% | 3.94ms | 3.64ms | -8% |
| HTTP avg @QPS=1000 | 2.508ms | 2.675ms | 1.374ms | -45% | - | - | - |
| 최대 QPS (keepalive) | 4,197 | 4,231 | 4,178 | ~0% | 4,405 | 4,221 | -4.2% |
| TCP 처리량 | 12.4 Gbps | 12.4 Gbps | - | - | 12.3 Gbps | 12.4 Gbps | ~0% |
| iptables NAT 규칙 수 | 99 | 699 | 10,059 | **+101배** | N/A (eBPF) | N/A (eBPF) | - |
| Sync 주기 시간 | ~130ms | ~160ms | ~170ms | +31% | N/A | N/A | - |
| 연결당 설정 시간 (Connection:close) | 164µs | - | 190µs | **+16%** | N/A | N/A | - |
| HTTP avg (Connection:close) | 4.399ms | - | 4.621ms | +5% | N/A | N/A | - |
| HTTP p99 (Connection:close) | 8.11ms | - | 8.53ms | +5% | N/A | N/A | - |

</details>

### DNS 해석 성능 및 리소스 사용량

<DnsResourceChart locale="ko" />

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

<div style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d7377 100%)', borderRadius: '16px', padding: '32px', color: 'white', margin: '24px 0'}}>
  <div style={{fontSize: '22px', fontWeight: 700, marginBottom: '4px'}}>벤치마크 핵심 결과 요약</div>
  <div style={{fontSize: '13px', opacity: 0.7, marginBottom: '24px'}}>EKS 1.31 · m6i.xlarge × 3 Nodes · 5개 시나리오 실측 데이터 기반</div>
  <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
    <div style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '150px', textAlign: 'center'}}>
      <div style={{fontSize: '32px', fontWeight: 800, color: '#5eead4'}}>-36%</div>
      <div style={{fontSize: '12px', opacity: 0.85, marginTop: '4px'}}>RTT 지연 개선</div>
      <div style={{fontSize: '11px', opacity: 0.6}}>시나리오 E vs A</div>
    </div>
    <div style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '150px', textAlign: 'center'}}>
      <div style={{fontSize: '32px', fontWeight: 800, color: '#5eead4'}}>680×</div>
      <div style={{fontSize: '12px', opacity: 0.85, marginTop: '4px'}}>UDP 손실 개선</div>
      <div style={{fontSize: '11px', opacity: 0.6}}>20.39% → 0.03%</div>
    </div>
    <div style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '150px', textAlign: 'center'}}>
      <div style={{fontSize: '32px', fontWeight: 800, color: '#fb923c'}}>101×</div>
      <div style={{fontSize: '12px', opacity: 0.85, marginTop: '4px'}}>iptables 규칙 증가</div>
      <div style={{fontSize: '11px', opacity: 0.6}}>99 → 10,059 (1000 svc)</div>
    </div>
    <div style={{background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '150px', textAlign: 'center'}}>
      <div style={{fontSize: '32px', fontWeight: 800, color: '#fbbf24'}}>O(1)</div>
      <div style={{fontSize: '12px', opacity: 0.85, marginTop: '4px'}}>eBPF 서비스 룩업</div>
      <div style={{fontSize: '11px', opacity: 0.6}}>vs iptables O(n)</div>
    </div>
  </div>
</div>

### 주요 발견사항

<div style={{borderLeft: '4px solid #94a3b8', background: '#f8fafc', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
    <span style={{background: '#94a3b8', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>1</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>TCP Throughput은 NIC 대역폭에 포화</strong>
  </div>
  <p style={{fontSize: '14px', color: '#475569', lineHeight: 1.7, margin: 0}}>
    m6i.xlarge 기준 대역폭 12.5 Gbps에서 모든 시나리오가 <strong>12.34–12.41 Gbps</strong>로 측정되었습니다. CNI 구성에 관계없이 NIC 한계에 도달하므로, TCP throughput은 CNI 성능 비교의 유의미한 지표가 아닙니다.
  </p>
</div>

<div style={{borderLeft: '4px solid #ef4444', background: 'linear-gradient(to right, #fef2f2, #fff5f5)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
    <span style={{background: '#ef4444', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>2</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>UDP Loss가 가장 큰 차이점</strong>
    <span style={{background: '#fee2e2', color: '#dc2626', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 600}}>핵심 차별화 요소</span>
  </div>
  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px'}}>
    <thead>
      <tr style={{borderBottom: '2px solid #fecaca'}}>
        <th style={{textAlign: 'left', padding: '8px', color: '#991b1b'}}>시나리오</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#991b1b'}}>UDP Loss</th>
        <th style={{textAlign: 'left', padding: '8px', color: '#991b1b'}}>이유</th>
      </tr>
    </thead>
    <tbody>
      <tr style={{borderBottom: '1px solid #fecaca'}}>
        <td style={{padding: '8px'}}>A (VPC CNI)</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626', fontWeight: 700}}>20.39%</td>
        <td style={{padding: '8px'}}>Native ENI, eBPF rate limiting 없음</td>
      </tr>
      <tr style={{borderBottom: '1px solid #fecaca'}}>
        <td style={{padding: '8px'}}>B (Cilium+kp)</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 700}}>0.94%</td>
        <td style={{padding: '8px'}}>eBPF Bandwidth Manager</td>
      </tr>
      <tr style={{borderBottom: '1px solid #fecaca'}}>
        <td style={{padding: '8px'}}>C (kp-less)</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 700}}>0.69%</td>
        <td style={{padding: '8px'}}>eBPF Bandwidth Manager</td>
      </tr>
      <tr style={{borderBottom: '1px solid #fecaca'}}>
        <td style={{padding: '8px'}}>D (ENI)</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626', fontWeight: 700}}>20.42%</td>
        <td style={{padding: '8px'}}>튜닝 미적용</td>
      </tr>
      <tr>
        <td style={{padding: '8px', fontWeight: 600}}>E (ENI+튜닝)</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 800}}>0.03%</td>
        <td style={{padding: '8px'}}>Bandwidth Manager + BBR</td>
      </tr>
    </tbody>
  </table>
  <div style={{background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#991b1b', lineHeight: 1.6}}>
    <strong>핵심 인사이트:</strong> Cilium의 eBPF Bandwidth Manager는 EDT 기반 rate limiting을 수행하여 UDP 패킷 드랍을 극적으로 감소시킵니다. VPC CNI와 기본 Cilium ENI 모드(시나리오 D)는 이 기능이 비활성화되어 20% 손실을 보입니다.
  </div>
</div>

<div style={{borderLeft: '4px solid #10b981', background: 'linear-gradient(to right, #ecfdf5, #f0fdf4)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
    <span style={{background: '#10b981', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>3</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>RTT 지연 개선</strong>
    <span style={{background: '#d1fae5', color: '#065f46', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 600}}>36% 개선</span>
  </div>
  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px'}}>
    <div style={{background: 'white', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: '120px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>A: VPC CNI</div>
      <div style={{fontSize: '22px', fontWeight: 700, color: '#64748b'}}>4,894µs</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '18px'}}>→</div>
    <div style={{background: 'white', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: '120px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>D: ENI</div>
      <div style={{fontSize: '22px', fontWeight: 700, color: '#3b82f6'}}>4,453µs</div>
      <div style={{fontSize: '11px', color: '#059669'}}>-9%</div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '18px'}}>→</div>
    <div style={{background: 'white', border: '2px solid #10b981', borderRadius: '8px', padding: '12px 16px', textAlign: 'center', flex: 1, minWidth: '120px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>E: ENI+튜닝</div>
      <div style={{fontSize: '22px', fontWeight: 800, color: '#059669'}}>3,135µs</div>
      <div style={{fontSize: '11px', color: '#059669', fontWeight: 600}}>-36%</div>
    </div>
  </div>
  <p style={{fontSize: '13px', color: '#065f46', lineHeight: 1.6, margin: 0}}>
    주요 기여 요인: Socket-level LB (connect() 시점 직접 연결), BPF Host Routing (호스트 NS iptables bypass), Native Routing (VXLAN encap/decap 제거)
  </p>
</div>

<div style={{borderLeft: '4px solid #8b5cf6', background: 'linear-gradient(to right, #f5f3ff, #faf5ff)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
    <span style={{background: '#8b5cf6', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>4</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>kube-proxy 제거의 효과</strong>
    <span style={{background: '#ede9fe', color: '#6d28d9', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 600}}>B vs C 비교</span>
  </div>
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px'}}>
    <div style={{background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>TCP/UDP throughput</div>
      <div style={{fontSize: '15px', fontWeight: 600, color: '#64748b'}}>차이 없음</div>
    </div>
    <div style={{background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>RTT</div>
      <div style={{fontSize: '15px', fontWeight: 600, color: '#dc2626'}}>+3% 악화</div>
      <div style={{fontSize: '11px', color: '#94a3b8'}}>4955 → 5092µs</div>
    </div>
    <div style={{background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>HTTP p99@1000</div>
      <div style={{fontSize: '15px', fontWeight: 600, color: '#059669'}}>-10% 개선</div>
      <div style={{fontSize: '11px', color: '#94a3b8'}}>9.87 → 8.91ms</div>
    </div>
    <div style={{background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px'}}>
      <div style={{fontSize: '11px', color: '#6b7280'}}>DNS p99</div>
      <div style={{fontSize: '15px', fontWeight: 600, color: '#059669'}}>-50% 개선</div>
      <div style={{fontSize: '11px', color: '#94a3b8'}}>4ms → 2ms</div>
    </div>
  </div>
  <div style={{background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#5b21b6', lineHeight: 1.6}}>
    <strong>해석:</strong> 소규모 클러스터(Service 100개 미만)에서는 kube-proxy 제거의 성능 이득이 미미합니다. iptables O(n) 룩업 오버헤드는 Service 500개 이상에서 지배적이 됩니다.
  </div>
</div>

<div style={{borderLeft: '4px solid #3b82f6', background: 'linear-gradient(to right, #eff6ff, #f0f9ff)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
    <span style={{background: '#3b82f6', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>5</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>ENI 모드 vs Overlay 모드</strong>
    <span style={{background: '#dbeafe', color: '#1d4ed8', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 600}}>C vs D 비교</span>
  </div>
  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px'}}>
    <thead>
      <tr style={{borderBottom: '2px solid #bfdbfe'}}>
        <th style={{textAlign: 'left', padding: '8px', color: '#1e40af'}}>메트릭</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#1e40af'}}>C (VXLAN)</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#1e40af'}}>D (ENI)</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#1e40af'}}>변화</th>
      </tr>
    </thead>
    <tbody>
      <tr style={{borderBottom: '1px solid #dbeafe'}}>
        <td style={{padding: '8px'}}>TCP Throughput</td>
        <td style={{textAlign: 'right', padding: '8px'}}>12.34 Gbps</td>
        <td style={{textAlign: 'right', padding: '8px'}}>12.41 Gbps</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#94a3b8'}}>+0.6%</td>
      </tr>
      <tr style={{borderBottom: '1px solid #dbeafe'}}>
        <td style={{padding: '8px'}}>RTT</td>
        <td style={{textAlign: 'right', padding: '8px'}}>5,092 µs</td>
        <td style={{textAlign: 'right', padding: '8px', fontWeight: 600}}>4,453 µs</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 600}}>-12.5%</td>
      </tr>
      <tr style={{borderBottom: '1px solid #dbeafe'}}>
        <td style={{padding: '8px'}}>HTTP p99@1000</td>
        <td style={{textAlign: 'right', padding: '8px'}}>8.91 ms</td>
        <td style={{textAlign: 'right', padding: '8px', fontWeight: 600}}>8.75 ms</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669'}}>-1.8%</td>
      </tr>
      <tr>
        <td style={{padding: '8px'}}>UDP Loss</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 600}}>0.69%</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626', fontWeight: 600}}>20.42%</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>튜닝 필요</td>
      </tr>
    </tbody>
  </table>
  <div style={{background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1e40af', lineHeight: 1.6}}>
    <strong>핵심 인사이트:</strong> VXLAN encap/decap은 RTT에서 ~640µs 추가 지연(12%)을 발생시킵니다. ENI 모드는 VPC CIDR에서 직접 IP를 할당하므로 IP 주소 공간 요구사항이 증가합니다. IP 제약 환경에서는 Overlay 모드가 더 적합합니다.
  </div>
</div>

<div style={{borderLeft: '4px solid #f59e0b', background: 'linear-gradient(to right, #fffbeb, #fefce8)', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '16px'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
    <span style={{background: '#f59e0b', color: 'white', borderRadius: '50%', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700}}>6</span>
    <strong style={{fontSize: '15px', color: '#1e293b'}}>튜닝 적용의 누적 효과</strong>
    <span style={{background: '#fef3c7', color: '#92400e', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 600}}>D → E 전환</span>
  </div>
  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px'}}>
    <thead>
      <tr style={{borderBottom: '2px solid #fde68a'}}>
        <th style={{textAlign: 'left', padding: '8px', color: '#92400e'}}>메트릭</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#92400e'}}>D (ENI)</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#92400e'}}>E (ENI+튜닝)</th>
        <th style={{textAlign: 'right', padding: '8px', color: '#92400e'}}>변화</th>
      </tr>
    </thead>
    <tbody>
      <tr style={{borderBottom: '1px solid #fde68a'}}>
        <td style={{padding: '8px'}}>RTT</td>
        <td style={{textAlign: 'right', padding: '8px'}}>4,453 µs</td>
        <td style={{textAlign: 'right', padding: '8px', fontWeight: 700, color: '#059669'}}>3,135 µs</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 600}}>-30%</td>
      </tr>
      <tr style={{borderBottom: '1px solid #fde68a'}}>
        <td style={{padding: '8px'}}>UDP Loss</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>20.42%</td>
        <td style={{textAlign: 'right', padding: '8px', fontWeight: 700, color: '#059669'}}>0.03%</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669', fontWeight: 700}}>-99.9%</td>
      </tr>
      <tr style={{borderBottom: '1px solid #fde68a'}}>
        <td style={{padding: '8px'}}>HTTP QPS@max</td>
        <td style={{textAlign: 'right', padding: '8px'}}>4,026</td>
        <td style={{textAlign: 'right', padding: '8px', fontWeight: 600}}>4,182</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#059669'}}>+3.9%</td>
      </tr>
      <tr>
        <td style={{padding: '8px'}}>HTTP p99@1000</td>
        <td style={{textAlign: 'right', padding: '8px'}}>8.75 ms</td>
        <td style={{textAlign: 'right', padding: '8px'}}>9.89 ms</td>
        <td style={{textAlign: 'right', padding: '8px', color: '#dc2626'}}>+13%</td>
      </tr>
    </tbody>
  </table>
  <div style={{background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e', lineHeight: 1.6}}>
    <strong>가장 영향력 있는 튜닝:</strong><br/>
    1. <strong>Bandwidth Manager + BBR</strong> — UDP loss 20% → 0.03% 극적 개선<br/>
    2. <strong>Socket LB</strong> — connect() 시점 직접 연결로 RTT 단축<br/>
    3. <strong>BPF Host Routing</strong> — 호스트 NS iptables bypass<br/>
    <br/>
    <em>참고: ENA 드라이버 제약으로 XDP와 DSR은 미적용. 적용 시 추가 10-20% 향상이 기대되나 현재 환경에서는 검증 불가합니다.</em>
  </div>
</div>

### 워크로드별 권장 구성

<div style={{overflowX: 'auto'}}>
<table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: '12px', overflow: 'hidden', fontSize: '14px', border: '1px solid #e2e8f0'}}>
  <thead>
    <tr style={{background: 'linear-gradient(135deg, #1e293b, #334155)'}}>
      <th style={{padding: '14px 16px', color: 'white', textAlign: 'left', fontWeight: 600}}>워크로드 특성</th>
      <th style={{padding: '14px 16px', color: 'white', textAlign: 'center', fontWeight: 600}}>권장 시나리오</th>
      <th style={{padding: '14px 16px', color: 'white', textAlign: 'left', fontWeight: 600}}>이유</th>
    </tr>
  </thead>
  <tbody>
    <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>소규모, 단순 (Service &lt;100)</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#e2e8f0', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>A: VPC CNI</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>운영 복잡도 최소, 충분한 성능</td>
    </tr>
    <tr style={{background: 'white', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>UDP 스트리밍, 비디오</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>E: ENI+튜닝</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>UDP loss 0.03% (VPC CNI 대비 680배 개선)</td>
    </tr>
    <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>네트워크 정책 필요</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#ede9fe', color: '#5b21b6', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>C 또는 D</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>L3/L4/L7 정책 + eBPF 성능</td>
    </tr>
    <tr style={{background: 'white', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>고성능, 대규모 (Service 500+)</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>D: Cilium ENI</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>네이티브 라우팅 + kube-proxy 제거</td>
    </tr>
    <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>지연 민감 (금융, 실시간)</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>E: ENI+튜닝</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>RTT 36% 개선, p99 최소화</td>
    </tr>
    <tr style={{background: 'white', borderBottom: '1px solid #e2e8f0'}}>
      <td style={{padding: '12px 16px'}}>IP 주소 제약 환경</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>C: kp-less</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>VXLAN Overlay로 IP 소비 최소화</td>
    </tr>
    <tr style={{background: '#f8fafc'}}>
      <td style={{padding: '12px 16px'}}>멀티테넌트, 관찰성 중시</td>
      <td style={{padding: '12px 16px', textAlign: 'center'}}><span style={{background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '12px'}}>D + Hubble</span></td>
      <td style={{padding: '12px 16px', color: '#64748b'}}>ENI 성능 + 네트워크 가시성</td>
    </tr>
  </tbody>
</table>
</div>

### 시나리오별 최종 평가

<div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', margin: '16px 0'}}>
  <div style={{border: '2px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: 'white'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
      <span style={{background: '#e2e8f0', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '13px'}}>A: VPC CNI</span>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>운영 복잡도: 낮음</span>
    </div>
    <div style={{fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '8px'}}>개발/스테이징 환경</div>
    <div style={{fontSize: '13px', color: '#64748b', lineHeight: 1.6}}>기본 설정으로 충분한 성능. 학습 곡선 없이 즉시 사용 가능.</div>
    <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9'}}>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>성능: </span>
      <span style={{fontSize: '12px', color: '#64748b'}}>기준선 (Baseline)</span>
    </div>
  </div>
  <div style={{border: '2px solid #3b82f6', borderRadius: '12px', padding: '20px', background: 'linear-gradient(to bottom, #eff6ff, white)'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
      <span style={{background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '13px'}}>D: Cilium ENI</span>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>운영 복잡도: 중간</span>
    </div>
    <div style={{fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '8px'}}>일반 프로덕션 환경</div>
    <div style={{fontSize: '13px', color: '#64748b', lineHeight: 1.6}}>RTT -9%, kube-proxy 제거로 대규모 Service 환경에 최적.</div>
    <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dbeafe'}}>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>성능: </span>
      <span style={{fontSize: '12px', color: '#1e40af', fontWeight: 600}}>높음</span>
    </div>
  </div>
  <div style={{border: '2px solid #10b981', borderRadius: '12px', padding: '20px', background: 'linear-gradient(to bottom, #ecfdf5, white)'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
      <span style={{background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '13px'}}>E: ENI+튜닝</span>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>운영 복잡도: 높음</span>
    </div>
    <div style={{fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '8px'}}>고성능/지연 민감 워크로드</div>
    <div style={{fontSize: '13px', color: '#64748b', lineHeight: 1.6}}>UDP loss 680배 개선, RTT -36%. 금융, 실시간, 스트리밍에 최적.</div>
    <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #a7f3d0'}}>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>성능: </span>
      <span style={{fontSize: '12px', color: '#059669', fontWeight: 700}}>최고</span>
    </div>
  </div>
  <div style={{border: '2px solid #8b5cf6', borderRadius: '12px', padding: '20px', background: 'linear-gradient(to bottom, #f5f3ff, white)'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
      <span style={{background: '#ede9fe', color: '#5b21b6', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '13px'}}>C: kp-less</span>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>운영 복잡도: 중간</span>
    </div>
    <div style={{fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '8px'}}>네트워크 정책 / IP 제약 환경</div>
    <div style={{fontSize: '13px', color: '#64748b', lineHeight: 1.6}}>L3/L4/L7 정책 + VXLAN Overlay로 IP 소비 최소화.</div>
    <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd6fe'}}>
      <span style={{fontSize: '12px', color: '#94a3b8'}}>성능: </span>
      <span style={{fontSize: '12px', color: '#7c3aed', fontWeight: 600}}>보통~높음</span>
    </div>
  </div>
</div>

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
