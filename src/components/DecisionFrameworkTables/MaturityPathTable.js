import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const MaturityPathTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    level: isKo ? 'Level 1 — AI 탐색기' : 'Level 1 — AI Explorer',
    characteristics: isKo ? 'AI/ML 워크로드 없음, 빠른 PoC 필요' : 'No AI/ML workloads, need fast PoC',
    recommended: isKo ? 'AWS 매니지드 우선' : 'AWS Managed First',
    services: isKo ? 'Bedrock API + Strands SDK + AgentCore' : 'Bedrock API + Strands SDK + AgentCore',
    timeline: isKo ? '2-4주' : '2-4 weeks'
  }, {
    level: isKo ? 'Level 2 — AI 구축기' : 'Level 2 — AI Builder',
    characteristics: isKo ? 'ML 일부 운영, 학습 파이프라인 필요' : 'Some ML in production, training pipelines needed',
    recommended: isKo ? 'SageMaker + Bedrock 하이브리드' : 'SageMaker + Bedrock Hybrid',
    services: isKo ? 'SageMaker Unified Studio + Bedrock + S3/Glue' : 'SageMaker Unified Studio + Bedrock + S3/Glue',
    timeline: isKo ? '1-3개월' : '1-3 months'
  }, {
    level: isKo ? 'Level 3 — AI 최적화기' : 'Level 3 — AI Optimizer',
    characteristics: isKo ? '대규모 추론, 비용 압박, 커스텀 모델' : 'Large-scale inference, cost pressure, custom models',
    recommended: isKo ? 'EKS 오픈 아키텍처 + Cascade Routing' : 'EKS Open Architecture + Cascade Routing',
    services: isKo ? 'EKS + vLLM/llm-d + kgateway + Bifrost + Langfuse' : 'EKS + vLLM/llm-d + kgateway + Bifrost + Langfuse',
    timeline: isKo ? '3-6개월' : '3-6 months'
  }];
  return <ManualTable title={isKo ? 'AI 플랫폼 성숙도 경로' : 'AI Platform Maturity Path'} headers={[isKo ? '성숙도' : 'Maturity Level', isKo ? '특징' : 'Characteristics', isKo ? '권장 스택' : 'Recommended Stack', isKo ? '핵심 서비스' : 'Core Services', isKo ? '기간' : 'Timeline']} rows={data.map(row => [row.level, row.characteristics, row.recommended, row.services, row.timeline])} numericColumns={[4]} />;
};
export default MaturityPathTable;
