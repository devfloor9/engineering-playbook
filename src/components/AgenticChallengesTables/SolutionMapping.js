import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SolutionMapping = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    challenge: isKo ? 'GPU 모니터링 및 스케줄링' : 'GPU Monitoring & Scheduling',
    coreSolution: 'Karpenter',
    supportingSolutions: ['DCGM Exporter', 'NVIDIA GPU Operator'],
    solves: isKo ? 'GPU 노드 자동 프로비저닝, 세대별 워크로드 매칭' : 'GPU node auto provisioning, generation-specific workload matching'
  }, {
    challenge: isKo ? '동적 라우팅 및 스케일링' : 'Dynamic Routing & Scaling',
    coreSolution: 'Kgateway, Bifrost',
    supportingSolutions: ['KEDA', 'vLLM', 'llm-d', 'LiteLLM'],
    solves: isKo ? '멀티 모델 라우팅, 트래픽 기반 자동 스케일링' : 'Multi-model routing, traffic-based auto scaling'
  }, {
    challenge: isKo ? '토큰/비용 모니터링' : 'Token/Cost Monitoring',
    coreSolution: 'LangSmith (개발) + Langfuse (프로덕션)',
    supportingSolutions: ['OpenTelemetry', 'Prometheus'],
    solves: isKo ? '토큰 레벨 추적, 비용 가시성, 품질 평가' : 'Token-level tracking, cost visibility, quality evaluation'
  }, {
    challenge: isKo ? 'Agent 오케스트레이션 및 안전성' : 'Agent Orchestration & Safety',
    coreSolution: 'LangGraph, NeMo Guardrails',
    supportingSolutions: ['MCP/A2A', 'Ragas'],
    solves: isKo ? 'Agent 워크플로우 오케스트레이션, 안전성 가드레일, 도구 통합' : 'Agent workflow orchestration, safety guardrails, tool integration'
  }, {
    challenge: isKo ? '모델 공급망 관리' : 'Model Supply Chain Management',
    coreSolution: 'NeMo, Kubeflow',
    supportingSolutions: ['MLflow', 'Ray'],
    solves: isKo ? '분산 학습 오케스트레이션, 파이프라인 자동화' : 'Distributed learning orchestration, pipeline automation'
  }];
  return <ManualTable title={isKo ? "도전과제별 솔루션 매핑" : "Solution Mapping by Challenge"} icon="compass" description={isKo ? '핵심 솔루션과 보조 솔루션' : 'Core and supporting solutions'} headers={[isKo ? "도전과제" : "Challenge", isKo ? "핵심 솔루션" : "Core Solution", isKo ? "보조 솔루션" : "Supporting Solutions", isKo ? "해결하는 문제" : "Solves"]} rows={solutions.map(row => [row.challenge, row.coreSolution, row.supportingSolutions.join(', '), row.solves])} />;
};
export default SolutionMapping;
