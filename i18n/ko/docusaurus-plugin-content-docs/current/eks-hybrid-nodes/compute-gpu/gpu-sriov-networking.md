---
title: 하이브리드 GPU 워크로드와 SR-IOV 네트워킹
description: EKS Hybrid Nodes에서 온프렘 GPU를 활용하고, DGX H200에서 관찰된 VF 이름 변경, Ethernet 링크 모드, PORT_DOWN을 증상별로 진단합니다.
created: "2025-09-01"
last_update:
  date: 2026-11-24
  author: YoungJoon Jeong
reading_time: 19
review:
  owner: null
  reviewed_on: 2026-11-24
  status: review_needed
  next_review: null
tags:
  - eks
  - hybrid-node
  - dgx-h200
  - sriov
  - infiniband
  - networking
  - mlnx-ofed
  - gpu
  - scope:impl
sidebar_label: GPU & SR-IOV
category: hybrid-multicloud
---

## 소개

전반부는 보유 GPU를 활용하는 3계층 추론 아키텍처를 다룹니다. 후반부는 EKS Hybrid Nodes에 연결한 DGX H200의 장애 기록입니다. SR-IOV VF(Virtual Function) 이름 변경, 일부 포트의 Ethernet 표시, 일부 VF의 `PORT_DOWN`을 각각 어떻게 확인할지 설명합니다.

## 하이브리드 GPU 워크로드 아키텍처

보유 GPU 서버(DGX 등)를 하이브리드 노드로 등록하면 고정 비용 자산을 1차 추론 계층으로 활용하고, 클라우드 GPU(Spot)와 Amazon Bedrock을 버스트·폴백 계층으로 결합할 수 있습니다.

**표 1. 3-Tier 하이브리드 추론 계층별 인프라·비용·역할**

| Tier | 인프라 | 비용 구조 | 역할 |
|------|--------|---------|------|
| 1 | On-Prem Hybrid Node (DGX) | 고정 비용 (기보유) | 기본 트래픽 (항상 활성) |
| 2 | Cloud GPU (EKS Spot/OD) | 시간당 변동 비용 | 피크 버스트 |
| 3 | Amazon Bedrock | 토큰당 종량제 | 장애·과부하 폴백 |

GPU 노드는 `--node-labels=node-type=hybrid,gpu=h100`과 `nvidia.com/gpu` 테인트로 등록하고, NVIDIA device plugin 또는 GPU Operator로 리소스를 노출합니다. 워크로드는 nodeSelector로 온프렘(기본 추론)/클라우드(버스트)를 분리 배치하고, 게이트웨이(Bifrost 등) 레벨의 cascade routing으로 계층 간 폴백을 구성합니다.

:::warning 하이브리드 추론 네트워크 고려사항
- **지연 시간**: VPN/DX 경유로 클라우드 노드 대비 왕복 지연 추가 — 게이트웨이 라우팅 정책에 반영 필요
- **분산 추론 제약**: 멀티노드 NCCL 통신은 고대역폭 필요 — 온프렘 내부 Pipeline Parallelism은 가능하나 온프렘↔클라우드 간 PP는 비권장
- **권장 패턴**: 온프렘 노드는 독립 모델을 서빙하고, 클라우드와는 Gateway 레벨 cascade routing으로만 연결
:::

Gateway 레벨 폴백·관측성은 [Agent 모니터링 & 운영](../../agentic-ai-platform/operations-mlops/observability/agent-monitoring)을, GPU 리소스 관리(DRA 포함)는 [GPU 리소스 관리](../../agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management)를 참조합니다.

이하에서는 InfiniBand·SR-IOV 기반 고성능 GPU 네트워킹 구성을 DGX H200 실사례로 다룹니다.

## 아키텍처 개요

Amazon EKS 컨트롤 플레인은 Hybrid Nodes 기능을 통해 온프렘 DGX H200 노드를 관리합니다. NVIDIA DGX H100/H200 User Guide 기준으로 각 DGX 노드는 8개의 H200 GPU와, 클러스터 패브릭용 **8개의 단일 포트 ConnectX-7 InfiniBand 카드**(4개의 OSFP 포트로 묶임), 그리고 스토리지·인밴드 관리용 **2개의 듀얼 포트 ConnectX-7 이더넷 카드**를 포함합니다. 이 가이드는 클러스터 패브릭의 8개 InfiniBand 포트에서 SR-IOV를 사용하는 사례를 다루며, 각 Physical Function당 8개의 VF를 생성하도록 구성합니다. 실제 어댑터 구성과 PCI 주소는 환경마다 다르므로 `lspci`·`ibstat`·`mlxfwmanager --query`로 반드시 사전 확인해야 합니다. 문제는 SR-IOV VF와 Kubernetes CNI 스택(Cilium, Multus, SR-IOV CNI 플러그인) 간 상호 작용에서 발생합니다.

