---
title: "설계 & 아키텍처"
sidebar_label: "설계 & 아키텍처"
description: "Agentic AI 플랫폼의 아키텍처 설계, 기술적 도전과제, AWS Native 및 EKS 기반 구현 접근"
created: 2026-03-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 3
tags:
  - architecture
  - design
  - agentic-ai
  - eks
  - aws
  - scope:nav
sidebar_position: 0
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Agentic AI 플랫폼의 아키텍처를 이해하고, 기술적 도전과제를 파악한 후, AWS Native 매니지드 접근과 EKS 기반 오픈 아키텍처로 해결하는 점진적 여정을 안내합니다. 플랫폼이 **무엇**인지 이해한 뒤, **왜** 어려운지 파악하고, **어떻게** 구축할지 두 가지 접근을 비교합니다. 각 접근의 장단점을 비교하는 선택 가이드를 통해 고객 상황에 맞는 최적 경로를 안내합니다.

<DocCardGrid columns={3}>
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/foundations"
    icon="🏗️"
    title="플랫폼 기초"
    description="6-레이어 플랫폼 블루프린트, 5가지 핵심 도전과제, Knowledge Feature Store 개념을 통해 Agentic AI 플랫폼의 기초를 이해합니다."
    color="#667eea"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/platform-selection"
    icon="🧭"
    title="플랫폼 선택"
    description="SageMaker/Bedrock/EKS 비교, AWS Native 관리형 서비스, EKS 오픈소스 아키텍처, AgentCore 하이브리드 전략 등 상황별 선택 기준을 제시합니다."
    color="#0ea5e9"
  />
  <DocCard
    to="/docs/agentic-ai-platform/design-architecture/advanced-patterns"
    icon="🔄"
    title="고급 패턴"
    description="Self-Improving Agent Loop 및 ADR을 통해 인간 피드백과 자동 평가를 결합한 지속적 개선 아키텍처를 구축합니다."
    color="#f59e0b"
  />
</DocCardGrid>

:::tip 권장 학습 순서
**플랫폼 기초**(무엇·왜) → **플랫폼 선택**(어떤 접근) → **고급 패턴**(지속 개선) 순서로 읽으면 전체 맥락을 가장 효과적으로 이해할 수 있습니다.
:::
