import { SlideWrapper, FlowDiagram } from '@shared/components';

const nodes = [
  { id: 'notready', label: 'Node NotReady', x: 280, y: 10, width: 180, height: 45, color: 'rose' },
  { id: 'kubelet', label: 'kubelet 상태?', x: 100, y: 85, width: 160, height: 40, color: 'amber' },
  { id: 'network', label: '네트워크 연결?', x: 460, y: 85, width: 160, height: 40, color: 'amber' },
  { id: 'restart', label: 'kubelet 재시작', x: 20, y: 165, width: 140, height: 40, color: 'blue' },
  { id: 'logs', label: 'kubelet 로그 확인', x: 180, y: 165, width: 160, height: 40, color: 'blue' },
  { id: 'sg', label: 'Security Group 확인', x: 380, y: 165, width: 180, height: 40, color: 'blue' },
  { id: 'vpc', label: 'VPC/Subnet 확인', x: 580, y: 165, width: 160, height: 40, color: 'blue' },
  { id: 'resource', label: '리소스 압박?', x: 100, y: 245, width: 160, height: 40, color: 'purple' },
  { id: 'cert', label: '인증서 만료?', x: 460, y: 245, width: 160, height: 40, color: 'purple' },
  { id: 'evict', label: 'Pod Eviction 진행', x: 100, y: 315, width: 160, height: 40, color: 'emerald' },
  { id: 'renew', label: '노드 교체', x: 460, y: 315, width: 160, height: 40, color: 'emerald' },
];

const edges = [
  { from: 'notready', to: 'kubelet', label: 'SSH 가능', color: 'rose' },
  { from: 'notready', to: 'network', label: 'SSH 불가', color: 'rose' },
  { from: 'kubelet', to: 'restart', color: 'amber' },
  { from: 'kubelet', to: 'logs', color: 'amber' },
  { from: 'network', to: 'sg', color: 'amber' },
  { from: 'network', to: 'vpc', color: 'amber' },
  { from: 'logs', to: 'resource', color: 'blue' },
  { from: 'sg', to: 'cert', color: 'blue' },
  { from: 'resource', to: 'evict', color: 'purple' },
  { from: 'cert', to: 'renew', color: 'purple' },
];

export function NodeNotReadySlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2 text-orange-400">Node NotReady 진단 플로우</h2>
      <p className="text-gray-400 mb-4 text-sm">SSH 가능 여부에 따라 진단 경로가 분기됩니다</p>
      <div className="flex-1 flex items-center justify-center">
        <FlowDiagram nodes={nodes} edges={edges} width={800} height={370} />
      </div>
    </SlideWrapper>
  );
}
