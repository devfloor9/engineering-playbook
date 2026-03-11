import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide08() {
  const nodes = [
    { id: 'init', label: 'Init Container', x: 50, y: 50, color: 'blue', width: 140 },
    { id: 'main', label: '메인 컨테이너 시작', x: 250, y: 50, color: 'cyan', width: 160 },
    { id: 'startup', label: 'Startup Probe', x: 470, y: 50, color: 'amber', width: 140 },
    { id: 'probes', label: 'Liveness/Readiness', x: 670, y: 50, color: 'emerald', width: 160 },
    { id: 'running', label: '정상 동작', x: 470, y: 150, color: 'emerald', width: 120 },
    { id: 'term', label: 'Pod 종료 요청', x: 250, y: 250, color: 'orange', width: 150 },
    { id: 'prestop', label: 'preStop Hook', x: 470, y: 250, color: 'orange', width: 140 },
    { id: 'sigterm', label: 'SIGTERM', x: 670, y: 250, color: 'rose', width: 120 },
    { id: 'grace', label: 'Graceful Shutdown', x: 470, y: 350, color: 'rose', width: 160 },
    { id: 'stop', label: '컨테이너 종료', x: 250, y: 350, color: 'gray', width: 140 },
  ];

  const edges = [
    { from: 'init', to: 'main', label: '완료', color: 'blue' },
    { from: 'main', to: 'startup', label: '시작', color: 'cyan' },
    { from: 'startup', to: 'probes', label: '성공', color: 'amber' },
    { from: 'probes', to: 'running', label: '성공', color: 'emerald' },
    { from: 'running', to: 'term', label: '종료 시작', color: 'orange' },
    { from: 'term', to: 'prestop', label: '비동기', color: 'orange' },
    { from: 'prestop', to: 'sigterm', label: 'sleep 완료', color: 'orange' },
    { from: 'sigterm', to: 'grace', label: '신호 전송', color: 'rose' },
    { from: 'grace', to: 'stop', label: '정리 완료', color: 'gray' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">Pod Lifecycle 개요</h2>
      <p className="text-xl text-gray-300 mb-6">
        Pod의 전체 라이프사이클: 시작부터 종료까지의 흐름
      </p>
      <FlowDiagram nodes={nodes} edges={edges} width={900} height={420} />
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
          <p className="font-semibold text-cyan-400 mb-1">시작 단계</p>
          <p className="text-gray-400">Init Container → 메인 컨테이너 → Startup Probe 성공</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="font-semibold text-emerald-400 mb-1">실행 단계</p>
          <p className="text-gray-400">Liveness/Readiness Probe 지속 실행. 트래픽 수신.</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <p className="font-semibold text-orange-400 mb-1">종료 단계</p>
          <p className="text-gray-400">preStop Hook → SIGTERM → Graceful Shutdown</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
