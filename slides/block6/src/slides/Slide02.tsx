import { SlideWrapper, Card } from '@shared/components';
import { Target, Zap, DollarSign, Shield } from 'lucide-react';

export function Slide02() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">개요: 스케줄링이 중요한 이유</h1>

      <div className="grid grid-cols-2 gap-6">
        <Card title="고가용성" icon={<Shield className="w-6 h-6" />} color="emerald">
          <p className="mb-2">• 장애 도메인 분리로 서비스 중단 최소화</p>
          <p className="mb-2">• Anti-Affinity로 노드/AZ 간 분산</p>
          <p className="text-emerald-400 text-xs mt-2">예: 노드 장애 시 부분 장애만 발생</p>
        </Card>

        <Card title="성능 최적화" icon={<Zap className="w-6 h-6" />} color="amber">
          <p className="mb-2">• 워크로드 특성에 맞는 노드 배치</p>
          <p className="mb-2">• CPU/GPU 집약적 Pod 분리</p>
          <p className="text-amber-400 text-xs mt-2">예: 리소스 경합 방지로 안정적 성능</p>
        </Card>

        <Card title="리소스 효율" icon={<DollarSign className="w-6 h-6" />} color="cyan">
          <p className="mb-2">• 노드 리소스의 균형 있는 활용</p>
          <p className="mb-2">• Taints로 전용 노드 격리</p>
          <p className="text-cyan-400 text-xs mt-2">예: GPU 필요 없는 Pod 제외로 비용 절감</p>
        </Card>

        <Card title="안정적 운영" icon={<Target className="w-6 h-6" />} color="purple">
          <p className="mb-2">• 우선순위 기반 리소스 보장</p>
          <p className="mb-2">• PDB로 최소 가용 Pod 보장</p>
          <p className="text-purple-400 text-xs mt-2">예: 중요 워크로드 우선 스케줄링</p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
