import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksKarpenterLayers = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["계층", "역할", "제공 가치"] : ["Aspect", "Traditional Cluster Autoscaler", "Karpenter on EKS"];
  const data = isKo ? [["**Amazon EKS**", "관리형 Kubernetes Control Plane", "운영 부담 제거, 고가용성, 보안"], ["**Karpenter**", "지능형 노드 프로비저닝", "Just-in-Time GPU 프로비저닝, 비용 최적화"], ["**AWS 인프라**", "GPU 인스턴스, 스토리지, 네트워크", "다양한 GPU 옵션, EFA 고속 네트워크, Spot 인스턴스"]] : [["**Scaling Speed**", "60-90 seconds (ASG-based)", "10-30 seconds (direct EC2 API)"], ["**Instance Selection**", "Limited by ASG pre-configuration", "Dynamic selection from 600+ EC2 types"], ["**GPU Workloads**", "Requires separate ASGs per GPU type", "Single NodePool handles all GPU types"], ["**Spot Optimization**", "Manual fallback configuration", "Automatic spot-to-on-demand fallback"], ["**Cost Efficiency**", "Limited consolidation", "Aggressive bin-packing and consolidation"], ["**AWS Integration**", "Indirect via ASG", "Direct EC2/Spot API calls"], ["**Configuration**", "ASG + IAM + Launch Templates", "Simple NodePool CRD"]];
  return <ManualTable title={isKo ? 'EKS + Karpenter + AWS 인프라 계층' : 'EKS + Karpenter + AWS Infrastructure Layers'} headers={headers} rows={data} numericRows={isKo ? [] : [0]} />;
};
export default EksKarpenterLayers;
