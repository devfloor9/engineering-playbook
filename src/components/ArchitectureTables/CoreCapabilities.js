import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
const CoreCapabilities = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const capabilities = [{
    name: isKo ? '에이전트 오케스트레이션' : 'Agent Orchestration',
    description: isKo ? 'AI 에이전트 라이프사이클 선언적 관리' : 'Declarative AI agent lifecycle management'
  }, {
    name: isKo ? '지능형 라우팅' : 'Intelligent Routing',
    description: isKo ? '추론 요청의 지능형 동적 라우팅' : 'Intelligent dynamic routing of inference requests'
  }, {
    name: isKo ? '벡터 검색' : 'Vector Search',
    description: isKo ? '벡터 DB 기반 RAG(Retrieval-Augmented Generation) 지원' : 'Vector DB-based RAG (Retrieval-Augmented Generation) support'
  }, {
    name: isKo ? '관측성' : 'Observability',
    description: isKo ? '에이전트 동작 추적, LLM 트레이싱, 비용 분석' : 'Agent behavior tracking, LLM tracing, and cost analysis'
  }, {
    name: isKo ? '확장성' : 'Scalability',
    description: isKo ? 'Kubernetes 네이티브 수평적 확장' : 'Horizontal scaling native to Kubernetes'
  }, {
    name: isKo ? '멀티테넌트' : 'Multi-Tenancy',
    description: isKo ? '리소스 격리와 공정한 분배를 통한 다중 팀 지원' : 'Support multiple teams with resource isolation and fair distribution'
  }];
  return <ManualTable title={isKo ? "핵심 기능" : "Core Capabilities"} headers={[isKo ? "기능" : "Capability", isKo ? "설명" : "Description"]} rows={capabilities.map(row => [row.name, row.description])} />;
};
export default CoreCapabilities;
