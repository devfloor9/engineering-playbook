import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const EksCapabilities = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["EKS Capability", "역할", "Agentic AI 활용", "지원 방식"] : ["EKS Capability", "역할", "Agentic AI 활용", "지원 방식"];
  const data = isKo ? [["**ACK (AWS Controllers for Kubernetes)**", "AWS 서비스의 Kubernetes 네이티브 관리", "S3 모델 저장소, RDS 메타데이터, SageMaker 학습 작업", "EKS Add-on"], ["**KRO (Kubernetes Resource Orchestrator)**", "복합 리소스 추상화 및 템플릿화", "AI 추론 스택, 학습 파이프라인 원클릭 배포", "EKS Add-on"], ["**Argo CD**", "GitOps 기반 지속적 배포", "모델 서빙 배포 자동화, 롤백, 환경 동기화", "EKS Add-on"]] : [["**ACK (AWS Controllers for Kubernetes)**", "AWS 서비스의 Kubernetes 네이티브 관리", "S3 모델 저장소, RDS 메타데이터, SageMaker 학습 작업", "EKS Add-on"], ["**KRO (Kubernetes Resource Orchestrator)**", "복합 리소스 추상화 및 템플릿화", "AI 추론 스택, 학습 파이프라인 원클릭 배포", "EKS Add-on"], ["**Argo CD**", "GitOps 기반 지속적 배포", "모델 서빙 배포 자동화, 롤백, 환경 동기화", "EKS Add-on"]];
  return <ManualTable title={isKo ? 'EKS 고급 기능' : 'EKS Advanced Capabilities'} headers={headers} rows={data} />;
};
export default EksCapabilities;
