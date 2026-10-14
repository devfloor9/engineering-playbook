---
title: Hybrid Nodes Gateway 구축과 운영
description: "Amazon EKS Hybrid Nodes Gateway의 동작 메커니즘부터 Cilium VTEP 재구성, Helm 설치, 인스턴스 사이징, failover·모니터링·제거까지 구축과 운영 전 과정을 다룹니다."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 20
tags:
  - eks
  - hybrid-node
  - cilium
  - networking
  - scope:impl
keywords:
  - VXLAN
  - VTEP
  - CiliumVTEPConfig
  - leader election
sidebar_label: Hybrid Nodes Gateway
category: hybrid-multicloud
---

## 개요

Hybrid Nodes Gateway는 "Pod CIDR을 온프레미스에서 라우팅 가능하게 만들어야 하는" 요건을 제거하는, AWS가 제공하는 오픈소스 게이트웨이 소프트웨어입니다(2026년 4월 21일 GA). VPC 라우트 테이블을 자동으로 유지·갱신하는 로직은 AWS가 제공하지만, 게이트웨이 자체는 사용자가 Helm으로 자신의 EC2 노드에 배포하며 구성·업데이트·용량 관리의 책임은 사용자에게 있습니다. EKS 컨트롤 플레인은 AWS 관리형이고, Auto Mode를 쓰면 게이트웨이 노드의 프로비저닝까지 EKS가 관리합니다. 본 문서는 Gateway의 동작 메커니즘, 도입 전 체크리스트, 5단계 구축 절차, 그리고 운영 태세(사이징·HA·모니터링·제거)를 다룹니다. Gateway 도입 여부의 판단 기준은 [아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md)를 참조합니다.

## 동작 메커니즘

Gateway는 Cilium CNI의 VTEP(VXLAN Tunnel Endpoint) 기능을 활용합니다. VPC 안의 EC2 게이트웨이 노드와 온프레미스의 Cilium 노드 사이에 VXLAN 터널(`hybrid_vxlan0` 인터페이스, VNI 2, UDP 8472)을 구성하고 Pod 트래픽을 캡슐화해 전달합니다. 물리 네트워크에는 노드 IP 간 UDP 트래픽만 흐르므로, 언더레이(온프레미스 라우터·VPC 라우트 테이블)가 Pod CIDR 경로를 알 필요는 없습니다. 다만 이는 "라우팅 노출을 없앤다"는 뜻일 뿐 트래픽 기밀성을 보장하지는 않습니다. VXLAN은 내부 IP 헤더와 페이로드를 캡슐화만 할 뿐 암호화하지 않으므로, 전송 구간의 기밀성이 필요하면 DX MACsec이나 VPN 같은 암호화된 전송 계층을 별도로 확보해야 합니다.

**그림 1. Gateway의 VXLAN 터널·VPC 라우트 자동 관리 동작 구조**

```mermaid
flowchart LR
    subgraph VPC["VPC 10.0.0.0/16"]
        CP["EKS Control Plane ENI"]
        RT["VPC Route Table<br/>RemotePodNetwork → Leader ENI<br/>(Gateway가 자동 관리)"]
        GW1["Gateway Pod — Leader"]
        GW2["Gateway Pod — Standby"]
    end
    subgraph ONPREM["온프레미스"]
        RTR["로컬 라우터<br/>(Pod CIDR 경로 불필요)"]
        HN["Hybrid Nodes<br/>Cilium VTEP 캡슐화"]
        POD["Pods<br/>(Pod CIDR 언더레이 라우팅 불필요)"]
    end
    CP --> RT
    RT --> GW1
    GW1 <-. "VXLAN 터널<br/>VNI 2 / UDP 8472" .-> HN
    GW2 -. "standby (failover: 측정 대상)" .- GW1
    VPC <--"Direct Connect / Site-to-Site VPN"--> ONPREM
    RTR --- HN
    HN --- POD
```

Gateway는 네 가지 메커니즘으로 동작합니다.

