---
title: "리소스 & 비용 최적화"
sidebar_label: "리소스 & 비용"
description: "Karpenter 오토스케일링, Pod 리소스 최적화, EKS 비용 관리 전략"
tags: [eks, karpenter, cost-management, resource-optimization, finops]
sidebar_position: 4
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 리소스 & 비용 최적화

EKS 클러스터의 리소스 효율화와 비용 절감을 위한 실전 전략을 다룹니다. Karpenter 기반 지능형 노드 프로비저닝, Pod 리소스 Rightsizing, FinOps 기반 비용 관리를 포함합니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/resource-cost/karpenter-autoscaling"
    icon="⚡"
    title="Karpenter 오토스케일링"
    description="Karpenter 기반 지능형 노드 프로비저닝, Spot 인스턴스 활용, 비용 최적화 전략"
    color="#ff6b35"
  />
  <DocCard
    to="/docs/eks-best-practices/resource-cost/eks-resource-optimization"
    icon="📊"
    title="EKS 리소스 최적화"
    description="Pod 리소스 Rightsizing, Request/Limit 튜닝, VPA/HPA 활용 전략"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/resource-cost/cost-management"
    icon="💰"
    title="대규모 EKS 비용 관리"
    description="FinOps 기반 비용 구조 분석, Kubecost 활용, 30-90% 비용 절감 전략"
    color="#34a853"
  />
</DocCardGrid>
