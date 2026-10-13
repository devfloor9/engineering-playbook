import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksIntegrationBenefits = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["솔루션", "배포 방법", "EKS 통합 방식"] : ["Solution", "Deployment Method", "EKS Integration"];
  const data = isKo ? [["**Karpenter**", "EKS Auto Mode (자동)", "설치/구성 불필요, 자동 업그레이드"], ["**Kgateway**", "Helm Chart", "ALB Controller 및 ACM 인증서 연동 (별도 구성 필요)"], ["**Bifrost**", "Helm Chart", "Secrets Manager 연동, Pod Identity/IRSA 기반 인증 (별도 구성 필요)"], ["**vLLM**", "Helm Chart", "GPU NodePool로 프로비저닝"], ["**llm-d**", "Helm Chart", "Karpenter 연동 스케일링"], ["**Langfuse**", "Helm Chart", "RDS/Aurora, S3 스토리지 연동 (별도 구성 필요)"], ["**KAgent**", "Helm Chart", "Pod Identity 기반 AWS 서비스 접근"], ["**KEDA**", "Helm Chart", "CloudWatch 등 메트릭 스케일러 연동 (EKS 공식 Capability 아님, 직접 설치)"]] : [["**Karpenter**", "EKS Auto Mode (automatic)", "No install/configuration needed, automatic upgrades"], ["**Kgateway**", "Helm Chart", "Integrates with ALB Controller and ACM certificates (requires separate setup)"], ["**Bifrost**", "Helm Chart", "Integrates with Secrets Manager, Pod Identity/IRSA-based auth (requires separate setup)"], ["**vLLM**", "Helm Chart", "Provisioned via GPU NodePool"], ["**llm-d**", "Helm Chart", "Scaling integrated with Karpenter"], ["**Langfuse**", "Helm Chart", "Integrates with RDS/Aurora and S3 storage (requires separate setup)"], ["**KAgent**", "Helm Chart", "AWS service access via Pod Identity"], ["**KEDA**", "Helm Chart", "Integrates with metric scalers such as CloudWatch (not an official EKS Capability; install it yourself)"]];
  return <ManualTable title={isKo ? 'EKS 통합 방식' : 'EKS Integration Methods'} headers={headers} rows={data} />;
};
export default EksIntegrationBenefits;
