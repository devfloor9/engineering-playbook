import { SlideWrapper, FlowDiagram } from '@shared/components';

export function Slide12() {
  const nodes = [
    { id: 'detect', label: 'Event 감지', x: 50, y: 80, width: 140, color: 'rose', description: 'Spot/Maintenance' },
    { id: 'cordon', label: 'Node Cordon', x: 250, y: 50, width: 140, color: 'amber', description: 'No new pods' },
    { id: 'drain', label: 'Pod Drain', x: 250, y: 130, width: 140, color: 'orange', description: 'Evict pods' },
    { id: 'graceful', label: 'Graceful Stop', x: 450, y: 50, width: 140, color: 'emerald', description: 'PreStop hooks' },
    { id: 'reschedule', label: 'Pod 재배치', x: 450, y: 130, width: 140, color: 'cyan', description: 'New nodes' },
    { id: 'terminate', label: 'Node 종료', x: 650, y: 80, width: 140, color: 'purple', description: 'EC2 shutdown' },
  ];

  const edges = [
    { from: 'detect', to: 'cordon', label: '1. Mark', color: 'rose' },
    { from: 'detect', to: 'drain', label: '2. Start', color: 'rose' },
    { from: 'cordon', to: 'graceful', label: '3. Signal', color: 'amber' },
    { from: 'drain', to: 'reschedule', label: '4. Move', color: 'orange' },
    { from: 'graceful', to: 'terminate', label: '5. Complete', color: 'emerald' },
    { from: 'reschedule', to: 'terminate', label: '6. Ready', color: 'cyan' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">NTH 동작 방식</h2>

      <FlowDiagram
        nodes={nodes}
        edges={edges}
        width={850}
        height={250}
        title="Node Termination Handler 처리 흐름"
      />

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="space-y-4">
          <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-500/30">
            <h4 className="text-rose-400 font-bold mb-3 text-sm">1-2. 감지 및 격리</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• EC2 메타데이터 또는 SQS에서 이벤트 감지</li>
              <li>• 노드를 즉시 <span className="text-rose-400">Cordon</span> (스케줄링 중지)</li>
              <li>• Pod Drain 시작 (PodEviction API 사용)</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
            <h4 className="text-amber-400 font-bold mb-3 text-sm">3-4. Graceful Shutdown</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• PreStop 훅 실행 (최대 30초)</li>
              <li>• SIGTERM 신호 전송</li>
              <li>• terminationGracePeriodSeconds 대기</li>
              <li>• Kubernetes가 다른 노드에 Pod 재배치</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
            <h4 className="text-emerald-400 font-bold mb-3 text-sm">5-6. 종료 완료</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 모든 Pod가 안전하게 종료됨</li>
              <li>• 새 노드에서 Pod 실행 중</li>
              <li>• NTH가 EC2 인스턴스 종료 허용</li>
              <li>• 서비스 중단 없이 완료</li>
            </ul>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
            <h4 className="text-purple-400 font-bold mb-3 text-sm">타임라인</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <span className="text-rose-400">T-120s</span>: Spot 중단 알림</li>
              <li>• <span className="text-amber-400">T-90s</span>: Cordon + Drain 시작</li>
              <li>• <span className="text-emerald-400">T-30s</span>: 대부분 Pod 이동 완료</li>
              <li>• <span className="text-purple-400">T-0s</span>: 인스턴스 종료</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
        <p className="text-sm text-gray-300">
          <span className="text-cyan-400 font-semibold">핵심:</span> NTH는 EC2 종료 이벤트를 사전에 감지하여 Pod를 안전하게 재배치함으로써 서비스 중단 없이 노드 교체를 가능하게 합니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
