# AWS Sources for EKS Operational Best Practices

> Research compiled from AWS official documentation, blogs, and prescriptive guidance.

---

## 1. Liveness/Readiness Probes Best Practices

### 1.1 Configure probes and load balancer health checks — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/ha-resiliency-amazon-eks-apps/probes-checks.html
- **Description:** Comprehensive guide on configuring liveness, readiness, and startup probes for EKS applications. Covers ALB health check integration, differences between probe types, `initialDelaySeconds` configuration, and why liveness probes should not depend on external factors. Also discusses NGINX and Istio health check patterns.

### 1.2 Running highly-available applications — Amazon EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/application.html
- **Description:** Core EKS best practices document covering health checks and self-healing, including Liveness, Startup, and Readiness probes. Also covers Pod termination handling, Pod Disruption Budgets, HPA/VPA scaling, blue/green and canary deployments, and chaos engineering for resiliency testing.

### 1.3 Troubleshoot liveness and readiness probes in Amazon EKS clusters — AWS re:Post
- **URL:** https://repost.aws/knowledge-center/eks-liveness-readiness-probe
- **Description:** Troubleshooting guide for probe failures in EKS. Explains probe behavior with practical examples — how unhealthy containers stop accepting traffic and how kubelet handles graceful vs. forced pod termination.

### 1.4 Liveness and readiness timeouts — AWS re:Post
- **URL:** https://repost.aws/questions/QUETeCQYmLR1uJQg-1hut9QA/liveness-and-readiness-timeouts
- **Description:** Community Q&A discussing timeout configuration for liveness and readiness probes in EKS, including common pitfalls and recommended timeout values.

### 1.5 Amazon VPC CNI — EKS Best Practices (Probe Timeout Section)
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/vpc-cni.html
- **Description:** Includes important guidance on increasing liveness and readiness probe timeout values for EKS 1.20+ clusters to prevent probe failures causing pods to become stuck in `containerCreating` state, especially in data-intensive and batch-processing clusters.

### 1.6 Failure management — Container Build Lens (Well-Architected)
- **URL:** https://docs.aws.amazon.com/wellarchitected/latest/container-build-lens/failure-management.html
- **Description:** Well-Architected guidance on implementing health checks in container builds. Covers Docker HEALTHCHECK vs. orchestration-level probes (EKS liveness/readiness), and best practices for container health monitoring.

### 1.7 Operate — Container Build Lens (Well-Architected)
- **URL:** https://docs.aws.amazon.com/wellarchitected/latest/container-build-lens/operate.html
- **Description:** Discusses monitoring and maintaining health of containerized workloads using orchestration tools like EKS. Covers container health checks for automatic detection and replacement of unhealthy containers.

---

## 2. Graceful Shutdown Patterns

### 2.1 Configure container lifecycle hooks — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/ha-resiliency-amazon-eks-apps/lifecycle-hooks.html
- **Description:** Deep dive into graceful container shutdowns on EKS. Explains SIGTERM signal handling, preStop lifecycle hooks, the asynchronous nature of Kubernetes pod termination, and the race condition between SIGKILL and iptables updates. Recommends using `preStop` hook with `sleep` to delay shutdown until ingress controllers remove endpoints.

### 2.2 How to build highly available Kubernetes applications with Amazon EKS Auto Mode — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/how-to-build-highly-available-kubernetes-applications-with-amazon-eks-auto-mode/
- **Description:** Covers essential HA concepts including Pod Disruption Budgets, Pod Readiness Gates, Deregistration Delay Timeout, Topology Spread Constraints, Termination Grace Period, and SIGTERM Handling. Includes test scenarios for pod fail, node fail, AZ fail, and cluster upgrade resilience.

### 2.3 How to rapidly scale your application with ALB on EKS (without losing traffic) — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/how-to-rapidly-scale-your-application-with-alb-on-eks-without-losing-traffic/
- **Description:** Demonstrates graceful shutdown patterns when scaling pods with ALB on EKS. Shows how to use separate health check endpoints, Kubernetes readiness probes, and PreStop hooks together for zero-downtime scaling.

