import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide13: React.FC = () => {
  const architecture: React.ComponentProps<typeof FlowDiagram> = {
    width: 680,
    height: 470,
    nodes: [
      { id: 'client', label: 'Client', x: 30, y: 25, color: 'blue' },
      { id: 'gw', label: 'Gateway proxy', x: 30, y: 160, color: 'emerald' },
      { id: 'epp', label: 'EPP', description: 'Endpoint Picker', x: 270, y: 160, color: 'purple' },
      { id: 'pool', label: 'InferencePool', description: 'Pod discovery / EPP ref', x: 270, y: 25, color: 'purple' },
      { id: 'objective', label: 'InferenceObjective', description: 'Request priority', x: 500, y: 25, width: 160, color: 'cyan' },
      { id: 'workload', label: 'Workload', description: 'Image / GPUs / replicas', x: 500, y: 260, width: 160, color: 'blue' },
      { id: 'v1', label: 'vLLM Pod 1', description: '2 GPUs (example)', x: 30, y: 365, color: 'amber' },
      { id: 'v2', label: 'vLLM Pod 2', description: '2 GPUs (example)', x: 270, y: 365, color: 'amber' }
    ],
    edges: [
      { from: 'client', to: 'gw' },
      { from: 'gw', to: 'epp', label: 'ext-proc' },
      { from: 'gw', to: 'v1', label: 'proxy request' },
      { from: 'gw', to: 'v2' },
      { from: 'pool', to: 'epp', label: 'endpointPickerRef', style: 'dashed' },
      { from: 'objective', to: 'pool', label: 'poolRef', style: 'dashed' },
      { from: 'objective', to: 'epp', label: 'priority', style: 'dashed' },
      { from: 'workload', to: 'v1', style: 'dashed' },
      { from: 'workload', to: 'v2', label: 'manages Pods', style: 'dashed' }
    ]
  };

  return (
    <SlideWrapper>
      <h1 className="text-3xl font-bold mb-2">llm-d Architecture</h1>
      <p className="text-gray-400 mb-6">Reviewed: llm-d v0.8.1 · Router v0.9.0 · GIE v1.5.0</p>
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...architecture} />
        <div className="space-y-4">
          <Card title="Core Components">
            <ul className="space-y-2 text-sm">
              <li><strong>Gateway + EPP:</strong> Proxy calls the Endpoint Picker, then forwards to the selected Pod</li>
              <li><strong>HTTPRoute → InferencePool (v1):</strong> Routing rules, Pod selector, ports, and EPP reference</li>
              <li><strong>InferenceObjective (v1alpha2):</strong> Optional request priority; no GPU reservation</li>
              <li><strong>Deployment / LeaderWorkerSet:</strong> Model image, GPU requests, and replicas</li>
            </ul>
          </Card>
          <Card title="Key Features">
            <ul className="space-y-2 text-sm">
              <li>✓ Cache and load scoring with configured EPP plugins</li>
              <li>✓ Prefill/Decode serving with configured KV transfer</li>
              <li>✓ LoRA affinity; dynamic loading depends on the model server</li>
              <li>✓ One compatible Gateway can serve inference and regular Services</li>
            </ul>
          </Card>
          <p className="text-xs text-gray-400">
            Solid: traffic / EPP calls. Dashed: configuration / workload management.
            {' '}<a href="https://github.com/llm-d/llm-d/blob/v0.8.1/docs/architecture/core/router/proxy.md">Gateway architecture</a>
            {' · '}<a href="https://github.com/llm-d/llm-d-router/blob/v0.9.0/config/crd/bases/llm-d.ai_inferenceobjectives.yaml">Objective schema</a>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};
