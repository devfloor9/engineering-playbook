import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const ChallengeSolutionsSummary = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["도전과제", "Kubernetes 기반", "EKS Auto Mode + Karpenter", "역할"] : ["Challenge", "Kubernetes-Based", "EKS Auto Mode + Karpenter", "Role"];
  const data = isKo ? [["**GPU 리소스 관리**", "DCGM + Prometheus", "NodePool 기반 통합 관리 + MIG", "GPU 가시성 확보 및 파티셔닝 (활용률 개선은 워크로드별 측정)"], ["**추론 라우팅**", "kgateway + Bifrost", "llm-d KV Cache-aware 라우팅", "prefix cache 재사용으로 라우팅 효율 개선"], ["**LLMOps 관찰성**", "LangSmith (Dev) + Langfuse (Prod)", "트레이싱 + 토큰 비용 추적", "운영 가시성 (비용 절감은 Spot/Consolidation 적용 결과로 측정)"], ["**Agent 오케스트레이션**", "LangGraph + NeMo Guardrails", "Agent Pod 스케일링 + 콘텐츠 가드레일", "워크플로우 제어 및 방어 심층화"], ["**모델 공급망**", "MLflow + Kubeflow + ArgoCD", "Training NodePool + EFA", "학습 인프라 자동화 (효율은 워크로드별 측정)"]] : [["**GPU Resource Mgmt**", "DCGM + Prometheus", "NodePool-based management + MIG", "GPU visibility and partitioning (utilization gains measured per workload)"], ["**Inference Routing**", "kgateway + Bifrost", "llm-d KV Cache-aware routing", "Improves routing efficiency via prefix cache reuse"], ["**LLMOps Observability**", "LangSmith (Dev) + Langfuse (Prod)", "Tracing + token cost tracking", "Operational visibility (cost reduction measured from Spot/Consolidation)"], ["**Agent Orchestration**", "LangGraph + NeMo Guardrails", "Agent Pod scaling + content guardrails", "Workflow control and defense-in-depth"], ["**Model Supply Chain**", "MLflow + Kubeflow + ArgoCD", "Training NodePool + EFA", "Training infrastructure automation (efficiency measured per workload)"]];
  return <ManualTable title={isKo ? '도전과제별 솔루션 요약' : 'Challenge Solutions Summary'} headers={headers} rows={data} />;
};
export default ChallengeSolutionsSummary;