### 2.4 Load Balancing — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/load-balancing.html
- **Description:** Best practices for load balancing on EKS including graceful shutdown during application upgrades, ELB health check integration with Kubernetes probes, IP Target-Type configuration, and Pod Disruption Budgets for voluntary disruptions.

### 2.5 Simplify node lifecycle with managed node groups — Amazon EKS User Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html
- **Description:** Documents the graceful shutdown process during managed node group operations — EKS sends drain signals to nodes, allowing Kubernetes to perform graceful pod shutdown. Covers Spot instance rebalancing and graceful draining.

### 2.6 Graceful shutdowns with ECS — AWS Blog (Reference Pattern)
- **URL:** https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/
- **Description:** While ECS-focused, provides foundational patterns for graceful container shutdown applicable to EKS. Covers SIGTERM handling, connection draining, and preventing HTTP 5xx errors during termination.

### 2.7 Set actions for AWS Fargate OS patching events — Amazon EKS User Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/userguide/fargate-pod-patching.html
- **Description:** Covers graceful pod eviction during Fargate OS patching on EKS. Discusses Pod Disruption Budgets, EventBridge rules for failed evictions, and strategies to minimize disruption during automated patching.

---

## 3. Pod CPU/Memory Resource Optimization and Right-Sizing

### 3.1 Dynamic Kubernetes request right sizing with Kubecost — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/dynamic-kubernetes-request-right-sizing-with-kubecost/
- **Description:** Explains using the Kubecost EKS add-on for container request right-sizing. Covers identifying over-requesting containers, one-time and scheduled resizing, Helm-based automation, and reports of 20-60% compute cost reduction in non-production environments.

### 3.2 Data-driven Amazon EKS cost optimization: A practical guide to workload analysis — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/
- **Description:** Identifies three primary causes of cost waste: greedy workloads (over-requesting), pet workloads (strict PDBs preventing consolidation), and isolated workloads (fragmented node pools). Recommends tools like Kubecost, Goldilocks, and VPA for optimization.

### 3.3 Kubernetes right-sizing with metrics-driven GitOps automation — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/kubernetes-right-sizing-with-metrics-driven-gitops-automation/
- **Description:** Automated resource optimization approach using Amazon Managed Service for Prometheus, Amazon Bedrock, and GitOps (Argo CD). Non-intrusive solution that generates pull requests for resource template updates based on metrics analysis.

### 3.4 Compute and Autoscaling (Cost Optimization) — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/cost-opt-compute.html
- **Description:** Core guide for right-sizing workloads on EKS. Covers setting appropriate requests/limits, tools (Goldilocks, KRR, Kubecost), HPA/VPA usage, reducing unused capacity, Spot instances, Savings Plans, and Graviton processor optimization.

### 3.5 Node and Workload Efficiency — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/node_and_workload_efficiency.html
- **Description:** Discusses node selection, bin-packing trade-offs, application right-sizing, pod sprawl, and the differences between utilization and saturation. Covers CPU limits, memory allocation, and HPA v2 with custom metrics.

### 3.6 Adjust pod resources with Vertical Pod Autoscaler — Amazon EKS User Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/userguide/vertical-pod-autoscaler.html
- **Description:** Step-by-step guide for deploying and testing VPA on EKS. VPA automatically adjusts CPU and memory reservations for pods based on actual usage patterns.

### 3.7 Scale pod deployments with Horizontal Pod Autoscaler — Amazon EKS User Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/userguide/horizontal-pod-autoscaler.html
- **Description:** Guide for deploying HPA on EKS to automatically scale pod replicas based on CPU utilization or custom metrics. Includes sample Apache web server deployment for testing.

### 3.8 Gain visibility into your Amazon EKS costs (Kubecost) — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/optimize-costs-microsoft-workloads/kubecost-main.html
- **Description:** Using Kubecost for EKS cost visibility including right-sizing cluster nodes, right-sizing container requests, managing underutilized nodes, and remedying abandoned workloads.

