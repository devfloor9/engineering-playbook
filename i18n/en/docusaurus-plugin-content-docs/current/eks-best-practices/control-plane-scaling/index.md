---
title: "Control Plane & 확장"
sidebar_label: "Control Plane & 확장"
description: "EKS Control Plane 동작 원리, CRD 스케일링 전략, 멀티 클러스터 고가용성 아키텍처"
tags: [eks, control-plane, crd, scaling, multi-cluster, ha]
sidebar_position: 2
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Control Plane & 확장

EKS Control Plane의 내부 동작을 이해하고, CRD 기반 플랫폼의 안정적 확장과 멀티 클러스터 고가용성 전략을 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/eks-control-plane-crd-scaling"
    icon="🎛️"
    title="EKS Control Plane & CRD at Scale"
    description="Control Plane 동작 원리, VAS 자동 스케일링, Provisioned Control Plane, CRD 영향 분석, 모니터링 전략"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/control-plane-scaling/cross-cluster-object-replication"
    icon="🔄"
    title="Cross-Cluster Object Replication (HA)"
    description="멀티 클러스터 환경에서 K8s 오브젝트 복제를 통한 고가용성 아키텍처 패턴 비교와 의사결정 가이드"
    color="#34a853"
  />
</DocCardGrid>
