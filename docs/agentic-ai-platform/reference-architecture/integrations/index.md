---
title: 통합 & 비용
description: SageMaker 하이브리드 통합·Observability 스택 배포·코딩 도구 비용 분석
created: "2026-04-20"
last_update:
  date: "2026-07-13"
  author: devfloor9
reading_time: 1
tags:
  - reference-architecture
  - integrations
  - sagemaker
  - cost-analysis
  - monitoring
  - scope:nav
sidebar_label: 통합 & 비용
---

## 개요

외부 AWS 서비스 통합과 비용 분석을 다룬다. SageMaker-EKS 하이브리드 학습·추론 패턴, Langfuse·Prometheus·AMP/AMG 기반 Observability 스택 배포, 코딩 도구(Aider·Cline·Cursor) 비용 분석 등 플랫폼 외곽 통합을 포함한다.

### 다루는 내용

- [SageMaker-EKS 통합](./sagemaker-eks-integration.md) — SageMaker 학습 + EKS 추론 하이브리드 아키텍처 패턴
- [모니터링 스택 구성](./monitoring-observability-setup.md) — Langfuse Helm 배포, AMP/AMG, OTel 연동 실전 구성
- [오픈웨이트 모델 배포 가이드](./open-weight-model-deployment.md) — 토큰 이코노믹스·데이터 주권 관점 자체 배포 의사결정
- [코딩 도구 비용 분석](./coding-tools-cost-analysis.md) — Aider·Cline·Cursor 도구별 비용 구조 비교

### 관련 문서

- [Inference Gateway 배포](../inference-gateway/setup/index.md) — 통합 이전 단계인 게이트웨이 인프라 구성
- [모델 수명주기](../model-lifecycle/index.md) — 학습·배포 파이프라인에서 SageMaker·모니터링 통합이 쓰이는 지점
- [Agent 모니터링](../../operations-mlops/observability/agent-monitoring.md) — Observability 스택 배포 후 운영 관점 활용

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
