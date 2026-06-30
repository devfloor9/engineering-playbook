---
title: AWS Nitro 아키텍처와 성능 튜닝
description: AWS Nitro System의 구성 요소와 v2~v6 세대별 네트워크 변경 사항, 그리고 EKS 노드에서 요구되는 ENA 드라이버·커널 버전과 PPS/CPS 중심 성능 튜닝 전략을 다룹니다.
created: "2026-06-19"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 15
tags:
  - eks
  - networking
  - performance
  - ena
  - nitro
  - scope:tech
keywords:
  - Nitro System
  - ENA Express
  - PPS
  - conntrack
sidebar_label: Nitro 아키텍처 & 튜닝
---

## 개요

AWS Nitro System은 현세대 Amazon EC2 인스턴스의 기반 플랫폼이며, EKS 워커 노드의 네트워크·스토리지·보안 동작을 결정합니다. Nitro는 세대(v2~v6)별로 네트워크 대역폭, ENA(Elastic Network Adapter) 기능, TCP 동작이 다르고, 이에 따라 노드 AMI의 ENA 드라이버·커널 버전 요구사항과 성능 튜닝 포인트가 달라집니다. 이 문서는 Nitro 구성 요소와 세대별 변경 사항을 정리하고, EKS 노드 관점에서 확인해야 할 드라이버·커널 요건과 PPS(Packets Per Second)/CPS(Connections Per Second) 중심 튜닝 전략을 다룹니다.

## 배경

Nitro System은 가상화 오버헤드를 전용 하드웨어로 오프로드하는 구성 요소의 집합입니다.

- **Nitro 카드**: 네트워크·로컬 NVMe 스토리지·관리·모니터링·보안 등 모든 I/O 인터페이스를 호스트 메인보드와 물리적으로 분리된 자체 컴퓨팅 장치에서 처리합니다.
- **Nitro 보안 칩**: 메인보드에 통합되어 하드웨어 신뢰 기반을 제공합니다.
- **Nitro 하이퍼바이저**: 메모리·CPU 할당만 담당하는 경량 하이퍼바이저로, 대부분의 워크로드에서 베어메탈과 구분되지 않는 성능을 제공합니다.

인스턴스의 Nitro 버전은 인스턴스 패밀리 스펙 페이지의 **Platform summary 표 `Hypervisor` 컬럼**에서 확인합니다. 세대별 기능은 **누적(cumulative)** 되며, 상위 버전은 하위 버전 기능을 모두 포함합니다(명시적 예외 제외).

## 세대별 네트워크 변경 사항

| 세대 | 주요 변경 | 대표 인스턴스 |
|------|-----------|--------------|
| **v6** | 네트워크 카드당 최대 400Gbps. 유휴 TCP established 타임아웃 432,000초 → **350초**로 단축. Traffic Mirroring 미지원 | M8i·C8i·R8i, M8g, P6-B200, G7 |
| **v5** | 카드당 최대 200Gbps. Traffic Mirroring 미지원 | M8g·C8g·R8g, Trn2, P5en, P6e-GB200 |
| **v4** | GPU·Trainium 계열 100Gbps, 그 외 최대 170Gbps. **ENA Express** 지원, 일부 타입 RDMA read/write(EFA) 지원. Traffic Mirroring 지원 | M7i·C7i·R7i, M7g, Inf2, Trn1, P5, G6 |
| **v3** | 카드당 최대 100Gbps. **전송 중 암호화(encryption in transit)**. Traffic Mirroring 지원 | C5n, R5n, P4d, G4dn, Inf1 |
| **v2** | **ENA 기반 향상된 네트워킹(enhanced networking)** 도입. Traffic Mirroring 지원 | M5·C5·R5, M6g·C6g, T3·T4g |

:::warning v6의 TCP established 타임아웃 단축 영향

Nitro v6에서 유휴 TCP 연결의 기본 established 타임아웃이 432,000초에서 **350초로 대폭 단축**되었습니다. 커넥션 풀, gRPC keepalive, 장시간 유휴 DB 연결 등 long-lived 연결을 유지하는 워크로드는 의도치 않은 연결 종료를 겪을 수 있습니다. 애플리케이션·커널의 keepalive 설정(`net.ipv4.tcp_keepalive_time` 등)을 타임아웃보다 짧게 조정해 연결을 유지해야 합니다.

