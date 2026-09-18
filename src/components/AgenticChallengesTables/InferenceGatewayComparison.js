import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
import styles from '../ArchitectureTables/manual.module.css';
const InferenceGatewayComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'Kgateway',
    version: 'v2.0+',
    role: isKo ? '트래픽 관리' : 'Traffic Management',
    features: isKo ? '헤더 기반 라우팅, 가중치 분배, Rate Limiting, Canary 배포' : 'Header-based routing, weight distribution, Rate Limiting, Canary deployment'
  }, {
    name: 'Bifrost',
    version: 'v1.x',
    role: isKo ? 'API 추상화 (Primary)' : 'API Abstraction (Primary)',
    features: isKo ? 'Rust 기반 50x 빠른 성능, 100+ LLM 프로바이더 지원, 통합 API, 폴백 설정, 비용 추적' : 'Rust-based 50x faster, 100+ LLM provider support, unified API, fallback settings, cost tracking'
  }, {
    name: 'LiteLLM',
    version: 'v1.60+',
    role: isKo ? 'API 추상화 (Alternative)' : 'API Abstraction (Alternative)',
    features: isKo ? 'Python 기반, 100+ LLM 프로바이더 지원, 통합 API, 폴백 설정, 비용 추적' : 'Python-based, 100+ LLM provider support, unified API, fallback settings, cost tracking'
  }];
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "추론 게이트웨이 솔루션 비교" : "Inference Gateway Solutions"} icon="network" description={isKo ? 'Kgateway vs LiteLLM 역할과 기능' : 'Kgateway vs LiteLLM roles and capabilities'} headers={[isKo ? "솔루션" : "Solution", isKo ? "버전" : "Version", isKo ? "역할" : "Role", isKo ? "핵심 기능" : "Key Features"]} rows={solutions.map(row => [row.name, row.version, row.role, row.features])} /><p className={styles.note}><Icon name="info" size={18} /> {isKo ? 'Kgateway는 트래픽 제어를, Bifrost는 멀티 프로바이더 통합을 담당하여 함께 사용 가능합니다. LiteLLM은 대안으로 사용할 수 있습니다.' : 'Kgateway handles traffic control while Bifrost manages multi-provider integration, and they can be used together. LiteLLM is available as an alternative.'}</p></div>;
};
export default InferenceGatewayComparison;
