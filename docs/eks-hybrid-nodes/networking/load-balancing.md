---
title: 로드밸런싱과 서비스 노출
description: "EKS Hybrid Nodes 워크로드의 외부 노출 설계 — 트래픽 발원지 기준 NLB vs Cilium 내장 LB 결정 원칙, AWS Load Balancer Controller 구성 요건, Cilium LB IPAM·BGP 광고, MetalLB 등 커뮤니티 옵션을 다룹니다."
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
  - load-balancing
  - scope:impl
keywords:
  - CiliumLoadBalancerIPPool
  - loadBalancerClass
  - MetalLB
  - NLB
sidebar_label: 로드밸런싱 & 서비스 노출
category: hybrid-multicloud
---

## 개요

하이브리드 노드에서 실행되는 워크로드를 클러스터 외부에 노출하는 방식은 클라우드 전용 클러스터와 다른 판단이 필요합니다. AWS는 Service type LoadBalancer에 대해 NLB(Network Load Balancer)와 Cilium 두 가지를 공식 지원하며, 선택 기준은 **애플리케이션 트래픽의 발원지**입니다. 본 문서는 이 결정 원칙과 경로별 구성 요건(NLB + AWS Load Balancer Controller, Cilium 내장 LB), MetalLB 등 커뮤니티 옵션, 그리고 L7 Ingress 경로를 다룹니다.

## 결정 원칙: 트래픽 발원지

> "The decision to use NLB or Cilium is based on the source of application traffic. If application traffic originates from an AWS Region, AWS recommends using AWS NLB and the AWS Load Balancer Controller. If application traffic originates from the local on-premises or edge environment, AWS recommends using Cilium's built-in load balancing capabilities."
> — [Configure Services of type LoadBalancer for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-load-balancing.html)

| 트래픽 발원지 | 권장 경로 | 전제 조건 |
|---------------|----------|----------|
| AWS 리전 (또는 인터넷 → 리전 경유) | NLB/ALB + AWS Load Balancer Controller (IP 타겟) | Pod CIDR이 AWS에서 도달 가능 (BGP 풀 라우팅 또는 Gateway) |
| 온프레미스·엣지 로컬 | Cilium 내장 LB (LB IPAM + BGP) | Cilium BGP Control Plane 또는 LB IP의 온프렘 라우팅 |
| 온프레미스 로컬 (기존 장비·운영 관성) | MetalLB 등 커뮤니티 옵션 | 업스트림 Kubernetes 호환 — 자체 운영 |

온프레미스에서 발생해 온프레미스에서 소비되는 트래픽을 리전의 LB로 우회시키면 DX/VPN 왕복 지연과 대역폭 소비가 추가됩니다. 발원지 원칙은 이 헤어핀(hairpin) 경로를 방지하는 설계 기준입니다.

## 경로 1: NLB + AWS Load Balancer Controller (리전 발원)

