import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const CostOptimizationStrategies = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["전략", "적용 방법", "예상 절감률", "연간 절감액 (중규모 기준)"] : ["Component", "Purpose", "Cost Optimization"];
  const data = isKo ? [["**Spot 인스턴스**", "Karpenter NodePool", "60-70%", "$137,926"], ["**Consolidation**", "Karpenter disruption", "20-30%", "$39,407"], ["**Right-sizing**", "워크로드별 인스턴스 선택", "15-25%", "$29,556"], ["**Savings Plans**", "1년 약정 (학습용)", "30-35%", "$796,400"], ["**복합 적용**", "위 전략 조합", "50-75%", "$98,519 - $147,778"]] : [["**Dedicated NodePool**", "Isolate training from inference", "Spot instances, right-sized for training"], ["**Kubeflow/AWS Batch**", "Distributed training orchestration", "Multi-node GPU utilization"], ["**Checkpointing**", "Spot interruption recovery", "Minimize wasted compute"], ["**FSx for Lustre**", "High-throughput data access", "Reduce training time"], ["**EFA Networking**", "Low-latency GPU communication", "Faster distributed training"]];
  return <ManualTable title={isKo ? '비용 최적화 전략 요약' : 'Cost Optimization Strategies Summary'} headers={headers} rows={data} numericColumns={isKo ? [2, 3] : []} />;
};
export default CostOptimizationStrategies;
