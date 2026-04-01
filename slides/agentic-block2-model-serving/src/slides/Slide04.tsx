import React from 'react';
import { SlideWrapper, CodeBlock } from '@shared/components';

export const Slide04: React.FC = () => {
  const nodepoolConfig = `apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-inference
spec:
  template:
    metadata:
      labels:
        workload: llm-inference
    spec:
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values: [p5.48xlarge, p4d.24xlarge, g6e.12xlarge]
        - key: karpenter.sh/capacity-type
          operator: In
          values: [on-demand, spot]
      nodeClassRef:
        kind: EC2NodeClass
        name: gpu-nodeclass
      taints:
        - key: nvidia.com/gpu
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 64
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s`;

  return (
    <SlideWrapper title="Karpenter GPU NodePool" subtitle="Self-Managed Node Provisioning with Full Control">
      <div className="grid grid-cols-2 gap-8">
        <CodeBlock code={nodepoolConfig} language="yaml" />
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-3">Key Features</h3>
            <ul className="space-y-2 text-lg">
              <li><strong>Multi-instance support:</strong> p5, p4d, g6e</li>
              <li><strong>Spot integration:</strong> 60-90% cost savings</li>
              <li><strong>GPU taints:</strong> Prevent non-GPU pods</li>
              <li><strong>Auto-consolidation:</strong> Remove idle nodes</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Per-Workload Pools</h3>
            <ul className="space-y-2 text-lg">
              <li>Prefill pool: compute-heavy (p5 × 4 GPU)</li>
              <li>Decode pool: memory-heavy (p5 × 2 GPU)</li>
              <li>Training pool: Spot allowed</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
