import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const ObservabilityLayerStack = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'Langfuse',
    role: isKo ? 'LLM 트레이싱 (Production)' : 'LLM Tracing (Production)',
    integration: isKo ? 'Helm Chart, StatefulSet' : 'Helm Chart, StatefulSet',
    features: isKo ? '토큰 추적, 비용 분석, 프롬프트 버전 관리' : 'Token tracking, cost analysis, prompt version management'
  }, {
    name: 'LangSmith',
    role: isKo ? 'LLM 트레이싱 (Dev/Staging)' : 'LLM Tracing (Dev/Staging)',
    integration: isKo ? 'SDK 연동' : 'SDK integration',
    features: isKo ? '트레이싱, 평가, 데이터셋 관리, 협업' : 'Tracing, evaluation, dataset management, collaboration'
  }, {
    name: 'RAGAS',
    role: isKo ? 'RAG 품질 평가' : 'RAG Quality Evaluation',
    integration: isKo ? 'Job/CronJob' : 'Job/CronJob',
    features: isKo ? 'Faithfulness, Relevancy, Context Precision 평가' : 'Faithfulness, Relevancy, Context Precision evaluation'
  }];
  return <ManualTable title={isKo ? "관측성 레이어 스택" : "Observability Layer Stack"} icon="search" description={isKo ? 'LLM 성능 모니터링 및 평가 솔루션' : 'LLM performance monitoring and evaluation solutions'} headers={[isKo ? "솔루션" : "Solution", isKo ? "역할" : "Role", isKo ? "Kubernetes 통합" : "Kubernetes Integration", isKo ? "핵심 기능" : "Core Features"]} rows={solutions.map(row => [row.name, row.role, row.integration, row.features])} />;
};
export default ObservabilityLayerStack;
