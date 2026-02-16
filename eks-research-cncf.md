# CNCF & Kubernetes Community Sources for EKS Operational Best Practices

> Research compiled from CNCF blogs, official Kubernetes documentation, AWS EKS guides, and leading Kubernetes community resources.

---

## 1. Health Probes (Liveness / Readiness / Startup)

### 1.1 Official & Authoritative

- **Configure Liveness, Readiness and Startup Probes** (kubernetes.io)
  - URL: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  - The canonical Kubernetes documentation on probe configuration. Covers HTTP, TCP, gRPC, and exec probe types with YAML examples, `initialDelaySeconds`, `periodSeconds`, `failureThreshold`, and startup probe usage for slow-starting containers.

- **Guide to Understanding Kubernetes Liveness Probes Best Practices** (Fairwinds)
  - URL: https://www.fairwinds.com/blog/a-guide-to-understanding-kubernetes-liveness-probes-best-practices
  - Explains when to use each probe type, common anti-patterns (e.g., liveness probes that check dependencies), and recommendations for production-grade probe configuration.

### 1.2 Community Deep-Dives

- **Using Kubernetes Probes Correctly** (DevEleap)
  - URL: https://www.develeap.com/Using-Kubernetes-Probes-Correctly/
  - Focuses on the philosophy behind probes — why Kubernetes puts dependency management responsibility on each service rather than using a centralized dependency graph. Practical guidance on avoiding cascading failures from misconfigured liveness probes.

- **Liveness and Readiness Probes — Best Practices** (setevoy / Hashnode)
  - URL: https://setevoy.hashnode.dev/kubernetes-liveness-and-readiness-probes-best-practices
  - Detailed walkthrough of probe semantics: livenessProbe for process health, readinessProbe for traffic readiness, startupProbe for gating liveness/readiness checks. Includes real-world configuration examples.

- **Kubernetes Probes - A Complete Guide to Container Health Checks** (CICube)
  - URL: https://cicube.io/blog/kubernetes-probes/
  - Comprehensive guide covering all three probe types with analogies, configuration parameters, and troubleshooting tips for probe failures.

- **How to Implement Health Checks for Network Services in Kubernetes** (OneUptime)
  - URL: https://oneuptime.com/blog/post/2026-01-08-kubernetes-network-health-checks/view
  - Focuses on health checks specifically for network services, covering probe design for services with external dependencies and network-sensitive workloads.

- **Kubernetes Health Checks: Types, Configuration & Debugging** (Spacelift)
  - URL: https://spacelift.io/blog/kubernetes-health-check
  - Covers HTTP, TCP, and command-based probes with debugging strategies when probes fail unexpectedly. Includes common pitfalls and configuration recommendations.

---

## 2. Graceful Shutdown & Pod Lifecycle Management

### 2.1 Comprehensive Guides

- **Graceful shutdown in Kubernetes** (learnk8s.io)
  - URL: https://learnk8s.io/graceful-shutdown
  - One of the most thorough resources on graceful shutdown. Covers the full pod termination sequence, race conditions between endpoint removal and SIGTERM delivery, and how to use preStop hooks to prevent dropped connections during rolling updates.

- **Kubernetes Guide: Graceful Shutdown with Lifecycle preStop Hook** (Datree)
  - URL: https://www.datree.io/resources/kubernetes-guide-graceful-shutdown-with-lifecycle-prestop-hook
  - Explains why pods are constantly terminated (scaling, deployments, node pressure) and how preStop hooks ensure zero-downtime terminations. Includes practical YAML examples.

- **Gracefully Shutting Down Pods in a Kubernetes Cluster** (Gruntwork)
  - URL: https://www.gruntwork.io/blog/gracefully-shutting-down-pods-in-a-kubernetes-cluster
  - Covers the kubelet's grace period mechanics, the relationship between preStop hooks and `terminationGracePeriodSeconds`, and the SIGTERM → SIGKILL sequence.

### 2.2 Practical Implementation

- **Kubernetes Pod Graceful Shutdown with SIGTERM & preStop Hooks** (DevOpsCube)
  - URL: https://www.devopscube.com/kubernetes-pod-graceful-shutdown/
  - Practical guide on implementing SIGTERM handlers in applications, configuring preStop hooks, and setting appropriate `terminationGracePeriodSeconds`. Warns about data loss from improper SIGTERM handling.

