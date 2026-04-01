import { SlideWrapper, Card } from '@shared/components';
import { Database, Gauge, BarChart3 } from 'lucide-react';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Data & Observability Layer</h2>
      <p className="text-gray-400 mb-6">Storage, caching, and monitoring</p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <Card title="Milvus Vector DB" icon={<Database className="w-5 h-5" />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li>• RAG backbone</li>
            <li>• HNSW + BM25 hybrid search</li>
            <li>• Multi-tenant partitions</li>
            <li>• S3-backed persistence</li>
          </ul>
        </Card>
        <Card title="Redis Cache" icon={<Gauge className="w-5 h-5" />} color="rose">
          <ul className="space-y-2 text-sm">
            <li>• Agent session state</li>
            <li>• LangGraph checkpointer</li>
            <li>• Semantic caching</li>
            <li>• ElastiCache for HA</li>
          </ul>
        </Card>
        <Card title="Langfuse Tracing" icon={<BarChart3 className="w-5 h-5" />} color="purple">
          <ul className="space-y-2 text-sm">
            <li>• Full LLM trace logs</li>
            <li>• Token cost tracking</li>
            <li>• Quality metrics (RAGAS)</li>
            <li>• Team/model-level dashboards</li>
          </ul>
        </Card>
      </div>
      <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-gray-800">
        <p className="text-sm text-gray-400"><span className="text-emerald-400 font-semibold">Prometheus + Grafana</span> for infra metrics. <span className="text-purple-400 font-semibold">Langfuse</span> for LLM observability.</p>
      </div>
    </SlideWrapper>
  );
}
