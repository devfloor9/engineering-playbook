// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'EKS Best Practices',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'eks-best-practices/index',
      },
      items: [
        {
          type: 'category',
          label: '네트워크 & 성능',
          link: {
            type: 'doc',
            id: 'eks-best-practices/networking-performance/index',
          },
          items: [
            {
              type: 'category',
              label: 'Gateway API Adoption Guide',
              link: {
                type: 'doc',
                id: 'eks-best-practices/networking-performance/gateway-api-adoption-guide/index',
              },
              items: [
                'eks-best-practices/networking-performance/gateway-api-adoption-guide/gamma-initiative',
                'eks-best-practices/networking-performance/gateway-api-adoption-guide/cilium-eni-gateway-api',
                'eks-best-practices/networking-performance/gateway-api-adoption-guide/migration-execution-strategy',
              ],
            },
            'eks-best-practices/networking-performance/coredns-monitoring-optimization',
            'eks-best-practices/networking-performance/east-west-traffic-best-practice',
          ],
        },
        {
          type: 'category',
          label: 'Control Plane & 확장',
          link: {
            type: 'doc',
            id: 'eks-best-practices/control-plane-scaling/index',
          },
          items: [
            'eks-best-practices/control-plane-scaling/eks-control-plane-crd-scaling',
            'eks-best-practices/control-plane-scaling/cross-cluster-object-replication',
          ],
        },
        {
          type: 'category',
          label: '보안 & 인증',
          link: {
            type: 'doc',
            id: 'eks-best-practices/security-authn/index',
          },
          items: [
            'eks-best-practices/security-authn/eks-api-server-authn-authz',
          ],
        },
        {
          type: 'category',
          label: '리소스 & 비용',
          link: {
            type: 'doc',
            id: 'eks-best-practices/resource-cost/index',
          },
          items: [
            'eks-best-practices/resource-cost/karpenter-autoscaling',
            'eks-best-practices/resource-cost/eks-resource-optimization',
            'eks-best-practices/resource-cost/cost-management',
          ],
        },
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
        {
          type: 'category',
          label: 'AgenticOps',
          link: {
            type: 'doc',
            id: 'operations-observability/agentic-ops/index',
          },
          items: [
            'operations-observability/agentic-ops/aiops-introduction',
            'operations-observability/agentic-ops/aiops-observability-stack',
            'operations-observability/agentic-ops/aiops-predictive-operations',
          ],
        },
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
