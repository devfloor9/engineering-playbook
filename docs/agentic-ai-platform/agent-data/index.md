---
title: "에이전트 & 데이터"
sidebar_label: "에이전트 & 데이터"
sidebar_position: 4
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 에이전트 & 데이터

AI 에이전트의 라이프사이클 관리와 RAG 데이터 레이어를 구성합니다. Agent가 도구를 활용하고 벡터 검색으로 컨텍스트를 보강하는 방식을 다룹니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/agent-data/kagent-kubernetes-agents"
    icon="🤖"
    title="Kagent Agent 관리"
    description="Kubernetes CRD 기반 AI 에이전트 라이프사이클 관리. Agent 정의, MCP/A2A 도구 연결, 스케일링, 상태 관리 패턴."
    color="#10b981"
  />
  <DocCard
    to="/engineering-playbook/docs/agentic-ai-platform/agent-data/milvus-vector-database"
    icon="🔍"
    title="Milvus 벡터 DB"
    description="RAG 파이프라인의 핵심 벡터 저장소. HNSW 인덱스, 하이브리드 검색, 멀티 테넌트 파티셔닝, 운영 가이드."
    color="#06b6d4"
  />
</DocCardGrid>