:::

## 드라이버 및 커널 요구사항

Nitro 인스턴스는 향상된 네트워킹에 ENA를, 스토리지 볼륨에 NVMe 블록 디바이스를 사용합니다. 세대가 올라갈수록 드라이버·커널 요건이 엄격해지며, 이는 성능뿐 아니라 ENI 어태치 성공 여부에도 직결됩니다.

### ENA 드라이버 최소 버전

- ENA Linux 드라이버 **2.2.9 이상**: Nitro v4 권장, **Nitro v5 이상 필수**.
- v5에서 2.2.9 미만, v5 이전 세대에서 1.2.0 미만 드라이버는 **ENI 어태치 실패**를 유발합니다.
- **accelerated path(가속 경로) 기능은 최신 ENA 드라이버(2.2.9 이상)에서만 동작**합니다. 구버전 드라이버는 가속 경로를 지원하지 않아 PPS 성능이 저하됩니다. 따라서 드라이버 최신화가 사실상 1순위 튜닝 항목입니다.

### 배포판별 최소 커널 버전

ENA 기능의 최적 성능을 위해 일부 배포판은 최소 커널 버전을 요구합니다.

| 배포판 | 최소 커널 |
|--------|-----------|
| Linux upstream | 5.9 |
| Amazon Linux 2 | 4.14.186 |
| RHEL | 8.4 (4.18.0-305) |
| Ubuntu | 20.04 (5.4.0-1025-aws) |
| Debian | 11 (5.10.0) |

Amazon Linux 2023과 Bottlerocket은 Nitro v4 이상의 ENA 기능을 기본 지원하므로 별도 커널 튜닝이 필요하지 않습니다. EKS 노드는 가능하면 Amazon Linux 2023 또는 Bottlerocket 기반 AMI를 사용하는 것이 드라이버·커널 관리 부담을 줄이는 방법입니다.

### Graviton(arm64) 추가 요건

Graviton 프로세서 인스턴스는 64-bit ARM 아키텍처 AMI와 ACPI 테이블·PCI 디바이스 ACPI 핫플러그를 지원하는 UEFI 부팅을 요구하며, Linux 운영체제만 지원합니다.

## 네트워크 성능 튜닝

모든 현세대 EC2 인스턴스는 네트워크 패킷 처리를 Nitro 카드에서 수행합니다. Nitro 카드는 새 플로우의 첫 패킷에 대해 보안 그룹·ACL·라우팅을 평가하고, 동일 플로우의 후속 패킷에는 캐시된 정보를 재사용해 오버헤드를 줄입니다. 플로우는 출발/목적지 IP·포트와 프로토콜로 구성된 **5-tuple**로 식별됩니다.

### PPS와 CPS를 함께 고려

신규 연결(CPS)은 5-tuple 전체 평가가 필요해 비용이 크고, 연결이 수립된 후의 패킷(PPS)만 가속 경로의 이점을 받습니다. DNS·방화벽·가상 라우터처럼 신규 연결률이 높은 워크로드는 가속 이점이 적으므로, 연결을 재사용하도록 애플리케이션을 설계해야 합니다.

### 주요 튜닝 포인트

- **ENA 드라이버 최신화**: 가속 경로 활성화의 전제 조건. 위 최소 버전 이상으로 유지합니다.
- **비대칭 라우팅 회피**: 인바운드/아웃바운드 인터페이스가 다르면 보안 그룹 conntrack 추적으로 피크 성능이 저하됩니다. conntrack allowance를 소진하면 신규 연결이 throttle됩니다.
- **동일 AZ 내 통신 선호**: 장거리 연결은 TCP windowing과 RTT 증가로 PPS가 감소합니다.
- **BQL(Byte Queue Limit)**: ENA 드라이버와 대부분의 배포판에서 기본 비활성. fragment proxy override와 동시 활성 시 성능 제약이 발생할 수 있습니다.

### 커널 파라미터 및 드라이버 튜닝

