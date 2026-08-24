---
title: 하이브리드 GPU 워크로드와 SR-IOV 네트워킹
description: EKS Hybrid Nodes에서 온프렘 GPU 노드를 1차 추론 계층으로 활용하고, DGX H200 SR-IOV VF 이름 불일치 문제를 드라이버 호환성·영구 명명·systemd 오케스트레이션으로 해결하는 실전 가이드
created: "2025-09-01"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 7
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
- **레이턴시**: VPN/DX 경유로 클라우드 노드 대비 왕복 지연 추가 — 게이트웨이 라우팅 정책에 반영 필요
- **분산 추론 제약**: 멀티노드 NCCL 통신은 고대역폭 필요 — 온프렘 내부 Pipeline Parallelism은 가능하나 온프렘↔클라우드 간 PP는 비권장
- **권장 패턴**: 온프렘 노드는 독립 모델을 서빙하고, 클라우드와는 Gateway 레벨 cascade routing으로만 연결
:::

Gateway 레벨 폴백·관측성은 [Agent 모니터링 & 운영](../../agentic-ai-platform/operations-mlops/observability/agent-monitoring)을, GPU 리소스 관리(DRA 포함)는 [GPU 리소스 관리](../../agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management)를 참조합니다.

이하에서는 InfiniBand·SR-IOV 기반 고성능 GPU 네트워킹 구성을 DGX H200 실사례로 다룹니다.

## 아키텍처 개요

Amazon EKS 컨트롤 플레인은 Hybrid Nodes 기능을 통해 온프렘 DGX H200 노드를 관리합니다. 각 DGX 노드는 8개의 H200 GPU와 8개의 400G InfiniBand HCA(ConnectX-7)를 포함하며, SR-IOV는 Physical Function당 8개의 VF를 생성하도록 구성됩니다. 문제는 SR-IOV VF와 Kubernetes CNI 스택(Cilium, Multus, SR-IOV CNI 플러그인) 간 상호 작용에서 발생합니다.

## 문제 상황: VF 이름 불일치

DGX H200 클러스터(8x 400G InfiniBand HCA)를 Amazon EKS Hybrid Nodes와 통합하고 ML 워크로드를 실행할 준비를 마쳤을 때, 파드가 배포에 실패하기 시작했습니다. 원인은 SR-IOV VF 인터페이스가 파드 배포 중 예측 불가능하게 이름을 변경하기 때문입니다.

환경 구성:

- **하드웨어**: NVIDIA DGX H200 (8-GPU 시스템), 2x dual-port ConnectX-7 (400G InfiniBand HCA). BlueField-3 DPU는 옵션 구성이며 SuperPOD 환경에서 주로 사용됩니다.
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

먼저 드라이버 비호환성을 해결합니다.

```bash
# 호환되지 않는 드라이버 제거
sudo ofed_uninstall.sh --force

# kernel 6.8.0 지원이 포함된 MLNX_OFED 24.10 설치
wget https://content.mellanox.com/ofed/MLNX_OFED-24.10-0.7.0.0/MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
tar -xzf MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
cd MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64
sudo ./mlnxofedinstall --add-kernel-support --without-fw-update
```

:::tip Pro tip
`--add-kernel-support` 플래그는 커스텀 커널에 필수입니다. 특정 커널 버전에 맞게 드라이버 모듈을 재빌드합니다.
:::

### 계층 2: systemd.link로 영구 명명 구현

PCI 주소 기반으로 일관된 VF 이름을 보장하는 systemd.link 파일을 생성합니다.

```bash
# 메인 VF 명명 정책 생성
cat > /etc/systemd/network/70-dgx-sriov-vf.link << 'EOF'
[Match]
Driver=mlx5_core
Property=DEVTYPE=vf

[Link]
Name=mlx-{attr/phys_port_name}
AlternativeName=k8s-vf-{attr/dev_port}
MACAddressPolicy=persistent
EOF

# PCI 기반 폴백 명명 추가
cat > /etc/systemd/network/71-dgx-pci-vf.link << 'EOF'
[Match]
Path=pci-0000:*:*.*
Driver=mlx5_core
Property=ID_NET_NAME_SLOT=*v*

[Link]
NamePolicy=keep
Name=sriov-{phys_port_name}
EOF
```

이 파일들은 VF가 probe 순서가 아닌 물리적 속성에 기반한 예측 가능한 이름을 받도록 보장합니다.

### 계층 3: systemd로 VF 생성 오케스트레이션

적절한 타이밍과 GUID 할당으로 VF 생성을 처리하는 systemd 서비스를 생성합니다.

```bash
cat > /etc/systemd/system/dgx-sriov-setup.service << 'EOF'
[Unit]
Description=DGX H200 SR-IOV VF Setup
After=network-pre.target
Before=kubelet.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c 'for i in 0 3 4 5 6 9 10 11; do \
  echo 8 > /sys/class/infiniband/mlx5_${i}/device/sriov_numvfs; \
  sleep 0.5; \
done'
ExecStart=/usr/bin/udevadm settle --timeout=30
ExecStart=/bin/bash -c 'for i in {0..63}; do \
  vf=$((i/8)); port=$((i%8)); \
  echo "00:11:22:33:44:${vf}${vf}:1:${port}" > \
    /sys/class/infiniband/mlx5_${vf}/device/sriov/${port}/node_guid; \
  echo "00:11:22:33:44:${vf}${vf}:2:${port}" > \
    /sys/class/infiniband/mlx5_${vf}/device/sriov/${port}/port_guid; \
done'
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable dgx-sriov-setup.service
```

