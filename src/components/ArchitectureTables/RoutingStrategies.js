import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
import Icon from '../Icon';
const RoutingStrategies = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const strategies = [{
    strategy: isKo ? '가중치 기반' : 'Weight-Based',
    description: isKo ? '트래픽을 비율로 분배' : 'Distribute traffic by ratio',
    useCase: isKo ? 'A/B 테스트, 카나리 배포' : 'A/B testing, canary deployment',
    icon: "network"
  }, {
    strategy: isKo ? '헤더 기반' : 'Header-Based',
    description: isKo ? '요청 헤더로 라우팅 결정' : 'Routing decision based on request headers',
    useCase: isKo ? '모델 선택, 테넌트 분리' : 'Model selection, tenant separation',
    icon: "file-text"
  }, {
    strategy: isKo ? '지연 시간 기반' : 'Latency-Based',
    description: isKo ? '가장 빠른 백엔드로 라우팅' : 'Route to fastest backend',
    useCase: isKo ? '성능 최적화' : 'Performance optimization',
    icon: "cpu"
  }, {
    strategy: isKo ? '폴백' : 'Fallback',
    description: isKo ? '실패 시 대체 백엔드로 전환' : 'Switch to alternative backend on failure',
    useCase: isKo ? '고가용성' : 'High availability',
    icon: "refresh"
  }];
  return <ManualTable title={isKo ? "라우팅 전략" : "Routing Strategies"} headers={[isKo ? "전략" : "Strategy", isKo ? "설명" : "Description", isKo ? "사용 사례" : "Use Case"]} rows={strategies.map(row => [<><Icon name={row.icon} size={18} /> {row.strategy}</>, row.description, row.useCase])} />;
};
export default RoutingStrategies;
