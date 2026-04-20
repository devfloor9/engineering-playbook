---
title: 모델 수명주기
sidebar_label: 모델 수명주기
description: 커스텀 모델 배포·파인튜닝 파이프라인·MLOps 오케스트레이션·지속 학습 파이프라인
created: 2026-04-20
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - reference-architecture
  - mlops
  - model-serving
  - fine-tuning
  - continuous-training
  - scope:nav
---

## 개요

프로덕션 모델은 한 번 배포로 끝나지 않는다. 본 섹션은 커스텀 모델 배포, LoRA 파인튜닝 파이프라인, MLOps 오케스트레이션(Kubeflow·Argo), Continuous Training(GRPO·DPO·Canary 롤아웃)까지 모델 수명주기 전 단계를 다룬다.

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