### 3.9 Avoiding OOM errors — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/windows-oom.html
- **Description:** Strategies for avoiding Out-of-Memory errors on EKS (Windows-focused but principles apply broadly). Covers memory reservation with `--kubelet-reserve` and `--system-reserve`, setting container resource requests/limits, and CloudWatch alerting.

### 3.10 Workload scaling — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/scaling-amazon-eks-infrastructure/workload-scaling.html
- **Description:** Discusses workload scaling in Kubernetes for maintaining application performance and resource efficiency in dynamic environments.

---

## 4. General EKS Operational Best Practices

### 4.1 Amazon EKS Best Practices Guide — Introduction
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html
- **Description:** Master index for the EKS Best Practices Guide covering security, reliability, cluster autoscaling, networking, scalability, cluster upgrades, cost optimization, Windows containers, hybrid deployments, and AI/ML workloads. Includes the `hardeneks` CLI tool for automated best practice validation.

### 4.2 Best Practices for Reliability — Amazon EKS
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html
- **Description:** Comprehensive reliability guide covering shared responsibility model, control plane and data plane reliability, managed node groups, Cluster Autoscaler, and infrastructure-as-code recommendations for EKS.

### 4.3 Designing for high availability and resiliency in Amazon EKS applications — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/ha-resiliency-amazon-eks-apps/introduction.html
- **Description:** Prescriptive guidance for designing HA and resilient EKS applications targeting near-zero RPO/RTO. Based on real-world deployments with recommendations for performance, reliability, and scalability.

### 4.4 EKS Control Plane — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/control-plane.html
- **Description:** Control plane best practices including authentication, API metrics monitoring, admission webhooks, DNS re-resolution, retries with backoff/jitter, client timeouts, ipvs mode for kube-proxy, and CNI IP caching.

### 4.5 EKS Data Plane — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/data-plane.html
- **Description:** Data plane reliability strategies including EKS Auto Mode, multi-AZ worker node distribution, Topology Spread Constraints, resource requests/limits for critical apps, resource quotas, LimitRanges, NodeLocal DNSCache, and CoreDNS auto-scaling.

### 4.6 Amazon EKS introduces node monitoring and auto repair capabilities — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/amazon-eks-introduces-node-monitoring-and-auto-repair-capabilities/
- **Description:** Node Monitoring Agent (NMA) for automatic detection and remediation of node-level issues. Covers GPU failure detection, kubelet/container runtime/networking/storage monitoring, NodeDiagnostic CRD for log collection, and integration with Pod Disruption Budgets.

### 4.7 HardenEKS: Validating Best Practices Programmatically — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/hardeneks-validating-best-practices-for-amazon-eks-clusters-programmatically/
- **Description:** Python CLI tool (`hardeneks`) that programmatically validates EKS clusters against the EKS Best Practices Guide recommendations. Useful for automated compliance checking.

### 4.8 Getting started with Amazon EKS Auto Mode — AWS Blog
- **URL:** https://aws.amazon.com/blogs/containers/getting-started-with-amazon-eks-auto-mode/
- **Description:** EKS Auto Mode overview covering automated infrastructure provisioning, compute instance selection, dynamic scaling, cost optimization, OS patching, and security integration. Includes guidance on PDBs, resource requests/limits, graceful shutdowns, and topology spread constraints.

### 4.9 Best practices for streamlining Amazon EKS observability — AWS Prescriptive Guidance
- **URL:** https://docs.aws.amazon.com/prescriptive-guidance/latest/amazon-eks-observability-best-practices/introduction.html
- **Description:** Observability best practices covering logging, monitoring, distributed tracing, and alerting for EKS. Discusses Prometheus, CloudWatch Container Insights, AWS X-Ray, and OpenTelemetry integration.

### 4.10 Cluster Services — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/scale-cluster-services.html
- **Description:** Scaling CoreDNS and Kubernetes Metrics Server. Covers reducing external DNS queries via ndots, NodeLocal DNS, cluster proportional autoscaler, VPA for Metrics Server, and lameduck duration for DNS propagation delays.

