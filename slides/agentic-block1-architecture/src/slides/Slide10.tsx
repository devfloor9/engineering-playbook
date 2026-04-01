import { SlideWrapper, Card } from '@shared/components';
import { Cpu, Network, Eye, Bot, Package } from 'lucide-react';

export default function Slide10() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">5 Critical Challenges</h2>
      <p className="text-gray-400 mb-6">Core problems Agentic AI platforms must solve</p>
      <div className="grid grid-cols-5 gap-3 flex-1">
        <Card title="GPU Resource Mgmt" icon={<Cpu className="w-4 h-4" />} color="rose" className="text-xs">
          <p className="text-xs">$30-98/hr GPU nodes</p>
          <p className="text-xs mt-2">Dynamic autoscaling</p>
          <p className="text-xs mt-2">Multi-tenant sharing</p>
        </Card>
        <Card title="Intelligent Routing" icon={<Network className="w-4 h-4" />} color="blue" className="text-xs">
          <p className="text-xs">Multi-model selection</p>
          <p className="text-xs mt-2">KV Cache awareness</p>
          <p className="text-xs mt-2">Fallback strategies</p>
        </Card>
        <Card title="LLMOps Observability" icon={<Eye className="w-4 h-4" />} color="amber" className="text-xs">
          <p className="text-xs">Token cost tracking</p>
          <p className="text-xs mt-2">Trace debugging</p>
          <p className="text-xs mt-2">Quality metrics</p>
        </Card>
        <Card title="Agent Orchestration" icon={<Bot className="w-4 h-4" />} color="purple" className="text-xs">
          <p className="text-xs">Tool safety</p>
          <p className="text-xs mt-2">Multi-agent collab</p>
          <p className="text-xs mt-2">State management</p>
        </Card>
        <Card title="Model Supply Chain" icon={<Package className="w-4 h-4" />} color="emerald" className="text-xs">
          <p className="text-xs">Training → Eval → Deploy</p>
          <p className="text-xs mt-2">Version control</p>
          <p className="text-xs mt-2">Feedback loops</p>
        </Card>
      </div>
      <div className="mt-6 text-center text-sm text-gray-500">
        Traditional VM-based or manual approaches cannot handle dynamic, GPU-intensive AI workloads
      </div>
    </SlideWrapper>
  );
}
