import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksKarpenterLayers = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["계층", "역할", "제공 가치"] : ["Layer", "Role", "Value Provided"];
  const data = isKo ? [["**Amazon EKS**", "관리형 Kubernetes Control Plane", "운영 부담 제거, 고가용성, 보안"], ["**Karpenter**", "지능형 노드 프로비저닝", "Just-in-Time GPU 프로비저닝, 비용 최적화"], ["**AWS 인프라**", "GPU 인스턴스, 스토리지, 네트워크", "다양한 GPU 옵션, EFA 고속 네트워크, Spot 인스턴스"]] : [["**Amazon EKS**", "Managed Kubernetes control plane", "Removes operational burden, high availability, security"], ["**Karpenter**", "Intelligent node provisioning", "Just-in-time GPU provisioning, cost optimization"], ["**AWS Infrastructure**", "GPU instances, storage, network", "Varied GPU options, EFA high-speed network, Spot instances"]];
  return <ManualTable title={isKo ? 'EKS + Karpenter + AWS 인프라 계층' : 'EKS + Karpenter + AWS Infrastructure Layers'} headers={headers} rows={data} />;
};
export default EksKarpenterLayers;
