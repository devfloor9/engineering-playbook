import { SlideWrapper, FlowDiagram, Card } from '@shared/components';
import { TrendingUp } from 'lucide-react';

export default function ProgressiveSlide() {
  const nodes = [
    { id: 'v1', label: 'Stable v1', x: 50, y: 50, width: 120, height: 60, color: 'blue', description: '100%' },
    { id: 'v2', label: 'Canary v2', x: 250, y: 50, width: 120, height: 60, color: 'emerald', description: '10% → 50%' },
    { id: 'metrics', label: 'Metrics', x: 450, y: 50, width: 120, height: 60, color: 'amber' },
    { id: 'rollout', label: 'Argo Rollouts', x: 650, y: 50, width: 140, height: 60, color: 'purple' },
    { id: 'promote', label: 'Auto Promote', x: 250, y: 150, width: 130, height: 50, color: 'cyan' },
    { id: 'rollback', label: 'Auto Rollback', x: 450, y: 150, width: 140, height: 50, color: 'rose' },
  ];

  const edges = [
    { from: 'v2', to: 'metrics', label: '1. Collect', color: 'emerald' },
    { from: 'metrics', to: 'rollout', label: '2. Analyze', color: 'amber' },
    { from: 'rollout', to: 'promote', label: '3a. Success', color: 'cyan' },
    { from: 'rollout', to: 'rollback', label: '3b. Fail', color: 'rose' },
    { from: 'promote', to: 'v2', label: '4. 100%', color: 'cyan', style: 'dashed' as const },
    { from: 'rollback', to: 'v1', label: '4. Revert', color: 'rose', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <TrendingUp className="w-10 h-10 text-emerald-400" />
        Progressive Delivery (Argo Rollouts)
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={850} height={240} />

      <div className="grid grid-cols-4 gap-4 mt-8">
        <Card title="Canary" color="blue">
          <p className="text-xs mb-2">점진적 트래픽 증가</p>
          <div className="text-xs text-gray-400 space-y-1">
            <div>10% → 25% → 50% → 100%</div>
          </div>
        </Card>

        <Card title="Blue/Green" color="emerald">
          <p className="text-xs mb-2">전환 전 검증</p>
          <div className="text-xs text-gray-400 space-y-1">
            <div>새 버전 준비 → 즉시 전환</div>
          </div>
        </Card>

        <Card title="Analysis" color="amber">
          <p className="text-xs mb-2">메트릭 기반 판단</p>
          <div className="text-xs text-gray-400 space-y-1">
            <div>에러율, 레이턴시, 성공률</div>
          </div>
        </Card>

        <Card title="Automation" color="purple">
          <p className="text-xs mb-2">자동 승격/롤백</p>
          <div className="text-xs text-gray-400 space-y-1">
            <div>수동 개입 불필요</div>
          </div>
        </Card>
      </div>

      <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
        <h3 className="text-emerald-400 font-bold mb-2 text-sm">Argo Rollouts = Deployment 확장</h3>
        <p className="text-xs text-gray-400">
          Kubernetes Deployment를 대체하여 카나리, Blue/Green, A/B 테스트를 네이티브로 지원합니다.
          AnalysisTemplate으로 Prometheus 메트릭 기반 자동 의사결정을 구현할 수 있습니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
