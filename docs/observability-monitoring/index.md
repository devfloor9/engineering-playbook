---
title: "Operations & Observability"
sidebar_label: "운영 & 옵저버빌리티"
description: "Amazon EKS 환경에서의 관찰성과 모니터링 관련 심화 기술 문서"
sidebar_position: 2
---

# Operations & Observability

현대의 클라우드 네이티브 환경에서 운영과 관찰성은 단순한 모니터링을 넘어 시스템의 건강도를 종합적으로 이해하고 선제적으로 대응하는 핵심 역량입니다. Amazon EKS와 같은 컨테이너 오케스트레이션 플랫폼에서는 수백 개의 마이크로서비스가 동적으로 생성되고 소멸하며, 복잡한 네트워크 통신이 이루어지기 때문에 전통적인 모니터링 방식으로는 시스템 상태를 파악하기 어렵습니다. 이러한 환경에서 효과적인 관찰성을 구축하기 위해서는 로그, 메트릭, 추적이라는 세 가지 기둥을 통합적으로 활용하고, GitOps 기반의 선언적 운영 방식을 적용하여 변경 사항을 체계적으로 관리해야 합니다.

특히 Kubernetes 클러스터에서는 네트워크 가시성이 매우 중요합니다. Pod 간의 통신 흐름을 실시간으로 추적하고, 네트워크 정책이 올바르게 적용되고 있는지 확인하며, 예상치 못한 트래픽 패턴을 조기에 발견할 수 있어야 합니다. Hubble과 같은 도구를 활용하면 Cilium 기반의 네트워크 계층에서 모든 통신을 관찰하고, 서비스 메시 수준의 가시성을 확보할 수 있습니다. 이를 통해 보안 위협을 탐지하고, 네트워크 병목 지점을 식별하며, 컴플라이언스 요구사항을 충족시킬 수 있습니다.

운영의 자동화와 일관성을 위해서는 GitOps 방식의 접근이 필수적입니다. 모든 클러스터 구성을 Git 저장소에 코드로 관리하고, Flux CD나 ArgoCD 같은 GitOps 도구를 통해 선언적 상태를 자동으로 동기화함으로써 수동 작업으로 인한 오류를 방지하고 변경 이력을 완벽하게 추적할 수 있습니다. 이러한 방식은 재현성과 감사 추적을 보장하며, 인프라를 코드로 관리하는 Infrastructure as Code의 이점을 극대화합니다. 또한 노드 수준에서의 모니터링도 중요합니다. 각 워커 노드의 CPU, 메모리, 디스크, 네트워크 사용량을 지속적으로 수집하고, 노드의 건강도를 평가하여 문제가 발생하기 전에 선제적으로 대응할 수 있어야 합니다.

효과적인 관찰성 구축을 위해서는 SLI(Service Level Indicators)와 SLO(Service Level Objectives)를 명확히 정의하고, 이를 기반으로 의미 있는 메트릭에 집중해야 합니다. 모든 것을 모니터링하려는 시도는 오히려 노이즈를 증가시키고 중요한 신호를 놓치게 만들 수 있습니다. Prometheus를 통해 시계열 메트릭을 수집하고 Grafana로 시각화하며, Jaeger를 활용해 분산 추적을 구현함으로써 시스템의 전체적인 동작을 이해하고 성능을 최적화할 수 있습니다. 이 섹션에서는 이러한 도구들을 실제 환경에 적용하는 방법과 모범 사례를 다룹니다.

## 문서 목록

- [Gaining Network Visibility: Implementing Hubble for EKS Observability](./node-monitoring-agent.md) - Hubble을 통한 네트워크 트래픽 가시성 확보 및 서비스 메시 관찰성 구현
- [GitOps-Based Cluster Operation and Monitoring](./gitops-cluster-operation.md) - GitOps 기반 클러스터 구성 관리 및 선언적 인프라 운영
- [Node Monitoring Agent Configuration](./node-monitoring-agent.md) - 노드 상태 모니터링 및 시스템 메트릭 수집
