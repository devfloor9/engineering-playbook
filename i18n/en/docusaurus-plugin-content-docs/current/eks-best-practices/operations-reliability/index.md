---
title: "운영 & 안정성"
sidebar_label: "운영 & 안정성"
description: "EKS 클러스터의 안정적인 운영을 위한 GitOps, 장애 진단, 고가용성, Pod 라이프사이클 관리 베스트 프랙티스"
tags: [eks, operations, reliability, gitops, debugging, ha, pod-lifecycle]
sidebar_position: 5
last_update:
  date: 2026-03-25
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 운영 & 안정성

EKS 클러스터의 안정적인 운영을 위한 실전 가이드입니다. GitOps 기반 운영 자동화부터 장애 진단, 고가용성 아키텍처, Pod 라이프사이클 관리까지를 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/gitops-cluster-operation"
    icon="🔄"
    title="GitOps 기반 EKS 클러스터 운영"
    description="GitOps 아키텍처, KRO/ACK 활용, 멀티클러스터 관리 전략 및 자동화"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/node-monitoring-agent"
    icon="📡"
    title="EKS Node Monitoring Agent"
    description="노드 상태 자동 감지, 아키텍처, 배포 전략, 모범 사례"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-debugging-guide"
    icon="🔍"
    title="EKS 장애 진단 및 대응"
    description="애플리케이션 및 인프라 문제의 체계적 진단과 트러블슈팅"
    color="#e63946"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-resiliency-guide"
    icon="🛡️"
    title="EKS 고가용성 아키텍처"
    description="고가용성과 장애 회복력을 확보하기 위한 아키텍처 패턴과 운영 전략"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-pod-health-lifecycle"
    icon="💓"
    title="Pod 헬스체크 & 라이프사이클"
    description="Probe 설정 전략, Graceful Shutdown, Pod 라이프사이클 관리"
    color="#ff6b35"
  />
  <DocCard
    to="/docs/eks-best-practices/operations-reliability/eks-pod-scheduling-availability"
    icon="📋"
    title="Pod 스케줄링 & 가용성 패턴"
    description="Affinity/Anti-Affinity, PDB, Priority/Preemption, Taints/Tolerations"
    color="#9b59b6"
  />
</DocCardGrid>