이 서비스는 kubelet이 시작되기 전에 VF가 생성되도록 보장하고, `0x000000` GUID 문제를 방지하기 위해 고유 GUID를 할당합니다.

## Amazon EKS Hybrid Nodes 통합

Amazon EKS Hybrid Nodes는 SR-IOV 워크로드에 대한 특별한 고려가 필요합니다. 작동하는 NVIDIA Network Operator 구성은 다음과 같습니다.

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

Amazon EKS Hybrid Nodes용으로 특정 NetworkNodePolicy도 생성합니다.

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

### 해결 방법: 펌웨어 업데이트 및 구성

```bash
# 현재 펌웨어 버전 확인
sudo mlxfwmanager --query

# ConnectX-7용 펌웨어 업데이트 (PCI 주소는 환경에 맞게 조정)
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  # InfiniBand 모드 강제 설정
  sudo mlxconfig -d $dev set LINK_TYPE_P1=1 LINK_TYPE_P2=1
  # 8개 VF로 SR-IOV 활성화
  sudo mlxconfig -d $dev set SRIOV_EN=1 NUM_OF_VFS=8
done

# 가상화 지원을 위한 OpenSM 구성
cat > /etc/opensm/opensm.conf << 'EOF'
# 가상화 지원 활성화
virt_enabled 2
virt_max_ports_in_process 256
virt_default_hop_limit 64
EOF

sudo systemctl restart opensm
```

:::warning Critical
ConnectX-7 어댑터는 안정적인 SR-IOV 작동을 위해 펌웨어 버전 **28.43.1014 이상**이 필요합니다. BlueField-3은 **v32.43.1014**가 필요합니다.
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
for i in {0..7}; do
  cat /sys/class/infiniband/mlx5_${i}/ports/1/gids/0
done | grep -c "0000:0000:0000:0000"  # 0이어야 함

# Kubernetes에서 SR-IOV 리소스 할당 모니터링
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## 결론

Amazon EKS Hybrid Nodes를 실행하는 DGX H200 시스템에서 SR-IOV VF 명명 불일치를 해결하려면 드라이버 호환성, systemd 네트워킹, Kubernetes CNI 상호 작용에 대한 깊은 조사가 필요했습니다. 핵심 인사이트는 겉보기에 관련 없어 보이는 증상(명명 변경, 프로토콜 폴백, PORT_DOWN 상태)이 모두 근본적인 드라이버-커널 비호환성에서 비롯되었다는 것을 인식하는 것이었습니다.

3계층 솔루션(드라이버 수정, 영구 명명 구현, VF 생성 오케스트레이션)은 여러 DGX H200 배포에서 안정적으로 검증되었습니다. 여정은 어려웠지만, 결과는 하이브리드 클라우드 환경에서 고성능 네트워킹을 위한 견고한 프로덕션 준비 구성입니다.

## 참고 자료

### 공식 문서
- [NVIDIA Linux InfiniBand Drivers Documentation](https://docs.nvidia.com/networking/display/MLNXOFEDv24100000) — MLNX_OFED 공식 문서
- [systemd Predictable Network Interface Names](https://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/) — systemd 예측 가능한 네트워크 인터페이스 명명
- [Amazon EKS Hybrid Nodes Overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — EKS Hybrid Nodes 공식 가이드
- [systemd.link Manual Page](https://www.freedesktop.org/software/systemd/man/systemd.link.html) — systemd.link 매뉴얼
- [Kubernetes SR-IOV Network Device Plugin](https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin) — SR-IOV Device Plugin 저장소
- [SR-IOV CNI Plugin Documentation](https://github.com/k8snetworkplumbingwg/sriov-cni) — SR-IOV CNI 플러그인 문서
- [NVIDIA SR-IOV Configuration Guide](https://docs.nvidia.com/networking/display/MLNXOFEDv24100000/SR-IOV) — NVIDIA SR-IOV 구성 가이드
- [NVIDIA Firmware Support and Downloads](https://network.nvidia.com/support/firmware/firmware-downloads/) — NVIDIA 펌웨어 다운로드

### 기술 블로그
- [AWS Blog: A Deep Dive into Amazon EKS Hybrid Nodes](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — EKS Hybrid Nodes 심화 가이드
- Medium: SRIOV on Mellanox ConnectX-6 InfiniBand — Struggles & Learnings — ConnectX SR-IOV 실전 경험
- NVIDIA Developer Forums: 6.8 Kernel Breaking Changes on Mellanox OFED 5.8 — 커널 6.8 호환성 이슈 토론
- Red Hat Enterprise Linux: Consistent Network Interface Device Naming — RHEL 네트워크 명명 가이드

### 관련 문서 (내부)
- [Hybrid Nodes 개요](../overview-architecture/hybrid-nodes-fundamentals.md) — 개념·동작 원리·등록 워크플로우
- [Hybrid Nodes Gateway 구축](../networking/hybrid-nodes-gateway.md) — VPN·DX·게이트웨이 구성 및 운영