- **How to Configure Pod Termination Grace Period** (OneUptime)
  - URL: https://oneuptime.com/blog/post/2026-01-25-pod-termination-grace-period/view
  - Focused on getting the grace period right — too short causes lost requests, too long slows deployments. Includes guidance on measuring actual shutdown time.

- **Understanding Pod Lifecycle in Kubernetes: A Hands-on Guide to Graceful Shutdowns** (Medium)
  - URL: https://medium.com/@neidson.ds.souza/understanding-pod-lifecycle-in-kubernetes-a-hands-on-guide-to-graceful-shutdowns-7041eca85369
  - Hands-on walkthrough of preStop hooks, `terminationGracePeriodSeconds`, and graceful shutdown behavior with live examples.

- **Deleting a pod in K8s: Behind the magic** (Red Hat Learn)
  - URL: https://learn.redhat.com/t5/Containers-DevOps-OpenShift/Deleting-a-pod-in-K8s-Behind-the-magic/td-p/47198
  - Red Hat's explanation of the pod deletion sequence: SIGTERM signal, controlled shutdown, saving data, closing connections, and completing ongoing tasks.

---

## 3. Pod Disruption Budgets & Zero-Downtime Operations

- **How to Implement Pod Disruption Budgets for Zero-Downtime Updates** (OneUptime)
  - URL: https://oneuptime.com/blog/post/2026-01-06-kubernetes-pod-disruption-budgets/view
  - Explains PDB configuration with `minAvailable` and `maxUnavailable`, and why PDBs are essential during node drains and cluster upgrades.

- **A Simple Guide for Setting Pod Disruption Budgets and Rollout Strategies** (Flightcrew)
  - URL: https://www.flightcrew.io/blog/pdb-rollout-guide
  - Combines PDB configuration with rollout strategy design (RollingUpdate `maxSurge`/`maxUnavailable`) for coordinated zero-downtime deployments.

- **Zero-Downtime Operations That Actually Work** (Daily DevOps)
  - URL: https://daily-devops.net/posts/cluster-upgrades-zero-downtime-aks/
  - Real-world experience from 500+ node cluster upgrades. Covers cordon/drain mechanics, PDB configuration, and multi-node-pool rollout orchestration.

---

## 4. CPU/Memory Resource Requests, Limits & Optimization

### 4.1 Right-Sizing & VPA

- **How to Right-Size Kubernetes Resource Requests and Limits** (OneUptime)
  - URL: https://oneuptime.com/blog/post/2026-01-19-kubernetes-resource-requests-limits-rightsizing/view
  - Covers the impact of over-provisioning (wasted cost) vs. under-provisioning (evictions/throttling). Recommends setting requests to match 95th percentile usage.

- **Rightsize Pod Resource Requests** (DevZero)
  - URL: https://www.devzero.io/blog/kubernetes-vpa
  - Explains how VPA automatically adjusts CPU and memory requests based on observed usage, scaling resources vertically rather than horizontally.

- **Kubernetes VPA: Limitations, Best Practices, and the Future of Pod Rightsizing** (CloudPilot)
  - URL: https://www.cloudpilot.ai/en/blog/kubernetes-vpa-limitations/
  - Honest assessment of VPA limitations: pod restarts for applying changes, disruption to stateful workloads, and conflicts with HPA. Covers workarounds and future directions.

- **Why Pod Rightsizing Fails in Production: A Deep Dive into VPA** (ScaleOps)
  - URL: https://scaleops.com/blog/why-pod-rightsizing-fails-in-production-a-deep-dive-into-vpa-and-what-actually-works/
  - Critical analysis of why most teams avoid fully automated VPA in production. Covers recommendation quality issues, HPA/KEDA conflicts, and alternative approaches.

- **VPA Best Practices for Kubernetes Clusters** (Hokstad Consulting)
  - URL: https://hokstadconsulting.com/blog/vpa-best-practices-kubernetes-clusters
  - Practical VPA deployment guide: starting with recommendation-only mode, gradually enabling auto-updates, and monitoring for disruptions.

