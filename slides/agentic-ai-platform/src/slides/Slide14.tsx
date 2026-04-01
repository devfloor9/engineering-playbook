import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export default function Slide14() {
  const nodes = [
    { id: 'client', label: 'Client', x: 20, y: 60, width: 100, height: 45, color: 'gray' },
    { id: 'gw', label: 'Gateway', description: 'llm-d router', x: 160, y: 60, width: 120, height: 45, color: 'blue' },
    { id: 'prefill', label: 'Prefill Pods', description: 'TP=4, compute', x: 340, y: 20, width: 150, height: 50, color: 'rose' },
    { id: 'nixl', label: 'NIXL', description: 'KV Transfer', x: 540, y: 60, width: 100, height: 45, color: 'purple' },
    { id: 'decode', label: 'Decode Pods', description: 'TP=2, memory', x: 340, y: 100, width: 150, height: 50, color: 'blue' },
    { id: 'resp', label: 'Response', x: 680, y: 60, width: 100, height: 45, color: 'emerald' },
  ];
  const edges = [
    { from: 'client', to: 'gw', color: 'gray' },
    { from: 'gw', to: 'prefill', label: 'Prompt', color: 'rose' },
    { from: 'prefill', to: 'nixl', label: 'KV Cache', color: 'purple' },
    { from: 'nixl', to: 'decode', color: 'blue' },
    { from: 'gw', to: 'decode', label: 'Tokens', color: 'blue', style: 'dashed' as const },
    { from: 'decode', to: 'resp', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Disaggregated Serving & Migration Path</h2>
      <p className="text-gray-400 mb-4">Separate compute-bound prefill from memory-bound decode</p>
      <div className="flex items-center mb-6">
        <div className="scale-[2.2] origin-top"><FlowDiagram nodes={nodes} edges={edges} width={800} height={170} /></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Migration Phases</h3>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-gray-700">
          <Badge color="gray" size="sm">Phase 1</Badge>
          <p className="text-xs text-gray-400 mt-2">Auto Mode + llm-d</p>
          <p className="text-xs text-gray-600">PoC, &lt;16 GPU</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-blue-500/30">
          <Badge color="blue" size="sm">Phase 1.5</Badge>
          <p className="text-xs text-gray-400 mt-2">+ GPU Operator</p>
          <p className="text-xs text-gray-600">DCGM monitoring</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-purple-500/30">
          <Badge color="purple" size="sm">Phase 2a</Badge>
          <p className="text-xs text-gray-400 mt-2">Karpenter + MIG</p>
          <p className="text-xs text-gray-600">Device Plugin</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-amber-500/30">
          <Badge color="amber" size="sm">Phase 2b</Badge>
          <p className="text-xs text-gray-400 mt-2">MNG + DRA</p>
          <p className="text-xs text-gray-600">P6e-GB200</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-lg p-3 border border-emerald-500/30">
          <Badge color="emerald" size="sm">Phase 3</Badge>
          <p className="text-xs text-gray-400 mt-2">NVIDIA Dynamo</p>
          <p className="text-xs text-gray-600">Flash Indexer, SLO</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
