import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const PlatformComparisonMatrix = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    axis: isKo ? '비용 구조' : 'Cost Structure',
    bedrock: isKo ? '사용량 과금, GPU 관리 불필요' : 'Usage-based pricing, no GPU management',
    sagemaker: isKo ? '인스턴스+사용량 혼합, 노트북/학습 별도' : 'Instance+usage hybrid, notebook/training separate',
    eks: isKo ? 'Spot/MIG 최적화, 초기 투자 필요' : 'Spot/MIG optimization, upfront investment needed',
    hybrid: isKo ? 'API 사용량 + SLM 고정비, 라우팅 효과 실측' : 'API usage + SLM fixed cost; measure routing effects'
  }, {
    axis: isKo ? '운영 부담' : 'Operational Burden',
    bedrock: isKo ? '최소 — AWS 완전 관리' : 'Minimal — AWS fully managed',
    sagemaker: isKo ? '낮음 — 인프라 관리 최소, ML 워크플로우 집중' : 'Low — minimal infra management, focus on ML workflows',
    eks: isKo ? '중간 — K8s/GPU 운영 역량 필요 (Auto Mode로 절감)' : 'Medium — K8s/GPU ops capability needed (reduced with Auto Mode)',
    hybrid: isKo ? '중간 — 두 환경 모두 이해 필요' : 'Medium — understanding of both environments required'
  }, {
    axis: isKo ? '데이터 주권' : 'Data Sovereignty',
    bedrock: isKo ? 'AWS 리전 내 처리' : 'Processed within AWS region',
    sagemaker: isKo ? 'VPC 격리, 학습 데이터 S3 내 유지' : 'VPC isolation, training data stays in S3',
    eks: isKo ? '완전 제어 — VPC 내 모델+데이터 격리' : 'Full control — model+data isolation within VPC',
    hybrid: isKo ? '워크로드별 선택적 격리' : 'Selective isolation per workload'
  }, {
    axis: isKo ? '커스터마이징' : 'Customization',
    bedrock: isKo ? '제한적 — Bedrock 지원 모델, Guardrails 범위 내' : 'Limited — Bedrock-supported models, within Guardrails scope',
    sagemaker: isKo ? 'MLflow, 커스텀 파이프라인, Fine-tuning 지원' : 'MLflow, custom pipelines, fine-tuning support',
    eks: isKo ? '완전 유연 — 모든 오픈 모델, LoRA, 커스텀 게이트웨이' : 'Fully flexible — all open models, LoRA, custom gateway',
    hybrid: isKo ? '필요에 따라 선택적 확장' : 'Selective expansion as needed'
  }, {
    axis: isKo ? 'Time-to-Value' : 'Time-to-Value',
    bedrock: isKo ? 'API 연결·권한·품질 평가' : 'API integration, permissions, and quality evaluation',
    sagemaker: isKo ? '환경·데이터 접근·파이프라인 구성' : 'Environment, data access, and pipeline setup',
    eks: isKo ? '클러스터·GPU·모델 서빙 및 운영 준비' : 'Cluster, GPU, serving, and operating readiness',
    hybrid: isKo ? '두 경로의 연동·품질·전환 검증' : 'Integration, quality, and transition across both paths'
  }];
  return <ManualTable title={isKo ? 'AI 플랫폼 5축 비교 매트릭스' : 'AI Platform 5-Axis Comparison Matrix'} headers={[isKo ? '평가축' : 'Evaluation Axis', "Bedrock + AgentCore", "SageMaker Unified Studio", isKo ? 'EKS+오픈소스' : 'EKS+Open Source', isKo ? '하이브리드' : 'Hybrid']} rows={data.map(row => [row.axis, row.bedrock, row.sagemaker, row.eks, row.hybrid])} />;
};
export default PlatformComparisonMatrix;
