import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide15: React.FC = () => {
  const disaggregated = {
    nodes: [
      { id: 'req', label: 'Request', color: '#3b82f6' },
      { id: 'router', label: 'Router', color: '#10b981' },
      { id: 'pf1', label: 'Prefill-1\nGPU×4', color: '#8b5cf6' },
      { id: 'pf2', label: 'Prefill-2\nGPU×4', color: '#8b5cf6' },
      { id: 'nixl', label: 'NIXL Transfer\nKV Cache', color: '#f59e0b' },
      { id: 'dc1', label: 'Decode-1\nGPU×2', color: '#22c55e' },
      { id: 'dc2', label: 'Decode-2\nGPU×2', color: '#22c55e' },
      { id: 'dc3', label: 'Decode-3\nGPU×2', color: '#22c55e' }
    ],
    edges: [
      { from: 'req', to: 'router' },
      { from: 'router', to: 'pf1', label: 'prompt' },
      { from: 'router', to: 'pf2', label: 'prompt' },
      { from: 'pf1', to: 'nixl' },
      { from: 'pf2', to: 'nixl' },
      { from: 'nixl', to: 'dc1' },
      { from: 'nixl', to: 'dc2' },
      { from: 'nixl', to: 'dc3' }
    ]
  };

  return (
    <SlideWrapper title="Disaggregated Serving" subtitle="Prefill/Decode Split for Maximum Throughput">
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...disaggregated} />
        <div className="space-y-4">
          <Card title="Architecture">
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-purple-300">Prefill Workers:</strong>
                <p className="text-xs text-gray-300">Prompt processing, compute-bound, TP=4</p>
              </div>
              <div>
                <strong className="text-green-300">Decode Workers:</strong>
                <p className="text-xs text-gray-300">Token generation, memory-bound, TP=2</p>
              </div>
              <div>
                <strong className="text-orange-300">NIXL:</strong>
                <p className="text-xs text-gray-300">KV cache transfer via NVLink/RDMA (shared by Dynamo, llm-d, production-stack, aibrix)</p>
              </div>
            </div>
          </Card>
          <Card title="Scaling Strategy">
            <ul className="space-y-2 text-sm">
              <li><strong>Prefill:</strong> Scale by input token rate</li>
              <li><strong>Decode:</strong> Scale by concurrent sessions</li>
              <li><strong>Independent:</strong> Each pool scales separately</li>
            </ul>
          </Card>
          <Card title="Performance Gains">
            <ul className="space-y-1 text-xs">
              <li>• 3-7x throughput vs aggregated</li>
              <li>• Optimal GPU utilization per stage</li>
              <li>• Reduced queueing delays</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
