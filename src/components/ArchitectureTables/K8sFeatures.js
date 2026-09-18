import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
const K8sFeatures = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const features133 = [{
    feature: isKo ? 'Stable Sidecar Containers' : 'Stable Sidecar Containers',
    description: isKo ? 'Init 컨테이너가 Pod 전체 라이프사이클 동안 실행' : 'Init containers run during Pod entire lifecycle',
    application: isKo ? 'Agent Pod의 로깅/메트릭 수집 사이드카 안정화' : 'Agent Pod logging/metrics collection sidecar stabilization'
  }, {
    feature: isKo ? 'Topology-Aware Routing' : 'Topology-Aware Routing',
    description: isKo ? '노드 토폴로지 기반 트래픽 라우팅' : 'Node topology-based traffic routing',
    application: isKo ? '크로스 AZ 트래픽 비용 절감, 지연 시간 개선' : 'Cross-AZ traffic cost reduction, latency improvement'
  }, {
    feature: isKo ? 'In-Place Resource Resizing' : 'In-Place Resource Resizing',
    description: isKo ? 'Pod 재시작 없이 리소스 조정' : 'Adjust resources without Pod restart',
    application: isKo ? 'GPU 메모리 동적 조정 (제한적)' : 'GPU memory dynamic adjustment (limited)'
  }, {
    feature: isKo ? 'DRA v1beta1 안정화' : 'DRA v1beta1 stabilization',
    description: isKo ? 'Dynamic Resource Allocation API 안정화' : 'Dynamic Resource Allocation API stabilization',
    application: isKo ? '프로덕션 GPU 파티셔닝 지원' : 'Production GPU partitioning support'
  }];
  const features134 = [{
    feature: isKo ? 'Projected Service Account Tokens' : 'Projected Service Account Tokens',
    description: isKo ? '향상된 서비스 계정 토큰 관리' : 'Enhanced service account token management',
    application: isKo ? 'Agent Pod의 보안 강화' : 'Agent Pod security enhancement'
  }, {
    feature: isKo ? 'DRA Prioritized Alternatives' : 'DRA Prioritized Alternatives',
    description: isKo ? '리소스 할당 우선순위 대안' : 'Resource allocation prioritized alternatives',
    application: isKo ? 'GPU 리소스 경합 시 지능적 스케줄링' : 'Intelligent scheduling during GPU resource contention'
  }, {
    feature: isKo ? 'Improved Resource Quota' : 'Improved Resource Quota',
    description: isKo ? '리소스 쿼터 세분화' : 'Resource quota refinement',
    application: isKo ? 'GPU 테넌트별 정밀한 할당 제어' : 'GPU precise allocation control per tenant'
  }];
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "Kubernetes 1.33+ 기능" : "Kubernetes 1.33+ Features"} headers={[isKo ? "기능" : "Feature", isKo ? "설명" : "Description", isKo ? "적용" : "Application"]} rows={features133.map(row => [row.feature, row.description, row.application])} /><ManualTable title={isKo ? "Kubernetes 1.34+ 기능" : "Kubernetes 1.34+ Features"} headers={[isKo ? "기능" : "Feature", isKo ? "설명" : "Description", isKo ? "적용" : "Application"]} rows={features134.map(row => [row.feature, row.description, row.application])} /></div>;
};
export default K8sFeatures;
