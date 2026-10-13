---
title: 추론 게이트웨이 배포
description: kgateway·Bifrost 기반 2-Tier 추론 게이트웨이의 실전 배포 가이드 — Helm 설치, HTTPRoute 구성, OTel 연동, 트러블슈팅
created: "2026-04-20"
last_update:
  date: "2026-07-15"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - reference-architecture
  - inference-gateway
  - kgateway
  - bifrost
  - cascade-routing
  - scope:nav
sidebar_label: 추론 게이트웨이 배포
---

## 개요

이 섹션은 kgateway·Bifrost 기반 2-Tier 추론 게이트웨이의 **실전 배포 절차**를 다룹니다. Helm 설치, HTTPRoute 구성, OTel 연동, 트러블슈팅을 포함합니다.

:::info 게이트웨이 개념·라우팅 전략은 모델 서빙 섹션으로 이동했습니다
게이트웨이 계층 정의, 라우팅 전략, Cascade 튜닝, OpenClaw 구현 예시는 추론 인프라 내러티브와 함께 보도록 **모델 서빙 & 추론 인프라** 섹션으로 이동했습니다. 전체 구조는 [추론 인프라 개요](../../model-serving/index.md), 계층 정의는 [티어드 게이트웨이 아키텍처](../../model-serving/inference-routing/tiered-gateway-architecture.md), 라우팅 전략은 [라우팅 전략](../../model-serving/inference-routing/routing-strategy.md)을 참조하세요.
:::

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
