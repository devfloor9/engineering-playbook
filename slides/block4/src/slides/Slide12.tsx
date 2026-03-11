import { SlideWrapper, CodeBlock } from '@shared/components';

export default function Slide12() {
  const code = `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-server
---
# 대규모 Deployment에 적합한 비율 기반 PDB
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: worker-pdb
spec:
  maxUnavailable: "25%"
  selector:
    matchLabels:
      app: worker`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-center">PodDisruptionBudget (PDB)</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-lg text-blue-200">
            자발적 중단(Voluntary Disruption) 시 최소한의 Pod 가용성을 보장
          </p>
          <p className="text-sm text-gray-400 mt-2">
            노드 Drain, 클러스터 업그레이드, Karpenter 통합 등에 적용
          </p>
        </div>

        <CodeBlock code={code} language="yaml" title="pdb.yaml" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-300 mb-2">minAvailable</h4>
            <p className="text-gray-400">항상 최소 N개 Pod 유지 (예: 2개 또는 50%)</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-2">maxUnavailable</h4>
            <p className="text-gray-400">동시에 최대 N개까지 중단 허용 (예: 1개 또는 25%)</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
