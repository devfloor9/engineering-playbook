---
title: CIDR 설계와 대역 최소화
description: "EKS Hybrid Nodes의 IP 대역 설계 베스트 프랙티스 — 라우팅 요건 판정 절차, VPC 최소 사이징 산정 근거, 컨트롤 플레인 ENI 전용 서브넷 전략, Pod CIDR 선제 확보, 멀티 환경 주소 계획을 다룹니다."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 6
tags:
  - eks
  - hybrid-node
  - networking
  - ipam
  - scope:design
keywords:
  - RemotePodNetwork
  - clusterPoolIPv4PodCIDRList
  - VPC CIDR
sidebar_label: CIDR 설계와 대역 최소화
category: hybrid-multicloud
---

## 개요

사내 IPAM 대역이 부족한 조직에서 가장 먼저 부딪히는 질문은 "어느 대역을, 얼마나, 어디까지 라우팅 가능하게 확보해야 하는가"입니다. 본 문서는 라우팅 요건 판정 절차, Gateway 도입 시 축소되는 등록 범위, AWS VPC 최소 사이징의 산정 근거, 그리고 멀티 환경(dev/stg/prd) 주소 계획을 다룹니다.

## 라우팅 요건 판정 절차

1. **Node CIDR**: 항상 양방향 라우팅 필수. 협상 불가 요건입니다.
2. **Pod CIDR**: [기능표](../overview-architecture/hybrid-nodes-fundamentals.md#node-대역-필수-pod-대역-선택-원칙)의 5개 항목 중 필요한 것이 있는지 판정합니다.
   - 하나도 없으면 → CNI egress NAT로 충분 (Pod CIDR 라우팅·등록 불필요)
   - 있으면 → BGP 풀 라우팅 또는 Hybrid Nodes Gateway 중 선택 ([아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md))

## Gateway 도입 시 축소 범위

Gateway를 도입하면 온프레미스 네트워크에 등록·라우팅해야 하는 대역이 다음과 같이 줄어듭니다.

| 항목 | Gateway 없음 (풀 라우팅) | Gateway 도입 |
|------|--------------------------|--------------|
| Node CIDR 온프렘 라우팅 | 필요 | **필요 (변화 없음)** |
| Pod CIDR 온프렘 라우팅 | 필요 (BGP/정적) | **불필요** |
| Pod CIDR VPC 라우트 테이블 | 수동 구성 | Gateway가 자동 관리 |
| 온프렘 방화벽의 Pod CIDR 인지 | 필요 | 불필요 (UDP 8472만 추가) |

즉 온프레미스 네트워크팀과의 협의 대상이 "Node CIDR 라우팅 + UDP 8472 허용"으로 축소됩니다. Pod CIDR은 클러스터 내부(EKS 설정·Cilium·Gateway)에서만 관리됩니다.

## AWS VPC 최소 사이징

VPC CIDR은 생성 후 축소·변경이 불가능하므로(secondary CIDR 추가만 가능) 초기 산정이 중요합니다.

**이론적 최소**: EKS는 서로 다른 AZ의 서브넷 2개를 요구하고, 각 서브넷은 EKS용 가용 IP 6개 이상이면 됩니다. /28 서브넷(가용 11 IP) 2개 — 즉 VPC /27 수준이 이론적 하한입니다.

**실무 권장(/25~/24)의 산정 근거**: 컨트롤 플레인 ENI만으로는 클러스터가 완성되지 않기 때문입니다.

| 소비 항목 | 필요 IP (개략) | 비고 |
|-----------|---------------|------|
| 컨트롤 플레인 ENI 서브넷 ×2 | /28 ×2 (32) | 업그레이드 시 신규 ENI 생성·교체 여유 포함 |
| Gateway 노드 ×2 (도입 시) | 2~4 | 서로 다른 AZ |
| 클라우드 노드 (웹훅·CoreDNS·시스템 애드온) | 서브넷 규모에 따라 수 개~수십 개 | mixed mode 필수 구성분. VPC CNI는 Pod에도 VPC IP를 할당하므로 Pod 수만큼 소비 |
| VPC 엔드포인트 (ECR·SSM·STS 등 PrivateLink) | 엔드포인트당 AZ별 1 | 인터넷 미경유 구성 시 |
| Route 53 Resolver inbound endpoint | AZ별 1 | 온프렘→AWS DNS 조회 시 |
| ALB/NLB 서브넷 | AZ별 8+ | LB 노출 구성 시 |

클라우드 노드에서 VPC CNI가 Pod당 VPC IP를 소비한다는 점이 결정적입니다. 웹훅·CoreDNS·모니터링 에이전트 몇 개만 운영해도 노드당 수십 IP가 필요할 수 있습니다. 환경(dev/stg/prd)별 /25(128 IP)~/24(256 IP)는 이 소비 구조에 성장 여유를 더한 값이며, 과대 산정이 아닙니다. 반대로 클라우드 노드를 최소화하고 Gateway·엔드포인트도 쓰지 않는 극단적 구성이라면 /26까지 압축할 수 있으나 확장 시 secondary CIDR 관리 부담이 발생합니다.

## 컨트롤 플레인 ENI 전용 서브넷 전략

EKS가 생성하는 컨트롤 플레인 ENI의 IP는 고정이 아니며, 클러스터 업그레이드 등 변경 시 기존 ENI가 삭제되고 새 ENI가 생성됩니다. 공식 문서는 이 특성에 대한 대응으로 **작은 전용 서브넷으로 IP 범위를 제약**하는 방법을 안내합니다.

> "You can restrict the IP range for the Amazon EKS network interfaces by using constrained subnet sizes for the subnets you pass during cluster creation, which makes it easier to configure your on-premises firewall."
> — [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html)

클러스터 생성 시 컨트롤 플레인용으로 /28 전용 서브넷 2개만 전달하면, 방화벽에는 개별 IP가 아닌 **이 서브넷 CIDR 2개**를 등록하면 됩니다. ENI IP가 바뀌어도 방화벽 재신청이 불필요합니다. 현재 ENI IP 확인은 다음 명령을 사용합니다.

```bash
aws ec2 describe-network-interfaces \
  --query 'NetworkInterfaces[?(VpcId == `VPC_ID` && contains(Description, `Amazon EKS`))].PrivateIpAddress'
```

## Pod CIDR 선제 확보

`RemotePodNetwork`는 클러스터 생성 후에도 갱신할 수 있으나 전체 목록 교체 방식이며, 더 중요한 제약은 CNI 측에 있습니다. Cilium의 `clusterPoolIPv4PodCIDRList`는 운영 중 변경이 사실상 불가능해(재설치 수준의 작업 필요) Pod CIDR 풀이 고갈되면 노드 증설이 막힙니다. 노드당 Pod CIDR 슬라이스(`clusterPoolIPv4MaskSize`, 통상 /25~/26)에 목표 노드 수와 성장分을 곱해 **처음부터 넉넉한 Pod CIDR을 배정**해야 합니다. Pod CIDR은 Gateway 도입 시 온프레미스에 노출되지 않으므로, 크게 잡아도 사내 IPAM과 충돌하지 않습니다(겹침 금지 3원칙만 준수).

## 멀티 환경(dev/stg/prd) 주소 계획

환경별 별도 계정 + VPC 1개 구조에서는 다음 원칙이 유효합니다.

- **Node CIDR**: 환경별로 분리된 온프레미스 대역 할당 (라우팅·방화벽 신청 단위가 됨)
- **Pod CIDR**: Gateway 사용 시 환경 간 재사용이 기술적으로 가능하나, 장애 분석·감사 로그 판독성을 위해 환경별 구분 값 권장 (예: dev `10.85.0.0/16`, stg `10.86.0.0/16`, prd `10.87.0.0/16`)
- **VPC CIDR**: 환경 간 겹침 금지 (TGW로 상호 연결될 가능성 대비)
- Gateway는 클러스터당 1세트이므로 3개 환경 = Gateway EC2 6대(환경당 2대)의 고정 비용을 계획에 포함

## 권장 사항 요약

- Node CIDR 양방향 라우팅은 협상 불가 — 가장 먼저 온프레미스 대역을 확보하고 신청합니다.
- 컨트롤 플레인 ENI는 /28 전용 서브넷 2개로 대역을 고정해 방화벽 신청을 서브넷 CIDR 단위로 수행합니다.
- VPC는 환경별 /25~/24로 산정하되, 표의 소비 항목을 근거 자료로 첨부해 네트워크팀을 설득합니다.
- Pod CIDR은 Cilium `clusterPoolIPv4PodCIDRList` 불변 제약을 감안해 처음부터 넉넉히 배정합니다.
- Service CIDR을 명시적으로 지정해 방화벽·라우팅 설계의 예측 가능성을 확보합니다.

## 참고 자료

### 공식 문서
- [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html) — CIDR 요건과 ENI 서브넷 제약 방법
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — fully routed 제약과 Pod CIDR 선택 사항
- [Amazon EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-overview.html) — Gateway 도입 시 라우팅 요건 변화

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — Pod CIDR 라우팅 필요 기능표, CGNAT 대역 지원
- [아키텍처 결정 가이드](../overview-architecture/architecture-decision-guide.md) — 풀 라우팅 vs Gateway 선택 기준
- [방화벽·DNS 사전 등록 가이드](./firewall-connectivity.md) — 확보한 대역의 방화벽 신청 절차
