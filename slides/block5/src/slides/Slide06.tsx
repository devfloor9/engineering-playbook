import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide06() {
  const nodes = [
    { id: 'start', label: 'Pod 시작', x: 50, y: 50, color: 'blue', width: 120 },
    { id: 'startup', label: 'Startup Probe', x: 220, y: 50, color: 'amber', width: 140 },
    { id: 'startup-fail', label: '실패: 재시작', x: 220, y: 150, color: 'rose', width: 140 },
    { id: 'probes', label: 'Liveness/Readiness', x: 420, y: 50, color: 'emerald', width: 160 },
    { id: 'liveness', label: 'Liveness 실패', x: 420, y: 150, color: 'rose', width: 140 },
    { id: 'readiness', label: 'Readiness 실패', x: 640, y: 150, color: 'orange', width: 140 },
    { id: 'running', label: '정상 동작', x: 640, y: 50, color: 'emerald', width: 120 },
    { id: 'endpoints', label: 'Endpoints 제거', x: 640, y: 250, color: 'gray', width: 140 },
  ];

  const edges = [
    { from: 'start', to: 'startup', label: '시작', color: 'blue' },
    { from: 'startup', to: 'startup-fail', label: 'failureThreshold', color: 'rose' },
    { from: 'startup-fail', to: 'start', label: '재시작', color: 'rose', style: 'dashed' as const },
    { from: 'startup', to: 'probes', label: '성공', color: 'emerald' },
    { from: 'probes', to: 'liveness', label: 'Liveness 실패', color: 'rose' },
    { from: 'liveness', to: 'start', label: '재시작', color: 'rose', style: 'dashed' as const },
    { from: 'probes', to: 'running', label: '성공', color: 'emerald' },
    { from: 'running', to: 'readiness', label: 'Readiness 실패', color: 'orange' },
    { from: 'readiness', to: 'endpoints', label: '제거', color: 'gray' },
    { from: 'endpoints', to: 'running', label: '복구 시', color: 'emerald', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">Probe 타이밍 다이어그램</h2>
      <p className="text-xl text-gray-300 mb-6">
        Pod 라이프사이클 전체에서 각 Probe가 실행되는 시점과 실패 시 동작
      </p>
      <FlowDiagram nodes={nodes} edges={edges} width={850} height={320} />
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="font-semibold text-amber-400 mb-1">Startup Probe</p>
          <p className="text-gray-400">실패 시 Pod 재시작. Liveness/Readiness는 대기 상태.</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          <p className="font-semibold text-rose-400 mb-1">Liveness Probe</p>
          <p className="text-gray-400">실패 시 컨테이너 재시작. 애플리케이션 복구 시도.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="font-semibold text-emerald-400 mb-1">Readiness Probe</p>
          <p className="text-gray-400">실패 시 Endpoints 제거만. 재시작 없이 트래픽 차단.</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
