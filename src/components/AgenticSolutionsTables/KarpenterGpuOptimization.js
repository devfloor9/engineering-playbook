import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const KarpenterGpuOptimization = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["기능", "설명", "효과"] : ["Feature", "Benefit", "Configuration"];
  const data = isKo ? [["인스턴스 타입 자동 선택", "워크로드 요구사항에 맞는 GPU 인스턴스 자동 선택", "리소스 낭비 방지"], ["Spot 인스턴스 폴백", "Spot 불가 시 On-Demand로 자동 전환", "가용성 보장"], ["Consolidation", "유휴 GPU 노드 자동 정리", "비용 30% 절감"], ["빠른 프로비저닝", "Node Group 없이 직접 EC2 API 호출", "프로비저닝 시간 50% 단축"]] : [["**Spot + On-Demand Mix**", "70% cost savings with automatic fallback", "`capacity-type: [spot, on-demand]`"], ["**Multi-Instance Support**", "Select optimal GPU type per workload", "`instance-family: [g5, g6, p4d, p5]`"], ["**Consolidation**", "Bin-pack pods to minimize GPU waste", "`consolidationPolicy: WhenUnderutilized`"], ["**Graceful Disruption**", "Respect PDBs during node replacement", "`budgets: nodes: 10%`"], ["**Fast Scaling**", "Provision GPU nodes in under 60 seconds", "Direct EC2 API calls"], ["**Custom AMIs**", "Pre-loaded models and drivers", "`amiSelectorTerms`"]];
  return <ManualTable title={isKo ? 'Karpenter GPU 워크로드 최적화' : 'Karpenter GPU Workload Optimization'} headers={headers} rows={data} />;
};
export default KarpenterGpuOptimization;
