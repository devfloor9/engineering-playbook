import React from 'react';
import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export const Slide03: React.FC = () => {
  const autoModeFlow = {
    nodes: [
      { id: 'pod', label: 'GPU Pod\nRequested', color: '#3b82f6' },
      { id: 'auto', label: 'EKS Auto Mode\nDetects GPU Need', color: '#10b981' },
      { id: 'provision', label: 'Auto Provision\np5.48xlarge', color: '#8b5cf6' },
      { id: 'driver', label: 'AWS Installs\nGPU Driver', color: '#f59e0b' },
      { id: 'ready', label: 'Pod Scheduled\nGPU Ready', color: '#22c55e' }
    ],
    edges: [
      { from: 'pod', to: 'auto' },
      { from: 'auto', to: 'provision' },
      { from: 'provision', to: 'driver' },
      { from: 'driver', to: 'ready' }
    ]
  };

  return (
    <SlideWrapper title="EKS Auto Mode for GPU" subtitle="Fully Managed GPU Node Lifecycle">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <FlowDiagram {...autoModeFlow} />
        </div>
        <div className="space-y-4">
          <Card title="Benefits">
            <ul className="space-y-2 text-lg">
              <li>✓ GPU drivers pre-installed</li>
              <li>✓ Device Plugin managed by AWS</li>
              <li>✓ Zero infrastructure management</li>
              <li>✓ Fast provisioning (5-7 min)</li>
            </ul>
          </Card>
          <Card title="Constraints">
            <ul className="space-y-2 text-lg">
              <li>✗ No MIG partitioning (read-only NodeClass)</li>
              <li>✗ No custom AMI</li>
              <li>✗ DRA not supported (internal Karpenter)</li>
              <li>✓ GPU Operator installable (Device Plugin off)</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
