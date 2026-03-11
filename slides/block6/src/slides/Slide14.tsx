import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export function Slide14() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Preemption 동작 메커니즘</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="rose">리소스 부족 대응</Badge>
        <Badge color="purple">우선순위 기반 Eviction</Badge>
      </div>

      <FlowDiagram
        title="Preemption 프로세스"
        width={1000}
        height={450}
        nodes={[
          { id: 'high', label: 'High Priority Pod', x: 50, y: 50, width: 160, height: 60, color: 'rose', description: 'priority: 1000000' },
          { id: 'pending', label: 'Pending 상태', x: 50, y: 150, width: 160, height: 50, color: 'amber', description: '리소스 부족' },
          { id: 'scheduler', label: 'Scheduler', x: 300, y: 150, width: 140, height: 80, color: 'blue', description: 'Preemption 평가' },
          { id: 'find', label: '낮은 우선순위', x: 300, y: 280, width: 140, height: 60, color: 'purple', description: 'Pod 탐색' },
          { id: 'node1', label: 'Node A', x: 550, y: 80, width: 110, height: 50, color: 'gray', description: 'Low Pod' },
          { id: 'node2', label: 'Node B', x: 550, y: 180, width: 110, height: 50, color: 'gray', description: 'Low Pod' },
          { id: 'evict', label: 'Evict', x: 730, y: 130, width: 100, height: 50, color: 'rose', description: 'Low Pod 제거' },
          { id: 'schedule', label: 'Schedule', x: 730, y: 230, width: 100, height: 50, color: 'emerald', description: 'High Pod 배치' },
          { id: 'running', label: 'Running', x: 880, y: 230, width: 100, height: 50, color: 'emerald' },
        ]}
        edges={[
          { from: 'high', to: 'pending', label: '리소스 없음', color: 'amber' },
          { from: 'pending', to: 'scheduler', color: 'blue' },
          { from: 'scheduler', to: 'find', color: 'purple' },
          { from: 'find', to: 'node1', label: '탐색', color: 'gray', style: 'dashed' },
          { from: 'find', to: 'node2', label: '탐색', color: 'gray', style: 'dashed' },
          { from: 'node1', to: 'evict', label: '선택', color: 'rose' },
          { from: 'evict', to: 'schedule', color: 'emerald' },
          { from: 'schedule', to: 'running', color: 'emerald' },
        ]}
      />

      <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-bold text-amber-400 mb-2">1. Pending 감지</h3>
          <p className="text-gray-400">High Priority Pod가 리소스 부족으로 스케줄링 실패</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-bold text-purple-400 mb-2">2. 후보 탐색</h3>
          <p className="text-gray-400">낮은 우선순위 Pod를 찾아 Evict 대상 선정</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="font-bold text-emerald-400 mb-2">3. Preemption 실행</h3>
          <p className="text-gray-400">Low Priority Pod Evict → High Priority Pod 스케줄링</p>
        </div>
      </div>

      <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-rose-400 mb-2">주의사항</h3>
        <p className="text-gray-300">• Preemption은 PDB를 존중함 (minAvailable 유지)</p>
        <p className="text-gray-300 mt-1">• preemptionPolicy: Never 설정 시 다른 Pod를 Preempt하지 않음</p>
      </div>
    </SlideWrapper>
  );
}
