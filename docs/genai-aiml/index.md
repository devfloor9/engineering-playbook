---
title: GenAI & AI/ML
description: Amazon EKS에서 생성형 AI 및 AI/ML 워크로드 구축과 운영에 대한 심화 기술 문서
tags: [eks, genai, ai, ml, gpu, litellm, langgraph, langfuse, mig]
category: genai-aiml
date: 2025-01-15
authors: [devfloor9]
sidebar_position: 3
sidebar_label: GenAI & AI/ML
---

# GenAI & AI/ML

이 섹션에서는 Amazon EKS에서 생성형 AI 및 AI/ML 워크로드를 구축하고 운영하는 방법에 대한 심화 기술 문서들을 다룹니다.

## 📚 주요 문서

### 프로덕션 GenAI 플랫폼 구축
- **Building Production-Ready GenAI: LiteLLM, LangGraph, and Langfuse on EKS**
  - LiteLLM을 통한 다중 LLM 모델 통합
  - LangGraph 기반 복잡한 AI 워크플로우 구현
  - Langfuse를 통한 GenAI 애플리케이션 모니터링

### GPU 리소스 최적화
- **Maximizing GPU Efficiency: MIG and Time-Slicing Strategies for EKS**
  - NVIDIA MIG(Multi-Instance GPU) 설정 및 활용
  - GPU 시간 분할(Time-Slicing) 전략
  - GPU 리소스 스케줄링 최적화

### GenAI 플랫폼 아키텍처
- **The Future of GenAI Platforms: Building on Amazon EKS (EBA Workshop Guide)**
  - 엔터프라이즈급 GenAI 플랫폼 설계
  - 확장 가능한 AI 인프라 구축
  - 실제 워크샵 가이드 및 실습

## 🎯 학습 목표

이 섹션을 통해 다음을 학습할 수 있습니다:

- EKS에서 확장 가능한 GenAI 플랫폼 구축 방법
- GPU 리소스 효율적 활용 및 최적화 전략
- AI/ML 워크로드의 자동 스케일링 및 리소스 관리
- 프로덕션 환경에서의 AI 모델 배포 및 운영

## 🚀 주요 기술 스택

- **LiteLLM**: 다중 LLM 모델 통합 프레임워크
- **LangGraph**: AI 워크플로우 오케스트레이션
- **Langfuse**: GenAI 애플리케이션 관찰성 및 추적
- **NVIDIA GPU Operator**: GPU 리소스 관리
- **Karpenter**: 노드 자동 스케일링

## 💡 GPU 리소스 관리

### MIG (Multi-Instance GPU)
- 단일 GPU를 여러 인스턴스로 분할
- 리소스 격리 및 효율적 활용
- 다중 테넌트 환경 지원

### Time-Slicing
- GPU 시간 공유를 통한 동시 워크로드 실행
- 개발/테스트 환경에 적합
- 비용 효율적인 GPU 활용

## 🔗 관련 자료

- [Observability & Monitoring](/docs/observability-monitoring)
- [Performance & Networking](/docs/performance-networking)
- [Hybrid & Multi-Cloud](/docs/hybrid-multicloud)

---

:::tip 팁
GenAI 워크로드는 GPU 리소스를 많이 사용하므로, 비용 최적화를 위해 Spot 인스턴스와 자동 스케일링을 적극 활용하세요!
:::
