import React from 'react';
import { SlideWrapper, CodeBlock, Card } from '@shared/components';

export const Slide06: React.FC = () => {
  const helmValues = `driver:
  enabled: false  # AMI pre-installed
toolkit:
  enabled: false  # AMI pre-installed
devicePlugin:
  enabled: true   # Global enable
dcgmExporter:
  enabled: true
  serviceMonitor:
    enabled: true
migManager:
  enabled: true   # ClusterPolicy provided
nfd:
  enabled: true
gfd:
  enabled: true`;

  const nodePoolLabel = `apiVersion: karpenter.sh/v1
kind: NodePool
spec:
  template:
    metadata:
      labels:
        # Disable Device Plugin on Auto Mode nodes
        nvidia.com/gpu.deploy.device-plugin: "false"`;

  return (
    <SlideWrapper title="GPU Operator on Auto Mode" subtitle="Device Plugin Disable Pattern for Hybrid Setup">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card title="Helm Values">
            <CodeBlock code={helmValues} language="yaml" />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="NodePool Label">
            <CodeBlock code={nodePoolLabel} language="yaml" />
          </Card>
          <Card title="What Works">
            <ul className="space-y-2 text-sm">
              <li>✓ DCGM Exporter (detailed GPU metrics)</li>
              <li>✓ NFD/GFD (hardware labels)</li>
              <li>✓ MIG Manager (ClusterPolicy only, no actual MIG)</li>
              <li>✓ KAI Scheduler (needs ClusterPolicy)</li>
              <li>✗ Actual MIG partitioning (NodeClass read-only)</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
