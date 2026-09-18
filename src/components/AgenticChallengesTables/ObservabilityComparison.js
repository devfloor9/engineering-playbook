import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
import styles from '../ArchitectureTables/manual.module.css';
const ObservabilityComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'Langfuse',
    version: 'latest',
    deployment: isKo ? 'Self-hosted (K8s) - 프로덕션 (데이터 주권)' : 'Self-hosted (K8s) - Production (Data Sovereignty)',
    features: isKo ? '토큰 추적, 비용 분석, 프롬프트 관리, A/B 테스트' : 'Token tracking, cost analysis, prompt management, A/B testing'
  }, {
    name: 'LangSmith',
    version: 'latest',
    deployment: isKo ? 'Managed SaaS - 개발/스테이징 (LangGraph Studio)' : 'Managed SaaS - Dev/Staging (LangGraph Studio)',
    features: isKo ? '트레이싱, 평가, 데이터셋 관리, 협업 기능' : 'Tracing, evaluation, dataset management, collaboration features'
  }];
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "관찰성 솔루션 비교" : "Observability Solutions"} icon="chart" description={isKo ? 'Langfuse vs LangSmith 배포 방식과 기능' : 'Langfuse vs LangSmith deployment and capabilities'} headers={[isKo ? "솔루션" : "Solution", isKo ? "버전" : "Version", isKo ? "배포 방식" : "Deployment", isKo ? "핵심 기능" : "Key Features"]} rows={solutions.map(row => [row.name, row.version, row.deployment, row.features])} /><p className={styles.note}><Icon name="info" size={18} /> {isKo ? 'Langfuse는 온프레미스 제어를, LangSmith는 편의성을 제공하며 선택은 보안 요구사항에 따라 달라집니다.' : 'Langfuse offers on-premise control while LangSmith provides convenience; choice depends on security requirements.'}</p></div>;
};
export default ObservabilityComparison;
