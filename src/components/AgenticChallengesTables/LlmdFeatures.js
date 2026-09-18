import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
const LlmdFeatures = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const features = [{
    icon: "compass",
    name: isKo ? 'Prefix Caching 인식' : 'Prefix Caching Awareness',
    description: isKo ? '동일 프롬프트 프리픽스를 가진 요청을 같은 인스턴스로 라우팅' : 'Routes requests with the same prompt prefix to the same instance',
    k8sIntegration: isKo ? 'Service Discovery 활용' : 'Leverages Service Discovery'
  }, {
    icon: "network",
    name: isKo ? '로드 밸런싱' : 'Load Balancing',
    description: isKo ? 'GPU 사용률 기반 지능형 분배' : 'Intelligent distribution based on GPU utilization',
    k8sIntegration: isKo ? 'Prometheus 메트릭 연동' : 'Prometheus metrics integration'
  }, {
    icon: "refresh",
    name: isKo ? '장애 복구' : 'Failure Recovery',
    description: isKo ? '인스턴스 장애 시 자동 재라우팅' : 'Automatic re-routing on instance failure',
    k8sIntegration: isKo ? 'Health Check + Endpoint Slice' : 'Health Check + Endpoint Slice'
  }, {
    icon: "chart",
    name: isKo ? '동적 스케일링' : 'Dynamic Scaling',
    description: isKo ? '요청량에 따른 백엔드 확장' : 'Backend expansion based on request volume',
    k8sIntegration: isKo ? 'KEDA 연동' : 'KEDA integration'
  }];
  return <ManualTable title={isKo ? "llm.d 핵심 기능" : "llm.d Core Features"} icon="cpu" description={isKo ? '지능형 LLM 프록시 및 라우팅' : 'Intelligent LLM proxy and routing'} headers={[isKo ? "기능" : "Feature", isKo ? "설명" : "Description", isKo ? "Kubernetes 통합" : "Kubernetes Integration"]} rows={features.map(row => [<><Icon name={row.icon} size={18} /> {row.name}</>, row.description, row.k8sIntegration])} />;
};
export default LlmdFeatures;
