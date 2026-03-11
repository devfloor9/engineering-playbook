import { SlideWrapper, CodeBlock, Badge, Card } from '@shared/components';
import { Shield } from 'lucide-react';

export function Slide12() {
  const pdbCode = `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
spec:
  minAvailable: 8  # 항상 최소 8개 유지
  # 또는 maxUnavailable: 2  # 동시 최대 2개 중단
  selector:
    matchLabels:
      app: api-server`;

  const rollingUpdateCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2         # 최대 12개까지 증가
      maxUnavailable: 0   # 무중단 배포`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">PodDisruptionBudget (PDB)</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="emerald">자발적 중단 보호</Badge>
        <Badge color="amber">최소 가용성 보장</Badge>
        <Badge color="rose">비자발적 중단 미적용</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 mb-3">PDB 정의</h2>
          <CodeBlock
            code={pdbCode}
            language="yaml"
            title="최소 가용 Pod 보장"
          />
          <div className="mt-3 text-sm">
            <p className="text-gray-400">• <span className="text-blue-400">minAvailable</span>: 최소 유지 Pod 수</p>
            <p className="text-gray-400">• <span className="text-cyan-400">maxUnavailable</span>: 최대 중단 Pod 수</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-amber-400 mb-3">Rolling Update 조합</h2>
          <CodeBlock
            code={rollingUpdateCode}
            language="yaml"
            title="무중단 배포 전략"
          />
          <div className="mt-3 text-sm">
            <p className="text-gray-400">• maxUnavailable: 0 → 기존 Pod 유지</p>
            <p className="text-gray-400">• PDB minAvailable: 8 → 80% 가용성</p>
          </div>
        </div>
      </div>

      <Card title="자발적 vs 비자발적 중단" icon={<Shield className="w-6 h-6" />} color="purple">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-emerald-400 font-bold mb-2">자발적 중단 (PDB 적용)</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 노드 Drain</li>
              <li>• 클러스터 업그레이드</li>
              <li>• Karpenter 통합</li>
            </ul>
          </div>
          <div>
            <p className="text-rose-400 font-bold mb-2">비자발적 중단 (PDB 미적용)</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 노드 크래시</li>
              <li>• OOM Kill</li>
              <li>• AZ 장애</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-orange-400 mb-2">주의: minAvailable = replicas는 Drain 불가</h3>
        <p className="text-gray-300">항상 <code className="text-blue-400">minAvailable &lt; replicas</code> 또는 <code className="text-cyan-400">maxUnavailable ≥ 1</code>로 설정</p>
      </div>
    </SlideWrapper>
  );
}
