import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

export const Slide16: React.FC = () => {
  return (
    <SlideWrapper title="NVIDIA GPU Stack" subtitle="GPU Operator, DCGM, Dynamo, KAI Scheduler">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card title="GPU Operator v25.10.1">
            <ul className="space-y-2 text-sm">
              <li><strong>Driver DaemonSet:</strong> GPU kernel module</li>
              <li><strong>Container Toolkit (CDI):</strong> Runtime integration</li>
              <li><strong>Device Plugin:</strong> nvidia.com/gpu resource</li>
              <li><strong>GFD:</strong> GPU node labeling</li>
              <li><strong>MIG Manager:</strong> MIG profile automation</li>
              <li><strong>DCGM Exporter:</strong> Prometheus metrics</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              ClusterPolicy CRD orchestrates all components
            </p>
          </Card>
          <Card title="DCGM v4.5.2">
            <ul className="space-y-2 text-sm">
              <li>GPU Utilization, Memory, Power, Temp</li>
              <li>SM Activity, Tensor Core usage</li>
              <li>ECC errors, XID codes</li>
              <li>Per-process metrics (PID tracking)</li>
              <li>MIG instance metrics</li>
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="NVIDIA Dynamo v1.0">
            <ul className="space-y-2 text-sm">
              <li><strong>Flash Indexer:</strong> Radix tree KV indexing</li>
              <li><strong>NIXL:</strong> NVLink/RDMA KV transfer (공통 엔진)</li>
              <li><strong>KVBM:</strong> GPU→CPU→SSD 3-tier cache</li>
              <li><strong>KAI Scheduler:</strong> GPU-aware Pod placement</li>
              <li><strong>Planner:</strong> SLO-based autoscaling</li>
              <li><strong>EPP:</strong> Gateway API integration</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              7x performance vs baseline (SemiAnalysis)
            </p>
          </Card>
          <Card title="KAI Scheduler">
            <p className="text-sm mb-2">GPU-aware Kubernetes scheduler (not autoscaling):</p>
            <ul className="space-y-1 text-xs">
              <li>• Topology-aware placement (NVLink, NUMA)</li>
              <li>• MIG slice recognition</li>
              <li>• Requires ClusterPolicy (GPU Operator dependency)</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
