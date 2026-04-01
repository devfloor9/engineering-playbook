import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide11() {
  const data = [
    {
      challenge: 'GPU Resource Management',
      problem: '$30-98/hr GPU nodes, 10-100× cost vs CPU',
      solution: 'Karpenter autoscaling + Spot instances + Consolidation → 70% cost reduction',
    },
    {
      challenge: 'Intelligent Routing',
      problem: 'Multi-model selection, KV Cache inefficiency',
      solution: 'llm-d KV-aware routing + Bifrost 2-Tier Gateway → Prefix cache hit optimization',
    },
    {
      challenge: 'LLMOps Observability',
      problem: 'Token cost + Infra cost dual tracking',
      solution: 'Langfuse LLM tracing + Prometheus infra metrics → Full visibility',
    },
    {
      challenge: 'Agent Orchestration',
      problem: 'Prompt injection, tool poisoning, PII leakage',
      solution: 'NeMo Guardrails + Tool scope limits + HITL gates → Defense in depth',
    },
    {
      challenge: 'Model Supply Chain',
      problem: 'Training → Eval → Deploy lifecycle complexity',
      solution: 'Argo Workflows + ACK + KRO → GitOps automation',
    },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Challenge → Solution Mapping</h2>
      <p className="text-gray-400 mb-4">How the platform addresses each challenge</p>
      <div className="flex-1 overflow-auto">
        <CompareTable
          headers={['Challenge', 'Problem', 'Platform Solution']}
          data={data}
          leftColor="rose"
          rightColor="emerald"
        />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        EKS + Karpenter + OSS ecosystem provides production-grade solutions
      </div>
    </SlideWrapper>
  );
}
