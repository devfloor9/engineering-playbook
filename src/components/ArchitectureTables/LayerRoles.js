import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
const LayerRoles = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  // 요청은 위에서 아래로(L6→L1) 흐르고, 빌드는 아래에서 위로(L1→L6) 쌓인다.
  // 표는 최상단 L6부터 최하단 L1 순서로 표시한다.
  // 요청은 위에서 아래로(L6→L1) 흐르고, 빌드는 아래에서 위로(L1→L6) 쌓인다.
  // 표는 최상단 L6부터 최하단 L1 순서로 표시한다.
  const layers = [{
    layer: isKo ? 'Layer 6: Experience & Channels' : 'Layer 6: Experience & Channels',
    role: isKo ? '사용자·시스템 진입점, 멀티 채널 노출' : 'User/system entry points, multi-channel exposure',
    components: isKo ? 'API · gRPC, Agent SDK, Web UI, 채널 연동' : 'API · gRPC, Agent SDK, Web UI, Channel Connectors'
  }, {
    layer: isKo ? 'Layer 5: Gateway & Routing' : 'Layer 5: Gateway & Routing',
    role: isKo ? '인증, 지능형 추론 라우팅, 비용 가드레일' : 'Auth, intelligent inference routing, cost guardrails',
    components: isKo ? '2-Tier Gateway, Cascade Router, KV Cache-aware 라우팅, Rate Limit' : '2-Tier Gateway, Cascade Router, KV Cache-aware Routing, Rate Limit'
  }, {
    layer: isKo ? 'Layer 4: Agent Runtime & Orchestration' : 'Layer 4: Agent Runtime & Orchestration',
    role: isKo ? 'Agent 실행 루프, 메모리, 도구·멀티에이전트 협업' : 'Agent loops, memory, tool & multi-agent collaboration',
    components: isKo ? 'Agent Runtime, Tool Registry (MCP), A2A, State Store' : 'Agent Runtime, Tool Registry (MCP), A2A, State Store'
  }, {
    layer: isKo ? 'Layer 3: Data, Knowledge & Memory' : 'Layer 3: Data, Knowledge & Memory',
    role: isKo ? 'RAG 검색, 지식 그래프, 세션·장기 메모리' : 'RAG retrieval, knowledge graph, session/long-term memory',
    components: isKo ? 'Vector DB, Knowledge/Feature Store, Cache, Object Storage' : 'Vector DB, Knowledge/Feature Store, Cache, Object Storage'
  }, {
    layer: isKo ? 'Layer 2: Model Serving & Inference' : 'Layer 2: Model Serving & Inference',
    role: isKo ? 'LLM·비-LLM 추론 엔진, 분산 추론, 모델 레지스트리' : 'LLM/non-LLM inference engines, distributed serving, model registry',
    components: isKo ? 'vLLM, llm-d, Triton, Model Registry' : 'vLLM, llm-d, Triton, Model Registry'
  }, {
    layer: isKo ? 'Layer 1: AI Infrastructure' : 'Layer 1: AI Infrastructure',
    role: isKo ? '가속 컴퓨팅, GPU 오케스트레이션·모니터링·성능 최적화' : 'Accelerated compute, GPU orchestration, monitoring & perf optimization',
    components: isKo ? 'GPU · Trainium · Inferentia, Karpenter · Kueue · DRA, MIG, DCGM · Neuron Monitor, EFA' : 'GPU · Trainium · Inferentia, Karpenter · Kueue · DRA, MIG, DCGM · Neuron Monitor, EFA'
  }];
  const planes = [{
    plane: isKo ? '관측성 & 평가' : 'Observability & Evaluation',
    role: isKo ? '트레이싱, 메트릭, 비용 추적, 품질 평가, 드리프트 감지' : 'Tracing, metrics, cost tracking, quality eval, drift detection',
    components: isKo ? 'Langfuse, OpenTelemetry, RAGAS, Cost Tracking, Drift Detection' : 'Langfuse, OpenTelemetry, RAGAS, Cost Tracking, Drift Detection'
  }, {
    plane: isKo ? '거버넌스 · 안전 · 주권' : 'Governance, Safety & Sovereignty',
    role: isKo ? 'Guardrails, 정책·RBAC, 컴플라이언스, 데이터 주권·리전 강제' : 'Guardrails, policy/RBAC, compliance, data sovereignty & region enforcement',
    components: isKo ? 'NeMo Guardrails, OIDC/RBAC, SCP 리전 강제, ISMS-P · SOC2' : 'NeMo Guardrails, OIDC/RBAC, SCP Region Enforcement, ISMS-P · SOC2'
  }, {
    plane: isKo ? '모델 라이프사이클 (FMOps)' : 'Model Lifecycle (FMOps)',
    role: isKo ? '학습·파인튜닝, 평가 게이트, 지속 학습(CT), 피드백 루프' : 'Training/fine-tuning, eval gates, continuous training, feedback loop',
    components: isKo ? 'Training Pipeline, CT Scheduler, Eval Harness, Feedback Loop' : 'Training Pipeline, CT Scheduler, Eval Harness, Feedback Loop'
  }];
  const headerLabels = {
    layer: isKo ? '레이어' : 'Layer',
    plane: isKo ? '플레인' : 'Plane',
    role: isKo ? '역할' : 'Role',
    components: isKo ? '주요 컴포넌트' : 'Key Components'
  };
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "런타임 레이어 (6) — 요청 경로" : "Runtime Layers (6) — Request Path"} headers={[headerLabels.layer, headerLabels.role, headerLabels.components]} rows={layers.map(row => [row.layer, row.role, row.components])} /><ManualTable title={isKo ? "횡단 플레인 (3) — 전 레이어 관통" : "Cross-cutting Planes (3) — Span All Layers"} headers={[headerLabels.plane, headerLabels.role, headerLabels.components]} rows={planes.map(row => [row.plane, row.role, row.components])} /></div>;
};
export default LayerRoles;
