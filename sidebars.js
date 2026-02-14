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
        'agentic-ai-platform/agentic-ai-challenges',
        'agentic-ai-platform/agentic-ai-solutions-eks',
        'agentic-ai-platform/agentic-platform-architecture',
        'agentic-ai-platform/gpu-resource-management',
        'agentic-ai-platform/vllm-model-serving',
        'agentic-ai-platform/moe-model-serving',
        'agentic-ai-platform/llm-d-eks-automode',
        'agentic-ai-platform/nemo-framework',
        'agentic-ai-platform/inference-gateway-routing',
        'agentic-ai-platform/milvus-vector-database',
        'agentic-ai-platform/kagent-kubernetes-agents',
        'agentic-ai-platform/agent-monitoring',
        'agentic-ai-platform/ragas-evaluation',
        'agentic-ai-platform/bedrock-agentcore-mcp',
        'agentic-ai-platform/mlops-pipeline-eks',
        'agentic-ai-platform/sagemaker-eks-integration',
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
