---
title: "추론 게이트웨이 & 라우팅"
sidebar_label: "Inference Gateway & Routing"
sidebar_position: 3
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 추론 게이트웨이 & 라우팅

Self-hosted LLM과 External AI Provider를 통합하는 지능형 라우팅 레이어를 구성합니다. 2-Tier Gateway 아키텍처, 모델별 라우팅, Cascade Routing, 비용 추적 전략을 다룹니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/inference-gateway-routing"
    icon="🌐"
    title="Inference Gateway"
    description="kgateway 기반 지능형 요청 라우팅. Gateway API 표준, 모델별 라우팅, Canary 배포, Health Check 전략."
    color="#3b82f6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/llm-gateway-architecture"
    icon="🔄"
    title="LLM Gateway 아키텍처"
    description="2-Tier Gateway 설계(kgateway + Bifrost/LiteLLM). 솔루션 비교, Cascade Routing, 비용 추적 패턴."
    color="#8b5cf6"
  />
  <DocCard
    to="/docs/agentic-ai-platform/gateway-agents/openclaw-ai-gateway"
    icon="🦞"
    title="OpenClaw AI Gateway"
    description="OpenClaw + Bifrost Auto-Router 기반 올인원 AI Gateway. 실전 배포 예시와 Full Observability 통합."
    color="#ec4899"
  />
</DocCardGrid>

:::tip 학습 순서
**Inference Gateway**(기본 라우팅) → **LLM Gateway 아키텍처**(2-Tier 설계) → **OpenClaw**(실전 배포) 순서로 읽으면 추론 라우팅의 이론부터 실전까지 이해할 수 있습니다.
:::
