---
title: 추론 게이트웨이
sidebar_label: 추론 게이트웨이
description: kgateway·Bifrost 기반 2-Tier 추론 게이트웨이의 라우팅 전략·배포·캐스케이드 튜닝·구현 예시
created: 2026-04-20
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - reference-architecture
  - inference-gateway
  - kgateway
  - bifrost
  - cascade-routing
  - scope:nav
---

## 개요

Agentic AI 플랫폼의 핵심 데이터 플레인은 **추론 게이트웨이**이다. kgateway(Tier 1)로 인증·Rate Limit·Guardrails를 수행하고, Bifrost(Tier 2)로 모델 라우팅·Fallback·비용 추적을 수행하는 2-Tier 구조를 권장한다. 본 섹션은 라우팅 전략 개요, 실배포 가이드, Cascade Routing 튜닝, OpenClaw 구현 예시를 제공한다.

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