### 4.11 Karpenter — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html
- **Description:** Best practices for Karpenter node lifecycle management including NodePool configuration, TTL-based node deletion, Spot instance interruption handling, pod scheduling constraints, and consolidation settings.

### 4.12 Cluster Autoscaler — EKS Best Practices Guide
- **URL:** https://docs.aws.amazon.com/eks/latest/best-practices/cas.html
- **Description:** Comprehensive Cluster Autoscaler configuration guide covering Node Group optimization, performance/scalability tuning, Spot instances, EBS volumes, co-scheduling, accelerators, and scaling from zero.

---

## 5. Red Hat OpenShift 문서 (Kubernetes 운영 관점)

> OpenShift는 Kubernetes 기반 엔터프라이즈 플랫폼으로, Red Hat의 운영 가이드는 EKS 운영에도 직접 적용 가능한 Kubernetes 핵심 패턴을 다룹니다.

### 5.1 Pod Health & Lifecycle

- **Monitoring Application Health by Using Health Checks** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/applications/application-health.html
  - Liveness, Readiness, Startup Probe 구성. HTTP, TCP, exec 메커니즘별 설정 가이드.

- **Using Init Containers** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/containers/nodes-containers-init.html
  - Init Container 패턴, 순차 실행, 종속 서비스 대기 패턴.

- **Graceful Cluster Shutdown** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/backup_and_restore/graceful-cluster-shutdown.html
  - 클러스터 수준 Graceful Shutdown 절차, 백업 및 복구 컨텍스트.

- **Deleting a pod in K8s: Behind the magic** (Red Hat Learn)
  - URL: https://learn.redhat.com/t5/Containers-DevOps-OpenShift/Deleting-a-pod-in-K8s-Behind-the-magic/td-p/47198
  - Pod 삭제 시퀀스: SIGTERM → 제어된 종료 → 데이터 저장 → 연결 종료 → 작업 완료.

### 5.2 Resource Management & Autoscaling

- **Automatically Scaling Pods with HPA** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/pods/nodes-pods-autoscaling.html
  - HPA 구성, 커스텀 메트릭, 스케일링 동작 설정.

- **Vertical Pod Autoscaler** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/pods/nodes-pods-vertical-autoscaler.html
  - VPA 모드별 설정 (Off, Initial, Auto), 운영 주의사항.

- **Quotas and Limit Ranges** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/applications/quotas/quotas-setting-per-project.html
  - 프로젝트(Namespace) 수준 ResourceQuota, LimitRange 설정.

- **Using CPU Manager** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/scalability_and_performance/using-cpu-manager.html
  - CPU 리소스 고급 관리, static CPU pinning, NUMA awareness.

### 5.3 Scheduling & Availability

- **Controlling Pod Placement with Taints and Tolerations** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-scheduler-taints-tolerations.html
  - NoSchedule, PreferNoSchedule, NoExecute 효과별 설정.

- **Placing Pods on Specific Nodes with Pod Affinity** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-scheduler-pod-affinity.html
  - Pod Affinity/Anti-Affinity 규칙, topologyKey 선택.

- **Evicting Pods Using the Descheduler** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-descheduler.html
  - Descheduler 전략, LowNodeUtilization, RemoveDuplicates, 운영 가이드.

- **Managing Pods** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/pods/nodes-pods-configuring.html
  - Pod 관리 기본, 스케줄링, 리소스 설정 통합 가이드.

### 5.4 Cluster Operations & Debugging

- **7 Best Practices for Writing Kubernetes Operators: An SRE Perspective** (Red Hat Blog)
  - URL: https://www.redhat.com/en/blog/7-best-practices-for-writing-kubernetes-operators-an-sre-perspective
  - Operator 패턴 모범 사례, Reconciliation 루프, 에러 핸들링.

