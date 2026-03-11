import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export default function Slide11() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-center">Cell-based Architecture</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-5">
        <FlowDiagram
          title="Control Plane + Independent Cells"
          nodes={[
            { id: 'router', label: 'Cell Router', x: 50, y: 30, width: 140, color: 'blue', description: '트래픽 라우팅' },
            { id: 'registry', label: 'Registry', x: 230, y: 30, width: 120, color: 'blue', description: 'Cell 상태' },
            
            { id: 'cell1', label: 'Cell 1', x: 50, y: 130, width: 120, color: 'emerald', description: '고객 A-H' },
            { id: 'cell2', label: 'Cell 2', x: 220, y: 130, width: 120, color: 'emerald', description: '고객 I-P' },
            { id: 'cell3', label: 'Cell 3', x: 390, y: 130, width: 120, color: 'emerald', description: '고객 Q-Z' },
          ]}
          edges={[
            { from: 'router', to: 'cell1', color: 'emerald' },
            { from: 'router', to: 'cell2', color: 'emerald' },
            { from: 'router', to: 'cell3', color: 'emerald' },
            { from: 'registry', to: 'cell1', color: 'blue', style: 'dashed' },
            { from: 'registry', to: 'cell2', color: 'blue', style: 'dashed' },
            { from: 'registry', to: 'cell3', color: 'blue', style: 'dashed' },
          ]}
          width={560}
          height={200}
        />

        <div className="grid grid-cols-4 gap-3 text-sm">
          <Card className="p-4">
            <h4 className="font-semibold text-blue-300 mb-1">독립성</h4>
            <p className="text-gray-400 text-xs">자체 데이터 스토어</p>
          </Card>
          <Card className="p-4">
            <h4 className="font-semibold text-purple-300 mb-1">격리</h4>
            <p className="text-gray-400 text-xs">Cell 간 직접 통신 없음</p>
          </Card>
          <Card className="p-4">
            <h4 className="font-semibold text-emerald-300 mb-1">균일성</h4>
            <p className="text-gray-400 text-xs">동일한 코드 실행</p>
          </Card>
          <Card className="p-4">
            <h4 className="font-semibold text-amber-300 mb-1">확장성</h4>
            <p className="text-gray-400 text-xs">새 Cell 추가</p>
          </Card>
        </div>

        <Card className="p-4 bg-rose-500/10 border-rose-500/30">
          <p className="text-center text-sm text-rose-200">
            ⚡ Blast Radius 격리: 하나의 Cell 장애가 다른 Cell에 영향을 미치지 않음
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