- **Kubernetes Cost Optimization: Resource Requests, Autoscaling, and Efficiency** (CalmOps)
  - URL: https://calmops.com/devops/kubernetes-cost-optimization-resource-requests-autoscaling/
  - Covers the cost implications of resource configuration. Explains CPU throttling vs. OOMKill behavior and recommends the 95th percentile approach for request sizing.

### 4.2 QoS Classes

- **Kubernetes QoS Explained: Classes & Resource Management** (Last9)
  - URL: https://last9.io/blog/kubernetes-qos-explained
  - Clear explanation of Guaranteed, Burstable, and BestEffort QoS classes with decision guidance on when to use each class.

- **Demystifying Three QoS Classes in Kubernetes** (The Linux Notes)
  - URL: https://thelinuxnotes.com/index.php/demystifying-three-qos-classes-in-kubernetes-a-guide-for-efficient-resource-management/
  - Deep dive into QoS class assignment rules, eviction priority during node pressure, and how to design resource specs for the desired QoS class.

---

## 5. General Kubernetes & CNCF Production Best Practices

### 5.1 CNCF Blog Resources

- **Top 5 Hard-Earned Lessons from the Experts on Managing Kubernetes** (CNCF Blog, 2025)
  - URL: https://www.cncf.io/blog/2025/11/18/top-5-hard-earned-lessons-from-the-experts-on-managing-kubernetes/
  - Lessons from production Kubernetes operators on managing the hidden complexity beyond cluster creation: DNS, networking, storage, monitoring, logging, secrets, and security.

- **12 Kubernetes Configuration Best Practices** (CNCF Blog)
  - URL: https://www.cncf.io/blog/2019/10/04/12-kubernetes-configuration-best-practices/
  - Foundational configuration best practices covering resource limits, security contexts, labels, and deployment strategies.

- **Best Practices for Deploying Applications to Production in Kubernetes** (CNCF Blog)
  - URL: https://www.cncf.io/blog/2022/05/30/best-practices-for-deploying-applications-to-production-in-kubernetes/
  - Pre-production checklist including load testing, canary deployments, and rollback strategies.

- **Optimized Kubernetes Cluster Architecture: Considerations and Best Practices** (CNCF Blog)
  - URL: https://www.cncf.io/blog/2023/06/15/optimized-kubernetes-cluster-architecture-considerations-and-best-practices/
  - Covers resource utilization, network topology, and storage considerations for optimal cluster architecture.

- **Kubernetes Policy-Driven Resource Optimization with Kyverno** (CNCF Blog)
  - URL: https://www.cncf.io/blog/2024/09/03/kubernetes-policy-driven-resource-optimization-with-kyverno/
  - Using Kyverno policies to enforce resource optimization standards across teams, balancing performance needs with cost efficiency.

### 5.2 Production Checklists & Comprehensive Guides

- **Checklist for Kubernetes in Production: Best Practices for SREs** (InfoQ)
  - URL: https://www.infoq.com/articles/checklist-kubernetes-production/
  - SRE-focused checklist covering resource management, workload placement, high availability, health probes, persistent storage, observability, GitOps automation, and cost optimization.

- **17 Kubernetes Best Practices Every Developer Should Know** (Spacelift)
  - URL: https://spacelift.io/blog/kubernetes-best-practices
  - Comprehensive list: namespaces, probes, autoscaling, resource limits, deployment strategies, RBAC, network policies, and more.

---

## 6. AWS EKS-Specific Best Practices

- **AWS EKS Best Practices Guides** (Official AWS GitHub)
  - URL: https://github.com/aws/aws-eks-best-practices
  - The official AWS best practices guide for EKS day-2 operations. Covers operational excellence, security, reliability, performance efficiency, and cost optimization. This is the primary reference for EKS-specific guidance.

- **EKS Best Practices — Reliability: Application** (AWS Documentation)
  - URL: https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html
  - EKS-specific reliability guidance for applications: health checks, graceful shutdown, resource management, PDBs, and scaling strategies.

- **13 AWS EKS Best Practices** (Lumigo)
  - URL: https://lumigo.io/aws-eks/13-aws-eks-best-practices-make-the-most-of-your-eks-clusters/
  - Practical EKS best practices covering cluster configuration, security, networking, monitoring, and cost optimization.

