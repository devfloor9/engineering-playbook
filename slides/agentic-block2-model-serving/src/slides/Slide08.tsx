import React from 'react';
import { SlideWrapper, CompareTable, Card } from '@shared/components';

export const Slide08: React.FC = () => {
  const compatibility = [
    { node: 'Managed Node Group', dra: '✅ Supported', note: 'Recommended for DRA' },
    { node: 'Self-Managed Node Group', dra: '✅ Supported', note: 'Manual configuration required' },
    { node: 'Karpenter', dra: '❌ Not Supported', note: 'Skips pods with ResourceClaim' },
    { node: 'EKS Auto Mode', dra: '❌ Not Supported', note: 'Internal Karpenter-based' }
  ];

  return (
    <SlideWrapper title="DRA Compatibility" subtitle="Node Provisioning Constraints (2026.03)">
      <CompareTable
        headers={['Node Type', 'DRA Support', 'Notes']}
        data={compatibility.map(c => [c.node, c.dra, c.note])}
      />
      <div className="grid grid-cols-2 gap-8 mt-8">
        <Card title="Why MNG Only?">
          <p className="text-sm mb-3">DRA uses ResourceSlice published AFTER node creation:</p>
          <ul className="space-y-2 text-sm">
            <li><strong>Cluster Autoscaler:</strong> Simple logic — "pending pod → scale MNG"</li>
            <li><strong>Karpenter:</strong> Simulates pod placement BEFORE provisioning → can't read ResourceSlice</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3">
            Reference: <a href="https://github.com/kubernetes-sigs/karpenter/issues/1231" className="text-blue-400">#1231</a>
          </p>
        </Card>
        <Card title="Hybrid Strategy">
          <ul className="space-y-2 text-sm">
            <li><strong>DRA workloads:</strong> MNG + Cluster Autoscaler</li>
            <li><strong>Non-DRA workloads:</strong> Karpenter/Auto Mode</li>
            <li><strong>Scale-out flow:</strong> KEDA (Pod) → CA (Node)</li>
            <li><strong>Best for:</strong> llm-d with DRA, P6e-GB200</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
};
