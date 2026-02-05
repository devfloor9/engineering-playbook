---
title: "Infrastructure Optimization"
sidebar_label: "인프라 최적화"
description: "Amazon EKS의 성능 최적화와 네트워킹 관련 심화 기술 문서"
sidebar_position: 1
---

# Infrastructure Optimization

프로덕션 환경에서 Kubernetes 클러스터를 운영하는 것은 단순히 워크로드를 배포하는 것을 넘어서, 지속적인 성능 최적화와 비용 효율화라는 두 가지 목표를 동시에 추구해야 하는 복잡한 과제입니다. Amazon EKS 환경에서는 클라우드 네이티브 아키텍처의 장점을 최대한 활용하면서도, DNS 조회 지연, 네트워크 병목 현상, 비효율적인 리소스 할당과 같은 실제 운영 환경에서 발생하는 다양한 문제들을 해결해야 합니다.

이 섹션에서는 EKS 클러스터의 인프라 최적화에 대한 체계적이고 실전 중심의 접근 방법을 제시합니다. 특히 DNS 성능 튜닝은 마이크로서비스 아키텍처에서 서비스 디스커버리의 핵심이 되며, CoreDNS의 캐싱 전략과 쿼리 최적화를 통해 응답 시간을 획기적으로 개선할 수 있습니다. 네트워크 계층에서는 Cilium의 eBPF 기반 ENI 모드를 활용하여 기존 CNI 플러그인 대비 월등한 처리량과 낮은 레이턴시를 달성하는 방법을 다룹니다. 또한 Gateway API를 통한 현대적인 트래픽 라우팅 패턴과 클러스터 내부의 East-West 트래픽 최적화 전략을 통해, 서비스 메시 없이도 효율적인 서비스 간 통신을 구현할 수 있습니다.

자동 스케일링 영역에서는 Karpenter를 중심으로 한 지능형 노드 프로비저닝 전략을 소개합니다. 기존 Cluster Autoscaler의 한계를 극복하고, Spot 인스턴스와 다양한 인스턴스 타입을 활용한 비용 최적화를 실현하면서도 빠른 스케일 아웃 속도를 유지하는 아키텍처 패턴을 제공합니다. 이 모든 최적화 작업은 Prometheus와 CloudWatch를 활용한 메트릭 기반 의사결정을 통해 정량적으로 검증되며, 실제 벤치마크 결과와 프로덕션 환경의 사례를 통해 그 효과를 입증합니다.

## 주요 문서

**[Supercharging EKS DNS Performance: A Deep Dive into CoreDNS Optimization](./coredns-monitoring-optimization.md)**
CoreDNS 설정 최적화, DNS 쿼리 성능 튜닝 전략, 모니터링 메트릭 수집 및 실제 성능 개선 사례

**[Unleashing Network Performance: Mastering Cilium ENI Mode on Amazon EKS](./cilium-eni-gateway-api.md)**
Cilium ENI 모드 구성 및 최적화, Gateway API 통합, 네트워크 처리량 향상 기법 및 벤치마크 결과

**[East-West Traffic Best Practices for EKS](./east-west-traffic-best-practice.md)**
클러스터 내부 트래픽 최적화, 서비스 간 통신 패턴, 네트워크 정책 구현

**[Karpenter Auto-Scaling for EKS](./karpenter-autoscaling.md)**
Karpenter를 통한 노드 자동 스케일링, 비용 최적화 전략, 프로비저닝 최적화, 빠른 스케일 아웃 아키텍처 설계, 워크로드 배치 최적화

**[Cost Management for EKS](./cost-management.md)**
EKS 클러스터 비용 최적화, 리소스 효율화 전략

## 관련 카테고리

[Operations & Observability](/docs/observability-monitoring) - 성능 메트릭 모니터링
[Security & Governance](/docs/security-compliance) - 네트워크 보안 정책
[Hybrid Infrastructure](/docs/hybrid-multicloud) - 하이브리드 환경 네트워킹
