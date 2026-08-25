---
title: 네트워킹
description: EKS Hybrid Nodes 네트워킹 베스트 프랙티스 — CIDR 설계와 대역 최소화, CNI 구성과 Pod CIDR 라우팅, Hybrid Nodes Gateway 구축·운영, 로드밸런싱과 서비스 노출, 방화벽 사전 등록과 TGW 토폴로지를 다룹니다.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - networking
  - scope:nav
sidebar_label: 네트워킹
sidebar_position: 2
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

하이브리드 클러스터 도입의 최대 난관인 네트워킹을 다룹니다. IP 대역 설계부터 Hybrid Nodes Gateway 구축·운영, 방화벽·네트워크 조직에 제출할 사전 등록 요청서 작성까지 실무 순서대로 구성했습니다.

---

<DocCardGrid columns={3}>
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/cidr-network-design"
    icon="🗺️"
    title="CIDR 설계와 대역 최소화"
    description="라우팅 요건 판정, VPC 최소 사이징 근거, 컨트롤 플레인 ENI 전용 서브넷, Pod CIDR 선제 확보, dev/stg/prd 주소 계획"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/cni-selection-routing"
    icon="🔀"
    title="CNI 구성과 Pod CIDR 라우팅"
    description="Cilium(AWS 지원 CNI) 선택 기준, 하이브리드 affinity·cluster-pool IPAM, BGP Control Plane vs 정적 라우팅 구성"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/hybrid-nodes-gateway"
    icon="🚇"
    title="Hybrid Nodes Gateway 구축·운영"
    description="Cilium VTEP 구성, Helm 설치, 인스턴스 사이징(수직 확장), failover 3~5초 HA 모델, 모니터링, 제거 시 주의사항"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/load-balancing"
    icon="⚖️"
    title="로드밸런싱과 서비스 노출"
    description="트래픽 발원지 기준 NLB vs Cilium 내장 LB 결정 원칙, AWS Load Balancer Controller IP 타겟, LB IPAM·BGP 광고, MetalLB"
    color="#f4a261"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking/firewall-connectivity"
    icon="🧱"
    title="방화벽 사전 등록 & TGW 토폴로지"
    description="5존 방화벽 룰 표(신청서 수준), FQDN 와일드카드 미지원 대응, TGW 라우트 설계, 온프렘 LB → 클라우드 Pod 경로"
    color="#e63946"
  />
</DocCardGrid>
