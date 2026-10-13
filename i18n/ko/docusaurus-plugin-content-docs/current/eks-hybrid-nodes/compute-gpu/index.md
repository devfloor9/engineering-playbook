---
title: 컴퓨트 & GPU
description: EKS Hybrid Nodes의 GPU 워크로드 아키텍처와 DGX H200 SR-IOV·InfiniBand 고성능 네트워킹 구성을 다룹니다.
created: "2026-08-25"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - gpu
  - scope:nav
sidebar_label: 컴퓨트 & GPU
sidebar_position: 5
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

보유 GPU 자산을 하이브리드 노드로 활용하는 컴퓨트 계층을 다룹니다. 온프레미스 GPU·클라우드 GPU·Bedrock을 결합하는 3-Tier 아키텍처와 DGX H200급 장비의 고성능 네트워킹 구성을 안내합니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/compute-gpu/gpu-sriov-networking"
    icon="⚡"
    title="GPU 워크로드 & SR-IOV 네트워킹"
    description="3-Tier Cascade(온프렘 GPU·클라우드 GPU·Bedrock) 아키텍처, DGX H200 SR-IOV VF 구성, MLNX_OFED·systemd 오케스트레이션"
    color="#f4a261"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/compute-gpu/gpu-scheduling-failover"
    icon="🎛️"
    title="GPU 스케줄링 & 클라우드 폴백"
    description="노드 등록 시점 GPU taint 격리, 하이브리드 전용 NVIDIA Device Plugin nodeSelector, Karpenter 기반 클라우드 GPU 폴백 NodePool"
    color="#e76f51"
  />
</DocCardGrid>
