import React from 'react';
import { SlideWrapper, CompareTable, Card } from '@shared/components';

export const Slide19: React.FC = () => {
  const strategies = [
    { strategy: 'Spot Instances', saving: '60-90%', risk: 'Medium', best: 'Inference workloads' },
    { strategy: 'Karpenter Consolidation', saving: '20-30%', risk: 'Low', best: 'All workloads' },
    { strategy: 'MIG Partitioning', saving: '50-75%', risk: 'Low', best: '7B-13B models' },
    { strategy: 'Right-sizing', saving: '15-25%', risk: 'Low', best: 'Oversized instances' },
    { strategy: 'Scheduled Scaling', saving: '30-40%', risk: 'Low', best: 'Predictable traffic' },
    { strategy: 'Savings Plans (1yr)', saving: '35%', risk: 'None', best: 'Stable workloads' }
  ];

  return (
    <SlideWrapper title="Cost Optimization" subtitle="GPU Infrastructure Cost Reduction Strategies">
      <CompareTable
        headers={['Strategy', 'Savings', 'Risk', 'Best For']}
        data={strategies.map(s => [s.strategy, s.saving, s.risk, s.best])}
      />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="Spot + Consolidation" variant="success">
          <p className="text-sm mb-2"><strong>Combined: ~85% savings</strong></p>
          <ul className="text-xs space-y-1">
            <li>1. Use Spot (70% off)</li>
            <li>2. Consolidate idle (20% more)</li>
            <li>3. Schedule scaling (30% more)</li>
          </ul>
        </Card>
        <Card title="Example: p5.48xlarge">
          <div className="text-xs space-y-1">
            <p>On-Demand: <span className="line-through">$98.32/hr</span></p>
            <p>Spot: <strong className="text-green-400">$29.50/hr</strong></p>
            <p>Monthly: <strong>$21,240</strong> (vs $70,790)</p>
            <p className="text-gray-400">Savings: $49,550/mo per instance</p>
          </div>
        </Card>
        <Card title="MIG for Small Models">
          <div className="text-xs space-y-1">
            <p>Without MIG: 8 GPUs for 8× 7B models</p>
            <p>With MIG: 2 GPUs (4× MIG per GPU)</p>
            <p><strong className="text-green-400">75% cost reduction</strong></p>
          </div>
        </Card>
      </div>
      <div className="mt-6 p-4 bg-orange-900/30 rounded-lg text-sm">
        <strong>Warning:</strong> p5.48xlarge costs ~$141,580/month (2 nodes, 24/7 On-Demand).
        Always clean up after testing.
      </div>
    </SlideWrapper>
  );
};
