import React from 'react';
import { SlideWrapper, CompareTable, Card } from '@shared/components';

export const Slide11: React.FC = () => {
  const comparison = [
    { feature: 'GPU Driver', autoMode: 'AWS managed', karpenter: 'GPU Operator', mng: 'GPU Operator' },
    { feature: 'Device Plugin', autoMode: 'AWS managed', karpenter: 'GPU Operator', mng: 'GPU Operator' },
    { feature: 'MIG Support', autoMode: 'Not available', karpenter: '✅ Full support', mng: '✅ Full support' },
    { feature: 'DRA Support', autoMode: 'Not available', karpenter: 'Not available', mng: '✅ Supported' },
    { feature: 'DCGM Exporter', autoMode: 'GPU Operator optional', karpenter: 'GPU Operator', mng: 'GPU Operator' },
    { feature: 'Scale Speed', autoMode: 'Fast', karpenter: 'Very fast', mng: 'Slow (ASG)' },
    { feature: 'Complexity', autoMode: 'Lowest', karpenter: 'Medium', mng: 'Medium' }
  ];

  return (
    <SlideWrapper title="Optimal GPU Config 2026" subtitle="Recommended Node Strategy by Use Case">
      <CompareTable
        headers={['Feature', 'Auto Mode', 'Karpenter', 'Managed Node Group']}
        data={comparison.map(c => [c.feature, c.autoMode, c.karpenter, c.mng])}
      />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="Auto Mode" variant="primary">
          <p className="text-sm mb-2"><strong>Best for:</strong></p>
          <ul className="text-xs space-y-1">
            <li>• 70B+ models (full GPU usage)</li>
            <li>• Fast start, zero ops</li>
            <li>• Non-DRA workloads</li>
          </ul>
        </Card>
        <Card title="Karpenter + GPU Operator" variant="success">
          <p className="text-sm mb-2"><strong>Best for:</strong></p>
          <ul className="text-xs space-y-1">
            <li>• 7B-30B models (MIG)</li>
            <li>• Fast scaling required</li>
            <li>• Device Plugin mode</li>
          </ul>
        </Card>
        <Card title="MNG + CA" variant="warning">
          <p className="text-sm mb-2"><strong>Best for:</strong></p>
          <ul className="text-xs space-y-1">
            <li>• DRA required</li>
            <li>• P6e-GB200</li>
            <li>• Static workloads</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
};
