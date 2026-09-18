import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const MediumScaleCostCalculation = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구성", "월간 비용", "연간 비용"] : ["Strategy", "Cost Impact", "Implementation"];
  const data = isKo ? [["On-Demand", "$16,420", "$197,037"], ["Spot (70% 절감)", "$4,926", "$59,111"], ["Karpenter Consolidation 추가 (20%)", "$3,941", "$47,289"], ["**절감액**", "**$12,479**", "**$149,748**"]] : [["**Spot Instances**", "60-90% cheaper than On-Demand", "Karpenter `capacity-type: spot`"], ["**Consolidation**", "20-40% reduction in idle nodes", "`consolidateAfter: 30s`"], ["**Right-sizing**", "10-30% savings from optimal instances", "Diverse `instance-family`"], ["**Scale-to-zero**", "100% savings during idle periods", "KEDA `minReplicaCount: 0`"], ["**Token Limits**", "10-50% reduction in LLM costs", "Application-level limits"]];
  return <ManualTable title={isKo ? '중규모 비용 계산 (p4d.24xlarge)' : 'Medium Scale Cost Calculation (p4d.24xlarge)'} headers={headers} rows={data} numericColumns={isKo ? [1, 2] : []} />;
};
export default MediumScaleCostCalculation;
