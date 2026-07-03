---
title: 고급 패턴
description: 자기개선 피드백 루프 및 고급 Agent 설계 패턴
created: "2026-04-20"
last_update:
  date: "2026-06-26"
  author: devfloor9
reading_time: 1
tags:
  - agentic-ai
  - architecture
  - advanced-patterns
  - scope:nav
sidebar_label: 고급 패턴
---

## 개요

프로덕션 Agentic AI 시스템의 성능을 지속적으로 향상시키기 위한 고급 설계 패턴입니다. Self-Improving Agent Loop는 인간 피드백과 자동 평가를 결합해 Agent 동작을 개선하는 폐쇄 루프 아키텍처를 제공하며, ADR 문서는 설계 결정의 근거와 트레이드오프를 기록합니다. Knowledge Feature Store는 온톨로지·Knowledge Graph를 결합한 3-plane 특성 관리를, Semantic Caching은 LLM Gateway 레벨의 의미 기반 캐싱 최적화를 다룹니다.

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
