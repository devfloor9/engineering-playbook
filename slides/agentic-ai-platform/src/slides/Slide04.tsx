import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide04() {
  const nodes = [
    { id: 'client', label: 'Client Layer', description: 'REST/gRPC, SDK, Web UI', x: 100, y: 10, width: 600, height: 45, color: 'gray' },
    { id: 'gateway', label: 'Gateway Layer', description: 'kgateway + Bifrost, Rate Limit, Auth', x: 100, y: 75, width: 600, height: 45, color: 'blue' },
    { id: 'agent', label: 'Agent Layer', description: 'LangGraph, MCP/A2A, Tool Registry', x: 100, y: 140, width: 600, height: 45, color: 'purple' },
    { id: 'model', label: 'Model Layer', description: 'vLLM, llm-d, Embedding, Reranking', x: 100, y: 205, width: 600, height: 45, color: 'amber' },
    { id: 'data', label: 'Data Layer', description: 'Milvus, Redis, S3', x: 100, y: 270, width: 600, height: 45, color: 'emerald' },
    { id: 'obs', label: 'Observability', description: 'Langfuse, Prometheus, Grafana', x: 100, y: 335, width: 600, height: 45, color: 'rose' },
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
      <h2 className="text-6xl font-bold mb-2">6-Layer Platform Architecture</h2>
      <p className="text-gray-400 mb-4">Separation of concerns, loose coupling, independent scaling</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={400} />
      </div>
    </SlideWrapper>
  );
}
