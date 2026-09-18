import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const ClusterAutoscalerVsKarpenter = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["비교 항목", "Cluster Autoscaler", "Karpenter"] : ["Feature", "Benefit for Agentic AI"];
  const data = isKo ? [["**프로비저닝 시간**", "5-10분", "2-3분"], ["**인스턴스 선택**", "Node Group 내 고정 타입", "워크로드 기반 동적 선택"], ["**GPU 지원**", "수동 Node Group 구성", "NodePool 자동 매칭"], ["**비용 최적화**", "제한적", "Spot, Consolidation 자동"]] : [["**Zero-touch Nodes**", "No manual AMI updates or node group management"], ["**Automatic Scaling**", "Built-in autoscaling without Karpenter configuration"], ["**Security Patching**", "Automatic OS and Kubernetes security updates"], ["**Storage Automation**", "Dynamic PV provisioning for model caching and vector stores"], ["**Network Policies**", "Integrated network security for multi-tenant agents"]];
  return <ManualTable title={isKo ? 'Cluster Autoscaler vs Karpenter 비교' : 'Cluster Autoscaler vs Karpenter Comparison'} headers={headers} rows={data} numericRows={isKo ? [0] : []} />;
};
export default ClusterAutoscalerVsKarpenter;
