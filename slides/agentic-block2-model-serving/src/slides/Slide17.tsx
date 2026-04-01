import React from 'react';
import { SlideWrapper, CompareTable, Card } from '@shared/components';

export const Slide17: React.FC = () => {
  const comparison = [
    { feature: 'Project Lead', llmd: 'Red Hat', dynamo: 'NVIDIA' },
    { feature: 'Architecture', llmd: 'Aggregated + Disaggregated', dynamo: 'Aggregated + Disaggregated (equal support)' },
    { feature: 'KV Cache Routing', llmd: 'Prefix-aware', dynamo: 'Flash Indexer (radix tree)' },
    { feature: 'KV Transfer', llmd: 'NIXL (network ok)', dynamo: 'NIXL (NVLink/RDMA ultra-fast)' },
    { feature: 'Pod Scheduling', llmd: 'K8s default (no built-in)', dynamo: 'KAI Scheduler (GPU-aware)' },
    { feature: 'Autoscaling', llmd: 'HPA/KEDA integration', dynamo: 'Planner (SLO-based) + KEDA/HPA' },
    { feature: 'K8s Integration', llmd: 'Gateway API native', dynamo: 'Operator + CRD (DGDR) + Gateway API EPP' },
    { feature: 'Complexity', llmd: 'Low', dynamo: 'High' },
    { feature: 'Best For', llmd: 'Quick start, <16 GPUs', dynamo: 'Max throughput, >16 GPUs, 128K+ context' }
  ];

  return (
    <SlideWrapper title="llm-d vs Dynamo" subtitle="Choosing the Right Distributed Inference Framework">
      <CompareTable
        headers={['Feature', 'llm-d', 'NVIDIA Dynamo']}
        data={comparison.map(c => [c.feature, c.llmd, c.dynamo])}
      />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card title="llm-d Strengths">
          <ul className="space-y-1 text-sm">
            <li>✓ Lightweight, easy to adopt</li>
            <li>✓ K8s Gateway API native</li>
            <li>✓ Works on EKS Auto Mode</li>
            <li>✓ Apache 2.0 (Red Hat)</li>
          </ul>
        </Card>
        <Card title="Dynamo Strengths">
          <ul className="space-y-1 text-sm">
            <li>✓ Flash Indexer (optimized KV matching)</li>
            <li>✓ KAI Scheduler (GPU-aware Pod placement)</li>
            <li>✓ Planner (SLO autoscaling)</li>
            <li>✓ 7x perf gain (SemiAnalysis benchmark)</li>
          </ul>
        </Card>
      </div>
      <p className="text-sm text-center text-gray-400 mt-4">
        Migration path: Start with llm-d → scale to Dynamo. Both use NIXL for KV transfer.
      </p>
    </SlideWrapper>
  );
};
