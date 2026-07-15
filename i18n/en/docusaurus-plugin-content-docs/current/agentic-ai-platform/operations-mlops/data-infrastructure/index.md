---
title: Data Infrastructure
description: Operating vector databases, embedding stores, and data layer infrastructure for Agentic AI platforms
created: "2026-04-20"
last_update:
  date: "2026-07-13"
  author: devfloor9
reading_time: 2
tags:
  - operations
  - data-infrastructure
  - vector-database
  - milvus
  - scope:nav
sidebar_label: Data Infrastructure
---

## Overview

For RAG pipelines and long-term memory to function properly, vector search infrastructure must be operated reliably. This section covers Milvus-based vector database operations. Future documents on Feature Store operations, Knowledge Graph infrastructure, and other data layer components will be added.

### What This Section Covers

- [Milvus Vector Database](./milvus-vector-database.md) -- EKS-based Milvus cluster architecture, index selection (HNSW, IVF, DiskANN), and sharding/replication operations

### Related Documents

- [Domain Customization (LoRA + RAG)](../governance/domain-customization.md) -- The role of vector search in RAG pipelines and selection criteria
- [Ragas Evaluation Framework](../governance/ragas-evaluation.md) -- Evaluating vector search quality (Context Precision, Recall)
- [Monitoring Stack Setup](../../reference-architecture/integrations/monitoring-observability-setup.md) -- Platform observability including the data layer

## Document List

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
