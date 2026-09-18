import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const SecurityLayers = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["보안 계층", "구현 방법", "보호 대상"] : ["EKS Capability", "Role", "Agentic AI Usage", "Support Method"];
  const data = isKo ? [["**Pod Security**", "Pod Security Standards, ResourceQuota", "권한 상승, 리소스 남용 방지"], ["**Network Security**", "NetworkPolicy, Security Groups for Pods", "측면 이동, 무단 접근 차단"], ["**Data Security**", "S3 Bucket Policy, KMS 암호화", "모델 아티팩트 보호"], ["**Identity Security**", "Pod Identity, IAM 최소 권한", "AWS 리소스 무단 접근 방지"], ["**Isolation**", "MIG, Namespace 격리", "멀티 테넌트 워크로드 격리"]] : [["**ACK (AWS Controllers for Kubernetes)**", "Kubernetes-native management of AWS services", "S3 model storage, RDS metadata, SageMaker training jobs", "EKS Add-on"], ["**KRO (Kubernetes Resource Orchestrator)**", "Composite resource abstraction and templating", "One-click deployment of AI inference stacks, training pipelines", "EKS Add-on"], ["**Argo CD**", "GitOps-based continuous deployment", "Model serving deployment automation, rollback, environment sync", "EKS Add-on"]];
  return <ManualTable title={isKo ? '보안 계층별 구현' : 'Security Implementation by Layer'} headers={headers} rows={data} />;
};
export default SecurityLayers;
