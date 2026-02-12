---
title: "SageMaker-EKS 하이브리드 ML 아키텍처"
sidebar_label: "SageMaker-EKS 통합"
description: "SageMaker에서 학습하고 EKS에서 서빙하는 하이브리드 ML 아키텍처"
sidebar_position: 16
category: "agentic-ai-platform"
tags: [sagemaker, eks, hybrid, mlops, model-registry, training, inference]
last_update:
  date: 2026-02-11
  author: devfloor9
---

# SageMaker-EKS 하이브리드 ML 아키텍처

:::info 작성 예정
이 문서는 현재 작성 중입니다. 곧 업데이트될 예정입니다.
:::

## 개요

SageMaker의 관리형 학습 환경과 EKS의 유연한 서빙 인프라를 결합한 하이브리드 ML 아키텍처를 설계합니다.

## 다룰 내용

- 하이브리드 아키텍처 설계 (SageMaker 학습 + EKS 서빙)
- SageMaker Pipelines 오케스트레이션 및 EKS 배포 트리거
- 중앙 집중식 모델 거버넌스 (SageMaker Model Registry)
- 비용 최적화 전략 (학습 vs 서빙 리소스 분리)
- 멀티 리전 모델 배포 패턴
- 모델 모니터링 및 드리프트 탐지 통합
