---
title: 스토리지 & 레지스트리
description: EKS Hybrid Nodes 환경의 공유 파일 스토리지(EFS·FSx·NFS) 솔루션과 Harbor 프라이빗 컨테이너 레지스트리 통합을 다룹니다.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - storage
  - scope:nav
sidebar_label: 스토리지 & 레지스트리
sidebar_position: 4
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

하이브리드 클러스터의 데이터 계층을 다룹니다. 온프레미스 노드에서 사용할 공유 파일 스토리지 솔루션 선택과, 폐쇄망·FQDN 제한 환경에서 이미지 공급 경로를 내재화하는 Harbor 프라이빗 레지스트리 통합을 안내합니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/storage-registry/file-storage"
    icon="💾"
    title="공유 파일 스토리지"
    description="AWS 관리형(EFS·FSx) vs 엔터프라이즈 스토리지 CSI 통합 vs 전통적 NFS 클러스터 — AL2023 제약과 솔루션 선택"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/storage-registry/harbor-registry"
    icon="📦"
    title="Harbor 레지스트리 통합"
    description="Harbor 2.15 설치·SSL/TLS·Robot Account부터 containerd 인증, CoreDNS, imagePullSecret까지 단계별 통합 가이드"
    color="#4a90d9"
  />
</DocCardGrid>