Nitro 인스턴스의 네트워크 성능은 ENA 드라이버 모듈 파라미터, ethtool 설정, 그리고 커널 sysctl 값으로 조정할 수 있습니다. 아래 항목은 AWS 공식 문서가 명시한 튜닝 포인트와, 워크로드 특성에 따라 조정하는 일반 커널 파라미터를 구분해 정리합니다. 모든 값은 적용 전후로 피크 active flow 기준 벤치마크를 권장합니다.

#### ENA 드라이버 모듈 파라미터

| 항목 | 설명 | 적용 방법 |
|------|------|-----------|
| `enable_frag_bypass` | egress fragment의 PPS 제한(1024)을 우회하는 fragment proxy mode. MTU 초과로 단편화가 잦은 워크로드에 유효 | 드라이버 로드 시 `sudo insmod ena.ko enable_frag_bypass=1` |

fragment proxy mode는 BQL과 동시 활성 시 성능 제약이 발생할 수 있으므로 함께 사용하지 않습니다. 세부 옵션은 ENA Linux 드라이버 README와 Best Practices 가이드를 참조합니다.

#### ENA 큐 및 링 버퍼 (ethtool)

고성능 네트워크 워크로드는 다수의 ENA 큐를 활용해 vCPU당 처리를 분산해야 합니다. 지원 인스턴스 타입에서는 ENI별로 큐를 동적 할당(Flexible ENA queue allocation)할 수 있습니다. 큐 개수와 링 버퍼 크기는 `ethtool`로 확인·조정합니다.

```bash
# 현재 채널(큐) 수 확인 및 조정
ethtool -l eth0
ethtool -L eth0 combined <N>

# 링 버퍼 크기 확인 및 조정 (드롭 발생 시 상향)
ethtool -g eth0
ethtool -G eth0 rx <SIZE> tx <SIZE>
```

#### 연결 관리 (conntrack · TCP keepalive)

- **유휴 연결 타임아웃**: 보안 그룹 connection tracking은 유휴 연결을 추적해 conntrack allowance를 소비합니다. idle 연결을 빨리 닫으려면 connection tracking 타임아웃을, 반대로 유휴 연결을 유지하려면 TCP keepalive를 사용합니다.
- **Nitro v6 대응**: v6는 established 타임아웃이 350초로 짧으므로, long-lived 연결 유지가 필요하면 커널 keepalive 주기를 그보다 짧게 설정합니다.

```bash
# TCP keepalive — 유휴 연결 유지 (350초보다 짧게)
sysctl -w net.ipv4.tcp_keepalive_time=300
sysctl -w net.ipv4.tcp_keepalive_intvl=30
sysctl -w net.ipv4.tcp_keepalive_probes=5
```

#### 워크로드별 일반 커널 파라미터

다음 sysctl은 AWS가 단일 권장값을 제공하지 않으며, NMA가 노출하는 커널 이벤트(`ApproachingKernelPidMax`, `ApproachingMaxOpenFiles`, `ConntrackExceededKernel`)나 ethtool 드롭 메트릭이 관찰될 때 워크로드에 맞게 상향합니다.

| 파라미터 | 조정 계기 (NMA 이벤트 등) |
|----------|---------------------------|
| `net.netfilter.nf_conntrack_max` | `ConntrackExceededKernel` — 커널 conntrack 테이블 포화 |
| `kernel.pid_max` | `ApproachingKernelPidMax` — PID 고갈 임박 |
| `fs.file-max` / `fs.nr_open` | `ApproachingMaxOpenFiles` — open file 한계 임박 |
| `net.core.somaxconn`, `net.ipv4.tcp_max_syn_backlog` | 고CPS 서비스의 연결 수락 큐 포화 |
| `net.core.rmem_max` / `net.core.wmem_max` | 고대역폭(100Gbps+) 전송 시 소켓 버퍼 |

:::warning EKS 노드에서의 sysctl 적용 방법

EKS 워커 노드에서 위 커널 파라미터를 영구 적용할 때는 노드 OS를 직접 수정하지 않고 노드 부트스트랩 계층에서 설정합니다.

- **관리형 노드그룹 / self-managed**: launch template user data 또는 Bottlerocket의 `[settings.kernel.sysctl]` 설정
- **Pod 단위**: Pod `securityContext.sysctls`(namespaced sysctl) 또는 init container의 privileged 설정
- **DaemonSet**: 노드 전역 sysctl이 필요하면 부팅 시 적용하는 node-tuning DaemonSet

