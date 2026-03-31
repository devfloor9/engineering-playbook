---
title: "Agents & Data"
sidebar_label: "Agents & Data"
sidebar_position: 4
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Agents & Data

Configure AI agent lifecycle management and RAG data layer. Covers how agents leverage tools and augment context through vector search.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/agent-data/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent Agent Management"
    description="Kubernetes CRD-based AI agent lifecycle management. Agent definition, MCP/A2A tool integration, scaling, state management patterns."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/agent-data/milvus-vector-database"
    icon="🔍"
    title="Milvus Vector DB"
    description="Core vector store for RAG pipelines. HNSW index, hybrid search, multi-tenant partitioning, operational guide."
    color="#06b6d4"
  />
</DocCardGrid>
