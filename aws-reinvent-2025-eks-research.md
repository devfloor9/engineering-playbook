# AWS re:Invent 2025 - EKS Operations, Debugging & Observability Research

**Research Date:** February 12, 2026
**Event:** AWS re:Invent 2025 (December 1-5, 2025, Las Vegas)
**Focus:** EKS operations, debugging, observability, and best practices
**Sources:** re:Invent 2025 세션, AWS Container Blog, AWS News Blog, AWS Cloud Operations Blog, AWS Security Blog, AWS DevOps Blog, AWS Migration Blog, Community Articles

---

## Executive Summary

AWS re:Invent 2025 featured 48 dedicated Kubernetes sessions as part of the Containers and Serverless (CNS) track, representing the most comprehensive Kubernetes programming AWS has ever assembled. Major announcements included:

- **Container Network Observability** - New granular network monitoring capabilities
- **Provisioned Control Plane** - Pre-allocated control plane capacity for ultra-scale workloads
- **EKS Auto Mode Enhancements** - Continued evolution of autonomous cluster management
- **GuardDuty Extended Threat Detection** - Expanded to EC2, ECS, and EKS
- **CloudWatch Control Plane Metrics** - New EKS control plane observability
- **Gateway API Support** - Enhanced traffic routing with AWS Load Balancer Controller

---

## 1. Major EKS Announcements at re:Invent 2025

### 1.1 Container Network Observability (November 19, 2025)

**What:** Enhanced network observability features providing deeper insights into container networking environments.

**Key Capabilities:**
- Granular, network-related metrics for better performance measurement
- Dynamic visualization of network traffic landscape and behavior
- Pod-to-pod communication patterns
- Network performance monitoring across clusters
- Integration with CloudWatch Container Insights

