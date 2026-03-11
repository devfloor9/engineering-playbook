import { SlideWrapper, FlowDiagram } from '@shared/components';

export function Slide03() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">스케줄링 3단계 프로세스</h1>

      <FlowDiagram
        title="Kubernetes 스케줄러 동작 흐름"
        width={1000}
        height={500}
        nodes={[
          { id: 'pod', label: 'Pod 생성', x: 50, y: 50, width: 120, color: 'blue' },
          { id: 'filter', label: 'Phase 1: Filtering', x: 50, y: 150, width: 200, height: 80, color: 'amber', description: 'Predicates' },
          { id: 'f1', label: '리소스 부족', x: 300, y: 120, width: 120, height: 40, color: 'rose' },
          { id: 'f2', label: 'Taint 불일치', x: 300, y: 170, width: 120, height: 40, color: 'rose' },
          { id: 'f3', label: 'NodeSelector', x: 300, y: 220, width: 120, height: 40, color: 'rose' },
          { id: 'suitable', label: '적합한 노드', x: 500, y: 150, width: 140, height: 60, color: 'emerald' },
          { id: 'score', label: 'Phase 2: Scoring', x: 500, y: 270, width: 200, height: 80, color: 'purple', description: 'Priorities' },
          { id: 's1', label: '리소스 균형', x: 750, y: 240, width: 110, height: 40, color: 'cyan' },
          { id: 's2', label: 'Affinity', x: 750, y: 290, width: 110, height: 40, color: 'cyan' },
          { id: 's3', label: '이미지 캐시', x: 750, y: 340, width: 110, height: 40, color: 'cyan' },
          { id: 'best', label: '최고 점수 노드', x: 500, y: 390, width: 140, height: 60, color: 'emerald' },
          { id: 'bind', label: 'Phase 3: Binding', x: 300, y: 390, width: 140, height: 60, color: 'blue', description: 'Pod 할당' },
        ]}
        edges={[
          { from: 'pod', to: 'filter', color: 'blue' },
          { from: 'filter', to: 'f1', label: '제거', color: 'gray', style: 'dashed' },
          { from: 'filter', to: 'f2', label: '제거', color: 'gray', style: 'dashed' },
          { from: 'filter', to: 'f3', label: '제거', color: 'gray', style: 'dashed' },
          { from: 'filter', to: 'suitable', label: '통과', color: 'emerald' },
          { from: 'suitable', to: 'score', color: 'purple' },
          { from: 'score', to: 's1', color: 'cyan', style: 'dashed' },
          { from: 'score', to: 's2', color: 'cyan', style: 'dashed' },
          { from: 'score', to: 's3', color: 'cyan', style: 'dashed' },
          { from: 's1', to: 'best', color: 'emerald' },
          { from: 's2', to: 'best', color: 'emerald' },
          { from: 's3', to: 'best', color: 'emerald' },
          { from: 'best', to: 'bind', color: 'blue' },
        ]}
      />

      <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-bold text-amber-400 mb-2">1. Filtering</h3>
          <p className="text-gray-400">요구사항 미충족 노드 제외</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-bold text-purple-400 mb-2">2. Scoring</h3>
          <p className="text-gray-400">남은 노드에 점수 부여</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-2">3. Binding</h3>
          <p className="text-gray-400">최고 점수 노드에 할당</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
