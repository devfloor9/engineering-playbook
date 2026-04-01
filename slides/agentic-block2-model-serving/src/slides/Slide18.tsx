import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide18: React.FC = () => {
  const scaleFlow = {
    nodes: [
      { id: 'metric', label: 'LLM Metrics\nKV Cache, TTFT, Queue', color: '#3b82f6' },
      { id: 'keda', label: 'KEDA\nPod Scaler', color: '#10b981' },
      { id: 'pods', label: 'vLLM Pods\nScale Out', color: '#8b5cf6' },
      { id: 'pending', label: 'Pods Pending\n(GPU needed)', color: '#f59e0b' },
      { id: 'karp', label: 'Karpenter\nNode Provisioning', color: '#22c55e' },
      { id: 'ca', label: 'Cluster Autoscaler\n(MNG for DRA)', color: '#ef4444' },
      { id: 'nodes', label: 'GPU Nodes\nReady', color: '#06b6d4' }
    ],
    edges: [
      { from: 'metric', to: 'keda', label: '1. Proactive' },
      { from: 'keda', to: 'pods' },
      { from: 'pods', to: 'pending' },
      { from: 'pending', to: 'karp', label: '2. Reactive (non-DRA)' },
      { from: 'pending', to: 'ca', label: '2. Reactive (DRA)' },
      { from: 'karp', to: 'nodes' },
      { from: 'ca', to: 'nodes' }
    ]
  };

  return (
    <SlideWrapper title="GPU Scale-out Strategy" subtitle="2-Stage Proactive + Reactive Scaling">
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...scaleFlow} />
        <div className="space-y-4">
          <Card title="Stage 1: KEDA (Proactive)">
            <p className="text-sm mb-2">Scale Pods BEFORE GPU shortage:</p>
            <ul className="space-y-1 text-xs">
              <li>• KV Cache usage &gt; 80%</li>
              <li>• Waiting requests &gt; 10</li>
              <li>• TTFT SLO near violation (p95 &gt; 2s)</li>
            </ul>
            <p className="text-xs text-gray-400 mt-2">
              GPU node provisioning takes 5-10 min → start early
            </p>
          </Card>
          <Card title="Stage 2: Node Provisioning (Reactive)">
            <div className="space-y-2 text-sm">
              <p><strong>Karpenter (non-DRA):</strong> Fast scale-out, optimal instance selection</p>
              <p><strong>Cluster Autoscaler (DRA):</strong> MNG scale-out, DRA compatible</p>
            </div>
          </Card>
          <Card title="Disaggregated Metrics">
            <ul className="space-y-1 text-xs">
              <li><strong>Prefill:</strong> TTFT, input token queue</li>
              <li><strong>Decode:</strong> TPS, KV cache saturation</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
