import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide13: React.FC = () => {
  const architecture = {
    nodes: [
      { id: 'client', label: 'Client Request', color: '#3b82f6' },
      { id: 'gw', label: 'llm-d Gateway\nEnvoy + EPP', color: '#10b981' },
      { id: 'pool', label: 'InferencePool CRD\nKV-aware routing', color: '#8b5cf6' },
      { id: 'v1', label: 'vLLM Pod 1\nGPU 0-1', color: '#f59e0b' },
      { id: 'v2', label: 'vLLM Pod 2\nGPU 2-3', color: '#f59e0b' },
      { id: 'v3', label: 'vLLM Pod 3\nGPU 4-5', color: '#f59e0b' }
    ],
    edges: [
      { from: 'client', to: 'gw' },
      { from: 'gw', to: 'pool' },
      { from: 'pool', to: 'v1', label: 'KV hit' },
      { from: 'pool', to: 'v2', label: 'KV hit' },
      { from: 'pool', to: 'v3', label: 'LB fallback' }
    ]
  };

  return (
    <SlideWrapper title="llm-d Architecture" subtitle="Kubernetes-Native Distributed Inference (Red Hat)">
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...architecture} />
        <div className="space-y-4">
          <Card title="Core Components">
            <ul className="space-y-2 text-sm">
              <li><strong>Inference Gateway:</strong> Envoy with EPP (Endpoint Picker Protocol)</li>
              <li><strong>InferencePool CRD:</strong> Target vLLM Pod group</li>
              <li><strong>InferenceModel CRD:</strong> Model metadata & routing policy</li>
              <li><strong>Gateway API Extension:</strong> K8s native routing</li>
            </ul>
          </Card>
          <Card title="Key Features">
            <ul className="space-y-2 text-sm">
              <li>✓ KV Cache-aware routing (prefix matching)</li>
              <li>✓ OpenAI-compatible API</li>
              <li>✓ Disaggregated serving (Prefill/Decode)</li>
              <li>✓ NIXL KV transfer (network + NVLink)</li>
              <li>✓ LoRA adapter hot-swap</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
