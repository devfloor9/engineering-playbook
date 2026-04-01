import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide17() {
  const nodes = [
    { id: 'phase0', label: 'Phase 0: Discovery', description: 'Identify use case, model requirements', x: 50, y: 30, width: 160, height: 60, color: 'gray' },
    { id: 'phase1', label: 'Phase 1: AWS Native', description: 'Bedrock + AgentCore PoC', x: 270, y: 30, width: 160, height: 60, color: 'amber' },
    { id: 'phase2', label: 'Phase 2: EKS Baseline', description: 'EKS Auto Mode + vLLM', x: 490, y: 30, width: 160, height: 60, color: 'blue' },
    { id: 'phase3', label: 'Phase 3: Optimization', description: 'Karpenter, Spot, MIG, Hybrid', x: 270, y: 140, width: 160, height: 60, color: 'emerald' },
    { id: 'decision1', label: 'Need open models?', x: 120, y: 120, width: 120, height: 40, color: 'purple' },
    { id: 'decision2', label: 'Scale &gt; 20 GPUs?', x: 500, y: 120, width: 120, height: 40, color: 'purple' },
  ];
  const edges = [
    { from: 'phase0', to: 'phase1', label: 'Start here', color: 'gray' },
    { from: 'phase1', to: 'decision1', label: 'Evaluate', color: 'amber' },
    { from: 'decision1', to: 'phase2', label: 'Yes', color: 'purple' },
    { from: 'decision1', to: 'phase1', label: 'No', color: 'purple', style: 'dashed' as const },
    { from: 'phase2', to: 'decision2', label: 'Monitor', color: 'blue' },
    { from: 'decision2', to: 'phase3', label: 'Yes', color: 'purple' },
    { from: 'decision2', to: 'phase2', label: 'No', color: 'purple', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Deployment Decision Flowchart</h2>
      <p className="text-gray-400 mb-4">Progressive journey from prototype to production</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={700} height={230} />
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3 text-xs">
        <div className="bg-gray-900 rounded p-2 border border-gray-800">
          <p className="text-gray-400 font-semibold">Phase 0</p>
          <p className="text-gray-500">Requirements gathering, model selection</p>
        </div>
        <div className="bg-amber-500/10 rounded p-2 border border-amber-500/30">
          <p className="text-amber-400 font-semibold">Phase 1</p>
          <p className="text-gray-500">Fast PoC with Bedrock (~1 week)</p>
        </div>
        <div className="bg-blue-500/10 rounded p-2 border border-blue-500/30">
          <p className="text-blue-400 font-semibold">Phase 2</p>
          <p className="text-gray-500">EKS Auto Mode (~2-3 weeks)</p>
        </div>
        <div className="bg-emerald-500/10 rounded p-2 border border-emerald-500/30">
          <p className="text-emerald-400 font-semibold">Phase 3</p>
          <p className="text-gray-500">Advanced GPU optimization</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
