import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle, Layers, Shield, Zap } from 'lucide-react';

export function Slide18() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Key Takeaways</h1>

      <div className="grid grid-cols-2 gap-6">
        <Card title="스케줄링 3단계" icon={<Layers className="w-6 h-6" />} color="blue">
          <p className="mb-2">• <span className="text-amber-400">Filtering:</span> 요구사항 미충족 노드 제거</p>
          <p className="mb-2">• <span className="text-purple-400">Scoring:</span> 남은 노드에 점수 부여</p>
          <p className="mb-2">• <span className="text-emerald-400">Binding:</span> 최고 점수 노드에 할당</p>
          <p className="text-xs text-gray-500 mt-3">
            스케줄러는 새 Pod만 배치, 기존 Pod는 Descheduler 활용
          </p>
        </Card>

        <Card title="노드 선택 메커니즘" icon={<CheckCircle className="w-6 h-6" />} color="emerald">
          <p className="mb-2">• <span className="text-blue-400">nodeSelector:</span> 간단한 레이블 일치</p>
          <p className="mb-2">• <span className="text-cyan-400">Node Affinity:</span> Required + Preferred 조합</p>
          <p className="mb-2">• <span className="text-purple-400">Taints/Tolerations:</span> 전용 노드 격리</p>
          <p className="text-xs text-gray-500 mt-3">
            복잡도에 따라 단계적 적용
          </p>
        </Card>

        <Card title="고가용성 패턴" icon={<Shield className="w-6 h-6" />} color="purple">
          <p className="mb-2">• <span className="text-emerald-400">Topology Spread:</span> AZ 간 균등 분산 (maxSkew, minDomains)</p>
          <p className="mb-2">• <span className="text-cyan-400">Pod Anti-Affinity:</span> 노드 간 분산 (Hard/Soft)</p>
          <p className="mb-2">• <span className="text-amber-400">PDB:</span> 최소 가용 Pod 보장 (자발적 중단)</p>
          <p className="text-xs text-gray-500 mt-3">
            다층 제약으로 장애 도메인 완전 격리
          </p>
        </Card>

        <Card title="우선순위 & 최적화" icon={<Zap className="w-6 h-6" />} color="amber">
          <p className="mb-2">• <span className="text-rose-400">PriorityClass:</span> 4-Tier 체계 (System → Business → Standard → Low)</p>
          <p className="mb-2">• <span className="text-orange-400">Preemption:</span> 리소스 부족 시 낮은 우선순위 Pod Evict</p>
          <p className="mb-2">• <span className="text-cyan-400">Descheduler:</span> 기존 Pod 재배치로 클러스터 최적화</p>
          <p className="text-xs text-gray-500 mt-3">
            Karpenter와 조합하여 자동 최적화
          </p>
        </Card>
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6 text-center">
        <p className="text-xl text-gray-200 font-semibold">
          올바른 스케줄링 전략 = 고가용성 + 성능 + 비용 효율
        </p>
        <p className="text-gray-400 mt-3 text-sm">
          워크로드 특성에 맞는 조합을 선택하고, PDB로 안전장치를 구축하세요.
        </p>
      </div>
    </SlideWrapper>
  );
}
