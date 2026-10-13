---
title: 하이브리드 GPU 워크로드와 SR-IOV 네트워킹
description: EKS Hybrid Nodes에서 온프렘 GPU 노드를 1차 추론 계층으로 활용하고, DGX H200 SR-IOV VF 이름 불일치 문제를 드라이버 호환성·영구 명명·systemd 오케스트레이션으로 해결하는 실전 가이드
created: "2025-09-01"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 18
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

본 문서는 EKS Hybrid Nodes의 GPU 워크로드 아키텍처와 고성능 네트워킹 구성을 다룹니다. 전반부는 보유 GPU 자산을 1차 추론 계층으로 활용하는 3-Tier 아키텍처를, 후반부는 NVIDIA DGX H200 시스템에서 SR-IOV VF(Virtual Function) 인터페이스 이름이 재부팅마다 변경되어 CNI 스택이 손상되는 문제의 근본 원인 분석과 해결 방안을 실사례 기반으로 설명합니다.

## 하이브리드 GPU 워크로드 아키텍처

보유 GPU 서버(DGX 등)를 하이브리드 노드로 등록하면 고정 비용 자산을 1차 추론 계층으로 활용하고, 클라우드 GPU(Spot)와 Amazon Bedrock을 버스트·폴백 계층으로 결합할 수 있습니다.

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

DGX H200 클러스터(클러스터 패브릭의 8개 단일 포트 ConnectX-7 400G InfiniBand 포트)를 Amazon EKS Hybrid Nodes와 통합하고 ML 워크로드를 실행할 준비를 마쳤을 때, 파드가 배포에 실패하기 시작했습니다. 원인은 SR-IOV VF 인터페이스가 파드 배포 중 예측 불가능하게 이름을 변경하기 때문입니다.

환경 구성:

- **하드웨어**: NVIDIA DGX H200 (8-GPU 시스템). NVIDIA DGX H100/H200 User Guide 기준 네트워크 어댑터는 클러스터 패브릭용 8개의 단일 포트 ConnectX-7 InfiniBand 카드(4개의 OSFP 포트)와 스토리지·인밴드 관리용 2개의 듀얼 포트 ConnectX-7 이더넷 카드로 구성됩니다. 이 사례의 SR-IOV 구성은 InfiniBand 클러스터 패브릭 포트를 대상으로 합니다. BlueField-3 DPU는 이 DGX 기본 구성에 포함되지 않는 별도 옵션으로, 주로 SuperPOD 환경에서 사용되며 별도의 DOCA/펌웨어 요구사항을 가집니다.
- **소프트웨어 스택**: Ubuntu 24.04, Kernel 6.8.0-55-generic, Amazon EKS Hybrid Nodes
- **네트워킹**: Cilium v1.17.x (primary CNI), Multus + SR-IOV CNI (secondary networks)

증상:

- VF 인터페이스 이름이 파드 배포 후 무작위로 변경됨
- CNI 및 Device Plugin 바인딩이 일관되게 실패함
- 일부 포트가 Ethernet 모드로 폴백됨
- SR-IOV VF가 간헐적으로 PORT_DOWN 상태를 표시함

## 원인 분석: 드라이버 호환성 문제

며칠간의 디버깅 끝에 근본 원인이 발견되었습니다. **MLNX_OFED 25.01이 kernel 6.8.0과 근본적으로 호환되지 않았습니다.** 드라이버가 로드되는 것처럼 보였기 때문에 즉시 명확하지 않았지만, 중요한 커널 API 변경으로 인해 기능이 손상되었습니다.

```bash
# dmesg에서 확인된 내용 (간략화)
[  123.456789] mlx5_core: Unknown symbol strlcpy (err -2)
[  123.456790] mlx5_core: probe of 0000:18:00.2 failed with error -2
```

kernel 6.8.0은 MLNX_OFED 25.01이 의존하는 여러 함수(`strlcpy`, `xdp_do_flush_map` 등)를 제거했습니다. 이 비호환성은 예측 불가능한 VF probe 시퀀스와 명명 할당으로 이어졌습니다.

## 3계층 해결 방안

이 문제를 해결하기 위해 포괄적인 3계층 접근 방식이 개발되었습니다.

### 계층 1: 기반 수정 - 드라이버 업그레이드

먼저 드라이버 비호환성을 해결합니다. 아래 절차는 활성 InfiniBand 드라이버를 제거하고 교체하므로, 반드시 **노드 드레인 → 콘솔(BMC/IPMI) 접근 확보 → 기존 드라이버·설정 백업 → 적용 → 검증** 순서의 통제된 유지보수 작업으로 수행해야 합니다. 원격 SSH만으로 진행하면 드라이버 제거 시점에 네트워크가 끊겨 노드에 다시 접근하지 못할 수 있습니다. 명령에 사용된 OFED/커널 버전·PCI 주소·파일명은 예시이며, 대상 노드의 실제 값과 지원 조합(MLNX_OFED 릴리스 노트의 OS·커널 매트릭스)으로 반드시 교체해야 합니다.

