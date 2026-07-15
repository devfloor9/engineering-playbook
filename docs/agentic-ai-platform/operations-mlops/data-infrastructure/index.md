---
title: 데이터 인프라
description: Agentic AI 플랫폼의 벡터 데이터베이스·임베딩 스토어 등 데이터 계층 운영
created: "2026-04-20"
last_update:
  date: "2026-07-13"
  author: devfloor9
reading_time: 1
tags:
  - operations
  - data-infrastructure
  - vector-database
  - milvus
  - scope:nav
sidebar_label: 데이터 인프라
---

## 개요

RAG 파이프라인과 장기 메모리가 정상 동작하려면 벡터 검색 인프라가 안정적으로 운영되어야 한다. 본 섹션은 Milvus 기반 벡터 데이터베이스 운영을 다룬다. 향후 Feature Store 운영, Knowledge Graph 인프라 등 데이터 계층 문서가 추가될 예정이다.

### 다루는 내용

- [Milvus 벡터 데이터베이스](./milvus-vector-database.md) — EKS 기반 Milvus 클러스터 아키텍처, 인덱스 선택(HNSW·IVF·DiskANN), 샤딩·복제 운영 전략

### 관련 문서

- [도메인 특화 (LoRA + RAG)](../governance/domain-customization.md) — RAG 파이프라인에서 벡터 검색이 담당하는 역할과 선택 기준
- [Ragas 평가 프레임워크](../governance/ragas-evaluation.md) — 벡터 검색 품질(Context Precision·Recall) 평가
- [모니터링 스택 구성](../../reference-architecture/integrations/monitoring-observability-setup.md) — 데이터 계층 포함 플랫폼 관측성 구성

## 문서 목록

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
