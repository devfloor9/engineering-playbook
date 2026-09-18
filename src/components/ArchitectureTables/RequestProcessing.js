import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
import Icon from '../Icon';
const RequestProcessing = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const steps = [{
    step: '1-2',
    component: 'Gateway (L5)',
    description: isKo ? '인증 · Rate Limit · Guardrail 검증' : 'Auth, rate limit, guardrail verification',
    icon: "shield"
  }, {
    step: '3',
    component: 'Gateway → Agent (L4)',
    description: isKo ? '에이전트 라우팅 및 작업 할당' : 'Agent routing and task assignment',
    icon: "terminal"
  }, {
    step: '4-5',
    component: 'Agent → Vector DB (L3)',
    description: isKo ? 'RAG를 위한 컨텍스트 검색' : 'Context search for RAG',
    icon: "search"
  }, {
    step: '6-8',
    component: 'Agent → Gateway → Model (L2)',
    description: isKo ? '게이트웨이 경유 모델 추론 (Cascade · Fallback)' : 'Model inference via gateway (Cascade, Fallback)',
    icon: "cpu"
  }, {
    step: '9',
    component: isKo ? '관측성 플레인' : 'Observability Plane',
    description: isKo ? 'Trace · 비용 기록' : 'Record trace and cost',
    icon: "chart"
  }, {
    step: '10-11',
    component: 'Agent → Gateway → Client',
    description: isKo ? '응답 반환' : 'Response return',
    icon: "check"
  }];
  return <ManualTable title={isKo ? "요청 처리 단계" : "Request Processing Steps"} headers={[isKo ? "단계" : "Step", isKo ? "컴포넌트" : "Component", isKo ? "설명" : "Description"]} rows={steps.map(row => [<><Icon name={row.icon} size={18} /> {row.step}</>, row.component, row.description])} />;
};
export default RequestProcessing;
