import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide09: React.FC = () => {
  const chickenEgg = {
    nodes: [
      { id: 'pod', label: 'Pod with\nResourceClaim', color: '#ef4444' },
      { id: 'karp', label: 'Karpenter\nSimulation', color: '#f59e0b' },
      { id: 'need', label: 'Need ResourceSlice\nfor simulation', color: '#eab308' },
      { id: 'node', label: 'Node must exist\nfor ResourceSlice', color: '#84cc16' },
      { id: 'driver', label: 'DRA Driver\npublishes ResourceSlice', color: '#22c55e' },
      { id: 'deadlock', label: 'Chicken-and-Egg\nDeadlock', color: '#dc2626' }
    ],
    edges: [
      { from: 'pod', to: 'karp' },
      { from: 'karp', to: 'need' },
      { from: 'need', to: 'node' },
      { from: 'node', to: 'driver' },
      { from: 'driver', to: 'karp', label: 'too late' },
      { from: 'karp', to: 'deadlock' }
    ]
  };

  return (
    <SlideWrapper title="DRA Chicken-and-Egg Problem" subtitle="Why Karpenter Can't Support DRA">
      <div className="grid grid-cols-2 gap-8">
        <FlowDiagram {...chickenEgg} />
        <div className="space-y-4">
          <Card title="Technical Explanation">
            <ul className="space-y-3 text-sm">
              <li><strong>Karpenter:</strong> Simulates pod placement to choose optimal instance type BEFORE provisioning</li>
              <li><strong>ResourceSlice:</strong> Published by DRA Driver AFTER node exists and detects GPUs</li>
              <li><strong>CEL expressions:</strong> DRA uses CEL to select devices, but attributes are in ResourceSlice</li>
              <li><strong>Result:</strong> Karpenter can't determine what instance to provision without ResourceSlice data</li>
            </ul>
          </Card>
          <Card title="Cluster Autoscaler Works">
            <p className="text-sm">CA doesn't simulate — it just sees pending pod and scales pre-defined MNG. No need to interpret DRA.</p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
