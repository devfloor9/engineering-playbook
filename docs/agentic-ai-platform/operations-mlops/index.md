---
title: Operations & Governance
description: AI platform monitoring, observability, evaluation, compliance, and domain-specific operations guide
created: "2026-03-06"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 3
tags:
  - operations
  - monitoring
  - observability
  - mlops
  - compliance
  - scope:nav
sidebar_label: Operations & Governance
sidebar_position: 0
---

import DocCardList from '@theme/DocCardList';

Guides for engineers who measure platform health and response quality, evaluate changes, and operate data and access policies. Start with one of three areas: observability, governance, or data infrastructure.

- **Investigate service health**: begin with [agent monitoring](./observability/agent-monitoring.md), then review [serving optimization monitoring](./observability/llm-serving-optimization-monitoring.md).
- **Evaluate model or prompt changes**: use [Ragas evaluation](./governance/ragas-evaluation.md) and [prefix-cache and accuracy analysis](./observability/prefix-cache-tuning-accuracy-correlation.md).
- **Define operating policies and recovery procedures**: review [governance](./governance/index.md) and [data infrastructure](./data-infrastructure/index.md).

## Documents

Each category lists all documents in that area.

<DocCardList />

## Related Sections

- [Reference Architecture](../reference-architecture/index.md) — monitoring-stack and MLOps-pipeline deployment procedures
- [AIDLC operations](/docs/aidlc/operations) — operations and audit procedures tied to the development lifecycle
- [Design & Architecture](../design-architecture/index.md) — platform responsibilities and data boundaries
