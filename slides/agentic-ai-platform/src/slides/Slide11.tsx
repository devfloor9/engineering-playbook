import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide11() {
  const nodes = [
    { id: 'karp', label: 'Karpenter', description: 'NodePool controller', x: 310, y: 10, width: 180, height: 45, color: 'blue' },
    { id: 'prefill', label: 'Prefill Pool', description: 'p5.48xlarge • TP=4 • Compute-heavy', x: 30, y: 100, width: 220, height: 55, color: 'rose' },
    { id: 'decode', label: 'Decode Pool', description: 'p5.48xlarge • TP=2 • 4 pods/node', x: 290, y: 100, width: 220, height: 55, color: 'blue' },
    { id: 'infer', label: 'Inference Pool', description: 'g5/g6e • Spot 70% • Cost-optimized', x: 550, y: 100, width: 220, height: 55, color: 'emerald' },
    { id: 'keda', label: 'KEDA', description: 'KV Cache / TTFT autoscaling', x: 310, y: 200, width: 180, height: 45, color: 'purple' },
  ];
  const edges = [
    { from: 'karp', to: 'prefill', color: 'rose' },
    { from: 'karp', to: 'decode', color: 'blue' },
    { from: 'karp', to: 'infer', color: 'emerald' },
    { from: 'keda', to: 'decode', label: 'Scale trigger', color: 'purple', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">GPU Node Strategy 2026</h2>
      <p className="text-gray-400 mb-4">Workload-specific NodePools with Karpenter + KEDA autoscaling</p>
      <div className="flex-1 flex items-center">
        <div className="w-full [&_svg]:!max-w-none"><FlowDiagram nodes={nodes} edges={edges} width={800} height={270} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 text-center text-xs">
        <div className="bg-gray-900 rounded-lg p-3 border border-rose-500/30">
          <p className="text-rose-400 font-bold">Prefill</p>
          <p className="text-gray-500">Compute-bound • Prompt processing</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-500/30">
          <p className="text-blue-400 font-bold">Decode</p>
          <p className="text-gray-500">Memory-bound • Token generation</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-emerald-500/30">
          <p className="text-emerald-400 font-bold">Inference</p>
          <p className="text-gray-500">Cost-optimized • Spot instances</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
