import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const KarpenterKeyFeatures = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["기능", "설명", "Agentic AI 적용"] : ["Comparison", "Cluster Autoscaler", "Karpenter"];
  const data = isKo ? [["**Just-in-Time 프로비저닝**", "워크로드 요구에 따라 즉시 노드 생성", "GPU 노드 대기 시간 최소화"], ["**Spot 인스턴스 지원**", "최대 90% 비용 절감", "추론 워크로드 비용 최적화"], ["**Consolidation**", "유휴 노드 자동 정리", "GPU 리소스 효율성 극대화"], ["**다양한 인스턴스 타입**", "워크로드에 최적화된 인스턴스 자동 선택", "모델 크기별 최적 GPU 매칭"], ["**Disruption Budgets**", "서비스 영향 최소화하며 노드 관리", "안정적인 스케일 다운"]] : [["**Provisioning Time**", "5-10 min", "2-3 min"], ["**Instance Selection**", "Fixed types in Node Group", "Dynamic based on workload"], ["**GPU Support**", "Manual Node Group config", "Automatic NodePool matching"], ["**Cost Optimization**", "Limited", "Auto Spot, Consolidation"]];
  return <ManualTable title={isKo ? 'Karpenter 핵심 기능' : 'Karpenter Key Features'} headers={headers} rows={data} numericRows={isKo ? [] : [0]} />;
};
export default KarpenterKeyFeatures;