:::danger 서비스 중단 및 복구 불가 위험
`ofed_uninstall.sh --force`는 의존성 확인 없이 현재 적재된 네트워크 드라이버를 제거하므로 원격 접근이 끊길 수 있습니다. 실행 전에 (1) `kubectl drain`으로 워크로드를 비우고, (2) BMC/IPMI 등 대역 외(out-of-band) 콘솔 접근을 확보하며, (3) 현재 드라이버 버전·`/etc/opensm`·systemd 설정·펌웨어 설정을 백업하고, (4) 실패 시 복귀할 수 있는 롤백 계획(이전 OFED 패키지 보관, 재설치 절차)을 준비하십시오.
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

아래 PF 목록·GUID 공식·sysfs 경로는 예시이며, 대상 노드에서 실제 값으로 교체해야 합니다.

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
Environment=PFS="mlx5_0 mlx5_1 mlx5_2 mlx5_3 mlx5_4 mlx5_5 mlx5_6 mlx5_7"
Environment=HOSTID=00  # 패브릭 전역 고유성을 위한 호스트 식별자(실제 값으로 교체)
ExecStart=/bin/bash -euo pipefail -c '\
  for pf in $PFS; do \
    echo 8 > /sys/class/infiniband/$pf/device/sriov_numvfs; \
    sleep 0.5; \
  done'
ExecStart=/usr/bin/udevadm settle --timeout=30
ExecStart=/bin/bash -euo pipefail -c '\
  idx=0; \
  for pf in $PFS; do \
    for vf in 0 1 2 3 4 5 6 7; do \
      base=/sys/class/infiniband/$pf/device/sriov/$vf; \
      [ -e "$base/node" ] || { echo "missing $base/node" >&2; exit 1; }; \
      printf "00:11:22:%s:%02x:1\n" "$HOSTID" "$idx" > "$base/node"; \
      printf "00:11:22:%s:%02x:2\n" "$HOSTID" "$idx" > "$base/port"; \
      idx=$((idx+1)); \
    done; \
  done'
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

# 즉시 적용 + 결과 확인(enable만으로는 현재 세션이 설정되지 않음)
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
      vendors: [15b3]
      deviceIDs: [1017,1018,101b,101c]
      ifNames: [mlx-*]

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
          "pfNames": ["mlx-*"],
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
    pfNames: ["mlx-pf0", "mlx-pf1", "mlx-pf2", "mlx-pf3"]
  linkType: ib
  isRdma: true
```

## InfiniBand에서 Ethernet으로의 폴백 방지

특히 당혹스러운 문제는 포트가 무작위로 Ethernet 모드로 폴백되는 것이었습니다. 이는 ConnectX-7 어댑터와 드라이버 기대치 간의 펌웨어 불일치로 인해 발생했습니다.

### 해결 방법: 펌웨어·링크 설정 점검 {#해결-방법-펌웨어-업데이트-및-구성}

:::danger 패브릭 영향 및 복구 위험
아래 명령은 NIC 펌웨어 **설정(mlxconfig)**과 서브넷 매니저(OpenSM) 구성을 변경합니다. 이는 펌웨어 이미지 자체를 갱신하는 작업과 다릅니다. 설정 변경은 대부분 재부팅 또는 전원 재투입 후에만 적용되며, OpenSM 구성을 덮어쓰면 기존 패브릭 관리자 설정이 사라져 패브릭 전체에 영향을 줄 수 있습니다. 실행 전에 (1) 기존 `mlxconfig -d <dev> q` 출력과 `/etc/opensm/opensm.conf`를 백업하고, (2) 패브릭의 서브넷 매니저 소유 주체(이 호스트인지, 외부 관리 노드인지)를 확인하며, (3) 적용/재부팅 시점과 롤백 절차를 사전에 정하십시오. PCI 주소와 포트 수(단일/듀얼)는 어댑터마다 다르므로 `lspci`/`mlxconfig`로 실제 장치를 먼저 인벤토리해야 합니다.
:::

```bash
# 1) 현재 펌웨어 이미지 버전 확인 (이미지 갱신이 필요한지 판단)
sudo mlxfwmanager --query

# 2) 변경 전 현재 설정 백업
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  sudo mlxconfig -d $dev q > /root/mlxconfig-$dev.bak
done
sudo cp -a /etc/opensm/opensm.conf /root/opensm.conf.bak 2>/dev/null || true

# 3) (설정 변경, 펌웨어 이미지 갱신 아님) InfiniBand 모드와 SR-IOV 활성화
#    - 단일 포트 어댑터는 LINK_TYPE_P2가 없을 수 있으므로 포트 수에 맞게 조정
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  sudo mlxconfig -d $dev set LINK_TYPE_P1=1
  sudo mlxconfig -d $dev set SRIOV_EN=1 NUM_OF_VFS=8