**Links:**
- [Official Announcement](https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-eks-enhanced-container-network-observability/)
- [Blog Post: Monitor network performance and traffic](https://aws.amazon.com/blogs/aws/monitor-network-performance-and-traffic-across-your-eks-clusters-with-container-network-observability/)

**Relevance:** Critical for debugging network-related issues, understanding microservices communication patterns, and optimizing network performance. Directly supports operational best practices for monitoring and troubleshooting.

---

### 1.2 Provisioned Control Plane (November 21, 2025)

**What:** New capability to pre-provision control plane capacity from well-defined scaling tiers (XL, 2XL, 4XL).

**Key Features:**
- Predictable, high-performance Kubernetes operations at scale
- Pre-allocated capacity ensures control plane always ready for traffic spikes
- Well-defined performance characteristics for API request concurrency
- Enhanced pod scheduling rates
- Larger cluster database size support
- Complements existing Standard Control Plane with dynamic scaling

**Use Cases:**
- Ultra-scale AI training workloads
- High-performance computing (HPC)
- Mission-critical applications requiring predictable performance
- Workloads with unpredictable burst patterns

**Links:**
- [Official Announcement](https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-eks-provisioned-control-plane/)
- [Blog Post: Amazon EKS introduces Provisioned Control Plane](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/)

**Relevance:** Addresses operational challenges with large-scale clusters, ensuring control plane reliability during peak loads. Important for capacity planning and performance optimization.

---

### 1.3 EKS Control Plane Observability Enhancements (December 19, 2025)

**What:** New CloudWatch metrics for proactive monitoring of EKS control plane health and performance.

**Key Capabilities:**
- CloudWatch Observability Operator for simplified metric collection
- New Amazon EKS control plane metrics
- Proactive monitoring for optimal cluster performance
- Integration with existing CloudWatch Container Insights
- Automated alerting on control plane issues

**Links:**
- [Blog Post: Proactive Amazon EKS monitoring with CloudWatch Operator](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)

**Relevance:** Essential for understanding control plane health, detecting issues before they impact workloads, and maintaining SLOs. Critical for production operations.

---

### 1.4 EKS Auto Mode Evolution

**What:** Continued enhancements to autonomous Kubernetes operations.

**Key Features:**
- Automatic infrastructure provisioning
- Optimal compute instance selection
- Dynamic resource scaling
- Continuous cost optimization
- Managed core add-ons
- OS patching automation
- AWS security services integration

**Links:**
- [Blog Post: Amazon EKS Blueprints for CDK now supporting Auto Mode](https://aws.amazon.com/blogs/containers/amazon-eks-blueprints-for-cdk-now-supporting-amazon-eks-auto-mode/)
- [Session Video: Amazon EKS Auto Mode (CNS354)](https://www.antstack.com/talks/reinvent25/aws-reinvent-2025---amazon-eks-auto-mode-evolving-kubernetes-ops-to-enable-innovation-cns354/)

**Relevance:** Reduces operational overhead, allowing teams to focus on application development rather than infrastructure management. Supports best practices by automating routine operational tasks.

---

## 2. re:Invent 2025 Sessions - EKS Operations & Debugging

### 2.1 Core EKS Sessions

#### CNS205: The Future of Kubernetes on AWS
**Session ID:** CNS205
**Video:** [YouTube Link](https://www.youtube.com/watch?v=Q6HT6zFcWzo)
**Description:** Amazon EKS product leadership presented latest innovations and strategies for building Kubernetes platforms. Covered how organizations use EKS for demanding applications in cloud, on-premises, and edge environments.

**Key Topics:**
- Latest EKS innovations
- Building Kubernetes platforms faster
- Real-world use cases from various organizations
- Cloud, on-premises, and edge deployment strategies

**Relevance:** High-level strategic overview of EKS direction, useful for understanding AWS's vision for Kubernetes operations.

---

#### CNS354: Amazon EKS Auto Mode - Evolving Kubernetes Ops
**Session ID:** CNS354
**Video/Info:** [AntStack Talk Summary](https://www.antstack.com/talks/reinvent25/aws-reinvent-2025---amazon-eks-auto-mode-evolving-kubernetes-ops-to-enable-innovation-cns354/)
**Description:** Deep dive into how EKS Auto Mode evolves Kubernetes operations to enable innovation by automating infrastructure management.

**Key Topics:**
- Evolution of Kubernetes operations
- Auto Mode capabilities and architecture
- How automation enables developer innovation
- Best practices for adopting Auto Mode

**Relevance:** Directly addresses operational best practices through automation, reducing manual intervention and potential errors.

---

#### CNS421: Streamline Amazon EKS Operations with Agentic AI
**Session ID:** CNS421
**Video:** [YouTube Link](https://www.youtube.com/watch?v=4s-a0jY4kSE)
**Description:** Code talk demonstrating how to build agentic AI systems for automated EKS cluster management, from real-time issue diagnosis to guided remediation.

**Key Topics:**
- Building AI agents for EKS operations
- Model Context Protocol (MCP) integration with AWS services
- Automated incident response and debugging
- Leveraging tribal knowledge for contextual troubleshooting
- Auto-remediation capabilities

**Relevance:** Cutting-edge approach to operations and debugging. Shows how to automate troubleshooting workflows using AI, relevant for advanced operational practices.

---

#### CNS429: Under the Hood - Architecting Amazon EKS for Scale
**Session ID:** CNS429
**Video/Info:** [AntStack Talk Summary](https://www.antstack.com/talks/reinvent25/aws-reinvent-2025---under-the-hood-architecting-amazon-eks-for-scale-and-performance-cns429/)
**Description:** Deep technical dive into EKS architecture, explaining how it provides reliability, scalability, and resiliency.

**Key Topics:**
- Internal EKS architecture
- Control plane scalability mechanisms
- Reliability and resiliency patterns
- Performance optimization techniques

**Relevance:** Understanding EKS internals is crucial for effective debugging and optimization. Helps operators make informed decisions about cluster design and troubleshooting.

---

#### Simplify Your Kubernetes Journey with Amazon EKS
**Video:** [YouTube Link](https://www.youtube.com/watch?v=Wl12hmjFh5E)
**Description:** Overview of new managed Kubernetes capabilities for workload orchestration and resource management, reducing the need to manage open source components.

**Key Topics:**
- New managed capabilities for workload orchestration
- Resource management improvements
- Reducing operational complexity
- AWS-managed alternatives to self-managed components

**Relevance:** Highlights managed services that reduce operational burden and align with best practices for minimizing undifferentiated heavy lifting.

---

### 2.2 Observability Sessions

#### From Metrics to Management: EKS Observability Best Practices
**Video:** [YouTube Link](https://www.youtube.com/watch?v=GXIr7h5aL2o)
**Description:** Comprehensive guide on baking observability into EKS, covering Prometheus and Grafana setup, smart instrumentation, and turning metrics into release decisions.

**Key Topics:**
- Setting up Prometheus and Grafana on EKS
- Impact of deployments on SLOs
- Reducing noise with smarter instrumentation
- Converting metrics into actionable release decisions
- Production-ready configurations and patterns

**Relevance:** Directly applicable to observability best practices. Provides actionable patterns for monitoring deployments and maintaining SLOs.

---

#### Containerized Applications Observability on EKS
**Video:** [YouTube Link - re:Invent 2024](https://www.youtube.com/watch?v=Icz8MBHCPuQ)
**Description:** Lightning talk on effective strategies for gaining visibility into EKS workloads using AWS observability services.

**Key Topics:**
- CloudWatch Container Insights
- CloudWatch Application Signals
- CloudWatch Logs Insights for EKS
- Complete observability strategy
- Quick issue resolution techniques

**Relevance:** Essential foundation for EKS observability. Covers AWS-native tools that integrate well with EKS.

---

### 2.3 Related Sessions (Historical Context)

#### re:Invent 2024: When Troubleshooting Becomes a Months-Long Journey (DEV345)
**Video:** [YouTube Link](https://www.youtube.com/watch?v=wI_DHqjVVZ4)
**Description:** Real-world troubleshooting case study demonstrating complex debugging scenarios.

**Relevance:** Valuable lessons learned from production debugging experiences.

---

#### re:Invent 2023: My Pods Aren't Responding! (BOA205)
**Video:** [YouTube Link](https://www.youtube.com/watch?v=_wwzCvTNZx0)
**Description:** Multi-scenario troubleshooting demo covering kubectl, CloudWatch, and OpenTelemetry for debugging containerized applications.

**Key Topics:**
- Troubleshooting framework for production issues
- Kubernetes architecture deep dive
- How errors may not appear as expected
- Using kubectl, CloudWatch, and OpenTelemetry effectively

**Relevance:** Classic troubleshooting session still relevant for understanding debugging approaches.

---

## 3. Related Service Announcements

### 3.1 Amazon GuardDuty Extended Threat Detection

**EC2 and ECS Support (December 2, 2025):**
- [Official Announcement](https://aws.amazon.com/about-aws/whats-new/2025/12/guardduty-extended-threat-detection-ec2-ecs/)
- [Blog Post](https://aws.amazon.com/blogs/aws/amazon-guardduty-adds-extended-threat-detection-for-amazon-ec2-and-amazon-ecs/)

**EKS Support (June 17, 2025):**
- [Official Announcement](https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-guardduty-threat-detection-eks)
- [Blog Post](https://aws.amazon.com/blogs/aws/amazon-guardduty-expands-extended-threat-detection-coverage-to-amazon-eks-clusters)

**Key Capabilities:**
- AI/ML-powered multi-stage attack detection
- Correlation across EKS audit logs, runtime behavior, malware execution, and AWS API activity
- Attack sequence findings spanning multiple resources and data sources
- Critical severity threat identification
- Reduced first-level analysis time

**Real-World Impact:**
- [Cryptomining Campaign Detection](https://aws.amazon.com/blogs/security/cryptomining-campaign-targeting-amazon-ec2-and-amazon-ecs/) - GuardDuty identified ongoing cryptocurrency mining campaign beginning November 2, 2025

**Relevance:** Critical security observability for EKS clusters. Helps detect sophisticated attacks that traditional monitoring might miss.

---

### 3.2 CloudWatch Container Insights & Application Signals

**Updates:**
- Enhanced container-level metrics for ECS (also applicable patterns for EKS)
- New CloudWatch Observability Operator for EKS
- Improved drill-down capabilities across container layers
- Visual identification of issues like memory leaks
- Reduced mean time to resolution (MTTR)

**Links:**
- [Video: Achieve detailed observability with container level metrics](https://www.youtube.com/watch?v=jjBQtrNBI4c)
- [Blog: Proactive EKS monitoring with CloudWatch Operator](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)

**Relevance:** Core observability platform for EKS. Essential for monitoring resource consumption, identifying anomalies, and troubleshooting.

---

### 3.3 AWS Distro for OpenTelemetry (ADOT)

**Recent Developments:**
- Continued integration improvements with CloudWatch, Prometheus, and X-Ray
- Enhanced service discovery capabilities
- Better support for metrics and traces collection from EKS

**Links:**
- [Monitoring ECS and EKS at Scale with Container Insights and Prometheus](https://medium.com/@chisomjude0205/monitoring-ecs-and-eks-at-scale-with-cloudwatch-container-insights-and-prometheus-a7faa2e5c8d2)
- [Implementing Observability in Kubernetes: Open Source vs AWS Native](https://aws.plainenglish.io/implementing-observability-in-a-kubernetes-environment-open-source-vs-aws-native-ab016670d9b0)

**Relevance:** Provides vendor-neutral observability instrumentation. Important for teams wanting flexibility in observability backends.

---

### 3.4 Karpenter Updates

**Session:**
- [Supercharge your Karpenter (re:Invent 2025)](https://www.youtube.com/watch?v=kUQ4Q11F4iQ)

**Key Topics:**
- Advanced Karpenter strategies beyond basic auto-scaling
- Fine-tuning resource allocation
- Dynamic configuration for real-world workloads
- Multi-layer automation complementing Karpenter
- Cost optimization and efficiency improvements

**Recent Integration:**
- [Karpenter with AWS Application Recovery Controller (ARC)](https://aws.amazon.com/blogs/containers/enhance-kubernetes-high-availability-with-amazon-application-recovery-controller-and-karpenter-integration/) - Enhanced high availability through automated AZ evacuation

**Relevance:** Karpenter is critical for efficient node scaling. Advanced techniques help optimize costs and performance, directly supporting operational best practices.

---

### 3.5 Gateway API and AWS Load Balancer Controller

**Major Updates:**
- Gateway API 1.4 released (November 2025) - [Kubernetes Blog](https://kubernetes.io/blog/2025/11/06/gateway-api-v1-4/)
- AWS Load Balancer Controller supports Gateway API v1.3.0
- L4 routes (TCPRoute, UDPRoute, TLSRoute) with NLB (v2.13.3+)
- L7 routes (HTTPRoute, GRPCRoute) with ALB (v2.14.0+)
- QUIC protocol support for HTTP/3 on NLB

**Resources:**
- [Kubernetes Gateway API in Action (AWS Blog)](https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/)
- [AWS Load Balancer Controller Gateway API Docs](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/gateway/gateway/)
- [Zero-Downtime Migration from Ingress to Gateway API](https://medium.com/@gudiwada.chaithu/zero-downtime-migration-from-kubernetes-ingress-to-gateway-api-on-aws-eks-642f3432d394)

**Relevance:** Modern traffic routing with role-oriented, protocol-aware configuration. Supports advanced use cases like canary deployments, which are important for safe releases and operational excellence.

---

## 4. EKS Version Updates

### 4.1 Kubernetes 1.32 Support (January 24, 2025)

**Official Announcement:**
- [Amazon EKS and EKS Distro now supports Kubernetes 1.32](https://aws.amazon.com/about-aws/whats-new/2025/01/amazon-eks-eks-distro-kubernetes-version-1-32/)

**Key Features:**
- Stable support for custom resource field selectors
- Auto removal of PVCs created by StatefulSets
- Removed: v1beta3 API version of FlowSchema and PriorityLevelConfiguration

**Upgrade Resources:**
- [Amazon EKS Upgrade Journey 1.31 to 1.32](https://marcincuber.medium.com/amazon-eks-upgrade-journey-from-1-31-to-1-32-hi-to-penelope-dfd7f6820e80)
- [Upgrading AWS EKS from 1.31 to 1.32](https://academy.zaplabs.tech/upgrading-aws-eks-kubernetes-version-from-1-31-to-1-32-b366af7f7b0d)
- [Reddit: Experiences upgrading EKS 1.31 to 1.32 + AL2 to AL2023](https://www.reddit.com/r/aws/comments/1p26out/experiences_upgrading_eks_131_132_al2_al2023/)

**Relevance:** Staying current with Kubernetes versions is critical for security and access to new features. Upgrade guides help teams plan migrations safely.

---

### 4.2 Amazon Linux 2023 (AL2023) for EKS Nodes

**Key Changes:**
- Modern kernel and systemd versions
- containerd improvements
- Potential CNI and networking differences from AL2
- DaemonSet compatibility considerations

**Relevance:** Node OS upgrades require careful testing. Understanding differences helps prevent production issues during migrations.

---

## 5. Cost Optimization

### Data-Driven EKS Cost Optimization (November 26, 2025)

**Blog Post:** [Data-driven Amazon EKS cost optimization](https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/)

**Key Topics:**
- Workload analysis for cost optimization
- Common patterns of resource waste
- Comprehensive monitoring strategies
- Right-sizing recommendations
- Cost savings while maintaining performance and resilience

**Additional Resources:**
- [Maximize EKS efficiency: Auto Mode, Graviton, and Spot](https://aws.amazon.com/blogs/containers/) (Containers blog homepage)
- Up to 40% better price-performance with Graviton
- Up to 90% savings with Spot instances

**Relevance:** Cost optimization is an operational best practice. Understanding resource utilization through observability enables informed optimization decisions.

---

## 6. Blog Posts from re:Invent Period (Nov-Dec 2025)

### Key Container Blog Posts:

1. **[Guide to Amazon EKS and Kubernetes sessions at re:Invent 2025](https://aws.amazon.com/blogs/containers/guide-to-amazon-eks-and-kubernetes-sessions-at-aws-reinvent-2025/)**
   - Comprehensive overview of 48 EKS/Kubernetes sessions
   - Session categories and tracks
   - Links to all sessions

2. **[Top announcements of AWS re:Invent 2025](https://aws.amazon.com/blogs/aws/top-announcements-of-aws-reinvent-2025/)**
   - Complete list of re:Invent announcements
   - Container and compute sections
   - Links to detailed announcements

3. **[AWS re:Invent 2025 Series Part 1: Core Compute Updates](https://www.macondotek.com/blogs/reinvent2025computeupdates/)**
   - Third-party analysis of compute and container announcements
   - Lambda Managed Instances impact
   - EKS evolution discussion

---

## 7. Relevance to EKS Operations & Debugging Documentation

### 7.1 Probes & Health Checks
**Relevant Announcements:**
- Container Network Observability - helps validate probe connectivity
- CloudWatch Control Plane Metrics - monitor apiserver health affecting probe checks
- Enhanced Container Insights - track probe failure patterns

---

### 7.2 Graceful Shutdown
**Relevant Announcements:**
- Karpenter improvements - better node lifecycle management
- Auto Mode enhancements - automated handling of node draining
- Network observability - verify connection draining during shutdown

---

### 7.3 Resource Management
**Relevant Announcements:**
- Cost optimization guidance - right-sizing based on actual usage
- Auto Mode - automatic resource optimization
- Graviton and Spot integration - efficient resource utilization

---

### 7.4 Pod Scheduling
**Relevant Announcements:**
- Provisioned Control Plane - improved scheduling performance at scale
- Karpenter advanced strategies - intelligent node selection
- Auto Mode - automated node provisioning for workload requirements

---

### 7.5 Debugging & Troubleshooting
**Relevant Announcements:**
- Container Network Observability - network debugging capabilities
- CloudWatch Control Plane Metrics - control plane issue identification
- Agentic AI for EKS Operations (CNS421) - automated troubleshooting
- GuardDuty Extended Threat Detection - security issue identification

---

### 7.6 Observability Best Practices
**Relevant Announcements:**
- CloudWatch Observability Operator - simplified metric collection
- Container Network Observability - comprehensive network visibility
- Application Signals - application-level observability
- Prometheus and Grafana patterns - production-ready monitoring

---

### 7.7 Upgrades & Maintenance
**Relevant Announcements:**
- Kubernetes 1.32 support and upgrade guides
- AL2023 migration considerations
- Auto Mode - automated OS patching
- Control plane version management

---

## 8. YouTube Search Results Summary

**Search Terms Used:**
- "AWS re:Invent 2025 EKS"
- "AWS re:Invent 2025 Kubernetes"
- "AWS re:Invent 2025 containers debugging observability"

**Key Sessions Found:**
1. CNS205 - Future of Kubernetes on AWS
2. CNS354 - EKS Auto Mode Evolution
3. CNS421 - Streamline EKS Operations with Agentic AI
4. CNS429 - Under the Hood: Architecting EKS for Scale
5. Simplify Kubernetes Journey with EKS
6. From Metrics to Management - Observability Best Practices
7. Supercharge Your Karpenter

**Note:** Many 2025 sessions are still being published to YouTube. Check the [AWS Events YouTube channel](https://www.youtube.com/@AWSEventsChannel) for additional uploads.

---

## 9. Additional Resources

### Community Blog Posts & Articles:

1. **[AWS re:Invent 2025: The Future of Kubernetes on EKS](https://devoriales.com/post/419/aws-re-invent-2024-the-future-of-kubernetes-on-eks)** by Aleksandro Matejic
   - Personal perspectives on announcements
   - Practical implications for EKS users

2. **[AWS unveils EKS capabilities to reinvent Kubernetes operations](https://siliconangle.com/2025/12/01/aws-unveils-eks-capabilities-reinvent-kubernetes-operations-ai-workloads-surge/)** by SiliconANGLE
   - Analysis of EKS Capabilities announcement
   - Impact on AI workload management

3. **[re:Invent 2025 - Future of Kubernetes](https://repost.aws/articles/ARpqKdaLinSJqT4dTbRn7WUg/re-invent-2025-future-of-kubernetes)** on AWS re:Post
   - Community discussion and Q&A
   - Recent EKS enhancements summary

### AWS Documentation:

1. **[Review release notes for Kubernetes versions on standard support](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions-standard.html)**
   - Official upgrade considerations
   - Version-specific changes and deprecations

2. **[Container Insights Prometheus metrics monitoring](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights-Prometheus.html)**
   - Official Prometheus integration guide
   - Metrics collection configuration

---

## 10. Key Takeaways for Documentation

### Must-Cover Topics Based on re:Invent 2025:

1. **Network Observability**
   - How to enable Container Network Observability
   - Interpreting network metrics
   - Troubleshooting network issues with new tools

2. **Control Plane Monitoring**
   - Setting up CloudWatch Observability Operator
   - Key control plane metrics to monitor
   - Alerting on control plane issues

3. **Security Observability**
   - GuardDuty Extended Threat Detection for EKS
   - Understanding attack sequence findings
   - Integrating security monitoring into operations

4. **Modern Traffic Management**
   - Gateway API adoption strategies
   - Migration from Ingress to Gateway API
   - Advanced routing patterns for canary deployments

5. **Automated Operations**
   - When to use EKS Auto Mode vs manual management
   - Karpenter advanced configurations
   - AI-assisted troubleshooting approaches

6. **Cost-Aware Operations**
   - Observability-driven cost optimization
   - Right-sizing based on metrics
   - Graviton and Spot instance strategies

### Documentation Structure Recommendations:

```
EKS Operations Best Practices
├── Observability
│   ├── Network Observability (NEW)
│   ├── Control Plane Monitoring (NEW)
│   ├── Application Monitoring
│   └── Security Monitoring (GuardDuty)
├── Debugging & Troubleshooting
│   ├── Network Issues (use new observability)
│   ├── Control Plane Issues
│   ├── Application Issues
│   └── AI-Assisted Debugging (NEW)
├── Resource Management
│   ├── Right-Sizing (data-driven approach)
│   ├── Karpenter Advanced Patterns (NEW)
│   └── Cost Optimization
├── Traffic Management
│   ├── Gateway API Migration (NEW)
│   ├── Advanced Routing
│   └── Load Balancer Best Practices
└── Operational Excellence
    ├── Automated Operations (Auto Mode)
    ├── Upgrade Management
    └── Security Best Practices
```

---

## 11. Session Catalog - Complete List

### Confirmed re:Invent 2025 Sessions (48 total in CNS track):

The [Guide to Amazon EKS and Kubernetes sessions](https://aws.amazon.com/blogs/containers/guide-to-amazon-eks-and-kubernetes-sessions-at-aws-reinvent-2025/) lists all 48 sessions. Key ones for operations:

- **CNS205** - The Future of Kubernetes on AWS
- **CNS354** - Amazon EKS Auto Mode: Evolving Kubernetes ops
- **CNS421** - Streamline Amazon EKS operations with Agentic AI
- **CNS429** - Under the hood: Architecting Amazon EKS for scale
- **From Metrics to Management** - Observability session
- **Simplify your Kubernetes journey** - New managed capabilities

**Note:** Check the [official session guide](https://aws.amazon.com/blogs/containers/guide-to-amazon-eks-and-kubernetes-sessions-at-aws-reinvent-2025/) for the complete list with session codes, abstracts, and video links as they become available.

---

## 12. AWS Container Blog — EKS 운영 관련 포스트 (2025-2026)

> AWS Container Blog (https://aws.amazon.com/blogs/containers/) 에서 EKS 운영, 디버깅, 관찰성, 스케일링, 보안 관련 주요 포스트를 정리합니다.

### 12.1 EKS Auto Mode

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Getting started with Amazon EKS Auto Mode | 2024-12-04 | [Link](https://aws.amazon.com/blogs/containers/getting-started-with-amazon-eks-auto-mode) |
| 2 | How to build highly available Kubernetes applications with Amazon EKS Auto Mode | 2025-09-09 | [Link](https://aws.amazon.com/blogs/containers/how-to-build-highly-available-kubernetes-applications-with-amazon-eks-auto-mode/) |
| 3 | New Amazon EKS Auto Mode features for enhanced security, network control, and performance | 2025-10-16 | [Link](https://aws.amazon.com/blogs/containers/new-amazon-eks-auto-mode-features-for-enhanced-security-network-control-and-performance/) |
| 4 | Maximize Amazon EKS efficiency: How Auto Mode, Graviton, and Spot work together | 2026-01-23 | [Link](https://aws.amazon.com/blogs/containers/maximize-amazon-eks-efficiency-how-auto-mode-graviton-and-spot-work-together/) |

**핵심 내용:**
- Auto Mode는 컴퓨팅, 스토리지, 네트워킹의 프로비저닝부터 지속적 유지보수까지 자동화
- Graviton(40% 향상된 가격 대비 성능) + Spot(최대 90% 절감) 조합 최적화
- 보안 기능, 네트워크 제어, 성능 향상 등 지속적 기능 확장
- 고가용성 앱 구축 패턴: 컨트롤 플레인 업데이트 자동화, 애드온 관리 간소화

---

### 12.2 EKS Capabilities (Argo CD, ACK, KRO)

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Deep dive: Streamlining GitOps with Amazon EKS capability for Argo CD | 2025-12-18 | [Link](https://aws.amazon.com/blogs/containers/deep-dive-streamlining-gitops-with-amazon-eks-capability-for-argo-cd/) |
| 2 | Simplify Kubernetes cluster management using ACK, kro and Amazon EKS | 2026-01-22 | [Link](https://aws.amazon.com/blogs/containers/simplify-kubernetes-cluster-management-using-ack-kro-and-amazon-eks/) |

**핵심 내용:**
- Managed Argo CD: 클러스터 외부에서 실행, AWS가 스케일링·업그레이드·크로스 클러스터 연결 관리
- ACK + KRO: 분산된 IaC 파이프라인 제거, Kubernetes 네이티브 선언적 클러스터 관리
- EKS Capabilities는 AWS 소유 인프라에서 실행 — 클러스터 리소스 영향 없음

---

### 12.3 EKS 관찰성 (Observability)

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Monitoring network performance on Amazon EKS using AWS Managed Open-Source Services | 2025-11-20 | [Link](https://aws.amazon.com/blogs/containers/monitoring-network-performance-on-amazon-eks-using-aws-managed-open-source-services/) |
| 2 | Enhancing and monitoring network performance when running ML Inference on Amazon EKS | 2025-11-26 | [Link](https://aws.amazon.com/blogs/containers/enhancing-and-monitoring-network-performance-when-running-ml-inference-on-amazon-eks/) |
| 3 | Proactive Amazon EKS monitoring with Amazon CloudWatch Operator and AWS Control Plane metrics | 2025-12-19 | [Link](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/) |

**핵심 내용:**
- AWS Managed Prometheus + Grafana로 Kubernetes-enriched 네트워크 텔레메트리 모니터링
- VPC Flow Logs 통합, ML 추론 워크로드 네트워크 성능 최적화 (Ray, vLLM, Triton, PyTorch)
- CloudWatch Observability Operator + EKS Control Plane 메트릭 — 선제적 모니터링

---

### 12.4 EKS 네트워킹 & 보안

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Amazon EKS introduces Provisioned Control Plane | 2025-11-27 | [Link](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/) |
| 2 | Kubernetes Gateway API in Action | 2025 | [Link](https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/) |

**관련 Announcement:**
- [Amazon EKS introduces enhanced network security policies](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-eks-enhanced-network-security-policies/) (2025-12-15) — DNS 기반 정책, 클러스터 전체 중앙화된 네트워크 액세스 필터

---

### 12.5 EKS 고가용성 & 복구

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Enhance Kubernetes high availability with Amazon Application Recovery Controller and Karpenter integration | 2025 | [Link](https://aws.amazon.com/blogs/containers/enhance-kubernetes-high-availability-with-amazon-application-recovery-controller-and-karpenter-integration/) |
| 2 | End-to-end Amazon EKS AZ impairment recovery with Istio service mesh | 2025 | [Link](https://aws.amazon.com/blogs/containers/) |

**핵심 내용:**
- ARC + Karpenter 통합: 자동 AZ 대피(Zonal Shift) 패턴
- Istio 서비스 메시 기반 End-to-end AZ 장애 복구
- Gray failure 처리 패턴

---

### 12.6 EKS 비용 최적화

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Data-driven Amazon EKS cost optimization: A practical guide to workload analysis | 2025-11-26 | [Link](https://aws.amazon.com/blogs/containers/data-driven-amazon-eks-cost-optimization-a-practical-guide-to-workload-analysis/) |
| 2 | Maximize Amazon EKS efficiency: How Auto Mode, Graviton, and Spot work together | 2026-01-23 | [Link](https://aws.amazon.com/blogs/containers/maximize-amazon-eks-efficiency-how-auto-mode-graviton-and-spot-work-together/) |

---

### 12.7 re:Invent 2025 가이드

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Guide to Amazon EKS and Kubernetes sessions at AWS re:Invent 2025 | 2025-11-21 | [Link](https://aws.amazon.com/blogs/containers/guide-to-amazon-eks-and-kubernetes-sessions-at-aws-reinvent-2025/) |

---

## 13. AWS News Blog & 기타 AWS 블로그 — EKS 관련 포스트 (2025-2026)

> AWS News Blog, Cloud Operations Blog, Security Blog, DevOps Blog, Migration Blog 등에서 EKS 관련 주요 포스트를 정리합니다.

### 13.1 AWS News Blog (aws.amazon.com/blogs/aws/)

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Announcing Amazon EKS Capabilities for workload orchestration and cloud resource management | 2025-11-30 | [Link](https://aws.amazon.com/blogs/aws/announcing-amazon-eks-capabilities-for-workload-orchestration-and-cloud-resource-management/) |
| 2 | Streamline Kubernetes cluster management with new Amazon EKS Auto Mode | 2025-03-20 | [Link](https://aws.amazon.com/blogs/aws/streamline-kubernetes-cluster-management-with-new-amazon-eks-auto-mode/) |
| 3 | Monitor network performance and traffic across your EKS clusters with Container Network Observability | 2025-11-19 | [Link](https://aws.amazon.com/blogs/aws/monitor-network-performance-and-traffic-across-your-eks-clusters-with-container-network-observability/) |
| 4 | Amazon GuardDuty expands Extended Threat Detection coverage to Amazon EKS clusters | 2025-06-17 | [Link](https://aws.amazon.com/blogs/aws/amazon-guardduty-expands-extended-threat-detection-coverage-to-amazon-eks-clusters/) |
| 5 | Top announcements of AWS re:Invent 2025 | 2025-11-30 | [Link](https://aws.amazon.com/blogs/aws/top-announcements-of-aws-reinvent-2025/) |

**핵심 내용:**
- EKS Capabilities(Managed Argo CD + ACK + KRO) — Kubernetes 네이티브 플랫폼 기능
- Container Network Observability — 세분화된 네트워크 메트릭, 이상 탐지
- GuardDuty Extended Threat Detection — AI/ML 기반 다단계 공격 탐지, EKS 감사 로그·런타임·맬웨어·API 활동 상관 분석

---

### 13.2 AWS Cloud Operations Blog (aws.amazon.com/blogs/mt/)

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Enhancing observability with a managed monitoring solution for Amazon EKS | 2025-08-05 | [Link](https://aws.amazon.com/blogs/mt/enhancing-observability-with-a-managed-monitoring-solution-for-amazon-eks) |
| 2 | Announcing Amazon CloudWatch Container Insights for Amazon EKS Windows Workloads Monitoring | 2025-08-05 | [Link](https://aws.amazon.com/blogs/mt/announcing-amazon-cloudwatch-container-insights-for-amazon-eks-windows-workloads-monitoring) |

**핵심 내용:**
- CloudWatch Container Insights: 오픈소스 도구 기반 실시간 클러스터 헬스/성능 인사이트
- Windows 워크로드 지원: Linux/Windows 혼합 클러스터의 통합 모니터링

---

### 13.3 AWS Security Blog

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | New AWS whitepaper: Security Overview of Amazon EKS Auto Mode | 2025 | [Link](https://aws.amazon.com/blogs/security/new-aws-whitepaper-security-overview-of-amazon-eks-auto-mode/) |

**핵심 내용:**
- EKS Auto Mode 아키텍처, 내장 보안 기능, EC2 Managed Instances 기반 노드 관리 접근 방식

---

### 13.4 AWS DevOps Blog

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Introducing the AWS Infrastructure as Code MCP Server: AI-Powered CDK and CloudFormation Assistance | 2025-11-28 | [Link](https://aws.amazon.com/blogs/devops/introducing-the-aws-infrastructure-as-code-mcp-server-ai-powered-cdk-and-cloudformation-assistance/) |
| 2 | Enhancing Code Generation with Real-Time Execution in Amazon Q Developer | 2025-02-06 | [Link](https://aws.amazon.com/blogs/devops/enhancing-code-generation-with-real-time-execution-in-amazon-q-developer/) |

**핵심 내용:**
- AWS IaC MCP Server: Kiro CLI에서 CloudFormation/CDK 문서 검색, 템플릿 검증, 배포 트러블슈팅
- Amazon Q Developer: 실시간 코드 빌드·테스트, 개발자 리뷰 전 변경 사항 검증

---

### 13.5 AWS Migration & Modernization Blog

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Agentic Cloud Modernization: Accelerating Modernization with AWS MCPs and Kiro | 2026-01-05 | [Link](https://aws.amazon.com/blogs/migration-and-modernization/agentic-cloud-modernization-accelerating-modernization-with-aws-mcps-and-kiro/) |
| 2 | Modernize your applications using Amazon Bedrock AgentCore Gateway and Kiro powers | 2026-02-06 | [Link](https://aws.amazon.com/blogs/migration-and-modernization/modernize-your-applications-using-amazon-bedrock-agentcore-gateway-and-kiro-powers/) |

**핵심 내용:**
- Kiro + MCP 서버: AI 기반 클라우드 모더나이제이션 프로세스 변환
- Bedrock AgentCore Gateway + Kiro: 소스 코드 수정 없이 레거시 앱에 에이전틱 AI 기능 추가

---

### 13.6 AWS What's New — EKS 관련 주요 Announcement (2025)

| # | 제목 | 날짜 | 링크 |
|---|------|------|------|
| 1 | Amazon EKS introduces enhanced container network observability | 2025-11-19 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-eks-enhanced-container-network-observability/) |
| 2 | Amazon EKS introduces provisioned control plane | 2025-11-21 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-eks-provisioned-control-plane/) |
| 3 | Amazon EKS introduces enhanced network security policies | 2025-12-15 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-eks-enhanced-network-security-policies/) |
| 4 | Amazon EKS now enforces upgrade insights checks as part of cluster upgrades | 2025-03-27 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/03/amazon-eks-enforces-upgrade-insights-check-cluster-upgrades/) |
| 5 | Amazon EKS and Amazon EKS Distro now supports Kubernetes version 1.34 | 2025-10-06 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-eks-distro-kubernetes-version-1-34/) |
| 6 | Amazon GuardDuty Extended Threat Detection for EKS | 2025-06-17 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-guardduty-threat-detection-eks) |
| 7 | GuardDuty Extended Threat Detection for EC2 and ECS | 2025-12-02 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/12/guardduty-extended-threat-detection-ec2-ecs/) |
| 8 | Extended support for Kubernetes versions for Amazon EKS Anywhere | 2025-02-28 | [Link](https://aws.amazon.com/about-aws/whats-new/2025/02/kubernetes-versions-amazon-eks-anywhere/) |

---

## 14. 블로그 레퍼런스 요약 — 주제별 매핑

### 문서 작성 시 참조할 블로그 포스트 매핑

| 문서 주제 | 관련 블로그 포스트 |
|-----------|-------------------|
| **Pod 헬스체크 & 라이프사이클** | EKS Auto Mode HA 구축, ARC+Karpenter 고가용성, AZ 장애 복구 |
| **Pod 리소스 최적화** | Data-driven 비용 최적화, Auto Mode+Graviton+Spot, CloudWatch Container Insights |
| **Pod 스케줄링 & 가용성** | Provisioned Control Plane, Karpenter 고가용성, 네트워크 보안 정책 |
| **EKS 디버깅 가이드** | Control Plane 메트릭 모니터링, Container Network Observability, GuardDuty 위협 탐지 |
| **EKS 네트워크 정책** | Enhanced Network Security Policies, Gateway API in Action, 네트워크 성능 모니터링 |
| **Karpenter 오토스케일링** | ARC+Karpenter 통합, Auto Mode, 비용 최적화 |
| **EKS 복원력 가이드** | AZ 장애 복구, Provisioned Control Plane, Auto Mode HA |
| **AIOps & AIDLC** | Kiro+MCP 모더나이제이션, IaC MCP Server, Q Developer 실시간 실행, Agentic AI EKS 운영 |
| **관찰성 스택** | CloudWatch Operator+Control Plane 메트릭, Managed Prometheus/Grafana 네트워크 모니터링, Container Insights Windows 지원 |
| **업그레이드 관리** | K8s 1.34 지원, Upgrade Insights 강제, EKS Anywhere 확장 지원 |

---

## Conclusion

AWS re:Invent 2025 demonstrated significant advances in EKS observability, automation, and operational capabilities. The introduction of Container Network Observability, enhanced control plane monitoring, and AI-assisted operations represent major steps forward in making Kubernetes operations more accessible and efficient.

For teams building operational best practices documentation, the key focus areas should be:
1. Comprehensive observability (network, control plane, application, security)
2. Automated operations and intelligent troubleshooting
3. Cost-aware resource management
4. Modern traffic routing with Gateway API
5. Security-integrated operations with GuardDuty

These align well with the core operational concerns around probes, graceful shutdown, resource management, scheduling, debugging, and observability that form the foundation of production-ready Kubernetes operations.

---

**Research completed:** February 12, 2026
**Sources:** AWS blogs (Container Blog, News Blog, Cloud Operations Blog, Security Blog, DevOps Blog, Migration Blog), YouTube sessions, community articles, official documentation
**Focus:** re:Invent 2025 announcements (Nov 30 - Dec 4, 2025) + AWS 블로그 포스트 (2025-2026)
