---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "AIOps & AIDLC guide to maximize K8s platform capabilities with AI while reducing complexity and accelerating innovation"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-12
  author: devfloor9
---

# AIops & AIDLC for Modern Application Platform

**Maximize K8s platform capabilities and extensibility with AI while reducing complexity and accelerating innovation**

This guide covers how to intelligently build and operate EKS-based Modern Application Platforms by combining **AIops (AI for IT Operations)** and **AIDLC (AI-Driven Development Lifecycle)**.

## How This Differs from Existing Content

| Existing Agentic AI Platform | This Category (AIops & AIDLC) |
|------------------------------|-------------------------------|
| LLM serving and inference optimization | Operating the platform itself with AI |
| vLLM, llm-d deployment configuration | Kiro+MCP based programmatic automation |
| GPU resource management | Predictive scaling, AI Agent autonomous ops |
| Real-time inference patterns | Observability stack, AIDLC methodology |

## Guide Structure

### Phase 1: AIOps Strategy and Foundations

- **[AIOps Introduction and EKS Strategy](./aiops-introduction.md)** — AIOps definition, AWS open-source strategy and EKS evolution, Kiro+MCP core, programmatic operations, maturity model, ROI evaluation

### Phase 2: Intelligent Observability

- **[Intelligent Observability Stack](./aiops-observability-stack.md)** — Managed Add-ons based observability, ADOT+AMP+AMG, CloudWatch AI, DevOps Guru, Hosted MCP integrated analysis, SLO/SLI

### Phase 3: AI-Driven Development

- **[AIDLC Framework](./aidlc-framework.md)** — Kiro Spec-driven development, AI coding agents, EKS Capabilities (Managed Argo CD, ACK, KRO) + GitOps, Quality Gates, AI Agent governance

### Phase 4: Predictive Operations

- **[Predictive Scaling and Auto-Remediation](./aiops-predictive-operations.md)** — ML predictive scaling, Karpenter+AI, CloudWatch Anomaly Detection, AI Agent autonomous response, Kiro programmatic debugging, Chaos Engineering

### MLOps Pipelines

MLOps documentation has moved to the **[Agentic AI Platform](/docs/agentic-ai-platform)** category:

- [EKS-Based MLOps Pipeline](/docs/agentic-ai-platform/mlops-pipeline-eks) — Kubeflow + MLflow + KServe
- [SageMaker-EKS Integration](/docs/agentic-ai-platform/sagemaker-eks-integration) — Hybrid ML architecture

## Core Technology Stack

| Domain | AWS Services | Open Source / Tools |
|--------|-------------|---------------------|
| **Observability** | CloudWatch, X-Ray, AMP, AMG | ADOT (OpenTelemetry), Grafana |
| **Anomaly Detection** | DevOps Guru, CloudWatch AI, Anomaly Detection | Prometheus + ML |
| **AI Development** | Kiro, Amazon Q Developer | GitHub Copilot, Claude Code |
| **MCP Integration** | Individual MCP (65+ GA), Fully Managed MCP (EKS/ECS Preview), AWS MCP Server unified (Preview) | Kagent (kmcp) |
| **GitOps** | Managed Argo CD (EKS Capability) | Argo CD |
| **Infrastructure** | ACK (50+ AWS CRD), KRO (ResourceGroup) | Terraform, Helm |
| **Networking** | LBC v3 (Gateway API GA), Container Network Observability | Gateway API |
| **AI Agent** | Amazon Q Developer, Strands Agents | Kagent |
| **Predictive Scaling** | CloudWatch Anomaly Detection | Prophet, ARIMA |
| **Node Management** | Karpenter | - |

## References

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [AWS Hosted MCP Servers](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
