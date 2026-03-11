import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export default function Slide12() {
  const nodes = [
    { id: 'term', label: 'Pod 종료 시작', x: 50, y: 50, color: 'orange', width: 140 },
    { id: 'prestop', label: 'preStop: 5s', x: 250, y: 50, color: 'blue', width: 120 },
    { id: 'sigterm', label: 'SIGTERM', x: 430, y: 50, color: 'cyan', width: 100 },
    { id: 'grace', label: 'Graceful Shutdown', x: 590, y: 50, color: 'emerald', width: 160 },
    { id: 'timeout', label: 'Timeout 도달', x: 430, y: 150, color: 'rose', width: 130 },
    { id: 'sigkill', label: 'SIGKILL 강제 종료', x: 250, y: 150, color: 'rose', width: 160 },
    { id: 'exit', label: '정상 종료', x: 590, y: 150, color: 'emerald', width: 110 },
  ];

  const edges = [
    { from: 'term', to: 'prestop', label: 'T+0s', color: 'orange' },
    { from: 'prestop', to: 'sigterm', label: 'T+5s', color: 'blue' },
    { from: 'sigterm', to: 'grace', label: 'T+5s', color: 'cyan' },
    { from: 'grace', to: 'exit', label: '완료', color: 'emerald' },
    { from: 'sigterm', to: 'timeout', label: 'T+60s', color: 'rose' },
    { from: 'timeout', to: 'sigkill', label: '강제', color: 'rose' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">terminationGracePeriodSeconds</h2>
      <p className="text-xl text-gray-300 mb-6">
        SIGTERM 전송부터 SIGKILL 강제 종료까지의 최대 대기 시간
      </p>
      <FlowDiagram nodes={nodes} edges={edges} width={820} height={220} />
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
            <Badge color="blue">기본값: 30초</Badge>
          </h3>
          <p className="text-sm text-gray-300">
            대부분의 웹 서비스에 적합. 짧은 요청 처리 시간.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <Badge color="emerald">권장: 60초</Badge>
          </h3>
          <p className="text-sm text-gray-300">
            안정적인 종료 보장. preStop 5초 + Graceful Shutdown 50초 + 여유 5초.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
            <Badge color="amber">긴 작업: 120초+</Badge>
          </h3>
          <p className="text-sm text-gray-300">
            배치 워커, 긴 트랜잭션 처리. 작업 특성에 맞게 조정.
          </p>
        </div>
      </div>
      <div className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-sm">
        <p className="text-rose-400 font-semibold mb-2">⚠️ 주의: 타임아웃 초과 시</p>
        <p className="text-gray-300">
          terminationGracePeriodSeconds 시간이 초과되면 Kubernetes는 <strong className="text-rose-400">SIGKILL</strong>을
          전송하여 프로세스를 강제 종료합니다. 진행 중인 작업이 중단되고 데이터 손실이 발생할 수 있습니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
