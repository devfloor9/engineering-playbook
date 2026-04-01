import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

export const Slide01: React.FC = () => {
  return (
    <SlideWrapper
      title="Model Serving & GPU Infrastructure"
      subtitle="Block 2: Enterprise GPU Management for LLM Workloads"
      variant="title"
    >
      <div className="grid grid-cols-2 gap-8 mt-12">
        <Card title="Coverage">
          <ul className="space-y-3 text-lg">
            <li>GPU Instance Strategy (p5/p5e/g6e)</li>
            <li>EKS Node Management (Auto Mode, Karpenter, MNG)</li>
            <li>GPU Resource Allocation (Device Plugin, DRA)</li>
            <li>vLLM & llm-d Distributed Inference</li>
            <li>NVIDIA GPU Stack (Operator, DCGM, Dynamo)</li>
            <li>Cost Optimization & Scaling</li>
          </ul>
        </Card>
        <Card title="Learning Objectives">
          <ul className="space-y-3 text-lg">
            <li>Choose optimal GPU instances for model size</li>
            <li>Configure EKS nodes for GPU workloads</li>
            <li>Deploy llm-d with KV Cache-aware routing</li>
            <li>Implement GPU monitoring with DCGM</li>
            <li>Optimize costs with Spot & Consolidation</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
};
