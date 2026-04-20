---
title: "Operations & Governance"
sidebar_label: "Operations & Governance"
description: "AI platform monitoring, observability, evaluation, compliance, and domain-specific operations guide"
tags: [operations, monitoring, observability, mlops, compliance]
sidebar_position: 4
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Operations & Governance

This section provides guides for **monitoring**, **observability**, **quality evaluation**, **compliance**, and **domain-specific operations** to ensure stable operation of production AI platforms.

This section comprehensively covers the following areas:

- **Monitoring & Observability**: Agent state tracking, LLM tracing, token cost analysis
- **Quality Evaluation**: RAG pipeline evaluation framework (Ragas)
- **Agent Management**: Kubernetes-based agent lifecycle management (Kagent)
- **Enterprise Operations**: Playbook, compliance, domain-specific customization
- **Vector Database**: Milvus operations guide

:::tip Production Deployment Guides
For actual deployment architectures including MLOps pipeline setup and SageMaker-EKS integration, see the [Reference Architecture](../reference-architecture/index.md) section.
:::

## Documents

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring"
    icon="📈"
    title="Agent Monitoring & Operations"
    description="Agent health and performance monitoring. LLM tracing integration, token cost tracking, alerting rules, and operational dashboard configuration."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/llmops-observability"
    icon="👁️"
    title="LLMOps Observability"
    description="Comparison guide for Langfuse, LangSmith, and Helicone. LLM tracing, token cost analysis, and prompt quality monitoring."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/observability/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent: Kubernetes Agent Management"
    description="Kubernetes-based agent lifecycle management. Pod-based agent deployment, dynamic scaling, and health check integration."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/ragas-evaluation"
    icon="✅"
    title="Ragas Evaluation"
    description="RAG pipeline quality evaluation framework. Faithfulness, Relevance, Correctness metrics, and CI/CD integrated automated evaluation."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/agentic-playbook"
    icon="📚"
    title="Agentic Playbook"
    description="Best practice collection for production agent operations. Scenario-based playbooks for incident response, performance tuning, and cost optimization."
    color="#ec4899"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/compliance-framework"
    icon="🔒"
    title="Compliance Framework"
    description="Regulatory compliance and governance framework. GDPR, HIPAA, financial regulations, audit logging, and data protection policy development."
    color="#ef4444"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/governance/domain-customization"
    icon="🎯"
    title="Domain-Specific Customization"
    description="Industry-specific agent customization guide. Specialized strategies and implementation patterns for finance, healthcare, manufacturing, and more."
    color="#06b6d4"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/data-infrastructure/milvus-vector-database"
    icon="🗄️"
    title="Milvus Vector Database"
    description="Production vector DB operations. Milvus cluster configuration, index optimization, backup/recovery, and performance tuning guide."
    color="#7c3aed"
  />
</DocCardGrid>

## Related Sections

- **[Reference Architecture](../reference-architecture/index.md)**: MLOps pipelines, SageMaker-EKS integration, production deployment guides
- **[AIDLC > AgenticOps](/docs/aidlc/agentic-ops)**: AIOps-based automated operations and predictive monitoring
- **[Design & Architecture](../design-architecture/index.md)**: Overall platform architecture design documents
