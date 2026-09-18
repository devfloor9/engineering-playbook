---
title: 운영 & 거버넌스
description: AI 플랫폼 모니터링, Observability, 평가, 컴플라이언스, 도메인 특화 운영 가이드
created: "2026-03-06"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 2
tags:
  - operations
  - monitoring
  - observability
  - mlops
  - compliance
  - scope:nav
sidebar_label: 운영 & 거버넌스
sidebar_position: 0
---

import DocCardList from '@theme/DocCardList';

AI 플랫폼의 상태와 응답 품질을 측정하고, 변경을 평가하며, 데이터와 접근 정책을 운영하는 엔지니어를 위한 문서입니다. 관측성, 거버넌스, 데이터 인프라의 세 영역으로 나누어 필요한 절차를 찾을 수 있습니다.

- **서비스 상태를 파악할 때**: [Agent 모니터링](./observability/agent-monitoring.md)에서 시작해 [서빙 최적화 모니터링](./observability/llm-serving-optimization-monitoring.md)으로 이어갑니다.
- **모델·프롬프트 변경을 검증할 때**: [Ragas 평가](./governance/ragas-evaluation.md)와 [Prefix Cache·정확도 분석](./observability/prefix-cache-tuning-accuracy-correlation.md)을 참고합니다.
- **운영 정책과 복구 절차를 정할 때**: [거버넌스](./governance/index.md)와 [데이터 인프라](./data-infrastructure/index.md)를 확인합니다.

## 문서 목록

각 카테고리에서 해당 영역의 전체 문서를 볼 수 있습니다.

<DocCardList />

## 관련 섹션

- [Reference Architecture](../reference-architecture/index.md) — 모니터링 스택과 MLOps 파이프라인의 배포 절차
- [AIDLC 운영](/docs/aidlc/operations) — 개발 수명주기와 연결되는 운영·감사 절차
- [설계 & 아키텍처](../design-architecture/index.md) — 플랫폼의 책임과 데이터 경계
