---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "Guide to building Modern Application Platforms using AI-powered operations automation (AIOps) and AI-Driven Development Lifecycle (AIDLC)"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-11
  author: devfloor9
---

# AIops & AIDLC for Modern Application Platform

This guide covers how to intelligently build and operate EKS-based Modern Application Platforms by combining **AIops (AI for IT Operations)** and **AIDLC (AI-Driven Development Lifecycle)**.

## How This Differs from Existing Content

| Existing Agentic AI Platform | This Category |
|------------------------------|---------------|
| LLM serving and inference optimization | Operating the platform itself with AI |
| vLLM, llm-d deployment configuration | Kubeflow, MLflow, KServe pipelines |
| Real-time inference patterns | Training, experiment tracking, model versioning |
| GPU resource management | Predictive scaling, auto-remediation |

## Guide Structure

### Phase 1: AIOps Foundations
- **[AIOps Introduction](/docs/aiops-aidlc/aiops-introduction)** — AIOps concepts, traditional monitoring vs AI-based observability, EKS application scenarios
- **[Intelligent Observability Stack](/docs/aiops-aidlc/aiops-observability-stack)** — OpenTelemetry + CloudWatch AI + DevOps Guru integration architecture

### Phase 2: AI-Driven Development
- **[AIDLC Framework](/docs/aiops-aidlc/aidlc-framework)** — AWS Labs AIDLC methodology, AI coding agent utilization, GitOps integration

### Phase 3: MLOps Pipelines
- **[EKS-Based MLOps Pipeline](/docs/aiops-aidlc/mlops-pipeline-eks)** — Kubeflow + MLflow + KServe end-to-end ML lifecycle
- **[SageMaker-EKS Integration](/docs/aiops-aidlc/sagemaker-eks-integration)** — Hybrid architecture: train on SageMaker + serve on EKS

### Phase 4: Predictive Operations
- **[Predictive Scaling and Auto-Remediation](/docs/aiops-aidlc/aiops-predictive-operations)** — ML-based predictive autoscaling, self-healing patterns, feedback loops

## Core Technology Stack

| Domain | AWS Services | Open Source |
|--------|--------------|-------------|
| Anomaly Detection | DevOps Guru, CloudWatch AI | Prometheus + ML plugins |
| ML Pipeline | SageMaker Pipelines | Kubeflow, Argo Workflows |
| Model Registry | SageMaker Model Registry | MLflow |
| Model Serving | - | KServe, Seldon Core |
| Observability | CloudWatch, X-Ray | OpenTelemetry, Grafana |
| Development Support | Amazon Q Developer | GitHub Copilot |

## References

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [Kubeflow on AWS](https://awslabs.github.io/kubeflow-manifests/)
