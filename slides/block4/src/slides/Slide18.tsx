import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-center">실전 HA 체크리스트</h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-emerald-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              인프라 레벨
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>3개 AZ에 걸쳐 노드 분산 (Karpenter)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>Spot + On-Demand 혼합 전략</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>Disruption Budget 설정 (20%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 flex-shrink-0">✓</span>
                <span>ARC Zonal Shift 활성화</span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-blue-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              애플리케이션 레벨
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✓</span>
                <span>Topology Spread Constraints (maxSkew: 1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✓</span>
                <span>PodDisruptionBudget (minAvailable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✓</span>
                <span>Liveness/Readiness Probe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✓</span>
                <span>Graceful Shutdown (preStop + 60s)</span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              서비스 메시 레벨
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span>Circuit Breaker (Istio DestinationRule)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span>Retry + Timeout 정책</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span>Locality-Aware 라우팅</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span>Outlier Detection (5xx 기반)</span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-amber-300 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              검증 & 테스트
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>Chaos Engineering 실험 (월 1회)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>AZ 장애 시뮬레이션</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>노드 Drain 테스트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>Failover 시간 측정</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
