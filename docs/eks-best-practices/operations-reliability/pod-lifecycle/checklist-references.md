---
title: 배포 체크리스트와 참고 자료
description: 배포 전 점검 항목과 전체 참고 자료를 확인합니다.
created: "2026-02-12"
last_update:
  date: "2026-09-17"
  author: YoungJoon Jeong
reading_time: 8
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: 배포 체크리스트와 참고 자료
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md)

## 종합 체크리스트 & 참고 자료 {#7-종합-체크리스트--참고-자료}

### 프로덕션 배포 전 체크리스트 {#71-프로덕션-배포-전-체크리스트}

#### Pod 헬스체크 {#pod-헬스체크}

| 항목 | 확인 사항 | 우선순위 |
|------|----------|---------|
| **Startup Probe** | 시작이 느린 앱(30초+)에 Startup Probe 설정 | 높음 |
| **Liveness Probe** | 외부 의존성 제외, 내부 상태만 확인 | 필수 |
| **Readiness Probe** | 외부 의존성 포함, 트래픽 수신 준비 확인 | 필수 |
| **Probe 타이밍** | failureThreshold × periodSeconds가 적절한지 확인 | 중간 |
| **Probe 경로** | `/healthz` (liveness), `/ready` (readiness) 분리 | 높음 |
| **ALB 헬스체크** | Readiness Probe와 경로 일치 확인 | 높음 |
| **Pod Readiness Gates** | ALB/NLB 사용 시 활성화 | 중간 |

#### Graceful Shutdown {#graceful-shutdown}

| 항목 | 확인 사항 | 우선순위 |
|------|----------|---------|
| **preStop Hook** | `sleep 5` 추가로 Endpoint 제거 대기 | 필수 |
| **SIGTERM 처리** | 애플리케이션에 SIGTERM 핸들러 구현 | 필수 |
| **terminationGracePeriodSeconds** | preStop + Shutdown 시간 고려하여 설정 (30-120초) | 필수 |
| **Connection Draining** | HTTP Keep-Alive, WebSocket 연결 정리 로직 | 높음 |
| **데이터 정리** | DB 연결, 메시지 큐, 파일 핸들 정리 | 높음 |
| **Readiness 실패** | Shutdown 시작 시 Readiness Probe 실패 응답 | 중간 |

#### 리소스 및 이미지 {#리소스-및-이미지}

| 항목 | 확인 사항 | 우선순위 |
|------|----------|---------|
| **리소스 requests/limits** | CPU/메모리 requests 설정 (HPA, VPA 기준) | 필수 |
| **이미지 크기** | 멀티스테이지 빌드로 최소화 (100MB 이하 목표) | 중간 |
| **이미지 태그** | `latest` 태그 사용 금지, semantic versioning 사용 | 필수 |
| **보안 스캔** | Trivy, Grype로 CVE 스캔 | 높음 |
| **non-root 사용자** | 컨테이너를 non-root로 실행 | 높음 |

#### 고가용성 {#고가용성}

| 항목 | 확인 사항 | 우선순위 |
|------|----------|---------|
| **PodDisruptionBudget** | minAvailable 또는 maxUnavailable 설정 | 필수 |
| **Topology Spread** | Multi-AZ 분산 설정 | 높음 |
| **Replica 수** | 최소 2개 이상 (프로덕션 3개+) | 필수 |
| **Affinity/Anti-Affinity** | 동일 노드 배치 방지 | 중간 |

### 관련 문서 {#72-관련-문서}

- [EKS 장애 진단 및 대응 가이드](/docs/eks-best-practices/operations-reliability/eks-debugging) — Probe 디버깅, Pod 트러블슈팅
- [EKS 고가용성 아키텍처 가이드](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide) — PDB, Graceful Shutdown, Pod Readiness Gates
- [Karpenter를 활용한 초고속 오토스케일링](/docs/eks-best-practices/resource-cost/karpenter-autoscaling) — Karpenter Disruption, Spot 인스턴스 관리
- [EKS 서비스 메시 솔루션 비교 가이드](/docs/eks-best-practices/networking-performance/service-mesh) — Native Sidecar 등 사이드카 라이프사이클과 연관된 메시 솔루션 비교

### 외부 참조 {#73-외부-참조}

#### Kubernetes 공식 문서 {#kubernetes-공식-문서}

- [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Container Lifecycle Hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
- [Termination of Pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)

#### AWS 공식 문서 {#aws-공식-문서}

- [EKS Best Practices - Application Health Checks](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)
- [AWS Load Balancer Controller - Pod Readiness Gate](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.7/deploy/pod_readiness_gate/)
- [EKS Workshop - Health Checks](https://www.eksworkshop.com/docs/fundamentals/managed-node-groups/health-checks/)

#### Red Hat OpenShift 문서 {#red-hat-openshift-문서}

- [Monitoring Application Health by Using Health Checks](https://docs.openshift.com/container-platform/4.18/applications/application-health.html) — Liveness, Readiness, Startup Probe 구성
- [Using Init Containers](https://docs.openshift.com/container-platform/4.18/nodes/containers/nodes-containers-init.html) — Init Container 패턴 및 운영
- [Graceful Cluster Shutdown](https://docs.openshift.com/container-platform/4.18/backup_and_restore/graceful-cluster-shutdown.html) — Graceful Shutdown 절차

#### 추가 참고 자료 {#추가-참고-자료}

- [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [Google Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [AWS Prescriptive Guidance - Container Image Optimization](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/optimize-docker-images-for-eks.html)
- [Learnk8s - Graceful Shutdown](https://learnk8s.io/graceful-shutdown)
