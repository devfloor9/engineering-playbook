import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export function Slide08() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Taints & Tolerations: 노드 회피 메커니즘</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="orange">Taint: 노드에 적용</Badge>
        <Badge color="cyan">Toleration: Pod에 적용</Badge>
      </div>

      <FlowDiagram
        title="Taints & Tolerations 동작 흐름"
        width={900}
        height={400}
        nodes={[
          { id: 'node', label: 'Node', x: 50, y: 150, width: 150, height: 60, color: 'orange', description: 'Taint 적용' },
          { id: 'taint', label: 'workload-type=gpu', x: 50, y: 250, width: 150, height: 50, color: 'rose', description: 'NoSchedule' },
          { id: 'pod1', label: 'Pod A', x: 350, y: 80, width: 120, height: 50, color: 'blue', description: 'Toleration 없음' },
          { id: 'pod2', label: 'Pod B', x: 350, y: 180, width: 120, height: 50, color: 'emerald', description: 'Toleration 있음' },
          { id: 'reject', label: '스케줄링 차단', x: 600, y: 80, width: 140, height: 50, color: 'rose' },
          { id: 'allow', label: '스케줄링 허용', x: 600, y: 180, width: 140, height: 50, color: 'emerald' },
          { id: 'pending', label: 'Pending', x: 800, y: 80, width: 80, height: 40, color: 'gray' },
          { id: 'running', label: 'Running', x: 800, y: 180, width: 80, height: 40, color: 'emerald' },
        ]}
        edges={[
          { from: 'node', to: 'taint', color: 'orange', style: 'dashed' },
          { from: 'pod1', to: 'reject', label: 'Tolerate 안함', color: 'rose' },
          { from: 'pod2', to: 'allow', label: 'Tolerate함', color: 'emerald' },
          { from: 'reject', to: 'pending', color: 'gray' },
          { from: 'allow', to: 'running', color: 'emerald' },
        ]}
      />

      <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <h3 className="font-bold text-rose-400 mb-2">NoSchedule</h3>
          <p className="text-gray-400 mb-2">신규 Pod 차단</p>
          <p className="text-xs text-gray-500">기존 Pod 유지</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-bold text-amber-400 mb-2">PreferNoSchedule</h3>
          <p className="text-gray-400 mb-2">가능하면 차단 (Soft)</p>
          <p className="text-xs text-gray-500">대안 허용</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <h3 className="font-bold text-orange-400 mb-2">NoExecute</h3>
          <p className="text-gray-400 mb-2">차단 + 기존 Pod Evict</p>
          <p className="text-xs text-gray-500">즉시 제거</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