- **Node Metrics Dashboard** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/nodes-dashboard-using.html
  - 노드 메트릭 대시보드, Pod 리소스 소비 모니터링.

- **Cluster Logging** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/observability/logging/cluster-logging.html
  - 클러스터 수준 로깅 아키텍처, 로그 수집 및 분석.

---

## 6. 추가 운영/디버깅 주제 레퍼런스 (향후 문서 작성용)

### 6.1 클러스터 업그레이드 전략

- [Kubernetes Version Skew Policy](https://kubernetes.io/releases/version-skew-policy/)
- [Update an Amazon EKS cluster](https://docs.aws.amazon.com/eks/latest/userguide/update-cluster.html)
- [EKS Best Practices — Cluster Upgrades](https://docs.aws.amazon.com/eks/latest/best-practices/cluster-upgrades.html)
- [OpenShift — Updating Clusters](https://docs.openshift.com/container-platform/4.18/updating/updating_a_cluster/updating-cluster-web-console.html)

### 6.2 네트워크 정책 및 보안

- [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [EKS Best Practices — Network Security](https://docs.aws.amazon.com/eks/latest/best-practices/security.html)
- [OpenShift — Network Policy](https://docs.openshift.com/container-platform/4.18/networking/network_policy/about-network-policy.html)

### 6.3 시크릿 관리

- [External Secrets Operator](https://external-secrets.io/)
- [EKS Best Practices — Data Encryption and Secrets](https://docs.aws.amazon.com/eks/latest/best-practices/security.html)
- [AWS Secrets Manager CSI Driver](https://docs.aws.amazon.com/secretsmanager/latest/userguide/integrating_csi_driver.html)

### 6.4 Persistent Volume & StatefulSet 운영

- [Debug StatefulSet](https://kubernetes.io/docs/tasks/debug/debug-application/debug-statefulset/)
- [Amazon EBS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)
- [Amazon EFS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html)

### 6.5 멀티 테넌시 및 리소스 격리

- [Kubernetes Multi-Tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/)
- [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [EKS Best Practices — Multi-Tenancy](https://docs.aws.amazon.com/eks/latest/best-practices/security.html)

### 6.6 백업 및 복구

- [Velero Documentation](https://velero.io/docs/)
- [EKS Best Practices — Backup and Restore](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)
- [OpenShift — Backing Up etcd](https://docs.openshift.com/container-platform/4.18/backup_and_restore/control_plane_backup_and_restore/backing-up-etcd.html)

### 6.7 관찰성 아키텍처

- [EKS Observability Best Practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/amazon-eks-observability-best-practices/introduction.html)
- [EKS Control Plane Logs](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html)
- [OpenShift — Cluster Logging](https://docs.openshift.com/container-platform/4.18/observability/logging/cluster-logging.html)

### 6.8 서비스 메시

- [Istio Documentation](https://istio.io/latest/docs/)
- [AWS App Mesh](https://aws.amazon.com/app-mesh/)
- [OpenShift Service Mesh](https://docs.openshift.com/container-platform/4.18/service_mesh/v2x/ossm-about.html)

---

## Summary

| Topic | Resource Count | Key Sources |
|-------|---------------|-------------|
| Probes & Health Checks | 7 | AWS Prescriptive Guidance, EKS Best Practices Guide, re:Post |
| Graceful Shutdown | 7 | AWS Prescriptive Guidance, AWS Blogs, EKS User Guide |
| Resource Optimization | 10 | AWS Blogs, EKS Best Practices Guide, EKS User Guide |
| General Operations | 12 | EKS Best Practices Guide, AWS Blogs, Prescriptive Guidance |
| Red Hat OpenShift | 14 | OpenShift 4.18 Docs, Red Hat Blog, Red Hat Learn |
| 추가 주제 레퍼런스 | 22 | K8s 공식, AWS, OpenShift, CNCF |
| **Total** | **72** | |

---

*Last updated: 2026-02-12. Red Hat OpenShift 문서 및 추가 운영/디버깅 주제 레퍼런스 추가.*
