import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const KarpenterGpuOptimization = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["기능", "설명", "설정"] : ["Feature", "Benefit", "Configuration"];
  const data = isKo ? [["인스턴스 타입 자동 선택", "워크로드 요구사항에 맞는 GPU 인스턴스를 선택해 과다 프로비저닝을 줄임", "`instance-family: [g5, g6, p4d, p5]`"], ["Spot + On-Demand 혼합", "Spot 불가 시 On-Demand로 폴백하여 가용성을 높임 (보장은 아님)", "`capacity-type: [spot, on-demand]`"], ["Consolidation", "유휴·저활용 GPU 노드를 bin-pack해 유휴 비용을 회수", "`WhenEmptyOrUnderutilized` 통합 정책"], ["Node Group 없는 프로비저닝", "직접 EC2 API 호출로 노드 생성 (시간 단축은 환경에 따라 다르며 측정 필요)", "`amiSelectorTerms` 등 노드 템플릿 지정"]] : [["Automatic Instance Selection", "Select a GPU instance matching workload requirements, reducing over-provisioning", "`instance-family: [g5, g6, p4d, p5]`"], ["Spot + On-Demand Mix", "Fall back to On-Demand when Spot is unavailable, improving availability (not a guarantee)", "`capacity-type: [spot, on-demand]`"], ["Consolidation", "Bin-pack and clean up idle/underutilized GPU nodes to reclaim idle cost", "`consolidationPolicy: WhenEmptyOrUnderutilized`"], ["Graceful Disruption", "Respect PDBs during node replacement, capping voluntary disruption", "`budgets: nodes: 10%`"], ["Node-Group-less Provisioning", "Create nodes via direct EC2 API calls (time reduction varies by environment; measure it)", "Direct EC2 API calls"], ["Custom AMIs", "Pre-loaded models and drivers", "`amiSelectorTerms`"]];
  return <ManualTable title={isKo ? 'Karpenter GPU 워크로드 최적화' : 'Karpenter GPU Workload Optimization'} headers={headers} rows={data} />;
};
export default KarpenterGpuOptimization;
