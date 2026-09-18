---
title: Deployment checklist and references
description: Review pre-deployment checks and the complete reference list.
created: "2026-02-12"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 7
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Deployment checklist and references
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md)

## Comprehensive Checklist & References {#7-종합-체크리스트--참고-자료}

### Pre-Production Deployment Checklist {#71-프로덕션-배포-전-체크리스트}

#### Pod Health Checks {#pod-헬스체크}

| Item | Check | Priority |
|------|----------|---------|
| **Startup Probe** | Configure a startup probe for applications with slow startup (30+ seconds) | High |
| **Liveness Probe** | Check internal state only, excluding external dependencies | Required |
| **Readiness Probe** | Check readiness to receive traffic, including external dependencies | Required |
| **Probe timing** | Verify that failureThreshold × periodSeconds is appropriate | Medium |
| **Probe paths** | Separate `/healthz` (liveness) and `/ready` (readiness) | High |
| **ALB health checks** | Verify that the path matches the readiness probe | High |
| **Pod Readiness Gates** | Enable when using an ALB/NLB | Medium |

#### Graceful Shutdown {#graceful-shutdown}

| Item | Check | Priority |
|------|----------|---------|
| **preStop Hook** | Add `sleep 5` to wait for endpoint removal | Required |
| **SIGTERM handling** | Implement a SIGTERM handler in the application | Required |
| **terminationGracePeriodSeconds** | Configure to account for preStop + shutdown time (30-120 seconds) | Required |
| **Connection Draining** | Implement cleanup logic for HTTP Keep-Alive and WebSocket connections | High |
| **Data cleanup** | Clean up DB connections, message queues, and file handles | High |
| **Readiness failure** | Return a readiness probe failure response when shutdown starts | Medium |

#### Resources and Images {#리소스-및-이미지}

| Item | Check | Priority |
|------|----------|---------|
| **Resource requests/limits** | Configure CPU/memory requests (for HPA and VPA) | Required |
| **Image size** | Minimize with multi-stage builds (target 100MB or less) | Medium |
| **Image tags** | Do not use the `latest` tag; use semantic versioning | Required |
| **Security scanning** | Scan for CVEs with Trivy and Grype | High |
| **non-root user** | Run containers as non-root | High |

#### High Availability {#고가용성}

| Item | Check | Priority |
|------|----------|---------|
| **PodDisruptionBudget** | Configure minAvailable or maxUnavailable | Required |
| **Topology Spread** | Configure distribution across multiple AZs | High |
| **Replica count** | At least 2 (3+ in production) | Required |
| **Affinity/Anti-Affinity** | Prevent placement on the same node | Medium |

### Related Documents {#72-관련-문서}

- [EKS Troubleshooting and Incident Response Guide](/docs/eks-best-practices/operations-reliability/eks-debugging) — Probe debugging and Pod troubleshooting
- [EKS High Availability Architecture Guide](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide) — PDB, Graceful Shutdown, Pod Readiness Gates
- [High-Speed Autoscaling with Karpenter](/docs/eks-best-practices/resource-cost/karpenter-autoscaling) — Karpenter Disruption and Spot instance management
- [EKS Service Mesh Solution Comparison Guide](/docs/eks-best-practices/networking-performance/service-mesh) — Comparison of mesh solutions related to the sidecar lifecycle, including native sidecars

### External References {#73-외부-참조}

#### Official Kubernetes Documentation {#kubernetes-공식-문서}

- [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Container Lifecycle Hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)
- [Termination of Pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)

#### Official AWS Documentation {#aws-공식-문서}

- [EKS Best Practices - Application Health Checks](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)
- [AWS Load Balancer Controller - Pod Readiness Gate](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.7/deploy/pod_readiness_gate/)
- [EKS Workshop - Health Checks](https://www.eksworkshop.com/docs/fundamentals/managed-node-groups/health-checks/)

#### Red Hat OpenShift Documentation {#red-hat-openshift-문서}

- [Monitoring Application Health by Using Health Checks](https://docs.openshift.com/container-platform/4.18/applications/application-health.html) — Liveness, readiness, and startup probe configuration
- [Using Init Containers](https://docs.openshift.com/container-platform/4.18/nodes/containers/nodes-containers-init.html) — Init container patterns and operations
- [Graceful Cluster Shutdown](https://docs.openshift.com/container-platform/4.18/backup_and_restore/graceful-cluster-shutdown.html) — Graceful shutdown procedures

#### Additional References {#추가-참고-자료}

- [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md)
- [Google Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [EKS Best Practices - Container Image Size](https://docs.aws.amazon.com/eks/latest/best-practices/cost-opt-storage.html)
- [Learnk8s - Graceful Shutdown](https://learnk8s.io/graceful-shutdown)
