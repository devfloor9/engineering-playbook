---
title: Model Lifecycle
sidebar_label: Model Lifecycle
description: Custom model deployment, fine-tuning pipelines, MLOps orchestration, continuous training pipelines
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

## Overview

Production models do not end with a single deployment. This section covers all stages of the model lifecycle, from custom model deployment and LoRA fine-tuning pipelines to MLOps orchestration (Kubeflow/Argo) and Continuous Training (GRPO/DPO/Canary rollout).

## Documents

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