- **EKS Architecture Best Practices: Building Production-Ready Kubernetes Clusters on AWS** (TasrieIT)
  - URL: https://www.tasrieit.com/blog/eks-architecture-best-practices-building-production-ready-kubernetes-clusters-on-aws-2026
  - Network architecture, multi-AZ deployment, security group design, and VPC configuration for production EKS clusters.

---

## 7. Red Hat & OpenShift 커뮤니티 리소스

> Red Hat OpenShift는 엔터프라이즈 Kubernetes 운영의 표준을 제시하며, 이 자료들은 EKS를 포함한 모든 Kubernetes 환경에 적용 가능합니다.

### 7.1 운영 Best Practices

- **7 Best Practices for Writing Kubernetes Operators: An SRE Perspective** (Red Hat Blog)
  - URL: https://www.redhat.com/en/blog/7-best-practices-for-writing-kubernetes-operators-an-sre-perspective
  - SRE 관점의 Operator 패턴 모범 사례. Reconciliation 루프, 에러 핸들링, 멱등성 보장.

- **Kubernetes Patterns for Designing Cloud-Native Apps** (Red Hat)
  - URL: https://www.redhat.com/en/topics/cloud-native-apps/introduction-to-kubernetes-patterns
  - 클라우드 네이티브 앱 설계 패턴: Sidecar, Ambassador, Adapter, Init Container 패턴.

- **A Guide to Kubernetes Debugging** (Red Hat Developer)
  - URL: https://developers.redhat.com/articles/kubernetes-debugging
  - Kubernetes 디버깅 전략, Pod 상태 분석, 이벤트 로그 활용, 네트워크 문제 진단.

### 7.2 스케줄링 & 리소스 관리

- **Controlling Pod Placement with Taints and Tolerations** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-scheduler-taints-tolerations.html
  - Taints/Tolerations 전체 가이드, 전용 노드 그룹, 유지보수 모드 패턴.

- **Evicting Pods Using the Descheduler** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-descheduler.html
  - Descheduler 전략 상세: LowNodeUtilization, RemoveDuplicates, RemovePodsViolatingNodeAffinity.

- **Vertical Pod Autoscaler** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/nodes/pods/nodes-pods-vertical-autoscaler.html
  - VPA 모드별(Off/Initial/Auto) 설정, 운영 주의사항, 모니터링.

### 7.3 보안 & 네트워크 정책

- **OpenShift Network Policy** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/networking/network_policy/about-network-policy.html
  - NetworkPolicy 구성, Ingress/Egress 규칙, 네임스페이스 격리.

- **OpenShift Service Mesh** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/service_mesh/v2x/ossm-about.html
  - Istio 기반 서비스 메시, mTLS, 트래픽 관리, 관찰성.

### 7.4 클러스터 관찰성 & 로깅

- **Cluster Logging** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/observability/logging/cluster-logging.html
  - 클러스터 수준 로그 수집 아키텍처, 로그 포워딩, 필터링.

- **Monitoring Application Health by Using Health Checks** (OpenShift 4.18)
  - URL: https://docs.openshift.com/container-platform/4.18/applications/application-health.html
  - Probe 구성, 헬스체크 모범 사례, 장애 시나리오별 대응.

---

## 8. 추가 운영/디버깅 주제 (향후 문서 작성 후보)

### Priority 1: 핵심 운영

