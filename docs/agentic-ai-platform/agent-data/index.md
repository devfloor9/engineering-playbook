---
title: "에이전트 & 데이터"
sidebar_label: "에이전트 & 데이터"
sidebar_position: 4
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 에이전트 & 데이터

다중 모델 생태계에서 AI 에이전트는 LLM과 SLM을 상황에 맞게 호출하며, MCP(도구 연결)와 A2A(에이전트 간 통신) 표준 프로토콜을 통해 외부 시스템과 상호작용합니다. 이 섹션에서는 Kubernetes CRD 기반의 에이전트 라이프사이클 관리와, RAG 데이터 레이어(벡터 검색 + Knowledge Graph)를 통한 컨텍스트 보강 방식을 다룹니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/agent-data/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent Agent 관리"
    description="Kubernetes CRD 기반 AI 에이전트 라이프사이클 관리. Agent 정의, MCP/A2A 도구 연결, 스케일링, 상태 관리 패턴."
    color="#10b981"
  />
  <DocCard
    to="/docs/agentic-ai-platform/agent-data/milvus-vector-database"
    icon="🔍"
    title="Milvus 벡터 DB"
    description="RAG 파이프라인의 핵심 벡터 저장소. HNSW 인덱스, 하이브리드 검색, 멀티 테넌트 파티셔닝, 운영 가이드."
    color="#06b6d4"
  />
</DocCardGrid>
