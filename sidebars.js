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
        // 1. Gateway API 도입 가이드 (네트워크 기반 구성)
        'infrastructure-optimization/gateway-api-adoption-guide',
        // 2. DNS 설정 및 최적화
        'infrastructure-optimization/coredns-monitoring-optimization',
        // 3. 내부 트래픽 최적화
        'infrastructure-optimization/east-west-traffic-best-practice',
        // 4. 오토스케일링 구성
        'infrastructure-optimization/karpenter-autoscaling',
        // 5. Pod 리소스 최적화
        'infrastructure-optimization/eks-resource-optimization',
        // 6. 비용 관리 (운영 단계)
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
        // 3. EKS 장애 진단 및 대응 가이드
        'operations-observability/eks-debugging-guide',
        // 4. EKS 고가용성 아키텍처 가이드
        'operations-observability/eks-resiliency-guide',
        // 5. Pod 헬스체크 & 라이프사이클
        'operations-observability/eks-pod-health-lifecycle',
        // 6. Pod 스케줄링 & 가용성
        'operations-observability/eks-pod-scheduling-availability',
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
        // 이해 및 설계
        'agentic-ai-platform/agentic-ai-challenges',              // 1. 기술적 도전과제
        'agentic-ai-platform/agentic-ai-solutions-eks',           // 2. EKS 기반 해결방안
        'agentic-ai-platform/agentic-platform-architecture',      // 3. 플랫폼 아키텍처
        // GPU 인프라 구성
        'agentic-ai-platform/gpu-resource-management',            // 4. GPU 리소스 관리
        // 모델 서빙 (기본 → 고급)
        'agentic-ai-platform/vllm-model-serving',                 // 5. vLLM 모델 서빙
        'agentic-ai-platform/moe-model-serving',                  // 6. MoE 모델 서빙
        'agentic-ai-platform/llm-d-eks-automode',                 // 7. llm-d EKS Auto Mode
        'agentic-ai-platform/nemo-framework',                     // 8. NeMo 프레임워크
        // 추론 라우팅 및 게이트웨이
        'agentic-ai-platform/inference-gateway-routing',          // 9. Inference Gateway
        // RAG 데이터 레이어
        'agentic-ai-platform/milvus-vector-database',             // 10. Milvus 벡터 DB
        // AI 에이전트 배포
        'agentic-ai-platform/kagent-kubernetes-agents',           // 11. Kagent Agent 관리
        // 운영 및 모니터링
        'agentic-ai-platform/agent-monitoring',                   // 12. Agent 모니터링 & 운영
        // 평가 및 검증
        'agentic-ai-platform/ragas-evaluation',                   // 13. Ragas 평가
        // Bedrock AgentCore 통합
        'agentic-ai-platform/bedrock-agentcore-mcp',              // 14. Bedrock AgentCore & MCP
        // MLOps 파이프라인
        'agentic-ai-platform/mlops-pipeline-eks',                 // 15. MLOps 파이프라인
        'agentic-ai-platform/sagemaker-eks-integration',          // 16. SageMaker-EKS 통합
      ],
    },
    {
      type: 'category',
      label: 'AIops & AIDLC',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'aiops-aidlc/index',
      },
      items: [
        'aiops-aidlc/aiops-introduction',
        'aiops-aidlc/aiops-observability-stack',
        'aiops-aidlc/aidlc-framework',
        'aiops-aidlc/aiops-predictive-operations',
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
        // 2. Identity-First Security
        'security-governance/identity-first-security',
        // 3. GuardDuty Extended Threat Detection
        'security-governance/guardduty-extended-threat-detection',
        // 4. Kyverno 정책 관리
        'security-governance/kyverno-policy-management',
        // 5. 공급망 보안
        'security-governance/supply-chain-security',
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

  // Benchmark Reports — 별도 사이드바로 분리
  benchmarks: [
    {
      type: 'category',
      label: 'Benchmark Reports',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'benchmarks/index',
      },
      items: [
        'benchmarks/infrastructure-performance',
        'benchmarks/cni-performance-comparison',
        'benchmarks/gateway-api-benchmark',
        'benchmarks/ai-ml-workload',
        'benchmarks/hybrid-infrastructure',
        'benchmarks/security-operations',
      ],
    },
  ],
};

module.exports = sidebars;
