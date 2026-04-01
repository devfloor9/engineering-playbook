import { SlideWrapper, Card } from '@shared/components';
import { Server, Cpu, Network, Shield, Eye } from 'lucide-react';

const checks = [
  {
    title: 'Infrastructure', icon: Server, color: 'blue' as const,
    items: ['Auto Mode or Karpenter + GPU Operator', 'Spot 70%+ of inference workload', 'Consolidation enabled (30s)', 'NodePools per workload type'],
  },
  {
    title: 'Serving', icon: Cpu, color: 'amber' as const,
    items: ['llm-d KV Cache-aware routing', 'vLLM batch inference enabled', 'DCGM Exporter for GPU metrics', 'Disaggregated Prefill/Decode'],
  },
  {
    title: 'Gateway', icon: Network, color: 'purple' as const,
    items: ['2-Tier: kgateway + Bifrost', 'Cascade routing configured', 'Semantic cache (threshold 0.85)', 'Token rate limiting per team'],
  },
  {
    title: 'Security', icon: Shield, color: 'rose' as const,
    items: ['mTLS cluster-internal', 'OIDC/JWT external auth', 'NeMo Guardrails active', 'HITL for sensitive operations'],
  },
  {
    title: 'Observability', icon: Eye, color: 'emerald' as const,
    items: ['Langfuse E2E tracing', 'Per-team budget alerts', 'GPU utilization dashboard', 'RAGAS quality monitoring'],
  },
];

export default function Slide18() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Production Readiness Checklist</h2>
      <p className="text-gray-400 mb-4">Key requirements before going to production</p>
      <div className="grid grid-cols-5 gap-3 flex-1 items-start">
        {checks.map((c) => (
          <Card key={c.title} title={c.title} icon={<c.icon className="w-4 h-4" />} color={c.color} className="h-full">
            <ul className="space-y-1">
              {c.items.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-gray-900 rounded p-2 border border-gray-800">
          <span className="text-gray-500">Inference Cost: </span>
          <span className="text-emerald-400 font-bold">&lt; $1/1M tokens</span>
        </div>
        <div className="bg-gray-900 rounded p-2 border border-gray-800">
          <span className="text-gray-500">P99 Latency: </span>
          <span className="text-blue-400 font-bold">&lt; 2 seconds</span>
        </div>
        <div className="bg-gray-900 rounded p-2 border border-gray-800">
          <span className="text-gray-500">GPU Utilization: </span>
          <span className="text-amber-400 font-bold">&gt; 60%</span>
        </div>
      </div>
    </SlideWrapper>
  );
}
