import { SlideWrapper, Card, Badge } from '@shared/components';
import { Route, TrendingUp, Shuffle, Network } from 'lucide-react';

export default function Slide05() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">
        <Badge className="bg-cyan-500/20 text-cyan-300 text-2xl px-4 py-2">도전과제 2</Badge>
      </h2>
      <h3 className="text-4xl font-bold mb-8 text-center text-cyan-300">
        Agentic AI 요청 동적 라우팅 및 스케일링
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Route className="w-10 h-10 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-2xl font-semibold mb-2 text-cyan-300">핵심 문제</h4>
              <p className="text-lg text-gray-300">
                다양한 AI 모델과 변동성 높은 트래픽에 대한 지능적 라우팅 및 자동 확장 필요
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Shuffle className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">멀티 모델 라우팅</h4>
            <p className="text-sm text-gray-400">
              GPT-4, Claude, Mixtral 등 다양한 모델로 요청 지능적 분배
            </p>
          </Card>

          <Card className="p-5">
            <TrendingUp className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">자동 스케일링</h4>
            <p className="text-sm text-gray-400">
              트래픽 패턴에 따른 Pod 및 노드 자동 확장/축소
            </p>
          </Card>

          <Card className="p-5">
            <Network className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">부하 분산</h4>
            <p className="text-sm text-gray-400">
              모델 인스턴스 간 균등한 부하 분산 및 Failover
            </p>
          </Card>
        </div>

        <Card className="p-6 bg-cyan-900/20 border-cyan-700">
          <h4 className="text-xl font-semibold mb-3 text-cyan-300">요구사항</h4>
          <ul className="text-base text-gray-400 space-y-2">
            <li>• 실시간 트래픽 모니터링 및 메트릭 기반 스케일링</li>
            <li>• 가중치 기반 라우팅 (Blue/Green, Canary 배포)</li>
            <li>• Rate Limiting 및 인증/인가 통합</li>
            <li>• End-to-End 자동화 (Pod ↔ Node 스케일링 연계)</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
