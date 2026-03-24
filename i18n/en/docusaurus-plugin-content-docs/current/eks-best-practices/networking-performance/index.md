---
title: "네트워크 & 성능 최적화"
sidebar_label: "네트워크 & 성능"
description: "EKS 환경에서의 DNS 최적화, East-West 트래픽, Gateway API 도입 등 네트워크 및 성능 관련 베스트 프랙티스"
tags: [eks, networking, performance, dns, gateway-api]
sidebar_position: 1
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 네트워크 & 성능 최적화

EKS 클러스터의 네트워크 성능을 극대화하기 위한 실전 가이드입니다. DNS 튜닝, 서비스 간 트래픽 최적화, 그리고 차세대 트래픽 라우팅인 Gateway API 도입 전략을 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide"
    icon="🌐"
    title="Gateway API 도입 가이드"
    description="NGINX Ingress Controller EOL 대응, Gateway API 아키텍처 및 GAMMA Initiative, Cilium ENI + Gateway API 심화, 마이그레이션 전략"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/coredns-monitoring-optimization"
    icon="🔍"
    title="CoreDNS 모니터링과 성능 최적화"
    description="DNS 쿼리 성능 분석, CoreDNS 캐싱 전략, NodeLocal DNSCache 활용, 모니터링 체계 구축"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/east-west-traffic-best-practice"
    icon="↔️"
    title="East-West 트래픽 최적화"
    description="서비스 간 통신 최적화, Topology Aware Routing, 멀티 클러스터 트래픽 관리"
    color="#34a853"
  />
</DocCardGrid>
