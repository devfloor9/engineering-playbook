---
title: "Operations & MLOps"
sidebar_label: "Operations & MLOps"
sidebar_position: 5
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Operations & MLOps

Configure monitoring, observability, quality evaluation, CI/CD pipelines, and hybrid training-serving architecture after production deployment. Covers establishing stable operations and continuous improvement systems.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/agent-monitoring"
    icon="📈"
    title="Agent Monitoring & Operations"
    description="Agent state and performance monitoring. LLM tracing integration, token cost tracking, alert rules, operational dashboard configuration."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/ragas-evaluation"
    icon="✅"
    title="Ragas Evaluation"
    description="RAG pipeline quality evaluation framework. Faithfulness, Relevance, Correctness metrics, CI/CD integrated automated evaluation."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/llmops-observability"
    icon="👁️"
    title="LLMOps Observability"
    description="Langfuse, LangSmith, Helicone comparison guide. LLM tracing, token cost analysis, prompt quality monitoring."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/mlops-pipeline-eks"
    icon="⚙️"
    title="MLOps Pipeline"
    description="Kubeflow + MLflow + ArgoCD GitOps-based ML pipeline. Training → Evaluation → Registry → Deployment automation."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/operations-mlops/sagemaker-eks-integration"
    icon="🔬"
    title="SageMaker-EKS Integration"
    description="SageMaker training + EKS serving hybrid pattern. Optimal combination of managed training infrastructure and EKS inference serving."
    color="#ff9900"
  />
</DocCardGrid>
