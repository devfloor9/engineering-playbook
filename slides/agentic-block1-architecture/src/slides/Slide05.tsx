import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide05() {
  const nodes = [
    { id: 'client', label: 'Client Layer', description: 'REST/gRPC, SDK, Web UI', x: 100, y: 10, width: 600, height: 50, color: 'gray' },
    { id: 'gateway', label: 'Gateway Layer', description: 'kgateway + Bifrost, Auth, Rate Limit', x: 100, y: 80, width: 600, height: 50, color: 'blue' },
    { id: 'agent', label: 'Agent Layer', description: 'LangGraph, MCP/A2A, Tool Registry', x: 100, y: 150, width: 600, height: 50, color: 'purple' },
    { id: 'model', label: 'Model Serving Layer', description: 'vLLM, llm-d, Embedding, Reranking', x: 100, y: 220, width: 600, height: 50, color: 'amber' },
    { id: 'data', label: 'Data Layer', description: 'Milvus, Redis, S3', x: 100, y: 290, width: 600, height: 50, color: 'emerald' },
    { id: 'obs', label: 'Observability', description: 'Langfuse, Prometheus, Grafana', x: 100, y: 360, width: 600, height: 50, color: 'rose' },
  ];
  const edges = [
    { from: 'client', to: 'gateway', color: 'gray' },
    { from: 'gateway', to: 'agent', color: 'blue' },
    { from: 'agent', to: 'model', color: 'purple' },
    { from: 'model', to: 'data', color: 'amber' },
    { from: 'data', to: 'obs', color: 'emerald', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">6-Layer Architecture</h2>
      <p className="text-gray-400 mb-4">Separation of concerns, loose coupling, independent scaling</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={430} />
      </div>
      <div className="mt-3 text-center text-sm text-gray-500">
        Each layer scales independently • Observability spans all layers
      </div>
    </SlideWrapper>
  );
}
