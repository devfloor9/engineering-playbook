import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
const KAgentFeatures = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const features = [{
    icon: "file-text",
    name: isKo ? '선언적 Agent 정의' : 'Declarative Agent Definition',
    description: isKo ? 'YAML로 Agent 구성, 도구, 메모리 정의' : 'Define Agent configuration, tools, memory in YAML'
  }, {
    icon: "activity",
    name: isKo ? '자동 스케일링' : 'Automatic Scaling',
    description: isKo ? '요청량에 따른 Agent 인스턴스 자동 확장' : 'Auto-expand Agent instances based on request volume'
  }, {
    icon: "search",
    name: isKo ? '통합 관측성' : 'Integrated Observability',
    description: isKo ? 'Langfuse/LangSmith 연동' : 'Integration with Langfuse/LangSmith'
  }, {
    icon: "settings",
    name: isKo ? '도구 관리' : 'Tool Management',
    description: isKo ? 'MCP(Model Context Protocol) 기반 도구 통합' : 'Tool integration based on MCP (Model Context Protocol)'
  }];
  return <ManualTable title={isKo ? "KAgent 핵심 기능" : "KAgent Core Features"} icon="terminal" description={isKo ? 'Kubernetes 네이티브 Agent 오케스트레이션' : 'Kubernetes-native Agent orchestration'} headers={[isKo ? "기능" : "Feature", isKo ? "설명" : "Description"]} rows={features.map(row => [<><Icon name={row.icon} size={18} /> {row.name}</>, row.description])} />;
};
export default KAgentFeatures;
