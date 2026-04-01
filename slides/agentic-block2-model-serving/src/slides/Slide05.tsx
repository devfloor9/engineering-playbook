import React from 'react';
import { SlideWrapper, FlowDiagram } from '@shared/components';

export const Slide05: React.FC = () => {
  const strategyFlow = {
    nodes: [
      { id: 'request', label: 'LLM Request', color: '#3b82f6' },
      { id: 'gateway', label: 'Inference Gateway\nKV-aware routing', color: '#10b981' },
      { id: 'prefill', label: 'Prefill Pool\np5 × 4 GPU\nCompute-heavy', color: '#8b5cf6' },
      { id: 'decode', label: 'Decode Pool\np5 × 2 GPU\nMemory-heavy', color: '#f59e0b' },
      { id: 'inference', label: 'Inference Pool\ng6e × 4 GPU\nCost-efficient', color: '#22c55e' }
    ],
    edges: [
      { from: 'request', to: 'gateway' },
      { from: 'gateway', to: 'prefill', label: 'Prompt processing' },
      { from: 'gateway', to: 'decode', label: 'Token generation' },
      { from: 'gateway', to: 'inference', label: 'Standard inference' }
    ]
  };

  return (
    <SlideWrapper title="EKS GPU Node Strategy 2026" subtitle="Workload-Optimized GPU Pools">
      <FlowDiagram {...strategyFlow} />
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-purple-900/30 rounded-lg">
          <h3 className="font-bold text-purple-300 mb-2">Prefill Pool</h3>
          <p className="text-sm">High compute, batch processing, short-lived</p>
          <p className="text-xs text-gray-400 mt-2">Karpenter: fast scale-out</p>
        </div>
        <div className="p-4 bg-orange-900/30 rounded-lg">
          <h3 className="font-bold text-orange-300 mb-2">Decode Pool</h3>
          <p className="text-sm">High memory, KV cache, long-running</p>
          <p className="text-xs text-gray-400 mt-2">KEDA: KV cache metrics</p>
        </div>
        <div className="p-4 bg-green-900/30 rounded-lg">
          <h3 className="font-bold text-green-300 mb-2">Inference Pool</h3>
          <p className="text-sm">Balanced, cost-optimized, Spot-friendly</p>
          <p className="text-xs text-gray-400 mt-2">Auto Mode: zero ops</p>
        </div>
      </div>
    </SlideWrapper>
  );
};