1. **VXLAN 터널링**: 게이트웨이가 `hybrid_vxlan0` 인터페이스를 생성하고, `CiliumNode` 오브젝트를 감시하는 노드 컨트롤러가 하이브리드 노드의 조인/이탈에 따라 FDB·ARP 엔트리와 라우트를 자동 추가·제거합니다.
2. **VPC 라우트 테이블 관리**: leader가 지정된 VPC 라우트 테이블에 "Pod CIDR → leader의 primary ENI" 경로를 생성·교체합니다.
3. **Cilium VTEP 통합**: leader가 `CiliumVTEPConfig` CRD를 생성해 하이브리드 노드의 Cilium 에이전트에게 VPC행 트래픽의 터널 엔드포인트(leader 노드 IP)를 알립니다.
4. **Leader election**: Kubernetes Lease 기반 active-standby 모델입니다. 두 게이트웨이 Pod가 pod anti-affinity로 서로 다른 노드에서 실행되고, **두 Pod 모두** 기동 시점에 VXLAN 인터페이스와 전체 VTEP 엔트리를 사전 구성합니다. leader 장애 시 standby는 라우트 테이블과 `CiliumVTEPConfig`만 갱신하면 됩니다. **예상 failover 시간은 자료마다 다릅니다**: AWS 사용자 가이드(`hybrid-nodes-gateway-operations.html`)는 약 3~5초, GitHub `aws/eks-hybrid-nodes-gateway` README(`main`, 접속 2026-10-13)는 약 15~30초로 명시하며, 두 자료 모두 lease duration·renew deadline 등 leader election 파라미터에 따라 달라지는 추정치라고 설명합니다. 보장된 수치가 아니므로 실환경에서 측정해 확인합니다(아래 [고가용성과 failover](#고가용성과-failover) 참조).

**Gateway가 하지 않는 것**도 명확합니다. Gateway는 NAT가 아니므로 대역 중복을 해소하지 못하며, Node 대역 라우팅과 VPC↔온프레미스 사설 연결 요건은 그대로 유지됩니다.

## 도입 전 체크리스트

**표 1. Gateway 도입 전 점검 항목**

| # | 항목 | 내용 |
|---|------|------|
| 1 | Cilium 버전 | EKS 배포판 Cilium **1.17.13-1 / 1.18.8-1 / 1.19.2-1 이상** (VTEP 지원 최소 버전) |
| 2 | Cilium 설정 | `vtep.enabled=true` + `l7Proxy=false` 필수. L7 proxy가 켜져 있으면 VTEP 트래픽이 가로채여 폐기될 수 있음 |
| 3 | 클라우드 노드 CNI | 게이트웨이 노드 포함 클라우드 노드는 AWS VPC CNI 필수 (VPC-native 라우팅 의존) |
| 4 | 게이트웨이 EC2 | 최소 2대, 서로 다른 AZ 권장, source/destination check 비활성화 |
| 5 | IAM 권한 | `ec2:DescribeRouteTables`, `ec2:CreateRoute`, `ec2:ReplaceRoute`, `ec2:DescribeInstances` — EKS Pod Identity로 게이트웨이 서비스 어카운트에만 부여 권장 |
| 6 | 방화벽 | 게이트웨이 SG와 온프레미스 방화벽 양쪽에서 **UDP 8472** inbound/outbound 허용 |
| 7 | VPC CNI SNAT 예외 | `AWS_VPC_K8S_CNI_EXCLUDE_SNAT_CIDRS`에 하이브리드 Pod CIDR 등록 |
| 8 | 전송 암호화 | VXLAN 무암호화 — DX MACsec 또는 VPN을 전송 계층으로 확보 |

## 1단계: Cilium 재구성

기존 Cilium 설치에 VTEP를 활성화하고 L7 proxy를 비활성화합니다.

```bash
helm upgrade cilium oci://public.ecr.aws/eks/cilium/cilium \
  --version CILIUM_VERSION \
  --namespace kube-system \
  --reuse-values \
  --set vtep.enabled=true \
  --set l7Proxy=false

kubectl rollout restart daemonset/cilium -n kube-system
kubectl rollout status daemonset/cilium -n kube-system

# 적용 확인
kubectl get configmap cilium-config -n kube-system -o yaml | grep -E "enable-vtep|enable-l7-proxy"
# enable-l7-proxy: "false" / enable-vtep: "true" 이면 정상
```

:::warning l7Proxy=false의 영향
`l7Proxy=false`는 Cilium의 L7 네트워크 정책(HTTP-aware policy)과 Envoy 기반 기능을 비활성화합니다. 해당 기능을 사용 중인 클러스터는 Gateway 도입 전 대체 방안(게이트웨이/서비스 메시 레벨 L7 제어)을 검토해야 합니다.
:::

## 2단계: VPC CNI SNAT 예외

클라우드 Pod에서 하이브리드 Pod 엔드포인트를 갖는 ClusterIP Service로 향하는 트래픽이 VPC 라우팅을 타도록 SNAT 예외를 설정합니다.

```bash
kubectl set env daemonset aws-node -n kube-system \
  AWS_VPC_K8S_CNI_EXCLUDE_SNAT_CIDRS=POD_CIDRS   # 쉼표 구분 복수 지정 가능
```

IP 직접 지정 Pod-to-Pod 통신은 이 설정 없이도 동작하지만, ClusterIP Service 경유 트래픽에는 필수입니다.

## 3단계: 게이트웨이 노드 준비

**EKS Auto Mode (권장)** — `NodeClass`/`NodePool`로 레이블·테인트·source/dest check를 선언적으로 구성합니다.

```yaml
apiVersion: eks.amazonaws.com/v1
kind: NodeClass
metadata:
  name: hybrid-gateway
spec:
  advancedNetworking:
    sourceDestCheck: DisabledPrimaryENI   # 자기 앞으로 오지 않은 트래픽 포워딩 허용
  role: YOUR_NODE_ROLE
  securityGroupSelectorTerms:
    - tags:
        aws:eks:cluster-name: YOUR_CLUSTER_NAME
  subnetSelectorTerms:                     # 서로 다른 AZ의 서브넷 2개
    - id: SUBNET_ID_1
    - id: SUBNET_ID_2
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: hybrid-gateway
spec:
  template:
    metadata:
      labels:
        hybrid-gateway-node: "true"        # Helm 차트의 node selector 대상
    spec:
      nodeClassRef:
        group: eks.amazonaws.com
        kind: NodeClass
        name: hybrid-gateway
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
        - key: eks.amazonaws.com/instance-category
          operator: In
          values: ["c", "m", "r"]
        - key: eks.amazonaws.com/instance-generation
          operator: Gt
          values: ["4"]
      taints:
        - key: hybrid-gateway-node
          effect: NoSchedule               # 게이트웨이 Pod 전용 노드로 격리
```

**Managed node group (대안)** — 전용 노드 그룹에 `hybrid-gateway-node=true` 레이블과 `NoSchedule` 테인트를 지정하고, 부팅 시 source/dest check를 비활성화하는 user-data를 담은 런치 템플릿을 연결합니다(노드 IAM role에 `ec2:ModifyNetworkInterfaceAttribute` 권한 필요). Helm 설치 시 `--set autoMode.enabled=false`를 추가합니다. 상세 절차는 [공식 getting-started 문서](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-getting-started.html)를 참조합니다.

## 4단계: IAM 권한 (Pod Identity 권장)

```bash
# Pod Identity Agent 애드온 설치 (미설치 시)
aws eks create-addon --cluster-name CLUSTER_NAME --addon-name eks-pod-identity-agent

# 라우트 테이블 관리 권한을 가진 role 생성 후 게이트웨이 서비스 어카운트와 연결
aws eks create-pod-identity-association \
  --cluster-name CLUSTER_NAME \
  --namespace eks-hybrid-nodes-gateway \
  --service-account eks-hybrid-nodes-gateway \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/EKSHybridNodesGatewayRole
```

노드 IAM role에 정책을 붙이는 방법도 지원되나, 이 경우 게이트웨이 노드의 모든 Pod가 라우트 변경 권한을 갖게 되므로 Pod Identity로 서비스 어카운트에만 부여하는 방식이 권장됩니다.

## 5단계: Helm 설치

```bash
helm install eks-hybrid-nodes-gateway \
  oci://public.ecr.aws/eks/eks-hybrid-nodes-gateway \
  --version 1.0.0 \
  --namespace eks-hybrid-nodes-gateway \
  --create-namespace \
  --set vpcCIDR=VPC_CIDR \
  --set podCIDRs=POD_CIDRS \
  --set routeTableIDs=ROUTE_TABLE_IDS
```

`podCIDRs`와 `routeTableIDs`는 모두 **쉼표로 구분된 단일 문자열** 값입니다(차트 기본 타입: string, 예: `podCIDRs=10.85.0.0/16,10.86.0.0/16`). 그런데 `helm --set`은 쉼표를 "다음 키=값 할당"의 구분자로 해석하므로, 위 플레이스홀더에 복수 값을 그대로 치환하면(`--set podCIDRs=10.85.0.0/16,10.86.0.0/16`) Helm이 `10.86.0.0/16`을 별도 할당으로 보고 파싱에 실패합니다. 복수 값을 넣을 때는 다음 중 하나를 사용합니다.

- 각 쉼표를 백슬래시로 이스케이프: `--set 'podCIDRs=10.85.0.0/16\,10.86.0.0/16'` (셸이 백슬래시를 먹지 않도록 작은따옴표로 감쌈)
- 값 파일(`values.yaml`)에 문자열로 지정하고 `-f`로 전달:

```yaml
# values.yaml
vpcCIDR: "10.0.0.0/16"
podCIDRs: "10.85.0.0/16,10.86.0.0/16"
routeTableIDs: "rtb-0123456789abcdef0,rtb-0123456789abcdef1"
```

```bash
helm install eks-hybrid-nodes-gateway \
  oci://public.ecr.aws/eks/eks-hybrid-nodes-gateway \
  --version 1.0.0 \
  --namespace eks-hybrid-nodes-gateway \
  --create-namespace \
  -f values.yaml
```

단일 값만 지정할 때는 AWS 공식 예시대로 `--set` 플레이스홀더를 그대로 치환해도 됩니다.

**표 2. Helm 설치 필수 값과 주의사항**

| 필수 값 | 의미 | 주의사항 |
|---------|------|----------|
| `vpcCIDR` | EKS 클러스터 VPC의 CIDR | VPC에 secondary CIDR을 추가하면 이 값도 갱신 필요 |
| `podCIDRs` | 하이브리드 노드 Cilium의 Pod CIDR (쉼표 구분 단일 문자열) | Cilium `clusterPoolIPv4PodCIDRList`·`RemotePodNetwork`와 일치해야 함. 복수 값은 `--set`에서 쉼표를 이스케이프하거나 값 파일 사용 |
| `routeTableIDs` | Gateway가 라우트를 프로그래밍할 VPC 라우트 테이블 ID (쉼표 구분 단일 문자열) | **하이브리드 Pod와 통신하는 모든 서브넷의 라우트 테이블을 전부 열거** — 누락된 테이블에 연결된 서브넷에서는 하이브리드 Pod 접근 불가. 복수 값은 `podCIDRs`와 동일한 이스케이프/값 파일 규칙 적용 |

## 설치 검증

```bash
# 게이트웨이 Pod 2개 Running 확인
kubectl get pods -n eks-hybrid-nodes-gateway

# leader lease 확인 (HOLDER 열에 leader Pod 표시)
kubectl get lease -n eks-hybrid-nodes-gateway

# VPC 라우트 테이블에 Pod CIDR → leader ENI 경로 생성 확인
aws ec2 describe-route-tables --route-table-ids ROUTE_TABLE_ID \
  --query "RouteTables[].Routes[?DestinationCidrBlock=='POD_CIDR']"

# 하이브리드 노드 측 VTEP 설정 확인
kubectl get ciliumvtepconfig hybrid-gateway -o yaml
```

## 운영 태세: Helm 관리형 vs 수동 EC2

"Kubernetes 장애 시 게이트웨이도 함께 죽는 것 아닌가 — EC2에 수동으로 iptables 게이트웨이를 만드는 게 안전하지 않은가"라는 질문이 자주 제기됩니다. 결론부터 말하면 **Helm 관리형이 공식 지원되는 유일한 배포 형태**이며, 수동 EC2 구성은 다음 이유로 비권장입니다.

1. **자동화의 대체 불가**: Gateway는 `CiliumNode` 감시를 통한 VTEP 엔트리 자동 관리, leader 장애 시 VPC 라우트·`CiliumVTEPConfig` 자동 갱신을 수행합니다. 수동 구성은 노드 증감·장애 시마다 사람이 FDB/ARP/라우트를 갱신해야 합니다.
2. **장애 도메인 분석**: 게이트웨이 Pod는 게이트웨이 EC2 노드 위에서 실행되며, 의존 대상은 EKS 컨트롤 플레인(AWS 관리형, SLA 제공)과 게이트웨이 EC2 자체입니다. "K8s 장애"의 실체가 컨트롤 플레인 장애라면 이는 AWS 관리 영역이고, 워커 노드 장애라면 다른 AZ의 standby가 승계합니다. failover 소요 시간은 자료마다 다릅니다. AWS 사용자 가이드(`hybrid-nodes-gateway-operations.html`, 2026-04 GA 기준)는 **약 3~5초**로, GitHub `aws/eks-hybrid-nodes-gateway` README(`main` 브랜치, 접속 2026-10-13)는 **약 15~30초**로 명시하며, 양쪽 모두 leader election 파라미터(lease duration·renew deadline)에 따라 달라지는 추정치임을 밝힙니다. 따라서 이 값은 보장된 수치가 아니라 실환경에서 fault injection으로 측정해 확인해야 하는 대상입니다. 수동 EC2 구성도 EC2 장애에는 똑같이 노출되며, 오히려 자동 failover가 없습니다.
3. **데이터 플레인 독립성**: VXLAN 포워딩은 커널 레벨에서 동작하므로, 컨트롤 플레인이 일시적으로 불안정해도 이미 프로그래밍된 터널의 트래픽 포워딩은 계속됩니다. 다만 컨트롤 플레인 의존이 "구성 변경 시점에만" 존재하는 것은 아닙니다. leader election은 Kubernetes API 서버에 대해 lease를 상시 갱신(기본 renew-deadline 2초)해야 유지되고, failover 복구는 standby가 EC2 라우트 API(`ec2:CreateRoute`/`ReplaceRoute`)와 Kubernetes API를 호출해 leader 셋업을 완료해야 끝납니다. 따라서 데이터 플레인은 이미 프로그래밍된 경로 한에서 독립적이지만, API 서버 접근 불가·IAM 권한 문제·라우트 갱신 실패가 겹치면 standby 승계 자체가 지연·차단될 수 있습니다.

## 인스턴스 사이징: 수직 확장 원칙

Gateway는 active-standby 모델이므로 **트래픽은 항상 leader 1대만 처리**합니다. replica를 늘려도(수평 확장) 가용성만 개선될 뿐 처리량은 늘지 않으며, 성능은 인스턴스 타입의 네트워크 대역폭으로만(수직 확장) 확장됩니다. 이것이 공식 문서의 명시적 가이드입니다.

t 계열 저사양 인스턴스(t2.small 등)는 게이트웨이 노드로 부적합합니다. 게이트웨이는 VPC↔하이브리드 Pod 간 **모든** 트래픽을 포워딩하는 병목 지점이고, VXLAN 캡슐화는 패킷당 오버헤드를 추가하므로 네트워크 성능(대역폭·PPS)이 낮은 인스턴스는 크로스 네트워크 통신 전체의 상한이 됩니다. 공식 권장 인스턴스는 다음과 같습니다.

**표 3. 규모별 공식 권장 게이트웨이 인스턴스와 네트워크 성능**

| 규모 | 인스턴스 | 네트워크 | 비고 |
|------|----------|----------|------|
| 프로덕션 (하이브리드 노드 10~100대, 중간 트래픽) | `c6in.xlarge` | 최대 30Gbps | 네트워크 최적화, 공식 권장 |
| 〃 | `c6i.xlarge` / `c7i.xlarge` | 최대 12.5Gbps | 비용·성능 균형 |
| 고처리량 (100대+, 대용량 트래픽) | `c6in.2xlarge` | 최대 40Gbps | 공식 권장 |
| 〃 최대 구성 | `c6in.4xlarge` | 최대 50Gbps | 데이터 집약 워크로드 |

메트릭(`hybrid_gateway_primary_nic_*`, `hybrid_gateway_vxlan_*`)으로 실사용량을 관측한 후 타입을 조정합니다.

## 고가용성과 failover

- 게이트웨이 Pod 2개가 pod anti-affinity로 서로 다른 노드에서 실행되며, **서로 다른 AZ** 배치를 권장합니다(AZ 장애가 leader/standby를 동시에 잃지 않도록).
- 두 Pod 모두 상시 VXLAN 인터페이스·VTEP 엔트리를 유지하므로, failover 시 라우트 테이블과 `CiliumVTEPConfig` 갱신만 수행합니다. **예상 failover 시간은 자료마다 달라** AWS 사용자 가이드는 약 3~5초, GitHub README(`main`, 접속 2026-10-13)는 약 15~30초로 제시하며, 둘 다 leader election 파라미터에 따라 변하는 추정치입니다. 이 동안 VPC↔하이브리드 Pod 트래픽이 중단되므로, 실제 순단 시간은 대표 인스턴스에서 fault injection으로 측정해 확정합니다.
- leader election 파라미터 기본값(lease 3s / renew 2s / retry 1s)은 빠른 failover에 튜닝되어 있습니다. 더 줄이면 네트워크 순단 시 오탐 failover 위험이 커지므로 대부분의 환경에서 기본값이 적절합니다.
- 게이트웨이-VPC 리소스 간 크로스 AZ 트래픽에는 표준 크로스 AZ 데이터 전송 요금이 부과됩니다.

### 장애 영향 범위

게이트웨이 인스턴스 장애가 하이브리드 네트워크 전체의 다운을 의미하지는 않습니다. Gateway를 경유하는 것은 VXLAN으로 캡슐화되는 크로스 네트워크 Pod 트래픽뿐이며, 노드 레벨 통신과 온프레미스 내부 트래픽은 Gateway와 무관한 경로로 흐릅니다.

**그림 2. 게이트웨이 장애 시 영향받는 경로와 영향받지 않는 경로**

```mermaid
flowchart TB
    subgraph VPC["VPC (AWS 리전)"]
        CP["EKS 컨트롤 플레인"]
        CPOD["클라우드 Pod<br/>(웹훅·시스템 애드온)"]
        GWL["Gateway Leader<br/>(AZ-a)"]
        GWS["Gateway Standby<br/>(AZ-b)"]
    end
    subgraph ONPREM["온프레미스"]
        HN["하이브리드 노드<br/>(kubelet + Cilium VTEP)"]
        P1["하이브리드 Pod A"]
        P2["하이브리드 Pod B"]
    end
    CPOD =="① VPC↔하이브리드 Pod<br/>leader 경유 — 장애 시 순단(측정 대상)"==> GWL
    GWL <-. "VXLAN 터널<br/>UDP 8472" .-> HN
    GWS -. "leader 장애 시 승계" .- GWL
    CP --"② kubelet↔컨트롤 플레인 (Node CIDR)<br/>DX/VPN 직접 라우팅 — 영향 없음"--> HN
    P1 --"③ 온프렘 로컬 Pod 트래픽 — 영향 없음"--- P2
    HN --- P1
```

**표 4. 트래픽 경로별 Gateway 경유 여부와 leader 장애 시 영향**

| 트래픽 경로 | Gateway 경유 | leader 장애 시 영향 |
|-------------|--------------|--------------------|
| ① VPC ↔ 하이브리드 Pod (웹훅 호출, east-west, NLB/ALB IP 타겟) | O — VXLAN 캡슐화 | 순단 후 standby 승계 (소요 시간은 자료별로 3~5초/15~30초, 측정 대상) |
| ② kubelet ↔ 컨트롤 플레인 (TCP 10250, API server) | X — Node CIDR이 DX/VPN을 직접 라우팅 | 영향 없음 — 노드 Ready 상태 유지 |
| ③ 온프레미스 내부 Pod ↔ Pod | X — 온프렘 Cilium이 로컬 처리 | 영향 없음 |
| 하이브리드 Pod 실행 자체 | X | 영향 없음 — 워크로드 실행 지속 |

위 표는 **의존 대상(EKS 컨트롤 플레인·Kubernetes API·IAM·라우트 테이블·Cilium 구성)이 정상인 상태에서 게이트웨이 인스턴스 1대만 격리 장애가 난 경우**를 전제로 합니다. 이 전제가 성립하면 standby가 승계하여 ① 경로만 짧게 순단되고 ②·③은 유지됩니다. 그러나 다음과 같이 **두 인스턴스가 모두 살아 있어도** VPC↔하이브리드 Pod 통신이 끊기거나 복구가 지연되는 공유 의존 장애 모드가 존재합니다.

- **게이트웨이 2대 동시 장애**: 단일 AZ 배치에서의 AZ 장애 등. 노드 교체·Pod 재스케줄 시점까지 ① 경로가 중단됩니다(②·③은 유지). 서로 다른 AZ 배치를 권장하는 이유입니다.
- **Kubernetes API 서버 접근 불가**: leader가 lease를 갱신하지 못하면 리더십이 흔들리고, standby도 lease를 획득하지 못해 failover가 지연·실패할 수 있습니다.
- **IAM 권한 회수·오류**: `ec2:CreateRoute`/`ReplaceRoute` 권한이 없거나 거부되면 failover 시 라우트 재지정이 실패해 ① 경로가 복구되지 않습니다(`hybrid_gateway_aws_route_table_update_errors_total`로 조기 탐지).
- **잘못된 라우트 테이블/Pod CIDR 구성**: `routeTableIDs`에 서브넷이 누락되었거나 `podCIDRs`가 실제 대역과 불일치하면 두 인스턴스가 정상이어도 해당 범위의 통신이 성립하지 않습니다.
- **Cilium VTEP/`l7Proxy` 구성 오류·터널 경로 차단**: 하이브리드 노드 측 VTEP 설정이나 UDP 8472 경로가 깨지면 캡슐화 트래픽이 폐기됩니다.

수 초의 순단도 허용되지 않거나 위 공유 의존 장애를 단일 통과 지점으로 떠안기 어려운 요건이라면, 게이트웨이라는 단일 통과 지점이 없는 A(BGP 풀 라우팅) 옵션을 [아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md)에서 검토합니다.

## 모니터링

게이트웨이는 8088 포트에 health(`/healthz`)·readiness(`/readyz`) 엔드포인트를, 10080 포트에 Prometheus 메트릭(`/metrics`)을 노출합니다. 핵심 관측 지표는 다음과 같습니다.

**표 5. Gateway 핵심 관측 메트릭과 용도**

| 메트릭 | 용도 |
|--------|------|
| `hybrid_gateway_leader_is_active` | leader/standby 상태 (1=leader) |
| `hybrid_gateway_hybrid_nodes_configured` | VTEP 구성된 하이브리드 노드 수 |
| `hybrid_gateway_aws_route_table_update_errors_total` | 라우트 갱신 실패 (IAM·라우트 테이블 문제 조기 탐지) |
| `hybrid_gateway_vxlan_rx/tx_bytes_total` | VXLAN 터널 트래픽량 (사이징 판단 근거) |
| `hybrid_gateway_primary_nic_rx/tx_bytes_total` | 인스턴스 네트워크 사용량 (대역폭 상한 대비 사용률) |

CloudWatch Observability 애드온으로 `eks-hybrid-nodes-gateway` 네임스페이스의 10080 포트를 스크래핑하도록 구성할 수 있습니다.

## 제거 시 주의: 라우트 수동 정리

게이트웨이 제거는 **VPC↔하이브리드 Pod 간 문서화된 유일한 통로를 끊는 파괴적 작업**입니다. `helm uninstall`은 Gateway가 생성한 VPC 라우트 엔트리를 자동 삭제하지 않으므로, 제거 후 라우트가 남아 있으면 더 이상 게이트웨이가 아닌 인스턴스로 트래픽이 향합니다. 반드시 아래 순서로 진행합니다.

1. **중단 창(cutover/maintenance window) 확보 또는 대체 경로 전환**: 제거 즉시 VXLAN 캡슐화 경로(위 표 ① 경로)가 끊어집니다. 다른 경로(예: 옵션 A의 BGP 풀 라우팅)로 먼저 전환하거나, 수용 가능한 중단 창을 확보한 뒤 진행합니다.
2. **삭제 전 라우트 인벤토리 확보**: 삭제 대상이 **게이트웨이가 소유한 경로**(대상이 게이트웨이 leader ENI인 Pod CIDR 경로)인지 확인하고, 설치 시 지정한 **모든** `routeTableIDs`와 `podCIDRs` 조합을 열거해 저장합니다. 복수 라우트 테이블·복수 CIDR을 구성했다면 각 조합마다 삭제가 필요합니다.

```bash
# (1) 재설치/롤백에 대비해 현재 구성값과 게이트웨이 소유 라우트를 먼저 백업
helm get values eks-hybrid-nodes-gateway -n eks-hybrid-nodes-gateway -o yaml > gateway-values.backup.yaml
for RTB in ROUTE_TABLE_ID_1 ROUTE_TABLE_ID_2; do
  aws ec2 describe-route-tables --route-table-ids "$RTB" \
    --query "RouteTables[].Routes[?DestinationCidrBlock=='POD_CIDR']" --output json
done

# (2) 차트 제거
helm uninstall eks-hybrid-nodes-gateway --namespace eks-hybrid-nodes-gateway

# (3) 게이트웨이가 생성한 각 (라우트 테이블 × Pod CIDR) 경로를 수동 삭제
#     — 반드시 대상이 게이트웨이 ENI인 경로만 삭제
aws ec2 delete-route \
  --route-table-id ROUTE_TABLE_ID \
  --destination-cidr-block POD_CIDR
```

3. **롤백 대비**: `gateway-values.backup.yaml`과 라우트 인벤토리를 보관하면, 문제 발생 시 동일 값으로 재설치해 되돌릴 수 있습니다. 삭제한 Pod CIDR 경로와 라우트 테이블 ID를 기록해 두어야 재설치 후 경로가 올바르게 복원되는지 검증할 수 있습니다.

## 기타 제약

- **클러스터당 1세트**: 게이트웨이 배포 하나는 단일 EKS 클러스터를 담당합니다. 멀티 클러스터 환경은 클러스터별로 배포합니다.
- **리전·비용**: China 리전 제외 전 Hybrid Nodes 지원 리전에서 사용 가능합니다. Gateway 소프트웨어 자체에는 별도 요금이 없으며, 과금되는 것은 게이트웨이를 구동하는 기반 인프라입니다 — 게이트웨이용 EC2 인스턴스, (Auto Mode 사용 시) EKS Auto Mode 관리 요금, 그리고 **관련 데이터 전송 요금**(크로스 AZ 전송, DX/VPN 등 전송 경로 요금 포함, GA 발표 명시)입니다. CloudWatch Observability로 메트릭·로그를 수집하면 그에 따른 관측 비용도 발생합니다. 코드는 [오픈소스로 공개](https://github.com/aws/eks-hybrid-nodes-gateway)되어 있습니다.

## 권장 사항 요약

- Cilium 최소 버전(1.17.13-1/1.18.8-1/1.19.2-1)과 `vtep.enabled=true`+`l7Proxy=false`를 도입 전 확정하고, L7 정책 사용 여부를 먼저 점검합니다.
- 게이트웨이 노드는 서로 다른 AZ의 네트워크 최적화 인스턴스(`c6in.xlarge` 이상)로 구성하고, t 계열은 사용하지 않습니다.
- IAM 권한은 Pod Identity로 게이트웨이 서비스 어카운트에만 부여합니다.
- `routeTableIDs`에 하이브리드 Pod와 통신하는 모든 서브넷의 라우트 테이블을 빠짐없이 열거합니다.
- VXLAN은 무암호화이므로 DX MACsec 또는 VPN을 전송 계층 암호화로 확보합니다.
- `hybrid_gateway_*` 메트릭으로 대역폭 사용률과 라우트 갱신 오류를 상시 관측합니다.

## 참고 자료

### 공식 문서
- [Amazon EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-overview.html) — Gateway 아키텍처, failover 추정치(사용자 가이드 3~5초), 제약 사항
- [Get started with EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-getting-started.html) — 전제 조건, IAM, NodeClass/NodePool, Helm 설치
- [Configure CNI for the Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-cni.html) — Cilium 최소 버전, vtep/l7Proxy 설정, VPC CNI SNAT 예외
- [Amazon EKS Hybrid Nodes gateway operations](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-operations.html) — failover 시퀀스, 인스턴스 사이징, 메트릭

### 기술 블로그
- [Introducing the Amazon EKS Hybrid Nodes gateway — AWS What's New](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-eks-hybrid-nodes-gateway/) — GA 발표 (2026-04-21)
- [Simplify hybrid Kubernetes networking with Amazon EKS Hybrid Nodes gateway — AWS Containers Blog](https://aws.amazon.com/blogs/containers/simplify-hybrid-kubernetes-networking-with-amazon-eks-hybrid-nodes-gateway/) — Gateway 딥다이브, Cilium values 예시
- [aws/eks-hybrid-nodes-gateway — GitHub](https://github.com/aws/eks-hybrid-nodes-gateway) — Gateway 오픈소스 저장소

### 관련 문서 (내부)
- [아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md) — Gateway 도입 여부 판단 기준
- [CIDR 설계와 대역 최소화](./cidr-network-design.md) — Gateway 도입 시 축소되는 등록 범위
- [방화벽·DNS 사전 등록 가이드](./firewall-connectivity.md) — UDP 8472 룰과 SG 구성
