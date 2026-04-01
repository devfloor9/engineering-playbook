import React from 'react';
import { SlideWrapper, CodeBlock, Card } from '@shared/components';

export const Slide10: React.FC = () => {
  const workaround = `# Karpenter config
env:
  - name: IGNORE_DRA_REQUESTS
    value: "true"

---
# NodePool with GPU hints
apiVersion: karpenter.sh/v1
kind: NodePool
spec:
  template:
    metadata:
      labels:
        gpu-class: h100-80gb

---
# Pod uses BOTH
apiVersion: v1
kind: Pod
spec:
  nodeSelector:
    gpu-class: h100-80gb  # Karpenter reads this
  resourceClaims:
    - name: gpu
      resourceClaimTemplateName: gpu-claim  # kube-scheduler handles`;

  return (
    <SlideWrapper title="IGNORE_DRA_REQUESTS Workaround" subtitle="PoC Only — Production Not Recommended">
      <div className="grid grid-cols-2 gap-8">
        <CodeBlock code={workaround} language="yaml" />
        <div className="space-y-4">
          <Card title="How It Works">
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Karpenter ignores ResourceClaim</li>
              <li>Provisions based on nodeSelector/labels</li>
              <li>Node comes up, DRA Driver deploys</li>
              <li>kube-scheduler matches ResourceClaim</li>
              <li>Pod scheduled to node</li>
            </ol>
          </Card>
          <Card title="Risks" variant="warning">
            <ul className="space-y-2 text-sm">
              <li>❌ Bin-packing errors (GPU capacity not tracked)</li>
              <li>❌ Scale-down misjudgment (DRA resource invisible)</li>
              <li>❌ Double management (label + ResourceClaim)</li>
              <li>⚠️ Temporary flag (will be removed)</li>
            </ul>
            <p className="text-xs text-orange-300 mt-4">
              <strong>Production:</strong> Use MNG + Cluster Autoscaler instead
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
