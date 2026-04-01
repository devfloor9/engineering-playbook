import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

export const Slide20: React.FC = () => {
  return (
    <SlideWrapper title="Key Takeaways" subtitle="Model Serving & GPU Infrastructure Best Practices">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card title="Node Strategy">
            <ul className="space-y-2 text-sm">
              <li><strong>70B+ models:</strong> Auto Mode (zero ops)</li>
              <li><strong>7B-30B models:</strong> Karpenter + MIG</li>
              <li><strong>DRA required:</strong> MNG + Cluster Autoscaler</li>
              <li><strong>GPU Operator:</strong> Install on Auto Mode (Device Plugin off)</li>
            </ul>
          </Card>
          <Card title="Distributed Inference">
            <ul className="space-y-2 text-sm">
              <li><strong>llm-d:</strong> Quick start, &lt;16 GPUs, K8s native</li>
              <li><strong>Dynamo:</strong> Max throughput, &gt;16 GPUs, 7x perf</li>
              <li><strong>KV Cache routing:</strong> 80% TTFT reduction</li>
              <li><strong>Disaggregated:</strong> Prefill/Decode split for 3-7x gain</li>
            </ul>
          </Card>
          <Card title="Monitoring">
            <ul className="space-y-2 text-sm">
              <li><strong>DCGM Exporter:</strong> DaemonSet for node-wide metrics</li>
              <li><strong>Key metrics:</strong> GPU util, KV cache, TTFT, ITL</li>
              <li><strong>KEDA:</strong> Proactive Pod scaling</li>
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Cost Optimization">
            <ul className="space-y-2 text-sm">
              <li><strong>Spot Instances:</strong> 60-90% savings (inference)</li>
              <li><strong>Consolidation:</strong> 20-30% savings (idle removal)</li>
              <li><strong>MIG:</strong> 50-75% savings (small models)</li>
              <li><strong>Scheduled:</strong> 30-40% savings (off-peak)</li>
            </ul>
          </Card>
          <Card title="DRA Considerations">
            <ul className="space-y-2 text-sm">
              <li><strong>K8s 1.34+ GA:</strong> Production ready</li>
              <li><strong>Not supported:</strong> Karpenter, Auto Mode</li>
              <li><strong>Use MNG:</strong> Only option for DRA + llm-d</li>
              <li><strong>Chicken-egg:</strong> ResourceSlice needs node first</li>
            </ul>
          </Card>
          <Card title="Next Steps" variant="primary">
            <ul className="space-y-1 text-sm">
              <li>1. Choose node strategy (Auto/Karpenter/MNG)</li>
              <li>2. Deploy llm-d or Dynamo</li>
              <li>3. Configure DCGM monitoring</li>
              <li>4. Enable Spot + Consolidation</li>
              <li>5. Set up KEDA autoscaling</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
