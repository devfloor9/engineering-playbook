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
            'eks-best-practices/control-plane-scaling/eks-pcp-tier-sizing-validation',
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
        {
          type: 'category',
          label: '운영 & 안정성',
          link: {
            type: 'doc',
            id: 'eks-best-practices/operations-reliability/index',
          },
          items: [
            'eks-best-practices/operations-reliability/gitops-cluster-operation',
            'eks-best-practices/operations-reliability/node-monitoring-agent',
            {
              type: 'category',
              label: 'EKS 디버깅',
              link: {
                type: 'doc',
                id: 'eks-best-practices/operations-reliability/eks-debugging/index',
              },
              items: [
                'eks-best-practices/operations-reliability/eks-debugging/control-plane',
                'eks-best-practices/operations-reliability/eks-debugging/node',
                'eks-best-practices/operations-reliability/eks-debugging/workload',
                'eks-best-practices/operations-reliability/eks-debugging/networking',
                'eks-best-practices/operations-reliability/eks-debugging/storage',
                'eks-best-practices/operations-reliability/eks-debugging/observability',
                'eks-best-practices/operations-reliability/eks-debugging/health-check-mismatch',
                'eks-best-practices/operations-reliability/eks-debugging/gpu-ai-workload',
                'eks-best-practices/operations-reliability/eks-debugging/auto-mode',
                'eks-best-practices/operations-reliability/eks-debugging/karpenter',
              ],
            },
            'eks-best-practices/operations-reliability/eks-resiliency-guide',
            'eks-best-practices/operations-reliability/eks-pod-health-lifecycle',
            'eks-best-practices/operations-reliability/eks-pod-scheduling-availability',
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
            {
              type: 'category',
              label: '플랫폼 기초',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/design-architecture/foundations/index',
              },
              items: [
                'agentic-ai-platform/design-architecture/foundations/agentic-platform-architecture',
                'agentic-ai-platform/design-architecture/foundations/agentic-ai-challenges',
                'agentic-ai-platform/design-architecture/foundations/knowledge-feature-store',
              ],
            },
            {
              type: 'category',
              label: '플랫폼 선택',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/design-architecture/platform-selection/index',
              },
              items: [
                'agentic-ai-platform/design-architecture/platform-selection/ai-platform-decision-framework',
                'agentic-ai-platform/design-architecture/platform-selection/aws-native-agentic-platform',
                'agentic-ai-platform/design-architecture/platform-selection/agentic-ai-solutions-eks',
                'agentic-ai-platform/design-architecture/platform-selection/agentcore-hybrid-strategy',
              ],
            },
            {
              type: 'category',
              label: '고급 패턴',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/design-architecture/advanced-patterns/index',
              },
              items: [
                'agentic-ai-platform/design-architecture/advanced-patterns/self-improving-agent-loop',
                'agentic-ai-platform/design-architecture/advanced-patterns/adr-self-improving-loop',
              ],
            },
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
            {
              type: 'category',
              label: 'GPU 인프라',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/model-serving/gpu-infrastructure/index',
              },
              items: [
                'agentic-ai-platform/model-serving/gpu-infrastructure/eks-gpu-node-strategy',
                'agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management',
                'agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack',
                'agentic-ai-platform/model-serving/gpu-infrastructure/aws-neuron-stack',
                'agentic-ai-platform/model-serving/gpu-infrastructure/criu-gpu-migration',
              ],
            },
            {
              type: 'category',
              label: '추론 프레임워크',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/model-serving/inference-frameworks/index',
              },
              items: [
                'agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving',
                'agentic-ai-platform/model-serving/inference-frameworks/llm-d-eks-automode',
                'agentic-ai-platform/model-serving/inference-frameworks/moe-model-serving',
                'agentic-ai-platform/model-serving/inference-frameworks/nemo-framework',
                'agentic-ai-platform/model-serving/inference-frameworks/semantic-caching-strategy',
              ],
            },
            {
              type: 'category',
              label: '추론 최적화',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/model-serving/inference-optimization/index',
              },
              items: [
                'agentic-ai-platform/model-serving/inference-optimization/kv-cache-optimization',
                'agentic-ai-platform/model-serving/inference-optimization/disaggregated-serving',
                'agentic-ai-platform/model-serving/inference-optimization/cost-optimization',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: '운영 & 거버넌스',
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/operations-mlops/index',
          },
          items: [
            {
              type: 'category',
              label: '관측성',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/operations-mlops/observability/index',
              },
              items: [
                'agentic-ai-platform/operations-mlops/observability/agent-monitoring',
                'agentic-ai-platform/operations-mlops/observability/llmops-observability',
                'agentic-ai-platform/operations-mlops/observability/kagent-kubernetes-agents',
              ],
            },
            {
              type: 'category',
              label: '거버넌스',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/operations-mlops/governance/index',
              },
              items: [
                'agentic-ai-platform/operations-mlops/governance/ragas-evaluation',
                'agentic-ai-platform/operations-mlops/governance/agentic-playbook',
                'agentic-ai-platform/operations-mlops/governance/ai-gateway-guardrails',
                'agentic-ai-platform/operations-mlops/governance/compliance-framework',
                'agentic-ai-platform/operations-mlops/governance/domain-customization',
              ],
            },
            {
              type: 'category',
              label: '데이터 인프라',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/operations-mlops/data-infrastructure/index',
              },
              items: [
                'agentic-ai-platform/operations-mlops/data-infrastructure/milvus-vector-database',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Reference Architecture',
          collapsed: true,
          link: {
            type: 'doc',
            id: 'agentic-ai-platform/reference-architecture/index',
          },
          items: [
            {
              type: 'category',
              label: '추론 게이트웨이',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/reference-architecture/inference-gateway/index',
              },
              items: [
                'agentic-ai-platform/reference-architecture/inference-gateway/routing-strategy',
                'agentic-ai-platform/reference-architecture/inference-gateway/cascade-routing-tuning',
                'agentic-ai-platform/reference-architecture/inference-gateway/openclaw-example',
                {
                  type: 'category',
                  label: '배포 가이드',
                  link: {
                    type: 'doc',
                    id: 'agentic-ai-platform/reference-architecture/inference-gateway/setup/index',
                  },
                  items: [
                    'agentic-ai-platform/reference-architecture/inference-gateway/setup/basic-deployment',
                    'agentic-ai-platform/reference-architecture/inference-gateway/setup/advanced-features',
                    'agentic-ai-platform/reference-architecture/inference-gateway/setup/troubleshooting-guide',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: '모델 수명주기',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/reference-architecture/model-lifecycle/index',
              },
              items: [
                'agentic-ai-platform/reference-architecture/model-lifecycle/custom-model-deployment',
                'agentic-ai-platform/reference-architecture/model-lifecycle/custom-model-pipeline',
                'agentic-ai-platform/reference-architecture/model-lifecycle/mlops-pipeline-eks',
                {
                  type: 'category',
                  label: 'Continuous Training',
                  link: {
                    type: 'doc',
                    id: 'agentic-ai-platform/reference-architecture/model-lifecycle/continuous-training/index',
                  },
                  items: [
                    'agentic-ai-platform/reference-architecture/model-lifecycle/continuous-training/trace-to-dataset',
                    'agentic-ai-platform/reference-architecture/model-lifecycle/continuous-training/grpo-dpo-training',
                    'agentic-ai-platform/reference-architecture/model-lifecycle/continuous-training/evaluation-rollout',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: '통합 & 비용',
              link: {
                type: 'doc',
                id: 'agentic-ai-platform/reference-architecture/integrations/index',
              },
              items: [
                'agentic-ai-platform/reference-architecture/integrations/sagemaker-eks-integration',
                'agentic-ai-platform/reference-architecture/integrations/monitoring-observability-setup',
                'agentic-ai-platform/reference-architecture/integrations/coding-tools-cost-analysis',
              ],
            },
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
        {
          type: 'category',
          label: '방법론',
          link: {
            type: 'doc',
            id: 'aidlc/methodology/index',
          },
          items: [
            'aidlc/methodology/principles-and-model',
            'aidlc/methodology/common-rules',
            'aidlc/methodology/adaptive-execution',
            'aidlc/methodology/ontology-engineering',
            'aidlc/methodology/harness-engineering',
            'aidlc/methodology/ddd-integration',
          ],
        },
        {
          type: 'category',
          label: '엔터프라이즈 도입',
          link: {
            type: 'doc',
            id: 'aidlc/enterprise/index',
          },
          items: [
            'aidlc/enterprise/adoption-strategy',
            'aidlc/enterprise/role-composition',
            'aidlc/enterprise/cost-estimation',
            'aidlc/enterprise/governance-framework',
            'aidlc/enterprise/extension-system',
            {
              type: 'category',
              label: 'Agent Versioning',
              link: {
                type: 'doc',
                id: 'aidlc/enterprise/agent-versioning/index',
              },
              items: [
                'aidlc/enterprise/agent-versioning/prompt-model-registry',
                'aidlc/enterprise/agent-versioning/deployment-strategies',
                'aidlc/enterprise/agent-versioning/governance-automation',
              ],
            },
            {
              type: 'category',
              label: 'Regulatory Compliance',
              link: {
                type: 'doc',
                id: 'aidlc/enterprise/regulatory-compliance/index',
              },
              items: [
                'aidlc/enterprise/regulatory-compliance/frameworks/eu-ai-act',
                'aidlc/enterprise/regulatory-compliance/frameworks/nist-ai-rmf',
                'aidlc/enterprise/regulatory-compliance/frameworks/iso-42001',
                'aidlc/enterprise/regulatory-compliance/frameworks/korea-ai-law',
                'aidlc/enterprise/regulatory-compliance/implementation-guide',
              ],
            },
            {
              type: 'category',
              label: 'MSA 복잡도',
              link: {
                type: 'doc',
                id: 'aidlc/enterprise/msa-complexity/index',
              },
              items: [
                'aidlc/enterprise/msa-complexity/pattern-guides/l1-l2-simple-msa',
                'aidlc/enterprise/msa-complexity/pattern-guides/l3-l4-async-saga',
                'aidlc/enterprise/msa-complexity/pattern-guides/l5-event-sourcing',
                'aidlc/enterprise/msa-complexity/implementation/ontology-guide',
                'aidlc/enterprise/msa-complexity/implementation/harness-checklist',
                'aidlc/enterprise/msa-complexity/implementation/verification',
              ],
            },
            'aidlc/enterprise/case-studies',
          ],
        },
        {
          type: 'category',
          label: '도구 & 구현',
          link: {
            type: 'doc',
            id: 'aidlc/toolchain/index',
          },
          items: [
            'aidlc/toolchain/ai-coding-agents',
            'aidlc/toolchain/evaluation-framework',
            'aidlc/toolchain/open-weight-models',
            'aidlc/toolchain/eks-declarative-automation',
            'aidlc/toolchain/technology-roadmap',
          ],
        },
        {
          type: 'category',
          label: 'AgenticOps',
          link: {
            type: 'doc',
            id: 'aidlc/operations/index',
          },
          items: [
            'aidlc/operations/observability-stack',
            'aidlc/operations/predictive-operations',
            'aidlc/operations/autonomous-response',
            'aidlc/operations/multi-agent-collaboration',
            'aidlc/operations/agentic-metrics',
            'aidlc/operations/audit-governance',
          ],
        },
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
