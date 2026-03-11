import { SlideWrapper, Card, Badge } from '@shared/components';
import { RefreshCw, Zap, Target } from 'lucide-react';

export function Slide15() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Descheduler: 재배치 최적화</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="cyan">스케줄러 보완</Badge>
        <Badge color="purple">기존 Pod 재배치</Badge>
        <Badge color="emerald">클러스터 최적화</Badge>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card title="Descheduler란?" icon={<RefreshCw className="w-6 h-6" />} color="blue">
          <p className="mb-2">Kubernetes 스케줄러는 <span className="text-rose-400">새 Pod만</span> 배치</p>
          <p className="mb-2">기존 Pod는 노드 레이블 변경/리소스 불균형 시에도 <span className="text-amber-400">재배치 안됨</span></p>
          <p className="text-emerald-400 mt-3">→ Descheduler가 주기적으로 Pod Evict하여 재스케줄링 유도</p>
        </Card>

        <Card title="주요 사용 사례" icon={<Target className="w-6 h-6" />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li>• 노드 리소스 불균형 해소</li>
            <li>• Affinity/Anti-Affinity 위반 수정</li>
            <li>• Taint/Toleration 변경 반영</li>
            <li>• 노드 장시간 실행 Pod 교체</li>
            <li>• 저사양 노드에서 이동</li>
          </ul>
        </Card>

        <Card title="Karpenter 조합" icon={<Zap className="w-6 h-6" />} color="amber">
          <p className="mb-2">Descheduler + Karpenter 결합으로 <span className="text-amber-400">자동 최적화</span></p>
          <p className="mb-2">• Descheduler: Pod Evict</p>
          <p className="mb-2">• Karpenter: 최적 노드 프로비저닝</p>
          <p className="text-xs text-gray-500 mt-3">통합으로 리소스 효율 극대화</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5">
          <h3 className="font-bold text-purple-400 mb-3">스케줄러 vs Descheduler</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p><span className="text-blue-400">Scheduler:</span> 새 Pod → 빈 노드 배치</p>
            <p><span className="text-cyan-400">Descheduler:</span> 기존 Pod → 최적 노드로 이동</p>
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-5">
          <h3 className="font-bold text-rose-400 mb-3">주의사항</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>• PDB 설정 필수 (무분별한 Evict 방지)</p>
            <p>• CronJob 주기 적절히 설정 (너무 짧으면 불안정)</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
