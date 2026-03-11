import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide04() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">Probe 비교</h2>
      <p className="text-xl text-gray-300 mb-6">
        각 Probe의 목적과 실패 시 동작을 명확히 이해하고 올바르게 설정하세요.
      </p>
      <CompareTable
        headers={['Probe 유형', '목적', '실패 시 동작', '활성화 타이밍', '외부 의존성']}
        rows={[
          [
            'Startup Probe',
            '애플리케이션 초기화 완료 확인',
            'Pod 재시작 (failureThreshold 도달 시)',
            'Pod 시작 직후',
            '❌ 포함 금지',
          ],
          [
            'Liveness Probe',
            '애플리케이션 데드락/교착 상태 감지',
            '컨테이너 재시작',
            'Startup Probe 성공 후',
            '❌ 포함 금지',
          ],
          [
            'Readiness Probe',
            '트래픽 수신 준비 상태 확인',
            'Service Endpoint에서 제거 (재시작 없음)',
            'Startup Probe 성공 후',
            '✅ 포함 가능',
          ],
        ]}
      />
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-rose-400 mb-2">⚠️ 주의: Liveness Probe</h3>
          <p className="text-sm text-gray-300">
            외부 의존성(DB, Redis 등)을 포함하면 의존 서비스 장애 시 모든 Pod이 동시 재시작되는
            <strong className="text-rose-400"> Cascading Failure</strong> 발생
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-emerald-400 mb-2">✅ 권장: Readiness Probe</h3>
          <p className="text-sm text-gray-300">
            외부 의존성 확인은 Readiness Probe에서 수행.
            실패 시 <strong className="text-emerald-400">Endpoints에서만 제거</strong>되어 안전
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