## 문제 상황: VF 이름 불일치

DGX H200 클러스터를 EKS Hybrid Nodes에 연결한 뒤 파드 배포가 실패했습니다. 배포 중 운영자는 VF 인터페이스 이름이 바뀌고 CNI와 디바이스 플러그인의 바인딩이 실패하는 현상을 관찰했습니다.

환경 구성:

- **하드웨어**: NVIDIA DGX H200 (8-GPU 시스템). NVIDIA DGX H100/H200 User Guide 기준 네트워크 어댑터는 클러스터 패브릭용 8개의 단일 포트 ConnectX-7 InfiniBand 카드(4개의 OSFP 포트)와 스토리지·인밴드 관리용 2개의 듀얼 포트 ConnectX-7 이더넷 카드로 구성됩니다. 이 사례의 SR-IOV 구성은 InfiniBand 클러스터 패브릭 포트를 대상으로 합니다. BlueField-3 DPU는 이 DGX 기본 구성에 포함되지 않는 별도 옵션으로, 주로 SuperPOD 환경에서 사용되며 별도의 DOCA/펌웨어 요구사항을 가집니다.
- **소프트웨어 스택**: Ubuntu 24.04, Kernel 6.8.0-55-generic, Amazon EKS Hybrid Nodes
- **네트워킹**: Cilium v1.17.x (primary CNI), Multus + SR-IOV CNI (secondary networks)

증상:

- VF 인터페이스 이름이 파드 배포 후 무작위로 변경됨
- CNI 및 Device Plugin 바인딩이 일관되게 실패함
- 일부 포트가 Ethernet 모드로 폴백됨
- SR-IOV VF가 간헐적으로 PORT_DOWN 상태를 표시함

## 장애 기록에서 확인할 수 있는 내용 {#원인-분석-드라이버-호환성-문제}

사례에 기록된 환경은 MLNX_OFED 25.01과 커널 `6.8.0-55-generic`입니다. 아래 커널 로그에는 심볼을 찾지 못한 오류와 특정 PCI 주소의 probe 실패가 기록돼 있습니다.

```bash
# dmesg에서 확인된 내용 (간략화)
[  123.456789] mlx5_core: Unknown symbol strlcpy (err -2)
[  123.456790] mlx5_core: probe of 0000:18:00.2 failed with error -2
```

**표 2. DGX H200에서 관찰한 증상과 증상별 확인 방법**

| 관찰된 증상 | 기록으로 확인한 사실 | 가능한 원인 | 확인에 필요한 자료 |
| --- | --- | --- | --- |
| VF 이름 변경 | 바인딩이 실패했고 `0000:18:00.2`에서 probe가 실패했습니다. 로그에는 이름이 바뀐 VF가 표시되지 않습니다. | 드라이버 빌드 불일치 또는 udev 명명 규칙의 적용 순서. | 재부팅 또는 파드 재배포 전후에 같은 PF의 같은 VF 번호를 PCI 주소와 인터페이스 이름에 대응시킵니다. 각 부팅의 `udevadm info`와 커널 로그를 비교합니다. |
| InfiniBand로 예상한 포트에서 Ethernet 표시 | 일부 포트에서 Ethernet이 보고됐습니다. 같은 물리 포트의 전후 기록은 없습니다. | 포트 식별 오류, 링크 유형 설정 또는 펌웨어와 드라이버의 조합. | PCI 주소와 포트 번호를 확인합니다. `ibstat`의 현재 링크 계층과 `mlxconfig`의 다음 부팅 `LINK_TYPE_P1` 설정(해당 시 `P2`)을 대조합니다. 어댑터 PSID, 펌웨어와 드라이버 버전도 기록합니다. |
| VF의 `PORT_DOWN` | 간헐적인 다운 상태가 보고됐습니다. 같은 시각의 물리 포트나 서브넷 매니저 로그는 없습니다. | 물리 링크, VF 포트 정책·GUID 또는 서브넷 매니저 상태. | 같은 시각의 PF·VF `ibstat`, sysfs의 VF별 `node`·`port`·`policy`, 서브넷 매니저 로그를 확보합니다. |

