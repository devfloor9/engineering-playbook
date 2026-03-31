import { SlideWrapper, Card, Badge } from '@shared/components';
import { Server, Activity } from 'lucide-react';

export default function Slide17() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">Dual-Layer Observability</h2>
      <p className="text-gray-400 mb-6">Infrastructure metrics + Application traces = Complete visibility</p>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <Card title="Infrastructure Layer" icon={<Server className="w-5 h-5" />} color="blue" className="h-full">
          <p className="font-semibold text-blue-300 mb-2">Bifrost / Kubecost</p>
          <ul className="space-y-1.5">
            <li>• GPU utilization & node cost (DCGM)</li>
            <li>• Model × tokens × unit price</li>
            <li>• Per-team budget tracking & alerts</li>
            <li>• Karpenter consolidation metrics</li>
          </ul>
        </Card>
        <Card title="Application Layer" icon={<Activity className="w-5 h-5" />} color="purple" className="h-full">
          <p className="font-semibold text-purple-300 mb-2">Langfuse / LangSmith</p>
          <ul className="space-y-1.5">
            <li>• Agent step → LLM cost breakdown</li>
            <li>• Chain latency: TTFT, TPS, E2E</li>
            <li>• Trace: Prompt → Tool → Result → Cost</li>
            <li>• RAGAS quality scores per session</li>
          </ul>
        </Card>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-300 mb-2 text-center">Key Alerts</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Badge color="rose" size="sm">P99 latency &gt; 10s → Warning</Badge>
          <Badge color="rose" size="sm">Error rate &gt; 5% → Critical</Badge>
          <Badge color="amber" size="sm">GPU util &lt; 20% (30m) → Cost warning</Badge>
          <Badge color="amber" size="sm">Daily budget &gt; 80% → Alert</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
