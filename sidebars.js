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
        {
          type: 'category',
          label: 'Gateway API Adoption Guide',
          link: {
            type: 'doc',
            id: 'infrastructure-optimization/gateway-api-adoption-guide/index',
          },
          items: [
            'infrastructure-optimization/gateway-api-adoption-guide/gamma-initiative',
            'infrastructure-optimization/gateway-api-adoption-guide/cilium-eni-gateway-api',
            'infrastructure-optimization/gateway-api-adoption-guide/migration-execution-strategy',
          ],
        },
        'infrastructure-optimization/coredns-monitoring-optimization',
        'infrastructure-optimization/east-west-traffic-best-practice',
        'infrastructure-optimization/karpenter-autoscaling',
        'infrastructure-optimization/eks-resource-optimization',
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
        'operations-observability/gitops-cluster-operation',
        'operations-observability/node-monitoring-agent',
        'operations-observability/eks-debugging-guide',
        'operations-observability/eks-resiliency-guide',
        'operations-observability/eks-pod-health-lifecycle',
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
        {
          type: 'category',
          label: '설계 & 아키텍처',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/design-architecture/index',
          },
          items: [
            'agentic-ai-platform/design-architecture/agentic-platform-architecture',
            'agentic-ai-platform/design-architecture/agentic-ai-challenges',
            'agentic-ai-platform/design-architecture/aws-native-agentic-platform',
            'agentic-ai-platform/design-architecture/agentic-ai-solutions-eks',
          ],
        },
        {
          type: 'category',
          label: '모델 서빙 & 추론 인프라',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/model-serving/index',
          },
          items: [
            'agentic-ai-platform/model-serving/eks-gpu-node-strategy',
            'agentic-ai-platform/model-serving/gpu-resource-management',
            'agentic-ai-platform/model-serving/vllm-model-serving',
            'agentic-ai-platform/model-serving/llm-d-eks-automode',
            'agentic-ai-platform/model-serving/moe-model-serving',
            'agentic-ai-platform/model-serving/nvidia-gpu-stack',
            'agentic-ai-platform/model-serving/nemo-framework',
          ],
        },
        {
          type: 'category',
          label: '추론 게이트웨이 & 라우팅',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/gateway-agents/index',
          },
          items: [
            'agentic-ai-platform/gateway-agents/inference-gateway-routing',
            'agentic-ai-platform/gateway-agents/llm-gateway-architecture',
            'agentic-ai-platform/gateway-agents/openclaw-ai-gateway',
          ],
        },
        {
          type: 'category',
          label: '에이전트 & 데이터',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/agent-data/index',
          },
          items: [
            'agentic-ai-platform/agent-data/kagent-kubernetes-agents',
            'agentic-ai-platform/agent-data/milvus-vector-database',
          ],
        },
        {
          type: 'category',
          label: '운영 & MLOps',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/operations-mlops/index',
          },
          items: [
            'agentic-ai-platform/operations-mlops/agent-monitoring',
            'agentic-ai-platform/operations-mlops/ragas-evaluation',
            'agentic-ai-platform/operations-mlops/llmops-observability',
            'agentic-ai-platform/operations-mlops/mlops-pipeline-eks',
            'agentic-ai-platform/operations-mlops/sagemaker-eks-integration',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'AIDLC',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'aidlc/index',
      },
      items: [
        'aidlc/aidlc-framework',
      ],
    },
    {
      type: 'category',
      label: 'AIOps',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'aiops/index',
      },
      items: [
        'aiops/aiops-introduction',
        'aiops/aiops-observability-stack',
        'aiops/aiops-predictive-operations',
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
        'hybrid-infrastructure/hybrid-nodes-adoption-guide',
        'hybrid-infrastructure/sriov-dgx-h200-hybrid',
        'hybrid-infrastructure/hybrid-nodes-file-storage',
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
        'security-governance/identity-first-security',
        'security-governance/guardduty-extended-threat-detection',
        'security-governance/kyverno-policy-management',
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
        'rosa/rosa-demo-installation',
        'rosa/rosa-security-compliance',
      ],
    },
  ],
  benchmarks: [
    {
      type: 'doc',
      id: 'benchmarks/index',
      label: '개요',
    },
    {
      type: 'category',
      label: '네트워킹',
      collapsible: true,
      collapsed: false,
      items: [
        'benchmarks/cni-performance-comparison',
        'benchmarks/gateway-api-benchmark',
      ],
    },
    {
      type: 'category',
      label: 'AI/ML 추론',
      collapsible: true,
      collapsed: false,
      items: [
        'benchmarks/ai-ml-workload',
        'benchmarks/agentcore-vs-eks-inference',
        'benchmarks/dynamo-inference-benchmark',
      ],
    },
    {
      type: 'category',
      label: '인프라 & 운영',
      collapsible: true,
      collapsed: false,
      items: [
        'benchmarks/infrastructure-performance',
        'benchmarks/hybrid-infrastructure',
        'benchmarks/security-operations',
      ],
    },
  ],
};

module.exports = sidebars;
