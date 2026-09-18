import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
import Icon from '../Icon';
import styles from './manual.module.css';
const TenantIsolation = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isolations = [{
    level: isKo ? '네임스페이스' : 'Namespace',
    method: isKo ? '테넌트별 네임스페이스' : 'Tenant per namespace',
    advantages: isKo ? '간단한 구현, 리소스 격리' : 'Simple implementation, resource isolation',
    disadvantages: isKo ? '네트워크 정책 필요' : 'Network policy required',
    icon: "server",
    recommendedFor: isKo ? '일반적인 멀티테넌시' : 'General multi-tenancy'
  }, {
    level: isKo ? '노드' : 'Node',
    method: isKo ? '테넌트별 노드 풀' : 'Tenant per node pool',
    advantages: isKo ? '완전한 격리' : 'Complete isolation',
    disadvantages: isKo ? '비용 증가' : 'Cost increase',
    icon: "server",
    recommendedFor: isKo ? '규제 준수가 필요한 환경' : 'Compliance-required environments'
  }, {
    level: isKo ? '클러스터' : 'Cluster',
    method: isKo ? '테넌트별 클러스터' : 'Tenant per cluster',
    advantages: isKo ? '최고 수준 격리' : 'Highest level isolation',
    disadvantages: isKo ? '관리 복잡성' : 'Management complexity',
    icon: "layers",
    recommendedFor: isKo ? '엔터프라이즈 고객' : 'Enterprise customers'
  }];
  return <ManualTable title={isKo ? "테넌트 격리 전략" : "Tenant Isolation Strategy"} headers={[isKo ? "격리 수준" : "Isolation Level", isKo ? "권장 환경" : "Recommended For", isKo ? "방법" : "Method", isKo ? "장점" : "Advantages", isKo ? "단점" : "Disadvantages"]} rows={isolations.map(row => [<><Icon name={row.icon} size={18} /> {row.level}</>, row.recommendedFor, row.method, <span className={styles.status} data-status="success"><Icon name="check" size={16} /> {row.advantages}</span>, <span className={styles.status} data-status="error"><Icon name="x-circle" size={16} /> {row.disadvantages}</span>])} />;
};
export default TenantIsolation;
