---
title: 아키텍처 결정 가이드 — Routable Pod CIDR vs Gateway
description: "EKS Hybrid Nodes 설계의 핵심 결정인 Pod CIDR 노출 방식을 다룹니다. BGP 풀 라우팅, CNI NAT, Hybrid Nodes Gateway 3가지 옵션의 의사결정 기준과 판정 플로우를 제공합니다."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 4
tags:
  - eks
  - hybrid-node
  - cilium
  - networking
  - architecture
  - decision-framework
  - scope:design
keywords:
  - RemotePodNetwork
  - BGP
  - Hybrid Nodes Gateway
sidebar_label: 아키텍처 결정 가이드
category: hybrid-multicloud
---

## 개요

"Pod CIDR을 호스트 레벨로 노출(routable)할 것인가, Gateway 레이어를 추가할 것인가"는 하이브리드 설계의 핵심 결정입니다. 본 문서는 아키텍처 선택지 3가지의 트레이드오프와 의사결정 기준을 제공합니다. 선행 지식으로 [Node 대역 필수·Pod 대역 선택 원칙](./hybrid-nodes-fundamentals.md#node-대역-필수-pod-대역-선택-원칙)의 이해가 필요합니다.

## 3가지 아키텍처 옵션

| 옵션 | Egress | 웹훅/Inbound | East-west | 트레이드오프 |
|------|--------|--------------|-----------|--------------|
| ① Pod CIDR 풀 라우팅 (BGP 권장) | O | O | O | 가장 완전. 네트워크팀 협업·BGP 운영 필요 |
| ② CNI NAT (unroutable) | O | X — 웹훅은 클라우드 노드 배치 | X | 가장 단순. 기능 제약 큼 |
| ③ Hybrid Nodes Gateway | O | O | O | 라우팅 협의 불필요. Cilium 전용, 암호화 미내장, 게이트웨이 EC2 비용 |

## 의사결정 기준

각 옵션의 적합성은 다음 6개 축으로 판정합니다.

| 판단 축 | ① 풀 라우팅 유리 | ③ Gateway 유리 |
|---------|------------------|----------------|
| 네트워크팀 협업 | BGP 피어링·라우팅 변경을 신속히 협의 가능 | 네트워크가 "블랙박스"(조직 분리, 변경 리드타임 김) |
| IPAM 여유 | Pod CIDR을 사내 대역에서 정식 할당 가능 | 사내 대역 포화 — Pod CIDR을 내부에서만 소비 |
| CNI 제약 | Calico 유지 필요 (Gateway는 Cilium 전용) | Cilium 사용 중이거나 전환 가능 |
| 암호화 요구 | CNI 레벨 암호화(WireGuard/IPsec) 조합 가능 | 전송 계층(DX MACsec/VPN)에서 해결 가능 |
| 운영 주체 | 네트워크팀이 라우팅 운영 | 플랫폼팀이 클러스터 안에서 완결 운영 |
| 추가 비용 | 라우터 설정 외 없음 | Gateway EC2 2대 상시 비용 |

②(CNI NAT)는 웹훅·east-west·AWS 서비스 연동을 모두 포기할 수 있는 최소 기능 구성에서만 유효합니다. Calico 유지가 필요한 환경에서는 ③이 제외되므로 ①과 ② 중에서 선택해야 합니다.

## 판정 플로우

```mermaid
flowchart TD
    START["Pod 레벨 inbound 필요?<br/>(웹훅·east-west·Metrics Server·AMP·LB IP 타겟)"]
    START -- 아니오 --> OPT2["② CNI NAT<br/>웹훅은 클라우드 노드 배치"]
    START -- 예 --> CNI{"CNI가 Cilium인가<br/>(전환 가능 포함)?"}
    CNI -- "아니오 (Calico 고정)" --> OPT1["① BGP 풀 라우팅"]
    CNI -- 예 --> NET{"온프렘 네트워크팀과<br/>Pod CIDR 라우팅 협의 가능?"}
    NET -- "가능 (BGP 운영 역량 보유)" --> BOTH["① 또는 ③<br/>암호화 요구·운영 주체로 결정"]
    NET -- "곤란 (조직 분리·IPAM 포화)" --> OPT3["③ Hybrid Nodes Gateway"]
    BOTH -- "CNI 레벨 암호화 필요" --> OPT1
    BOTH -- "전송 계층 암호화로 충분" --> OPT3
```

## 판단 요약

네트워크 조직이 분리되어 있고 사내 IPAM이 포화된 환경 — 대형 통신·금융사의 전형 — 에서는 ③ Gateway가 협의 비용과 주소 소비를 최소화하는 선택입니다. 단 VXLAN 터널이 트래픽을 암호화하지 않으므로 전송 계층 암호화(DX MACsec 또는 VPN)가 전제되어야 하며, 게이트웨이 EC2 대역폭이 크로스 네트워크 트래픽의 상한이 된다는 점을 수용해야 합니다. 반대로 네트워크팀이 BGP를 능동적으로 운영할 수 있고 Pod 간 대용량 east-west 트래픽이 예상되는 환경이라면 ① 풀 라우팅이 병목 없는 구조를 제공합니다.

## 권장 사항 요약

- Pod 레벨 inbound(웹훅·east-west 등)가 전혀 필요 없으면 ② CNI NAT + mixed mode가 가장 단순한 구성입니다.
- 네트워크 조직 분리·IPAM 포화 환경에서는 ③ Gateway를 우선 검토하되, 전송 계층 암호화(DX MACsec/VPN) 확보를 전제 조건으로 명시합니다.
- ③ 선택 시 게이트웨이 EC2 대역폭이 크로스 네트워크 처리량의 상한임을 용량 계획에 반영합니다 ([사이징 상세](../networking/hybrid-nodes-gateway.md#인스턴스-사이징-수직-확장-원칙)).
- 어느 옵션이든 Node CIDR 양방향 라우팅과 사설 연결(DX/VPN)은 협상 불가 요건입니다.

## 참고 자료

### 공식 문서
- [Networking concepts for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-concepts-networking.html) — fully routed 제약, Pod CIDR 선택 사항 명시
- [Amazon EKS Hybrid Nodes gateway](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-gateway-overview.html) — Gateway 아키텍처와 제약 사항
- [Configure webhooks for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-webhooks.html) — mixed mode 권고, 애드온별 affinity 설정

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](./hybrid-nodes-fundamentals.md) — 라우팅 요건 원칙과 트래픽 흐름
- [CIDR 설계와 대역 최소화](../networking/cidr-network-design.md) — 옵션 결정 이후의 주소 계획
- [Hybrid Nodes Gateway 구축과 운영](../networking/hybrid-nodes-gateway.md) — ③ 선택 시 구축 절차
