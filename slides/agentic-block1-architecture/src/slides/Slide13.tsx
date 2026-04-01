import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export default function Slide13() {
  const nodes = [
    { id: 'client', label: 'Client Apps', x: 350, y: 20, width: 100, height: 40, color: 'gray' },
    { id: 'kgateway', label: 'kgateway', description: 'Gateway API', x: 200, y: 100, width: 120, height: 50, color: 'blue' },
    { id: 'bifrost', label: 'Bifrost', description: 'Model routing', x: 450, y: 100, width: 120, height: 50, color: 'purple' },
    { id: 'vllm', label: 'vLLM + llm-d', description: 'Self-hosted LLM', x: 250, y: 200, width: 140, height: 50, color: 'amber' },
    { id: 'langraph', label: 'LangGraph', description: 'Agent workflows', x: 450, y: 200, width: 120, height: 50, color: 'emerald' },
  ];
  const edges = [
    { from: 'client', to: 'kgateway', color: 'gray' },
    { from: 'kgateway', to: 'bifrost', color: 'blue' },
    { from: 'bifrost', to: 'vllm', color: 'purple' },
    { from: 'bifrost', to: 'langraph', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-2">EKS Open Architecture</h2>
      <p className="text-gray-400 mb-4">Full control with open-source ecosystem</p>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div>
          <FlowDiagram nodes={nodes} edges={edges} width={400} height={270} />
        </div>
        <div className="space-y-3">
          <Card title="Pros" color="emerald" className="text-sm">
            <ul className="space-y-1 text-xs">
              <li>• Any open-weight model (Llama, Qwen, DeepSeek)</li>
              <li>• Hybrid on-prem + cloud GPU</li>
              <li>• Fine-grained cost optimization (70-80%)</li>
              <li>• Full customization (MIG, Spot, etc.)</li>
            </ul>
          </Card>
          <Card title="Cons" color="rose" className="text-sm">
            <ul className="space-y-1 text-xs">
              <li>• GPU management overhead</li>
              <li>• Longer initial setup (~2-3 weeks)</li>
              <li>• Requires K8s/GPU expertise</li>
              <li>• Operational responsibility</li>
            </ul>
          </Card>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Best for: Open models, hybrid architectures, cost-sensitive workloads
      </div>
    </SlideWrapper>
  );
}
