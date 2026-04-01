import { SlideWrapper, Card } from '@shared/components';
import { Server, GitBranch, FileText, Repeat } from 'lucide-react';

export default function Slide08() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Model Serving Layer</h2>
      <p className="text-gray-400 mb-6">Inference engines and intelligent routing</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Card title="vLLM Engine" icon={<Server className="w-5 h-5" />} color="blue">
          <ul className="space-y-2 text-sm">
            <li>• LLM-optimized serving</li>
            <li>• PagedAttention KV cache</li>
            <li>• Tensor parallelism for 70B+</li>
            <li>• OpenAI-compatible API</li>
          </ul>
        </Card>
        <Card title="llm-d Routing" icon={<GitBranch className="w-5 h-5" />} color="purple">
          <ul className="space-y-2 text-sm">
            <li>• KV Cache-aware routing</li>
            <li>• Prefix cache hit optimization</li>
            <li>• TTFT minimization</li>
            <li>• Disaggregated serving support</li>
          </ul>
        </Card>
        <Card title="Embedding / Reranking" icon={<FileText className="w-5 h-5" />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li>• BGE / E5 embedding models</li>
            <li>• Cohere reranker</li>
            <li>• Batch processing</li>
            <li>• GPU-accelerated inference</li>
          </ul>
        </Card>
        <Card title="Multi-Model Routing" icon={<Repeat className="w-5 h-5" />} color="amber">
          <ul className="space-y-2 text-sm">
            <li>• Self-hosted + External API</li>
            <li>• Cascade routing (cheap → premium)</li>
            <li>• Fallback on provider failure</li>
            <li>• Canary / Blue-Green deployment</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
