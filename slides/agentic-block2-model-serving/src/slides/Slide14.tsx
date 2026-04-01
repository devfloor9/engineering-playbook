import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide14: React.FC = () => {
  const routing = {
    nodes: [
      { id: 'req', label: 'Request:\n"K8s란?"', color: '#3b82f6' },
      { id: 'hash', label: 'Prefix Hash\nCompute', color: '#10b981' },
      { id: 'check', label: 'Check KV Cache\nper Pod', color: '#8b5cf6' },
      { id: 'hit', label: 'Pod 1:\nCache HIT', color: '#22c55e' },
      { id: 'miss', label: 'Pod 2:\nCache MISS', color: '#ef4444' },
      { id: 'route', label: 'Route to Pod 1\n(reuse KV)', color: '#f59e0b' }
    ],
    edges: [
      { from: 'req', to: 'hash' },
      { from: 'hash', to: 'check' },
      { from: 'check', to: 'hit' },
      { from: 'check', to: 'miss' },
      { from: 'hit', to: 'route' }
    ]
  };

  return (
    <SlideWrapper title="KV Cache-aware Routing" subtitle="Intelligent Request Distribution by Prefix Matching">
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...routing} />
        <div className="space-y-4">
          <Card title="How It Works">
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Gateway receives request</li>
              <li>Compute hash of prompt prefix</li>
              <li>Query each vLLM Pod's KV cache state</li>
              <li>Route to Pod with matching KV cache</li>
              <li>Fallback to load balancing if no hit</li>
            </ol>
          </Card>
          <Card title="Benefits">
            <ul className="space-y-2 text-sm">
              <li><strong>TTFT reduction:</strong> 80% for cache hits</li>
              <li><strong>GPU compute savings:</strong> Skip prompt processing</li>
              <li><strong>Higher throughput:</strong> More requests per GPU</li>
              <li><strong>RAG optimization:</strong> Reuse document context</li>
            </ul>
          </Card>
          <Card title="Best Use Cases">
            <ul className="space-y-1 text-xs">
              <li>• Same system prompt across conversations</li>
              <li>• RAG with repeated document chunks</li>
              <li>• Multi-turn dialogs with shared history</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
