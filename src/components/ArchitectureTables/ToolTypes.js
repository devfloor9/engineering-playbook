import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
import Icon from '../Icon';
const ToolTypes = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const tools = [{
    type: 'API',
    description: isKo ? '외부 REST/gRPC API 호출' : 'Call external REST/gRPC API',
    examples: isKo ? '웹 검색, 티켓 생성' : 'Web search, ticket creation',
    icon: "network"
  }, {
    type: 'Retrieval',
    description: isKo ? '벡터 저장소 검색' : 'Search vector store',
    examples: isKo ? '문서 검색, FAQ 조회' : 'Document search, FAQ lookup',
    icon: "search"
  }, {
    type: 'Code',
    description: isKo ? '코드 실행 (샌드박스)' : 'Execute code (sandboxed)',
    examples: isKo ? 'Python 스크립트, SQL 쿼리' : 'Python script, SQL query',
    icon: "terminal"
  }, {
    type: 'Human',
    description: isKo ? '사람의 승인/입력 대기' : 'Wait for human approval/input',
    examples: isKo ? '결제 승인, 민감 작업 확인' : 'Payment approval, sensitive task confirmation',
    icon: "shield"
  }];
  return <ManualTable title={isKo ? "도구 유형" : "Tool Types"} headers={[isKo ? "유형" : "Type", isKo ? "설명" : "Description", isKo ? "예시" : "Examples"]} rows={tools.map(row => [<><Icon name={row.icon} size={18} /> {row.type}</>, row.description, row.examples])} />;
};
export default ToolTypes;
