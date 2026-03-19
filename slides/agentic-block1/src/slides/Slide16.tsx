import { SlideWrapper, Card } from '@shared/components';
import { LineChart, Activity, BarChart3, DollarSign } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-cyan-300">
        Observability Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Hybrid Observability (Langfuse + LangSmith)
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <LineChart className="w-10 h-10 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-cyan-300">환경별 최적화된 관측성 전략</h3>
              <p className="text-lg text-gray-300">
                Dev/Staging: LangSmith (LangGraph Studio 네이티브) | Production: Langfuse (데이터 주권)
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Activity className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">Langfuse (Production)</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Self-hosted, 데이터 주권 보장</li>
              <li>• LLM 요청 전체 Trace</li>
              <li>• 토큰 사용량 + 비용 추적</li>
              <li>• Bifrost → OpenTelemetry 통합</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Activity className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">LangSmith (Dev/Staging)</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• LangGraph Studio 네이티브 통합</li>
              <li>• 실시간 디버깅 및 평가</li>
              <li>• 프롬프트 버전 관리</li>
              <li>• SaaS 관리형</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <BarChart3 className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">GPU 메트릭</h4>
            <p className="text-sm text-gray-300">
              DCGM Exporter → AMP → AMG (GPU 사용률, 메모리, 온도)
            </p>
          </Card>

          <Card className="p-5">
            <DollarSign className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">비용 추적</h4>
            <p className="text-sm text-gray-300">
              Kubecost: Pod-level 비용 할당 및 리소스 최적화
            </p>
          </Card>

          <Card color="cyan" className="p-5">
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">알람</h4>
            <p className="text-sm text-gray-300">
              Grafana → Slack/PagerDuty 통합
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
