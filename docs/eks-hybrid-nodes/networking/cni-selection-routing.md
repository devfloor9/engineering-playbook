---
title: CNI 구성과 Pod CIDR 라우팅
description: "EKS Hybrid Nodes의 CNI 선택 기준과 Cilium 핵심 구성 — 하이브리드 노드 전용 affinity, cluster-pool IPAM, Pod CIDR 라우팅 방식(BGP·정적·Gateway) 선택과 Cilium BGP Control Plane 구성 절차를 다룹니다."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 7
tags:
  - eks
  - hybrid-node
  - cilium
  - networking
  - bgp
  - scope:impl
keywords:
  - bgpControlPlane
  - CiliumBGPClusterConfig
  - clusterPoolIPv4PodCIDRList
sidebar_label: CNI & Pod CIDR 라우팅
category: hybrid-multicloud
---

## 개요

하이브리드 노드는 CNI가 실행되기 전까지 `NotReady` 상태를 유지하며, Amazon VPC CNI는 하이브리드 노드와 호환되지 않습니다. 따라서 CNI 선택과 Pod CIDR 라우팅 방식 결정은 클러스터가 워크로드를 수용하기 위한 선결 과제입니다. 본 문서는 CNI 선택 기준, Cilium 설치의 핵심 구성(affinity·IPAM), 그리고 Pod CIDR 라우팅 3가지 방식 중 BGP·정적 라우팅의 구성 절차를 다룹니다. 세 번째 방식인 Hybrid Nodes Gateway는 [별도 챕터](./hybrid-nodes-gateway.md)에서 다룹니다.

## CNI 선택 기준

> "Cilium is the AWS-supported Container Networking Interface (CNI) for Amazon EKS Hybrid Nodes. You must install a CNI for hybrid nodes to become ready to serve workloads. Hybrid nodes appear with status `Not Ready` until a CNI is running."
> — [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html)

