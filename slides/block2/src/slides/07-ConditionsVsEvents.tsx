import { SlideWrapper, CompareTable } from '@shared/components';
import { GitCompare } from 'lucide-react';

export function Slide07() {
  const headers = ['구분', 'Node Conditions', 'Events'];
  const rows = [
    ['목적', '노드 상태 보고 (자동 복구 트리거)', '문제 알림 및 로깅'],
    ['자동 복구', '✅ Node Auto Repair 연동', '❌ 알림 용도만'],
    ['예시 (Conditions)', 'DiskPressure, MemoryPressure, PIDPressure, NetworkUnavailable, KubeletUnhealthy, ContainerRuntimeUnhealthy', '-'],
    ['예시 (Events)', '-', '커널 소프트 락업, I/O 지연, 파일시스템 에러, 네트워크 패킷 손실, 하드웨어 에러 징후'],
    ['심각도', 'Critical - 노드 교체 필요', 'Warning - 모니터링 필요'],
    ['CloudWatch', '메트릭으로 전송', '이벤트로 전송'],
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">Node Conditions vs Events</h2>

      <div className="flex items-center gap-3 mb-6">
        <GitCompare className="w-6 h-6 text-purple-400" />
        <p className="text-gray-400">
          NMA는 두 가지 방식으로 문제를 보고합니다
        </p>
      </div>

      <CompareTable headers={headers} rows={rows} />

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 rounded-xl p-5 border border-emerald-500/30">
          <h4 className="text-emerald-400 font-bold mb-3">Conditions (자동 복구 대상)</h4>
          <p className="text-sm text-gray-300 mb-3">
            노드가 더 이상 정상 동작할 수 없는 상태를 나타냅니다. Node Auto Repair가 자동으로 노드를 교체합니다.
          </p>
          <div className="bg-gray-900/50 rounded-lg p-3 text-xs">
            <p className="text-emerald-400 font-mono">DiskPressure=True</p>
            <p className="text-gray-500 mt-1">→ 노드 자동 교체 트리거</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl p-5 border border-amber-500/30">
          <h4 className="text-amber-400 font-bold mb-3">Events (경고 용도)</h4>
          <p className="text-sm text-gray-300 mb-3">
            잠재적 문제나 성능 저하를 알립니다. 즉시 노드 교체가 필요하지 않지만 모니터링이 필요합니다.
          </p>
          <div className="bg-gray-900/50 rounded-lg p-3 text-xs">
            <p className="text-amber-400 font-mono">Warning: I/O latency increased</p>
            <p className="text-gray-500 mt-1">→ CloudWatch 알림, 수동 확인</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
