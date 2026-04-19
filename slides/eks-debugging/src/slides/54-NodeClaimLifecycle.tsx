import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';

export default function NodeClaimLifecycle() {
  const nodes = [
    { id: 'pending', label: 'Pending', x: 30, y: 50, color: 'amber', width: 120, height: 45 },
    { id: 'launched', label: 'Launched', x: 190, y: 50, color: 'blue', width: 120, height: 45 },
    { id: 'registered', label: 'Registered', x: 350, y: 50, color: 'blue', width: 130, height: 45 },
    { id: 'initialized', label: 'Initialized', x: 520, y: 50, color: 'blue', width: 130, height: 45 },
    { id: 'ready', label: 'Ready', x: 690, y: 50, color: 'emerald', width: 120, height: 45 },
    { id: 'drifted', label: 'Drifted', x: 520, y: 150, color: 'amber', width: 130, height: 45 },
    { id: 'consolidation', label: 'Consolidation', x: 690, y: 150, color: 'amber', width: 140, height: 45 },
    { id: 'terminating', label: 'Terminating', x: 350, y: 150, color: 'rose', width: 130, height: 45 },
    { id: 'deleted', label: 'Deleted', x: 160, y: 150, color: 'rose', width: 120, height: 45 },
  ];

  const edges = [
    { from: 'pending', to: 'launched', label: 'EC2 시작', color: 'blue' },
    { from: 'launched', to: 'registered', label: 'kubelet', color: 'blue' },
    { from: 'registered', to: 'initialized', label: 'Taints', color: 'blue' },
    { from: 'initialized', to: 'ready', label: 'Node Ready', color: 'emerald' },
    { from: 'ready', to: 'drifted', label: 'AMI 변경', color: 'amber' },
    { from: 'ready', to: 'consolidation', label: '유휴/저활용', color: 'amber' },
    { from: 'drifted', to: 'terminating', color: 'rose' },
    { from: 'consolidation', to: 'terminating', color: 'rose' },
    { from: 'terminating', to: 'deleted', color: 'rose' },
  ];

  return (
    <SlideWrapper accent="blue">
      <Badge color="blue">Auto Mode / Karpenter</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">NodeClaim 라이프사이클</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={880} height={220} />

      <div className="mt-5">
        <CodeBlock title="NodeClaim 상태 모니터링" delay={0.3}>
{`# NodeClaim 상태 확인
kubectl get nodeclaims -o wide
# NAME           TYPE          ZONE          CAPACITY  READY  AGE
# default-abc    c6i.2xlarge   us-east-1a    8         True   2d

# Drift 상태 확인
kubectl get nodeclaims -o json | jq -r '.items[] |
  select(.status.conditions[] | select(.type=="Drifted" and .status=="True"))
  | .metadata.name'

# 교체 진행 모니터링
watch -n 5 'kubectl get nodeclaims -o wide'`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
