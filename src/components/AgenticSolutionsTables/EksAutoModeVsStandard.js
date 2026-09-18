import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksAutoModeVsStandard = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구성 요소", "수동 구성 (EKS Standard)", "EKS Auto Mode"] : ["Your Situation", "Recommendation"];
  const data = isKo ? [["**Karpenter 설치**", "Helm 차트 수동 설치, IAM 역할 구성", "✅ 자동 설치 및 구성"], ["**NodePool 관리**", "직접 정의 필요", "기본 제공 + 커스텀 가능"], ["**VPC CNI**", "수동 설치 및 업그레이드", "✅ 자동 관리"], ["**EBS CSI Driver**", "수동 설치, IRSA 구성", "✅ 자동 관리"], ["**CoreDNS**", "수동 스케일링", "✅ 자동 스케일링"], ["**보안 패치**", "수동 적용", "✅ 자동 적용"], ["**버전 업그레이드**", "수동 계획 및 실행", "✅ 자동 업그레이드"]] : [["New EKS cluster for Agentic AI", "**Karpenter** (native AWS integration)"], ["Existing cluster with CA", "**Migrate to Karpenter** (worth the effort)"], ["Need GPU autoscaling", "**Karpenter** (required for GPU efficiency)"], ["Simple CPU-only workloads", "**EKS Auto Mode** (easiest option)"], ["Multi-tenant platform", "**Karpenter** (better isolation and cost attribution)"], ["Regulated industries", "**EKS Auto Mode** (compliance-friendly)"]];
  return <ManualTable title={isKo ? 'EKS Auto Mode vs 수동 구성' : 'EKS Auto Mode vs Manual Configuration'} headers={headers} rows={data} />;
};
export default EksAutoModeVsStandard;
