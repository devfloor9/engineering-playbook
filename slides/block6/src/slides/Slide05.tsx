import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide05() {
  const code = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 6
  template:
    spec:
      affinity:
        nodeAffinity:
          # 필수: On-Demand 노드만
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: karpenter.sh/capacity-type
                operator: In
                values: ["on-demand"]

          # 선호: c7i > c6i > m6i 순서 (가중치)
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values: ["c7i.xlarge", "c7i.2xlarge"]
          - weight: 80
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values: ["c6i.xlarge", "c6i.2xlarge"]`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Node Affinity: 고급 노드 선택</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="blue">Required (Hard)</Badge>
        <Badge color="cyan">Preferred (Soft)</Badge>
        <Badge color="purple">복잡한 논리 조건</Badge>
      </div>

      <CodeBlock
        code={code}
        language="yaml"
        title="Node Affinity: Required + Preferred 조합"
      />

      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-2">Required (Hard)</h3>
          <p className="text-gray-400 mb-2">조건 충족 필수</p>
          <p className="text-xs text-gray-500">실패 시 Pending</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="font-bold text-cyan-400 mb-2">Preferred (Soft)</h3>
          <p className="text-gray-400 mb-2">조건 선호 (가중치)</p>
          <p className="text-xs text-gray-500">대안 허용</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-bold text-purple-400 mb-2">연산자</h3>
          <p className="text-gray-400 text-xs">In, NotIn, Exists,</p>
          <p className="text-gray-400 text-xs">DoesNotExist, Gt, Lt</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
