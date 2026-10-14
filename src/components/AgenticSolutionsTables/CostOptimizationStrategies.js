import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const CostOptimizationStrategies = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["전략", "적용 방법", "예상 절감률", "비고"] : ["Strategy", "How to Apply", "Est. Savings Rate", "Notes"];
  const data = isKo ? [["**Spot 인스턴스**", "Karpenter NodePool", "60-70%", "중단 허용 워크로드의 Spot 비중에 적용 (리전/용량에 따라 변동)"], ["**Consolidation**", "Karpenter disruption", "20-30%", "유휴 노드 비용 회수. 크기는 단편화 정도에 따라 다름"], ["**Right-sizing**", "워크로드별 인스턴스 선택", "15-25%", "과다 프로비저닝 방지"], ["**Savings Plans**", "1년 약정 (학습용)", "30-35%", "안정적 학습 용량의 약정 할인"], ["**복합 적용**", "위 전략 조합", "50-75%", "백분율은 서로 다른 기준에 적용되어 단순 합산 불가. 실제 청구 데이터로 산출"]] : [["**Spot Instances**", "Karpenter NodePool", "60-70%", "Applies to the Spot share of interruption-tolerant workloads (varies by Region/capacity)"], ["**Consolidation**", "Karpenter disruption", "20-30%", "Reclaims idle-node cost; magnitude depends on fragmentation"], ["**Right-sizing**", "Per-workload instance selection", "15-25%", "Avoids over-provisioning"], ["**Savings Plans**", "1-yr commitment (training)", "30-35%", "Committed-use discount on steady training capacity"], ["**Combined**", "Combination of the above", "50-75%", "Rates apply to different bases and are not additive; compute from real billing data"]];
  return <ManualTable title={isKo ? '비용 최적화 전략 요약 (예시)' : 'Cost Optimization Strategies Summary (illustrative)'} headers={headers} rows={data} numericColumns={isKo ? [2] : [2]} />;
};
export default CostOptimizationStrategies;
