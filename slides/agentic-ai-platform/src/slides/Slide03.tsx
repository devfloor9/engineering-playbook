import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide03() {
  const nodes = [
    { id: 'tier2', label: 'Tier 2: LLM Orchestrator', description: 'Claude, GPT-4 — Complex reasoning', x: 250, y: 20, width: 300, height: 60, color: 'purple' },
    { id: 'tier1', label: 'Tier 1: SLM Expert Pool', description: '7B–14B + LoRA — Repetitive tasks', x: 250, y: 140, width: 300, height: 60, color: 'blue' },
    { id: 'base', label: 'Base: Kubernetes Platform', description: 'DRA, Gateway API, Karpenter, vLLM, Bifrost', x: 200, y: 260, width: 400, height: 60, color: 'emerald' },
  ];
  const edges = [
    { from: 'tier2', to: 'tier1', label: 'Delegate simple tasks', color: 'purple' },
    { from: 'tier1', to: 'base', label: 'Infrastructure layer', color: 'blue' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">The Solution: Heterogeneous Multi-Model Ecosystem</h2>
      <p className="text-gray-400 mb-6">Separate by task complexity, managed by unified platform</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={350} />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Route 40–70% of calls to SLMs → 73% cost reduction + 10× latency improvement
      </div>
    </SlideWrapper>
  );
}
