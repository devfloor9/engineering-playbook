---
title: Engineering Playbook 소개
description: 클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트
created: "2025-09-11"
last_update:
  date: "2026-09-17"
  author: devfloor9
reading_time: 2
tags:
  - kubernetes
  - cloud-native
  - introduction
  - getting-started
  - scope:nav
sidebar_position: 1
category: getting-started
---

Amazon EKS 운영과 AI 플랫폼 구축을 위한 문서입니다. 해결할 문제나 설계할 영역에 따라 시작 경로를 선택할 수 있습니다.

## 목적별 시작 경로

- **장애 진단**: [EKS 디버깅](./eks-best-practices/operations-reliability/eks-debugging/index.md)에서 증상별 확인 순서를 찾습니다.
- **추론 환경 구축**: [모델 서빙 & 추론 인프라](./agentic-ai-platform/model-serving/index.md)에서 GPU, 추론 엔진, 라우팅 문서를 확인합니다.
- **아키텍처 선택**: [AI 플랫폼 의사결정 프레임워크](./agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework.md)에서 접근 방식을 비교합니다.
- **구현 예제**: [GenAI on EKS Starter Kit](https://github.com/devfloor9/sample-genai-on-eks-starter-kit)와 [AI on EKS](https://github.com/devfloor9/ai-on-eks)의 구성을 확인합니다.

## 전체 주제

- [EKS Best Practices](./eks-best-practices/index.md): 네트워크, 보안, 비용, 운영 안정성
- [Agentic AI Platform](./agentic-ai-platform/index.md): 설계, 모델 서빙, 운영, Reference Architecture
- [AIDLC](./aidlc/index.md): AI 기반 개발 방법론과 실행 과정
- [EKS Hybrid Nodes](./eks-hybrid-nodes/index.md): 하이브리드 인프라 설계와 운영
- [ROSA](./rosa/index.md): OpenShift on AWS 가이드
- [Industry Solutions](./industry-solutions/index.md): 산업별 활용 시나리오
- [Benchmarks](./benchmarks/index.md): 성능·비용 비교 자료

## 읽기 순서

설계 배경이 필요한 경우 각 영역의 개요부터 읽습니다. 구현 중인 경우 설정 예제와 검증 절차로 이동하고, 운영 문제는 관련 장애 진단 문서를 함께 확인합니다. 문서 상단의 목차에서 필요한 섹션으로 이동할 수 있습니다.
