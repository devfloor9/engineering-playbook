import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const DeploymentTimeComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구축 방식", "소요 시간", "운영 복잡도", "비용 효율성"] : ["Benefit", "Description"];
  const data = isKo ? [["**전통적 방식**", "6-11주", "높음", "낮음"], ["**EKS 기반**", "1-2주", "낮음", "높음"]] : [["**Immediate Start**", "Deploy GPU workloads immediately after cluster creation without Karpenter installation/configuration"], ["**Automatic Upgrades**", "Automatic updates for core components like Karpenter, CNI, CSI"], ["**Automated Security Patching**", "Automatic application of security vulnerability patches"], ["**Extensible with Custom Configuration**", "Add custom settings like GPU NodePool, EFA NodeClass when needed"]];
  return <ManualTable title={isKo ? '구축 방식별 소요 시간' : 'Deployment Time Comparison'} headers={headers} rows={data} numericColumns={isKo ? [1] : []} />;
};
export default DeploymentTimeComparison;