| CNI | 하이브리드 노드 지원 | 비고 |
|-----|--------------------|------|
| Amazon VPC CNI | **비호환** | `eks.amazonaws.com/compute-type: hybrid` 레이블에 anti-affinity가 기본 구성되어 하이브리드 노드에 스케줄되지 않음 |
| Cilium | **AWS 지원 CNI** | EKS 배포판(`public.ecr.aws/eks`)을 Helm으로 수명주기 관리. 단 클라우드 노드에서 실행되는 Cilium은 AWS 지원 대상이 아님 |
| Calico | 커뮤니티 경로 | 공식 User Guide의 Calico 가이드는 [EKS Hybrid Examples 리포지토리](https://github.com/aws-samples/eks-hybrid-examples)로 이관됨 |

선택 판단에서 고려할 제약은 두 가지입니다.

- **Gateway 의존성**: Hybrid Nodes Gateway는 Cilium VTEP 기능 전용입니다. Calico를 선택하면 Gateway 옵션이 제외되어 Pod CIDR 라우팅 방식이 BGP/정적으로 한정됩니다 ([아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md)).
- **Mixed mode 배치 격리**: Cilium은 하이브리드 노드 전용으로, VPC CNI는 클라우드 노드 전용으로 상호 배타적으로 배치해야 합니다. VPC CNI의 anti-affinity는 기본 제공되지만, Cilium 쪽은 설치 시 hybrid 레이블 affinity를 명시해야 클라우드 노드 침범을 방지할 수 있습니다.

## Cilium 설치 핵심 구성

Cilium Helm values에서 하이브리드 환경에 특화된 설정은 affinity와 IPAM 두 가지입니다.

```yaml
# cilium-values.yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: eks.amazonaws.com/compute-type
              operator: In
              values:
                - hybrid            # 하이브리드 노드에만 스케줄
ipam:
  mode: cluster-pool
  operator:
    clusterPoolIPv4MaskSize: 26      # 노드당 Pod IP 슬라이스 (/26 = 64개)
    clusterPoolIPv4PodCIDRList:
      - 10.86.0.0/16                 # RemotePodNetwork와 일치해야 함
operator:
  unmanagedPodWatcher:
    restart: false                   # 클라우드 노드(VPC CNI 관리) Pod 재시작 방지
```

```bash
helm install cilium oci://public.ecr.aws/eks/cilium/cilium \
  --version CILIUM_VERSION \
  --namespace kube-system \
  --values cilium-values.yaml
```

- `clusterPoolIPv4PodCIDRList`는 클러스터 생성 시 지정한 `RemotePodNetwork`와 일치해야 하며, 운영 중 변경이 사실상 불가능하므로 처음부터 넉넉히 배정합니다 ([Pod CIDR 선제 확보](./cidr-network-design.md#pod-cidr-선제-확보)).
- `clusterPoolIPv4MaskSize`는 노드당 최대 Pod 수와 연동됩니다(/26 = 64 IP, /25 = 128 IP). kubelet `maxPods` 설정과 정합성을 확인합니다.
- Mixed mode 클러스터에서 `unmanagedPodWatcher.restart: false`는 Cilium operator가 VPC CNI 관리 하의 클라우드 노드 Pod를 재시작하지 않도록 하는 안전장치입니다.

## Pod CIDR 라우팅 방식 선택

Pod 레벨 inbound가 필요한 환경([기능표](../overview-architecture/hybrid-nodes-fundamentals.md#node-대역-필수-pod-대역-선택-원칙))에서 Pod CIDR을 도달 가능하게 만드는 방식은 세 가지입니다.

| 방식 | 적합 환경 | 요건 | 특징 |
|------|----------|------|------|
| BGP 동적 라우팅 (권장) | 노드 증감이 잦은 중·대규모 | BGP 지원 라우터, ASN·피어링 협의 | 노드별 Pod CIDR 슬라이스를 자동 광고 — 증설 시 라우터 변경 불필요 |
| 정적 라우팅 | 노드 수가 적고 고정된 소규모, BGP 미지원 장비 | 라우터에 노드별 경로 수동 등록 | 노드 증설·교체 시마다 라우터 경로 갱신 필요 — 운영 부담 누적 |
| Hybrid Nodes Gateway | 네트워크 조직 분리·IPAM 포화로 라우팅 협의가 곤란한 환경 | Cilium 전용, 게이트웨이 EC2 2대 | 온프레미스 라우팅 협의 자체를 제거 — [구축 절차](./hybrid-nodes-gateway.md) |

노드별 Pod CIDR 슬라이스는 CNI가 동적으로 할당하므로, 정적 라우팅은 슬라이스 배정을 사전에 파악해 노드 단위로 경로를 등록해야 하고 노드 교체 시 재확인이 필요합니다. 이 관리 부담이 정적 라우팅을 소규모 환경으로 한정하는 이유입니다.

## Cilium BGP Control Plane 구성

Cilium의 BGP 기능(BGP Control Plane)은 Pod CIDR과 Service 주소를 온프레미스 네트워크에 광고합니다. 구성은 ① Helm 활성화 → ② CRD 3종 적용 → ③ 피어링 검증 순서입니다.

### 1. BGP Control Plane 활성화

```bash
helm upgrade cilium oci://public.ecr.aws/eks/cilium/cilium \
  --namespace kube-system \
  --reuse-values \
  --set operator.rollOutPods=true \
  --set bgpControlPlane.enabled=true
```

기존 배포에 BGP를 추가하는 경우 Cilium operator 재시작이 필요하며, `operator.rollOutPods=true`가 이를 Helm 업그레이드 과정에서 수행합니다.

### 2. BGP CRD 3종 구성

| CRD | 역할 | 핵심 필드 |
|-----|------|----------|
| `CiliumBGPClusterConfig` | 노드 그룹의 BGP 인스턴스·피어 정의 | `localASN`(노드 측), `peerASN`·`peerAddress`(온프렘 라우터) |
| `CiliumBGPPeerConfig` | 피어 세션 파라미터 | `holdTimeSeconds`(기본 90s), `keepAliveTimeSeconds`(기본 30s), graceful restart(기본 120s) — 라우터 측 설정과 일치 필요 |
| `CiliumBGPAdvertisement` | 광고 대상 선언 | `advertisementType: PodCIDR`(Pod 대역) 또는 `Service`(LB 주소) |

```yaml
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPClusterConfig
metadata:
  name: cilium-bgp
spec:
  nodeSelector:
    matchExpressions:
      - key: eks.amazonaws.com/compute-type
        operator: In
        values:
          - hybrid
  bgpInstances:
    - name: "rack0"
      localASN: NODES_ASN
      peers:
        - name: "onprem-router"
          peerASN: ONPREM_ROUTER_ASN
          peerAddress: ONPREM_ROUTER_IP
          peerConfigRef:
            name: "cilium-peer"
---
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPAdvertisement
metadata:
  name: bgp-advertisement-pods
  labels:
    advertise: bgp
spec:
  advertisements:
    - advertisementType: "PodCIDR"
```

각 하이브리드 노드의 Cilium 에이전트가 온프레미스 라우터와 개별 피어링하고, 자신이 소유한 Pod CIDR 슬라이스만 광고합니다. 온프레미스 라우터를 BGP Route Reflector로 구성하면 라우터가 데이터 경로에 참여하지 않으면서 Pod CIDR을 동적으로 학습합니다.

### 3. 피어링 검증

```bash
# Session State가 established인지 확인
cilium bgp peers

# 노드별 광고 경로 확인 (노드당 자기 슬라이스 1개)
cilium bgp routes
```

세션이 수립되지 않으면 ASN·피어 IP·타이머 값의 라우터 측 정합성과 함께 방화벽의 TCP 179 허용 여부를 점검합니다. Cilium 자체 포트(BGP TCP 179, VXLAN UDP 8472, health TCP 4240)는 [방화벽 사전 등록](./firewall-connectivity.md)의 존 E 룰에 포함해 신청합니다.

## 권장 사항 요약

- 신규 구축은 EKS 배포판 Cilium을 기준으로 설계합니다. Calico는 커뮤니티 경로이며 Gateway 옵션이 제외됩니다.
- Mixed mode에서는 Cilium values에 hybrid 레이블 affinity를 반드시 명시해 클라우드 노드 침범을 차단합니다.
- `clusterPoolIPv4PodCIDRList`는 `RemotePodNetwork`와 일치시키고, 불변 제약을 감안해 처음부터 넉넉히 배정합니다.
- Pod CIDR 라우팅은 BGP를 우선 검토하고, 라우팅 협의가 곤란하면 Gateway, 소규모 고정 환경만 정적 라우팅을 사용합니다.
- BGP 타이머·ASN은 네트워크팀과 사전 협의하고, TCP 179를 방화벽 신청서에 포함합니다.

## 참고 자료

### 공식 문서
- [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html) — Cilium 설치·업그레이드·삭제, VPC CNI 비호환 명시
- [Configure Cilium BGP for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cilium-bgp.html) — BGP Control Plane 활성화와 CRD 구성
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — fully routed 제약과 Pod CIDR 라우팅 옵션

### 기술 블로그
- [Deep dive into cluster networking for Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deep-dive-into-cluster-networking-for-amazon-eks-hybrid-nodes/) — BGP Route Reflector·정적 라우팅 구성 예시
- [A deep dive into Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — CNI affinity·cluster-pool IPAM 구성 배경

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — Pod CIDR 라우팅이 필요한 기능표
- [아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md) — 풀 라우팅 vs Gateway 판정 플로우
- [CIDR 설계와 대역 최소화](./cidr-network-design.md) — Pod CIDR 선제 확보와 슬라이스 산정
- [Hybrid Nodes Gateway 구축과 운영](./hybrid-nodes-gateway.md) — 라우팅 협의 없는 세 번째 옵션
