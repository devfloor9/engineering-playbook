import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export default function Slide10() {
  const nodes = [
    { id: 'eksctl', label: 'eksctl create cluster', description: '~15 minutes', x: 30, y: 100, width: 180, height: 55, color: 'gray' },
    { id: 'auto', label: 'EKS Auto Mode', description: 'AWS-managed data plane', x: 300, y: 60, width: 200, height: 55, color: 'blue' },
    { id: 'driver', label: 'GPU Driver', description: 'Auto-installed', x: 300, y: 140, width: 200, height: 45, color: 'emerald' },
    { id: 'ready', label: 'GPU Pod Ready', description: 'nvidia.com/gpu: N', x: 580, y: 100, width: 180, height: 55, color: 'purple' },
  ];
  const edges = [
    { from: 'eksctl', to: 'auto', label: 'Auto Mode enabled', color: 'blue' },
    { from: 'auto', to: 'driver', color: 'emerald', style: 'dashed' as const },
    { from: 'auto', to: 'ready', label: 'Pod scheduled', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">EKS Auto Mode: Simplified GPU Deployment</h2>
      <p className="text-gray-400 mb-4">Zero driver management — GPU ready in minutes</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={220} />
      </div>
      <div className="flex gap-3 justify-center mt-4">
        <Badge color="emerald">Zero driver management</Badge>
        <Badge color="blue">Auto GPU scheduling</Badge>
        <Badge color="purple">One-click deployment</Badge>
      </div>
      <div className="mt-3 p-2 bg-gray-900 rounded-lg border border-amber-500/30 text-center">
        <p className="text-xs text-amber-400">⚠ Constraint: MIG not available (read-only NodeClass) • DRA not supported</p>
      </div>
    </SlideWrapper>
  );
}
