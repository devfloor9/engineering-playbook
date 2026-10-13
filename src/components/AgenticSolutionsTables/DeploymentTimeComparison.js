import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const DeploymentTimeComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["이점", "설명"] : ["Benefit", "Description"];
  const data = isKo ? [["**즉시 시작 가능**", "Karpenter 설치/구성 없이 클러스터 생성 직후 GPU 워크로드 배포"], ["**자동 업그레이드**", "Karpenter, CNI, CSI 등 핵심 컴포넌트 자동 업데이트"], ["**보안 패치 자동화**", "보안 취약점 패치 자동 적용"], ["**커스텀 확장 가능**", "GPU NodePool, EFA NodeClass 등 필요 시 커스텀 설정 추가"]] : [["**Immediate Start**", "Deploy GPU workloads immediately after cluster creation without Karpenter installation/configuration"], ["**Automatic Upgrades**", "Automatic updates for core components like Karpenter, CNI, CSI"], ["**Automated Security Patching**", "Automatic application of security vulnerability patches"], ["**Extensible with Custom Configuration**", "Add custom settings like GPU NodePool, EFA NodeClass when needed"]];
  return <ManualTable title={isKo ? 'EKS 기반 배포의 이점' : 'EKS-based Deployment Benefits'} headers={headers} rows={data} />;
};
export default DeploymentTimeComparison;
