import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

const nodes = [
  { id: 'detect', label: 'AZ 장애 감지', x: 300, y: 10, width: 200, height: 45, color: 'rose' },
  { id: 'scope', label: '영향 범위 파악', x: 300, y: 80, width: 200, height: 45, color: 'amber' },
  { id: 'node_check', label: '노드 상태 확인', x: 100, y: 160, width: 180, height: 45, color: 'orange' },
  { id: 'pod_check', label: 'Pod 재배치 확인', x: 520, y: 160, width: 180, height: 45, color: 'blue' },
  { id: 'zonal_shift', label: 'Zonal Shift 실행', x: 100, y: 240, width: 180, height: 45, color: 'purple' },
  { id: 'pdb_check', label: 'PDB 여유 확인', x: 520, y: 240, width: 180, height: 45, color: 'emerald' },
  { id: 'recover', label: '복구 확인', x: 300, y: 320, width: 200, height: 45, color: 'emerald' },
];

const edges = [
  { from: 'detect', to: 'scope', color: 'rose' },
  { from: 'scope', to: 'node_check', color: 'amber' },
  { from: 'scope', to: 'pod_check', color: 'amber' },
  { from: 'node_check', to: 'zonal_shift', color: 'orange' },
  { from: 'pod_check', to: 'pdb_check', color: 'blue' },
  { from: 'zonal_shift', to: 'recover', color: 'purple' },
  { from: 'pdb_check', to: 'recover', color: 'emerald' },
];

export function AZFailureSlide() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-3xl font-bold text-rose-400">AZ 장애 진단 플로우</h2>
        <Badge color="rose">Critical Path</Badge>
      </div>
      <div className="flex-1 flex items-center">
        <div className="w-2/3">
          <FlowDiagram nodes={nodes} edges={edges} width={800} height={380} />
        </div>
        <div className="w-1/3 space-y-3 pl-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-rose-500/30">
            <h4 className="text-rose-400 font-bold text-sm">핵심 확인</h4>
            <p className="text-gray-400 text-xs mt-1">특정 AZ의 노드만 NotReady인지, 전체 AZ 영향인지 구분</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-purple-500/30">
            <h4 className="text-purple-400 font-bold text-sm">Zonal Shift</h4>
            <p className="text-gray-400 text-xs mt-1">R53 ARC로 트래픽을 다른 AZ로 전환 (최대 3일)</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-emerald-500/30">
            <h4 className="text-emerald-400 font-bold text-sm">자동 복구</h4>
            <p className="text-gray-400 text-xs mt-1">Karpenter/CA가 다른 AZ에 노드 자동 프로비저닝</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