| 주제 | 설명 | 주요 레퍼런스 |
|------|------|---------------|
| **클러스터 업그레이드 전략** | K8s 버전 스큐 정책, 컨트롤 플레인/노드 순차 업그레이드, Deprecated API 마이그레이션, Blue/Green 업그레이드, EKS 버전 수명주기 | [K8s Version Skew](https://kubernetes.io/releases/version-skew-policy/), [EKS Upgrades](https://docs.aws.amazon.com/eks/latest/best-practices/cluster-upgrades.html) |
| **Persistent Volume & StatefulSet 운영** | PV/PVC 라이프사이클, StorageClass, 동적 프로비저닝, EBS/EFS CSI 드라이버, 볼륨 마운트 트러블슈팅 | [Debug StatefulSet](https://kubernetes.io/docs/tasks/debug/debug-application/debug-statefulset/), [EBS CSI](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) |
| **네트워킹 트러블슈팅** | Pod 간 연결 실패, DNS 문제, Service 디버깅, CNI 이슈, tcpdump/netstat 활용, NetworkPolicy 검증 | [K8s CNI Troubleshooting](https://kubernetes.io/docs/tasks/administer-cluster/migrating-from-dockershim/troubleshooting-cni-plugin-related-errors/) |

### Priority 2: 보안 & 거버넌스

| 주제 | 설명 | 주요 레퍼런스 |
|------|------|---------------|
| **시크릿 관리** | External Secrets Operator, AWS Secrets Manager/Parameter Store 통합, 시크릿 암호화·로테이션, GitOps 환경 시크릿 관리 | [External Secrets](https://external-secrets.io/), [EKS Secrets BP](https://docs.aws.amazon.com/eks/latest/best-practices/security.html) |
| **네트워크 정책** | NetworkPolicy 설정, Pod 간 통신 제어, 마이크로세그멘테이션, 제로 트러스트 | [K8s NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [OpenShift Network Policy](https://docs.openshift.com/container-platform/4.18/networking/network_policy/about-network-policy.html) |
| **멀티 테넌시** | Namespace 기반 격리, ResourceQuota 설계, 테넌트별 네트워크 정책, 비용 배분 | [K8s Multi-Tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/), [EKS Multi-Tenancy](https://docs.aws.amazon.com/eks/latest/best-practices/security.html) |

### Priority 3: 고급 운영

| 주제 | 설명 | 주요 레퍼런스 |
|------|------|---------------|
| **백업 및 복구** | Velero 백업, etcd 백업, 크로스 리전 백업, RTO/RPO 설계, 재해 복구 계획 | [Velero](https://velero.io/docs/), [EKS Backup BP](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html) |
| **관찰성 아키텍처** | Metrics/Logs/Traces 3대 축, ADOT, AMP/AMG, Container Insights, SLO/SLI | [EKS Observability BP](https://docs.aws.amazon.com/prescriptive-guidance/latest/amazon-eks-observability-best-practices/introduction.html) |
| **서비스 메시** | Istio/Linkerd 비교, mTLS, 카나리 배포, 트래픽 미러링, 성능 영향 | [Istio](https://istio.io/latest/docs/), [OpenShift Service Mesh](https://docs.openshift.com/container-platform/4.18/service_mesh/v2x/ossm-about.html) |
| **Operator & CRD 개발** | Operator 패턴, CRD 생성, 컨트롤러 개발, Kubebuilder, Operator SDK | [Red Hat Operator BP](https://www.redhat.com/en/blog/7-best-practices-for-writing-kubernetes-operators-an-sre-perspective), [Operator SDK](https://sdk.operatorframework.io/) |

---

## Summary of Key Themes

| Topic | Key Takeaway | Primary Sources |
|-------|-------------|-----------------|
| **Probes** | Use startup probes for slow apps; never check external dependencies in liveness probes; readiness probes gate traffic | kubernetes.io, Fairwinds, DevEleap |
| **Graceful Shutdown** | Handle SIGTERM in app code; use preStop hooks for connection draining; set `terminationGracePeriodSeconds` based on actual shutdown time | learnk8s.io, Gruntwork, Datree |
| **PDBs** | Always configure PDBs for production workloads; coordinate with rollout strategy `maxSurge`/`maxUnavailable` | Flightcrew, OneUptime |
| **Resource Optimization** | Set requests to P95 usage; use VPA in recommendation mode first; understand QoS class implications | OneUptime, CloudPilot, Last9 |
| **QoS Classes** | Use Guaranteed for critical workloads; Burstable for general apps; avoid BestEffort in production | Last9, The Linux Notes |
| **EKS Specifics** | Follow AWS EKS Best Practices Guide for reliability, security, and cost; leverage managed node groups and Karpenter | aws/aws-eks-best-practices |
| **Red Hat/OpenShift** | Enterprise-grade K8s patterns applicable to EKS; strong scheduling, logging, and operator documentation | OpenShift 4.18 Docs, Red Hat Blog |
| **추가 주제** | 클러스터 업그레이드, 스토리지, 네트워킹, 시크릿, 멀티테넌시, 백업, 관찰성, 서비스 메시 | K8s 공식, AWS, CNCF, Red Hat |
