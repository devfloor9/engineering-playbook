import { SlideWrapper, Card, Badge } from '@shared/components';
import { DollarSign, LineChart, Shield, TrendingDown } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">
        <Badge color="blue" size="lg" className="text-2xl px-4 py-2">도전과제 3</Badge>
      </h2>
      <h3 className="text-4xl font-bold mb-8 text-center text-blue-300">
        토큰/세션 수준 모니터링 및 비용 컨트롤
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <DollarSign className="w-10 h-10 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-2xl font-semibold mb-2 text-blue-300">핵심 문제</h4>
              <p className="text-lg text-gray-300">
                LLM 사용량 추적 및 비용 최적화가 어렵고, 세밀한 수준의 모니터링 부재
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <LineChart className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">토큰 추적</h4>
            <p className="text-sm text-gray-300">
              입력/출력 토큰 수, 모델별 사용량 실시간 추적
            </p>
          </Card>

          <Card className="p-5">
            <Shield className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">세션 모니터링</h4>
            <p className="text-sm text-gray-300">
              사용자/테넌트별 세션 추적 및 할당량 관리
            </p>
          </Card>

          <Card className="p-5">
            <TrendingDown className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">비용 최적화</h4>
            <p className="text-sm text-gray-300">
              Spot 인스턴스, Consolidation을 통한 비용 절감
            </p>
          </Card>
        </div>

        <Card color="blue" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-blue-300">관측성 플랫폼 필요</h4>
          <ul className="text-base text-gray-300 space-y-2">
            <li>• LangFuse/LangSmith: LLM 애플리케이션 전체 라이프사이클 추적</li>
            <li>• Prometheus + Grafana: 인프라 메트릭 및 대시보드</li>
            <li>• 테넌트별 비용 할당 및 청구 (Chargeback)</li>
            <li>• 실시간 경고 및 할당량 초과 방지</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
