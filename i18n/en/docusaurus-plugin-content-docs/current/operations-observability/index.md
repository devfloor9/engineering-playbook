---
title: "Operations & Observability"
sidebar_label: "Operations & Observability"
description: "Advanced technical documentation on observability and monitoring in Amazon EKS environments"
sidebar_position: 2
---

# Operations & Observability

In modern cloud-native environments, operations and observability go beyond simple monitoring to become core capabilities for comprehensively understanding system health and responding proactively. In container orchestration platforms like Amazon EKS, hundreds of microservices are dynamically created and destroyed while complex network communications occur, making it difficult to understand system state using traditional monitoring approaches. To build effective observability in such environments, we must integrate the three pillars of logs, metrics, and traces, and apply GitOps-based declarative operational practices to systematically manage changes.

Network visibility is particularly critical in Kubernetes clusters. We need to track communication flows between Pods in real-time, verify that network policies are correctly applied, and detect unexpected traffic patterns early. Tools like Hubble enable observation of all communications at the Cilium-based network layer and provide service mesh-level visibility. This allows us to detect security threats, identify network bottlenecks, and meet compliance requirements.

For operational automation and consistency, a GitOps approach is essential. By managing all cluster configurations as code in Git repositories and automatically synchronizing declarative state through GitOps tools like Flux CD or ArgoCD, we can prevent errors from manual operations and perfectly track change history. This approach ensures reproducibility and audit trails while maximizing the benefits of Infrastructure as Code. Node-level monitoring is also important. We must continuously collect CPU, memory, disk, and network usage from each worker node, assess node health, and respond proactively before problems occur.

To build effective observability, we must clearly define SLI (Service Level Indicators) and SLO (Service Level Objectives) and focus on meaningful metrics based on them. Attempting to monitor everything can actually increase noise and cause us to miss important signals. By collecting time-series metrics with Prometheus and visualizing them with Grafana, and implementing distributed tracing with Jaeger, we can understand overall system behavior and optimize performance. This section covers how to apply these tools in real environments and best practices.

## Document List (Implementation Order)

### Step 1: Cluster Operations Framework Setup
**[GitOps-Based EKS Cluster Operations](./gitops-cluster-operation.md)**
GitOps-based cluster configuration management and declarative infrastructure operations - establish the operations framework first

### Step 2: Monitoring Agent Deployment
**[EKS Node Monitoring Agent](./node-monitoring-agent.md)**
Node state monitoring and system metrics collection, gaining network traffic visibility through Hubble

### Step 3: EKS Incident Diagnosis & Response
**[EKS Incident Diagnosis and Response Guide](./eks-debugging-guide.md)**
Comprehensive guide for systematic diagnosis and resolution of control plane, node, workload, networking, and storage issues in EKS environments

### Step 4: EKS High Availability Architecture
**[EKS High Availability Architecture Guide](./eks-resiliency-guide.md)**
Architecture patterns for high availability and fault tolerance including Multi-AZ strategies, Cell-Based Architecture, and Chaos Engineering
