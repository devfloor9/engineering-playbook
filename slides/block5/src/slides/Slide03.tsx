import { SlideWrapper, Card } from '@shared/components';
import { Play, HeartPulse, SignalHigh } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">Probe 3종 개요</h2>
      <p className="text-xl text-gray-300 mb-8">
        Kubernetes는 세 가지 유형의 Probe를 제공하여 Pod의 상태를 모니터링합니다.
      </p>
      <div className="grid grid-cols-3 gap-6">
        <Card title="Startup Probe" icon={<Play size={28} />} color="amber">
          <div className="space-y-3">
            <p className="font-semibold text-amber-300">애플리케이션 초기화 완료 확인</p>
            <div className="text-sm space-y-1">
              <p>• <strong>목적:</strong> 느린 시작 앱 보호</p>
              <p>• <strong>실패 시:</strong> Pod 재시작</p>
              <p>• <strong>타이밍:</strong> Pod 시작 직후</p>
            </div>
            <div className="mt-3 p-2 bg-amber-500/10 rounded text-xs">
              Startup 성공 시 Liveness/Readiness 활성화
            </div>
          </div>
        </Card>

        <Card title="Liveness Probe" icon={<HeartPulse size={28} />} color="rose">
          <div className="space-y-3">
            <p className="font-semibold text-rose-300">데드락/교착 상태 감지</p>
            <div className="text-sm space-y-1">
              <p>• <strong>목적:</strong> 복구 불가능한 상태 감지</p>
              <p>• <strong>실패 시:</strong> 컨테이너 재시작</p>
              <p>• <strong>타이밍:</strong> Startup 성공 후</p>
            </div>
            <div className="mt-3 p-2 bg-rose-500/10 rounded text-xs">
              외부 의존성 포함 금지 (DB, Redis 등)
            </div>
          </div>
        </Card>

        <Card title="Readiness Probe" icon={<SignalHigh size={28} />} color="emerald">
          <div className="space-y-3">
            <p className="font-semibold text-emerald-300">트래픽 수신 준비 상태 확인</p>
            <div className="text-sm space-y-1">
              <p>• <strong>목적:</strong> 의존 서비스 연결 확인</p>
              <p>• <strong>실패 시:</strong> Endpoints 제거 (재시작 없음)</p>
              <p>• <strong>타이밍:</strong> Startup 성공 후</p>
            </div>
            <div className="mt-3 p-2 bg-emerald-500/10 rounded text-xs">
              외부 의존성 포함 가능 (DB, 캐시 등)
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
