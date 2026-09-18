import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const AutomationComponents = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["구성요소", "역할", "자동화 범위"] : ["구성요소", "역할", "자동화 범위"];
  const data = isKo ? [["**Argo CD**", "GitOps 배포 자동화", "애플리케이션 배포, 롤백, 동기화"], ["**Argo Workflows**", "ML 파이프라인 오케스트레이션", "학습, 평가, 모델 등록 워크플로"], ["**KRO**", "복합 리소스 추상화", "K8s + AWS 리소스를 단일 단위로 관리"], ["**ACK**", "AWS 리소스 선언적 관리", "S3, RDS, SageMaker 등 AWS 서비스"], ["**Karpenter**", "GPU 노드 프로비저닝", "Just-in-Time 인스턴스 프로비저닝"]] : [["**Argo CD**", "GitOps 배포 자동화", "애플리케이션 배포, 롤백, 동기화"], ["**Argo Workflows**", "ML 파이프라인 오케스트레이션", "학습, 평가, 모델 등록 워크플로"], ["**KRO**", "복합 리소스 추상화", "K8s + AWS 리소스를 단일 단위로 관리"], ["**ACK**", "AWS 리소스 선언적 관리", "S3, RDS, SageMaker 등 AWS 서비스"], ["**Karpenter**", "GPU 노드 프로비저닝", "Just-in-Time 인스턴스 프로비저닝"]];
  return <ManualTable title={isKo ? '자동화 구성요소' : 'Automation Components'} headers={headers} rows={data} />;
};
export default AutomationComponents;