done
# mlxconfig 변경은 재부팅/전원 재투입 후 적용됩니다.

# 4) OpenSM 가상화 지원: 이 호스트가 서브넷 매니저를 소유하는 경우에만, 기존 설정을 보존하며 추가
#    (아래처럼 통째로 덮어쓰지 말고 백업본을 기준으로 필요한 키만 병합)
sudo install -m 0644 /dev/stdin /etc/opensm/opensm.conf.d/10-virt.conf << 'EOF'
# 가상화 지원 (기존 opensm.conf를 덮어쓰지 않고 드롭인으로 추가)
virt_enabled 2
virt_max_ports_in_process 256
virt_default_hop_limit 64
EOF

sudo systemctl restart opensm
```

:::warning Critical
MLNX_OFED 24.10 릴리스 노트의 "General Support"는 특정 어댑터 펌웨어 버전을 **번들/테스트된(bundled, tested-with) 버전**으로 명시하며, 이는 모든 환경에 적용되는 절대 최소 요구치가 아닙니다. 같은 문서는 **BlueField-2와 ConnectX-7이 MLNX_OFED가 지원하는 마지막 세대**임을 밝히고 있어, BlueField-3은 이 MLNX_OFED 세대의 지원 범위에 포함되지 않습니다(BlueField-3은 별도의 DOCA 릴리스·펌웨어 체계를 따릅니다). 따라서 "ConnectX-7은 28.43.1014 이상, BlueField-3은 32.43.1014 필요"처럼 단정하지 말고, 실제 어댑터의 PSID와 사용 중인 드라이버 릴리스에 대응하는 공식 펌웨어 매트릭스를 확인해 적용하십시오. 예시의 버전 번호는 참고용이며 환경의 실제 지원 조합으로 교체해야 합니다.
:::

## 교훈

1. **항상 드라이버-커널 호환성 확인**: 드라이버가 성공적으로 로드되더라도 API 비호환성은 디버깅하기 어려운 미묘한 문제를 일으킬 수 있습니다.
2. **솔루션을 계층화**: 단일 접근 방식으로는 복잡한 네트워킹 문제를 해결하기 어렵습니다. 3계층 솔루션은 문제의 다양한 측면을 다룹니다.
3. **GUID 할당의 중요성**: Zero GUID(`0x000000`)는 VF 식별 실패를 유발합니다. 항상 고유 GUID를 프로그래밍 방식으로 할당합니다.
4. **타이밍이 전부**: 작업 순서(드라이버 로드 → VF 생성 → GUID 할당 → udev 처리 → kubelet 시작)가 중요합니다.
5. **스테이징 환경에서 펌웨어 업데이트 테스트**: 펌웨어 불일치는 진단하기 어려운 프로토콜 폴백을 유발할 수 있습니다.

## 모니터링 및 검증

구현 후 다음 핵심 메트릭을 모니터링합니다.

```bash
# VF 명명 일관성 확인
ip link show | grep -E "mlx-|sriov-" | wc -l

# PORT_DOWN 문제 확인
ibstat | grep -c "State: Active"

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
    node=$(cat "$base/node" 2>/dev/null)
    echo "$pf vf$vf node=$node"
    case "$node" in ""|00:00:00:00:00:00:00:00)
      echo "  !! zero/empty GUID on $pf vf$vf" >&2 ;;
    esac
  done
done
# 전역 중복 검사: 위 출력의 node 값에서 중복이 없어야 함
# (수집한 모든 호스트의 GUID를 합쳐 'sort | uniq -d' 결과가 비어 있어야 함)

# 포트/링크 상태는 GUID 검증과 분리해 별도로 확인
ibstat | grep -E "State:|Port GUID:"

# Kubernetes에서 SR-IOV 리소스 할당 모니터링
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## 결론

Amazon EKS Hybrid Nodes를 실행하는 DGX H200 시스템에서 SR-IOV VF 명명 불일치를 해결하려면 드라이버 호환성, systemd 네트워킹, Kubernetes CNI 상호 작용에 대한 깊은 조사가 필요했습니다. 핵심 인사이트는 겉보기에 관련 없어 보이는 증상(명명 변경, 프로토콜 폴백, PORT_DOWN 상태)이 모두 근본적인 드라이버-커널 비호환성에서 비롯되었다는 것을 인식하는 것이었습니다.

이 문서의 대응은 드라이버 수정, 재부팅 후에도 유지되는 VF 이름 설정, VF 생성 과정 제어로 나뉩니다. 구성을 적용한 뒤에는 재부팅과 Pod 재배포 후에도 이름이 유지되는지 확인하고, PORT_DOWN 상태와 GUID 할당 결과를 함께 점검합니다.

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
