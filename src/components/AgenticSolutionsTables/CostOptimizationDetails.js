import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const CostOptimizationDetails = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["전략", "구현 방법", "예상 절감률", "적용 워크로드", "위험도"] : ["AWS Service", "ACK Controller", "Agentic AI Usage"];
  const data = isKo ? [["Spot 인스턴스", "Karpenter NodePool", "60-90%", "추론, 배치 처리", "중간 (중단 가능)"], ["Consolidation", "Karpenter disruption", "20-30%", "모든 워크로드", "낮음"], ["Right-sizing", "Karpenter 인스턴스 자동 선택", "15-25%", "모든 워크로드", "낮음"], ["스케줄 기반", "Karpenter budgets", "30-40%", "비업무 시간", "낮음"], ["복합 적용", "위 전략 조합", "50-70%", "전체", "중간"]] : [["**S3**", "`s3.services.k8s.aws`", "Model artifact storage, training data buckets"], ["**RDS/Aurora**", "`rds.services.k8s.aws`", "Langfuse backend, metadata storage"], ["**SageMaker**", "`sagemaker.services.k8s.aws`", "Model training jobs, endpoint deployment"], ["**Secrets Manager**", "`secretsmanager.services.k8s.aws`", "API keys, model credentials management"], ["**ECR**", "`ecr.services.k8s.aws`", "Container image registry"]];
  return <ManualTable title={isKo ? '비용 최적화 전략 상세' : 'Cost Optimization Strategies Details'} headers={headers} rows={data} numericColumns={isKo ? [2] : []} />;
};
export default CostOptimizationDetails;
