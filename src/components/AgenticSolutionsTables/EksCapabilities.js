import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksCapabilities = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["EKS Capability", "역할", "Agentic AI 활용", "제공 방식"] : ["EKS Capability", "Role", "Agentic AI Use", "Delivery"];
  const data = isKo ? [["**ACK (AWS Controllers for Kubernetes)**", "AWS 서비스의 Kubernetes 네이티브 관리", "S3 모델 저장소, RDS 메타데이터, SageMaker 학습 작업", "관리형 EKS Capability"], ["**kro (Kube Resource Orchestrator)**", "복합 리소스 추상화 및 템플릿화", "AI 추론 스택, 학습 파이프라인 원클릭 배포", "관리형 EKS Capability"], ["**Argo CD**", "GitOps 기반 지속적 배포", "모델 서빙 배포 자동화, 롤백, 환경 동기화", "관리형 EKS Capability"]] : [["**ACK (AWS Controllers for Kubernetes)**", "Kubernetes-native management of AWS services", "S3 model repository, RDS metadata, SageMaker training jobs", "Managed EKS Capability"], ["**kro (Kube Resource Orchestrator)**", "Composite resource abstraction and templating", "One-click deployment of AI inference stacks and training pipelines", "Managed EKS Capability"], ["**Argo CD**", "GitOps-based continuous deployment", "Model serving deployment automation, rollback, environment sync", "Managed EKS Capability"]];
  return <ManualTable title={isKo ? 'EKS 고급 기능' : 'EKS Advanced Capabilities'} headers={headers} rows={data} />;
};
export default EksCapabilities;
