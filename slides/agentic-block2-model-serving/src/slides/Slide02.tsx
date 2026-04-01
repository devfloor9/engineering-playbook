import React from 'react';
import { SlideWrapper, CompareTable } from '@shared/components';

export const Slide02: React.FC = () => {
  const instances = [
    {
      name: 'p5.48xlarge',
      gpu: '8x H100',
      memory: '80GB x 8',
      vcpu: '192',
      network: '3200 Gbps EFA',
      price: '$98.32/hr',
      use: '70B+ models, highest performance'
    },
    {
      name: 'p5e.48xlarge',
      gpu: '8x H200',
      memory: '141GB x 8',
      vcpu: '192',
      network: '3200 Gbps EFA',
      price: '$115/hr',
      use: '100B+ models, max memory'
    },
    {
      name: 'p4d.24xlarge',
      gpu: '8x A100',
      memory: '40GB x 8',
      vcpu: '96',
      network: '400 Gbps EFA',
      price: '$32.77/hr',
      use: '13B-70B models, cost-effective'
    },
    {
      name: 'g6e.12xlarge',
      gpu: '4x L40S',
      memory: '48GB x 4',
      vcpu: '48',
      network: '50 Gbps',
      price: '$8.14/hr',
      use: '13B-30B inference, budget-friendly'
    },
    {
      name: 'g5.48xlarge',
      gpu: '8x A10G',
      memory: '24GB x 8',
      vcpu: '192',
      network: '100 Gbps',
      price: '$16.29/hr',
      use: '7B models, cost-efficient'
    }
  ];

  return (
    <SlideWrapper title="GPU Instance Landscape" subtitle="AWS GPU Instance Comparison for LLM Workloads">
      <CompareTable
        headers={['Instance', 'GPU', 'Memory', 'vCPU', 'Network', 'Price', 'Best For']}
        data={instances.map(i => [i.name, i.gpu, i.memory, i.vcpu, i.network, i.price, i.use])}
      />
      <div className="mt-8 p-4 bg-blue-900/30 rounded-lg">
        <p className="text-sm text-blue-200">
          <strong>Selection Guide:</strong> p5e for 100B+ (max memory), p5 for 70B+ (highest perf),
          p4d for 13B-70B (balanced), g6e for budget inference, g5 for small models
        </p>
      </div>
    </SlideWrapper>
  );
};
