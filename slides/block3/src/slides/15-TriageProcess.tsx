import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

const nodes = [
  { id: 'alert', label: '알림 수신', x: 310, y: 5, width: 160, height: 40, color: 'rose' },
  { id: 'scope', label: '스코프 판별', x: 310, y: 65, width: 160, height: 40, color: 'amber' },
  { id: 'cluster', label: '클러스터 전체?', x: 100, y: 130, width: 160, height: 40, color: 'blue' },
  { id: 'partial', label: '부분 장애?', x: 520, y: 130, width: 160, height: 40, color: 'orange' },
  { id: 'cp_check', label: 'CP 로그 확인', x: 20, y: 200, width: 140, height: 40, color: 'blue' },
  { id: 'aws_check', label: 'AWS 상태 확인', x: 180, y: 200, width: 140, height: 40, color: 'blue' },
  { id: 'node_check', label: '노드 점검', x: 440, y: 200, width: 140, height: 40, color: 'orange' },
  { id: 'pod_check', label: 'Pod 점검', x: 600, y: 200, width: 140, height: 40, color: 'orange' },
  { id: 'mitigate', label: '완화 조치', x: 200, y: 275, width: 160, height: 40, color: 'purple' },
  { id: 'fix', label: '근본 원인 수정', x: 440, y: 275, width: 160, height: 40, color: 'purple' },
  { id: 'postmortem', label: '포스트모템', x: 310, y: 345, width: 160, height: 40, color: 'emerald' },
];

const edges = [
  { from: 'alert', to: 'scope', color: 'rose' },
  { from: 'scope', to: 'cluster', label: '전체', color: 'amber' },
  { from: 'scope', to: 'partial', label: '부분', color: 'amber' },
  { from: 'cluster', to: 'cp_check', color: 'blue' },
  { from: 'cluster', to: 'aws_check', color: 'blue' },
  { from: 'partial', to: 'node_check', color: 'orange' },
  { from: 'partial', to: 'pod_check', color: 'orange' },
  { from: 'cp_check', to: 'mitigate', color: 'blue' },
  { from: 'node_check', to: 'fix', color: 'orange' },
  { from: 'mitigate', to: 'postmortem', color: 'purple' },
  { from: 'fix', to: 'postmortem', color: 'purple' },
];

export function TriageProcessSlide() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-3xl font-bold text-amber-400">실전 트리아지 프로세스</h2>
        <Badge color="amber">SRE Playbook</Badge>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={400} />
      </div>
    </SlideWrapper>
  );
}
