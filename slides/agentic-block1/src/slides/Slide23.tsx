import { SlideWrapper, Card } from '@shared/components';
import { RefreshCw, Zap, Shield, Rocket } from 'lucide-react';

export default function Slide23() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-emerald-300">
        무중단 운영 전략
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <RefreshCw className="w-10 h-10 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-emerald-300">Graceful Operations</h3>
              <p className="text-lg text-gray-300">
                Pod 재시작, 노드 교체, EKS 업그레이드 시 서비스 무중단 보장
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <RefreshCw className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-blue-300">Karpenter Consolidation</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• vLLM <code className="text-amber-300">--shutdown-timeout=240</code></li>
              <li>• llm-d drain-aware routing</li>
              <li>• PDB: <code className="text-amber-300">maxUnavailable=1</code></li>
              <li>• Disruption Budgets: nodes=1</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Zap className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-purple-300">EKS 업그레이드</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Blue/Green NodePool 전략</li>
              <li>• llm-d weight-based traffic shifting</li>
              <li>• 단계적 트래픽 이동 (10% → 50% → 100%)</li>
              <li>• Rollback 지점 확보</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Shield className="w-9 h-9 text-cyan-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-cyan-300">Long-running Sessions</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• AgentCore Runtime: microVM 세션 격리</li>
              <li>• 상태 저장 세션 보존</li>
              <li>• 자동 재연결 메커니즘</li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700">
            <Rocket className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-amber-300">Future: CRIU</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• GPU 메모리 스냅샷 기반 Live Migration</li>
              <li>• Checkpoint/Restore in Userspace</li>
              <li>• Zero-downtime 노드 교체</li>
            </ul>
          </Card>
        </div>

        <Card color="emerald" className="p-5">
          <h4 className="text-lg font-semibold mb-2 text-emerald-300">핵심: 사용자 경험 무중단</h4>
          <p className="text-base text-gray-300">
            인프라 변경 시 진행 중인 추론 요청은 완료 보장, 신규 요청은 새 노드로 자동 라우팅
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
