import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SmallScaleCostCalculation = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구성", "월간 비용", "연간 비용"] : ["Metric", "Without KEDA", "With KEDA + Karpenter"];
  const data = isKo ? [["On-Demand", "$1,753", "$21,034"], ["Spot (70% 절감)", "$526", "$6,310"], ["**절감액**", "**$1,227**", "**$14,724**"]] : [["**Scale-up latency**", "3-5 minutes (CPU-based HPA)", "30-60 seconds (queue-based)"], ["**Scale-down safety**", "Aggressive, may kill tasks", "Cooldown + stabilization"], ["**Cold start handling**", "minReplicas=0, slow start", "minReplicas=1, warm pool"], ["**Burst handling**", "Delayed, CPU threshold based", "Immediate, queue depth based"], ["**Cost efficiency**", "Moderate (always-on capacity)", "High (scale to zero capable)"]];
  return <ManualTable title={isKo ? '소규모 비용 계산 (g5.xlarge)' : 'Small Scale Cost Calculation (g5.xlarge)'} headers={headers} rows={data} numericColumns={isKo ? [1, 2] : []} />;
};
export default SmallScaleCostCalculation;
