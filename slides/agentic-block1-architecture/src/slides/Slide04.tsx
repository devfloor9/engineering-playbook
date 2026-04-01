import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide04() {
  const nodes = [
    { id: 'tier2', label: 'Tier 2: LLM Orchestrator', description: 'Claude, GPT-4 — Complex reasoning', x: 250, y: 20, width: 300, height: 60, color: 'purple' },
    { id: 'tier1', label: 'Tier 1: SLM Expert Pool', description: '7B-14B + LoRA — Repetitive tasks', x: 250, y: 140, width: 300, height: 60, color: 'blue' },
    { id: 'base', label: 'Base: Kubernetes Platform', description: 'DRA, Gateway API, Karpenter, vLLM, Bifrost', x: 200, y: 260, width: 400, height: 60, color: 'emerald' },
  ];
  const edges = [
    { from: 'tier2', to: 'tier1', label: 'Delegate simple tasks', color: 'purple' },
    { from: 'tier1', to: 'base', label: 'Infrastructure automation', color: 'blue' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Multi-Model Ecosystem</h2>
      <p className="text-gray-400 mb-6">Heterogeneous models orchestrated by unified platform</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={350} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <p className="text-purple-400 font-semibold mb-1">Tier 2: Strategic</p>
          <p className="text-gray-400">Complex reasoning, planning, creative tasks</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-400 font-semibold mb-1">Tier 1: Tactical</p>
          <p className="text-gray-400">Domain-specific, high-throughput operations</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-emerald-400 font-semibold mb-1">Base: Infrastructure</p>
          <p className="text-gray-400">GPU autoscaling, routing, observability</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
