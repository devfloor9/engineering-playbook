import { SlideWrapper, Card, Badge } from '@shared/components';
import { Layers, GitBranch, Shield } from 'lucide-react';

export function Slide10() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Topology Spread Constraints</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="emerald">균등 분산</Badge>
        <Badge color="purple">maxSkew 제어</Badge>
        <Badge color="cyan">minDomains 보장</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="핵심 개념" icon={<Layers className="w-6 h-6" />} color="blue">
          <p className="mb-2">• <span className="text-blue-400">maxSkew</span>: 도메인 간 Pod 수 차이 허용 범위</p>
          <p className="mb-2">• <span className="text-cyan-400">minDomains</span>: 최소 분산 도메인 수 보장</p>
          <p className="mb-2">• <span className="text-purple-400">topologyKey</span>: zone, hostname 등</p>
          <p className="text-xs text-gray-500 mt-3">
            Anti-Affinity보다 정교한 분산 제어
          </p>
        </Card>

        <Card title="whenUnsatisfiable" icon={<GitBranch className="w-6 h-6" />} color="amber">
          <p className="mb-2">• <span className="text-rose-400">DoNotSchedule</span>: 조건 위반 시 Pending</p>
          <p className="mb-2">• <span className="text-amber-400">ScheduleAnyway</span>: 조건 선호, 대안 허용</p>
          <p className="text-xs text-gray-500 mt-3">
            Hard vs Soft 제약 선택
          </p>
        </Card>
      </div>

      <Card title="실전 예시" icon={<Shield className="w-6 h-6" />} color="emerald" className="mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-emerald-400 font-bold mb-1">9개 replica</p>
            <p className="text-gray-400">maxSkew: 1</p>
            <p className="text-xs text-gray-500">AZ당 3개씩 균등 배치</p>
          </div>
          <div>
            <p className="text-cyan-400 font-bold mb-1">minDomains: 3</p>
            <p className="text-gray-400">반드시 3개 AZ 분산</p>
            <p className="text-xs text-gray-500">한 곳으로 몰림 방지</p>
          </div>
          <div>
            <p className="text-purple-400 font-bold mb-1">다층 제약</p>
            <p className="text-gray-400">AZ + 노드 동시 제어</p>
            <p className="text-xs text-gray-500">2단계 분산 전략</p>
          </div>
        </div>
      </Card>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-orange-400 mb-2">주의사항</h3>
        <p className="text-gray-300">• Hard 제약(DoNotSchedule) + minDomains → AZ 부족 시 모든 Pod Pending</p>
        <p className="text-gray-300 mt-1">• 스케줄러는 기존 Pod 재배치 안함 → Descheduler 또는 Rolling Restart 필요</p>
      </div>
    </SlideWrapper>
  );
}
