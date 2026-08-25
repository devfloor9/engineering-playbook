---
title: 개요 & 아키텍처
description: EKS Hybrid Nodes의 개념·동작 원리·주요 기술 특징과 연결·토폴로지·Pod CIDR 노출·CNI·인증·워크로드 노출 6가지 설계 결정 가이드를 다룹니다.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - architecture
  - scope:nav
sidebar_label: 개요 & 아키텍처
sidebar_position: 1
category: hybrid
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

EKS Hybrid Nodes가 무엇이고 어떻게 동작하는지, 그리고 하이브리드 아키텍처를 구성하는 6가지 설계 결정 — 연결 방식, 클러스터 토폴로지, Pod CIDR 노출, CNI·라우팅, 노드 인증, 워크로드 노출 — 을 어떤 기준과 순서로 판단하는지를 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/overview-architecture/hybrid-nodes-fundamentals"
    icon="📖"
    title="개념과 동작 원리"
    description="정의·사용 사례·요금 모델, nodeadm 등록 흐름, RemoteNodeNetwork/RemotePodNetwork, 트래픽 흐름과 CNI 동작, 주요 기술 특징"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/overview-architecture/architecture-decision-guide"
    icon="🧭"
    title="아키텍처 결정 가이드"
    description="연결(DX/VPN)·토폴로지(Mixed mode)·Pod CIDR 노출·CNI·노드 인증·워크로드 노출 — 6가지 설계 결정의 판단 기준과 의존 관계"
    color="#4a90d9"
  />
</DocCardGrid>
