import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const TrainingCostOptimization = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["전략", "적용 대상", "예상 절감률", "구현 방법"] : ["Component", "Role", "Automation Scope"];
  const data = isKo ? [["Spot 실험 클러스터", "하이퍼파라미터 튜닝", "60-80%", "별도 NodePool"], ["자동 노드 정리", "학습 완료 후", "20-30%", "Consolidation"], ["체크포인트 기반 재시작", "Spot 중단 대응", "10-20%", "NeMo 체크포인트"], ["시간대별 스케줄링", "비업무 시간 학습", "15-25%", "CronJob + Karpenter"]] : [["**Argo CD**", "GitOps deployment automation", "Application deployment, rollback, sync"], ["**Argo Workflows**", "ML pipeline orchestration", "Training, evaluation, model registration workflows"], ["**KRO**", "Composite resource abstraction", "Manage K8s + AWS resources as a single unit"], ["**ACK**", "Declarative AWS resource management", "S3, RDS, SageMaker, and other AWS services"], ["**Karpenter**", "GPU node provisioning", "Just-in-Time instance provisioning"]];
  return <ManualTable title={isKo ? '학습 워크로드 비용 최적화' : 'Training Workload Cost Optimization'} headers={headers} rows={data} numericColumns={isKo ? [2] : []} />;
};
export default TrainingCostOptimization;
