---
title: Agentic AI Platform
description: Agentic AI 플랫폼의 아키텍처, 구축, 운영에 대한 심화 기술 문서
created: "2025-09-11"
last_update:
  date: "2026-09-18"
  author: devfloor9
reading_time: 4
tags:
  - eks
  - kubernetes
  - genai
  - agentic-ai
  - gpu
  - llm
  - platform
  - scope:nav
sidebar_label: Agentic AI 플랫폼
sidebar_position: 3
category: genai-aiml
---

import DocCardList from '@theme/DocCardList';

AI 플랫폼의 설계, 모델 서빙, 운영, 구현 예제를 다룹니다. 목적에 따라 아래 경로에서 시작할 수 있습니다.

## 추천 시작 경로

- **설계**: [아키텍처](./design-architecture/index.md) → [구현 방식 비교](./design-architecture/platform-selection/ai-platform-decision-framework.md)
- **구축**: [모델 서빙](./model-serving/index.md) → [Reference Architecture](./reference-architecture/index.md)
- **운영**: [운영 & 거버넌스](./operations-mlops/index.md)

---

## 문서 구성

<DocCardList />

---

## 배경

이 매뉴얼은 플랫폼 아키텍트와 엔지니어가 요구사항을 설계 결정, 배포 구성, 운영 지표로 연결하도록 구성했습니다. 관리형 서비스와 EKS 기반 구성은 데이터 경계, 모델 제어 범위, 운영 역량에 따라 선택하거나 함께 사용할 수 있습니다. 단일 모델과 다중 모델 중 어느 쪽이 적합한지도 실제 업무의 품질·지연·비용 평가로 결정합니다.

아키텍처 문서의 **6개 런타임 레이어와 3개 공통 플레인**은 플랫폼의 책임을 구분합니다. 모델 서빙 문서의 **L0–L5 튜닝 계층**은 추론 성능을 분석하는 별도 관점입니다. 같은 번호로 대응하지 않으며, 구현 절차는 Reference Architecture에서 확인합니다. 모델 교체 시에는 API 형식뿐 아니라 도구 호출, 출력 형식, 평가 결과의 호환성도 확인해야 합니다.

## 관련 카테고리

- [AIDLC](/docs/aidlc) — AI Development Lifecycle 및 AgenticOps
- [EKS Hybrid Nodes](/docs/eks-hybrid-nodes) — 하이브리드 환경의 AI 배포
- [EKS Best Practices](/docs/eks-best-practices) — EKS 운영 베스트 프랙티스
