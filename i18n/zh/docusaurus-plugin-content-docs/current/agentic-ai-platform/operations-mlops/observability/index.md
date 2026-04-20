---
title: 관측성 & 모니터링
sidebar_label: 관측성
description: Agent 실행 추적·LLM 호출 모니터링·에이전트 수명주기 관측성을 다루는 문서 모음
created: 2026-04-20
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - operations
  - observability
  - monitoring
  - langfuse
  - scope:nav
---

## 개요

프로덕션 Agentic AI 환경의 신뢰성은 **관측성**에서 시작한다. 본 섹션은 Agent 실행 추적(Agent Monitoring), LLMOps 관측성 도구 비교, Kubernetes 기반 Agent 수명주기 관리(Kagent)를 통합적으로 다룬다. Langfuse·LangSmith·Helicone 등 도구별 특성과 Kagent CRD를 이용한 Agent 배포·관측 패턴을 제공한다.

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
