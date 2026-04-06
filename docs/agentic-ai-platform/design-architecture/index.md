---
title: "설계 & 아키텍처"
sidebar_label: "설계 & 아키텍처"
description: "Agentic AI 플랫폼의 아키텍처 설계, 기술적 도전과제, AWS Native 및 EKS 기반 구현 접근"
tags: [architecture, design, agentic-ai, eks, aws]
sidebar_position: 1
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 설계 & 아키텍처

Agentic AI 플랫폼의 아키텍처를 이해하고, 기술적 도전과제를 파악한 후, AWS Native 매니지드 접근과 EKS 기반 오픈 아키텍처로 해결하는 점진적 여정을 안내합니다. 플랫폼이 **무엇**인지 이해한 뒤, **왜** 어려운지 파악하고, **어떻게** 구축할지 두 가지 접근을 비교합니다. 추론 게이트웨이 계층에서는 2-Tier 아키텍처와 지능형 Cascade Routing 전략을 다룹니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-platform-architecture"
    icon="🏗️"
    title="플랫폼 아키텍처"
    description="Agentic AI Platform의 6개 핵심 레이어(Client, Gateway, Agent, Model Serving, Data, Observability)와 설계 원칙. 특정 구현에 독립적인 플랫폼 청사진을 제시합니다."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-challenges"
    icon="⚡"
    title="기술적 도전과제"
    description="GPU 리소스 관리, 추론 라우팅, LLMOps 관찰성, Agent 오케스트레이션, 모델 공급망 — 플랫폼 구축 시 직면하는 5가지 핵심 과제를 분석합니다."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/aws-native-agentic-platform"
    icon="☁️"
    title="AWS Native 플랫폼"
    description="Amazon Bedrock, Strands Agents SDK, AgentCore를 활용하여 GPU 관리 없이 Agent 개발에 집중하는 매니지드 서비스 접근. 빠른 시작에 최적입니다."
    color="#ff9900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/agentic-ai-solutions-eks"
    icon="🔧"
    title="EKS 기반 오픈 아키텍처"
    description="Amazon EKS Auto Mode + 오픈소스 생태계로 Open Weight 모델 자체 호스팅, 하이브리드 아키텍처, 세밀한 GPU 비용 최적화를 달성하는 접근."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/inference-gateway-routing"
    icon="🔀"
    title="추론 게이트웨이 & Cascade Routing"
    description="kgateway + Bifrost/LiteLLM 2-Tier 아키텍처, Complexity-based Cascade Routing(LiteLLM 네이티브, Bifrost CEL Rules, vLLM Semantic Router), Hybrid Routing 패턴, agentgateway MCP/A2A."
    color="#e53935"
  />
</DocCardGrid>

:::tip 권장 학습 순서
**플랫폼 아키텍처**(무엇) → **기술적 도전과제**(왜) → **AWS Native** 또는 **EKS 오픈 아키텍처**(어떻게) → **추론 게이트웨이**(트래픽 라우팅) 순서로 읽으면 전체 맥락을 가장 효과적으로 이해할 수 있습니다.
:::
