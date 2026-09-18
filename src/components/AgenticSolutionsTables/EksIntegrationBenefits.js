import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksIntegrationBenefits = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["솔루션", "배포 방법", "EKS 통합 이점"] : ["Challenge", "Kubernetes-Based", "EKS Auto Mode + Karpenter", "Expected Effect"];
  const data = isKo ? [["**Karpenter**", "EKS Auto Mode (자동)", "설치/구성 불필요, 자동 업그레이드"], ["**Kgateway**", "Helm Chart", "ALB Controller 연동, ACM 인증서 자동 관리"], ["**Bifrost**", "Helm Chart", "Secrets Manager 연동, IAM 기반 인증"], ["**vLLM**", "Helm Chart", "GPU NodePool 자동 프로비저닝"], ["**llm-d**", "Helm Chart", "Karpenter 연동 자동 스케일링"], ["**Langfuse**", "Helm Chart", "RDS/Aurora 연동, S3 스토리지"], ["**KAgent**", "Helm Chart", "Pod Identity 기반 AWS 서비스 접근"], ["**KEDA**", "EKS Addon", "관리형 설치, CloudWatch 메트릭 연동"]] : [["**GPU Monitoring**", "DCGM + Prometheus", "NodePool-based integrated management", "40% improved resource utilization"], ["**Dynamic Scaling**", "HPA + KEDA", "Just-in-Time provisioning (auto-configured)", "50% reduced provisioning time"], ["**Cost Control**", "Namespace Quota", "Spot + Consolidation (auto-enabled)", "50-70% cost reduction"], ["**FM Fine-tuning**", "Kubeflow Operator", "Training NodePool + EFA", "30% improved training efficiency"]];
  return <ManualTable title={isKo ? 'EKS 통합 이점' : 'EKS Integration Benefits'} headers={headers} rows={data} />;
};
export default EksIntegrationBenefits;
