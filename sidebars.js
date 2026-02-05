/**
 * Creating a sidebar enables you to:
 * - create an ordered group of docs
 * - render a sidebar for each doc of that group
 * - provide next/previous navigation
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Infrastructure Optimization',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'infrastructure-optimization/index',
      },
      items: [
        // 1. 네트워크 기반 구성
        'infrastructure-optimization/cilium-eni-gateway-api',
        // 1-1. NGINX Ingress → Gateway API 마이그레이션
        'infrastructure-optimization/nginx-to-gateway-api-migration',
        // 2. DNS 설정 및 최적화
        'infrastructure-optimization/coredns-monitoring-optimization',
        // 3. 내부 트래픽 최적화
        'infrastructure-optimization/east-west-traffic-best-practice',
        // 4. 오토스케일링 구성
        'infrastructure-optimization/karpenter-autoscaling',
        // 5. 비용 관리 (운영 단계)
        'infrastructure-optimization/cost-management',
      ],
    },
    {
      type: 'category',
      label: 'Operations & Observability',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'operations-observability/index',
      },
      items: [
        // 1. GitOps 기반 클러스터 운영 체계 구축
        'operations-observability/gitops-cluster-operation',
        // 2. 노드 모니터링 에이전트 배포
        'operations-observability/node-monitoring-agent',
      ],
    },
    {
      type: 'category',
      label: 'Agentic AI Platform',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'agentic-ai-platform/index',
      },
      items: [
        // Phase 1: 이해 및 설계
        'agentic-ai-platform/agentic-ai-challenges',
        'agentic-ai-platform/agentic-platform-architecture',
        // Phase 2: GPU 인프라 구성
        'agentic-ai-platform/gpu-resource-management',
        // Phase 3: 모델 서빙 (기본 → 고급)
        'agentic-ai-platform/vllm-model-serving',
        'agentic-ai-platform/ray-serve-vllm-integration',
        'agentic-ai-platform/moe-model-serving',
        'agentic-ai-platform/nemo-framework',
        // Phase 4: 추론 라우팅 및 게이트웨이
        'agentic-ai-platform/inference-gateway-routing',
        // Phase 5: RAG 데이터 레이어
        'agentic-ai-platform/milvus-vector-database',
        // Phase 6: AI 에이전트 배포
        'agentic-ai-platform/kagent-kubernetes-agents',
        // Phase 7: 운영 및 모니터링
        'agentic-ai-platform/agent-monitoring',
        // Phase 8: 평가 및 검증
        'agentic-ai-platform/ragas-evaluation',
      ],
    },
    {
      type: 'category',
      label: 'Hybrid Infrastructure',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'hybrid-infrastructure/index',
      },
      items: [
        // 1. 하이브리드 노드 기본 가이드
        'hybrid-infrastructure/hybrid-nodes-adoption-guide',
        // 2. 고성능 네트워킹 (SR-IOV)
        'hybrid-infrastructure/sriov-dgx-h200-hybrid',
        // 3. 공유 스토리지 구성
        'hybrid-infrastructure/hybrid-nodes-file-storage',
        // 4. 컨테이너 레지스트리 통합
        'hybrid-infrastructure/harbor-hybrid-integration',
      ],
    },
    {
      type: 'category',
      label: 'Security & Governance',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'security-governance/index',
      },
      items: [
        'security-governance/default-namespace-incident',
      ],
    },
    {
      type: 'category',
      label: 'ROSA (OpenShift on AWS)',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'rosa/index',
      },
      items: [
        // 1. 설치 가이드
        'rosa/rosa-demo-installation',
        // 2. 보안 및 접근 제어
        'rosa/rosa-security-compliance',
      ],
    },
  ],
};

module.exports = sidebars;
