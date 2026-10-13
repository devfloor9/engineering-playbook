---
title: Integrations & Cost
description: SageMaker hybrid integration, Observability stack deployment, and coding tools cost analysis
created: "2026-04-20"
last_update:
  date: "2026-07-13"
  author: devfloor9
reading_time: 2
tags:
  - reference-architecture
  - integrations
  - sagemaker
  - cost-analysis
  - monitoring
  - scope:nav
sidebar_label: Integrations & Cost
---

## Overview

Covers external AWS service integrations and cost analysis. Includes SageMaker-EKS hybrid training and inference patterns, Langfuse, Prometheus, AMP/AMG-based Observability stack deployment, coding tools (Aider, Cline, Cursor) cost analysis, and other platform peripheral integrations.

### What This Section Covers

- [SageMaker-EKS Integration](./sagemaker-eks-integration.md) -- Hybrid architecture patterns combining SageMaker training with EKS inference
- [Monitoring Stack Setup](./monitoring-observability-setup.md) -- Langfuse Helm deployment, AMP/AMG, and OTel integration
- [Open-Weight Model Deployment Guide](./open-weight-model-deployment.md) -- Self-hosting decisions from token economics and data sovereignty perspectives
- [Coding Tools Cost Analysis](./coding-tools-cost-analysis.md) -- Cost structure comparison of Aider, Cline, and Cursor

### Related Documents

- [Inference Gateway Deployment](../inference-gateway/setup/index.md) -- Gateway infrastructure configured before these integrations
- [Model Lifecycle](../model-lifecycle/index.md) -- Where SageMaker and monitoring integrations fit in training/deployment pipelines
- [Agent Monitoring](../../operations-mlops/observability/agent-monitoring.md) -- Operating the observability stack after deployment

## Document List

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