NVIDIA 문서는 [VF별 GUID와 포트 정책](https://networking-docs.nvidia.com/mlnxofedswum/24.10-5.1.6.1lts/single-root-io-virtualization-sr-iov), [다음 부팅의 링크 설정](https://networking-docs.nvidia.com/mftswum/4310/using-mlxconfig)을 설명합니다. 세 증상의 인과관계를 확인하려면 해당 노드의 기록이 필요합니다.

## 3계층 해결 방안

영향받은 VF에서 확보한 근거에 따라 조치를 선택합니다. 이름 변경만으로는 드라이버 교체가 필요하다고 판단할 수 없습니다.

### 계층 1: 기반 수정 - 드라이버 업그레이드

설치한 모듈과 실행 중인 커널의 비호환성을 확인했다면 MLNX_OFED의 OS·커널 지원표에서 맞는 빌드를 선택합니다. 활성 InfiniBand 드라이버 교체는 **노드 드레인 → 콘솔(BMC/IPMI) 접근 확보 → 기존 드라이버·설정 백업 → 적용 → 검증** 순서로 진행합니다. SSH로만 접속하면 드라이버 제거 시점에 연결이 끊길 수 있습니다. 예시의 패키지·커널·PCI 주소는 대상 노드에 맞게 교체하십시오.

:::danger 서비스 중단 및 복구 불가 위험
설치된 OFED 패키지를 제거한 뒤 드라이버를 다시 로드하거나 재부팅하면 노드에 접속할 수 없게 될 수 있습니다. 패키지 제거 전 워크로드를 비우고 대역 외 콘솔 접근을 확보합니다. 드라이버와 설정을 백업하고 이전 패키지와 재설치 절차를 준비합니다.
:::

```bash
# 0) 사전 준비(통제된 유지보수)
#   - kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
#   - BMC/IPMI 콘솔 접근 확인
#   - 현재 상태 백업: ofed_info -s, uname -r, cp -a /etc/opensm /root/opensm.bak 등

# 1) 대상 노드의 OS·커널에 맞는 지원 조합인지 MLNX_OFED 릴리스 노트에서 먼저 확인
#    (아래 버전·파일명은 예시이며 실제 지원 매트릭스로 교체)

# 2) (파괴적) 호환되지 않는 드라이버 제거 — 콘솔 접근 확보 후에만 실행
sudo ofed_uninstall.sh --force

# 3) 대상 커널을 지원하는 MLNX_OFED 설치 (예시 버전)
wget https://content.mellanox.com/ofed/MLNX_OFED-24.10-0.7.0.0/MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
tar -xzf MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
cd MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64
sudo ./mlnxofedinstall --without-fw-update

# 4) initramfs 갱신 후 재부팅, 재부팅 뒤 ofed_info -s / ibstat 로 드라이버·링크 상태 검증
sudo update-initramfs -u
```

:::tip 커널 지원 빌드 관련 주의
`--add-kernel-support`는 배포판 기본 커널에 맞는 사전 빌드 패키지가 없을 때 특정 커널에 맞춰 모듈을 재빌드하는 옵션입니다. Ubuntu에서는 DKMS 기반 설치가 권장되는 경우가 있으므로, 플래그를 추가하기 전에 대상 OS에 대한 MLNX_OFED 설치 문서(DKMS vs `--add-kernel-support`)를 확인하고 해당 지침을 따르십시오.
:::

### 계층 2: systemd.link로 영구 명명 구현

PCI 경로 등 안정적인 물리 속성에 기반해 일관된 VF 이름을 보장하는 systemd.link 파일을 생성합니다. 작성 전에 systemd.link의 제약을 반드시 확인해야 합니다. 인터페이스 이름은 **1~15자**이며 제어 문자와 `:`, `/`, `%`를 포함할 수 없습니다. `{attr/...}`와 같은 중괄호 치환은 systemd.link가 지원하는 문법이 아니라 **문자열 그대로** 처리되므로(`/` 때문에 유효하지 않은 이름이 됨), 사용하면 안 됩니다. 또한 `Name=`은 `NamePolicy=`보다 우선순위가 낮아, `NamePolicy=`가 성공하면(예: `keep`은 이미 설정된 사용자 공간 이름을 유지) `Name=`은 적용되지 않습니다.

아래는 환경에서 관찰된 udev 속성으로 매칭한 뒤 명시적 고정 이름을 부여하는 예시입니다. 매칭 속성(`ID_NET_NAME_SLOT` 등)과 이름 접두사·자릿수는 대상 노드에서 `udevadm info /sys/class/net/<iface>`로 실제 속성을 확인해 조정하고, VF 개수를 고려해 15자 제한을 넘지 않도록 설계해야 합니다.

```bash
# VF별로 관찰된 udev 속성에 매칭해 고정 이름을 부여 (장치마다 .link 파일 분리 권장)
# 매칭 조건과 이름은 반드시 'udevadm info'로 실제 속성을 확인한 뒤 작성
cat > /etc/systemd/network/10-dgx-ib-vf0.link << 'EOF'
[Match]
# 예시: 실제 노드의 udevadm info 출력에서 확인한 고유 속성으로 교체
Path=pci-0000:18:00.0
Driver=mlx5_core

[Link]
# 1~15자, '/',':','%' 및 제어문자 불가. NamePolicy를 두지 않아 Name이 적용되도록 함
Name=ibvf0
AlternativeName=k8s-ib-vf0
MACAddressPolicy=persistent
EOF
```

적용 후에는 `udevadm control --reload`와 `udevadm test-builtin net_setup_link /sys/class/net/<iface>`로 이름 정책이 의도대로 평가되는지 확인하고, **재부팅 전후로 이름이 동일하게 유지되는지** 반드시 검증합니다.

### 계층 3: systemd로 VF 생성 오케스트레이션

적절한 타이밍과 GUID 할당으로 VF 생성을 처리하는 systemd 서비스를 생성합니다. 아래 유닛은 몇 가지 중요한 설계 원칙을 반영합니다.

- **대상 PF 집합과 VF 인덱스를 분리해 다루어야 합니다.** VF를 생성하는 PF 목록(`PFS`)과, 각 PF 아래 VF를 순회하는 로직을 별도로 정의합니다. 예전 예시처럼 `for i in {0..63}; vf=$((i/8))`로 평탄화하면 `mlx5_0..7`만 참조해 실제 PF 집합과 어긋납니다.
- **GUID 파일은 PF별·VF별 경로를 사용합니다.** VF GUID는 `/sys/class/infiniband/<PF>/device/sriov/<vf>/node`와 `.../<vf>/port`에 기록합니다(장치/드라이버에 따라 경로가 다를 수 있으므로 적용 전 실제 sysfs 트리를 확인). 포트 인덱스를 VF 인덱스로 혼용하지 않습니다.
- **모든 쓰기는 실패 시 즉시 중단해야 합니다.** `set -e`와 명시적 오류 검사를 두어, 쓰기 실패가 조용히 무시되지 않도록 합니다.
- **GUID는 패브릭 전역에서 고유해야 합니다.** 아래의 단순 산술 공식을 여러 DGX 호스트에 그대로 적용하면 호스트 간 GUID가 중복됩니다. 호스트 식별자(예: 섀시 일련번호·노드 인덱스)를 접두에 포함하거나 중앙에서 할당해 **패브릭 전역 고유성**을 보장해야 합니다.
- **kubelet 의존성은 순서(ordering)만으로 부족합니다.** `Before=kubelet.service`는 순서만 지정하며, 이 서비스가 실패해도 kubelet 시작을 막지 못합니다. kubelet 유닛 쪽에 `After=`와 `Requires=`(또는 `BindsTo=`)를 함께 설정해, VF 준비 실패 시 kubelet이 기동하지 않도록 해야 합니다.
- **`enable`은 현재 세션을 초기화하지 않습니다.** `systemctl enable`은 부팅 시 활성화만 하므로, 즉시 적용하려면 `systemctl start`로 실행하고 결과(`systemctl status`, 저널)를 확인한 뒤, 재부팅으로 부팅 경로도 검증해야 합니다.

예시는 PF당 VF 8개를 사용합니다. 확인한 PF 목록의 순서를 고정합니다. `GUID_PREFIX`에는 패브릭에서 이 호스트에만 할당한 6옥텟 접두사를 넣습니다. 다음 옥텟은 VF를 식별하고 마지막 옥텟은 노드와 포트를 구분합니다. 접두사를 비워 두면 쓰기를 시작하기 전에 서비스가 중단됩니다.

```bash
cat > /etc/systemd/system/dgx-sriov-setup.service << 'EOF'
[Unit]
Description=DGX H200 SR-IOV VF Setup
After=network-pre.target
# kubelet 유닛에 'After=dgx-sriov-setup.service'와 'Requires=dgx-sriov-setup.service'를
# 드롭인으로 추가해야 이 서비스 실패 시 kubelet이 기동하지 않습니다(순서 전용 Before= 만으로는 불충분).

[Service]
Type=oneshot
RemainAfterExit=yes
# 대상 PF 집합은 노드에서 'ibstat'/'ls /sys/class/infiniband'로 확인한 실제 값으로 교체
Environment="PFS=mlx5_0 mlx5_1 mlx5_2 mlx5_3 mlx5_4 mlx5_5 mlx5_6 mlx5_7"
Environment=GUID_PREFIX=
ExecStart=:/bin/bash -euo pipefail -c '\
  [[ "$GUID_PREFIX" =~ ^([[:xdigit:]]{2}:){5}[[:xdigit:]]{2}$ ]] || { echo "Set a six-octet GUID_PREFIX" >&2; exit 1; }; \
  for pf in $PFS; do \
    count=/sys/class/infiniband/$pf/device/sriov_numvfs; \
    case "$(cat "$count")" in 0|8) ;; *) echo "Unexpected VF count on $pf" >&2; exit 1 ;; esac; \
  done; \
  for pf in $PFS; do \
    count=/sys/class/infiniband/$pf/device/sriov_numvfs; \
    if [[ "$(cat "$count")" == 0 ]]; then echo 8 > "$count"; fi; \
  done'
ExecStart=/usr/bin/udevadm settle --timeout=30
ExecStart=:/bin/bash -euo pipefail -c '\
  idx=0; \
  for pf in $PFS; do \
    for vf in 0 1 2 3 4 5 6 7; do \
      base=/sys/class/infiniband/$pf/device/sriov/$vf; \
      [ -e "$base/node" ] || { echo "missing $base/node" >&2; exit 1; }; \
      printf "%%s:%%02x:01\\n" "$GUID_PREFIX" "$idx" > "$base/node"; \
      printf "%%s:%%02x:02\\n" "$GUID_PREFIX" "$idx" > "$base/port"; \
      idx=$((idx+1)); \
    done; \
  done'
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

# 즉시 적용 + 결과 확인(enable만으로는 현재 세션이 설정되지 않음)
sudo systemctl daemon-reload
sudo systemctl enable --now dgx-sriov-setup.service
systemctl status dgx-sriov-setup.service
```

이 서비스는 VF를 생성하고 고유 GUID를 할당해 `0x000000` GUID 문제를 예방하려는 것입니다. 다만 "kubelet보다 먼저 완료됨"을 실제로 보장하려면 위에서 설명한 kubelet 쪽 `Requires=`/`After=` 의존성과 쓰기 실패 처리를 함께 적용하고, 적용 후 `systemctl start`와 재부팅 양쪽에서 VF 수와 GUID를 검증해야 합니다.

## Amazon EKS Hybrid Nodes 통합

:::warning 지원 범위 (반드시 확인)
이 구성은 **AWS가 지원하는 조합이 아닙니다.** AWS 문서에 따르면 Multus는 Amazon VPC CNI를 기본(primary) CNI로 사용할 때만 지원되며([Attach multiple network interfaces to Pods with Multus](https://docs.aws.amazon.com/eks/latest/userguide/pod-multus.html)), VPC CNI는 EKS Hybrid Nodes와 호환되지 않습니다(VPC CNI는 `eks.amazonaws.com/compute-type: hybrid` 레이블에 대한 anti-affinity로 구성되며, Cilium이 Hybrid Nodes의 AWS 지원 CNI입니다 — [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html)). 또한 AWS는 SR-IOV·DPDK CNI 플러그인을 빌드·게시하지 않습니다. 따라서 아래의 Cilium + Multus + SR-IOV 조합은 **고객/프로젝트가 직접 책임지고 검증·운영해야 하는 구성**이며, AWS의 검증된 배포나 지원을 의미하지 않습니다.
:::

아래는 참고용 NVIDIA Network Operator 구성 예시입니다. 이 값들은 **특정 차트 버전에서 검증된 완성 구성이 아니라 출발점**이므로, 적용 전에 사용한 Network Operator 차트/CRD 버전을 고정하고 각 값을 해당 버전의 공식 `values.yaml`·`sriov-network-device-plugin` 문서와 대조해 검증해야 합니다. 특히 다음을 확인하십시오.

- `deployCR` 등 최상위 키와 피연산자(operand) 설정 키는 차트 버전에 따라 존재 여부·이름이 다릅니다. 사용 중인 버전의 `values.yaml`에 실제로 존재하는 키인지 확인해야 합니다.
- `deviceIDs`/`vendors`의 문자열·숫자 표기를 혼용하지 말고 플러그인 문서가 요구하는 형식으로 통일합니다.
- `pfNames`는 와일드카드 패턴이 아니라 **정확한 물리 인터페이스 선택자**입니다. `mlx-*` 같은 임의 와일드카드가 아니라, 노드에서 실제 확인된 PF 이름(및 필요 시 VF 범위 표기)을 사용해야 합니다.
- VF 수명주기(생성·GUID 할당)의 소유자를 하나로 정해야 합니다. 앞의 systemd 서비스로 VF를 만든다면 Operator가 동일 작업을 중복 수행하지 않도록 구성합니다.
- 이 예시만으로는 SR-IOV 연결이 완성되지 않습니다. 실제로 파드에 VF를 연결하려면 일치하는 `NicClusterPolicy`/`NetworkAttachmentDefinition`과 워크로드 매니페스트가 추가로 필요합니다.

[RDMA shared-device plugin의 선택자 계약](https://github.com/Mellanox/k8s-rdma-shared-dev-plugin/blob/5dce4b4130111440ec5caa1c56d0f2fc42310bd7/README.md#devices-selectors)은 16진수 vendor/device ID와 호스트 네트워크 인터페이스 이름을 문자열 목록으로 받습니다. [SR-IOV device plugin의 선택자 계약](https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin/blob/2ae9a457cd5a4c3780dcf1dfa193de07804990ae/README.md#network-devices-selectors)은 정확한 PF 네트워크 인터페이스 이름을 받으며, 필요하면 `#` 뒤에 VF 범위를 지정할 수 있습니다. 아래 `REPLACE_WITH_...` 문자열은 작동하는 인터페이스 이름이 아니라 운영자가 반드시 채워야 할 입력입니다. 적용 전에 노드에서 확인한 네트워크 인터페이스 이름으로 교체하고 리소스 선택 범위를 맞춰야 합니다. `mlx5_0` 같은 RDMA 장치 이름만으로 PF 네트워크 인터페이스를 식별할 수는 없습니다. 이 선택자 계약은 2026-10-31에 확인했으며, 버전이 고정되지 않은 Operator 차트나 전체 구성의 유효성을 검증한 것은 아닙니다.

```yaml
# Network Operator Helm 차트용 values.yaml
deployCR: true
deployGPUOperator: false

nfd:
  enabled: true
  deployNodeFeatureRules: true

sriovNetworkOperator:
  enabled: true

ofedDriver:
  deploy: false  # 시스템 MLNX_OFED 사용

rdmaSharedDevicePlugin:
  deploy: true
  resources:
    - name: dgx_h200_ib
      vendors: ["15b3"]
      deviceIDs: ["1017", "1018", "101b", "101c"]
      ifNames: ["REPLACE_WITH_EXACT_NETDEV_NAME"]

multus:
  deploy: false  # Cilium과 함께 이미 배포됨

sriovDevicePlugin:
  deploy: true
  config: |
    {
      "resourceList": [{
        "resourceName": "dgx_h200_vfs",
        "selectors": {
          "vendors": ["15b3"],
          "devices": ["101c"],
          "pfNames": ["REPLACE_WITH_EXACT_PF_NETDEV_NAME_1"],
          "isRdma": true
        }
      }]
    }
```

앞의 지원 범위 경고가 이 매니페스트에도 동일하게 적용됩니다. 아래 `SriovNetworkNodePolicy`는 예시이며, `pfNames`는 와일드카드가 아니라 노드에서 실제 확인된 PF 이름(필요 시 `#`로 VF 범위 지정)으로 교체해야 하고, `instance-type` 레이블 값도 실제 노드 레이블과 일치해야 합니다.

```yaml
apiVersion: sriovnetwork.openshift.io/v1
kind: SriovNetworkNodePolicy
metadata:
  name: dgx-h200-hybrid-policy
spec:
  nodeSelector:
    node.kubernetes.io/instance-type: "dgx-h200"
    eks.amazonaws.com/compute-type: "hybrid"
  resourceName: dgx_h200_vfs
  deviceType: netdevice
  mtu: 9000
  numVfs: 8
  nicSelector:
    vendor: "15b3"
    pfNames: ["REPLACE_WITH_EXACT_PF_NETDEV_NAME_1", "REPLACE_WITH_EXACT_PF_NETDEV_NAME_2", "REPLACE_WITH_EXACT_PF_NETDEV_NAME_3", "REPLACE_WITH_EXACT_PF_NETDEV_NAME_4"]
  linkType: ib
  isRdma: true
```

## InfiniBand에서 Ethernet으로의 폴백 방지

먼저 Ethernet이 표시된 물리 포트를 식별합니다. DGX H200에는 전용 Ethernet 어댑터도 있습니다. InfiniBand로 사용할 포트라면 펌웨어 설정을 바꾸기 전에 현재 링크 계층과 설정된 링크 유형을 대조합니다.

### 해결 방법: 펌웨어·링크 설정 점검 {#해결-방법-펌웨어-업데이트-및-구성}

:::danger 패브릭 영향 및 복구 위험
`mlxconfig set` 예시는 다음 부팅에 적용할 NIC 설정을 변경합니다. 실행 전에 InfiniBand 어댑터를 식별하고 기존 설정을 보관합니다. 패브릭 담당자와 유지보수 시간과 복구 절차를 합의합니다. 서브넷 매니저에서 OpenSM 설정을 바꾸면 패브릭 전체에 영향을 줄 수 있습니다.
:::

```bash
# 1) 현재 펌웨어 이미지 버전 확인 (이미지 갱신이 필요한지 판단)
sudo mlxfwmanager --query

# 2) IB_PCI에 확인한 어댑터 주소를 지정하고 포트 1 변경 전 설정을 보관
: "${IB_PCI:?Set IB_PCI to the confirmed adapter PCI address}"
sudo mlxconfig -d "$IB_PCI" q > "mlxconfig-${IB_PCI}-before.txt" &&
  sudo mlxconfig -d "$IB_PCI" set LINK_TYPE_P1=1 SRIOV_EN=1 NUM_OF_VFS=8
# mlxconfig 변경은 재부팅/전원 재투입 후 적용됩니다.

# 4) 서브넷 매니저 호스트에서 실행 중인 서비스가 읽는 설정 파일 확인
systemctl cat opensm
# 실제 설정 파일이 /etc/opensm/opensm.conf인 경우:
grep -E '^[[:space:]]*virt_enabled[[:space:]]' /etc/opensm/opensm.conf
```

가상화가 필요하면 패브릭 담당자가 유지보수 시간에 실제 OpenSM 설정에 `virt_enabled 2`를 반영하고 해당 포트 상태를 다시 확인합니다. 드롭인 디렉터리에 파일만 두어도 되는지는 실행 중인 서비스가 그 파일을 읽는지에 달려 있습니다.

:::warning Critical
MLNX_OFED 24.10 릴리스 노트의 "General Support"는 특정 어댑터 펌웨어 버전을 **번들/테스트된(bundled, tested-with) 버전**으로 명시하며, 이는 모든 환경에 적용되는 절대 최소 요구치가 아닙니다. 같은 문서는 **BlueField-2와 ConnectX-7이 MLNX_OFED가 지원하는 마지막 세대**임을 밝히고 있어, BlueField-3은 이 MLNX_OFED 세대의 지원 범위에 포함되지 않습니다(BlueField-3은 별도의 DOCA 릴리스·펌웨어 체계를 따릅니다). 따라서 "ConnectX-7은 28.43.1014 이상, BlueField-3은 32.43.1014 필요"처럼 단정하지 말고, 실제 어댑터의 PSID와 사용 중인 드라이버 릴리스에 대응하는 공식 펌웨어 매트릭스를 확인해 적용하십시오. 예시의 버전 번호는 참고용이며 환경의 실제 지원 조합으로 교체해야 합니다.
:::

## 교훈

1. **항상 드라이버-커널 호환성 확인**: 드라이버가 성공적으로 로드되더라도 API 비호환성은 디버깅하기 어려운 미묘한 문제를 일으킬 수 있습니다.
2. **솔루션을 계층화**: 단일 접근 방식으로는 복잡한 네트워킹 문제를 해결하기 어렵습니다. 3계층 솔루션은 문제의 다양한 측면을 다룹니다.
3. **GUID 할당의 중요성**: Zero GUID(`0x000000`)는 VF 식별 실패를 유발합니다. 항상 고유 GUID를 프로그래밍 방식으로 할당합니다.
4. **타이밍이 전부**: 작업 순서(드라이버 로드 → VF 생성 → GUID 할당 → udev 처리 → kubelet 시작)가 중요합니다.
5. **펌웨어 변경 전 포트 모드 기록**: 같은 포트의 현재 링크 계층, 다음 부팅 설정, PSID, 펌웨어 버전을 보관합니다. 변경은 스테이징에서 시험합니다.

## 모니터링 및 검증

구현 후 다음 핵심 메트릭을 모니터링합니다.

```bash
# 호스트에서 보이는 VF별로 PF·VF 번호와 PCI 주소, 인터페이스 이름 대조
for vf in /sys/bus/pci/devices/*/virtfn*; do
  [ -L "$vf" ] || continue
  printf '%s -> %s\n' "$vf" "$(readlink -f "$vf")"
  ls -1 "$vf/net" 2>/dev/null
done

# 어댑터·포트 번호와 함께 링크 계층, 상태, GUID 확인
ibstat

# GUID 할당 검증
# 주의: ports/1/gids/0 은 PF의 GID(index 0)이며 VF별 GUID가 아닙니다. 또한 GID는
# IPv6 형식 128비트 값이라 접두부에 "0000:0000:..."이 정상적으로 포함될 수 있어,
# 해당 문자열을 grep -c 하는 방식으로는 "0 GUID"를 판별할 수 없습니다.
# 대신 설정한 각 VF의 node/port GUID 파일을 직접 읽어 (1) 0이 아니고
# (2) 패브릭 전역에서 중복이 없는지 확인합니다. PFS는 앞의 서비스와 동일하게 지정.
PFS="mlx5_0 mlx5_1 mlx5_2 mlx5_3 mlx5_4 mlx5_5 mlx5_6 mlx5_7"
for pf in $PFS; do
  for vf in 0 1 2 3 4 5 6 7; do
    base=/sys/class/infiniband/$pf/device/sriov/$vf
    for field in node port; do
      guid=$(cat "$base/$field") || continue
      printf '%s vf%s %s %s\n' "$pf" "$vf" "$field" "$guid"
      case "$guid" in ""|00:00:00:00:00:00:00:00)
        echo "  !! zero/empty $field GUID on $pf vf$vf" >&2 ;;
      esac
    done
  done
done
# 모든 호스트의 GUID 열을 모아 sort | uniq -d 로 중복 확인

# 포트/링크 상태는 GUID 검증과 분리해 별도로 확인
ibstat | grep -E "State:|Port GUID:"

# Kubernetes에서 SR-IOV 리소스 할당 모니터링
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## 결론

기록에서 확인한 것은 `mlx5_core`의 probe 실패입니다. 이름이 유지되는지는 재부팅과 파드 재배포 전후에 같은 VF에서 확인합니다. 링크 계층과 포트 상태는 영향을 받은 포트에서 각각 확인합니다. Ethernet 표시와 `PORT_DOWN`의 원인은 아직 미확인입니다.

Operator 예제의 검증은 별도 항목(`HR-SRIOV-07`)입니다. 설치한 차트·CRD, 적용한 정책·`NetworkAttachmentDefinition`, 대상 파드가 의도한 VF를 받았다는 증거를 기록합니다. 노드의 할당 가능 수량만으로는 파드 연결을 확인할 수 없습니다.

## 참고 자료

### 공식 문서
- [NVIDIA Linux InfiniBand Drivers Documentation](https://networking-docs.nvidia.com/mlnxofedswum/24.10-5.1.6.1lts) — MLNX_OFED 공식 문서
- [systemd Predictable Network Interface Names](https://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/) — systemd 예측 가능한 네트워크 인터페이스 명명
- [Amazon EKS Hybrid Nodes Overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — EKS Hybrid Nodes 공식 가이드
- [systemd.link Manual Page](https://www.freedesktop.org/software/systemd/man/systemd.link.html) — systemd.link 매뉴얼
- [Kubernetes SR-IOV Network Device Plugin](https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin) — SR-IOV Device Plugin 저장소
- [SR-IOV CNI Plugin Documentation](https://github.com/k8snetworkplumbingwg/sriov-cni) — SR-IOV CNI 플러그인 문서
- [NVIDIA SR-IOV Configuration Guide](https://networking-docs.nvidia.com/mlnxofedswum/24.10-5.1.6.1lts/single-root-io-virtualization-sr-iov) — NVIDIA SR-IOV 구성 가이드
- [NVIDIA Firmware Support and Downloads](https://network.nvidia.com/support/firmware/firmware-downloads/) — NVIDIA 펌웨어 다운로드

### 기술 블로그
- [AWS Blog: A Deep Dive into Amazon EKS Hybrid Nodes](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — EKS Hybrid Nodes 심화 가이드
- Medium: SRIOV on Mellanox ConnectX-6 InfiniBand — Struggles & Learnings — ConnectX SR-IOV 실전 경험
- NVIDIA Developer Forums: 6.8 Kernel Breaking Changes on Mellanox OFED 5.8 — 커널 6.8 호환성 이슈 토론
- Red Hat Enterprise Linux: Consistent Network Interface Device Naming — RHEL 네트워크 명명 가이드

### 관련 문서 (내부)
- [Hybrid Nodes 개요](../overview-architecture/hybrid-nodes-fundamentals.md) — 개념·동작 원리·등록 워크플로우
- [Hybrid Nodes Gateway 구축](../networking/hybrid-nodes-gateway.md) — VPN·DX·게이트웨이 구성 및 운영
