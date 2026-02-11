---
title: "EKS 지능형 관찰성 스택 구축"
sidebar_label: "지능형 관찰성 스택"
description: "OpenTelemetry + CloudWatch AI + DevOps Guru를 결합한 ML 기반 관찰성 아키텍처"
sidebar_position: 3
category: "aiops-aidlc"
tags: [aiops, opentelemetry, cloudwatch, devops-guru, prometheus, anomaly-detection]
last_update:
  date: 2026-02-11
  author: devfloor9
---

# EKS 지능형 관찰성 스택 구축

:::info 작성 예정
이 문서는 현재 작성 중입니다. 곧 업데이트될 예정입니다.
:::

## 개요

OpenTelemetry Collector, CloudWatch AI, DevOps Guru를 결합하여 ML 기반 이상 탐지와 자동 알림을 제공하는 EKS 관찰성 아키텍처를 구축합니다.

## 다룰 내용

- OpenTelemetry + Prometheus + ML 이상 탐지 통합 아키텍처
- CloudWatch AI 및 CloudWatch Operator 구성 (컨트롤 플레인 메트릭 자동 수집)
- DevOps Guru EKS 통합 (리소스 그룹 기반 ML 분석)
- ML 기반 알림 설정 및 Alert Fatigue 감소 전략
- 컨텍스트 기반 이상 탐지 (비즈니스 메트릭 + 인프라 메트릭 상관 분석)
- 관찰성 대시보드 및 SLO/SLI 추적