`net.core.*`, `net.ipv4.tcp_*` 같은 노드 전역(non-namespaced) 파라미터는 Pod `securityContext`로 설정할 수 없으므로 노드 부트스트랩 계층에서 적용해야 합니다.

:::

성능 지표는 ENA 드라이버가 노출하는 ethtool 메트릭(`bw_in/out_allowance_exceeded`, `pps_allowance_exceeded`, `conntrack_allowance_exceeded`, `conntrack_allowance_available` 등)으로 모니터링합니다. 이 값이 0이 아니면 해당 allowance가 한계에 도달했음을 의미하며, 커널 튜닝 또는 상위 Nitro 세대 인스턴스로의 전환을 검토합니다.

### EKS 관점의 연계 신호

EKS Node Monitoring Agent(NMA)는 Nitro/ENA 계층의 한계 초과를 노드 이벤트로 노출합니다. `BandwidthInExceeded`·`BandwidthOutExceeded`·`PPSExceeded`·`ConntrackExceeded`·`LinkLocalExceeded`·`NetworkSysctl` 등이 대표적이며, 이들은 Event 심각도라 Auto Repair를 트리거하지 않습니다. 즉 노드 자동 교체로는 해소되지 않으므로, 해당 이벤트가 반복되면 인스턴스 타입 상향(상위 Nitro 세대)이나 워크로드 분산 같은 설계 대응이 필요합니다. 노드 헬스 신호 해석은 [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md) 문서를 참조합니다.

## 결론

Nitro 세대는 EKS 노드의 네트워크 대역폭·TCP 동작·드라이버 요건을 결정하는 하드웨어 계층입니다. 워크로드가 배치될 인스턴스 패밀리의 Nitro 버전을 먼저 확인하고, v5 이상은 ENA 드라이버 2.2.9 이상을 충족하는 AMI를 사용해야 합니다. v6 인스턴스는 단축된 TCP established 타임아웃을 고려한 keepalive 조정이 필요하며, 고PPS·고CPS 워크로드는 가속 경로를 최대한 활용하도록 연결 재사용과 비대칭 라우팅 회피를 설계에 반영해야 합니다. 커널 파라미터 튜닝은 ENA 드라이버 모듈 옵션·ethtool 큐/링 버퍼·conntrack/keepalive sysctl을 중심으로 하되, AWS는 워크로드별 단일 권장값을 제공하지 않으므로 ethtool allowance 메트릭과 NMA 이벤트를 근거로 벤치마크하며 조정합니다. EKS 노드에서는 노드 부트스트랩 계층(launch template user data·Bottlerocket 설정) 또는 Pod `securityContext`를 통해 적용합니다.

## 참고 자료

### 공식 문서
- [Instances built on the AWS Nitro System](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html) — 세대별 네트워크 기능, 인스턴스 매핑, 드라이버·커널 요구사항
- [Nitro system considerations for performance tuning](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-nitro-perf.html) — 패킷 플로우, PPS/CPS, 가속 경로 및 PPS 튜닝(`enable_frag_bypass`)
- [ENA Linux Driver Best Practices and Performance Optimization Guide](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/ENA_Linux_Best_Practices.rst) — ENA 드라이버 큐·링 버퍼·튜닝 모범 사례
- [Monitor network performance for ENA settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/monitoring-network-performance-ena.html) — ethtool allowance 메트릭 모니터링
- [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) — Nitro 구성 요소 개요

### 기술 블로그
- [Using connection tracking improvements to increase network performance](https://aws.amazon.com/blogs/networking-and-content-delivery/using-connection-tracking-improvements-to-increase-network-performance/) — conntrack allowance와 성능
- [EC2 instance-level network performance metrics](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-ec2-instance-level-network-performance-metrics-uncover-new-insights/) — ENA allowance 초과 메트릭 모니터링

### 관련 문서 (내부)
- [EKS Node Monitoring Agent](../operations-reliability/node-monitoring-agent.md) — 노드 네트워크 한계 초과 이벤트 해석
- [Cilium ENI + Gateway API](./gateway-api-adoption-guide/cilium-eni-gateway-api.md) — ENA 드라이버 기반 ENI 모드 네트워킹
