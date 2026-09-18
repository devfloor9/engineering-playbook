import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const HybridPatternSummary = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    pattern: isKo ? 'Bedrock + EKS SLM' : 'Bedrock + EKS SLM',
    configuration: isKo ? 'Bedrock(추론) + EKS 자체 SLM(고빈도)' : 'Bedrock (inference) + EKS self-hosted SLM (high-frequency)',
    scenario: isKo ? 'API 비용 절감이 급한 대규모 추론' : 'Large-scale inference with urgent API cost reduction',
    complexity: '★★☆☆☆'
  }, {
    pattern: isKo ? 'SageMaker 학습 + EKS 서빙' : 'SageMaker Training + EKS Serving',
    configuration: isKo ? 'SageMaker(학습/실험) + EKS+vLLM(서빙)' : 'SageMaker (training/experimentation) + EKS+vLLM (serving)',
    scenario: isKo ? 'ML 팀과 서빙 팀이 분리된 조직' : 'Organizations with separated ML and serving teams',
    complexity: '★★★☆☆'
  }, {
    pattern: isKo ? 'AgentCore + 자체 모델' : 'AgentCore + Self-hosted Models',
    configuration: isKo ? 'AgentCore(Agent 런타임) + EKS(커스텀 모델 추론)' : 'AgentCore (Agent runtime) + EKS (custom model inference)',
    scenario: isKo ? 'Agent 운영은 AWS, 모델은 자체 호스팅' : 'AWS-managed Agent operations, self-hosted models',
    complexity: '★★★☆☆'
  }, {
    pattern: 'Full Stack',
    configuration: isKo ? 'Unified Studio(개발) + Bedrock(외부) + EKS(자체) + AgentCore(운영)' : 'Unified Studio (dev) + Bedrock (external) + EKS (self-hosted) + AgentCore (ops)',
    scenario: isKo ? '엔터프라이즈 AI CoE, 전체 AI 라이프사이클 관리' : 'Enterprise AI CoE, full AI lifecycle management',
    complexity: '★★★★☆'
  }];
  return <ManualTable title={isKo ? '하이브리드 패턴 요약' : 'Hybrid Pattern Summary'} headers={[isKo ? '패턴' : 'Pattern', isKo ? '구성' : 'Configuration', isKo ? '적합 시나리오' : 'Best Fit Scenario', isKo ? '복잡도' : 'Complexity']} rows={data.map(row => [row.pattern, row.configuration, row.scenario, <>{row.complexity} ({row.complexity.split('★').length - 1}/5)</>])} numericColumns={[3]} />;
};
export default HybridPatternSummary;
