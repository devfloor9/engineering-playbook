import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SavingsPlansPricingTraining = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["인스턴스 타입", "GPU", "네트워크", "On-Demand", "Savings Plans (1년)", "절감률", "적합 워크로드"] : ["Instance Type", "GPU", "Network", "On-Demand", "Savings Plans (1-yr)", "Savings", "Suitable Workload"];
  const data = isKo ? [["p4d.24xlarge", "8x A100 40GB", "400 Gbps EFA", "$32.77", "$21.30", "35%", "중규모 학습"], ["p4de.24xlarge", "8x A100 80GB", "400 Gbps EFA", "$40.97", "$26.63", "35%", "대규모 학습"], ["p5.48xlarge", "8x H100 80GB", "3200 Gbps EFA", "$98.32", "$63.91", "35%", "초대규모 학습"]] : [["p4d.24xlarge", "8x A100 40GB", "400 Gbps EFA", "$32.77", "$21.30", "35%", "Mid-scale training"], ["p4de.24xlarge", "8x A100 80GB", "400 Gbps EFA", "$40.97", "$26.63", "35%", "Large-scale training"], ["p5.48xlarge", "8x H100 80GB", "3200 Gbps EFA", "$98.32", "$63.91", "35%", "Ultra-large-scale training"]];
  return <ManualTable title={isKo ? 'Savings Plans 가격 (학습용, 예시)' : 'Savings Plans Pricing (Training, illustrative)'} headers={headers} rows={data} numericColumns={isKo ? [3, 4, 5] : [3, 4, 5]} />;
};
export default SavingsPlansPricingTraining;
