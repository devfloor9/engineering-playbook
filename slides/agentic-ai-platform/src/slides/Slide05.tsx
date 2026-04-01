import { SlideWrapper, Card } from '@shared/components';
import { Bot, Network, Wrench, Database } from 'lucide-react';

export default function Slide05() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Core Components</h2>
      <p className="text-gray-400 mb-6">Key building blocks of the Agentic AI Platform</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Card title="Agent Runtime" icon={<Bot className="w-5 h-5" />} color="purple">
          <ul className="space-y-1">
            <li>• MCP / A2A protocol for tool connections</li>
            <li>• Memory Manager (Short-term + Long-term)</li>
            <li>• Workflow engine with LangGraph</li>
            <li>• Human-in-the-loop approval gates</li>
          </ul>
        </Card>
        <Card title="Inference Gateway" icon={<Network className="w-5 h-5" />} color="blue">
          <ul className="space-y-1">
            <li>• KV Cache-aware routing (llm-d)</li>
            <li>• Cascade routing (cheap → premium)</li>
            <li>• 2-Tier: kgateway + Bifrost</li>
            <li>• Token rate limiting & cost tracking</li>
          </ul>
        </Card>
        <Card title="Tool Registry" icon={<Wrench className="w-5 h-5" />} color="amber">
          <ul className="space-y-1">
            <li>• API, Search, Code, A2A delegation</li>
            <li>• Prompt injection defense</li>
            <li>• PII redaction & execution timeouts</li>
            <li>• Per-tool scope limits</li>
          </ul>
        </Card>
        <Card title="Vector DB (Milvus)" icon={<Database className="w-5 h-5" />} color="emerald">
          <ul className="space-y-1">
            <li>• RAG pipeline backbone</li>
            <li>• HNSW + BM25 hybrid search</li>
            <li>• Multi-tenant partition isolation</li>
            <li>• GPU-accelerated indexing</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
