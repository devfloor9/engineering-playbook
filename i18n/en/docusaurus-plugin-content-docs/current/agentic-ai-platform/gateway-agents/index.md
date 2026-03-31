---
title: "Inference Gateway & Routing"
sidebar_label: "Inference Gateway & Routing"
sidebar_position: 3
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Inference Gateway & Routing

Configure an intelligent routing layer that integrates self-hosted LLMs and external AI providers. Covers 2-Tier Gateway architecture, model-specific routing, Cascade Routing, and cost tracking strategies.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/inference-gateway-routing"
    icon="🌐"
    title="Inference Gateway"
    description="Intelligent request routing based on kgateway. Gateway API standards, model-specific routing, Canary deployment, Health Check strategies."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/llm-gateway-architecture"
    icon="🔄"
    title="LLM Gateway Architecture"
    description="2-Tier Gateway design (kgateway + Bifrost/LiteLLM). Solution comparison, Cascade Routing, cost tracking patterns."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/openclaw-ai-gateway"
    icon="🦞"
    title="OpenClaw AI Gateway"
    description="All-in-one AI Gateway based on OpenClaw + Bifrost Auto-Router. Production deployment examples and full observability integration."
    color="#ec4899"
  />
</DocCardGrid>

:::tip Learning Sequence
Reading in the sequence **Inference Gateway** (basic routing) → **LLM Gateway Architecture** (2-Tier design) → **OpenClaw** (production deployment) will help you understand inference routing from theory to practice.
:::
