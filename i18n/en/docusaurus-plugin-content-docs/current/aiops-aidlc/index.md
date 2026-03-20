---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "AIOps & AIDLC guide to maximize K8s platform advantages with AI while reducing complexity to accelerate innovation"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-13
  author: devfloor9
---

import { PlatformComparison, CoreTechStack } from '@site/src/components/AiopsIntroTables';

# AIops & AIDLC for Modern Application Platform

> 📅 **Created**: 2026-02-12 | **Updated**: 2026-02-13 | ⏱️ **Reading time**: Approx. 3 minutes

While Kubernetes has established itself as the standard for container orchestration, its diverse capabilities and extensibility come at the cost of operational complexity. AIOps (AI for IT Operations) and AIDLC (AI-Driven Development Lifecycle) represent an approach to solving this complexity with AI while maximizing the advantages of K8s platforms. Beyond merely applying AI to monitoring, they present a new operational paradigm where AI leads the entire lifecycle from development to deployment, operations, and incident response.

The core premise of this guide is AWS's open source strategy. AWS provides key tools in the Kubernetes ecosystem through Managed Add-ons (22+), Community Add-ons Catalog, and managed open source services (AMP, AMG, ADOT), delegating operational burden to AWS while maintaining the flexibility and portability of open source. In November 2025, AWS announced EKS Capabilities (Managed Argo CD, ACK, KRO), extending even GitOps and declarative infrastructure management to AWS-managed services. EKS serves as the central executor of this open source strategy, acting as the core component for K8s-native automation.

Built on this foundation, Kiro and MCP (Model Context Protocol) have emerged as core AIOps tools. Kiro implements programmatic automation through spec-driven development (requirements → design → tasks → code), while AWS MCP servers (50+ GA) enable direct control of EKS clusters, CloudWatch metrics analysis, and cost optimization within development workflows. In November 2025, Fully Managed MCP (EKS/ECS Preview) and AWS MCP Server Integration (15,000+ APIs, Preview) were added, providing three hosting options from local execution to cloud hosting and full AWS API integration. While individual MCP servers provide service-specific deep tools (kubectl execution, PromQL queries, etc.), the integrated server excels at multi-service composite tasks and Agent SOPs (pre-built workflows) — these approaches complement rather than replace each other.

If Kiro + MCP represents a programmatic pattern where "humans direct and AI executes," AI Agent frameworks are the next step where AI autonomously detects, judges, and executes based on events. Amazon Q Developer (GA) provides the most mature production patterns for CloudWatch Investigations and EKS troubleshooting, while Strands Agents (open source) is a production-validated agent SDK from AWS that defines Agent SOPs as natural language workflows. Kagent is a K8s-native AI agent supporting MCP integration (kmcp) but is still in early stages. A realistic approach is to start with Q Developer and gradually expand agent scope.

## Difference from Agentic AI Platform

This category focuses on **how to operate platforms with AI**. While the Agentic AI Platform covers the platform itself for running AI workloads—LLM serving, GPU management, inference optimization—AIops & AIDLC provides methodologies for developing and operating that platform (or general application platforms) more efficiently with AI tools.

<PlatformComparison />

<CoreTechStack />

:::info Learning Path
Reading in the order **1 → 2 → 3 → 4** allows you to follow the entire journey from AIOps strategy formulation to autonomous operations realization.

- [1. AIOps Strategy Guide](./aiops-introduction.md) is the starting point for understanding overall direction
- [2. Intelligent Observability Stack](./aiops-observability-stack.md) builds the data foundation for AI analysis
- [3. AIDLC Framework](./aidlc-framework.md) covers development methodology
- [4. Predictive Scaling and Auto-Recovery](./aiops-predictive-operations.md) addresses autonomous operations realization
:::

## References

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [AWS MCP Servers (Individual 50+ GA)](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
