import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const ChallengeSolutionsSummary = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["도전과제", "Kubernetes 기반", "EKS Auto Mode + Karpenter", "기대 효과"] : ["도전과제", "Kubernetes 기반", "EKS Auto Mode + Karpenter", "기대 효과"];
  const data = isKo ? [["**GPU 리소스 관리**", "DCGM + Prometheus", "NodePool 기반 통합 관리 + MIG", "리소스 활용률 40% 향상"], ["**추론 라우팅**", "kgateway + Bifrost", "llm-d KV Cache-aware 라우팅", "프로비저닝 시간 50% 단축"], ["**LLMOps 관찰성**", "LangSmith (Dev) + Langfuse (Prod)", "Spot + Consolidation (자동 활성화)", "비용 50-70% 절감"], ["**Agent 오케스트레이션**", "LangGraph + NeMo Guardrails", "Agent Pod 자동 스케일링", "안전성 및 확장성 확보"], ["**모델 공급망**", "MLflow + Kubeflow + ArgoCD", "Training NodePool + EFA", "학습 효율성 30% 향상"]] : [["**GPU Resource Mgmt**", "DCGM + Prometheus", "NodePool + MIG", "40% utilization improvement"], ["**Inference Routing**", "kgateway + Bifrost", "llm-d KV Cache-aware routing", "50% faster provisioning"], ["**LLMOps Observability**", "LangSmith (Dev) + Langfuse (Prod)", "Spot + Consolidation", "50-70% cost reduction"], ["**Agent Orchestration**", "LangGraph + NeMo Guardrails", "Agent Pod auto-scaling", "Safety & scalability"], ["**Model Supply Chain**", "MLflow + Kubeflow + ArgoCD", "Training NodePool + EFA", "30% training efficiency"]];
  return <ManualTable title={isKo ? '도전과제별 솔루션 요약' : 'Challenge Solutions Summary'} headers={headers} rows={data} />;
};
export default ChallengeSolutionsSummary;
