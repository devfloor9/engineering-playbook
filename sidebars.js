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
        id: 'performance-networking/index',
      },
      items: [
        'performance-networking/karpenter-autoscaling',
        'performance-networking/fast-scaling-architecture',
        'performance-networking/cilium-eni-gateway-api',
        'performance-networking/east-west-traffic-best-practice',
        'performance-networking/coredns-monitoring-optimization',
        'performance-networking/cost-management',
      ],
    },
    {
      type: 'category',
      label: 'Operations & Observability',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'observability-monitoring/index',
      },
      items: [
        'observability-monitoring/node-monitoring-agent',
        'observability-monitoring/gitops-cluster-operation',
      ],
    },
    {
      type: 'category',
      label: 'Agentic AI Platform',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'genai-aiml/index',
      },
      items: [
        'genai-aiml/genai-platform',
        'genai-aiml/agentic-ai-challenges',
        'genai-aiml/agentic-platform-architecture',
        'genai-aiml/gpu-resource-management',
        'genai-aiml/inference-gateway-routing',
        'genai-aiml/moe-model-serving',
        'genai-aiml/nemo-framework',
        'genai-aiml/agent-monitoring',
        'genai-aiml/kagent-kubernetes-agents',
        'genai-aiml/milvus-vector-database',
        'genai-aiml/ragas-evaluation',
        'genai-aiml/operations-troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Hybrid Infrastructure',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'hybrid-multicloud/index',
      },
      items: [
        'hybrid-multicloud/hybrid-nodes-adoption-guide',
        'hybrid-multicloud/hybrid-node-configuration',
        'hybrid-multicloud/sriov-dgx-h200-hybrid',
        'hybrid-multicloud/hybrid-nodes-file-storage',
        'hybrid-multicloud/harbor-hybrid-integration',
        'hybrid-multicloud/eks-dra-hybrid-nodes',
      ],
    },
    {
      type: 'category',
      label: 'Security & Governance',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'security-compliance/index',
      },
      items: [
        'security-compliance/default-namespace-incident',
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
        'rosa/rosa-security-compliance',
        'rosa/rosa-demo-installation',
      ],
    },
  ],
};

module.exports = sidebars;