리전에서 발원하는 트래픽은 AWS Load Balancer Controller와 NLB를 **IP 타겟 모드**로 사용합니다. IP 타겟 모드에서 NLB는 Service 계층을 우회해 Pod IP로 직접 포워딩하므로, 하이브리드 Pod CIDR이 AWS에서 라우팅 가능해야 합니다 — 이는 Pod 레벨 inbound 요건이므로 BGP 풀 라우팅 또는 Hybrid Nodes Gateway가 전제입니다 ([기능표](../overview-architecture/hybrid-nodes-fundamentals.md#node-대역-필수-pod-대역-선택-원칙)).

```yaml
# Service type LoadBalancer (NLB)
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"

# Ingress (ALB) — L7 노출 시
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-type: ip
```

구성 시 주의 사항은 세 가지입니다.

- **컨트롤러 배치**: AWS Load Balancer Controller는 웹훅을 사용합니다. 하이브리드 노드에서 실행하려면 `RemotePodNetwork` 구성과 Pod CIDR 라우팅이 필요하므로, mixed mode 클러스터에서는 클라우드 노드 배치가 권장 패턴입니다 ([Mixed Mode 배치 전략](../operations-cost/operations-cost-optimization.md)).
- **인스턴스 타겟 미사용**: 하이브리드 노드는 EC2 인스턴스가 아니므로 instance 타겟 모드를 사용할 수 없습니다. IP 타겟이 유일한 경로입니다.
- **방화벽 경로**: NLB → 하이브리드 Pod 트래픽은 DX/VPN을 경유하므로, 온프레미스 방화벽에서 서비스 포트·헬스 체크 포트의 VPC → Pod CIDR 방향 허용이 필요합니다 ([방화벽 사전 등록](./firewall-connectivity.md)).

## 경로 2: Cilium 내장 LB (온프렘 발원)

온프레미스 로컬 트래픽은 별도 LB 인프라 없이 Cilium의 내장 기능으로 처리할 수 있습니다. 세 기능이 역할을 분담합니다.

| 기능 | 역할 | 비고 |
|------|------|------|
| kube-proxy replacement | Service 트래픽의 백엔드 Pod 분배 | 커널 v4.19.57 / v5.1.16 / v5.2.0 이상 필요 — 지원 OS 중 RHEL 8.x만 미충족 |
| Load Balancer IPAM | Service type LoadBalancer에 외부 IP 할당 | `CiliumLoadBalancerIPPool`로 IP 풀 정의 |
| BGP Control Plane | 할당된 LB IP를 온프렘 네트워크에 광고 | [BGP 구성](./cni-selection-routing.md#cilium-bgp-control-plane-구성) 선행 필요 |

kube-proxy replacement 없이도 LB IPAM과 BGP 광고는 사용할 수 있으며, 이 경우 백엔드 분배는 EKS 기본인 kube-proxy(iptables)가 담당합니다.

```yaml
# LB IP 풀 정의
apiVersion: cilium.io/v2alpha1
kind: CiliumLoadBalancerIPPool
metadata:
  name: tcp-service-pool
spec:
  blocks:
    - cidr: "LB_IP_CIDR"          # /32로 단일 IP 지정 가능
  serviceSelector:
    matchLabels:
      io.kubernetes.service.name: tcp-sample-service
---
# LB IP를 BGP로 온프렘에 광고
apiVersion: cilium.io/v2alpha1
kind: CiliumBGPAdvertisement
metadata:
  name: bgp-advertisement-tcp-service
  labels:
    advertise: bgp
spec:
  advertisements:
    - advertisementType: "Service"
      service:
        addresses:
          - LoadBalancerIP
      selector:
        matchLabels:
          io.kubernetes.service.name: tcp-sample-service
---
# Service — loadBalancerClass 필수
apiVersion: v1
kind: Service
metadata:
  name: tcp-sample-service
  annotations:
    lbipam.cilium.io/ips: "LB_IP_ADDRESS"   # 특정 IP 요청 (선택)
spec:
  loadBalancerClass: io.cilium/bgp-control-plane
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
  selector:
    app: nginx
```

- `loadBalancerClass`는 레거시 AWS Cloud Provider가 해당 Service에 Classic Load Balancer를 생성하는 것을 방지하기 위해 필수입니다. BGP 광고에는 `io.cilium/bgp-control-plane`을 사용합니다.
- `io.cilium/l2-announcer`(L2 Announcements)는 베타 기능으로 AWS 공식 지원 대상이 아닙니다.
- BGP 광고 시 각 하이브리드 노드가 LB IP를 /32로 광고하며, 백엔드 분배는 클러스터 내부에서 수행됩니다. `cilium-dbg service list`로 LB IP → 백엔드 Pod 매핑을 확인할 수 있습니다.

## 커뮤니티 옵션: MetalLB 외

하이브리드 노드는 업스트림 Kubernetes와 완전 호환되므로, 온프레미스에서 통용되는 LB·Ingress 솔루션 대부분을 사용할 수 있습니다. 공식 블로그가 언급하는 옵션은 Cilium(BGP·L2), Calico(BGP), MetalLB, NGINX, HAProxy, Apache APISIX, Emissary Ingress, Istio 등입니다.

MetalLB는 두 모드를 제공합니다.

- **L2 모드 (ARP)**: 노드 서브넷에서 예약한 IP 풀을 사용하고, 선출된 노드 1대가 해당 LB IP의 ARP 요청에 응답합니다. BGP 운영 없이 시작할 수 있어 엣지·소규모 환경에 적합하지만, LB IP당 트래픽 인입이 단일 노드로 수렴하는 특성을 용량 계획에 반영해야 합니다.
- **BGP 모드 (L3)**: LB IP를 BGP로 광고합니다. 다만 Cilium을 CNI로 사용하는 환경이라면 별도 컴포넌트를 추가하기보다 Cilium BGP Control Plane + LB IPAM으로 통합하는 것이 관리 지점을 줄입니다.

선택 기준은 기존 온프레미스 환경의 운영 기술과 애플리케이션 요구 사항입니다. 이미 검증된 LB 운영 체계가 있다면 유지하고, 신규 구축이라면 AWS 지원 범위인 Cilium 내장 LB를 우선 검토합니다.

## L7 Ingress

- **리전 발원**: ALB + AWS Load Balancer Controller(`target-type: ip`)를 사용합니다. 전제 조건은 경로 1과 동일합니다.
- **온프렘 발원**: Cilium Ingress 또는 Cilium Gateway(Gateway API)를 사용합니다. Ingress/Gateway가 받는 LoadBalancer IP는 Cilium LB IPAM으로 할당되므로, BGP 광고 또는 대체 라우팅으로 해당 IP가 온프레미스에서 도달 가능해야 합니다. 구성 절차는 [Configure Kubernetes Ingress for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-ingress.html)를 참조합니다.

반대 방향인 온프레미스 LB → 클라우드 Pod(DR) 경로 설계는 [방화벽·TGW 토폴로지](./firewall-connectivity.md#온프레미스-lb--클라우드-poddr-경로)에서 다룹니다.

## 권장 사항 요약

- 트래픽 발원지를 먼저 판정합니다 — 리전 발원은 NLB/ALB + IP 타겟, 온프렘 로컬은 Cilium 내장 LB가 기본 경로입니다.
- 온프렘 로컬 트래픽을 리전 LB로 우회시키는 헤어핀 구조는 DX/VPN 지연·대역폭 비용을 유발하므로 피합니다.
- NLB/ALB IP 타겟은 Pod CIDR 라우팅(BGP 또는 Gateway)이 전제임을 설계 초기에 확정합니다.
- AWS Load Balancer Controller는 mixed mode에서 클라우드 노드에 배치합니다.
- Cilium 내장 LB 사용 시 Service에 `loadBalancerClass: io.cilium/bgp-control-plane`을 명시하고, RHEL 8.x에서는 kube-proxy replacement를 사용하지 않습니다.
- MetalLB L2 모드는 LB IP당 단일 노드 인입 특성을 용량 계획에 반영합니다.

## 참고 자료

### 공식 문서
- [Configure Services of type LoadBalancer for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-load-balancing.html) — NLB vs Cilium 결정 원칙과 구성 절차
- [Configure Kubernetes Ingress for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-ingress.html) — Cilium Ingress·Gateway 기반 L7 노출
- [Configure add-ons for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html) — AWS Load Balancer Controller의 IP 타겟·웹훅 요건

### 기술 블로그
- [Deep dive into cluster networking for Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deep-dive-into-cluster-networking-for-amazon-eks-hybrid-nodes/) — MetalLB L2/BGP 모드와 로드밸런싱 고려사항
- [A deep dive into Amazon EKS Hybrid Nodes — AWS Containers Blog](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — 트래픽 경로 2분류와 커뮤니티 옵션 목록

### 관련 문서 (내부)
- [CNI 구성과 Pod CIDR 라우팅](./cni-selection-routing.md) — Cilium BGP Control Plane 구성 선행 절차
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — Pod 레벨 inbound가 필요한 기능표
- [방화벽·DNS 사전 등록과 TGW 토폴로지](./firewall-connectivity.md) — LB 경로의 방화벽 룰과 온프렘 LB → 클라우드 경로
- [운영과 비용 최적화](../operations-cost/operations-cost-optimization.md) — 웹훅 컴포넌트의 클라우드 노드 배치
