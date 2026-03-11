import { SlideWrapper, Card } from '@shared/components';
import { LineChart, Activity, BarChart3, AlertCircle } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-cyan-300">
        Observability Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        LangFuse + Prometheus + Grafana
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <LineChart className="w-10 h-10 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-cyan-300">역할: 전면적 관측성 및 모니터링</h3>
              <p className="text-lg text-gray-300">
                LLM 애플리케이션 추적, 인프라 메트릭 수집, 대시보드 및 알람 통합
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Activity className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">LangFuse</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• LLM 요청 전체 Trace</li>
              <li>• 토큰 사용량 추적</li>
              <li>• 비용 계산</li>
              <li>• 품질 평가</li>
            </ul>
          </Card>

          <Card className="p-5">
            <BarChart3 className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">Prometheus</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 인프라 메트릭 수집</li>
              <li>• GPU 메트릭 (DCGM)</li>
              <li>• ServiceMonitor 기반</li>
              <li>• 시계열 데이터 저장</li>
            </ul>
          </Card>

          <Card className="p-5">
            <AlertCircle className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">Grafana</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 대시보드 시각화</li>
              <li>• 알람 설정</li>
              <li>• 멀티 데이터소스</li>
              <li>• Slack/PagerDuty 통합</li>
            </ul>
          </Card>
        </div>

        <Card className="p-6 bg-cyan-900/20 border-cyan-700">
          <h4 className="text-xl font-semibold mb-3 text-cyan-300">핵심 대시보드</h4>
          <div className="grid grid-cols-2 gap-4 text-base text-gray-400">
            <div>
              <strong className="text-gray-300">Agent Overview:</strong>
              <p className="text-sm">에이전트별 요청 수, 지연 시간, 오류율</p>
            </div>
            <div>
              <strong className="text-gray-300">LLM Performance:</strong>
              <p className="text-sm">모델별 토큰 처리량, 추론 시간</p>
            </div>
            <div>
              <strong className="text-gray-300">Resource Usage:</strong>
              <p className="text-sm">CPU, 메모리, GPU 사용률</p>
            </div>
            <div>
              <strong className="text-gray-300">Cost Tracking:</strong>
              <p className="text-sm">테넌트별, 모델별 비용 추적</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
