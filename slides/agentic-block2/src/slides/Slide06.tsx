import { SlideWrapper, Card } from '@shared/components';
import { Shield, RotateCcw, Clock, AlertCircle } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-red-400">장애 대응</h2>
        <p className="text-xl text-gray-400 mb-6">폴백, 타임아웃, 재시도, 서킷 브레이커</p>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <Shield className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-blue-300">폴백 (Fallback)</h3>
            <p className="text-sm text-gray-400 mb-3">
              주 백엔드 장애 시 대체 백엔드로 자동 전환
            </p>
            <div className="bg-gray-800/50 p-3 rounded text-xs font-mono text-gray-300">
              <div className="text-blue-400">BackendLBPolicy:</div>
              <div className="ml-2">default:</div>
              <div className="ml-4">backendRef:</div>
              <div className="ml-6">name: vllm-fallback</div>
            </div>
          </Card>

          <Card className="p-6">
            <Clock className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-emerald-300">타임아웃</h3>
            <p className="text-sm text-gray-400 mb-3">
              추론 요청의 최대 대기 시간 설정
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span className="text-emerald-400">request:</span>
                <span>120s (전체 요청 처리)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">backendRequest:</span>
                <span>60s (백엔드 연결)</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <RotateCcw className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-purple-300">재시도 정책</h3>
            <p className="text-sm text-gray-400 mb-3">
              일시적 오류에 대한 자동 재시도
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• <span className="text-purple-400">numRetries:</span> 3</div>
              <div>• <span className="text-purple-400">retryOn:</span> 5xx, reset, connect-failure</div>
              <div>• <span className="text-purple-400">perTryTimeout:</span> 30s</div>
              <div>• <span className="text-purple-400">backoff:</span> 100ms ~ 1s (지수 백오프)</div>
            </div>
          </Card>

          <Card className="p-6">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-amber-300">서킷 브레이커</h3>
            <p className="text-sm text-gray-400 mb-3">
              연속 실패 시 백엔드를 일시적으로 차단
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• <span className="text-amber-400">consecutiveErrors:</span> 5</div>
              <div>• <span className="text-amber-400">interval:</span> 10s (차단 시간)</div>
              <div>• <span className="text-amber-400">maxConnections:</span> 1000</div>
              <div>• <span className="text-amber-400">maxPendingRequests:</span> 100</div>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
            <p className="text-xs text-red-300 font-semibold mb-1">타임아웃 주의</p>
            <p className="text-xs text-gray-400">LLM 추론은 시간이 오래 걸릴 수 있으므로 충분한 타임아웃 설정 필요</p>
          </div>
          <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
            <p className="text-xs text-amber-300 font-semibold mb-1">재시도 제한</p>
            <p className="text-xs text-gray-400">무한 재시도는 시스템 과부하를 유발할 수 있음</p>
          </div>
          <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
            <p className="text-xs text-purple-300 font-semibold mb-1">서킷 브레이커</p>
            <p className="text-xs text-gray-400">너무 민감한 설정은 정상 트래픽도 차단할 수 있음</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
